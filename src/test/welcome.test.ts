import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { TIPS, tipOfTheDay } from '../services/Tips';

const root = path.join(__dirname, '..', '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
    contributes: {
        commands: { command: string }[]; keybindings: { key: string; command: string }[];
        walkthroughs: { id: string; steps: { id: string; description: string; media: { markdown: string }; completionEvents: string[] }[] }[];
    };
};
const declared = new Set(pkg.contributes.commands.map(c => c.command));

test('the quick start walks through five steps, each with its page and commands that exist', () => {
    const w = pkg.contributes.walkthroughs[0];
    assert.equal(w.id, 'ce.start');
    assert.equal(w.steps.length, 5);
    for (const s of w.steps) {
        assert.ok(fs.existsSync(path.join(root, s.media.markdown)), s.id + ' has its page');
        for (const m of s.description.matchAll(/\(command:([\w.]+)\)/g)) { assert.ok(declared.has(m[1]), s.id + ' links ' + m[1]); }
        for (const e of s.completionEvents) { assert.ok(declared.has(e.replace('onCommand:', '')), s.id + ' completes on ' + e); }
    }
    assert.ok(declared.has('ce.openWalkthrough'));
    const ext = fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8');
    assert.match(ext, /workbench\.action\.openWalkthrough', 'ce\.ce-code-explorer#ce\.start'/);
});

test('the tour is offered once, never again', () => {
    const ext = fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8');
    assert.match(ext, /if \(!context\.globalState\.get<boolean>\('ce\.welcomed'\)\) \{\s*\n\s*void context\.globalState\.update\('ce\.welcomed', true\);/, 'the flag is set before the message is shown');
    assert.match(ext, /'Quick start', 'Not now'/);
});

test('the tip of the day: the same all day, another tomorrow, and every tip names a real command and the right keys', () => {
    const d = new Date(2026, 9, 29, 8, 0), later = new Date(2026, 9, 29, 22, 30), next = new Date(2026, 9, 30, 8, 0);
    assert.equal(tipOfTheDay(d), tipOfTheDay(later));
    assert.notEqual(tipOfTheDay(d), tipOfTheDay(next));
    const seen = new Set(Array.from({ length: TIPS.length }, (_, i) => tipOfTheDay(new Date(2026, 0, 1 + i)).text));
    assert.equal(seen.size, TIPS.length, 'every tip comes up in turn');
    const keys = new Map(pkg.contributes.keybindings.map(k => [k.command, k.key]));
    for (const t of TIPS) {
        assert.ok(declared.has(t.command), t.command + ' exists');
        assert.ok(t.text.length < 100, 'short enough for a menu line');
    }
    // a tip that names a key names the one that is bound
    assert.equal(keys.get('ce.nav.pickMember'), 'alt+g');
    assert.ok(TIPS.some(t => /Alt\+G/.test(t.text) && t.command === 'ce.nav.pickMember'));
    assert.ok(TIPS.some(t => /Ctrl\+Shift\+Down/.test(t.text)) && keys.get('ce.nav.nextMember') === 'ctrl+shift+down');
    assert.ok(TIPS.some(t => /Alt\+Enter/.test(t.text)) && keys.get('ce.nav.toggleDeclImpl') === 'alt+enter');
    assert.ok(TIPS.some(t => /Ctrl\+K Ctrl\+A/.test(t.text)) && keys.get('ce.showActions') === 'ctrl+k ctrl+a');
    const menu = fs.readFileSync(path.join(root, 'src', 'services', 'StatusMenu.ts'), 'utf8');
    assert.match(menu, /tipOfTheDay\(\)\.command/);
    assert.match(menu, /command: 'ce\.openWalkthrough'/);
});

test('the commands are named the same way: the CE prefix, a verb first, sentence case, and one word for one thing', () => {
    const allowed = new Set(['Delphi', 'Git', 'Markdown', 'TabOrder', 'PLDoc', 'Blueprint', 'PL/SQL', 'SQL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'MERGE', 'CREATE', 'TABLE', 'F12', 'DFM']);
    const titles = (pkg.contributes.commands as unknown as { command: string; title: string }[]);
    for (const c of titles) {
        const m = /^CE(?: PL\/SQL| Delphi)?: (.+)$/.exec(c.title);
        assert.ok(m, c.command + ' starts with CE: ' + c.title);
        const words = m![1].split(' ').slice(1);
        for (const w of words) {
            const core = w.replace(/[.,()/]+$/, '').replace(/^[(]/, '');
            if (!core || allowed.has(core) || /^[A-Z]{2,}/.test(core) || core.startsWith('.') || /\.\w+$/.test(core)) { continue; }
            assert.ok(core[0] !== core[0].toUpperCase() || core[0] === core[0].toLowerCase(), c.command + ': "' + core + '" is not sentence case in "' + c.title + '"');
        }
    }
    // one word for one thing: the member keys and the lists all say "member"
    const by = (cmd: string): string => titles.find(t => t.command === cmd)!.title;
    for (const cmd of ['ce.goToMember', 'ce.goToWorkspaceMember', 'ce.nav.pickMember', 'ce.navigateToMember']) { assert.match(by(cmd), /^CE: Go to member/, cmd); }
    assert.ok(!titles.some(t => /Navigate to/.test(t.title)), 'no "Navigate to": it is "Go to"');
});
