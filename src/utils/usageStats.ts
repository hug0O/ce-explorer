/**
 * What is used in the extension, counted on this machine only (nothing is sent anywhere): how many times each feature was run, when it was
 * first and last used, and how many times in each of the last days. From that, a ranking of the most used features and the list of the least
 * used ones. Pure: the data in, the ranking out, so it is tested without VS Code.
 */

export interface UsageEntry {
    n: number;
    first: number;
    last: number;
    /** Uses per day (`2026-10-30`), the last 60 days. */
    days: Record<string, number>;
}

export interface UsageData {
    /** When the counting began: the ranking says over how many days it was made. */
    since: number;
    entries: Record<string, UsageEntry>;
}

export interface Feature { key: string; label: string; group: string }

export const DAY = 86_400_000;
const KEEP_DAYS = 60;
const MAX_KEYS = 500;

export const emptyUsage = (now: number): UsageData => ({ since: now, entries: {} });

export const dayKey = (t: number): string => new Date(t).toISOString().slice(0, 10);

/** Counts one use of a feature. Old days are dropped, and the number of features kept is bounded. */
export function record(data: UsageData, key: string, now: number): void {
    if (!key || key.length > 80) { return; }
    let e = data.entries[key];
    if (!e) {
        if (Object.keys(data.entries).length >= MAX_KEYS) { return; }
        e = data.entries[key] = { n: 0, first: now, last: now, days: {} };
    }
    e.n++;
    e.last = now;
    const d = dayKey(now);
    e.days[d] = (e.days[d] ?? 0) + 1;
    const cut = dayKey(now - KEEP_DAYS * DAY);
    for (const k of Object.keys(e.days)) { if (k < cut) { delete e.days[k]; } }
}

/** What was read back from the store, whatever it holds: only well-formed entries are kept. */
export function sanitize(raw: unknown, now: number): UsageData {
    const o = (raw && typeof raw === 'object' ? raw : {}) as { since?: unknown; entries?: unknown };
    const data = emptyUsage(typeof o.since === 'number' && o.since > 0 && o.since <= now ? o.since : now);
    for (const [k, v] of Object.entries((o.entries && typeof o.entries === 'object' ? o.entries : {}) as Record<string, unknown>)) {
        const e = v as Partial<UsageEntry> | null;
        if (!e || typeof e.n !== 'number' || !(e.n > 0) || typeof e.last !== 'number' || k.length > 80) { continue; }
        const days: Record<string, number> = {};
        for (const [d, c] of Object.entries(e.days ?? {})) { if (/^\d{4}-\d{2}-\d{2}$/.test(d) && typeof c === 'number' && c > 0) { days[d] = c; } }
        data.entries[k] = { n: Math.floor(e.n), first: typeof e.first === 'number' ? e.first : e.last, last: e.last, days };
        if (Object.keys(data.entries).length >= MAX_KEYS) { break; }
    }
    return data;
}

export interface Row extends Feature {
    n: number;
    /** Uses in the last 30 days. */
    recent: number;
    last: number;
    /** Days since the last use. */
    ago: number;
}

export interface Ranking {
    /** The days the counting has been running. */
    observed: number;
    /** Too few days to judge what is useless. */
    young: boolean;
    total: number;
    /** Most used first. */
    top: Row[];
    /** Used, but little: at most `RARE` times over a period long enough to have used them. */
    rare: Row[];
    /** Features of the catalog that were never used. */
    never: Row[];
}

/** A feature used this few times in a few weeks is a candidate for the "least useful" list. */
export const RARE = 2;
/** Fewer days than this and the counting is too young to call anything useless. */
export const MIN_DAYS = 14;

export function rank(data: UsageData, catalog: Feature[], now: number): Ranking {
    const known = new Map(catalog.map(f => [f.key, f]));
    const recentFrom = dayKey(now - 29 * DAY);
    const rows: Row[] = Object.entries(data.entries).map(([key, e]) => {
        const f = known.get(key);
        const recent = Object.entries(e.days).reduce((n, [d, c]) => (d >= recentFrom ? n + c : n), 0);
        return { key, label: f?.label ?? key, group: f?.group ?? groupOfKey(key), n: e.n, recent, last: e.last, ago: Math.max(0, Math.floor((now - e.last) / DAY)) };
    });
    const top = rows.slice().sort((a, b) => b.n - a.n || b.last - a.last || (a.label < b.label ? -1 : 1));
    const observed = Math.max(0, Math.floor((now - data.since) / DAY));
    const rare = top.filter(r => r.n <= RARE && catalogKnown(known, r.key)).sort((a, b) => a.n - b.n || a.last - b.last).slice();
    const never = catalog.filter(f => !data.entries[f.key]).map(f => ({ ...f, n: 0, recent: 0, last: 0, ago: observed }));
    return { observed, young: observed < MIN_DAYS, total: rows.reduce((n, r) => n + r.n, 0), top, rare, never };
}

const catalogKnown = (known: Map<string, Feature>, key: string): boolean => known.has(key);

/** A readable group for a feature the catalog does not list: `designer:rename` is of the designer, `sidebar:..` of the sidebar. */
export function groupOfKey(key: string): string {
    const m = /^([a-z]+):/.exec(key);
    return m ? m[1] : 'commands';
}

/** The ranking as Markdown, to paste in a note or a ticket. */
export function rankingMarkdown(r: Ranking, top = 30): string {
    const lines = ['# Feature usage', '', `Counted on this machine over ${r.observed} day${r.observed === 1 ? '' : 's'}: ${r.total} uses.${r.young ? ' (Too young to judge what is useless: wait about two weeks.)' : ''}`, '', '## Most used', ''];
    r.top.slice(0, top).forEach((x, i) => lines.push(`${i + 1}. ${x.label} - ${x.n} (${x.recent} in the last 30 days)`));
    lines.push('', '## Little used', '');
    if (!r.rare.length) { lines.push('Nothing.'); }
    r.rare.forEach(x => lines.push(`- ${x.label} - ${x.n} use${x.n === 1 ? '' : 's'}, last ${x.ago} day${x.ago === 1 ? '' : 's'} ago`));
    lines.push('', '## Never used', '');
    if (!r.never.length) { lines.push('Nothing.'); }
    r.never.forEach(x => lines.push(`- ${x.label}${x.group ? ' (' + x.group + ')' : ''}`));
    return lines.join('\n');
}
