/**
 * The keys of the designer, in a menu of the designer itself: a "Keys" button (and `?` or F1) opens a list of every shortcut and mouse
 * gesture, with a filter. The list is the one of the Shortcuts tab of the sidebar, so the two cannot disagree. Plain JavaScript in a
 * string, without template literal or backslash.
 */
import { DESIGNER_SHORTCUTS, ShortcutItem } from './shortcutsSection';

/** What is bound outside the page (VS Code reads these chords), listed first. */
export const DESIGNER_CHORDS: ShortcutItem[] = [
    { keys: 'Ctrl+K Ctrl+B', label: 'Switch between the designer and the code of the unit (the component selected comes back selected)' },
    { keys: 'Ctrl+K Ctrl+F', label: 'Full screen of the designer, and back' },
];

export function helpItems(): ShortcutItem[] { return [...DESIGNER_CHORDS, ...DESIGNER_SHORTCUTS]; }

export function helpButton(): string {
    return '<button id="helpbtn" title="Every key and gesture of the designer (? or F1)">⌨ Keys</button>';
}

export function helpHtml(): string {
    return '<div id="keyhelp" hidden><div class="khead"><b>Keys of the designer</b><input id="keyq" type="text" placeholder="Filter: a key, a word..." spellcheck="false"><button id="keyx" title="Close (Esc)">✕</button></div><div id="keylist"></div></div>';
}

export function helpCss(): string {
    return `
#helpbtn { white-space: nowrap; }
#keyhelp { position: fixed; z-index: 240; left: 50%; top: 70px; transform: translateX(-50%); width: min(640px, 92vw); max-height: 78vh; display: flex; flex-direction: column; background: var(--vscode-menu-background, var(--vscode-editorWidget-background, #252526)); color: var(--vscode-foreground); border: 1px solid var(--vscode-menu-border, var(--vscode-widget-border, rgba(128,128,128,0.5))); border-radius: 6px; box-shadow: 0 6px 22px rgba(0,0,0,0.5); padding: 8px 10px; }
#keyhelp[hidden] { display: none; }
#keyhelp .khead { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
#keyhelp .khead input { flex: 1; min-width: 0; }
#keyhelp .khead button { background: transparent; border: none; color: inherit; cursor: pointer; font-size: 14px; }
#keylist { overflow-y: auto; }
#keylist .kh { font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--vscode-descriptionForeground); margin: 8px 2px 2px; }
#keylist .kr { display: flex; gap: 10px; align-items: baseline; padding: 2px 4px; border-radius: 3px; font-size: 12px; }
#keylist .kr:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.18)); }
#keylist .kk { flex: none; min-width: 150px; font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; color: var(--vscode-textLink-foreground, #3794ff); }
#keylist .kl { min-width: 0; }
`;
}

export function helpScript(): string {
    // the list as data: JSON of plain strings (no quote or backslash inside them: a test keeps it so)
    const data = JSON.stringify(helpItems().map(i => ({ k: i.keys, l: i.label, m: !!i.mouse })));
    return `
/* ───────── the keys of the designer, in a menu ───────── */
var KEYS = ${data};
function helpOpen(on) {
  var box = $('keyhelp');
  box.hidden = !on;
  if (on) { $('keyq').value = ''; helpDraw(''); $('keyq').focus(); }
}
function helpDraw(q) {
  var list = $('keylist');
  list.textContent = '';
  var words = q.toLowerCase().split(' ').filter(Boolean);
  var any = false;
  [false, true].forEach(function (mouse) {
    var rows = KEYS.filter(function (k) {
      if (k.m !== mouse) { return false; }
      var t = (k.k + ' ' + k.l).toLowerCase();
      return words.every(function (w) { return t.indexOf(w) >= 0; });
    });
    if (!rows.length) { return; }
    any = true;
    var h = document.createElement('div'); h.className = 'kh'; h.textContent = mouse ? 'Mouse' : 'Keyboard'; list.appendChild(h);
    rows.forEach(function (k) {
      var r = document.createElement('div'); r.className = 'kr';
      var a = document.createElement('span'); a.className = 'kk'; a.textContent = k.k;
      var b = document.createElement('span'); b.className = 'kl'; b.textContent = k.l;
      r.appendChild(a); r.appendChild(b); list.appendChild(r);
    });
  });
  if (!any) { var n = document.createElement('div'); n.className = 'kh'; n.textContent = 'No key matches.'; list.appendChild(n); }
}
$('helpbtn').addEventListener('click', function () { helpOpen($('keyhelp').hidden); });
$('keyx').addEventListener('click', function () { helpOpen(false); });
$('keyq').addEventListener('input', function () { helpDraw($('keyq').value); });
document.addEventListener('keydown', function (ev) {
  if (ev.key === 'Escape' && !$('keyhelp').hidden) { helpOpen(false); ev.preventDefault(); return; }
  var tag = ev.target && ev.target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') { return; }
  if (ev.key === 'F1' || (ev.key === '?' && !ev.ctrlKey && !ev.metaKey && !ev.altKey)) { helpOpen($('keyhelp').hidden); ev.preventDefault(); }
});
`;
}
