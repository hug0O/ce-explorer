/**
 * Reads the Delphi files of the workspace for the project panel (SQL, unused code, form checks).
 *
 * It costs nothing until someone asks: no file watcher, nothing at start-up. A scan reads the files a few
 * at a time and gives the event loop back between two batches, can be cancelled, and keeps what it learned
 * of every file (by its date and size), so the next scan only reads what changed.
 */
import * as vscode from 'vscode';
import { FormIssue, checkForm } from './DelphiCheck';
import { SqlEntry, SqlIssue, sqlParamIssues, unitSql } from './ProjectSql';
import { UnitFacts, UnusedComponent, UnusedUnit, unitFacts, unusedComponents, unusedUnits } from './ProjectUnused';
import { GridIssue, NameRow, NamingIssue, TextGroup, TextRow, componentNames, formTexts, gridFieldIssues, groupTexts, namingIssuesOf } from './ProjectChecks';
import { Family, FormInfo, UnitMetrics, families, formInfo, unitMetrics } from './ProjectForms';

const EXCLUDE = '**/{node_modules,.git,dist,out,build,bin,obj,target,Win32,Win64,__history,__recovery,.vscode-test}/**';
const MAX_FILES = 6000;
const MAX_FILE_BYTES = 3_000_000;
/** How long a batch may keep the thread before it gives it back. */
const SLICE_MS = 12;

export interface SqlRow extends SqlEntry { file: string }
export interface FormRow { unit: string; file: string; issues: { severity: FormIssue['severity']; category: string; message: string; line: number; file: 'dfm' | 'pas' }[] }

export interface ProjectData {
    root: string;
    units: number;
    forms: number;
    sql: SqlRow[];
    sqlIssues: (SqlIssue & { path: string })[];
    unusedUnits: (UnusedUnit & { path: string })[];
    unusedComponents: (UnusedComponent & { path: string })[];
    formChecks: FormRow[];
    gridIssues: (GridIssue & { path: string })[];
    /** Texts of the forms, grouped by meaning (the first ones, with a few uses each). */
    texts: TextGroup[];
    textCount: number;
    naming: (NamingIssue & { path: string })[];
    families: Family[];
    metrics: { unit: string; path: string; metrics: UnitMetrics }[];
    ms: number;
    /** Files read this time / found in the cache. */
    read: number;
    cached: number;
    truncated: boolean;
}

interface UnitResult {
    name: string;
    facts?: UnitFacts;
    sql: SqlEntry[];
    sqlIssues: SqlIssue[];
    components: UnusedComponent[];
    checks: FormRow['issues'];
    grid: GridIssue[];
    texts: TextRow[];
    names: NameRow[];
    form?: FormInfo;
    metrics: UnitMetrics;
}

/** Most groups of texts and uses of a text that are sent to the page: the rest is counted, not listed. */
const MAX_TEXT_GROUPS = 1500;
const MAX_TEXT_USES = 12;

/** The convention of names asked for in the settings (`ce.delphi.namingPrefixes`: class → prefix). */
function explicitPrefixes(): Record<string, string> {
    try {
        const v = vscode.workspace.getConfiguration?.('ce.delphi')?.get<Record<string, unknown>>('namingPrefixes');
        const out: Record<string, string> = {};
        for (const [k, p] of Object.entries(v ?? {})) { if (typeof p === 'string' && /^[a-z]+$/i.test(p)) { out[k] = p; } }
        return out;
    } catch { return {}; }
}

interface Cached { signature: string; result: UnitResult }

const decoder = new TextDecoder('utf-8');
const tick = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

export class ProjectScanner {
    private readonly cache = new Map<string, Cached>();
    private running: Promise<ProjectData> | undefined;

    /** Forgets what was learned (after the options change, or on demand). */
    clear(): void { this.cache.clear(); }

    /** Scans, or joins the scan that is running. */
    scan(token?: vscode.CancellationToken, progress?: (done: number, total: number) => void): Promise<ProjectData> {
        if (!this.running) {
            this.running = this.run(token, progress).finally(() => { this.running = undefined; });
        }
        return this.running;
    }

    private async run(token?: vscode.CancellationToken, progress?: (done: number, total: number) => void): Promise<ProjectData> {
        const started = Date.now();
        const found = await vscode.workspace.findFiles('**/*.{pas,dfm}', EXCLUDE, MAX_FILES + 1);
        const truncated = found.length > MAX_FILES;
        const pas = found.slice(0, MAX_FILES).filter(u => /\.pas$/i.test(u.fsPath));
        const dfmByKey = new Map<string, vscode.Uri>();
        for (const u of found) { if (/\.dfm$/i.test(u.fsPath)) { dfmByKey.set(u.fsPath.toLowerCase().replace(/\.dfm$/, ''), u); } }

        const results: { path: string; dfmPath?: string; result: UnitResult }[] = [];
        let read = 0;
        let cached = 0;
        let sliceStart = Date.now();
        for (let i = 0; i < pas.length; i++) {
            if (token?.isCancellationRequested) { break; }
            const uri = pas[i];
            const dfmUri = dfmByKey.get(uri.fsPath.toLowerCase().replace(/\.pas$/, ''));
            try {
                const [ps, ds] = await Promise.all([vscode.workspace.fs.stat(uri), dfmUri ? vscode.workspace.fs.stat(dfmUri) : Promise.resolve(undefined)]);
                if (ps.size > MAX_FILE_BYTES || (ds && ds.size > MAX_FILE_BYTES)) { continue; }
                const signature = `${ps.mtime}:${ps.size}|${ds ? ds.mtime + ':' + ds.size : ''}`;
                const hit = this.cache.get(uri.fsPath);
                if (hit && hit.signature === signature) {
                    cached++;
                    results.push({ path: uri.fsPath, dfmPath: dfmUri?.fsPath, result: hit.result });
                } else {
                    const text = decoder.decode(await vscode.workspace.fs.readFile(uri)).replace(/^\uFEFF/, '');
                    const dtext = dfmUri ? decoder.decode(await vscode.workspace.fs.readFile(dfmUri)).replace(/^\uFEFF/, '') : undefined;
                    const result = analyse(uri.fsPath, text, dtext && /^\s*(object|inherited|inline)\b/i.test(dtext) ? dtext : undefined);
                    this.cache.set(uri.fsPath, { signature, result });
                    read++;
                    results.push({ path: uri.fsPath, dfmPath: dfmUri?.fsPath, result });
                }
            } catch { /* an unreadable file is left out */ }
            progress?.(i + 1, pas.length);
            if (Date.now() - sliceStart > SLICE_MS) { await tick(); sliceStart = Date.now(); }
        }
        // files that disappeared
        const live = new Set(pas.map(u => u.fsPath));
        for (const k of this.cache.keys()) { if (!live.has(k)) { this.cache.delete(k); } }

        const withFacts = results.filter(r => r.result.facts).map(r => ({ facts: r.result.facts!, path: r.path }));
        const pathOf = new Map(withFacts.map(r => [r.facts.name, r.path]));
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
        const allTexts = results.flatMap(r => r.result.texts);
        const groups = groupTexts(allTexts);
        const dfmOf = new Map(results.filter(r => r.dfmPath).map(r => [r.result.name, r.dfmPath!]));
        return {
            root,
            units: results.length,
            forms: results.filter(r => r.dfmPath).length,
            sql: results.flatMap(r => r.result.sql.map(e => ({ ...e, file: e.source === 'dfm' ? r.dfmPath ?? r.path : r.path }))),
            sqlIssues: results.flatMap(r => r.result.sqlIssues.map(i => ({ ...i, path: i.file === 'dfm' ? r.dfmPath ?? r.path : r.path }))),
            unusedUnits: unusedUnits(withFacts).map(u => ({ ...u, path: pathOf.get(u.unit) ?? '' })),
            unusedComponents: results.flatMap(r => r.result.components.map(c => ({ ...c, path: r.dfmPath ?? r.path }))),
            formChecks: results.filter(r => r.result.checks.length).map(r => ({ unit: r.result.name, file: r.path, issues: r.result.checks })),
            gridIssues: results.flatMap(r => r.result.grid.map(g => ({ ...g, path: r.dfmPath ?? r.path }))),
            texts: groups.slice(0, MAX_TEXT_GROUPS).map(g => ({ ...g, rows: g.rows.slice(0, MAX_TEXT_USES) })),
            textCount: allTexts.length,
            naming: namingIssuesOf(results.filter(r => r.dfmPath).map(r => ({ unit: r.result.name, names: r.result.names })), explicitPrefixes())
                .map(n => ({ ...n, path: dfmOf.get(n.unit) ?? '' })),
            families: families(results.flatMap(r => (r.result.form ? [r.result.form] : [])), withFacts.map(r => r.facts)),
            metrics: results.map(r => ({ unit: r.result.name, path: r.path, metrics: r.result.metrics })),
            ms: Date.now() - started,
            read, cached, truncated,
        };
    }
}

/** Everything a unit tells on its own: the part of the work that does not depend on the other units. */
function analyse(file: string, pas: string, dfm: string | undefined): UnitResult {
    const name = file.split(/[\\/]/).pop()!.replace(/\.pas$/i, '');
    const facts = unitFacts(pas);
    const result: UnitResult = { name: facts?.name ?? name, facts, sql: [], sqlIssues: [], components: [], checks: [], grid: [], texts: [], names: [], metrics: unitMetrics(pas) };
    result.sql = unitSql(result.name, pas, dfm);
    if (dfm) {
        result.grid = gridFieldIssues(result.name, dfm);
        result.texts = formTexts(result.name, dfm);
        result.names = componentNames(dfm);
        result.form = formInfo(result.name, facts, dfm);
        result.sqlIssues = sqlParamIssues(result.name, pas, dfm);
        result.components = unusedComponents(result.name, pas, dfm);
        try {
            result.checks = checkForm(pas, dfm).filter(i => i.severity !== 'info').map(i => ({ severity: i.severity, category: i.category, message: i.message, line: i.line, file: i.file }));
        } catch { /* a form that cannot be checked is not reported */ }
    }
    return result;
}
