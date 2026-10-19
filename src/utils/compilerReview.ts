/**
 * Compiler and linter style rules for the languages of the extension other than Pascal and PL/SQL:
 * TypeScript / JavaScript, Java, C#, C++, Go and Rust (Python is in pythonReview). Each rule carries
 * the code the usual tool gives the same problem (`TS6133`, `CS0168`, `-Wunused-variable`, `errcheck`…),
 * so a finding can be looked up, silenced or fixed the way that tool's users would.
 *
 * Plain text in, findings out. Comments and the inside of strings are blanked first, so a word in a
 * comment or a string is never read as code. The rules are conservative: they report what the text
 * alone shows, and leave the rest to the real compiler.
 */
import { ReviewClassInfo, ReviewFinding } from './reviewTypes';

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (name: string, flags = 'g'): RegExp => new RegExp('(?<![\\w$])' + escapeRe(name) + '(?![\\w$])', flags);
const countWord = (text: string, name: string): number => (text.match(wordRe(name)) ?? []).length;

/** The code of a file with comments and the inside of string literals blanked: same lines, same columns. */
export function blankCode(lines: string[], lang: string): string[] {
    const py = lang === 'python';
    const tsjs = lang === 'typescript' || lang === 'javascript';
    const stringQuote = py || tsjs;
    const out: string[] = [];
    // a comment that runs over several lines ('*/'), a Python triple quote, a Go raw string
    let block = '';
    // template literals of TypeScript / JavaScript: 'tmpl' while in their text, a brace depth while in a ${ … }, whose code is kept
    const stack: ('tmpl' | number)[] = [];
    for (const line of lines) {
        let res = '';
        let i = 0;
        const blank = (n: number): void => { res += ' '.repeat(n); };
        while (i < line.length) {
            if (block) {
                const j = line.indexOf(block, i);
                if (j < 0) { blank(line.length - i); i = line.length; }
                else { blank(j + block.length - i); i = j + block.length; block = ''; }
                continue;
            }
            const top = stack[stack.length - 1];
            const c = line[i];
            if (top === 'tmpl') {
                if (c === '\\') { const n = Math.min(2, line.length - i); blank(n); i += n; }
                else if (c === '`') { stack.pop(); blank(1); i++; }
                else if (c === '$' && line[i + 1] === '{') { stack.push(1); blank(2); i += 2; }
                else { blank(1); i++; }
                continue;
            }
            if (typeof top === 'number') {
                if (c === '{') { stack[stack.length - 1] = top + 1; }
                else if (c === '}') {
                    if (top === 1) { stack.pop(); blank(1); i++; continue; }
                    stack[stack.length - 1] = top - 1;
                }
            }
            if (py) {
                if (c === '#') { blank(line.length - i); break; }
                if (line.startsWith('"""', i) || line.startsWith('\'\'\'', i)) { block = line.slice(i, i + 3); blank(3); i += 3; continue; }
            } else {
                if (c === '/' && line[i + 1] === '/') { blank(line.length - i); break; }
                if (c === '/' && line[i + 1] === '*') { block = '*/'; blank(2); i += 2; continue; }
                if (c === '`' && tsjs) { stack.push('tmpl'); blank(1); i++; continue; }
                if (c === '`' && lang === 'go') { block = '`'; blank(1); i++; continue; }
                if (c === '@' && line[i + 1] === '"' && lang === 'csharp') {
                    let j = i + 2;
                    while (j < line.length) { if (line[j] === '"') { if (line[j + 1] === '"') { j += 2; continue; } break; } j++; }
                    const stop = Math.min(j + 1, line.length);
                    blank(stop - i);
                    i = stop;
                    continue;
                }
                // a regular expression literal: after an operator or an opening bracket a / starts one, after a name or a ) it divides
                if (c === '/' && tsjs && (/(?:^|[(,=:[!&|?{};+*%<>~^-])\s*$/.test(res) || /\b(?:return|typeof|case|delete|void|throw|in|of)\s*$/.test(res))) {
                    let j = i + 1;
                    let inClass = false;
                    while (j < line.length) {
                        const ch = line[j];
                        if (ch === '\\') { j += 2; continue; }
                        if (ch === '[') { inClass = true; } else if (ch === ']') { inClass = false; } else if (ch === '/' && !inClass) { break; }
                        j++;
                    }
                    if (j < line.length) {
                        let k = j + 1;
                        while (k < line.length && /[a-z]/.test(line[k])) { k++; }
                        blank(k - i);
                        i = k;
                        continue;
                    }
                }
            }
            if (c === '"' || (c === '\'' && stringQuote)) {
                let j = i + 1;
                while (j < line.length && line[j] !== c) { j += line[j] === '\\' ? 2 : 1; }
                const stop = Math.min(j + 1, line.length);
                blank(stop - i);
                i = stop;
                continue;
            }
            if (c === '\'') {
                // a character literal ('a', '\n'); a Rust lifetime ('a) has no closing quote and stays
                const m = /^'(\\.[^']*|[^\\'])'/.exec(line.slice(i));
                if (m) { blank(m[0].length); i += m[0].length; continue; }
            }
            res += c;
            i++;
        }
        out.push(res);
    }
    return out;
}

const BRACE_LANGS = ['typescript', 'javascript', 'java', 'csharp', 'cpp', 'go', 'rust'];

export function reviewLanguage(lines: string[], lang: string, fileName: string): ReviewFinding[] {
    if (!BRACE_LANGS.includes(lang)) { return []; }
    const code = blankCode(lines, lang);
    const joined = code.join('\n');
    const findings: ReviewFinding[] = [];
    const add = (f: Omit<ReviewFinding, 'file'>): void => { findings.push({ ...f, file: fileName }); };
    const ts = lang === 'typescript' || lang === 'javascript';
    const header = /\.(h|hpp|hh|hxx)$/i.test(fileName);
    const isC = /\.c$/i.test(fileName);

    /** Every match of `re` on the lines of code, with its line and columns. */
    const scan = (re: RegExp, fn: (m: RegExpExecArray, line: number) => void, source: string[] = code): void => {
        source.forEach((l, i) => {
            const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
            for (let m = g.exec(l); m; m = g.exec(l)) { fn(m, i); if (m[0].length === 0) { g.lastIndex++; } }
        });
    };
    const span = (m: RegExpExecArray): { col: number; endCol: number } => ({ col: m.index, endCol: m.index + m[0].length });

    /* ───────── TypeScript / JavaScript ───────── */
    if (ts) {
        scan(/(?<![=!<>])(==|!=)(?!=)/, (m, i) => {
            const after = code[i].slice(m.index + 2);
            const before = code[i].slice(0, m.index);
            if (/^\s*(null|undefined)\b/.test(after) || /\b(null|undefined)\s*$/.test(before)) { return; }
            add({ severity: 'info', category: 'Style', message: `${m[1]} compares after converting the types`, line: i, ...span(m), code: 'eqeqeq',
                hint: `Use ${m[1]}= : 0 == '' and null == undefined are true.` });
        });
        scan(/^\s*var\s+\w/, (m, i) => add({ severity: 'info', category: 'Style', message: 'var is function-scoped and hoisted', line: i, col: m[0].indexOf('var'), endCol: m[0].indexOf('var') + 3, code: 'no-var',
            hint: 'Use const, or let if the variable changes.' }));
        scan(/\bconsole\.(log|debug|info|trace)\s*\(/, (m, i) => add({ severity: 'info', category: 'Debug', message: `console.${m[1]} left in the code`, line: i, ...span(m), code: 'no-console',
            hint: 'Remove it, or use the logger of the application.' }));
        scan(/\bdebugger\b/, (m, i) => add({ severity: 'warning', category: 'Debug', message: 'debugger statement', line: i, ...span(m), code: 'no-debugger', hint: 'Remove it before it reaches production.' }));
        if (lang === 'typescript') {
            scan(/:\s*any\b|\bas\s+any\b|<any>/, (m, i) => {
                if (findings.some(x => x.code === '@typescript-eslint/no-explicit-any' && x.line === i)) { return; }
                add({ severity: 'info', category: 'Types', message: 'any turns the type checking off', line: i, ...span(m), code: '@typescript-eslint/no-explicit-any', hint: 'Use the real type, or unknown and narrow it.' });
            });
        }
        scan(/@ts-ignore|@ts-nocheck|eslint-disable/, (m, i) => add({ severity: 'info', category: 'Style', message: `${m[0]} hides what the checker found`, line: i, ...span(m), code: m[0] === 'eslint-disable' ? 'eslint-comments/no-use' : 'ban-ts-comment',
            hint: 'Fix the cause, or at least say why in the comment.' }), lines.map((l, i) => (code[i].trim() === '' && /\/\/|\/\*/.test(l) ? l : '')));
        scan(/\beval\s*\(|\bnew\s+Function\s*\(/, (m, i) => add({ severity: 'warning', category: 'Security', message: 'Code built from a string and run', line: i, ...span(m), code: 'no-eval',
            hint: 'Parse the data (JSON.parse) or call a function directly.' }));
        scan(/\.(innerHTML|outerHTML)\s*=(?!=)|\bdocument\.write\s*\(/, (m, i) => add({ severity: 'warning', category: 'Security', message: 'HTML written from a string: cross-site scripting if any part comes from a user', line: i, ...span(m), code: 'CWE-79',
            hint: 'Use textContent, or sanitize the markup.' }));
        scan(/\b(?:if\s*\([^)]*\)|else|finally|while\s*\([^)]*\)|for\s*\([^)]*\))\s*\{\s*\}/, (m, i) => add({ severity: 'warning', category: 'Correctness', message: 'Empty block', line: i, ...span(m), code: 'no-empty',
            hint: 'Fill it in, or remove it. A comment inside tells the reader it is on purpose.' }));
        scan(/\.forEach\(\s*async\b/, (m, i) => add({ severity: 'warning', category: 'Correctness', message: 'forEach does not wait for an async callback', line: i, ...span(m), code: '@typescript-eslint/no-misused-promises',
            hint: 'Use for … of with await, or Promise.all(items.map(async …)).' }));
        scan(/\bparseInt\(\s*[^,()]+\)/, (m, i) => add({ severity: 'info', category: 'Correctness', message: 'parseInt without a radix', line: i, ...span(m), code: 'radix', hint: 'Write parseInt(value, 10).' }));

        // imports nobody uses
        const importRe = /\bimport\s+(type\s+)?([^'";]*?)\s*from\s*['"][^'"]+['"]\s*;?/g;
        // the paths are in strings, which are blanked in the code: the imports are read from the real text
        const original = lines.join('\n');
        let stripped = joined;
        const bound: { name: string; offset: number }[] = [];
        for (const m of original.matchAll(importRe)) {
            if (joined.slice(m.index ?? 0, (m.index ?? 0) + 6) !== 'import') { continue; }
            const clause = m[2];
            const base = (m.index ?? 0) + m[0].indexOf(clause);
            const named = /\{([^}]*)\}/.exec(clause);
            const rest = clause.replace(/\{[^}]*\}/, '');
            const def = /^\s*([A-Za-z_$][\w$]*)\s*,?\s*$/.exec(rest.replace(/\*\s+as\s+[\w$]+/, ''));
            if (def) { bound.push({ name: def[1], offset: base + rest.indexOf(def[1]) }); }
            const ns = /\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(rest);
            if (ns) { bound.push({ name: ns[1], offset: base + rest.indexOf(ns[1]) }); }
            if (named) {
                let at = base + clause.indexOf('{') + 1;
                for (const part of named[1].split(',')) {
                    const name = part.replace(/^\s*type\s+/, '').split(/\s+as\s+/).pop()!.trim();
                    if (/^[A-Za-z_$][\w$]*$/.test(name)) { bound.push({ name, offset: at + part.indexOf(name) }); }
                    at += part.length + 1;
                }
            }
            stripped = stripped.slice(0, m.index) + ' '.repeat(m[0].length) + stripped.slice((m.index ?? 0) + m[0].length);
        }
        const starts = lineStartsOf(joined);
        for (const b of bound) {
            if (countWord(stripped, b.name) === 0) {
                const line = lineOfOffset(starts, b.offset);
                add({ severity: 'warning', category: 'Unused', message: `Import ${b.name} is never used`, line, col: b.offset - starts[line], endCol: b.offset - starts[line] + b.name.length, code: 'TS6133',
                    hint: 'Remove it from the import.' });
            }
        }
        // locals nobody reads
        scan(/^\s*(?!export\b)(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;]+)?=/, (m, i) => {
            if (m[1].startsWith('_') || countWord(joined, m[1]) > 1) { return; }
            const col = code[i].indexOf(m[1]);
            add({ severity: 'info', category: 'Unused', message: `${m[1]} is declared but its value is never read`, line: i, col, endCol: col + m[1].length, code: 'TS6133', hint: 'Remove it.' });
        });
    }

    /* ───────── Java ───────── */
    if (lang === 'java') {
        scan(/\bSystem\.(out|err)\.(print|println|printf)\s*\(/, (m, i) => add({ severity: 'info', category: 'Debug', message: `System.${m[1]}.${m[2]} left in the code`, line: i, ...span(m), code: 'SystemPrintln', hint: 'Use a logger.' }));
        scan(/\.printStackTrace\s*\(\s*\)/, (m, i) => add({ severity: 'info', category: 'Error handling', message: 'printStackTrace writes to the console and handles nothing', line: i, ...span(m), code: 'AvoidPrintStackTrace', hint: 'Log the exception with the logger, or rethrow it.' }));
        scan(/==\s*"|"\s*[!=]=/, (m, i) => add({ severity: 'warning', category: 'Correctness', message: 'Strings compared with == / != compare references, not text', line: i, ...span(m),
            hint: 'Use equals: "x".equals(value).' }), lines.map((l, i) => (code[i].trim() ? l : '')));
        scan(/\bnew\s+(Integer|Long|Short|Byte|Double|Float|Boolean|Character)\s*\(/, (m, i) => add({ severity: 'warning', category: 'Deprecated', message: `new ${m[1]}(…) is deprecated for removal`, line: i, ...span(m), code: 'removal', hint: `Use ${m[1]}.valueOf(…).` }));
        scan(/\bvoid\s+finalize\s*\(/, (m, i) => add({ severity: 'warning', category: 'Deprecated', message: 'finalize() is deprecated for removal', line: i, ...span(m), code: 'removal', hint: 'Use try-with-resources or a Cleaner.' }));
        scan(/\b(?:List|ArrayList|LinkedList|Map|HashMap|TreeMap|Set|HashSet|Collection|Iterator)\s+[a-z_]\w*\s*[=;,)]|\bnew\s+(?:ArrayList|HashMap|HashSet|LinkedList|TreeMap)\s*\(/, (m, i) => { if (!findings.some(x => x.code === 'rawtypes' && x.line === i)) { add({ severity: 'info', category: 'Types', message: 'Raw type: the element type is missing', line: i, ...span(m), code: 'rawtypes',
            hint: 'Write List<String>, or new ArrayList<>().' }); } });
        scan(/\bcatch\s*\(\s*(Exception|Throwable|RuntimeException)\s+\w+\s*\)/, (m, i) => add({ severity: 'info', category: 'Error handling', message: `Catching ${m[1]} also catches the errors you did not expect`, line: i, ...span(m), code: 'IllegalCatch',
            hint: 'Catch the specific exceptions the code can throw.' }));
        const ser = /\bimplements\b[^{]*\bSerializable\b/.exec(joined);
        if (ser && !/\bserialVersionUID\b/.test(joined)) {
            const line = lineOfOffset(lineStartsOf(joined), ser.index);
            add({ severity: 'info', category: 'Compatibility', message: 'Serializable class without serialVersionUID', line, code: 'serial', hint: 'Declare private static final long serialVersionUID, or a change of the class breaks the stored data.' });
        }
        leaks(/\b(\w+)\s*=\s*new\s+(FileInputStream|FileOutputStream|FileReader|FileWriter|BufferedReader|BufferedWriter|Scanner|Socket|ServerSocket|PrintWriter|InputStreamReader|OutputStreamWriter|ZipFile)\s*\(/, 'close', 'resource',
            'Open it in try-with-resources: try (X x = new X(…)) { … }', (l) => /\btry\s*\(/.test(l));
        unusedLocals(/^\s*(?:final\s+)?(?:int|long|short|byte|boolean|double|float|char|String|var|[A-Z]\w*(?:<[^;=()]*>)?(?:\[\])*)\s+([a-z_]\w*)\s*(?:=[^;]*)?;\s*$/, undefined);
    }

    /* ───────── C# ───────── */
    if (lang === 'csharp') {
        const TYPE = '(?:var|int|long|short|byte|bool|double|float|decimal|string|char|object|[A-Z]\\w*(?:<[^;=()]*>)?(?:\\[\\])?)';
        scan(new RegExp('^\\s*' + TYPE + '\\s+([a-z_]\\w*)\\s*(=\\s*([^;]+))?;\\s*$'), (m, i) => {
            if (countWord(joined, m[1]) > 1) { return; }
            const col = code[i].indexOf(m[1]);
            const literal = m[3] !== undefined && /^\s*(-?\d[\d.]*[fFmMdDlLuU]*|true|false|null|default|"")\s*$/.test(m[3]);
            add({ severity: 'warning', category: 'Unused', message: m[3] === undefined ? `The variable ${m[1]} is declared but never used` : `The variable ${m[1]} is assigned but its value is never used`, line: i, col, endCol: col + m[1].length,
                code: m[3] === undefined ? 'CS0168' : literal ? 'CS0219' : undefined, hint: 'Remove it.' });
        });
        scan(/\bcatch\s*\(\s*[\w.]+\s+(\w+)\s*\)/, (m, i) => {
            if (countWord(joined, m[1]) > 1) { return; }
            add({ severity: 'warning', category: 'Unused', message: `The variable ${m[1]} is declared but never used`, line: i, ...span(m), code: 'CS0168', hint: `Write catch (${m[0].match(/\(\s*([\w.]+)/)![1]}) without a name, or use it.` });
        });
        scan(/\basync\s+void\s+\w+\s*\(([^)]*)\)/, (m, i) => {
            if (/\bobject\s+\w+\s*,\s*\w*EventArgs\b/.test(m[1])) { return; }
            add({ severity: 'warning', category: 'Correctness', message: 'async void: the caller cannot await it and an exception brings the process down', line: i, ...span(m), code: 'VSTHRD100', hint: 'Return Task, unless it is an event handler.' });
        });
        scan(/\.GetAwaiter\(\)\.GetResult\(\)|\.Wait\(\s*\)/, (m, i) => add({ severity: 'warning', category: 'Correctness', message: 'Blocking on a task can deadlock', line: i, ...span(m), code: 'VSTHRD002', hint: 'Await it instead.' }));
        scan(/\bcatch\s*\(\s*Exception\s*\w*\s*\)/, (m, i) => add({ severity: 'info', category: 'Error handling', message: 'Catching Exception also catches the errors you did not expect', line: i, ...span(m), code: 'CA1031', hint: 'Catch the specific exceptions the code can throw.' }));
        scan(/\block\s*\(\s*this\s*\)/, (m, i) => add({ severity: 'warning', category: 'Correctness', message: 'lock(this): any caller can take the same lock', line: i, ...span(m), hint: 'Lock a private object created for it.' }));
        leaks(/\b(\w+)\s*=\s*new\s+(SqlConnection|SqlCommand|SqlDataReader|SqlDataAdapter|StreamReader|StreamWriter|FileStream|MemoryStream|HttpClient|WebClient|TcpClient|BinaryReader|BinaryWriter|OracleConnection|OracleCommand|NpgsqlConnection|MySqlConnection)\s*\(/, 'Dispose', 'CA2000',
            'Declare it with using: using var x = new X(…);', (l) => /\busing\b/.test(l));
    }

    /* ───────── C++ ───────── */
    if (lang === 'cpp') {
        if (!isC) {
            scan(/\bNULL\b/, (m, i) => add({ severity: 'info', category: 'Style', message: 'NULL instead of nullptr', line: i, ...span(m), code: 'modernize-use-nullptr', hint: 'nullptr has its own type and cannot be mistaken for 0.' }));
        }
        scan(/(?<![\w>])\(\s*(?:unsigned\s+|const\s+)?(?:int|char|short|long|float|double|bool|size_t|void\s*\*|[A-Za-z_]\w*\s*\*)\s*\)\s*[\w(&*]/, (m, i) => add({ severity: 'info', category: 'Style', message: 'C-style cast', line: i, ...span(m), code: '-Wold-style-cast', hint: 'Use static_cast, reinterpret_cast or const_cast: they say what the cast does.' }));
        if (header) {
            scan(/^\s*using\s+namespace\s+\w+/, (m, i) => add({ severity: 'warning', category: 'Style', message: 'using namespace in a header leaks into every file that includes it', line: i, ...span(m), code: 'google-build-using-namespace', hint: 'Qualify the names, or move it into the .cpp.' }));
        }
        scan(/\b(strcpy|strcat|sprintf|vsprintf|gets)\s*\(/, (m, i) => add({ severity: m[1] === 'gets' ? 'error' : 'warning', category: 'Security', message: `${m[1]} does not check the size of the buffer`, line: i, ...span(m),
            code: m[1] === 'strcpy' || m[1] === 'strcat' ? 'clang-analyzer-security.insecureAPI.strcpy' : undefined,
            hint: m[1] === 'gets' ? 'gets is removed from the language: use fgets or std::getline.' : 'Use snprintf, strncpy_s / strlcpy, or std::string.' }));
        leaks(/^\s*[\w:<>]+\s*\*\s*(\w+)\s*=\s*new\b/, 'delete', 'cppcoreguidelines-owning-memory', 'Use std::unique_ptr / std::make_unique, or delete it on every path.', undefined, true);
        leaks(/\b(\w+)\s*=\s*(?:\(\s*[\w\s*]+\)\s*)?(?:malloc|calloc|realloc)\s*\(/, 'free', 'clang-analyzer-unix.Malloc', 'Call free on every path, or use std::vector / a smart pointer.', undefined, true);
        if (!header) {
            unusedLocals(/^\s*(?:const\s+)?(?:unsigned\s+|signed\s+)?(?:int|long|short|char|bool|float|double|auto|size_t|std::\w+(?:<[^;]*>)?|[A-Z]\w*)\s*[*&]?\s+([a-z_]\w*)\s*(?:=[^;]*)?;\s*$/, '-Wunused-variable');
        }
    }

    /* ───────── Go ───────── */
    if (lang === 'go') {
        const imp = /\bimport\s*\(([^)]*)\)|\bimport\s+(?:(\w+|_|\.)\s+)?"([^"]+)"/g;
        const srcNoStrings = joined;
        const wanted: { alias: string; path: string; line: number }[] = [];
        const origJoined = lines.join('\n');
        const starts = lineStartsOf(origJoined);
        for (const m of origJoined.matchAll(imp)) {
            const items: { alias?: string; path: string; off: number }[] = [];
            if (m[1] !== undefined) {
                for (const it of m[1].matchAll(/(?:(\w+|_|\.)\s+)?"([^"]+)"/g)) { items.push({ alias: it[1], path: it[2], off: (m.index ?? 0) + m[0].indexOf(it[0]) }); }
            } else { items.push({ alias: m[2], path: m[3], off: m.index ?? 0 }); }
            for (const it of items) {
                if (it.alias === '_' || it.alias === '.') { continue; }
                let name = it.alias ?? it.path.split('/').pop()!;
                if (!it.alias) {
                    if (/^v\d+$/.test(name)) { name = it.path.split('/').slice(-2)[0]; }
                    if (/[.-]/.test(name)) { continue; }
                }
                wanted.push({ alias: name, path: it.path, line: lineOfOffset(starts, it.off) });
            }
        }
        // the import statements themselves hold the paths: they are in strings, which are blanked
        for (const w of wanted) {
            if (!new RegExp('(?<![\\w.])' + escapeRe(w.alias) + '\\s*\\.').test(srcNoStrings)) {
                add({ severity: 'error', category: 'Compilation', message: `"${w.path}" is imported and not used`, line: w.line, hint: 'Remove the import: Go refuses a file that imports what it does not use.' });
            }
        }
        scan(/^\s*([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s*:=/, (m, i) => {
            for (const name of m[1].split(',').map(n => n.trim())) {
                if (name === '_' || countWord(joined, name) > 1) { continue; }
                const col = code[i].indexOf(name);
                add({ severity: 'error', category: 'Compilation', message: `${name} declared and not used`, line: i, col, endCol: col + name.length, hint: 'Use it, or write _ instead of the name: Go refuses unused variables.' });
            }
        });
        code.forEach((l, i) => {
            if (/^\s*(?:[\w.\[\]*]+\s*,\s*)*err\s*(?::=|=)\s*[^=]/.test(l) && !/\bif\b/.test(l)) {
                // the check may come a few lines later (n, err := w.Write(b); total += n; if err != nil …)
                const following = code.slice(i + 1).filter(x => x.trim()).slice(0, 3);
                if (following.length > 0 && !following.some(x => /\berr\b/.test(x))) {
                    add({ severity: 'warning', category: 'Error handling', message: 'The error returned here is not checked', line: i, code: 'errcheck', hint: 'Test err != nil on the next line, and return or handle it.' });
                }
            }
        });
        for (const m of joined.matchAll(/\bif\s+err\s*!=\s*nil\s*\{\s*\}/g)) {
            add({ severity: 'warning', category: 'Error handling', message: 'The error is tested and nothing is done with it', line: lineOfOffset(lineStartsOf(joined), m.index ?? 0), code: 'SA9003', hint: 'Return or log the error.' });
        }
        for (const m of joined.matchAll(/\bif\s+err\s*!=\s*nil\s*\{\s*return\s+nil\s*\}/g)) {
            add({ severity: 'warning', category: 'Error handling', message: 'The function returns nil although an error occurred', line: lineOfOffset(lineStartsOf(joined), m.index ?? 0), code: 'nilerr', hint: 'Return err.' });
        }
    }

    /* ───────── Rust ───────── */
    if (lang === 'rust') {
        const testAt = code.findIndex(l => /#\[cfg\(test\)\]/.test(l));
        const inTests = (i: number): boolean => testAt >= 0 && i > testAt;
        scan(/\blet\s+(?:mut\s+)?([a-z]\w*)\s*[:=]/, (m, i) => {
            if (m[1].startsWith('_') || countWord(joined, m[1]) > 1) { return; }
            const col = code[i].indexOf(m[1], m.index + 3);
            add({ severity: 'warning', category: 'Unused', message: `Unused variable: ${m[1]}`, line: i, col, endCol: col + m[1].length, code: 'unused_variables', hint: `If it is intentional, name it _${m[1]}.` });
        });
        let stripped = joined;
        const bound: { name: string; offset: number }[] = [];
        for (const m of joined.matchAll(/(?<!pub\s)\buse\s+([^;]+);/g)) {
            const clause = m[1];
            const base = (m.index ?? 0) + m[0].indexOf(clause);
            const brace = /\{([^}]*)\}/.exec(clause);
            const parts = brace ? brace[1].split(',').map((p, k, all) => ({ p, at: base + clause.indexOf('{') + 1 + all.slice(0, k).reduce((n, x) => n + x.length + 1, 0) })) : [{ p: clause, at: base }];
            for (const { p, at } of parts) {
                const name = p.trim().split(/\s+as\s+/).pop()!.split('::').pop()!.trim();
                if (/^[A-Za-z_]\w*$/.test(name) && name !== 'self' && name !== 'super') { bound.push({ name, offset: at + p.indexOf(name) }); }
            }
            stripped = stripped.slice(0, m.index) + ' '.repeat(m[0].length) + stripped.slice((m.index ?? 0) + m[0].length);
        }
        const starts = lineStartsOf(joined);
        for (const b of bound) {
            if (countWord(stripped, b.name) === 0) {
                const line = lineOfOffset(starts, b.offset);
                add({ severity: 'warning', category: 'Unused', message: `Unused import: ${b.name}`, line, col: b.offset - starts[line], endCol: b.offset - starts[line] + b.name.length, code: 'unused_imports', hint: 'Remove it.' });
            }
        }
        scan(/\.unwrap\(\s*\)/, (m, i) => { if (!inTests(i)) { add({ severity: 'info', category: 'Error handling', message: 'unwrap() panics if the value is missing', line: i, ...span(m), code: 'clippy::unwrap_used', hint: 'Use ?, match, or expect with a message that says what was assumed.' }); } });
        scan(/\bunsafe\s*\{/, (m, i) => add({ severity: 'info', category: 'Safety', message: 'unsafe block', line: i, ...span(m), code: 'unsafe_code', hint: 'Keep it as small as possible and explain the invariant in a comment.' }));
        scan(/\bdbg!\s*\(/, (m, i) => add({ severity: 'warning', category: 'Debug', message: 'dbg! left in the code', line: i, ...span(m), code: 'clippy::dbg_macro', hint: 'Remove it.' }));
        scan(/\b(todo|unimplemented)!\s*\(/, (m, i) => add({ severity: 'warning', category: 'Stub', message: `${m[1]}! panics when it is reached`, line: i, ...span(m), code: `clippy::${m[1]}` }));
        scan(/\.len\(\s*\)\s*==\s*0/, (m, i) => add({ severity: 'info', category: 'Style', message: 'Comparing len() with 0', line: i, ...span(m), code: 'clippy::len_zero', hint: 'Use is_empty().' }));
        scan(/[(,]\s*\w+\s*:\s*&\s*(?:mut\s+)?(String|Vec<)/, (m, i) => add({ severity: 'info', category: 'Style', message: `&${m[1].replace('<', '')} as a parameter forces the caller to own one`, line: i, ...span(m), code: 'clippy::ptr_arg', hint: 'Take &str or &[T].' }));
    }

    /* ───────── every brace language ───────── */
    if (ts || lang === 'java' || lang === 'csharp' || lang === 'cpp') {
        scan(/\b(?:if|while)\s*\(\s*[A-Za-z_][\w.\[\]]*\s*=(?![=>])[^=]/, (m, i) => add({ severity: 'warning', category: 'Correctness', message: 'Assignment inside a condition: = where == was meant?', line: i, ...span(m), code: ts ? 'no-cond-assign' : lang === 'cpp' ? '-Wparentheses' : undefined,
            hint: 'Write == to compare, or put the assignment in double parentheses if it is on purpose.' }));
    }
    unreachableBrace(code, lang, (line) => add({ severity: 'warning', category: 'Unreachable code', message: 'Unreachable code: it follows a return, throw, break or continue',
        line, code: ts ? 'TS7027' : lang === 'csharp' ? 'CS0162' : lang === 'go' ? 'unreachable' : lang === 'rust' ? 'unreachable_code' : undefined, hint: 'Remove it, or the statement before it.' }));
    securityRules(lines, code, lang, add);
    return findings.sort((a, b) => a.line - b.line);

    /** A resource or an allocation created into a variable that is never closed, freed or handed over. */
    function leaks(re: RegExp, verb: string, codeName: string, hint: string, skipLine?: (l: string) => boolean, pointer = false): void {
        code.forEach((l, i) => {
            const m = re.exec(l);
            if (!m || skipLine?.(l)) { return; }
            const name = m[1];
            const n = escapeRe(name);
            const closed = pointer
                ? new RegExp('\\b(?:delete\\s*(?:\\[\\s*\\]\\s*)?|free\\s*\\(\\s*)' + n + '\\b|\\b' + n + '\\s*\\.\\s*reset\\b').test(joined)
                : new RegExp('\\b' + n + '\\s*\\.\\s*(?:close|Close|Dispose)\\s*\\(').test(joined);
            const handed = new RegExp('\\breturn\\s+' + n + '\\b|[(,=]\\s*' + n + '\\s*[,);]|\\bthis\\s*(?:->|\\.)\\s*\\w+\\s*=\\s*' + n + '\\b|\\b(?:std::)?move\\s*\\(\\s*' + n + '\\s*\\)|\\b(?:push_back|emplace_back|Add|add|put)\\s*\\(\\s*' + n + '\\b', '').test(code.filter((_, k) => k !== i).join('\n'));
            if (!closed && !handed) {
                const col = l.indexOf(name);
                add({ severity: 'warning', category: 'Resources', message: pointer ? `${name} is allocated and never ${verb === 'delete' ? 'deleted' : 'freed'}` : `${name} is opened and never ${verb === 'Dispose' ? 'disposed' : 'closed'}`, line: i, col, endCol: col + name.length, code: codeName, hint });
            }
        });
    }

    /** `Type name = …;` declared and never mentioned again in the file. */
    function unusedLocals(re: RegExp, codeName: string | undefined): void {
        code.forEach((l, i) => {
            const m = re.exec(l);
            if (!m || /^\s*(?:return|else|delete|goto|case|using|typedef|extern|static|public|private|protected)\b/.test(l)) { return; }
            if (m[1].startsWith('_') || countWord(joined, m[1]) > 1) { return; }
            const col = l.indexOf(m[1]);
            add({ severity: 'info', category: 'Unused', message: `Variable ${m[1]} is declared but never used`, line: i, col, endCol: col + m[1].length, code: codeName, hint: 'Remove it.' });
        });
    }
}

/** Statements that follow a return, throw, break or continue in the same block. */
function unreachableBrace(code: string[], lang: string, report: (line: number) => void): void {
    const goLike = lang === 'go' || lang === 'rust';
    const jump = goLike
        ? /^\s*(return\b[^{}]*|break|continue|panic\([^)]*\))\s*;?\s*$/
        : /^\s*(return\b[^;{}]*|throw\b[^;{}]*|break|continue|goto\s+\w+)\s*;\s*$/;
    let prev = '';
    for (let i = 0; i < code.length; i++) {
        const l = code[i];
        if (!l.trim()) { continue; }
        if (jump.test(l) && (goLike || /[{;}:]\s*$/.test(prev) || prev === '')) {
            let next = i + 1;
            while (next < code.length && !code[next].trim()) { next++; }
            const n = code[next]?.trim() ?? '';
            // a function declaration after a return is legal (it is hoisted), and so is a closing bracket or the next case
            if (n && !/^(\}|\)|case\b|default\b|else\b|catch\b|finally\b|\w+\s*:\s*$|#|(?:export\s+)?(?:async\s+)?function\b|(?:export\s+)?class\b|(?:public|private|protected|static)\b)/.test(n) && !(lang === 'rust' && /^[\w:]+.*=>/.test(n))) { report(next); }
        }
        prev = l.trimEnd();
    }
}

/** SQL assembled from pieces, weak hashes, switched-off certificate checks: the same patterns in every language. */
export function securityRules(lines: string[], code: string[], lang: string, add: (f: Omit<ReviewFinding, 'file'>) => void): void {
    const SQLWORDS = /\b(select|insert\s+into|update|delete\s+from|where|values)\b/i;
    lines.forEach((l, i) => {
        const trimmed = l.trim();
        if (/^(\/\/|#|\*|\/\*)/.test(trimmed)) { return; }
        const call = /\b(?:execute\w*|query\w*|prepare\w*|SqlCommand|OracleCommand|NpgsqlCommand|MySqlCommand|createQuery|createNativeQuery|CommandText|QueryRow\w*|Exec\w*|Raw)\b\s*(?:\(|=)\s*(?:@|\$|f|fmt\.Sprintf\(\s*)?(["'`])/.exec(l);
        if (call && SQLWORDS.test(l)) {
            const rest = lines.slice(i, i + 3).join(' ').slice(call.index);
            const q = call[1];
            const body = new RegExp(q + '((?:\\\\.|[^' + q + '\\\\])*)' + q).exec(rest.slice(rest.indexOf(q)));
            const text = body ? body[1] : '';
            const after = body ? rest.slice(rest.indexOf(q) + body[0].length) : '';
            const concatenated = /^\s*(%|\.format\()/.test(after) || /^\s*\+\s*[A-Za-z_(@]/.test(after);
            const interpolated = (q === '`' && /\$\{/.test(text)) || (/\bf["']|\$"/.test(call[0] + l.slice(call.index, call.index + call[0].length + 1)) && /\{[^}]+\}/.test(text)) || /\bSprintf\(/.test(call[0]) && /%[sdv]/.test(text);
            if (concatenated || interpolated) {
                add({ severity: 'warning', category: 'Security', message: 'SQL built from pieces: open to SQL injection', line: i, col: call.index, endCol: call.index + call[0].length, code: 'CWE-89',
                    hint: 'Use bound parameters (placeholders), never text pasted into the statement.' });
            }
        }
        if (/getInstance\(\s*["'](MD5|SHA-?1)["']|createHash\(\s*['"](md5|sha1)['"]|hashlib\.(md5|sha1)\(|\b(MD5|SHA1)\.Create\(|MD5CryptoServiceProvider|SHA1CryptoServiceProvider|\b(md5|sha1)\.(New|Sum)\(/i.test(l)) {
            add({ severity: 'warning', category: 'Security', message: 'MD5 and SHA-1 are broken as security hashes', line: i, code: 'CWE-327', hint: 'Use SHA-256 or better, and a password hash (bcrypt, scrypt, Argon2) for passwords.' });
        }
        if (/\bverify\s*=\s*False\b|rejectUnauthorized\s*:\s*false|InsecureSkipVerify\s*:\s*true|ServerCertificateValidationCallback\s*[+]?=[^;]*\btrue\b|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/.test(l)) {
            add({ severity: 'warning', category: 'Security', message: 'Certificate checking is switched off', line: i, code: 'CWE-295', hint: 'Trust the right certificate authority instead of accepting every certificate.' });
        }
    });
    void lang;
}

function lineStartsOf(text: string): number[] {
    const starts = [0];
    for (let i = 0; i < text.length; i++) { if (text[i] === '\n') { starts.push(i + 1); } }
    return starts;
}

function lineOfOffset(starts: number[], offset: number): number {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= offset) { lo = mid; } else { hi = mid - 1; }
    }
    return lo;
}

/** Rules that need the members of a class: what is declared and never used, async without await, a missing virtual destructor. */
export function reviewStructure(classes: ReviewClassInfo[], lines: string[], lang: string, fileName: string): ReviewFinding[] {
    const code = blankCode(lines, lang);
    const joined = code.join('\n');
    const findings: ReviewFinding[] = [];
    const header = /\.(h|hpp|hh|hxx)$/i.test(fileName);
    for (const cls of classes) {
        for (const m of cls.members) {
            if (m.kind === 'field' && /^private$/i.test(m.visibility) && ['typescript', 'javascript', 'java', 'csharp'].includes(lang) && countWord(joined, m.name) <= 1) {
                findings.push({
                    severity: lang === 'csharp' ? 'warning' : 'info', category: 'Unused', message: `The private field ${m.name} of ${cls.name} is never used`, file: fileName, line: m.startLine, className: cls.name, memberName: m.name,
                    code: lang === 'csharp' ? 'CS0169' : lang === 'java' ? undefined : 'TS6133', hint: 'Remove it.',
                });
            }
            if (m.kind === 'method' && (lang === 'typescript' || lang === 'javascript' || lang === 'csharp') && !m.isAbstract && !cls.isInterface) {
                const decl = code[m.startLine] ?? '';
                if (/\basync\b/.test(decl)) {
                    const body = code.slice(m.startLine, m.endLine + 1).join('\n');
                    if (body.includes('{') && !/\bawait\b|\byield\b/.test(body)) {
                        findings.push({
                            severity: 'warning', category: 'Correctness', message: `${m.name} is async but never awaits anything`, file: fileName, line: m.startLine, className: cls.name, memberName: m.name,
                            code: lang === 'csharp' ? 'CS1998' : 'require-await', hint: 'Await the call that takes time, or drop async and return the value (Task.FromResult / Promise.resolve).',
                        });
                    }
                }
            }
        }
        if (lang === 'cpp' && !cls.isInterface && !cls.isRecord) {
            const virtuals = cls.members.filter(m => m.isVirtual && m.kind !== 'destructor');
            const dtor = cls.members.find(m => m.kind === 'destructor');
            if (virtuals.length > 0 && !cls.parentClass && (!dtor || (!dtor.isVirtual && !dtor.isOverride)) && (header || cls.members.length > 0)) {
                findings.push({
                    severity: 'warning', category: 'Correctness', message: `${cls.name} has virtual functions but its destructor is not virtual`, file: fileName, line: dtor?.startLine ?? cls.startLine, className: cls.name,
                    code: '-Wnon-virtual-dtor', hint: 'Declare virtual ~' + cls.name + '() = default; deleting a derived object through a base pointer is undefined otherwise.',
                });
            }
        }
    }
    return findings;
}
