/**
 * Python review rules, with the codes of pyflakes (F…), pycodestyle (E…), flake8-bugbear (B…),
 * pylint (R…, W…) and bandit (B…) for the same problems. Text in, findings out: comments and the
 * inside of strings are blanked first, so a word in a string or a comment is never read as code.
 */
import { ReviewFinding } from './reviewTypes';
import { blankCode, securityRules } from './compilerReview';

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (name: string): RegExp => new RegExp('(?<![\\w.])' + escapeRe(name) + '(?!\\w)', 'g');
const count = (text: string, name: string): number => (text.match(wordRe(name)) ?? []).length;
const indentOf = (l: string): number => l.length - l.trimStart().length;

function balance(l: string): number {
    let n = 0;
    for (const c of l) { if ('([{'.includes(c)) { n++; } else if (')]}'.includes(c)) { n--; } }
    return n;
}

export function reviewPython(lines: string[], fileName: string): ReviewFinding[] {
    const code = blankCode(lines, 'python');
    const joined = code.join('\n');
    const findings: ReviewFinding[] = [];
    const add = (f: Omit<ReviewFinding, 'file'>): void => { findings.push({ ...f, file: fileName }); };
    const scan = (re: RegExp, fn: (m: RegExpExecArray, line: number) => void, source: string[] = code): void => {
        source.forEach((l, i) => {
            const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
            for (let m = g.exec(l); m; m = g.exec(l)) { fn(m, i); if (m[0].length === 0) { g.lastIndex++; } }
        });
    };
    const span = (m: RegExpExecArray): { col: number; endCol: number } => ({ col: m.index, endCol: m.index + m[0].length });
    /** The real text of the lines that hold code: the strings are needed by a few rules. */
    const codeLines = lines.map((l, i) => (code[i].trim() ? l : ''));

    /* ───────── imports ───────── */
    const importLines = new Set<number>();
    const bound: { name: string; line: number; col: number }[] = [];
    for (let i = 0; i < code.length; i++) {
        const l = code[i];
        const plain = /^import\s+(.+)$/.exec(l);
        const from = /^from\s+([\w.]+)\s+import\s+(.*)$/.exec(l);
        if (plain) {
            importLines.add(i);
            for (const part of plain[1].split(',')) {
                const name = part.trim().split(/\s+as\s+/).pop()!.trim().split('.')[0];
                if (/^\w+$/.test(name)) { bound.push({ name, line: i, col: Math.max(0, l.indexOf(name)) }); }
            }
        } else if (from && from[1] !== '__future__') {
            importLines.add(i);
            let names = from[2];
            let last = i;
            if (names.includes('(') && !names.includes(')')) {
                while (last + 1 < code.length && !code[last].includes(')')) { last++; importLines.add(last); names += ' ' + code[last]; }
            }
            if (names.trim().startsWith('*')) {
                add({ severity: 'warning', category: 'Style', message: `from ${from[1]} import * hides where names come from`, line: i, code: 'F403', hint: 'Import the names you use.' });
                continue;
            }
            for (const part of names.replace(/[()]/g, '').split(',')) {
                const name = part.trim().split(/\s+as\s+/).pop()!.trim();
                if (/^\w+$/.test(name)) { bound.push({ name, line: i, col: Math.max(0, l.indexOf(name)) }); }
            }
        }
    }
    if (!/__init__\.py$/i.test(fileName)) {
        const rest = lines.map((l, i) => (importLines.has(i) ? '' : l)).join('\n');
        for (const b of bound) {
            if (!wordRe(b.name).test(rest)) {
                add({ severity: 'warning', category: 'Unused', message: `${b.name} is imported but never used`, line: b.line, col: b.col, endCol: b.col + b.name.length, code: 'F401', hint: 'Remove it from the import.' });
            }
        }
    }

    /* ───────── plain rules ───────── */
    scan(/^\s*except\s*:/, (m, i) => add({ severity: 'warning', category: 'Error handling', message: 'A bare except catches everything, even Ctrl+C and SystemExit', line: i, ...span(m), code: 'E722', hint: 'Catch Exception, or better the exceptions you expect.' }));
    scan(/\bdef\s+\w+\s*\([^)]*=\s*(\[\s*\]|\{\s*\}|set\(\s*\)|list\(\s*\)|dict\(\s*\))/, (m, i) => add({ severity: 'warning', category: 'Correctness', message: `Mutable default argument ${m[1]}: it is shared by every call`, line: i, ...span(m), code: 'B006', hint: 'Default to None and create the list or dict inside the function.' }));
    scan(/[=!]=\s*None\b|\bNone\s*[=!]=/, (m, i) => add({ severity: 'info', category: 'Style', message: 'Compare with None using is / is not', line: i, ...span(m), code: 'E711', hint: 'Write x is None.' }));
    scan(/[=!]=\s*(True|False)\b/, (m, i) => add({ severity: 'info', category: 'Style', message: `Comparing with ${m[1]} using ==`, line: i, ...span(m), code: 'E712', hint: 'Write if x: / if not x:.' }));
    scan(/\bis\s+(?:not\s+)?(?:-?\d|'|")/, (m, i) => add({ severity: 'warning', category: 'Correctness', message: 'is compares identity, not value, for a number or a string', line: i, ...span(m), code: 'F632', hint: 'Use == / !=.' }), codeLines);
    scan(/\bf(["'])((?:(?!\1).)*)\1/, (m, i) => { if (!m[2].includes('{')) { add({ severity: 'info', category: 'Style', message: 'f-string without any placeholder', line: i, ...span(m), code: 'F541', hint: 'Remove the f.' }); } }, codeLines);
    scan(/\b(?:breakpoint\(\)|(?:i?pdb)\.set_trace\(\))/, (m, i) => add({ severity: 'warning', category: 'Debug', message: 'Debugger call left in the code', line: i, ...span(m), code: 'T100', hint: 'Remove it.' }));
    scan(/(?<![\w.])(eval|exec)\s*\(/, (m, i) => add({ severity: 'warning', category: 'Security', message: `${m[1]}() runs any code it is given`, line: i, ...span(m), code: m[1] === 'eval' ? 'B307' : 'B102', hint: 'Use ast.literal_eval or json.loads for data.' }));
    scan(/\bsubprocess\.\w+\([^)]*shell\s*=\s*True/, (m, i) => add({ severity: 'warning', category: 'Security', message: 'subprocess with shell=True: command injection if any part is user input', line: i, ...span(m), code: 'B602', hint: 'Pass a list of arguments and leave shell off.' }), codeLines);
    scan(/\bos\.(system|popen)\s*\(/, (m, i) => add({ severity: 'warning', category: 'Security', message: `os.${m[1]} runs a shell command`, line: i, ...span(m), code: 'B605', hint: 'Use subprocess.run with a list of arguments.' }));
    scan(/^\s*(\w+)\s*=\s*open\s*\(/, (m, i) => {
        if (!new RegExp('\\b' + m[1] + '\\s*\\.\\s*close\\s*\\(').test(joined)) {
            add({ severity: 'warning', category: 'Resources', message: `The file ${m[1]} is opened and never closed`, line: i, ...span(m), code: 'R1732', hint: 'Open it with: with open(…) as f:' });
        }
    });
    scan(/\bexcept\s+[\w.(), ]+\s+as\s+(\w+)\s*:/, (m, i) => {
        if (count(joined, m[1]) === 1) { add({ severity: 'warning', category: 'Unused', message: `The exception ${m[1]} is bound and never used`, line: i, ...span(m), code: 'F841', hint: 'Drop "as ' + m[1] + '", or use it (log it).' }); }
    });

    /* ───────── locals assigned and never read ───────── */
    const reported = new Set<number>();
    code.forEach((l, i) => {
        const def = /^(\s*)(?:async\s+)?def\s+\w+/.exec(l);
        if (!def) { return; }
        const base = def[1].length;
        let end = i + 1;
        while (end < code.length && (!code[end].trim() || indentOf(code[end]) > base)) { end++; }
        const block = code.slice(i + 1, end);
        const text = block.join('\n');
        const globals = new Set<string>();
        for (const g of text.matchAll(/\b(?:global|nonlocal)\s+([\w, ]+)/g)) { g[1].split(',').forEach(n => globals.add(n.trim())); }
        block.forEach((b, k) => {
            const m = /^\s+([A-Za-z_]\w*)\s*(?::[^=]+)?=(?!=)/.exec(b);
            if (!m || m[1].startsWith('_') || globals.has(m[1]) || count(text, m[1]) !== 1 || reported.has(i + 1 + k)) { return; }
            reported.add(i + 1 + k);
            const col = b.indexOf(m[1]);
            add({ severity: 'warning', category: 'Unused', message: `Local variable ${m[1]} is assigned to but never used`, line: i + 1 + k, col, endCol: col + m[1].length, code: 'F841', hint: 'Remove it, or use the value.' });
        });
    });

    /* ───────── code after return, raise, break or continue ───────── */
    for (let i = 0; i < code.length; i++) {
        const l = code[i];
        if (!/^\s*(return|raise|break|continue)\b/.test(l) || balance(l) !== 0 || /\\\s*$/.test(l)) { continue; }
        const ind = indentOf(l);
        let next = i + 1;
        while (next < code.length && !code[next].trim()) { next++; }
        if (next < code.length && indentOf(code[next]) === ind && !/^\s*(else|elif|except|finally|case|[)\]}])/.test(code[next])) {
            add({ severity: 'warning', category: 'Unreachable code', message: 'This code can never run: it follows a return, raise, break or continue', line: next, code: 'W0101', hint: 'Remove it, or the statement before it.' });
        }
    }

    securityRules(lines, code, 'python', add);
    return findings.sort((a, b) => a.line - b.line);
}
