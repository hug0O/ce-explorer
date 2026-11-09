/**
 * The Delphi debugger as the Debug Adapter Protocol sees it: it answers the requests of VS Code (breakpoints, run, step, stack, registers),
 * with a debug engine under it that knows the machine and a map file that knows the source. The lines of the code are turned into addresses
 * by the map file; a step is one instruction at a time until another line starts.
 *
 * It has no VS Code in it, so it is tested with a fake engine: the messages go out through `send`, the requests come in by `handle`.
 */
import * as fs from 'fs';
import * as path from 'path';
import { DebugEngine, EngineEvent, StoppedEvent } from './engine';
import { SymbolTable, baseName, parseMap } from './mapFile';
import { readPe } from './pe';

/** A request, a response or an event of the protocol: only what the session reads or writes. */
export interface DapMessage { seq?: number; type: string; command?: string; request_seq?: number; success?: boolean; message?: string; event?: string; arguments?: any; body?: any }

export interface SessionDeps {
    engine: DebugEngine;
    send(message: DapMessage): void;
    /** The path of a source file, from the name the map file writes for it. */
    resolveSource(file: string): string | undefined | Promise<string | undefined>;
    /** The bytes of a file (the program, its map). */
    readFile?(file: string): Buffer | undefined;
}

type Outcome = { kind: 'stop'; stop: StoppedEvent } | { kind: 'exit'; code: number };

const EXCEPTIONS: Record<string, string> = {
    '0xC0000005': 'Access violation', '0xC0000094': 'Integer division by zero', '0xC00000FD': 'Stack overflow', '0xC0000096': 'Privileged instruction',
    '0xC000001D': 'Illegal instruction', '0xC0000025': 'Non-continuable exception', '0xE06D7363': 'C++ exception', '0x0EEDFADE': 'Delphi exception', '0x0EEDFAE0': 'Delphi exception',
};

const MAX_FRAMES = 64;
const MAX_STEPS = 20000;

export class DelphiDebugSession {
    private seq = 1;
    private symbols: SymbolTable | undefined;
    private pointer = 4;
    private readonly installed = new Map<number, { file: string; line: number }>();
    private readonly waiters: ((o: Outcome) => void)[] = [];
    private running = false;
    private ended = false;
    private stoppedTid = 0;
    private frames: { pc: number; sp: number }[] = [];

    constructor(private readonly deps: SessionDeps) {
        deps.engine.onEvent(e => this.onEngineEvent(e));
    }

    // ------------------------------------------------------------------ out
    private respond(request: DapMessage, body: unknown = {}): void {
        this.deps.send({ seq: this.seq++, type: 'response', request_seq: request.seq, success: true, command: request.command, body });
    }

    private fail(request: DapMessage, message: string): void {
        this.deps.send({ seq: this.seq++, type: 'response', request_seq: request.seq, success: false, command: request.command, message });
    }

    private event(event: string, body: unknown = {}): void {
        this.deps.send({ seq: this.seq++, type: 'event', event, body });
    }

    // ------------------------------------------------------------------ the engine
    private onEngineEvent(e: EngineEvent): void {
        if (e.ev === 'output') { this.event('output', { category: 'console', output: e.text.endsWith('\n') ? e.text : e.text + '\n' }); return; }
        if (e.ev === 'thread') { this.event('thread', { reason: e.started ? 'started' : 'exited', threadId: e.tid }); return; }
        if (e.ev === 'fatal') { this.event('output', { category: 'stderr', output: 'The debug engine failed: ' + e.message + '\n' }); return; }
        if (e.ev === 'created') { return; }
        if (e.ev === 'stopped') { this.stoppedTid = e.tid; }
        const outcome: Outcome = e.ev === 'stopped' ? { kind: 'stop', stop: e } : { kind: 'exit', code: e.code };
        const waiter = this.waiters.shift();
        if (waiter) { waiter(outcome); return; }
        this.announce(outcome);
    }

    /** What the program did, to the editor: stopped here, or finished. */
    private announce(o: Outcome): void {
        this.running = false;
        if (o.kind === 'exit') {
            if (!this.ended) { this.ended = true; this.event('exited', { exitCode: o.code }); this.event('terminated'); }
            return;
        }
        const code = o.stop.code ?? '';
        const reason = o.stop.reason === 'step' ? 'step' : o.stop.reason === 'pause' ? 'pause' : o.stop.reason === 'exception' ? 'exception' : 'breakpoint';
        this.event('stopped', {
            reason, threadId: o.stop.tid, allThreadsStopped: true,
            text: o.stop.reason === 'exception' ? (EXCEPTIONS[code.toUpperCase().replace('0X', '0x')] ?? 'Exception ' + code) : undefined,
            description: o.stop.reason === 'exception' ? 'The program raised ' + (EXCEPTIONS[code.toUpperCase().replace('0X', '0x')] ?? code) : undefined,
        });
    }

    private nextOutcome(): Promise<Outcome> {
        return new Promise(resolve => { this.waiters.push(resolve); });
    }

    // ------------------------------------------------------------------ the requests
    async handle(request: DapMessage): Promise<void> {
        try {
            switch (request.command) {
                case 'initialize': return this.initialize(request);
                case 'launch': return await this.launch(request);
                case 'setBreakpoints': return await this.setBreakpoints(request);
                case 'setExceptionBreakpoints': {
                    await this.deps.engine.setBreakOnAccessViolation(((request.arguments?.filters as string[] | undefined) ?? []).includes('av'));
                    return this.respond(request, {});
                }
                case 'configurationDone': this.running = true; await this.deps.engine.resume(); return this.respond(request);
                case 'threads': return this.respond(request, { threads: (await this.deps.engine.threads()).map(id => ({ id, name: 'Thread ' + id })) });
                case 'stackTrace': return await this.stackTrace(request);
                case 'scopes': return this.respond(request, { scopes: request.arguments?.frameId === 0 ? [{ name: 'Registers', variablesReference: 1, expensive: false }] : [] });
                case 'variables': return await this.variables(request);
                case 'continue': this.running = true; await this.deps.engine.resume(); return this.respond(request, { allThreadsContinued: true });
                case 'next': this.respond(request); return void this.step(false);
                case 'stepIn': this.respond(request); return void this.step(true);
                case 'stepOut': this.respond(request); return void this.stepOut();
                case 'pause': await this.deps.engine.pause(); return this.respond(request);
                case 'evaluate': return this.fail(request, 'Evaluating an expression is not supported yet: the registers are in the Variables view.');
                case 'source': return this.fail(request, 'The source is the file on disk.');
                case 'disconnect': case 'terminate': await this.deps.engine.kill(); this.respond(request); if (!this.ended) { this.ended = true; this.event('terminated'); } return;
                default: return this.fail(request, 'Not supported: ' + request.command);
            }
        } catch (e) {
            this.fail(request, e instanceof Error ? e.message : String(e));
        }
    }

    private initialize(request: DapMessage): void {
        this.respond(request, {
            supportsConfigurationDoneRequest: true,
            supportsTerminateRequest: true,
            supportsEvaluateForHovers: false,
            exceptionBreakpointFilters: [{ filter: 'av', label: 'Access violations (before the program handles them)', default: false }],
        });
    }

    private async launch(request: DapMessage): Promise<void> {
        const a = request.arguments ?? {};
        const program = String(a.program ?? '');
        if (!program) { return this.fail(request, 'No program: set "program" to the executable the project builds.'); }
        const read = this.deps.readFile ?? ((f: string) => { try { return fs.readFileSync(f); } catch { return undefined; } });
        const exeBytes = read(program);
        const pe = exeBytes ? readPe(exeBytes) : undefined;
        if (!pe) { return this.fail(request, `${program} is not a Windows executable that can be read: build the project first.`); }
        const mapPath = String(a.mapFile ?? program.replace(/\.[^.\\/]+$/, '') + '.map');
        const mapBytes = read(mapPath);
        if (!mapBytes) { return this.fail(request, `No map file at ${mapPath}. In Delphi: Project > Options > Building > Delphi Compiler > Linking > Map file: Detailed, then build.`); }
        const table = new SymbolTable(parseMap(mapBytes.toString('latin1')), pe);
        if (!table.files().length) { return this.fail(request, `${mapPath} has no line numbers: choose the map file "Detailed", not "Segments" or "Publics".`); }
        this.symbols = table;
        await this.deps.engine.start();
        const args = Array.isArray(a.args) ? (a.args as string[]).map(x => (/\s/.test(x) ? `"${x}"` : x)).join(' ') : String(a.args ?? '');
        const created = await this.deps.engine.launch({ exe: program, args, cwd: String(a.cwd ?? path.dirname(program)), breakOnAccessViolation: !!a.breakOnAccessViolation });
        table.loadBase = Number(BigInt(created.base));
        this.pointer = created.pointer;
        this.respond(request);
        // the program is held before its first line: the editor may set its breakpoints
        this.event('initialized');
    }

    private async setBreakpoints(request: DapMessage): Promise<void> {
        const table = this.symbols;
        const file = String(request.arguments?.source?.path ?? request.arguments?.source?.name ?? '');
        const wanted: number[] = ((request.arguments?.breakpoints as { line: number }[] | undefined) ?? []).map(b => b.line);
        if (!table) { return this.respond(request, { breakpoints: wanted.map(line => ({ verified: false, line, message: 'The program is not started.' })) }); }
        // what this file had is taken out, then what it has now is put in
        for (const [address, at] of [...this.installed]) {
            if (baseName(at.file) === baseName(file)) { await this.deps.engine.clearBreakpoint(address); this.installed.delete(address); }
        }
        const answers: { verified: boolean; line: number; message?: string }[] = [];
        for (const line of wanted) {
            const placed = table.place(file, line);
            if (!placed) {
                answers.push({ verified: false, line, message: table.hasFile(file) ? 'There is no code on or after this line.' : 'The map file has no code for this file: is it part of the program?' });
                continue;
            }
            if (!this.installed.has(placed.address)) {
                await this.deps.engine.setBreakpoint(placed.address);
                this.installed.set(placed.address, { file, line: placed.line });
            }
            answers.push({ verified: true, line: placed.line });
        }
        this.respond(request, { breakpoints: answers });
    }

    // ------------------------------------------------------------------ stack and registers
    private async readPointer(address: number): Promise<number> {
        const buf = await this.deps.engine.read(address, this.pointer);
        return buf.length < this.pointer ? 0 : this.pointer === 8 ? Number(buf.readBigUInt64LE(0)) : buf.readUInt32LE(0);
    }

    private static num(hex: string | undefined): number { return hex ? Number(BigInt(hex)) : 0; }

    /** The frames of the stopped thread, by the chain of frame pointers; the first instructions of a routine, before its frame exists, are taken apart. */
    private async walk(): Promise<{ pc: number; sp: number }[]> {
        const table = this.symbols!;
        const regs = await this.deps.engine.registers();
        let pc = DelphiDebugSession.num(regs.rip ?? regs.eip);
        let sp = DelphiDebugSession.num(regs.rsp ?? regs.esp);
        let bp = DelphiDebugSession.num(regs.rbp ?? regs.ebp);
        const frames = [{ pc, sp }];
        for (let i = 1; i < MAX_FRAMES; i++) {
            const routine = table.routineAt(pc);
            let ret: number;
            let nextBp: number;
            if (routine && pc === routine.address) { ret = await this.readPointer(sp); nextBp = bp; sp += this.pointer; }
            else if (routine && pc === routine.address + 1) { ret = await this.readPointer(sp + this.pointer); nextBp = await this.readPointer(sp); sp += 2 * this.pointer; }
            else {
                if (!bp) { break; }
                ret = await this.readPointer(bp + this.pointer);
                nextBp = await this.readPointer(bp);
                sp = bp + 2 * this.pointer;
            }
            if (!ret || (!table.routineAt(ret) && !table.lineAt(ret))) { break; }
            frames.push({ pc: ret, sp });
            if (nextBp <= bp && !(routine && pc <= routine.address + 1)) { break; }
            pc = ret;
            bp = nextBp;
        }
        return frames;
    }

    private async stackTrace(request: DapMessage): Promise<void> {
        const table = this.symbols;
        if (!table) { return this.respond(request, { stackFrames: [], totalFrames: 0 }); }
        this.frames = await this.walk();
        const stackFrames = await Promise.all(this.frames.map(async (f, id) => {
            // the line of a caller is the one of its call, which is just before the address it returns to
            const at = table.lineAt(id === 0 ? f.pc : f.pc - 1);
            const routine = table.routineAt(f.pc);
            const file = at ? await this.deps.resolveSource(at.file) : undefined;
            return {
                id,
                name: routine ? routine.name : '$' + f.pc.toString(16).toUpperCase(),
                line: at ? at.line : 0,
                column: 1,
                instructionPointerReference: '0x' + f.pc.toString(16),
                source: at ? { name: baseName(at.file), path: file ?? at.file } : undefined,
                presentationHint: at ? undefined : 'subtle',
            };
        }));
        this.respond(request, { stackFrames, totalFrames: stackFrames.length });
    }

    private async variables(request: DapMessage): Promise<void> {
        if (request.arguments?.variablesReference !== 1) { return this.respond(request, { variables: [] }); }
        const regs = await this.deps.engine.registers();
        this.respond(request, { variables: Object.entries(regs).map(([name, value]) => ({ name, value, variablesReference: 0 })) });
    }

    // ------------------------------------------------------------------ running and stepping
    /** One instruction, and where the program is after it. */
    private async singleStep(): Promise<Outcome> {
        const outcome = this.nextOutcome();
        await this.deps.engine.step();
        return outcome;
    }

    /** Runs to an address (the return of a call): a breakpoint of ours, taken out when it has been reached. */
    private async runTo(address: number): Promise<Outcome> {
        const own = !this.installed.has(address);
        if (own) { await this.deps.engine.setBreakpoint(address); }
        const outcome = this.nextOutcome();
        await this.deps.engine.resume();
        const o = await outcome;
        if (own && o.kind === 'stop') { await this.deps.engine.clearBreakpoint(address); }
        return o;
    }

    private static reached(o: Outcome, address: number): boolean {
        return o.kind === 'stop' && o.stop.reason === 'breakpoint' && Number(BigInt(o.stop.address)) === address;
    }

    private async here(): Promise<{ pc: number; sp: number }> {
        const regs = await this.deps.engine.registers();
        return { pc: DelphiDebugSession.num(regs.rip ?? regs.eip), sp: DelphiDebugSession.num(regs.rsp ?? regs.esp) };
    }

    /**
     * Step over (`into` false) or into (`into` true): instructions until another line starts. A call is stepped over by running to where it
     * returns; into a routine of the program (one the map has lines for) it stops on the first line of the routine, into any other (the
     * library) it is stepped over as well.
     */
    private async step(into: boolean): Promise<void> {
        const table = this.symbols!;
        try {
            let at = await this.here();
            const start = table.lineAt(at.pc);
            for (let n = 0; n < MAX_STEPS; n++) {
                const before = at;
                const o = await this.singleStep();
                if (o.kind === 'exit' || o.stop.reason !== 'step') { return this.announce(o); }
                at = await this.here();
                if (at.sp === before.sp - this.pointer) {
                    const ret = await this.readPointer(at.sp);
                    if (ret > before.pc && ret <= before.pc + 16) {
                        // a call: into the routine, or over it
                        if (into && table.lineAt(at.pc)) { return this.announce(o); }
                        const done = await this.runTo(ret);
                        if (!DelphiDebugSession.reached(done, ret)) { return this.announce(done); }
                        at = await this.here();
                    }
                }
                const line = table.lineAt(at.pc);
                if (line && table.isLineStart(at.pc) && (!start || line.line !== start.line || line.unit !== start.unit)) {
                    return this.announce({ kind: 'stop', stop: { ev: 'stopped', reason: 'step', tid: this.stoppedTid, address: '0x' + at.pc.toString(16) } });
                }
            }
            this.announce({ kind: 'stop', stop: { ev: 'stopped', reason: 'step', tid: this.stoppedTid, address: '0x' + at.pc.toString(16) } });
        } catch (e) {
            this.event('output', { category: 'stderr', output: 'Stepping failed: ' + (e instanceof Error ? e.message : String(e)) + '\n' });
        }
    }

    /** Step out: runs to where the routine returns to, and stops there. */
    private async stepOut(): Promise<void> {
        try {
            const frames = await this.walk();
            if (frames.length < 2) { this.running = true; await this.deps.engine.resume(); return; }
            const target = frames[1].pc;
            const done = await this.runTo(target);
            if (DelphiDebugSession.reached(done, target)) { return this.announce({ kind: 'stop', stop: { ev: 'stopped', reason: 'step', tid: this.stoppedTid, address: '0x' + target.toString(16) } }); }
            this.announce(done);
        } catch (e) {
            this.event('output', { category: 'stderr', output: 'Stepping out failed: ' + (e instanceof Error ? e.message : String(e)) + '\n' });
        }
    }
}
