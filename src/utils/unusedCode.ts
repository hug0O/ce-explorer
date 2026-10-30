/**
 * Unused code in one source file, the way the compiler or the usual linter of each language reports it: imports nobody uses (TS6133, F401,
 * Go's "imported and not used", rustc's unused_imports), local variables never read (TS6133, F841, Go, rustc, CS0168 / CS0219, Delphi H2164),
 * private members and file-local routines nobody calls (Delphi H2219, CS0169 / IDE0051, rustc dead_code, GCC / Clang -Wunused-function, shellcheck
 * SC2329) and statements after a `return` / `throw` / `Exit` (TS7027, CS0162, rustc unreachable_code). Text in, findings out: tested without
 * VS Code. It reads the text, so it is a good guess, not a type-checker: the rule says which tool states it for certain.
 */
import { CodeFamily, bracedBody, familyOf, maskCode } from './callGraph';
import { ClassMember, MemberKind, ParsedDocument } from '../models/types';

export type UnusedKind = 'import' | 'local' | 'private' | 'function' | 'unreachable';

export interface UnusedFinding {
    kind: UnusedKind;
    name: string;
    line: number;
    col: number;
    endCol: number;
    /** What the compiler / linter of the language calls it (`TS6133`, `F401`, `H2164`...). */
    rule: string;
    /** The tool that reports it. */
    tool: string;
    message: string;
}

/** A routine or member of the file, as the parser of its language gave it. */
export interface UnusedSpan {
    name: string;
    owner?: string;
    visibility?: string;
    kind: 'method' | 'field' | 'property' | 'function';
    /** The lines of its body (implementation for Pascal): the locals are looked for there. */
    start: number;
    end: number;
    /** The line of its signature, when it differs from the start. */
    line: number;
    /** How many times the file declares it (a Pascal method is declared and implemented). */
    declarations: number;
}

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function wordRe(name: string, ci: boolean): RegExp { return new RegExp('(?<![\\w$])' + esc(name) + '(?![\\w$])', ci ? 'gi' : 'g'); }

const indentOf = (s: string): string => /^[ \t]*/.exec(s)![0];

interface Ctx {
    languageId: string;
    family: CodeFamily;
    ci: boolean;
    text: string;
    lines: string[];
    masked: string;
    mlines: string[];
    fileName: string;
    /** Text outside the file that also names things of it (the .dfm of a Delphi unit names its event handlers). */
    extra: string;
}

function lineStarts(text: string): number[] {
    const out = [0];
    for (let i = 0; i < text.length; i++) { if (text.charCodeAt(i) === 10) { out.push(i + 1); } }
    return out;
}

function position(starts: number[], offset: number): { line: number; col: number } {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= offset) { lo = mid; } else { hi = mid - 1; } }
    return { line: lo, col: offset - starts[lo] };
}

const count = (c: Ctx, name: string): number => (c.masked.match(wordRe(name, c.ci)) ?? []).length + (c.extra ? (c.extra.match(wordRe(name, c.ci)) ?? []).length : 0);

/** How many times `name` is read in the text: its declaration and the lines that only assign it do not count. */
function reads(body: string, name: string, ci: boolean, declAt: number, assignOps: RegExp): number {
    let n = 0;
    for (const m of body.matchAll(wordRe(name, ci))) {
        const at = m.index ?? 0;
        if (at === declAt) { continue; }
        if (/\.\s*$/.test(body.slice(Math.max(0, at - 3), at))) { continue; }
        if (assignOps.test(body.slice(at + name.length, at + name.length + 4))) { continue; }
        n++;
    }
    return n;
}

const GROUPS: Record<string, string> = {
    typescript: 'script', typescriptreact: 'script', javascript: 'script', javascriptreact: 'script',
    python: 'python', java: 'java', csharp: 'csharp', go: 'go', rust: 'rust', cpp: 'c', c: 'c',
    pascal: 'pascal', powershell: 'powershell', shellscript: 'shell',
};

// --- imports ----------------------------------------------------------------------------------------------------------------

function importFindings(c: Ctx, group: string, out: UnusedFinding[]): void {
    const starts = lineStarts(c.text);
    const report = (name: string, offset: number, rule: string, tool: string, message: string): void => {
        const p = position(starts, offset);
        out.push({ kind: 'import', name, line: p.line, col: p.col, endCol: p.col + name.length, rule, tool, message });
    };
    const unused = (name: string): boolean => count(c, name) <= 1;
    switch (group) {
        case 'script': {
            for (const m of c.text.matchAll(/^[ \t]*import\s+(?:type\s+)?([^'"\n;]*?)\s+from\s+['"][^'"\n]+['"]/gm)) {
                const clause = m[1];
                const base = (m.index ?? 0) + m[0].indexOf(clause);
                const names: { n: string; at: number }[] = [];
                const brace = /\{([^}]*)\}/.exec(clause);
                const head = brace ? clause.slice(0, brace.index) : clause;
                const def = /^\s*([A-Za-z_$][\w$]*)/.exec(head)?.[1];
                if (def) { names.push({ n: def, at: base + head.indexOf(def) }); }
                const ns = /\*\s*as\s+([A-Za-z_$][\w$]*)/.exec(head);
                if (ns) { names.push({ n: ns[1], at: base + (ns.index ?? 0) + ns[0].lastIndexOf(ns[1]) }); }
                if (brace) {
                    let off = base + brace.index + 1;
                    for (const part of brace[1].split(',')) {
                        const bound = /(?:\bas\s+)?([A-Za-z_$][\w$]*)\s*$/.exec(part.trim());
                        if (bound) { names.push({ n: bound[1], at: off + part.lastIndexOf(bound[1]) }); }
                        off += part.length + 1;
                    }
                }
                for (const { n, at } of names) { if (n !== 'React' && unused(n)) { report(n, at, 'TS6133', 'tsc noUnusedLocals / ESLint no-unused-vars', "'" + n + "' is declared but its value is never read"); } }
            }
            break;
        }
        case 'python': {
            if (/(^|[\\/])__init__\.py$/.test(c.fileName)) { break; }
            const all = /__all__/.test(c.text);
            c.lines.forEach((line, i) => {
                const l = c.mlines[i];
                if (/^\s/.test(l) || /^\s*from\s+__future__/.test(l)) { return; }
                const imp = /^import\s+(.+?)\s*$/.exec(l);
                const from = /^from\s+[\w.]+\s+import\s+(.+?)\s*$/.exec(l);
                const items = imp ? imp[1].split(',') : from && !/^[(*]/.test(from[1].trim()) ? from[1].split(',') : [];
                for (const it of items) {
                    const t = it.trim();
                    const bound = /\bas\s+(\w+)$/.exec(t)?.[1] ?? (imp ? t.split('.')[0].split(/\s+/)[0] : t.split(/\s+/)[0]);
                    if (!bound || !unused(bound)) { continue; }
                    if (all && new RegExp('[\'"]' + esc(bound) + '[\'"]').test(c.text)) { continue; }
                    const col = Math.max(0, line.indexOf(bound));
                    out.push({ kind: 'import', name: bound, line: i, col, endCol: col + bound.length, rule: 'F401', tool: 'pyflakes / flake8 / ruff', message: "'" + bound + "' imported but unused" });
                }
            });
            break;
        }
        case 'java': {
            c.lines.forEach((line, i) => {
                const m = /^\s*import\s+(static\s+)?([\w.]+)\s*;/.exec(c.mlines[i]);
                if (!m) { return; }
                const bound = m[2].split('.').pop()!;
                if (!unused(bound)) { return; }
                const col = Math.max(0, line.lastIndexOf(bound));
                out.push({ kind: 'import', name: bound, line: i, col, endCol: col + bound.length, rule: 'unused import', tool: 'IDE inspection / Checkstyle UnusedImports', message: 'The import ' + m[2] + ' is never used' });
            });
            break;
        }
        case 'go': {
            const block = /^\s*import\s*\(([^)]*)\)/m.exec(c.text);
            const specs: { alias?: string; path: string; line: number; col: number }[] = [];
            const lines = c.lines;
            lines.forEach((line, i) => {
                const single = /^\s*import\s+(?:([\w.]+)\s+)?"([^"]+)"/.exec(line);
                if (single) { specs.push({ alias: single[1], path: single[2], line: i, col: Math.max(0, line.indexOf('"')) }); }
            });
            if (block) {
                const first = position(starts, (block.index ?? 0) + block[0].indexOf(block[1])).line;
                block[1].split('\n').forEach((l, k) => {
                    const m = /^\s*(?:([\w.]+)\s+)?"([^"]+)"/.exec(l);
                    if (m) { specs.push({ alias: m[1], path: m[2], line: first + k, col: Math.max(0, l.indexOf('"')) }); }
                });
            }
            for (const s of specs) {
                if (s.alias === '_' || s.alias === '.') { continue; }
                const segs = s.path.split('/');
                let bound = s.alias ?? segs[segs.length - 1];
                if (!s.alias && /^v\d+$/.test(bound) && segs.length > 1) { bound = segs[segs.length - 2]; }
                bound = bound.replace(/^go-/, '').replace(/-go$/, '').replace(/[^\w]/g, '');
                // the path is a string (blanked in the masked text): without an alias the name is only written where it is used
                if (bound && count(c, bound) <= (s.alias ? 1 : 0)) { out.push({ kind: 'import', name: s.path, line: s.line, col: s.col, endCol: s.col + s.path.length + 2, rule: 'imported and not used', tool: 'go build (a compile error)', message: '"' + s.path + '" imported and not used' }); }
            }
            break;
        }
        case 'rust': {
            for (const m of c.text.matchAll(/^[ \t]*use\s+([^;]+);/gm)) {
                const path = m[1];
                if (/^\s*pub\b/.test(m[0])) { continue; }
                const brace = /\{([^}]*)\}/.exec(path);
                const parts = brace ? brace[1].split(',') : [path.split('::').pop() ?? ''];
                let off = (m.index ?? 0) + m[0].indexOf(path) + (brace ? brace.index + 1 : path.length - (path.split('::').pop() ?? '').length);
                for (const part of parts) {
                    const t = part.trim();
                    const bound = /\bas\s+(\w+)$/.exec(t)?.[1] ?? t.split('::').pop()!.trim();
                    if (bound && /^\w+$/.test(bound) && bound !== 'self' && bound !== '_' && unused(bound)) { report(bound, off + Math.max(0, part.lastIndexOf(bound)), 'unused_imports', 'rustc (warning)', 'unused import: `' + bound + '`'); }
                    off += part.length + 1;
                }
            }
            break;
        }
        default: break;
    }
}

// --- locals ----------------------------------------------------------------------------------------------------------------

const NOT_A_TYPE = /^(return|new|throw|else|case|goto|delete|using|namespace|package|import|typedef|struct|class|enum|union|if|while|for|do|switch|break|continue|yield|await|elif|print|assert|lambda|raise|del|pass|in|is|not|and|or)$/;

function localFindings(c: Ctx, group: string, spans: UnusedSpan[], out: UnusedFinding[]): void {
    const body = (s: UnusedSpan): string => c.mlines.slice(s.start, s.end + 1).join('\n');
    for (const s of spans) {
        if ((s.kind !== 'method' && s.kind !== 'function') || s.end <= s.start) { continue; }
        const text = body(s);
        const add = (name: string, at: number, rule: string, tool: string, message: string): void => {
            const before = text.slice(0, at);
            const rel = before.split('\n').length - 1;
            const line = s.start + rel;
            const col = at - (before.lastIndexOf('\n') + 1);
            out.push({ kind: 'local', name, line, col, endCol: col + name.length, rule, tool, message });
        };
        const writeOnly = c.family.kind === 'pascal' ? /^\s*:=/ : /^\s*(=(?!=)|:=|\+=|-=)/;
        const check = (name: string, at: number, rule: string, tool: string, message: string): void => {
            if (name.startsWith('_') || name === 'self' || name === 'this') { return; }
            if (reads(text, name, c.ci, at, writeOnly) === 0) { add(name, at, rule, tool, message); }
        };
        switch (group) {
            case 'script':
                for (const m of text.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?=[:=;,]|$)/gm)) {
                    const n = m[1];
                    check(n, (m.index ?? 0) + m[0].indexOf(n), 'TS6133', 'tsc noUnusedLocals / ESLint no-unused-vars', "'" + n + "' is declared but its value is never read");
                }
                break;
            case 'python':
                for (const m of text.matchAll(/^([ \t]+)([a-z_]\w*)\s*(?::[^=\n]+)?=\s*[^=\n]/gm)) {
                    const n = m[2];
                    const at = (m.index ?? 0) + m[1].length;
                    if (new RegExp('^\\s*(global|nonlocal)\\b[^\\n]*\\b' + esc(n) + '\\b', 'm').test(text)) { continue; }
                    // only the first assignment is the declaration
                    if (text.search(wordRe(n, false)) !== at) { continue; }
                    check(n, at, 'F841', 'pyflakes / flake8 / ruff', "local variable '" + n + "' is assigned to but never used");
                }
                break;
            case 'go':
                for (const m of text.matchAll(/^[ \t]*([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s*:=/gm)) {
                    let off = (m.index ?? 0) + m[0].indexOf(m[1]);
                    for (const part of m[1].split(',')) {
                        const n = part.trim();
                        if (n && n !== '_') { check(n, off + part.indexOf(n), 'declared and not used', 'go build (a compile error)', 'declared and not used: ' + n); }
                        off += part.length + 1;
                    }
                }
                for (const m of text.matchAll(/^[ \t]*var\s+([A-Za-z_]\w*)\b/gm)) { check(m[1], (m.index ?? 0) + m[0].indexOf(m[1]), 'declared and not used', 'go build (a compile error)', 'declared and not used: ' + m[1]); }
                break;
            case 'rust':
                for (const m of text.matchAll(/\blet\s+(?:mut\s+)?([a-z_]\w*)\b/g)) {
                    const n = m[1];
                    check(n, (m.index ?? 0) + m[0].lastIndexOf(n), 'unused_variables', 'rustc (warning)', 'unused variable: `' + n + '`');
                }
                break;
            case 'java':
            case 'csharp':
            case 'c':
                for (const m of text.matchAll(/^[ \t]*(?:(?:final|const|static|readonly|unsigned|signed|volatile)\s+)*([A-Za-z_][\w<>,.?[\]*&:]*)\s+[*&]*([A-Za-z_]\w*)\s*(=(?!=)|;)/gm)) {
                    const type = m[1].split('.').pop() ?? '';
                    if (NOT_A_TYPE.test(m[1]) || NOT_A_TYPE.test(type)) { continue; }
                    const n = m[2];
                    const assigned = m[3].startsWith('=');
                    const rule = group === 'csharp' ? (assigned ? 'CS0219' : 'CS0168') : group === 'c' ? '-Wunused-variable' : 'unused local';
                    const tool = group === 'csharp' ? 'csc (warning)' : group === 'c' ? 'GCC / Clang' : 'IDE inspection / javac -Xlint';
                    check(n, (m.index ?? 0) + m[0].lastIndexOf(n), rule, tool, "The variable '" + n + "' is " + (assigned ? 'assigned but its value is never used' : 'declared but never used'));
                }
                break;
            case 'pascal': {
                // `var a, b: T;` between the header and the `begin` of the routine
                const begin = text.search(/^\s*begin\b/im);
                if (begin < 0) { break; }
                const head = text.slice(0, begin);
                const v = /^\s*var\b([\s\S]*)$/im.exec(head);
                if (!v) { break; }
                const startOfVars = (v.index ?? 0) + head.slice(v.index ?? 0).search(/var/i) + 3;
                const names: { n: string; at: number }[] = [];
                const re = /([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s*:\s*[^;=]+(?:=[^;]*)?;/g;
                const region = head.slice(startOfVars);
                // only the first `var` block: a nested routine's own variables are checked with the nested routine
                const cut = region.search(/^\s*(procedure|function|constructor|destructor)\b/im);
                const vars = cut >= 0 ? region.slice(0, cut) : region;
                for (const m of vars.matchAll(re)) {
                    let off = startOfVars + (m.index ?? 0);
                    for (const part of m[1].split(',')) {
                        const n = part.trim();
                        if (n) { names.push({ n, at: off + part.indexOf(n) }); }
                        off += part.length + 1;
                    }
                }
                const after = text.slice(begin);
                for (const { n, at } of names) {
                    if (reads(after, n, true, -1, writeOnly) === 0) { add(n, at, 'H2164', 'Delphi compiler (hint)', "Variable '" + n + "' is declared but never used in '" + (s.owner ? s.owner + '.' : '') + s.name + "'"); }
                }
                break;
            }
            case 'powershell':
                for (const m of text.matchAll(/^[ \t]*\$([A-Za-z_]\w*)\s*=(?!=)/gm)) {
                    const n = m[1];
                    if (/^(null|true|false|env|args|input|_|this|pwd|home|host|error)$/i.test(n)) { continue; }
                    if (text.search(new RegExp('\\$' + esc(n) + '\\b', 'i')) !== (m.index ?? 0) + m[0].indexOf('$')) { continue; }
                    const rest = [...text.matchAll(new RegExp('\\$' + esc(n) + '\\b(?!\\s*=[^=])', 'gi'))].length;
                    if (rest <= 0) { add(n, (m.index ?? 0) + m[0].indexOf('$') + 1, 'PSUseDeclaredVarsMoreThanAssignments', 'PSScriptAnalyzer', "The variable '" + n + "' is assigned but never used"); }
                }
                break;
            default: break;
        }
    }
}

// --- private members and local routines ---------------------------------------------------------------------------------------

function memberFindings(c: Ctx, group: string, spans: UnusedSpan[], out: UnusedFinding[]): void {
    for (const s of spans) {
        const total = count(c, s.name);
        if (total > s.declarations) { continue; }
        const line = s.line;
        const text = c.lines[line] ?? '';
        const col = Math.max(0, text.search(wordRe(s.name, c.ci)));
        const isPrivate = (s.visibility ?? '').toLowerCase() === 'private';
        const push = (kind: UnusedKind, rule: string, tool: string, message: string): void => { out.push({ kind, name: s.owner ? s.owner + '.' + s.name : s.name, line, col, endCol: col + s.name.length, rule, tool, message }); };
        const what = s.kind === 'field' || s.kind === 'property' ? 'field' : 'method';
        const prev = (c.lines[line - 1] ?? '').trim();
        switch (group) {
            case 'pascal':
                if (s.kind === 'property') { break; }
                if (s.owner && isPrivate) { push('private', 'H2219', 'Delphi compiler (hint)', "Private symbol '" + s.name + "' declared but never used"); }
                else if (!s.owner && s.kind === 'function' && !/^(Register|Initialization|Finalization)$/i.test(s.name)) { push('function', 'H2219', 'Delphi compiler (hint)', "Symbol '" + s.name + "' is declared but never used (a routine of the implementation section that nothing calls)"); }
                break;
            case 'script':
                if (s.owner && isPrivate && !/^#/.test(s.name)) { push('private', s.kind === 'field' ? 'TS6138' : 'TS6133', 'tsc noUnusedLocals', "'" + s.name + "' is declared but its value is never read"); }
                else if (!s.owner && s.kind === 'function' && !/\bexport\b/.test(text) && !new RegExp('export\\s*\\{[^}]*\\b' + esc(s.name) + '\\b|module\\.exports[^\\n]*\\b' + esc(s.name) + '\\b').test(c.text)) { push('function', 'TS6133', 'tsc noUnusedLocals / ESLint no-unused-vars', "'" + s.name + "' is declared but never used"); }
                break;
            case 'python':
                if (/^_[^_]/.test(s.name) && s.kind !== 'field') { push(s.owner ? 'private' : 'function', 'vulture', 'vulture / pylint', "'" + s.name + "' is private (underscore) and nothing in the file calls it"); }
                break;
            case 'java':
                if (isPrivate && s.owner) { push('private', 'unused private ' + what, 'IDE inspection / Checkstyle', "The private " + what + " '" + s.name + "' is never used"); }
                break;
            case 'csharp':
                if (isPrivate && s.owner) { push('private', what === 'field' ? 'CS0169' : 'IDE0051', what === 'field' ? 'csc (warning)' : 'Roslyn analyzer (IDE0051)', what === 'field' ? "The field '" + s.name + "' is never used" : "Private member '" + s.name + "' is unused"); }
                break;
            case 'go':
                if (!s.owner && s.kind === 'function' && /^[a-z_]/.test(s.name) && !/^(main|init)$/.test(s.name) && !/^(Test|Benchmark|Example|Fuzz)/.test(s.name)) { push('function', 'U1000', 'staticcheck / gopls', 'func ' + s.name + ' is unused'); }
                break;
            case 'rust':
                if (s.kind === 'function' && s.name !== 'main' && !/\bpub\b/.test(text) && !prev.startsWith('#[') && !/^\s*(?:async\s+)?(?:unsafe\s+)?fn\s+test_/.test(text)) { push('function', 'dead_code', 'rustc (warning)', 'function `' + s.name + '` is never used'); }
                break;
            case 'c':
                if (!s.owner && s.kind === 'function' && /\bstatic\b/.test(text) && s.name !== 'main') { push('function', '-Wunused-function', 'GCC / Clang', "'" + s.name + "' defined but not used"); }
                else if (s.owner && isPrivate && what === 'field') { push('private', '-Wunused-private-field', 'Clang', "private field '" + s.name + "' is not used"); }
                break;
            case 'shell':
                if (s.kind === 'function') { push('function', 'SC2329', 'shellcheck', 'This function is never invoked'); }
                break;
            case 'powershell':
                if (s.kind === 'function') { push('function', 'never called', 'review (no compiler warning)', "The function '" + s.name + "' is never called in this file"); }
                break;
            default: break;
        }
    }
}

// --- unreachable statements ----------------------------------------------------------------------------------------------

function unreachableFindings(c: Ctx, group: string, out: UnusedFinding[]): void {
    const rules: Record<string, [string, string]> = {
        script: ['TS7027', 'tsc allowUnreachableCode=false'], csharp: ['CS0162', 'csc (warning)'], java: ['unreachable statement', 'javac (an error)'],
        go: ['unreachable code', 'go vet'], rust: ['unreachable_code', 'rustc (warning)'], c: ['-Wunreachable-code', 'Clang'], python: ['W0101', 'pylint unreachable'],
        pascal: ['unreachable', 'review (Delphi gives no warning)'],
    };
    const rule = rules[group];
    if (!rule) { return; }
    const term = group === 'pascal'
        ? /^\s*(?:Exit(?:\([^)]*\))?|Abort|Break|Continue|raise\b[^;]*)\s*;\s*$/i
        : group === 'python' ? /^\s*(?:return\b.*|raise\b.*|continue|break)\s*$/
            : /^\s*(?:return\b[^{};]*|throw\b[^{};]*|break|continue|goto\s+\w+|panic\([^;]*\))\s*;?\s*$/;
    const stop = group === 'pascal' ? /^\s*(?:(?:end|else|except|finally|until)\b|\w+\s*:(?!=))/i : group === 'python' ? /^\s*(else|elif|except|finally|case)\b/ : /^\s*(\}|case\b|default\b|else\b|\)|catch\b|finally\b|\w+:$)/;
    for (let i = 0; i < c.mlines.length; i++) {
        const l = c.mlines[i];
        if (!term.test(l) || /[,(+*/&|?=]\s*;?\s*$/.test(l)) { continue; }
        let j = i + 1;
        while (j < c.mlines.length && !c.mlines[j].trim()) { j++; }
        if (j >= c.mlines.length) { break; }
        const next = c.mlines[j];
        if (stop.test(next) || indentOf(next) !== indentOf(l)) { continue; }
        const col = next.length - next.trimStart().length;
        out.push({ kind: 'unreachable', name: c.lines[j].trim().slice(0, 40), line: j, col, endCol: Math.max(col + 1, c.lines[j].trimEnd().length), rule: rule[0], tool: rule[1], message: 'Unreachable code: it follows ' + l.trim().split(/\s+/)[0].replace(/;$/, '') + ' on line ' + (i + 1) });
    }
}

/** The unused code of one file. `spans` are its routines and members as the parser of its language read them (see `spansOf`). */
export function findUnused(text: string, languageId: string, spans: UnusedSpan[], fileName = '', extra = ''): UnusedFinding[] {
    const group = GROUPS[languageId];
    const family = familyOf(languageId);
    if (!group || !family) { return []; }
    const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
    const masked = maskCode(clean, family);
    const c: Ctx = { languageId, family, ci: family.kind === 'pascal', text: clean, lines: clean.split(/\r?\n/), masked, mlines: masked.split(/\r?\n/), fileName, extra };
    const out: UnusedFinding[] = [];
    importFindings(c, group, out);
    localFindings(c, group, spans, out);
    memberFindings(c, group, spans, out);
    unreachableFindings(c, group, out);
    const seen = new Set<string>();
    return out.filter(f => { const k = f.kind + ':' + f.line + ':' + f.name; if (seen.has(k)) { return false; } seen.add(k); return true; })
        .sort((a, b) => a.line - b.line || a.col - b.col).slice(0, 300);
}

/** The routines and members of a parsed file as spans (the body of a Go routine, which the parser gives as its signature line, is found by its braces). */
export function spansOf(parsed: ParsedDocument, text: string): UnusedSpan[] {
    const family = familyOf(parsed.languageId);
    const lines = text.split(/\r?\n/);
    const bodyless = parsed.languageId === 'pascal' || parsed.languageId === 'cpp';
    const out: UnusedSpan[] = [];
    const add = (m: ClassMember, owner: string | undefined, standalone: boolean): void => {
        const impl = m.implementationRange;
        const body = impl ?? (bodyless ? undefined : m.range);
        let start = body?.start.line ?? m.range.start.line;
        let end = body?.end.line ?? start;
        if (!bodyless && end === start && family) { const b = bracedBody(lines, start, family); if (b) { start = b.start; end = b.end; } }
        const kind: UnusedSpan['kind'] = m.kind === MemberKind.Field ? 'field' : m.kind === MemberKind.Property ? 'property' : standalone ? 'function' : 'method';
        out.push({ name: m.name, owner, visibility: m.visibility, kind, start, end, line: m.range.start.line, declarations: impl && bodyless ? 2 : 1 });
    };
    for (const cls of parsed.classes) { for (const m of cls.members) { add(m, cls.isSynthetic ? undefined : cls.name, !!cls.isSynthetic && m.kind !== MemberKind.Field); } }
    for (const m of parsed.standaloneProcedures) { add(m, undefined, true); }
    return out;
}

/** The unused code of a file that a provider has parsed. `extra` is text elsewhere that names things of the file (the .dfm of a Delphi unit). */
export function unusedInParsed(parsed: ParsedDocument, text: string, fileName: string, extra = ''): UnusedFinding[] {
    return findUnused(text, parsed.languageId, spansOf(parsed, text), fileName, extra);
}
