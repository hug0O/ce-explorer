import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

const module = require('node:module');
const originalLoad = module._load;
const vscodeMock = {
    Position: class { constructor(public line: number, public character: number) {} },
    Range: class {
        start: { line: number; character: number }; end: { line: number; character: number };
        constructor(a: any, b: any, c?: number, d?: number) {
            if (c === undefined) { this.start = a; this.end = b; }
            else { this.start = { line: a, character: b }; this.end = { line: c, character: d }; }
        }
    },
    Uri: { file: (p: string) => ({ fsPath: p }) },
    EndOfLine: { LF: 0 },
};
module._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as typeof import('../providers/PascalLanguageProvider');
const { LocalScopeAnalyzer } = require('../services/LocalScopeAnalyzer') as typeof import('../services/LocalScopeAnalyzer');

function makeDoc(src: string) {
    return {
        getText: () => src,
        lineAt: (i: number) => ({ text: src.split(/\r?\n/)[i] ?? '' }),
        lineCount: src.split(/\r?\n/).length,
        uri: { fsPath: 'x.pas' },
    } as any;
}

test('LocalScopeAnalyzer.getScope returns MethodScope with locals', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../test-fixtures/local-scope.pas'), 'utf8');
    const doc = makeDoc(src);
    const prov = new PascalLanguageProvider();
    const parsed = prov.parseDocument(doc);
    const sum = parsed.classes.find(c => c.name === 'TCalc')!.members.find(m => m.name === 'Sum')!;
    const analyzer = new LocalScopeAnalyzer();
    const scope = analyzer.getScope(doc, prov, sum);
    assert.ok(scope, 'scope defined');
    const names = scope!.locals.map(l => l.name);
    assert.ok(names.includes('Result2'));
    assert.equal(scope!.lspAvailable, false);
});

test('LocalScopeAnalyzer.getScope returns undefined when no body', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../test-fixtures/local-scope.pas'), 'utf8');
    const doc = makeDoc(src);
    const prov = new PascalLanguageProvider();
    const parsed = prov.parseDocument(doc);
    const sum = parsed.classes.find(c => c.name === 'TCalc')!.members.find(m => m.name === 'Sum')!;
    // Force getMethodBodyRange to undefined by mangling implementationRange.
    sum.implementationRange = undefined;
    const analyzer = new LocalScopeAnalyzer();
    const scope = analyzer.getScope(doc, prov, sum);
    assert.equal(scope, undefined);
});
