/**
 * The designer against another version of the form: which components were added, removed, moved, changed, with what, and
 * where the removed ones used to be (to draw them as ghosts). Built on the semantic diff of two .dfm; the page marks the
 * components it draws and adds the ghosts. Pure.
 */
import { DfmChange, DfmChangeKind, DfmDiff } from './DfmDiff';
import { DNode, DesignModel } from './DesignerModel';

export interface CompareItem {
    name: string;
    className: string;
    /** What happened to it: `added`, `removed`, `moved`, `class`, `prop`, `event`. */
    kinds: DfmChangeKind[];
    /** Only position and size changed. */
    layoutOnly: boolean;
    /** One line per change, for the tooltip. */
    details: string[];
}

export interface Ghost { name: string; cls: string; x: number; y: number; w: number; h: number }

const quote = (v: string | undefined, none: string): string => (v === undefined ? none : v.replace(/\s+/g, ' '));

const detailOf = (c: DfmChange): string => {
    switch (c.kind) {
        case 'added': return 'added' + (c.to ? ' in ' + c.to.split('/').pop() : '');
        case 'removed': return 'removed' + (c.from ? ' from ' + c.from.split('/').pop() : '');
        case 'moved': return `moved from ${(c.from ?? '').split('/').pop() || 'the form'} to ${(c.to ?? '').split('/').pop() || 'the form'}`;
        case 'class': return `class ${c.from} → ${c.to}`;
        case 'event': return `${c.prop}: ${quote(c.from, '(none)')} → ${quote(c.to, '(none)')}`;
        default: return `${c.prop}: ${quote(c.from, '(none)')} → ${quote(c.to, '(removed)')}`;
    }
};

/** One entry per component that changed, the ones that only came along with their parent (nested) left out. */
export function compareItems(diff: DfmDiff): CompareItem[] {
    const by = new Map<string, CompareItem>();
    for (const c of diff.changes) {
        if (c.nested) { continue; }
        const item = by.get(c.component) ?? { name: c.component, className: c.className, kinds: [], layoutOnly: true, details: [] };
        by.set(c.component, item);
        if (!item.kinds.includes(c.kind)) { item.kinds.push(c.kind); }
        if (c.kind !== 'prop' || !c.layout) { item.layoutOnly = false; }
        item.details.push(detailOf(c));
    }
    return [...by.values()];
}

/** Where a component sits on the form: its own place and the places of the containers it is in. */
export function absoluteRect(root: DNode, name: string): { x: number; y: number; w: number; h: number } | undefined {
    const walk = (n: DNode, ox: number, oy: number): { x: number; y: number; w: number; h: number } | undefined => {
        for (const c of n.children) {
            const x = ox + c.x, y = oy + c.y;
            if (c.name === name) { return { x, y, w: c.w, h: c.h }; }
            const hit = walk(c, x, y);
            if (hit) { return hit; }
        }
        return undefined;
    };
    return walk(root, 0, 0);
}

/** The components that are gone, at the place they had in the old version (the ones with a place of their own). */
export function ghostsOf(diff: DfmDiff, before: DesignModel): Ghost[] {
    const out: Ghost[] = [];
    const find = (n: DNode, name: string): DNode | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));
    for (const c of diff.changes) {
        if (c.kind !== 'removed' || c.nested) { continue; }
        const node = find(before.root, c.component);
        const r = node && !node.nonVisual && !node.structural ? absoluteRect(before.root, c.component) : undefined;
        if (node && r && r.w > 0 && r.h > 0) { out.push({ name: c.component, cls: c.className, ...r }); }
    }
    return out;
}
