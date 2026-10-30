/**
 * The Dead Code report: what the compiler or linter of the language says is unused in the file (grouped, with the rule it would give), then
 * what nothing in the workspace refers to. Each row carries its index in the list, which the page sends back to go to the line. Pure.
 */
import type { DeadCodeItem } from '../services/DeadCodeDetector';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const GROUPS: { kind: DeadCodeItem['kind']; title: string; hint: string }[] = [
    { kind: 'import', title: 'Unused imports', hint: 'Remove the line (or the name in it)' },
    { kind: 'local', title: 'Local variables never read', hint: 'Remove the variable, or use it' },
    { kind: 'private', title: 'Private members nobody uses', hint: 'Only this class could use them, and it does not' },
    { kind: 'function', title: 'Routines of this file that nothing calls', hint: 'Not exported, not called in the file' },
    { kind: 'unreachable', title: 'Unreachable code', hint: 'It follows a return / throw / Exit' },
];

const WORKSPACE_KINDS = new Set<DeadCodeItem['kind']>(['method', 'class']);

export function deadCodeHtml(items: DeadCodeItem[], fileName: string): string {
    const file = items.map((d, i) => ({ d, i })).filter(x => !WORKSPACE_KINDS.has(x.d.kind));
    const ws = items.map((d, i) => ({ d, i })).filter(x => WORKSPACE_KINDS.has(x.d.kind));
    const short = (p: string): string => p.split(/[\\/]/).pop() ?? p;
    const tools = [...new Set(file.map(x => x.d.tool).filter((t): t is string => !!t))];
    let html = `<p class="muted">Read from the text of ${esc(short(fileName))}, as ${tools.length ? esc(tools.join(', ')) : 'the compiler or the linter of its language'} would report it. A good guide, not a proof: a name used only by reflection, by a generator or by another file is not seen.</p>`;
    if (!file.length) {
        html += '<p class="muted">Nothing unused in this file ✓</p>';
    }
    for (const g of GROUPS) {
        const rows = file.filter(x => x.d.kind === g.kind);
        if (!rows.length) { continue; }
        html += `<h3 class="dch">${esc(g.title)} (${rows.length})</h3><p class="muted">${esc(g.hint)}</p>`
            + '<table class="tbl"><thead><tr><th>Name</th><th>Rule</th><th>Line</th></tr></thead><tbody>'
            + rows.map(({ d, i }) => `<tr data-idx="${i}" tabindex="0" title="${esc((d.tool ?? '') + (d.message ? ' - ' + d.message : ''))}"><td>${esc(d.name)}</td><td class="muted">${esc(d.rule ?? '')}</td><td>${d.line + 1}</td></tr>`).join('')
            + '</tbody></table>';
    }
    html += `<h3 class="dch">Never referenced in the workspace (${ws.length})</h3>`;
    html += ws.length
        ? '<p class="muted">Public methods and classes whose name appears nowhere else. Check before removing: a name can be reached by reflection or from outside the project.</p>'
            + '<table class="tbl"><thead><tr><th>Kind</th><th>Name</th><th>File</th><th>Line</th></tr></thead><tbody>'
            + ws.map(({ d, i }) => `<tr data-idx="${i}" tabindex="0" title="Go to ${esc(short(d.file))}:${d.line + 1}"><td>${esc(d.kind)}</td><td>${esc(d.className ? d.className + '.' + d.name : d.name)}</td><td class="muted">${esc(short(d.file))}</td><td>${d.line + 1}</td></tr>`).join('')
            + '</tbody></table>'
        : '<p class="muted">Nothing ✓</p>';
    return html;
}
