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
