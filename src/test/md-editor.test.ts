import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { mdCss, mdHtml, mdScript } from '../webview/mdEditorHtml';

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;
nodeModule._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? {} : originalLoad(r, parent, isMain));
const { normalize, drawBlock } = require('../webview/MarkdownEditorProvider') as typeof import('../webview/MarkdownEditorProvider');

const root = path.join(__dirname, '..', '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
    activationEvents: string[];
    contributes: { customEditors: { viewType: string; priority: string; selector: { filenamePattern: string }[] }[]; commands: { command: string }[]; menus: Record<string, { command?: string }[]> };
};

test('the editor keeps the blocks as the user left them: an empty one stays, one with a blank line inside becomes two', () => {
    assert.deepEqual(normalize(['# A', '', 'one\n\ntwo', '   ']), ['# A', '', 'one', 'two', '']);
    assert.deepEqual(normalize([]), []);
});

test('a block is drawn, an empty one is blank, and [[toc]] lists the headings of the page', () => {
    assert.equal(drawBlock('', [''], {}), '');
    assert.equal(drawBlock('**x**', ['**x**'], {}), '<p><strong>x</strong></p>');
    const toc = drawBlock('[[toc]]', ['# Intro', '[[toc]]', '## Part *two*'], {});
    assert.match(toc, /^<nav class="toc"><a href="#intro" style="padding-left:0px">Intro<\/a><a href="#part-two" style="padding-left:14px">Part two<\/a><\/nav>$/);
    assert.match(drawBlock('[[toc]]', ['[[toc]]'], {}), /No heading yet/);
    assert.match(drawBlock('![a](pic.png)', ['![a](pic.png)'], { base: 'vscode-resource://d/' }), /src="vscode-resource:\/\/d\/pic\.png"/, 'relative images are found next to the file');
});

test('the page: edit and view, blocks, the / menu, lists that continue, code that takes Enter, moving blocks', () => {
    const html = mdHtml({ nonce: 'abc', cspSource: 'vscode-resource:', title: 'A <b>' });
    for (const id of ['modeBtn', 'outBtn', 'textBtn', 'doc', 'outline', 'slash']) { assert.ok(html.includes('id="' + id + '"'), id); }
    assert.match(html, /script-src 'nonce-abc'/);
    assert.ok(html.includes('A &lt;b&gt;') && !html.includes('A <b>'));
    const js = mdScript();
    assert.doesNotThrow(() => new Function('acquireVsCodeApi', 'document', 'window', js.replace('(function () {', '(function () { return;')), 'the script parses');
    for (const probe of ["type: 'blocks'", "type: 'draft'", "type: 'toggle'", "type: 'link'", "type: 'openText'", "type: 'ready'"]) { assert.ok(js.includes(probe), probe); }
    assert.match(js, /e\.key === 'Enter' \|\| e\.key === 'Tab'\) \{ pick\(/, 'Enter or Tab picks in the menu');
    assert.match(js, /if \(openFence\(v\)\) \{ return; \}/, 'Enter inside a code block is a new line');
    assert.match(js, /e\.altKey && \(e\.key === 'ArrowUp' \|\| e\.key === 'ArrowDown'\)/, 'Alt+arrows move the block');
    assert.match(js, /if \(!drawing && editing === i && !menuState\)/, 'a text box removed by a redraw does not count as a block left');
    for (const t of ['Heading 1', 'To-do list', 'Code block', 'Table', 'Divider', 'Callout']) { assert.ok(js.includes(t), t + ' is in the menu'); }
    assert.ok(mdCss().includes('#slash'));
});

test('the editor is wired: an opt-in custom editor for .md, two commands, an entry in the right-click menu and the title bar', () => {
    const ce = pkg.contributes.customEditors[0];
    assert.equal(ce.viewType, 'ce.markdownEditor');
    assert.equal(ce.priority, 'option', 'the usual Markdown editor stays the default');
    assert.deepEqual(ce.selector.map(s => s.filenamePattern), ['*.md', '*.markdown']);
    assert.ok(pkg.activationEvents.includes('onCustomEditor:ce.markdownEditor'));
    for (const c of ['ce.markdown.open', 'ce.markdown.new']) { assert.ok(pkg.contributes.commands.some(x => x.command === c), c); }
    assert.ok(pkg.contributes.menus['editor/title'].some(m => m.command === 'ce.markdown.open'));
    assert.ok(pkg.contributes.menus['ce.editorMore'].some(m => m.command === 'ce.markdown.open'));
    assert.match(fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8'), /MarkdownEditorProvider\.register\(context\)/);
    const provider = fs.readFileSync(path.join(root, 'src', 'webview', 'MarkdownEditorProvider.ts'), 'utf8');
    assert.match(provider, /registerCustomEditorProvider\(MarkdownEditorProvider\.viewType/);
    assert.match(provider, /if \(document\.getText\(\) === written\) \{ return; \}/, 'what the editor wrote itself is not drawn again');
    assert.match(provider, /localResourceRoots: \[dir,/, 'images next to the file can be shown');
    assert.match(provider, /vscode\.env\.openExternal/);
});
