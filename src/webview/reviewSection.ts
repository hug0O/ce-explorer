/**
 * The code review report of the sidebar: findings listed with their advice, filtered by
 * severity, sorted, and one click away from the line they are about.
 *
 * Pure: builds markup from plain data, so it is testable without VS Code. Everything that
 * comes from the code under review is escaped.
 */
import { ReviewFinding, ReviewSeverity, SEVERITY_LABEL, SEVERITY_ORDER } from '../utils/reviewTypes';

export type ReviewSort = 'line' | 'severity' | 'category' | 'group';
export const REVIEW_SORTS: ReviewSort[] = ['line', 'severity', 'category', 'group'];
const SORT_LABEL: Record<ReviewSort, string> = { line: 'In file order', severity: 'Most serious first', category: 'By category', group: 'Grouped by category' };

export interface ReviewOptions {
    /** Which severities are listed. */
    sev: Record<ReviewSeverity, boolean>;
    sort: ReviewSort;
    /** Kinds of finding the user chose to ignore (see `ignoreKey`). */
    ignored?: string[];
    /** List the ignored ones too (to take one back). */
    showIgnored?: boolean;
}

/** What "ignore this kind of finding" remembers: the code the compiler or linter gives it, else its category. */
export function ignoreKey(f: ReviewFinding): string { return f.code ? 'code:' + f.code : 'cat:' + f.category; }

export const DEFAULT_REVIEW_OPTIONS: ReviewOptions = { sev: { error: true, warning: true, info: true }, sort: 'line' };

const ICON: Record<ReviewSeverity, string> = { error: '❌', warning: '⚠️', info: '💡' };
const PLURAL: Record<ReviewSeverity, string> = { error: 'Errors', warning: 'Warnings', info: 'Advice' };
const SEVERITIES: ReviewSeverity[] = ['error', 'warning', 'info'];

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function reviewCss(): string {
    return `
.rsum { font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 6px; }
.rbar { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin-bottom: 8px; }
.rchip { padding: 1px 8px; font-size: 11px; font-family: inherit; border-radius: 10px; cursor: pointer; color: var(--vscode-foreground); background: transparent; border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.45)); opacity: 0.55; }
.rchip.on { opacity: 1; background: var(--vscode-button-secondaryBackground, rgba(128, 128, 128, 0.2)); }
.rchip:hover { opacity: 1; }
.rsort { margin-left: auto; font-size: 11px; font-family: inherit; padding: 1px 4px; color: var(--vscode-dropdown-foreground); background: var(--vscode-dropdown-background); border: 1px solid var(--vscode-dropdown-border, rgba(128, 128, 128, 0.4)); border-radius: 3px; }
.rbtn { background: transparent; border: none; cursor: pointer; font-size: 13px; color: var(--vscode-foreground); padding: 0 3px; }
.rbtn:hover { color: var(--vscode-textLink-foreground, #3794ff); }
.finding, .drow { display: flex; gap: 7px; padding: 5px 6px; margin-bottom: 2px; border-radius: 4px; cursor: pointer; border-left: 3px solid transparent; }
.finding:hover, .drow:hover, .finding:focus, .drow:focus { background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.15)); outline: none; }
.finding.sev-error { border-left-color: #f48771; }
.finding.sev-warning { border-left-color: #cca700; }
.finding.sev-info { border-left-color: var(--vscode-symbolIcon-interfaceForeground, #75beff); }
.fsev { flex: none; width: 16px; text-align: center; }
.fbody { min-width: 0; }
.fmsg { font-size: 12px; word-break: break-word; }
.fhint { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px; word-break: break-word; }
.fmeta { font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 2px; opacity: 0.85; }
.fmeta .cat { text-transform: uppercase; letter-spacing: 0.4px; }
.rgroup { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--vscode-descriptionForeground); margin: 10px 0 3px 2px; }
.finding.ignored { opacity: 0.5; }
.fign { flex: none; align-self: flex-start; background: transparent; border: none; cursor: pointer; color: var(--vscode-descriptionForeground); font-size: 12px; opacity: 0; padding: 0 3px; }
.finding:hover .fign, .finding:focus .fign { opacity: 1; }
.fign:hover { color: var(--vscode-foreground); }
.fmeta .fcode { font-family: var(--vscode-editor-font-family, monospace); }
`;
}

/** The findings with their position in the list the panel keeps (`idx`, what a click sends back), in the chosen order. */
export function orderedFindings(findings: ReviewFinding[], sort: ReviewSort): { f: ReviewFinding; idx: number }[] {
    const items = findings.map((f, idx) => ({ f, idx }));
    const bySev = (a: { f: ReviewFinding }, b: { f: ReviewFinding }): number => SEVERITY_ORDER[a.f.severity] - SEVERITY_ORDER[b.f.severity];
    if (sort === 'severity') { items.sort((a, b) => bySev(a, b) || a.f.line - b.f.line); }
    else if (sort === 'category') { items.sort((a, b) => a.f.category.localeCompare(b.f.category) || a.f.line - b.f.line || bySev(a, b)); }
    else { items.sort((a, b) => a.f.line - b.f.line || bySev(a, b)); }
    return items;
}

export function reviewHtml(findings: ReviewFinding[], o: ReviewOptions = DEFAULT_REVIEW_OPTIONS): string {
    if (findings.length === 0) { return '<p class="muted">No issues found ✓</p>'; }
    const ignored = new Set(o.ignored ?? []);
    const hiddenCount = findings.filter(f => ignored.has(ignoreKey(f))).length;
    const count = (s: ReviewSeverity): number => findings.filter(f => f.severity === s && (o.showIgnored || !ignored.has(ignoreKey(f)))).length;
    const shown = orderedFindings(findings, o.sort).filter(x => o.sev[x.f.severity] && (o.showIgnored || !ignored.has(ignoreKey(x.f))));
    const file = findings[0].file;
    let html = `<div class="rsum">${findings.length} finding(s) in ${esc(file)}: click one to go to its line. The code (H2164, CS0168, TS6133…) is the one the compiler or the linter gives it. They are also marked in the editor and listed in the Problems panel until you close the report.</div>`;
    html += `<div class="rbar">`
        + SEVERITIES.map(s => `<button class="rchip sev-${s}${o.sev[s] ? ' on' : ''}" data-sev="${s}" title="Show or hide the ${PLURAL[s].toLowerCase()}">${ICON[s]} ${count(s)} ${PLURAL[s]}</button>`).join('')
        + `<select class="rsort" id="rSort" title="Order of the list">`
        + REVIEW_SORTS.map(m => `<option value="${m}"${o.sort === m ? ' selected' : ''}>${SORT_LABEL[m]}</option>`).join('')
        + `</select><button class="rbtn" id="rAgain" title="Review the file again">↻</button></div>`
        + (hiddenCount ? `<div class="rsum">${hiddenCount} ignored finding(s) <button class="rchip on" id="rShowIgnored" title="${o.showIgnored ? 'Hide' : 'Show'} the ignored kinds again">${o.showIgnored ? 'hide them' : 'show them'}</button></div>` : '');
    if (shown.length === 0) { return html + '<p class="muted">Nothing to show with these filters.</p>'; }
    html += `<div class="rlist">`;
    let lastGroup = '';
    for (const { f, idx } of shown) {
        if (o.sort === 'group' && f.category !== lastGroup) {
            lastGroup = f.category;
            html += `<div class="rgroup">${esc(f.category)} (${shown.filter(x => x.f.category === f.category).length})</div>`;
        }
        const isIgnored = ignored.has(ignoreKey(f));
        const where = [f.className && f.memberName ? `${f.className}.${f.memberName}` : f.memberName ?? f.className, `line ${f.line + 1}`].filter(Boolean).join(' · ');
        html += `<div class="finding sev-${f.severity}${isIgnored ? ' ignored' : ''}" data-idx="${idx}" tabindex="0" role="button" title="${esc(SEVERITY_LABEL[f.severity])}: go to line ${f.line + 1}">`
            + `<span class="fsev">${ICON[f.severity]}</span><div class="fbody"><div class="fmsg">${esc(f.message)}</div>`
            + (f.hint ? `<div class="fhint">${esc(f.hint)}</div>` : '')
            + `<div class="fmeta"><span class="cat">${esc(f.category)}${f.source ? ' (' + esc(f.source) + ')' : ''}</span>${f.code ? ' · <span class="fcode">' + esc(f.code) + '</span>' : ''} · ${esc(where)}</div></div>`
            + `<button class="fign" data-ignore="${esc(ignoreKey(f))}" data-on="${isIgnored ? '0' : '1'}" title="${isIgnored ? 'Stop ignoring this kind of finding' : 'Ignore this kind of finding in this workspace (' + esc(ignoreKey(f)) + ')'}">${isIgnored ? '↩' : '✕'}</button></div>`;
    }
    return html + `</div>`;
}
