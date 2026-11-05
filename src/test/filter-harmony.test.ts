import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { manageScript, outsidePageHtml } from '../webview/manageSection';

const root = path.join(__dirname, '..', '..');

/** The filter rule of the page, taken out of the script the page really gets (a template string can change what is written in it). */
function pageFilter(): (q: string) => (text: string) => boolean {
    const m = /function filterTest\(q\) \{[\s\S]*?\n {4}\}/.exec(manageScript());
    assert.ok(m, 'the page has one filter rule');
    return new Function(m![0] + '; return filterTest;')() as (q: string) => (text: string) => boolean;
}

test('one filter rule for Structure, Used and Local: words in any order, each a regular expression or plain text, any case', () => {
    const filterTest = pageFilter();
    assert.ok(filterTest('')('anything'));
    assert.ok(filterTest('udata save')('udata.tstore.save'), 'both words found');
    assert.ok(filterTest('save udata')('udata.tstore.save'), 'in any order');
    assert.ok(!filterTest('udata load')('udata.tstore.save'), 'every word must be found');
    assert.ok(filterTest('^udata')('udata.tstore.save') && !filterTest('^tstore')('udata.tstore.save'), 'a word can be a regular expression');
    assert.ok(filterTest('SAVE')('udata.tstore.save'), 'any case');
    assert.ok(filterTest('save(')('x.save(1)') && !filterTest('save(')('x.load'), 'a word that is not a regular expression is plain text');
    assert.ok(filterTest('sa')('save') && filterTest('sa  ve')('save sa ve') === true, 'a word with a letter s is not cut at the s');
});

test('the three lists use that rule, keep one text and show the same kind of box', () => {
    const script = manageScript();
    assert.ok(script.includes('var test = filterTest(v);') && script.includes('(!v || test(text))'), 'Structure');
    assert.ok(script.includes('var test = filterTest(box.value), n = 0;') && script.includes('var show = test(t);'), 'Used, from outside and local');
    assert.ok(script.includes("api.postMessage({ command: 'manageFilter', text: box.value })"), 'the text typed in Used is the one of Structure');
    const html = outsidePageHtml({ rows: [], ready: true, local: [], filter: 'Save', focusFilter: true });
    assert.match(html, /<input id="mOutFilter" class="inp" type="text" spellcheck="false" placeholder="Filter: [^"]*\(words, regex ok\)" value="Save" data-focus="1">/);
    assert.match(outsidePageHtml({ rows: [], ready: true, local: [] }), /value=""><button class="mclear" id="mOutClear"/, 'the same clear button as Structure');
    const manage = fs.readFileSync(path.join(root, 'src', 'webview', 'manageSection.ts'), 'utf8');
    assert.match(manage, /placeholder="Filter: name, type, kind… \(words, regex ok\)"/);
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'MemberViewerPanel.ts'), 'utf8');
    assert.match(panel, /if \(msg\.kind !== undefined\) \{ this\._manageKind =/, 'the kind chosen in Structure survives a filter typed in Used');
    assert.match(panel, /filter: this\._manageFilter, focusFilter: this\._focusFilter/, 'the page of Used starts from the same text');
});
