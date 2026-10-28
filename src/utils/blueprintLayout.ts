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
const GAP_X = 90;
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

/** A box for every node, column after column; a node with no wire at all goes to a column of its own on the far left. */
export function layout(nodes: LayoutNode[], edges: LayoutEdge[]): Map<string, Box> {
    const depth = depths(nodes, edges);
    const linked = new Set<string>();
    for (const e of edges) { linked.add(e.from); linked.add(e.to); }
    const cols = new Map<number, LayoutNode[]>();
    const alone: LayoutNode[] = [];
    for (const n of nodes) {
        if (!linked.has(n.id)) { alone.push(n); continue; }
        const d = depth.get(n.id) ?? 0;
        cols.set(d, [...(cols.get(d) ?? []), n]);
    }
    const order = new Map<string, number>(nodes.map((n, i) => [n.id, i]));
    const row = new Map<string, number>();
    const result = new Map<string, Box>();
    let x = 0;
    const place = (list: LayoutNode[]): void => {
        let y = 0;
        let w = 0;
        for (const n of list) {
            const s = nodeSize(n);
            result.set(n.id, { x, y, w: s.w, h: s.h });
            row.set(n.id, y + s.h / 2);
            y += s.h + GAP_Y;
            w = Math.max(w, s.w);
        }
        x += w + GAP_X;
    };
    if (alone.length) { place(alone.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))); }
    const depthsSorted = [...cols.keys()].sort((a, b) => a - b);
    for (const d of depthsSorted) {
        const list = cols.get(d)!;
        // keep the wires short: sort by the mean row of the callers already placed, else by order in the file
        const mean = (n: LayoutNode): number => {
            const from = edges.filter(e => e.to === n.id && row.has(e.from)).map(e => row.get(e.from)!);
            return from.length ? from.reduce((a, b) => a + b, 0) / from.length : Number.POSITIVE_INFINITY;
        };
        list.sort((a, b) => (mean(a) - mean(b)) || ((order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)));
        place(list);
    }
    return result;
}
