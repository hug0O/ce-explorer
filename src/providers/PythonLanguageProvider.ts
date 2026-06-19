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
    return `py_${Date.now()}_${++_idCounter}`;
}

export class PythonLanguageProvider extends BaseLanguageProvider {
    readonly languageId = 'python';
    readonly fileExtensions = ['.py'];
    readonly displayName = 'Python';

    private static readonly RE_CLASS = /^\s*class\s+(\w+)(?:\(([^)]*)\))?\s*:/;
    private static readonly RE_METHOD = /^\s+(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^{]+?))?\s*:/;
    private static readonly RE_FIELD_INIT = /self\.(\w+)\s*=\s*(.+)/;
    private static readonly RE_FIELD_CLASS = /^\s+(\w+)\s*=\s*(.+)/;
    private static readonly RE_IMPORT = /^\s*(?:from\s+([\w.]+)\s+)?import\s+([^#\n]+)/;
    private static readonly RE_DECORATOR = /^\s*@(\w+)(?:\(([^)]*)\))?/;

    getDefaultVisibility(): Visibility {
        return Visibility.Public;
    }

    getVisibilityModifiers(): Visibility[] {
        return [Visibility.Public, Visibility.Protected, Visibility.Private];
    }

    getAvailableModifiers(): string[] {
        return ['staticmethod', 'classmethod', 'property', 'abstract', 'async'];
    }

    getTypeDefaults() {
        return { defaultReturnType: 'None', defaultFieldType: 'Any', defaultPropertyType: 'str', defaultParamType: 'Any' };
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
            const importMatch = line.match(PythonLanguageProvider.RE_IMPORT);
            if (importMatch) {
                const from = importMatch[1];
                const what = importMatch[2].trim();
                imports.push(from ? `${from}.${what}` : what);
                continue;
            }
        }

        this.parseClasses(lines, document.uri, classes);

        const standalone = this.extractStandaloneFunctions(lines, classes);

        return {
            uri: document.uri,
            languageId: this.languageId,
            classes,
            standaloneProcedures: standalone,
            imports,
        };
    }

    private extractStandaloneFunctions(lines: string[], classes: ClassInfo[]): ClassMember[] {
        const result: ClassMember[] = [];
        const classRanges = classes.map(c => ({ start: c.range.start.line, end: c.range.end.line }));
        const inClass = (ln: number): boolean => classRanges.some(r => ln >= r.start && ln <= r.end);

        // Top-level functions start at column 0 (no indentation).
        // Class/instance methods are indented and live inside class bodies.
        const RE_DEF = /^(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^\n]+?))?\s*:/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (inClass(i)) continue;
            // must be at column 0 to be a module-level function
            if (/^\s/.test(line)) continue;
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const m = trimmed.match(RE_DEF);
            if (!m) continue;

            const name = m[1];
            const paramsStr = m[2];
            const returnType = m[3]?.trim();

            const endBody = this.findPythonBodyEnd(lines, i);
            result.push({
                id: uniqueId(),
                kind: MemberKind.Method,
                name,
                returnType,
                visibility: Visibility.Public,
                parameters: this.parseParameters(paramsStr || ''),
                modifiers: [],
                isStatic: false,
                isVirtual: false,
                isAbstract: false,
                isOverride: false,
                range: new vscode.Range(i, 0, i, line.length),
                implementationRange: endBody > i
                    ? new vscode.Range(i, 0, endBody, lines[endBody]?.length ?? 0)
                    : undefined,
            });
        }
        return result;
    }

    rewriteStandaloneFunction(currentText: string, spec: MemberSpec): string | undefined {
        const lines = currentText.split('\n');
        if (lines.length === 0) return undefined;
        // First non-empty line is the `def` header; the rest is the indented body.
        let headerIdx = 0;
        while (headerIdx < lines.length && lines[headerIdx].trim() === '') headerIdx++;
        if (headerIdx >= lines.length) return undefined;

        const params = spec.parameters.map(p => {
            let s = p.name;
            if (p.type && p.type !== 'Any') s += `: ${p.type}`;
            if (p.defaultValue) s += ` = ${p.defaultValue}`;
            return s;
        }).join(', ');
        const ret = (spec.returnType && spec.returnType !== 'None') ? ` -> ${spec.returnType}` : '';
        const prefix = /^[ \t]*/.exec(lines[headerIdx])?.[0] ?? '';
        const header = `${prefix}${/async/.test(lines[headerIdx]) ? 'async ' : ''}def ${spec.name}(${params})${ret}:`;
        const body = lines.slice(headerIdx + 1).join('\n');
        return `${header}\n${body}`;
    }

    private findPythonBodyEnd(lines: string[], defLine: number): number {
        for (let i = defLine + 1; i < lines.length; i++) {
            const l = lines[i];
            if (l.trim() === '') continue;
            // body lines are indented; first non-blank at column 0 ends the body
            if (/^[^\s]/.test(l)) return i - 1;
        }
        return lines.length - 1;
    }

    private parseClasses(lines: string[], uri: vscode.Uri, classes: ClassInfo[]): void {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const classMatch = line.match(PythonLanguageProvider.RE_CLASS);
            if (!classMatch) continue;

            const className = classMatch[1];
            const basesStr = classMatch[2];

            const parentClass: string | undefined = undefined;
            const interfaces: string[] = [];

            if (basesStr) {
                const bases = basesStr.split(',').map(s => s.trim()).filter(Boolean);
                for (const base of bases) {
                    if (interfaces.length === 0 && !parentClass) {
                        if (base.startsWith('ABC') || base.startsWith('Protocol') || /^[A-Z]/.test(base.charAt(0))) {
                            interfaces.push(base);
                        }
                    } else {
                        interfaces.push(base);
                    }
                }
            }

            const classIndent = line.match(/^(\s*)/)?.[1].length ?? 0;
            let endLine = i + 1;
            for (let scan = i + 1; scan < lines.length; scan++) {
                const scanLine = lines[scan];
                if (scanLine.trim() === '') continue;
                const scanIndent = scanLine.match(/^(\s*)/)?.[1].length ?? 0;
                if (scanIndent <= classIndent && scanLine.trim().length > 0) {
                    endLine = scan;
                    break;
                }
                if (scan === lines.length - 1) {
                    endLine = scan + 1;
                }
            }

            const classRange = new vscode.Range(i, 0, endLine - 1, lines[endLine - 1]?.length ?? 0);
            const members = this.parseClassBody(lines, i + 1, endLine, className);

            const classInfo: ClassInfo = {
                id: uniqueId(),
                name: className,
                fullName: className,
                classType: 'class',
                parentClass,
                interfaces,
                members,
                range: classRange,
                isInterface: false,
                isRecord: false,
                isSealed: false,
                fileUri: uri,
            };

            classes.push(classInfo);
            i = endLine - 1;
        }
    }

    private parseClassBody(lines: string[], startLine: number, endLine: number, className: string): ClassMember[] {
        const members: ClassMember[] = [];
        let pendingDecorators: string[] = [];

        for (let i = startLine; i < endLine; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
                continue;
            }

            const decoratorMatch = trimmed.match(PythonLanguageProvider.RE_DECORATOR);
            if (decoratorMatch) {
                pendingDecorators.push(decoratorMatch[1]);
                continue;
            }

            const methodMatch = line.match(PythonLanguageProvider.RE_METHOD);
            if (methodMatch) {
                const methodName = methodMatch[1];
                const paramsStr = methodMatch[2];
                const returnType = methodMatch[3] ? methodMatch[3].trim() : undefined;
                const decorators = [...pendingDecorators];
                pendingDecorators = [];

                const params = this.parseParameters(paramsStr);
                const firstParam = paramsStr.trim().split(',')[0]?.trim();

                const isStatic = decorators.includes('staticmethod') || decorators.includes('classmethod');
                const isClassMethod = decorators.includes('classmethod');
                const isProperty = decorators.includes('property');
                const isSetter = decorators.some(d => d.endsWith('.setter'));

                let memberKind = MemberKind.Method;
                if (methodName === '__init__') {
                    memberKind = MemberKind.Constructor;
                } else if (methodName === '__del__') {
                    memberKind = MemberKind.Destructor;
                } else if (isProperty) {
                    memberKind = MemberKind.Property;
                }

                const nameForVis = methodName;
                let visibility = Visibility.Public;
                if (nameForVis.startsWith('__') && !nameForVis.endsWith('__')) {
                    visibility = Visibility.Private;
                } else if (nameForVis.startsWith('_')) {
                    visibility = Visibility.Protected;
                }

                const range = new vscode.Range(i, 0, i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: memberKind,
                    name: methodName,
                    returnType,
                    visibility,
                    parameters: params,
                    modifiers: decorators,
                    isStatic,
                    isVirtual: false,
                    isAbstract: false,
                    isOverride: false,
                    range,
                });
                continue;
            }

            pendingDecorators = [];

            if (trimmed.includes('self.')) {
                const fieldMatch = trimmed.match(PythonLanguageProvider.RE_FIELD_INIT);
                if (fieldMatch) {
                    const fieldName = fieldMatch[1];
                    const fieldValue = fieldMatch[2].trim();

                    if (fieldName.startsWith('__')) continue;
                    if (fieldName === '_' || fieldName === '__') continue;

                    let visibility = Visibility.Public;
                    if (fieldName.startsWith('__')) {
                        visibility = Visibility.Private;
                    } else if (fieldName.startsWith('_')) {
                        visibility = Visibility.Protected;
                    }

                    const range = new vscode.Range(i, 0, i, line.length);
                    members.push({
                        id: uniqueId(),
                        kind: MemberKind.Field,
                        name: fieldName,
                        type: this.inferTypeFromValue(fieldValue),
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
        }

        return members;
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

        if (trimmed === 'self' || trimmed === 'cls') {
            return { name: trimmed, type: trimmed === 'self' ? 'Self' : 'type' };
        }

        if (trimmed.startsWith('*') || trimmed.startsWith('**')) {
            return { name: trimmed, type: 'Any' };
        }

        const colonIdx = trimmed.lastIndexOf(':');
        const eqIdx = trimmed.indexOf('=');

        if (colonIdx > 0 && (eqIdx < 0 || colonIdx < eqIdx)) {
            const name = trimmed.substring(0, colonIdx).trim();
            let type = trimmed.substring(colonIdx + 1).trim();
            let defaultValue: string | undefined;
            if (eqIdx > colonIdx) {
                defaultValue = type.substring(type.indexOf('=') + 1).trim();
                type = type.substring(0, type.indexOf('=')).trim();
            }
            return { name, type, defaultValue };
        }

        if (eqIdx > 0) {
            const name = trimmed.substring(0, eqIdx).trim();
            const defaultValue = trimmed.substring(eqIdx + 1).trim();
            return { name, type: 'Any', defaultValue };
        }

        return { name: trimmed, type: 'Any' };
    }

    private inferTypeFromValue(value: string): string {
        if (value === 'None') return 'None';
        if (/^\d+$/.test(value)) return 'int';
        if (/^\d+\.\d+$/.test(value)) return 'float';
        if (value.startsWith('"') || value.startsWith("'")) return 'str';
        if (value.startsWith('[')) return 'list';
        if (value.startsWith('{')) return 'dict';
        if (value === 'True' || value === 'False') return 'bool';
        return 'Any';
    }

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo): GeneratedCode {
        const indent = '    ';
        const params = spec.parameters.map(p => {
            let s = p.name;
            if (p.type && p.type !== 'Any') s += `: ${p.type}`;
            if (p.defaultValue) s += ` = ${p.defaultValue}`;
            return s;
        }).join(', ');

        const returnType = spec.returnType && spec.returnType !== 'None'
            ? ` -> ${spec.returnType}` : '';

        let declaration: string;
        if (spec.kind === MemberKind.Constructor) {
            declaration = `${indent}def __init__(self${params ? ', ' + params : ''})${returnType}:\n${indent}${indent}pass\n`;
        } else if (spec.isStatic) {
            declaration = `${indent}@staticmethod\n${indent}def ${spec.name}(${params})${returnType}:\n${indent}${indent}pass\n`;
        } else {
            declaration = `${indent}def ${spec.name}(self${params ? ', ' + params : ''})${returnType}:\n${indent}${indent}pass\n`;
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
        let decl = `${indent}self.${spec.name}`;
        if (spec.defaultValue) {
            decl += ` = ${spec.defaultValue}`;
        } else if (spec.type && spec.type !== 'Any') {
            decl += `: ${spec.type} = None`;
        } else {
            decl += ' = None';
        }
        decl += '\n';

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
        let declaration = '';

        if (spec.hasGetter) {
            declaration += `${indent}@property\n${indent}def ${spec.name}(self) -> ${spec.type}:\n${indent}${indent}return self._${spec.name}\n`;
        }
        if (spec.hasSetter) {
            declaration += `\n${indent}@${spec.name}.setter\n${indent}def ${spec.name}(self, value: ${spec.type}) -> None:\n${indent}${indent}self._${spec.name} = value\n`;
        }

        const insertPos = this.getInsertPositionForClass(classInfo, 'property');

        return {
            declaration,
            implementation: '',
            declarationPosition: insertPos,
            implementationPosition: insertPos,
        };
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
