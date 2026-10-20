import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { diffDfm, parseEntities } from '../services/DfmDiff';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');

const BEFORE = [
    'object F: TF',
    '  Caption = \'Old\'',
    '  object pnlA: TPanel',
    '    Left = 0',
    '    object btn: TButton',
    '      Left = 8',
    '      Caption = \'Go\'',
    '      OnClick = btnClick',
    '    end',
    '    object edt: TEdit',
    '      Text = \'x\'',
    '    end',
    '  end',
    '  object pnlB: TPanel',
    '  end',
    '  object q: TUniQuery',
    '    SQL.Strings = (',
    '      \'select 1\'',
    '      \'from dual\')',
    '  end',
    '  object gone: TLabel',
    '  end',
    'end',
].join('\n');

const AFTER = [
    'object F: TF',
    '  Caption = \'New\'',
    '  object pnlA: TPanel',
    '    Left = 10',
    '    object edt: TEdit',
    '      Text = \'x\'',
    '    end',
    '  end',
    '  object pnlB: TPanel',
    '    object btn: TButton',
    '      Left = 8',
    '      Caption = \'Go\'',
    '      OnClick = btnSaveClick',
    '    end',
    '    object grp: TGroupBox',
    '      object lbl: TLabel',
    '      end',
    '    end',
    '  end',
    '  object q: TUniQuery',
    '    SQL.Strings = (',
    '      \'select 2\'',
    '      \'from dual\')',
    '  end',
    '  object TcxGridDBColumn',
    '  end',
    'end',
].join('\n');

const find = (d: ReturnType<typeof diffDfm>, kind: string, component?: string) => d.changes.filter(c => c.kind === kind && (!component || c.component === component));

test('a component moved to another parent is a move, not a removal and an addition', () => {
    const d = diffDfm(BEFORE, AFTER);
    const moved = find(d, 'moved', 'btn');
    assert.equal(moved.length, 1);
    assert.deepEqual([moved[0].from, moved[0].to], ['F/pnlA', 'F/pnlB']);
    assert.equal(find(d, 'added', 'btn').length + find(d, 'removed', 'btn').length, 0);
});

test('added, removed (nested ones flagged) and nameless components', () => {
    const d = diffDfm(BEFORE, AFTER);
    assert.deepEqual(find(d, 'added').map(c => [c.component, c.nested]), [['grp', false], ['lbl', true], ['TcxGridDBColumn#1', false]]);
    assert.deepEqual(find(d, 'removed').map(c => c.component), ['gone']);
    assert.equal(find(d, 'removed')[0].side, 'old');
});

test('properties, events, multi-line values; layout told apart', () => {
    const d = diffDfm(BEFORE, AFTER);
    const caption = find(d, 'prop', 'F')[0];
    assert.deepEqual([caption.prop, caption.from, caption.to, caption.layout], ['Caption', '\'Old\'', '\'New\'', false]);
    const left = find(d, 'prop', 'pnlA')[0];
    assert.deepEqual([left.prop, left.from, left.to, left.layout], ['Left', '0', '10', true]);
    const click = find(d, 'event', 'btn')[0];
    assert.deepEqual([click.prop, click.from, click.to], ['OnClick', 'btnClick', 'btnSaveClick']);
    const sql = find(d, 'prop', 'q')[0];
    assert.equal(sql.prop, 'SQL.Strings');
    assert.ok(/select 1/.test(sql.from!) && /select 2/.test(sql.to!));
    assert.equal(d.layout, 1);
    assert.deepEqual(d.counts, { added: 3, removed: 1, moved: 1, class: 0, prop: 3, event: 1 });
});

test('the same form reindented, with CRLF, with its components reordered, is not a change', () => {
    const crlf = BEFORE.replace(/\n/g, '\r\n');
    assert.equal(diffDfm(BEFORE, crlf).changes.length, 0);
    const reordered = BEFORE.replace(/( {2}object pnlB: TPanel\n {2}end\n)([\s\S]*)( {2}object gone)/, '$2$1$3');
    assert.equal(diffDfm(BEFORE, reordered).changes.length, 0);
    const spaced = BEFORE.replace('Caption = \'Old\'', 'Caption   =   \'Old\'');
    assert.equal(diffDfm(BEFORE, spaced).changes.length, 0);
});

test('a class change is reported once, on the component', () => {
    const d = diffDfm('object F: TF\n  object x: TEdit\n  end\nend', 'object F: TF\n  object x: TMemo\n  end\nend');
    assert.deepEqual(d.changes.map(c => [c.kind, c.from, c.to]), [['class', 'TEdit', 'TMemo']]);
});

test('collections and binary data compare as a whole', () => {
    const a = 'object F: TF\n  object c: TX\n    Items = <\n      item\n        A = 1\n      end>\n    Data = {\n      0102\n      0304}\n  end\nend';
    const b = a.replace('A = 1', 'A = 2');
    const d = diffDfm(a, b);
    assert.deepEqual(d.changes.map(c => c.prop), ['Items']);
    assert.equal(diffDfm(a, a).changes.length, 0);
});

test('a real form read twice gives no difference, and one component removed gives one', () => {
    const dfm = fs.readFileSync(path.join(dir, 'WrappedForm.dfm'), 'utf8');
    assert.equal(diffDfm(dfm, dfm).changes.length, 0);
    assert.ok(parseEntities(dfm)!.children.length > 0);
    const without = dfm.replace(/ {2}object edtAfter: TEdit[\s\S]*?\n {2}end\n/, '');
    const d = diffDfm(dfm, without);
    assert.deepEqual(d.changes.map(c => [c.kind, c.component]), [['removed', 'edtAfter']]);
});

test('unreadable text gives an empty diff', () => {
    assert.equal(diffDfm('not a dfm', 'object F: TF\nend').changes.length, 0);
});
