import { test } from 'node:test';
import assert from 'node:assert/strict';

// renameMember touches ops logging, SafePreview config, EditPipeline (WorkspaceEdit,
// workspace.applyEdit) and the document — all mocked through the module interception.
const m = require('node:module');
const originalLoad = m._load;

const appliedEdits: any[] = [];
let warnings: string[] = [];
const docTexts = new Map<string, string>();

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
    replace(uri: any, range: any, newText: string) { this.edits.push({ uri, range, newText }); }
    insert() {}
    delete() {}
}
const mkUri = (fsPath: string) => ({ fsPath, path: fsPath, toString: () => fsPath });

let languageServerEdit: any;
let infoChoice: string | undefined;
const executedCommands: any[][] = [];

const vscodeMock = {
    commands: {
        executeCommand: async (...args: any[]) => { executedCommands.push(args); return languageServerEdit; },
    },
    Uri: { file: mkUri, parse: (u: string) => mkUri(u) },
    Position: FakePosition,
    Range: FakeRange,
    WorkspaceEdit: FakeWorkspaceEdit,
    window: {
        createOutputChannel: () => ({ appendLine() {}, show() {} }),
        showWarningMessage: async (...args: any[]) => { warnings.push(String(args[0])); return undefined; },
        showInformationMessage: async () => infoChoice,
    },
    workspace: {
        getConfiguration: () => ({ get: (_k: string, d?: boolean) => d ?? false }),
        asRelativePath: (uri: any) => uri.fsPath,
        openTextDocument: async (uri: any) => {
            const text = docTexts.get(uri.fsPath) ?? '';
            return makeDoc(text, uri.fsPath);
        },
        applyEdit: async (we: any) => { appliedEdits.push(we); return true; },
    },
};
m._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { renameMember, setLogChannel, setWorkspaceIndex } = require('../services/MemberOperations') as typeof import('../services/MemberOperations');

setLogChannel({ appendLine() {} } as any);

function makeDoc(text: string, fsPath = '/proj/ufoo.pas'): any {
    const lines = text.split('\n');
    return {
        uri: mkUri(fsPath),
        fileName: fsPath,
        lineCount: lines.length,
        lineAt: (i: number) => ({ text: lines[i] ?? '' }),
        getText: () => text,
        positionAt: (offset: number) => {
            const before = text.slice(0, offset).split('\n');
            return { line: before.length - 1, character: before[before.length - 1].length };
        },
    };
}

const PASCAL_FILE = [
    'unit ufoo;',
    'interface',
    'type',
    '  TFoo = class',
    '  public',
    '    procedure DoStuff(A: Integer);',
    '  end;',
    '',
    'implementation',
    '',
    'procedure TFoo.DoStuff(A: Integer);',
    'begin',
    '  WriteLn(A);',
    'end;',
    '',
    'procedure Other.Bar;',
    'begin',
    '  TFoo.Create.DoStuff(42);',
    'end;',
    '',
    'end.',
].join('\n');

test('renameMember covers header, implementation AND call sites across the whole Pascal file', async () => {
    appliedEdits.length = 0;
    const doc = makeDoc(PASCAL_FILE);
    const cls = { name: 'TFoo', classType: 'class', range: new FakeRange(3, 0, 6, 7) } as any;
    const member = {
        name: 'DoStuff', kind: 'method', parameters: [],
        range: new FakeRange(5, 4, 5, 39),
        implementationRange: new FakeRange(10, 0, 13, 3),
    } as any;
    const provider = { findPairedFile: () => undefined } as any;

    const ok = await renameMember(doc, cls, member, provider, { refresh() {} } as any, 'Execute');

    assert.equal(ok, true);
    assert.equal(appliedEdits.length, 1, 'single applyEdit (one undo step)');
    const lines = appliedEdits[0].edits.map((e: any) => e.range.start.line).sort((a: number, b: number) => a - b);
    // header (line 5, inside the class), implementation header (line 10, OUTSIDE
    // the class range) and the call site (line 17, another class body).
    assert.deepEqual(lines, [5, 10, 17]);
    for (const e of appliedEdits[0].edits) {
        assert.equal(e.newText, 'Execute');
    }
});

test('renameMember rewrites header, Class::method AND plain call sites in the paired file', async () => {
    appliedEdits.length = 0;
    docTexts.set('/proj/foo.h', 'class TFoo {\npublic:\n  void DoStuff();\n};\n');
    docTexts.set('/proj/foo.cpp', 'void TFoo::DoStuff() {\n}\n\nvoid Helper(TFoo* f) {\n  f->DoStuff();\n}\n');
    const doc = makeDoc(docTexts.get('/proj/foo.h')!, '/proj/foo.h');
    const cls = { name: 'TFoo', classType: 'class', range: new FakeRange(0, 0, 3, 1) } as any;
    const member = { name: 'DoStuff', kind: 'method', parameters: [], range: new FakeRange(2, 2, 2, 16) } as any;
    const provider = { findPairedFile: () => mkUri('/proj/foo.cpp') } as any;

    const ok = await renameMember(doc, cls, member, provider, { refresh() {} } as any, 'Execute');

    assert.equal(ok, true);
    const byUri = new Map<string, number>();
    for (const e of appliedEdits[0].edits) {
        byUri.set(e.uri.fsPath, (byUri.get(e.uri.fsPath) ?? 0) + 1);
    }
    assert.equal(byUri.get('/proj/foo.h'), 1, 'one occurrence in the header');
    assert.equal(byUri.get('/proj/foo.cpp'), 2, 'definition TFoo::DoStuff AND call site f->DoStuff() in the source file');
});

test('renameMember fails cleanly when the name is nowhere to be found', async () => {
    appliedEdits.length = 0;
    warnings = [];
    const doc = makeDoc('begin\nend.\n');
    const cls = { name: 'TFoo', classType: 'class', range: new FakeRange(0, 0, 1, 4) } as any;
    const member = { name: 'DoStuff', kind: 'method', parameters: [], range: new FakeRange(0, 0, 0, 5) } as any;

    const ok = await renameMember(doc, cls, member, { findPairedFile: () => undefined } as any, { refresh() {} } as any, 'Execute');

    assert.equal(ok, false);
    assert.equal(appliedEdits.length, 0, 'nothing applied when nothing matched');
    assert.equal(warnings.length, 1, 'user is warned');
});

test('renameMember leaves a same-named method of ANOTHER class untouched', async () => {
    appliedEdits.length = 0;
    const text = [
        'unit u;',
        'interface',
        'type',
        '  TA = class',
        '    procedure Process;',      // 4
        '  end;',
        '  TB = class',
        '    procedure Process;',      // 7
        '  end;',
        'implementation',
        'procedure TA.Process;',        // 10
        'begin',
        'end;',
        'procedure TB.Process;',        // 13
        'begin',
        'end;',
        'end.',
    ].join('\n');
    const doc = makeDoc(text);
    const taProcess = { name: 'Process', kind: 'method', parameters: [], range: new FakeRange(4, 4, 4, 22), implementationRange: new FakeRange(10, 0, 12, 4) } as any;
    const tbProcess = { name: 'Process', kind: 'method', parameters: [], range: new FakeRange(7, 4, 7, 22), implementationRange: new FakeRange(13, 0, 15, 4) } as any;
    const ta = { id: 'a', name: 'TA', classType: 'class', range: new FakeRange(3, 2, 5, 6), members: [taProcess] } as any;
    const tb = { id: 'b', name: 'TB', classType: 'class', range: new FakeRange(6, 2, 8, 6), members: [tbProcess] } as any;
    const provider = { findPairedFile: () => undefined, parseDocument: () => ({ classes: [ta, tb], standaloneProcedures: [] }) } as any;

    const ok = await renameMember(doc, ta, taProcess, provider, { refresh() {} } as any, 'Run');

    assert.equal(ok, true);
    const lines = appliedEdits[0].edits.map((e: any) => e.range.start.line).sort((a: number, b: number) => a - b);
    assert.deepEqual(lines, [4, 10], 'only TA.Process (declaration + implementation) is renamed');
});

test('renameMember delegates to the language server rename provider when one answers', async () => {
    appliedEdits.length = 0;
    executedCommands.length = 0;
    const lsEdit = { size: 3, marker: 'ls' };
    languageServerEdit = lsEdit;
    try {
        const doc = makeDoc(PASCAL_FILE);
        const cls = { name: 'TFoo', classType: 'class', range: new FakeRange(3, 0, 6, 7) } as any;
        const member = { name: 'DoStuff', kind: 'method', parameters: [], range: new FakeRange(5, 4, 5, 39) } as any;

        const ok = await renameMember(doc, cls, member, { findPairedFile: () => undefined } as any, { refresh() {} } as any, 'Execute');

        assert.equal(ok, true);
        assert.equal(executedCommands[0][0], 'vscode.executeDocumentRenameProvider');
        assert.equal(executedCommands[0][2].line, 5, 'asked at the declaration line');
        assert.equal(executedCommands[0][2].character, 14, 'asked on the member name');
        assert.deepEqual(appliedEdits, [lsEdit], 'the server edit is applied as is, no textual replacement');
    } finally {
        languageServerEdit = undefined;
    }
});

test('renameMember offers to rename in other workspace files and only does so on request', async () => {
    docTexts.set('/proj/other.pas', ['begin', '  TFoo.Create.DoStuff(1);', 'end.', ''].join('\n'));
    const index = { filesMentioning: async () => [mkUri('/proj/other.pas')] } as any;
    setWorkspaceIndex(index);
    try {
        const run = async (choice: string | undefined) => {
            appliedEdits.length = 0;
            infoChoice = choice;
            const doc = makeDoc(PASCAL_FILE);
            const cls = { name: 'TFoo', classType: 'class', range: new FakeRange(3, 0, 6, 7) } as any;
            const member = {
                name: 'DoStuff', kind: 'method', parameters: [],
                range: new FakeRange(5, 4, 5, 39), implementationRange: new FakeRange(10, 0, 13, 3),
            } as any;
            await renameMember(doc, cls, member, { findPairedFile: () => undefined } as any, { refresh() {} } as any, 'Execute');
            return appliedEdits[0].edits.filter((e: any) => e.uri.fsPath === '/proj/other.pas').length;
        };
        assert.equal(await run('Only this file'), 0, 'declined: other file untouched');
        assert.equal(await run(undefined), 0, 'dismissed: other file untouched');
        assert.equal(await run('Rename there too'), 1, 'accepted: the reference in the other file is renamed');
    } finally {
        setWorkspaceIndex(undefined);
        infoChoice = undefined;
    }
});
