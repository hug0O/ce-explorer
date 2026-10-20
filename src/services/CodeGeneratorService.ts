import * as vscode from 'vscode';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { ClassInfo, ClassMember } from '../models/types';
import { EditPipeline } from './EditPipeline';
import { languageOverrides } from './LanguageOverrides';

export class CodeGeneratorService {
    private providers: Map<string, ILanguageProvider> = new Map();

    registerProvider(provider: ILanguageProvider): void {
        this.providers.set(provider.languageId, provider);
    }

    private getProvider(document: vscode.TextDocument): ILanguageProvider | undefined {
        const chosen = languageOverrides.resolve(document.uri.fsPath);
        const provider = (chosen ? this.providers.get(chosen) : undefined) ?? this.providers.get(document.languageId);
        if (provider) {
            return provider;
        }
        for (const p of this.providers.values()) {
            const ext = vscode.Uri.parse(document.uri.path).path;
            if (p.fileExtensions.some(e => ext.endsWith(e))) {
                return p;
            }
        }
        return undefined;
    }

    /**
     * Queue the deletion of `member` (declaration + implementation + paired
     * file block) onto `pipeline`, in current document coordinates, without
     * applying anything. Callers combine this with other queued edits and
     * commit one atomic WorkspaceEdit via pipeline.apply.
     */
    async planMemberDeletion(
        document: vscode.TextDocument,
        member: ClassMember,
        pipeline: EditPipeline
    ): Promise<void> {
        const fullRange = expandToFullMember(document, member.range);
        pipeline.delete(document.uri, fullRange);

        if (member.implementationRange) {
            // For standalone functions the declaration and implementation are the same
            // block; avoid deleting it twice (which would eat adjacent lines).
            const overlaps = member.implementationRange.start.line <= fullRange.end.line
                && member.implementationRange.end.line >= fullRange.start.line;
            if (!overlaps) {
                pipeline.delete(document.uri, expandToFullMember(document, member.implementationRange));
            }
        }

        const provider = this.getProvider(document);
        if (provider) {
            const pairedUri = provider.findPairedFile(document.uri);
            if (pairedUri && member.implementationRange) {
                await pipeline.recordOriginalFrom(pairedUri);
                const pairedDoc = await vscode.workspace.openTextDocument(pairedUri);
                pipeline.delete(pairedUri, expandToFullMember(pairedDoc, member.implementationRange));
            }
        }
    }

    async deleteMember(
        document: vscode.TextDocument,
        _classInfo: ClassInfo,
        member: ClassMember
    ): Promise<boolean> {
        const pipeline = new EditPipeline();
        await this.planMemberDeletion(document, member, pipeline);
        return pipeline.apply('Delete member');
    }

    async synchronizeAllMembers(
        document: vscode.TextDocument,
        classInfo: ClassInfo
    ): Promise<number> {
        const provider = this.getProvider(document);
        if (!provider) {
            return 0;
        }

        let count = 0;
        const workspaceEdit = new vscode.WorkspaceEdit();

        for (const member of classInfo.members) {
            const edits = provider.synchronizeDeclarationImplementation(document, classInfo, member);
            for (const edit of edits) {
                workspaceEdit.insert(document.uri, edit.range.start, edit.newText);
                count++;
            }
        }

        if (count > 0) {
            await vscode.workspace.applyEdit(workspaceEdit);
        }
        return count;
    }

    async extractMethod(
        document: vscode.TextDocument,
        range: vscode.Range,
        methodName: string,
        parameters: string[],
        returnType: string
    ): Promise<boolean> {
        const provider = this.getProvider(document);
        if (!provider) {
            return false;
        }

        const position = range.start;

        const context = {
            document,
            position,
            range,
            selection: new vscode.Selection(range.start, range.end),
        };

        const edits = provider.extractMethod(context, methodName, parameters, returnType);
        if (edits.length === 0) {
            return false;
        }

        const pipeline = new EditPipeline();
        pipeline.recordOriginal(document.uri, document.getText());
        for (const edit of edits) {
            pipeline.replace(document.uri, edit.range, edit.newText);
        }
        return pipeline.apply('Extract method');
    }
}

/**
 * Expand a member's declaration range to cover its full block: when the
 * signature line opens (or is followed by) a `{...}` body, the range extends to
 * the line containing the matching closing brace plus its trailing newline, so
 * a delete removes the member without leaving blank lines behind.
 */
export function expandToFullMember(document: vscode.TextDocument, range: vscode.Range): vscode.Range {
    const startLine = range.start.line;
    let endLine = range.end.line;
    const lineText = document.lineAt(startLine).text;
    const openBraceIdx = lineText.indexOf('{', range.start.character);

    if (openBraceIdx >= 0) {
        let braceDepth = 0;
        let foundOpen = false;
        for (let scanLine = startLine; scanLine < document.lineCount; scanLine++) {
            const scanText = document.lineAt(scanLine).text;
            const startCol = scanLine === startLine ? openBraceIdx : 0;
            for (let c = startCol; c < scanText.length; c++) {
                const ch = scanText[c];
                if (ch === '{') {
                    braceDepth++;
                    foundOpen = true;
                } else if (ch === '}') {
                    braceDepth--;
                }
            }
            if (foundOpen && braceDepth <= 0) {
                endLine = scanLine;
                break;
            }
        }
        if (foundOpen && braceDepth > 0) {
            endLine = document.lineCount - 1;
        }
    } else {
        const nextLineText = startLine + 1 < document.lineCount ? document.lineAt(startLine + 1).text : '';
        if (nextLineText.trim().startsWith('{')) {
            let braceDepth = 0;
            let foundOpen = false;
            for (let scanLine = startLine + 1; scanLine < document.lineCount; scanLine++) {
                const scanText = document.lineAt(scanLine).text;
                for (let c = 0; c < scanText.length; c++) {
                    const ch = scanText[c];
                    if (ch === '{') {
                        braceDepth++;
                        foundOpen = true;
                    } else if (ch === '}') {
                        braceDepth--;
                    }
                }
                if (foundOpen && braceDepth <= 0) {
                    endLine = scanLine;
                    break;
                }
            }
        }
    }

    const nextLineStart = endLine + 1 < document.lineCount
        ? new vscode.Position(endLine + 1, 0)
        : document.lineAt(endLine).range.end;

    return new vscode.Range(
        new vscode.Position(startLine, 0),
        nextLineStart
    );
}
