import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyTextEdits, normalizeEdits } from '../services/DelphiForm';
import { parseDfmTree } from '../services/DelphiLayout';
import { verifyEdit, zOrderEdits } from '../services/DesignerModel';

const dfm = [
    'object F: TF', '  ClientHeight = 200', '  ClientWidth = 300',
    '  object a: TPanel', '    Left = 0', '    Top = 0', '    Width = 50', '    Height = 50', '  end',
    '  object b: TPanel', '    Left = 10', '    Top = 10', '    Width = 50', '    Height = 50',
    '    object inner: TButton', '      Left = 1', '      Top = 1', '      Width = 30', '      Height = 20', '    end',
    '  end',
    '  object c: TPanel', '    Left = 20', '    Top = 20', '    Width = 50', '    Height = 50', '  end',
    '  object d: TPanel', '    Left = 30', '    Top = 30', '    Width = 50', '    Height = 50', '  end',
    'end', '',
].join('\n');

const order = (text: string): string[] => parseDfmTree(text)!.children.map(c => c.name);
const run = (names: string[], dir: 'front' | 'back'): string => {
    const r = zOrderEdits(dfm, names, dir);
    assert.ok(!('error' in r), 'error' in r ? r.error : '');
    const n = normalizeEdits(r.dfmEdits);
    assert.ok(!('error' in n), 'error' in n ? n.error : '');
    const out = applyTextEdits(dfm, n.edits);
    assert.equal(verifyEdit(dfm, out, { touched: names, props: [] }), undefined, 'the .dfm changes only in the order');
    return out;
};

test('bring to front moves the block to the end of its parent, with what it holds', () => {
    assert.deepEqual(order(run(['a'], 'front')), ['b', 'c', 'd', 'a']);
    const out = run(['b'], 'front');
    assert.deepEqual(order(out), ['a', 'c', 'd', 'b']);
    assert.deepEqual(parseDfmTree(out)!.children.find(c => c.name === 'b')!.children.map(c => c.name), ['inner'], 'its button travels with it');
});

test('send to back moves it to the start, and several keep their order', () => {
    assert.deepEqual(order(run(['d'], 'back')), ['d', 'a', 'b', 'c']);
    assert.deepEqual(order(run(['c', 'd'], 'back')), ['c', 'd', 'a', 'b']);
    assert.deepEqual(order(run(['a', 'c'], 'front')), ['b', 'd', 'a', 'c']);
});

test('what is already in place stays, and a part with no place of its own is refused', () => {
    const none = zOrderEdits(dfm, ['d'], 'front');
    assert.ok(!('error' in none) && none.dfmEdits.length === 0, 'already in front: nothing to write');
    assert.deepEqual(order(run(['a', 'd'], 'front')), ['b', 'c', 'a', 'd'], 'the one already in front stays, the other goes before it');
    assert.match((zOrderEdits(dfm, ['nope'], 'front') as { error: string }).error, /Select components/);
});
