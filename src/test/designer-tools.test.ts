import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as vm from 'vm';
import { ANCHOR_MODES } from '../services/DelphiAlign';
import { designerHtml } from '../webview/designerHtml';
import { toolsCss, toolsScript } from '../webview/designerTools';

const html = designerHtml('N');

test('the toolbar is in groups that follow the work: file, edit, arrange, snap and grid, view and tools, then the panels', () => {
    const bar = html.slice(html.indexOf('<div id="toolbar">'), html.indexOf('<div id="main">'));
    const order = ['id="save"', 'id="undo"', 'id="copy"', 'id="dup"', 'id="alignbar"', 'id="placegrp"', 'id="zoom"', 'id="viewbtn"', 'id="toolsbtn"', 'id="togleft"', 'id="full"', 'id="opencode"'];
    const at = order.map(k => bar.indexOf(k));
    assert.ok(at.every(i => i >= 0), 'every control is there');
    assert.deepEqual([...at].sort((a, b) => a - b), at, 'in that order');
    assert.equal((bar.match(/<div/g) ?? []).length, (bar.match(/<\/div>/g) ?? []).length, 'the divs are balanced');
});

test('the Tools menu has what the sidebar page used to offer, and the safe ones work on the selection', () => {
    const script = toolsScript();
    for (const id of ['changeClass', 'check', 'clean', 'formFromFields', 'formFromClass']) { assert.ok(script.includes(`id: '${id}'`), id); }
    assert.match(script, /post\(\{ type: 'anchors', mode: a\.id, names: state\.sel\.slice\(\) \}\)/);
    assert.match(script, /post\(\{ type: 'duplicate', names: state\.sel\.slice\(\) \}\)/);
    assert.match(script, /key\.toLowerCase\(\) === 'd'/, 'Ctrl+D duplicates');
    assert.ok(toolsCss().includes('#toolsmenu .vrow'), 'it looks like the View menu');
    assert.doesNotThrow(() => new vm.Script(html.match(/<script nonce="N">([\s\S]*)<\/script>/)![1]));
});

test('the anchor modes the menu lists come from the extension', () => {
    assert.ok(ANCHOR_MODES.length >= 5 && ANCHOR_MODES.every(m => m.id && m.label && m.description));
    assert.match(html, /state\.anchorModes = m\.anchorModes \|\| \[\]/);
});

test('a click on a component brings the inspector, the zoom is 100% until the user chooses another', () => {
    assert.match(html, /function openInspector\(\) \{ if \(!state\.ui\.right\) \{ state\.ui\.right = true; applyUi\(\); \} \}/);
    assert.match(html, /openInspector\(\);\n {4}startMove\(ev\);/, 'a click on the form');
    assert.match(html, /listClick\(pick\.getAttribute\('data-pick'\), ev\); openInspector\(\);/, 'a click in the list');
    assert.match(html, /fit: false, fitSet: false/);
    assert.match(html, /state\.fitSet = st\.fitSet === true;\s+state\.fit = state\.fitSet \? !!st\.fit : false;/);
    assert.match(html, /Math\.min\(state\.fitSet \? 2 : 1, z\)/, 'a small form keeps its size, a big one shrinks');
});

test('the toolbar spreads over the whole width and never cuts a group: a long one wraps inside itself', () => {
    assert.match(html, /#toolbar \{ gap: 4px 8px; justify-content: space-between; min-width: 0; \}/);
    assert.match(html, /\.tg \{ display: flex; flex-wrap: wrap; max-width: 100%;/);
});

test('Fit window says the zoom it gives, so the whole form is shown and the percentage is known', () => {
    assert.match(html, /o\.textContent = 'Fit window \(' \+ Math\.round\(state\.zoom \* 100\) \+ '%\)'/);
    assert.match(html, /fitLabel\(\);\n/);
});
