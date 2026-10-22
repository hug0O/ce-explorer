/**
 * Delphi-style visual component insertion: adds a component (button, edit,
 * label…) to a form's .dfm text and keeps the .pas unit in sync (field in the
 * form class, event-handler declaration and empty implementation, uses clause).
 *
 * Everything here works on plain text and returns offset-based edits, so it is
 * unit-testable without VS Code.
 */
import { THIRD_PARTY } from './DelphiThirdParty';
import { DATA_COMPONENTS } from './DelphiData';

export interface TextEdit {
    /** Offset in the original text where `text` is inserted. */
    offset: number;
    text: string;
    /** Characters of the original text replaced by `text` (default 0 = pure insertion). */
    length?: number;
}

export interface EventDef {
    /** Property name, e.g. OnClick. */
    name: string;
    /** Handler parameter list, e.g. `Sender: TObject`. */
    params: string;
}

export interface ComponentDef {
    className: string;
    namePrefix: string;
    /** Unit (without Vcl. prefix) that declares the class. */
    unit: string;
    /** Further units the IDE adds to `uses` when dropping the component (third-party families need several). */
    extraUnits?: string[];
    /** Visual size; undefined for non-visual components (TTimer). */
    width?: number;
    height?: number;
    /** Extra DFM property lines (without indentation). */
    props: string[];
    /** Whether the component takes a TabOrder. */
    tabOrder: boolean;
    events: EventDef[];
    /** A component nested in another one that places it (tile, group…): no Left / Top / Width / Height / TabOrder in the .dfm. */
    nested?: boolean;
}

const SENDER = 'Sender: TObject';
const MOUSE = `${SENDER}; Button: TMouseButton; Shift: TShiftState; X, Y: Integer`;
const ev = (name: string, params = SENDER): EventDef => ({ name, params });
const KEY_EVENTS = [
    ev('OnKeyPress', `${SENDER}; var Key: Char`),
    ev('OnKeyDown', `${SENDER}; var Key: Word; Shift: TShiftState`),
];

const VCL_COMPONENTS: ComponentDef[] = [
    { className: 'TButton', namePrefix: 'Button', unit: 'StdCtrls', width: 75, height: 25, props: ["Caption = '%NAME%'"], tabOrder: true,
        events: [ev('OnClick'), ev('OnEnter'), ev('OnExit'), ...KEY_EVENTS] },
    { className: 'TEdit', namePrefix: 'Edit', unit: 'StdCtrls', width: 121, height: 21, props: ["Text = '%NAME%'"], tabOrder: true,
        events: [ev('OnChange'), ev('OnClick'), ev('OnEnter'), ev('OnExit'), ...KEY_EVENTS] },
    { className: 'TLabel', namePrefix: 'Label', unit: 'StdCtrls', width: 35, height: 13, props: ["Caption = '%NAME%'"], tabOrder: false,
        events: [ev('OnClick'), ev('OnDblClick')] },
    { className: 'TCheckBox', namePrefix: 'CheckBox', unit: 'StdCtrls', width: 97, height: 17, props: ["Caption = '%NAME%'"], tabOrder: true,
        events: [ev('OnClick'), ev('OnEnter'), ev('OnExit')] },
    { className: 'TRadioButton', namePrefix: 'RadioButton', unit: 'StdCtrls', width: 113, height: 17, props: ["Caption = '%NAME%'"], tabOrder: true,
        events: [ev('OnClick'), ev('OnEnter'), ev('OnExit')] },
    { className: 'TMemo', namePrefix: 'Memo', unit: 'StdCtrls', width: 185, height: 89, props: ['Lines.Strings = (', "  '%NAME%')"], tabOrder: true,
        events: [ev('OnChange'), ev('OnEnter'), ev('OnExit'), ...KEY_EVENTS] },
    { className: 'TComboBox', namePrefix: 'ComboBox', unit: 'StdCtrls', width: 145, height: 21, props: ["Text = '%NAME%'"], tabOrder: true,
        events: [ev('OnChange'), ev('OnSelect'), ev('OnDropDown'), ev('OnEnter'), ev('OnExit')] },
    { className: 'TListBox', namePrefix: 'ListBox', unit: 'StdCtrls', width: 121, height: 97, props: ['ItemHeight = 13'], tabOrder: true,
        events: [ev('OnClick'), ev('OnDblClick'), ev('OnEnter'), ev('OnExit')] },
    { className: 'TPanel', namePrefix: 'Panel', unit: 'ExtCtrls', width: 185, height: 41, props: ["Caption = '%NAME%'"], tabOrder: true,
        events: [ev('OnClick'), ev('OnResize')] },
    { className: 'TTimer', namePrefix: 'Timer', unit: 'ExtCtrls', props: [], tabOrder: false, events: [ev('OnTimer')] },
    { className: 'TChart', namePrefix: 'Chart', unit: 'Chart', extraUnits: ['TeEngine', 'TeeProcs'], width: 400, height: 250, props: ['Title.Text.Strings = (', "  'TChart')", 'View3D = False'], tabOrder: true, events: [ev('OnClick'), ev('OnClickSeries', `${SENDER}; Series: TChartSeries; ValueIndex: Integer; Button: TMouseButton; Shift: TShiftState; X, Y: Integer`)] },
    { className: 'TDBChart', namePrefix: 'DBChart', unit: 'DBChart', extraUnits: ['TeEngine', 'TeeProcs', 'Chart'], width: 400, height: 250, props: ['Title.Text.Strings = (', "  'TDBChart')", 'View3D = False'], tabOrder: true, events: [ev('OnClick')] },
    { className: 'TBarSeries', namePrefix: 'Series', unit: 'Series', extraUnits: ['TeEngine'], props: ["XValues.Name = 'X'", 'XValues.Order = loAscending', "YValues.Name = 'Bar'", 'YValues.Order = loNone'], tabOrder: false, nested: true, events: [] },
    { className: 'THorizBarSeries', namePrefix: 'Series', unit: 'Series', extraUnits: ['TeEngine'], props: ["XValues.Name = 'Bar'", 'XValues.Order = loNone', "YValues.Name = 'Y'", 'YValues.Order = loAscending'], tabOrder: false, nested: true, events: [] },
    { className: 'TLineSeries', namePrefix: 'Series', unit: 'Series', extraUnits: ['TeEngine'], props: ["XValues.Name = 'X'", 'XValues.Order = loAscending', "YValues.Name = 'Y'", 'YValues.Order = loNone'], tabOrder: false, nested: true, events: [] },
    { className: 'TFastLineSeries', namePrefix: 'Series', unit: 'Series', extraUnits: ['TeEngine'], props: ["XValues.Name = 'X'", 'XValues.Order = loAscending', "YValues.Name = 'Y'", 'YValues.Order = loNone'], tabOrder: false, nested: true, events: [] },
    { className: 'TAreaSeries', namePrefix: 'Series', unit: 'Series', extraUnits: ['TeEngine'], props: ["XValues.Name = 'X'", 'XValues.Order = loAscending', "YValues.Name = 'Y'", 'YValues.Order = loNone'], tabOrder: false, nested: true, events: [] },
    { className: 'TPointSeries', namePrefix: 'Series', unit: 'Series', extraUnits: ['TeEngine'], props: ["XValues.Name = 'X'", 'XValues.Order = loAscending', "YValues.Name = 'Y'", 'YValues.Order = loNone'], tabOrder: false, nested: true, events: [] },
    { className: 'TPieSeries', namePrefix: 'Series', unit: 'Series', extraUnits: ['TeEngine'], props: ["XValues.Name = 'X'", 'XValues.Order = loAscending', "YValues.Name = 'Pie'", 'YValues.Order = loNone'], tabOrder: false, nested: true, events: [] },
    { className: 'TDragMarksTool', namePrefix: 'ChartTool', unit: 'TeeTools', extraUnits: ['TeEngine'], props: [], tabOrder: false, nested: true, events: [] },
    { className: 'TAnnotationTool', namePrefix: 'ChartTool', unit: 'TeeTools', extraUnits: ['TeEngine'], props: [], tabOrder: false, nested: true, events: [] },
    { className: 'TCursorTool', namePrefix: 'ChartTool', unit: 'TeeTools', extraUnits: ['TeEngine'], props: [], tabOrder: false, nested: true, events: [] },
    { className: 'TMarksTipTool', namePrefix: 'ChartTool', unit: 'TeeTools', extraUnits: ['TeEngine'], props: [], tabOrder: false, nested: true, events: [] },
    { className: 'TRotateTool', namePrefix: 'ChartTool', unit: 'TeeTools', extraUnits: ['TeEngine'], props: [], tabOrder: false, nested: true, events: [] },
    { className: 'TPopupMenu', namePrefix: 'PopupMenu', unit: 'Menus', props: [], tabOrder: false, events: [ev('OnPopup')] },
    { className: 'TMainMenu', namePrefix: 'MainMenu', unit: 'Menus', props: [], tabOrder: false, events: [] },
    { className: 'TMenuItem', namePrefix: 'MenuItem', unit: 'Menus', props: ["Caption = '%NAME%'"], tabOrder: false, nested: true, events: [ev('OnClick')] },
    { className: 'TGroupBox', namePrefix: 'GroupBox', unit: 'StdCtrls', width: 185, height: 105, props: ["Caption = '%NAME%'"], tabOrder: true,
        events: [ev('OnClick'), ev('OnEnter'), ev('OnExit')] },
    { className: 'TBitBtn', namePrefix: 'BitBtn', unit: 'Buttons', width: 75, height: 25, props: ["Caption = '%NAME%'"], tabOrder: true,
        events: [ev('OnClick'), ev('OnEnter'), ev('OnExit')] },
    { className: 'TSpeedButton', namePrefix: 'SpeedButton', unit: 'Buttons', width: 23, height: 22, props: [], tabOrder: false,
        events: [ev('OnClick')] },
    { className: 'TImage', namePrefix: 'Image', unit: 'ExtCtrls', width: 105, height: 105, props: [], tabOrder: false,
        events: [ev('OnClick'), ev('OnDblClick')] },
    { className: 'TShape', namePrefix: 'Shape', unit: 'ExtCtrls', width: 65, height: 65, props: [], tabOrder: false, events: [ev('OnMouseDown', MOUSE)] },
    { className: 'TBevel', namePrefix: 'Bevel', unit: 'ExtCtrls', width: 50, height: 50, props: [], tabOrder: false, events: [] },
    { className: 'TSplitter', namePrefix: 'Splitter', unit: 'ExtCtrls', width: 8, height: 100, props: [], tabOrder: false, events: [ev('OnMoved')] },
    { className: 'TLabeledEdit', namePrefix: 'LabeledEdit', unit: 'ExtCtrls', width: 121, height: 23, props: ["EditLabel.Caption = '%NAME%'", "Text = ''"], tabOrder: true,
        events: [ev('OnChange'), ev('OnEnter'), ev('OnExit')] },
    { className: 'TStringGrid', namePrefix: 'StringGrid', unit: 'Grids', width: 320, height: 120, props: [], tabOrder: true,
        events: [ev('OnClick'), ev('OnDblClick'), ev('OnSelectCell', `${SENDER}; ACol, ARow: LongInt; var CanSelect: Boolean`)] },
    { className: 'TProgressBar', namePrefix: 'ProgressBar', unit: 'ComCtrls', width: 150, height: 17, props: [], tabOrder: false, events: [] },
    { className: 'TTrackBar', namePrefix: 'TrackBar', unit: 'ComCtrls', width: 150, height: 45, props: [], tabOrder: true, events: [ev('OnChange')] },
    { className: 'TDateTimePicker', namePrefix: 'DateTimePicker', unit: 'ComCtrls', width: 186, height: 23, props: [], tabOrder: true,
        events: [ev('OnChange'), ev('OnCloseUp')] },
    { className: 'TRichEdit', namePrefix: 'RichEdit', unit: 'ComCtrls', width: 185, height: 89, props: [], tabOrder: true, events: [ev('OnChange')] },
    { className: 'TCheckListBox', namePrefix: 'CheckListBox', unit: 'CheckLst', width: 121, height: 97, props: ['ItemHeight = 17'], tabOrder: true,
        events: [ev('OnClick'), ev('OnClickCheck')] },
    { className: 'TMaskEdit', namePrefix: 'MaskEdit', unit: 'Mask', width: 121, height: 21, props: ["Text = ''"], tabOrder: true, events: [ev('OnChange')] },
    { className: 'TScrollBox', namePrefix: 'ScrollBox', unit: 'Forms', width: 185, height: 105, props: [], tabOrder: true, events: [ev('OnResize')] },
];

/** The built-in catalog: the VCL, then DevExpress and TMS. */
export const COMPONENTS: ComponentDef[] = [...VCL_COMPONENTS, ...DATA_COMPONENTS, ...THIRD_PARTY];

/** Parameter lists of the usual VCL events; anything else defaults to `Sender: TObject`. */
export const EVENT_PARAMS: Record<string, string> = {
    OnKeyPress: `${SENDER}; var Key: Char`,
    OnKeyDown: `${SENDER}; var Key: Word; Shift: TShiftState`,
    OnKeyUp: `${SENDER}; var Key: Word; Shift: TShiftState`,
    OnMouseDown: MOUSE,
    OnMouseUp: MOUSE,
    OnMouseMove: `${SENDER}; Shift: TShiftState; X, Y: Integer`,
    OnSelectCell: `${SENDER}; ACol, ARow: LongInt; var CanSelect: Boolean`,
    OnClose: `${SENDER}; var Action: TCloseAction`,
    OnCloseQuery: `${SENDER}; var CanClose: Boolean`,
};

export function eventDefFor(eventName: string): EventDef {
    return { name: eventName, params: EVENT_PARAMS[eventName] ?? SENDER };
}

/** The event as the component's own catalog entry declares it (its handler signature may differ from `Sender: TObject`). */
export function eventDefOf(def: ComponentDef, eventName: string): EventDef {
    return def.events.find(e => e.name === eventName) ?? eventDefFor(eventName);
}

/**
 * Definition of ANY component class: the catalog entry when known, otherwise a
 * generic visual control (75 × 25, tab stop). `unit` overrides / supplies the
 * unit to add to `uses` (empty = none added); `prefix` derives the default name.
 */
export function resolveComponentDef(className: string, unit?: string): ComponentDef {
    const known = COMPONENTS.find(c => c.className.toLowerCase() === className.toLowerCase());
    if (known) { return unit !== undefined && unit.trim() ? { ...known, unit: unit.trim().replace(/^Vcl\./i, '') } : known; }
    const prefix = className.replace(/^T/, '') || 'Component';
    return {
        className, namePrefix: prefix, unit: (unit ?? '').trim().replace(/^Vcl\./i, ''),
        width: 75, height: 25, props: [], tabOrder: true, events: [ev('OnClick'), ev('OnChange')],
    };
}

/**
 * Applies offset edits (all expressed against the original text). Insertions at the same
 * offset keep the order of the list, as VS Code does for a WorkspaceEdit.
 */
export function applyTextEdits(text: string, edits: TextEdit[]): string {
    const sorted = edits.map((e, i) => ({ e, i })).sort((a, b) => b.e.offset - a.e.offset || b.i - a.i);
    let out = text;
    for (const { e } of sorted) { out = out.slice(0, e.offset) + e.text + out.slice(e.offset + (e.length ?? 0)); }
    return out;
}

/**
 * Edits made safe to hand to the editor: sorted, exact duplicates dropped, removals that
 * overlap merged. Anything else that overlaps (two replacements of the same text, an
 * insertion inside a removed block) cannot be applied in one go: reported instead, since
 * VS Code refuses a whole WorkspaceEdit that contains such a pair.
 */
export function normalizeEdits(edits: TextEdit[]): { edits: TextEdit[] } | { error: string } {
    const list = edits
        .map((e, i) => ({ e: { offset: e.offset, length: e.length ?? 0, text: e.text }, i }))
        // an insertion sorts before the range that starts at the same offset
        .sort((a, b) => a.e.offset - b.e.offset || Number(b.e.length === 0) - Number(a.e.length === 0) || a.i - b.i);
    const out: { offset: number; length: number; text: string }[] = [];
    for (const { e } of list) {
        const prev = out[out.length - 1];
        if (!prev) { out.push({ ...e }); continue; }
        if (prev.offset === e.offset && prev.length === e.length && prev.text === e.text) { continue; }
        const prevEnd = prev.offset + prev.length;
        if (e.offset >= prevEnd) { out.push({ ...e }); continue; }
        if (prev.text === '' && e.text === '' && e.length > 0) {
            prev.length = Math.max(prevEnd, e.offset + e.length) - prev.offset;
            continue;
        }
        if (e.length === 0 && e.text === '') { continue; }
        return { error: `two changes overlap in the text (offsets ${prev.offset}-${prevEnd} and ${e.offset}-${e.offset + e.length})` };
    }
    return { edits: out.map(e => (e.length ? { offset: e.offset, length: e.length, text: e.text } : { offset: e.offset, text: e.text })) };
}

/** Names already used by components in the .dfm (`object Name: TClass`) and the unit's declarations. */
export function existingNames(dfm: string, pas: string): Set<string> {
    const names = new Set<string>();
    for (const m of dfm.matchAll(/^\s*(?:object|inherited|inline)\s+(\w+)\s*:/gim)) { names.add(m[1].toLowerCase()); }
    for (const m of pas.matchAll(/^\s*(\w+)\s*:\s*T\w+\s*;/gim)) { names.add(m[1].toLowerCase()); }
    return names;
}

export function nextComponentName(prefix: string, used: Set<string>): string {
    let n = 1;
    while (used.has((prefix + n).toLowerCase())) { n++; }
    return prefix + n;
}

export function isValidIdentifier(name: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

/**
 * An event property: `OnClick`, a nested one such as DevExpress `Properties.OnChange`, or one of the
 * `Before…` / `After…` events of datasets and connections (`AfterOpen`, `BeforePost`, `AfterConnect`).
 * A few `Before…` / `After…` names are values, not events (`BeforeColor`…).
 */
export const EVENT_PROP_RE = /^(?:[A-Za-z]\w*\.)?(?:On[A-Z]\w*|(?:Before|After)(?!(?:Color|Style|Width|Height|Size|Count|Text|Caption|Font|Index|Kind|Mode|Type)\b)[A-Z]\w*)$/;

/** `Button1` + `OnClick` → `Button1Click`; `cxTextEdit1` + `Properties.OnChange` → `cxTextEdit1PropertiesChange`. */
export function handlerName(componentName: string, eventName: string): string {
    return componentName + eventName.replace(/\.On/, '.').replace(/^On/, '').replace(/\./g, '');
}

export interface DfmRoot {
    name: string;
    className: string;
    eol: string;
}

/** Reads the root `object Form1: TForm1` of a TEXT dfm; undefined for binary / unrecognised files. */
export function parseDfmRoot(dfm: string): DfmRoot | undefined {
    const m = dfm.match(/^\s*(?:object|inherited|inline)\s+(\w+)\s*:\s*(\w+)/i);
    if (!m) { return undefined; }
    return { name: m[1], className: m[2], eol: dfm.includes('\r\n') ? '\r\n' : '\n' };
}

interface ChildBox { top: number; height: number }

function childBoxes(dfm: string): ChildBox[] {
    const boxes: ChildBox[] = [];
    let current: ChildBox | undefined;
    for (const line of dfm.split(/\r?\n/)) {
        if (/^ {2}(object|inherited|inline)\s/i.test(line)) { current = { top: 0, height: 0 }; boxes.push(current); continue; }
        if (/^ {2}end\s*$/i.test(line)) { current = undefined; continue; }
        if (!current) { continue; }
        const t = line.match(/^ {4}Top = (\d+)/);
        const h = line.match(/^ {4}Height = (\d+)/);
        if (t) { current.top = Number(t[1]); }
        if (h) { current.height = Number(h[1]); }
    }
    return boxes;
}

/** DFM text of one component, indented as a direct child of the form. */
export function buildDfmObject(def: ComponentDef, name: string, handler: { event: string; method: string } | undefined, dfm: string): string {
    const eol = dfm.includes('\r\n') ? '\r\n' : '\n';
    const boxes = childBoxes(dfm);
    const top = boxes.length > 0 ? Math.max(...boxes.map(b => b.top + b.height)) + 8 : 16;
    const tab = boxes.length;
    const lines: string[] = [`  object ${name}: ${def.className}`, '    Left = 16', `    Top = ${top}`];
    if (def.width !== undefined) { lines.push(`    Width = ${def.width}`); }
    if (def.height !== undefined) { lines.push(`    Height = ${def.height}`); }
    for (const p of def.props) { lines.push('    ' + p.replace(/%NAME%/g, name)); }
    if (def.tabOrder) { lines.push(`    TabOrder = ${tab}`); }
    if (handler) { lines.push(`    ${handler.event} = ${handler.method}`); }
    lines.push('  end');
    return lines.join(eol) + eol;
}

/** Edit that adds `objectText` as the last child of the root object (before its closing `end`). */
export function insertIntoDfm(dfm: string, objectText: string): TextEdit | undefined {
    const re = /^end[ \t]*\r?$/gim;
    let last: RegExpExecArray | undefined;
    for (let m = re.exec(dfm); m; m = re.exec(dfm)) { last = m; }
    if (!last) { return undefined; }
    return { offset: last.index, text: objectText };
}

/** Finds the form class: the one named like the dfm root class, else the first `T… = class(TForm…)`. */
export function findFormClass(pas: string, preferred?: string): { name: string; startLine: number } | undefined {
    const lines = pas.split(/\r?\n/);
    let fallback: { name: string; startLine: number } | undefined;
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^\s*(\w+)\s*=\s*class\s*\(\s*([\w.]+)\s*\)/i);
        if (!m) { continue; }
        if (preferred && m[1].toLowerCase() === preferred.toLowerCase()) { return { name: m[1], startLine: i }; }
        if (!fallback && /(form|frame|datamodule)$/i.test(m[2])) { fallback = { name: m[1], startLine: i }; }
    }
    return fallback;
}

function lineOffsets(text: string): number[] {
    const offsets = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') { offsets.push(i + 1); }
    }
    return offsets;
}

/** The code of a Pascal line without comments and string contents; `state` carries a `{ … }` / `(* … *)` comment over lines. */
function codeOfLine(line: string, state: { block: '' | '}' | '*)' }): string {
    let out = '';
    let i = 0;
    while (i < line.length) {
        if (state.block) {
            const j = line.indexOf(state.block, i);
            if (j < 0) { return out; }
            i = j + state.block.length;
            state.block = '';
            continue;
        }
        const c = line[i];
        if (c === '\'') {
            let j = i + 1;
            while (j < line.length) {
                if (line[j] === '\'') { if (line[j + 1] === '\'') { j += 2; continue; } break; }
                j++;
            }
            out += '\'\'';
            i = j + 1;
            continue;
        }
        if (c === '/' && line[i + 1] === '/') { break; }
        if (c === '{') { state.block = '}'; i++; continue; }
        if (c === '(' && line[i + 1] === '*') { state.block = '*)'; i += 2; continue; }
        out += c;
        i++;
    }
    return out;
}

export interface FormClassScan {
    name: string;
    /** Line of `TForm1 = class(TForm)`. */
    startLine: number;
    /** Line of the class's closing `end;`. */
    endLine: number;
    /** First visibility keyword (private / public…), else the closing `end;`: the IDE-managed section ends here. */
    sectionEnd: number;
    /** Last line of the last component field of the IDE-managed section (-1 = none). A declaration may span lines or name several fields. */
    lastFieldEnd: number;
    /** Last line of the last method declaration of that section (-1 = none), whatever the number of lines it takes. */
    lastMethodEnd: number;
}

/**
 * Where things sit in the form class: statement by statement (comments, wrapped declarations and
 * `A, B: TEdit;` handled), so that a new field is always added under the last one.
 */
export function scanFormClass(pas: string, preferred?: string): FormClassScan | undefined {
    const form = findFormClass(pas, preferred);
    if (!form) { return undefined; }
    const lines = pas.split(/\r?\n/);
    let endLine = -1;
    for (let i = form.startLine + 1; i < lines.length; i++) {
        if (/^\s*end\s*;/i.test(lines[i])) { endLine = i; break; }
    }
    if (endLine < 0) { return undefined; }
    let sectionEnd = endLine;
    for (let i = form.startLine + 1; i < endLine; i++) {
        if (/^\s*(strict\s+)?(private|protected|public|published)\b/i.test(lines[i])) { sectionEnd = i; break; }
    }
    let lastFieldEnd = -1;
    let lastMethodEnd = -1;
    const state: { block: '' | '}' | '*)' } = { block: '' };
    let statement = '';
    let depth = 0;
    for (let i = form.startLine + 1; i < sectionEnd; i++) {
        const code = codeOfLine(lines[i], state).trim();
        if (!code) { continue; }
        statement += ' ' + code;
        for (const ch of code) { if (ch === '(' || ch === '[') { depth++; } else if (ch === ')' || ch === ']') { depth--; } }
        if (depth > 0 || !code.endsWith(';')) { continue; }
        const text = statement.trim();
        statement = '';
        depth = 0;
        if (/^(?:class\s+)?(?:procedure|function|constructor|destructor|operator)\b|^property\b/i.test(text)) { lastMethodEnd = i; }
        else if (/^[A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*\s*:/.test(text)) { lastFieldEnd = i; }
    }
    return { name: form.name, startLine: form.startLine, endLine, sectionEnd, lastFieldEnd, lastMethodEnd };
}

const VCL_UNITS = new Set([
    'stdctrls', 'extctrls', 'buttons', 'grids', 'comctrls', 'checklst', 'mask', 'forms', 'controls', 'dialogs',
    'graphics', 'menus', 'imglist', 'actnlist', 'dbctrls', 'dbgrids', 'tabs', 'tabnotbk', 'valedit', 'wincontrols',
]);

export interface UnitEditOptions {
    formClass: string;
    componentName: string;
    def: ComponentDef;
    event?: EventDef;
    /** The component already exists on the form: do not declare its field (nor touch `uses`). */
    skipField?: boolean;
    /** Handler name override (default: <Component><Event without "On">). */
    methodName?: string;
}

/**
 * Edits for the .pas unit: field + handler declaration in the form class's
 * IDE-managed section (before the first visibility keyword), an empty handler
 * implementation before `end.`, and the needed unit in the interface `uses`.
 * Returns undefined when the form class cannot be located.
 */
export function buildUnitEdits(pas: string, opt: UnitEditOptions): { edits: TextEdit[]; handler?: string } | undefined {
    const eol = pas.includes('\r\n') ? '\r\n' : '\n';
    const lines = pas.split(/\r?\n/);
    const offs = lineOffsets(pas);
    const scan = scanFormClass(pas, opt.formClass);
    if (!scan) { return undefined; }
    const form = { name: scan.name, startLine: scan.startLine };

    const edits: TextEdit[] = [];
    const method = opt.event ? (opt.methodName || handlerName(opt.componentName, opt.event.name)) : undefined;

    // A new field goes right under the last component field, a new handler declaration under the last method.
    const fieldAt = scan.lastFieldEnd >= 0 ? scan.lastFieldEnd + 1 : scan.startLine + 1;
    const procAt = scan.lastMethodEnd >= 0 ? scan.lastMethodEnd + 1 : scan.sectionEnd;
    // Wiring an event on an EXISTING component: the field is already there, and the
    // handler may already be declared / implemented (then only the .dfm needs the link).
    const handlerDeclared = !!method && new RegExp('\\bprocedure\\s+' + method + '\\s*\\(', 'i').test(pas);
    const handlerImplemented = !!method && new RegExp('\\bprocedure\\s+' + form.name + '\\s*\\.\\s*' + method + '\\b', 'i').test(pas);
    const fieldText = opt.skipField ? '' : `    ${opt.componentName}: ${opt.def.className};${eol}`;
    const declText = method && opt.event && !handlerDeclared ? `    procedure ${method}(${opt.event.params});${eol}` : '';
    if (fieldText && declText && fieldAt === procAt) {
        edits.push({ offset: offs[fieldAt], text: fieldText + declText });
    } else {
        if (fieldText) { edits.push({ offset: offs[fieldAt], text: fieldText }); }
        if (declText) { edits.push({ offset: offs[procAt], text: declText }); }
    }

    // Implementation: before initialization / finalization, else before the final `end.`.
    if (method && opt.event && !handlerImplemented) {
        let implLine = lines.findIndex(l => /^\s*(initialization|finalization)\b/i.test(l));
        if (implLine < 0) {
            for (let i = lines.length - 1; i >= 0; i--) {
                if (/^\s*end\.\s*$/i.test(lines[i])) { implLine = i; break; }
            }
        }
        const impl = `procedure ${form.name}.${method}(${opt.event.params});${eol}begin${eol}  ${eol}end;${eol}${eol}`;
        edits.push({ offset: implLine >= 0 ? offs[implLine] : pas.length, text: implLine >= 0 ? impl : eol + impl });
    }

    // uses clause of the interface section.
    const implementationAt = pas.search(/^\s*implementation\b/im);
    const head = implementationAt >= 0 ? pas.slice(0, implementationAt) : pas;
    const uses = head.match(/\buses\b([^;]*);/i);
    if (uses && uses.index !== undefined && opt.def.unit) {
        // The class's own unit plus the ones the IDE would add; only VCL units take the Vcl. scope.
        edits.push(...usesEdits(pas, [opt.def.unit, ...(opt.def.extraUnits ?? [])]));
    }

    return { edits, handler: method ? `${form.name}.${method}` : undefined };
}

export interface InsertionPoints {
    formName: string;
    /** Where new component fields go (after the last IDE-managed field). */
    fieldAt: number;
    /** Where new handler declarations go (after the last handler of the IDE-managed section). */
    procAt: number;
    /** Where new handler implementations go (before initialization / end.). */
    implAt: number;
    eol: string;
}

/** Offsets of a form unit where fields, handler declarations and handler bodies are inserted. */
export function unitInsertionPoints(pas: string, formClass: string): InsertionPoints | undefined {
    const eol = pas.includes('\r\n') ? '\r\n' : '\n';
    const lines = pas.split(/\r?\n/);
    const offs = lineOffsets(pas);
    const scan = scanFormClass(pas, formClass);
    if (!scan) { return undefined; }
    const form = { name: scan.name };
    let implLine = lines.findIndex(l => /^\s*(initialization|finalization)\b/i.test(l));
    if (implLine < 0) {
        for (let i = lines.length - 1; i >= 0; i--) {
            if (/^\s*end\.\s*$/i.test(lines[i])) { implLine = i; break; }
        }
    }
    return {
        formName: form.name,
        fieldAt: offs[scan.lastFieldEnd >= 0 ? scan.lastFieldEnd + 1 : scan.startLine + 1],
        procAt: offs[scan.lastMethodEnd >= 0 ? scan.lastMethodEnd + 1 : scan.sectionEnd],
        implAt: implLine >= 0 ? offs[implLine] : pas.length,
        eol,
    };
}

const USES_WIDTH = 100;

/** Edits adding the given units to the interface `uses` (VCL units get the Vcl. scope when the unit already uses it). */
export function usesEdits(pas: string, units: string[]): TextEdit[] {
    const implementationAt = pas.search(/^\s*implementation\b/im);
    const head = implementationAt >= 0 ? pas.slice(0, implementationAt) : pas;
    const uses = head.match(/\buses\b([^;]*);/i);
    if (!uses || uses.index === undefined) { return []; }
    const dotted = /\bVcl\./i.test(uses[1]) || !/\bForms\b/i.test(uses[1]);
    const add: string[] = [];
    for (const unit of new Set(units.filter(Boolean))) {
        const present = new RegExp('\\b(?:Vcl\\.)?' + unit.replace(/\./g, '\\.') + '\\b', 'i').test(uses[1]);
        if (!present) { add.push((dotted && VCL_UNITS.has(unit.toLowerCase()) ? 'Vcl.' : '') + unit); }
    }
    if (add.length === 0) { return []; }
    const semicolon = uses.index + uses[0].length - 1;
    const end = pas.slice(0, semicolon).replace(/\s+$/, '').length;
    // Long lists go on to the next line, indented like the clause, instead of one line of several hundred columns.
    const eol = pas.includes('\r\n') ? '\r\n' : '\n';
    const lineStart = pas.lastIndexOf('\n', end - 1) + 1;
    const indent = /^\s*uses\b/i.test(pas.slice(lineStart, end)) ? '  ' : (/^[ \t]*/.exec(pas.slice(lineStart, end)) ?? [''])[0];
    let col = end - lineStart;
    let text = '';
    for (const u of add) {
        if (col + u.length + 3 > USES_WIDTH) { text += ',' + eol + indent + u; col = indent.length + u.length; }
        else { text += ', ' + u; col += u.length + 2; }
    }
    return [{ offset: end, text }];
}
