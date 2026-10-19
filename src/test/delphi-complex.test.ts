import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits } from '../services/DelphiForm';
import { findNode, listContainers, parseDfmTree, planAddComponent } from '../services/DelphiLayout';
import { planAddEvent } from '../services/DelphiEvents';
import { planDfmDelete, planDfmRename } from '../services/DelphiSync';
import { learnFromDfmTexts, parseCustomComponents, resolveWithLibrary } from '../services/DelphiLibrary';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(dir, 'golden', 'ComplexForm.dfm'), 'utf8');
const pas = fs.readFileSync(path.join(dir, 'golden', 'ComplexForm.pas'), 'utf8');
const root = parseDfmTree(dfm)!;

test('complex form: deep hierarchy with docked panels, page control, third-party controls and collections', () => {
    assert.equal(root.className, 'TComplexForm');
    assert.deepEqual(root.children.map(c => c.name), ['pnlHaut', 'pnlGauche', 'splLateral', 'pnlCentre', 'pnlBas', 'tmrStatut']);
    assert.equal(findNode(root, 'edtNom')!.parent?.name, 'grpIdentite');
    assert.equal(findNode(root, 'grpIdentite')!.parent?.name, 'tsGeneral');
    assert.equal(findNode(root, 'tsGeneral')!.parent?.name, 'pgcDetails');
    assert.equal(findNode(root, 'pnlCentre')!.align, 'alClient');
    assert.equal(findNode(root, 'btnImporter')!.className, 'TcxButton');
    assert.deepEqual(findNode(root, 'tsGeneral')!.children.map(c => c.name), ['grpIdentite', 'grpAdresse', 'lvwContacts']);
    assert.equal(findNode(root, 'lvwContacts')!.props['TabOrder'], '2', 'properties after a Columns = < item … > collection');
    assert.equal(findNode(root, 'cxGrid1DBTableView1')!.parent?.name, 'cxGrid1');
    assert.equal(findNode(root, 'cxGrid1Level1')!.props['GridView'], 'cxGrid1DBTableView1');
});

test('containers include panels, page sheets, group boxes and third-party grids with children', () => {
    const names = listContainers(root).map(c => c.node.name);
    for (const n of ['ComplexForm', 'pnlHaut', 'pnlGauche', 'pnlGaucheBas', 'pnlCentre', 'pgcDetails', 'tsGeneral', 'grpIdentite', 'grpAdresse', 'tsHistorique', 'cxGrid1', 'pnlBas']) {
        assert.ok(names.includes(n), n);
    }
});

test('add a button left of btnEnregistrer inside the bottom panel, with a 12px gap, keeping the right-hand alignment', () => {
    const p = planAddComponent(pas, dfm, { className: 'TButton', name: 'btnAide', eventName: 'OnClick', refName: 'btnEnregistrer', side: 'left', gap: 12 });
    assert.ok(!('error' in p));
    const out = applyTextEdits(dfm, [(p as { dfmEdit: never }).dfmEdit]);
    const added = findNode(parseDfmTree(out)!, 'btnAide')!;
    assert.equal(added.parent?.name, 'pnlBas');
    assert.equal(added.left, 580 - 75 - 12);
    assert.equal(added.top, 8, 'same height as the reference: same top');
});

test('add below an edit inside a group box under a tab sheet, aligned on its left edge', () => {
    const p = planAddComponent(pas, dfm, { className: 'TEdit', name: 'edtVille', refName: 'edtPrenom', side: 'below', gap: 5 });
    const out = applyTextEdits(dfm, [(p as { dfmEdit: never }).dfmEdit]);
    const added = findNode(parseDfmTree(out)!, 'edtVille')!;
    assert.equal(added.parent?.name, 'grpIdentite');
    assert.deepEqual([added.left, added.top], [96, 58 + 23 + 5]);
    assert.match(out, /\n {10}object edtVille: TEdit/, 'indented as a child of a child of a child…');
});

test('a docked panel as reference continues the dock stack (alTop below pnlHaut)', () => {
    const p = planAddComponent(pas, dfm, { className: 'TPanel', name: 'pnlFiltre', refName: 'pnlHaut', side: 'below' });
    const out = applyTextEdits(dfm, [(p as { dfmEdit: never }).dfmEdit]);
    const added = findNode(parseDfmTree(out)!, 'pnlFiltre')!;
    assert.equal(added.align, 'alTop');
    assert.equal(added.top, 49);
});

test('third-party class: the definition is learned from the project, the unit from the setting', () => {
    const learned = learnFromDfmTexts('TcxButton', [dfm])!;
    assert.deepEqual([learned.width, learned.height, learned.tabOrder, learned.instances], [90, 25, true, 1]);
    assert.deepEqual(learned.events, ['OnClick']);
    assert.deepEqual(learned.props, ["Caption = '%NAME%'"]);

    const custom = parseCustomComponents([
        { className: 'TcxButton', unit: 'cxButtons', events: ['OnClick', 'OnEnter'] },
        { className: 'bad name' }, 'junk', { className: 'TAdvEdit', width: 'wide' },
    ]);
    assert.deepEqual(custom.map(c => c.className), ['TcxButton', 'TAdvEdit']);

    const def = resolveWithLibrary('TcxButton', undefined, custom, learned);
    assert.equal(def.unit, 'cxButtons');
    assert.deepEqual(def.events.map(e => e.name), ['OnClick', 'OnEnter']);
    const viaProject = resolveWithLibrary('TcxButton', undefined, [], learned, 'cxButtons');
    assert.equal(viaProject.width, 90);
    assert.equal(resolveWithLibrary('TFoo', undefined, [], undefined).unit, '', 'unknown class, unknown unit: uses left alone');
    assert.equal(resolveWithLibrary('TFoo', 'Vcl.Foo', [], undefined).unit, 'Foo');

    const p = planAddComponent(pas, dfm, { className: 'TcxButton', name: 'btnExport', eventName: 'OnClick', refName: 'btnImporter', side: 'right', def: viaProject });
    assert.ok(!('error' in p));
    const outPas = applyTextEdits(pas, (p as { pasEdits: never[] }).pasEdits);
    assert.match(outPas, /btnExport: TcxButton;/);
    assert.equal((outPas.match(/cxButtons/g) ?? []).length, 1, 'cxButtons already in uses, not duplicated, never prefixed with Vcl.');
    assert.doesNotMatch(outPas, /Vcl\.cx/);
});

test('third-party unit is appended to uses without the Vcl. scope', () => {
    const def = resolveWithLibrary('TAdvEdit', 'AdvEdit', [], undefined);
    const p = planAddComponent(pas, dfm, { className: 'TAdvEdit', name: 'edtAdv', side: 'auto', def });
    assert.match(applyTextEdits(pas, (p as { pasEdits: never[] }).pasEdits), /cxGridDBTableView, AdvEdit;/);
});

test('events on third-party controls and on the form of the complex example', () => {
    const p = planAddEvent(pas, dfm, { componentName: 'cxGrid1', eventName: 'OnDblClick' });
    assert.ok(!('error' in p) && p.handler === 'TComplexForm.cxGrid1DblClick');
    const shown = planAddEvent(pas, dfm, { componentName: 'ComplexForm', eventName: 'OnShow' });
    assert.ok(!('error' in shown));
    assert.match(applyTextEdits(dfm, [(shown as { dfmEdit: never }).dfmEdit]), /TextHeight = 15\r?\n {2}OnShow = ComplexFormShow/);
});

test('rename / delete keep the complex form consistent', () => {
    const rename = planDfmRename(pas, dfm, 'btnImporter', 'btnImportClient') as { dfmEdits: never[]; pasEdits: never[]; handlers: unknown[] };
    const outDfm = applyTextEdits(dfm, rename.dfmEdits);
    assert.match(outDfm, /object btnImportClient: TcxButton[\s\S]*OnClick = btnImportClientClick/);
    assert.match(applyTextEdits(pas, rename.pasEdits), /procedure TComplexForm\.btnImportClientClick/);

    const del = planDfmDelete(pas, dfm, 'pnlGaucheBas', 'TComplexForm')!;
    assert.deepEqual(del.removedHandlers.sort(), ['btnAjouterClick', 'btnSupprimerClick']);
    const outPas = applyTextEdits(pas, del.pasEdits);
    assert.doesNotMatch(outPas, /btnAjouter|btnSupprimer/);
    assert.match(outPas, /btnNouveauClick/, 'other handlers untouched');
    assert.doesNotMatch(applyTextEdits(dfm, del.dfmEdits), /btnAjouter|pnlGaucheBas/);
});
