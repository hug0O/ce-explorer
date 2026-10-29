/**
 * A Markdown document as a list of blocks (a heading, a paragraph, a list, a quote, a code block, a table, a rule), the way a block
 * editor sees it. Each block keeps its own raw text, so a block is edited alone and the document is written back by joining them.
 * Pure: text in, blocks out.
 */
export type BlockType = 'frontmatter' | 'heading' | 'paragraph' | 'list' | 'quote' | 'code' | 'table' | 'hr' | 'html';

export interface Block {
    type: BlockType;
    /** The text of the block as written in the file (several lines for a list, a code block, a table). */
    raw: string;
    /** Heading level 1..6. */
    level?: number;
    /** Language of a code block. */
    lang?: string;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)/;
const HR = /^ {0,3}([-*_])( *\1){2,} *$/;
const ATX = /^ {0,3}(#{1,6})(?:[ \t]+|$)/;
const LIST = /^\s*(?:[-*+]|\d+[.)])\s+/;
const TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
const QUOTE = /^ {0,3}>/;
const HTML = /^ {0,3}<\/?[A-Za-z!][^>]*>/;

const blank = (l: string | undefined): boolean => l === undefined || !l.trim();

/** Whether a line starts a block of its own, ending the paragraph above it. */
function startsBlock(line: string, next: string | undefined): boolean {
    return ATX.test(line) || FENCE.test(line) || HR.test(line) || QUOTE.test(line) || LIST.test(line) || (line.includes('|') && next !== undefined && TABLE_SEP.test(next));
}

export function parseBlocks(text: string): Block[] {
    const lines = (text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text).split(/\r?\n/);
    const out: Block[] = [];
    let i = 0;
    if (/^---\s*$/.test(lines[0] ?? '')) {
        for (let j = 1; j < lines.length; j++) {
            if (/^(---|\.\.\.)\s*$/.test(lines[j])) { out.push({ type: 'frontmatter', raw: lines.slice(0, j + 1).join('\n') }); i = j + 1; break; }
        }
    }
    while (i < lines.length) {
        const line = lines[i];
        if (blank(line)) { i++; continue; }
        const fence = FENCE.exec(line);
        if (fence) {
            const ch = fence[1][0];
            const len = fence[1].length;
            let j = i + 1;
            while (j < lines.length) {
                const close = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(lines[j]);
                if (close && close[1][0] === ch && close[1].length >= len) { break; }
                j++;
            }
            out.push({ type: 'code', raw: lines.slice(i, Math.min(j + 1, lines.length)).join('\n'), lang: fence[2] || undefined });
            i = j + 1;
            continue;
        }
        const atx = ATX.exec(line);
        if (atx) { out.push({ type: 'heading', raw: line, level: atx[1].length }); i++; continue; }
        if (HR.test(line)) { out.push({ type: 'hr', raw: line }); i++; continue; }
        if (QUOTE.test(line)) {
            let j = i;
            while (j < lines.length && QUOTE.test(lines[j])) { j++; }
            out.push({ type: 'quote', raw: lines.slice(i, j).join('\n') });
            i = j;
            continue;
        }
        if (LIST.test(line)) {
            let j = i + 1;
            while (j < lines.length && !blank(lines[j]) && (LIST.test(lines[j]) || /^\s{2,}\S/.test(lines[j]))) { j++; }
            out.push({ type: 'list', raw: lines.slice(i, j).join('\n') });
            i = j;
            continue;
        }
        if (line.includes('|') && lines[i + 1] !== undefined && TABLE_SEP.test(lines[i + 1])) {
            let j = i + 2;
            while (j < lines.length && !blank(lines[j]) && lines[j].includes('|')) { j++; }
            out.push({ type: 'table', raw: lines.slice(i, j).join('\n') });
            i = j;
            continue;
        }
        if (HTML.test(line)) {
            let j = i + 1;
            while (j < lines.length && !blank(lines[j])) { j++; }
            out.push({ type: 'html', raw: lines.slice(i, j).join('\n') });
            i = j;
            continue;
        }
        // a paragraph, or a Setext heading when the line under it is === or ---
        let j = i + 1;
        while (j < lines.length && !blank(lines[j]) && !startsBlock(lines[j], lines[j + 1]) && !/^ {0,3}(=+|-+)[ \t]*$/.test(lines[j])) { j++; }
        const under = /^ {0,3}(=+|-+)[ \t]*$/.exec(lines[j] ?? '');
        if (under && j === i + 1) {
            out.push({ type: 'heading', raw: line + '\n' + lines[j], level: under[1][0] === '=' ? 1 : 2 });
            i = j + 1;
            continue;
        }
        out.push({ type: 'paragraph', raw: lines.slice(i, j).join('\n') });
        i = j;
    }
    return out;
}

/** The document written back: the blocks with one blank line between them. */
export function joinBlocks(blocks: { raw: string }[]): string {
    const parts = blocks.map(b => b.raw.replace(/\s+$/, '')).filter(r => r.length > 0);
    return parts.length ? parts.join('\n\n') + '\n' : '';
}

/** The raw texts re-read as blocks: what a block becomes once its text has been edited (a block with a blank line inside becomes two). */
export function reparse(raws: string[]): Block[] {
    return parseBlocks(raws.join('\n\n'));
}

/** Titles of the document for an outline: the text of each heading, its level, and the index of its block. */
export function outline(blocks: Block[]): { text: string; level: number; index: number }[] {
    const out: { text: string; level: number; index: number }[] = [];
    blocks.forEach((b, index) => {
        if (b.type !== 'heading') { return; }
        const first = b.raw.split('\n')[0];
        const text = b.raw.includes('\n') ? first.trim() : first.replace(/^ {0,3}#{1,6}[ \t]*/, '').replace(/[ \t]+#+[ \t]*$/, '').trim();
        out.push({ text, level: b.level ?? 1, index });
    });
    return out;
}
