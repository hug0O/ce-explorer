/**
 * Which routine of a unit is the handler of which event of the form: the `OnClick = btnSaveClick` lines of the .dfm. A handler is called
 * by the form, never by the code of the unit, so the Blueprint draws it as an event (an entry point) and does not call it unused. Pure.
 */
import type { DfmNode } from '../services/DelphiLayout';

const EVENT_RE = /^On[A-Z]\w*$/;

/** Handler name (lower case) -> the events it answers, as `Component.OnEvent`. */
export function eventsByHandler(root: DfmNode | undefined): Map<string, string[]> {
    const out = new Map<string, string[]>();
    const walk = (n: DfmNode): void => {
        for (const [prop, value] of Object.entries(n.props)) {
            if (!EVENT_RE.test(prop)) { continue; }
            const handler = value.trim();
            if (!/^[A-Za-z_]\w*$/.test(handler)) { continue; }
            const key = handler.toLowerCase();
            const label = (n.depth === 0 ? 'Form' : n.name) + '.' + prop;
            const list = out.get(key) ?? [];
            if (!list.includes(label)) { list.push(label); }
            out.set(key, list);
        }
        n.children.forEach(walk);
    };
    if (root) { walk(root); }
    return out;
}
