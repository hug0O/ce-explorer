import { test } from 'node:test';
import assert from 'node:assert/strict';

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;

const calls = { find: 0, read: [] as string[], stat: 0, open: 0 };
const mtimes = new Map<string, number>();
const files: string[] = [];
for (let i = 0; i < 20000; i++) { files.push(`/proj/src/Unit${i}.pas`); }
files.push('/proj/lib/UData.pas', '/proj/lib/UTools.pas');

const uri = (p: string) => ({ fsPath: p, path: p, toString: () => 'file://' + p });
const vscodeMock = {
    Range: class { constructor(public a: number, public b: number, public c: number, public d: number) {} },
    workspace: {
        findFiles: async () => { calls.find++; return files.map(uri); },
        createFileSystemWatcher: () => ({ onDidCreate: () => ({ dispose() {} }), onDidDelete: () => ({ dispose() {} }), dispose() {} }),
        openTextDocument: async () => { calls.open++; throw new Error('a file of the project must not be opened in the editor'); },
        fs: {
            stat: async (u: { fsPath: string }) => { calls.stat++; return { mtime: mtimes.get(u.fsPath) ?? 1, size: 100 }; },
            readFile: async (u: { fsPath: string }) => { calls.read.push(u.fsPath); return new TextEncoder().encode('unit UData;'); },
        },
    },
};
nodeModule._load = (request: string, parent: unknown, isMain: boolean) => (request === 'vscode' ? vscodeMock : originalLoad(request, parent, isMain));
const { UsedFilesIndex } = require('../services/UsedFilesIndex') as typeof import('../services/UsedFilesIndex');

const provider = {
    languageId: 'pascal',
    parseDocument: () => ({
        classes: [{ name: 'TStore', classType: 'class', range: { start: { line: 2 } }, members: [{ name: 'Create', kind: 'constructor', range: { start: { line: 4 } } }, { name: 'Save', kind: 'method', range: { start: { line: 3 } } }, { name: 'Destroy', kind: 'destructor', range: { start: { line: 5 } } }] }],
        standaloneProcedures: [{ name: 'LoadAll', range: { start: { line: 9 } } }],
    }),
};
const registry = { getSupportedExtensions: () => ['.pas'], getByFileExtension: () => provider, acceptsText: () => true } as any;

test('only the files a file points to are read, from a listing of names, never opened, and kept by their date', async () => {
    const index = new UsedFilesIndex(registry);
    const refs = { bases: new Set(['udata']), dirs: new Set<string>() };
    const a = await index.externalFor(refs, '/proj/src/Unit5.pas');
    assert.deepEqual(a.map(s => s.label), ['UData.TStore', 'UData.TStore.Save', 'UData.LoadAll'], 'the objects of the file it uses');
    assert.deepEqual(calls.read, ['/proj/lib/UData.pas'], 'one file read among 20002, not the project');
    assert.equal(calls.find, 1, 'the names are listed once');
    assert.equal(calls.open, 0, 'no file is opened in the editor');
    assert.ok(!a.some(s => s.name === 'Create' || s.name === 'Destroy'), 'a constructor and a destructor are not listed');
    assert.equal(a[2].line, 9);
    assert.equal(a[0].path, '/proj/lib/UData.pas');

    await index.externalFor(refs, '/proj/src/Unit6.pas');
    assert.equal(calls.read.length, 1, 'the same file, unchanged: not read again');
    assert.equal(calls.find, 1, 'the listing is kept');

    mtimes.set('/proj/lib/UData.pas', 2);
    await index.externalFor(refs, '/proj/src/Unit5.pas');
    assert.equal(calls.read.length, 2, 'a changed file is read again');

    const two = await index.externalFor({ bases: new Set(['udata', 'utools']), dirs: new Set<string>() }, '/proj/lib/UData.pas');
    assert.ok(two.every(s => s.path === '/proj/lib/UTools.pas'), 'the file itself is not one of its own objects');
    assert.deepEqual(await index.externalFor({ bases: new Set(['nothere']), dirs: new Set<string>() }, '/proj/src/Unit5.pas'), [], 'a name that is no file of the project');
});
