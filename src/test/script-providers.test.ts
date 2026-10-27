import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

const { BatchLanguageProvider } = require('../providers/BatchLanguageProvider') as typeof import('../providers/BatchLanguageProvider');
const { PowerShellLanguageProvider } = require('../providers/PowerShellLanguageProvider') as typeof import('../providers/PowerShellLanguageProvider');
const { ShellLanguageProvider } = require('../providers/ShellLanguageProvider') as typeof import('../providers/ShellLanguageProvider');
const { MarkdownLanguageProvider } = require('../providers/MarkdownLanguageProvider') as typeof import('../providers/MarkdownLanguageProvider');
const { MemberKind, Visibility } = require('../models/types') as typeof import('../models/types');

function doc(text: string, fsPath: string): any {
    return { uri: (vscodeMock.Uri as any).file(fsPath), languageId: '', lineCount: text.split(/\r?\n/).length, getText: () => text };
}

const spec = (name: string, params: string[] = []): any => ({
    kind: MemberKind.Method, name, visibility: Visibility.Public, parameters: params.map(p => ({ name: p, type: '' })), modifiers: [],
    isStatic: false, isVirtual: false, isAbstract: false, isOverride: false, isFinal: false,
});

test('Markdown: one document whose members are the headings, in the order of the file', () => {
    const p = new MarkdownLanguageProvider();
    const parsed = p.parseDocument(doc('# A\ntext\n## B\n\n```\n# no\n```\n## C\n', '/n/README.md'));
    assert.equal(parsed.classes.length, 1);
    const d = parsed.classes[0];
    assert.deepEqual([d.name, d.classType], ['README.md', 'document']);
    assert.deepEqual(d.members.map(x => [x.kind, x.name, x.type, x.range.start.line, x.range.end.line]), [
        [MemberKind.Heading, 'A', 'H1', 0, 1], [MemberKind.Heading, 'B', 'H2', 2, 6], [MemberKind.Heading, 'C', 'H2', 7, 7],
    ]);
    assert.equal(new MarkdownLanguageProvider().parseDocument(doc('just text\n', '/n/a.md')).classes.length, 0, 'no heading, nothing to list');
});

test('batch, shell and PowerShell: the routines are methods, the variables fields, a PowerShell class a type of its own', () => {
    const bat = new BatchLanguageProvider().parseDocument(doc('@echo off\nset "A=1"\n:run\necho %1\n', '/n/b.cmd')).classes[0];
    assert.deepEqual(bat.members.map(x => [x.kind, x.name]), [[MemberKind.Field, 'A'], [MemberKind.Method, 'run']]);
    assert.deepEqual(bat.members[1].parameters.map(x => x.name), ['%1']);
    const sh = new ShellLanguageProvider().parseDocument(doc('#!/bin/sh\nX=1\nf() {\n  echo $1\n}\n', '/n/x.sh')).classes[0];
    assert.deepEqual(sh.members.map(x => [x.kind, x.name]), [[MemberKind.Field, 'X'], [MemberKind.Method, 'f']]);
    const ps = new PowerShellLanguageProvider().parseDocument(doc('function F($a) { }\nclass K {\n  [int]$N\n  [void] M() { }\n}\n', '/n/s.ps1'));
    assert.deepEqual(ps.classes.map(c => c.name), ['s.ps1', 'K']);
    assert.deepEqual(ps.classes[1].members.map(x => [x.kind, x.name]), [[MemberKind.Property, 'N'], [MemberKind.Method, 'M']]);
});

test('the generators write a routine and a variable in each language', () => {
    const cls: any = { range: new vscodeMock.Range(0, 0, 9, 0), members: [] };
    const gen = (p: any, name: string, params: string[]): string => p.generateMethod('', spec(name, params), cls).declaration;
    assert.match(gen(new BatchLanguageProvider(), 'build', ['dir']), /^\n:build\nrem {3}%1 = dir\n {2}rem TODO: implement\nexit \/b 0/);
    assert.match(gen(new ShellLanguageProvider(), 'build', ['dir']), /build\(\) \{\n {2}local dir="\$1"\n {2}# TODO: implement\n\}/);
    assert.match(gen(new PowerShellLanguageProvider(), 'Build-It', ['Path']), /function Build-It \{\n {4}param\(\n {8}\$Path\n {4}\)\n {4}# TODO: implement\n\}/);
    assert.match(gen(new MarkdownLanguageProvider(), 'Usage', []), /^\n## Usage\n/);
    const field = (p: any): string => p.generateField('', { kind: MemberKind.Field, name: 'N', type: '', visibility: Visibility.Public, defaultValue: '1' }, cls).declaration;
    assert.equal(field(new BatchLanguageProvider()), 'set "N=1"\n');
    assert.equal(field(new ShellLanguageProvider()), 'N="1"\n');
    assert.equal(field(new PowerShellLanguageProvider()), '$N = 1\n');
});

test('the four languages are registered, activated and shown in the Structure tab', () => {
    const registry = fs.readFileSync(path.join(__dirname, '..', 'providers', 'ProviderRegistry.ts'), 'utf8');
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')) as { activationEvents: string[] };
    for (const [cls, lang] of [['BatchLanguageProvider', 'bat'], ['PowerShellLanguageProvider', 'powershell'], ['ShellLanguageProvider', 'shellscript'], ['MarkdownLanguageProvider', 'markdown']]) {
        assert.ok(registry.includes('new ' + cls + '()'), cls + ' is registered');
        assert.ok(pkg.activationEvents.includes('onLanguage:' + lang), lang + ' activates the extension');
    }
    const manage = fs.readFileSync(path.join(__dirname, '..', 'webview', 'manageSection.ts'), 'utf8');
    assert.match(manage, /heading: 'Headings'/);
});
