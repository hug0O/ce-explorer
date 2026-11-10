import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { PROBLEM_PATTERN, Probe, buildCommandLine, dprojFor, findRsvars, parseBuildOutput, rootDirsFromRegistry } from '../utils/delphiBuild';
import { delphiProgramFor } from '../debug/program';

const root = path.join(__dirname, '..', '..');

test('the build command sets up Delphi with rsvars.bat, then MSBuild builds the project with the detailed map file the debugger needs', () => {
    const line = buildCommandLine({ rsvars: 'C:\\Studio\\23.0\\bin\\rsvars.bat', dproj: 'C:\\p\\App.dproj', config: 'Debug', platform: 'Win32', target: 'Build' });
    assert.equal(line, 'call "C:\\Studio\\23.0\\bin\\rsvars.bat" && msbuild "C:\\p\\App.dproj" /t:Build /p:Config=Debug /p:Platform=Win32 /p:DCC_MapFile=3 /nologo /v:minimal /clp:NoSummary');
    assert.match(buildCommandLine({ rsvars: 'r', dproj: 'p', config: 'Release', platform: 'Win64', target: 'Rebuild' }), /\/t:Rebuild \/p:Config=Release \/p:Platform=Win64 \/p:DCC_MapFile=3/);
});

const REG = [
    '', 'HKEY_CURRENT_USER\\Software\\Embarcadero\\BDS\\21.0', '    RootDir    REG_SZ    C:\\Program Files (x86)\\Embarcadero\\Studio\\21.0\\',
    '', 'HKEY_CURRENT_USER\\Software\\Embarcadero\\BDS\\23.0', '    RootDir    REG_SZ    D:\\RAD Studio 12\\', '', 'End of search: 2 match(es) found.',
].join('\r\n');

test('the RAD Studio installed is found from the registry, newest first, and rsvars.bat from the setting, the environment, the registry or the usual folders', () => {
    assert.deepEqual(rootDirsFromRegistry(REG), ['D:\\RAD Studio 12\\', 'C:\\Program Files (x86)\\Embarcadero\\Studio\\21.0\\']);
    assert.deepEqual(rootDirsFromRegistry(''), []);
    const have = new Set(['D:\\RAD Studio 12\\bin\\rsvars.bat', 'C:\\Program Files (x86)\\Embarcadero\\Studio\\21.0\\bin\\rsvars.bat', 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0\\bin\\rsvars.bat']);
    const probe = (over: Partial<Probe> = {}): Probe => ({ env: {}, registry: REG, exists: f => have.has(f), listDirs: () => [], ...over });
    assert.equal(findRsvars('', probe()), 'D:\\RAD Studio 12\\bin\\rsvars.bat', 'the newest of the registry');
    assert.equal(findRsvars('C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0\\bin\\rsvars.bat', probe()), 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0\\bin\\rsvars.bat', 'the setting first');
    assert.equal(findRsvars('', probe({ registry: '', env: { BDS: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\21.0' } })), 'C:\\Program Files (x86)\\Embarcadero\\Studio\\21.0\\bin\\rsvars.bat', 'BDS of a Developer prompt');
    assert.equal(findRsvars('', probe({ registry: '', listDirs: d => (d === 'C:\\Program Files (x86)\\Embarcadero\\Studio' ? ['21.0', '22.0'] : []) })), 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0\\bin\\rsvars.bat', 'the usual folder, newest version');
    assert.equal(findRsvars('', probe({ registry: '', exists: () => false })), undefined);
});

test('the project to build is the .dproj of the .dpr above the unit', () => {
    const dirs = new Map<string, string[]>([[path.join('C:\\', 'p', 'App'), ['App.dpr', 'App.dproj', 'Other.dproj']], [path.join('C:\\', 'p', 'Solo'), ['Solo.dproj']]]);
    const fsys = { exists: () => true, list: (d: string) => dirs.get(d) ?? [] };
    assert.equal(dprojFor(path.join('C:\\', 'p', 'App', 'src', 'Unit1.pas'), fsys), path.join('C:\\', 'p', 'App', 'App.dproj'), 'the one with the name of the .dpr');
    assert.equal(dprojFor(path.join('C:\\', 'p', 'Solo', 'Unit1.pas'), fsys), path.join('C:\\', 'p', 'Solo', 'Solo.dproj'), 'the only one');
    assert.equal(dprojFor(path.join('C:\\', 'q', 'X.pas'), fsys), undefined);
});

const OUTPUT = [
    'Build started 11/10/2026.', 'C:\\p\\Unit1.pas(34): error E2003: Undeclared identifier: \'Foo\' [C:\\p\\App.dproj]',
    'C:\\p\\Unit2.pas(8,14): warning W1000: Symbol \'Bar\' is deprecated: \'use Baz\' [C:\\p\\App.dproj]', 'C:\\p\\Unit3.pas(1): hint H2443: Inline function not expanded', 'C:\\p\\App.dpr(1): error F2084: Internal Error: X [C:\\p\\App.dproj]',
    'Build FAILED.',
].join('\r\n');

test('the errors and warnings of a build become problems, with file, line, column, code and message; the problem matcher of the task reads the same lines', () => {
    const m = parseBuildOutput(OUTPUT);
    assert.deepEqual(m.map(x => [path.basename(x.file), x.line, x.column, x.severity, x.code]), [['Unit1.pas', 34, undefined, 'error', 'E2003'], ['Unit2.pas', 8, 14, 'warning', 'W1000'], ['App.dpr', 1, undefined, 'error', 'F2084']], 'a hint is not a problem');
    assert.equal(m[0].message, "Undeclared identifier: 'Foo'");
    assert.equal(m[1].message, "Symbol 'Bar' is deprecated: 'use Baz'");
    // the pattern of package.json is the one of the code
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const matcher = pkg.contributes.problemMatchers.find((x: { name: string }) => x.name === 'delphi');
    assert.equal(matcher.pattern.regexp, PROBLEM_PATTERN);
    const hit = new RegExp(matcher.pattern.regexp).exec(OUTPUT.split('\r\n')[1])!;
    assert.deepEqual([hit[matcher.pattern.file], hit[matcher.pattern.line], hit[matcher.pattern.severity], hit[matcher.pattern.code]], ['C:\\p\\Unit1.pas', '34', 'error', 'E2003']);
    assert.equal(new RegExp(matcher.pattern.regexp).exec('Build FAILED.'), null);
});

test('the debugger looks for the program in the folder of what was built first', () => {
    const exes = new Set<string>();
    const dirs = new Map<string, string[]>([[path.join('C:\\', 'p'), ['App.dproj', 'App.dpr']]]);
    const fsys = { exists: (f: string) => exes.has(f), list: (d: string) => dirs.get(d) ?? [] };
    const win32 = path.join('C:\\', 'p', 'Win32', 'Debug', 'App.exe');
    const win64 = path.join('C:\\', 'p', 'Win64', 'Debug', 'App.exe');
    for (const e of [win32, win64]) { exes.add(e); exes.add(e.replace(/\.exe$/, '.map')); }
    const unit = path.join('C:\\', 'p', 'Unit1.pas');
    assert.equal((delphiProgramFor(unit, fsys) as { program: string }).program, win32, 'Win32 by default');
    assert.equal((delphiProgramFor(unit, fsys, { config: 'Debug', platform: 'Win64' }) as { program: string }).program, win64, 'the platform that was built');
});

test('the build is a task (Ctrl+Shift+B) with a problem matcher, two commands, the settings, and the debugger builds before it starts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const def = pkg.contributes.taskDefinitions.find((d: { type: string }) => d.type === 'ce-delphi');
    assert.deepEqual(def.properties.task.enum, ['build', 'rebuild', 'clean', 'install']);
    for (const c of ['ce.delphi.build', 'ce.delphi.rebuild', 'ce.delphi.clean', 'ce.delphi.install', 'ce.project.clean', 'ce.project.build', 'ce.project.install']) { assert.ok(pkg.contributes.commands.some((x: { command: string }) => x.command === c), c); }
    const props = pkg.contributes.configuration.find((g: { id: string }) => g.id === 'ce.delphi').properties;
    for (const k of ['ce.delphi.rsvars', 'ce.delphi.buildConfig', 'ce.delphi.platform', 'ce.delphi.project', 'ce.delphi.installDir']) { assert.ok(props[k], k); }
    assert.equal(props['ce.delphi.buildConfig'].default, 'Debug');
    const launch = pkg.contributes.debuggers[0].configurationAttributes.launch.properties;
    assert.equal(launch.build.default, true);
    assert.deepEqual(Object.keys(launch).sort(), ['args', 'breakOnAccessViolation', 'build', 'buildConfig', 'cwd', 'mapFile', 'platform', 'program', 'project', 'sourcePaths']);
    const build = fs.readFileSync(path.join(root, 'src', 'services', 'DelphiBuild.ts'), 'utf8');
    assert.match(build, /registerTaskProvider\(BUILD_TYPE/);
    assert.match(build, /new vscode\.ShellExecution\(line, \{ executable: 'cmd\.exe', shellArgs: \['\/d', '\/c'\] \}\)/);
    assert.match(build, /'\$delphi'/);
    const debug = fs.readFileSync(path.join(root, 'src', 'services', 'DebugCommands.ts'), 'utf8');
    assert.match(debug, /if \(config\.build !== false\) \{[\s\S]*runBuild\(/);
    assert.match(fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8'), /registerDelphiBuild\(context\)/);
});
