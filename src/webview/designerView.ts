/**
 * What the form designer shows about a form without drawing on it: one View menu (names, containers, TabOrder numbers,
 * rulers, a theme to preview), a find bar (Ctrl+F) that selects the components matching a text, and the actions the other
 * tools of the menu add (renumber TabOrder, compare with a version, test sizes, layouts).
 *
 * The designer keeps a single extra button in its toolbar for all of it: the menu replaces the two check boxes (names,
 * containers) it had, so the toolbar does not grow. The script is plain JavaScript in a string (no template literal, no
 * backslash) that the page includes; the pure part (what matches a search) is tested by running that very text.
 */

export function viewCss(): string {
    return `
.viewgrp { position: relative; display: inline-flex; align-items: center; }
#viewmenu { position: absolute; top: 100%; left: 0; z-index: 70; min-width: 250px; background: var(--vscode-menu-background, var(--vscode-editorWidget-background, #252526)); color: var(--vscode-menu-foreground, var(--vscode-foreground)); border: 1px solid var(--vscode-menu-border, var(--vscode-panel-border, #555)); border-radius: 4px; padding: 6px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.45); font-size: 12px; }
#viewmenu[hidden] { display: none; }
#viewmenu .vsec { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vscode-descriptionForeground); padding: 6px 12px 2px; }
#viewmenu .vrow { display: flex; align-items: center; gap: 8px; padding: 3px 12px; cursor: pointer; white-space: nowrap; }
#viewmenu .vrow:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.2)); }
#viewmenu .vrow .vk { margin-left: auto; opacity: 0.6; font-size: 10px; }
#viewmenu .vrow input[type=checkbox] { margin: 0; }
#viewmenu select { margin: 3px 12px; width: calc(100% - 24px); }
#viewmenu .vsep { height: 1px; background: var(--vscode-panel-border, #444); margin: 5px 0; }
#findbar { position: fixed; top: 44px; right: 24px; z-index: 65; display: flex; align-items: center; gap: 4px; padding: 4px 6px; background: var(--vscode-editorWidget-background, #252526); border: 1px solid var(--vscode-focusBorder, #007fd4); border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.45); }
#findbar[hidden] { display: none; }
#findbar input { width: 260px; }
#findbar .findn { min-width: 44px; text-align: center; color: var(--vscode-descriptionForeground); font-size: 11px; }
#findbar button { padding: 1px 7px; }
.ctl.found { outline: 2px solid #ffb000; outline-offset: 1px; }
.ctl.foundcur { outline: 2px solid #ff3d00; outline-offset: 1px; box-shadow: 0 0 0 3px rgba(255, 61, 0, 0.25); }
.tabno { position: absolute; left: -1px; top: -1px; min-width: 14px; height: 14px; padding: 0 3px; border-radius: 7px; background: #0a84ff; color: #fff; font: 600 9px/14px 'Segoe UI', sans-serif; text-align: center; pointer-events: none; z-index: 12; box-shadow: 0 0 0 1px rgba(255,255,255,0.8); }
.tabno.dup { background: #e03131; }
.ruler { position: fixed; z-index: 25; pointer-events: none; display: none; }
body.rulers .ruler { display: block; }
#client.th-dark { background: #2d2d30 !important; }
#client.th-dark > .ctl { filter: invert(0.88) hue-rotate(180deg); }
#client.th-blue { background: #dfe9f5 !important; }
#client.th-blue > .ctl { filter: sepia(0.5) hue-rotate(185deg) saturate(1.5); }
#client.th-contrast > .ctl { filter: contrast(1.6) saturate(1.3); }
`;
}

export function viewHtml(): string {
    return `<div id="findbar" hidden><input id="findq" type="text" placeholder="Find: name, class, caption, field, event..." spellcheck="false"><span class="findn" id="findn"></span><button id="findprev" title="Previous (Shift+Enter)">↑</button><button id="findnext" title="Next (Enter)">↓</button><button id="findx" title="Close (Esc)">✕</button></div>
<canvas id="rulerx" class="ruler"></canvas><canvas id="rulery" class="ruler"></canvas>`;
}

export function viewButton(): string {
    return `<span class="viewgrp"><button id="viewbtn" title="View options: names, containers, TabOrder numbers, rulers, theme; find in the form, renumber TabOrder...">👁 View ▾</button><div id="viewmenu" hidden></div></span>`;
}

export function viewScript(): string {
    return `
/* ───────── view: find, TabOrder numbers, rulers, themes ───────── */
/* What a search looks at in a component. */
function viewFields(n) {
  var out = [n.name, n.cls];
  if (n.caption) { out.push(n.caption); }
  if (n.text) { out.push(n.text); }
  if (n.gridField) { out.push(n.gridField); }
  if (n.dataField) { out.push(n.dataField); }
  Object.keys(n.events || {}).forEach(function (k) { out.push(k); out.push(String(n.events[k])); });
  (n.lines || []).slice(0, 6).forEach(function (l) { out.push(String(l)); });
  return out;
}
/* The names of the components that match every word of the text, the ones whose name starts with it first. */
function viewMatches(nodes, q) {
  var words = String(q).toLowerCase().split(' ').filter(function (w) { return w; });
  if (!words.length) { return []; }
  var hits = [];
  nodes.forEach(function (n) {
    var hay = viewFields(n).join(' ').toLowerCase();
    if (words.every(function (w) { return hay.indexOf(w) >= 0; })) {
      hits.push({ name: n.name, rank: n.name.toLowerCase().indexOf(words[0]) === 0 ? 0 : 1 });
    }
  });
  hits.sort(function (a, b) { return a.rank - b.rank; });
  return hits.map(function (h) { return h.name; });
}

var VIEW_THEMES = [['auto', 'Automatic (the skin of the form)'], ['light', 'Light'], ['dark', 'Dark'], ['blue', 'Blue'], ['contrast', 'High contrast']];
var viewActions = [];
/* A tool of the View menu: other parts of the page add theirs here before the menu is first opened. */
function addViewAction(label, title, run, key) { viewActions.push({ label: label, title: title, run: run, key: key || '' }); }

function viewThemeName() {
  var t = state.view.theme;
  if (t !== 'auto') { return t; }
  var skin = (state.model && state.model.skinName) || '';
  return /black|dark|midnight|night/i.test(skin) ? 'dark' : /blue|sky|sea/i.test(skin) ? 'blue' : 'light';
}
function applyTheme() {
  var c = $('client');
  ['th-dark', 'th-blue', 'th-contrast'].forEach(function (k) { c.classList.remove(k); });
  var t = viewThemeName();
  if (t === 'dark' || t === 'blue' || t === 'contrast') { c.classList.add('th-' + t); }
}

/* TabOrder numbers: the order the Tab key follows, in red where two components of a container share a number. */
function markTabOrder() {
  document.querySelectorAll('.tabno').forEach(function (e) { e.parentNode.removeChild(e); });
  if (!state.view.tab || !state.model) { return; }
  var seen = {};
  Object.keys(byName).forEach(function (name) {
    var n = byName[name];
    if (n.tab === undefined || n.tab === '' || n.nonVisual || !els[name] || n.structural) { return; }
    var key = (parentOf[name] || '') + ':' + n.tab;
    seen[key] = (seen[key] || 0) + 1;
  });
  Object.keys(byName).forEach(function (name) {
    var n = byName[name];
    if (n.tab === undefined || n.tab === '' || n.nonVisual || !els[name] || n.structural) { return; }
    var b = el('span', 'tabno' + (seen[(parentOf[name] || '') + ':' + n.tab] > 1 ? ' dup' : ''), String(n.tab));
    b.title = 'TabOrder ' + n.tab + (seen[(parentOf[name] || '') + ':' + n.tab] > 1 ? ' - shared with another component of the container' : '');
    els[name].appendChild(b);
  });
}

/* Rulers along the top and the left of the form, in the units of the .dfm, with the pointer marked. */
function drawRulers() {
  var on = !!state.view.rulers;
  document.body.classList.toggle('rulers', on);
  if (!on) { return; }
  var c = $('center'), cl = $('client'), cr = c.getBoundingClientRect(), r = cl.getBoundingClientRect(), z = state.zoom;
  var W = c.clientWidth, H = c.clientHeight, S = 18;
  var rx = $('rulerx'), ry = $('rulery');
  rx.style.left = (cr.left + S) + 'px'; rx.style.top = cr.top + 'px'; rx.width = Math.max(10, W - S); rx.height = S;
  ry.style.left = cr.left + 'px'; ry.style.top = (cr.top + S) + 'px'; ry.width = S; ry.height = Math.max(10, H - S);
  var cs = getComputedStyle(document.body);
  var fg = cs.color, bg = getComputedStyle(c).backgroundColor;
  var steps = [5, 10, 20, 50, 100, 200, 500, 1000], step = 1000;
  for (var i = 0; i < steps.length; i++) { if (steps[i] * z >= 38) { step = steps[i]; break; } }
  function axis(cv, horizontal) {
    var g = cv.getContext('2d');
    g.fillStyle = bg; g.globalAlpha = 0.92; g.fillRect(0, 0, cv.width, cv.height); g.globalAlpha = 1;
    g.strokeStyle = fg; g.fillStyle = fg; g.font = '9px sans-serif'; g.lineWidth = 1;
    var origin = horizontal ? r.left - cr.left - S : r.top - cr.top - S;
    var length = horizontal ? cv.width : cv.height;
    var from = Math.floor((0 - origin) / z / step) - 1, to = Math.ceil((length - origin) / z / step) + 1;
    for (var k = from; k <= to; k++) {
      var p = Math.round(origin + k * step * z) + 0.5;
      if (p < 0 || p > length) { continue; }
      g.globalAlpha = 0.9;
      g.beginPath();
      if (horizontal) { g.moveTo(p, S); g.lineTo(p, S - 9); } else { g.moveTo(S, p); g.lineTo(S - 9, p); }
      g.stroke();
      if (horizontal) { g.fillText(String(k * step), p + 2, 9); } else { g.save(); g.translate(9, p + 2); g.rotate(-Math.PI / 2); g.fillText(String(k * step), 0, 0); g.restore(); }
      // a minor tick halfway
      var q = Math.round(origin + (k + 0.5) * step * z) + 0.5;
      g.globalAlpha = 0.5; g.beginPath();
      if (horizontal) { g.moveTo(q, S); g.lineTo(q, S - 4); } else { g.moveTo(S, q); g.lineTo(S - 4, q); }
      g.stroke();
    }
    var m = state.view.mouse;
    if (m) {
      var mp = Math.round((horizontal ? m.x : m.y) * z + origin) + 0.5;
      g.globalAlpha = 1; g.strokeStyle = '#ff3d00'; g.beginPath();
      if (horizontal) { g.moveTo(mp, 0); g.lineTo(mp, S); } else { g.moveTo(0, mp); g.lineTo(S, mp); }
      g.stroke();
    }
  }
  axis(rx, true); axis(ry, false);
}
function viewRedraw() { applyTheme(); markTabOrder(); drawRulers(); }

/* The find bar. */
var find = { hits: [], at: -1 };
function allNodeList() { var out = []; (function walk(n) { out.push(n); n.children.forEach(walk); })(state.model.root); return out.filter(function (n) { return n !== state.model.root; }); }
function clearFound() { document.querySelectorAll('.found, .foundcur').forEach(function (e) { e.classList.remove('found'); e.classList.remove('foundcur'); }); }
function paintFound() {
  clearFound();
  find.hits.forEach(function (n, i) { var e = els[n]; if (e) { e.classList.add(i === find.at ? 'foundcur' : 'found'); } });
  $('findn').textContent = find.hits.length ? (find.at + 1) + ' / ' + find.hits.length : ($('findq').value.trim() ? 'none' : '');
}
function goFind(i) {
  if (!find.hits.length) { paintFound(); return; }
  find.at = (i + find.hits.length) % find.hits.length;
  var name = find.hits[find.at];
  var changed = revealNode(name);
  select([name]);
  if (changed) { render(); }
  paintFound();
  var e = els[name];
  if (e && e.scrollIntoView) { e.scrollIntoView({ block: 'center', inline: 'center' }); }
}
function runFind() {
  if (!state.model) { return; }
  find.hits = viewMatches(allNodeList(), $('findq').value);
  find.at = -1;
  if (find.hits.length) { goFind(0); } else { paintFound(); }
}
function openFind() {
  $('findbar').hidden = false;
  $('findq').focus(); $('findq').select();
  if ($('findq').value) { runFind(); }
}
function closeFind() { $('findbar').hidden = true; find.hits = []; find.at = -1; clearFound(); }

function buildViewMenu() {
  var m = $('viewmenu');
  m.textContent = '';
  function sec(t) { m.appendChild(el('div', 'vsec', t)); }
  function check(label, key, on) {
    var r = el('label', 'vrow'); var c = el('input'); c.type = 'checkbox'; c.checked = !!state.view[key];
    c.addEventListener('change', function () { state.view[key] = c.checked; on(); saveUi(); });
    r.appendChild(c); r.appendChild(document.createTextNode(label)); m.appendChild(r);
  }
  sec('Show');
  check('Names of the components', 'names', function () { state.names = state.view.names; render(); });
  check('Outline of the containers', 'containers', function () { state.showParents = state.view.containers; drawSel(); });
  check('TabOrder numbers', 'tab', function () { markTabOrder(); });
  check('Rulers', 'rulers', function () { drawRulers(); });
  sec('Theme preview');
  var sel = el('select');
  VIEW_THEMES.forEach(function (t) { var o = el('option', '', t[0] === 'auto' ? t[1] + (state.model && state.model.skinName ? ' - ' + state.model.skinName : '') : t[1]); o.value = t[0]; sel.appendChild(o); });
  sel.value = state.view.theme;
  sel.addEventListener('change', function () { state.view.theme = sel.value; applyTheme(); saveUi(); });
  m.appendChild(sel);
  m.appendChild(el('div', 'vsep'));
  var f = el('div', 'vrow'); f.appendChild(document.createTextNode('Find in the form...')); f.appendChild(el('span', 'vk', 'Ctrl+F'));
  f.addEventListener('click', function () { m.hidden = true; openFind(); });
  m.appendChild(f);
  viewActions.forEach(function (a) {
    var r = el('div', 'vrow'); r.title = a.title || ''; r.appendChild(document.createTextNode(a.label));
    if (a.key) { r.appendChild(el('span', 'vk', a.key)); }
    r.addEventListener('click', function () { m.hidden = true; a.run(); });
    m.appendChild(r);
  });
}

function viewInit() {
  state.names = !!state.view.names; state.showParents = !!state.view.containers;
  $('viewbtn').addEventListener('click', function () { var m = $('viewmenu'); if (m.hidden) { buildViewMenu(); } m.hidden = !m.hidden; });
  document.addEventListener('mousedown', function (ev) {
    var m = $('viewmenu');
    if (!m.hidden && !m.contains(ev.target) && ev.target !== $('viewbtn')) { m.hidden = true; }
  });
  $('findq').addEventListener('input', runFind);
  $('findq').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { goFind(find.at + (ev.shiftKey ? -1 : 1)); ev.preventDefault(); }
    else if (ev.key === 'Escape') { closeFind(); ev.preventDefault(); }
  });
  $('findnext').addEventListener('click', function () { goFind(find.at + 1); });
  $('findprev').addEventListener('click', function () { goFind(find.at - 1); });
  $('findx').addEventListener('click', closeFind);
  addViewAction('Renumber TabOrder by position', 'The Tab key then follows the screen, row by row: the selected container, or every container of the form', function () { post({ type: 'tabOrder', names: state.sel.slice() }); });
  $('center').addEventListener('scroll', drawRulers);
  window.addEventListener('resize', drawRulers);
  $('client').addEventListener('mousemove', function (ev) {
    if (!state.view.rulers) { return; }
    var p = clientPoint(ev); state.view.mouse = { x: p.x, y: p.y };
    if (!viewInit.pending) { viewInit.pending = true; requestAnimationFrame(function () { viewInit.pending = false; drawRulers(); }); }
  });
  viewRedraw();
}
`;
}
