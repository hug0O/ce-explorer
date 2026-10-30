import * as vscode from 'vscode';
import { hitMessage } from '../services/UsageStats';
import { BlueprintPanel } from './BlueprintPanel';
import { blueprintHtml } from './blueprintHtml';
import { SavedPositions } from '../utils/blueprintModel';
import { layout } from '../utils/blueprintLayout';
import { analyze } from '../utils/blueprintAnalysis';
import { toMermaid, toSvg } from '../utils/blueprintExport';
import { UnitGraph, UnitInfo, addUses, buildUnitGraph, readUnit, removeUses } from '../utils/unitGraph';
import { unitFacts } from '../services/ProjectUnused';
import { pool } from '../utils/pool';
import { actionLog } from '../services/ActionLog';
import { MODULE_GROUPS, ModuleGroup, ModuleSource, buildModules, globOf, groupOfLanguage } from '../utils/moduleGraph';

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
/** What was read of each file, kept while the editor runs: a file that has not changed (same date and size) is not read again. */
const CACHE = new Map<string, { stamp: string; unit: UnitInfo | undefined }>();
const PARALLEL = 24;

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

    /** `group`: the language of the project to draw (the files of that language and their imports); Delphi when none is given. */
    static show(column?: vscode.ViewColumn, group?: ModuleGroup | 'pascal'): void {
        if (!vscode.workspace.workspaceFolders?.length) { vscode.window.showWarningMessage('CE: Open a folder with sources to draw its files.'); return; }
        const want = group ?? 'pascal';
        const cur = ProjectBlueprintPanel.current;
        if (cur) {
            cur.panel.reveal();
            if (group && cur.group !== want) { cur.group = want; cur.retitle(); void cur.load(true); }
            return;
        }
        const panel = vscode.window.createWebviewPanel('ceBlueprint', 'Blueprint: project', column ?? vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true });
        ProjectBlueprintPanel.current = new ProjectBlueprintPanel(panel, want);
    }

    /** The group of drawing of a language id: Delphi, or the group of files and imports of that language. */
    static groupOfLanguage(languageId: string | undefined): ModuleGroup | 'pascal' | undefined {
        return languageId === 'pascal' ? 'pascal' : languageId ? groupOfLanguage(languageId) : undefined;
    }

    private graph: UnitGraph = { nodes: [], edges: [], external: new Map(), unneeded: [] };
    private symbols = new Map<string, UnitInfo['symbols']>();
    /** The number of the load in progress: a later one makes an earlier one stop. */
    private run = 0;
    private timer: NodeJS.Timeout | undefined;
    private zen = false;
    private readonly subs: vscode.Disposable[] = [];
    private readonly stateKey = 'ce.blueprint.project.' + (vscode.workspace.workspaceFolders?.[0]?.uri.toString() ?? '');

    private group: ModuleGroup | 'pascal';

    private constructor(private readonly panel: vscode.WebviewPanel, group: ModuleGroup | 'pascal') {
        this.group = group;
        const n = nonce();
        panel.webview.html = blueprintHtml({ nonce: n, cspSource: panel.webview.cspSource, title: group === 'pascal' ? 'Project: units and uses' : 'Project: files and imports' });
        this.subs.push(
            panel.webview.onDidReceiveMessage(m => { void this.onMessage(m as Record<string, unknown>); }),
            vscode.workspace.onDidSaveTextDocument(d => {
                const mine = this.group === 'pascal' ? /\.(pas|dpr|dpk)$/i.test(d.uri.fsPath) : MODULE_GROUPS[this.group].exts.some(e => d.uri.fsPath.toLowerCase().endsWith('.' + e));
                if (mine) { this.later(); }
            }),
            panel.onDidDispose(() => {
                if (this.timer) { clearTimeout(this.timer); }
                if (this.zen) { void this.setZen(false); }
                ProjectBlueprintPanel.current = undefined;
                this.subs.forEach(s => s.dispose());
            }),
        );
    }

    private retitle(): void {
        this.panel.title = this.group === 'pascal' ? 'Blueprint: project' : 'Blueprint: project (' + MODULE_GROUPS[this.group].label + ')';
    }

    private later(): void {
        if (this.timer) { clearTimeout(this.timer); }
        this.timer = setTimeout(() => { void this.load(false); }, 500);
    }

    private positions(): SavedPositions { return ProjectBlueprintPanel.state?.get<SavedPositions>(this.stateKey, {}) ?? {}; }

    private loading(text: string): void { void this.panel.webview.postMessage({ type: 'loading', text }); }

    /**
     * Reads the project in two steps so that the picture comes quickly: first the header and the `uses` of every file (read in parallel, and
     * not again when the file is unchanged), drawn at once; then, in small steps that leave the editor free, the names each unit offers and
     * uses, which add what every wire carries.
     */
    private async load(fit: boolean): Promise<void> {
        const run = ++this.run;
        const units = this.group === 'pascal' ? await this.readAll(run) : await this.readModules(run, this.group);
        if (run !== this.run) { return; }
        this.graph = buildUnitGraph(units, this.positions());
        this.postModel(fit);
        if (this.group === 'pascal') { await this.analyse(units, run); } else { this.loading(''); }
    }

    /** A project in another language: its files, read in parallel, and the imports that name another file of the project. */
    private async readModules(run: number, group: ModuleGroup): Promise<UnitInfo[]> {
        const files = await vscode.workspace.findFiles(globOf(group), EXCLUDE, MAX_FILES);
        const sources: (ModuleSource | undefined)[] = new Array(files.length).fill(undefined);
        let done = 0;
        let last = 0;
        await pool(files, PARALLEL, async (f, i) => {
            if (run !== this.run) { return; }
            try {
                const text = Buffer.from(await vscode.workspace.fs.readFile(f)).toString('utf8');
                sources[i] = { path: vscode.workspace.asRelativePath(f, false).split('\\').join('/'), file: f.toString(), text };
            } catch { /* a file that cannot be read is left out */ }
            done++;
            if (Date.now() - last > 150) { last = Date.now(); this.loading('Reading the files... ' + done + ' / ' + files.length); }
        });
        if (files.length >= MAX_FILES) { this.notice('Only the first ' + MAX_FILES + ' files are read.'); }
        return buildModules(sources.filter((x): x is ModuleSource => !!x), group);
    }

    /** Step 1: the units and their `uses`. */
    private async readAll(run: number): Promise<UnitInfo[]> {
        const files = await vscode.workspace.findFiles(SOURCE_GLOB, EXCLUDE, MAX_FILES);
        const units: (UnitInfo | undefined)[] = new Array(files.length).fill(undefined);
        let done = 0;
        let last = 0;
        await pool(files, PARALLEL, async (f, i) => {
            if (run !== this.run) { return; }
            const key = f.toString();
            try {
                const st = await vscode.workspace.fs.stat(f);
                const stamp = st.mtime + ':' + st.size;
                const hit = CACHE.get(key);
                if (hit && hit.stamp === stamp) { units[i] = hit.unit; }
                else {
                    const text = Buffer.from(await vscode.workspace.fs.readFile(f)).toString('latin1');
                    const unit = readUnit(text, key);
                    CACHE.set(key, { stamp, unit });
                    units[i] = unit;
                }
            } catch { /* a file that cannot be read is left out */ }
            done++;
            if (Date.now() - last > 150) { last = Date.now(); this.loading('Reading the units... ' + done + ' / ' + files.length); }
        });
        if (files.length >= MAX_FILES) { this.notice('Only the first ' + MAX_FILES + ' files are read.'); }
        return units.filter((u): u is UnitInfo => !!u);
    }

    /** Step 2: what each unit offers and mentions, to say what a `uses` takes. The graph is drawn again when it is done. */
    private async analyse(units: UnitInfo[], run: number): Promise<void> {
        const todo = units.filter(u => u.kind === 'unit' && !u.symbols);
        let done = 0;
        let last = 0;
        for (const u of todo) {
            if (run !== this.run) { return; }
            try {
                const text = Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.parse(u.file))).toString('latin1');
                const facts = unitFacts(text);
                if (facts) { u.symbols = { exported: facts.exported, words: facts.words }; }
            } catch { /* left without symbols: nothing is claimed about its uses */ }
            done++;
            if (Date.now() - last > 150) {
                last = Date.now();
                this.loading('Looking at what each unit takes... ' + done + ' / ' + todo.length);
                await new Promise(r => setTimeout(r, 0));   // the editor stays free
            }
        }
        if (run !== this.run) { return; }
        for (const u of units) { if (u.symbols) { this.symbols.set(u.name, u.symbols); } }
        this.graph = buildUnitGraph(units, this.positions());
        this.postModel(false);
        this.loading('');
    }

    private postModel(fit: boolean): void {
        // a unit that nobody uses is "unused"; only the `interface` uses make a loop that Delphi refuses
        const ids = this.graph.nodes.map(n => n.id);
        const interfaceEdges = this.group === 'pascal' ? this.graph.edges.filter(e => e.section === 'interface') : this.graph.edges;
        const analysis = { ...analyze(ids, interfaceEdges, this.graph.nodes.filter(n => n.kind === 'program').map(n => n.id)), unneeded: this.graph.unneeded };
        void this.panel.webview.postMessage({
            type: 'model', mode: 'project', nodes: this.graph.nodes, edges: this.graph.edges, analysis, fit,
            words: this.group === 'pascal' ? { unit: 'unit', units: 'units', uses: 'uses' } : { unit: 'file', units: 'files', uses: 'imports' },
        });
    }

    private notice(text: string): void { void this.panel.webview.postMessage({ type: 'notice', text }); }

    private node(id: unknown): UnitGraph['nodes'][number] | undefined { return typeof id === 'string' ? this.graph.nodes.find(n => n.id === id) : undefined; }

    private async onMessage(m: Record<string, unknown>): Promise<void> {
        hitMessage('blueprint', m.type);
        switch (m.type) {
            case 'ready': await this.load(true); break;
            case 'positions': await ProjectBlueprintPanel.state?.update(this.stateKey, { ...this.positions(), ...((m.positions ?? {}) as SavedPositions) }); break;
            case 'resetLayout': await ProjectBlueprintPanel.state?.update(this.stateKey, {}); this.graph = buildUnitGraph(this.graph.nodes.map(n => this.unitOf(n)), {}); this.postModel(true); break;
            case 'openCode': await this.openUnit(this.node(m.id), false); break;
            case 'openUnit': await this.openUnit(this.node(m.id), true); break;
            case 'addCall': await this.changeUses(this.node(m.from), this.node(m.to), true); break;
            case 'removeCall': await this.changeUses(this.node(m.from), this.node(m.to), false); break;
            case 'subsetLayout': this.subsetLayout(m.ids, m.key); break;
            case 'export': await this.exportGraph(m.format === 'svg' ? 'svg' : 'mermaid'); break;
            case 'fullscreen': await this.setZen(m.on === true); break;
            case 'switchView': if (m.to === 'file') { this.showFile(); } break;
            default: break;
        }
    }

    /** The File button: the blueprint of the last file drawn, else of the file being edited. */
    private showFile(): void {
        const supported = (d: vscode.TextDocument | undefined): d is vscode.TextDocument => !!d && d.uri.scheme === 'file' && /\.(pas|dpr|dpk|cpp|h|hpp|cc|cs|java|go|rs|py|ts|tsx|js|jsx|ps1|psm1|sh|bash|bat|cmd|pks|pkb|sql)$/i.test(d.uri.fsPath);
        const doc = BlueprintPanel.lastDoc ?? [vscode.window.activeTextEditor?.document, ...vscode.window.visibleTextEditors.map(e => e.document)].find(supported);
        if (!doc) { this.notice('Open a source file, or double-click a unit, to see the blueprint of its routines.'); return; }
        BlueprintPanel.show(doc, this.panel.viewColumn);
    }

    private async openUnit(n: UnitGraph['nodes'][number] | undefined, asBlueprint: boolean): Promise<void> {
        if (!n?.file) { return; }
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(n.file));
        if (asBlueprint) {
            if (n.kind !== 'unit') { this.notice(n.name + ' is a program file: it has no routines of its own to draw.'); return; }
            BlueprintPanel.show(doc, this.panel.viewColumn);
            return;
        }
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One });
    }

    /** A wire dragged between two units writes the `uses`; a wire removed takes it out. */
    private async changeUses(from: UnitGraph['nodes'][number] | undefined, to: UnitGraph['nodes'][number] | undefined, add: boolean): Promise<void> {
        if (!from?.file || !to) { return; }
        if (this.group !== 'pascal') { this.notice('The wires are read from the import lines: change the import in the file itself (double-click opens it). Only Delphi uses clauses are written from here.'); return; }
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(from.file));
        const before = doc.getText();
        const after = add ? addUses(before, to.name) : removeUses(before, to.name);
        if (after === undefined) { this.notice(add ? from.name + ' already uses ' + to.name + ', or has no place for a uses clause.' : 'No uses clause of ' + from.name + ' names ' + to.name + '.'); return; }
        const we = new vscode.WorkspaceEdit();
        we.replace(doc.uri, new vscode.Range(0, 0, doc.lineCount, 0), after);
        if (await vscode.workspace.applyEdit(we)) {
            actionLog.record('Blueprint: ' + (add ? from.name + ' now uses ' + to.name : from.name + ' no longer uses ' + to.name), doc.uri.fsPath);
            this.notice(add ? from.name + ' now uses ' + to.name + ' (implementation section). Save to see the graph updated; Ctrl+Z in the unit undoes it.' : from.name + ' no longer uses ' + to.name + '. Save to see the graph updated.');
            // the unit is changed in memory: draw it from there without waiting for the save
            const u = readUnit(after, from.file);
            if (u) { u.symbols = this.symbols.get(u.name); this.redraw(u); }
        }
    }

    /** A unit rebuilt from the graph (its uses from the wires, the others from what was listed as outside the project). */
    private unitOf(n: UnitGraph['nodes'][number]): UnitInfo {
        const uses = this.graph.edges.filter(e => e.from === n.id).map(e => ({ name: e.to, section: e.section, line: e.lines[0] ?? 0 }))
            .concat((n.external ?? []).map(name => ({ name, section: 'interface' as const, line: 0 })));
        return { name: n.name, kind: n.kind === 'program' ? 'program' : 'unit', uses, file: n.file ?? '', symbols: this.symbols.get(n.name) };
    }

    private redraw(changed: UnitInfo): void {
        const infos: UnitInfo[] = this.graph.nodes.map(n => (n.file === changed.file ? changed : this.unitOf(n)));
        this.graph = buildUnitGraph(infos, this.positions());
        this.postModel(false);
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
