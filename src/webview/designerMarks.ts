/**
 * The designer's own memory of a form, and the tooltip of the ⚡ badge:
 * - groups of components the user names, to select them again in one click;
 * - components locked against the mouse (no move, no resize, no delete), and components hidden to see what is behind;
 * - the first lines of the handler of an event, when the pointer rests on the badge of a component.
 * None of it is written in the .dfm. Everything is reached from the View menu (and Ctrl+L / Ctrl+H), so no button is added.
 * The script is plain JavaScript in a string, without template literal or backslash.
 */

export function marksCss(): string {
    return `
.ctl.tmphidden { display: none !important; }
.ctl.locked { cursor: not-allowed; }
.lockbadge { position: absolute; left: 1px; bottom: 1px; font-size: 10px; pointer-events: none; z-index: 12; text-shadow: 0 0 2px #fff; }
.outline div.lockrow::after { content: ' 🔒'; font-size: 9px; }
.outline div.tmprow { opacity: 0.4; text-decoration: line-through; text-decoration-thickness: 1px; }
.ctl > .ev-badge { pointer-events: auto; cursor: help; }
#evtip { position: fixed; z-index: 90; max-width: 480px; background: var(--vscode-editorHoverWidget-background, #252526); color: var(--vscode-editorHoverWidget-foreground, var(--vscode-foreground)); border: 1px solid var(--vscode-editorHoverWidget-border, #555); border-radius: 4px; padding: 6px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.45); font-size: 11px; pointer-events: none; }
#evtip .eh { font-weight: 600; margin: 4px 0 2px; }
#evtip .eh:first-child { margin-top: 0; }
#evtip pre { margin: 0; font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; white-space: pre-wrap; opacity: 0.9; }
#evtip .em { opacity: 0.6; font-style: italic; }
#evtip .ef { margin-top: 4px; opacity: 0.6; font-size: 10px; }
.vgroup { display: flex; align-items: center; gap: 6px; padding: 2px 12px; cursor: pointer; }
.vgroup:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.2)); }
.vgroup .gn { flex: 1; }
.vgroup .gc { opacity: 0.6; font-size: 10px; }
.vgroup .gx { opacity: 0.5; padding: 0 3px; }
.vgroup .gx:hover { opacity: 1; }
.vsave { display: flex; gap: 4px; padding: 3px 12px; }
.vsave input { flex: 1; min-width: 0; }
`;
}

export function marksScript(): string {
    return `
/* ───────── marks: groups, locks, hidden components, handler tooltip ───────── */
var dmarks = { groups: {}, locks: [], hidden: [] };
function isLockedName(n) { return dmarks.locks.indexOf(n) >= 0; }
function saveMarks() { post({ type: 'designerState', groups: dmarks.groups, locks: dmarks.locks, hidden: dmarks.hidden }); }
function takeMarks(m) {
  if (!m) { return; }
  dmarks.groups = m.groups || {}; dmarks.locks = m.locks || []; dmarks.hidden = m.hidden || [];
}
/* The locks and the hidden components, on the form and in the list. */
function applyMarks() {
  Object.keys(els).forEach(function (n) {
    var e = els[n];
    e.classList.toggle('tmphidden', dmarks.hidden.indexOf(n) >= 0);
    var lk = dmarks.locks.indexOf(n) >= 0;
    e.classList.toggle('locked', lk);
    var b = e.querySelector(':scope > .lockbadge');
    if (lk && !b) { e.appendChild(el('span', 'lockbadge', '🔒')); } else if (!lk && b) { e.removeChild(b); }
  });
  document.querySelectorAll('#outline [data-pick]').forEach(function (r) {
    var n = r.getAttribute('data-pick');
    r.classList.toggle('lockrow', dmarks.locks.indexOf(n) >= 0);
    r.classList.toggle('tmprow', dmarks.hidden.indexOf(n) >= 0);
  });
}
/* On when every name is already in the list: then the names leave it. */
function toggleMark(list, names) {
  if (!names.length) { return; }
  var all = names.every(function (n) { return list.indexOf(n) >= 0; });
  names.forEach(function (n) {
    var i = list.indexOf(n);
    if (all) { if (i >= 0) { list.splice(i, 1); } } else if (i < 0) { list.push(n); }
  });
  saveMarks(); applyMarks();
}
function lockSelection() { toggleMark(dmarks.locks, state.sel.filter(function (n) { return n !== rootName(); })); }
function hideSelection() {
  var names = state.sel.filter(function (n) { return n !== rootName(); });
  toggleMark(dmarks.hidden, names);
  if (dmarks.hidden.indexOf(names[0]) >= 0) { select([]); }
}
function clearMarks() { dmarks.locks = []; dmarks.hidden = []; saveMarks(); applyMarks(); }

/* Groups: named selections, in the View menu. */
function groupNames(g) { return (dmarks.groups[g] || []).filter(function (n) { return byName[n]; }); }
function groupsMenu(m) {
  m.appendChild(el('div', 'vsep'));
  m.appendChild(el('div', 'vsec', 'Groups of components'));
  var row = el('div', 'vsave');
  var inp = el('input'); inp.type = 'text'; inp.placeholder = 'Name, then Save'; inp.maxLength = 60;
  var btn = el('button', '', 'Save selection (' + state.sel.length + ')');
  btn.disabled = !state.sel.length;
  function save() {
    var name = inp.value.trim();
    if (!name || !state.sel.length) { return; }
    dmarks.groups[name] = state.sel.slice(); saveMarks(); buildViewMenu();
  }
  btn.addEventListener('click', save);
  inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { save(); } });
  row.appendChild(inp); row.appendChild(btn); m.appendChild(row);
  Object.keys(dmarks.groups).sort().forEach(function (g) {
    var r = el('div', 'vgroup'); r.title = 'Select the ' + groupNames(g).length + ' components of this group';
    r.appendChild(el('span', 'gn', g)); r.appendChild(el('span', 'gc', String(groupNames(g).length)));
    var x = el('span', 'gx', '🗑'); x.title = 'Forget this group';
    x.addEventListener('click', function (ev) { delete dmarks.groups[g]; saveMarks(); buildViewMenu(); ev.preventDefault(); });
    r.appendChild(x);
    r.addEventListener('click', function (ev) {
      if (ev.target === x) { return; }
      $('viewmenu').hidden = true;
      var names = groupNames(g);
      if (names.length) { var changed = false; names.forEach(function (n) { if (revealNode(n)) { changed = true; } }); select(names); if (changed) { render(); } }
    });
    m.appendChild(r);
  });
}

/* The tooltip of the badge: what the handlers of the component start with. */
var evTimer = 0;
function hideEvTip() { var t = $('evtip'); if (t) { t.parentNode.removeChild(t); } }
function showEvTip(m) {
  hideEvTip();
  var t = el('div'); t.id = 'evtip';
  if (!m.items || !m.items.length) { t.appendChild(el('div', 'em', 'No event is linked.')); }
  (m.items || []).forEach(function (it) {
    t.appendChild(el('div', 'eh', it.event + ' → ' + it.handler));
    if (it.missing) { t.appendChild(el('div', 'em', 'No implementation in the unit: the form will not load.')); }
    else if (it.empty) { t.appendChild(el('div', 'em', 'Empty.')); }
    else { t.appendChild(el('pre', '', it.lines.join(String.fromCharCode(10)) + (it.more ? String.fromCharCode(10) + '...' : ''))); }
  });
  t.appendChild(el('div', 'ef', 'Double-click the component to open its handler.'));
  document.body.appendChild(t);
  var x = Math.min(m.x + 14, window.innerWidth - t.offsetWidth - 8), y = Math.min(m.y + 14, window.innerHeight - t.offsetHeight - 8);
  t.style.left = Math.max(4, x) + 'px'; t.style.top = Math.max(4, y) + 'px';
}
function marksInit() {
  addViewExtra(groupsMenu);
  addViewAction('Lock the selection', 'Locked components cannot be moved, resized or deleted with the mouse or the keyboard (not saved in the .dfm)', lockSelection, 'Ctrl+L');
  addViewAction('Hide the selection', 'Hide components to see what is behind them (only here, the .dfm is not touched)', hideSelection, 'Ctrl+H');
  addViewAction('Show hidden and unlock all', 'Give back everything that was hidden or locked', clearMarks);
  document.addEventListener('mouseover', function (ev) {
    var b = ev.target.closest ? ev.target.closest('.ev-badge') : null;
    if (!b) { return; }
    var c = b.closest('.ctl'); if (!c) { return; }
    var name = c.getAttribute('data-name'), x = ev.clientX, y = ev.clientY;
    clearTimeout(evTimer);
    evTimer = setTimeout(function () { post({ type: 'handlerPreview', name: name, x: x, y: y }); }, 250);
  });
  document.addEventListener('mouseout', function (ev) {
    if (ev.target.closest && ev.target.closest('.ev-badge')) { clearTimeout(evTimer); hideEvTip(); }
  });
  window.addEventListener('message', function (ev) { if (ev.data && ev.data.type === 'handlerPreview') { showEvTip(ev.data); } });
  document.addEventListener('keydown', function (ev) {
    var tag = ev.target && ev.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') { return; }
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && ev.key) {
      var k = ev.key.toLowerCase();
      if (k === 'l') { lockSelection(); ev.preventDefault(); } else if (k === 'h') { hideSelection(); ev.preventDefault(); }
    }
  });
  document.addEventListener('mousedown', hideEvTip);
}
`;
}
