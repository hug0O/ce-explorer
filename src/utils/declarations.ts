/**
 * The top-level objects a file offers to the others that are not routines, classes or members (those come from the parser of the language):
 * constants, variables, types (aliases, enumerations, records that the parser did not take) and the values of an enumeration, macros. They are
 * what a unit of a custom library exports besides its routines, and they are used from other files all the time.
 *
 * Pure: a text and a language in, the names with their kind and their line out.
 */
import { familyOf, maskCode } from './callGraph';

export interface Declaration { name: string; kind: string; line: number }

/** Words that start a section of a Pascal unit: what follows is read according to the last one. */
const SECTION = /^(type|const|var|threadvar|resourcestring)\b/i;

/** The constants, variables, types and enumeration values of the interface of a Pascal unit (and of a program). */
function pascalDeclarations(text: string): Declaration[] {
    const code = maskCode(text, familyOf('pascal')!);
    const lines = code.split(/\r?\n/);
    const impl = lines.findIndex(l => /^\s*implementation\b/i.test(l));
    const end = impl >= 0 ? impl : lines.length;
    const start = Math.max(0, lines.findIndex(l => /^\s*interface\b/i.test(l)));
    const out: Declaration[] = [];
    let section = '';
    let depth = 0;
    for (let i = start; i < end; i++) {
        const l = lines[i];
        const t = l.trim();
        if (!t) { continue; }
        const sec = SECTION.exec(t);
        if (depth === 0 && sec) { section = sec[1].toLowerCase(); }
        else if (depth === 0 && /^(procedure|function|constructor|destructor|class\s+(procedure|function)|uses|initialization|finalization|implementation|interface)\b/i.test(t)) { section = ''; continue; }
        const body = sec && depth === 0 ? t.slice(sec[0].length).trim() : t;
        if (!body) { continue; }
        if (section === 'type' && depth === 0) {
            const m = /^(\w+)(?:\s*<[^=;]*>)?\s*=\s*(.*)$/.exec(body);
            if (m) {
                out.push({ name: m[1], kind: 'type', line: i });
                // an enumeration: `TMode = (mNone, mFast);`, over as many lines as it takes
                if (m[2].startsWith('(')) {
                    let list = '';
                    for (let j = i; j < end; j++) {
                        list += ' ' + (j === i ? m[2] : lines[j]);
                        if (/\)\s*;/.test(list) || /\)\s*$/.test(list) && /;\s*$/.test(lines[j + 1] ?? '')) { break; }
                        if (j - i > 200) { break; }
                    }
                    for (const v of /\(([^)]*)\)/.exec(list)?.[1].split(',') ?? []) {
                        const n = /^\s*(\w+)/.exec(v)?.[1];
                        if (n) { out.push({ name: n, kind: 'enum', line: i }); }
                    }
                }
                // a class, a record, an interface, an object spreads over lines up to its `end`
                if (/^(?:packed\s+)?(?:class|record|interface|object|dispinterface)\b(?!\s+of\b)/i.test(m[2]) && !(/;\s*$/.test(m[2]) && !/\bend\b/i.test(m[2]))) { depth++; }
                if (depth > 0 && /\bend\b/i.test(m[2])) { depth = Math.max(0, depth - 1); }
                continue;
            }
        } else if (section === 'type') {
            if (/\bend\b\s*;?\s*$/i.test(body)) { depth = Math.max(0, depth - 1); }
            continue;
        }
        if (depth > 0) { continue; }
        if (section === 'const' || section === 'resourcestring') {
            const m = /^(\w+)\s*(?::[^=]+)?=/.exec(body);
            if (m) { out.push({ name: m[1], kind: 'constant', line: i }); }
        } else if (section === 'var' || section === 'threadvar') {
            const m = /^(\w+(?:\s*,\s*\w+)*)\s*:/.exec(body);
            if (m) { for (const n of m[1].split(',')) { out.push({ name: n.trim(), kind: 'variable', line: i }); } }
        }
    }
    return out;
}

const KIND_OF: Record<string, string> = { const: 'constant', let: 'variable', var: 'variable', enum: 'enum', type: 'type', interface: 'interface', class: 'class', function: 'function' };

/** What a file of another language exports at its top level: constants, enumerations, types, macros. */
function otherDeclarations(text: string, languageId: string): Declaration[] {
    const family = familyOf(languageId);
    const code = family ? maskCode(text, family) : text;
    const lines = code.split(/\r?\n/);
    const out: Declaration[] = [];
    const add = (name: string | undefined, kind: string, line: number): void => { if (name) { out.push({ name, kind, line }); } };
    lines.forEach((l, i) => {
        switch (languageId) {
            case 'typescript': case 'typescriptreact': case 'javascript': case 'javascriptreact': {
                const m = /^\s*export\s+(?:default\s+)?(?:declare\s+)?(?:abstract\s+)?(const\s+enum|const|let|var|enum|type|interface|class|function\*?|async\s+function)\s+(\w+)/.exec(l);
                if (m) { add(m[2], KIND_OF[m[1].replace(/^const\s+enum$/, 'enum').replace(/^async\s+function$|^function\*$/, 'function')] ?? 'variable', i); }
                break;
            }
            case 'python': {
                const m = /^([A-Za-z_]\w*)\s*(?::[^=]+)?=(?!=)/.exec(l);
                if (m) { add(m[1], /^[A-Z][A-Z0-9_]*$/.test(m[1]) ? 'constant' : 'variable', i); }
                break;
            }
            case 'cpp': case 'c': {
                const d = /^\s*#\s*define\s+(\w+)/.exec(l);
                if (d) { add(d[1], 'macro', i); break; }
                const t = /^\s*(?:typedef\s+)?(?:enum|struct|union)\s+(?:class\s+)?(\w+)/.exec(l);
                if (t) { add(t[1], 'type', i); break; }
                const td = /^\s*typedef\b.*?\b(\w+)\s*(?:\[[^\]]*\])?\s*;\s*$/.exec(l);
                if (td) { add(td[1], 'type', i); break; }
                const u = /^\s*using\s+(\w+)\s*=/.exec(l);
                if (u) { add(u[1], 'type', i); }
                break;
            }
            case 'go': {
                const g = /^(?:const|var)\s+(\w+)/.exec(l);
                if (g) { add(g[1], l.startsWith('const') ? 'constant' : 'variable', i); break; }
                const t = /^type\s+(\w+)/.exec(l);
                if (t) { add(t[1], 'type', i); }
                break;
            }
            case 'rust': {
                const r = /^\s*pub(?:\([^)]*\))?\s+(const|static|enum|struct|type|trait|mod)\s+(\w+)/.exec(l);
                if (r) { add(r[2], r[1] === 'const' || r[1] === 'static' ? 'constant' : 'type', i); }
                break;
            }
            default: break;
        }
    });
    return out;
}

/** The constants, variables, types and enumeration values at the top level of a file. */
export function topLevelDeclarations(text: string, languageId: string): Declaration[] {
    return languageId === 'pascal' ? pascalDeclarations(text) : otherDeclarations(text, languageId);
}
