import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { randomBytes } from 'crypto';
import { diffDfm } from '../services/DfmDiff';
import { TextEdit, normalizeEdits } from '../services/DelphiForm';
import { renameEdits } from '../services/DesignerModel';
import { churnFromLog, hotspots } from '../services/ProjectForms';
import { textsCsv } from '../services/ProjectChecks';
import { ProjectData, ProjectScanner } from '../services/ProjectScanner';
import { ProjectTab, projectHtml } from './projectHtml';

/** A git reference as the user may write it: a branch, a tag, a commit, HEAD~2. Never an option. */
const SAFE_REF = /^[\w][\w./~^@{}-]*$/;

/** The content of a file at a version, with `git show ref:./name` run in its folder. */
export function gitShow(file: string, ref: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!SAFE_REF.test(ref)) { reject(new Error(`"${ref}" is not a version git can read.`)); return; }
        execFile('git', ['show', `${ref}:./${path.basename(file)}`], { cwd: path.dirname(file), maxBuffer: 40 * 1024 * 1024, windowsHide: true, encoding: 'utf8' }, (err, stdout, stderr) => {
            if (err) { reject(new Error((stderr || err.message).trim().split('\n')[0])); } else { resolve(stdout.replace(/^\uFEFF/, '')); }
        });
    });
}

/** Commits per file over the last year, in one run of git: keyed by the lower-cased absolute path. */
export function gitChurn(folder: string): Promise<Map<string, number>> {
    return new Promise((resolve, reject) => {
        execFile('git', ['rev-parse', '--show-toplevel'], { cwd: folder, windowsHide: true, encoding: 'utf8' }, (err, top) => {
            if (err) { reject(new Error('This folder is not in a git repository.')); return; }
            execFile('git', ['log', '--since=1 year ago', '--name-only', '--pretty=format:---', '--', '*.pas', '*.dfm'], { cwd: folder, maxBuffer: 80 * 1024 * 1024, windowsHide: true, encoding: 'utf8' }, (e, out) => {
                if (e) { reject(new Error('git log failed.')); } else { resolve(churnFromLog(out, top.trim())); }
            });
        });
    });
}

/** The .dfm of the file in the active editor: itself, or the one next to a .pas. */
export function activeDfm(doc: vscode.TextDocument | undefined): string | undefined {
    if (!doc) { return undefined; }
    const p = doc.uri.fsPath;
    const dfm = /\.dfm$/i.test(p) ? p : /\.pas$/i.test(p) ? p.replace(/\.pas$/i, '.dfm') : undefined;
    return dfm && fs.existsSync(dfm) ? dfm : undefined;
}

export class ProjectPanel {
    private static current: ProjectPanel | undefined;
    private readonly known = new Set<string>();
    private readonly disposables: vscode.Disposable[] = [];
    private cancel: vscode.CancellationTokenSource | undefined;
    /** The last form that was in an editor: the panel itself has the focus when it is asked to compare. */
    private lastForm: vscode.TextDocument | undefined;
    private data: ProjectData | undefined;

    static show(scanner: ProjectScanner, tab?: ProjectTab, then?: (p: ProjectPanel) => void): ProjectPanel {
        if (ProjectPanel.current) {
            ProjectPanel.current.panel.reveal(undefined, true);
            if (tab) { ProjectPanel.current.post({ type: 'tab', tab }); }
            then?.(ProjectPanel.current);
            return ProjectPanel.current;
        }
        const panel = vscode.window.createWebviewPanel('ceProject', 'CE Project', { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, { enableScripts: true, retainContextWhenHidden: true });
        ProjectPanel.current = new ProjectPanel(panel, scanner, tab, then);
        return ProjectPanel.current;
    }

    private constructor(private readonly panel: vscode.WebviewPanel, private readonly scanner: ProjectScanner, private readonly tab?: ProjectTab, private readonly then?: (p: ProjectPanel) => void) {
        panel.webview.html = projectHtml(randomBytes(16).toString('base64'));
        const remember = (doc?: vscode.TextDocument): void => { if (activeDfm(doc)) { this.lastForm = doc; } };
        remember(vscode.window.activeTextEditor?.document);
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(e => remember(e?.document)),
            panel.webview.onDidReceiveMessage(m => void this.onMessage(m)),
            panel.onDidDispose(() => this.dispose()),
        );
    }

    private dispose(): void {
        this.cancel?.cancel();
        ProjectPanel.current = undefined;
        this.disposables.forEach(d => d.dispose());
    }

    private post(msg: unknown): void { void this.panel.webview.postMessage(msg); }

    private async onMessage(m: { type?: string; file?: string; line?: number; ref?: string; from?: string; to?: string; items?: { from?: string; to?: string }[] }): Promise<void> {
        switch (m.type) {
            case 'ready':
                if (this.tab) { this.post({ type: 'tab', tab: this.tab }); }
                this.then?.(this);
                break;
            case 'scan': await this.scan(); break;
            case 'open': await this.open(m.file, m.line); break;
            case 'diff': await this.compare(typeof m.ref === 'string' && m.ref.trim() ? m.ref.trim() : 'HEAD'); break;
            case 'rename': await this.rename(m.file, [{ from: m.from, to: m.to }]); break;
            case 'renameAll': await this.rename(m.file, m.items ?? []); break;
            case 'churn': await this.churn(); break;
            case 'exportTexts': await this.exportTexts(); break;
        }
    }

    /** Only files the scan or a comparison named can be opened from the page. */
    private async open(file?: string, line?: number): Promise<void> {
        if (typeof file !== 'string' || !this.known.has(file)) { return; }
        const at = new vscode.Position(Math.max(0, Number(line) || 0), 0);
        await vscode.window.showTextDocument(vscode.Uri.file(file), { selection: new vscode.Range(at, at), viewColumn: vscode.ViewColumn.One, preserveFocus: false });
    }

    async scan(): Promise<void> {
        this.cancel?.cancel();
        const source = new vscode.CancellationTokenSource();
        this.cancel = source;
        this.post({ type: 'scanning', on: true });
        try {
            let last = 0;
            const data: ProjectData = await this.scanner.scan(source.token, (done, total) => {
                // the page is told at most ten times a second
                if (Date.now() - last > 100) { last = Date.now(); this.post({ type: 'scanning', on: true, progress: { done, total } }); }
            });
            this.data = data;
            this.known.clear();
            data.sql.forEach(e => this.known.add(e.file));
            data.sqlIssues.forEach(i => this.known.add(i.path));
            data.unusedUnits.forEach(u => this.known.add(u.path));
            data.unusedComponents.forEach(c => this.known.add(c.path));
            data.gridIssues.forEach(g => this.known.add(g.path));
            data.naming.forEach(n => this.known.add(n.path));
            data.metrics.forEach(u => this.known.add(u.path));
            // the .dfm of every form (texts and families point to it)
            const unitPath = new Map(data.metrics.map(m => [m.unit, m.path]));
            data.families.forEach(f => f.forms.forEach(x => { const p = unitPath.get(x.unit); if (p) { this.known.add(p.slice(0, -4) + '.dfm'); } }));
            data.formChecks.forEach(f => { this.known.add(f.file); this.known.add(f.file.slice(0, -4) + '.dfm'); });
            if (!source.token.isCancellationRequested) { this.post({ type: 'data', data }); }
        } catch (e) {
            this.post({ type: 'scanning', on: false });
            void vscode.window.showErrorMessage('CE: scan failed: ' + (e instanceof Error ? e.message : String(e)));
        }
    }

    /** Renames components of a form, in the .dfm and the unit together, one at a time (each one is worked out on the text the one before left). The documents stay open and modified: undo is there. */
    private async rename(dfmPath: unknown, items: { from?: string; to?: string }[]): Promise<void> {
        if (typeof dfmPath !== 'string' || !this.known.has(dfmPath) || !/\.dfm$/i.test(dfmPath)) { return; }
        const pasPath = dfmPath.slice(0, -4) + '.pas';
        const done: { from: string; to: string }[] = [];
        let error: string | undefined;
        try {
            const dfmDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(dfmPath));
            const pasDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(pasPath));
            for (const it of items) {
                if (typeof it.from !== 'string' || typeof it.to !== 'string') { continue; }
                const r = renameEdits(pasDoc.getText(), dfmDoc.getText(), it.from, it.to);
                if ('error' in r) { error = r.error; break; }
                const pasEdits = normalizeEdits(r.pasEdits);
                const dfmEdits = normalizeEdits(r.dfmEdits);
                if ('error' in pasEdits || 'error' in dfmEdits) { error = ('error' in pasEdits ? pasEdits.error : (dfmEdits as { error: string }).error); break; }
                const we = new vscode.WorkspaceEdit();
                const put = (doc: vscode.TextDocument, edits: TextEdit[]): void => {
                    for (const e of edits) { we.replace(doc.uri, new vscode.Range(doc.positionAt(e.offset), doc.positionAt(e.offset + (e.length ?? 0))), e.text); }
                };
                put(pasDoc, pasEdits.edits);
                put(dfmDoc, dfmEdits.edits);
                if (!(await vscode.workspace.applyEdit(we))) { error = 'VS Code refused the change.'; break; }
                done.push({ from: it.from, to: it.to });
            }
        } catch (e) { error = e instanceof Error ? e.message : String(e); }
        this.post({ type: 'renamed', file: dfmPath, done, error });
    }

    /** Hotspots: the units that are big and often changed. Git is asked only now, and only once for the whole project. */
    private async churn(): Promise<void> {
        const data = this.data;
        if (!data) { this.post({ type: 'hotspots', error: 'Scan the project first.' }); return; }
        try {
            const log = await gitChurn(data.root || path.dirname(data.metrics[0]?.path ?? '.'));
            this.post({ type: 'hotspots', rows: hotspots(data.metrics, log) });
        } catch (e) { this.post({ type: 'hotspots', error: e instanceof Error ? e.message : String(e) }); }
    }

    private async exportTexts(): Promise<void> {
        if (!this.data) { return; }
        const target = await vscode.window.showSaveDialog({ filters: { CSV: ['csv'] }, saveLabel: 'Export the texts', defaultUri: vscode.Uri.file(path.join(this.data.root || '.', 'form-texts.csv')) });
        if (!target) { return; }
        // a byte order mark, so that Excel reads the accents
        await vscode.workspace.fs.writeFile(target, Buffer.from('\uFEFF' + textsCsv(this.data.texts), 'utf8'));
        void vscode.window.showInformationMessage(`CE: ${this.data.texts.length} texts exported${this.data.textCount > this.data.texts.length ? ' (the most used)' : ''}.`);
    }

    /** The form of the active editor, now (the editor's text if it is open and modified) against a version of git. */
    async compare(ref: string): Promise<void> {
        const current = vscode.window.activeTextEditor?.document;
        const dfm = activeDfm(current) ?? activeDfm(this.lastForm);
        if (!dfm) { this.post({ type: 'diff', ref, file: '', error: 'Open a form (.dfm, or the .pas next to one) first.' }); return; }
        this.known.add(dfm);
        try {
            const open = vscode.workspace.textDocuments.find(d => d.uri.fsPath.toLowerCase() === dfm.toLowerCase());
            const now = open ? open.getText() : fs.readFileSync(dfm, 'utf8').replace(/^\uFEFF/, '');
            const before = await gitShow(dfm, ref);
            this.post({ type: 'diff', ref, file: dfm, result: diffDfm(before, now) });
        } catch (e) {
            this.post({ type: 'diff', ref, file: dfm, error: e instanceof Error ? e.message : String(e) });
        }
    }

}
