/**
 * The designer against another version of the form: components added (green), changed (blue), moved or resized (orange)
 * and removed ones drawn as dashed ghosts where they used to be. It is started from the View menu, shows a thin bar while
 * it is on, and goes away with the bar's Close button, so nothing is added to the toolbar.
 * The script is plain JavaScript in a string, without template literal or backslash.
 */

export function compareCss(): string {
    return `
.ctl.cmp-added { outline: 2px solid #2f9e44; outline-offset: 1px; box-shadow: 0 0 0 4px rgba(47, 158, 68, 0.25); }
.ctl.cmp-class { outline: 2px solid #ae3ec9; outline-offset: 1px; }
.ctl.cmp-changed { outline: 2px solid #1c7ed6; outline-offset: 1px; box-shadow: 0 0 0 4px rgba(28, 126, 214, 0.2); }
.ctl.cmp-moved { outline: 2px solid #f08c00; outline-offset: 1px; box-shadow: 0 0 0 4px rgba(240, 140, 0, 0.2); }
.ghost { position: absolute; border: 2px dashed #e03131; background: rgba(224, 49, 49, 0.08); pointer-events: none; z-index: 14; box-sizing: border-box; }
.ghost span { position: absolute; left: 2px; top: 2px; font: 600 9px/11px 'Segoe UI', sans-serif; color: #e03131; background: rgba(255,255,255,0.8); padding: 0 3px; border-radius: 2px; white-space: nowrap; }
#cmpbar { position: fixed; top: 44px; left: 50%; transform: translateX(-50%); z-index: 64; display: flex; align-items: center; gap: 10px; padding: 4px 10px; background: var(--vscode-editorWidget-background, #252526); border: 1px solid var(--vscode-focusBorder, #007fd4); border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.45); font-size: 11px; }
#cmpbar .chip { display: inline-flex; align-items: center; gap: 4px; }
#cmpbar .dot { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
#cmpbar button { padding: 1px 8px; }
`;
}

export function compareScript(): string {
    return `
/* ───────── compare with another version of the form ───────── */
var cmp = null;
function clearCompare() {
  document.querySelectorAll('.cmp-added, .cmp-class, .cmp-changed, .cmp-moved').forEach(function (e) {
    ['cmp-added', 'cmp-class', 'cmp-changed', 'cmp-moved'].forEach(function (k) { e.classList.remove(k); });
    if (e.getAttribute('data-title0') !== null) { e.title = e.getAttribute('data-title0'); e.removeAttribute('data-title0'); }
  });
  document.querySelectorAll('.ghost').forEach(function (g) { g.parentNode.removeChild(g); });
}
function paintCompare() {
  clearCompare();
  var bar = $('cmpbar');
  if (!cmp) { if (bar) { bar.parentNode.removeChild(bar); } return; }
  var n = { added: 0, removed: 0, moved: 0, changed: 0 };
  (cmp.items || []).forEach(function (it) {
    var e = els[it.name];
    var kind = it.kinds.indexOf('added') >= 0 ? 'added' : it.kinds.indexOf('class') >= 0 ? 'class' : it.layoutOnly || it.kinds.indexOf('moved') >= 0 ? 'moved' : 'changed';
    if (it.kinds.indexOf('removed') >= 0) { n.removed++; return; }
    if (kind === 'added') { n.added++; } else if (kind === 'moved') { n.moved++; } else { n.changed++; }
    if (!e) { return; }
    e.classList.add('cmp-' + kind);
    e.setAttribute('data-title0', e.title);
    e.title = e.title + String.fromCharCode(10) + '— since ' + cmp.ref + ':' + String.fromCharCode(10) + it.details.join(String.fromCharCode(10));
  });
  var client = $('client');
  (cmp.ghosts || []).forEach(function (g) {
    var d = el('div', 'ghost'); d.style.left = g.x + 'px'; d.style.top = g.y + 'px'; d.style.width = g.w + 'px'; d.style.height = g.h + 'px';
    d.appendChild(el('span', '', g.name + ' (removed)')); d.title = g.name + ' : ' + g.cls + ' was here in ' + cmp.ref;
    client.appendChild(d);
  });
  n.removed = (cmp.items || []).filter(function (i) { return i.kinds.indexOf('removed') >= 0; }).length;
  if (!bar) { bar = el('div'); bar.id = 'cmpbar'; document.body.appendChild(bar); }
  bar.textContent = '';
  bar.appendChild(el('span', '', 'Compared with ' + cmp.ref + ':'));
  [['added', '#2f9e44'], ['changed', '#1c7ed6'], ['moved', '#f08c00'], ['removed', '#e03131']].forEach(function (p) {
    var c = el('span', 'chip'); var dot = el('span', 'dot'); dot.style.background = p[1]; c.appendChild(dot); c.appendChild(document.createTextNode(n[p[0]] + ' ' + p[0])); bar.appendChild(c);
  });
  if (!(cmp.items || []).length) { bar.appendChild(el('span', '', 'no difference')); }
  var x = el('button', '', 'Close'); x.addEventListener('click', function () { cmp = null; paintCompare(); post({ type: 'compareClose' }); }); bar.appendChild(x);
}
function compareInit() {
  addViewAction('Compare with a git version...', 'What changed in this form since a commit, a branch or HEAD: added, changed, moved and removed components, drawn on the form', function () { post({ type: 'compareAsk' }); });
  window.addEventListener('message', function (ev) {
    if (ev.data && ev.data.type === 'compare') { cmp = ev.data; paintCompare(); }
  });
}
`;
}
