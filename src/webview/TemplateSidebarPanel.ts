import * as vscode from 'vscode';
import { Template } from '../models/Template';
import { TemplateStore, TemplateScope, ScopedTemplate } from '../services/TemplateStore';
import { TemplateService } from '../services/TemplateService';

/**
 * "Templates" sidebar view: lists user templates (workspace + global scopes)
 * and built-ins. Each template can be inserted at the cursor with one click —
 * snippet placeholders (${1:label}, $0) act as the parameters and are filled
 * in natively by VS Code when the snippet is inserted. User templates can be
 * created, edited and deleted directly from the sidebar; built-ins are
 * insert-only.
 */
export class TemplateSidebarPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ceTemplates';

    private _view?: vscode.WebviewView;
    private _mode: 'list' | 'form' = 'list';
    private _editing?: { originalName: string | undefined; scope: TemplateScope };
    // Language of the active editor, used to filter the list to the templates
    // that apply to the file being edited.
    private _currentLanguage?: string;
    private _showAll = false;
    private _editorWatchers: vscode.Disposable[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _store: TemplateStore,
        private readonly _service: TemplateService,
        private readonly _supportedLanguages: string[]
    ) {}

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        this._currentLanguage = vscode.window.activeTextEditor?.document.languageId;

        for (const d of this._editorWatchers) { d.dispose(); }
        this._editorWatchers = [
            vscode.window.onDidChangeActiveTextEditor(editor => {
                this._currentLanguage = editor?.document.languageId;
                this._showAll = false;
                if (this._mode === 'list') { this.showList(); }
            }),
            vscode.workspace.onDidChangeTextDocument(e => {
                const editor = vscode.window.activeTextEditor;
                if (editor && e.document === editor.document) {
                    this._currentLanguage = editor.document.languageId;
                    if (this._mode === 'list') { this.showList(); }
                }
            }),
        ];

        webviewView.webview.html = this.getLoadingHtml();
        webviewView.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'ready': await this.showList(); break;
                case 'insert': await this.handleInsert(msg.name as string); break;
                case 'new': this.showForm(undefined, this.defaultScope()); break;
                case 'edit': await this.handleEdit(msg.name as string, msg.scope as TemplateScope); break;
                case 'delete': await this.handleDelete(msg.name as string, msg.scope as TemplateScope); break;
                case 'save': await this.handleSave(msg.data as FormPayload); break;
                case 'cancel': await this.showList(); break;
                case 'toggleShowAll': this._showAll = !this._showAll; await this.showList(); break;
            }
        });
        this.showList();
    }

    private defaultScope(): TemplateScope {
        return this._store.workspaceAvailable ? 'workspace' : 'global';
    }

    private async showList(): Promise<void> {
        this._mode = 'list';
        this._editing = undefined;
        await this.update();
    }

    private showForm(template: Template | undefined, scope: TemplateScope): void {
        this._mode = 'form';
        this._editing = { originalName: template?.name, scope };
        this._formTemplate = template;
        this.update();
    }

    private _formTemplate?: Template;

    private async update(): Promise<void> {
        if (!this._view) { return; }
        this._view.webview.html = this._mode === 'list'
            ? await this.getListHtml()
            : this.getFormHtml(this._formTemplate, this._editing?.scope ?? this.defaultScope());
    }

    private async findTemplate(name: string): Promise<{ template: Template; scope?: TemplateScope } | undefined> {
        const user = await this._store.readAll();
        const found = user.find(t => t.name === name);
        if (found) { return { template: found, scope: found.scope }; }
        const builtin = this._service.getAll().find(t => t.name === name);
        return builtin ? { template: builtin } : undefined;
    }

    private async handleInsert(name: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('CE: Open a file to insert a template.');
            return;
        }
        const found = await this.findTemplate(name);
        if (!found) {
            vscode.window.showWarningMessage('CE: Template "' + name + '" not found.');
            return;
        }
        await editor.insertSnippet(new vscode.SnippetString(found.template.body));
    }

    private async handleEdit(name: string, scope: TemplateScope): Promise<void> {
        const user = await this._store.readAll();
        const found = user.find(t => t.name === name && t.scope === scope);
        if (!found) { return; }
        this.showForm(found, found.scope);
    }

    private async handleDelete(name: string, scope: TemplateScope): Promise<void> {
        const confirm = await vscode.window.showWarningMessage(
            `Delete template "${name}" (${scope})?`,
            { modal: true },
            'Delete'
        );
        if (confirm !== 'Delete') { return; }
        await this._store.remove(scope, name);
        await this.showList();
    }

    private async handleSave(data: FormPayload): Promise<void> {
        const template: Template = {
            name: (data.name || '').trim(),
            prefix: (data.prefix || '').trim() || undefined,
            description: (data.description || '').trim() || undefined,
            languages: data.languages && data.languages.length > 0 ? data.languages.filter(Boolean) : undefined,
            body: data.body ?? '',
        };
        if (!template.name) {
            vscode.window.showErrorMessage('CE: Template name is required.');
            return;
        }
        if (!template.body.trim()) {
            vscode.window.showErrorMessage('CE: Template body is required.');
            return;
        }
        const scope: TemplateScope = data.scope === 'global' || !this._store.workspaceAvailable ? 'global' : 'workspace';
        try {
            await this._store.save(scope, data.originalName ?? undefined, template);
        } catch (e) {
            vscode.window.showErrorMessage('CE: ' + (e instanceof Error ? e.message : String(e)));
            return;
        }
        await this.showList();
    }

    // ---------- HTML ----------

    private getLoadingHtml(): string {
        return '<!DOCTYPE html><html><body style="font-family:var(--vscode-font-family);color:var(--vscode-descriptionForeground);padding:10px">Loading templates…</body></html>';
    }

    private async getListHtml(): Promise<string> {
        const nonce = getNonce();
        const user = await this._store.readAll();
        const builtins = this._service.getAll()
            .filter(t => !user.some(u => u.name === t.name))
            .sort((a, b) => a.name.localeCompare(b.name));

        // Filter to the templates that apply to the file being edited: a
        // template without languages targets every language.
        const lang = this._currentLanguage;
        const applies = (t: Template) =>
            this._showAll || !lang || !t.languages || t.languages.length === 0 || t.languages.includes(lang);
        const filteredUser = user.filter(t => applies(t));
        const filteredBuiltins = builtins.filter(t => applies(t));
        const hiddenCount = (user.length + builtins.length) - (filteredUser.length + filteredBuiltins.length);

        const filterHeader = `<div class="filterbar">
<span class="filter-label">${this._showAll || !lang
            ? 'All templates'
            : 'For <b>' + escapeHtml(lang) + '</b>'}</span>
${hiddenCount > 0 || this._showAll
            ? `<button class="filter-toggle" id="btnShowAll">${this._showAll ? 'filter: current file' : `show all (${hiddenCount} hidden)`}</button>`
            : ''}
</div>`;

        const row = (t: Template, scopeLabel: string, scopeClass: string, editable: boolean, scope?: TemplateScope) => {
            const langs = t.languages && t.languages.length > 0 ? t.languages.join(', ') : 'all languages';
            const escName = escapeHtml(t.name).replace(/"/g, '&quot;');
            return `<div class="tpl-row">
<div class="tpl-main" data-insert="${escName}" title="Click to insert at cursor">
<div class="tpl-name">${escapeHtml(t.name)} <span class="badge ${scopeClass}">${scopeLabel}</span></div>
<div class="tpl-desc">${escapeHtml(t.description || (t.prefix ? '(' + t.prefix + ')' : ''))}</div>
<div class="tpl-langs">${escapeHtml(langs)}</div>
</div>
<div class="tpl-actions">
<button class="act" data-insert="${escName}" title="Insert at cursor">▶</button>
${editable ? `<button class="act" data-edit="${escName}" data-scope="${scope}" title="Edit">✏️</button>
<button class="act" data-del="${escName}" data-scope="${scope}" title="Delete">🗑️</button>` : ''}
</div>
</div>`;
        };

        const userRows = filteredUser
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(t => row(t, t.scope, t.scope === 'workspace' ? 'badge-ws' : 'badge-global', true, t.scope))
            .join('');
        const builtinRows = filteredBuiltins.map(t => row(t, 'built-in', 'badge-builtin', false)).join('');

        const emptyHint = (filteredUser.length + filteredBuiltins.length) === 0
            ? (user.length + builtins.length) === 0
                ? '<p class="empty">No templates yet. Click “＋ New template” to create one.</p>'
                : `<p class="empty">No template for <b>${escapeHtml(lang ?? 'this file')}</b>.</p>`
            : '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 10px; overflow-y: auto; }
.top { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.btn-new { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; padding: 4px 10px; cursor: pointer; font-family: inherit; font-size: 12px; }
.filterbar { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px; }
.filter-label { font-size: 11px; color: var(--vscode-descriptionForeground); }
.filter-toggle { background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.2)); color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); border: none; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-family: inherit; font-size: 10px; }
.section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--vscode-descriptionForeground); margin: 8px 0 4px; }
.tpl-row { display: flex; align-items: center; gap: 4px; border-radius: 4px; padding: 4px 6px; margin-bottom: 2px; }
.tpl-row:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.15)); }
.tpl-main { flex: 1; min-width: 0; cursor: pointer; }
.tpl-name { font-weight: 600; font-size: 12px; }
.tpl-desc { font-size: 11px; color: var(--vscode-descriptionForeground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tpl-langs { font-size: 10px; color: var(--vscode-descriptionForeground); font-style: italic; }
.badge { display: inline-block; padding: 0 6px; border-radius: 8px; font-size: 9px; font-weight: 600; vertical-align: middle; }
.badge-ws { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.badge-global { background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.3)); color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); }
.badge-builtin { background: rgba(127,127,127,0.18); color: var(--vscode-descriptionForeground); }
.tpl-actions { display: flex; gap: 2px; }
.act { background: transparent; border: none; cursor: pointer; font-size: 12px; padding: 2px 3px; line-height: 1; }
.act:hover { filter: brightness(1.3); }
.empty { color: var(--vscode-descriptionForeground); font-style: italic; font-size: 12px; }
</style>
</head>
<body>
<div class="top"><button class="btn-new" id="btnNew">＋ New template</button></div>
${filterHeader}
${emptyHint}
${userRows ? '<div class="section-title">My templates</div>' + userRows : ''}
${builtinRows ? '<div class="section-title">Built-in</div>' + builtinRows : ''}
<script nonce="${nonce}">
(function() {
    var api = acquireVsCodeApi();
    document.getElementById('btnNew').addEventListener('click', function() { api.postMessage({ command: 'new' }); });
    var bs = document.getElementById('btnShowAll');
    if (bs) { bs.addEventListener('click', function() { api.postMessage({ command: 'toggleShowAll' }); }); }
    document.querySelectorAll('[data-insert]').forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            api.postMessage({ command: 'insert', name: el.getAttribute('data-insert') });
        });
    });
    document.querySelectorAll('[data-edit]').forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            api.postMessage({ command: 'edit', name: el.getAttribute('data-edit'), scope: el.getAttribute('data-scope') });
        });
    });
    document.querySelectorAll('[data-del]').forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            api.postMessage({ command: 'delete', name: el.getAttribute('data-del'), scope: el.getAttribute('data-scope') });
        });
    });
})();
</script>
</body>
</html>`;
    }

    private getFormHtml(initial: Template | undefined, scope: TemplateScope): string {
        const nonce = getNonce();
        const title = initial ? 'Edit template' : 'New template';
        const scopes = this._store.workspaceAvailable
            ? '<option value="workspace"' + (scope === 'workspace' ? ' selected' : '') + '>workspace (.vscode/ce-templates.json)</option>'
            + '<option value="global"' + (scope === 'global' ? ' selected' : '') + '>global (all projects)</option>'
            : '<option value="global">global (all projects)</option>';
        const checked = new Set(initial?.languages ?? []);
        const langBoxes = this._supportedLanguages.map(id =>
            '<label class="lang-item"><input type="checkbox" class="lang-cb" value="' + escapeHtml(id) + '"' + (checked.has(id) ? ' checked' : '') + '> ' + escapeHtml(id) + '</label>'
        ).join('');
        const extraLangBoxes = (initial?.languages ?? [])
            .filter(l => !this._supportedLanguages.includes(l))
            .map(id => '<label class="lang-item"><input type="checkbox" class="lang-cb" value="' + escapeHtml(id) + '" checked> ' + escapeHtml(id) + '</label>')
            .join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 10px; }
h2 { margin-bottom: 8px; font-size: 13px; font-weight: 600; }
label { display: block; margin-bottom: 3px; font-weight: 500; font-size: 11px; color: var(--vscode-descriptionForeground); }
input, select, textarea { width: 100%; padding: 4px 6px; border: 1px solid var(--vscode-input-border, transparent); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 3px; font-family: inherit; font-size: inherit; }
textarea { font-family: var(--vscode-editor-font-family, monospace); min-height: 140px; resize: vertical; }
input:focus, select:focus, textarea:focus { outline: 1px solid var(--vscode-focusBorder, #007fd4); border-color: var(--vscode-focusBorder, #007fd4); }
.row { margin-bottom: 8px; }
.row2 { display: flex; gap: 8px; margin-bottom: 8px; } .row2 > div { flex: 1; }
.parambar { display: flex; gap: 4px; margin: 4px 0; flex-wrap: wrap; }
.parambtn { font-size: 11px; padding: 2px 8px; cursor: pointer; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 3px; font-family: var(--vscode-editor-font-family, monospace); }
.preview-box { background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.12)); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); border-radius: 3px; padding: 6px; font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; white-space: pre-wrap; max-height: 120px; overflow-y: auto; margin-top: 4px; }
.lang-grid { display: flex; flex-wrap: wrap; gap: 4px 12px; padding: 4px 0; }
.lang-item { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--vscode-foreground); margin: 0; font-weight: 400; }
.lang-item input { width: auto; }
.hint { font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 3px; }
.notify { display: none; color: var(--vscode-errorForeground, #f48771); font-size: 11px; margin: 6px 0; }
.actions { margin-top: 10px; display: flex; gap: 6px; justify-content: flex-end; }
button.primary, button.secondary { cursor: pointer; border: none; border-radius: 3px; font-family: inherit; }
.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 5px 14px; font-size: 12px; }
.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); padding: 5px 12px; font-size: 12px; }
</style>
</head>
<body>
<h2>${title}</h2>
<div class="row"><label>Name *</label><input type="text" id="tplName" value="${escapeHtml(initial?.name ?? '')}" autofocus></div>
<div class="row2">
<div><label>Prefix (completion trigger)</label><input type="text" id="tplPrefix" value="${escapeHtml(initial?.prefix ?? '')}">
<div class="hint">Typed in the editor, the prefix filters the completion list and loads this template.</div>
</div>
<div><label>Save to</label><select id="tplScope">${scopes}</select></div>
</div>
<div class="row"><label>Description</label><input type="text" id="tplDesc" value="${escapeHtml(initial?.description ?? '')}"></div>
<div class="row"><label>Languages (none checked = all languages)</label>
<div class="lang-grid">${langBoxes}${extraLangBoxes}</div>
</div>
<div class="row">
<label>Body * — snippet syntax, parameters = tab stops</label>
<div class="parambar">
<button class="parambtn" id="btnParam" title="Insert a ${'\u0024'}{n:parameter} tab stop at cursor">➕ parameter</button>
<button class="parambtn" id="btnFinal" title="Insert $0 (final cursor position)">$0 cursor final</button>
</div>
<textarea id="tplBody" spellcheck="false">${escapeHtml(initial?.body ?? '')}</textarea>
<div class="hint">Parameters: <code>${'\u0024'}{1:name}</code>, <code>${'\u0024'}{2:type}</code>… — jump between them with Tab when inserting. <code>${'\u0024'}0</code> = final cursor position. In this box: <b>Tab</b>/<b>Shift+Tab</b> indents/outdents (2 spaces), <b>Enter</b> keeps the indentation (extra level after <code>{</code>).</div>
<div class="preview-box" id="preview"></div>
</div>
<div class="notify" id="notify"></div>
<div class="actions">
<button class="secondary" id="btnCancel">Cancel</button>
<button class="primary" id="btnSave">Save</button>
</div>
<script nonce="${nonce}">
(function() {
    var api = acquireVsCodeApi();
    var bodyEl = document.getElementById('tplBody');
    var notify = document.getElementById('notify');
    var preview = document.getElementById('preview');
    function refreshPreview() { preview.textContent = bodyEl.value; }
    bodyEl.addEventListener('input', refreshPreview);
    refreshPreview();
    function insertAtCursor(text) {
        var s = bodyEl.selectionStart || 0, e = bodyEl.selectionEnd || 0;
        var before = bodyEl.value.slice(0, s), after = bodyEl.value.slice(e);
        bodyEl.value = before + text + after;
        var pos = s + text.length;
        bodyEl.setSelectionRange(pos, pos);
        bodyEl.focus();
        refreshPreview();
    }
    function nextParamIndex() {
        var max = 0, m, re = /\\$\\{(\\d+):/g;
        while ((m = re.exec(bodyEl.value)) !== null) { max = Math.max(max, parseInt(m[1], 10)); }
        return max + 1;
    }
    document.getElementById('btnParam').addEventListener('click', function() {
        var idx = nextParamIndex();
        insertAtCursor('\${' + idx + ':parameter}');
    });
    document.getElementById('btnFinal').addEventListener('click', function() { insertAtCursor('$0'); });
    bodyEl.addEventListener('keydown', function(e) {
        var INDENT = '  ';
        if (e.key === 'Tab') {
            e.preventDefault();
            var s = bodyEl.selectionStart, se = bodyEl.selectionEnd, v = bodyEl.value;
            if (s !== se && v.slice(s, se).indexOf('\\n') >= 0) {
                var ls = v.lastIndexOf('\\n', s - 1) + 1;
                var block = v.slice(ls, se).split('\\n');
                if (e.shiftKey) {
                    block = block.map(function(l) { return l.replace(/^ {1,2}/, '').replace(/^\\t/, ''); });
                } else {
                    block = block.map(function(l) { return INDENT + l; });
                }
                var nb = block.join('\\n');
                bodyEl.value = v.slice(0, ls) + nb + v.slice(se);
                bodyEl.setSelectionRange(ls, ls + nb.length);
            } else if (e.shiftKey) {
                var ls2 = v.lastIndexOf('\\n', s - 1) + 1;
                var line = v.slice(ls2);
                var m = line.match(/^( {1,2}|\\t)/);
                if (m) {
                    bodyEl.value = v.slice(0, ls2) + line.slice(m[1].length);
                    var p2 = Math.max(ls2, s - m[1].length);
                    bodyEl.setSelectionRange(p2, p2);
                }
            } else {
                insertAtCursor(INDENT);
            }
            refreshPreview();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            var s3 = bodyEl.selectionStart;
            var v3 = bodyEl.value;
            var lstart = v3.lastIndexOf('\\n', s3 - 1) + 1;
            var cur = v3.slice(lstart, s3);
            var indent = (cur.match(/^[\\t ]*/) || [''])[0];
            var ins = '\\n' + indent + (/[{(]\\s*$/.test(cur) ? INDENT : '');
            var e3 = bodyEl.selectionEnd;
            bodyEl.value = v3.slice(0, s3) + ins + v3.slice(e3);
            var p3 = s3 + ins.length;
            bodyEl.setSelectionRange(p3, p3);
            refreshPreview();
        }
    });
    function notifyError(msg) { notify.textContent = msg; notify.style.display = 'block'; }
    function collect() {
        var langs = [];
        document.querySelectorAll('.lang-cb:checked').forEach(function(cb) { langs.push(cb.value); });
        return {
            name: document.getElementById('tplName').value,
            prefix: document.getElementById('tplPrefix').value,
            description: document.getElementById('tplDesc').value,
            languages: langs,
            body: bodyEl.value,
            scope: document.getElementById('tplScope').value,
            originalName: ${JSON.stringify(initial?.name ?? null).replace(/</g, '\\u003c')}
        };
    }
    function submit() {
        var d = collect();
        if (!d.name.trim()) { notifyError('Name is required.'); return; }
        if (!d.body.trim()) { notifyError('Body is required.'); return; }
        api.postMessage({ command: 'save', data: d });
    }
    document.getElementById('btnSave').addEventListener('click', submit);
    document.getElementById('btnCancel').addEventListener('click', function() { api.postMessage({ command: 'cancel' }); });
    document.getElementById('tplName').addEventListener('keydown', function(e) { if (e.key === 'Enter') { submit(); } });
    document.querySelectorAll('input:not([type=checkbox]),textarea,select').forEach(function(el) {
        el.addEventListener('keydown', function(e) { if (e.key === 'Escape') { api.postMessage({ command: 'cancel' }); } });
    });
})();
</script>
</body>
</html>`;
    }
}

interface FormPayload {
    name: string;
    prefix?: string;
    description?: string;
    languages?: string[];
    body: string;
    scope: TemplateScope;
    originalName?: string | null;
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getNonce(): string {
    let result = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
