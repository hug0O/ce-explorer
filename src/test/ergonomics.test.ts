import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { DISCOVER, suggestion } from '../services/Tips';
import { blueprintHtml, blueprintScript } from '../webview/blueprintHtml';
import { toolsHtml } from '../webview/toolsSection';

const root = path.join(__dirname, '..', '..');
const read = (...p: string[]): string => fs.readFileSync(path.join(root, ...p), 'utf8');

test('a feature never used is suggested once the extension is in use, one a day, and a Delphi one only for a Delphi file', () => {
    assert.equal(suggestion({ 'ce.showActions': 3 }, true), undefined, 'a newcomer is not nagged');
    const used = { 'ce.showActions': 12 } as Record<string, number>;
    const a = suggestion(used, false, new Date(2026, 10, 5));
    assert.ok(a && !a.delphi && !used[a.command]);
    assert.ok(suggestion(used, true, new Date(2026, 10, 5)));
    assert.deepEqual(suggestion(used, false, new Date(2026, 10, 5)), suggestion(used, false, new Date(2026, 10, 5)), 'the same all day');
    const all = Object.fromEntries(DISCOVER.map(d => [d.command, 1])) as Record<string, number>;
    all['ce.showActions'] = 20;
    assert.equal(suggestion(all, true), undefined, 'everything was tried');
    const nonDelphi = Object.fromEntries(DISCOVER.filter(d => !d.delphi).map(d => [d.command, 5])) as Record<string, number>;
    nonDelphi['ce.showActions'] = 20;
    assert.equal(suggestion(nonDelphi, false), undefined, 'a Delphi feature is not offered for another language');
    for (const d of DISCOVER) { assert.ok(JSON.parse(read('package.json')).contributes.commands.some((c: { command: string }) => c.command === d.command), d.command + ' is a command'); }
    assert.match(read('src', 'services', 'StatusMenu.ts'), /suggestion\(counts, delphi\)/);
});

test('the Tools tab keeps the everyday buttons in sight and folds the others under More', () => {
    const html = toolsHtml('', undefined, true, true, 'analyze');
    const more = /<details class="more"><summary>More<\/summary>([\s\S]*?)<\/details>/.exec(html)![1];
    for (const c of ['ce.renamePreview', 'ce.translateForm', 'ce.usage.show']) { assert.ok(more.includes('data-common="' + c + '"'), c + ' is under More'); }
    assert.ok(!more.includes('ce.delphi.project') && !more.includes('ce.blueprint.open'), 'the everyday ones are not folded');
    const pl = toolsHtml('', undefined, true, false, 'plsql');
    assert.match(pl, /<summary>More PL\/SQL tools<\/summary>[\s\S]*ce\.plsql\.utplsql/);
    assert.ok(pl.indexOf('ce.plsql.syncPackage') < pl.indexOf('More PL/SQL tools'));
});

test('a file the extension cannot read gets a next step, and the edits of the form tools offer Undo on the right file', () => {
    assert.match(read('src', 'services', 'Notify.ts'), /noProvider\(\): Promise<void> \{[\s\S]*ce\.setLanguage/);
    assert.ok(!/No language provider for this file type/.test(read('src', 'extension.ts')));
    const dc = read('src', 'services', 'DelphiCommands.ts');
    assert.match(dc, /notify\.done\(`CE: \$\{applied\} fix\(es\) applied\.`, l\.dfmDoc\.uri\)/);
    assert.match(read('src', 'services', 'RenamePreview.ts'), /notify\.done\(`CE: \$\{count\} place\(s\) renamed/);
});

test('the Blueprint has a simple view that hides what edits and is remembered', () => {
    const html = blueprintHtml({ nonce: 'n', cspSource: 'x', title: 't' });
    assert.match(html, /id="simple" type="checkbox"/);
    assert.match(html, /body\.simple #addNode[^}]*#undo[^}]*display: none/);
    assert.match(blueprintScript(), /localStorage\.setItem\('ce\.blueprint\.simple'/);
    assert.match(html, /No routine to draw in this file\. Open a file with routines/);
});
