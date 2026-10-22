import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { changelogCss, changelogHtml, parseChangelog } from './changelogSection';
import { GuidePanel } from './GuidePanel';

/**
 * "Changelog + Guide": a sidebar view of its own, below Member and folded until it is opened. One line per guide topic
 * (each opens the guide page at that topic) and the versions of CHANGELOG.md.
 */
export class GuideSidebarPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ceGuideView';

    constructor(private readonly extensionUri: vscode.Uri, private readonly version: string | undefined) { }

    resolveWebviewView(view: vscode.WebviewView): void {
        view.webview.options = { enableScripts: true, localResourceRoots: [this.extensionUri] };
        view.webview.html = this.html();
        view.webview.onDidReceiveMessage((msg: { command?: string; topic?: unknown }) => {
            if (msg.command === 'openGuide') { GuidePanel.show(this.extensionUri, typeof msg.topic === 'string' && /^[a-z]{1,20}$/.test(msg.topic) ? msg.topic : undefined); }
        });
    }

    private html(): string {
        const nonce = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
        let body: string;
        try {
            body = changelogHtml(parseChangelog(fs.readFileSync(path.join(this.extensionUri.fsPath, 'CHANGELOG.md'), 'utf8')), this.version);
        } catch { body = changelogHtml([]); }
        return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
body { font-family: var(--vscode-font-family, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); padding: 4px 8px 10px; }
${changelogCss()}
</style></head><body>
${body}
<script nonce="${nonce}">
(function () {
    var api = acquireVsCodeApi();
    document.querySelectorAll('[data-guide]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'openGuide', topic: b.getAttribute('data-guide') }); });
    });
})();
</script></body></html>`;
    }
}
