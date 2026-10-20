import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conventions, formTexts, gridFieldIssues, groupTexts, isDefaultName, namePrefix, namingIssues, selectColumns, textKey, textsCsv } from '../services/ProjectChecks';

test('the names a SELECT gives to its columns', () => {
    assert.deepEqual(selectColumns('select a.ID, a.NOM as N, IDT COMMA_ID, "Statut Commande", x + 1 as "Total", count(*) cnt from T a'), ['ID', 'N', 'COMMA_ID', 'STATUT COMMANDE', 'TOTAL', 'CNT']);
    assert.deepEqual(selectColumns('select distinct a, b from t'), ['A', 'B']);
    assert.deepEqual(selectColumns('with x as (select 1 as q from dual) select y, z from x'), ['Y', 'Z'], 'the main select, not the one of the WITH');
    assert.deepEqual(selectColumns('select nvl(a, 0) a2, (select max(b) from t2) mx, case when a = 1 then 2 else 3 end c from t'), ['A2', 'MX', 'C']);
    assert.equal(selectColumns('select * from t'), undefined);
    assert.equal(selectColumns('select a.*, b from t a'), undefined);
    assert.equal(selectColumns('delete from t'), undefined);
});

const grid = (select: string[], columns: string[], extra: string[] = []): string => [
    'object F: TF',
    '  object qry: TUniQuery', '    SQL.Strings = (', ...select.map((l, i) => `      '${l}'${i === select.length - 1 ? ')' : ''}`), ...extra, '  end',
    '  object ds: TDataSource', '    DataSet = qry', '  end',
    '  object grd: TcxGrid', '    object tv: TcxGridDBTableView', '      DataController.DataSource = ds',
    ...columns.flatMap((c, i) => [`      object tvC${i}: TcxGridDBColumn`, `        DataBinding.FieldName = '${c}'`, '      end']),
    '    end', '  end', 'end',
].join('\n');

test('a grid column that shows a field its query does not select', () => {
    const issues = gridFieldIssues('U', grid(['select ID,', '  NOM n', 'from T'], ['ID', 'N', 'nom', 'VILLE']));
    assert.deepEqual(issues.map(i => [i.column, i.field, i.view, i.dataset]), [['tvC2', 'nom', 'tv', 'qry'], ['tvC3', 'VILLE', 'tv', 'qry']]);
    assert.match(issues[1].message, /VILLE.*SELECT of qry/);
    assert.equal(gridFieldIssues('U', grid(['select * from T'], ['ANY'])).length, 0, 'select * cannot be checked');
    const persistent = grid(['select ID from T'], ['ID', 'CALC'], ['    object qryCALC: TStringField', '      FieldName = \'CALC\'', '    end']);
    assert.equal(gridFieldIssues('U', persistent).length, 0, 'a persistent or calculated field is a field');
    assert.equal(gridFieldIssues('U', grid(['select ID from T'], ['ID']).replace('DataController.DataSource = ds', 'Other = 1')).length, 0, 'a view that is given its data by the code is left alone');
});

const FORM = [
    'object F: TF',
    '  Caption = \'Clients\'',
    '  object a: TButton', '    Caption = \'&Enregistrer\'', '    Hint = \'Save\'', '  end',
    '  object b: TButton', '    Caption = \'Enregistrer\'', '  end',
    '  object c: TLabel', '    Caption = \'Résumé :\'', '  end',
    '  object d: TLabel', '    Caption = \'Resume\'', '  end',
    '  object e: TLabel', '    Caption = \'e\'', '  end',
    '  object Label5: TLabel', '    Caption = \'Label5\'', '  end',
    '  object g: TButton', '    Caption = \'Total \'#13#10\'général\'', '  end',
    '  object h: TLabel', '    Caption = \'123\'', '  end',
    'end',
].join('\n');

test('the texts of a form: what is worth translating, grouped by meaning', () => {
    const rows = formTexts('U', FORM);
    assert.deepEqual(rows.map(r => r.text), ['Clients', '&Enregistrer', 'Save', 'Enregistrer', 'Résumé :', 'Resume', 'Total général'], 'no name of the IDE, no one letter, no number');
    assert.equal(rows[1].component, 'a');
    assert.equal(rows[1].prop, 'Caption');
    assert.equal(textKey('&Enregistrer'), textKey('enregistrer...'));
    assert.equal(textKey('Résumé :'), 'resume');
    const groups = groupTexts(rows);
    assert.deepEqual(groups[0].variants.map(v => v.text), ['&Enregistrer', 'Enregistrer'], 'the text written two ways comes first');
    assert.deepEqual(groups[1].variants.map(v => v.text), ['Resume', 'Résumé :'], 'equally used: in alphabetical order');
    assert.equal(groups.at(-1)!.variants.length, 1);
    const csv = textsCsv(groups);
    assert.match(csv, /^text;variants;uses;where\n"&Enregistrer";2;2;"U.a, U.b"/);
});

test('the prefix of a name and the names the IDE gives', () => {
    assert.equal(namePrefix('btnSave'), 'btn');
    assert.equal(namePrefix('cxgtvPPECHSolder'), 'cxgtv');
    assert.equal(namePrefix('edt_Nom'), 'edt');
    assert.equal(namePrefix('Button1'), '');
    assert.equal(namePrefix('panel'), '', 'a name all in lower case has no prefix');
    assert.equal(namePrefix('x1'), '');
    assert.ok(isDefaultName('Button12', 'TButton'));
    assert.ok(!isDefaultName('btnSave', 'TButton'));
});

const names = (list: [string, string][]): string => ['object F: TF', ...list.flatMap(([n, c]) => [`  object ${n}: ${c}`, '  end']), 'end'].join('\n');

test('the convention is what the project does, and what departs from it is reported', () => {
    const dfm = names([['btnA', 'TButton'], ['btnB', 'TButton'], ['btnC', 'TButton'], ['cmdD', 'TButton'], ['Button1', 'TButton'], ['edtA', 'TEdit'], ['edtB', 'TEdit']]);
    const conv = conventions([{ dfm }]);
    assert.equal(conv.get('TButton')!.prefix, 'btn');
    assert.ok(!conv.has('TEdit'), 'two components are not a convention');
    const issues = namingIssues([{ unit: 'U', dfm }]);
    assert.deepEqual(issues.map(i => [i.component, i.suggestion, i.isDefault]), [['cmdD', 'btnD', false], ['Button1', 'btnButton1', true]]);
    assert.match(issues[1].message, /name the IDE gave/);
    assert.match(issues[0].message, /80% of 5|cmd/);
    // two forms count together, the settings win
    const other = names([['btnE', 'TButton'], ['btnF', 'TButton']]);
    assert.equal(namingIssues([{ unit: 'U', dfm }, { unit: 'V', dfm: other }]).length, 2);
    const forced = namingIssues([{ unit: 'U', dfm: other }], { TButton: 'cmd' });
    assert.deepEqual(forced.map(i => i.suggestion), ['cmdE', 'cmdF']);
    assert.equal(namingIssues([{ unit: 'U', dfm: 'not a dfm' }]).length, 0);
});

test('a component with no name is never in a convention', () => {
    const dfm = ['object F: TF', '  object a: TcxGridDBColumn', '  end', '  object b: TcxGridDBColumn', '  end', '  object c: TcxGridDBColumn', '  end', '  object TcxGridDBColumn', '  end', 'end'].join('\n');
    assert.equal(namingIssues([{ unit: 'U', dfm }]).length, 0);
});
