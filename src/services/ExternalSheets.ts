/**
 * Style sheets that live in another form. A DevExpress grid often says `Styles.StyleSheet = dmdStyles.cxGridSheet`, where
 * `dmdStyles` is a data module of the project that holds the styles in a style repository (and the sheets, with their
 * children): to draw the grid with its colours the designer reads that module's .dfm and keeps what it learned until the file
 * changes. The module is a form of its own unit, which the form's unit lists in its `uses`: that is where the file is looked for
 * first.
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SheetColors, externalSheet, moduleCandidates, sheetReferences } from './DelphiColors';
import { DfmNode, parseDfmTree } from './DelphiLayout';

interface Cached { mtime: number; root: DfmNode | undefined }

/** How long the list of the .dfm files of the workspace is trusted. */
const LIST_MS = 60_000;

export class ExternalSheets {
    private readonly cache = new Map<string, Cached>();
    private files = new Map<string, string>();
    private listedAt = 0;

    /** The sheets this form needs, by `module.sheet` in lower case; the ones that are not found are left out. `uses`: the units its unit lists. */
    async load(dfm: string, dfmPath: string, uses: string[] = []): Promise<Map<string, SheetColors>> {
        const out = new Map<string, SheetColors>();
        const refs = sheetReferences(dfm);
        if (refs.length === 0) { return out; }
        await this.list(dfmPath);
        for (const { module, sheet } of refs) {
            const root = this.moduleRoot(module, uses);
            const colors = root ? externalSheet(root, sheet) : undefined;
            if (colors) { out.set((module + '.' + sheet).toLowerCase(), colors); }
        }
        return out;
    }

    /** The data module: the first candidate file whose form is called so. */
    private moduleRoot(module: string, uses: string[]): DfmNode | undefined {
        for (const file of moduleCandidates(module, uses, this.files)) {
            const root = this.read(file);
            if (root && root.name.toLowerCase() === module.toLowerCase()) { return root; }
        }
        return undefined;
    }

    private read(file: string): DfmNode | undefined {
        try {
            const mtime = fs.statSync(file).mtimeMs;
            const hit = this.cache.get(file);
            if (hit && hit.mtime === mtime) { return hit.root; }
            const root = parseDfmTree(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
            this.cache.set(file, { mtime, root });
            return root;
        } catch { return undefined; }
    }

    /** The .dfm files around the form and in the workspace, by name without extension. */
    private async list(from: string): Promise<void> {
        if (Date.now() - this.listedAt < LIST_MS && this.files.size) { return; }
        const files = new Map<string, string>();
        const add = (p: string): void => { const b = path.basename(p).replace(/\.dfm$/i, '').toLowerCase(); if (!files.has(b)) { files.set(b, p); } };
        try { for (const f of fs.readdirSync(path.dirname(from))) { if (/\.dfm$/i.test(f)) { add(path.join(path.dirname(from), f)); } } } catch { /* an unreadable folder: the workspace list below */ }
        try {
            const found = await vscode.workspace.findFiles('**/*.dfm', '**/{node_modules,.git,__history,__recovery}/**', 6000);
            found.forEach(u => add(u.fsPath));
        } catch { /* no workspace */ }
        this.files = files;
        this.listedAt = Date.now();
    }
}
