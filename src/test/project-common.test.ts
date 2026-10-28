import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commonMetrics, commonSql } from '../services/ProjectCommon';

test('SQL in the code of any language: a string that starts with a statement, whatever the language', () => {
    const lines = [
        'def load(cur):',
        '    cur.execute("SELECT id, name FROM customers WHERE active = :a")',
        "    msg = 'the select menu is empty'",
        '    cur.execute(f"DELETE FROM orders WHERE id = {oid}")',
        'const q = `UPDATE invoices SET paid = 1 WHERE id = ${id}`;',
    ];
    const rows = commonSql('shop', lines);
    assert.deepEqual(rows.map(r => [r.kind, r.line, r.tables]), [
        ['select', 1, ['CUSTOMERS']],
        ['delete', 3, ['ORDERS']],
        ['update', 4, ['INVOICES']],
    ], 'a word in a message is not a statement');
    assert.deepEqual(rows[0].params, ['a']);
    assert.ok(rows.every(r => r.source === 'code' && r.unit === 'shop'));
});

test('a statement split over lines is joined while the literals follow each other', () => {
    const lines = [
        'sql = "SELECT a.id, "',
        '      "a.name "',
        '      "FROM accounts a "',
        '      "WHERE a.id = :id"',
        '',
        'other = "hello"',
    ];
    const rows = commonSql('acc', lines);
    assert.equal(rows.length, 1, '"hello" is not a statement');
    const [row] = rows;
    assert.equal(row.tables[0], 'ACCOUNTS');
    assert.deepEqual(row.params, ['id']);
    assert.deepEqual(row.text.split('\n').map(s => s.trim()), ['SELECT a.id,', 'a.name', 'FROM accounts a', 'WHERE a.id = :id'], 'the pieces, in order, without the line after');
});

test('metrics: lines of code, routines, and the long ones', () => {
    const lines = ['// header', '', 'def a():', '    pass', 'def b():'];
    for (let i = 0; i < 70; i++) { lines.push('    x = ' + i); }
    const m = commonMetrics(lines, [2, 4]);
    assert.equal(m.routines, 2);
    assert.equal(m.long, 1);
    assert.equal(m.longest, 71);
    assert.equal(m.lines, lines.length - 2, 'comments and blank lines are not counted');
});
