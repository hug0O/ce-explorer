import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMap, SymbolTable } from '../debug/mapFile';
import { readPe } from '../debug/pe';
import { DelphiDebugSession, DapMessage } from '../debug/session';
import { CreatedEvent, DebugEngine, EngineEvent, LaunchOptions } from '../debug/engine';

// ---------------------------------------------------------------- a small Win32 program: its executable, its map file
const BASE = 0x400000;

/** The header of a 32-bit executable with one section, `.text`, at 0x1000. */
function fakeExe(): Buffer {
    const b = Buffer.alloc(0x400);
    b.write('MZ', 0, 'latin1');
    b.writeUInt32LE(0x80, 0x3c);
    b.write('PE\0\0', 0x80, 'latin1');
    b.writeUInt16LE(0x14c, 0x84);
    b.writeUInt16LE(1, 0x86);
    b.writeUInt16LE(224, 0x94);
    const opt = 0x98;
    b.writeUInt16LE(0x10b, opt);
    b.writeUInt32LE(0x1000, opt + 16);
    b.writeUInt32LE(BASE, opt + 28);
    const sec = opt + 224;
    b.write('.text', sec, 'latin1');
    b.writeUInt32LE(0x100, sec + 8);
    b.writeUInt32LE(0x1000, sec + 12);
    return b;
}

const MAP = [
    '', ' Start         Length     Name                   Class', ' 0001:00001000 00000100H .text                   CODE', '',
    'Detailed map of segments', '', ' 0001:00001000 00000100 C=CODE     S=.text    G=(none)   M=Unit1    ACBP=A9', '',
    '  Address         Publics by Name', '', ' 0001:00001040       Unit1.Bar', ' 0001:00001000       Unit1.Foo', '',
    '  Address         Publics by Value', '', ' 0001:00001000       Unit1.Foo', ' 0001:00001040       Unit1.Bar', '',
    'Line numbers for Unit1(Unit1.pas) segment .text', '', '    10 0001:00001000    11 0001:00001004    12 0001:0000100C', '    20 0001:00001040    21 0001:00001044', '',
].join('\r\n');

const at = (rva: number): number => BASE + rva;

test('the map file gives the segments, the routines and the lines; an address is a segment and an offset, made real by the sections of the executable', () => {
    const map = parseMap(MAP);
    assert.deepEqual(map.segments.map(s => [s.index, s.start, s.name]), [[1, 0x1000, '.text']]);
    assert.deepEqual(map.publics.map(p => p.name), ['Unit1.Foo', 'Unit1.Bar'], 'by value');
    assert.equal(map.units[0].unit, 'Unit1');
    assert.equal(map.units[0].file, 'Unit1.pas');
    assert.equal(map.units[0].lines.length, 5);
    const pe = readPe(fakeExe())!;
    assert.deepEqual([pe.is64, pe.imageBase, pe.sections[0].virtualAddress], [false, BASE, 0x1000]);
    assert.equal(readPe(Buffer.from('not an executable')), undefined);
    const t = new SymbolTable(map, pe);
    t.loadBase = BASE;
    assert.deepEqual(t.place('C:/proj/UNIT1.PAS', 11), { line: 11, address: at(0x1004), file: 'Unit1.pas' }, 'the folder and the case of the name do not matter');
    assert.equal(t.place('C:/proj/Unit1.pas', 13)?.line, 20, 'a line without code goes to the next one that has some');
    assert.equal(t.place('C:/proj/Unit1.pas', 99), undefined);
    assert.equal(t.place('C:/proj/Other.pas', 1), undefined);
    assert.equal(t.lineAt(at(0x1006))?.line, 11, 'the line an address is in');
    assert.equal(t.lineAt(at(0x1044))?.line, 21);
    assert.ok(t.isLineStart(at(0x1004)) && !t.isLineStart(at(0x1006)));
    assert.deepEqual(t.routineAt(at(0x1044)), { name: 'Unit1.Bar', address: at(0x1040) });
    t.loadBase = 0x7000000;
    assert.equal(t.place('Unit1.pas', 12)?.address, 0x7000000 + 0x100c, 'the program was loaded elsewhere');
});

test('a map file with an older layout (the offsets include the image base) and a .itext segment gives the same addresses', () => {
    const old = MAP.replace('0001:00001000 00000100H', '0001:00401000 00000100H').replace(/0001:0000(\d{4})/g, (_m, d: string) => '0001:0040' + d);
    const t = new SymbolTable(parseMap(old), readPe(fakeExe())!);
    t.loadBase = BASE;
    assert.equal(t.place('Unit1.pas', 11)?.address, at(0x1004));
});

// ---------------------------------------------------------------- a fake engine that follows a script of states
interface State { rva: number; sp: number; bp: number }

class FakeEngine implements DebugEngine {
    handlers: ((e: EngineEvent) => void)[] = [];
    breakpoints = new Set<number>();
    index = 0;
    memory = new Map<number, number>();
    log: string[] = [];
    launched?: LaunchOptions;
    breakOnAv = false;
    constructor(public states: State[], public base = BASE) {}
    onEvent(h: (e: EngineEvent) => void): void { this.handlers.push(h); }
    emit(e: EngineEvent): void { for (const h of this.handlers) { h(e); } }
    async start(): Promise<void> { this.log.push('start'); }
    async launch(o: LaunchOptions): Promise<CreatedEvent> { this.launched = o; return { ev: 'created', pid: 1, base: '0x' + this.base.toString(16), wow64: true, pointer: 4 }; }
    async setBreakpoint(a: number): Promise<void> { this.breakpoints.add(a); this.log.push('set ' + a.toString(16)); }
    async clearBreakpoint(a: number): Promise<void> { this.breakpoints.delete(a); this.log.push('clear ' + a.toString(16)); }
    private pc(i = this.index): number { return this.base + this.states[i].rva; }
    private stop(reason: 'breakpoint' | 'step'): void { this.emit({ ev: 'stopped', reason, tid: 7, address: '0x' + this.pc().toString(16) }); }
    async resume(): Promise<void> {
        this.log.push('resume');
        queueMicrotask(() => {
            for (let i = this.index + 1; i < this.states.length; i++) {
                if (this.breakpoints.has(this.pc(i))) { this.index = i; this.stop('breakpoint'); return; }
            }
            this.index = this.states.length - 1;
            this.emit({ ev: 'exited', code: 0 });
        });
    }
    async step(): Promise<void> { queueMicrotask(() => { this.index++; this.stop('step'); }); }
    async pause(): Promise<void> { queueMicrotask(() => this.emit({ ev: 'stopped', reason: 'pause', tid: 7, address: '0x' + this.pc().toString(16) })); }
    async registers(): Promise<Record<string, string>> {
        const s = this.states[this.index];
        return { eip: '0x' + this.pc().toString(16), esp: '0x' + s.sp.toString(16), ebp: '0x' + s.bp.toString(16), eax: '0x0' };
    }
    async read(address: number, length: number): Promise<Buffer> {
        const b = Buffer.alloc(length);
        b.writeUInt32LE(this.memory.get(address) ?? 0, 0);
        return b;
    }
    async threads(): Promise<number[]> { return [7]; }
    async setBreakOnAccessViolation(on: boolean): Promise<void> { this.breakOnAv = on; }
    async kill(): Promise<void> { this.log.push('kill'); }
    dispose(): void { /* nothing */ }
}

/**
 * Foo (line 10 at 1000, line 11 at 1004 which calls Bar, line 12 at 100C) and Bar (line 20 at 1040, line 21 at 1044), as the program runs them.
 * The call at 1004 is 5 bytes long: it returns to 1009, in the middle of line 11.
 */
function scenario(): FakeEngine {
    const e = new FakeEngine([
        { rva: 0x1000, sp: 0x500100, bp: 0x500200 },   // 0: Foo, its first instruction
        { rva: 0x1001, sp: 0x5000fc, bp: 0x500200 },   // 1: after push ebp
        { rva: 0x1003, sp: 0x5000fc, bp: 0x5000fc },   // 2: after mov ebp, esp
        { rva: 0x1004, sp: 0x5000fc, bp: 0x5000fc },   // 3: line 11, the call
        { rva: 0x1040, sp: 0x5000f8, bp: 0x5000fc },   // 4: Bar, its first instruction (the return address is on the stack)
        { rva: 0x1041, sp: 0x5000f4, bp: 0x5000fc },   // 5
        { rva: 0x1043, sp: 0x5000f4, bp: 0x5000f4 },   // 6
        { rva: 0x1044, sp: 0x5000f4, bp: 0x5000f4 },   // 7: line 21
        { rva: 0x1009, sp: 0x5000fc, bp: 0x5000fc },   // 8: back in Foo, in the middle of line 11
        { rva: 0x100c, sp: 0x5000fc, bp: 0x5000fc },   // 9: line 12
    ]);
    e.memory.set(0x5000f8, at(0x1009));      // the return address of the call
    e.memory.set(0x5000f8 + 4, 0);
    e.memory.set(0x5000f4 + 4, at(0x1009));  // Bar's frame: [bp + 4] is the return address, [bp] the caller's bp
    e.memory.set(0x5000f4, 0x5000fc);
    e.memory.set(0x5000fc + 4, 0);           // Foo's frame returns to nobody
    e.memory.set(0x5000fc, 0);
    return e;
}

function session(engine: FakeEngine, files: Record<string, Buffer> = { 'C:\\p\\App.exe': fakeExe(), 'C:\\p\\App.map': Buffer.from(MAP, 'latin1') }) {
    const out: DapMessage[] = [];
    const s = new DelphiDebugSession({
        engine, send: m => out.push(m), resolveSource: f => 'C:\\p\\' + f, readFile: f => files[f],
    });
    let seq = 1;
    const call = async (command: string, args: unknown = {}): Promise<DapMessage> => {
        const r: DapMessage = { seq: seq++, type: 'request', command, arguments: args };
        const before = out.length;
        await s.handle(r);
        return out.slice(before).find(m => m.type === 'response' && m.request_seq === r.seq)!;
    };
    const events = (name: string): DapMessage[] => out.filter(m => m.type === 'event' && m.event === name);
    /** Waits until the session has said one more of an event. */
    const until = async (name: string, count: number): Promise<void> => { for (let i = 0; i < 100 && events(name).length < count; i++) { await new Promise(r => setImmediate(r)); } };
    return { s, out, call, events, until };
}

test('launching: the map file and the executable are read, the program is started held, and the editor is told it may set its breakpoints', async () => {
    const e = scenario();
    const { call, events, out } = session(e);
    const init = await call('initialize');
    assert.ok(init.body.supportsConfigurationDoneRequest && init.body.exceptionBreakpointFilters[0].filter === 'av');
    const r = await call('launch', { program: 'C:\\p\\App.exe', args: ['a', 'b c'], breakOnAccessViolation: true });
    assert.ok(r.success);
    assert.equal(e.launched!.args, 'a "b c"');
    assert.equal(e.launched!.cwd, 'C:\\p');
    assert.equal(events('initialized').length, 1);
    assert.ok(out.findIndex(m => m.type === 'response' && m.command === 'launch') < out.findIndex(m => m.event === 'initialized'), 'the answer first');

    const no = session(scenario());
    assert.match((await no.call('launch', {})).message!, /No program/);
    assert.match((await no.call('launch', { program: 'C:\\p\\Missing.exe' })).message!, /not a Windows executable/);
    const nomap = session(scenario(), { 'C:\\p\\App.exe': fakeExe() });
    assert.match((await nomap.call('launch', { program: 'C:\\p\\App.exe' })).message!, /No map file at C:\\p\\App\.map[\s\S]*Detailed/);
    const bare = session(scenario(), { 'C:\\p\\App.exe': fakeExe(), 'C:\\p\\App.map': Buffer.from(' Start Length Name Class\r\n 0001:00001000 00000100H .text CODE\r\n') });
    assert.match((await bare.call('launch', { program: 'C:\\p\\App.exe' })).message!, /no line numbers/);
});

test('breakpoints: a line becomes an address, one without code moves to the next, a file the map does not know is not verified, and setting them again replaces them', async () => {
    const e = scenario();
    const { call } = session(e);
    await call('launch', { program: 'C:\\p\\App.exe' });
    const r = await call('setBreakpoints', { source: { path: 'C:\\p\\Unit1.pas' }, breakpoints: [{ line: 11 }, { line: 13 }, { line: 99 }] });
    assert.deepEqual(r.body.breakpoints.map((b: { verified: boolean; line: number }) => [b.verified, b.line]), [[true, 11], [true, 20], [false, 99]]);
    assert.deepEqual([...e.breakpoints].sort(), [at(0x1004), at(0x1040)]);
    await call('setBreakpoints', { source: { path: 'C:\\p\\Unit1.pas' }, breakpoints: [{ line: 21 }] });
    assert.deepEqual([...e.breakpoints], [at(0x1044)], 'the old ones are out');
    const other = await call('setBreakpoints', { source: { path: 'C:\\p\\Other.pas' }, breakpoints: [{ line: 1 }] });
    assert.equal(other.body.breakpoints[0].verified, false);
    assert.match(other.body.breakpoints[0].message, /map file has no code for this file/);
    assert.deepEqual([...e.breakpoints], [at(0x1044)], 'another file does not touch them');
});

test('running to a breakpoint: stopped on it, the stack names the routine and the line, the registers are a scope, then the program ends', async () => {
    const e = scenario();
    const { call, events, until } = session(e);
    await call('launch', { program: 'C:\\p\\App.exe' });
    await call('setBreakpoints', { source: { path: 'C:\\p\\Unit1.pas' }, breakpoints: [{ line: 21 }] });
    await call('configurationDone');
    await until('stopped', 1);
    const stop = events('stopped')[0].body;
    assert.deepEqual([stop.reason, stop.threadId, stop.allThreadsStopped], ['breakpoint', 7, true]);
    const st = await call('stackTrace', { threadId: 7 });
    assert.deepEqual(st.body.stackFrames.map((f: { name: string; line: number }) => [f.name, f.line]), [['Unit1.Bar', 21], ['Unit1.Foo', 11]], 'the caller is on the line of its call, not of its return');
    assert.equal(st.body.stackFrames[0].source.path, 'C:\\p\\Unit1.pas');
    const sc = await call('scopes', { frameId: 0 });
    assert.equal(sc.body.scopes[0].name, 'Registers');
    const vars = await call('variables', { variablesReference: 1 });
    assert.deepEqual(vars.body.variables.map((v: { name: string }) => v.name), ['eip', 'esp', 'ebp', 'eax']);
    assert.equal((await call('threads')).body.threads[0].id, 7);
    await call('continue');
    await until('terminated', 1);
    assert.equal(events('exited')[0].body.exitCode, 0);
});

/** Starts the session stopped at a breakpoint on a line of the scenario. */
async function stoppedAt(line: number) {
    const e = scenario();
    const s = session(e);
    await s.call('launch', { program: 'C:\\p\\App.exe' });
    await s.call('setBreakpoints', { source: { path: 'C:\\p\\Unit1.pas' }, breakpoints: [{ line }] });
    await s.call('configurationDone');
    await s.until('stopped', 1);
    return { e, ...s };
}

test('step over runs a call through, to the next line of the same routine', async () => {
    const { e, call, events, until } = await stoppedAt(11);
    assert.equal(e.index, 3);
    await call('next');
    await until('stopped', 2);
    assert.equal(events('stopped')[1].body.reason, 'step');
    assert.equal(e.index, 9, 'through Bar, back, and on to line 12');
    const st = await call('stackTrace', { threadId: 7 });
    assert.equal(st.body.stackFrames[0].line, 12);
    assert.ok(e.log.some(l => l.startsWith('set ' + at(0x1009).toString(16))), 'by a breakpoint of its own where the call returns');
    assert.ok(!e.breakpoints.has(at(0x1009)), 'taken out again');
});

test('step into stops on the first line of the routine called, step out runs to where it returns', async () => {
    const { e, call, events, until } = await stoppedAt(11);
    await call('stepIn');
    await until('stopped', 2);
    assert.equal(e.index, 4, 'in Bar');
    const st = await call('stackTrace', { threadId: 7 });
    assert.equal(st.body.stackFrames[0].name, 'Unit1.Bar');
    assert.equal(st.body.stackFrames[0].line, 20);
    await call('stepOut');
    await until('stopped', 3);
    assert.equal(e.index, 8, 'back in Foo');
    assert.equal(events('stopped')[2].body.reason, 'step');
    assert.ok(!e.breakpoints.has(at(0x1009)));
});

test('stepping stops on a breakpoint met on the way, and when the program ends', async () => {
    const e = scenario();
    const { call, events, until } = session(e);
    await call('launch', { program: 'C:\\p\\App.exe' });
    await call('setBreakpoints', { source: { path: 'C:\\p\\Unit1.pas' }, breakpoints: [{ line: 11 }, { line: 21 }] });
    await call('configurationDone');
    await until('stopped', 1);
    await call('next');
    await until('stopped', 2);
    assert.equal(events('stopped')[1].body.reason, 'breakpoint', 'the breakpoint in Bar, met while stepping over the call');
    assert.equal(e.index, 7);
    assert.ok(!e.breakpoints.has(at(0x1009)), 'the breakpoint of the step is out');
    await call('continue');
    await until('terminated', 1);
});

test('an exception stops the program with what it was; pause and disconnect work; what the program writes is shown', async () => {
    const e = scenario();
    const { call, events, until, out } = session(e);
    await call('launch', { program: 'C:\\p\\App.exe' });
    await call('setExceptionBreakpoints', { filters: ['av'] });
    assert.equal(e.breakOnAv, true);
    e.emit({ ev: 'output', text: 'hello' });
    assert.equal(events('output')[0].body.output, 'hello\n');
    e.emit({ ev: 'stopped', reason: 'exception', tid: 7, address: '0x401004', code: '0xC0000005' });
    assert.deepEqual([events('stopped')[0].body.reason, events('stopped')[0].body.text], ['exception', 'Access violation']);
    await call('pause');
    await until('stopped', 2);
    assert.equal(events('stopped')[1].body.reason, 'pause');
    assert.equal((await call('evaluate', { expression: 'x' })).success, false);
    await call('disconnect');
    assert.ok(e.log.includes('kill'));
    assert.equal(events('terminated').length, 1);
    assert.equal(out.filter(m => m.type === 'response' && !m.success).length, 1, 'only the expression was refused');
});
