import * as vscode from 'vscode';
import { ProviderRegistry } from './ProviderRegistry';
import { LocalScopeAnalyzer } from '../services/LocalScopeAnalyzer';
import { ClassMember, MethodScope, ParsedDocument } from '../models/types';
import { resolveVariableAt } from '../services/VariableResolver';

interface MmxAction {
    title: string;
    cmd: string;
    group: string;
}

export class MmxCodeActionProvider implements vscode.CodeActionProvider {
    constructor(
        private providerRegistry: ProviderRegistry,
        private scopeAnalyzer: LocalScopeAnalyzer = new LocalScopeAnalyzer(),
    ) {}

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
        let memberKind: string | undefined;

        for (const cls of parsed.classes) {
            const hit = cls.members.find(m => m.range.contains(position) || m.implementationRange?.contains(position));
            if (hit) {
                onClass = true;
                onMember = true;
                memberKind = hit.kind;
                break;
            }
            if (cls.range.contains(position)) {
                onClass = true;
                break;
            }
        }

        if (!onMember) {
            for (const proc of parsed.standaloneProcedures) {
                if (proc.range.contains(position) || proc.implementationRange?.contains(position)) {
                    onMember = true;
                    memberKind = proc.kind;
                    break;
                }
            }
        }

        const actions: MmxAction[] = [];

        if (onMember) {
            actions.push(
                { title: 'CE: Edit Member', cmd: 'mmx.editMember', group: 'mmx-member' },
                { title: 'CE: Move Member', cmd: 'mmx.moveMember', group: 'mmx-member' },
            );
            if (memberKind === 'field') {
                actions.push(
                    { title: 'CE: Generate Getters/Setters', cmd: 'mmx.generateGettersSetters', group: 'mmx-member' },
                );
            }
            if (memberKind === 'field' || memberKind === 'property') {
                actions.push(
                    { title: 'CE: Create Local Variable', cmd: 'mmx.createLocalVariable', group: 'mmx-member' },
                );
            }
        }

        if (onClass) {
            actions.push(
                { title: 'CE: Add Method', cmd: 'mmx.addMethod', group: 'mmx-add' },
                { title: 'CE: Add Field', cmd: 'mmx.addField', group: 'mmx-add' },
                { title: 'CE: Add Property', cmd: 'mmx.addProperty', group: 'mmx-add' },
                { title: 'CE: Add Constructor', cmd: 'mmx.addConstructor', group: 'mmx-add' },
            );
        } else {
            actions.push(
                { title: 'CE: Add Method', cmd: 'mmx.addMethod', group: 'mmx-add' },
            );
        }

        actions.push(
            { title: 'CE: Insert Template', cmd: 'mmx.insertTemplate', group: 'mmx-general' },
        );
        // Synchronize only makes sense for languages with a split
        // declaration/implementation (Pascal unit, C++ header/source).
        if (provider.languageId === 'pascal' || provider.languageId === 'cpp') {
            actions.push(
                { title: 'CE: Synchronize Decl/Impl', cmd: 'mmx.synchronizeDeclImpl', group: 'mmx-general' },
            );
        }

        if (!range.isEmpty) {
            actions.push(
                { title: 'CE: Extract Method', cmd: 'mmx.extractMethod', group: 'mmx-general' },
            );
        }

        // The enclosing method (if any) is needed both for the unified variable
        // actions and for the local-variable actions below; compute it once.
        const enclosing = this.findEnclosingMember(parsed, position);

        // Analytics: surfaced at the document/class level so every language has
        // the same quick-access entry points from the lightbulb.
        actions.push(
            { title: 'CE: Code Review', cmd: 'ce.codeReview', group: 'mmx-analyze' },
            { title: 'CE: Detect Dead Code', cmd: 'ce.detectDeadCode', group: 'mmx-analyze' },
            { title: 'CE: Generate Documentation', cmd: 'ce.generateDocumentation', group: 'mmx-analyze' },
            { title: 'CE: Export Structure', cmd: 'ce.exportStructure', group: 'mmx-analyze' },
        );

        // Unified variable refactoring: rename / change type / delete. The
        // runtime resolver decides whether the cursor is on a local, a
        // parameter, a field or a property, so the same actions are surfaced
        // everywhere a variable can sit. This replaces the former per-kind
        // Rename/Delete Member and Rename/Change Local Type actions.
        // Only when the resolver actually finds a variable at the cursor —
        // these actions are no-ops on a bare method signature.
        const varRef = resolveVariableAt(document, provider, position);
        if (varRef) {
            actions.push(
                { title: 'CE: Rename Variable', cmd: 'mmx.renameVariable', group: 'mmx-var' },
                { title: 'CE: Change Variable Type', cmd: 'mmx.changeVariableType', group: 'mmx-var' },
                { title: 'CE: Delete Variable', cmd: 'mmx.deleteVariable', group: 'mmx-var' },
            );
        }

        // Declare a used-but-undeclared local (only inside a method body, when
        // an identifier is detected as undeclared). This is a creation action,
        // distinct from the rename/type/delete operations above.
        if (enclosing && enclosing.implementationRange?.contains(position)) {
            const scope = this.scopeAnalyzer.getScope(document, provider, enclosing);
            if (scope && this.isUndeclaredAt(document, position, scope)) {
                actions.push(
                    { title: 'CE: Declare Local Variable', cmd: 'mmx.declareLocalVariable', group: 'mmx-local' },
                );
            }
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

    private findEnclosingMember(parsed: ParsedDocument, position: vscode.Position): ClassMember | undefined {
        for (const cls of parsed.classes) {
            for (const member of cls.members) {
                if (member.range.contains(position) || member.implementationRange?.contains(position)) {
                    return member;
                }
            }
        }
        for (const proc of parsed.standaloneProcedures) {
            if (proc.range.contains(position) || proc.implementationRange?.contains(position)) {
                return proc;
            }
        }
        return undefined;
    }

    /**
     * True when the identifier at `position` looks undeclared: either a LSP
     * undefined-name diagnostic exists there, or (heuristic) the word is not a
     * known local/param. The diagnostic path is authoritative when a language
     * server is active.
     */
    private isUndeclaredAt(document: vscode.TextDocument, position: vscode.Position, scope: MethodScope): boolean {
        const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]\w*/);
        if (!wordRange) return false;
        const word = document.getText(wordRange);
        if (!word) return false;
        // Already declared as a local/param => not undeclared.
        if (scope.locals.some(l => l.name === word)) return false;
        // LSP undefined-name diagnostics => undeclared.
        const diags = vscode.languages.getDiagnostics(document.uri);
        const hasUndef = diags.some(d =>
            d.range.contains(position) &&
            /\b(undefined|undeclared|cannot find|not defined|unknown identifier)\b/i.test(d.message)
        );
        if (hasUndef) return true;
        // Heuristic fallback: an identifier-looking word on a line with an
        // assignment operator is a likely undeclared local being assigned.
        const lineText = document.lineAt(position.line).text;
        return /[:=]/.test(lineText) && /[A-Za-z_]\w*\s*[:=]/.test(lineText);
    }
}
