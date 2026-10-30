/**
 * The call graph of a source file for the Blueprint view: which routine calls which, read from the text of the bodies, and the text edits
 * that add or remove a call. Pure (text and line numbers in and out) so it is tested without VS Code.
 */

/** How a language writes comments, strings and calls. */
export interface CodeFamily {
    kind: 'pascal' | 'c' | 'hash' | 'sql' | 'batch';
    /** A call is written with parentheses (`f()`), so a bare word is not a call. */
    needParen: boolean;
    /** The statement that calls `name` with these arguments. */
    statement: (name: string, args: string[]) => string;
    /** Whether the body is closed by a line of its own (`end;`, `}`) before which a statement goes. */
    closer: RegExp | undefined;
}

const argList = (a: string[]): string => (a.length ? '(' + a.join(', ') + ')' : '');

const PASCAL: CodeFamily = { kind: 'pascal', needParen: false, statement: (n, a) => n + argList(a) + ';', closer: /^\s*end\b/i };
const C_LIKE: CodeFamily = { kind: 'c', needParen: true, statement: (n, a) => n + '(' + a.join(', ') + ');', closer: /^\s*\}/ };
const PYTHON: CodeFamily = { kind: 'hash', needParen: true, statement: (n, a) => n + '(' + a.join(', ') + ')', closer: undefined };
const SQL: CodeFamily = { kind: 'sql', needParen: false, statement: (n, a) => n + argList(a) + ';', closer: /^\s*end\b/i };
const POWERSHELL: CodeFamily = { kind: 'hash', needParen: false, statement: (n, a) => [n, ...a.map(x => '$' + x.replace(/^\$/, ''))].join(' '), closer: /^\s*\}/ };
const SHELL: CodeFamily = { kind: 'hash', needParen: false, statement: (n, a) => [n, ...a].join(' '), closer: /^\s*\}/ };
const BATCH: CodeFamily = { kind: 'batch', needParen: false, statement: (n, a) => ['call :' + n, ...a].join(' '), closer: undefined };

const FAMILIES: Record<string, CodeFamily> = {
    pascal: PASCAL, cpp: C_LIKE, java: C_LIKE, csharp: C_LIKE, go: C_LIKE, rust: C_LIKE,
    typescript: C_LIKE, typescriptreact: C_LIKE, javascript: C_LIKE, javascriptreact: C_LIKE,
    python: PYTHON, plsql: SQL, powershell: POWERSHELL, shellscript: SHELL, bat: BATCH,
};

/** The family of a language id, or undefined when the language has no routines to draw (Markdown). */
export function familyOf(languageId: string): CodeFamily | undefined { return FAMILIES[languageId]; }

/** The text with comments and strings blanked (same length, same lines), so that a word found in it is code. */
export function maskCode(text: string, family: CodeFamily): string {
    const out = text.split('');
    const blank = (from: number, to: number): void => { for (let i = from; i < to && i < out.length; i++) { if (out[i] !== '\n' && out[i] !== '\r') { out[i] = ' '; } } };
    const n = text.length;
    let i = 0;
    const lineStart = (k: number): boolean => k === 0 || text[k - 1] === '\n';
    while (i < n) {
        const ch = text[i];
        const two = text.substr(i, 2);
        if (family.kind === 'batch' && lineStart(i)) {
            const m = /^[ \t]*(?:@?rem\b|::)[^\n]*/i.exec(text.slice(i, text.indexOf('\n', i) < 0 ? n : text.indexOf('\n', i)));
            if (m) { blank(i, i + m[0].length); i += m[0].length; continue; }
        }
        if (family.kind === 'pascal') {
            if (two === '//') { const e = text.indexOf('\n', i); const to = e < 0 ? n : e; blank(i, to); i = to; continue; }
            if (ch === '{') { const e = text.indexOf('}', i); const to = e < 0 ? n : e + 1; blank(i, to); i = to; continue; }
            if (two === '(*') { const e = text.indexOf('*)', i + 2); const to = e < 0 ? n : e + 2; blank(i, to); i = to; continue; }
        }
        if (family.kind === 'c' || family.kind === 'sql') {
            const line = family.kind === 'c' ? '//' : '--';
            if (two === line) { const e = text.indexOf('\n', i); const to = e < 0 ? n : e; blank(i, to); i = to; continue; }
            if (two === '/*') { const e = text.indexOf('*/', i + 2); const to = e < 0 ? n : e + 2; blank(i, to); i = to; continue; }
        }
        if (family.kind === 'hash' && ch === '#' && (i === 0 || /[\s;]/.test(text[i - 1]))) { const e = text.indexOf('\n', i); const to = e < 0 ? n : e; blank(i, to); i = to; continue; }
        const quotes = family.kind === 'c' ? '"\'`' : family.kind === 'batch' ? '"' : family.kind === 'hash' ? '"\'' : '\'';
        if (quotes.includes(ch)) {
            let j = i + 1;
            while (j < n && text[j] !== ch && text[j] !== '\n') { if (text[j] === '\\' && family.kind !== 'pascal' && family.kind !== 'sql') { j++; } j++; }
            blank(i + 1, Math.min(j, n));
            i = Math.min(j + 1, n);
            continue;
        }
        i++;
    }
    return out.join('');
}

/** A routine as the call graph needs it: its name, its owner, and the lines of its body (first line = its header). */
export interface GraphRoutine {
    id: string;
    name: string;
    owner?: string;
    /** First and last line of the text to search for calls, the header line included; undefined for a bare declaration. */
    body?: { start: number; end: number };
}

export interface GraphCall {
    from: string;
    to: string;
    /** Lines (0-based) of the call sites. */
    lines: number[];
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The routine a name stands for, seen from a routine of `owner`: the same owner first, then the first one found. */
function resolve(byName: Map<string, GraphRoutine[]>, name: string, owner: string | undefined): GraphRoutine | undefined {
    const list = byName.get(name.toLowerCase());
    if (!list) { return undefined; }
    return list.find(r => r.owner === owner) ?? list[0];
}

/** The call sites of `name` in a (masked) line: positions of the word, not after a `.` unless it is `Self.` / `this.`. */
export function callSites(masked: string, name: string, family: CodeFamily, anyReceiver = false): number[] {
    const out: number[] = [];
    const flags = family.kind === 'pascal' || family.kind === 'sql' || family.kind === 'batch' ? 'gi' : 'g';
    const re = new RegExp('(?<![\\w$])' + escapeRe(name) + '(?![\\w$])', flags);
    for (const m of masked.matchAll(re)) {
        const at = m.index ?? 0;
        const before = masked.slice(0, at);
        if (/\.\s*$/.test(before) && !/\b(?:self|this)\s*\.\s*$/i.test(before) && !(anyReceiver && /[\w)\]]\s*\.\s*$/.test(before))) { continue; }
        if (family.kind === 'batch' && !/\b(?:call|goto)\s+:?$/i.test(before)) { continue; }
        if (family.needParen && !/^\s*\(/.test(masked.slice(at + name.length))) { continue; }
        if (family.kind === 'hash' && family.needParen === false && /^\s*=/.test(masked.slice(at + name.length))) { continue; }
        out.push(at);
    }
    return out;
}

/**
 * The body of a routine written with braces, when the parser gave only its signature line (Go, for one): from the line where it starts
 * to the line of the brace that closes it. Undefined when no brace opens it (a declaration) or none closes it.
 */
export function bracedBody(lines: string[], start: number, family: CodeFamily): { start: number; end: number } | undefined {
    if (family.kind !== 'c') { return undefined; }
    const masked = maskCode(lines.join('\n'), family).split('\n');
    let depth = 0;
    let opened = false;
    for (let l = start; l < masked.length; l++) {
        for (const ch of masked[l]) {
            if (ch === ';' && !opened && depth === 0) { return undefined; }
            if (ch === '{') { depth++; opened = true; } else if (ch === '}') { depth--; if (opened && depth === 0) { return { start, end: l }; } }
        }
        if (l - start > 5 && !opened) { return undefined; }
    }
    return undefined;
}

/** Every call from a routine to another routine of the file (a recursive call is not an edge: see `recursive`). */
export function findCalls(routines: GraphRoutine[], lines: string[], family: CodeFamily): { calls: GraphCall[]; recursive: Set<string> } {
    const byName = new Map<string, GraphRoutine[]>();
    for (const r of routines) { byName.set(r.name.toLowerCase(), [...(byName.get(r.name.toLowerCase()) ?? []), r]); }
    const masked = maskCode(lines.join('\n'), family).split('\n');
    // `obj.method(...)`: the type of the receiver is not known, so it counts only for a method whose name no other routine of the file has
    const viaObject = new Set<string>();
    if (family.needParen) { for (const [k, list] of byName) { if (list.length === 1 && list[0].owner) { viaObject.add(k); } } }
    const acc = new Map<string, GraphCall>();
    const recursive = new Set<string>();
    for (const r of routines) {
        if (!r.body) { continue; }
        for (let l = r.body.start + 1; l <= Math.min(r.body.end, masked.length - 1); l++) {
            const line = masked[l];
            if (family.kind === 'pascal' && /^\s*(procedure|function|constructor|destructor)\b/i.test(line)) { continue; }
            for (const target of new Set(routines.map(x => x.name))) {
                if (callSites(line, target, family, viaObject.has(target.toLowerCase())).length === 0) { continue; }
                const to = resolve(byName, target, r.owner);
                if (!to) { continue; }
                if (to.id === r.id) { recursive.add(r.id); continue; }
                const key = r.id + '>' + to.id;
                const c = acc.get(key) ?? { from: r.id, to: to.id, lines: [] };
                if (!c.lines.includes(l)) { c.lines.push(l); }
                acc.set(key, c);
            }
        }
    }
    return { calls: [...acc.values()], recursive };
}

// --- edits ------------------------------------------------------------------------------------------------------------------

export interface LineEdit { line: number; character: number; endLine: number; endCharacter: number; text: string }

const indentOf = (s: string): string => /^[ \t]*/.exec(s)![0];

/**
 * The edit that makes `routine` call `callee`: a statement at the end of its body, with the indentation of the statements already
 * there. `args` are the names written between the parentheses (the parameters of the callee, to be filled in).
 */
export function addCallEdit(lines: string[], body: { start: number; end: number }, calleeName: string, args: string[], family: CodeFamily): LineEdit | undefined {
    const statement = family.statement(calleeName, args);
    let last = Math.min(body.end, lines.length - 1);
    while (last > body.start && !lines[last].trim()) { last--; }
    if (family.kind === 'batch') {
        // before a final `exit /b` / `goto :eof`, else after the last line
        const tail = /^\s*(exit\b|goto\s+:eof\b)/i.test(lines[last]);
        const at = tail ? last : last + 1;
        const ref = lines[tail ? last : last];
        return { line: at, character: 0, endLine: at, endCharacter: 0, text: indentOf(ref) + statement + '\n' };
    }
    if (family.closer) {
        // the statement goes before the line that closes the body
        let close = last;
        while (close > body.start && !family.closer.test(lines[close])) { close--; }
        if (close <= body.start) { return undefined; }
        let prev = close - 1;
        while (prev > body.start && !lines[prev].trim()) { prev--; }
        const ind = prev > body.start && !/^\s*(begin|is|as|declare)\b/i.test(lines[prev]) && !/\{\s*$/.test(lines[prev]) ? indentOf(lines[prev]) : indentOf(lines[close]) + (/\t/.test(lines[close]) ? '\t' : '  ');
        return { line: close, character: 0, endLine: close, endCharacter: 0, text: ind + statement + '\n' };
    }
    // indentation-based (Python): after the last line of the body, at the indentation of its first statement
    let first = body.start + 1;
    while (first <= last && !lines[first].trim()) { first++; }
    const ind = first <= last ? indentOf(lines[first]) : indentOf(lines[body.start]) + '    ';
    return { line: last + 1, character: 0, endLine: last + 1, endCharacter: 0, text: ind + statement + '\n' };
}

/** The edit that removes the call of `callee` written on a line: the whole line when the call is all there is, else just the call. */
export function removeCallEdit(lines: string[], line: number, calleeName: string, family: CodeFamily): LineEdit | undefined {
    const text = lines[line] ?? '';
    const masked = maskCode(text, family);
    const w = escapeRe(calleeName);
    const call = family.kind === 'batch'
        ? new RegExp('\\b(?:call|goto)\\s+:?' + w + '\\b[^\\r\\n]*', 'i')
        : new RegExp('(?:\\b(?:self|this)\\s*\\.\\s*' + w + '|(?<![\\w$.])' + w + ')(?![\\w$])(?:\\s*\\([^;]*\\))?' + (family.kind === 'hash' && !family.needParen ? '(?:[^\\S\\r\\n]+[^;\\r\\n]*)?' : ''), family.kind === 'pascal' || family.kind === 'sql' ? 'i' : '');
    const m = call.exec(masked);
    if (!m) { return undefined; }
    const from = m.index;
    let to = from + m[0].length;
    if (masked[to] === ';') { to++; }
    const rest = (text.slice(0, from) + text.slice(to)).trim();
    if (!rest) {
        return { line, character: 0, endLine: line + 1, endCharacter: 0, text: '' };
    }
    return { line, character: from, endLine: line, endCharacter: to, text: '' };
}

/** Applies line edits to a text (for tests and for previews): edits are applied from the last to the first. */
export function applyLineEdits(lines: string[], edits: LineEdit[]): string[] {
    let text = lines.join('\n');
    const offsets: number[] = [];
    let o = 0;
    for (const l of lines) { offsets.push(o); o += l.length + 1; }
    offsets.push(o);
    const at = (line: number, ch: number): number => (offsets[line] ?? text.length + 1) + ch;
    for (const e of [...edits].sort((a, b) => b.line - a.line || b.character - a.character)) {
        text = text.slice(0, at(e.line, e.character)) + e.text + text.slice(Math.min(text.length, at(e.endLine, e.endCharacter)));
    }
    return text.split('\n');
}
