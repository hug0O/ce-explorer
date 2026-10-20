/**
 * The SQL of a Delphi unit: what the .dfm holds (`SQL.Strings = (…)` of a query) and what the code builds
 * (`Q.SQL.Text := '…'`, `Q.SQL.Add('…')`), with the tables and the parameters of each statement, and the
 * check of the parameters the code sets against the ones the SQL declares.
 *
 * Pure text in, plain objects out: nothing here reads a file, so it is quick and easy to test.
 */
import { parseDfmTree } from './DelphiLayout';

export interface SqlEntry {
    source: 'dfm' | 'code' | 'rq';
    /** Name of the unit (file without its extension). */
    unit: string;
    /** 0-based line in the .dfm (source `dfm`) or in the .pas. */
    line: number;
    /** Component of the .dfm, or routine of the unit. */
    owner: string;
    /** The component the statement is for (`Q` of `Q.SQL.Text :=`). */
    component?: string;
    className?: string;
    kind: string;
    /** The SQL as far as it is written in clear; `?` stands for what the code adds at run time. */
    text: string;
    tables: string[];
    params: string[];
    /** True when the code adds something at run time (a variable, a Format…): the text is only part of the statement. */
    dynamic: boolean;
    /** Query number for a call such as `AsyncRQSQL(pool, 46805, …)`. */
    rq?: number;
}

export interface SqlIssue {
    severity: 'warning' | 'info';
    unit: string;
    file: 'pas' | 'dfm';
    line: number;
    message: string;
}

/* ───────── Delphi string syntax ───────── */

/** The value of a Delphi string expression made of literals and character codes: `'abc' #13#10 'def'`. Stops at anything else. */
export function decodeDelphiString(src: string): string {
    let out = '';
    let i = 0;
    while (i < src.length) {
        const c = src[i];
        if (c === '\'') {
            i++;
            while (i < src.length) {
                if (src[i] === '\'') { if (src[i + 1] === '\'') { out += '\''; i += 2; continue; } i++; break; }
                out += src[i++];
            }
        } else if (c === '#') {
            const m = /^#(\$[0-9a-f]+|\d+)/i.exec(src.slice(i));
            if (!m) { break; }
            out += String.fromCharCode(m[1][0] === '$' ? parseInt(m[1].slice(1), 16) : Number(m[1]));
            i += m[0].length;
        } else if (c === ' ' || c === '\t' || c === '+') { i++; }
        else { break; }
    }
    return out;
}

/** The source with its comments blanked (same offsets, newlines kept) and its strings left as they are. */
export function stripPascalComments(src: string): string {
    let out = '';
    let i = 0;
    const blank = (s: string): string => s.replace(/[^\r\n]/g, ' ');
    while (i < src.length) {
        const c = src[i];
        if (c === '\'') {
            let j = i + 1;
            while (j < src.length && src[j] !== '\n') {
                if (src[j] === '\'') { if (src[j + 1] === '\'') { j += 2; continue; } break; }
                j++;
            }
            out += src.slice(i, j + 1);
            i = j + 1;
        } else if (c === '/' && src[i + 1] === '/') {
            const j = src.indexOf('\n', i);
            const end = j < 0 ? src.length : j;
            out += blank(src.slice(i, end));
            i = end;
        } else if (c === '{') {
            const j = src.indexOf('}', i);
            const end = j < 0 ? src.length : j + 1;
            out += blank(src.slice(i, end));
            i = end;
        } else if (c === '(' && src[i + 1] === '*') {
            const j = src.indexOf('*)', i + 2);
            const end = j < 0 ? src.length : j + 2;
            out += blank(src.slice(i, end));
            i = end;
        } else { out += c; i++; }
    }
    return out;
}

/* ───────── what a statement is about ───────── */

/** The SQL without its comments and the inside of its literals. */
export function bare(sql: string): string {
    return sql.replace(/'(?:[^']|'')*'/g, '\'\'').replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
}

export function sqlParams(sql: string): string[] {
    const out: string[] = [];
    for (const m of bare(sql).matchAll(/(?<![:\w]):([A-Za-z_]\w*)/g)) {
        if (!out.some(p => p.toLowerCase() === m[1].toLowerCase())) { out.push(m[1]); }
    }
    return out;
}

const CLAUSE_END = '(?=\\b(?:where|group|order|connect|start|union|having|minus|intersect|model|fetch|offset|for|set|values|select|on|using)\\b|[()]|;|$)';

export function sqlTables(sql: string): string[] {
    const text = bare(sql);
    const out: string[] = [];
    const add = (raw: string): void => {
        const name = raw.trim().split(/\s+/)[0]?.replace(/["]/g, '').toUpperCase();
        if (name && /^[A-Z_][\w$#.]*$/.test(name) && name !== 'DUAL' && !out.includes(name)) { out.push(name); }
    };
    for (const m of text.matchAll(new RegExp('\\bfrom\\s+([^()]*?)' + CLAUSE_END, 'gis'))) {
        for (const part of m[1].split(/\bjoin\b|,/i)) { if (!/^\s*(inner|left|right|full|outer|cross|natural)\s*$/i.test(part)) { add(part.replace(/^\s*(inner|left|right|full|outer|cross|natural)(\s+(outer))?\s+/i, '')); } }
    }
    for (const m of text.matchAll(/\b(?:join|update|into|merge\s+into|table)\s+([A-Za-z_"][\w$#."]*)/gi)) { if (!/^(select|values|set)$/i.test(m[1])) { add(m[1]); } }
    return out;
}

export function sqlKind(sql: string): string {
    const m = /^\s*(?:\(\s*)*(with|select|insert|update|delete|merge|begin|declare|call|exec|execute|create|alter|drop|truncate|commit|rollback|lock|grant)\b/i.exec(bare(sql));
    return m ? (m[1].toLowerCase() === 'with' ? 'select' : m[1].toLowerCase()) : 'other';
}

function entry(base: Omit<SqlEntry, 'kind' | 'tables' | 'params'> & Partial<Pick<SqlEntry, 'kind'>>): SqlEntry {
    return { ...base, kind: base.kind ?? sqlKind(base.text), tables: sqlTables(base.text), params: sqlParams(base.text) };
}

/* ───────── the .dfm ───────── */

const DFM_SQL_PROP = /^\s*((?:Select|Insert|Update|Delete|Refresh|Lock|Recalc)?SQL(?:\.Strings|\.Text)?|CommandText)\s*=\s*(.*)$/i;

export function dfmSql(dfm: string, unit: string): SqlEntry[] {
    const lines = dfm.split(/\r?\n/);
    const out: SqlEntry[] = [];
    const stack: { name: string; className: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const obj = /^\s*(?:object|inherited|inline)\s+(?:(\w+)\s*:\s*)?(\w+)/i.exec(line);
        if (obj) { stack.push({ name: obj[1] ?? obj[2], className: obj[2] }); continue; }
        if (/^\s*end\s*$/i.test(line)) { stack.pop(); continue; }
        const owner = stack[stack.length - 1];
        if (!owner) { continue; }
        // a collection (`ParamData = <` … `>`) or a list of another kind is skipped whole
        if (/=\s*<\s*$/.test(line)) {
            let depth = 1;
            while (depth > 0 && ++i < lines.length) {
                if (/=\s*<\s*$/.test(lines[i])) { depth++; }
                if (/>\s*$/.test(lines[i]) && !/=\s*<\s*$/.test(lines[i])) { depth--; }
            }
            continue;
        }
        const prop = DFM_SQL_PROP.exec(line);
        if (!prop) { continue; }
        // only the component's own property (two spaces deeper than its `object` line)
        const indent = /^\s*/.exec(line)![0].length;
        if (indent !== stack.length * 2) { continue; }
        const first = i;
        let value = prop[2].trim();
        let text = '';
        if (value.startsWith('(')) {
            const parts: string[] = [];
            value = value.slice(1);
            for (;;) {
                const closes = /\)\s*$/.test(value) && (value.match(/'/g) ?? []).length % 2 === 0;
                parts.push(decodeDelphiString(closes ? value.replace(/\)\s*$/, '') : value));
                if (closes || ++i >= lines.length) { break; }
                value = lines[i].trim();
            }
            text = parts.filter((p, k) => p !== '' || k < parts.length - 1).join('\n');
        } else { text = decodeDelphiString(value); }
        if (!text.trim()) { continue; }
        out.push(entry({ source: 'dfm', unit, line: first, owner: owner.name, component: owner.name, className: owner.className, text: text.trim(), dynamic: false }));
    }
    return out;
}

/* ───────── the code ───────── */

interface Routine { name: string; line: number }

function routinesOf(lines: string[]): Routine[] {
    const out: Routine[] = [];
    lines.forEach((l, i) => {
        const m = /^\s*(?:class\s+)?(?:procedure|function|constructor|destructor)\s+(?:\w+\s*\.\s*)?(\w+)/i.exec(l);
        if (m) { out.push({ name: m[1], line: i }); }
    });
    return out;
}

const lineOf = (starts: number[], offset: number): number => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= offset) { lo = mid; } else { hi = mid - 1; } }
    return lo;
};

/** The expression that starts at `from`: up to the `;` (or the closing parenthesis of a call) outside strings and parentheses. */
function expressionAt(src: string, from: number, untilParen: boolean): { text: string; end: number } {
    let depth = 0;
    let i = from;
    while (i < src.length) {
        const c = src[i];
        if (c === '\'') {
            i++;
            while (i < src.length) { if (src[i] === '\'') { if (src[i + 1] === '\'') { i += 2; continue; } break; } i++; }
        } else if (c === '(') { depth++; }
        else if (c === ')') { if (depth === 0 && untilParen) { break; } depth--; }
        else if (c === ';' && depth <= 0) { break; }
        i++;
    }
    return { text: src.slice(from, i), end: i };
}

/** Literals of an expression joined, with what is not a literal reported: `'a' + X + 'b'` → `a?b`. */
function literalsOf(expr: string): { text: string; dynamic: boolean } {
    let text = '';
    let dynamic = false;
    let i = 0;
    while (i < expr.length) {
        const c = expr[i];
        if (c === '\'' || c === '#') {
            const m = /^(?:'(?:[^']|'')*'|#(?:\$[0-9a-f]+|\d+))+/i.exec(expr.slice(i));
            if (!m) { i++; continue; }
            text += decodeDelphiString(m[0]);
            i += m[0].length;
        } else if (/\s|\+/.test(c)) { i++; }
        else if (/[A-Za-z_]/.test(c)) {
            const m = /^[A-Za-z_][\w.]*(?:\s*\((?:[^()]|\([^()]*\))*\))?/.exec(expr.slice(i))!;
            const id = /^[A-Za-z_][\w.]*/.exec(m[0])![0];
            if (/^(CRLF|sLineBreak|LineBreak|NL)$/i.test(id)) { text += '\n'; }
            else if (/^(Format|Concat)$/i.test(id) && m[0].includes('(')) {
                const inner = m[0].slice(m[0].indexOf('(') + 1, -1);
                const lit = /^\s*((?:'(?:[^']|'')*'|#\d+|\s|\+)+)/.exec(inner);
                text += lit ? decodeDelphiString(lit[1]) : '';
                dynamic = true;
            } else { text += '?'; dynamic = true; }
            i += m[0].length;
        } else { i++; }
    }
    return { text, dynamic };
}

export function codeSql(pas: string, unit: string): SqlEntry[] {
    const src = stripPascalComments(pas);
    const lines = pas.split('\n');
    const starts: number[] = [0];
    for (let i = 0; i < pas.length; i++) { if (pas[i] === '\n') { starts.push(i + 1); } }
    const routines = routinesOf(lines);
    const ownerAt = (line: number): string => {
        let name = '';
        for (const r of routines) { if (r.line <= line) { name = r.name; } else { break; } }
        return name;
    };
    const out: SqlEntry[] = [];
    const built = new Set<SqlEntry>();

    const assign = /([A-Za-z_][\w.]*?)\s*\.\s*(?:SQL(?:\s*\.\s*Text|\s*\.\s*Strings\s*\[[^\]]*\])?|CommandText)\s*:=\s*/gi;
    for (let m = assign.exec(src); m; m = assign.exec(src)) {
        const expr = expressionAt(src, m.index + m[0].length, false);
        // `Q.SQL.Text := StringReplace(Q.SQL.Text, …)` only adjusts the SQL that is already there
        if (new RegExp('\\b' + m[1].replace(/\./g, '\\.') + '\\s*\\.\\s*SQL', 'i').test(expr.text)) { continue; }
        const lit = literalsOf(expr.text);
        if (!lit.text.replace(/[\s?]/g, '')) { continue; }
        const line = lineOf(starts, m.index);
        out.push(entry({ source: 'code', unit, line, owner: ownerAt(line), component: m[1], text: lit.text.trim(), dynamic: lit.dynamic }));
    }
    const add = /([A-Za-z_][\w.]*?)\s*\.\s*SQL\s*\.\s*(?:Add|Append|Insert)\s*\(\s*/gi;
    for (let m = add.exec(src); m; m = add.exec(src)) {
        const expr = expressionAt(src, m.index + m[0].length, true);
        const lit = literalsOf(expr.text);
        if (!lit.text.replace(/[\s?]/g, '')) { continue; }
        const line = lineOf(starts, m.index);
        // consecutive Add calls on the same query are one statement
        const last = [...out].reverse().find(e => e.source === 'code' && e.component === m[1] && e.owner === ownerAt(line) && e.line >= line - 12 && built.has(e));
        if (last) {
            last.text = (last.text + '\n' + lit.text).trim();
            last.dynamic = last.dynamic || lit.dynamic;
            last.tables = sqlTables(last.text); last.params = sqlParams(last.text); last.kind = sqlKind(last.text);
            continue;
        }
        const e = entry({ source: 'code', unit, line, owner: ownerAt(line), component: m[1], text: lit.text.trim(), dynamic: lit.dynamic });
        built.add(e);
        out.push(e);
    }
    // queries kept by number: AsyncRQSQL(Pool, 46805, …), fQueryRQSQL(Q, 46810)
    const rq = /\b(\w*RQSQL\w*)\s*\(([^;]*?)\)\s*(?:;|then|do|\bor\b|\band\b|\))/gi;
    for (let m = rq.exec(src); m; m = rq.exec(src)) {
        const n = /(?<![\w.])(\d{4,7})(?![\w.])/.exec(m[2]);
        if (!n) { continue; }
        const line = lineOf(starts, m.index);
        out.push({ source: 'rq', unit, line, owner: ownerAt(line), kind: 'query', text: `${m[1]} → query ${n[1]}`, tables: [], params: [], dynamic: false, rq: Number(n[1]) });
    }
    return out.sort((a, b) => a.line - b.line);
}

export function unitSql(unit: string, pas: string | undefined, dfm: string | undefined): SqlEntry[] {
    return [...(dfm ? dfmSql(dfm, unit) : []), ...(pas ? codeSql(pas, unit) : [])];
}

/* ───────── the parameters ───────── */

/** Parameters the code sets with `Q.ParamByName('x')` against the ones the SQL of the query in the .dfm declares. */
export function sqlParamIssues(unit: string, pas: string, dfm: string): SqlIssue[] {
    const root = parseDfmTree(dfm);
    if (!root) { return []; }
    const src = stripPascalComments(pas);
    const starts: number[] = [0];
    for (let i = 0; i < pas.length; i++) { if (pas[i] === '\n') { starts.push(i + 1); } }
    const issues: SqlIssue[] = [];
    for (const e of dfmSql(dfm, unit)) {
        if (!e.component) { continue; }
        const name = e.component.replace(/[$]/g, '\\$');
        // the code rewrites this query's SQL: what it declares is not the whole truth
        if (new RegExp('(?<![\\w.])' + name + '\\s*\\.\\s*SQL\\b', 'i').test(src)) { continue; }
        const set = new Map<string, { line: number; name: string }>();
        for (const m of src.matchAll(new RegExp('(?<![\\w.])' + name + '\\s*\\.\\s*(?:Params\\s*\\.\\s*)?ParamByName\\s*\\(\\s*\'(\\w+)\'', 'gi'))) {
            if (!set.has(m[1].toLowerCase())) { set.set(m[1].toLowerCase(), { line: lineOf(starts, m.index), name: m[1] }); }
        }
        for (const [p, { line, name: written }] of set) {
            if (!e.params.some(x => x.toLowerCase() === p)) {
                issues.push({ severity: 'warning', unit, file: 'pas', line, message: `${e.component}.ParamByName('${written}'): the SQL of ${e.component} has no parameter :${written}${e.params.length ? ' (it has ' + e.params.map(x => ':' + x).join(', ') + ')' : ''}` });
            }
        }
        const node = (function find(n: ReturnType<typeof parseDfmTree>): typeof n {
            if (!n) { return undefined; }
            if (n.name.toLowerCase() === e.component!.toLowerCase()) { return n; }
            for (const c of n.children) { const h = find(c); if (h) { return h; } }
            return undefined;
        })(root);
        const fed = !!node && (node.props['MasterSource'] !== undefined || node.props['DataSource'] !== undefined);
        if (!fed) {
            for (const p of e.params) {
                if (!set.has(p.toLowerCase())) {
                    issues.push({ severity: 'info', unit, file: 'dfm', line: e.line, message: `${e.component}: parameter :${p} is never given a value in this unit` });
                }
            }
        }
    }
    return issues.sort((a, b) => a.line - b.line);
}
