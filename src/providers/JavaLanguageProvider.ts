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
    Visibility,
    MemberKind,
    Parameter,
} from '../models/types';
import { BaseLanguageProvider } from './ILanguageProvider';

let _idCounter = 0;
function uniqueId(): string {
    return `java_${Date.now()}_${++_idCounter}`;
}

export class JavaLanguageProvider extends BaseLanguageProvider {
    readonly languageId = 'java';
    readonly fileExtensions = ['.java'];
    readonly displayName = 'Java';

    private static readonly RE_CLASS = /^\s*(public\s+|protected\s+|private\s+)?((?:abstract|final|static)\s+)*(class|interface|enum)\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/;
    private static readonly RE_CONSTRUCTOR = /^\s*(public|protected|private)\s+((?:static|final|abstract|synchronized|native)\s+)*(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\s*\{/;
    private static readonly RE_METHOD = /^\s*(public|protected|private)\s+((?:static|final|abstract|synchronized|native)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*\(([^)]*)\)/;
    private static readonly RE_FIELD = /^\s*(public|protected|private)\s+((?:static|final|volatile|transient)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*(?:=\s*[^;]+)?\s*;/;
    private static readonly RE_PACKAGE = /^\s*package\s+([^;]+);/;
    private static readonly RE_IMPORT = /^\s*import\s+([^;]+);/;

    getDefaultVisibility(): Visibility {
        return Visibility.Package;
    }

    getVisibilityModifiers(): Visibility[] {
        return [Visibility.Public, Visibility.Protected, Visibility.Private, Visibility.Package];
    }

    getAvailableModifiers(): string[] {
        return ['static', 'final', 'abstract', 'synchronized', 'native'];
    }

    getTypeDefaults() {
        return { defaultReturnType: 'void', defaultFieldType: 'int', defaultPropertyType: 'String', defaultParamType: 'int' };
    }

    findPairedFile(_uri: vscode.Uri): vscode.Uri | undefined {
        return undefined;
    }

    parseDocument(document: vscode.TextDocument): ParsedDocument {
        const text = document.getText();
        const lines = text.split(/\r?\n/);
        const classes: ClassInfo[] = [];
        const imports: string[] = [];
        const standaloneProcedures: ClassMember[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const importMatch = line.match(JavaLanguageProvider.RE_IMPORT);
            if (importMatch) {
                imports.push(importMatch[1].trim());
                continue;
            }
        }

        this.parseClasses(lines, document.uri, classes);

        return {
            uri: document.uri,
            languageId: this.languageId,
            classes,
            standaloneProcedures,
            imports,
        };
    }

    private parseClasses(lines: string[], uri: vscode.Uri, classes: ClassInfo[]): void {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            const classMatch = trimmed.match(JavaLanguageProvider.RE_CLASS);
            if (!classMatch) continue;

            const keyword = classMatch[3];
            const className = classMatch[4];
            const parentClass = classMatch[5];
            const interfacesStr = classMatch[6];

            const interfaces: string[] = [];
            if (interfacesStr) {
                interfaces.push(...interfacesStr.split(',').map(s => s.trim()).filter(Boolean));
            }

            const isInterface = keyword === 'interface';
            const isRecord = keyword === 'enum';
            const prefixMods = classMatch[2] || '';
            const isSealed = prefixMods.includes('final');
            const classType = keyword === 'class'
                ? (prefixMods.includes('abstract') ? 'abstract class' : 'class')
                : keyword;

            let startLine = i;
            for (let scan = i; scan < lines.length; scan++) {
                if (lines[scan].includes('{')) {
                    startLine = scan;
                    break;
                }
            }

            let endLine = startLine;
            let braceDepth = 0;
            let foundOpen = false;
            for (let scan = startLine; scan < lines.length; scan++) {
                for (const ch of lines[scan]) {
                    if (ch === '{') { braceDepth++; foundOpen = true; }
                    if (ch === '}') { braceDepth--; }
                }
                if (foundOpen && braceDepth <= 0) {
                    endLine = scan;
                    break;
                }
            }

            const classRange = new vscode.Range(startLine, 0, endLine, lines[endLine]?.length ?? 0);
            const members = this.parseClassBody(lines, startLine + 1, endLine, className);

            const classInfo: ClassInfo = {
                id: uniqueId(),
                name: className,
                fullName: className,
                classType,
                parentClass,
                interfaces,
                members,
                range: classRange,
                isInterface,
                isRecord,
                isSealed,
                fileUri: uri,
            };

            classes.push(classInfo);
            i = endLine;
        }
    }

    private parseClassBody(lines: string[], startLine: number, endLine: number, className: string): ClassMember[] {
        const members: ClassMember[] = [];
        let currentVisibility = Visibility.Package;

        for (let i = startLine; i < endLine; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('@')) {
                continue;
            }

            const ctorMatch = trimmed.match(JavaLanguageProvider.RE_CONSTRUCTOR);
            if (ctorMatch && ctorMatch[3] === className) {
                const visStr = ctorMatch[1];
                const modStr = ctorMatch[2] || '';
                const ctorName = ctorMatch[3];
                const paramsStr = ctorMatch[4];

                currentVisibility = this.mapVisibility(visStr);
                const params = this.parseParameters(paramsStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Constructor,
                    name: ctorName,
                    visibility: currentVisibility,
                    parameters: params,
                    modifiers,
                    isStatic: false,
                    isVirtual: false,
                    isAbstract: false,
                    isOverride: false,
                    range,
                });
                continue;
            }

            const methodMatch = trimmed.match(JavaLanguageProvider.RE_METHOD);
            if (methodMatch) {
                const visStr = methodMatch[1];
                const modStr = methodMatch[2] || '';
                const returnType = methodMatch[3].trim();
                const methodName = methodMatch[4];
                const paramsStr = methodMatch[5];

                currentVisibility = this.mapVisibility(visStr);
                const params = this.parseParameters(paramsStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Method,
                    name: methodName,
                    returnType,
                    visibility: currentVisibility,
                    parameters: params,
                    modifiers,
                    isStatic: modStr.includes('static'),
                    isVirtual: false,
                    isAbstract: modStr.includes('abstract'),
                    isOverride: false,
                    range,
                });
                continue;
            }

            const fieldMatch = trimmed.match(JavaLanguageProvider.RE_FIELD);
            if (fieldMatch) {
                const visStr = fieldMatch[1];
                const modStr = fieldMatch[2] || '';
                const fieldType = fieldMatch[3].trim();
                const fieldName = fieldMatch[4].trim();

                currentVisibility = this.mapVisibility(visStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Field,
                    name: fieldName,
                    type: fieldType,
                    visibility: currentVisibility,
                    parameters: [],
                    modifiers,
                    isStatic: modStr.includes('static'),
                    isVirtual: false,
                    isAbstract: false,
                    isOverride: false,
                    range,
                });
                continue;
            }
        }

        return members;
    }

    private mapVisibility(vis: string): Visibility {
        switch (vis) {
            case 'public': return Visibility.Public;
            case 'protected': return Visibility.Protected;
            case 'private': return Visibility.Private;
            default: return Visibility.Package;
        }
    }

    private parseParameters(paramsStr: string): Parameter[] {
        const params: Parameter[] = [];
        if (!paramsStr.trim()) return params;

        let depth = 0;
        let current = '';
        for (const ch of paramsStr) {
            if (ch === '<') depth++;
            if (ch === '>') depth--;
            if (ch === ',' && depth === 0) {
                params.push(this.parseSingleParam(current));
                current = '';
            } else {
                current += ch;
            }
        }
        if (current.trim()) {
            params.push(this.parseSingleParam(current));
        }
        return params;
    }

    private parseSingleParam(param: string): Parameter {
        const trimmed = param.trim();
        const tokens = trimmed.split(/\s+/).filter(Boolean);

        if (tokens.length >= 2) {
            const name = tokens[tokens.length - 1];
            const type = tokens.slice(0, tokens.length - 1).join(' ');
            return { name, type };
        }

        return { name: trimmed, type: 'Object' };
    }

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo): GeneratedCode {
        const indent = '    ';
        const params = spec.parameters.map(p => `${p.type} ${p.name}`).join(', ');
        const vis = this.visibilityString(spec.visibility);

        const modStr = spec.modifiers.map(m => m.name).join(' ');
        const modPrefix = modStr ? modStr + ' ' : '';
        const staticPrefix = spec.isStatic ? 'static ' : '';

        let declaration: string;
        if (spec.kind === MemberKind.Constructor) {
            declaration = `${indent}${vis}${modPrefix}${className}(${params}) {\n${indent}${indent}// TODO: implement\n${indent}}\n`;
        } else {
            const returnType = spec.returnType ?? 'void';
            declaration = `${indent}${vis}${modPrefix}${staticPrefix}${returnType} ${spec.name}(${params}) {\n${indent}${indent}// TODO: implement\n${indent}}\n`;
        }

        const insertPos = this.getInsertPositionForClass(classInfo, 'method');

        return {
            declaration: declaration + '\n',
            implementation: '',
            declarationPosition: insertPos,
            implementationPosition: insertPos,
        };
    }

    generateField(_className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode {
        const indent = '    ';
        const vis = this.visibilityString(spec.visibility);

        let decl = `${indent}${vis}${spec.type} ${spec.name}`;
        if (spec.defaultValue) {
            decl += ` = ${spec.defaultValue}`;
        }
        decl += ';\n';

        const insertPos = this.getInsertPositionForClass(classInfo, 'field');

        return {
            declaration: decl,
            implementation: '',
            declarationPosition: insertPos,
            implementationPosition: insertPos,
        };
    }

    generateProperty(className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode {
        const indent = '    ';
        const vis = this.visibilityString(spec.visibility);
        const fieldName = spec.name.charAt(0).toLowerCase() + spec.name.substring(1);

        let declaration = '';

        if (spec.hasGetter) {
            declaration += `${indent}${vis}${spec.type} get${spec.name.charAt(0).toUpperCase() + spec.name.substring(1)}() {\n${indent}${indent}return ${fieldName};\n${indent}}\n`;
        }
        if (spec.hasSetter) {
            declaration += `${indent}${vis}void set${spec.name.charAt(0).toUpperCase() + spec.name.substring(1)}(${spec.type} ${fieldName}) {\n${indent}${indent}this.${fieldName} = ${fieldName};\n${indent}}\n`;
        }

        const insertPos = this.getInsertPositionForClass(classInfo, 'property');

        return {
            declaration,
            implementation: '',
            declarationPosition: insertPos,
            implementationPosition: insertPos,
        };
    }

    private visibilityString(vis: Visibility): string {
        switch (vis) {
            case Visibility.Public: return 'public ';
            case Visibility.Protected: return 'protected ';
            case Visibility.Private: return 'private ';
            default: return '';
        }
    }

    private getInsertPositionForClass(classInfo: ClassInfo, memberKind: 'method' | 'field' | 'property'): vscode.Position {
        if (memberKind === 'field') {
            const fields = classInfo.members.filter(m => m.kind === MemberKind.Field);
            if (fields.length > 0) {
                const lastField = fields.reduce((a, b) => a.range.end.line > b.range.end.line ? a : b);
                return new vscode.Position(lastField.range.end.line + 1, 0);
            }
            return new vscode.Position(classInfo.range.start.line + 1, 0);
        }
        return new vscode.Position(classInfo.range.end.line, 0);
    }

    getInsertPosition(
        _document: vscode.TextDocument,
        classInfo: ClassInfo,
        memberKind: 'method' | 'field' | 'property'
    ): InsertPosition {
        const pos = this.getInsertPositionForClass(classInfo, memberKind);
        return {
            declaration: pos,
            implementation: pos,
        };
    }
}
