/**
 * The View menu's two last tools, both off the toolbar:
 * - "Test other form sizes": the form is shown at another size as Align and Anchors would lay it out, with the problems
 *   that brings (a component pushed out of its container, two that now overlap) marked in red;
 * - "Layouts": a selection (a panel with its content) kept by name, to be inserted in this form or another one,
 *   with its handlers and fields.
 * Plain JavaScript in a string, without template literal or backslash.
 */

export function layoutsCss(): string {
    return `
.ctl.sz-issue { outline: 2px solid #e03131; outline-offset: 1px; background-image: repeating-linear-gradient(45deg, rgba(224,49,49,0.18) 0 4px, transparent 4px 8px); }
#szbar { position: fixed; top: 44px; left: 50%; transform: translateX(-50%); z-index: 64; display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--vscode-editorWidget-background, #252526); border: 1px solid var(--vscode-focusBorder, #007fd4); border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.45); font-size: 11px; }
#szbar button { padding: 1px 7px; }
#szbar button.on { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
#szbar input { width: 52px; }
#szbar .bad { color: #e03131; font-weight: 600; cursor: pointer; }
#szbar .ok { color: #2f9e44; }
`;
}

export function layoutsScript(): string {
    return `
/* ───────── other form sizes, and saved layouts ───────── */
var sz = null;
var savedLayouts = [];
var SIZES = [[640, 480], [800, 600], [1024, 768], [1280, 720], [1920, 1080]];
function sizeStop() {
  sz = null;
  var b = $('szbar'); if (b) { b.parentNode.removeChild(b); }
  document.querySelectorAll('.sz-issue').forEach(function (e) { e.classList.remove('sz-issue'); });
  if (state.model) { render(); }
}
function sizeAsk(w, h) { post({ type: 'testSize', w: w, h: h }); }
function sizeApply(r) {
  var m = state.model; if (!m || !sz) { return; }
  sz.w = r.width; sz.h = r.height;
  var client = $('client');
  client.style.width = r.width + 'px'; client.style.height = r.height + 'px'; $('formframe').style.width = (r.width + 2) + 'px';
  Object.keys(r.rects).forEach(function (n) {
    var e = els[n], q = r.rects[n]; if (!e || e === client) { return; }
    e.style.left = q.x + 'px'; e.style.top = q.y + 'px'; e.style.width = q.w + 'px'; e.style.height = q.h + 'px';
  });
  document.querySelectorAll('.sz-issue').forEach(function (e) { e.classList.remove('sz-issue'); });
  var lines = [];
  r.issues.forEach(function (i) {
    if (els[i.name]) { els[i.name].classList.add('sz-issue'); }
    if (i.other && els[i.other]) { els[i.other].classList.add('sz-issue'); }
    lines.push(i.kind === 'outside' ? i.name + ' goes out of its container' : i.name + ' overlaps ' + i.other);
  });
  sizeBar(lines, r.issues);
  if (state.fit) {
    var ctr = $('center');
    var zf = Math.min((ctr.clientWidth - 44) / (r.width + 2), (ctr.clientHeight - 44) / (r.height + 33));
    state.zoom = Math.floor(Math.max(0.2, Math.min(2, zf)) * 100) / 100; applyZoom(); drawSel();
  }
}
function sizeBar(lines, issues) {
  var bar = $('szbar');
  if (!bar) { bar = el('div'); bar.id = 'szbar'; document.body.appendChild(bar); }
  bar.textContent = '';
  bar.appendChild(el('span', '', 'Form size:'));
  SIZES.concat([[state.model.width, state.model.height]]).forEach(function (s, i, all) {
    var b = el('button', sz && sz.w === s[0] && sz.h === s[1] ? 'on' : '', i === all.length - 1 ? 'Original' : s[0] + 'x' + s[1]);
    b.addEventListener('click', function () { if (i === all.length - 1) { sizeStop(); } else { sizeAsk(s[0], s[1]); } });
    bar.appendChild(b);
  });
  var w = el('input'); w.type = 'number'; w.min = '100'; w.max = '4000'; w.value = String(sz.w);
  var h = el('input'); h.type = 'number'; h.min = '100'; h.max = '4000'; h.value = String(sz.h);
  function go() { var a = parseInt(w.value, 10), b = parseInt(h.value, 10); if (a >= 100 && b >= 100) { sizeAsk(a, b); } }
  w.addEventListener('change', go); h.addEventListener('change', go);
  bar.appendChild(w); bar.appendChild(el('span', '', 'x')); bar.appendChild(h);
  var res = el('span', issues.length ? 'bad' : 'ok', issues.length ? issues.length + ' problem' + (issues.length > 1 ? 's' : '') : 'no problem');
  res.title = lines.join(String.fromCharCode(10));
  if (issues.length) { res.addEventListener('click', function () { var n = issues[0].name; if (byName[n]) { select([n]); } }); }
  bar.appendChild(res);
  var x = el('button', '', 'Close'); x.addEventListener('click', sizeStop); bar.appendChild(x);
}
function layoutsMenu(m) {
  m.appendChild(el('div', 'vsep'));
  m.appendChild(el('div', 'vsec', 'Layouts (kept for every form)'));
  var row = el('div', 'vsave');
  var inp = el('input'); inp.type = 'text'; inp.placeholder = 'Name, then Save'; inp.maxLength = 60;
  var btn = el('button', '', 'Save selection (' + state.sel.length + ')');
  btn.disabled = !state.sel.length;
  function save() {
    var name = inp.value.trim();
    if (!name || !state.sel.length) { return; }
    post({ type: 'layoutSave', name: name, names: state.sel.slice() }); $('viewmenu').hidden = true;
  }
  btn.addEventListener('click', save);
  inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { save(); } });
  row.appendChild(inp); row.appendChild(btn); m.appendChild(row);
  savedLayouts.forEach(function (l) {
    var r = el('div', 'vgroup'); r.title = 'Insert these ' + l.count + ' components in the selected container (or the form)';
    r.appendChild(el('span', 'gn', l.name)); r.appendChild(el('span', 'gc', String(l.count)));
    var x = el('span', 'gx', '🗑'); x.title = 'Forget this layout';
    x.addEventListener('click', function (ev) { post({ type: 'layoutDelete', id: l.id }); ev.preventDefault(); });
    r.appendChild(x);
    r.addEventListener('click', function (ev) {
      if (ev.target === x) { return; }
      $('viewmenu').hidden = true;
      var t = state.sel.length === 1 ? state.sel[0] : '';
      post({ type: 'layoutInsert', id: l.id, target: t });
    });
    m.appendChild(r);
  });
}
function layoutsInit() {
  addViewAction('Test other form sizes...', 'Shows the form at another size, as Align and Anchors would lay it out, and marks what goes out of its container or overlaps', function () {
    if (!sz) { sz = { w: state.model.width, h: state.model.height }; }
    sizeBar([], []); sizeAsk(sz.w === state.model.width ? 1024 : sz.w, sz.h === state.model.height ? 768 : sz.h);
  });
  addViewExtra(layoutsMenu);
  window.addEventListener('message', function (ev) {
    var d = ev.data;
    if (!d) { return; }
    if (d.type === 'testSizeResult') { sizeApply(d); }
    else if (d.type === 'layouts') { savedLayouts = d.list || []; }
  });
}
function layoutsRedraw() { if (sz && state.model && (sz.w !== state.model.width || sz.h !== state.model.height)) { sizeAsk(sz.w, sz.h); } }
`;
}
