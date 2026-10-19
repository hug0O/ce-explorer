/**
 * Small, safe Markdown renderer for the sidebar memo. Everything is escaped
 * first, nothing from the text can become markup or a script, and links only
 * keep http(s) targets (opened by the extension, never by the page).
 *
 * Supported: headings (#), paragraphs, bullet / numbered / task lists, quotes,
 * rules, fenced code blocks (each with Copy / Insert buttons), `code`, **bold**,
 * *italic* and [links](https://…). Task boxes can be ticked from the preview.
 */

export interface MemoRender {
    html: string;
    /** Text of every fenced code block, in order: the buttons of the preview refer to them by index. */
    blocks: string[];
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inlineText(raw: string): string {
    return raw.split(/(`[^`\n]+`)/g).map((part, i) => {
        if (i % 2 === 1) { return `<code>${esc(part.slice(1, -1))}</code>`; }
        return esc(part)
            .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="#" data-memo-link="$2">$1</a>')
            .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[^*\w])\*([^*\s][^*\n]*)\*(?![*\w])/g, '$1<em>$2</em>')
            .replace(/(^|[^_\w])_([^_\s][^_\n]*)_(?![_\w])/g, '$1<em>$2</em>');
    }).join('');
}

const FENCE = /^\s*(```|~~~)\s*([\w+#.-]*)\s*$/;
const HEADING = /^(#{1,4})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const QUOTE = /^\s*>\s?(.*)$/;
const TASK = /^(\s*[-*+]\s+)\[( |x|X)\](\s+.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function renderMemo(md: string): MemoRender {
    const lines = md.replace(/\r\n?/g, '\n').split('\n');
    const out: string[] = [];
    const blocks: string[] = [];
    let list: 'ul' | 'ol' | '' = '';
    let para: string[] = [];

    const closeList = (): void => { if (list) { out.push(`</${list}>`); list = ''; } };
    const flushPara = (): void => { if (para.length) { out.push(`<p>${para.map(inlineText).join('<br>')}</p>`); para = []; } };
    const open = (kind: 'ul' | 'ol'): void => { flushPara(); if (list !== kind) { closeList(); out.push(`<${kind}>`); list = kind; } };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fence = line.match(FENCE);
        if (fence) {
            flushPara(); closeList();
            const body: string[] = [];
            let j = i + 1;
            while (j < lines.length && !(lines[j].trim().startsWith(fence[1]) && lines[j].trim() === fence[1])) { body.push(lines[j]); j++; }
            const text = body.join('\n');
            const n = blocks.push(text) - 1;
            out.push(`<div class="mcode"><div class="mcode-bar"><span class="mlang">${esc(fence[2] || 'code')}</span>`
                + `<button class="mbtn" data-memo-copy="${n}" title="Copy to the clipboard">Copy</button>`
                + `<button class="mbtn" data-memo-insert="${n}" title="Insert at the cursor of the editor">Insert</button></div>`
                + `<pre><code>${esc(text)}</code></pre></div>`);
            i = j;
            continue;
        }
        if (!line.trim()) { flushPara(); closeList(); continue; }
        const heading = line.match(HEADING);
        if (heading) { flushPara(); closeList(); const level = heading[1].length + 2; out.push(`<h${level}>${inlineText(heading[2])}</h${level}>`); continue; }
        if (RULE.test(line)) { flushPara(); closeList(); out.push('<hr>'); continue; }
        const quote = line.match(QUOTE);
        if (quote) { flushPara(); closeList(); out.push(`<blockquote>${inlineText(quote[1])}</blockquote>`); continue; }
        const task = line.match(TASK);
        if (task) {
            open('ul');
            const done = task[2] !== ' ';
            out.push(`<li class="mtask"><label><input type="checkbox" data-memo-line="${i}"${done ? ' checked' : ''}> <span${done ? ' class="done"' : ''}>${inlineText(task[3].trim())}</span></label></li>`);
            continue;
        }
        const bullet = line.match(BULLET);
        if (bullet) { open('ul'); out.push(`<li>${inlineText(bullet[1])}</li>`); continue; }
        const numbered = line.match(NUMBERED);
        if (numbered) { open('ol'); out.push(`<li>${inlineText(numbered[1])}</li>`); continue; }
        closeList();
        para.push(line.trim());
    }
    flushPara(); closeList();
    return { html: out.join('\n'), blocks };
}

/** Text of the fenced code blocks of a memo. */
export function codeBlocks(md: string): string[] {
    return renderMemo(md).blocks;
}

/** The memo with the task box of line `line` (0-based) ticked or unticked; undefined when that line is not a task. */
export function toggleTask(md: string, line: number): string | undefined {
    const lines = md.split('\n');
    const raw = lines[line];
    if (raw === undefined) { return undefined; }
    const cr = raw.endsWith('\r') ? '\r' : '';
    const m = raw.replace(/\r$/, '').match(TASK);
    if (!m) { return undefined; }
    lines[line] = m[1] + (m[2] === ' ' ? '[x]' : '[ ]') + m[3] + cr;
    return lines.join('\n');
}
