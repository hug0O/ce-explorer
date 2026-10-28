import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { parsePlSqlUnits } from '../utils/plsqlParse';
import { addStubToBody, addToSpec, applyChanges, compareUnits, findPair, updateBodyFromSpec, updateSpecFromBody } from '../utils/plsqlSync';
import { exceptionBlock, generatePackage, parseParamInput, parseSubstitutions, plDocHeader, sqlStatements, updatePlDoc, utplsqlTests } from '../utils/plsqlGen';
import { accessMode, declType, inferVariableType, paramType, planExtractProcedure } from '../utils/plsqlExtract';
import { reviewPlSqlText } from '../utils/plsqlReview';
import { alignDeclarations, alignPlSqlParams, applyAlignPreset } from '../utils/plsqlAlign';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'oracle');
const read = (f: string) => fs.readFileSync(path.join(dir, f), 'utf8');
const specText = read('orders.pks');
const bodyText = read('orders.pkb');

/* ───────── sync ───────── */

test('sync: the real spec and body differ by the private helper only', () => {
    const { specUnit, bodyUnit } = findPair(specText, bodyText);
    const diffs = compareUnits(specUnit!, bodyUnit!);
    assert.deepEqual(diffs.map(d => `${d.kind}:${d.name}`), ['missingInSpec:log_msg']);
});

test('sync: a subprogram added to the body is declared in the spec (and the result parses and matches)', () => {
    const body2 = bodyText.replace('  PROCEDURE close_order(', '  FUNCTION total_for(p_customer IN NUMBER, p_from IN DATE DEFAULT NULL) RETURN NUMBER IS\n  BEGIN\n    RETURN 0;\n  END total_for;\n\n  PROCEDURE close_order(');
    const { specUnit, bodyUnit } = findPair(specText, body2);
    const diffs = compareUnits(specUnit!, bodyUnit!);
    const add = diffs.find(d => d.name === 'total_for')!;
    assert.equal(add.kind, 'missingInSpec');
    const spec2 = applyChanges(specText, [addToSpec(specText, specUnit!, add.body!)]);
    assert.match(spec2, /FUNCTION total_for\(p_customer IN NUMBER, p_from IN DATE DEFAULT NULL\) RETURN NUMBER;\s+END pkg_orders;/);
    const again = findPair(spec2, body2);
    assert.deepEqual(compareUnits(again.specUnit!, again.bodyUnit!).map(d => d.name), ['log_msg'], 'only the private helper is left');
});

test('sync: a declaration without body gets a stub, before the initialization section', () => {
    const spec2 = specText.replace('END pkg_orders;', '  PROCEDURE archive(p_before IN DATE);\nEND pkg_orders;');
    const { specUnit, bodyUnit } = findPair(spec2, bodyText);
    const diff = compareUnits(specUnit!, bodyUnit!).find(d => d.name === 'archive')!;
    assert.equal(diff.kind, 'missingInBody');
    const body2 = applyChanges(bodyText, [addStubToBody(bodyText, bodyUnit!, diff.spec!)]);
    assert.match(body2, /PROCEDURE archive\(p_before IN DATE\) IS\s+BEGIN\s+NULL; -- TODO: implement\s+END archive;\s+BEGIN\s+g_calls := 0;/);
    const pair = findPair(spec2, body2);
    assert.deepEqual(compareUnits(pair.specUnit!, pair.bodyUnit!).map(d => d.name), ['log_msg']);
});

test('sync: signature mismatch is fixed in either direction', () => {
    const spec2 = specText.replace('FUNCTION get_status(p_order_id IN NUMBER) RETURN VARCHAR2;', 'FUNCTION get_status(p_order_id IN NUMBER, p_lang IN VARCHAR2) RETURN VARCHAR2;');
    const { specUnit, bodyUnit } = findPair(spec2, bodyText);
    const diff = compareUnits(specUnit!, bodyUnit!).find(d => d.kind === 'signatureMismatch')!;
    assert.equal(diff.name, 'get_status');
    const fixedSpec = applyChanges(spec2, [updateSpecFromBody(diff.spec!, diff.body!)]);
    assert.match(fixedSpec, /FUNCTION get_status\(p_order_id IN NUMBER\) RETURN VARCHAR2;/);
    const fixedBody = applyChanges(bodyText, [updateBodyFromSpec(diff.body!, diff.spec!)]);
    assert.match(fixedBody, /FUNCTION get_status\(p_order_id IN NUMBER, p_lang IN VARCHAR2\) RETURN VARCHAR2 IS/);
    const pair = findPair(spec2, fixedBody);
    assert.ok(!compareUnits(pair.specUnit!, pair.bodyUnit!).some(d => d.kind === 'signatureMismatch'));
});

/* ───────── generators ───────── */

test('generate a package skeleton: spec and body agree with each other', () => {
    const { spec, body } = generatePackage('pkg_demo', [
        { kind: 'procedure', name: 'run_it', params: parseParamInput('p_id NUMBER, p_msg OUT VARCHAR2') },
        { kind: 'function', name: 'compute', params: [], returns: 'NUMBER' },
    ], { author: 'me', date: '2026-10-18' });
    const pair = findPair(spec, body);
    assert.deepEqual(compareUnits(pair.specUnit!, pair.bodyUnit!), []);
    assert.deepEqual(pair.specUnit!.members.map(m => m.name), ['run_it', 'compute']);
    assert.match(spec, /@param p_msg OUT VARCHAR2/);
    assert.match(spec, /@author me/);
    assert.deepEqual(parseParamInput('a IN OUT t.c%TYPE, b').map(p => `${p.name}:${p.mode}:${p.type}`), ['a:IN OUT:t.c%TYPE', 'b:IN:VARCHAR2']);
});

test('SQL statements from a CREATE TABLE: select, insert, update, delete, merge', () => {
    const table = parsePlSqlUnits(read('script.txt')).find(u => u.name === 'orders')!;
    const cols = table.members.map(c => ({ name: c.name, type: c.type!, nullable: c.column!.nullable, primaryKey: c.column!.primaryKey }));
    const r = sqlStatements('orders', cols, table.primaryKey!, ['select', 'insert', 'update', 'delete', 'merge']);
    const { sql } = r as { sql: string };
    assert.match(sql, /INSERT INTO orders \(order_id, customer_id, total, status\)\nVALUES \(:order_id, :customer_id, :total, :status\);/);
    assert.match(sql, /UPDATE orders\n {3}SET customer_id = :customer_id,\n {7}total = :total,\n {7}status = :status\n WHERE order_id = :order_id;/);
    assert.match(sql, /DELETE FROM orders\n WHERE order_id = :order_id;/);
    assert.match(sql, /MERGE INTO orders t\b[\s\S]*ON \(t\.order_id = s\.order_id\)\n WHEN MATCHED THEN\n {3}UPDATE SET t\.customer_id = s\.customer_id/);
    assert.match(sql, /WHEN NOT MATCHED THEN\n {3}INSERT \(order_id, customer_id, total, status\)\n {3}VALUES \(s\.order_id, s\.customer_id, s\.total, s\.status\);/);
});

test('SQL substitutions replace the binds by values or parameters', () => {
    const cols = [
        { name: 'id', type: 'NUMBER', nullable: false, primaryKey: true },
        { name: 'status', type: 'VARCHAR2(10)', nullable: true, primaryKey: false },
        { name: 'updated_at', type: 'DATE', nullable: true, primaryKey: false },
    ];
    const subs = parseSubstitutions('updated_at=SYSDATE; STATUS=:p_status', ['id', 'status', 'updated_at']);
    assert.deepEqual(subs, { values: { updated_at: 'SYSDATE', status: ':p_status' } });
    const { sql } = sqlStatements('t', cols, ['id'], ['update', 'insert'], (subs as { values: Record<string, string> }).values) as { sql: string };
    assert.match(sql, /SET status = :p_status,\n {7}updated_at = SYSDATE\n WHERE id = :id;/);
    assert.match(sql, /VALUES \(:id, :p_status, SYSDATE\);/);
    assert.match((parseSubstitutions('nope=1', ['id']) as { error: string }).error, /not a column/);
    assert.match((parseSubstitutions('id', ['id']) as { error: string }).error, /column=value/);
    assert.match((sqlStatements('t', cols, [], ['select']) as { error: string }).error, /PRIMARY KEY/);
    assert.deepEqual(sqlStatements('t', cols, [], ['insert']).sql.split('\n')[0], '-- INSERT a row', 'insert needs no key');
});

test('exception block, PLDoc header and its refresh', () => {
    assert.match(exceptionBlock('    '), /^ {4}EXCEPTION\n {6}WHEN NO_DATA_FOUND THEN/);
    const create = parsePlSqlUnits(specText)[0].members.find(m => m.name === 'create_order')!;
    const header = plDocHeader(create, { author: 'moi' }, '  ', 'Cree une commande.');
    assert.match(header, /^ {2}\/\*\*\n {2} \* Cree une commande\.\n {2} \* @param p_customer_id IN customers\.customer_id%TYPE/);

    const edited = header.replace('@param p_total IN NUMBER', '@param p_total montant TTC');
    const changed = { ...create, params: [...create.params.filter(p => p.name !== 'p_order_id'), { name: 'p_currency', type: 'VARCHAR2', direction: 'in' as const, nocopy: false }] };
    const refreshed = updatePlDoc(edited, changed);
    assert.match(refreshed, /@param p_total montant TTC/, 'hand-written parameter descriptions are kept');
    assert.match(refreshed, /@param p_currency IN VARCHAR2/, 'new parameters are added');
    assert.doesNotMatch(refreshed, /p_order_id/, 'removed parameters are dropped');
    assert.match(refreshed, /@author moi/, 'other tags are kept');
});

test('utPLSQL test package for a spec', () => {
    const { spec, body } = utplsqlTests(parsePlSqlUnits(specText)[0]);
    assert.match(spec, /CREATE OR REPLACE PACKAGE ut_orders AS\s+--%suite\(pkg_orders\)/);
    assert.match(spec, /--%test\(get_status works as expected\)\s+PROCEDURE test_get_status;/);
    assert.match(body, /ut\.expect\(l_actual\)\.to_equal\(l_expected\);/);
    assert.match(body, /l_actual VARCHAR2\(4000\);/, 'unsized VARCHAR2 result gets a length');
    const pair = findPair(spec, body);
    assert.deepEqual(compareUnits(pair.specUnit!, pair.bodyUnit!), []);
});

/* ───────── extract & inference ───────── */

const SRC = [
    'CREATE OR REPLACE PACKAGE BODY p AS',
    '  PROCEDURE work(p_qty IN NUMBER, p_out OUT NUMBER) IS',
    '    l_sub  NUMBER;',
    '    l_tax  NUMBER;',
    '    l_name VARCHAR2(50);',
    '  BEGIN',
    '    l_name := \'x\';',
    '    l_sub := p_qty * 100;',
    '    l_tax := l_sub * 0.2;',
    '    p_out := l_sub + l_tax;',
    '    DBMS_OUTPUT.put_line(l_name);',
    '  END work;',
    'END p;',
].join('\n');

test('access mode: IN, OUT, IN OUT', () => {
    assert.equal(accessMode('x := a + 1;', 'a'), 'IN');
    assert.equal(accessMode('x := a + 1;', 'x'), 'OUT');
    assert.equal(accessMode('x := x + 1;', 'x'), 'IN OUT');
    assert.equal(accessMode('SELECT 1 INTO r FROM dual; y := r;', 'r'), 'OUT');
    assert.equal(accessMode('y := r; SELECT 1 INTO r FROM dual;', 'r'), 'IN OUT');
    assert.equal(paramType('VARCHAR2(50)'), 'VARCHAR2');
    assert.equal(paramType('NUMBER(10,2)'), 'NUMBER');
    assert.equal(paramType('t.c%TYPE'), 't.c%TYPE');
    assert.equal(declType('VARCHAR2'), 'VARCHAR2(4000)');
});

test('extract procedure: parameters, locals moved inside, call replaces the selection', () => {
    const member = parsePlSqlUnits(SRC)[0].members[0];
    const lines = SRC.split('\n');
    const lineStart = (n: number) => lines.slice(0, n).join('\n').length + (n ? 1 : 0);
    const plan = planExtractProcedure({
        text: SRC, member, name: 'compute_total',
        selStart: lineStart(7), selEnd: lineStart(9) + lines[9].length,
        memberLineStart: lineStart(1),
    });
    assert.ok(!('error' in plan), 'error' in plan ? plan.error : '');
    const ok = plan as { changes: { offset: number; length: number; text: string }[]; params: string[]; movedLocals: string[] };
    assert.deepEqual(ok.params, ['p_qty IN NUMBER', 'p_out OUT NUMBER']);
    assert.deepEqual(ok.movedLocals, ['l_sub', 'l_tax'], 'locals used only in the selection move into the new procedure');
    const out = applyChanges(SRC, ok.changes);
    assert.match(out, /PROCEDURE compute_total\(\n\s+p_qty IN NUMBER,/);
    assert.match(out, /^ {4}compute_total\(p_qty, p_out\);$/m);
    assert.match(out, /PROCEDURE compute_total[\s\S]*l_sub NUMBER;[\s\S]*BEGIN[\s\S]*END compute_total;/);
    assert.equal((out.match(/l_sub +NUMBER;/g) ?? []).length, 1, 'the original declaration is gone');
    const reparsed = parsePlSqlUnits(out)[0];
    assert.deepEqual(reparsed.members.map(m => m.name), ['compute_total', 'work']);
    assert.match(out, /END compute_total;/);
});

test('extract procedure: refuses RETURN and selections outside the body', () => {
    const src = SRC.replace("l_name := 'x';", 'RETURN;');
    const member = parsePlSqlUnits(src)[0].members[0];
    const off = src.indexOf('RETURN;');
    assert.match((planExtractProcedure({ text: src, member, name: 'x', selStart: off, selEnd: off + 7, memberLineStart: 0 }) as { error: string }).error, /RETURN/);
    assert.match((planExtractProcedure({ text: SRC, member: parsePlSqlUnits(SRC)[0].members[0], name: 'x', selStart: 10, selEnd: 20, memberLineStart: 0 }) as { error: string }).error, /BEGIN/);
});

test('type inference for an undeclared variable', () => {
    const body = "SELECT nom, age INTO v_nom, v_age FROM clients c WHERE c.id = p_id;\nv_label := 'x' || v_nom;\nv_d := SYSDATE;\nv_n := 3;\nv_cnt := COUNT(*);\nFETCH cur INTO rec;\nv_copy := p_qty;\nSELECT COUNT(*) INTO v_total FROM orders;";
    const known = [{ name: 'p_qty', type: 'NUMBER' }];
    assert.equal(inferVariableType('v_nom', body, known), 'clients.nom%TYPE');
    assert.equal(inferVariableType('v_age', body, known), 'clients.age%TYPE');
    assert.equal(inferVariableType('v_label', body, known), 'VARCHAR2(4000)');
    assert.equal(inferVariableType('v_d', body, known), 'DATE');
    assert.equal(inferVariableType('v_n', body, known), 'PLS_INTEGER');
    assert.equal(inferVariableType('rec', body, known), 'cur%ROWTYPE');
    assert.equal(inferVariableType('v_copy', body, known), 'p_qty%TYPE');
    assert.equal(inferVariableType('v_total', body, known), 'NUMBER');
    assert.equal(inferVariableType('unknown_thing', body, known), undefined);
});

/* ───────── review ───────── */

test('review: Oracle rules fire on the sample package, not on clean code', () => {
    const findings = reviewPlSqlText(bodyText);
    const by = (cat: string, member: string) => findings.filter(f => f.category === cat && f.memberName === member);
    assert.equal(by('Error handling', 'create_order').filter(f => /WHEN OTHERS THEN NULL/.test(f.message)).length, 1);
    assert.equal(by('Performance', 'create_order').length, 1, 'UPDATE inside the FOR … LOOP');
    assert.equal(by('Transactions', 'close_order').length, 1, 'COMMIT inside a package procedure');
    assert.equal(by('Error handling', 'get_status').length, 1, 'SELECT … INTO without EXCEPTION');
    assert.equal(by('Debug', 'log_msg').length, 1);
    assert.ok(findings.some(f => f.category === 'Dead code' || f.memberName !== 'log_msg'));
    assert.equal(by('Error handling', 'count_open').length, 1);
});

test('review: NULL comparison, dynamic SQL, application error codes, unclosed cursor, function without RETURN', () => {
    const src = [
        'CREATE OR REPLACE PROCEDURE bad(p_x IN NUMBER, p_unused IN NUMBER) IS',
        '  CURSOR c IS SELECT 1 FROM dual;',
        '  l_never NUMBER;',
        'BEGIN',
        '  IF p_x = NULL THEN NULL; END IF;',
        "  EXECUTE IMMEDIATE 'DELETE FROM t WHERE id = ' || p_x;",
        "  RAISE_APPLICATION_ERROR(-100, 'oops');",
        '  OPEN c;',
        'END;',
        '/',
        'CREATE OR REPLACE FUNCTION nothing RETURN NUMBER IS',
        'BEGIN',
        '  NULL;',
        'END;',
    ].join('\n');
    const msgs = reviewPlSqlText(src).map(f => f.message);
    for (const re of [/Comparison with NULL/, /Dynamic SQL/, /between -20999 and -20000/, /never closed/, /no RETURN/, /Parameter p_unused/, /Variable l_never/]) {
        assert.ok(msgs.some(m => re.test(m)), String(re));
    }
});

test('review: a private helper nobody calls is reported as dead code', () => {
    const spec = 'CREATE OR REPLACE PACKAGE k AS\n  PROCEDURE pub;\nEND k;\n/\n';
    const body = 'CREATE OR REPLACE PACKAGE BODY k AS\n  PROCEDURE helper IS\n  BEGIN\n    NULL;\n  END helper;\n  PROCEDURE pub IS\n  BEGIN\n    NULL;\n  END pub;\nEND k;\n/\n';
    const msgs = reviewPlSqlText(spec + body).filter(f => f.category === 'Dead code').map(f => f.message);
    assert.deepEqual(msgs, ['Private procedure helper is never called']);
    assert.deepEqual(reviewPlSqlText(spec + body.replace('NULL;\n  END pub;', 'helper;\n  END pub;')).filter(f => f.category === 'Dead code'), []);
});

/* ───────── alignment ───────── */

test('align a parameter list into name | mode | type columns', () => {
    const r = alignPlSqlParams(['    p_id IN NUMBER,', '    p_customer_name OUT VARCHAR2,', '    p_flag IN OUT BOOLEAN DEFAULT FALSE']);
    assert.deepEqual(r.lines, [
        '    p_id            IN     NUMBER,',
        '    p_customer_name OUT    VARCHAR2,',
        '    p_flag          IN OUT BOOLEAN DEFAULT FALSE',
    ]);
});

test('align declarations and other presets', () => {
    const d = alignDeclarations(['  l_a NUMBER;', '  l_long_name VARCHAR2(10) := \'x\';', '  c_max CONSTANT PLS_INTEGER := 5;']);
    assert.deepEqual(d.lines.map(l => l.indexOf(':=')).filter(i => i >= 0).length, 2);
    assert.equal(new Set(d.lines.filter(l => l.includes(':=')).map(l => l.indexOf(':='))).size, 1, ':= in one column');
    assert.equal(applyAlignPreset('assign', ['a := 1;', 'bbb := 2;']).lines[0], 'a   := 1;');
    assert.equal(applyAlignPreset('arrow', ['p_a => 1,', 'p_longer => 2']).lines[0], 'p_a      => 1,');
});
