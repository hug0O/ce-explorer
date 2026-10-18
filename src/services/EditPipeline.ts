import * as vscode from 'vscode';
import { previewAndConfirm } from './SafePreview';

export interface PlannedEdit {
    uri: vscode.Uri;
    range: vscode.Range;
    newText: string;
}

interface PreviewDoc {
    label: string;
    uri: vscode.Uri;
    originalText: string;
    edits: PlannedEdit[];
}

/**
 * Single door for every structural edit. Callers queue inserts / replaces /
 * deletes (all expressed in the coordinates of the CURRENT document state),
 * record the original texts of the affected documents, then call `apply`:
 * the Safe Preview diff is shown when `mmx.previewEdits` is enabled, and on
 * approval everything is committed as one WorkspaceEdit — one preview,
 * one undo step, never a partially applied operation.
 */
export class EditPipeline {
    private readonly edits: PlannedEdit[] = [];
    private readonly originals = new Map<string, { uri: vscode.Uri; text: string }>();

    insert(uri: vscode.Uri, position: vscode.Position, text: string): void {
        this.edits.push({ uri, range: new vscode.Range(position, position), newText: text });
    }

    replace(uri: vscode.Uri, range: vscode.Range, newText: string): void {
        this.edits.push({ uri, range, newText });
    }

    delete(uri: vscode.Uri, range: vscode.Range): void {
        this.replace(uri, range, '');
    }

    /** Records (or replaces) the original text of a document for the preview diff. */
    recordOriginal(uri: vscode.Uri, text: string): void {
        this.originals.set(uri.toString(), { uri, text });
    }

    /** Opens the document if needed and records its current text. */
    async recordOriginalFrom(uri: vscode.Uri): Promise<void> {
        if (this.originals.has(uri.toString())) {
            return;
        }
        const doc = await vscode.workspace.openTextDocument(uri);
        this.recordOriginal(uri, doc.getText());
    }

    get isEmpty(): boolean {
        return this.edits.length === 0;
    }

    /**
     * Preview (when enabled) + apply. Returns false when the user cancelled the
     * preview or VS Code rejected the edit; nothing is partially applied.
     */
    async apply(title: string): Promise<boolean> {
        if (this.edits.length === 0) {
            return true;
        }
        const docs: PreviewDoc[] = [];
        for (const [key, entry] of this.originals) {
            const edits = this.edits.filter(e => e.uri.toString() === key);
            if (edits.length === 0) {
                continue;
            }
            docs.push({
                label: vscode.workspace.asRelativePath(entry.uri),
                uri: entry.uri,
                originalText: entry.text,
                edits,
            });
        }

        const approved = await previewAndConfirm(docs, title);
        if (!approved) {
            return false;
        }

        const wsEdit = new vscode.WorkspaceEdit();
        for (const e of this.edits) {
            wsEdit.replace(e.uri, e.range, e.newText);
        }
        return vscode.workspace.applyEdit(wsEdit);
    }
}
