import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { deadCodeHtml } from '../webview/deadCodeHtml';
import { projectHtml } from '../webview/projectHtml';
import type { DeadCodeItem } from '../services/DeadCodeDetector';

const read = (f: string): string => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const items: DeadCodeItem[] = [
    { kind: 'import', name: 'os', file: 'C:/p/a.py', line: 0, col: 7, endCol: 9, rule: 'F401', tool: 'pyflakes / flake8 / ruff', message: "'os' imported but unused" },
    { kind: 'local', name: 'tmp', file: 'C:/p/a.py', line: 5, rule: 'F841', tool: 'pyflakes / flake8 / ruff' },
    { kind: 'unreachable', name: 'print("never")', file: 'C:/p/a.py', line: 14, rule: 'W0101', tool: 'pylint unreachable' },
    { kind: 'method', name: 'run', className: 'Svc', file: 'C:/p/b.py', line: 3 },
    { kind: 'class', name: 'Lost', file: 'C:/p/c.py', line: 1 },
];

test('the Dead Code report groups what the compiler reports, with the rule, then what the workspace never refers to', () => {
    const html = deadCodeHtml(items, 'C:/p/a.py');
    assert.match(html, /Read from the text of a\.py, as pyflakes \/ flake8 \/ ruff, pylint unreachable would report it/);
    assert.match(html, /Unused imports \(1\)/);
    assert.match(html, /Local variables never read \(1\)/);
    assert.match(html, /Unreachable code \(1\)/);
    assert.match(html, /<tr data-idx="0"[^>]*title="pyflakes \/ flake8 \/ ruff - &#39;os&#39; imported but unused"|<tr data-idx="0"[^>]*title="pyflakes \/ flake8 \/ ruff - 'os' imported but unused"/);
    assert.match(html, /<td>os<\/td><td class="muted">F401<\/td><td>1<\/td>/);
    assert.match(html, /Never referenced in the workspace \(2\)/);
    assert.match(html, /data-idx="3"[^>]*><td>method<\/td><td>Svc\.run<\/td><td class="muted">b\.py<\/td><td>4<\/td>/, 'the rows of the workspace keep their index in the whole list');
    assert.ok(!html.includes('Private members nobody uses'), 'a group with nothing is not drawn');
    assert.match(deadCodeHtml([], 'x.ts'), /Nothing unused in this file ✓/);
    assert.match(deadCodeHtml([], 'x.ts'), /Nothing ✓/);
});

test('the Export button is gone from Tools, and Dead Code says what it checks', () => {
    const tools = read('webview/toolsSection.ts');
    assert.ok(!tools.includes('data-ak="export"'));
    assert.match(tools, /data-ak="deadcode" title="What the compiler or linter of the language says is unused/);
    const panel = read('webview/MemberViewerPanel.ts');
    assert.match(panel, /unusedInParsed\(provider\.parseDocument\(doc\), text, doc\.uri\.fsPath, extra\)/, 'the file is read first');
    assert.match(panel, /this\._analyticsData = \[\.\.\.own, \.\.\.wide\]/);
    assert.match(panel, /DiagnosticTag\.Unnecessary/, 'the unused code is faded in the editor');
    assert.match(panel, /ce-unused/);
    assert.match(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'), /ce\.exportStructure/, 'the command stays in the palette');
});

test('Project insights follows the languages of the project', () => {
    const html = projectHtml('N');
    const script = /<script nonce="N">([\s\S]*)<\/script>/.exec(html)![1];
    assert.doesNotThrow(() => new Function('acquireVsCodeApi', 'document', 'window', script), 'the page script parses');
    assert.match(script, /l\.language \+ ' ' \+ l\.files/, 'the status line lists the languages with their files and lines');
    assert.match(script, /function pickTab\(\)/, 'the tab that opens is one that has something');
    assert.match(script, /state\.chose = true/);
    assert.match(script, /pickTab\(\); render\(\);/);
    for (const kind of ['import', 'local', 'private', 'function', 'unreachable']) { assert.ok(script.includes(`'${kind}'`), kind); }
    assert.match(script, /x\.rule \|\| x\.kind/, 'the badge of a row is the rule of the compiler');
    assert.match(script, /in every language of the project: lines of code/, 'the size covers Delphi too');
    const scanner = read('services/ProjectScanner.ts');
    assert.match(scanner, /language: 'Delphi', name: r\.result\.name/, 'the Delphi units are sized like the others');
    assert.match(scanner, /unusedInParsed\(pascal\.parseDocument/, 'and checked like the others');
    assert.match(scanner, /languages,\n\s+common,/);
});
