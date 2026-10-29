/**
 * The page of the Markdown editor: the document as blocks, drawn as Markdown is read, and in edit mode edited block by block, with a
 * "/" menu to turn a block into a heading, a list, a to-do, a quote, a code block, a table… as in Notion. The extension parses and
 * draws the Markdown (the page only moves blocks and edits text) and writes the file; the page sends the list of block texts, the
 * extension answers with the blocks drawn. Plain JavaScript in a string: no template literal inside.
 */
import { SLASH_ITEMS } from '../utils/mdSlash';

export interface MdPageOptions { nonce: string; cspSource: string; title: string }

export function mdCss(): string {
    return `
html, body { margin: 0; padding: 0; height: 100%; }
body { font-family: var(--vscode-font-family, sans-serif); font-size: 15px; line-height: 1.65; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
.top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 6px; padding: 5px 12px; background: var(--vscode-editor-background); border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.3)); font-size: 12px; }
.top .title { font-weight: 600; margin-right: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.top button { background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.2)); color: var(--vscode-button-secondaryForeground, inherit); border: 1px solid transparent; border-radius: 3px; padding: 3px 10px; cursor: pointer; font: inherit; font-size: 12px; }
.top button.on { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
#app { display: flex; align-items: flex-start; }
#outline { width: 210px; flex: none; position: sticky; top: 38px; max-height: calc(100vh - 44px); overflow-y: auto; padding: 14px 8px 14px 14px; font-size: 12px; line-height: 1.4; border-right: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.25)); }
#outline[hidden] { display: none; }
#outline .o { display: block; padding: 2px 4px; border-radius: 3px; cursor: pointer; color: var(--vscode-descriptionForeground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#outline .o:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.18)); color: var(--vscode-foreground); }
#outline .none { color: var(--vscode-descriptionForeground); font-style: italic; }
#page { flex: 1; min-width: 0; }
#doc { max-width: 820px; margin: 0 auto; padding: 24px 28px 20px 48px; }
.blk { position: relative; margin: 2px 0; border-radius: 4px; }
.editing .blk:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.08)); }
.blk .ctl { position: absolute; left: -44px; top: 2px; display: none; gap: 1px; }
.editing .blk:hover .ctl, .editing .blk.cur .ctl { display: flex; }
.ctl button { background: transparent; color: var(--vscode-descriptionForeground); border: none; cursor: pointer; font-size: 12px; padding: 0 2px; }
.ctl button:hover { color: var(--vscode-foreground); }
.blk .body.empty { color: var(--vscode-descriptionForeground); opacity: 0.55; min-height: 1.65em; }
.editing .blk .body { cursor: text; }
.body h1 { font-size: 2em; margin: 0.5em 0 0.2em; line-height: 1.25; }
.body h2 { font-size: 1.55em; margin: 0.5em 0 0.2em; line-height: 1.3; }
.body h3 { font-size: 1.25em; margin: 0.4em 0 0.15em; }
.body h4, .body h5, .body h6 { margin: 0.4em 0 0.1em; }
.body p { margin: 0.2em 0; }
.body ul, .body ol { margin: 0.15em 0; padding-left: 1.6em; }
.body li.task { list-style: none; margin-left: -1.3em; }
.body li.task input { margin-right: 0.4em; }
.body blockquote { margin: 0.2em 0; padding: 0.1em 0 0.1em 1em; border-left: 3px solid var(--vscode-textBlockQuote-border, rgba(128,128,128,0.5)); color: var(--vscode-descriptionForeground); }
.body pre { margin: 0.3em 0; padding: 10px 12px; border-radius: 5px; overflow-x: auto; background: var(--vscode-textCodeBlock-background, rgba(127,127,127,0.15)); font-size: 13px; line-height: 1.45; }
.body pre[data-lang]::before { content: attr(data-lang); display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; }
.body code { font-family: var(--vscode-editor-font-family, monospace); font-size: 0.9em; background: var(--vscode-textCodeBlock-background, rgba(127,127,127,0.15)); padding: 0 4px; border-radius: 3px; }
.body pre code { background: transparent; padding: 0; }
.body table { border-collapse: collapse; margin: 0.4em 0; }
.body th, .body td { border: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.4)); padding: 4px 10px; }
.body th { background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.12)); }
.body hr { border: none; border-top: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.45)); margin: 0.9em 0; }
.body a { color: var(--vscode-textLink-foreground, #3794ff); }
.body img { max-width: 100%; }
.body details.fm { font-size: 12px; color: var(--vscode-descriptionForeground); }
.body nav.toc { margin: 0.3em 0; padding: 6px 12px; border-radius: 5px; background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.1)); }
.body nav.toc a { display: block; }
textarea.ed { display: block; width: 100%; box-sizing: border-box; resize: none; overflow: hidden; border: none; outline: 1px solid var(--vscode-focusBorder, #007fd4); border-radius: 3px; padding: 4px 6px; margin: 0; font-family: var(--vscode-editor-font-family, monospace); font-size: 14px; line-height: 1.55; color: var(--vscode-input-foreground, inherit); background: var(--vscode-input-background, rgba(127,127,127,0.12)); }
#tail { min-height: 90px; cursor: text; }
.editing #tail:hover::after { content: '+ Click to add a block'; color: var(--vscode-descriptionForeground); font-size: 12px; opacity: 0.7; }
#slash { position: fixed; z-index: 60; width: 290px; max-height: 330px; overflow-y: auto; padding: 4px; background: var(--vscode-menu-background, var(--vscode-editorWidget-background, #252526)); color: var(--vscode-foreground); border: 1px solid var(--vscode-menu-border, var(--vscode-widget-border, rgba(128,128,128,0.5))); border-radius: 6px; box-shadow: 0 6px 20px rgba(0,0,0,0.45); font-size: 13px; line-height: 1.3; }
#slash[hidden] { display: none; }
#slash .it { display: flex; flex-direction: column; padding: 5px 8px; border-radius: 4px; cursor: pointer; }
#slash .it.on { background: var(--vscode-list-activeSelectionBackground, #094771); color: var(--vscode-list-activeSelectionForeground, #fff); }
#slash .it .h { font-size: 11px; opacity: 0.7; }
#slash .none { padding: 6px 8px; opacity: 0.7; }
`;
}

export function mdScript(): string {
    const items = JSON.stringify(SLASH_ITEMS.map(i => ({ id: i.id, title: i.title, hint: i.hint, keywords: i.keywords, insert: i.insert, caret: i.caret })));
    return `
(function () {
  var vscode = acquireVsCodeApi();
  var NL = String.fromCharCode(10);
  var SLASH = ${items};
  var blocks = [];            // { raw, html } for each block, in order
  var outlineData = [];
  var editMode = false, editing = -1, inflight = false, pendingFocus = null, draftTimer = null;
  var first = true;
  var drawing = false;        // the page is being drawn again: a text box that goes away is not a block left
  var doc = document.getElementById('doc');
  var side = document.getElementById('outline');
  var menu = document.getElementById('slash');
  var menuState = null;       // { start, items, on, ta }

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text !== undefined) { e.textContent = text; } return e; }
  function post(m) { vscode.postMessage(m); }
  function raws() { return blocks.map(function (b) { return b.raw; }); }
  function send(focus) { inflight = true; post({ type: 'blocks', raws: raws(), focus: focus || null }); }
  function draft() { clearTimeout(draftTimer); draftTimer = setTimeout(function () { post({ type: 'draft', raws: raws() }); }, 600); }

  /* ---------- drawing ---------- */
  function controls(i) {
    var c = el('div', 'ctl');
    var add = el('button', '', '+'); add.title = 'Add a block below (opens the / menu)';
    add.addEventListener('mousedown', function (e) { e.preventDefault(); });
    add.addEventListener('click', function () { blocks.splice(i + 1, 0, { raw: '/', html: '' }); send({ i: i + 1, pos: 1 }); });
    var up = el('button', '', '\\u2191'); up.title = 'Move up (Alt+Up)';
    up.addEventListener('click', function () { move(i, -1); });
    var dn = el('button', '', '\\u2193'); dn.title = 'Move down (Alt+Down)';
    dn.addEventListener('click', function () { move(i, 1); });
    var del = el('button', '', '\\u2715'); del.title = 'Delete the block';
    del.addEventListener('click', function () { blocks.splice(i, 1); send(null); });
    c.appendChild(add); c.appendChild(up); c.appendChild(dn); c.appendChild(del);
    return c;
  }
  function move(i, d) {
    var j = i + d;
    if (j < 0 || j >= blocks.length) { return; }
    var t = blocks[i]; blocks[i] = blocks[j]; blocks[j] = t;
    send({ i: j, pos: -2 });
  }
  function draw() {
    var top = document.scrollingElement ? document.scrollingElement.scrollTop : 0;
    closeMenu();
    drawing = true; editing = -1;
    doc.textContent = '';
    blocks.forEach(function (b, i) {
      var row = el('div', 'blk'); row.setAttribute('data-i', String(i));
      if (editMode) { row.appendChild(controls(i)); }
      var body = el('div', 'body');
      if (b.raw === '') { body.className = 'body empty'; body.textContent = editMode ? 'Type / for commands' : ''; } else { body.innerHTML = b.html; }
      row.appendChild(body);
      doc.appendChild(row);
    });
    var tail = el('div', ''); tail.id = 'tail';
    tail.addEventListener('click', function () { if (editMode) { blocks.push({ raw: '', html: '' }); send({ i: blocks.length - 1, pos: 0 }); } });
    doc.appendChild(tail);
    document.body.className = editMode ? 'editing' : '';
    document.getElementById('modeBtn').textContent = editMode ? '\\u{1F441} View' : '\\u270E Edit';
    document.getElementById('modeBtn').className = editMode ? 'on' : '';
    drawOutline();
    drawing = false;
    if (document.scrollingElement) { document.scrollingElement.scrollTop = top; }
    if (pendingFocus) { var f = pendingFocus; pendingFocus = null; if (editMode) { startEdit(f.i, f.pos); } }
  }
  function drawOutline() {
    side.textContent = '';
    if (!outlineData.length) { side.appendChild(el('div', 'none', 'No heading yet')); return; }
    outlineData.forEach(function (o) {
      var a = el('span', 'o', o.text); a.title = o.text; a.style.paddingLeft = (4 + (o.level - 1) * 10) + 'px';
      a.addEventListener('click', function () { var row = doc.children[o.index]; if (row) { row.scrollIntoView({ block: 'start', behavior: 'smooth' }); } });
      side.appendChild(a);
    });
  }

  /* ---------- editing a block ---------- */
  function autosize(ta) { ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; }
  function startEdit(i, pos) {
    if (!editMode || i < 0 || i >= blocks.length) { return; }
    var row = doc.children[i];
    if (!row) { return; }
    editing = i;
    Array.prototype.forEach.call(doc.querySelectorAll('.blk.cur'), function (r) { r.classList.remove('cur'); });
    row.classList.add('cur');
    var body = row.querySelector('.body');
    body.className = 'body'; body.textContent = '';
    var ta = el('textarea', 'ed');
    ta.value = blocks[i].raw; ta.spellcheck = false;
    body.appendChild(ta);
    autosize(ta);
    ta.focus();
    var p = pos === undefined || pos === -2 ? ta.value.length : pos;
    ta.setSelectionRange(p, p);
    ta.addEventListener('input', function () { blocks[i].raw = ta.value; autosize(ta); checkSlash(ta); draft(); });
    ta.addEventListener('keydown', function (e) { onKey(e, ta, i); });
    ta.addEventListener('blur', function () { if (!drawing && editing === i && !menuState) { editing = -1; send(null); } });
    checkSlash(ta);
  }

  /* ---------- the / menu ---------- */
  function slashAt(text, caret) {
    var before = text.slice(0, caret);
    var s = before.lastIndexOf('/');
    if (s < 0) { return null; }
    if (s > 0) { var c = before.charAt(s - 1); if (c !== ' ' && c !== NL && c !== String.fromCharCode(9)) { return null; } }
    var q = before.slice(s + 1);
    if (q.length > 20 || q.indexOf(' ') >= 0 || q.indexOf(NL) >= 0) { return null; }
    return { start: s, query: q };
  }
  function filterItems(q) {
    var words = q.toLowerCase().split(' ').filter(Boolean);
    if (!words.length) { return SLASH.slice(); }
    var hit = SLASH.filter(function (it) { var h = (it.title + ' ' + it.keywords).toLowerCase(); return words.every(function (w) { return h.indexOf(w) >= 0; }); });
    hit.sort(function (a, b) { var sa = a.title.toLowerCase().indexOf(words[0]) === 0 || a.id.indexOf(words[0]) === 0 ? 0 : 1; var sb = b.title.toLowerCase().indexOf(words[0]) === 0 || b.id.indexOf(words[0]) === 0 ? 0 : 1; return sa - sb; });
    return hit;
  }
  function checkSlash(ta) {
    var s = slashAt(ta.value, ta.selectionStart);
    if (!s) { closeMenu(); return; }
    var items = filterItems(s.query);
    if (!items.length) { closeMenu(); return; }
    menuState = { start: s.start, items: items, on: 0, ta: ta };
    drawMenu();
  }
  function drawMenu() {
    menu.textContent = '';
    menuState.items.forEach(function (it, k) {
      var d = el('div', 'it' + (k === menuState.on ? ' on' : ''));
      d.appendChild(el('span', 't', it.title)); d.appendChild(el('span', 'h', it.hint));
      d.addEventListener('mousedown', function (e) { e.preventDefault(); pick(it); });
      menu.appendChild(d);
    });
    var r = menuState.ta.getBoundingClientRect();
    menu.style.left = Math.max(4, Math.min(r.left + 20, window.innerWidth - 300)) + 'px';
    var below = r.bottom + 4;
    menu.style.top = (below + 330 > window.innerHeight ? Math.max(4, r.top - 334) : below) + 'px';
    menu.hidden = false;
    var cur = menu.querySelector('.it.on'); if (cur && cur.scrollIntoView) { cur.scrollIntoView({ block: 'nearest' }); }
  }
  function closeMenu() { menuState = null; menu.hidden = true; }
  function pick(it) {
    var ta = menuState.ta, start = menuState.start, caret = ta.selectionStart;
    var v = ta.value;
    var text = it.insert;
    ta.value = v.slice(0, start) + text + v.slice(caret);
    var p = start + (it.caret === undefined || it.caret === null ? text.length : it.caret);
    ta.setSelectionRange(p, p);
    var i = editing;
    if (i >= 0) { blocks[i].raw = ta.value; }
    closeMenu(); autosize(ta); draft(); ta.focus();
  }

  /* ---------- keys of a block ---------- */
  function marker(line) {
    var n = 0; while (n < line.length && line.charAt(n) === ' ') { n++; }
    var rest = line.slice(n);
    var m = rest.charAt(0);
    var mk = null, next = null;
    if ((m === '-' || m === '*' || m === '+') && rest.charAt(1) === ' ') { mk = m + ' '; next = mk; }
    else {
      var d = 0; while (d < rest.length && rest.charAt(d) >= '0' && rest.charAt(d) <= '9') { d++; }
      if (d > 0 && (rest.charAt(d) === '.' || rest.charAt(d) === ')') && rest.charAt(d + 1) === ' ') { mk = rest.slice(0, d + 2); next = String(Number(rest.slice(0, d)) + 1) + rest.charAt(d) + ' '; }
    }
    if (!mk) { return null; }
    var after = rest.slice(mk.length);
    var task = after.indexOf('[ ] ') === 0 || after.indexOf('[x] ') === 0 || after.indexOf('[X] ') === 0;
    return { indent: line.slice(0, n), mk: mk, next: task ? next + '[ ] ' : next, empty: after.trim() === '' || (task && after.slice(4).trim() === '' ) };
  }
  function openFence(v) {
    var first = v.split(NL)[0];
    if (first.indexOf('\`\`\`') !== 0 && first.indexOf('~~~') !== 0) { return false; }
    var n = v.split(NL).filter(function (l) { return l.indexOf(first.slice(0, 3)) === 0; }).length;
    return n % 2 === 1;
  }
  function onKey(e, ta, i) {
    if (menuState) {
      if (e.key === 'ArrowDown') { menuState.on = (menuState.on + 1) % menuState.items.length; drawMenu(); e.preventDefault(); return; }
      if (e.key === 'ArrowUp') { menuState.on = (menuState.on + menuState.items.length - 1) % menuState.items.length; drawMenu(); e.preventDefault(); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { pick(menuState.items[menuState.on]); e.preventDefault(); return; }
      if (e.key === 'Escape') { closeMenu(); e.preventDefault(); return; }
    }
    var v = ta.value, s = ta.selectionStart, end = ta.selectionEnd;
    if (e.key === 'Escape') { e.preventDefault(); editing = -1; send(null); return; }
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); blocks[i].raw = v; move(i, e.key === 'ArrowUp' ? -1 : 1); return; }
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      if (openFence(v)) { return; }
      var ls = v.lastIndexOf(NL, s - 1) + 1;
      var le = v.indexOf(NL, s); if (le < 0) { le = v.length; }
      var mk = marker(v.slice(ls, le));
      if (mk && s === le) {
        e.preventDefault();
        if (mk.empty) {
          // an empty item: leave the list, in a new block
          var kept = v.slice(0, ls > 0 ? ls - 1 : 0);
          blocks[i].raw = kept; blocks.splice(i + 1, 0, { raw: '', html: '' }); send({ i: kept === '' ? i : i + 1, pos: 0 });
        } else { ta.value = v.slice(0, s) + NL + mk.indent + mk.next + v.slice(end); var p = s + 1 + mk.indent.length + mk.next.length; ta.setSelectionRange(p, p); blocks[i].raw = ta.value; autosize(ta); draft(); }
        return;
      }
      e.preventDefault();
      blocks[i].raw = v.slice(0, s); blocks.splice(i + 1, 0, { raw: v.slice(end), html: '' });
      send({ i: i + 1, pos: 0 });
      return;
    }
    if (e.key === 'Backspace' && v === '' && blocks.length > 1) { e.preventDefault(); blocks.splice(i, 1); send({ i: Math.max(0, i - 1), pos: -2 }); return; }
    if (e.key === 'ArrowUp' && s === 0 && end === 0 && i > 0) { e.preventDefault(); editing = -1; send({ i: i - 1, pos: -2 }); return; }
    if (e.key === 'ArrowDown' && s === v.length && end === v.length && i < blocks.length - 1) { e.preventDefault(); editing = -1; send({ i: i + 1, pos: 0 }); return; }
  }

  /* ---------- clicks ---------- */
  doc.addEventListener('click', function (e) {
    var t = e.target;
    var a = t.closest ? t.closest('a') : null;
    if (a) { e.preventDefault(); post({ type: 'link', href: a.getAttribute('href') || '' }); return; }
    var row = t.closest ? t.closest('.blk') : null;
    if (!row) { return; }
    var i = Number(row.getAttribute('data-i'));
    if (t.tagName === 'INPUT' && t.type === 'checkbox') { e.preventDefault(); inflight = true; post({ type: 'toggle', i: i, ln: Number(t.getAttribute('data-ln')) }); return; }
    if (!editMode || t.tagName === 'TEXTAREA' || editing === i) { return; }
    if (inflight) { pendingFocus = { i: i, pos: -2 }; return; }
    startEdit(i, -2);
  });
  document.getElementById('modeBtn').addEventListener('click', function () { editMode = !editMode; if (!editMode) { editing = -1; send(null); } else { draw(); } });
  document.getElementById('outBtn').addEventListener('click', function () { side.hidden = !side.hidden; this.className = side.hidden ? '' : 'on'; });
  document.getElementById('textBtn').addEventListener('click', function () { post({ type: 'openText' }); });

  window.addEventListener('message', function (ev) {
    var m = ev.data || {};
    if (m.type !== 'doc') { return; }
    inflight = false;
    blocks = m.blocks || [];
    outlineData = m.outline || [];
    if (m.title) { document.getElementById('ttl').textContent = m.title; }
    if (first) { first = false; editMode = !!m.startEditing; side.hidden = outlineData.length < 3; document.getElementById('outBtn').className = side.hidden ? '' : 'on'; if (editMode && !blocks.length) { blocks = [{ raw: '', html: '' }]; pendingFocus = { i: 0, pos: 0 }; } }
    if (m.focus) { pendingFocus = m.focus; }
    draw();
  });
  post({ type: 'ready' });
})();
`;
}

export function mdHtml(o: MdPageOptions): string {
    const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${o.cspSource} https: data:; style-src ${o.cspSource} 'nonce-${o.nonce}'; script-src 'nonce-${o.nonce}';">
<title>Markdown</title>
<style nonce="${o.nonce}">${mdCss()}</style></head>
<body>
<div class="top"><span class="title" id="ttl">${esc(o.title)}</span>
<button id="outBtn" title="Show or hide the headings of the page">Outline</button>
<button id="textBtn" title="Open the file in the text editor">Text</button>
<button id="modeBtn" title="View the page, or edit it block by block (type / in a block for commands)">&#x270E; Edit</button></div>
<div id="app"><aside id="outline" hidden></aside><div id="page"><div id="doc"></div></div></div>
<div id="slash" hidden></div>
<script nonce="${o.nonce}">${mdScript()}</script>
</body></html>`;
}
