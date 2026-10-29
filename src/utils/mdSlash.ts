/**
 * The "/" menu of the Markdown editor, as in Notion: type `/` in a block, a few letters, and pick what the block becomes. Each item
 * gives the Markdown to write and where the caret goes. Pure.
 */
export interface SlashItem {
    id: string;
    title: string;
    hint: string;
    /** Extra words that find it (`h1`, `todo`, `bullet`…). */
    keywords: string;
    /** The Markdown that replaces `/query`. */
    insert: string;
    /** Where the caret goes in `insert` (default: the end). */
    caret?: number;
}

export const SLASH_ITEMS: SlashItem[] = [
    { id: 'text', title: 'Text', hint: 'Plain paragraph', keywords: 'paragraph plain p', insert: '' },
    { id: 'h1', title: 'Heading 1', hint: 'Big section title', keywords: 'h1 title #', insert: '# ' },
    { id: 'h2', title: 'Heading 2', hint: 'Medium section title', keywords: 'h2 subtitle ##', insert: '## ' },
    { id: 'h3', title: 'Heading 3', hint: 'Small section title', keywords: 'h3 ###', insert: '### ' },
    { id: 'bullet', title: 'Bulleted list', hint: 'A simple list', keywords: 'ul list bullet unordered -', insert: '- ' },
    { id: 'numbered', title: 'Numbered list', hint: 'A list with numbers', keywords: 'ol list ordered number 1.', insert: '1. ' },
    { id: 'todo', title: 'To-do list', hint: 'Tasks with check boxes', keywords: 'todo task checkbox check [ ]', insert: '- [ ] ' },
    { id: 'quote', title: 'Quote', hint: 'Set a passage apart', keywords: 'blockquote cite >', insert: '> ' },
    { id: 'callout', title: 'Callout', hint: 'A note that stands out', keywords: 'note tip info warning highlight', insert: '> 💡 ' },
    { id: 'code', title: 'Code block', hint: 'Code in a fixed font', keywords: 'code snippet fence ```', insert: '```\n\n```', caret: 4 },
    { id: 'divider', title: 'Divider', hint: 'A horizontal rule', keywords: 'hr rule line separator ---', insert: '---' },
    { id: 'table', title: 'Table', hint: 'Rows and columns', keywords: 'grid columns rows', insert: '| Column 1 | Column 2 |\n| --- | --- |\n|  |  |', caret: 39 },
    { id: 'image', title: 'Image', hint: 'A picture from a path or a link', keywords: 'picture photo img', insert: '![](path/to/image.png)', caret: 2 },
    { id: 'link', title: 'Link', hint: 'A link to a page or a file', keywords: 'url href anchor', insert: '[text](https://)', caret: 1 },
    { id: 'toc', title: 'Table of contents', hint: 'Links to the headings of the page', keywords: 'contents outline index', insert: '[[toc]]' },
];

/** The items that match what is typed after the `/`: every word in the title or keywords; the ones that start with it first. */
export function filterSlash(query: string, items: SlashItem[] = SLASH_ITEMS): SlashItem[] {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { return items; }
    const hay = (i: SlashItem): string => (i.title + ' ' + i.keywords).toLowerCase();
    const hit = items.filter(i => words.every(w => hay(i).includes(w)));
    const starts = (i: SlashItem): number => (i.title.toLowerCase().startsWith(words[0]) || i.id.startsWith(words[0]) ? 0 : 1);
    return hit.sort((a, b) => starts(a) - starts(b));
}

/**
 * The slash being typed at the caret: the text before the caret has a `/` at the start of the block or after a space, followed by letters
 * with no space. Returns where it starts and what was typed after it, or undefined when no menu is wanted.
 */
export function slashAt(text: string, caret: number): { start: number; query: string } | undefined {
    const before = text.slice(0, caret);
    const s = before.lastIndexOf('/');
    if (s < 0) { return undefined; }
    if (s > 0 && !/\s/.test(before[s - 1])) { return undefined; }
    const query = before.slice(s + 1);
    if (/\s/.test(query) || query.length > 20) { return undefined; }
    return { start: s, query };
}
