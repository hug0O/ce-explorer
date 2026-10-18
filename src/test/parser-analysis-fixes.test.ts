import { test } from 'node:test';
import assert from 'node:assert/strict';

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;

class FakePosition {
    constructor(public readonly line: number, public readonly character: number) {}
}
class FakeRange {
    public readonly start: { line: number; character: number };
    public readonly end: { line: number; character: number };
    constructor(a: any, b: any, c?: number, d?: number) {
        if (c === undefined) { this.start = a; this.end = b; }
        else { this.start = { line: a, character: b }; this.end = { line: c, character: d as number }; }
    }
    contains(p: { line: number }): boolean { return p.line >= this.start.line && p.line <= this.end.line; }
}
const vscodeMock = {
    Uri: { file: (p: string) => ({ fsPath: p, path: p, toString: () => p }) },
    Position: FakePosition,
    Range: FakeRange,
    EndOfLine: { LF: 0 },
    workspace: { textDocuments: [] },
};
nodeModule._load = (request: string, parent: unknown, isMain: boolean) =>
    request === 'vscode' ? vscodeMock : originalLoad(request, parent, isMain);

const { JavaLanguageProvider } = require('../providers/JavaLanguageProvider') as typeof import('../providers/JavaLanguageProvider');
const { CSharpLanguageProvider } = require('../providers/CSharpLanguageProvider') as typeof import('../providers/CSharpLanguageProvider');
const { RustLanguageProvider } = require('../providers/RustLanguageProvider') as typeof import('../providers/RustLanguageProvider');
const { PlSqlLanguageProvider } = require('../providers/PlSqlLanguageProvider') as typeof import('../providers/PlSqlLanguageProvider');

function doc(fileName: string, languageId: string, text: string): any {
    return {
        uri: vscodeMock.Uri.file(fileName),
        languageId,
        fileName,
        lineCount: text.split(/\r?\n/).length,
        getText: () => text,
    };
}

test('Java: package-private members and interface methods are parsed', () => {
    const src = [
        'class Box {',
        '    int size;',
        '    String label() { return "x"; }',
        '    @Override public String toString() { return label(); }',
        '    void grow() {',
        '        int tmp = 1;',
        '        helper(tmp);',
        '    }',
        '}',
        'interface Shape {',
        '    double area();',
        '    String name();',
        '}',
    ].join('\n');
    const parsed = new JavaLanguageProvider().parseDocument(doc('Box.java', 'java', src));
    const box = parsed.classes.find(c => c.name === 'Box')!;
    assert.deepEqual(
        box.members.map(m => `${m.kind}:${m.name}`),
        ['field:size', 'method:label', 'method:toString', 'method:grow'],
        'locals and calls inside a method body must not become members',
    );
    const shape = parsed.classes.find(c => c.name === 'Shape')!;
    assert.deepEqual(shape.members.map(m => m.name), ['area', 'name']);
    assert.ok(shape.members.every(m => m.implementationRange === undefined), 'interface methods have no body to borrow');
});

test('C#: multi-line properties, interface methods and bodyless members', () => {
    const src = [
        'public class Item',
        '{',
        '    int _n;',
        '    public int Count',
        '    {',
        '        get { return _n; }',
        '        set { _n = value; }',
        '    }',
        '    public void Run()',
        '    {',
        '        var x = 1;',
        '    }',
        '}',
        'public interface IThing',
        '{',
        '    void First();',
        '    void Second();',
        '}',
    ].join('\n');
    const parsed = new CSharpLanguageProvider().parseDocument(doc('Item.cs', 'csharp', src));
    const item = parsed.classes.find(c => c.name === 'Item')!;
    assert.deepEqual(item.members.map(m => `${m.kind}:${m.name}`), ['field:_n', 'property:Count', 'method:Run']);
    const thing = parsed.classes.find(c => c.name === 'IThing')!;
    assert.deepEqual(thing.members.map(m => m.name), ['First', 'Second']);
    assert.equal(thing.members[0].implementationRange, undefined, 'First() must not swallow the next member');
});

test('Rust: a default method after a bodyless trait method is still parsed', () => {
    const src = [
        'trait HasId {',
        '    fn get_id(&self) -> u64;',
        '    fn describe(&self) -> String {',
        '        String::new()',
        '    }',
        '    fn other(&self);',
        '}',
    ].join('\n');
    const parsed = new RustLanguageProvider().parseDocument(doc('t.rs', 'rust', src));
    const trait = parsed.classes.find(c => c.name === 'HasId')!;
    assert.deepEqual(trait.members.map(m => m.name), ['get_id', 'describe', 'other']);
});

test('PL/SQL: new subprograms land inside the package, variables before the first subprogram', () => {
    const src = [
        'CREATE OR REPLACE PACKAGE BODY pkg AS',
        '  g_count NUMBER;',
        '  PROCEDURE first_proc IS',
        '  BEGIN',
        '    NULL;',
        '  END first_proc;',
        'END pkg;',
    ].join('\n');
    const provider = new PlSqlLanguageProvider();
    const cls = provider.parseDocument(doc('pkg.pkb', 'plsql', src)).classes[0];
    const spec: any = {
        kind: 'method', name: 'do_it', returnType: 'void', visibility: 'public', parameters: [],
        modifiers: [], isStatic: false, isVirtual: false, isAbstract: false, isOverride: false, isFinal: false,
    };
    const method = provider.generateMethod(cls.name, spec, cls);
    assert.equal(method.declarationPosition.line, cls.range.end.line, 'inserted before the closing END of the package');
    assert.ok(!method.declaration.includes('do_it()'), 'PL/SQL rejects empty parentheses');

    const field = provider.generateField(cls.name, { kind: 'field', name: 'g_other', type: 'NUMBER', visibility: 'public' } as any, cls);
    const firstSub = cls.members.find(m => m.name === 'first_proc')!;
    assert.equal(field.declarationPosition.line, firstSub.range.start.line, 'variable declared before the first subprogram');
});
