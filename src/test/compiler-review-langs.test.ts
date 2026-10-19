import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankCode, reviewLanguage, reviewStructure } from '../utils/compilerReview';
import { reviewPython } from '../utils/pythonReview';
import { dropReported, findingsFromDiagnostics } from '../utils/diagnosticsReview';
import { ReviewClassInfo, ReviewFinding, ReviewMemberInfo } from '../utils/reviewTypes';

const member = (name: string, kind: ReviewMemberInfo['kind'], visibility: string, startLine: number, extra: Partial<ReviewMemberInfo> = {}): ReviewMemberInfo => ({
    name, kind, visibility, isVirtual: false, isAbstract: false, isOverride: false, modifiers: [], params: [], startLine, endLine: startLine, ...extra,
});
const run = (lang: string, src: string, file = 'a.' + lang): ReviewFinding[] => reviewLanguage(src.split('\n'), lang, file);
const at = (f: ReviewFinding[], code: string): number[] => f.filter(x => x.code === code).map(x => x.line);

test('comments and strings are blanked for the brace languages, Python and Go raw strings; a Rust lifetime is not a string', () => {
    const b = blankCode(['x = "a // b"; // c', "y = 'q'; /* z", 'still */ w', "let r: &'a str = s;"], 'rust');
    assert.equal(b[0].trim().replace(/\s+/g, ' '), 'x = ;');
    assert.equal(b[2].trim(), 'w');
    assert.ok(b[3].includes("&'a str"), 'the lifetime stays');
    const py = blankCode(['x = 1  # note', 's = """doc', 'more"""', "t = 'a#b'"], 'python');
    assert.equal(py[0].trim(), 'x = 1');
    assert.equal(py[2].trim(), '');
    assert.doesNotMatch(py[3], /#/);
});

test('TypeScript / JavaScript: the ESLint and tsc rules, with their codes', () => {
    const f = run('typescript', [
        "import { used, unused as gone } from './a';", "import def, * as ns from './b';", "import type { Shape } from './c';",
        'var old = 1;', 'const fine = used(old);', 'if (fine == 2 || fine != null) { debugger; }', 'console.log(fine, ns.x, def);',
        'let anything: any = fine as any;', 'items.forEach(async (i) => { await go(i); });', 'const n = parseInt(text);', 'if (x = 5) { }',
        'function f() {', '  return 1;', '  cleanup();', '}', 'const unusedLocal = 4;', "eval('1');", 'el.innerHTML = html;',
        "// var commented = 1; console.log('x'); == null", "const s = 'var == console.log(';",
    ].join('\n'));
    const names = f.filter(x => x.code === 'TS6133').map(x => x.message).sort();
    assert.deepEqual(names, ['Import Shape is never used', 'Import gone is never used', 'anything is declared but its value is never read', 'n is declared but its value is never read', 's is declared but its value is never read', 'unusedLocal is declared but its value is never read'].sort(), 'used, def and ns are used; a name inside a string or a comment is not a use');
    assert.deepEqual(at(f, 'no-var'), [3]);
    assert.deepEqual(at(f, 'eqeqeq'), [5], '== is advice, != null is allowed');
    assert.deepEqual(at(f, 'no-debugger'), [5]);
    assert.deepEqual(at(f, 'no-console'), [6], 'a comment or a string is not code');
    assert.deepEqual(at(f, '@typescript-eslint/no-explicit-any'), [7]);
    assert.deepEqual(at(f, '@typescript-eslint/no-misused-promises'), [8]);
    assert.deepEqual(at(f, 'radix'), [9]);
    assert.deepEqual(at(f, 'no-cond-assign'), [10]);
    assert.deepEqual(at(f, 'no-empty'), [10]);
    assert.deepEqual(at(f, 'TS7027'), [13], 'cleanup() follows the return');
    assert.deepEqual(at(f, 'no-eval'), [16]);
    assert.deepEqual(at(f, 'CWE-79'), [17]);
    assert.equal(f.find(x => x.code === 'no-var')!.severity, 'info');
    assert.equal(f.find(x => x.code === 'no-debugger')!.severity, 'warning');
});

test('TypeScript: a return inside an if without braces does not make the next line unreachable', () => {
    const f = run('typescript', ['function f(a: number) {', '  if (a)', '    return 1;', '  work();', '  switch (a) {', '    case 1:', '      return 2;', '    default:', '      return 3;', '  }', '}'].join('\n'));
    assert.deepEqual(at(f, 'TS7027'), []);
});

test('Java: javac lint, PMD and Eclipse style findings', () => {
    const f = run('java', [
        'import java.util.List;', 'import java.io.File;', 'public class A implements Serializable {',
        '  void m(String s, FileReader r0) {', '    System.out.println(s);', '    try { go(); } catch (Exception e) { e.printStackTrace(); }',
        '    if (s == "x") { }', '    Integer i = new Integer(3);', '    List raw = new ArrayList();', '    FileReader leaked = new FileReader("f");',
        '    FileReader ok = new FileReader("g");', '    ok.close();', '    int unused = 5;', '    return;', '    after();', '  }', '}',
    ].join('\n'), 'A.java');
    assert.deepEqual(at(f, 'SystemPrintln'), [4]);
    assert.deepEqual(at(f, 'AvoidPrintStackTrace'), [5]);
    assert.deepEqual(at(f, 'IllegalCatch'), [5]);
    assert.ok(f.some(x => x.line === 6 && /Strings compared with ==/.test(x.message)));
    assert.deepEqual(at(f, 'removal'), [7]);
    assert.deepEqual(at(f, 'rawtypes'), [8]);
    assert.deepEqual(at(f, 'serial'), [2]);
    assert.deepEqual(f.filter(x => x.code === 'resource').map(x => x.message), ['leaked is opened and never closed']);
    assert.ok(f.some(x => /unused is declared but never used/.test(x.message)));
    assert.ok(f.some(x => x.category === 'Unreachable code' && x.line === 14));
});

test('C#: the compiler warnings by their numbers', () => {
    const f = run('csharp', [
        'class A {', '  async void Run() { }', '  async void OnClick(object sender, EventArgs e) { }', '  void M() {', '    int a;', '    int b = 5;', '    var c = Compute();',
        '    try { Go(); } catch (IOException ex) { }', '    var conn = new SqlConnection(cs);', '    using var fine = new SqlConnection(cs);', '    task.Wait();',
        '    lock (this) { }', '    try { } catch (Exception) { }', '    return;', '    After();', '  }', '}',
    ].join('\n'), 'A.cs');
    assert.deepEqual(at(f, 'CS0168'), [4, 7], 'a declared and never used variable, a caught exception never used');
    assert.deepEqual(at(f, 'CS0219'), [5], 'assigned a constant and never used; a call result is not reported');
    assert.deepEqual(at(f, 'VSTHRD100'), [1], 'an event handler may be async void');
    assert.deepEqual(at(f, 'VSTHRD002'), [10]);
    assert.deepEqual(at(f, 'CA1031'), [12]);
    assert.deepEqual(f.filter(x => x.code === 'CA2000').map(x => x.message), ['conn is opened and never disposed']);
    assert.ok(f.some(x => /lock\(this\)/.test(x.message)));
    assert.deepEqual(at(f, 'CS0162'), [14]);
});

test('C++: warnings of the compiler and clang-tidy', () => {
    const src = [
        '#include <cstring>', 'void f(char* d, const char* s) {', '  int* p = new int(3);', '  char* b = (char*)malloc(10);', '  int* q = new int(4);', '  delete q;',
        '  strcpy(d, s);', '  gets(d);', '  if (p == NULL) { }', '  long n = (long)d[0];', '  int unusedVar = 1;', '  if (n = 2) { }', '}',
    ].join('\n');
    const f = run('cpp', src, 'a.cpp');
    assert.deepEqual(f.filter(x => x.code === 'cppcoreguidelines-owning-memory').map(x => x.message), ['p is allocated and never deleted']);
    assert.deepEqual(f.filter(x => x.code === 'clang-analyzer-unix.Malloc').map(x => x.message), ['b is allocated and never freed']);
    assert.deepEqual(at(f, 'clang-analyzer-security.insecureAPI.strcpy'), [6]);
    assert.equal(f.find(x => /gets does not check/.test(x.message))!.severity, 'error');
    assert.deepEqual(at(f, 'modernize-use-nullptr'), [8]);
    assert.deepEqual(at(f, '-Wold-style-cast'), [3, 9], 'both casts');
    assert.deepEqual(at(f, '-Wunused-variable'), [3, 10], 'b is never used either');
    assert.deepEqual(at(f, '-Wparentheses'), [11]);
    assert.deepEqual(run('cpp', 'void g() { int x = 1; }', 'a.hpp').filter(x => x.code === '-Wunused-variable'), [], 'in a header the use may be elsewhere');
    assert.deepEqual(run('cpp', 'using namespace std;', 'a.hpp').map(x => x.code), ['google-build-using-namespace']);
    assert.deepEqual(run('cpp', 'using namespace std;', 'a.cpp'), []);
});

test('Go: what the compiler refuses, errcheck and friends', () => {
    const f = run('go', [
        'package main', 'import (', '  "fmt"', '  "os"', '  str "strings"', '  _ "embed"', ')', 'func f() error {', '  x := 1', '  a, err := g()', '  total := 0',
        '  total += a', '  if err != nil { }', '  n, err := h()', '  fmt.Println(n)', '  return nil', '  panic("x")', '}', 'func k() error {', '  err := w()', '  if err != nil { return nil }', '  return nil', '}',
    ].join('\n'), 'a.go');
    assert.deepEqual(f.filter(x => /imported and not used/.test(x.message)).map(x => x.message), ['"os" is imported and not used', '"strings" is imported and not used']);
    assert.ok(f.some(x => /x declared and not used/.test(x.message) && x.severity === 'error' && x.line === 8));
    assert.deepEqual(at(f, 'errcheck'), [13], 'err assigned and not looked at on the next lines');
    assert.deepEqual(at(f, 'SA9003'), [12]);
    assert.deepEqual(at(f, 'nilerr'), [20]);
    assert.deepEqual(at(f, 'unreachable'), [16]);
});

test('Rust: rustc and clippy lints', () => {
    const f = run('rust', [
        'use std::collections::{HashMap, HashSet};', 'use std::io::Read as _R;', 'fn f(v: &Vec<i32>, s: &String) {', '  let mut gone = 1;', '  let kept = v.len();', '  let _quiet = 2;',
        '  let x = opt.unwrap();', '  unsafe { danger(); }', '  dbg!(kept);', '  todo!();', '  if v.len() == 0 { }', '  let m: HashMap<i32, i32> = HashMap::new();', '  return;', '  after();', '}',
        '#[cfg(test)]', 'mod t { fn a() { y.unwrap(); } }',
    ].join('\n'), 'a.rs');
    assert.deepEqual(f.filter(x => x.code === 'unused_imports').map(x => x.message), ['Unused import: HashSet', 'Unused import: _R']);
    assert.deepEqual(f.filter(x => x.code === 'unused_variables').map(x => x.message), ['Unused variable: gone', 'Unused variable: x', 'Unused variable: m']);
    assert.deepEqual(at(f, 'clippy::unwrap_used'), [6], 'not in the tests');
    assert.deepEqual(at(f, 'unsafe_code'), [7]);
    assert.deepEqual(at(f, 'clippy::dbg_macro'), [8]);
    assert.deepEqual(at(f, 'clippy::todo'), [9]);
    assert.deepEqual(at(f, 'clippy::len_zero'), [10]);
    assert.deepEqual(at(f, 'clippy::ptr_arg'), [2, 2]);
    assert.deepEqual(at(f, 'unreachable_code'), [13]);
});

test('Python: pyflakes, pycodestyle, bugbear, pylint and bandit codes', () => {
    const src = [
        'import os, sys', 'from a import (b,', '    c)', 'from d import *', 'import json as j', '', 'def f(x, items=[]):', '    unused = 1',
        '    used = 2', '    try:', '        run(used)', '    except:', '        pass', '    except ValueError as e:', '        pass', '    if x == None or x != True:', '        return 1',
        '    if x is 5: pass', '    s = f"plain"', '    print(f"{x}")', '    breakpoint()', '    eval(x)', '    subprocess.call(x, shell=True)', '    h = open("f")',
        '    cur.execute("select * from t where a=" + x)', '    return j', '    after()', '', 'print(sys.argv, b)',
    ].join('\n');
    const f = reviewPython(src.split('\n'), 'm.py');
    assert.deepEqual(f.filter(x => x.code === 'F401').map(x => x.message), ['os is imported but never used', 'c is imported but never used']);
    assert.deepEqual(at(f, 'F403'), [3]);
    assert.deepEqual(at(f, 'B006'), [6]);
    assert.deepEqual(f.filter(x => x.code === 'F841').map(x => x.line), [7, 13, 18, 23], 'unused, s and h are only assigned; e is bound and not used');
    assert.deepEqual(at(f, 'E722'), [11]);
    assert.deepEqual(at(f, 'E711'), [15]);
    assert.deepEqual(at(f, 'E712'), [15]);
    assert.deepEqual(at(f, 'F632'), [17]);
    assert.deepEqual(at(f, 'F541'), [18]);
    assert.deepEqual(at(f, 'T100'), [20]);
    assert.deepEqual(at(f, 'B307'), [21]);
    assert.deepEqual(at(f, 'B602'), [22]);
    assert.deepEqual(at(f, 'R1732'), [23]);
    assert.deepEqual(at(f, 'CWE-89'), [24]);
    assert.deepEqual(at(f, 'W0101'), [26]);
    assert.deepEqual(reviewPython(['import os', 'x = 1'], '__init__.py').filter(x => x.code === 'F401'), [], 'a package file re-exports');
});

test('SQL, hashes and certificates in every language', () => {
    const f = run('typescript', [
        'db.query("select * from t where id=" + id);', 'db.query(`select * from t where id=${id}`);', 'db.query("select * from t where id=$1", [id]);',
        "crypto.createHash('md5');", 'const o = { rejectUnauthorized: false };', "const k = 'select ' + 'x';",
    ].join('\n'));
    assert.deepEqual(at(f, 'CWE-89'), [0, 1]);
    assert.deepEqual(at(f, 'CWE-327'), [3]);
    assert.deepEqual(at(f, 'CWE-295'), [4]);
    const cs = run('csharp', ['var c = new SqlCommand("select * from t where n=\'" + name + "\'", cn);', 'var ok = new SqlCommand("select * from t where n=@n", cn);'].join('\n'));
    assert.deepEqual(at(cs, 'CWE-89'), [0]);
    const py = reviewPython(['cur.execute("select * from t where a=%s" % a)', 'cur.execute(f"select * from t where a={a}")', 'cur.execute("select * from t where a=%s", (a,))'], 'a.py');
    assert.deepEqual(at(py, 'CWE-89'), [0, 1]);
});

test('structure rules: async without await, a non-virtual destructor, private fields nobody reads', () => {
    const lines = ['class A {', '  private count: number;', '  async load() { return 1; }', '  async ok() { await x(); }', '  abstract async no(): Promise<void>;', '}'];
    const cls: ReviewClassInfo = {
        name: 'A', isInterface: false, isRecord: false, startLine: 0, endLine: 5,
        members: [member('count', 'field', 'private', 1), member('load', 'method', 'public', 2), member('ok', 'method', 'public', 3), member('no', 'method', 'public', 4, { isAbstract: true })],
    };
    const ts = reviewStructure([cls], lines, 'typescript', 'a.ts');
    assert.deepEqual(ts.map(x => x.code).sort(), ['TS6133', 'require-await']);
    assert.equal(ts.find(x => x.code === 'require-await')!.memberName, 'load');
    const cs = reviewStructure([cls], ['class A {', '  private int count;', '  async Task Load() { return; }', '}'], 'csharp', 'a.cs');
    assert.deepEqual(cs.map(x => x.code).sort(), ['CS0169', 'CS1998'].sort());

    const base: ReviewClassInfo = {
        name: 'Base', isInterface: false, isRecord: false, startLine: 0, endLine: 4,
        members: [member('run', 'method', 'public', 1, { isVirtual: true }), member('~Base', 'destructor', 'public', 2)],
    };
    const cpp = reviewStructure([base], ['class Base {', ' virtual void run();', ' ~Base();', '};'], 'cpp', 'base.h');
    assert.deepEqual(cpp.map(x => x.code), ['-Wnon-virtual-dtor']);
    base.members[1].isVirtual = true;
    assert.deepEqual(reviewStructure([base], ['class Base {', ' virtual void run();', ' virtual ~Base();', '};'], 'cpp', 'base.h'), []);
});

test('what a language server already reports is listed as the compiler\'s opinion, and not twice', () => {
    const range = (l: number): { start: { line: number; character: number }; end: { line: number; character: number } } => ({ start: { line: l, character: 2 }, end: { line: l, character: 6 } });
    const found = findingsFromDiagnostics([
        { message: "'x' is declared but its value is never read.\nmore", severity: 1, source: 'ts', code: 6133, range: range(4) },
        { message: 'Cannot find name y', severity: 0, source: 'ts', code: { value: 2304 }, range: range(7) },
        { message: 'a hint', severity: 3, source: 'Pylance', code: 'reportX', range: range(9) },
        { message: 'ours', severity: 1, source: 'CE Review', code: 'F401', range: range(1) },
    ], 'a.ts');
    assert.deepEqual(found.map(x => [x.line, x.severity, x.code, x.source, x.category]), [[4, 'warning', 'TS6133', 'ts', 'Compiler'], [7, 'error', 'TS2304', 'ts', 'Compiler'], [9, 'info', 'reportX', 'Pylance', 'Compiler']]);
    assert.equal(found[0].message, "'x' is declared but its value is never read.", 'the first line only');
    const own: ReviewFinding[] = [
        { severity: 'info', category: 'Unused', message: 'mine', file: 'a.ts', line: 4, code: 'TS6133' },
        { severity: 'info', category: 'Unused', message: 'other line', file: 'a.ts', line: 5, code: 'TS6133' },
        { severity: 'info', category: 'TODO', message: 'no code', file: 'a.ts', line: 4 },
    ];
    assert.deepEqual(dropReported(own, found).map(x => x.message), ['other line', 'no code'], 'same line and same code: the compiler\'s wins');
});
