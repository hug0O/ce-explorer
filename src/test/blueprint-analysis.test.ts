import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { analyze, components } from '../utils/blueprintAnalysis';
import { toMermaid, toSvg } from '../utils/blueprintExport';
import { buildBlueprint } from '../utils/blueprintModel';
import { familyOf } from '../utils/callGraph';
import { blueprintHtml, blueprintScript } from '../webview/blueprintHtml';

const root = path.join(__dirname, '..', '..');

test('unused routines and loops of calls are found; an entry point is not unused; a long chain does not overflow', () => {
    const ids = ['main', 'a', 'b', 'c', 'dead', 'handler', 'decl'];
    const edges = [['main', 'a'], ['a', 'b'], ['b', 'a'], ['b', 'c'], ['c', 'c']].map(([from, to]) => ({ from, to }));
    const r = analyze(ids, edges, ['handler'], id => id !== 'decl');
    assert.deepEqual(r.unused.sort(), ['dead', 'main'].sort(), 'main has no caller here either; a handler and a declaration are not reported');
    assert.equal(r.cycles.length, 1);
    assert.deepEqual([...r.cycles[0]].sort(), ['a', 'b'], 'a routine calling itself is recursion, not a loop between routines');
    const chain = Array.from({ length: 5000 }, (_, i) => 'n' + i);
    const big = components(chain, chain.slice(1).map((t, i) => ({ from: chain[i], to: t })).concat([{ from: 'n4999', to: 'n0' }]));
    assert.equal(big.filter(c => c.length > 1)[0].length, 5000);
});

const lines = ['procedure T.A;', 'begin', '  B(1);', 'end;', 'procedure T.B(x: Integer);', 'begin', '  A;', 'end;'];
const members = [
    { name: 'A', owner: 'T', kind: 'method' as const, params: [], line: 0, body: { start: 0, end: 3 } },
    { name: 'B', owner: 'T', kind: 'method' as const, params: [{ name: 'x', type: 'Integer' }], returnType: 'Boolean', line: 4, body: { start: 4, end: 7 } },
];
const model = buildBlueprint(members, lines, familyOf('pascal')!);

test('export: a Mermaid flowchart with the calls, and an SVG with a node and a wire for each', () => {
    const md = toMermaid(model.nodes, model.edges);
    assert.match(md, /^flowchart LR\n/);
    assert.match(md, /n0\["T\.A"\]/);
    assert.match(md, /n1\["T\.B\(x\)"\]/);
    assert.match(md, /n0 --> n1/);
    assert.match(md, /n1 --> n0/);
    const svg = toSvg(model.nodes, model.edges);
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.equal((svg.match(/<path d="M[\d.-]+,[\d.-]+ C/g) ?? []).length, 2, 'one wire per call');
    assert.ok(svg.includes('>A</text>') && svg.includes('x: Integer'));
    assert.ok(toSvg([], []).includes('<svg'));
});

test('the everyday controls stay on the bar, the rest is in the More menu', () => {
    const html = blueprintHtml({ nonce: 'n', cspSource: 'x', title: 't' });
    const bar = html.slice(html.indexOf('<div class="bar">'), html.indexOf('<div id="moremenu"'));
    for (const id of ['addNode', 'zoom', 'undo', 'redo', 'filter', 'isolate', 'details', 'full', 'more']) { assert.ok(bar.includes('id="' + id + '"'), id + ' on the bar'); }
    const menu = html.slice(html.indexOf('<div id="moremenu"'), html.indexOf('<div id="main">'));
    for (const id of ['pins', 'alone', 'focus', 'linked', 'analysis', 'exportMermaid', 'exportSvg', 'relayout', 'refresh']) { assert.ok(menu.includes('id="' + id + '"'), id + ' in the menu'); }
    const js = blueprintScript();
    assert.match(js, /function closeMenus\(\)/);
    assert.match(js, /ev\.key === 'Escape' && !moreMenu\.hidden/);
    assert.match(js, /showAnalysis && unusedSet\[n\.id\]/);
    assert.match(js, /post\(\{ type: 'export', format: 'svg' \}\)/);
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'BlueprintPanel.ts'), 'utf8');
    assert.match(panel, /case 'export': await this\.exportGraph/);
    assert.match(panel, /vscode\.env\.clipboard\.writeText\(toMermaid/);
});
