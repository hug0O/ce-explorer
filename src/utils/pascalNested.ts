/**
 * Routines declared inside a Pascal routine: between its header and its own `begin`, after the `var` section,
 * `procedure Calc; var … begin … end;` (what some call "functions declared as variables").
 *
 * They have a body of their own and may hold others, so each is found with the extent of its body.
 * Pure: works on the unit with its comments and strings blanked (`blankPascal`), same lines.
 */

export interface NestedRoutine {
    name: string;
    kind: 'procedure' | 'function';
    /** 0-based line of its header. */
    line: number;
    /** 0-based line of the `end;` that closes it. */
    endLine: number;
    /** 0 for a routine declared directly in the routine, 1 for one declared in that one… */
    depth: number;
    /** The routine it is declared in. */
    parent: string;
}

const START = /^(?:class\s+)?(procedure|function)\s+([A-Za-z_]\w*)/i;
const OPEN = /\b(begin|try|case|asm|record)\b/gi;
const CLOSE = /\bend\b/gi;

/** Line where the header that starts on `from` ends: the one with the `;` outside the parentheses. */
function headerEnd(code: string[], from: number, to: number): number {
    let depth = 0;
    for (let i = from; i <= to && i < code.length; i++) {
        for (const ch of code[i]) {
            if (ch === '(') { depth++; } else if (ch === ')') { depth--; } else if (ch === ';' && depth <= 0) { return i; }
        }
    }
    return Math.min(from, to);
}

/** Line of the `end` that closes the block that opens at or after `from`; `to` when it never closes. */
function blockEnd(code: string[], from: number, to: number): number {
    let depth = 0;
    let opened = false;
    for (let i = from; i <= to && i < code.length; i++) {
        const l = code[i];
        const open = (l.match(OPEN) ?? []).length;
        const close = (l.match(CLOSE) ?? []).length;
        if (open) { opened = true; }
        depth += open - close;
        if (opened && depth <= 0 && close > 0) { return i; }
    }
    return to;
}

/** Line of the `end;` that closes the routine whose header starts on `header`: the declarations (nested routines included) come first, then its own body. */
export function routineEnd(code: string[], header: number, to: number): number {
    let i = headerEnd(code, header, to) + 1;
    while (i <= to && i < code.length) {
        const text = code[i].trim();
        if (/^(begin|asm)\b/i.test(text)) { return blockEnd(code, i, to); }
        if (START.test(text)) {
            const end = headerEnd(code, i, to);
            i = /\b(forward|external)\b/i.test(code.slice(i, end + 1).join(' ')) ? end + 1 : routineEnd(code, i, to) + 1;
            continue;
        }
        i++;
    }
    return to;
}

function scan(code: string[], header: number, to: number, depth: number, parent: string, out: NestedRoutine[]): void {
    let i = headerEnd(code, header, to) + 1;
    while (i <= to && i < code.length) {
        const text = code[i].trim();
        // the body of the routine itself: what follows is code, not declarations
        if (/^(begin|asm)\b/i.test(text)) { return; }
        const m = START.exec(text);
        if (!m) { i++; continue; }
        const end = headerEnd(code, i, to);
        const head = code.slice(i, end + 1).join(' ');
        // a forward or external declaration has no body of its own
        if (/\b(forward|external)\b/i.test(head)) { i = end + 1; continue; }
        const last = routineEnd(code, i, to);
        out.push({ name: m[2], kind: m[1].toLowerCase() as NestedRoutine['kind'], line: i, endLine: last, depth, parent });
        scan(code, i, last, depth + 1, m[2], out);
        i = last + 1;
    }
}

/** The routines declared inside the routine whose header starts on line `start` and whose last line is `end`, in source order. */
export function nestedRoutinesOf(code: string[], start: number, end: number, name: string): NestedRoutine[] {
    const out: NestedRoutine[] = [];
    scan(code, start, Math.min(end, code.length - 1), 0, name, out);
    return out;
}
