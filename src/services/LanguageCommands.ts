/**
 * `CE: Use a Language for this File…`: tells the extension which of its parsers to use for a file it does not
 * recognise (one file, or every file with the same extension), and a status bar item that offers it exactly
 * there: on a file VS Code left as plain text, or on one that was given a language by hand.
 */
import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { extensionOf, languageOverrides } from './LanguageOverrides';
import { currentDocument } from './LastEditor';

const STORAGE_KEY = 'ce.languageOverrides';

export function registerLanguageCommands(context: vscode.ExtensionContext, registry: ProviderRegistry, onChanged: () => void): void {
    languageOverrides.load(context.workspaceState.get(STORAGE_KEY));

    const nameOf = (id: string): string => registry.getByLanguageId(id)?.displayName ?? id;

    /** The status bar item of the extension says which language a file is read as: it is told to look again. */
    const update = (_editor?: vscode.TextEditor): void => { void vscode.commands.executeCommand('ce.refreshStatus'); };

    const save = async (): Promise<void> => {
        await context.workspaceState.update(STORAGE_KEY, languageOverrides.toJSON());
        registry.clearCaches();
        onChanged();
        update(vscode.window.activeTextEditor);
    };

    context.subscriptions.push(
        // from the Tools tab: '' goes back to what the extension detects
        vscode.commands.registerCommand('ce.setLanguageTo', async (id: unknown, scope: unknown) => {
            const doc = currentDocument();
            if (!doc || !doc.uri.fsPath) { return; }
            const file = doc.uri.fsPath;
            if (id === '' || id === undefined) { languageOverrides.clear(file); await save(); return; }
            if (typeof id !== 'string' || !registry.getByLanguageId(id)) { return; }
            const ext = extensionOf(file);
            if (scope === 'extension' && ext) { languageOverrides.setExtension(ext, id); } else { languageOverrides.setFile(file, id); }
            await save();
        }),
        vscode.window.onDidChangeActiveTextEditor(update),
        vscode.commands.registerCommand('ce.setLanguage', async () => {
            const doc = currentDocument();
            if (!doc || !doc.uri.fsPath) { void vscode.window.showWarningMessage('CE: open a file first.'); return; }
            const file = doc.uri.fsPath;
            const ext = extensionOf(file);
            const current = languageOverrides.resolve(file);
            const providers = registry.getAllProviders().map(p => ({ label: p.displayName, description: p.fileExtensions.join(' '), id: p.languageId, picked: p.languageId === current }));
            const choices: (vscode.QuickPickItem & { id?: string; remove?: boolean })[] = [
                ...(current ? [{ label: '$(close) Stop reading this file as ' + nameOf(current), description: languageOverrides.source(file) === 'extension' ? `every ${ext} file` : 'this file', id: undefined, remove: true }] : []),
                ...providers,
            ];
            const picked = await vscode.window.showQuickPick(choices, { title: 'CE: which language is this file written in?', placeHolder: `${vscode.workspace.asRelativePath(doc.uri)}${doc.languageId ? ' (VS Code: ' + doc.languageId + ')' : ''}` });
            if (!picked) { return; }
            if (picked.remove) {
                languageOverrides.clear(file);
                await save();
                void vscode.window.showInformationMessage('CE: this file is read by its extension again.');
                return;
            }
            let scope: 'file' | 'extension' = 'file';
            if (ext) {
                const where = await vscode.window.showQuickPick(
                    [{ label: 'This file only', id: 'file' }, { label: `Every ${ext} file`, description: 'of this workspace', id: 'extension' }],
                    { title: `CE: read as ${picked.label}` });
                if (!where) { return; }
                scope = where.id as 'file' | 'extension';
            }
            if (scope === 'extension') { languageOverrides.setExtension(ext, picked.id!); } else { languageOverrides.setFile(file, picked.id!); }
            await save();
            void vscode.window.showInformationMessage(`CE: ${scope === 'extension' ? 'every ' + ext + ' file' : 'this file'} is read as ${picked.label}.`);
        }),
    );
    update(vscode.window.activeTextEditor);
}
