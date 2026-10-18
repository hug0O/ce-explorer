/**
 * Vertical alignment of a block of lines on a user-supplied string
 * (`:=`, `:`, `=`, `//`, `=>`…), pure so it can be unit tested.
 */

/** Index of the first occurrence of `token` that is not inside a '...' or "..." literal, or -1. */
export function findTokenOutsideQuotes(line: string, token: string): number {
    let quote: string | undefined;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quote) {
            if (ch === quote) { quote = undefined; }
            continue;
        }
        if (line.startsWith(token, i)) { return i; }
        if (ch === '\'' || ch === '"') { quote = ch; }
    }
    return -1;
}

/** Display width of `text` with tabs expanded to `tabSize` columns. */
function visualWidth(text: string, tabSize: number): number {
    let width = 0;
    for (const ch of text) {
        width += ch === '\t' ? tabSize - (width % tabSize) : 1;
    }
    return width;
}

export interface AlignResult {
    lines: string[];
    /** Number of lines that contained the token and were aligned. */
    aligned: number;
}

/**
 * Pads the text before the first `token` of each line so that every token
 * starts in the same column (one space of separation minimum). Lines without
 * the token are left untouched. Idempotent. With fewer than two matching
 * lines there is nothing to align and the input is returned unchanged.
 */
export function alignLines(lines: string[], token: string, tabSize = 4): AlignResult {
    const needle = token.trim();
    if (!needle) { return { lines: [...lines], aligned: 0 }; }

    const parts = lines.map(line => {
        const idx = findTokenOutsideQuotes(line, needle);
        if (idx < 0) { return undefined; }
        return { left: line.slice(0, idx).replace(/[ \t]+$/, ''), right: line.slice(idx) };
    });
    const matching = parts.filter(p => p !== undefined) as { left: string; right: string }[];
    if (matching.length < 2) { return { lines: [...lines], aligned: matching.length }; }

    const column = Math.max(...matching.map(p => visualWidth(p.left, tabSize))) + 1;
    const out = lines.map((line, i) => {
        const p = parts[i];
        if (!p) { return line; }
        return p.left + ' '.repeat(column - visualWidth(p.left, tabSize)) + p.right;
    });
    return { lines: out, aligned: matching.length };
}
