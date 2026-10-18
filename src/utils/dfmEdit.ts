/**
 * Low-level DFM text edits shared by the Delphi layout tools: set / add /
 * remove a property line of a component, extract or delete a component block,
 * rename identifiers. All edits are offsets against the ORIGINAL text.
 */
import type { TextEdit } from '../services/DelphiForm';
import type { DfmNode } from '../services/DelphiLayout';

export function lineStartOffsets(text: string): number[] {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') { starts.push(i + 1); }
    }
    return starts;
}

function lineEnd(text: string, starts: number[], line: number): number {
    let end = (starts[line + 1] ?? text.length + 1) - 1;
    if (end > starts[line] && text[end - 1] === '\r') { end--; }
    return Math.min(end, text.length);
}

/** Replaces the value of an existing property, or adds `Prop = value` after the node's own properties. */
export function setProp(dfm: string, node: DfmNode, prop: string, value: string): TextEdit {
    const starts = lineStartOffsets(dfm);
    const line = node.propLines[prop];
    if (line !== undefined) {
        const s = starts[line];
        const e = lineEnd(dfm, starts, line);
        const m = dfm.slice(s, e).match(/^(\s*[\w.]+\s*=\s*)/);
        return { offset: s + (m ? m[1].length : 0), length: e - s - (m ? m[1].length : 0), text: value };
    }
    const eol = dfm.includes('\r\n') ? '\r\n' : '\n';
    const at = node.children.length > 0 ? node.children[0].startLine : node.endLine;
    return { offset: starts[at], length: 0, text: `${'  '.repeat(node.depth + 1)}${prop} = ${value}${eol}` };
}

/** Removes a property line (single-line properties only). */
export function deleteProp(dfm: string, node: DfmNode, prop: string): TextEdit | undefined {
    const line = node.propLines[prop];
    if (line === undefined) { return undefined; }
    const starts = lineStartOffsets(dfm);
    const next = starts[line + 1] ?? dfm.length;
    return { offset: starts[line], length: next - starts[line], text: '' };
}

/** The whole `object … end` block of a node (children included), as written. */
export function nodeBlock(dfm: string, node: DfmNode): { offset: number; length: number; text: string } {
    const starts = lineStartOffsets(dfm);
    const from = starts[node.startLine];
    const to = starts[node.endLine + 1] ?? dfm.length;
    return { offset: from, length: to - from, text: dfm.slice(from, to) };
}

/** Block text re-indented so that the node sits at `depth` (0 = a root-level object). */
export function reindentBlock(text: string, fromDepth: number, toDepth: number): string {
    const shift = (toDepth - fromDepth) * 2;
    return text.split('\n').map(l => {
        if (!l.trim()) { return l; }
        if (shift >= 0) { return ' '.repeat(shift) + l; }
        const cut = Math.min(-shift, (l.match(/^ */) ?? [''])[0].length);
        return l.slice(cut);
    }).join('\n');
}

function escapeRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Renames whole identifiers outside '…' literals, using the map (case-insensitive keys). */
export function renameIdentifiers(text: string, map: Map<string, string>): string {
    if (map.size === 0) { return text; }
    const names = [...map.keys()].sort((a, b) => b.length - a.length).map(escapeRe).join('|');
    const re = new RegExp('(?<![\\w$#.])(' + names + ')(?![\\w$#])', 'gi');
    return text.split('\n').map(line => {
        let inQuote = false;
        let out = '';
        let last = 0;
        const quoted: boolean[] = [];
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '\'') { inQuote = !inQuote; }
            quoted.push(inQuote);
        }
        for (let m = re.exec(line); m; m = re.exec(line)) {
            if (quoted[m.index]) { continue; }
            out += line.slice(last, m.index) + (map.get(m[1].toLowerCase()) ?? m[1]);
            last = m.index + m[0].length;
        }
        re.lastIndex = 0;
        return out + line.slice(last);
    }).join('\n');
}

/** `[akLeft, akTop]` → set of names; undefined when absent. */
export function parseAnchors(value: string | undefined): Set<string> {
    const s = new Set<string>();
    if (!value) { return new Set(['akLeft', 'akTop']); }
    for (const m of value.matchAll(/ak\w+/g)) { s.add(m[0]); }
    return s;
}

export function formatAnchors(set: Set<string>): string {
    const order = ['akLeft', 'akTop', 'akRight', 'akBottom'];
    return '[' + order.filter(a => set.has(a)).join(', ') + ']';
}
