/**
 * The page of the usage ranking: the most used features with a bar, the little used ones, the ones never used. Pure: the ranking in, markup out.
 */
import type { Ranking, Row } from '../utils/usageStats';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `
body { font-family: var(--vscode-font-family, sans-serif); font-size: 13px; color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 12px 18px 30px; max-width: 980px; }
h1 { font-size: 18px; margin: 0 0 4px; }
h2 { font-size: 14px; margin: 20px 0 6px; }
p.note, .sub { color: var(--vscode-descriptionForeground); margin: 2px 0 8px; font-size: 12px; }
.bar { display: flex; gap: 6px; margin: 10px 0; }
button { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 3px; padding: 4px 10px; cursor: pointer; font-size: 12px; font-family: inherit; }
button:hover { background: var(--vscode-button-secondaryHoverBackground); }
.warn { padding: 6px 10px; border-left: 3px solid #d19a66; background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.1)); margin: 8px 0; }
table { border-collapse: collapse; width: 100%; }
th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--vscode-descriptionForeground); padding: 3px 6px; border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.3)); }
td { padding: 3px 6px; border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.12)); vertical-align: middle; }
td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
td.rk { width: 28px; color: var(--vscode-descriptionForeground); text-align: right; }
progress.meter { width: 100%; height: 8px; appearance: none; border: none; background: transparent; }
progress.meter::-webkit-progress-bar { background: var(--vscode-panel-border, rgba(128,128,128,0.2)); border-radius: 4px; }
progress.meter::-webkit-progress-value { background: var(--vscode-progressBar-background, #0e70c0); border-radius: 4px; }
.cell { width: 160px; }
.grp { display: inline-block; font-size: 10px; padding: 0 6px; border-radius: 8px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
ul.never { columns: 2; column-gap: 24px; margin: 4px 0 0; padding-left: 18px; }
ul.never li { margin: 1px 0; break-inside: avoid; }
details > summary { cursor: pointer; margin: 4px 0; }
.empty { color: var(--vscode-descriptionForeground); font-style: italic; }
`;

function ago(r: Row): string { return r.ago === 0 ? 'today' : r.ago === 1 ? 'yesterday' : r.ago + ' days ago'; }

export function usageBody(r: Ranking, topN = 25): string {
    const max = Math.max(1, ...r.top.map(x => x.n));
    let html = `<h1>Feature usage</h1><p class="sub">Counted on this machine only, nothing is sent anywhere: ${r.total} use${r.total === 1 ? '' : 's'} over ${r.observed} day${r.observed === 1 ? '' : 's'}.</p>`;
    html += `<div class="bar"><button id="refresh">↻ Refresh</button><button id="copy" title="The ranking as Markdown, to paste in a note">📋 Copy as Markdown</button><button id="reset" title="Start counting again from zero">Reset</button></div>`;
    if (r.young) { html += `<div class="warn">The counting is young (${r.observed} day${r.observed === 1 ? '' : 's'}): a feature not used yet may simply not have been needed yet. Judge the unused ones after about two weeks.</div>`; }
    html += `<h2>Most used</h2>`;
    html += r.top.length
        ? `<table><thead><tr><th></th><th>Feature</th><th></th><th class="n">Uses</th><th class="n">Last 30 days</th><th>Last used</th></tr></thead><tbody>`
            + r.top.slice(0, topN).map((x, i) => `<tr><td class="rk">${i + 1}</td><td>${esc(x.label)} <span class="grp">${esc(x.group)}</span></td><td class="cell"><progress class="meter" value="${x.n}" max="${max}"></progress></td><td class="n">${x.n}</td><td class="n">${x.recent}</td><td>${esc(ago(x))}</td></tr>`).join('')
            + `</tbody></table>${r.top.length > topN ? `<p class="note">The ${topN} most used of ${r.top.length}.</p>` : ''}`
        : `<p class="empty">Nothing counted yet: use the extension and come back.</p>`;
    html += `<h2>Little used</h2><p class="note">Used at most twice since the counting began: worth asking whether they are needed, or hard to find.</p>`;
    html += r.rare.length
        ? `<table><thead><tr><th>Feature</th><th class="n">Uses</th><th>Last used</th></tr></thead><tbody>${r.rare.map(x => `<tr><td>${esc(x.label)} <span class="grp">${esc(x.group)}</span></td><td class="n">${x.n}</td><td>${esc(ago(x))}</td></tr>`).join('')}</tbody></table>`
        : `<p class="empty">None.</p>`;
    html += `<h2>Never used (${r.never.length})</h2><p class="note">Commands of the extension that were not run once${r.young ? ' (too early to call them useless)' : ''}.</p>`;
    if (r.never.length) {
        const groups = new Map<string, Row[]>();
        for (const x of r.never) { groups.set(x.group, [...(groups.get(x.group) ?? []), x]); }
        html += [...groups].sort((a, b) => b[1].length - a[1].length).map(([g, list]) => `<details><summary>${esc(g)} (${list.length})</summary><ul class="never">${list.map(x => `<li>${esc(x.label)}</li>`).join('')}</ul></details>`).join('');
    } else { html += `<p class="empty">Every command was used at least once.</p>`; }
    return html;
}

export function usageHtml(nonce: string, cspSource: string, r: Ranking): string {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource}; style-src ${cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<title>Feature usage</title><style nonce="${nonce}">${CSS}</style></head><body id="root">${usageBody(r)}
<script nonce="${nonce}">
(function () {
  var api = acquireVsCodeApi();
  document.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if (b && b.id) { api.postMessage({ type: b.id }); }
  });
  window.addEventListener('message', function (ev) { if (ev.data && ev.data.type === 'body') { document.getElementById('root').innerHTML = ev.data.html; } });
})();
</script></body></html>`;
}
