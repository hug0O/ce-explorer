import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
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
import { unusedInParsed } from '../utils/unusedCode';
import { deadCodeHtml } from './deadCodeHtml';
import { LocalScopeAnalyzer } from '../services/LocalScopeAnalyzer';
import { MemoStore, MAIN_MEMO, memoId, sanitizeLang } from '../services/MemoStore';
import { MemoMode, memoCss, memoHtml, memoScript } from './memoSection';
import { codeBlocks, toggleTask } from '../utils/memoMarkdown';
import { FILE_LEVEL_ID, FocusView, MANAGE_GROUPS, ManageGroup, ManageRow, ManageView, manageCss, manageListHtml, manageScript } from './manageSection';
import { LineHit, memberLineRanges, searchLines, usageLines, ParentRange, withParents } from '../utils/memberSearch';
import { ReviewSeverity } from '../utils/reviewTypes';
import { PackageShortcuts, buildShortcutGroups, shortcutsCss, shortcutsHtml, shortcutsScript } from './shortcutsSection';
import { DEFAULT_REVIEW_OPTIONS, REVIEW_SORTS, ReviewSort, reviewCss, reviewHtml } from './reviewSection';
import { languageOverrides, extensionOf } from '../services/LanguageOverrides';
import { currentDocument } from '../services/LastEditor';
import { COMMON_COMMANDS, DELPHI_COMMANDS, LanguageInfo, PLSQL_ALIGN_IDS, PLSQL_COMMANDS, TOOLS_SUBS, sanitizeChips, shortcutOf, toolsCss, toolsHtml, toolsScript } from './toolsSection';
import { alignSelection, getLastAlignToken } from '../services/FormCommands';
import { notify } from '../services/Notify';
import { eventsOfComponent, eventsOfHandler, hasComponent, menuItemsOf } from '../utils/componentEvents';

interface MemberViewerState {
    member: ClassMember | undefined;
    classInfo: ClassInfo | undefined;
  provider: ILanguageProvider | undefined;
}

/** Tabs of the Member view. */
export type SidebarTab = 'detail' | 'manage' | 'tools' | 'memo' | 'shortcuts';

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
    'ce.addMethod', 'ce.addField', 'ce.addProperty', 'ce.addConstructor',
    'ce.synchronizeDeclImpl', 'ce.insertTemplate', 'ce.manageTemplates',
    'ce.refreshExplorer', 'ce.filterTree', 'ce.goToMember',
    'ce.generateGettersSetters', 'ce.insertDocHeader',
    'ce.renameVariable', 'ce.changeVariableType', 'ce.deleteVariable',
    'ce.editMember', 'ce.renameMember', 'ce.deleteMember',
]);

/** A small picture in front of the name of each tab, so that the tab bar stays on one line in a narrow sidebar. */
const TAB_ICONS: Record<string, string> = { detail: '🔍', manage: '☰', tools: '🛠', memo: '📝', shortcuts: '⌨' };

export class MemberViewerPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ceViewer';
    private static readonly CHIPS_KEY = 'ce.alignChips';
    private _view?: vscode.WebviewView;
    private _state: MemberViewerState = { member: undefined, classInfo: undefined, provider: undefined };
    private _stateKey: string = '';
    private _debounceTimer: ReturnType<typeof setTimeout> | undefined;
    private readonly _scopeAnalyzer = new LocalScopeAnalyzer();

    private _mode: ViewerMode = 'view';
    // Active tab of the member view: 'detail' (selected member) or 'manage'
    // (add / edit / rename / delete any member of the current type at any time).
    private _tab: SidebarTab = 'detail';
    /** The tab last chosen for each language: a Delphi unit opens on Structure, a SQL file on Tools, whatever was chosen there last. */
    private _tabByLanguage: Record<string, SidebarTab> = {};
    private _tabLanguage = '';
    // Sub-tab of the Tools tab (form / components / spacing / plsql / align); '' = the first one that applies.
    private _toolsTab = '';
    // Structure tab: filter text and kind, grouping, and the type being managed ('' = the one under the cursor).
    private _manageFilter = '';
    /** The file the Structure filter was typed for: another file starts with an empty filter. */
    private _filterFile = '';
    private _manageKind = '';
    private _manageGroup: ManageGroup = 'source';
    private _manageClassId = '';
    private _focusFilter = false;
    // The member the Structure tab is about: the one last clicked in its list or its usage lines ('' = the one under the cursor).
    private _focusId = '';
    // Moment of the last jump made from this view: the cursor events it causes must not change the member being looked at.
    private _ownJumpAt = 0;
    private _memberSearch = '';
    // Shortcuts tab: the filter text; and whether the last editor seen was a Delphi file (the designer tab has no text editor)
    private _shortcutFilter = '';
    private _delphiSeen = false;
    // Blocks under the selected member that are unfolded (kept between redraws).
    private _folds = { used: true, vars: true, find: true, events: true };
    private _dfmCache: { path: string; mtime: number; text: string } | undefined;
    private _hiLine?: vscode.TextEditorDecorationType;
    private _hiUse?: vscode.TextEditorDecorationType;
    private _hiFind?: vscode.TextEditorDecorationType;
    private _hiEditor?: vscode.TextEditor;
    // Memo tab: Markdown notes per language. '' = the language of the file being edited; '' mode = preview when there is text, else edit.
    private _memoLang = '';
    private _memoMode: MemoMode | '' = '';
    // The text of every memo shown or edited, so the page never waits for the disk and a save never races the next render.
    private readonly _memoCache = new Map<string, string>();
    private _memoFolder = '';
    private _memoWrites: Promise<void> = Promise.resolve();
    private _sessionCtx?: EditSessionContext;
    private _resolveSession?: (result: MemberFormResult | ExtractSpec | undefined) => void;
    // The local variable currently being edited inline (mode 'variable').
    private _editingVariable?: { name: string; type?: string };
    // Analytics: serializable payload rendered inline by getAnalyticsHtml.
    private _analyticsKind?: AnalyticsKind;
    private _analyticsData?: ReviewFinding[] | ExportData | DeadCodeItem[] | string;
    // The file a review is about (a click on a finding goes to it), the severities listed, their order, and the squiggles in the editor.
    private _analyticsUri?: vscode.Uri;
    private _reviewSev: Record<ReviewSeverity, boolean> = { ...DEFAULT_REVIEW_OPTIONS.sev };
    private _reviewSort: ReviewSort = DEFAULT_REVIEW_OPTIONS.sort;
    /** Kinds of finding the user ignores in this workspace, and whether the ignored ones are listed. */
    private _reviewShowIgnored = false;
    private reviewIgnored(): string[] { return this._extensionContext.workspaceState?.get<string[]>('ce.review.ignored', []) ?? []; }
    private _reviewDiag?: vscode.DiagnosticCollection;
    private _unusedDiag?: vscode.DiagnosticCollection;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _providerRegistry: ProviderRegistryLike,
        private readonly _codeExplorer: CodeExplorerService,
        private readonly _codeGenerator: CodeGeneratorService,
        private readonly _extensionContext: vscode.ExtensionContext
    ) {
        this._tabByLanguage = _extensionContext.globalState?.get<Record<string, SidebarTab>>('ce.tabByLanguage', {}) ?? {};
        _extensionContext.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(e => {
                this.scheduleCursorUpdate(e.textEditor);
            }),
            vscode.window.onDidChangeActiveTextEditor(editor => {
                // Another file: the tabs must be drawn again even when the new file has the same member id.
                this._stateKey = '';
                if (editor && editor.document.uri.scheme !== 'output') {
                    const lang = this._providerRegistry.getByDocument?.(editor.document)?.languageId ?? editor.document.languageId;
                    if (lang && lang !== this._tabLanguage) {
                        this._tabLanguage = lang;
                        const saved = this._tabByLanguage[lang];
                        if (saved) { this._tab = saved; }
                    }
                }
                if (editor && editor.document.uri.scheme !== 'output') {
                    const file = editor.document.uri.toString();
                    if (this._filterFile && file !== this._filterFile) { this._manageFilter = ''; this._manageKind = ''; }
                    this._filterFile = file;
                }
                if (editor) {
                    this.scheduleCursorUpdate(editor);
                } else if (this._mode === 'view') {
                    this.clearView();
                }
            }),
            vscode.workspace.onDidSaveTextDocument?.(doc => this.onMemoFileSaved(doc)),
            vscode.workspace.onDidChangeTextDocument(e => {
                const editor = vscode.window.activeTextEditor;
                // Only edits of the document being shown matter (output-channel
                // and other documents also fire this event), and typing is
                // debounced longer than a cursor move to avoid re-parsing per key.
                if (editor && e.document === editor.document) {
                    // The Structure list must follow the text, even when the cursor stays on the same member.
                    if (this._tab === 'manage') { this._stateKey = ''; }
                    this.scheduleCursorUpdate(editor, 300);
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
                case 'setTab': this.rememberTab(msg.tab); this.setTab(msg.tab === 'manage' ? 'manage' : msg.tab === 'tools' ? 'tools' : msg.tab === 'memo' ? 'memo' : msg.tab === 'shortcuts' ? 'shortcuts' : 'detail'); break;
                case 'shortcutFilter': this._shortcutFilter = typeof msg.text === 'string' ? msg.text.slice(0, 100) : ''; break;
                case 'openKeybindings': await vscode.commands.executeCommand('workbench.action.openGlobalKeybindings', '@ext:' + this.extensionId()); break;
                case 'memoSave': this.handleMemoSave(String(msg.lang), String(msg.text ?? '')); break;
                case 'memoLang': this._memoLang = sanitizeLang(String(msg.id)); this._memoMode = ''; this.setTab('memo'); break;
                case 'memoNew': await this.handleMemoNew(); break;
                case 'memoPage': await this.handleMemoPage(String(msg.lang)); break;
                case 'memoDelete': await this.handleMemoDelete(String(msg.lang)); break;
                case 'memoMode': this._memoMode = msg.mode === 'preview' ? 'preview' : 'edit'; this.setTab('memo'); break;
                case 'memoOpen': await this.handleMemoOpen(String(msg.lang)); break;
                case 'memoCopy': await this.handleMemoBlock(Number(msg.index), 'copy'); break;
                case 'memoInsert': await this.handleMemoBlock(Number(msg.index), 'insert'); break;
                case 'memoToggle': this.handleMemoToggle(Number(msg.line)); break;
                case 'memoLink': if (typeof msg.url === 'string' && /^https?:[/][/]/i.test(msg.url)) { await vscode.env.openExternal(vscode.Uri.parse(msg.url)); } break;
                case 'alignSelection': await alignSelection(typeof msg.token === 'string' ? msg.token : ''); break;
                case 'saveAlignChips': void this._extensionContext.globalState.update(MemberViewerPanel.CHIPS_KEY, sanitizeChips(msg.chips)); break;
                case 'plsql':
                    if (typeof msg.cmd === 'string' && PLSQL_COMMANDS.includes(msg.cmd)) { await vscode.commands.executeCommand(msg.cmd); }
                    break;
                case 'delphiCmd':
                    if (typeof msg.cmd === 'string' && DELPHI_COMMANDS.includes(msg.cmd)) { await vscode.commands.executeCommand(msg.cmd); }
                    break;
                case 'commonCmd':
                    if (typeof msg.cmd === 'string' && COMMON_COMMANDS.includes(msg.cmd)) { await vscode.commands.executeCommand(msg.cmd); }
                    break;
                case 'plsqlAlign':
                    if (typeof msg.id === 'string' && PLSQL_ALIGN_IDS.includes(msg.id)) { await vscode.commands.executeCommand('ce.plsql.alignPreset', msg.id); }
                    break;
                case 'setLanguage':
                    await vscode.commands.executeCommand('ce.setLanguageTo', typeof msg.id === 'string' ? msg.id : '', msg.scope === 'extension' ? 'extension' : 'file');
                    // the file is read again with the language that was chosen
                    { const ed = vscode.window.activeTextEditor ?? vscode.window.visibleTextEditors?.find(e => e.document === currentDocument()); if (ed) { this.onCursorChanged(ed); } }
                    this.setTab('tools');
                    break;
                case 'toolsTab': if (typeof msg.tab === 'string' && (TOOLS_SUBS as string[]).includes(msg.tab)) { this._toolsTab = msg.tab; } break;
                case 'manageAction': await this.handleManageAction(String(msg.act), String(msg.id)); break;
                case 'manageFilter':
                    this._manageFilter = typeof msg.text === 'string' ? msg.text.slice(0, 200) : '';
                    this._filterFile = currentDocument()?.uri.toString() ?? this._filterFile;
                    this._manageKind = ['method', 'field', 'property', 'constructor'].includes(msg.kind) ? msg.kind : '';
                    break;
                case 'manageGroup': if ((MANAGE_GROUPS as string[]).includes(msg.mode)) { this._manageGroup = msg.mode as ManageGroup; this.setTab('manage'); } break;
                case 'manageClass': this._manageClassId = typeof msg.id === 'string' ? msg.id : ''; this.setTab('manage'); break;
                case 'manageAdd': await this.handleManageAdd(String(msg.kind)); break;
                case 'manageLine': this.handleManageLine(Number(msg.line)); break;
                case 'manageFold': if (msg.key === 'used' || msg.key === 'vars' || msg.key === 'find' || msg.key === 'events') { this._folds[msg.key as 'used' | 'vars' | 'find' | 'events'] = msg.open === true; } break;
                case 'manageSearch': this.handleMemberSearch(String(msg.text ?? '')); break;
                case 'manageRefresh': this._codeExplorer.refresh(); this.setTab('manage'); break;
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
                case 'goTo': await this.handleGoTo(Number(msg.idx)); break;
                case 'reviewFilter':
                    if (msg.sev === 'error' || msg.sev === 'warning' || msg.sev === 'info') { this._reviewSev[msg.sev as ReviewSeverity] = msg.on === true; this.updateView(); }
                    break;
                case 'reviewIgnore': {
                    const key = typeof msg.key === 'string' ? msg.key : '';
                    if (!/^(code|cat):/.test(key)) { break; }
                    const now = new Set(this.reviewIgnored());
                    if (msg.on === true) { now.add(key); } else { now.delete(key); }
                    await this._extensionContext.workspaceState.update('ce.review.ignored', [...now]);
                    this.updateView();
                    break;
                }
                case 'reviewShowIgnored': this._reviewShowIgnored = !this._reviewShowIgnored; this.updateView(); break;
                case 'reviewSort': if ((REVIEW_SORTS as string[]).includes(msg.mode)) { this._reviewSort = msg.mode as ReviewSort; this.updateView(); } break;
                case '__diag': console.error('[CE] webview script error:', msg.error); break;
            }
        });

        const editor = vscode.window.activeTextEditor;
        if (this._mode !== 'view') {
            this.updateView();
        } else if (editor) {
            this.onCursorChanged(editor);
        }
    }

    private scheduleCursorUpdate(editor: vscode.TextEditor, delayMs = 75): void {
        if (this._mode !== 'view') { return; }
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = setTimeout(() => this.onCursorChanged(editor), delayMs);
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

        // The key names the file too, and what the tabs depend on (language, Delphi / PL/SQL), so that
        // switching to another file with the same member or no member still redraws the tabs.
        const newKey = doc.uri.toString() + '|' + provider.languageId + '|' + (foundMember ? foundMember.id : '') + ':' + (foundCls ? foundCls.id : '') + (this._tab === 'memo' ? ':' + this.memoLang() : '');
        // A jump made from the Structure tab (to a usage line, a search hit) lands in other members: the tab keeps
        // looking at the member it was about. A cursor moved by the user anywhere else takes the focus back.
        const ownJump = Date.now() - this._ownJumpAt < 700;
        if (this._focusId && !ownJump && (foundMember?.id ?? '') !== this._focusId) {
            this._focusId = '';
            this._stateKey = '';
        } else if (this._focusId && ownJump && (foundMember?.id ?? '') !== this._focusId && this._tab === 'manage') {
            this._stateKey = newKey;
            this._state.member = foundMember;
            this._state.classInfo = foundCls;
            this._state.provider = provider;
            return;
        }
        if (newKey === this._stateKey && this._view) {
            return;
        }
        this._stateKey = newKey;
        if ((foundCls?.id ?? '') !== (this._state.classInfo?.id ?? '')) { this._manageClassId = ''; }

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
            this.syncHighlights();
            return;
        }
        this.clearHighlights();
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
        this._focusId = '';
        this.clearHighlights();
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
            void notify.noEditor();
            return;
        }
        const provider = this._providerRegistry.getByDocument(editor.document);
        if (!provider) {
            vscode.window.showWarningMessage('No language provider for this file.');
            return;
        }
        const doc = editor.document;
        try {
            this.clearReviewDiagnostics();
            const doing: Record<string, string> = { review: 'Reviewing the file', documentation: 'Writing the documentation', export: 'Exporting the structure', deadcode: 'Looking for dead code' };
            await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: 'CE: ' + (doing[kind] ?? 'Working') + '…' }, async () => {
            await new Promise(r => setTimeout(r, 0));   // the message shows before the work starts
            switch (kind) {
                case 'review': {
                    const findings = reviewDocument(doc, provider);
                    this._analyticsData = findings;
                    this._analyticsUri = doc.uri;
                    this.publishReviewDiagnostics(doc, findings);
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
                    // first what the compiler / linter of the language says about this file, then what nothing in the workspace refers to
                    const text = doc.getText();
                    const extra = /\.pas$/i.test(doc.uri.fsPath) ? await this.siblingDfmText(doc) : '';
                    const own: DeadCodeItem[] = unusedInParsed(provider.parseDocument(doc), text, doc.uri.fsPath, extra).map(f => ({
                        kind: f.kind, name: f.name, file: doc.uri.fsPath, line: f.line, col: f.col, endCol: f.endCol, rule: f.rule, tool: f.tool, message: f.message,
                    }));
                    const extensions = provider.fileExtensions.map(e => e.substring(1));
                    const wide = await vscode.window.withProgress(
                        { location: vscode.ProgressLocation.Window, title: 'CE: Scanning workspace for dead code…' },
                        (progress) => collectDeadCode(this._providerRegistry, extensions, (done, total, file) => {
                            progress.report({ message: `${done}/${total} ${file}` });
                        }),
                    );
                    this._analyticsData = [...own, ...wide];
                    this._analyticsUri = doc.uri;
                    this.publishUnusedDiagnostics(doc, own);
                    break;
                }
            }
            });
            this._analyticsKind = kind;
            this._mode = 'analytics';
            this.updateView();
        } catch (e) {
            void notify.failed('Analytics failed: ' + (e instanceof Error ? e.message : String(e)));
        }
    }

    /** The findings as squiggles in the file and entries of the Problems panel, until the report is closed. */
    private publishReviewDiagnostics(doc: vscode.TextDocument, findings: ReviewFinding[]): void {
        if (typeof vscode.languages?.createDiagnosticCollection !== 'function') { return; }
        this._reviewDiag ??= vscode.languages.createDiagnosticCollection('ce-review');
        const level = { error: vscode.DiagnosticSeverity.Error, warning: vscode.DiagnosticSeverity.Warning, info: vscode.DiagnosticSeverity.Information };
        // what a language server reported is already in the Problems panel: only the review's own findings are added
        const diagnostics = findings.filter(f => f.line < doc.lineCount && !f.source).map(f => {
            const text = doc.lineAt(f.line).text;
            const start = f.col ?? text.length - text.trimStart().length;
            const end = Math.max(f.endCol ?? text.trimEnd().length, start + 1);
            const d = new vscode.Diagnostic(new vscode.Range(f.line, start, f.line, end), f.message + (f.hint ? ' — ' + f.hint : ''), level[f.severity]);
            d.source = 'CE Review';
            d.code = f.code ?? f.category;
            return d;
        });
        this._reviewDiag.set(doc.uri, diagnostics);
    }

    private clearReviewDiagnostics(): void {
        this._reviewDiag?.clear();
        this._unusedDiag?.clear();
    }

    /** The text of the .dfm next to a Delphi unit: it names the event handlers, which nothing in the unit calls. */
    private async siblingDfmText(doc: vscode.TextDocument): Promise<string> {
        try { return Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.file(doc.uri.fsPath.replace(/\.pas$/i, '.dfm')))).toString('latin1'); } catch { return ''; }
    }

    /** The unused code as faded text in the editor (and hints in the Problems panel) until the report is closed. */
    private publishUnusedDiagnostics(doc: vscode.TextDocument, items: DeadCodeItem[]): void {
        if (typeof vscode.languages?.createDiagnosticCollection !== 'function') { return; }
        this._unusedDiag ??= vscode.languages.createDiagnosticCollection('ce-unused');
        const diagnostics = items.filter(d => d.line < doc.lineCount).map(d => {
            const x = new vscode.Diagnostic(new vscode.Range(d.line, d.col ?? 0, d.line, Math.max(d.endCol ?? 0, (d.col ?? 0) + 1)), (d.message ?? d.name) + (d.tool ? ' (' + d.tool + ')' : ''), vscode.DiagnosticSeverity.Hint);
            x.source = 'CE Dead code';
            x.code = d.rule;
            x.tags = [vscode.DiagnosticTag.Unnecessary];
            return x;
        });
        this._unusedDiag.set(doc.uri, diagnostics);
    }

    /** A click on a finding of the review, or on an entry of the dead code list: the editor goes to that place. */
    private async handleGoTo(idx: number): Promise<void> {
        if (!Number.isInteger(idx) || idx < 0) { return; }
        let uri: vscode.Uri | undefined;
        let range: vscode.Range | undefined;
        if (this._analyticsKind === 'review') {
            const f = (this._analyticsData as ReviewFinding[] | undefined)?.[idx];
            if (!f || !this._analyticsUri) { return; }
            uri = this._analyticsUri;
            range = new vscode.Range(f.line, f.col ?? 0, f.line, f.endCol ?? f.col ?? 0);
        } else if (this._analyticsKind === 'deadcode') {
            const d = (this._analyticsData as DeadCodeItem[] | undefined)?.[idx];
            if (!d) { return; }
            uri = vscode.Uri.file(d.file);
            range = new vscode.Range(d.line, d.col ?? 0, d.line, d.endCol ?? d.col ?? 0);
        }
        if (!uri || !range) { return; }
        try { await vscode.window.showTextDocument(uri, { selection: range, preserveFocus: false }); }
        catch { vscode.window.showWarningMessage('CE: That file could not be opened.'); }
    }

    /** Leaves the analytics view and returns to member tracking. */
    private endAnalytics(): void {
        this.clearReviewDiagnostics();
        this._analyticsUri = undefined;
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
    /** Reveals the sidebar on the Structure tab (command, keybinding and code lens entry point). */
    public async showManageTab(): Promise<void> {
        this._tab = 'manage';
        try { await vscode.commands.executeCommand(`${MemberViewerPanel.viewType}.focus`); } catch { /* view unavailable */ }
        this.setTab('manage');
    }

    /** Whether the active editor is a Delphi unit or form file. */
    /** The language drop-down of the Tools tab: what the extension detects, and what was chosen by hand. */
    private languageInfo(): LanguageInfo | undefined {
        const doc = currentDocument();
        if (!doc || !doc.uri.fsPath) { return undefined; }
        const file = doc.uri.fsPath;
        return {
            options: (this._providerRegistry.getAllProviders?.() ?? []).map(p => ({ id: p.languageId, label: p.displayName })),
            current: languageOverrides.resolve(file) ?? '',
            detected: this._providerRegistry.getByDocument(doc, true)?.displayName ?? '',
            ext: extensionOf(file),
            byExtension: languageOverrides.source(file) === 'extension',
        };
    }

    private isDelphi(): boolean {
        const file = vscode.window.activeTextEditor?.document.uri.fsPath;
        // a file that was given Pascal by hand gets the Delphi tools too
        if (file !== undefined) { this._delphiSeen = /\.(pas|dfm)$/i.test(file) || languageOverrides.resolve(file) === 'pascal'; }
        return this._delphiSeen;
    }

    private extensionId(): string {
        return this._extensionContext.extension?.id ?? 'ce.ce-code-explorer';
    }

    /** Shortcuts tab: the keybindings of this extension, by the mode they work in. */
    private getShortcutsHtml(): string {
        const pkg = (this._extensionContext.extension?.packageJSON ?? {}) as PackageShortcuts;
        return shortcutsHtml(buildShortcutGroups(pkg), this._shortcutFilter, this.extensionId());
    }

    /** Whether the active editor holds PL/SQL (real extension, or a .txt / .sql that contains it). */
    private isPlSql(): boolean {
        const doc = vscode.window.activeTextEditor?.document;
        return !!doc && this._providerRegistry.getByDocument(doc)?.languageId === 'plsql';
    }

    private alignChips(): string[] {
        const saved = this._extensionContext.globalState?.get<unknown>(MemberViewerPanel.CHIPS_KEY);
        return saved === undefined ? sanitizeChips(undefined) : sanitizeChips(saved);
    }

    /* ───────── memo: Markdown notes per language ───────── */

    /** Folder of the memos: the `ce.memo.folder` setting (relative to the workspace), else the extension's own storage. */
    private memoFolder(): string {
        const configured = (typeof vscode.workspace.getConfiguration === 'function' ? vscode.workspace.getConfiguration('ce').get<string>('memo.folder', '') : '').trim();
        if (configured) {
            if (path.isAbsolute(configured)) { return configured; }
            const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (root) { return path.join(root, configured); }
        }
        return path.join(this._extensionContext.globalStorageUri?.fsPath ?? path.join(os.tmpdir(), 'ce-code-explorer'), 'memos');
    }

    private memoStore(): MemoStore {
        const folder = this.memoFolder();
        if (folder !== this._memoFolder) { this._memoFolder = folder; this._memoCache.clear(); }
        return new MemoStore(folder);
    }

    /** The memo shown: the chosen one, else main. */
    private memoLang(): string {
        return this._memoLang || MAIN_MEMO;
    }

    private memoText(lang: string): string {
        const store = this.memoStore();
        let text = this._memoCache.get(lang);
        if (text === undefined) { text = store.readSync(lang); this._memoCache.set(lang, text); }
        return text;
    }

    private getMemoHtml(): string {
        const store = this.memoStore();
        store.ensureMainSync();   // a folder always starts with main.md
        const lang = this.memoLang();
        const text = this.memoText(lang);
        const filled = new Set(store.languagesSync());
        const names = store.namesSync();
        if (!names.includes(lang)) { names.push(lang); }
        const mode: MemoMode = this._memoMode || (text.trim() ? 'preview' : 'edit');
        return memoHtml({ names: names.map(id => ({ id, label: id, filled: filled.has(id) || !!this._memoCache.get(id)?.trim() })), selected: lang, mode, text, file: store.fileFor(lang) });
    }

    /** Reveals the sidebar on the Memo tab (command and keybinding entry point). */
    public async showMemoTab(): Promise<void> {
        this._tab = 'memo';
        try { await vscode.commands.executeCommand(`${MemberViewerPanel.viewType}.focus`); } catch { /* view unavailable */ }
        this.setTab('memo');
    }

    private handleMemoSave(lang: string, text: string): void {
        const id = sanitizeLang(lang);
        const store = this.memoStore(); // first: it drops the cache when the folder setting changed
        const before = this._memoCache.get(id);
        this._memoCache.set(id, text);
        if (before === text) { return; }
        this._memoWrites = this._memoWrites
            .then(() => store.write(id, text))
            .catch(e => { void notify.failed('CE: The memo was not saved: ' + (e instanceof Error ? e.message : String(e))); });
    }

    /** Ticks / unticks a task box of the preview: the memo changes, the page keeps its scroll (the box already flipped). */
    private handleMemoToggle(line: number): void {
        const lang = this.memoLang();
        const next = toggleTask(this.memoText(lang), line);
        if (next !== undefined) { this.handleMemoSave(lang, next); }
    }

    /** Copy / Insert buttons of a code block of the preview. */
    private async handleMemoBlock(index: number, how: 'copy' | 'insert'): Promise<void> {
        const text = codeBlocks(this.memoText(this.memoLang()))[index];
        if (text === undefined) { return; }
        if (how === 'copy') {
            await vscode.env.clipboard.writeText(text);
            vscode.window.setStatusBarMessage('CE: block copied to the clipboard', 2500);
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) { vscode.window.showWarningMessage('CE: Open a file to insert the block into.'); return; }
        await editor.edit(b => { for (const sel of editor.selections) { b.replace(sel, text); } });
    }

    /** The memo as a file, in the editor (created on the spot when it does not exist yet). */
    private async handleMemoOpen(lang: string): Promise<void> {
        const id = sanitizeLang(lang);
        const store = this.memoStore();
        const file = store.fileFor(id);
        if (!fs.existsSync(file)) { await store.write(id, this.memoText(id) || '# Memo - ' + id + '\n\n'); }
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
        await vscode.window.showTextDocument(doc, { preview: false });
    }

    /** + New memo: asks for a name, creates the file and opens it in the tab, ready to write. */
    private async handleMemoNew(): Promise<void> {
        const store = this.memoStore();
        const name = await vscode.window.showInputBox({
            title: 'New memo', prompt: 'Name of the memo (a file name.md is made from it)', placeHolder: 'Release notes',
            validateInput: v => {
                const id = memoId(v);
                if (!v.trim()) { return undefined; }
                if (!id) { return 'Use letters or digits'; }
                return store.exists(id) ? '"' + id + '" already exists: pick it in the list' : undefined;
            },
        });
        const id = name ? memoId(name) : '';
        if (!id) { return; }
        if (!store.exists(id)) { await store.write(id, '# ' + name!.trim().replace(/\.md$/i, '') + '\n\n'); this._memoCache.delete(id); }
        this._memoLang = id;
        this._memoMode = 'edit';
        this.setTab('memo');
    }

    /** The memo as a page: the Markdown viewer / editor of the application (headings, to-do boxes, a "/" menu), not the plain text editor. */
    private async handleMemoPage(lang: string): Promise<void> {
        const id = sanitizeLang(lang);
        const store = this.memoStore();
        await this._memoWrites;   // what was typed is on the disk before the page reads it
        if (!store.exists(id)) { await store.write(id, this.memoText(id) || '# ' + id + '\n\n'); }
        try { await vscode.commands.executeCommand('vscode.openWith', vscode.Uri.file(store.fileFor(id)), 'ce.markdownEditor'); }
        catch { await this.handleMemoOpen(id); }
    }

    /** The memo goes to the trash (it can be taken back from there); main stays. */
    private async handleMemoDelete(lang: string): Promise<void> {
        const id = sanitizeLang(lang);
        if (id === MAIN_MEMO) { return; }
        const store = this.memoStore();
        const pick = await vscode.window.showWarningMessage('Move the memo "' + id + '" to the trash?', { modal: true, detail: store.fileFor(id) }, 'Move to trash');
        if (pick !== 'Move to trash') { return; }
        try { await this._memoWrites; await vscode.workspace.fs.delete(vscode.Uri.file(store.fileFor(id)), { useTrash: true }); }
        catch (e) { void notify.failed('CE: The memo was not deleted: ' + (e instanceof Error ? e.message : String(e))); return; }
        this._memoCache.delete(id);
        this._memoLang = MAIN_MEMO;
        this._memoMode = '';
        this.setTab('memo');
    }

    /** A memo saved from the editor replaces what the sidebar holds for it. */
    private onMemoFileSaved(doc: vscode.TextDocument): void {
        if (!this._memoFolder || path.dirname(doc.uri.fsPath) !== this._memoFolder || !/[.]md$/i.test(doc.uri.fsPath)) { return; }
        this._memoCache.delete(sanitizeLang(path.basename(doc.uri.fsPath, path.extname(doc.uri.fsPath))));
        if (this._tab === 'memo' && this._mode === 'view') { this._stateKey = ''; this.updateView(); }
    }

    /** The tab the user picked is the one this language comes back to. */
    private rememberTab(tab: unknown): void {
        if (!this._tabLanguage || (tab !== 'detail' && tab !== 'manage' && tab !== 'tools' && tab !== 'memo' && tab !== 'shortcuts')) { return; }
        this._tabByLanguage[this._tabLanguage] = tab;
        void this._extensionContext.globalState?.update('ce.tabByLanguage', this._tabByLanguage);
    }

    private setTab(tab: SidebarTab): void {
        this._tab = tab;
        this._stateKey = '';
        const editor = vscode.window.activeTextEditor;
        if (editor && this._mode === 'view') { this.onCursorChanged(editor); } else { this.updateView(); }
    }

    /** What the Structure tab manages: a type of the file (the chosen one, else the one under the cursor), or its standalone routines. */
    private manageContext(): { classes: ClassInfo[]; standalone: ClassMember[]; current: ClassInfo | undefined; isFile: boolean } {
        const doc = vscode.window.activeTextEditor?.document;
        const parsed = doc && typeof this._codeExplorer?.getParsedDocument === 'function' ? this._codeExplorer.getParsedDocument(doc) : undefined;
        const classes = parsed ? parsed.classes : (this._state.classInfo ? [this._state.classInfo] : []);
        const standalone = parsed ? parsed.standaloneProcedures : [];
        const chosen = this._manageClassId;
        const cursorCls = this._state.classInfo;
        let current: ClassInfo | undefined;
        let isFile = false;
        if (chosen === FILE_LEVEL_ID) { isFile = true; }
        else if (chosen && classes.some(c => c.id === chosen)) { current = classes.find(c => c.id === chosen); }
        else if (cursorCls) { current = classes.find(c => c.id === cursorCls.id) ?? cursorCls; }
        else if (this._state.member || classes.length === 0) { isFile = true; }
        else { current = classes[0]; }
        return { classes, standalone, current, isFile };
    }

    /** Members listed by the Manage tab: the chosen type's members, or the file's standalone routines. */
    private manageTargets(): ClassMember[] {
        const ctx = this.manageContext();
        return ctx.current ? [...ctx.current.members].sort((a, b) => a.range.start.line - b.range.start.line) : [...ctx.standalone];
    }

    /** The member the Structure tab is about: the one clicked last, else the one under the cursor. */
    private focusMember(): ClassMember | undefined {
        if (this._focusId) {
            const m = this.manageTargets().find(x => x.id === this._focusId);
            if (m) { return m; }
        }
        return this._state.member;
    }

    /** The text of the .dfm that goes with the unit being edited (Delphi), read again only when the file changed. */
    private dfmText(): string | undefined {
        const doc = vscode.window.activeTextEditor?.document ?? currentDocument();
        const m = doc ? /^(.*)\.pas$/i.exec(doc.uri.fsPath) : null;
        if (!m) { return undefined; }
        const path = m[1] + '.dfm';
        try {
            const st = fs.statSync(path);
            if (this._dfmCache && this._dfmCache.path === path && this._dfmCache.mtime === st.mtimeMs) { return this._dfmCache.text; }
            const text = fs.readFileSync(path, 'latin1');
            this._dfmCache = { path, mtime: st.mtimeMs, text };
            return text;
        } catch { return undefined; }
    }

    /** The button of the top of the Structure tab: shown for a unit that has a form, naming the component of the focus when it is one. */
    private designerButton(member: ClassMember | undefined): { id: string; name?: string } | undefined {
        const dfm = this.dfmText();
        if (!dfm) { return undefined; }
        const isComponent = !!member && member.kind === MemberKind.Field && hasComponent(dfm, member.name);
        return isComponent && member ? { id: member.id, name: member.name } : { id: '' };
    }

    /** The routines of the file with their lines (the declaration and the implementation of each), to say which one holds a line. */
    private parentRanges(): ParentRange[] {
        const ctx = this.manageContext();
        const out: ParentRange[] = [];
        const add = (m: ClassMember, owner?: string): void => {
            if (m.kind === MemberKind.Field || m.kind === MemberKind.Property) { return; }
            const name = owner ? owner + '.' + m.name : m.name;
            out.push({ name, start: m.range.start.line, end: m.range.end.line });
            if (m.implementationRange) { out.push({ name, start: m.implementationRange.start.line, end: m.implementationRange.end.line }); }
        };
        for (const c of ctx.classes) { for (const m of c.members) { add(m, c.name && !c.isSynthetic ? c.name : undefined); } }
        for (const m of ctx.standalone) { add(m); }
        return out;
    }

    /** A component's events and the handlers' lines; for a routine, the events it answers. */
    private formLinks(member: ClassMember): { events?: { event: string; handler: string; line?: number }[]; menuItems?: FocusView['menuItems']; handlerOf?: string[] } {
        const dfm = this.dfmText();
        if (!dfm) { return {}; }
        const all = [...this.manageContext().classes.flatMap(c => c.members), ...this.manageContext().standalone];
        const lineOf = (handler: string): number | undefined => {
            const h = all.find(x => x.name.toLowerCase() === handler.toLowerCase() && x.kind !== MemberKind.Field);
            return h ? (h.implementationRange ?? h.range).start.line : undefined;
        };
        if (member.kind === MemberKind.Field) {
            if (!hasComponent(dfm, member.name)) { return {}; }
            const wired = eventsOfComponent(dfm, member.name);
            // a menu lists its items too, each with the handler of its OnClick
            const items = menuItemsOf(dfm, member.name).map(i => {
                const click = i.events.find(e => e.event === 'OnClick') ?? i.events[0];
                return { name: i.name, caption: i.caption, depth: i.depth, shortcut: i.shortcut, event: click?.event, handler: click?.handler, line: click ? lineOf(click.handler) : undefined };
            });
            if (!wired.length && !items.length) { return {}; }
            return {
                events: wired.length ? wired.map(w => ({ event: w.event, handler: w.handler, line: lineOf(w.handler) })) : undefined,
                menuItems: items.length ? items : undefined,
            };
        }
        const of = eventsOfHandler(dfm, member.name);
        return of.length ? { handlerOf: of } : {};
    }

    /**
     * From the form designer: the Structure tab, filtered on the component, with the component opened (its events, where it is used).
     * The unit has just been shown, so the panel waits for the editor change to settle before it sets its own state.
     */
    public async showComponentInStructure(name: string): Promise<void> {
        await new Promise(r => setTimeout(r, 200));
        const ctx = this.manageContext();
        const owner = ctx.classes.find(c => c.members.some(m => m.name.toLowerCase() === name.toLowerCase()));
        if (owner) { this._manageClassId = owner.id; }
        const found = (owner?.members ?? []).find(m => m.name.toLowerCase() === name.toLowerCase());
        this._manageFilter = name;
        this._manageKind = '';
        this._focusId = found?.id ?? '';
        this._memberSearch = '';
        this._folds.used = true;
        this._folds.events = true;
        this._tab = 'manage';
        this._stateKey = '';
        this.updateView();
        // the sidebar is shown without taking the focus: the keys of the unit (Ctrl+K Ctrl+B back to the designer) keep working
        try {
            if (this._view) { this._view.show(true); } else { await vscode.commands.executeCommand('ceViewer.focus'); }
            await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
        } catch { /* the view is shown already */ }
    }

    /** Where the focused member is used in the current file, and the search inside its code. */
    private focusData(withVariables = false): FocusView | undefined {
        const member = this.focusMember();
        const doc = vscode.window.activeTextEditor?.document;
        if (!member) { return undefined; }
        const lines = doc ? doc.getText().split(/\r?\n/) : [];
        const skip = new Set<number>([member.range.start.line]);
        if (member.implementationRange) { skip.add(member.implementationRange.start.line); }
        const use = usageLines(lines, member.name, skip);
        use.hits = withParents(use.hits, this.parentRanges());
        const searchable = member.kind !== MemberKind.Field && member.kind !== MemberKind.Property;
        const found = searchable && this._memberSearch ? searchLines(lines, memberLineRanges(member), this._memberSearch) : { hits: [] as LineHit[], total: 0 };
        const kindLabel = member.kind.charAt(0).toUpperCase() + member.kind.slice(1);
        // The variables can be edited only where the cursor is: the actions of the Details tab work on the member under it.
        const editable = !!this._state.member && this._state.member.id === member.id;
        const variables = withVariables && searchable ? this.variablesBody(member, editable) : undefined;
        return {
            id: member.id, name: member.name, kindLabel, usages: use.hits, usageTotal: use.total,
            searchable, search: this._memberSearch, searchHits: found.hits, searchTotal: found.total,
            variables, open: { ...this._folds }, ...this.formLinks(member),
        };
    }

    /** Go to a line of the usage or search lists, keeping the member being looked at. */
    private handleManageLine(line: number): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !Number.isInteger(line) || line < 0 || line >= editor.document.lineCount) { return; }
        this._focusId = this.focusMember()?.id ?? '';
        this._ownJumpAt = Date.now();
        const text = editor.document.lineAt(line).text;
        const pos = new vscode.Position(line, Math.max(0, text.length - text.trimStart().length));
        void vscode.window.showTextDocument(editor.document, { viewColumn: editor.viewColumn, selection: new vscode.Range(pos, pos), preserveFocus: false });
    }

    /** Search box of the Structure tab: lines of the focused member's code that match; only the list below the box is replaced. */
    private handleMemberSearch(text: string): void {
        this._memberSearch = text.slice(0, 200);
        const f = this.focusData();
        void this._view?.webview.postMessage({ command: 'memberHits', hits: f?.searchHits ?? [], total: f?.searchTotal ?? 0, query: this._memberSearch.trim() });
        this.syncHighlights();
    }

    private clearHighlights(): void {
        const editor = this._hiEditor;
        if (editor) {
            for (const d of [this._hiLine, this._hiUse, this._hiFind]) { if (d) { editor.setDecorations(d, []); } }
        }
        this._hiEditor = undefined;
    }

    /** The lines that use the focused member, and the lines found by the search, shown in the editor of the file. */
    private syncHighlights(): void {
        const editor = vscode.window.activeTextEditor;
        if (this._tab !== 'manage' || this._mode !== 'view' || !editor || typeof vscode.window.createTextEditorDecorationType !== 'function') {
            this.clearHighlights();
            return;
        }
        const f = this.focusData();
        if (!f) { this.clearHighlights(); return; }
        if (this._hiEditor && this._hiEditor !== editor) { this.clearHighlights(); }
        this._hiLine ??= vscode.window.createTextEditorDecorationType({
            isWholeLine: true, backgroundColor: 'rgba(255, 200, 0, 0.10)',
            overviewRulerColor: new vscode.ThemeColor('editorOverviewRuler.wordHighlightForeground'), overviewRulerLane: vscode.OverviewRulerLane.Center,
        });
        this._hiUse ??= vscode.window.createTextEditorDecorationType({ backgroundColor: new vscode.ThemeColor('editor.wordHighlightBackground') });
        this._hiFind ??= vscode.window.createTextEditorDecorationType({
            isWholeLine: true, backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
            overviewRulerColor: new vscode.ThemeColor('editorOverviewRuler.findMatchForeground'), overviewRulerLane: vscode.OverviewRulerLane.Right,
        });
        const at = (h: LineHit) => new vscode.Range(h.line, h.start, h.line, h.end);
        const row = (h: LineHit) => new vscode.Range(h.line, 0, h.line, 0);
        editor.setDecorations(this._hiLine, f.usages.map(row));
        editor.setDecorations(this._hiUse, f.usages.map(at));
        editor.setDecorations(this._hiFind, f.searchHits.map(row));
        this._hiEditor = editor;
    }

    /** Add button of the tab: the new member goes to the chosen type, whatever the cursor is on. */
    private async handleManageAdd(kind: string): Promise<void> {
        const command = ({ field: 'ce.addField', method: 'ce.addMethod', property: 'ce.addProperty', constructor: 'ce.addConstructor' } as Record<string, string>)[kind];
        if (!command) { return; }
        const { current } = this.manageContext();
        await vscode.commands.executeCommand(command, current ? { itemData: current, parentClass: current } : undefined);
    }

    /** Filter box of the Structure tab, from the "Filter Members" command or its shortcut. */
    public async focusManageFilter(): Promise<void> {
        this._focusFilter = true;
        await this.showManageTab();
    }

    public clearManageFilter(): void {
        this._manageFilter = '';
        this._manageKind = '';
        if (this._tab === 'manage') { this.setTab('manage'); }
    }

    /** Next grouping of the list (source order, visibility, kind, A → Z). */
    public cycleManageGroup(): ManageGroup {
        this._manageGroup = MANAGE_GROUPS[(MANAGE_GROUPS.indexOf(this._manageGroup) + 1) % MANAGE_GROUPS.length];
        if (this._tab === 'manage') { this.setTab('manage'); }
        return this._manageGroup;
    }

    /** Edit / rename / delete / go-to / accessors / move on ANY member listed in the Manage tab (not only the one under the cursor). */
    private async handleManageAction(act: string, id: string): Promise<void> {
        if (act === 'designer') {
            const target = this.manageTargets().find(x => x.id === id);
            await vscode.commands.executeCommand('ce.delphi.showInDesigner', target ? target.name : '');
            return;
        }
        // a routine declared inside another one: no member of its own, only a place to go to
        if (act === 'goline') {
            const ed = vscode.window.activeTextEditor ?? vscode.window.visibleTextEditors?.find(e => e.document === currentDocument());
            const line = Number(id);
            if (ed && Number.isInteger(line) && line >= 0 && line < ed.document.lineCount) {
                const at = new vscode.Position(line, 0);
                ed.selection = new vscode.Selection(at, at);
                ed.revealRange(new vscode.Range(at, at), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
                await vscode.window.showTextDocument(ed.document, { viewColumn: ed.viewColumn, selection: new vscode.Range(at, at) });
            }
            return;
        }
        const ctx = this.manageContext();
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
        const reveal = async (): Promise<void> => {
            const pos = member.implementationRange?.start ?? member.range.start;
            await vscode.window.showTextDocument(doc, { selection: new vscode.Range(pos, pos) });
        };
        if (act === 'go') {
            this._focusId = member.id;
            this._memberSearch = '';
            this._ownJumpAt = Date.now();
            await reveal();
            return;
        }
        // These two commands take the same argument as the former tree items: the member and its type.
        if (act === 'getset' && ctx.current) { await vscode.commands.executeCommand('ce.generateGettersSetters', { itemData: member, parentClass: ctx.current }); return; }
        if (act === 'move' && ctx.current) { await vscode.commands.executeCommand('ce.moveMember', { itemData: member, parentClass: ctx.current }); return; }
        await this.handleMemberAction(act, { member, classInfo: ctx.current });
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
            body = reviewHtml((data as ReviewFinding[]) || [], { sev: this._reviewSev, sort: this._reviewSort, ignored: this.reviewIgnored(), showIgnored: this._reviewShowIgnored });
        } else if (kind === 'deadcode') {
            body = deadCodeHtml((data as DeadCodeItem[]) || [], this._analyticsUri?.fsPath ?? '');
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
.tbl tr[data-idx] { cursor: pointer; }
.tbl tr[data-idx]:hover, .tbl tr[data-idx]:focus { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.15)); outline: none; }
${reviewCss()}
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
(function () {
    var api = acquireVsCodeApi();
    document.getElementById('btnClose').addEventListener('click', function () { api.postMessage({ command: 'closeAnalytics' }); });
    document.querySelectorAll('[data-idx]').forEach(function (r) {
        function go(e) { if (e && e.target && e.target.closest && e.target.closest('[data-ignore]')) { return; } api.postMessage({ command: 'goTo', idx: Number(r.getAttribute('data-idx')) }); }
        r.addEventListener('click', go);
        r.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    document.querySelectorAll('[data-ignore]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'reviewIgnore', key: b.getAttribute('data-ignore'), on: b.getAttribute('data-on') === '1' }); });
    });
    var showIgn = document.getElementById('rShowIgnored');
    if (showIgn) { showIgn.addEventListener('click', function () { api.postMessage({ command: 'reviewShowIgnored' }); }); }
    document.querySelectorAll('[data-sev]').forEach(function (b) {
        b.addEventListener('click', function () { api.postMessage({ command: 'reviewFilter', sev: b.getAttribute('data-sev'), on: !b.classList.contains('on') }); });
    });
    var sort = document.getElementById('rSort');
    if (sort) { sort.addEventListener('change', function () { api.postMessage({ command: 'reviewSort', mode: sort.value }); }); }
    var again = document.getElementById('rAgain');
    if (again) { again.addEventListener('click', function () { api.postMessage({ command: 'runAnalytics', kind: 'review' }); }); }
})();
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
.promote-row { display: flex; gap: 4px; align-items: center; }
.promote-row > * { flex: 0 0 auto; }
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
<div class="promote-row">
<select id="promoteVis">
${visOptions.map(v => `<option value="${v}">${v}</option>`).join('')}
</select>
<button class="btn-secondary" id="btnPromote">→ Promote</button>
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
                quick('➕ Add Method', 'ce.addMethod'),
                quick('📦 Add Field', 'ce.addField'),
                quick('🔑 Add Property', 'ce.addProperty'),
                quick('🏗️ Add Constructor', 'ce.addConstructor'),
                quick('🧩 Insert Template', 'ce.insertTemplate'),
                quick('🗂️ Manage Templates', 'ce.manageTemplates'),
            ]},
            { title: 'Maintain', items: [
                quick('🔎 Go to Member', 'ce.goToMember'),
                quick('🔄 Synchronize Decl/Impl', 'ce.synchronizeDeclImpl'),
                quick('🔑 Generate Getters/Setters', 'ce.generateGettersSetters'),
                quick('📄 Insert Doc Header', 'ce.insertDocHeader'),
            ]},
            { title: 'Explorer', items: [
                quick('🔍 Filter Members', 'ce.filterTree'),
                quick('♻️ Refresh', 'ce.refreshExplorer'),
            ]},
        ];
        const groupsHtml = groups.map(g =>
            `<div class="qa-group"><div class="qa-title">${escapeHtml(g.title)}</div><div class="qa-grid">${g.items.join('')}</div></div>`
        ).join('');

        // Same three tabs as the member view, so the tools are never stacked under the quick actions.
        const body = this._tab === 'tools'
            ? toolsHtml(getLastAlignToken(), this.alignChips(), this.isPlSql(), this.isDelphi(), this._toolsTab, this.languageInfo())
            : this._tab === 'manage'
                ? this.getManageHtml()
                : this._tab === 'memo'
                ? this.getMemoHtml()
                : this._tab === 'shortcuts'
                ? this.getShortcutsHtml()
                : `<div class="empty">
<div class="icon">🔍</div>
<p>Place the cursor on a class member to view &amp; edit it, or start with one of these.</p>
</div>
<div class="qa-grid qa-main">${quick('☰ Structure of the file', 'ce.manageMembers')}${quick('🔎 Go to a member', 'ce.nav.pickMember')}${quick('⚡ Quick actions', 'ce.showActions')}</div>
<details class="qa-more"><summary>More actions</summary>${groupsHtml}</details>`;

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
.qa-main { margin: 6px 0 10px; }
.qa-more > summary { cursor: pointer; color: var(--vscode-descriptionForeground); font-size: 11px; margin: 6px 0; }
.qa { display: block; width: 100%; text-align: left; padding: 6px 10px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; font-size: 12px; font-family: inherit; background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.12)); color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); }
.qa:hover { background: var(--vscode-button-secondaryHoverBackground, rgba(127,127,127,0.2)); }
.ana { display: block; width: 100%; text-align: left; padding: 5px 8px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; font-size: 11px; font-family: inherit; background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.12)); color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); }
.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--vscode-descriptionForeground); margin-bottom: 6px; letter-spacing: 0.5px; }
.hint { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--vscode-descriptionForeground); }
${toolsCss()}
${manageCss()}
${memoCss()}
${shortcutsCss()}
</style>
</head>
<body>
${this.tabsHtml('Actions')}
${body}
<script nonce="${nonce}">
${toolsScript()}
${manageScript()}
${memoScript()}
${shortcutsScript()}
(function() {
    var api = acquireVsCodeApi();
    initTools(api);
    initManage(api);
    initMemo(api);
    initShortcuts(api);
    document.querySelectorAll('.qa').forEach(function(b) {
        b.addEventListener('click', function() { api.postMessage({ command: 'run', cmd: b.getAttribute('data-cmd') }); });
    });
    document.querySelectorAll('.tab').forEach(function(b) {
        b.addEventListener('click', function() { api.postMessage({ command: 'setTab', tab: b.getAttribute('data-tab') }); });
    });
    var tm = document.getElementById('tabMore'), tmenu = document.getElementById('tabMenu');
    if (tm && tmenu) {
        tm.addEventListener('click', function() {
            var open = tmenu.hidden;
            tmenu.hidden = !open;
            if (open) { var r = tm.getBoundingClientRect(); tmenu.style.left = Math.max(2, Math.min(r.left, window.innerWidth - 150)) + 'px'; tmenu.style.top = r.bottom + 'px'; }
        });
        document.addEventListener('mousedown', function(e) { if (!tmenu.hidden && !tmenu.contains(e.target) && e.target !== tm) { tmenu.hidden = true; } });
    }
    document.querySelectorAll('[data-m-act]').forEach(function(b) {
        b.addEventListener('click', function() {
            api.postMessage({ command: 'manageAction', act: b.getAttribute('data-m-act'), id: b.getAttribute('data-id') });
        });
    });
    document.querySelectorAll('.ana[data-run]').forEach(function(b) {
        b.addEventListener('click', function() { api.postMessage({ command: 'run', cmd: b.getAttribute('data-run') }); });
    });
    document.querySelectorAll('.ana[data-addvar]').forEach(function(b) {
        b.addEventListener('click', function() { api.postMessage({ command: 'addVariable' }); });
    });
})();
</script>
</body>
</html>`;
    }

    private tabsHtml(firstLabel: string): string {
        const tab = (id: SidebarTab, label: string, title = '') =>
            `<button class="tab${this._tab === id ? ' active' : ''}" data-tab="${id}"${title ? ` title="${title}"` : ''} data-ico="${TAB_ICONS[id] ?? ''}">${label}</button>`;
        // Structure, Tools and Memo are always there; the details of the member and the shortcuts are one click away in the "..." menu, which
        // shows the name of the one that is open
        const inMenu = this._tab === 'detail' || this._tab === 'shortcuts';
        const menuLabel = this._tab === 'shortcuts' ? 'Shortcuts' : firstLabel;
        const more = `<span class="tabdd"><button class="tabmore${inMenu ? ' active' : ''}" id="tabMore" title="The details of the member, the shortcuts">${inMenu ? menuLabel + ' ' : ''}⋯</button><div class="tabmenu" id="tabMenu" hidden>${tab('detail', firstLabel)}${tab('shortcuts', 'Shortcuts', 'Every keyboard shortcut, by mode')}</div></span>`;
        return `<div class="tabs">\n${tab('manage', 'Structure', 'Members of the file: add, filter, edit, rename, move, delete - ' + shortcutOf('global', 'ce.manageMembers'))}\n${tab('tools', 'Tools')}\n${tab('memo', 'Memo', shortcutOf('global', 'ce.memo.open'))}\n${more}\n${this.isDelphi() ? `<button class="tabdes" data-dl="ce.delphi.designer" title="Open the form designer of this unit (or come back to it) - ${shortcutOf('delphi', 'ce.delphi.designer')}">🎨 Designer</button>` : ''}\n</div>`;
    }

    /** Rows of the local variables and parameters of a member; the buttons only where they can act on it. */
    private variableRowsHtml(locals: { name: string; type?: string; isParam?: boolean }[], editable: boolean): string {
        let html = `<ul class="var-list">`;
        for (const l of locals) {
            const badge = l.isParam ? '<span class="dir">param </span>' : '<span class="dir">local </span>';
            const t = l.type ? `: <span class="ptype">${escapeHtml(l.type)}</span>` : '';
            const safeName = escapeHtml(l.name).replace(/"/g, '&quot;');
            html += `<li class="var-row">${badge}<span class="pname">${escapeHtml(l.name)}</span>${t}`
                + (editable
                    ? `<span class="var-actions"><button class="var-btn" data-edit="${safeName}" title="Edit">✏️</button><button class="var-btn" data-delete="${safeName}" title="Delete">🗑️</button></span>`
                    : '')
                + `</li>`;
        }
        return html + `</ul>`;
    }

    /** Local variables / parameters of the selected member + the inline "Add Variable" button. */
    private variablesHtml(member: ClassMember): string {
        let html = '';
        const provider = this._state.provider;
        const doc = vscode.window.activeTextEditor?.document;
        if (provider && doc) {
            const scope = this._scopeAnalyzer.getScope(doc, provider, member);
            if (scope && scope.locals.length > 0) {
                html += `<div class="section var-section"><div class="section-title">Variables</div>${this.variableRowsHtml(scope.locals, true)}</div>`;
            }
        }
        html += `<button class="ana" data-addvar="1">➕ Add Variable</button>`;
        return html;
    }

    /** The variables block under a member of the Structure tab: its count and rows, with Add Variable when the cursor is in it. */
    private variablesBody(member: ClassMember, editable: boolean): { count: number; html: string } | undefined {
        const provider = this._state.provider;
        const doc = vscode.window.activeTextEditor?.document;
        const locals = provider && doc ? this._scopeAnalyzer.getScope(doc, provider, member)?.locals ?? [] : [];
        if (locals.length === 0 && !editable) { return undefined; }
        let html = locals.length ? this.variableRowsHtml(locals, editable) : '<p class="empty-section">No local variable.</p>';
        html += editable ? `<button class="ana" data-addvar="1">➕ Add Variable</button>` : `<p class="tool-note">Place the cursor in ${escapeHtml(member.name)} to edit its variables.</p>`;
        return { count: locals.length, html };
    }

    /** "Structure" tab: add to any type of the file, then filter / group / edit / rename / move / delete its members. */
    private getManageHtml(): string {
        const { provider } = this._state;
        const member = this.focusMember();
        const ctx = this.manageContext();
        const { current, isFile } = ctx;

        const isStruct = !!current && (current.isRecord || current.classType === 'struct');
        const isCppStruct = provider?.languageId === 'cpp' && current?.classType === 'struct';
        const canHaveMethods = !current || !isStruct || isCppStruct;
        const typeOptions = ctx.classes.map(c => ({
            id: c.id,
            label: c.name + ' (' + (c.isInterface ? 'interface' : c.isRecord ? 'record' : c.classType || 'class') + ')',
        }));
        if (ctx.standalone.length > 0 || typeOptions.length === 0) { typeOptions.push({ id: FILE_LEVEL_ID, label: 'File-level routines (' + ctx.standalone.length + ')' }); }
        const rows: ManageRow[] = this.manageTargets().map(m => ({
            id: m.id, name: m.name, kind: m.kind, visibility: m.visibility, type: m.returnType || m.type,
            params: m.parameters.length, selected: !!member && member.id === m.id, line: m.range.start.line,
            nested: m.nested?.map(n => ({ name: n.name, kind: n.kind, line: n.line, depth: n.depth })),
        }));
        const view: ManageView = {
            typeOptions, selectedType: current ? current.id : FILE_LEVEL_ID, isFile: !current || isFile,
            add: { field: !!current, method: canHaveMethods, property: !!current && canHaveMethods && !current.isInterface, constructor: !!current && canHaveMethods && !current.isInterface },
            canMove: ctx.classes.length > 1, rows,
            filter: this._manageFilter, kindFilter: this._manageKind, group: this._manageGroup, focusFilter: this._focusFilter,
            focus: this.focusData(true),
            designer: this.designerButton(member),
        };
        this._focusFilter = false;
        return manageListHtml(view);
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
${toolsCss()}
.tabs { display: flex; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; gap: 2px; margin-bottom: 10px; border-bottom: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); }
.tabs::-webkit-scrollbar { display: none; }
.tab { flex: none; white-space: nowrap; }
.tab[data-ico]::before { content: attr(data-ico); margin-right: 4px; opacity: 0.85; }
@media (max-width: 300px) { .tab { padding: 5px 6px; } .tab:not(.active)[data-ico]::before { margin-right: 0; } }
.tab { background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--vscode-descriptionForeground); padding: 5px 8px; cursor: pointer; font-size: 12px; font-family: inherit; }
.tab.active { color: var(--vscode-foreground); border-bottom-color: var(--vscode-focusBorder, #007fd4); font-weight: 600; }
.tab:hover { color: var(--vscode-foreground); }
.tabdd { flex: none; display: inline-block; }
.tabmore { background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--vscode-descriptionForeground); padding: 5px 8px; cursor: pointer; font-size: 12px; font-family: inherit; white-space: nowrap; }
.tabmore:hover { color: var(--vscode-foreground); }
.tabmore.active { color: var(--vscode-foreground); border-bottom-color: var(--vscode-focusBorder, #007fd4); font-weight: 600; }
.tabmenu { position: fixed; z-index: 50; min-width: 140px; display: flex; flex-direction: column; background: var(--vscode-menu-background, var(--vscode-editorWidget-background, #252526)); border: 1px solid var(--vscode-menu-border, var(--vscode-widget-border, rgba(128,128,128,0.5))); border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); padding: 3px; }
.tabmenu[hidden] { display: none; }
.tabmenu .tab { text-align: left; border-bottom: none; border-radius: 3px; padding: 5px 10px; }
.tabmenu .tab.active { background: var(--vscode-list-activeSelectionBackground, rgba(0,127,212,0.25)); }
.mlist { list-style: none; padding: 0; }
.mrow { display: flex; align-items: center; gap: 5px; padding: 3px 4px; border-radius: 3px; font-size: 12px; }
.mrow:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.15)); }
.mrow.sel { background: var(--vscode-list-activeSelectionBackground, rgba(0,127,212,0.25)); }
.mrow .mname { cursor: pointer; font-family: var(--vscode-editor-font-family, monospace); }
.mrow .mname:hover { text-decoration: underline; }
.mrow .mtype { color: var(--vscode-descriptionForeground); font-family: var(--vscode-editor-font-family, monospace); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.mrow .var-actions { opacity: 0.5; }
.mrow:hover .var-actions { opacity: 1; }
${manageCss()}
${memoCss()}
${shortcutsCss()}
</style>
</head>
<body>`;

        html += this.tabsHtml('Details');

        if (this._tab === 'memo' || this._tab === 'manage' || this._tab === 'shortcuts') {
            // the memo and the shortcuts are not about the member under the cursor, and the type selector of Structure already names the type
        } else if (classInfo) {
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

        if (this._tab === 'tools') {
            html += toolsHtml(getLastAlignToken(), this.alignChips(), this.isPlSql(), this.isDelphi(), this._toolsTab, this.languageInfo());
        } else if (this._tab === 'manage') {
            html += this.getManageHtml();
        } else if (this._tab === 'memo') {
            html += this.getMemoHtml();
        } else if (this._tab === 'shortcuts') {
            html += this.getShortcutsHtml();
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
                    html += `<li class="param-item" data-run="ce.editMember" title="Edit parameters of ${escapeHtml(member.name)}">` +
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
            html += `<button class="ana" data-run="ce.addField">📦 Add Field</button>`;
            if (canHaveMethods && !isInterface) {
                html += `<button class="ana" data-run="ce.addProperty">🔑 Add Property</button>`;
                html += `<button class="ana" data-run="ce.addMethod">🔧 Add Method</button>`;
                html += `<button class="ana" data-run="ce.addConstructor">🏗️ Add Constructor</button>`;
            }
            if (isInterface) {
                html += `<button class="ana" data-run="ce.addMethod">🔧 Add Method</button>`;
            }
            html += `</div></div>`;
        } else {
            html += `<p class="empty-section">No member selected. Place cursor on a method, field, or property.</p>`;
        }

        html += `<script nonce="${nonce}">
${toolsScript()}
${manageScript()}
${memoScript()}
${shortcutsScript()}
(function() {
    var vscodeApi = acquireVsCodeApi();
    initTools(vscodeApi);
    initManage(vscodeApi);
    initMemo(vscodeApi);
    initShortcuts(vscodeApi);
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
    var tm = document.getElementById('tabMore'), tmenu = document.getElementById('tabMenu');
    if (tm && tmenu) {
        tm.addEventListener('click', function() {
            var open = tmenu.hidden;
            tmenu.hidden = !open;
            if (open) { var r = tm.getBoundingClientRect(); tmenu.style.left = Math.max(2, Math.min(r.left, window.innerWidth - 150)) + 'px'; tmenu.style.top = r.bottom + 'px'; }
        });
        document.addEventListener('mousedown', function(e) { if (!tmenu.hidden && !tmenu.contains(e.target) && e.target !== tm) { tmenu.hidden = true; } });
    }
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
        html += '}catch(e){console.error("[CE-FORM] script error:",e&&e.message||e);try{api.postMessage({command:"__diag",error:String(e&&e.message||e)});}catch(_){}}})();</script></body></html>';

        return html;
    }
}

interface ProviderRegistryLike {
    getByDocument(doc: vscode.TextDocument, ignoreOverride?: boolean): ILanguageProvider | undefined;
    getAllProviders?(): ILanguageProvider[];
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
