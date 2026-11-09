import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { NativeEngine, EngineEvent, StoppedEvent } from '../debug/engine';
import { readPe } from '../debug/pe';
import { delphiProgramFor, projectOf } from '../debug/program';
import { BREAKPOINT_LANGUAGES, debugConfigFor, javaMainClass } from '../utils/debugConfig';

const root = path.join(__dirname, '..', '..');
const WINDOWS = process.platform === 'win32';
const x64 = 'C:\\Windows\\System32\\ping.exe';
const x86 = 'C:\\Windows\\SysWOW64\\ping.exe';

interface Run { wow64: boolean; entry: number; stop: StoppedEvent; registers: Record<string, string>; bytes: Buffer; stepped: StoppedEvent; exit: number }

/** Runs a program of Windows under the real debug engine: break on its first instruction, look at it, step, let it end. */
async function runUnderEngine(exe: string): Promise<Run> {
    const engine = new NativeEngine(path.join(root, 'media', 'debug', 'engine.ps1'), path.join(root, 'media', 'debug', 'CeDebugEngine.cs'));
    const events: EngineEvent[] = [];
    let wake: (() => void) | undefined;
    engine.onEvent(e => { events.push(e); wake?.(); });
    const next = async (pred: (e: EngineEvent) => boolean): Promise<EngineEvent> => {
        for (let i = 0; i < 600; i++) {
            const at = events.findIndex(pred);
            if (at >= 0) { return events.splice(at, 1)[0]; }
            await new Promise<void>(r => { wake = r; setTimeout(r, 50); });
        }
        throw new Error('the engine said nothing');
    };
    try {
        await engine.start();
        const pe = readPe(fs.readFileSync(exe))!;
        const created = await engine.launch({ exe, args: '-n 1 127.0.0.1' });
        const entry = Number(BigInt(created.base)) + pe.entryRva;
        await engine.setBreakpoint(entry);
        await engine.resume();
        const stop = await next(e => e.ev === 'stopped') as StoppedEvent;
        const registers = await engine.registers();
        const bytes = await engine.read(entry, 4);
        await engine.step();
        const stepped = await next(e => e.ev === 'stopped') as StoppedEvent;
        await engine.clearBreakpoint(entry);
        await engine.resume();
        const done = await next(e => e.ev === 'exited') as { ev: 'exited'; code: number };
        return { wow64: created.wow64, entry, stop, registers, bytes, stepped, exit: done.code };
    } finally { engine.dispose(); }
}

for (const [label, exe, wow64] of [['64-bit', x64, false], ['32-bit (WOW64, what a Win32 Delphi program is)', x86, true]] as const) {
    test(`the real debug engine stops a ${label} program on its first instruction, reads it, steps and lets it end`, { skip: !WINDOWS || !fs.existsSync(exe) ? 'needs Windows and ' + exe : false, timeout: 60000 }, async () => {
        const r = await runUnderEngine(exe);
        assert.equal(r.wow64, wow64);
        const ip = Number(BigInt(r.registers.rip ?? r.registers.eip));
        assert.equal(ip, r.entry, 'stopped on the instruction the breakpoint is on');
        assert.equal(Number(BigInt(r.stop.address)), r.entry);
        assert.notEqual(r.bytes[0], 0xcc, 'the breakpoint reads as the instruction it replaced');
        assert.equal(r.stepped.reason, 'step');
        assert.notEqual(Number(BigInt(r.stepped.address)), ip, 'one instruction later');
        assert.ok(wow64 ? 'eax' in r.registers : 'rax' in r.registers);
        assert.equal(r.exit, 0, 'the program ran to its end');
    });
}

test('the program to debug is found from a unit: the project is the .dpr above, the program is built in Win32\\Debug, the one with a map file first', () => {
    const files = new Set<string>();
    const dirs = new Map<string, string[]>();
    const add = (p: string): void => { files.add(p); const d = path.dirname(p); dirs.set(d, [...(dirs.get(d) ?? []), path.basename(p)]); };
    const fsys = { exists: (p: string) => files.has(p), list: (d: string) => dirs.get(d) ?? [] };
    const proj = path.join('C:\\', 'p', 'App');
    add(path.join(proj, 'App.dpr'));
    const unit = path.join(proj, 'src', 'Unit1.pas');
    assert.deepEqual(projectOf(unit, fsys), { name: 'App', dir: proj });
    assert.match((delphiProgramFor(unit, fsys) as { missing: string }).missing, /App\.exe is not built yet/);
    add(path.join(proj, 'Win64', 'Debug', 'App.exe'));
    assert.deepEqual(delphiProgramFor(unit, fsys), { program: path.join(proj, 'Win64', 'Debug', 'App.exe') }, 'no map file yet: the program is found, the session says what is missing');
    add(path.join(proj, 'Win32', 'Debug', 'App.exe'));
    add(path.join(proj, 'Win32', 'Debug', 'App.map'));
    assert.deepEqual(delphiProgramFor(unit, fsys), { program: path.join(proj, 'Win32', 'Debug', 'App.exe'), map: path.join(proj, 'Win32', 'Debug', 'App.map') }, 'the one with a map file');
    assert.match((delphiProgramFor(path.join('C:\\', 'elsewhere', 'X.pas'), fsys) as { missing: string }).missing, /No Delphi project/);
});

test('one command starts the debugger that fits the language of the file; Delphi has its own, the others use theirs, and a language with none says so', () => {
    assert.equal(debugConfigFor('pascal', 'C:\\p\\Unit1.pas')!.type, 'ce-delphi');
    assert.deepEqual(debugConfigFor('javascript', '/p/a.js')!.config, { type: 'node', request: 'launch', name: 'Node: a.js', program: '/p/a.js', skipFiles: ['<node_internals>/**'] });
    assert.deepEqual(debugConfigFor('typescript', '/p/a.ts')!.config.runtimeArgs, ['--import', 'tsx']);
    assert.equal(debugConfigFor('python', '/p/a.py')!.extension!.id, 'ms-python.debugpy');
    assert.equal(debugConfigFor('java', '/p/src/com/x/Main.java', 'package com.x;\nclass Main {}')!.config.mainClass, 'com.x.Main');
    assert.equal(javaMainClass('/p/Main.java', 'class Main {}'), 'Main');
    assert.equal(debugConfigFor('go', '/p/cmd/main.go')!.config.program, '/p/cmd');
    assert.equal(debugConfigFor('rust', '/p/src/main.rs')!.type, 'lldb');
    assert.equal(debugConfigFor('cpp', 'C:\\p\\a.cpp')!.type, 'cppvsdbg');
    assert.equal(debugConfigFor('powershell', 'C:\\p\\a.ps1')!.config.script, 'C:\\p\\a.ps1');
    assert.equal(debugConfigFor('shellscript', '/p/a.sh')!.type, 'bashdb');
    for (const none of ['bat', 'plsql', 'markdown', 'unknown']) { assert.equal(debugConfigFor(none, '/p/x'), undefined, none); }
    for (const l of ['python', 'java', 'csharp', 'go', 'rust', 'cpp', 'powershell', 'shellscript']) { assert.ok(debugConfigFor(l, '/p/x')!.extension, l + ' says which extension brings its debugger'); }
    assert.ok(!debugConfigFor('javascript', '/p/a.js')!.extension && !debugConfigFor('pascal', 'U.pas')!.extension, 'Node and Delphi need none');
});

test('the Delphi debugger is declared, breakpoints can be set in Pascal files, the command exists and is wired', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const d = pkg.contributes.debuggers.find((x: { type: string }) => x.type === 'ce-delphi');
    assert.ok(d && d.languages.includes('pascal'));
    assert.deepEqual(Object.keys(d.configurationAttributes.launch.properties).sort(), ['args', 'breakOnAccessViolation', 'cwd', 'mapFile', 'program', 'sourcePaths']);
    assert.ok(d.initialConfigurations[0].type === 'ce-delphi');
    assert.deepEqual(pkg.contributes.breakpoints.map((b: { language: string }) => b.language), BREAKPOINT_LANGUAGES);
    for (const l of ['pascal', 'delphi', 'objectpascal', 'plsql', 'python', 'typescript']) { assert.ok(BREAKPOINT_LANGUAGES.includes(l), l + ' has breakpoints'); }
    // with no extension for Pascal, VS Code leaves a .pas as plain text, where a breakpoint cannot be set: the extension says what the files are
    const langs = pkg.contributes.languages as { id: string; extensions: string[] }[];
    assert.ok(['.pas', '.dpr', '.dpk'].every(e => langs.find(l => l.id === 'pascal')!.extensions.includes(e)));
    assert.ok(['.pks', '.pkb'].every(e => langs.find(l => l.id === 'plsql')!.extensions.includes(e)));
    assert.ok(pkg.contributes.commands.some((c: { command: string }) => c.command === 'ce.debug.toggleBreakpoint'));
    assert.match(fs.readFileSync(path.join(root, 'src', 'services', 'DebugCommands.ts'), 'utf8'), /trackedCommand\('ce\.debug\.toggleBreakpoint'[\s\S]*vscode\.debug\.addBreakpoints/);
    assert.ok(pkg.contributes.commands.some((c: { command: string }) => c.command === 'ce.debug.start'));
    const ext = fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8');
    assert.match(ext, /registerDebug\(context\)/);
    const svc = fs.readFileSync(path.join(root, 'src', 'services', 'DebugCommands.ts'), 'utf8');
    assert.match(svc, /registerDebugAdapterDescriptorFactory\(DELPHI_TYPE/);
    assert.match(svc, /trackedCommand\('ce\.debug\.start'/);
    for (const f of ['engine.ps1', 'CeDebugEngine.cs']) { assert.ok(fs.existsSync(path.join(root, 'media', 'debug', f)), f + ' ships with the extension'); }
});
