import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

const panel = fs.readFileSync(path.join(__dirname, '..', 'webview', 'TemplateSidebarPanel.ts'), 'utf8');
const ext = fs.readFileSync(path.join(__dirname, '..', 'extension.ts'), 'utf8');

test('the Templates view has a search box that hides what does not match, and keeps what was typed', () => {
    assert.match(panel, /id="tplSearch"/);
    assert.match(panel, /placeholder="Search templates…"/);
    assert.match(panel, /data-text="\$\{text\}"/, 'every row carries its searchable text (name, prefix, description, languages)');
    assert.match(panel, /function applySearch\(\)/);
    assert.match(panel, /r\.hidden = !hit/);
    assert.match(panel, /h\.hidden = !live/, 'a heading with nothing under it is hidden');
    assert.match(panel, /case 'search': this\._search =/, 'the text is kept when the list is drawn again');
    assert.match(panel, /e\.key === 'Escape'/);
});

test('a template can be starred: the favorites are listed first, for every file, and remembered', () => {
    assert.match(panel, /data-fav="\$\{escName\}"/);
    assert.match(panel, /case 'favorite':/);
    assert.match(panel, /this\._state\?\.update\('ce\.templates\.favorites'/);
    assert.match(panel, /'<div class="section-title">★ Favorites<\/div>'/);
    assert.match(panel, /filteredUser\s*\n\s*\.filter\(t => !favs\.has\(t\.name\)\)/, 'a favorite is not listed twice');
    assert.match(ext, /context\.globalState,\s*\n\s*\);\s*\n\s*context\.subscriptions\.push\(\s*\n\s*vscode\.window\.registerWebviewViewProvider\(TemplateSidebarPanel\.viewType/);
});
