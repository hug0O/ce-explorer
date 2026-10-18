/**
 * Lexical scanner for PL/SQL source: strips comments and string literals,
 * tokenizes, and finds the END that closes a package / subprogram while
 * understanding nested subprograms, anonymous blocks, CASE and the
 * `END IF` / `END LOOP` / `END CASE` forms. Pure (no VS Code dependency).
 */

export interface Tok {
    text: string;
    /** Upper-cased text for keyword tests. */
    up: string;
    start: number;
    end: number;
    line: number;
}

/**
 * Same-length copy of `text` where comments (`--`, block comments) and the
 * contents of string literals ('…', q'[…]', "…") are replaced by spaces; line
 * breaks are kept, so offsets and line numbers still match the source.
 */
export function cleanPlSql(text: string): string {
    const out = text.split('');
    const blank = (from: number, to: number): void => {
        for (let k = from; k < to && k < out.length; k++) { if (out[k] !== '\n' && out[k] !== '\r') { out[k] = ' '; } }
    };
    let i = 0;
    while (i < text.length) {
        const c = text[i];
        const n = text[i + 1];
        if (c === '-' && n === '-') {
            let e = text.indexOf('\n', i);
            if (e < 0) { e = text.length; }
            blank(i, e);
            i = e;
        } else if (c === '/' && n === '*') {
            let e = text.indexOf('*/', i + 2);
            e = e < 0 ? text.length : e + 2;
            blank(i, e);
            i = e;
        } else if ((c === 'q' || c === 'Q') && n === '\'' && i + 3 < text.length && !/[\w$#]/.test(text[i - 1] ?? ' ')) {
            const open = text[i + 2];
            const close = ({ '[': ']', '(': ')', '{': '}', '<': '>' } as Record<string, string>)[open] ?? open;
            let e = text.indexOf(close + '\'', i + 3);
            e = e < 0 ? text.length : e + 2;
            blank(i + 2, e);
            i = e;
        } else if (c === '\'') {
            let e = i + 1;
            while (e < text.length) {
                if (text[e] === '\'' && text[e + 1] === '\'') { e += 2; continue; }
                if (text[e] === '\'') { e++; break; }
                e++;
            }
            blank(i + 1, e - 1);
            i = e;
        } else if (c === '"') {
            let e = text.indexOf('"', i + 1);
            e = e < 0 ? text.length : e + 1;
            i = e;
        } else {
            i++;
        }
    }
    return out.join('');
}

export function lineStartsOf(text: string): number[] {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') { starts.push(i + 1); }
    }
    return starts;
}

export function lineOfOffset(starts: number[], offset: number): number {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= offset) { lo = mid; } else { hi = mid - 1; }
    }
    return lo;
}

const TOKEN_RE = /"[^"\n]*"|[A-Za-z_][\w$#]*(?:\.[A-Za-z_][\w$#]*)*(?:%[A-Za-z]+)?|:=|=>|\|\||[();,]|\S/g;

export function tokenize(clean: string, starts: number[]): Tok[] {
    const toks: Tok[] = [];
    TOKEN_RE.lastIndex = 0;
    for (let m = TOKEN_RE.exec(clean); m; m = TOKEN_RE.exec(clean)) {
        toks.push({ text: m[0], up: m[0].toUpperCase(), start: m.index, end: m.index + m[0].length, line: lineOfOffset(starts, m.index) });
    }
    return toks;
}

export interface Close {
    /** Index of the closing END token. */
    closeIdx: number;
    /** Index of the BEGIN that starts the outermost body (undefined when none). */
    beginIdx?: number;
}

interface Frame { kind: 'sub' | 'pkg' | 'block' | 'case'; begun: boolean }

/** Whether the PROCEDURE/FUNCTION at `i` is a definition (IS/AS before any `;`), and where its signature stops. */
export function signatureEnd(toks: Tok[], i: number): { idx: number; definition: boolean } {
    let depth = 0;
    for (let j = i + 1; j < toks.length; j++) {
        const t = toks[j];
        if (t.text === '(') { depth++; }
        else if (t.text === ')') { depth--; }
        else if (depth <= 0 && t.text === ';') { return { idx: j, definition: false }; }
        else if (depth <= 0 && (t.up === 'IS' || t.up === 'AS')) { return { idx: j, definition: true }; }
    }
    return { idx: toks.length - 1, definition: false };
}

/**
 * From token `from` (just after a package's / subprogram's `IS|AS`), finds the
 * END that closes it. Nested subprogram definitions, DECLARE/BEGIN blocks and
 * CASE open frames; `END IF` and `END LOOP` are ignored.
 */
export function findClose(toks: Tok[], from: number, kind: 'sub' | 'pkg'): Close | undefined {
    const stack: Frame[] = [{ kind, begun: false }];
    let beginIdx: number | undefined;
    for (let i = from; i < toks.length; i++) {
        const up = toks[i].up;
        const top = stack[stack.length - 1];
        if (up === 'PROCEDURE' || up === 'FUNCTION') {
            if (top.kind === 'case' || (top.begun && top.kind !== 'pkg')) { continue; }
            const sig = signatureEnd(toks, i);
            if (sig.definition) { stack.push({ kind: 'sub', begun: false }); }
            i = sig.idx;
        } else if (up === 'DECLARE') {
            stack.push({ kind: 'block', begun: false });
        } else if (up === 'BEGIN') {
            if (top.kind !== 'case' && !top.begun) {
                top.begun = true;
                if (stack.length === 1 && beginIdx === undefined) { beginIdx = i; }
            } else {
                stack.push({ kind: 'block', begun: true });
            }
        } else if (up === 'CASE') {
            stack.push({ kind: 'case', begun: true });
        } else if (up === 'END') {
            const next = toks[i + 1]?.up;
            if (next === 'IF' || next === 'LOOP') { i++; continue; }
            if (next === 'CASE') { i++; }
            stack.pop();
            if (stack.length === 0) { return { closeIdx: i, beginIdx }; }
        }
    }
    return undefined;
}

/** Index just after the `;` that ends the statement containing token `i` (parentheses respected). */
export function statementEnd(toks: Tok[], i: number): number {
    let depth = 0;
    for (let j = i; j < toks.length; j++) {
        if (toks[j].text === '(') { depth++; }
        else if (toks[j].text === ')') { depth--; }
        else if (depth <= 0 && toks[j].text === ';') { return j + 1; }
    }
    return toks.length;
}
