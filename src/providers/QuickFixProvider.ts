import * as vscode from 'vscode';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { MemberKind } from '../models/types';

export class QuickFixProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

    constructor(private registry: ProviderRegistry) {}

    provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.ProviderResult<vscode.CodeAction[]> {
        const provider = this.registry.getByDocument(document);
        if (!provider) return [];

        const actions: vscode.CodeAction[] = [];
        const parsed = this.registry.parse(document) ?? provider.parseDocument(document);

        for (const cls of parsed.classes) {
            for (const member of cls.members) {
                if (!member.range.contains(range)) continue;

                const lineText = document.lineAt(member.range.start.line).text;

                // "Generate body" only when the member is actually a stub —
                // never on an already implemented method.
                if (member.kind === MemberKind.Method) {
                    const bodyText = member.implementationRange
                        ? document.getText(member.implementationRange)
                        : lineText;
                    const isStub = /TODO|todo!\(\)|NotImplemented/.test(bodyText)
                        || (bodyText.includes('{') && bodyText.includes('}'));
                    if (isStub && lineText.includes('{') && lineText.includes('}')) {
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(
                            document.uri,
                            member.range,
                            lineText.replace('{}', '{\n  // TODO: implement\n}')
                        );
                        actions.push({
                            title: 'Generate method body',
                            kind: vscode.CodeActionKind.QuickFix,
                            edit,
                        });
                    } else if (isStub && provider.synchronizeDeclarationImplementation !== undefined) {
                        // Pascal-style split declaration/implementation: offer
                        // to create the missing implementation block.
                        const hasImpl = cls.members.some(m =>
                            m.name === member.name && m.implementationRange && m !== member);
                        if (!hasImpl) {
                            actions.push({
                                title: 'Synchronize Declaration/Implementation',
                                kind: vscode.CodeActionKind.QuickFix,
                                command: {
                                    command: 'ce.synchronizeDeclImpl',
                                    title: 'Synchronize Declaration/Implementation',
                                    arguments: [],
                                },
                            });
                        }
                    }
                }

                if (member.kind === MemberKind.Field) {
                    const hasAccessor = cls.members.some(m =>
                        m.name.toLowerCase() === member.name.toLowerCase() && m.kind === MemberKind.Property
                    );
                    if (!hasAccessor) {
                        actions.push({
                            title: 'Generate getter/setter',
                            kind: vscode.CodeActionKind.QuickFix,
                            command: {
                                command: 'ce.generateGettersSetters',
                                title: 'Generate Getters/Setters',
                                arguments: [],
                            },
                        });
                    }
                }
            }
        }

        return actions;
    }
}
