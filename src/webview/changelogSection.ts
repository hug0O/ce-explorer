/**
 * The "Changelog + Guide" view of the sidebar, a view of its own below Member, folded until it is opened: the guide
 * topics, then the versions, each folded (the newest one open). It reads CHANGELOG.md, whose headings are `## 0.1.13 — 2026-10-21` and whose items are
 * `- text`, with `**bold**` and `code` allowed in the text.
 *
 * Pure: builds markup from the text of the file, so it is testable without VS Code.
 */

import { guideListHtml } from './guideContent';

export interface ChangelogEntry { version: string; date: string; items: string[] }

/** The versions of the file, newest first as written. Anything before the first heading is ignored. */
export function parseChangelog(md: string): ChangelogEntry[] {
    const out: ChangelogEntry[] = [];
    for (const raw of md.split(/\r?\n/)) {
        const head = /^##\s+v?(\d+(?:\.\d+)*)\s*(?:[—–-]\s*(.*))?$/.exec(raw.trim());
        if (head) { out.push({ version: head[1], date: (head[2] ?? '').trim(), items: [] }); continue; }
        const item = /^[-*]\s+(.*)$/.exec(raw.trim());
        if (item && out.length) { out[out.length - 1].items.push(item[1]); }
        else if (out.length && raw.startsWith('  ') && raw.trim() && out[out.length - 1].items.length) { out[out.length - 1].items[out[out.length - 1].items.length - 1] += ' ' + raw.trim(); }
    }
    return out;
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** `**bold**` and `code`, everything else as text. */
export function inlineMarkup(text: string): string {
    return esc(text).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
}

export function changelogHtml(entries: ChangelogEntry[], current?: string): string {
    const rows = entries.map((e, i) => {
        const here = current === e.version;
        return `<details class="clog-ver"${i === 0 ? ' open' : ''}><summary><span class="clog-v">${esc(e.version)}</span>${here ? '<span class="clog-here">installed</span>' : ''}<span class="clog-d">${esc(e.date)}</span></summary>`
            + `<ul>${e.items.map(t => `<li>${inlineMarkup(t)}</li>`).join('')}</ul></details>`;
    }).join('');
    return `${guideListHtml()}${entries.length ? '<div class="clog-h">Changelog</div>' : ''}${rows}`;
}

export function changelogCss(): string {
    return `
.clog-h { margin: 8px 0 2px 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--vscode-descriptionForeground); }
.clog-ver { margin: 4px 0 0 4px; }
.clog-topic { display: flex; align-items: center; gap: 6px; width: 100%; margin: 1px 0; padding: 2px 6px; text-align: left; font: inherit; font-size: 12px; color: var(--vscode-foreground); background: transparent; border: 0; border-radius: 3px; cursor: pointer; }
.clog-topic:hover { background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.15)); }
.clog-topic .clog-ti { flex: none; width: 16px; text-align: center; }
.clog-all { margin-top: 4px; color: var(--vscode-textLink-foreground, #3794ff); }
.clog-ver > summary { cursor: pointer; font-size: 12px; display: flex; gap: 6px; align-items: baseline; }
.clog-v { font-weight: 600; }
.clog-d { margin-left: auto; font-size: 10px; color: var(--vscode-descriptionForeground); }
.clog-here { font-size: 9px; padding: 0 5px; border-radius: 8px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
.clog-ver ul { margin: 3px 0 4px 20px; font-size: 11.5px; line-height: 1.45; }
.clog-ver li { margin-bottom: 3px; }
.clog-ver code { font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; background: var(--vscode-textBlockQuote-background, rgba(128, 128, 128, 0.12)); padding: 0 3px; border-radius: 3px; }
`;
}
