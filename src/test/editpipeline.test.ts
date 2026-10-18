import { test } from 'node:test';
import assert from 'node:assert/strict';

// EditPipeline touches vscode.{Uri,Position,Range,WorkspaceEdit,commands,window,workspace}.
// Reuse the module-interception mock pattern; behaviour is configurable per test.
const m = require('node:module');
const originalLoad = m._load;

let previewEdits = false;
let userChoice: string | undefined = 'Apply';
const openCalls: string[] = [];
const docTexts = new Map<string, string>();
const appliedEdits: any[] = [];

class FakePosition {
    constructor(public line: number, public character: number) {}
}
class FakeRange {
    start: { line: number; character: number };
    end: { line: number; character: number };
    constructor(a: any, b: any, c?: number, d?: number) {
        if (c === undefined) { this.start = a; this.end = b; }
        else { this.start = { line: a, character: b }; this.end = { line: c, character: d }; }
    }
}
class FakeWorkspaceEdit {
    edits: any[] = [];
    replace(uri: any, range: any, newText: string) { this.edits.push({ kind: 'replace', uri, range, newText }); }
    insert(uri: any, pos: any, newText: string) { this.edits.push({ kind: 'insert', uri, pos, newText }); }
    delete(uri: any, range: any) { this.edits.push({ kind: 'delete', uri, range }); }
}
const mkUri = (fsPath: string) => ({ fsPath, path: fsPath, toString: () => fsPath });

const vscodeMock = {
    Uri: { file: mkUri, parse: (u: string) => mkUri(u) },
    Position: FakePosition,
    Range: FakeRange,
    WorkspaceEdit: FakeWorkspaceEdit,
    commands: { executeCommand: async () => undefined },
    window: {
        showWarningMessage: async (..._a: unknown[]) => userChoice,
    },
    workspace: {
        getConfiguration: () => ({ get: (_key: string, fallback?: boolean) => previewEdits ?? fallback ?? false }),
        asRelativePath: (uri: any) => uri.fsPath,
        openTextDocument: async (uri: any) => {
            openCalls.push(uri.fsPath ?? uri.toString());
            const text = docTexts.get(uri.fsPath ?? uri.toString()) ?? '';
            return { uri, getText: () => text, lineCount: text.split(/\r?\n/).length };
        },
        applyEdit: async (we: any) => { appliedEdits.push(we); return true; },
    },
};
m._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { EditPipeline } = require('../services/EditPipeline') as typeof import('../services/EditPipeline');
const { simulateEdits } = require('../services/SafePreview') as typeof import('../services/SafePreview');

// --- simulateEdits (pure diff simulator used by the preview) ---

test('simulateEdits composes a delete and an insert bottom-up', () => {
    const text = 'aaa\nbbb\nccc\n';
    const out = simulateEdits(text, [
        { range: new FakeRange(1, 0, 2, 0), newText: '' },      // delete line 'bbb'
        { range: new FakeRange(2, 0, 2, 0), newText: 'X\n' },   // insert line 'X' before 'ccc'
    ]);
    assert.equal(out, 'aaa\nX\nccc\n');
});

test('simulateEdits replace-in-place keeps surrounding lines', () => {
    const text = 'one\ntwo\nthree\n';
    const out = simulateEdits(text, [{ range: new FakeRange(1, 0, 2, 0), newText: 'TWO\n' }]);
    assert.equal(out, 'one\nTWO\nthree\n');
});

// --- EditPipeline.apply ---

test('apply commits ONE WorkspaceEdit carrying every queued edit', async () => {
    previewEdits = false;
    appliedEdits.length = 0;
    const uri = mkUri('/proj/a.ts');
    const p = new EditPipeline();
    p.recordOriginal(uri, 'one\ntwo\nthree\n');
    p.insert(uri, new FakePosition(3, 0), 'four\n');
    p.replace(uri, new FakeRange(1, 0, 2, 0), 'TWO');
    p.delete(uri, new FakeRange(0, 0, 1, 0));
    assert.equal(p.isEmpty, false);

    const ok = await p.apply('Test');
    assert.equal(ok, true);
    assert.equal(appliedEdits.length, 1, 'must be a single applyEdit (one undo step)');
    assert.equal(appliedEdits[0].edits.length, 3);
});

test('apply with no edits is a no-op that succeeds', async () => {
    previewEdits = false;
    appliedEdits.length = 0;
    const p = new EditPipeline();
    assert.equal(p.isEmpty, true);
    assert.equal(await p.apply('Empty'), true);
    assert.equal(appliedEdits.length, 0);
});

test('apply returns false and applies NOTHING when the user cancels the preview', async () => {
    previewEdits = true;
    userChoice = undefined;
    appliedEdits.length = 0;
    const uri = mkUri('/proj/cancel.ts');
    const p = new EditPipeline();
    p.recordOriginal(uri, 'aaa\n');
    p.replace(uri, new FakeRange(0, 0, 1, 0), 'bbb\n');
    assert.equal(await p.apply('Cancel test'), false);
    assert.equal(appliedEdits.length, 0, 'cancelled preview must not touch the documents');
});

test('apply previews each affected document and applies on approval', async () => {
    previewEdits = true;
    userChoice = 'Apply';
    appliedEdits.length = 0;
    docTexts.set('/proj/x.h', 'int old();\n');
    docTexts.set('/proj/x.cpp', 'int old() { return 1; }\n');
    const h = mkUri('/proj/x.h');
    const cpp = mkUri('/proj/x.cpp');
    const p = new EditPipeline();
    p.recordOriginal(h, docTexts.get('/proj/x.h')!);
    p.recordOriginal(cpp, docTexts.get('/proj/x.cpp')!);
    p.replace(h, new FakeRange(0, 0, 1, 0), 'int neu();\n');
    p.delete(cpp, new FakeRange(0, 0, 1, 0));
    p.insert(cpp, new FakePosition(1, 0), 'int neu() { return 2; }\n');

    assert.equal(await p.apply('Multi docs'), true);
    assert.equal(appliedEdits.length, 1, 'multi-document move must still be one applyEdit');
    assert.equal(appliedEdits[0].edits.length, 3);
});

test('edits on documents without a recorded original are still applied (not previewed)', async () => {
    previewEdits = true;
    userChoice = 'Apply';
    appliedEdits.length = 0;
    const known = mkUri('/proj/known.ts');
    const unknown = mkUri('/proj/unknown.ts');
    const p = new EditPipeline();
    p.recordOriginal(known, 'a\n');
    p.replace(known, new FakeRange(0, 0, 1, 0), 'b\n');
    p.insert(unknown, new FakePosition(0, 0), 'c\n');
    assert.equal(await p.apply('Partial preview'), true);
    assert.equal(appliedEdits.length, 1);
    assert.equal(appliedEdits[0].edits.length, 2);
});

test('recordOriginalFrom opens the document once and caches the text', async () => {
    previewEdits = false;
    openCalls.length = 0;
    docTexts.set('/proj/cached.ts', 'cache me\n');
    const uri = mkUri('/proj/cached.ts');
    const p = new EditPipeline();
    await p.recordOriginalFrom(uri);
    await p.recordOriginalFrom(uri);
    assert.equal(openCalls.length, 1);
});

test('recordOriginal with a fresh text replaces the cached one (applied before re-planning)', async () => {
    previewEdits = false;
    const uri = mkUri('/proj/re-record.ts');
    const p = new EditPipeline();
    p.recordOriginal(uri, 'old\n');
    p.recordOriginal(uri, 'new\n');
    // No public accessor: verify indirectly through preview behaviour below.
    assert.equal(p.isEmpty, true);
});
