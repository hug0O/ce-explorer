/**
 * What the designer remembers about a form that is not in its .dfm: the groups of components the user named, the components
 * locked against the mouse, and the ones hidden to see what is behind. Kept per form, in the workspace storage of VS Code.
 * (The layouts saved to be inserted in other forms are kept for every workspace.)
 */
import * as vscode from 'vscode';

export interface DesignerMarks {
    /** Named selections: group name → component names. */
    groups: Record<string, string[]>;
    locks: string[];
    hidden: string[];
}

const MARKS_KEY = 'ce.designer.marks';
const LAYOUTS_KEY = 'ce.designer.layouts';
const NAME = /^[A-Za-z_]\w*$/;

let workspace: vscode.Memento | undefined;
let global: vscode.Memento | undefined;

export function setDesignerStores(workspaceState: vscode.Memento | undefined, globalState: vscode.Memento | undefined): void {
    workspace = workspaceState;
    global = globalState;
}

/** Whatever came from the page or from an old save: only well-formed names, bounded lists. */
export function sanitizeMarks(raw: unknown): DesignerMarks {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<DesignerMarks>;
    const list = (v: unknown): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && NAME.test(x)))].slice(0, 5000) : []);
    const groups: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(r.groups && typeof r.groups === 'object' ? r.groups : {}).slice(0, 60)) {
        const name = k.trim().slice(0, 60);
        const names = list(v);
        if (name && names.length) { groups[name] = names; }
    }
    return { groups, locks: list(r.locks), hidden: list(r.hidden) };
}

export function loadMarks(file: string): DesignerMarks {
    const all = workspace?.get<Record<string, unknown>>(MARKS_KEY) ?? {};
    return sanitizeMarks(all[file.toLowerCase()]);
}

export async function saveMarks(file: string, marks: unknown): Promise<void> {
    if (!workspace) { return; }
    const all = { ...(workspace.get<Record<string, unknown>>(MARKS_KEY) ?? {}) };
    const clean = sanitizeMarks(marks);
    if (!Object.keys(clean.groups).length && !clean.locks.length && !clean.hidden.length) { delete all[file.toLowerCase()]; } else { all[file.toLowerCase()] = clean; }
    await workspace.update(MARKS_KEY, all);
}

export interface SavedLayout { id: string; name: string; payload: string; count: number; savedAt: number }

export function layouts(): SavedLayout[] { return global?.get<SavedLayout[]>(LAYOUTS_KEY) ?? []; }

export async function saveLayouts(list: SavedLayout[]): Promise<void> { await global?.update(LAYOUTS_KEY, list.slice(0, 50)); }
