import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { codeSql, decodeDelphiString, dfmSql, sqlKind, sqlParamIssues, sqlParams, sqlTables, unitSql } from '../services/ProjectSql';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');

test('Delphi string syntax: quotes, character codes and joins', () => {
    assert.equal(decodeDelphiString('\'it\'\'s\''), 'it\'s');
    assert.equal(decodeDelphiString('\'a\' #13#10 \'b\''), 'a\r\nb');
    assert.equal(decodeDelphiString('\'a\' + \'b\''), 'ab');
    assert.equal(decodeDelphiString('#$41'), 'A');
});

test('tables, parameters and kind of a statement', () => {
    const sql = 'select c.ID, c.NOM from CLIENTS c, VILLES v\nleft join PAYS p on p.ID = c.PAYS_ID\nwhere c.VILLE = :VILLE and c.X = :x and d = \':notaparam\' -- :nope';
    assert.deepEqual(sqlTables(sql), ['CLIENTS', 'VILLES', 'PAYS']);
    assert.deepEqual(sqlParams(sql), ['VILLE', 'x']);
    assert.equal(sqlKind(sql), 'select');
    assert.deepEqual(sqlTables('insert into SCH.T1 (a) values (1)'), ['SCH.T1']);
    assert.deepEqual(sqlTables('update T2 set a = (select 1 from dual)'), ['T2']);
    assert.deepEqual(sqlTables('delete from T3 where a in (select a from T4)'), ['T3', 'T4']);
    assert.equal(sqlKind('with x as (select 1 from dual) select * from x'), 'select');
    assert.equal(sqlKind('begin PKG.run(:a); end;'), 'begin');
    assert.deepEqual(sqlParams('a := :b; x := b::int'), ['b']);
});

test('the SQL of a query in the .dfm, whatever the way it is wrapped', () => {
    const dfm = fs.readFileSync(path.join(dir, 'NonVisualForm.dfm'), 'utf8');
    const found = dfmSql(dfm, 'NonVisualForm');
    assert.equal(found.length, 1);
    assert.equal(found[0].owner, 'UniQuery1');
    assert.equal(found[0].className, 'TUniQuery');
    assert.equal(found[0].text, 'select ID, NOM\nfrom CLIENTS\nwhere VILLE = :VILLE');
    assert.deepEqual(found[0].tables, ['CLIENTS']);
    assert.deepEqual(found[0].params, ['VILLE']);
    assert.equal(dfm.split('\n')[found[0].line].trim(), 'SQL.Strings = (', 'on the line of the property');

    const crlf = 'object F: TForm\r\n  object Q: TUniQuery\r\n    SQL.Strings = (\r\n      \'select 1\'\r\n      \'  from dual \'\'x\'\'\'\r\n      \'\')\r\n    ParamData = <\r\n      item\r\n        Name = \'A\'\r\n      end>\r\n  end\r\nend\r\n';
    assert.equal(dfmSql(crlf, 'F')[0].text, 'select 1\n  from dual \'x\'');
    const oneLine = 'object F: TForm\n  object Q: TADOQuery\n    SQL.Strings = (\'select 2 from t\')\n  end\nend\n';
    assert.equal(dfmSql(oneLine, 'F')[0].text, 'select 2 from t');
    const text = 'object F: TForm\n  object Q: TADOCommand\n    CommandText = \'delete from t\'\n  end\nend\n';
    assert.equal(dfmSql(text, 'F')[0].kind, 'delete');
});

const PAS = [
    'unit U;', 'interface', 'type', '  TF = class', '    procedure Go;', '    procedure Load(Sender: TObject);', '  end;', 'implementation',
    'procedure TF.Go;', 'begin',
    '  Q.SQL.Text := \'select a from T1 where b = :b\';',
    '  Q.ParamByName(\'b\').Value := 1;',
    '  Q.SQL.Text := \'select a \' + CRLF + \'from T2 where x = \' + QuotedStr(s);',
    '  // Q.SQL.Text := \'select commented from T9\';',
    '  Q2.SQL.Text := StringReplace(Q2.SQL.Text, \'--Filter\', \'--Filter\' + CRLF, [rfReplaceAll]);',
    '  Q3.SQL.Clear;',
    '  Q3.SQL.Add(\'select *\');',
    '  Q3.SQL.Add(\'  from T3\');',
    '  Q3.SQL.Add(\' where id = :id\');',
    '  AsyncRQSQL(FPool, 46805, fAjoutFiltre, True,',
    '    procedure(oQuery: TUniQuery) begin end);',
    'end;', '', 'procedure TF.Load(Sender: TObject);', 'begin',
    '  Q4.SQL.Text := Format(\'select * from %s where id = :id\', [Name]);',
    'end;', 'end.',
].join('\n');

test('SQL built in the code: assignments, Add calls, Format, and what is only adjusted', () => {
    const found = codeSql(PAS, 'U');
    const sqls = found.filter(e => e.source === 'code');
    assert.deepEqual(sqls.map(e => [e.component, e.owner, e.tables.join(','), e.dynamic]), [
        ['Q', 'Go', 'T1', false],
        ['Q', 'Go', 'T2', true],
        ['Q3', 'Go', 'T3', false],
        ['Q4', 'Load', '', true],
    ]);
    assert.equal(sqls[1].text, 'select a \nfrom T2 where x = ?', 'the part added at run time is a ?');
    assert.equal(sqls[2].text, 'select *\n  from T3\n where id = :id', 'consecutive Add calls are one statement');
    assert.deepEqual(sqls[2].params, ['id']);
    assert.ok(!found.some(e => /commented|Filter/.test(e.text)), 'a comment and a StringReplace of the existing SQL are not statements');
    assert.equal(sqls[3].tables.length, 0);
    const rq = found.filter(e => e.source === 'rq');
    assert.deepEqual(rq.map(e => [e.rq, e.owner]), [[46805, 'Go']]);
});

test('parameters set in the code against the ones of the SQL in the .dfm', () => {
    const dfm = [
        'object F: TF', '  object Q: TUniQuery', '    SQL.Strings = (', '      \'select * from T where a = :A and b = :B\')', '  end',
        '  object Q2: TUniQuery', '    SQL.Strings = (', '      \'select * from T where a = :A\')', '    MasterSource = ds', '  end',
        '  object Q3: TUniQuery', '    SQL.Strings = (', '      \'select * from T where a = :A\')', '  end', 'end',
    ].join('\n');
    const pas = ['unit U;', 'interface', 'implementation', 'procedure TF.Go;', 'begin',
        '  Q.ParamByName(\'a\').Value := 1;', '  Q.ParamByName(\'Zz\').Value := 2;', '  Q3.SQL.Text := Other;', '  Q3.ParamByName(\'whatever\').Value := 1;', 'end;', 'end.'].join('\n');
    const issues = sqlParamIssues('U', pas, dfm);
    assert.deepEqual(issues.map(i => [i.severity, i.file, i.message.slice(0, 60)]), [
        ['info', 'dfm', 'Q: parameter :B is never given a value in this unit'],
        ['warning', 'pas', 'Q.ParamByName(\'Zz\'): the SQL of Q has no parameter :Zz (it h'],
    ], 'Q2 is fed by its master, Q3 is rewritten by the code');
});

test('a unit as a whole, the .dfm first', () => {
    const dfm = fs.readFileSync(path.join(dir, 'NonVisualForm.dfm'), 'utf8');
    const pas = fs.readFileSync(path.join(dir, 'NonVisualForm.pas'), 'utf8');
    const all = unitSql('NonVisualForm', pas, dfm);
    assert.equal(all[0].source, 'dfm');
    assert.equal(unitSql('X', undefined, undefined).length, 0);
});
