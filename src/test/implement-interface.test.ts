import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'path';

const module = require('node:module');
const originalLoad = module._load;
const vscodeMock = {
    Uri: {
        file: (filePath: string) => ({ fsPath: filePath, path: filePath, toString: () => filePath }),
        parse: (uri: string) => ({ path: uri }),
    },
    Position: class {
        constructor(public readonly line: number, public readonly character: number) {}
    },
    Range: class {
        public readonly start: { line: number; character: number };
        public readonly end: { line: number; character: number };
        constructor(
            a: { line: number; character: number } | number,
            b: { line: number; character: number } | number,
            c?: number,
            d?: number,
        ) {
            if (c === undefined) {
                this.start = a as { line: number; character: number };
                this.end = b as { line: number; character: number };
            } else {
                this.start = { line: a as number, character: b as number };
                this.end = { line: c, character: d as number };
            }
        }
        contains(position: { line: number; character: number }): boolean {
            return position.line >= this.start.line && position.line <= this.end.line;
        }
    },
    EndOfLine: { LF: 0 },
};

module._load = (request: string, parent: unknown, isMain: boolean) => {
    if (request === 'vscode') {
        return vscodeMock;
    }
    return originalLoad(request, parent, isMain);
};

const { TypeScriptLanguageProvider } = require('../providers/TypeScriptLanguageProvider') as typeof import('../providers/TypeScriptLanguageProvider');
const { CSharpLanguageProvider } = require('../providers/CSharpLanguageProvider') as typeof import('../providers/CSharpLanguageProvider');
const { JavaLanguageProvider } = require('../providers/JavaLanguageProvider') as typeof import('../providers/JavaLanguageProvider');
const { RustLanguageProvider } = require('../providers/RustLanguageProvider') as typeof import('../providers/RustLanguageProvider');
const { GoLanguageProvider } = require('../providers/GoLanguageProvider') as typeof import('../providers/GoLanguageProvider');
const { CppLanguageProvider } = require('../providers/CppLanguageProvider') as typeof import('../providers/CppLanguageProvider');
const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as typeof import('../providers/PascalLanguageProvider');
const { MemberKind, Visibility } = require('../models/types') as { MemberKind: typeof import('../models/types').MemberKind; Visibility: typeof import('../models/types').Visibility };

type Param = { name: string; type: string };
type Member = {
    id: string; kind: string; name: string; returnType?: string; type?: string;
    visibility: unknown; parameters: Param[]; modifiers: string[];
    isStatic: boolean; isVirtual: boolean; isAbstract: boolean; isOverride: boolean;
    range: unknown;
};
type ClassLike = { name: string; isInterface: boolean; members: Member[]; fileUri: unknown; range: unknown };

type ProviderLike = {
    parseDocument(document: { uri: unknown; languageId: string; fileName: string; getText(): string; lineCount: number }): { classes: { name: string; members: { name: string; kind: string }[] }[] };
    generateMissingStubs(className: string, interfaceInfo: ClassLike, classInfo: ClassLike): string | undefined;
};

function methodMember(name: string, returnType: string | undefined, params: Param[]): Member {
    return {
        id: name, kind: MemberKind.Method, name, returnType,
        visibility: Visibility.Public, parameters: params, modifiers: [],
        isStatic: false, isVirtual: false, isAbstract: false, isOverride: false,
        range: new vscodeMock.Range(0, 0, 0, 0),
    };
}

function propertyMember(name: string, type: string): Member {
    return {
        id: name, kind: MemberKind.Property, name, type, returnType: type,
        visibility: Visibility.Public, parameters: [], modifiers: [],
        isStatic: false, isVirtual: false, isAbstract: false, isOverride: false,
        range: new vscodeMock.Range(0, 0, 0, 0),
    };
}

function emptyClass(name: string, fileUri: unknown): ClassLike {
    return { name, isInterface: false, members: [], fileUri, range: new vscodeMock.Range(0, 0, 0, 0) };
}

function interfaceClass(name: string, members: Member[], fileUri: unknown): ClassLike {
    return { name, isInterface: true, members, fileUri, range: new vscodeMock.Range(0, 0, 0, 0) };
}

function docFromText(fileName: string, languageId: string, content: string) {
    const uri = vscodeMock.Uri.file(path.join('test-fixtures', fileName));
    return { uri, languageId, fileName: uri.fsPath, lineCount: content.split(/\r?\n/).length, getText: () => content };
}

interface ImplCase {
    label: string;
    provider: ProviderLike;
    fileExt: string;
    languageId: string;
    wrap: (stubs: string) => string;
}

const implCases: ImplCase[] = [
    { label: 'TypeScript', provider: new TypeScriptLanguageProvider(), fileExt: '.ts', languageId: 'typescript', wrap: s => `class Target implements IFoo {\n${s}}\n` },
    { label: 'C#', provider: new CSharpLanguageProvider(), fileExt: '.cs', languageId: 'csharp', wrap: s => `class Target : IFoo {\n${s}}\n` },
    { label: 'Java', provider: new JavaLanguageProvider(), fileExt: '.java', languageId: 'java', wrap: s => `class Target implements IFoo {\n${s}}\n` },
];

for (const c of implCases) {
    test(`[${c.label}] generateMissingStubs produces a stub per missing interface method`, () => {
        const fileUri = vscodeMock.Uri.file('target' + c.fileExt);
        const iface = interfaceClass('IFoo', [
            methodMember('doThing', 'void', []),
            methodMember('compute', 'number', [{ name: 'n', type: 'number' }]),
        ], fileUri);

        const stubs = c.provider.generateMissingStubs('Target', iface, emptyClass('Target', fileUri));
        assert.ok(stubs, `${c.label}: should produce stubs for an unimplemented interface`);
        assert.ok(stubs!.includes('doThing'), `${c.label}: stub for doThing missing`);
        assert.ok(stubs!.includes('compute'), `${c.label}: stub for compute missing`);
    });

    test(`[${c.label}] already-implemented methods are not re-stubbed`, () => {
        const fileUri = vscodeMock.Uri.file('target' + c.fileExt);
        const iface = interfaceClass('IFoo', [
            methodMember('doThing', 'void', []),
            methodMember('compute', 'number', [{ name: 'n', type: 'number' }]),
        ], fileUri);
        const target = emptyClass('Target', fileUri);
        target.members.push(methodMember('doThing', 'void', [])); // already implemented

        const stubs = c.provider.generateMissingStubs('Target', iface, target);
        assert.ok(stubs, `${c.label}: should still stub the missing method`);
        assert.ok(!stubs!.match(/\bdoThing\s*\(/), `${c.label}: doThing should not be re-stubbed`);
        assert.ok(stubs!.includes('compute'), `${c.label}: compute should still be stubbed`);
    });

    test(`[${c.label}] generated stubs round-trip back through the parser`, () => {
        const fileUri = vscodeMock.Uri.file('target' + c.fileExt);
        const iface = interfaceClass('IFoo', [
            methodMember('doThing', 'void', []),
            methodMember('compute', 'number', [{ name: 'n', type: 'number' }]),
        ], fileUri);
        const stubs = c.provider.generateMissingStubs('Target', iface, emptyClass('Target', fileUri));
        assert.ok(stubs);

        const reparsed = c.provider.parseDocument(docFromText('target' + c.fileExt, c.languageId, c.wrap(stubs)));
        const target = reparsed.classes.find(x => x.name === 'Target');
        assert.ok(target, `${c.label}: Target class should parse from generated stubs`);
        const names = new Set(target!.members.map(m => m.name));
        assert.ok(names.has('doThing'), `${c.label}: doThing should be present after reparse`);
        assert.ok(names.has('compute'), `${c.label}: compute should be present after reparse`);
    });
}

test('Rust disables interface stubs (returns undefined)', () => {
    const provider = new RustLanguageProvider();
    const fileUri = vscodeMock.Uri.file('x.rs');
    const iface = interfaceClass('HasId', [methodMember('get_id', 'u64', [])], fileUri);
    assert.equal(provider.generateMissingStubs('User', iface, emptyClass('User', fileUri)), undefined);
});

test('Go disables interface stubs (returns undefined)', () => {
    const provider = new GoLanguageProvider();
    const fileUri = vscodeMock.Uri.file('x.go');
    const iface = interfaceClass('Validator', [methodMember('Validate', 'boolean', [])], fileUri);
    assert.equal(provider.generateMissingStubs('Server', iface, emptyClass('Server', fileUri)), undefined);
});

test('C++ disables interface stubs (returns undefined) — avoids header-only stubs with no body', () => {
    const provider = new CppLanguageProvider();
    const fileUri = vscodeMock.Uri.file('x.h');
    const iface = interfaceClass('IDrawable', [methodMember('Draw', 'void', [])], fileUri);
    assert.equal(provider.generateMissingStubs('Shape', iface, emptyClass('Shape', fileUri)), undefined);
});

test('Pascal disables interface stubs (returns undefined) — avoids decl with no implementation', () => {
    const provider = new PascalLanguageProvider();
    const fileUri = vscodeMock.Uri.file('x.pas');
    const iface = interfaceClass('IHasName', [methodMember('GetName', 'string', [])], fileUri);
    assert.equal(provider.generateMissingStubs('TFoo', iface, emptyClass('TFoo', fileUri)), undefined);
});

test('Interface properties are stubbed, not silently skipped (TypeScript)', () => {
    const provider = new TypeScriptLanguageProvider();
    const fileUri = vscodeMock.Uri.file('target.ts');
    const iface = interfaceClass('IFoo', [
        methodMember('doThing', 'void', []),
        propertyMember('count', 'number'),
    ], fileUri);
    const stubs = provider.generateMissingStubs('Target', iface, emptyClass('Target', fileUri));
    assert.ok(stubs, 'should produce stubs');
    assert.ok(stubs!.includes('doThing'), 'method stub present');
    assert.ok(stubs!.includes('count'), 'property stub present');
});
