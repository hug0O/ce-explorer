/**
 * The first lines of an event handler, for the tooltip of the ⚡ badge of a component in the designer: what a click on it
 * does, without leaving the form. Pure: text in, text out.
 */
import { DfmNode } from './DelphiLayout';
import { readUnit } from './DelphiCheck';
import { handlerImplementation } from './DelphiSync';
import { wiredEvents } from './DelphiEvents';

export interface HandlerPreview {
    event: string;
    handler: string;
    /** No implementation of this handler in the unit. */
    missing: boolean;
    /** The body holds no statement. */
    empty: boolean;
    /** The first lines of the body, as they are written. */
    lines: string[];
    /** The body goes on after those lines. */
    more: boolean;
}

/** The body of a handler without its header, its local declarations and its closing `end;`, up to `max` lines. */
export function bodyLines(implementation: string, max: number): { lines: string[]; more: boolean; empty: boolean } {
    const all = implementation.replace(/\r/g, '').split('\n');
    // from the first `begin` that is on a line of its own (the header and the `var` section come before)
    const begin = all.findIndex(l => /^\s*begin\b/i.test(l));
    let end = all.length - 1;
    while (end > begin && !/^\s*end\s*;?\s*$/i.test(all[end])) { end--; }
    const body = all.slice(begin < 0 ? 0 : begin + 1, end > begin ? end : all.length).filter((l, i, a) => l.trim() !== '' || (i > 0 && i < a.length - 1));
    const code = body.filter(l => l.trim() !== '' && !/^\s*\/\//.test(l));
    return { lines: body.slice(0, max).map(l => l.replace(/\s+$/, '')), more: body.length > max, empty: code.length === 0 };
}

export function handlerPreviews(pas: string, dfmNode: DfmNode, formClass: string, max = 8): HandlerPreview[] {
    const unit = readUnit(pas, formClass);
    const out: HandlerPreview[] = [];
    for (const [event, handler] of Object.entries(wiredEvents(dfmNode))) {
        const impl = unit ? handlerImplementation(pas, unit.formName, handler) : undefined;
        if (!impl) { out.push({ event, handler, missing: true, empty: false, lines: [], more: false }); continue; }
        const b = bodyLines(pas.slice(impl.start, impl.end), max);
        out.push({ event, handler, missing: false, empty: b.empty, lines: b.lines, more: b.more });
    }
    return out;
}
