import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits } from '../services/DelphiForm';
import { findNode, parseDfmTree } from '../services/DelphiLayout';
import { checkForm } from '../services/DelphiCheck';
import {
    DNode, addEdits, buildDesignModel, cssColor, deleteEdits, fromDfmString, nodeAtLine, rectEdits, renameEdits, reparentEdits, setPropertyEdits, toDfmString,
} from '../services/DesignerModel';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(dir, 'ComplexForm.dfm'), 'utf8');
const pas = fs.readFileSync(path.join(dir, 'ComplexForm.pas'), 'utf8');
const model = buildDesignModel(dfm)!;
const find = (n: DNode, name: string): DNode | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));
const rect = (name: string) => { const n = find(model.root, name)!; return [n.x, n.y, n.w, n.h]; };

const ok = <T extends object>(r: T | { error: string }): T => { assert.ok(!('error' in r), 'error' in r ? (r as { error: string }).error : ''); return r as T; };
const editsOf = (r: { dfmEdits: never[]; pasEdits: never[] }) => ({ dfm: applyTextEdits(dfm, r.dfmEdits), pas: applyTextEdits(pas, r.pasEdits) });

test('strings: Pascal literals and #codes, both ways', () => {
    assert.equal(fromDfmString('\'Cr\'#233#233\' d\'\'un\''), 'Créé d\'un');
    assert.equal(fromDfmString('#$E9'), 'é');
    assert.equal(toDfmString('Été'), '#201\'t\'#233');
    assert.equal(toDfmString('Ete'), '\'Ete\'');
    assert.equal(toDfmString('l\'a'), '\'l\'\'a\'');
    assert.equal(toDfmString(''), '\'\'');
    assert.equal(fromDfmString(toDfmString('Façade « test »')), 'Façade « test »');
    assert.equal(cssColor('clBtnFace'), '#f0f0f0');
    assert.equal(cssColor('$00FF8000'), '#0080ff', 'Delphi colours are BGR');
    assert.equal(cssColor('clNone'), undefined);
});

test('layout: the VCL docking order gives the rectangles Delphi stores', () => {
    assert.deepEqual([model.width, model.height], [760, 480]);
    assert.deepEqual(rect('pnlHaut'), [0, 0, 760, 49]);
    assert.deepEqual(rect('pnlBas'), [0, 439, 760, 41]);
    assert.deepEqual(rect('pnlGauche'), [0, 49, 177, 390], 'alLeft takes what alTop / alBottom left');
    assert.deepEqual(rect('splLateral'), [177, 49, 8, 390], 'a TSplitter is alLeft by default');
    assert.deepEqual(rect('pnlCentre'), [185, 49, 575, 390], 'alClient fills the rest');
    // children of a bevelled panel: 1px inset, bottom strip first, client above it — exactly the stored Top / Height
    assert.deepEqual(rect('pnlGaucheBas'), [1, 356, 175, 33]);
    assert.deepEqual(rect('lbxCategories'), [1, 1, 175, 355]);
    assert.deepEqual(rect('btnImporter'), [243, 12, 90, 25], 'free controls keep their Left / Top');
});

test('layout: page control sheets, group boxes, non-visual components, text and colours', () => {
    assert.deepEqual(rect('tsGeneral'), [4, 28, 567, 358]);
    assert.equal(find(model.root, 'pgcDetails')!.activePage, 'tsGeneral');
    assert.equal(find(model.root, 'edtNom')!.depth, 5, 'form > panel > page control > sheet > group box > edit');
    const timer = find(model.root, 'tmrStatut')!;
    assert.deepEqual([timer.nonVisual, timer.x, timer.y], [true, 640, 8]);
    assert.equal(find(model.root, 'btnImporter')!.caption, 'Importer...');
    assert.equal(find(model.root, 'memAdresse')!.lines[0], 'object ligne1', 'multi-line text is decoded, not parsed as components');
    assert.equal(find(model.root, 'lblTitre')!.bold, true);
    assert.equal(find(model.root, 'lblTitre')!.fontSize, 12);
    assert.deepEqual(find(model.root, 'edtRecherche')!.anchors, ['akTop', 'akRight']);
    assert.equal(find(model.root, 'btnEnregistrer')!.events['OnClick'], 'btnEnregistrerClick');
    assert.equal(model.formCaption, 'Gestion des clients');
});

test('move and resize write Left / Top / Width / Height; docked controls only change their docking dimension', () => {
    const moved = editsOf(ok(rectEdits(dfm, [{ name: 'btnNouveau', rect: { left: 200, top: 8 } }])) as never);
    const n = findNode(parseDfmTree(moved.dfm)!, 'btnNouveau')!;
    assert.deepEqual([n.left, n.top, n.width], [200, 8, 75]);

    const resized = editsOf(ok(rectEdits(dfm, [{ name: 'pnlHaut', rect: { left: 50, top: 50, width: 700, height: 60 } }])) as never);
    const p = findNode(parseDfmTree(resized.dfm)!, 'pnlHaut')!;
    assert.deepEqual([p.left, p.top, p.height], [0, 0, 60], 'Left / Top of a docked panel stay; Height changes');
    assert.equal(p.width, 700, 'Width is written too (harmless for alTop, kept in the file)');

    const none = ok(rectEdits(dfm, [{ name: 'btnNouveau', rect: { left: 160, top: 12 } }]));
    assert.equal(none.dfmEdits.length, 0, 'unchanged values produce no edit');
});

test('drag into another container: the block moves with its children and the new relative position', () => {
    const r = ok(reparentEdits(dfm, ['btnFermer'], 'pnlHaut', [{ left: 600, top: 10 }]));
    const out = parseDfmTree(applyTextEdits(dfm, r.dfmEdits))!;
    const moved = findNode(out, 'btnFermer')!;
    assert.equal(moved.parent?.name, 'pnlHaut');
    assert.deepEqual([moved.left, moved.top, moved.props['OnClick']], [600, 10, 'btnFermerClick']);
    assert.ok(!findNode(out, 'pnlBas')!.children.some(c => c.name === 'btnFermer'));
    assert.equal(checkForm(pas, applyTextEdits(dfm, r.dfmEdits)).filter(i => i.severity !== 'info').length, 0);

    const panel = ok(reparentEdits(dfm, ['pnlGaucheBas'], 'pnlCentre', [{ left: 5, top: 5 }]));
    const t = parseDfmTree(applyTextEdits(dfm, panel.dfmEdits))!;
    assert.deepEqual(findNode(t, 'pnlGaucheBas')!.children.map(c => c.name), ['btnAjouter', 'btnSupprimer'], 'children travel with their panel');
    assert.equal(findNode(t, 'btnAjouter')!.depth, 3);
    assert.match((reparentEdits(dfm, ['pnlCentre'], 'pgcDetails', [{ left: 0, top: 0 }]) as { error: string }).error, /Nothing to move/, 'a container cannot enter its own child');
    assert.match((reparentEdits(dfm, ['btnFermer'], 'edtNom', [{ left: 0, top: 0 }]) as { error: string }).error, /cannot contain/);
});

test('delete: object, field and empty handlers go; code in a handler stays', () => {
    const r = ok(deleteEdits(pas, dfm, ['btnAjouter', 'btnNouveau'], 'TComplexForm'));
    const out = editsOf(r as never);
    assert.doesNotMatch(out.dfm, /btnAjouter/);
    assert.doesNotMatch(out.pas, /btnAjouter\b|btnAjouterClick/);
    assert.match(out.pas, /procedure TComplexForm\.btnNouveauClick/, 'its handler has code: kept');
    assert.doesNotMatch(out.pas, /btnNouveau: TButton/);
    const issues = checkForm(out.pas, out.dfm);
    assert.equal(issues.filter(i => i.severity !== 'info').length, 0, 'the form is still consistent');
    assert.ok(issues.some(i => /btnNouveauClick is not linked/.test(i.message)), 'the handler with code is left, reported as orphan');
    assert.match((deleteEdits(pas, dfm, ['ComplexForm'], 'TComplexForm') as { error: string }).error, /Select components/);
});

test('rename: dfm, field, references in code and handlers follow', () => {
    const r = ok(renameEdits(pas, dfm, 'btnFermer', 'btnQuitter'));
    const out = editsOf(r as never);
    assert.match(out.dfm, /object btnQuitter: TButton/);
    assert.match(out.dfm, /OnClick = btnQuitterClick/);
    assert.match(out.pas, /btnQuitter: TButton;/);
    assert.match(out.pas, /procedure TComplexForm\.btnQuitterClick/);
    assert.doesNotMatch(out.pas + out.dfm, /btnFermer/);
    assert.equal(checkForm(out.pas, out.dfm).filter(i => i.severity !== 'info').length, 0);
    assert.match((renameEdits(pas, dfm, 'btnFermer', 'btnEnregistrer') as { error: string }).error, /already/);
});

test('inspector edits are validated and written like Delphi does', () => {
    const edit = (name: string, prop: string, value: unknown) => applyTextEdits(dfm, ok(setPropertyEdits(dfm, name, prop, value)).dfmEdits);
    assert.equal(findNode(parseDfmTree(edit('btnFermer', 'Caption', 'Été'))!, 'btnFermer')!.props['Caption'], '#201\'t\'#233');
    assert.equal(findNode(parseDfmTree(edit('edtNom', 'Text', 'Jean'))!, 'edtNom')!.props['Text'], '\'Jean\'', 'a missing property is inserted');
    assert.equal(findNode(parseDfmTree(edit('btnFermer', 'Anchors', '[akLeft, akBottom]'))!, 'btnFermer')!.props['Anchors'], '[akLeft, akBottom]');
    assert.equal(findNode(parseDfmTree(edit('btnFermer', 'Anchors', '[akLeft, akTop]'))!, 'btnFermer')!.props['Anchors'], undefined, 'default anchors are not written');
    assert.equal(findNode(parseDfmTree(edit('pnlHaut', 'Align', 'alNone'))!, 'pnlHaut')!.align, undefined);
    assert.equal(findNode(parseDfmTree(edit('btnFermer', 'Enabled', false))!, 'btnFermer')!.props['Enabled'], 'False');
    assert.match((setPropertyEdits(dfm, 'btnFermer', 'Left', 'abc') as { error: string }).error, /whole number/);
    assert.match((setPropertyEdits(dfm, 'btnFermer', 'OnClick', 'x') as { error: string }).error, /cannot be edited/);
    assert.match((setPropertyEdits(dfm, 'btnFermer', 'Align', 'alWhatever') as { error: string }).error, /Unknown Align/);
});

test('add from the palette: exact position, chosen size, inside the container under the pointer', () => {
    const r = ok(addEdits(pas, dfm, { className: 'TButton', parentName: 'pnlBas', left: 300, top: 6, width: 90, height: 28 }));
    assert.equal(r.name, 'Button1');
    const out = editsOf(r as never);
    const n = findNode(parseDfmTree(out.dfm)!, 'Button1')!;
    assert.deepEqual([n.parent?.name, n.left, n.top, n.width, n.height], ['pnlBas', 300, 6, 90, 28]);
    assert.match(out.pas, /Button1: TButton;/);
    const onLeaf = ok(addEdits(pas, dfm, { className: 'TEdit', parentName: 'btnFermer', left: 1, top: 1 }));
    assert.equal(findNode(parseDfmTree(applyTextEdits(dfm, onLeaf.dfmEdits))!, onLeaf.name!)!.parent?.name, 'pnlBas', 'dropped on a leaf: goes into its container');
    const third = ok(addEdits(pas, dfm, { className: 'TcxCurrencyEdit', left: 10, top: 10, unit: 'cxCurrencyEdit' }));
    assert.match(applyTextEdits(pas, third.pasEdits), /cxCurrencyEdit/);
});

test('editor ⇄ designer: the component at a .dfm line', () => {
    const line = dfm.split('\n').findIndex(l => l.includes('object btnImporter'));
    assert.equal(nodeAtLine(dfm, line + 3), 'btnImporter');
    assert.equal(nodeAtLine(dfm, 2), undefined, 'form properties belong to no component');
});
