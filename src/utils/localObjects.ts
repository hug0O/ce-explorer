/**
 * The objects that belong to the open file (the local variables and the parameters of a routine, the routines declared inside another one, the
 * variables, constants and routines of the file itself) and where the file uses each one: the same reading as for the objects of the other files,
 * with the declaration in place of the origin file.
 *
 * Pure: the declarations and the routines in, the lines of use out.
 */
import { CodeFamily, maskCode } from './callGraph';
import { RoutineRange, attachParents } from './usedFiles';

export interface LocalDecl {
    /** The name as written. */
    name: string;
    /** `variable`, `parameter`, `function`, `constant`, `type`... */
    kind: string;
    /** The line (from 0) of the declaration. */
    line: number;
    /** The routine that holds it: the object is seen only inside it. Undefined for an object of the file. */
    scope?: RoutineRange;
    /** Other lines that declare it (the declaration of a routine apart from its body): they are not uses. */
    skipLines?: number[];
}

export interface LocalUse {
    decl: LocalDecl;
    /** `Routine.name` for an object of a routine, `name` for one of the file. */
    label: string;
    count: number;
    line: number;
    uses: { line: number; text: string; parent?: string; parentLine?: number }[];
    more: number;
}

const MAX_LINES = 40;

/**
 * The lines of the file that write each declared object: inside its routine for a local one, anywhere for an object of the file, never the
 * line of its declaration. An object that nothing uses is listed with no line (a variable that is never read is worth seeing).
 */
export function localUses(text: string, family: CodeFamily | undefined, decls: LocalDecl[], routines: readonly RoutineRange[]): LocalUse[] {
    const code = family ? maskCode(text, family) : text;
    const src = text.split(/\r?\n/);
    const at = new Map<string, number[]>();
    let line = 0;
    let pos = 0;
    for (const m of code.matchAll(/[A-Za-z_][\w$]*/g)) {
        const i = m.index ?? 0;
        for (let k = pos; k < i; k++) { if (code.charCodeAt(k) === 10) { line++; } }
        pos = i;
        const key = m[0].toLowerCase();
        const list = at.get(key);
        if (list) { list.push(line); } else { at.set(key, [line]); }
    }
    const out: LocalUse[] = [];
    const seen = new Set<string>();
    for (const d of decls) {
        const label = d.scope ? d.scope.name + '.' + d.name : d.name;
        const id = label.toLowerCase() + '|' + d.line;
        if (seen.has(id)) { continue; }
        seen.add(id);
        const lines = (at.get(d.name.toLowerCase()) ?? []).filter(l => l !== d.line && !d.skipLines?.includes(l) && (!d.scope || (l >= d.scope.start && l <= d.scope.end)));
        const distinct = [...new Set(lines)];
        const uses = attachParents(distinct.slice(0, MAX_LINES).map(l => ({ line: l, text: (src[l] ?? '').trim().slice(0, 200) })), routines);
        out.push({ decl: d, label, count: lines.length, line: distinct[0] ?? d.line, uses, more: Math.max(0, distinct.length - MAX_LINES) });
    }
    return out.sort((a, b) => a.decl.line - b.decl.line || a.label.localeCompare(b.label));
}
