import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Template, parseTemplateFile } from '../models/Template';

export type TemplateScope = 'workspace' | 'global';

export interface ScopedTemplate extends Template {
    scope: TemplateScope;
}

export class TemplateStore {
    private workspaceUri: vscode.Uri | undefined;
    private globalUri: vscode.Uri;

    constructor(context: vscode.ExtensionContext) {
        this.globalUri = vscode.Uri.file(path.join(context.globalStorageUri.fsPath, 'templates.json'));
        const wsFolders = vscode.workspace.workspaceFolders;
        if (wsFolders && wsFolders.length > 0) {
            this.workspaceUri = vscode.Uri.file(path.join(wsFolders[0].uri.fsPath, '.vscode', 'ce-templates.json'));
        }
    }

    get workspaceAvailable(): boolean {
        return !!this.workspaceUri;
    }

    private uriFor(scope: TemplateScope): vscode.Uri | undefined {
        return scope === 'workspace' ? this.workspaceUri : this.globalUri;
    }

    async readScope(scope: TemplateScope): Promise<Template[]> {
        return this.readScopeFile(this.uriFor(scope));
    }

    private async readScopeFile(uri: vscode.Uri | undefined): Promise<Template[]> {
        if (!uri) return [];
        try {
            const content = await fs.promises.readFile(uri.fsPath, 'utf8');
            const result = parseTemplateFile(content);
            return result.ok ? result.templates : [];
        } catch {
            return [];
        }
    }

    /** Merge workspace + global, workspace winning on name collision. */
    async readAll(): Promise<ScopedTemplate[]> {
        const global = (await this.readScope('global')).map(t => ({ ...t, scope: 'global' as const }));
        const workspace = (await this.readScope('workspace')).map(t => ({ ...t, scope: 'workspace' as const }));
        const byName = new Map<string, ScopedTemplate>();
        for (const t of global) byName.set(t.name, t);
        for (const t of workspace) byName.set(t.name, t);
        return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    private async writeScope(scope: TemplateScope, templates: Template[]): Promise<void> {
        const uri = this.uriFor(scope);
        if (!uri) throw new Error('No ' + scope + ' storage available in this context.');
        await fs.promises.mkdir(path.dirname(uri.fsPath), { recursive: true });
        const payload = { templates };
        await fs.promises.writeFile(uri.fsPath, JSON.stringify(payload, null, 2), 'utf8');
    }

    /** Create or update. Rejects if a different template already owns the name. */
    async save(scope: TemplateScope, originalName: string | null | undefined, template: Template): Promise<void> {
        const list = await this.readScope(scope);
        const dup = list.find(t => t.name === template.name && t.name !== originalName);
        if (dup) {
            throw new Error('A template named "' + template.name + '" already exists in ' + scope + ' scope.');
        }
        const target = originalName ?? template.name;
        const idx = list.findIndex(t => t.name === target);
        if (idx >= 0) {
            list[idx] = template;
        } else {
            list.push(template);
        }
        await this.writeScope(scope, list);
    }

    async remove(scope: TemplateScope, name: string): Promise<void> {
        const list = await this.readScope(scope);
        await this.writeScope(scope, list.filter(t => t.name !== name));
    }
}
