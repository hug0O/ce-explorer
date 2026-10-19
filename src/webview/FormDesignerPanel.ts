import * as vscode from 'vscode';
import { TextEdit } from '../services/DelphiForm';
import { parseDfmTree, findNode } from '../services/DelphiLayout';
import { ALIGN_OPS, AlignOp, alignComponents } from '../services/DelphiAlign';
import { addEventToComponent, resolveFormPair } from '../services/FormCommands';
import { loadComponentDef } from '../services/FormLibrary';
import { COMPONENTS, EVENT_PROP_RE, resolveComponentDef } from '../services/DelphiForm';
import { planAddEvent } from '../services/DelphiEvents';
import {
    DesignResult, EditExpectation, addEdits, buildDesignModel, deleteEdits, namesWithin, nodeAtLine, rectEdits, renameEdits, reparentEdits, setPropertyEdits, verifyEdit,
} from '../services/DesignerModel';
import { applyTextEdits } from '../services/DelphiForm';
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
    private lastSelection: string[] = [];
    /** Full screen of the designer = VS Code's Zen mode, which can only be toggled: its state is tracked here. */
    private zen = false;

    private constructor(
        private readonly panel: vscode.WebviewPanel,
        private readonly pasDoc: vscode.TextDocument,
        private readonly dfmDoc: vscode.TextDocument,
    ) {
        panel.webview.html = designerHtml(nonce());
        this.disposables.push(
            panel.onDidChangeViewState(e => { if (e.webviewPanel.visible) { this.sendModel(); } }),
            panel.onDidDispose(() => this.dispose()),
            panel.webview.onDidReceiveMessage(m => { void this.onMessage(m); }),
            vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document === this.dfmDoc || e.document === this.pasDoc) { this.scheduleRefresh(); }
            }),
            vscode.window.onDidChangeTextEditorSelection(e => {
                if (e.textEditor.document !== this.dfmDoc || this.applying) { return; }
                const name = nodeAtLine(this.dfmDoc.getText(), e.selections[0].active.line);
                if (name && !(this.lastSelection.length === 1 && this.lastSelection[0] === name)) {
                    this.lastSelection = [name];
                    void panel.webview.postMessage({ type: 'select', names: [name] });
                }
            }),
        );
    }

    static async createOrShow(doc: vscode.TextDocument | undefined): Promise<void> {
        const pair = await resolveFormPair(doc);
        if (!pair) {
            vscode.window.showWarningMessage('CE: Open a Delphi unit (.pas) that has a text .dfm of the same name next to it.');
            return;
        }
        const key = pair.dfm.toString();
        const existing = FormDesignerPanel.open.get(key);
        if (existing) { existing.panel.reveal(existing.panel.viewColumn ?? vscode.ViewColumn.Active); return; }
        const [pasDoc, dfmDoc] = await Promise.all([vscode.workspace.openTextDocument(pair.pas), vscode.workspace.openTextDocument(pair.dfm)]);
        if (!buildDesignModel(dfmDoc.getText())) {
            vscode.window.showWarningMessage('CE: The .dfm is not in text format (in Delphi: right-click the form → Text DFM).');
            return;
        }
        // Same editor group by default: the designer and the code are two tabs of one place, like F12 in Delphi.
        const column = vscode.workspace.getConfiguration('mmx').get<string>('delphi.designerColumn', 'active') === 'beside' ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;
        const panel = vscode.window.createWebviewPanel('mmxFormDesigner', 'Designer: ' + pair.dfm.fsPath.split(/[\\/]/).pop(), column, {
            enableScripts: true, retainContextWhenHidden: true,
        });
        FormDesignerPanel.open.set(key, new FormDesignerPanel(panel, pasDoc, dfmDoc));
    }

    /** Delphi's F12: from the designer to the code, from the code (or the .dfm) back to the designer. */
    static async toggle(doc: vscode.TextDocument | undefined): Promise<void> {
        for (const d of FormDesignerPanel.open.values()) {
            if (d.panel.active) { await vscode.window.showTextDocument(d.pasDoc, { viewColumn: d.panel.viewColumn }); return; }
        }
        await FormDesignerPanel.createOrShow(doc);
    }

    /** Enters / leaves VS Code's Zen mode (no side bar, no status bar, full screen) so that a complex form gets the whole screen. */
    private async setZen(on: boolean): Promise<void> {
        if (on === this.zen) { return; }
        this.zen = on;
        try { await vscode.commands.executeCommand('workbench.action.toggleZenMode'); } catch { this.zen = !on; }
    }

    private dispose(): void {
        // Closing the designer must not leave the window stripped of its interface.
        if (this.zen) { this.zen = false; void vscode.commands.executeCommand('workbench.action.toggleZenMode'); }
        FormDesignerPanel.open.delete(this.dfmDoc.uri.toString());
        if (this.refreshTimer) { clearTimeout(this.refreshTimer); }
        this.disposables.forEach(d => d.dispose());
    }

    /* ───────────── model ───────────── */

    private scheduleRefresh(): void {
        if (this.refreshTimer) { clearTimeout(this.refreshTimer); }
        this.refreshTimer = setTimeout(() => this.sendModel(), 120);
    }

    private sendModel(selection?: string[], notice?: string): void {
        const model = buildDesignModel(this.dfmDoc.getText());
        if (!model) {
            void this.panel.webview.postMessage({ type: 'notice', text: 'The .dfm is not valid text DFM right now (being edited?).' });
            return;
        }
        void this.panel.webview.postMessage({
            type: 'model', model, palette: PALETTE, ops: ALIGN_OPS.map(o => ({ id: o.id, label: o.label })),
            canUndo: this.undoStack.length > 0, canRedo: this.redoStack.length > 0, selection, notice,
        });
    }

    /* ───────────── applying edits ───────────── */

    private toWorkspaceEdit(edit: vscode.WorkspaceEdit, doc: vscode.TextDocument, edits: TextEdit[]): void {
        for (const e of edits) {
            const start = doc.positionAt(e.offset);
            if (e.length) { edit.replace(doc.uri, new vscode.Range(start, doc.positionAt(e.offset + e.length)), e.text); }
            else { edit.insert(doc.uri, start, e.text); }
        }
    }

    private async replaceAll(doc: vscode.TextDocument, text: string): Promise<boolean> {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(doc.uri, new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), text);
        return vscode.workspace.applyEdit(edit);
    }

    /** Applies a designer action as one workspace edit and records it for undo. */
    private async commit(label: string, result: DesignResult, selection?: string[], expect: EditExpectation = {}): Promise<boolean> {
        if ('error' in result) {
            this.sendModel(undefined, result.error);
            vscode.window.showWarningMessage('CE: ' + result.error);
            return false;
        }
        if (result.dfmEdits.length === 0 && result.pasEdits.length === 0) { this.sendModel(selection, 'Nothing to change.'); return true; }
        const dfmBefore = this.dfmDoc.getText();
        const pasBefore = this.pasDoc.getText();
        // Never touch what the action is not about: components the designer does not understand
        // must stay exactly as they are. If the edit would alter anything else, refuse it.
        const problem = verifyEdit(dfmBefore, applyTextEdits(dfmBefore, result.dfmEdits), expect);
        if (problem) {
            const text = `Refused: this change would also alter the .dfm elsewhere (${problem}). Nothing was modified.`;
            this.sendModel(undefined, text);
            vscode.window.showWarningMessage('CE: ' + text);
            return false;
        }
        const edit = new vscode.WorkspaceEdit();
        this.toWorkspaceEdit(edit, this.dfmDoc, result.dfmEdits);
        this.toWorkspaceEdit(edit, this.pasDoc, result.pasEdits);
        this.applying = true;
        const ok = await vscode.workspace.applyEdit(edit);
        this.applying = false;
        if (!ok) { vscode.window.showErrorMessage('CE: VS Code refused the edit.'); return false; }
        this.undoStack.push({
            label, dfmBefore, dfmAfter: this.dfmDoc.getText(),
            pasBefore: result.pasEdits.length ? pasBefore : undefined, pasAfter: result.pasEdits.length ? this.pasDoc.getText() : undefined,
        });
        if (this.undoStack.length > 100) { this.undoStack.shift(); }
        this.redoStack = [];
        this.lastSelection = selection ?? this.lastSelection;
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

    /* ───────────── messages ───────────── */

    private async onMessage(m: Record<string, unknown>): Promise<void> {
        try {
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
            case 'undo': await this.step('undo'); return;
            case 'redo': await this.step('redo'); return;
            case 'fullscreen': await this.setZen(m.on === true); return;
            case 'openCode': await vscode.window.showTextDocument(this.pasDoc, { viewColumn: this.panel.viewColumn }); return;
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
                await this.commit(m.type === 'move' ? 'Move' : 'Resize', rectEdits(dfm, changes), changes.map(c => c.name), { touched: changes.map(c => c.name), props: ['Left', 'Top', 'Width', 'Height'] });
                return;
            }
            case 'reparent': {
                const target = str(m.target);
                const list = names(m.names);
                const positions = (Array.isArray(m.positions) ? m.positions : []).slice(0, MAX_ITEMS).map((p: Record<string, unknown>) => ({ left: num(p?.left) ?? 0, top: num(p?.top) ?? 0 }));
                if (!NAME_RE.test(target)) { return; }
                await this.commit('Move into ' + target, reparentEdits(dfm, list, target, positions), list, { touched: list, props: ['Left', 'Top'], reparented: list });
                return;
            }
            case 'add': {
                const className = str(m.className);
                if (!CLASS_RE.test(className)) { this.sendModel(undefined, 'Not a valid class name.'); return; }
                const def = await loadComponentDef(className);
                const r = addEdits(pas, dfm, {
                    className, parentName: NAME_RE.test(str(m.parent)) ? str(m.parent) : undefined,
                    left: num(m.left) ?? 16, top: num(m.top) ?? 16, width: num(m.width), height: num(m.height), unit: def.unit || undefined,
                });
                await this.commit('Add ' + className, r, 'name' in r && r.name ? [r.name] : undefined, { added: 'name' in r && r.name ? [r.name] : [] });
                return;
            }
            case 'delete': {
                const list = names(m.names);
                await this.commit('Delete ' + list.join(', '), deleteEdits(pas, dfm, list, root.className), [], { removed: list.flatMap(n => namesWithin(dfm, n)) });
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
                await this.commit(`${name}.${str(m.prop)}`, setPropertyEdits(dfm, name, str(m.prop), m.value), [name], { touched: [name], props: [str(m.prop)] });
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
