import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits } from '../services/DelphiForm';
import { findNode, parseDfmTree } from '../services/DelphiLayout';
import {
    DNode, buildDesignModel, deleteEdits, namesWithin, rectEdits, renameEdits, reparentEdits, setPropertyEdits, verifyEdit,
} from '../services/DesignerModel';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');

/** A form full of things the designer does not know: it must draw it, and never alter it. */
const EXOTIC = [
    'inherited FormX: TFormX',
    "  Caption = 'H'#233'rit'#233",
    '  ClientHeight = 300',
    '  ClientWidth = 420',
    '  object lblWeird: TMyCustomLabel',
    '    Left = 8',
    '    Top = 8',
    '    Width = 100',
    '    Height = 17',
    '    Caption = \'object fake: TFoo\'',
    '    SomeBlob = {',
    '      0954504630',
    '      070D}',
    '    Columns = <',
    '      item',
    '        Caption = \'end\'',
    '      end>',
    '    Lines.Strings = (',
    '      \'end\'',
    '      \'object nested: TNope\')',
    '  end',
    '  object tmr: TUnknownNonVisual',
    '    Left = 380',
    '    Top = 8',
    '  end',
    '  inline Frame1: TMyFrame',
    '    Left = 8',
    '    Top = 40',
    '    Width = 200',
    '    Height = 100',
    '    TabOrder = 0',
    '    inherited Edit1: TEdit',
    '      Left = 4',
    '      Top = 4',
    '    end',
    '  end',
    '  object panelA: TMysteryPanelXYZ',
    '    Left = 220',
    '    Top = 40',
    '    Width = 180',
    '    Height = 100',
    '    ExoticProp = [a, b, c]',
    '    object inner: TWhatIsThis',
    '      Left = 10',
    '      Top = 10',
    '      Width = 50',
    '      Height = 20',
    '    end',
    '  end',
    '  object cxGrid1: TcxGrid',
    '    Left = 8',
    '    Top = 150',
    '    Width = 392',
    '    Height = 140',
    '    TabOrder = 3',
    '    object cxGrid1DBTableView1: TcxGridDBTableView',
    '      Navigator.Buttons.CustomButtons = <>',
    '    end',
    '    object cxGrid1Level1: TcxGridLevel',
    '      GridView = cxGrid1DBTableView1',
    '    end',
    '  end',
    'end',
    '',
].join('\n');

const find = (n: DNode, name: string): DNode | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));
const lines = (s: string) => s.split('\n');
const changedLines = (before: string, after: string): number[] => {
    const a = lines(before);
    const b = lines(after);
    assert.equal(a.length, b.length, 'same number of lines');
    return a.map((l, i) => (l === b[i] ? -1 : i)).filter(i => i >= 0);
};

test('an exotic form is drawn without throwing: unknown classes, inline / inherited, blobs, collections', () => {
    const model = buildDesignModel(EXOTIC)!;
    assert.ok(model, 'a model is built');
    assert.deepEqual(model.root.children.map(c => c.name), ['lblWeird', 'tmr', 'Frame1', 'panelA', 'cxGrid1'], 'grid views / levels are not controls');
    assert.deepEqual([find(model.root, 'lblWeird')!.x, find(model.root, 'lblWeird')!.w], [8, 100]);
    assert.equal(find(model.root, 'tmr')!.nonVisual, true, 'an unknown component without a size is an icon');
    assert.equal(find(model.root, 'Edit1')!.depth, 2, 'inherited component inside an inline frame');
    assert.equal(find(model.root, 'inner')!.cls, 'TWhatIsThis');
    assert.equal(find(model.root, 'lblWeird')!.lines.length, 2);
    assert.equal(find(model.root, 'lblWeird')!.caption, 'object fake: TFoo', 'text that looks like DFM is only text');
    assert.equal(model.formCaption, 'Hérité');
});

test('garbage never throws: binary, empty and truncated files give no model', () => {
    assert.equal(buildDesignModel(''), undefined);
    assert.equal(buildDesignModel('TPF0\u0000\u0007TForm1'), undefined);
    assert.doesNotThrow(() => buildDesignModel('object A: TA\n  Left = \nobject'));
    assert.doesNotThrow(() => buildDesignModel('object A: TA\n  Foo = (\n  \'x\''));
});

test('moving an unknown component changes its Left / Top lines and nothing else', () => {
    const r = rectEdits(EXOTIC, [{ name: 'lblWeird', rect: { left: 40, top: 12 } }]);
    assert.ok(!('error' in r));
    const out = applyTextEdits(EXOTIC, (r as { dfmEdits: never[] }).dfmEdits);
    const changed = changedLines(EXOTIC, out);
    assert.deepEqual(changed.map(i => lines(EXOTIC)[i].trim()), ['Left = 8', 'Top = 8']);
    assert.equal(verifyEdit(EXOTIC, out, { touched: ['lblWeird'], props: ['Left', 'Top', 'Width', 'Height'] }), undefined);
});

test('resizing a panel of an unknown class: its exotic properties and children are untouched', () => {
    const r = rectEdits(EXOTIC, [{ name: 'panelA', rect: { width: 200, height: 120 } }]);
    const out = applyTextEdits(EXOTIC, (r as { dfmEdits: never[] }).dfmEdits);
    assert.deepEqual(changedLines(EXOTIC, out).map(i => lines(EXOTIC)[i].trim()), ['Width = 180', 'Height = 100']);
    const p = findNode(parseDfmTree(out)!, 'panelA')!;
    assert.equal(p.props['ExoticProp'], '[a, b, c]');
    assert.equal(p.children[0].name, 'inner');
});

test('the integrity check refuses an edit that would alter something else', () => {
    const move = applyTextEdits(EXOTIC, (rectEdits(EXOTIC, [{ name: 'lblWeird', rect: { left: 40 } }]) as { dfmEdits: never[] }).dfmEdits);
    const expectMove = { touched: ['lblWeird'], props: ['Left', 'Top'] };
    assert.equal(verifyEdit(EXOTIC, move, expectMove), undefined);
    assert.match(verifyEdit(EXOTIC, move.replace('ExoticProp = [a, b, c]', 'ExoticProp = [a]'), expectMove)!, /panelA\.ExoticProp would change/);
    assert.match(verifyEdit(EXOTIC, move.replace('Caption = \'object fake: TFoo\'', 'Caption = \'x\''), expectMove)!, /lblWeird\.Caption would change/);
    assert.match(verifyEdit(EXOTIC, move.replace(/\nend\n$/, '\n  object extra: TFoo\n  end\nend\n'), expectMove)!, /extra would appear/);
    assert.match(verifyEdit(EXOTIC, 'TPF0 binary', expectMove)!, /not a readable/);
});

test('drag into an unknown container carries the dragged block over byte for byte (apart from position)', () => {
    const r = reparentEdits(EXOTIC, ['lblWeird'], 'panelA', [{ left: 5, top: 6 }]);
    assert.ok(!('error' in r));
    const out = applyTextEdits(EXOTIC, (r as { dfmEdits: never[] }).dfmEdits);
    const t = parseDfmTree(out)!;
    const moved = findNode(t, 'lblWeird')!;
    assert.equal(moved.parent?.name, 'panelA');
    assert.deepEqual([moved.left, moved.top], [5, 6]);
    for (const k of ['Caption', 'SomeBlob', 'Columns', 'Lines.Strings']) {
        assert.equal(moved.props[k], parseDfmTree(EXOTIC)!.children[0].props[k], k);
    }
    assert.ok(out.includes('      0954504630\n') || out.includes('        0954504630\n'), 'the hex blob is still there, only re-indented');
    assert.equal(verifyEdit(EXOTIC, out, { touched: ['lblWeird'], props: ['Left', 'Top'], reparented: ['lblWeird'] }), undefined);
});

test('delete removes exactly the component block, hex data and nested strings included', () => {
    const r = deleteEdits('unit U;\ninterface\ntype\n  TFormX = class(TForm)\n    lblWeird: TMyCustomLabel;\n  end;\nimplementation\nend.\n', EXOTIC, ['lblWeird'], 'TFormX');
    assert.ok(!('error' in r));
    const out = applyTextEdits(EXOTIC, (r as { dfmEdits: never[] }).dfmEdits);
    assert.equal(out, EXOTIC.replace(/ {2}object lblWeird[\s\S]*?\n {2}end\n {2}object tmr/, '  object tmr'));
    assert.equal(verifyEdit(EXOTIC, out, { removed: namesWithin(EXOTIC, 'lblWeird') }), undefined);
    assert.match(verifyEdit(EXOTIC, out, { removed: ['someoneElse'] })!, /lblWeird would disappear/);
});

test('rename and inspector edits leave strings that merely look like names alone', () => {
    const r = renameEdits('unit U;\nend.\n', EXOTIC, 'Edit1', 'edtMain');
    assert.ok(!('error' in r));
    const out = applyTextEdits(EXOTIC, (r as { dfmEdits: never[] }).dfmEdits);
    assert.match(out, /inherited edtMain: TEdit/);
    assert.ok(out.includes('Caption = \'object fake: TFoo\''));
    const cap = setPropertyEdits(EXOTIC, 'lblWeird', 'Caption', 'Été');
    assert.deepEqual(changedLines(EXOTIC, applyTextEdits(EXOTIC, (cap as { dfmEdits: never[] }).dfmEdits)).length, 1);
    assert.match((setPropertyEdits(EXOTIC, 'panelA', 'ExoticProp', 'x') as { error: string }).error, /cannot be edited/);
});

test('real third-party fixture: DevExpress and TMS forms are drawn, pages and radio groups understood', () => {
    const dfm = fs.readFileSync(path.join(dir, 'ThirdPartyForm.dfm'), 'utf8');
    const model = buildDesignModel(dfm)!;
    const pc = find(model.root, 'cxPageControl1')!;
    assert.equal(pc.family, 'devexpress');
    assert.equal(pc.activePage, 'cxTabSheet1', 'Properties.ActivePage');
    assert.deepEqual(pc.children.map(c => c.name), ['cxTabSheet1', 'cxTabSheet2']);
    assert.deepEqual([find(model.root, 'cxTabSheet1')!.x, find(model.root, 'cxTabSheet1')!.y], [4, 28]);
    assert.deepEqual(find(model.root, 'cxRadioGroup1')!.lines, ['Particulier', 'Societe', 'Association'], 'collection captions');
    assert.deepEqual(find(model.root, 'cxComboBox1')!.lines, ['Paris', 'Lyon', 'Nantes']);
    const edit = find(model.root, 'cxTextEdit1')!;
    assert.deepEqual([edit.w, edit.h], [177, 21], 'Height omitted in the .dfm: the catalog default');
    assert.equal(edit.events['Properties.OnChange'], 'cxTextEdit1PropertiesChange');
    const label = find(model.root, 'cxLabel1')!;
    assert.equal(label.nonVisual, false, 'a TcxLabel without Width / Height is a visible auto-sized label');
    assert.equal(find(model.root, 'cxLookAndFeelController1')!.nonVisual, true);
    assert.equal(find(model.root, 'AdvFormStyler1')!.nonVisual, true);
    assert.equal(find(model.root, 'AdvOfficePager1')!.family, 'tms');
    assert.equal(find(model.root, 'AdvOfficePage1')!.x, 1, 'TMS pages follow the pager area');
    assert.equal(find(model.root, 'AdvStringGrid1')!.props['ColCount'], '5');
    assert.equal(find(model.root, 'cxGrid1')!.children.length, 0, 'the grid views are not drawn as controls');
});
