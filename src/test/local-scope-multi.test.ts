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

const { RustLanguageProvider } = require('../providers/RustLanguageProvider') as typeof import('../providers/RustLanguageProvider');
const { CSharpLanguageProvider } = require('../providers/CSharpLanguageProvider') as typeof import('../providers/CSharpLanguageProvider');
const { JavaLanguageProvider } = require('../providers/JavaLanguageProvider') as typeof import('../providers/JavaLanguageProvider');
const { TypeScriptLanguageProvider } = require('../providers/TypeScriptLanguageProvider') as typeof import('../providers/TypeScriptLanguageProvider');
const { PythonLanguageProvider } = require('../providers/PythonLanguageProvider') as typeof import('../providers/PythonLanguageProvider');
const { GoLanguageProvider } = require('../providers/GoLanguageProvider') as typeof import('../providers/GoLanguageProvider');
const { CppLanguageProvider } = require('../providers/CppLanguageProvider') as typeof import('../providers/CppLanguageProvider');
const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as typeof import('../providers/PascalLanguageProvider');

function makeDoc(src: string) {
    return {
        getText: () => src,
        lineAt: (i: number) => ({ text: src.split(/\r?\n/)[i] ?? '' }),
        lineCount: src.split(/\r?\n/).length,
        uri: { fsPath: 'x' },
    } as any;
}

function fixture(name: string): string {
    return fs.readFileSync(path.join(__dirname, '../../test-fixtures', name), 'utf8');
}

type ProviderCtor = new () => { parseDocument(doc: any): any };
function firstMember(provider: any, doc: any, className: string, memberName: string): any {
    const parsed = provider.parseDocument(doc);
    const cls = parsed.classes.find((c: any) => c.name === className);
    if (!cls) throw new Error('class ' + className + ' not found; classes=' + parsed.classes.map((c: any) => c.name).join(','));
    const m = cls.members.find((x: any) => x.name === memberName);
    if (!m) throw new Error('member ' + memberName + ' not found; members=' + cls.members.map((x: any) => x.name).join(','));
    return m;
}

// C++ methods live in .cpp files as standalone procedures (out-of-class bodies).
function firstStandalone(provider: any, doc: any, memberName: string): any {
    const parsed = provider.parseDocument(doc);
    const m = parsed.standaloneProcedures.find((x: any) => x.name === memberName);
    if (!m) throw new Error('standalone ' + memberName + ' not found; procs=' + parsed.standaloneProcedures.map((x: any) => x.name).join(','));
    return m;
}

function run(provider: any, file: string, className: string, memberName: string, expected: { names: string[]; typed?: Record<string, string> }) {
    const doc = makeDoc(fixture(file));
    const member = firstMember(provider, doc, className, memberName);
    const locals = provider.parseLocals(doc, member) as any[];
    const names = locals.map(l => l.name);
    for (const n of expected.names) {
        assert.ok(names.includes(n), `${file}: expected local "${n}", got [${names.join(',')}]`);
    }
    if (expected.typed) {
        for (const [k, v] of Object.entries(expected.typed)) {
            const l = locals.find(x => x.name === k);
            assert.ok(l, `${file}: local "${k}" missing`);
            assert.equal(l.type, v, `${file}: type of "${k}" expected ${v}`);
        }
    }
}

test('Rust parseLocals: let bindings', () => {
    run(new RustLanguageProvider() as any, 'local-scope.rs', 'Calc', 'sum', { names: ['result', 'name'], typed: { result: 'i32', name: 'String' } });
});
test('C# parseLocals: typed locals', () => {
    run(new CSharpLanguageProvider() as any, 'local-scope.cs', 'Calc', 'Sum', { names: ['result', 'name'], typed: { result: 'int', name: 'string' } });
});
test('Java parseLocals: typed locals', () => {
    run(new JavaLanguageProvider() as any, 'local-scope.java', 'Calc', 'sum', { names: ['result', 'name'], typed: { result: 'int', name: 'String' } });
});
test('TypeScript parseLocals: let bindings', () => {
    run(new TypeScriptLanguageProvider() as any, 'local-scope.ts', 'Calc', 'sum', { names: ['result', 'name'], typed: { result: 'number', name: 'string' } });
});
test('Python parseLocals: annotated locals', () => {
    run(new PythonLanguageProvider() as any, 'local-scope.py', 'Calc', 'sum', { names: ['result', 'name'], typed: { result: 'int', name: 'str' } });
});
test('Go parseLocals: var declarations', () => {
    run(new GoLanguageProvider() as any, 'local-scope.go', 'Calc', 'Sum', { names: ['result', 'name'], typed: { result: 'int', name: 'string' } });
});
test('C++ parseLocals: typed locals (standalone method body)', () => {
    const provider = new CppLanguageProvider();
    const doc = makeDoc(fixture('local-scope-cpp.cpp'));
    const member = firstStandalone(provider, doc, 'sum');
    const locals = provider.parseLocals(doc, member) as any[];
    const names = locals.map(l => l.name);
    assert.ok(names.includes('result'), `expected result, got [${names.join(',')}]`);
    assert.ok(names.includes('name'), `expected name, got [${names.join(',')}]`);
    const r = locals.find(l => l.name === 'result')!;
    assert.equal(r.type, 'int');
    const n = locals.find(l => l.name === 'name')!;
    assert.equal(n.type, 'std::string');
});

// --- guessTypeFromAssignment ---
const fakeScope = { lspAvailable: false, locals: [], bodyRange: new (vscodeMock.Range as any)(0, 0, 0, 0), method: {} as any };

function expectType(providerCtor: any, rhs: string, expected: string) {
    const p = new providerCtor();
    assert.equal(p.guessTypeFromAssignment(rhs, fakeScope), expected, `guess for "${rhs}"`);
}

test('Pascal guessTypeFromAssignment', () => {
    expectType(PascalLanguageProvider, '42', 'Integer');
    expectType(PascalLanguageProvider, "'x'", 'string');
});
test('Rust guessTypeFromAssignment', () => {
    expectType(RustLanguageProvider, '42', 'i32');
    expectType(RustLanguageProvider, '"x"', 'String');
});
test('C# guessTypeFromAssignment', () => {
    expectType(CSharpLanguageProvider, '42', 'int');
    expectType(CSharpLanguageProvider, '"x"', 'string');
});
test('Java guessTypeFromAssignment', () => {
    expectType(JavaLanguageProvider, '42', 'int');
    expectType(JavaLanguageProvider, '"x"', 'String');
});
test('TypeScript guessTypeFromAssignment', () => {
    expectType(TypeScriptLanguageProvider, '42', 'number');
    expectType(TypeScriptLanguageProvider, '"x"', 'string');
});
test('Python guessTypeFromAssignment', () => {
    expectType(PythonLanguageProvider, '42', 'int');
    expectType(PythonLanguageProvider, "'x'", 'str');
});
test('Go guessTypeFromAssignment', () => {
    expectType(GoLanguageProvider, '42', 'int');
    expectType(GoLanguageProvider, '"x"', 'string');
});
test('C++ guessTypeFromAssignment', () => {
    expectType(CppLanguageProvider, '42', 'int');
    expectType(CppLanguageProvider, '"x"', 'std::string');
});
