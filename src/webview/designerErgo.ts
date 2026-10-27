/**
 * Handy ways to work in the designer without going to the toolbar: the right-click menu of a component, renaming in place (F2), and
 * walking through the components with the keyboard (Tab / Shift+Tab, Enter for the default handler, 0 for 100% zoom, 9 for Fit window).
 * Plain JavaScript in a string, without template literal or backslash.
 */
import { viewCss } from './designerView';

export function ergoHtml(): string {
    return `<div id="ctxmenu" hidden></div><input id="renbox" type="text" hidden spellcheck="false" title="Enter renames, Esc cancels"><div id="goto" hidden><input id="gotoq" type="text" spellcheck="false" placeholder="Go to a component: a name, a class, a caption..."><div id="gotolist"></div></div><div id="toast" hidden></div>`;
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
#goto { position: fixed; z-index: 220; left: 50%; top: 90px; transform: translateX(-50%); width: min(460px, 90vw); background: var(--vscode-menu-background, var(--vscode-editorWidget-background, #252526)); border: 1px solid var(--vscode-focusBorder, #007fd4); border-radius: 6px; box-shadow: 0 6px 22px rgba(0, 0, 0, 0.55); padding: 6px; }
#goto[hidden] { display: none; }
#gotoq { width: 100%; }
#gotolist { margin-top: 4px; max-height: 300px; overflow-y: auto; }
#gotolist .grow { display: flex; gap: 8px; align-items: baseline; padding: 3px 6px; border-radius: 3px; cursor: pointer; white-space: nowrap; }
#gotolist .grow.on { background: var(--vscode-list-activeSelectionBackground, #094771); color: var(--vscode-list-activeSelectionForeground, #fff); }
#gotolist .grow .gn { font-weight: 600; }
#gotolist .grow .gc { font-size: 10px; opacity: 0.75; }
#gotolist .grow .gt { margin-left: auto; font-size: 10px; opacity: 0.7; overflow: hidden; text-overflow: ellipsis; max-width: 40%; }
#toast { position: fixed; z-index: 230; left: 50%; bottom: 34px; transform: translateX(-50%); max-width: 80vw; padding: 5px 14px; border-radius: 14px; font-size: 12px; color: #fff; background: rgba(40, 40, 44, 0.94); border: 1px solid rgba(255, 255, 255, 0.18); box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5); pointer-events: none; }
#toast[hidden] { display: none; }
.inspfilter { position: sticky; top: 0; z-index: 3; width: 100%; margin: 0 0 6px; }
`;
}

export function ergoScript(): string {
    return `
/* ───────── right-click menu, rename in place, keyboard walk ───────── */
var ergo = { menu: false, renaming: '', goto: false, gotoAt: 0, look: null, toastAt: 0, toastText: '' };

function ergoCloseMenus() {
  var was = ergo.menu || !!ergo.renaming;
  $('ctxmenu').hidden = true; ergo.menu = false;
  if (ergo.renaming) { $('renbox').hidden = true; ergo.renaming = ''; }
  if (ergo.goto) { $('goto').hidden = true; ergo.goto = false; return true; }
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

/* Go to a component by what it is called, what it is, or its caption (the / key, or the View menu). */
function openGoto() {
  ergoCloseMenus();
  $('goto').hidden = false; ergo.goto = true; ergo.gotoAt = 0;
  $('gotoq').value = ''; gotoFill(); $('gotoq').focus();
}
function gotoMatches() {
  var q = $('gotoq').value.trim().toLowerCase(), items = [];
  Object.keys(byName).forEach(function (name) {
    if (name === rootName() || byName[name].structural && !byName[name].fixed) { return; }
    var n = byName[name], low = name.toLowerCase();
    var hay = (name + ' ' + n.cls + ' ' + (n.caption || '') + ' ' + (n.text || '')).toLowerCase();
    if (q && hay.indexOf(q) < 0) { return; }
    items.push({ name: name, score: !q ? 3 : low === q ? 0 : low.indexOf(q) === 0 ? 1 : low.indexOf(q) > 0 ? 2 : 3 });
  });
  items.sort(function (a, b) { return a.score - b.score || (a.name < b.name ? -1 : 1); });
  return items.slice(0, 14);
}
function gotoFill() {
  var list = $('gotolist'); list.textContent = '';
  var items = gotoMatches();
  if (ergo.gotoAt >= items.length) { ergo.gotoAt = Math.max(0, items.length - 1); }
  items.forEach(function (it, i) {
    var n = byName[it.name];
    var r = el('div', 'grow' + (i === ergo.gotoAt ? ' on' : ''));
    r.appendChild(el('span', 'gn', iconOf(n) + ' ' + it.name)); r.appendChild(el('span', 'gc', n.cls));
    var t = n.caption !== undefined ? n.caption : (n.text !== undefined ? n.text : '');
    if (t) { r.appendChild(el('span', 'gt', String(t).split(String.fromCharCode(10))[0])); }
    r.addEventListener('mousedown', function (ev) { gotoGo(it.name); ev.preventDefault(); });
    list.appendChild(r);
  });
  if (!items.length) { list.appendChild(el('div', 'hint', 'No component matches.')); }
}
function gotoGo(name) {
  $('goto').hidden = true; ergo.goto = false;
  var changed = revealNode(name);
  select([name]);
  if (changed) { render(); }
  var e = els[name];
  if (e && e.scrollIntoView) { e.scrollIntoView({ block: 'center', inline: 'center' }); }
  openInspector();
}

/* Copy the look of a component (size, anchors, align, colours, shown, enabled) and paste it on others. */
function copyLook() {
  var n = byName[state.sel[state.sel.length - 1]];
  if (!n || n.fixed) { return; }
  var v = { Anchors: '[' + n.anchors.join(', ') + ']', Align: n.props['Align'] || 'alNone', Visible: n.visible, Enabled: n.enabled };
  if (!n.nonVisual) { v.Width = n.w; v.Height = n.h; }
  if (n.props['Color'] !== undefined && n.color) { v.Color = n.color; }
  if (n.props['Font.Color'] !== undefined && n.fontColor) { v['Font.Color'] = n.fontColor; }
  ergo.look = { from: n.name, values: v };
  state.notice = 'Appearance of ' + n.name + ' copied: paste it on other components (right-click > Paste appearance).'; renderStatus();
}
function pasteLook() {
  if (!ergo.look) { return; }
  var items = [];
  state.sel.forEach(function (name) {
    var t = byName[name];
    if (!t || t.fixed || t.nonVisual || name === ergo.look.from) { return; }
    Object.keys(ergo.look.values).forEach(function (prop) {
      if (prop === 'Width' && t.docked && (t.align === 'alTop' || t.align === 'alBottom' || t.align === 'alClient')) { return; }
      if (prop === 'Height' && t.docked && (t.align === 'alLeft' || t.align === 'alRight' || t.align === 'alClient')) { return; }
      items.push({ name: name, prop: prop, value: ergo.look.values[prop] });
    });
  });
  if (!items.length) { state.notice = 'Select the components to give the appearance of ' + ergo.look.from + ' to.'; renderStatus(); return; }
  msend(items);
}

/* A filter at the top of the inspector: only the properties whose name contains the text. */
function applyInspFilter() {
  var box = $('inspector');
  var secs = box.querySelectorAll('details.insec');
  var old = box.querySelector('.inspfilter');
  if (state.sel.length !== 1 || !secs.length) { if (old) { old.parentNode.removeChild(old); } return; }
  if (!old) {
    old = el('input', 'inspfilter'); old.type = 'text'; old.placeholder = 'Filter properties...'; old.spellcheck = false;
    old.addEventListener('input', function () { state.insFilter = old.value; runInspFilter(); });
    box.insertBefore(old, box.firstChild);
  }
  old.value = state.insFilter || '';
  runInspFilter();
}
function runInspFilter() {
  var box = $('inspector'), q = (state.insFilter || '').trim().toLowerCase();
  box.querySelectorAll('details.insec').forEach(function (d) {
    var shown = 0;
    Array.prototype.forEach.call(d.children, function (c) {
      if (c.tagName === 'SUMMARY') { return; }
      var ok = !q || c.textContent.toLowerCase().indexOf(q) >= 0;
      c.style.display = ok ? '' : 'none';
      if (ok) { shown++; }
    });
    d.style.display = !q || shown ? '' : 'none';
    if (q && shown) { d.setAttribute('data-forced', '1'); d.open = true; }
    else if (d.hasAttribute('data-forced')) { d.removeAttribute('data-forced'); }
  });
}

/* A message that is seen: it floats a moment over the form, as well as being in the status bar. */
function ergoToast(text) {
  var now = Date.now();
  if (!text) { return; }
  if (text === ergo.toastText && now - ergo.toastAt < 1200) { return; }
  ergo.toastText = text; ergo.toastAt = now;
  var t = $('toast'); t.textContent = text; t.hidden = false;
  setTimeout(function () { if (ergo.toastAt === now) { t.hidden = true; } }, 3200);
}

/* The box of several selected components, when they share a container. */
function ergoBox() {
  var list = state.sel.map(function (n) { return byName[n]; }).filter(function (n) { return n && !n.fixed && !n.nonVisual; });
  if (list.length < 2 || !list.every(function (n) { return parentOf[n.name] === parentOf[list[0].name]; })) { return ''; }
  var x0 = Math.min.apply(null, list.map(function (n) { return n.x; })), y0 = Math.min.apply(null, list.map(function (n) { return n.y; }));
  var x1 = Math.max.apply(null, list.map(function (n) { return n.x + n.w; })), y1 = Math.max.apply(null, list.map(function (n) { return n.y + n.h; }));
  return ' · box (' + x0 + ', ' + y0 + ') ' + (x1 - x0) + 'x' + (y1 - y0);
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
  if (ev.key === '/') { openGoto(); ev.preventDefault(); return true; }
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
    row('Copy appearance', '', copyLook, !many && !(n && n.fixed));
    row('Paste appearance' + (ergo.look ? ' of ' + ergo.look.from : ''), '', pasteLook, !!ergo.look);
    sep();
    row('Bring to front', '', function () { post({ type: 'zorder', names: state.sel.slice(), dir: 'front' }); }, !locked && !(n && n.fixed));
    row('Send to back', '', function () { post({ type: 'zorder', names: state.sel.slice(), dir: 'back' }); }, !locked && !(n && n.fixed));
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
  addViewAction('Go to a component...', 'A box to jump to a component by its name, its class or its caption', openGoto, '/');
  $('gotoq').addEventListener('input', function () { ergo.gotoAt = 0; gotoFill(); });
  $('gotoq').addEventListener('keydown', function (ev) {
    var n = gotoMatches().length;
    if (ev.key === 'ArrowDown') { ergo.gotoAt = (ergo.gotoAt + 1) % Math.max(1, n); gotoFill(); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp') { ergo.gotoAt = (ergo.gotoAt - 1 + Math.max(1, n)) % Math.max(1, n); gotoFill(); ev.preventDefault(); }
    else if (ev.key === 'Enter') { var m = gotoMatches()[ergo.gotoAt]; if (m) { gotoGo(m.name); } ev.preventDefault(); }
    else if (ev.key === 'Escape') { ergoCloseMenus(); ev.preventDefault(); }
  });
  $('gotoq').addEventListener('blur', function () { setTimeout(function () { if (ergo.goto && document.activeElement !== $('gotoq')) { $('goto').hidden = true; ergo.goto = false; } }, 120); });
  var plainRender = renderInspector;
  renderInspector = function () { plainRender(); applyInspFilter(); };
  $('renbox').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { endRename(true); ev.preventDefault(); }
    else if (ev.key === 'Escape') { endRename(false); ev.preventDefault(); }
  });
}
`;
}
