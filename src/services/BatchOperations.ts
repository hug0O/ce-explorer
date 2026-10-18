import * as vscode from 'vscode';
import { CodeExplorerTreeItem, CodeExplorerService } from './CodeExplorerService';
import { CodeGeneratorService } from './CodeGeneratorService';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { EditPipeline } from './EditPipeline';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { ClassMember, ClassInfo, MemberKind, MemberSpec, FieldSpec, PropertySpec, Visibility, GeneratedCode } from '../models/types';
import { applyGeneratedCode, queueGeneratedCode } from './MemberOperations';

/**
 * Build the generated code that re-creates `member` inside `destClass`.
 * Shared by moveMember (extension.ts) and batchMove — positions are computed
 * from the passed ClassInfo, so callers must use a parse of the CURRENT
 * document state (single-snapshot atomic moves rely on that).
 */
export function buildMoveTargetCode(
    provider: ILanguageProvider,
    member: ClassMember,
    destClass: ClassInfo
): GeneratedCode | undefined {
    if (member.kind === MemberKind.Method || member.kind === MemberKind.Constructor || member.kind === MemberKind.Destructor) {
        const spec: MemberSpec = {
            kind: member.kind, name: member.name, returnType: member.returnType || undefined,
            visibility: member.visibility, parameters: member.parameters,
            modifiers: [], isStatic: member.isStatic, isVirtual: member.isVirtual,
            isAbstract: member.isAbstract, isOverride: member.isOverride, isFinal: false,
        };
        return provider.generateMethod(destClass.name, spec, destClass);
    }
    if (member.kind === MemberKind.Field) {
        const spec: FieldSpec = {
            kind: MemberKind.Field, name: member.name,
            type: member.type || provider.getTypeDefaults().defaultFieldType,
            visibility: member.visibility,
        };
        return provider.generateField(destClass.name, spec, destClass);
    }
    if (member.kind === MemberKind.Property) {
        const spec: PropertySpec = {
            kind: MemberKind.Property, name: member.name,
            type: member.type || provider.getTypeDefaults().defaultPropertyType,
            visibility: member.visibility, hasGetter: true, hasSetter: true,
            isDefault: false, isReadOnly: false,
        };
        return provider.generateProperty(destClass.name, spec, destClass);
    }
    return undefined;
}

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

    const destClass = parsed.classes.find(c => c.name === destName);
    if (!destClass) {
        vscode.window.showErrorMessage('CE: Destination class not found.');
        return;
    }

    // Every member is queued (delete from source + insert into destination) on
    // one pipeline in original document coordinates, then committed as a
    // single WorkspaceEdit: one preview, one undo step, and cancelling the
    // preview can never leave members deleted without being moved.
    const pipeline = new EditPipeline();
    let planned = 0;
    await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Window, title: `CE: Moving ${memberItems.length} member(s) to ${destName}…` },
        async () => {
            for (const item of memberItems) {
                const member = item.itemData as ClassMember;
                const gen = buildMoveTargetCode(provider, member, destClass);
                if (!gen) { continue; }
                await codeGenerator.planMemberDeletion(doc, member, pipeline);
                await queueGeneratedCode(doc, provider, gen, pipeline);
                planned++;
            }
        },
    );

    if (planned === 0) {
        vscode.window.showErrorMessage('Batch move: failed to plan any member move.');
        return;
    }

    const applied = await pipeline.apply(`Batch move ${planned} member(s) to ${destName}`);
    codeExplorer.refresh();
    if (applied) {
        vscode.window.showInformationMessage(`Batch move: ${planned} member(s) moved to ${destName}.`);
    } else {
        vscode.window.showErrorMessage('Batch move: cancelled or failed — nothing changed.');
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
