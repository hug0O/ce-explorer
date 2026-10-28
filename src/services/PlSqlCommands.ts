import * as vscode from 'vscode';
import type { ProviderRegistry } from '../providers/ProviderRegistry';
import { EditPipeline } from './EditPipeline';
import type { WorkspaceIndex } from './WorkspaceIndex';
import { PlMember, PlUnit, parsePlSqlUnits } from '../utils/plsqlParse';
import { lineStartsOf } from '../utils/plsqlScan';
import { findNameHits } from '../utils/plsqlReferences';
import {
    TextChange, addStubToBody, addToSpec, compareUnits, findPair, updateBodyFromSpec, updateSpecFromBody, SyncDiff,
} from '../utils/plsqlSync';
import {
    ColumnDef, ProcSpec, SQL_KINDS, SqlKind, exceptionBlock, generatePackage, parseParamInput, parseSubstitutions,
    plDocHeader, sqlStatements, updatePlDoc, utplsqlTests,
} from '../utils/plsqlGen';
import { planExtractProcedure } from '../utils/plsqlExtract';
import { applyAlignPreset } from '../utils/plsqlAlign';

const SPEC_EXTS = ['.pks', '.pkh', '.spc', '.sql', '.pck', '.pls'];
const BODY_EXTS = ['.pkb', '.bdy', '.sql', '.pck', '.plb'];

let registry: ProviderRegistry | undefined;
let index: WorkspaceIndex | undefined;

export function setPlSqlContext(r: ProviderRegistry, i: WorkspaceIndex): void {
    registry = r;
    index = i;
}

/** The active editor when it holds PL/SQL (by extension, or a .txt/.sql that really contains it). */
function plsqlEditor(): vscode.TextEditor | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('CE: Open a PL/SQL file first.');
        return undefined;
    }
    const provider = registry?.getByDocument(editor.document);
    if (!provider || provider.languageId !== 'plsql') {
        vscode.window.showWarningMessage('CE: This file does not look like PL/SQL (.pks .pkb .sql, or a .txt containing SQL).');
        return undefined;
    }
    return editor;
}

function toPipeline(pipeline: EditPipeline, doc: vscode.TextDocument, changes: TextChange[]): void {
    for (const c of changes) {
        const start = doc.positionAt(c.offset);
        if (c.length) { pipeline.replace(doc.uri, new vscode.Range(start, doc.positionAt(c.offset + c.length)), c.text); }
        else { pipeline.insert(doc.uri, start, c.text); }
    }
}

async function exists(uri: vscode.Uri): Promise<boolean> {
    try { await vscode.workspace.fs.stat(uri); return true; } catch { return false; }
}

/* ─────────────── spec / body synchronisation ─────────────── */

interface LoadedPair {
    specDoc: vscode.TextDocument;
    bodyDoc: vscode.TextDocument;
    specUnit: PlUnit;
    bodyUnit: PlUnit;
}

/** Finds the spec and body of the package under the cursor: same file, or the sibling .pks / .pkb. */
async function loadPair(doc: vscode.TextDocument): Promise<LoadedPair | undefined> {
    const units = parsePlSqlUnits(doc.getText());
    const here = units.find(u => (u.kind === 'package' || u.kind === 'package body')
        && (vscode.window.activeTextEditor?.selection.active.line ?? 0) >= u.startLine
        && (vscode.window.activeTextEditor?.selection.active.line ?? 0) <= u.endLine) ?? units.find(u => u.kind === 'package' || u.kind === 'package body');
    if (!here) {
        vscode.window.showWarningMessage('CE: No PACKAGE or PACKAGE BODY found in this file.');
        return undefined;
    }
    const wantSpec = here.kind === 'package body';
    const own = findPair(doc.getText(), doc.getText(), here.name);
    if (own.specUnit && own.bodyUnit) { return { specDoc: doc, bodyDoc: doc, specUnit: own.specUnit, bodyUnit: own.bodyUnit }; }

    const m = doc.uri.fsPath.match(/^(.*)(\.[^.\\/]+)$/);
    if (!m) { return undefined; }
    for (const ext of wantSpec ? SPEC_EXTS : BODY_EXTS) {
        if (ext.toLowerCase() === m[2].toLowerCase()) { continue; }
        for (const candidate of [m[1] + ext, m[1] + ext.toUpperCase()]) {
            const uri = vscode.Uri.file(candidate);
            if (!await exists(uri)) { continue; }
            const other = await vscode.workspace.openTextDocument(uri);
            const pair = wantSpec ? findPair(other.getText(), doc.getText(), here.name) : findPair(doc.getText(), other.getText(), here.name);
            if (pair.specUnit && pair.bodyUnit) {
                return wantSpec
                    ? { specDoc: other, bodyDoc: doc, specUnit: pair.specUnit, bodyUnit: pair.bodyUnit }
                    : { specDoc: doc, bodyDoc: other, specUnit: pair.specUnit, bodyUnit: pair.bodyUnit };
            }
        }
    }
    vscode.window.showWarningMessage(`CE: Could not find the ${wantSpec ? 'spec (.pks)' : 'body (.pkb)'} of ${here.name} next to this file.`);
    return undefined;
}

interface SyncItem extends vscode.QuickPickItem { diff: SyncDiff; action: 'addToSpec' | 'addStub' | 'specFromBody' | 'bodyFromSpec' }

export async function syncPackage(): Promise<void> {
    const editor = plsqlEditor();
    if (!editor) { return; }
    const pair = await loadPair(editor.document);
    if (!pair) { return; }
    const diffs = compareUnits(pair.specUnit, pair.bodyUnit);
    if (diffs.length === 0) {
        vscode.window.showInformationMessage(`CE: Spec and body of ${pair.specUnit.name} are in sync.`);
        return;
    }
    const items: SyncItem[] = [];
    for (const d of diffs) {
        if (d.kind === 'missingInSpec') { items.push({ label: `$(add) Declare ${d.name} in the spec`, description: 'body only (private)', detail: d.message, diff: d, action: 'addToSpec', picked: false }); }
        else if (d.kind === 'missingInBody') { items.push({ label: `$(add) Create an empty ${d.name} in the body`, description: 'spec only', detail: d.message, diff: d, action: 'addStub', picked: true }); }
        else {
            items.push({ label: `$(arrow-up) Spec of ${d.name} ← body signature`, description: 'signature mismatch', detail: d.message, diff: d, action: 'specFromBody', picked: true });
            items.push({ label: `$(arrow-down) Body of ${d.name} ← spec signature`, description: 'signature mismatch', detail: d.message, diff: d, action: 'bodyFromSpec', picked: false });
        }
    }
    const picked = await vscode.window.showQuickPick(items, {
        canPickMany: true, title: `CE: Synchronize ${pair.specUnit.name} (spec ⇄ body)`, placeHolder: 'Choose the fixes to apply',
    });
    if (!picked || picked.length === 0) { return; }

    const specChanges: TextChange[] = [];
    const bodyChanges: TextChange[] = [];
    const done = new Set<string>();
    for (const it of picked) {
        if (done.has(it.diff.id)) { continue; }
        done.add(it.diff.id);
        const specText = pair.specDoc.getText();
        const bodyText = pair.bodyDoc.getText();
        if (it.action === 'addToSpec' && it.diff.body) { specChanges.push(addToSpec(specText, pair.specUnit, it.diff.body)); }
        if (it.action === 'addStub' && it.diff.spec) { bodyChanges.push(addStubToBody(bodyText, pair.bodyUnit, it.diff.spec)); }
        if (it.action === 'specFromBody' && it.diff.spec && it.diff.body) { specChanges.push(updateSpecFromBody(it.diff.spec, it.diff.body)); }
        if (it.action === 'bodyFromSpec' && it.diff.spec && it.diff.body) { bodyChanges.push(updateBodyFromSpec(it.diff.body, it.diff.spec)); }
    }
    const pipeline = new EditPipeline();
    pipeline.recordOriginal(pair.specDoc.uri, pair.specDoc.getText());
    if (pair.bodyDoc !== pair.specDoc) { pipeline.recordOriginal(pair.bodyDoc.uri, pair.bodyDoc.getText()); }
    toPipeline(pipeline, pair.specDoc, specChanges);
    toPipeline(pipeline, pair.bodyDoc, bodyChanges);
    if (await pipeline.apply(`Synchronize ${pair.specUnit.name}`)) {
        vscode.window.showInformationMessage(`CE: ${done.size} fix(es) applied to ${pair.specUnit.name}.`);
    }
}

/* ─────────────── generators ─────────────── */

async function openGenerated(content: string): Promise<void> {
    const doc = await vscode.workspace.openTextDocument({ content, language: 'sql' });
    await vscode.window.showTextDocument(doc, { preview: false });
}

/** "get_total(p_id NUMBER):NUMBER; reset; log(p_msg IN VARCHAR2)" → subprogram specs. */
export function parseSubprogramList(input: string): ProcSpec[] {
    return input.split(';').map(s => s.trim()).filter(Boolean).map(seg => {
        const m = seg.match(/^([A-Za-z_][\w$#]*)\s*(?:\(([\s\S]*)\))?\s*(?::\s*([\w$#.%()]+))?$/);
        if (!m) { return { kind: 'procedure' as const, name: seg.replace(/\W+/g, '_'), params: [] }; }
        return m[3]
            ? { kind: 'function' as const, name: m[1], params: parseParamInput(m[2] ?? ''), returns: m[3] }
            : { kind: 'procedure' as const, name: m[1], params: parseParamInput(m[2] ?? '') };
    });
}

function headerOptions(): { author?: string; date: string } {
    const author = vscode.workspace.getConfiguration('ce').get<string>('plsql.author') || process.env.USERNAME || process.env.USER || undefined;
    return { author, date: new Date().toISOString().slice(0, 10) };
}

export async function newPackage(): Promise<void> {
    const name = await vscode.window.showInputBox({ title: 'CE: New package', prompt: 'Package name', value: 'pkg_', validateInput: v => /^[A-Za-z_][\w$#.]*$/.test(v) ? null : 'Not a valid package name' });
    if (!name) { return; }
    const list = await vscode.window.showInputBox({
        title: `CE: Subprograms of ${name}`,
        prompt: 'name(params):ReturnType separated by ;   e.g.  get_total(p_id NUMBER):NUMBER; reset; log(p_msg IN VARCHAR2)',
        value: '',
    });
    if (list === undefined) { return; }
    const procs = parseSubprogramList(list);
    const { spec, body } = generatePackage(name, procs, headerOptions());
    await openGenerated(spec + '\n' + body);
}

/** The CREATE TABLE of the selection, of the table under the cursor, of the file, or of the clipboard. */
async function tableFromContext(): Promise<PlUnit | undefined> {
    const editor = vscode.window.activeTextEditor;
    let ddl = editor && !editor.selection.isEmpty ? editor.document.getText(editor.selection) : '';
    if (!ddl && editor) {
        const tables = parsePlSqlUnits(editor.document.getText()).filter(u => u.kind === 'table');
        const line = editor.selection.active.line;
        const at = tables.find(t => line >= t.startLine && line <= t.endLine) ?? (tables.length === 1 ? tables[0] : undefined);
        if (at) { ddl = editor.document.getText().slice(at.startOffset, at.endOffset); }
        else if (tables.length > 1) {
            const pick = await vscode.window.showQuickPick(tables.map(t => ({ label: t.name, t })), { title: 'CE: Which table?' });
            if (!pick) { return undefined; }
            ddl = editor.document.getText().slice(pick.t.startOffset, pick.t.endOffset);
        }
    }
    if (!ddl) { ddl = await vscode.env.clipboard.readText(); }
    const table = parsePlSqlUnits(ddl).find(u => u.kind === 'table');
    if (!table) { vscode.window.showWarningMessage('CE: Select a CREATE TABLE statement (or copy it to the clipboard) first.'); }
    return table;
}

function columnsOf(table: PlUnit): ColumnDef[] {
    return table.members.map(c => ({ name: c.name, type: c.type ?? 'VARCHAR2', nullable: c.column?.nullable ?? true, primaryKey: c.column?.primaryKey ?? false }));
}

interface SqlKindItem extends vscode.QuickPickItem { sqlKind: SqlKind }

/** SELECT / INSERT / UPDATE (default) / DELETE / MERGE statements for a table, with values replaced by parameters. */
export async function sqlFromTable(): Promise<void> {
    const table = await tableFromContext();
    if (!table) { return; }
    const kinds = await vscode.window.showQuickPick<SqlKindItem>(
        SQL_KINDS.map(k => ({ label: k.toUpperCase(), sqlKind: k, picked: k === 'select' || k === 'insert' || k === 'update' })),
        { canPickMany: true, title: `CE: SQL for ${table.name}`, placeHolder: 'Statements to generate' },
    );
    if (!kinds || kinds.length === 0) { return; }
    const columns = columnsOf(table);
    const input = await vscode.window.showInputBox({
        title: `CE: Replace values in ${table.name} (optional)`,
        prompt: 'column=value separated by ;  e.g.  updated_at=SYSDATE; status=:p_status; total=:p_total * 1.2',
        placeHolder: 'empty: every value is a :column bind variable',
    });
    if (input === undefined) { return; }
    const subs = parseSubstitutions(input, columns.map(c => c.name));
    if ('error' in subs) { vscode.window.showWarningMessage('CE: ' + subs.error); return; }
    const result = sqlStatements(table.name, columns, table.primaryKey ?? [], kinds.map(k => k.sqlKind), subs.values);
    if ('error' in result) { vscode.window.showWarningMessage('CE: ' + result.error); return; }
    const doc = await vscode.workspace.openTextDocument({ content: result.sql, language: 'sql' });
    await vscode.window.showTextDocument(doc, { preview: false });
}

export async function utplsqlFromSpec(): Promise<void> {
    const editor = plsqlEditor();
    if (!editor) { return; }
    let spec = parsePlSqlUnits(editor.document.getText()).find(u => u.kind === 'package');
    if (!spec) {
        const pair = await loadPair(editor.document);
        spec = pair?.specUnit;
    }
    if (!spec) { vscode.window.showWarningMessage('CE: utPLSQL tests are generated from a package spec.'); return; }
    const { spec: s, body } = utplsqlTests(spec);
    await openGenerated(s + '\n' + body);
}

/** Subprogram of the active file containing `line` (package members, stand-alone, triggers, blocks). */
function memberAt(doc: vscode.TextDocument, line: number): { unit: PlUnit; member: PlMember } | undefined {
    for (const unit of parsePlSqlUnits(doc.getText())) {
        for (const member of unit.members) {
            if ((member.kind === 'procedure' || member.kind === 'function') && line >= member.startLine && line <= member.endLine) { return { unit, member }; }
        }
    }
    return undefined;
}

export async function insertExceptionBlock(): Promise<void> {
    const editor = plsqlEditor();
    if (!editor) { return; }
    const at = memberAt(editor.document, editor.selection.active.line);
    if (!at || at.member.isDeclaration) { vscode.window.showWarningMessage('CE: Place the cursor inside a procedure or function body.'); return; }
    const lines = editor.document.getText().split(/\r?\n/);
    const body = lines.slice(at.member.beginLine ?? at.member.startLine, at.member.endLine).join('\n');
    if (/^\s*exception\b/im.test(body.replace(/--.*$/gm, ''))) {
        vscode.window.showInformationMessage(`CE: ${at.member.name} already has an EXCEPTION section.`);
        return;
    }
    const endLineText = lines[at.member.endLine] ?? '';
    const indent = (endLineText.match(/^\s*/) ?? [''])[0];
    const edit = new vscode.WorkspaceEdit();
    edit.insert(editor.document.uri, new vscode.Position(at.member.endLine, 0), exceptionBlock(indent));
    await vscode.workspace.applyEdit(edit);
}

/** PLDoc header above a subprogram, or its refresh when one already exists. */
export async function insertPlDocHeader(doc: vscode.TextDocument, member: { name: string; startLine: number }): Promise<boolean> {
    const found = parsePlSqlUnits(doc.getText()).flatMap(u => u.members).find(m => m.name === member.name && m.startLine === member.startLine)
        ?? parsePlSqlUnits(doc.getText()).flatMap(u => u.members).find(m => m.name === member.name);
    if (!found) { return false; }
    const lines = doc.getText().split(/\r?\n/);
    const indent = (lines[found.startLine].match(/^\s*/) ?? [''])[0];
    // Existing /** … */ block just above (blank lines allowed)?
    let end = found.startLine - 1;
    while (end >= 0 && !lines[end].trim()) { end--; }
    let start = -1;
    if (end >= 0 && lines[end].trim().endsWith('*/')) {
        for (let k = end; k >= 0; k--) { if (lines[k].trim().startsWith('/**')) { start = k; break; } if (lines[k].trim().startsWith('/*') || k < end - 60) { break; } }
    }
    const edit = new vscode.WorkspaceEdit();
    if (start >= 0) {
        const block = lines.slice(start, end + 1).join('\n');
        edit.replace(doc.uri, new vscode.Range(start, 0, end + 1, 0), updatePlDoc(block, found, indent));
    } else {
        edit.insert(doc.uri, new vscode.Position(found.startLine, 0), plDocHeader(found, headerOptions(), indent));
    }
    return vscode.workspace.applyEdit(edit);
}

export async function extractProcedure(): Promise<void> {
    const editor = plsqlEditor();
    if (!editor) { return; }
    if (editor.selection.isEmpty) { vscode.window.showWarningMessage('CE: Select the statements to extract into a procedure.'); return; }
    const doc = editor.document;
    const at = memberAt(doc, editor.selection.start.line);
    if (!at) { vscode.window.showWarningMessage('CE: The selection is not inside a procedure or function.'); return; }
    const name = await vscode.window.showInputBox({ title: 'CE: Extract procedure', prompt: 'Name of the new procedure', value: 'extracted_' + at.member.name, validateInput: v => /^[A-Za-z_][\w$#]*$/.test(v) ? null : 'Not a valid name' });
    if (!name) { return; }
    const text = doc.getText();
    const starts = lineStartsOf(text);
    const plan = planExtractProcedure({
        text, member: at.member, name,
        selStart: doc.offsetAt(editor.selection.start), selEnd: doc.offsetAt(editor.selection.end),
        memberLineStart: starts[at.member.startLine],
    });
    if ('error' in plan) { vscode.window.showWarningMessage('CE: ' + plan.error); return; }
    const pipeline = new EditPipeline();
    pipeline.recordOriginal(doc.uri, text);
    toPipeline(pipeline, doc, plan.changes);
    if (await pipeline.apply(`Extract ${name}`)) {
        vscode.window.showInformationMessage(`CE: ${name}(${plan.params.map(p => p.split(' ')[0]).join(', ')}) extracted${plan.movedLocals.length ? `; ${plan.movedLocals.join(', ')} moved into it` : ''}.`);
    }
}

/** Aligns the selected lines (or the contiguous block around the cursor) with a PL/SQL preset. */
export async function alignPreset(id: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showWarningMessage('CE: Open a file and select the lines to align.'); return; }
    const doc = editor.document;
    let start = editor.selection.start.line;
    let end = editor.selection.end.line;
    if (editor.selection.isEmpty) {
        const needles: Record<string, RegExp> = { params: /^\s*[A-Za-z_]\w*\s+(in|out)\b/i, assign: /:=/, arrow: /=>/, comment: /--/, alias: /\sas\s/i, values: /^\s*[A-Za-z_]\w*\s+\w+.*;/ };
        const re = needles[id] ?? /\S/;
        if (!re.test(doc.lineAt(start).text)) { vscode.window.showInformationMessage('CE: Select the lines to align.'); return; }
        while (start > 0 && re.test(doc.lineAt(start - 1).text)) { start--; }
        while (end < doc.lineCount - 1 && re.test(doc.lineAt(end + 1).text)) { end++; }
    } else if (editor.selection.end.character === 0 && end > start) { end--; }
    const lines: string[] = [];
    for (let l = start; l <= end; l++) { lines.push(doc.lineAt(l).text); }
    const tab = typeof editor.options.tabSize === 'number' ? editor.options.tabSize : 4;
    const result = applyAlignPreset(id, lines, tab);
    if (result.aligned < 2) { vscode.window.showInformationMessage('CE: Fewer than two matching lines — nothing to align.'); return; }
    if (result.lines.every((l, i) => l === lines[i])) { vscode.window.showInformationMessage('CE: Already aligned.'); return; }
    const eol = doc.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
    await editor.edit(b => b.replace(new vscode.Range(start, 0, end, doc.lineAt(end).text.length), result.lines.join(eol)));
}

/* ─────────────── navigation: definitions and callers across the workspace ─────────────── */

function wordWithQualifier(doc: vscode.TextDocument, pos: vscode.Position): { name: string; qualifier?: string } | undefined {
    const range = doc.getWordRangeAtPosition(pos, /[A-Za-z_][\w$#]*(?:\.[A-Za-z_][\w$#]*)*/);
    if (!range) { return undefined; }
    const parts = doc.getText(range).split('.');
    // Cursor on the first segment of pkg.proc → the package; otherwise the last segment is the member.
    const col = pos.character - range.start.character;
    let offset = 0;
    let hit = parts.length - 1;
    for (let i = 0; i < parts.length; i++) {
        if (col <= offset + parts[i].length) { hit = i; break; }
        offset += parts[i].length + 1;
    }
    if (hit === 0 && parts.length > 1) { return { name: parts[0] }; }
    return { name: parts[hit], qualifier: hit > 0 ? parts[hit - 1] : undefined };
}

export class PlSqlDefinitionProvider implements vscode.DefinitionProvider {
    async provideDefinition(doc: vscode.TextDocument, pos: vscode.Position): Promise<vscode.Definition | undefined> {
        if (!index || registry?.getByDocument(doc)?.languageId !== 'plsql') { return undefined; }
        const w = wordWithQualifier(doc, pos);
        if (!w) { return undefined; }
        await index.ensureBuilt();
        const all = index.allSymbols();
        const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
        const wanted = all.filter(s => same(s.name, w.name)
            && (w.qualifier ? same(s.container, w.qualifier) : true)
            && s.kind !== 'field' && s.kind !== 'variable');
        // Unqualified call: prefer the current package, then anything.
        const local = wanted.filter(s => s.uri.toString() === doc.uri.toString());
        const chosen = (w.qualifier ? wanted : (local.length ? local : wanted)).filter(s => !(s.uri.toString() === doc.uri.toString() && s.line === pos.line));
        return chosen.map(s => new vscode.Location(s.uri, new vscode.Position(s.line, 0)));
    }
}

/** Files read at once when searching the workspace: enough to keep the disk busy, few enough to keep memory small. */
const REFERENCE_BATCH = 16;

export class PlSqlReferenceProvider implements vscode.ReferenceProvider {
    async provideReferences(doc: vscode.TextDocument, pos: vscode.Position): Promise<vscode.Location[]> {
        if (!registry || registry.getByDocument(doc)?.languageId !== 'plsql') { return []; }
        const w = wordWithQualifier(doc, pos);
        if (!w) { return []; }
        const provider = registry.getByDocument(doc)!;
        const out: vscode.Location[] = [];
        const here = doc.uri.toString();
        const collect = (uri: vscode.Uri, text: string): void => {
            for (const h of findNameHits(text, w.name, w.qualifier)) {
                out.push(new vscode.Location(uri, new vscode.Range(h.line, h.col, h.line, h.col + w.name.length)));
            }
        };
        // The current document first, as it is in the editor (unsaved changes included).
        collect(doc.uri, doc.getText());

        const exts = provider.fileExtensions.map(e => e.replace(/^\./, '').toLowerCase());
        const pattern = `**/*.{${exts.join(',')}}`;
        const uris = (await vscode.workspace.findFiles(pattern, '**/{node_modules,.git,dist,out,build,bin,obj,target,.vscode-test}/**', 5000))
            .filter(u => u.toString() !== here);
        for (let i = 0; i < uris.length; i += REFERENCE_BATCH) {
            const batch = uris.slice(i, i + REFERENCE_BATCH);
            const texts = await Promise.all(batch.map(async uri => {
                try { return { uri, text: new TextDecoder('utf-8').decode(await vscode.workspace.fs.readFile(uri)) }; } catch { return undefined; }
            }));
            for (const t of texts) {
                if (!t || !registry.acceptsText(t.uri.fsPath, t.text)) { continue; }
                collect(t.uri, t.text);
            }
        }
        return out;
    }
}

export function plsqlSelectors(r: ProviderRegistry): vscode.DocumentFilter[] {
    return r.getAllProviders().filter(p => p.languageId === 'plsql').flatMap(p => p.fileExtensions.map(e => ({ scheme: 'file', pattern: '**/*' + e })));
}

