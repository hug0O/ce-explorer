/**
 * The debug engine as the debugger session sees it: a program that can be started under the debugger, stopped on addresses, run, stepped one
 * instruction at a time, paused, and looked into (registers, memory). `NativeEngine` is the real one, a Windows debug engine written in C# and
 * compiled by PowerShell the first time (media/debug); a test gives the session a fake one.
 */
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as readline from 'readline';

export interface CreatedEvent { ev: 'created'; pid: number; base: string; wow64: boolean; pointer: number }
export interface StoppedEvent { ev: 'stopped'; reason: 'breakpoint' | 'breakpoint-instruction' | 'step' | 'pause' | 'exception'; tid: number; address: string; code?: string }
export interface ExitedEvent { ev: 'exited'; code: number }
export interface OutputEvent { ev: 'output'; text: string }
export interface ThreadEvent { ev: 'thread'; tid: number; started: boolean }
export interface FatalEvent { ev: 'fatal'; message: string }
export type EngineEvent = CreatedEvent | StoppedEvent | ExitedEvent | OutputEvent | ThreadEvent | FatalEvent;

export interface LaunchOptions { exe: string; args?: string; cwd?: string; breakOnAccessViolation?: boolean }

export interface DebugEngine {
    /** Starts the engine itself (the first time it is compiled, a second or two). */
    start(): Promise<void>;
    /** Starts the program under the debugger and holds it before its first line: the breakpoints are set, then `resume`. */
    launch(options: LaunchOptions): Promise<CreatedEvent>;
    setBreakpoint(address: number): Promise<void>;
    clearBreakpoint(address: number): Promise<void>;
    /** Lets the program run from where it is stopped; stepping over the breakpoint it stands on. */
    resume(): Promise<void>;
    /** One instruction. The program stops again with a `step` event. */
    step(): Promise<void>;
    pause(): Promise<void>;
    /** The registers of the stopped thread, as hexadecimal strings. */
    registers(): Promise<Record<string, string>>;
    /** Memory of the program: the breakpoints it holds read as the instructions they replaced. */
    read(address: number, length: number): Promise<Buffer>;
    threads(): Promise<number[]>;
    setBreakOnAccessViolation(on: boolean): Promise<void>;
    kill(): Promise<void>;
    onEvent(handler: (event: EngineEvent) => void): void;
    dispose(): void;
}

interface Pending { resolve: (answer: Record<string, unknown>) => void; reject: (error: Error) => void }

/** The Windows debug engine of the extension: `engine.ps1` compiles and runs `CeDebugEngine.cs`, and they talk JSON, one object a line. */
export class NativeEngine implements DebugEngine {
    private child: ChildProcessWithoutNullStreams | undefined;
    private nextId = 1;
    private readonly pending = new Map<number, Pending>();
    private readonly handlers: ((event: EngineEvent) => void)[] = [];
    private readyResolve: (() => void) | undefined;
    private readyReject: ((error: Error) => void) | undefined;
    private createdWaiter: { resolve: (e: CreatedEvent) => void; reject: (e: Error) => void } | undefined;

    /** `script` and `source` are the paths of engine.ps1 and CeDebugEngine.cs. */
    constructor(private readonly script: string, private readonly source: string) {}

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.readyResolve = resolve;
            this.readyReject = reject;
            const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', this.script, '-Source', this.source], { windowsHide: true });
            this.child = child;
            readline.createInterface({ input: child.stdout }).on('line', line => this.onLine(line));
            child.stderr.on('data', () => { /* PowerShell's own messages: the engine reports what matters on its output */ });
            child.on('error', e => { this.readyReject?.(e); this.failAll(e); });
            child.on('exit', () => { this.readyReject?.(new Error('the debug engine stopped')); this.failAll(new Error('the debug engine stopped')); });
        });
    }

    private onLine(line: string): void {
        let m: Record<string, unknown>;
        try { m = JSON.parse(line) as Record<string, unknown>; } catch { return; }
        if (typeof m.id === 'number') {
            const p = this.pending.get(m.id);
            if (p) { this.pending.delete(m.id); if (m.ok === false) { p.reject(new Error(String(m.error ?? 'the debug engine refused'))); } else { p.resolve(m); } }
            return;
        }
        if (m.ev === 'ready') { this.readyResolve?.(); this.readyResolve = undefined; this.readyReject = undefined; return; }
        if (m.ev === 'fatal') { const e = new Error(String(m.message)); this.readyReject?.(e); this.createdWaiter?.reject(e); }
        if (m.ev === 'created') { this.createdWaiter?.resolve(m as unknown as CreatedEvent); this.createdWaiter = undefined; }
        for (const h of this.handlers) { h(m as unknown as EngineEvent); }
    }

    private failAll(e: Error): void {
        for (const p of this.pending.values()) { p.reject(e); }
        this.pending.clear();
        this.createdWaiter?.reject(e);
    }

    private send(cmd: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
        return new Promise((resolve, reject) => {
            if (!this.child) { reject(new Error('the debug engine is not started')); return; }
            const id = this.nextId++;
            this.pending.set(id, { resolve, reject });
            this.child.stdin.write(JSON.stringify({ id, cmd, ...args }) + '\n');
        });
    }

    async launch(options: LaunchOptions): Promise<CreatedEvent> {
        const created = new Promise<CreatedEvent>((resolve, reject) => { this.createdWaiter = { resolve, reject }; });
        await this.send('launch', { exe: options.exe, args: options.args ?? '', cwd: options.cwd ?? '', breakOnAccessViolation: !!options.breakOnAccessViolation });
        return created;
    }

    async setBreakpoint(address: number): Promise<void> { await this.send('setBp', { addr: '0x' + address.toString(16) }); }
    async clearBreakpoint(address: number): Promise<void> { await this.send('clearBp', { addr: '0x' + address.toString(16) }); }
    async resume(): Promise<void> { await this.send('continue'); }
    async step(): Promise<void> { await this.send('step'); }
    async pause(): Promise<void> { await this.send('pause'); }
    async registers(): Promise<Record<string, string>> { return (await this.send('regs')).regs as Record<string, string>; }
    async read(address: number, length: number): Promise<Buffer> { return Buffer.from(String((await this.send('read', { addr: '0x' + address.toString(16), len: length })).data), 'hex'); }
    async threads(): Promise<number[]> { return (await this.send('threads')).threads as number[]; }
    async setBreakOnAccessViolation(on: boolean): Promise<void> { await this.send('option', { breakOnAccessViolation: on }); }
    async kill(): Promise<void> { try { await this.send('kill'); } catch { /* already gone */ } }
    onEvent(handler: (event: EngineEvent) => void): void { this.handlers.push(handler); }

    dispose(): void {
        try { this.child?.stdin.write(JSON.stringify({ cmd: 'quit' }) + '\n'); } catch { /* closed */ }
        setTimeout(() => this.child?.kill(), 500);
    }
}
