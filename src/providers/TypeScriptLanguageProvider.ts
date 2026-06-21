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
    RefactoringContext,
} from '../models/types';
import { BaseLanguageProvider } from './ILanguageProvider';

let _idCounter = 0;
function uniqueId(): string {
    return `ts_${Date.now()}_${++_idCounter}`;
}

export class TypeScriptLanguageProvider extends BaseLanguageProvider {
    readonly languageId = 'typescript';
    readonly fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    readonly displayName = 'TypeScript/JavaScript';

    private static readonly RE_CLASS = /^\s*(export\s+)?(default\s+)?(abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*\{?/;
    private static readonly RE_METHOD = /^\s*(?:(public|private|protected)\s+)?((?:static|abstract|async|override|readonly)\s+)*(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+?))?\s*[{;]/;
    private static readonly RE_PROPERTY = /^\s*(?:(public|private|protected)\s+)?((?:static|abstract|async|override|readonly)\s+)*(#?\w+)\s*(?::\s*([^;=]+?))?\s*[;=]/;
    private static readonly RE_CONSTRUCTOR = /^\s*(public|private|protected)?\s*constructor\s*\(([^)]*)\)/;
    private static readonly RE_GETTER = /^\s*(?:(public|private|protected)\s+)?((?:static|abstract|async|override|readonly)\s+)*get\s+(\w+)\s*\(\s*\)\s*(?::\s*([^{]+?))?\s*\{?/;
    private static readonly RE_IMPORT = /^\s*import\s+.*?from\s+['"]([^'"]+)['"]/;
    private static readonly RE_IMPORT2 = /^\s*import\s+['"]([^'"]+)['"]/;

    private isJavaScript(document: vscode.TextDocument): boolean {
        return document.languageId === 'javascript' || document.languageId === 'javascriptreact';
    }

    getDefaultVisibility(): Visibility {
        return Visibility.Public;
    }

    getVisibilityModifiers(): Visibility[] {
        return [Visibility.Public, Visibility.Private, Visibility.Protected];
    }

    getAvailableModifiers(): string[] {
        return ['static', 'abstract', 'async', 'override', 'readonly'];
    }

    getTypeDefaults() {
        return { defaultReturnType: 'void', defaultFieldType: 'number', defaultPropertyType: 'string', defaultParamType: 'number' };
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
            const importMatch = line.match(TypeScriptLanguageProvider.RE_IMPORT) || line.match(TypeScriptLanguageProvider.RE_IMPORT2);
            if (importMatch) {
                imports.push(importMatch[1]);
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

        // function declarations: [export] [default] [async] function name(params)[: ret]
        const RE_FUNC = /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+\*?\s*(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^={]+?))?\s*\{?/;
        // function expressions: [export] const name[: type] = [async] function(params)
        const RE_FUNC_EXPR = /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*([^=]+?))?\s*=\s*(?:async\s*)?function\s*\*?\s*\(([^)]*)\)/;
        // arrow functions: [export] const name[: type] = [async](params)[: ret] =>
        const RE_ARROW = /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*([^=]+?))?\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*([^=>]+?))?\s*=>/;

        for (let i = 0; i < lines.length; i++) {
            if (inClass(i)) continue;
            const trimmed = lines[i].trim();
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;

            const m1 = trimmed.match(RE_FUNC);
            const m2 = !m1 ? trimmed.match(RE_FUNC_EXPR) : null;
            const m3 = !m1 && !m2 ? trimmed.match(RE_ARROW) : null;
            const m = m1 || m2 || m3;
            if (!m) continue;

            const name = m[1];
            if (!name) continue;

            let paramsStr = '';
            let returnType: string | undefined;
            if (m1) { paramsStr = m1[2]; returnType = m1[3]?.trim(); }
            else if (m2) { paramsStr = m2[3]; returnType = m2[2]?.trim(); }
            else if (m3) { paramsStr = m3[3]; returnType = (m3[4] || m3[2])?.trim(); }

            const endBody = this.findBodyEnd(lines, i);
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
                range: new vscode.Range(i, 0, i, lines[i].length),
                implementationRange: endBody > i
                    ? new vscode.Range(i, 0, endBody, lines[endBody]?.length ?? 0)
                    : undefined,
            });
        }
        return result;
    }

    rewriteStandaloneFunction(currentText: string, spec: MemberSpec): string | undefined {
        const firstBrace = currentText.indexOf('{');
        const lastBrace = currentText.lastIndexOf('}');
        if (firstBrace < 0 || lastBrace <= firstBrace) return undefined;
        const body = currentText.substring(firstBrace + 1, lastBrace);
        // Keep type annotations only if the original signature used them (TS vs JS).
        const headerSlice = currentText.substring(0, firstBrace);
        const hasTypes = /:\s*[A-Za-z]/.test(headerSlice);
        const params = spec.parameters.map(p => {
            let s = p.name;
            if (hasTypes && p.type && p.type !== 'any') s += `: ${p.type}`;
            if (p.defaultValue) s += ` = ${p.defaultValue}`;
            return s;
        }).join(', ');
        const ret = (hasTypes && spec.returnType && spec.returnType !== 'void') ? `: ${spec.returnType}` : '';
        const asyncKw = /async/.test(headerSlice) ? 'async ' : '';
        return `${asyncKw}function ${spec.name}(${params})${ret} {${body}}\n`;
    }

    private findBodyEnd(lines: string[], start: number): number {
        let depth = 0;
        let found = false;
        for (let i = start; i < lines.length; i++) {
            for (const ch of lines[i]) {
                if (ch === '{') { depth++; found = true; }
                else if (ch === '}') depth--;
            }
            if (found && depth <= 0) return i;
        }
        return start;
    }

    private parseClasses(lines: string[], uri: vscode.Uri, classes: ClassInfo[]): void {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            const classMatch = trimmed.match(TypeScriptLanguageProvider.RE_CLASS);
            if (!classMatch) continue;

            const isAbstract = !!classMatch[3];
            const className = classMatch[4];
            const parentClass = classMatch[5];
            const interfacesStr = classMatch[6];

            const interfaces: string[] = [];
            if (interfacesStr) {
                interfaces.push(...interfacesStr.split(',').map(s => s.trim()).filter(Boolean));
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
            const members = this.parseClassBody(lines, startLine + 1, endLine, className);

            const classInfo: ClassInfo = {
                id: uniqueId(),
                name: className,
                fullName: className,
                classType: isAbstract ? 'abstract class' : 'class',
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
            i = endLine;
        }
    }

    private parseClassBody(lines: string[], startLine: number, endLine: number, className: string): ClassMember[] {
        const members: ClassMember[] = [];

        for (let i = startLine; i < endLine; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                continue;
            }

            const ctorMatch = trimmed.match(TypeScriptLanguageProvider.RE_CONSTRUCTOR);
            if (ctorMatch) {
                const visStr = ctorMatch[1] || 'public';
                const paramsStr = ctorMatch[2];
                const params = this.parseParameters(paramsStr);
                const visibility = this.mapVisibility(visStr);

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                const ctorEnd = this.findBraceEnd(lines, i, endLine);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Constructor,
                    name: 'constructor',
                    visibility,
                    parameters: params,
                    modifiers: [],
                    isStatic: false,
                    isVirtual: false,
                    isAbstract: false,
                    isOverride: false,
                    range,
                    implementationRange: ctorEnd > i
                        ? new vscode.Range(i, 0, ctorEnd, lines[ctorEnd]?.length ?? 0)
                        : undefined,
                });
                continue;
            }

            const methodMatch = trimmed.match(TypeScriptLanguageProvider.RE_METHOD);
            if (methodMatch) {
                const visStr = methodMatch[1] || 'public';
                const modStr = methodMatch[2] || '';
                const methodName = methodMatch[3];
                const paramsStr = methodMatch[4];
                const returnType = methodMatch[5] ? methodMatch[5].trim() : undefined;

                if (methodName === 'constructor' || methodName === 'if' || methodName === 'for' || methodName === 'while' || methodName === 'switch' || methodName === 'catch' || methodName === 'return' || methodName === 'throw' || methodName === 'new' || methodName === 'class' || methodName === 'function' || methodName === 'get' || methodName === 'set') {
                    continue;
                }

                const visibility = this.mapVisibility(visStr);
                const params = this.parseParameters(paramsStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                const methodEnd = this.findBraceEnd(lines, i, endLine);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Method,
                    name: methodName,
                    returnType,
                    visibility,
                    parameters: params,
                    modifiers,
                    isStatic: modStr.includes('static'),
                    isVirtual: false,
                    isAbstract: modStr.includes('abstract'),
                    isOverride: modStr.includes('override'),
                    range,
                    implementationRange: methodEnd > i
                        ? new vscode.Range(i, 0, methodEnd, lines[methodEnd]?.length ?? 0)
                        : undefined,
                });
                continue;
            }

            const getterMatch = trimmed.match(TypeScriptLanguageProvider.RE_GETTER);
            if (getterMatch) {
                const visStr = getterMatch[1] || 'public';
                const modStr = getterMatch[2] || '';
                const propName = getterMatch[3];
                const returnType = getterMatch[4] ? getterMatch[4].trim() : undefined;

                const visibility = this.mapVisibility(visStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);
                const isStatic = modStr.includes('static');

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Property,
                    name: propName,
                    type: returnType,
                    visibility,
                    parameters: [],
                    modifiers,
                    isStatic,
                    isVirtual: false,
                    isAbstract: modStr.includes('abstract'),
                    isOverride: false,
                    range,
                });
                continue;
            }

            const propMatch = trimmed.match(TypeScriptLanguageProvider.RE_PROPERTY);
            if (propMatch) {
                const visStr = propMatch[1] || 'public';
                const modStr = propMatch[2] || '';
                const propName = propMatch[3];
                const propType = propMatch[4] ? propMatch[4].trim() : undefined;

                if (propName === 'constructor' || propName === 'function' || propName === 'class') {
                    continue;
                }

                const visibility = this.mapVisibility(visStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);
                const isStatic = modStr.includes('static');
                const isReadonly = modStr.includes('readonly');

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Property,
                    name: propName,
                    type: propType,
                    visibility,
                    parameters: [],
                    modifiers: isReadonly ? [...modifiers, 'readonly'] : modifiers,
                    isStatic,
                    isVirtual: false,
                    isAbstract: modStr.includes('abstract'),
                    isOverride: false,
                    range,
                });
                continue;
            }
        }

        return members;
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

    private mapVisibility(vis: string): Visibility {
        switch (vis) {
            case 'public': return Visibility.Public;
            case 'private': return Visibility.Private;
            case 'protected': return Visibility.Protected;
            default: return Visibility.Public;
        }
    }

    private parseParameters(paramsStr: string): Parameter[] {
        const params: Parameter[] = [];
        if (!paramsStr.trim()) return params;

        let depth = 0;
        let current = '';
        for (const ch of paramsStr) {
            if (ch === '(' || ch === '<' || ch === '{') depth++;
            if (ch === ')' || ch === '>' || ch === '}') depth--;
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

        let defaultValue: string | undefined;
        let working = trimmed;

        const eqIdx = working.lastIndexOf('=');
        if (eqIdx >= 0 && !working.substring(eqIdx).includes('=>')) {
            defaultValue = working.substring(eqIdx + 1).trim();
            working = working.substring(0, eqIdx).trim();
        }

        const colonIdx = working.lastIndexOf(':');
        if (colonIdx > 0) {
            const name = working.substring(0, colonIdx).trim();
            const type = working.substring(colonIdx + 1).trim();
            return { name, type, defaultValue };
        }

        const qmarkIdx = working.indexOf('?');
        if (qmarkIdx > 0) {
            const name = working.substring(0, qmarkIdx).trim();
            return { name, type: 'any', defaultValue };
        }

        return { name: trimmed, type: 'any', defaultValue };
    }

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo, existingBody?: string): GeneratedCode {
        const indent = '  ';
        const noTypes = this.isJsForClass(classInfo);

        const params = spec.parameters.map(p => {
            let s = p.name;
            if (!noTypes && p.type && p.type !== 'any') s += `: ${p.type}`;
            if (p.defaultValue) s += ` = ${p.defaultValue}`;
            return s;
        }).join(', ');

        const vis = spec.visibility === Visibility.Private ? 'private ' :
                    spec.visibility === Visibility.Protected ? 'protected ' : '';

        const modParts: string[] = [];
        if (spec.isStatic) modParts.push('static');
        if (spec.isAbstract) modParts.push('abstract');
        if (spec.isOverride) modParts.push('override');
        for (const m of spec.modifiers) {
            if (!modParts.includes(m.name) && m.name !== 'readonly') modParts.push(m.name);
        }
        const modStr = modParts.length ? modParts.join(' ') + ' ' : '';

        const returnType = (!noTypes && spec.returnType) ? `: ${spec.returnType}` : '';

        const body = existingBody !== undefined ? `\n${existingBody}` : `\n${indent}${indent}// TODO: implement\n${indent}`;

        let declaration: string;
        if (spec.kind === MemberKind.Constructor) {
            declaration = `${indent}${vis}constructor(${params}) {${body}}\n`;
        } else {
            declaration = `${indent}${vis}${modStr}${spec.name}(${params})${returnType} {${body}}\n`;
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
        const indent = '  ';
        const noTypes = this.isJsForClass(classInfo);

        const vis = spec.visibility === Visibility.Private ? 'private ' :
                    spec.visibility === Visibility.Protected ? 'protected ' : '';

        let decl = `${indent}${vis}${spec.name}`;
        if (!noTypes && spec.type) {
            decl += `: ${spec.type}`;
        }
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
        const indent = '  ';
        const noTypes = this.isJsForClass(classInfo);

        const vis = spec.visibility === Visibility.Private ? 'private ' :
                    spec.visibility === Visibility.Protected ? 'protected ' : '';

        let decl = `${indent}${vis}${spec.name}`;
        if (!noTypes && spec.type) {
            decl += `: ${spec.type}`;
        }
        decl += ';\n';

        const insertPos = this.getInsertPositionForClass(classInfo, 'property');

        return {
            declaration: decl,
            implementation: '',
            declarationPosition: insertPos,
            implementationPosition: insertPos,
        };
    }

    private isJsForClass(classInfo: ClassInfo): boolean {
        const ext = classInfo.fileUri.fsPath.substring(classInfo.fileUri.fsPath.lastIndexOf('.')).toLowerCase();
        return ext === '.js' || ext === '.jsx';
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

    extractMethod(
        context: RefactoringContext,
        methodName: string,
        parameters: string[],
        returnType: string
    ): vscode.TextEdit[] {
        const sel = context.selection ?? context.range;
        if (!sel) return [];
        const document = context.document;
        const selectedText = document.getText(sel);
        const noTypes = document.languageId === 'javascript' || document.languageId === 'javascriptreact';

        const params = parameters.map(p => {
            const ci = p.indexOf(':');
            if (ci > 0) {
                return noTypes ? p.substring(0, ci).trim() : p;
            }
            return noTypes ? p : `${p}: any`;
        }).join(', ');
        const args = parameters.map(p => {
            const ci = p.indexOf(':');
            return ci > 0 ? p.substring(0, ci).trim() : p;
        }).join(', ');

        const ret = (!noTypes && returnType && returnType !== 'void') ? `: ${returnType}` : '';
        const bodyLines = selectedText.split(/\r?\n/);
        const indentedBody = bodyLines.map(l => l.length ? `  ${l}` : l).join('\n');
        const newMethod = `\nfunction ${methodName}(${params})${ret} {\n${indentedBody}\n}\n`;
        const insertPos = new vscode.Position(document.lineCount, 0);

        return [
            new vscode.TextEdit(sel, `${methodName}(${args})`),
            new vscode.TextEdit(new vscode.Range(insertPos, insertPos), newMethod),
        ];
    }
}
