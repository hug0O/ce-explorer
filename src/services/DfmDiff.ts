/**
 * Semantic difference between two versions of a .dfm: the components that were added, removed, moved to another
 * parent or given another class, and the properties and event links that changed, component by component.
 *
 * A text diff of a form is unreadable (the IDE reorders, reindents and rewrites positions); here a component is
 * found by its name, wherever it moved, and a value is compared once its layout is normalised.
 *
 * Pure text in, plain objects out.
 */

export interface DfmEntity {
    name: string;
    className: string;
    /** `Form/Panel1/Button1`: the names from the form down. */
    path: string;
    parentPath: string;
    line: number;
    props: Map<string, { value: string; line: number }>;
    children: DfmEntity[];
}

export type DfmChangeKind = 'added' | 'removed' | 'moved' | 'class' | 'prop' | 'event';

export interface DfmChange {
    kind: DfmChangeKind;
    component: string;
    className: string;
    /** For a property or an event: its name. */
    prop?: string;
    from?: string;
    to?: string;
    /** Position and size (Left, Top, Width, Height, DesignInfo…): the noise of a form. */
    layout?: boolean;
    /** An added or removed component whose parent was added or removed with it: the parent says it all. */
    nested?: boolean;
    /** 0-based line in the new version (the old one for a removed component). */
    line: number;
    side: 'new' | 'old';
}

export interface DfmDiff {
    changes: DfmChange[];
    counts: Record<DfmChangeKind, number>;
    /** Number of changes that only touch the layout. */
    layout: number;
}

const LAYOUT_PROPS = new Set(['left', 'top', 'width', 'height', 'designinfo', 'clientwidth', 'clientheight', 'pixelsperinch', 'textheight', 'taborder', 'oldcreateorder']);

const quoteBalance = (s: string): boolean => (s.match(/'/g) ?? []).length % 2 === 0;

/** Parses every component with every property, the ones that span several lines included (`( … )`, `< … >`, `{ … }`). */
export function parseEntities(dfm: string): DfmEntity | undefined {
    const lines = dfm.split(/\r?\n/);
    const stack: DfmEntity[] = [];
    let root: DfmEntity | undefined;
    const counters = new Map<string, number>();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const obj = /^\s*(?:object|inherited|inline)\s+(?:(\w+)\s*:\s*)?(\w+)/i.exec(line);
        if (obj) {
            const parent = stack[stack.length - 1];
            let name = obj[1];
            if (!name) {
                // a component with no name is told apart by its class and its rank among its siblings
                const key = (parent?.path ?? '') + '|' + obj[2];
                const k = (counters.get(key) ?? 0) + 1;
                counters.set(key, k);
                name = `${obj[2]}#${k}`;
            }
            const node: DfmEntity = { name, className: obj[2], path: parent ? parent.path + '/' + name : name, parentPath: parent?.path ?? '', line: i, props: new Map(), children: [] };
            if (parent) { parent.children.push(node); } else if (!root) { root = node; }
            stack.push(node);
            continue;
        }
        if (/^\s*end\s*$/i.test(line)) { stack.pop(); continue; }
        const top = stack[stack.length - 1];
        if (!top) { continue; }
        const prop = /^(\s*)([A-Za-z_][\w.]*)\s*=\s*(.*)$/.exec(line);
        if (!prop) { continue; }
        let value = prop[3].trim();
        const first = i;
        if (value === '(' || (value.startsWith('(') && !(/\)\s*$/.test(value) && quoteBalance(value)))) {
            while (++i < lines.length) { value += '\n' + lines[i].trim(); if (/\)\s*$/.test(lines[i]) && quoteBalance(lines[i])) { break; } }
        } else if (value.startsWith('{') && !value.endsWith('}')) {
            while (++i < lines.length) { value += lines[i].trim(); if (/\}\s*$/.test(lines[i])) { break; } }
        } else if (/<\s*$/.test(value)) {
            let depth = 1;
            while (depth > 0 && ++i < lines.length) {
                value += '\n' + lines[i].trim();
                if (/=\s*<\s*$/.test(lines[i])) { depth++; }
                else if (/>\s*$/.test(lines[i])) { depth--; }
            }
        }
        top.props.set(prop[2], { value: value.replace(/[ \t]+/g, ' ').trim(), line: first });
    }
    return root;
}

const flatten = (n: DfmEntity, into: Map<string, DfmEntity> = new Map()): Map<string, DfmEntity> => {
    into.set(n.name.toLowerCase(), n);
    n.children.forEach(c => flatten(c, into));
    return into;
};

const parentName = (n: DfmEntity): string => (n.parentPath.split('/').pop() ?? '').toLowerCase();

const isEvent = (prop: string, value: string): boolean => /^On[A-Z]/.test(prop.split('.').pop() ?? '') && /^[A-Za-z_]\w*$/.test(value);

const short = (v: string | undefined): string | undefined => (v === undefined ? undefined : v.length > 120 ? v.slice(0, 117).replace(/\s+$/, '') + '…' : v);

export function diffDfm(before: string, after: string): DfmDiff {
    const a = parseEntities(before);
    const b = parseEntities(after);
    const changes: DfmChange[] = [];
    if (a && b) {
        const olds = flatten(a);
        const news = flatten(b);
        for (const [key, n] of news) {
            const o = olds.get(key);
            if (!o) { changes.push({ kind: 'added', component: n.name, className: n.className, to: n.parentPath, nested: !!n.parentPath && !olds.has(parentName(n)), line: n.line, side: 'new' }); continue; }
            if (o.className !== n.className) { changes.push({ kind: 'class', component: n.name, className: n.className, from: o.className, to: n.className, line: n.line, side: 'new' }); }
            if (o.parentPath.toLowerCase() !== n.parentPath.toLowerCase()) {
                changes.push({ kind: 'moved', component: n.name, className: n.className, from: o.parentPath, to: n.parentPath, line: n.line, side: 'new' });
            }
            const names = new Set([...o.props.keys(), ...n.props.keys()]);
            for (const p of names) {
                const x = o.props.get(p);
                const y = n.props.get(p);
                if (x?.value === y?.value) { continue; }
                const event = isEvent(p, y?.value ?? x!.value);
                changes.push({
                    kind: event ? 'event' : 'prop', component: n.name, className: n.className, prop: p, from: short(x?.value), to: short(y?.value),
                    layout: !event && LAYOUT_PROPS.has(p.toLowerCase()), line: y?.line ?? n.line, side: 'new',
                });
            }
        }
        for (const [key, o] of olds) {
            if (!news.has(key)) { changes.push({ kind: 'removed', component: o.name, className: o.className, from: o.parentPath, nested: !!o.parentPath && !news.has(parentName(o)), line: o.line, side: 'old' }); }
        }
    }
    const counts: Record<DfmChangeKind, number> = { added: 0, removed: 0, moved: 0, class: 0, prop: 0, event: 0 };
    changes.forEach(c => { counts[c.kind]++; });
    return { changes: changes.sort((x, y) => (x.side === y.side ? x.line - y.line : x.side === 'new' ? -1 : 1)), counts, layout: changes.filter(c => c.layout).length };
}
