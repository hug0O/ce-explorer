import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { ActionLog, ageText } from '../services/ActionLog';

const root = path.join(__dirname, '..');
const read = (f: string): string => fs.readFileSync(path.join(root, f), 'utf8');

function store(): { get: <T>(k: string, d: T) => T; update: (k: string, v: unknown) => Promise<void>; data: Map<string, unknown> } {
    const data = new Map<string, unknown>();
    return { data, get: <T>(k: string, d: T): T => (data.has(k) ? data.get(k) as T : d), update: async (k: string, v: unknown) => { data.set(k, v); } };
}

test('the log keeps what was changed, newest first, without the CE prefix and the tick, and is remembered', () => {
    const s = store();
    const log = new ActionLog();
    log.init(s);
    log.record('CE: Added "Save" to TMain ✓', 'C:/p/Main.pas', 1000);
    log.record('Renamed "A" to "B"', 'C:/p/Main.pas', 2000);
    log.record('   ', undefined, 3000);
    assert.deepEqual(log.list().map(e => e.label), ['Renamed "A" to "B"', 'Added "Save" to TMain']);
    const again = new ActionLog();
    again.init(s);
    assert.equal(again.list().length, 2, 'read back from the workspace');
    for (let i = 0; i < 100; i++) { log.record('x' + i, undefined, i); }
    assert.equal(log.list().length, 60, 'the last sixty');
    log.clear();
    assert.deepEqual(log.list(), []);
});

test('the age of an entry is told in words', () => {
    const now = 10_000_000_000;
    assert.equal(ageText(now - 10_000, now), 'just now');
    assert.equal(ageText(now - 3 * 60_000, now), '3 min ago');
    assert.equal(ageText(now - 2 * 3_600_000, now), '2 h ago');
    assert.equal(ageText(now - 30 * 3_600_000, now), 'yesterday');
    assert.equal(ageText(now - 5 * 86_400_000, now), '5 days ago');
});

test('an edit says so with an Undo button and writes the log; the Blueprint and the menu use it too', () => {
    const n = read('services/Notify.ts');
    assert.match(n, /async done\(message: string\)/);
    assert.match(n, /showInformationMessage\(message, 'Undo'\)/);
    assert.match(n, /executeCommand\('undo'\)/);
    assert.match(n, /actionLog\.record\(message, uri\?\.fsPath\)/);
    const ops = read('services/MemberOperations.ts');
    for (const msg of ['Deleted member', 'Renamed "', 'Updated "', 'Doc header inserted']) { assert.ok(new RegExp('void notify\\.done\\([^\\n]*' + msg.replace(/"/g, '"')).test(ops), msg + ' offers Undo'); }
    assert.ok(!/showInformationMessage\(`Deleted member/.test(ops) && !/showInformationMessage\(`Renamed "/.test(ops));
    const ext = read('extension.ts');
    assert.match(ext, /void notify\.done\('CE: Added "'/);
    assert.match(ext, /actionLog\.init\(context\.workspaceState\)/);
    assert.match(ext, /registerCommand\('ce\.showActionLog'/);
    assert.match(read('webview/BlueprintPanel.ts'), /actionLog\.record\('Blueprint: ' \+ label/);
    assert.match(read('webview/ProjectBlueprintPanel.ts'), /actionLog\.record\('Blueprint: '/);
    assert.match(read('services/StatusMenu.ts'), /command: 'ce\.showActionLog'/);
    const pkg = JSON.parse(fs.readFileSync(path.join(root, '..', 'package.json'), 'utf8')) as { contributes: { commands: { command: string }[] } };
    assert.ok(pkg.contributes.commands.some(c => c.command === 'ce.showActionLog'));
});

test('the analyses show their progress in the status bar', () => {
    const p = read('webview/MemberViewerPanel.ts');
    assert.match(p, /await vscode\.window\.withProgress\(\{ location: vscode\.ProgressLocation\.Window, title: 'CE: ' \+ \(doing\[kind\] \?\? 'Working'\) \+ '…' \}/);
    assert.match(p, /review: 'Reviewing the file'/);
});

test('Templates answer to the keys of the other lists, and the project Blueprint says uses where the file one says calls', () => {
    const t = read('webview/TemplateSidebarPanel.ts');
    assert.match(t, /class=\\"tpl-row\\" data-text=\\"\$\{text\}\\" tabindex=\\"0\\"|tabindex="0"/);
    for (const probe of ["e.key === 'ArrowDown' || e.key === 'ArrowUp'", "e.key === 'Enter' && ins", "e.key === 'Delete' && del", "(e.key === 'f' || e.key === 'F') && fav", "e.key === '/'"]) { assert.ok(t.includes(probe), probe); }
    const bp = read('webview/blueprintHtml.ts');
    assert.match(bp, /inl\.textContent = projectMode \? 'used by' : 'call'/);
    assert.match(bp, /outl\.textContent = projectMode \? 'uses' : 'then'/);
    assert.match(bp, /'uses the selected' : 'calls the selected'/);
    assert.match(read('webview/shortcutsSection.ts'), /Templates: insert \/ edit \/ delete \/ star/);
});

test('the preview says how many changes in how many files before asking', () => {
    const s = read('services/SafePreview.ts');
    assert.match(s, /const total = documents\.reduce\(\(n, d\) => n \+ d\.edits\.length, 0\)/);
    assert.match(s, /Apply \$\{total\} change/);
});
