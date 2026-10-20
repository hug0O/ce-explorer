import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'node:vm';
import { DESIGNER_SHORTCUTS, PackageShortcuts, buildShortcutGroups, formatKeys, shortLabel, shortcutsHtml, shortcutsScript } from '../webview/shortcutsSection';
import { FIXED_SHORTCUTS, TOOL_SHORTCUTS } from '../webview/toolsSection';
import { designerHtml } from '../webview/designerHtml';

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')) as PackageShortcuts & { contributes: { keybindings: { key: string; command: string; when?: string }[] } };

test('keys are written the way people read them, and command titles lose their prefix', () => {
    assert.equal(formatKeys('ctrl+k ctrl+m'), 'Ctrl+K Ctrl+M');
    assert.equal(formatKeys('ctrl+k d'), 'Ctrl+K D');
    assert.equal(formatKeys('ctrl+shift+f12'), 'Ctrl+Shift+F12');
    assert.equal(shortLabel('CE Delphi: Align / Size / Space Components...'), 'Align / Size / Space Components');
    assert.equal(shortLabel('CE PL/SQL: Find Callers'), 'Find Callers');
    assert.equal(shortLabel('CE: Open Structure (add, filter, edit, move, delete)'), 'Open Structure');
});

test('every keybinding of package.json is listed, in the mode its when clause names', () => {
    const groups = buildShortcutGroups(pkg);
    const by = (id: string) => groups.find(g => g.id === id)!;
    const listed = groups.flatMap(g => g.items).filter(i => i.command).map(i => i.command);
    for (const k of pkg.contributes.keybindings) { assert.ok(listed.includes(k.command), k.command + ' is listed'); }

    const commands = (id: string): (string | undefined)[] => by(id).items.map(i => i.command);
    assert.ok(commands('delphi').includes('ce.delphi.align') && commands('delphi').includes('ce.delphi.designer') && commands('delphi').includes('ce.delphi.toggleDesigner'));
    assert.ok(commands('plsql').includes('ce.plsql.findCallers') && commands('plsql').includes('ce.plsql.syncPackage'));
    assert.ok(!commands('delphi').some(c => c?.startsWith('ce.plsql')) && !commands('plsql').some(c => c?.startsWith('ce.delphi')), 'a mode lists its own keys only');
    assert.ok(commands('code').includes('ce.manageMembers') && commands('code').includes('ce.editMember'), 'the Structure tab key works in any code file');
    assert.ok(commands('any').includes('ce.alignSelection') && commands('any').includes('ce.memo.open'), 'keys with no file restriction');
    assert.ok(commands('designer').includes('ce.delphi.toggleDesigner'), 'Ctrl+K Ctrl+B also works from inside the designer');
    assert.deepEqual(groups.map(g => g.id), ['code', 'any', 'delphi', 'plsql', 'designer', 'sidebar']);

    const align = by('delphi').items.find(i => i.command === 'ce.delphi.align')!;
    const callers = by('plsql').items.find(i => i.command === 'ce.plsql.findCallers')!;
    assert.equal(align.keys, 'Ctrl+K L');
    assert.equal(callers.keys, 'Ctrl+K L', 'the same keys, another command in a PL/SQL file');
    assert.notEqual(align.label, callers.label);
});

test('the list agrees with the key tables the Tools tab shows on its buttons', () => {
    const groups = buildShortcutGroups(pkg);
    const keysOf = (cmd: string): string => groups.flatMap(g => g.items).find(i => i.command === cmd)!.keys;
    for (const family of ['delphi', 'plsql', 'global'] as const) {
        for (const [cmd, letter] of Object.entries(TOOL_SHORTCUTS[family])) { assert.equal(keysOf(cmd), 'Ctrl+K ' + letter.toUpperCase(), cmd); }
    }
    for (const [cmd, keys] of Object.entries(FIXED_SHORTCUTS)) { assert.equal(keysOf(cmd), keys, cmd); }
});

test('the designer keys listed here are the ones the designer webview reads', () => {
    const html = designerHtml('N');
    const reads: [string, RegExp][] = [
        ['Ctrl+S', /ev\.key\.toLowerCase\(\) === 's'/], ['Ctrl+C / Ctrl+X / Ctrl+V', /kc === 'c' \|\| kc === 'x'[\s\S]*kc === 'v'/], ['Ctrl+Z / Ctrl+Y', /ev\.key === 'y' \|\| ev\.key === 'Y'/],
        ['Ctrl+A', /ev\.key === 'a' \|\| ev\.key === 'A'/], ['Delete', /ev\.key === 'Delete'/], ['Arrows', /ev\.key === 'ArrowLeft'/], ['Esc', /ev\.key === 'Escape'/],
        ['P', /k0 === 'p'/], ['I', /k0 === 'i'/], ['F', /k0 === 'f'/],
    ];
    for (const [keys, re] of reads) {
        assert.ok(DESIGNER_SHORTCUTS.some(s => s.keys.startsWith(keys.split(' ')[0])), keys + ' is listed');
        assert.ok(re.test(html), keys + ' is handled by the designer');
    }
});

test('the tab shows the groups, a filter, mouse gestures apart, and escapes what it prints', () => {
    const groups = buildShortcutGroups(pkg);
    const html = shortcutsHtml([...groups, { id: 'x', title: '<b>', hint: '"q"', items: [{ keys: 'Ctrl+<', label: '<script>x</script>' }] }], 'a "filter"', 'ce.ce-code-explorer');
    for (const id of ['code', 'any', 'delphi', 'plsql', 'designer', 'sidebar']) { assert.ok(html.includes(`data-group="${id}"`), id); }
    assert.ok(/id="kFilter"[^>]*value="a &quot;filter&quot;"/.test(html), 'the filter is kept');
    assert.ok(/class="krow mouse"/.test(html) && /class="krow"/.test(html));
    assert.ok(/<span class="key">Ctrl\+K<\/span> <span class="key">Ctrl\+M<\/span>/.test(html), 'one keycap per chord');
    assert.ok(!/<script>x/.test(html) && /&lt;script&gt;x&lt;\/script&gt;/.test(html));
    assert.ok(/data-ext="ce\.ce-code-explorer"/.test(html));
    assert.doesNotThrow(() => new vm.Script(shortcutsScript()));
    assert.ok(/command: 'shortcutFilter'/.test(shortcutsScript()) && /command: 'openKeybindings'/.test(shortcutsScript()));
});

/* ───────── in the sidebar ───────── */

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;
const noopEvent = () => ({ dispose() {} });
const executed: unknown[][] = [];
const vscodeMock = {
    Uri: { file: (p: string) => ({ fsPath: p, path: p, toString: () => p }) },
    Position: class { constructor(public line: number, public character: number) {} },
    Range: class {},
    window: { activeTextEditor: undefined as any, onDidChangeTextEditorSelection: noopEvent, onDidChangeActiveTextEditor: noopEvent, showWarningMessage: async () => undefined, showInformationMessage: async () => undefined },
    workspace: { onDidChangeTextDocument: noopEvent, onDidSaveTextDocument: noopEvent },
    commands: { executeCommand: async (...a: unknown[]) => { executed.push(a); } },
    env: { clipboard: { writeText: async () => undefined } },
};
nodeModule._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));
const { MemberViewerPanel } = require('../webview/MemberViewerPanel') as typeof import('../webview/MemberViewerPanel');

function makePanel(): any {
    const ctx: any = { subscriptions: [], extension: { id: 'ce.ce-code-explorer', packageJSON: pkg } };
    const panel = new MemberViewerPanel({} as any, { getByDocument: () => undefined }, {}, {} as any, ctx) as any;
    panel._state = { member: undefined, classInfo: undefined, provider: undefined };
    return panel;
}

test('the Shortcuts tab is the fifth tab of the sidebar, on every page', () => {
    const panel = makePanel();
    for (const page of ['getEmptyHtml', 'getHtml'] as const) {
        panel._tab = 'shortcuts';
        const html: string = panel[page]();
        assert.ok(/data-tab="shortcuts"[^>]*>Shortcuts<\/button>/.test(html), page + ': the tab');
        assert.ok(/class="tab active" data-tab="shortcuts"/.test(html), page + ': the tab is the active one');
        assert.ok(/data-group="delphi"/.test(html) && /id="kFilter"/.test(html), page + ': the list');
        assert.ok(/initShortcuts\(/.test(html) && /function initShortcuts/.test(html), page + ': the script');
        panel._tab = 'detail';
        assert.ok(!/id="kFilter"/.test(panel[page]()), page + ': not on the other tabs');
    }
});

test('the filter text is kept, and the keybindings editor opens on this extension\'s keys', async () => {
    const panel = makePanel();
    panel._tab = 'shortcuts';
    panel._shortcutFilter = 'align';
    assert.ok(/id="kFilter"[^>]*value="align"/.test(panel.getEmptyHtml()));
    panel._view = { webview: { onDidReceiveMessage: () => undefined, set html(_h: string) { /* not needed */ } } };
    let handler: ((m: any) => Promise<void>) | undefined;
    panel._view = { webview: { options: {}, onDidReceiveMessage: (h: any) => { handler = h; }, set html(_h: string) { /* not needed */ } }, onDidDispose: () => undefined };
    panel.resolveWebviewView(panel._view, {}, {});
    await handler!({ command: 'shortcutFilter', text: 'designer' });
    assert.equal(panel._shortcutFilter, 'designer');
    await handler!({ command: 'openKeybindings' });
    assert.deepEqual(executed[executed.length - 1], ['workbench.action.openGlobalKeybindings', '@ext:ce.ce-code-explorer']);
    await handler!({ command: 'setTab', tab: 'shortcuts' });
    assert.equal(panel._tab, 'shortcuts');
});

test('a Designer button sits in the tab bar for a Delphi file, and stays while the designer tab has no text editor', () => {
    const panel = makePanel();
    assert.ok(!/class="tabdes"/.test(panel.getEmptyHtml()), 'not for another kind of file');
    vscodeMock.window.activeTextEditor = { document: { uri: { fsPath: 'C:\\p\\Unit1.pas' } } };
    const html: string = panel.getEmptyHtml();
    assert.ok(/class="tabdes" data-dl="ce\.delphi\.designer"[^>]*>🎨 Designer<\/button>/.test(html), 'a Delphi unit');
    assert.ok(/Ctrl\+K D/.test(html), 'with its shortcut');
    vscodeMock.window.activeTextEditor = undefined;
    assert.ok(/class="tabdes"/.test(panel.getEmptyHtml()), 'the designer tab itself has no text editor: the button stays');
    vscodeMock.window.activeTextEditor = { document: { uri: { fsPath: 'C:\\p\\main.ts' } } };
    assert.ok(!/class="tabdes"/.test(panel.getEmptyHtml()), 'and goes with a file that is not Delphi');
    vscodeMock.window.activeTextEditor = undefined;
});

test('the designer can be opened from the title bar, the editor and Explorer menus, and the Delphi status bar button', () => {
    const menus = (pkg as any).contributes.menus;
    for (const where of ['editor/title', 'editor/context', 'explorer/context']) {
        assert.ok(menus[where].some((m: any) => m.command === 'ce.delphi.designer' && /pas\|dfm/.test(m.when)), where);
    }
    const ext = fs.readFileSync(path.join(__dirname, '..', 'extension.ts'), 'utf8');
    assert.ok(/createStatusBarItem\(vscode\.StatusBarAlignment\.Left, 90\)/.test(ext) && /designerStatus\.command = 'ce\.delphi\.designer'/.test(ext));
    const panel = fs.readFileSync(path.join(__dirname, '..', 'webview', 'FormDesignerPanel.ts'), 'utf8');
    assert.ok(/From the designer tab itself there is no text editor: the designer that is open is shown again/.test(panel), 'the command works from the designer tab');
});
