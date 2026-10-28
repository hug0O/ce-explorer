import * as vscode from 'vscode';
import { BlueprintPanel } from './BlueprintPanel';
import { blueprintHtml } from './blueprintHtml';
import { SavedPositions } from '../utils/blueprintModel';
import { layout } from '../utils/blueprintLayout';
import { analyze } from '../utils/blueprintAnalysis';
import { toMermaid, toSvg } from '../utils/blueprintExport';
import { UnitGraph, UnitInfo, addUses, buildUnitGraph, readUnit, removeUses } from '../utils/unitGraph';

const SOURCE_GLOB = '**/*.{pas,dpr,dpk}';
const EXCLUDE = '**/{node_modules,__history,__recovery,.git,Win32,Win64,Debug,Release}/**';
const MAX_FILES = 3000;

function nonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 32; i++) { s += chars.charAt(Math.floor(Math.random() * chars.length)); }
    return s;
}

/**
 * The Blueprint of a Delphi project: a node per unit, a wire per `uses`. Dragging a wire from one unit to another adds the unit to the
 * `uses` of the first (implementation section), deleting a wire removes it; double-click opens the unit, and the details panel opens the
 * Blueprint of its routines.
 */
export class ProjectBlueprintPanel {
    private static current: ProjectBlueprintPanel | undefined;
    private static state: vscode.Memento | undefined;

    static configure(state: vscode.Memento): void {
        ProjectBlueprintPanel.state = state;
        BlueprintPanel.projectPanelActive = () => {
            const p = ProjectBlueprintPanel.current;
            if (p?.panel.active) { void p.panel.webview.postMessage({ type: 'toggleFull' }); return true; }
            return false;
        };
    }

    static show(): void {
        if (!vscode.workspace.workspaceFolders?.length) { vscode.window.showWarningMessage('CE: Open a folder with Delphi sources to draw its units.'); return; }
        if (ProjectBlueprintPanel.current) { ProjectBlueprintPanel.current.panel.reveal(); return; }
        const panel = vscode.window.createWebviewPanel('ceBlueprint', 'Blueprint: project', vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true });
        ProjectBlueprintPanel.current = new ProjectBlueprintPanel(panel);
    }

    private graph: UnitGraph = { nodes: [], edges: [], external: new Map() };
    private timer: NodeJS.Timeout | undefined;
    private zen = false;
    private readonly subs: vscode.Disposable[] = [];
    private readonly stateKey = 'ce.blueprint.project.' + (vscode.workspace.workspaceFolders?.[0]?.uri.toString() ?? '');

    private constructor(private readonly panel: vscode.WebviewPanel) {
        const n = nonce();
        panel.webview.html = blueprintHtml({ nonce: n, cspSource: panel.webview.cspSource, title: 'Project: units and uses' });
        this.subs.push(
            panel.webview.onDidReceiveMessage(m => { void this.onMessage(m as Record<string, unknown>); }),
            vscode.workspace.onDidSaveTextDocument(d => { if (/\.(pas|dpr|dpk)$/i.test(d.uri.fsPath)) { this.later(); } }),
            panel.onDidDispose(() => {
                if (this.timer) { clearTimeout(this.timer); }
                if (this.zen) { void this.setZen(false); }
                ProjectBlueprintPanel.current = undefined;
                this.subs.forEach(s => s.dispose());
            }),
        );
    }

    private later(): void {
        if (this.timer) { clearTimeout(this.timer); }
        this.timer = setTimeout(() => { void this.send(true); }, 500);
    }

    private positions(): SavedPositions { return ProjectBlueprintPanel.state?.get<SavedPositions>(this.stateKey, {}) ?? {}; }

    /** Reads every source file of the project again and draws the units. */
    private async scan(): Promise<void> {
        const files = await vscode.workspace.findFiles(SOURCE_GLOB, EXCLUDE, MAX_FILES);
        const units: UnitInfo[] = [];
        for (const f of files) {
            try {
                const bytes = await vscode.workspace.fs.readFile(f);
                const u = readUnit(Buffer.from(bytes).toString('latin1'), f.toString());
                if (u) { units.push(u); }
            } catch { /* a file that cannot be read is left out */ }
        }
        this.graph = buildUnitGraph(units, this.positions());
        if (files.length >= MAX_FILES) { this.notice('Only the first ' + MAX_FILES + ' files are read.'); }
    }

    private async send(rescan: boolean, fit = false): Promise<void> {
        if (rescan || !this.graph.nodes.length) { await this.scan(); }
        // a unit that nobody uses is "unused"; only the `interface` uses make a loop that Delphi refuses
        const ids = this.graph.nodes.map(n => n.id);
        const interfaceEdges = this.graph.edges.filter(e => e.section === 'interface');
        const analysis = analyze(ids, interfaceEdges, this.graph.nodes.filter(n => n.kind === 'program').map(n => n.id));
        void this.panel.webview.postMessage({
            type: 'model', mode: 'project', nodes: this.graph.nodes, edges: this.graph.edges, analysis, fit,
        });
    }

    private notice(text: string): void { void this.panel.webview.postMessage({ type: 'notice', text }); }

    private node(id: unknown): UnitGraph['nodes'][number] | undefined { return typeof id === 'string' ? this.graph.nodes.find(n => n.id === id) : undefined; }

    private async onMessage(m: Record<string, unknown>): Promise<void> {
        switch (m.type) {
            case 'ready': await this.send(true, true); break;
            case 'positions': await ProjectBlueprintPanel.state?.update(this.stateKey, { ...this.positions(), ...((m.positions ?? {}) as SavedPositions) }); break;
            case 'resetLayout': await ProjectBlueprintPanel.state?.update(this.stateKey, {}); await this.send(false, true); break;
            case 'openCode': await this.openUnit(this.node(m.id), false); break;
            case 'openUnit': await this.openUnit(this.node(m.id), true); break;
            case 'addCall': await this.changeUses(this.node(m.from), this.node(m.to), true); break;
            case 'removeCall': await this.changeUses(this.node(m.from), this.node(m.to), false); break;
            case 'subsetLayout': this.subsetLayout(m.ids, m.key); break;
            case 'export': await this.exportGraph(m.format === 'svg' ? 'svg' : 'mermaid'); break;
            case 'fullscreen': await this.setZen(m.on === true); break;
            case 'openProject': break;
            default: break;
        }
    }

    private async openUnit(n: UnitGraph['nodes'][number] | undefined, asBlueprint: boolean): Promise<void> {
        if (!n?.file) { return; }
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(n.file));
        if (asBlueprint) {
            if (n.kind !== 'unit') { this.notice(n.name + ' is a program file: it has no routines of its own to draw.'); return; }
            BlueprintPanel.show(doc);
            return;
        }
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One });
    }

    /** A wire dragged between two units writes the `uses`; a wire removed takes it out. */
    private async changeUses(from: UnitGraph['nodes'][number] | undefined, to: UnitGraph['nodes'][number] | undefined, add: boolean): Promise<void> {
        if (!from?.file || !to) { return; }
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(from.file));
        const before = doc.getText();
        const after = add ? addUses(before, to.name) : removeUses(before, to.name);
        if (after === undefined) { this.notice(add ? from.name + ' already uses ' + to.name + ', or has no place for a uses clause.' : 'No uses clause of ' + from.name + ' names ' + to.name + '.'); return; }
        const we = new vscode.WorkspaceEdit();
        we.replace(doc.uri, new vscode.Range(0, 0, doc.lineCount, 0), after);
        if (await vscode.workspace.applyEdit(we)) {
            this.notice(add ? from.name + ' now uses ' + to.name + ' (implementation section). Save to see the graph updated; Ctrl+Z in the unit undoes it.' : from.name + ' no longer uses ' + to.name + '. Save to see the graph updated.');
            // the unit is changed in memory: draw it from there without waiting for the save
            const u = readUnit(after, from.file);
            if (u) { await this.redraw(u); }
        }
    }

    private async redraw(changed: UnitInfo): Promise<void> {
        const infos: UnitInfo[] = [];
        for (const n of this.graph.nodes) {
            if (n.file === changed.file) { infos.push(changed); continue; }
            // the other units keep what was read: rebuild their uses from the current edges
            const uses = this.graph.edges.filter(e => e.from === n.id).map(e => ({ name: e.to, section: e.section, line: e.lines[0] ?? 0 }))
                .concat((n.external ?? []).map(name => ({ name, section: 'interface' as const, line: 0 })));
            infos.push({ name: n.name, kind: n.kind === 'program' ? 'program' : 'unit', uses, file: n.file ?? '' });
        }
        this.graph = buildUnitGraph(infos, this.positions());
        await this.send(false);
    }

    private subsetLayout(ids: unknown, key: unknown): void {
        if (!Array.isArray(ids) || typeof key !== 'string') { return; }
        const set = new Set(ids.filter((i): i is string => typeof i === 'string'));
        const nodes = this.graph.nodes.filter(n => set.has(n.id));
        const boxes = layout(nodes.map(n => ({ id: n.id, title: n.name, inputs: 1, outputs: 1 })), this.graph.edges.filter(e => set.has(e.from) && set.has(e.to)));
        const positions: Record<string, { x: number; y: number }> = {};
        for (const [id, b] of boxes) { positions[id] = { x: b.x, y: b.y }; }
        void this.panel.webview.postMessage({ type: 'subset', key, positions });
    }

    private async exportGraph(format: 'svg' | 'mermaid'): Promise<void> {
        if (!this.graph.nodes.length) { this.notice('Nothing to export.'); return; }
        if (format === 'mermaid') {
            await vscode.env.clipboard.writeText(toMermaid(this.graph.nodes, this.graph.edges));
            this.notice('Mermaid flowchart copied: paste it in a README or a wiki.');
            return;
        }
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
        const target = await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file(root + '/project-blueprint.svg'), filters: { 'SVG picture': ['svg'] }, title: 'Save the project blueprint as a picture' });
        if (!target) { return; }
        await vscode.workspace.fs.writeFile(target, Buffer.from(toSvg(this.graph.nodes, this.graph.edges), 'utf8'));
        this.notice('Saved ' + target.fsPath.split(/[\\/]/).pop());
    }

    private async setZen(on: boolean): Promise<void> {
        if (on === this.zen) { return; }
        this.zen = on;
        if (!await BlueprintPanel.applyZen(on)) { this.zen = !on; }
    }
}
