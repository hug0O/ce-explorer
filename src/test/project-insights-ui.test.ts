import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { projectHtml } from '../webview/projectHtml';

const html = projectHtml('N');
const script = /<script nonce="N">([\s\S]*)<\/script>/.exec(html)![1];

test('the project page is valid and has a progress bar, a cancel button and one filter for the tabs that have none', () => {
    assert.doesNotThrow(() => new Function('acquireVsCodeApi', 'document', 'window', script), 'the page script parses');
    for (const id of ['cancelScan', 'pbar', 'pfill', 'gfilter', 'gcount']) { assert.ok(html.includes('id="' + id + '"'), id); }
    assert.match(script, /state\.progress\.done \/ state\.progress\.total/, 'the bar follows the scan');
    assert.match(script, /function applyGenericFilter\(\)/);
    assert.match(script, /r\.hidden = !hit/);
    assert.match(script, /hd\.hidden = words\.length > 0 && !live/, 'a heading with no row left is hidden');
    assert.match(script, /state\.tab === 'sql' \|\| state\.tab === 'texts' \|\| state\.tab === 'changes'/, 'the tabs that have their own filter keep it');
    assert.match(script, /gfilter: state\.gfilter/, 'the text is remembered');
    assert.match(script, /postMessage\(\{ type: 'cancelScan' \}\)/);
});

test('a scan can be cancelled from the page, and the page is told it stopped', () => {
    const panel = fs.readFileSync(path.join(__dirname, '..', 'webview', 'ProjectPanel.ts'), 'utf8');
    assert.match(panel, /case 'cancelScan': this\.cancel\?\.cancel\(\); break;/);
    assert.match(panel, /else if \(this\.cancel === source\) \{ this\.post\(\{ type: 'scanning', on: false \}\); \}/);
});
