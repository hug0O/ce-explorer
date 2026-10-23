/**
 * The user guide: topics with a few words, the keys, and a picture or an animation (media/guide, made by tools/guide).
 * The same list feeds the sidebar (a folded "Changelog + Guide" section with one line per topic) and the guide page
 * (a webview panel with the pictures at full size). Pure: builds markup from plain data, so it is testable without VS Code.
 */

export interface GuideTopic {
    id: string;
    title: string;
    /** One line, for the sidebar. */
    summary: string;
    /** Paragraphs of the page, `code` and **bold** allowed. */
    body: string[];
    keys?: { keys: string; what: string }[];
    /** File of media/guide: a .gif plays, a .png is still. */
    media?: string;
}

export const GUIDE: GuideTopic[] = [
    {
        id: 'start', title: 'Open the form designer', summary: 'Draw a Delphi form: where it is and how it is laid out', media: 'designer.png',
        body: [
            'Open a `.pas` or a `.dfm` and press `Ctrl+K D`, or use the **🎨 Designer** button (title bar, sidebar tab bar), **Form Designer** in the status bar, or right-click the file.',
            'The **component list** and the **palette** are on the left, the form in the middle, the **inspector** on the right (hide each with `P` / `I`, full screen with `F`). Everything you do is written into the `.dfm` and the unit the way the IDE writes it, and `Ctrl+Z` undoes it. A component the designer does not know is drawn as a placeholder and its properties are left untouched.',
        ],
        keys: [{ keys: 'Ctrl+K D', what: 'open the designer' }, { keys: 'Ctrl+K Ctrl+B', what: 'designer ⇄ code' }, { keys: 'Ctrl+S', what: 'save the .dfm and the unit' }, { keys: 'Ctrl+K F', what: 'full screen of the designer' }],
    },
    {
        id: 'add', title: 'Add a component', summary: 'Pick it in the palette, click on the form', media: 'add-component.gif',
        body: [
            'Pick a component in the **palette** (the type list switches between Standard, Data, DevExpress, TMS…; the filter searches all of them), then **click** on the form, or **draw** the size you want. The field in the unit, the object in the `.dfm` and a free name are created together.',
            'Double-click a component to create (or open) its default handler; the **Events** list of the inspector creates any other. Delphi menus, grid levels, tiles and fields go inside their own host: select it first.',
        ],
    },
    {
        id: 'magnetism', title: 'Magnetism and guide lines', summary: 'Components catch their neighbours’ edges and centres', media: 'magnetism.gif',
        body: [
            'When you move or resize a component it is pulled to the **edges and centres** of the others and of its container, and to the **equal gaps** its neighbours have. Thin pink guide lines (and the gaps, measured) show what lines up.',
            'The 🧲 **Snap** button turns it off, its drop-down chooses what is caught; hold `Alt` while dragging to move freely.',
        ],
        keys: [{ keys: 'Alt + drag', what: 'move without magnetism' }, { keys: 'Arrows', what: 'nudge by 1 px (Shift: grid step, Ctrl: resize)' }],
    },
    {
        id: 'multi', title: 'Several components at once', summary: 'Ctrl + click, then edit what they share', media: 'multi-selection.gif',
        body: [
            '`Ctrl` or `Shift` + click adds to the selection (on the form or in the list); drag a rectangle to select the ones inside; `Ctrl+A` selects all the siblings.',
            'With several components selected the inspector shows **Common properties** (position, size, Align, Anchors, Visible, Enabled, colours, Hint): a value is shown when they all agree, blank or undetermined when they differ, and a change goes to every one of them in one undo step. The align icons of the toolbar work on the selection too.',
        ],
    },
    {
        id: 'find', title: 'Find in the form', summary: 'Ctrl+F: name, class, caption, handler', media: 'find.gif',
        body: ['`Ctrl+F` opens a small bar: type part of a name, a class, a caption or an event handler; the matches are marked and `Enter` goes to the next one.'],
        keys: [{ keys: 'Ctrl+F', what: 'find in the form' }, { keys: 'Enter', what: 'next match' }],
    },
    {
        id: 'view', title: 'The View menu', summary: 'Names, TabOrder numbers, rulers, themes, groups, lock', media: 'view-menu.gif',
        body: [
            'One **👁 View** menu keeps the toolbar clear: names of the components, outline of the containers, **TabOrder numbers** (duplicates in red; *Renumber TabOrder by position* fixes the order), **rulers**, and a **theme preview** (light, dark, blue, contrast) for DevExpress forms.',
            'It also holds **named groups of components** (save a selection, select it again with a click) and the actions below. **Lock** (`Ctrl+L`) protects a component from being moved, **hide** (`Ctrl+H`) takes it out of the way, only in the designer. Hover a ⚡ badge to read the first lines of the handler.',
        ],
        keys: [{ keys: 'Ctrl+L', what: 'lock / unlock the selection' }, { keys: 'Ctrl+H', what: 'hide the selection' }],
    },
    {
        id: 'compare', title: 'Compare with a git version', summary: 'What changed since a commit, drawn on the form', media: 'compare-git.gif',
        body: ['**View › Compare with a git version…** asks for `HEAD`, a branch, a tag or a commit and marks on the form what was **added** (green), **changed** (blue), **moved or resized** (orange); a component that was **removed** is drawn as a dashed red ghost where it used to be. A thin bar counts them; hover a component for the list of its changes.'],
    },
    {
        id: 'sizes', title: 'Test other form sizes', summary: 'What Align and Anchors do, what goes out or overlaps', media: 'form-sizes.gif',
        body: ['**View › Test other form sizes…** shows the form at 640×480 … 1920×1080 or any size, laid out the way `Align` and `Anchors` would, and marks in red what the new size breaks: a component pushed out of its container, or two that now overlap. Nothing is written to the `.dfm`.'],
    },
    {
        id: 'menus', title: 'Menus', summary: 'TPopupMenu, TMainMenu, items, shortcuts, preview', media: 'menus.gif',
        body: [
            '`TPopupMenu` and `TMainMenu` are in the palette (System). Select a menu to see a **preview** and add items; select an item to edit its caption (`&` marks the access key, `-` is a separator), **shortcut** (typed as `Ctrl+Shift+S`, stored as the number the IDE uses), checked / radio / default / enabled / visible and image, or to add sub-items and separators.',
            'Items are listed under their menu in the component list; deleting an item deletes its sub-items.',
        ],
    },
    {
        id: 'sidebar', title: 'The sidebar', summary: 'Structure, Tools, Memo, Shortcuts, Changelog + Guide',
        body: [
            'The **Code Explorer** sidebar has a tab per job: **Details** (the member under the cursor), **Structure** (members of the file: add, filter, rename, move, delete, usages), **Tools** (align, generate, review — with a *Language of this file* drop-down), **Memo** (Markdown notes per language) and **Shortcuts** (every key, by mode). Below it, a **Changelog + Guide** view of its own, folded until you open it, holds this guide and the changelog.',
            'The **Project panel** (command palette: *CE: Project Insights*) adds project-wide views: the SQL of the project, unused code, checks between `.pas` and `.dfm`, the semantic `.dfm` diff.',
        ],
    },
];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** `code` and **bold** in a line of text. */
export function inline(text: string): string {
    return esc(text).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>');
}

/** The sidebar: one line per topic, each opening the guide at that topic. */
export function guideListHtml(topics: GuideTopic[] = GUIDE): string {
    const rows = topics.map(t =>
        `<button class="clog-topic" data-guide="${esc(t.id)}" title="${esc(t.summary)}"><span class="clog-ti">${t.media?.endsWith('.gif') ? '🎞' : t.media ? '🖼' : '📖'}</span><span class="clog-tt">${esc(t.title)}</span></button>`).join('');
    return `<details class="clog-ver clog-guide" open><summary><span class="clog-v">Guide</span><span class="clog-d">${topics.length} topics</span></summary>${rows}<button class="clog-topic clog-all" data-guide="">Open the full guide with pictures and animations</button></details>`;
}

export interface GuidePage { nonce: string; cspSource: string; media: (file: string) => string; topic?: string }

/** The guide page (a webview panel): every topic with its picture at full size. */
export function guidePageHtml(page: GuidePage, topics: GuideTopic[] = GUIDE): string {
    const toc = topics.map(t => `<a href="#${esc(t.id)}">${esc(t.title)}</a>`).join('');
    const sections = topics.map(t => {
        const media = t.media ? `<figure><img src="${esc(page.media(t.media))}" alt="${esc(t.title)}" ${t.media.endsWith('.gif') ? 'class="gif" title="Click to replay"' : ''}></figure>` : '';
        const keys = t.keys?.length ? `<table class="keys">${t.keys.map(k => `<tr><td>${k.keys.split(/ \+ | /).filter(Boolean).map(x => `<kbd>${esc(x)}</kbd>`).join(' ')}</td><td>${esc(k.what)}</td></tr>`).join('')}</table>` : '';
        return `<section id="${esc(t.id)}"><h2>${esc(t.title)}</h2>${t.body.map(p => `<p>${inline(p)}</p>`).join('')}${media}${keys}</section>`;
    }).join('');
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${page.cspSource} data:; style-src 'nonce-${page.nonce}'; script-src 'nonce-${page.nonce}';">
<title>Code Explorer guide</title>
<style nonce="${page.nonce}">
body { font-family: var(--vscode-font-family, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); margin: 0; padding: 0 24px 60px; line-height: 1.55; }
main { max-width: 980px; margin: 0 auto; }
h1 { font-size: 24px; margin: 22px 0 4px; font-weight: 600; }
.lead { color: var(--vscode-descriptionForeground); margin: 0 0 14px; }
nav { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 26px; position: sticky; top: 0; padding: 8px 0; background: var(--vscode-editor-background); z-index: 5; border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.3)); }
nav a { padding: 2px 10px; border-radius: 12px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); text-decoration: none; font-size: 12px; }
nav a:hover { filter: brightness(1.15); }
section { margin: 0 0 42px; scroll-margin-top: 56px; }
h2 { font-size: 18px; margin: 0 0 6px; font-weight: 600; }
section:target h2 { color: var(--vscode-textLink-foreground, #3794ff); }
p { margin: 6px 0; }
code { font-family: var(--vscode-editor-font-family, monospace); font-size: 0.92em; padding: 0 4px; border-radius: 3px; background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.15)); }
figure { margin: 12px 0; }
img { max-width: 100%; height: auto; border: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.35)); border-radius: 6px; display: block; }
img.gif { cursor: pointer; }
.keys { border-collapse: collapse; margin: 8px 0; }
.keys td { padding: 2px 14px 2px 0; vertical-align: baseline; }
kbd { font-family: var(--vscode-editor-font-family, monospace); font-size: 11.5px; padding: 1px 6px; border: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.6)); border-bottom-width: 2px; border-radius: 4px; background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.12)); }
</style></head><body><main>
<h1>Code Explorer — user guide</h1>
<p class="lead">The form designer, shown on a small customer form. Click an animation to replay it.</p>
<nav>${toc}</nav>
${sections}
</main>
<script nonce="${page.nonce}">
document.querySelectorAll('img.gif').forEach(function (i) { i.addEventListener('click', function () { var s = i.getAttribute('src'); i.removeAttribute('src'); setTimeout(function () { i.setAttribute('src', s); }, 30); }); });
var want = ${JSON.stringify(page.topic ?? '')};
window.addEventListener('load', function () { if (want) { var t = document.getElementById(want); if (t) { t.scrollIntoView(); } } });
</script></body></html>`;
}
