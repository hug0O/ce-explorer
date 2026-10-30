import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { DAY, MIN_DAYS, emptyUsage, groupOfKey, rank, rankingMarkdown, record, sanitize } from '../utils/usageStats';
import { usageBody } from '../webview/usageHtml';

const T0 = Date.UTC(2026, 9, 1, 12);
const catalog = [
    { key: 'ce.a', label: 'Add a method', group: 'members' }, { key: 'ce.b', label: 'Rename', group: 'refactor' },
    { key: 'ce.c', label: 'Align', group: 'refactor' }, { key: 'ce.d', label: 'Dead code', group: 'review' },
];

test('uses are counted per feature and per day, and old days are dropped', () => {
    const d = emptyUsage(T0);
    for (let i = 0; i < 5; i++) { record(d, 'ce.a', T0 + i * 1000); }
    record(d, 'ce.a', T0 + 70 * DAY);
    assert.equal(d.entries['ce.a'].n, 6);
    assert.equal(d.entries['ce.a'].first, T0);
    assert.deepEqual(Object.values(d.entries['ce.a'].days), [1], 'the first five days are older than 60 days');
    record(d, '', T0); record(d, 'x'.repeat(100), T0);
    assert.deepEqual(Object.keys(d.entries), ['ce.a'], 'an empty or huge key is ignored');
});

test('the ranking: most used first, little used, never used, and too young to judge', () => {
    const d = emptyUsage(T0);
    for (let i = 0; i < 10; i++) { record(d, 'ce.a', T0 + i * DAY); }
    record(d, 'ce.b', T0 + DAY);
    for (let i = 0; i < 3; i++) { record(d, 'designer:rename', T0 + 2 * DAY); }
    let r = rank(d, catalog, T0 + 5 * DAY);
    assert.deepEqual(r.top.map(x => x.key), ['ce.a', 'designer:rename', 'ce.b']);
    assert.equal(r.top[0].label, 'Add a method', 'the label comes from the catalog');
    assert.equal(r.top[1].group, 'designer', 'a feature of a page is of its page');
    assert.deepEqual(r.rare.map(x => x.key), ['ce.b'], 'used once, and listed in the catalog');
    assert.deepEqual(r.never.map(x => x.key), ['ce.c', 'ce.d']);
    assert.equal(r.young, true);
    r = rank(d, catalog, T0 + (MIN_DAYS + 1) * DAY);
    assert.equal(r.young, false);
    assert.equal(r.top[0].recent, 10 - 0, 'uses of the last 30 days');
    assert.equal(r.total, 14);
    const md = rankingMarkdown(r);
    assert.match(md, /1\. Add a method - 10/);
    assert.match(md, /- Rename - 1 use, last \d+ days ago/);
    assert.match(md, /- Align \(refactor\)/);
    assert.equal(groupOfKey('sidebar:run'), 'sidebar');
    assert.equal(groupOfKey('ce.x'), 'commands');
});

test('what is read back from the store is checked, whatever it holds', () => {
    assert.deepEqual(sanitize(undefined, T0), emptyUsage(T0));
    assert.deepEqual(sanitize('junk', T0), emptyUsage(T0));
    const d = sanitize({ since: T0 - DAY, entries: { good: { n: 3, first: T0 - DAY, last: T0, days: { '2026-10-01': 3, bad: 2 } }, bad1: { n: -1, last: 1 }, bad2: null, bad3: { n: 2 } } }, T0);
    assert.deepEqual(Object.keys(d.entries), ['good']);
    assert.deepEqual(d.entries.good.days, { '2026-10-01': 3 });
    assert.equal(d.since, T0 - DAY);
    assert.equal(sanitize({ since: T0 + 5 * DAY }, T0).since, T0, 'a start in the future is not believed');
});

test('the page shows the three lists and is safe', () => {
    const d = emptyUsage(T0);
    record(d, 'ce.a', T0); record(d, 'ce.b', T0);
    const html = usageBody(rank(d, [...catalog, { key: 'ce.e', label: '<b>Evil</b>', group: 'x' }], T0 + 20 * DAY));
    assert.match(html, /Most used/);
    assert.match(html, /<progress class="meter" value="1" max="1">/, 'a bar without an inline style (the page has a nonce)');
    assert.match(html, /Little used/);
    assert.match(html, /Never used \(3\)/);
    assert.ok(!html.includes('<b>Evil</b>') && html.includes('&lt;b&gt;Evil'), 'labels are escaped');
    assert.ok(!/\sstyle=/.test(html));
    assert.match(usageBody(rank(emptyUsage(T0), catalog, T0)), /Nothing counted yet/);
    assert.match(usageBody(rank(emptyUsage(T0), catalog, T0)), /The counting is young/);
});

test('every command of the extension is registered through the counting, and the counting is wired', () => {
    const src = path.join(__dirname, '..');
    for (const f of ['extension.ts', 'services/NavCommands.ts', 'services/StatusMenu.ts', 'services/TranslateCommands.ts', 'services/EncodingCommands.ts', 'services/LanguageCommands.ts', 'webview/MarkdownEditorProvider.ts']) {
        const t = fs.readFileSync(path.join(src, f), 'utf8');
        const direct = t.split('\n').filter(l => /vscode\.commands\.registerCommand\(/.test(l) && !/ce\.usage\.show/.test(l));
        assert.deepEqual(direct, [], f + ': a command registered without the counting');
    }
    const ext = fs.readFileSync(path.join(src, 'extension.ts'), 'utf8');
    assert.match(ext, /usage\.attach\(context\.globalState\)/);
    assert.match(ext, /void usage\.flush\(\)/, 'saved when the extension stops');
    for (const [f, area] of [['webview/FormDesignerPanel.ts', 'designer'], ['webview/BlueprintPanel.ts', 'blueprint'], ['webview/MemberViewerPanel.ts', 'sidebar'], ['webview/ProjectPanel.ts', 'insights']]) {
        assert.match(fs.readFileSync(path.join(src, f), 'utf8'), new RegExp("hitMessage\\('" + area + "'"), f);
    }
    const pkg = JSON.parse(fs.readFileSync(path.join(src, '..', 'package.json'), 'utf8'));
    assert.ok(pkg.contributes.commands.some((c: { command: string }) => c.command === 'ce.usage.show'));
});
