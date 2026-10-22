import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyTextEdits } from '../services/DelphiForm';
import { parseDfmTree, findNode } from '../services/DelphiLayout';
import { isMenuHost, isMenuItem, menuCaption, shortcutText, shortcutValue } from '../services/DelphiMenus';
import { DNode, addEdits, buildDesignModel, deleteEdits, reparentEdits, setPropertyEdits } from '../services/DesignerModel';
import { designerHtml, PALETTE } from '../webview/designerHtml';

const dfm = [
    'object Form1: TForm1', '  Left = 0', '  Top = 0', "  Caption = 'Form1'", '  ClientHeight = 300', '  ClientWidth = 400',
    '  object Panel1: TPanel', '    Left = 10', '    Top = 10', '    Width = 100', '    Height = 50', '    TabOrder = 0', '  end',
    '  object PopupMenu1: TPopupMenu', '    Left = 120', '    Top = 40',
    '    object Open1: TMenuItem', "      Caption = '&Open'", '      ShortCut = 16463', '      OnClick = Open1Click', '    end',
    '    object N1: TMenuItem', "      Caption = '-'", '    end',
    '    object Recent1: TMenuItem', "      Caption = 'Recent'",
    '      object A1: TMenuItem', "        Caption = 'A'", '        Checked = True', '      end',
    '    end',
    '  end',
    'end', '',
].join('\n');
const pas = [
    'unit Unit1;', '', 'interface', '', 'uses Forms, Menus, ExtCtrls;', '', 'type', '  TForm1 = class(TForm)', '    Panel1: TPanel;', '    PopupMenu1: TPopupMenu;',
    '    Open1: TMenuItem;', '    N1: TMenuItem;', '    Recent1: TMenuItem;', '    A1: TMenuItem;', '    procedure Open1Click(Sender: TObject);', '  end;', '', 'var', '  Form1: TForm1;', '',
    'implementation', '', '{$R *.dfm}', '', 'procedure TForm1.Open1Click(Sender: TObject);', 'begin', 'end;', '', 'end.', '',
].join('\n');
const find = (n: DNode, name: string): DNode | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));
const ok = <T extends object>(r: T | { error: string }): T => { assert.ok(!('error' in r), 'error' in r ? (r as { error: string }).error : ''); return r as T; };
const err = (r: object): string => (r as { error: string }).error;

test('shortcuts: the number of the .dfm and the text of the IDE, both ways', () => {
    assert.equal(shortcutText('16463'), 'Ctrl+O');
    assert.equal(shortcutText('24659'), 'Ctrl+Shift+S');
    assert.equal(shortcutText('116'), 'F5');
    assert.equal(shortcutText('32883'), 'Alt+F4');
    assert.equal(shortcutText('46'), 'Del');
    assert.equal(shortcutText('0'), '');
    assert.equal(shortcutText(undefined), '');
    for (const t of ['Ctrl+O', 'Ctrl+Shift+S', 'F5', 'Alt+F4', 'Del', 'Ctrl+Alt+Ins', 'Enter']) { assert.equal(shortcutText(String(shortcutValue(t))), t, t); }
    assert.equal(shortcutValue('ctrl + o'), 16463, 'case and spaces do not matter');
    assert.equal(shortcutValue(''), 0);
    assert.equal(shortcutValue('Ctrl+Hello'), undefined);
    assert.equal(shortcutValue('Super+O'), undefined);
});

test('menu classes and captions', () => {
    assert.ok(isMenuHost('TPopupMenu') && isMenuHost('TMainMenu') && !isMenuHost('TMenuItem') && !isMenuHost('TcxGridPopupMenu'));
    assert.ok(isMenuItem('TMenuItem') && !isMenuItem('TdxBarButton'));
    assert.equal(menuCaption('&Open'), 'Open');
    assert.equal(menuCaption('Save && Close'), 'Save & Close');
});

test('a menu holds its items and their sub-items, none of them painted or moved', () => {
    const m = buildDesignModel(dfm)!;
    const menu = find(m.root, 'PopupMenu1')!;
    assert.ok(menu.nonVisual);
    assert.deepEqual(menu.children.map(c => c.name), ['Open1', 'N1', 'Recent1']);
    assert.deepEqual(find(m.root, 'Recent1')!.children.map(c => c.name), ['A1']);
    for (const n of ['Open1', 'N1', 'Recent1', 'A1']) { const c = find(m.root, n)!; assert.ok(c.fixed && c.structural, n); }
    assert.equal(find(m.root, 'Open1')!.shortcut, 'Ctrl+O');
    assert.equal(find(m.root, 'Open1')!.events['OnClick'], 'Open1Click');
    assert.equal(find(m.root, 'N1')!.caption, '-');
    assert.match(err(reparentEdits(dfm, ['A1'], 'Panel1', [{ left: 1, top: 1 }])), /A1/);
});

test('the shortcut, the flags and the caption of an item are edited the way the IDE writes them', () => {
    const set = (prop: string, value: unknown) => parseDfmTree(applyTextEdits(dfm, ok(setPropertyEdits(dfm, 'Open1', prop, value)).dfmEdits))!;
    assert.equal(findNode(set('ShortCut', 'Ctrl+Shift+S'), 'Open1')!.props['ShortCut'], '24659');
    assert.equal(findNode(set('ShortCut', ''), 'Open1')!.props['ShortCut'], undefined, 'empty removes it');
    assert.equal(findNode(set('Checked', true), 'Open1')!.props['Checked'], 'True');
    assert.equal(findNode(set('RadioItem', true), 'Open1')!.props['RadioItem'], 'True');
    assert.equal(findNode(set('Caption', 'E&xit'), 'Open1')!.props['Caption'], "'E&xit'");
    assert.match(err(setPropertyEdits(dfm, 'Open1', 'ShortCut', 'Ctrl+Hello')), /not a shortcut/);
    assert.match(err(setPropertyEdits(dfm, 'Panel1', 'ShortCut', 'F5')), /no ShortCut/);
});

test('an item is added to a menu or to an item, a separator is named N1, nothing else takes one', () => {
    const into = (parent: string, caption?: string) => {
        const r = ok(addEdits(pas, dfm, { className: 'TMenuItem', parentName: parent, left: 0, top: 0, caption }));
        return { dfm: applyTextEdits(dfm, r.dfmEdits), pas: applyTextEdits(pas, r.pasEdits), name: r.name! };
    };
    const a = into('PopupMenu1');
    assert.equal(findNode(parseDfmTree(a.dfm)!, a.name)!.parent!.name, 'PopupMenu1');
    assert.match(a.pas, new RegExp(a.name + ': TMenuItem;'), 'its field is declared');
    assert.equal(findNode(parseDfmTree(a.dfm)!, a.name)!.props['Left'], undefined, 'no place of its own');
    const sub = into('Recent1');
    assert.equal(findNode(parseDfmTree(sub.dfm)!, sub.name)!.parent!.name, 'Recent1');
    const sep = into('PopupMenu1', '-');
    assert.match(sep.name, /^N\d+$/);
    assert.equal(findNode(parseDfmTree(sep.dfm)!, sep.name)!.props['Caption'], "'-'");
    assert.match(err(addEdits(pas, dfm, { className: 'TMenuItem', parentName: 'Panel1', left: 0, top: 0 })), /menu/);
});

test('deleting an item takes its sub-items with it', () => {
    const out = applyTextEdits(dfm, ok(deleteEdits(pas, dfm, ['Recent1'])).dfmEdits);
    assert.ok(!/Recent1|A1/.test(out) && /Open1/.test(out));
});

test('the palette offers the menus, and the page draws and edits them', () => {
    const by = (c: string) => PALETTE.find(p => p.cls === c);
    assert.ok(by('TPopupMenu') && by('TMainMenu'));
    assert.equal(by('TMenuItem')?.host, 'menu');
    const html = designerHtml('N');
    assert.match(html, /function menuItemFields/);
    assert.match(html, /function menuPreview/);
    assert.match(html, /caption: '-'/, 'the separator button');
});
