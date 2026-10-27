import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as vm from 'node:vm';
import { designerHtml } from '../webview/designerHtml';
import { ergoCss, ergoHtml, ergoScript } from '../webview/designerErgo';
import { DESIGNER_SHORTCUTS } from '../webview/shortcutsSection';

const html = designerHtml('N');

test('the page has the right-click menu and the rename box, and Esc closes them before anything else', () => {
    assert.ok(html.includes(ergoHtml()));
    assert.match(html, /document\.addEventListener\('contextmenu'/);
    assert.match(html, /if \(ev\.key === 'Escape' && ergoCloseMenus\(\)\) \{ ev\.preventDefault\(\); return; \}/);
    assert.match(html, /if \(ergoKey\(ev\)\) \{ return; \}/);
    assert.ok(ergoCss().includes('#ctxmenu .vrow'), 'it looks like the other menus');
});

test('the menu of a component offers what the toolbar offered, with the keys', () => {
    const script = ergoScript();
    for (const label of ['Cut', 'Copy', 'Paste', 'Duplicate', 'Rename...', 'Open the default handler', 'Select the parent', 'Lock', 'Hide', 'Delete']) { assert.ok(script.includes(`'${label}'`), label); }
    for (const key of ['Ctrl+X', 'Ctrl+C', 'Ctrl+V', 'Ctrl+D', 'F2', 'Enter', 'Ctrl+L', 'Ctrl+H', 'Del']) { assert.ok(script.includes(`'${key}'`), key); }
});

test('the Tab key walks the components in the form order, siblings by TabOrder, parts and hidden ones left out', () => {
    const box = { state: {} as Record<string, unknown>, dmarks: { hidden: ['hid'] } } as Record<string, unknown>;
    vm.createContext(box);
    vm.runInContext(ergoScript(), box);
    const node = (name: string, extra: Record<string, unknown> = {}, children: unknown[] = []) => ({ name, children, visible: true, ...extra });
    box.state = {
        sel: [], model: {
            root: node('form', {}, [
                node('lbl'), node('b', { tab: 2 }), node('a', { tab: 0 }), node('hid', { tab: 1 }), node('part', { fixed: true }), node('tray', { nonVisual: true }),
                node('panel', { tab: 1 }, [node('inner2', { tab: 1 }), node('inner1', { tab: 0 })]),
            ]),
        },
    };
    assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('walkOrder()', box))), ['a', 'panel', 'inner1', 'inner2', 'b', 'lbl']);
});

test('the keys that need no modifier are listed for the Shortcuts tab', () => {
    const listed = DESIGNER_SHORTCUTS.map(s => s.keys);
    for (const k of ['F2', 'Tab / Shift+Tab', 'Enter', '0 / 9', 'Ctrl+D', 'Right-click']) { assert.ok(listed.includes(k), k); }
    const script = ergoScript();
    assert.match(script, /ev\.key === 'F2'/);
    assert.match(script, /ev\.key === 'Tab'/);
    assert.match(script, /ev\.key === '0'/);
    assert.match(script, /ev\.key === '9'/);
});
