import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyTextEdits, normalizeEdits, resolveComponentDef, TextEdit } from '../services/DelphiForm';
import { parseDfmTree } from '../services/DelphiLayout';
import { findHost, nestedRuleOf, onlyHolds } from '../services/DelphiNested';
import { isBarManager, isBarPart, isDockControl, isStyle } from '../services/DelphiBars';
import { addEdits, buildDesignModel, deleteEdits, reparentEdits, setPropertyEdits, DNode } from '../services/DesignerModel';
import { familyOf } from '../services/DelphiThirdParty';

const DFM = [
    'object F: TF',
    '  ClientHeight = 300',
    '  ClientWidth = 500',
    '  object dxBarDockControl1: TdxBarDockControl',
    '    Left = 0', '    Top = 0', '    Width = 500', '    Height = 34', '    Align = dalTop', '    BarManager = bmBars',
    '  end',
    '  object bmBars: TdxBarManager',
    '    Left = 8', '    Top = 8',
    '    object dxbrMain: TdxBar', '      Caption = \'Main\'', '      DockControl = dxBarDockControl1', '    end',
    '    object btnSave: TdxBarButton', '      Caption = \'Save\'', '      Category = 0', '      Style = stRed', '      OnClick = btnSaveClick', '    end',
    '    object dxbsInfo: TdxBarStatic', '      Caption = \'Info\'', '      Category = 0', '    end',
    '  end',
    '  object cxStyleRepository1: TcxStyleRepository',
    '    Left = 40', '    Top = 8',
    '    object stRed: TcxStyle', '      Color = 255', '    end',
    '  end',
    'end',
].join('\n');
const PAS = ['unit U;', 'interface', 'type', '  TF = class(TForm)', '    dxBarDockControl1: TdxBarDockControl;', '    bmBars: TdxBarManager;', '    dxbrMain: TdxBar;', '    btnSave: TdxBarButton;', '    dxbsInfo: TdxBarStatic;', '    cxStyleRepository1: TcxStyleRepository;', '    stRed: TcxStyle;',
    '    procedure btnSaveClick(Sender: TObject);', '  end;', 'implementation', 'procedure TF.btnSaveClick(Sender: TObject);', 'begin', 'end;', 'end.'].join('\n');
const flat = (n: DNode): DNode[] => [n, ...n.children.flatMap(flat)];
const apply = (t: string, e: TextEdit[]): string => applyTextEdits(t, (normalizeEdits(e) as { edits: TextEdit[] }).edits);

test('the DevExpress bar classes are recognised', () => {
    assert.ok(isBarManager('TdxBarManager') && isDockControl('TdxBarDockControl'));
    for (const c of ['TdxBar', 'TdxBarButton', 'TdxBarStatic', 'TdxBarSubItem', 'TdxBarLargeButton', 'TdxBarCombo', 'TdxBarSeparator']) { assert.ok(isBarPart(c), c); }
    assert.ok(!isBarPart('TdxBarManager') && !isBarPart('TdxBarDockControl') && !isBarPart('TdxBarPopupMenu'), 'a popup menu is a component of the form, not a part of the manager');
    assert.ok(isStyle('TcxStyle'));
    assert.equal(familyOf('TdxBarStatic'), 'devexpress');
    for (const c of ['TdxBarDockControl', 'TdxBarManager', 'TdxBar', 'TdxBarButton', 'TdxBarStatic', 'TcxStyle']) {
        assert.ok(resolveComponentDef(c).namePrefix.length > 0 && resolveComponentDef(c).className === c, c + ' is in the catalog');
    }
    assert.deepEqual(resolveComponentDef('TdxBarButton').events.map(e => e.name), ['OnClick']);
    assert.equal(resolveComponentDef('TdxBarDockControl').nested, undefined, 'the dock control is a visible control');
    assert.equal(resolveComponentDef('TdxBarButton').nested, true);
});

test('the designer draws the dock control as a bar and keeps bars, items and styles as parts', () => {
    const model = buildDesignModel(DFM)!;
    const by = (name: string): DNode => flat(model.root).find(n => n.name === name)!;
    assert.equal(by('dxBarDockControl1').nonVisual, false);
    assert.deepEqual([by('dxBarDockControl1').w, by('dxBarDockControl1').h], [500, 34]);
    assert.equal(by('bmBars').nonVisual, true);
    for (const n of ['dxbrMain', 'btnSave', 'dxbsInfo', 'stRed']) { assert.ok(by(n).structural && by(n).fixed, n + ' is a part'); }
    assert.deepEqual(by('bmBars').children.map(c => c.name), ['dxbrMain', 'btnSave', 'dxbsInfo']);
});

test('bars and items go into a bar manager, styles into a style repository, nowhere else', () => {
    assert.equal(nestedRuleOf('TdxBarButton')?.id, 'bars');
    assert.equal(nestedRuleOf('TcxStyle')?.id, 'styles');
    const root = parseDfmTree(DFM)!;
    const manager = root.children.find(c => c.name === 'bmBars')!;
    assert.equal(findHost(nestedRuleOf('TdxBarStatic')!, manager)?.name, 'bmBars');
    assert.equal(findHost(nestedRuleOf('TdxBarStatic')!, root.children[0]), undefined);
    assert.match(onlyHolds(manager)!, /bars and their items/);

    const added = addEdits(PAS, DFM, { className: 'TdxBarButton', parentName: 'bmBars', left: 0, top: 0 });
    assert.ok(!('error' in added), 'error' in added ? added.error : '');
    if (!('error' in added)) {
        const out = apply(DFM, added.dfmEdits);
        const parsed = parseDfmTree(out)!.children.find(c => c.name === 'bmBars')!;
        assert.ok(parsed.children.some(c => c.className === 'TdxBarButton' && c.props['Caption']), 'the new button is inside the manager, with a caption');
        assert.match(apply(PAS, added.pasEdits), /TdxBarButton;/);
    }
    const outside = addEdits(PAS, DFM, { className: 'TdxBarButton', parentName: 'F', left: 0, top: 0 });
    assert.ok('error' in outside && /TdxBarManager/.test(outside.error), 'an item dropped on the form itself is refused: it goes into a manager');
    const moved = reparentEdits(DFM, ['btnSave'], 'dxBarDockControl1', [{ left: 0, top: 0 }]);
    assert.ok('error' in moved && /part of bmBars/.test(moved.error));
});

test('a dock control is linked to its bar manager from the inspector', () => {
    const r = setPropertyEdits(DFM, 'dxBarDockControl1', 'BarManager', 'bmBars');
    assert.ok(!('error' in r));
    const bad = setPropertyEdits(DFM, 'dxBarDockControl1', 'BarManager', 'dxbrMain');
    assert.ok('error' in bad && /bar manager/.test(bad.error));
    const other = setPropertyEdits(DFM, 'bmBars', 'BarManager', 'bmBars');
    assert.ok('error' in other, 'only a dock control has the property');
    const unlinked = setPropertyEdits(DFM, 'dxBarDockControl1', 'BarManager', '');
    assert.ok(!('error' in unlinked));
    if (!('error' in unlinked)) { assert.ok(!/BarManager =/.test(apply(DFM, unlinked.dfmEdits))); }
});

test('deleting the bar manager unlinks the dock controls that pointed to it', () => {
    const r = deleteEdits(PAS, DFM, ['bmBars'], 'TF');
    assert.ok(!('error' in r));
    if ('error' in r) { return; }
    const out = apply(DFM, r.dfmEdits);
    assert.ok(!/bmBars/.test(out), 'the manager and the BarManager link are gone');
    assert.ok(/object dxBarDockControl1/.test(out), 'the dock control stays');
});
