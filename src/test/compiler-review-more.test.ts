import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewLanguage } from '../utils/compilerReview';
import { reviewPlSqlText } from '../utils/plsqlReview';

const run = (src: string, lang = 'typescript'): ReturnType<typeof reviewLanguage> => reviewLanguage(src.split('\n'), lang, 'a.ts');

test('code inside a template literal is code, a regular expression literal is not', () => {
    const f = run([
        'const name = 1;', 'const other = 2;', 'const msg = `hello ${name} and ${ `inner ${other}` }`;', 'const re = /a != b|console.log\\(/g;', 'const big = a / b / c;',
        'const multi = `line one', '  ${msg}', '`;', 'log(msg, re, big, multi);',
    ].join('\n'));
    assert.deepEqual(f.map(x => x.code ?? x.message), [], 'name, other and msg are used inside the templates; nothing in the regex is read as code');
});

test('a function declared after a return is not unreachable code', () => {
    const f = run(['function outer() {', '  return inner();', '  function inner() { return 1; }', '}'].join('\n'));
    assert.deepEqual(f.filter(x => x.code === 'TS7027'), []);
});

test('PL/SQL: Oracle compiler warnings by their numbers, and a loop that never ends', () => {
    const src = [
        'CREATE OR REPLACE PACKAGE BODY pkg IS', '  FUNCTION f(p NUMBER) RETURN NUMBER IS', '  BEGIN', '    IF p > 0 THEN', '      RETURN 1;', '      DBMS_OUTPUT.PUT_LINE(\'never\');', '    END IF;',
        '    RETURN 0;', '  END f;', '', '  PROCEDURE p IS', '    n NUMBER := 0;', '  BEGIN', '    LOOP', '      n := n + 1;', '    END LOOP;', '    LOOP', '      n := n + 1;', '      EXIT WHEN n > 3;',
        '    END LOOP;', '    FOR i IN 1..3 LOOP', '      n := n + i;', '    END LOOP;', '  EXCEPTION', '    WHEN OTHERS THEN', '      log_it;', '  END p;', 'END pkg;', '/',
    ].join('\n');
    const f = reviewPlSqlText(src);
    const unreachable = f.filter(x => x.code === 'PLW-06002');
    assert.equal(unreachable.length, 1);
    assert.equal(unreachable[0].line, 5, 'the statement after the RETURN of the IF branch');
    assert.equal(unreachable[0].severity, 'warning');
    const loops = f.filter(x => /LOOP without EXIT/.test(x.message));
    assert.equal(loops.length, 1, 'only the first LOOP has no way out: the second has EXIT, the FOR is bounded');
    assert.equal(loops[0].line, 13);
    const others = f.find(x => x.code === 'PLW-06009')!;
    assert.match(others.hint!, /RAISE/);
    assert.ok(!f.some(x => /RETURN 0/.test(x.message)), 'a RETURN at the end of a block is fine');
});
