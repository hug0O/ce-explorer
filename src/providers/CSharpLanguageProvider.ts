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
    return `cs_${Date.now()}_${++_idCounter}`;
}

export class CSharpLanguageProvider extends BaseLanguageProvider {
    readonly languageId = 'csharp';
    readonly fileExtensions = ['.cs'];
    readonly displayName = 'C#';

    private static readonly RE_CLASS = /^\s*(public|private|protected|internal)?\s*((?:abstract|sealed|static|partial)\s+)*(class|interface|struct|record|enum)\s+(\w+)(?:<[^>]*>)?(?:\s*:\s*((?:\w+(?:<[^>]*>)?\s*,?\s*)+))?/;
    private static readonly RE_METHOD = /^\s*(public|private|protected|internal)\s+((?:static|virtual|override|abstract|async|sealed|new)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*\(([^)]*)\)/;
    private static readonly RE_CONSTRUCTOR = /^\s*(public|private|protected|internal)\s+((?:static|virtual|override|abstract|async|sealed|new)\s+)*(\w+)\s*\(([^)]*)\)/;
    private static readonly RE_PROPERTY = /^\s*(public|private|protected|internal)\s+((?:static|virtual|override|abstract|async|sealed|new)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*\{[^}]*(?:get|set)[^}]*\}/;
    private static readonly RE_FIELD = /^\s*(public|private|protected|internal)\s+((?:static|readonly|volatile|const)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*(?:=\s*[^;]+)?\s*;/;
    private static readonly RE_USING = /^\s*using\s+([^;]+);/;

    getDefaultVisibility(): Visibility {
        return Visibility.Private;
    }

    getVisibilityModifiers(): Visibility[] {
        return [Visibility.Public, Visibility.Private, Visibility.Protected, Visibility.Internal];
    }

    getAvailableModifiers(): string[] {
        return ['static', 'virtual', 'override', 'abstract', 'async', 'sealed', 'readonly', 'const'];
    }

    getTypeDefaults() {
        return { defaultReturnType: 'void', defaultFieldType: 'int', defaultPropertyType: 'string', defaultParamType: 'int' };
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
            const usingMatch = line.match(CSharpLanguageProvider.RE_USING);
            if (usingMatch) {
                imports.push(usingMatch[1].trim());
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

            const classMatch = trimmed.match(CSharpLanguageProvider.RE_CLASS);
            if (!classMatch) continue;

            const keyword = classMatch[3];
            const className = classMatch[4];
            const inheritance = classMatch[5];
            const prefixMods = classMatch[2] || '';

            const parentClass: string | undefined = undefined;
            const interfaces: string[] = [];

            if (inheritance) {
                const parts = inheritance.split(',').map(s => s.trim()).filter(Boolean);
                if (parts.length > 0) {
                    for (const part of parts) {
                        interfaces.push(part);
                    }
                }
            }

            const isInterface = keyword === 'interface';
            const isRecord = keyword === 'struct' || keyword === 'record';
            const isSealed = prefixMods.includes('sealed');
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

        for (let i = startLine; i < endLine; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('[')) {
                continue;
            }

            const propMatch = trimmed.match(CSharpLanguageProvider.RE_PROPERTY);
            if (propMatch && !trimmed.includes('(')) {
                const visStr = propMatch[1];
                const modStr = propMatch[2] || '';
                const propType = propMatch[3].trim();
                const propName = propMatch[4];

                const visibility = this.mapVisibility(visStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);
                const isStatic = modStr.includes('static');

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Property,
                    name: propName,
                    type: propType,
                    visibility,
                    parameters: [],
                    modifiers,
                    isStatic,
                    isVirtual: modStr.includes('virtual'),
                    isAbstract: modStr.includes('abstract'),
                    isOverride: modStr.includes('override'),
                    range,
                });
                continue;
            }

            const ctorMatch = trimmed.match(CSharpLanguageProvider.RE_CONSTRUCTOR);
            if (ctorMatch && ctorMatch[3] === className) {
                const visStr = ctorMatch[1];
                const modStr = ctorMatch[2] || '';
                const ctorName = ctorMatch[3];
                const paramsStr = ctorMatch[4];

                const visibility = this.mapVisibility(visStr);
                const params = this.parseParameters(paramsStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Constructor,
                    name: ctorName,
                    visibility,
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

            const methodMatch = trimmed.match(CSharpLanguageProvider.RE_METHOD);
            if (methodMatch) {
                const visStr = methodMatch[1];
                const modStr = methodMatch[2] || '';
                const returnType = methodMatch[3].trim();
                const methodName = methodMatch[4];
                const paramsStr = methodMatch[5];

                const visibility = this.mapVisibility(visStr);
                const params = this.parseParameters(paramsStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Method,
                    name: methodName,
                    returnType,
                    visibility,
                    parameters: params,
                    modifiers,
                    isStatic: modStr.includes('static'),
                    isVirtual: modStr.includes('virtual'),
                    isAbstract: modStr.includes('abstract'),
                    isOverride: modStr.includes('override'),
                    range,
                });
                continue;
            }

            const fieldMatch = trimmed.match(CSharpLanguageProvider.RE_FIELD);
            if (fieldMatch) {
                const visStr = fieldMatch[1];
                const modStr = fieldMatch[2] || '';
                const fieldType = fieldMatch[3].trim();
                const fieldName = fieldMatch[4].trim();

                const visibility = this.mapVisibility(visStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Field,
                    name: fieldName,
                    type: fieldType,
                    visibility,
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
            case 'internal': return Visibility.Internal;
            default: return Visibility.Private;
        }
    }

    private parseParameters(paramsStr: string): Parameter[] {
        const params: Parameter[] = [];
        if (!paramsStr.trim()) return params;

        let depth = 0;
        let current = '';
        for (const ch of paramsStr) {
            if (ch === '<' || ch === '(') depth++;
            if (ch === '>' || ch === ')') depth--;
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
        let working = trimmed;

        let defaultValue: string | undefined;
        const eqIdx = working.lastIndexOf('=');
        if (eqIdx >= 0) {
            defaultValue = working.substring(eqIdx + 1).trim();
            working = working.substring(0, eqIdx).trim();
        }

        const tokens = working.split(/\s+/).filter(Boolean);

        const refOrOut = tokens.find(t => t === 'ref' || t === 'out' || t === 'params');
        const filteredTokens = tokens.filter(t => t !== 'ref' && t !== 'out' && t !== 'params');

        if (filteredTokens.length >= 2) {
            const name = filteredTokens[filteredTokens.length - 1];
            const type = filteredTokens.slice(0, filteredTokens.length - 1).join(' ');
            return {
                name,
                type,
                defaultValue,
                direction: refOrOut === 'out' ? 'out' : refOrOut === 'ref' ? 'inout' : undefined,
            };
        }

        return { name: trimmed, type: 'var', defaultValue };
    }

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo): GeneratedCode {
        const indent = '    ';
        const params = spec.parameters.map(p => {
            let s = '';
            if (p.direction === 'out') s += 'out ';
            else if (p.direction === 'inout') s += 'ref ';
            s += `${p.type} ${p.name}`;
            if (p.defaultValue) s += ` = ${p.defaultValue}`;
            return s;
        }).join(', ');

        const vis = this.visibilityString(spec.visibility);
        const modParts: string[] = [];
        if (spec.isStatic) modParts.push('static');
        if (spec.isVirtual) modParts.push('virtual');
        if (spec.isAbstract) modParts.push('abstract');
        if (spec.isOverride) modParts.push('override');
        for (const m of spec.modifiers) {
            if (!modParts.includes(m.name)) modParts.push(m.name);
        }
        const modStr = modParts.length ? modParts.join(' ') + ' ' : '';

        let declaration: string;
        if (spec.kind === MemberKind.Constructor) {
            declaration = `${indent}${vis}${modStr}${className}(${params})\n${indent}{\n${indent}${indent}throw new NotImplementedException();\n${indent}}\n`;
        } else {
            const returnType = spec.returnType ?? 'void';
            declaration = `${indent}${vis}${modStr}${returnType} ${spec.name}(${params})\n${indent}{\n${indent}${indent}throw new NotImplementedException();\n${indent}}\n`;
        }

        const insertPos = this.getInsertPositionForClass(classInfo, 'method');

        return {
            declaration,
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

    generateProperty(_className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode {
        const indent = '    ';
        const vis = this.visibilityString(spec.visibility);

        let getter = 'get;';
        let setter = spec.hasSetter ? ' set;' : '';

        let declaration = `${indent}${vis}${spec.type} ${spec.name} { ${getter}${setter} }\n`;

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
            case Visibility.Internal: return 'internal ';
            default: return 'private ';
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
