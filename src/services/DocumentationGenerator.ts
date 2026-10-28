import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { ClassInfo, ClassMember, MemberKind } from '../models/types';
import { notify } from './Notify';

/**
 * Pure generator: produces a Markdown documentation string from a parsed
 * document. Decoupled from any VS Code UI so it can be reused both by
 * `generateDocumentation` (command palette) and by the inline analytics view.
 */
export function generateMarkdown(parsed: import('../models/types').ParsedDocument, fileName: string): string {
    const lines: string[] = [];
    lines.push(`# API Documentation — ${fileName}`);
    lines.push('');
    lines.push(`Generated on ${new Date().toLocaleDateString()}`);
    lines.push('');

    for (const cls of parsed.classes) {
        const typeLabel = cls.classType || (cls.isInterface ? 'Interface' : cls.isRecord ? 'Record' : 'Class');
        lines.push(`## ${typeLabel} ${cls.name}`);
        if (cls.parentClass) { lines.push(`> Extends: \`${cls.parentClass}\``); }
        if (cls.interfaces.length) { lines.push(`> Implements: ${cls.interfaces.map(i => `\`${i}\``).join(', ')}`); }
        lines.push('');

        const grouped = {
            constructors: cls.members.filter(m => m.kind === MemberKind.Constructor),
            fields: cls.members.filter(m => m.kind === MemberKind.Field),
            properties: cls.members.filter(m => m.kind === MemberKind.Property),
            methods: cls.members.filter(m => m.kind === MemberKind.Method),
            destructors: cls.members.filter(m => m.kind === MemberKind.Destructor),
        };

        if (grouped.constructors.length) {
            lines.push('### Constructors');
            for (const m of grouped.constructors) {
                const params = m.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
                lines.push(`- **${m.visibility}** \`${cls.name}(${params})\``);
            }
            lines.push('');
        }

        if (grouped.fields.length) {
            lines.push('### Fields');
            for (const m of grouped.fields) {
                lines.push(`- **${m.visibility}** ${m.name}: \`${m.type || 'unknown'}\``);
            }
            lines.push('');
        }

        if (grouped.properties.length) {
            lines.push('### Properties');
            for (const m of grouped.properties) {
                lines.push(`- **${m.visibility}** ${m.name}: \`${m.type || 'unknown'}\``);
            }
            lines.push('');
        }

        if (grouped.methods.length) {
            lines.push('### Methods');
            for (const m of grouped.methods) {
                const params = m.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
                const ret = m.returnType ? `: ${m.returnType}` : '';
                const mods = m.isStatic ? 'static ' : '';
                lines.push(`- **${m.visibility}** ${mods}\`${m.name}(${params})${ret}\``);
            }
            lines.push('');
        }

        if (grouped.destructors.length) {
            lines.push('### Destructors');
            for (const m of grouped.destructors) {
                lines.push(`- \`${m.name}\``);
            }
            lines.push('');
        }
    }

    return lines.join('\n');
}

export async function generateDocumentation(registry: ProviderRegistry): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { void notify.noEditor(); return; }

    const provider = registry.getByDocument(editor.document);
    if (!provider) { vscode.window.showWarningMessage('No provider for this file.'); return; }

    const parsed = provider.parseDocument(editor.document);
    const markdown = generateMarkdown(parsed, editor.document.fileName);

    const action = await vscode.window.showQuickPick(['Open in Editor', 'Copy to Clipboard', 'Save to File'], {
        placeHolder: 'How to output documentation?',
    });

    if (action === 'Open in Editor') {
        const doc = await vscode.workspace.openTextDocument({ content: markdown, language: 'markdown' });
        await vscode.window.showTextDocument(doc);
    } else if (action === 'Copy to Clipboard') {
        await vscode.env.clipboard.writeText(markdown);
        vscode.window.showInformationMessage('Documentation copied to clipboard');
    } else if (action === 'Save to File') {
        const uri = await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file('API.md'), filters: { Markdown: ['md'] } });
        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(markdown));
            vscode.window.showInformationMessage('Documentation saved');
        }
    }
}
