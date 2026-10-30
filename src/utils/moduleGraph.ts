/**
 * The Blueprint of a project in a language other than Delphi: a node per source file, a wire per import (`import`, `require`, `from x import`,
 * `using`, `use`, `mod`, `#include`) that names another file of the project. What is not in the project (a library) stays listed on the file as
 * "outside the project". Pure: text in, `UnitInfo` out, so the same graph code as the Delphi units draws it.
 */
import type { UnitInfo } from './unitGraph';

export type ModuleGroup = 'script' | 'python' | 'java' | 'csharp' | 'go' | 'rust' | 'c';

interface GroupDef { label: string; exts: string[]; languageIds: string[] }

export const MODULE_GROUPS: Record<ModuleGroup, GroupDef> = {
    script: { label: 'TypeScript / JavaScript', exts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'], languageIds: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'] },
    python: { label: 'Python', exts: ['py'], languageIds: ['python'] },
    java: { label: 'Java', exts: ['java'], languageIds: ['java'] },
    csharp: { label: 'C#', exts: ['cs'], languageIds: ['csharp'] },
    go: { label: 'Go', exts: ['go'], languageIds: ['go'] },
    rust: { label: 'Rust', exts: ['rs'], languageIds: ['rust'] },
    c: { label: 'C / C++', exts: ['c', 'h', 'cpp', 'hpp', 'cc', 'cxx', 'hh'], languageIds: ['c', 'cpp'] },
};

export function groupOfLanguage(languageId: string): ModuleGroup | undefined {
    return (Object.keys(MODULE_GROUPS) as ModuleGroup[]).find(g => MODULE_GROUPS[g].languageIds.includes(languageId));
}

export function groupOfPath(file: string): ModuleGroup | undefined {
    const ext = /\.([A-Za-z0-9]+)$/.exec(file)?.[1]?.toLowerCase();
    return ext ? (Object.keys(MODULE_GROUPS) as ModuleGroup[]).find(g => MODULE_GROUPS[g].exts.includes(ext)) : undefined;
}

export const globOf = (g: ModuleGroup): string => '**/*.{' + MODULE_GROUPS[g].exts.join(',') + '}';

export interface RawImport { spec: string; line: number }

const lineOf = (text: string, at: number): number => { let n = 0; for (let i = 0; i < at && i < text.length; i++) { if (text.charCodeAt(i) === 10) { n++; } } return n; };

/** The imports a source text writes, as the module names it gives (not yet resolved to files). */
export function readImports(text: string, group: ModuleGroup): RawImport[] {
    const out: RawImport[] = [];
    const lines = text.split(/\r?\n/);
    const add = (spec: string, line: number): void => { if (spec) { out.push({ spec, line }); } };
    const skip = (l: string): boolean => /^\s*(\/\/|\*|\/\*)/.test(l);
    switch (group) {
        case 'script':
            for (const m of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/g)) {
                const line = lineOf(text, m.index ?? 0);
                if (!skip(lines[line] ?? '')) { add(m[2], line); }
            }
            break;
        case 'python':
            lines.forEach((l, i) => {
                if (/^\s*#/.test(l)) { return; }
                const imp = /^\s*import\s+(.+?)\s*(?:#.*)?$/.exec(l);
                if (imp) { for (const part of imp[1].split(',')) { add(part.trim().split(/\s+/)[0], i); } return; }
                const from = /^\s*from\s+(\.*[\w.]*)\s+import\s+(.+?)\s*(?:#.*)?$/.exec(l);
                if (!from) { return; }
                if (/^\.+$/.test(from[1])) { for (const part of from[2].replace(/[()]/g, '').split(',')) { const n = part.trim().split(/\s+/)[0]; if (n && n !== '*') { add(from[1] + n, i); } } } else { add(from[1], i); }
            });
            break;
        case 'java':
            lines.forEach((l, i) => { const m = /^\s*import\s+(?:static\s+)?([\w.]+(?:\.\*)?)\s*;/.exec(l); if (m) { add(m[1], i); } });
            break;
        case 'csharp':
            lines.forEach((l, i) => { const m = /^\s*(?:global\s+)?using\s+(?:static\s+)?(?:\w+\s*=\s*)?([A-Za-z_][\w.]*)\s*;/.exec(l); if (m) { add(m[1], i); } });
            break;
        case 'go':
            for (const m of text.matchAll(/^\s*import\s*\(([^)]*)\)/gm)) {
                const base = lineOf(text, m.index ?? 0);
                m[1].split(/\r?\n/).forEach((l, k) => { const s = /"([^"]+)"/.exec(l); if (s && !skip(l)) { add(s[1], base + k); } });
            }
            lines.forEach((l, i) => { const m = /^\s*import\s+(?:[\w.]+\s+)?"([^"]+)"/.exec(l); if (m) { add(m[1], i); } });
            break;
        case 'rust':
            lines.forEach((l, i) => {
                const mod = /^\s*(?:pub(?:\([^)]*\))?\s+)?mod\s+(\w+)\s*;/.exec(l);
                if (mod) { add('mod:' + mod[1], i); return; }
                const use = /^\s*(?:pub(?:\([^)]*\))?\s+)?use\s+((?:crate|self|super)(?:::\w+)*)/.exec(l);
                if (use) { add('use:' + use[1], i); }
            });
            break;
        case 'c':
            lines.forEach((l, i) => { const m = /^\s*#\s*include\s+"([^"]+)"/.exec(l); if (m) { add(m[1], i); } });
            break;
    }
    return out.sort((a, b) => a.line - b.line);
}

const dirOf = (p: string): string => { const i = p.lastIndexOf('/'); return i < 0 ? '' : p.slice(0, i); };
const join = (...parts: string[]): string => normalize(parts.filter(Boolean).join('/'));

function normalize(p: string): string {
    const out: string[] = [];
    for (const s of p.split('/')) {
        if (s === '' || s === '.') { continue; }
        if (s === '..') { out.pop(); } else { out.push(s); }
    }
    return out.join('/');
}

export interface ModuleSource { path: string; file: string; text: string }

/** Where an import points among the files of the project (the paths are relative to the project, with `/`). */
export function buildModules(files: ModuleSource[], group: ModuleGroup): UnitInfo[] {
    const paths = new Map<string, string>(files.map(f => [f.path.toLowerCase(), f.path]));
    const has = (p: string): string | undefined => paths.get(p.toLowerCase());
    const endsWith = (suffix: string): string[] => { const s = '/' + suffix.toLowerCase(); return files.filter(f => ('/' + f.path.toLowerCase()).endsWith(s)).map(f => f.path); };
    const namespaces = new Map<string, string[]>();
    if (group === 'csharp') {
        for (const f of files) {
            for (const m of f.text.matchAll(/^\s*namespace\s+([\w.]+)/gm)) { namespaces.set(m[1], [...(namespaces.get(m[1]) ?? []), f.path]); }
        }
    }
    const cap = (list: string[], self: string): string[] => list.filter(p => p !== self).slice(0, 8);

    const resolve = (from: string, spec: string): string[] => {
        const dir = dirOf(from);
        switch (group) {
            case 'script': {
                if (!spec.startsWith('.')) { return []; }
                const base = join(dir, spec);
                const stem = base.replace(/\.(m|c)?jsx?$/i, '');
                for (const b of [base, stem]) {
                    for (const e of ['', ...MODULE_GROUPS.script.exts.map(x => '.' + x), ...MODULE_GROUPS.script.exts.map(x => '/index.' + x)]) {
                        const hit = has(b + e);
                        if (hit && hit !== from) { return [hit]; }
                    }
                }
                return [];
            }
            case 'python': {
                const dots = /^\.*/.exec(spec)![0].length;
                const rest = spec.slice(dots).split('.').filter(Boolean).join('/');
                const roots = dots ? [dots === 1 ? dir : join(dir, ...Array(dots - 1).fill('..'))] : [''];
                for (const r of roots) {
                    for (const c of rest ? [join(r, rest) + '.py', join(r, rest, '__init__.py')] : [join(r, '__init__.py')]) {
                        const hit = has(c);
                        if (hit && hit !== from) { return [hit]; }
                    }
                }
                if (!dots && rest) {
                    const found = [...endsWith(rest + '.py'), ...endsWith(rest + '/__init__.py')].filter(p => p !== from);
                    if (found.length === 1) { return found; }
                }
                return [];
            }
            case 'java': {
                const parts = spec.replace(/\.\*$/, '').split('.');
                if (spec.endsWith('.*')) { return cap(files.filter(f => dirOf(f.path).toLowerCase().endsWith(parts.join('/').toLowerCase())).map(f => f.path), from); }
                const hit = endsWith(parts.join('/') + '.java').filter(p => p !== from);
                return hit.length ? [hit[0]] : [];
            }
            case 'csharp': return cap(namespaces.get(spec) ?? [], from);
            case 'go': {
                const segs = spec.split('/');
                for (let n = Math.min(3, segs.length); n >= 1; n--) {
                    const tail = segs.slice(-n).join('/').toLowerCase();
                    const hit = files.filter(f => dirOf(f.path) !== dir && (dirOf(f.path).toLowerCase() === tail || dirOf(f.path).toLowerCase().endsWith('/' + tail)));
                    if (hit.length) { return cap(hit.map(f => f.path), from); }
                }
                return [];
            }
            case 'rust': {
                if (spec.startsWith('mod:')) {
                    const name = spec.slice(4);
                    const stem = /([^/]+)\.rs$/.exec(from)?.[1] ?? '';
                    const base = ['lib', 'main', 'mod'].includes(stem) ? dir : join(dir, stem);
                    for (const c of [join(base, name + '.rs'), join(base, name, 'mod.rs')]) { const hit = has(c); if (hit) { return [hit]; } }
                    return [];
                }
                const segs = spec.slice(4).split('::');
                if (segs[0] !== 'crate') { return []; }
                let root = dir;
                while (root && !has(join(root, 'lib.rs')) && !has(join(root, 'main.rs'))) { root = dirOf(root); }
                const names = segs.slice(1);
                for (let n = names.length; n >= 1; n--) {
                    for (const c of [join(root, ...names.slice(0, n)) + '.rs', join(root, ...names.slice(0, n), 'mod.rs')]) { const hit = has(c); if (hit && hit !== from) { return [hit]; } }
                }
                return [];
            }
            case 'c': {
                const near = has(join(dir, spec));
                if (near && near !== from) { return [near]; }
                const found = endsWith(normalize(spec)).filter(p => p !== from);
                return found.length === 1 ? [found[0]] : [];
            }
        }
    };

    return files.map(f => {
        const uses: UnitInfo['uses'] = [];
        for (const imp of readImports(f.text, group)) {
            const targets = resolve(f.path, imp.spec);
            if (targets.length) { for (const t of targets) { uses.push({ name: t, section: 'implementation', line: imp.line }); } }
            else { uses.push({ name: imp.spec.replace(/^(mod|use):/, ''), section: 'implementation', line: imp.line }); }
        }
        return { name: f.path, kind: 'unit', uses, file: f.file };
    });
}
