/**
 * Wiring an event (OnClick, OnChange…) on a component that already exists on
 * the form: the `OnXxx = Handler` link in the .dfm, plus the handler's
 * declaration and empty implementation in the .pas unit.
 */
import {
    COMPONENTS, EVENT_PROP_RE, TextEdit, buildUnitEdits, eventDefOf, handlerName, resolveComponentDef,
} from './DelphiForm';
import { DfmNode, findNode, parseDfmTree } from './DelphiLayout';

export interface AddEventRequest {
    componentName: string;
    /** Property name, e.g. OnClick. */
    eventName: string;
    /** Handler method name; defaults to <Component><Event without "On"> (Button1Click). */
    methodName?: string;
}

export type AddEventPlan =
    | { error: string }
    | {
        pasEdits: TextEdit[];
        dfmEdit?: TextEdit;
        /** `TForm1.Button1Click`: where to jump (new handler, or the existing one the event already points to). */
        handler: string;
        /** The event was already wired to a handler: nothing to edit, only navigate. */
        alreadyWired: boolean;
    };

/** Events offered for a component class: the catalog's list, or the usual generic ones. */
export function eventsForClass(className: string, isForm = false): string[] {
    if (isForm) { return ['OnCreate', 'OnShow', 'OnClose', 'OnCloseQuery', 'OnDestroy', 'OnResize', 'OnActivate', 'OnKeyDown']; }
    const known = COMPONENTS.find(c => c.className.toLowerCase() === className.toLowerCase());
    return known ? known.events.map(e => e.name) : ['OnClick', 'OnChange', 'OnEnter', 'OnExit'];
}

/** Properties of the node that are already event links (OnXxx = Handler). */
export function wiredEvents(node: DfmNode): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(node.props)) {
        if (EVENT_PROP_RE.test(k)) { out[k] = v; }
    }
    return out;
}

function lineStartOffset(text: string, line: number): number {
    let offset = 0;
    for (let l = 0; l < line; l++) {
        const next = text.indexOf('\n', offset);
        if (next < 0) { return text.length; }
        offset = next + 1;
    }
    return offset;
}

export function planAddEvent(pas: string, dfm: string, req: AddEventRequest): AddEventPlan {
    const root = parseDfmTree(dfm);
    if (!root) { return { error: 'This .dfm is not in text format.' }; }
    const node = findNode(root, req.componentName);
    if (!node) { return { error: `Component "${req.componentName}" not found in the .dfm.` }; }
    if (!EVENT_PROP_RE.test(req.eventName)) { return { error: `"${req.eventName}" is not an event name (expected OnXxx).` } }
    if (req.methodName && !/^[A-Za-z_]\w*$/.test(req.methodName)) { return { error: `"${req.methodName}" is not a valid method name.` }; }

    const event = eventDefOf(resolveComponentDef(node.className), req.eventName);
    const method = req.methodName || handlerName(node.name, req.eventName);
    const formClass = root.className;

    const wired = wiredEvents(node)[req.eventName];
    if (wired !== undefined) {
        // Already linked: reuse that handler (jump to it), never create a second one.
        return { pasEdits: [], handler: `${formClass}.${wired}`, alreadyWired: true };
    }

    // The root form itself (OnCreate…) has no field; other components must exist in the unit too.
    const def = { ...resolveComponentDef(node.className), unit: '' };
    const unit = buildUnitEdits(pas, {
        formClass, componentName: node.name, def, event, skipField: true, methodName: method,
    });
    if (!unit) { return { error: `Could not find the form class ${formClass} in the unit.` }; }

    // The link goes after the node's own properties, i.e. before its first child or its closing `end`.
    const eol = dfm.includes('\r\n') ? '\r\n' : '\n';
    const insertLine = node.children.length > 0 ? node.children[0].startLine : node.endLine;
    const pad = '  '.repeat(node.depth + 1);
    return {
        pasEdits: unit.edits,
        dfmEdit: { offset: lineStartOffset(dfm, insertLine), text: `${pad}${req.eventName} = ${method}${eol}` },
        handler: `${formClass}.${method}`,
        alreadyWired: false,
    };
}
