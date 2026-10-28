/**
 * The model the Blueprint view draws: a node per routine (its parameters are the data pins on the left, its return value the pin on
 * the right), a wire per call, and the position of each node (saved ones win over the automatic layout). Pure.
 */
import { CodeFamily, GraphRoutine, findCalls } from './callGraph';
import { LayoutEdge, LayoutNode, layout } from './blueprintLayout';

export interface BpParam { name: string; type: string; dir?: string }

export interface BpMember {
    name: string;
    kind: 'method' | 'constructor' | 'destructor' | 'function';
    owner?: string;
    params: BpParam[];
    returnType?: string;
    /** First line of the routine, where a click goes. */
    line: number;
    /** Lines searched for calls (header first), undefined for a bare declaration. */
    body?: { start: number; end: number };
}

export interface BpNode {
    id: string;
    name: string;
    owner?: string;
    kind: BpMember['kind'];
    params: BpParam[];
    ret?: string;
    line: number;
    hasBody: boolean;
    recursive: boolean;
    /** The events of the form this routine answers (`btnSave.OnClick`): it is an entry point, called by the form. */
    events?: string[];
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface BpEdge { from: string; to: string; lines: number[] }
export interface BpModel { nodes: BpNode[]; edges: BpEdge[] }

export type SavedPositions = Record<string, { x: number; y: number }>;

/** Stable key of a routine: its owner and name, and `#2`, `#3`… for an overload. */
export function nodeIds(members: BpMember[]): string[] {
    const seen = new Map<string, number>();
    return members.map(m => {
        const base = (m.owner ? m.owner + '.' : '') + m.name;
        const n = (seen.get(base) ?? 0) + 1;
        seen.set(base, n);
        return n === 1 ? base : base + '#' + n;
    });
}

export function buildBlueprint(members: BpMember[], lines: string[], family: CodeFamily, saved: SavedPositions = {}): BpModel {
    const ids = nodeIds(members);
    const routines: GraphRoutine[] = members.map((m, i) => ({ id: ids[i], name: m.name, owner: m.owner, body: m.body }));
    const { calls, recursive } = findCalls(routines, lines, family);
    const layoutNodes: LayoutNode[] = members.map((m, i) => ({
        id: ids[i], title: m.name, subtitle: m.owner,
        inputs: 1 + m.params.length, outputs: 1 + (m.returnType ? 1 : 0),
    }));
    const edges: LayoutEdge[] = calls.map(c => ({ from: c.from, to: c.to }));
    const boxes = layout(layoutNodes, edges);
    const nodes: BpNode[] = members.map((m, i) => {
        const b = boxes.get(ids[i])!;
        const p = saved[ids[i]];
        return {
            id: ids[i], name: m.name, owner: m.owner, kind: m.kind, params: m.params, ret: m.returnType, line: m.line,
            hasBody: !!m.body, recursive: recursive.has(ids[i]),
            x: p ? p.x : b.x, y: p ? p.y : b.y, w: b.w, h: b.h,
        };
    });
    return { nodes, edges: calls.map(c => ({ from: c.from, to: c.to, lines: c.lines })) };
}
