import * as vscode from 'vscode';
import * as path from 'path';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { topLevelDeclarations } from '../utils/declarations';
import { ExternalSymbol, UsedRefs, externalLabel, isUsed } from '../utils/usedFiles';
import { extensionsLike } from '../utils/renameScan';

const EXCLUDE = '{**/node_modules/**,**/.git/**,**/__history/**,**/__recovery/**,**/dist/**,**/out/**,**/build/**,**/bin/**,**/obj/**,**/target/**,**/Win32/**,**/Win64/**}';
const MAX_FILE_BYTES = 1_000_000;
/** A file that points to more files than that: the first ones are read (a unit of a big project uses a few dozen). */
const MAX_USED_FILES = 300;
const SCRIPT_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'];

interface FileSymbols { mtime: number; size: number; symbols: { name: string; container: string; kind: string; line: number }[] }

/** A text document made of a text, for the parsers of the languages (they read the text, the lines and the name). */
function shimDocument(uri: vscode.Uri, languageId: string, text: string): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    return {
        uri, fileName: uri.fsPath, languageId, version: 1, lineCount: lines.length, getText: () => text,
        lineAt: (n: number) => ({ text: lines[n] ?? '', lineNumber: n, range: new vscode.Range(n, 0, n, (lines[n] ?? '').length), isEmptyOrWhitespace: !(lines[n] ?? '').trim() }),
    } as unknown as vscode.TextDocument;
}

/** The files with their extension that a file can point to: its own family. */
function familyExtensions(ext: string): string[] {
    const e = ext.toLowerCase().replace(/^\./, '');
    if (SCRIPT_EXTENSIONS.includes(e)) { return SCRIPT_EXTENSIONS; }
    return extensionsLike(e);
}

/** Runs `fn` on the items, a few at a time. */
async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
        while (next < items.length) { const item = items[next++]; await fn(item); }
    }));
}

/**
 * The objects of the files that one file points to, for a project of any size: the files are listed by name (no reading), the few that the file
 * uses are read without being opened in the editor, and what was read is kept by the date of the file. Nothing scales with the number of files of
 * the project except the listing of their names; the parsing is for the dozens a file uses.
 */
export class UsedFilesIndex implements vscode.Disposable {
    private readonly listings = new Map<string, Promise<vscode.Uri[]>>();
    private readonly parsed = new Map<string, FileSymbols>();
    private readonly disposables: vscode.Disposable[] = [];

    constructor(private readonly registry: ProviderRegistry) {
        if (typeof vscode.workspace.createFileSystemWatcher === 'function') {
            // a file created or deleted changes the listings; a changed one is noticed by its date when it is read again
            const watcher = vscode.workspace.createFileSystemWatcher('**/*');
            this.disposables.push(watcher, watcher.onDidCreate(() => this.listings.clear()), watcher.onDidDelete(() => this.listings.clear()));
        }
    }

    dispose(): void { this.disposables.forEach(d => d.dispose()); }

    /** The names of the files of these extensions, listed once (the search of the editor does it in a moment, whatever the size). */
    private files(exts: string[]): Promise<vscode.Uri[]> {
        const supported = new Set(this.registry.getSupportedExtensions().map(e => e.replace(/^\./, '').toLowerCase()));
        const wanted = exts.filter(e => supported.has(e));
        if (!wanted.length) { return Promise.resolve([]); }
        const glob = wanted.length > 1 ? `**/*.{${wanted.join(',')}}` : `**/*.${wanted[0]}`;
        let list = this.listings.get(glob);
        if (!list) {
            list = Promise.resolve(vscode.workspace.findFiles(glob, EXCLUDE)).then(r => [...r], () => []);
            this.listings.set(glob, list);
        }
        return list;
    }

    /** The objects of one file, from what was read before when the file has not changed. */
    private async symbolsOf(uri: vscode.Uri): Promise<FileSymbols['symbols']> {
        const key = uri.toString();
        try {
            const st = await vscode.workspace.fs.stat(uri);
            const hit = this.parsed.get(key);
            if (hit && hit.mtime === st.mtime && hit.size === st.size) { return hit.symbols; }
            if (st.size > MAX_FILE_BYTES) { return []; }
            const provider = this.registry.getByFileExtension(uri.fsPath);
            if (!provider) { return []; }
            const text = new TextDecoder('utf-8').decode(await vscode.workspace.fs.readFile(uri));
            if (!this.registry.acceptsText(uri.fsPath, text)) { return []; }
            const symbols: FileSymbols['symbols'] = [];
            try {
                const parsed = provider.parseDocument(shimDocument(uri, provider.languageId, text));
                for (const cls of parsed.classes) {
                    symbols.push({ name: cls.name, container: '', kind: cls.classType ?? 'class', line: cls.range.start.line });
                    // a constructor or a destructor is `Create` / `Destroy` in every class: it says nothing about what the file uses, and it would be listed for each class
                    for (const m of cls.members) { if (m.kind !== 'constructor' && m.kind !== 'destructor') { symbols.push({ name: m.name, container: cls.name, kind: m.kind, line: (m.implementationRange ?? m.range).start.line }); } }
                }
                for (const p of parsed.standaloneProcedures) { symbols.push({ name: p.name, container: '', kind: 'function', line: (p.implementationRange ?? p.range).start.line }); }
            } catch { /* a file the parser cannot read still has its constants and types */ }
            // overloads and a declaration written twice are one object
            const once = new Set<string>();
            const unique = symbols.filter(x => { const k = (x.container + '.' + x.name).toLowerCase(); if (once.has(k)) { return false; } once.add(k); return true; });
            symbols.length = 0;
            symbols.push(...unique);
            const have = new Set(symbols.map(s => s.name.toLowerCase()));
            for (const d of topLevelDeclarations(text, provider.languageId)) {
                if (!have.has(d.name.toLowerCase())) { have.add(d.name.toLowerCase()); symbols.push({ name: d.name, container: '', kind: d.kind, line: d.line }); }
            }
            this.parsed.set(key, { mtime: st.mtime, size: st.size, symbols });
            return symbols;
        } catch { return []; }
    }

    /** The objects of the files that `refs` points to, written `<file>.<object>`; `self` (the file that points) is left out. */
    async externalFor(refs: UsedRefs, fsPath: string): Promise<ExternalSymbol[]> {
        const all = await this.files(familyExtensions(path.extname(fsPath)));
        const self = fsPath.toLowerCase();
        const used = all.filter(u => u.fsPath.toLowerCase() !== self && isUsed(refs, u.fsPath)).slice(0, MAX_USED_FILES);
        const out: ExternalSymbol[] = [];
        const perFile = new Map<string, ExternalSymbol[]>();
        await pool(used, 8, async uri => {
            const list = (await this.symbolsOf(uri)).map(s => ({ label: externalLabel(uri.fsPath, s.container, s.name), name: s.name, container: s.container, kind: s.kind, path: uri.fsPath, line: s.line }));
            perFile.set(uri.fsPath, list);
        });
        // the files in the order they were listed, whatever the order they were read in
        // the same unit twice in the project (a copy) is listed once
        const seen = new Set<string>();
        for (const uri of used) {
            for (const sym of perFile.get(uri.fsPath) ?? []) {
                const key = sym.label.toLowerCase();
                if (!seen.has(key)) { seen.add(key); out.push(sym); }
            }
        }
        return out;
    }
}
