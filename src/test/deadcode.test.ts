import { test } from 'node:test';
import assert from 'node:assert/strict';

// collectDeadCode must stay LINEAR in workspace size: one tokenization pass
// per file (identifier-frequency table), never one full-text scan per
// candidate name (the old split()-per-name implementation froze the machine).
const m = require('node:module');
const originalLoad = m._load;
const mkUri = (p: string) => ({ fsPath: p, path: p, toString: () => p });

const fileTexts = new Map<string, string>();
const parsedFixtures = new Map<string, any>();

const vscodeMock = {
    Uri: { file: mkUri, parse: (u: string) => mkUri(u) },
    Position: class { constructor(public line: number, public character: number) {} },
    Range: class {
        start: any; end: any;
        constructor(a: any, b: any, c?: any, d?: any) {
            if (c === undefined) { this.start = a; this.end = b; }
            else { this.start = { line: a, character: b }; this.end = { line: c, character: d }; }
        }
    },
    workspace: {
        findFiles: async () => Array.from(fileTexts.keys()).map(p => mkUri(p)),
        openTextDocument: async (uri: any) => {
            const p = typeof uri === 'string' ? uri : uri.fsPath;
            return {
                uri: mkUri(p),
                fileName: p,
                getText: () => fileTexts.get(p) ?? '',
            };
        },
    },
};
m._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { collectDeadCode } = require('../services/DeadCodeDetector') as typeof import('../services/DeadCodeDetector');
const { MemberKind } = require('../models/types') as typeof import('../models/types');

const registry = {
    getByDocument: (doc: any) => ({
        parseDocument: (d: any) => parsedFixtures.get(d.fileName) ?? { classes: [], standaloneProcedures: [] },
    }),
};

function makeParsed(classes: { name: string; members: { name: string; kind: any; line: number }[] }[]): any {
    return {
        classes: classes.map(c => ({
            name: c.name,
            range: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } },
            members: c.members.map(mm => ({
                name: mm.name,
                kind: mm.kind,
                range: { start: { line: mm.line, character: 0 }, end: { line: mm.line, character: 5 } },
            })),
        })),
        standaloneProcedures: [],
    };
}

test('dead code: declared-only method is reported, used method is not', async () => {
    fileTexts.clear();
    parsedFixtures.clear();
    // Two files, both scanned: TDemo.Used is implemented in helper.pas and
    // called in main.pas; TDemo.Dead is implemented but never called.
    fileTexts.set('/w/main.pas', 'begin\n  FooHelper.Used;\nend.\n');
    fileTexts.set('/w/helper.pas', 'procedure TDemo.Dead;\nbegin\nend;\n\nprocedure TDemo.Used;\nbegin\nend;\n');
    parsedFixtures.set('/w/helper.pas', makeParsed([
        { name: 'TDemo', members: [
            { name: 'Dead', kind: MemberKind.Method, line: 0 },
            { name: 'Used', kind: MemberKind.Method, line: 2 },
        ]},
    ]));
    parsedFixtures.set('/w/main.pas', makeParsed([]));

    const dead = await collectDeadCode(registry as any, ['pas']);

    const deadNames = dead.filter(d => d.kind === 'method').map(d => d.name);
    assert.deepEqual(deadNames.sort(), ['Dead'], 'Used must NOT be reported, Dead must be');
});

test('dead code: usage as a bare identifier counts (not only qualified)', async () => {
    fileTexts.clear();
    parsedFixtures.clear();
    fileTexts.set('/w/main.pas', 'begin\n  x := Used(3);\nend.\n');
    fileTexts.set('/w/helper.pas', 'function Used(n: Integer): Integer;\nbegin\nend;\n');
    parsedFixtures.set('/w/helper.pas', makeParsed([
        { name: 'TDemo', members: [{ name: 'Used', kind: MemberKind.Method, line: 0 }] },
    ]));
    parsedFixtures.set('/w/main.pas', makeParsed([]));

    const dead = await collectDeadCode(registry as any, ['pas']);
    assert.equal(dead.filter(d => d.name === 'Used').length, 0, 'Used is called in main, not dead');
});

test('dead code: substring of a longer identifier does NOT count as a usage', async () => {
    fileTexts.clear();
    parsedFixtures.clear();
    // 'Dead' appears only as part of 'Deadshot' — must NOT mark Dead as used.
    fileTexts.set('/w/main.pas', 'begin\n  Deadshot(1);\nend.\n');
    fileTexts.set('/w/helper.pas', 'procedure Dead;\nbegin\nend;\n');
    parsedFixtures.set('/w/helper.pas', makeParsed([
        { name: 'TDemo', members: [{ name: 'Dead', kind: MemberKind.Method, line: 0 }] },
    ]));
    parsedFixtures.set('/w/main.pas', makeParsed([]));

    const dead = await collectDeadCode(registry as any, ['pas']);
    assert.equal(dead.filter(d => d.name === 'Dead').length, 1, 'Dead only appears inside Deadshot, still dead');
});

test('dead code: unused class is reported', async () => {
    fileTexts.clear();
    parsedFixtures.clear();
    fileTexts.set('/w/main.pas', 'begin\n  Used(1);\n  x := TUsedClass.Create;\nend.\n');
    fileTexts.set('/w/a.pas', 'type TNeverUsed = class end;\n');
    fileTexts.set('/w/b.pas', 'type TUsedClass = class end;\n');
    parsedFixtures.set('/w/main.pas', makeParsed([]));
    parsedFixtures.set('/w/a.pas', makeParsed([{ name: 'TNeverUsed', members: [] }]));
    parsedFixtures.set('/w/b.pas', makeParsed([{ name: 'TUsedClass', members: [] }]));

    const dead = await collectDeadCode(registry as any, ['pas']);
    const deadClasses = dead.filter(d => d.kind === 'class').map(d => d.name);
    assert.deepEqual(deadClasses.sort(), ['TNeverUsed']);
});
