/**
 * Sidebar "Tools" section shared by the Member view's pages: align the
 * selection on a string, the Delphi layout tools, the Oracle PL/SQL tools.
 * Every button that has a keyboard shortcut shows it, so nobody has to look
 * for it (the shortcuts are declared in package.json and listed here).
 *
 * The markup is static.
 */

function escapeAttr(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const DEFAULT_ALIGN_CHIPS = [':=', ':', '=', '=>', '//', ','];

/** Keeps user-supplied align strings sane: trimmed, 1-24 chars, unique, at most 40. */
export function sanitizeChips(value: unknown): string[] {
    if (!Array.isArray(value)) { return [...DEFAULT_ALIGN_CHIPS]; }
    const out: string[] = [];
    for (const v of value) {
        if (typeof v !== 'string') { continue; }
        const t = v.trim();
        if (t.length >= 1 && t.length <= 24 && !out.includes(t)) { out.push(t); }
        if (out.length >= 40) { break; }
    }
    return out;
}

/**
 * Keyboard shortcuts of the tools: `Ctrl+K` then one letter. The same letter can serve both
 * families because each one only exists in its own files (Delphi units / PL/SQL sources), see the
 * `when` clauses of the keybindings in package.json, which a test keeps in step with this table.
 */
export type ShortcutFamily = 'delphi' | 'plsql' | 'global';
export const TOOL_SHORTCUTS: Record<ShortcutFamily, Record<string, string>> = {
    delphi: {
        'ce.delphi.designer': 'd', 'ce.delphi.align': 'l', 'ce.delphi.anchors': 'n', 'ce.delphi.tabOrder': 't',
        'ce.delphi.check': 'c', 'ce.delphi.cleanHandlers': 'h', 'ce.delphi.copy': 'y', 'ce.delphi.paste': 'a',
        'ce.delphi.duplicate': 'k', 'ce.delphi.formFromFields': 'g', 'ce.delphi.formFromClass': 'q', 'ce.delphi.changeClass': 'e',
        'ce.delphi.diffForm': 'b',
    },
    plsql: {
        'ce.plsql.syncPackage': 'y', 'ce.plsql.newPackage': 'n', 'ce.plsql.extractProcedure': 'x',
        'ce.plsql.exceptionBlock': 'e', 'ce.plsql.docHeader': 'd', 'ce.plsql.utplsql': 't', 'ce.plsql.findCallers': 'l',
        'ce.plsql.sqlFromTable': 'g',
    },
    global: { 'ce.alignSelection': 'j', 'ce.delphi.project': 'i' },
};

/** Shortcuts that are not "Ctrl+K letter", shown as they are (Structure, Memo). */
export const FIXED_SHORTCUTS: Record<string, string> = {
    'ce.manageMembers': 'Ctrl+K Ctrl+M',
    'ce.editMember': 'Ctrl+K Ctrl+E',
    'ce.showActions': 'Ctrl+K Ctrl+A',
    'ce.delphi.toggleDesigner': 'Ctrl+K Ctrl+B',
    'ce.memo.open': 'Ctrl+K Ctrl+N',
};

export function shortcutOf(family: ShortcutFamily, command: string): string {
    const k = TOOL_SHORTCUTS[family][command];
    return k ? 'Ctrl+K ' + k.toUpperCase() : (FIXED_SHORTCUTS[command] ?? '');
}

/** `<span class="kbd">Ctrl+K D</span>`, or nothing when the command has no shortcut. */
export function kbdHtml(family: ShortcutFamily, command: string): string {
    const s = shortcutOf(family, command);
    return s ? `<span class="kbd" title="Keyboard shortcut (works in the editor)">${escapeAttr(s)}</span>` : '';
}

export function toolsCss(): string {
    return `
.tabs { display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: 10px; border-bottom: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); }
.tab { background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--vscode-descriptionForeground); padding: 5px 8px; cursor: pointer; font-size: 12px; font-family: inherit; }
.tabdes { margin-left: auto; align-self: center; padding: 2px 8px; font-size: 11px; font-family: inherit; border-radius: 10px; cursor: pointer; border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.45)); background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.15)); color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); }
.tabdes:hover { background: var(--vscode-button-secondaryHoverBackground, rgba(127,127,127,0.25)); }
.tab.active { color: var(--vscode-foreground); border-bottom-color: var(--vscode-focusBorder, #007fd4); font-weight: 600; }
.tab:hover { color: var(--vscode-foreground); }
.section { margin-bottom: 12px; }
.analyze-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.divider { height: 1px; background: var(--vscode-input-border, rgba(128,128,128,0.3)); margin: 10px 0; }
.empty-section { color: var(--vscode-descriptionForeground); font-style: italic; }
.mlist, .var-list { list-style: none; padding: 0; }
.mrow { display: flex; align-items: center; gap: 5px; padding: 3px 4px; border-radius: 3px; font-size: 12px; }
.mrow:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.15)); }
.mrow.sel { background: var(--vscode-list-activeSelectionBackground, rgba(0,127,212,0.25)); }
.mrow .mname { cursor: pointer; font-family: var(--vscode-editor-font-family, monospace); }
.mrow .mname:hover { text-decoration: underline; }
.mrow .mtype { color: var(--vscode-descriptionForeground); font-family: var(--vscode-editor-font-family, monospace); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.var-row { display: flex; align-items: center; gap: 4px; padding: 3px 0; font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; }
.var-actions { margin-left: auto; display: flex; gap: 2px; }
.var-btn { background: transparent; border: none; cursor: pointer; font-size: 13px; padding: 1px 3px; line-height: 1; }
.var-btn:hover { filter: brightness(1.3); }
.tool-row { display: flex; gap: 4px; margin-bottom: 4px; }
.tool-row.wrap { flex-wrap: wrap; }
.inp { flex: 1; min-width: 0; padding: 3px 6px; font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; }
.inp:focus { outline: 1px solid var(--vscode-focusBorder, #007fd4); }
.chips { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px; }
.chip { padding: 1px 8px; font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 10px; background: transparent; color: var(--vscode-foreground); cursor: pointer; }
.chip.add { border-style: dashed; }
.chip .x { margin-left: 4px; opacity: 0.5; }
.chip .x:hover { opacity: 1; color: var(--vscode-errorForeground, #f48771); }
.chip:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.2)); }
.lang-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 10px; }
.lang-row .tool-label { margin: 0; }
.lang-row select { flex: 1; min-width: 120px; }
.lang-every { font-size: 11px; display: inline-flex; align-items: center; gap: 4px; color: var(--vscode-descriptionForeground); }
.tool-label { font-size: 11px; color: var(--vscode-descriptionForeground); margin: 6px 0 2px; }
.tool-select { width: 100%; padding: 3px 4px; font-size: 12px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border, rgba(128,128,128,0.4)); border-radius: 3px; }
.tool-note { font-size: 11px; color: var(--vscode-descriptionForeground); font-style: italic; margin: 4px 0; }
.tool-primary { width: 100%; margin-top: 8px; padding: 5px 8px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-family: inherit; background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.tool-primary:hover { background: var(--vscode-button-hoverBackground); }
.tools-block { margin-bottom: 14px; }
.subtabs { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
.subtab { padding: 2px 11px; border-radius: 12px; border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.45)); background: transparent; color: var(--vscode-foreground); font-size: 11px; cursor: pointer; }
.subtab:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.2)); }
.subtab.active { background: var(--vscode-button-background, #0e639c); color: var(--vscode-button-foreground, #fff); border-color: transparent; font-weight: 600; }
[hidden] { display: none; }
.ana.w-auto { width: auto; }
.ana.tool-lead { margin-bottom: 6px; font-weight: 600; }
.mt4 { margin-top: 4px; }
.mt10 { margin-top: 10px; }
.tool-select.grow { flex: 1; }
.inp.narrow { max-width: 64px; }
.ana.has-kbd { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; column-gap: 6px; }
.kbd { font-family: var(--vscode-editor-font-family, monospace); font-size: 9px; line-height: 14px; padding: 0 5px; border-radius: 3px; border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.45)); background: var(--vscode-keybindingLabel-background, rgba(128,128,128,0.17)); color: var(--vscode-keybindingLabel-foreground, var(--vscode-descriptionForeground)); white-space: nowrap; margin-left: auto; }
`;
}

export const PLSQL_COMMANDS = [
    'ce.plsql.syncPackage', 'ce.plsql.newPackage', 'ce.plsql.sqlFromTable', 'ce.plsql.utplsql',
    'ce.plsql.exceptionBlock', 'ce.plsql.extractProcedure', 'ce.plsql.docHeader', 'ce.plsql.findCallers',
];
export const DELPHI_COMMANDS = [
    'ce.delphi.designer',
    'ce.delphi.align',
    'ce.delphi.anchors',
    'ce.delphi.tabOrder',
    'ce.delphi.check',
    'ce.delphi.cleanHandlers',
    'ce.delphi.copy',
    'ce.delphi.paste',
    'ce.delphi.duplicate',
    'ce.delphi.formFromFields',
    'ce.delphi.formFromClass',
    'ce.delphi.changeClass',
    'ce.delphi.diffForm',
];
/** Commands that work on any language: they are offered on every page of the Tools tab that needs them. */
export const COMMON_COMMANDS = ['ce.delphi.project', 'ce.blueprint.open', 'ce.blueprint.project'];
export const PLSQL_ALIGN_IDS = ['params', 'assign', 'arrow', 'comment', 'alias', 'values'];

function plsqlBlock(): string {
    const btn = (cmd: string, label: string, title: string) => `<button class="ana has-kbd" data-pl="${cmd}" title="${escapeAttr(title)}">${label}${kbdHtml('plsql', cmd)}</button>`;
    const chip = (id: string, label: string, title: string) => `<button class="chip" data-pa="${id}" title="${escapeAttr(title)}">${escapeAttr(label)}</button>`;
    return `
<div class="tools-block" id="plBlock">
<div class="section-title">PL/SQL (Oracle)</div>
<div class="analyze-grid">
${btn('ce.plsql.syncPackage', '🔄 Sync spec ⇄ body', 'Declare / stub / fix signatures between the .pks and the .pkb')}
${btn('ce.plsql.newPackage', '📦 New package…', 'Spec + body skeleton')}
${btn('ce.plsql.sqlFromTable', '🧾 SQL from table', 'SELECT / INSERT / UPDATE / DELETE / MERGE, values replaceable by parameters')}
${btn('ce.plsql.extractProcedure', '✂️ Extract procedure', 'Selection → procedure with detected IN / OUT parameters')}
${btn('ce.plsql.exceptionBlock', '⚠️ Exception block', 'NO_DATA_FOUND / TOO_MANY_ROWS / OTHERS')}
${btn('ce.plsql.docHeader', '📘 PLDoc header', 'Insert or refresh the /** … */ block from the signature')}
${btn('ce.plsql.utplsql', '🧪 utPLSQL tests', 'Test package generated from the spec')}
${btn('ce.plsql.findCallers', '🔎 Find callers', 'References across the workspace')}
<button class="ana" data-review="1" title="Oracle review rules">✅ Review (Oracle)</button>
</div>
<div class="tool-label">Align the selection as…</div>
<div class="chips">
${chip('params', 'Parameters', 'name | IN / OUT | type')}${chip('values', 'Declarations', 'name | type | := value')}${chip('assign', ':=', 'assignments')}${chip('arrow', '=>', 'named arguments')}${chip('comment', '--', 'trailing comments')}${chip('alias', 'AS', 'column aliases')}
</div>
</div>
`;
}

function delphiBlock(): string {
    const btn = (cmd: string, label: string, title: string) => `<button class="ana has-kbd" data-dl="${cmd}" title="${escapeAttr(title)}">${label}${kbdHtml('delphi', cmd)}</button>`;
    return `
<div class="tools-block" id="dlBlock">
<div class="section-title">Delphi form</div>
<div class="analyze-grid">
${btn('ce.delphi.project', '🗂️ Project insights', 'The SQL of the project, units and components nothing uses, the checks of every form (read on demand)')}
</div>
<div class="tool-note">Anchors, duplicate, form check, handler cleanup, class change and form generation are in the designer's 🛠 Tools menu, with adding components and events.</div>
</div>
`;
}

export type ToolsSub = 'form' | 'plsql' | 'align' | 'analyze';

export const TOOLS_SUBS: ToolsSub[] = ['form', 'plsql', 'align', 'analyze'];

/** Analyze buttons of the member: they run on the whole active file, so they are always offered. */
function analyzeBlock(): string {
    return `
<div class="tools-block">
<div class="section-title">Analyze the file</div>
<div class="analyze-grid">
<button class="ana" data-ak="review">✅ Review</button>
<button class="ana" data-ak="documentation">📖 Doc</button>
<button class="ana" data-ak="export">📋 Export</button>
<button class="ana" data-ak="deadcode">💀 Dead Code</button>
</div>
</div>
<div class="tools-block">
<div class="section-title">Blueprint</div>
<div class="analyze-grid">
<button class="ana" data-common="ce.blueprint.open" title="The routines of this file as nodes, the calls as wires: drag to add a call, F2 to rename, flow of a routine">🗺️ File</button>
<button class="ana" data-common="ce.blueprint.project" title="The files of the project and the imports between them (the units and uses of a Delphi project, the imports of TypeScript, Python, Java, C#, Go, Rust, C/C++): double-click opens a file; Delphi wires can be dragged">🗺️ Project</button>
</div>
</div>
<div class="tools-block">
<div class="section-title">Project</div>
<button class="ana has-kbd tool-lead" data-common="ce.delphi.project" title="SQL, dead code, size and hotspots of every language, and the Delphi checks when the project has Delphi forms (read on demand)">🗂️ Project insights${kbdHtml('global', 'ce.delphi.project')}</button>
</div>`;
}

/** The sub-tabs relevant to the active file: Delphi tools only for a Delphi unit, PL/SQL tools only for PL/SQL. */
export function availableSubs(plsql: boolean, delphi: boolean): { id: ToolsSub; label: string }[] {
    const subs: { id: ToolsSub; label: string }[] = [];
    if (delphi) {
        subs.push({ id: 'form', label: 'Form' });
    }
    if (plsql) { subs.push({ id: 'plsql', label: 'PL/SQL' }); }
    subs.push({ id: 'align', label: 'Align' });
    subs.push({ id: 'analyze', label: 'Analyze' });
    return subs;
}

function alignBlock(alignToken: string, chipsJson: string): string {
    return `
<div class="tools-block">
<div class="section-title">Align selection</div>
<div class="tool-row">
<input id="alignToken" class="inp" value="${escapeAttr(alignToken)}" placeholder="text to align on, e.g. :=" spellcheck="false">
<button id="alignGo" class="ana has-kbd w-auto" title="Align the selected lines on the string">Align${kbdHtml('global', 'ce.alignSelection')}</button>
</div>
<div class="chips" id="chips" data-chips="${chipsJson}"></div>
<div class="tool-note">Click a string to use it, <b>+</b> saves the one typed above, <b>×</b> removes it. Select the lines in the editor, then click Align. Without a selection, the block of lines around the cursor is aligned.</div>
</div>`;
}

/**
 * The Tools tab, split into sub-tabs so that each set of tools has its own page:
 * Form (Delphi), PL/SQL, Align. Only the pages that make sense for the
 * active file are offered; `activeSub` is the one shown.
 */
/** What the language drop-down of the Tools tab shows. */
export interface LanguageInfo {
    options: { id: string; label: string }[];
    /** Chosen by hand, or '' for what the extension detects. */
    current: string;
    /** The label of what the extension detects on its own, or '' when it does not know the file. */
    detected: string;
    /** The extension of the file (`.inc`), '' when it has none. */
    ext: string;
    /** Whether the choice holds for every file with the extension. */
    byExtension: boolean;
}

function languageBlock(info: LanguageInfo): string {
    const auto = info.detected ? `Auto: ${info.detected}` : 'Auto: not recognised';
    const opts = [`<option value=""${info.current === '' ? ' selected' : ''}>${escapeAttr(auto)}</option>`,
        ...info.options.map(o => `<option value="${escapeAttr(o.id)}"${info.current === o.id ? ' selected' : ''}>${escapeAttr(o.label)}</option>`)].join('');
    const every = info.ext ? `<label class="lang-every" title="Apply the choice to every ${escapeAttr(info.ext)} file of this workspace"><input type="checkbox" id="langEvery"${info.byExtension ? ' checked' : ''}> every ${escapeAttr(info.ext)} file</label>` : '';
    return `<div class="lang-row"><label class="tool-label" for="langSel">Language of this file</label>
<select id="langSel" class="inp" title="Which language CE reads this file as: the tools of that language appear below">${opts}</select>${every}</div>`;
}

export function toolsHtml(alignToken: string, chipList: string[] = DEFAULT_ALIGN_CHIPS, plsql = false, delphi = false, activeSub = '', language?: LanguageInfo): string {
    const chipsJson = escapeAttr(JSON.stringify(chipList));
    const subs = availableSubs(plsql, delphi);
    const active = subs.some(s => s.id === activeSub) ? activeSub : subs[0].id;
    const pages: Record<ToolsSub, string> = {
        form: delphi ? delphiBlock() : '',
        plsql: plsql ? plsqlBlock() : '',
        align: alignBlock(alignToken, chipsJson),
        analyze: analyzeBlock(),
    };
    const bar = subs.length > 1
        ? `<div class="subtabs">${subs.map(s => `<button class="subtab${s.id === active ? ' active' : ''}" data-sub-tab="${s.id}">${s.label}</button>`).join('')}</div>`
        : '';
    const body = subs.map(s => `<div data-sub="${s.id}"${s.id === active ? '' : ' hidden'}>${pages[s.id]}</div>`).join('\n');
    return `\n${language ? languageBlock(language) : ''}\n${bar}\n${body}\n`;
}

/**
 * JS defining `initTools(api)`; each page calls it once with its
 * `acquireVsCodeApi()` result (the API can only be acquired once per page).
 */
export function toolsScript(): string {
    return `
function initTools(api) {
    function $(id) { return document.getElementById(id); }
    document.querySelectorAll('[data-sub-tab]').forEach(function (b) {
        b.addEventListener('click', function () {
            var id = b.getAttribute('data-sub-tab');
            document.querySelectorAll('[data-sub]').forEach(function (p) { p.hidden = p.getAttribute('data-sub') !== id; });
            document.querySelectorAll('[data-sub-tab]').forEach(function (x) { x.classList.toggle('active', x.getAttribute('data-sub-tab') === id); });
            api.postMessage({ command: 'toolsTab', tab: id });
        });
    });
    document.querySelectorAll('[data-pl]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'plsql', cmd: b.getAttribute('data-pl') }); });
    });
    document.querySelectorAll('[data-dl]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'delphiCmd', cmd: b.getAttribute('data-dl') }); });
    });
    document.querySelectorAll('[data-pa]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'plsqlAlign', id: b.getAttribute('data-pa') }); });
    });
    document.querySelectorAll('[data-review]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'runAnalytics', kind: 'review' }); });
    });
    document.querySelectorAll('[data-common]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'commonCmd', cmd: b.getAttribute('data-common') }); });
    });
    var langSel = $('langSel');
    if (langSel) {
        var every = $('langEvery');
        function sendLang() { api.postMessage({ command: 'setLanguage', id: langSel.value, scope: every && every.checked ? 'extension' : 'file' }); }
        langSel.addEventListener('change', sendLang);
        if (every) { every.addEventListener('change', function () { if (langSel.value) { sendLang(); } }); }
    }
    var tok = $('alignToken');
    if (tok) {
        var chipBox = $('chips');
        var chips = [];
        try { chips = JSON.parse(chipBox.getAttribute('data-chips') || '[]'); } catch (err) { chips = []; }
        function saveChips() { api.postMessage({ command: 'saveAlignChips', chips: chips }); renderChips(); }
        function renderChips() {
            while (chipBox.firstChild) { chipBox.removeChild(chipBox.firstChild); }
            chips.forEach(function (t, i) {
                var b = document.createElement('button');
                b.className = 'chip';
                b.title = 'Use ' + t;
                b.appendChild(document.createTextNode(t));
                var x = document.createElement('span');
                x.className = 'x';
                x.title = 'Remove';
                x.textContent = '\\u00d7';
                x.addEventListener('click', function (ev) { ev.stopPropagation(); chips.splice(i, 1); saveChips(); });
                b.appendChild(x);
                b.addEventListener('click', function () { tok.value = t; tok.focus(); });
                chipBox.appendChild(b);
            });
            var add = document.createElement('button');
            add.className = 'chip add';
            add.title = 'Save the typed string as a shortcut';
            add.textContent = '+';
            add.addEventListener('click', function () {
                var v = tok.value.trim();
                if (v && v.length <= 24 && chips.indexOf(v) < 0 && chips.length < 40) { chips.push(v); saveChips(); }
            });
            chipBox.appendChild(add);
        }
        renderChips();
        $('alignGo').addEventListener('click', function () { api.postMessage({ command: 'alignSelection', token: tok.value }); });
        tok.addEventListener('keydown', function (e) { if (e.key === 'Enter') { $('alignGo').click(); } });
    }
}
`;
}
