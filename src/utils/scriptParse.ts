/**
 * Reads the outline of the files that are scripts or notes rather than classes: Markdown (the headings), Windows batch (labels and
 * variables), PowerShell (functions, classes, variables) and Unix shell (functions, variables). Pure: text in, items with line numbers
 * out, so it is tested without VS Code; the providers turn the items into members.
 */
export type ScriptItemKind = 'heading' | 'label' | 'function' | 'class' | 'variable' | 'method' | 'property';

export interface ScriptItem {
    kind: ScriptItemKind;
    name: string;
    startLine: number;
    endLine: number;
    /** Parameter names (`$1`, `%2`, `$Path`…). */
    params: string[];
    /** Heading level 1..6, for Markdown. */
    level?: number;
    /** Type or value shown next to the name. */
    detail?: string;
    /** Items inside it (the methods and properties of a PowerShell class). */
    children?: ScriptItem[];
}

const splitLines = (text: string): string[] => text.split(/\r?\n/);

/** Last line of a block that ends where the next one starts, without the blank lines before it. */
function trimEnd(lines: string[], start: number, end: number): number {
    let e = Math.min(end, lines.length - 1);
    while (e > start && !(lines[e] ?? '').trim()) { e--; }
    return e;
}

/** Fills each item's end line: the line before the next item of the same list, blank lines left out. */
function closeBlocks(items: ScriptItem[], lines: string[], lastLine: number): void {
    for (let i = 0; i < items.length; i++) {
        const next = items[i + 1];
        items[i].endLine = trimEnd(lines, items[i].startLine, next ? next.startLine - 1 : lastLine);
    }
}

// --- Markdown ---------------------------------------------------------------------------------------------------------------

/** The text of a title without its inline marks: `**bold**`, `` `code` ``, `[text](url)`, trailing `#`s. */
export function cleanTitle(raw: string): string {
    return raw
        .replace(/\s+#+\s*$/, '')
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/(\*\*|__|~~|`)/g, '')
        .replace(/(^|\s)[*_]([^*_]+)[*_](?=\s|$)/g, '$1$2')
        .trim();
}

export function parseMarkdown(text: string): ScriptItem[] {
    const lines = splitLines(text);
    const items: ScriptItem[] = [];
    let i = 0;
    // front matter: `---` on the first line up to the next `---` or `...`
    if (/^---\s*$/.test(lines[0] ?? '')) {
        for (let j = 1; j < lines.length; j++) { if (/^(---|\.\.\.)\s*$/.test(lines[j])) { i = j + 1; break; } }
    }
    let fence: { ch: string; len: number } | undefined;
    let comment = false;
    let prevText = -1;   // line of the paragraph text just above, for the Setext underline
    for (; i < lines.length; i++) {
        const line = lines[i];
        if (fence) {
            const close = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(line);
            if (close && close[1][0] === fence.ch && close[1].length >= fence.len) { fence = undefined; }
            continue;
        }
        if (comment) { if (line.includes('-->')) { comment = false; } continue; }
        const open = /^ {0,3}(`{3,}|~{3,})/.exec(line);
        if (open) { fence = { ch: open[1][0], len: open[1].length }; prevText = -1; continue; }
        const c = line.indexOf('<!--');
        if (c >= 0 && /^\s*<!--/.test(line)) { if (!line.includes('-->', c + 4)) { comment = true; } prevText = -1; continue; }
        const atx = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/.exec(line);
        if (atx) {
            const title = cleanTitle(atx[2] ?? '');
            if (title) { items.push({ kind: 'heading', name: title, startLine: i, endLine: i, params: [], level: atx[1].length }); }
            prevText = -1;
            continue;
        }
        const under = /^ {0,3}(=+|-+)[ \t]*$/.exec(line);
        if (under && prevText === i - 1) {
            const title = cleanTitle(lines[prevText].trim());
            if (title) { items.push({ kind: 'heading', name: title, startLine: prevText, endLine: i, params: [], level: under[1][0] === '=' ? 1 : 2 }); }
            prevText = -1;
            continue;
        }
        const plain = line.trim() && !/^ {0,3}([-*+]|\d+[.)])\s/.test(line) && !/^ {4}/.test(line) && !/^>/.test(line) && !/^\|/.test(line) && !/^ {0,3}([-*_])( *\1){2,} *$/.test(line);
        prevText = plain ? i : -1;
    }
    closeBlocks(items, lines, lines.length - 1);
    return items;
}

// --- shared helpers for the scripts -----------------------------------------------------------------------------------------

/** Removes the strings and the `#` comment of a line, so that the braces left are the real ones. */
function codeOnly(line: string, hashComment: boolean): string {
    let out = '';
    let q = '';
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (q) { if (ch === '\\' && q === '"') { i++; } else if (ch === q) { q = ''; } continue; }
        if (ch === '"' || ch === "'") { q = ch; continue; }
        if (hashComment && ch === '#' && (i === 0 || /[\s;]/.test(line[i - 1]))) { break; }
        out += ch;
    }
    return out;
}

/** Line of the `}` that closes the first `{` found from `start`, or -1. `<# … #>` blocks are skipped when `block` is set. */
function braceEnd(lines: string[], start: number, block: boolean): number {
    let depth = 0;
    let opened = false;
    let inBlock = false;
    for (let i = start; i < lines.length; i++) {
        let line = lines[i];
        if (block) {
            if (inBlock) { const e = line.indexOf('#>'); if (e < 0) { continue; } line = line.slice(e + 2); inBlock = false; }
            const s = line.indexOf('<#');
            if (s >= 0) { const e = line.indexOf('#>', s + 2); if (e < 0) { inBlock = true; line = line.slice(0, s); } else { line = line.slice(0, s) + line.slice(e + 2); } }
        }
        for (const ch of codeOnly(line, true)) {
            if (ch === '{') { depth++; opened = true; } else if (ch === '}') { depth--; }
        }
        if (opened && depth <= 0) { return i; }
        if (!opened && i > start + 2) { return -1; }   // the brace must come within a line or two of the header
    }
    return -1;
}

/** Highest positional parameter used in a block: `$1`..`$9` / `${1}` (shell) or `%1`..`%9` (batch) → `$1`..`$n`. */
function positional(lines: string[], from: number, to: number, re: RegExp, prefix: string): string[] {
    let max = 0;
    for (let i = from; i <= to && i < lines.length; i++) {
        for (const m of lines[i].matchAll(re)) { max = Math.max(max, Number(m[1])); }
    }
    return Array.from({ length: max }, (_, k) => prefix + (k + 1));
}

// --- Windows batch ----------------------------------------------------------------------------------------------------------

export function parseBatch(text: string): ScriptItem[] {
    const lines = splitLines(text);
    const labels: ScriptItem[] = [];
    const vars: ScriptItem[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const label = /^\s*:(?!:)([A-Za-z0-9_.$-]+)/.exec(line);
        if (label) { labels.push({ kind: 'label', name: label[1], startLine: i, endLine: i, params: [] }); continue; }
        if (/^\s*(rem\b|::)/i.test(line)) { continue; }
        const set = /^\s*@?set\s+(?:\/[ap]\s+)?"?([A-Za-z_][\w.()-]*)=(.*?)"?\s*$/i.exec(line);
        if (set && !seen.has(set[1].toLowerCase())) {
            seen.add(set[1].toLowerCase());
            vars.push({ kind: 'variable', name: set[1], startLine: i, endLine: i, params: [], detail: set[2].slice(0, 40) });
        }
    }
    closeBlocks(labels, lines, lines.length - 1);
    for (const l of labels) { l.params = positional(lines, l.startLine, l.endLine, /%~?[a-z]*([1-9])/gi, '%'); }
    return [...labels, ...vars];
}

// --- PowerShell -------------------------------------------------------------------------------------------------------------

const PS_NOT_METHODS = new Set(['if', 'elseif', 'foreach', 'for', 'while', 'switch', 'catch', 'until', 'trap', 'return', 'throw', 'param']);

/** `[type]$name` and `$name` of a parameter list, in order. */
function psParams(list: string): string[] {
    return Array.from(list.matchAll(/\$([A-Za-z_]\w*)/g)).map(m => m[1]);
}

function psParamBlock(lines: string[], start: number, end: number): string[] {
    for (let i = start + 1; i <= Math.min(end, start + 6); i++) {
        if (!/^\s*param\s*\(/i.test(lines[i] ?? '')) { continue; }
        let text = '';
        let depth = 0;
        for (let j = i; j <= end; j++) {
            for (const ch of codeOnly(lines[j], true)) {
                text += ch;
                if (ch === '(') { depth++; } else if (ch === ')') { depth--; }
            }
            if (depth <= 0) { break; }
        }
        // the attributes ([Parameter(Mandatory)]) hold no variable, only the names do
        return psParams(text.replace(/^\s*param\s*/i, ''));
    }
    return [];
}

export function parsePowerShell(text: string): ScriptItem[] {
    const lines = splitLines(text);
    const items: ScriptItem[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cls = /^\s*class\s+([A-Za-z_]\w*)(?:\s*:\s*([\w.,\s]+?))?\s*\{?\s*$/i.exec(line);
        if (cls) {
            const end = braceEnd(lines, i, true);
            const last = end < 0 ? i : end;
            const children: ScriptItem[] = [];
            for (let j = i + 1; j < last; j++) {
                const m = /^\s+(?:(?:hidden|static)\s+)*(?:\[[\w.,\[\]\s]+\]\s*)?([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:\{.*)?$/.exec(lines[j]);
                if (m && !PS_NOT_METHODS.has(m[1].toLowerCase())) {
                    const e = braceEnd(lines, j, true);
                    children.push({ kind: 'method', name: m[1], startLine: j, endLine: e < 0 ? j : e, params: psParams(m[2]) });
                    j = e < 0 ? j : e;
                    continue;
                }
                const p = /^\s+(?:(?:hidden|static)\s+)*(\[[\w.,\[\]\s]+\])\s*\$([A-Za-z_]\w*)/.exec(lines[j]);
                if (p) { children.push({ kind: 'property', name: p[2], startLine: j, endLine: j, params: [], detail: p[1].slice(1, -1) }); }
            }
            items.push({ kind: 'class', name: cls[1], startLine: i, endLine: last, params: [], detail: cls[2]?.trim(), children });
            i = last;
            continue;
        }
        const fn = /^\s*(?:function|filter|workflow)\s+([A-Za-z_][\w.:-]*)\s*(?:\(([^)]*)\))?\s*\{?/i.exec(line);
        if (fn) {
            const end = braceEnd(lines, i, true);
            const last = end < 0 ? i : end;
            const params = fn[2] ? psParams(fn[2]) : psParamBlock(lines, i, last);
            items.push({ kind: 'function', name: fn[1], startLine: i, endLine: last, params });
            i = last;
            continue;
        }
        const v = /^\$(?:script:|global:)?([A-Za-z_]\w*)\s*=\s*(.*)$/i.exec(line);
        if (v && !seen.has(v[1].toLowerCase())) {
            seen.add(v[1].toLowerCase());
            items.push({ kind: 'variable', name: v[1], startLine: i, endLine: i, params: [], detail: v[2].slice(0, 40) });
        }
    }
    return items;
}

// --- Unix shell -------------------------------------------------------------------------------------------------------------

export function parseShell(text: string): ScriptItem[] {
    const lines = splitLines(text);
    const items: ScriptItem[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*#/.test(line)) { continue; }
        const fn = /^\s*function\s+([A-Za-z_][\w:.-]*)\s*(?:\(\s*\))?\s*\{?/.exec(line) ?? /^\s*([A-Za-z_][\w:.-]*)\s*\(\s*\)\s*\{?/.exec(line);
        if (fn) {
            const end = braceEnd(lines, i, false);
            const last = end < 0 ? i : end;
            items.push({ kind: 'function', name: fn[1], startLine: i, endLine: last, params: positional(lines, i, last, /\$\{?([1-9])/g, '$') });
            i = last;
            continue;
        }
        const v = /^(?:export\s+|readonly\s+|declare\s+(?:-[a-zA-Z]+\s+)?)?([A-Za-z_]\w*)=(.*)$/.exec(line);
        if (v && !seen.has(v[1])) {
            seen.add(v[1]);
            items.push({ kind: 'variable', name: v[1], startLine: i, endLine: i, params: [], detail: v[2].replace(/^["']|["']$/g, '').slice(0, 40) });
        }
    }
    return items;
}
