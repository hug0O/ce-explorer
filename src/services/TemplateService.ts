import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Template, parseTemplateFile, mergeTemplates, ParseResult } from '../models/Template';
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates';

export class TemplateService {
    private templates: Template[] = [];
    private workspaceUri: vscode.Uri | undefined;
    private globalUri: vscode.Uri;
    private watchers: vscode.Disposable[] = [];

    constructor(context: vscode.ExtensionContext) {
        this.globalUri = vscode.Uri.file(path.join(context.globalStorageUri.fsPath, 'templates.json'));
        const wsFolders = vscode.workspace.workspaceFolders;
        if (wsFolders && wsFolders.length > 0) {
            this.workspaceUri = vscode.Uri.file(path.join(wsFolders[0].uri.fsPath, '.vscode', 'mmx-templates.json'));
        }
    }

    async load(): Promise<void> {
        const global = await this.loadFile(this.globalUri);
        const workspace = await this.loadFile(this.workspaceUri);
        this.templates = mergeTemplates(DEFAULT_TEMPLATES, mergeTemplates(global, workspace));
        console.log('[MMX] [TemplateService] loaded ' + this.templates.length + ' templates');
    }

    private async loadFile(uri: vscode.Uri | undefined): Promise<Template[]> {
        if (!uri) return [];
        try {
            const content = await fs.promises.readFile(uri.fsPath, 'utf8');
            const result: ParseResult = parseTemplateFile(content);
            if (!result.ok) {
                console.warn('[MMX] [TemplateService] ' + uri.fsPath + ': ' + result.error);
                return [];
            }
            return result.templates;
        } catch {
            return [];
        }
    }

    startWatching(): void {
        this.stopWatching();
        const wsWatcher = vscode.workspace.createFileSystemWatcher('.vscode/mmx-templates.json');
        const reload = () => { this.load().catch(() => { /* logged inside */ }); };
        this.watchers.push(
            wsWatcher,
            wsWatcher.onDidChange(reload),
            wsWatcher.onDidCreate(reload),
            wsWatcher.onDidDelete(reload),
        );
    }

    stopWatching(): void {
        for (const w of this.watchers) w.dispose();
        this.watchers = [];
    }

    getForLanguage(languageId: string): Template[] {
        return this.templates.filter(t => !t.languages || t.languages.length === 0 || t.languages.includes(languageId));
    }

    getAll(): Template[] {
        return this.templates;
    }

    dispose(): void {
        this.stopWatching();
    }
}
