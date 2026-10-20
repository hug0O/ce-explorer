import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { TextEdit, applyTextEdits, normalizeEdits } from '../services/DelphiForm';
import { parseDfmTree } from '../services/DelphiLayout';
import { checkForm } from '../services/DelphiCheck';
import { copyComponents } from '../services/DelphiClip';
import {
    DNode, addEdits, buildDesignModel, designPos, hasGeometry, isNonVisualClass, isPart, pasteEdits, rectEdits, reparentEdits, setPropertyEdits, verifyEdit,
} from '../services/DesignerModel';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(dir, 'NonVisualForm.dfm'), 'utf8');
const pas = fs.readFileSync(path.join(dir, 'NonVisualForm.pas'), 'utf8');

function find(n: DNode, name: string): DNode | undefined {
    if (n.name === name) { return n; }
    for (const c of n.children) { const hit = find(c, name); if (hit) { return hit; } }
    return undefined;
}
const flat = (n: DNode): DNode[] => [n, ...n.children.flatMap(flat)];
const apply = (text: string, edits: TextEdit[]): string => applyTextEdits(text, (normalizeEdits(edits) as { edits: TextEdit[] }).edits);

test('the fixture is a consistent form', () => {
    assert.deepEqual(checkForm(pas, dfm).filter(i => i.severity !== 'info'), []);
});

test('every component of the .dfm is loaded: those with no position are not dropped', () => {
    const model = buildDesignModel(dfm)!;
    const names = flat(model.root).slice(1).map(n => n.name).sort();
    const written = [...dfm.matchAll(/^\s+object\s+(\w+)\s*:/gm)].map(m => m[1]).sort();
    assert.deepEqual(names, written, 'nothing of the .dfm is missing from the model');
    for (const n of ['UniConnection1', 'UniQuery1', 'DataSource1', 'cxStyleRepository1', 'cxEditRepository1', 'cxLookAndFeelController1', 'cxImageList1', 'tmrStatut']) {
        const d = find(model.root, n)!;
        assert.ok(d.nonVisual, n + ' is a non-visual component');
        assert.equal(d.w, 28, n + ' is drawn as an icon');
    }
});

test('a component with no position is drawn in a tray along the bottom edge, so it can be seen and moved', () => {
    const model = buildDesignModel(dfm)!;
    const tray = ['UniConnection1', 'UniQuery1', 'DataSource1'].map(n => find(model.root, n)!);
    assert.ok(tray.every(d => d.note && /gives it no position/.test(d.note)), 'with a note that says why');
    assert.ok(tray.every(d => d.y > model.height - 60 && d.y + 28 <= model.height && d.x >= 0 && d.x + 28 <= model.width), 'inside the form, at its bottom');
    assert.equal(new Set(tray.map(d => d.x + ',' + d.y)).size, tray.length, 'each in its own place');
    const inside = find(model.root, 'cxEditRepository1')!;
    assert.deepEqual([inside.x, inside.y, inside.note], [440, 248, undefined], 'one that has a place keeps it');
});

test('a component placed outside the form is brought into the tray, with its real position in the note', () => {
    const timer = find(buildDesignModel(dfm)!.root, 'tmrStatut')!;
    assert.match(timer.note!, /Left = 1200, Top = 900: outside the form/);
    assert.ok(timer.x < 520 && timer.y < 300);
    assert.equal(timer.props['Left'], '1200', 'the .dfm still says where it really is');
});

test('DesignInfo is the place of a component: Left in the low word, Top in the high word', () => {
    const root = parseDfmTree(dfm)!;
    const list = root.children.find(c => c.name === 'cxImageList1')!;
    assert.deepEqual(designPos(list), { left: 104, top: 96 });
    const model = buildDesignModel(dfm)!;
    const d = find(model.root, 'cxImageList1')!;
    assert.deepEqual([d.x, d.y, d.nonVisual], [104, 96, true], 'an image list has a Width and a Height and is still not a control');
    assert.ok(hasGeometry(list) && !hasGeometry(root.children.find(c => c.name === 'UniQuery1')!));
});

test('moving a component whose place is DesignInfo rewrites DesignInfo, not a Left / Top beside it', () => {
    const r = rectEdits(dfm, [{ name: 'cxImageList1', rect: { left: 200, top: 120 } }]);
    assert.ok(!('error' in r));
    const out = apply(dfm, (r as { dfmEdits: TextEdit[] }).dfmEdits);
    const list = parseDfmTree(out)!.children.find(c => c.name === 'cxImageList1')!;
    assert.equal(list.props['DesignInfo'], String((120 << 16) | 200));
    assert.equal(list.props['Left'], undefined, 'no Left written next to it');
    assert.deepEqual(designPos(list), { left: 200, top: 120 });
    assert.equal(verifyEdit(dfm, out, { touched: ['cxImageList1'], props: ['Left', 'Top', 'DesignInfo'] }), undefined);

    const inspector = setPropertyEdits(dfm, 'cxImageList1', 'Left', 150);
    const out2 = apply(dfm, (inspector as { dfmEdits: TextEdit[] }).dfmEdits);
    assert.deepEqual(designPos(parseDfmTree(out2)!.children.find(c => c.name === 'cxImageList1')!), { left: 150, top: 96 }, 'the Top it had is kept');
});

test('moving a component of the tray writes its first position', () => {
    const r = rectEdits(dfm, [{ name: 'UniQuery1', rect: { left: 60, top: 250 } }]);
    const out = apply(dfm, (r as { dfmEdits: TextEdit[] }).dfmEdits);
    const q = parseDfmTree(out)!.children.find(c => c.name === 'UniQuery1')!;
    assert.deepEqual([q.left, q.top], [60, 250]);
    assert.equal(find(buildDesignModel(out)!.root, 'UniQuery1')!.note, undefined, 'it has a place now: it leaves the tray');
});

test('parts with no place of their own are listed under their parent and never painted or moved', () => {
    const model = buildDesignModel(dfm)!;
    const style = find(model.root, 'cxStyle1')!;
    assert.ok(style.fixed && style.structural && !style.nonVisual);
    assert.equal(flat(find(model.root, 'cxStyleRepository1')!).length, 3, 'the repository and its two styles');
    for (const n of ['dxLayoutControl1Group_Root', 'dxLayoutControl1Item1', 'cxEditRepository1TextItem1', 'UniQuery1ID']) { assert.ok(find(model.root, n)!.structural, n); }
    assert.ok(!find(model.root, 'cxStyleRepository1')!.container, 'a repository holds styles, not controls');
    assert.ok(find(model.root, 'dxLayoutControl1')!.container && !find(model.root, 'edtNom')!.structural, 'the controls of a layout control are drawn as usual');
    const root = parseDfmTree(dfm)!;
    const part = root.children.find(c => c.name === 'cxStyleRepository1')!.children[0];
    assert.ok(isPart(part));
    const moved = reparentEdits(dfm, ['cxStyle1'], 'dxLayoutControl1', [{ left: 4, top: 4 }]);
    assert.ok('error' in moved && /part of cxStyleRepository1/.test(moved.error));
});

test('a non-visual component lives on the form: not in a panel, and nothing is pasted into it', () => {
    const into = reparentEdits(dfm, ['UniQuery1'], 'dxLayoutControl1', [{ left: 4, top: 4 }]);
    assert.ok('error' in into && /not a control/.test(into.error));
    const onForm = reparentEdits(dfm, ['UniQuery1'], 'NonVisualForm', [{ left: 4, top: 4 }]);
    assert.ok(!('error' in onForm), 'the form itself is fine');
    const target = reparentEdits(dfm, ['btnOuvrir'], 'cxStyleRepository1', [{ left: 4, top: 4 }]);
    assert.ok('error' in target && /cannot contain/.test(target.error), 'a repository is no container');

    const copied = copyComponents(pas, dfm, ['UniConnection1'], () => '');
    assert.ok(!('error' in copied));
    const pasted = pasteEdits(pas, dfm, (copied as { payload: never }).payload, 'dxLayoutControl1');
    assert.ok(!('error' in pasted));
    const out = apply(dfm, (pasted as { dfmEdits: TextEdit[] }).dfmEdits);
    const name = (pasted as { roots: string[] }).roots[0];
    assert.equal(parseDfmTree(out)!.children.find(c => c.name === name)?.name, name, 'a connection pasted with a layout control selected lands on the form');

    const added = addEdits(pas, dfm, { className: 'TUniQuery', parentName: 'dxLayoutControl1', left: 10, top: 10 });
    assert.ok(!('error' in added));
    const out2 = parseDfmTree(apply(dfm, (added as { dfmEdits: TextEdit[] }).dfmEdits))!;
    assert.ok(out2.children.some(c => c.className === 'TUniQuery' && c.name !== 'UniQuery1'), 'a query dropped on a panel goes on the form');
});

test('which classes are components with no visual presence', () => {
    for (const c of ['TUniQuery', 'TFDMemTable', 'TcxImageList', 'TImageList', 'TdxBarManager', 'TcxEditRepository', 'TTimer', 'TdxSkinController', 'TActionList', 'TApplicationEvents', 'TOpenDialog', 'TDataSource', 'TUniConnection']) {
        assert.ok(isNonVisualClass(c), c);
    }
    for (const c of ['TButton', 'TcxGrid', 'TPanel', 'TdxLayoutControl', 'TcxTextEdit', 'TcxPageControl', 'TLabel']) { assert.ok(!isNonVisualClass(c), c); }
});

test('a data module has no frame to take off its size', () => {
    const dm = ['object DM: TDM', '  OldCreateOrder = False', '  Height = 150', '  Width = 215', '  object Timer1: TTimer', '    Left = 150', '    Top = 100', '  end', 'end', ''].join('\n');
    const m = buildDesignModel(dm)!;
    assert.deepEqual([m.width, m.height], [215, 150]);
    assert.equal(find(m.root, 'Timer1')!.note, undefined, 'a timer at 150, 100 is inside the module');
    const form = buildDesignModel(['object F: TF', '  Caption = \'x\'', '  ClientHeight = 150', '  ClientWidth = 215', 'end', ''].join('\n'))!;
    assert.deepEqual([form.width, form.height], [215, 150]);
});
