import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as vm from 'vm';
import { viewScript } from '../webview/designerView';
import { designerHtml } from '../webview/designerHtml';
import { buildDesignModel } from '../services/DesignerModel';

const sandbox: Record<string, any> = {};
vm.createContext(sandbox);
// the very text the page includes: its functions only touch the page when they are called
vm.runInContext(viewScript(), sandbox);
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const viewMatches = (nodes: unknown[], q: string): string[] => plain(sandbox.viewMatches(nodes, q));
const viewFields = (n: unknown): string[] => plain(sandbox.viewFields(n));

const NODES = [
    { name: 'btnSave', cls: 'TButton', caption: 'Enregistrer', events: { OnClick: 'btnSaveClick' } },
    { name: 'edtNom', cls: 'TcxTextEdit', text: 'Dupont', dataField: 'NOM' },
    { name: 'lblNom', cls: 'TLabel', caption: 'Nom du client' },
    { name: 'cxgcNOM', cls: 'TcxGridDBColumn', gridField: 'CLIENT_NOM' },
    { name: 'cbxType', cls: 'TComboBox', lines: ['Particulier', 'Société'], events: {} },
];

test('a search looks at the name, the class, the caption, the text, the field, the events and the items', () => {
    assert.ok(viewFields(NODES[0]).includes('btnSaveClick'));
    assert.deepEqual(viewMatches(NODES, 'enregistrer'), ['btnSave']);
    assert.deepEqual(viewMatches(NODES, 'onclick'), ['btnSave'], 'an event name');
    assert.deepEqual(viewMatches(NODES, 'btnSaveClick'), ['btnSave'], 'a handler');
    assert.deepEqual(viewMatches(NODES, 'client_nom'), ['cxgcNOM'], 'the field of a column');
    assert.deepEqual(viewMatches(NODES, 'société'), ['cbxType'], 'an item of a list');
    assert.deepEqual(viewMatches(NODES, 'tcxtextedit'), ['edtNom'], 'a class');
});

test('every word must match, the names that start with the text come first, nothing for an empty search', () => {
    assert.deepEqual(viewMatches(NODES, 'nom'), ['edtNom', 'lblNom', 'cxgcNOM']);
    assert.deepEqual(viewMatches(NODES, 'nom client'), ['lblNom', 'cxgcNOM'], 'both words');
    assert.deepEqual(viewMatches(NODES, 'cxgc nom'), ['cxgcNOM']);
    assert.deepEqual(viewMatches(NODES, '   '), []);
    assert.deepEqual(viewMatches(NODES, 'zzz'), []);
    const ranked = viewMatches(NODES, 'btn');
    assert.deepEqual(ranked, ['btnSave'], 'a name that starts with the word');
    assert.equal(viewMatches([{ name: 'xbtn', cls: 'T' }, { name: 'btnA', cls: 'T' }], 'btn')[0], 'btnA', 'the one whose name starts with it first');
});

test('the toolbar has one View button instead of the check boxes, and the page can find, number and measure', () => {
    const html = designerHtml('N');
    assert.match(html, /<button id="viewbtn"/);
    assert.ok(!html.includes('id="names"') && !html.includes('id="showparents"'), 'the two check boxes went into the menu');
    assert.match(html, /check\('Names of the components', 'names'/);
    assert.match(html, /check\('TabOrder numbers', 'tab'/);
    assert.match(html, /check\('Rulers', 'rulers'/);
    assert.match(html, /<div id="findbar" hidden>/);
    assert.match(html, /<canvas id="rulerx" class="ruler">/);
    assert.match(html, /ev\.key\.toLowerCase\(\) === 'f'\) \{ openFind\(\)/, 'Ctrl+F opens the find bar');
    assert.match(html, /post\(\{ type: 'tabOrder', names: state\.sel\.slice\(\) \}\)/);
    assert.match(html, /'tabno' \+ \(seen/, 'the numbers of the TabOrder, in red when two components share one');
    assert.match(html, /viewInit\(\);/);
});

test('the skin a form asks for is told to the page, to preview its colours', () => {
    const dfm = ['object F: TF', '  ClientWidth = 200', '  ClientHeight = 100', '  object sk: TdxSkinController', '    SkinName = \'Office2016Dark\'', '  end', 'end'].join('\n');
    assert.equal(buildDesignModel(dfm)!.skinName, 'Office2016Dark');
    const nested = ['object F: TF', '  ClientWidth = 200', '  ClientHeight = 100', '  object g: TcxGrid', '    LookAndFeel.SkinName = \'Blue\'', '  end', 'end'].join('\n');
    assert.equal(buildDesignModel(nested)!.skinName, 'Blue');
    assert.equal(buildDesignModel('object F: TF\n  ClientWidth = 1\nend')!.skinName, undefined);
});
