import * as vscode from 'vscode';

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

    /** A command that works on a member, run with the cursor outside any member. */
    noMember(): Promise<void> {
        return show('warning', 'Place the cursor on a class member first.', [
            { label: 'Pick a member...', command: 'ce.nav.pickMember' },
            { label: 'Show the structure', command: 'ce.manageMembers' },
        ]);
    },

    /** Something failed: say it, and offer the log, plus whatever else helps. */
    failed(message: string, actions: NotifyAction[] = []): Promise<void> {
        return show('error', message, [...actions, { label: 'Show the log', command: 'ce.showLog' }]);
    },
};
