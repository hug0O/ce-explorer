/**
 * What a source file uses that is not written in it: the units it `uses`, the headers it includes, the modules it imports. The Structure
 * tab lists the objects of those files too when something is typed in its filter, each as `<file>.<object>`, so that a routine or a class
 * that the code calls but does not declare is found without knowing where it lives.
 *
 * Pure: it reads a text and says which files it points to (by name); the panel matches them with the files it has indexed.
 */
import { readUnit } from './unitGraph';
import { groupOfLanguage, groupOfPath, readImports } from './moduleGraph';
import { CodeFamily, maskCode } from './callGraph';

export interface UsedRefs {
    /** File names without their extension, lower case: a unit, a header, a module. */
    bases: Set<string>;
    /** Folder names, lower case: a package of Go, Java, Python, Rust is a folder of files. */
    dirs: Set<string>;
}

const baseOf = (file: string): string => file.replace(/^.*[\\/]/, '').replace(/\.[^.]*$/, '');

/** The files a text points to, whatever its language (Pascal, C and C++, and every language the Blueprint reads the imports of). */
export function usedRefs(text: string, languageId: string, fileName: string): UsedRefs {
    const bases = new Set<string>();
    const dirs = new Set<string>();
    const ext = (/\.([^.\\/]+)$/.exec(fileName)?.[1] ?? '').toLowerCase();
    if (languageId === 'pascal' || ['pas', 'dpr', 'dpk', 'inc'].includes(ext)) {
        for (const u of readUnit(text, fileName)?.uses ?? []) { bases.add(u.name.toLowerCase()); }
    } else if (languageId === 'cpp' || languageId === 'c' || ['c', 'cc', 'cpp', 'cxx', 'h', 'hh', 'hpp', 'hxx'].includes(ext)) {
        for (const m of text.matchAll(/^\s*#\s*include\s*[<"]([^>"\n]+)[>"]/gm)) { bases.add(baseOf(m[1]).toLowerCase()); }
    } else {
        const group = groupOfLanguage(languageId) ?? groupOfPath(fileName);
        if (group) {
            for (const imp of readImports(text, group)) {
                const spec = imp.spec.replace(/^node:/, '').replace(/^[./\\]+/, '').replace(/\.(m|c)?[jt]sx?$/i, '');
                const parts = spec.split(/[\\/]|::|\./).filter(Boolean);
                const last = parts[parts.length - 1];
                if (!last || last === '*') { continue; }
                bases.add(last.toLowerCase());
                if (['go', 'java', 'python', 'rust'].includes(group)) { dirs.add(last.toLowerCase()); }
            }
        }
    }
    bases.delete(baseOf(fileName).toLowerCase());
    return { bases, dirs };
}

/** Whether a file is one the text points to: by its name, or by the folder it is in. */
export function isUsed(refs: UsedRefs, filePath: string): boolean {
    const parts = filePath.split(/[\\/]/);
    const base = baseOf(filePath).toLowerCase();
    const dir = (parts[parts.length - 2] ?? '').toLowerCase();
    return refs.bases.has(base) || (!!dir && refs.dirs.has(dir));
}

export interface ExternalSymbol {
    /** `unit.name` or `unit.Class.member`: how it is written in the list and what the filter looks in. */
    label: string;
    name: string;
    /** The type or package the object is a member of ('' for a type or a routine of the file). */
    container: string;
    kind: string;
    path: string;
    line: number;
}

/** The label of an object of another file. */
export const externalLabel = (filePath: string, container: string, name: string): string => baseOf(filePath) + '.' + (container ? container + '.' : '') + name;

/** The objects of the used files that the filter text finds: the name that is exactly it first, then the ones that start with it, then the rest. A text that is a regular expression is read as one. */
export function matchExternal(list: ExternalSymbol[], query: string, max = 60): ExternalSymbol[] {
    const q = query.trim();
    if (!q) { return []; }
    let re: RegExp | undefined;
    try { re = /[\\^$.*+?()[\]{}|]/.test(q) ? new RegExp(q, 'i') : undefined; } catch { re = undefined; }
    const low = q.toLowerCase();
    const found: { s: ExternalSymbol; rank: number }[] = [];
    for (const s of list) {
        const label = s.label.toLowerCase();
        if (!(re ? re.test(s.label) : label.includes(low))) { continue; }
        const name = s.name.toLowerCase();
        found.push({ s, rank: name === low || label === low ? 0 : name.startsWith(low) ? 1 : label.startsWith(low) ? 2 : 3 });
    }
    return found.sort((a, b) => a.rank - b.rank || a.s.label.localeCompare(b.s.label)).slice(0, max).map(f => f.s);
}

export interface OutsideUse {
    symbol: ExternalSymbol;
    /** How many times the file writes the name, and the line (from 0) of the first one. */
    count: number;
    line: number;
    /** The lines that write it (the first ones), with their text, to show where the object is used. */
    uses: { line: number; text: string; parent?: string; parentLine?: number }[];
    /** How many more lines than the ones in `uses`. */
    more: number;
}

/** The lines kept for an object: enough to see where it is used, not the whole file. */
export const MAX_USE_LINES = 40;

/**
 * What the code of a file really uses from the other files: the objects of the used files whose name the code writes (comments and strings
 * left out). A routine or a type is found by its name; a member of a type, whose name is often an everyday word, only where it is written after
 * a dot (`store.Save`, `Store->Save`, `Store::Save`), so that `Free` or `Text` are not reported for every file. It is a reading of the names,
 * not of the types: two objects of the used files with the same name are both listed.
 */
export function usedFromOutside(text: string, family: CodeFamily | undefined, list: ExternalSymbol[], max = 400): OutsideUse[] {
    const code = family ? maskCode(text, family) : text;
    const src = text.split(/\r?\n/);
    const plain = new Map<string, { count: number; line: number; lines: number[] }>();
    const dotted = new Map<string, { count: number; line: number; lines: number[] }>();
    let line = 0;
    let at = 0;
    for (const m of code.matchAll(/[A-Za-z_][\w$]*/g)) {
        const i = m.index ?? 0;
        for (let k = at; k < i; k++) { if (code.charCodeAt(k) === 10) { line++; } }
        at = i;
        const name = m[0].toLowerCase();
        const after = /(?:\.|->|::)\s*$/.test(code.slice(Math.max(0, i - 3), i));
        for (const map of after ? [plain, dotted] : [plain]) {
            const e = map.get(name);
            if (e) { e.count++; if (e.lines[e.lines.length - 1] !== line) { e.lines.push(line); } } else { map.set(name, { count: 1, line, lines: [line] }); }
        }
    }
    const out: OutsideUse[] = [];
    const seen = new Set<string>();
    for (const s of list) {
        if (s.name.length < 2 || seen.has(s.label.toLowerCase())) { continue; }
        const e = (s.container ? dotted : plain).get(s.name.toLowerCase());
        if (e) {
            seen.add(s.label.toLowerCase());
            out.push({ symbol: s, count: e.count, line: e.line, uses: e.lines.slice(0, MAX_USE_LINES).map(l => ({ line: l, text: (src[l] ?? '').trim().slice(0, 200) })), more: Math.max(0, e.lines.length - MAX_USE_LINES) });
        }
    }
    return out.sort((a, b) => a.symbol.label.localeCompare(b.symbol.label)).slice(0, max);
}

export interface RoutineRange { name: string; start: number; end: number }

/** The lines of use with the routine that holds each one (the smallest that contains it) and where that routine starts: `T.Go`, line 12. */
export function attachParents<U extends { line: number }>(uses: U[], ranges: readonly RoutineRange[]): (U & { parent?: string; parentLine?: number })[] {
    return uses.map(u => {
        let best: RoutineRange | undefined;
        for (const r of ranges) {
            if (u.line >= r.start && u.line <= r.end && (!best || r.end - r.start < best.end - best.start)) { best = r; }
        }
        return best ? { ...u, parent: best.name, parentLine: best.start } : { ...u };
    });
}
