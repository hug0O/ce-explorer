/**
 * Spacing tools for the components already on a form: set the gap between a
 * component and its neighbour on any of the four sides (moving the neighbour,
 * and optionally everything beyond it), or distribute a whole container with
 * fixed horizontal / vertical gaps. Works on DFM text via offset edits.
 */
import { TextEdit } from './DelphiForm';
import { DfmNode } from './DelphiLayout';

export type Direction = 'right' | 'left' | 'below' | 'above';

export type SpacingResult =
    | { error: string }
    | { edits: TextEdit[]; moved: string[]; delta: number };

type Prop = 'left' | 'top' | 'width' | 'height';

function isFree(n: DfmNode): boolean {
    return n.align === undefined && n.left !== undefined && n.top !== undefined && n.propLines['Left'] !== undefined && n.propLines['Top'] !== undefined;
}

function lineSpan(dfm: string, line: number): { start: number; end: number } {
    let start = 0;
    for (let l = 0; l < line; l++) {
        const next = dfm.indexOf('\n', start);
        if (next < 0) { return { start: dfm.length, end: dfm.length }; }
        start = next + 1;
    }
    let end = dfm.indexOf('\n', start);
    if (end < 0) { end = dfm.length; }
    if (end > start && dfm[end - 1] === '\r') { end--; }
    return { start, end };
}

/** Edit rewriting the value of an existing `Prop = value` line of `node`. */
export function setPropEdit(dfm: string, node: DfmNode, prop: string, value: number): TextEdit | undefined {
    const line = node.propLines[prop];
    if (line === undefined) { return undefined; }
    const { start, end } = lineSpan(dfm, line);
    const m = dfm.slice(start, end).match(/^(\s*[\w.]+\s*=\s*)(.*)$/);
    if (!m) { return undefined; }
    return { offset: start + m[1].length, length: m[2].length, text: String(value) };
}

const AXES = {
    horizontal: { pos: 'left' as Prop, size: 'width' as Prop, cross: 'top' as Prop, crossSize: 'height' as Prop, propName: 'Left' },
    vertical: { pos: 'top' as Prop, size: 'height' as Prop, cross: 'left' as Prop, crossSize: 'width' as Prop, propName: 'Top' },
};

const val = (n: DfmNode, p: Prop): number => n[p] ?? 0;
const TOLERANCE = 4;

/**
 * Sets the edge-to-edge gap between `a` and its nearest neighbour in `dir`
 * (the neighbour must overlap `a` on the other axis). With `cascade`, every
 * component chained beyond that neighbour moves with it, so the rest of the
 * layout keeps its own spacing.
 */
export function setGapBetween(dfm: string, a: DfmNode, dir: Direction, gap: number, cascade = true): SpacingResult {
    if (!a.parent) { return { error: 'The form itself has no neighbours.' }; }
    if (!isFree(a)) { return { error: `${a.name} is docked (Align) or has no position, so it cannot be spaced.` }; }
    if (!Number.isFinite(gap) || gap < -50 || gap > 1000) { return { error: 'The gap must be a number of pixels.' }; }
    const ax = dir === 'right' || dir === 'left' ? AXES.horizontal : AXES.vertical;
    const forward = dir === 'right' || dir === 'below';
    const siblings = a.parent.children.filter(n => n !== a && isFree(n));

    const crossOverlap = (m: DfmNode, s: DfmNode): boolean =>
        val(s, ax.cross) < val(m, ax.cross) + val(m, ax.crossSize) && val(s, ax.cross) + val(s, ax.crossSize) > val(m, ax.cross);
    const after = (m: DfmNode, s: DfmNode): boolean => forward
        ? val(s, ax.pos) >= val(m, ax.pos) + val(m, ax.size) - TOLERANCE
        : val(s, ax.pos) + val(s, ax.size) <= val(m, ax.pos) + TOLERANCE;

    const near = siblings.filter(s => after(a, s) && crossOverlap(a, s));
    if (near.length === 0) { return { error: `No component ${dir === 'below' || dir === 'above' ? dir : dir + ' of'} ${a.name} to space.` }; }
    const first = near.reduce((best, s) => forward
        ? (val(s, ax.pos) < val(best, ax.pos) ? s : best)
        : (val(s, ax.pos) + val(s, ax.size) > val(best, ax.pos) + val(best, ax.size) ? s : best));

    const delta = forward
        ? val(a, ax.pos) + val(a, ax.size) + gap - val(first, ax.pos)
        : val(a, ax.pos) - gap - (val(first, ax.pos) + val(first, ax.size));

    // The neighbour moves together with the controls lined up with it (same row
    // for above / below, same column for right / left), so rows and columns keep their shape.
    const lane = (s: DfmNode): boolean =>
        val(s, ax.pos) < val(first, ax.pos) + val(first, ax.size) && val(s, ax.pos) + val(s, ax.size) > val(first, ax.pos);
    const moved: DfmNode[] = [first, ...siblings.filter(s => s !== first && after(a, s) && lane(s))];
    if (cascade) {
        for (let grew = true; grew;) {
            grew = false;
            for (const s of siblings) {
                if (moved.includes(s)) { continue; }
                if (moved.some(m => after(m, s) && crossOverlap(m, s))) { moved.push(s); grew = true; }
            }
        }
    }
    if (moved.some(n => val(n, ax.pos) + delta < 0)) { return { error: 'This spacing would push a component outside its container (negative position).' }; }
    if (delta === 0) { return { edits: [], moved: [], delta: 0 }; }
    const edits: TextEdit[] = [];
    for (const n of moved) {
        const e = setPropEdit(dfm, n, ax.propName, val(n, ax.pos) + delta);
        if (e) { edits.push(e); }
    }
    return { edits, moved: moved.map(n => n.name), delta };
}

/**
 * Re-lays out the free children of `container` on a fixed grid of gaps:
 * `hGap` between neighbours of a row, `vGap` between rows. Rows are detected
 * by vertical overlap. When every row has the same number of controls the
 * columns are aligned across rows (labels over labels, edits over edits).
 * The first control keeps its position; docked children are left alone.
 */
export function distributeContainer(dfm: string, container: DfmNode, hGap: number, vGap: number, alignColumns = true): SpacingResult {
    if (![hGap, vGap].every(g => Number.isFinite(g) && g >= -50 && g <= 1000)) { return { error: 'The gaps must be numbers of pixels.' }; }
    const free = container.children.filter(isFree);
    if (free.length < 2) { return { error: `${container.name} needs at least two positioned components to distribute.` }; }

    const sorted = [...free].sort((x, y) => val(x, 'top') - val(y, 'top') || val(x, 'left') - val(y, 'left'));
    interface Row { nodes: DfmNode[]; top: number; bottom: number }
    const rows: Row[] = [];
    for (const n of sorted) {
        const row = rows[rows.length - 1];
        if (row && val(n, 'top') < row.bottom) {
            row.nodes.push(n);
            row.bottom = Math.max(row.bottom, val(n, 'top') + val(n, 'height'));
        } else {
            rows.push({ nodes: [n], top: val(n, 'top'), bottom: val(n, 'top') + val(n, 'height') });
        }
    }
    rows.forEach(r => r.nodes.sort((x, y) => val(x, 'left') - val(y, 'left')));

    const newTop = new Map<DfmNode, number>();
    const newLeft = new Map<DfmNode, number>();
    let y = rows[0].top;
    for (const r of rows) {
        for (const n of r.nodes) { newTop.set(n, y + (val(n, 'top') - r.top)); }
        y += (r.bottom - r.top) + vGap;
    }

    const x0 = Math.min(...free.map(n => val(n, 'left')));
    // Columns come from the rows holding several controls (they must all hold the same
    // number); a lone control in a row joins the column whose original position is the closest.
    const multi = rows.filter(r => r.nodes.length >= 2);
    const columns = multi.length > 0 ? multi[0].nodes.length : 0;
    if (alignColumns && columns > 1 && multi.every(r => r.nodes.length === columns)) {
        const members: DfmNode[][] = Array.from({ length: columns }, () => []);
        multi.forEach(r => r.nodes.forEach((n, c) => members[c].push(n)));
        const origin = members.map(m => m.reduce((sum, n) => sum + val(n, 'left'), 0) / m.length);
        // Column widths come from the multi-control rows only: a lone wide control (a memo, a grid)
        // spans the columns, it must not push them apart.
        const widths = members.map(m => Math.max(...m.map(n => val(n, 'width'))));
        const lone: { node: DfmNode; column: number }[] = [];
        for (const r of rows.filter(row => row.nodes.length === 1)) {
            const n = r.nodes[0];
            let best = 0;
            origin.forEach((o, c) => { if (Math.abs(o - val(n, 'left')) < Math.abs(origin[best] - val(n, 'left'))) { best = c; } });
            lone.push({ node: n, column: best });
        }
        const lefts: number[] = [];
        let x = x0;
        for (let c = 0; c < columns; c++) {
            lefts.push(x);
            members[c].forEach(n => newLeft.set(n, x));
            x += widths[c] + hGap;
        }
        lone.forEach(l => newLeft.set(l.node, lefts[l.column]));
    } else {
        for (const r of rows) {
            let x = val(r.nodes[0], 'left');
            for (const n of r.nodes) {
                newLeft.set(n, x);
                x += val(n, 'width') + hGap;
            }
        }
    }

    const edits: TextEdit[] = [];
    const moved: string[] = [];
    for (const n of free) {
        const l = newLeft.get(n)!;
        const t = newTop.get(n)!;
        if (l < 0 || t < 0) { return { error: 'This spacing would push a component outside its container (negative position).' }; }
        let changed = false;
        if (l !== val(n, 'left')) { const e = setPropEdit(dfm, n, 'Left', l); if (e) { edits.push(e); changed = true; } }
        if (t !== val(n, 'top')) { const e = setPropEdit(dfm, n, 'Top', t); if (e) { edits.push(e); changed = true; } }
        if (changed) { moved.push(n.name); }
    }
    return { edits, moved, delta: 0 };
}
