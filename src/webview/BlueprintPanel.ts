import * as vscode from 'vscode';
import { ClassInfo, ClassMember, MemberFormResult, MemberKind, Parameter, Visibility } from '../models/types';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { CodeExplorerService } from '../services/CodeExplorerService';
import { CodeGeneratorService } from '../services/CodeGeneratorService';
import * as ops from '../services/MemberOperations';
import { generateFromSpec, memberFormToSpec } from '../services/memberForm';
import { addCallEdit, familyOf, removeCallEdit, LineEdit } from '../utils/callGraph';
import { BpMember, BpModel, SavedPositions, buildBlueprint, nodeIds } from '../utils/blueprintModel';
import { layout } from '../utils/blueprintLayout';
import { analyze } from '../utils/blueprintAnalysis';
import { toMermaid, toSvg } from '../utils/blueprintExport';
import { blueprintHtml } from './blueprintHtml';

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ROUTINE = new Set([MemberKind.Method, MemberKind.Constructor, MemberKind.Destructor]);

function nonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 32; i++) { s += chars.charAt(Math.floor(Math.random() * chars.length)); }
    return s;
}

interface Entry { id: string; cls: ClassInfo; member: ClassMember; node: BpMember }

/**
 * The Blueprint view of a source file: its routines drawn as nodes, the calls between them as wires. Dragging a wire from one node to
 * another writes the call in the code, deleting a wire removes it, renaming / deleting / adding a node does the same to the routine; the
 * picture is always read again from the text, so it never disagrees with it.
 */
export class BlueprintPanel {
    private static readonly open = new Map<string, BlueprintPanel>();
    private static deps: { registry: ProviderRegistry; explorer: CodeExplorerService; generator: CodeGeneratorService; state: vscode.Memento } | undefined;

    static configure(registry: ProviderRegistry, explorer: CodeExplorerService, generator: CodeGeneratorService, state: vscode.Memento): void {
        BlueprintPanel.deps = { registry, explorer, generator, state };
    }

    static show(doc: vscode.TextDocument | undefined): void {
        const deps = BlueprintPanel.deps;
        if (!deps) { return; }
        const target = doc ?? vscode.window.activeTextEditor?.document;
        if (!target) { vscode.window.showWarningMessage('CE: Open a source file to draw its blueprint.'); return; }
        const provider = deps.registry.getByDocument(target);
        if (!provider || !familyOf(provider.languageId)) {
            vscode.window.showWarningMessage('CE: The blueprint draws the routines of a source file; this file has none to draw.');
            return;
        }
        const key = target.uri.toString();
        const existing = BlueprintPanel.open.get(key);
        if (existing) { existing.panel.reveal(); return; }
        const panel = vscode.window.createWebviewPanel('ceBlueprint', 'Blueprint: ' + (target.uri.fsPath.split(/[\\/]/).pop() ?? ''), vscode.ViewColumn.Beside, {
            enableScripts: true, retainContextWhenHidden: true,
        });
        BlueprintPanel.open.set(key, new BlueprintPanel(panel, target, deps));
    }

    /** Ctrl+K Ctrl+F in the blueprint tab: the same as its full screen button. */
    static toggleFullScreen(): void {
        for (const b of BlueprintPanel.open.values()) {
            if (b.panel.active) { void b.panel.webview.postMessage({ type: 'toggleFull' }); return; }
        }
    }

    /** What each action of the picture changed in the file, to undo and redo it (the whole text before and after). */
    private undoStack: { label: string; before: string; after: string }[] = [];
    private redoStack: { label: string; before: string; after: string }[] = [];
    private zen = false;
    private entries: Entry[] = [];
    private timer: NodeJS.Timeout | undefined;
    private readonly subs: vscode.Disposable[] = [];
    private readonly stateKey: string;

    private constructor(
        private readonly panel: vscode.WebviewPanel,
        private readonly doc: vscode.TextDocument,
        private readonly deps: NonNullable<typeof BlueprintPanel.deps>,
    ) {
        this.stateKey = 'ce.blueprint.' + doc.uri.toString();
        const n = nonce();
        panel.webview.html = blueprintHtml({ nonce: n, cspSource: panel.webview.cspSource, title: doc.uri.fsPath.split(/[\\/]/).pop() ?? 'Blueprint' });
        this.subs.push(
            panel.webview.onDidReceiveMessage(m => { void this.onMessage(m as Record<string, unknown>); }),
            vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document.uri.toString() !== doc.uri.toString()) { return; }
                if (this.timer) { clearTimeout(this.timer); }
                this.timer = setTimeout(() => this.send(), 350);
            }),
            panel.onDidDispose(() => {
                if (this.zen) { void this.setZen(false); }
                if (this.timer) { clearTimeout(this.timer); }
                BlueprintPanel.open.delete(doc.uri.toString());
                this.subs.forEach(s => s.dispose());
            }),
        );
    }

    // --- the model ---------------------------------------------------------------------------------------------------------

    private positions(): SavedPositions { return this.deps.state.get<SavedPositions>(this.stateKey, {}); }

    /** The routines of the file with the objects the edits need. */
    private read(): { entries: Entry[]; languageId: string } | undefined {
        const provider = this.deps.registry.getByDocument(this.doc);
        if (!provider) { return undefined; }
        const parsed = this.deps.registry.parse(this.doc) ?? provider.parseDocument(this.doc);
        const bodyless = provider.languageId === 'pascal' || provider.languageId === 'cpp';
        const raw: { cls: ClassInfo; member: ClassMember; owner?: string }[] = [];
        for (const cls of parsed.classes) {
            for (const member of cls.members) { if (ROUTINE.has(member.kind)) { raw.push({ cls, member, owner: cls.isSynthetic ? undefined : cls.name }); } }
        }
        for (const member of parsed.standaloneProcedures) {
            raw.push({ cls: { id: 'standalone_' + member.id, name: '', fullName: '', classType: 'standalone', interfaces: [], members: [member], range: member.range, isInterface: false, isRecord: false, isSealed: false, fileUri: this.doc.uri }, member });
        }
        const bp: BpMember[] = raw.map(({ member, owner }) => {
            const impl = member.implementationRange;
            const range = impl ?? (bodyless ? undefined : member.range);
            return {
                name: member.name, owner,
                kind: member.kind === MemberKind.Constructor ? 'constructor' : member.kind === MemberKind.Destructor ? 'destructor' : owner === undefined ? 'function' : 'method',
                params: member.parameters.map(p => ({ name: p.name, type: p.type, dir: p.direction && p.direction !== 'in' ? p.direction : p.isVar ? 'var' : p.isOut ? 'out' : p.isConst ? 'const' : undefined })),
                returnType: member.returnType || undefined,
                line: (impl ?? member.range).start.line,
                body: range && range.end.line > range.start.line ? { start: range.start.line, end: range.end.line } : undefined,
            };
        });
        const ids = nodeIds(bp);
        return { entries: raw.map((r, i) => ({ id: ids[i], cls: r.cls, member: r.member, node: bp[i] })), languageId: provider.languageId };
    }

    private lines(): string[] { return this.doc.getText().split(/\r?\n/); }

    private model(): BpModel | undefined {
        const r = this.read();
        const family = r ? familyOf(r.languageId) : undefined;
        if (!r || !family) { return undefined; }
        this.entries = r.entries;
        return buildBlueprint(r.entries.map(e => e.node), this.lines(), family, this.positions());
    }

    private send(fit = false): void {
        const m = this.model();
        if (m) {
            const analysis = analyze(m.nodes.map(n => n.id), m.edges, this.entryPoints(), id => !!m.nodes.find(n => n.id === id)?.hasBody);
            void this.panel.webview.postMessage({ type: 'model', nodes: m.nodes, edges: m.edges, analysis, fit });
        }
    }

    /** Routines that are called from outside the file (event handlers…): not reported as unused. */
    private entryPoints(): string[] { return []; }

    private notice(text: string): void { void this.panel.webview.postMessage({ type: 'notice', text }); }

    /** The full screen of the editor area (Zen mode), without the narrow centred column Zen mode gives by default. */
    private async setZen(on: boolean): Promise<void> {
        if (on === this.zen) { return; }
        this.zen = on;
        const cfg = vscode.workspace.getConfiguration('zenMode');
        const was = cfg.inspect<boolean>('centerLayout')?.globalValue;
        try {
            if (on && cfg.get<boolean>('centerLayout') !== false) { BlueprintPanel.savedCentre = { value: was }; await cfg.update('centerLayout', false, vscode.ConfigurationTarget.Global); }
            await vscode.commands.executeCommand('workbench.action.toggleZenMode');
        } catch { this.zen = !on; }
        if (!on && BlueprintPanel.savedCentre) {
            const v = BlueprintPanel.savedCentre.value;
            BlueprintPanel.savedCentre = undefined;
            try { await cfg.update('centerLayout', v, vscode.ConfigurationTarget.Global); } catch { /* the setting stays as it is */ }
        }
    }

    private static savedCentre: { value: boolean | undefined } | undefined;

    // --- the gestures ------------------------------------------------------------------------------------------------------

    private entry(id: unknown): Entry | undefined { return typeof id === 'string' ? this.entries.find(e => e.id === id) : undefined; }

    private async onMessage(m: Record<string, unknown>): Promise<void> {
        switch (m.type) {
            case 'ready': this.send(true); this.sendHistory(); break;
            case 'undo': await this.undo(); break;
            case 'export': await this.exportGraph(m.format === 'svg' ? 'svg' : 'mermaid'); break;
            case 'redo': await this.redo(); break;
            case 'positions': {
                const next = { ...this.positions(), ...((m.positions ?? {}) as SavedPositions) };
                await this.deps.state.update(this.stateKey, next);
                break;
            }
            case 'resetLayout': await this.deps.state.update(this.stateKey, {}); this.send(true); break;
            case 'fullscreen': await this.setZen(m.on === true); break;
            case 'subsetLayout': this.subsetLayout(m.ids, m.key); break;
            case 'openCode': await this.openCode(this.entry(m.id)); break;
            case 'addCall': { const f = this.entry(m.from), t = this.entry(m.to); await this.recorded('add call' + (f && t ? ' ' + f.node.name + ' > ' + t.node.name : ''), () => this.addCall(f, t)); break; }
            case 'removeCall': { const f = this.entry(m.from), t = this.entry(m.to); await this.recorded('remove call' + (f && t ? ' ' + f.node.name + ' > ' + t.node.name : ''), () => this.removeCall(f, t)); break; }
            case 'rename': { const e = this.entry(m.id); await this.recorded('rename ' + (e?.node.name ?? ''), () => this.rename(e)); break; }
            case 'deleteNode': { const e = this.entry(m.id); await this.recorded('delete ' + (e?.node.name ?? ''), () => this.deleteNode(e)); break; }
            case 'addNode': await this.recorded('add routine', () => this.addNode(this.entry(m.caller), typeof m.x === 'number' ? m.x : undefined, typeof m.y === 'number' ? m.y : undefined)); break;
            case 'editNode': { const e = this.entry(m.id); await this.recorded('edit ' + (e?.node.name ?? ''), () => this.editNode(e, m)); break; }
        }
    }

    /** The nodes left by a filter laid out as if they were the whole graph (the saved positions are not touched). */
    private subsetLayout(ids: unknown, key: unknown): void {
        const m = this.model();
        if (!m || !Array.isArray(ids) || typeof key !== 'string') { return; }
        const set = new Set(ids.filter((i): i is string => typeof i === 'string'));
        const nodes = m.nodes.filter(n => set.has(n.id));
        const boxes = layout(
            nodes.map(n => ({ id: n.id, title: n.name, subtitle: n.owner, inputs: 1 + n.params.length, outputs: 1 + (n.ret ? 1 : 0) })),
            m.edges.filter(e => set.has(e.from) && set.has(e.to)).map(e => ({ from: e.from, to: e.to })),
        );
        const positions: Record<string, { x: number; y: number }> = {};
        for (const [id, b] of boxes) { positions[id] = { x: b.x, y: b.y }; }
        void this.panel.webview.postMessage({ type: 'subset', key, positions });
    }

    /** The graph as a Mermaid flowchart (copied) or an SVG picture (saved). */
    private async exportGraph(format: 'svg' | 'mermaid'): Promise<void> {
        const m = this.model();
        if (!m || !m.nodes.length) { this.notice('Nothing to export.'); return; }
        if (format === 'mermaid') {
            await vscode.env.clipboard.writeText(toMermaid(m.nodes, m.edges));
            this.notice('Mermaid flowchart copied: paste it in a README or a wiki.');
            return;
        }
        const base = vscode.Uri.file(this.doc.uri.fsPath.replace(/\.[^.\\/]+$/, '') + '-blueprint.svg');
        const target = await vscode.window.showSaveDialog({ defaultUri: base, filters: { 'SVG picture': ['svg'] }, title: 'Save the blueprint as a picture' });
        if (!target) { return; }
        await vscode.workspace.fs.writeFile(target, Buffer.from(toSvg(m.nodes, m.edges), 'utf8'));
        this.notice('Saved ' + target.fsPath.split(/[\\/]/).pop());
    }

    // --- undo / redo -------------------------------------------------------------------------------------------------------

    /** Runs an action of the picture and keeps what it changed in the file, so that it can be undone from the picture. */
    private async recorded(label: string, action: () => Promise<void>): Promise<void> {
        const before = this.doc.getText();
        await action();
        // an action that goes through a preview or the language server lands a moment later
        for (let i = 0; i < 8 && this.doc.getText() === before; i++) { await new Promise(r => setTimeout(r, 60)); }
        const after = this.doc.getText();
        if (after !== before) {
            this.undoStack.push({ label, before, after });
            if (this.undoStack.length > 100) { this.undoStack.shift(); }
            this.redoStack = [];
        }
        this.sendHistory();
    }

    private sendHistory(): void {
        const top = (s: { label: string }[]): string | null => (s.length ? s[s.length - 1].label : null);
        void this.panel.webview.postMessage({ type: 'history', undo: top(this.undoStack), redo: top(this.redoStack) });
    }

    private async replaceAll(text: string): Promise<boolean> {
        const we = new vscode.WorkspaceEdit();
        we.replace(this.doc.uri, new vscode.Range(0, 0, this.doc.lineCount, 0), text);
        return vscode.workspace.applyEdit(we);
    }

    private async undo(): Promise<void> {
        const e = this.undoStack[this.undoStack.length - 1];
        if (!e) { this.notice('Nothing to undo.'); return; }
        if (this.doc.getText() !== e.after) { this.notice('The file was changed outside the picture since "' + e.label + '": it cannot be undone from here (Ctrl+Z in the editor can).'); return; }
        if (await this.replaceAll(e.before)) {
            this.undoStack.pop(); this.redoStack.push(e);
            this.notice('Undone: ' + e.label);
            this.send(); this.sendHistory();
        }
    }

    private async redo(): Promise<void> {
        const e = this.redoStack[this.redoStack.length - 1];
        if (!e) { this.notice('Nothing to redo.'); return; }
        if (this.doc.getText() !== e.before) { this.notice('The file was changed since: "' + e.label + '" cannot be redone.'); return; }
        if (await this.replaceAll(e.after)) {
            this.redoStack.pop(); this.undoStack.push(e);
            this.notice('Redone: ' + e.label);
            this.send(); this.sendHistory();
        }
    }

    // --- editing a node ----------------------------------------------------------------------------------------------------

    /** The form of the details panel: a new name, parameters and return type for a routine. The body is kept. */
    private async editNode(e: Entry | undefined, m: Record<string, unknown>): Promise<void> {
        if (!e) { return; }
        const provider = this.deps.registry.getByDocument(this.doc);
        if (!provider) { return; }
        const name = typeof m.name === 'string' ? m.name.trim() : '';
        if (!NAME_RE.test(name)) { this.notice('A routine name is letters, digits and _.'); return; }
        const raw = Array.isArray(m.params) ? m.params : [];
        const params: Parameter[] = [];
        for (const p of raw as Record<string, unknown>[]) {
            const pn = typeof p.name === 'string' ? p.name.trim() : '';
            if (!pn) { continue; }
            if (!NAME_RE.test(pn)) { this.notice('"' + pn + '" is not a valid parameter name.'); return; }
            const dir = typeof p.dir === 'string' ? p.dir : '';
            params.push({
                name: pn, type: typeof p.type === 'string' ? p.type.trim() : '',
                isVar: dir === 'var', isConst: dir === 'const', isOut: dir === 'out',
                direction: dir === 'out' ? 'out' : dir === 'var' ? 'inout' : 'in',
            });
        }
        const returnType = typeof m.returnType === 'string' ? m.returnType.trim() : '';
        let target = e;
        // the name first, with every call following it, then the signature
        if (name !== e.node.name) {
            if (!await ops.renameMember(this.doc, e.cls, e.member, provider, this.deps.explorer, name)) { return; }
            await new Promise(r => setTimeout(r, 150));
            this.model();
            const renamed = this.entries.find(x => x.node.name === name && x.node.owner === e.node.owner);
            if (!renamed) { this.send(); return; }
            target = renamed;
        }
        const old = target.member;
        const sameParams = params.length === old.parameters.length && params.every((p, i) => p.name === old.parameters[i].name && p.type === (old.parameters[i].type ?? '')
            && !!p.isVar === !!old.parameters[i].isVar && !!p.isConst === !!old.parameters[i].isConst && !!p.isOut === !!old.parameters[i].isOut);
        if (sameParams && returnType === (old.returnType ?? '')) { this.send(); return; }
        const form: MemberFormResult = {
            kind: old.kind, name, returnType: returnType || undefined, type: old.type, visibility: old.visibility, parameters: params,
            isStatic: old.isStatic, isVirtual: old.isVirtual, isAbstract: old.isAbstract, isOverride: old.isOverride, hasGetter: false, hasSetter: false,
        };
        if (await ops.editMember(this.doc, provider, target.cls, old, this.deps.generator, this.deps.explorer, form)) {
            this.notice(name + ' updated. Calls are not changed: check them if you added or removed a parameter.');
        }
        this.send();
    }

    private async openCode(e: Entry | undefined): Promise<void> {
        if (!e) { return; }
        const shown = vscode.window.visibleTextEditors.find(v => v.document.uri.toString() === this.doc.uri.toString());
        const editor = await vscode.window.showTextDocument(this.doc, { viewColumn: shown?.viewColumn ?? vscode.ViewColumn.One, preserveFocus: false });
        const at = new vscode.Position(e.node.line, 0);
        editor.selection = new vscode.Selection(at, at);
        editor.revealRange(new vscode.Range(at, at), vscode.TextEditorRevealType.InCenter);
    }

    private toWorkspaceEdit(edits: LineEdit[]): vscode.WorkspaceEdit {
        const we = new vscode.WorkspaceEdit();
        for (const e of edits) { we.replace(this.doc.uri, new vscode.Range(e.line, e.character, e.endLine, e.endCharacter), e.text); }
        return we;
    }

    private async addCall(from: Entry | undefined, to: Entry | undefined): Promise<void> {
        if (!from || !to) { return; }
        const family = familyOf(this.deps.registry.getByDocument(this.doc)?.languageId ?? '');
        if (!family) { return; }
        if (!from.node.body) { this.notice(from.node.name + ' has no body in this file: nothing to write the call into.'); return; }
        const existing = this.model()?.edges.find(e => e.from === from.id && e.to === to.id);
        if (existing) { this.notice(from.node.name + ' already calls ' + to.node.name + ' (line ' + (existing.lines[0] + 1) + ').'); return; }
        const edit = addCallEdit(this.lines(), from.node.body, to.node.name, to.node.params.map(p => p.name), family);
        if (!edit) { this.notice('Could not find where the body of ' + from.node.name + ' ends.'); return; }
        if (await vscode.workspace.applyEdit(this.toWorkspaceEdit([edit]))) {
            this.notice(from.node.name + ' now calls ' + to.node.name + ' (line ' + (edit.line + 1) + '). Ctrl+Z in the editor undoes it.');
            this.send();
        }
    }

    private async removeCall(from: Entry | undefined, to: Entry | undefined): Promise<void> {
        if (!from || !to) { return; }
        const family = familyOf(this.deps.registry.getByDocument(this.doc)?.languageId ?? '');
        const edge = this.model()?.edges.find(e => e.from === from.id && e.to === to.id);
        if (!family || !edge) { return; }
        const lines = this.lines();
        const edits = edge.lines.map(l => removeCallEdit(lines, l, to.node.name, family)).filter((e): e is LineEdit => !!e);
        if (!edits.length) { this.notice('Could not find the call to remove.'); return; }
        if (await vscode.workspace.applyEdit(this.toWorkspaceEdit(edits))) {
            this.notice(from.node.name + ' no longer calls ' + to.node.name + ' (' + edits.length + (edits.length > 1 ? ' call sites' : ' call site') + ' removed).');
            this.send();
        }
    }

    private async rename(e: Entry | undefined): Promise<void> {
        if (!e) { return; }
        const name = await vscode.window.showInputBox({
            title: 'Blueprint: rename ' + e.node.name, value: e.node.name, validateInput: v => (NAME_RE.test(v) ? undefined : 'A name: letters, digits and _'),
        });
        if (!name || name === e.node.name) { return; }
        const provider = this.deps.registry.getByDocument(this.doc);
        const moved = this.positions()[e.id];
        if (await ops.renameMember(this.doc, e.cls, e.member, provider, this.deps.explorer, name)) {
            if (moved) {
                const saved = this.positions();
                const newId = (e.node.owner ? e.node.owner + '.' : '') + name;
                delete saved[e.id];
                saved[newId] = moved;
                await this.deps.state.update(this.stateKey, saved);
            }
            this.send();
        }
    }

    private async deleteNode(e: Entry | undefined): Promise<void> {
        if (!e) { return; }
        if (await ops.deleteMember(this.doc, e.cls, e.member, this.deps.generator, this.deps.explorer)) { this.send(); }
    }

    private async addNode(caller: Entry | undefined, x?: number, y?: number): Promise<void> {
        const provider = this.deps.registry.getByDocument(this.doc);
        if (!provider) { return; }
        const name = await vscode.window.showInputBox({
            title: 'Blueprint: new routine' + (caller ? ' called by ' + caller.node.name : ''), prompt: 'Name of the routine',
            validateInput: v => (NAME_RE.test(v) ? undefined : 'A name: letters, digits and _'),
        });
        if (!name) { return; }
        const parsed = this.deps.registry.parse(this.doc) ?? provider.parseDocument(this.doc);
        const cls = caller && caller.cls.classType !== 'standalone' ? caller.cls : parsed.classes[0];
        if (!cls) { this.notice('This file has no class to add the routine to: use Add Method from the sidebar.'); return; }
        const form: MemberFormResult = {
            kind: MemberKind.Method, name, visibility: provider.getDefaultVisibility() ?? Visibility.Public, parameters: [],
            isStatic: false, isVirtual: false, isAbstract: false, isOverride: false, hasGetter: false, hasSetter: false,
        };
        const ok = await ops.applyGeneratedCode(this.doc, provider, generateFromSpec(provider, cls, memberFormToSpec(form)));
        if (!ok) { return; }
        this.deps.explorer.refresh();
        const id = (cls.isSynthetic ? '' : cls.name + '.') + name;
        if (x !== undefined && y !== undefined) { await this.deps.state.update(this.stateKey, { ...this.positions(), [id]: { x, y } }); }
        // the parse is read again before the wire is drawn
        await new Promise(r => setTimeout(r, 150));
        this.model();
        const added = this.entry(id);
        if (caller && added) { await this.addCall(this.entry(caller.id), added); } else { this.send(); }
        void this.panel.webview.postMessage({ type: 'select', id });
    }
}
