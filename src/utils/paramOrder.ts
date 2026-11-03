/**
 * Changing the order of the parameters of a routine, and the same change in the arguments of its calls. Pure: text in, edits out.
 */
import { CodeFamily, maskCode } from './callGraph';

/**
 * How the parameters were reordered: `new[i] = old[perm[i]]`. Undefined when the new list is not the old one in another order (a name was
 * added, removed or renamed) or when the order is the same.
 */
export function permutation(oldNames: string[], newNames: string[]): number[] | undefined {
    if (oldNames.length < 2 || oldNames.length !== newNames.length) { return undefined; }
    const low = oldNames.map(n => n.toLowerCase());
    const perm: number[] = [];
    const used = new Set<number>();
    for (const n of newNames) {
        const at = low.findIndex((o, i) => o === n.toLowerCase() && !used.has(i));
        if (at < 0) { return undefined; }
        used.add(at); perm.push(at);
    }
    return perm.every((p, i) => p === i) ? undefined : perm;
}

export interface TextChange { start: number; end: number; text: string }

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The changes that put the arguments of every call of `routine` in the new order. Only a call with exactly as many arguments as there
 * are parameters is touched (a call that leaves out a default value is left alone); the lines of the routine's own declaration and
 * implementation (`skipLines`, 0-based) are not calls. Each argument keeps the blanks around its place.
 */
export function reorderArguments(text: string, family: CodeFamily, routine: string, perm: number[], skipLines: number[]): TextChange[] {
    const masked = maskCode(text, family);
    const ci = family.kind === 'pascal' || family.kind === 'sql';
    const skip = new Set(skipLines);
    const lineOf = (offset: number): number => { let n = 0; for (let i = 0; i < offset; i++) { if (text.charCodeAt(i) === 10) { n++; } } return n; };
    const out: TextChange[] = [];
    for (const m of masked.matchAll(new RegExp('(?<![\\w$])' + esc(routine) + '(?![\\w$])\\s*\\(', ci ? 'gi' : 'g'))) {
        const at = m.index ?? 0;
        if (skip.has(lineOf(at))) { continue; }
        const open = at + m[0].length - 1;
        // the arguments: split at the commas of the first level, up to the closing parenthesis
        const slots: { s: number; e: number }[] = [];
        let depth = 1, from = open + 1, i = open + 1;
        for (; i < masked.length && depth > 0; i++) {
            const c = masked[i];
            if (c === '(' || c === '[' || c === '{') { depth++; }
            else if (c === ')' || c === ']' || c === '}') { depth--; if (depth === 0) { break; } }
            else if (c === ',' && depth === 1) { slots.push({ s: from, e: i }); from = i + 1; }
        }
        if (depth !== 0) { continue; }
        slots.push({ s: from, e: i });
        if (slots.length !== perm.length) { continue; }
        const parts = slots.map(sl => { const raw = text.slice(sl.s, sl.e); const lead = raw.length - raw.trimStart().length; const body = raw.trim(); return { lead: raw.slice(0, lead), body, trail: raw.slice(lead + body.length) }; });
        if (parts.some(p => !p.body)) { continue; }
        perm.forEach((from2, k) => {
            if (from2 === k) { return; }
            out.push({ start: slots[k].s, end: slots[k].e, text: parts[k].lead + parts[from2].body + parts[k].trail });
        });
    }
    return out;
}

/** The changes applied to the text, from the end so that the offsets stay right. */
export function applyChanges(text: string, changes: TextChange[]): string {
    let out = text;
    for (const c of changes.slice().sort((a, b) => b.start - a.start)) { out = out.slice(0, c.start) + c.text + out.slice(c.end); }
    return out;
}

/** How many calls the changes touch (a call with several moved arguments is one). */
export function callsTouched(changes: TextChange[], text: string, routine: string): number {
    const seen = new Set<number>();
    for (const c of changes) {
        const before = text.slice(0, c.start);
        const at = before.toLowerCase().lastIndexOf(routine.toLowerCase());
        seen.add(at);
    }
    return seen.size;
}
