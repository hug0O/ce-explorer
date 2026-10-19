/**
 * Form generation from a list of fields (or a class), and "change the class
 * of a component" keeping the compatible properties and events.
 */
import { COMPONENTS, ComponentDef, EVENT_PROP_RE, TextEdit, existingNames, resolveComponentDef, unitInsertionPoints, usesEdits } from './DelphiForm';
import { findNode, insertIntoNode, parseDfmTree } from './DelphiLayout';
import { lineStartOffsets, setProp } from '../utils/dfmEdit';
import { clientSize } from './DelphiAlign';
import { readUnit } from './DelphiCheck';

/* ───────────────────────── form from fields ───────────────────────── */

export type FieldKind = 'edit' | 'number' | 'check' | 'date' | 'memo' | 'combo';

export interface FieldSpec {
    label: string;
    ident: string;
    kind: FieldKind;
}

const KIND_ALIASES: Record<string, FieldKind> = {
    string: 'edit', text: 'edit', str: 'edit', varchar: 'edit', varchar2: 'edit', char: 'edit',
    int: 'number', integer: 'number', number: 'number', double: 'number', float: 'number', currency: 'number', extended: 'number', numeric: 'number', real: 'number', int64: 'number', smallint: 'number', word: 'number', cardinal: 'number',
    bool: 'check', boolean: 'check', check: 'check', checkbox: 'check',
    date: 'date', datetime: 'date', tdatetime: 'date', time: 'date', tdate: 'date', timestamp: 'date',
    memo: 'memo', notes: 'memo', comment: 'memo', tstrings: 'memo', tstringlist: 'memo',
    list: 'combo', combo: 'combo', choice: 'combo', enum: 'combo',
};

const KIND_PREFIX: Record<FieldKind, { prefix: string; className: string }> = {
    edit: { prefix: 'edt', className: 'TEdit' },
    number: { prefix: 'edt', className: 'TEdit' },
    check: { prefix: 'chk', className: 'TCheckBox' },
    date: { prefix: 'dtp', className: 'TDateTimePicker' },
    memo: { prefix: 'mem', className: 'TMemo' },
    combo: { prefix: 'cbo', className: 'TComboBox' },
};

function identOf(label: string): string {
    const base = label.normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^A-Za-z0-9]+/).filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    return /^[A-Za-z]/.test(base) ? base : 'Field' + base;
}

/** "Nom:string, Age:integer, Actif:boolean, Date de naissance:date, Notes:memo" → field specs. */
export function parseFieldList(input: string): FieldSpec[] {
    return input.split(/[,;\n]/).map(s => s.trim()).filter(Boolean).map(seg => {
        const [label, type] = seg.split(':').map(s => s.trim());
        const kind = KIND_ALIASES[(type ?? 'string').toLowerCase()] ?? 'edit';
        return { label, ident: identOf(label), kind };
    });
}

export type GenerateResult = { error: string } | {
    dfmEdit: TextEdit;
    /** Container Height / ClientHeight raised to hold the new rows. */
    extraDfmEdits: TextEdit[];
    grewContainer?: { name: string; from: number; to: number };
    pasEdits: TextEdit[];
    names: string[];
};

/** Labels in a left column, inputs aligned in a right column, one row per field, inside `containerName`. */
export function generateFormFields(pas: string, dfm: string, fields: FieldSpec[], containerName?: string, unitOf: (c: string) => string = c => resolveComponentDef(c).unit): GenerateResult {
    const root = parseDfmTree(dfm);
    if (!root) { return { error: 'The .dfm is not in text format.' }; }
    const container = containerName ? findNode(root, containerName) : root;
    if (!container) { return { error: `Container "${containerName}" not found.` }; }
    if (fields.length === 0) { return { error: 'Enter at least one field, e.g.  Nom:string, Age:integer, Actif:boolean' }; }
    const unit = readUnit(pas, root.className);
    const points = unit ? unitInsertionPoints(pas, unit.formName) : undefined;
    if (!unit || !points) { return { error: `The form class ${root.className} was not found in the unit.` }; }

    const used = existingNames(dfm, pas);
    const unique = (base: string): string => {
        let name = base;
        for (let n = 2; used.has(name.toLowerCase()); n++) { name = base + n; }
        used.add(name.toLowerCase());
        return name;
    };

    const margin = container.depth === 0 ? 16 : 8;
    const free = container.children.filter(n => n.align === undefined && n.top !== undefined && n.height !== undefined);
    let y = free.length ? Math.max(...free.map(n => n.top! + n.height!)) + 8 : margin;
    const labelW = Math.max(...fields.filter(f => f.kind !== 'check').map(f => f.label.length), 4) * 7 + 8;
    const inputX = margin + labelW + 8;
    const roomW = clientSize(container)?.w;
    // Inputs shrink to fit the container's width (never below 80px).
    const fit = (w: number): number => (roomW ? Math.max(80, Math.min(w, roomW - inputX - margin)) : w);
    const eol = dfm.includes('\r\n') ? '\r\n' : '\n';
    let tab = container.children.reduce((m, c) => Math.max(m, c.props['TabOrder'] !== undefined ? Number(c.props['TabOrder']) + 1 : 0), 0);

    const objects: string[] = [];
    const comps: { name: string; className: string }[] = [];
    const pad = '  '.repeat(container.depth + 1);
    const place = (def: ComponentDef, name: string, left: number, top: number, props: string[], width?: number, height?: number): void => {
        const inner = pad + '  ';
        const lines = [`${pad}object ${name}: ${def.className}`, `${inner}Left = ${left}`, `${inner}Top = ${top}`];
        const w = width ?? def.width;
        const h = height ?? def.height;
        if (w !== undefined) { lines.push(`${inner}Width = ${w}`); }
        if (h !== undefined) { lines.push(`${inner}Height = ${h}`); }
        props.forEach(p => lines.push(inner + p));
        if (def.tabOrder) { lines.push(`${inner}TabOrder = ${tab++}`); }
        lines.push(`${pad}end`);
        objects.push(lines.join(eol) + eol);
        comps.push({ name, className: def.className });
    };

    for (const f of fields) {
        const kind = KIND_PREFIX[f.kind];
        const def = resolveComponentDef(kind.className);
        const name = unique(kind.prefix + f.ident);
        if (f.kind === 'check') {
            place(def, name, inputX, y, [`Caption = '${f.label.replace(/'/g, "''")}'`], fit(def.width ?? 97));
            y += (def.height ?? 17) + 15;
            continue;
        }
        const lblDef = resolveComponentDef('TLabel');
        const lblName = unique('lbl' + f.ident);
        const h = def.height ?? 23;
        place(lblDef, lblName, margin, y + Math.max(0, Math.round((h - (lblDef.height ?? 15)) / 2)), [`Caption = '${f.label.replace(/'/g, "''")}'`], labelW - 8);
        const extra = f.kind === 'number' ? ['NumbersOnly = True', "Text = ''"] : f.kind === 'edit' ? ["Text = ''"] : f.kind === 'combo' ? ["Text = ''"] : [];
        place(def, name, inputX, y, extra, fit(f.kind === 'memo' ? 240 : f.kind === 'date' ? 130 : 200), f.kind === 'memo' ? 65 : (f.kind === 'date' ? 23 : 23));
        y += (f.kind === 'memo' ? 65 : 23) + 9;
    }

    const dfmEdit = insertIntoNode(dfm, container, objects.join(''));
    const extraDfmEdits: TextEdit[] = [];
    let grewContainer: { name: string; from: number; to: number } | undefined;
    const room = clientSize(container);
    const needed = y - 9 + margin;
    if (room && needed > room.h && container.align !== 'alClient') {
        const prop = container.props['ClientHeight'] !== undefined ? 'ClientHeight' : container.props['Height'] !== undefined ? 'Height' : undefined;
        if (prop) {
            extraDfmEdits.push(setProp(dfm, container, prop, String(needed)));
            grewContainer = { name: container.name, from: room.h, to: needed };
        }
    }
    const pasEdits: TextEdit[] = [{ offset: points.fieldAt, text: comps.map(c => `    ${c.name}: ${c.className};${points.eol}`).join('') }];
    pasEdits.push(...usesEdits(pas, comps.map(c => unitOf(c.className))));
    return { dfmEdit, extraDfmEdits, grewContainer, pasEdits, names: comps.map(c => c.name) };
}

/** `Nom:string, …` text from the fields of a class (Pascal types mapped to input kinds). */
export function fieldListFromMembers(members: { name: string; type?: string }[]): string {
    const kindOf = (t: string | undefined): string => {
        const k = (t ?? 'string').toLowerCase().replace(/^t/, '');
        if (/^(string|ansistring|widestring|unicodestring|char)$/.test(k) || /string$/.test(k)) { return 'string'; }
        if (/bool/.test(k)) { return 'boolean'; }
        if (/date|time/.test(k)) { return 'date'; }
        if (/^(integer|int64|smallint|word|cardinal|byte|longint|double|single|currency|extended|real)$/.test(k)) { return 'integer'; }
        if (/list|strings/.test(k)) { return 'memo'; }
        return 'string';
    };
    return members.map(m => `${m.name.replace(/^F(?=[A-Z])/, '')}:${kindOf(m.type)}`).join(', ');
}

/* ───────────────────────── change class ───────────────────────── */

const COMMON_PROPS = [
    'Left', 'Top', 'Width', 'Height', 'Align', 'Anchors', 'Visible', 'Enabled', 'Hint', 'ShowHint', 'TabOrder', 'TabStop', 'ParentFont', 'Color',
    'ParentColor', 'ParentShowHint', 'PopupMenu', 'Cursor', 'AlignWithMargins', 'Tag', 'DoubleBuffered', 'BiDiMode', 'ParentBiDiMode', 'StyleElements',
    'ParentDoubleBuffered', 'DragMode', 'DragCursor', 'HelpContext', 'HelpKeyword', 'HelpType', 'ExplicitLeft', 'ExplicitTop', 'ExplicitWidth', 'ExplicitHeight',
];
const COMMON_PREFIXES = ['Font.', 'Constraints.', 'Margins.', 'Padding.', 'Touch.'];
const CAPTION = ['Caption', 'Default', 'Cancel', 'ModalResult', 'WordWrap', 'ImageIndex', 'Images', 'Action'];
const TEXTBOX = ['Text', 'MaxLength', 'ReadOnly', 'CharCase', 'TextHint', 'AutoSelect', 'BorderStyle', 'HideSelection', 'PasswordChar', 'NumbersOnly', 'Alignment', 'OEMConvert', 'AutoSize'];
const LISTBOX = ['Items', 'ItemIndex', 'ItemHeight', 'MultiSelect', 'Sorted', 'Style', 'BorderStyle', 'ExtendedSelect', 'IntegralHeight', 'TabWidth', 'ScrollWidth'];

const SPECIFIC: Record<string, string[]> = {
    tbutton: [...CAPTION, 'ElevationRequired', 'CommandLinkHint', 'Style', 'DropDownMenu'],
    tbitbtn: [...CAPTION, 'Kind', 'Glyph', 'Layout', 'Margin', 'Spacing', 'NumGlyphs', 'Style'],
    tspeedbutton: ['Caption', 'Flat', 'Glyph', 'Down', 'GroupIndex', 'AllowAllUp', 'Layout', 'Margin', 'Spacing', 'ImageIndex', 'Images'],
    tedit: TEXTBOX,
    tlabelededit: [...TEXTBOX, 'EditLabel.', 'LabelPosition', 'LabelSpacing'],
    tmaskedit: [...TEXTBOX, 'EditMask'],
    tmemo: ['Lines', 'MaxLength', 'ReadOnly', 'ScrollBars', 'WordWrap', 'WantReturns', 'WantTabs', 'Alignment', 'CharCase', 'TextHint', 'BorderStyle', 'HideSelection'],
    trichedit: ['Lines', 'ReadOnly', 'ScrollBars', 'WordWrap', 'WantReturns', 'WantTabs', 'PlainText', 'HideScrollBars', 'MaxLength', 'BorderStyle'],
    tlabel: ['Caption', 'Alignment', 'AutoSize', 'Layout', 'WordWrap', 'Transparent', 'FocusControl', 'EllipsisPosition', 'ShowAccelChar'],
    tcheckbox: ['Caption', 'Checked', 'State', 'AllowGrayed', 'Alignment', 'WordWrap', 'Action'],
    tradiobutton: ['Caption', 'Checked', 'Alignment', 'WordWrap'],
    tcombobox: [...TEXTBOX, ...LISTBOX, 'DropDownCount', 'AutoComplete'],
    tlistbox: LISTBOX,
    tchecklistbox: [...LISTBOX, 'Checked'],
    tpanel: ['Caption', 'Alignment', 'BevelInner', 'BevelOuter', 'BevelWidth', 'BorderStyle', 'BorderWidth', 'FullRepaint', 'Locked', 'ParentBackground', 'ShowCaption', 'VerticalAlignment'],
    tgroupbox: ['Caption', 'ParentBackground'],
    tscrollbox: ['BorderStyle', 'HorzScrollBar.', 'VertScrollBar.'],
    tdatetimepicker: ['Date', 'Time', 'Kind', 'Format', 'DateFormat', 'ShowCheckbox', 'Checked', 'MinDate', 'MaxDate'],
    timage: ['Picture.', 'Stretch', 'Proportional', 'Center', 'Transparent', 'AutoSize'],
};

const KNOWN_EVENTS = new Map(COMPONENTS.map(c => [c.className.toLowerCase(), new Set(c.events.map(e => e.name))]));

function propAllowed(prop: string, className: string): boolean {
    if (COMMON_PROPS.includes(prop) || COMMON_PREFIXES.some(p => prop.startsWith(p))) { return true; }
    return (SPECIFIC[className.toLowerCase()] ?? []).some(a => a === prop || (a.endsWith('.') && prop.startsWith(a)));
}

export type ChangeClassResult = { error: string } | {
    dfmEdits: TextEdit[];
    pasEdits: TextEdit[];
    droppedProps: string[];
    droppedEvents: string[];
    /** The target (or source) class is not in the catalog: kept properties are unchecked. */
    unchecked: boolean;
};

function propBlockEnd(lines: string[], start: number): number {
    const first = lines[start].replace(/^[^=]*=\s*/, '').trim();
    const close = first.startsWith('(') ? ')' : first.startsWith('<') ? '>' : first.startsWith('{') ? '}' : '';
    if (!close || first.endsWith(close)) { return start; }
    for (let i = start + 1; i < lines.length; i++) { if (lines[i].trimEnd().endsWith(close)) { return i; } }
    return start;
}

export function planChangeClass(pas: string, dfm: string, name: string, newClass: string, unit?: string): ChangeClassResult {
    const root = parseDfmTree(dfm);
    if (!root) { return { error: 'The .dfm is not in text format.' }; }
    const node = findNode(root, name);
    if (!node || node.depth === 0) { return { error: `Component "${name}" not found.` }; }
    if (!/^[A-Za-z_][\w.]*$/.test(newClass)) { return { error: `"${newClass}" is not a valid class name.` }; }
    if (newClass.toLowerCase() === node.className.toLowerCase()) { return { error: `${name} is already a ${node.className}.` }; }

    const lines = dfm.split('\n');
    const starts = lineStartOffsets(dfm);
    // Only classes with a property table are verified; third-party families (DevExpress, TMS…) are kept as they are.
    const known = (c: string): boolean => !!SPECIFIC[c.toLowerCase()];
    const unchecked = !known(newClass) || !known(node.className);
    const edits: TextEdit[] = [];
    const droppedProps: string[] = [];
    const droppedEvents: string[] = [];

    // `object Name: TOld` → `object Name: TNew`
    const head = lines[node.startLine];
    const at = head.indexOf(node.className, head.indexOf(':'));
    edits.push({ offset: starts[node.startLine] + at, length: node.className.length, text: newClass });

    if (!unchecked) {
        const events = KNOWN_EVENTS.get(newClass.toLowerCase());
        for (const [prop, line] of Object.entries(node.propLines)) {
            const isEvent = EVENT_PROP_RE.test(prop);
            const keep = isEvent ? (events ? events.has(prop) : true) : propAllowed(prop, newClass);
            if (keep) { continue; }
            const end = propBlockEnd(lines, line);
            edits.push({ offset: starts[line], length: (starts[end + 1] ?? dfm.length) - starts[line], text: '' });
            (isEvent ? droppedEvents : droppedProps).push(prop);
        }
    }

    const pasEdits: TextEdit[] = [];
    const pasLines = pas.split('\n');
    const pasStarts = lineStartOffsets(pas);
    const re = new RegExp('^(\\s*' + name.replace(/[$]/g, '\\$') + '\\s*:\\s*)' + node.className.replace(/\./g, '\\.') + '(\\s*;)', 'i');
    const idx = pasLines.findIndex(l => re.test(l));
    if (idx >= 0) {
        const m = pasLines[idx].match(re)!;
        pasEdits.push({ offset: pasStarts[idx] + m[1].length, length: node.className.length, text: newClass });
    }
    const def = resolveComponentDef(newClass, unit);
    pasEdits.push(...usesEdits(pas, [def.unit]));
    return { dfmEdits: edits, pasEdits, droppedProps, droppedEvents, unchecked };
}
