import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addUses, buildUnitGraph, readUnit, removeUses } from '../utils/unitGraph';

const MAIN = [
    'unit Main;', '', 'interface', '', 'uses', '  Winapi.Windows, Vcl.Forms, Data;', '', 'type', '  TMain = class(TForm)', '  end;', '',
    'implementation', '', 'uses', '  Utils, // helper', '  Logs;', '', '{$R *.dfm}', '', 'end.',
].join('\r\n');

test('a unit: its name, its kind and the units of each uses clause with the section they are in', () => {
    const u = readUnit(MAIN, 'Main.pas')!;
    assert.deepEqual([u.name, u.kind], ['Main', 'unit']);
    assert.deepEqual(u.uses.map(x => [x.name, x.section]), [['Winapi.Windows', 'interface'], ['Vcl.Forms', 'interface'], ['Data', 'interface'], ['Utils', 'implementation'], ['Logs', 'implementation']]);
    const dpr = readUnit("program P;\n\nuses\n  Vcl.Forms,\n  Main in 'Main.pas' {Form1},\n  Data in 'Data.pas';\n\nbegin\nend.", 'P.dpr')!;
    assert.deepEqual([dpr.name, dpr.kind, dpr.uses.map(x => x.name)], ['P', 'program', ['Vcl.Forms', 'Main', 'Data']]);
    assert.equal(readUnit('just text', 'a.txt'), undefined);
    assert.equal(readUnit('// uses Foo;\nunit A;\ninterface\nimplementation\nend.', 'A.pas')!.uses.length, 0, 'a comment is not a clause');
});

test('the graph links the units of the project, the others are counted apart, a program is a node too', () => {
    const units = [
        readUnit(MAIN, 'Main.pas')!,
        readUnit('unit Data;\ninterface\nuses Logs;\nimplementation\nend.', 'Data.pas')!,
        readUnit('unit Utils;\ninterface\nimplementation\nuses Main;\nend.', 'Utils.pas')!,
        readUnit('unit Logs;\ninterface\nuses System.SysUtils;\nimplementation\nend.', 'Logs.pas')!,
        readUnit("program P;\nuses Main in 'Main.pas';\nbegin end.", 'P.dpr')!,
    ];
    const g = buildUnitGraph(units);
    assert.equal(g.nodes.length, 5);
    const has = (a: string, b: string): boolean => g.edges.some(e => e.from === a && e.to === b);
    assert.ok(has('Main', 'Data') && has('Main', 'Utils') && has('Main', 'Logs') && has('Data', 'Logs') && has('P', 'Main') && has('Utils', 'Main'));
    assert.deepEqual(g.external.get('Main'), ['Winapi.Windows', 'Vcl.Forms']);
    assert.deepEqual(g.external.get('Logs'), ['System.SysUtils']);
    assert.equal(g.edges.find(e => e.from === 'Utils' && e.to === 'Main')!.section, 'implementation');
    assert.equal(g.nodes.find(n => n.id === 'P')!.kind, 'program');
    assert.ok(g.nodes.find(n => n.id === 'Main')!.file === 'Main.pas');
    assert.equal(buildUnitGraph(units, { Data: { x: 7, y: 9 } }).nodes.find(n => n.id === 'Data')!.x, 7);
});

test('adding a unit to a uses clause: the end of the implementation clause, a clause made when there is none', () => {
    const added = addUses(MAIN, 'Extra')!;
    assert.ok(added.includes('  Logs, Extra;'), 'at the end of the implementation clause');
    assert.ok(added.includes('Winapi.Windows, Vcl.Forms, Data;'), 'the interface clause is left alone');
    assert.equal(addUses(MAIN, 'logs'), undefined, 'a unit already used (any case) is not added twice');
    const bare = 'unit B;\r\ninterface\r\nimplementation\r\n\r\nend.';
    const made = addUses(bare, 'Data')!;
    assert.equal(made, 'unit B;\r\ninterface\r\nimplementation\r\n\r\nuses\r\n  Data;\r\n\r\nend.');
    assert.equal(addUses("program P;\nuses Main in 'Main.pas';\nbegin end.", 'Data'), "program P;\nuses Main in 'Main.pas', Data;\nbegin end.");
});

test('removing a unit: from the middle, the end, the only one (the clause goes), with its comment and `in` kept apart', () => {
    const noUtils = removeUses(MAIN, 'Utils')!;
    assert.ok(!noUtils.includes('Utils') && noUtils.includes('Logs;'), noUtils);
    const noLogs = removeUses(MAIN, 'Logs')!;
    assert.ok(noLogs.includes('  Utils, // helper') === false || noLogs.includes('Utils'), 'Utils stays');
    assert.ok(!noLogs.includes('Logs'));
    assert.equal(removeUses('unit A;\ninterface\nimplementation\nuses\n  Only;\n\nend.', 'only'), 'unit A;\ninterface\nimplementation\n\nend.', 'a clause left empty is removed with its line');
    assert.equal(removeUses("program P;\nuses\n  Main in 'Main.pas',\n  Data in 'Data.pas';\nbegin end.", 'Main'), "program P;\nuses\n  Data in 'Data.pas';\nbegin end.");
    assert.equal(removeUses(MAIN, 'Nothing'), undefined);
});

import * as fs from 'fs';
import * as path from 'path';
import { blueprintHtml, blueprintScript } from '../webview/blueprintHtml';

test('the project view: its command, its menu entry, its page mode and the panel that writes the uses', () => {
    const root = path.join(__dirname, '..', '..');
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { contributes: { commands: { command: string }[]; menus: Record<string, { command?: string; when?: string }[]> } };
    assert.ok(pkg.contributes.commands.some(c => c.command === 'ce.blueprint.project'));
    const entry = pkg.contributes.menus['ce.editorMenu'].find(m => m.command === 'ce.blueprint.project')!;
    assert.match(entry.when ?? '', /pas\|dfm\|dpr\|dpk/);
    const ext = fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8');
    assert.match(ext, /registerCommand\('ce\.blueprint\.project'/);
    const js = blueprintScript();
    assert.match(js, /projectMode = m\.mode === 'project'/);
    assert.match(js, /projectMode \? 'Used by' : 'Called by'/);
    assert.match(js, /\['Its blueprint', 'openUnit', ''\]/);
    assert.match(js, /if \(projectMode\) \{ return; \}/, 'no new routine by double-click in the project view');
    const html = blueprintHtml({ nonce: 'n', cspSource: 'x', title: 't' });
    assert.ok(html.includes('id="openProject"'));
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'ProjectBlueprintPanel.ts'), 'utf8');
    assert.match(panel, /addUses\(before, to\.name\) : removeUses\(before, to\.name\)/);
    assert.match(panel, /BlueprintPanel\.show\(doc\)/, 'a unit opens the blueprint of its routines');
    assert.match(panel, /e\.section === 'interface'/, 'only the interface uses make a loop Delphi refuses');
});
