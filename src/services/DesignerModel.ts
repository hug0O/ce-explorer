/**
 * Render model and edit planners of the visual form designer. Pure: turns the
 * text of a .dfm into a tree of resolved rectangles (the VCL alignment rules
 * applied), and every user action of the designer into offset edits of the
 * .dfm and, when fields are involved, of the .pas.
 */
import { COMPONENTS, TextEdit, existingNames, nextComponentName, resolveComponentDef } from './DelphiForm';
import { DfmNode, findNode, isContainer, parseDfmTree, planAddComponent } from './DelphiLayout';
import { planDfmDelete, planDfmRename } from './DelphiSync';
import { wiredEvents } from './DelphiEvents';
import { nodeBlock, reindentBlock, renameIdentifiers, setProp, lineStartOffsets, deleteProp, parseAnchors } from '../utils/dfmEdit';
import { applyTextEdits } from './DelphiForm';
import { Family, familyOf } from './DelphiThirdParty';
import { hasSql, isConnection, isDataset, isDatasetField, isDataSource } from './DelphiData';
import { TILE_SIZES, isTileChild, isTileGroup, isTileHost, isTileItem, tileLayout, tileSizeOf } from './DelphiTiles';
import { columnRects, hasGroupBand, isGridChild, isGridColumn, isGridHost, isGridLevel, isGridView, shownView } from './DelphiGrid';
import { findHost, isNestedNode, nestedRuleOf, onlyHolds } from './DelphiNested';
import { ClipPayload, pasteComponents } from './DelphiClip';

/* ───────────────────────── value helpers ───────────────────────── */

/** Decodes a Pascal string literal sequence: `'abc'#233'def'` and `#$E9`. */
export function fromDfmString(value: string): string {
    let out = '';
    const re = /'((?:[^']|'')*)'|#\$([0-9A-Fa-f]+)|#(\d+)/g;
    for (let m = re.exec(value); m; m = re.exec(value)) {
        if (m[1] !== undefined) { out += m[1].replace(/''/g, '\''); }
        else if (m[2] !== undefined) { out += String.fromCodePoint(parseInt(m[2], 16)); }
        else { out += String.fromCodePoint(Number(m[3])); }
    }
    return out;
}

/** Encodes text the way Delphi writes it in a text DFM: ASCII in quotes, anything else as #code. */
export function toDfmString(text: string): string {
    if (text === '') { return '\'\''; }
    let out = '';
    let run = '';
    const flush = (): void => { if (run) { out += '\'' + run.replace(/'/g, '\'\'') + '\''; run = ''; } };
    for (const ch of text) {
        const code = ch.codePointAt(0)!;
        if (code >= 32 && code <= 126) { run += ch; }
        else { flush(); out += '#' + code; }
    }
    flush();
    return out;
}

const NAMED_COLORS: Record<string, string> = {
    clBtnFace: '#f0f0f0', clWindow: '#ffffff', clWhite: '#ffffff', clBlack: '#000000', clRed: '#ff0000', clGreen: '#008000', clBlue: '#0000ff',
    clYellow: '#ffff00', clGray: '#808080', clSilver: '#c0c0c0', clMaroon: '#800000', clNavy: '#000080', clTeal: '#008080', clOlive: '#808000',
    clPurple: '#800080', clAqua: '#00ffff', clLime: '#00ff00', clFuchsia: '#ff00ff', clWindowText: '#000000', clBtnText: '#000000',
    clHighlight: '#0078d7', clHighlightText: '#ffffff', clInfoBk: '#ffffe1', clMoneyGreen: '#c0dcc0', clSkyBlue: '#a6caf0', clCream: '#fffbf0',
    clMedGray: '#a0a0a4', clBtnShadow: '#a0a0a0', clBtnHighlight: '#ffffff', clGrayText: '#6d6d6d', clMenu: '#f0f0f0', clInactiveCaption: '#bfcddb',
};

export function cssColor(value: string | undefined): string | undefined {
    if (!value) { return undefined; }
    if (NAMED_COLORS[value]) { return NAMED_COLORS[value]; }
    const m = value.match(/^\$([0-9A-Fa-f]{6,8})$/);
    // Delphi writes colours that have no name as plain integers (Color = 16770764). System colours are negative: left alone.
    const dec = /^\d{1,8}$/.test(value) ? Number(value) : undefined;
    if (!m && (dec === undefined || dec > 0xFFFFFF)) { return undefined; }
    const v = m ? parseInt(m[1], 16) : dec!;
    const hex = (n: number) => n.toString(16).padStart(2, '0');
    return '#' + hex(v & 255) + hex((v >> 8) & 255) + hex((v >> 16) & 255);
}

/** Lines of a multi-line string property (`Lines.Strings = (` … `)`), decoded. */
export function multilineStrings(dfm: string, node: DfmNode, prop: string, max = 12): string[] {
    const start = node.propLines[prop];
    if (start === undefined) { return []; }
    const lines = dfm.split('\n');
    const out: string[] = [];
    for (let i = start + 1; i < lines.length && out.length < max; i++) {
        const t = lines[i].trim().replace(/\r$/, '');
        const closing = t.endsWith(')');
        out.push(fromDfmString(closing ? t.slice(0, -1) : t));
        if (closing) { break; }
    }
    return out;
}

/** Captions of a collection property (`Properties.Items = <item Caption = 'A' end …>`), e.g. DevExpress radio groups. */
export function collectionCaptions(dfm: string, node: DfmNode, prop: string, max = 8): string[] {
    const start = node.propLines[prop];
    if (start === undefined) { return []; }
    const lines = dfm.split('\n');
    const out: string[] = [];
    for (let i = start; i < lines.length && out.length < max; i++) {
        const t = lines[i].trim().replace(/\r$/, '');
        const c = t.match(/^Caption = (.*)$/);
        if (c) { out.push(fromDfmString(c[1])); }
        if (i > start && /^[^=]*>$/.test(t) && !t.includes('=')) { break; }
        if (t.endsWith('>') && i > start) { break; }
    }
    return out;
}

/* ───────────────────────── render model ───────────────────────── */

export interface DNode {
    name: string;
    cls: string;
    depth: number;
    /** Resolved rectangle, relative to the parent's client origin. */
    x: number; y: number; w: number; h: number;
    docked: boolean;
    align?: string;
    nonVisual: boolean;
    container: boolean;
    caption?: string;
    text?: string;
    lines: string[];
    /** Third-party family of the class (DevExpress / TMS), for rendering and the outline. */
    family?: Family;
    color?: string;
    fontColor?: string;
    bold: boolean;
    fontSize: number;
    visible: boolean;
    enabled: boolean;
    anchors: string[];
    tab?: number;
    events: Record<string, string>;
    /** Events of the component's catalog entry (empty when the class is unknown): the inspector lists them all. */
    eventNames: string[];
    /** Texts of a tile (Text1…Text4), `Size` of a tile. */
    tileTexts?: string[];
    tileSize?: string;
    /** Placed by its parent control (tile, grid column…): selected and edited, never dragged, resized or moved to another parent. */
    fixed?: boolean;
    /** Structure with nothing to draw (grid views, levels, hidden columns): listed and edited, not painted. */
    structural?: boolean;
    /** Grid: the view whose columns are drawn, and whether the group-by band shows above them. */
    shownView?: string;
    gridBand?: boolean;
    /** Grid column: the field it is bound to (`DataBinding.FieldName`). */
    gridField?: string;
    /** A dataset (query, table, stored procedure…): it holds persistent fields and can receive new ones. */
    dataset?: boolean;
    /** Persistent field: the field it is bound to (`FieldName`). */
    dataField?: string;
    /** Decoded strings the inspector edits on a connection or a dataset (ProviderName, Server, Database, Username, TableName, Port). */
    dataProps?: Record<string, string>;
    /** Decoded lines of `SQL.Strings`. */
    sql?: string[];
    /** One line for the tooltip of a non-visual component: server of a connection, first lines of a query. */
    summary?: string;
    activePage?: string;
    bevel: number;
    startLine: number;
    /** A property of the node that the inspector may edit, as written in the .dfm. */
    props: Record<string, string>;
    children: DNode[];
}

export interface DesignModel {
    root: DNode;
    formCaption: string;
    width: number;
    height: number;
}

const DEFAULT_ALIGN: Record<string, string> = { tsplitter: 'alLeft', tcxsplitter: 'alLeft', tstatusbar: 'alBottom', tdxstatusbar: 'alBottom', ttoolbar: 'alTop', tadvtoolbar: 'alTop', tcoolbar: 'alTop', tcontrolbar: 'alTop' };
const FIXED_SIZE_CLASSES = /^(TcxLookAndFeelController|TcxStyleRepository|TcxGridPopupMenu|TdxSkinController|TdxBarManager|TcxEditRepository|TcxPropertiesStore|TdxBarPopupMenu|TAdvFormStyler|TAdvToolBarOfficeStyler|TAdvAppStyler|TTimer|TOpenDialog|TSaveDialog|TMainMenu|TPopupMenu|TImageList|TActionList|TDataSource|TClientDataSet|TFDQuery|TFDConnection|TADOConnection|TADOQuery|TTable|TQuery|TFontDialog|TColorDialog|TPrintDialog)$/i;

/** A component with no visual presence (timers, controllers, style repositories…): drawn as a small icon. */
export function isNonVisual(n: DfmNode): boolean {
    if (n.depth === 0 || n.props['Width'] !== undefined || n.props['Height'] !== undefined || isSheetClass(n.className) || isTileChild(n.className) || isGridChild(n.className)
        || (isDatasetField(n.className) && !!n.parent && isDataset(n.parent.className))) { return false; }
    if (FIXED_SIZE_CLASSES.test(n.className)) { return true; }
    const known = COMPONENTS.find(c => c.className.toLowerCase() === n.className.toLowerCase());
    if (known) { return known.width === undefined && known.height === undefined; }
    // Unknown (third-party) class without a size: visual controls usually carry a caption, a tab order or an alignment.
    return n.left !== undefined && n.top !== undefined && n.props['Caption'] === undefined && n.props['TabOrder'] === undefined
        && n.props['Align'] === undefined && n.props['Text'] === undefined;
}

/** Size of a control whose Width / Height are not in the .dfm (the IDE default, or an auto-sized label). */
function defaultSize(n: DfmNode): { w: number; h: number } {
    const known = COMPONENTS.find(c => c.className.toLowerCase() === n.className.toLowerCase());
    const label = /label$/i.test(n.className) && !/labelededit$/i.test(n.className);
    const caption = n.props['Caption'] !== undefined ? fromDfmString(n.props['Caption']) : '';
    const w = n.width ?? (label && caption ? Math.max(12, caption.length * 7 + 2) : known?.width ?? 75);
    const h = n.height ?? known?.height ?? (label ? 17 : 25);
    return { w, h };
}

const num = (v: string | undefined): number | undefined => (v !== undefined && /^-?\d+$/.test(v) ? Number(v) : undefined);

/** Page controls and their pages: VCL, DevExpress (TcxPageControl) and TMS (TAdvOfficePager). */
export const isPagesClass = (cls: string): boolean => /(pagecontrol|officepager|^tcxpc)$/.test(cls.toLowerCase());
export const isSheetClass = (cls: string): boolean => /(tabsheet|officepage)$/.test(cls.toLowerCase());

function inset(n: DfmNode): { l: number; t: number; r: number; b: number } {
    const cls = n.className.toLowerCase();
    if (/panel$/.test(cls)) {
        const outer = (n.props['BevelOuter'] ?? 'bvRaised') === 'bvNone' ? 0 : 1;
        const inner = (n.props['BevelInner'] ?? 'bvNone') === 'bvNone' ? 0 : 1;
        const border = num(n.props['BorderWidth']) ?? 0;
        const v = outer + inner + border;
        return { l: v, t: v, r: v, b: v };
    }
    if (/groupbox$/.test(cls)) { return { l: 2, t: 15, r: 2, b: 2 }; }
    if (/officepager$/.test(cls)) { return { l: 1, t: 26, r: 1, b: 1 }; }
    if (isPagesClass(cls)) { return { l: 4, t: 28, r: 4, b: 4 }; }
    return { l: 0, t: 0, r: 0, b: 0 };
}

function clientSizeOf(n: DfmNode, w: number, h: number): { w: number; h: number } {
    const cw = num(n.props['ClientWidth']);
    const ch = num(n.props['ClientHeight']);
    return { w: cw ?? w, h: ch ?? h };
}

/** Numeric `EditValue = 1250.000000000000000000` of DevExpress editors, shown with at most two decimals. */
function editValueText(v: string | undefined): string | undefined {
    if (v === undefined || !/^-?\d+(\.\d+)?$/.test(v)) { return undefined; }
    return String(Math.round(Number(v) * 100) / 100);
}

function toDNode(dfm: string, n: DfmNode, rect: { x: number; y: number; w: number; h: number }, docked: boolean, align: string | undefined): DNode {
    const fontHeight = num(n.props['Font.Height']);
    const style = n.props['Font.Style'] ?? '';
    const tile = isTileItem(n.className);
    const tileTexts = tile ? [1, 2, 3, 4].map(i => (n.props[`Text${i}.Value`] !== undefined ? fromDfmString(n.props[`Text${i}.Value`]) : ''))
        : isTileHost(n.className) ? [n.props['Title.Text'] !== undefined ? fromDfmString(n.props['Title.Text']) : ''] : undefined;
    const caption = tile ? tileTexts![0]
        : isTileGroup(n.className) ? (n.props['Caption.Text'] !== undefined ? fromDfmString(n.props['Caption.Text']) : '')
        : isGridColumn(n.className) ? (n.props['Caption'] !== undefined ? fromDfmString(n.props['Caption']) : n.props['DataBinding.FieldName'] !== undefined ? fromDfmString(n.props['DataBinding.FieldName']) : '')
        : n.props['Caption'] !== undefined ? fromDfmString(n.props['Caption']) : undefined;
    const known = COMPONENTS.find(c => c.className.toLowerCase() === n.className.toLowerCase());
    const dataClass = isConnection(n.className) || isDataset(n.className);
    const wanted = dataClass ? DATA_PROPS : isDatasetField(n.className) ? FIELD_PROPS : undefined;
    const dataProps = wanted ? Object.fromEntries(wanted.filter(p => n.props[p] !== undefined).map(p => [p, decodeValue(n.props[p])])) : undefined;
    const sql = hasSql(n.className) && n.props['SQL.Strings'] !== undefined ? multilineStrings(dfm, n, 'SQL.Strings', 200) : undefined;
    const text = n.props['Text'] !== undefined ? fromDfmString(n.props['Text']) : undefined;
    const lines = n.props['Lines.Strings'] !== undefined ? multilineStrings(dfm, n, 'Lines.Strings')
        : n.props['Items.Strings'] !== undefined ? multilineStrings(dfm, n, 'Items.Strings')
        : n.props['Properties.Items.Strings'] !== undefined ? multilineStrings(dfm, n, 'Properties.Items.Strings')
        : n.props['Properties.Items'] !== undefined ? collectionCaptions(dfm, n, 'Properties.Items')
        : n.props['Items'] !== undefined && /group$/i.test(n.className) ? collectionCaptions(dfm, n, 'Items') : [];
    return {
        name: n.name, cls: n.className, depth: n.depth, ...rect, docked, align,
        nonVisual: isNonVisual(n),
        container: isContainer(n),
        caption, text: text ?? editValueText(n.props['EditValue']), lines,
        family: familyOf(n.className),
        color: cssColor(tile ? n.props['Style.GradientBeginColor'] : n.props['Color']),
        fontColor: cssColor(n.props['Font.Color']),
        bold: /fsBold/.test(style),
        fontSize: fontHeight !== undefined ? Math.max(8, Math.round(Math.abs(fontHeight) * 0.75 + 0.4)) : 9,
        visible: (n.props['Visible'] ?? 'True') !== 'False',
        enabled: (n.props['Enabled'] ?? 'True') !== 'False',
        anchors: [...parseAnchors(n.props['Anchors'])],
        tab: num(n.props['TabOrder']),
        events: wiredEvents(n),
        eventNames: known ? known.events.map(e => e.name) : [],
        tileTexts,
        tileSize: tile ? tileSizeOf(n) : undefined,
        gridField: isGridColumn(n.className) && n.props['DataBinding.FieldName'] !== undefined ? fromDfmString(n.props['DataBinding.FieldName']) : undefined,
        dataset: isDataset(n.className) || undefined,
        dataField: isDatasetField(n.className) && n.props['FieldName'] !== undefined ? fromDfmString(n.props['FieldName']) : undefined,
        dataProps, sql,
        summary: dataClass ? dataSummary(n, sql, dataProps ?? {}) : undefined,
        activePage: n.props['ActivePage'] ?? n.props['Properties.ActivePage'],
        bevel: n.className.toLowerCase() === 'tpanel' ? ((n.props['BevelOuter'] ?? 'bvRaised') === 'bvNone' ? 0 : 1) : 0,
        startLine: n.startLine,
        props: { ...n.props },
        children: [],
    };
}

function fallbackNode(n: DfmNode, rect: { x: number; y: number; w: number; h: number }): DNode {
    return {
        name: n.name, cls: n.className, depth: n.depth, ...rect, docked: false, nonVisual: false, container: false, lines: [], bold: false, fontSize: 9,
        visible: true, enabled: true, anchors: ['akLeft', 'akTop'], events: {}, eventNames: [], bevel: 0, startLine: n.startLine, props: {}, children: [],
    };
}

const NO_RECT = { x: 0, y: 0, w: 0, h: 0 };

const DATA_PROPS = ['ProviderName', 'Server', 'Database', 'Username', 'TableName', 'Port'];
const FIELD_PROPS = ['DisplayLabel', 'Size', 'DisplayWidth'];
/** A value as the inspector shows it: quoted strings decoded, numbers and identifiers as written. */
const decodeValue = (raw: string): string => (/^['#]/.test(raw) ? fromDfmString(raw) : raw);

function dataSummary(n: DfmNode, sql: string[] | undefined, p: Record<string, string>): string | undefined {
    if (isConnection(n.className)) { return [p['ProviderName'], p['Server'], p['Database']].filter(Boolean).join(' · ') || undefined; }
    if (sql && sql.length) { return sql.slice(0, 3).join(' ').replace(/\s+/g, ' ').slice(0, 160); }
    return p['TableName'] ? 'table ' + p['TableName'] : undefined;
}

/** A persistent field of a dataset: listed and edited, never painted, placed by its dataset. */
function dataFieldNode(dfm: string, k: DfmNode): DNode {
    let d: DNode;
    try { d = toDNode(dfm, k, NO_RECT, true, undefined); } catch { d = fallbackNode(k, NO_RECT); }
    d.fixed = true; d.structural = true; d.container = false; d.nonVisual = false; d.docked = true; d.children = [];
    return d;
}

/**
 * A level, view or column of a DevExpress grid. They are structure: listed and edited, never painted — except
 * the visible columns of the view the grid shows, which get the header strip they occupy in the grid.
 */
function gridNode(dfm: string, k: DfmNode, ctx?: { w: number; h: number; shown?: DfmNode }): DNode {
    const part = (node: DfmNode, rect: { x: number; y: number; w: number; h: number }, structural: boolean): DNode => {
        let d: DNode;
        try { d = toDNode(dfm, node, rect, true, undefined); } catch { d = fallbackNode(node, rect); }
        d.fixed = true; d.structural = structural; d.container = false; d.nonVisual = false; d.docked = true; d.children = [];
        return d;
    };
    const d = part(k, NO_RECT, true);
    if (isGridView(k.className)) {
        const rects = ctx && ctx.shown === k ? columnRects(k, ctx.w, ctx.h) : undefined;
        d.children = k.children.filter(c => isGridChild(c.className)).map(c => part(c, rects?.get(c) ?? NO_RECT, !rects?.get(c)));
    } else {
        d.children = k.children.filter(c => isGridChild(c.className)).map(c => gridNode(dfm, c, ctx));
    }
    return d;
}

/** Lays out the children of `n` inside a client area of w × h, applying the VCL docking order. */
function layoutChildren(dfm: string, n: DfmNode, w: number, h: number): DNode[] {
    const ins = inset(n);
    const area = { l: ins.l, t: ins.t, r: w - ins.r, b: h - ins.b };
    // Sub-objects with no geometry at all (grid views, levels, column collections) are not controls: not drawn.
    const tiles = isTileHost(n.className) ? tileLayout(n) : undefined;
    const gridHost = isGridHost(n.className);
    const dataHost = isDataset(n.className);
    const kids = n.children.filter(k => (tiles && isTileChild(k.className)) || isGridChild(k.className) || (dataHost && isDatasetField(k.className)) || isSheetClass(k.className) || !(k.left === undefined && k.top === undefined && k.width === undefined && k.height === undefined && k.align === undefined && DEFAULT_ALIGN[k.className.toLowerCase()] === undefined));
    const alignOf = (k: DfmNode): string | undefined => k.align ?? DEFAULT_ALIGN[k.className.toLowerCase()];
    const placed = new Map<DfmNode, { x: number; y: number; w: number; h: number; docked: boolean; align?: string }>();

    const group = (a: string) => kids.filter(k => alignOf(k) === a);
    const sizeOf = (k: DfmNode, dim: 'width' | 'height'): number => k[dim] ?? (dim === 'width' ? defaultSize(k).w : defaultSize(k).h);

    // Delphi aligns alTop, alBottom, alLeft, alRight, then alClient; ties by position.
    for (const k of group('alTop').sort((a, b) => (a.top ?? 0) - (b.top ?? 0))) {
        const hh = sizeOf(k, 'height');
        placed.set(k, { x: area.l, y: area.t, w: area.r - area.l, h: hh, docked: true, align: 'alTop' });
        area.t += hh;
    }
    for (const k of group('alBottom').sort((a, b) => (b.top ?? 0) - (a.top ?? 0))) {
        const hh = sizeOf(k, 'height');
        placed.set(k, { x: area.l, y: area.b - hh, w: area.r - area.l, h: hh, docked: true, align: 'alBottom' });
        area.b -= hh;
    }
    for (const k of group('alLeft').sort((a, b) => (a.left ?? 0) - (b.left ?? 0))) {
        const ww = sizeOf(k, 'width');
        placed.set(k, { x: area.l, y: area.t, w: ww, h: Math.max(0, area.b - area.t), docked: true, align: 'alLeft' });
        area.l += ww;
    }
    for (const k of group('alRight').sort((a, b) => (b.left ?? 0) - (a.left ?? 0))) {
        const ww = sizeOf(k, 'width');
        placed.set(k, { x: area.r - ww, y: area.t, w: ww, h: Math.max(0, area.b - area.t), docked: true, align: 'alRight' });
        area.r -= ww;
    }
    for (const k of group('alClient')) {
        placed.set(k, { x: area.l, y: area.t, w: Math.max(0, area.r - area.l), h: Math.max(0, area.b - area.t), docked: true, align: 'alClient' });
    }

    const isPages = isPagesClass(n.className);
    return kids.map(k => {
        if (isGridChild(k.className)) { return gridNode(dfm, k, gridHost ? { w, h, shown: shownView(n) } : undefined); }
        if (dataHost && isDatasetField(k.className)) { return dataFieldNode(dfm, k); }
        let rect = placed.get(k);
        const tileRect = tiles?.items.get(k) ?? tiles?.groups.get(k);
        if (!rect && tileRect) { rect = { ...tileRect, docked: true }; }
        if (!rect) {
            const size = isNonVisual(k) ? { w: 28, h: 28 } : defaultSize(k);
            rect = { x: k.left ?? 0, y: k.top ?? 0, w: size.w, h: size.h, docked: false };
        }
        if (isPages && isSheetClass(k.className)) {
            rect = { x: area.l, y: area.t, w: Math.max(0, area.r - area.l), h: Math.max(0, area.b - area.t), docked: true, align: 'alClient' };
        }
        // A component the tool cannot interpret must never take the others down with it:
        // it becomes a plain placeholder box and its text stays untouched.
        let d: DNode;
        try {
            d = toDNode(dfm, k, rect, rect.docked, rect.align);
            const client = clientSizeOf(k, rect.w, rect.h);
            d.children = layoutChildren(dfm, k, client.w, client.h);
            if (isGridHost(k.className)) { const sv = shownView(k); d.shownView = sv?.name; d.gridBand = hasGroupBand(sv); }
        } catch {
            d = fallbackNode(k, rect);
        }
        return d;
    });
}

export function buildDesignModel(dfm: string): DesignModel | undefined {
    let root: DfmNode | undefined;
    try { root = parseDfmTree(dfm); } catch { return undefined; }
    if (!root) { return undefined; }
    const cw = num(root.props['ClientWidth']) ?? Math.max(60, (root.width ?? 320) - 16);
    const ch = num(root.props['ClientHeight']) ?? Math.max(40, (root.height ?? 240) - 39);
    const rootNode = toDNode(dfm, root, { x: 0, y: 0, w: cw, h: ch }, false, undefined);
    rootNode.children = layoutChildren(dfm, root, cw, ch);
    return { root: rootNode, formCaption: root.props['Caption'] !== undefined ? fromDfmString(root.props['Caption']) : root.name, width: cw, height: ch };
}

/* ───────────────────────── edits ───────────────────────── */

export type Rect = { left?: number; top?: number; width?: number; height?: number };
export type DesignResult = { error: string } | { dfmEdits: TextEdit[]; pasEdits: TextEdit[]; note?: string };

const fail = (error: string): { error: string } => ({ error });
const clampInt = (v: unknown, min: number, max: number): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : undefined);

/** Left / Top / Width / Height of several components in one go (move and resize share this path). */
export function rectEdits(dfm: string, changes: { name: string; rect: Rect }[]): DesignResult {
    const root = parseDfmTree(dfm);
    if (!root) { return fail('The .dfm is not in text format.'); }
    const edits: TextEdit[] = [];
    for (const c of changes) {
        const node = findNode(root, c.name);
        if (!node || node.depth === 0) { continue; }
        const set = (prop: string, raw: unknown, min: number, current: number | undefined): void => {
            const v = clampInt(raw, min, 5000);
            if (v === undefined || v === current) { return; }
            edits.push(setProp(dfm, node, prop, String(v)));
        };
        const docked = node.align !== undefined;
        if (!docked) { set('Left', c.rect.left, -2000, node.left); set('Top', c.rect.top, -2000, node.top); }
        set('Width', c.rect.width, 1, node.width);
        set('Height', c.rect.height, 1, node.height);
    }
    return { dfmEdits: edits, pasEdits: [] };
}

function descendants(n: DfmNode): DfmNode[] { return [n, ...n.children.flatMap(descendants)]; }

/** Moves components into another container (drag and drop onto a panel, group box, page…). */
export function reparentEdits(dfm: string, names: string[], targetName: string, positions: { left: number; top: number }[]): DesignResult {
    const root = parseDfmTree(dfm);
    if (!root) { return fail('The .dfm is not in text format.'); }
    const target = findNode(root, targetName);
    if (!target) { return fail(`Container "${targetName}" not found.`); }
    const nested = names.map(n => findNode(root, n)).find(n => n && isNestedNode(n));
    if (nested) {
        return fail(isTileChild(nested.className)
            ? `${nested.name} belongs to its tile control and cannot move to another container: change its group instead.`
            : isDatasetField(nested.className)
                ? `${nested.name} is a field of its dataset and cannot move to another container.`
                : `${nested.name} is part of its grid and cannot move to another container.`);
    }
    if (!isContainer(target)) { return fail(`${target.name} cannot contain other components.`); }
    const edits: TextEdit[] = [];
    const eol = dfm.includes('\r\n') ? '\r\n' : '\n';
    const texts: string[] = [];
    // A component selected together with its own container travels inside it: moving both would remove the same block twice.
    const picked = names.map(n => findNode(root, n)).filter((n): n is DfmNode => !!n);
    const inside = new Set(picked.filter(n => picked.some(o => o !== n && descendants(o).includes(n))));
    names.forEach((name, i) => {
        const node = findNode(root, name);
        if (!node || node.depth === 0 || inside.has(node) || descendants(node).includes(target)) { return; }
        const block = nodeBlock(dfm, node);
        let text = reindentBlock(block.text.replace(/\s+$/, ''), node.depth, 0);
        const sub = parseDfmTree(text);
        if (sub) {
            const p = positions[i] ?? { left: 16, top: 16 };
            const e: TextEdit[] = [];
            if (node.align === undefined) { e.push(setProp(text, sub, 'Left', String(Math.max(0, Math.round(p.left)))), setProp(text, sub, 'Top', String(Math.max(0, Math.round(p.top))))); }
            text = applyTextEdits(text, e);
        }
        texts.push(reindentBlock(text, 0, target.depth + 1));
        edits.push({ offset: block.offset, length: block.length, text: '' });
    });
    if (texts.length === 0) { return fail('Nothing to move.'); }
    const starts = lineStartOffsets(dfm);
    edits.push({ offset: starts[target.endLine], length: 0, text: texts.join(eol) + eol });
    return { dfmEdits: edits, pasEdits: [] };
}

/**
 * Pastes copied components into the container the designer points at: the selected container, or the one around the
 * selected component. Parts (tiles, grid levels, columns, dataset fields) only go into their own host.
 */
export function pasteEdits(pas: string, dfm: string, payload: ClipPayload, targetName?: string): DesignResult & { roots?: string[]; added?: string[] } {
    const root = parseDfmTree(dfm);
    if (!root) { return fail('The .dfm is not in text format.'); }
    const picked = targetName ? findNode(root, targetName) : root;
    if (!picked) { return fail(`Container "${targetName}" not found.`); }
    const parts = payload.objects.map(o => parseDfmTree(o));
    if (parts.length === 0 || parts.some(p => !p)) { return fail('The copied components are not readable.'); }
    const roots = parts as DfmNode[];
    if (new Set(roots.map(p => nestedRuleOf(p.className)?.id ?? '')).size > 1) { return fail('Tiles, grid parts and fields cannot be pasted together with ordinary controls.'); }
    let target = isContainer(picked) ? picked : (picked.parent ?? root);
    const rule = nestedRuleOf(roots[0].className);
    if (rule) {
        const host = findHost(rule, picked);
        if (!host) { return fail(`${roots[0].className} goes inside ${rule.what}: select one first.`); }
        target = host;
    } else {
        const only = onlyHolds(target);
        if (only) { return fail(`${only}: select another container to paste into.`); }
    }
    const r = pasteComponents(pas, dfm, payload, target.depth === 0 ? undefined : target.name, payload.sourceForm.toLowerCase() === root.name.toLowerCase() ? 16 : 0);
    if ('error' in r) { return fail(r.error); }
    const final = (n: string): string => r.renamed.find(x => x.from.toLowerCase() === n.toLowerCase())?.to ?? n;
    return {
        dfmEdits: [r.dfmEdit], pasEdits: r.pasEdits,
        note: [r.renamed.length ? `renamed: ${r.renamed.map(x => `${x.from}→${x.to}`).join(', ')}` : '', r.createdHandlers.length ? `${r.createdHandlers.length} handler(s) created` : ''].filter(Boolean).join(' · ') || undefined,
        roots: roots.map(p => final(p.name)), added: payload.components.map(c => final(c.name)),
    };
}

function pasFieldEdit(pas: string, name: string): TextEdit | undefined {
    const starts = lineStartOffsets(pas);
    const lines = pas.split('\n');
    const re = new RegExp('^[ \\t]*' + name.replace(/[$]/g, '\\$') + '\\s*:\\s*[\\w.]+\\s*;', 'i');
    const i = lines.findIndex(l => re.test(l));
    return i < 0 ? undefined : { offset: starts[i], length: (starts[i + 1] ?? pas.length) - starts[i], text: '' };
}

/** Deletes components: .dfm blocks (children included), their fields, and the empty handlers nobody else uses. */
export function deleteEdits(pas: string, dfm: string, names: string[], formClass: string): DesignResult {
    const root = parseDfmTree(dfm);
    if (!root) { return fail('The .dfm is not in text format.'); }
    const nodes = names.map(n => findNode(root, n)).filter((n): n is DfmNode => !!n && n.depth > 0);
    const roots = nodes.filter(n => !nodes.some(o => o !== n && descendants(o).includes(n)));
    if (roots.length === 0) { return fail('Select components to delete.'); }
    const dfmEdits: TextEdit[] = [];
    const pasEdits: TextEdit[] = [];
    const seen = new Set<string>();
    let handlers = 0;
    for (const r of roots) {
        const plan = planDfmDelete(pas, dfm, r.name, formClass);
        if (!plan) { continue; }
        dfmEdits.push(...plan.dfmEdits);
        for (const e of plan.pasEdits) { const k = e.offset + ':' + (e.length ?? 0); if (!seen.has(k)) { seen.add(k); pasEdits.push(e); } }
        const own = pasFieldEdit(pas, r.name);
        if (own && !seen.has(own.offset + ':' + own.length)) { seen.add(own.offset + ':' + own.length); pasEdits.push(own); }
        handlers += plan.removedHandlers.length;
    }
    // What pointed to a component going away is unlinked, as the IDE does (a grid level to its view, a dataset to its connection, a data source to its dataset).
    for (const { node, props } of danglingRefs(root, names)) {
        for (const p of props) { const e = deleteProp(dfm, node, p); if (e) { dfmEdits.push(e); } }
    }
    return { dfmEdits, pasEdits, note: handlers ? `${handlers} empty handler(s) removed` : undefined };
}

/** Properties that point to another component of the form and that are unlinked when it is deleted. */
const REF_PROPS = ['GridView', 'Connection', 'DataSet', 'DataSource', 'MasterSource', 'Transaction', 'UpdateObject'];

/** Components outside the deletion that point to one that is being deleted, with the properties that do. */
export function danglingRefs(root: DfmNode, names: string[]): { node: DfmNode; props: string[] }[] {
    const gone = new Set<string>();
    for (const n of names) { const node = findNode(root, n); if (node) { descendants(node).forEach(d => gone.add(d.name.toLowerCase())); } }
    return descendants(root)
        .filter(n => !gone.has(n.name.toLowerCase()))
        .map(n => ({ node: n, props: REF_PROPS.filter(p => n.props[p] !== undefined && gone.has(n.props[p].toLowerCase())) }))
        .filter(x => x.props.length > 0);
}

/** Renames a component everywhere: .dfm object and references, the unit's field, and its `<Name><Event>` handlers. */
export function renameEdits(pas: string, dfm: string, from: string, to: string): DesignResult {
    const plan = planDfmRename(pas, dfm, from, to);
    if (!plan) { return fail(`${from} is not a component of the form.`); }
    if ('error' in plan) { return fail(plan.error); }
    const pasEdits = [...plan.pasEdits];
    const re = new RegExp('(?<![\\w$#.])' + from.replace(/[$#]/g, '\\$&') + '(?![\\w$#])', 'gi');
    const starts = lineStartOffsets(pas);
    pas.split('\n').forEach((line, i) => {
        let inQuote = false;
        const q: boolean[] = [];
        for (let k = 0; k < line.length; k++) { if (line[k] === '\'') { inQuote = !inQuote; } q.push(inQuote); }
        const comment = line.indexOf('//');
        for (let m = re.exec(line); m; m = re.exec(line)) {
            if (q[m.index] || (comment >= 0 && m.index > comment)) { continue; }
            pasEdits.push({ offset: starts[i] + m.index, length: from.length, text: to });
        }
        re.lastIndex = 0;
    });
    return { dfmEdits: plan.dfmEdits, pasEdits, note: plan.handlers.length ? `handlers renamed: ${plan.handlers.map(h => h.from + '→' + h.to).join(', ')}` : undefined };
}

export const EDITABLE_PROPS: Record<string, 'int' | 'string' | 'bool' | 'enum' | 'anchors' | 'ref'> = {
    Left: 'int', Top: 'int', Width: 'int', Height: 'int', TabOrder: 'int', Caption: 'string', Text: 'string', Hint: 'string',
    Visible: 'bool', Enabled: 'bool', ShowHint: 'bool', ReadOnly: 'bool', Checked: 'bool', TabStop: 'bool', Align: 'enum', Anchors: 'anchors',
    // DevExpress tile control: tiles and groups.
    Size: 'enum', GroupIndex: 'int', IndexInGroup: 'int', 'Text1.Value': 'string', 'Text2.Value': 'string', 'Caption.Text': 'string',
    // DevExpress grid: the field of a column, the view of a level.
    'DataBinding.FieldName': 'string', GridView: 'ref',
    // Data access: persistent fields, connections, datasets, data sources.
    FieldName: 'string', DisplayLabel: 'string', DisplayWidth: 'int', Required: 'bool',
    ProviderName: 'string', Server: 'string', Database: 'string', Username: 'string', Port: 'int', LoginPrompt: 'bool',
    TableName: 'string', Connection: 'ref', DataSet: 'ref',
};
export const ALIGN_VALUES = ['alNone', 'alTop', 'alBottom', 'alLeft', 'alRight', 'alClient'];
const ENUM_VALUES: Record<string, string[]> = { Align: ALIGN_VALUES, Size: TILE_SIZES };
/** Properties that exist only on some classes: refused on any other. */
const PROP_CLASS: Record<string, (cls: string) => boolean> = {
    Size: c => isTileItem(c) || isDatasetField(c), GroupIndex: isTileItem, IndexInGroup: isTileItem, 'Text1.Value': isTileItem, 'Text2.Value': isTileItem, 'Caption.Text': isTileGroup,
    'DataBinding.FieldName': isGridColumn, GridView: isGridLevel,
    FieldName: isDatasetField, DisplayLabel: isDatasetField, DisplayWidth: isDatasetField, Required: isDatasetField,
    ProviderName: isConnection, Server: isConnection, Database: isConnection, Username: isConnection, Port: isConnection, LoginPrompt: isConnection,
    TableName: isDataset, DataSet: isDataSource,
    Connection: c => isDataset(c) || /^TUni(SQL|Script|Transaction|MetaData|Dump|Loader|Alerter)$/i.test(c),
};
/** What a link property may point to. */
const REF_TARGET: Record<string, { ok: (cls: string) => boolean; what: string }> = {
    GridView: { ok: isGridView, what: 'a grid view' }, Connection: { ok: isConnection, what: 'a connection' }, DataSet: { ok: isDataset, what: 'a dataset' },
};

/** One property edit from the inspector, validated and written the way Delphi would. */
export function setPropertyEdits(dfm: string, name: string, prop: string, value: unknown): DesignResult {
    const root = parseDfmTree(dfm);
    if (!root) { return fail('The .dfm is not in text format.'); }
    const node = findNode(root, name);
    if (!node) { return fail(`Component "${name}" not found.`); }
    // `Size` is a tile size (an enumeration) on a tile, a number of characters on a string field.
    const kind = prop === 'Size' && isDatasetField(node.className) ? 'int' : EDITABLE_PROPS[prop];
    if (!kind) { return fail(`${prop} cannot be edited here.`); }
    if (PROP_CLASS[prop] && !PROP_CLASS[prop](node.className)) { return fail(`${node.className} has no ${prop} property.`); }
    let text: string;
    if (kind === 'int') {
        const v = clampInt(value, -2000, 5000);
        if (v === undefined) { return fail(`${prop} must be a whole number.`); }
        text = String(v);
    } else if (kind === 'string') {
        text = toDfmString(String(value ?? ''));
    } else if (kind === 'bool') {
        text = value === true || value === 'True' ? 'True' : 'False';
    } else if (kind === 'ref') {
        // A link to another component of the form: a grid level points to one of the views, empty unlinks it.
        const target = typeof value === 'string' ? value.trim() : '';
        if (!target) { const e = deleteProp(dfm, node, prop); return { dfmEdits: e ? [e] : [], pasEdits: [] }; }
        const wanted = REF_TARGET[prop];
        const found = findNode(root, target);
        if (!wanted || !found || !wanted.ok(found.className)) { return fail(`${target} is not ${wanted?.what ?? 'a valid target'} of this form.`); }
        text = found.name;
    } else if (kind === 'enum') {
        if (typeof value !== 'string' || !(ENUM_VALUES[prop] ?? []).includes(value)) { return fail(`Unknown ${prop} value.`); }
        if (prop === 'Align' && value === 'alNone') {
            const e = deleteProp(dfm, node, 'Align');
            return { dfmEdits: e ? [e] : [], pasEdits: [] };
        }
        text = value;
    } else {
        const set = new Set(String(value ?? '').match(/ak(Left|Top|Right|Bottom)/g) ?? []);
        const isDefault = set.size === 2 && set.has('akLeft') && set.has('akTop');
        if (isDefault || set.size === 0) {
            const e = deleteProp(dfm, node, 'Anchors');
            return { dfmEdits: e ? [e] : [], pasEdits: [] };
        }
        text = '[' + ['akLeft', 'akTop', 'akRight', 'akBottom'].filter(a => set.has(a)).join(', ') + ']';
    }
    return { dfmEdits: [setProp(dfm, node, prop, text)], pasEdits: [] };
}

/** A long string literal, split in pieces of 64 characters joined by `+`, as the IDE writes them. */
function sqlItem(text: string, inner: string, eol: string): string {
    if (text.length <= 64) { return toDfmString(text); }
    const parts: string[] = [];
    for (let i = 0; i < text.length; i += 64) { parts.push(toDfmString(text.slice(i, i + 64))); }
    return parts.join(' +' + eol + inner);
}

/** Replaces `SQL.Strings` of a dataset, SQL or script component (an empty list removes the property). */
export function setSqlEdits(dfm: string, name: string, lines: string[]): DesignResult {
    const root = parseDfmTree(dfm);
    if (!root) { return fail('The .dfm is not in text format.'); }
    const node = findNode(root, name);
    if (!node) { return fail(`Component "${name}" not found.`); }
    if (!hasSql(node.className)) { return fail(`${node.className} has no SQL property.`); }
    if (lines.length > 2000 || lines.some(l => typeof l !== 'string' || l.length > 4000)) { return fail('The SQL is too long.'); }
    const eol = dfm.includes('\r\n') ? '\r\n' : '\n';
    const pad = '  '.repeat(node.depth + 1);
    const inner = pad + '  ';
    const text = lines.length === 0 ? '' : `${pad}SQL.Strings = (${eol}${lines.map(l => inner + sqlItem(l, inner, eol)).join(eol)})${eol}`;
    const all = dfm.split('\n');
    const starts = lineStartOffsets(dfm);
    const first = node.propLines['SQL.Strings'];
    if (first === undefined) {
        if (!text) { return { dfmEdits: [], pasEdits: [] }; }
        const at = node.children.length > 0 ? node.children[0].startLine : node.endLine;
        return { dfmEdits: [{ offset: starts[at], length: 0, text }], pasEdits: [] };
    }
    // the value runs to the first line that ends with a closing parenthesis, as the DFM parser reads it
    const value = all[first].slice(all[first].indexOf('=') + 1).trim();
    let last = first;
    if (!(value.startsWith('(') && value.endsWith(')') && value.length > 1)) { while (last + 1 < all.length && !/\)\s*$/.test(all[last])) { last++; } }
    const from = starts[first];
    const to = starts[last + 1] ?? dfm.length;
    return { dfmEdits: [{ offset: from, length: to - from, text }], pasEdits: [] };
}

export interface AddRequest {
    className: string;
    parentName?: string;
    left: number;
    top: number;
    width?: number;
    height?: number;
    unit?: string;
}

/** Drops a new component at an exact position (the designer's palette tool). */
export function addEdits(pas: string, dfm: string, req: AddRequest): DesignResult & { name?: string } {
    const root = parseDfmTree(dfm);
    if (!root) { return fail('The .dfm is not in text format.'); }
    const def = resolveComponentDef(req.className, req.unit);
    const sized = { ...def, width: req.width ?? def.width, height: req.height ?? def.height };
    const parent = req.parentName ? findNode(root, req.parentName) : root;
    let container = parent && isContainer(parent) ? parent : (parent?.parent ?? root);
    const rule = nestedRuleOf(req.className);
    if (rule) {
        // Tiles, groups, detail pages, grid levels, views and columns live inside their own host: the one under the drop point,
        // the one of the selected part, or (a column dropped on a grid) the view the grid shows.
        const host = findHost(rule, parent);
        if (!host) { return fail(`${req.className} goes inside ${rule.what}: select one, or drop it onto one.`); }
        container = host;
    }
    // `%PARENT%` in a name prefix: the IDE names a grid's view cxGrid1DBTableView1 and its column cxGrid1DBTableView1Column1.
    const name = nextComponentName(def.namePrefix.replace('%PARENT%', container.name), existingNames(dfm, pas));
    const plan = planAddComponent(pas, dfm, {
        className: req.className, name, side: 'auto', parentName: container.depth === 0 ? undefined : container.name,
        def: sized, position: { left: Math.max(0, Math.round(req.left)), top: Math.max(0, Math.round(req.top)) },
    });
    if ('error' in plan) { return fail(plan.error); }
    return { dfmEdits: [plan.dfmEdit], pasEdits: plan.pasEdits, name };
}

/** Component whose `object` block contains the given .dfm line (for editor ⇄ designer selection). */
export function nodeAtLine(dfm: string, line: number): string | undefined {
    const root = parseDfmTree(dfm);
    if (!root) { return undefined; }
    let best: DfmNode | undefined;
    for (const n of descendants(root)) {
        if (n.depth > 0 && line >= n.startLine && line <= n.endLine && (!best || n.depth > best.depth)) { best = n; }
    }
    return best?.name;
}

void renameIdentifiers;

/* ───────────────────────── integrity check ───────────────────────── */

export interface EditExpectation {
    /** Components whose properties may change, and which ones. */
    touched?: string[];
    props?: string[];
    removed?: string[];
    added?: string[];
    reparented?: string[];
    /** A rename also rewrites references in other components. */
    renamed?: boolean;
}

interface FlatNode { name: string; cls: string; parent: string; props: Record<string, string> }

function flatten(root: DfmNode): Map<string, FlatNode> {
    const out = new Map<string, FlatNode>();
    const walk = (n: DfmNode, parent: string): void => { out.set(n.name.toLowerCase(), { name: n.name, cls: n.className, parent, props: n.props }); n.children.forEach(c => walk(c, n.name.toLowerCase())); };
    walk(root, '');
    return out;
}

/**
 * Compares the .dfm before and after a designer action and reports anything
 * that is not what the action was allowed to change. A component the tool
 * does not understand must come out byte-for-byte equivalent: if an edit
 * would alter it (or break the file), the caller refuses to apply it.
 */
export function verifyEdit(before: string, after: string, ex: EditExpectation): string | undefined {
    let a: DfmNode | undefined;
    let b: DfmNode | undefined;
    try { a = parseDfmTree(before); b = parseDfmTree(after); } catch { return 'the result is not a readable .dfm'; }
    if (!a || !b) { return 'the result is not a readable .dfm'; }
    const x = flatten(a);
    const y = flatten(b);
    const lower = (l?: string[]) => new Set((l ?? []).map(s => s.toLowerCase()));
    const removed = lower(ex.removed);
    const added = lower(ex.added);
    for (const [name, n] of x) { if (!y.has(name) && !removed.has(name)) { return `${n.name} would disappear`; } }
    for (const [name, n] of y) { if (!x.has(name) && !added.has(name)) { return `${n.name} would appear`; } }
    if (ex.renamed) { return undefined; }
    const touched = lower(ex.touched);
    const reparented = lower(ex.reparented);
    const props = new Set(ex.props ?? []);
    for (const [name, nb] of y) {
        const na = x.get(name);
        if (!na) { continue; }
        if (na.cls !== nb.cls) { return `${nb.name} would change class`; }
        if (na.parent !== nb.parent && !reparented.has(name)) { return `${nb.name} would change container`; }
        const keys = new Set([...Object.keys(na.props), ...Object.keys(nb.props)]);
        for (const k of keys) {
            if (na.props[k] === nb.props[k]) { continue; }
            if (!touched.has(name) || !props.has(k)) { return `${nb.name}.${k} would change`; }
        }
    }
    return undefined;
}

/** Names of a component and everything inside it. */
export function namesWithin(dfm: string, name: string): string[] {
    const root = parseDfmTree(dfm);
    const node = root ? findNode(root, name) : undefined;
    return node ? descendants(node).map(n => n.name) : [name];
}
