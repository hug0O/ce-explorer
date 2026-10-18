import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits } from '../services/DelphiForm';
import { findNode, parseDfmTree } from '../services/DelphiLayout';
import { planDfmDelete, planDfmRename } from '../services/DelphiSync';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(dir, 'LayoutForm.dfm'), 'utf8');
const pas = fs.readFileSync(path.join(dir, 'LayoutForm.pas'), 'utf8');

test('rename: the dfm object, its handlers (dfm + pas) follow the new name', () => {
    const plan = planDfmRename(pas, dfm, 'btnOk', 'btnConfirmer') as Exclude<ReturnType<typeof planDfmRename>, undefined | { error: string }>;
    assert.deepEqual(plan.handlers, [{ from: 'btnOkClick', to: 'btnConfirmerClick' }]);
    const outDfm = applyTextEdits(dfm, plan.dfmEdits);
    assert.match(outDfm, /object btnConfirmer: TButton/);
    assert.match(outDfm, /OnClick = btnConfirmerClick/);
    assert.doesNotMatch(outDfm, /btnOk\b/);
    assert.ok(findNode(parseDfmTree(outDfm)!, 'btnConfirmer'), 'still a valid tree');
    const outPas = applyTextEdits(pas, plan.pasEdits);
    assert.match(outPas, /procedure btnConfirmerClick\(Sender: TObject\);/);
    assert.match(outPas, /procedure TLayoutForm\.btnConfirmerClick\(Sender: TObject\);/);
    assert.match(outPas, /btnOk: TButton;/, 'the field itself is renamed by the member rename, not here');
    assert.doesNotMatch(outPas, /btnOkClick/);
});

test('rename: references in other components and names inside strings', () => {
    const withRef = dfm.replace("Caption = 'Nom'", "Caption = 'edtNom'\n      FocusControl = edtNom");
    const plan = planDfmRename(pas, withRef, 'edtNom', 'edtNomClient') as { dfmEdits: never[] };
    const out = applyTextEdits(withRef, plan.dfmEdits);
    assert.match(out, /FocusControl = edtNomClient/);
    assert.match(out, /Caption = 'edtNom'/, 'string literal untouched');
});

test('rename: a shared handler is kept, a clashing new name or an unknown component is refused', () => {
    const shared = dfm.replace('OnClick = btnAnnulerClick', 'OnClick = btnOkClick');
    const plan = planDfmRename(pas, shared, 'btnOk', 'btnX') as { handlers: unknown[] };
    assert.deepEqual(plan.handlers, [], 'btnAnnuler also uses btnOkClick');
    assert.match((planDfmRename(pas, dfm, 'btnOk', 'btnAnnuler') as { error: string }).error, /already/);
    assert.equal(planDfmRename(pas, dfm, 'notAComponent', 'x'), undefined);
    assert.equal(planDfmRename(pas, dfm, 'LayoutForm', 'x'), undefined, 'the form itself is not handled here');
});

test('delete: the object block disappears with its children, their fields go too', () => {
    const plan = planDfmDelete(pas, dfm, 'pnlSaisie', 'TLayoutForm')!;
    const outDfm = applyTextEdits(dfm, plan.dfmEdits);
    assert.doesNotMatch(outDfm, /pnlSaisie|lblNom|edtNom|memNotes/);
    assert.ok(findNode(parseDfmTree(outDfm)!, 'pnlBoutons'), 'siblings survive');
    assert.deepEqual([...plan.removedComponents].sort(), ['edtnom', 'lblnom', 'memnotes']);
    const outPas = applyTextEdits(pas, plan.pasEdits);
    assert.doesNotMatch(outPas, /lblNom: TLabel|edtNom: TEdit|memNotes: TMemo/);
    assert.match(outPas, /pnlSaisie: TPanel;/, 'the deleted component own field is removed by the member delete');
});

test('delete: empty handlers are removed, handlers with code are kept', () => {
    const emptied = pas.replace('  ModalResult := mrOk;\n', '');
    const plan = planDfmDelete(emptied, dfm, 'btnOk', 'TLayoutForm')!;
    assert.deepEqual(plan.removedHandlers, ['btnOkClick']);
    const outPas = applyTextEdits(emptied, plan.pasEdits);
    assert.doesNotMatch(outPas, /btnOkClick/);
    assert.match(outPas, /procedure TLayoutForm\.btnAnnulerClick/, 'neighbouring handler untouched');

    const kept = planDfmDelete(pas, dfm, 'btnAnnuler', 'TLayoutForm')!;
    assert.deepEqual(kept.keptHandlers, ['btnAnnulerClick']);
    assert.deepEqual(kept.pasEdits, []);
});
