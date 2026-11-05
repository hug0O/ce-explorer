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
        constructor(a: any, b: any, c?: number, d?: number) {
            if (c === undefined) { this.start = a; this.end = b; } else { this.start = { line: a, character: b }; this.end = { line: c, character: d as number }; }
        }
        contains(p: { line: number }): boolean { return p.line >= this.start.line && p.line <= this.end.line; }
    },
    EndOfLine: { LF: 0 }, languages: {},
};
nodeModule._load = (request: string, parent: unknown, isMain: boolean) => (request === 'vscode' ? vscodeMock : originalLoad(request, parent, isMain));
const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as typeof import('../providers/PascalLanguageProvider');

const SRC = [
    'unit UTools;', 'interface', 'type',
    '  TBox<T> = class', '  private', '    FItem: T;', '  public', '    procedure Put(const AItem: T);', '    function Get: T;', '  end;',
    '  TPair<K, V> = record', '    Key: K;', '    Value: V;', '  end;',
    '  Registry = class', '  public', '    procedure Add(const S: string);', '  end;',
    'function Max<T>(const A, B: T): T;', 'procedure Log(const S: string);',
    'implementation',
    'procedure TBox<T>.Put(const AItem: T);', 'begin', '  FItem := AItem;', 'end;',
    'function TBox<T>.Get: T;', 'begin', '  Result := FItem;', 'end;',
    'procedure Registry.Add(const S: string);', 'begin', 'end;',
    'function Max<T>(const A, B: T): T;', 'begin', '  Result := A;', 'end;',
    'procedure Log(const S: string);', 'begin', 'end;',
    'end.',
].join('\n');

test('a generic class or record of a custom unit is a class with its members, and its methods are not routines of the unit', () => {
    const lines = SRC.split('\n');
    const doc: any = { uri: vscodeMock.Uri.file('UTools.pas'), languageId: 'pascal', fileName: 'UTools.pas', lineCount: lines.length, getText: () => SRC, lineAt: (n: number) => ({ text: lines[n], range: new vscodeMock.Range(n, 0, n, lines[n].length) }) };
    const parsed = new PascalLanguageProvider().parseDocument(doc);
    const by = (n: string): any => parsed.classes.find((c: any) => c.name === n);
    assert.deepEqual(parsed.classes.map((c: any) => c.name), ['TBox', 'TPair', 'Registry']);
    assert.deepEqual(by('TBox').members.map((m: any) => m.name), ['FItem', 'Put', 'Get']);
    assert.equal(by('TPair').classType, 'record');
    const put = by('TBox').members.find((m: any) => m.name === 'Put');
    assert.equal(put.implementationRange.start.line, 21, 'TBox<T>.Put is the implementation of Put');
    assert.deepEqual(by('Registry').members.map((m: any) => m.name), ['Add'], 'a class whose name does not start with T');
    assert.equal(by('Registry').members[0].implementationRange.start.line, 29);
    assert.deepEqual(parsed.standaloneProcedures.map((p: any) => p.name), ['Max', 'Log'], 'only the routines of the unit, the generic one included');
});
