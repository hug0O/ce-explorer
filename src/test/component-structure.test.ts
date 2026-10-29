import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { eventsOfComponent, eventsOfHandler } from '../utils/componentEvents';
import { focusHtml, FocusView, manageListHtml } from '../webview/manageSection';
import { designerHtml } from '../webview/designerHtml';

const root = path.join(__dirname, '..');
const read = (f: string): string => fs.readFileSync(path.join(root, f), 'utf8');

const DFM = [
    'object Form1: TForm1', '  OnCreate = FormCreate',
    '  object btnSave: TButton', "    Caption = 'Save'", '    OnClick = btnSaveClick', '    OnEnter = EnterAny', '  end',
    '  object btnOther: TButton', '    OnClick = btnSaveClick', '  end',
    '  object Panel1: TPanel', '    object Edit1: TEdit', '      OnChange = EditChange', '    end', '  end',
    'end',
].join('\r\n');

test('the events of a component, found wherever it is, and the events a handler answers', () => {
    assert.deepEqual(eventsOfComponent(DFM, 'btnSave'), [{ event: 'OnClick', handler: 'btnSaveClick' }, { event: 'OnEnter', handler: 'EnterAny' }]);
    assert.deepEqual(eventsOfComponent(DFM, 'edit1'), [{ event: 'OnChange', handler: 'EditChange' }], 'inside a panel, any case');
    assert.deepEqual(eventsOfComponent(DFM, 'Form1'), [{ event: 'OnCreate', handler: 'FormCreate' }], 'the form itself');
    assert.deepEqual(eventsOfComponent(DFM, 'Nothing'), []);
    assert.deepEqual(eventsOfHandler(DFM, 'btnSaveClick'), ['btnSave.OnClick', 'btnOther.OnClick'], 'one handler for two buttons');
    assert.deepEqual(eventsOfHandler(DFM, 'formcreate'), ['Form.OnCreate']);
});

const base: FocusView = { id: 'm1', name: 'btnSave', kindLabel: 'Field', usages: [], usageTotal: 0, searchable: false, search: '', searchHits: [], searchTotal: 0, open: { used: true, vars: true, find: true, events: true } };

test('clicking a component in the Structure tab shows its events, each one a click away from its handler', () => {
    const html = focusHtml({ ...base, events: [{ event: 'OnClick', handler: 'btnSaveClick', line: 41 }, { event: 'OnEnter', handler: 'EnterAny' }] });
    assert.match(html, /<summary>Events \(2\)<\/summary>/);
    assert.match(html, /data-m-line="41"[^>]*><span class="mln">OnClick<\/span><span class="mtx">btnSaveClick<\/span>/);
    assert.match(html, /EnterAny \(no implementation\)/, 'a handler named in the .dfm with no code is said so');
    assert.ok(!/data-m-line="undefined"/.test(html));
    assert.ok(html.indexOf('data-fold="events"') < html.indexOf('data-fold="used"'), 'the events come before where it is used');
    const handler = focusHtml({ ...base, name: 'btnSaveClick', handlerOf: ['btnSave.OnClick', 'btnOther.OnClick'] });
    assert.match(handler, /Handler of <b>btnSave\.OnClick<\/b>, <b>btnOther\.OnClick<\/b>/);
    assert.ok(!/data-fold="events"/.test(focusHtml(base)), 'nothing for a member with no event');
});

test('in the designer, S on a selected component switches to the code and the Structure tab, filtered and opened', () => {
    const html = designerHtml('N');
    assert.match(html, /\(ev\.key === 's' \|\| ev\.key === 'S'\) && state\.sel\.length === 1 && state\.sel\[0\] !== rootName\(\)\) \{ post\(\{ type: 'showInStructure'/);
    assert.match(html, /row\('Show in Structure', 'S'/);
    const designer = read('webview/FormDesignerPanel.ts');
    assert.match(designer, /case 'showInStructure': \{[\s\S]*showTextDocument\(this\.pasDoc[\s\S]*executeCommand\('ce\.structure\.showComponent', name\)/);
    assert.match(read('extension.ts'), /registerCommand\('ce\.structure\.showComponent'[\s\S]*memberViewer\.showComponentInStructure\(name\)/);
    const panel = read('webview/MemberViewerPanel.ts');
    assert.match(panel, /public async showComponentInStructure\(name: string\)/);
    assert.match(panel, /this\._manageFilter = name;/);
    assert.match(panel, /this\._folds\.used = true;/);
    assert.match(panel, /executeCommand\('ceViewer\.focus'\)/);
    const pkg = JSON.parse(fs.readFileSync(path.join(root, '..', 'package.json'), 'utf8')) as { contributes: { commands: { command: string }[]; menus: { commandPalette: { command: string; when: string }[] } } };
    assert.ok(pkg.contributes.commands.some(c => c.command === 'ce.structure.showComponent'));
    assert.ok(pkg.contributes.menus.commandPalette.some(m => m.command === 'ce.structure.showComponent' && m.when === 'false'), 'not offered in the palette');
    assert.match(read('webview/shortcutsSection.ts'), /keys: 'S', label: 'Switch to the code/);
});

import { helpItems, helpScript, DESIGNER_CHORDS } from '../webview/designerHelp';
import { buildShortcutGroups } from '../webview/shortcutsSection';
import { hasComponent } from '../utils/componentEvents';

test('the designer lists every key and gesture in a menu of its own, the same list as the Shortcuts tab', () => {
    const html = designerHtml('N');
    assert.ok(html.includes('id="helpbtn"') && html.includes('id="keyhelp"') && html.includes('id="keyq"'));
    const items = helpItems();
    for (const k of ['S', 'F2', 'Ctrl+D', 'Ctrl+F', 'Ctrl+L / Ctrl+H', '? / F1', 'Ctrl+K Ctrl+B', 'Ctrl+K Ctrl+F']) { assert.ok(items.some(i => i.keys === k), k + ' is listed'); }
    assert.ok(items.some(i => i.mouse) && items.some(i => !i.mouse), 'keyboard and mouse');
    const pkg = JSON.parse(fs.readFileSync(path.join(root, '..', 'package.json'), 'utf8')) as { contributes: { keybindings: { key: string; command: string; when?: string }[] } };
    const chords = pkg.contributes.keybindings.filter(k => /ceFormDesigner/.test(k.when ?? '')).map(k => k.key.split(' ').map(w => w.replace(/^ctrl\+/, 'Ctrl+').replace(/^(\w)$/, c => c.toUpperCase()).replace(/^Ctrl\+(\w)$/, (_m, c: string) => 'Ctrl+' + c.toUpperCase())).join(' '));
    for (const c of chords) { assert.ok(DESIGNER_CHORDS.some(d => d.keys === c), 'the chord ' + c + ' of package.json is in the menu'); }
    const tab = buildShortcutGroups(pkg as never).find(g => g.id === 'designer')!.items.map(i => i.keys);
    for (const i of items.filter(i => !DESIGNER_CHORDS.includes(i))) { assert.ok(tab.includes(i.keys), i.keys + ' is in the Shortcuts tab too'); }
    const js = helpScript();
    assert.ok(!js.includes('`') && !js.includes('${'), 'plain script');
    assert.match(js, /ev\.key === 'F1' \|\| \(ev\.key === '\?'/);
    assert.match(js, /ev\.key === 'Escape' && !\$\('keyhelp'\)\.hidden/);
    assert.doesNotThrow(() => new Function('$', 'document', js.replace(/\$\('helpbtn'\)[\s\S]*$/, '')), 'the list data parses');
});

test('back from the code: Ctrl+K Ctrl+B also from the sidebar, a button on the component, and the component comes back selected', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, '..', 'package.json'), 'utf8')) as { contributes: { keybindings: { key: string; command: string; when?: string }[]; menus: { commandPalette: { command: string; when: string }[] } } };
    const k = pkg.contributes.keybindings.find(b => b.command === 'ce.delphi.toggleDesigner')!;
    assert.match(k.when ?? '', /sideBarFocus/);
    assert.match(k.when ?? '', /resourceExtname/, 'still in the unit and the form');
    assert.ok(pkg.contributes.menus.commandPalette.some(m => m.command === 'ce.delphi.showInDesigner' && m.when === 'false'));
    assert.ok(!/data-m-act="designer"/.test(focusHtml(base)), 'the button is not inside the detail of a component');
    const top = manageListHtml({ typeOptions: [], selectedType: 'c', isFile: false, add: { field: true, method: true, property: false, constructor: false }, canMove: false, rows: [], filter: '', kindFilter: '', group: 'source', designer: { id: 'm1', name: 'btnSave' } } as never);
    assert.match(top, /data-m-act="designer" data-id="m1"[^>]*>🎨 Show in the designer \(btnSave\)<span class="kbd">Ctrl\+K Ctrl\+B<\/span>/, 'at the top of the Structure tab, naming the component');
    assert.ok(top.indexOf('mdesigner') < top.indexOf('madd-box'), 'above the Add buttons');
    assert.match(manageListHtml({ typeOptions: [], selectedType: 'c', isFile: false, add: { field: true, method: true, property: false, constructor: false }, canMove: false, rows: [], filter: '', kindFilter: '', group: 'source', designer: { id: '' } } as never), /data-id=""[^>]*>🎨 Show in the designer<span/, 'with no component, just the designer');
    assert.ok(!/mdesigner/.test(manageListHtml({ typeOptions: [], selectedType: 'c', isFile: false, add: { field: true, method: true, property: false, constructor: false }, canMove: false, rows: [], filter: '', kindFilter: '', group: 'source' } as never)), 'not for a unit with no form');
    assert.equal(hasComponent(DFM, 'btnSave'), true);
    assert.equal(hasComponent(DFM, 'Missing'), false);
    const d = read('webview/FormDesignerPanel.ts');
    assert.match(d, /FormDesignerPanel\.backTo\.set\(this\.dfmDoc\.uri\.toString\(\), name\)/, 'S remembers the component');
    assert.match(d, /type: 'selectComponent', name: back/);
    assert.match(d, /static async showComponent\(/);
    assert.match(read('webview/designerHtml.ts'), /m\.type === 'selectComponent'/);
    assert.match(read('webview/MemberViewerPanel.ts'), /executeCommand\('ce\.delphi\.showInDesigner', target \? target\.name : ''\)/);
    assert.match(read('extension.ts'), /registerCommand\('ce\.delphi\.showInDesigner'/);
});

test('the way back works while a page of the sidebar has the focus (no active text editor), and says which key does it', () => {
    const ext = read('extension.ts');
    assert.match(ext, /FormDesignerPanel\.toggle\(vscode\.window\.activeTextEditor\?\.document \?\? currentDocument\(\)\)/, 'the last document is used');
    const d = read('webview/FormDesignerPanel.ts');
    assert.match(d, /const back = FormDesignerPanel\.backTo\.get\(shown\.dfmDoc\.uri\.toString\(\)\)/, 'the way with no document selects the component too');
    assert.match(d, /setStatusBarMessage\('CE: Ctrl\+K Ctrl\+B goes back to the designer/);
});

import { parentOf, withParents } from '../utils/memberSearch';

test('"Used in this file" writes the routine that holds the lines in grey above them', () => {
    const ranges = [
        { name: 'TForm1.btnSaveClick', start: 10, end: 20 }, { name: 'TForm1.btnSaveClick', start: 40, end: 52 },
        { name: 'TForm1.Other', start: 60, end: 70 }, { name: 'Outer', start: 100, end: 140 }, { name: 'Outer.Inner', start: 110, end: 115 },
    ];
    assert.equal(parentOf(12, ranges), 'TForm1.btnSaveClick');
    assert.equal(parentOf(45, ranges), 'TForm1.btnSaveClick', 'the implementation is a range too');
    assert.equal(parentOf(112, ranges), 'Outer.Inner', 'the narrowest one holds it');
    assert.equal(parentOf(5, ranges), undefined, 'outside every routine: nothing');
    const hit = (line: number) => ({ line, text: 'x', start: 0, end: 1 });
    const html = focusHtml({ ...base, usageTotal: 4, usages: withParents([hit(12), hit(15), hit(65), hit(5)], ranges) });
    const rows = [...html.matchAll(/class="(mparent|mhit)"[^>]*>(?:<span class="mln">(\d+)<\/span>|([^<]*))/g)].map(m => m[1] === 'mparent' ? 'P:' + m[3] : 'L:' + m[2]);
    assert.deepEqual(rows, ['P:TForm1.btnSaveClick', 'L:13', 'L:16', 'P:TForm1.Other', 'L:66', 'L:6'], 'one grey line per group, none for a line outside a routine');
    assert.ok(!/data-m-line="[^"]*"[^>]*class="mparent"/.test(html) && !/class="mparent" data-m-line/.test(html), 'the grey line is not a link');
    const panel = read('webview/MemberViewerPanel.ts');
    assert.match(panel, /use\.hits = withParents\(use\.hits, this\.parentRanges\(\)\)/);
    assert.match(panel, /private parentRanges\(\): ParentRange\[\]/);
});

test('after S the focus stays in the code, so Ctrl+K Ctrl+B goes back; the form is found even when no editor is active', () => {
    const panel = read('webview/MemberViewerPanel.ts');
    assert.match(panel, /this\._view\.show\(true\)/, 'the sidebar is shown without the focus');
    assert.match(panel, /executeCommand\('workbench\.action\.focusActiveEditorGroup'\)/);
    assert.match(panel, /const doc = vscode\.window\.activeTextEditor\?\.document \?\? currentDocument\(\);\s*\n\s*const m = doc \? \/\^\(\.\*\)\\.pas\$\/i/);
});
