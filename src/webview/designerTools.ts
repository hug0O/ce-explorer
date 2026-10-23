/**
 * The designer's 🛠 Tools menu: what the sidebar's Delphi "layout & checks" page used to offer, now on the form being edited.
 * Anchors / docking of the selection, duplicate, check the form (and its safe fixes), clean the handlers, change the class of a
 * component, generate a form from fields or from a class. The actions that need a choice (a class, a list of problems) are run by the
 * extension with VS Code's own pickers, on the unit of this designer.
 * Plain JavaScript in a string, without template literal or backslash.
 */
import { viewCss } from './designerView';

export function toolsButton(): string {
    return `<span class="viewgrp"><button id="toolsbtn" title="Anchors, duplicate, check the form, clean handlers, change class, generate a form">🛠 Tools ▾</button><div id="toolsmenu" hidden></div></span>`;
}

/** The View menu's rules, for the Tools menu too. */
export function toolsCss(): string {
    return viewCss().split('\n').filter(l => l.startsWith('#viewmenu')).map(l => l.split('#viewmenu').join('#toolsmenu')).join('\n') + `
#toolsmenu .vrow.off { opacity: 0.45; cursor: default; }
#toolsmenu .vrow.off:hover { background: transparent; }
`;
}

export function toolsScript(): string {
    return `
/* ───────── Tools menu: anchors, duplicate, check, clean, change class, generate ───────── */
function duplicateSelection() {
  if (!state.sel.length) { state.notice = 'Select the components to duplicate first.'; renderStatus(); return; }
  post({ type: 'duplicate', names: state.sel.slice() });
}
function buildToolsMenu() {
  var m = $('toolsmenu');
  m.textContent = '';
  var has = state.sel.length > 0;
  function sec(t) { m.appendChild(el('div', 'vsec', t)); }
  function row(label, title, run, key, enabled) {
    var r = el('div', 'vrow' + (enabled === false ? ' off' : '')); r.title = title || '';
    r.appendChild(document.createTextNode(label));
    if (key) { r.appendChild(el('span', 'vk', key)); }
    r.addEventListener('click', function () { if (enabled === false) { return; } m.hidden = true; run(); });
    m.appendChild(r);
  }
  sec('Arrange the selection');
  (state.anchorModes || []).forEach(function (a) {
    row(a.label, a.description + (has ? '' : ' (select components first)'), function () { post({ type: 'anchors', mode: a.id, names: state.sel.slice() }); }, '', has);
  });
  m.appendChild(el('div', 'vsep'));
  sec('Edit');
  row('Duplicate', 'A copy next to the original, with its handlers and fields (the clipboard is not used)', duplicateSelection, 'Ctrl+D', has);
  row('Change class...', 'TEdit to TcxTextEdit...: keeps the properties the new class has, says which it drops', function () { post({ type: 'runTool', id: 'changeClass' }); });
  m.appendChild(el('div', 'vsep'));
  sec('Check');
  row('Check the form...', '.dfm against the unit: missing handlers, orphan fields, TabOrder, layout; the safe fixes can be applied in one go', function () { post({ type: 'runTool', id: 'check' }); });
  row('Clean the handlers...', 'Missing, orphan and empty event handlers', function () { post({ type: 'runTool', id: 'clean' }); });
  m.appendChild(el('div', 'vsep'));
  sec('Generate');
  row('Form from fields...', 'A label and an input per field you type, aligned', function () { post({ type: 'runTool', id: 'formFromFields' }); });
  row('Form from a class...', 'The fields of a class of the unit', function () { post({ type: 'runTool', id: 'formFromClass' }); });
}
function toolsInit() {
  $('toolsbtn').addEventListener('click', function () { var m = $('toolsmenu'); if (m.hidden) { buildToolsMenu(); } m.hidden = !m.hidden; });
  document.addEventListener('mousedown', function (ev) {
    var m = $('toolsmenu');
    if (!m.hidden && !m.contains(ev.target) && ev.target !== $('toolsbtn')) { m.hidden = true; }
  });
  document.addEventListener('keydown', function (ev) {
    if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && !ev.altKey && ev.key && ev.key.toLowerCase() === 'd') {
      var t = ev.target && ev.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') { return; }
      ev.preventDefault(); duplicateSelection();
    }
  });
}
`;
}
