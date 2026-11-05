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

const sym = (file: string, container: string, name: string, kind = 'method'): ExternalSymbol => ({ label: externalLabel(file, container, name), name, container, kind, path: file, line: 3 });

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

import { usedFromOutside } from '../utils/usedFiles';
import { outsideRowsHtml } from '../webview/manageSection';
import { familyOf } from '../utils/callGraph';

test('what the code uses from the other files: the objects whose name it writes, a member only after a dot, comments and strings left out', () => {
    const list = [
        sym('C:/p/UData.pas', '', 'LoadAll', 'function'), sym('C:/p/UData.pas', 'TStore', 'Save'), sym('C:/p/UData.pas', 'TStore', 'Text'),
        sym('C:/p/UTools.pas', '', 'Format', 'function'), sym('C:/p/UTools.pas', '', 'Unused', 'function'), sym('C:/p/UTools.pas', '', 'Commented', 'function'),
        sym('C:/p/UTools.pas', '', 'InString', 'function'),
    ];
    const code = [
        'procedure T.Go;', 'begin', "  LoadAll;", "  Store.Save;", "  Text := 'x';", "  s := Format('%d', [1]); // Commented here", "  Log('InString');", "  loadall;", 'end;',
    ].join('\n');
    const r = usedFromOutside(code, familyOf('pascal'), list);
    assert.deepEqual(r.map(u => u.symbol.label), ['UData.LoadAll', 'UData.TStore.Save', 'UTools.Format']);
    const load = r.find(u => u.symbol.name === 'LoadAll')!;
    assert.equal(load.count, 2, 'written twice, in any case');
    assert.equal(load.line, 2, 'the first one is on the third line');
    assert.ok(!r.some(u => u.symbol.name === 'Text'), 'a member whose name is written alone is not a use');
    assert.deepEqual(usedFromOutside('x', undefined, []), []);
    assert.equal(usedFromOutside('a->Save(); b::Save();', familyOf('cpp'), [sym('/p/s.h', 'Store', 'Save')])[0].count, 2, 'a member after -> or ::');
});

test('the block of what is used from outside has its own filter, its rows go to the definition and the count to the first use, and it opens on demand', () => {
    const rows = [{ label: 'UData.LoadAll', kind: 'function', count: 2, line: 2 }];
    const html = manageListHtml({ ...base, outside: { rows, open: true, ready: true } });
    assert.match(html, /<details class="mdet mout" data-fold="outside" open><summary[^>]*>Used from outside this file \(<span id="mOutCount">1<\/span>\)/);
    assert.match(html, /<input id="mOutFilter" class="inp"/);
    assert.match(html, /data-out="0" data-text="udata\.loadall function"/);
    assert.match(html, /<span class="mcount" data-m-line="2"[^>]*>×2<\/span>/);
    const closed = manageListHtml({ ...base, outside: { rows: [], open: false, ready: false } });
    assert.match(closed, /data-fold="outside"><summary[^>]*>Used from outside this file \(<span id="mOutCount">\.\.\.<\/span>\)/);
    assert.equal(outsideRowsHtml([{ label: '<i>', kind: 'k', count: 1, line: 0 }]).includes('<i>'), false);
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'MemberViewerPanel.ts'), 'utf8');
    assert.match(panel, /case 'openOutside'/);
    assert.match(panel, /msg\.key === 'outside' && msg\.open === true\) \{ void this\.postOutside\(\);/, 'the list is read when the block is opened');
    assert.match(fs.readFileSync(path.join(root, 'src', 'webview', 'manageSection.ts'), 'utf8'), /m\.command !== 'outsideHits'/);
});
