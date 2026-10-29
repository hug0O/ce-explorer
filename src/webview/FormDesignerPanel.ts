import * as vscode from 'vscode';
import { TextEdit } from '../services/DelphiForm';
import { DfmNode, parseDfmTree, findNode, isContainer, listContainers } from '../services/DelphiLayout';
import { ANCHOR_MODES, AnchorMode, applyAnchorMode, planTabOrder } from '../services/DelphiAlign';
import { changeClassCommand, checkFormCommand, cleanHandlersCommand, formFromClassCommand, formFromFieldsCommand, runOnForm } from '../services/DelphiCommands';
import { copyComponents, parseClip, serializeClip } from '../services/DelphiClip';
import { ALIGN_OPS, AlignOp, alignComponents } from '../services/DelphiAlign';
import { addEventToComponent, resolveFormPair } from '../services/FormCommands';
import { loadComponentDef } from '../services/FormLibrary';
import { COMPONENTS, EVENT_PROP_RE, resolveComponentDef } from '../services/DelphiForm';
import { planAddEvent, wiredEvents } from '../services/DelphiEvents';
import { handlerImplementation } from '../services/DelphiSync';
import {
    DesignResult, EditExpectation, addEdits, buildDesignModel, danglingRefs, deleteEdits, namesWithin, nodeAtLine, pasteEdits, rectEdits, renameEdits, reparentEdits, setPropertyEdits, setChartTitleEdits, setSqlEdits, zOrderEdits, verifyEdit,
} from '../services/DesignerModel';
import { createColumnsEdits, createFieldsEdits } from '../services/DesignerFields';
import { layouts, loadMarks, saveLayouts, saveMarks } from '../services/DesignerStore';
import { handlerPreviews } from '../services/DesignerPreview';
import { compareItems, ghostsOf } from '../services/DesignerCompare';
import { classOfArg, formsOpenedBy, hostedForms, stringNames } from '../services/DelphiFormRefs';
import { projectIndex } from '../services/ProjectFormIndex';
import { resizeForm } from '../services/DesignerResponsive';
import { diffDfm } from '../services/DfmDiff';
import { gitShow } from './ProjectPanel';
import { SheetColors, sameSheets, sheetReferences } from '../services/DelphiColors';
import { ExternalSheets } from '../services/ExternalSheets';
import { unitFacts } from '../services/ProjectUnused';
import { applyTextEdits, normalizeEdits } from '../services/DelphiForm';
import { PALETTE, designerHtml } from './designerHtml';

interface HistoryEntry {
    dfmBefore: string;
    dfmAfter: string;
    pasBefore?: string;
    pasAfter?: string;
    label: string;
}

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const CLASS_RE = /^[A-Za-z_][\w.]*$/;
const MAX_ITEMS = 500;

function nonce(): string {
    let s = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) { s += chars.charAt(Math.floor(Math.random() * chars.length)); }
    return s;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const names = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && NAME_RE.test(x)).slice(0, MAX_ITEMS) : []);

/**
 * Visual form designer: the .dfm drawn as a form (VCL docking rules applied),
 * with selection, drag, resize, drop from a palette, an inspector, align tools
 * and its own undo. Every action becomes ordinary text edits of the .dfm /
 * .pas, so the text and the picture always agree.
 */
export class FormDesignerPanel {
    private static readonly open = new Map<string, FormDesignerPanel>();

    private readonly disposables: vscode.Disposable[] = [];
    private undoStack: HistoryEntry[] = [];
    private redoStack: HistoryEntry[] = [];
    private refreshTimer: ReturnType<typeof setTimeout> | undefined;
    private applying = false;
    /** Messages from the webview are handled one at a time, in order: each reads the files as the previous one left them. */
    private queue: Promise<void> = Promise.resolve();
    private lastSelection: string[] = [];
    /** Components cut (Ctrl+X) and not pasted yet: pasting them moves the real ones, with their names and handlers. */
    private cut: { clip: string; names: string[] } | undefined;
    /** Full screen of the designer = VS Code's Zen mode, which can only be toggled: its state is tracked here. */
    private zen = false;

    private constructor(
        private readonly panel: vscode.WebviewPanel,
        private pasDoc: vscode.TextDocument,
        private dfmDoc: vscode.TextDocument,
    ) {
        panel.webview.html = designerHtml(nonce());
        // the units of the project are read in the background, so the first click on a 🗗 or a 🔗 does not wait for them
        void projectIndex().catch(() => undefined);
        this.disposables.push(
            panel.onDidChangeViewState(e => { if (e.webviewPanel.visible) { this.sendModel(); } }),
            panel.onDidDispose(() => this.dispose()),
            panel.webview.onDidReceiveMessage(m => { this.queue = this.queue.then(() => this.onMessage(m)); }),
            vscode.workspace.onDidChangeTextDocument(e => {
                if (this.isOurs(e.document)) { this.scheduleRefresh(); }
            }),
            // VS Code lets go of a file nobody has open after a while: a document object that was closed no longer follows the file.
            vscode.workspace.onDidCloseTextDocument(d => { if (this.isOurs(d)) { void this.reopenDocs(); } }),
            vscode.workspace.onDidSaveTextDocument(d => {
                if (this.isOurs(d)) { this.scheduleRefresh(); }
            }),
            vscode.window.onDidChangeTextEditorSelection(e => {
                if (e.textEditor.document.uri.toString() !== this.dfmDoc.uri.toString() || this.applying) { return; }
                const name = nodeAtLine(this.dfmDoc.getText(), e.selections[0].active.line);
                if (name && !(this.lastSelection.length === 1 && this.lastSelection[0] === name)) {
                    this.lastSelection = [name];
                    void panel.webview.postMessage({ type: 'select', names: [name] });
                }
            }),
        );
    }

    /**
     * Opens the designer of a unit (a document or just its file, as the explorer and the title bar hand it over), or brings it
     * back. From the designer tab itself there is no text editor: the designer that is open is shown again.
     */
    static async createOrShow(target: vscode.TextDocument | vscode.Uri | undefined): Promise<void> {
        await FormDesignerPanel.openOrReveal(target);
        await FormDesignerPanel.hideSideBars();
    }

    /** The designer gets the whole width: the side bars on the left and on the right are closed, only the centre stays (ce.delphi.designerHideSidebars). */
    private static async hideSideBars(): Promise<void> {
        if (![...FormDesignerPanel.open.values()].length || !vscode.workspace.getConfiguration('ce').get<boolean>('delphi.designerHideSidebars', true)) { return; }
        for (const c of ['workbench.action.closeSidebar', 'workbench.action.closeAuxiliaryBar']) {
            try { await vscode.commands.executeCommand(c); } catch { /* this VS Code has no such bar */ }
        }
    }

    private static async openOrReveal(target: vscode.TextDocument | vscode.Uri | undefined): Promise<void> {
        let doc: vscode.TextDocument | undefined;
        if (target && 'uri' in target) { doc = target; }
        else if (target) { try { doc = await vscode.workspace.openTextDocument(target); } catch { doc = undefined; } }
        if (!doc) {
            const open = [...FormDesignerPanel.open.values()];
            const shown = open.find(d => d.panel.active) ?? open[open.length - 1];
            if (shown) {
                shown.panel.reveal(shown.panel.viewColumn ?? vscode.ViewColumn.Active);
                const back = FormDesignerPanel.backTo.get(shown.dfmDoc.uri.toString());
                if (back) { FormDesignerPanel.backTo.delete(shown.dfmDoc.uri.toString()); void shown.panel.webview.postMessage({ type: 'selectComponent', name: back }); }
                return;
            }
        }
        const pair = await resolveFormPair(doc);
        if (!pair) {
            vscode.window.showWarningMessage('CE: Open a Delphi unit (.pas) that has a text .dfm of the same name next to it.');
            return;
        }
        const key = pair.dfm.toString();
        const existing = FormDesignerPanel.open.get(key);
        if (existing) {
            existing.panel.reveal(existing.panel.viewColumn ?? vscode.ViewColumn.Active);
            // coming back from the Structure tab (the S key): the component that was left comes back selected
            const back = FormDesignerPanel.backTo.get(key);
            if (back) { FormDesignerPanel.backTo.delete(key); void existing.panel.webview.postMessage({ type: 'selectComponent', name: back }); }
            return;
        }
        const [pasDoc, dfmDoc] = await Promise.all([vscode.workspace.openTextDocument(pair.pas), vscode.workspace.openTextDocument(pair.dfm)]);
        if (!buildDesignModel(dfmDoc.getText())) {
            vscode.window.showWarningMessage('CE: The .dfm is not in text format (in Delphi: right-click the form → Text DFM).');
            return;
        }
        // Same editor group by default: the designer and the code are two tabs of one place, like F12 in Delphi.
        const column = vscode.workspace.getConfiguration('ce').get<string>('delphi.designerColumn', 'active') === 'beside' ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;
        const panel = vscode.window.createWebviewPanel('ceFormDesigner', 'Designer: ' + pair.dfm.fsPath.split(/[\\/]/).pop(), column, {
            enableScripts: true, retainContextWhenHidden: true,
        });
        FormDesignerPanel.open.set(key, new FormDesignerPanel(panel, pasDoc, dfmDoc));
    }

    /** The component to select when the designer is shown again, by .dfm (set when the code is reached with S or from the Structure tab). */
    private static readonly backTo = new Map<string, string>();

    /** The designer of the unit with this component selected (the *Show in the designer* button of the Structure tab). */
    static async showComponent(doc: vscode.TextDocument | undefined, name: string): Promise<void> {
        const m = doc ? /^(.*)\.(pas|dfm)$/i.exec(doc.uri.fsPath) : null;
        if (m) { FormDesignerPanel.backTo.set(vscode.Uri.file(m[1] + '.dfm').toString(), name); }
        await FormDesignerPanel.createOrShow(doc);
    }

    /** Delphi's F12: from the designer to the code, from the code (or the .dfm) back to the designer. */
    static async toggle(doc: vscode.TextDocument | undefined): Promise<void> {
        for (const d of FormDesignerPanel.open.values()) {
            if (d.panel.active) { await vscode.window.showTextDocument(d.pasDoc, { viewColumn: d.panel.viewColumn }); return; }
        }
        await FormDesignerPanel.createOrShow(doc);
    }

    private static output: vscode.OutputChannel | undefined;
    /** What the 🗗 button read and found, for the cases where it finds nothing. */
    private static log(): vscode.OutputChannel { return (FormDesignerPanel.output ??= vscode.window.createOutputChannel('CE Form links')); }

    /** Ctrl+K Ctrl+F in the designer tab: the full screen of the form, the same as its button. */
    static toggleFullScreen(): void {
        for (const d of FormDesignerPanel.open.values()) {
            if (d.panel.active) { void d.panel.webview.postMessage({ type: 'toggleFull' }); return; }
        }
    }

    private isOurs(d: vscode.TextDocument): boolean {
        const u = d.uri.toString();
        return u === this.dfmDoc.uri.toString() || u === this.pasDoc.uri.toString();
    }

    /**
     * Makes sure the two documents are the live ones. A text document VS Code closed (nobody had the file open) keeps its
     * last text but no longer follows the file: offsets taken from it would land in the wrong place.
     */
    private async reopenDocs(): Promise<void> {
        try {
            if (this.dfmDoc.isClosed) { this.dfmDoc = await vscode.workspace.openTextDocument(this.dfmDoc.uri); }
            if (this.pasDoc.isClosed) { this.pasDoc = await vscode.workspace.openTextDocument(this.pasDoc.uri); }
        } catch { /* the file is gone: the next action reports it */ }
        this.scheduleRefresh();
    }

    /** Enters / leaves VS Code's Zen mode (no side bar, no status bar, full screen) so that a complex form gets the whole screen. */
    private async setZen(on: boolean): Promise<void> {
        if (on === this.zen) { return; }
        this.zen = on;
        // Zen mode centres the editor in a narrow column by default (zenMode.centerLayout): the designer would not get the whole width.
        if (on) { await this.centreLayout(false); }
        try { await vscode.commands.executeCommand('workbench.action.toggleZenMode'); } catch { this.zen = !on; }
        if (!on || !this.zen) { await this.centreLayout(true); }
    }

    /** The user's own zenMode.centerLayout, kept while the designer turns it off, and put back when the full screen ends. */
    private static savedCentre: { value: boolean | undefined } | undefined;

    private async centreLayout(restore: boolean): Promise<void> {
        const cfg = vscode.workspace.getConfiguration('zenMode');
        try {
            if (!restore) {
                if (!FormDesignerPanel.savedCentre) { FormDesignerPanel.savedCentre = { value: cfg.inspect<boolean>('centerLayout')?.globalValue }; }
                if (cfg.get<boolean>('centerLayout') !== false) { await cfg.update('centerLayout', false, vscode.ConfigurationTarget.Global); }
            } else if (FormDesignerPanel.savedCentre && ![...FormDesignerPanel.open.values()].some(p => p !== this && p.zen)) {
                const was = FormDesignerPanel.savedCentre.value;
                FormDesignerPanel.savedCentre = undefined;
                await cfg.update('centerLayout', was, vscode.ConfigurationTarget.Global);
            }
        } catch { /* settings cannot be written here: the full screen still works, only narrower */ }
    }

    private dispose(): void {
        // Closing the designer must not leave the window stripped of its interface.
        if (this.zen) { this.zen = false; void vscode.commands.executeCommand('workbench.action.toggleZenMode'); void this.centreLayout(true); }
        FormDesignerPanel.open.delete(this.dfmDoc.uri.toString());
        if (this.refreshTimer) { clearTimeout(this.refreshTimer); }
        this.disposables.forEach(d => d.dispose());
    }

    /* ───────────── model ───────────── */

    private scheduleRefresh(): void {
        if (this.refreshTimer) { clearTimeout(this.refreshTimer); }
        this.refreshTimer = setTimeout(() => this.sendModel(), 120);
    }

    /** Style sheets of other forms the grids point to: read apart, and the form is drawn again when they came. */
    private readonly externalSheets = new ExternalSheets();
    private sheets = new Map<string, SheetColors>();
    private sheetsFor = '';

    private async refreshSheets(): Promise<void> {
        const text = this.dfmDoc.getText();
        const refs = sheetReferences(text).map(r => (r.module + '.' + r.sheet).toLowerCase()).sort().join(',');
        const uses = unitFacts(this.pasDoc.getText())?.uses.map(u => u.name) ?? [];
        const key = refs + '|' + uses.join(',');
        if (key === this.sheetsFor) { return; }
        this.sheetsFor = key;
        const loaded = refs ? await this.externalSheets.load(text, this.dfmDoc.uri.fsPath, uses) : new Map<string, SheetColors>();
        if (!sameSheets(loaded, this.sheets)) { this.sheets = loaded; this.sendModel(); }
    }

    /** The version the form is compared with (its .dfm text), while the comparison is on. */
    private compareWith: { ref: string; before: string } | undefined;

    private sendCompare(): void {
        const c = this.compareWith;
        if (!c) { return; }
        const diff = diffDfm(c.before, this.dfmDoc.getText());
        const old = buildDesignModel(c.before, this.sheets);
        void this.panel.webview.postMessage({ type: 'compare', ref: c.ref, items: compareItems(diff), ghosts: old ? ghostsOf(diff, old) : [] });
    }

    /** The forms this unit puts in containers of the form (fAddFormInto(oForm, pnl), oForm.Parent := pnl). */
    private hosts(): { parent: string; formArg: string; className?: string }[] {
        const root = parseDfmTree(this.dfmDoc.getText());
        if (!root) { return []; }
        const names = new Set<string>();
        (function walk(n: DfmNode): void { names.add(n.name); n.children.forEach(walk); })(root);
        const helpers = vscode.workspace.getConfiguration('ce.delphi').get<string[]>('hostCalls', ['fAddFormInto']);
        return hostedForms(this.pasDoc.getText(), helpers, [], names).map(h => ({ ...h, className: h.className ?? this.hostClass.get(h.formArg) }));
    }

    /** The class of the form a container holds, found in the workspace once the project is read (the unit alone does not always say). */
    private hostClass = new Map<string, string>();
    private linkTimer: ReturnType<typeof setTimeout> | undefined;

    private scheduleLinks(): void {
        if (this.linkTimer) { clearTimeout(this.linkTimer); }
        this.linkTimer = setTimeout(() => { void this.resolveHosts(); }, 350);
    }

    private async resolveHosts(): Promise<void> {
        const wanted = this.hosts().filter(h => !h.className && !this.hostClass.has(h.formArg));
        if (!wanted.length) { return; }
        let index;
        try { index = await projectIndex(); } catch { return; }
        const pas = this.pasDoc.getText();
        let changed = false;
        for (const h of wanted) {
            const cls = classOfArg(pas, h.formArg, index.forms);
            const form = index.forms.find(f => f.className.toLowerCase() === (cls ?? '').toLowerCase());
            if (form) { this.hostClass.set(h.formArg, form.className); changed = true; }
        }
        if (changed) { void this.panel.webview.postMessage({ type: 'hosts', hosts: this.hosts() }); }
    }

    private async openFormFile(pas: string): Promise<void> {
        await FormDesignerPanel.createOrShow(vscode.Uri.file(pas));
    }

    private sendModel(selection?: string[], notice?: string): void {
        void this.refreshSheets();
        const model = buildDesignModel(this.dfmDoc.getText(), this.sheets);
        if (!model) {
            void this.panel.webview.postMessage({ type: 'notice', text: 'The .dfm is not valid text DFM right now (being edited?).' });
            return;
        }
        void this.panel.webview.postMessage({
            type: 'model', model, designer: loadMarks(this.dfmDoc.uri.fsPath), palette: PALETTE, ops: ALIGN_OPS.map(o => ({ id: o.id, label: o.label })), anchorModes: ANCHOR_MODES,
            hosts: this.hosts(), canUndo: this.undoStack.length > 0, canRedo: this.redoStack.length > 0, selection, notice,
            dirty: this.dfmDoc.isDirty || this.pasDoc.isDirty, cut: this.cut?.names ?? [],
        });
        this.sendCompare();
        this.sendLayouts();
        this.scheduleLinks();
    }

    private sendLayouts(): void {
        void this.panel.webview.postMessage({ type: 'layouts', list: layouts().map(l => ({ id: l.id, name: l.name, count: l.count })) });
    }

    /** Saves the .dfm and the .pas together, the way the designer's Save button and Ctrl+S ask. */
    private async saveAll(): Promise<void> {
        const names = [this.dfmDoc, this.pasDoc].filter(d => d.isDirty).map(d => d.uri.fsPath.split(/[\\/]/).pop());
        if (names.length === 0) { this.sendModel(undefined, 'Nothing to save: the .dfm and the .pas are saved.'); return; }
        const saved = await Promise.all([this.dfmDoc, this.pasDoc].map(d => (d.isDirty ? d.save() : Promise.resolve(true))));
        this.sendModel(undefined, saved.every(Boolean) ? 'Saved ' + names.join(' and ') : 'Could not save every file: see the editor for the reason.');
    }

    private get autoSave(): boolean {
        return vscode.workspace.getConfiguration('ce').get<boolean>('delphi.designerAutoSave', false);
    }

    /* ───────────── applying edits ───────────── */

    private toWorkspaceEdit(edit: vscode.WorkspaceEdit, doc: vscode.TextDocument, edits: TextEdit[]): void {
        for (const e of edits) {
            const start = doc.positionAt(e.offset);
            if (e.length) { edit.replace(doc.uri, new vscode.Range(start, doc.positionAt(e.offset + e.length)), e.text); }
            else { edit.insert(doc.uri, start, e.text); }
        }
    }

    /** One replacement per document, limited to what differs: the way out when the editor refuses the detailed edits. */
    private wholeEdit(edit: vscode.WorkspaceEdit, doc: vscode.TextDocument, before: string, after: string): void {
        if (before === after) { return; }
        let head = 0;
        while (head < before.length && head < after.length && before[head] === after[head]) { head++; }
        let tail = 0;
        while (tail < before.length - head && tail < after.length - head && before[before.length - 1 - tail] === after[after.length - 1 - tail]) { tail++; }
        edit.replace(doc.uri, new vscode.Range(doc.positionAt(head), doc.positionAt(before.length - tail)), after.slice(head, after.length - tail));
    }

    private async tryApply(edit: vscode.WorkspaceEdit): Promise<boolean> {
        this.applying = true;
        try { return await vscode.workspace.applyEdit(edit); }
        catch { return false; }
        finally { this.applying = false; }
    }

    private async replaceAll(doc: vscode.TextDocument, text: string): Promise<boolean> {
        const edit = new vscode.WorkspaceEdit();
        this.wholeEdit(edit, doc, doc.getText(), text);
        return this.tryApply(edit);
    }

    /** Why the editor would not take a change, in words the user can act on. */
    private async refusalReason(): Promise<string> {
        const problems: string[] = [];
        for (const doc of [this.dfmDoc, this.pasDoc]) {
            const name = doc.uri.fsPath.split(/[\\/]/).pop();
            if (doc.isClosed) { problems.push(`${name} was closed: reopen the unit and the designer`); continue; }
            try {
                const st = await vscode.workspace.fs.stat(doc.uri);
                if (st.permissions !== undefined && (st.permissions & vscode.FilePermission.Readonly)) {
                    problems.push(`${name} is read-only (file attribute, files.readonlyInclude or version control): make it writable`);
                }
            } catch { /* not a file on disk */ }
        }
        return problems.length ? problems.join('; ') : 'the editor rejected the change (is one of the files shown in a read-only view such as a diff?)';
    }

    /** Applies a designer action as one workspace edit and records it for undo. */
    private async commit(label: string, result: DesignResult, selection?: string[], expect: EditExpectation = {}): Promise<boolean> {
        const refuse = (text: string, warn = true): false => {
            this.sendModel(undefined, text);
            if (warn) { vscode.window.showWarningMessage('CE: ' + text); }
            return false;
        };
        if ('error' in result) { return refuse(result.error); }
        if (result.dfmEdits.length === 0 && result.pasEdits.length === 0) { this.sendModel(selection, 'Nothing to change.'); return true; }
        const dfmBefore = this.dfmDoc.getText();
        const pasBefore = this.pasDoc.getText();
        // Changes that overlap would make the editor refuse everything: tidy them up, or say which ones clash.
        const dfmEdits = normalizeEdits(result.dfmEdits);
        const pasEdits = normalizeEdits(result.pasEdits);
        if ('error' in dfmEdits) { return refuse(`This change was not applied: in the .dfm, ${dfmEdits.error}. Nothing was modified.`); }
        if ('error' in pasEdits) { return refuse(`This change was not applied: in the unit, ${pasEdits.error}. Nothing was modified.`); }
        const dfmAfter = applyTextEdits(dfmBefore, dfmEdits.edits);
        const pasAfter = applyTextEdits(pasBefore, pasEdits.edits);
        // Never touch what the action is not about: components the designer does not understand
        // must stay exactly as they are. If the edit would alter anything else, refuse it.
        const problem = verifyEdit(dfmBefore, dfmAfter, expect);
        if (problem) { return refuse(`Refused: this change would also alter the .dfm elsewhere (${problem}). Nothing was modified.`); }
        const detailed = new vscode.WorkspaceEdit();
        this.toWorkspaceEdit(detailed, this.dfmDoc, dfmEdits.edits);
        this.toWorkspaceEdit(detailed, this.pasDoc, pasEdits.edits);
        let ok = await this.tryApply(detailed);
        if (!ok) {
            // Same result, expressed as one replacement per file.
            const whole = new vscode.WorkspaceEdit();
            this.wholeEdit(whole, this.dfmDoc, dfmBefore, dfmAfter);
            this.wholeEdit(whole, this.pasDoc, pasBefore, pasAfter);
            ok = await this.tryApply(whole);
        }
        if (!ok) { return refuse(`VS Code refused the edit: ${await this.refusalReason()}. Nothing was modified.`); }
        this.undoStack.push({
            label, dfmBefore, dfmAfter: this.dfmDoc.getText(),
            pasBefore: pasEdits.edits.length ? pasBefore : undefined, pasAfter: pasEdits.edits.length ? this.pasDoc.getText() : undefined,
        });
        if (this.undoStack.length > 100) { this.undoStack.shift(); }
        this.redoStack = [];
        this.lastSelection = selection ?? this.lastSelection;
        if (this.autoSave) { await Promise.all([this.dfmDoc, this.pasDoc].map(d => (d.isDirty ? d.save() : Promise.resolve(true)))); }
        this.sendModel(selection, result.note);
        return true;
    }

    private async step(direction: 'undo' | 'redo'): Promise<void> {
        const from = direction === 'undo' ? this.undoStack : this.redoStack;
        const to = direction === 'undo' ? this.redoStack : this.undoStack;
        const entry = from[from.length - 1];
        if (!entry) { return; }
        const expected = direction === 'undo' ? entry.dfmAfter : entry.dfmBefore;
        if (this.dfmDoc.getText() !== expected || (entry.pasBefore !== undefined && this.pasDoc.getText() !== (direction === 'undo' ? entry.pasAfter : entry.pasBefore))) {
            this.undoStack = []; this.redoStack = [];
            this.sendModel(undefined, 'The files were edited outside the designer: use the editor\'s own Undo (Ctrl+Z).');
            return;
        }
        this.applying = true;
        await this.replaceAll(this.dfmDoc, direction === 'undo' ? entry.dfmBefore : entry.dfmAfter);
        if (entry.pasBefore !== undefined && entry.pasAfter !== undefined) { await this.replaceAll(this.pasDoc, direction === 'undo' ? entry.pasBefore : entry.pasAfter); }
        this.applying = false;
        from.pop();
        to.push(entry);
        this.sendModel(undefined, `${direction === 'undo' ? 'Undone' : 'Redone'}: ${entry.label}`);
    }

    /** Unit of every class under the given components, for the `uses` clause of a form that receives them. */
    private async unitsOf(root: DfmNode, list: string[]): Promise<(c: string) => string> {
        const classes = new Set<string>();
        const walk = (n: DfmNode): void => { classes.add(n.className); n.children.forEach(walk); };
        for (const n of list) { const node = findNode(root, n); if (node) { walk(node); } }
        const map = new Map<string, string>();
        for (const c of classes) { map.set(c, (await loadComponentDef(c)).unit); }
        return c => map.get(c) ?? '';
    }

    /* ───────────── messages ───────────── */

    private async onMessage(m: Record<string, unknown>): Promise<void> {
        try {
            if (this.dfmDoc.isClosed || this.pasDoc.isClosed) { await this.reopenDocs(); }
            await this.handle(m);
        } catch (e) {
            // A message the designer cannot process must never break it: report and carry on.
            this.sendModel(undefined, 'Action failed: ' + (e instanceof Error ? e.message : String(e)));
        }
    }

    private async handle(m: Record<string, unknown>): Promise<void> {
        const dfm = this.dfmDoc.getText();
        const pas = this.pasDoc.getText();
        const root = parseDfmTree(dfm);
        switch (m.type) {
            case 'ready': this.sendModel(); return;
            case 'save': await this.saveAll(); return;
            case 'uncut': this.cut = undefined; this.sendModel(); return;
            case 'undo': await this.step('undo'); return;
            case 'redo': await this.step('redo'); return;
            case 'fullscreen': await this.setZen(m.on === true); return;
            case 'openCode': await vscode.window.showTextDocument(this.pasDoc, { viewColumn: this.panel.viewColumn }); return;
            case 'showInStructure': {
                // to the code, and the sidebar on the component: filtered, with its events and where it is used
                const name = str(m.name);
                if (!NAME_RE.test(name)) { return; }
                FormDesignerPanel.backTo.set(this.dfmDoc.uri.toString(), name);
                vscode.window.setStatusBarMessage('CE: Ctrl+K Ctrl+B goes back to the designer, with ' + name + ' selected', 8000);
                await vscode.window.showTextDocument(this.pasDoc, { viewColumn: this.panel.viewColumn });
                await vscode.commands.executeCommand('ce.structure.showComponent', name);
                return;
            }
            case 'openDfm': await vscode.window.showTextDocument(this.dfmDoc, { viewColumn: this.panel.viewColumn }); return;
            default: break;
        }
        if (!root) { this.sendModel(undefined, 'The .dfm is not valid text DFM right now.'); return; }

        switch (m.type) {
            case 'move':
            case 'resize': {
                const list = Array.isArray(m.changes) ? m.changes.slice(0, MAX_ITEMS) as Record<string, unknown>[] : [];
                const changes = list.filter(c => typeof c.name === 'string' && NAME_RE.test(c.name as string)).map(c => ({
                    name: c.name as string, rect: { left: num(c.left), top: num(c.top), width: num(c.width), height: num(c.height) },
                }));
                await this.commit(m.type === 'move' ? 'Move' : 'Resize', rectEdits(dfm, changes), changes.map(c => c.name), { touched: changes.map(c => c.name), props: ['Left', 'Top', 'Width', 'Height', 'DesignInfo'] });
                return;
            }
            case 'reparent': {
                const target = str(m.target);
                const list = names(m.names);
                const positions = (Array.isArray(m.positions) ? m.positions : []).slice(0, MAX_ITEMS).map((p: Record<string, unknown>) => ({ left: num(p?.left) ?? 0, top: num(p?.top) ?? 0 }));
                if (!NAME_RE.test(target)) { return; }
                await this.commit('Move into ' + target, reparentEdits(dfm, list, target, positions), list, { touched: list, props: ['Left', 'Top', 'DesignInfo'], reparented: list });
                return;
            }
            case 'add': {
                const className = str(m.className);
                if (!CLASS_RE.test(className)) { this.sendModel(undefined, 'Not a valid class name.'); return; }
                const def = await loadComponentDef(className);
                // the files are read again: they may have changed while the library was read
                const r = addEdits(this.pasDoc.getText(), this.dfmDoc.getText(), {
                    className, parentName: NAME_RE.test(str(m.parent)) ? str(m.parent) : undefined,
                    left: num(m.left) ?? 16, top: num(m.top) ?? 16, width: num(m.width), height: num(m.height), unit: def.unit || undefined,
                    caption: typeof m.caption === 'string' ? m.caption.slice(0, 120) : undefined,
                });
                await this.commit('Add ' + className, r, 'name' in r && r.name ? [r.name] : undefined, { added: 'name' in r && r.name ? [r.name] : [] });
                return;
            }
            case 'copy':
            case 'cut': {
                const list = names(m.names);
                const r = copyComponents(pas, dfm, list, await this.unitsOf(root, list));
                if ('error' in r) { this.sendModel(undefined, r.error); return; }
                const text = serializeClip(r.payload);
                await vscode.env.clipboard.writeText(text);
                const roots = r.payload.objects.map(o => parseDfmTree(o)?.name).filter((n): n is string => !!n);
                this.cut = m.type === 'cut' ? { clip: text, names: roots } : undefined;
                const count = r.payload.components.length;
                this.sendModel(list, m.type === 'cut'
                    ? `${roots.join(', ')} cut: select a container and paste (Ctrl+V) to move ${roots.length > 1 ? 'them' : 'it'}.`
                    : `${count} component(s) copied: paste (Ctrl+V) into this form or another one.`);
                return;
            }
            case 'paste': {
                const text = await vscode.env.clipboard.readText();
                const clip = parseClip(text);
                if (!clip) { this.sendModel(undefined, 'The clipboard holds no components copied from the designer (select some, then Ctrl+C or Ctrl+X).'); return; }
                const target = NAME_RE.test(str(m.target)) ? findNode(root, str(m.target)) : root;
                if (!target) { this.sendModel(undefined, 'Container not found.'); return; }
                if (this.cut && this.cut.clip === text && this.cut.names.every(n => findNode(root, n))) {
                    // Cut then paste = move: the very same components, in their new container.
                    const into = isContainer(target) ? target : (target.parent ?? root);
                    const moved = this.cut.names.map(n => findNode(root, n)).filter((n): n is DfmNode => !!n);
                    if (moved.every(n => n.parent === into)) { this.cut = undefined; this.sendModel(moved.map(n => n.name), `Already in ${into.name}.`); return; }
                    const list = moved.map(n => n.name);
                    const ok = await this.commit('Move into ' + into.name,
                        reparentEdits(dfm, list, into.name, moved.map(n => ({ left: n.left ?? 16, top: n.top ?? 16 }))), list, { touched: list, props: ['Left', 'Top'], reparented: list });
                    if (ok) { this.cut = undefined; this.sendModel(list); }
                    return;
                }
                const r = pasteEdits(pas, dfm, clip, target.name);
                await this.commit(`Paste ${clip.components.length} component(s)`, r, 'roots' in r ? r.roots : undefined, { added: 'added' in r ? r.added ?? [] : [] });
                return;
            }
            case 'compareAsk': {
                const ref = await vscode.window.showInputBox({
                    title: 'Compare the form with a git version', prompt: 'HEAD, a branch, a tag or a commit', value: this.compareWith?.ref ?? 'HEAD',
                    validateInput: v => (/^[\w][\w./~^@{}-]*$/.test(v.trim()) ? undefined : 'Not a version git can read'),
                });
                if (!ref) { return; }
                try {
                    this.compareWith = { ref: ref.trim(), before: await gitShow(this.dfmDoc.uri.fsPath, ref.trim()) };
                    this.sendCompare();
                } catch (e) { this.sendModel(undefined, 'Compare: ' + (e instanceof Error ? e.message : String(e))); }
                return;
            }
            case 'testSize': {
                const dm = buildDesignModel(dfm, this.sheets);
                const w = num(m.w), h = num(m.h);
                if (dm && w && h && w >= 100 && h >= 100 && w <= 4000 && h <= 4000) { void this.panel.webview.postMessage({ type: 'testSizeResult', ...resizeForm(dm, w, h) }); }
                return;
            }
            case 'layoutSave': {
                const list = names(m.names);
                const r = copyComponents(pas, dfm, list, await this.unitsOf(root, list));
                if ('error' in r) { this.sendModel(undefined, r.error); return; }
                const name = str(m.name).trim().slice(0, 60);
                if (!name) { return; }
                const saved = layouts().filter(l => l.name !== name);
                saved.unshift({ id: String(Date.now()), name, payload: serializeClip(r.payload), count: r.payload.components.length, savedAt: Date.now() });
                await saveLayouts(saved);
                this.sendModel(list, `Layout "${name}" kept (${r.payload.components.length} components): View > Layouts inserts it in any form.`);
                return;
            }
            case 'layoutDelete': {
                await saveLayouts(layouts().filter(l => l.id !== str(m.id)));
                this.sendLayouts();
                return;
            }
            case 'layoutInsert': {
                const l = layouts().find(x => x.id === str(m.id));
                const clip = l ? parseClip(l.payload) : undefined;
                if (!l || !clip) { this.sendModel(undefined, 'That layout is not readable any more.'); return; }
                const target = NAME_RE.test(str(m.target)) ? findNode(root, str(m.target)) : root;
                if (!target) { this.sendModel(undefined, 'Container not found.'); return; }
                const into = isContainer(target) ? target : (target.parent ?? root);
                const r = pasteEdits(pas, dfm, clip, into.name);
                await this.commit(`Insert layout ${l.name}`, r, 'roots' in r ? r.roots : undefined, { added: 'added' in r ? r.added ?? [] : [] });
                return;
            }
            case 'compareClose': { this.compareWith = undefined; return; }
            case 'designerState': {
                await saveMarks(this.dfmDoc.uri.fsPath, { groups: m.groups, locks: m.locks, hidden: m.hidden });
                return;
            }
            case 'handlerPreview': {
                const node = NAME_RE.test(str(m.name)) ? findNode(root, str(m.name)) : undefined;
                if (!node) { return; }
                void this.panel.webview.postMessage({ type: 'handlerPreview', name: node.name, x: num(m.x) ?? 0, y: num(m.y) ?? 0, items: handlerPreviews(pas, node, root.className) });
                return;
            }
            case 'tabOrder': {
                // the selected containers, else every container of the form
                const picked = names(m.names).map(n => findNode(root, n)).filter((n): n is DfmNode => !!n && isContainer(n));
                const r = planTabOrder(dfm, picked.length ? picked : listContainers(root).map(c => c.node));
                if ('error' in r) { this.sendModel(undefined, r.error); return; }
                if (r.edits.length === 0) { this.sendModel(undefined, 'TabOrder already follows the screen.'); return; }
                await this.commit('TabOrder by position', { dfmEdits: r.edits, pasEdits: [] }, undefined, { touched: r.changed, props: ['TabOrder'] });
                return;
            }
            case 'delete': {
                const list = names(m.names);
                await this.commit('Delete ' + list.join(', '), deleteEdits(pas, dfm, list, root.className), [], { removed: list.flatMap(n => namesWithin(dfm, n)), touched: danglingRefs(root, list).map(d => d.node.name), props: [...new Set(danglingRefs(root, list).flatMap(d => d.props))] });
                return;
            }
            case 'createFields':
            case 'createColumns': {
                const holder = str(m.name);
                const r = m.type === 'createFields' ? createFieldsEdits(pas, dfm, holder) : createColumnsEdits(pas, dfm, holder);
                await this.commit((m.type === 'createFields' ? 'Add all fields of ' : 'Create the columns of ') + holder, r, 'added' in r ? r.added : undefined, { added: 'added' in r ? r.added ?? [] : [] });
                return;
            }
            case 'rename': {
                const from = str(m.from);
                const to = str(m.to).trim();
                if (!NAME_RE.test(to)) { this.sendModel(undefined, `"${to}" is not a valid component name.`); return; }
                await this.commit(`Rename ${from}`, renameEdits(pas, dfm, from, to), [to], { renamed: true, removed: [from], added: [to] });
                return;
            }
            case 'setProp': {
                const name = str(m.name);
                await this.commit(`${name}.${str(m.prop)}`, setPropertyEdits(dfm, name, str(m.prop), m.value), [name], { touched: [name], props: [str(m.prop), 'DesignInfo'] });
                return;
            }
            case 'setProps': {
                // The same property of several components, each with its own value (a multi-selection edited in the inspector).
                const items = Array.isArray(m.items) ? m.items.slice(0, 500) : [];
                const dfmEdits: TextEdit[] = [], pasEdits: TextEdit[] = [];
                const touched: string[] = [], props = new Set<string>(['DesignInfo']);
                let firstError: string | undefined;
                for (const raw of items) {
                    const it = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
                    const name = str(it.name), prop = str(it.prop);
                    if (!NAME_RE.test(name)) { continue; }
                    const r = setPropertyEdits(dfm, name, prop, it.value);
                    if ('error' in r) { firstError ??= r.error; continue; }
                    dfmEdits.push(...r.dfmEdits); pasEdits.push(...r.pasEdits); touched.push(name); props.add(prop);
                }
                if (!touched.length) { this.sendModel(undefined, firstError ?? 'Nothing to change.'); return; }
                await this.commit(`${[...props].filter(p => p !== 'DesignInfo').join(', ')} of ${touched.length} components`, { dfmEdits, pasEdits }, touched, { touched, props: [...props] });
                return;
            }
            case 'openHostedForm': {
                // a panel of this form holds a form: its designer opens
                const index = await projectIndex();
                const cls = str(m.cls) || classOfArg(this.pasDoc.getText(), str(m.arg), index.forms);
                const form = index.forms.find(f => f.className.toLowerCase() === (cls ?? '').toLowerCase());
                if (!form) { this.sendModel(undefined, `The form held by ${str(m.arg)} was not found in the workspace${cls ? ' (' + cls + ')' : ''}.`); return; }
                await this.openFormFile(form.pas);
                return;
            }
            case 'handlerForms': {
                // the forms that the handler of an event opens, followed through the methods it calls
                const node = NAME_RE.test(str(m.name)) ? findNode(root, str(m.name)) : undefined;
                const handler = node ? wiredEvents(node)[str(m.event)] : undefined;
                const impl = handler ? handlerImplementation(pas, root.className, handler) : undefined;
                if (!node || !handler || !impl) { this.sendModel(undefined, 'This event has no handler in the unit yet.'); return; }
                const index = await projectIndex();
                const trace: string[] = [`handler ${handler} of ${node.name}`, `${index.units.size} units, ${index.forms.length} forms, ${index.methods.size} methods, ${index.consts.size} name constants read from the workspace`];
                const all = formsOpenedBy(pas.slice(impl.start, impl.end), index.forms, index.units, root.className, index.methods, index.consts, trace);
                // the forms really opened (created, shown, named); the ones the code only mentions are offered when it opens none
                const found = all.filter(f => !f.how.startsWith('refers to'));
                const opened = found;
                trace.push(found.length ? 'forms found: ' + found.map(f => `${f.form.className} (${f.how}${f.via ? ', via ' + f.via : ''})`).join('; ') : 'no form found');
                const log = FormDesignerPanel.log();
                log.appendLine(`[${new Date().toLocaleTimeString()}] ` + trace.join('\n    '));
                if (found.length === 0) {
                    void vscode.window.showInformationMessage(`CE: ${handler} opens no form of the workspace.`, 'Show details').then(c => { if (c) { log.show(true); } });
                    const names = stringNames(pas.slice(impl.start, impl.end)).slice(0, 8);
                    this.sendModel(undefined, `${handler} opens no form of the workspace (${index.units.size} units, ${index.forms.length} forms read).${names.length ? ' Names in its code that match no form: ' + names.join(', ') + '.' : ''}`);
                    return;
                }
                const pick = found.length === 1 ? found[0] : (await vscode.window.showQuickPick(
                    found.map(f => ({ label: f.form.className, description: [f.how, f.via ? 'via ' + f.via : ''].filter(Boolean).join(' · '), detail: f.form.pas, ref: f })),
                    { title: opened.length ? `Forms opened by ${handler}` : `${handler} opens no form: it refers to`, placeHolder: 'Open its designer' }))?.ref;
                if (pick) { await this.openFormFile(pick.form.pas); }
                return;
            }
            case 'zorder': {
                const list = names(m.names);
                const dir = m.dir === 'back' ? 'back' : 'front';
                await this.commit(dir === 'front' ? 'Bring to front' : 'Send to back', zOrderEdits(dfm, list, dir), list, { touched: list, props: [] });
                return;
            }
            case 'runTool': {
                // The tools that need a choice (a class, a list of problems) run with VS Code's pickers, on the unit of this designer.
                const tools: Record<string, () => Promise<void>> = {
                    check: () => checkFormCommand(), clean: () => cleanHandlersCommand(), changeClass: () => changeClassCommand(),
                    formFromFields: () => formFromFieldsCommand(), formFromClass: () => formFromClassCommand(),
                };
                const run = tools[str(m.id)];
                if (run) { await runOnForm(this.pasDoc, run); this.sendModel(); }
                return;
            }
            case 'anchors': {
                const list = names(m.names).map(n => findNode(root, n)).filter((n): n is DfmNode => !!n);
                const mode = ANCHOR_MODES.find(x => x.id === m.mode);
                const parent = list[0]?.parent;
                if (!mode || !parent || !list.every(n => n.parent === parent)) { this.sendModel(undefined, 'Anchors: select components of the same container.'); return; }
                const r = applyAnchorMode(dfm, parent, list, mode.id as AnchorMode);
                const touched = list.map(n => n.name);
                await this.commit(mode.label, 'error' in r ? r : { dfmEdits: r.edits, pasEdits: [] }, touched, { touched, props: ['Anchors', 'Align', 'Left', 'Top', 'Width', 'Height'] });
                return;
            }
            case 'duplicate': {
                const list = names(m.names);
                const first = list.length ? findNode(root, list[0]) : undefined;
                if (!first) { return; }
                const copied = copyComponents(pas, dfm, list, await this.unitsOf(root, list));
                if ('error' in copied) { this.sendModel(undefined, copied.error); return; }
                const into = first.parent && first.parent.depth > 0 ? first.parent.name : undefined;
                const r = pasteEdits(pas, dfm, copied.payload, into);
                await this.commit('Duplicate ' + list.join(', '), r, 'roots' in r ? r.roots : undefined, { added: 'added' in r ? r.added ?? [] : [] });
                return;
            }
            case 'setChartTitle': {
                const lines = Array.isArray(m.lines) ? m.lines.filter((l): l is string => typeof l === 'string') : [];
                const name = str(m.name);
                await this.commit(`${name}.Title`, setChartTitleEdits(dfm, name, lines), [name], { touched: [name], props: ['Title.Text.Strings'] });
                return;
            }
            case 'setSql': {
                const lines = Array.isArray(m.lines) ? m.lines.filter((l): l is string => typeof l === 'string') : [];
                const name = str(m.name);
                await this.commit(`${name}.SQL`, setSqlEdits(dfm, name, lines), [name], { touched: [name], props: ['SQL.Strings'] });
                return;
            }
            case 'align': {
                const op = ALIGN_OPS.find(o => o.id === m.op)?.id as AlignOp | undefined;
                const list = names(m.names).map(n => findNode(root, n)).filter((n): n is NonNullable<typeof n> => !!n);
                if (!op) { return; }
                const r = alignComponents(dfm, list, op);
                await this.commit(ALIGN_OPS.find(o => o.id === op)!.label, 'error' in r ? r : { dfmEdits: r.edits, pasEdits: [] }, list.map(n => n.name), { touched: list.map(n => n.name), props: ['Left', 'Top', 'Width', 'Height'] });
                return;
            }
            case 'addEvent': {
                // One click in the inspector's event list: the handler is created (method, declaration, link in the .dfm) without leaving the designer.
                const name = str(m.name);
                const event = str(m.event);
                if (!NAME_RE.test(name) || !EVENT_PROP_RE.test(event)) { this.sendModel(undefined, `"${event}" is not an event name (expected OnXxx).`); return; }
                const plan = planAddEvent(pas, dfm, { componentName: name, eventName: event });
                if ('error' in plan) { this.sendModel(undefined, plan.error); return; }
                if (!plan.alreadyWired && plan.dfmEdit) {
                    const created = plan.handler.split('.').pop();
                    const ok = await this.commit(`${name}.${event}`, { dfmEdits: [plan.dfmEdit], pasEdits: plan.pasEdits, note: `${event} → ${created} created` }, [name], { touched: [name], props: [event] });
                    if (!ok) { return; }
                }
                if (m.open === true) { await addEventToComponent(this.pasDoc, name, event, this.panel.viewColumn); }
                return;
            }
            case 'open': {
                const name = str(m.name);
                const node = name === root.name ? root : findNode(root, name);
                if (!node) { return; }
                const requested = str(m.event);
                const known = COMPONENTS.find(c => c.className.toLowerCase() === node.className.toLowerCase());
                if (!requested && known && known.events.length === 0) {
                    void this.panel.webview.postMessage({ type: 'notice', text: `${node.className} has no events.` });
                    return;
                }
                const event = EVENT_PROP_RE.test(requested) ? requested
                    : node.depth === 0 ? 'OnCreate' : (resolveComponentDef(node.className).events[0]?.name ?? 'OnClick');
                // The code opens in the designer's own editor group: its tab stays there to come back to.
                await addEventToComponent(this.pasDoc, name, event, this.panel.viewColumn);
                void this.panel.webview.postMessage({ type: 'notice', text: `Handler of ${name}.${event} opened in code. Come back with the designer tab, the 🎨 button or Ctrl+K Ctrl+B.` });
                return;
            }
            default: return;
        }
    }
}
