/**
 * "Add / Delete" tab of the sidebar: add a member to any type of the file, and
 * filter, group, go to, edit, rename, move or delete the members of the chosen
 * type. This tab replaces the former "Classes" tree view, with the same
 * abilities (filter, grouping, add / edit / rename / delete / move, accessors,
 * templates, synchronisation) and a type selector for files that hold several.
 *
 * Pure: builds markup from plain data, so it is testable without VS Code.
 */
import { MemberKind, Visibility } from '../models/types';
import { sortMembersForDisplay } from '../utils/memberNavigation';

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
.madd { margin-bottom: 4px; }
`;
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

    html += `<div class="section"><div class="section-title">Add</div><div class="analyze-grid madd">`;
    if (v.add.field) { html += `<button class="ana" data-m-add="field">📦 Field</button>`; }
    if (v.add.method) { html += `<button class="ana" data-m-add="method">🔧 Method</button>`; }
    if (v.add.property) { html += `<button class="ana" data-m-add="property">🔑 Property</button>`; }
    if (v.add.constructor) { html += `<button class="ana" data-m-add="constructor">🏗️ Constructor</button>`; }
    html += `</div><div class="analyze-grid">`
        + `<button class="ana" data-m-run="mmx.insertTemplate" title="Insert a template at the cursor">🧩 Template…</button>`
        + `<button class="ana" data-m-run="mmx.synchronizeDeclImpl" title="Declare / create the missing declarations and implementations">🔄 Sync decl / impl</button>`
        + `<button class="ana" data-m-run="mmx.manageTemplates" title="Create and edit your templates">📝 Templates</button>`
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
            const text = (m.name + ' ' + (m.type ?? '') + ' ' + m.kind + ' ' + m.visibility).toLowerCase();
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
