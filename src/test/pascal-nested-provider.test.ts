import { test } from 'node:test';
import assert from 'node:assert/strict';

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;
const vscodeMock = {
    Uri: { file: (p: string) => ({ fsPath: p, path: p, toString: () => p }), parse: (u: string) => ({ path: u }) },
    Position: class { constructor(public readonly line: number, public readonly character: number) {} },
    Range: class {
        public readonly start: { line: number; character: number };
        public readonly end: { line: number; character: number };
        constructor(a: { line: number; character: number } | number, b: { line: number; character: number } | number, c?: number, d?: number) {
            if (c === undefined) { this.start = a as { line: number; character: number }; this.end = b as { line: number; character: number }; }
            else { this.start = { line: a as number, character: b as number }; this.end = { line: c, character: d as number }; }
        }
        contains(p: { line: number }): boolean { return p.line >= this.start.line && p.line <= this.end.line; }
    },
    EndOfLine: { LF: 0 },
    languages: {},
};
nodeModule._load = (request: string, parent: unknown, isMain: boolean) => (request === 'vscode' ? vscodeMock : originalLoad(request, parent, isMain));
const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as typeof import('../providers/PascalLanguageProvider');
const { manageListHtml } = require('../webview/manageSection') as typeof import('../webview/manageSection');

const SRC = [
    'unit U;',                                   // 0
    'interface',
    'type',
    '  TF = class',
    '    procedure Run;',
    '    procedure After;',                      // 5
    '  end;',
    'procedure Solo;',                           // 7
    'implementation',                            // 8
    'procedure TF.Run;',                         // 9
    'var',
    '  iCount: Integer;',
    '  procedure Calc;',                         // 12
    '  begin',
    '    iCount := 1;',
    '  end;',                                    // 15
    '  function Total: Integer;',                // 16
    '    procedure Deep;',                       // 17
    '    begin',
    '    end;',                                  // 19
    '  begin',
    '    Result := 1;',
    '  end;',                                    // 22
    'begin',                                     // 23
    '  Calc;',
    'end;',                                      // 25
    '',
    'procedure TF.After;',                       // 27
    'begin',
    'end;',                                      // 29
    '',
    'procedure Solo;',                           // 31
    '  procedure Helper;',                       // 32
    '  begin',
    '  end;',                                    // 34
    'begin',
    '  Helper;',
    'end;',                                      // 37
    'end.',
].join('\n');

function parse(): any {
    const lines = SRC.split('\n');
    const doc: any = { uri: vscodeMock.Uri.file('U.pas'), languageId: 'pascal', fileName: 'U.pas', lineCount: lines.length, getText: () => SRC, lineAt: (n: number) => ({ text: lines[n] }) };
    return new PascalLanguageProvider().parseDocument(doc);
}

test('a routine that holds others ends at its own end, not at the first one', () => {
    const cls = parse().classes[0];
    const run = cls.members.find((m: any) => m.name === 'Run');
    assert.deepEqual([run.implementationRange.start.line, run.implementationRange.end.line], [9, 25]);
    const after = cls.members.find((m: any) => m.name === 'After');
    assert.deepEqual([after.implementationRange.start.line, after.implementationRange.end.line], [27, 29], 'and the next one starts where it should');
});

test('the routines declared inside a method, and inside a standalone routine', () => {
    const parsed = parse();
    const run = parsed.classes[0].members.find((m: any) => m.name === 'Run');
    assert.deepEqual(run.nested.map((n: any) => [n.name, n.kind, n.line, n.endLine, n.depth]), [
        ['Calc', 'procedure', 12, 15, 0], ['Total', 'function', 16, 22, 0], ['Deep', 'procedure', 17, 19, 1],
    ]);
    assert.equal(parsed.classes[0].members.find((m: any) => m.name === 'After').nested, undefined, 'none: no property at all');
    const solo = parsed.standaloneProcedures.find((m: any) => m.name === 'Solo');
    assert.deepEqual(solo.nested.map((n: any) => n.name), ['Helper']);
});

test('Structure shows them under the routine, a click goes to their line, the filter finds them', () => {
    const run = parse().classes[0].members.find((m: any) => m.name === 'Run');
    const row = { id: run.id, name: 'Run', kind: 'method' as never, visibility: 'public' as never, params: 0, selected: false, line: 4, nested: run.nested.map((n: any) => ({ name: n.name, kind: n.kind, line: n.line, depth: n.depth })) };
    const html = manageListHtml({
        typeOptions: [], selectedType: 'c', isFile: false, add: { field: true, method: true, property: true, constructor: true }, canMove: false,
        rows: [row], filter: '', kindFilter: '', group: 'source',
    });
    const nested = [...html.matchAll(/<li class="mnested d(\d)" data-m-act="goline" data-id="(\d+)"[^>]*><span>↳<\/span><span class="mnname">(\w+)<\/span><span class="mnkind">(\w+)<\/span>/g)].map(m => [m[1], m[2], m[3], m[4]]);
    assert.deepEqual(nested, [['0', '12', 'Calc', 'procedure'], ['0', '16', 'Total', 'function'], ['1', '17', 'Deep', 'procedure']]);
    assert.match(html, /class="mrow"[^>]*data-text="run [^"]*calc total deep"/, 'a search for Calc finds the routine that holds it');
    assert.ok(html.indexOf('class="mrow') < html.indexOf('class="mnested'), 'under the row');
    assert.ok(!/data-m-act="(edit|rename|delete)" data-id="12"/.test(html), 'they are not members: no edit, rename or delete');
});
