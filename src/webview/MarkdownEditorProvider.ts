import * as vscode from 'vscode';
import * as path from 'path';
import { joinBlocks, outline, parseBlocks } from '../utils/mdBlocks';
import { RenderOptions, esc, renderBlock, slug, toggleTask } from '../utils/mdRender';
import { mdHtml } from './mdEditorHtml';

function nonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 32; i++) { s += chars.charAt(Math.floor(Math.random() * chars.length)); }
    return s;
}

/** The block texts of the editor: what each one becomes when read again (a text with a blank line inside is two blocks; an empty one is kept). */
export function normalize(raws: string[]): string[] {
    return raws.flatMap(r => (r.trim() === '' ? [''] : parseBlocks(r).map(b => b.raw)));
}

/** One block drawn; the `[[toc]]` line becomes the list of the headings of the page. */
export function drawBlock(raw: string, all: string[], o: RenderOptions): string {
    if (raw.trim() === '') { return ''; }
    if (raw.trim() === '[[toc]]') {
        const heads = outline(parseBlocks(joinBlocks(all.map(r => ({ raw: r })))));
        return '<nav class="toc">' + (heads.length ? heads.map(h => '<a href="#' + esc(slug(h.text.replace(/[*_`]/g, ''))) + '" style="padding-left:' + (h.level - 1) * 14 + 'px">' + esc(h.text.replace(/[*_`]/g, '')) + '</a>').join('') : '<em>No heading yet</em>') + '</nav>';
    }
    const b = parseBlocks(raw)[0];
    return b ? renderBlock(b, o) : '';
}

/**
 * The Markdown editor: the file read as a page and edited block by block, with a "/" menu to make a heading, a list, a to-do, a quote, a
 * code block or a table, as in Notion. Opened with *Open With...* on a .md file, or with *CE: Open as a Markdown page*. The file stays an
 * ordinary Markdown file: the editor only writes the text of the blocks, one blank line apart.
 */
export class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
    static readonly viewType = 'ce.markdownEditor';

    static register(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.window.registerCustomEditorProvider(MarkdownEditorProvider.viewType, new MarkdownEditorProvider(), { webviewOptions: { retainContextWhenHidden: true }, supportsMultipleEditorsPerDocument: false }),
            vscode.commands.registerCommand('ce.markdown.open', async (uri?: vscode.Uri) => {
                const target = uri ?? vscode.window.activeTextEditor?.document.uri;
                if (!target || !/\.(md|markdown)$/i.test(target.fsPath)) { void vscode.window.showWarningMessage('CE: Open a Markdown file (.md) to see it as a page.'); return; }
                await vscode.commands.executeCommand('vscode.openWith', target, MarkdownEditorProvider.viewType);
            }),
            vscode.commands.registerCommand('ce.markdown.new', async () => {
                const name = await vscode.window.showInputBox({ title: 'New Markdown page', prompt: 'Name of the page', placeHolder: 'Meeting notes', validateInput: v => (/^[^\\/:*?"<>|]+$/.test(v.trim()) ? undefined : 'A name without \\ / : * ? " < > |') });
                if (!name) { return; }
                const here = vscode.window.activeTextEditor?.document.uri;
                const folder = here && here.scheme === 'file' ? vscode.Uri.file(path.dirname(here.fsPath)) : vscode.workspace.workspaceFolders?.[0]?.uri;
                if (!folder) { void vscode.window.showWarningMessage('CE: Open a folder to create the page in.'); return; }
                const file = vscode.Uri.joinPath(folder, name.trim().replace(/\.md$/i, '') + '.md');
                try { await vscode.workspace.fs.stat(file); } catch { await vscode.workspace.fs.writeFile(file, Buffer.from('# ' + name.trim().replace(/\.md$/i, '') + '\n\n', 'utf8')); }
                await vscode.commands.executeCommand('vscode.openWith', file, MarkdownEditorProvider.viewType);
            }),
        );
    }

    async resolveCustomTextEditor(document: vscode.TextDocument, panel: vscode.WebviewPanel): Promise<void> {
        const dir = vscode.Uri.file(path.dirname(document.uri.fsPath));
        panel.webview.options = { enableScripts: true, localResourceRoots: [dir, ...(vscode.workspace.workspaceFolders ?? []).map(f => f.uri)] };
        const title = path.basename(document.uri.fsPath);
        panel.webview.html = mdHtml({ nonce: nonce(), cspSource: panel.webview.cspSource, title });
        // relative images are found next to the file
        const base = panel.webview.asWebviewUri(dir).toString() + '/';
        const opts: RenderOptions = { base };

        let raws: string[] = parseBlocks(document.getText()).map(b => b.raw);
        let written = document.getText();
        const subs: vscode.Disposable[] = [];

        const post = (focus?: { i: number; pos: number } | null, startEditing = false): void => {
            void panel.webview.postMessage({
                type: 'doc', title,
                blocks: raws.map(r => ({ raw: r, html: drawBlock(r, raws, opts) })),
                outline: outlineOf(raws),
                focus: focus ?? null, startEditing,
            });
        };
        const write = async (): Promise<void> => {
            const text = joinBlocks(raws.map(r => ({ raw: r })));
            if (text === document.getText()) { return; }
            written = text;
            const we = new vscode.WorkspaceEdit();
            we.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), text);
            await vscode.workspace.applyEdit(we);
        };

        subs.push(
            vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document.uri.toString() !== document.uri.toString()) { return; }
                // our own write comes back here: nothing to do; a change from elsewhere (text editor, undo, git) is drawn
                if (document.getText() === written) { return; }
                written = document.getText();
                raws = parseBlocks(written).map(b => b.raw);
                post();
            }),
            panel.webview.onDidReceiveMessage(async (m: Record<string, unknown>) => {
                switch (m.type) {
                    case 'ready': post(null, document.getText().trim() === '' || document.getText().trim() === '#'); break;
                    case 'blocks': {
                        if (Array.isArray(m.raws)) { raws = normalize(m.raws.filter((r): r is string => typeof r === 'string')); }
                        await write();
                        const f = m.focus as { i?: number; pos?: number } | null;
                        post(f && typeof f.i === 'number' ? { i: Math.min(f.i, Math.max(0, raws.length - 1)), pos: typeof f.pos === 'number' ? f.pos : -2 } : null);
                        break;
                    }
                    case 'draft': if (Array.isArray(m.raws)) { raws = m.raws.filter((r): r is string => typeof r === 'string'); await write(); } break;
                    case 'toggle': {
                        const i = typeof m.i === 'number' ? m.i : -1;
                        if (i >= 0 && i < raws.length && typeof m.ln === 'number') { raws[i] = toggleTask(raws[i], m.ln); await write(); post(); }
                        break;
                    }
                    case 'link': await openLink(document, typeof m.href === 'string' ? m.href : ''); break;
                    case 'openText': await vscode.commands.executeCommand('vscode.openWith', document.uri, 'default'); break;
                }
            }),
            panel.onDidDispose(() => subs.forEach(s => s.dispose())),
        );
    }
}

/** The headings of the page with the position of their block in the editor (a block that holds one heading). */
function outlineOf(raws: string[]): { text: string; level: number; index: number }[] {
    const out: { text: string; level: number; index: number }[] = [];
    raws.forEach((r, i) => {
        const b = parseBlocks(r)[0];
        if (b && b.type === 'heading') { const o = outline([b])[0]; if (o) { out.push({ ...o, index: i }); } }
    });
    return out;
}

async function openLink(document: vscode.TextDocument, href: string): Promise<void> {
    if (/^(https?:|mailto:)/i.test(href)) { await vscode.env.openExternal(vscode.Uri.parse(href)); return; }
    if (!href || href.startsWith('#')) { return; }
    const clean = decodeURIComponent(href.split('#')[0]);
    const target = vscode.Uri.file(path.resolve(path.dirname(document.uri.fsPath), clean));
    try {
        await vscode.workspace.fs.stat(target);
        await vscode.commands.executeCommand('vscode.open', target);
    } catch { void vscode.window.showWarningMessage('CE: ' + clean + ' was not found next to this page.'); }
}
