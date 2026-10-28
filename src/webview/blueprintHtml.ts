/**
 * The page of the Blueprint view: a canvas of nodes (one per routine) with their pins and the wires of the calls, in the manner of the
 * blueprint editors of game engines. Every gesture is a message to the extension, which turns it into an edit of the source; the page
 * draws what the extension sends back. The script is plain ES5 inside a template string: no backtick, no dollar-brace, no backslash.
 */
export interface BlueprintPageOptions { nonce: string; cspSource: string; title: string }

export function blueprintCss(): string {
    return `
html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; }
body { font-family: var(--vscode-font-family, sans-serif); font-size: 12px; color: var(--vscode-foreground); background: var(--vscode-editor-background); display: flex; flex-direction: column; }
.bar { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.35)); flex: none; flex-wrap: wrap; }
.bar .title { font-weight: 600; margin-right: 6px; }
.bar button { background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.2)); color: var(--vscode-button-secondaryForeground, inherit); border: 1px solid transparent; border-radius: 3px; padding: 3px 9px; cursor: pointer; font-size: 12px; font-family: inherit; }
.bar button:hover { background: var(--vscode-button-secondaryHoverBackground, rgba(127,127,127,0.3)); }
.bar button.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.bar input[type=text] { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; padding: 3px 6px; width: 150px; font-size: 12px; }
.bar label { display: flex; align-items: center; gap: 3px; color: var(--vscode-descriptionForeground); cursor: pointer; }
.bar .grow { flex: 1; }
body.full .bar { padding: 3px 8px; }
body.full .help { display: none; }
.bar .msg { color: var(--vscode-descriptionForeground); max-width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#stage { flex: 1; min-height: 0; position: relative; }
svg#cv { width: 100%; height: 100%; display: block; cursor: grab; user-select: none; }
svg#cv.panning { cursor: grabbing; }
.grid-line { stroke: var(--vscode-editorIndentGuide-background, rgba(128,128,128,0.18)); stroke-width: 1; }
.node .body { fill: var(--vscode-editorWidget-background, #252526); stroke: var(--vscode-widget-border, rgba(128,128,128,0.6)); stroke-width: 1; }
.node.sel .body { stroke: var(--vscode-focusBorder, #007fd4); stroke-width: 2; }
.node .head { cursor: move; }
.node .ttl { fill: #fff; font-weight: 600; font-size: 12px; pointer-events: none; }
.node .sub { fill: rgba(255,255,255,0.75); font-size: 10px; pointer-events: none; }
.node .lbl { fill: var(--vscode-foreground); font-size: 11px; pointer-events: none; }
.node .lbl.out { text-anchor: end; }
.node .pin { stroke: rgba(0,0,0,0.5); stroke-width: 1; }
.node .exec { fill: #f2f2f2; cursor: crosshair; }
.node .exec:hover { fill: #ffd54a; }
.node.dim { opacity: 0.22; }
.node.nobody .head { filter: saturate(0.2); }
.wire { fill: none; stroke: var(--vscode-foreground); stroke-width: 2.2; opacity: 0.85; pointer-events: none; }
.wire.dim { opacity: 0.15; }
.wire.on { stroke: #ffd54a; opacity: 1; stroke-width: 3; }
.wire.sel { stroke: var(--vscode-focusBorder, #007fd4); stroke-width: 3.5; opacity: 1; }
.wire.temp { stroke: #ffd54a; stroke-dasharray: 5 4; }
.hit { fill: none; stroke: transparent; stroke-width: 12; cursor: pointer; }
.help { position: absolute; right: 10px; bottom: 8px; color: var(--vscode-descriptionForeground); font-size: 11px; background: var(--vscode-editor-background); opacity: 0.85; padding: 3px 6px; border-radius: 3px; pointer-events: none; }
.empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--vscode-descriptionForeground); pointer-events: none; text-align: center; padding: 30px; }
`;
}

export function blueprintScript(): string {
    return `
(function () {
  var vscode = acquireVsCodeApi();
  var NS = 'http:' + '//www.w3.org/2000/svg';
  var model = { nodes: [], edges: [] };
  var view = { x: 40, y: 40, k: 1 };
  var sel = null;                       // { type: 'node' | 'edge', id: string }
  var filter = '';
  var hideAlone = false;
  var cv = document.getElementById('cv');
  var world = document.getElementById('world');
  var gridG = document.getElementById('grid');
  var HEAD = 34, ROWH = 20;
  var HEADS = { method: '#2a6fb0', 'function': '#2a6fb0', constructor: '#2e8b57', destructor: '#a33b3b' };

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) { e.setAttribute(k, attrs[k]); } }
    if (parent) { parent.appendChild(e); }
    return e;
  }
  function byId(id) { for (var i = 0; i < model.nodes.length; i++) { if (model.nodes[i].id === id) { return model.nodes[i]; } } return null; }
  function trunc(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, Math.max(1, n - 1)) + '\\u2026' : s; }
  function hue(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) % 360; } return h; }
  function pinColor(type) { return type ? 'hsl(' + hue(String(type).toLowerCase()) + ',65%,58%)' : '#9aa0a6'; }
  function pinY(n, i) { return n.y + HEAD + 12 + i * ROWH; }
  function post(m) { vscode.postMessage(m); }
  function say(t) { document.getElementById('msg').textContent = t || ''; }

  function aloneSet() {
    var linked = {};
    model.edges.forEach(function (e) { linked[e.from] = true; linked[e.to] = true; });
    return linked;
  }
  function matches(n) {
    if (!filter) { return true; }
    var t = (n.name + ' ' + (n.owner || '')).toLowerCase();
    return t.indexOf(filter) >= 0;
  }

  function wirePath(a, b) {
    var x1 = a.x + a.w, y1 = pinY(a, 0), x2 = b.x, y2 = pinY(b, 0);
    var d = Math.max(50, Math.abs(x2 - x1) / 2);
    return 'M' + x1 + ',' + y1 + ' C' + (x1 + d) + ',' + y1 + ' ' + (x2 - d) + ',' + y2 + ' ' + x2 + ',' + y2;
  }

  function render() {
    while (world.firstChild) { world.removeChild(world.firstChild); }
    var linked = aloneSet();
    var visible = {};
    model.nodes.forEach(function (n) { visible[n.id] = !(hideAlone && !linked[n.id]); });
    var focus = sel && sel.type === 'node' ? sel.id : null;
    var wires = el('g', {}, world);
    model.edges.forEach(function (e) {
      var a = byId(e.from), b = byId(e.to);
      if (!a || !b || !visible[a.id] || !visible[b.id]) { return; }
      var d = wirePath(a, b);
      var id = e.from + '>' + e.to;
      var cls = 'wire';
      if (sel && sel.type === 'edge' && sel.id === id) { cls += ' sel'; }
      else if (focus) { cls += (e.from === focus || e.to === focus) ? ' on' : ' dim'; }
      var p = el('path', { d: d, 'class': cls }, wires);
      p.setAttribute('data-edge', id);
      var hit = el('path', { d: d, 'class': 'hit' }, wires);
      var tip = el('title', {}, hit); tip.textContent = a.name + ' calls ' + b.name + ' (' + e.lines.length + 'x) - click, then Delete to remove the call';
      hit.addEventListener('mousedown', function (ev) { ev.stopPropagation(); sel = { type: 'edge', id: id }; render(); });
    });
    model.nodes.forEach(function (n) {
      if (!visible[n.id]) { return; }
      var cls = 'node' + (sel && sel.type === 'node' && sel.id === n.id ? ' sel' : '') + (matches(n) ? '' : ' dim') + (n.hasBody ? '' : ' nobody');
      var g = el('g', { 'class': cls, transform: 'translate(' + n.x + ',' + n.y + ')', 'data-id': n.id }, world);
      el('rect', { 'class': 'body', x: 0, y: 0, width: n.w, height: n.h, rx: 6 }, g);
      var head = el('path', { 'class': 'head', d: 'M0,6 a6,6 0 0 1 6,-6 h' + (n.w - 12) + ' a6,6 0 0 1 6,6 v' + (HEAD - 6) + ' h-' + n.w + ' z', fill: HEADS[n.kind] || '#2a6fb0' }, g);
      var kindWord = n.kind === 'constructor' ? 'Create ' : n.kind === 'destructor' ? 'Destroy ' : '';
      var ttl = el('text', { 'class': 'ttl', x: 10, y: n.owner ? 15 : 21 }, g);
      ttl.textContent = trunc(kindWord + n.name + (n.recursive ? ' \\u21BB' : ''), Math.floor((n.w - 20) / 7));
      if (n.owner) { var sub = el('text', { 'class': 'sub', x: 10, y: 28 }, g); sub.textContent = trunc(n.owner, Math.floor((n.w - 20) / 6)); }
      var ht = el('title', {}, head); ht.textContent = (n.owner ? n.owner + '.' : '') + n.name + (n.hasBody ? '' : ' (declaration only: no body in this file)') + ' - double-click opens the code, F2 renames, Delete deletes';
      // exec pins: the arrow on the left receives the call, the one on the right makes calls
      var pin = el('path', { 'class': 'pin exec', d: 'M-7,' + (HEAD + 5) + ' l8,7 l-8,7 z', 'data-pin': 'in' }, g);
      pin.setAttribute('transform', 'translate(0,0)');
      var pout = el('path', { 'class': 'pin exec', d: 'M' + (n.w - 1) + ',' + (HEAD + 5) + ' l8,7 l-8,7 z', 'data-pin': 'out' }, g);
      var tin = el('title', {}, pin); tin.textContent = 'Drag from here to another node to make it call ' + n.name;
      var tout = el('title', {}, pout); tout.textContent = 'Drag to another node: ' + n.name + ' will call it';
      var inl = el('text', { 'class': 'lbl', x: 12, y: HEAD + 16 }, g); inl.textContent = 'call';
      var outl = el('text', { 'class': 'lbl out', x: n.w - 12, y: HEAD + 16 }, g); outl.textContent = 'then';
      n.params.forEach(function (p, i) {
        var y = HEAD + 12 + (i + 1) * ROWH;
        var c = el('circle', { 'class': 'pin', cx: 0, cy: y, r: 5, fill: pinColor(p.type) }, g);
        var t = el('title', {}, c); t.textContent = (p.dir ? p.dir + ' ' : '') + p.name + (p.type ? ': ' + p.type : '');
        var l = el('text', { 'class': 'lbl', x: 12, y: y + 4 }, g);
        l.textContent = trunc(p.name + (p.type ? ': ' + p.type : ''), Math.floor((n.w - 24) / 6.5));
      });
      if (n.ret) {
        var yr = HEAD + 12 + ROWH;
        var rc = el('circle', { 'class': 'pin', cx: n.w, cy: yr, r: 5, fill: pinColor(n.ret) }, g);
        var rt = el('title', {}, rc); rt.textContent = 'returns ' + n.ret;
        var rl = el('text', { 'class': 'lbl out', x: n.w - 12, y: yr + 4 }, g); rl.textContent = trunc(n.ret, Math.floor((n.w - 24) / 6.5));
      }
    });
    applyView();
    document.getElementById('empty').style.display = model.nodes.length ? 'none' : 'flex';
  }

  function applyView() {
    showZoom();
    world.setAttribute('transform', 'translate(' + view.x + ',' + view.y + ') scale(' + view.k + ')');
    // the grid follows the view
    var gs = 40 * view.k;
    var w = cv.clientWidth, h = cv.clientHeight;
    while (gridG.firstChild) { gridG.removeChild(gridG.firstChild); }
    if (gs < 8) { return; }
    var ox = ((view.x % gs) + gs) % gs, oy = ((view.y % gs) + gs) % gs;
    for (var x = ox; x < w; x += gs) { el('line', { 'class': 'grid-line', x1: x, y1: 0, x2: x, y2: h }, gridG); }
    for (var y = oy; y < h; y += gs) { el('line', { 'class': 'grid-line', x1: 0, y1: y, x2: w, y2: y }, gridG); }
  }

  var fitMode = true;
  function showZoom() {
    var sel = document.getElementById('zoom');
    var pct = Math.round(view.k * 100);
    var o = document.getElementById('zoomcustom');
    if (fitMode) { sel.value = 'fit'; sel.options[0].textContent = 'Fit window (' + pct + '%)'; o.hidden = true; return; }
    sel.options[0].textContent = 'Fit window';
    var key = String(Math.round(view.k * 100) / 100);
    for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].value === key) { o.hidden = true; sel.value = key; return; } }
    o.textContent = pct + '%'; o.hidden = false; sel.value = 'custom';
  }
  /* zoom to k keeping the point (mx, my) of the canvas where it is; without a point, the middle of the canvas */
  function setZoom(k, mx, my) {
    k = Math.min(3, Math.max(0.1, k));
    if (mx === undefined) { mx = cv.clientWidth / 2; my = cv.clientHeight / 2; }
    view.x = mx - (mx - view.x) * (k / view.k); view.y = my - (my - view.y) * (k / view.k); view.k = k;
    fitMode = false;
    applyView();
  }
  function fit() {
    fitMode = true;
    var list = model.nodes;
    if (!list.length) { view = { x: 40, y: 40, k: 1 }; applyView(); return; }
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    list.forEach(function (n) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + n.w); y1 = Math.max(y1, n.y + n.h); });
    var w = cv.clientWidth - 60, h = cv.clientHeight - 60;
    var k = Math.min(1.2, Math.max(0.15, Math.min(w / (x1 - x0), h / (y1 - y0))));
    view = { k: k, x: 30 - x0 * k + (w - (x1 - x0) * k) / 2, y: 30 - y0 * k + (h - (y1 - y0) * k) / 2 };
    applyView();
  }

  function toWorld(ev) {
    var r = cv.getBoundingClientRect();
    return { x: (ev.clientX - r.left - view.x) / view.k, y: (ev.clientY - r.top - view.y) / view.k };
  }
  function nodeAt(ev) {
    var t = document.elementFromPoint(ev.clientX, ev.clientY);
    while (t && t !== cv) { if (t.getAttribute && t.getAttribute('data-id')) { return byId(t.getAttribute('data-id')); } t = t.parentNode; }
    return null;
  }

  // --- gestures ---
  var drag = null;
  cv.addEventListener('mousedown', function (ev) {
    if (ev.button === 1) {
      ev.preventDefault();
      drag = { mode: 'pan', sx: ev.clientX, sy: ev.clientY, ox: view.x, oy: view.y, moved: false };
      cv.classList.add('panning');
      return;
    }
    if (ev.button !== 0) { return; }
    var t = ev.target;
    var pinKind = t.getAttribute && t.getAttribute('data-pin');
    var g = t; while (g && g !== cv && !(g.getAttribute && g.getAttribute('data-id'))) { g = g.parentNode; }
    var n = g && g !== cv ? byId(g.getAttribute('data-id')) : null;
    if (n && pinKind) {
      var temp = el('path', { d: '', 'class': 'wire temp' }, world);
      drag = { mode: 'wire', node: n, dir: pinKind, temp: temp };
      return;
    }
    if (n) {
      sel = { type: 'node', id: n.id };
      drag = { mode: 'move', node: n, sx: ev.clientX, sy: ev.clientY, ox: n.x, oy: n.y, moved: false };
      render();
      return;
    }
    sel = null;
    drag = { mode: 'pan', sx: ev.clientX, sy: ev.clientY, ox: view.x, oy: view.y, moved: false };
    cv.classList.add('panning');
    render();
  });
  window.addEventListener('mousemove', function (ev) {
    if (!drag) { return; }
    if (drag.mode === 'pan') { view.x = drag.ox + ev.clientX - drag.sx; view.y = drag.oy + ev.clientY - drag.sy; applyView(); return; }
    if (drag.mode === 'move') {
      var dx = (ev.clientX - drag.sx) / view.k, dy = (ev.clientY - drag.sy) / view.k;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) { return; }
      drag.moved = true;
      drag.node.x = Math.round((drag.ox + dx) / 10) * 10; drag.node.y = Math.round((drag.oy + dy) / 10) * 10;
      render();
      return;
    }
    if (drag.mode === 'wire') {
      var p = toWorld(ev), n = drag.node;
      var a = drag.dir === 'out' ? { x: n.x + n.w, y: pinY(n, 0) } : { x: p.x, y: p.y };
      var b = drag.dir === 'out' ? { x: p.x, y: p.y } : { x: n.x, y: pinY(n, 0) };
      var d = Math.max(50, Math.abs(b.x - a.x) / 2);
      drag.temp.setAttribute('d', 'M' + a.x + ',' + a.y + ' C' + (a.x + d) + ',' + a.y + ' ' + (b.x - d) + ',' + b.y + ' ' + b.x + ',' + b.y);
    }
  });
  window.addEventListener('mouseup', function (ev) {
    if (!drag) { return; }
    var d = drag; drag = null;
    cv.classList.remove('panning');
    if (d.mode === 'move' && d.moved) { var pos = {}; pos[d.node.id] = { x: d.node.x, y: d.node.y }; post({ type: 'positions', positions: pos }); }
    if (d.mode === 'wire') {
      if (d.temp.parentNode) { d.temp.parentNode.removeChild(d.temp); }
      var target = nodeAt(ev);
      if (target && target.id !== d.node.id) {
        if (d.dir === 'out') { post({ type: 'addCall', from: d.node.id, to: target.id }); } else { post({ type: 'addCall', from: target.id, to: d.node.id }); }
      } else if (!target && d.dir === 'out') {
        var w = toWorld(ev);
        post({ type: 'addNode', caller: d.node.id, x: Math.round(w.x), y: Math.round(w.y) });
      }
    }
  });
  cv.addEventListener('dblclick', function (ev) {
    var n = nodeAt(ev);
    if (n) { post({ type: 'openCode', id: n.id }); return; }
    var w = toWorld(ev);
    post({ type: 'addNode', x: Math.round(w.x), y: Math.round(w.y) });
  });
  cv.addEventListener('wheel', function (ev) {
    ev.preventDefault();
    var r = cv.getBoundingClientRect();
    // a wheel notch is about 12 percent, a trackpad pinch (small deltas) follows the fingers
    var step = Math.max(-0.5, Math.min(0.5, -ev.deltaY / (ev.deltaMode === 1 ? 20 : 200)));
    setZoom(view.k * (1 + step * 0.6), ev.clientX - r.left, ev.clientY - r.top);
  }, { passive: false });

  window.addEventListener('keydown', function (ev) {
    var inField = ev.target && ev.target.tagName === 'INPUT';
    if (ev.key === 'Escape') { if (inField) { ev.target.blur(); } else if (!sel && full) { setFull(false); } sel = null; render(); return; }
    if (inField) { return; }
    if (ev.key === '/') { ev.preventDefault(); document.getElementById('filter').focus(); return; }
    if (ev.key === 'f' || ev.key === '9') { fit(); return; }
    if (ev.key === '0') { setZoom(1); return; }
    if (ev.key === '+' || ev.key === '=') { setZoom(view.k * 1.25); return; }
    if (ev.key === '-') { setZoom(view.k / 1.25); return; }
    if (ev.key === 'l') { post({ type: 'resetLayout' }); return; }
    if (!sel) { return; }
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      if (sel.type === 'edge') { var p = sel.id.split('>'); post({ type: 'removeCall', from: p[0], to: p[1] }); }
      else { post({ type: 'deleteNode', id: sel.id }); }
    } else if (ev.key === 'F2' && sel.type === 'node') { ev.preventDefault(); post({ type: 'rename', id: sel.id }); }
    else if (ev.key === 'Enter' && sel.type === 'node') { post({ type: 'openCode', id: sel.id }); }
  });

  document.getElementById('addNode').addEventListener('click', function () { post({ type: 'addNode' }); });
  var full = false;
  function setFull(on) {
    if (on === full) { return; }
    full = on;
    document.body.classList.toggle('full', on);
    document.getElementById('full').innerHTML = on ? '&#x26F6; Exit full screen' : '&#x26F6; Full screen';
    post({ type: 'fullscreen', on: on });
    setTimeout(function () { if (fitMode) { fit(); } else { applyView(); } }, 250);
  }
  document.getElementById('full').addEventListener('click', function () { setFull(!full); });
  document.getElementById('zoom').addEventListener('change', function (ev) {
    var v = ev.target.value;
    if (v === 'custom') { return; }
    if (v === 'fit') { fit(); } else { setZoom(Number(v)); }
  });
  document.getElementById('zoomIn').addEventListener('click', function () { setZoom(view.k * 1.25); });
  document.getElementById('zoomOut').addEventListener('click', function () { setZoom(view.k / 1.25); });
  document.getElementById('relayout').addEventListener('click', function () { post({ type: 'resetLayout' }); });
  document.getElementById('refresh').addEventListener('click', function () { post({ type: 'ready' }); });
  document.getElementById('filter').addEventListener('input', function (ev) { filter = ev.target.value.toLowerCase().trim(); render(); });
  document.getElementById('alone').addEventListener('change', function (ev) { hideAlone = ev.target.checked; render(); });
  window.addEventListener('resize', applyView);

  window.addEventListener('message', function (ev) {
    var m = ev.data || {};
    if (m.type === 'model') {
      var first = model.nodes.length === 0;
      model = { nodes: m.nodes || [], edges: m.edges || [] };
      if (sel && sel.type === 'node' && !byId(sel.id)) { sel = null; }
      render();
      if (first || m.fit) { fit(); }
      document.getElementById('count').textContent = model.nodes.length + ' routines, ' + model.edges.length + ' calls';
    } else if (m.type === 'notice') { say(m.text); }
    else if (m.type === 'toggleFull') { setFull(!full); }
    else if (m.type === 'select') { sel = { type: 'node', id: m.id }; render(); }
  });
  post({ type: 'ready' });
})();
`;
}

export function blueprintHtml(o: BlueprintPageOptions): string {
    const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${o.cspSource} 'nonce-${o.nonce}'; script-src 'nonce-${o.nonce}';">
<title>Blueprint</title>
<style nonce="${o.nonce}">${blueprintCss()}</style></head>
<body>
<div class="bar">
<span class="title">${esc(o.title)}</span>
<button id="addNode" class="primary" title="Add a routine to the code (double-click on the canvas does the same where you click)">+ Node</button>
<label title="Fit window shows everything. The wheel zooms too, the middle button pans; keys: 0 = 100%, 9 or F = fit, + and - zoom">Zoom <select id="zoom"><option value="fit">Fit window</option><option id="zoomcustom" value="custom" hidden>100%</option><option value="0.25">25%</option><option value="0.5">50%</option><option value="0.75">75%</option><option value="1">100%</option><option value="1.25">125%</option><option value="1.5">150%</option><option value="2">200%</option></select></label>
<button id="zoomOut" title="Zoom out (-)">&minus;</button><button id="zoomIn" title="Zoom in (+)">+</button>
<button id="full" title="Full screen: hide the side bar and the panels (Ctrl+K Ctrl+F; Esc leaves it)">&#x26F6; Full screen</button>
<button id="relayout" title="Forget the positions and lay the nodes out again (L)">Auto layout</button>
<button id="refresh" title="Read the file again">Refresh</button>
<input id="filter" type="text" placeholder="Filter nodes (/)" spellcheck="false">
<label title="Hide the routines that neither call nor are called"><input id="alone" type="checkbox"> hide isolated</label>
<span class="grow"></span><span class="msg" id="msg"></span><span class="msg" id="count"></span>
</div>
<div id="stage">
<svg id="cv"><g id="grid"></g><g id="world"></g></svg>
<div class="empty" id="empty">No routine to draw in this file.</div>
<div class="help">Wheel zooms, middle button pans &middot; Drag a node by its title &middot; drag from a white arrow to another node to add a call &middot; click a wire + Delete removes the call &middot; F2 rename &middot; Delete removes the routine &middot; double-click opens the code</div>
</div>
<script nonce="${o.nonce}">${blueprintScript()}</script>
</body></html>`;
}
