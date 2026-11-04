import * as vscode from 'vscode';
import { actionLog } from './ActionLog';

/** A button of a message: a label and the command it runs. */
export interface NotifyAction { label: string; command: string; args?: unknown[] }

async function show(kind: 'error' | 'warning', message: string, actions: NotifyAction[]): Promise<void> {
    const pick = kind === 'error'
        ? await vscode.window.showErrorMessage(message, ...actions.map(a => a.label))
        : await vscode.window.showWarningMessage(message, ...actions.map(a => a.label));
    const chosen = actions.find(a => a.label === pick);
    if (chosen) { await vscode.commands.executeCommand(chosen.command, ...(chosen.args ?? [])); }
}

/**
 * The messages of the extension that say what went wrong, with the next step as a button: a message that stops at "failed" leaves the
 * user to find out what to do. Every failure offers the log; each situation offers what usually follows.
 */
export const notify = {
    /** A command that works on the open file, run with no file open. */
    noEditor(): Promise<void> {
        return show('warning', 'No active editor.', [
            { label: 'Open a file...', command: 'workbench.action.files.openFile' },
            { label: 'Go to file...', command: 'workbench.action.quickOpen' },
        ]);
    },

    /** The file's language is not one the extension reads: say what to do instead of stopping there. */
    noProvider(): Promise<void> {
        return show('warning', 'CE does not read this kind of file yet. If it is a language it knows, tell it which one.', [
            { label: 'Use a language for this file...', command: 'ce.setLanguage' },
            { label: 'Show the quick actions', command: 'ce.showActions' },
        ]);
    },

    /** A command that works on a member, run with the cursor outside any member. */
    noMember(): Promise<void> {
        return show('warning', 'Place the cursor on a class member first.', [
            { label: 'Pick a member...', command: 'ce.nav.pickMember' },
            { label: 'Show the structure', command: 'ce.manageMembers' },
        ]);
    },

    /**
     * An edit was made: say it, keep it in the log of the actions, and offer **Undo**. The undo is the one of the editor, on the file that
     * was being edited.
     */
    async done(message: string, target?: vscode.Uri): Promise<void> {
        const uri = target ?? vscode.window.activeTextEditor?.document.uri;
        actionLog.record(message, uri?.fsPath);
        const pick = await vscode.window.showInformationMessage(message, 'Undo');
        if (pick !== 'Undo') { return; }
        try {
            if (uri && vscode.window.activeTextEditor?.document.uri.toString() !== uri.toString()) { await vscode.window.showTextDocument(uri); }
            await vscode.commands.executeCommand('undo');
            actionLog.record('Undone: ' + message, uri?.fsPath);
        } catch { /* nothing to undo any more */ }
    },

    /** Something failed: say it, and offer the log, plus whatever else helps. */
    failed(message: string, actions: NotifyAction[] = []): Promise<void> {
        return show('error', message, [...actions, { label: 'Show the log', command: 'ce.showLog' }]);
    },
};
