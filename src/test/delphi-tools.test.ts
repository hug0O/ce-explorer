import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits } from '../services/DelphiForm';
import { findNode, parseDfmTree } from '../services/DelphiLayout';
import { ALIGN_OPS, alignComponents, applyAnchorMode, planTabOrder } from '../services/DelphiAlign';
import { checkForm, fixIssue } from '../services/DelphiCheck';
import { copyComponents, pasteComponents, parseClip, serializeClip } from '../services/DelphiClip';
import { fieldListFromMembers, generateFormFields, parseFieldList, planChangeClass } from '../services/DelphiGen';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const read = (f: string) => fs.readFileSync(path.join(dir, f), 'utf8');
const cDfm = read('ComplexForm.dfm');
const cPas = read('ComplexForm.pas');
const lDfm = read('LayoutForm.dfm');
const lPas = read('LayoutForm.pas');
const trees = new Map<string, ReturnType<typeof parseDfmTree>>();
const tree = (text: string) => { if (!trees.has(text)) { trees.set(text, parseDfmTree(text)); } return trees.get(text)!; };
const nodes = (dfm: string, ...names: string[]) => names.map(n => findNode(tree(dfm), n)!);
const unitOf = (c: string) => ({ TcxButton: 'cxButtons', TButton: 'StdCtrls', TEdit: 'StdCtrls', TPanel: 'ExtCtrls' } as Record<string, string>)[c] ?? '';

/* ───────── align / anchors / tab order ───────── */

test('align like the IDE: edges, centres, sizes, equal spacing', () => {
    const run = (op: Parameters<typeof alignComponents>[2], ...names: string[]) => {
        const r = alignComponents(cDfm, nodes(cDfm, ...names), op);
        assert.ok(!('error' in r), 'error' in r ? r.error : '');
        return tree(applyTextEdits(cDfm, (r as { edits: never[] }).edits));
    };
    assert.equal(findNode(run('right', 'edtNom', 'edtPrenom', 'chkActif'), 'chkActif')!.left, 257 - 97, 'right edges on the right-most');
    const centred = run('centerY', 'lblNom', 'edtNom');
    assert.equal(findNode(centred, 'lblNom')!.top, 30, 'a 15px label centred on a 23px edit');
    assert.equal(findNode(centred, 'edtNom')!.top, 26);
    const spaced = run('spaceV', 'edtNom', 'edtPrenom', 'chkActif');
    assert.equal(findNode(spaced, 'edtNom')!.top, 26, 'first stays');
    assert.equal(findNode(spaced, 'chkActif')!.top, 95, 'last stays');
    assert.equal(findNode(spaced, 'edtPrenom')!.top, 61);
    const same = run('sameWidth', 'btnNouveau', 'btnImporter');
    assert.equal(findNode(same, 'btnNouveau')!.width, 90);
    assert.equal(ALIGN_OPS.length, 11);
});

test('align refuses docked controls, mixed containers and too few components', () => {
    const err = (names: string[], op: Parameters<typeof alignComponents>[2] = 'left') => (alignComponents(cDfm, nodes(cDfm, ...names), op) as { error: string }).error;
    assert.match(err(['pnlHaut', 'pnlBas']), /docked/);
    assert.match(err(['edtNom', 'btnFermer']), /same container/);
    assert.match(err(['edtNom']), /at least 2/);
    assert.match(err(['edtNom', 'edtPrenom'], 'spaceH'), /at least 3/);
});

test('anchors: from position, presets, default removal and docking', () => {
    const panel = findNode(tree(lDfm), 'pnlBoutons')!;
    const fromPos = applyAnchorMode(lDfm, panel, panel.children, 'fromPosition') as { edits: never[]; changed: string[] };
    const out = tree(applyTextEdits(lDfm, fromPos.edits));
    assert.equal(findNode(out, 'btnAnnuler')!.props['Anchors'], '[akTop, akRight]', 'the button 12px from the right edge follows it');
    assert.equal(findNode(out, 'btnOk')!.props['Anchors'], undefined, 'the one in the middle keeps the default anchors');

    const stretch = applyAnchorMode(lDfm, panel, nodes(lDfm, 'edtNom'), 'stretchH') as { edits: never[] };
    assert.equal(findNode(tree(applyTextEdits(lDfm, stretch.edits)), 'edtNom')!.props['Anchors'], '[akLeft, akTop, akRight]');

    const cPanel = findNode(tree(cDfm), 'pnlBas')!;
    const reset = applyAnchorMode(cDfm, cPanel, nodes(cDfm, 'btnFermer'), 'default') as { edits: never[] };
    assert.equal(findNode(tree(applyTextEdits(cDfm, reset.edits)), 'btnFermer')!.props['Anchors'], undefined);

    const dock = applyAnchorMode(lDfm, tree(lDfm), nodes(lDfm, 'pnlBoutons'), 'alClient') as { edits: never[] };
    assert.equal(findNode(tree(applyTextEdits(lDfm, dock.edits)), 'pnlBoutons')!.align, 'alClient');
    const undock = applyAnchorMode(lDfm, tree(lDfm), nodes(lDfm, 'pnlBoutons'), 'alNone') as { edits: never[] };
    assert.equal(findNode(tree(applyTextEdits(lDfm, undock.edits)), 'pnlBoutons')!.align, undefined);
});

test('TabOrder follows the screen: rows top to bottom, then left to right', () => {
    const scrambled = lDfm.replace('TabOrder = 1\n    end\n  end\n  object pnlBoutons', 'TabOrder = 0\n    end\n  end\n  object pnlBoutons')
        .replace(/(object edtNom[\s\S]*?)TabOrder = 0/, '$1TabOrder = 1');
    const panel = findNode(tree(scrambled), 'pnlSaisie')!;
    assert.equal(panel.props['TabOrder'], '0');
    const plan = planTabOrder(scrambled, [panel]) as { edits: never[]; changed: string[] };
    const out = tree(applyTextEdits(scrambled, plan.edits));
    assert.equal(findNode(out, 'edtNom')!.props['TabOrder'], '0');
    assert.equal(findNode(out, 'memNotes')!.props['TabOrder'], '1');
    assert.deepEqual((planTabOrder(lDfm, [findNode(tree(lDfm), 'pnlSaisie')!]) as { changed: string[] }).changed, [], 'already in reading order');
});

/* ───────── checks and clean-up ───────── */

const messages = (pas: string, dfm: string) => checkForm(pas, dfm);

test('check: a healthy form has only informational findings (empty handlers)', () => {
    const issues = messages(cPas, cDfm);
    assert.ok(!issues.some(i => i.severity === 'error' || i.severity === 'warning'), JSON.stringify(issues.filter(i => i.severity !== 'info')));
    assert.ok(issues.some(i => /btnImporterClick.*is empty/.test(i.message)));
});

test('check: missing handler → create it or unlink it', () => {
    const pas = cPas.replace('    procedure btnFermerClick(Sender: TObject);\n', '').replace(/procedure TComplexForm\.btnFermerClick[\s\S]*?end;\n\n/, '');
    const issue = messages(pas, cDfm).find(i => i.category === 'Handlers' && i.severity === 'error')!;
    assert.match(issue.message, /btnFermer\.OnClick points to btnFermerClick/);
    assert.deepEqual(issue.fixes, ['createHandler', 'removeLink']);

    const created = fixIssue(pas, cDfm, issue, 'createHandler') as { pasEdits: never[] };
    const fixedPas = applyTextEdits(pas, created.pasEdits);
    assert.match(fixedPas, /procedure btnFermerClick\(Sender: TObject\);/);
    assert.match(fixedPas, /procedure TComplexForm\.btnFermerClick\(Sender: TObject\);\nbegin\n {2}\nend;/);
    assert.ok(!messages(fixedPas, cDfm).some(i => i.severity === 'error'));

    const unlinked = fixIssue(pas, cDfm, issue, 'removeLink') as { dfmEdits: never[] };
    assert.doesNotMatch(applyTextEdits(cDfm, unlinked.dfmEdits), /btnFermerClick/);
});

test('check: field without component, component with the wrong type, duplicate TabOrder', () => {
    const ghost = cPas.replace('    tmrStatut: TTimer;', '    tmrStatut: TTimer;\n    Ghost: TButton;');
    assert.ok(messages(ghost, cDfm).some(i => i.severity === 'warning' && /Ghost.*nil at runtime/.test(i.message)));

    const wrong = cPas.replace('edtNom: TEdit;', 'edtNom: TMemo;');
    assert.ok(messages(wrong, cDfm).some(i => i.severity === 'error' && /edtNom is a TEdit in the \.dfm but declared as TMemo/.test(i.message)));

    const dup = cDfm.replace(/(object btnFermer[\s\S]*?)TabOrder = 1/, '$1TabOrder = 0');
    const issue = messages(cPas, dup).find(i => i.category === 'TabOrder')!;
    assert.match(issue.message, /shared by btnEnregistrer, btnFermer in pnlBas/);
    const fix = fixIssue(cPas, dup, issue, 'tabOrder') as { dfmEdits: never[] };
    assert.ok(!messages(cPas, applyTextEdits(dup, fix.dfmEdits)).some(i => i.category === 'TabOrder'));
});

test('check: orphan handlers are removed only when empty; empty linked handlers can be unlinked and deleted', () => {
    const orphan = cPas.replace('  private', '    procedure Unused(Sender: TObject);\n  private').replace('end.', 'procedure TComplexForm.Unused(Sender: TObject);\nbegin\nend;\n\nend.');
    const issue = messages(orphan, cDfm).find(i => /Unused is not linked/.test(i.message))!;
    assert.deepEqual(issue.fixes, ['removeOrphan']);
    const fixed = applyTextEdits(orphan, (fixIssue(orphan, cDfm, issue, 'removeOrphan') as { pasEdits: never[] }).pasEdits);
    assert.doesNotMatch(fixed, /Unused/);

    const empty = messages(cPas, cDfm).find(i => /lbxCategoriesClick.*is empty/.test(i.message))!;
    const r = fixIssue(cPas, cDfm, empty, 'removeEmptyHandler') as { pasEdits: never[]; dfmEdits: never[] };
    assert.doesNotMatch(applyTextEdits(cPas, r.pasEdits), /lbxCategoriesClick/);
    assert.doesNotMatch(applyTextEdits(cDfm, r.dfmEdits), /lbxCategoriesClick/);
    const withCode = messages(cPas, cDfm).find(i => /edtNomChange/.test(i.message));
    assert.equal(withCode, undefined, 'a handler with code is not reported');
    assert.match((fixIssue(cPas, cDfm, { ...empty, handler: 'edtNomChange' }, 'removeEmptyHandler') as { error: string }).error, /contains code/);
});

test('check: controls beyond their container and overlaps', () => {
    const beyond = messages(lPas, lDfm.replace('Left = 152\n      Top = 8', 'Left = 300\n      Top = 8'));
    assert.ok(beyond.some(i => /btnOk extends beyond pnlBoutons/.test(i.message)));
    const overlap = messages(lPas, lDfm.replace('Left = 152\n      Top = 8', 'Left = 240\n      Top = 8'));
    assert.ok(overlap.some(i => /btnOk and btnAnnuler overlap/.test(i.message)));
    assert.ok(!overlap.some(i => /extends beyond/.test(i.message)));
});

/* ───────── copy / paste ───────── */

test('copy a button with its handler code, paste it in the same form: renamed, shifted, wired', () => {
    const copied = copyComponents(cPas, cDfm, ['btnNouveau'], unitOf) as { payload: Parameters<typeof pasteComponents>[2] };
    assert.deepEqual(copied.payload.components, [{ name: 'btnNouveau', className: 'TButton' }]);
    assert.equal(copied.payload.handlers[0].name, 'btnNouveauClick');
    assert.match(copied.payload.handlers[0].implementation!, /edtNom\.Clear;/);
    const clip = parseClip(serializeClip(copied.payload))!;
    assert.equal(clip.objects[0].split('\n')[0], 'object btnNouveau: TButton', 'stored at depth 0');

    const r = pasteComponents(cPas, cDfm, clip, 'pnlBas') as Exclude<ReturnType<typeof pasteComponents>, { error: string }>;
    assert.deepEqual(r.renamed, [{ from: 'btnNouveau', to: 'btnNouveau1' }]);
    assert.deepEqual(r.createdHandlers, ['btnNouveau1Click']);
    const dfm2 = applyTextEdits(cDfm, [r.dfmEdit]);
    const pasted = findNode(tree(dfm2), 'btnNouveau1')!;
    assert.equal(pasted.parent?.name, 'pnlBas');
    assert.deepEqual([pasted.left, pasted.top], [160 + 16, 12], 'shifted right, but not out of the 41px high panel');
    assert.equal(pasted.props['TabOrder'], '2');
    assert.equal(pasted.props['OnClick'], 'btnNouveau1Click');
    const pas2 = applyTextEdits(cPas, r.pasEdits);
    assert.match(pas2, /btnNouveau1: TButton;/);
    assert.match(pas2, /procedure btnNouveau1Click\(Sender: TObject\);/);
    assert.match(pas2, /procedure TComplexForm\.btnNouveau1Click\(Sender: TObject\);\nbegin\n {2}edtNom\.Clear;/);
    assert.ok(!checkForm(pas2, dfm2).some(i => i.severity === 'error' || i.severity === 'warning'));
});

test('copy a panel with children to another form: subtree, handlers, third-party unit', () => {
    const copied = copyComponents(cPas, cDfm, ['pnlHaut', 'btnNouveau'], unitOf) as { payload: Parameters<typeof pasteComponents>[2] };
    assert.equal(copied.payload.objects.length, 1, 'btnNouveau travels with its parent pnlHaut');
    assert.deepEqual(copied.payload.components.map(c => c.name), ['pnlHaut', 'lblTitre', 'btnNouveau', 'btnImporter', 'edtRecherche']);
    assert.ok(copied.payload.units.includes('cxButtons') && copied.payload.units.includes('ExtCtrls'));

    const r = pasteComponents(lPas, lDfm, copied.payload, undefined, 0) as Exclude<ReturnType<typeof pasteComponents>, { error: string }>;
    assert.deepEqual(r.renamed, [], 'no clash in the other form');
    const dfm2 = applyTextEdits(lDfm, [r.dfmEdit]);
    assert.equal(findNode(tree(dfm2), 'btnImporter')!.parent?.name, 'pnlHaut');
    assert.match(dfm2, /\n {2}object pnlHaut: TPanel/);
    const pas2 = applyTextEdits(lPas, r.pasEdits);
    assert.match(pas2, /Vcl\.ExtCtrls, cxButtons;/, 'only the missing unit is added, third-party without Vcl.');
    assert.match(pas2, /procedure TLayoutForm\.btnNouveauClick/, 'bodies retargeted to the destination form class');
    assert.doesNotMatch(pas2, /TComplexForm/);
    assert.ok(!checkForm(pas2, dfm2).some(i => i.severity === 'error' || i.severity === 'warning'));
});

test('paste refuses a missing container and clipboard text that is not ours', () => {
    const copied = copyComponents(cPas, cDfm, ['btnFermer'], unitOf) as { payload: Parameters<typeof pasteComponents>[2] };
    assert.match((pasteComponents(cPas, cDfm, copied.payload, 'nope') as { error: string }).error, /not found/);
    assert.equal(parseClip('hello'), undefined);
    assert.equal(parseClip('MMX-DFM:{bad'), undefined);
    assert.match((copyComponents(cPas, cDfm, ['ComplexForm'], unitOf) as { error: string }).error, /at least one/);
});

/* ───────── form from fields, change class ───────── */

test('field list parsing and mapping from class members', () => {
    assert.deepEqual(parseFieldList('Nom:string, Date de naissance:date; Actif:boolean\nÉtat civil:list').map(f => `${f.ident}/${f.kind}`),
        ['Nom/edit', 'DateDeNaissance/date', 'Actif/check', 'EtatCivil/combo']);
    assert.equal(fieldListFromMembers([{ name: 'FNom', type: 'string' }, { name: 'FAge', type: 'Integer' }, { name: 'FActif', type: 'Boolean' }, { name: 'FNaissance', type: 'TDateTime' }]),
        'Nom:string, Age:integer, Actif:boolean, Naissance:date');
});

test('generate a form from fields: aligned columns, unique names, fields and units added', () => {
    const r = generateFormFields(lPas, lDfm, parseFieldList('Nom:string, Age:integer, Actif:boolean, Date de naissance:date, Notes:memo'), 'pnlSaisie');
    assert.ok(!('error' in r), 'error' in r ? r.error : '');
    const ok = r as { dfmEdit: never; extraDfmEdits: never[]; grewContainer?: { name: string; from: number }; pasEdits: never[]; names: string[] };
    assert.deepEqual(ok.names, ['lblNom2', 'edtNom2', 'lblAge', 'edtAge', 'chkActif', 'lblDateDeNaissance', 'dtpDateDeNaissance', 'lblNotes', 'memNotes2']);
    assert.deepEqual(ok.grewContainer && [ok.grewContainer.name, ok.grewContainer.from], ['pnlSaisie', 100], 'the 100px panel grows to hold the rows');
    const dfm2 = applyTextEdits(lDfm, [ok.dfmEdit, ...ok.extraDfmEdits]);
    const t = tree(dfm2);
    assert.ok(findNode(t, 'pnlSaisie')!.height! > 100);
    const labels = ['lblNom2', 'lblAge', 'lblDateDeNaissance', 'lblNotes'].map(n => findNode(t, n)!.left);
    assert.equal(new Set(labels).size, 1, 'labels in one column');
    const inputs = ['edtNom2', 'edtAge', 'chkActif', 'dtpDateDeNaissance', 'memNotes2'].map(n => findNode(t, n)!.left);
    assert.equal(new Set(inputs).size, 1, 'inputs in one column');
    assert.ok(findNode(t, 'edtNom2')!.top! > findNode(t, 'memNotes')!.top!, 'below what is already there');
    assert.equal(findNode(t, 'edtAge')!.props['NumbersOnly'], 'True');
    assert.equal(findNode(t, 'edtNom2')!.parent?.name, 'pnlSaisie');
    const pas2 = applyTextEdits(lPas, ok.pasEdits);
    assert.match(pas2, /dtpDateDeNaissance: TDateTimePicker;/);
    assert.match(pas2, /Vcl\.ExtCtrls, Vcl\.ComCtrls;/);
    assert.ok(!checkForm(pas2, dfm2).some(i => i.severity === 'error' || i.severity === 'warning'));
    assert.match((generateFormFields(lPas, lDfm, []) as { error: string }).error, /at least one field/);
});

test('change class: compatible properties and events survive, the rest is reported and removed', () => {
    const ok = (r: ReturnType<typeof planChangeClass>) => { assert.ok(!('error' in r), 'error' in r ? r.error : ''); return r as Exclude<typeof r, { error: string }>; };
    const bit = ok(planChangeClass(lPas, lDfm, 'btnOk', 'TBitBtn'));
    assert.deepEqual([bit.droppedProps, bit.droppedEvents, bit.unchecked], [[], [], false]);
    const dfm2 = applyTextEdits(lDfm, bit.dfmEdits);
    assert.equal(findNode(tree(dfm2), 'btnOk')!.className, 'TBitBtn');
    assert.equal(findNode(tree(dfm2), 'btnOk')!.props['OnClick'], 'btnOkClick');
    const pas2 = applyTextEdits(lPas, bit.pasEdits);
    assert.match(pas2, /btnOk: TBitBtn;/);
    assert.match(pas2, /Vcl\.ExtCtrls, Vcl\.Buttons;/);

    const toEdit = ok(planChangeClass(lPas, lDfm, 'memNotes', 'TEdit'));
    assert.deepEqual(toEdit.droppedProps, ['Lines.Strings']);
    const dfm3 = applyTextEdits(lDfm, toEdit.dfmEdits);
    assert.doesNotMatch(dfm3, /object fake/, 'the whole multi-line property is removed');
    assert.equal(findNode(tree(dfm3), 'memNotes')!.props['TabOrder'], '1');

    const toButton = ok(planChangeClass(cPas, cDfm, 'edtNom', 'TButton'));
    assert.deepEqual(toButton.droppedEvents, ['OnChange']);

    const third = ok(planChangeClass(cPas, cDfm, 'edtNom', 'TcxTextEdit', 'cxTextEdit'));
    assert.equal(third.unchecked, true);
    assert.deepEqual([third.droppedProps, third.droppedEvents], [[], []]);
    assert.match(applyTextEdits(cPas, third.pasEdits), /cxGridDBTableView, cxTextEdit;/);

    assert.match((planChangeClass(lPas, lDfm, 'btnOk', 'TButton') as { error: string }).error, /already/);
    assert.match((planChangeClass(lPas, lDfm, 'nope', 'TEdit') as { error: string }).error, /not found/);
});
