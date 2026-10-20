/**
 * The file the user was editing. While a sidebar page has the focus, VS Code may report no active text editor:
 * what the page shows and does for "this file" has to use the last one that was.
 */
import * as vscode from 'vscode';

let last: vscode.TextDocument | undefined;

const remember = (editor: vscode.TextEditor | undefined): void => {
    const doc = editor?.document;
    if (doc && doc.uri.fsPath && doc.uri.scheme !== 'output' && doc.uri.scheme !== 'vscode-terminal') { last = doc; }
};

export function trackLastEditor(context: vscode.ExtensionContext): void {
    remember(vscode.window.activeTextEditor);
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(remember));
}

/** The document of the active editor, or else the last one that was edited (if it is still open). */
export function currentDocument(): vscode.TextDocument | undefined {
    const active = vscode.window.activeTextEditor?.document;
    if (active && active.uri.scheme !== 'output') { return active; }
    if (last && !last.isClosed) { return last; }
    return vscode.window.visibleTextEditors?.[0]?.document;
}
