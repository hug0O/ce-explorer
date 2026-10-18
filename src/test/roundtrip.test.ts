import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
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

const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as typeof import('../providers/PascalLanguageProvider');
const { CppLanguageProvider } = require('../providers/CppLanguageProvider') as typeof import('../providers/CppLanguageProvider');
const { TypeScriptLanguageProvider } = require('../providers/TypeScriptLanguageProvider') as typeof import('../providers/TypeScriptLanguageProvider');
const { PythonLanguageProvider } = require('../providers/PythonLanguageProvider') as typeof import('../providers/PythonLanguageProvider');
const { CSharpLanguageProvider } = require('../providers/CSharpLanguageProvider') as typeof import('../providers/CSharpLanguageProvider');
const { GoLanguageProvider } = require('../providers/GoLanguageProvider') as typeof import('../providers/GoLanguageProvider');
const { RustLanguageProvider } = require('../providers/RustLanguageProvider') as typeof import('../providers/RustLanguageProvider');
const { JavaLanguageProvider } = require('../providers/JavaLanguageProvider') as typeof import('../providers/JavaLanguageProvider');

const fixturesDir = path.join(__dirname, '..', '..', 'test-fixtures');

type MemberLike = {
    name: string;
    kind: string;
    returnType?: string;
};

type ClassLike = {
    name: string;
    members: MemberLike[];
};

type ParsedLike = {
    classes: ClassLike[];
    standaloneProcedures: MemberLike[];
};

type ProviderLike = {
    parseDocument(document: DocLike): ParsedLike;
};

type DocLike = {
    uri: unknown;
    languageId: string;
    fileName: string;
    getText(): string;
    lineCount: number;
};

function docFromText(fileName: string, languageId: string, content: string): DocLike {
    const uri = vscodeMock.Uri.file(path.join(fixturesDir, fileName));
    return {
        uri,
        languageId,
        fileName: uri.fsPath,
        lineCount: content.split(/\r?\n/).length,
        getText: () => content,
    };
}

function fixtureDoc(fileName: string, languageId: string): DocLike {
    const content = fs.readFileSync(path.join(fixturesDir, fileName), 'utf8');
    return docFromText(fileName, languageId, content);
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replace the first whole-word occurrence of `name` with `newName`. */
function renameFirst(text: string, name: string, newName: string): string {
    return text.replace(new RegExp('\\b' + escapeRegex(name) + '\\b'), newName);
}

/** Pick a member whose name occurs exactly once in the list (safe rename target). */
function pickUnique(members: MemberLike[], kind: string): MemberLike | undefined {
    const counts = new Map<string, number>();
    for (const m of members) {
        counts.set(m.name, (counts.get(m.name) ?? 0) + 1);
    }
    return members.find(m => m.kind === kind && counts.get(m.name) === 1);
}

interface RoundTripCase {
    label: string;
    provider: ProviderLike;
    fixture: string;
    languageId: string;
    className: string;
    standaloneName?: string;
}

const cases: RoundTripCase[] = [
    { label: 'Rust', provider: new RustLanguageProvider(), fixture: 'example.rs', languageId: 'rust', className: 'User', standaloneName: 'free_add' },
    { label: 'TypeScript', provider: new TypeScriptLanguageProvider(), fixture: 'example.ts', languageId: 'typescript', className: 'UserService', standaloneName: 'formatUser' },
    { label: 'JavaScript', provider: new TypeScriptLanguageProvider(), fixture: 'example.js', languageId: 'javascript', className: 'EventEmitter', standaloneName: 'createEmitter' },
    { label: 'Python', provider: new PythonLanguageProvider(), fixture: 'example.py', languageId: 'python', className: 'Vehicle', standaloneName: 'create_vehicle' },
    { label: 'C#', provider: new CSharpLanguageProvider(), fixture: 'Example.cs', languageId: 'csharp', className: 'Product' },
    { label: 'Go', provider: new GoLanguageProvider(), fixture: 'example.go', languageId: 'go', className: 'Server', standaloneName: 'NewServer' },
    { label: 'Java', provider: new JavaLanguageProvider(), fixture: 'Example.java', languageId: 'java', className: 'Animal' },
    { label: 'Pascal', provider: new PascalLanguageProvider(), fixture: 'TestUnit.pas', languageId: 'pascal', className: 'TDemoClass' },
];

/**
 * Round-trip per language: renaming a class member must leave the parser
 * stable — same member count, the new name present, the old name gone.
 * This is the regression net for "editing a function corrupts the parse".
 */
for (const c of cases) {
    test(`[${c.label}] round-trip: rename a class method keeps the parse stable`, () => {
        const base = c.provider.parseDocument(fixtureDoc(c.fixture, c.languageId));
        const cls = base.classes.find(x => x.name === c.className);
        assert.ok(cls, `${c.label}: class ${c.className} should exist`);

        const target = pickUnique(cls.members, 'method');
        assert.ok(target, `${c.label}: need a uniquely-named method to rename`);

        const edited = docFromText(c.fixture, c.languageId, renameFirst(fixtureDoc(c.fixture, c.languageId).getText(), target.name, target.name + '_renamed'));
        const reparsed = c.provider.parseDocument(edited);
        const cls2 = reparsed.classes.find(x => x.name === c.className);
        assert.ok(cls2, `${c.label}: class should still parse after rename`);

        const before = cls.members.map(m => m.name);
        const after = cls2.members.map(m => m.name);
        assert.equal(after.length, before.length, `${c.label}: member count must be unchanged by a rename`);
        assert.ok(after.includes(target.name + '_renamed'), `${c.label}: renamed member should appear as ${target.name}_renamed`);
        assert.ok(!after.includes(target.name), `${c.label}: old member name ${target.name} should be gone after rename`);
    });
}

/**
 * Standalone-function rename round-trip for languages with file-level functions.
 */
const standaloneCases = cases.filter(c => c.standaloneName);
for (const c of standaloneCases) {
    test(`[${c.label}] round-trip: rename a standalone function keeps the parse stable`, () => {
        const fixture = fixtureDoc(c.fixture, c.languageId);
        const base = c.provider.parseDocument(fixture);
        const target = base.standaloneProcedures.find(p => p.name === c.standaloneName);
        assert.ok(target, `${c.label}: standalone ${c.standaloneName} should exist`);

        const edited = docFromText(c.fixture, c.languageId, renameFirst(fixture.getText(), target.name, target.name + '_r'));
        const reparsed = c.provider.parseDocument(edited);
        const names = reparsed.standaloneProcedures.map(p => p.name);

        assert.equal(reparsed.standaloneProcedures.length, base.standaloneProcedures.length, `${c.label}: standalone count must be unchanged by a rename`);
        assert.ok(names.includes(target.name + '_r'), `${c.label}: renamed standalone should appear`);
        assert.ok(!names.includes(target.name), `${c.label}: old standalone name should be gone`);
    });
}

/**
 * Return-type edit round-trip: changing a function's return type must keep the
 * parser stable (class still parses, member count unchanged, target still
 * present). The replacement is scoped to the member's own signature line so we
 * never edit an unrelated occurrence elsewhere in the file.
 */
for (const c of cases) {
    test(`[${c.label}] round-trip: editing a function return type keeps the parse stable`, () => {
        const fixture = fixtureDoc(c.fixture, c.languageId);
        const base = c.provider.parseDocument(fixture);
        const cls = base.classes.find(x => x.name === c.className);
        assert.ok(cls);

        const fn = cls.members.find(m => m.kind === 'method' && m.returnType && m.returnType.trim().length > 0);
        if (!fn) {
            return;
        }

        const range = (fn as { range: { start: { line: number }; end: { line: number } } }).range;
        const sentinel = 'ZzzSentinelType';
        const lines = fixture.getText().split(/\r?\n/);
        let changed = false;
        for (let l = range.start.line; l <= range.end.line && l < lines.length && !changed; l++) {
            if (lines[l].includes(fn.returnType!)) {
                lines[l] = lines[l].replace(fn.returnType!, sentinel);
                changed = true;
            }
        }
        if (!changed) {
            // Return type token not literally on the signature line (inferred/elsewhere) — skip safely.
            return;
        }

        const reparsed = c.provider.parseDocument(docFromText(c.fixture, c.languageId, lines.join('\n')));
        const cls2 = reparsed.classes.find(x => x.name === c.className);
        assert.ok(cls2, `${c.label}: class should still parse after return-type edit`);
        assert.equal(cls2.members.length, cls.members.length, `${c.label}: member count must be unchanged by a return-type edit`);
        assert.ok(
            cls2.members.some(m => m.name === fn.name),
            `${c.label}: edited member ${fn.name} should still be parsed`,
        );
    });
}
