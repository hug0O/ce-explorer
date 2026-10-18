import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { alignLines, findTokenOutsideQuotes } from '../utils/alignText';
import {
    COMPONENTS, applyTextEdits, buildDfmObject, buildUnitEdits, existingNames, handlerName,
    insertIntoDfm, isValidIdentifier, nextComponentName, parseDfmRoot,
} from '../services/DelphiForm';

const fixtures = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(fixtures, 'MainForm.dfm'), 'utf8');
const pas = fs.readFileSync(path.join(fixtures, 'MainForm.pas'), 'utf8');
const def = (cls: string) => COMPONENTS.find(c => c.className === cls)!;

test('alignLines aligns assignments on :=', () => {
    const r = alignLines(['a := 1;', 'longName := 2;', 'bc := 3;'], ':=');
    assert.deepEqual(r.lines, ['a        := 1;', 'longName := 2;', 'bc       := 3;']);
    assert.equal(r.aligned, 3);
});

test('alignLines is idempotent, ignores lines without the token and tokens inside strings', () => {
    const once = alignLines(['x := 1;', '// comment', "s := ':= not me';", 'yy := 2;'], ':=').lines;
    assert.equal(once[1], '// comment');
    assert.equal(alignLines(once, ':=').lines.join('\n'), once.join('\n'));
    assert.equal(findTokenOutsideQuotes("'a:=b' := 1", ':='), 7);
});

test('alignLines keeps indentation, expands tabs and does nothing for a single match', () => {
    const r = alignLines(['\tfoo: Integer;', '\tbarbaz: string;'], ':');
    assert.equal(r.lines[0].indexOf(':'), r.lines[1].indexOf(':') === -1 ? -1 : r.lines[0].indexOf(':'));
    assert.deepEqual(alignLines(['only := 1'], ':=').lines, ['only := 1']);
    assert.deepEqual(alignLines(['a', 'b'], '').lines, ['a', 'b']);
});

test('DFM: root, names and next free name', () => {
    assert.deepEqual(parseDfmRoot(dfm), { name: 'MainForm', className: 'TMainForm', eol: '\n' });
    assert.equal(parseDfmRoot('TPF0\u0000binary'), undefined);
    const used = existingNames(dfm, pas);
    assert.ok(used.has('btnvalider') && used.has('edtnom'));
    assert.equal(nextComponentName('Button', used), 'Button1');
    assert.equal(nextComponentName('Button', new Set(['button1', 'button2'])), 'Button3');
    assert.equal(handlerName('Button1', 'OnClick'), 'Button1Click');
    assert.ok(isValidIdentifier('Button1') && !isValidIdentifier('1Button') && !isValidIdentifier('a b'));
});

test('DFM: a new button is stacked under the existing controls and wired to its handler', () => {
    const obj = buildDfmObject(def('TButton'), 'Button1', { event: 'OnClick', method: 'Button1Click' }, dfm);
    assert.match(obj, /object Button1: TButton/);
    assert.match(obj, /Top = 105/, 'below chkActif (80 + 17) + 8');
    assert.match(obj, /TabOrder = 4/, 'after the 4 existing children');
    assert.match(obj, /OnClick = Button1Click/);
    const edit = insertIntoDfm(dfm, obj)!;
    const out = applyTextEdits(dfm, [edit]);
    assert.ok(out.indexOf('object Button1') > out.indexOf('object chkActif'));
    assert.ok(out.trimEnd().endsWith('end'), 'root object still closed');
    assert.equal(parseDfmRoot(out)?.name, 'MainForm');
});

test('Unit: field, handler declaration, implementation and uses are added', () => {
    const r = buildUnitEdits(pas, {
        formClass: 'TMainForm', componentName: 'Button1', def: def('TButton'),
        event: def('TButton').events[0],
    })!;
    const out = applyTextEdits(pas, r.edits);
    assert.equal(r.handler, 'TMainForm.Button1Click');
    const lines = out.split('\n');
    const idx = (re: RegExp) => lines.findIndex(l => re.test(l));
    assert.ok(idx(/Button1: TButton;/) > idx(/chkActif: TCheckBox;/), 'field after the other components');
    assert.ok(idx(/Button1: TButton;/) < idx(/procedure FormCreate/), 'field before the handlers');
    assert.ok(idx(/procedure Button1Click\(Sender: TObject\);/) > idx(/procedure chkActifClick/), 'declared after the last handler');
    assert.ok(idx(/procedure Button1Click/) < idx(/^\s*private/), 'still in the IDE-managed section');
    assert.ok(idx(/procedure TMainForm\.Button1Click\(Sender: TObject\);/) > idx(/procedure TMainForm\.chkActifClick/));
    assert.ok(idx(/procedure TMainForm\.Button1Click/) < idx(/^end\.$/));
    assert.equal((out.match(/Vcl\.StdCtrls/g) ?? []).length, 1, 'StdCtrls already used, not added twice');
});

test('Unit: ExtCtrls is added to uses for a TPanel, with the handler params of the chosen event', () => {
    const edit = def('TEdit').events.find(e => e.name === 'OnKeyPress')!;
    const panel = buildUnitEdits(pas, { formClass: 'TMainForm', componentName: 'Panel1', def: def('TPanel'), event: def('TPanel').events[0] })!;
    assert.match(applyTextEdits(pas, panel.edits), /Vcl\.StdCtrls, Vcl\.ExtCtrls;/);
    const key = buildUnitEdits(pas, { formClass: 'TMainForm', componentName: 'Edit1', def: def('TEdit'), event: edit })!;
    assert.match(applyTextEdits(pas, key.edits), /procedure Edit1KeyPress\(Sender: TObject; var Key: Char\);/);
});

test('Unit: no event means a field only; unknown form class gives undefined', () => {
    const r = buildUnitEdits(pas, { formClass: 'TMainForm', componentName: 'Label1', def: def('TLabel') })!;
    const out = applyTextEdits(pas, r.edits);
    assert.match(out, /Label1: TLabel;/);
    assert.doesNotMatch(out, /Label1Click/);
    assert.equal(buildUnitEdits('unit X; interface implementation end.', { formClass: 'TNope', componentName: 'B', def: def('TButton') }), undefined);
});
