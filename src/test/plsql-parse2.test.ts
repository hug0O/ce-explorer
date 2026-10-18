import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { parsePlSqlUnits } from '../utils/plsqlParse';
import { acceptsContent, looksLikeSql } from '../utils/plsqlSniff';
import { cleanPlSql, findClose, lineStartsOf, tokenize } from '../utils/plsqlScan';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'oracle');
const read = (f: string) => fs.readFileSync(path.join(dir, f), 'utf8');

test('scanner: comments and strings are blanked, offsets kept', () => {
    const src = "a := 'x -- y'; -- c\n/* b\n end */ end;";
    const clean = cleanPlSql(src);
    assert.equal(clean.length, src.length);
    assert.ok(!clean.includes('--') && !clean.includes('/*'));
    assert.match(clean, /a := '\s+';/);
    assert.equal(tokenize(clean, lineStartsOf(clean)).filter(t => t.up === 'END').length, 1, 'END inside the comment is gone');
});

test('scanner: END IF / END LOOP / CASE / nested subprograms do not close the member early', () => {
    const src = 'PROCEDURE p IS\n  PROCEDURE n IS BEGIN NULL; END n;\nBEGIN\n  IF a THEN x := CASE b WHEN 1 THEN 2 END; END IF;\n  FOR i IN 1..2 LOOP NULL; END LOOP;\n  BEGIN NULL; END;\nEND p;\nafter';
    const clean = cleanPlSql(src);
    const toks = tokenize(clean, lineStartsOf(src));
    const isIdx = toks.findIndex(t => t.up === 'IS');
    const close = findClose(toks, isIdx + 1, 'sub')!;
    assert.equal(toks[close.closeIdx + 1].text, 'p', 'closes at END p');
    assert.equal(toks[close.beginIdx!].line, 2, 'body starts at the outer BEGIN, not the nested one');
});

test('package spec: subprogram declarations, constants, exceptions, types and cursors', () => {
    const [spec] = parsePlSqlUnits(read('orders.pks'));
    assert.equal(spec.kind, 'package');
    assert.equal(spec.name, 'pkg_orders');
    assert.deepEqual(spec.members.map(m => `${m.kind}:${m.name}`), [
        'constant:c_max_lines', 'exception:e_closed', 'variable:g_last_id',
        'procedure:create_order', 'function:get_status', 'function:count_open', 'procedure:close_order',
    ]);
    const create = spec.members.find(m => m.name === 'create_order')!;
    assert.equal(create.isDeclaration, true);
    assert.deepEqual(create.params.map(p => `${p.name}:${p.direction}:${p.type}`), [
        'p_customer_id:in:customers.customer_id%TYPE', 'p_total:in:NUMBER', 'p_order_id:out:NUMBER',
    ]);
    assert.equal(create.params[1].defaultValue, '0');
    assert.equal(spec.members.find(m => m.name === 'count_open')!.returnType, 'PLS_INTEGER');
    assert.equal(spec.members.find(m => m.name === 'g_last_id')!.type, 'orders.order_id%TYPE');
});

test('package body: real bodies, END IF inside, nested function, private helper, init section', () => {
    const [body] = parsePlSqlUnits(read('orders.pkb'));
    assert.equal(body.kind, 'package body');
    assert.deepEqual(body.members.map(m => m.name), ['g_calls', 'log_msg', 'create_order', 'get_status', 'count_open', 'close_order']);
    const create = body.members.find(m => m.name === 'create_order')!;
    assert.equal(create.isDeclaration, false);
    const lines = read('orders.pkb').split(/\r?\n/);
    assert.match(lines[create.endLine], /END create_order;/, 'END IF / END LOOP did not close it early');
    assert.match(lines[create.beginLine!], /^\s*BEGIN/);
    const status = body.members.find(m => m.name === 'get_status')!;
    assert.match(lines[status.endLine], /END get_status;/, 'nested FUNCTION label … CASE … END did not close it early');
    assert.match(lines[body.endLine], /END pkg_orders;/);
    assert.ok(body.closeOffset > 0 && read('orders.pkb').slice(body.closeOffset).startsWith('END pkg_orders'));
});

test('script: tables, triggers, procedures and anonymous blocks of a .txt full of SQL', () => {
    const units = parsePlSqlUnits(read('script.txt'));
    assert.deepEqual(units.map(u => `${u.kind}:${u.name}`), [
        'table:customers', 'table:orders', 'trigger:trg_orders_bi', 'procedure:purge_old', 'block:anon_block_L35',
    ]);
    const orders = units[1];
    assert.deepEqual(orders.members.map(c => c.name), ['order_id', 'customer_id', 'total', 'status']);
    assert.deepEqual(orders.primaryKey, ['order_id']);
    assert.equal(orders.members[0].column?.primaryKey, true);
    assert.equal(orders.members[0].column?.nullable, false);
    assert.equal(orders.members[2].type, 'NUMBER(12,2)');
    assert.equal(units[0].members.find(c => c.name === 'created_at')!.type, 'DATE');
    assert.equal(units[0].members.find(c => c.name === 'email')!.column?.nullable, true);
    const trig = units[2].members[0];
    assert.equal(trig.isDeclaration, false);
});

test('sniffing: .txt is source only when it holds SQL, .sql / .pkb always', () => {
    assert.equal(looksLikeSql(read('script.txt')), true);
    assert.equal(looksLikeSql('Compte rendu de reunion.\nOn a parle de begin et de end; sans code.'), false);
    assert.equal(looksLikeSql('select * from a;\nupdate b set x = 1;'), true);
    assert.equal(looksLikeSql('Bonjour, voici ma liste de courses; pain, lait'), false);
    assert.equal(acceptsContent('/p/notes.txt', 'hello'), false);
    assert.equal(acceptsContent('/p/notes.TXT', read('script.txt')), true);
    assert.equal(acceptsContent('/p/x.sql', 'whatever'), true);
    assert.equal(acceptsContent('/p/x.pkb', ''), true);
});
