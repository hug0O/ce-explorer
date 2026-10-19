/**
 * Oracle-specific code review rules for PL/SQL source (text based, pure).
 */
import { PlMember, PlUnit, parseDeclarationRegion, parsePlSqlUnits } from './plsqlParse';
import { cleanPlSql, lineOfOffset, lineStartsOf, tokenize } from './plsqlScan';

export interface PlFinding {
    severity: 'info' | 'warning' | 'error';
    category: string;
    message: string;
    line: number;
    memberName?: string;
    className?: string;
    /** The Oracle compiler warning (`PLW-06002`…) that reports the same problem, when there is one. */
    code?: string;
    hint?: string;
}

const MAX_BODY_LINES = 100;
const MAX_PARAMS = 7;

function allMatches(re: RegExp, s: string): RegExpExecArray[] {
    const out: RegExpExecArray[] = [];
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    for (let m = g.exec(s); m; m = g.exec(s)) { out.push(m); if (m[0].length === 0) { g.lastIndex++; } }
    return out;
}

function bodySlice(m: PlMember, starts: number[], clean: string): { text: string; base: number } {
    const from = starts[m.sigEndLine + 1] ?? clean.length;
    const to = starts[m.endLine + 1] ?? clean.length;
    return { text: clean.slice(from, to), base: from };
}

export function reviewPlSqlText(text: string): PlFinding[] {
    const clean = cleanPlSql(text);
    const starts = lineStartsOf(text);
    const findings: PlFinding[] = [];
    const units = parsePlSqlUnits(text);

    for (const unit of units) {
        const subs = unit.members.filter(m => (m.kind === 'procedure' || m.kind === 'function') && !m.isDeclaration);
        for (const m of subs) {
            const { text: body, base } = bodySlice(m, starts, clean);
            const at = (offset: number): number => lineOfOffset(starts, base + offset);
            const add = (severity: PlFinding['severity'], category: string, message: string, line: number, extra: { code?: string; hint?: string } = {}): void => {
                findings.push({ severity, category, message, line, memberName: m.name, className: unit.name, ...extra });
            };

            for (const x of allMatches(/\bwhen\s+others\s+then\s+null\s*;/i, body)) {
                add('error', 'Error handling', `WHEN OTHERS THEN NULL swallows every error in ${m.name}`, at(x.index));
            }
            for (const x of allMatches(/\bwhen\s+others\s+then\b([\s\S]*?)(?=\bwhen\b|\bend\b)/i, body)) {
                if (!/\bnull\s*;\s*$/i.test(x[1].trim()) && !/\braise\b|raise_application_error/i.test(x[1])) {
                    add('warning', 'Error handling', `WHEN OTHERS in ${m.name} neither re-raises nor raises an application error`, at(x.index),
                        { code: 'PLW-06009', hint: 'End the handler with RAISE; or RAISE_APPLICATION_ERROR(…), so the caller learns that it failed.' });
                }
            }
            for (const x of allMatches(/\bselect\s+\*/i, body)) {
                add('info', 'SQL', `SELECT * in ${m.name}: list the columns (a new column would change the behaviour)`, at(x.index));
            }
            const hasSelectInto = /\bselect\b(?:(?!\bbulk\b)[\s\S])*?\binto\b/i.test(body.replace(/\binsert\s+into\b/gi, ''));
            if (hasSelectInto && !/\bexception\b/i.test(body)) {
                add('warning', 'Error handling', `${m.name}: SELECT … INTO without an EXCEPTION section (NO_DATA_FOUND / TOO_MANY_ROWS)`, m.sigEndLine);
            }
            if (unit.kind === 'package body' && !/\bpragma\s+autonomous_transaction\b/i.test(text.slice(starts[m.startLine], starts[m.endLine + 1] ?? text.length))) {
                for (const x of allMatches(/\b(commit|rollback)\s*;/i, body)) {
                    add('warning', 'Transactions', `${x[1].toUpperCase()} inside ${m.name}: leave transaction control to the caller`, at(x.index));
                }
            }
            for (const x of allMatches(/\bexecute\s+immediate\b[^;]*\|\|/i, body)) {
                add('warning', 'Security', `Dynamic SQL built by concatenation in ${m.name}: use bind variables (USING) or DBMS_ASSERT`, at(x.index));
            }
            for (const x of allMatches(/(?:=|<>|!=)\s*null\b/i, body)) {
                const before = body.slice(Math.max(0, x.index - 2), x.index);
                if (before.endsWith(':')) { continue; }
                add('error', 'Logic', `Comparison with NULL using ${x[0].trim().split(/\s/)[0]} is never true: use IS [NOT] NULL`, at(x.index));
            }
            for (const x of allMatches(/\bgoto\b/i, body)) { add('warning', 'Style', `GOTO in ${m.name}`, at(x.index)); }
            for (const x of allMatches(/\bdbms_output\.put_line\b/i, body)) { add('info', 'Debug', `DBMS_OUTPUT left in ${m.name}`, at(x.index)); }
            for (const x of allMatches(/\braise_application_error\s*\(\s*(-?\d+)/i, body)) {
                const code = Number(x[1]);
                if (code > -20000 || code < -20999) { add('error', 'Error handling', `RAISE_APPLICATION_ERROR code ${code} must be between -20999 and -20000`, at(x.index)); }
            }
            for (const x of allMatches(/\bopen\s+([A-Za-z_][\w$#]*)\s*(?:\(|;|for\b)/i, body)) {
                if (!new RegExp('\\bclose\\s+' + x[1] + '\\b', 'i').test(body)) { add('warning', 'Resources', `Cursor ${x[1]} is opened but never closed in ${m.name}`, at(x.index)); }
            }
            if (m.kind === 'function' && !/\breturn\b[^;]*;/i.test(body.replace(/\bReturn\s+[\w$#.%]+\s+is\b/i, ''))) {
                add('error', 'Logic', `Function ${m.name} has no RETURN statement`, m.endLine, { code: 'PLW-05005', hint: 'A function must RETURN a value on every path.' });
            }

            // DML inside a LOOP: one round trip per row.
            const toks = tokenize(body, lineStartsOf(body));
            let depth = 0;
            let reported = false;
            for (let i = 0; i < toks.length && !reported; i++) {
                const up = toks[i].up;
                if (up === 'END' && toks[i + 1]?.up === 'LOOP') { depth--; i++; }
                else if (up === 'LOOP') { depth++; }
                else if (depth > 0 && (up === 'INSERT' || up === 'UPDATE' || up === 'DELETE' || up === 'MERGE') && toks[i - 1]?.up !== 'FOR' && toks[i - 1]?.up !== 'BEFORE') {
                    add('info', 'Performance', `${up} inside a loop in ${m.name}: consider one set-based statement or FORALL`, at(toks[i].start));
                    reported = true;
                }
            }

            // Statements that follow RETURN or RAISE can never run; a plain LOOP with no way out never ends.
            const isStart = (k: number): boolean => k === 0 || [';', 'BEGIN', 'THEN', 'ELSE', 'LOOP'].includes(toks[k - 1].up);
            const loops: { plain: boolean; exits: boolean; line: number }[] = [];
            for (let k = 0; k < toks.length; k++) {
                const up = toks[k].up;
                if ((up === 'RETURN' || up === 'RAISE') && isStart(k)) {
                    let depth = 0;
                    let j = k + 1;
                    while (j < toks.length && !(toks[j].text === ';' && depth <= 0)) {
                        if (toks[j].text === '(') { depth++; } else if (toks[j].text === ')') { depth--; }
                        j++;
                    }
                    const next = toks[j + 1];
                    if (next && !['END', 'EXCEPTION', 'ELSE', 'ELSIF', 'WHEN'].includes(next.up)) {
                        add('warning', 'Logic', `Unreachable code in ${m.name}: it follows ${up}`, at(next.start), { code: 'PLW-06002', hint: 'Remove it, or the statement before it.' });
                    }
                }
                if (up === 'EXIT' || up === 'RETURN' || up === 'RAISE' || up === 'GOTO') { loops.forEach(l => { l.exits = true; }); }
                if (up === 'LOOP' && toks[k - 1]?.up !== 'END') { loops.push({ plain: isStart(k), exits: false, line: at(toks[k].start) }); }
                else if (up === 'END' && toks[k + 1]?.up === 'LOOP') {
                    const l = loops.pop();
                    if (l && l.plain && !l.exits) {
                        add('warning', 'Logic', `LOOP without EXIT or RETURN in ${m.name}: it never ends`, l.line, { hint: 'Add EXIT WHEN <condition>, or use a FOR / WHILE loop.' });
                    }
                }
            }

            const bodyLines = m.endLine - (m.beginLine ?? m.sigEndLine) + 1;
            if (bodyLines > MAX_BODY_LINES) { add('warning', 'Complexity', `${m.name} is ${bodyLines} lines long (more than ${MAX_BODY_LINES}): split it`, m.startLine); }
            if (m.params.length > MAX_PARAMS) { add('info', 'Complexity', `${m.name} takes ${m.params.length} parameters: group them in a record`, m.startLine); }

            // Unused parameters and locals.
            const declStart = starts[m.sigEndLine + 1] ?? text.length;
            const declEnd = starts[m.beginLine ?? m.sigEndLine + 1] ?? text.length;
            const locals = (m.beginLine !== undefined) ? parseDeclarationRegion(text, declStart, declEnd).filter(d => d.kind === 'variable' || d.kind === 'constant') : [];
            const used = (name: string): boolean => {
                const re = new RegExp('(?<![\\w$#.])' + name.replace(/[$#]/g, '\\$&') + '(?![\\w$#])', 'gi');
                const whole = clean.slice(starts[m.startLine], starts[m.endLine + 1] ?? clean.length);
                return (whole.match(re) ?? []).length > 1;
            };
            for (const l of locals) {
                if (!used(l.name)) { findings.push({ severity: 'info', category: 'Unused', message: `Variable ${l.name} is never used in ${m.name}`, line: l.startLine, memberName: m.name, className: unit.name }); }
            }
            for (const p of m.params) {
                if (p.direction === 'in' && !used(p.name)) { add('info', 'Unused', `Parameter ${p.name} of ${m.name} is never used`, m.startLine); }
            }
        }
        findings.push(...unusedPrivate(unit, units, text, clean, starts));
    }
    return findings.sort((a, b) => a.line - b.line);
}

/** Subprograms defined only in a package body (absent from its spec) that nothing calls. */
export function unusedPrivate(unit: PlUnit, units: PlUnit[], text: string, clean: string, starts: number[]): PlFinding[] {
    if (unit.kind !== 'package body') { return []; }
    const bare = (n: string): string => n.replace(/"/g, '').split('.').pop()!.toLowerCase();
    const spec = units.find(u => u.kind === 'package' && bare(u.name) === bare(unit.name));
    if (!spec) { return []; }
    const publicNames = new Set(spec.members.map(m => m.name.toLowerCase()));
    const out: PlFinding[] = [];
    const bodyText = clean.slice(unit.startOffset, unit.endOffset);
    for (const m of unit.members) {
        if ((m.kind !== 'procedure' && m.kind !== 'function') || publicNames.has(m.name.toLowerCase())) { continue; }
        const occurrences = (bodyText.match(new RegExp('(?<![\\w$#.])' + m.name.replace(/[$#]/g, '\\$&') + '(?![\\w$#])', 'gi')) ?? []).length;
        // definition header + END name are the two expected occurrences
        if (occurrences <= 2) {
            out.push({ severity: 'info', category: 'Dead code', message: `Private ${m.kind} ${m.name} is never called`, line: m.startLine, memberName: m.name, className: unit.name });
        }
    }
    void text; void starts;
    return out;
}
