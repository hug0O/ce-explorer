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
    assert.match(ext, /trackedCommand\('ce\.blueprint\.open'/);
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
    for (const id of ['lvUp', 'lvDown', 'pins', 'details', 'side']) { assert.ok(html.includes('id="' + id + '"'), id); }
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

test('what a filter or "hide others" leaves is laid out again as if it were alone, centred, and the saved positions come back afterwards', () => {
    const js = blueprintScript();
    assert.match(js, /post\(\{ type: 'subsetLayout', ids: ids, key: key \}\)/);
    assert.match(js, /m\.type === 'subset'/);
    assert.match(js, /if \(m\.key !== subsetKey\) \{ return; \}/, 'an answer for an older selection is ignored');
    assert.match(js, /n\.x = n\.ox; n\.y = n\.oy/, 'the real positions are put back');
    assert.match(js, /d\.moved && !swapped/, 'a node moved while the others are hidden does not overwrite its saved position');
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'BlueprintPanel.ts'), 'utf8');
    assert.match(panel, /case 'subsetLayout': if \(!this\.flowOf\) \{ this\.subsetLayout\(m\.ids, m\.key\); \} break;/);
    assert.match(panel, /type: 'subset', key, positions/);
    assert.ok(!/positions\(\)[^;]*subset/.test(panel), 'the subset layout is not saved');
});

test('every action of the picture can be undone and redone, and a routine can be edited from the details panel', () => {
    const js = blueprintScript();
    const html = blueprintHtml({ nonce: 'n', cspSource: 'x', title: 't' });
    assert.ok(html.includes('id="undo"') && html.includes('id="redo"'));
    assert.match(js, /kk === 'z'\) \{ ev\.preventDefault\(\); post\(\{ type: ev\.shiftKey \? 'redo' : 'undo' \}\)/);
    assert.match(js, /kk === 'y'/);
    assert.match(js, /m\.type === 'history'/);
    assert.match(js, /post\(\{ type: 'editNode', id: n\.id, name: editForm\.name, returnType: editForm\.returnType, params: editForm\.params \}\)/);
    assert.match(js, /ev\.key === 'e' && sel\.type === 'node'/);
    assert.match(js, /\['', 'var', 'const', 'out'\]/, 'how a parameter is passed');
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'BlueprintPanel.ts'), 'utf8');
    for (const label of ["'add call'", "'remove call'", "'rename '", "'delete '", "'add routine'", "'edit '"]) { assert.ok(panel.includes('recorded(' + label), label + ' is recorded'); }
    assert.match(panel, /this\.doc\.getText\(\) !== e\.after/, 'an undo is refused when the file changed since');
    assert.match(panel, /ops\.editMember\(this\.doc, provider, target\.cls, old, this\.deps\.generator, this\.deps\.explorer, form\)/);
    assert.match(panel, /ops\.renameMember\(this\.doc, e\.cls, e\.member, provider, this\.deps\.explorer, name\)/, 'a new name goes through the rename, so the calls follow');
});

test('callers above and callees below the selected routine, each to a level the user sets', () => {
    const html = blueprintHtml({ nonce: 'N', cspSource: 'csp', title: 't' });
    const js = /<script nonce="N">([\s\S]*)<\/script>/.exec(html)![1];
    assert.doesNotThrow(() => new Function('acquireVsCodeApi', 'document', 'window', js), 'the page script parses');
    assert.match(html, /<select id="lvUp">(?:<option value="\d+"[^>]*>(?:\d+|all)<\/option>)+<\/select>/, 'levels of callers, up');
    assert.match(html, /<select id="lvDown">/, 'levels of callees, down');
    assert.match(html, /<option value="99">all<\/option>/, 'as far as it goes');
    assert.match(html, /<option value="0">0<\/option>/, 'none on one side');
    assert.match(js, /walk\(sel\.id, 'to', 'from', up, depthUp\)/);
    assert.match(js, /walk\(sel\.id, 'from', 'to', down, depthDown\)/, 'each side has its own depth');
    assert.match(js, /bt\.textContent = \(rc\.up\[n\.id\]/, 'each node says how many levels away it is');
    assert.match(js, /Show only its callers and callees/, 'a button on the details of the routine');
    assert.ok(!js.includes('depthMode'));
    // the walk itself, as the page runs it
    const walk = (edges: [string, string][], from: string, depth: number, dir: 'up' | 'down'): Record<string, number> => {
        const out: Record<string, number> = {};
        const seen = new Set([from]);
        const queue: [string, number][] = [[from, 0]];
        while (queue.length) {
            const [cur, d] = queue.shift()!;
            if (d >= depth) { continue; }
            for (const [a, b] of edges) {
                const [here, next] = dir === 'down' ? [a, b] : [b, a];
                if (here !== cur || seen.has(next)) { continue; }
                seen.add(next); out[next] = d + 1; queue.push([next, d + 1]);
            }
        }
        return out;
    };
    const e: [string, string][] = [['a', 'b'], ['b', 'c'], ['c', 'd'], ['x', 'b'], ['y', 'x']];
    assert.deepEqual(walk(e, 'b', 1, 'down'), { c: 1 });
    assert.deepEqual(walk(e, 'b', 2, 'down'), { c: 1, d: 2 });
    assert.deepEqual(walk(e, 'b', 1, 'up'), { a: 1, x: 1 });
    assert.deepEqual(walk(e, 'b', 99, 'up'), { a: 1, x: 1, y: 2 });
    assert.deepEqual(walk(e, 'b', 0, 'up'), {});
});
