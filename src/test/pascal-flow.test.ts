import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFlow, parseBody } from '../utils/pascalFlow';

const SRC = [
    'procedure TF.Process(a: Integer);',      // 0
    'var i: Integer;',
    '  procedure Inner;',
    '  begin',
    '    DoInner;',
    '  end;',
    'begin',                                    // 6
    '  Init;',
    '  if a > 0 then',
    '    Positive(a)',
    '  else begin',
    "    Log('negative; end');  // a string with a ; and end",
    '    Fix;',
    '  end;',
    '  for i := 1 to 10 do',
    '  begin',
    '    Step(i);',
    '    if i = 5 then Break;',
    '  end;',
    '  case a of',
    '    1: One;',
    '    2, 3: begin Two; Three; end;',
    '  else Other;',
    '  end;',
    '  try',
    '    Risky;',
    '  except',
    '    on E: Exception do Handle(E);',
    '  end;',
    '  x := y + 1;',
    '  repeat Tick; until Done;',
    '  Exit;',
    'end;',
].join('\n').split('\n');

const names = (f: { nodes: { kind: string; title: string; text: string }[] }): string[] => f.nodes.map(n => n.kind + ':' + n.text);

test('the body of a routine is read by its structure: the nested routine and the strings do not confuse it', () => {
    const f = buildFlow(SRC)!;
    const texts = names(f);
    assert.equal(texts[0], 'start:TF.Process', 'starts with the routine');
    for (const expect of ['call:Init', 'if:a > 0', 'call:Positive(a)', 'call:Fix', 'loop:i := 1 to 10', 'call:Step(i)', 'if:i = 5', 'exit:Break', 'case:a', 'call:One', 'call:Risky', 'assign:x := y + 1', 'exit:Exit']) {
        assert.ok(texts.includes(expect), expect + ' in ' + texts.join(' | '));
    }
    assert.ok(!texts.some(t => t.includes('DoInner')), 'the nested routine is not part of the body');
    assert.ok(texts.some(t => t.startsWith('call:Log(')), 'a ; or end inside a string does not end the statement');
    assert.ok(f.nodes.some(n => n.kind === 'try'));
    assert.ok(f.nodes.some(n => n.kind === 'loop' && n.title === 'repeat until' && n.text === 'Done'));
});

test('the wires: yes / no on an if, a loop that comes back, a case with its labels, everything ends at the end node', () => {
    const f = buildFlow(SRC)!;
    const id = (text: string): string => f.nodes.find(n => n.text === text)!.id;
    const from = (a: string): { to: string; label?: string; back?: boolean }[] => f.edges.filter(e => e.from === id(a));
    const ifEdges = from('a > 0');
    assert.deepEqual(ifEdges.map(e => e.label).sort(), ['no', 'yes']);
    assert.equal(ifEdges.find(e => e.label === 'yes')!.to, id('Positive(a)'));
    assert.equal(ifEdges.find(e => e.label === 'no')!.to, f.nodes.find(n => n.text.startsWith('Log('))!.id);
    const loop = f.nodes.find(n => n.text === 'i := 1 to 10')!;
    assert.ok(f.edges.some(e => e.to === loop.id && e.back), 'the body of the loop leads back to it');
    assert.ok(f.edges.some(e => e.from === loop.id && e.label === 'done'), 'and "done" leaves it');
    const caseEdges = from('a');
    assert.deepEqual(caseEdges.map(e => e.label), ['1', '2, 3', 'else']);
    const end = f.nodes.find(n => n.kind === 'end')!;
    assert.ok(f.edges.some(e => e.to === end.id));
    // every wire joins two nodes that exist, and every node but the first has a way in
    const ids = new Set(f.nodes.map(n => n.id));
    assert.ok(f.edges.every(e => ids.has(e.from) && ids.has(e.to)));
    const reached = new Set(f.edges.map(e => e.to));
    assert.ok(f.nodes.filter(n => n.kind !== 'start').every(n => reached.has(n.id)), 'no orphan node');
});

test('the layout: nothing overlaps, the first nodes read left to right', () => {
    const f = buildFlow(SRC)!;
    const overlap = (a: typeof f.nodes[number], b: typeof f.nodes[number]): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    for (let i = 0; i < f.nodes.length; i++) { for (let j = i + 1; j < f.nodes.length; j++) { assert.ok(!overlap(f.nodes[i], f.nodes[j]), f.nodes[i].text + ' / ' + f.nodes[j].text); } }
    assert.ok(f.nodes.every(n => n.x >= 0 && n.y >= 0));
    const order = ['start', 'Init', 'a > 0'].map(t => f.nodes.find(n => n.text === t || n.kind === t)!.x);
    assert.ok(order[0] < order[1] && order[1] < order[2]);
});

test('lines point back into the file; a declaration with no body gives nothing; a long routine is cut', () => {
    const f = buildFlow(SRC, 100)!;
    assert.equal(f.nodes.find(n => n.text === 'Init')!.line, 107);
    assert.equal(buildFlow(['procedure TF.Decl;'])  , undefined);
    assert.equal(parseBody(['procedure A;', 'begin', 'end;'])!.tree.t, 'seq');
    const many = ['procedure Big;', 'begin', ...Array.from({ length: 600 }, (_, i) => '  Step' + i + ';'), 'end;'];
    assert.ok(buildFlow(many)!.nodes.length <= 405, 'capped');
});

import * as fs from 'fs';
import * as path from 'path';
import { blueprintHtml, blueprintScript } from '../webview/blueprintHtml';

test('the flow view: a button on the details of a routine, a way back, read only, and the panel that feeds it', () => {
    const js = blueprintScript();
    const html = blueprintHtml({ nonce: 'n', cspSource: 'x', title: 't' });
    assert.ok(html.includes('id="back"'));
    assert.match(js, /\['Show its flow', 'showFlow', ''\]/);
    assert.match(js, /flowMode = m\.mode === 'flow'/);
    assert.match(js, /post\(\{ type: 'openLine', line: n\.line \}\)/);
    assert.match(js, /else if \(!locked\) \{ post\(\{ type: 'deleteNode'/, 'no deletion from the flow');
    assert.match(js, /if \(flowMode\) \{ subsetKey = ''; return; \}/);
    const panel = fs.readFileSync(path.join(__dirname, '..', 'webview', 'BlueprintPanel.ts'), 'utf8');
    assert.match(panel, /case 'showFlow': this\.showFlow\(this\.entry\(m\.id\)\)/);
    assert.match(panel, /buildFlow\(this\.lines\(\)\.slice\(body\.start, body\.end \+ 1\), body\.start\)/);
    assert.match(panel, /if \(this\.flowOf\) \{ this\.sendFlow\(fit\); return; \}/, 'the flow is drawn again when the code changes');
    assert.match(panel, /case 'ready': this\.flowOf = undefined/, 'the back button shows the calls again');
    assert.match(panel, /Delphi \/ Pascal code only/);
});
