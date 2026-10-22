import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { GUIDE, guideListHtml, guidePageHtml, inline } from '../webview/guideContent';
import { changelogHtml, parseChangelog } from '../webview/changelogSection';

const root = path.resolve(__dirname, '..', '..');

test('every topic has a distinct id the sidebar can send back, and its picture exists', () => {
    const ids = GUIDE.map(t => t.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const t of GUIDE) {
        assert.match(t.id, /^[a-z]{1,20}$/, 'the sidebar only accepts such an id');
        assert.ok(t.title && t.summary && t.body.length, t.id);
        if (t.media) { assert.ok(fs.existsSync(path.join(root, 'media', 'guide', t.media)), t.media + ' is in media/guide'); }
    }
});

test('no picture of media/guide is left out of the guide, and none is too heavy for the package', () => {
    const used = new Set(GUIDE.map(t => t.media).filter(Boolean));
    for (const f of fs.readdirSync(path.join(root, 'media', 'guide'))) {
        assert.ok(used.has(f), f + ' is not in the guide');
        assert.ok(fs.statSync(path.join(root, 'media', 'guide', f)).size < 1_500_000, f + ' is over 1.5 MB');
    }
});

test('the guide page shows every topic and its picture, and only lets its own pictures in', () => {
    const html = guidePageHtml({ nonce: 'N', cspSource: 'vscode-resource:', media: f => 'vscode-resource:/media/guide/' + f, topic: 'menus' });
    for (const t of GUIDE) { assert.ok(html.includes(`<section id="${t.id}">`), t.id); }
    assert.match(html, /<img src="vscode-resource:\/media\/guide\/menus\.gif"/);
    assert.match(html, /img-src vscode-resource: data:;/);
    assert.match(html, /default-src 'none'/);
    assert.match(html, /var want = "menus"/);
});

test('text is escaped, with code and bold kept', () => {
    assert.equal(inline('a <b> `x&y` **bold**'), 'a &lt;b&gt; <code>x&amp;y</code> <b>bold</b>');
});

test('the Changelog + Guide view has one line per topic and the versions', () => {
    const md = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
    const html = changelogHtml(parseChangelog(md), '0.0.0');
    assert.match(html, /^<details class="clog-ver clog-guide" open>/, 'the guide comes first');
    assert.equal((html.match(/data-guide="[a-z]+"/g) ?? []).length, GUIDE.length);
    assert.match(html, /data-guide=""/, 'the whole guide');
    assert.match(guideListHtml(), /🎞/);
    assert.match(html, /<div class="clog-h">Changelog<\/div>/);
});

test('the view is declared below Member, folded, and registered', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { contributes: { views: Record<string, { id: string; name: string; visibility?: string }[]> } };
    const views = pkg.contributes.views['ce-explorer'];
    const guide = views.find(v => v.id === 'ceGuideView');
    assert.equal(guide?.name, 'Changelog + Guide');
    assert.equal(guide?.visibility, 'collapsed');
    assert.ok(views.findIndex(v => v.id === 'ceViewer') < views.indexOf(guide!), 'after Member');
    assert.match(fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8'), /registerWebviewViewProvider\(GuideSidebarPanel\.viewType/);
    assert.ok(!/changelog/i.test(fs.readFileSync(path.join(root, 'src', 'webview', 'MemberViewerPanel.ts'), 'utf8')), 'Member no longer carries it');
});
