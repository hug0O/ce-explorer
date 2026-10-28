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
    for (const id of ['addNode', 'zoom', 'zoomIn', 'zoomOut', 'relayout', 'filter', 'alone', 'cv']) { assert.ok(html.includes('id="' + id + '"'), id); }
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

test('zoom works as in the designer: a select with presets and Fit window, buttons, the wheel around the pointer, keys, middle-button pan', () => {
    const js = blueprintScript();
    const html = blueprintHtml({ nonce: 'n', cspSource: 'x', title: 't' });
    for (const v of ['fit', '0.25', '0.5', '1', '1.5', '2']) { assert.ok(html.includes('<option value="' + v + '"'), 'preset ' + v); }
    assert.match(js, /function setZoom\(k, mx, my\)/);
    assert.match(js, /setZoom\(view\.k \* \(1 \+ step \* 0\.6\), ev\.clientX - r\.left, ev\.clientY - r\.top\)/);
    assert.match(js, /ev\.key === '0'\) \{ setZoom\(1\)/);
    assert.match(js, /ev\.key === 'f' \|\| ev\.key === '9'/);
    assert.match(js, /ev\.button === 1/);
    assert.match(js, /'Fit window \(' \+ pct/);
});

test('the blueprint has a full screen: its button, Ctrl+K Ctrl+F, Esc to leave, and the Zen mode of the editor behind it', () => {
    const js = blueprintScript();
    assert.match(js, /post\(\{ type: 'fullscreen', on: on \}\)/);
    assert.match(js, /m\.type === 'toggleFull'/);
    assert.match(js, /!sel && full\) \{ setFull\(false\)/);
    assert.ok(blueprintHtml({ nonce: 'n', cspSource: 'x', title: 't' }).includes('id="full"'));
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { contributes: { keybindings: { key: string; command: string; when?: string }[] } };
    const k = pkg.contributes.keybindings.find(b => b.command === 'ce.delphi.designerFullScreen')!;
    assert.match(k.when ?? '', /ceFormDesigner/);
    assert.match(k.when ?? '', /ceBlueprint/);
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'BlueprintPanel.ts'), 'utf8');
    assert.match(panel, /case 'fullscreen': await this\.setZen/);
    assert.match(panel, /workbench\.action\.toggleZenMode/);
});

test('the graph follows the size of its window: refitted in Fit window mode, kept otherwise', () => {
    const js = blueprintScript();
    assert.match(js, /new ResizeObserver\(resized\)\.observe\(document\.getElementById\('stage'\)\)/);
    assert.match(js, /if \(fitMode \|\| firstSize\) \{ fit\(\); \} else \{ applyView\(\); \}/);
});

test('readability: focus on the selection, a details panel, compact nodes, wires coloured by caller, less detail when zoomed out', () => {
    const js = blueprintScript();
    const html = blueprintHtml({ nonce: 'n', cspSource: 'x', title: 't' });
    for (const id of ['focus', 'pins', 'details', 'side']) { assert.ok(html.includes('id="' + id + '"'), id); }
    for (const v of ['1', '2', '99']) { assert.ok(html.includes('<option value="' + v + '">'), 'focus ' + v); }
    assert.match(js, /function reach\(\)/);
    assert.match(js, /cls \+= outE \? ' out' : inE \? ' in' : ' dim'/);
    assert.match(js, /stroke: edgeColor\(e\.from\)/);
    assert.match(js, /function renderSide\(\)/);
    for (const g of ['Entry points', 'Called by others', 'Isolated']) { assert.ok(js.includes(g), g); }
    assert.match(js, /compact = model\.nodes\.length > 25/);
    assert.match(js, /classList\.toggle\('lod'/);
    assert.ok(!/var rc = el\(/.test(js), 'the focus variable is not shadowed inside the node loop');
});

test('the filter shows only the routine searched for (and, if asked, its neighbours) and centres the view on it', () => {
    const js = blueprintScript();
    const html = blueprintHtml({ nonce: 'n', cspSource: 'x', title: 't' });
    assert.ok(html.includes('id="linked"') && html.includes('Find a routine'));
    assert.match(js, /function visibleSet\(\)/);
    assert.match(js, /var visible = visibleSet\(\);/);
    assert.match(js, /function applyFilter\(\)/);
    assert.match(js, /found\.length === 1/, 'a single match is selected');
    assert.match(js, /ev\.key === 'Enter'/);
    assert.match(js, /ev\.target\.value = ''; filter = ''/, 'Esc clears the filter');
    assert.match(js, /var keep = visibleSet\(\);\s*var list = model\.nodes\.filter/, 'fit looks at the nodes that are drawn');
});

test('"hide others" removes every routine not linked to the selection, as far as the Focus box says', () => {
    const js = blueprintScript();
    const html = blueprintHtml({ nonce: 'n', cspSource: 'x', title: 't' });
    assert.ok(html.includes('id="isolate"') && html.includes('hide others'));
    assert.match(js, /keep\[n\.id\] = keep\[n\.id\] && \(n\.id === sel\.id \|\| !!r\.up\[n\.id\] \|\| !!r\.down\[n\.id\]\)/);
    assert.match(js, /function setIsolate\(on\)/);
    assert.match(js, /ev\.key === 'h'\) \{ setIsolate\(!isolate\)/);
    assert.match(js, /if \(isolate\) \{ fit\(\); \} else if \(center\)/);
});
