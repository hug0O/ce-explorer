import * as vscode from 'vscode';
import { trackedCommand, usage } from './UsageStats';
import * as path from 'path';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { analyseEncoding, looksWrong } from '../utils/encodingRepair';
import { extensionOf, languageOverrides } from './LanguageOverrides';
import { describeStatus } from './StatusText';
import { suggestion, tipOfTheDay } from './Tips';

/**
 * One item in the status bar for the extension, where there used to be three (the language, the encoding, the form designer): it says
 * which language the extension reads the file as, turns to a warning when the accents look wrong, and opens a small menu with what
 * is useful on this file: quick actions, the designer, the language, the encoding, the structure, a member, the memo.
 */
const MAX_SCAN = 2_000_000;

export function registerStatusMenu(context: vscode.ExtensionContext, registry: ProviderRegistry): void {
    const item = vscode.window.createStatusBarItem('ce.status', vscode.StatusBarAlignment.Left, 90);
    item.name = 'Code Explorer';
    item.command = 'ce.statusMenu';
    let timer: ReturnType<typeof setTimeout> | undefined;

    const suspect = (doc: vscode.TextDocument): boolean => {
        if (doc.uri.scheme !== 'file' || doc.getText().length > MAX_SCAN) { return false; }
        return looksWrong(analyseEncoding(doc.getText()));
    };

    const refresh = (): void => {
        const doc = vscode.window.activeTextEditor?.document;
        if (!doc || doc.uri.scheme !== 'file') { item.hide(); return; }
        const bad = suspect(doc);
        void vscode.commands.executeCommand('setContext', 'ce:encodingSuspect', bad);
        const chosen = languageOverrides.resolve(doc.uri.fsPath);
        const prov = registry.getByDocument(doc);
        const via = chosen ? (languageOverrides.source(doc.uri.fsPath) === 'extension' ? 'every ' + extensionOf(doc.uri.fsPath) + ' file' : 'this file') : undefined;
        const s = describeStatus({
            fsPath: doc.uri.fsPath, languageId: prov?.languageId, displayName: prov?.displayName,
            chosenName: chosen ? registry.getByLanguageId(chosen)?.displayName ?? chosen : undefined, via, encodingWrong: bad,
        });
        item.text = s.text;
        item.tooltip = s.tooltip;
        item.backgroundColor = s.warning ? new vscode.ThemeColor('statusBarItem.warningBackground') : undefined;
        item.show();
    };
    const later = (): void => { if (timer) { clearTimeout(timer); } timer = setTimeout(refresh, 400); };

    context.subscriptions.push(
        item,
        vscode.window.onDidChangeActiveTextEditor(later),
        vscode.workspace.onDidChangeTextDocument(e => { if (e.document === vscode.window.activeTextEditor?.document) { later(); } }),
        vscode.workspace.onDidOpenTextDocument(later),
        trackedCommand('ce.refreshStatus', refresh),
        trackedCommand('ce.statusMenu', async () => {
            const doc = vscode.window.activeTextEditor?.document;
            const delphi = !!doc && /\.(pas|dfm|dpr|dpk)$/i.test(doc.uri.fsPath);
            const bad = !!doc && suspect(doc);
            type Row = vscode.QuickPickItem & { command?: string };
            const rows: Row[] = [
                { label: '$(lightbulb) ' + tipOfTheDay().text, description: 'tip of the day', command: tipOfTheDay().command },
                ...(() => {
                    const counts: Record<string, number> = {};
                    for (const [k, e] of Object.entries(usage.snapshot().entries)) { counts[k] = e.n; }
                    const idea = suggestion(counts, delphi);
                    return idea ? [{ label: '$(rocket) ' + idea.text, description: 'try it', command: idea.command } as Row] : [];
                })(),
                { label: '', kind: vscode.QuickPickItemKind.Separator },
                { label: '$(zap) Quick actions...', description: 'Ctrl+K Ctrl+A', command: 'ce.showActions' },
                ...(delphi ? [{ label: '$(symbol-misc) Open the form designer', description: 'Ctrl+K D', command: 'ce.delphi.designer' }] : []),
                { label: '$(list-tree) Structure of the file', description: 'Ctrl+K Ctrl+M', command: 'ce.manageMembers' },
                { label: '$(symbol-method) Go to a member...', description: 'Alt+G', command: 'ce.nav.pickMember' },
                { label: '', kind: vscode.QuickPickItemKind.Separator },
                { label: '$(symbol-class) Language of this file...', description: 'which parser CE uses', command: 'ce.setLanguage' },
                { label: (bad ? '$(warning) ' : '$(file-code) ') + 'Accents and encoding...', description: bad ? 'some letters look wrong' : 'repair or reopen with another encoding', command: 'ce.fixEncoding' },
                { label: '', kind: vscode.QuickPickItemKind.Separator },
                { label: '$(note) Memo', description: 'Ctrl+K Ctrl+N', command: 'ce.memo.open' },
                { label: '$(book) User guide', description: 'pictures and animations', command: 'ce.openGuide' },
                { label: '$(history) What was changed', description: 'the edits made by the extension', command: 'ce.showActionLog' },
                { label: '$(rocket) Quick start', description: 'a 1-minute tour', command: 'ce.openWalkthrough' },
                { label: '$(gear) Settings', description: 'the few options of the extension', command: 'ce.openSettings' },
            ];
            const picked = await vscode.window.showQuickPick(rows, { placeHolder: doc ? path.basename(doc.uri.fsPath) + ': what do you want to do?' : 'Code Explorer' });
            if (picked?.command) { await vscode.commands.executeCommand(picked.command); }
        }),
    );
    refresh();
}
