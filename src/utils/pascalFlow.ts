/**
 * The flow of a Pascal routine for the Blueprint: its statements as nodes (a call, an assignment, an `if`, a loop, a `case`, a `try`) and
 * the order they run in as wires, with `yes` / `no` on the branches. A reader, not a compiler: it follows the structure of
 * begin / end, if / else, while, for, repeat, case and try, and treats anything else as one statement. Pure.
 */
import { familyOf, maskCode } from './callGraph';

export type FlowKind = 'start' | 'end' | 'call' | 'assign' | 'exit' | 'if' | 'loop' | 'case' | 'try';

export interface FlowNode {
    id: string;
    kind: FlowKind;
    /** The word on the title bar: `if`, `while`, `call`… */
    title: string;
    /** The statement or the condition, on one line. */
    text: string;
    line: number;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface FlowEdge { from: string; to: string; label?: string; back?: boolean }
export interface Flow { nodes: FlowNode[]; edges: FlowEdge[] }

interface Token { text: string; lower: string; at: number; end: number }

const WORD = /[A-Za-z_][\w.]*|:=|[^\s]/g;
const ROUTINE_KW = new Set(['procedure', 'function', 'constructor', 'destructor']);
const OPENERS = new Set(['case', 'try', 'asm', 'record']);

type Stmt =
    | { t: 'seq'; items: Stmt[] }
    | { t: 'simple'; text: string; line: number; kind: 'call' | 'assign' | 'exit' }
    | { t: 'if'; cond: string; line: number; then?: Stmt; else?: Stmt }
    | { t: 'loop'; kw: string; cond: string; line: number; body?: Stmt }
    | { t: 'case'; expr: string; line: number; branches: { label: string; body?: Stmt }[]; else?: Stmt }
    | { t: 'try'; line: number; body?: Stmt; handler?: { kw: string; body?: Stmt } };

const clean = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** The statement tree of the body of a routine given as its lines (header included); undefined when no body is found. */
export function parseBody(lines: string[]): { tree: Stmt; name: string; firstLine: number } | undefined {
    const original = lines.join('\n');
    const masked = maskCode(original, familyOf('pascal')!);
    const toks: Token[] = [];
    for (const m of masked.matchAll(WORD)) { toks.push({ text: original.slice(m.index!, m.index! + m[0].length), lower: m[0].toLowerCase(), at: m.index!, end: m.index! + m[0].length }); }
    const lineOf = (off: number): number => original.slice(0, off).split('\n').length - 1;
    // the header's name, then the `begin` that opens the body (not the one of a nested routine)
    const nameTok = toks.find((t, i) => i > 0 && /^[A-Za-z_]/.test(t.text) && ROUTINE_KW.has(toks[0].lower));
    let depth = 0;
    let nested = false;
    let start = -1;
    for (let i = 1; i < toks.length; i++) {
        const t = toks[i].lower;
        if (depth === 0 && ROUTINE_KW.has(t)) { nested = true; }
        if (t === 'begin') {
            if (depth === 0 && !nested) { start = i; break; }
            depth++;
        } else if (OPENERS.has(t)) { depth++; }
        else if (t === 'end') { depth = Math.max(0, depth - 1); if (depth === 0) { nested = false; } }
    }
    if (start < 0) { return undefined; }
    let p = start;
    const peek = (): string => toks[p]?.lower ?? '';
    const text = (a: number, b: number): string => (b > a ? clean(original.slice(toks[a].at, toks[b - 1].end)) : '');

    const collectUntil = (stop: string): string => {
        const a = p;
        let par = 0;
        while (p < toks.length && !(par === 0 && toks[p].lower === stop)) {
            if (toks[p].text === '(' || toks[p].text === '[') { par++; } else if (toks[p].text === ')' || toks[p].text === ']') { par--; }
            p++;
        }
        const s = text(a, p);
        if (peek() === stop) { p++; }
        return s;
    };
    const STOP = new Set(['end', 'else', 'until', 'except', 'finally']);
    const statements = (...closers: string[]): Stmt => {
        const items: Stmt[] = [];
        while (p < toks.length && !closers.includes(peek())) {
            if (peek() === ';') { p++; continue; }
            const before = p;
            const s = statement();
            if (s) { items.push(s); }
            if (p === before) { p++; }
        }
        return { t: 'seq', items };
    };
    const statement = (): Stmt | undefined => {
        const tok = toks[p];
        if (!tok) { return undefined; }
        const line = lineOf(tok.at);
        switch (tok.lower) {
            case 'begin': { p++; const s = statements('end'); p++; return s; }
            case 'if': {
                p++;
                const cond = collectUntil('then');
                const then = statement();
                let els: Stmt | undefined;
                if (peek() === 'else') { p++; els = statement(); }
                return { t: 'if', cond, line, then, else: els };
            }
            case 'while': case 'for': case 'with': {
                p++;
                const cond = collectUntil('do');
                return { t: 'loop', kw: tok.lower, cond, line, body: statement() };
            }
            case 'repeat': {
                p++;
                const body = statements('until');
                p++;
                const a = p;
                while (p < toks.length && peek() !== ';' && !STOP.has(peek())) { p++; }
                return { t: 'loop', kw: 'repeat', cond: text(a, p), line, body };
            }
            case 'case': {
                p++;
                const expr = collectUntil('of');
                const branches: { label: string; body?: Stmt }[] = [];
                let els: Stmt | undefined;
                while (p < toks.length && peek() !== 'end') {
                    if (peek() === ';') { p++; continue; }
                    if (peek() === 'else') { p++; els = statements('end'); break; }
                    const label = collectUntil(':');
                    branches.push({ label, body: statement() });
                }
                p++;
                return { t: 'case', expr, line, branches, else: els };
            }
            case 'try': {
                p++;
                const body = statements('except', 'finally');
                const kw = peek();
                p++;
                const handler = statements('end');
                p++;
                return { t: 'try', line, body, handler: { kw, body: handler } };
            }
            default: {
                const a = p;
                let par = 0;
                while (p < toks.length) {
                    const t = toks[p];
                    if (t.text === '(' || t.text === '[') { par++; } else if (t.text === ')' || t.text === ']') { par--; }
                    if (par <= 0 && (t.text === ';' || (p > a && STOP.has(t.lower)))) { break; }
                    p++;
                }
                const s = text(a, p);
                const first = tok.lower;
                const kind = ['exit', 'raise', 'break', 'continue', 'halt', 'abort'].includes(first) ? 'exit' : /:=/.test(masked.slice(tok.at, toks[Math.max(a, p - 1)].end)) ? 'assign' : 'call';
                return s ? { t: 'simple', text: s, line, kind } : undefined;
            }
        }
    };
    p = start + 1;
    const tree = statements('end');
    return { tree, name: nameTok?.text ?? '', firstLine: lineOf(toks[start].at) };
}

// --- layout -------------------------------------------------------------------------------------------------------------------

const H = 66;
const GAP_X = 46;
const GAP_Y = 22;
const MAX_NODES = 400;

interface Exit { id: string; label?: string }
interface Frag { entry: string; exits: Exit[]; ids: string[]; w: number; above: number; below: number }

export function buildFlow(lines: string[], baseLine = 0): Flow | undefined {
    const parsed = parseBody(lines);
    if (!parsed) { return undefined; }
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    let count = 0;
    const add = (kind: FlowKind, title: string, text: string, line: number): FlowNode => {
        const t = text.length > 46 ? text.slice(0, 45) + '…' : text;
        const n: FlowNode = { id: 'f' + count++, kind, title, text: t, line: baseLine + line, x: 0, y: 0, w: Math.max(116, Math.min(280, Math.round(t.length * 6.3 + 30))), h: H };
        nodes.push(n);
        return n;
    };
    const byId = (id: string): FlowNode => nodes.find(n => n.id === id)!;
    const shift = (f: Frag, dx: number, dy: number): void => { for (const id of f.ids) { const n = byId(id); n.x += dx; n.y += dy; } };
    const link = (from: Exit[], to: string): void => { for (const e of from) { edges.push({ from: e.id, to, label: e.label }); } };
    const single = (n: FlowNode): Frag => ({ entry: n.id, exits: [{ id: n.id }], ids: [n.id], w: n.w, above: H / 2, below: H / 2 });

    const build = (s: Stmt | undefined): Frag | undefined => {
        if (!s || count > MAX_NODES) { return undefined; }
        switch (s.t) {
            case 'simple': { const n = add(s.kind, s.kind === 'exit' ? s.text.split(/\s/)[0].toLowerCase() : s.kind, s.text, s.line); n.y = -H / 2; return single(n); }
            case 'seq': {
                let cursor = 0;
                let prev: Frag | undefined;
                let first: Frag | undefined;
                const ids: string[] = [];
                let above = 0, below = 0;
                for (const item of s.items) {
                    const f = build(item);
                    if (!f) { continue; }
                    shift(f, cursor, 0);
                    if (prev) { link(prev.exits, f.entry); } else { first = f; }
                    cursor += f.w + GAP_X;
                    ids.push(...f.ids);
                    above = Math.max(above, f.above); below = Math.max(below, f.below);
                    prev = f;
                }
                if (!first || !prev) { return undefined; }
                return { entry: first.entry, exits: prev.exits, ids, w: cursor - GAP_X, above, below };
            }
            case 'if': {
                const c = add('if', 'if', s.cond, s.line); c.y = -H / 2;
                const t = build(s.then), e = build(s.else);
                return branching(c, [{ f: t, label: 'yes' }, { f: e, label: 'no' }], s.else ? undefined : { id: c.id, label: 'no' });
            }
            case 'case': {
                const c = add('case', 'case', s.expr, s.line); c.y = -H / 2;
                const parts = s.branches.map(b => ({ f: build(b.body), label: b.label.length > 18 ? b.label.slice(0, 17) + '…' : b.label }));
                if (s.else) { parts.push({ f: build(s.else), label: 'else' }); }
                return branching(c, parts, parts.every(p => !p.f) ? { id: c.id } : undefined);
            }
            case 'loop': {
                const c = add('loop', s.kw === 'repeat' ? 'repeat until' : s.kw, s.cond, s.line); c.y = -H / 2;
                const b = build(s.body);
                const frag = branching(c, [{ f: b, label: 'each' }], { id: c.id, label: 'done' });
                if (b) { for (const x of b.exits) { edges.push({ from: x.id, to: c.id, back: true }); } frag.exits = [{ id: c.id, label: 'done' }]; }
                return frag;
            }
            case 'try': {
                const c = add('try', 'try', s.handler?.kw ? 'try ... ' + s.handler.kw : 'try', s.line); c.y = -H / 2;
                const b = build(s.body), h = build(s.handler?.body);
                return branching(c, [{ f: b, label: '' }, { f: h, label: s.handler?.kw ?? '' }], undefined);
            }
        }
        return undefined;
    };

    /** A node with its branches stacked at its right (centred on it); `fallthrough` is the exit of a branch that does not exist. */
    const branching = (c: FlowNode, parts: { f: Frag | undefined; label: string }[], fallthrough: Exit | undefined): Frag => {
        const real = parts.filter((p): p is { f: Frag; label: string } => !!p.f);
        const ids = [c.id];
        const exits: Exit[] = [];
        let w = c.w;
        let above = H / 2, below = H / 2;
        if (real.length) {
            const total = real.reduce((a, p) => a + p.f.above + p.f.below, 0) + GAP_Y * (real.length - 1);
            let top = -total / 2;
            for (const p of real) {
                const base = top + p.f.above;
                shift(p.f, c.w + GAP_X, base);
                edges.push({ from: c.id, to: p.f.entry, label: p.label || undefined });
                ids.push(...p.f.ids);
                exits.push(...p.f.exits);
                w = Math.max(w, c.w + GAP_X + p.f.w);
                top += p.f.above + p.f.below + GAP_Y;
            }
            above = Math.max(above, total / 2); below = Math.max(below, total / 2);
        }
        if (fallthrough) { exits.push(fallthrough); }
        return { entry: c.id, exits, ids, w, above, below };
    };

    const start = add('start', 'start', parsed.name, 0); start.y = -H / 2;
    const body = build(parsed.tree);
    const end = add('end', 'end', '', 0); end.y = -H / 2;
    let cursor = start.w + GAP_X;
    let tail: Exit[] = [{ id: start.id }];
    if (body) {
        shift(body, cursor, 0);
        link(tail, body.entry);
        tail = body.exits;
        cursor += body.w + GAP_X;
    }
    end.x = cursor;
    link(tail, end.id);
    const all = [start, ...(body ? body.ids.map(byId) : []), end];
    const y0 = Math.min(...all.map(n => n.y));
    for (const n of nodes) { n.y -= y0 - 10; n.x += 10; }
    return { nodes, edges };
}
