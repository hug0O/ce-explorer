import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanTitle, parseBatch, parseMarkdown, parsePowerShell, parseShell } from '../utils/scriptParse';

const names = (items: { name: string }[]): string[] => items.map(i => i.name);

test('Markdown: the headings with their level, the end of each section, the marks of the title removed', () => {
    const md = ['# Title', '', 'text', '', '## Install `now`', 'x', '', '### [Link](http://a.b) **bold**', 'y', '', '## End ##', ''].join('\n');
    const h = parseMarkdown(md);
    assert.deepEqual(h.map(x => [x.name, x.level, x.startLine, x.endLine]), [
        ['Title', 1, 0, 2], ['Install now', 2, 4, 5], ['Link bold', 3, 7, 8], ['End', 2, 10, 10],
    ]);
    assert.equal(cleanTitle('Plain *em* and _under_'), 'Plain em and under');
});

test('Markdown: a # in a code block, in the front matter or in a comment is not a heading; Setext titles are', () => {
    const md = ['---', 'title: x', '# not a heading', '---', '# Real', '```sh', '# comment of the script', '```', '~~~~', '## still code', '~~~~', '<!--', '# hidden', '-->', 'Setext', '======', 'Second', '------', '- item', '---', '#nospace', '    # indented code'].join('\n');
    const h = parseMarkdown(md);
    assert.deepEqual(h.map(x => [x.name, x.level]), [['Real', 1], ['Setext', 1], ['Second', 2]]);
    assert.equal(h[1].startLine, 14, 'a Setext title starts on its text line');
});

test('Markdown: an empty heading is skipped and a closing fence needs the same mark', () => {
    const h = parseMarkdown(['#', '```', '~~~', '# inside', '```', '# after'].join('\n'));
    assert.deepEqual(names(h), ['after']);
});

test('batch: the labels with their lines, the variables once, the parameters used', () => {
    const bat = ['@echo off', 'set "ROOT=C:\\dev"', 'set /a N=1', 'set root=again', 'call :build 1', 'goto :eof', '', ':build', 'echo %1 %~2', 'exit /b 0', '', ':: comment', ':eof', 'rem set X=1'].join('\r\n');
    const items = parseBatch(bat);
    const labels = items.filter(i => i.kind === 'label');
    assert.deepEqual(labels.map(l => [l.name, l.startLine, l.endLine, l.params]), [['build', 7, 11, ['%1', '%2']], ['eof', 12, 13, []]]);
    assert.deepEqual(items.filter(i => i.kind === 'variable').map(v => v.name), ['ROOT', 'N'], 'a variable is listed once, comments are ignored');
    assert.equal(items.find(i => i.name === 'ROOT')!.detail, 'C:\\dev');
});

test('PowerShell: functions with their parameters, a class with its methods and properties, the variables at the top', () => {
    const ps = [
        '$Root = "C:\\x"',
        '<# function Hidden { } #>',
        'function Get-Thing {',
        '    [CmdletBinding()]',
        '    param(',
        '        [Parameter(Mandatory)][string]$Path,',
        '        [int]$Count = 3',
        '    )',
        '    if ($Count) { "}" }  # a } in a comment',
        '}',
        'function Old($a, $b) { $a + $b }',
        'class Dog : Animal {',
        '    [string]$Name',
        '    hidden [int]$Age',
        '    [void] Bark([int]$times) {',
        '        foreach ($i in 1..$times) { "woof" }',
        '    }',
        '    static [Dog] Make() { return [Dog]::new() }',
        '}',
        '$Script:Later = 1',
    ].join('\n');
    const items = parsePowerShell(ps);
    const fns = items.filter(i => i.kind === 'function');
    assert.deepEqual(fns.map(f => [f.name, f.startLine, f.endLine, f.params]), [['Get-Thing', 2, 9, ['Path', 'Count']], ['Old', 10, 10, ['a', 'b']]]);
    const dog = items.find(i => i.kind === 'class')!;
    assert.deepEqual([dog.name, dog.startLine, dog.endLine, dog.detail], ['Dog', 11, 18, 'Animal']);
    assert.deepEqual(dog.children!.map(c => [c.kind, c.name, c.startLine, c.endLine]), [
        ['property', 'Name', 12, 12], ['property', 'Age', 13, 13], ['method', 'Bark', 14, 16], ['method', 'Make', 17, 17],
    ]);
    assert.deepEqual(items.filter(i => i.kind === 'variable').map(v => v.name), ['Root', 'Later']);
});

test('shell: functions in both forms, the positional parameters used, variables at the top, comments left out', () => {
    const sh = [
        '#!/usr/bin/env bash',
        'set -e',
        'APP_DIR="/opt/app"',
        'export PORT=8080',
        '# helper() { not me }',
        'build() {',
        '  echo "$1 ${2}" "}"',
        '  if [ -d "$APP_DIR" ]; then',
        '    ls',
        '  fi',
        '}',
        'function deploy {',
        '  build "$@"',
        '}',
        'clean ()',
        '{',
        '  rm -rf dist',
        '}',
        '  indented=1',
    ].join('\n');
    const items = parseShell(sh);
    const fns = items.filter(i => i.kind === 'function');
    assert.deepEqual(fns.map(f => [f.name, f.startLine, f.endLine, f.params]), [['build', 5, 10, ['$1', '$2']], ['deploy', 11, 13, []], ['clean', 14, 17, []]]);
    assert.deepEqual(items.filter(i => i.kind === 'variable').map(v => [v.name, v.detail]), [['APP_DIR', '/opt/app'], ['PORT', '8080']]);
});
