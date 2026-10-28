import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addCallEdit, applyLineEdits, familyOf, findCalls, maskCode, removeCallEdit } from '../utils/callGraph';
import { depths, layout, nodeSize } from '../utils/blueprintLayout';

const PAS = familyOf('pascal')!;

test('the comments and the strings are blanked, the code stays where it was', () => {
    const src = "Foo; // Bar\n{ Baz }\nS := 'Qux'; (* Quux\nstill *) End;";
    const m = maskCode(src, PAS);
    assert.equal(m.length, src.length);
    assert.equal(m.split('\n').length, 4);
    for (const w of ['Bar', 'Baz', 'Qux', 'Quux', 'still']) { assert.ok(!m.includes(w), w + ' is blanked'); }
    assert.ok(m.includes('Foo;') && m.includes('End;'));
    assert.ok(!maskCode('call :a & rem call :b\n:: call :c', familyOf('bat')!).includes(':c'));
});

test('Pascal: who calls whom, by the bodies; Self., comments, strings and a call on another object are handled', () => {
    const lines = [
        'procedure TF.Load;',            // 0
        'begin',                          // 1
        '  Parse;',                       // 2
        '  Self.Check(1);',               // 3
        '  // Save;',                     // 4
        "  Log('Save');",                 // 5
        '  Other.Parse;',                 // 6
        'end;',                           // 7
        'procedure TF.Parse;',            // 8
        'begin',                          // 9
        '  Parse;',                       // 10
        '  check(2);',                    // 11
        'end;',                           // 12
        'procedure TF.Check(a: Integer);',// 13
        'begin',                          // 14
        'end;',                           // 15
        'procedure Log(s: string);',      // 16
        'begin end;',                     // 17
        'procedure TF.Save;',             // 18
        'begin',                          // 19
        'end;',                           // 20
    ];
    const r = (id: string, name: string, owner: string | undefined, a: number, b: number) => ({ id, name, owner, body: { start: a, end: b } });
    const routines = [r('Load', 'Load', 'TF', 0, 7), r('Parse', 'Parse', 'TF', 8, 12), r('Check', 'Check', 'TF', 13, 15), r('Log', 'Log', undefined, 16, 17), r('Save', 'Save', 'TF', 18, 20)];
    const { calls, recursive } = findCalls(routines, lines, PAS);
    const by = (from: string, to: string) => calls.find(c => c.from === from && c.to === to);
    assert.deepEqual(by('Load', 'Parse')!.lines, [2], 'Other.Parse is not a call of this Parse');
    assert.deepEqual(by('Load', 'Check')!.lines, [3]);
    assert.deepEqual(by('Load', 'Log')!.lines, [5]);
    assert.equal(by('Load', 'Save'), undefined, 'a comment and a string are not calls');
    assert.deepEqual(by('Parse', 'Check')!.lines, [11], 'Pascal is not case sensitive');
    assert.ok(recursive.has('Parse') && !by('Parse', 'Parse'), 'a recursive call is a flag, not an edge');
    assert.equal(calls.length, 4);
});

test('C-like languages need parentheses; a method on another object is not a call', () => {
    const ts = familyOf('typescript')!;
    const lines = ['function a() {', '  b();', '  c;', '  x.d();', '  this.e();', '}', 'function b() {}', 'function c() {}', 'function d() {}', 'function e() {}'];
    const routines = ['a', 'b', 'c', 'd', 'e'].map((n, i) => ({ id: n, name: n, body: i === 0 ? { start: 0, end: 5 } : undefined }));
    const { calls } = findCalls(routines, lines, ts);
    assert.deepEqual(calls.map(c => c.to).sort(), ['b', 'e']);
});

test('adding a call: before the closing end, with the indentation of the code; Python, batch and shell too', () => {
    const lines = ['procedure TF.Load;', 'begin', '  Parse;', '  Save;', 'end;'];
    const e = addCallEdit(lines, { start: 0, end: 4 }, 'Check', ['a', 'b'], PAS)!;
    assert.deepEqual(applyLineEdits(lines, [e]), ['procedure TF.Load;', 'begin', '  Parse;', '  Save;', '  Check(a, b);', 'end;']);
    const empty = ['procedure TF.Load;', 'begin', 'end;'];
    assert.deepEqual(applyLineEdits(empty, [addCallEdit(empty, { start: 0, end: 2 }, 'Go', [], PAS)!]), ['procedure TF.Load;', 'begin', '  Go;', 'end;']);
    const py = ['def a():', '    x = 1', '    y = 2', '', 'def b():', '    pass'];
    assert.deepEqual(applyLineEdits(py, [addCallEdit(py, { start: 0, end: 3 }, 'b', [], familyOf('python')!)!]).slice(0, 5), ['def a():', '    x = 1', '    y = 2', '    b()', '', ]);
    const bat = [':a', '  echo hi', '  exit /b 0'];
    assert.deepEqual(applyLineEdits(bat, [addCallEdit(bat, { start: 0, end: 2 }, 'b', [], familyOf('bat')!)!]), [':a', '  echo hi', '  call :b', '  exit /b 0']);
    const sh = ['f() {', '  echo hi', '}'];
    assert.deepEqual(applyLineEdits(sh, [addCallEdit(sh, { start: 0, end: 2 }, 'g', [], familyOf('shellscript')!)!]), ['f() {', '  echo hi', '  g', '}']);
});

test('removing a call: the whole line when it holds only the call, else only the call', () => {
    const lines = ['begin', '  Parse;', '  if x then Parse; // again', '  Self.Parse(1);', '  Other.Parse;', 'end;'];
    assert.deepEqual(applyLineEdits(lines, [removeCallEdit(lines, 1, 'Parse', PAS)!]), ['begin', '  if x then Parse; // again', '  Self.Parse(1);', '  Other.Parse;', 'end;']);
    assert.equal(applyLineEdits(lines, [removeCallEdit(lines, 2, 'Parse', PAS)!])[2], '  if x then  // again');
    assert.deepEqual(applyLineEdits(lines, [removeCallEdit(lines, 3, 'Parse', PAS)!]).length, lines.length - 1, 'Self.Parse(1); alone on its line goes with the line');
    assert.equal(removeCallEdit(lines, 4, 'Parse', PAS), undefined, 'a call on another object is not ours to remove');
    const bat = [':a', '  call :b 1', '  echo x'];
    assert.deepEqual(applyLineEdits(bat, [removeCallEdit(bat, 1, 'b', familyOf('bat')!)!]), [':a', '  echo x']);
});

test('layout: callers on the left, what they call on the right, a cycle does not loop, a lonely node has its own column', () => {
    const nodes = ['main', 'load', 'parse', 'save', 'loop1', 'loop2', 'lonely'].map(id => ({ id, title: id, inputs: 2, outputs: 2 }));
    const edges = [['main', 'load'], ['main', 'save'], ['load', 'parse'], ['parse', 'save'], ['loop1', 'loop2'], ['loop2', 'loop1']].map(([from, to]) => ({ from, to }));
    const d = depths(nodes, edges);
    assert.deepEqual(['main', 'load', 'parse', 'save'].map(i => d.get(i)), [0, 1, 2, 3]);
    assert.ok((d.get('loop2') ?? 0) <= 1);
    const boxes = layout(nodes, edges);
    assert.ok(boxes.get('main')!.x < boxes.get('load')!.x && boxes.get('load')!.x < boxes.get('parse')!.x && boxes.get('parse')!.x < boxes.get('save')!.x);
    assert.ok(boxes.get('lonely')!.x < boxes.get('main')!.x);
    const overlap = (a: { x: number; y: number; w: number; h: number }, b: typeof a): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const all = [...boxes.values()];
    for (let i = 0; i < all.length; i++) { for (let j = i + 1; j < all.length; j++) { assert.ok(!overlap(all[i], all[j]), 'no two nodes overlap'); } }
    assert.ok(nodeSize({ id: 'x', title: 'a'.repeat(80), inputs: 5, outputs: 1 }).w <= 340, 'a long title does not make a huge node');
});
