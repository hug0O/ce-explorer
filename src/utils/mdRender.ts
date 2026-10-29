/**
 * Markdown blocks as HTML for the viewer: headings, paragraphs, nested lists with check boxes, quotes, code, tables, rules, with the
 * inline marks (bold, italic, strike, code, links, images). Everything that comes from the file is escaped, and a link only goes to an
 * address that is safe to open. Pure.
 */
import { Block, parseBlocks } from './mdBlocks';

export interface RenderOptions {
    /** Where relative images are found (a URL that ends with a slash), set by the editor from the folder of the file. */
    base?: string;
}

export function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** An address that is safe to put in a link: http(s), mailto, an anchor, or a relative path. Else `#`. */
export function safeUrl(url: string): string {
    const u = url.trim();
    if (/^(https?:|mailto:)/i.test(u) || u.startsWith('#')) { return u; }
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) { return '#'; }   // javascript:, data:, file:, vbscript:…
    return u;
}

export function slug(text: string): string {
    return text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
}

/** The inline marks of a line of text. */
export function inline(text: string, o: RenderOptions = {}): string {
    const codes: string[] = [];
    // code spans first: nothing inside them is marked
    let s = text.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_m, _t, c: string) => { codes.push('<code>' + esc(c.trim()) + '</code>'); return '\uE000' + (codes.length - 1) + '\uE000'; });
    s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_m, alt: string, src: string, title?: string) => {
        const u = safeUrl(src.replace(/&amp;/g, '&'));
        const full = /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(u) || !o.base ? u : o.base + u;
        return '<img src="' + esc(full) + '" alt="' + alt + '"' + (title ? ' title="' + title + '"' : '') + '>';
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_m, label: string, href: string) => '<a href="' + esc(safeUrl(href.replace(/&amp;/g, '&'))) + '">' + label + '</a>');
    s = s.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_m, u: string) => '<a href="' + esc(safeUrl(u)) + '">' + u + '</a>');
    s = s.replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_m, a?: string, b?: string) => '<strong>' + (a ?? b) + '</strong>');
    s = s.replace(/(^|[\s(])\*(?!\s)(.+?)(?<!\s)\*(?=$|[\s).,;:!?])/g, '$1<em>$2</em>');
    s = s.replace(/(^|[\s(])_(?!\s)(.+?)(?<!\s)_(?=$|[\s).,;:!?])/g, '$1<em>$2</em>');
    s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');
    return s.replace(/\uE000(\d+)\uE000/g, (_m, n: string) => codes[Number(n)]);
}

interface Item { indent: number; ordered: boolean; task?: boolean; done?: boolean; text: string; line: number }

function listItems(raw: string): Item[] {
    const items: Item[] = [];
    raw.split('\n').forEach((line, i) => {
        const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
        if (!m) {
            // a continuation line belongs to the item above
            if (items.length && line.trim()) { items[items.length - 1].text += ' ' + line.trim(); }
            return;
        }
        const task = /^\[([ xX])\]\s+(.*)$/.exec(m[3]);
        items.push({ indent: m[1].replace(/\t/g, '    ').length, ordered: /\d/.test(m[2]), task: !!task, done: task ? task[1] !== ' ' : undefined, text: task ? task[2] : m[3], line: i });
    });
    return items;
}

function listHtml(raw: string, o: RenderOptions): string {
    const items = listItems(raw);
    let html = '';
    const stack: { indent: number; tag: string }[] = [];
    const open = (it: Item): void => { const tag = it.ordered ? 'ol' : 'ul'; stack.push({ indent: it.indent, tag }); html += '<' + tag + '>'; };
    for (const it of items) {
        while (stack.length && it.indent < stack[stack.length - 1].indent) { html += '</li></' + stack.pop()!.tag + '>'; }
        if (!stack.length) { open(it); }
        else if (it.indent > stack[stack.length - 1].indent) { open(it); }
        else { html += '</li>'; }
        html += '<li' + (it.task ? ' class="task"' : '') + '>'
            + (it.task ? '<input type="checkbox" data-ln="' + it.line + '"' + (it.done ? ' checked' : '') + '> ' : '')
            + inline(it.text, o);
    }
    while (stack.length) { html += '</li></' + stack.pop()!.tag + '>'; }
    return html;
}

function cells(line: string): string[] {
    let t = line.trim();
    if (t.startsWith('|')) { t = t.slice(1); }
    if (t.endsWith('|') && !t.endsWith('\\|')) { t = t.slice(0, -1); }
    return t.split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
}

function tableHtml(raw: string, o: RenderOptions): string {
    const lines = raw.split('\n');
    const head = cells(lines[0]);
    const align = cells(lines[1]).map(c => (/^:-+:$/.test(c) ? 'center' : /-+:$/.test(c) ? 'right' : /^:-+/.test(c) ? 'left' : ''));
    const td = (tag: string, c: string, i: number): string => '<' + tag + (align[i] ? ' style="text-align:' + align[i] + '"' : '') + '>' + inline(c, o) + '</' + tag + '>';
    return '<table><thead><tr>' + head.map((c, i) => td('th', c, i)).join('') + '</tr></thead><tbody>'
        + lines.slice(2).map(l => '<tr>' + cells(l).map((c, i) => td('td', c, i)).join('') + '</tr>').join('') + '</tbody></table>';
}

/** One block as HTML. */
export function renderBlock(b: Block, o: RenderOptions = {}): string {
    switch (b.type) {
        case 'heading': {
            const first = b.raw.split('\n')[0];
            const text = b.raw.includes('\n') ? first.trim() : first.replace(/^ {0,3}#{1,6}[ \t]*/, '').replace(/[ \t]+#+[ \t]*$/, '').trim();
            return '<h' + (b.level ?? 1) + ' id="' + esc(slug(text)) + '">' + inline(text, o) + '</h' + (b.level ?? 1) + '>';
        }
        case 'paragraph': return '<p>' + b.raw.split('\n').map(l => inline(l.trim(), o)).join('<br>') + '</p>';
        case 'list': return listHtml(b.raw, o);
        case 'quote': {
            const inner = b.raw.split('\n').map(l => l.replace(/^ {0,3}> ?/, '')).join('\n');
            return '<blockquote>' + parseBlocks(inner).map(x => renderBlock(x, o)).join('') + '</blockquote>';
        }
        case 'code': {
            const lines = b.raw.split('\n');
            const body = lines.slice(1, /^ {0,3}(`{3,}|~{3,})\s*$/.test(lines[lines.length - 1]) && lines.length > 1 ? -1 : undefined).join('\n');
            return '<pre' + (b.lang ? ' data-lang="' + esc(b.lang) + '"' : '') + '><code>' + esc(body) + '</code></pre>';
        }
        case 'table': return tableHtml(b.raw, o);
        case 'hr': return '<hr>';
        case 'frontmatter': return '<details class="fm"><summary>Front matter</summary><pre><code>' + esc(b.raw) + '</code></pre></details>';
        default: return '<pre class="rawhtml"><code>' + esc(b.raw) + '</code></pre>';
    }
}

/** Flips the check box of a task line of a list block (`line` counts from the first line of the block). */
export function toggleTask(raw: string, line: number): string {
    const lines = raw.split('\n');
    if (line < 0 || line >= lines.length) { return raw; }
    lines[line] = lines[line].replace(/^(\s*(?:[-*+]|\d+[.)])\s+)\[([ xX])\]/, (_m, p: string, c: string) => p + (c === ' ' ? '[x]' : '[ ]'));
    return lines.join('\n');
}
