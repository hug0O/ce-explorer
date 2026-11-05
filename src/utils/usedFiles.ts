/**
 * What a source file uses that is not written in it: the units it `uses`, the headers it includes, the modules it imports. The Structure
 * tab lists the objects of those files too when something is typed in its filter, each as `<file>.<object>`, so that a routine or a class
 * that the code calls but does not declare is found without knowing where it lives.
 *
 * Pure: it reads a text and says which files it points to (by name); the panel matches them with the files it has indexed.
 */
import { readUnit } from './unitGraph';
import { groupOfLanguage, groupOfPath, readImports } from './moduleGraph';

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
                const spec = imp.spec.replace(/^[./\\]+/, '').replace(/\.(m|c)?[jt]sx?$/i, '');
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
