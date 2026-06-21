import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { ParsedDocument, ClassInfo, ClassMember } from '../models/types';

interface ExportData {
    exportedAt: string;
    fileName: string;
    language: string;
    classes: {
        name: string;
        classType?: string;
        parentClass?: string;
        interfaces: string[];
        isInterface: boolean;
        isRecord: boolean;
        members: {
            name: string;
            kind: string;
            returnType?: string;
            type?: string;
            visibility: string;
            parameters: { name: string; type: string }[];
            modifiers: string[];
            isStatic: boolean;
            line: number;
        }[];
        startLine: number;
        endLine: number;
    }[];
    imports: string[];
    standaloneFunctions: { name: string; returnType?: string; parameters: { name: string; type: string }[]; line: number }[];
}

export async function exportStructure(registry: ProviderRegistry): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showWarningMessage('No active editor.'); return; }

    const provider = registry.getByDocument(editor.document);
    if (!provider) { vscode.window.showWarningMessage('No provider for this file.'); return; }

    const parsed = provider.parseDocument(editor.document);

    const data: ExportData = {
        exportedAt: new Date().toISOString(),
        fileName: editor.document.fileName,
        language: provider.displayName,
        classes: parsed.classes.map(cls => ({
            name: cls.name,
            classType: cls.classType,
            parentClass: cls.parentClass,
            interfaces: cls.interfaces,
            isInterface: cls.isInterface,
            isRecord: cls.isRecord,
            members: cls.members.map(m => ({
                name: m.name,
                kind: m.kind,
                returnType: m.returnType,
                type: m.type,
                visibility: m.visibility,
                parameters: m.parameters.map(p => ({ name: p.name, type: p.type })),
                modifiers: m.modifiers,
                isStatic: m.isStatic,
                line: m.range.start.line,
            })),
            startLine: cls.range.start.line,
            endLine: cls.range.end.line,
        })),
        imports: parsed.imports,
        standaloneFunctions: parsed.standaloneProcedures.map(m => ({
            name: m.name,
            returnType: m.returnType,
            parameters: m.parameters.map(p => ({ name: p.name, type: p.type })),
            line: m.range.start.line,
        })),
    };

    const json = JSON.stringify(data, null, 2);
    const doc = await vscode.workspace.openTextDocument({ content: json, language: 'json' });
    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage('Structure exported to new tab');
}
