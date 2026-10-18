import { test } from 'node:test';
import assert from 'node:assert/strict';

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
    EndOfLine: { LF: 0 },
};
module._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { computeRenameEdits } = require('../services/LocalRefactorService') as typeof import('../services/LocalRefactorService');
const { computeTypeEdit } = require('../services/LocalRefactorService') as typeof import('../services/LocalRefactorService');

function applyEdits(lines: string[], edits: { line: number; startChar: number; endChar: number; newText: string }[]): string[] {
    const out = [...lines];
    // apply bottom-to-top so earlier columns stay valid
    const sorted = [...edits].sort((a, b) => b.line - a.line || b.startChar - a.startChar);
    for (const e of sorted) {
        out[e.line] = out[e.line].slice(0, e.startChar) + e.newText + out[e.line].slice(e.endChar);
    }
    return out;
}

function scope(startLine: number, endLine: number): any {
    return { method: {} as any, bodyRange: new (vscodeMock.Range as any)(startLine, 0, endLine, 0), locals: [], lspAvailable: false };
}

test('renameLocal: replaces all occurrences in body, not before/after', () => {
    const lines = [
        'int x = 0;',          // 0 outside (before body)
        'void m() {',          // 1
        '  int x = 1;',        // 2 body start
        '  return x;',         // 3
        '}',                   // 4 body end
        'int y = x;',          // 5 outside (after body)
    ];
    const local = { name: 'x', isParam: false } as any;
    const edits = computeRenameEdits(lines, scope(2, 3), local, 'xx');
    assert.equal(edits.length, 2, 'two occurrences in body');
    const result = applyEdits(lines, edits);
    assert.equal(result[2], '  int xx = 1;');
    assert.equal(result[3], '  return xx;');
    assert.equal(result[0], 'int x = 0;', 'outside untouched');
    assert.equal(result[5], 'int y = x;', 'outside untouched');
});

test('renameLocal: x -> xx not doubled (new name prefixes old)', () => {
    const lines = [
        'void m() {',
        '  int x = x + 1;',   // two x
        '}',
    ];
    const local = { name: 'x', isParam: false } as any;
    const edits = computeRenameEdits(lines, scope(1, 1), local, 'xx');
    assert.equal(edits.length, 2);
    const result = applyEdits(lines, edits);
    assert.equal(result[1], '  int xx = xx + 1;', 'no doubling to xxxx');
});

test('renameLocal: same name returns no edits', () => {
    const lines = ['void m() {', '  int x = 1;', '}'];
    const local = { name: 'x', isParam: false } as any;
    const edits = computeRenameEdits(lines, scope(1, 1), local, 'x');
    assert.equal(edits.length, 0);
});

test('renameLocal: dedup overlapping positions', () => {
    const lines = ['void m() {', '  int count = count;', '}'];
    const local = { name: 'count', isParam: false } as any;
    const edits = computeRenameEdits(lines, scope(1, 1), local, 'total');
    assert.equal(edits.length, 2);
    assert.equal(new Set(edits.map(e => e.line + ':' + e.startChar)).size, 2, 'distinct positions');
});

// --- computeTypeEdit ---
test('computeTypeEdit: replaces the declared type after the name', () => {
    const lines = ['void m() {', '  int result = a + b;', '}'];
    const local = { name: 'result', type: 'int', isParam: false, range: { start: { line: 1, character: 6 }, end: { line: 1, character: 12 } }, declarationRange: { start: { line: 1 } } } as any;
    const edit = computeTypeEdit(lines, local, 'long');
    assert.ok(edit);
    const result = applyEdits(lines, [edit!]);
    assert.equal(result[1], '  long result = a + b;');
});

test('computeTypeEdit: untyped local returns undefined', () => {
    const lines = ['void m() {', '  var x = 1;', '}'];
    const local = { name: 'x', type: undefined, isParam: false } as any;
    const edit = computeTypeEdit(lines, local, 'int');
    assert.equal(edit, undefined);
});

// --- resolveIdentifierType (type inference from scope) ---
const { TypeScriptLanguageProvider } = require('../providers/TypeScriptLanguageProvider') as typeof import('../providers/TypeScriptLanguageProvider');
const ts = new TypeScriptLanguageProvider();

function scopeWithLocals(locals: { name: string; type?: string }[]): any {
    return {
        method: {} as any,
        bodyRange: new (vscodeMock.Range as any)(0, 0, 10, 0),
        locals: locals.map(l => ({ ...l, isParam: false })),
        lspAvailable: false,
    };
}

test('resolveIdentifierType: literal int', () => {
    assert.equal(ts.resolveIdentifierType('42', scopeWithLocals([])), 'number');
});

test('resolveIdentifierType: literal string', () => {
    assert.equal(ts.resolveIdentifierType('"hi"', scopeWithLocals([])), 'string');
});

test('resolveIdentifierType: resolves identifier from existing typed local', () => {
    assert.equal(ts.resolveIdentifierType('existing', scopeWithLocals([{ name: 'existing', type: 'number' }])), 'number');
});

test('resolveIdentifierType: resolves identifier from a typed parameter', () => {
    assert.equal(ts.resolveIdentifierType('p', scopeWithLocals([{ name: 'p', type: 'string' }])), 'string');
});

test('resolveIdentifierType: untyped local yields no inference', () => {
    assert.equal(ts.resolveIdentifierType('bare', scopeWithLocals([{ name: 'bare' }])), undefined);
});

test('resolveIdentifierType: non-identifier expression returns undefined', () => {
    assert.equal(ts.resolveIdentifierType('a + b', scopeWithLocals([{ name: 'a', type: 'number' }])), undefined);
});
