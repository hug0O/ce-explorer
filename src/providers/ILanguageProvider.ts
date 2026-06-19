import * as vscode from 'vscode';
import {
    ParsedDocument,
    ClassInfo,
    ClassMember,
    MemberSpec,
    FieldSpec,
    PropertySpec,
    GeneratedCode,
    InsertPosition,
    RefactoringContext,
    SortScheme,
    Visibility,
    MemberKind,
} from '../models/types';

export interface TypeDefaults {
    defaultReturnType: string;
    defaultFieldType: string;
    defaultPropertyType: string;
    defaultParamType: string;
}

export interface ILanguageProvider {
    readonly languageId: string;
    readonly fileExtensions: string[];
    readonly displayName: string;

    parseDocument(document: vscode.TextDocument): ParsedDocument;

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo, existingBody?: string): GeneratedCode;

    generateField(className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode;

    generateProperty(className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode;

    getInsertPosition(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        memberKind: 'method' | 'field' | 'property'
    ): InsertPosition;

    getVisibilityModifiers(): Visibility[];

    getAvailableModifiers(): string[];

    getDefaultVisibility(): Visibility;

    getTypeDefaults(): TypeDefaults;

    findPairedFile(uri: vscode.Uri): vscode.Uri | undefined;

    synchronizeDeclarationImplementation(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        member: ClassMember
    ): vscode.TextEdit[];

    sortMembers(members: ClassMember[], scheme: SortScheme): ClassMember[];

    extractMethod(context: RefactoringContext, methodName: string, parameters: string[], returnType: string): vscode.TextEdit[];

    findMemberAtPosition(document: vscode.TextDocument, position: vscode.Position): ClassMember | undefined;

    findClassAtPosition(document: vscode.TextDocument, position: vscode.Position): ClassInfo | undefined;

    /**
     * Rewrite a file-level (standalone) function in place: replace its signature
     * with the new spec while preserving the existing body. Returns the full new
     * function text, or undefined if the provider does not support this.
     */
    rewriteStandaloneFunction(currentText: string, spec: MemberSpec): string | undefined;

    /**
     * Generate stub declarations for every method declared on `interfaceInfo`
     * that is not already implemented by `classInfo`. Returns the concatenated
     * declaration text (ready to insert into the class body), or undefined when
     * the provider does not support interface stubs or there is nothing missing.
     */
    generateMissingStubs(className: string, interfaceInfo: ClassInfo, classInfo: ClassInfo): string | undefined;

    getDeclarationRange(document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined;

    getImplementationRange(document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined;
}

export abstract class BaseLanguageProvider implements ILanguageProvider {
    abstract readonly languageId: string;
    abstract readonly fileExtensions: string[];
    abstract readonly displayName: string;

    abstract parseDocument(document: vscode.TextDocument): ParsedDocument;
    abstract generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo, existingBody?: string): GeneratedCode;
    abstract generateField(className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode;
    abstract generateProperty(className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode;
    abstract getInsertPosition(document: vscode.TextDocument, classInfo: ClassInfo, memberKind: 'method' | 'field' | 'property'): InsertPosition;

    getVisibilityModifiers(): Visibility[] {
        return [Visibility.Private, Visibility.Protected, Visibility.Public];
    }

    getAvailableModifiers(): string[] {
        return ['static', 'virtual', 'abstract', 'override', 'final', 'const'];
    }

    abstract getDefaultVisibility(): Visibility;

    findPairedFile(uri: vscode.Uri): vscode.Uri | undefined {
        return undefined;
    }

    synchronizeDeclarationImplementation(
        _document: vscode.TextDocument,
        _classInfo: ClassInfo,
        _member: ClassMember
    ): vscode.TextEdit[] {
        return [];
    }

    sortMembers(members: ClassMember[], scheme: SortScheme): ClassMember[] {
        const kindOrder = new Map(scheme.order.map((k, i) => [k, i]));
        const visOrder = new Map(scheme.visibilityOrder.map((v, i) => [v, i]));

        return [...members].sort((a, b) => {
            const kindA = kindOrder.get(a.kind) ?? 999;
            const kindB = kindOrder.get(b.kind) ?? 999;
            if (kindA !== kindB) { return kindA - kindB; }

            if (scheme.groupByVisibility) {
                const visA = visOrder.get(a.visibility) ?? 999;
                const visB = visOrder.get(b.visibility) ?? 999;
                if (visA !== visB) { return visA - visB; }
            }

            return a.name.localeCompare(b.name);
        });
    }

    extractMethod(
        _context: RefactoringContext,
        _methodName: string,
        _parameters: string[],
        _returnType: string
    ): vscode.TextEdit[] {
        return [];
    }

    findMemberAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): ClassMember | undefined {
        const parsed = this.parseDocument(document);
        for (const cls of parsed.classes) {
            for (const member of cls.members) {
                if (member.range.contains(position) || member.implementationRange?.contains(position)) {
                    return member;
                }
            }
        }
        return undefined;
    }

    findClassAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): ClassInfo | undefined {
        const parsed = this.parseDocument(document);
        return parsed.classes.find(cls => cls.range.contains(position));
    }

    getDeclarationRange(_document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined {
        return member.range;
    }

    getImplementationRange(_document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined {
        return member.implementationRange;
    }

    rewriteStandaloneFunction(_currentText: string, _spec: MemberSpec): string | undefined {
        return undefined;
    }

    /**
     * Default Implement/Override implementation: reuse each provider's own
     * generateMethod to produce a stub for every interface method that the
     * target class does not yet declare. Providers whose class-body layout
     * cannot host plain method stubs (e.g. Rust impl blocks, Go receivers)
     * override this to return undefined.
     */
    generateMissingStubs(className: string, interfaceInfo: ClassInfo, classInfo: ClassInfo): string | undefined {
        const existing = new Set(classInfo.members.map(m => m.name));
        const parts: string[] = [];
        for (const m of interfaceInfo.members) {
            if (existing.has(m.name)) {
                continue;
            }
            if (m.kind === MemberKind.Method) {
                const spec: MemberSpec = {
                    kind: MemberKind.Method,
                    name: m.name,
                    returnType: m.returnType || undefined,
                    visibility: m.visibility,
                    parameters: m.parameters,
                    modifiers: [],
                    isStatic: m.isStatic,
                    isVirtual: false,
                    isAbstract: false,
                    isOverride: false,
                    isFinal: false,
                };
                const gen = this.generateMethod(className, spec, classInfo);
                if (gen.declaration) {
                    parts.push(gen.declaration);
                }
            } else if (m.kind === MemberKind.Property) {
                const spec: PropertySpec = {
                    kind: MemberKind.Property,
                    name: m.name,
                    type: m.type || m.returnType || 'object',
                    visibility: m.visibility,
                    hasGetter: true,
                    hasSetter: true,
                    isDefault: false,
                    isReadOnly: false,
                };
                const gen = this.generateProperty(className, spec, classInfo);
                if (gen.declaration) {
                    parts.push(gen.declaration);
                }
            }
        }
        return parts.length > 0 ? parts.join('\n') : undefined;
    }

    getTypeDefaults(): TypeDefaults {
        return {
            defaultReturnType: 'void',
            defaultFieldType: 'int',
            defaultPropertyType: 'string',
            defaultParamType: 'int',
        };
    }
}
