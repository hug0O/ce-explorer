/**
 * Places the nodes of the Blueprint view: columns by call depth (callers on the left, what they call on the right), rows ordered to
 * keep the wires short, and the size of a node from its pins. Pure.
 */
export interface LayoutNode { id: string; title: string; subtitle?: string; inputs: number; outputs: number }
export interface LayoutEdge { from: string; to: string }
export interface Box { x: number; y: number; w: number; h: number }

export const HEADER = 34;
export const ROW = 20;
const CHAR = 7;
const GAP_X = 130;
const GAP_Y = 28;

/** Size of a node: a header, then one row per pin on the busier side. */
export function nodeSize(n: LayoutNode): { w: number; h: number } {
    const rows = Math.max(1, n.inputs, n.outputs);
    const w = Math.max(170, Math.min(340, Math.max(n.title.length + 6, (n.subtitle ?? '').length + 4) * CHAR + 30));
    return { w, h: HEADER + rows * ROW + 12 };
}

/** The depth of each node: the longest chain of callers above it, ignoring the edge that closes a cycle. */
export function depths(nodes: LayoutNode[], edges: LayoutEdge[]): Map<string, number> {
    const out = new Map<string, string[]>();
    for (const n of nodes) { out.set(n.id, []); }
    for (const e of edges) { if (out.has(e.from) && out.has(e.to)) { out.get(e.from)!.push(e.to); } }
    const state = new Map<string, 0 | 1 | 2>();
    const back = new Set<string>();
    const visit = (id: string): void => {
        state.set(id, 1);
        for (const t of out.get(id) ?? []) {
            if (state.get(t) === 1) { back.add(id + '>' + t); } else if (!state.has(t)) { visit(t); }
        }
        state.set(id, 2);
    };
    const hasCaller = new Set(edges.filter(e => e.from !== e.to).map(e => e.to));
    for (const n of nodes) { if (!hasCaller.has(n.id) && !state.has(n.id)) { visit(n.id); } }
    for (const n of nodes) { if (!state.has(n.id)) { visit(n.id); } }
    const depth = new Map<string, number>(nodes.map(n => [n.id, 0]));
    // relax along the edges that are not back edges; the graph is acyclic now, so |nodes| passes are enough
    for (let pass = 0; pass < nodes.length; pass++) {
        let changed = false;
        for (const e of edges) {
            if (!out.has(e.from) || !out.has(e.to) || back.has(e.from + '>' + e.to) || e.from === e.to) { continue; }
            const d = (depth.get(e.from) ?? 0) + 1;
            if (d > (depth.get(e.to) ?? 0)) { depth.set(e.to, d); changed = true; }
        }
        if (!changed) { break; }
    }
    return depth;
}

/**
 * A box for every node, column after column. The rows of each column are ordered by sweeping back and forth over the columns, each node
 * going near the mean row of its neighbours in the column before (then after), which keeps the wires short and crossings few; the columns
 * are centred on each other. A node with no wire at all goes to a column of its own on the far left.
 */
export function layout(nodes: LayoutNode[], edges: LayoutEdge[]): Map<string, Box> {
    const depth = depths(nodes, edges);
    const linked = new Set<string>();
    for (const e of edges) { if (e.from !== e.to) { linked.add(e.from); linked.add(e.to); } }
    const fileOrder = new Map<string, number>(nodes.map((n, i) => [n.id, i]));
    const cols = new Map<number, LayoutNode[]>();
    const alone: LayoutNode[] = [];
    for (const n of nodes) {
        if (!linked.has(n.id)) { alone.push(n); continue; }
        const d = depth.get(n.id) ?? 0;
        cols.set(d, [...(cols.get(d) ?? []), n]);
    }
    const keys = [...cols.keys()].sort((a, b) => a - b);
    const callers = new Map<string, string[]>();
    const callees = new Map<string, string[]>();
    for (const n of nodes) { callers.set(n.id, []); callees.set(n.id, []); }
    for (const e of edges) { if (e.from !== e.to && callers.has(e.to) && callees.has(e.from)) { callers.get(e.to)!.push(e.from); callees.get(e.from)!.push(e.to); } }
    const slot = new Map<string, number>();
    const reslot = (): void => { for (const k of keys) { cols.get(k)!.forEach((n, i, l) => slot.set(n.id, (i + 0.5) / l.length)); } };
    for (const k of keys) { cols.get(k)!.sort((a, b) => fileOrder.get(a.id)! - fileOrder.get(b.id)!); }
    reslot();
    const sortBy = (list: LayoutNode[], nb: Map<string, string[]>): void => {
        const key = (n: LayoutNode): number => {
            const v = nb.get(n.id)!.filter(id => slot.has(id)).map(id => slot.get(id)!);
            return v.length ? v.reduce((a, b) => a + b, 0) / v.length : slot.get(n.id)!;
        };
        const keyed = list.map(n => ({ n, k: key(n) }));
        keyed.sort((a, b) => a.k - b.k || fileOrder.get(a.n.id)! - fileOrder.get(b.n.id)!);
        keyed.forEach((x, i) => { list[i] = x.n; });
    };
    for (let pass = 0; pass < 4; pass++) {
        for (const k of keys) { sortBy(cols.get(k)!, callers); reslot(); }
        for (const k of [...keys].reverse()) { sortBy(cols.get(k)!, callees); reslot(); }
    }
    const result = new Map<string, Box>();
    const all = [...(alone.length ? [alone] : []), ...keys.map(k => cols.get(k)!)];
    const heights = all.map(list => list.reduce((a, n) => a + nodeSize(n).h + GAP_Y, -GAP_Y));
    const tallest = Math.max(0, ...heights);
    let x = 0;
    all.forEach((list, ci) => {
        let y = (tallest - heights[ci]) / 2;
        let w = 0;
        for (const n of list) {
            const sz = nodeSize(n);
            result.set(n.id, { x, y, w: sz.w, h: sz.h });
            y += sz.h + GAP_Y;
            w = Math.max(w, sz.w);
        }
        x += w + GAP_X;
    });
    return result;
}
