import * as vscode from 'vscode';
import { ProviderRegistry } from './ProviderRegistry';

interface MmxAction {
    title: string;
    cmd: string;
    group: string;
}

export class MmxCodeActionProvider implements vscode.CodeActionProvider {
    constructor(private providerRegistry: ProviderRegistry) {}

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        _context: vscode.CodeActionContext,
        _token: vscode.CancellationToken,
    ): vscode.CodeAction[] {
        const provider = this.providerRegistry.getByDocument(document);
        if (!provider) {
            return [];
        }

        const parsed = provider.parseDocument(document);
        const position = range instanceof vscode.Selection ? range.active : range.start;

        let onMember = false;
        let onClass = false;

        for (const cls of parsed.classes) {
            if (cls.range.contains(position)) {
                onClass = true;
                for (const member of cls.members) {
                    if (member.range.contains(position) || member.implementationRange?.contains(position)) {
                        onMember = true;
                        break;
                    }
                }
                break;
            }
        }

        if (!onMember) {
            for (const proc of parsed.standaloneProcedures) {
                if (proc.range.contains(position) || proc.implementationRange?.contains(position)) {
                    onMember = true;
                    break;
                }
            }
        }

        const actions: MmxAction[] = [];

        if (onMember) {
            actions.push(
                { title: 'MMX: Edit Member', cmd: 'mmx.editMember', group: 'mmx-member' },
                { title: 'MMX: Rename Member', cmd: 'mmx.renameMember', group: 'mmx-member' },
                { title: 'MMX: Delete Member', cmd: 'mmx.deleteMember', group: 'mmx-member' },
            );
        }

        if (onClass) {
            actions.push(
                { title: 'MMX: Add Method', cmd: 'mmx.addMethod', group: 'mmx-add' },
                { title: 'MMX: Add Field', cmd: 'mmx.addField', group: 'mmx-add' },
                { title: 'MMX: Add Property', cmd: 'mmx.addProperty', group: 'mmx-add' },
                { title: 'MMX: Add Constructor', cmd: 'mmx.addConstructor', group: 'mmx-add' },
            );
        } else {
            actions.push(
                { title: 'MMX: Add Method', cmd: 'mmx.addMethod', group: 'mmx-add' },
            );
        }

        actions.push(
            { title: 'MMX: Insert Template', cmd: 'mmx.insertTemplate', group: 'mmx-general' },
            { title: 'MMX: Sort Members', cmd: 'mmx.sortMembers', group: 'mmx-general' },
            { title: 'MMX: Synchronize Decl/Impl', cmd: 'mmx.synchronizeDeclImpl', group: 'mmx-general' },
        );

        if (!range.isEmpty) {
            actions.push(
                { title: 'MMX: Extract Method', cmd: 'mmx.extractMethod', group: 'mmx-general' },
            );
        }

        const groups = new Set(actions.map(a => a.group));
        const result: vscode.CodeAction[] = [];

        for (const group of groups) {
            const groupActions = actions.filter(a => a.group === group);
            for (const act of groupActions) {
                const action = new vscode.CodeAction(act.title, vscode.CodeActionKind.Refactor);
                action.command = { command: act.cmd, title: act.title };
                action.isPreferred = false;
                result.push(action);
            }
        }

        return result;
    }
}
