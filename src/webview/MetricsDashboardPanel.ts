import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { ClassInfo, ClassMember, MemberKind } from '../models/types';

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

interface ClassMetrics {
    name: string;
    classType: string;
    memberCount: number;
    methodCount: number;
    fieldCount: number;
    propertyCount: number;
    loc: number;
    complexity: number;
    maintainability: 'good' | 'warning' | 'poor';
}

function calculateComplexity(document: vscode.TextDocument, member: ClassMember): number {
    let complexity = 1;
    for (let i = member.range.start.line; i <= member.range.end.line && i < document.lineCount; i++) {
        const line = document.lineAt(i).text;
        if (/\b(if|else if|for|while|switch|case|catch)\b/.test(line)) {
            complexity++;
        }
    }
    return complexity;
}

function calculateMetrics(document: vscode.TextDocument, cls: ClassInfo): ClassMetrics {
    const methods = cls.members.filter(m => m.kind === MemberKind.Method);
    const fields = cls.members.filter(m => m.kind === MemberKind.Field);
    const properties = cls.members.filter(m => m.kind === MemberKind.Property);
    const loc = cls.range.end.line - cls.range.start.line;

    let totalComplexity = 0;
    for (const m of methods) {
        totalComplexity += calculateComplexity(document, m);
    }

    let maintainability: 'good' | 'warning' | 'poor' = 'good';
    if (loc > 200 || totalComplexity > 20) {
        maintainability = 'poor';
    } else if (loc > 100 || totalComplexity > 10) {
        maintainability = 'warning';
    }

    return {
        name: cls.name,
        classType: cls.classType || (cls.isInterface ? 'interface' : cls.isRecord ? 'record' : 'class'),
        memberCount: cls.members.length,
        methodCount: methods.length,
        fieldCount: fields.length,
        propertyCount: properties.length,
        loc,
        complexity: totalComplexity,
        maintainability,
    };
}

export class MetricsDashboardPanel {
    public static currentPanel: MetricsDashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;

    public static createOrShow(extensionUri: vscode.Uri, registry: ProviderRegistry): void {
        if (MetricsDashboardPanel.currentPanel) {
            MetricsDashboardPanel.currentPanel._panel.reveal();
            return;
        }
        const panel = vscode.window.createWebviewPanel(
            'metricsDashboard',
            'Code Metrics',
            vscode.ViewColumn.Beside,
            {
                enableScripts: false,
                localResourceRoots: [],
            }
        );
        MetricsDashboardPanel.currentPanel = new MetricsDashboardPanel(panel, extensionUri, registry);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        _extensionUri: vscode.Uri,
        registry: ProviderRegistry
    ) {
        this._panel = panel;
        this._panel.onDidDispose(() => {
            MetricsDashboardPanel.currentPanel = undefined;
        });
        this.update(registry);
    }

    private update(registry: ProviderRegistry): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._panel.webview.html = this.getHtml([], 'No active editor');
            return;
        }

        const provider = registry.getByDocument(editor.document);
        if (!provider) {
            this._panel.webview.html = this.getHtml([], 'No provider for this file type');
            return;
        }

        const parsed = provider.parseDocument(editor.document);
        const metrics = parsed.classes.map(cls => calculateMetrics(editor.document, cls));

        this._panel.webview.html = this.getHtml(metrics);
    }

    private getHtml(metrics: ClassMetrics[], error?: string): string {
        const nonce = getNonce();

        const summaryTotal = metrics.reduce((s, m) => s + m.memberCount, 0);
        const summaryMethods = metrics.reduce((s, m) => s + m.methodCount, 0);
        const summaryFields = metrics.reduce((s, m) => s + m.fieldCount, 0);
        const summaryLoc = metrics.reduce((s, m) => s + m.loc, 0);
        const summaryComplexity = metrics.reduce((s, m) => s + m.complexity, 0);

        const rows = metrics.map(m => {
            const statusClass = m.maintainability;
            const statusLabel = m.maintainability === 'good' ? 'Good' :
                m.maintainability === 'warning' ? 'Warning' : 'Complex';
            return `<tr>
                <td>${escHtml(m.name)}</td>
                <td>${escHtml(m.classType)}</td>
                <td class="num">${m.memberCount}</td>
                <td class="num">${m.methodCount}</td>
                <td class="num">${m.propertyCount}</td>
                <td class="num">${m.fieldCount}</td>
                <td class="num">${m.loc}</td>
                <td class="num">${m.complexity}</td>
                <td class="status ${statusClass}">${statusLabel}</td>
            </tr>`;
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px; }
h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.error { color: var(--vscode-errorForeground, #f44747); padding: 12px; background: var(--vscode-input-background); border-radius: 4px; }
.summary { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.summary-card { padding: 10px 16px; background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.08)); border-radius: 6px; min-width: 100px; text-align: center; }
.summary-card .value { font-size: 22px; font-weight: 700; }
.summary-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--vscode-descriptionForeground); margin-top: 2px; }
table { border-collapse: collapse; width: 100%; margin-top: 8px; }
th, td { padding: 8px 12px; border: 1px solid var(--vscode-input-border, rgba(127,127,127,0.2)); text-align: left; }
th { background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.08)); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
.status { font-weight: 600; text-align: center; }
.good { color: #4ec9b0; }
.warning { color: #dcdcaa; }
.poor { color: #f44747; }
.empty { padding: 24px; text-align: center; color: var(--vscode-descriptionForeground); font-style: italic; }
</style>
</head>
<body>
<h2>Code Metrics</h2>
${error ? `<div class="error">${escHtml(error)}</div>` : ''}
${metrics.length > 0 ? `
<div class="summary">
    <div class="summary-card"><div class="value">${metrics.length}</div><div class="label">Classes</div></div>
    <div class="summary-card"><div class="value">${summaryTotal}</div><div class="label">Members</div></div>
    <div class="summary-card"><div class="value">${summaryMethods}</div><div class="label">Methods</div></div>
    <div class="summary-card"><div class="value">${summaryFields}</div><div class="label">Fields</div></div>
    <div class="summary-card"><div class="value">${summaryLoc}</div><div class="label">Total LOC</div></div>
    <div class="summary-card"><div class="value">${summaryComplexity}</div><div class="label">Complexity</div></div>
</div>
<table>
<thead>
<tr><th>Class</th><th>Type</th><th class="num">Members</th><th class="num">Methods</th><th class="num">Properties</th><th class="num">Fields</th><th class="num">LOC</th><th class="num">Complexity</th><th>Status</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
` : (!error ? '<div class="empty">No classes found in this file.</div>' : '')}
</body>
</html>`;
    }
}

function escHtml(s: string): string {
    return s.replace(/[&<>"']/g, c => {
        const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return map[c] || c;
    });
}
