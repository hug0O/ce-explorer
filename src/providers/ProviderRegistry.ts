import * as vscode from 'vscode';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { PascalLanguageProvider } from '../providers/PascalLanguageProvider';
import { CppLanguageProvider } from '../providers/CppLanguageProvider';
import { RustLanguageProvider } from '../providers/RustLanguageProvider';
import { JavaLanguageProvider } from '../providers/JavaLanguageProvider';
import { PythonLanguageProvider } from '../providers/PythonLanguageProvider';
import { CSharpLanguageProvider } from '../providers/CSharpLanguageProvider';
import { GoLanguageProvider } from '../providers/GoLanguageProvider';
import { TypeScriptLanguageProvider } from '../providers/TypeScriptLanguageProvider';

export class ProviderRegistry {
    private providers: Map<string, ILanguageProvider> = new Map();
    private extensionToProvider: Map<string, ILanguageProvider> = new Map();

    constructor() {
        this.register(new PascalLanguageProvider());
        this.register(new CppLanguageProvider());
        this.register(new RustLanguageProvider());
        this.register(new JavaLanguageProvider());
        this.register(new PythonLanguageProvider());
        this.register(new CSharpLanguageProvider());
        this.register(new GoLanguageProvider());
        this.register(new TypeScriptLanguageProvider());
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
