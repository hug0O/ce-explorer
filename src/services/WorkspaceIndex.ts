import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { topLevelDeclarations } from '../utils/declarations';

export interface IndexedSymbol {
    name: string;
    /** Enclosing class / package name ('' for file-level routines). */
    container: string;
    kind: string;
    uri: vscode.Uri;
    line: number;
}

const EXCLUDE_GLOB = '**/{node_modules,.git,dist,out,build,bin,obj,target,.vscode-test}/**';
const MAX_FILES = 3000;
const MAX_FILE_BYTES = 1_000_000;

/**
 * Lightweight symbol index of the whole workspace: classes, members and
 * file-level routines of every supported source file. Built lazily on first
 * use, then kept current by a file watcher, so cross-file features (workspace
 * member search, "also rename in other files") never rescan the disk.
 */
export class WorkspaceIndex implements vscode.Disposable {
    private readonly files = new Map<string, { uri: vscode.Uri; symbols: IndexedSymbol[] }>();
    private building: Promise<void> | undefined;
    private built = false;
    private readonly disposables: vscode.Disposable[] = [];
    private readonly pending = new Map<string, ReturnType<typeof setTimeout>>();

    constructor(private readonly registry: ProviderRegistry) {
        const exts = registry.getSupportedExtensions().map(e => e.replace(/^\./, ''));
        if (exts.length > 0 && typeof vscode.workspace.createFileSystemWatcher === 'function') {
            const watcher = vscode.workspace.createFileSystemWatcher(`**/*.{${exts.join(',')}}`);
            this.disposables.push(
                watcher,
                watcher.onDidChange(uri => this.schedule(uri)),
                watcher.onDidCreate(uri => this.schedule(uri)),
                watcher.onDidDelete(uri => this.files.delete(uri.toString())),
            );
        }
    }

    dispose(): void {
        for (const t of this.pending.values()) { clearTimeout(t); }
        this.pending.clear();
        this.disposables.forEach(d => d.dispose());
    }

    /** Re-index a changed file shortly after the last change event (saves fire several). */
    private schedule(uri: vscode.Uri): void {
        if (!this.built) { return; }
        const key = uri.toString();
        const prev = this.pending.get(key);
        if (prev) { clearTimeout(prev); }
        this.pending.set(key, setTimeout(() => {
            this.pending.delete(key);
            void this.indexUri(uri);
        }, 400));
    }

    /** The index is built: `allSymbols` is complete (before that it holds what was read so far). */
    get ready(): boolean { return this.built; }

    async ensureBuilt(): Promise<void> {
        if (this.built) { return; }
        if (!this.building) {
            this.building = this.build().finally(() => { this.built = true; this.building = undefined; });
        }
        await this.building;
    }

    private async build(): Promise<void> {
        const exts = this.registry.getSupportedExtensions().map(e => e.replace(/^\./, ''));
        if (exts.length === 0) { return; }
        const uris = await vscode.workspace.findFiles(`**/*.{${exts.join(',')}}`, EXCLUDE_GLOB, MAX_FILES);
        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Window, title: 'CE: Indexing workspace…' },
            async () => {
                for (const uri of uris) { await this.indexUri(uri); }
            },
        );
    }

    private async readText(uri: vscode.Uri): Promise<string | undefined> {
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.size > MAX_FILE_BYTES) { return undefined; }
            return new TextDecoder('utf-8').decode(await vscode.workspace.fs.readFile(uri));
        } catch {
            return undefined;
        }
    }

    private async indexUri(uri: vscode.Uri): Promise<void> {
        const provider = this.registry.getByFileExtension(uri.fsPath);
        if (!provider) { return; }
        try {
            const doc = await vscode.workspace.openTextDocument(uri);
            if (doc.getText().length > MAX_FILE_BYTES) { return; }
            // Notes (.txt) that are not SQL / PL/SQL stay out of the index.
            if (!this.registry.acceptsText(uri.fsPath, doc.getText())) { this.files.delete(uri.toString()); return; }
            const parsed = provider.parseDocument(doc);
            const symbols: IndexedSymbol[] = [];
            for (const cls of parsed.classes) {
                symbols.push({ name: cls.name, container: '', kind: cls.classType ?? 'class', uri, line: cls.range.start.line });
                for (const m of cls.members) {
                    symbols.push({ name: m.name, container: cls.name, kind: m.kind, uri, line: (m.implementationRange ?? m.range).start.line });
                }
            }
            for (const p of parsed.standaloneProcedures) {
                symbols.push({ name: p.name, container: '', kind: 'function', uri, line: (p.implementationRange ?? p.range).start.line });
            }
            // constants, variables, types and enumeration values: what a unit exports besides its routines and classes
            const have = new Set(symbols.map(x => x.name.toLowerCase()));
            for (const d of topLevelDeclarations(doc.getText(), provider.languageId)) {
                if (have.has(d.name.toLowerCase())) { continue; }
                have.add(d.name.toLowerCase());
                symbols.push({ name: d.name, container: '', kind: d.kind, uri, line: d.line });
            }
            this.files.set(uri.toString(), { uri, symbols });
        } catch {
            this.files.delete(uri.toString());
        }
    }

    allSymbols(): IndexedSymbol[] {
        const out: IndexedSymbol[] = [];
        for (const f of this.files.values()) { out.push(...f.symbols); }
        return out;
    }

    /**
     * Indexed files (other than `exclude`) whose text mentions `word` as a whole
     * word, restricted to the given extensions. Used to warn that a rename
     * done by text search may also have references elsewhere.
     */
    async filesMentioning(word: string, extensions: string[], exclude: vscode.Uri[]): Promise<vscode.Uri[]> {
        await this.ensureBuilt();
        const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
        const skip = new Set(exclude.map(u => u.toString()));
        const result: vscode.Uri[] = [];
        for (const { uri } of this.files.values()) {
            if (skip.has(uri.toString())) { continue; }
            if (!extensions.some(e => uri.fsPath.toLowerCase().endsWith(e.toLowerCase()))) { continue; }
            const text = await this.readText(uri);
            if (text !== undefined && re.test(text)) { result.push(uri); }
        }
        return result;
    }
}
