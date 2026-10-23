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
    workspace: { onDidChangeTextDocument: noopEvent, onDidSaveTextDocument: noopEvent },
    commands: { executeCommand: async () => undefined },
    env: { clipboard: { writeText: async (_t: string) => undefined } },
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

function makePanel(ctx: any = { subscriptions: [] }, registry: any = { getByDocument: () => undefined }, explorer: any = {}): any {
    const panel = new MemberViewerPanel(
        {} as any, registry, explorer, {} as any, ctx,
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
    assert.match(html, /data-tab="manage"[^>]*>Structure<\/button>/, 'the tab is called Structure, as in the Delphi IDE');
    assert.doesNotMatch(html, /Add \/ Delete/, 'its old name is gone');
    assert.match(html, /title="Members of the file: add, filter, edit, rename, move, delete - Ctrl\+K Ctrl\+M"/);
    assert.doesNotMatch(html, /data-m-act="delete"/, 'no manage rows on the Details tab');
});

test('Structure tab lists every member (sorted by line) with edit / rename / delete and add buttons', () => {
    const panel = makePanel();
    panel._tab = 'manage';
    const html: string = panel.getHtml();
    for (const kind of ['field', 'method', 'property', 'constructor']) {
        assert.ok(html.includes(`data-m-add="${kind}"`), `add button ${kind}`);
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

test('Tools tab shows the align form and the Delphi layout page; no spacing page any more', () => {
    const panel = makePanel();
    panel._tab = 'tools';
    panel.isDelphi = () => true;
    const html: string = panel.getHtml();
    assert.match(html, /data-tab="tools"/);
    assert.match(html, /id="alignToken"/);
    assert.doesNotMatch(html, /id="sForm"|id="sFields"|data-sub="spacing"/, 'the spacing page is gone');
    assert.doesNotMatch(html, /id="dForm"|id="dAdd"|id="eAdd"/, 'adding components and events is the designer\'s job now');
    assert.match(html, /function initTools\(api\)/);
    assert.match(html, /initTools\(vscodeApi\)/);
    assert.doesNotMatch(html, /data-m-act="delete"/, 'no manage rows on the Tools tab');

    const empty: string = panel.getEmptyHtml();
    assert.match(empty, /id="alignToken"/, 'align is reachable even with the cursor outside any member');
    assert.match(empty, /initTools\(api\)/);
});

test('Tools tab: saved align shortcuts are present, the spacing, component and event forms are gone', () => {
    const panel = makePanel();
    panel._tab = 'tools';
    panel.isDelphi = () => true;
    const html: string = panel.getHtml();
    assert.match(html, /id="chips"[^>]*data-chips="\[&quot;:=&quot;/, 'default shortcuts are rendered as data');
    assert.match(html, /command: 'saveAlignChips'/, 'shortcuts can be added and removed, then persisted');
    for (const id of ['sComp', 'sDir', 'sGap', 'sCascade', 'sApply', 'sCont', 'sH', 'sV', 'sDist']) {
        assert.ok(!html.includes(`id="${id}"`), id + ' is gone');
    }
    for (const id of ['dGap', 'eComp', 'eEvent', 'eAdd', 'dHint']) { assert.ok(!html.includes(`id="${id}"`), id + ' is gone'); }
    assert.doesNotMatch(html, /command: 'classInfo'|command: 'addComponent'|command: 'addEvent'|command: 'suggestName'/);
    assert.doesNotMatch(html, /command: 'setSpacing'|command: 'distribute'|command: 'toolsReady'/);
});

test('sanitizeChips keeps any number of custom strings but drops junk and duplicates', async () => {
    const { sanitizeChips } = await import('../webview/toolsSection');
    assert.deepEqual(sanitizeChips([':=', ' => ', ':=', '', 3, 'x'.repeat(30), '|']), [':=', '=>', '|']);
    assert.deepEqual(sanitizeChips('nope').slice(0, 2), [':=', ':']);
    assert.equal(sanitizeChips(Array.from({ length: 80 }, (_, i) => 'c' + i)).length, 40);
});

test('cursor outside any member: tabs instead of tools stacked under the quick actions', () => {
    const panel = makePanel();
    panel._state = { member: undefined, classInfo: undefined, provider: undefined };
    const actions: string = panel.getEmptyHtml();
    assert.match(actions, /data-tab="tools"/);
    assert.match(actions, /class="qa"/, 'quick actions on the Actions tab');
    assert.doesNotMatch(actions, /id="alignToken"/, 'tools are not below the actions');

    panel._tab = 'tools';
    const tools: string = panel.getEmptyHtml();
    assert.match(tools, /id="alignToken"/);
    assert.doesNotMatch(tools, /class="qa"/, 'quick actions hidden on the Tools tab');

    panel._tab = 'manage';
    const manage: string = panel.getEmptyHtml();
    assert.match(manage, /Routines|Members/);
    assert.match(manage, /class="tab active" data-tab="manage"/);
});

test('Tools tab shows the PL/SQL block only for PL/SQL documents', () => {
    const panel = makePanel();
    panel._tab = 'tools';
    assert.doesNotMatch(panel.getHtml(), /id="plBlock"/);
    panel.isPlSql = () => true;
    const html: string = panel.getHtml();
    assert.match(html, /id="plBlock"/);
    for (const cmd of ['syncPackage', 'newPackage', 'sqlFromTable', 'extractProcedure', 'exceptionBlock', 'docHeader', 'utplsql', 'findCallers']) {
        assert.ok(html.includes(`data-pl="ce.plsql.${cmd}"`), cmd);
    }
    for (const id of ['params', 'values', 'assign', 'arrow', 'comment', 'alias']) { assert.ok(html.includes(`data-pa="${id}"`), id); }
    assert.match(html, /command: 'plsqlAlign'/);
});

test('Tools tab shows the Delphi layout block only for Delphi units', () => {
    const panel = makePanel();
    panel._tab = 'tools';
    assert.doesNotMatch(panel.getHtml(), /id="dlBlock"/);
    panel.isDelphi = () => true;
    const html: string = panel.getHtml();
    assert.match(html, /id="dlBlock"/);
    for (const c of ['designer', 'project']) {
        assert.ok(html.includes(`data-dl="ce.delphi.${c}"`), c);
    }
    assert.match(html, /command: 'delphiCmd'/);
});

test('Tools are split into sub-tabs; only the pages that apply to the file are offered', () => {
    const panel = makePanel();
    panel._tab = 'tools';
    const subs = (html: string) => [...html.matchAll(/data-sub-tab="(\w+)"/g)].map(m => m[1]);
    const shown = (html: string) => [...html.matchAll(/data-sub="(\w+)"( hidden)?/g)].filter(m => !m[2]).map(m => m[1]);

    const plain: string = panel.getHtml();
    assert.deepEqual(subs(plain), ['align', 'analyze'], 'a plain file has the Align and Analyze pages');
    assert.deepEqual(shown(plain), ['align']);
    for (const ak of ['review', 'documentation', 'export', 'deadcode']) { assert.ok(plain.includes(`data-ak="${ak}"`), ak); }
    assert.equal(plain.split('data-ak="review"').length - 1, 1, 'the Analyze buttons are in Tools only, once');

    panel.isDelphi = () => true;
    const delphi: string = panel.getHtml();
    assert.deepEqual(subs(delphi), ['form', 'align', 'analyze'], 'no Components page (the designer adds components) and no Spacing page');
    assert.deepEqual(shown(delphi), ['form'], 'the designer / layout page first');
    assert.ok(delphi.includes('id="dlBlock"') && !delphi.includes('id="sFields"') && !delphi.includes('id="dAdd"') && delphi.includes('id="alignToken"'));
    assert.doesNotMatch(delphi, /id="plBlock"/);

    panel._toolsTab = 'align';
    assert.deepEqual(shown(panel.getHtml()), ['align'], 'the chosen sub-tab is remembered across redraws');

    panel.isDelphi = () => false;
    panel.isPlSql = () => true;
    panel._toolsTab = 'form';
    const sql: string = panel.getHtml();
    assert.deepEqual(subs(sql), ['plsql', 'align', 'analyze']);
    assert.deepEqual(shown(sql), ['plsql'], 'a remembered tab that does not apply falls back to the first one');
    assert.doesNotMatch(sql, /id="dlBlock"/, 'Delphi tools are absent from a SQL file');
    assert.match(sql, /command: 'toolsTab'/);
});

test('switching file redraws the tabs even when neither file has a member under the cursor', () => {
    const panel = makePanel({ subscriptions: [] }, {
        getByDocument: (doc: any) => (doc.uri.fsPath.endsWith('.pas') ? { languageId: 'pascal', displayName: 'Pascal' } : { languageId: 'plsql', displayName: 'PL/SQL' }),
    }, { getParsedDocument: () => ({ classes: [], standaloneProcedures: [] }), refresh() {} });
    const pas = { uri: { fsPath: '/x/u.pas', toString: () => 'file:///x/u.pas' }, version: 1 };
    const sql = { uri: { fsPath: '/x/o.pks', toString: () => 'file:///x/o.pks' }, version: 1 };
    panel._tab = 'tools';
    panel._view = { webview: { html: '' } };

    vscodeMock.window.activeTextEditor = { document: pas, selection: { active: new FakePosition(0, 0) } };
    panel.onCursorChanged(vscodeMock.window.activeTextEditor);
    const first: string = panel._view.webview.html;
    assert.match(first, /data-sub-tab="form"/, 'a Delphi unit shows the Form page');
    assert.doesNotMatch(first, /data-sub-tab="plsql"/);

    vscodeMock.window.activeTextEditor = { document: sql, selection: { active: new FakePosition(0, 0) } };
    panel.onCursorChanged(vscodeMock.window.activeTextEditor);
    const second: string = panel._view.webview.html;
    assert.notEqual(second, first, 'the tabs are drawn again for the other file');
    assert.match(second, /data-sub-tab="plsql"/, 'the PL/SQL page replaces the Delphi one');
    assert.doesNotMatch(second, /data-sub-tab="form"/);
});

/* ───────────── Structure: filter, grouping, type selector, same abilities as the former Classes tree ───────────── */

function cls(id: string, name: string, members: any[], extra: any = {}): any {
    return { id, name, classType: 'class', members, range: new FakeRange(0, 0, 40, 0), isInterface: false, isRecord: false, isSealed: false, interfaces: [], ...extra };
}

function twoClassPanel(): { panel: any; a: any; b: any } {
    const a = cls('ca', 'TAlpha', [member('m3', 'Name', 'field', { type: 'string', visibility: 'private' }), member('m1', 'Run', 'method', { visibility: 'public', returnType: 'void' })]);
    const b = cls('cb', 'TBeta', [member('m6', 'Count', 'field', { type: 'int' }), member('m8', 'GetCount', 'method', { returnType: 'int' })]);
    const proc = member('m20', 'Helper', 'method', { parameters: [{ name: 'x', type: 'int' }] });
    const doc = { uri: { fsPath: '/x/u.pas' }, version: 1 };
    const panel = makePanel({ subscriptions: [] }, { getByDocument: () => ({ languageId: 'pascal' }) }, { getParsedDocument: () => ({ classes: [a, b], standaloneProcedures: [proc] }), refresh() {} });
    vscodeMock.window.activeTextEditor = { document: doc, selection: { active: new FakePosition(0, 0) } };
    panel._state = { member: undefined, classInfo: a, provider: { languageId: 'pascal' } };
    panel._tab = 'manage';
    return { panel, a, b };
}

test('Structure has a live filter, a kind filter and a grouping, like the Classes tree had', () => {
    const { panel } = twoClassPanel();
    panel._manageFilter = 'get|run';
    panel._manageKind = 'method';
    panel._manageGroup = 'visibility';
    const html: string = panel.getManageHtml();
    assert.match(html, /id="mFilter"[^>]*value="get\|run"/, 'the filter text is kept across redraws');
    assert.match(html, /<option value="method" selected>/);
    assert.match(html, /<option value="visibility" selected>/);
    for (const g of ['source', 'visibility', 'kind', 'alpha']) { assert.ok(html.includes('<option value="' + g + '"'), g); }
    assert.match(html, /class="mgroup" data-group="1">Public/, 'visibility headings');
    assert.match(html, /data-text="run void method public"/, 'each row carries what the filter matches');
    const page: string = panel.getHtml();
    assert.match(page, /function initManage\(api\)/);
    assert.match(page, /new RegExp\(v, 'i'\)/, 'a regular expression works, a plain text too');
    panel._focusFilter = true;
    assert.match(panel.getManageHtml(), /data-focus="1"/, 'the Filter Members command puts the caret in the box');
});

test('Structure works on any type of the file, not only the one under the cursor', async () => {
    const { panel, a, b } = twoClassPanel();
    let html: string = panel.getManageHtml();
    assert.match(html, /<select id="mType"/);
    for (const label of ['TAlpha (class)', 'TBeta (class)', 'File-level routines (1)']) { assert.ok(html.includes(label), label); }
    assert.ok(html.includes('Name') && !html.includes('GetCount'), 'the type under the cursor first');

    panel._manageClassId = 'cb';
    html = panel.getManageHtml();
    assert.ok(html.includes('GetCount') && !html.includes('>Run('), 'the chosen type');
    assert.match(html, /data-m-act="move"/, 'members can move to the other type');
    assert.match(html, /data-m-act="getset"/, 'fields offer their accessors');

    panel._manageClassId = '__file__';
    html = panel.getManageHtml();
    assert.ok(html.includes('Helper') && html.includes('Routines ('), 'the standalone routines');
    assert.doesNotMatch(html, /data-m-act="move"|data-m-act="getset"/);

    // a member of the chosen type is the target of an action, and a new member goes to that type too
    const calls: any[] = [];
    const real = vscodeMock.commands.executeCommand;
    vscodeMock.commands.executeCommand = async (...args: any[]) => { calls.push(args); };
    try {
        panel._manageClassId = 'cb';
        await panel.handleManageAction('getset', 'm6');
        await panel.handleManageAction('move', 'm8');
        await panel.handleManageAdd('method');
        panel._manageClassId = '__file__';
        await panel.handleManageAdd('method');
    } finally { vscodeMock.commands.executeCommand = real; }
    assert.deepEqual(calls[0].slice(0, 1), ['ce.generateGettersSetters']);
    assert.equal(calls[0][1].parentClass, b);
    assert.equal(calls[0][1].itemData.name, 'Count');
    assert.deepEqual(calls[1].slice(0, 1), ['ce.moveMember']);
    assert.equal(calls[1][1].itemData.name, 'GetCount');
    assert.deepEqual(calls[2].slice(0, 1), ['ce.addMethod']);
    assert.equal(calls[2][1].parentClass, b, 'added to the chosen type');
    assert.equal(calls[3][1], undefined, 'standalone routine: no type');
    assert.notEqual(a, b);
    vscodeMock.window.activeTextEditor = undefined;
});

test('Structure: commands that used to drive the tree now drive the tab', () => {
    const { panel } = twoClassPanel();
    assert.equal(panel.cycleManageGroup(), 'visibility');
    assert.equal(panel.cycleManageGroup(), 'kind');
    assert.equal(panel.cycleManageGroup(), 'alpha');
    assert.equal(panel.cycleManageGroup(), 'source');
    panel._manageFilter = 'x'; panel._manageKind = 'field';
    panel.clearManageFilter();
    assert.deepEqual([panel._manageFilter, panel._manageKind], ['', '']);
    vscodeMock.window.activeTextEditor = undefined;
});

test('the Classes tree view is gone from the sidebar, with its menus', () => {
    const pkg = require('../../package.json');
    assert.deepEqual(pkg.contributes.views['ce-explorer'].map((v: any) => v.id), ['ceTemplates', 'ceViewer', 'ceGuideView']);
    assert.doesNotMatch(JSON.stringify(pkg.contributes.menus), /ceCodeExplorer/);
    for (const c of ['ce.manageMembers', 'ce.filterTree', 'ce.toggleGroupBy', 'ce.clearFilter', 'ce.memo.open']) {
        assert.ok(pkg.contributes.commands.some((x: any) => x.command === c), c + ' stays available');
    }
});

/* ───────────── shortcuts shown next to the tools ───────────── */

test('tools show their keyboard shortcut next to the button', () => {
    const panel = makePanel();
    panel._tab = 'tools';
    panel.isDelphi = () => true;
    let html: string = panel.getHtml();
    assert.match(html, /data-dl="ce.delphi.designer"[^>]*>🎨 Open the visual form designer<span class="kbd"[^>]*>Ctrl\+K D<\/span>/);
    assert.match(html, /data-dl="ce.delphi.project"[^>]*>🗂️ Project insights/);
    assert.doesNotMatch(html, /data-dl="ce.delphi.(check|align|anchors|tabOrder|duplicate|changeClass|formFromFields)"/, 'the layout and check tools moved to the designer');
    assert.match(html, /id="alignGo"[^>]*>Align<span class="kbd"[^>]*>Ctrl\+K J<\/span>/);
    assert.equal((html.match(/class="kbd"/g) ?? []).length, 2 + 1, 'the designer and the project insights, and the align button');

    panel.isDelphi = () => false;
    panel.isPlSql = () => true;
    html = panel.getHtml();
    assert.match(html, /data-pl="ce.plsql.syncPackage"[^>]*>🔄 Sync spec ⇄ body<span class="kbd"[^>]*>Ctrl\+K Y<\/span>/);
    assert.match(html, /data-pl="ce.plsql.docHeader"[^>]*>📘 PLDoc header<span class="kbd"[^>]*>Ctrl\+K D<\/span>/, 'the same letter serves the other family of files');
    assert.match(panel.getHtml(), /title="Ctrl\+K Ctrl\+N"[^>]*>Memo<\/button>|data-tab="memo" title="Ctrl\+K Ctrl\+N"/);
});

test('every shortcut shown is a real keybinding of the right files, and none shadows a VS Code default', async () => {
    const { TOOL_SHORTCUTS, FIXED_SHORTCUTS } = await import('../webview/toolsSection');
    const pkg = require('../../package.json');
    const bindings: { command: string; key: string; when?: string }[] = pkg.contributes.keybindings;
    const whenOf: Record<string, RegExp> = { delphi: /pas\|dfm\|dpr/, plsql: /pks\|pkb\|sql/, global: /editorTextFocus/ };
    const RESERVED = ['m', 'f', 'p', 'r', 'o', 'u', 'w', 'z', 'v', 's'];
    for (const [family, table] of Object.entries(TOOL_SHORTCUTS)) {
        const seen = new Set<string>();
        for (const [cmd, letter] of Object.entries(table)) {
            const b = bindings.find(k => k.command === cmd);
            assert.ok(b, cmd + ' has a keybinding');
            assert.equal(b!.key, 'ctrl+k ' + letter, cmd);
            assert.match(b!.when ?? '', whenOf[family], cmd + ' is limited to its own files');
            assert.ok(!seen.has(letter), 'letter ' + letter + ' used twice in ' + family);
            seen.add(letter);
            assert.ok(!RESERVED.includes(letter), letter + ' is a VS Code default (Ctrl+K ' + letter + ')');
        }
    }
    for (const [cmd, label] of Object.entries(FIXED_SHORTCUTS)) {
        const b = bindings.find(k => k.command === cmd);
        assert.ok(b, cmd);
        assert.equal(label.toLowerCase(), b!.key, cmd);
    }
    // the Delphi tools of the Tools tab are exactly the ones with a shortcut
    const { DELPHI_COMMANDS, PLSQL_COMMANDS } = await import('../webview/toolsSection');
    assert.deepEqual(Object.keys(TOOL_SHORTCUTS.delphi).sort(), [...DELPHI_COMMANDS].sort());
    assert.deepEqual(Object.keys(TOOL_SHORTCUTS.plsql).sort(), [...PLSQL_COMMANDS].sort());
});

/* ───────────── Memo: Markdown notes per language ───────────── */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function memoPanel(): { panel: any; dir: string } {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-memo-'));
    const registry = { getByDocument: (d: any) => (d.lang ? { languageId: d.lang } : undefined), getAllProviders: () => [{ languageId: 'pascal', displayName: 'Delphi / Pascal' }, { languageId: 'plsql', displayName: 'Oracle PL/SQL' }] };
    const panel = makePanel({ subscriptions: [], globalStorageUri: { fsPath: dir } }, registry);
    return { panel, dir };
}

test('Memo tab: one Markdown memo per language, following the file being edited', async () => {
    const { panel, dir } = memoPanel();
    panel._tab = 'memo';
    vscodeMock.window.activeTextEditor = { document: { lang: 'pascal', uri: { fsPath: '/x/u.pas' } } };
    let html: string = panel.getEmptyHtml();
    assert.match(html, /class="tab active" data-tab="memo"/);
    assert.match(html, /<select id="memoLang"/);
    assert.match(html, /selected>↻ Language of the active file \(Delphi \/ Pascal\)/, 'follows the active file');
    assert.match(html, /<textarea id="memoText"/, 'an empty memo opens in the editor');
    assert.doesNotMatch(html, /class="class-header"/);

    panel.handleMemoSave('pascal', '# Delphi\n\n- [ ] Build\n\n```pascal\nShowMessage(1);\n```\n');
    await panel._memoWrites;
    assert.equal(fs.readFileSync(path.join(dir, 'memos', 'pascal.md'), 'utf8').split('\n')[0], '# Delphi', 'saved as a plain .md file');

    html = panel.getEmptyHtml();
    assert.match(html, /<h3>Delphi<\/h3>/, 'a memo with text opens as a preview');
    assert.match(html, /data-memo-insert="0"/);
    assert.match(html, /Delphi \/ Pascal •/, 'languages that have a memo are marked');

    vscodeMock.window.activeTextEditor = { document: { lang: 'plsql', uri: { fsPath: '/x/a.pks' } } };
    html = panel.getEmptyHtml();
    assert.match(html, /textarea/, 'another language, another (empty) memo');
    assert.doesNotMatch(html, /Build/);

    panel._memoLang = 'pascal';
    vscodeMock.window.activeTextEditor = { document: { lang: 'plsql', uri: { fsPath: '/x/a.pks' } } };
    assert.match(panel.getEmptyHtml(), /<h3>Delphi<\/h3>/, 'a fixed language does not follow the file');
    vscodeMock.window.activeTextEditor = undefined;
    fs.rmSync(dir, { recursive: true, force: true });
});

test('Memo: code blocks are copied or inserted at the cursor, task boxes ticked, and the setting moves the folder', async () => {
    const { panel, dir } = memoPanel();
    panel._tab = 'memo';
    panel._memoLang = 'general';
    panel.handleMemoSave('general', '- [ ] one\n- [x] two\n\n```sql\nselect 1 from dual;\n```\n```\nsecond\n```\n');

    const inserted: string[] = [];
    vscodeMock.window.activeTextEditor = { document: { lang: 'plsql' }, selections: ['SEL'], edit: async (cb: any) => { cb({ replace: (sel: string, text: string) => inserted.push(sel + ':' + text) }); return true; } };
    await panel.handleMemoBlock(1, 'insert');
    await panel.handleMemoBlock(0, 'insert');
    assert.deepEqual(inserted, ['SEL:second', 'SEL:select 1 from dual;']);
    let copied = '';
    vscodeMock.env.clipboard.writeText = async (t: string) => { copied = t; };
    (vscodeMock.window as any).setStatusBarMessage = () => undefined;
    await panel.handleMemoBlock(0, 'copy');
    assert.equal(copied, 'select 1 from dual;');
    await panel.handleMemoBlock(7, 'copy');
    assert.equal(copied, 'select 1 from dual;', 'an unknown block does nothing');

    panel.handleMemoToggle(0);
    panel.handleMemoToggle(1);
    panel.handleMemoToggle(3);
    assert.equal(panel.memoText('general').split('\n').slice(0, 2).join('|'), '- [x] one|- [ ] two', 'only task lines flip');
    await panel._memoWrites;
    assert.match(fs.readFileSync(path.join(dir, 'memos', 'general.md'), 'utf8'), /- \[x\] one/);

    // the folder setting: a relative path is taken from the workspace, so memos can be versioned with the project
    (vscodeMock.workspace as any).getConfiguration = () => ({ get: () => 'docs/memos' });
    (vscodeMock.workspace as any).workspaceFolders = [{ uri: { fsPath: path.join(dir, 'ws') } }];
    assert.equal(panel.memoFolder(), path.join(dir, 'ws', 'docs', 'memos'));
    delete (vscodeMock.workspace as any).getConfiguration;
    delete (vscodeMock.workspace as any).workspaceFolders;
    vscodeMock.window.activeTextEditor = undefined;
    fs.rmSync(dir, { recursive: true, force: true });
});

test('memo renderer: everything is escaped, links keep http(s) only, tasks know their line', async () => {
    const { renderMemo, toggleTask, codeBlocks } = await import('../utils/memoMarkdown');
    const r = renderMemo('# <b>T</b>\n\ntext <script>alert(1)</script> **bold** *it* `a<b` [ok](https://x.io/a?b=1&c=2) [bad](javascript:alert(1))\n\n- [ ] a\n- [X] b\n* c\n1. d\n> q\n---\n');
    assert.doesNotMatch(r.html, /<script|<b>|href="javascript/, 'no markup from the text, no script link');
    assert.match(r.html, /<h3>&lt;b&gt;T&lt;\/b&gt;<\/h3>/);
    assert.match(r.html, /<strong>bold<\/strong>/);
    assert.match(r.html, /<em>it<\/em>/);
    assert.match(r.html, /<code>a&lt;b<\/code>/);
    assert.match(r.html, /<a href="#" data-memo-link="https:\/\/x\.io\/a\?b=1&amp;c=2">ok<\/a>/);
    assert.match(r.html, /data-memo-line="4"> <span>a/);
    assert.match(r.html, /data-memo-line="5" checked> <span class="done">b/);
    assert.match(r.html, /<ol>\s*<li>d<\/li>\s*<\/ol>/);
    assert.match(r.html, /<blockquote>q<\/blockquote>/);
    assert.match(r.html, /<hr>/);
    assert.deepEqual(codeBlocks('a\n```js\n1\n```\n~~~\n2\n3\n~~~'), ['1', '2\n3']);
    assert.equal(toggleTask('- [ ] a\r\nb', 0), '- [x] a\r\nb', 'CRLF is kept');
    assert.equal(toggleTask('x', 0), undefined);
    assert.equal(renderMemo('```\nunclosed').blocks.length, 1, 'an unclosed fence does not hang or lose text');
});

test('memo store: safe file names, size limit, list of the languages that have a memo', async () => {
    const { MemoStore, sanitizeLang, MAX_MEMO_BYTES } = await import('../services/MemoStore');
    assert.equal(sanitizeLang('../../Evil Name!'), 'evilname');
    assert.equal(sanitizeLang(''), 'general');
    assert.equal(sanitizeLang('C:\\x'), 'cx');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-store-'));
    const store = new MemoStore(path.join(dir, 'sub'));
    assert.equal(await store.read('go'), '', 'no memo yet');
    await store.write('go', '# Go');
    await store.write('typescript', '');
    assert.equal(await store.read('go'), '# Go');
    assert.equal(store.readSync('go'), '# Go');
    assert.deepEqual(await store.languages(), ['go'], 'an empty memo does not count');
    assert.deepEqual(store.languagesSync(), ['go']);
    assert.equal(path.dirname(store.fileFor('../x')), path.join(dir, 'sub'), 'a name cannot leave the folder');
    await assert.rejects(store.write('go', 'x'.repeat(MAX_MEMO_BYTES + 1)), /too big/);
    fs.rmSync(dir, { recursive: true, force: true });
});

test('no page of the sidebar uses an inline style attribute: the nonce in its CSP makes the browser ignore them', () => {
    const panel = makePanel();
    panel.isDelphi = () => true;
    panel.isPlSql = () => true;
    for (const tab of ['detail', 'manage', 'tools', 'memo']) {
        panel._tab = tab;
        for (const [name, html] of [['member page', panel.getHtml()], ['empty page', panel.getEmptyHtml()]] as [string, string][]) {
            const markup = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
            assert.doesNotMatch(markup, /\sstyle=/, tab + ' tab, ' + name);
        }
    }
    panel._tab = 'tools';
    const html: string = panel.getHtml();
    assert.match(html, /data-sub="plsql" hidden/, 'the other sub-pages are hidden through the hidden attribute');
    assert.match(html, /p\.hidden = p\.getAttribute\('data-sub'\) !== id/, 'and shown again the same way');
});

test('Tools: the language drop-down is there on a file CE does not know, with or without a member', () => {
    const registry = {
        getByDocument: () => undefined,
        getAllProviders: () => [{ languageId: 'pascal', displayName: 'Pascal / Delphi' }, { languageId: 'plsql', displayName: 'PL/SQL (Oracle)' }],
    };
    vscodeMock.window.activeTextEditor = { document: { uri: { fsPath: 'C:\src\Defs.inc', scheme: 'file' }, languageId: 'plaintext' } };
    try {
        const panel = makePanel({ subscriptions: [] }, registry);
        panel._tab = 'tools';
        assert.match(panel.getHtml(), /<select id="langSel"/, 'with a member selected');
        panel._state = { member: undefined, classInfo: undefined, provider: undefined };
        panel._tab = 'tools';
        assert.match(panel.getHtml(), /<select id="langSel"/, 'on the empty page');
    } finally { vscodeMock.window.activeTextEditor = undefined; }
});

test('Tools: the drop-down is still there while a sidebar page has the focus (no active text editor)', () => {
    const registry = { getByDocument: () => undefined, getAllProviders: () => [{ languageId: 'pascal', displayName: 'Pascal / Delphi' }] };
    const w = vscodeMock.window as any;
    w.activeTextEditor = undefined;
    w.visibleTextEditors = [{ document: { uri: { fsPath: 'C:\src\Defs.inc', scheme: 'file' }, languageId: 'plaintext', isClosed: false } }];
    try {
        const panel = makePanel({ subscriptions: [] }, registry);
        panel._tab = 'tools';
        assert.match(panel.getHtml(), /<select id="langSel"[\s\S]*every \.inc file/);
    } finally { w.visibleTextEditors = undefined; }
});

test('Structure: the filter is emptied when another file comes to the front', () => {
    const w = vscodeMock.window as any;
    const before = w.onDidChangeActiveTextEditor;
    let fire: ((e: any) => void) | undefined;
    w.onDidChangeActiveTextEditor = (cb: (e: any) => void) => { fire = cb; return { dispose() {} }; };
    w.activeTextEditor = { document: { uri: { fsPath: 'C:\a\One.pas', scheme: 'file', toString: () => 'file:///a/One.pas' } } };
    try {
        const panel = new MemberViewerPanel({} as any, { getByDocument: () => undefined }, {} as any, {} as any, { subscriptions: [] } as any) as any;
        panel._manageFilter = 'Run';
        panel._manageKind = 'method';
        panel._filterFile = 'file:///a/One.pas';
        fire!({ document: { uri: { fsPath: 'C:\a\One.pas', scheme: 'file', toString: () => 'file:///a/One.pas' } } });
        assert.equal(panel._manageFilter, 'Run', 'the same file keeps its filter');
        fire!({ document: { uri: { fsPath: 'C:\a\Two.pas', scheme: 'file', toString: () => 'file:///a/Two.pas' } } });
        assert.deepEqual([panel._manageFilter, panel._manageKind], ['', ''], 'another file starts clean');
    } finally { w.onDidChangeActiveTextEditor = before; w.activeTextEditor = undefined; }
});
