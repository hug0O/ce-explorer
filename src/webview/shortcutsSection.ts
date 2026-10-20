/**
 * "Shortcuts" tab of the sidebar: every keyboard shortcut of the extension, by the mode it works in
 * (any code file, a Delphi unit, a PL/SQL source, the form designer, the sidebar), with a filter.
 *
 * The shortcuts of the editor come from the keybindings of package.json, so the list cannot drift from
 * what VS Code really binds; the mode is read from the `when` clause. The keys that only exist inside a
 * webview (the form designer, the sidebar) are listed here by hand, and a test checks them against the code
 * that handles them.
 *
 * Pure: builds markup from plain data, so it is testable without VS Code.
 */

export interface ShortcutItem {
    /** `Ctrl+K Ctrl+M`, `Ctrl+C / Ctrl+X`, `Shift+click`… */
    keys: string;
    label: string;
    /** The command behind it, when it is one. */
    command?: string;
    /** A mouse gesture rather than a key. */
    mouse?: boolean;
}

export interface ShortcutGroup {
    id: string;
    title: string;
    /** Where it works, in a few words. */
    hint: string;
    items: ShortcutItem[];
}

export interface PackageShortcuts {
    contributes?: {
        keybindings?: { key: string; command: string; when?: string; mac?: string }[];
        commands?: { command: string; title: string }[];
    };
}

const DELPHI_EXT = new Set(['pas', 'dfm', 'dpr', 'dpk']);
const PLSQL_EXT = new Set(['pks', 'pkb', 'sql', 'pls', 'plb', 'txt']);

/** `ctrl+k ctrl+m` → `Ctrl+K Ctrl+M`, `ctrl+k d` → `Ctrl+K D`, `f12` → `F12`. */
export function formatKeys(key: string): string {
    return key.trim().split(/\s+/).map(chord => chord.split('+').map(t => {
        const k = t.toLowerCase();
        if (k === 'ctrl' || k === 'alt' || k === 'shift') { return k.charAt(0).toUpperCase() + k.slice(1); }
        if (k === 'cmd' || k === 'meta' || k === 'win') { return k === 'cmd' ? 'Cmd' : k.charAt(0).toUpperCase() + k.slice(1); }
        return k.length <= 3 ? k.toUpperCase() : k.charAt(0).toUpperCase() + k.slice(1);
    }).join('+')).join(' ');
}

/** The title of a command without the prefix that groups it in the palette and without its trailing dots. */
export function shortLabel(title: string): string {
    return title.replace(/^CE(?: Delphi| PL\/SQL)?:\s*/, '').replace(/\s*\.{3}$/, '').replace(/\s*\(.*?\)\s*$/, '').trim();
}

/** The extensions a `resourceExtname =~ /…/` clause lets through, or undefined when the clause names none. */
function extensionsOf(when: string): Set<string> | undefined {
    const m = /resourceExtname\s*=~\s*\/\^?\\?\.?\(([^)]*)\)\$?\/i?/.exec(when);
    return m ? new Set(m[1].split('|').map(e => e.trim().toLowerCase())) : undefined;
}

const subsetOf = (a: Set<string>, b: Set<string>): boolean => [...a].every(x => b.has(x));

/** Keys that work inside the form designer tab, which VS Code does not know: the webview reads them. */
export const DESIGNER_SHORTCUTS: ShortcutItem[] = [
    { keys: 'Ctrl+S', label: 'Save the .dfm and the .pas (also while typing in a field of the inspector)' },
    { keys: 'Ctrl+C / Ctrl+X / Ctrl+V', label: 'Copy, cut and paste the selected components; a cut pasted into another container moves them' },
    { keys: 'Ctrl+Z / Ctrl+Y', label: 'Undo / redo (Ctrl+Shift+Z also redoes)' },
    { keys: 'Ctrl+A', label: 'Select every component of the container of the selection (of the form when nothing is selected)' },
    { keys: 'Delete', label: 'Delete the selected components' },
    { keys: 'Arrows', label: 'Move the selection by 1 pixel (Shift: by a grid step)' },
    { keys: 'Ctrl+Arrows', label: 'Resize the selection by 1 pixel (Shift: by a grid step)' },
    { keys: 'Esc', label: 'Cancel the armed tool or a cut; else select the parent of the selection' },
    { keys: 'P', label: 'Show / hide the palette and the component list' },
    { keys: 'I', label: 'Show / hide the inspector' },
    { keys: 'F', label: 'Full screen, and back' },
    { keys: 'Click', label: 'Select a component', mouse: true },
    { keys: 'Shift+click / Ctrl+click', label: 'Extend the selection / add or remove one component (also in the component list)', mouse: true },
    { keys: 'Drag on the form', label: 'Draw a rectangle to select every component it touches', mouse: true },
    { keys: 'Drag a component', label: 'Move it; drop it on a container to change its parent (Alt: no grid snapping)', mouse: true },
    { keys: 'Double-click', label: 'Create or open the default handler of the component', mouse: true },
    { keys: 'Drag a bar', label: 'Resize the palette or the inspector (double-click: default width)', mouse: true },
];

/** What the sidebar itself reads. */
export const SIDEBAR_SHORTCUTS: ShortcutItem[] = [
    { keys: 'Click a member', label: 'Structure: go to it, and show where it is used in the file', mouse: true },
    { keys: 'Click a line of a list', label: 'Structure usages and search, Code review: go to that line', mouse: true },
    { keys: 'Enter / Space', label: 'On a finding of the review: go to its line' },
    { keys: 'Esc', label: 'In the member search box or the shortcuts filter: clear it' },
];

/** The shortcuts by mode: editor ones from the keybindings of package.json, then the ones of the form designer and of the sidebar. */
export function buildShortcutGroups(pkg: PackageShortcuts): ShortcutGroup[] {
    const titles = new Map((pkg.contributes?.commands ?? []).map(c => [c.command, c.title]));
    const any: ShortcutItem[] = [];
    const code: ShortcutItem[] = [];
    const delphi: ShortcutItem[] = [];
    const plsql: ShortcutItem[] = [];
    const designer: ShortcutItem[] = [];
    for (const k of pkg.contributes?.keybindings ?? []) {
        const item: ShortcutItem = { keys: formatKeys(k.key), label: shortLabel(titles.get(k.command) ?? k.command), command: k.command };
        const when = k.when ?? '';
        const exts = extensionsOf(when);
        if (/ceFormDesigner/.test(when)) { designer.push(item); }
        if (exts && subsetOf(exts, DELPHI_EXT)) { delphi.push(item); }
        else if (exts && subsetOf(exts, PLSQL_EXT)) { plsql.push(item); }
        else if (exts) { code.push(item); }
        else if (!/ceFormDesigner/.test(when)) { any.push(item); }
    }
    const groups: ShortcutGroup[] = [
        { id: 'code', title: 'Any code file', hint: 'Pascal, C++, Rust, Java, Python, C#, Go, TypeScript, JavaScript, PL/SQL', items: code },
        { id: 'any', title: 'Any editor', hint: 'whatever the file', items: any },
        { id: 'delphi', title: 'Delphi units and forms', hint: '.pas  .dfm  .dpr — the same letters mean other things in PL/SQL files', items: delphi },
        { id: 'plsql', title: 'PL/SQL sources', hint: '.pks  .pkb  .sql  .pls  .plb  .txt', items: plsql },
        { id: 'designer', title: 'Form designer', hint: 'in the designer tab', items: [...designer, ...DESIGNER_SHORTCUTS] },
        { id: 'sidebar', title: 'Sidebar', hint: 'this view', items: SIDEBAR_SHORTCUTS },
    ];
    return groups.filter(g => g.items.length > 0);
}

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function shortcutsCss(): string {
    return `
.kbar { display: flex; gap: 4px; margin-bottom: 8px; }
.kbar .inp { flex: 1; }
.kgroup { margin-bottom: 8px; }
.kgroup > summary { cursor: pointer; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--vscode-descriptionForeground); margin: 4px 0; }
.kgroup .khint { font-weight: 400; text-transform: none; letter-spacing: 0; opacity: 0.8; }
.krow { display: flex; gap: 8px; align-items: baseline; padding: 2px 4px; border-radius: 3px; font-size: 12px; }
.krow:hover { background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.15)); }
.krow .keys { flex: none; min-width: 7.5em; max-width: 11em; display: flex; flex-wrap: wrap; gap: 2px; }
.krow .key { font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; padding: 0 5px; border: 1px solid rgba(128, 128, 128, 0.5); border-radius: 3px; background: var(--vscode-textBlockQuote-background, rgba(128, 128, 128, 0.12)); white-space: nowrap; }
.krow.mouse .key { border-style: dashed; }
.krow .klabel { min-width: 0; word-break: break-word; }
.knone { color: var(--vscode-descriptionForeground); font-style: italic; }
.knote { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 8px; }
`;
}

/** `Ctrl+K Ctrl+M` as keycaps, one per chord; alternatives (`A / B`) as separate keycap groups. */
function capsHtml(keys: string): string {
    return keys.split(' / ').map(alt => alt.trim().split(' ').map(chord => `<span class="key">${esc(chord)}</span>`).join(' ')).join(' / ');
}

export function shortcutsHtml(groups: ShortcutGroup[], filter: string, extensionId: string): string {
    let html = `<div class="section"><div class="section-title">Keyboard shortcuts</div>`
        + `<div class="kbar"><input id="kFilter" class="inp" type="text" spellcheck="false" placeholder="Filter: key, command, mode…" value="${esc(filter)}">`
        + `<button class="ana w-auto" id="kRebind" title="Open the Keyboard Shortcuts editor on the shortcuts of this extension, to change them" data-ext="${esc(extensionId)}">⚙</button></div>`;
    for (const g of groups) {
        html += `<details class="kgroup" open data-group="${esc(g.id)}"><summary>${esc(g.title)} <span class="khint">${esc(g.hint)}</span></summary>`;
        for (const it of g.items) {
            const text = (g.title + ' ' + it.keys + ' ' + it.label + ' ' + (it.command ?? '')).toLowerCase();
            html += `<div class="krow${it.mouse ? ' mouse' : ''}" data-text="${esc(text)}"${it.command ? ` title="${esc(it.command)}"` : ''}>`
                + `<span class="keys">${capsHtml(it.keys)}</span><span class="klabel">${esc(it.label)}</span></div>`;
        }
        html += `</details>`;
    }
    html += `<p class="knone" id="kNone" hidden>No shortcut matches.</p>`
        + `<p class="knote">These are the default keys. A chord is Ctrl+K, release, then the second key. The same Ctrl+K letter means another command in Delphi and in PL/SQL files. Dashed keys are mouse gestures. Use ⚙ to change a key in VS Code.</p></div>`;
    return html;
}

/** JS defining `initShortcuts(api)`: live filter (a group with no match disappears), the button that opens the keybindings editor. */
export function shortcutsScript(): string {
    return `
function initShortcuts(api) {
    var f = document.getElementById('kFilter');
    if (!f) { return; }
    function apply(save) {
        var v = f.value.trim().toLowerCase();
        var words = v ? v.split(/\\s+/) : [];
        var any = false;
        document.querySelectorAll('.kgroup').forEach(function (g) {
            var shown = 0;
            g.querySelectorAll('.krow').forEach(function (r) {
                var text = r.getAttribute('data-text') || '';
                var ok = words.every(function (w) { return text.indexOf(w) >= 0; });
                r.hidden = !ok;
                if (ok) { shown++; }
            });
            g.hidden = shown === 0;
            if (v) { g.open = shown > 0; }
            if (shown) { any = true; }
        });
        document.getElementById('kNone').hidden = any;
        if (save) { api.postMessage({ command: 'shortcutFilter', text: f.value }); }
    }
    f.addEventListener('input', function () { apply(true); });
    f.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { f.value = ''; apply(true); } });
    document.getElementById('kRebind').addEventListener('click', function () {
        api.postMessage({ command: 'openKeybindings' });
    });
    apply(false);
}
`;
}
