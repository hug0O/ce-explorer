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
.bar button:disabled { opacity: 0.4; cursor: default; }
.bar button.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.bar input[type=text] { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; padding: 3px 6px; width: 150px; font-size: 12px; }
.bar label { display: flex; align-items: center; gap: 3px; color: var(--vscode-descriptionForeground); cursor: pointer; }
.bar .grow { flex: 1; }
body.full .bar { padding: 3px 8px; }
body.full .help { display: none; }
.bar .msg { color: var(--vscode-descriptionForeground); max-width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#main { flex: 1; min-height: 0; display: flex; }
#stage { flex: 1; min-width: 0; position: relative; }
#side { width: 280px; flex: none; border-left: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.35)); overflow-y: auto; padding: 10px; box-sizing: border-box; }
body.noside #side { display: none; }
#side h3 { margin: 0 0 2px; font-size: 14px; word-break: break-all; }
#side .kind { color: var(--vscode-descriptionForeground); margin-bottom: 8px; }
#side h4 { margin: 12px 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--vscode-descriptionForeground); }
#side .sig { font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; line-height: 1.5; }
#side .sig .t { color: var(--vscode-symbolIcon-typeParameterForeground, #4ec9b0); }
#side .acts { display: flex; gap: 4px; flex-wrap: wrap; margin: 8px 0 2px; }
#side button.act { background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.2)); color: var(--vscode-button-secondaryForeground, inherit); border: 1px solid transparent; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-size: 11px; font-family: inherit; }
#side button.act.danger:hover { background: #a33b3b; color: #fff; }
#side .li { display: flex; gap: 6px; align-items: center; width: 100%; text-align: left; background: transparent; color: inherit; border: none; padding: 3px 4px; border-radius: 3px; cursor: pointer; font-family: inherit; font-size: 12px; }
#side .li:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.18)); }
#side .li .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
#side .li .nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#side .li .ct { color: var(--vscode-descriptionForeground); font-size: 10px; }
#side .fld { display: flex; align-items: center; gap: 6px; margin: 4px 0; }
#side .fld .fl { width: 52px; color: var(--vscode-descriptionForeground); font-size: 11px; }
#side input[type=text] { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; padding: 3px 5px; font-size: 12px; min-width: 0; font-family: var(--vscode-editor-font-family, monospace); }
#side .fld input { flex: 1; }
#side .prow { display: flex; gap: 3px; margin: 3px 0; align-items: center; }
#side .prow select { width: 54px; flex: none; background: var(--vscode-dropdown-background, var(--vscode-input-background)); color: var(--vscode-dropdown-foreground, inherit); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; font-size: 11px; padding: 2px; }
#side .prow .pn { width: 70px; flex: 1; }
#side .prow .pt { width: 70px; flex: 1; }
#side button.act.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
#side .none { color: var(--vscode-descriptionForeground); font-size: 11px; padding: 2px 4px; }
#side .tip { color: var(--vscode-descriptionForeground); font-size: 11px; line-height: 1.5; margin-top: 12px; }
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
.node.dim { opacity: 0.12; }
.node.alone { opacity: 0.6; }
.node.hit .body { stroke: #ffd54a; stroke-width: 2.5; }
.node.alone.dim { opacity: 0.12; }
.node.in .body { stroke: #4aa3ff; stroke-width: 2; }
.node.out .body { stroke: #ffb347; stroke-width: 2; }
svg.lod .lbl, svg.lod .sub { display: none; }
svg.lod .ttl { font-size: 17px; }
.node.nobody .head { filter: saturate(0.2); }
.wire { fill: none; stroke-width: 2.2; opacity: 0.8; pointer-events: none; }
.wire.dim { opacity: 0.07; }
.wire.in { stroke: #4aa3ff; opacity: 1; stroke-width: 3; }
.wire.out { stroke: #ffb347; opacity: 1; stroke-width: 3; }
.wire.sel { stroke: var(--vscode-focusBorder, #007fd4); stroke-width: 3.5; opacity: 1; }
.wire.temp { stroke: #ffd54a; stroke-dasharray: 5 4; }
.hit { fill: none; stroke: transparent; stroke-width: 12; cursor: pointer; }
.legend { position: absolute; left: 10px; top: 8px; color: var(--vscode-descriptionForeground); font-size: 11px; background: var(--vscode-editor-background); opacity: 0.9; padding: 3px 6px; border-radius: 3px; pointer-events: none; }
.legend i { display: inline-block; width: 14px; height: 3px; vertical-align: middle; margin: 0 3px 0 8px; }
body.full .legend { display: none; }
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
  var editing = null;                   // id of the routine whose signature is being edited in the details panel
  var editForm = null;
  var swapped = false;                  // the nodes shown are laid out again among themselves (the saved positions are kept aside)
  var subsetKey = '';
  var isolate = false;                  // hide everything that is not linked to the selected routine
  var withLinked = false;               // the filter also keeps the routines next to the ones it finds
  var compact = false;                  // no data pins: one line per node
  var depthMode = 1;                    // how far the focus on the selected node reaches
  var modelVer = 0, sideKey = '';
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

  function edgeColor(id) { return 'hsl(' + hue(id) + ',55%,64%)'; }
  function heightOf(n) { return compact ? HEAD + 26 : n.h; }
  /* the routines that call n (up) and those n calls (down), each with its distance, as far as the focus reaches */
  function reach() {
    var up = {}, down = {};
    if (!sel || sel.type !== 'node') { return null; }
    function walk(start, field, other, into) {
      var queue = [[start, 0]];
      var seen = {}; seen[start] = true;
      while (queue.length) {
        var cur = queue.shift();
        if (cur[1] >= depthMode) { continue; }
        model.edges.forEach(function (e) {
          if (e[field] !== cur[0] || seen[e[other]]) { return; }
          seen[e[other]] = true; into[e[other]] = cur[1] + 1; queue.push([e[other], cur[1] + 1]);
        });
      }
    }
    walk(sel.id, 'to', 'from', up);
    walk(sel.id, 'from', 'to', down);
    return { up: up, down: down };
  }
  function callersOf(id) { return model.edges.filter(function (e) { return e.to === id; }); }
  function calleesOf(id) { return model.edges.filter(function (e) { return e.from === id; }); }
  function aloneSet() {
    var linked = {};
    model.edges.forEach(function (e) { linked[e.from] = true; linked[e.to] = true; });
    return linked;
  }
  /* the nodes drawn: the ones that pass the filter (and, if asked, their direct neighbours), without the isolated ones if hidden */
  function visibleSet() {
    var linked = aloneSet();
    var keep = {};
    model.nodes.forEach(function (n) { keep[n.id] = matches(n) && !(hideAlone && !linked[n.id]); });
    if (filter && withLinked) {
      var extra = {};
      model.edges.forEach(function (e) {
        if (keep[e.from] && !keep[e.to]) { extra[e.to] = true; }
        if (keep[e.to] && !keep[e.from]) { extra[e.from] = true; }
      });
      model.nodes.forEach(function (n) { if (extra[n.id] && !(hideAlone && !linked[n.id])) { keep[n.id] = true; } });
    }
    if (isolate) {
      var r = reach();
      if (r) { model.nodes.forEach(function (n) { keep[n.id] = keep[n.id] && (n.id === sel.id || !!r.up[n.id] || !!r.down[n.id]); }); }
    }
    return keep;
  }
  /* When a filter or "hide others" leaves only some nodes, they are laid out again as if they were alone and centred;
     the extension does the layout (the same as for the whole file) and the real positions come back when everything is shown. */
  function syncSubset() {
    var keep = visibleSet();
    var ids = model.nodes.filter(function (n) { return keep[n.id]; }).map(function (n) { return n.id; });
    var active = ids.length > 0 && ids.length < model.nodes.length && (!!filter || (isolate && sel && sel.type === 'node'));
    if (active) {
      var key = ids.join('|');
      if (key !== subsetKey) { subsetKey = key; post({ type: 'subsetLayout', ids: ids, key: key }); }
      return;
    }
    subsetKey = '';
    if (swapped) {
      model.nodes.forEach(function (n) { if (n.ox !== undefined) { n.x = n.ox; n.y = n.oy; } delete n.ox; delete n.oy; });
      swapped = false;
      render(); fit();
    }
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
    var visible = visibleSet();
    var rc = reach();
    var wires = el('g', {}, world);
    model.edges.forEach(function (e) {
      var a = byId(e.from), b = byId(e.to);
      if (!a || !b || !visible[a.id] || !visible[b.id]) { return; }
      var d = wirePath(a, b);
      var id = e.from + '>' + e.to;
      var cls = 'wire';
      if (sel && sel.type === 'edge' && sel.id === id) { cls += ' sel'; }
      else if (rc) {
        var outE = (e.from === sel.id || rc.down[e.from]) && rc.down[e.to];
        var inE = (e.to === sel.id || rc.up[e.to]) && rc.up[e.from];
        cls += outE ? ' out' : inE ? ' in' : ' dim';
      }
      var p = el('path', { d: d, 'class': cls, stroke: edgeColor(e.from) }, wires);
      p.setAttribute('data-edge', id);
      var hit = el('path', { d: d, 'class': 'hit' }, wires);
      var tip = el('title', {}, hit); tip.textContent = a.name + ' calls ' + b.name + ' (' + e.lines.length + 'x) - click, then Delete to remove the call';
      hit.addEventListener('mousedown', function (ev) { ev.stopPropagation(); sel = { type: 'edge', id: id }; render(); });
    });
    model.nodes.forEach(function (n) {
      if (!visible[n.id]) { return; }
      var inFocus = !rc || sel.id === n.id || rc.up[n.id] || rc.down[n.id];
      var cls = 'node' + (sel && sel.type === 'node' && sel.id === n.id ? ' sel' : '') + (inFocus ? '' : ' dim') + (n.hasBody ? '' : ' nobody') + (linked[n.id] ? '' : ' alone') + (filter && withLinked && matches(n) ? ' hit' : '')
        + (rc && rc.up[n.id] ? ' in' : '') + (rc && rc.down[n.id] ? ' out' : '');
      var nh = heightOf(n);
      var g = el('g', { 'class': cls, transform: 'translate(' + n.x + ',' + n.y + ')', 'data-id': n.id }, world);
      el('rect', { 'class': 'body', x: 0, y: 0, width: n.w, height: nh, rx: 6 }, g);
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
      if (!compact) { n.params.forEach(function (p, i) {
        var y = HEAD + 12 + (i + 1) * ROWH;
        var c = el('circle', { 'class': 'pin', cx: 0, cy: y, r: 5, fill: pinColor(p.type) }, g);
        var t = el('title', {}, c); t.textContent = (p.dir ? p.dir + ' ' : '') + p.name + (p.type ? ': ' + p.type : '');
        var l = el('text', { 'class': 'lbl', x: 12, y: y + 4 }, g);
        l.textContent = trunc(p.name + (p.type ? ': ' + p.type : ''), Math.floor((n.w - 24) / 6.5));
      }); }
      if (!compact && n.ret) {
        var yr = HEAD + 12 + ROWH;
        var retc = el('circle', { 'class': 'pin', cx: n.w, cy: yr, r: 5, fill: pinColor(n.ret) }, g);
        var rt = el('title', {}, retc); rt.textContent = 'returns ' + n.ret;
        var rl = el('text', { 'class': 'lbl out', x: n.w - 12, y: yr + 4 }, g); rl.textContent = trunc(n.ret, Math.floor((n.w - 24) / 6.5));
      }
    });
    applyView();
    renderSide();
    document.getElementById('empty').style.display = model.nodes.length ? 'none' : 'flex';
  }

  function centerOn(n) {
    fitMode = false;
    view.x = cv.clientWidth / 2 - (n.x + n.w / 2) * view.k;
    view.y = cv.clientHeight / 2 - (n.y + heightOf(n) / 2) * view.k;
    applyView();
  }
  function select(id, center) {
    var n = byId(id);
    if (!n) { return; }
    sel = { type: 'node', id: id };
    render();
    if (isolate) { fit(); } else if (center) { centerOn(n); }
    syncSubset();
  }
  function h(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text !== undefined) { e.textContent = text; }
    if (parent) { parent.appendChild(e); }
    return e;
  }
  function listItem(parent, n, count, onclick) {
    var b = h('button', 'li', undefined, parent);
    var dot = h('span', 'dot', undefined, b); dot.style.background = HEADS[n.kind] || '#2a6fb0';
    h('span', 'nm', (n.owner ? n.owner + '.' : '') + n.name, b);
    if (count > 1) { h('span', 'ct', count + 'x', b); }
    b.addEventListener('click', onclick || function () { select(n.id, true); });
    return b;
  }
  function section(side, title, edges, field) {
    h('h4', '', title + ' (' + edges.length + ')', side);
    if (!edges.length) { h('div', 'none', field === 'from' ? 'nobody in this file' : 'no call', side); return; }
    edges.forEach(function (e) { var n = byId(e[field]); if (n) { listItem(side, n, e.lines.length); } });
  }
  function startEdit(id) {
    var n = byId(id);
    if (!n) { return; }
    editing = id;
    editForm = { name: n.name, returnType: n.ret || '', params: n.params.map(function (p) { return { name: p.name, type: p.type || '', dir: p.dir || '' }; }) };
    sideKey = '';
    renderSide();
  }
  function stopEdit() { editing = null; editForm = null; sideKey = ''; renderSide(); }
  function field(parent, label, value, onInput, narrow) {
    var row = h('label', 'fld', undefined, parent);
    if (label) { h('span', 'fl', label, row); }
    var inp = h('input', narrow ? 'narrow' : '', undefined, row);
    inp.type = 'text'; inp.value = value; inp.spellcheck = false;
    inp.addEventListener('input', function () { onInput(inp.value); });
    return inp;
  }
  function renderEditor(side, n) {
    h('h3', '', 'Edit ' + n.name, side);
    h('div', 'kind', 'The body of the routine is kept. A new name is applied to every call too.', side);
    field(side, 'Name', editForm.name, function (v) { editForm.name = v; });
    if (n.kind !== 'constructor' && n.kind !== 'destructor') { field(side, 'Returns', editForm.returnType, function (v) { editForm.returnType = v; }); }
    h('h4', '', 'Parameters', side);
    var list = h('div', 'plist', undefined, side);
    function draw() {
      while (list.firstChild) { list.removeChild(list.firstChild); }
      editForm.params.forEach(function (p, i) {
        var row = h('div', 'prow', undefined, list);
        var dir = h('select', '', undefined, row);
        ['', 'var', 'const', 'out'].forEach(function (d) { var o = h('option', '', d || 'in', dir); o.value = d; });
        dir.value = p.dir; dir.title = 'How the parameter is passed';
        dir.addEventListener('change', function () { p.dir = dir.value; });
        var nm = h('input', 'pn', undefined, row); nm.type = 'text'; nm.value = p.name; nm.placeholder = 'name'; nm.spellcheck = false;
        nm.addEventListener('input', function () { p.name = nm.value; });
        var ty = h('input', 'pt', undefined, row); ty.type = 'text'; ty.value = p.type; ty.placeholder = 'type'; ty.spellcheck = false;
        ty.addEventListener('input', function () { p.type = ty.value; });
        var rm = h('button', 'act danger', 'x', row); rm.title = 'Remove this parameter';
        rm.addEventListener('click', function () { editForm.params.splice(i, 1); draw(); });
      });
    }
    draw();
    var add = h('button', 'act', '+ Parameter', side);
    add.addEventListener('click', function () { editForm.params.push({ name: '', type: '', dir: '' }); draw(); });
    var acts = h('div', 'acts', undefined, side);
    var ok = h('button', 'act primary', 'Apply', acts);
    ok.addEventListener('click', function () {
      post({ type: 'editNode', id: n.id, name: editForm.name, returnType: editForm.returnType, params: editForm.params });
      stopEdit();
    });
    var cancel = h('button', 'act', 'Cancel', acts);
    cancel.addEventListener('click', stopEdit);
  }
  function renderSide() {
    if (editing && !(sel && sel.type === 'node' && sel.id === editing)) { editing = null; editForm = null; }
    var key = editing ? 'edit|' + editing : (sel ? sel.type + ':' + sel.id : '') + '|' + filter + '|' + modelVer + '|' + hideAlone + '|' + withLinked + '|' + isolate + '|' + depthMode;
    if (key === sideKey) { return; }
    sideKey = key;
    var side = document.getElementById('side');
    while (side.firstChild) { side.removeChild(side.firstChild); }
    if (editing && sel && sel.type === 'node' && byId(sel.id)) { renderEditor(side, byId(sel.id)); return; }
    if (sel && sel.type === 'node' && byId(sel.id)) {
      var n = byId(sel.id);
      h('h3', '', n.name, side);
      h('div', 'kind', (n.owner ? n.owner + ' - ' : '') + n.kind + (n.hasBody ? '' : ' (declaration only)') + (n.recursive ? ' - recursive' : '') + ' - line ' + (n.line + 1), side);
      var sig = h('div', 'sig', undefined, side);
      n.params.forEach(function (p) { h('div', '', (p.dir ? p.dir + ' ' : '') + p.name + (p.type ? ': ' : ''), sig).appendChild(h('span', 't', p.type || '')); });
      if (n.ret) { var r = h('div', '', 'returns ', sig); r.appendChild(h('span', 't', n.ret)); }
      var acts = h('div', 'acts', undefined, side);
      [['Open code', 'openCode', ''], ['Edit... (E)', 'edit', ''], ['Rename (F2)', 'rename', ''], ['Delete', 'deleteNode', ' danger']].forEach(function (a) {
        var b = h('button', 'act' + a[2], a[0], acts);
        b.addEventListener('click', function () { if (a[1] === 'edit') { startEdit(n.id); } else { post({ type: a[1], id: n.id }); } });
      });
      section(side, 'Called by', callersOf(n.id), 'from');
      section(side, 'Calls', calleesOf(n.id), 'to');
      h('div', 'tip', 'Click a name to go to that routine. The routines that call it are lit in blue, those it calls in orange; the Focus box widens or narrows what is lit.', side);
      return;
    }
    if (sel && sel.type === 'edge') {
      var p2 = sel.id.split('>'), a = byId(p2[0]), b2 = byId(p2[1]);
      var ed = model.edges.filter(function (e) { return e.from === p2[0] && e.to === p2[1]; })[0];
      if (a && b2 && ed) {
        h('h3', '', a.name + ' calls ' + b2.name, side);
        h('div', 'kind', ed.lines.length + (ed.lines.length > 1 ? ' call sites' : ' call site') + ', line ' + ed.lines.map(function (l) { return l + 1; }).join(', '), side);
        var acts2 = h('div', 'acts', undefined, side);
        var rm = h('button', 'act danger', 'Remove the call (Delete)', acts2);
        rm.addEventListener('click', function () { post({ type: 'removeCall', from: p2[0], to: p2[1] }); });
        var op = h('button', 'act', 'Open ' + a.name, acts2);
        op.addEventListener('click', function () { post({ type: 'openCode', id: a.id }); });
        listItem(side, a, 0); listItem(side, b2, 0);
        return;
      }
    }
    // nothing selected: the routines, the ones nobody calls first
    var linked = aloneSet();
    var keepSide = visibleSet();
    var shown = model.nodes.filter(function (n) { return keepSide[n.id]; });
    h('h3', '', 'Routines', side);
    h('div', 'kind', model.nodes.length + ' routines, ' + model.edges.length + ' calls', side);
    var groups = [
      ['Entry points (nobody calls them here)', shown.filter(function (n) { return linked[n.id] && !callersOf(n.id).length; })],
      ['Called by others', shown.filter(function (n) { return callersOf(n.id).length > 0; })],
      ['Isolated (no call in or out)', shown.filter(function (n) { return !linked[n.id]; })]
    ];
    groups.forEach(function (g) {
      if (!g[1].length) { return; }
      h('h4', '', g[0] + ' (' + g[1].length + ')', side);
      g[1].forEach(function (n) { listItem(side, n, 0); });
    });
    if (!shown.length) { h('div', 'none', 'No routine matches the filter.', side); }
    h('div', 'tip', 'Click a routine to select it and see who calls it and what it calls. Everything else fades.', side);
  }

  function applyView() {
    showZoom();
    cv.classList.toggle('lod', view.k < 0.7);
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
    var keep = visibleSet();
    var list = model.nodes.filter(function (n) { return keep[n.id]; });
    if (!list.length) { view = { x: 40, y: 40, k: 1 }; applyView(); return; }
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    list.forEach(function (n) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + n.w); y1 = Math.max(y1, n.y + heightOf(n)); });
    x0 -= 12; x1 += 12;   // the exec arrows stick out of the nodes
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
      syncSubset();
      return;
    }
    sel = null;
    drag = { mode: 'pan', sx: ev.clientX, sy: ev.clientY, ox: view.x, oy: view.y, moved: false };
    cv.classList.add('panning');
    render();
    syncSubset();
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
    if (d.mode === 'move' && d.moved && !swapped) { var pos = {}; pos[d.node.id] = { x: d.node.x, y: d.node.y }; post({ type: 'positions', positions: pos }); }
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
    if (ev.key === 'Escape') { if (inField) { return; } else if (!sel && full) { setFull(false); } sel = null; render(); return; }
    if (inField) { return; }
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey) {
      var kk = ev.key.toLowerCase();
      if (kk === 'z') { ev.preventDefault(); post({ type: ev.shiftKey ? 'redo' : 'undo' }); return; }
      if (kk === 'y') { ev.preventDefault(); post({ type: 'redo' }); return; }
      return;
    }
    if (ev.key === '/') { ev.preventDefault(); document.getElementById('filter').focus(); return; }
    if (ev.key === 'f' || ev.key === '9') { fit(); return; }
    if (ev.key === 'h') { setIsolate(!isolate); return; }
    if (ev.key === '0') { setZoom(1); return; }
    if (ev.key === '+' || ev.key === '=') { setZoom(view.k * 1.25); return; }
    if (ev.key === '-') { setZoom(view.k / 1.25); return; }
    if (ev.key === 'l') { post({ type: 'resetLayout' }); return; }
    if (!sel) { return; }
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      if (sel.type === 'edge') { var p = sel.id.split('>'); post({ type: 'removeCall', from: p[0], to: p[1] }); }
      else { post({ type: 'deleteNode', id: sel.id }); }
    } else if (ev.key === 'e' && sel.type === 'node') { startEdit(sel.id); }
    else if (ev.key === 'F2' && sel.type === 'node') { ev.preventDefault(); post({ type: 'rename', id: sel.id }); }
    else if (ev.key === 'Enter' && sel.type === 'node') { post({ type: 'openCode', id: sel.id }); }
  });

  document.getElementById('undo').addEventListener('click', function () { post({ type: 'undo' }); });
  document.getElementById('redo').addEventListener('click', function () { post({ type: 'redo' }); });
  document.getElementById('addNode').addEventListener('click', function () { post({ type: 'addNode' }); });
  var full = false;
  function setFull(on) {
    if (on === full) { return; }
    full = on;
    document.body.classList.toggle('full', on);
    document.getElementById('full').innerHTML = on ? '&#x26F6; Exit full screen' : '&#x26F6; Full screen';
    post({ type: 'fullscreen', on: on });
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
  function applyFilter() {
    render();
    var keep = visibleSet();
    var found = model.nodes.filter(function (n) { return filter && matches(n) && keep[n.id]; });
    if (found.length === 1 && !(sel && sel.type === 'node' && sel.id === found[0].id)) { sel = { type: 'node', id: found[0].id }; render(); }
    fit();
    syncSubset();
    say(filter ? (found.length ? found.length + (found.length > 1 ? ' routines match' : ' routine matches') + ' - Enter selects the first, Esc clears the filter' : 'no routine matches') : '');
  }
  document.getElementById('filter').addEventListener('input', function (ev) { filter = ev.target.value.toLowerCase().trim(); applyFilter(); });
  document.getElementById('filter').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') {
      var keep = visibleSet();
      var first = model.nodes.filter(function (n) { return matches(n) && keep[n.id]; })[0];
      if (first) { sel = { type: 'node', id: first.id }; render(); fit(); syncSubset(); }
    } else if (ev.key === 'Escape') {
      ev.target.value = ''; filter = ''; ev.target.blur(); applyFilter();
    }
  });
  document.getElementById('linked').addEventListener('change', function (ev) { withLinked = ev.target.checked; applyFilter(); });
  function setIsolate(on) {
    isolate = on;
    document.getElementById('isolate').checked = on;
    render();
    if (sel && sel.type === 'node') { fit(); }
    syncSubset();
    say(on ? (sel ? '' : 'Select a routine: everything not linked to it is hidden') : '');
  }
  document.getElementById('isolate').addEventListener('change', function (ev) { setIsolate(ev.target.checked); });
  document.getElementById('focus').addEventListener('change', function (ev) { depthMode = Number(ev.target.value); render(); if (isolate && sel && sel.type === 'node') { fit(); } syncSubset(); });
  document.getElementById('pins').addEventListener('change', function (ev) { compact = !ev.target.checked; render(); if (fitMode) { fit(); } });
  document.getElementById('details').addEventListener('click', function () { document.body.classList.toggle('noside'); });
  document.getElementById('alone').addEventListener('change', function (ev) { hideAlone = ev.target.checked; render(); fit(); });
  /* the graph follows the size of its window: in Fit window mode it is fitted again, otherwise the zoom and the point of view stay */
  var lastW = 0, lastH = 0;
  function resized() {
    var w = cv.clientWidth, h = cv.clientHeight;
    if (w === lastW && h === lastH) { return; }
    var firstSize = lastW === 0 || lastH === 0;
    lastW = w; lastH = h;
    if (w < 50 || h < 50) { return; }
    if (fitMode || firstSize) { fit(); } else { applyView(); }
  }
  if (typeof ResizeObserver !== 'undefined') { new ResizeObserver(resized).observe(document.getElementById('stage')); }
  window.addEventListener('resize', resized);

  window.addEventListener('message', function (ev) {
    var m = ev.data || {};
    if (m.type === 'model') {
      var first = model.nodes.length === 0;
      model = { nodes: m.nodes || [], edges: m.edges || [] };
      modelVer++;
      if (first) { compact = model.nodes.length > 25; document.getElementById('pins').checked = !compact; }
      if (sel && sel.type === 'node' && !byId(sel.id)) { sel = null; }
      swapped = false; subsetKey = '';
      render();
      if (first || m.fit) { fit(); }
      syncSubset();
      document.getElementById('count').textContent = model.nodes.length + ' routines, ' + model.edges.length + ' calls';
    } else if (m.type === 'notice') { say(m.text); }
    else if (m.type === 'toggleFull') { setFull(!full); }
    else if (m.type === 'history') {
      var u = document.getElementById('undo'), r = document.getElementById('redo');
      u.disabled = !m.undo; u.title = m.undo ? 'Undo: ' + m.undo + ' (Ctrl+Z)' : 'Nothing to undo';
      r.disabled = !m.redo; r.title = m.redo ? 'Redo: ' + m.redo + ' (Ctrl+Y)' : 'Nothing to redo';
    }
    else if (m.type === 'subset') {
      if (m.key !== subsetKey) { return; }
      model.nodes.forEach(function (n) {
        var q = m.positions[n.id];
        if (!q) { return; }
        if (n.ox === undefined) { n.ox = n.x; n.oy = n.y; }
        n.x = q.x; n.y = q.y;
      });
      swapped = true;
      render(); fit();
    }
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
<button id="undo" disabled title="Nothing to undo">&#x21B6; Undo</button><button id="redo" disabled title="Nothing to redo">&#x21B7; Redo</button>
<button id="relayout" title="Forget the positions and lay the nodes out again (L)">Auto layout</button>
<button id="refresh" title="Read the file again">Refresh</button>
<input id="filter" type="text" placeholder="Find a routine (/)" title="Type part of a name: only the routines that match are shown, and the view is centred on them. Enter selects the first, Esc clears" spellcheck="false">
<label title="With a filter, also show the routines that call the ones found or are called by them"><input id="linked" type="checkbox"> + linked</label>
<label title="How far the routines around the selected one are lit: those that call it (blue) and those it calls (orange)">Focus <select id="focus"><option value="1">direct</option><option value="2">2 levels</option><option value="99">all levels</option></select></label>
<label title="Show the parameters and the return value as pins; off, a node is one line"><input id="pins" type="checkbox" checked> pins</label>
<label title="Hide every routine that is not linked to the selected one (H). The Focus box says how far the link may go"><input id="isolate" type="checkbox"> hide others</label>
<label title="Hide the routines that neither call nor are called"><input id="alone" type="checkbox"> hide isolated</label>
<button id="details" title="Show or hide the details panel">Details</button>
<span class="grow"></span><span class="msg" id="msg"></span><span class="msg" id="count"></span>
</div>
<div id="main">
<div id="stage">
<svg id="cv"><g id="grid"></g><g id="world"></g></svg>
<div class="empty" id="empty">No routine to draw in this file.</div>
<div class="legend">Wire colour = the caller<i style="background:#4aa3ff"></i>calls the selected<i style="background:#ffb347"></i>called by the selected</div>
<div class="help">Wheel zooms, middle button pans &middot; Drag a node by its title &middot; drag from a white arrow to another node to add a call &middot; click a wire + Delete removes the call &middot; F2 rename &middot; Delete removes the routine &middot; double-click opens the code</div>
</div>
<div id="side"></div>
</div>
<script nonce="${o.nonce}">${blueprintScript()}</script>
</body></html>`;
}
