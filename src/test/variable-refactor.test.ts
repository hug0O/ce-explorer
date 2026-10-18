import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mock vscode only for module resolution; the pure helper under test does not
// touch the API, but importing OccurrenceFinder pulls the 'vscode' import.
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
        contains(p: any): boolean {
            // Line-only containment is enough for the resolver tests.
            const line = p && typeof p.line === 'number' ? p.line : (p && p.start ? p.start.line : -1);
            return line >= this.start.line && line <= this.end.line;
        }
        isEqual(other: any): boolean {
            return this.start.line === other?.start?.line && this.end.line === other?.end?.line;
        }
    },
};
m._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { scanNameInLines } = require('../services/OccurrenceFinder') as typeof import('../services/OccurrenceFinder');

test('scanNameInLines: finds all occurrences within the range', () => {
    const lines = ['int x = 0;', 'x = x + 1;', 'return x;', 'int y = 2;'];
    const hits = scanNameInLines(lines, 0, 3, 'x');
    // x appears at: L0 (decl), L1 (twice), L2 (once) = 4 total. y untouched.
    assert.equal(hits.length, 4);
    assert.deepEqual(hits[0], { line: 0, startChar: 4, endChar: 5 });
    assert.deepEqual(hits[1], { line: 1, startChar: 0, endChar: 1 });
});

test('scanNameInLines: respects word boundaries (no sub-token matches)', () => {
    const lines = ['int max = 0;', 'maxX = 1;', 'return maximum;'];
    const hits = scanNameInLines(lines, 0, 2, 'max');
    // 'max' matches only L0; 'maxX' and 'maximum' are not standalone 'max'.
    assert.equal(hits.length, 1);
    assert.equal(hits[0].line, 0);
});

test('scanNameInLines: deduplicates overlapping matches', () => {
    const lines = ['count = count;'];
    const hits = scanNameInLines(lines, 0, 0, 'count');
    assert.equal(hits.length, 2);
    assert.equal(new Set(hits.map(h => h.line + ':' + h.startChar)).size, 2);
});

test('scanNameInLines: no occurrences returns empty array', () => {
    const lines = ['int a = 1;', 'int b = 2;'];
    const hits = scanNameInLines(lines, 0, 1, 'z');
    assert.equal(hits.length, 0);
});

test('scanNameInLines: does not scan beyond endLine', () => {
    const lines = ['x', 'x', 'x', 'x'];
    const hits = scanNameInLines(lines, 0, 1, 'x');
    assert.equal(hits.length, 2);
    assert.equal(hits[0].line, 0);
    assert.equal(hits[1].line, 1);
});

// --- Regression: resolving a local at a usage site, not just the declaration ---
// Reproduces the offre_unit.pas scenario: cursor on `oQuery :=` (a usage of a
// var-declared local) must resolve to the local, NOT to the enclosing function.
const { resolveVariableAt } = require('../services/VariableResolver') as typeof import('../services/VariableResolver');
const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as typeof import('../providers/PascalLanguageProvider');

test('scanNameInLines: covers both var declaration and begin usage (sResult regression)', () => {
    // Mirrors pEmissionOFFPR: the implementation range spans var..end, so a
    // rename must hit the declaration line AND the usage inside begin.
    const lines = [
        'procedure pEmissionOFFPR;',  // 0
        'var',                        // 1
        '  sResult: String;',         // 2  <-- declaration (must be renamed)
        'begin',                      // 3
        '  sResult := f();',          // 4  <-- usage (must be renamed)
        '  ShowMessage(sResult);',    // 5  <-- usage
        'end;',                       // 6
    ];
    // Scan the full implementation range (0..6), like scanRangesFor now does.
    const hits = scanNameInLines(lines, 0, 6, 'sResult');
    assert.equal(hits.length, 3, 'declaration + 2 usages');
    assert.equal(hits[0].line, 2, 'hits the var declaration');
    assert.equal(hits[1].line, 4, 'hits the first usage');
    assert.equal(hits[2].line, 5, 'hits the second usage');
});

function makePascalDoc(src: string): any {
    const lines = src.split(/\r?\n/);
    return {
        getText: (range?: any) => {
            if (!range) { return src; }
            // Slice the requested range out of the full text, like VS Code.
            return lines[range.start.line]?.slice(range.start.character, range.end.character) ?? '';
        },
        lineCount: lines.length,
        lineAt: (i: number) => ({ text: lines[i] ?? '', range: new (vscodeMock.Range as any)(i, 0, i, (lines[i] ?? '').length) }),
        uri: { fsPath: 'x.pas', toString: () => 'x.pas' },
        // Find an identifier around the position and return its range, like VS Code.
        getWordRangeAtPosition: (pos: any, re: RegExp) => {
            const line = lines[pos.line] ?? '';
            const col = pos.character;
            const m = line.slice(col).match(/^[A-Za-z_]\w*/);
            if (!m) return undefined;
            return new (vscodeMock.Range as any)(pos.line, col, pos.line, col + m[0].length);
        },
    };
}

test('resolveVariableAt: local usage (oQuery :=) resolves to the local, not the function', () => {
    const src = [
        'unit x;',
        'interface',
        'function fCountLOFPR_ID(piOFFPR_ID : Integer) : Integer;',
        'implementation',
        'function fCountLOFPR_ID(piOFFPR_ID : Integer) : Integer;',
        'var',
        '  oQuery: TUNIQuery;',
        'begin',
        '  Result := 0;',
        '  oQuery := TUNIQuery.Create(nil);',
        '  oQuery.Free;',
        'end;',
        'end.',
    ].join('\n');
    const doc = makePascalDoc(src);
    const prov = new PascalLanguageProvider();
    // Cursor on `oQuery` at line 9 (the assignment), column 2.
    const pos = new (vscodeMock.Position as any)(9, 2);
    const ref = resolveVariableAt(doc, prov, pos);
    assert.ok(ref, 'should resolve to something');
    assert.equal(ref!.kind, 'local', 'must resolve to the local, not the function');
    assert.equal(ref!.name, 'oQuery');
    assert.equal(ref!.type, 'TUNIQuery');
});

test('resolveVariableAt: function name resolves to the standalone function', () => {
    const src = [
        'unit x;',
        'interface',
        'function fCountLOFPR_ID(piOFFPR_ID : Integer) : Integer;',
        'implementation',
        'function fCountLOFPR_ID(piOFFPR_ID : Integer) : Integer;',
        'begin',
        '  Result := 0;',
        'end;',
        'end.',
    ].join('\n');
    const doc = makePascalDoc(src);
    const prov = new PascalLanguageProvider();
    // Cursor on the function name at line 4, column 9 ("fCountLOFPR_ID").
    const pos = new (vscodeMock.Position as any)(4, 9);
    const ref = resolveVariableAt(doc, prov, pos);
    assert.ok(ref, 'should resolve to the function');
    assert.equal(ref!.kind, 'standalone');
    assert.equal(ref!.name, 'fCountLOFPR_ID');
});
