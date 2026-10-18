/**
 * Layout operations on existing components, like the Delphi IDE's Align /
 * Size / Anchors tools, and TabOrder by screen position.
 */
import type { TextEdit } from './DelphiForm';
import type { DfmNode } from './DelphiLayout';
import { deleteProp, formatAnchors, parseAnchors, setProp } from '../utils/dfmEdit';
import { setPropEdit } from './DelphiSpacing';

export type AlignOp = 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY' | 'sameWidth' | 'sameHeight' | 'sameSize' | 'spaceH' | 'spaceV';

export const ALIGN_OPS: { id: AlignOp; label: string; description: string }[] = [
    { id: 'left', label: 'Align left edges', description: 'to the left-most' },
    { id: 'right', label: 'Align right edges', description: 'to the right-most' },
    { id: 'top', label: 'Align top edges', description: 'to the highest' },
    { id: 'bottom', label: 'Align bottom edges', description: 'to the lowest' },
    { id: 'centerX', label: 'Center on a vertical line', description: 'same horizontal centre' },
    { id: 'centerY', label: 'Center on a horizontal line', description: 'same vertical centre' },
    { id: 'sameWidth', label: 'Same width', description: 'as the widest' },
    { id: 'sameHeight', label: 'Same height', description: 'as the tallest' },
    { id: 'sameSize', label: 'Same width and height', description: 'as the largest' },
    { id: 'spaceH', label: 'Space equally horizontally', description: 'first and last stay in place' },
    { id: 'spaceV', label: 'Space equally vertically', description: 'first and last stay in place' },
];

export type LayoutResult = { error: string } | { edits: TextEdit[]; changed: string[] };

const free = (n: DfmNode): boolean => n.align === undefined && n.left !== undefined && n.top !== undefined;

function checkSelection(dfm: string, nodes: DfmNode[], min: number): string | undefined {
    void dfm;
    if (nodes.length < min) { return `Select at least ${min} components.`; }
    const parent = nodes[0].parent;
    if (nodes.some(n => n.parent !== parent)) { return 'The components must belong to the same container.'; }
    const docked = nodes.find(n => !free(n));
    if (docked) { return `${docked.name} is docked (Align) or has no position.`; }
    return undefined;
}

export function alignComponents(dfm: string, nodes: DfmNode[], op: AlignOp): LayoutResult {
    const needsSize = op !== 'left' && op !== 'top';
    const err = checkSelection(dfm, nodes, op === 'spaceH' || op === 'spaceV' ? 3 : 2);
    if (err) { return { error: err }; }
    if (needsSize && nodes.some(n => n.width === undefined || n.height === undefined)) {
        return { error: 'Some components have no Width / Height in the .dfm (non-visual or default size).' };
    }
    const w = (n: DfmNode) => n.width ?? 0;
    const h = (n: DfmNode) => n.height ?? 0;
    const target = new Map<DfmNode, { left?: number; top?: number; width?: number; height?: number }>();
    const set = (n: DfmNode, v: { left?: number; top?: number; width?: number; height?: number }) => target.set(n, { ...(target.get(n) ?? {}), ...v });

    switch (op) {
        case 'left': { const x = Math.min(...nodes.map(n => n.left!)); nodes.forEach(n => set(n, { left: x })); break; }
        case 'right': { const r = Math.max(...nodes.map(n => n.left! + w(n))); nodes.forEach(n => set(n, { left: r - w(n) })); break; }
        case 'top': { const y = Math.min(...nodes.map(n => n.top!)); nodes.forEach(n => set(n, { top: y })); break; }
        case 'bottom': { const b = Math.max(...nodes.map(n => n.top! + h(n))); nodes.forEach(n => set(n, { top: b - h(n) })); break; }
        case 'centerX': {
            const c = (Math.min(...nodes.map(n => n.left!)) + Math.max(...nodes.map(n => n.left! + w(n)))) / 2;
            nodes.forEach(n => set(n, { left: Math.round(c - w(n) / 2) }));
            break;
        }
        case 'centerY': {
            const c = (Math.min(...nodes.map(n => n.top!)) + Math.max(...nodes.map(n => n.top! + h(n)))) / 2;
            nodes.forEach(n => set(n, { top: Math.round(c - h(n) / 2) }));
            break;
        }
        case 'sameWidth': { const m = Math.max(...nodes.map(w)); nodes.forEach(n => set(n, { width: m })); break; }
        case 'sameHeight': { const m = Math.max(...nodes.map(h)); nodes.forEach(n => set(n, { height: m })); break; }
        case 'sameSize': {
            const mw = Math.max(...nodes.map(w));
            const mh = Math.max(...nodes.map(h));
            nodes.forEach(n => set(n, { width: mw, height: mh }));
            break;
        }
        case 'spaceH': case 'spaceV': {
            const horizontal = op === 'spaceH';
            const pos = (n: DfmNode) => (horizontal ? n.left! : n.top!);
            const size = (n: DfmNode) => (horizontal ? w(n) : h(n));
            const sorted = [...nodes].sort((a, b) => pos(a) - pos(b));
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const total = pos(last) + size(last) - pos(first);
            const gap = (total - sorted.reduce((s, n) => s + size(n), 0)) / (sorted.length - 1);
            if (gap < 0) { return { error: 'The components overlap: there is no room to space them equally.' }; }
            let cursor = pos(first);
            sorted.forEach((n, i) => {
                if (i > 0 && i < sorted.length - 1) { set(n, horizontal ? { left: Math.round(cursor) } : { top: Math.round(cursor) }); }
                cursor += size(n) + gap;
            });
            break;
        }
    }

    const edits: TextEdit[] = [];
    const changed: string[] = [];
    for (const [n, v] of target) {
        let touched = false;
        const apply = (prop: string, from: number | undefined, to: number | undefined): void => {
            if (to === undefined || from === to) { return; }
            const e = setPropEdit(dfm, n, prop, to);
            if (e) { edits.push(e); touched = true; }
        };
        apply('Left', n.left, v.left);
        apply('Top', n.top, v.top);
        apply('Width', n.width, v.width);
        apply('Height', n.height, v.height);
        if (touched) { changed.push(n.name); }
    }
    return { edits, changed };
}

export type AnchorMode = 'default' | 'right' | 'bottom' | 'rightBottom' | 'stretchH' | 'stretchAll' | 'fromPosition'
    | 'alClient' | 'alTop' | 'alBottom' | 'alLeft' | 'alRight' | 'alNone';

export const ANCHOR_MODES: { id: AnchorMode; label: string; description: string }[] = [
    { id: 'fromPosition', label: 'Anchors from current position', description: 'near the right / bottom edge → anchored there; spanning → stretched' },
    { id: 'right', label: 'Anchor top-right', description: '[akTop, akRight]: follows the right edge' },
    { id: 'bottom', label: 'Anchor bottom-left', description: '[akLeft, akBottom]' },
    { id: 'rightBottom', label: 'Anchor bottom-right', description: '[akRight, akBottom]' },
    { id: 'stretchH', label: 'Stretch horizontally', description: '[akLeft, akTop, akRight]' },
    { id: 'stretchAll', label: 'Stretch in both directions', description: '[akLeft, akTop, akRight, akBottom]' },
    { id: 'default', label: 'Default anchors', description: 'removes the Anchors line ([akLeft, akTop])' },
    { id: 'alClient', label: 'Dock: fill the container', description: 'Align = alClient' },
    { id: 'alTop', label: 'Dock: top', description: 'Align = alTop' },
    { id: 'alBottom', label: 'Dock: bottom', description: 'Align = alBottom' },
    { id: 'alLeft', label: 'Dock: left', description: 'Align = alLeft' },
    { id: 'alRight', label: 'Dock: right', description: 'Align = alRight' },
    { id: 'alNone', label: 'Undock', description: 'removes Align' },
];

/** Size of the area available to the children of `container`. */
export function clientSize(container: DfmNode): { w: number; h: number } | undefined {
    const num = (v: string | undefined) => (v !== undefined && /^\d+$/.test(v) ? Number(v) : undefined);
    const w = num(container.props['ClientWidth']) ?? container.width;
    const h = num(container.props['ClientHeight']) ?? container.height;
    return w !== undefined && h !== undefined ? { w, h } : undefined;
}

const NEAR = 24;
const NEAR_EDGE = 48;

/** Anchors a control would need to keep its distance to the edge it sits next to. */
export function anchorsFromPosition(n: DfmNode, size: { w: number; h: number }): Set<string> {
    const set = new Set<string>();
    const left = n.left ?? 0;
    const top = n.top ?? 0;
    const right = size.w - (left + (n.width ?? 0));
    const bottom = size.h - (top + (n.height ?? 0));
    // A control that spans (almost) the whole container stretches with it; one that merely
    // sits near an edge keeps its distance to that edge.
    const wide = (n.width ?? 0) >= size.w * 0.75;
    const tall = (n.height ?? 0) >= size.h * 0.75;
    if (wide && left <= NEAR && right <= NEAR) { set.add('akLeft'); set.add('akRight'); }
    else if (right + 4 < left && right <= NEAR_EDGE) { set.add('akRight'); }
    else { set.add('akLeft'); }
    if (tall && top <= NEAR && bottom <= NEAR) { set.add('akTop'); set.add('akBottom'); }
    else if (bottom + 4 < top && bottom <= NEAR_EDGE) { set.add('akBottom'); }
    else { set.add('akTop'); }
    return set;
}

export function applyAnchorMode(dfm: string, container: DfmNode, nodes: DfmNode[], mode: AnchorMode): LayoutResult {
    if (nodes.length === 0) { return { error: 'Select at least one component.' }; }
    const edits: TextEdit[] = [];
    const changed: string[] = [];
    const size = mode === 'fromPosition' ? clientSize(container) : undefined;
    if (mode === 'fromPosition' && !size) { return { error: `${container.name} has no ClientWidth / ClientHeight (or Width / Height) in the .dfm.` }; }

    for (const n of nodes) {
        const before = edits.length;
        if (mode.startsWith('al')) {
            if (mode === 'alNone') { const e = deleteProp(dfm, n, 'Align'); if (e) { edits.push(e); } }
            else if (n.props['Align'] !== mode) { edits.push(setProp(dfm, n, 'Align', mode)); }
        } else {
            let anchors: Set<string>;
            if (mode === 'fromPosition') {
                if (!free(n)) { continue; }
                anchors = anchorsFromPosition(n, size!);
            } else {
                anchors = new Set(({
                    default: ['akLeft', 'akTop'], right: ['akTop', 'akRight'], bottom: ['akLeft', 'akBottom'], rightBottom: ['akRight', 'akBottom'],
                    stretchH: ['akLeft', 'akTop', 'akRight'], stretchAll: ['akLeft', 'akTop', 'akRight', 'akBottom'],
                } as Record<string, string[]>)[mode]);
            }
            const isDefault = anchors.size === 2 && anchors.has('akLeft') && anchors.has('akTop');
            const current = formatAnchors(parseAnchors(n.props['Anchors']));
            if (isDefault) {
                const e = deleteProp(dfm, n, 'Anchors');
                if (e) { edits.push(e); }
            } else if (current !== formatAnchors(anchors) || n.props['Anchors'] === undefined) {
                edits.push(setProp(dfm, n, 'Anchors', formatAnchors(anchors)));
            }
        }
        if (edits.length > before) { changed.push(n.name); }
    }
    return { edits, changed };
}

/** TabOrder = reading order on screen (rows top to bottom, then left to right), per container. */
export function planTabOrder(dfm: string, containers: DfmNode[]): LayoutResult {
    const edits: TextEdit[] = [];
    const changed: string[] = [];
    for (const c of containers) {
        const stops = c.children.filter(n => n.props['TabOrder'] !== undefined);
        if (stops.length < 2) { continue; }
        const sorted = [...stops].sort((a, b) => (a.top ?? 0) - (b.top ?? 0) || (a.left ?? 0) - (b.left ?? 0));
        // Rows: a control whose top lies inside the vertical span of the current row joins it.
        const rows: DfmNode[][] = [];
        let bottom = -Infinity;
        for (const n of sorted) {
            if (rows.length && (n.top ?? 0) < bottom - Math.min(4, (n.height ?? 0) / 2)) {
                rows[rows.length - 1].push(n);
                bottom = Math.max(bottom, (n.top ?? 0) + (n.height ?? 0));
            } else {
                rows.push([n]);
                bottom = (n.top ?? 0) + (n.height ?? 0);
            }
        }
        const ordered = rows.flatMap(r => r.sort((a, b) => (a.left ?? 0) - (b.left ?? 0)));
        ordered.forEach((n, i) => {
            if (n.props['TabOrder'] !== String(i)) {
                const e = setPropEdit(dfm, n, 'TabOrder', i);
                if (e) { edits.push(e); changed.push(n.name); }
            }
        });
    }
    return { edits, changed };
}
