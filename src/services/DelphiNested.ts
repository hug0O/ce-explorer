/**
 * Components that live INSIDE another one and are placed by it, not by Left / Top: the tiles, groups
 * and detail pages of a DevExpress tile control, the levels, views and columns of a DevExpress grid.
 * One table says where each kind may go, for the designer's palette, the Add Component command and the
 * move / reparent guards alike.
 */
import type { DfmNode } from './DelphiLayout';
import { isGridChild, isGridColumn, isGridHost, isGridLevel, isGridView, shownView } from './DelphiGrid';
import { isTileChild, isTileHost } from './DelphiTiles';
import { isDataset, isDatasetField, isKnownField } from './DelphiData';
import { isMenuHost, isMenuItem } from './DelphiMenus';
import { isChart, isChartChild } from './DelphiCharts';
import { isBarChild, isBarManager, isBarPart, isStyle, isStyleRepository } from './DelphiBars';

export interface NestedRule {
    id: 'tile' | 'grid' | 'view' | 'dataset' | 'bars' | 'styles' | 'menu' | 'chart';
    applies: (cls: string) => boolean;
    host: (n: DfmNode) => boolean;
    /** "goes inside …", for messages. */
    what: string;
}

const isDetailSite = (cls: string): boolean => /TileControlDetailSite$/i.test(cls);

export const NESTED_RULES: NestedRule[] = [
    { id: 'tile', applies: c => isTileChild(c) || isDetailSite(c), host: n => isTileHost(n.className), what: 'a TdxTileControl' },
    { id: 'grid', applies: c => isGridLevel(c) || isGridView(c), host: n => isGridHost(n.className), what: 'a TcxGrid' },
    { id: 'view', applies: c => isGridColumn(c), host: n => isGridView(n.className), what: 'a grid view' },
    { id: 'dataset', applies: c => isKnownField(c), host: n => isDataset(n.className), what: 'a dataset' },
    { id: 'bars', applies: c => isBarPart(c), host: n => isBarManager(n.className), what: 'a TdxBarManager' },
    { id: 'styles', applies: c => isStyle(c), host: n => isStyleRepository(n.className), what: 'a TcxStyleRepository' },
    { id: 'chart', applies: c => isChartChild(c), host: n => isChart(n.className), what: 'a TChart or TDBChart' },
    { id: 'menu', applies: c => isMenuItem(c), host: n => isMenuHost(n.className) || isMenuItem(n.className), what: 'a menu (TPopupMenu, TMainMenu) or a menu item' },
];

export const nestedRuleOf = (cls: string): NestedRule | undefined => NESTED_RULES.find(r => r.applies(cls));

/** Parts the form never moves out of their parent (a detail site is an ordinary container, so it is not one). */
export const isNestedChild = (cls: string): boolean => isTileChild(cls) || isGridChild(cls) || isBarChild(cls) || isMenuItem(cls) || isChartChild(cls);

/** Same, for a node of the .dfm: a persistent field is a part only inside a dataset (a custom control named …Field is not). */
export const isNestedNode = (n: DfmNode): boolean => isNestedChild(n.className) || (isDatasetField(n.className) && !!n.parent && isDataset(n.parent.className));

/** What a host holds, for the message when something else is dropped on it. */
export function onlyHolds(host: DfmNode): string | undefined {
    if (isTileHost(host.className)) { return 'A TdxTileControl only holds tiles, groups and detail pages'; }
    if (isGridHost(host.className)) { return 'A TcxGrid only holds levels, views and columns'; }
    if (isGridView(host.className)) { return 'A grid view only holds its columns'; }
    if (isDataset(host.className)) { return 'A dataset only holds its fields'; }
    if (isBarManager(host.className)) { return 'A TdxBarManager only holds bars and their items'; }
    if (isStyleRepository(host.className)) { return 'A TcxStyleRepository only holds styles'; }
    if (isChart(host.className)) { return 'A chart only holds series and tools'; }
    if (isMenuHost(host.className)) { return 'A menu only holds menu items'; }
    if (isMenuItem(host.className)) { return 'A menu item only holds menu items'; }
    return undefined;
}

/** The host a nested component goes into: the parent, or one of its ancestors; a column dropped on a grid goes to the view it shows. */
export function findHost(rule: NestedRule, from: DfmNode | undefined): DfmNode | undefined {
    let n = from;
    for (let i = 0; n && i < 4; i++, n = n.parent) { if (rule.host(n)) { return n; } }
    if (rule.id === 'view' && from && isGridHost(from.className)) { return shownView(from) ?? from.children.find(c => isGridView(c.className)); }
    return undefined;
}
