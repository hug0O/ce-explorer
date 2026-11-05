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
    assert.ok(script.includes('var test = filterTest(box.value), n = 0;') && script.includes("var show = test(method + ' ' + (li.getAttribute('data-text') || ''));"), 'Used, from outside and local');
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

import { OutsideRow, groupByMethod, outsideRowsHtml } from '../webview/manageSection';

const row = (label: string, uses: OutsideRow['uses'], extra: Partial<OutsideRow> = {}): OutsideRow => ({ label, kind: 'function', count: uses.length, line: uses[0]?.line ?? 0, uses, more: 0, canOpen: true, originFile: 'UData.pas', originLine: 3, ...extra });

test('both lists are by method: an object of another file is under each routine that writes it, a local object under its routine, named without it', () => {
    const rows = [
        row('UData.Load', [{ line: 5, text: 'Load;', parent: 'T.Go', parentLine: 4 }, { line: 12, text: 'Load;', parent: 'T.Stop', parentLine: 10 }, { line: 6, text: 'Load(1);', parent: 'T.Go', parentLine: 4 }]),
        row('UData.Save', [{ line: 13, text: 'Save;', parent: 'T.Stop', parentLine: 10 }]),
    ];
    const g = groupByMethod(rows, 'use');
    assert.deepEqual(g.map(x => [x.name, x.rows.map(r => r.label)]), [['T.Go', ['UData.Load']], ['T.Stop', ['UData.Load', 'UData.Save']]], 'Load is under both routines, Save under one');
    assert.deepEqual(g[0].rows[0].uses.map(u => u.line), [5, 6], 'only the lines of that routine');
    assert.equal(g[1].rows[0].idx, 0, 'the arrow of a split row still asks for the object of the host');
    assert.equal(g[1].rows[1].idx, 1);

    const locals = [
        row('I', [], { scope: { name: 'T.Go', line: 4 }, kind: 'variable', canOpen: false }),
        row('Total', [], { scope: { name: 'T.Stop', line: 10 }, kind: 'variable', canOpen: false }),
        row('GCount', [], { kind: 'variable', canOpen: false }),
    ];
    const l = groupByMethod(locals, 'declared');
    assert.deepEqual(l.map(x => [x.name, x.rows.map(r => r.label)]), [['', ['GCount']], ['T.Go', ['I']], ['T.Stop', ['Total']]], 'the objects of the file first, then each routine in the order of the source');
    const html = outsideRowsHtml(rows);
    assert.ok(html.includes('<span class="mtx">File</span>') === false && html.includes('data-method="t.go"') && html.includes('data-method="t.stop"'));
    assert.match(outsideRowsHtml([row('X', [])]), /<li class="mmeth" data-method=""><details open><summary title="File">/, 'what belongs to no routine is the group File');
});

test('the filter is tried on the routine and on the object apart, never on routine.object', () => {
    const filterTest = pageFilter();
    const tried = (method: string, text: string): string => method + ' ' + text;
    assert.ok(filterTest('go')(tried('t.go', 'udata.load function')), 'the name of the routine shows its objects');
    assert.ok(filterTest('load')(tried('t.go', 'udata.load function')), 'the name of an object shows it under its routine');
    assert.ok(filterTest('go load')(tried('t.go', 'udata.load function')), 'a routine and an object together');
    assert.ok(!filterTest('stop load')(tried('t.go', 'udata.load function')), 'another routine does not match');
    assert.ok(!filterTest('go.load')(tried('t.go', 'udata.load function')), 'there is no routine.object to find it with');
});
