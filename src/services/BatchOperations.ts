import * as vscode from 'vscode';
import { CodeExplorerTreeItem, CodeExplorerService } from './CodeExplorerService';
import { CodeGeneratorService } from './CodeGeneratorService';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { ClassMember, ClassInfo, MemberKind, MemberSpec, FieldSpec, PropertySpec, Visibility } from '../models/types';
import { applyGeneratedCode } from './MemberOperations';

export async function batchMove(
    items: CodeExplorerTreeItem[],
    providerRegistry: ProviderRegistry,
    codeGenerator: CodeGeneratorService,
    codeExplorer: CodeExplorerService
): Promise<void> {
    const memberItems = items.filter(i => 'kind' in i.itemData && i.parentClass);
    if (memberItems.length === 0) {
        vscode.window.showWarningMessage('No member items selected for batch move.');
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
    const sourceClassName = memberItems[0].parentClass!.name;
    const destinations = parsed.classes.filter(c => c.name !== sourceClassName);
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
        { placeHolder: `Move ${memberItems.length} member(s) to which class?` }
    );
    if (!picked) return;
    const pickedItem = destItems.find(d => d.label === picked);
    if (!pickedItem) return;
    const destName = pickedItem.className;

    const memberNames = memberItems.map(i => (i.itemData as ClassMember).name).join(', ');
    const confirm = await vscode.window.showWarningMessage(
        `Move ${memberItems.length} member(s) (${memberNames}) from ${sourceClassName} to ${destName}?`,
        { modal: true },
        'Move'
    );
    if (confirm !== 'Move') return;

    let movedCount = 0;
    for (const item of memberItems) {
        const member = item.itemData as ClassMember;
        const sourceClass = item.parentClass!;

        const deleted = await codeGenerator.deleteMember(doc, sourceClass, member);
        if (!deleted) {
            continue;
        }

        const reparsed = provider.parseDocument(doc);
        const destClass = reparsed.classes.find(c => c.name === destName);
        if (!destClass) {
            continue;
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
            movedCount++;
        }
    }

    codeExplorer.refresh();
    if (movedCount > 0) {
        vscode.window.showInformationMessage(`Batch move: ${movedCount} member(s) moved to ${destName}.`);
    } else {
        vscode.window.showErrorMessage('Batch move: failed to move any members.');
    }
}

export async function batchGenerateGettersSetters(
    items: CodeExplorerTreeItem[],
    providerRegistry: ProviderRegistry,
    codeGenerator: CodeGeneratorService,
    codeExplorer: CodeExplorerService
): Promise<void> {
    const fieldItems = items.filter(i => {
        if (!('kind' in i.itemData)) { return false; }
        const member = i.itemData as ClassMember;
        return member.kind === MemberKind.Field;
    });

    if (fieldItems.length === 0) {
        vscode.window.showWarningMessage('No field items selected for batch getter/setter generation.');
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

    const modeItems = [
        { label: 'Getter and Setter', mode: 'both' as const },
        { label: 'Getter only', mode: 'getter' as const },
        { label: 'Setter only', mode: 'setter' as const },
    ];
    const modePicked = await vscode.window.showQuickPick(modeItems, {
        title: 'CE: Batch Generate Getters/Setters',
        placeHolder: 'What should be generated?',
    });
    if (!modePicked) { return; }
    const hasGetter = modePicked.mode !== 'setter';
    const hasSetter = modePicked.mode !== 'getter';

    const capitalizeLangs = ['java', 'csharp', 'typescript', 'javascript', 'javascriptreact'];
    const buildPropertyName = (raw: string): string => {
        if (capitalizeLangs.includes(provider.languageId)) {
            const stripped = raw.replace(/^_+/, '');
            if (!stripped) { return raw; }
            return stripped.charAt(0).toUpperCase() + stripped.slice(1);
        }
        return raw;
    };

    interface FieldTarget { cls: ClassInfo; field: ClassMember; }
    const byClass = new Map<string, FieldTarget[]>();
    for (const item of fieldItems) {
        const member = item.itemData as ClassMember;
        const cls = item.parentClass!;
        const arr = byClass.get(cls.name) ?? [];
        arr.push({ cls, field: member });
        byClass.set(cls.name, arr);
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
        if (parts.length === 0 || !cls) { continue; }

        const insertPos = provider.getInsertPosition(doc, cls, 'property').declaration;
        const combined = {
            declaration: '\n' + parts.join('\n') + '\n',
            implementation: '',
            declarationPosition: insertPos,
            implementationPosition: insertPos,
        };
        const success = await applyGeneratedCode(doc, provider, combined);
        if (!success) {
            return;
        }
    }

    if (totalGenerated > 0) {
        codeExplorer.refresh();
        vscode.window.showInformationMessage('CE: Generated ' + totalGenerated + ' accessor(s).');
    } else {
        vscode.window.showInformationMessage('CE: No accessors were generated.');
    }
}
