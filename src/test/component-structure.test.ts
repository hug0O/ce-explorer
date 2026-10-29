import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { eventsOfComponent, eventsOfHandler } from '../utils/componentEvents';
import { focusHtml, FocusView } from '../webview/manageSection';
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
