import * as vscode from 'vscode';

/**
 * Safe Preview — shows a diff of the proposed structural edit and asks the
 * user to confirm before the edit is actually applied. This is the guard that
 * prevents the fragile delete+reinsert engine from silently corrupting code.
 *
 * The module is self-contained and side-effect free when `ce.previewEdits`
 * is disabled (it then short-circuits and returns true).
 */

export const PREVIEW_SCHEME = 'ce-preview';

interface PlannedEdit {
    uri: vscode.Uri;
    range: vscode.Range;
    newText: string;
}

const proposedContent = new Map<string, string>();

let registration: vscode.Disposable | undefined;

export function registerSafePreview(context: vscode.ExtensionContext): void {
    // Register unconditionally on each activation: VS Code disposes the previous
    // provider on deactivation, so a leftover `registered` boolean would prevent
    // re-registration and blank out previews after a reactivate cycle.
    if (registration) {
        registration.dispose();
    }
    const provider = new class implements vscode.TextDocumentContentProvider {
        provideTextDocumentContent(uri: vscode.Uri): string {
            const id = uri.query ? new URLSearchParams(uri.query).get('id') : null;
            if (id) {
                return proposedContent.get(id) ?? '';
            }
            return proposedContent.get(uri.path) ?? '';
        }
    };
    registration = vscode.workspace.registerTextDocumentContentProvider(PREVIEW_SCHEME, provider);
    context.subscriptions.push(registration);
}

function previewEnabled(): boolean {
    return vscode.workspace.getConfiguration('ce').get<boolean>('previewEdits', false);
}

/**
 * Convert a (line, character) position to a character offset within `text`.
 */
function positionToOffset(text: string, pos: { line: number; character: number }): number {
    let offset = 0;
    let line = 0;
    while (line < pos.line && offset < text.length) {
        const nl = text.indexOf('\n', offset);
        if (nl < 0) {
            return text.length;
        }
        offset = nl + 1;
        line++;
    }
    return offset + pos.character;
}

/**
 * Apply a single text edit to `text`, returning the resulting string.
 */
function applyEditToText(text: string, range: vscode.Range, newText: string): string {
    const startOffset = positionToOffset(text, range.start);
    const endOffset = positionToOffset(text, range.end);
    return text.slice(0, startOffset) + newText + text.slice(endOffset);
}

/**
 * Simulate a batch of non-overlapping edits on the original text and return
 * the proposed resulting text. Edits are applied from bottom to top so that
 * earlier offsets remain valid.
 */
export function simulateEdits(originalText: string, edits: { range: vscode.Range; newText: string }[]): string {
    const sorted = [...edits].sort((a, b) => {
        if (a.range.start.line !== b.range.start.line) {
            return b.range.start.line - a.range.start.line;
        }
        return b.range.start.character - a.range.start.character;
    });
    let result = originalText;
    for (const e of sorted) {
        result = applyEditToText(result, e.range, e.newText);
    }
    return result;
}

/**
 * Show a diff of the proposed changes for each affected document and ask the
 * user to confirm. Returns true if the user accepts the changes (or if preview
 * is disabled), false otherwise.
 *
 * `documents` maps a visible label + original text to its planned edits. Only
 * entries whose original text is provided are previewed as diffs; entries
 * without text are still mentioned in the confirmation message.
 */
export async function previewAndConfirm(
    documents: { label: string; uri: vscode.Uri; originalText: string; edits: PlannedEdit[] }[],
    title: string,
): Promise<boolean> {
    if (!previewEnabled() || documents.length === 0) {
        return true;
    }

    const shownLabels: string[] = [];
    const shownIds: string[] = [];
    try {
        for (const entry of documents) {
            const proposed = simulateEdits(entry.originalText, entry.edits);
            if (proposed === entry.originalText) {
                continue;
            }
            const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
            proposedContent.set(id, proposed);
            const previewUri = vscode.Uri.parse(`${PREVIEW_SCHEME}:${entry.uri.fsPath}?id=${id}`);
            try {
                await vscode.commands.executeCommand(
                    'vscode.diff',
                    entry.uri,
                    previewUri,
                    `CE Preview — ${title} (${entry.label})`,
                );
                shownLabels.push(entry.label);
                shownIds.push(id);
            } catch {
                proposedContent.delete(id);
            }
        }

        const scope = shownLabels.length > 0
            ? shownLabels.join(', ')
            : 'the target file';

        const choice = await vscode.window.showWarningMessage(
            `Apply these changes to ${scope}?`,
            { modal: false },
            'Apply',
            'Cancel',
        );

        return choice === 'Apply';
    } finally {
        // Release the proposed-content payloads once a decision has been made
        // so the module-level map does not grow unbounded across the session.
        for (const id of shownIds) {
            proposedContent.delete(id);
        }
    }
}
