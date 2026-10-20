/**
 * What a Delphi project carries without using it:
 * - units of the project listed in a `uses` clause of which nothing is used by the unit that lists them;
 * - non-visual components of a form (queries, data sources, image lists, timers…) that neither the code
 *   nor the rest of the form refers to.
 *
 * Neither is certain (a unit can register something in its `initialization`, a component can be reached
 * through `FindComponent`), so the results are advice, with the reason when there is one to be careful.
 *
 * Pure text in, plain objects out: nothing here reads a file.
 */
import { DfmNode, parseDfmTree } from './DelphiLayout';
import { isNonVisual } from './DesignerModel';
import { wiredEvents } from './DelphiEvents';
import { blankPascal, escapeRe } from '../utils/pascalReview';

export interface UnitFacts {
    /** The name declared by `unit X;`. */
    name: string;
    /** What the unit offers to the others: types, enumeration elements, routines, constants and variables of its interface. */
    exported: Set<string>;
    uses: { name: string; section: 'interface' | 'implementation'; line: number }[];
    /** Words of the code of the unit (comments and strings left out), in lower case. */
    words: Set<string>;
    initialization: boolean;
    /** The classes the unit declares, with the class they descend from (empty for a class with no ancestor written). */
    classes: { name: string; parent: string }[];
}

export interface UnusedUnit {
    unit: string;
    used: string;
    section: 'interface' | 'implementation';
    line: number;
    /** The unit has an `initialization` section: it may do its work by being linked. */
    sideEffects: boolean;
}

export interface UnusedComponent {
    unit: string;
    component: string;
    className: string;
    line: number;
    /** Components it holds (persistent fields, styles…) that are not used either. */
    holds: number;
}

const WORD = /[A-Za-z_]\w*/g;

/** The enumeration elements, the routines and the like that the interface of a unit offers. */
export function unitFacts(pas: string): UnitFacts | undefined {
    const raw = pas.replace(/^\uFEFF/, '').split(/\r?\n/);
    const lines = blankPascal(raw);
    const text = lines.join('\n');
    const name = /^\s*unit\s+([\w.]+)\s*;/im.exec(text)?.[1];
    if (!name) { return undefined; }
    const implAt = lines.findIndex(l => /^\s*implementation\b/i.test(l));
    const ifaceAt = lines.findIndex(l => /^\s*interface\b/i.test(l));
    const initAt = lines.findIndex((l, i) => i > implAt && /^\s*initialization\b/i.test(l));
    const exported = new Set<string>([name.toLowerCase()]);
    const classes: UnitFacts['classes'] = [];
    const last = implAt < 0 ? lines.length : implAt;
    let section = '';
    for (let i = Math.max(0, ifaceAt); i < last; i++) {
        const l = lines[i];
        const head = /^ {0,2}(type|var|const|resourcestring|threadvar)\b/i.exec(l);
        if (head) { section = head[1].toLowerCase(); }
        const decl = /^ {0,2}([A-Za-z_]\w*)(?:<[^>]*>)?\s*=/.exec(l);
        if (decl && (section === 'type' || section === 'const' || section === 'resourcestring')) {
            exported.add(decl[1].toLowerCase());
            // an enumeration: T = (a, b, c) over one or more lines
            if (section === 'type' && /=\s*\(/.test(l)) {
                let body = l.slice(l.indexOf('(') + 1);
                for (let j = i; !/\)/.test(body) && j + 1 < last && j < i + 400; j++) { body += ' ' + lines[j + 1]; }
                for (const part of body.split(')')[0].split(',')) { const e = /^\s*([A-Za-z_]\w*)/.exec(part); if (e) { exported.add(e[1].toLowerCase()); } }
            }
        }
        const cls = /^ {0,2}([A-Za-z_]\w*)(?:<[^>]*>)?\s*=\s*(?:packed\s+)?class\b\s*(?:\(\s*([\w.]+))?/i.exec(l);
        if (cls && section === 'type') { classes.push({ name: cls[1], parent: cls[2] ?? '' }); }
        const routine = /^(?:class\s+)?(?:procedure|function)\s+([A-Za-z_]\w*)/i.exec(l);
        if (routine) { exported.add(routine[1].toLowerCase()); }
        const variable = /^ {0,2}([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s*:/.exec(l);
        if (variable && (section === 'var' || section === 'threadvar')) { variable[1].split(',').forEach(v => exported.add(v.trim().toLowerCase())); }
    }
    const uses: UnitFacts['uses'] = [];
    for (const m of text.matchAll(/\buses\b([^;]*);/gi)) {
        const line = text.slice(0, m.index).split('\n').length - 1;
        const at = implAt >= 0 && line > implAt ? 'implementation' : 'interface';
        const startLine = line;
        // `in '…'` of a project file is blanked already; the commas and the names remain
        const body = m[1].replace(/\bin\b\s*/gi, ' ');
        let lineAt = startLine;
        for (const part of body.split(/(,)/)) {
            if (part === ',') { continue; }
            const piece = part.replace(/\n/g, () => { lineAt++; return ' '; });
            const n = /([A-Za-z_][\w.]*)/.exec(piece)?.[1];
            if (n && !/^uses$/i.test(n)) { uses.push({ name: n, section: at, line: lineAt }); }
        }
    }
    // the code proper: everything after the `uses` of the interface, without the `uses` clauses themselves
    const code = text.replace(/\buses\b[^;]*;/gi, m => m.replace(/[^\n]/g, ' '));
    const words = new Set<string>();
    for (const w of code.matchAll(WORD)) { words.add(w[0].toLowerCase()); }
    return { name, exported, uses, words, initialization: initAt >= 0, classes };
}

/** The units of the project listed in a `uses` clause of which nothing is used. `files` is the whole project. */
export function unusedUnits(files: { facts: UnitFacts }[]): UnusedUnit[] {
    const byName = new Map(files.map(f => [f.facts.name.toLowerCase(), f.facts]));
    const out: UnusedUnit[] = [];
    for (const { facts } of files) {
        for (const u of facts.uses) {
            const target = byName.get(u.name.toLowerCase());
            if (!target || target === facts) { continue; }
            let used = false;
            for (const w of target.exported) { if (facts.words.has(w)) { used = true; break; } }
            if (!used) { out.push({ unit: facts.name, used: target.name, section: u.section, line: u.line, sideEffects: target.initialization }); }
        }
    }
    return out;
}

/* ───────── components ───────── */

const SELF_WORKING = /(LookAndFeel|Controller|Localizer|Skin|Theme|Hook|Manager)$/i;

export function unusedComponents(unit: string, pas: string, dfm: string): UnusedComponent[] {
    const root = parseDfmTree(dfm);
    if (!root) { return []; }
    const code = blankPascal(pas.replace(/^\uFEFF/, '').split(/\r?\n/)).join('\n');
    const dfmLines = dfm.split(/\r?\n/);
    const declared = new Set<string>();
    for (const m of code.matchAll(/^[ \t]*([A-Za-z_]\w*)\s*:\s*[\w.]+\s*;/gm)) { declared.add(m[1].toLowerCase()); }
    const mentions = (name: string, text: string): number => (text.match(new RegExp('(?<![\\w.])' + escapeRe(name) + '(?!\\w)', 'gi')) ?? []).length;
    const all = (n: DfmNode): DfmNode[] => [n, ...n.children.flatMap(all)];

    /** Uses of a component in the code (its declaration does not count) and in the rest of the form (its own `object` line does not count). */
    const used = (n: DfmNode): boolean => {
        const inCode = mentions(n.name, code) - (declared.has(n.name.toLowerCase()) ? 1 : 0);
        if (inCode > 0) { return true; }
        const inForm = dfmLines.reduce((k, l, i) => k + (i === n.startLine ? 0 : mentions(n.name, l)), 0);
        return inForm > 0;
    };

    const out: UnusedComponent[] = [];
    for (const n of root.children) {
        if (n.anonymous || !isNonVisual(n) || SELF_WORKING.test(n.className) || !declared.has(n.name.toLowerCase())) { continue; }
        if (Object.keys(wiredEvents(n)).length > 0) { continue; }
        const parts = all(n).slice(1);
        if (used(n) || parts.some(p => used(p) || Object.keys(wiredEvents(p)).length > 0)) { continue; }
        out.push({ unit, component: n.name, className: n.className, line: n.startLine, holds: parts.length });
    }
    return out;
}
