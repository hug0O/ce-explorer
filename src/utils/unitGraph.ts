/**
 * The Blueprint of a Delphi project: a node per unit (and per program / package file), a wire per `uses`. Reads the `uses` clauses of a
 * source text, builds the graph, and writes a unit into or out of a `uses` clause. Pure.
 */
import { familyOf, maskCode } from './callGraph';
import { layout } from './blueprintLayout';
import type { BpEdge, BpNode, SavedPositions } from './blueprintModel';

export interface UnitUse { name: string; section: 'interface' | 'implementation'; line: number }

export interface UnitInfo {
    /** Name as written in the header (`unit Main;`), or the file name when there is none. */
    name: string;
    kind: 'unit' | 'program';
    uses: UnitUse[];
    /** Where the file is (path or uri string), to open it. */
    file: string;
}

const PASCAL = familyOf('pascal')!;

/** The unit, program, library or package a text declares and the units it lists in its `uses` clauses; undefined for any other text. */
export function readUnit(text: string, file: string): UnitInfo | undefined {
    const masked = maskCode(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text, PASCAL);
    const head = /^\s*(unit|program|library|package)\s+([\w.]+)/im.exec(masked);
    if (!head) { return undefined; }
    const kind = head[1].toLowerCase() === 'unit' ? 'unit' : 'program';
    const implAt = kind === 'unit' ? masked.search(/^\s*implementation\b/im) : -1;
    const uses: UnitUse[] = [];
    for (const m of masked.matchAll(/\buses\b([^;]*);/gi)) {
        const at = m.index ?? 0;
        const section = implAt >= 0 && at > implAt ? 'implementation' : 'interface';
        let line = masked.slice(0, at).split('\n').length - 1;
        // `in 'File.pas'` of a project file is blanked inside the quotes: drop the `in`, keep the names
        for (const part of m[1].replace(/\bin\b\s*'[^']*'/gi, ' ').split(',')) {
            const n = /([A-Za-z_][\w.]*)/.exec(part)?.[1];
            const lead = part.length - part.trimStart().length;
            line += (part.slice(0, lead).match(/\n/g) ?? []).length;
            if (n) { uses.push({ name: n, section, line }); }
            line += (part.trimStart().match(/\n/g) ?? []).length;
        }
    }
    return { name: head[2], kind, uses, file };
}

export interface UnitGraph {
    nodes: BpNode[];
    edges: (BpEdge & { section: 'interface' | 'implementation' })[];
    /** Units a unit lists that are not in the project (System, Vcl.Forms, other libraries). */
    external: Map<string, string[]>;
}

/** The graph of the units: a wire from each unit to the units of the project that it uses. */
export function buildUnitGraph(units: UnitInfo[], saved: SavedPositions = {}): UnitGraph {
    const byName = new Map<string, UnitInfo>();
    for (const u of units) { if (!byName.has(u.name.toLowerCase())) { byName.set(u.name.toLowerCase(), u); } }
    const known = [...byName.values()];
    const external = new Map<string, string[]>();
    const edges: UnitGraph['edges'] = [];
    for (const u of known) {
        const seen = new Set<string>();
        const ext: string[] = [];
        for (const use of u.uses) {
            const key = use.name.toLowerCase();
            if (seen.has(key) || key === u.name.toLowerCase()) { continue; }
            seen.add(key);
            const target = byName.get(key);
            if (target) { edges.push({ from: u.name, to: target.name, lines: [use.line], section: use.section }); } else { ext.push(use.name); }
        }
        external.set(u.name, ext);
    }
    const boxes = layout(known.map(u => ({ id: u.name, title: u.name, inputs: 1, outputs: 1 })), edges);
    const nodes: BpNode[] = known.map(u => {
        const b = boxes.get(u.name)!;
        const p = saved[u.name];
        return {
            id: u.name, name: u.name, kind: u.kind, params: [], line: 0, hasBody: true, recursive: false,
            x: p ? p.x : b.x, y: p ? p.y : b.y, w: b.w, h: b.h, file: u.file, external: external.get(u.name) ?? [],
        };
    });
    return { nodes, edges, external };
}

// --- writing a unit into / out of a uses clause ---------------------------------------------------------------------------

/** The text with `unit` added to the `uses` clause of the implementation section (or of the program), made if there is none. */
export function addUses(text: string, unit: string): string | undefined {
    const masked = maskCode(text, PASCAL);
    const info = readUnit(text, '');
    if (!info) { return undefined; }
    if (info.uses.some(u => u.name.toLowerCase() === unit.toLowerCase())) { return undefined; }
    const implAt = info.kind === 'unit' ? masked.search(/^\s*implementation\b/im) : -1;
    const clauses = [...masked.matchAll(/\buses\b[^;]*;/gi)].filter(m => (implAt < 0 ? true : (m.index ?? 0) > implAt));
    if (clauses.length) {
        // before the `;` that ends the last clause of the section: `, Name`
        const last = clauses[clauses.length - 1];
        const semi = (last.index ?? 0) + last[0].length - 1;
        return text.slice(0, semi) + ', ' + unit + text.slice(semi);
    }
    if (implAt < 0) { return undefined; }
    const eol = text.indexOf('\n', implAt + 1);
    const at = eol < 0 ? text.length : eol + 1;
    const nl = text.includes('\r\n') ? '\r\n' : '\n';
    return text.slice(0, at) + nl + 'uses' + nl + '  ' + unit + ';' + nl + text.slice(at);
}

/** The text without `unit` in any of its `uses` clauses; a clause left empty goes too. */
export function removeUses(text: string, unit: string): string | undefined {
    const masked = maskCode(text, PASCAL);
    const clauses = [...masked.matchAll(/\buses\b([^;]*);/gi)];
    let out = text;
    let changed = false;
    // from the last clause to the first, so the offsets of the others stay right
    for (const m of clauses.reverse()) {
        const start = m.index ?? 0;
        const bodyStart = start + 4;
        const bodyEnd = start + m[0].length - 1;
        const body = text.slice(bodyStart, bodyEnd);
        const maskedBody = masked.slice(bodyStart, bodyEnd);
        // the items with their offsets inside the body: split at the commas that are outside the (blanked) quotes
        const items: { from: number; to: number; name: string }[] = [];
        let from = 0;
        const pieces = maskedBody.split(',');
        for (const piece of pieces) {
            const name = /([A-Za-z_][\w.]*)/.exec(piece)?.[1] ?? '';
            items.push({ from, to: from + piece.length, name });
            from += piece.length + 1;
        }
        const hit = items.findIndex(i => i.name.toLowerCase() === unit.toLowerCase());
        if (hit < 0) { continue; }
        changed = true;
        let newBody: string;
        if (items.length === 1) {
            // the clause held only this unit: remove the whole `uses ... ;` and its line when nothing else is on it
            let a = start, b = start + m[0].length;
            const lineA = out.lastIndexOf('\n', a - 1) + 1;
            const lineB = out.indexOf('\n', b);
            if (!out.slice(lineA, a).trim() && (lineB < 0 || !out.slice(b, lineB).trim())) { a = lineA; b = lineB < 0 ? out.length : lineB + 1; }
            out = out.slice(0, a) + out.slice(b);
            continue;
        }
        const keep = items.filter((_, i) => i !== hit);
        // keep the layout of the neighbours: remove the item with the comma that follows it (or, for the last one, the comma before)
        if (hit < items.length - 1) { newBody = body.slice(0, items[hit].from) + body.slice(items[hit + 1].from); } else { newBody = body.slice(0, items[hit - 1].to) + body.slice(items[hit].to); }
        void keep;
        out = out.slice(0, bodyStart) + newBody + out.slice(bodyEnd);
    }
    return changed ? out : undefined;
}
