import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { blueprintHtml, blueprintScript } from '../webview/blueprintHtml';
import { BpMember, buildBlueprint, nodeIds } from '../utils/blueprintModel';
import { familyOf } from '../utils/callGraph';

const root = path.join(__dirname, '..', '..');

test('the page script is valid and sends one message per gesture', () => {
    const js = blueprintScript();
    assert.doesNotThrow(() => new Function('acquireVsCodeApi', 'document', 'window', js.replace('(function () {', '(function () { return;')), 'the script parses');
    assert.ok(!js.includes('`') && !js.includes('${'), 'no template syntax inside the template string');
    for (const t of ['ready', 'positions', 'addCall', 'removeCall', 'rename', 'deleteNode', 'addNode', 'openCode', 'resetLayout']) { assert.ok(js.includes("type: '" + t + "'"), t + ' is posted'); }
    assert.match(js, /ev\.key === 'F2'/);
    assert.match(js, /ev\.key === 'Delete'/);
});

test('the page has its toolbar, a canvas and a strict content security policy', () => {
    const html = blueprintHtml({ nonce: 'abc', cspSource: 'vscode-resource:', title: 'A <b>' });
    for (const id of ['addNode', 'fit', 'relayout', 'filter', 'alone', 'cv']) { assert.ok(html.includes('id="' + id + '"'), id); }
    assert.match(html, /script-src 'nonce-abc'/);
    assert.ok(!html.includes('A <b>') && html.includes('A &lt;b&gt;'), 'the title is escaped');
});

test('the model: overloads get their own node, a saved position wins over the layout, a recursive routine is flagged', () => {
    const m = (name: string, a: number, b: number): BpMember => ({ name, owner: 'T', kind: 'method', params: [], line: a, body: { start: a, end: b } });
    const members = [m('Go', 0, 3), m('Go', 4, 6), m('Rec', 7, 9)];
    assert.deepEqual(nodeIds(members), ['T.Go', 'T.Go#2', 'T.Rec']);
    const lines = ['procedure T.Go;', 'begin', '  Rec;', 'end;', 'procedure T.Go(a: Integer);', 'begin', 'end;', 'procedure T.Rec;', 'begin', '  Rec;', 'end;'];
    const model = buildBlueprint(members, lines, familyOf('pascal')!, { 'T.Rec': { x: 500, y: 40 } });
    assert.equal(model.nodes.find(n => n.id === 'T.Rec')!.x, 500);
    assert.ok(model.nodes.find(n => n.id === 'T.Rec')!.recursive);
    assert.deepEqual(model.edges.map(e => [e.from, e.to]), [['T.Go', 'T.Rec']]);
});

test('the Blueprint command is declared, in the editor submenu, the quick actions and the extension', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { contributes: { commands: { command: string }[]; menus: Record<string, { command?: string }[]> } };
    assert.ok(pkg.contributes.commands.some(c => c.command === 'ce.blueprint.open'));
    assert.ok(pkg.contributes.menus['ce.editorMenu'].some(m => m.command === 'ce.blueprint.open'));
    const ext = fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8');
    assert.match(ext, /registerCommand\('ce\.blueprint\.open'/);
    assert.match(ext, /BlueprintPanel\.configure\(/);
});
