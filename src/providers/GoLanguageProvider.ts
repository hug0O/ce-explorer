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
    return `go_${Date.now()}_${++_idCounter}`;
}

export class GoLanguageProvider extends BaseLanguageProvider {
    readonly languageId = 'go';
    readonly fileExtensions = ['.go'];
    readonly displayName = 'Go';

    private static readonly RE_STRUCT = /^\s*type\s+(\w+)\s+struct\s*\{?/;
    private static readonly RE_INTERFACE = /^\s*type\s+(\w+)\s+interface\s*\{?/;
    private static readonly RE_METHOD = /^\s*func\s+\(\s*(\w+)\s+\*?(\w+)\s*\)\s+(\w+)\s*\(([^)]*)\)\s*(?:\(?\*?([\w.\[\]*]+)\)?)?\s*\{?/;
    private static readonly RE_FUNC = /^\s*func\s+(\w+)\s*\(([^)]*)\)\s*(?:\(?\*?([\w.\[\]*]+)\)?)?\s*\{?/;
    private static readonly RE_FIELD = /^\s*(\w+)\s+([\w.*\[\]]+)/;
    private static readonly RE_PACKAGE = /^\s*package\s+(\w+)/;
    private static readonly RE_IMPORT = /^\s*"([^"]+)"/;

    getDefaultVisibility(): Visibility {
        return Visibility.Private;
    }

    getVisibilityModifiers(): Visibility[] {
        return [Visibility.Public, Visibility.Private];
    }

    getAvailableModifiers(): string[] {
        return [];
    }

    getTypeDefaults() {
        return { defaultReturnType: 'error', defaultFieldType: 'string', defaultPropertyType: 'string', defaultParamType: 'int' };
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
        let inImportBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (trimmed === 'import (') {
                inImportBlock = true;
                continue;
            }
            if (inImportBlock && trimmed === ')') {
                inImportBlock = false;
                continue;
            }

            const importMatch = trimmed.match(GoLanguageProvider.RE_IMPORT);
            if (importMatch) {
                imports.push(importMatch[1]);
                continue;
            }

            if (trimmed.startsWith('import ')) {
                const singleImport = trimmed.match(/^import\s+"([^"]+)"/);
                if (singleImport) {
                    imports.push(singleImport[1]);
                }
                continue;
            }
        }

        this.parseTypes(lines, document.uri, classes);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            const methodMatch = trimmed.match(GoLanguageProvider.RE_METHOD);
            if (methodMatch) {
                const receiverVar = methodMatch[1];
                const receiverType = methodMatch[2];
                const methodName = methodMatch[3];

                for (const cls of classes) {
                    if (cls.name === receiverType) {
                        let found = false;
                        for (const m of cls.members) {
                            if (m.name === methodName) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            const params = this.parseParameters(methodMatch[4]);
                            const returnType = methodMatch[5] ? methodMatch[5].trim() : undefined;
                            const isExported = methodName[0] === methodName[0].toUpperCase();
                            const visibility = isExported ? Visibility.Public : Visibility.Private;

                            const range = new vscode.Range(i, 0, i, line.length);
                            const methodEnd = this.findBraceEnd(lines, i, lines.length);
                            cls.members.push({
                                id: uniqueId(),
                                kind: MemberKind.Method,
                                name: methodName,
                                returnType,
                                visibility,
                                parameters: params,
                                modifiers: [receiverVar],
                                isStatic: false,
                                isVirtual: false,
                                isAbstract: false,
                                isOverride: false,
                                range,
                                implementationRange: methodEnd > i
                                    ? new vscode.Range(i, 0, methodEnd, lines[methodEnd]?.length ?? 0)
                                    : undefined,
                            });
                        }
                    }
                }
            }

            const funcMatch = trimmed.match(GoLanguageProvider.RE_FUNC);
            if (funcMatch && !trimmed.includes('(') || (funcMatch && !trimmed.match(GoLanguageProvider.RE_METHOD))) {
                const funcName = funcMatch[1];
                const isExported = funcName[0] === funcName[0].toUpperCase();

                const range = new vscode.Range(i, 0, i, line.length);
                standaloneProcedures.push({
                    id: uniqueId(),
                    kind: MemberKind.Method,
                    name: funcName,
                    returnType: funcMatch[3] ? funcMatch[3].trim() : undefined,
                    visibility: isExported ? Visibility.Public : Visibility.Private,
                    parameters: this.parseParameters(funcMatch[2]),
                    modifiers: [],
                    isStatic: false,
                    isVirtual: false,
                    isAbstract: false,
                    isOverride: false,
                    range,
                });
            }
        }

        return {
            uri: document.uri,
            languageId: this.languageId,
            classes,
            standaloneProcedures,
            imports,
        };
    }

    private parseTypes(lines: string[], uri: vscode.Uri, classes: ClassInfo[]): void {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            let name: string | undefined;
            let isInterface = false;
            let isRecord = false;
            let classType: string | undefined;

            const structMatch = trimmed.match(GoLanguageProvider.RE_STRUCT);
            const interfaceMatch = trimmed.match(GoLanguageProvider.RE_INTERFACE);

            if (structMatch) {
                name = structMatch[1];
                isRecord = true;
                classType = 'struct';
            } else if (interfaceMatch) {
                name = interfaceMatch[1];
                isInterface = true;
                classType = 'interface';
            } else {
                continue;
            }

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
            const members = this.parseStructBody(lines, startLine + 1, endLine);

            const classInfo: ClassInfo = {
                id: uniqueId(),
                name,
                fullName: name,
                classType,
                parentClass: undefined,
                interfaces: [],
                members,
                range: classRange,
                isInterface,
                isRecord,
                isSealed: false,
                fileUri: uri,
            };

            classes.push(classInfo);
            i = endLine;
        }
    }

    private parseStructBody(lines: string[], startLine: number, endLine: number): ClassMember[] {
        const members: ClassMember[] = [];

        for (let i = startLine; i < endLine; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
                continue;
            }

            const fieldMatch = trimmed.match(GoLanguageProvider.RE_FIELD);
            if (fieldMatch) {
                const fieldName = fieldMatch[1];
                const fieldType = fieldMatch[2].trim();

                if (fieldName === 'func' || fieldName === 'type' || fieldName === 'struct' || fieldName === 'interface') {
                    continue;
                }

                const isExported = fieldName[0] === fieldName[0].toUpperCase();
                const visibility = isExported ? Visibility.Public : Visibility.Private;

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Field,
                    name: fieldName,
                    type: fieldType,
                    visibility,
                    parameters: [],
                    modifiers: [],
                    isStatic: false,
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

    rewriteStandaloneFunction(currentText: string, spec: MemberSpec): string | undefined {
        const firstBrace = currentText.indexOf('{');
        const lastBrace = currentText.lastIndexOf('}');
        if (firstBrace < 0 || lastBrace <= firstBrace) return undefined;
        const body = currentText.substring(firstBrace + 1, lastBrace);
        const params = spec.parameters.map(p => `${p.name} ${p.type || 'interface{}'}`).join(', ');
        const ret = (spec.returnType && spec.returnType !== 'void') ? ` ${spec.returnType}` : '';
        return `func ${spec.name}(${params})${ret} {${body}}\n`;
    }

    // Go methods are top-level `func (r Receiver)` declarations, not class-body
    // members, so the generic class-body stub insertion does not apply. Disabled
    // here to avoid generating malformed code.
    generateMissingStubs(_className: string, _interfaceInfo: ClassInfo, _classInfo: ClassInfo): string | undefined {
        return undefined;
    }

    private parseParameters(paramsStr: string): Parameter[] {
        const params: Parameter[] = [];
        if (!paramsStr.trim()) return params;

        let depth = 0;
        let current = '';
        for (const ch of paramsStr) {
            if (ch === '(' || ch === '[') depth++;
            if (ch === ')' || ch === ']') depth--;
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
        const parts = trimmed.split(/\s+/).filter(Boolean);

        if (parts.length >= 2) {
            const type = parts[parts.length - 1];
            const names = parts.slice(0, parts.length - 1);
            if (names.length === 1) {
                return { name: names[0], type };
            }
            return { name: names.join(', '), type };
        }

        if (parts.length === 1) {
            return { name: '', type: parts[0] };
        }

        return { name: trimmed, type: 'interface{}' };
    }

    private findBraceEnd(lines: string[], start: number, endLine: number): number {
        let depth = 0;
        let found = false;
        for (let i = start; i < endLine; i++) {
            for (const ch of lines[i]) {
                if (ch === '{') { depth++; found = true; }
                else if (ch === '}') { depth--; }
            }
            if (found && depth <= 0) return i;
        }
        return -1;
    }

    private getReceiverVar(typeName: string): string {
        return typeName.charAt(0).toLowerCase();
    }

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo, existingBody?: string): GeneratedCode {
        const indent = '\t';
        const recv = this.getReceiverVar(className);
        const params = spec.parameters.map(p => `${p.name} ${p.type}`).join(', ');
        const returnType = spec.returnType ? ` ${spec.returnType}` : '';

        let declaration: string;
        if (spec.kind === MemberKind.Constructor) {
            const body = existingBody !== undefined ? `\n${existingBody}` : `\n${indent}// TODO: implement\n${indent}return &${className}{}\n`;
            declaration = `func New${className}(${params}) *${className} {${body}}\n`;
        } else {
            const body = existingBody !== undefined ? `\n${existingBody}` : `\n${indent}// TODO: implement\n`;
            declaration = `func (${recv} *${className}) ${spec.name}(${params})${returnType} {${body}}\n`;
        }

        const insertPos = new vscode.Position(classInfo.range.end.line + 1, 0);

        return {
            declaration,
            implementation: '',
            declarationPosition: insertPos,
            implementationPosition: insertPos,
        };
    }

    generateField(className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode {
        const indent = '\t';
        const decl = `${indent}${spec.name} ${spec.type}\n`;

        const insertPos = new vscode.Position(classInfo.range.end.line, 0);

        return {
            declaration: decl,
            implementation: '',
            declarationPosition: insertPos,
            implementationPosition: insertPos,
        };
    }

    generateProperty(className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode {
        const indent = '\t';
        const recv = this.getReceiverVar(className);
        let declaration = '';

        if (spec.hasGetter) {
            declaration += `func (${recv} *${className}) ${spec.name}() ${spec.type} {\n${indent}return ${recv}.${spec.name[0].toLowerCase() + spec.name.substring(1)}\n}\n`;
        }
        if (spec.hasSetter) {
            const setterName = `Set${spec.name.charAt(0).toUpperCase() + spec.name.substring(1)}`;
            declaration += `func (${recv} *${className}) ${setterName}(value ${spec.type}) {\n${indent}${recv}.${spec.name[0].toLowerCase() + spec.name.substring(1)} = value\n}\n`;
        }

        const insertPos = new vscode.Position(classInfo.range.end.line + 1, 0);

        return {
            declaration,
            implementation: '',
            declarationPosition: insertPos,
            implementationPosition: insertPos,
        };
    }

    getInsertPosition(
        _document: vscode.TextDocument,
        classInfo: ClassInfo,
        memberKind: 'method' | 'field' | 'property'
    ): InsertPosition {
        if (memberKind === 'field') {
            const fields = classInfo.members.filter(m => m.kind === MemberKind.Field);
            if (fields.length > 0) {
                const lastField = fields.reduce((a, b) => a.range.end.line > b.range.end.line ? a : b);
                return {
                    declaration: new vscode.Position(lastField.range.end.line + 1, 0),
                    implementation: new vscode.Position(lastField.range.end.line + 1, 0),
                };
            }
            return {
                declaration: new vscode.Position(classInfo.range.start.line + 1, 0),
                implementation: new vscode.Position(classInfo.range.start.line + 1, 0),
            };
        }
        const pos = new vscode.Position(classInfo.range.end.line + 1, 0);
        return {
            declaration: pos,
            implementation: pos,
        };
    }
}
