import * as vscode from 'vscode';
import { usage } from '../services/UsageStats';
import { groupOf } from '../services/QuickActions';
import { Feature, rank, rankingMarkdown } from '../utils/usageStats';
import { usageBody, usageHtml } from './usageHtml';

function nonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 32; i++) { s += chars.charAt(Math.floor(Math.random() * chars.length)); }
    return s;
}

/** The commands a user can run: the ones of the manifest that the palette does not hide, by title. */
export function featureCatalog(manifest: { contributes?: { commands?: { command: string; title?: string }[]; menus?: { commandPalette?: { command: string; when?: string }[] } } } | undefined): Feature[] {
    const hidden = new Set((manifest?.contributes?.menus?.commandPalette ?? []).filter(m => m.when === 'false').map(m => m.command));
    return (manifest?.contributes?.commands ?? [])
        .filter(c => c.command.startsWith('ce.') && !hidden.has(c.command) && c.command !== 'ce.usage.show' && c.title)
        .map(c => ({ key: c.command, label: c.title!.replace(/^CE:\s*/, ''), group: groupOf(c.command) }));
}

/**
 * The ranking of what is used: opened by *CE: Feature usage (ranking)*. The counting is local; the page can copy the ranking as Markdown or
 * start the counting again.
 */
export class UsagePanel {
    private static current: UsagePanel | undefined;

    static show(context: vscode.ExtensionContext): void {
        if (UsagePanel.current) { UsagePanel.current.panel.reveal(); UsagePanel.current.refresh(); return; }
        const panel = vscode.window.createWebviewPanel('ceUsage', 'Feature usage', vscode.ViewColumn.Active, { enableScripts: true });
        UsagePanel.current = new UsagePanel(panel, context);
    }

    private constructor(private readonly panel: vscode.WebviewPanel, private readonly context: vscode.ExtensionContext) {
        panel.webview.html = usageHtml(nonce(), panel.webview.cspSource, this.ranking());
        panel.webview.onDidReceiveMessage(m => { void this.onMessage(m as { type?: string }); });
        panel.onDidDispose(() => { UsagePanel.current = undefined; });
    }

    private ranking(): ReturnType<typeof rank> {
        return rank(usage.snapshot(), featureCatalog(this.context.extension?.packageJSON), Date.now());
    }

    private refresh(): void { void this.panel.webview.postMessage({ type: 'body', html: usageBody(this.ranking()) }); }

    private async onMessage(m: { type?: string }): Promise<void> {
        if (m.type === 'refresh') { this.refresh(); }
        else if (m.type === 'copy') {
            await vscode.env.clipboard.writeText(rankingMarkdown(this.ranking()));
            vscode.window.setStatusBarMessage('CE: the ranking is copied (Markdown)', 3000);
        } else if (m.type === 'reset') {
            const pick = await vscode.window.showWarningMessage('Start counting the use of the features again from zero?', { modal: true }, 'Reset');
            if (pick === 'Reset') { await usage.reset(); this.refresh(); }
        }
    }
}
