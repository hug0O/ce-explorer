import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

// PlSqlLanguageProvider only needs Uri/Position/Range from the vscode mock.
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

const { PlSqlLanguageProvider } = require('../providers/PlSqlLanguageProvider') as typeof import('../providers/PlSqlLanguageProvider');
const { MemberKind } = require('../models/types') as typeof import('../models/types');

const fixturePath = path.join(__dirname, '..', '..', 'test-fixtures', 'example.pkb');
const fixture = fs.readFileSync(fixturePath, 'utf8');

function makeDoc(text: string, fsPath = '/proj/example.pkb'): any {
    return {
        uri: (vscodeMock.Uri as any).file(fsPath),
        languageId: 'plsql',
        lineCount: text.split(/\r?\n/).length,
        getText: () => text,
    };
}

const provider = new PlSqlLanguageProvider();
const parsed = provider.parseDocument(makeDoc(fixture));

test('PL/SQL: package body parses to one package class named PKG_DEMO', () => {
    assert.equal(parsed.classes.length, 1);
    const pkg = parsed.classes[0];
    assert.equal(pkg.name, 'PKG_DEMO');
    assert.equal(pkg.classType, 'package');
    assert.equal(pkg.range.start.line, 0, 'package starts on the first line');
    assert.ok(pkg.range.end.line >= fixture.split(/\r?\n/).length - 2, 'package range extends to the END line');
});

test('PL/SQL: nothing leaks out as standalone procedures', () => {
    assert.equal(parsed.standaloneProcedures.length, 0);
});

test('PL/SQL: package globals become fields with their types', () => {
    const fields = parsed.classes[0].members.filter(mm => mm.kind === MemberKind.Field);
    const byName = new Map(fields.map(f => [f.name, f]));
    assert.deepEqual([...byName.keys()].sort(), ['g_count', 'g_created', 'g_name']);
    assert.equal(byName.get('g_count')?.type, 'NUMBER');
    assert.equal(byName.get('g_name')?.type, 'VARCHAR2(100)');
    assert.equal(byName.get('g_created')?.type, 'DATE');
});

test('PL/SQL: procedures and functions become methods', () => {
    const methods = parsed.classes[0].members.filter(mm => mm.kind === MemberKind.Method);
    const names = methods.map(mm => mm.name);
    assert.deepEqual(names.sort(), ['calcul_total', 'get_name', 'reset']);

    const calcul = methods.find(mm => mm.name === 'calcul_total')!;
    assert.equal(calcul.parameters.length, 3);
    const pTotal = calcul.parameters.find(p => p.name === 'p_total')!;
    assert.equal(pTotal.direction, 'out');
    assert.equal(pTotal.isOut, true);

    const getName = methods.find(mm => mm.name === 'get_name')!;
    assert.equal(getName.returnType, 'VARCHAR2');
    assert.equal(getName.parameters.length, 1);
    assert.equal(getName.parameters[0].name, 'p_id');

    const reset = methods.find(mm => mm.name === 'reset')!;
    assert.equal(reset.parameters.length, 0);
});

test('PL/SQL: method ranges stay within the package and cover their bodies', () => {
    const pkg = parsed.classes[0];
    const calcul = pkg.members.find(mm => mm.name === 'calcul_total')!;
    assert.ok(calcul.range.start.line >= pkg.range.start.line);
    assert.ok(calcul.range.end.line <= pkg.range.end.line);
    assert.ok(calcul.implementationRange, 'method has an implementation range');
    assert.ok(calcul.implementationRange!.end.line > calcul.range.end.line, 'implementation extends past the signature');
});

test('PL/SQL: lowercase keywords are accepted (case-insensitive parsing)', () => {
    const text = 'create or replace package body pkg_low is\n  procedure p1 is\n  begin\n    null;\n  end;\nend pkg_low;\n';
    const parsedLow = provider.parseDocument(makeDoc(text, '/proj/low.pkb'));
    assert.equal(parsedLow.classes.length, 1);
    assert.equal(parsedLow.classes[0].name, 'pkg_low');
    const methods = parsedLow.classes[0].members.filter(mm => mm.kind === MemberKind.Method);
    assert.equal(methods.length, 1);
    assert.equal(methods[0].name, 'p1');
});
