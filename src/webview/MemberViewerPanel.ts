import * as vscode from 'vscode';
import { ClassInfo, ClassMember, MemberKind, MemberFormResult, ExtractSpec, FieldSpec, Visibility } from '../models/types';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { CodeGeneratorService } from '../services/CodeGeneratorService';
import { CodeExplorerService } from '../services/CodeExplorerService';
import * as ops from '../services/MemberOperations';
import { memberFormToSpec, generateFromSpec } from '../services/memberForm';
import { reviewDocument, ReviewFinding } from '../services/CodeReviewService';
import { buildExportData, ExportData } from '../services/ExportService';
import { generateMarkdown } from '../services/DocumentationGenerator';
import { collectDeadCode, DeadCodeItem } from '../services/DeadCodeDetector';
import { LocalScopeAnalyzer } from '../services/LocalScopeAnalyzer';

interface MemberViewerState {
    member: ClassMember | undefined;
    classInfo: ClassInfo | undefined;
  provider: ILanguageProvider | undefined;
}

export type ViewerMode = 'view' | 'edit' | 'add' | 'extract' | 'analytics' | 'variable';

/**
 * The kind of analytics report currently shown in the panel. Each maps to a
 * service helper that returns serializable data rendered inline by
 * `getAnalyticsHtml`.
 */
export type AnalyticsKind = 'review' | 'documentation' | 'export' | 'deadcode';

export interface EditSessionContext {
    mode: ViewerMode;
    member?: ClassMember;
    classInfo?: ClassInfo;
    provider?: ILanguageProvider;
    document?: vscode.TextDocument;
    selection?: vscode.Selection;
    kind?: MemberKind;
    renameOnly?: boolean;
    /** Preselected visibility for the form (e.g. chosen via a QuickPick on the class button). */
    visibility?: Visibility;
    candidateClasses?: ClassInfo[];
    allowStandaloneTarget?: boolean;
}

// Allowlist of command ids the webview may request via the 'run' message.
// Anything outside this set is ignored, preventing arbitrary command execution
// even if a future change introduces an unescaped interpolation in the webview.
const ALLOWED_RUN_COMMANDS = new Set<string>([
    'mmx.addMethod', 'mmx.addField', 'mmx.addProperty', 'mmx.addConstructor',
    'mmx.synchronizeDeclImpl', 'mmx.insertTemplate', 'mmx.manageTemplates',
    'mmx.refreshExplorer', 'mmx.filterTree', 'mmx.goToMember',
    'mmx.generateGettersSetters', 'mmx.insertDocHeader',
    'mmx.renameVariable', 'mmx.changeVariableType', 'mmx.deleteVariable',
    'mmx.editMember', 'mmx.renameMember', 'mmx.deleteMember',
]);

export class MemberViewerPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'mmxViewer';
    private _view?: vscode.WebviewView;
    private _state: MemberViewerState = { member: undefined, classInfo: undefined, provider: undefined };
    private _stateKey: string = '';
    private _debounceTimer: ReturnType<typeof setTimeout> | undefined;
    private readonly _scopeAnalyzer = new LocalScopeAnalyzer();

    private _mode: ViewerMode = 'view';
    // Active tab of the member view: 'detail' (selected member) or 'manage'
    // (add / edit / rename / delete any member of the current type at any time).
    private _tab: 'detail' | 'manage' = 'detail';
    private _sessionCtx?: EditSessionContext;
    private _resolveSession?: (result: MemberFormResult | ExtractSpec | undefined) => void;
    // The local variable currently being edited inline (mode 'variable').
    private _editingVariable?: { name: string; type?: string };
    // Analytics: serializable payload rendered inline by getAnalyticsHtml.
    private _analyticsKind?: AnalyticsKind;
    private _analyticsData?: ReviewFinding[] | ExportData | DeadCodeItem[] | string;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _providerRegistry: ProviderRegistryLike,
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
        // Invalidate the cached state key so the first cursor change after
        // (re)resolving the view forces a full re-render. Without this, a panel
        // that was already showing a member keeps its stale HTML across reloads.
        this._stateKey = '';

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this.getEmptyHtml();

        // If the sidebar is closed while a session is in flight, cancel it so the
        // pending promise resolves and _mode resets (otherwise cursor tracking
        // stays disabled and the caller hangs forever).
        webviewView.onDidDispose(() => {
            if (this._resolveSession) { this.endSession(undefined); }
            this._view = undefined;
        });

        webviewView.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'submit': this.endSession(msg.data as MemberFormResult); break;
                case 'cancel': this.endSession(undefined); break;
                case 'preview': this.handleSessionPreview(msg.data as MemberFormResult); break;
                case 'extractSubmit': this.endSession(msg.data as ExtractSpec); break;
                case 'run': if (typeof msg.cmd === 'string' && ALLOWED_RUN_COMMANDS.has(msg.cmd)) { await vscode.commands.executeCommand(msg.cmd); } break;
                case 'editVariable': await this.handleEditVariable(msg.name as string); break;
                case 'setTab': this.setTab(msg.tab === 'manage' ? 'manage' : 'detail'); break;
                case 'manageAction': await this.handleManageAction(String(msg.act), String(msg.id)); break;
                case 'renameMember': await this.handleInlineRename(msg.name as string); break;
                case 'memberAction': await this.handleMemberAction(msg.act as string); break;
                case 'deleteVariableByName': await this.handleDeleteVariableByName(msg.name as string); break;
                case 'addVariable': this.handleAddVariable(); break;
                case 'submitVariable': await this.handleSubmitVariable(msg.data as { name: string; type: string }); break;
                case 'submitNewVariable': await this.handleSubmitNewVariable(msg.data as { name: string; type: string }); break;
                case 'promoteVariable': await this.handlePromoteVariable(msg.visibility as string); break;
                case 'cancelVariable': this.endVariableEdit(); break;
                case 'runAnalytics': await this.handleRunAnalytics(msg.kind as AnalyticsKind); break;
                case 'closeAnalytics': this.endAnalytics(); break;
                case '__diag': console.error('[MMX] webview script error:', msg.error); break;
            }
        });

        const editor = vscode.window.activeTextEditor;
        if (this._mode !== 'view') {
            this.updateView();
        } else if (editor) {
            this.onCursorChanged(editor);
        }
    }

    private scheduleCursorUpdate(editor: vscode.TextEditor): void {
        if (this._mode !== 'view') { return; }
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
        if (this._mode === 'view') {
            this._view.webview.html = this.getHtml();
            return;
        }
        if (this._mode === 'analytics') {
            this._view.webview.html = this.getAnalyticsHtml();
            return;
        }
        if (this._mode === 'variable') {
            this._view.webview.html = this.getVariableEditHtml();
            return;
        }
        this._view.webview.html = this.getSessionHtml();
    }

    private clearView(): void {
        this._stateKey = '';
        this._state = { member: undefined, classInfo: undefined, provider: undefined };
        if (this._view && this._mode === 'view') {
            this._view.webview.html = this.getEmptyHtml();
        }
    }

    public async beginSession(ctx: EditSessionContext): Promise<MemberFormResult | ExtractSpec | undefined> {
        // Ensure the sidebar exists BEFORE touching session state, so the await
        // below cannot interleave with cancellation / resolver assignment.
        if (!this._view) {
            try { await vscode.commands.executeCommand(`${MemberViewerPanel.viewType}.focus`); } catch { /* view unavailable */ }
        }
        if (this._view) { this._view.show?.(false); }

        return new Promise<MemberFormResult | ExtractSpec | undefined>((resolve) => {
            // The Promise executor runs synchronously, so two overlapping calls
            // cannot interleave here: cancel any prior session, then install this
            // one atomically.
            this._resolveSession?.(undefined);
            this._sessionCtx = ctx;
            this._mode = ctx.mode;
            this._resolveSession = resolve;
            if (this._view) {
                this.updateView();
            }
            // If the view still isn't resolved, resolveWebviewView will render the
            // pending session form once the user reveals the sidebar.
        });
    }

    private endSession(result: MemberFormResult | ExtractSpec | undefined): void {
        const resolve = this._resolveSession;
        this._resolveSession = undefined;
        this._mode = 'view';
        this._sessionCtx = undefined;
        // Force a re-render when leaving a session. Without this, onCursorChanged
        // short-circuits on an unchanged _stateKey (cursor still on the same member),
        // so the form stays on screen after Cancel/Submit and the buttons appear dead.
        this._stateKey = '';
        // Resolve the pending promise FIRST so the caller (edit/rename/extract)
        // proceeds even if the view refresh below throws.
        resolve?.(result);
        const editor = vscode.window.activeTextEditor;
        if (editor) { this.onCursorChanged(editor); } else { this.updateView(); }
    }

    /**
     * Runs the analytics service for `kind` against the active document and
     * renders the result inline. Falls back to a warning if no document /
     * provider is available. The (potentially expensive) dead-code scan runs
     * across the whole workspace; the other four operate on the current file.
     */
    public async handleRunAnalytics(kind: AnalyticsKind): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Open a source file to analyze.');
            return;
        }
        const provider = this._providerRegistry.getByDocument(editor.document);
        if (!provider) {
            vscode.window.showWarningMessage('No language provider for this file.');
            return;
        }
        const doc = editor.document;
        try {
            switch (kind) {
                case 'review': {
                    this._analyticsData = reviewDocument(doc, provider);
                    break;
                }
                case 'documentation': {
                    const parsed = provider.parseDocument(doc);
                    this._analyticsData = generateMarkdown(parsed, doc.fileName.split(/[/\\]/).pop() || doc.fileName);
                    break;
                }
                case 'export': {
                    const parsed = provider.parseDocument(doc);
                    this._analyticsData = buildExportData(parsed, doc.fileName, provider.displayName);
                    break;
                }
                case 'deadcode': {
                    const extensions = provider.fileExtensions.map(e => e.substring(1));
                    this._analyticsData = await vscode.window.withProgress(
                        { location: vscode.ProgressLocation.Window, title: 'CE: Scanning workspace for dead code…' },
                        (progress) => collectDeadCode(this._providerRegistry, extensions, (done, total, file) => {
                            progress.report({ message: `${done}/${total} ${file}` });
                        }),
                    );
                    break;
                }
            }
            this._analyticsKind = kind;
            this._mode = 'analytics';
            this.updateView();
        } catch (e) {
            vscode.window.showErrorMessage('Analytics failed: ' + (e instanceof Error ? e.message : String(e)));
        }
    }

    /** Leaves the analytics view and returns to member tracking. */
    private endAnalytics(): void {
        this._mode = 'view';
        this._analyticsKind = undefined;
        this._analyticsData = undefined;
        this._stateKey = ''; // force re-render of the member view
        const editor = vscode.window.activeTextEditor;
        if (editor) { this.onCursorChanged(editor); } else { this.updateView(); }
    }

    /**
     * Runs a member-scoped action (edit / rename / doc header / delete) on the
     * member CURRENTLY DISPLAYED in the panel — no cursor re-resolution, so the
     * buttons always act on exactly what the user sees.
     */
    private setTab(tab: 'detail' | 'manage'): void {
        this._tab = tab;
        this._stateKey = '';
        const editor = vscode.window.activeTextEditor;
        if (editor && this._mode === 'view') { this.onCursorChanged(editor); } else { this.updateView(); }
    }

    /** Members listed by the Manage tab: the current type's members, or the file's standalone routines. */
    private manageTargets(): ClassMember[] {
        const { classInfo } = this._state;
        if (classInfo) {
            return [...classInfo.members].sort((a, b) => a.range.start.line - b.range.start.line);
        }
        const doc = vscode.window.activeTextEditor?.document;
        const parsed = doc ? this._codeExplorer.getParsedDocument(doc) : undefined;
        return parsed ? [...parsed.standaloneProcedures] : [];
    }

    /** Edit / rename / delete / go-to on ANY member listed in the Manage tab (not only the one under the cursor). */
    private async handleManageAction(act: string, id: string): Promise<void> {
        const member = this.manageTargets().find(m => m.id === id);
        if (!member) {
            vscode.window.showWarningMessage('CE: This member changed in the meantime, the list was refreshed.');
            this.setTab('manage');
            return;
        }
        const doc = vscode.window.activeTextEditor?.document;
        if (!doc) {
            vscode.window.showWarningMessage('CE: Open this member\'s file first.');
            return;
        }
        if (act === 'go') {
            const pos = member.implementationRange?.start ?? member.range.start;
            await vscode.window.showTextDocument(doc, { selection: new vscode.Range(pos, pos) });
            return;
        }
        await this.handleMemberAction(act, { member, classInfo: this._state.classInfo });
    }

    private async handleMemberAction(act: string, target?: { member: ClassMember; classInfo: ClassInfo | undefined }): Promise<void> {
        const member = target ? target.member : this._state.member;
        const classInfo = target ? target.classInfo : this._state.classInfo;
        const provider = this._state.provider;
        if (!member || !provider) { return; }
        const doc = vscode.window.activeTextEditor?.document;
        if (!doc) {
            vscode.window.showWarningMessage('CE: Open this member\'s file first.');
            return;
        }
        const cls = classInfo ?? this.synthStandaloneClass(member, doc);
        switch (act) {
            case 'edit': {
                const result = await this.beginSession({
                    mode: 'edit', member, classInfo: cls, provider, document: doc,
                });
                if (!result) { return; }
                await ops.editMember(doc, provider, cls, member, this._codeGenerator, this._codeExplorer, result as MemberFormResult);
                break;
            }
            case 'rename': {
                if (!target) {
                    await this._view?.webview.postMessage({ command: 'startRename' });
                    break;
                }
                const renamed = await this.beginSession({
                    mode: 'edit', renameOnly: true, member, classInfo: cls, provider, document: doc,
                }) as MemberFormResult | undefined;
                if (renamed?.name) {
                    await ops.renameMember(doc, cls, member, provider, this._codeExplorer, renamed.name);
                }
                break;
            }
            case 'docHeader':
                await ops.insertDocHeader(doc, provider, cls, member);
                break;
            case 'delete':
                await ops.deleteMember(doc, cls, member, this._codeGenerator, this._codeExplorer);
                break;
        }
    }

    /**
     * Inline rename from the member header: the user clicked the member name in
     * the panel and typed a new one. Delegates to ops.renameMember, which
     * covers the class body, standalone procedures and paired files.
     */
    private async handleInlineRename(newName: string): Promise<void> {
        const { member, classInfo, provider } = this._state;
        const doc = vscode.window.activeTextEditor?.document;
        if (!member || !provider || !doc) { return; }
        const name = (newName || '').trim();
        if (!name || name === member.name) { return; }
        const cls = classInfo ?? this.synthStandaloneClass(member, doc);
        await ops.renameMember(doc, cls, member, provider, this._codeExplorer, name);
    }

    /** Minimal standalone ClassInfo for file-level routines (no enclosing class). */
    private synthStandaloneClass(member: ClassMember, doc: vscode.TextDocument): ClassInfo {
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
            fileUri: doc.uri,
        };
    }

    /**
     * Opens the inline variable editor for the named local/parameter. Finds the
     * variable in the current method scope (by name) and switches to the
     * 'variable' mode, rendering a compact Name + Type form.
     */
    public async handleEditVariable(name: string): Promise<void> {
        const state = this._state;
        if (!state.member || !state.provider) { return; }
        const doc = vscode.window.activeTextEditor?.document;
        if (!doc) { return; }
        const scope = this._scopeAnalyzer.getScope(doc, state.provider, state.member);
        const local = scope?.locals.find(l => l.name === name);
        if (!local) {
            vscode.window.showWarningMessage(`CE: Variable "${name}" not found in scope.`);
            return;
        }
        this._editingVariable = { name: local.name, type: local.type };
        this._mode = 'variable';
        this.updateView();
    }

    /**
     * Applies the variable edits: renames all occurrences (if the name changed)
     * and changes the declared type (if the type changed). Builds the edits
     * directly from the variable's declaration range and the scoped occurrence
     * scan, without popping an input box — the form already captured the values.
     */
    private async handleSubmitVariable(data: { name: string; type: string }): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { this.endVariableEdit(); return; }
        const doc = editor.document;
        const provider = this._state.provider;
        const member = this._state.member;
        const old = this._editingVariable;
        if (!provider || !member || !old) { this.endVariableEdit(); return; }

        const scope = this._scopeAnalyzer.getScope(doc, provider, member);
        const local = scope?.locals.find(l => l.name === old.name);
        if (!scope || !local) { this.endVariableEdit(); return; }

        const wsEdit = new vscode.WorkspaceEdit();
        let changed = false;

        // 1. Rename: scan all occurrences in the implementation range.
        if (data.name && data.name !== old.name) {
            const lines = doc.getText().split(/\r?\n/);
            const impl = member.implementationRange;
            if (impl) {
                const escaped = old.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp('\\b' + escaped + '\\b', 'g');
                const seen = new Set<string>();
                for (let ln = impl.start.line; ln <= impl.end.line && ln < lines.length; ln++) {
                    const text = lines[ln] ?? '';
                    regex.lastIndex = 0;
                    let m: RegExpExecArray | null;
                    while ((m = regex.exec(text)) !== null) {
                        const key = ln + ':' + m.index;
                        if (!seen.has(key)) {
                            seen.add(key);
                            wsEdit.replace(doc.uri, new vscode.Range(ln, m.index, ln, m.index + old.name.length), data.name);
                            changed = true;
                        }
                        regex.lastIndex = m.index + old.name.length;
                    }
                }
            }
        }

        // 2. Change type: replace the type token on the declaration line.
        if (data.type && local.type && data.type !== local.type) {
            const declLine = local.declarationRange.start.line;
            const lines = doc.getText().split(/\r?\n/);
            const text = lines[declLine] ?? '';
            const escapedType = local.type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const typeRegex = new RegExp('\\b' + escapedType + '\\b', 'g');
            const nameStart = local.range.start.character;
            const nameEnd = local.range.end.character;
            let tm: RegExpExecArray | null;
            while ((tm = typeRegex.exec(text)) !== null) {
                const tokStart = tm.index;
                const tokEnd = tokStart + local.type!.length;
                if (tokEnd <= nameStart || tokStart >= nameEnd) {
                    wsEdit.replace(doc.uri, new vscode.Range(declLine, tokStart, declLine, tokEnd), data.type);
                    changed = true;
                    break;
                }
                typeRegex.lastIndex = tm.index + 1;
            }
        }

        if (changed) {
            const ok = await vscode.workspace.applyEdit(wsEdit);
            if (ok) {
                vscode.window.showInformationMessage(`CE: Updated variable "${old.name}".`);
                this._codeExplorer.refresh();
            }
        }
        this.endVariableEdit();
    }

    /** Leaves the variable editor and returns to the member view. */
    private endVariableEdit(): void {
        this._mode = 'view';
        this._editingVariable = undefined;
        this._stateKey = ''; // force re-render
        const editor = vscode.window.activeTextEditor;
        if (editor) { this.onCursorChanged(editor); } else { this.updateView(); }
    }

    /**
     * Deletes a local variable by name: removes its declaration line from the
     * var section. Asks for confirmation first.
     */
    public async handleDeleteVariableByName(name: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        const doc = editor?.document;
        const provider = this._state.provider;
        const member = this._state.member;
        if (!doc || !provider || !member) { return; }
        const scope = this._scopeAnalyzer.getScope(doc, provider, member);
        const local = scope?.locals.find(l => l.name === name);
        if (!local) { return; }

        const choice = await vscode.window.showWarningMessage(`Delete variable "${name}"?`, { modal: true }, 'Delete');
        if (choice !== 'Delete') { return; }

        const line = local.declarationRange.start.line;
        const start = new vscode.Position(line, 0);
        const endLine = Math.min(line + 1, doc.lineCount - 1);
        const end = new vscode.Position(endLine, 0);
        const wsEdit = new vscode.WorkspaceEdit();
        wsEdit.delete(doc.uri, new vscode.Range(start, end));
        const ok = await vscode.workspace.applyEdit(wsEdit);
        if (ok) {
            vscode.window.showInformationMessage(`CE: Deleted variable "${name}".`);
            this._stateKey = '';
            this.onCursorChanged(editor!);
        }
    }

    /**
     * Opens the inline "Add Variable" form (empty Name + Type). The variable
     * is created in the method's var section on submit.
     */
    public handleAddVariable(): void {
        this._editingVariable = { name: '', type: '' };
        this._mode = 'variable';
        this.updateView();
    }

    /**
     * Inserts a new variable declaration into the method's var section. Uses
     * the provider's getDeclarationInsertPosition + formatLocalVariable.
     */
    public async handleSubmitNewVariable(data: { name: string; type: string }): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        const doc = editor?.document;
        const provider = this._state.provider;
        const member = this._state.member;
        if (!doc || !provider || !member || !data.name) { this.endVariableEdit(); return; }

        // Insert after the last declared local/param so new variables are
        // always appended at the end of the var section, regardless of where
        // the cursor is. Falls back to the provider's insert position when no
        // local exists yet (empty var section), and never lands inside the
        // method body: a malformed declarationRange must not push the new
        // declaration past `begin`.
        const scope = this._scopeAnalyzer.getScope(doc, provider, member);
        const bodyStart = scope?.bodyRange?.start.line;
        const last = scope && scope.locals.length > 0 ? scope.locals[scope.locals.length - 1] : undefined;
        let insertLine: number;
        let indent: string;
        let needsSection = false;
        if (last && (bodyStart === undefined || last.declarationRange.end.line + 1 < bodyStart)) {
            insertLine = last.declarationRange.end.line + 1;
            const lastIndent = (doc.lineAt(last.declarationRange.start.line).text.match(/^\s*/) ?? [''])[0];
            indent = lastIndent;
        } else {
            const fallback = provider.getDeclarationInsertPosition(doc, member);
            insertLine = fallback.line;
            indent = (doc.lineAt(insertLine).text.match(/^\s*/) ?? [''])[0];
            // No existing locals: if the language needs a section keyword
            // (e.g. Pascal 'var'), we must create it between the signature
            // and begin.
            const sectionKw = provider.getLocalSectionKeyword();
            if (sectionKw) {
                const lines = doc.getText().split(/\r?\n/);
                const hasSection = lines.some((l, i) => i >= (member.implementationRange?.start.line ?? 0) && i <= insertLine && new RegExp('^\\s*' + sectionKw + '\\b', 'i').test(l));
                if (!hasSection) { needsSection = true; }
            }
        }

        const insertPos = new vscode.Position(insertLine, 0);
        const sectionKw = provider.getLocalSectionKeyword();
        let decl: string;
        if (needsSection && sectionKw) {
            // Create: var\n  name: type;\n  (before begin)
            const varIndent = indent.replace(/\S.*$/, '');
            decl = varIndent + sectionKw + '\n' + '  ' + provider.formatLocalVariable(data.name, data.type || provider.getTypeDefaults().defaultFieldType) + '\n';
        } else {
            decl = indent + provider.formatLocalVariable(data.name, data.type || provider.getTypeDefaults().defaultFieldType) + '\n';
        }
        const wsEdit = new vscode.WorkspaceEdit();
        wsEdit.insert(doc.uri, insertPos, decl);
        const ok = await vscode.workspace.applyEdit(wsEdit);
        if (ok) {
            vscode.window.showInformationMessage(`CE: Added variable "${data.name}".`);
            this._stateKey = '';
            this.onCursorChanged(editor!);
        }
        this.endVariableEdit();
    }

    /**
     * Promotes a local variable to a class field (or property, for Pascal).
     * Removes the local declaration from the method body and inserts a field
     * declaration into the class with the chosen visibility. Only available
     * when the enclosing member is a real class method (not a standalone fn).
     */
    public async handlePromoteVariable(visibility: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        const doc = editor?.document;
        const provider = this._state.provider;
        const member = this._state.member;
        const cls = this._state.classInfo;
        const old = this._editingVariable;
        if (!doc || !provider || !member || !cls || !old) { this.endVariableEdit(); return; }

        const scope = this._scopeAnalyzer.getScope(doc, provider, member);
        const local = scope?.locals.find(l => l.name === old.name);
        if (!local || !local.type) {
            vscode.window.showWarningMessage('CE: Cannot promote an untyped local.');
            this.endVariableEdit();
            return;
        }

        const wsEdit = new vscode.WorkspaceEdit();

        // 1. Remove the local declaration line from the method var section.
        const line = local.declarationRange.start.line;
        const lineEnd = Math.min(line + 1, doc.lineCount - 1);
        wsEdit.delete(doc.uri, new vscode.Range(new vscode.Position(line, 0), new vscode.Position(lineEnd, 0)));

        // 2. Insert a field declaration into the class at the field insert
        //    position, using the provider's field generator for correct syntax.
        const fieldSpec: FieldSpec = {
            kind: MemberKind.Field,
            name: old.name,
            type: local.type,
            visibility: visibility as Visibility,
        };
        const gen = provider.generateField(cls.name, fieldSpec, cls);
        const insertPos = gen.declarationPosition;
        wsEdit.insert(doc.uri, insertPos, gen.declaration);

        const ok = await vscode.workspace.applyEdit(wsEdit);
        if (ok) {
            vscode.window.showInformationMessage(`CE: Promoted "${old.name}" to ${visibility} field of ${cls.name}.`);
            this._codeExplorer.refresh();
        }
        this.endVariableEdit();
    }

    private handleSessionPreview(data: MemberFormResult): void {
        const ctx = this._sessionCtx;
        if (!ctx || !ctx.provider || !ctx.classInfo) {
            this._view?.webview.postMessage({ command: 'updatePreview', preview: '' });
            return;
        }
        const provider = ctx.provider;
        const cls = ctx.classInfo;
        let preview = '';
        try {
            const spec = memberFormToSpec(data);
            // Match editMember exactly: preserve the existing implementation body
            // so the preview reflects what will actually be generated.
            const existingBody = ctx.member?.implementationRange && ctx.document
                ? ops.extractImplBody(ctx.document.getText(ctx.member.implementationRange))
                : undefined;
            const gen = generateFromSpec(provider, cls, spec, existingBody);
            preview = gen.declaration || gen.implementation || '(no preview)';
        } catch (e) {
            preview = '(preview error: ' + (e instanceof Error ? e.message : String(e)) + ')';
        }
        this._view?.webview.postMessage({ command: 'updatePreview', preview });
    }

    /**
     * Renders an analytics report inline. The payload shape depends on the
     * active `_analyticsKind`. Everything injected into HTML is escaped; raw
     * text (markdown / json) goes into <pre> blocks so it cannot break out.
     */
    private getAnalyticsHtml(): string {
        const nonce = getNonce();
        const kind = this._analyticsKind;
        const data = this._analyticsData;
        const titles: Record<AnalyticsKind, string> = {
            review: 'Code Review',
            documentation: 'Documentation',
            export: 'Export Structure',
            deadcode: 'Dead Code',
        };
        const title = kind ? titles[kind] : 'Analytics';

        let body = '';
        if (kind === 'review') {
            const findings = (data as ReviewFinding[]) || [];
            body = findings.length === 0
                ? '<p class="muted">No issues found ✓</p>'
                : '<table class="tbl"><thead><tr><th>Sev</th><th>Category</th><th>Message</th><th>Line</th></tr></thead><tbody>'
                    + findings.map(f => `<tr class="sev-${f.severity}"><td>${sevIcon(f.severity)}</td><td>${escapeHtml(f.category)}</td><td>${escapeHtml(f.message)}${f.memberName ? ' <span class="muted">' + escapeHtml(f.memberName) + '</span>' : ''}</td><td>${f.line + 1}</td></tr>`).join('')
                    + '</tbody></table>';
        } else if (kind === 'deadcode') {
            const items = (data as DeadCodeItem[]) || [];
            body = items.length === 0
                ? '<p class="muted">No dead code detected ✓</p>'
                : '<table class="tbl"><thead><tr><th>Kind</th><th>Name</th><th>File</th><th>Line</th></tr></thead><tbody>'
                    + items.map(d => `<tr><td>${escapeHtml(d.kind)}</td><td>${escapeHtml(d.name)}</td><td class="muted">${escapeHtml(shortFile(d.file))}</td><td>${d.line + 1}</td></tr>`).join('')
                    + '</tbody></table>';
        } else if (kind === 'documentation') {
            const md = (data as string) || '';
            body = `<pre class="raw">${escapeHtml(md)}</pre>`;
        } else if (kind === 'export') {
            const json = data ? JSON.stringify(data, null, 2) : '';
            body = `<pre class="raw">${escapeHtml(json)}</pre>`;
        }

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 12px; }
.bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.bar h2 { font-size: 13px; font-weight: 600; }
.btnClose { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 3px; padding: 4px 10px; cursor: pointer; font-size: 11px; }
.muted { color: var(--vscode-descriptionForeground); font-size: 11px; }
.tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
.tbl th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--vscode-descriptionForeground); padding: 3px 6px; border-bottom: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); }
.tbl td { padding: 3px 6px; border-bottom: 1px solid var(--vscode-input-border, rgba(128,128,128,0.15)); vertical-align: top; }
.sev-error td:first-child { color: #f48771; }
.sev-warning td:first-child { color: #cca700; }
.sev-info td:first-child { color: var(--vscode-symbolIcon-interfaceForeground, #75beff); }
.card { background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.1)); border-radius: 4px; padding: 8px 10px; margin-bottom: 8px; }
.card .name { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
.card .stats { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 11px; }
.card .stats span { color: var(--vscode-descriptionForeground); }
.badge { display: inline-block; padding: 1px 7px; border-radius: 9px; font-size: 10px; font-weight: 600; }
.badge-good { background: rgba(80,200,120,0.18); color: #73c991; }
.badge-warning { background: rgba(204,167,0,0.18); color: #cca700; }
.badge-poor { background: rgba(244,135,113,0.18); color: #f48771; }
.raw { background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.12)); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); border-radius: 3px; padding: 8px; font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; white-space: pre-wrap; word-break: break-word; max-height: 70vh; overflow-y: auto; }
</style>
</head>
<body>
<div class="bar"><h2>${escapeHtml(title)}</h2><button class="btnClose" id="btnClose">✕ Close</button></div>
${body}
<script nonce="${nonce}">
(function(){document.getElementById("btnClose").addEventListener("click",function(){acquireVsCodeApi().postMessage({command:"closeAnalytics"});});})();
</script>
</body>
</html>`;
    }

    /**
     * Compact inline editor for a single variable (local or parameter): two
     * fields (Name, Type) prefilled from the variable, plus Save / Cancel.
     * In add mode (empty name) the title is "Add Variable" and Save creates it.
     */
    private getVariableEditHtml(): string {
        const nonce = getNonce();
        const v = this._editingVariable;
        const name = v?.name ?? '';
        const type = v?.type ?? '';
        const isAdd = !name;
        const title = isAdd ? '➕ Add Variable' : '✏️ Edit Variable';
        const submitCmd = isAdd ? 'submitNewVariable' : 'submitVariable';
        // Promote-to-property is only available when the enclosing member is a
        // real class method (not a file-level standalone function) AND the
        // language actually expresses visibility.
        const visOptions = this._state.provider?.getVisibilityOptions() ?? [];
        const canPromote = !isAdd && !!this._state.classInfo && visOptions.length > 0;
        const typeSuggestions = this._state.provider?.getTypeSuggestions() ?? ['int', 'string', 'boolean'];
        const datalistOpts = typeSuggestions.map(t => `<option value="${escapeHtml(t)}">`).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 10px; }
h2 { margin-bottom: 10px; font-size: 13px; font-weight: 600; }
label { display: block; margin-bottom: 3px; font-weight: 500; font-size: 11px; color: var(--vscode-descriptionForeground); }
input { width: 100%; padding: 4px 6px; border: 1px solid var(--vscode-input-border, transparent); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 3px; font-family: inherit; font-size: inherit; }
input:focus { outline: 1px solid var(--vscode-focusBorder, #007fd4); border-color: var(--vscode-focusBorder, #007fd4); }
.row { margin-bottom: 8px; }
.actions { margin-top: 10px; display: flex; gap: 6px; justify-content: flex-end; }
button { cursor: pointer; border: none; border-radius: 3px; font-family: inherit; }
.btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 5px 14px; font-size: 12px; }
.btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); padding: 5px 12px; font-size: 12px; }
</style>
</head>
<body>
<h2>${title}</h2>
<div class="row"><label>Name</label><input type="text" id="varName" value="${escapeHtml(name)}" autofocus></div>
<div class="row"><label>Type</label><input type="text" id="varType" list="typeSuggestions" value="${escapeHtml(type)}" placeholder="(inferred)">
<datalist id="typeSuggestions">
${datalistOpts}
</datalist></div>
${canPromote ? `<div class="row">
<label>Promote to class property</label>
<div style="display:flex;gap:4px;align-items:center">
<select id="promoteVis" style="flex:0 0 auto">
${visOptions.map(v => `<option value="${v}">${v}</option>`).join('')}
</select>
<button class="btn-secondary" id="btnPromote" style="flex:0 0 auto">→ Promote</button>
</div>
</div>` : ''}
<div class="actions">
<button class="btn-secondary" id="btnCancel">Cancel</button>
<button class="btn-primary" id="btnSave">Save</button>
</div>
<script nonce="${nonce}">
(function(){
    var api = acquireVsCodeApi();
    function submit() { api.postMessage({ command: '${submitCmd}', data: { name: document.getElementById('varName').value, type: document.getElementById('varType').value } }); }
    document.getElementById('btnSave').onclick = submit;
    document.getElementById('btnCancel').onclick = function() { api.postMessage({ command: 'cancelVariable' }); };
    document.getElementById('varName').addEventListener('keydown', function(e) { if (e.key === 'Enter') submit(); });
    document.getElementById('varType').addEventListener('keydown', function(e) { if (e.key === 'Enter') submit(); });
    var bp = document.getElementById('btnPromote');
    if (bp) { bp.onclick = function() { api.postMessage({ command: 'promoteVariable', visibility: document.getElementById('promoteVis').value }); }; }
})();
</script>
</body>
</html>`;
    }

    private getEmptyHtml(): string {
        const nonce = getNonce();
        const quick = (label: string, cmd: string) =>
            `<button class="qa" data-cmd="${cmd}">${escapeHtml(label)}</button>`;
        const groups = [
            { title: 'Create', items: [
                quick('➕ Add Method', 'mmx.addMethod'),
                quick('📦 Add Field', 'mmx.addField'),
                quick('🔑 Add Property', 'mmx.addProperty'),
                quick('🏗️ Add Constructor', 'mmx.addConstructor'),
                quick('🧩 Insert Template', 'mmx.insertTemplate'),
                quick('🗂️ Manage Templates', 'mmx.manageTemplates'),
            ]},
            { title: 'Maintain', items: [
                quick('🔎 Go to Member', 'mmx.goToMember'),
                quick('🔄 Synchronize Decl/Impl', 'mmx.synchronizeDeclImpl'),
                quick('🔑 Generate Getters/Setters', 'mmx.generateGettersSetters'),
                quick('📄 Insert Doc Header', 'mmx.insertDocHeader'),
            ]},
            { title: 'Explorer', items: [
                quick('🔍 Filter Members', 'mmx.filterTree'),
                quick('♻️ Refresh', 'mmx.refreshExplorer'),
            ]},
        ];
        const groupsHtml = groups.map(g =>
            `<div class="qa-group"><div class="qa-title">${escapeHtml(g.title)}</div><div class="qa-grid">${g.items.join('')}</div></div>`
        ).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 12px; }
.empty { color: var(--vscode-descriptionForeground); text-align: center; padding: 14px 8px 10px; }
.empty .icon { font-size: 26px; margin-bottom: 6px; opacity: 0.5; }
.empty p { font-size: 12px; line-height: 1.5; }
.qa-group { margin-bottom: 12px; }
.qa-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--vscode-descriptionForeground); margin: 0 2px 5px; }
.qa-grid { display: flex; flex-direction: column; gap: 3px; }
.qa { display: block; width: 100%; text-align: left; padding: 6px 10px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; font-size: 12px; font-family: inherit; background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.12)); color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); }
.qa:hover { background: var(--vscode-button-secondaryHoverBackground, rgba(127,127,127,0.2)); }
</style>
</head>
<body>
<div class="empty">
<div class="icon">🔍</div>
<p>Place cursor on a class member to view &amp; edit it.</p>
</div>
${groupsHtml}
<script nonce="${nonce}">
(function() {
    var api = acquireVsCodeApi();
    document.querySelectorAll('.qa').forEach(function(b) {
        b.addEventListener('click', function() { api.postMessage({ command: 'run', cmd: b.getAttribute('data-cmd') }); });
    });
})();
</script>
</body>
</html>`;
    }

    /** Local variables / parameters of the selected member + the inline "Add Variable" button. */
    private variablesHtml(member: ClassMember): string {
        let html = '';
        const provider = this._state.provider;
        const doc = vscode.window.activeTextEditor?.document;
        if (provider && doc) {
            const scope = this._scopeAnalyzer.getScope(doc, provider, member);
            if (scope && scope.locals.length > 0) {
                html += `<div class="section var-section"><div class="section-title">Variables</div><ul class="var-list">`;
                for (const l of scope.locals) {
                    const badge = l.isParam ? '<span class="dir">param </span>' : '<span class="dir">local </span>';
                    const t = l.type ? `: <span class="ptype">${escapeHtml(l.type)}</span>` : '';
                    const safeName = escapeHtml(l.name).replace(/"/g, '&quot;');
                    html += `<li class="var-row">${badge}<span class="pname">${escapeHtml(l.name)}</span>${t}` +
                        `<span class="var-actions">` +
                        `<button class="var-btn" data-edit="${safeName}" title="Edit">✏️</button>` +
                        `<button class="var-btn" data-delete="${safeName}" title="Delete">🗑️</button>` +
                        `</span></li>`;
                }
                html += `</ul></div>`;
            }
        }
        html += `<button class="ana" data-addvar="1">➕ Add Variable</button>`;
        return html;
    }

    /** "Add / Delete" tab: add buttons plus every member of the current type with edit / rename / delete. */
    private getManageHtml(): string {
        const { member, classInfo, provider } = this._state;
        let html = '';

        const isStruct = !!classInfo && (classInfo.isRecord || classInfo.classType === 'struct');
        const isCppStruct = provider?.languageId === 'cpp' && classInfo?.classType === 'struct';
        const canHaveMethods = !classInfo || !isStruct || isCppStruct;
        const isInterface = !!classInfo?.isInterface;

        html += `<div class="section"><div class="section-title">Add</div><div class="analyze-grid">`;
        if (classInfo) { html += `<button class="ana" data-run="mmx.addField">📦 Field</button>`; }
        if (canHaveMethods) { html += `<button class="ana" data-run="mmx.addMethod">🔧 Method</button>`; }
        if (classInfo && canHaveMethods && !isInterface) {
            html += `<button class="ana" data-run="mmx.addProperty">🔑 Property</button>`;
            html += `<button class="ana" data-run="mmx.addConstructor">🏗️ Constructor</button>`;
        }
        html += `</div></div>`;

        const targets = this.manageTargets();
        const icon = (k: MemberKind) => k === MemberKind.Field ? '📦' : k === MemberKind.Property ? '🔑'
            : k === MemberKind.Constructor ? '🏗️' : k === MemberKind.Destructor ? '🧹' : '🔧';
        html += `<div class="section"><div class="section-title">${classInfo ? 'Members' : 'Routines'} (${targets.length})</div>`;
        if (targets.length === 0) {
            html += `<p class="empty-section">Nothing here yet, use the buttons above.</p>`;
        } else {
            html += `<ul class="mlist">`;
            for (const m of targets) {
                const id = escapeHtml(m.id);
                const t = m.returnType || m.type;
                const sig = m.kind === MemberKind.Method || m.kind === MemberKind.Constructor || m.kind === MemberKind.Destructor
                    ? `(${m.parameters.length})` : '';
                html += `<li class="mrow${member && member.id === m.id ? ' sel' : ''}">` +
                    `<span>${icon(m.kind)}</span>` +
                    `<span class="mname" data-m-act="go" data-id="${id}" title="Go to ${escapeHtml(m.name)}">${escapeHtml(m.name)}${sig}</span>` +
                    (t ? `<span class="mtype">: ${escapeHtml(t)}</span>` : '') +
                    `<span class="var-actions">` +
                    `<button class="var-btn" data-m-act="edit" data-id="${id}" title="Edit">✏️</button>` +
                    `<button class="var-btn" data-m-act="rename" data-id="${id}" title="Rename">🔤</button>` +
                    `<button class="var-btn" data-m-act="delete" data-id="${id}" title="Delete">🗑️</button>` +
                    `</span></li>`;
            }
            html += `</ul>`;
        }
        html += `</div>`;

        const hasBody = !!member && member.kind !== MemberKind.Field && member.kind !== MemberKind.Property;
        if (member && hasBody) {
            html += `<div class="divider"></div><div class="section-title">Variables of ${escapeHtml(member.name)}</div>`;
            html += this.variablesHtml(member);
        }
        return html;
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
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 12px; overflow-y: auto; }
.section { margin-bottom: 12px; }
.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--vscode-descriptionForeground); margin-bottom: 6px; letter-spacing: 0.5px; }
.class-header { display: flex; align-items: center; gap: 6px; padding: 8px; background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.1)); border-radius: 4px; margin-bottom: 12px; }
.class-header .name { font-weight: 600; font-size: 14px; }
.class-header .type { font-size: 11px; color: var(--vscode-descriptionForeground); }
.member-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.member-header .name { font-size: 15px; font-weight: 700; cursor: pointer; }
.member-header .name:hover { text-decoration: underline dotted var(--vscode-descriptionForeground); }
.inline-rename { font-size: 15px; font-weight: 700; font-family: inherit; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-focusBorder, #007fd4); border-radius: 3px; padding: 1px 4px; min-width: 0; flex: 1; }
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
.params-list li.param-item { cursor: pointer; border-radius: 3px; padding: 2px 4px; }
.params-list li.param-item:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.15)); }
.param-edit { float: right; opacity: 0; font-size: 11px; font-family: var(--vscode-font-family, sans-serif); }
li.param-item:hover .param-edit { opacity: 0.8; }
.hint { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--vscode-descriptionForeground); }
.actions { display: flex; gap: 6px; flex-wrap: nowrap; margin-top: 12px; }
.btn { padding: 5px 12px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500; font-family: inherit; }
.btn-edit { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.btn-delete { background: #d32f2f; color: #fff; }
.btn-rename { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
.btn:hover { opacity: 0.9; }
.divider { height: 1px; background: var(--vscode-input-border, rgba(128,128,128,0.3)); margin: 10px 0; }
.empty-section { color: var(--vscode-descriptionForeground); font-style: italic; }
.analyze-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.ana { display: block; width: 100%; text-align: left; padding: 5px 8px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; font-size: 11px; font-family: inherit; background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.12)); color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); }
.ana:hover { background: var(--vscode-button-secondaryHoverBackground, rgba(127,127,127,0.2)); }
.var-section { background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.1)); border-left: 3px solid var(--vscode-textLink-activeForeground, #3794ff); padding: 6px 8px; border-radius: 3px; }
.var-section .section-title { color: var(--vscode-textLink-activeForeground, #3794ff); }
.var-list { list-style: none; padding-left: 0; }
.var-row { display: flex; align-items: center; gap: 4px; padding: 3px 0; font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; }
.var-actions { margin-left: auto; display: flex; gap: 2px; }
.var-btn { background: transparent; border: none; cursor: pointer; font-size: 13px; padding: 1px 3px; line-height: 1; }
.var-btn:hover { filter: brightness(1.3); }
.tabs { display: flex; gap: 2px; margin-bottom: 10px; border-bottom: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); }
.tab { background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--vscode-descriptionForeground); padding: 5px 10px; cursor: pointer; font-size: 12px; font-family: inherit; }
.tab.active { color: var(--vscode-foreground); border-bottom-color: var(--vscode-focusBorder, #007fd4); font-weight: 600; }
.tab:hover { color: var(--vscode-foreground); }
.mlist { list-style: none; padding: 0; }
.mrow { display: flex; align-items: center; gap: 5px; padding: 3px 4px; border-radius: 3px; font-size: 12px; }
.mrow:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.15)); }
.mrow.sel { background: var(--vscode-list-activeSelectionBackground, rgba(0,127,212,0.25)); }
.mrow .mname { cursor: pointer; font-family: var(--vscode-editor-font-family, monospace); }
.mrow .mname:hover { text-decoration: underline; }
.mrow .mtype { color: var(--vscode-descriptionForeground); font-family: var(--vscode-editor-font-family, monospace); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.mrow .var-actions { opacity: 0.5; }
.mrow:hover .var-actions { opacity: 1; }
</style>
</head>
<body>`;

        html += `<div class="tabs">
<button class="tab${this._tab === 'detail' ? ' active' : ''}" data-tab="detail">Details</button>
<button class="tab${this._tab === 'manage' ? ' active' : ''}" data-tab="manage">Add / Delete</button>
</div>`;

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

        if (this._tab === 'manage') {
            html += this.getManageHtml();
        } else if (member) {
            const kindLabel = member.kind === MemberKind.Constructor ? 'Constructor'
                : member.kind === MemberKind.Destructor ? 'Destructor'
                : member.kind.charAt(0).toUpperCase() + member.kind.slice(1);

            html += `<div class="member-header">
<span class="name" id="memberName" title="Click to rename">${escapeHtml(member.name)}</span>
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
                html += `<div class="section"><div class="section-title">Parameters <span class="hint">(click to edit)</span></div><ul class="params-list">`;
                for (const p of member.parameters) {
                    const dir = p.isVar ? '<span class="dir">var </span>' : p.isOut ? '<span class="dir">out </span>' : p.isConst ? '<span class="dir">const </span>' : '';
                    html += `<li class="param-item" data-run="mmx.editMember" title="Edit parameters of ${escapeHtml(member.name)}">` +
                        `${dir}<span class="pname">${escapeHtml(p.name)}</span>: <span class="ptype">${escapeHtml(p.type)}</span>` +
                        `<span class="param-edit">✏️</span></li>`;
                }
                html += `</ul></div>`;
            }

            // Local variables & parameters detected inside the method body.
            // Each is clickable to open the inline variable editor (rename +
            // change type in one form), mirroring the member editor.
            html += this.variablesHtml(member);

            html += `<div class="divider"></div>`;
            html += `<div class="section"><div class="section-title">Actions</div><div class="analyze-grid">`;
            html += `<button class="ana" data-act="edit">✏️ Edit (params, type…)</button>`;
            html += `<button class="ana" data-act="rename">🔤 Rename</button>`;
            html += `<button class="ana" data-act="docHeader">📄 Doc header</button>`;
            html += `<button class="ana" data-act="delete">🗑️ Delete</button>`;
            html += `</div></div>`;

            html += `<div class="divider"></div>`;
            html += `<div class="section"><div class="section-title">Analyze</div><div class="analyze-grid">`;
            html += `<button class="ana" data-ak="review">✅ Review</button>`;
            html += `<button class="ana" data-ak="documentation">📖 Doc</button>`;
            html += `<button class="ana" data-ak="export">📋 Export</button>`;
            html += `<button class="ana" data-ak="deadcode">💀 Dead Code</button>`;
            html += `</div></div>`;
        } else if (classInfo) {
            // Cursor is on a class/struct declaration (no member selected).
            // Offer to add members directly, adapted to the type: structs get
            // fields only (plus methods for C++ structs which support them).
            const provider = this._state.provider;
            const isStruct = classInfo.isRecord || classInfo.classType === 'struct';
            const isCppStruct = provider?.languageId === 'cpp' && classInfo.classType === 'struct';
            const canHaveMethods = !isStruct || isCppStruct;
            const isInterface = classInfo.isInterface;

            html += `<div class="divider"></div>`;
            html += `<div class="section"><div class="section-title">Add Member</div><div class="analyze-grid">`;
            html += `<button class="ana" data-run="mmx.addField">📦 Add Field</button>`;
            if (canHaveMethods && !isInterface) {
                html += `<button class="ana" data-run="mmx.addProperty">🔑 Add Property</button>`;
                html += `<button class="ana" data-run="mmx.addMethod">🔧 Add Method</button>`;
                html += `<button class="ana" data-run="mmx.addConstructor">🏗️ Add Constructor</button>`;
            }
            if (isInterface) {
                html += `<button class="ana" data-run="mmx.addMethod">🔧 Add Method</button>`;
            }
            html += `</div></div>`;
        } else {
            html += `<p class="empty-section">No member selected. Place cursor on a method, field, or property.</p>`;
        }

        html += `<script nonce="${nonce}">
(function() {
    var vscodeApi = acquireVsCodeApi();
    document.querySelectorAll('.ana').forEach(function(b) {
        b.addEventListener('click', function() {
            var ak = b.getAttribute('data-ak');
            var run = b.getAttribute('data-run');
            var addvar = b.getAttribute('data-addvar');
            var act = b.getAttribute('data-act');
            if (ak) { vscodeApi.postMessage({ command: 'runAnalytics', kind: ak }); }
            else if (act) { vscodeApi.postMessage({ command: 'memberAction', act: act }); }
            else if (run) { vscodeApi.postMessage({ command: 'run', cmd: run }); }
            else if (addvar) { vscodeApi.postMessage({ command: 'addVariable' }); }
        });
    });
    document.querySelectorAll('.tab').forEach(function(b) {
        b.addEventListener('click', function() { vscodeApi.postMessage({ command: 'setTab', tab: b.getAttribute('data-tab') }); });
    });
    document.querySelectorAll('[data-m-act]').forEach(function(b) {
        b.addEventListener('click', function() {
            vscodeApi.postMessage({ command: 'manageAction', act: b.getAttribute('data-m-act'), id: b.getAttribute('data-id') });
        });
    });
    document.querySelectorAll('.var-btn[data-edit], .var-btn[data-delete]').forEach(function(b) {
        b.addEventListener('click', function() {
            var editName = b.getAttribute('data-edit');
            var delName = b.getAttribute('data-delete');
            if (editName) { vscodeApi.postMessage({ command: 'editVariable', name: editName }); }
            else if (delName) { vscodeApi.postMessage({ command: 'deleteVariableByName', name: delName }); }
        });
    });
    document.querySelectorAll('.param-item').forEach(function(b) {
        b.addEventListener('click', function() {
            var run = b.getAttribute('data-run');
            if (run) { vscodeApi.postMessage({ command: 'run', cmd: run }); }
        });
    });
    var mn = document.getElementById('memberName');
    function startRename() {
        var mn = document.getElementById('memberName');
        if (!mn) { return; }
        var old = mn.textContent || '';
        var inp = document.createElement('input');
        inp.className = 'inline-rename';
        inp.value = old;
        mn.replaceWith(inp);
        inp.focus();
        inp.select();
        function restore() {
            var s = document.createElement('span');
            s.className = 'name';
            s.id = 'memberName';
            s.title = 'Click to rename';
            s.textContent = old;
            inp.replaceWith(s);
            s.addEventListener('click', startRename);
        }
        function submit() {
            var v = inp.value.trim();
            if (v && v !== old) { vscodeApi.postMessage({ command: 'renameMember', name: v }); }
            restore();
        }
        inp.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { submit(); }
            else if (e.key === 'Escape') { if (inp.parentNode) { restore(); } }
        });
        inp.addEventListener('blur', function() { if (inp.parentNode) { restore(); } });
    }
    if (mn) { mn.addEventListener('click', startRename); }
    window.addEventListener('message', function(e) {
        var m = e.data;
        if (m && m.command === 'startRename') { startRename(); }
    });
})();
</script>`;

        html += `</body></html>`;
        return html;
    }

    /**
     * Compact, ergonomic inline editor for edit / add / extract sessions.
     * - renameOnly: a single inline Name field + Save/Cancel (lightest).
     * - otherwise: Name+Type row, compact visibility/modifiers, collapsible
     *   parameters, and a preview that is collapsed by default.
     */
    private getSessionHtml(): string {
        const ctx = this._sessionCtx;
        if (!ctx || !ctx.provider) { return this.getEmptyHtml(); }

        const provider = ctx.provider;
        const isPascal = provider.languageId === 'pascal';
        const typeDefaults = provider.getTypeDefaults();
        const visibilities = provider.getVisibilityModifiers();
        const defaultVis = ctx.visibility ?? provider.getDefaultVisibility();

        const mode = ctx.mode;
        const isExtract = mode === 'extract';
        const renameOnly = !!ctx.renameOnly;
        const memberKind = isExtract ? MemberKind.Method : (ctx.kind ?? ctx.member?.kind ?? MemberKind.Method);
        const initial = mode === 'edit' ? ctx.member : undefined;

        const kindLabel = memberKind === MemberKind.Constructor ? 'Constructor'
            : memberKind === MemberKind.Destructor ? 'Destructor'
            : memberKind === MemberKind.Field ? 'Field'
            : memberKind === MemberKind.Property ? 'Property' : 'Method';

        const showReturnType = isExtract || memberKind === MemberKind.Method || memberKind === MemberKind.Property || memberKind === MemberKind.Field;
        const showParameters = isExtract || memberKind === MemberKind.Method || memberKind === MemberKind.Constructor || memberKind === MemberKind.Destructor;
        const showModifiers = !isExtract && (memberKind === MemberKind.Method || memberKind === MemberKind.Constructor || memberKind === MemberKind.Destructor);
        const showPropertyOptions = !isExtract && memberKind === MemberKind.Property;
        const canBackingField = showPropertyOptions && provider.supportsBackingField();

        const title = isExtract ? 'Extract Method'
            : mode === 'add' ? `Add ${kindLabel}` + (ctx.classInfo?.name ? ' · ' + escapeHtml(ctx.classInfo.name) : '')
            : renameOnly ? 'Rename'
            : `Edit ${kindLabel}`;

        const visOptions = visibilities.map(v => {
            const ev = escapeHtml(String(v));
            return '<option value="' + ev + '"' + (v === (initial ? initial.visibility : defaultVis) ? ' selected' : '') + '>' + ev + '</option>';
        }).join('');

        const nameValue = initial ? initial.name : '';
        const returnValue = initial ? (initial.returnType || initial.type || '') : '';
        const returnPlaceholder = isExtract
            ? (isPascal ? '' : 'void')
            : (memberKind === MemberKind.Property ? typeDefaults.defaultPropertyType : typeDefaults.defaultReturnType);

        const nonce = getNonce();
        const submitCmd = isExtract ? 'extractSubmit' : 'submit';

        let html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">';
        html += '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\' \'nonce-' + nonce + '\'; script-src \'nonce-' + nonce + '\';">';
        html += '<style nonce="' + nonce + '">';
        html += '* { box-sizing: border-box; margin: 0; padding: 0; }';
        html += 'body { font-family: var(--vscode-font-family, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 10px; }';
        html += 'h2 { margin-bottom: 8px; font-size: 13px; font-weight: 600; }';
        html += 'label { display: block; margin-bottom: 3px; font-weight: 500; font-size: 11px; color: var(--vscode-descriptionForeground); }';
        html += 'input, select { width: 100%; padding: 4px 6px; border: 1px solid var(--vscode-input-border, transparent); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 3px; font-family: inherit; font-size: inherit; }';
        html += 'input:focus, select:focus { outline: 1px solid var(--vscode-focusBorder, #007fd4); border-color: var(--vscode-focusBorder, #007fd4); }';
        html += '.row { display: flex; gap: 8px; margin-bottom: 8px; } .row > div { flex: 1; }';
        html += '.compact-vis { margin-bottom: 8px; }';
        html += '.mod-row { display: flex; flex-wrap: wrap; gap: 4px 10px; margin: 6px 0 8px; font-size: 11px; } .mod-row label { display: inline-flex; align-items: center; gap: 3px; margin: 0; color: var(--vscode-foreground); } .mod-row input { width: auto; }';
        html += '.disclosure { margin: 6px 0; } .disclosure summary { cursor: pointer; font-size: 11px; color: var(--vscode-descriptionForeground); list-style: none; } .disclosure summary::-webkit-details-marker { display: none; }';
        html += '.param-row { display: flex; gap: 4px; margin-bottom: 4px; } .param-row input, .param-row select { flex: 1; min-width: 0; padding: 3px 5px; } .param-row .x { flex: 0 0 20px; padding: 2px 0; }';
        html += '.add-param { font-size: 11px; padding: 2px 8px; margin: 2px 0 8px; cursor: pointer; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 3px; }';
        html += '.preview-box { background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.12)); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); border-radius: 3px; padding: 6px; font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; white-space: pre-wrap; max-height: 140px; overflow-y: auto; margin-top: 4px; }';
        html += '.actions { margin-top: 10px; display: flex; gap: 6px; justify-content: flex-end; }';
        html += 'button { cursor: pointer; border: none; border-radius: 3px; font-family: inherit; }';
        html += '.btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 5px 14px; font-size: 12px; }';
        html += '.btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); padding: 5px 12px; font-size: 12px; }';
        html += '</style></head><body>';

        html += '<h2>' + title + '</h2>';

        if (ctx.candidateClasses && ctx.candidateClasses.length > 0) {
            html += '<div class="row"><div><label>Target</label><select id="targetClass">';
            for (const c of ctx.candidateClasses) {
                const t = c.classType ? ` (${c.classType})` : (c.isInterface ? ' (interface)' : c.isRecord ? ' (record)' : '');
                html += '<option value="' + escapeHtml(c.name) + '">' + escapeHtml(c.name + t) + '</option>';
            }
            if (ctx.allowStandaloneTarget) {
                html += '<option value="__standalone__">(File-level function)</option>';
            }
            html += '</select></div></div>';
        }

        if (renameOnly) {
            html += '<div><label>Name</label>';
            html += '<input type="text" id="name" value="' + escapeHtml(nameValue) + '" autofocus></div>';
            html += '<div class="actions">';
            html += '<button class="btn-secondary" id="btnCancel">Cancel</button>';
            html += '<button class="btn-primary" id="btnSubmit">Rename</button>';
            html += '</div>';
        } else {
            html += '<div class="row">';
            html += '<div><label>Name</label>';
            html += '<input type="text" id="name" placeholder="name" value="' + escapeHtml(nameValue) + '" autofocus></div>';
            if (showReturnType) {
                html += '<div><label>' + (memberKind === MemberKind.Property ? 'Type' : 'Return') + '</label>';
                html += '<input type="text" id="returnType" placeholder="' + escapeHtml(returnPlaceholder) + '" value="' + escapeHtml(returnValue) + '"></div>';
            }
            html += '</div>';

            if (!isExtract) {
                html += '<div class="compact-vis"><label>Visibility</label>';
                html += '<select id="visibility">' + visOptions + '</select></div>';
            }

            if (showPropertyOptions) {
                html += '<div class="mod-row">';
                html += '<label><input type="checkbox" id="hasGetter" checked> getter</label>';
                html += '<label><input type="checkbox" id="hasSetter" checked> setter</label>';
                if (canBackingField) {
                    html += '<label><input type="checkbox" id="createBackingField"> backing field</label>';
                }
                html += '</div>';
            }

            if (showModifiers) {
                html += '<details class="disclosure"><summary>▸ Modifiers</summary><div class="mod-row">';
                html += '<label><input type="checkbox" id="isStatic"' + (initial?.isStatic ? ' checked' : '') + '> ' + (isPascal ? 'class' : 'static') + '</label>';
                html += '<label><input type="checkbox" id="isVirtual"' + (initial?.isVirtual ? ' checked' : '') + '> virtual</label>';
                html += '<label><input type="checkbox" id="isAbstract"' + (initial?.isAbstract ? ' checked' : '') + '> abstract</label>';
                html += '<label><input type="checkbox" id="isOverride"' + (initial?.isOverride ? ' checked' : '') + '> override</label>';
                html += '</div></details>';
            }

            if (showParameters) {
                html += '<details class="disclosure" id="paramsDetails"' + (initial && initial.parameters.length ? ' open' : '') + '><summary>▸ Parameters</summary>';
                html += '<div id="paramsContainer"></div>';
                html += '<button class="add-param" id="btnAddParam" title="Add a parameter to this member">➕ Add parameter</button></details>';
            }

            html += '<details class="disclosure"><summary id="previewToggle">▸ Preview</summary>';
            html += '<div class="preview-box" id="preview">...</div></details>';

            html += '<div class="actions">';
            html += '<button class="btn-secondary" id="btnCancel">Cancel</button>';
            html += '<button class="btn-primary" id="btnSubmit">' + (mode === 'edit' ? 'Save' : (isExtract ? 'Extract' : 'Create')) + '</button>';
            html += '</div>';
        }

        const initParamsJson = JSON.stringify(initial?.parameters || []).replace(/</g, '\\u003c');
        const memberKindVal = String(memberKind);
        html += '<script nonce="' + nonce + '">(function(){';
        html += 'var api=acquireVsCodeApi();try{var pc=0;var isPascal=' + (isPascal ? 'true' : 'false') + ';var isExtract=' + (isExtract ? 'true' : 'false') + ';var renameOnly=' + (renameOnly ? 'true' : 'false') + ';var pt=' + JSON.stringify(typeDefaults.defaultParamType) + ';var kindVal=' + JSON.stringify(memberKindVal) + ';var t=null;';
        html += 'function schedule(){if(t)clearTimeout(t);t=setTimeout(preview,250);}';
        html += 'function addParam(n,ty,dir){';
        html += 'pc++;var c=document.getElementById("paramsContainer");if(!c)return;var row=document.createElement("div");row.className="param-row";';
        html += 'if(isPascal){var s=document.createElement("select");["","const","var","out"].forEach(function(d){var o=document.createElement("option");o.value=d;o.textContent=d||"in";s.appendChild(o);});s.className="param-dir";if(dir)s.value=dir;row.appendChild(s);}';
        html += 'var ni=document.createElement("input");ni.className="param-name";ni.type="text";ni.placeholder="p"+pc;if(n)ni.value=n;row.appendChild(ni);';
        html += 'var ti=document.createElement("input");ti.className="param-type";ti.type="text";ti.placeholder=isPascal?"Integer":pt;if(ty)ti.value=ty;row.appendChild(ti);';
        html += 'var rb=document.createElement("button");rb.className="x";rb.textContent="✕";rb.title="Remove this parameter";rb.onclick=function(){row.remove();schedule();};row.appendChild(rb);';
        html += 'ni.oninput=schedule;ti.oninput=schedule;c.appendChild(row);';
        html += '}';
        html += 'function collect(){';
        html += 'var ne=document.getElementById("name");var rt=document.getElementById("returnType");var vis=document.getElementById("visibility");';
        html += 'var d={kind:kindVal,name:ne?ne.value:"",returnType:rt?rt.value:"",type:rt?rt.value:"",visibility:isExtract?"public":(vis?vis.value:"private"),parameters:[],isStatic:!!(document.getElementById("isStatic")||{}).checked,isVirtual:!!(document.getElementById("isVirtual")||{}).checked,isAbstract:!!(document.getElementById("isAbstract")||{}).checked,isOverride:!!(document.getElementById("isOverride")||{}).checked,hasGetter:renameOnly?false:!!(document.getElementById("hasGetter")||{checked:false}).checked,hasSetter:renameOnly?false:!!(document.getElementById("hasSetter")||{checked:false}).checked,createBackingField:!!(document.getElementById("createBackingField")||{checked:false}).checked};';
        html += 'if(renameOnly){d.visibility=' + JSON.stringify(initial ? initial.visibility : 'private').replace(/</g, '\\u003c') + ';}';
        html += 'var tc=document.getElementById("targetClass");if(tc){d.targetClassName=tc.value;d.targetIsStandalone=tc.value==="__standalone__";}';
        html += 'var rows=document.querySelectorAll(".param-row");for(var i=0;i<rows.length;i++){var r=rows[i];var nme=r.querySelector(".param-name"),tpe=r.querySelector(".param-type"),dre=r.querySelector(".param-dir");if(nme&&tpe&&nme.value){d.parameters.push({name:nme.value,type:tpe.value||(isPascal?"Integer":pt),isConst:dre?dre.value==="const":false,isVar:dre?dre.value==="var":false,isOut:dre?dre.value==="out":false});}}';
        html += 'return d;}';
        html += 'function preview(){try{if(renameOnly)return;api.postMessage({command:"preview",data:collect()});}catch(e){}}';
        html += 'function submit(){api.postMessage({command:"' + submitCmd + '",data:collect()});}';
        html += 'function cancel(){api.postMessage({command:"cancel"});}';
        html += 'var bp=document.getElementById("btnAddParam");if(bp)bp.onclick=function(){addParam();schedule();};';
        html += 'document.getElementById("btnCancel").onclick=cancel;';
        html += 'document.getElementById("btnSubmit").onclick=submit;';
        html += 'var all=document.querySelectorAll("input:not([type=checkbox]),select");for(var i=0;i<all.length;i++){all[i].addEventListener("input",schedule);all[i].addEventListener("change",schedule);}';
        html += 'window.addEventListener("message",function(e){var m=e.data;if(m&&m.command==="updatePreview"){var p=document.getElementById("preview");if(p)p.textContent=m.preview||"";}});';
        html += 'var init=' + initParamsJson + ';for(var i=0;i<init.length;i++){addParam(init[i].name,init[i].type,init[i].isVar?"var":init[i].isOut?"out":init[i].isConst?"const":"");}';
        html += '}catch(e){console.error("[MMX-FORM] script error:",e&&e.message||e);try{api.postMessage({command:"__diag",error:String(e&&e.message||e)});}catch(_){}}})();</script></body></html>';

        return html;
    }
}

interface ProviderRegistryLike {
    getByDocument(doc: vscode.TextDocument): ILanguageProvider | undefined;
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

function sevIcon(severity: 'info' | 'warning' | 'error'): string {
    return severity === 'error' ? '❌' : severity === 'warning' ? '⚠' : 'ℹ';
}

function shortFile(path: string): string {
    return path.split(/[/\\]/).pop() || path;
}
