import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { changelogHtml, inlineMarkup, parseChangelog } from '../webview/changelogSection';

const root = path.resolve(__dirname, '..', '..');
const md = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { version: string };

test('the changelog starts with the version of package.json, so it cannot be forgotten at a release', () => {
    const entries = parseChangelog(md);
    assert.equal(entries[0].version, pkg.version);
    assert.ok(entries.every(e => e.items.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(e.date)), 'every version has a date and something in it');
    const versions = entries.map(e => e.version);
    assert.equal(new Set(versions).size, versions.length, 'no version twice');
});

test('headings and items are read, whatever the dash and the line ends', () => {
    const e = parseChangelog('intro\r\n## 1.2.3 - 2026-01-02\r\n- one\r\n- two\r\n  continued\r\n## v1.2.2\r\n- old\r\n');
    assert.deepEqual(e, [{ version: '1.2.3', date: '2026-01-02', items: ['one', 'two continued'] }, { version: '1.2.2', date: '', items: ['old'] }]);
});

test('the sidebar block is folded, the newest version open, markup escaped', () => {
    assert.equal(inlineMarkup('a <b> **x** `y&z`'), 'a &lt;b&gt; <b>x</b> <code>y&amp;z</code>');
    const html = changelogHtml(parseChangelog(md), pkg.version);
    assert.match(html, /^<details class="clog" id="changelog">/, 'no open attribute: folded');
    assert.equal((html.match(/<details class="clog-ver" open>/g) ?? []).length, 1);
    assert.match(html, /installed/);
    assert.match(changelogHtml([]), /Changelog \+ Guide/, 'the guide stays when the changelog file cannot be read');
});
