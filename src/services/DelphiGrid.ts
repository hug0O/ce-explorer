/**
 * DevExpress grid (TcxGrid). Its levels, views and columns are named components
 * nested in the grid (or in a TcxGridViewRepository), with no Left / Top: they are
 * structure, not controls. The designer lists and edits them, and draws the columns
 * of the view the grid shows as a header strip. Pure; nothing here writes the .dfm.
 */
import type { DfmNode } from './DelphiLayout';

export const isGridHost = (cls: string): boolean => /^TcxGrid$/i.test(cls);

/** Levels, views, columns, bands, card rows… of any DevExpress grid flavour (table, banded, card, layout, chart; DB or not). */
const GRID_CHILD_RE = /^TcxGrid(DB)?(Banded|Card|Layout|Chart|Table|View)*(View|Level|Column|Row|Band|Series)$/i;
export const isGridChild = (cls: string): boolean => GRID_CHILD_RE.test(cls);
export const isGridLevel = (cls: string): boolean => /^TcxGridLevel$/i.test(cls);
export const isGridColumn = (cls: string): boolean => isGridChild(cls) && /Column$/i.test(cls);
export const isGridView = (cls: string): boolean => isGridChild(cls) && /View$/i.test(cls);

export const HEADER_HEIGHT = 22;
/** The "Drag a column header here to group by that column" band above the headers. */
export const GROUP_BAND = 22;

const num = (v: string | undefined): number | undefined => (v !== undefined && /^-?\d+$/.test(v) ? Number(v) : undefined);

/** The view the grid shows: the one its first level points to, else its first view. Only views inside the grid are drawn. */
export function shownView(grid: DfmNode): DfmNode | undefined {
    const views = grid.children.filter(c => isGridView(c.className));
    const level = grid.children.find(c => isGridLevel(c.className));
    const wanted = level?.props['GridView'];
    return views.find(v => wanted && v.name.toLowerCase() === wanted.toLowerCase()) ?? (wanted ? undefined : views[0]);
}

/** Whether the group-by band is shown above the headers (`OptionsView.GroupByBox`, on by default). */
export const hasGroupBand = (view: DfmNode | undefined): boolean => view?.props['OptionsView.GroupByBox'] !== 'False';

export interface ColumnRect { x: number; y: number; w: number; h: number }

/**
 * Rectangle of each visible column of a view, relative to the grid: side by side from the left (after the
 * indicator, when there is one), below the group band; `OptionsView.ColumnAutoWidth` stretches them to the grid.
 */
export function columnRects(view: DfmNode, gridW: number, gridH: number): Map<DfmNode, ColumnRect> {
    const out = new Map<DfmNode, ColumnRect>();
    const columns = view.children.filter(c => isGridColumn(c.className) && c.props['Visible'] !== 'False');
    const top = hasGroupBand(view) ? GROUP_BAND : 0;
    const indicator = view.props['OptionsView.Indicator'] === 'True' ? 12 : 0;
    let widths = columns.map(c => Math.max(8, num(c.props['Width']) ?? 64));
    if (view.props['OptionsView.ColumnAutoWidth'] === 'True' && widths.length) {
        const room = Math.max(40, gridW - indicator - 2);
        const total = widths.reduce((a, b) => a + b, 0);
        widths = widths.map(w => Math.max(8, Math.floor(w * room / total)));
    }
    let x = indicator;
    columns.forEach((c, i) => {
        out.set(c, { x, y: top, w: widths[i], h: Math.max(HEADER_HEIGHT, gridH - top) });
        x += widths[i];
    });
    return out;
}

/** What a column shows in its header: its Caption, else the field it is bound to, else its name. */
export function columnCaptionSource(col: DfmNode): { caption?: string; field?: string } {
    return { caption: col.props['Caption'], field: col.props['DataBinding.FieldName'] };
}
