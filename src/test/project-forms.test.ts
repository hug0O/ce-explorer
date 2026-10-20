import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyTextEdits, normalizeEdits, TextEdit } from '../services/DelphiForm';
import { parseDfmTree } from '../services/DelphiLayout';
import { buildDesignModel, deleteEdits, renameEdits } from '../services/DesignerModel';
import { churnFromLog, families, formInfo, hotspots, unitMetrics } from '../services/ProjectForms';
import { unitFacts } from '../services/ProjectUnused';

const BASE_PAS = ['unit UBase;', 'interface', 'type', '  TfrmBase = class(TForm)', '  end;', 'implementation', 'end.'].join('\n');
const CHILD_PAS = ['unit UChild;', 'interface', 'uses UBase;', 'type', '  TfrmChild = class(TfrmBase)', '    btnOwn: TButton;', '  end;', 'implementation', 'end.'].join('\n');
const LIST_PAS = ['unit UList;', 'interface', 'type', '  TfrmList = class(TForm)', '  end;', '  THelper = class', '  end;', 'implementation', 'end.'].join('\n');

const CHILD_DFM = [
    'inherited frmChild: TfrmChild',
    '  Caption = \'Child\'',
    '  inherited pnlTop: TPanel',
    '    Height = 60',
    '    inherited btnOk: TButton',
    '      Caption = \'Valider\'',
    '    end',
    '  end',
    '  object btnOwn: TButton',
    '    Left = 8',
    '    Top = 100',
    '  end',
    'end',
].join('\n');

const apply = (text: string, edits: TextEdit[]): string => applyTextEdits(text, (normalizeEdits(edits) as { edits: TextEdit[] }).edits);

test('the classes of a unit, with the class they descend from', () => {
    assert.deepEqual(unitFacts(CHILD_PAS)!.classes, [{ name: 'TfrmChild', parent: 'TfrmBase' }]);
    assert.deepEqual(unitFacts(LIST_PAS)!.classes, [{ name: 'TfrmList', parent: 'TForm' }, { name: 'THelper', parent: '' }]);
});

test('an inherited component is read as such, with the ones the form adds', () => {
    const root = parseDfmTree(CHILD_DFM)!;
    assert.ok(root.inherited);
    const flat = (n: typeof root): typeof root[] => [n, ...n.children.flatMap(flat)];
    assert.deepEqual(flat(root).map(n => [n.name, !!n.inherited]), [['frmChild', true], ['pnlTop', true], ['btnOk', true], ['btnOwn', false]]);
    assert.ok(!parseDfmTree('object F: TF\nend')!.inherited);
});

test('the designer knows which components come from the ancestor, and does not delete or rename them', () => {
    const model = buildDesignModel(CHILD_DFM)!;
    const find = (n: typeof model.root, name: string): typeof model.root | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));
    assert.equal(find(model.root, 'pnlTop')!.inherited, true);
    assert.equal(find(model.root, 'btnOwn')!.inherited, undefined);

    const del = deleteEdits(CHILD_PAS, CHILD_DFM, ['btnOk', 'pnlTop'], 'TfrmChild');
    assert.ok('error' in del && /inherited from the ancestor form/.test(del.error));
    const own = deleteEdits(CHILD_PAS, CHILD_DFM, ['btnOwn'], 'TfrmChild');
    assert.ok(!('error' in own), 'what the form added can be deleted');
    if (!('error' in own)) { assert.ok(!/btnOwn/.test(apply(CHILD_DFM, own.dfmEdits))); }

    const rename = renameEdits(CHILD_PAS, CHILD_DFM, 'btnOk', 'btnValider');
    assert.ok('error' in rename && /inherited/.test(rename.error));
    assert.ok(!('error' in renameEdits(CHILD_PAS, CHILD_DFM, 'btnOwn', 'btnMine')));
});

test('the family of a form: its ancestor, the unit of it, how much is its own', () => {
    const child = formInfo('UChild', unitFacts(CHILD_PAS), CHILD_DFM)!;
    assert.deepEqual(child, { unit: 'UChild', className: 'TfrmChild', ancestor: 'TfrmBase', visual: true, inherited: 2, own: 1 });
    const plain = formInfo('UList', unitFacts(LIST_PAS), 'object frmList: TfrmList\n  object a: TEdit\n  end\nend')!;
    assert.deepEqual([plain.visual, plain.inherited, plain.own, plain.ancestor], [false, 0, 1, 'TForm']);
    assert.equal(formInfo('U', undefined, 'not a dfm'), undefined);

    const units = [BASE_PAS, CHILD_PAS, LIST_PAS].map(t => unitFacts(t)!);
    const fams = families([child, plain], units);
    assert.deepEqual(fams.map(f => [f.ancestor, f.ancestorUnit, f.forms.map(x => x.unit)]), [['TForm', '', ['UList']], ['TfrmBase', 'UBase', ['UChild']]], 'a class of the project has its unit, a class of the library has none');
    assert.equal(families([{ ...plain, ancestor: '' }], units)[0].ancestor, '(no ancestor written)');
});

const LONG = (n: number): string[] => ['begin', ...Array.from({ length: n }, (_, i) => `  Step${i};`), 'end;'];

test('the size of a unit and of its routines', () => {
    const pas = ['unit U;', 'interface', 'implementation', '// a comment', '', 'procedure TF.Short;', ...LONG(3), '', 'procedure TF.Long;', ...LONG(80), '', 'function TF.Other: Integer;', ...LONG(2), 'end.'].join('\n');
    const m = unitMetrics(pas);
    assert.equal(m.routines, 3);
    assert.equal(m.long, 1);
    assert.ok(m.longest > 80 && m.longest < 90);
    assert.ok(m.lines > 90 && m.lines < pas.split('\n').length, 'blank lines and comments are not counted');
    assert.deepEqual(unitMetrics(''), { lines: 0, routines: 0, long: 0, longest: 0 });
});

test('commits per file, and the units that are big and often changed come first', () => {
    const log = ['---', 'src/UA.pas', 'src/UA.dfm', '---', 'src/UA.pas', 'src/UB.pas', '---', 'src/UA.pas', 'other/Readme.pas', ''].join('\n');
    const churn = churnFromLog(log, 'C:\\repo\\');
    assert.equal(churn.get('c:/repo/src/ua.pas'), 3);
    assert.equal(churn.get('c:/repo/src/ub.pas'), 1);
    const big = { lines: 3000, routines: 40, long: 6, longest: 400 };
    const small = { lines: 100, routines: 5, long: 0, longest: 30 };
    const rows = hotspots([
        { unit: 'UA', path: 'C:\\repo\\src\\UA.pas', metrics: small },
        { unit: 'UB', path: 'C:\\repo\\src\\UB.pas', metrics: big },
        { unit: 'UC', path: 'C:\\repo\\src\\UC.pas', metrics: big },
    ], churn);
    assert.deepEqual(rows.map(r => r.unit), ['UB', 'UA'], 'UB: one commit but big; UA: three small; UC: never changed, left out');
    assert.ok(rows[0].score > rows[1].score);
    assert.equal(hotspots([], churn).length, 0);
});
