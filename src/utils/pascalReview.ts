/**
 * Delphi / Pascal review rules, on plain text so they can be tested without VS Code.
 *
 * They stand in for what the Delphi compiler reports as warnings and hints (an unused variable,
 * a function that never sets `Result`…) and for what a reviewer would say about memory
 * (objects created and never freed), error handling, SQL built by concatenation and so on.
 * Each rule is conservative: it reports only what it can see in the routine itself, never a
 * guess about code elsewhere, so that a finding is worth a look.
 */
import { ReviewFinding } from './reviewTypes';

export interface PascalRoutine {
    name: string;
    className?: string;
    kind: 'procedure' | 'function' | 'constructor' | 'destructor';
    returnType?: string;
    params: string[];
    isOverride: boolean;
    isVirtual: boolean;
    /** First and last line (0-based, inclusive) of the implementation: from its header to its closing `end;`. */
    start: number;
    end: number;
}

export const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const word = (name: string): RegExp => new RegExp('(?<![\\w.])' + escapeRe(name) + '(?!\\w)', 'i');

/** Types that look like classes (`TRect.Create(…)`) but are records or other values: nothing to free. */
const VALUE_TYPES = /^(TPoint|TRect|TSize|TGUID|TTimeSpan|TStopwatch|TValue|TPair|TPointF|TRectF|TSizeF|TVector\w*|TMatrix\w*|TDateTime|TDate|TTime|TColor|TBytes|TArray|TFormatSettings)$/i;

/** The source with comments and the inside of string literals blanked: same lines, same columns. */
export function blankPascal(lines: string[]): string[] {
    const out: string[] = [];
    let block: '' | '}' | '*)' = '';
    for (const line of lines) {
        let res = '';
        let i = 0;
        while (i < line.length) {
            if (block) {
                const j = line.indexOf(block, i);
                if (j < 0) { res += ' '.repeat(line.length - i); i = line.length; }
                else { res += ' '.repeat(j + block.length - i); i = j + block.length; block = ''; }
                continue;
            }
            const c = line[i];
            if (c === '\'') {
                let j = i + 1;
                while (j < line.length) {
                    if (line[j] === '\'') { if (line[j + 1] === '\'') { j += 2; continue; } break; }
                    j++;
                }
                const stop = Math.min(j + 1, line.length);
                res += ' '.repeat(stop - i);
                i = stop;
                continue;
            }
            if (c === '/' && line[i + 1] === '/') { res += ' '.repeat(line.length - i); i = line.length; continue; }
            if (c === '{') { block = '}'; res += ' '; i++; continue; }
            if (c === '(' && line[i + 1] === '*') { block = '*)'; res += '  '; i += 2; continue; }
            res += c;
            i++;
        }
        out.push(res);
    }
    return out;
}

export interface Local { name: string; type: string; line: number }

export interface Layout {
    headerEnd: number;
    /** First line of the body (`begin` or `asm`), -1 for a routine without one. */
    begin: number;
    locals: Local[];
    /** A routine declared inside the routine: its own `begin` is not ours, so the locals are not analysed. */
    nested: boolean;
}

export function layoutOf(code: string[], r: PascalRoutine): Layout {
    let depth = 0;
    let headerEnd = r.start;
    for (let i = r.start; i <= r.end && i < code.length; i++) {
        for (const ch of code[i]) { if (ch === '(') { depth++; } else if (ch === ')') { depth--; } }
        if (depth <= 0 && code[i].includes(';')) { headerEnd = i; break; }
        headerEnd = i;
    }
    const locals: Local[] = [];
    let nested = false;
    let section: 'var' | 'other' | '' = '';
    let buf = '';
    let bufLine = -1;
    let begin = -1;
    for (let i = headerEnd + 1; i <= r.end && i < code.length; i++) {
        let text = code[i].trim();
        if (/^(begin|asm)\b/i.test(text)) { begin = i; break; }
        if (!text) { continue; }
        if (/^var\b/i.test(text)) { section = 'var'; text = text.slice(3).trim(); if (!text) { continue; } }
        else if (/^(const|type|label|resourcestring|threadvar)\b/i.test(text)) { section = 'other'; continue; }
        else if (/^(class\s+)?(procedure|function|constructor|destructor)\b/i.test(text)) { nested = true; continue; }
        if (section !== 'var') { continue; }
        if (!buf) { bufLine = i; }
        buf += ' ' + text;
        if (!text.includes(';')) { continue; }
        const m = /^\s*([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s*:\s*([^=;]*)/.exec(buf);
        if (m) {
            for (const name of m[1].split(',')) { locals.push({ name: name.trim(), type: m[2].trim(), line: bufLine }); }
        }
        buf = '';
    }
    return { headerEnd, begin, locals, nested };
}

export interface Statement { text: string; line: number }

/** The statements of a body (cut at `;`), with the line each starts on. */
export function statementsOf(code: string[], from: number, to: number): Statement[] {
    const out: Statement[] = [];
    let text = '';
    let line = -1;
    for (let i = from; i <= to && i < code.length; i++) {
        const parts = code[i].split(';');
        parts.forEach((p, k) => {
            // a statement starts after the keywords that merely open a block
            if (line < 0 && p.replace(/\b(begin|try|finally|except|else|then|do|repeat)\b/gi, ' ').trim()) { line = i; }
            text += (text ? ' ' : '') + p;
            if (k < parts.length - 1) {
                if (text.trim()) { out.push({ text: text.trim(), line: line < 0 ? i : line }); }
                text = '';
                line = -1;
            }
        });
        if (text && !text.trim()) { text = ''; }
    }
    if (text.trim()) { out.push({ text: text.trim(), line: line < 0 ? to : line }); }
    return out;
}

export function lineStarts(text: string): number[] {
    const starts = [0];
    for (let i = 0; i < text.length; i++) { if (text[i] === '\n') { starts.push(i + 1); } }
    return starts;
}

export function lineOfOffset(starts: number[], offset: number): number {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= offset) { lo = mid; } else { hi = mid - 1; }
    }
    return lo;
}

/** Every finding of the Pascal rules for one unit. `lines` is the unit as it is in the editor. */
export function reviewPascal(lines: string[], routines: PascalRoutine[], fileName: string): ReviewFinding[] {
    const code = blankPascal(lines);
    const findings: ReviewFinding[] = [];
    const add = (f: Omit<ReviewFinding, 'file'>): void => { findings.push({ ...f, file: fileName }); };
    const routineAt = (line: number): PascalRoutine | undefined => routines.find(r => line >= r.start && line <= r.end);
    const who = (r?: PascalRoutine): { className?: string; memberName?: string } => (r ? { className: r.className, memberName: r.name } : {});

    for (const r of routines) {
        if (r.end < r.start) { continue; }
        const lay = layoutOf(code, r);
        if (lay.begin < 0) { continue; }
        const body = code.slice(lay.begin, r.end + 1).join('\n');
        const owner = who(r);
        const handler = /^sender$/i.test(r.params[0] ?? '');

        // A function that never says what it returns gives back whatever was in memory: the classic Delphi bug.
        if (r.kind === 'function' || r.returnType) {
            const sets = /\bResult\b|\bExit\s*\(|\braise\b/i.test(body) || new RegExp('(?<![\\w.])' + escapeRe(r.name) + '\\s*:=', 'i').test(body);
            if (!sets) {
                add({ severity: 'warning', category: 'Correctness', message: `Function ${r.name} never assigns Result (nor calls Exit)`, line: r.start, ...owner,
                    hint: 'Assign Result on every path, or make it a procedure.', code: 'W1035' });
            }
        }

        // An empty body is an unimplemented stub.
        const raw = lines.slice(lay.begin, r.end + 1).join('\n').replace(/^\s*(begin|asm)\b/i, '').replace(/\bend\s*;?\s*$/i, '').trim();
        if (raw.length === 0) {
            add({ severity: 'info', category: 'Stub', message: `${r.name} has an empty body (unimplemented)`, line: r.start, ...owner });
        }

        // Overriding a constructor or a destructor without calling inherited leaves the ancestor's part of the object unbuilt / undestroyed.
        if (r.isOverride && (r.kind === 'constructor' || r.kind === 'destructor') && raw.length > 0 && !/\binherited\b/i.test(body)) {
            add({ severity: 'warning', category: 'Correctness', message: `${r.kind === 'constructor' ? 'Constructor' : 'Destructor'} ${r.name} overrides its ancestor's but never calls inherited`, line: r.start, ...owner,
                hint: r.kind === 'constructor' ? 'Call inherited Create(…) first.' : 'Call inherited at the end, so that the ancestor can free what it owns.' });
        }

        // Too long, too many parameters, nested too deeply.
        const length = r.end - r.start + 1;
        if (length > 60) {
            add({ severity: 'warning', category: 'Complexity', message: `${r.name} is ${length} lines long`, line: r.start, ...owner, hint: 'Split it into smaller routines, each with one job.' });
        } else if (length > 30) {
            add({ severity: 'info', category: 'Complexity', message: `${r.name} is ${length} lines long`, line: r.start, ...owner, hint: 'A routine that fits on a screen is easier to read and to test.' });
        }
        if (r.params.length > 6) {
            add({ severity: 'info', category: 'Style', message: `${r.name} takes ${r.params.length} parameters`, line: r.start, ...owner, hint: 'Group related parameters in a record or a class.' });
        }
        let level = 0;
        let deepest = 0;
        let deepestLine = lay.begin;
        const bodyLines = code.slice(lay.begin, r.end + 1);
        bodyLines.forEach((l, k) => {
            for (const m of l.matchAll(/\b(begin|try|case|repeat|asm|end|until)\b/gi)) {
                const t = m[1].toLowerCase();
                if (t === 'end' || t === 'until') { level--; } else { level++; if (level > deepest) { deepest = level; deepestLine = lay.begin + k; } }
            }
        });
        if (deepest >= 6) {
            add({ severity: 'info', category: 'Style', message: `${r.name} nests blocks ${deepest} levels deep`, line: deepestLine, ...owner, hint: 'Return early, or move the inner part into its own routine.' });
        }

        if (lay.nested) { continue; }

        // Unused locals and parameters.
        const bodyAfterBegin = body;
        for (const l of lay.locals) {
            if (!word(l.name).test(bodyAfterBegin)) {
                const col = Math.max(0, lines[l.line].search(word(l.name)));
                add({ severity: 'info', category: 'Unused', message: `Variable ${l.name} is declared but never used in ${r.name}`, line: l.line, col, endCol: col + l.name.length, ...owner,
                    hint: 'Remove it.', code: 'H2164' });
            }
        }
        if (!handler && !r.isOverride && !r.isVirtual) {
            for (const p of r.params) {
                if (p && !word(p).test(bodyAfterBegin)) {
                    const col = Math.max(0, lines[r.start].search(word(p)));
                    add({ severity: 'info', category: 'Unused', message: `Parameter ${p} is never used in ${r.name}`, line: r.start, col: col || undefined, endCol: col ? col + p.length : undefined, ...owner,
                        hint: 'Remove it, or use it. (Overrides, virtual methods and event handlers keep theirs.)' });
                }
            }
        }

        // Objects created and not freed, or freed without try … finally.
        const stmts = statementsOf(code, lay.begin, r.end);
        for (const l of lay.locals) {
            if (!/^T[A-Z]/.test(l.type) || VALUE_TYPES.test(l.type)) { continue; }
            const n = escapeRe(l.name);
            const created = stmts.findIndex(s => new RegExp('(?<![\\w.])' + n + '\\s*:=\\s*T\\w+(?:\\.\\w+)*\\.Create\\w*(?!\\w)', 'i').test(s.text));
            if (created < 0) { continue; }
            const cs = stmts[created];
            const args = /\.Create\w*\s*\(([\s\S]*)\)\s*$/i.exec(cs.text)?.[1] ?? '';
            if (/\b(Self|Owner|AOwner|Application|Parent|AParent|AControl)\b/i.test(args)) { continue; }
            const freeRe = new RegExp('(?<![\\w.])' + n + '\\s*\\.\\s*(Free|Destroy|Release|DisposeOf)\\b|\\b(FreeAndNil|FreeObj)\\s*\\(\\s*' + n + '\\s*\\)', 'i');
            const freed = stmts.findIndex((s, i) => i > created && freeRe.test(s.text));
            // handed over to something else: assigned to it, returned or passed on
            const handedOver = stmts.some((s, i) => i !== created && (new RegExp(':=\\s*' + n + '\\s*$|:=\\s*' + n + '\\s*[,)]', 'i').test(s.text)
                || new RegExp('[(,]\\s*' + n + '\\s*[,)]', 'i').test(s.text.replace(freeRe, ''))));
            const col = Math.max(0, lines[cs.line].search(word(l.name)));
            if (freed < 0 && !handedOver) {
                add({ severity: 'warning', category: 'Memory', message: `${l.name} is created (${l.type}.Create) but never freed in ${r.name}`, line: cs.line, col, endCol: col + l.name.length, ...owner,
                    hint: `Free it in a finally block: ${l.name} := ${l.type}.Create; try … finally ${l.name}.Free; end;` });
            } else if (freed >= 0 && !stmts.slice(created, freed + 1).some(s => /\bfinally\b/i.test(s.text))) {
                add({ severity: 'info', category: 'Memory', message: `${l.name} is freed without try … finally in ${r.name}`, line: cs.line, col, endCol: col + l.name.length, ...owner,
                    hint: `If something raises between Create and Free, ${l.name} leaks: put the code in try … finally ${l.name}.Free; end.` });
            }
        }
    }

    // File-wide rules: they apply wherever the code is, inside a routine or not.
    const joined = code.join('\n');
    const starts = lineStarts(joined);
    const at = (offset: number): { line: number; col: number } => { const line = lineOfOffset(starts, offset); return { line, col: offset - starts[line] }; };

    for (const m of joined.matchAll(/\bexcept\b\s*\bend\b/gi)) {
        const p = at(m.index);
        add({ severity: 'warning', category: 'Error handling', message: 'Empty except block: every exception is swallowed', line: p.line, col: p.col, endCol: p.col + 6, ...who(routineAt(p.line)),
            hint: 'Handle the exception you expect (on E: EDatabaseError do …), log it, or let it through.' });
    }
    for (const m of joined.matchAll(/\bwith\b/gi)) {
        const p = at(m.index);
        add({ severity: 'info', category: 'Style', message: 'with statement: it is unclear which object a name belongs to', line: p.line, col: p.col, endCol: p.col + 4, ...who(routineAt(p.line)),
            hint: 'Use a local variable instead, so that Edit1.Text and Query1.Text cannot be mixed up.' });
    }
    for (const m of joined.matchAll(/\b(then|do)\s*;/gi)) {
        const p = at(m.index);
        add({ severity: 'warning', category: 'Correctness', message: `Empty statement after ${m[1].toLowerCase()}: the next statement always runs`, line: p.line, col: p.col, endCol: p.col + m[1].length + 1, ...who(routineAt(p.line)),
            hint: 'Remove the semicolon, or put the statement after it in a begin … end block.' });
    }

    // SQL assembled by hand: injection, and a new statement for the database to parse every time.
    for (let i = 0; i < code.length; i++) {
        if (!/\.SQL\b|\bCommandText\b|\bSQL\.(Text|Add|Strings)\b/i.test(code[i])) { continue; }
        let stmt = '';
        let last = i;
        for (let k = i; k < Math.min(code.length, i + 8); k++) {
            stmt += (stmt ? '\n' : '') + lines[k];
            last = k;
            if (code[k].includes(';')) { break; }
        }
        const literalsOut = stmt.replace(/'(?:[^']|'')*'/g, '\'\'');
        const concatenates = /\+\s*(?!'')[A-Za-z_@(]|[A-Za-z_)\]]\s*\+/.test(literalsOut);
        const formats = /\bFormat\s*\(/i.test(literalsOut) && /%[-\d.]*[sdfxu]/i.test(stmt);
        if (concatenates || formats) {
            const quoted = /\bQuotedStr\s*\(/i.test(literalsOut) || /\bAnsiQuotedStr\s*\(/i.test(literalsOut);
            const col = Math.max(0, lines[i].search(/\bSQL\b|\bCommandText\b/i));
            add({ severity: quoted ? 'info' : 'warning', category: 'Security',
                message: quoted ? 'SQL built by concatenation (values quoted with QuotedStr)' : 'SQL built by concatenation or Format: open to SQL injection', line: i, col, endCol: col + 3, ...who(routineAt(i)),
                hint: 'Use parameters: SQL.Text := \'select … where id = :id\'; ParamByName(\'id\').Value := …  The database also reuses the plan.' });
        }
        i = last;
    }
    return findings;
}
