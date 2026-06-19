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
    return `rust_${Date.now()}_${++_idCounter}`;
}

export class RustLanguageProvider extends BaseLanguageProvider {
    readonly languageId = 'rust';
    readonly fileExtensions = ['.rs'];
    readonly displayName = 'Rust';

    private static readonly RE_STRUCT = /^\s*(pub\s+)?struct\s+(\w+)(?:<[^>]*>)?\s*\{?/;
    private static readonly RE_ENUM = /^\s*(pub\s+)?enum\s+(\w+)(?:<[^>]*>)?\s*\{?/;
    private static readonly RE_TRAIT = /^\s*(pub\s+)?trait\s+(\w+)(?:<[^>]*>)?\s*(?::\s*(?:\w+\+?\s*)+)?\s*\{?/;
    private static readonly RE_IMPL = /^\s*impl(?:\s*<[^>]*>)?\s+(\w+)(?:<[^>]*>)?\s*\{?/;
    private static readonly RE_IMPL_FOR = /^\s*impl(?:\s*<[^>]*>)?\s+(\w+)(?:<[^>]*>)?\s+for\s+(\w+)(?:<[^>]*>)?\s*\{?/;
    private static readonly RE_METHOD = /^\s*(pub\s*(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^{]+?))?\s*\{?/;
    private static readonly RE_FIELD = /^\s*(pub\s*(?:\([^)]*\))?\s+)?(\w+)\s*:\s*([^,}]+)/;
    private static readonly RE_USE = /^\s*(pub\s+)?use\s+([^;]+);/;

    getDefaultVisibility(): Visibility {
        return Visibility.Private;
    }

    getVisibilityModifiers(): Visibility[] {
        return [Visibility.Private, Visibility.Public, Visibility.Protected];
    }

    getAvailableModifiers(): string[] {
        return ['pub', 'pub(crate)', 'async', 'static', 'const'];
    }

    getTypeDefaults() {
        return { defaultReturnType: '()', defaultFieldType: 'i32', defaultPropertyType: 'String', defaultParamType: 'i32' };
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
            const useMatch = line.match(RustLanguageProvider.RE_USE);
            if (useMatch) {
                imports.push(useMatch[2].trim());
                continue;
            }
        }

        this.parseTypeBlocks(lines, document.uri, classes);

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
        const blockRanges = classes.map(c => ({ start: c.range.start.line, end: c.range.end.line }));
        const inBlock = (ln: number): boolean => blockRanges.some(r => ln >= r.start && ln <= r.end);

        // Free functions: [pub] [async] fn name(params)[ -> ret]
        const RE_FN = /^\s*(?:(pub)\s*(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^{]+?))?\s*\{?/;

        for (let i = 0; i < lines.length; i++) {
            if (inBlock(i)) continue;
            const trimmed = lines[i].trim();
            if (!trimmed || trimmed.startsWith('//')) continue;

            const m = trimmed.match(RE_FN);
            if (!m) continue;

            const name = m[2];
            const paramsStr = m[3];
            const returnType = m[4]?.trim();
            const isPub = !!m[1];

            const endBody = this.findBraceEnd(lines, i);
            result.push({
                id: uniqueId(),
                kind: MemberKind.Method,
                name,
                returnType,
                visibility: isPub ? Visibility.Public : Visibility.Private,
                parameters: this.parseParameters(paramsStr || '', name),
                modifiers: [],
                isStatic: true,
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
        const vis = spec.visibility === Visibility.Public ? 'pub ' : '';
        const params = spec.parameters.map(p => `${p.name}: ${p.type || '_'}`).join(', ');
        const ret = (spec.returnType && spec.returnType !== '()' && spec.returnType !== 'void')
            ? ` -> ${spec.returnType}` : '';
        return `${vis}fn ${spec.name}(${params})${ret} {${body}}\n`;
    }

    // Rust methods live inside `impl` blocks whose layout this provider does not
    // reliably model for plain stub insertion, so interface stubs are disabled
    // here rather than risk generating misplaced code.
    generateMissingStubs(_className: string, _interfaceInfo: ClassInfo, _classInfo: ClassInfo): string | undefined {
        return undefined;
    }

    private findBraceEnd(lines: string[], start: number): number {
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

    private parseTypeBlocks(lines: string[], uri: vscode.Uri, classes: ClassInfo[]): void {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            let name: string | undefined;
            let isInterface = false;
            let isRecord = false;
            let pubPrefix = '';
            let classType: string | undefined;

            const structMatch = trimmed.match(RustLanguageProvider.RE_STRUCT);
            const enumMatch = trimmed.match(RustLanguageProvider.RE_ENUM);
            const traitMatch = trimmed.match(RustLanguageProvider.RE_TRAIT);
            const implMatch = trimmed.match(RustLanguageProvider.RE_IMPL);
            const implForMatch = trimmed.match(RustLanguageProvider.RE_IMPL_FOR);

            if (structMatch) {
                pubPrefix = structMatch[1] || '';
                name = structMatch[2];
                isRecord = true;
                classType = 'struct';
            } else if (enumMatch) {
                pubPrefix = enumMatch[1] || '';
                name = enumMatch[2];
                isRecord = true;
                classType = 'enum';
            } else if (traitMatch) {
                pubPrefix = traitMatch[1] || '';
                name = traitMatch[2];
                isInterface = true;
                classType = 'trait';
            } else if (implForMatch) {
                name = implForMatch[2];
                classType = 'impl for';
            } else if (implMatch) {
                name = implMatch[1];
                classType = 'impl';
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
            const members = this.parseBlockBody(lines, startLine + 1, endLine, name);

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

            if (implMatch || implForMatch) {
                const existingClass = classes.find(c => c.name === name);
                if (existingClass) {
                    existingClass.members.push(...members);
                    existingClass.range = new vscode.Range(
                        existingClass.range.start,
                        new vscode.Position(endLine, lines[endLine]?.length ?? 0)
                    );
                    i = endLine;
                    continue;
                }
            }

            classes.push(classInfo);
            i = endLine;
        }
    }

    private parseBlockBody(lines: string[], startLine: number, endLine: number, _blockName: string): ClassMember[] {
        const members: ClassMember[] = [];

        for (let i = startLine; i < endLine; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('#')) {
                continue;
            }

            const methodMatch = trimmed.match(RustLanguageProvider.RE_METHOD);
            if (methodMatch) {
                const visStr = methodMatch[1] ? methodMatch[1].trim() : '';
                const methodName = methodMatch[2];
                const paramsStr = methodMatch[3];
                const returnType = methodMatch[4] ? methodMatch[4].trim() : undefined;

                const params = this.parseParameters(paramsStr, methodName);
                const isStatic = !paramsStr.includes('&self') && !paramsStr.includes('&mut self') && !paramsStr.includes('self');
                const visibility = visStr.startsWith('pub') ? Visibility.Public : Visibility.Private;

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Method,
                    name: methodName,
                    returnType,
                    visibility,
                    parameters: params,
                    modifiers: [],
                    isStatic,
                    isVirtual: false,
                    isAbstract: false,
                    isOverride: false,
                    range,
                });

                let braceDepth = 0;
                let foundOpen = false;
                for (let j = i; j < endLine; j++) {
                    for (const ch of lines[j]) {
                        if (ch === '{') { braceDepth++; foundOpen = true; }
                        if (ch === '}') { braceDepth--; }
                    }
                    if (foundOpen && braceDepth <= 0) {
                        i = j;
                        break;
                    }
                }

                continue;
            }

            const fieldMatch = trimmed.match(RustLanguageProvider.RE_FIELD);
            if (fieldMatch) {
                const visStr = fieldMatch[1] ? fieldMatch[1].trim() : '';
                const fieldName = fieldMatch[2];
                const fieldType = fieldMatch[3].trim();

                if (fieldName === 'fn' || fieldName === 'pub' || fieldName === 'struct' || fieldName === 'enum') {
                    continue;
                }

                const visibility = visStr.startsWith('pub') ? Visibility.Public : Visibility.Private;
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

    private parseParameters(paramsStr: string, _methodName: string): Parameter[] {
        const params: Parameter[] = [];
        if (!paramsStr.trim()) return params;

        const parts = paramsStr.split(',').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
            if (part === '&self' || part === '&mut self' || part === 'self') {
                continue;
            }

            let working = part;
            const colonIdx = working.lastIndexOf(':');
            if (colonIdx >= 0) {
                const name = working.substring(0, colonIdx).trim();
                const type = working.substring(colonIdx + 1).trim();
                params.push({ name, type });
            } else {
                params.push({ name: working, type: 'unknown' });
            }
        }
        return params;
    }

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo): GeneratedCode {
        const indent = '    ';
        const params = spec.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
        const returnType = spec.returnType ? ` -> ${spec.returnType}` : '';
        const vis = spec.visibility === Visibility.Public ? 'pub ' : '';

        let declaration: string;
        if (spec.kind === MemberKind.Constructor) {
            declaration = `${indent}${vis}fn new(${params}) -> Self {\n${indent}${indent}todo!()\n${indent}}\n`;
        } else {
            const selfParam = spec.isStatic ? '' : '&self';
            const allParams = selfParam ? (params ? `${selfParam}, ${params}` : selfParam) : params;
            declaration = `${indent}${vis}fn ${spec.name}(${allParams})${returnType} {\n${indent}${indent}todo!()\n${indent}}\n`;
        }

        const insertPos = this.getInsertPositionForClass(classInfo, 'method');

        return {
            declaration,
            implementation: '',
            declarationPosition: insertPos,
            implementationPosition: insertPos,
        };
    }

    generateField(className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode {
        const indent = '    ';
        const vis = spec.visibility === Visibility.Public ? 'pub ' : '';
        const decl = `${indent}${vis}${spec.name}: ${spec.type}`;

        let line = decl + ',\n';

        const insertPos = this.getInsertPositionForClass(classInfo, 'field');

        return {
            declaration: line,
            implementation: '',
            declarationPosition: insertPos,
            implementationPosition: insertPos,
        };
    }

    generateProperty(className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode {
        const indent = '    ';
        let declaration = '';

        if (spec.hasGetter) {
            declaration += `${indent}pub fn ${spec.name.toLowerCase()}(&self) -> &${spec.type} {\n${indent}${indent}&self.${spec.name.toLowerCase()}\n${indent}}\n`;
        }
        if (spec.hasSetter) {
            const setterName = `set_${spec.name.toLowerCase()}`;
            declaration += `${indent}pub fn ${setterName}(&mut self, value: ${spec.type}) {\n${indent}${indent}self.${spec.name.toLowerCase()} = value;\n${indent}}\n`;
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
