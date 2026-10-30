import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

const root = path.join(__dirname, '..');
const read = (f: string): string => fs.readFileSync(path.join(root, f), 'utf8');

test('a message that says what went wrong offers the next step as a button, and every failure offers the log', () => {
    const n = read('services/Notify.ts');
    assert.match(n, /noEditor\(\)/);
    assert.match(n, /'Open a file\.\.\.'/);
    assert.match(n, /'Pick a member\.\.\.', command: 'ce\.nav\.pickMember'/);
    assert.match(n, /\{ label: 'Show the log', command: 'ce\.showLog' \}/);
    assert.match(n, /executeCommand\(chosen\.command/);
});

test('the plain messages of the commands go through it', () => {
    const ext = read('extension.ts');
    assert.ok(!/showWarningMessage\('No active editor\.'\)/.test(ext), 'no bare "No active editor" left in the commands');
    assert.ok(!/showWarningMessage\('Place cursor on a class member first\.'\)/.test(ext));
    assert.ok(!/showErrorMessage\('Code Explorer failed/.test(ext));
    assert.match(ext, /notify\.failed\('Code Explorer failed: ' \+ msg, \[\{ label: 'Reload the window'/);
    assert.match(ext, /trackedCommand\('ce\.showLog'/);
    for (const f of ['services/BatchOperations.ts', 'services/CodeReviewService.ts', 'services/DocumentationGenerator.ts', 'services/ExportService.ts', 'services/FormCommands.ts', 'webview/MemberViewerPanel.ts']) {
        const s = read(f);
        assert.ok(/import \{ notify \} from '(\.\/|\.\.\/services\/)Notify'/.test(s), f + ' imports notify');
        assert.ok(!/showErrorMessage\('CE: ' \+ plan\.error\)/.test(s), f);
    }
    assert.match(read('services/FormCommands.ts'), /notify\.failed\('CE: ' \+ plan\.error, \[\{ label: 'Check the form', command: 'ce\.delphi\.check' \}\]\)/);
    const pkg = JSON.parse(fs.readFileSync(path.join(root, '..', 'package.json'), 'utf8')) as { contributes: { commands: { command: string }[] } };
    assert.ok(pkg.contributes.commands.some(c => c.command === 'ce.showLog'));
});
