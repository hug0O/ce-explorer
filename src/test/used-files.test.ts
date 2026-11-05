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

test('Structure lists what the filter finds in the used files, each object opens to the lines of this file that write it', () => {
    const rows = [
        { label: 'UData.TStore.Save', kind: 'method', count: 2, line: 4, uses: [{ line: 4, text: 'Store.Save;' }, { line: 9, text: 'Store.Save;' }], more: 0, canOpen: true, originFile: 'UData.pas', originLine: 11 },
        { label: 'UData.SaveAll', kind: 'function', count: 0, line: 0, uses: [], more: 0, canOpen: true, originFile: 'UData.pas', originLine: 11 },
        { label: 'System.SysUtils.Format', kind: 'function', count: 1, line: 1, uses: [{ line: 1, text: "s := Format('%d', [n]);" }], more: 0, canOpen: false, originFile: '', originLine: 0 },
    ];
    const html = manageListHtml({ ...base, external: rows });
    assert.match(html, /<div id="mExtBox"><div class="mgroup" id="mExtTitle"[^>]*>From the files it uses \(3\)<\/div>/);
    assert.match(html, /<details><summary[^>]*><span class="mln">method<\/span><span class="mtx">UData\.TStore\.Save<\/span><span class="mcount">×2<\/span><button class="mopen" data-ext="0"/, 'an object that is written here unfolds');
    assert.match(html, /<li class="mhit" data-m-line="9" title="Go to line 10">/, 'its lines go to the code');
    assert.match(html, /<div class="mflat"><span class="mln">function<\/span><span class="mtx">UData\.SaveAll<\/span><button class="mopen" data-ext="1"/, 'one that is not written here is a plain row');
    assert.ok(!html.includes('data-ext="2"'), 'a standard library has no file to open');
    assert.match(manageListHtml(base), /<div id="mExtBox" hidden>/, 'nothing typed or found: the block is hidden');
    assert.equal(externalRowsHtml([{ label: '<b>', kind: 'x', count: 0, line: 0, uses: [], more: 0, canOpen: true, originFile: 'UData.pas', originLine: 11 }]).includes('<b>'), false, 'what is written is escaped');
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
import { outsidePageHtml, outsideRowsHtml } from '../webview/manageSection';
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
    assert.deepEqual(load.uses, [{ line: 2, text: 'LoadAll;' }, { line: 7, text: 'loadall;' }], 'each line that writes it, with its text');
    assert.ok(!r.some(u => u.symbol.name === 'Text'), 'a member whose name is written alone is not a use');
    assert.deepEqual(usedFromOutside('x', undefined, []), []);
    assert.equal(usedFromOutside('a->Save(); b::Save();', familyOf('cpp'), [sym('/p/s.h', 'Store', 'Save')])[0].count, 2, 'a member after -> or ::');
});

test('the tab Used lists the objects with their own filter, a row opens to the lines that write it and the arrow opens the definition', () => {
    const rows = [{ label: 'UData.LoadAll', kind: 'function', count: 2, line: 2, uses: [{ line: 2, text: 'LoadAll;' }, { line: 7, text: 'loadall;' }], more: 3, canOpen: true, originFile: 'UData.pas', originLine: 11 }];
    const html = outsidePageHtml({ rows, ready: true });
    assert.match(html, /From outside \(<span id="mOutCount">1<\/span>\)/);
    assert.match(html, /<input id="mOutFilter" class="inp"/);
    assert.match(html, /<li class="mobj" data-text="udata\.loadall function udata\.pas [^"]*loadall;[^"]*"><details>/, 'the filter reads the object, the kind, the origin file and the lines');
    assert.match(html, /<li class="morigin"><button class="mopen mopenwide" data-out="0"[^>]*>↗ Defined in <b>UData\.pas<\/b>, line 12<\/button><\/li>/, 'the origin file, as a way to open the definition');
    assert.match(html, /<span class="mcount">×2<\/span><button class="mopen" data-out="0"/);
    assert.match(html, /<li class="mhit" data-m-line="2" title="Go to line 3"><span class="mln">3<\/span><span class="mtx">LoadAll;<\/span><\/li>/, 'a line of use goes to that line of the code');
    assert.match(html, /<li class="mhit" data-m-line="7"/);
    assert.match(html, /… 3 more line\(s\) not listed/);
    assert.match(outsidePageHtml({ rows: [], ready: false }), /Reading the project\.\.\./);
    assert.equal(outsideRowsHtml([{ label: '<i>', kind: 'k', count: 1, line: 0, uses: [{ line: 0, text: '<s>' }], more: 0, canOpen: true, originFile: 'UData.pas', originLine: 11 }]).includes('<'), true);
    assert.equal(/<i>|<s>/.test(outsideRowsHtml([{ label: '<i>', kind: 'k', count: 1, line: 0, uses: [{ line: 0, text: '<s>' }], more: 0, canOpen: true, originFile: 'UData.pas', originLine: 11 }])), false, 'what is written is escaped');
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'MemberViewerPanel.ts'), 'utf8');
    assert.match(panel, /export type SidebarTab = 'manage' \| 'outside'/);
    assert.match(panel, /case 'openOutside'/);
    assert.match(panel, /tab\('outside', 'Used'/, 'a tab of the header, not a block under the list');
    assert.ok(!/outsideNow/.test(panel), 'the block under the member list is gone');
    assert.match(fs.readFileSync(path.join(root, 'src', 'webview', 'manageSection.ts'), 'utf8'), /m\.command !== 'outsideHits'/);
});

import { attachParents } from '../utils/usedFiles';

test('each line of use comes with the routine of the open file that holds it, and the lines are grouped under it as in Structure', () => {
    const ranges = [{ name: 'TForm1.Go', start: 10, end: 20 }, { name: 'TForm1.Stop', start: 22, end: 30 }, { name: 'Outer', start: 0, end: 40 }];
    const uses = attachParents([{ line: 12, text: 'LoadAll;' }, { line: 15, text: 'LoadAll(1);' }, { line: 25, text: 'LoadAll;' }, { line: 35, text: 'LoadAll;' }, { line: 90, text: 'LoadAll;' }], ranges);
    assert.deepEqual(uses.map(u => u.parent), ['TForm1.Go', 'TForm1.Go', 'TForm1.Stop', 'Outer', undefined], 'the smallest routine that holds the line');
    assert.equal(uses[0].parentLine, 10);
    const row = { label: 'UData.LoadAll', kind: 'function', count: 5, line: 12, uses, more: 0, canOpen: true, originFile: 'UData.pas', originLine: 11 };
    const html = outsideRowsHtml([row]);
    assert.equal((html.match(/class="mparent"/g) ?? []).length, 3, 'one header per run of lines in the same routine');
    assert.match(html, /<li class="mparent" data-m-line="10" title="Go to TForm1\.Go">in TForm1\.Go<\/li><li class="mhit" data-m-line="12"[^>]*>[^]*<li class="mhit" data-m-line="15"/);
    assert.match(html, /<li class="mparent" data-m-line="22" title="Go to TForm1\.Stop">in TForm1\.Stop<\/li><li class="mhit" data-m-line="25"/);
    assert.ok(html.indexOf('morigin') < html.indexOf('class="mparent"'), 'the origin comes first');
    assert.match(outsidePageHtml({ rows: [row], ready: true, file: 'Main.pas' }), /title="The objects of the other files that Main\.pas writes"/, 'the open file is named');
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'manageSection.ts'), 'utf8');
    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', "'Enter'"]) { assert.ok(panel.includes(key), key + ' moves along the list'); }
});

test('the same object is listed once: overloads, a declaration written twice, a copy of the unit, any case', () => {
    const list = [
        { label: 'UData.Log', name: 'Log', container: '', kind: 'function', path: '/a/UData.pas', line: 3 },
        { label: 'udata.LOG', name: 'LOG', container: '', kind: 'function', path: '/b/udata.pas', line: 9 },
    ];
    const r = usedFromOutside('Log(1); log(2);', familyOf('pascal'), list);
    assert.equal(r.length, 1);
    assert.equal(r[0].count, 2);
});
