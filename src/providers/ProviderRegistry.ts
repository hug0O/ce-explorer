import * as vscode from 'vscode';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { ParsedDocument } from '../models/types';
import { acceptsContent } from '../utils/plsqlSniff';
import { languageOverrides } from '../services/LanguageOverrides';
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
    private sniffCache: Map<string, { version: number; ok: boolean }> = new Map();
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

    /** `ignoreOverride`: what the extension would pick on its own, whatever was chosen by hand (to show it as "Auto"). */
    getByDocument(document: vscode.TextDocument, ignoreOverride = false): ILanguageProvider | undefined {
        // a language chosen by hand wins: it is how a file that is not recognised gets the features
        const chosen = ignoreOverride ? undefined : languageOverrides.resolve(document.uri.fsPath);
        const forced = chosen ? this.providers.get(chosen) : undefined;
        if (forced) { return forced; }
        const provider = this.providers.get(document.languageId);
        if (provider) {
            return provider;
        }
        const byExt = this.getByFileExtension(document.uri.fsPath);
        // A .txt only counts as source when it really contains SQL / PL/SQL.
        return byExt && this.acceptsDocument(document) ? byExt : undefined;
    }

    /** Content check for ambiguous extensions, cached per (uri, version). */
    acceptsDocument(document: vscode.TextDocument): boolean {
        const path = document.uri.fsPath;
        if (!acceptsContent(path, '')) {
            const key = document.uri.toString();
            const hit = this.sniffCache.get(key);
            if (hit && typeof document.version === 'number' && hit.version === document.version) { return hit.ok; }
            const ok = acceptsContent(path, document.getText());
            this.sniffCache.set(key, { version: document.version, ok });
            if (this.sniffCache.size > 64) { this.sniffCache.delete(this.sniffCache.keys().next().value as string); }
            return ok;
        }
        return true;
    }

    /** Same decision from raw text (workspace scans). */
    acceptsText(fsPath: string, text: string): boolean {
        return acceptsContent(fsPath, text);
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

    /** Forgets every parse and every content check: the language of a file may have changed. */
    clearCaches(): void {
        this.parseCache.clear();
        this.sniffCache.clear();
    }

    getAllProviders(): ILanguageProvider[] {
        return Array.from(this.providers.values());
    }

    getSupportedLanguageIds(): string[] {
        return Array.from(this.providers.keys());
    }

    getSupportedExtensions(): string[] {
        return [...new Set([...this.extensionToProvider.keys(), ...languageOverrides.chosenExtensions])];
    }
}
