import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildModules, groupOfLanguage, groupOfPath, readImports } from '../utils/moduleGraph';
import { buildUnitGraph } from '../utils/unitGraph';
import { bracedBody, familyOf, findCalls } from '../utils/callGraph';

const src = (path: string, text: string) => ({ path, file: 'file:///' + path, text });
const edges = (files: ReturnType<typeof src>[], g: Parameters<typeof buildModules>[1]) => buildUnitGraph(buildModules(files, g)).edges.map(e => e.from + '>' + e.to).sort();

test('the language of a file picks the group of files drawn together', () => {
    assert.equal(groupOfLanguage('typescriptreact'), 'script');
    assert.equal(groupOfLanguage('python'), 'python');
    assert.equal(groupOfLanguage('cpp'), 'c');
    assert.equal(groupOfLanguage('pascal'), undefined, 'Delphi has its own units view');
    assert.equal(groupOfPath('a/b/Main.java'), 'java');
    assert.equal(groupOfPath('x.pas'), undefined);
});

test('the imports written in each language', () => {
    const specs = (t: string, g: Parameters<typeof readImports>[1]) => readImports(t, g).map(i => i.spec);
    assert.deepEqual(specs("import a from './a';\nimport {b} from \"../b\";\n// import x from './no'\nconst c = require('./c');\nexport * from './d';\nconst e = await import('./e');\n", 'script'), ['./a', '../b', './c', './d', './e']);
    assert.deepEqual(specs('import os, sys as s\nfrom . import util, helpers\nfrom .pkg.mod import f\nfrom top.sub import g\n# import no\n', 'python'), ['os', 'sys', '.util', '.helpers', '.pkg.mod', 'top.sub']);
    assert.deepEqual(specs('import java.util.List;\nimport static a.b.C.m;\nimport a.b.*;\n', 'java'), ['java.util.List', 'a.b.C.m', 'a.b.*']);
    assert.deepEqual(specs('using System;\nusing static My.Util;\nusing (var x = y) {}\nusing A = B.C;\n', 'csharp'), ['System', 'My.Util', 'B.C']);
    assert.deepEqual(specs('import "fmt"\nimport (\n\t"os"\n\tm "my/mod/util"\n)\n', 'go'), ['fmt', 'os', 'my/mod/util']);
    assert.deepEqual(specs('mod util;\npub mod net;\nuse crate::a::b;\nuse std::io;\n', 'rust'), ['mod:util', 'mod:net', 'use:crate::a::b']);
    assert.deepEqual(specs('#include <stdio.h>\n#include "a.h"\n  #  include "sub/b.h"\n', 'c'), ['a.h', 'sub/b.h']);
});

test('an import that names a file of the project is a wire, a library stays outside', () => {
    assert.deepEqual(edges([
        src('src/a.ts', "import {b} from './b';\nimport r from 'react';\nimport {c} from './lib';"),
        src('src/b.ts', "import {a} from './a.js';"),
        src('src/lib/index.ts', ''),
    ], 'script'), ['src/a.ts>src/b.ts', 'src/a.ts>src/lib/index.ts', 'src/b.ts>src/a.ts']);
    const g = buildUnitGraph(buildModules([src('src/a.ts', "import r from 'react';")], 'script'));
    assert.deepEqual(g.external.get('src/a.ts'), ['react'], 'a library is listed on the file');

    assert.deepEqual(edges([
        src('app/main.py', 'from . import util\nfrom pkg.mod import f\nimport os'),
        src('app/util.py', ''),
        src('pkg/mod.py', 'from .other import x'),
        src('pkg/other.py', ''),
    ], 'python'), ['app/main.py>app/util.py', 'app/main.py>pkg/mod.py', 'pkg/mod.py>pkg/other.py']);

    assert.deepEqual(edges([
        src('src/main/java/a/App.java', 'import a.util.Tool;\nimport java.util.List;'),
        src('src/main/java/a/util/Tool.java', ''),
    ], 'java'), ['src/main/java/a/App.java>src/main/java/a/util/Tool.java']);

    assert.deepEqual(edges([
        src('A.cs', 'using My.Core;'), src('Core/B.cs', 'namespace My.Core\n{ }'),
    ], 'csharp'), ['A.cs>Core/B.cs']);

    assert.deepEqual(edges([
        src('main.go', 'import "example.com/app/util"'), src('util/u.go', 'package util'),
    ], 'go'), ['main.go>util/u.go']);

    assert.deepEqual(edges([
        src('src/main.rs', 'mod net;\nuse crate::util::helpers;'), src('src/net/mod.rs', ''), src('src/util.rs', ''),
    ], 'rust'), ['src/main.rs>src/net/mod.rs', 'src/main.rs>src/util.rs']);

    assert.deepEqual(edges([
        src('src/a.c', '#include "a.h"\n#include "inc/b.h"\n#include <stdio.h>'), src('src/a.h', ''), src('src/inc/b.h', ''),
    ], 'c'), ['src/a.c>src/a.h', 'src/a.c>src/inc/b.h']);
});

test('Blueprint of a file: a Go routine has a body, and obj.method() is a call when only one routine has that name', () => {
    const go = ['package main', '', 'func helper(a int) int {', '\treturn a + 1', '}', '', 'func run(x int) {', '\thelper(x)', '}'];
    assert.deepEqual(bracedBody(go, 2, familyOf('go')!), { start: 2, end: 4 });
    assert.deepEqual(bracedBody(go, 6, familyOf('go')!), { start: 6, end: 8 });
    assert.equal(bracedBody(['func f()', '', 'var x int'], 0, familyOf('go')!), undefined, 'a declaration has no body');
    const ts = ['class Svc {', '  run(x) {', '    return 1;', '  }', '  other() {', '    this.run(2);', '  }', '}', 'function main() {', '  const s = new Svc();', '  s.other();', '}'];
    const r = [{ id: 'run', name: 'run', owner: 'Svc', body: { start: 1, end: 3 } }, { id: 'other', name: 'other', owner: 'Svc', body: { start: 4, end: 6 } }, { id: 'main', name: 'main', body: { start: 8, end: 11 } }];
    assert.deepEqual(findCalls(r, ts, familyOf('typescript')!).calls.map(c => c.from + '>' + c.to).sort(), ['main>other', 'other>run']);
    const twin = [...r, { id: 'run2', name: 'run', owner: 'Other', body: { start: 12, end: 13 } }];
    assert.ok(!findCalls(twin, [...ts, 'class Other {', '  run() {}'], familyOf('typescript')!).calls.some(c => c.to === 'run' && c.from === 'main'), 'two routines named run: the receiver decides, so no guess');
});
