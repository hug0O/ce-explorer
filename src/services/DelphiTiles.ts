/**
 * DevExpress tile control (TdxTileControl). Its groups and tiles are named
 * components nested in the control, with no Left / Top / Width / Height: the
 * control lays them out. This module knows how to recognise them and how to
 * draw a faithful-enough layout (tile sizes, rows per group, groups side by
 * side) for the form designer. Pure; nothing here ever writes the .dfm.
 */
import type { DfmNode } from './DelphiLayout';

export const isTileHost = (cls: string): boolean => /^TdxTileControl$/i.test(cls);
export const isTileItem = (cls: string): boolean => /^TdxTileControlItem$/i.test(cls);
export const isTileGroup = (cls: string): boolean => /^TdxTileControlGroup$/i.test(cls);
/** Tiles and groups: placed by the control, never by hand and never moved to another parent. */
export const isTileChild = (cls: string): boolean => isTileItem(cls) || isTileGroup(cls);

/** Values of `TdxTileControlItem.Size`, smallest first. */
export const TILE_SIZES = ['tcisSmall', 'tcisRegular', 'tcisLarge', 'tcisExtraLarge'];

/** Size of each tile in half-cells: a regular tile is 2 × 2, a large one twice as wide, an extra large one twice as high too. */
const SPAN: Record<string, [number, number]> = { tcisSmall: [1, 1], tcisRegular: [2, 2], tcisLarge: [4, 2], tcisExtraLarge: [4, 4] };

export interface TileRect { x: number; y: number; w: number; h: number }

const num = (v: string | undefined): number | undefined => (v !== undefined && /^-?\d+$/.test(v) ? Number(v) : undefined);

/** `Size` of a tile as the DFM spells it; the deprecated `IsLarge = True` still means a wide tile. */
export function tileSizeOf(item: DfmNode): string {
    const s = item.props['Size'];
    if (s && SPAN[s]) { return s; }
    return item.props['IsLarge'] === 'True' ? 'tcisLarge' : 'tcisRegular';
}

export const GROUP_HEADER = 22;

/**
 * Rectangles (relative to the control) of the tiles and of the group captions.
 * Groups sit side by side; inside a group tiles fill columns of `GroupMaxRowCount`
 * regular rows, in `IndexInGroup` order. Tiles that point to a group which does not
 * exist still get a place, so nothing disappears from the designer.
 */
export function tileLayout(host: DfmNode): { items: Map<DfmNode, TileRect>; groups: Map<DfmNode, TileRect> } {
    const items = new Map<DfmNode, TileRect>();
    const groups = new Map<DfmNode, TileRect>();
    const itemW = Math.max(40, num(host.props['OptionsView.ItemWidth']) ?? 120);
    const itemH = Math.max(40, num(host.props['OptionsView.ItemHeight']) ?? 120);
    // the spaces the control itself is set to (ItemIndent between tiles, GroupIndent between groups, IndentHorz / IndentVert around)
    const gap = Math.max(0, num(host.props['OptionsView.ItemIndent']) ?? 6);
    const groupGap = Math.max(0, num(host.props['OptionsView.GroupIndent']) ?? 40);
    const marginX = Math.max(0, num(host.props['OptionsView.IndentHorz']) ?? 24);
    const marginY = Math.max(0, num(host.props['OptionsView.IndentVert']) ?? 16);
    const hw = (itemW + gap) / 2;
    const hh = (itemH + gap) / 2;
    const maxRows = Math.max(1, num(host.props['OptionsView.GroupMaxRowCount']) ?? 3) * 2;

    const groupNodes = host.children.filter(c => isTileGroup(c.className));
    const tiles = host.children.filter(c => isTileItem(c.className));
    const groupIndex = (g: DfmNode): number => num(g.props['Index']) ?? 0;
    const itemGroup = (t: DfmNode): number => num(t.props['GroupIndex']) ?? 0;

    const indexes = new Set<number>();
    groupNodes.forEach(g => indexes.add(groupIndex(g)));
    tiles.forEach(t => indexes.add(itemGroup(t)));

    const top = marginY + (host.props['Title.Text'] !== undefined ? 56 : 0);
    let x = marginX;
    for (const idx of [...indexes].sort((a, b) => a - b)) {
        const members = tiles.map((node, order) => ({ node, order })).filter(m => itemGroup(m.node) === idx)
            .sort((a, b) => ((num(a.node.props['IndexInGroup']) ?? 0) - (num(b.node.props['IndexInGroup']) ?? 0)) || a.order - b.order);
        // Delphi places the tiles in their order, row by row, in a band as wide as the widest tile of the group (two cells when a
        // large tile is there, else one), and starts a new band when the rows of GroupMaxRowCount are used. It never goes back to fill a hole.
        const spanOf = (n: DfmNode): [number, number] => {
            const [w0, h0] = SPAN[tileSizeOf(n)];
            const cols = num(n.props['ColumnCount']), rows = num(n.props['RowCount']);
            return [cols ? cols * 2 : w0, rows ? rows * 2 : h0];
        };
        const band = Math.max(1, ...members.map(m => spanOf(m.node)[0]));
        let taken: boolean[][] = [];
        let bandX = 0;
        let cursor = 0;
        const free = (c: number, r: number, cw: number, ch: number): boolean => {
            for (let i = c; i < c + cw; i++) { for (let j = r; j < r + ch; j++) { if (taken[i]?.[j]) { return false; } } }
            return true;
        };
        let cols = 0;
        for (const m of members) {
            const [cw, ch] = spanOf(m.node);
            const w = Math.min(cw, band);
            const step = w >= 2 ? 2 : 1;
            for (let guard = 0; guard < 4000; guard++) {
                const c = cursor % band, r = Math.floor(cursor / band);
                if (r + ch > maxRows) { bandX += band; taken = []; cursor = 0; continue; }
                if (c % step === 0 && c + w <= band && (step === 1 || r % 2 === 0) && free(c, r, w, ch)) {
                    for (let i = c; i < c + w; i++) { for (let j = r; j < r + ch; j++) { (taken[i] ??= [])[j] = true; } }
                    items.set(m.node, { x: Math.round(x + (bandX + c) * hw), y: Math.round(top + GROUP_HEADER + 6 + r * hh), w: Math.round(w * hw - gap), h: Math.round(ch * hh - gap) });
                    cols = Math.max(cols, bandX + c + w);
                    break;
                }
                cursor++;
            }
        }
        const width = Math.max(90, Math.round(cols * hw - gap));
        const group = groupNodes.find(g => groupIndex(g) === idx);
        if (group) { groups.set(group, { x, y: top, w: width, h: GROUP_HEADER }); }
        x += width + groupGap;
    }
    // A group declared twice with the same Index (or after the others) still gets a caption.
    for (const g of groupNodes) { if (!groups.has(g)) { groups.set(g, { x, y: top, w: 90, h: GROUP_HEADER }); x += 90 + groupGap; } }
    return { items, groups };
}
