import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { CodeExplorerService } from './CodeExplorerService';
import { NAV_GROUPS, NAV_KEYS, NavAction, NavKeyParser } from './NavKeys';

/**
 * Quick navigation mode (`CE: Quick navigation mode`, also in the status bar menu): the letters of the keyboard move in the code, as in
 * vi's normal mode, and do what this extension offers (members, structure, designer, review). `i` or Esc goes back to typing.
 * It reads the keys through VS Code's `type` command while the mode is on, and gives it back when it is off, so typing is untouched the rest
 * of the time; if another extension (a vi emulator) already has `type`, the mode says so and does not start.
 */
export class NavMode {
    active = false;
    private readonly parser = new NavKeyParser();
    private typeHook: vscode.Disposable | undefined;
    private readonly styles = new Map<vscode.TextEditor, vscode.TextEditorCursorStyle | undefined>();

    constructor(private readonly context: vscode.ExtensionContext, private readonly registry: ProviderRegistry, private readonly explorer: CodeExplorerService) {
        context.subscriptions.push(
            vscode.commands.registerCommand('ce.nav.toggle', () => (this.active ? this.exit() : this.enter())),
            vscode.commands.registerCommand('ce.nav.exit', () => this.exit()),
            vscode.window.onDidChangeVisibleTextEditors(() => { if (this.active) { this.paint(); } }),
            { dispose: () => this.exit() },
        );
    }

    enter(): void {
        if (this.active) { return; }
        if (!vscode.window.activeTextEditor) { void vscode.window.showInformationMessage('CE: open a file first.'); return; }
        try {
            // while the mode is on, what is typed in an editor comes here
            this.typeHook = vscode.commands.registerCommand('type', (args: { text?: string }) => this.onType(args?.text ?? ''));
        } catch {
            void vscode.window.showWarningMessage('CE: another extension (a vi emulator?) already reads the keys of the editor, so the quick navigation mode cannot start. Use that extension\'s own mode.');
            return;
        }
        this.active = true;
        this.parser.reset();
        void vscode.commands.executeCommand('setContext', 'ce.navMode', true);
        this.paint();
        void vscode.commands.executeCommand('ce.refreshStatus');
        vscode.window.setStatusBarMessage('CE navigation: ? lists the keys, i or Esc goes back to typing', 4000);
    }

    exit(): void {
        if (!this.active) { return; }
        this.active = false;
        this.typeHook?.dispose();
        this.typeHook = undefined;
        this.parser.reset();
        for (const [editor, style] of this.styles) { try { editor.options = { ...editor.options, cursorStyle: style ?? vscode.TextEditorCursorStyle.Line }; } catch { /* the editor is gone */ } }
        this.styles.clear();
        void vscode.commands.executeCommand('setContext', 'ce.navMode', false);
        void vscode.commands.executeCommand('ce.refreshStatus');
    }

    /** A block cursor on every editor, as the sign that the keys are not typed. */
    private paint(): void {
        for (const editor of vscode.window.visibleTextEditors) {
            if (!this.styles.has(editor)) { this.styles.set(editor, editor.options.cursorStyle); }
            editor.options = { ...editor.options, cursorStyle: vscode.TextEditorCursorStyle.Block };
        }
    }

    private onType(text: string): void {
        for (const ch of text) {
            const r = this.parser.feed(ch);
            vscode.window.setStatusBarMessage(r.pending ? 'CE navigation: ' + r.pending : '', 1500);
            if (r.action) { void this.run(r.action); }
        }
    }

    private async repeat(n: number, command: string, args?: unknown): Promise<void> {
        for (let i = 0; i < Math.min(Math.max(1, n), 200); i++) { await vscode.commands.executeCommand(command, args); }
    }

    /** The line where each member of the file starts, in order. */
    private memberLines(): number[] {
        const lines = this.explorer.listAllSymbols().map(s => s.position.line);
        return [...new Set(lines)].sort((a, b) => a - b);
    }

    private async stepMember(n: number, dir: 1 | -1): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }
        const lines = this.memberLines();
        if (!lines.length) { vscode.window.setStatusBarMessage('CE navigation: no member found in this file', 2000); return; }
        let line = editor.selection.active.line;
        for (let i = 0; i < Math.max(1, n); i++) {
            const next = dir > 0 ? lines.find(l => l > line) : [...lines].reverse().find(l => l < line);
            if (next === undefined) { break; }
            line = next;
        }
        const pos = new vscode.Position(line, editor.document.lineAt(line).firstNonWhitespaceCharacterIndex);
        editor.selection = new vscode.Selection(pos, pos);
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    }

    private async run(a: NavAction): Promise<void> {
        const n = a.count;
        const cmd = (c: string, args?: unknown): Thenable<unknown> => vscode.commands.executeCommand(c, args);
        const move = (to: string, by: string): Thenable<unknown> => cmd('cursorMove', { to, by, value: Math.max(1, n) });
        const editor = vscode.window.activeTextEditor;
        switch (a.id) {
            case 'left': await move('left', 'character'); return;
            case 'right': await move('right', 'character'); return;
            case 'down': await move('down', 'wrappedLine'); return;
            case 'up': await move('up', 'wrappedLine'); return;
            case 'wordRight': await this.repeat(n, 'cursorWordStartRight'); return;
            case 'wordLeft': await this.repeat(n, 'cursorWordStartLeft'); return;
            case 'lineStart': await cmd('cursorHome'); return;
            case 'lineEnd': await cmd('cursorEnd'); return;
            case 'top': case 'bottom': {
                if (editor && n > 0) {
                    const line = Math.min(n, editor.document.lineCount) - 1;
                    const p = new vscode.Position(line, 0);
                    editor.selection = new vscode.Selection(p, p);
                    editor.revealRange(new vscode.Range(p, p), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
                } else { await cmd(a.id === 'top' ? 'cursorTop' : 'cursorBottom'); }
                return;
            }
            case 'pageDown': await this.repeat(n, 'cursorPageDown'); return;
            case 'pageUp': await this.repeat(n, 'cursorPageUp'); return;
            case 'nextMember': await this.stepMember(n, 1); return;
            case 'prevMember': await this.stepMember(n, -1); return;
            case 'goToMember': await cmd('ce.goToMember'); return;
            case 'definition': await cmd('editor.action.revealDefinition'); return;
            case 'references': await cmd('editor.action.goToReferences'); return;
            case 'implementation': await cmd('editor.action.goToImplementation'); return;
            case 'back': await cmd('workbench.action.navigateBack'); return;
            case 'forward': await cmd('workbench.action.navigateForward'); return;
            case 'find': await cmd('actions.find'); return;
            case 'findNext': await this.repeat(n, 'editor.action.nextMatchFindAction'); return;
            case 'findPrev': await this.repeat(n, 'editor.action.previousMatchFindAction'); return;
            case 'findWord': await cmd('actions.findWithSelection'); return;
            case 'actions': await cmd('ce.showActions'); return;
            case 'structure': await cmd('ce.manageMembers'); return;
            case 'workspaceMember': await cmd('ce.goToWorkspaceMember'); return;
            case 'editMember': await cmd('ce.editMember'); return;
            case 'rename': await cmd('editor.action.rename'); return;
            case 'designer': {
                if (editor && /\.(pas|dfm|dpr)$/i.test(editor.document.uri.fsPath)) { await cmd('ce.delphi.toggleDesigner'); } else { vscode.window.setStatusBarMessage('CE navigation: the designer is for Delphi units', 2000); }
                return;
            }
            case 'review': await cmd('ce.codeReview'); return;
            case 'template': this.exit(); await cmd('ce.insertTemplate'); return;
            case 'memo': await cmd('ce.memo.open'); return;
            case 'palette': this.exit(); await cmd('workbench.action.showCommands'); return;
            case 'undo': await this.repeat(n, 'undo'); return;
            case 'help': await this.help(); return;
            case 'foldToggle': await cmd('editor.toggleFold'); return;
            case 'unfold': await cmd('editor.unfold'); return;
            case 'fold': await cmd('editor.fold'); return;
            case 'unfoldAll': await cmd('editor.unfoldAll'); return;
            case 'foldAll': await cmd('editor.foldAll'); return;
            case 'insert': this.exit(); return;
            case 'append': this.exit(); await cmd('cursorRight'); return;
            case 'appendEnd': this.exit(); await cmd('cursorEnd'); return;
            case 'insertStart': this.exit(); await cmd('cursorHome'); return;
            case 'openBelow': this.exit(); await cmd('editor.action.insertLineAfter'); return;
            case 'openAbove': this.exit(); await cmd('editor.action.insertLineBefore'); return;
            default: return;
        }
    }

    private async help(): Promise<void> {
        type Row = vscode.QuickPickItem;
        const rows: Row[] = [];
        for (const g of NAV_GROUPS) {
            const keys = NAV_KEYS.filter(k => k.group === g.id);
            if (!keys.length) { continue; }
            rows.push({ label: g.title, kind: vscode.QuickPickItemKind.Separator });
            for (const k of keys) { rows.push({ label: k.keys, description: k.label + (k.repeat ? '  (a number first repeats it)' : '') }); }
        }
        await vscode.window.showQuickPick(rows, { title: 'CE quick navigation: the keys', placeHolder: 'Esc closes this list; the mode stays on' });
    }
}
