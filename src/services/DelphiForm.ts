/**
 * Delphi-style visual component insertion: adds a component (button, edit,
 * label…) to a form's .dfm text and keeps the .pas unit in sync (field in the
 * form class, event-handler declaration and empty implementation, uses clause).
 *
 * Everything here works on plain text and returns offset-based edits, so it is
 * unit-testable without VS Code.
 */

export interface TextEdit {
    /** Offset in the original text where `text` is inserted. */
    offset: number;
    text: string;
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
    /** Visual size; undefined for non-visual components (TTimer). */
    width?: number;
    height?: number;
    /** Extra DFM property lines (without indentation). */
    props: string[];
    /** Whether the component takes a TabOrder. */
    tabOrder: boolean;
    events: EventDef[];
}

const SENDER = 'Sender: TObject';
const ev = (name: string, params = SENDER): EventDef => ({ name, params });
const KEY_EVENTS = [
    ev('OnKeyPress', `${SENDER}; var Key: Char`),
    ev('OnKeyDown', `${SENDER}; var Key: Word; Shift: TShiftState`),
];

export const COMPONENTS: ComponentDef[] = [
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
];

/** Applies offset edits (all expressed against the original text). */
export function applyTextEdits(text: string, edits: TextEdit[]): string {
    const sorted = [...edits].sort((a, b) => b.offset - a.offset);
    let out = text;
    for (const e of sorted) { out = out.slice(0, e.offset) + e.text + out.slice(e.offset); }
    return out;
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

export function handlerName(componentName: string, eventName: string): string {
    return componentName + eventName.replace(/^On/, '');
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

export interface UnitEditOptions {
    formClass: string;
    componentName: string;
    def: ComponentDef;
    event?: EventDef;
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
    const form = findFormClass(pas, opt.formClass);
    if (!form) { return undefined; }

    // Class body bounds.
    let endLine = -1;
    for (let i = form.startLine + 1; i < lines.length; i++) {
        if (/^\s*end\s*;/i.test(lines[i])) { endLine = i; break; }
    }
    if (endLine < 0) { return undefined; }
    let sectionEnd = endLine;
    for (let i = form.startLine + 1; i < endLine; i++) {
        if (/^\s*(strict\s+)?(private|protected|public|published)\b/i.test(lines[i])) { sectionEnd = i; break; }
    }

    const edits: TextEdit[] = [];
    const method = opt.event ? handlerName(opt.componentName, opt.event.name) : undefined;

    let lastField = -1;
    let lastProc = -1;
    for (let i = form.startLine + 1; i < sectionEnd; i++) {
        if (/^\s*\w+\s*:\s*[\w.]+\s*;/.test(lines[i])) { lastField = i; }
        if (/^\s*procedure\s+\w+\s*\(.*\)\s*;/i.test(lines[i])) { lastProc = i; }
    }
    const fieldAt = lastField >= 0 ? lastField + 1 : form.startLine + 1;
    const procAt = lastProc >= 0 ? lastProc + 1 : sectionEnd;
    const fieldText = `    ${opt.componentName}: ${opt.def.className};${eol}`;
    const declText = method && opt.event ? `    procedure ${method}(${opt.event.params});${eol}` : '';
    if (declText && fieldAt === procAt) {
        edits.push({ offset: offs[fieldAt], text: fieldText + declText });
    } else {
        edits.push({ offset: offs[fieldAt], text: fieldText });
        if (declText) { edits.push({ offset: offs[procAt], text: declText }); }
    }

    // Implementation: before initialization / finalization, else before the final `end.`.
    if (method && opt.event) {
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
    if (uses && uses.index !== undefined) {
        const dotted = /\bVcl\./i.test(uses[1]) || !/\bForms\b/i.test(uses[1]);
        const unitName = (dotted ? 'Vcl.' : '') + opt.def.unit;
        const present = new RegExp('\\b(?:Vcl\\.)?' + opt.def.unit + '\\b', 'i').test(uses[1]);
        if (!present) {
            const semicolon = uses.index + uses[0].length - 1;
            const before = pas.slice(0, semicolon).replace(/\s+$/, '');
            edits.push({ offset: before.length, text: `, ${unitName}` });
        }
    }

    return { edits, handler: method ? `${form.name}.${method}` : undefined };
}
