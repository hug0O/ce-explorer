import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { ClassInfo, ClassMember, MemberKind } from '../models/types';

interface ReviewFinding {
    severity: 'info' | 'warning' | 'error';
    category: string;
    message: string;
    file: string;
    line: number;
    className?: string;
    memberName?: string;
}

function reviewDocument(document: vscode.TextDocument, provider: import('../providers/ILanguageProvider').ILanguageProvider): ReviewFinding[] {
    const findings: ReviewFinding[] = [];
    const parsed = provider.parseDocument(document);
    const fileName = document.fileName.split(/[/\\]/).pop() || document.fileName;

    for (const cls of parsed.classes) {
        if (cls.members.length > 15) {
            findings.push({ severity: 'warning', category: 'Size', message: `${cls.name} has ${cls.members.length} members (consider splitting)`, file: fileName, line: cls.range.start.line, className: cls.name });
        }

        const stubs = cls.members.filter(m => {
            const lineText = document.lineAt(m.range.start.line).text;
            return lineText.includes('todo!()') || lineText.includes('TODO') || lineText.includes('NotImplemented');
        });
        for (const s of stubs) {
            findings.push({ severity: 'info', category: 'Stub', message: `${s.name} has unimplemented body`, file: fileName, line: s.range.start.line, className: cls.name, memberName: s.name });
        }

        for (const m of cls.members) {
            const lineCount = m.range.end.line - m.range.start.line + 1;
            if (lineCount > 30) {
                findings.push({ severity: 'warning', category: 'Complexity', message: `${m.name} is ${lineCount} lines long`, file: fileName, line: m.range.start.line, className: cls.name, memberName: m.name });
            }
            if (m.visibility === 'public' && m.kind === MemberKind.Field) {
                findings.push({ severity: 'warning', category: 'Encapsulation', message: `Public field ${m.name} should be private with accessors`, file: fileName, line: m.range.start.line, className: cls.name, memberName: m.name });
            }
        }
    }

    const text = document.getText();
    const todoMatches = text.match(/(?:TODO|FIXME|HACK|XXX)[^;{}]*/gi) || [];
    for (const match of todoMatches) {
        const idx = text.indexOf(match);
        const line = document.positionAt(idx).line;
        findings.push({ severity: 'info', category: 'TODO', message: match.substring(0, 60), file: fileName, line });
    }

    return findings;
}

export async function runCodeReview(registry: ProviderRegistry): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showWarningMessage('No active editor.'); return; }

    const provider = registry.getByDocument(editor.document);
    if (!provider) { vscode.window.showWarningMessage('No provider for this file.'); return; }

    const findings = reviewDocument(editor.document, provider);

    if (findings.length === 0) {
        vscode.window.showInformationMessage('No issues found!');
        return;
    }

    const items = findings.map(f => ({
        label: `${f.severity === 'error' ? '❌' : f.severity === 'warning' ? '⚠️' : 'ℹ️'} ${f.category}: ${f.message}`,
        description: `Line ${f.line + 1}`,
        finding: f,
    }));

    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: `${findings.length} issue(s) found`,
    });

    if (picked) {
        const pos = new vscode.Position(picked.finding.line, 0);
        editor.selection = new vscode.Selection(pos, pos);
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    }
}
