import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits } from '../services/DelphiForm';
import { findNode, parseDfmTree } from '../services/DelphiLayout';
import { DNode, buildDesignModel, setPropertyEdits, wordWrapProp } from '../services/DesignerModel';
import { designerHtml } from '../webview/designerHtml';

const dfm = [
    'object F: TF', '  ClientHeight = 200', '  ClientWidth = 300',
    '  object lbl: TLabel', '    Left = 8', '    Top = 8', '    Width = 100', '    Height = 40', "    Caption = 'one'#13#10'two'", '    WordWrap = True', '  end',
    '  object chk: TCheckBox', '    Left = 8', '    Top = 60', '    Width = 100', '    Height = 17', "    Caption = 'check'", '  end',
    '  object cxl: TcxLabel', '    Left = 8', '    Top = 90', '    Width = 100', '    Height = 17', "    Caption = 'cx'", '  end',
    '  object pnl: TPanel', '    Left = 120', '    Top = 8', '    Width = 100', '    Height = 40', "    Caption = ''", '  end',
    'end', '',
].join('\n');
const find = (n: DNode, name: string): DNode | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));
const ok = <T extends object>(r: T | { error: string }): T => { assert.ok(!('error' in r), 'error' in r ? (r as { error: string }).error : ''); return r as T; };
const root = path.resolve(__dirname, '..', '..');

test('a caption on several lines is written as #13#10, read back with its line breaks, and drawn on several lines', () => {
    const out = applyTextEdits(dfm, ok(setPropertyEdits(dfm, 'chk', 'Caption', 'first line\nsecond line')).dfmEdits);
    assert.match(out, /Caption = 'first line'#13#10'second line'/);
    const m = buildDesignModel(out)!;
    assert.equal(find(m.root, 'chk')!.caption!.replace(/\r/g, ''), 'first line\nsecond line');
    assert.equal(find(buildDesignModel(dfm)!.root, 'lbl')!.caption!.replace(/\r/g, ''), 'one\ntwo');
    const html = designerHtml('N');
    assert.match(html, /textarea\.capbox/);
    assert.match(html, /\.ctl\.ml > \.chrome \{ white-space: pre;/, 'explicit line breaks are drawn');
});

test('Word wrap is offered for the classes that have it, with the property each one uses', () => {
    assert.equal(wordWrapProp('TLabel', {}), 'WordWrap');
    assert.equal(wordWrapProp('TcxLabel', {}), 'Properties.WordWrap');
    assert.equal(wordWrapProp('TcxButton', {}), 'WordWrap');
    assert.equal(wordWrapProp('TEdit', {}), undefined);
    assert.equal(wordWrapProp('TEdit', { WordWrap: 'True' }), 'WordWrap', 'a class the catalog does not know but that says so');
    const m = buildDesignModel(dfm)!;
    assert.equal(find(m.root, 'lbl')!.wrapProp, 'WordWrap');
    assert.equal(find(m.root, 'cxl')!.wrapProp, 'Properties.WordWrap');
    assert.equal(find(m.root, 'pnl')!.wrapProp, undefined);
    const set = (name: string, prop: string, v: boolean) => parseDfmTree(applyTextEdits(dfm, ok(setPropertyEdits(dfm, name, prop, v)).dfmEdits))!;
    assert.equal(findNode(set('cxl', 'Properties.WordWrap', true), 'cxl')!.props['Properties.WordWrap'], 'True');
    assert.equal(findNode(set('chk', 'WordWrap', true), 'chk')!.props['WordWrap'], 'True');
    assert.match((setPropertyEdits(dfm, 'pnl', 'WordWrap', true) as { error: string }).error, /no WordWrap/);
    assert.match(designerHtml('N'), /checkbox\('Word wrap', n\.wrap === true, setter\(n, n\.wrapProp\)\)/);
});

test('Ctrl+K Ctrl+F toggles the full screen of the designer, and the button says so', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { contributes: { keybindings: { key: string; command: string; when?: string }[]; commands: { command: string }[] } };
    const kb = pkg.contributes.keybindings.find(k => k.command === 'ce.delphi.designerFullScreen')!;
    assert.deepEqual([kb.key, kb.when], ['ctrl+k ctrl+f', "activeWebviewPanelId == 'ceFormDesigner'"], 'only while the designer is the active tab');
    assert.ok(pkg.contributes.commands.some(c => c.command === 'ce.delphi.designerFullScreen'));
    assert.match(fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8'), /registerCommand\('ce\.delphi\.designerFullScreen'/);
    const html = designerHtml('N');
    assert.match(html, /⛶ Full screen<span class="kbd">Ctrl\+K Ctrl\+F<\/span>/);
    assert.match(html, /if \(m\.type === 'toggleFull'\) \{ setFull\(!state\.ui\.full\); return; \}/);
});

test('a panel that holds a form, and a handler that opens one, are linked to its designer', () => {
    const html = designerHtml('N');
    assert.match(html, /section\(box, 'Hosted form', 'hosted'/);
    assert.match(html, /post\(\{ type: 'openHostedForm', cls: h\.className \|\| '', arg: h\.formArg \}\)/);
    assert.match(html, /post\(\{ type: 'handlerForms', name: n\.name, event: e4 \}\)/);
    assert.match(html, /state\.hosts = m\.hosts \|\| \[\]/);
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { contributes: { configuration: { properties: Record<string, { default: unknown }> } } };
    assert.deepEqual(pkg.contributes.configuration.properties['ce.delphi.hostCalls'].default, ['fAddFormInto']);
});

test('the 🗗 button is on every wired event, and a form that is only mentioned is never offered; the 🔗 shows whenever the unit puts a form in a container', () => {
    const html = designerHtml('N');
    assert.match(html, /var fb = el\('span', 'evgo evform', '🗗'\)/, 'the button is always there');
    assert.match(html, /m\.type === 'hosts'/);
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'FormDesignerPanel.ts'), 'utf8');
    assert.match(panel, /hosts: this\.hosts\(\), canUndo/, 'the model carries every container that holds a form, the workspace having it or not');
    assert.match(panel, /const found = all\.filter\(f => !f\.how\.startsWith\('refers to'\)\)/, 'the forms the code only mentions (frmMain, a data module) are not links');
});
