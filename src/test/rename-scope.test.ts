import { test } from 'node:test';
import assert from 'node:assert/strict';

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;

type Loc = { uri: { fsPath: string; toString(): string }; range: { start: { line: number }; end: { line: number } } };
const uri = (p: string) => ({ fsPath: p, path: p, toString: () => p });
let locations: Loc[] = [];
let picks: unknown[] = [];
let pickAnswer: ((items: { more?: boolean }[]) => unknown) | undefined;
let replaced: { file: string; text: string }[] = [];
const messages: string[] = [];

class WorkspaceEdit {
    replace(u: { fsPath: string }, _r: unknown, text: string): void { replaced.push({ file: u.fsPath, text }); }
}
const vscodeMock = {
    Uri: { file: uri },
    Position: class { constructor(public line: number, public character: number) {} },
    Range: class {
        start: { line: number; character: number }; end: { line: number; character: number };
        constructor(a: number, b: number, c: number, d: number) { this.start = { line: a, character: b }; this.end = { line: c, character: d }; }
    },
    WorkspaceEdit,
    commands: { executeCommand: async (cmd: string) => (cmd === 'vscode.executeReferenceProvider' ? locations : undefined) },
    window: {
        showWarningMessage: async (m: string) => { messages.push(m); return undefined; },
        showInformationMessage: async (m: string) => { messages.push(m); return undefined; },
        showQuickPick: async (items: { more?: boolean }[]) => { picks.push(items); return pickAnswer ? pickAnswer(items) : items[0]; },
        onDidChangeActiveTextEditor: () => ({ dispose() {} }),
    },
    workspace: { applyEdit: async () => true, openTextDocument: async () => undefined, onDidChangeTextDocument: () => ({ dispose() {} }) },
};
nodeModule._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));
const { VariableRefactorService } = require('../services/VariableRefactorService') as typeof import('../services/VariableRefactorService');

const loc = (file: string, line: number): Loc => ({ uri: uri(file), range: { start: { line }, end: { line } } });
const service = new VariableRefactorService({} as never, { refresh() {} } as never);
const provider: any = { fileExtensions: ['.pas', '.dpr'], findPairedFile: () => undefined };
const ref: any = {
    kind: 'field', name: 'FCount', declarationRange: new vscodeMock.Range(3, 4, 3, 10),
    document: { uri: uri('C:\\p\\UMain.pas'), getText: () => '', lineCount: 10 },
};
const reset = (): void => { locations = []; picks = []; pickAnswer = undefined; replaced = []; messages.length = 0; };

test('a rename stays in the file: no question when the name is only there', async () => {
    reset();
    locations = [loc('C:\\p\\UMain.pas', 3), loc('C:\\p\\UMain.pas', 9)];
    assert.equal(await service.rename(ref, provider, 'FTotal'), true);
    assert.equal(picks.length, 0);
    assert.deepEqual(replaced.map(r => r.file), ['C:\\p\\UMain.pas', 'C:\\p\\UMain.pas']);
});

test('the language server answers for the whole project: forms and other languages are never renamed', async () => {
    reset();
    locations = [loc('C:\\p\\UMain.pas', 3), loc('C:\\p\\UMain.dfm', 12), loc('C:\\p\\script.py', 1), loc('C:\\p\\Other.cpp', 2)];
    assert.equal(await service.rename(ref, provider, 'FTotal'), true);
    assert.equal(picks.length, 0, 'nothing to ask: the others are not of this language');
    assert.deepEqual(replaced.map(r => r.file), ['C:\\p\\UMain.pas'], 'only this file');
});

test('occurrences in another unit of the same language: here only by default, the others when chosen', async () => {
    reset();
    locations = [loc('C:\\p\\UMain.pas', 3), loc('C:\\p\\UMain.pas', 8), loc('C:\\p\\UOther.pas', 5), loc('C:\\p\\UMain.dfm', 1)];
    assert.equal(await service.rename(ref, provider, 'FTotal'), true);
    const asked = picks[0] as { label: string; more: boolean }[];
    assert.deepEqual(asked.map(a => [a.label, a.more]), [['Rename here only', false], ['Also in 1 other file', true]]);
    assert.deepEqual(replaced.map(r => r.file), ['C:\\p\\UMain.pas', 'C:\\p\\UMain.pas'], 'the first choice is this file');

    reset();
    locations = [loc('C:\\p\\UMain.pas', 3), loc('C:\\p\\UOther.pas', 5), loc('C:\\p\\UMain.dfm', 1)];
    pickAnswer = items => items.find(i => i.more);
    await service.rename(ref, provider, 'FTotal');
    assert.deepEqual(replaced.map(r => r.file), ['C:\\p\\UMain.pas', 'C:\\p\\UOther.pas'], 'the other unit too, never the form');
});

test('cancelling the question renames nothing', async () => {
    reset();
    locations = [loc('C:\\p\\UMain.pas', 3), loc('C:\\p\\UOther.pas', 5)];
    pickAnswer = () => undefined;
    assert.equal(await service.rename(ref, provider, 'FTotal'), false);
    assert.equal(replaced.length, 0);
});
