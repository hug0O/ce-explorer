/**
 * What the Delphi compiler says about a unit, as far as plain text can tell: the warnings (W…),
 * hints (H…) and errors (E…) that do not need the type system, with the numbers the compiler gives
 * them. The rules are conservative: a finding is only made when the text alone shows it, never on a
 * guess about code in other units, so what is not reported here may still be reported by the compiler.
 */
import { ReviewClassInfo, ReviewFinding } from './reviewTypes';
import { PascalRoutine, Statement, blankPascal, escapeRe, layoutOf, lineOfOffset, lineStarts, statementsOf, word } from './pascalReview';

/** Types whose value is garbage until assigned (strings, interfaces and dynamic arrays are cleared by the compiler). */
const SCALARS = /^(Integer|Cardinal|Byte|Word|Boolean|Double|Single|Extended|Int64|UInt64|SmallInt|ShortInt|LongInt|LongWord|NativeInt|NativeUInt|Real|Currency|Char|WideChar|AnsiChar|Pointer|TDateTime|Comp|ByteBool|WordBool|LongBool)$/i;

/** Keywords that only open a block: what follows them is not conditional. */
const OPENERS = /^(?:(?:begin|try|finally|except|repeat)\b\s*)+/i;

const USES_RE = /\buses\b([^;]*);/gi;

interface UsesName { name: string; offset: number }

function usesNames(clause: string, base: number): UsesName[] {
    const out: UsesName[] = [];
    let at = 0;
    for (const piece of clause.split(',')) {
        const name = piece.replace(/\s+in\s+[\s\S]*$/i, '').trim();
        if (name) { out.push({ name, offset: base + at + piece.indexOf(name) }); }
        at += piece.length + 1;
    }
    return out;
}

export function reviewPascalCompiler(lines: string[], routines: PascalRoutine[], classes: ReviewClassInfo[], fileName: string): ReviewFinding[] {
    const code = blankPascal(lines);
    const joined = code.join('\n');
    const starts = lineStarts(joined);
    const findings: ReviewFinding[] = [];
    const add = (f: Omit<ReviewFinding, 'file'>): void => { findings.push({ ...f, file: fileName }); };
    const at = (offset: number): { line: number; col: number } => { const line = lineOfOffset(starts, offset); return { line, col: offset - starts[line] }; };
    const routineAt = (line: number): PascalRoutine | undefined => routines.find(r => line >= r.start && line <= r.end);
    const who = (line: number): { className?: string; memberName?: string } => { const r = routineAt(line); return r ? { className: r.className, memberName: r.name } : {}; };

    /* ───────── the unit as a whole ───────── */
    const unit = /^\s*unit\s+([\w.]+)\s*;/im.exec(joined);
    if (unit) {
        const p = at(unit.index + unit[0].indexOf(unit[1]));
        const base = fileName.replace(/\.pas$/i, '');
        if (/\.pas$/i.test(fileName) && unit[1].toLowerCase() !== base.toLowerCase()) {
            add({ severity: 'error', category: 'Compilation', message: `The unit is called ${unit[1]} but the file is ${fileName}`, line: p.line, col: p.col, endCol: p.col + unit[1].length,
                hint: 'The compiler refuses a unit whose name differs from its file: rename one of them.' });
        }
        if (!/^\s*interface\b/im.test(joined)) {
            add({ severity: 'error', category: 'Compilation', message: 'The unit has no interface section', line: p.line, hint: 'A unit is unit … ; interface … implementation … end.' });
        }
        if (!/^\s*implementation\b/im.test(joined)) {
            add({ severity: 'error', category: 'Compilation', message: 'The unit has no implementation section', line: p.line, hint: 'Add implementation before the routines, and end the unit with end.' });
        }
        const ends = [...joined.matchAll(/^\s*end\s*\./gim)];
        if (ends.length === 0) {
            add({ severity: 'error', category: 'Compilation', message: "The unit does not end with 'end.'", line: Math.max(0, lines.length - 1), hint: 'Every unit finishes with end. (with the dot).' });
        } else {
            const last = ends[ends.length - 1];
            const rest = joined.slice((last.index ?? 0) + last[0].length);
            const extra = /\S/.exec(rest);
            if (extra) {
                const q = at((last.index ?? 0) + last[0].length + extra.index);
                add({ severity: 'warning', category: 'Compilation', message: "Text after the final 'end.' is ignored by the compiler", line: q.line, col: q.col, hint: 'Delete it, or move it above end.', code: 'W1011' });
            }
        }

        // Units listed twice, or again in the implementation after the interface.
        const implAt = joined.search(/^\s*implementation\b/im);
        const interfaceUses = new Set<string>();
        for (const part of [{ from: 0, to: implAt < 0 ? joined.length : implAt, impl: false }, { from: implAt < 0 ? joined.length : implAt, to: joined.length, impl: true }]) {
            const text = joined.slice(part.from, part.to);
            const seen = new Set<string>();
            USES_RE.lastIndex = 0;
            for (const m of text.matchAll(USES_RE)) {
                for (const u of usesNames(m[1], part.from + (m.index ?? 0) + m[0].indexOf(m[1]))) {
                    const key = u.name.toLowerCase();
                    const p = at(u.offset);
                    if (seen.has(key)) {
                        add({ severity: 'error', category: 'Compilation', message: `Unit ${u.name} is listed twice in the uses clause`, line: p.line, col: p.col, endCol: p.col + u.name.length,
                            hint: 'The compiler stops on an identifier declared twice: remove one.' });
                    } else if (part.impl && interfaceUses.has(key)) {
                        add({ severity: 'info', category: 'Redundant', message: `Unit ${u.name} is already in the interface uses clause`, line: p.line, col: p.col, endCol: p.col + u.name.length,
                            hint: 'Remove it from the implementation uses: the interface already makes it visible.' });
                    }
                    seen.add(key);
                    if (!part.impl) { interfaceUses.add(key); }
                }
            }
        }
    }

    // A FOR loop whose bounds are numbers and never let it run.
    for (const m of joined.matchAll(/\bfor\s+\w+\s*:=\s*(-?\d+)\s+(to|downto)\s+(-?\d+)\s+do\b/gi)) {
        const from = Number(m[1]);
        const to = Number(m[3]);
        if ((m[2].toLowerCase() === 'to' && from > to) || (m[2].toLowerCase() === 'downto' && from < to)) {
            const p = at(m.index ?? 0);
            add({ severity: 'warning', category: 'Correctness', message: `This FOR loop executes zero times (${m[1]} ${m[2].toLowerCase()} ${m[3]})`, line: p.line, col: p.col, endCol: p.col + m[0].length, ...who(p.line),
                hint: m[2].toLowerCase() === 'to' ? 'Use downto to count down, or swap the bounds.' : 'Use to to count up, or swap the bounds.', code: 'H2135' });
        }
    }

    /* ───────── routine by routine ───────── */
    const perClass = new Map<string, { stmts: Statement[]; routine: PascalRoutine; locals: Set<string> }[]>();
    for (const r of routines) {
        if (r.end < r.start) { continue; }
        const lay = layoutOf(code, r);
        if (lay.begin < 0) { continue; }
        const stmts = statementsOf(code, lay.begin, r.end);
        const owner = { className: r.className, memberName: r.name };
        if (r.className) {
            const key = r.className.toLowerCase();
            (perClass.get(key) ?? perClass.set(key, []).get(key)!).push({ stmts, routine: r, locals: new Set(lay.locals.map(l => l.name.toLowerCase())) });
        }

        // begin / try / case … end that do not add up.
        let level = 0;
        for (const l of code.slice(lay.begin, r.end + 1)) {
            for (const m of l.matchAll(/\b(begin|try|case|repeat|asm|end|until)\b/gi)) {
                const t = m[1].toLowerCase();
                if (t === 'end' || t === 'until') { level--; } else { level++; }
            }
        }
        if (level !== 0) {
            add({ severity: 'warning', category: 'Compilation', message: `begin / end do not match in ${r.name} (${level > 0 ? level + ' block(s) not closed' : -level + ' end too many'})`, line: r.start, ...owner,
                hint: 'Check for a missing or an extra end, try or case.' });
        }

        // Code after Exit, raise, Abort, Break or Continue can never run.
        for (let k = 0; k + 1 < stmts.length; k++) {
            const here = stmts[k].text.replace(OPENERS, '');
            if (!/^(Exit|Abort|Break|Continue|Halt|raise)\b/i.test(here)) { continue; }
            const next = stmts[k + 1].text.replace(/^\s+/, '');
            if (!next || /^(end|else|except|finally|until|on)\b/i.test(next) || /^[\w.]+\s*(,\s*[\w.]+\s*)*:(?!=)/.test(next)) { continue; }
            add({ severity: 'info', category: 'Unreachable code', message: `This code can never run: it follows ${/^raise/i.test(here) ? 'raise' : here.split(/[\s(]/)[0]}`, line: stmts[k + 1].line, ...owner,
                hint: 'Remove it, or move the Exit / raise below it.' });
        }

        if (lay.nested) { continue; }

        // Variables that are only ever read (W1036) or only ever written (H2077).
        for (const l of lay.locals) {
            const n = escapeRe(l.name);
            const any = new RegExp('(?<![\\w.])' + n + '(?!\\w)', 'gi');
            const target = new RegExp('^' + n + '\\s*:=', 'i');
            const assignment = new RegExp('(?<![\\w.])' + n + '\\s*:=', 'gi');
            const asLoop = new RegExp('\\bfor\\s+' + n + '\\s*:=', 'i');
            const asArg = new RegExp('[(,]\\s*' + n + '\\s*[,)]', 'i');
            let writes = 0;
            let reads = 0;
            let ambiguous = false;
            let firstWrite = -1;
            let firstRead = -1;
            for (const s of stmts) {
                const count = (s.text.match(any) ?? []).length;
                if (!count) { continue; }
                if (asLoop.test(s.text) || asArg.test(s.text)) { ambiguous = true; break; }
                // an assignment can sit inside the statement: in the body of an anonymous method passed to a call
                const assigned = (s.text.match(assignment) ?? []).length;
                if (assigned > 0 || target.test(s.text.replace(OPENERS, ''))) { writes++; if (firstWrite < 0) { firstWrite = s.line; } }
                if (count - assigned > 0) { reads += count - assigned; if (firstRead < 0) { firstRead = s.line; } }
            }
            if (ambiguous) { continue; }
            const col = (line: number): number => Math.max(0, lines[line].search(word(l.name)));
            if (writes > 0 && reads === 0) {
                const created = stmts.some(s => target.test(s.text.replace(OPENERS, '')) && /\.Create\w*\b/i.test(s.text));
                if (!created) {
                    add({ severity: 'info', category: 'Unused', message: `Value assigned to ${l.name} is never used in ${r.name}`, line: firstWrite, col: col(firstWrite), endCol: col(firstWrite) + l.name.length, ...owner,
                        hint: 'Remove the variable and the assignment, or use the value.', code: 'H2077' });
                }
            } else if (writes === 0 && reads > 0 && SCALARS.test(l.type)) {
                add({ severity: 'warning', category: 'Correctness', message: `Variable ${l.name} might not have been initialized in ${r.name}`, line: firstRead, col: col(firstRead), endCol: col(firstRead) + l.name.length, ...owner,
                    hint: `${l.name} is read but never given a value: it holds whatever was in memory. Assign it before use.`, code: 'W1036' });
            }
        }
    }

    // Objects a class creates and never frees.
    for (const [key, group] of perClass) {
        const cls = classes.find(c => c.name.toLowerCase() === key);
        const hasDestructor = group.some(g => g.routine.kind === 'destructor');
        const reported = new Set<string>();
        for (const g of group) {
            for (const s of g.stmts) {
                const m = /^(?:Self\s*\.\s*)?([A-Za-z_]\w*)\s*:=\s*T\w+(?:\.\w+)*\.Create\w*(?:\s*\(([\s\S]*)\))?\s*$/i.exec(s.text.replace(OPENERS, ''));
                if (!m || g.locals.has(m[1].toLowerCase()) || /^Result$/i.test(m[1]) || reported.has(m[1].toLowerCase())) { continue; }
                if (/\b(Self|Owner|AOwner|Application|Parent|AParent|AControl)\b/i.test(m[2] ?? '')) { continue; }
                const field = m[1];
                if (cls && !cls.members.some(x => x.kind === 'field' && x.name.toLowerCase() === field.toLowerCase())) { continue; }
                const n = escapeRe(field);
                const freeRe = new RegExp('(?<![\\w.])(?:Self\\s*\\.\\s*)?' + n + '\\s*\\.\\s*(Free|Destroy|Release|DisposeOf)\\b|\\b(FreeAndNil|FreeObj)\\s*\\(\\s*(?:Self\\s*\\.\\s*)?' + n + '\\s*\\)', 'i');
                const freed = group.some(o => o.stmts.some(t => freeRe.test(t.text)));
                const passed = group.some(o => o.stmts.some(t => new RegExp('[(,]\\s*' + n + '\\s*[,)]', 'i').test(t.text.replace(freeRe, '')) || new RegExp(':=\\s*' + n + '\\s*$', 'i').test(t.text)));
                if (freed || passed) { continue; }
                reported.add(field.toLowerCase());
                const col = Math.max(0, lines[s.line].search(word(field)));
                add({ severity: 'warning', category: 'Memory', message: `${field} is created in ${g.routine.name} but ${g.routine.className} never frees it`, line: s.line, col, endCol: col + field.length,
                    className: g.routine.className, memberName: g.routine.name,
                    hint: hasDestructor ? `Free it in the destructor: ${field}.Free;` : `Add a destructor: destructor Destroy; override; begin ${field}.Free; inherited; end;` });
            }
        }
    }

    /* ───────── classes ───────── */
    const implementationAt = joined.search(/^\s*implementation\b/im);
    const implLine = implementationAt < 0 ? Infinity : at(implementationAt).line;
    /** Uses of a name besides its declaration and, for a method, the header of its implementation (`procedure TFoo.Name`). */
    const uses = (name: string): number => {
        const n = escapeRe(name);
        const all = (joined.match(new RegExp('(?<!\\w)' + n + '(?!\\w)', 'gi')) ?? []).length;
        const headers = (joined.match(new RegExp('\\b(?:procedure|function|constructor|destructor)\\s+\\w+\\s*\\.\\s*' + n + '(?!\\w)', 'gi')) ?? []).length;
        return all - headers - 1;
    };
    for (const cls of classes) {
        if (cls.isInterface) { continue; }
        for (const m of cls.members) {
            if (/^private$/i.test(m.visibility) && !m.isOverride && !m.isVirtual) {
                if ((m.kind === 'field' || m.kind === 'method') && uses(m.name) <= 0) {
                    const col = Math.max(0, lines[m.startLine]?.search(word(m.name)) ?? 0);
                    add({ severity: 'info', category: 'Unused', message: `Private ${m.kind} ${m.name} of ${cls.name} is never used`, line: m.startLine, col, endCol: col + m.name.length, className: cls.name, memberName: m.name,
                        hint: 'Remove it, or make it public if other units use it.', code: 'H2219' });
                }
            }
            const needsBody = m.kind === 'method' || m.kind === 'constructor' || m.kind === 'destructor';
            if (needsBody && m.implStart === undefined && !m.isAbstract && m.startLine < implLine
                && !m.modifiers.some(x => /^(abstract|external|forward|dispatch)$/i.test(x)) && routines.length > 0) {
                add({ severity: 'warning', category: 'Compilation', message: `${cls.name}.${m.name} is declared but has no implementation`, line: m.startLine, className: cls.name, memberName: m.name,
                    hint: 'Write its body in the implementation section, or remove the declaration. The compiler stops with E2065.', code: 'E2065' });
            }
        }
    }
    return findings;
}
