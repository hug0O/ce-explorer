/**
 * DFM structure and layout engine: parses the component tree of a text .dfm
 * (parents, positions, alignment) and computes a clean position for a new
 * component relative to an existing one (right of / below / left of / above),
 * inside any container (form, panel, group box…).
 */
import {
    ComponentDef, TextEdit, buildUnitEdits, eventDefOf, existingNames, handlerName, isValidIdentifier, resolveComponentDef,
} from './DelphiForm';
import { isTileChild, isTileGroup, isTileHost } from './DelphiTiles';
import { isGridChild, isGridHost, isGridView } from './DelphiGrid';
import { nestedRuleOf, onlyHolds } from './DelphiNested';

export interface DfmNode {
    name: string;
    className: string;
    /** 0 for the form itself. */
    depth: number;
    startLine: number;
    endLine: number;
    props: Record<string, string>;
    /** Line index of each direct property (to rewrite its value in place). */
    propLines: Record<string, number>;
    children: DfmNode[];
    parent?: DfmNode;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    /** Align property (alTop, alClient…); undefined or alNone when positioned by Left/Top. */
    align?: string;
}

// Standard and third-party containers (TcxGroupBox, TAdvPanel, TRzPanel, TJvPageControl, TsPanel…).
const CONTAINER_RE = /(Panel|GroupBox|ScrollBox|TabSheet|Frame|PageControl|Form|Pnl|Pane|Group|Container|Page|Sheet|Pager|LayoutControl|LayoutGroup|Ribbon|RibbonTab|NavBar|DetailSite)$/i;
// Names that end like a container but hold items, not child controls.
const NOT_CONTAINER_RE = /(RadioGroup|CheckGroup|ButtonGroup|CheckBox|ComboBox|ListBox|CheckListBox)$/i;

export function isContainer(node: DfmNode): boolean {
    if (node.depth === 0) { return true; }
    // A tile control or a grid holds parts that it places itself (tiles, levels, views, columns): no control can be dropped into it.
    if (isTileHost(node.className) || isTileChild(node.className) || isGridHost(node.className) || isGridChild(node.className)) { return false; }
    return node.children.length > 0 || (CONTAINER_RE.test(node.className) && !NOT_CONTAINER_RE.test(node.className));
}

/** Parses the component hierarchy of a text DFM. Returns the form (root) node, or undefined. */
export function parseDfmTree(dfm: string): DfmNode | undefined {
    const lines = dfm.split(/\r?\n/);
    const stack: DfmNode[] = [];
    let root: DfmNode | undefined;
    // Multi-line property values (string lists, collections, binary data) contain
    // `end`, `item` and `object`-looking lines that must not alter the hierarchy.
    let skipUntil: RegExp | undefined;
    let collectionDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (skipUntil) {
            if (skipUntil.test(line)) { skipUntil = undefined; }
            continue;
        }
        if (collectionDepth > 0) {
            if (/=\s*<\s*$/.test(line)) { collectionDepth++; }
            if (/>\s*$/.test(line) && !/=\s*<\s*$/.test(line)) { collectionDepth--; }
            continue;
        }

        const obj = line.match(/^(\s*)(?:object|inherited|inline)\s+(\w+)\s*:\s*(\w+)/i);
        if (obj) {
            const node: DfmNode = {
                name: obj[2], className: obj[3], depth: stack.length, startLine: i, endLine: i,
                props: {}, propLines: {}, children: [], parent: stack[stack.length - 1],
            };
            if (node.parent) { node.parent.children.push(node); } else if (!root) { root = node; }
            stack.push(node);
            continue;
        }
        if (/^\s*end\s*$/i.test(line)) {
            const node = stack.pop();
            if (node) { node.endLine = i; }
            continue;
        }
        const top = stack[stack.length - 1];
        if (!top) { continue; }
        const prop = line.match(/^(\s*)([A-Za-z_][\w.]*)\s*=\s*(.*)$/);
        if (!prop) { continue; }
        const [, indent, name, value] = prop;
        if (/^\($/.test(value.trim()) || (value.trim().startsWith('(') && !value.trim().endsWith(')'))) { skipUntil = /\)\s*$/; }
        else if (value.trim().startsWith('{') && !value.trim().endsWith('}')) { skipUntil = /\}\s*$/; }
        else if (value.trim().endsWith('<')) { collectionDepth = 1; }
        if (indent.length === (top.depth + 1) * 2) { top.props[name] = value.trim(); top.propLines[name] = i; }
    }

    const num = (v: string | undefined) => (v !== undefined && /^-?\d+$/.test(v) ? Number(v) : undefined);
    const fill = (n: DfmNode): void => {
        n.left = num(n.props['Left']);
        n.top = num(n.props['Top']);
        n.width = num(n.props['Width']);
        n.height = num(n.props['Height']);
        const a = n.props['Align'];
        n.align = a && a !== 'alNone' ? a : undefined;
        n.children.forEach(fill);
    };
    if (root) { fill(root); }
    return root;
}

export function findNode(root: DfmNode, name: string): DfmNode | undefined {
    if (root.name.toLowerCase() === name.toLowerCase()) { return root; }
    for (const c of root.children) {
        const hit = findNode(c, name);
        if (hit) { return hit; }
    }
    return undefined;
}

/** Containers that can receive a new child, depth-first, with a display label. */
export function listContainers(root: DfmNode): { node: DfmNode; label: string }[] {
    const out: { node: DfmNode; label: string }[] = [];
    const walk = (n: DfmNode): void => {
        if (isContainer(n) || isTileHost(n.className) || isGridHost(n.className) || isGridView(n.className)) { out.push({ node: n, label: `${'  '.repeat(n.depth)}${n.name}: ${n.className}` }); }
        n.children.forEach(walk);
    };
    walk(root);
    return out;
}

export type Side = 'auto' | 'right' | 'below' | 'left' | 'above';

export interface Placement {
    left: number;
    top: number;
    /** Copied from the reference when it is docked (alTop…), in which case Left/Top are ignored by Delphi. */
    align?: string;
}

const MARGIN = 8;

/** Whether a node is positioned by Left/Top (has coordinates and is not docked). */
function isFree(n: DfmNode): boolean {
    return n.align === undefined && n.left !== undefined && n.top !== undefined;
}

/**
 * Position of a new component of size w × h inside `parent`.
 * - right / left: placed beside `ref`, vertically centred on it;
 * - below / above: placed under / over `ref`, left edges aligned;
 * - auto (or no reference): under the lowest free sibling, left edges aligned
 *   with the first one, or in the top-left corner of an empty container.
 * A docked reference (alTop, alLeft…) makes the new component docked the same way.
 */
export function computePlacement(w: number, h: number, parent: DfmNode, ref: DfmNode | undefined, side: Side, gap = MARGIN): Placement {
    if (ref && ref.align && ref.align !== 'alClient') {
        const along = ref.align === 'alTop' || ref.align === 'alBottom' ? 'top' : 'left';
        const edge = along === 'top' ? (ref.top ?? 0) + (ref.height ?? 0) : (ref.left ?? 0) + (ref.width ?? 0);
        return { left: along === 'left' ? edge : 0, top: along === 'top' ? edge : 0, align: ref.align };
    }

    const free = parent.children.filter(isFree);
    if (ref && isFree(ref) && side !== 'auto') {
        const rl = ref.left!, rt = ref.top!, rw = ref.width ?? w, rh = ref.height ?? h;
        const centredTop = rt + Math.round((rh - h) / 2);
        switch (side) {
            case 'right': return { left: rl + rw + gap, top: centredTop };
            case 'left': return { left: Math.max(MARGIN, rl - w - gap), top: centredTop };
            case 'below': return { left: rl, top: rt + rh + gap };
            case 'above': return { left: rl, top: Math.max(MARGIN, rt - h - gap) };
        }
    }

    const origin = parent.depth === 0 ? 16 : MARGIN;
    if (free.length === 0) { return { left: origin, top: origin }; }
    const bottom = Math.max(...free.map(n => n.top! + (n.height ?? 0)));
    const left = Math.min(...free.map(n => n.left!));
    return { left, top: bottom + gap };
}

/** DFM text of a new component as a child of `parent` (indented accordingly). */
export function buildComponentObject(
    def: ComponentDef,
    name: string,
    handler: { event: string; method: string } | undefined,
    place: Placement,
    parent: DfmNode,
    eol: string,
): string {
    const pad = '  '.repeat(parent.depth + 1);
    const inner = pad + '  ';
    const tabIndex = parent.children.reduce((max, c) => Math.max(max, c.props['TabOrder'] !== undefined ? Number(c.props['TabOrder']) + 1 : 0), 0);
    const lines: string[] = [`${pad}object ${name}: ${def.className}`];
    if (!def.nested) {
        lines.push(`${inner}Left = ${place.left}`, `${inner}Top = ${place.top}`);
        if (def.width !== undefined) { lines.push(`${inner}Width = ${def.width}`); }
        if (def.height !== undefined) { lines.push(`${inner}Height = ${def.height}`); }
        if (place.align) { lines.push(`${inner}Align = ${place.align}`); }
    }
    // %INDEX%: rank among the siblings of the same class; %LASTGROUP%: index of the last tile group. A line starting with `?` is dropped when its value is 0.
    const same = parent.children.filter(c => c.className === def.className).length;
    for (const raw of def.props) {
        const optional = raw.startsWith('?');
        const line = (optional ? raw.slice(1) : raw).replace(/%NAME%/g, name).replace(/%INDEX%/g, String(same)).replace(/%LASTGROUP%/g, String(Math.max(0, parent.children.filter(c => isTileGroup(c.className)).length - 1)));
        if (optional && /=s*0s*$/.test(line)) { continue; }
        lines.push(inner + line);
    }
    if (def.tabOrder && !def.nested) { lines.push(`${inner}TabOrder = ${tabIndex}`); }
    if (handler) { lines.push(`${inner}${handler.event} = ${handler.method}`); }
    lines.push(`${pad}end`);
    return lines.join(eol) + eol;
}

/** Edit inserting `objectText` as the last child of `parent`, i.e. just before its closing `end`. */
export function insertIntoNode(dfm: string, parent: DfmNode, objectText: string): TextEdit {
    let offset = 0;
    let line = 0;
    while (line < parent.endLine) {
        const next = dfm.indexOf('\n', offset);
        if (next < 0) { break; }
        offset = next + 1;
        line++;
    }
    return { offset, text: objectText };
}

export interface AddComponentRequest {
    className: string;
    /** Unit to add to `uses`; blank = catalog default (none for unknown classes). */
    unit?: string;
    name: string;
    /** Event to implement (e.g. OnClick); blank = field only. */
    eventName?: string;
    /** Container receiving the component; defaults to the form. */
    parentName?: string;
    /** Existing component to place the new one against; defaults to the lowest free sibling. */
    refName?: string;
    side: Side;
    /** Pixels between the new component and its reference (default 8). */
    gap?: number;
    /** Pre-resolved definition (custom / learned third-party component); default: catalog or generic. */
    def?: ComponentDef;
    /** The field is already declared in the unit (added by hand): only wire the .dfm and the handler. */
    fieldExists?: boolean;
    /** Exact position inside the container (the designer's drop point); overrides the relative placement. */
    position?: { left: number; top: number };
}

export type AddComponentPlan =
    | { error: string }
    | {
        pasEdits: TextEdit[];
        dfmEdit: TextEdit;
        /** `TForm1.Button1Click` when a handler was generated. */
        handler?: string;
        placement: Placement;
        def: ComponentDef;
    };

/** Everything needed to drop a component on a form, as offset edits for the .pas and the .dfm. */
export function planAddComponent(pas: string, dfm: string, req: AddComponentRequest): AddComponentPlan {
    const root = parseDfmTree(dfm);
    if (!root) { return { error: 'This .dfm is not in text format.' }; }
    if (!isValidIdentifier(req.name)) { return { error: `"${req.name}" is not a valid Pascal identifier.` }; }
    const used = existingNames(dfm, pas);
    if (req.fieldExists) { used.delete(req.name.toLowerCase()); for (const m of dfm.matchAll(/^\s*(?:object|inherited|inline)\s+(\w+)\s*:/gim)) { used.add(m[1].toLowerCase()); } }
    if (used.has(req.name.toLowerCase())) { return { error: `The name "${req.name}" is already used on this form.` }; }
    if (!/^[A-Za-z_][\w.]*$/.test(req.className)) { return { error: `"${req.className}" is not a valid class name.` }; }

    const parent = req.parentName ? findNode(root, req.parentName) : root;
    if (!parent) { return { error: `Container "${req.parentName}" not found in the .dfm.` }; }
    let ref: DfmNode | undefined;
    if (req.refName) {
        ref = findNode(root, req.refName);
        if (!ref) { return { error: `Component "${req.refName}" not found in the .dfm.` }; }
    }

    const def = req.def ?? resolveComponentDef(req.className, req.unit);
    const event = req.eventName && req.eventName.trim() ? eventDefOf(def, req.eventName.trim()) : undefined;
    if (event && !/^On\w+$/.test(event.name)) { return { error: `"${event.name}" is not an event name (expected OnXxx).` }; }
    const method = event ? handlerName(req.name, event.name) : undefined;

    // A reference in another container: position relative to it inside ITS container.
    const container = ref && ref.parent && ref.parent !== parent && !req.parentName ? ref.parent : parent;
    // Tiles, groups, detail pages, grid levels, views and columns live in their own host, and a host holds nothing else.
    const rule = nestedRuleOf(req.className);
    if (rule && !rule.host(container)) { return { error: `${req.className} goes inside ${rule.what}: pick one as the container.` }; }
    const only = rule ? undefined : onlyHolds(container);
    if (only) { return { error: `${only}: pick another container for ${req.className}.` }; }
    const place = req.position ? { left: req.position.left, top: req.position.top } : computePlacement(def.width ?? 75, def.height ?? 25, container, ref && ref.parent === container ? ref : undefined, req.side, req.gap ?? MARGIN);

    const unit = buildUnitEdits(pas, { formClass: root.className, componentName: req.name, def, event, skipField: req.fieldExists });
    if (!unit) { return { error: `Could not find the form class ${root.className} in the unit.` }; }
    const object = buildComponentObject(def, req.name, event && method ? { event: event.name, method } : undefined, place, container, dfm.includes('\r\n') ? '\r\n' : '\n');
    return { pasEdits: unit.edits, dfmEdit: insertIntoNode(dfm, container, object), handler: unit.handler, placement: place, def };
}
