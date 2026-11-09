// The native half of the Delphi debugger of CE Code Explorer: a Windows debug engine, compiled by PowerShell (Add-Type) the first time it
// is used, so that nothing has to be installed. It starts a program under the Windows debug API, sets and removes breakpoints (int 3),
// runs, single-steps, pauses, reads the registers and the memory, and says what happens, one JSON object per line.
//
// Commands arrive on the standard input as one JSON object per line: {"id":1,"cmd":"launch","exe":"C:\\app.exe","args":"","cwd":"C:\\"}
// Answers and events leave on the standard output: {"id":1,"ok":true,...} and {"ev":"stopped","reason":"breakpoint",...}.
// The program being debugged gets a console of its own, so that what it writes cannot be mixed with the protocol.
//
// It works for 64-bit programs and for 32-bit ones (WOW64), which is what a Win32 Delphi program is.

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;

public static class CeDebugEngine
{
    // ------------------------------------------------------------------ the Windows API
    const uint DEBUG_ONLY_THIS_PROCESS = 0x2;
    const uint CREATE_NEW_CONSOLE = 0x10;
    const uint DBG_CONTINUE = 0x00010002;
    const uint DBG_EXCEPTION_NOT_HANDLED = 0x80010001;
    const uint PAGE_EXECUTE_READWRITE = 0x40;

    const uint EV_EXCEPTION = 1, EV_CREATE_THREAD = 2, EV_CREATE_PROCESS = 3, EV_EXIT_THREAD = 4, EV_EXIT_PROCESS = 5, EV_LOAD_DLL = 6, EV_UNLOAD_DLL = 7, EV_OUTPUT_STRING = 8, EV_RIP = 9;
    const uint X_BREAKPOINT = 0x80000003, X_SINGLE_STEP = 0x80000004, X_WX86_BREAKPOINT = 0x4000001F, X_WX86_SINGLE_STEP = 0x4000001E;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct STARTUPINFO
    {
        public int cb;
        public string lpReserved, lpDesktop, lpTitle;
        public int dwX, dwY, dwXSize, dwYSize, dwXCountChars, dwYCountChars, dwFillAttribute, dwFlags;
        public short wShowWindow, cbReserved2;
        public IntPtr lpReserved2, hStdInput, hStdOutput, hStdError;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct PROCESS_INFORMATION { public IntPtr hProcess, hThread; public int dwProcessId, dwThreadId; }

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool CreateProcess(string app, StringBuilder cmd, IntPtr pa, IntPtr ta, bool inherit, uint flags, IntPtr env, string cwd, ref STARTUPINFO si, out PROCESS_INFORMATION pi);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool WaitForDebugEvent(IntPtr ev, uint ms);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool ContinueDebugEvent(int pid, int tid, uint status);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool ReadProcessMemory(IntPtr h, IntPtr addr, byte[] buf, IntPtr size, out IntPtr read);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool WriteProcessMemory(IntPtr h, IntPtr addr, byte[] buf, IntPtr size, out IntPtr written);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool VirtualProtectEx(IntPtr h, IntPtr addr, IntPtr size, uint prot, out uint old);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool FlushInstructionCache(IntPtr h, IntPtr addr, IntPtr size);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool GetThreadContext(IntPtr t, IntPtr ctx);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool SetThreadContext(IntPtr t, IntPtr ctx);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool Wow64GetThreadContext(IntPtr t, IntPtr ctx);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool Wow64SetThreadContext(IntPtr t, IntPtr ctx);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool IsWow64Process(IntPtr h, out bool wow64);
    [DllImport("kernel32.dll", SetLastError = true)] static extern uint SuspendThread(IntPtr t);
    [DllImport("kernel32.dll", SetLastError = true)] static extern uint ResumeThread(IntPtr t);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool TerminateProcess(IntPtr h, uint code);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool CloseHandle(IntPtr h);

    // ------------------------------------------------------------------ what is known about the program
    static readonly JavaScriptSerializer Json = new JavaScriptSerializer();
    static readonly BlockingCollection<string> Input = new BlockingCollection<string>();
    static readonly object OutLock = new object();

    static IntPtr hProcess;
    static int processId;
    static bool launched, wow64;
    static long imageBase;
    static readonly Dictionary<int, IntPtr> Threads = new Dictionary<int, IntPtr>();
    static readonly Dictionary<long, byte> Breakpoints = new Dictionary<long, byte>();

    // the debug event that is waiting for its continue: while it is, the program is stopped
    static bool stopped;
    static int stopPid, stopTid;
    static uint stopStatus = DBG_CONTINUE;
    static bool userStep;
    static long reinsertAt = -1;
    static bool pausedByUs;
    static int loaderBreakpoints;       // the breakpoints the system raises at start: 1 for a 64-bit program, 2 for a 32-bit one
    static bool breakOnAccessViolation;

    static IntPtr ctxRaw, ctx;          // a CONTEXT (64-bit) aligned on 16 bytes
    static IntPtr ctx32;                // a WOW64_CONTEXT
    static IntPtr debugEvent;

    static void Emit(Dictionary<string, object> o)
    {
        lock (OutLock) { Console.Out.WriteLine(Json.Serialize(o)); Console.Out.Flush(); }
    }

    static Dictionary<string, object> Event(string name)
    {
        var o = new Dictionary<string, object>();
        o["ev"] = name;
        return o;
    }

    static string Hex(long v) { return "0x" + v.ToString("X", CultureInfo.InvariantCulture); }

    static long ParseAddress(object v)
    {
        if (v == null) { return 0; }
        string s = Convert.ToString(v, CultureInfo.InvariantCulture);
        if (s.StartsWith("0x", StringComparison.OrdinalIgnoreCase)) { return long.Parse(s.Substring(2), NumberStyles.HexNumber, CultureInfo.InvariantCulture); }
        return long.Parse(s, CultureInfo.InvariantCulture);
    }

    // ------------------------------------------------------------------ the loop
    public static void Run()
    {
        Console.OutputEncoding = new UTF8Encoding(false);
        ctxRaw = Marshal.AllocHGlobal(1232 + 16);
        ctx = new IntPtr((ctxRaw.ToInt64() + 15) & ~15L);
        ctx32 = Marshal.AllocHGlobal(716);
        debugEvent = Marshal.AllocHGlobal(1024);

        var reader = new Thread(() =>
        {
            string line;
            while ((line = Console.In.ReadLine()) != null) { Input.Add(line); }
            Input.Add("{\"cmd\":\"quit\"}");
        });
        reader.IsBackground = true;
        reader.Start();

        Emit(Event("ready"));
        string text;
        while (true)
        {
            if (stopped || !launched)
            {
                // nothing runs: wait for a command
                if (Input.TryTake(out text, 50)) { if (!Handle(text)) { return; } }
                continue;
            }
            while (Input.TryTake(out text)) { if (!Handle(text)) { return; } }
            if (!launched || stopped) { continue; }
            if (WaitForDebugEvent(debugEvent, 30)) { OnDebugEvent(); }
        }
    }

    static bool Handle(string text)
    {
        Dictionary<string, object> cmd;
        try { cmd = (Dictionary<string, object>)Json.DeserializeObject(text); }
        catch (Exception) { return true; }
        object id = cmd.ContainsKey("id") ? cmd["id"] : null;
        string name = cmd.ContainsKey("cmd") ? Convert.ToString(cmd["cmd"]) : "";
        var answer = new Dictionary<string, object>();
        if (id != null) { answer["id"] = id; }
        try
        {
            switch (name)
            {
                case "quit": Kill(); return false;
                case "launch": Launch(cmd); break;
                case "setBp": SetBreakpoint(ParseAddress(cmd["addr"])); break;
                case "clearBp": ClearBreakpoint(ParseAddress(cmd["addr"])); break;
                case "continue": Resume(false); break;
                case "step": Resume(true); break;
                case "pause": Pause(); break;
                case "kill": Kill(); break;
                case "regs": answer["regs"] = Registers(CurrentThread()); break;
                case "setReg": SetRegister(CurrentThread(), Convert.ToString(cmd["name"]), ParseAddress(cmd["value"])); break;
                case "read": answer["data"] = ReadHex(ParseAddress(cmd["addr"]), Convert.ToInt32(cmd["len"]), true); break;
                case "write": WriteHex(ParseAddress(cmd["addr"]), Convert.ToString(cmd["data"])); break;
                case "threads": answer["threads"] = new List<object>(ThreadIds()); break;
                case "option": if (cmd.ContainsKey("breakOnAccessViolation")) { breakOnAccessViolation = Convert.ToBoolean(cmd["breakOnAccessViolation"]); } break;
                case "ping": break;
                default: throw new InvalidOperationException("unknown command " + name);
            }
            answer["ok"] = true;
        }
        catch (Exception e)
        {
            answer["ok"] = false;
            answer["error"] = e.Message;
        }
        Emit(answer);
        return true;
    }

    // ------------------------------------------------------------------ launching and killing
    static void Launch(Dictionary<string, object> cmd)
    {
        if (launched) { throw new InvalidOperationException("a program is already running"); }
        string exe = Convert.ToString(cmd["exe"]);
        string args = cmd.ContainsKey("args") ? Convert.ToString(cmd["args"]) : "";
        string cwd = cmd.ContainsKey("cwd") && Convert.ToString(cmd["cwd"]).Length > 0 ? Convert.ToString(cmd["cwd"]) : null;
        breakOnAccessViolation = cmd.ContainsKey("breakOnAccessViolation") && Convert.ToBoolean(cmd["breakOnAccessViolation"]);
        var si = new STARTUPINFO();
        si.cb = Marshal.SizeOf(typeof(STARTUPINFO));
        PROCESS_INFORMATION pi;
        var line = new StringBuilder("\"" + exe + "\"" + (args.Length > 0 ? " " + args : ""));
        if (!CreateProcess(null, line, IntPtr.Zero, IntPtr.Zero, false, DEBUG_ONLY_THIS_PROCESS | CREATE_NEW_CONSOLE, IntPtr.Zero, cwd, ref si, out pi))
        {
            throw new InvalidOperationException("the program cannot be started (error " + Marshal.GetLastWin32Error() + ")");
        }
        hProcess = pi.hProcess;
        processId = pi.dwProcessId;
        Threads[pi.dwThreadId] = pi.hThread;
        launched = true;
        stopped = false;
        pausedByUs = false;
        reinsertAt = -1;
        loaderBreakpoints = 0;
        bool w;
        IsWow64Process(hProcess, out w);
        wow64 = w;
    }

    static void Kill()
    {
        if (!launched) { return; }
        TerminateProcess(hProcess, 1);
        // the exit event tells the rest: it is waited for a moment, so that the program really goes
        if (stopped) { ContinueDebugEvent(stopPid, stopTid, DBG_CONTINUE); stopped = false; }
        for (int i = 0; i < 40 && launched; i++)
        {
            if (WaitForDebugEvent(debugEvent, 50)) { OnDebugEvent(); }
        }
    }

    // ------------------------------------------------------------------ the debug events
    static int Int(int offset) { return Marshal.ReadInt32(debugEvent, offset); }
    static long Ptr(int offset) { return Marshal.ReadInt64(debugEvent, offset); }

    static void OnDebugEvent()
    {
        uint code = (uint)Int(0);
        int pid = Int(4), tid = Int(8);
        const int U = 16;           // the union of the event, after the three DWORDs and their padding
        switch (code)
        {
            case EV_CREATE_PROCESS:
                imageBase = Ptr(U + 24);
                {
                    long hFile = Ptr(U);
                    if (hFile != 0) { CloseHandle(new IntPtr(hFile)); }
                }
                {
                    var e = Event("created");
                    e["pid"] = processId; e["base"] = Hex(imageBase); e["wow64"] = wow64; e["pointer"] = wow64 ? 4 : 8;
                    Emit(e);
                }
                // the program is held here, before it runs a line, until the breakpoints are set and `continue` comes
                stopped = true; stopPid = pid; stopTid = tid; stopStatus = DBG_CONTINUE;
                break;
            case EV_CREATE_THREAD:
                Threads[tid] = new IntPtr(Ptr(U));
                {
                    var e = Event("thread"); e["tid"] = tid; e["started"] = true; Emit(e);
                }
                ContinueDebugEvent(pid, tid, DBG_CONTINUE);
                break;
            case EV_EXIT_THREAD:
                Threads.Remove(tid);
                {
                    var e = Event("thread"); e["tid"] = tid; e["started"] = false; Emit(e);
                }
                ContinueDebugEvent(pid, tid, DBG_CONTINUE);
                break;
            case EV_LOAD_DLL:
                {
                    long hFile = Ptr(U);
                    if (hFile != 0) { CloseHandle(new IntPtr(hFile)); }
                }
                ContinueDebugEvent(pid, tid, DBG_CONTINUE);
                break;
            case EV_OUTPUT_STRING:
                OnOutputString(U);
                ContinueDebugEvent(pid, tid, DBG_CONTINUE);
                break;
            case EV_EXIT_PROCESS:
                {
                    var e = Event("exited"); e["code"] = Int(U); Emit(e);
                }
                ContinueDebugEvent(pid, tid, DBG_CONTINUE);
                Cleanup();
                break;
            case EV_EXCEPTION:
                OnException(pid, tid, U);
                break;
            default:
                ContinueDebugEvent(pid, tid, DBG_CONTINUE);
                break;
        }
    }

    static void OnOutputString(int u)
    {
        try
        {
            long data = Ptr(u);
            bool unicode = Marshal.ReadInt16(debugEvent, u + 8) != 0;
            int length = Marshal.ReadInt16(debugEvent, u + 10);
            if (data == 0 || length <= 0) { return; }
            byte[] buf = ReadBytes(data, unicode ? length * 2 : length);
            string s = unicode ? Encoding.Unicode.GetString(buf) : Encoding.Default.GetString(buf);
            var e = Event("output"); e["text"] = s.TrimEnd('\0'); Emit(e);
        }
        catch (Exception) { }
    }

    static void OnException(int pid, int tid, int u)
    {
        uint code = (uint)Int(u);
        long at = Ptr(u + 16);
        bool firstChance = Int(u + 152) != 0;
        if (code == X_BREAKPOINT || code == X_WX86_BREAKPOINT)
        {
            if (Breakpoints.ContainsKey(at))
            {
                // our own: the program stands on the instruction the breakpoint replaced
                SetPc(tid, at);
                StopAt(pid, tid, DBG_CONTINUE, "breakpoint", 0, at);
                return;
            }
            if (loaderBreakpoints < (wow64 ? 2 : 1))
            {
                loaderBreakpoints++;
                ContinueDebugEvent(pid, tid, DBG_CONTINUE);
                return;
            }
            // an int 3 of the program itself (DebugBreak): a stop, then it goes on
            StopAt(pid, tid, DBG_CONTINUE, "breakpoint-instruction", code, at);
            return;
        }
        if (code == X_SINGLE_STEP || code == X_WX86_SINGLE_STEP)
        {
            if (reinsertAt >= 0) { WriteBreakByte(reinsertAt); reinsertAt = -1; }
            if (userStep) { userStep = false; StopAt(pid, tid, DBG_CONTINUE, "step", 0, at); return; }
            ContinueDebugEvent(pid, tid, DBG_CONTINUE);
            return;
        }
        if (!firstChance || (breakOnAccessViolation && code == 0xC0000005))
        {
            StopAt(pid, tid, DBG_EXCEPTION_NOT_HANDLED, "exception", code, at);
            return;
        }
        // a first-chance exception: the program deals with it (Delphi raises and catches its own)
        ContinueDebugEvent(pid, tid, DBG_EXCEPTION_NOT_HANDLED);
    }

    static void StopAt(int pid, int tid, uint status, string reason, uint code, long at)
    {
        stopped = true;
        stopPid = pid; stopTid = tid; stopStatus = status;
        var e = Event("stopped");
        e["reason"] = reason; e["tid"] = tid; e["address"] = Hex(at);
        if (code != 0) { e["code"] = Hex(code); }
        Emit(e);
    }

    static void Cleanup()
    {
        launched = false; stopped = false; userStep = false; pausedByUs = false; reinsertAt = -1;
        foreach (var t in Threads.Values) { CloseHandle(t); }
        Threads.Clear();
        Breakpoints.Clear();
        if (hProcess != IntPtr.Zero) { CloseHandle(hProcess); hProcess = IntPtr.Zero; }
    }

    // ------------------------------------------------------------------ breakpoints, running, stepping
    static byte[] ReadBytes(long addr, int len)
    {
        var buf = new byte[len];
        IntPtr read;
        if (!ReadProcessMemory(hProcess, new IntPtr(addr), buf, new IntPtr(len), out read)) { throw new InvalidOperationException("the memory at " + Hex(addr) + " cannot be read"); }
        if (read.ToInt64() != len) { Array.Resize(ref buf, (int)read.ToInt64()); }
        return buf;
    }

    static void WriteBytes(long addr, byte[] data)
    {
        uint old;
        IntPtr written;
        VirtualProtectEx(hProcess, new IntPtr(addr), new IntPtr(data.Length), PAGE_EXECUTE_READWRITE, out old);
        bool ok = WriteProcessMemory(hProcess, new IntPtr(addr), data, new IntPtr(data.Length), out written);
        uint ignored;
        VirtualProtectEx(hProcess, new IntPtr(addr), new IntPtr(data.Length), old, out ignored);
        FlushInstructionCache(hProcess, new IntPtr(addr), new IntPtr(data.Length));
        if (!ok) { throw new InvalidOperationException("the memory at " + Hex(addr) + " cannot be written"); }
    }

    // `hidden`: the breakpoints that are in memory read as the instruction they replaced
    static string ReadHex(long addr, int len, bool hidden)
    {
        byte[] data = ReadBytes(addr, len);
        if (hidden)
        {
            foreach (var bp in Breakpoints) { long i = bp.Key - addr; if (i >= 0 && i < data.Length && !(reinsertAt == bp.Key)) { data[i] = bp.Value; } }
        }
        var sb = new StringBuilder();
        foreach (byte b in data) { sb.Append(b.ToString("x2", CultureInfo.InvariantCulture)); }
        return sb.ToString();
    }

    static void WriteHex(long addr, string hex)
    {
        var data = new byte[hex.Length / 2];
        for (int i = 0; i < data.Length; i++) { data[i] = byte.Parse(hex.Substring(i * 2, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture); }
        WriteBytes(addr, data);
    }

    static void WriteBreakByte(long addr) { WriteBytes(addr, new byte[] { 0xCC }); }

    static void SetBreakpoint(long addr)
    {
        if (!launched) { throw new InvalidOperationException("no program"); }
        if (Breakpoints.ContainsKey(addr)) { return; }
        byte[] original = ReadBytes(addr, 1);
        Breakpoints[addr] = original[0];
        // the breakpoint the program stands on stays out of memory until it has moved on
        if (!(stopped && GetPc(stopTid) == addr)) { WriteBreakByte(addr); }
    }

    static void ClearBreakpoint(long addr)
    {
        byte original;
        if (!Breakpoints.TryGetValue(addr, out original)) { return; }
        Breakpoints.Remove(addr);
        if (reinsertAt == addr) { reinsertAt = -1; return; }
        WriteBytes(addr, new byte[] { original });
    }

    static void Resume(bool step)
    {
        if (!launched || !stopped) { throw new InvalidOperationException("the program is not stopped"); }
        if (pausedByUs)
        {
            // stopped by a pause: the threads are suspended, not waiting on an event
            if (step)
            {
                SetTrap(stopTid);
                userStep = true;
                pausedByUs = false;
                stopped = false;
                ResumeThread(Threads[stopTid]);
                // the others stay suspended until the program is let go
                pausedByUs = true;
                return;
            }
            pausedByUs = false;
            stopped = false;
            foreach (var t in Threads.Values) { ResumeThread(t); }
            return;
        }
        long pc = GetPc(stopTid);
        byte original;
        if (Breakpoints.TryGetValue(pc, out original))
        {
            // step over the breakpoint: its own byte back, one instruction, the breakpoint again
            WriteBytes(pc, new byte[] { original });
            reinsertAt = pc;
            SetTrap(stopTid);
        }
        else if (step) { SetTrap(stopTid); }
        userStep = step;
        stopped = false;
        ContinueDebugEvent(stopPid, stopTid, stopStatus);
    }

    static void Pause()
    {
        if (!launched) { throw new InvalidOperationException("no program"); }
        if (stopped) { return; }
        foreach (var t in Threads.Values) { SuspendThread(t); }
        int main = FirstThread();
        pausedByUs = true;
        stopped = true;
        stopTid = main; stopPid = processId; stopStatus = DBG_CONTINUE;
        var e = Event("stopped");
        e["reason"] = "pause"; e["tid"] = main; e["address"] = Hex(GetPc(main));
        Emit(e);
    }

    static int FirstThread()
    {
        int best = -1;
        foreach (int id in Threads.Keys) { if (best < 0 || id < best) { best = id; } }
        return best;
    }

    static IEnumerable<object> ThreadIds()
    {
        var l = new List<int>(Threads.Keys);
        l.Sort();
        foreach (int id in l) { yield return id; }
    }

    static int CurrentThread()
    {
        if (!launched || !stopped) { throw new InvalidOperationException("the program is not stopped"); }
        return stopTid;
    }

    // ------------------------------------------------------------------ the registers
    // CONTEXT (64-bit): flags at 0x30, EFlags at 0x44, Rax.. at 0x78, Rip at 0xF8. WOW64_CONTEXT: flags at 0, Edi.. at 0x9C, Eip at 0xB8, EFlags at 0xC0, Esp at 0xC4.
    static readonly string[] Names64 = { "rax", "rcx", "rdx", "rbx", "rsp", "rbp", "rsi", "rdi", "r8", "r9", "r10", "r11", "r12", "r13", "r14", "r15", "rip" };
    static readonly int[] Offsets64 = { 0x78, 0x80, 0x88, 0x90, 0x98, 0xA0, 0xA8, 0xB0, 0xB8, 0xC0, 0xC8, 0xD0, 0xD8, 0xE0, 0xE8, 0xF0, 0xF8 };
    static readonly string[] Names32 = { "edi", "esi", "ebx", "edx", "ecx", "eax", "ebp", "eip", "esp" };
    static readonly int[] Offsets32 = { 0x9C, 0xA0, 0xA4, 0xA8, 0xAC, 0xB0, 0xB4, 0xB8, 0xC4 };

    static void LoadContext(int tid)
    {
        IntPtr h = Threads[tid];
        if (wow64)
        {
            Marshal.WriteInt32(ctx32, 0, 0x10000 | 1 | 2);
            if (!Wow64GetThreadContext(h, ctx32)) { throw new InvalidOperationException("the registers cannot be read"); }
        }
        else
        {
            Marshal.WriteInt32(ctx, 0x30, 0x100000 | 1 | 2);
            if (!GetThreadContext(h, ctx)) { throw new InvalidOperationException("the registers cannot be read"); }
        }
    }

    static void StoreContext(int tid)
    {
        IntPtr h = Threads[tid];
        bool ok = wow64 ? Wow64SetThreadContext(h, ctx32) : SetThreadContext(h, ctx);
        if (!ok) { throw new InvalidOperationException("the registers cannot be written"); }
    }

    static long GetPc(int tid)
    {
        LoadContext(tid);
        return wow64 ? (long)(uint)Marshal.ReadInt32(ctx32, 0xB8) : Marshal.ReadInt64(ctx, 0xF8);
    }

    static void SetPc(int tid, long pc)
    {
        LoadContext(tid);
        if (wow64) { Marshal.WriteInt32(ctx32, 0xB8, unchecked((int)pc)); } else { Marshal.WriteInt64(ctx, 0xF8, pc); }
        StoreContext(tid);
    }

    static void SetTrap(int tid)
    {
        LoadContext(tid);
        if (wow64) { Marshal.WriteInt32(ctx32, 0xC0, Marshal.ReadInt32(ctx32, 0xC0) | 0x100); }
        else { Marshal.WriteInt32(ctx, 0x44, Marshal.ReadInt32(ctx, 0x44) | 0x100); }
        StoreContext(tid);
    }

    static Dictionary<string, object> Registers(int tid)
    {
        LoadContext(tid);
        var r = new Dictionary<string, object>();
        if (wow64)
        {
            for (int i = 0; i < Names32.Length; i++) { r[Names32[i]] = Hex((uint)Marshal.ReadInt32(ctx32, Offsets32[i])); }
            r["eflags"] = Hex((uint)Marshal.ReadInt32(ctx32, 0xC0));
        }
        else
        {
            for (int i = 0; i < Names64.Length; i++) { r[Names64[i]] = Hex(Marshal.ReadInt64(ctx, Offsets64[i])); }
            r["eflags"] = Hex((uint)Marshal.ReadInt32(ctx, 0x44));
        }
        return r;
    }

    static void SetRegister(int tid, string name, long value)
    {
        LoadContext(tid);
        name = name.ToLowerInvariant();
        bool done = false;
        if (wow64)
        {
            for (int i = 0; i < Names32.Length; i++) { if (Names32[i] == name) { Marshal.WriteInt32(ctx32, Offsets32[i], unchecked((int)value)); done = true; } }
        }
        else
        {
            for (int i = 0; i < Names64.Length; i++) { if (Names64[i] == name) { Marshal.WriteInt64(ctx, Offsets64[i], value); done = true; } }
        }
        if (!done) { throw new InvalidOperationException("unknown register " + name); }
        StoreContext(tid);
    }
}
