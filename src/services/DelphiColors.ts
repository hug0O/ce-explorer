/**
 * Colours of a Delphi form as the designer draws them: the names the IDE writes (`clRed`, `clBtnFace`), the numbers it
 * writes for the others (`Color = 16770764`, `$00FFCCAA`), the system colours (`clWindow`, `-2147483643`), and where a
 * component gets its colour from when it has none of its own: a DevExpress style (`Style = stRed`, `Styles.Content = …`,
 * `Style.Color`), or its parent (`ParentColor`, `ParentFont`).
 *
 * Pure: nothing here reads or writes a file.
 */
import type { DfmNode } from './DelphiLayout';

/** The Windows system colours, by index (`COLOR_xxx`); a system colour is written `$80000000 + index` (`-2147483648 + index`). */
const SYSTEM: string[] = [
    '#c8c8c8', '#3a6ea5', '#0054e3', '#7a96df', '#f0f0f0', '#ffffff', '#646464', '#000000', '#000000', '#ffffff', '#b4b4b4', '#f4f7fc', '#ababab',
    '#3399ff', '#ffffff', '#f0f0f0', '#a0a0a0', '#6d6d6d', '#000000', '#bfcddb', '#ffffff', '#696969', '#e3e3e3', '#000000', '#ffffe1',
];

const SYSTEM_NAMES = [
    'clScrollBar', 'clBackground', 'clActiveCaption', 'clInactiveCaption', 'clMenu', 'clWindow', 'clWindowFrame', 'clMenuText', 'clWindowText',
    'clCaptionText', 'clActiveBorder', 'clInactiveBorder', 'clAppWorkSpace', 'clHighlight', 'clHighlightText', 'clBtnFace', 'clBtnShadow', 'clGrayText',
    'clBtnText', 'clInactiveCaptionText', 'clBtnHighlight', 'cl3DDkShadow', 'cl3DLight', 'clInfoText', 'clInfoBk',
];

/** The colours that have a name and are not system colours. */
const BASIC: Record<string, string> = {
    clBlack: '#000000', clMaroon: '#800000', clGreen: '#008000', clOlive: '#808000', clNavy: '#000080', clPurple: '#800080', clTeal: '#008080',
    clGray: '#808080', clSilver: '#c0c0c0', clRed: '#ff0000', clLime: '#00ff00', clYellow: '#ffff00', clBlue: '#0000ff', clFuchsia: '#ff00ff',
    clAqua: '#00ffff', clLtGray: '#c0c0c0', clDkGray: '#808080', clWhite: '#ffffff', clMoneyGreen: '#c0dcc0', clSkyBlue: '#a6caf0', clCream: '#fffbf0',
    clMedGray: '#a0a0a4',
};

export const COLOR_NAMES: Record<string, string> = { ...BASIC };
SYSTEM_NAMES.forEach((n, i) => { COLOR_NAMES[n] = SYSTEM[i]; });
Object.assign(COLOR_NAMES, { clGradientActiveCaption: '#b9d1ea', clGradientInactiveCaption: '#d7e4f2', clHotLight: '#0066cc', clMenuHighlight: '#3399ff', clMenuBar: '#f0f0f0' });

const hex2 = (n: number): string => n.toString(16).padStart(2, '0');

/** The CSS colour of a Delphi colour value, or undefined for `clDefault`, `clNone` and what cannot be read. */
export function delphiToCss(value: string | undefined): string | undefined {
    if (!value) { return undefined; }
    const v = value.trim();
    if (COLOR_NAMES[v]) { return COLOR_NAMES[v]; }
    if (/^cl(Default|None)$/i.test(v)) { return undefined; }
    const m = /^\$([0-9A-Fa-f]{1,8})$/.exec(v);
    let n: number | undefined = m ? parseInt(m[1], 16) : /^-?\d{1,10}$/.test(v) ? Number(v) : undefined;
    if (n === undefined || Number.isNaN(n)) { return undefined; }
    if (n < 0) { n += 0x100000000; }
    // a system colour: the high bit is set, the low byte is its index
    if (n >= 0x80000000) { return SYSTEM[n & 0xFF]; }
    if (n > 0xFFFFFF) { return undefined; }
    // Delphi's TColor is $00BBGGRR
    return '#' + hex2(n & 255) + hex2((n >> 8) & 255) + hex2((n >> 16) & 255);
}

/** The value to write in the .dfm for a CSS colour: the name Delphi knows it by, else the number. Empty for no colour. */
export function cssToDelphi(css: string): string | undefined {
    const m = /^#([0-9a-fA-F]{6})$/.exec(css.trim());
    if (!m) { return undefined; }
    const rgb = m[1].toLowerCase();
    const name = Object.keys(BASIC).find(k => BASIC[k] === '#' + rgb && !/^cl(LtGray|DkGray)$/.test(k));
    if (name) { return name; }
    const r = parseInt(rgb.slice(0, 2), 16), g = parseInt(rgb.slice(2, 4), 16), b = parseInt(rgb.slice(4, 6), 16);
    return String((b << 16) | (g << 8) | r);
}

export interface Resolved {
    color?: string;
    /** Where the colour comes from, for the inspector: `Style = stRed`, `ParentColor of pnlTop`… */
    colorFrom?: string;
    fontColor?: string;
    fontFrom?: string;
    /** TMS smooth controls (`Fill.Color`, `Fill.ColorTo`, `Fill.GradientType`, `Fill.BorderColor`, `Fill.Rounding`): the end of the gradient and how it runs. */
    colorTo?: string;
    gradient?: 'vertical' | 'horizontal' | 'radial';
    borderColor?: string;
    rounding?: number;
}

/** The colours a style sheet gives to the parts of a grid: the cells (Content, ContentEven, ContentOdd), the header, the background. */
export type SheetColors = Partial<Record<'content' | 'contentEven' | 'contentOdd' | 'header' | 'background' | 'bandHeader', { color?: string; text?: string }>>;

const SHEET_PARTS: [keyof SheetColors, string][] = [['content', 'Styles.Content'], ['contentEven', 'Styles.ContentEven'], ['contentOdd', 'Styles.ContentOdd'], ['header', 'Styles.Header'], ['background', 'Styles.Background'], ['bandHeader', 'Styles.BandHeader']];

/** What a style sheet (`TcxGridTableViewStyleSheet`) gives, read in the .dfm that holds it together with its styles. */
export function sheetColorsOf(sheet: DfmNode, root: DfmNode): SheetColors {
    const out: SheetColors = {};
    for (const [part, prop] of SHEET_PARTS) {
        const ref = sheet.props[prop];
        const style = ref && /^[A-Za-z_]\w*$/.test(ref) ? find(root, ref) : undefined;
        if (style) { const c = styleColors(style); if (c.color || c.text) { out[part] = c; } }
    }
    return out;
}

/** The sheet named `Module.Sheet` in the .dfm of another module (a data module of styles), as the colours it gives. */
export function externalSheet(moduleDfm: DfmNode, sheetName: string): SheetColors | undefined {
    const sheet = find(moduleDfm, sheetName);
    return sheet ? sheetColorsOf(sheet, moduleDfm) : undefined;
}

/** Style sheets that live in other forms, by `module.sheet` in lower case: set around the building of a model. */
let EXTERNAL = new Map<string, SheetColors>();
export function withExternalSheets<T>(sheets: Map<string, SheetColors> | undefined, run: () => T): T {
    const before = EXTERNAL;
    EXTERNAL = sheets ?? new Map();
    try { return run(); } finally { EXTERNAL = before; }
}

/** The sheet a grid view or a column points to (`Styles.StyleSheet`): in this form, or in the module it names. */
function sheetOf(view: DfmNode): SheetColors | undefined {
    const ref = view.props['Styles.StyleSheet'];
    if (!ref) { return undefined; }
    const ext = EXTERNAL.get(ref.toLowerCase());
    if (ext) { return ext; }
    const local = find(rootOf(view), ref.split('.').pop()!);
    return local ? sheetColorsOf(local, rootOf(view)) : undefined;
}

/** The view a column belongs to, or the node itself when it is the view. */
const viewOf = (n: DfmNode): DfmNode | undefined => (/Column$/.test(n.className) ? n.parent : /TableView$|View$/.test(n.className) ? n : undefined);

/** The colour and the text colour a grid cell or header gets: the component's own style, the view's, then the style sheet's. */
export function gridPartColors(n: DfmNode, part: 'content' | 'header'): { color?: string; text?: string; from?: string } {
    const view = viewOf(n);
    if (!view) { return {}; }
    const prop = part === 'header' ? 'Styles.Header' : 'Styles.Content';
    for (const holder of [n, view]) {
        const ref = holder.props[prop];
        const style = ref && /^[A-Za-z_]\w*$/.test(ref) ? find(rootOf(n), ref) : undefined;
        if (style) { const c = styleColors(style); if (c.color || c.text) { return { ...c, from: `${prop} = ${style.name}` }; } }
    }
    const sheet = sheetOf(view)?.[part];
    return sheet ? { ...sheet, from: 'Styles.StyleSheet = ' + view.props['Styles.StyleSheet'] } : {};
}

const rootOf = (n: DfmNode): DfmNode => { let r = n; while (r.parent) { r = r.parent; } return r; };

function find(root: DfmNode, name: string): DfmNode | undefined {
    if (root.name.toLowerCase() === name.toLowerCase()) { return root; }
    for (const c of root.children) { const h = find(c, name); if (h) { return h; } }
    return undefined;
}

/** What a style of DevExpress gives: its colour and its text colour, only the ones its AssignedValues turn on. */
export function styleColors(style: DfmNode): { color?: string; text?: string } {
    const assigned = style.props['AssignedValues'];
    const on = (flag: string): boolean => assigned === undefined || new RegExp('\\b' + flag + '\\b').test(assigned);
    return {
        color: on('svColor') ? delphiToCss(style.props['Color']) : undefined,
        text: on('svTextColor') ? delphiToCss(style.props['TextColor']) : on('svFont') ? delphiToCss(style.props['Font.Color']) : undefined,
    };
}

/** The properties that point to a style: a bar item or an edit (`Style`), a grid view or a column (`Styles.Content`, `Styles.Header`…). */
const STYLE_REFS = ['Style', 'Styles.Content', 'Styles.ContentEven', 'Styles.ContentOdd', 'Styles.Background', 'Styles.Header'];

/** The colour and the text colour of a component, from its own properties, its styles, or its parent. */
export function resolveColors(n: DfmNode, depth = 0): Resolved {
    const out: Resolved = {};
    if (depth > 12) { return out; }
    const root = rootOf(n);
    let styleProp = 'Style';
    const refStyle = (): DfmNode | undefined => {
        for (const p of STYLE_REFS) {
            const v = n.props[p];
            if (v && /^[A-Za-z_]\w*$/.test(v)) { const s = find(root, v); if (s) { styleProp = p; return s; } }
        }
        return undefined;
    };
    const style = refStyle();
    const sc = style ? styleColors(style) : {};

    // a grid column draws its cells with the style of its view or of the style sheet of the view
    const cell = /Column$/.test(n.className) ? gridPartColors(n, 'content') : undefined;
    // the colour: the control's own style, a style it points to, its Color, its parent's
    const own = delphiToCss(n.props['Style.Color']) ?? delphiToCss(n.props['Color']);
    if (n.props['Style.Color'] !== undefined && own) { out.color = own; out.colorFrom = 'Style.Color'; }
    else if (sc.color && style) { out.color = sc.color; out.colorFrom = `${styleProp} = ${style.name}`; }
    else if (cell?.color) { out.color = cell.color; out.colorFrom = cell.from; }
    else if (own) { out.color = own; out.colorFrom = 'Color'; }
    else if (n.props['Fill.Color'] !== undefined && delphiToCss(n.props['Fill.Color'])) {
        out.color = delphiToCss(n.props['Fill.Color']); out.colorFrom = 'Fill.Color';
        const to = delphiToCss(n.props['Fill.ColorTo']);
        const type = n.props['Fill.GradientType'] ?? '';
        if (to && /^gt(Vertical|Horizontal|Radial|Path|Diagonal\w*)$/.test(type)) {
            out.colorTo = to;
            out.gradient = type === 'gtHorizontal' ? 'horizontal' : /Radial|Path/.test(type) ? 'radial' : 'vertical';
        }
        out.borderColor = delphiToCss(n.props['Fill.BorderColor']);
        const rounding = Number(n.props['Fill.Rounding']);
        if (rounding > 0) { out.rounding = rounding; }
    }
    else if (n.props['ParentColor'] === 'True' && n.parent) {
        const up = resolveColors(n.parent, depth + 1);
        if (up.color) { out.color = up.color; out.colorFrom = `ParentColor of ${n.parent.name}`; }
    }

    // the text colour
    const ownText = delphiToCss(n.props['Font.Color']) ?? delphiToCss(n.props['Style.Font.Color']) ?? delphiToCss(n.props['Caption.Font.Color']);
    if (ownText) { out.fontColor = ownText; out.fontFrom = n.props['Font.Color'] ? 'Font.Color' : n.props['Style.Font.Color'] ? 'Style.Font.Color' : 'Caption.Font.Color'; }
    else if (sc.text && style) { out.fontColor = sc.text; out.fontFrom = `${styleProp} = ${style.name}`; }
    else if (cell?.text) { out.fontColor = cell.text; out.fontFrom = cell.from; }
    else if (n.props['ParentFont'] !== 'False' && n.parent && n.parent.depth > 0) {
        const up = resolveColors(n.parent, depth + 1);
        if (up.fontColor) { out.fontColor = up.fontColor; out.fontFrom = `ParentFont of ${n.parent.name}`; }
    }
    return out;
}

const REF = /Styles\.StyleSheet\s*=\s*([A-Za-z_]\w*)\.([A-Za-z_]\w*)/g;

/** The `module.sheet` names a form's grids point to. */
export function sheetReferences(dfm: string): { module: string; sheet: string }[] {
    const seen = new Set<string>();
    const out: { module: string; sheet: string }[] = [];
    for (const m of dfm.matchAll(REF)) {
        const key = (m[1] + '.' + m[2]).toLowerCase();
        if (!seen.has(key)) { seen.add(key); out.push({ module: m[1], sheet: m[2] }); }
    }
    return out;
}

/** Whether two maps hold the same sheets (to avoid drawing the form again for nothing). */
export function sameSheets(a: Map<string, SheetColors>, b: Map<string, SheetColors>): boolean {
    return a.size === b.size && JSON.stringify([...a.entries()].sort()) === JSON.stringify([...b.entries()].sort());
}

/**
 * The .dfm files that may hold the data module `module` a form points to, best first. The module is a form with its own
 * unit, and the file is named after the unit (`dmdSGL_DevExpress` lives in `dmdSGL_DEVExpress_unit.dfm`), so the units the
 * form uses come first, then the files named like the module, then any file whose name contains it.
 * `files`: every .dfm known, by its name without extension in lower case.
 */
export function moduleCandidates(module: string, uses: string[], files: Map<string, string>): string[] {
    const out: string[] = [];
    const add = (p: string | undefined): void => { if (p && !out.includes(p)) { out.push(p); } };
    const m = module.toLowerCase();
    for (const u of uses) { add(files.get(u.toLowerCase())); }
    for (const name of [m, m + '_unit', m + 'unit', 'u' + m, m + '_u']) { add(files.get(name)); }
    for (const [base, p] of files) { if (base.includes(m) || (base.length > 6 && m.includes(base))) { add(p); } }
    return out;
}
