/**
 * Checks of the forms of a project that need the forms side by side:
 * - the columns of a grid that name a field their query does not select;
 * - the texts written in the forms (captions, hints…), grouped, with the ones written in several ways;
 * - the names of the components against the convention the project itself follows.
 *
 * Pure text in, plain objects out: nothing here reads a file.
 */
import { parseDfmTree } from './DelphiLayout';
import { parseEntities, DfmEntity } from './DfmDiff';
import { bare, decodeDelphiString, dfmSql } from './ProjectSql';

/* ───────── grid columns against the query ───────── */

export interface GridIssue {
    unit: string;
    line: number;
    view: string;
    column: string;
    field: string;
    dataset: string;
    message: string;
}

/** The names a SELECT gives to its columns, in upper case; undefined when it cannot be known (`select *`, an unreadable statement). */
export function selectColumns(sql: string): string[] | undefined {
    const text = bare(sql);
    // the first `select` that is not inside parentheses (a WITH clause comes first)
    let depth = 0;
    let at = -1;
    for (const m of text.matchAll(/[()]|\bselect\b/gi)) {
        if (m[0] === '(') { depth++; } else if (m[0] === ')') { depth--; } else if (depth === 0) { at = m.index! + m[0].length; break; }
    }
    if (at < 0) { return undefined; }
    const items: string[] = [];
    let cur = '';
    depth = 0;
    let end = text.length;
    for (let i = at; i < text.length; i++) {
        const c = text[i];
        if (c === '(') { depth++; } else if (c === ')') { depth--; }
        if (depth === 0 && /\s/.test(c) && /^\s*from\b/i.test(text.slice(i))) { end = i; break; }
        if (depth === 0 && c === ',') { items.push(cur); cur = ''; } else { cur += c; }
    }
    if (end === text.length && !/\bfrom\b/i.test(text.slice(at))) { return undefined; }
    items.push(cur);
    const names: string[] = [];
    for (let item of items) {
        item = item.replace(/^\s*(distinct|unique|all)\b/i, '').trim();
        if (!item) { continue; }
        if (item === '*' || /\.\s*\*$/.test(item)) { return undefined; }
        const quoted = /^"([^"]+)"$/.exec(item);
        if (quoted) { names.push(quoted[1].toUpperCase()); continue; }
        const alias = /\bas\s+"([^"]+)"\s*$|\bas\s+([A-Za-z_][\w$#]*)\s*$|\s"([^"]+)"\s*$/i.exec(item);
        if (alias) { names.push((alias[1] ?? alias[2] ?? alias[3]).toUpperCase()); continue; }
        const tokens = item.replace(/\([^()]*\)/g, ' ( ) ').split(/\s+/).filter(Boolean);
        const last = tokens[tokens.length - 1];
        const before = tokens[tokens.length - 2];
        if (tokens.length > 1 && /^"?[A-Za-z_][\w$#]*"?$/.test(last) && before && !/^[-+*/|<>=(]+$|^(and|or|not|then|else|when|case|in|is|like|between)$/i.test(before) && !/[-+*/|]$/.test(before)) {
            names.push(last.replace(/"/g, '').toUpperCase());
        } else if (tokens.length === 1) {
            const col = /^(?:[\w$#"]+\.)*"?([A-Za-z_][\w$#]*)"?$/.exec(last);
            if (col) { names.push(col[1].toUpperCase()); }
        }
    }
    return names;
}

const unquote = (v: string | undefined): string => (v ? decodeDelphiString(v) : '');

const flat = (n: DfmEntity, into: DfmEntity[] = []): DfmEntity[] => { into.push(n); n.children.forEach(c => flat(c, into)); return into; };

export function gridFieldIssues(unit: string, dfm: string): GridIssue[] {
    const root = parseEntities(dfm);
    if (!root) { return []; }
    const all = flat(root);
    const byName = new Map(all.map(n => [n.name.toLowerCase(), n]));
    const sql = new Map(dfmSql(dfm, unit).map(e => [(e.component ?? '').toLowerCase(), e.text]));
    const out: GridIssue[] = [];
    for (const view of all) {
        const dsName = view.props.get('DataController.DataSource')?.value;
        if (!dsName) { continue; }
        const ds = byName.get(dsName.toLowerCase());
        const setName = ds?.props.get('DataSet')?.value;
        const dataset = setName ? byName.get(setName.toLowerCase()) : undefined;
        if (!dataset) { continue; }
        const text = sql.get(dataset.name.toLowerCase());
        const selected = text ? selectColumns(text) : undefined;
        // fields the .dfm declares itself (persistent, calculated, lookup) count as well
        const persistent = dataset.children.map(c => unquote(c.props.get('FieldName')?.value).toUpperCase()).filter(Boolean);
        if (!selected && !persistent.length) { continue; }
        // with no SQL in the form the persistent fields are all that is known, and a dataset filled by the code may add others
        if (!selected) { continue; }
        const known = new Set([...selected, ...persistent]);
        for (const col of view.children) {
            const field = unquote(col.props.get('DataBinding.FieldName')?.value);
            if (!field || known.has(field.toUpperCase())) { continue; }
            out.push({
                unit, line: col.line, view: view.name, column: col.name, field, dataset: dataset.name,
                message: `${col.name} shows the field ${field}, which the SELECT of ${dataset.name} does not return`,
            });
        }
    }
    return out;
}

/* ───────── texts ───────── */

export interface TextRow {
    unit: string;
    component: string;
    className: string;
    prop: string;
    text: string;
    line: number;
}

export interface TextGroup {
    /** The text without what does not change its meaning (case, `&`, accents, `:` `...`). */
    key: string;
    /** The ways it is written, most used first. */
    variants: { text: string; count: number }[];
    rows: TextRow[];
}

const TEXT_PROPS = new Set(['Caption', 'Hint', 'Title', 'Text1.Value', 'Text2.Value', 'Caption.Text', 'Header.Caption', 'DisplayLabel', 'Properties.NullText', 'Properties.Caption']);

export function formTexts(unit: string, dfm: string): TextRow[] {
    const root = parseEntities(dfm);
    if (!root) { return []; }
    const out: TextRow[] = [];
    for (const n of flat(root)) {
        for (const [prop, { value, line }] of n.props) {
            if (!TEXT_PROPS.has(prop) || !/^['#]/.test(value)) { continue; }
            const text = decodeDelphiString(value.replace(/\n/g, ' ')).replace(/\s+/g, ' ').trim();
            // nothing to translate: no letter, or the name of the component the IDE put there
            if (!/\p{L}{2}/u.test(text) || text.toLowerCase() === n.name.toLowerCase()) { continue; }
            out.push({ unit, component: n.name, className: n.className, prop, text, line });
        }
    }
    return out;
}

export function textKey(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, '').replace(/\s*(\.{3}|…|:)\s*$/, '').replace(/\s+/g, ' ').trim();
}

export function groupTexts(rows: TextRow[]): TextGroup[] {
    const groups = new Map<string, TextGroup>();
    for (const r of rows) {
        const key = textKey(r.text);
        const g = groups.get(key) ?? { key, variants: [], rows: [] };
        groups.set(key, g);
        g.rows.push(r);
        const v = g.variants.find(x => x.text === r.text);
        if (v) { v.count++; } else { g.variants.push({ text: r.text, count: 1 }); }
    }
    for (const g of groups.values()) { g.variants.sort((a, b) => b.count - a.count || (a.text < b.text ? -1 : 1)); }
    return [...groups.values()].sort((a, b) => b.variants.length - a.variants.length || b.rows.length - a.rows.length || (a.key < b.key ? -1 : 1));
}

/** Rows as CSV for a translator: one line per text, with where it is used. */
export function textsCsv(groups: TextGroup[]): string {
    const q = (s: string): string => '"' + s.replace(/"/g, '""') + '"';
    const lines = ['text;variants;uses;where'];
    for (const g of groups) {
        const where = [...new Set(g.rows.map(r => `${r.unit}.${r.component}`))].slice(0, 6).join(', ');
        lines.push([q(g.variants[0].text), String(g.variants.length), String(g.rows.length), q(where)].join(';'));
    }
    return lines.join('\n');
}

/* ───────── names ───────── */

export interface NamingIssue {
    unit: string;
    line: number;
    component: string;
    className: string;
    prefix: string;
    expected: string;
    suggestion: string;
    /** The name the IDE gave (`Button1`), not a name somebody chose. */
    isDefault: boolean;
    message: string;
}

/** `btnSave` → `btn`, `cxgtvPPECHSolder` → `cxgtv`, `edt_Nom` → `edt`, `Button1` → ''. */
export function namePrefix(name: string): string {
    const m = /^[a-z]+/.exec(name);
    if (!m) { return ''; }
    const p = m[0];
    // `edt` of `edtNom` stops at the capital; a name written all in lower case has no prefix
    return p.length === name.length || /^[a-z]+\d*$/.test(name) ? '' : p;
}

export function isDefaultName(name: string, className: string): boolean {
    const stem = className.replace(/^T/, '');
    return new RegExp('^' + stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\d+$', 'i').test(name);
}

const MIN_USES = 3;
const MIN_SHARE = 0.6;

/** The components of a form that have a name of their own: all that the convention needs of it. */
export interface NameRow { name: string; className: string; line: number }

export function componentNames(dfm: string): NameRow[] {
    const root = parseDfmTree(dfm);
    const out: NameRow[] = [];
    const walk = (n: NonNullable<typeof root>): void => {
        if (n.depth > 0 && !n.anonymous) { out.push({ name: n.name, className: n.className, line: n.startLine }); }
        n.children.forEach(walk);
    };
    if (root) { walk(root); }
    return out;
}

type Rule = { prefix: string; share: number; uses: number };

/** The convention of the project, class by class: the prefix most components of the class carry. */
export function conventionsOf(forms: { names: NameRow[] }[]): Map<string, Rule> {
    const counts = new Map<string, Map<string, number>>();
    for (const f of forms) {
        for (const n of f.names) {
            const p = namePrefix(n.name);
            if (p) { const m = counts.get(n.className) ?? new Map<string, number>(); counts.set(n.className, m); m.set(p, (m.get(p) ?? 0) + 1); }
        }
    }
    const out = new Map<string, Rule>();
    for (const [cls, m] of counts) {
        const total = [...m.values()].reduce((a, b) => a + b, 0);
        const [prefix, uses] = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
        if (total >= MIN_USES && uses / total >= MIN_SHARE) { out.set(cls, { prefix, share: uses / total, uses: total }); }
    }
    return out;
}

export const conventions = (forms: { dfm: string }[]): Map<string, Rule> => conventionsOf(forms.map(f => ({ names: componentNames(f.dfm) })));

/** `explicit` (class → prefix, from the settings) wins over what the project does. */
export function namingIssuesOf(forms: { unit: string; names: NameRow[] }[], explicit: Record<string, string> = {}): NamingIssue[] {
    const rules = conventionsOf(forms);
    for (const [cls, prefix] of Object.entries(explicit)) { rules.set(cls, { prefix, share: 1, uses: 0 }); }
    const out: NamingIssue[] = [];
    for (const f of forms) {
        for (const n of f.names) {
            const rule = rules.get(n.className);
            if (!rule) { continue; }
            const prefix = namePrefix(n.name);
            if (prefix === rule.prefix) { continue; }
            const isDefault = isDefaultName(n.name, n.className);
            const rest = prefix ? n.name.slice(prefix.length) : n.name;
            const suggestion = rule.prefix + rest.charAt(0).toUpperCase() + rest.slice(1);
            out.push({
                unit: f.unit, line: n.line, component: n.name, className: n.className, prefix, expected: rule.prefix, suggestion, isDefault,
                message: isDefault
                    ? `${n.name} is the name the IDE gave: a ${n.className} here is called ${rule.prefix}…`
                    : `${n.name}: a ${n.className} here is called ${rule.prefix}… (${rule.uses ? Math.round(rule.share * 100) + '% of ' + rule.uses : 'settings'}), not ${prefix || 'with no prefix'}…`,
            });
        }
    }
    return out;
}

export const namingIssues = (forms: { unit: string; dfm: string }[], explicit: Record<string, string> = {}): NamingIssue[] =>
    namingIssuesOf(forms.map(f => ({ unit: f.unit, names: componentNames(f.dfm) })), explicit);
