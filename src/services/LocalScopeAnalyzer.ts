import * as vscode from 'vscode';
import { ClassMember, MethodScope } from '../models/types';
import { ILanguageProvider } from '../providers/ILanguageProvider';

/**
 * Builds a MethodScope for a method member: the body range plus the local
 * variables/parameters detected by the language provider (regex baseline).
 * Language-agnostic; all syntax knowledge is delegated to the provider.
 */
export class LocalScopeAnalyzer {
    getScope(document: vscode.TextDocument, provider: ILanguageProvider, member: ClassMember): MethodScope | undefined {
        const bodyRange = provider.getMethodBodyRange(document, member);
        if (!bodyRange) return undefined;
        const locals = provider.parseLocals(document, member);
        return { method: member, bodyRange, locals, lspAvailable: false };
    }

    /**
     * Enrich the rename occurrence set using DocumentHighlights when a language
     * server is active. Returns undefined when no LSP / not available so callers
     * fall back to the regex-based word-boundary scan within the body range.
     */
    async getRenameOccurrences(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Range[] | undefined> {
        try {
            const highlights = await vscode.commands.executeCommand<vscode.DocumentHighlight[]>(
                'vscode.executeDocumentHighlights', document.uri, position);
            return highlights && highlights.length ? highlights.map(h => h.range) : undefined;
        } catch {
            return undefined;
        }
    }
}
