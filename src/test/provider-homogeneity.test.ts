import { test } from 'node:test';
import assert from 'node:assert/strict';

// Reuse the vscode mock + module interception pattern used by the other suites.
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

const { CppLanguageProvider } = require('../providers/CppLanguageProvider') as typeof import('../providers/CppLanguageProvider');
const { JavaLanguageProvider } = require('../providers/JavaLanguageProvider') as typeof import('../providers/JavaLanguageProvider');
const { CSharpLanguageProvider } = require('../providers/CSharpLanguageProvider') as typeof import('../providers/CSharpLanguageProvider');
const { GoLanguageProvider } = require('../providers/GoLanguageProvider') as typeof import('../providers/GoLanguageProvider');
const { RustLanguageProvider } = require('../providers/RustLanguageProvider') as typeof import('../providers/RustLanguageProvider');
const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as typeof import('../providers/PascalLanguageProvider');
const { PythonLanguageProvider } = require('../providers/PythonLanguageProvider') as typeof import('../providers/PythonLanguageProvider');
const { TypeScriptLanguageProvider } = require('../providers/TypeScriptLanguageProvider') as typeof import('../providers/TypeScriptLanguageProvider');
const { PlSqlLanguageProvider } = require('../providers/PlSqlLanguageProvider') as typeof import('../providers/PlSqlLanguageProvider');

const providers = {
    Cpp: new CppLanguageProvider(),
    Java: new JavaLanguageProvider(),
    CSharp: new CSharpLanguageProvider(),
    Go: new GoLanguageProvider(),
    Rust: new RustLanguageProvider(),
    Pascal: new PascalLanguageProvider(),
    Python: new PythonLanguageProvider(),
    TypeScript: new TypeScriptLanguageProvider(),
    PlSql: new PlSqlLanguageProvider(),
};

// --- 6a: extractMethod must exist on every provider ---
test('extractMethod: implemented for all providers', () => {
    for (const [name, p] of Object.entries(providers)) {
        const fn = (p as any).extractMethod;
        assert.equal(typeof fn, 'function', `${name} has no extractMethod`);
        // Calling with no selection returns [] (no throw).
        const ctx = { document: { lineCount: 0, getText: () => '' }, position: new (vscodeMock.Position as any)(0, 0) };
        const out = fn.call(p, ctx, 'foo', [], 'void');
        assert.ok(Array.isArray(out), `${name} extractMethod must return an array`);
    }
});

// --- 6b: rewriteStandaloneFunction must exist on every provider ---
test('rewriteStandaloneFunction: implemented for all 8 providers', () => {
    const spec = { kind: 'method', name: 'foo', parameters: [], returnType: 'void', visibility: 'public', modifiers: [], isStatic: false, isVirtual: false, isAbstract: false, isOverride: false, isFinal: false } as any;
    for (const [name, p] of Object.entries(providers)) {
        const fn = (p as any).rewriteStandaloneFunction;
        assert.equal(typeof fn, 'function', `${name} has no rewriteStandaloneFunction`);
        // Must handle both a body and a body-less input gracefully (string or undefined,
        // never throw). Syntax differs per language, so we only assert the contract.
        const withBody = fn.call(p, 'void foo() { body }', spec);
        assert.ok(withBody === undefined || typeof withBody === 'string', `${name} returned an unexpected type`);
        const noBody = fn.call(p, 'void foo();', spec);
        assert.ok(noBody === undefined || typeof noBody === 'string', `${name} returned an unexpected type`);
    }
});

// --- 6c: supportsMissingStubs consistency ---
test('supportsMissingStubs: Cpp/Pascal/Rust/Go disabled, others enabled', () => {
    assert.equal(providers.Cpp.supportsMissingStubs(), false);
    assert.equal(providers.Pascal.supportsMissingStubs(), false);
    assert.equal(providers.Rust.supportsMissingStubs(), false);
    assert.equal(providers.Go.supportsMissingStubs(), false);
    assert.equal(providers.Java.supportsMissingStubs(), true);
    assert.equal(providers.CSharp.supportsMissingStubs(), true);
    assert.equal(providers.Python.supportsMissingStubs(), true);
    assert.equal(providers.TypeScript.supportsMissingStubs(), true);
    assert.equal(providers.PlSql.supportsMissingStubs(), false);
});
