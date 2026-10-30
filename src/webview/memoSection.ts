/**
 * "Memo" tab of the sidebar: Markdown notes (a main one and as many as you create), to keep the daily,
 * repetitive actions at hand. Edit as text or read the preview; fenced code
 * blocks can be copied or inserted at the cursor, task boxes ticked.
 *
 * Pure: builds markup from plain data (the extension supplies the text).
 */
import { renderMemo } from '../utils/memoMarkdown';

export type MemoMode = 'edit' | 'preview';

export interface MemoView {
    /** Every memo of the folder, `main` first. */
    names: { id: string; label: string; filled: boolean }[];
    selected: string;
    mode: MemoMode;
    text: string;
    /** Where the memo lives, for the tooltip. */
    file: string;
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const MEMO_PLACEHOLDER = '# Daily actions\n\n- [ ] Pull and build\n- [ ] Run the tests\n\n## Release\n\n```bash\nnpm run build\n```\n\nWrite Markdown here: as many memos as you want, saved as you type.';

export function memoCss(): string {
    return `
.memo .mbar { display: flex; gap: 4px; align-items: center; margin-bottom: 6px; }
.memo .mbar .grow { flex: 1; }
.mlist { display: flex; flex-direction: column; gap: 1px; margin-bottom: 6px; max-height: 150px; overflow-y: auto; border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.35)); border-radius: 4px; padding: 2px; }
.mitem { display: flex; align-items: center; gap: 5px; width: 100%; text-align: left; padding: 3px 6px; border: none; border-radius: 3px; background: transparent; color: var(--vscode-foreground); cursor: pointer; font-size: 12px; font-family: inherit; }
.mitem:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.2)); }
.mitem.active { background: var(--vscode-list-activeSelectionBackground, #094771); color: var(--vscode-list-activeSelectionForeground, #fff); }
.mitem .mname { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mitem .mempty { font-size: 10px; opacity: 0.6; }
.mitem.mnew { color: var(--vscode-textLink-foreground, #3794ff); }
.memo-text { width: 100%; min-height: 260px; height: 46vh; resize: vertical; padding: 6px 8px; font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; line-height: 1.45; tab-size: 2; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; }
.memo-text:focus { outline: 1px solid var(--vscode-focusBorder, #007fd4); }
.memo-preview { font-size: 12px; line-height: 1.5; }
.memo-preview h3, .memo-preview h4, .memo-preview h5, .memo-preview h6 { margin: 10px 0 4px; font-weight: 600; }
.memo-preview h3 { font-size: 15px; } .memo-preview h4 { font-size: 13px; } .memo-preview h5, .memo-preview h6 { font-size: 12px; }
.memo-preview p { margin: 4px 0; }
.memo-preview ul, .memo-preview ol { margin: 4px 0 4px 18px; padding: 0; }
.memo-preview li.mtask { list-style: none; margin-left: -16px; }
.memo-preview li .done { text-decoration: line-through; opacity: 0.6; }
.memo-preview blockquote { margin: 4px 0; padding: 2px 8px; border-left: 3px solid var(--vscode-textBlockQuote-border, rgba(128,128,128,0.5)); color: var(--vscode-descriptionForeground); }
.memo-preview hr { border: none; border-top: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); margin: 8px 0; }
.memo-preview code { font-family: var(--vscode-editor-font-family, monospace); background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.18)); padding: 0 3px; border-radius: 3px; }
.memo-preview a { color: var(--vscode-textLink-foreground, #3794ff); cursor: pointer; }
.mcode { margin: 6px 0; border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); border-radius: 4px; overflow: hidden; }
.mcode-bar { display: flex; gap: 4px; align-items: center; padding: 2px 4px; background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.12)); }
.mcode-bar .mlang { flex: 1; font-size: 10px; color: var(--vscode-descriptionForeground); text-transform: uppercase; letter-spacing: 0.5px; }
.mbtn { padding: 0 7px; font-size: 10px; line-height: 16px; border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; background: transparent; color: var(--vscode-foreground); cursor: pointer; }
.mbtn:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.2)); }
.mcode pre { margin: 0; padding: 6px 8px; overflow-x: auto; font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.08)); }
.mcode pre code { background: transparent; padding: 0; }
`;
}

export function memoHtml(v: MemoView): string {
    const list = v.names.map(n => `<button class="mitem${n.id === v.selected ? ' active' : ''}" data-memo-pick="${esc(n.id)}" title="${esc(n.id)}.md${n.filled ? '' : ' (empty)'}" role="option" aria-selected="${n.id === v.selected}">📝 <span class="mname">${esc(n.label)}</span>${n.filled ? '' : '<span class="mempty">empty</span>'}</button>`).join('');
    let html = `<div class="memo" data-lang="${esc(v.selected)}">`
        + `<div class="mlist" id="memoList" role="listbox" aria-label="Memos">${list}<button class="mitem mnew" id="memoNew" title="Create a memo: any name, as many as you want">＋ New memo</button></div>`
        + `<div class="mbar"><button class="subtab${v.mode === 'edit' ? ' active' : ''}" data-memo-mode="edit">Edit</button>`
        + `<button class="subtab${v.mode === 'preview' ? ' active' : ''}" data-memo-mode="preview">Preview</button>`
        + `<span class="grow"></span><button class="mbtn" id="memoPage" title="Open ${esc(v.file)} as a page: read it, tick the tasks, write blocks with / as in Notion">📖 Open as page</button>`
        + `<button class="mbtn" id="memoOpen" title="Open ${esc(v.file)} as text in the editor">📝 Text</button>`
        + (v.selected === 'main' ? '' : `<button class="mbtn" id="memoDelete" title="Move this memo to the trash">🗑</button>`) + `</div>`;
    if (v.mode === 'edit') {
        html += `<textarea id="memoText" class="memo-text" spellcheck="false" placeholder="${esc(MEMO_PLACEHOLDER)}">${esc(v.text)}</textarea>`
            + `<div class="tool-note" id="memoState">Markdown, saved as you type. Tab indents.</div>`;
    } else if (v.text.trim()) {
        html += `<div class="memo-preview">${renderMemo(v.text).html}</div>`;
    } else {
        html += `<p class="empty-section">Nothing written in this memo yet: switch to <b>Edit</b> and note what you want to keep at hand.</p>`;
    }
    return html + `</div>`;
}

/** JS defining `initMemo(api)`: autosave while typing, the choice of the memo, mode switches, and the preview's buttons. */
export function memoScript(): string {
    return `
function initMemo(api) {
    var root = document.querySelector('.memo');
    if (!root) { return; }
    var lang = root.getAttribute('data-lang');
    var ta = document.getElementById('memoText');
    var state = document.getElementById('memoState');
    var timer = null;
    function save() {
        if (!ta) { return; }
        if (timer) { clearTimeout(timer); timer = null; }
        api.postMessage({ command: 'memoSave', lang: lang, text: ta.value });
        if (state) { state.textContent = 'Saved'; }
    }
    if (ta) {
        ta.addEventListener('input', function () {
            if (state) { state.textContent = 'Typing…'; }
            if (timer) { clearTimeout(timer); }
            timer = setTimeout(save, 400);
        });
        ta.addEventListener('blur', save);
        ta.addEventListener('keydown', function (e) {
            if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                var s = ta.selectionStart, t = ta.selectionEnd;
                ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(t);
                ta.selectionStart = ta.selectionEnd = s + 2;
                ta.dispatchEvent(new Event('input'));
            }
        });
    }
    document.querySelectorAll('[data-memo-pick]').forEach(function (b) {
        b.addEventListener('click', function () { save(); api.postMessage({ command: 'memoLang', id: b.getAttribute('data-memo-pick') }); });
    });
    var mnew = document.getElementById('memoNew');
    if (mnew) { mnew.addEventListener('click', function () { save(); api.postMessage({ command: 'memoNew' }); }); }
    var mpage = document.getElementById('memoPage');
    if (mpage) { mpage.addEventListener('click', function () { save(); api.postMessage({ command: 'memoPage', lang: lang }); }); }
    var mdel = document.getElementById('memoDelete');
    if (mdel) { mdel.addEventListener('click', function () { api.postMessage({ command: 'memoDelete', lang: lang }); }); }
    document.querySelectorAll('[data-memo-mode]').forEach(function (b) {
        b.addEventListener('click', function () { save(); api.postMessage({ command: 'memoMode', mode: b.getAttribute('data-memo-mode') }); });
    });
    var open = document.getElementById('memoOpen');
    if (open) { open.addEventListener('click', function () { save(); api.postMessage({ command: 'memoOpen', lang: lang }); }); }
    document.querySelectorAll('[data-memo-copy]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'memoCopy', index: Number(b.getAttribute('data-memo-copy')) }); });
    });
    document.querySelectorAll('[data-memo-insert]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'memoInsert', index: Number(b.getAttribute('data-memo-insert')) }); });
    });
    document.querySelectorAll('[data-memo-line]').forEach(function (c) {
        c.addEventListener('change', function () {
            var sp = c.parentNode ? c.parentNode.querySelector('span') : null;
            if (sp) { sp.classList.toggle('done', c.checked); }
            api.postMessage({ command: 'memoToggle', line: Number(c.getAttribute('data-memo-line')) });
        });
    });
    document.querySelectorAll('[data-memo-link]').forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); api.postMessage({ command: 'memoLink', url: a.getAttribute('data-memo-link') }); });
    });
}
`;
}
