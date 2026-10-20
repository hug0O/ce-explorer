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
    window: {},
};
nodeModule._load = (request: string, parent: unknown, isMain: boolean) => (request === 'vscode' ? vscodeMock : originalLoad(request, parent, isMain));

import { LanguageOverrides, extensionOf, languageOverrides, normalizeExtension } from '../services/LanguageOverrides';
const { ProviderRegistry } = require('../providers/ProviderRegistry') as typeof import('../providers/ProviderRegistry');

const doc = (fsPath: string, languageId = 'plaintext', text = ''): never => ({
    uri: { fsPath, path: fsPath, toString: () => fsPath }, languageId, version: 1, getText: () => text, fileName: fsPath, lineCount: 1,
}) as never;

test('extensions are written the way people write them', () => {
    assert.equal(normalizeExtension('INC'), '.inc');
    assert.equal(normalizeExtension(' .Inc '), '.inc');
    assert.equal(normalizeExtension(''), '');
    assert.equal(extensionOf('C:\\src\\Unit.INC'), '.inc');
    assert.equal(extensionOf('/a/b/.gitignore'), '', 'a dot file has no extension');
    assert.equal(extensionOf('/a/Makefile'), '');
});

test('a file wins over its extension, and a choice can be removed', () => {
    const o = new LanguageOverrides();
    o.setExtension('.inc', 'pascal');
    assert.equal(o.resolve('C:\\x\\A.INC'), 'pascal');
    assert.equal(o.source('C:\\x\\A.INC'), 'extension');
    o.setFile('C:\\x\\a.inc', 'cpp');
    assert.equal(o.resolve('c:/x/A.inc'), 'cpp', 'the same file, however it is written');
    assert.equal(o.source('c:/x/A.inc'), 'file');
    assert.equal(o.resolve('C:\\y\\B.inc'), 'pascal');
    assert.equal(o.resolve('C:\\y\\B.txt'), undefined);
    assert.ok(o.clear('C:\\x\\A.inc'));
    assert.equal(o.resolve('C:\\y\\B.inc'), undefined, 'removing a file clears its extension choice too');
    assert.ok(!o.clear('C:\\x\\A.inc'));
});

test('what is saved comes back, and a damaged save is ignored', () => {
    const o = new LanguageOverrides();
    o.setFile('/a/one.xyz', 'python');
    o.setExtension('inc', 'pascal');
    const copy = new LanguageOverrides();
    copy.load(JSON.parse(JSON.stringify(o.toJSON())));
    assert.deepEqual(copy.toJSON(), o.toJSON());
    assert.deepEqual(copy.chosenExtensions, ['.inc']);
    for (const bad of [undefined, null, 5, 'x', [], { files: 3, extensions: { inc: 7, '': 'pascal' } }, { files: { a: '' } }]) {
        const c = new LanguageOverrides();
        assert.doesNotThrow(() => c.load(bad));
        assert.equal(c.size, 0);
    }
});

test('a file CE does not recognise gets the features once a language is chosen', () => {
    const registry = new ProviderRegistry();
    const inc = doc('C:\\src\\Defs.inc');
    assert.equal(registry.getByDocument(inc), undefined);
    assert.ok(!registry.getSupportedExtensions().includes('.inc'));

    languageOverrides.setFile('C:\\src\\Defs.inc', 'pascal');
    assert.equal(registry.getByDocument(inc)?.languageId, 'pascal', 'this file');
    assert.equal(registry.getByDocument(doc('C:\\src\\Other.inc')), undefined, 'and only this one');

    languageOverrides.clear('C:\\src\\Defs.inc');
    languageOverrides.setExtension('.inc', 'pascal');
    assert.equal(registry.getByDocument(doc('C:\\src\\Other.inc'))?.languageId, 'pascal', 'every file with the extension');
    assert.ok(registry.getSupportedExtensions().includes('.inc'), 'the workspace scans look at it');

    languageOverrides.setFile('C:\\src\\Other.inc', 'python');
    assert.equal(registry.getByDocument(doc('C:\\src\\Other.inc'))?.languageId, 'python', 'a file beats its extension');
    languageOverrides.load(undefined);
    assert.equal(registry.getByDocument(inc), undefined, 'nothing chosen, nothing forced');
});

test('a language that does not exist is not forced, and the caches are dropped on demand', () => {
    const registry = new ProviderRegistry();
    languageOverrides.setFile('C:\\src\\z.zzz', 'klingon');
    assert.equal(registry.getByDocument(doc('C:\\src\\z.zzz')), undefined);
    const pas = doc('C:\\src\\u.pas', 'pascal', 'unit u;\ninterface\nimplementation\nend.');
    const first = registry.parse(pas);
    assert.equal(registry.parse(pas), first, 'a parse is shared');
    registry.clearCaches();
    assert.notEqual(registry.parse(pas), first, 'and parsed again after the language of a file changed');
    languageOverrides.load(undefined);
});
