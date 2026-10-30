import { test } from 'node:test';
import assert from 'node:assert/strict';

const m = require('node:module');
const originalLoad = m._load;
const vscodeMock = {
    Uri: { file: (p: string) => ({ fsPath: p }), parse: (u: string) => ({ path: u }) },
    Position: class { constructor(public line: number, public character: number) {} },
    Range: class {
        start: { line: number; character: number }; end: { line: number; character: number };
        constructor(a: any, b: any, c?: number, d?: number) {
            if (c === undefined) { this.start = a; this.end = b; }
            else { this.start = { line: a, character: b }; this.end = { line: c, character: d }; }
        }
    },
    EndOfLine: { LF: 0 },
};
m._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { findUnused, spansOf } = require('../utils/unusedCode') as typeof import('../utils/unusedCode');
const providers: Record<string, any> = {};
const load = (id: string, name: string): void => { providers[id] = new (require('../providers/' + name)[name])(); };
load('typescript', 'TypeScriptLanguageProvider');
load('python', 'PythonLanguageProvider');
load('go', 'GoLanguageProvider');
load('rust', 'RustLanguageProvider');
load('java', 'JavaLanguageProvider');
load('csharp', 'CSharpLanguageProvider');
load('cpp', 'CppLanguageProvider');
load('pascal', 'PascalLanguageProvider');

function run(lang: string, text: string, fileName = 'x', extra = ''): string[] {
    const lines = text.split(/\r?\n/);
    const doc: any = { getText: () => text, lineAt: (i: number) => ({ text: lines[i] ?? '' }), lineCount: lines.length, uri: { fsPath: fileName, toString: () => fileName }, languageId: lang, fileName };
    const parsed = providers[lang].parseDocument(doc);
    return findUnused(text, lang, spansOf(parsed, text), fileName, extra).map(f => `${f.kind}:${f.name}@${f.line + 1}:${f.rule}`);
}

test('TypeScript: imports, locals, private members and local functions that nothing reads', () => {
    const out = run('typescript', [
        "import { used, unusedOne as alias } from './a';", "import def, * as ns from './b';", "import React from 'react';",
        'function helper(a: number) {', '  const keep = a + 1;', '  const gone = 2;', '  return keep;', '}',
        'export function api() {', '  return helper(1) + used;', '}',
        'function orphan() {', '  return 1;', '}',
        'export class Svc {', '  private secret = 1;', '  private used2 = 2;', '  run() {', '    return this.used2;', '  }', '}',
        'function stop() {', '  return 1;', '  console.log("never");', '}',
    ].join('\n'));
    const all = out.join(' ');
    assert.ok(out.includes('import:alias@1:TS6133'), all);
    assert.ok(out.includes('import:def@2:TS6133') && out.includes('import:ns@2:TS6133'), all);
    assert.ok(!out.some(o => o.startsWith('import:React')), 'React is left alone');
    assert.ok(!out.some(o => o.startsWith('import:used@')), all);
    assert.ok(out.includes('local:gone@6:TS6133') && !out.some(o => o.startsWith('local:keep')), all);
    assert.ok(out.includes('function:orphan@12:TS6133') && !out.some(o => o.startsWith('function:helper') || o.startsWith('function:api')), all);
    assert.ok(out.some(o => o.startsWith('private:Svc.secret')) && !out.some(o => o.startsWith('private:Svc.used2')), all);
    assert.ok(out.some(o => o.startsWith('unreachable:') && o.includes('@24:TS7027')), all);
});

test('Python: unused imports and locals, private functions, code after return', () => {
    const out = run('python', [
        'import os, sys', 'from typing import List, Dict', 'from . import sibling', '', 'def f(a: List):', '    tmp = 1', '    used = 2', '    return used + len(sys.argv)', '',
        'def _hidden():', '    return 1', '', 'def g():', '    return 2', '    print("never")', '',
    ].join('\n'));
    const all = out.join(' ');
    assert.ok(out.includes('import:os@1:F401') && out.includes('import:Dict@2:F401') && out.includes('import:sibling@3:F401'), all);
    assert.ok(!out.some(o => o.startsWith('import:sys') || o.startsWith('import:List')), all);
    assert.ok(out.includes('local:tmp@6:F841') && !out.some(o => o.startsWith('local:used')), all);
    assert.ok(out.some(o => o.startsWith('function:_hidden')), all);
    assert.ok(out.some(o => o.startsWith('unreachable:') && o.includes('@15')), all);
    assert.deepEqual(run('python', 'import os\n', 'pkg/__init__.py'), [], 'an __init__ re-exports');
});

test('Go: an unused import and an unused variable are compile errors; an unexported function nobody calls is flagged', () => {
    const out = run('go', ['package main', '', 'import (', '\t"fmt"', '\t"os"', '\tm "math"', ')', '', 'func helper() int {', '\treturn 1', '}', '', 'func main() {', '\tx := 1', '\ty := 2', '\tfmt.Println(y)', '\t_ = m.Pi', '}'].join('\n'));
    const all = out.join(' ');
    assert.ok(out.includes('import:os@5:imported and not used'), all);
    assert.ok(!out.some(o => o.startsWith('import:fmt') || o.includes('math')), all);
    assert.ok(out.includes('local:x@14:declared and not used') && !out.some(o => o.startsWith('local:y')), all);
    assert.ok(out.includes('function:helper@9:U1000'), all);
});

test('Rust: unused imports and variables, a private function nobody calls', () => {
    const out = run('rust', ['use std::collections::HashMap;', 'use std::io::{self, Read, Write};', '', 'fn helper() -> i32 {', '    1', '}', '', 'pub fn api() {', '    let a = 1;', '    let _b = 2;', '    let c = 3;', '    println!("{}", c);', '    let mut w = io::stdout();', '    w.flush();', '}', '', 'fn main() {', '    api();', '}'].join('\n'));
    const all = out.join(' ');
    assert.ok(out.includes('import:HashMap@1:unused_imports') && out.includes('import:Read@2:unused_imports'), all);
    assert.ok(out.includes('local:a@9:unused_variables') && !out.some(o => o.startsWith('local:_b') || o.startsWith('local:c@')), all);
    assert.ok(out.includes('function:helper@4:dead_code') && !out.some(o => o.startsWith('function:api') || o.startsWith('function:main')), all);
});

test('Java and C#: unused private members and locals', () => {
    const java = run('java', ['import java.util.List;', 'import java.util.Map;', 'public class X {', '  private int secret;', '  private int used;', '  private void helper() {', '  }', '  public int run() {', '    int unusedLocal = 1;', '    int total = used;', '    return total;', '  }', '}'].join('\n'));
    const jall = java.join(' ');
    assert.ok(java.some(o => o.startsWith('import:List')) && java.some(o => o.startsWith('import:Map')), jall);
    assert.ok(java.some(o => o.startsWith('private:X.secret')) && java.some(o => o.startsWith('private:X.helper')) && !java.some(o => o.startsWith('private:X.used')), jall);
    assert.ok(java.some(o => o.startsWith('local:unusedLocal')) && !java.some(o => o.startsWith('local:total')), jall);
    const cs = run('csharp', ['class X {', '  private int secret;', '  private void Helper() {}', '  public int Run() {', '    int a;', '    int b = 2;', '    int c = 3;', '    return c;', '  }', '}'].join('\n'));
    const call = cs.join(' ');
    assert.ok(cs.some(o => o.includes('private:X.secret') && o.endsWith('CS0169')) && cs.some(o => o.includes('X.Helper') && o.endsWith('IDE0051')), call);
    assert.ok(cs.includes('local:a@5:CS0168') && cs.includes('local:b@6:CS0219') && !cs.some(o => o.startsWith('local:c')), call);
});

test('C++: a static function nobody calls', () => {
    const out = run('cpp', ['static int helper(int a) {', '  return a;', '}', '', 'int main() {', '  int unused;', '  return 0;', '}'].join('\n'));
    const all = out.join(' ');
    assert.ok(out.includes('function:helper@1:-Wunused-function'), all);
    assert.ok(out.includes('local:unused@6:-Wunused-variable'), all);
});

test('Delphi: unused locals (H2164) and private methods (H2219), but not a handler that the .dfm names', () => {
    const pas = ['unit U;', 'interface', 'type', '  TF = class', '  private', '    procedure Secret;', '    procedure Click(Sender: TObject);', '  public', '    procedure Run;', '  end;', 'implementation', '',
        'procedure TF.Secret;', 'begin', 'end;', '', 'procedure TF.Click(Sender: TObject);', 'begin', 'end;', '',
        'procedure TF.Run;', 'var', '  a, b: Integer;', '  c: string;', 'begin', '  a := 1;', "  c := 'x';", '  Writeln(c);', '  Exit;', '  Writeln(a);', 'end;', '', 'end.'].join('\n');
    const out = run('pascal', pas, 'u.pas', 'object F: TF\n  OnClick = Click\nend');
    const all = out.join(' ');
    assert.ok(out.some(o => o.startsWith('private:TF.Secret') && o.endsWith('H2219')), all);
    assert.ok(!out.some(o => o.includes('Click')), 'the .dfm uses Click: ' + all);
    assert.ok(!out.some(o => o.startsWith('local:a@')), 'a is read by Writeln(a): ' + all);
    assert.ok(out.some(o => o.startsWith('local:b@') && o.endsWith('H2164')), all);
    assert.ok(out.some(o => o.startsWith('unreachable:') && o.includes('@30')), all);
    assert.ok(!out.some(o => o.startsWith('private:TF.Run') || o.startsWith('local:c')), all);
});
