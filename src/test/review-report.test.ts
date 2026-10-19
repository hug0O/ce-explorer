import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_REVIEW_OPTIONS, orderedFindings, reviewHtml } from '../webview/reviewSection';
import { ReviewFinding } from '../utils/reviewTypes';

const finding = (extra: Partial<ReviewFinding>): ReviewFinding => ({ severity: 'info', category: 'Style', message: 'm', file: 'U.pas', line: 0, ...extra });

const FINDINGS: ReviewFinding[] = [
    finding({ severity: 'info', category: 'Unused', message: 'Variable Tmp is declared but never used in Calc', line: 2, hint: 'Remove it.' }),
    finding({ severity: 'warning', category: 'Correctness', message: 'Function Calc never assigns Result', line: 1, className: 'TFoo', memberName: 'Calc', hint: 'Assign Result on every path.' }),
    finding({ severity: 'error', category: 'Build', message: '<script>alert(1)</script>', line: 9 }),
    finding({ severity: 'info', category: 'TODO', message: 'TODO: later', line: 4 }),
];

test('the report lists each finding with its advice, where it is, and a click target; everything from the code is escaped', () => {
    const html = reviewHtml(FINDINGS);
    assert.ok(/4 finding\(s\) in U\.pas/.test(html));
    assert.ok(/data-sev="error"[^>]*>❌ 1 Errors/.test(html) && /data-sev="warning"[^>]*>⚠️ 1 Warnings/.test(html) && /data-sev="info"[^>]*>💡 2 Advice/.test(html), 'a chip per severity, with its count');
    assert.ok(/class="fhint">Assign Result on every path\./.test(html), 'the advice is under the message');
    assert.ok(/TFoo\.Calc · line 2/.test(html), 'the member and the line (from 1)');
    assert.ok(/title="Warning: go to line 2"/.test(html) && /title="Advice: go to line 3"/.test(html), 'info is called advice');
    assert.ok(!/<script>alert/.test(html) && /&lt;script&gt;alert\(1\)&lt;\/script&gt;/.test(html), 'a message that looks like markup stays text');
    assert.equal((html.match(/class="finding /g) ?? []).length, 4);
    assert.ok(/tabindex="0" role="button"/.test(html), 'reachable with the keyboard');
});

test('what a click sends back is the position in the panel\'s list, whatever the order shown', () => {
    const byLine = orderedFindings(FINDINGS, 'line').map(x => x.idx);
    assert.deepEqual(byLine, [1, 0, 3, 2], 'file order');
    assert.deepEqual(orderedFindings(FINDINGS, 'severity').map(x => x.idx), [2, 1, 0, 3], 'errors, warnings, then advice, each in file order');
    assert.deepEqual(orderedFindings(FINDINGS, 'category').map(x => FINDINGS[x.idx].category), ['Build', 'Correctness', 'TODO', 'Unused']);
    const html = reviewHtml(FINDINGS, { sev: DEFAULT_REVIEW_OPTIONS.sev, sort: 'severity' });
    assert.ok(html.indexOf('data-idx="2"') < html.indexOf('data-idx="1"') && html.indexOf('data-idx="1"') < html.indexOf('data-idx="0"'));
});

test('severities can be hidden; an empty review says so', () => {
    const noAdvice = reviewHtml(FINDINGS, { sev: { error: true, warning: true, info: false }, sort: 'line' });
    assert.equal((noAdvice.match(/class="finding /g) ?? []).length, 2);
    assert.ok(/class="rchip sev-info"/.test(noAdvice), 'the chip of a hidden severity is not "on"');
    assert.ok(/class="rchip sev-error on"/.test(noAdvice));
    assert.ok(/Nothing to show with these filters/.test(reviewHtml(FINDINGS, { sev: { error: false, warning: false, info: false }, sort: 'line' })));
    assert.ok(/No issues found/.test(reviewHtml([])));
});

/* ───────── the panel: squiggles, go to, filters ───────── */

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;
class FakeRange { start: any; end: any; constructor(a: number, b: number, c: number, d: number) { this.start = { line: a, character: b }; this.end = { line: c, character: d }; } }
const noopEvent = () => ({ dispose() {} });
const published = new Map<string, any[]>();
let cleared = 0;
const shown: any[] = [];
const vscodeMock = {
    Uri: { file: (p: string) => ({ fsPath: p, toString: () => 'file:' + p }) },
    Position: class { constructor(public line: number, public character: number) {} },
    Range: FakeRange,
    Diagnostic: class { source?: string; code?: unknown; constructor(public range: any, public message: string, public severity: number) {} },
    DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
    languages: { createDiagnosticCollection: () => ({ set: (u: any, d: any[]) => { published.set(u.toString(), d); }, clear: () => { cleared++; published.clear(); }, dispose() {} }) },
    window: {
        activeTextEditor: undefined as any,
        onDidChangeTextEditorSelection: noopEvent, onDidChangeActiveTextEditor: noopEvent,
        showWarningMessage: async () => undefined, showInformationMessage: async () => undefined, showErrorMessage: async () => undefined,
        showTextDocument: async (u: any, o: any) => { shown.push({ uri: u, options: o }); },
    },
    workspace: { onDidChangeTextDocument: noopEvent, onDidSaveTextDocument: noopEvent },
    commands: { executeCommand: async () => undefined },
    env: { clipboard: { writeText: async () => undefined } },
};
nodeModule._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));
const { MemberViewerPanel } = require('../webview/MemberViewerPanel') as typeof import('../webview/MemberViewerPanel');

const SRC = [
    'procedure TFoo.Calc(A: Integer): Integer;',
    'var',
    '  Tmp: Integer;',
    'begin',
    '  A := 1; // TODO: finish',
    'end;',
];

function makePanel(): any {
    const doc: any = { getText: () => SRC.join('\n'), fileName: 'C:\\p\\U.pas', lineCount: SRC.length, uri: vscodeMock.Uri.file('C:\\p\\U.pas'), lineAt: (n: number) => ({ text: SRC[n] }) };
    const calc = {
        id: 'm1', name: 'Calc', kind: 'method', returnType: 'Integer', visibility: 'public', parameters: [{ name: 'A', type: 'Integer' }], modifiers: [],
        isStatic: false, isVirtual: false, isAbstract: false, isOverride: false, range: new FakeRange(0, 0, 0, 10), implementationRange: new FakeRange(0, 0, 5, 4),
    };
    const provider = { languageId: 'pascal', parseDocument: () => ({ classes: [], standaloneProcedures: [calc] }) };
    vscodeMock.window.activeTextEditor = { document: doc };
    const panel = new MemberViewerPanel({} as any, { getByDocument: () => provider }, {}, {} as any, { subscriptions: [] } as any) as any;
    panel._view = { webview: { postMessage: async () => true, set html(_h: string) { /* not needed */ } } };
    return panel;
}

test('running the review fills the report, marks the code and the Problems panel, and a click goes to the line', async () => {
    const panel = makePanel();
    await panel.handleRunAnalytics('review');
    const findings = panel._analyticsData as ReviewFinding[];
    assert.deepEqual(findings.map(f => f.category).sort(), ['Correctness', 'TODO', 'Unused']);

    const marks = published.get('file:C:\\p\\U.pas')!;
    assert.equal(marks.length, 3, 'one squiggle per finding');
    const warn = marks.find(d => /never assigns Result/.test(d.message))!;
    assert.equal(warn.severity, 1, 'a warning is a warning');
    assert.match(warn.message, / — Assign Result on every path/, 'the advice travels with the message');
    assert.equal(warn.source, 'CE Review');
    const advice = marks.find(d => /Tmp/.test(d.message))!;
    assert.equal(advice.severity, 2, 'advice is information');
    assert.deepEqual([advice.range.start.line, advice.range.start.character, advice.range.end.character], [2, 2, 5], 'on the name of the variable');

    const html: string = panel.getAnalyticsHtml();
    assert.ok(/class="finding sev-warning" data-idx="\d"/.test(html));
    assert.ok(/command: 'goTo'/.test(html) && /command: 'reviewFilter'/.test(html) && /command: 'reviewSort'/.test(html));
    assert.equal((html.match(/acquireVsCodeApi\(\)/g) ?? []).length, 1, 'the page acquires the API once');
    const vm = require('node:vm') as typeof import('node:vm');
    assert.doesNotThrow(() => new vm.Script(html.match(/<script nonce="[^"]+">([\s\S]*)<\/script>/)![1]));

    const todo = findings.findIndex(f => f.category === 'TODO');
    await panel.handleGoTo(todo);
    assert.equal(shown[shown.length - 1].uri.fsPath, 'C:\\p\\U.pas');
    assert.equal(shown[shown.length - 1].options.selection.start.line, 4);
    await panel.handleGoTo(99);
    await panel.handleGoTo(-1);
    assert.equal(shown.length, 1, 'a position that is not in the list goes nowhere');

    const before = cleared;
    panel.onCursorChanged = () => undefined;
    panel.endAnalytics();
    assert.ok(cleared > before && published.size === 0, 'closing the report removes the squiggles');
});

test('the severity buttons and the order are kept by the panel and redraw the report', async () => {
    const panel = makePanel();
    await panel.handleRunAnalytics('review');
    let drawn = 0;
    panel.updateView = () => { drawn++; };
    // the same message handling as the webview's, for the two settings
    panel._reviewSev.info = false;
    const html: string = panel.getAnalyticsHtml();
    assert.equal((html.match(/class="finding /g) ?? []).length, 1, 'advice hidden: only the warning is left');
    panel._reviewSort = 'category';
    assert.ok(/<option value="category" selected>/.test(panel.getAnalyticsHtml()));
    assert.equal(drawn, 0);
});
