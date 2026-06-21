import * as vscode from 'vscode';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import {
    ClassInfo, ClassMember, MemberSpec, FieldSpec, PropertySpec,
    GeneratedCode, MemberKind, Visibility, SortScheme, DEFAULT_SORT_SCHEMES,
} from '../models/types';

export class CodeGeneratorService {
    private providers: Map<string, ILanguageProvider> = new Map();

    registerProvider(provider: ILanguageProvider): void {
        this.providers.set(provider.languageId, provider);
    }

    private getProvider(document: vscode.TextDocument): ILanguageProvider | undefined {
        const provider = this.providers.get(document.languageId);
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

    async addMethod(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        spec: MemberSpec
    ): Promise<boolean> {
        const provider = this.getProvider(document);
        if (!provider) {
            vscode.window.showErrorMessage('No language provider for this file type.');
            return false;
        }

        const log = vscode.window.createOutputChannel('MMX Debug');
        log.appendLine('=== addMethod ===');
        log.appendLine('Class: ' + classInfo.name);
        log.appendLine('Method: ' + spec.name);
        log.appendLine('Visibility: ' + spec.visibility);
        log.appendLine('Params: ' + spec.parameters.length);
        log.appendLine('Provider: ' + provider.displayName);

        const insertPos = provider.getInsertPosition(document, classInfo, 'method');
        log.appendLine('InsertPos decl: line=' + insertPos.declaration.line + ' char=' + insertPos.declaration.character);
        log.appendLine('InsertPos impl: line=' + insertPos.implementation.line + ' char=' + insertPos.implementation.character);

        const generated = provider.generateMethod(classInfo.name, spec, classInfo);
        log.appendLine('Generated declaration: [' + generated.declaration + ']');
        log.appendLine('Generated implementation: [' + generated.implementation + ']');
        log.appendLine('Generated declPos: line=' + generated.declarationPosition.line + ' char=' + generated.declarationPosition.character);
        log.appendLine('Generated implPos: line=' + generated.implementationPosition.line + ' char=' + generated.implementationPosition.character);
        log.appendLine('Generated pairedFileUri: ' + (generated.pairedFileUri ? generated.pairedFileUri.toString() : 'none'));
        log.appendLine('Generated pairedFileImpl: [' + (generated.pairedFileImplementation || '') + ']');

        if (!generated.declaration && !generated.implementation) {
            log.appendLine('ERROR: Both declaration and implementation are empty!');
            log.show();
            vscode.window.showErrorMessage('CE: generateMethod returned empty code');
            return false;
        }

        log.show();
        return this.applyGeneratedCode(document, generated, classInfo, spec.kind);
    }

    async addField(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        spec: FieldSpec
    ): Promise<boolean> {
        const provider = this.getProvider(document);
        if (!provider) {
            vscode.window.showErrorMessage('No language provider for this file type.');
            return false;
        }

        const generated = provider.generateField(classInfo.name, spec, classInfo);
        return this.applyGeneratedCode(document, generated, classInfo, MemberKind.Field);
    }

    async addProperty(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        spec: PropertySpec
    ): Promise<boolean> {
        const provider = this.getProvider(document);
        if (!provider) {
            vscode.window.showErrorMessage('No language provider for this file type.');
            return false;
        }

        const generated = provider.generateProperty(classInfo.name, spec, classInfo);
        return this.applyGeneratedCode(document, generated, classInfo, MemberKind.Property);
    }

    private async applyGeneratedCode(
        document: vscode.TextDocument,
        generated: GeneratedCode,
        classInfo: ClassInfo,
        _memberKind: MemberKind
    ): Promise<boolean> {
        const log = vscode.window.createOutputChannel('MMX Debug');
        const workspaceEdit = new vscode.WorkspaceEdit();

        log.appendLine('--- applyGeneratedCode ---');
        log.appendLine('URI: ' + document.uri.toString());

        if (generated.declaration) {
            log.appendLine('Inserting declaration at line=' + generated.declarationPosition.line + ' char=' + generated.declarationPosition.character);
            workspaceEdit.insert(
                document.uri,
                generated.declarationPosition,
                generated.declaration
            );
        } else {
            log.appendLine('WARNING: empty declaration');
        }

        if (generated.pairedFileImplementation) {
            const provider = this.getProvider(document);
            const pairedUri = provider?.findPairedFile(document.uri);

            if (pairedUri) {
                const pairedDoc = await vscode.workspace.openTextDocument(pairedUri);
                const implPos = new vscode.Position(pairedDoc.lineCount, 0);
                log.appendLine('Inserting paired impl in: ' + pairedUri.fsPath + ' at line=' + implPos.line);
                workspaceEdit.insert(pairedUri, implPos, '\n' + generated.pairedFileImplementation);
            } else {
                const implPos = new vscode.Position(document.lineCount, 0);
                log.appendLine('No paired file, inserting impl at end of current file, line=' + implPos.line);
                workspaceEdit.insert(document.uri, implPos, '\n' + generated.pairedFileImplementation);
            }
        } else if (generated.implementation) {
            log.appendLine('Inserting implementation at line=' + generated.implementationPosition.line + ' char=' + generated.implementationPosition.character);
            workspaceEdit.insert(
                document.uri,
                generated.implementationPosition,
                generated.implementation
            );
        } else {
            log.appendLine('WARNING: no implementation to insert');
        }

        log.appendLine('Applying workspace edit...');
        const success = await vscode.workspace.applyEdit(workspaceEdit);
        log.appendLine('Edit result: ' + success);
        log.show();

        if (success) {
            const targetPos = generated.pairedFileUri
                ? generated.implementationPosition
                : generated.implementationPosition;
            const targetUri = generated.pairedFileUri ?? document.uri;
            const targetDoc = await vscode.workspace.openTextDocument(targetUri);
            const editor = await vscode.window.showTextDocument(targetDoc, {
                selection: new vscode.Selection(targetPos, targetPos),
                preserveFocus: false,
            });
            editor.revealRange(
                new vscode.Range(targetPos, targetPos),
                vscode.TextEditorRevealType.InCenter
            );
        }
        return success;
    }

    async deleteMember(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        member: ClassMember
    ): Promise<boolean> {
        console.log('[MMX] [CodeGenerator.deleteMember] member=' + member.name + ' class=' + classInfo.name);
        console.log('[MMX] [CodeGenerator.deleteMember] member.range: line ' + member.range.start.line + '-' + member.range.end.line);
        console.log('[MMX] [CodeGenerator.deleteMember] implementationRange: ' + (member.implementationRange ? 'line ' + member.implementationRange.start.line + '-' + member.implementationRange.end.line : 'none'));

        const workspaceEdit = new vscode.WorkspaceEdit();

        const fullRange = this.expandToFullMember(document, member.range);
        console.log('[MMX] [CodeGenerator.deleteMember] fullRange (expanded): line ' + fullRange.start.line + '-' + fullRange.end.line);
        const deletedText = document.getText(fullRange);
        console.log('[MMX] [CodeGenerator.deleteMember] deleting text: [' + deletedText.substring(0, 200) + ']');
        workspaceEdit.delete(document.uri, fullRange);

        if (member.implementationRange) {
            // For standalone functions the declaration and implementation are the same
            // block; avoid deleting it twice (which would eat adjacent lines).
            const overlaps = member.implementationRange.start.line <= fullRange.end.line
                && member.implementationRange.end.line >= fullRange.start.line;
            if (!overlaps) {
                const implRange = this.expandToFullMember(document, member.implementationRange);
                console.log('[MMX] [CodeGenerator.deleteMember] implRange (expanded): line ' + implRange.start.line + '-' + implRange.end.line);
                workspaceEdit.delete(document.uri, implRange);
            } else {
                console.log('[MMX] [CodeGenerator.deleteMember] implRange overlaps decl range — skipping (standalone)');
            }
        }

        const provider = this.getProvider(document);
        if (provider) {
            const pairedUri = provider.findPairedFile(document.uri);
            console.log('[MMX] [CodeGenerator.deleteMember] pairedUri: ' + (pairedUri?.fsPath || 'none'));
            if (pairedUri && member.implementationRange) {
                const pairedDoc = await vscode.workspace.openTextDocument(pairedUri);
                const pairedRange = this.expandToFullMember(pairedDoc, member.implementationRange);
                console.log('[MMX] [CodeGenerator.deleteMember] pairedRange: line ' + pairedRange.start.line + '-' + pairedRange.end.line);
                workspaceEdit.delete(pairedUri, pairedRange);
            }
        }

        const result = await vscode.workspace.applyEdit(workspaceEdit);
        console.log('[MMX] [CodeGenerator.deleteMember] applyEdit result: ' + result);
        return result;
    }

    async navigateToMember(
        document: vscode.TextDocument,
        member: ClassMember,
        target: 'declaration' | 'implementation' = 'declaration'
    ): Promise<void> {
        let range = member.range;
        let uri = document.uri;

        if (target === 'implementation' && member.implementationRange) {
            const provider = this.getProvider(document);
            const pairedUri = provider?.findPairedFile(document.uri);
            if (pairedUri) {
                uri = pairedUri;
            }
            range = member.implementationRange;
        }

        const doc = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(doc, {
            selection: new vscode.Selection(range.start, range.end),
            preserveFocus: false,
        });
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    }

    async synchronizeDeclImpl(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        member: ClassMember
    ): Promise<boolean> {
        const provider = this.getProvider(document);
        if (!provider) {
            return false;
        }

        const edits = provider.synchronizeDeclarationImplementation(document, classInfo, member);
        if (edits.length === 0) {
            vscode.window.showInformationMessage('Member is already synchronized.');
            return true;
        }

        const workspaceEdit = new vscode.WorkspaceEdit();
        for (const edit of edits) {
            workspaceEdit.replace(document.uri, edit.range, edit.newText);
        }

        return vscode.workspace.applyEdit(workspaceEdit);
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

    async sortMembers(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        schemeName: string = 'fieldsFirst'
    ): Promise<boolean> {
        const provider = this.getProvider(document);
        if (!provider) {
            return false;
        }

        const scheme = DEFAULT_SORT_SCHEMES[schemeName];
        if (!scheme) {
            return false;
        }

        const sorted = provider.sortMembers(classInfo.members, scheme);
        if (this.arraysEqual(sorted, classInfo.members)) {
            vscode.window.showInformationMessage('Members are already sorted.');
            return true;
        }

        const workspaceEdit = new vscode.WorkspaceEdit();
        const declRanges: vscode.Range[] = [];
        const declTexts: string[] = [];

        for (const member of classInfo.members) {
            declRanges.push(member.range);
            const text = document.getText(member.range);
            declTexts.push(text);
        }

        for (let i = 0; i < declRanges.length; i++) {
            const sortedMember = sorted[i];
            const originalIdx = classInfo.members.indexOf(sortedMember);
            if (originalIdx !== i) {
                workspaceEdit.replace(document.uri, declRanges[i], declTexts[originalIdx]);
            }
        }

        return vscode.workspace.applyEdit(workspaceEdit);
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

        const workspaceEdit = new vscode.WorkspaceEdit();
        for (const edit of edits) {
            workspaceEdit.replace(document.uri, edit.range, edit.newText);
        }

        return vscode.workspace.applyEdit(workspaceEdit);
    }

    private expandToFullMember(document: vscode.TextDocument, range: vscode.Range): vscode.Range {
        const startLine = range.start.line;
        let endLine = range.end.line;
        console.log('[MMX] [expandToFullMember] input: line ' + startLine + '-' + endLine);

        const lineText = document.lineAt(startLine).text;
        const openBraceIdx = lineText.indexOf('{', range.start.character);
        console.log('[MMX] [expandToFullMember] startLine text: [' + lineText + ']');
        console.log('[MMX] [expandToFullMember] openBraceIdx on startLine: ' + openBraceIdx);

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
                    console.log('[MMX] [expandToFullMember] braces balanced at line ' + scanLine);
                    break;
                }
            }
            if (foundOpen && braceDepth > 0) {
                endLine = document.lineCount - 1;
                console.log('[MMX] [expandToFullMember] braces NOT balanced, using last line');
            }
        } else {
            const nextLineText = startLine + 1 < document.lineCount ? document.lineAt(startLine + 1).text : '';
            console.log('[MMX] [expandToFullMember] nextLine text: [' + nextLineText + ']');
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
                        console.log('[MMX] [expandToFullMember] braces balanced (nextLine path) at line ' + scanLine);
                        break;
                    }
                }
            } else {
                console.log('[MMX] [expandToFullMember] no brace found — using original endLine ' + endLine);
            }
        }

        const nextLineStart = endLine + 1 < document.lineCount
            ? new vscode.Position(endLine + 1, 0)
            : document.lineAt(endLine).range.end;

        console.log('[MMX] [expandToFullMember] result: line ' + startLine + '-' + endLine + ' -> range ends at line ' + nextLineStart.line);
        return new vscode.Range(
            new vscode.Position(startLine, 0),
            nextLineStart
        );
    }

    private arraysEqual(a: ClassMember[], b: ClassMember[]): boolean {
        if (a.length !== b.length) { return false; }
        return a.every((v, i) => v.id === b[i].id);
    }
}
