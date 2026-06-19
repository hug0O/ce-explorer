import * as vscode from 'vscode';

export enum MemberKind {
    Method = 'method',
    Field = 'field',
    Property = 'property',
    Constructor = 'constructor',
    Destructor = 'destructor',
}

export enum Visibility {
    Private = 'private',
    Protected = 'protected',
    Public = 'public',
    Published = 'published',
    Internal = 'internal',
    Package = 'package',
}

export interface Parameter {
    name: string;
    type: string;
    defaultValue?: string;
    isConst?: boolean;
    isVar?: boolean;
    isOut?: boolean;
    direction?: 'in' | 'out' | 'inout';
}

export interface MethodModifier {
    name: string;
    value?: string;
}

export interface MemberSpec {
    kind: MemberKind;
    name: string;
    returnType?: string;
    visibility: Visibility;
    parameters: Parameter[];
    modifiers: MethodModifier[];
    isStatic: boolean;
    isVirtual: boolean;
    isAbstract: boolean;
    isOverride: boolean;
    isFinal: boolean;
    documentation?: string;
}

export interface FieldSpec {
    kind: MemberKind.Field;
    name: string;
    type: string;
    visibility: Visibility;
    defaultValue?: string;
    documentation?: string;
}

export interface PropertySpec {
    kind: MemberKind.Property;
    name: string;
    type: string;
    visibility: Visibility;
    hasGetter: boolean;
    getterName?: string;
    hasSetter: boolean;
    setterName?: string;
    isDefault: boolean;
    isReadOnly: boolean;
    documentation?: string;
}

export type AnyMemberSpec = MemberSpec | FieldSpec | PropertySpec;

export interface ClassMember {
    id: string;
    kind: MemberKind;
    name: string;
    returnType?: string;
    type?: string;
    visibility: Visibility;
    parameters: Parameter[];
    modifiers: string[];
    isStatic: boolean;
    isVirtual: boolean;
    isAbstract: boolean;
    isOverride: boolean;
    range: vscode.Range;
    implementationRange?: vscode.Range;
    documentation?: string;
}

export interface ClassInfo {
    id: string;
    name: string;
    fullName?: string;
    parentClass?: string;
    interfaces: string[];
    members: ClassMember[];
    range: vscode.Range;
    declarationRange?: vscode.Range;
    isInterface: boolean;
    isRecord: boolean;
    isSealed: boolean;
    classType?: string;
    isSynthetic?: boolean;
    fileUri: vscode.Uri;
}

export interface ParsedDocument {
    uri: vscode.Uri;
    languageId: string;
    classes: ClassInfo[];
    standaloneProcedures: ClassMember[];
    imports: string[];
}

export interface InsertPosition {
    declaration: vscode.Position;
    implementation: vscode.Position;
    pairedFileUri?: vscode.Uri;
    pairedFileImplementation?: vscode.Position;
}

export interface GeneratedCode {
    declaration: string;
    implementation: string;
    declarationPosition: vscode.Position;
    implementationPosition: vscode.Position;
    pairedFileUri?: vscode.Uri;
    pairedFileDeclaration?: string;
    pairedFileImplementation?: string;
}

export interface CodeEdit {
    uri: vscode.Uri;
    range: vscode.Range;
    newText: string;
}

export interface RefactoringContext {
    document: vscode.TextDocument;
    position: vscode.Position;
    range?: vscode.Range;
    selection?: vscode.Selection;
}

export interface SortScheme {
    name: string;
    order: MemberKind[];
    groupByVisibility: boolean;
    visibilityOrder: Visibility[];
}

export const DEFAULT_SORT_SCHEMES: Record<string, SortScheme> = {
    fieldsFirst: {
        name: 'Fields First',
        order: [MemberKind.Field, MemberKind.Property, MemberKind.Constructor, MemberKind.Destructor, MemberKind.Method],
        groupByVisibility: true,
        visibilityOrder: [Visibility.Published, Visibility.Public, Visibility.Protected, Visibility.Private],
    },
    methodsFirst: {
        name: 'Methods First',
        order: [MemberKind.Constructor, MemberKind.Destructor, MemberKind.Method, MemberKind.Property, MemberKind.Field],
        groupByVisibility: true,
        visibilityOrder: [Visibility.Published, Visibility.Public, Visibility.Protected, Visibility.Private],
    },
    visibilityGrouped: {
        name: 'Visibility Grouped',
        order: [MemberKind.Constructor, MemberKind.Field, MemberKind.Property, MemberKind.Method, MemberKind.Destructor],
        groupByVisibility: true,
        visibilityOrder: [Visibility.Public, Visibility.Published, Visibility.Protected, Visibility.Private],
    },
};
