import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Regression: adding a method/field to a Pascal class must ALWAYS land inside
// the class body — the class's `end;` must stay below the generated
// declaration, whatever the member ranges look like.
const m = require('node:module');
const originalLoad = m._load;
const mkUri = (fsPath: string) => ({ fsPath, path: fsPath, toString: () => fsPath });
class FakePosition {
    constructor(public line: number, public character: number) {}
}
class FakeRange {
    start: any; end: any;
    constructor(a: any, b: any, c?: number, d?: number) {
        if (c === undefined) { this.start = a; this.end = b; }
        else { this.start = { line: a, character: b }; this.end = { line: c, character: d }; }
    }
}
const UNIT = [
    'unit ufoo;',
    '',
    'interface',
    '',
    'type',
    '  TFoo = class',
    '  private',
    '    FName: string;',
    '  public',
    '    procedure Bar;',
    '    property Name: string read FName write FName;',
    '  end;',
    '',
    'implementation',
    '',
    'procedure TFoo.Bar;',
    'begin',
    'end;',
    '',
    'end.',
].join('\n');

function makeDoc(text: string, fsPath: string): any {
    const lines = text.split(/\r?\n/);
    return {
        uri: mkUri(fsPath),
        fileName: fsPath,
        languageId: 'pascal',
        lineCount: lines.length,
        lineAt: (i: number) => ({ text: lines[i] ?? '' }),
        getText: () => text,
        positionAt: (o: number) => {
            const before = text.slice(0, o).split(/\r?\n/);
            return { line: before.length - 1, character: before[before.length - 1].length };
        },
    };
}

const doc = makeDoc(UNIT, '/proj/ufoo.pas');
const vscodeMock = {
    Uri: { file: mkUri, parse: (u: string) => mkUri(u) },
    Position: FakePosition,
    Range: FakeRange,
    WorkspaceEdit: class { replace() {} insert() {} delete() {} },
    EndOfLine: { LF: 0 },
    workspace: {
        textDocuments: [doc],
        getConfiguration: () => ({ get: (_k: string, d?: boolean) => d ?? false }),
        asRelativePath: (uri: any) => uri.fsPath,
        openTextDocument: async (uri: any) => makeDoc('', uri.fsPath),
    },
};
m._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as any;
const { simulateEdits } = require('../services/SafePreview') as any;
const { generateFromSpec } = require('../services/memberForm') as any;
const { MemberKind, Visibility } = require('../models/types') as any;

function addMethod(provider: any, cls: any, text: string, visibility: string, name = 'ZZZNewMeth'): string {
    const spec = {
        kind: MemberKind.Method, name, returnType: undefined,
        visibility, parameters: [], modifiers: [],
        isStatic: false, isVirtual: false, isAbstract: false, isOverride: false, isFinal: false,
    };
    const gen = generateFromSpec(provider, cls, spec);
    const edits: any[] = [];
    if (gen.declaration) {
        edits.push({ range: new FakeRange(gen.declarationPosition, gen.declarationPosition), newText: gen.declaration });
    }
    if (gen.implementation) {
        edits.push({ range: new FakeRange(gen.implementationPosition, gen.implementationPosition), newText: gen.implementation });
    }
    return simulateEdits(text, edits);
}

/** Line of the class's end; in the RESULT text, and where the new member went. */
function assertInsideClass(result: string, classStart: number, memberName: string): void {
    const lines = result.split(/\r?\n/);
    const declLine = lines.findIndex(l => l.includes(memberName));
    assert.ok(declLine >= 0, 'generated declaration must exist in the result');
    assert.ok(classStart >= 0, 'class start line must be known');
    let endLine = -1;
    for (let i = classStart; i < lines.length; i++) {
        if (/^\s*end\s*;/i.test(lines[i] || '')) { endLine = i; break; }
    }
    assert.ok(endLine >= 0, 'class end; must still exist');
    assert.ok(declLine < endLine,
        `${memberName} (l${declLine}) must be INSIDE the class, before its end; (l${endLine})`);
}

test('Pascal: adding a method keeps the class end; below the declaration', () => {
    const provider = new PascalLanguageProvider();
    const parsed = provider.parseDocument(doc);
    const cls = parsed.classes.find((c: any) => c.name === 'TFoo');
    assert.ok(cls);
    const result = addMethod(provider, cls, UNIT, 'public');
    assertInsideClass(result, cls.range.start.line, 'ZZZNewMeth');
});

test('Pascal: real 3000-line Delphi unit — every class x visibility inserts inside the class', () => {
    const fixture = path.join(__dirname, '..', '..', 'test-fixtures', 'offre_unit.pas');
    const text = fs.readFileSync(fixture, 'utf8');
    const realDoc = makeDoc(text, '/proj/offre_unit.pas');
    (vscodeMock.workspace as any).textDocuments = [realDoc];
    const provider = new PascalLanguageProvider();
    const parsed = provider.parseDocument(realDoc);
    assert.ok(parsed.classes.length >= 5, 'fixture must contain several classes');
    for (const cls of parsed.classes) {
        for (const vis of ['published', 'public', 'private']) {
            const result = addMethod(provider, cls, text, vis);
            assertInsideClass(result, cls.range.start.line, 'ZZZNewMeth');
        }
    }
});

test('Pascal: local-var insert position is always at column 0 (never mid-line)', () => {
    const provider = new PascalLanguageProvider();
    const varUnit = [
        'unit uvar;',
        'interface',
        'implementation',
        '',
        'procedure WithVars;',
        'var',
        '  a: Integer;',
        '  s: string;',
        'begin',
        '  a := 1;',
        'end;',
        '',
        'end.',
    ].join('\n');
    const varDoc = makeDoc(varUnit, '/proj/uvar.pas');
    (vscodeMock.workspace as any).textDocuments = [varDoc];
    const parsed = provider.parseDocument(varDoc);
    const member = parsed.standaloneProcedures.find((p: any) => p.name === 'WithVars');
    assert.ok(member, 'WithVars must be parsed');

    const pos = provider.getDeclarationInsertPosition(varDoc, member);
    assert.equal(pos.character, 0, `insert column must be 0, got ${pos.character} (mid-line insert breaks the declaration below)`);
    // The line at the insert position must be a clean declaration boundary —
    // inserting there must not corrupt the existing var declarations.
    const edits = [{ range: new FakeRange(pos, pos), newText: '  b: Integer;\n' }];
    const result = simulateEdits(varUnit, edits);
    assert.match(result, /var\r?\n {2}b: Integer;\r?\n {2}a: Integer;/, 'new local must land as its own line inside the var section');
});

test('Pascal: a field created with public visibility lands in the public section', () => {
    const provider = new PascalLanguageProvider();
    const parsed = provider.parseDocument(doc);
    const cls = parsed.classes.find((c: any) => c.name === 'TFoo');
    assert.ok(cls);
    const gen = provider.generateField(cls.name, {
        kind: MemberKind.Field, name: 'ZZZField', type: 'Integer', visibility: Visibility.Public,
    }, cls);
    const edits = [{ range: new FakeRange(gen.declarationPosition, gen.declarationPosition), newText: gen.declaration }];
    const result = simulateEdits(UNIT, edits);
    assertInsideClass(result, cls.range.start.line, 'ZZZField');
    const lines = result.split(/\r?\n/);
    const fieldLine = lines.findIndex(l => l.includes('ZZZField'));
    const publicLine = lines.findIndex(l => /^\s*public\s*$/i.test(l));
    assert.ok(publicLine >= 0 && fieldLine > publicLine, 'field must be after the public section keyword');
});

test('Pascal: an overshooting member range cannot push the declaration past end;', () => {
    const provider = new PascalLanguageProvider();
    const parsed = provider.parseDocument(doc);
    const cls = parsed.classes.find((c: any) => c.name === 'TFoo');
    // Simulate a stale/overshooting parse: the last public member claims to end
    // ON the class end; line.
    const brokenCls = JSON.parse(JSON.stringify(cls));
    const lastPub = brokenCls.members.filter((mm: any) => mm.visibility === 'public').pop();
    lastPub.range.end.line = brokenCls.range.end.line;
    const result = addMethod(provider, brokenCls, UNIT, 'public');
    assertInsideClass(result, brokenCls.range.start.line, 'ZZZNewMeth');
});

test('Pascal: adding a field keeps the class end; below the declaration', () => {
    const provider = new PascalLanguageProvider();
    const parsed = provider.parseDocument(doc);
    const cls = parsed.classes.find((c: any) => c.name === 'TFoo');
    const brokenCls = JSON.parse(JSON.stringify(cls));
    const lastPriv = brokenCls.members.filter((mm: any) => mm.visibility === 'private').pop();
    lastPriv.range.end.line = brokenCls.range.end.line;
    const gen = provider.generateField(brokenCls.name, {
        kind: MemberKind.Field, name: 'ZZZField', type: 'Integer', visibility: Visibility.Private,
    }, brokenCls);
    const edits: any[] = [{ range: new FakeRange(gen.declarationPosition, gen.declarationPosition), newText: gen.declaration }];
    const result = simulateEdits(UNIT, edits);
    assertInsideClass(result, brokenCls.range.start.line, 'ZZZField');
});
