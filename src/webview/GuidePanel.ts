import * as vscode from 'vscode';
import { guidePageHtml } from './guideContent';

/** The user guide: the topics with their pictures and animations at full size, one panel that is reused and scrolled to the topic asked for. */
export class GuidePanel {
    public static readonly viewType = 'ceGuide';
    private static current: GuidePanel | undefined;

    private constructor(private readonly panel: vscode.WebviewPanel, private readonly extensionUri: vscode.Uri) {
        panel.onDidDispose(() => { GuidePanel.current = undefined; });
    }

    static show(extensionUri: vscode.Uri, topic?: string): void {
        if (GuidePanel.current) {
            GuidePanel.current.panel.reveal(undefined, false);
            GuidePanel.current.render(topic);
            return;
        }
        const panel = vscode.window.createWebviewPanel(GuidePanel.viewType, 'Code Explorer guide', vscode.ViewColumn.Beside, {
            enableScripts: true, retainContextWhenHidden: false, localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
        });
        GuidePanel.current = new GuidePanel(panel, extensionUri);
        GuidePanel.current.render(topic);
    }

    private render(topic?: string): void {
        const web = this.panel.webview;
        const nonce = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
        web.html = guidePageHtml({
            nonce, cspSource: web.cspSource, topic,
            media: file => web.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'guide', file)).toString(),
        });
    }
}
