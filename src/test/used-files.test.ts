import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { ExternalSymbol, externalLabel, isUsed, matchExternal, usedRefs } from '../utils/usedFiles';
import { externalRowsHtml, manageListHtml } from '../webview/manageSection';

const root = path.join(__dirname, '..', '..');

test('the files a source points to are read in every language: units, includes, imports', () => {
    const pas = usedRefs('unit Main;\ninterface\nuses System.SysUtils, Forms, UData;\nimplementation\nuses UTools;\nend.', 'pascal', 'C:/p/Main.pas');
    assert.deepEqual([...pas.bases].sort(), ['forms', 'system.sysutils', 'udata', 'utools']);
    const cpp = usedRefs('#include <vector>\n#include "util/Parser.h"\n  # include "net.hpp"\nint x;', 'cpp', '/p/main.cpp');
    assert.deepEqual([...cpp.bases].sort(), ['net', 'parser', 'vector']);
    const ts = usedRefs("import { a } from './lib/Store';\nconst b = require('../helpers/format.js');\nimport x from 'react';", 'typescript', '/p/src/app.ts');
    assert.ok(ts.bases.has('store') && ts.bases.has('format') && ts.bases.has('react'));
    const py = usedRefs('import os\nfrom pkg.sub import thing\nfrom . import local', 'python', '/p/a.py');
    assert.ok(py.bases.has('sub') && py.dirs.has('sub') && py.bases.has('os'));
    const go = usedRefs('package main\nimport (\n  "fmt"\n  "example.com/app/store"\n)', 'go', '/p/main.go');
    assert.ok(go.dirs.has('store'), 'a Go package is a folder');
    assert.ok(!usedRefs('unit Main;\ninterface\nuses Main, Forms;\nimplementation\nend.', 'pascal', 'Main.pas').bases.has('main'), 'a file does not use itself');
    assert.ok(isUsed(pas, 'C:/p/UData.pas') && isUsed(pas, '/p/system.sysutils.pas') && !isUsed(pas, 'C:/p/Other.pas'));
    assert.ok(isUsed(go, '/p/store/db.go') && !isUsed(go, '/p/other/db.go'));
});

const sym = (file: string, container: string, name: string, kind = 'method'): ExternalSymbol => ({ label: externalLabel(file, container, name), name, kind, path: file, line: 3 });

test('an object of a used file is written <file>.<object> and found by the filter, the exact name first', () => {
    const list = [sym('C:/p/UData.pas', 'TStore', 'Save'), sym('C:/p/UData.pas', '', 'SaveAll', 'function'), sym('C:/p/UTools.pas', '', 'Format', 'function'), sym('/p/lib/store.ts', 'Store', 'save')];
    assert.equal(list[0].label, 'UData.TStore.Save');
    assert.equal(list[1].label, 'UData.SaveAll');
    assert.deepEqual(matchExternal(list, 'save').map(s => s.label), ['store.Store.save', 'UData.TStore.Save', 'UData.SaveAll'], 'the exact name (by file name), then the ones that start with it');
    assert.deepEqual(matchExternal(list, 'udata.save').map(s => s.label), ['UData.SaveAll', 'UData.TStore.Save'].filter(l => l.toLowerCase().includes('udata.save')), 'the file name is part of the label');
    assert.deepEqual(matchExternal(list, 'UTools.').map(s => s.label), ['UTools.Format']);
    assert.deepEqual(matchExternal(list, '^udata[.]sa').map(s => s.label).sort(), ['UData.SaveAll']);
    assert.deepEqual(matchExternal(list, ''), []);
    assert.equal(matchExternal(Array.from({ length: 100 }, (_, i) => sym('/p/a.ts', '', 'f' + i)), 'f', 10).length, 10);
});

const base = { typeOptions: [{ id: 'c', label: 'T' }], selectedType: 'c', isFile: false, add: { field: true, method: true, property: true, constructor: true }, canMove: false, rows: [], filter: 'save', kindFilter: '', group: 'source' } as unknown as Parameters<typeof manageListHtml>[0];

test('Structure lists what the filter finds in the used files below its own members, and a click on one is sent to the panel', () => {
    const html = manageListHtml({ ...base, external: [{ label: 'UData.TStore.Save', kind: 'method' }, { label: 'UData.SaveAll', kind: 'function' }] });
    assert.match(html, /<div id="mExtBox"><div class="mgroup" id="mExtTitle"[^>]*>From the files it uses \(2\)<\/div>/);
    assert.match(html, /<li class="mhit mext" data-ext="0"[^>]*><span class="mln">method<\/span><span class="mtx">UData\.TStore\.Save<\/span><\/li>/);
    assert.match(manageListHtml(base), /<div id="mExtBox" hidden>/, 'nothing typed or found: the block is hidden');
    assert.equal(externalRowsHtml([{ label: '<b>', kind: 'x' }]).includes('<b>'), false, 'what is written is escaped');
});

test('the shortcut and the command that open Structure filtered on the element under the cursor', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    assert.ok(pkg.contributes.commands.some((c: { command: string }) => c.command === 'ce.structure.filterOnCursor'));
    const key = pkg.contributes.keybindings.find((k: { command: string }) => k.command === 'ce.structure.filterOnCursor');
    assert.equal(key.key, 'alt+m');
    const ext = fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8');
    assert.match(ext, /trackedCommand\('ce\.structure\.filterOnCursor'/);
    assert.match(ext, /memberViewer\.filterStructureOn\(word\)/);
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'MemberViewerPanel.ts'), 'utf8');
    assert.match(panel, /case 'openExternal'/);
    assert.match(panel, /void this\.postExternal\(\);/);
    assert.match(fs.readFileSync(path.join(root, 'src', 'services', 'WorkspaceIndex.ts'), 'utf8'), /get ready\(\): boolean/);
});
