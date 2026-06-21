import * as vscode from 'vscode';
import { ClassMember, MemberKind, FieldSpec, PropertySpec, MemberSpec, Visibility } from '../models/types';
import { CodeExplorerTreeItem } from './CodeExplorerService';

const MMX_MIME = 'application/vnd.code.tree.mmxCodeExplorer';

export class MemberDragAndDropController implements vscode.TreeDragAndDropController<CodeExplorerTreeItem> {
    dropMimeTypes = [MMX_MIME];
    dragMimeTypes = [MMX_MIME];

    constructor(private refreshFn: () => void) {}

    handleDrag(source: readonly CodeExplorerTreeItem[], dataTransfer: vscode.DataTransfer): void {
        const items = source.filter(s => s && !('members' in s.itemData));
        if (items.length === 0) return;
        dataTransfer.set(MMX_MIME, new vscode.DataTransferItem(items));
    }

    async handleDrop(target: CodeExplorerTreeItem | undefined, dataTransfer: vscode.DataTransfer): Promise<void> {
        const raw = dataTransfer.get(MMX_MIME);
        if (!raw) return;
        const draggedItems: CodeExplorerTreeItem[] = raw.value;
        if (!target || draggedItems.length === 0) return;

        const targetMember = target.itemData;
        if (!('kind' in targetMember)) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const doc = editor.document;

        const targetClass = target.parentClass;
        if (!targetClass) return;

        for (const dragged of draggedItems) {
            const sourceMember = dragged.itemData;
            if (!('kind' in sourceMember)) continue;

            if (dragged.parentClass?.name !== targetClass.name) continue;
            if (sourceMember.id === targetMember.id) continue;

            await this.moveMember(doc, sourceMember, targetMember);
        }

        this.refreshFn();
    }

    private async moveMember(doc: vscode.TextDocument, source: ClassMember, target: ClassMember): Promise<void> {
        const sourceLineStart = source.range.start.line;
        let sourceLineEnd = source.range.end.line;
        if (source.implementationRange && source.implementationRange.end.line > sourceLineEnd) {
            sourceLineEnd = source.implementationRange.end.line;
        }

        const sourceTextLines: string[] = [];
        for (let i = sourceLineStart; i <= sourceLineEnd; i++) {
            sourceTextLines.push(doc.lineAt(i).text);
        }
        const sourceText = sourceTextLines.join('\n') + '\n';

        const targetLine = target.range.start.line;

        const wsEdit = new vscode.WorkspaceEdit();

        if (targetLine > sourceLineEnd) {
            wsEdit.insert(doc.uri, new vscode.Position(targetLine + 1, 0), sourceText);
            wsEdit.delete(doc.uri, new vscode.Range(
                new vscode.Position(sourceLineStart, 0),
                new vscode.Position(sourceLineEnd + 1, 0)
            ));
        } else {
            wsEdit.delete(doc.uri, new vscode.Range(
                new vscode.Position(sourceLineStart, 0),
                new vscode.Position(sourceLineEnd + 1, 0)
            ));
            wsEdit.insert(doc.uri, new vscode.Position(targetLine, 0), sourceText);
        }

        await vscode.workspace.applyEdit(wsEdit);
    }
}
