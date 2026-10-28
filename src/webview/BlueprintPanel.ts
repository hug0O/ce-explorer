import * as vscode from 'vscode';
import { ClassInfo, ClassMember, MemberFormResult, MemberKind, Visibility } from '../models/types';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { CodeExplorerService } from '../services/CodeExplorerService';
import { CodeGeneratorService } from '../services/CodeGeneratorService';
import * as ops from '../services/MemberOperations';
import { generateFromSpec, memberFormToSpec } from '../services/memberForm';
import { addCallEdit, familyOf, removeCallEdit, LineEdit } from '../utils/callGraph';
import { BpMember, BpModel, SavedPositions, buildBlueprint, nodeIds } from '../utils/blueprintModel';
import { layout } from '../utils/blueprintLayout';
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
        if (m) { void this.panel.webview.postMessage({ type: 'model', nodes: m.nodes, edges: m.edges, fit }); }
    }

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
            case 'ready': this.send(true); break;
            case 'positions': {
                const next = { ...this.positions(), ...((m.positions ?? {}) as SavedPositions) };
                await this.deps.state.update(this.stateKey, next);
                break;
            }
            case 'resetLayout': await this.deps.state.update(this.stateKey, {}); this.send(true); break;
            case 'fullscreen': await this.setZen(m.on === true); break;
            case 'subsetLayout': this.subsetLayout(m.ids, m.key); break;
            case 'openCode': await this.openCode(this.entry(m.id)); break;
            case 'addCall': await this.addCall(this.entry(m.from), this.entry(m.to)); break;
            case 'removeCall': await this.removeCall(this.entry(m.from), this.entry(m.to)); break;
            case 'rename': await this.rename(this.entry(m.id)); break;
            case 'deleteNode': await this.deleteNode(this.entry(m.id)); break;
            case 'addNode': await this.addNode(this.entry(m.caller), typeof m.x === 'number' ? m.x : undefined, typeof m.y === 'number' ? m.y : undefined); break;
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
