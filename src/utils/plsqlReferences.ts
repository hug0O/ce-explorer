/**
 * Finds every place a PL/SQL name is written in a text: code, strings and comments alike,
 * so that a name in a message or a `-- see proc` note is found too. Pure: no VS Code API.
 */

export interface NameHit {
    line: number;
    col: number;
    /** The qualifier written before the name (`pkg` in `pkg.proc`), '' when there is none. */
    qualifier: string;
}

const IDENT = /[A-Za-z_][\w$#]*/;

/** A name is found as a whole identifier, not inside a longer one (`total` is not in `total_amount`). */
function wordRegex(name: string): RegExp {
    const esc = name.replace(/[.*+?^${}()|[\]\\$#]/g, '\\$&');
    return new RegExp('(?<![\\w$#])' + esc + '(?![\\w$#])', 'gi');
}

/**
 * Hits of `name` in `text`. Quick rejection first: a text that does not contain the name
 * at all (case-insensitive) is skipped without running the regular expression.
 * `qualifier`, when given, keeps only the hits written as `qualifier.name`.
 */
export function findNameHits(text: string, name: string, qualifier?: string): NameHit[] {
    if (!name || !IDENT.test(name)) { return []; }
    if (text.toLowerCase().indexOf(name.toLowerCase()) < 0) { return []; }
    const re = wordRegex(name);
    const hits: NameHit[] = [];
    let line = 0;
    let lineStart = 0;
    let lastIndex = 0;
    for (let m = re.exec(text); m; m = re.exec(text)) {
        // advance the line counter up to the match: lines are counted once, in order
        for (let i = lastIndex; i < m.index; i++) {
            if (text.charCodeAt(i) === 10) { line++; lineStart = i + 1; }
        }
        lastIndex = m.index;
        const before = text.slice(lineStart, m.index);
        const q = /([A-Za-z_][\w$#]*)\.$/.exec(before);
        const qual = q ? q[1] : '';
        if (qualifier && qual.toLowerCase() !== qualifier.toLowerCase()) { continue; }
        hits.push({ line, col: m.index - lineStart, qualifier: qual });
    }
    return hits;
}
