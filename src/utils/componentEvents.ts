/**
 * The events of a component as the .dfm wires them (`OnClick = btnSaveClick`), and the events a handler answers. The Structure tab shows
 * them under a component, so the handler is one click away from the component the designer had selected. Pure.
 */
import { DfmNode, parseDfmTree } from '../services/DelphiLayout';
import { shortcutText } from '../services/DelphiMenus';

export interface WiredEvent { event: string; handler: string }

const EVENT_RE = /^On[A-Z]\w*$/;

function find(node: DfmNode, name: string): DfmNode | undefined {
    if (node.name.toLowerCase() === name.toLowerCase()) { return node; }
    for (const c of node.children) { const f = find(c, name); if (f) { return f; } }
    return undefined;
}

/** The events wired on the component (or on the form itself when `name` is the form's name), in the order of the .dfm. */
export function eventsOfComponent(dfm: string, name: string): WiredEvent[] {
    const root = parseDfmTree(dfm);
    const node = root ? find(root, name) : undefined;
    if (!node) { return []; }
    const out: WiredEvent[] = [];
    for (const [prop, value] of Object.entries(node.props)) {
        const handler = value.trim();
        if (EVENT_RE.test(prop) && /^[A-Za-z_]\w*$/.test(handler)) { out.push({ event: prop, handler }); }
    }
    return out;
}

/** Whether the form has a component (or is the form) with this name. */
export function hasComponent(dfm: string, name: string): boolean {
    const root = parseDfmTree(dfm);
    return !!root && !!find(root, name);
}

export interface MenuEntry { name: string; caption: string; depth: number; shortcut: string; events: WiredEvent[] }

/** The items of a `TPopupMenu` / `TMainMenu` (or the sub-items of an item), in the order of the menu, each with the events wired on it. */
export function menuItemsOf(dfm: string, name: string): MenuEntry[] {
    const root = parseDfmTree(dfm);
    const host = root ? find(root, name) : undefined;
    if (!host || !/^T(Popup|Main|Menu)/i.test(host.className) && !/^TMenuItem$/i.test(host.className)) { return []; }
    const out: MenuEntry[] = [];
    const walk = (n: DfmNode, depth: number): void => {
        for (const c of n.children) {
            if (!/^TMenuItem$/i.test(c.className)) { continue; }
            const events: WiredEvent[] = [];
            for (const [prop, value] of Object.entries(c.props)) {
                if (EVENT_RE.test(prop) && /^[A-Za-z_]\w*$/.test(value.trim())) { events.push({ event: prop, handler: value.trim() }); }
            }
            const cap = /^'(.*)'$/.exec((c.props['Caption'] ?? '').trim());
            const caption = cap ? cap[1].replace(/''/g, "'").replace(/&(&?)/g, (_m, d: string) => (d ? '&' : '')) : c.name;
            out.push({ name: c.name, caption, depth, shortcut: shortcutText(c.props['ShortCut']), events });
            walk(c, depth + 1);
        }
    };
    walk(host, 0);
    return out;
}

/** The `Component.OnEvent` pairs that a handler answers (a handler can serve several components). */
export function eventsOfHandler(dfm: string, handler: string): string[] {
    const root = parseDfmTree(dfm);
    const out: string[] = [];
    const walk = (n: DfmNode): void => {
        for (const [prop, value] of Object.entries(n.props)) {
            if (EVENT_RE.test(prop) && value.trim().toLowerCase() === handler.toLowerCase()) { out.push((n.depth === 0 ? 'Form' : n.name) + '.' + prop); }
        }
        n.children.forEach(walk);
    };
    if (root) { walk(root); }
    return out;
}
