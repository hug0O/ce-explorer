/**
 * Extract-procedure refactoring and variable type inference for PL/SQL.
 */
import { PlMember, parseDeclarationRegion } from './plsqlParse';
import { cleanPlSql, lineStartsOf } from './plsqlScan';

export interface Change {
    offset: number;
    length: number;
    text: string;
}

const KEYWORDS = new Set([
    'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'OUT', 'IF', 'THEN', 'ELSE', 'ELSIF', 'END', 'LOOP', 'FOR', 'WHILE', 'EXIT', 'WHEN', 'CASE', 'BEGIN',
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'COMMIT', 'ROLLBACK', 'RETURN', 'RETURNING', 'RAISE', 'TRUE',
    'FALSE', 'LIKE', 'BETWEEN', 'EXISTS', 'ORDER', 'BY', 'GROUP', 'HAVING', 'AS', 'ON', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'DISTINCT', 'UNION',
    'ALL', 'FETCH', 'OPEN', 'CLOSE', 'CURSOR', 'EXCEPTION', 'OTHERS', 'DECLARE', 'CONTINUE', 'BULK', 'COLLECT', 'FORALL', 'SYSDATE', 'DUAL', 'USING',
]);

/** `VARCHAR2(100)` → `VARCHAR2`: parameters and return types cannot carry a size. */
export function paramType(type: string): string {
    return type.replace(/\s*\(\s*\d+(\s*,\s*\d+)?\s*(byte|char)?\s*\)\s*$/i, '').trim();
}

/** A type usable for a local variable: unsized VARCHAR2 / CHAR need an explicit length. */
export function declType(type: string): string {
    const t = type.trim();
    if (/^n?varchar2$/i.test(t)) { return t + '(4000)'; }
    if (/^n?char$/i.test(t)) { return t + '(1)'; }
    return t;
}

export interface ExtractRequest {
    text: string;
    member: PlMember;
    /** Offsets of the selection in `text`. */
    selStart: number;
    selEnd: number;
    name: string;
    /** Offset of the start of the member (insertion point, before its leading indentation). */
    memberLineStart: number;
}

export type ExtractPlan = { error: string } | { changes: Change[]; params: string[]; movedLocals: string[] };

function lineBounds(text: string, offset: number): { start: number; end: number } {
    const start = text.lastIndexOf('\n', offset - 1) + 1;
    let end = text.indexOf('\n', offset);
    if (end < 0) { end = text.length; }
    return { start, end };
}

/** How the selected code uses a variable: only read (IN), only assigned (OUT) or both, read first (IN OUT). */
export function accessMode(selected: string, name: string): 'IN' | 'OUT' | 'IN OUT' {
    const esc = name.replace(/[$#]/g, '\\$&');
    const occ = new RegExp('(?<![\\w$#.])' + esc + '(?![\\w$#])', 'gi');
    const events: { pos: number; write: boolean }[] = [];
    for (let m = occ.exec(selected); m; m = occ.exec(selected)) {
        const after = selected.slice(m.index + name.length);
        const before = selected.slice(0, m.index);
        const assignment = /^\s*(\([^)]*\))?\s*:=/.test(after);
        const intoTarget = /\binto\s+(?:[\w$#.]+\s*,\s*)*$/i.test(before);
        if (assignment) {
            const rhs = after.slice(after.indexOf(':=') + 2, after.indexOf(';') >= 0 ? after.indexOf(';') : undefined);
            if (new RegExp('(?<![\\w$#.])' + esc + '(?![\\w$#])', 'i').test(rhs)) { events.push({ pos: m.index - 0.5, write: false }); }
            events.push({ pos: m.index, write: true });
        } else if (intoTarget) {
            events.push({ pos: m.index, write: true });
        } else {
            events.push({ pos: m.index, write: false });
        }
    }
    events.sort((x, y) => x.pos - y.pos);
    const firstWrite = events.findIndex(e => e.write);
    if (firstWrite < 0) { return 'IN'; }
    return events.slice(0, firstWrite).some(e => !e.write) ? 'IN OUT' : 'OUT';
}

export function planExtractProcedure(req: ExtractRequest): ExtractPlan {
    const { text, member, name } = req;
    const starts = lineStartsOf(text);
    const lineOf = (o: number): number => { let l = 0; while (l + 1 < starts.length && starts[l + 1] <= o) { l++; } return l; };
    if (!/^[A-Za-z_][\w$#]*$/.test(name)) { return { error: `"${name}" is not a valid procedure name.` }; }
    if (member.isDeclaration || member.beginLine === undefined) { return { error: 'Place the selection inside a subprogram body.' }; }
    if (req.selEnd <= req.selStart) { return { error: 'Select the statements to extract.' }; }
    if (lineOf(req.selStart) <= member.beginLine || lineOf(req.selEnd - 1) >= member.endLine) {
        return { error: 'The selection must lie between the BEGIN and the END of the subprogram.' };
    }

    // Whole lines are extracted, so the call and the new body stay readable.
    const selStart = lineBounds(text, req.selStart).start;
    const selEnd = lineBounds(text, req.selEnd - 1).end;
    const clean = cleanPlSql(text);
    const selected = clean.slice(selStart, selEnd);
    if (/\breturn\b/i.test(selected)) { return { error: 'The selection contains a RETURN: extract only statements that fall through.' }; }
    if (/\b(exit|continue|goto)\b/i.test(selected) && !/\bloop\b/i.test(selected)) { return { error: 'The selection contains an EXIT / CONTINUE / GOTO that leaves it.' }; }

    // Candidates: parameters and local variables of the enclosing subprogram.
    const declStart = starts[member.sigEndLine + 1] ?? text.length;
    const declEnd = starts[member.beginLine] ?? text.length;
    const locals = parseDeclarationRegion(text, declStart, declEnd).filter(d => d.kind === 'variable' || d.kind === 'constant');
    const candidates = [
        ...member.params.map(p => ({ name: p.name, type: p.type, isParam: true, decl: undefined as PlMember | undefined, direction: p.direction })),
        ...locals.map(l => ({ name: l.name, type: l.type ?? 'VARCHAR2(4000)', isParam: false, decl: l as PlMember | undefined, direction: 'in' as const })),
    ];

    const bodyStart = starts[member.beginLine];
    const bodyEnd = starts[member.endLine] ?? text.length;
    const outside = clean.slice(bodyStart, selStart) + ' ' + clean.slice(selEnd, bodyEnd);

    const params: string[] = [];
    const callArgs: string[] = [];
    const movedLocals: string[] = [];
    const removeDecls: Change[] = [];
    const innerDecls: string[] = [];

    for (const c of candidates) {
        const re = new RegExp('(?<![\\w$#.])' + c.name.replace(/[$#]/g, '\\$&') + '(?![\\w$#])', 'gi');
        if (!re.test(selected)) { continue; }
        const usedOutside = new RegExp('(?<![\\w$#.])' + c.name.replace(/[$#]/g, '\\$&') + '(?![\\w$#])', 'i').test(outside);
        if (!c.isParam && !usedOutside && c.decl) {
            const d = c.decl;
            innerDecls.push('    ' + text.slice(d.startOffset, d.endOffset).trim().replace(/\s+/g, ' '));
            const lb = lineBounds(text, d.startOffset);
            removeDecls.push({ offset: lb.start, length: Math.min(text.length, lb.end + 1) - lb.start, text: '' });
            movedLocals.push(c.name);
            continue;
        }
        const mode = accessMode(selected, c.name);
        params.push(`${c.name} ${mode} ${paramType(c.type)}`);
        callArgs.push(c.name);
    }

    const indentMatch = text.slice(selStart, selEnd).match(/^[ \t]*/);
    const callIndent = indentMatch ? indentMatch[0] : '';
    const memberIndent = (text.slice(req.memberLineStart).match(/^[ \t]*/) ?? [''])[0];
    const pad = memberIndent;
    const sig = params.length
        ? `${pad}PROCEDURE ${name}(\n${params.map(p => `${pad}  ${p}`).join(',\n')}\n${pad}) IS`
        : `${pad}PROCEDURE ${name} IS`;
    const bodyLines = text.slice(selStart, selEnd).split('\n').map(l => l.replace(/\r$/, ''));
    const minIndent = Math.min(...bodyLines.filter(l => l.trim()).map(l => (l.match(/^[ \t]*/) ?? [''])[0].length), 99);
    const reindented = bodyLines.map(l => (l.trim() ? pad + '  ' + l.slice(Math.min(minIndent, l.length)) : l)).join('\n');
    const created = [sig, ...innerDecls.map(d => pad + d.trimStart()), `${pad}BEGIN`, reindented, `${pad}END ${name};`, '', ''].join('\n');

    const call = `${callIndent}${name}${callArgs.length ? '(' + callArgs.join(', ') + ')' : ''};`;
    const changes: Change[] = [
        { offset: req.memberLineStart, length: 0, text: created },
        { offset: selStart, length: selEnd - selStart, text: call },
        ...removeDecls,
    ];
    return { changes, params, movedLocals };
}

/* ───────────────────────── variable type inference ───────────────────────── */

export interface KnownVar { name: string; type: string }

function typeOfExpression(expr: string, known: KnownVar[]): string | undefined {
    const e = expr.trim().replace(/;$/, '').trim();
    if (!e) { return undefined; }
    if (/^'(?:[^']|'')*'(\s*\|\|.*)?$/s.test(e) || /^\S.*\|\|/.test(e)) { return 'VARCHAR2(4000)'; }
    if (/^-?\d+$/.test(e)) { return 'PLS_INTEGER'; }
    if (/^-?\d*\.\d+$/.test(e)) { return 'NUMBER'; }
    if (/^(true|false)$/i.test(e)) { return 'BOOLEAN'; }
    if (/^(sysdate|current_date|trunc\s*\(\s*sysdate|to_date\s*\(|add_months\s*\(|last_day\s*\()/i.test(e)) { return 'DATE'; }
    if (/^(systimestamp|current_timestamp|to_timestamp\s*\()/i.test(e)) { return 'TIMESTAMP'; }
    if (/^(to_char|substr|upper|lower|trim|ltrim|rtrim|lpad|rpad|replace|initcap|chr|sqlerrm|user)\b/i.test(e)) { return 'VARCHAR2(4000)'; }
    if (/^(to_number|count|sum|avg|min|max|length|instr|round|trunc|abs|mod|floor|ceil|nvl\s*\(\s*\d|sql%rowcount|sign|power|sqrt)\b/i.test(e)) { return 'NUMBER'; }
    const id = e.match(/^([A-Za-z_][\w$#]*)(\s*\+\s*|\s*-\s*|\s*\*\s*|\s*\/\s*)?/);
    if (id) {
        const k = known.find(v => v.name.toLowerCase() === id[1].toLowerCase());
        if (k) { return `${k.name}%TYPE`; }
    }
    if (/^[\w$#.()]+\s*[-+*/]\s*[\w$#.()]+/.test(e)) { return 'NUMBER'; }
    return undefined;
}

/**
 * Best type for a variable that is used but not declared, from the way the
 * subprogram body uses it: `x := 'text'`, `SELECT col INTO x FROM tbl`
 * (→ `tbl.col%TYPE`), `FETCH c INTO rec` (→ `c%ROWTYPE`), `x := other_var`.
 */
export function inferVariableType(name: string, body: string, known: KnownVar[] = []): string | undefined {
    const clean = cleanPlSql(body);
    const escaped = name.replace(/[$#]/g, '\\$&');
    const nameRe = new RegExp('(?<![\\w$#.])' + escaped + '(?![\\w$#])', 'i');

    // SELECT a, b INTO x, y FROM tbl [alias]
    const sel = /\bselect\b([\s\S]*?)\binto\b([\s\S]*?)\bfrom\b\s+([A-Za-z_][\w$#.]*)(?:\s+(?:as\s+)?([A-Za-z_][\w$#]*))?/gi;
    for (let m = sel.exec(clean); m; m = sel.exec(clean)) {
        const targets = m[2].split(',').map(s => s.trim());
        const idx = targets.findIndex(t => nameRe.test(t) && t.toLowerCase() === name.toLowerCase());
        if (idx < 0) { continue; }
        const cols = splitTop(m[1]);
        const col = cols[idx]?.trim();
        if (!col) { continue; }
        const table = m[3];
        const alias = m[4] && !/^(where|group|order|having|union|connect|start|for|join|left|right|inner|outer|cross)$/i.test(m[4]) ? m[4] : undefined;
        const direct = col.match(/^(?:([A-Za-z_][\w$#]*)\.)?([A-Za-z_][\w$#]*)$/);
        if (direct && (!direct[1] || direct[1].toLowerCase() === (alias ?? table).toLowerCase() || direct[1].toLowerCase() === table.toLowerCase())) {
            return `${table}.${direct[2]}%TYPE`;
        }
        if (/^count\s*\(/i.test(col) || /^(sum|avg|min|max)\s*\(/i.test(col)) { return 'NUMBER'; }
        const t = typeOfExpression(col, known);
        if (t) { return t; }
    }
    const fetch = clean.match(new RegExp('\\bfetch\\s+([A-Za-z_][\\w$#]*)\\s+into\\s+' + escaped + '(?![\\w$#])', 'i'));
    if (fetch) { return `${fetch[1]}%ROWTYPE`; }
    const ret = clean.match(new RegExp('\\breturning\\b[\\s\\S]*?\\binto\\s+' + escaped + '(?![\\w$#])', 'i'));
    if (ret) { return 'NUMBER'; }

    const assign = clean.match(new RegExp('(?<![\\w$#.])' + escaped + '\\s*:=\\s*([^;]+);', 'i'));
    if (assign) { return typeOfExpression(assign[1], known); }
    return undefined;
}

function splitTop(s: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let cur = '';
    for (const ch of s) {
        if (ch === '(') { depth++; } else if (ch === ')') { depth--; }
        if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else { cur += ch; }
    }
    if (cur.trim()) { out.push(cur); }
    return out;
}
