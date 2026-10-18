import { test } from 'node:test';
import assert from 'node:assert/strict';

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;

class FakePosition { constructor(public line: number, public character: number) {} }
class FakeRange {
    start: any; end: any;
    constructor(a: any, b: any, c?: number, d?: number) {
        if (c === undefined) { this.start = a; this.end = b; } else { this.start = { line: a, character: b }; this.end = { line: c, character: d }; }
    }
    contains(p: any) { return p.line >= this.start.line && p.line <= this.end.line; }
}
const noopEvent = () => ({ dispose() {} });
const vscodeMock = {
    Uri: { file: (p: string) => ({ fsPath: p, path: p, toString: () => p }) },
    Position: FakePosition,
    Range: FakeRange,
    window: {
        activeTextEditor: undefined as any,
        onDidChangeTextEditorSelection: noopEvent,
        onDidChangeActiveTextEditor: noopEvent,
        showWarningMessage: async () => undefined,
        showInformationMessage: async () => undefined,
    },
    workspace: { onDidChangeTextDocument: noopEvent },
    commands: { executeCommand: async () => undefined },
};
nodeModule._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { MemberViewerPanel } = require('../webview/MemberViewerPanel') as typeof import('../webview/MemberViewerPanel');

function member(id: string, name: string, kind: string, extra: any = {}): any {
    return {
        id, name, kind, visibility: 'public', parameters: [], modifiers: [],
        isStatic: false, isVirtual: false, isAbstract: false, isOverride: false,
        range: new FakeRange(Number(id.replace(/\D/g, '')), 0, Number(id.replace(/\D/g, '')), 10), ...extra,
    };
}

function makePanel(): any {
    const panel = new MemberViewerPanel(
        {} as any, { getByDocument: () => undefined } as any, {} as any, {} as any, { subscriptions: [] } as any,
    ) as any;
    const cls = {
        id: 'c', name: 'TFoo', classType: 'class', members: [
            member('m2', 'Run', 'method', { parameters: [{ name: 'a', type: 'int' }], returnType: 'void' }),
            member('m1', 'Count', 'field', { type: 'int' }),
        ],
        range: new FakeRange(0, 0, 9, 0), isInterface: false, isRecord: false, isSealed: false, interfaces: [],
    };
    panel._state = { member: cls.members[0], classInfo: cls, provider: { languageId: 'java' } };
    return panel;
}

test('Member view shows a tab bar and keeps the Details tab by default', () => {
    const html = makePanel().getHtml();
    assert.match(html, /data-tab="detail"/);
    assert.match(html, /data-tab="manage"/);
    assert.doesNotMatch(html, /data-m-act="delete"/, 'no manage rows on the Details tab');
});

test('Add / Delete tab lists every member (sorted by line) with edit / rename / delete and add buttons', () => {
    const panel = makePanel();
    panel._tab = 'manage';
    const html: string = panel.getHtml();
    for (const cmd of ['mmx.addField', 'mmx.addMethod', 'mmx.addProperty', 'mmx.addConstructor']) {
        assert.ok(html.includes(`data-run="${cmd}"`), `add button ${cmd}`);
    }
    assert.ok(html.indexOf('Count') < html.indexOf('Run('), 'members sorted by source line');
    for (const act of ['edit', 'rename', 'delete', 'go']) {
        assert.equal((html.match(new RegExp(`data-m-act="${act}"`, 'g')) ?? []).length, 2, `${act} for each of the 2 members`);
    }
    assert.match(html, /mrow sel/, 'the member under the cursor is highlighted');
    assert.match(html, /data-addvar="1"/, 'a method selection also offers Add Variable');
});

test('Manage tab ignores actions on a member that no longer exists', async () => {
    const panel = makePanel();
    panel._tab = 'manage';
    let refreshed = false;
    panel.setTab = () => { refreshed = true; };
    await panel.handleManageAction('delete', 'gone');
    assert.equal(refreshed, true);
});
