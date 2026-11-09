/**
 * The detailed map file of the Delphi linker (Project Options > Linking > Map file: Detailed): the segments of the program, the names of its
 * routines and, for each unit, which source line starts at which address. It is what lets a debugger that knows nothing of Delphi types
 * stop on a line, show where it is, and walk the stack.
 *
 * Pure: the text of the file in, the tables out. An address is a segment and an offset (`0001:00001BA4`); the section of the executable that
 * the segment is, is found with `PeInfo`, and the offset is turned into an address of the running program by `SymbolTable`.
 */
import { PeInfo } from './pe';

export interface MapSegment { index: number; start: number; length: number; name: string; cls: string }
export interface MapPublic { segment: number; offset: number; name: string }
export interface MapLine { line: number; segment: number; offset: number }
export interface MapUnit { unit: string; file: string; segmentName: string; lines: MapLine[] }

export interface MapInfo {
    segments: MapSegment[];
    publics: MapPublic[];
    units: MapUnit[];
}

const hex = (s: string): number => parseInt(s, 16);

/** The tables of a detailed map file. A file that is not one (no segment, no line) gives empty tables. */
export function parseMap(text: string): MapInfo {
    const segments: MapSegment[] = [];
    const byValue: MapPublic[] = [];
    const byName: MapPublic[] = [];
    const units: MapUnit[] = [];
    let part: 'none' | 'segments' | 'publicsByName' | 'publicsByValue' | 'lines' = 'none';
    let current: MapUnit | undefined;
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trimEnd();
        if (!line.trim()) { continue; }
        if (/^\s*Start\s+Length\s+Name\s+Class/i.test(line)) { part = 'segments'; continue; }
        if (/^\s*Address\s+Publics by Name/i.test(line)) { part = 'publicsByName'; continue; }
        if (/^\s*Address\s+Publics by Value/i.test(line)) { part = 'publicsByValue'; continue; }
        const unitHead = /^Line numbers for (\S+?)\((.*)\) segment (\S+)/.exec(line);
        if (unitHead) {
            current = { unit: unitHead[1], file: unitHead[2], segmentName: unitHead[3], lines: [] };
            units.push(current);
            part = 'lines';
            continue;
        }
        if (/^\s*Detailed map of segments/i.test(line) || /^\s*Program entry point/i.test(line)) { part = 'none'; continue; }
        if (part === 'segments') {
            const m = /^\s*([0-9A-Fa-f]{4}):([0-9A-Fa-f]{8})\s+([0-9A-Fa-f]{8})H?\s+(\S+)\s+(\S+)/.exec(line);
            if (m) { segments.push({ index: hex(m[1]), start: hex(m[2]), length: hex(m[3]), name: m[4], cls: m[5] }); }
        } else if (part === 'publicsByValue' || part === 'publicsByName') {
            const m = /^\s*([0-9A-Fa-f]{4}):([0-9A-Fa-f]{8})\s+(\S.*)$/.exec(line);
            if (m) { (part === 'publicsByValue' ? byValue : byName).push({ segment: hex(m[1]), offset: hex(m[2]), name: m[3].trim() }); }
        } else if (part === 'lines' && current) {
            for (const m of line.matchAll(/(\d+)\s+([0-9A-Fa-f]{4}):([0-9A-Fa-f]{8})/g)) { current.lines.push({ line: Number(m[1]), segment: hex(m[2]), offset: hex(m[3]) }); }
        }
    }
    // the names are listed twice, by name and by value: either gives the routines
    return { segments, publics: byValue.length ? byValue : byName, units };
}

export interface LineEntry { unit: string; file: string; line: number; rva: number }

export interface PlacedBreakpoint { line: number; address: number; file: string }

/**
 * A map file and the executable it describes, turned into questions: which address is a line, which line is an address, which routine holds
 * an address. Addresses here are relative to the load address of the program (RVAs), and `load` makes them real.
 */
export class SymbolTable {
    private readonly entries: LineEntry[] = [];
    private readonly byFile = new Map<string, LineEntry[]>();
    private readonly routines: { rva: number; name: string }[] = [];
    private readonly rvaOfSegment = new Map<number, (offset: number) => number>();
    /** Where the program was loaded, once it runs: an address is `loadBase + rva`. */
    loadBase = 0;

    constructor(readonly map: MapInfo, readonly pe: PeInfo) {
        for (const seg of map.segments) {
            // the section of the executable that has the number of the segment: its address, plus how far the offset is from the segment's start
            const section = pe.sections[seg.index - 1];
            if (section) { this.rvaOfSegment.set(seg.index, off => section.virtualAddress + (off - seg.start)); }
        }
        for (const u of map.units) {
            for (const l of u.lines) {
                const rva = this.rva(l.segment, l.offset);
                if (rva === undefined) { continue; }
                const e = { unit: u.unit, file: u.file, line: l.line, rva };
                this.entries.push(e);
                const key = baseName(u.file);
                const list = this.byFile.get(key) ?? [];
                list.push(e);
                this.byFile.set(key, list);
            }
        }
        this.entries.sort((a, b) => a.rva - b.rva);
        for (const p of map.publics) {
            const rva = this.rva(p.segment, p.offset);
            if (rva !== undefined) { this.routines.push({ rva, name: p.name }); }
        }
        this.routines.sort((a, b) => a.rva - b.rva);
    }

    private rva(segment: number, offset: number): number | undefined {
        const f = this.rvaOfSegment.get(segment);
        return f ? f(offset) : undefined;
    }

    /** The files the map has lines for (as the map writes them). */
    files(): string[] { return [...new Set(this.entries.map(e => e.file))]; }

    /** Whether the map knows the file: by its name, whatever the folder. */
    hasFile(file: string): boolean { return this.byFile.has(baseName(file)); }

    /**
     * Where a breakpoint on a line goes: the address of the line, or of the next line that has code when this one has none (a comment, a
     * `var`), which is what a debugger does. Undefined when the file or what follows has no code.
     */
    place(file: string, line: number): PlacedBreakpoint | undefined {
        const list = this.byFile.get(baseName(file));
        if (!list) { return undefined; }
        let best: LineEntry | undefined;
        for (const e of list) {
            if (e.line < line) { continue; }
            if (!best || e.line < best.line || (e.line === best.line && e.rva < best.rva)) { best = e; }
        }
        return best ? { line: best.line, address: this.loadBase + best.rva, file: best.file } : undefined;
    }

    /** The line of an address of the running program: the last line that starts at or before it, in the same unit. */
    lineAt(address: number): LineEntry | undefined {
        const rva = address - this.loadBase;
        let lo = 0;
        let hi = this.entries.length - 1;
        let found = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (this.entries[mid].rva <= rva) { found = mid; lo = mid + 1; } else { hi = mid - 1; }
        }
        if (found < 0) { return undefined; }
        const e = this.entries[found];
        // an address far after the last line of its routine belongs to code the map has no line for
        const routine = this.routineAt(address);
        if (routine && routine.address - this.loadBase > e.rva) { return undefined; }
        return e;
    }

    /** Whether an address is exactly where a line starts. */
    isLineStart(address: number): boolean {
        const e = this.lineAt(address);
        return !!e && e.rva === address - this.loadBase;
    }

    /** The routine that holds an address, and where it starts. */
    routineAt(address: number): { name: string; address: number } | undefined {
        const rva = address - this.loadBase;
        let lo = 0;
        let hi = this.routines.length - 1;
        let found = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (this.routines[mid].rva <= rva) { found = mid; lo = mid + 1; } else { hi = mid - 1; }
        }
        return found < 0 ? undefined : { name: this.routines[found].name, address: this.loadBase + this.routines[found].rva };
    }
}

export function baseName(file: string): string {
    return file.replace(/^.*[\\/]/, '').toLowerCase();
}
