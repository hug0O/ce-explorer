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
    /** Delphi: the events wired on this component in the .dfm, with the line of the handler in the unit (none: no implementation found). */
    events?: { event: string; handler: string; line?: number }[];
    /** Delphi: for a TPopupMenu / TMainMenu, its items with the handler of each (`line`: where it is in the unit). */
    menuItems?: { name: string; caption: string; depth: number; shortcut: string; event?: string; handler?: string; line?: number }[];
    /** Delphi: the `Component.OnEvent` this routine is the handler of. */
    handlerOf?: string[];
    /** What the former Details tab said about the member: its kind, its attributes and its parameters. */
    signature?: { kind: string; props: { label: string; value: string }[]; params: { dir: string; name: string; type: string }[] };
    /** Which blocks are unfolded; the choice is kept by the panel between redraws. */
    open: { used: boolean; vars: boolean; find: boolean; events?: boolean };
}

export interface ManageView {
    /** Delphi unit with a form: a button at the top goes to the designer, with the component of the focus selected when there is one. */
    designer?: { id: string; name?: string };
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
    /** What the filter finds in the files this file uses (`unit.name`), when something is typed. */
    external?: ExternalRow[];
}

/** An object of another file that the code uses: where it is written, how many times, and the first line that uses it. */
export interface OutsideRow { label: string; kind: string; count: number; line: number; uses: { line: number; text: string }[]; more: number }

/** An object of a file the current one uses: how it is written in the list, and what it is. */
export interface ExternalRow { label: string; kind: string }

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ICONS: Record<string, string> = { field: '📦', property: '🔑', constructor: '🏗️', destructor: '🧹', method: '🔧', heading: '§' };
const KIND_LABELS: Record<string, string> = { method: 'Methods', field: 'Fields', property: 'Properties', constructor: 'Constructors', destructor: 'Destructors', heading: 'Headings' };
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
/* the filter stays on screen while a long list scrolls under it */
.mstick { position: sticky; top: 0; z-index: 5; background: var(--vscode-editor-background); padding: 3px 0 2px; margin: 0 -2px; }
.mstick .tool-row { margin-bottom: 3px; padding: 0 2px; }
/* nothing is wider than the sidebar: long names are cut with an ellipsis, buttons and icons keep their size */
.tool-row .tool-select, .tool-row .inp { min-width: 0; max-width: 100%; text-overflow: ellipsis; }
.mrow { min-width: 0; }
.mrow > span { flex: none; }
.mrow > .mname { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mrow > .mtype { flex: 0 3 auto; min-width: 0; }
.mrow > .var-actions { flex: none; margin-left: auto; }
.mnested { min-width: 0; }
.mnested > span { flex: none; }
.mnested > .mnname { flex: 0 1 auto; min-width: 0; }
.mdetail .var-row { min-width: 0; }
.mdetail .var-row > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mdetail .var-row > .var-actions { flex: none; }
.member-header { flex-wrap: wrap; min-width: 0; }
.member-header .name { min-width: 0; overflow-wrap: anywhere; }
.mbtns .ana { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mhead { min-width: 0; }
.mhead .tool-select { min-width: 0; }
.mfilter .inp { padding-right: 22px; }
.mfilter .mclear { position: absolute; right: 2px; top: 1px; background: transparent; border: none; color: var(--vscode-descriptionForeground); cursor: pointer; font-size: 14px; display: none; }
.mfilter .mclear.on { display: block; }
.mgroup { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--vscode-descriptionForeground); margin: 8px 0 2px 2px; list-style: none; }
.mrow.kcur { outline: 1px solid var(--vscode-focusBorder, #007fd4); outline-offset: -1px; }
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
.msig { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; margin: 2px 0 4px; font-size: 11px; }
.msig .kind-badge { font-size: 10px; padding: 1px 6px; border-radius: 3px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); text-transform: uppercase; letter-spacing: 0.5px; }
.msigl { color: var(--vscode-descriptionForeground); }
.msigparams { margin: 0 0 4px; }
.rowmenu { position: relative; }
.rowmenu > summary { list-style: none; cursor: pointer; padding: 0 6px; border-radius: 3px; font-size: 14px; line-height: 16px; color: var(--vscode-descriptionForeground); }
.rowmenu > summary::-webkit-details-marker { display: none; }
.rowmenu > summary:hover, .rowmenu[open] > summary { background: var(--vscode-toolbar-hoverBackground, rgba(128, 128, 128, 0.25)); color: var(--vscode-foreground); }
.rowmenu-left { right: auto; left: 0; }
.madd-box .mbtns { align-items: center; }
.mbtn-menu > summary { display: block; list-style: none; cursor: pointer; width: auto; padding: 2px 7px; font-size: 11px; line-height: 1.35; }
.rowmenu-list { position: absolute; right: 0; top: 100%; z-index: 30; min-width: 150px; padding: 3px; background: var(--vscode-menu-background, var(--vscode-editorWidget-background, #252526)); color: var(--vscode-menu-foreground, var(--vscode-foreground)); border: 1px solid var(--vscode-menu-border, var(--vscode-widget-border, rgba(128, 128, 128, 0.5))); border-radius: 4px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4); display: flex; flex-direction: column; }
.rowitem { text-align: left; padding: 3px 8px; font-size: 12px; font-family: inherit; background: transparent; color: inherit; border: none; border-radius: 3px; cursor: pointer; white-space: nowrap; }
.rowitem:hover { background: var(--vscode-menu-selectionBackground, var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.25))); color: var(--vscode-menu-selectionForeground, inherit); }
.mdetail .var-btn { background: transparent; border: none; cursor: pointer; font-size: 13px; padding: 1px 3px; line-height: 1; }
.mdetail .ana { margin-top: 3px; }
.mdetail .mdet > summary { margin-top: 0; }
.mdet > summary { cursor: pointer; font-size: 11px; color: var(--vscode-descriptionForeground); margin: 2px 0 4px; }
/* a list uses the height of the sidebar (the pinned filter takes the top), never less than a few rows */
.mhits { list-style: none; max-height: max(190px, calc(100vh - 170px)); overflow: auto; margin: 2px 0 6px; }
.mhit { display: flex; gap: 6px; padding: 1px 4px; border-radius: 3px; cursor: pointer; font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; }
.mhit:hover { background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.15)); }
.mdesigner { margin: 0 0 8px; }
.mhits .mkey { color: var(--vscode-descriptionForeground); font-size: 10px; }
.mhits .mparent { list-style: none; margin: 4px 0 1px; padding: 0 4px; font-size: 10px; font-style: italic; color: var(--vscode-descriptionForeground); opacity: 0.75; cursor: default; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mextlist .mln { min-width: 4.5em; text-align: left; }
.mobjs { list-style: none; }
.mobj > details > summary { display: flex; gap: 6px; align-items: baseline; padding: 1px 4px; border-radius: 3px; cursor: pointer; list-style: none; font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; }
.mobj > details > summary::-webkit-details-marker { display: none; }
.mobj > details > summary::before { content: '▸'; flex: none; width: 10px; color: var(--vscode-descriptionForeground); }
.mobj > details[open] > summary::before { content: '▾'; }
.mobj > details > summary:hover { background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.15)); }
.mcount { flex: none; margin-left: auto; color: var(--vscode-descriptionForeground); font-size: 10px; }
.mopen { flex: none; background: transparent; border: none; color: var(--vscode-descriptionForeground); cursor: pointer; padding: 0 3px; font-size: 12px; }
.mopen:hover { color: var(--vscode-foreground); }
.muses { list-style: none; margin: 0 0 4px 16px; padding-left: 6px; border-left: 2px solid var(--vscode-focusBorder, #007fd4); }
.mnote { font-size: 11px; color: var(--vscode-descriptionForeground); margin: 2px 0 6px; }
.mhit.off { opacity: 0.6; cursor: default; }
.mhit .mln { flex: none; min-width: 3em; text-align: right; color: var(--vscode-descriptionForeground); }
.mhit .mtx { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mhits:empty { display: none; }
.mmore { font-size: 10px; color: var(--vscode-descriptionForeground); padding: 1px 4px; }
.msearchinfo { font-size: 10px; color: var(--vscode-descriptionForeground); min-height: 13px; }
`;
}

/** The rows of the objects found in the used files: a click opens the file at the object. */
export function externalRowsHtml(rows: ExternalRow[]): string {
    return rows.map((r, i) => `<li class="mhit mext" data-ext="${i}" title="Open ${esc(r.label)}"><span class="mln">${esc(r.kind)}</span><span class="mtx">${esc(r.label)}</span></li>`).join('');
}

/**
 * The rows of the objects used from outside: a row opens to the lines of this file that write the object (a click on a line goes to it in
 * the code), and the arrow opens the object in its own file.
 */
export function outsideRowsHtml(rows: OutsideRow[]): string {
    return rows.map((r, i) => `<li class="mobj" data-text="${esc((r.label + ' ' + r.kind + ' ' + r.uses.map(u => u.text).join(' ')).toLowerCase())}"><details>`
        + `<summary title="Show the ${r.count} place(s) that write it"><span class="mln">${esc(r.kind)}</span><span class="mtx">${esc(r.label)}</span>`
        + `<span class="mcount">×${r.count}</span><button class="mopen" data-out="${i}" title="Open ${esc(r.label)} in its file">↗</button></summary>`
        + `<ul class="muses">${r.uses.map(u => `<li class="mhit" data-m-line="${u.line}" title="Go to line ${u.line + 1}"><span class="mln">${u.line + 1}</span><span class="mtx">${esc(u.text)}</span></li>`).join('')}`
        + (r.more ? `<li class="mmore">… ${r.more} more line(s) not listed</li>` : '') + `</ul></details></li>`).join('');
}

/** The page of the tab Used: what the code of the open file uses from other files, with its own filter. */
export function outsidePageHtml(o: { rows: OutsideRow[]; ready: boolean }): string {
    const note = !o.ready ? 'Reading the project...' : o.rows.length ? '' : 'The code uses nothing from the files it points to (or they hold nothing that is written here).';
    return `<div class="section"><div class="section-title">Used from outside this file (<span id="mOutCount">${o.ready ? o.rows.length : '...'}</span>)</div>`
        + `<div class="tool-row mfilter"><input id="mOutFilter" class="inp" type="text" spellcheck="false" placeholder="Filter: file, object, kind, a word of the line...">`
        + `<button class="mclear" id="mOutClear" title="Clear the filter">×</button></div>`
        + `<div class="mnote" id="mOutNote">${esc(note)}</div>`
        + `<ul class="mobjs" id="mOutside">${outsideRowsHtml(o.rows)}</ul></div>`;
}

function hitRowsHtml(hits: LineHit[], total: number): string {
    // the routine that holds the lines is written in grey above the first line of each group
    let last: string | undefined = '';
    return hits.map(h => {
        const head = h.parent !== undefined && h.parent !== last ? `<li class="mparent" title="The routine that holds the lines below">${esc(h.parent)}</li>` : '';
        last = h.parent;
        return head + `<li class="mhit" data-m-line="${h.line}" title="Go to line ${h.line + 1}"><span class="mln">${h.line + 1}</span><span class="mtx">${esc(h.text)}</span></li>`;
    }).join('')
        + (total > hits.length ? `<li class="mmore">… ${total - hits.length} more not listed (first ${MAX_HITS} shown)</li>` : '');
}

/** What goes under the selected member's row: where it is used in this file, its variables, a search box over its own code. Each block folds. */
export function focusHtml(f: FocusView): string {
    const open = (on: boolean): string => (on ? ' open' : '');
    let html = `<div class="mfocus" id="mFocus">`;
    if (f.signature) {
        html += `<div class="msig"><span class="kind-badge">${esc(f.signature.kind)}</span>`
            + f.signature.props.map(x => `<span class="msigp"><span class="msigl">${esc(x.label)}</span> ${esc(x.value)}</span>`).join('') + `</div>`;
        if (f.signature.params.length) {
            html += `<ul class="params-list msigparams">` + f.signature.params.map(q =>
                `<li class="param-item" data-run="ce.editMember" title="Edit the parameters of ${esc(f.name)}">${q.dir ? `<span class="dir">${esc(q.dir)} </span>` : ''}<span class="pname">${esc(q.name)}</span>: <span class="ptype">${esc(q.type)}</span><span class="param-edit">✏️</span></li>`).join('') + `</ul>`;
        }
    }
    if (f.handlerOf?.length) {
        html += `<p class="mnote">⚡ Handler of <b>${f.handlerOf.map(esc).join('</b>, <b>')}</b></p>`;
    }
    if (f.events?.length) {
        html += `<details class="mdet" data-fold="events"${open(f.open.events !== false)}><summary>Events (${f.events.length})</summary><ul class="mhits" id="mEvents">`
            + f.events.map(e => e.line === undefined
                ? `<li class="mhit off" title="${esc(e.handler)} is named in the .dfm but has no implementation in this unit"><span class="mln">${esc(e.event)}</span><span class="mtx">${esc(e.handler)} (no implementation)</span></li>`
                : `<li class="mhit" data-m-line="${e.line}" title="Go to ${esc(e.handler)} (line ${e.line + 1})"><span class="mln">${esc(e.event)}</span><span class="mtx">${esc(e.handler)}</span></li>`).join('')
            + `</ul></details>`;
    }
    if (f.menuItems?.length) {
        html += `<details class="mdet" data-fold="events"${open(f.open.events !== false)}><summary>Menu items (${f.menuItems.length})</summary><ul class="mhits" id="mMenuItems">`
            + f.menuItems.map(i => {
                const pad = `style="padding-left:${4 + i.depth * 12}px"`;
                const cap = i.caption === '-' ? '───' : i.caption;
                const sc = i.shortcut ? ` <span class="mkey">${esc(i.shortcut)}</span>` : '';
                if (!i.handler) { return `<li class="mhit off" ${pad} title="${esc(i.name)}: no OnClick"><span class="mln">${esc(i.name)}</span><span class="mtx">${esc(cap)}${sc}</span></li>`; }
                return i.line === undefined
                    ? `<li class="mhit off" ${pad} title="${esc(i.handler)} is named in the .dfm but has no implementation in this unit"><span class="mln">${esc(i.name)}</span><span class="mtx">${esc(cap)}${sc} → ${esc(i.handler)} (no implementation)</span></li>`
                    : `<li class="mhit" ${pad} data-m-line="${i.line}" title="Go to ${esc(i.handler)} (line ${i.line + 1})"><span class="mln">${esc(i.name)}</span><span class="mtx">${esc(cap)}${sc} → ${esc(i.handler)}</span></li>`;
            }).join('')
            + `</ul></details>`;
    }
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

    if (v.designer) {
        html += `<button class="ana has-kbd mdesigner" data-m-act="designer" data-id="${esc(v.designer.id)}" title="${v.designer.name ? 'Back to the form designer with ' + esc(v.designer.name) + ' selected' : 'Back to the form designer'}">🎨 Show in the designer${v.designer.name ? ' (' + esc(v.designer.name) + ')' : ''}<span class="kbd">Ctrl+K Ctrl+B</span></button>`;
    }
    // one Add button that lists the kinds, the two everyday actions beside it, the rest in a menu: eight buttons became four
    const kinds = [
        v.add.field ? `<button class="rowitem" data-m-add="field">📦 Field</button>` : '',
        v.add.method ? `<button class="rowitem" data-m-add="method">🔧 Method</button>` : '',
        v.add.property ? `<button class="rowitem" data-m-add="property">🔑 Property</button>` : '',
        v.add.constructor ? `<button class="rowitem" data-m-add="constructor">🏗️ Constructor</button>` : '',
    ].join('');
    html += `<div class="section madd-box"><div class="mbtns">`
        + `<details class="rowmenu mbtn-menu"><summary class="ana" title="Add a method, a field, a property or a constructor">＋ Add ▾</summary><div class="rowmenu-list rowmenu-left">${kinds}</div></details>`
        + `<button class="ana" data-m-run="ce.insertTemplate" title="Insert a template at the cursor">🧩 Template…</button>`
        + `<button class="ana" data-m-run="ce.synchronizeDeclImpl" title="Declare / create the missing declarations and implementations">🔄 Sync</button>`
        + `<details class="rowmenu mbtn-menu"><summary class="ana" title="Templates, refresh">⋯</summary><div class="rowmenu-list">`
        + `<button class="rowitem" data-m-run="ce.manageTemplates" title="Create and edit your templates">📝 Templates</button>`
        + `<button class="rowitem" id="mRefresh" title="Parse the file again">♻️ Refresh</button>`
        + `</div></details>`
        + `</div></div>`;

    const total = v.rows.length;
    html += `<div class="section"><div class="section-title">${v.isFile ? 'Routines' : 'Members'} (<span id="mCount">${total}</span>)</div>`;
    html += `<div class="mstick"><div class="tool-row mfilter"><input id="mFilter" class="inp" type="text" spellcheck="false" placeholder="Filter: name, type, kind… (regex ok)" value="${esc(v.filter)}"${v.focusFilter ? ' data-focus="1"' : ''}>`
        + `<button class="mclear" id="mClear" title="Clear the filter">×</button></div>`;
    html += `<div class="tool-row"><select id="mKind" class="tool-select" title="Only this kind of member">`
        + `<option value="">All kinds</option>`
        + (['method', 'field', 'property', 'constructor'] as const).map(k => `<option value="${k}"${v.kindFilter === k ? ' selected' : ''}>${KIND_LABELS[k]}</option>`).join('')
        + `</select><select id="mGroup" class="tool-select" title="Order and grouping">`
        + MANAGE_GROUPS.map(g => `<option value="${g}"${v.group === g ? ' selected' : ''}>${MANAGE_GROUP_LABELS[g]}</option>`).join('')
        + `</select></div></div>`;

    if (total === 0) {
        html += `<p class="empty-section">Nothing here yet, use the buttons above.</p>`;
    } else {
        html += `<ul class="mlist" id="mList" title="Up / Down move along the members, Enter goes to one, F2 renames it, E edits it, Delete deletes it">`;
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
                // one button, the actions in the list it opens: the row stays a name and a type
                + `<span class="var-actions"><details class="rowmenu"><summary class="var-btn" title="Edit, rename, delete...">⋯</summary><div class="rowmenu-list">`
                + `<button class="rowitem" data-m-act="edit" data-id="${id}" title="Edit (E)">✏️ Edit</button>`
                + `<button class="rowitem" data-m-act="rename" data-id="${id}" title="Rename (F2)">🔤 Rename</button>`
                + `<button class="rowitem" data-m-act="docHeader" data-id="${id}" title="Insert or refresh the doc header of the member">📄 Doc header</button>`
                + (m.kind === MemberKind.Field && !v.isFile ? `<button class="rowitem" data-m-act="getset" data-id="${id}" title="Generate getter / setter">🔑 Getter / setter</button>` : '')
                + (v.canMove && !v.isFile ? `<button class="rowitem" data-m-act="move" data-id="${id}" title="Move to another type…">➡️ Move to...</button>` : '')
                + `<button class="rowitem" data-m-act="delete" data-id="${id}" title="Delete (Delete)">🗑️ Delete</button>`
                + `</div></details></span></li>`;
            if (v.focus && v.focus.id === m.id) { html += `<li class="mdetail">${focusHtml(v.focus)}</li>`; }
            for (const n of m.nested ?? []) {
                html += `<li class="mnested d${Math.min(3, n.depth)}" data-m-act="goline" data-id="${n.line}" title="${esc(n.name)} is declared inside ${esc(m.name)}: go to line ${n.line + 1}">`
                    + `<span>↳</span><span class="mnname">${esc(n.name)}</span><span class="mnkind">${esc(n.kind)}</span></li>`;
            }
        }
        html += `</ul><p class="empty-section" id="mNone" hidden>No member matches the filter.</p>`;
    }
    // what is written in the files this file uses (units, headers, modules) and is not in it: found with the same filter, as <file>.<object>
    const ext = v.external ?? [];
    html += `<div id="mExtBox"${ext.length ? '' : ' hidden'}><div class="mgroup" id="mExtTitle" title="Objects of the files this file uses, found by the filter">From the files it uses (${ext.length})</div>`
        + `<ul class="mhits mextlist" id="mExternal">${externalRowsHtml(ext)}</ul></div>`;
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
    // the objects of the used files: the host sends them when the filter changes; a click asks the host to open one (it knows where it is)
    window.addEventListener('message', function (ev) {
        var m = ev.data;
        if (!m || m.command !== 'externalHits') { return; }
        var ul = $('mExternal'), box = $('mExtBox');
        if (!ul || !box) { return; }
        while (ul.firstChild) { ul.removeChild(ul.firstChild); }
        (m.hits || []).forEach(function (h, i) {
            var li = document.createElement('li'); li.className = 'mhit mext'; li.setAttribute('data-ext', String(i)); li.title = 'Open ' + h.label;
            var a = document.createElement('span'); a.className = 'mln'; a.textContent = h.kind;
            var b = document.createElement('span'); b.className = 'mtx'; b.textContent = h.label;
            li.appendChild(a); li.appendChild(b); ul.appendChild(li);
        });
        $('mExtTitle').textContent = 'From the files it uses (' + (m.hits || []).length + ')';
        box.hidden = !(m.hits || []).length;
    });
    document.addEventListener('click', function (ev) {
        var row = ev.target && ev.target.closest ? ev.target.closest('[data-ext]') : null;
        if (row) { api.postMessage({ command: 'openExternal', index: Number(row.getAttribute('data-ext')) }); return; }
        var out = ev.target && ev.target.closest ? ev.target.closest('[data-out]') : null;
        if (out) { ev.preventDefault(); api.postMessage({ command: 'openOutside', index: Number(out.getAttribute('data-out')) }); }
    });
    /* What the code uses from outside: its own filter, applied here on every word typed (the list is already in the page); the host sends the list when it is read */
    (function () {
      var box = $('mOutFilter'), ul = $('mOutside');
      if (!box || !ul) { return; }
      function apply() {
        var words = box.value.toLowerCase().split(/\s+/).filter(Boolean), n = 0;
        Array.prototype.forEach.call(ul.children, function (li) {
          var t = li.getAttribute('data-text') || '';
          var show = words.every(function (w) { return t.indexOf(w) >= 0; });
          li.style.display = show ? '' : 'none';
          if (show) { n++; }
        });
        $('mOutCount').textContent = String(n);
        $('mOutClear').classList.toggle('on', !!box.value);
      }
      box.addEventListener('input', apply);
      box.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { box.value = ''; apply(); } });
      $('mOutClear').addEventListener('click', function () { box.value = ''; apply(); box.focus(); });
      window.addEventListener('message', function (ev) {
        var m = ev.data;
        if (!m || m.command !== 'outsideHits') { return; }
        ul.innerHTML = m.html || '';
        $('mOutNote').textContent = m.count ? '' : 'The code uses nothing from the files it points to (or they hold nothing that is written here).';
        apply();
      });
    })();
    if ($('mRefresh')) { $('mRefresh').addEventListener('click', function () { api.postMessage({ command: 'manageRefresh' }); }); }
    if ($('mType')) { $('mType').addEventListener('change', function () { api.postMessage({ command: 'manageClass', id: $('mType').value }); }); }
    if ($('mGroup')) { $('mGroup').addEventListener('change', function () { api.postMessage({ command: 'manageGroup', mode: $('mGroup').value }); }); }
    /* The keyboard: arrows move along the members, Enter goes to one, F2 renames it, E edits it, Delete deletes it; the member under the cursor is shown. */
    (function () {
      function shown() { return Array.prototype.filter.call(document.querySelectorAll('#mList .mrow'), function (r) { return r.style.display !== 'none'; }); }
      function mark(row) {
        document.querySelectorAll('#mList .mrow.kcur').forEach(function (r) { r.classList.remove('kcur'); });
        if (row) { row.classList.add('kcur'); if (row.scrollIntoView) { row.scrollIntoView({ block: 'nearest' }); } }
      }
      var cursorRow = document.querySelector('#mList .mrow.sel');
      if (cursorRow && cursorRow.scrollIntoView) { cursorRow.scrollIntoView({ block: 'center' }); }
      function act(row, what) { var b = row && row.querySelector('[data-m-act="' + what + '"]'); if (b) { b.click(); } }
      document.addEventListener('keydown', function (ev) {
        var t = ev.target, tag = t && t.tagName;
        var inField = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
        if (inField && t.id !== 'mFilter' && t.id !== 'mSearch') { return; }
        if (ev.ctrlKey || ev.metaKey || ev.altKey) { return; }
        var rows = shown();
        if (!rows.length) { return; }
        var at = -1;
        rows.forEach(function (r, i) { if (r.classList.contains('kcur')) { at = i; } });
        if (at < 0) { rows.forEach(function (r, i) { if (r.classList.contains('sel')) { at = i; } }); }
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
          var next = at < 0 ? (ev.key === 'ArrowDown' ? 0 : rows.length - 1) : Math.max(0, Math.min(rows.length - 1, at + (ev.key === 'ArrowDown' ? 1 : -1)));
          mark(rows[next]); ev.preventDefault(); return;
        }
        if (inField) { if (ev.key === 'Enter' && t.id === 'mFilter') { var go = rows[at >= 0 ? at : 0]; act(go, 'go'); ev.preventDefault(); } return; }
        if (ev.key === 'Home') { mark(rows[0]); ev.preventDefault(); }
        else if (ev.key === 'End') { mark(rows[rows.length - 1]); ev.preventDefault(); }
        else if (at < 0) { return; }
        else if (ev.key === 'Enter') { act(rows[at], 'go'); ev.preventDefault(); }
        else if (ev.key === 'F2') { act(rows[at], 'rename'); ev.preventDefault(); }
        else if (ev.key === 'e' || ev.key === 'E') { act(rows[at], 'edit'); ev.preventDefault(); }
        else if (ev.key === 'Delete') { act(rows[at], 'delete'); ev.preventDefault(); }
      });
    })();
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
