import * as vscode from 'vscode';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { ParsedDocument } from '../models/types';
import { PascalLanguageProvider } from '../providers/PascalLanguageProvider';
import { CppLanguageProvider } from '../providers/CppLanguageProvider';
import { RustLanguageProvider } from '../providers/RustLanguageProvider';
import { JavaLanguageProvider } from '../providers/JavaLanguageProvider';
import { PythonLanguageProvider } from '../providers/PythonLanguageProvider';
import { CSharpLanguageProvider } from '../providers/CSharpLanguageProvider';
import { GoLanguageProvider } from '../providers/GoLanguageProvider';
import { TypeScriptLanguageProvider } from '../providers/TypeScriptLanguageProvider';
import { PlSqlLanguageProvider } from '../providers/PlSqlLanguageProvider';

export class ProviderRegistry {
    private providers: Map<string, ILanguageProvider> = new Map();
    private extensionToProvider: Map<string, ILanguageProvider> = new Map();
    private static readonly PARSE_CACHE_SIZE = 24;
    private parseCache: Map<string, { version: number; parsed: ParsedDocument }> = new Map();

    constructor() {
        this.register(new PascalLanguageProvider());
        this.register(new CppLanguageProvider());
        this.register(new RustLanguageProvider());
        this.register(new JavaLanguageProvider());
        this.register(new PythonLanguageProvider());
        this.register(new CSharpLanguageProvider());
        this.register(new GoLanguageProvider());
        this.register(new TypeScriptLanguageProvider());
        this.register(new PlSqlLanguageProvider());
    }

    register(provider: ILanguageProvider): void {
        this.providers.set(provider.languageId, provider);
        for (const ext of provider.fileExtensions) {
            this.extensionToProvider.set(ext, provider);
        }
    }

    getByLanguageId(languageId: string): ILanguageProvider | undefined {
        return this.providers.get(languageId);
    }

    getByFileExtension(filePath: string): ILanguageProvider | undefined {
        const ext = filePath.substring(filePath.lastIndexOf('.'));
        return this.extensionToProvider.get(ext);
    }

    getByDocument(document: vscode.TextDocument): ILanguageProvider | undefined {
        let provider = this.providers.get(document.languageId);
        if (provider) {
            return provider;
        }
        return this.getByFileExtension(document.uri.fsPath);
    }

    /**
     * Parse a document once per (uri, version). The code-action, quick-fix and
     * code-lens providers all run on every cursor move / edit; sharing the
     * result avoids re-parsing the same text several times per keystroke.
     */
    parse(document: vscode.TextDocument): ParsedDocument | undefined {
        const provider = this.getByDocument(document);
        if (!provider) { return undefined; }
        if (typeof document.version !== 'number') { return provider.parseDocument(document); }
        const key = document.uri.toString();
        const hit = this.parseCache.get(key);
        if (hit && hit.version === document.version) {
            // Refresh recency (Map keeps insertion order).
            this.parseCache.delete(key);
            this.parseCache.set(key, hit);
            return hit.parsed;
        }
        const parsed = provider.parseDocument(document);
        this.parseCache.set(key, { version: document.version, parsed });
        if (this.parseCache.size > ProviderRegistry.PARSE_CACHE_SIZE) {
            const oldest = this.parseCache.keys().next().value;
            if (oldest !== undefined) { this.parseCache.delete(oldest); }
        }
        return parsed;
    }

    getAllProviders(): ILanguageProvider[] {
        return Array.from(this.providers.values());
    }

    getSupportedLanguageIds(): string[] {
        return Array.from(this.providers.keys());
    }

    getSupportedExtensions(): string[] {
        return Array.from(this.extensionToProvider.keys());
    }
}
