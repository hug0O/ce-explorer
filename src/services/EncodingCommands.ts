/**
 * `CE: Fix Encoding (accents)…`: a letter with an accent that shows as � or as `Ã©`.
 *
 * - `Ã©` and the like (UTF-8 read as Windows-1252) are repaired in the editor, one undo away.
 * - � (a Windows-1252 file read as UTF-8, what Delphi writes) needs the file read again with the right encoding: the
 *   command offers to do it for this kind of file, and to keep it that way (`files.encoding` for the language).
 *
 * A button appears in the title bar of the editor, and an item in the status bar, only on a file where something looks
 * wrong; the command is always in the palette.
 */
import * as vscode from 'vscode';
import { EncodingReport, analyseEncoding, looksWrong, repairMojibake } from '../utils/encodingRepair';

const MAX_SCAN = 2_000_000;

export function registerEncodingCommands(context: vscode.ExtensionContext): void {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 79);
    item.command = 'ce.fixEncoding';
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scan = (doc: vscode.TextDocument | undefined): EncodingReport | undefined => {
        if (!doc || doc.uri.scheme !== 'file' || doc.getText().length > MAX_SCAN) { return undefined; }
        return analyseEncoding(doc.getText());
    };

    const refresh = (): void => {
        const doc = vscode.window.activeTextEditor?.document;
        const r = scan(doc);
        const bad = !!r && looksWrong(r);
        void vscode.commands.executeCommand('setContext', 'ce:encodingSuspect', bad);
        if (bad && r) {
            item.text = '$(warning) Encoding';
            item.tooltip = r.replaced
                ? `${r.replaced} character(s) could not be read (shown as �): the file is probably not UTF-8 (Delphi writes Windows-1252). Click to fix.`
                : `${r.mojibake} accented letter(s) look like Ã©: UTF-8 read as Windows-1252. Click to repair.`;
            item.show();
        } else { item.hide(); }
    };
    const later = (): void => { if (timer) { clearTimeout(timer); } timer = setTimeout(refresh, 400); };

    context.subscriptions.push(
        item,
        vscode.window.onDidChangeActiveTextEditor(later),
        vscode.workspace.onDidChangeTextDocument(e => { if (e.document === vscode.window.activeTextEditor?.document) { later(); } }),
        vscode.workspace.onDidOpenTextDocument(later),
        vscode.commands.registerCommand('ce.fixEncoding', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { void vscode.window.showWarningMessage('CE: open a file first.'); return; }
            await fixEncoding(editor);
            refresh();
        }),
    );
    refresh();
}

async function fixEncoding(editor: vscode.TextEditor): Promise<void> {
    const doc = editor.document;
    const report = analyseEncoding(doc.getText());
    type Choice = vscode.QuickPickItem & { run: () => Promise<void> };
    const choices: Choice[] = [];

    if (report.mojibake > 0) {
        choices.push({
            label: '$(wand) Repair the accents', description: `${report.mojibake} place${report.mojibake > 1 ? 's' : ''} such as Ã© → é`,
            detail: 'The text is UTF-8 that was read as Windows-1252: the letters are put right here, in the editor (Ctrl+Z undoes it).',
            run: async () => {
                const fixed = repairMojibake(doc.getText());
                const edit = new vscode.WorkspaceEdit();
                edit.replace(doc.uri, new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), fixed.text);
                await vscode.workspace.applyEdit(edit);
                void vscode.window.showInformationMessage(`CE: ${fixed.fixed} place(s) repaired. Save the file to keep it.`);
            },
        });
    }
    if (report.replaced > 0 || report.mojibake === 0) {
        choices.push({
            label: '$(file-binary) Read this file as Windows-1252', description: report.replaced ? `${report.replaced} character(s) shown as �` : 'the encoding Delphi writes',
            detail: 'Reopens the file with Windows-1252 and keeps it for the files of this language in this workspace (files.encoding), so that it is saved the same way.',
            run: () => reopenAs(doc, 'windows1252'),
        });
        choices.push({
            label: '$(file-code) Read this file as UTF-8', description: 'the usual encoding of the editor',
            detail: 'Reopens the file as UTF-8 and removes the choice made for this language.',
            run: () => reopenAs(doc, 'utf8'),
        });
    }
    choices.push({
        label: '$(gear) Choose another encoding…', description: 'the VS Code list', detail: 'Reopen with Encoding / Save with Encoding.',
        run: async () => { await vscode.commands.executeCommand('workbench.action.editor.changeEncoding'); },
    });
    const picked = await vscode.window.showQuickPick(choices, {
        title: 'CE: accents and other letters that came out wrong',
        placeHolder: report.replaced ? `${report.replaced} � in this file` : report.mojibake ? `${report.mojibake} accented letters to repair` : 'Nothing looks wrong: change the encoding anyway?',
    });
    if (picked) { await picked.run(); }
}

/** Reads the file again with an encoding, and keeps it for its language so that it is saved the same way. */
async function reopenAs(doc: vscode.TextDocument, encoding: 'windows1252' | 'utf8'): Promise<void> {
    if (doc.isDirty) { void vscode.window.showWarningMessage('CE: save or discard the changes of this file first: it is read again from the disk.'); return; }
    try {
        const cfg = vscode.workspace.getConfiguration(undefined, { languageId: doc.languageId, uri: doc.uri });
        // utf8 is the default: removing the choice puts it back
        await cfg.update('files.encoding', encoding === 'utf8' ? undefined : encoding, vscode.ConfigurationTarget.Workspace, true);
    } catch { /* no workspace to write to: the file is still reopened below */ }
    const uri = doc.uri;
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    await vscode.window.showTextDocument(uri);
}
