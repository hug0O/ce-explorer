import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findNameHits } from '../utils/plsqlReferences';

test('find a name in code, strings and comments, with line and column', () => {
    const text = [
        'BEGIN',
        "  pkg_orders.close_order(1);",
        "  log('close_order failed');",
        '  -- see close_order',
        '  close_order;',
        'END;',
    ].join('\n');
    const hits = findNameHits(text, 'close_order');
    assert.deepEqual(hits.map(h => [h.line, h.col]), [[1, 13], [2, 7], [3, 9], [4, 2]]);
});

test('a longer identifier is not a hit, and the match is case-insensitive', () => {
    const text = 'total := total_amount + Total;\nlegal_total;';
    assert.deepEqual(findNameHits(text, 'total').map(h => [h.line, h.col]), [[0, 0], [0, 24]]);
});

test('a qualifier keeps only the calls written as qualifier.name, and reports it', () => {
    const text = 'orders.close_order;\nbilling.close_order;\nclose_order;';
    const all = findNameHits(text, 'close_order');
    assert.deepEqual(all.map(h => h.qualifier), ['orders', 'billing', '']);
    assert.deepEqual(findNameHits(text, 'close_order', 'ORDERS').map(h => h.line), [0]);
});

test('names with $ and # are matched literally', () => {
    assert.equal(findNameHits('a$b; axb;', 'a$b').length, 1);
    assert.equal(findNameHits('x#y; x#yz;', 'x#y').length, 1);
});

test('a name that is absent or not an identifier gives nothing', () => {
    assert.deepEqual(findNameHits('select 1 from dual;', 'close_order'), []);
    assert.deepEqual(findNameHits('anything', ''), []);
});
