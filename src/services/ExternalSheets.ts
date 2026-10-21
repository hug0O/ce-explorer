/**
 * Style sheets that live in another form. A DevExpress grid often says `Styles.StyleSheet = dmdStyles.cxGridSheet`, where
 * `dmdStyles` is a data module of the project that holds the styles: to draw the grid with its colours the designer reads
 * that module's .dfm (next to this one, else anywhere in the workspace) and keeps what it learned until the file changes.
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SheetColors, externalSheet, sheetReferences } from './DelphiColors';
import { DfmNode, parseDfmTree } from './DelphiLayout';

interface Cached { mtime: number; root: DfmNode | undefined }

export class ExternalSheets {
    private readonly cache = new Map<string, Cached>();

    /** The sheets this form needs, by `module.sheet` in lower case; the ones that are not found are left out. */
    async load(dfm: string, dfmPath: string): Promise<Map<string, SheetColors>> {
        const out = new Map<string, SheetColors>();
        for (const { module, sheet } of sheetReferences(dfm)) {
            const root = await this.moduleRoot(module, dfmPath);
            const colors = root ? externalSheet(root, sheet) : undefined;
            if (colors) { out.set((module + '.' + sheet).toLowerCase(), colors); }
        }
        return out;
    }

    private async moduleRoot(module: string, from: string): Promise<DfmNode | undefined> {
        const file = await this.locate(module, from);
        if (!file) { return undefined; }
        try {
            const mtime = fs.statSync(file).mtimeMs;
            const hit = this.cache.get(file);
            if (hit && hit.mtime === mtime) { return hit.root; }
            const root = parseDfmTree(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
            this.cache.set(file, { mtime, root });
            return root;
        } catch { return undefined; }
    }

    private async locate(module: string, from: string): Promise<string | undefined> {
        const next = path.join(path.dirname(from), module + '.dfm');
        if (fs.existsSync(next)) { return next; }
        try {
            const found = await vscode.workspace.findFiles(`**/${module}.dfm`, '**/{node_modules,.git,__history}/**', 1);
            return found[0]?.fsPath;
        } catch { return undefined; }
    }
}
