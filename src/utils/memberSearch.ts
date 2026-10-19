/**
 * Pure helpers of the Structure tab for the member being looked at: the lines of the
 * current file that use it, and a search inside its own code. No VS Code here, so they
 * are testable; the panel turns the results into list rows and editor highlights.
 */

export interface LineHit {
    /** 0-based line of the file. */
    line: number;
    /** The line, trimmed and shortened for a list. */
    text: string;
    /** Where the match starts and ends on the (untrimmed) line, for the highlight. */
    start: number;
    end: number;
}

/** Most rows a list shows: the count stays exact, the rows stop here. */
export const MAX_HITS = 300;

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A line as one list row: trimmed, long lines cut. */
export function clipLine(line: string, max = 120): string {
    const t = line.trim().replace(/\s+/g, ' ');
    return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

/** Line ranges (inclusive) of a member: its declaration and, when it is elsewhere, its implementation. Overlaps are merged. */
export function memberLineRanges(member: { range: { start: { line: number }; end: { line: number } }; implementationRange?: { start: { line: number }; end: { line: number } } }): [number, number][] {
    const all: [number, number][] = [[member.range.start.line, member.range.end.line]];
    if (member.implementationRange) { all.push([member.implementationRange.start.line, member.implementationRange.end.line]); }
    all.sort((a, b) => a[0] - b[0]);
    const out: [number, number][] = [];
    for (const r of all) {
        const last = out[out.length - 1];
        if (last && r[0] <= last[1] + 1) { last[1] = Math.max(last[1], r[1]); } else { out.push([r[0], r[1]]); }
    }
    return out;
}

/**
 * Lines that use `name` as a whole word, once per line. The lines in `skip` (the member's own
 * declaration and implementation header) are left out. `total` is the exact count, `hits` the first rows.
 */
export function usageLines(lines: string[], name: string, skip: ReadonlySet<number>): { hits: LineHit[]; total: number } {
    const word = name.replace(/^[~&*]+/, '');
    if (!word) { return { hits: [], total: 0 }; }
    const re = new RegExp('(?<![\\w$])' + escapeRe(word) + '(?![\\w$])', 'i');
    const hits: LineHit[] = [];
    let total = 0;
    for (let i = 0; i < lines.length; i++) {
        if (skip.has(i)) { continue; }
        const m = re.exec(lines[i]);
        if (!m) { continue; }
        total++;
        if (hits.length < MAX_HITS) { hits.push({ line: i, text: clipLine(lines[i]), start: m.index, end: m.index + word.length }); }
    }
    return { hits, total };
}

/**
 * Search inside the code of a member: the lines of `ranges` that match `query` (a regular expression when it is
 * valid, else plain text), case-insensitive. An empty query matches nothing.
 */
export function searchLines(lines: string[], ranges: [number, number][], query: string): { hits: LineHit[]; total: number; regex: boolean } {
    const q = query.trim();
    if (!q) { return { hits: [], total: 0, regex: false }; }
    let re: RegExp;
    let regex = true;
    try { re = new RegExp(q, 'i'); } catch { re = new RegExp(escapeRe(q), 'i'); regex = false; }
    if (re.test('')) { re = new RegExp(escapeRe(q), 'i'); regex = false; }
    const hits: LineHit[] = [];
    let total = 0;
    for (const [from, to] of ranges) {
        for (let i = from; i <= to && i < lines.length; i++) {
            const m = re.exec(lines[i]);
            if (!m) { continue; }
            total++;
            if (hits.length < MAX_HITS) { hits.push({ line: i, text: clipLine(lines[i]), start: m.index, end: m.index + Math.max(1, m[0].length) }); }
        }
    }
    return { hits, total, regex };
}
