import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

// End-to-end rename regression on a REAL 3000+ line Delphi unit: whatever the
// entry point (class method or standalone procedure), every occurrence in the
// file — interface declaration, implementation body, call sites — must be
// queued for replacement.
const m = require('node:module');
const originalLoad = m._load;
const mkUri = (fsPath: string) => ({ fsPath, path: fsPath, toString: () => fsPath });
class FakePosition {
    constructor(public line: number, public character: number) {}
}
class FakeRange {
    start: any; end: any;
    constructor(a: any, b: any, c?: number, d?: number) {
        if (c === undefined) { this.start = a; this.end = b; }
        else { this.start = { line: a, character: b }; this.end = { line: c, character: d }; }
    }
}
class FakeWorkspaceEdit {
    edits: any[] = [];
    replace(uri: any, range: any, newText: string) { this.edits.push({ uri, range, newText }); }
    insert() {} delete() {}
}
const vscodeMock = {
    Uri: { file: mkUri, parse: (u: string) => mkUri(u) },
    Position: FakePosition,
    Range: FakeRange,
    WorkspaceEdit: FakeWorkspaceEdit,
    EndOfLine: { LF: 0 },
    window: {
        createOutputChannel: () => ({ appendLine() {}, show() {} }),
        showInformationMessage: async () => undefined,
        showWarningMessage: async () => undefined,
    },
    workspace: {
        getConfiguration: () => ({ get: (_k: string, d?: boolean) => d ?? false }),
        asRelativePath: (uri: any) => uri.fsPath,
        openTextDocument: async (uri: any) => makeDoc('', uri.fsPath),
        applyEdit: async () => true,
    },
};
m._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as any;
const { renameMember, setLogChannel } = require('../services/MemberOperations') as any;

setLogChannel({ appendLine() {} });

function makeDoc(text: string, fsPath: string): any {
    const lines = text.split(/\r?\n/);
    return {
        uri: mkUri(fsPath),
        fileName: fsPath,
        lineCount: lines.length,
        lineAt: (i: number) => ({ text: lines[i] ?? '' }),
        getText: () => text,
        positionAt: (offset: number) => {
            const before = text.slice(0, offset).split(/\r?\n/);
            return { line: before.length - 1, character: before[before.length - 1].length };
        },
    };
}

const FIXTURE = path.join(__dirname, '..', '..', 'test-fixtures', 'offre_unit.pas');
const UNIT_TEXT = fs.readFileSync(FIXTURE, 'utf8');
const UNIT_LINES = UNIT_TEXT.split(/\r?\n/);

async function renameAndCollect(member: any, cls: any): Promise<any[]> {
    const doc = makeDoc(UNIT_TEXT, '/proj/offre_unit.pas');
    const provider = new PascalLanguageProvider();
    const synthCls = cls ?? {
        id: 'standalone_' + member.id, name: '', fullName: '', classType: 'standalone',
        parentClass: undefined, interfaces: [], members: [member], range: member.range,
        isInterface: false, isRecord: false, isSealed: false, fileUri: doc.uri,
    };
    const applied: any[] = [];
    (vscodeMock.workspace as any).applyEdit = async (we: any) => { applied.push(we); return true; };
    const ok = await renameMember(doc, synthCls, member, provider, { refresh() {} }, 'ZZZ_RENAMED');
    assert.equal(ok, true);
    return applied[0]?.edits ?? [];
}

test('real Delphi unit: renaming a standalone procedure covers declaration AND implementation', async () => {
    const provider = new PascalLanguageProvider();
    const parsed = provider.parseDocument(makeDoc(UNIT_TEXT, '/proj/offre_unit.pas'));
    const member = parsed.standaloneProcedures.find((p: any) => p.name === 'fMaj_OFFPR');
    assert.ok(member, 'fMaj_OFFPR must be parsed as a standalone procedure');

    const edits = await renameAndCollect(member, undefined);
    const realCount = (UNIT_TEXT.match(/\bfMaj_OFFPR\b/g) || []).length;
    assert.ok(realCount >= 2, 'fixture must contain the declaration and the implementation');
    assert.equal(edits.length, realCount, 'every occurrence in the file must be renamed');
    const editLines = new Set(edits.map((e: any) => e.range.start.line));
    assert.ok(editLines.has(member.range.start.line), 'declaration line renamed');
    assert.ok(editLines.has(member.implementationRange!.start.line), 'implementation line renamed');
});

test('real Delphi unit: renaming a routine covers declaration, implementation AND call sites', async () => {
    const provider = new PascalLanguageProvider();
    const parsed = provider.parseDocument(makeDoc(UNIT_TEXT, '/proj/offre_unit.pas'));

    // In this unit the routines are file-level (standalone). Pick one with
    // several occurrences — it necessarily spans declaration + implementation
    // + call sites scattered in the file.
    let best: { member: any; count: number } | undefined;
    for (const member of parsed.standaloneProcedures) {
        const count = (UNIT_TEXT.match(new RegExp('\\b' + member.name + '\\b', 'g')) || []).length;
        if (!best || count > best.count) {
            best = { member, count };
        }
    }
    assert.ok(best && best.count >= 4, `expected a routine with >= 4 occurrences, got ${best?.count} (${best?.member.name})`);

    const edits = await renameAndCollect(best.member, undefined);
    assert.equal(edits.length, best.count,
        `renaming ${best.member.name}: ${edits.length} edits queued but ${best.count} occurrences exist in the file`);
    for (const e of edits) {
        const line = UNIT_LINES[e.range.start.line] ?? '';
        assert.match(line, new RegExp('\\b' + best.member.name + '\\b'), 'each edit targets a real occurrence line');
    }
    // At least one edit must fall OUTSIDE the declaration and implementation
    // ranges — that is a call site the old class-range scan used to miss.
    const decl = best.member.range;
    const impl = best.member.implementationRange;
    const outside = edits.filter((e: any) => {
        const ln = e.range.start.line;
        const inDecl = ln >= decl.start.line && ln <= decl.end.line;
        const inImpl = !!impl && ln >= impl.start.line && ln <= impl.end.line;
        return !inDecl && !inImpl;
    });
    assert.ok(outside.length >= 1, 'call sites outside declaration/implementation must be renamed too');
});
