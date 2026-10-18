/**
 * Third-party (non-VCL) components: DevExpress, TMS, JVCL, Raize, FireDAC
 * visual controls… Their definitions come, in order of priority, from
 * 1. the user's `mmx.delphi.customComponents` setting,
 * 2. what the project's own .dfm files already do with that class
 *    (size, events wired, caption, tab stop), and
 * 3. the unit remembered from a previous use,
 * on top of the VCL catalog / a generic control.
 */
import { ComponentDef, EVENT_PROP_RE, EventDef, eventDefFor, resolveComponentDef } from './DelphiForm';
import { parseDfmTree, DfmNode } from './DelphiLayout';

export interface CustomComponent {
    className: string;
    unit?: string;
    width?: number;
    height?: number;
    namePrefix?: string;
    events?: string[];
    props?: string[];
    tabOrder?: boolean;
}

/** Keeps well-formed entries of the user setting; anything else is ignored. */
export function parseCustomComponents(raw: unknown): CustomComponent[] {
    if (!Array.isArray(raw)) { return []; }
    const out: CustomComponent[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') { continue; }
        const o = item as Record<string, unknown>;
        if (typeof o.className !== 'string' || !/^[A-Za-z_][\w.]*$/.test(o.className)) { continue; }
        const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 5000 ? v : undefined);
        out.push({
            className: o.className,
            unit: typeof o.unit === 'string' ? o.unit : undefined,
            width: num(o.width),
            height: num(o.height),
            namePrefix: typeof o.namePrefix === 'string' && /^[A-Za-z_]\w*$/.test(o.namePrefix) ? o.namePrefix : undefined,
            events: Array.isArray(o.events) ? o.events.filter((e): e is string => typeof e === 'string' && EVENT_PROP_RE.test(e)) : undefined,
            props: Array.isArray(o.props) ? o.props.filter((p): p is string => typeof p === 'string' && /^[A-Za-z_][\w.]*\s*=/.test(p)) : undefined,
            tabOrder: typeof o.tabOrder === 'boolean' ? o.tabOrder : undefined,
        });
    }
    return out;
}

export interface LearnedComponent {
    width?: number;
    height?: number;
    events: string[];
    props: string[];
    tabOrder: boolean;
    instances: number;
}

function walk(node: DfmNode, visit: (n: DfmNode) => void): void {
    visit(node);
    node.children.forEach(c => walk(c, visit));
}

/** What the project's .dfm files tell about `className`: size of the first instance, events ever wired, caption/tab stop. */
export function learnFromDfmTexts(className: string, texts: string[]): LearnedComponent | undefined {
    const events = new Set<string>();
    let width: number | undefined;
    let height: number | undefined;
    let caption = false;
    let tab = false;
    let instances = 0;
    for (const text of texts) {
        const root = parseDfmTree(text);
        if (!root) { continue; }
        walk(root, n => {
            if (n.depth === 0 || n.className.toLowerCase() !== className.toLowerCase()) { return; }
            instances++;
            if (width === undefined && n.width !== undefined && n.height !== undefined) { width = n.width; height = n.height; }
            Object.keys(n.props).filter(k => EVENT_PROP_RE.test(k)).forEach(k => events.add(k));
            if (n.props['Caption'] !== undefined) { caption = true; }
            if (n.props['TabOrder'] !== undefined) { tab = true; }
        });
    }
    if (instances === 0) { return undefined; }
    return { width, height, events: [...events], props: caption ? ["Caption = '%NAME%'"] : [], tabOrder: tab, instances };
}

const toEvents = (names: string[] | undefined): EventDef[] | undefined => (names && names.length ? names.map(eventDefFor) : undefined);

/** Definition of a component class from the catalog, the user's list, learned project usage and the remembered unit. */
export function resolveWithLibrary(
    className: string,
    unitInput: string | undefined,
    custom: CustomComponent[],
    learned?: LearnedComponent,
    rememberedUnit?: string,
): ComponentDef {
    const entry = custom.find(c => c.className.toLowerCase() === className.toLowerCase());
    const base = resolveComponentDef(className);
    const isKnown = base.unit !== '' || entry !== undefined;
    const def: ComponentDef = { ...base };

    if (learned && !entry) {
        if (learned.width !== undefined) { def.width = learned.width; }
        if (learned.height !== undefined) { def.height = learned.height; }
        const ev = toEvents(learned.events);
        if (ev) { def.events = [...ev, ...def.events.filter(e => !learned.events.includes(e.name))]; }
        def.props = learned.props;
        def.tabOrder = learned.tabOrder;
    }
    if (entry) {
        if (entry.width !== undefined) { def.width = entry.width; }
        if (entry.height !== undefined) { def.height = entry.height; }
        if (entry.namePrefix) { def.namePrefix = entry.namePrefix; }
        const ev = toEvents(entry.events);
        if (ev) { def.events = ev; }
        if (entry.props) { def.props = entry.props; }
        if (entry.tabOrder !== undefined) { def.tabOrder = entry.tabOrder; }
    }
    const unit = (unitInput && unitInput.trim()) || entry?.unit || rememberedUnit || (isKnown ? def.unit : '');
    def.unit = unit.trim().replace(/^Vcl\./i, '');
    return def;
}
