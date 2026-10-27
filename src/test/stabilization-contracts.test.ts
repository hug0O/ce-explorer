import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const projectRoot = resolve(__dirname, '..', '..');

function projectFile(path: string): string {
    return readFileSync(resolve(projectRoot, path), 'utf8');
}

test('the repository does not ignore TypeScript test files', () => {
    const gitignore = projectFile('.gitignore');

    assert.doesNotMatch(gitignore, /^\*\*\/\*\.test\.ts$/m);
});

test('the extension activates on startup and for every supported language', () => {
    const manifest = JSON.parse(projectFile('package.json')) as { activationEvents?: string[] };
    const expected = [
        'onStartupFinished',
        'onLanguage:pascal',
        'onLanguage:cpp',
        'onLanguage:rust',
        'onLanguage:java',
        'onLanguage:python',
        'onLanguage:csharp',
        'onLanguage:go',
        'onLanguage:typescript',
        'onLanguage:typescriptreact',
        'onLanguage:javascript',
        'onLanguage:javascriptreact',
        'onLanguage:plsql',
        'onLanguage:bat',
        'onLanguage:powershell',
        'onLanguage:shellscript',
        'onLanguage:markdown',
    ];

    assert.deepEqual(manifest.activationEvents, expected);
});

test('CodeLens is not registered for every file', () => {
    const extensionSource = projectFile('src/extension.ts');

    assert.doesNotMatch(
        extensionSource,
        /registerCodeLensProvider\(\s*\{\s*scheme:\s*['"]file['"]\s*\}/s,
    );
});

test('extension runtime code contains no development console logging', () => {
    const files = [
        'src/extension.ts',
        'src/services/CodeGeneratorService.ts',
        'src/services/MemberOperations.ts',
        'src/providers/PascalLanguageProvider.ts',
    ];

    for (const file of files) {
        const source = projectFile(file);
        assert.doesNotMatch(source, /console\.log\(/, file);
        assert.doesNotMatch(source, /deleting text:/, file);
    }
});

test('webview script policies rely on nonces instead of unsafe-inline', () => {
    const files = [
        'src/webview/MemberViewerPanel.ts',
        'src/webview/TemplateManagerPanel.ts',
        'src/webview/TemplateSidebarPanel.ts',
    ];

    for (const file of files) {
        const source = projectFile(file);
        assert.match(source, /nonce-/i, file);
        assert.doesNotMatch(source, /script-src[^;]*unsafe-inline/i, file);
        assert.match(source, /style-src[^;]*unsafe-inline/i, file);
    }
});

test('README matches the registered languages and Pascal default visibility', () => {
    const readme = projectFile('README.md');

    assert.match(readme, /across \*\*9 languages\*\*/);
    assert.match(readme, /\| PL\/SQL \| `\.pks` `\.pkb` `\.sql` `\.txt` \|/);
    assert.match(
        readme,
        /\| `ce\.pascal\.defaultVisibility` \| `private` \| Default visibility for Pascal \|/,
    );
});
