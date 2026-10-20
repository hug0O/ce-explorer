import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { unitFacts, unusedComponents, unusedUnits } from '../services/ProjectUnused';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');

const unit = (name: string, iface: string[], impl: string[] = [], uses: string[] = [], implUses: string[] = [], extra: string[] = []): string => [
    `unit ${name};`, '', 'interface', '', ...(uses.length ? [`uses ${uses.join(', ')};`, ''] : []), ...iface, '', 'implementation', '',
    ...(implUses.length ? [`uses ${implUses.join(', ')};`, ''] : []), ...impl, '', ...extra, 'end.',
].join('\n');

const A = unit('UMain',
    ['type', '  TMain = class', '    procedure Go;', '  end;'],
    ['procedure TMain.Go;', 'begin', '  Helper(1);', '  Color := clRed;', '  // Ignored(2)', '  Log(\'Hidden\');', 'end;'],
    ['System.SysUtils', 'UHelpers', 'UShapes'], ['UColors', 'ULogs', 'UReg', 'UMissing']);
const HELPERS = unit('UHelpers', ['procedure Helper(N: Integer);', 'function Unused2: Integer;'], ['procedure Helper(N: Integer);', 'begin', 'end;']);
const SHAPES = unit('UShapes', ['type', '  TShape = class', '  end;', '', 'procedure Ignored(N: Integer);'], ['procedure Ignored(N: Integer);', 'begin', 'end;']);
const COLORS = unit('UColors', ['type', '  TColor = (clRed, clGreen,', '    clBlue);', '', 'var', '  Last: TColor;']);
const LOGS = unit('ULogs', ['procedure Log(const S: string);'], ['procedure Log(const S: string);', 'begin', 'end;']);
const REG = unit('UReg', ['procedure Dummy;'], ['procedure Dummy;', 'begin', 'end;'], [], [], ['initialization', '  Register;', '']);

test('the interface of a unit: types, enumeration elements, routines, variables', () => {
    const f = unitFacts(COLORS)!;
    assert.equal(f.name, 'UColors');
    for (const w of ['ucolors', 'tcolor', 'clred', 'clgreen', 'clblue', 'last']) { assert.ok(f.exported.has(w), w); }
    assert.ok(unitFacts(HELPERS)!.exported.has('helper'));
    assert.ok(unitFacts(REG)!.initialization);
    assert.equal(unitFacts('not a unit'), undefined);
});

test('the uses clauses: both sections, with their lines', () => {
    const f = unitFacts(A)!;
    assert.deepEqual(f.uses.map(u => [u.name, u.section]), [['System.SysUtils', 'interface'], ['UHelpers', 'interface'], ['UShapes', 'interface'], ['UColors', 'implementation'], ['ULogs', 'implementation'], ['UReg', 'implementation'], ['UMissing', 'implementation']]);
    assert.equal(A.split('\n')[f.uses[3].line].includes('UColors'), true, 'the line of the unit in the clause');
});

test('a unit of the project of which nothing is used is reported; the ones that are used, the unknown ones and comments are not', () => {
    const files = [A, HELPERS, SHAPES, COLORS, LOGS, REG].map(t => ({ facts: unitFacts(t)! }));
    const out = unusedUnits(files);
    assert.deepEqual(out.map(u => [u.unit, u.used, u.section, u.sideEffects]), [
        ['UMain', 'UShapes', 'interface', false],
        ['UMain', 'UReg', 'implementation', true],
    ], 'UHelpers (Helper), UColors (clRed) and ULogs (Log) are used; System.SysUtils and UMissing are not units of the project');
});

test('a name that only appears in a comment or a string does not count as a use', () => {
    const files = [A, HELPERS, SHAPES, COLORS, LOGS, REG].map(t => ({ facts: unitFacts(t)! }));
    assert.ok(unusedUnits(files).some(u => u.used === 'UShapes'), 'Ignored(2) is in a comment');
});

test('non-visual components that nothing refers to', () => {
    const dfm = fs.readFileSync(path.join(dir, 'NonVisualForm.dfm'), 'utf8');
    const pas = fs.readFileSync(path.join(dir, 'NonVisualForm.pas'), 'utf8');
    const out = unusedComponents('NonVisualForm', pas, dfm);
    const names = out.map(u => u.component);
    for (const n of ['UniConnection1', 'UniQuery1', 'cxLookAndFeelController1']) { assert.ok(!names.includes(n), n + ' is used (code, another component) or works by itself'); }
    assert.ok(names.includes('DataSource1') && names.includes('cxImageList1') && names.includes('tmrStatut'));
    assert.equal(out.find(u => u.component === 'cxStyleRepository1')!.holds, 2, 'its two styles go with it');
    assert.ok(out.every(u => u.line > 0));
});

test('a component used by the code, by another component or through an event is kept', () => {
    const dfm = [
        'object F: TF', '  object tmr: TTimer', '    OnTimer = tmrTimer', '  end',
        '  object il: TImageList', '  end', '  object btn: TButton', '    Images = il', '  end',
        '  object q: TUniQuery', '  end', '  object qUnused: TUniQuery', '    object qUnusedID: TIntegerField', '    end', '  end',
        '  object ds: TDataSource', '    DataSet = q', '  end', 'end'].join('\n');
    const pas = ['unit U;', 'interface', 'type', '  TF = class(TForm)', '    tmr: TTimer;', '    il: TImageList;', '    btn: TButton;', '    q: TUniQuery;', '    qUnused: TUniQuery;', '    qUnusedID: TIntegerField;',
        '    ds: TDataSource;', '    procedure tmrTimer(Sender: TObject);', '  end;', 'implementation', 'procedure TF.tmrTimer(Sender: TObject);', 'begin', '  // q.Open', 'end;', 'end.'].join('\n');
    const out = unusedComponents('U', pas, dfm);
    assert.deepEqual(out.map(u => [u.component, u.holds]), [['qUnused', 1], ['ds', 0]], 'q is used by ds, ds by nobody');
    const used = unusedComponents('U', pas.replace('// q.Open', 'ds.DataSet := nil;'), dfm);
    assert.ok(!used.some(u => u.component === 'ds'));
});
