import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { KnownForm, dprUnits } from './DelphiFormRefs';

/**
 * The units and the forms of the workspace, read once when the designer first needs them (to follow a handler to the form it opens, a panel
 * to the form put in it) and again after a unit is saved.
 */
export interface ProjectIndex { forms: KnownForm[]; units: Map<string, string> }

let cache: Promise<ProjectIndex> | undefined;
let watching = false;

export function invalidateProjectIndex(): void { cache = undefined; }

const MAX_UNITS = 4000;
const MAX_BYTES = 3_000_000;

async function build(): Promise<ProjectIndex> {
    const files = await vscode.workspace.findFiles('**/*.pas', '**/{node_modules,.git}/**', MAX_UNITS);
    const units = new Map<string, string>();
    const forms: KnownForm[] = [];
    for (const f of files) {
        try {
            const stat = await fs.promises.stat(f.fsPath);
            if (stat.size > MAX_BYTES) { continue; }
            const text = await fs.promises.readFile(f.fsPath, 'latin1');
            units.set(f.fsPath, text);
            const dfm = ['.dfm', '.DFM', '.Dfm'].map(e => f.fsPath.replace(/\.pas$/i, e)).find(p => fs.existsSync(p));
            if (!dfm) { continue; }
            const head = (await fs.promises.readFile(dfm, 'latin1')).slice(0, 400);
            const m = /^\s*(?:object|inherited|inline)\s+\w+\s*:\s*(\w+)/i.exec(head);
            if (!m) { continue; }
            const className = m[1];
            const vars = [...text.matchAll(new RegExp('\\b(\\w+)\\s*:\\s*' + className + '\\s*;', 'gi'))].map(v => v[1]);
            forms.push({ className, vars, pas: f.fsPath, dfm });
        } catch { /* an unreadable file is left out */ }
    }
    // the .dpr says how the project names each form: `Unit in 'dir\\Unit.pas' {frmName}` (a form can be opened by that name)
    const dprs = await vscode.workspace.findFiles('**/*.dpr', '**/{node_modules,.git}/**', 40);
    for (const d of dprs) {
        try {
            const text = await fs.promises.readFile(d.fsPath, 'latin1');
            for (const u of dprUnits(text)) {
                const pas = path.resolve(path.dirname(d.fsPath), u.path.replace(/\\/g, '/'));
                const known = forms.find(f => f.pas.toLowerCase() === pas.toLowerCase());
                const names = [u.unit, ...(u.form ? [u.form] : [])];
                if (known) { known.names = [...new Set([...(known.names ?? []), ...names])]; continue; }
                const dfm = pas.replace(/\.pas$/i, '.dfm');
                if (!u.form || !fs.existsSync(pas) || !fs.existsSync(dfm)) { continue; }
                const head = (await fs.promises.readFile(dfm, 'latin1')).slice(0, 400);
                const m = /^\s*(?:object|inherited|inline)\s+\w+\s*:\s*(\w+)/i.exec(head);
                if (m) { forms.push({ className: m[1], vars: [u.form], pas, dfm, names }); }
            }
        } catch { /* a project file that cannot be read is left out */ }
    }
    return { forms, units };
}

export function projectIndex(): Promise<ProjectIndex> {
    if (!watching) {
        watching = true;
        vscode.workspace.onDidSaveTextDocument(d => { if (/\.(pas|dfm)$/i.test(d.fileName)) { invalidateProjectIndex(); } });
    }
    cache ??= build();
    return cache;
}
