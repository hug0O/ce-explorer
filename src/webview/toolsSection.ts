/**
 * Sidebar "Tools" section shared by the Member view's pages: align the
 * selection on a string, and drop a component on the active Delphi form
 * (any class, in any container, placed against an existing control).
 *
 * The markup is static; the Delphi part is filled from the extension through
 * `formModel` / `suggestedName` messages (see MemberViewerPanel).
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

export function toolsCss(): string {
    return `
.tabs { display: flex; gap: 2px; margin-bottom: 10px; border-bottom: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); }
.tab { background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--vscode-descriptionForeground); padding: 5px 10px; cursor: pointer; font-size: 12px; font-family: inherit; }
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
`;
}

export const PLSQL_COMMANDS = [
    'mmx.plsql.syncPackage', 'mmx.plsql.newPackage', 'mmx.plsql.crudFromTable', 'mmx.plsql.utplsql',
    'mmx.plsql.exceptionBlock', 'mmx.plsql.extractProcedure', 'mmx.plsql.docHeader', 'mmx.plsql.findCallers',
];
export const DELPHI_COMMANDS = [
    'mmx.delphi.designer',
    'mmx.delphi.align',
    'mmx.delphi.anchors',
    'mmx.delphi.tabOrder',
    'mmx.delphi.check',
    'mmx.delphi.cleanHandlers',
    'mmx.delphi.copy',
    'mmx.delphi.paste',
    'mmx.delphi.duplicate',
    'mmx.delphi.formFromFields',
    'mmx.delphi.formFromClass',
    'mmx.delphi.changeClass',
];
export const PLSQL_ALIGN_IDS = ['params', 'assign', 'arrow', 'comment', 'alias', 'values'];

function plsqlBlock(): string {
    const btn = (cmd: string, label: string, title: string) => `<button class="ana" data-pl="${cmd}" title="${escapeAttr(title)}">${label}</button>`;
    const chip = (id: string, label: string, title: string) => `<button class="chip" data-pa="${id}" title="${escapeAttr(title)}">${escapeAttr(label)}</button>`;
    return `
<div class="tools-block" id="plBlock">
<div class="section-title">PL/SQL (Oracle)</div>
<div class="analyze-grid">
${btn('mmx.plsql.syncPackage', '🔄 Sync spec ⇄ body', 'Declare / stub / fix signatures between the .pks and the .pkb')}
${btn('mmx.plsql.newPackage', '📦 New package…', 'Spec + body skeleton')}
${btn('mmx.plsql.crudFromTable', '🗄️ CRUD from table', 'Select or copy a CREATE TABLE')}
${btn('mmx.plsql.extractProcedure', '✂️ Extract procedure', 'Selection → procedure with detected IN / OUT parameters')}
${btn('mmx.plsql.exceptionBlock', '⚠️ Exception block', 'NO_DATA_FOUND / TOO_MANY_ROWS / OTHERS')}
${btn('mmx.plsql.docHeader', '📘 PLDoc header', 'Insert or refresh the /** … */ block from the signature')}
${btn('mmx.plsql.utplsql', '🧪 utPLSQL tests', 'Test package generated from the spec')}
${btn('mmx.plsql.findCallers', '🔎 Find callers', 'References across the workspace')}
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
    const btn = (cmd: string, label: string, title: string) => `<button class="ana" data-dl="${cmd}" title="${escapeAttr(title)}">${label}</button>`;
    return `
<div class="tools-block" id="dlBlock">
<div class="section-title">Delphi layout &amp; checks</div>
<button class="ana" data-dl="mmx.delphi.designer" title="The .dfm drawn as a form: select, drag, resize, drop components" style="margin-bottom:6px;font-weight:600">🎨 Open the visual form designer</button>
<div class="analyze-grid">
${btn('mmx.delphi.align', '⬌ Align components', 'Edges, centres, same size, equal spacing')}
${btn('mmx.delphi.anchors', '📌 Anchors / docking', 'Anchors from position, stretch, alClient…')}
${btn('mmx.delphi.tabOrder', '🔢 TabOrder by position', 'Reading order on screen')}
${btn('mmx.delphi.copy', '📋 Copy components', 'With their handlers and code')}
${btn('mmx.delphi.paste', '📥 Paste components', 'Into any container, renamed if needed')}
${btn('mmx.delphi.duplicate', '🧬 Duplicate', 'Copy + paste next to the original')}
${btn('mmx.delphi.formFromFields', '🧱 Form from fields', 'Label + input rows, aligned')}
${btn('mmx.delphi.formFromClass', '🏷️ Form from a class', 'Fields of a class of the unit')}
${btn('mmx.delphi.changeClass', '♻️ Change class', 'TEdit → TcxTextEdit… keeping compatible properties')}
${btn('mmx.delphi.check', '✅ Check form', '.dfm vs .pas: handlers, fields, TabOrder, layout')}
${btn('mmx.delphi.cleanHandlers', '🧹 Clean handlers', 'Missing, orphan and empty handlers')}
</div>
</div>
`;
}

export type ToolsSub = 'form' | 'components' | 'spacing' | 'plsql' | 'align';

export const TOOLS_SUBS: ToolsSub[] = ['form', 'components', 'spacing', 'plsql', 'align'];

/** The sub-tabs relevant to the active file: Delphi tools only for a Delphi unit, PL/SQL tools only for PL/SQL. */
export function availableSubs(plsql: boolean, delphi: boolean): { id: ToolsSub; label: string }[] {
    const subs: { id: ToolsSub; label: string }[] = [];
    if (delphi) {
        subs.push({ id: 'form', label: 'Form' }, { id: 'components', label: 'Components' }, { id: 'spacing', label: 'Spacing' });
    }
    if (plsql) { subs.push({ id: 'plsql', label: 'PL/SQL' }); }
    subs.push({ id: 'align', label: 'Align' });
    return subs;
}

function alignBlock(alignToken: string, chipsJson: string): string {
    return `
<div class="tools-block">
<div class="section-title">Align selection</div>
<div class="tool-row">
<input id="alignToken" class="inp" value="${escapeAttr(alignToken)}" placeholder="text to align on, e.g. :=" spellcheck="false">
<button id="alignGo" class="ana" style="width:auto">Align</button>
</div>
<div class="chips" id="chips" data-chips="${chipsJson}"></div>
<div class="tool-note">Click a string to use it, <b>+</b> saves the one typed above, <b>×</b> removes it. Select the lines in the editor, then click Align. Without a selection, the block of lines around the cursor is aligned.</div>
</div>`;
}

function componentsBlock(): string {
    return `
<div class="tools-block" id="dForm">
<div class="section-title">Delphi component</div>
<div class="tool-note" id="dMsg">Loading form…</div>
<div id="dFields" style="display:none">
<div class="tool-label">Class (pick or type any class)</div>
<input id="dClass" class="inp" list="dClasses" value="TButton" spellcheck="false" style="width:100%">
<datalist id="dClasses"></datalist>
<div class="tool-note" id="dHint"></div>
<div class="tool-label">Unit for uses <span class="hint">(optional)</span></div>
<input id="dUnit" class="inp" placeholder="auto" spellcheck="false" style="width:100%">
<div class="tool-label">Name</div>
<input id="dName" class="inp" spellcheck="false" style="width:100%">
<div class="tool-label">Event to implement <span class="hint">(empty = field only)</span></div>
<input id="dEvent" class="inp" list="dEvents" value="OnClick" spellcheck="false" style="width:100%">
<datalist id="dEvents"></datalist>
<div class="tool-label">Place inside</div>
<select id="dParent" class="tool-select"></select>
<div class="tool-label">Relative to</div>
<select id="dRef" class="tool-select"></select>
<div class="tool-label">Side, and gap in px</div>
<div class="tool-row"><select id="dSide" class="tool-select" style="flex:1">
<option value="right">right of</option>
<option value="below">below</option>
<option value="left">left of</option>
<option value="above">above</option>
</select>
<input id="dGap" class="inp" type="number" min="0" max="500" value="8" style="max-width:64px" title="Space between the new component and its reference"></div>
<button id="dAdd" class="tool-primary">Add to form</button>
</div>
<div id="eFields" style="display:none">
<div class="section-title" style="margin-top:14px">Event on an existing component</div>
<div class="tool-label">Component</div>
<select id="eComp" class="tool-select"></select>
<div class="tool-label">Event <span class="hint">(pick or type)</span></div>
<input id="eEvent" class="inp" list="eEvents" spellcheck="false" style="width:100%">
<datalist id="eEvents"></datalist>
<div class="tool-note" id="eNote"></div>
<button id="eAdd" class="tool-primary">Create / open handler</button>
</div>
</div>`;
}

function spacingBlock(): string {
    return `
<div class="tools-block" id="sForm">
<div class="section-title">Spacing between components</div>
<div class="tool-note" id="sMsg">Loading form…</div>
<div id="sFields" style="display:none">
<div class="tool-label">Gap between a component and the next one…</div>
<select id="sComp" class="tool-select"></select>
<div class="tool-row" style="margin-top:4px">
<select id="sDir" class="tool-select" style="flex:1"><option value="right">to its right</option><option value="below">below it</option><option value="left">to its left</option><option value="above">above it</option></select>
<input id="sGap" class="inp" type="number" min="-50" max="500" value="8" style="max-width:64px" title="Pixels, edge to edge">
</div>
<label class="tool-note"><input type="checkbox" id="sCascade" checked> move the components that follow too</label>
<button id="sApply" class="tool-primary">Set gap</button>
<div class="tool-label" style="margin-top:10px">Distribute a whole container</div>
<select id="sCont" class="tool-select"></select>
<div class="tool-row" style="margin-top:4px">
<input id="sH" class="inp" type="number" min="-50" max="500" value="8" title="Horizontal gap (px)">
<input id="sV" class="inp" type="number" min="-50" max="500" value="8" title="Vertical gap (px)">
</div>
<div class="tool-note">Horizontal / vertical gaps. Rows are detected automatically and columns are aligned across rows.</div>
<button id="sDist" class="tool-primary">Distribute</button>
</div>
</div>`;
}

/**
 * The Tools tab, split into sub-tabs so that each set of tools has its own page:
 * Form · Components · Spacing (Delphi), PL/SQL, Align. Only the pages that make
 * sense for the active file are offered; `activeSub` is the one shown.
 */
export function toolsHtml(alignToken: string, chipList: string[] = DEFAULT_ALIGN_CHIPS, plsql = false, delphi = false, activeSub = ''): string {
    const chipsJson = escapeAttr(JSON.stringify(chipList));
    const subs = availableSubs(plsql, delphi);
    const active = subs.some(s => s.id === activeSub) ? activeSub : subs[0].id;
    const pages: Record<ToolsSub, string> = {
        form: delphi ? delphiBlock() : '',
        components: delphi ? componentsBlock() : '',
        spacing: delphi ? spacingBlock() : '',
        plsql: plsql ? plsqlBlock() : '',
        align: alignBlock(alignToken, chipsJson),
    };
    const bar = subs.length > 1
        ? `<div class="subtabs">${subs.map(s => `<button class="subtab${s.id === active ? ' active' : ''}" data-sub-tab="${s.id}">${s.label}</button>`).join('')}</div>`
        : '';
    const body = subs.map(s => `<div data-sub="${s.id}"${s.id === active ? '' : ' style="display:none"'}>${pages[s.id]}</div>`).join('\n');
    return `\n${bar}\n${body}\n`;
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
            document.querySelectorAll('[data-sub]').forEach(function (p) { p.style.display = p.getAttribute('data-sub') === id ? '' : 'none'; });
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
                x.textContent = '\u00d7';
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
    if (!$('dForm')) { return; }

    var model = null;
    var nameTouched = false;
    var knownClass = {};

    function option(value, text) { var o = document.createElement('option'); o.value = value; o.textContent = text; return o; }
    function clear(el) { while (el.firstChild) { el.removeChild(el.firstChild); } }

    function fillRef() {
        var ref = $('dRef');
        clear(ref);
        ref.appendChild(option('', 'automatic (below the others)'));
        var parent = $('dParent').value;
        (model.containers || []).forEach(function (c) {
            if (c.name === parent) { c.children.forEach(function (k) { ref.appendChild(option(k.name, k.label)); }); }
        });
        $('dSide').disabled = true;
    }

    function onClassChange() {
        var cls = $('dClass').value.trim();
        var info = knownClass[cls.toLowerCase()];
        $('dUnit').placeholder = info ? info.unit + ' (auto)' : 'auto';
        var events = $('dEvents');
        clear(events);
        var list = info ? info.events : ['OnClick', 'OnChange'];
        list.forEach(function (n) { events.appendChild(option(n, '')); });
        $('dEvent').value = list.length ? list[0] : '';
        if (cls) { api.postMessage({ command: 'suggestName', className: cls }); api.postMessage({ command: 'classInfo', className: cls }); }
    }

    function currentComp() {
        var name = $('eComp').value;
        var found = null;
        (model.components || []).forEach(function (c) { if (c.name === name) { found = c; } });
        return found;
    }

    function onEventInput() {
        var c = currentComp();
        var ev = $('eEvent').value.trim();
        var handler = c && c.wired ? c.wired[ev] : '';
        $('eNote').textContent = handler ? ev + ' is already wired to ' + handler + ' - the button opens it.' : '';
    }

    function onCompChange() {
        var c = currentComp();
        var list = $('eEvents');
        clear(list);
        var events = c ? c.events : [];
        events.forEach(function (n) { list.appendChild(option(n, c.wired && c.wired[n] ? '-> ' + c.wired[n] : '')); });
        var firstFree = '';
        events.forEach(function (n) { if (!firstFree && !(c.wired && c.wired[n])) { firstFree = n; } });
        $('eEvent').value = firstFree || (events.length ? events[0] : '');
        onEventInput();
    }

    function fillComponents() {
        var sel = $('eComp');
        var keep = sel.value;
        clear(sel);
        (model.components || []).forEach(function (c) { sel.appendChild(option(c.name, c.label)); });
        if (keep) { sel.value = keep; }
        onCompChange();
    }

    function fillSpacing() {
        var comp = $('sComp');
        var keep = comp.value;
        clear(comp);
        (model.components || []).forEach(function (c) { if (c.name !== model.formName) { comp.appendChild(option(c.name, c.label)); } });
        if (keep) { comp.value = keep; }
        var cont = $('sCont');
        var keepC = cont.value;
        clear(cont);
        (model.containers || []).forEach(function (c) { cont.appendChild(option(c.name, c.label)); });
        if (keepC) { cont.value = keepC; }
    }

    function showClassInfo(info) {
        if ($('dClass').value.trim().toLowerCase() !== String(info.className).toLowerCase()) { return; }
        var notes = {
            catalog: '',
            setting: 'Defined in your mmx.delphi.customComponents setting.',
            project: 'Third-party class learned from the .dfm files of your project.',
            generic: 'Unknown class: generic 75x25 control. Type its unit below (remembered next time) or describe it in mmx.delphi.customComponents.'
        };
        $('dHint').textContent = notes[info.source] || '';
        $('dUnit').placeholder = info.unit ? info.unit + ' (auto)' : 'auto';
        var events = $('dEvents');
        clear(events);
        info.events.forEach(function (n) { events.appendChild(option(n, '')); });
        if (info.events.length && info.events.indexOf($('dEvent').value) < 0) { $('dEvent').value = info.events[0]; }
    }

    function fillModel() {
        if (!model || !model.ok) {
            $('dMsg').textContent = (model && model.reason) || 'No Delphi form here.';
            if ($('sMsg')) { $('sMsg').textContent = $('dMsg').textContent; }
            $('dFields').style.display = 'none';
            $('eFields').style.display = 'none';
            $('sFields').style.display = 'none';
            return;
        }
        $('dMsg').textContent = 'Form ' + model.formName;
        if ($('sMsg')) { $('sMsg').textContent = 'Form ' + model.formName; }
        $('dFields').style.display = 'block';
        $('eFields').style.display = 'block';
        $('sFields').style.display = 'block';
        fillComponents();
        fillSpacing();
        var classes = $('dClasses');
        clear(classes);
        model.classes.forEach(function (c) {
            knownClass[c.className.toLowerCase()] = c;
            classes.appendChild(option(c.className, c.unit));
        });
        var parent = $('dParent');
        clear(parent);
        model.containers.forEach(function (c) { parent.appendChild(option(c.name, c.label)); });
        fillRef();
        onClassChange();
    }

    window.addEventListener('message', function (e) {
        var m = e.data;
        if (!m) { return; }
        if (m.command === 'formModel') { model = m.model; fillModel(); }
        else if (m.command === 'suggestedName' && !nameTouched) { $('dName').value = m.name; }
        else if (m.command === 'classInfo') { showClassInfo(m.info); }
    });

    $('dClass').addEventListener('change', function () { nameTouched = false; onClassChange(); });
    $('dName').addEventListener('input', function () { nameTouched = true; });
    $('dParent').addEventListener('change', fillRef);
    $('sApply').addEventListener('click', function () {
        api.postMessage({ command: 'setSpacing', componentName: $('sComp').value, direction: $('sDir').value, gap: Number($('sGap').value), cascade: $('sCascade').checked });
    });
    $('sDist').addEventListener('click', function () {
        api.postMessage({ command: 'distribute', containerName: $('sCont').value, horizontal: Number($('sH').value), vertical: Number($('sV').value) });
    });
    $('eComp').addEventListener('change', onCompChange);
    $('eEvent').addEventListener('input', onEventInput);
    $('eAdd').addEventListener('click', function () {
        api.postMessage({ command: 'addEvent', componentName: $('eComp').value, eventName: $('eEvent').value.trim() });
    });
    $('dRef').addEventListener('change', function () { $('dSide').disabled = !$('dRef').value; });
    $('dAdd').addEventListener('click', function () {
        api.postMessage({
            command: 'addComponent',
            req: {
                className: $('dClass').value.trim(),
                unit: $('dUnit').value.trim(),
                name: $('dName').value.trim(),
                eventName: $('dEvent').value.trim(),
                parentName: $('dParent').value,
                refName: $('dRef').value,
                side: $('dRef').value ? $('dSide').value : 'auto',
                gap: Number($('dGap').value)
            }
        });
        nameTouched = false;
    });

    api.postMessage({ command: 'toolsReady' });
}
`;
}
