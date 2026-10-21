import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { TextEdit, applyTextEdits, normalizeEdits } from '../services/DelphiForm';
import { checkForm } from '../services/DelphiCheck';
import { parseDfmTree } from '../services/DelphiLayout';
import { buildDesignModel, DNode } from '../services/DesignerModel';
import { columnsToCreate, fieldsToCreate, sqlColumnsOf, viewDataset } from '../services/DesignerFieldNames';
import { createColumnsEdits, createFieldsEdits, diffEdit, guessFieldClass } from '../services/DesignerFields';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const apply = (t: string, e: TextEdit[]): string => applyTextEdits(t, (normalizeEdits(e) as { edits: TextEdit[] }).edits);
const flat = (n: DNode): DNode[] => [n, ...n.children.flatMap(flat)];

test('what the type of a column name suggests', () => {
    assert.deepEqual(guessFieldClass('TARIF_ID'), { cls: 'TFloatField' });
    assert.deepEqual(guessFieldClass('QTE_STOCK'), { cls: 'TFloatField' });
    assert.deepEqual(guessFieldClass('DATE_MAD'), { cls: 'TDateTimeField' });
    assert.deepEqual(guessFieldClass('DT_CREATION'), { cls: 'TDateTimeField' });
    assert.deepEqual(guessFieldClass('NOM'), { cls: 'TStringField', size: 50 });
    assert.deepEqual(guessFieldClass('VIDE'), { cls: 'TStringField', size: 50 }, 'VIDE has no _ID in it');
});

test('one edit between two texts: the middle that differs', () => {
    assert.equal(diffEdit('abc', 'abc'), undefined);
    assert.deepEqual(diffEdit('abcdef', 'abXYdef'), { offset: 2, length: 1, text: 'XY' });
    assert.deepEqual(diffEdit('abc', 'abXc'), { offset: 2, text: 'X' });
    assert.deepEqual(diffEdit('abXc', 'abc'), { offset: 2, length: 1, text: '' });
    const before = 'one\ntwo\nthree\n';
    const after = 'one\ntwo\nnew\nthree\n';
    assert.equal(applyTextEdits(before, [diffEdit(before, after)!]), after);
});

const dfm = fs.readFileSync(path.join(dir, 'NonVisualForm.dfm'), 'utf8');
const pas = fs.readFileSync(path.join(dir, 'NonVisualForm.pas'), 'utf8');

test('the columns of a SELECT that have no persistent field yet', () => {
    const root = parseDfmTree(dfm)!;
    const q = root.children.find(c => c.name === 'UniQuery1')!;
    assert.deepEqual(sqlColumnsOf(dfm, q), ['ID', 'NOM']);
    assert.deepEqual(fieldsToCreate(dfm, q), ['NOM'], 'ID already has UniQuery1ID');
    assert.deepEqual(fieldsToCreate(dfm, root.children.find(c => c.name === 'DataSource1')!), [], 'not a dataset');
});

test('"Add all fields": one persistent field per column, named after the query, in the .dfm and the unit', () => {
    const r = createFieldsEdits(pas, dfm, 'UniQuery1');
    assert.ok(!('error' in r), 'error' in r ? r.error : '');
    if ('error' in r) { return; }
    assert.deepEqual(r.added, ['UniQuery1NOM']);
    assert.equal(r.dfmEdits.length, 1, 'one edit for the form');
    const outDfm = apply(dfm, r.dfmEdits);
    const outPas = apply(pas, r.pasEdits);
    const f = parseDfmTree(outDfm)!.children.find(c => c.name === 'UniQuery1')!.children.find(c => c.name === 'UniQuery1NOM')!;
    assert.equal(f.className, 'TStringField');
    assert.deepEqual([f.props['FieldName'], f.props['Size']], ['\'NOM\'', '50']);
    assert.match(outPas, /UniQuery1NOM: TStringField;/);
    assert.deepEqual(checkForm(outPas, outDfm).filter(i => i.severity !== 'info'), [], 'the form and the unit still agree');
    assert.deepEqual(fieldsToCreate(outDfm, parseDfmTree(outDfm)!.children.find(c => c.name === 'UniQuery1')!), [], 'nothing left to create');
    assert.ok(('error' in createFieldsEdits(outPas, outDfm, 'UniQuery1')), 'asking again says so');
});

test('a query with no SQL in the form, or a select *, is not guessed at', () => {
    const noSql = 'object F: TF\n  object q: TUniQuery\n  end\nend\n';
    const r = createFieldsEdits('unit U;\ninterface\ntype\n  TF = class(TForm)\n  end;\nimplementation\nend.', noSql, 'q');
    assert.ok('error' in r && /no SQL in the form/.test(r.error));
    const star = 'object F: TF\n  object q: TUniQuery\n    SQL.Strings = (\n      \'select * from T\')\n  end\nend\n';
    assert.ok('error' in createFieldsEdits('unit U;\ninterface\ntype\n  TF = class(TForm)\n  end;\nimplementation\nend.', star, 'q'));
    assert.ok('error' in createFieldsEdits(pas, dfm, 'nope'));
});

const GRID = [
    'object F: TF',
    '  object qry: TUniQuery', '    SQL.Strings = (', '      \'select TARIF_ID, DATE_MAD, NOM, \'', '      \'  CODE as C2 from T\')',
    '    object qryTARIF_ID: TFloatField', '      FieldName = \'TARIF_ID\'', '    end',
    '  end',
    '  object ds: TDataSource', '    DataSet = qry', '  end',
    '  object grd: TcxGrid',
    '    object tv: TcxGridDBTableView', '      DataController.DataSource = ds',
    '      object tvTARIF_ID: TcxGridDBColumn', '        DataBinding.FieldName = \'TARIF_ID\'', '      end',
    '    end',
    '    object lvl: TcxGridLevel', '      GridView = tv', '    end',
    '  end',
    'end',
].join('\n');
const GRID_PAS = ['unit U;', 'interface', 'type', '  TF = class(TForm)', '    qry: TUniQuery;', '    qryTARIF_ID: TFloatField;', '    ds: TDataSource;', '    grd: TcxGrid;', '    tv: TcxGridDBTableView;', '    tvTARIF_ID: TcxGridDBColumn;', '    lvl: TcxGridLevel;', '  end;', 'implementation', 'end.'].join('\n');

test('the fields a view could show: the persistent ones, else the SELECT', () => {
    const root = parseDfmTree(GRID)!;
    const tv = flat(root as never as DNode) as unknown;
    void tv;
    const view = root.children[2].children[0];
    assert.equal(viewDataset(view)?.name, 'qry');
    assert.deepEqual(columnsToCreate(GRID, view), [], 'its dataset has one persistent field, and it has its column');
    const noFields = GRID.replace(/ {4}object qryTARIF_ID: TFloatField\n {6}FieldName = 'TARIF_ID'\n {4}end\n/, '');
    const root2 = parseDfmTree(noFields)!;
    assert.deepEqual(columnsToCreate(noFields, root2.children[2].children[0]), ['DATE_MAD', 'NOM', 'C2'], 'from the SELECT, quoted lines joined; TARIF_ID has its column');
});

test('"Create columns from the fields": one column per field, named after the view, with its FieldName', () => {
    const noFields = GRID.replace(/ {4}object qryTARIF_ID: TFloatField\n {6}FieldName = 'TARIF_ID'\n {4}end\n/, '');
    const r = createColumnsEdits(GRID_PAS, noFields, 'tv');
    assert.ok(!('error' in r), 'error' in r ? r.error : '');
    if ('error' in r) { return; }
    assert.deepEqual(r.added, ['tvDATE_MAD', 'tvNOM', 'tvC2']);
    const outDfm = apply(noFields, r.dfmEdits);
    const view = parseDfmTree(outDfm)!.children[2].children[0];
    assert.deepEqual(view.children.map(c => [c.name, c.className, c.props['DataBinding.FieldName']]), [
        ['tvTARIF_ID', 'TcxGridDBColumn', '\'TARIF_ID\''], ['tvDATE_MAD', 'TcxGridDBColumn', '\'DATE_MAD\''], ['tvNOM', 'TcxGridDBColumn', '\'NOM\''], ['tvC2', 'TcxGridDBColumn', '\'C2\''],
    ]);
    assert.match(apply(GRID_PAS, r.pasEdits), /tvC2: TcxGridDBColumn;/);
    assert.ok('error' in createColumnsEdits(apply(GRID_PAS, r.pasEdits), outDfm, 'tv'), 'nothing left to create');
    assert.ok('error' in createColumnsEdits(GRID_PAS, GRID, 'qry'), 'not a view');
});

test('the designer knows how many fields and columns can still be created', () => {
    const noFields = GRID.replace(/ {4}object qryTARIF_ID: TFloatField\n {6}FieldName = 'TARIF_ID'\n {4}end\n/, '');
    const model = buildDesignModel(noFields)!;
    const by = (n: string): DNode => flat(model.root).find(x => x.name === n)!;
    assert.equal(by('qry').newFields, 4, 'four columns in the SELECT, no persistent field');
    assert.equal(by('tv').newFields, 3);
    const full = buildDesignModel(GRID)!;
    assert.equal(flat(full.root).find(x => x.name === 'tv')!.newFields, 0);
});
