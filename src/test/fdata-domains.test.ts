import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fieldOfDomain, fieldOfOracleType } from '../services/FdataDomains';
import { guessFieldClass } from '../services/DesignerFields';

test('an FDATA domain gives the field class of its Oracle type', () => {
    assert.deepEqual(fieldOfDomain('FLG'), { cls: 'TIntegerField' });
    assert.deepEqual(fieldOfDomain('CLI_IDT'), { cls: 'TIntegerField' });
    assert.deepEqual(fieldOfDomain('ART_CMNT'), { cls: 'TWideStringField', size: 4000 });
    assert.deepEqual(fieldOfDomain('NCMNT'), { cls: 'TWideStringField', size: 2000 });
    assert.deepEqual(fieldOfDomain('CLI_DESI'), { cls: 'TStringField', size: 50 });
    assert.deepEqual(fieldOfDomain('CODE'), { cls: 'TStringField', size: 10 });
    assert.deepEqual(fieldOfDomain('IMG'), { cls: 'TStringField', size: 1 });
    assert.deepEqual(fieldOfDomain('ART_PRX'), { cls: 'TFloatField' });
    assert.deepEqual(fieldOfDomain('X_DAT'), { cls: 'TDateField' });
    assert.deepEqual(fieldOfDomain('X_DAHE'), { cls: 'TDateTimeField' });
    assert.deepEqual(fieldOfDomain('X_HEUR'), { cls: 'TTimeField' });
    assert.deepEqual(fieldOfDomain('SQL'), { cls: 'TMemoField' });
    assert.deepEqual(fieldOfDomain('NSQL'), { cls: 'TWideMemoField' });
    assert.deepEqual(fieldOfDomain('BLOB'), { cls: 'TBlobField' });
    assert.deepEqual(fieldOfDomain('LARGINT'), { cls: 'TLargeintField' });
    assert.deepEqual(fieldOfDomain('SHORT_DATE'), { cls: 'TIntegerField' });
});

test('the longest domain wins and a name that only contains a code is not of that domain', () => {
    assert.deepEqual(fieldOfDomain('SEQ_ALPHANUM'), { cls: 'TStringField', size: 1 });
    assert.deepEqual(fieldOfDomain('ART_SEQ'), { cls: 'TIntegerField' });
    assert.deepEqual(fieldOfDomain('SITE_WEB'), { cls: 'TStringField', size: 100 });
    assert.equal(fieldOfDomain('CODEX'), undefined);
    assert.equal(fieldOfDomain('NOM'), undefined);
});

test('an Oracle type alone gives a class too', () => {
    assert.deepEqual(fieldOfOracleType('NUMBER(20,8)'), { cls: 'TFloatField' });
    assert.deepEqual(fieldOfOracleType('NUMBER(12)'), { cls: 'TLargeintField' });
    assert.deepEqual(fieldOfOracleType('varchar2(30)'), { cls: 'TStringField', size: 30 });
    assert.equal(fieldOfOracleType('XMLTYPE'), undefined);
});

test('creating the fields of a SELECT uses the domain of each column, then the old guess', () => {
    assert.deepEqual(guessFieldClass('CLI_FLG'), { cls: 'TIntegerField' });
    assert.deepEqual(guessFieldClass('TARIF_ID'), { cls: 'TFloatField' });
});

import { checkForm, fixIssue } from '../services/DelphiCheck';
import { applyTextEdits } from '../services/DelphiForm';

const PAS = `unit U;

interface

uses
  Forms, Data.DB, Uni;

type
  TForm1 = class(TForm)
    UniQuery1: TUniQuery;
    UniQuery1CLI_FLG: TStringField;
    UniQuery1CLI_CMNT: TWideStringField;
    UniQuery1CLI_DESI: TStringField;
  end;

var
  Form1: TForm1;

implementation

end.
`;
const DFM = `object Form1: TForm1
  object UniQuery1: TUniQuery
    object UniQuery1CLI_FLG: TStringField
      FieldName = 'CLI_FLG'
      Size = 50
    end
    object UniQuery1CLI_CMNT: TWideStringField
      FieldName = 'CLI_CMNT'
      Size = 4000
    end
    object UniQuery1CLI_DESI: TStringField
      FieldName = 'CLI_DESI'
      Size = 20
    end
  end
end
`;

test('the check finds a persistent field that is not of its domain, and the fix changes the .dfm and the unit', () => {
    const issues = checkForm(PAS, DFM).filter(i => i.category === 'Domains');
    assert.deepEqual(issues.map(i => i.component), ['UniQuery1CLI_FLG', 'UniQuery1CLI_DESI'], 'CMNT is right, FLG has the wrong class, DESI the wrong size');
    const flg = fixIssue(PAS, DFM, issues[0], 'fieldType');
    assert.ok(!('error' in flg));
    if ('error' in flg) { return; }
    const dfm = applyTextEdits(DFM, flg.dfmEdits);
    const pas = applyTextEdits(PAS, flg.pasEdits);
    assert.match(dfm, /object UniQuery1CLI_FLG: TIntegerField\r?\n\s+FieldName = 'CLI_FLG'\r?\n\s+end/, 'the class changes and the Size of a number goes');
    assert.match(pas, /UniQuery1CLI_FLG: TIntegerField;/);
    assert.equal(checkForm(pas, dfm).filter(i => i.category === 'Domains').length, 1, 'only the size of DESI is left');
    const desi = fixIssue(pas, dfm, issues[1], 'fieldType');
    assert.ok(!('error' in desi));
    if ('error' in desi) { return; }
    assert.match(applyTextEdits(dfm, desi.dfmEdits), /CLI_DESI'\r?\n\s+Size = 50/);
});
