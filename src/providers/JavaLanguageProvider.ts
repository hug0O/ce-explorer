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
    LocalVariable,
    MethodScope,
    RefactoringContext,
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
    private static readonly RE_CONSTRUCTOR = /^\s*(?:(public|protected|private)\s+)?((?:static|final|abstract|synchronized|native)\s+)*(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\s*\{/;
    private static readonly RE_METHOD = /^\s*(?:(public|protected|private)\s+)?((?:static|final|abstract|synchronized|native|default)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*\(([^)]*)\)/;
    private static readonly RE_FIELD = /^\s*(?:(public|protected|private)\s+)?((?:static|final|volatile|transient)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*(?:=\s*[^;]+)?\s*;/;
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
    getTypeSuggestions() {
        return ['int', 'long', 'short', 'byte', 'double', 'float', 'boolean', 'char', 'void', 'var', 'String', 'Object', 'Integer', 'Long', 'Double', 'Boolean', 'List', 'ArrayList', 'Map', 'HashMap'];
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
            const members = this.parseClassBody(lines, startLine + 1, endLine, className, isInterface);

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

    private parseClassBody(lines: string[], startLine: number, endLine: number, className: string, isInterface = false): ClassMember[] {
        const members: ClassMember[] = [];
        let currentVisibility = Visibility.Package;
        // Members without a modifier (package-private, interface methods) are
        // valid Java, so only declarations at the class's own nesting level are
        // considered — never statements inside method bodies.
        let depth = 0;
        const implicitVis = isInterface ? 'public' : '';

        for (let i = startLine; i < endLine; i++) {
            const line = lines[i];
            const depthAtStart = depth;
            depth += this.braceDelta(line);
            if (depthAtStart !== 0) { continue; }
            // Drop leading annotations (`@Override public void f()` on one line).
            const trimmed = line.trim().replace(/^(?:@\w+(?:\([^)]*\))?\s+)+/, '');

            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('@')) {
                continue;
            }

            const ctorMatch = trimmed.match(JavaLanguageProvider.RE_CONSTRUCTOR);
            if (ctorMatch && ctorMatch[3] === className) {
                const visStr = ctorMatch[1] || implicitVis;
                const modStr = ctorMatch[2] || '';
                const ctorName = ctorMatch[3];
                const paramsStr = ctorMatch[4];

                currentVisibility = this.mapVisibility(visStr);
                const params = this.parseParameters(paramsStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                const ctorEnd = this.findBraceEnd(lines, i, endLine);
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
                    implementationRange: ctorEnd > i
                        ? new vscode.Range(i, 0, ctorEnd, lines[ctorEnd]?.length ?? 0)
                        : undefined,
                });
                continue;
            }

            const methodMatch = trimmed.match(JavaLanguageProvider.RE_METHOD);
            if (methodMatch && this.isPlainType(methodMatch[3])) {
                const visStr = methodMatch[1] || implicitVis;
                const modStr = methodMatch[2] || '';
                const returnType = methodMatch[3].trim();
                const methodName = methodMatch[4];
                const paramsStr = methodMatch[5];

                currentVisibility = this.mapVisibility(visStr);
                const params = this.parseParameters(paramsStr);
                const modifiers = modStr.trim().split(/\s+/).filter(Boolean);

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                const methodEnd = this.findBraceEnd(lines, i, endLine);
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
                    implementationRange: methodEnd > i
                        ? new vscode.Range(i, 0, methodEnd, lines[methodEnd]?.length ?? 0)
                        : undefined,
                });
                continue;
            }

            const fieldMatch = trimmed.match(JavaLanguageProvider.RE_FIELD);
            if (fieldMatch && this.isPlainType(fieldMatch[3])) {
                const visStr = fieldMatch[1] || implicitVis;
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

    getMethodBodyRange(document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined {
        if (!member.implementationRange) return undefined;
        return this.findBracedBodyRange(document.getText().split(/\r?\n/), member.implementationRange.start.line, member.implementationRange.end.line);
    }

    getDeclarationInsertPosition(document: vscode.TextDocument, member: ClassMember): vscode.Position {
        return this.insertPositionFromBody(document, member);
    }

    parseLocals(document: vscode.TextDocument, member: ClassMember): LocalVariable[] {
        const body = this.getMethodBodyRange(document, member);
        if (!body) return [];
        const lines = document.getText().split(/\r?\n/);
        const locals: LocalVariable[] = [];
        const re = /^\s+(?:final\s+)?([\w<>\[\]?.]+)\s+(\w+)\s*[;=]/;
        for (let i = body.start.line; i <= body.end.line; i++) {
            const line = lines[i] ?? '';
            if (line.includes('(')) continue;
            const m = line.match(re);
            if (m) {
                const [type, name] = [m[1], m[2]];
                const col = line.indexOf(name);
                locals.push({
                    name, type, isParam: false,
                    range: new vscode.Range(i, col, i, col + name.length),
                    declarationRange: new vscode.Range(i, col, i, line.length),
                });
                locals.push(...this.parseCStyleTrailingVars(line, i, type, name));
            }
        }
        return locals;
    }

    guessTypeFromAssignment(rhs: string, _scope: MethodScope): string | undefined {
        return this.guessFromLiteral(rhs, 'int', 'double', 'String', 'boolean');
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
        return this.splitParamList(paramsStr, '<', '>').map(p => this.parseSingleParam(p));
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

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo, existingBody?: string): GeneratedCode {
        const indent = '    ';
        const params = spec.parameters.map(p => `${p.type} ${p.name}`).join(', ');
        const vis = this.visibilityString(spec.visibility);

        const modStr = spec.modifiers.map(m => m.name).join(' ');
        const modPrefix = modStr ? modStr + ' ' : '';
        const staticPrefix = spec.isStatic ? 'static ' : '';

        const body = existingBody !== undefined ? `\n${existingBody}` : `\n${indent}${indent}// TODO: implement\n${indent}`;

        let declaration: string;
        if (spec.kind === MemberKind.Constructor) {
            declaration = `${indent}${vis}${modPrefix}${className}(${params}) {${body}}\n`;
        } else {
            const returnType = spec.returnType ?? 'void';
            declaration = `${indent}${vis}${modPrefix}${staticPrefix}${returnType} ${spec.name}(${params}) {${body}}\n`;
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

    /**
     * Extracts the selection into a new private static method and replaces the
     * selection with a call. The new method is appended at the end of the file
     * (Java permits top-level helper methods only inside a class, but the
     * extracted snippet is a standalone signature used by the caller wiring).
     */
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
        const ret = returnType && returnType !== 'void' ? returnType : 'void';
        const params = parameters.map(p => p).join(', ');
        const args = parameters.map(p => {
            const sp = p.split(/\s+/);
            return sp[sp.length - 1];
        }).join(', ');
        const bodyLines = selectedText.split(/\r?\n/);
        const indentedBody = bodyLines.map(l => l.length ? `    ${l}` : l).join('\n');
        const newMethod = `\n    private static ${ret} ${methodName}(${params}) {\n${indentedBody}\n    }\n`;
        const insertPos = new vscode.Position(document.lineCount, 0);
        return [
            new vscode.TextEdit(sel, `${methodName}(${args})`),
            new vscode.TextEdit(new vscode.Range(insertPos, insertPos), newMethod),
        ];
    }

    /**
     * Rewrites a top-level Java method's signature/body from a MemberSpec,
     * preserving the original body text. Returns undefined if the input does
     * not look like a Java method.
     */
    rewriteStandaloneFunction(currentText: string, spec: MemberSpec): string | undefined {
        const firstBrace = currentText.indexOf('{');
        const lastBrace = currentText.lastIndexOf('}');
        if (firstBrace < 0 || lastBrace <= firstBrace) return undefined;
        const body = currentText.substring(firstBrace + 1, lastBrace);
        const params = spec.parameters.map(p => {
            const s = p.type ? `${p.type} ${p.name}` : p.name;
            return p.defaultValue ? `${s} = ${p.defaultValue}` : s;
        }).join(', ');
        const ret = spec.returnType && spec.returnType !== 'void' ? spec.returnType : 'void';
        const staticKw = /static/.test(currentText.substring(0, firstBrace)) ? 'static ' : '';
        return `${staticKw}${ret} ${spec.name}(${params}) {${body}}\n`;
    }
}
