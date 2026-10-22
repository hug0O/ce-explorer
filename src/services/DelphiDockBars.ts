/**
 * What a DevExpress dock control (`TdxBarDockControl`) shows at run time: the bars of the bar manager whose `DockControl`
 * points to it, each with the items of its `ItemLinks` (buttons, static texts, sub-menus, combos, separators between groups).
 * The designer draws it as a strip with the captions, so a form with bars no longer shows an empty bar. Pure.
 */
import type { DfmNode } from './DelphiLayout';
import { isBarManager, isBarPart } from './DelphiBars';

export type BarItemKind = 'button' | 'static' | 'sub' | 'combo' | 'edit' | 'other';

export interface BarItem { name: string; cls: string; caption: string; kind: BarItemKind; beginGroup: boolean; width?: number; visible: boolean }
export interface DockedBar { name: string; caption: string; items: BarItem[] }

/** The records of a collection property (`ItemLinks = <item … end item … end>`): each item's `Key = Value` lines, values as written. */
export function collectionRecords(dfm: string, node: DfmNode, prop: string): Record<string, string>[] {
    const start = node.propLines[prop];
    if (start === undefined || /^<\s*>$/.test(node.props[prop] ?? '')) { return []; }
    const lines = dfm.split('\n');
    const out: Record<string, string>[] = [];
    let cur: Record<string, string> | undefined;
    let depth = 0;
    for (let i = start + 1; i < lines.length; i++) {
        const t = lines[i].trim().replace(/\r$/, '');
        if (t === 'item') { cur = {}; depth = 0; continue; }
        const close = /^end>?$/.test(t);
        if (close && depth > 0) { depth--; continue; }
        if (close) {
            if (cur) { out.push(cur); cur = undefined; }
            if (t.endsWith('>')) { break; }
            continue;
        }
        if (!cur) { continue; }
        // a nested structure of the item (a sub collection or object) is skipped, not read
        if (/=\s*(<|\()$/.test(t) || /^item$/.test(t)) { depth++; continue; }
        const m = /^([A-Za-z0-9_.]+) = (.*)$/.exec(t);
        if (m && depth === 0) { cur[m[1]] = m[2]; }
    }
    return out;
}

const kindOf = (cls: string): BarItemKind => {
    if (/Static$|Text$/i.test(cls)) { return 'static'; }
    if (/SubItem$|InPlaceSubItem$/i.test(cls)) { return 'sub'; }
    if (/Combo$/i.test(cls)) { return 'combo'; }
    if (/Edit$|SpinEdit$/i.test(cls)) { return 'edit'; }
    if (/Button$/i.test(cls)) { return 'button'; }
    return 'other';
};

const num = (v: string | undefined): number | undefined => (v !== undefined && /^-?\d+$/.test(v) ? Number(v) : undefined);
const isBar = (cls: string): boolean => /^TdxBar$/i.test(cls);

/** What the bars of every manager show: by dock control (the visible bars docked in it, in the order the manager docks them), and by bar (all its items, the hidden ones marked). */
export interface BarLayout { docks: Map<string, DockedBar[]>; bars: Map<string, DockedBar> }

export function dockedBars(dfm: string, root: DfmNode, decode: (raw: string) => string): BarLayout {
    const all = new Map<string, DockedBar>();
    const out = new Map<string, { bar: DockedBar; row: number; left: number }[]>();
    const managers: DfmNode[] = [];
    (function find(n: DfmNode): void { if (isBarManager(n.className)) { managers.push(n); } n.children.forEach(find); })(root);
    for (const mgr of managers) {
        const items = new Map<string, DfmNode>(mgr.children.filter(c => isBarPart(c.className) && !isBar(c.className)).map(c => [c.name, c]));
        for (const bar of mgr.children.filter(c => isBar(c.className))) {
            const dock = bar.props['DockControl'] ?? bar.props['DockedDockControl'];
            const shown: BarItem[] = [];
            for (const link of collectionRecords(dfm, bar, 'ItemLinks')) {
                const item = items.get((link['ItemName'] ?? '').replace(/^'|'$/g, ''));
                if (!item) { continue; }
                shown.push({
                    name: item.name, cls: item.className, kind: kindOf(item.className), beginGroup: link['BeginGroup'] === 'True', visible: link['Visible'] !== 'False' && item.props['Visible'] !== 'ivNever',
                    caption: item.props['Caption'] !== undefined ? decode(item.props['Caption']) : '',
                    width: num(item.props['Width']) ?? num(link['Width']),
                });
            }
            const built: DockedBar = { name: bar.name, caption: bar.props['Caption'] !== undefined ? decode(bar.props['Caption']) : bar.name, items: shown };
            all.set(bar.name, built);
            if (!dock || bar.props['Visible'] === 'False') { continue; }
            const list = out.get(dock) ?? [];
            list.push({ bar: built, row: num(bar.props['DockedTop']) ?? 0, left: num(bar.props['DockedLeft']) ?? 0 });
            out.set(dock, list);
        }
    }
    return { docks: new Map([...out].map(([k, v]) => [k, v.sort((a, b) => a.row - b.row || a.left - b.left).map(x => x.bar)])), bars: all };
}
