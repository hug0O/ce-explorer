import * as vscode from 'vscode';
import { ProviderRegistry } from './providers/ProviderRegistry';
import { CodeExplorerService, CodeExplorerTreeItem } from './services/CodeExplorerService';
import { CodeGeneratorService } from './services/CodeGeneratorService';
import { MemberEditorPanel } from './webview/MemberEditorPanel';
import { MemberViewerPanel } from './webview/MemberViewerPanel';
import { DashboardPanel } from './webview/DashboardPanel';
import { MetricsDashboardPanel } from './webview/MetricsDashboardPanel';
import { ClassInfo, ClassMember, MemberKind, Visibility, MemberSpec, FieldSpec, PropertySpec, GeneratedCode } from './models/types';
import { ILanguageProvider } from './providers/ILanguageProvider';
import { Template } from './models/Template';
import { TemplateService } from './services/TemplateService';
import { TemplateStore } from './services/TemplateStore';
import { TemplateCompletionProvider } from './providers/TemplateCompletionProvider';
import { TemplateManagerPanel } from './webview/TemplateManagerPanel';
import { MmxCodeActionProvider } from './providers/MmxCodeActionProvider';
import { MmxCodeLensProvider } from './services/CodeLensProvider';
import { MemberDragAndDropController } from './services/DragAndDropController';
import * as ops from './services/MemberOperations';
import { registerSafePreview } from './services/SafePreview';
import { detectDeadCode } from './services/DeadCodeDetector';
import { QuickFixProvider } from './providers/QuickFixProvider';
import { batchMove, batchGenerateGettersSetters } from './services/BatchOperations';
import { exportStructure } from './services/ExportService';
import { generateDocumentation } from './services/DocumentationGenerator';
import { runCodeReview } from './services/CodeReviewService';

let providerRegistry: ProviderRegistry;
let codeExplorer: CodeExplorerService;
let codeGenerator: CodeGeneratorService;
let templateService: TemplateService;
let templateStore: TemplateStore;
let extensionContext: vscode.ExtensionContext;
let memberViewer: MemberViewerPanel;
let dashboard: DashboardPanel;
let log: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('[MMX] activate() called');
    console.log('[MMX] __dirname:', __dirname);
    console.log('[MMX] workspace:', vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath));

    const outputChannel = vscode.window.createOutputChannel('Code Explorer');
    outputChannel.appendLine('Code Explorer: activating...');
    log = outputChannel;
    context.subscriptions.push(outputChannel);
        ops.setLogChannel(outputChannel);

        registerSafePreview(context);

    try {
        extensionContext = context;
        console.log('[MMX] Creating ProviderRegistry...');
        providerRegistry = new ProviderRegistry();
        console.log('[MMX] Creating CodeExplorerService...');
        codeExplorer = new CodeExplorerService();
        console.log('[MMX] Creating CodeGeneratorService...');
        codeGenerator = new CodeGeneratorService();
        console.log('[MMX] All services created');

        console.log('[MMX] Creating TemplateService...');
        templateService = new TemplateService(context);
        await templateService.load();
        templateService.startWatching();
        context.subscriptions.push(templateService);

        const templateStoreLocal = new TemplateStore(context);
        templateStore = templateStoreLocal;

        outputChannel.appendLine('Providers: ' + providerRegistry.getAllProviders().map(p => p.displayName).join(', '));
        console.log('[MMX] Providers:', providerRegistry.getAllProviders().map(p => p.displayName).join(', '));

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

        const codeActionProvider = new MmxCodeActionProvider(providerRegistry);
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

        console.log('[MMX] Creating tree views...');
        const dragDropController = new MemberDragAndDropController(() => codeExplorer.refresh());
        const classesTree = vscode.window.createTreeView('mmxCodeExplorer', {
            treeDataProvider: codeExplorer,
            showCollapseAll: true,
            dragAndDropController: dragDropController,
        });
        console.log('[MMX] Tree views created');

        const codeLensProvider = new MmxCodeLensProvider(providerRegistry);
        const codeLensRegistration = vscode.languages.registerCodeLensProvider(
            { scheme: 'file' },
            codeLensProvider
        );
        context.subscriptions.push(codeLensRegistration);

        context.subscriptions.push(classesTree);

        console.log('[MMX] Creating MemberViewerPanel...');
        memberViewer = new MemberViewerPanel(context.extensionUri, providerRegistry, codeExplorer, codeGenerator, context);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(MemberViewerPanel.viewType, memberViewer)
        );
        console.log('[MMX] MemberViewerPanel created');

        console.log('[MMX] Creating DashboardPanel...');
        dashboard = new DashboardPanel(context.extensionUri, providerRegistry, codeExplorer);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(DashboardPanel.viewType, dashboard)
        );
        context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(e => dashboard.scheduleCursorUpdate(e.textEditor)),
            vscode.window.onDidChangeActiveTextEditor(e => { if (e) dashboard.scheduleCursorUpdate(e); })
        );
        console.log('[MMX] DashboardPanel created');

        registerCommands(context);
        console.log('[MMX] Commands registered');

        if (vscode.window.activeTextEditor) {
            codeExplorer.refresh();
        }

        outputChannel.appendLine('Code Explorer: activated successfully');
        console.log('[MMX] ACTIVATED SUCCESSFULLY');
        vscode.window.showInformationMessage('Code Explorer activated ✓');
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

        vscode.commands.registerCommand('mmx.testMinimal', async () => {
            console.log('[MMX] testMinimal command fired');
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }

            const provider = providerRegistry.getByDocument(editor.document);
            if (!provider) {
                vscode.window.showErrorMessage('No provider for language: ' + editor.document.languageId);
                return;
            }

            const parsed = provider.parseDocument(editor.document);
            const classCount = parsed.classes.length;
            const classNames = parsed.classes.map(c => c.name).join(', ');

            vscode.window.showInformationMessage(
                'CE Test: Found ' + classCount + ' class(es): ' + classNames
            );

            if (classCount > 0) {
                const cls = parsed.classes[0];
                const insertPos = new vscode.Position(editor.document.lineCount, 0);
                const edit = new vscode.WorkspaceEdit();
                edit.insert(editor.document.uri, insertPos, '\n// CE Test: parsed class ' + cls.name + ' with ' + cls.members.length + ' members\n');
                const ok = await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Insert test result: ' + ok);
            }
        }),

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
            console.log('[MMX] mmx.addMethod command fired');
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
            log.appendLine('=== mmx.editMember FIRED ===');
            log.appendLine('  item provided: ' + !!item);
            const resolved = resolveFromItemOrCursor(item);
            if (!resolved) {
                log.appendLine('  resolveFromItemOrCursor returned undefined — no member found');
                log.show();
                const action = await vscode.window.showWarningMessage(
                    'Place cursor on a class member first.', 'Show Details',
                );
                if (action === 'Show Details') { log.show(); }
                return;
            }
            log.appendLine('  resolved: member=' + resolved.member.name + ' kind=' + resolved.member.kind + ' cls=' + resolved.cls.name);
            log.appendLine('  member.range: line=' + resolved.member.range.start.line + ' char=' + resolved.member.range.start.character);
            log.show();
            await ops.editMember(extensionContext, resolved.doc, resolved.provider, resolved.cls, resolved.member, codeGenerator, codeExplorer);
        }),

        vscode.commands.registerCommand('mmx.deleteMember', async (item?: CodeExplorerTreeItem) => {
            log.appendLine('=== mmx.deleteMember FIRED ===');
            log.appendLine('  item provided: ' + !!item);
            const resolved = resolveFromItemOrCursor(item);
            if (!resolved) {
                log.appendLine('  resolveFromItemOrCursor returned undefined — no member found');
                log.show();
                const action = await vscode.window.showWarningMessage(
                    'Place cursor on a class member first.', 'Show Details',
                );
                if (action === 'Show Details') { log.show(); }
                return;
            }
            log.appendLine('  resolved: member=' + resolved.member.name + ' kind=' + resolved.member.kind + ' cls=' + resolved.cls.name);
            log.appendLine('  member.range: line=' + resolved.member.range.start.line + '-' + resolved.member.range.end.line);
            log.show();
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

            const deleted = await codeGenerator.deleteMember(doc, sourceClass, member);
            if (!deleted) {
                vscode.window.showErrorMessage('CE: Failed to delete member from source class.');
                return;
            }

            const reparsed = provider.parseDocument(doc);
            const destClass = reparsed.classes.find(c => c.name === destName);
            if (!destClass) {
                vscode.window.showErrorMessage('CE: Destination class not found after re-parse.');
                codeExplorer.refresh();
                return;
            }

            let success = false;
            if (member.kind === MemberKind.Method || member.kind === MemberKind.Constructor || member.kind === MemberKind.Destructor) {
                const spec: MemberSpec = {
                    kind: member.kind, name: member.name, returnType: member.returnType || undefined,
                    visibility: member.visibility, parameters: member.parameters,
                    modifiers: [], isStatic: member.isStatic, isVirtual: member.isVirtual,
                    isAbstract: member.isAbstract, isOverride: member.isOverride, isFinal: false,
                };
                const gen = provider.generateMethod(destClass.name, spec, destClass);
                success = await applyGeneratedCode(doc, provider, gen);
            } else if (member.kind === MemberKind.Field) {
                const spec: FieldSpec = { kind: MemberKind.Field, name: member.name, type: member.type || provider.getTypeDefaults().defaultFieldType, visibility: member.visibility };
                const gen = provider.generateField(destClass.name, spec, destClass);
                success = await applyGeneratedCode(doc, provider, gen);
            } else if (member.kind === MemberKind.Property) {
                const spec: PropertySpec = {
                    kind: MemberKind.Property, name: member.name, type: member.type || provider.getTypeDefaults().defaultPropertyType,
                    visibility: member.visibility, hasGetter: true, hasSetter: true,
                    isDefault: false, isReadOnly: false,
                };
                const gen = provider.generateProperty(destClass.name, spec, destClass);
                success = await applyGeneratedCode(doc, provider, gen);
            }

            if (success) {
                codeExplorer.refresh();
                vscode.window.showInformationMessage(`Moved "${member.name}" from ${sourceClass.name} to ${destClass.name}`);
            } else {
                codeExplorer.refresh();
                vscode.window.showErrorMessage('CE: Failed to insert member into destination class.');
            }
        }),

        vscode.commands.registerCommand('mmx.renameMember', async (item?: CodeExplorerTreeItem) => {
            log.appendLine('=== mmx.renameMember FIRED ===');
            log.appendLine('  item provided: ' + !!item);
            const resolved = resolveFromItemOrCursor(item);
            if (!resolved) {
                log.appendLine('  resolveFromItemOrCursor returned undefined — no member found');
                log.show();
                const action = await vscode.window.showWarningMessage(
                    'Place cursor on a class member first.', 'Show Details',
                );
                if (action === 'Show Details') { log.show(); }
                return;
            }
            log.appendLine('  resolved: member=' + resolved.member.name + ' kind=' + resolved.member.kind + ' cls=' + resolved.cls.name);
            log.appendLine('  member.range: line=' + resolved.member.range.start.line + ' char=' + resolved.member.range.start.character);
            log.show();
            await ops.renameMember(resolved.doc, resolved.cls, resolved.member, resolved.provider, codeExplorer);
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

            const methodName = await vscode.window.showInputBox({
                prompt: 'Method name:',
                placeHolder: 'extractedMethod',
            });
            if (!methodName) {
                return;
            }

            const returnType = await vscode.window.showInputBox({
                prompt: 'Return type:',
                placeHolder: provider.languageId === 'pascal' ? '' : 'void',
            });
            if (returnType === undefined) {
                return;
            }

            const paramsInput = await vscode.window.showInputBox({
                prompt: 'Parameters (name:type, comma-separated, empty = none):',
                placeHolder: 'x:int, name:string',
            });
            if (paramsInput === undefined) {
                return;
            }
            const parameters = paramsInput.trim()
                ? paramsInput.split(',').map(s => s.trim()).filter(Boolean)
                : [];

            const ok = await codeGenerator.extractMethod(
                editor.document,
                editor.selection,
                methodName,
                parameters,
                returnType || (provider.languageId === 'pascal' ? '' : 'void')
            );
            if (!ok) {
                vscode.window.showWarningMessage('CE: Could not extract method for this language.');
            }
        }),

        vscode.commands.registerCommand('mmx.openMemberEditor', async (item?: CodeExplorerTreeItem) => {
            await addMember(MemberKind.Method, item);
        }),

        vscode.commands.registerCommand('mmx.showActions', async () => {
            const actions = [
                { label: '$(symbol-method) Add Method', description: '', cmd: 'mmx.addMethod' },
                { label: '$(symbol-field) Add Field', description: '', cmd: 'mmx.addField' },
                { label: '$(symbol-property) Add Property', description: '', cmd: 'mmx.addProperty' },
                { label: '$(symbol-constructor) Add Constructor', description: '', cmd: 'mmx.addConstructor' },
                { label: '$(edit) Edit Member', description: '', cmd: 'mmx.editMember' },
                { label: '$(references) Rename Member', description: '', cmd: 'mmx.renameMember' },
                { label: '$(trash) Delete Member', description: '', cmd: 'mmx.deleteMember' },
                { label: '$(fold) Extract Method', description: '', cmd: 'mmx.extractMethod' },
                { label: '$(code) Insert Template', description: '', cmd: 'mmx.insertTemplate' },
                { label: '$(sync) Synchronize Decl/Impl', description: '', cmd: 'mmx.synchronizeDeclImpl' },
                { label: '$(symbol-interface) Implement Interface', description: '', cmd: 'mmx.implementInterface' },
                { label: '$(filter) Filter Members', description: '', cmd: 'mmx.filterTree' },
                { label: '$(go-to-file) Go to Member', description: '', cmd: 'mmx.goToMember' },
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
            log.appendLine('=== mmx.implementInterface FIRED ===');
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

            await ops.implementInterface(doc, prov, cls, codeExplorer);
        }),

        vscode.commands.registerCommand('mmx.generateGettersSetters', async (item?: CodeExplorerTreeItem) => {
            log.appendLine('=== mmx.generateGettersSetters FIRED ===');
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

        vscode.commands.registerCommand('ce.codeMetrics', () => {
            MetricsDashboardPanel.createOrShow(context.extensionUri, providerRegistry);
        }),

        vscode.commands.registerCommand('ce.detectDeadCode', async () => {
            await detectDeadCode(providerRegistry);
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
            await exportStructure(providerRegistry);
        }),

        vscode.commands.registerCommand('ce.generateDocumentation', async () => {
            await generateDocumentation(providerRegistry);
        }),

        vscode.commands.registerCommand('ce.codeReview', async () => {
            await runCodeReview(providerRegistry);
        }),
    );
}

async function addMember(kind: MemberKind, _item?: CodeExplorerTreeItem): Promise<void> {
    console.log('[MMX] addMember called, kind:', kind);

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

    if (hasClasses) {
        const labels = parsed.classes.map(c => {
            const typeLabel = c.classType ? ` (${c.classType})` : (c.isInterface ? ' (interface)' : c.isRecord ? ' (record)' : '');
            return { label: c.name + typeLabel, name: c.name, id: c.id };
        });

        const standaloneOption = '(File-level function)';
        const allOptions = supportsStandalone ? [standaloneOption, ...labels.map(l => l.label)] : labels.map(l => l.label);

        const pick = await vscode.window.showQuickPick(allOptions, { placeHolder: 'Select target' });
        if (!pick) return;

        if (pick === standaloneOption) {
            isStandalone = true;
        } else {
            const picked = labels.find(l => l.label === pick);
            classInfo = parsed.classes.find(c => c.id === picked?.id);
        }
    } else {
        isStandalone = true;
    }

    if (isStandalone) {
        const name = await vscode.window.showInputBox({ prompt: 'Function name:', placeHolder: 'my_function' });
        if (!name) return;

        const returnType = await vscode.window.showInputBox({ prompt: 'Return type:', placeHolder: provider.languageId === 'python' ? '' : 'void' });
        if (returnType === undefined) return;

        const parameters: { name: string; type: string }[] = [];
        let pn = 1;
        while (true) {
            const p = await vscode.window.showInputBox({ prompt: 'Param ' + pn + ' (name:type, empty=done)', placeHolder: 'param:string' });
            if (p === undefined) return;
            if (p.trim() === '') break;
            const ci = p.indexOf(':');
            parameters.push(ci > 0 ? { name: p.substring(0, ci).trim(), type: p.substring(ci + 1).trim() } : { name: p.trim(), type: provider.languageId === 'python' ? '' : 'string' });
            pn++;
        }

        const lastLine = doc.lineCount;
        const wsEdit = new vscode.WorkspaceEdit();
        let code = '';

        if (provider.languageId === 'rust') {
            const params = parameters.map(p => `${p.name}: ${p.type}`).join(', ');
            const ret = returnType ? ` -> ${returnType}` : '';
            code = `\npub fn ${name}(${params})${ret} {\n    todo!()\n}\n`;
        } else if (provider.languageId === 'go') {
            const params = parameters.map(p => `${p.name} ${p.type}`).join(', ');
            const ret = returnType || '';
            code = `\nfunc ${name}(${params})${ret ? ' ' + ret : ''} {\n\t// TODO: implement\n}\n`;
        } else if (provider.languageId === 'python') {
            const params = parameters.map(p => p.name).join(', ');
            code = `\ndef ${name}(${params}):\n    pass\n`;
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

            const wsEdit2 = new vscode.WorkspaceEdit();
            if (implLine >= 0) {
                // Insert declaration in interface section, implementation before `end.`
                wsEdit2.insert(doc.uri, new vscode.Position(implLine, 0), `\n${decl}\n\n`);
                wsEdit2.insert(doc.uri, new vscode.Position(implInsertLine, 0), `\n${impl}`);
            } else {
                // No implementation section — just append both at end of file
                wsEdit2.insert(doc.uri, new vscode.Position(doc.lineCount, 0), `\n${decl}\n\n${impl}`);
            }
            const ok2 = await vscode.workspace.applyEdit(wsEdit2);
            if (ok2) {
                codeExplorer.refresh();
                vscode.window.showInformationMessage(`CE: Added function "${name}" ✓`);
            }
            return;
        } else if (provider.languageId === 'cpp') {
            const params = parameters.map(p => `${p.type} ${p.name}`).join(', ');
            const ret = returnType && returnType !== 'void' ? returnType : 'void';
            code = `\n${ret} ${name}(${params}) {\n    // TODO: implement\n}\n`;
        } else {
            const params = parameters.map(p => `${p.name}: ${p.type}`).join(', ');
            const ret = returnType ? `: ${returnType}` : '';
            code = `\nfunction ${name}(${params})${ret} {\n  // TODO: implement\n}\n`;
        }

        wsEdit.insert(doc.uri, new vscode.Position(lastLine, 0), code);
        const ok = await vscode.workspace.applyEdit(wsEdit);
        if (ok) {
            codeExplorer.refresh();
            vscode.window.showInformationMessage(`CE: Added function "${name}" ✓`);
        }
        return;
    }

    if (!classInfo) return;

    const result = await MemberEditorPanel.create(extensionContext, doc, provider, classInfo, codeGenerator, kind);
    if (!result) {
        console.log('[MMX] MemberEditorPanel cancelled');
        return;
    }

    console.log('[MMX] Form result:', JSON.stringify(result));
    let success = false;

    if (result.kind === MemberKind.Method || result.kind === MemberKind.Constructor || result.kind === MemberKind.Destructor) {
        const spec: MemberSpec = {
            kind: result.kind, name: result.name, returnType: result.returnType || undefined,
            visibility: result.visibility, parameters: result.parameters || [],
            modifiers: [], isStatic: result.isStatic, isVirtual: result.isVirtual,
            isAbstract: result.isAbstract, isOverride: result.isOverride, isFinal: false,
        };
        const gen = provider.generateMethod(classInfo.name, spec, classInfo);
        success = await applyGeneratedCode(doc, provider, gen);
    } else if (result.kind === MemberKind.Field) {
        const spec: FieldSpec = { kind: MemberKind.Field, name: result.name, type: result.type || result.returnType || 'int', visibility: result.visibility };
        const gen = provider.generateField(classInfo.name, spec, classInfo);
        success = await applyGeneratedCode(doc, provider, gen);
    } else if (result.kind === MemberKind.Property) {
        const spec: PropertySpec = {
            kind: MemberKind.Property, name: result.name, type: result.type || result.returnType || 'string',
            visibility: result.visibility, hasGetter: result.hasGetter, hasSetter: result.hasSetter,
            getterName: result.getterName, setterName: result.setterName, isDefault: false, isReadOnly: false,
        };
        const gen = provider.generateProperty(classInfo.name, spec, classInfo);
        success = await applyGeneratedCode(doc, provider, gen);
    }

    if (success) {
        codeExplorer.refresh();
        vscode.window.showInformationMessage('CE: Added "' + result.name + '" to ' + classInfo.name + ' ✓');
    } else {
        vscode.window.showErrorMessage('CE: Failed to add "' + result.name + '"');
    }
}

async function applyGeneratedCode(doc: vscode.TextDocument, provider: ILanguageProvider, gen: import('./models/types').GeneratedCode): Promise<boolean> {
    return ops.applyGeneratedCode(doc, provider, gen);
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
        if (!cls.range.contains(position)) continue;
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


export function deactivate(): void {
    vscode.commands.executeCommand('setContext', 'mmx:isActive', false);
}
