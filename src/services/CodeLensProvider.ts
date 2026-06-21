import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { MemberKind } from '../models/types';

export class MmxCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
    readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

    constructor(private registry: ProviderRegistry) {}

    refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    provideCodeLenses(document: vscode.TextDocument): vscode.ProviderResult<vscode.CodeLens[]> {
        if (!vscode.workspace.getConfiguration('mmx').get<boolean>('enableCodeLens', true)) {
            return [];
        }

        const provider = this.registry.getByDocument(document);
        if (!provider) return [];

        const parsed = provider.parseDocument(document);
        const lenses: vscode.CodeLens[] = [];

        for (const cls of parsed.classes) {
            const methodCount = cls.members.filter(m => m.kind === MemberKind.Method || m.kind === MemberKind.Constructor).length;
            const fieldCount = cls.members.filter(m => m.kind === MemberKind.Field).length;
            const propertyCount = cls.members.filter(m => m.kind === MemberKind.Property).length;
            const typeLabel = cls.classType || (cls.isInterface ? 'interface' : cls.isRecord ? 'record' : 'class');

            const parts: string[] = [];
            if (methodCount > 0) parts.push(`${methodCount} method${methodCount > 1 ? 's' : ''}`);
            if (fieldCount > 0) parts.push(`${fieldCount} field${fieldCount > 1 ? 's' : ''}`);
            if (propertyCount > 0) parts.push(`${propertyCount} propert${propertyCount > 1 ? 'ies' : 'y'}`);

            const summary = parts.length > 0 ? parts.join(', ') : 'empty';
            lenses.push(new vscode.CodeLens(
                new vscode.Range(cls.range.start.line, 0, cls.range.start.line, 0),
                {
                    command: 'mmx.goToMember',
                    title: `$(symbol-class) ${typeLabel} ${cls.name} — ${summary}`,
                }
            ));

            for (const member of cls.members) {
                const lens = this.buildMemberLens(member, cls);
                if (lens) lenses.push(lens);
            }
        }

        return lenses;
    }

    private buildMemberLens(member: import('../models/types').ClassMember, cls: import('../models/types').ClassInfo): vscode.CodeLens | undefined {
        const line = member.range.start.line;
        const range = new vscode.Range(line, 0, line, 0);

        if (member.modifiers.includes('override') || member.isOverride) {
            return new vscode.CodeLens(range, {
                command: 'mmx.navigateToMember',
                title: '$(arrow-up) overrides parent',
                arguments: [member.range.start],
            });
        }
        if (member.isAbstract) {
            return new vscode.CodeLens(range, {
                command: 'mmx.navigateToMember',
                title: '$(circle-outline) abstract — must be implemented',
                arguments: [member.range.start],
            });
        }
        if (member.isStatic) {
            return new vscode.CodeLens(range, {
                command: 'mmx.navigateToMember',
                title: '$(symbol-keyword) static',
                arguments: [member.range.start],
            });
        }
        if (member.isVirtual) {
            return new vscode.CodeLens(range, {
                command: 'mmx.navigateToMember',
                title: '$(zap) virtual — can be overridden',
                arguments: [member.range.start],
            });
        }
        if (member.kind === MemberKind.Constructor) {
            return new vscode.CodeLens(range, {
                command: 'mmx.navigateToMember',
                title: '$(zap) constructor',
                arguments: [member.range.start],
            });
        }
        return undefined;
    }
}
