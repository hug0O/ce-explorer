import * as vscode from 'vscode';
import { ClassInfo, ClassMember, MemberKind } from '../models/types';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { CodeGeneratorService } from '../services/CodeGeneratorService';
import { CodeExplorerService } from '../services/CodeExplorerService';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import * as ops from '../services/MemberOperations';

interface MemberViewerState {
    member: ClassMember | undefined;
    classInfo: ClassInfo | undefined;
    provider: ILanguageProvider | undefined;
}

export class MemberViewerPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'mmxViewer';
    private _view?: vscode.WebviewView;
    private _state: MemberViewerState = { member: undefined, classInfo: undefined, provider: undefined };
    private _stateKey: string = '';
    private _debounceTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _providerRegistry: ProviderRegistry,
        private readonly _codeExplorer: CodeExplorerService,
        private readonly _codeGenerator: CodeGeneratorService,
        private readonly _extensionContext: vscode.ExtensionContext
    ) {
        _extensionContext.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(e => {
                this.scheduleCursorUpdate(e.textEditor);
            }),
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.scheduleCursorUpdate(editor);
                }
            }),
            vscode.workspace.onDidChangeTextDocument(() => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    this.scheduleCursorUpdate(editor);
                }
            })
        );
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this.getEmptyHtml();

        webviewView.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'edit':
                    await this.handleEdit();
                    break;
                case 'delete':
                    await this.handleDelete();
                    break;
                case 'rename':
                    await this.handleRename();
                    break;
            }
        });

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            this.onCursorChanged(editor);
        }
    }

    private scheduleCursorUpdate(editor: vscode.TextEditor): void {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = setTimeout(() => this.onCursorChanged(editor), 75);
    }

    private onCursorChanged(editor: vscode.TextEditor): void {
        const doc = editor.document;
        const provider = this._providerRegistry.getByDocument(doc);
        if (!provider) {
            this.clearView();
            return;
        }

        const position = editor.selection.active;
        const parsed = this._codeExplorer.getParsedDocument(doc);
        if (!parsed) {
            this.clearView();
            return;
        }

        let foundMember: ClassMember | undefined;
        let foundCls: ClassInfo | undefined;

        for (const cls of parsed.classes) {
            for (const member of cls.members) {
                if (member.range.contains(position) || member.implementationRange?.contains(position)) {
                    foundMember = member;
                    foundCls = cls;
                    break;
                }
            }
            if (foundMember) {
                break;
            }
        }

        if (!foundMember) {
            for (const proc of parsed.standaloneProcedures) {
                if (proc.range.contains(position) || proc.implementationRange?.contains(position)) {
                    foundMember = proc;
                    foundCls = undefined;
                    break;
                }
            }
        }

        if (!foundMember && !foundCls) {
            foundCls = parsed.classes.find(cls => cls.range.contains(position));
        }

        const newKey = (foundMember ? foundMember.id : '') + ':' + (foundCls ? foundCls.id : '');
        if (newKey === this._stateKey && this._view) {
            return;
        }
        this._stateKey = newKey;

        this._state.member = foundMember;
        this._state.classInfo = foundCls;
        this._state.provider = provider;
        this.updateView();
    }

    private updateView(): void {
        if (!this._view) {
            return;
        }
        this._view.webview.html = this.getHtml();
    }

    private clearView(): void {
        this._stateKey = '';
        this._state = { member: undefined, classInfo: undefined, provider: undefined };
        if (this._view) {
            this._view.webview.html = this.getEmptyHtml();
        }
    }

    private ensureState(): { member: ClassMember; classInfo: ClassInfo; provider: ILanguageProvider } | undefined {
        if (this._state.member && this._state.provider) {
            const classInfo = this._state.classInfo || this.synthClassForStandalone(this._state.member);
            return { member: this._state.member, classInfo, provider: this._state.provider };
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return undefined;
        }

        const doc = editor.document;
        const provider = this._providerRegistry.getByDocument(doc);
        if (!provider) {
            return undefined;
        }

        const position = editor.selection.active;
        const parsed = this._codeExplorer.getParsedDocument(doc);
        if (!parsed) {
            return undefined;
        }

        for (const cls of parsed.classes) {
            for (const member of cls.members) {
                if (member.range.contains(position) || member.implementationRange?.contains(position)) {
                    this._state.member = member;
                    this._state.classInfo = cls;
                    this._state.provider = provider;
                    return { member, classInfo: cls, provider };
                }
            }
        }

        for (const proc of parsed.standaloneProcedures) {
            if (proc.range.contains(position) || proc.implementationRange?.contains(position)) {
                const synth = this.synthClassForStandalone(proc);
                this._state.member = proc;
                this._state.classInfo = undefined;
                this._state.provider = provider;
                return { member: proc, classInfo: synth, provider };
            }
        }

        return undefined;
    }

    private synthClassForStandalone(member: ClassMember): ClassInfo {
        const editor = vscode.window.activeTextEditor;
        return {
            id: 'standalone_' + member.id,
            name: '',
            fullName: '',
            classType: 'standalone',
            parentClass: undefined,
            interfaces: [],
            members: [member],
            range: member.range,
            isInterface: false,
            isRecord: false,
            isSealed: false,
            fileUri: editor ? editor.document.uri : member.range as unknown as vscode.Uri,
        };
    }

    public async handleEdit(): Promise<void> {
        const state = this.ensureState();
        if (!state) {
            return;
        }
        const { member, classInfo, provider } = state;

        const doc = vscode.window.activeTextEditor?.document;
        if (!doc) {
            return;
        }

        await ops.editMember(this._extensionContext, doc, provider, classInfo, member, this._codeGenerator, this._codeExplorer);
    }

    public async handleDelete(): Promise<void> {
        const state = this.ensureState();
        if (!state) {
            return;
        }
        const { member, classInfo } = state;

        const doc = vscode.window.activeTextEditor?.document;
        if (!doc) {
            return;
        }

        const success = await ops.deleteMember(doc, classInfo, member, this._codeGenerator, this._codeExplorer);
        if (success) {
            this.clearView();
        }
    }

    public async handleRename(): Promise<void> {
        const state = this.ensureState();
        if (!state) {
            return;
        }
        const { member, classInfo, provider } = state;

        const doc = vscode.window.activeTextEditor?.document;
        if (!doc) {
            return;
        }

        await ops.renameMember(doc, classInfo, member, provider, this._codeExplorer);
    }

    private async handleNavigate(): Promise<void> {
        const { member } = this._state;
        if (!member) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.selection = new vscode.Selection(member.range.start, member.range.start);
            editor.revealRange(
                new vscode.Range(member.range.start, member.range.start),
                vscode.TextEditorRevealType.InCenter
            );
        }
    }

    private getEmptyHtml(): string {
        const nonce = getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${nonce}'; script-src 'unsafe-inline' 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 12px; }
.empty { color: var(--vscode-descriptionForeground); text-align: center; padding: 20px 8px; }
.empty .icon { font-size: 28px; margin-bottom: 8px; opacity: 0.5; }
.empty p { font-size: 12px; line-height: 1.5; }
.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--vscode-descriptionForeground); margin-bottom: 6px; letter-spacing: 0.5px; }
.shortcuts { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); }
.shortcut-grid { display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; align-items: center; }
.sc-action { font-size: 12px; color: var(--vscode-foreground); }
kbd { display: inline-block; padding: 1px 5px; font-size: 10px; font-family: var(--vscode-editor-font-family, Consolas, monospace); line-height: 1.4; color: var(--vscode-descriptionForeground); background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.12)); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.35)); border-radius: 3px; }
</style>
</head>
<body>
<div class="empty">
<div class="icon">$(symbol-misc)</div>
<p>Place cursor on a class member in the editor to view its details</p>
</div>
</body>
</html>`;
    }

    private getHtml(): string {
        const nonce = getNonce();
        const { member, classInfo } = this._state;

        if (!classInfo && !member) {
            return this.getEmptyHtml();
        }

        let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${nonce}'; script-src 'unsafe-inline' 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 12px; }
.section { margin-bottom: 12px; }
.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--vscode-descriptionForeground); margin-bottom: 6px; letter-spacing: 0.5px; }
.class-header { display: flex; align-items: center; gap: 6px; padding: 8px; background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.1)); border-radius: 4px; margin-bottom: 12px; }
.class-header .name { font-weight: 600; font-size: 14px; }
.class-header .type { font-size: 11px; color: var(--vscode-descriptionForeground); }
.member-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.member-header .name { font-size: 15px; font-weight: 700; }
.member-header .kind-badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); text-transform: uppercase; letter-spacing: 0.5px; }
.prop-row { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 12px; align-items: baseline; }
.prop-item { display: inline-flex; align-items: baseline; gap: 4px; }
.prop-label { font-size: 11px; color: var(--vscode-descriptionForeground); font-weight: 500; }
.prop-value { font-size: 13px; font-family: var(--vscode-editor-font-family, Consolas, monospace); }
.params-list { list-style: none; padding-left: 12px; }
.params-list li { font-family: var(--vscode-editor-font-family, Consolas, monospace); font-size: 12px; padding: 1px 0; }
.params-list li .dir { color: var(--vscode-symbolIcon-keywordForeground, #569cd6); }
.params-list li .pname { color: var(--vscode-symbolIcon-variableForeground, #9cdcfe); }
.params-list li .ptype { color: var(--vscode-symbolIcon-typeParameterForeground, #4ec9b0); }
.actions { display: flex; gap: 6px; flex-wrap: nowrap; margin-top: 12px; }
.btn { padding: 5px 12px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500; font-family: inherit; }
kbd { display: inline-block; padding: 1px 5px; margin-left: 4px; font-size: 10px; font-family: var(--vscode-editor-font-family, Consolas, monospace); line-height: 1.4; color: var(--vscode-descriptionForeground); background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.12)); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.35)); border-radius: 3px; vertical-align: middle; }
.btn-edit { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.btn-delete { background: #d32f2f; color: #fff; }
.btn-rename { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
.btn-nav { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
.btn:hover { opacity: 0.9; }
.divider { height: 1px; background: var(--vscode-input-border, rgba(128,128,128,0.3)); margin: 10px 0; }
.empty-section { color: var(--vscode-descriptionForeground); font-style: italic; }
.shortcuts { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); }
.shortcut-grid { display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; align-items: center; }
.sc-action { font-size: 12px; color: var(--vscode-foreground); }
</style>
</head>
<body>`;

        if (classInfo) {
            html += `<div class="class-header">
<div class="name">${escapeHtml(classInfo.name)}</div>
<div class="type">${classInfo.isInterface ? 'interface' : classInfo.isRecord ? 'record' : classInfo.classType || 'class'}${classInfo.parentClass ? ' → ' + escapeHtml(classInfo.parentClass) : ''}</div>
</div>`;
        } else {
            html += `<div class="class-header">
<div class="name">File-level</div>
<div class="type">standalone routine</div>
</div>`;
        }

        if (member) {
            const kindLabel = member.kind === MemberKind.Constructor ? 'Constructor'
                : member.kind === MemberKind.Destructor ? 'Destructor'
                : member.kind.charAt(0).toUpperCase() + member.kind.slice(1);

            html += `<div class="member-header">
<span class="name">${escapeHtml(member.name)}</span>
<span class="kind-badge">${kindLabel}</span>
</div>`;

            html += `<div class="divider"></div>`;

            html += `<div class="prop-row">`;
            html += `<span class="prop-item"><span class="prop-label">Visibility</span><span class="prop-value">${member.visibility}</span></span>`;

            if (member.returnType) {
                html += `<span class="prop-item"><span class="prop-label">Return Type</span><span class="prop-value">${escapeHtml(member.returnType)}</span></span>`;
            }
            if (member.type) {
                html += `<span class="prop-item"><span class="prop-label">Type</span><span class="prop-value">${escapeHtml(member.type)}</span></span>`;
            }
            if (member.isStatic) {
                html += `<span class="prop-item"><span class="prop-label">Static</span><span class="prop-value">yes</span></span>`;
            }
            if (member.isVirtual) {
                html += `<span class="prop-item"><span class="prop-label">Virtual</span><span class="prop-value">yes</span></span>`;
            }
            if (member.isAbstract) {
                html += `<span class="prop-item"><span class="prop-label">Abstract</span><span class="prop-value">yes</span></span>`;
            }
            if (member.isOverride) {
                html += `<span class="prop-item"><span class="prop-label">Override</span><span class="prop-value">yes</span></span>`;
            }
            if (member.modifiers.length > 0) {
                html += `<span class="prop-item"><span class="prop-label">Modifiers</span><span class="prop-value">${escapeHtml(member.modifiers.join(', '))}</span></span>`;
            }
            html += `</div>`;

            if (member.parameters.length > 0) {
                html += `<div class="section"><div class="section-title">Parameters</div><ul class="params-list">`;
                for (const p of member.parameters) {
                    const dir = p.isVar ? '<span class="dir">var </span>' : p.isOut ? '<span class="dir">out </span>' : p.isConst ? '<span class="dir">const </span>' : '';
                    html += `<li>${dir}<span class="pname">${escapeHtml(p.name)}</span>: <span class="ptype">${escapeHtml(p.type)}</span></li>`;
                }
                html += `</ul></div>`;
            }

            html += `<div class="divider"></div>`;
            html += `<div class="actions">
<button class="btn btn-edit" id="btnEdit">Edit</button>
<button class="btn btn-rename" id="btnRename">Rename</button>
<button class="btn btn-delete" id="btnDelete">Delete</button>
</div>`;
        } else {
            html += `<p class="empty-section">No member selected. Place cursor on a method, field, or property.</p>`;
        }

        html += `<script nonce="${nonce}">
(function() {
    var vscodeApi = acquireVsCodeApi();
    function bind(id, cmd) {
        var el = document.getElementById(id);
        if (el) { el.addEventListener('click', function() { vscodeApi.postMessage({ command: cmd }); }); }
    }
    bind('btnEdit', 'edit');
    bind('btnRename', 'rename');
    bind('btnDelete', 'delete');
})();
</script>`;

        html += `</body></html>`;
        return html;
    }
}

function getNonce(): string {
    let result = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
