import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyTextEdits } from '../services/DelphiForm';
import { findNode, parseDfmTree } from '../services/DelphiLayout';
import { collectionRecords } from '../services/DelphiDockBars';
import { DNode, buildDesignModel, setPropertyEdits } from '../services/DesignerModel';
import { designerHtml } from '../webview/designerHtml';

export const BAR_DFM = [
    'object BarForm: TBarForm', '  Left = 0', '  Top = 0', "  Caption = 'Bars'", '  ClientHeight = 200', '  ClientWidth = 500',
    '  object dockMain: TdxBarDockControl', '    Left = 0', '    Top = 0', '    Width = 500', '    Height = 30', '    Align = dalTop', '    BarManager = bm', '  end',
    '  object bm: TdxBarManager', '    Categories.Strings = (', "      'Default')", '    Left = 400', '    Top = 100',
    '    object barMain: TdxBar', "      Caption = 'Main'", '      DockControl = dockMain', '      DockedDockControl = dockMain', '      DockedLeft = 0', '      DockedTop = 0',
    '      ItemLinks = <', '        item', '          Visible = True', "          ItemName = 'btnNew'", '        end',
    '        item', '          Visible = True', '          BeginGroup = True', "          ItemName = 'stInfo'", '        end',
    '        item', '          Visible = True', "          ItemName = 'subTools'", '        end',
    '        item', '          Visible = True', "          ItemName = 'btnHidden'", '        end>',
    '      Visible = True', '    end',
    '    object barOff: TdxBar', "      Caption = 'Not docked'", '      DockedLeft = 0', '      DockedTop = 0', '      ItemLinks = <>', '      Visible = True', '    end',
    '    object btnNew: TdxBarButton', "      Caption = 'New'", '      Category = 0', '      Visible = ivAlways', '    end',
    '    object stInfo: TdxBarStatic', "      Caption = 'Ready'", '      Category = 0', '      Visible = ivAlways', '      Width = 80', '    end',
    '    object subTools: TdxBarSubItem', "      Caption = 'Tools'", '      Category = 0', '      Visible = ivAlways', '      ItemLinks = <>', '    end',
    '    object btnHidden: TdxBarButton', "      Caption = 'Secret'", '      Category = 0', '      Visible = ivNever', '    end',
    '  end',
    'end', '',
].join('\n');

const find = (n: DNode, name: string): DNode | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));
const ok = <T extends object>(r: T | { error: string }): T => { assert.ok(!('error' in r), 'error' in r ? (r as { error: string }).error : ''); return r as T; };

test('the records of a collection: the lines of each item, nested things left alone', () => {
    const root = parseDfmTree(BAR_DFM)!;
    const bar = findNode(root, 'barMain')!;
    const recs = collectionRecords(BAR_DFM, bar, 'ItemLinks');
    assert.deepEqual(recs.map(r => r['ItemName']), ["'btnNew'", "'stInfo'", "'subTools'", "'btnHidden'"]);
    assert.equal(recs[1]['BeginGroup'], 'True');
    assert.deepEqual(collectionRecords(BAR_DFM, findNode(root, 'barOff')!, 'ItemLinks'), []);
});

test('a dock control shows the visible bars docked in it, with their visible items', () => {
    const m = buildDesignModel(BAR_DFM)!;
    const dock = find(m.root, 'dockMain')!;
    assert.deepEqual(dock.dockBars!.map(b => b.name), ['barMain'], 'the bar with no dock control is not drawn');
    const items = dock.dockBars![0].items;
    assert.deepEqual(items.map(i => [i.caption, i.kind, i.visible, i.beginGroup]), [['New', 'button', true, false], ['Ready', 'static', true, true], ['Tools', 'sub', true, false], ['Secret', 'button', false, false]]);
    assert.equal(items[1].width, 80);
    const bar = find(m.root, 'barMain')!;
    assert.equal(bar.barItems!.length, 4, 'the bar lists every item, the hidden one too');
    assert.equal(find(m.root, 'btnHidden')!.visible, false, 'ivNever is hidden');
});

test('bar items are shown with ivAlways / ivNever, a bar is docked with DockControl', () => {
    const edit = (name: string, prop: string, value: unknown) => parseDfmTree(applyTextEdits(BAR_DFM, ok(setPropertyEdits(BAR_DFM, name, prop, value)).dfmEdits))!;
    assert.equal(findNode(edit('btnNew', 'Visible', false), 'btnNew')!.props['Visible'], 'ivNever');
    assert.equal(findNode(edit('btnHidden', 'Visible', true), 'btnHidden')!.props['Visible'], 'ivAlways');
    assert.equal(findNode(edit('barMain', 'Visible', false), 'barMain')!.props['Visible'], 'False', 'a bar itself is a plain boolean');
    assert.equal(findNode(edit('btnNew', 'Caption', 'Open'), 'btnNew')!.props['Caption'], "'Open'");
    const moved = findNode(edit('barOff', 'DockControl', 'dockMain'), 'barOff')!;
    assert.equal(moved.props['DockControl'], 'dockMain');
    const undocked = findNode(edit('barMain', 'DockControl', ''), 'barMain')!;
    assert.equal(undocked.props['DockControl'], undefined);
    assert.equal(undocked.props['DockedDockControl'], undefined);
    assert.match((setPropertyEdits(BAR_DFM, 'barMain', 'DockControl', 'btnNew') as { error: string }).error, /dock control/);
});

test('the page draws the bars and edits a bar and its items', () => {
    const html = designerHtml('N');
    assert.match(html, /function dockContent/);
    assert.match(html, /function barFields/);
    assert.match(html, /\.dxbar \{/);
});
