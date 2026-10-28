/**
 * The page of the project panel: SQL of the project, what is unused, the checks of every form, and what changed
 * in a form since a commit. The page holds no data of its own: the extension posts it, and the script draws it
 * with the DOM (text only, never markup built from the data).
 */

export const PROJECT_TABS = ['sql', 'dead', 'size', 'unused', 'checks', 'texts', 'names', 'forms', 'hotspots', 'changes'] as const;
export type ProjectTab = typeof PROJECT_TABS[number];

/** Tabs for every language: they read the source files of any supported language. */
export const COMMON_TABS: readonly ProjectTab[] = ['sql', 'dead', 'size', 'hotspots'];
/** Tabs that need Delphi files (a .pas, a .dfm): offered only when the project has some. */
export const DELPHI_TABS: readonly ProjectTab[] = ['unused', 'checks', 'texts', 'names', 'forms', 'changes'];

const CSS = `
* { box-sizing: border-box; }
body { margin: 0; padding: 12px 16px 24px; font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); background: var(--vscode-editor-background); }
h1 { font-size: 15px; margin: 0 0 2px; }
.sub { color: var(--vscode-descriptionForeground); font-size: 11px; min-height: 15px; margin-bottom: 8px; }
.pbar { flex: 1; min-width: 80px; max-width: 260px; height: 6px; border-radius: 3px; background: var(--vscode-input-background, rgba(128,128,128,0.25)); overflow: hidden; }
.pbar > div { height: 100%; width: 0; background: var(--vscode-progressBar-background, #0e70c0); transition: width 0.1s linear; }
.gfilter { flex: 1; min-width: 140px; max-width: 320px; padding: 3px 6px; font: inherit; font-size: 12px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; }
.gcount { color: var(--vscode-descriptionForeground); font-size: 11px; }
.bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
.tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.35)); margin-bottom: 10px; }
.tab { background: none; border: none; border-bottom: 2px solid transparent; color: var(--vscode-foreground); opacity: 0.75; padding: 5px 12px; cursor: pointer; font: inherit; }
.tab.on { opacity: 1; border-bottom-color: var(--vscode-focusBorder, #007fd4); font-weight: 600; }
.tab .n { margin-left: 5px; font-size: 10px; padding: 0 5px; border-radius: 8px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
button.b { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; padding: 4px 11px; cursor: pointer; font: inherit; }
button.b.sec { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
button.b:disabled { opacity: 0.5; cursor: default; }
input[type=text] { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; padding: 4px 8px; font: inherit; min-width: 220px; }
label.chk { display: inline-flex; gap: 4px; align-items: center; cursor: pointer; font-size: 12px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; margin: 4px 0 8px; }
.chip { font-size: 11px; padding: 1px 8px; border-radius: 10px; border: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.4)); background: none; color: var(--vscode-foreground); cursor: pointer; }
.chip:hover { background: var(--vscode-list-hoverBackground); }
.chip .c { opacity: 0.6; margin-left: 4px; }
.row { border: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.3)); border-radius: 4px; margin-bottom: 6px; }
.row .head { display: flex; gap: 8px; align-items: baseline; padding: 4px 8px; cursor: pointer; flex-wrap: wrap; }
.row .head:hover { background: var(--vscode-list-hoverBackground); }
.row .where { font-weight: 600; }
.row .loc { color: var(--vscode-descriptionForeground); font-size: 11px; margin-left: auto; }
.badge { font-size: 10px; text-transform: uppercase; padding: 0 6px; border-radius: 3px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
.badge.code { background: var(--vscode-charts-blue, #3794ff); color: #fff; }
.badge.rq { background: var(--vscode-charts-purple, #b180d7); color: #fff; }
.badge.warn { background: var(--vscode-charts-orange, #d18616); color: #fff; }
.badge.err { background: var(--vscode-charts-red, #f14c4c); color: #fff; }
.badge.add { background: var(--vscode-charts-green, #388a34); color: #fff; }
.badge.del { background: var(--vscode-charts-red, #f14c4c); color: #fff; }
.tag { font-size: 11px; color: var(--vscode-descriptionForeground); }
.tag.t { color: var(--vscode-symbolIcon-classForeground, #ee9d28); }
.tag.p { color: var(--vscode-symbolIcon-variableForeground, #75beff); }
pre.sql { margin: 0; padding: 4px 8px 6px; font-family: var(--vscode-editor-font-family); font-size: 12px; white-space: pre-wrap; max-height: 3.9em; overflow: hidden; cursor: pointer; border-top: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.2)); }
pre.sql.open { max-height: none; }
h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--vscode-descriptionForeground); margin: 14px 0 6px; }
.line { padding: 2px 8px; cursor: pointer; display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; border-radius: 3px; }
.line:hover { background: var(--vscode-list-hoverBackground); }
.line .loc { margin-left: auto; color: var(--vscode-descriptionForeground); font-size: 11px; }
.empty { color: var(--vscode-descriptionForeground); font-style: italic; padding: 8px 0; }
.arrow { color: var(--vscode-descriptionForeground); }
.old { text-decoration: line-through; opacity: 0.7; }
code { font-family: var(--vscode-editor-font-family); font-size: 12px; }
.note { font-size: 11px; color: var(--vscode-descriptionForeground); }
.hide { display: none; }
`;

const SCRIPT = `
(function () {
  var vscode = acquireVsCodeApi();
  var TABS = ['sql', 'dead', 'size', 'unused', 'checks', 'texts', 'names', 'forms', 'hotspots', 'changes'];
  var COMMON = ['sql', 'dead', 'size', 'hotspots'];
  var LABEL = { sql: 'SQL', dead: 'Dead code', size: 'Size', unused: 'Unused', checks: 'Form checks', texts: 'Texts', names: 'Names', forms: 'Forms', hotspots: 'Hotspots', changes: 'Changes' };
  var NL = String.fromCharCode(10);
  var saved = vscode.getState() || {};
  var state = { tab: saved.tab || 'sql', data: null, scanning: false, progress: null, filter: saved.filter || '', src: saved.src || { dfm: true, code: true, rq: true }, diff: null, hot: null, hotAsked: false, textFilter: '', ref: saved.ref || 'HEAD', layout: false, nested: false, limit: 200 };
  function save() { vscode.setState({ gfilter: state.gfilter, tab: state.tab, filter: state.filter, src: state.src, ref: state.ref }); }
  function $(id) { return document.getElementById(id); }
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text !== undefined) { e.textContent = text; } return e; }
  function open(file, line) { vscode.postMessage({ type: 'open', file: file, line: line || 0 }); }
  function base(p) { var s = String(p).split('/'); s = s[s.length - 1].split(String.fromCharCode(92)); return s[s.length - 1]; }

  /** The Delphi tabs need Delphi units: a .pas of the project (the scan lists them in metrics, not the other languages). */
  function delphiProject() { return !!state.data && state.data.units > 0; }

  function tabs() {
    var bar = $('tabs');
    bar.textContent = '';
    var d = state.data;
    var counts = d ? { sql: d.sql.length + (d.commonSql || []).length, dead: (d.deadCode || []).length, size: (d.common || []).length, unused: d.unusedUnits.length + d.unusedComponents.length + d.sqlIssues.length, checks: d.formChecks.length + d.gridIssues.length, texts: d.texts.length, names: d.naming.length, forms: d.families.length, changes: state.diff && state.diff.result ? state.diff.result.changes.length : 0 } : {};
    var shown = TABS.filter(function (t) { return COMMON.indexOf(t) >= 0 || delphiProject(); });
    shown.forEach(function (t) {
      var b = h('button', 'tab' + (t === state.tab ? ' on' : ''), LABEL[t]);
      if (counts[t]) { b.appendChild(h('span', 'n', String(counts[t]))); }
      b.addEventListener('click', function () { state.tab = t; save(); render(); });
      bar.appendChild(b);
    });
  }

  function status() {
    var d = state.data;
    var s = $('sub');
    $('pbar').hidden = !state.scanning; $('cancelScan').hidden = !state.scanning;
    if (state.scanning) {
      $('pfill').style.width = state.progress && state.progress.total ? Math.round(100 * state.progress.done / state.progress.total) + '%' : '3%';
      s.textContent = 'Scanning' + (state.progress ? ' ' + state.progress.done + ' / ' + state.progress.total + ' units' : '') + '...';
      return;
    }
    if (!d) { s.textContent = 'Nothing is read until you scan: the project is not slowed down.'; return; }
    s.textContent = d.units + ' units, ' + d.forms + ' forms, ' + d.sql.length + ' statements - ' + d.ms + ' ms (' + d.read + ' read, ' + d.cached + ' from memory)' + (d.truncated ? ' - too many files: only the first ones were read' : '');
  }

  function kindClass(s) { return s === 'dfm' ? 'badge' : s === 'rq' ? 'badge rq' : 'badge code'; }
  function kindLabel(s) { return s === 'dfm' ? 'form' : s === 'rq' ? 'query no.' : 'code'; }

  function renderSql(root) {
    var d = state.data;
    var bar = h('div', 'bar');
    var inp = h('input'); inp.type = 'text'; inp.id = 'filter'; inp.placeholder = 'table, column, parameter, text, unit, query number...'; inp.value = state.filter;
    inp.addEventListener('input', function () { state.filter = inp.value; state.limit = 200; save(); renderSqlList(); });
    bar.appendChild(inp);
    [['dfm', 'In forms'], ['code', 'In code'], ['rq', 'Numbered queries']].forEach(function (p) {
      var l = h('label', 'chk'); var c = h('input'); c.type = 'checkbox'; c.checked = !!state.src[p[0]];
      c.addEventListener('change', function () { state.src[p[0]] = c.checked; state.limit = 200; save(); renderSqlList(); });
      l.appendChild(c); l.appendChild(document.createTextNode(p[1])); bar.appendChild(l);
    });
    root.appendChild(bar);
    var counts = {};
    d.sql.concat(d.commonSql || []).forEach(function (e) { e.tables.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || (a < b ? -1 : 1); }).slice(0, 30);
    if (top.length) {
      var chips = h('div', 'chips');
      top.forEach(function (t) {
        var c = h('button', 'chip', t); c.appendChild(h('span', 'c', String(counts[t])));
        c.title = 'Statements that use ' + t;
        c.addEventListener('click', function () { state.filter = t; save(); render(); });
        chips.appendChild(c);
      });
      root.appendChild(chips);
    }
    root.appendChild(h('div', '')).id = 'sqlList';
    renderSqlList();
  }

  function renderSqlList() {
    var box = $('sqlList');
    if (!box) { return; }
    box.textContent = '';
    var words = state.filter.toLowerCase().split(' ').filter(Boolean);
    var all = state.data.sql.concat(state.data.commonSql || []);
    var rows = all.filter(function (e) {
      if (!state.src[e.source]) { return false; }
      if (!words.length) { return true; }
      var hay = (e.unit + ' ' + e.owner + ' ' + e.text + ' ' + e.tables.join(' ') + ' ' + e.params.join(' ') + ' ' + (e.rq || '')).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) >= 0; });
    });
    box.appendChild(h('div', 'note', rows.length + ' statement' + (rows.length === 1 ? '' : 's')));
    if (!rows.length) { box.appendChild(h('div', 'empty', all.length ? 'No statement matches.' : 'No SQL found in the project.')); return; }
    rows.slice(0, state.limit).forEach(function (e) {
      var row = h('div', 'row');
      var head = h('div', 'head');
      head.appendChild(h('span', kindClass(e.source), kindLabel(e.source)));
      if (e.source !== 'rq') { head.appendChild(h('span', 'tag', e.kind)); }
      head.appendChild(h('span', 'where', e.unit + (e.owner ? ' / ' + e.owner : '')));
      e.tables.forEach(function (t) { head.appendChild(h('span', 'tag t', t)); });
      e.params.forEach(function (p) { head.appendChild(h('span', 'tag p', ':' + p)); });
      if (e.dynamic) { head.appendChild(h('span', 'tag', 'built at run time')); }
      head.appendChild(h('span', 'loc', base(e.file) + ':' + (e.line + 1)));
      head.addEventListener('click', function () { open(e.file, e.line); });
      row.appendChild(head);
      if (e.source !== 'rq') {
        var pre = h('pre', 'sql', e.text);
        pre.title = 'Click to show it all';
        pre.addEventListener('click', function () { pre.classList.toggle('open'); });
        row.appendChild(pre);
      }
      box.appendChild(row);
    });
    if (rows.length > state.limit) {
      var more = h('button', 'b sec', 'Show ' + Math.min(200, rows.length - state.limit) + ' more');
      more.addEventListener('click', function () { state.limit += 200; renderSqlList(); });
      box.appendChild(more);
    }
  }

  function lineItem(parent, badge, badgeClass, text, loc, file, line) {
    var l = h('div', 'line');
    if (badge) { l.appendChild(h('span', badgeClass, badge)); }
    l.appendChild(h('span', '', text));
    if (loc) { l.appendChild(h('span', 'loc', loc)); }
    l.addEventListener('click', function () { open(file, line); });
    parent.appendChild(l);
  }

  function renderDead(root) {
    var d = state.data;
    root.appendChild(h('div', 'note', 'Methods and classes that nothing refers to, in every language of the project. Advice: a method called by a name built at run time, or by a framework, looks unused. Check before removing.'));
    if (!d.deadCode.length) { root.appendChild(h('div', 'empty', 'Nothing unused.')); return; }
    var byLang = {}; var order = [];
    d.deadCode.forEach(function (x) { var k = x.language || 'Other'; if (!byLang[k]) { byLang[k] = []; order.push(k); } byLang[k].push(x); });
    order.forEach(function (lang) {
      root.appendChild(h('h2', '', lang + ' (' + byLang[lang].length + ')'));
      byLang[lang].forEach(function (x) {
        var text = (x.kind === 'class' ? 'class ' : x.kind === 'import' ? 'import ' : '') + (x.className ? x.className + '.' : '') + x.name;
        lineItem(root, x.kind, 'badge', text, base(x.file) + ':' + (x.line + 1), x.file, x.line);
      });
    });
  }

  function renderSize(root) {
    var d = state.data;
    root.appendChild(h('div', 'note', 'Size of the source files that are not Delphi: lines of code, routines, and the longest routine (a routine of more than 60 lines is counted as long).'));
    var rows = (d.common || []).slice().sort(function (a, b) { return b.metrics.lines - a.metrics.lines; });
    if (!rows.length) { root.appendChild(h('div', 'empty', 'No source file of another language in the project.')); return; }
    rows.slice(0, 300).forEach(function (u) {
      var l = h('div', 'line');
      l.appendChild(h('span', 'badge', u.language));
      l.appendChild(h('span', 'where', u.name));
      l.appendChild(h('span', 'tag', u.metrics.lines + ' lines'));
      l.appendChild(h('span', 'tag', u.metrics.routines + ' routines'));
      l.appendChild(h('span', 'tag', u.metrics.long + ' long, the longest ' + u.metrics.longest + ' lines'));
      l.addEventListener('click', function () { open(u.path, 0); });
      root.appendChild(l);
    });
    if (rows.length > 300) { root.appendChild(h('div', 'note', 'The 300 largest of ' + rows.length + ' files are shown.')); }
  }

  function renderUnused(root) {
    var d = state.data;
    root.appendChild(h('h2', '', 'Units of the project listed in a uses clause that nothing uses (' + d.unusedUnits.length + ')'));
    if (!d.unusedUnits.length) { root.appendChild(h('div', 'empty', 'None.')); }
    d.unusedUnits.forEach(function (u) {
      lineItem(root, u.sideEffects ? 'check' : 'unused', u.sideEffects ? 'badge warn' : 'badge', u.unit + ' uses ' + u.used + ' (' + u.section + ')' + (u.sideEffects ? ' - it has an initialization section, it may work by being linked' : ''), base(u.path) + ':' + (u.line + 1), u.path, u.line);
    });
    root.appendChild(h('h2', '', 'Non-visual components that neither the code nor the form refers to (' + d.unusedComponents.length + ')'));
    if (!d.unusedComponents.length) { root.appendChild(h('div', 'empty', 'None.')); }
    d.unusedComponents.forEach(function (c) {
      lineItem(root, '', '', c.unit + ' / ' + c.component + ': ' + c.className + (c.holds ? ' (with ' + c.holds + ' part' + (c.holds === 1 ? '' : 's') + ')' : ''), base(c.path) + ':' + (c.line + 1), c.path, c.line);
    });
    root.appendChild(h('h2', '', 'SQL parameters (' + d.sqlIssues.length + ')'));
    if (!d.sqlIssues.length) { root.appendChild(h('div', 'empty', 'None.')); }
    d.sqlIssues.forEach(function (i) {
      lineItem(root, i.severity === 'warning' ? 'warning' : 'info', i.severity === 'warning' ? 'badge warn' : 'badge', i.unit + ': ' + i.message, base(i.path) + ':' + (i.line + 1), i.path, i.line);
    });
    root.appendChild(h('div', 'note', 'These are hints: a unit can do its work by being linked, a component can be reached by name at run time. Check before removing.'));
  }

  function renderGrid(root) {
    var d = state.data;
    if (!d.gridIssues.length) { return; }
    root.appendChild(h('h2', '', 'Grid columns that show a field their query does not return (' + d.gridIssues.length + ')'));
    d.gridIssues.forEach(function (g) { lineItem(root, 'check', 'badge warn', g.unit + ': ' + g.message, base(g.path) + ':' + (g.line + 1), g.path, g.line); });
  }

  function renderChecks(root) {
    var d = state.data;
    renderGrid(root);
    if (!d.formChecks.length) { root.appendChild(h('div', 'empty', d.forms ? 'All ' + d.forms + ' forms agree with their units.' : 'No form (.dfm next to a .pas) in the project.')); return; }
    d.formChecks.forEach(function (f) {
      root.appendChild(h('h2', '', f.unit + ' (' + f.issues.length + ')'));
      f.issues.forEach(function (i) {
        var file = i.file === 'dfm' ? f.file.slice(0, -4) + '.dfm' : f.file;
        lineItem(root, i.severity, i.severity === 'error' ? 'badge err' : 'badge warn', i.message, base(file) + ':' + (i.line + 1), file, i.line);
      });
    });
  }

  function renderTexts(root) {
    var d = state.data;
    var bar = h('div', 'bar');
    var inp = h('input'); inp.type = 'text'; inp.placeholder = 'filter the texts...'; inp.value = state.textFilter;
    inp.addEventListener('input', function () { state.textFilter = inp.value; renderTextList(); });
    var ex = h('button', 'b sec', 'Export to CSV');
    ex.addEventListener('click', function () { vscode.postMessage({ type: 'exportTexts' }); });
    bar.appendChild(inp); bar.appendChild(ex);
    root.appendChild(bar);
    root.appendChild(h('div', 'note', d.textCount + ' texts in the forms (captions, hints, titles), ' + d.texts.length + ' different. The ones written in several ways come first: case, accent, & or a colon change nothing to the meaning.'));
    var box = h('div', ''); box.id = 'textList'; root.appendChild(box);
    renderTextList();
  }

  function renderTextList() {
    var box = $('textList');
    if (!box) { return; }
    box.textContent = '';
    var f = state.textFilter.toLowerCase();
    var rows = state.data.texts.filter(function (g) { return !f || g.variants.some(function (v) { return v.text.toLowerCase().indexOf(f) >= 0; }); });
    rows.slice(0, 200).forEach(function (g) {
      var row = h('div', 'row');
      var head = h('div', 'head');
      head.appendChild(h('span', g.variants.length > 1 ? 'badge warn' : 'badge', g.variants.length > 1 ? g.variants.length + ' ways' : 'one way'));
      g.variants.forEach(function (v) { head.appendChild(h('span', 'where', v.text + (v.count > 1 ? ' x' + v.count : ''))); });
      head.addEventListener('click', function () { var r = g.rows[0]; open(pathOfUnit(r.unit, true), r.line); });
      row.appendChild(head);
      g.rows.slice(0, 6).forEach(function (r) {
        var l = h('div', 'line');
        l.appendChild(h('span', 'tag', r.unit + ' / ' + r.component + ' (' + r.prop + ')'));
        l.appendChild(h('span', 'loc', r.text));
        l.addEventListener('click', function () { open(pathOfUnit(r.unit, true), r.line); });
        row.appendChild(l);
      });
      box.appendChild(row);
    });
    if (rows.length > 200) { box.appendChild(h('div', 'note', 'The first 200 of ' + rows.length + ' are shown: filter to narrow them down.')); }
    if (!rows.length) { box.appendChild(h('div', 'empty', 'No text matches.')); }
  }

  function pathOfUnit(unit, dfm) {
    var m = state.data.metrics.filter(function (u) { return u.unit === unit; })[0];
    if (!m) { return ''; }
    return dfm ? m.path.slice(0, -4) + '.dfm' : m.path;
  }

  function renderNames(root) {
    var d = state.data;
    if (!d.naming.length) { root.appendChild(h('div', 'empty', 'Every component is named the way the project names that kind of component.')); return; }
    root.appendChild(h('div', 'note', 'The convention is what most components of each class already do (at least 60 percent of three or more): it is not imposed. A rename changes the .dfm and the unit together and leaves them modified: undo is there.'));
    var byUnit = {}; var order = [];
    d.naming.forEach(function (n) { if (!byUnit[n.unit]) { byUnit[n.unit] = []; order.push(n.unit); } byUnit[n.unit].push(n); });
    order.forEach(function (unit) {
      var items = byUnit[unit];
      var head = h('h2', '', unit + ' (' + items.length + ')');
      var all = h('button', 'b sec', 'Rename all');
      all.addEventListener('click', function () { vscode.postMessage({ type: 'renameAll', file: items[0].path, items: items.map(function (n) { return { from: n.component, to: n.suggestion }; }) }); });
      head.appendChild(document.createTextNode(' ')); head.appendChild(all);
      root.appendChild(head);
      items.forEach(function (n) {
        var l = h('div', 'line');
        l.appendChild(h('span', n.isDefault ? 'badge' : 'badge warn', n.isDefault ? 'IDE name' : 'prefix'));
        l.appendChild(h('span', '', n.component + ' : ' + n.className));
        l.appendChild(h('span', 'arrow', '->'));
        l.appendChild(h('span', 'where', n.suggestion));
        var b = h('button', 'b sec', 'Rename');
        b.addEventListener('click', function (ev) { ev.stopPropagation(); vscode.postMessage({ type: 'rename', file: n.path, from: n.component, to: n.suggestion }); });
        l.appendChild(b);
        l.appendChild(h('span', 'loc', base(n.path) + ':' + (n.line + 1)));
        l.title = n.message;
        l.addEventListener('click', function () { open(n.path, n.line); });
        root.appendChild(l);
      });
    });
  }

  function renderForms(root) {
    var d = state.data;
    if (!d.families.length) { root.appendChild(h('div', 'empty', 'No form (.dfm next to a .pas) in the project.')); return; }
    root.appendChild(h('div', 'note', 'Forms by the class they descend from. A form that is a visual descendant (its .dfm writes inherited) shows how many components it takes from the ancestor and how many are its own.'));
    d.families.forEach(function (f) {
      root.appendChild(h('h2', '', f.ancestor + (f.ancestorUnit ? ' (' + f.ancestorUnit + ')' : '') + ' - ' + f.forms.length + ' form' + (f.forms.length === 1 ? '' : 's')));
      f.forms.forEach(function (x) {
        var l = h('div', 'line');
        l.appendChild(h('span', x.visual ? 'badge' : 'tag', x.visual ? 'inherited' : 'own'));
        l.appendChild(h('span', 'where', x.unit));
        l.appendChild(h('span', 'tag', x.className));
        l.appendChild(h('span', 'tag', x.visual ? x.inherited + ' from the ancestor, ' + x.own + ' its own' : x.own + ' components'));
        var path = pathOfUnit(x.unit, false);
        l.addEventListener('click', function () { open(path, 0); });
        root.appendChild(l);
      });
    });
  }

  function renderHotspots(root) {
    root.appendChild(h('div', 'note', 'Units that are often changed and hard to change: commits over the last year, weighted by size and by long routines. The first places to tidy.'));
    var s = state.hot;
    if (!s) { root.appendChild(h('div', 'empty', 'Asking git...')); return; }
    if (s.error) { root.appendChild(h('div', 'empty', s.error)); return; }
    if (!s.rows.length) { root.appendChild(h('div', 'empty', 'No unit of the project was changed in the last year.')); return; }
    s.rows.forEach(function (r) {
      var l = h('div', 'line');
      l.appendChild(h('span', 'badge warn', String(r.score)));
      l.appendChild(h('span', 'where', r.unit));
      l.appendChild(h('span', 'tag', r.commits + ' commits'));
      l.appendChild(h('span', 'tag', r.metrics.lines + ' lines'));
      l.appendChild(h('span', 'tag', r.metrics.long + ' long routines, the longest ' + r.metrics.longest + ' lines'));
      l.addEventListener('click', function () { open(r.path, 0); });
      root.appendChild(l);
    });
  }

  var KIND = { added: ['added', 'badge add'], removed: ['removed', 'badge del'], moved: ['moved', 'badge'], 'class': ['class', 'badge warn'], prop: ['property', 'badge'], event: ['event', 'badge'] };

  function renderChanges(root) {
    var bar = h('div', 'bar');
    var ref = h('input'); ref.type = 'text'; ref.value = state.ref; ref.placeholder = 'HEAD, a branch, a commit...';
    ref.addEventListener('input', function () { state.ref = ref.value; save(); });
    var go = h('button', 'b', 'Compare the open form with this version');
    go.addEventListener('click', function () { state.ref = ref.value || 'HEAD'; save(); vscode.postMessage({ type: 'diff', ref: state.ref }); });
    bar.appendChild(h('span', 'note', 'Against')); bar.appendChild(ref); bar.appendChild(go);
    root.appendChild(bar);
    var f = state.diff;
    if (!f) { root.appendChild(h('div', 'empty', 'Open a form (.dfm or its .pas) and compare it with the last commit, a branch or any version: the components and properties that changed, whatever the order or the indentation.')); return; }
    if (f.error) { root.appendChild(h('div', 'empty', f.error)); return; }
    var r = f.result;
    root.appendChild(h('div', 'note', base(f.file) + ' now, against ' + f.ref + ': ' + r.counts.added + ' added, ' + r.counts.removed + ' removed, ' + r.counts.moved + ' moved, ' + r.counts.prop + ' properties, ' + r.counts.event + ' events, ' + r.counts['class'] + ' classes'));
    var opts = h('div', 'bar');
    [['layout', 'Show position and size (' + r.layout + ')'], ['nested', 'Show components added or removed with their parent']].forEach(function (p) {
      var l = h('label', 'chk'); var c = h('input'); c.type = 'checkbox'; c.checked = !!state[p[0]];
      c.addEventListener('change', function () { state[p[0]] = c.checked; render(); });
      l.appendChild(c); l.appendChild(document.createTextNode(p[1])); opts.appendChild(l);
    });
    root.appendChild(opts);
    var shown = r.changes.filter(function (c) { return (state.layout || !c.layout) && (state.nested || !c.nested); });
    if (!shown.length) { root.appendChild(h('div', 'empty', r.changes.length ? 'Only position and size changed.' : 'The two versions are the same form.')); return; }
    var byComp = {};
    var order = [];
    shown.forEach(function (c) { if (!byComp[c.component]) { byComp[c.component] = []; order.push(c.component); } byComp[c.component].push(c); });
    order.forEach(function (name) {
      var box = h('div', 'row');
      var first = byComp[name][0];
      var head = h('div', 'head');
      head.appendChild(h('span', 'where', name));
      head.appendChild(h('span', 'tag', first.className));
      if (first.side === 'new') { head.addEventListener('click', function () { open(f.file, first.line); }); }
      box.appendChild(head);
      byComp[name].forEach(function (c) {
        var k = KIND[c.kind];
        var l = h('div', 'line');
        l.appendChild(h('span', k[1], k[0]));
        if (c.kind === 'added') { l.appendChild(h('span', '', 'in ' + (c.to || 'the form'))); }
        else if (c.kind === 'removed') { l.appendChild(h('span', '', 'from ' + (c.from || 'the form'))); }
        else if (c.kind === 'moved') { l.appendChild(h('span', '', c.from + ' '));  l.appendChild(h('span', 'arrow', '->')); l.appendChild(h('span', '', ' ' + c.to)); }
        else if (c.kind === 'class') { l.appendChild(h('span', 'old', c.from)); l.appendChild(h('span', 'arrow', '->')); l.appendChild(h('span', '', c.to)); }
        else {
          l.appendChild(h('code', '', c.prop));
          l.appendChild(h('span', 'old', c.from === undefined ? '(none)' : c.from.split(NL).join(' ')));
          l.appendChild(h('span', 'arrow', '->'));
          l.appendChild(h('span', '', c.to === undefined ? '(removed)' : c.to.split(NL).join(' ')));
        }
        if (c.side === 'new') { l.addEventListener('click', function () { open(f.file, c.line); }); }
        box.appendChild(l);
      });
      root.appendChild(box);
    });
  }

  function render() {
    tabs();
    status();
    var root = $('content');
    root.textContent = '';
    $('scan').disabled = state.scanning;
    $('scan').textContent = state.data ? 'Scan again' : 'Scan the project';
    if (state.tab === 'changes') { renderChanges(root); return; }
    if (!state.data) { root.appendChild(h('div', 'empty', state.scanning ? 'Reading the units...' : 'Press "Scan the project" to read the source files of every language. It is done in small steps, can be cancelled, and the next scan only reads what changed.')); return; }
    $('gfilter').hidden = !state.data || state.tab === 'sql' || state.tab === 'texts' || state.tab === 'changes';
    $('gcount').hidden = $('gfilter').hidden;
    if (state.tab === 'hotspots' && !state.hotAsked) { state.hotAsked = true; vscode.postMessage({ type: 'churn' }); }
    if (state.tab === 'sql') { renderSql(root); }
    else if (state.tab === 'dead') { renderDead(root); }
    else if (state.tab === 'size') { renderSize(root); }
    else if (state.tab === 'unused') { renderUnused(root); }
    else if (state.tab === 'texts') { renderTexts(root); }
    else if (state.tab === 'names') { renderNames(root); }
    else if (state.tab === 'forms') { renderForms(root); }
    else if (state.tab === 'hotspots') { renderHotspots(root); }
    else { renderChecks(root); }
    applyGenericFilter();
  }

  /* One search box for the tabs that have none of their own: the rows that do not contain the words are hidden, and the headings
     (a language, a unit) left with no row under them. */
  function applyGenericFilter() {
    var box = $('gfilter');
    var words = (box.value || '').toLowerCase().split(' ').filter(Boolean);
    var rows = $('content').querySelectorAll('.line');
    var shown = 0;
    rows.forEach(function (r) {
      var text = r.textContent.toLowerCase();
      var hit = words.every(function (w) { return text.indexOf(w) >= 0; });
      r.hidden = !hit;
      if (hit) { shown++; }
    });
    $('content').querySelectorAll('h2').forEach(function (hd) {
      var n = hd.nextElementSibling, live = false;
      while (n && n.tagName !== 'H2') { if (n.classList && n.classList.contains('line') && !n.hidden) { live = true; } n = n.nextElementSibling; }
      hd.hidden = words.length > 0 && !live;
    });
    $('gcount').textContent = words.length ? shown + ' of ' + rows.length : rows.length ? rows.length + ' rows' : '';
  }

  $('scan').addEventListener('click', function () { vscode.postMessage({ type: 'scan' }); });
  $('cancelScan').addEventListener('click', function () { vscode.postMessage({ type: 'cancelScan' }); });
  $('gfilter').value = saved.gfilter || '';
  $('gfilter').addEventListener('input', function () { state.gfilter = $('gfilter').value; save(); applyGenericFilter(); });
  $('gfilter').addEventListener('keydown', function (e) { if (e.key === 'Escape') { $('gfilter').value = ''; state.gfilter = ''; save(); applyGenericFilter(); } });
  window.addEventListener('message', function (ev) {
    var m = ev.data;
    if (m.type === 'data') { state.data = m.data; state.scanning = false; state.progress = null; render(); }
    else if (m.type === 'scanning') { state.scanning = m.on; state.progress = m.progress || null; if (m.on && !m.progress) { render(); } else { status(); } }
    else if (m.type === 'diff') { state.diff = m; state.layout = false; state.nested = false; state.tab = 'changes'; render(); }
    else if (m.type === 'hotspots') { state.hot = m; render(); }
    else if (m.type === 'renamed') {
      var gone = {}; m.done.forEach(function (x) { gone[x.from] = true; });
      state.data.naming = state.data.naming.filter(function (n) { return !(n.path === m.file && gone[n.component]); });
      if (m.error) { $('sub').textContent = 'Rename stopped: ' + m.error; } render();
    }
    else if (m.type === 'tab') { state.tab = m.tab; save(); render(); }
  });
  render();
  vscode.postMessage({ type: 'ready' });
})();
`;

export function projectHtml(nonce: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<title>CE Project</title>
<style nonce="${nonce}">${CSS}</style>
</head>
<body>
<h1>Project</h1>
<div class="sub" id="sub"></div>
<div class="bar"><button class="b" id="scan">Scan the project</button><button class="b" id="cancelScan" hidden title="Stop reading the files">Cancel</button><div class="pbar" id="pbar" hidden><div id="pfill"></div></div><input class="gfilter" id="gfilter" type="text" placeholder="Filter this list…" spellcheck="false" hidden><span class="gcount" id="gcount" hidden></span></div>
<div class="tabs" id="tabs"></div>
<div id="content"></div>
<script nonce="${nonce}">${SCRIPT}</script>
</body>
</html>`;
}
