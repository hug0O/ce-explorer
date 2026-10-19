/**
 * "Memo" tab of the sidebar: Markdown notes per language, to keep the daily,
 * repetitive actions at hand. Edit as text or read the preview; fenced code
 * blocks can be copied or inserted at the cursor, task boxes ticked.
 *
 * Pure: builds markup from plain data (the extension supplies the text).
 */
import { renderMemo } from '../utils/memoMarkdown';

export type MemoMode = 'edit' | 'preview';

export interface MemoView {
    langs: { id: string; label: string }[];
    selected: string;
    /** The language follows the file being edited (rather than a fixed choice). */
    follow: boolean;
    mode: MemoMode;
    text: string;
    /** Where the memo lives, for the tooltip. */
    file: string;
}

/** Entry of the language list meaning "the language of the active file". */
export const FOLLOW_ID = '__follow__';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const MEMO_PLACEHOLDER = '# Daily actions\n\n- [ ] Pull and build\n- [ ] Run the tests\n\n## Release\n\n```bash\nnpm run build\n```\n\nWrite Markdown here: one memo per language, saved as you type.';

export function memoCss(): string {
    return `
.memo .mbar { display: flex; gap: 4px; align-items: center; margin-bottom: 6px; }
.memo .mbar .grow { flex: 1; }
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
    const followLabel = v.langs.find(l => l.id === v.selected)?.label ?? v.selected;
    const options = [`<option value="${FOLLOW_ID}"${v.follow ? ' selected' : ''}>↻ Language of the active file (${esc(followLabel)})</option>`]
        .concat(v.langs.map(l => `<option value="${esc(l.id)}"${!v.follow && l.id === v.selected ? ' selected' : ''}>${esc(l.label)}</option>`));
    let html = `<div class="memo" data-lang="${esc(v.selected)}">`
        + `<div class="mbar"><select id="memoLang" class="tool-select" title="One memo per language">${options.join('')}</select></div>`
        + `<div class="mbar"><button class="subtab${v.mode === 'edit' ? ' active' : ''}" data-memo-mode="edit">Edit</button>`
        + `<button class="subtab${v.mode === 'preview' ? ' active' : ''}" data-memo-mode="preview">Preview</button>`
        + `<span class="grow"></span><button class="mbtn" id="memoOpen" title="Open ${esc(v.file)} in the editor">📝 Open .md</button></div>`;
    if (v.mode === 'edit') {
        html += `<textarea id="memoText" class="memo-text" spellcheck="false" placeholder="${esc(MEMO_PLACEHOLDER)}">${esc(v.text)}</textarea>`
            + `<div class="tool-note" id="memoState">Markdown, saved as you type. Tab indents.</div>`;
    } else if (v.text.trim()) {
        html += `<div class="memo-preview">${renderMemo(v.text).html}</div>`;
    } else {
        html += `<p class="empty-section">Nothing written for this language yet: switch to <b>Edit</b> and note the actions you repeat every day.</p>`;
    }
    return html + `</div>`;
}

/** JS defining `initMemo(api)`: autosave while typing, language / mode switches, and the preview's buttons. */
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
    var sel = document.getElementById('memoLang');
    if (sel) { sel.addEventListener('change', function () { save(); api.postMessage({ command: 'memoLang', id: sel.value }); }); }
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
