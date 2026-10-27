/**
 * Moving between the members of a file with the keyboard: the next / previous member, and from a declaration to its implementation and
 * back (the `interface` ⇄ `implementation` jump of Delphi, the same for any language whose members have both). Pure: lines and ranges in,
 * a line out; the commands that use it are in NavCommands.
 */

export interface PosLike { line: number; character: number }
export interface RangeLike { start: PosLike; end: PosLike }
export interface MemberRanges { name: string; range: RangeLike; implementationRange?: RangeLike }

/** The lines where members start, once each, in order. */
export function memberLines(positions: PosLike[]): number[] {
    return [...new Set(positions.map(p => p.line))].sort((a, b) => a - b);
}

/** The line `steps` members after (dir 1) or before (dir -1) `current`; stays on the first or the last one when there is no more. Undefined when the file has none. */
export function stepMember(lines: number[], current: number, dir: 1 | -1, steps = 1): number | undefined {
    if (!lines.length) { return undefined; }
    let line = current;
    for (let i = 0; i < Math.max(1, steps); i++) {
        const next = dir > 0 ? lines.find(l => l > line) : [...lines].reverse().find(l => l < line);
        if (next === undefined) { break; }
        line = next;
    }
    return line;
}

const within = (r: RangeLike, line: number): boolean => line >= r.start.line && line <= r.end.line;

/**
 * Where the declaration of the member under the line leads to (its implementation), or the implementation back to its declaration.
 * `kind` says which way it went, for the message.
 */
export function declImplTarget(members: MemberRanges[], line: number): { position: PosLike; kind: 'implementation' | 'declaration'; name: string } | undefined {
    // the innermost member that holds the line: the one whose range is the shortest
    const holders = members.filter(m => within(m.range, line) || (m.implementationRange && within(m.implementationRange, line)));
    holders.sort((a, b) => spanOf(a, line) - spanOf(b, line));
    const m = holders[0];
    if (!m || !m.implementationRange) { return undefined; }
    if (within(m.implementationRange, line)) { return { position: m.range.start, kind: 'declaration', name: m.name }; }
    return { position: m.implementationRange.start, kind: 'implementation', name: m.name };
}

function spanOf(m: MemberRanges, line: number): number {
    const r = m.implementationRange && within(m.implementationRange, line) ? m.implementationRange : m.range;
    return r.end.line - r.start.line;
}
