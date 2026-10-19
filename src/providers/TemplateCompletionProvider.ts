import * as vscode from 'vscode';
import { TemplateService } from '../services/TemplateService';
import { ProviderRegistry } from './ProviderRegistry';

export class TemplateCompletionProvider implements vscode.CompletionItemProvider {
    constructor(
        private templateService: TemplateService,
        private providerRegistry: ProviderRegistry,
    ) {}

    provideCompletionItems(
        document: vscode.TextDocument,
        _position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext,
    ): vscode.CompletionItem[] {
        const langKey = this.providerRegistry.getByDocument(document)?.languageId ?? document.languageId;
        const items: vscode.CompletionItem[] = [];
        for (const t of this.templateService.getForLanguage(langKey)) {
            const item = new vscode.CompletionItem(t.name, vscode.CompletionItemKind.Snippet);
            item.insertText = new vscode.SnippetString(t.body);
            if (t.prefix) {
                item.filterText = t.prefix;
                item.sortText = t.prefix;
            }
            item.detail = t.description || '(CE template)';
            items.push(item);
        }
        return items;
    }
}
