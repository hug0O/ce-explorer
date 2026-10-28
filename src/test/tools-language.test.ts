import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LanguageInfo, toolsHtml, toolsScript } from '../webview/toolsSection';

const info = (extra: Partial<LanguageInfo> = {}): LanguageInfo => ({
    options: [{ id: 'pascal', label: 'Pascal / Delphi' }, { id: 'plsql', label: 'PL/SQL (Oracle)' }],
    current: '', detected: '', ext: '.inc', byExtension: false, ...extra,
});

test('Tools offers the language of the file: Auto first, then each language', () => {
    const html = toolsHtml(':=', undefined, false, false, '', info());
    assert.match(html, /<select id="langSel"/);
    assert.match(html, /<option value="" selected>Auto: not recognised<\/option><option value="pascal">Pascal \/ Delphi<\/option><option value="plsql">PL\/SQL \(Oracle\)<\/option>/);
    assert.match(html, /id="langEvery"[^>]*> every \.inc file/);
    assert.ok(!/id="langEvery"[^>]*checked/.test(html));
});

test('what was chosen is selected, and what the extension detects is named', () => {
    const chosen = toolsHtml(':=', undefined, false, true, '', info({ current: 'pascal', ext: '.inc', byExtension: true }));
    assert.match(chosen, /<option value="pascal" selected>/);
    assert.match(chosen, /id="langEvery" checked/);
    const detected = toolsHtml(':=', undefined, false, true, '', info({ detected: 'Pascal / Delphi', ext: '' }));
    assert.match(detected, /Auto: Pascal \/ Delphi/);
    assert.ok(!/langEvery/.test(detected), 'a file with no extension has no "every file" choice');
});

test('the tools of a language appear once it is chosen, and the drop-down is not there without a file', () => {
    assert.ok(!/data-dl="ce.delphi.project"/.test(toolsHtml(':=', undefined, false, false, '', info())), 'not Delphi: no Delphi tools');
    assert.match(toolsHtml(':=', undefined, false, true, '', info({ current: 'pascal' })), /data-dl="ce.delphi.project"/);
    assert.match(toolsHtml(':=', undefined, true, false, '', info({ current: 'plsql' })), /data-pl="ce.plsql.syncPackage"/);
    assert.ok(!/langSel/.test(toolsHtml(':=')), 'no active file, no drop-down');
});

test('the page tells the extension what was chosen', () => {
    const script = toolsScript();
    assert.match(script, /command: 'setLanguage', id: langSel.value, scope: every && every.checked \? 'extension' : 'file'/);
});
