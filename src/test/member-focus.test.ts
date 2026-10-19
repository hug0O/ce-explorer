import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memberLineRanges, searchLines, usageLines } from '../utils/memberSearch';
import { focusHtml } from '../webview/manageSection';

/* ───────── pure helpers ───────── */

const SRC = [
    'type',
    '  TFoo = class',
    '    FCount: Integer;',
    '    procedure Run(A: Integer);',
    '  end;',
    '',
    'procedure TFoo.Run(A: Integer);',
    'var I: Integer;',
    'begin',
    '  FCount := FCount + 1;',
    '  for I := 0 to A do',
    '    Log(\'Run \' + IntToStr(I));',
    '  Inc(Counter);',
    'end;',
    '',
    'procedure TFoo.Other;',
    'begin',
    '  Run(3);',
    'end;',
];

test('usageLines lists the lines that use a name as a whole word, once each, without its own declaration', () => {
    const r = usageLines(SRC, 'FCount', new Set([2]));
    assert.deepEqual(r.hits.map(h => h.line), [9], 'the declaration line is skipped; two uses on one line count once');
    assert.equal(r.total, 1);
    assert.equal(r.hits[0].text, 'FCount := FCount + 1;');
    assert.deepEqual([r.hits[0].start, r.hits[0].end], [2, 8], 'the first occurrence is highlighted');
    const run = usageLines(SRC, 'Run', new Set([3, 6]));
    assert.deepEqual(run.hits.map(h => h.line), [11, 17], 'Counter and Count are other words; the string on line 11 does mention Run');
    assert.equal(usageLines(SRC, 'Count', new Set()).total, 0, 'FCount and Counter are not Count');
});

test('usageLines counts every line but lists only the first ones', () => {
    const many = Array.from({ length: 1000 }, () => 'x := Foo;');
    const r = usageLines(many, 'Foo', new Set());
    assert.equal(r.total, 1000);
    assert.equal(r.hits.length, 300);
});

test('searchLines filters the code of one member: regex when valid, plain text otherwise, case-insensitive', () => {
    const ranges = memberLineRanges({ range: { start: { line: 3 }, end: { line: 3 } }, implementationRange: { start: { line: 6 }, end: { line: 13 } } });
    assert.deepEqual(ranges, [[3, 3], [6, 13]]);
    assert.deepEqual(searchLines(SRC, ranges, 'fcount').hits.map(h => h.line), [9]);
    assert.deepEqual(searchLines(SRC, ranges, 'for|inc\\(').hits.map(h => h.line), [10, 12], 'a regular expression');
    assert.deepEqual(searchLines(SRC, ranges, 'Log(').hits.map(h => h.line), [11], 'an invalid expression is searched as text');
    assert.equal(searchLines(SRC, ranges, 'Run(3)').total, 0, 'the other member is outside the range');
    assert.equal(searchLines(SRC, ranges, '   ').total, 0, 'an empty search finds nothing');
    assert.equal(searchLines(SRC, ranges, 'x*').regex, false, 'a pattern matching everything is taken as text');
});

test('memberLineRanges merges a declaration touching its implementation', () => {
    assert.deepEqual(memberLineRanges({ range: { start: { line: 4 }, end: { line: 9 } }, implementationRange: { start: { line: 8 }, end: { line: 14 } } }), [[4, 14]]);
});

test('the member section lists its usages and a search box, with the exact counts', () => {
    const html = focusHtml({
        id: 'm1', name: 'Run', kindLabel: 'Method', usageTotal: 302,
        usages: [{ line: 17, text: 'Run(3);', start: 2, end: 5 }], searchable: true, search: 'for',
        searchHits: [{ line: 10, text: 'for I := 0 to A do', start: 2, end: 5 }], searchTotal: 1,
    });
    assert.match(html, /Used in this file \(<span id="mUsageCount">302<\/span>\)/);
    assert.match(html, /data-m-line="17"[^>]*><span class="mln">18<\/span>/, 'lines are shown from 1');
    assert.match(html, /301 more not listed|… 301 more/, 'the rows stop at the cap, the count does not');
    assert.match(html, /id="mSearch"[^>]*value="for"/);
    assert.match(html, /1 line\(s\) match/);
    const field = focusHtml({ id: 'f', name: 'FCount', kindLabel: 'Field', usageTotal: 0, usages: [], searchable: false, search: '', searchHits: [], searchTotal: 0 });
    assert.match(field, /Not used elsewhere in this file/);
    assert.doesNotMatch(field, /id="mSearch"/, 'a field has no code to search');
    assert.match(focusHtml({ id: 'x', name: '<b>', kindLabel: 'Method', usageTotal: 0, usages: [], searchable: true, search: '"><i>', searchHits: [], searchTotal: 0 }), /&lt;b&gt;/, 'names are escaped');
});

/* ───────── the Structure tab, with a real document and decorations ───────── */

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
const decorations = new Map<string, any[]>();
let typeCount = 0;
const text = SRC.join('\n');
const editor: any = {
    document: { getText: () => text, lineCount: SRC.length, uri: { fsPath: 'a.pas', toString: () => 'a.pas' }, lineAt: (n: number) => ({ text: SRC[n] }) },
    setDecorations: (type: any, ranges: any[]) => { decorations.set(type.id, ranges); },
};
const shown: any[] = [];
const vscodeMock = {
    Uri: { file: (p: string) => ({ fsPath: p, path: p, toString: () => p }) },
    Position: FakePosition,
    Range: FakeRange,
    ThemeColor: class { constructor(public id: string) {} },
    OverviewRulerLane: { Center: 2, Right: 4 },
    window: {
        activeTextEditor: editor,
        onDidChangeTextEditorSelection: noopEvent,
        onDidChangeActiveTextEditor: noopEvent,
        showWarningMessage: async () => undefined,
        showInformationMessage: async () => undefined,
        createTextEditorDecorationType: () => ({ id: 'deco' + (typeCount++), dispose() {} }),
        showTextDocument: async (_d: any, o: any) => { shown.push(o); },
    },
    workspace: { onDidChangeTextDocument: noopEvent, onDidSaveTextDocument: noopEvent },
    commands: { executeCommand: async () => undefined },
    env: { clipboard: { writeText: async () => undefined } },
};
nodeModule._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));
const { MemberViewerPanel } = require('../webview/MemberViewerPanel') as typeof import('../webview/MemberViewerPanel');

function member(id: string, name: string, kind: string, line: number, extra: any = {}): any {
    return {
        id, name, kind, visibility: 'public', parameters: [], modifiers: [],
        isStatic: false, isVirtual: false, isAbstract: false, isOverride: false, range: new FakeRange(line, 0, line, 10), ...extra,
    };
}

function makePanel(): any {
    const run = member('m_run', 'Run', 'method', 3, { implementationRange: new FakeRange(6, 0, 13, 4) });
    const count = member('m_count', 'FCount', 'field', 2, { type: 'Integer' });
    const other = member('m_other', 'Other', 'method', 15, { implementationRange: new FakeRange(15, 0, 18, 4) });
    const cls = { id: 'c', name: 'TFoo', classType: 'class', members: [count, run, other], range: new FakeRange(1, 0, 4, 0), isInterface: false, isRecord: false, isSealed: false, interfaces: [] };
    const panel = new MemberViewerPanel({} as any, { getByDocument: () => undefined }, {}, {} as any, { subscriptions: [] } as any) as any;
    panel._state = { member: count, classInfo: cls, provider: { languageId: 'pascal', getMethodBodyRange: () => undefined, findPairedFile: () => undefined } };
    panel._tab = 'manage';
    panel._posted = [];
    panel._view = { webview: { postMessage: async (m: any) => { panel._posted.push(m); }, set html(_h: string) { /* not needed */ } } };
    return panel;
}

test('selecting a member in Structure lists the lines of the file that use it and highlights them in the editor', () => {
    const panel = makePanel();
    const html: string = panel.getHtml();
    assert.ok(/id="mFocus"/.test(html));
    assert.ok(/mfname">FCount<\/span>/.test(html), 'the section is about the member under the cursor');
    assert.ok(/Used in this file \(<span id="mUsageCount">1<\/span>\)/.test(html));
    assert.ok(!/id="mSearch"/.test(html), 'a field has no body to search');

    panel._focusId = 'm_run';
    const run: string = panel.getHtml();
    assert.ok(/Used in this file \(<span id="mUsageCount">2<\/span>\)/.test(run), 'Run: its call on line 18 and a string that says Run; not its declaration and implementation');
    assert.ok(/data-m-line="17"/.test(run));
    assert.ok(/id="mSearch"/.test(run), 'a method has a body to search');
    assert.ok(/class="mrow sel"[^>]*data-text="run /.test(run), 'the clicked member is the highlighted row');

    panel.syncHighlights();
    const all = [...decorations.values()];
    assert.ok(all.some(r => r.length === 2 && r.some((x: any) => x.start.line === 17)), 'the usage lines are decorated');
});

test('the search box filters the code of the focused member and highlights the matching lines', () => {
    const panel = makePanel();
    panel._focusId = 'm_run';
    panel.handleMemberSearch('for|inc\\(');
    const msg = panel._posted.find((m: any) => m.command === 'memberHits');
    assert.deepEqual(msg.hits.map((h: any) => h.line), [10, 12]);
    assert.equal(msg.total, 2);
    assert.equal(msg.query, 'for|inc\\(');
    assert.match(panel.getHtml(), /id="mSearch"[^>]*value="for\|inc\\\("/, 'the search survives a re-render');
    panel.handleMemberSearch('');
    assert.deepEqual(panel._posted[panel._posted.length - 1].hits, []);
});

test('going to a usage line keeps the member being looked at; moving the cursor elsewhere takes the focus back', () => {
    const panel = makePanel();
    panel._focusId = 'm_run';
    panel.handleManageLine(17);
    assert.deepEqual(shown[shown.length - 1].selection.start.line, 17);
    assert.equal(panel._focusId, 'm_run');
    assert.ok(Date.now() - panel._ownJumpAt < 500, 'the jump is remembered, so the cursor event it causes is not a new choice');
    panel.handleManageLine(9999);
    assert.equal(shown.length, 1, 'a line that does not exist is ignored');
});

test('the highlights go away with the Structure tab', () => {
    const panel = makePanel();
    panel._focusId = 'm_run';
    panel.syncHighlights();
    assert.ok([...decorations.values()].some(r => r.length > 0));
    panel._tab = 'tools';
    panel.syncHighlights();
    for (const t of [panel._hiLine, panel._hiUse, panel._hiFind]) { assert.deepEqual(decorations.get(t.id), [], 'a decoration is emptied'); }
});

test('the Structure tab script is valid JavaScript and wires the usage rows, the search box and the results message', () => {
    const vm = require('node:vm') as typeof import('node:vm');
    const panel = makePanel();
    panel._focusId = 'm_run';
    const html: string = panel.getHtml();
    const script = html.match(/<script nonce="[^"]+">([\s\S]*)<\/script>/);
    assert.ok(script, 'a script is present');
    assert.doesNotThrow(() => new vm.Script(script![1]));
    for (const key of ["command: 'manageLine'", "command: 'manageSearch'", "m.command !== 'memberHits'"]) { assert.ok(script![1].includes(key), key); }
});
