import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits } from '../services/DelphiForm';
import { findNode, parseDfmTree } from '../services/DelphiLayout';
import { distributeContainer, setGapBetween, setPropEdit } from '../services/DelphiSpacing';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(dir, 'LayoutForm.dfm'), 'utf8');
const root = parseDfmTree(dfm)!;
const node = (n: string) => findNode(root, n)!;
const reparse = (text: string) => parseDfmTree(text)!;

function ok(r: ReturnType<typeof setGapBetween>) {
    assert.ok(!('error' in r), 'error' in r ? r.error : '');
    return r as Extract<ReturnType<typeof setGapBetween>, { edits: unknown }>;
}

test('setPropEdit rewrites only the value of the property line', () => {
    const e = setPropEdit(dfm, node('edtNom'), 'Left', 99)!;
    const out = applyTextEdits(dfm, [e]);
    assert.equal(findNode(reparse(out), 'edtNom')!.left, 99);
    assert.equal(out.length, dfm.length, 'two digits replaced by two digits');
    assert.equal(setPropEdit(dfm, node('edtNom'), 'Nope', 1), undefined);
});

test('gap to the right: the neighbour moves to exactly gap px from the right edge', () => {
    const r = ok(setGapBetween(dfm, node('lblNom'), 'right', 20));
    assert.deepEqual(r.moved, ['edtNom']);
    const out = reparse(applyTextEdits(dfm, r.edits));
    assert.equal(findNode(out, 'edtNom')!.left, 16 + 24 + 20);
    assert.equal(findNode(out, 'memNotes')!.left, 16, 'other rows untouched');
});

test('gap to the right with cascade shifts the chain beyond the neighbour, not without it', () => {
    const withCascade = ok(setGapBetween(dfm, node('btnOk'), 'right', 20));
    assert.deepEqual(withCascade.moved, ['btnAnnuler']);
    assert.equal(findNode(reparse(applyTextEdits(dfm, withCascade.edits)), 'btnAnnuler')!.left, 152 + 75 + 20);

    const wide = ok(setGapBetween(dfm, node('lblNom'), 'right', 20, true));
    assert.equal(wide.moved.length, 1, 'edtNom has nothing after it on its row');
});

test('gap below, above and left use the matching axis', () => {
    const below = ok(setGapBetween(dfm, node('edtNom'), 'below', 4));
    assert.deepEqual(below.moved, ['memNotes'], 'memNotes overlaps edtNom horizontally');
    assert.equal(findNode(reparse(applyTextEdits(dfm, below.edits)), 'memNotes')!.top, 16 + 23 + 4);

    const above = ok(setGapBetween(dfm, node('memNotes'), 'above', 12));
    assert.deepEqual([...above.moved].sort(), ['edtNom', 'lblNom'], 'the whole row above moves together');
    const outAbove = reparse(applyTextEdits(dfm, above.edits));
    assert.equal(findNode(outAbove, 'edtNom')!.top, 48 - 12 - 23, 'edge-to-edge gap above the memo');

    const left = ok(setGapBetween(dfm, node('btnAnnuler'), 'left', 3));
    assert.equal(findNode(reparse(applyTextEdits(dfm, left.edits)), 'btnOk')!.left, 233 - 3 - 75);
});

test('gap already right means no edit; errors for docked controls, missing neighbour, negative positions', () => {
    assert.deepEqual(ok(setGapBetween(dfm, node('btnOk'), 'right', 233 - 152 - 75)).edits, []);
    const err = (r: ReturnType<typeof setGapBetween>) => (r as { error: string }).error;
    assert.match(err(setGapBetween(dfm, node('pnlSaisie'), 'below', 8)), /docked/);
    assert.match(err(setGapBetween(dfm, node('btnAnnuler'), 'right', 8)), /No component right of btnAnnuler/);
    assert.match(err(setGapBetween(dfm, node('btnAnnuler'), 'left', 200)), /negative/);
});

test('distribute: fixed gaps between rows, columns aligned across rows', () => {
    const r = distributeContainer(dfm, node('pnlSaisie'), 10, 6);
    assert.ok(!('error' in r));
    const out = reparse(applyTextEdits(dfm, (r as { edits: never[] }).edits));
    const lbl = findNode(out, 'lblNom')!, edt = findNode(out, 'edtNom')!, memo = findNode(out, 'memNotes')!;
    assert.equal(edt.left, lbl.left! + lbl.width! + 10, 'horizontal gap');
    assert.equal(memo.top, 16 + 23 + 6, 'vertical gap below the tallest control of the row above');
    assert.equal(lbl.top! + lbl.height! / 2 > 0, true);
    assert.equal(memo.left, lbl.left, 'rows start in the same column');
});

test('distribute a row of buttons with an 11px gap, keeping the first one in place', () => {
    const r = distributeContainer(dfm, node('pnlBoutons'), 11, 8) as { edits: never[]; moved: string[] };
    const out = reparse(applyTextEdits(dfm, r.edits));
    assert.equal(findNode(out, 'btnOk')!.left, 152);
    assert.equal(findNode(out, 'btnAnnuler')!.left, 152 + 75 + 11);
    assert.deepEqual(r.moved, ['btnAnnuler']);
    assert.match((distributeContainer(dfm, node('LayoutForm'), 8, 8) as { error: string }).error, /at least two/);
});
