import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { ClassInfo, ClassMember, MemberKind } from '../models/types';

interface DeadCodeItem {
    kind: 'method' | 'class' | 'import';
    name: string;
    file: string;
    line: number;
    className?: string;
}

export async function detectDeadCode(registry: ProviderRegistry): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showWarningMessage('No active editor.'); return; }

    const provider = registry.getByDocument(editor.document);
    if (!provider) { vscode.window.showWarningMessage('No provider for this file.'); return; }

    vscode.window.showInformationMessage('Scanning workspace for dead code...');

    const extensions = provider.fileExtensions.map(e => e.substring(1));
    const pattern = `**/*.{${extensions.join(',')}}`;
    const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');

    const allMethodNames = new Map<string, { file: string; line: number; className?: string }>();
    const allClassNames = new Map<string, { file: string; line: number }>();
    const allTexts: string[] = [];

    for (const fileUri of files) {
        try {
            const doc = await vscode.workspace.openTextDocument(fileUri);
            const prov = registry.getByDocument(doc);
            if (!prov) continue;

            const parsed = prov.parseDocument(doc);
            const text = doc.getText();
            allTexts.push(text);

            for (const cls of parsed.classes) {
                allClassNames.set(cls.name, { file: fileUri.fsPath, line: cls.range.start.line });
                for (const m of cls.members) {
                    if (m.kind === MemberKind.Method || m.kind === MemberKind.Constructor) {
                        allMethodNames.set(`${cls.name}::${m.name}`, { file: fileUri.fsPath, line: m.range.start.line, className: cls.name });
                    }
                }
            }
        } catch { /* skip unreadable files */ }
    }

    const combinedText = allTexts.join('\n');
    const deadCode: DeadCodeItem[] = [];

    for (const [key, info] of allMethodNames) {
        const methodName = key.split('::')[1];
        const occurrences = combinedText.split(methodName).length - 1;
        if (occurrences <= 1) {
            deadCode.push({ kind: 'method', name: methodName, file: info.file, line: info.line, className: info.className });
        }
    }

    for (const [name, info] of allClassNames) {
        const occurrences = combinedText.split(name).length - 1;
        if (occurrences <= 1) {
            deadCode.push({ kind: 'class', name, file: info.file, line: info.line });
        }
    }

    if (deadCode.length === 0) {
        vscode.window.showInformationMessage('No dead code detected');
        return;
    }

    const items = deadCode.map(d => ({
        label: `${d.kind === 'method' ? '$(symbol-method)' : '$(symbol-class)'} ${d.name}`,
        description: d.file.split(/[/\\]/).pop(),
        item: d,
    }));

    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: `${deadCode.length} potentially unused item(s) found`,
    });

    if (picked) {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(picked.item.file));
        const editor2 = await vscode.window.showTextDocument(doc);
        const pos = new vscode.Position(picked.item.line, 0);
        editor2.selection = new vscode.Selection(pos, pos);
        editor2.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    }
}
