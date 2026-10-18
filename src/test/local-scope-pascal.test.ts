import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

const module = require('node:module');
const originalLoad = module._load;
const vscodeMock = {
    Uri: { file: (p: string) => ({ fsPath: p, path: p, toString: () => p }), parse: (u: string) => ({ path: u }) },
    Position: class { constructor(public line: number, public character: number) {} },
    Range: class {
        start: { line: number; character: number }; end: { line: number; character: number };
        constructor(a: any, b: any, c?: number, d?: number) {
            if (c === undefined) { this.start = a; this.end = b; }
            else { this.start = { line: a, character: b }; this.end = { line: c, character: d }; }
        }
        contains(p: { line: number }) { return p.line >= this.start.line && p.line <= this.end.line; }
    },
    EndOfLine: { LF: 0 },
};
module._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as typeof import('../providers/PascalLanguageProvider');

function makeDoc(src: string) {
    return {
        getText: () => src,
        lineAt: (i: number) => ({ text: src.split(/\r?\n/)[i] ?? '' }),
        lineCount: src.split(/\r?\n/).length,
        uri: { fsPath: 'x.pas' },
    } as any;
}

test('Pascal parseLocals finds var locals and params', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../test-fixtures/local-scope.pas'), 'utf8');
    const doc = makeDoc(src);
    const prov = new PascalLanguageProvider();
    const parsed = prov.parseDocument(doc);
    const cls = parsed.classes.find(c => c.name === 'TCalc')!;
    const sum = cls.members.find(m => m.name === 'Sum')!;
    const locals = prov.parseLocals(doc, sum);
    const names = locals.map(l => l.name);
    assert.ok(names.includes('Result2'), 'has Result2');
    assert.ok(names.includes('Name'), 'has Name');
    assert.ok(names.includes('A') && names.includes('B'), 'has params A,B');
    const nameVar = locals.find(l => l.name === 'Name')!;
    assert.equal(nameVar.type, 'string');
    const a = locals.find(l => l.name === 'A')!;
    assert.equal(a.isParam, true);
});

test('Pascal getMethodBodyRange is between begin and end', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../test-fixtures/local-scope.pas'), 'utf8');
    const doc = makeDoc(src);
    const prov = new PascalLanguageProvider();
    const parsed = prov.parseDocument(doc);
    const sum = parsed.classes.find(c => c.name === 'TCalc')!.members.find(m => m.name === 'Sum')!;
    const body = prov.getMethodBodyRange(doc, sum)!;
    assert.ok(body, 'body range defined');
    const lines = src.split(/\r?\n/);
    assert.match(lines[body.start.line], /^\s*Result2/, 'body starts after begin');
});
