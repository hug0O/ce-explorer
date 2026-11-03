import { test } from 'node:test';
import * as fs from 'fs';
import * as path from 'path';
import assert from 'node:assert/strict';
import { applyChanges, callsTouched, permutation, reorderArguments } from '../utils/paramOrder';
import { familyOf } from '../utils/callGraph';

test('a reorder is told from an edit that adds, removes or renames', () => {
    assert.deepEqual(permutation(['a', 'b', 'c'], ['c', 'a', 'b']), [2, 0, 1]);
    assert.deepEqual(permutation(['A', 'b'], ['b', 'a']), [1, 0], 'case does not matter');
    assert.equal(permutation(['a', 'b'], ['a', 'b']), undefined, 'the same order');
    assert.equal(permutation(['a', 'b'], ['a', 'c']), undefined, 'a rename');
    assert.equal(permutation(['a', 'b'], ['a']), undefined, 'a removal');
    assert.equal(permutation(['a'], ['a']), undefined, 'one parameter has no order');
});

const run = (text: string, lang: string, routine: string, perm: number[], skip: number[] = []): string => applyChanges(text, reorderArguments(text, familyOf(lang)!, routine, perm, skip));

test('the arguments of the calls follow the new order of the parameters', () => {
    const pas = ['procedure Draw(X, Y: Integer; Name: string);', 'begin', 'end;', '', 'procedure Go;', 'begin', "  Draw(10, 20, 'a, b');", '  Draw(f(1, 2), g[3, 4], \'x\');', '  draw( 1 ,2,  Caption );', '  Draw(1, 2);', '  Self.Draw(5, 6, Name);', 'end;'].join('\n');
    const out = run(pas, 'pascal', 'Draw', [2, 0, 1], [0]);
    assert.equal(out.split('\n')[0], 'procedure Draw(X, Y: Integer; Name: string);', 'the declaration is not a call');
    assert.match(out, / {2}Draw\('a, b', 10, 20\);/, 'a comma in a string is not a separator');
    assert.match(out, / {2}Draw\('x', f\(1, 2\), g\[3, 4\]\);/, 'nested commas stay with their argument');
    assert.match(out, / {2}draw\( Caption ,1, {2}2 \);/, 'blanks stay where they were, case does not matter');
    assert.match(out, / {2}Draw\(1, 2\);/, 'a call with another number of arguments is left alone');
    assert.match(out, / {2}Self\.Draw\(Name, 5, 6\);/, 'a call through an object too');
});

test('other languages: calls in the code, not the comment or the string, not the definition', () => {
    const ts = ['function area(w: number, h: number) {', '  return w * h;', '}', '// area(1, 2) is documented here', 'const s = "area(1, 2)";', 'const a = area(3, 4) + area(5, 6);'].join('\n');
    const out = run(ts, 'typescript', 'area', [1, 0], [0]);
    assert.equal(out, ['function area(w: number, h: number) {', '  return w * h;', '}', '// area(1, 2) is documented here', 'const s = "area(1, 2)";', 'const a = area(4, 3) + area(6, 5);'].join('\n'));
    const py = 'def f(a, b, c):\n    pass\n\nf(1, 2, 3)\nx = f(g(1, 2), 4, 5)\n';
    assert.equal(run(py, 'python', 'f', [1, 2, 0], [0]), 'def f(a, b, c):\n    pass\n\nf(2, 3, 1)\nx = f(4, 5, g(1, 2))\n');
    const text = 'x(1,2)';
    const ch = reorderArguments(text, familyOf('typescript')!, 'x', [1, 0], []);
    assert.equal(callsTouched(ch, text, 'x'), 1, 'a call is counted once, whatever the arguments moved');
    assert.deepEqual(reorderArguments('f(1,', familyOf('typescript')!, 'f', [1, 0], []), [], 'an unclosed call is left alone');
    assert.deepEqual(reorderArguments('f(1, )', familyOf('typescript')!, 'f', [1, 0], []), [], 'an empty argument is not guessed');
});

test('the order is changed with up and down buttons in both forms, and a reorder offers the same change to the calls', () => {
    const read = (f: string): string => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    const side = read('webview/MemberViewerPanel.ts');
    assert.match(side, /ub\.textContent="▲"/);
    assert.match(side, /db\.textContent="▼"/);
    assert.match(side, /row\.parentNode\.insertBefore\(row,p\);schedule\(\)/, 'moving a row is a change: the preview follows');
    const bp = read('webview/blueprintHtml.ts');
    assert.match(bp, /up\.disabled = i === 0/, 'the first parameter cannot go up');
    assert.match(bp, /dn\.disabled = i === editForm\.params\.length - 1/, 'the last cannot go down');
    const ops = read('services/MemberOperations.ts');
    assert.match(ops, /const perm = permutation\(member\.parameters\.map\(p => p\.name\), result\.parameters\.map\(p => p\.name\)\)/);
    assert.match(ops, /if \(done && perm\) \{ await offerCallReorder\(/, 'only when the edit is a pure reorder and it was applied');
    assert.match(ops, /'Reorder the calls', 'Leave them'/, 'the user decides');
});
