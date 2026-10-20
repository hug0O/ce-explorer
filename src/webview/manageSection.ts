/**
 * "Structure" tab of the sidebar: add a member to any type of the file, and
 * filter, group, go to, edit, rename, move or delete the members of the chosen
 * type. This tab replaces the former "Classes" tree view, with the same
 * abilities (filter, grouping, add / edit / rename / delete / move, accessors,
 * templates, synchronisation) and a type selector for files that hold several.
 *
 * Pure: builds markup from plain data, so it is testable without VS Code.
 */
import { MemberKind, Visibility } from '../models/types';
import { sortMembersForDisplay } from '../utils/memberNavigation';
import { LineHit, MAX_HITS } from '../utils/memberSearch';

export type ManageGroup = 'source' | 'visibility' | 'kind' | 'alpha';
export const MANAGE_GROUPS: ManageGroup[] = ['source', 'visibility', 'kind', 'alpha'];
export const MANAGE_GROUP_LABELS: Record<ManageGroup, string> = { source: 'Source order', visibility: 'Visibility', kind: 'Kind', alpha: 'A → Z' };

/** Entry of the type selector standing for the standalone routines of a file. */
export const FILE_LEVEL_ID = '__file__';

export interface ManageRow {
    id: string;
    name: string;
    kind: MemberKind;
    visibility: Visibility;
    type?: string;
    /** Number of parameters, for routines. */
    params?: number;
    selected: boolean;
    line: number;
    /** Routines declared inside this one (Pascal), in source order: shown under it, a click goes to their line. */
    nested?: { name: string; kind: string; line: number; depth: number }[];
}

/** The member the tab is about (the one under the cursor, or the one last clicked): where it is used, and a search in its code. */
export interface FocusView {
    id: string;
    name: string;
    kindLabel: string;
    /** Lines of the current file that use the member (the first rows) and how many there are. */
    usages: LineHit[];
    usageTotal: number;
    /** A member with a body: its code can be searched. */
    searchable: boolean;
    search: string;
    searchHits: LineHit[];
    searchTotal: number;
    /** Local variables and parameters of the member (markup made by the panel, already escaped), when it has a body. */
    variables?: { count: number; html: string };
    /** Which blocks are unfolded; the choice is kept by the panel between redraws. */
    open: { used: boolean; vars: boolean; find: boolean };
}

export interface ManageView {
    /** One entry per type of the file (and the file-level routines); the selector is hidden when there is only one. */
    typeOptions: { id: string; label: string }[];
    selectedType: string;
    /** Standalone routines rather than the members of a type. */
    isFile: boolean;
    add: { field: boolean; method: boolean; property: boolean; constructor: boolean };
    /** Another type exists in the file: members can be moved to it. */
    canMove: boolean;
    rows: ManageRow[];
    filter: string;
    kindFilter: string;
    group: ManageGroup;
    /** Put the caret in the filter box once the tab is shown ("Filter Members" command / shortcut). */
    focusFilter?: boolean;
    focus?: FocusView;
}

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ICONS: Record<string, string> = { field: '📦', property: '🔑', constructor: '🏗️', destructor: '🧹', method: '🔧' };
const KIND_LABELS: Record<string, string> = { method: 'Methods', field: 'Fields', property: 'Properties', constructor: 'Constructors', destructor: 'Destructors' };
const VIS_LETTER: Record<string, string> = { public: '+', private: '-', protected: '#', published: '★' };

/** Rows in the order of the chosen grouping, each with the heading it falls under (empty for none). */
export function orderRows(rows: ManageRow[], group: ManageGroup): { row: ManageRow; heading: string }[] {
    const sorted = group === 'source'
        ? [...rows].sort((a, b) => a.line - b.line)
        : sortMembersForDisplay(rows, group);
    return sorted.map(row => ({
        row,
        heading: group === 'visibility' ? row.visibility.charAt(0).toUpperCase() + row.visibility.slice(1)
            : group === 'kind' ? (KIND_LABELS[row.kind] ?? row.kind) : '',
    }));
}

export function manageCss(): string {
    return `
.mhead { display: flex; gap: 4px; align-items: center; margin-bottom: 8px; }
.mhead .tool-select { flex: 1; }
.mhead .mtypelabel { font-weight: 600; }
.mfilter { position: relative; }
.mfilter .inp { padding-right: 22px; }
.mfilter .mclear { position: absolute; right: 2px; top: 1px; background: transparent; border: none; color: var(--vscode-descriptionForeground); cursor: pointer; font-size: 14px; display: none; }
.mfilter .mclear.on { display: block; }
.mgroup { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--vscode-descriptionForeground); margin: 8px 0 2px 2px; list-style: none; }
.mrow .vis { color: var(--vscode-descriptionForeground); font-family: var(--vscode-editor-font-family, monospace); width: 10px; flex: none; text-align: center; }
.mnested { list-style: none; display: flex; gap: 4px; align-items: center; padding: 1px 4px; border-radius: 3px; cursor: pointer; font-size: 12px; color: var(--vscode-descriptionForeground); }
.mnested:hover { background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.15)); }
.mnested .mnname { font-family: var(--vscode-editor-font-family, monospace); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mnested .mnkind { font-size: 10px; opacity: 0.8; }
.mnested.d0 { margin-left: 22px; } .mnested.d1 { margin-left: 36px; } .mnested.d2 { margin-left: 50px; } .mnested.d3 { margin-left: 64px; }
.madd-box { margin-bottom: 6px; }
.madd-box .section-title { margin-bottom: 3px; }
.mbtns { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 3px; }
.mbtns .ana { width: auto; padding: 2px 7px; font-size: 11px; line-height: 1.35; }
.mdetail { list-style: none; margin: 1px 0 6px 12px; padding: 3px 6px 4px; border-left: 2px solid var(--vscode-focusBorder, #007fd4); background: var(--vscode-textBlockQuote-background, rgba(128, 128, 128, 0.1)); border-radius: 0 3px 3px 0; }
.mdetail .var-list { list-style: none; padding: 0; }
.mdetail .var-row { display: flex; align-items: center; gap: 4px; padding: 2px 0; font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; }
.mdetail .var-row .dir { color: var(--vscode-symbolIcon-keywordForeground, #569cd6); }
.mdetail .var-row .pname { color: var(--vscode-symbolIcon-variableForeground, #9cdcfe); }
.mdetail .var-row .ptype { color: var(--vscode-symbolIcon-typeParameterForeground, #4ec9b0); }
.mdetail .var-actions { margin-left: auto; display: flex; gap: 2px; }
.mdetail .var-btn { background: transparent; border: none; cursor: pointer; font-size: 13px; padding: 1px 3px; line-height: 1; }
.mdetail .ana { margin-top: 3px; }
.mdetail .mdet > summary { margin-top: 0; }
.mdet > summary { cursor: pointer; font-size: 11px; color: var(--vscode-descriptionForeground); margin: 2px 0 4px; }
.mhits { list-style: none; max-height: 190px; overflow: auto; margin: 2px 0 6px; }
.mhit { display: flex; gap: 6px; padding: 1px 4px; border-radius: 3px; cursor: pointer; font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; }
.mhit:hover { background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.15)); }
.mhit .mln { flex: none; min-width: 3em; text-align: right; color: var(--vscode-descriptionForeground); }
.mhit .mtx { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mhits:empty { display: none; }
.mmore { font-size: 10px; color: var(--vscode-descriptionForeground); padding: 1px 4px; }
.msearchinfo { font-size: 10px; color: var(--vscode-descriptionForeground); min-height: 13px; }
`;
}

function hitRowsHtml(hits: LineHit[], total: number): string {
    return hits.map(h => `<li class="mhit" data-m-line="${h.line}" title="Go to line ${h.line + 1}"><span class="mln">${h.line + 1}</span><span class="mtx">${esc(h.text)}</span></li>`).join('')
        + (total > hits.length ? `<li class="mmore">… ${total - hits.length} more not listed (first ${MAX_HITS} shown)</li>` : '');
}

/** What goes under the selected member's row: where it is used in this file, its variables, a search box over its own code. Each block folds. */
export function focusHtml(f: FocusView): string {
    const open = (on: boolean): string => (on ? ' open' : '');
    let html = `<div class="mfocus" id="mFocus">`;
    html += `<details class="mdet" data-fold="used"${open(f.open.used)}><summary>Used in this file (<span id="mUsageCount">${f.usageTotal}</span>)</summary>`;
    html += f.usageTotal
        ? `<ul class="mhits" id="mUsages">${hitRowsHtml(f.usages, f.usageTotal)}</ul>`
        : `<p class="empty-section">Not used elsewhere in this file.</p>`;
    html += `</details>`;
    if (f.variables) {
        html += `<details class="mdet" data-fold="vars"${open(f.open.vars)}><summary>Variables (${f.variables.count})</summary>${f.variables.html}</details>`;
    }
    if (f.searchable) {
        html += `<details class="mdet" data-fold="find"${open(f.open.find)}><summary>Search in the code of ${esc(f.name)}</summary>`
            + `<div class="tool-row mfilter"><input id="mSearch" class="inp" type="text" spellcheck="false" placeholder="Search in ${esc(f.name)}… (regex ok)" value="${esc(f.search)}">`
            + `<button class="mclear${f.search ? ' on' : ''}" id="mSearchClear" title="Clear the search">×</button></div>`
            + `<div class="msearchinfo" id="mSearchInfo">${f.search ? (f.searchTotal ? f.searchTotal + ' line(s) match' : 'No line matches') : ''}</div>`
            + `<ul class="mhits" id="mSearchHits">${hitRowsHtml(f.searchHits, f.searchTotal)}</ul></details>`;
    }
    return html + `</div>`;
}

export function manageListHtml(v: ManageView): string {
    let html = '';
    const typeLabel = v.typeOptions.find(o => o.id === v.selectedType)?.label ?? (v.isFile ? 'File-level routines' : '');
    if (v.typeOptions.length > 1) {
        html += `<div class="mhead"><select id="mType" class="tool-select" title="Type to manage">`
            + v.typeOptions.map(o => `<option value="${esc(o.id)}"${o.id === v.selectedType ? ' selected' : ''}>${esc(o.label)}</option>`).join('')
            + `</select></div>`;
    } else if (typeLabel) {
        html += `<div class="mhead"><span class="mtypelabel">${esc(typeLabel)}</span></div>`;
    }

    html += `<div class="section madd-box"><div class="section-title">Add</div><div class="mbtns">`;
    if (v.add.field) { html += `<button class="ana" data-m-add="field">📦 Field</button>`; }
    if (v.add.method) { html += `<button class="ana" data-m-add="method">🔧 Method</button>`; }
    if (v.add.property) { html += `<button class="ana" data-m-add="property">🔑 Property</button>`; }
    if (v.add.constructor) { html += `<button class="ana" data-m-add="constructor">🏗️ Constructor</button>`; }
    html += `</div><div class="mbtns">`
        + `<button class="ana" data-m-run="ce.insertTemplate" title="Insert a template at the cursor">🧩 Template…</button>`
        + `<button class="ana" data-m-run="ce.synchronizeDeclImpl" title="Declare / create the missing declarations and implementations">🔄 Sync</button>`
        + `<button class="ana" data-m-run="ce.manageTemplates" title="Create and edit your templates">📝 Templates</button>`
        + `<button class="ana" id="mRefresh" title="Parse the file again">♻️ Refresh</button>`
        + `</div></div>`;

    const total = v.rows.length;
    html += `<div class="section"><div class="section-title">${v.isFile ? 'Routines' : 'Members'} (<span id="mCount">${total}</span>)</div>`;
    html += `<div class="tool-row mfilter"><input id="mFilter" class="inp" type="text" spellcheck="false" placeholder="Filter: name, type, kind… (regex ok)" value="${esc(v.filter)}"${v.focusFilter ? ' data-focus="1"' : ''}>`
        + `<button class="mclear" id="mClear" title="Clear the filter">×</button></div>`;
    html += `<div class="tool-row"><select id="mKind" class="tool-select" title="Only this kind of member">`
        + `<option value="">All kinds</option>`
        + (['method', 'field', 'property', 'constructor'] as const).map(k => `<option value="${k}"${v.kindFilter === k ? ' selected' : ''}>${KIND_LABELS[k]}</option>`).join('')
        + `</select><select id="mGroup" class="tool-select" title="Order and grouping">`
        + MANAGE_GROUPS.map(g => `<option value="${g}"${v.group === g ? ' selected' : ''}>${MANAGE_GROUP_LABELS[g]}</option>`).join('')
        + `</select></div>`;

    if (total === 0) {
        html += `<p class="empty-section">Nothing here yet, use the buttons above.</p>`;
    } else {
        html += `<ul class="mlist" id="mList">`;
        let lastHeading = '';
        for (const { row: m, heading } of orderRows(v.rows, v.group)) {
            if (heading && heading !== lastHeading) { html += `<li class="mgroup" data-group="1">${esc(heading)}</li>`; }
            lastHeading = heading;
            const id = esc(m.id);
            const sig = m.kind === MemberKind.Method || m.kind === MemberKind.Constructor || m.kind === MemberKind.Destructor ? `(${m.params ?? 0})` : '';
            const text = (m.name + ' ' + (m.type ?? '') + ' ' + m.kind + ' ' + m.visibility + (m.nested?.length ? ' ' + m.nested.map(n => n.name).join(' ') : '')).toLowerCase();
            html += `<li class="mrow${m.selected ? ' sel' : ''}" data-kind="${esc(m.kind)}" data-text="${esc(text)}">`
                + `<span class="vis" title="${esc(m.visibility)}">${VIS_LETTER[m.visibility] ?? ''}</span>`
                + `<span>${ICONS[m.kind] ?? '🔧'}</span>`
                + `<span class="mname" data-m-act="go" data-id="${id}" title="Go to ${esc(m.name)}">${esc(m.name)}${sig}</span>`
                + (m.type ? `<span class="mtype">: ${esc(m.type)}</span>` : '')
                + `<span class="var-actions">`
                + `<button class="var-btn" data-m-act="edit" data-id="${id}" title="Edit">✏️</button>`
                + `<button class="var-btn" data-m-act="rename" data-id="${id}" title="Rename">🔤</button>`
                + (m.kind === MemberKind.Field && !v.isFile ? `<button class="var-btn" data-m-act="getset" data-id="${id}" title="Generate getter / setter">🔑</button>` : '')
                + (v.canMove && !v.isFile ? `<button class="var-btn" data-m-act="move" data-id="${id}" title="Move to another type…">➡️</button>` : '')
                + `<button class="var-btn" data-m-act="delete" data-id="${id}" title="Delete">🗑️</button>`
                + `</span></li>`;
            if (v.focus && v.focus.id === m.id) { html += `<li class="mdetail">${focusHtml(v.focus)}</li>`; }
            for (const n of m.nested ?? []) {
                html += `<li class="mnested d${Math.min(3, n.depth)}" data-m-act="goline" data-id="${n.line}" title="${esc(n.name)} is declared inside ${esc(m.name)}: go to line ${n.line + 1}">`
                    + `<span>↳</span><span class="mnname">${esc(n.name)}</span><span class="mnkind">${esc(n.kind)}</span></li>`;
            }
        }
        html += `</ul><p class="empty-section" id="mNone" hidden>No member matches the filter.</p>`;
    }
    html += `</div>`;
    return html;
}

/** JS defining `initManage(api)`: live filter (name, type, kind; regex when valid), kind / grouping / type selectors, add buttons. */
export function manageScript(): string {
    return `
function initManage(api) {
    function $(id) { return document.getElementById(id); }
    document.querySelectorAll('[data-m-add]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'manageAdd', kind: b.getAttribute('data-m-add') }); });
    });
    document.querySelectorAll('[data-m-run]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'run', cmd: b.getAttribute('data-m-run') }); });
    });
    // A block that is folded or unfolded stays so when the tab is drawn again.
    var folds = {};
    document.querySelectorAll('details[data-fold]').forEach(function (d) {
        folds[d.getAttribute('data-fold')] = d.open;
        d.addEventListener('toggle', function () {
            var key = d.getAttribute('data-fold');
            if (folds[key] === d.open) { return; }
            folds[key] = d.open;
            api.postMessage({ command: 'manageFold', key: key, open: d.open });
        });
    });
    // Rows of the usage and search lists: go to the line. A delegated listener, since the search list is rebuilt while typing.
    document.addEventListener('click', function (ev) {
        var row = ev.target && ev.target.closest ? ev.target.closest('[data-m-line]') : null;
        if (row) { api.postMessage({ command: 'manageLine', line: Number(row.getAttribute('data-m-line')) }); }
    });
    var ms = $('mSearch');
    if (ms) {
        var timer = null;
        var send = function () { api.postMessage({ command: 'manageSearch', text: ms.value }); $('mSearchClear').classList.toggle('on', !!ms.value); };
        ms.addEventListener('input', function () { if (timer) { clearTimeout(timer); } timer = setTimeout(send, 160); });
        ms.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { ms.value = ''; send(); } });
        $('mSearchClear').addEventListener('click', function () { ms.value = ''; send(); ms.focus(); });
        window.addEventListener('message', function (ev) {
            var m = ev.data;
            if (!m || m.command !== 'memberHits') { return; }
            var ul = $('mSearchHits');
            while (ul.firstChild) { ul.removeChild(ul.firstChild); }
            (m.hits || []).forEach(function (h) {
                var li = document.createElement('li'); li.className = 'mhit'; li.setAttribute('data-m-line', String(h.line)); li.title = 'Go to line ' + (h.line + 1);
                var a = document.createElement('span'); a.className = 'mln'; a.textContent = String(h.line + 1);
                var b = document.createElement('span'); b.className = 'mtx'; b.textContent = h.text;
                li.appendChild(a); li.appendChild(b); ul.appendChild(li);
            });
            if (m.total > (m.hits || []).length) { var more = document.createElement('li'); more.className = 'mmore'; more.textContent = '… ' + (m.total - m.hits.length) + ' more not listed'; ul.appendChild(more); }
            $('mSearchInfo').textContent = !m.query ? '' : (m.total ? m.total + ' line(s) match' : 'No line matches');
        });
    }
    if ($('mRefresh')) { $('mRefresh').addEventListener('click', function () { api.postMessage({ command: 'manageRefresh' }); }); }
    if ($('mType')) { $('mType').addEventListener('change', function () { api.postMessage({ command: 'manageClass', id: $('mType').value }); }); }
    if ($('mGroup')) { $('mGroup').addEventListener('change', function () { api.postMessage({ command: 'manageGroup', mode: $('mGroup').value }); }); }
    var f = $('mFilter');
    if (!f) { return; }
    function apply(save) {
        var v = f.value.trim();
        var kind = $('mKind').value;
        var rx = null, lit = '';
        if (v) { try { rx = new RegExp(v, 'i'); } catch (err) { lit = v.toLowerCase(); } }
        var rows = document.querySelectorAll('#mList .mrow');
        var shown = 0;
        rows.forEach(function (r) {
            var text = r.getAttribute('data-text') || '';
            var ok = (!kind || r.getAttribute('data-kind') === kind) && (!v || (rx ? rx.test(text) : text.indexOf(lit) >= 0));
            r.style.display = ok ? '' : 'none';
            // what follows the row (its details, the routines declared in it) is shown with it
            var detail = r.nextElementSibling;
            while (detail && (detail.classList.contains('mdetail') || detail.classList.contains('mnested'))) { detail.style.display = ok ? '' : 'none'; detail = detail.nextElementSibling; }
            if (ok) { shown++; }
        });
        // a group heading stays only while one of its rows is shown
        var heading = null, any = false;
        var items = document.querySelectorAll('#mList > li');
        for (var i = 0; i <= items.length; i++) {
            var it = items[i];
            if (!it || it.getAttribute('data-group')) {
                if (heading) { heading.style.display = any ? '' : 'none'; }
                heading = it || null; any = false;
            } else if (it.style.display !== 'none') { any = true; }
        }
        $('mCount').textContent = (shown === rows.length ? '' : shown + '/') + rows.length;
        if ($('mNone')) { $('mNone').hidden = !!shown || !rows.length; }
        $('mClear').classList.toggle('on', !!v);
        if (save) { api.postMessage({ command: 'manageFilter', text: f.value, kind: kind }); }
    }
    f.addEventListener('input', function () { apply(true); });
    $('mKind').addEventListener('change', function () { apply(true); });
    $('mClear').addEventListener('click', function () { f.value = ''; apply(true); f.focus(); });
    apply(false);
    if (f.getAttribute('data-focus')) { f.focus(); f.select(); }
}
`;
}
