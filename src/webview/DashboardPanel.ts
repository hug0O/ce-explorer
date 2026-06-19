import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { CodeExplorerService } from '../services/CodeExplorerService';

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

interface ActionButton {
    id: string;
    label: string;
    svg: string;
    cmd: string;
    needsMember?: boolean;
    needsDocument?: boolean;
}

const ICONS: Record<string, string> = {
    method: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 4h3.5c1.5 0 2.5 1 2.5 2.5v3c0 1.5 1 2.5 2.5 2.5H15"/><circle cx="4" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg>',
    field: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="6" width="10" height="4" rx="1"/><line x1="6" y1="8" x2="10" y2="8"/></svg>',
    property: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M5 8l3-3 3 3-3 3z"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/></svg>',
    ctor: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M5 4l-2 4 2 4M11 4l2 4-2 4"/></svg>',
    edit: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 13l1-3 6-6 2 2-6 6-3 1z"/><path d="M9 5l2 2"/></svg>',
    rename: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 4h7M3 8h10M3 12h5"/><circle cx="12" cy="4" r="1.5"/></svg>',
    delete: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 5h8M6 5V3h4v2M5 5l1 9h4l1-9"/></svg>',
    extract: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 5h4M3 11h4M5 3v8"/><path d="M9 8h4M11 6v4"/></svg>',
    sort: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><line x1="3" y1="5" x2="13" y2="5"/><line x1="3" y1="9" x2="10" y2="9"/><line x1="3" y1="13" x2="7" y2="13"/></svg>',
    sync: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 8a5 5 0 0 1 8.5-3.5L13 6"/><path d="M13 8a5 5 0 0 1-8.5 3.5L3 10"/><path d="M11 4v2h2M5 12v-2H3"/></svg>',
    template: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 4L2 8l4 4M10 4l4 4-4 4"/></svg>',
    refresh: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M13 8a5 5 0 1 1-2-4"/><path d="M13 3v3h-3"/></svg>',
};

const ADD_ACTIONS: ActionButton[] = [
    { id: 'method', label: 'Method', svg: ICONS.method, cmd: 'mmx.addMethod' },
    { id: 'field', label: 'Field', svg: ICONS.field, cmd: 'mmx.addField' },
    { id: 'property', label: 'Property', svg: ICONS.property, cmd: 'mmx.addProperty' },
    { id: 'constructor', label: 'Constructor', svg: ICONS.ctor, cmd: 'mmx.addConstructor' },
];

const MEMBER_ACTIONS: ActionButton[] = [
    { id: 'edit', label: 'Edit', svg: ICONS.edit, cmd: 'mmx.editMember', needsMember: true },
    { id: 'rename', label: 'Rename', svg: ICONS.rename, cmd: 'mmx.renameMember', needsMember: true },
    { id: 'delete', label: 'Delete', svg: ICONS.delete, cmd: 'mmx.deleteMember', needsMember: true },
    { id: 'extract', label: 'Extract', svg: ICONS.extract, cmd: 'mmx.extractMethod', needsDocument: true },
];

const DOC_ACTIONS: ActionButton[] = [
    { id: 'sort', label: 'Sort', svg: ICONS.sort, cmd: 'mmx.sortMembers', needsDocument: true },
    { id: 'sync', label: 'Sync', svg: ICONS.sync, cmd: 'mmx.synchronizeDeclImpl', needsDocument: true },
    { id: 'template', label: 'Template', svg: ICONS.template, cmd: 'mmx.insertTemplate', needsDocument: true },
];

const EXPLORER_ACTIONS: ActionButton[] = [
    { id: 'refresh', label: 'Refresh', svg: ICONS.refresh, cmd: 'mmx.refreshExplorer' },
];

export class DashboardPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'mmxDashboard';
    private _view?: vscode.WebviewView;
    private _currentClass: string | undefined;
    private _currentMember: string | undefined;
    private _hasDocument: boolean = false;
    private _stateKey: string = '';
    private _debounceTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _providerRegistry: ProviderRegistry,
        private readonly _codeExplorer: CodeExplorerService,
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true, localResourceRoots: [this._extensionUri] };
        webviewView.webview.html = this.getHtml();

        webviewView.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'run' && typeof msg.cmd === 'string') {
                await vscode.commands.executeCommand(msg.cmd);
            }
        });

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            this.onCursorChanged(editor);
        }
    }

    public scheduleCursorUpdate(editor: vscode.TextEditor): void {
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => this.onCursorChanged(editor), 75);
    }

    private onCursorChanged(editor: vscode.TextEditor): void {
        const doc = editor.document;
        const provider = this._providerRegistry.getByDocument(doc);
        this._hasDocument = !!provider;
        this._currentClass = undefined;
        this._currentMember = undefined;

        if (provider) {
            const position = editor.selection.active;
            const parsed = this._codeExplorer.getParsedDocument(doc);
            if (parsed) {
                for (const cls of parsed.classes) {
                    if (!cls.range.contains(position)) continue;
                    this._currentClass = cls.name;
                    for (const member of cls.members) {
                        if (member.range.contains(position) || member.implementationRange?.contains(position)) {
                            this._currentMember = member.name;
                            break;
                        }
                    }
                    break;
                }
                // File-level (standalone) functions are not inside any class.
                if (!this._currentMember) {
                    for (const proc of parsed.standaloneProcedures) {
                        if (proc.range.contains(position) || proc.implementationRange?.contains(position)) {
                            this._currentMember = proc.name;
                            break;
                        }
                    }
                }
            }
        }

        const newKey = (this._currentClass || '') + ':' + (this._currentMember || '') + ':' + (this._hasDocument ? '1' : '0');
        if (newKey !== this._stateKey) {
            this._stateKey = newKey;
            this.updateContext();
        }
    }

    private updateContext(): void {
        if (!this._view) return;
        this._view.webview.postMessage({
            command: 'context',
            className: this._currentClass || null,
            memberName: this._currentMember || null,
            hasDocument: this._hasDocument,
        });
    }

    private buttonHtml(btn: ActionButton, variant: string): string {
        return `<button class="mmx-btn mmx-btn-${variant}" data-cmd="${btn.cmd}"${btn.needsMember ? ' data-needs-member="1"' : ''}${btn.needsDocument ? ' data-needs-doc="1"' : ''}>
<span class="mmx-icon">${btn.svg}</span><span class="mmx-label">${btn.label}</span></button>`;
    }

    private getHtml(): string {
        const nonce = getNonce();
        const renderGroup = (title: string, actions: ActionButton[], variant: string): string => {
            const buttons = actions.map(a => this.buttonHtml(a, variant)).join('');
            return `<div class="mmx-group"><div class="mmx-group-title">${title}</div><div class="mmx-grid">${buttons}</div></div>`;
        };

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-sideBar-background); padding: 10px 8px; }

.mmx-ctx { padding: 8px 10px; border-radius: 5px; background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.08)); margin-bottom: 12px; min-height: 36px; display: flex; flex-direction: column; justify-content: center; }
.mmx-ctx-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--vscode-descriptionForeground); margin-bottom: 2px; }
.mmx-ctx-class { font-weight: 600; font-size: 13px; }
.mmx-ctx-member { font-size: 11px; color: var(--vscode-descriptionForeground); font-family: var(--vscode-editor-font-family, monospace); margin-top: 1px; }
.mmx-ctx-hint { font-size: 11px; color: var(--vscode-descriptionForeground); font-style: italic; }

.mmx-group { margin-bottom: 12px; }
.mmx-group-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--vscode-descriptionForeground); margin: 0 2px 5px; }

.mmx-grid { display: flex; flex-direction: column; gap: 3px; }

.mmx-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 10px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; font-size: 12px; font-family: inherit; text-align: left; transition: background 0.12s, border-color 0.12s; }
.mmx-btn-add { background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.12)); color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); border-color: var(--vscode-button-border, transparent); }
.mmx-btn-add:hover:not(:disabled) { background: var(--vscode-button-secondaryHoverBackground, rgba(127,127,127,0.2)); }
.mmx-btn-member { background: transparent; color: var(--vscode-foreground); }
.mmx-btn-member:hover:not(:disabled) { background: var(--vscode-list-hoverBackground, rgba(127,127,127,0.1)); }
.mmx-btn-doc { background: transparent; color: var(--vscode-descriptionForeground); }
.mmx-btn-doc:hover:not(:disabled) { background: var(--vscode-list-hoverBackground, rgba(127,127,127,0.1)); color: var(--vscode-foreground); }
.mmx-btn-explorer { background: transparent; color: var(--vscode-descriptionForeground); }
.mmx-btn-explorer:hover:not(:disabled) { background: var(--vscode-list-hoverBackground, rgba(127,127,127,0.1)); color: var(--vscode-foreground); }
.mmx-btn:disabled { opacity: 0.35; cursor: default; }

.mmx-icon { width: 16px; height: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; opacity: 0.8; }
.mmx-icon svg { width: 16px; height: 16px; }
.mmx-btn-add .mmx-icon { opacity: 1; }
.mmx-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
</head>
<body>
<div class="mmx-ctx" id="ctx"><span class="mmx-ctx-hint">Open a supported file to begin.</span></div>
${renderGroup('Add Member', ADD_ACTIONS, 'add')}
${renderGroup('Member', MEMBER_ACTIONS, 'member')}
${renderGroup('Document', DOC_ACTIONS, 'doc')}
${renderGroup('Explorer', EXPLORER_ACTIONS, 'explorer')}
<script nonce="${nonce}">
(function() {
    var vscodeApi = acquireVsCodeApi();
    var hasMember = false, hasDoc = false;
    function applyState() {
        document.querySelectorAll('.mmx-btn').forEach(function(b) {
            var nm = b.getAttribute('data-needs-member') === '1';
            var nd = b.getAttribute('data-needs-doc') === '1';
            b.disabled = (nm && !hasMember) || (nd && !hasDoc);
        });
    }
    document.querySelectorAll('.mmx-btn').forEach(function(b) {
        b.addEventListener('click', function() {
            if (b.disabled) return;
            vscodeApi.postMessage({ command: 'run', cmd: b.getAttribute('data-cmd') });
        });
    });
    window.addEventListener('message', function(ev) {
        var msg = ev.data;
        if (msg.command !== 'context') return;
        hasDoc = !!msg.hasDocument;
        hasMember = !!msg.memberName;
        var ctx = document.getElementById('ctx');
        if (!hasDoc) {
            ctx.innerHTML = '<span class="mmx-ctx-hint">Open a supported file to begin.</span>';
        } else if (msg.className) {
            var h = '<div class="mmx-ctx-label">Context</div><div class="mmx-ctx-class">' + esc(msg.className) + '</div>';
            if (msg.memberName) h += '<div class="mmx-ctx-member">' + esc(msg.memberName) + '</div>';
            ctx.innerHTML = h;
        } else if (msg.memberName) {
            ctx.innerHTML = '<div class="mmx-ctx-label">Function</div><div class="mmx-ctx-class">' + esc(msg.memberName) + '</div>';
        } else {
            ctx.innerHTML = '<span class="mmx-ctx-hint">Place cursor inside a class or function.</span>';
        }
        applyState();
    });
    function esc(s) { return String(s).replace(/[&<>"']/g, function(c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
    applyState();
})();
</script>
</body></html>`;
    }
}
