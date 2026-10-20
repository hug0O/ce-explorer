/**
 * Two views of a Delphi project that need all of its units at once:
 * - the families of forms: which form descends from which, whether the .dfm uses visual inheritance
 *   (`inherited` components) and how much of a form is its own;
 * - the hotspots: the units that are both big and often changed, from a count of commits per file.
 *
 * Pure text in, plain objects out.
 */
import { parseDfmTree } from './DelphiLayout';
import { UnitFacts } from './ProjectUnused';

/* ───────── families of forms ───────── */

export interface FormInfo {
    unit: string;
    className: string;
    /** The class the form class descends from, as the unit writes it. */
    ancestor: string;
    /** The .dfm writes `inherited` for the form: it is a visual descendant of the ancestor form. */
    visual: boolean;
    inherited: number;
    own: number;
}

export function formInfo(unit: string, facts: UnitFacts | undefined, dfm: string): FormInfo | undefined {
    const root = parseDfmTree(dfm);
    if (!root) { return undefined; }
    let inherited = 0;
    let own = 0;
    const walk = (n: typeof root): void => {
        if (n.depth > 0) { if (n.inherited) { inherited++; } else { own++; } }
        n.children.forEach(walk);
    };
    walk(root);
    const cls = facts?.classes.find(c => c.name.toLowerCase() === root.className.toLowerCase());
    return { unit, className: root.className, ancestor: cls?.parent ?? '', visual: !!root.inherited, inherited, own };
}

export interface Family {
    ancestor: string;
    /** The unit of the project that declares the ancestor class, when there is one. */
    ancestorUnit: string;
    forms: FormInfo[];
}

/** Forms grouped by the class they descend from, the most shared ancestors first. */
export function families(forms: FormInfo[], units: { name: string; classes: { name: string }[] }[]): Family[] {
    const unitOf = new Map<string, string>();
    for (const u of units) { for (const c of u.classes) { unitOf.set(c.name.toLowerCase(), u.name); } }
    const by = new Map<string, Family>();
    for (const f of forms) {
        const key = (f.ancestor || '(no ancestor written)').toLowerCase();
        const fam = by.get(key) ?? { ancestor: f.ancestor || '(no ancestor written)', ancestorUnit: unitOf.get(f.ancestor.toLowerCase()) ?? '', forms: [] };
        by.set(key, fam);
        fam.forms.push(f);
    }
    for (const fam of by.values()) { fam.forms.sort((a, b) => (a.unit < b.unit ? -1 : 1)); }
    return [...by.values()].sort((a, b) => b.forms.length - a.forms.length || (a.ancestor < b.ancestor ? -1 : 1));
}

/* ───────── hotspots ───────── */

export interface UnitMetrics {
    lines: number;
    routines: number;
    /** Routines of more than 60 lines. */
    long: number;
    longest: number;
}

const HEADER = /^(?:class\s+)?(?:procedure|function|constructor|destructor)\s+\w+\s*\./i;

/** Size of a unit and of its routines, from its text alone (a routine runs from its header to the next one). */
export function unitMetrics(pas: string): UnitMetrics {
    const lines = pas.split(/\r?\n/);
    let code = 0;
    const starts: number[] = [];
    let inImpl = false;
    let end = lines.length;
    lines.forEach((l, i) => {
        const t = l.trim();
        if (t && !t.startsWith('//')) { code++; }
        if (/^implementation\b/i.test(t)) { inImpl = true; }
        if (inImpl && HEADER.test(t)) { starts.push(i); }
        if (/^end\.\s*$/i.test(t)) { end = i; }
    });
    let long = 0;
    let longest = 0;
    starts.forEach((s, k) => {
        const len = (starts[k + 1] ?? end) - s;
        if (len > 60) { long++; }
        if (len > longest) { longest = len; }
    });
    return { lines: code, routines: starts.length, long, longest };
}

/** Commits per file from `git log --name-only --pretty=format:---`, keyed by the lower-cased absolute path. */
export function churnFromLog(log: string, topLevel: string): Map<string, number> {
    const out = new Map<string, number>();
    const base = topLevel.replace(/\\/g, '/').replace(/\/$/, '');
    for (const line of log.split(/\r?\n/)) {
        const f = line.trim();
        if (!f || f === '---') { continue; }
        const key = (base + '/' + f).toLowerCase();
        out.set(key, (out.get(key) ?? 0) + 1);
    }
    return out;
}

export interface Hotspot {
    unit: string;
    path: string;
    commits: number;
    metrics: UnitMetrics;
    score: number;
}

/** A unit is a hotspot when it is often changed and hard to change: many commits, many lines, long routines. */
export function hotspots(units: { unit: string; path: string; metrics: UnitMetrics }[], churn: Map<string, number>, top = 40): Hotspot[] {
    const rows: Hotspot[] = [];
    for (const u of units) {
        const commits = churn.get(u.path.replace(/\\/g, '/').toLowerCase()) ?? 0;
        if (!commits) { continue; }
        const weight = 1 + u.metrics.lines / 1000 + u.metrics.long * 0.5 + Math.min(u.metrics.longest, 600) / 300;
        rows.push({ unit: u.unit, path: u.path, commits, metrics: u.metrics, score: Math.round(commits * weight * 10) / 10 });
    }
    return rows.sort((a, b) => b.score - a.score).slice(0, top);
}
