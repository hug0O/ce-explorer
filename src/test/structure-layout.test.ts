import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

const manage = fs.readFileSync(path.join(__dirname, '..', 'webview', 'manageSection.ts'), 'utf8');

test('the Structure filter and its selectors sit in a block that stays at the top while the list scrolls', () => {
    assert.match(manage, /<div class="mstick"><div class="tool-row mfilter"><input id="mFilter"/);
    assert.match(manage, /<\/select><\/div><\/div>`;\s*\n\s*\n\s*if \(total === 0\)/, 'the block closes right after the selectors, before the list');
    assert.match(manage, /\.mstick \{ position: sticky; top: 0; z-index: 5; background: var\(--vscode-editor-background\)/);
});

test('a long name is cut with an ellipsis instead of pushing the icons and buttons out of the row', () => {
    assert.match(manage, /\.mrow > span \{ flex: none; \}/);
    assert.match(manage, /\.mrow > \.mname \{ flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; \}/);
    assert.match(manage, /\.mrow > \.var-actions \{ flex: none;/);
    assert.match(manage, /\.tool-row \.tool-select, \.tool-row \.inp \{ min-width: 0;/);
});

test('the lists under a member use the height of the sidebar, not a fixed few rows', () => {
    assert.match(manage, /\.mhits \{ list-style: none; max-height: max\(190px, calc\(100vh - 170px\)\);/);
});

test('the small scrolling box of the memo list does not leak onto the member list of Structure', () => {
    const memo = fs.readFileSync(path.join(__dirname, '..', 'webview', 'memoSection.ts'), 'utf8');
    assert.match(memo, /^#memoList\.mlist \{[^}]*max-height: 150px/m);
    assert.doesNotMatch(memo, /^\.mlist \{/m);
});
