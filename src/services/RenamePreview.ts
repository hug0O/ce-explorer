import * as vscode from 'vscode';
import * as path from 'path';
import { trackedCommand } from './UsageStats';
import { RenameHit, extensionsLike, familyOfExtension, isCaseFree, isIdentifier, scanRename } from '../utils/renameScan';

const MAX_FILES = 3000;
const MAX_HITS = 5000;
const EXCLUDE = '{**/node_modules/**,**/.git/**,**/__history/**,**/__recovery/**,**/Win32/**,**/Win64/**,**/dist/**,**/out/**,**/build/**}';

/** The places of the name in a file's text: the language is the editor's only for files of the same kind as the one being edited. */
function scanFile(text: string, name: string, fileExt: string, editedExt: string, languageId: string | undefined): RenameHit[] {
    const lang = fileExt.toLowerCase() === '.' + editedExt.toLowerCase() ? languageId : undefined;
    return scanRename(text, name, familyOfExtension(fileExt, lang), isCaseFree(lang, fileExt));
}

interface FileHits { uri: vscode.Uri; hits: RenameHit[] }

/** The name under the cursor, or the selection. */
function nameAtCursor(editor: vscode.TextEditor | undefined): string {
    if (!editor) { return ''; }
    if (!editor.selection.isEmpty) { return editor.document.getText(editor.selection).trim(); }
    const r = editor.document.getWordRangeAtPosition(editor.selection.active, /[A-Za-z_]\w*/);
    return r ? editor.document.getText(r) : '';
}

/** Every file of the project of the same family as the current one (a unit comes with its form, a header with its source) with the name written in it. */
async function scan(name: string, ext: string, languageId: string | undefined, progress: vscode.Progress<{ message?: string }>): Promise<{ files: FileHits[]; truncated: boolean }> {
    const exts = extensionsLike(ext);
    const glob = exts.length > 1 ? `**/*.{${exts.join(',')}}` : `**/*.${exts[0] ?? ext}`;
    const uris = await vscode.workspace.findFiles(glob, EXCLUDE, MAX_FILES);
    const files: FileHits[] = [];
    let total = 0;
    let done = 0;
    for (const uri of uris) {
        if (++done % 40 === 0) { progress.report({ message: `${done} / ${uris.length} files` }); }
        let text: string;
        try {
            const open = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString());
            text = open ? open.getText() : Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8');
        } catch { continue; }
        const e = path.extname(uri.fsPath);
        const hits = scanFile(text, name, e, ext, languageId);
        if (hits.length) { files.push({ uri, hits }); total += hits.length; }
        if (total > MAX_HITS) { return { files, truncated: true }; }
    }
    return { files, truncated: false };
}

/**
 * Rename a name everywhere in the project, with the preview of VS Code: every place is listed by file and line, each one can be left
 * unticked, and nothing changes until the change is applied (and one Undo takes it all back).
 */
export function registerRenamePreview(context: vscode.ExtensionContext): void {
    context.subscriptions.push(trackedCommand('ce.renamePreview', async () => {
        const editor = vscode.window.activeTextEditor;
        const old = await vscode.window.showInputBox({ title: 'CE: Rename in the project (1/2)', prompt: 'The name to rename, as written in the code', value: nameAtCursor(editor), validateInput: v => (isIdentifier(v.trim()) ? undefined : 'A name: letters, digits and _, not starting with a digit') });
        if (!old) { return; }
        const oldName = old.trim();
        const to = await vscode.window.showInputBox({ title: `CE: Rename ${oldName} (2/2)`, prompt: 'The new name', value: oldName, validateInput: v => (isIdentifier(v.trim()) ? undefined : 'A name: letters, digits and _, not starting with a digit') });
        if (!to || to.trim() === oldName) { return; }
        const newName = to.trim();
        const ext = path.extname(editor?.document.uri.fsPath ?? '.pas').replace(/^\./, '') || 'pas';

        const found = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `CE: looking for ${oldName}` }, p => scan(oldName, ext, editor?.document.languageId, p));
        const code = found.files.reduce((n, f) => n + f.hits.filter(h => h.kind === 'code').length, 0);
        const text = found.files.reduce((n, f) => n + f.hits.filter(h => h.kind === 'text').length, 0);
        if (code + text === 0) { void vscode.window.showInformationMessage(`CE: ${oldName} is not written in the files of this project.`); return; }

        let withText = false;
        if (text > 0) {
            const pick = await vscode.window.showQuickPick([
                { label: `Code only (${code})`, description: 'leave the comments and the strings alone', text: false },
                { label: `Code, comments and strings (${code + text})`, description: 'a SQL text, a caption or a note that holds the name is renamed too', text: true },
            ], { title: `CE: ${oldName} → ${newName}`, placeHolder: found.truncated ? 'The list was cut: the first ' + MAX_HITS + ' places' : undefined });
            if (!pick) { return; }
            withText = pick.text;
        }

        const edit = new vscode.WorkspaceEdit();
        let count = 0;
        for (const f of found.files) {
            const doc = await vscode.workspace.openTextDocument(f.uri);
            // the places are read again in the text VS Code holds, whatever the encoding of the file: its positions are the ones the edit needs
            for (const h of scanFile(doc.getText(), oldName, path.extname(f.uri.fsPath), ext, editor?.document.languageId)) {
                if (h.kind === 'text' && !withText) { continue; }
                const start = doc.positionAt(h.offset);
                edit.replace(f.uri, new vscode.Range(start, start.translate(0, oldName.length)), newName, {
                    label: `${oldName} → ${newName}${h.kind === 'text' ? ' (in a comment or a string)' : ''}`,
                    description: h.preview,
                    needsConfirmation: true,
                });
                count++;
            }
        }
        if (count === 0) { return; }
        const ok = await vscode.workspace.applyEdit(edit);
        if (ok) { void vscode.window.showInformationMessage(`CE: ${count} place(s) renamed ${oldName} → ${newName}.`); }
    }));
}
