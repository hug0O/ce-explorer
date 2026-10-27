import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { MemberKind } from '../models/types';

export class CeCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
    readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

    constructor(private registry: ProviderRegistry) {}

    refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    provideCodeLenses(document: vscode.TextDocument): vscode.ProviderResult<vscode.CodeLens[]> {
        if (!vscode.workspace.getConfiguration('ce').get<boolean>('enableCodeLens', true)) {
            return [];
        }

        const provider = this.registry.getByDocument(document);
        if (!provider) return [];

        const parsed = this.registry.parse(document) ?? provider.parseDocument(document);
        const lenses: vscode.CodeLens[] = [];

        for (const cls of parsed.classes) {
            const methodCount = cls.members.filter(m => m.kind === MemberKind.Method || m.kind === MemberKind.Constructor).length;
            const fieldCount = cls.members.filter(m => m.kind === MemberKind.Field).length;
            const propertyCount = cls.members.filter(m => m.kind === MemberKind.Property).length;
            const headingCount = cls.members.filter(m => m.kind === MemberKind.Heading).length;
            const typeLabel = cls.classType || (cls.isInterface ? 'interface' : cls.isRecord ? 'record' : 'class');

            const parts: string[] = [];
            if (methodCount > 0) parts.push(`${methodCount} method${methodCount > 1 ? 's' : ''}`);
            if (fieldCount > 0) parts.push(`${fieldCount} field${fieldCount > 1 ? 's' : ''}`);
            if (propertyCount > 0) parts.push(`${propertyCount} propert${propertyCount > 1 ? 'ies' : 'y'}`);

            if (headingCount > 0) parts.push(`${headingCount} heading${headingCount > 1 ? 's' : ''}`);

            const summary = parts.length > 0 ? parts.join(', ') : 'empty';
            lenses.push(new vscode.CodeLens(
                new vscode.Range(cls.range.start.line, 0, cls.range.start.line, 0),
                {
                    command: 'ce.goToMember',
                    title: `$(symbol-class) ${typeLabel} ${cls.name} — ${summary}`,
                }
            ));

            lenses.push(new vscode.CodeLens(
                new vscode.Range(cls.range.start.line, 0, cls.range.start.line, 0),
                {
                    command: 'ce.lensRun',
                    title: '$(list-tree) Structure',
                    arguments: ['ce.manageMembers', cls.range.start.line],
                }
            ));

            const memberActions = vscode.workspace.getConfiguration('ce').get<boolean>('codeLensMemberActions', false);
            for (const member of cls.members) {
                const lens = this.buildMemberLens(member, cls);
                if (lens) lenses.push(lens);
                if (memberActions) {
                    const r = new vscode.Range(member.range.start.line, 0, member.range.start.line, 0);
                    lenses.push(
                        new vscode.CodeLens(r, { command: 'ce.lensRun', title: '$(edit) Edit', arguments: ['ce.editMember', member.range.start.line] }),
                        new vscode.CodeLens(r, { command: 'ce.lensRun', title: '$(trash) Delete', arguments: ['ce.deleteMember', member.range.start.line] }),
                    );
                }
            }
        }

        return lenses;
    }

    private buildMemberLens(member: import('../models/types').ClassMember, cls: import('../models/types').ClassInfo): vscode.CodeLens | undefined {
        const line = member.range.start.line;
        const range = new vscode.Range(line, 0, line, 0);

        if (member.modifiers.includes('override') || member.isOverride) {
            return new vscode.CodeLens(range, {
                command: 'ce.navigateToMember',
                title: '$(arrow-up) overrides parent',
                arguments: [member.range.start],
            });
        }
        if (member.isAbstract) {
            return new vscode.CodeLens(range, {
                command: 'ce.navigateToMember',
                title: '$(circle-outline) abstract — must be implemented',
                arguments: [member.range.start],
            });
        }
        if (member.isStatic) {
            return new vscode.CodeLens(range, {
                command: 'ce.navigateToMember',
                title: '$(symbol-keyword) static',
                arguments: [member.range.start],
            });
        }
        if (member.isVirtual) {
            return new vscode.CodeLens(range, {
                command: 'ce.navigateToMember',
                title: '$(zap) virtual — can be overridden',
                arguments: [member.range.start],
            });
        }
        if (member.kind === MemberKind.Constructor) {
            return new vscode.CodeLens(range, {
                command: 'ce.navigateToMember',
                title: '$(zap) constructor',
                arguments: [member.range.start],
            });
        }
        return undefined;
    }
}
