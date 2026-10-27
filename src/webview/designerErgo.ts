/**
 * Handy ways to work in the designer without going to the toolbar: the right-click menu of a component, renaming in place (F2), and
 * walking through the components with the keyboard (Tab / Shift+Tab, Enter for the default handler, 0 for 100% zoom, 9 for Fit window).
 * Plain JavaScript in a string, without template literal or backslash.
 */
import { viewCss } from './designerView';

export function ergoHtml(): string {
    return `<div id="ctxmenu" hidden></div><input id="renbox" type="text" hidden spellcheck="false" title="Enter renames, Esc cancels">`;
}

export function ergoCss(): string {
    const menu = viewCss().split('\n').filter(l => l.startsWith('#viewmenu')).map(l => l.split('#viewmenu').join('#ctxmenu')).join('\n');
    return `${menu}
#ctxmenu { position: fixed; top: 0; left: 0; z-index: 200; min-width: 210px; }
#ctxmenu .vrow.off { opacity: 0.45; cursor: default; }
#ctxmenu .vrow.off:hover { background: transparent; }
#ctxmenu .vname { padding: 4px 12px 2px; font-size: 11px; font-weight: 600; opacity: 0.8; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#renbox { position: fixed; z-index: 210; padding: 1px 4px; font: inherit; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-focusBorder, #007fd4); border-radius: 3px; outline: none; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); }
#renbox[hidden] { display: none; }
`;
}

export function ergoScript(): string {
    return `
/* ───────── right-click menu, rename in place, keyboard walk ───────── */
var ergo = { menu: false, renaming: '' };

function ergoCloseMenus() {
  var was = ergo.menu || !!ergo.renaming;
  $('ctxmenu').hidden = true; ergo.menu = false;
  if (ergo.renaming) { $('renbox').hidden = true; ergo.renaming = ''; }
  return was;
}

/* The place of a component on the screen: on the form, else its row in the list. */
function ergoRect(name) {
  var e = els[name];
  if (e && e !== $('client') && e.getBoundingClientRect && e.offsetParent !== null && !e.classList.contains('structural')) { var r = e.getBoundingClientRect(); if (r.width > 0) { return r; } }
  var rows = document.querySelectorAll('#outline [data-pick]');
  for (var i = 0; i < rows.length; i++) { if (rows[i].getAttribute('data-pick') === name) { return rows[i].getBoundingClientRect(); } }
  return null;
}

function startRename(name) {
  var n = byName[name];
  if (!n || name === rootName()) { return; }
  ergoCloseMenus();
  var r = ergoRect(name) || { left: 80, top: 80, width: 140 };
  var box = $('renbox');
  box.value = name; box.hidden = false; ergo.renaming = name;
  box.style.left = Math.max(4, Math.min(window.innerWidth - 190, r.left)) + 'px';
  box.style.top = Math.max(4, Math.min(window.innerHeight - 30, r.top)) + 'px';
  box.style.width = Math.max(150, Math.min(260, r.width)) + 'px';
  box.focus(); box.select();
}

function endRename(commit) {
  var name = ergo.renaming, box = $('renbox');
  if (!name) { return; }
  var v = box.value.trim();
  ergo.renaming = ''; box.hidden = true;
  if (!commit || v === name) { return; }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v)) { state.notice = 'A name is letters, digits and _, not starting with a digit.'; renderStatus(); return; }
  post({ type: 'rename', from: name, to: v });
}

/* The components in the order the Tab key walks them: the form order, a container's content after it, siblings by TabOrder when they have one. */
function walkOrder() {
  var out = [];
  function visit(n) {
    var kids = n.children.filter(function (c) { return !c.fixed && !c.structural && !c.nonVisual && c.visible !== false && dmarks.hidden.indexOf(c.name) < 0; });
    kids.map(function (c, i) { return { c: c, i: i }; }).sort(function (a, b) {
      var ta = a.c.tab === undefined ? 1000000 : a.c.tab, tb = b.c.tab === undefined ? 1000000 : b.c.tab;
      return ta - tb || a.i - b.i;
    }).forEach(function (x) { out.push(x.c.name); visit(x.c); });
  }
  if (state.model) { visit(state.model.root); }
  return out;
}

function walkTo(step) {
  var order = walkOrder();
  if (!order.length) { return; }
  var cur = state.sel.length ? order.indexOf(state.sel[state.sel.length - 1]) : -1;
  var next = cur < 0 ? (step > 0 ? 0 : order.length - 1) : (cur + step + order.length) % order.length;
  var name = order[next];
  var changed = revealNode(name);
  select([name]);
  if (changed) { render(); }
  var e = els[name];
  if (e && e.scrollIntoView) { e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  openInspector();
}

/* Keys of the designer that need no modifier. Returns true when the key was used. */
function ergoKey(ev) {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) { return false; }
  if (ev.key === 'F2') { if (state.sel.length === 1) { startRename(state.sel[0]); ev.preventDefault(); return true; } return false; }
  if (ev.key === 'Tab') { walkTo(ev.shiftKey ? -1 : 1); ev.preventDefault(); return true; }
  if (ev.key === 'Enter' && state.sel.length === 1 && state.sel[0] !== rootName()) { post({ type: 'open', name: state.sel[0] }); ev.preventDefault(); return true; }
  if (ev.key === '0' && !ev.shiftKey) { setZoom(1); ev.preventDefault(); return true; }
  if (ev.key === '9' && !ev.shiftKey) { state.fit = true; state.fitSet = true; $('zoom').value = 'fit'; fitZoom(true); saveUi(); ev.preventDefault(); return true; }
  return false;
}

/* The right-click menu. */
function openCtx(x, y, name) {
  var m = $('ctxmenu');
  m.textContent = '';
  var isForm = name === rootName();
  if (isForm) { select([]); } else if (state.sel.indexOf(name) < 0) { select([name]); }
  var many = state.sel.length > 1;
  var n = byName[name];
  var locked = state.sel.some(isLockedName);
  function row(label, key, run, enabled) {
    var r = el('div', 'vrow' + (enabled === false ? ' off' : ''));
    r.appendChild(document.createTextNode(label));
    if (key) { r.appendChild(el('span', 'vk', key)); }
    r.addEventListener('click', function () { if (enabled === false) { return; } ergoCloseMenus(); run(); });
    m.appendChild(r);
  }
  function sep() { m.appendChild(el('div', 'vsep')); }
  m.appendChild(el('div', 'vname', isForm ? name + ' (the form)' : (many ? state.sel.length + ' components' : name + ' : ' + n.cls)));
  if (!isForm) {
    row('Cut', 'Ctrl+X', function () { doCopy(true); });
    row('Copy', 'Ctrl+C', function () { doCopy(false); });
  }
  row('Paste', 'Ctrl+V', doPaste);
  if (!isForm) {
    row('Duplicate', 'Ctrl+D', duplicateSelection);
    sep();
    row('Rename...', 'F2', function () { startRename(name); }, !many);
    row(many ? 'Open the code' : 'Open the default handler', many ? '' : 'Enter', function () { post({ type: many ? 'openCode' : 'open', name: name }); });
    sep();
    row('Select the parent', 'Esc', selectParent);
    row('Lock', 'Ctrl+L', lockSelection);
    row('Hide', 'Ctrl+H', hideSelection);
    sep();
    row('Delete', 'Del', function () { var del = state.sel.filter(function (s) { return !isLockedName(s); }); if (del.length) { post({ type: 'delete', names: del }); } }, !locked);
  } else {
    sep();
    row('Select all', 'Ctrl+A', function () { select(siblingsOfSelection()); });
    row('Zoom 100%', '0', function () { setZoom(1); });
    row('Fit window', '9', function () { state.fit = true; state.fitSet = true; $('zoom').value = 'fit'; fitZoom(true); saveUi(); });
  }
  m.hidden = false; ergo.menu = true;
  var w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = Math.max(2, Math.min(x, window.innerWidth - w - 4)) + 'px';
  m.style.top = Math.max(2, Math.min(y, window.innerHeight - h - 4)) + 'px';
}

function ergoInit() {
  document.addEventListener('contextmenu', function (ev) {
    var t = ev.target;
    if (!t || !t.closest) { return; }
    var tag = t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') { return; }
    var name = '';
    var pick = t.closest('#outline [data-pick]');
    if (pick) { name = pick.getAttribute('data-pick'); }
    else if (t.closest('#client')) { var ctl = t.closest('.ctl'); name = ctl ? ctl.getAttribute('data-name') : rootName(); }
    else { return; }
    if (!name || !byName[name]) { return; }
    ev.preventDefault();
    openCtx(ev.clientX, ev.clientY, name);
  });
  document.addEventListener('mousedown', function (ev) {
    if (ergo.menu && !$('ctxmenu').contains(ev.target)) { $('ctxmenu').hidden = true; ergo.menu = false; }
    if (ergo.renaming && ev.target !== $('renbox')) { endRename(false); }
  });
  window.addEventListener('blur', function () { $('ctxmenu').hidden = true; ergo.menu = false; });
  $('center').addEventListener('scroll', function () { $('ctxmenu').hidden = true; ergo.menu = false; });
  $('renbox').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { endRename(true); ev.preventDefault(); }
    else if (ev.key === 'Escape') { endRename(false); ev.preventDefault(); }
  });
}
`;
}
