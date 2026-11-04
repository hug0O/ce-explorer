import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { GROUPS, NOT_FOR_MENUS, PackageLike, REPLACED, appliesTo, groupOf, quickActions } from '../services/QuickActions';
import { declImplTarget, memberLines, stepMember } from '../services/MemberNav';
import { describeStatus } from '../services/StatusText';

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')) as PackageLike & {
    contributes: { menus: Record<string, { command?: string; submenu?: string; when?: string }[]>; keybindings: { key: string; command: string; when?: string }[] };
};

test('the quick actions are built from the package: every command that can run from a menu is offered somewhere', () => {
    const everything = new Set<string>();
    for (const ctx of [{ ext: '.pas', languageId: 'pascal' }, { ext: '.pks', languageId: 'plsql' }, { ext: '.ts', languageId: 'typescript' }]) {
        for (const a of quickActions(pkg, ctx)) { everything.add(a.command); }
    }
    for (const c of pkg.contributes!.commands!) {
        if (!c.command.startsWith('ce.') || NOT_FOR_MENUS.has(c.command) || REPLACED.has(c.command)) { continue; }
        assert.ok(everything.has(c.command), c.command + ' is offered in some file');
    }
});

test('the commands of a language are offered in its files only, and the shortcut is shown', () => {
    const pas = quickActions(pkg, { ext: '.pas', languageId: 'pascal' }).map(a => a.command);
    const ts = quickActions(pkg, { ext: '.ts', languageId: 'typescript' }).map(a => a.command);
    const sql = quickActions(pkg, { ext: '.pks', languageId: 'plsql' }).map(a => a.command);
    assert.ok(pas.includes('ce.delphi.check') && !pas.includes('ce.plsql.syncPackage'));
    assert.ok(sql.includes('ce.plsql.syncPackage') && !sql.includes('ce.delphi.check'));
    assert.ok(!ts.includes('ce.delphi.check') && !ts.includes('ce.addComponent') && ts.includes('ce.addMember') && !ts.includes('ce.addMethod'));
    assert.ok(ts.includes('ce.delphi.project'), 'Project insights works anywhere');
    const manage = quickActions(pkg, { ext: '.ts', languageId: 'typescript' }).find(a => a.command === 'ce.manageMembers')!;
    assert.equal(manage.keys, 'Ctrl+K Ctrl+M');
    assert.ok(!appliesTo('ce.deleteMember', { ext: '.ts', languageId: 'typescript' }), 'a command that needs a tree item is not offered');
});

test('the groups come in their order, each command in one of them', () => {
    const list = quickActions(pkg, { ext: '.pas', languageId: 'pascal' });
    const ids = GROUPS.map(g => g.id);
    let last = -1;
    for (const a of list) {
        const i = ids.indexOf(a.group);
        assert.ok(i >= 0, a.command + ' has a known group');
        assert.ok(i >= last, 'groups are in order');
        last = i;
    }
    assert.equal(groupOf('ce.delphi.check'), 'delphi');
    assert.equal(groupOf('ce.plsql.docHeader'), 'plsql');
});

test('the Code Explorer submenu of the editor has a few entries on top and the rest one level down, the Delphi and PL/SQL ones only in their files', () => {
    const top = pkg.contributes.menus['editor/context'];
    assert.deepEqual(top.map(m => m.submenu), ['ce.editorMenu'], 'one entry in the context menu of the editor');
    const main = pkg.contributes.menus['ce.editorMenu'];
    const first = main.filter(m => m.command).map(m => m.command);
    assert.deepEqual(first, ['ce.showActions', 'ce.manageMembers', 'ce.nav.pickMember', 'ce.rename', 'ce.blueprint.open', 'ce.blueprint.project'], 'the few things everybody uses');
    assert.ok(main.length <= 7, 'six commands and the submenu of the others');
    assert.ok(main.some(m => m.submenu === 'ce.editorMore'));
    const sub = pkg.contributes.menus['ce.editorMore'];
    assert.ok(['ce.nav.nextMember', 'ce.nav.prevMember', 'ce.nav.toggleDeclImpl', 'ce.codeReview', 'ce.editMember'].every(c => sub.some(m => m.command === c)), 'the others are one level down');
    for (const m of sub.filter(x => x.command?.startsWith('ce.delphi.'))) { assert.match(m.when ?? '', /pas|dfm/, m.command); }
    for (const m of sub.filter(x => x.command?.startsWith('ce.plsql.'))) { assert.match(m.when ?? '', /pks|pkb/, m.command); }
    const declared = (c: string | undefined): boolean => !c || pkg.contributes!.commands!.some(x => x.command === c);
    assert.ok(main.every(m => declared(m.command)) && sub.every(m => declared(m.command)), 'every command of the menus is declared');
    const sm = (pkg.contributes as unknown as { submenus: { id: string }[] }).submenus.map(x => x.id);
    assert.deepEqual(sm.sort(), ['ce.editorMenu', 'ce.editorMore']);
});

test('the command palette does not offer the commands that need an element of a list or the arguments of another command', () => {
    const palette = pkg.contributes.menus.commandPalette as unknown as { command: string; when: string }[];
    for (const c of ['ce.lensRun', 'ce.navigateToMember', 'ce.openMemberEditor', 'ce.batchMove', 'ce.batchGenerateGettersSetters', 'ce.setLanguageTo', 'ce.moveMember', 'ce.delphi.designerFullScreen']) {
        assert.ok(palette.some(m => m.command === c && m.when === 'false'), c + ' is not in the palette');
    }
    assert.ok(!palette.some(m => m.command === 'ce.showActions'), 'the actions menu stays in the palette');
});

test('the settings are in sections with a title, and one command opens them', () => {
    const cfg = (pkg.contributes as unknown as { configuration: { title: string; properties: Record<string, unknown> }[] }).configuration;
    assert.ok(Array.isArray(cfg) && cfg.length >= 3);
    assert.deepEqual(cfg.map(c => c.title), ['Code Explorer: General', 'Code Explorer: Translation', 'Code Explorer: Delphi', 'Code Explorer: PL/SQL', 'Code Explorer: Formatting (advanced)']);
    const keys = cfg.flatMap(c => Object.keys(c.properties));
    assert.equal(new Set(keys).size, keys.length, 'a setting is in one section only');
    assert.ok(keys.includes('ce.previewEdits') && keys.includes('ce.cpp.braceStyle'));
    const tags = (c: { properties: Record<string, unknown> }, k: string): string[] => ((c.properties[k] as { tags?: string[] }).tags ?? []);
    assert.ok(tags(cfg[4], 'ce.cpp.braceStyle').includes('advanced'), 'the formatting details are marked advanced');
    assert.ok(Object.values(cfg[0].properties).every((v, i) => (v as { order?: number }).order === i + 1), 'the everyday settings are in a chosen order');
    assert.ok(pkg.contributes.commands!.some(c => c.command === 'ce.openSettings'));
});

test('the status item says the language, the accents warning and where to click', () => {
    const base = { fsPath: 'C:\\p\\Main.pas', languageId: 'pascal', displayName: 'Delphi / Pascal', encodingWrong: false };
    assert.equal(describeStatus(base).text, '$(symbol-misc) CE: Delphi / Pascal');
    assert.equal(describeStatus({ ...base, fsPath: 'a.ts', displayName: 'TypeScript' }).text, '$(symbol-class) CE: TypeScript');
    const bad = describeStatus({ ...base, encodingWrong: true });
    assert.ok(bad.warning && bad.text.startsWith('$(warning)') && /accents/.test(bad.tooltip));
    assert.equal(describeStatus({ fsPath: 'x.zzz', encodingWrong: false }).text, '$(question) CE');
    assert.match(describeStatus({ ...base, chosenName: 'PL/SQL', via: 'every .txt file' }).tooltip, /PL\/SQL \(every \.txt file\)/);
});

test('the Structure list has its keys, the tab bar stays on one line with icons, and each language comes back to its tab', () => {
    const manage = fs.readFileSync(path.join(__dirname, '..', 'webview', 'manageSection.ts'), 'utf8');
    for (const k of ['ArrowDown', 'ArrowUp', "'F2'", "'Delete'", "'Enter'", 'kcur']) { assert.ok(manage.includes(k), k); }
    assert.match(manage, /cursorRow\.scrollIntoView\(\{ block: 'center' \}\)/, 'the member under the cursor is shown');
    const panel = fs.readFileSync(path.join(__dirname, '..', 'webview', 'MemberViewerPanel.ts'), 'utf8');
    assert.match(panel, /\.tabs \{ display: flex; flex-wrap: nowrap; overflow-x: auto;/);
    assert.match(panel, /data-ico="\$\{TAB_ICONS\[id\] \?\? ''\}"/);
    assert.match(panel, /case 'setTab': this\.rememberTab\(msg\.tab\);/);
    assert.match(panel, /globalState\?\.update\('ce\.tabByLanguage'/);
    assert.match(panel, /const saved = this\._tabByLanguage\[lang\];/);
});

test('the status bar has one item and no mode: the old ones and the vi-like mode are gone', () => {
    const ext = fs.readFileSync(path.join(__dirname, '..', 'extension.ts'), 'utf8');
    assert.match(ext, /registerNavCommands\(context, codeExplorer\)/);
    assert.match(ext, /registerStatusMenu\(context, providerRegistry\)/);
    assert.ok(!/designerStatus/.test(ext), 'the designer button of the status bar became a row of the menu');
    for (const f of ['LanguageCommands.ts', 'EncodingCommands.ts']) {
        assert.ok(!/createStatusBarItem/.test(fs.readFileSync(path.join(__dirname, '..', 'services', f), 'utf8')), f + ' has no item of its own any more');
    }
    for (const gone of ['NavMode.ts', 'NavKeys.ts']) { assert.ok(!fs.existsSync(path.join(__dirname, '..', 'services', gone)), gone + ' is removed'); }
    const text = JSON.stringify(pkg.contributes);
    assert.ok(!/ce\.nav\.toggle"|ce\.nav\.exit|navMode/.test(text), 'nothing of the vi-like mode is left in the manifest');
});

test('the lines of the members, the next and the previous one, and the end of the file', () => {
    const lines = memberLines([{ line: 40, character: 2 }, { line: 10, character: 0 }, { line: 10, character: 8 }, { line: 25, character: 0 }]);
    assert.deepEqual(lines, [10, 25, 40]);
    assert.equal(stepMember(lines, 12, 1), 25);
    assert.equal(stepMember(lines, 25, 1), 40, 'on a member, the next one');
    assert.equal(stepMember(lines, 25, -1), 10);
    assert.equal(stepMember(lines, 12, -1), 10, 'between two members, the one above');
    assert.equal(stepMember(lines, 40, 1), 40, 'at the last one it stays');
    assert.equal(stepMember(lines, 3, -1), 3, 'before the first one it stays');
    assert.equal(stepMember(lines, 0, 1, 2), 25, 'two steps');
    assert.equal(stepMember([], 5, 1), undefined, 'a file with no member');
});

test('a declaration leads to its implementation and back, the innermost member wins', () => {
    const r = (a: number, b: number) => ({ start: { line: a, character: 0 }, end: { line: b, character: 0 } });
    const members = [
        { name: 'Save', range: r(10, 10), implementationRange: r(50, 60) },
        { name: 'Load', range: r(11, 11), implementationRange: r(62, 70) },
        { name: 'Field', range: r(12, 12) },
        { name: 'Outer', range: r(100, 140), implementationRange: r(200, 260) },
        { name: 'Inner', range: r(110, 112), implementationRange: r(210, 220) },
    ];
    assert.deepEqual(declImplTarget(members, 10), { position: { line: 50, character: 0 }, kind: 'implementation', name: 'Save' });
    assert.deepEqual(declImplTarget(members, 55), { position: { line: 10, character: 0 }, kind: 'declaration', name: 'Save' });
    assert.equal(declImplTarget(members, 12), undefined, 'a field has no implementation');
    assert.equal(declImplTarget(members, 300), undefined, 'outside every member');
    assert.equal(declImplTarget(members, 215)?.name, 'Inner', 'a routine declared inside another: the inner one');
});

test('the member keys are declared, and none of them is a key VS Code already uses in the editor', () => {
    const keys = pkg.contributes.keybindings;
    const nav = keys.filter(k => k.command.startsWith('ce.nav.'));
    assert.deepEqual(nav.map(k => k.key).sort(), ['alt+enter', 'alt+g', 'ctrl+shift+down', 'ctrl+shift+up']);
    for (const k of nav) { assert.match(k.when ?? '', /editorTextFocus/, k.command + ' works in the editor only'); }
    // what VS Code (Windows, Linux) binds in the text editor by default, and the extension must leave alone
    const taken = new Set([
        'alt+up', 'alt+down', 'alt+left', 'alt+right', 'alt+pageup', 'alt+pagedown', 'shift+alt+up', 'shift+alt+down', 'ctrl+alt+up', 'ctrl+alt+down',
        'ctrl+g', 'ctrl+p', 'ctrl+t', 'ctrl+shift+o', 'ctrl+shift+p', 'ctrl+shift+f', 'ctrl+shift+l', 'ctrl+d', 'ctrl+f', 'ctrl+h', 'ctrl+l', 'ctrl+k ctrl+f', 'ctrl+k ctrl+c', 'ctrl+k ctrl+u',
        'ctrl+/', 'ctrl+up', 'ctrl+down', 'ctrl+home', 'ctrl+end', 'f2', 'f12', 'shift+f12', 'ctrl+f12', 'ctrl+.', 'ctrl+space', 'ctrl+z', 'ctrl+y', 'ctrl+s', 'ctrl+w', 'ctrl+b',
    ]);
    for (const k of keys) {
        if (/ceFormDesigner/.test(k.when ?? '')) { continue; }   // inside the designer tab only
        assert.ok(!taken.has(k.key), k.command + ' takes ' + k.key + ', which VS Code uses');
    }
});

test('two commands never share a key unless their files differ (Delphi, PL/SQL, any other)', () => {
    const by = new Map<string, { command: string; when?: string }[]>();
    for (const k of pkg.contributes.keybindings) { by.set(k.key, [...(by.get(k.key) ?? []), k]); }
    for (const [key, list] of by) {
        if (list.length < 2) { continue; }
        for (const k of list) { assert.match(k.when ?? '', /resourceExtname/, key + ': ' + k.command + ' shares its key, so it must name its files'); }
        const sets = list.map(k => /\(([^)]*)\)\$\//.exec(k.when ?? '')?.[1] ?? '');
        assert.equal(new Set(sets).size, sets.length, key + ': two commands for the same files');
    }
});

test('what a general command replaces is hidden from the palette, the quick actions and the editor menu, and still runs', () => {
    const palette = pkg.contributes.menus.commandPalette as unknown as { command: string; when: string }[];
    const sub = pkg.contributes.menus['ce.editorMore'];
    for (const c of REPLACED) {
        assert.ok(palette.some(m => m.command === c && m.when === 'false'), c + ' is not in the palette');
        assert.ok(pkg.contributes!.commands!.some(x => x.command === c), c + ' is still a command');
        assert.ok(!sub.some(m => m.command === c), c + ' is not in the editor menu');
        assert.ok(!quickActions(pkg, { ext: '.pas', languageId: 'pascal' }).some(a => a.command === c), c + ' is not in the quick actions');
    }
    for (const g of ['ce.rename', 'ce.addMember', 'ce.variableActions']) {
        assert.ok(!palette.some(m => m.command === g), g + ' is in the palette');
        assert.ok(quickActions(pkg, { ext: '.ts', languageId: 'typescript' }).some(a => a.command === g), g + ' is in the quick actions');
    }
});
