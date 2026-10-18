import * as vscode from 'vscode';
import { ProviderRegistry } from './providers/ProviderRegistry';
import { CodeExplorerService, CodeExplorerTreeItem } from './services/CodeExplorerService';
import { CodeGeneratorService } from './services/CodeGeneratorService';
import { MemberViewerPanel } from './webview/MemberViewerPanel';
import { ClassInfo, ClassMember, MemberKind, Visibility, PropertySpec, GeneratedCode, MemberFormResult, ExtractSpec, LocalVariable } from './models/types';
import { memberFormToSpec, generateFromSpec } from './services/memberForm';
import { LocalScopeAnalyzer } from './services/LocalScopeAnalyzer';
import { renameLocal, declareUndeclaredVariable, changeLocalType } from './services/LocalRefactorService';
import { ILanguageProvider } from './providers/ILanguageProvider';
import { Template } from './models/Template';
import { TemplateService } from './services/TemplateService';
import { TemplateStore } from './services/TemplateStore';
import { TemplateCompletionProvider } from './providers/TemplateCompletionProvider';
import { TemplateManagerPanel } from './webview/TemplateManagerPanel';
import { TemplateSidebarPanel } from './webview/TemplateSidebarPanel';
import { MmxCodeActionProvider } from './providers/MmxCodeActionProvider';
import { MmxCodeLensProvider } from './services/CodeLensProvider';
import { MemberDragAndDropController } from './services/DragAndDropController';
import * as ops from './services/MemberOperations';
import { EditPipeline } from './services/EditPipeline';
import { registerSafePreview } from './services/SafePreview';
import { QuickFixProvider } from './providers/QuickFixProvider';
import { resolveVariableAt } from './services/VariableResolver';
import { VariableRefactorService } from './services/VariableRefactorService';
import { WorkspaceIndex } from './services/WorkspaceIndex';
import { batchMove, batchGenerateGettersSetters, buildMoveTargetCode } from './services/BatchOperations';

let providerRegistry: ProviderRegistry;
let codeExplorer: CodeExplorerService;
let codeGenerator: CodeGeneratorService;
let templateService: TemplateService;
let templateStore: TemplateStore;
let memberViewer: MemberViewerPanel;
let localScopeAnalyzer: LocalScopeAnalyzer;
let variableRefactor: VariableRefactorService;
let log: vscode.OutputChannel;
let workspaceIndex: WorkspaceIndex;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const outputChannel = vscode.window.createOutputChannel('Code Explorer');
    outputChannel.appendLine('Code Explorer: activating...');
    log = outputChannel;
    context.subscriptions.push(outputChannel);
        ops.setLogChannel(outputChannel);

        registerSafePreview(context);

    try {
        providerRegistry = new ProviderRegistry();
        codeExplorer = new CodeExplorerService();
        codeGenerator = new CodeGeneratorService();
        variableRefactor = new VariableRefactorService(codeGenerator, codeExplorer);
        workspaceIndex = new WorkspaceIndex(providerRegistry);
        context.subscriptions.push(workspaceIndex);
        ops.setWorkspaceIndex(workspaceIndex);

        templateService = new TemplateService(context);
        await templateService.load();
        templateService.startWatching();
        context.subscriptions.push(templateService);

        const templateStoreLocal = new TemplateStore(context);
        templateStore = templateStoreLocal;

        outputChannel.appendLine('Providers: ' + providerRegistry.getAllProviders().map(p => p.displayName).join(', '));

        for (const provider of providerRegistry.getAllProviders()) {
            codeExplorer.registerProvider(provider);
            codeGenerator.registerProvider(provider);
        }

        const completionProvider = new TemplateCompletionProvider(templateService, providerRegistry);
        const templateSelectors: vscode.DocumentFilter[] = [];
        for (const ext of providerRegistry.getSupportedExtensions()) {
            templateSelectors.push({ scheme: 'file', pattern: '**/*' + ext });
        }
        context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(templateSelectors, completionProvider),
        );

        localScopeAnalyzer = new LocalScopeAnalyzer();
        const codeActionProvider = new MmxCodeActionProvider(providerRegistry, localScopeAnalyzer);
        const codeActionSelectors: vscode.DocumentFilter[] = [];
        for (const ext of providerRegistry.getSupportedExtensions()) {
            codeActionSelectors.push({ scheme: 'file', pattern: '**/*' + ext });
        }
        context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider(codeActionSelectors, codeActionProvider, {
                providedCodeActionKinds: [vscode.CodeActionKind.Refactor],
            }),
        );

        const quickFixProvider = new QuickFixProvider(providerRegistry);
        const quickFixSelectors: vscode.DocumentFilter[] = [];
        for (const ext of providerRegistry.getSupportedExtensions()) {
            quickFixSelectors.push({ scheme: 'file', pattern: '**/*' + ext });
        }
        context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider(quickFixSelectors, quickFixProvider, {
                providedCodeActionKinds: QuickFixProvider.providedCodeActionKinds,
            }),
        );

        vscode.commands.executeCommand('setContext', 'mmx:isActive', true);

        const dragDropController = new MemberDragAndDropController(() => codeExplorer.refresh());
        const classesTree = vscode.window.createTreeView('mmxCodeExplorer', {
            treeDataProvider: codeExplorer,
            showCollapseAll: true,
            dragAndDropController: dragDropController,
        });

        const codeLensProvider = new MmxCodeLensProvider(providerRegistry);
        const codeLensSelectors: vscode.DocumentFilter[] = [];
        for (const ext of providerRegistry.getSupportedExtensions()) {
            codeLensSelectors.push({ scheme: 'file', pattern: '**/*' + ext });
        }
        const codeLensRegistration = vscode.languages.registerCodeLensProvider(
            codeLensSelectors,
            codeLensProvider
        );
        context.subscriptions.push(codeLensRegistration);

        context.subscriptions.push(classesTree);

        memberViewer = new MemberViewerPanel(context.extensionUri, providerRegistry, codeExplorer, codeGenerator, context);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(MemberViewerPanel.viewType, memberViewer)
        );

        const templateSidebar = new TemplateSidebarPanel(
            context.extensionUri,
            templateStore,
            templateService,
            providerRegistry.getAllProviders().map(p => p.languageId),
        );
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(TemplateSidebarPanel.viewType, templateSidebar)
        );

        registerCommands(context);

        if (vscode.window.activeTextEditor) {
            codeExplorer.refresh();
        }

        outputChannel.appendLine('Code Explorer: activated successfully');
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const stack = e instanceof Error && e.stack ? e.stack : '';
        console.error('[MMX] FATAL:', msg, stack);
        outputChannel.appendLine('FATAL: ' + msg);
        outputChannel.appendLine(stack);
        vscode.window.showErrorMessage('Code Explorer failed: ' + msg);
    }
}

function registerCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(

        vscode.commands.registerCommand('mmx.refreshExplorer', () => {
            codeExplorer.refresh();
        }),

        vscode.commands.registerCommand('mmx.navigateToMember', async (position: vscode.Position) => {
            const editor = vscode.window.activeTextEditor;
            if (editor && position) {
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(
                    new vscode.Range(position, position),
                    vscode.TextEditorRevealType.InCenter
                );
            }
        }),

        vscode.commands.registerCommand('mmx.addMethod', async (item?: CodeExplorerTreeItem) => {
            await addMember(MemberKind.Method, item);
        }),

        vscode.commands.registerCommand('mmx.addField', async (item?: CodeExplorerTreeItem) => {
            await addMember(MemberKind.Field, item);
        }),

        vscode.commands.registerCommand('mmx.addProperty', async (item?: CodeExplorerTreeItem) => {
            await addMember(MemberKind.Property, item);
        }),

        vscode.commands.registerCommand('mmx.addConstructor', async (item?: CodeExplorerTreeItem) => {
            await addMember(MemberKind.Constructor, item);
        }),

        vscode.commands.registerCommand('mmx.editMember', async (item?: CodeExplorerTreeItem) => {
            const resolved = resolveFromItemOrCursor(item);
            if (!resolved) {
                vscode.window.showWarningMessage('Place cursor on a class member first.');
                return;
            }
            const result = await memberViewer.beginSession({
                mode: 'edit', member: resolved.member, classInfo: resolved.cls,
                provider: resolved.provider, document: resolved.doc,
            });
            if (!result) { return; }
            await ops.editMember(resolved.doc, resolved.provider, resolved.cls, resolved.member, codeGenerator, codeExplorer, result as MemberFormResult);
        }),

        vscode.commands.registerCommand('mmx.deleteMember', async (item?: CodeExplorerTreeItem) => {
            const resolved = resolveFromItemOrCursor(item);
            if (!resolved) {
                vscode.window.showWarningMessage('Place cursor on a class member first.');
                return;
            }
            await ops.deleteMember(resolved.doc, resolved.cls, resolved.member, codeGenerator, codeExplorer);
        }),

        vscode.commands.registerCommand('mmx.moveMember', async (item?: CodeExplorerTreeItem) => {
            if (!item || !('kind' in item.itemData)) {
                vscode.window.showWarningMessage('Select a member in the explorer to move.');
                return;
            }
            const member = item.itemData as ClassMember;
            const sourceClass = item.parentClass;
            if (!sourceClass) {
                vscode.window.showWarningMessage('Move Member requires a class member from the explorer.');
                return;
            }

            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor.');
                return;
            }
            const doc = editor.document;
            const provider = providerRegistry.getByDocument(doc);
            if (!provider) {
                vscode.window.showWarningMessage('No language provider for this file type.');
                return;
            }

            const parsed = provider.parseDocument(doc);
            const destinations = parsed.classes.filter(c => c.name !== sourceClass.name);
            if (destinations.length === 0) {
                vscode.window.showWarningMessage('No other classes to move to.');
                return;
            }

            const destItems = destinations.map(c => {
                const typeLabel = c.classType ? ` (${c.classType})` : (c.isInterface ? ' (interface)' : c.isRecord ? ' (record)' : '');
                return { label: c.name + typeLabel, className: c.name };
            });
            const picked = await vscode.window.showQuickPick(
                destItems.map(d => d.label),
                { placeHolder: `Move "${member.name}" to which class?` }
            );
            if (!picked) return;
            const pickedItem = destItems.find(d => d.label === picked);
            if (!pickedItem) return;
            const destName = pickedItem.className;

            const confirm = await vscode.window.showWarningMessage(
                `Move "${member.name}" from ${sourceClass.name} to ${destName}?`,
                { modal: true },
                'Move'
            );
            if (confirm !== 'Move') return;

            const destClass = parsed.classes.find(c => c.name === destName);
            if (!destClass) {
                vscode.window.showErrorMessage('CE: Destination class not found.');
                return;
            }
            const gen = buildMoveTargetCode(provider, member, destClass);
            if (!gen) {
                vscode.window.showWarningMessage(`CE: Moving a ${member.kind} is not supported.`);
                return;
            }

            // Delete from source + insert into destination are queued on one
            // pipeline in original document coordinates and committed as a
            // single WorkspaceEdit — cancelling the preview can never leave
            // the member deleted from the source class.
            const pipeline = new EditPipeline();
            await codeGenerator.planMemberDeletion(doc, member, pipeline);
            await ops.queueGeneratedCode(doc, provider, gen, pipeline);

            const applied = await pipeline.apply(`Move "${member.name}" to ${destName}`);
            codeExplorer.refresh();
            if (applied) {
                vscode.window.showInformationMessage(`Moved "${member.name}" from ${sourceClass.name} to ${destClass.name}`);
            } else {
                vscode.window.showErrorMessage(`CE: Move of "${member.name}" cancelled or failed — nothing changed.`);
            }
        }),

        vscode.commands.registerCommand('mmx.renameMember', async (item?: CodeExplorerTreeItem) => {
            const resolved = resolveFromItemOrCursor(item);
            if (!resolved) {
                vscode.window.showWarningMessage('Place cursor on a class member first.');
                return;
            }
            const result = await memberViewer.beginSession({
                mode: 'edit', renameOnly: true, member: resolved.member, classInfo: resolved.cls,
                provider: resolved.provider, document: resolved.doc,
            }) as MemberFormResult | undefined;
            if (!result || !result.name) { return; }
            await ops.renameMember(resolved.doc, resolved.cls, resolved.member, resolved.provider, codeExplorer, result.name);
        }),

        vscode.commands.registerCommand('mmx.createLocalVariable', async (item?: CodeExplorerTreeItem) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('Open a file and place the cursor where the local should be inserted.');
                return;
            }
            const resolved = resolveFromItemOrCursor(item);
            if (!resolved) {
                vscode.window.showWarningMessage('Select or place the cursor on a field to derive a local variable from.');
                return;
            }
            if (resolved.member.kind !== MemberKind.Field && resolved.member.kind !== MemberKind.Property) {
                vscode.window.showWarningMessage('Create local variable works on a field or property.');
                return;
            }
            await ops.createLocalVariable(resolved.doc, resolved.provider, resolved.member, editor, localScopeAnalyzer);
        }),

        // Resolves the enclosing method + cursor position for local-variable ops.
        vscode.commands.registerCommand('mmx.renameLocalVariable', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { vscode.window.showWarningMessage('Place the cursor on a local variable inside a method.'); return; }
            const doc = editor.document;
            const provider = providerRegistry.getByDocument(doc);
            if (!provider) { return; }
            const parsed = provider.parseDocument(doc);
            const pos = editor.selection.active;
            const member = findEnclosingLocalMember(parsed, pos);
            if (!member) { vscode.window.showWarningMessage('Place the cursor inside a method body.'); return; }
            const scope = localScopeAnalyzer.getScope(doc, provider, member);
            if (!scope) { vscode.window.showWarningMessage('Could not analyze locals here.'); return; }
            const local = scope.locals.find((l: LocalVariable) => l.range.contains(pos));
            if (!local) { vscode.window.showWarningMessage('Place the cursor on a declared local variable.'); return; }
            const newName = await vscode.window.showInputBox({ prompt: 'New name', value: local.name });
            if (!newName) { return; }
            await renameLocal(doc, scope, local, newName);
        }),

        vscode.commands.registerCommand('mmx.changeLocalType', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { vscode.window.showWarningMessage('Place the cursor on a local variable inside a method.'); return; }
            const doc = editor.document;
            const provider = providerRegistry.getByDocument(doc);
            if (!provider) { return; }
            const parsed = provider.parseDocument(doc);
            const pos = editor.selection.active;
            const member = findEnclosingLocalMember(parsed, pos);
            if (!member) { vscode.window.showWarningMessage('Place the cursor inside a method body.'); return; }
            const scope = localScopeAnalyzer.getScope(doc, provider, member);
            if (!scope) { vscode.window.showWarningMessage('Could not analyze locals here.'); return; }
            const local = scope.locals.find((l: LocalVariable) => l.range.contains(pos));
            if (!local) { vscode.window.showWarningMessage('Place the cursor on a declared local variable.'); return; }
            await changeLocalType(doc, local);
        }),

        vscode.commands.registerCommand('mmx.declareLocalVariable', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { vscode.window.showWarningMessage('Place the cursor on the undeclared variable to declare.'); return; }
            const doc = editor.document;
            const provider = providerRegistry.getByDocument(doc);
            if (!provider) { return; }
            const parsed = provider.parseDocument(doc);
            const pos = editor.selection.active;
            const member = findEnclosingLocalMember(parsed, pos);
            if (!member) { vscode.window.showWarningMessage('Place the cursor inside a method body.'); return; }
            const scope = localScopeAnalyzer.getScope(doc, provider, member);
            if (!scope) { vscode.window.showWarningMessage('Could not analyze locals here.'); return; }
            await declareUndeclaredVariable(doc, provider, scope, pos);
        }),

        // --- Unified variable refactoring (works on locals, params, fields, properties) ---
        vscode.commands.registerCommand('mmx.renameVariable', async () => {
            const editor = vscode.window.activeTextEditor;
            const ref = resolveVariableFromCursor();
            if (!ref) { vscode.window.showWarningMessage('CE: Place the cursor on a variable to rename.'); return; }
            const newName = await vscode.window.showInputBox({ prompt: 'New name', value: ref.name });
            if (!newName) { return; }
            const provider = providerRegistry.getByDocument(ref.document);
            await variableRefactor.rename(ref, provider, newName, editor?.selection.active);
        }),

        vscode.commands.registerCommand('mmx.changeVariableType', async () => {
            const ref = resolveVariableFromCursor();
            if (!ref) { vscode.window.showWarningMessage('CE: Place the cursor on a typed variable.'); return; }
            const newType = await vscode.window.showInputBox({ prompt: 'New type', value: ref.type || '' });
            if (newType === undefined) { return; }
            await variableRefactor.changeType(ref, newType);
        }),

        vscode.commands.registerCommand('mmx.deleteVariable', async () => {
            const editor = vscode.window.activeTextEditor;
            const ref = resolveVariableFromCursor();
            if (!ref) { vscode.window.showWarningMessage('CE: Place the cursor on a variable to delete.'); return; }
            const provider = providerRegistry.getByDocument(ref.document);
            await variableRefactor.remove(ref, provider, editor?.selection.active);
        }),

        vscode.commands.registerCommand('mmx.synchronizeDeclImpl', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const provider = providerRegistry.getByDocument(editor.document);
            if (!provider) {
                vscode.window.showWarningMessage('No language provider for this file type.');
                return;
            }

            const parsed = provider.parseDocument(editor.document);
            if (parsed.classes.length === 0) {
                vscode.window.showInformationMessage('No classes found in the current document.');
                return;
            }

            let totalSynced = 0;
            for (const cls of parsed.classes) {
                const count = await codeGenerator.synchronizeAllMembers(editor.document, cls);
                totalSynced += count;
            }

            if (totalSynced > 0) {
                codeExplorer.refresh();
                vscode.window.showInformationMessage(`Synchronized ${totalSynced} member(s).`);
            } else {
                vscode.window.showInformationMessage('All members are already synchronized.');
            }
        }),

        vscode.commands.registerCommand('mmx.extractMethod', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.selection.isEmpty) {
                vscode.window.showWarningMessage('Select code to extract into a method.');
                return;
            }

            const provider = providerRegistry.getByDocument(editor.document);
            if (!provider) {
                vscode.window.showWarningMessage('No language provider for this file type.');
                return;
            }

            const result = await memberViewer.beginSession({
                mode: 'extract', provider, document: editor.document, selection: editor.selection,
            });
            if (!result) { return; }
            const spec = result as ExtractSpec;
            const params = spec.parameters.map(p => `${p.name}:${p.type}`);
            const ok = await codeGenerator.extractMethod(
                editor.document,
                editor.selection,
                spec.name,
                params,
                spec.returnType || (provider.languageId === 'pascal' ? '' : 'void')
            );
            if (!ok) {
                vscode.window.showWarningMessage('CE: Could not extract method for this language.');
            }
        }),

        vscode.commands.registerCommand('mmx.manageMembers', async () => {
            await memberViewer.showManageTab();
        }),

        // Code-lens entry point: put the cursor on the lens's member first, so
        // the cursor-based commands act on the member the user clicked.
        vscode.commands.registerCommand('mmx.lensRun', async (cmd: string, line: number) => {
            if (!['mmx.manageMembers', 'mmx.editMember', 'mmx.deleteMember'].includes(cmd)) { return; }
            const editor = vscode.window.activeTextEditor;
            if (editor && typeof line === 'number') {
                const pos = new vscode.Position(line, 0);
                editor.selection = new vscode.Selection(pos, pos);
            }
            await vscode.commands.executeCommand(cmd);
        }),

        vscode.commands.registerCommand('mmx.openMemberEditor', async (item?: CodeExplorerTreeItem) => {
            await addMember(MemberKind.Method, item);
        }),

        vscode.commands.registerCommand('mmx.showActions', async () => {
            // Filter provider-unsupported actions out of the quick pick.
            const activeDoc = vscode.window.activeTextEditor?.document;
            const activeProv = activeDoc ? providerRegistry.getByDocument(activeDoc) : undefined;
            const stubsSupported = activeProv ? activeProv.supportsMissingStubs() : true;
            const actions = [
                { label: '$(symbol-method) Add Method', description: '', cmd: 'mmx.addMethod' },
                { label: '$(symbol-field) Add Field', description: '', cmd: 'mmx.addField' },
                { label: '$(symbol-property) Add Property', description: '', cmd: 'mmx.addProperty' },
                { label: '$(symbol-constructor) Add Constructor', description: '', cmd: 'mmx.addConstructor' },
                { label: '$(edit) Edit Member', description: '', cmd: 'mmx.editMember' },
                { label: '$(edit) Rename Variable', description: 'local / field / property', cmd: 'mmx.renameVariable' },
                { label: '$(symbol-type-parameter) Change Variable Type', description: '', cmd: 'mmx.changeVariableType' },
                { label: '$(trash) Delete Variable', description: '', cmd: 'mmx.deleteVariable' },
                { label: '$(fold) Extract Method', description: '', cmd: 'mmx.extractMethod' },
                { label: '$(code) Insert Template', description: '', cmd: 'mmx.insertTemplate' },
                { label: '$(sync) Synchronize Decl/Impl', description: '', cmd: 'mmx.synchronizeDeclImpl' },
                ...(stubsSupported ? [{ label: '$(symbol-interface) Implement Interface', description: '', cmd: 'mmx.implementInterface' }] : []),
                { label: '$(symbol-property) Generate Getters/Setters', description: '', cmd: 'mmx.generateGettersSetters' },
                { label: '$(filter) Filter Members', description: '', cmd: 'mmx.filterTree' },
                { label: '$(go-to-file) Go to Member', description: '', cmd: 'mmx.goToMember' },
                { label: '$(search) Go to Member in Workspace', description: '', cmd: 'mmx.goToWorkspaceMember' },
                { label: '$(list-tree) Add / Delete Members', description: '', cmd: 'mmx.manageMembers' },
                { label: '$(group-by-ref-type) Toggle Grouping', description: '', cmd: 'mmx.toggleGroupBy' },
                { label: '$(refresh) Refresh Explorer', description: '', cmd: 'mmx.refreshExplorer' },
            ];
            const picked = await vscode.window.showQuickPick(actions, {
                placeHolder: 'CE Actions — select an action',
            });
            if (picked) {
                await vscode.commands.executeCommand(picked.cmd);
            }
        }),

        vscode.commands.registerCommand('mmx.insertTemplate', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor.');
                return;
            }
            const languageId = providerRegistry.getByDocument(editor.document)?.languageId ?? editor.document.languageId;
            const templates = templateService.getForLanguage(languageId);
            if (templates.length === 0) {
                vscode.window.showInformationMessage('No CE templates available for language: ' + languageId);
                return;
            }
            const items: { label: string; description: string; detail: string; template: Template }[] = templates.map(t => ({
                label: t.name,
                description: t.prefix ? `(${t.prefix})` : '',
                detail: t.description || '',
                template: t,
            }));
            const picked = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a template to insert',
            });
            if (!picked) return;
            await editor.insertSnippet(new vscode.SnippetString(picked.template.body));
        }),

        vscode.commands.registerCommand('mmx.manageTemplates', async () => {
            await TemplateManagerPanel.createOrShow(context.extensionUri, templateStore);
        }),

        vscode.commands.registerCommand('mmx.implementInterface', async (item?: CodeExplorerTreeItem) => {
            let doc: vscode.TextDocument | undefined;
            let prov: ILanguageProvider | undefined;
            let cls: ClassInfo | undefined;

            if (item && 'members' in item.itemData) {
                cls = item.itemData as ClassInfo;
                const editor = vscode.window.activeTextEditor;
                doc = editor?.document;
                prov = doc ? providerRegistry.getByDocument(doc) : undefined;
            }

            if (!cls || !doc || !prov) {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor.');
                    return;
                }
                doc = editor.document;
                prov = providerRegistry.getByDocument(doc);
                if (!prov) {
                    vscode.window.showWarningMessage('No language provider for this file type.');
                    return;
                }
                const parsed = prov.parseDocument(doc);
                const pos = editor.selection.active;
                cls = prov.findClassAtPosition(doc, pos)
                    ?? parsed.classes.find(c => c.range.contains(pos))
                    ?? parsed.classes[0];
            }

            if (!cls) {
                vscode.window.showInformationMessage('No class found to implement.');
                return;
            }

            if (!prov.supportsMissingStubs()) {
                vscode.window.showInformationMessage(`CE: Interface implementation is not supported for ${prov.displayName}.`);
                return;
            }

            await ops.implementInterface(doc, prov, cls, codeExplorer);
        }),

        vscode.commands.registerCommand('mmx.generateGettersSetters', async (item?: CodeExplorerTreeItem) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor.');
                return;
            }
            const doc = editor.document;
            const provider = providerRegistry.getByDocument(doc);
            if (!provider) {
                vscode.window.showWarningMessage('No language provider for this file type.');
                return;
            }

            interface FieldTarget { cls: ClassInfo; field: ClassMember; }
            let targets: FieldTarget[] = [];

            if (item && 'kind' in item.itemData) {
                const member = item.itemData as ClassMember;
                if (member.kind === MemberKind.Field && item.parentClass) {
                    targets.push({ cls: item.parentClass, field: member });
                }
            }

            if (targets.length === 0) {
                const parsed = provider.parseDocument(doc);
                if (parsed.classes.length === 0) {
                    vscode.window.showInformationMessage('No classes found in the current document.');
                    return;
                }

                const items: (vscode.QuickPickItem & { target: FieldTarget })[] = [];
                for (const cls of parsed.classes) {
                    for (const m of cls.members) {
                        if (m.kind === MemberKind.Field) {
                            items.push({
                                label: m.name,
                                description: m.type ? ': ' + m.type : '',
                                detail: cls.name,
                                picked: true,
                                target: { cls, field: m },
                            });
                        }
                    }
                }

                if (items.length === 0) {
                    vscode.window.showInformationMessage('No fields found in the current document.');
                    return;
                }

                const picked = await vscode.window.showQuickPick(items, {
                    canPickMany: true,
                    title: 'CE: Generate Getters/Setters',
                    placeHolder: 'Select fields to generate accessors for',
                });
                if (!picked || picked.length === 0) {
                    return;
                }
                targets = picked.map(p => p.target);
            }

            const modeItems = [
                { label: 'Getter and Setter', mode: 'both' as const },
                { label: 'Getter only', mode: 'getter' as const },
                { label: 'Setter only', mode: 'setter' as const },
            ];
            const modePicked = await vscode.window.showQuickPick(modeItems, {
                title: 'CE: Generate Getters/Setters',
                placeHolder: 'What should be generated?',
            });
            if (!modePicked) {
                return;
            }
            const hasGetter = modePicked.mode !== 'setter';
            const hasSetter = modePicked.mode !== 'getter';

            const capitalizeLangs = ['java', 'csharp', 'typescript', 'javascript', 'javascriptreact'];
            const buildPropertyName = (raw: string): string => {
                if (capitalizeLangs.includes(provider.languageId)) {
                    const stripped = raw.replace(/^_+/, '');
                    if (!stripped) {
                        return raw;
                    }
                    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
                }
                return raw;
            };

            const byClass = new Map<string, FieldTarget[]>();
            for (const t of targets) {
                const arr = byClass.get(t.cls.name) ?? [];
                arr.push(t);
                byClass.set(t.cls.name, arr);
            }

            let totalGenerated = 0;
            for (const [className, fieldTargets] of byClass) {
                const parts: string[] = [];
                let cls: ClassInfo | undefined;
                for (const t of fieldTargets) {
                    cls = t.cls;
                    const spec: PropertySpec = {
                        kind: MemberKind.Property,
                        name: buildPropertyName(t.field.name),
                        type: t.field.type || provider.getTypeDefaults().defaultPropertyType,
                        visibility: Visibility.Public,
                        hasGetter,
                        hasSetter,
                        isDefault: false,
                        isReadOnly: !hasSetter,
                    };
                    const gen = provider.generateProperty(className, spec, t.cls);
                    if (gen.declaration) {
                        parts.push(gen.declaration.replace(/\n$/, ''));
                        totalGenerated++;
                    }
                }
                if (parts.length === 0 || !cls) {
                    continue;
                }

                const insertPos = provider.getInsertPosition(doc, cls, 'property').declaration;
                const combined: GeneratedCode = {
                    declaration: '\n' + parts.join('\n') + '\n',
                    implementation: '',
                    declarationPosition: insertPos,
                    implementationPosition: insertPos,
                };
                const success = await ops.applyGeneratedCode(doc, provider, combined);
                if (!success) {
                    log.appendLine('  [generateGettersSetters] applyGeneratedCode returned false — aborting');
                    return;
                }
            }

            if (totalGenerated > 0) {
                codeExplorer.refresh();
                vscode.window.showInformationMessage('CE: Generated ' + totalGenerated + ' accessor(s).');
            } else {
                vscode.window.showInformationMessage('CE: No accessors were generated.');
            }
        }),

        vscode.commands.registerCommand('mmx.filterTree', async () => {
            const value = await vscode.window.showInputBox({
                title: 'CE: Filter Members',
                prompt: 'Filter the explorer by name (regex supported). Empty clears the filter.',
                value: codeExplorer.getFilter(),
                placeHolder: 'e.g. get|set',
            });
            if (value === undefined) {
                return;
            }
            codeExplorer.setFilter(value);
        }),

        vscode.commands.registerCommand('mmx.clearFilter', () => {
            codeExplorer.setFilter('');
        }),

        vscode.commands.registerCommand('mmx.toggleGroupBy', () => {
            const mode = codeExplorer.cycleGroupBy();
            const label = mode === 'visibility' ? 'Visibility' : mode === 'kind' ? 'Member kind' : 'Alphabetical';
            vscode.window.showInformationMessage('CE: Grouping by ' + label);
        }),

        vscode.commands.registerCommand('mmx.goToWorkspaceMember', async () => {
            await workspaceIndex.ensureBuilt();
            const symbols = workspaceIndex.allSymbols();
            if (symbols.length === 0) {
                vscode.window.showInformationMessage('CE: No symbols found in the workspace.');
                return;
            }
            const items = symbols.map(s => ({
                label: s.name,
                description: s.container ? `${s.container} • ${s.kind}` : s.kind,
                detail: vscode.workspace.asRelativePath(s.uri),
                symbol: s,
            }));
            const picked = await vscode.window.showQuickPick(items, {
                placeHolder: 'Go to member in workspace…',
                matchOnDescription: true,
                matchOnDetail: true,
            });
            if (!picked) { return; }
            const pos = new vscode.Position(picked.symbol.line, 0);
            await vscode.window.showTextDocument(picked.symbol.uri, { selection: new vscode.Range(pos, pos) });
        }),

        vscode.commands.registerCommand('mmx.goToMember', async () => {
            const symbols = codeExplorer.listAllSymbols();
            if (symbols.length === 0) {
                vscode.window.showInformationMessage('No symbols found in the active document.');
                return;
            }
            const items = symbols.map(s => ({
                label: s.label,
                description: s.description,
                memberKind: s.kind,
                position: s.position,
            }));
            const picked = await vscode.window.showQuickPick(items, {
                placeHolder: 'Go to member…',
                matchOnDescription: true,
            });
            if (!picked) {
                return;
            }
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.selection = new vscode.Selection(picked.position, picked.position);
                editor.revealRange(new vscode.Range(picked.position, picked.position), vscode.TextEditorRevealType.InCenter);
            }
        }),

        vscode.commands.registerCommand('mmx.insertDocHeader', async (item?: CodeExplorerTreeItem) => {
            const resolved = resolveFromItemOrCursor(item);
            if (!resolved) {
                vscode.window.showWarningMessage('Place cursor on a class member first.');
                return;
            }
            await ops.insertDocHeader(resolved.doc, resolved.provider, resolved.cls, resolved.member);
        }),

        vscode.commands.registerCommand('ce.detectDeadCode', async () => {
            // Centralized into the Member viewer (inline analytics) per feedback.
            await memberViewer.handleRunAnalytics('deadcode');
            vscode.commands.executeCommand('mmxViewer.focus');
        }),

        vscode.commands.registerCommand('ce.batchMove', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { vscode.window.showWarningMessage('No active editor.'); return; }
            const doc = editor.document;
            const provider = providerRegistry.getByDocument(doc);
            if (!provider) { vscode.window.showWarningMessage('No provider for this file type.'); return; }

            const parsed = provider.parseDocument(doc);
            interface PickItem extends vscode.QuickPickItem { member: ClassMember; cls: ClassInfo; }
            const pickItems: PickItem[] = [];
            for (const cls of parsed.classes) {
                for (const m of cls.members) {
                    pickItems.push({
                        label: m.name,
                        description: `${cls.name} • ${m.kind}`,
                        member: m,
                        cls,
                    });
                }
            }
            if (pickItems.length === 0) {
                vscode.window.showInformationMessage('No members found in the current file.');
                return;
            }
            const selected = await vscode.window.showQuickPick(pickItems, {
                canPickMany: true,
                title: 'CE: Batch Move — Select members to move',
                placeHolder: 'Select one or more members',
            });
            if (!selected || selected.length === 0) { return; }

            const treeItems = selected.map(s => new CodeExplorerTreeItem(s.member, s.cls, provider));
            await batchMove(treeItems, providerRegistry, codeGenerator, codeExplorer);
        }),

        vscode.commands.registerCommand('ce.batchGenerateGettersSetters', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { vscode.window.showWarningMessage('No active editor.'); return; }
            const doc = editor.document;
            const provider = providerRegistry.getByDocument(doc);
            if (!provider) { vscode.window.showWarningMessage('No provider for this file type.'); return; }

            const parsed = provider.parseDocument(doc);
            interface PickItem extends vscode.QuickPickItem { member: ClassMember; cls: ClassInfo; }
            const pickItems: PickItem[] = [];
            for (const cls of parsed.classes) {
                for (const m of cls.members) {
                    if (m.kind !== MemberKind.Field) { continue; }
                    pickItems.push({
                        label: m.name,
                        description: `${cls.name} • ${m.type || 'unknown'}`,
                        member: m,
                        cls,
                    });
                }
            }
            if (pickItems.length === 0) {
                vscode.window.showInformationMessage('No fields found in the current file.');
                return;
            }
            const selected = await vscode.window.showQuickPick(pickItems, {
                canPickMany: true,
                title: 'CE: Batch Generate Getters/Setters — Select fields',
                placeHolder: 'Select one or more fields',
            });
            if (!selected || selected.length === 0) { return; }

            const treeItems = selected.map(s => new CodeExplorerTreeItem(s.member, s.cls, provider));
            await batchGenerateGettersSetters(treeItems, providerRegistry, codeGenerator, codeExplorer);
        }),

        vscode.commands.registerCommand('ce.exportStructure', async () => {
            // Centralized into the Member viewer (inline analytics) per feedback.
            await memberViewer.handleRunAnalytics('export');
            vscode.commands.executeCommand('mmxViewer.focus');
        }),

        vscode.commands.registerCommand('ce.generateDocumentation', async () => {
            // Centralized into the Member viewer (inline analytics) per feedback.
            await memberViewer.handleRunAnalytics('documentation');
            vscode.commands.executeCommand('mmxViewer.focus');
        }),

        vscode.commands.registerCommand('ce.codeReview', async () => {
            // Centralized into the Member viewer (inline analytics) per feedback.
            await memberViewer.handleRunAnalytics('review');
            vscode.commands.executeCommand('mmxViewer.focus');
        }),
    );
}

async function addMember(kind: MemberKind, _item?: CodeExplorerTreeItem): Promise<void> {

    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showWarningMessage('No active editor.'); return; }

    const doc = editor.document;
    const provider = providerRegistry.getByDocument(doc);
    if (!provider) { vscode.window.showWarningMessage('No provider for: ' + doc.languageId + ' / ' + doc.fileName); return; }

    const parsed = provider.parseDocument(doc);

    const supportsStandalone = ['rust', 'go', 'python', 'typescript', 'javascript', 'javascriptreact', 'pascal', 'cpp'].includes(provider.languageId);
    const hasClasses = parsed.classes.length > 0;

    if (!hasClasses && !supportsStandalone) {
        vscode.window.showWarningMessage('No classes found in this file.');
        return;
    }

    let classInfo: ClassInfo | undefined;
    let isStandalone = false;

    // Resolve the target class without a pop-up: tree item first, then the class
    // under the cursor. If none can be resolved but classes exist, the sidebar
    // add-session will offer a compact target selector.
    if (_item?.parentClass) {
        classInfo = _item.parentClass;
    } else if (hasClasses) {
        const cursor = editor.selection.active;
        classInfo = parsed.classes.find(c => c.range.contains(cursor));
    }

    if (!classInfo && !hasClasses && supportsStandalone) {
        isStandalone = true;
    }

    // Field from a class button: pick the visibility section first, so the
    // variable lands in private/public/… without digging through the form.
    let presetVisibility: Visibility | undefined;
    if (kind === MemberKind.Field && _item?.parentClass) {
        const visItems = provider.getVisibilityModifiers().map(v => ({
            label: v,
            description: v === provider.getDefaultVisibility() ? '(default)' : '',
            picked: v === provider.getDefaultVisibility(),
        }));
        const pickedVis = await vscode.window.showQuickPick(visItems, {
            title: 'CE: Add Field — visibility',
            placeHolder: `Visibility section in ${_item.parentClass.name}`,
        });
        if (!pickedVis) { return; }
        presetVisibility = pickedVis.label as Visibility;
    }

    // Single sidebar session for both standalone and class targets — no pop-ups.
    const result = await memberViewer.beginSession({
        mode: 'add', kind, provider, document: doc,
        classInfo: isStandalone ? undefined : classInfo,
        visibility: presetVisibility,
        candidateClasses: (!classInfo && !isStandalone && hasClasses) ? parsed.classes : undefined,
        allowStandaloneTarget: (!classInfo && !isStandalone && supportsStandalone) ? true : undefined,
    }) as MemberFormResult | undefined;
    if (!result || !result.name) { return; }

    if (isStandalone || result.targetIsStandalone === true) {
        await applyStandaloneFunction(doc, provider, result);
        return;
    }

    const targetClass = classInfo
        ?? parsed.classes.find(c => c.name === result.targetClassName);
    if (!targetClass) {
        vscode.window.showWarningMessage('CE: Could not resolve target class.');
        return;
    }

    const spec = memberFormToSpec(result);
    const success = await ops.applyGeneratedCode(doc, provider, generateFromSpec(provider, targetClass, spec));

    if (success) {
        codeExplorer.refresh();
        vscode.window.showInformationMessage('CE: Added "' + result.name + '" to ' + targetClass.name + ' ✓');
    } else {
        vscode.window.showErrorMessage('CE: Failed to add "' + result.name + '"');
    }
}

async function applyStandaloneFunction(doc: vscode.TextDocument, provider: ILanguageProvider, form: MemberFormResult): Promise<void> {
    const name = form.name;
    const returnType = form.returnType || '';
    const parameters = form.parameters;

    const pipeline = new EditPipeline();
    pipeline.recordOriginal(doc.uri, doc.getText());

    if (provider.languageId === 'rust') {
        const params = parameters.map(p => `${p.name}: ${p.type}`).join(', ');
        const ret = returnType ? ` -> ${returnType}` : '';
        pipeline.insert(doc.uri, new vscode.Position(doc.lineCount, 0), `\npub fn ${name}(${params})${ret} {\n    todo!()\n}\n`);
    } else if (provider.languageId === 'go') {
        const params = parameters.map(p => `${p.name} ${p.type}`).join(', ');
        const ret = returnType || '';
        pipeline.insert(doc.uri, new vscode.Position(doc.lineCount, 0), `\nfunc ${name}(${params})${ret ? ' ' + ret : ''} {\n\t// TODO: implement\n}\n`);
    } else if (provider.languageId === 'python') {
        const params = parameters.map(p => p.name).join(', ');
        pipeline.insert(doc.uri, new vscode.Position(doc.lineCount, 0), `\ndef ${name}(${params}):\n    pass\n`);
    } else if (provider.languageId === 'pascal') {
        // Pascal: declaration goes in interface section, implementation in implementation section
        const params = parameters.map(p => `${p.name}: ${p.type}`).join('; ');
        const decl = returnType
            ? `function ${name}(${params}): ${returnType};`
            : `procedure ${name}(${params});`;
        const impl = returnType
            ? `function ${name}(${params}): ${returnType};\nbegin\n  Result := ${returnType === 'Boolean' ? 'False' : '0'};\nend;\n`
            : `procedure ${name}(${params});\nbegin\n  // TODO: implement\nend;\n`;

        // Find the implementation keyword line — insert declaration before it.
        // The implementation body must go BEFORE `end.` (and before
        // initialization/finalization), never after — code after `end.` is invalid.
        const text = doc.getText();
        const lines = text.split(/\r?\n/);
        let implLine = -1;
        for (let i = 0; i < lines.length; i++) {
            if (/^implementation\b/i.test(lines[i].trim())) { implLine = i; break; }
        }

        // Locate a valid insertion point for the implementation body:
        // prefer before initialization/finalization, otherwise before `end.`.
        let implInsertLine = -1;
        for (let i = 0; i < lines.length; i++) {
            if (/^(initialization|finalization)\b/i.test(lines[i].trim())) { implInsertLine = i; break; }
        }
        if (implInsertLine < 0) {
            for (let i = lines.length - 1; i >= 0; i--) {
                if (/^end\.\s*$/i.test(lines[i].trim())) { implInsertLine = i; break; }
            }
        }
        if (implInsertLine < 0) {
            implInsertLine = doc.lineCount;
        }

        if (implLine >= 0) {
            // Insert declaration in interface section, implementation before `end.`
            pipeline.insert(doc.uri, new vscode.Position(implLine, 0), `\n${decl}\n\n`);
            pipeline.insert(doc.uri, new vscode.Position(implInsertLine, 0), `\n${impl}`);
        } else {
            // No implementation section — just append both at end of file
            pipeline.insert(doc.uri, new vscode.Position(doc.lineCount, 0), `\n${decl}\n\n${impl}`);
        }
    } else if (provider.languageId === 'cpp') {
        const params = parameters.map(p => `${p.type} ${p.name}`).join(', ');
        const ret = returnType && returnType !== 'void' ? returnType : 'void';
        pipeline.insert(doc.uri, new vscode.Position(doc.lineCount, 0), `\n${ret} ${name}(${params}) {\n    // TODO: implement\n}\n`);
    } else {
        const params = parameters.map(p => `${p.name}: ${p.type}`).join(', ');
        const ret = returnType ? `: ${returnType}` : '';
        pipeline.insert(doc.uri, new vscode.Position(doc.lineCount, 0), `\nfunction ${name}(${params})${ret} {\n  // TODO: implement\n}\n`);
    }

    const ok = await pipeline.apply('Add standalone function');
    if (ok) {
        codeExplorer.refresh();
        vscode.window.showInformationMessage(`CE: Added function "${name}" ✓`);
    }
}

function synthStandaloneClass(member: ClassMember, doc: vscode.TextDocument): ClassInfo {
    return {
        id: 'standalone_' + member.id,
        name: '',
        fullName: '',
        classType: 'standalone',
        parentClass: undefined,
        interfaces: [],
        members: [member],
        range: member.range,
        isInterface: false,
        isRecord: false,
        isSealed: false,
        fileUri: doc.uri,
    };
}

function resolveFromItemOrCursor(item?: CodeExplorerTreeItem): { doc: vscode.TextDocument; provider: ILanguageProvider; cls: ClassInfo; member: ClassMember } | undefined {
    if (item && 'kind' in item.itemData) {
        const member = item.itemData as ClassMember;
        const editor = vscode.window.activeTextEditor;
        const doc = editor?.document;
        const prov = doc ? providerRegistry.getByDocument(doc) : undefined;
        if (doc && prov) {
            const cls = item.parentClass ?? synthStandaloneClass(member, doc);
            log.appendLine('  [resolve] from tree item: ' + member.name + (item.parentClass ? ' (class ' + cls.name + ')' : ' (standalone)'));
            return { doc, provider: prov, cls, member };
        }
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        log.appendLine('  [resolve] FAIL: no active editor');
        return undefined;
    }

    let doc = editor.document;
    let prov = providerRegistry.getByDocument(doc);

    if (!prov) {
        log.appendLine('  [resolve] active editor has no provider (languageId=' + doc.languageId + '), trying visible editors');
        for (const visEditor of vscode.window.visibleTextEditors) {
            const visProv = providerRegistry.getByDocument(visEditor.document);
            if (visProv) {
                doc = visEditor.document;
                prov = visProv;
                log.appendLine('  [resolve] found provider in visible editor: ' + doc.fileName);
                break;
            }
        }
    }

    if (!prov) {
        log.appendLine('  [resolve] FAIL: no provider found in any visible editor');
        return undefined;
    }

    log.appendLine('  [resolve] document: ' + doc.fileName + ' provider: ' + prov.displayName);

    // Prefer the active editor when it matches the resolved document;
    // only search visible editors when we fell back to a different document.
    const targetEditor = editor.document === doc ? editor : (vscode.window.visibleTextEditors.find(e => e.document === doc) || editor);
    const position = targetEditor.selection.active;
    log.appendLine('  [resolve] cursor: line=' + position.line + ' char=' + position.character);

    const parsed = prov.parseDocument(doc);
    log.appendLine('  [resolve] parsed ' + parsed.classes.length + ' classes');

    for (const cls of parsed.classes) {
        // A method body can sit outside the class range (Pascal implementation
        // section, Go receiver methods), so also accept a cursor on any member.
        const onMember = cls.members.some(m => m.range.contains(position) || m.implementationRange?.contains(position));
        if (!cls.range.contains(position) && !onMember) continue;
        log.appendLine('  [resolve] cursor is inside class: ' + cls.name + ' (lines ' + cls.range.start.line + '-' + cls.range.end.line + ')');

        for (const member of cls.members) {
            const inDecl = member.range.contains(position);
            const inImpl = member.implementationRange?.contains(position);
            log.appendLine('  [resolve]   member: ' + member.name + ' kind=' + member.kind +
                ' decl=lines ' + member.range.start.line + '-' + member.range.end.line +
                (member.implementationRange ? ' impl=lines ' + member.implementationRange.start.line + '-' + member.implementationRange.end.line : '') +
                ' hit=' + (inDecl || inImpl));
            if (inDecl || inImpl) {
                log.appendLine('  [resolve] FOUND member at cursor: ' + member.name);
                return { doc, provider: prov, cls, member };
            }
        }

        log.appendLine('  [resolve] no exact match — scanning backwards for nearest member above cursor');
        let best: ClassMember | undefined;
        let bestLine = -1;
        for (const member of cls.members) {
            const memberEnd = Math.max(
                member.range.end.line,
                member.implementationRange?.end.line ?? member.range.end.line
            );
            if (member.range.start.line <= position.line && member.range.start.line > bestLine) {
                const memberEndLine = member.range.end.line;
                const implEndLine = member.implementationRange?.end.line ?? -1;
                const realEnd = Math.max(memberEndLine, implEndLine);

                if (member.range.start.line <= position.line && position.line <= realEnd + 5) {
                    best = member;
                    bestLine = member.range.start.line;
                } else if (member.range.start.line <= position.line) {
                    if (!best || member.range.start.line > bestLine) {
                        best = member;
                        bestLine = member.range.start.line;
                    }
                }
            }
        }

        if (best) {
            log.appendLine('  [resolve] NEAREST member above cursor: ' + best.name + ' (line ' + best.range.start.line + ')');
            return { doc, provider: prov, cls, member: best };
        }

        log.appendLine('  [resolve] FAIL: no member found for cursor position in class ' + cls.name);
        return undefined;
    }

    // Check standalone (file-level) procedures
    log.appendLine('  [resolve] cursor not inside any class — checking ' + parsed.standaloneProcedures.length + ' standalone procedures');
    for (const proc of parsed.standaloneProcedures) {
        const inDecl = proc.range.contains(position);
        const inImpl = proc.implementationRange?.contains(position);
        if (inDecl || inImpl) {
            log.appendLine('  [resolve] FOUND standalone procedure at cursor: ' + proc.name);
            const synthCls = synthStandaloneClass(proc, doc);
            return { doc, provider: prov, cls: synthCls, member: proc };
        }
    }

    // Fallback: find nearest standalone procedure (by implementation range or declaration)
    // This handles the case where cursor is on a blank line between procedures
    // or slightly outside a computed implementation range.
    if (parsed.standaloneProcedures.length > 0) {
        let bestProc: ClassMember | undefined;
        let bestDist = Infinity;
        for (const proc of parsed.standaloneProcedures) {
            const ranges = [proc.range, ...(proc.implementationRange ? [proc.implementationRange] : [])];
            for (const r of ranges) {
                if (position.line < r.start.line) {
                    const dist = r.start.line - position.line;
                    if (dist < bestDist) { bestProc = proc; bestDist = dist; }
                } else if (position.line > r.end.line) {
                    const dist = position.line - r.end.line;
                    if (dist < bestDist) { bestProc = proc; bestDist = dist; }
                } else {
                    bestProc = proc; bestDist = 0; break;
                }
            }
            if (bestDist === 0) break;
        }
        if (bestProc && bestDist <= 3) {
            log.appendLine('  [resolve] NEAREST standalone procedure: ' + bestProc.name + ' (distance=' + bestDist + ')');
            const synthCls = synthStandaloneClass(bestProc, doc);
            return { doc, provider: prov, cls: synthCls, member: bestProc };
        }
    }

    log.appendLine('  [resolve] FAIL: cursor not inside any class or standalone procedure');
    return undefined;
}

/**
 * Resolve the method member enclosing `position` for local-variable operations
 * (classes + standalone procedures). Unlike resolveFromItemOrCursor this does
 * not require a tree item and returns just the member.
 */
function findEnclosingLocalMember(parsed: { classes: ClassInfo[]; standaloneProcedures: ClassMember[] }, position: vscode.Position): ClassMember | undefined {
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
 * Resolve the variable (local, parameter, field, property or standalone) under
 * the active cursor, for the unified refactoring commands. Returns undefined
 * when the cursor is not on a refactorable variable.
 */
function resolveVariableFromCursor(): import('./models/types').VariableRef | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return undefined; }
    const doc = editor.document;
    const provider = providerRegistry.getByDocument(doc);
    if (!provider) { return undefined; }
    return resolveVariableAt(doc, provider, editor.selection.active);
}


export function deactivate(): void {
    vscode.commands.executeCommand('setContext', 'mmx:isActive', false);
}
