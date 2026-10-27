import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { GROUPS, NOT_FOR_MENUS, PackageLike, appliesTo, groupOf, quickActions } from '../services/QuickActions';
import { NAV_GROUPS, NAV_KEYS, NAV_PREFIXES, NavKeyParser } from '../services/NavKeys';
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
        if (!c.command.startsWith('ce.') || NOT_FOR_MENUS.has(c.command)) { continue; }
        assert.ok(everything.has(c.command), c.command + ' is offered in some file');
    }
});

test('the commands of a language are offered in its files only, and the shortcut is shown', () => {
    const pas = quickActions(pkg, { ext: '.pas', languageId: 'pascal' }).map(a => a.command);
    const ts = quickActions(pkg, { ext: '.ts', languageId: 'typescript' }).map(a => a.command);
    const sql = quickActions(pkg, { ext: '.pks', languageId: 'plsql' }).map(a => a.command);
    assert.ok(pas.includes('ce.delphi.check') && !pas.includes('ce.plsql.syncPackage'));
    assert.ok(sql.includes('ce.plsql.syncPackage') && !sql.includes('ce.delphi.check'));
    assert.ok(!ts.includes('ce.delphi.check') && !ts.includes('ce.addComponent') && ts.includes('ce.addMethod'));
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

test('the Code Explorer submenu of the editor holds the commands, grouped, the Delphi and PL/SQL ones only in their files', () => {
    const top = pkg.contributes.menus['editor/context'];
    assert.deepEqual(top.map(m => m.submenu), ['ce.editorMenu'], 'one entry in the context menu of the editor');
    const sub = pkg.contributes.menus['ce.editorMenu'];
    assert.ok(sub.some(m => m.command === 'ce.showActions') && sub.some(m => m.command === 'ce.nav.toggle'));
    for (const m of sub.filter(x => x.command?.startsWith('ce.delphi.'))) { assert.match(m.when ?? '', /pas\|dfm/, m.command); }
    for (const m of sub.filter(x => x.command?.startsWith('ce.plsql.'))) { assert.match(m.when ?? '', /pks\|pkb/, m.command); }
    assert.ok(sub.every(m => !m.command || pkg.contributes!.commands!.some(c => c.command === m.command)), 'every command of the menu is declared');
});

test('the keys of the navigation mode: one table, no key twice, no key that is also the start of a sequence', () => {
    const keys = NAV_KEYS.map(k => k.keys);
    assert.equal(new Set(keys).size, keys.length);
    for (const k of NAV_KEYS) { assert.ok(NAV_GROUPS.some(g => g.id === k.group), k.keys + ' has a group'); }
    for (const k of NAV_KEYS.filter(x => x.keys.length === 1)) { assert.ok(!NAV_PREFIXES.has(k.keys), k.keys + ' is not also a prefix'); }
    assert.ok(['gg', 'gd', 'gr', 'za'].every(k => keys.includes(k)));
});

test('the parser reads numbers, two-key sequences and ignores what means nothing', () => {
    const p = new NavKeyParser();
    const run = (s: string) => [...s].map(c => p.feed(c)).flatMap(r => (r.action ? [r.action] : []));
    assert.deepEqual(run('j'), [{ id: 'down', count: 0 }]);
    assert.deepEqual(run('5j'), [{ id: 'down', count: 5 }]);
    assert.deepEqual(run('12G'), [{ id: 'bottom', count: 12 }]);
    assert.deepEqual(run('gd'), [{ id: 'definition', count: 0 }]);
    assert.deepEqual(run('3]]'), [{ id: 'nextMember', count: 3 }]);
    assert.deepEqual(run('0'), [{ id: 'lineStart', count: 0 }], '0 alone is the start of the line');
    assert.deepEqual(run('10j'), [{ id: 'down', count: 10 }], '0 after a number is part of it');
    assert.deepEqual(run('gx'), [], 'an unknown sequence does nothing');
    assert.deepEqual(run('Q'), [], 'an unknown key does nothing');
    p.reset();
    assert.equal(p.feed('4').pending, '4');
    assert.equal(p.feed('g').pending, '4g', 'what is waiting is shown');
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

test('the entry points are wired: command, Escape, status menu and the one status item', () => {
    const ext = fs.readFileSync(path.join(__dirname, '..', 'extension.ts'), 'utf8');
    assert.match(ext, /new NavMode\(context, providerRegistry, codeExplorer\)/);
    assert.match(ext, /registerStatusMenu\(context, providerRegistry, \(\) => navMode\.active\)/);
    assert.ok(!/designerStatus/.test(ext), 'the designer button of the status bar became a row of the menu');
    const esc = pkg.contributes.keybindings.find(k => k.command === 'ce.nav.exit')!;
    assert.match(esc.when ?? '', /ce\.navMode/);
    for (const f of ['LanguageCommands.ts', 'EncodingCommands.ts']) {
        assert.ok(!/createStatusBarItem/.test(fs.readFileSync(path.join(__dirname, '..', 'services', f), 'utf8')), f + ' has no item of its own any more');
    }
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
