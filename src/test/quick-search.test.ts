import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { PackageLike, fold, quickActions, searchActions } from '../services/QuickActions';
import { shortLabel } from '../webview/shortcutsSection';

const root = path.join(__dirname, '..', '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as PackageLike & { contributes: { menus: Record<string, { command?: string }[]> } };
const delphi = quickActions(pkg, { ext: '.pas', languageId: 'pascal' });

test('what a person types in their own words finds the action, in French or English, with or without accents', () => {
    const first = (q: string): string | undefined => searchActions(delphi, q)[0]?.command;
    assert.equal(first('traduire fiche'), 'ce.translateForm');
    assert.equal(first('renommer'), 'ce.rename');
    assert.equal(first('code mort'), 'ce.detectDeadCode');
    assert.equal(first('verifier fiche'), 'ce.delphi.check');
    assert.equal(first('vérifier fiche'), 'ce.delphi.check', 'accents do not matter');
    assert.equal(first('graphe appels'), 'ce.blueprint.open');
    assert.ok(searchActions(delphi, 'zzzzqq').length === 0);
    assert.equal(searchActions(delphi, '   ').length, delphi.length, 'nothing typed: everything');
    assert.equal(fold('Créer À'), 'creer a');
});

test('a label that starts with the word comes before one that only has it among its words, and what is used most comes first among equals', () => {
    const r = searchActions(delphi, 'translate');
    assert.ok(r.length >= 3 && r.slice(0, 3).every(x => /translate/i.test(x.label)));
    const counts = { 'ce.translateForm': 9 };
    assert.equal(searchActions(delphi, 'translate', counts)[0].command, 'ce.translateForm');
    const byUse = quickActions(pkg, { ext: '.pas', languageId: 'pascal' }, { 'ce.fixEncoding': 50 }).filter(x => x.group === 'tools');
    assert.equal(byUse[0].command, 'ce.fixEncoding', 'in its group the most used command is first');
});

test('every command is found by « CE: » in the palette and the labels do not carry the prefix', () => {
    const titles = (pkg.contributes.commands ?? []).map(c => c.title);
    assert.deepEqual(titles.filter(t => !t.startsWith('CE: ')), []);
    assert.equal(shortLabel('CE: Delphi - Check form (.dfm vs .pas)'), 'Check form');
    assert.equal(shortLabel('CE: PL/SQL - Find callers'), 'Find callers');
    assert.equal(shortLabel('CE Delphi: Align / Size / Space Components...'), 'Align / Size / Space Components', 'the old form still reads');
    assert.equal(delphi.find(x => x.command === 'ce.delphi.check')!.detail, '.dfm vs .pas');
});

test('one Rename entry is in the editor menu and decides by what is under the cursor', () => {
    assert.ok(pkg.contributes.commands!.some(c => c.command === 'ce.rename'));
    assert.ok(pkg.contributes.menus['ce.editorMenu'].some(m => m.command === 'ce.rename'));
    assert.ok(pkg.contributes.menus['ce.editorMore'].some(m => m.command === 'ce.translateForm'));
    const ext = fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8');
    assert.match(ext, /trackedCommand\('ce\.rename', async/);
    assert.match(ext, /executeCommand\('ce\.renameMember'\)/);
    assert.match(ext, /executeCommand\('ce\.renameVariable'\)/);
    assert.match(ext, /executeCommand\('ce\.renamePreview'\)/);
});
