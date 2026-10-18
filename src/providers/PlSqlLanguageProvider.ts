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

let nextIdCounter = 0;
function nextId(prefix: string): string { return prefix + '_' + (nextIdCounter++); }

/**
 * PL/SQL (Oracle) language provider. Parses CREATE PACKAGE BODY / PACKAGE
 * constructs: each package becomes a ClassInfo (classType 'package'), its
 * procedures/functions become Method members, and its global variables become
 * Field members. Local variables inside IS...BEGIN are parsed by parseLocals.
 */
export class PlSqlLanguageProvider extends BaseLanguageProvider {
    readonly languageId = 'plsql';
    readonly fileExtensions = ['.pks', '.pkb', '.sql', '.txt'];
    readonly displayName = 'PL/SQL';

    parseDocument(document: vscode.TextDocument): ParsedDocument {
        const text = document.getText();
        const lines = text.split(/\r?\n/);
        const classes: ClassInfo[] = [];
        const standaloneProcedures: ClassMember[] = [];
        const imports: string[] = [];

        // Collect package ranges to avoid double-parsing package internals as
        // standalone procedures.
        const packageRanges: { start: number; end: number }[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // CREATE [OR REPLACE] PACKAGE BODY nom [IS|AS]
            const bodyMatch = line.match(/^create\s+(?:or\s+replace\s+)?package\s+body\s+([\w$.#]+)/i);
            if (bodyMatch) {
                const pkgName = bodyMatch[1];
                const startLine = i;
                const endLine = this.findNamedEnd(lines, i, pkgName);
                packageRanges.push({ start: startLine, end: endLine });
                const range = new vscode.Range(startLine, 0, endLine, (lines[endLine] ?? '').length);
                const members = this.extractPackageMembers(lines, startLine + 1, endLine);
                classes.push({
                    id: nextId('pkg'),
                    name: pkgName,
                    classType: 'package',
                    parentClass: undefined,
                    interfaces: [],
                    members,
                    range,
                    declarationRange: range,
                    isInterface: false,
                    isRecord: false,
                    isSealed: false,
                    fileUri: document.uri,
                });
                continue;
            }

            // CREATE [OR REPLACE] PACKAGE nom [IS|AS] (spec only)
            const specMatch = line.match(/^create\s+(?:or\s+replace\s+)?package\s+(?!body\b)([\w$.#]+)/i);
            if (specMatch) {
                const pkgName = specMatch[1];
                const startLine = i;
                const endLine = this.findNamedEnd(lines, i, pkgName);
                packageRanges.push({ start: startLine, end: endLine });
                const range = new vscode.Range(startLine, 0, endLine, (lines[endLine] ?? '').length);
                const members = this.extractPackageMembers(lines, startLine + 1, endLine);
                classes.push({
                    id: nextId('pkgspec'),
                    name: pkgName,
                    classType: 'package',
                    parentClass: undefined,
                    interfaces: [],
                    members,
                    range,
                    declarationRange: range,
                    isInterface: false,
                    isRecord: false,
                    isSealed: false,
                    fileUri: document.uri,
                });
                continue;
            }

            // Standalone PROCEDURE / FUNCTION outside a package
            if (this.isInsideAny(i, packageRanges)) { continue; }
            const procStart = line.match(/^create\s+(?:or\s+replace\s+)?(?:procedure|function)\s+([\w$.#]+)/i);
            if (procStart) {
                const procName = procStart[1];
                const startLine = i;
                const endLine = this.findMatchingEnd(lines, i);
                const member = this.buildMember(lines, startLine, endLine, procName);
                if (member) { standaloneProcedures.push(member); }
            }
        }

        return { uri: document.uri, languageId: this.languageId, classes, standaloneProcedures, imports };
    }

    /**
     * Extract members (procedures, functions, global variables) between the
     * package header and its END line. Procedure/function signatures may span
     * multiple lines (params on separate lines) until the terminating IS/AS.
     */
    private extractPackageMembers(lines: string[], startLine: number, endLine: number): ClassMember[] {
        const members: ClassMember[] = [];

        let i = startLine;
        while (i < endLine) {
            const line = lines[i] ?? '';
            const trimmed = line.trim();

            // Skip comments and empty lines.
            if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) { i++; continue; }

            // PROCEDURE or FUNCTION — accumulate signature lines until IS/AS.
            if (/^(procedure|function)\b/i.test(trimmed)) {
                const memberStart = i;
                let acc = trimmed;
                let sigEnd = i;
                // Accumulate until we find a line ending with IS or AS.
                for (; i < endLine; i++) {
                    const t = (lines[i] ?? '').trim();
                    acc = i === memberStart ? t : acc + ' ' + t;
                    if (/\b(is|as)\b\s*$/i.test(t) || /\b(is|as)\s*$/i.test(t)) { sigEnd = i; break; }
                    if (/\b(is|as)\b/i.test(t)) { sigEnd = i; break; }
                }
                const flat = acc.replace(/\s+/g, ' ').trim();

                // PROCEDURE name(params) IS
                const procMatch = flat.match(/^procedure\s+([\w$.#]+)\s*(\([^)]*\))?\s*(?:is|as)\b/i);
                // FUNCTION name(params) RETURN type IS
                const funcMatch = flat.match(/^function\s+([\w$.#]+)\s*(\([^)]*\))?\s*return\s+([\w().%,]+)\s*(?:is|as)\b/i);

                if (procMatch || funcMatch) {
                    const isFunc = !!funcMatch;
                    const name = (funcMatch || procMatch)![1];
                    const paramsStr = (funcMatch || procMatch)![2] || '';
                    const retType = funcMatch ? funcMatch[3].trim() : undefined;
                    const params = this.parsePlSqlParams(paramsStr);
                    const mEnd = this.findMatchingEnd(lines, sigEnd);
                    members.push(this.makeMember(lines, memberStart, sigEnd, mEnd, name, params, isFunc, retType));
                    i = mEnd + 1;
                    continue;
                }
                // Not a real proc/func match — fall through to variable check.
            }

            // Global variable: name type; or name type := value;
            const varMatch = trimmed.match(/^([\w]+)\s+([\w().%,]+)\s*(?::=.*)?;\s*$/i);
            if (varMatch && !/^(begin|end|exception|return|if|for|while|loop|procedure|function)\b/i.test(trimmed)) {
                const name = varMatch[1];
                const type = varMatch[2].trim();
                const col = line.indexOf(name);
                members.push({
                    id: nextId('pkvar'),
                    kind: MemberKind.Field,
                    name,
                    type,
                    visibility: Visibility.Public,
                    parameters: [],
                    modifiers: [],
                    isStatic: true,
                    isVirtual: false,
                    isAbstract: false,
                    isOverride: false,
                    range: new vscode.Range(i, col, i, line.length),
                    implementationRange: new vscode.Range(i, col, i, line.length),
                });
            }

            i++;
        }

        return members;
    }

    private makeMember(lines: string[], startLine: number, sigEnd: number, endLine: number, name: string, params: Parameter[], isFunc: boolean, retType?: string): ClassMember {
        // range = signature only (PROCEDURE...IS); the locals live between
        // range.end and implementationRange.start (the BEGIN line).
        const implStart = this.findBeginLine(lines, sigEnd, endLine);
        return {
            id: nextId('pmem'),
            kind: MemberKind.Method,
            name,
            returnType: isFunc ? retType : undefined,
            visibility: Visibility.Public,
            parameters: params,
            modifiers: [],
            isStatic: false,
            isVirtual: false,
            isAbstract: false,
            isOverride: false,
            range: new vscode.Range(startLine, 0, sigEnd, (lines[sigEnd] ?? '').length),
            implementationRange: implStart !== undefined
                ? new vscode.Range(implStart, 0, endLine, (lines[endLine] ?? '').length)
                : new vscode.Range(sigEnd, 0, endLine, (lines[endLine] ?? '').length),
        };
    }

    private buildMember(lines: string[], startLine: number, endLine: number, name: string): ClassMember | undefined {
        const trimmed = (lines[startLine] ?? '').trim();
        const isFunc = /^create\s+(?:or\s+replace\s+)?function\b/i.test(trimmed);
        const funcMatch = trimmed.match(/return\s+([\w().%,]+)/i);
        const paramsMatch = trimmed.match(/\(([^)]*)\)/);
        return {
            id: nextId('sproc'),
            kind: MemberKind.Method,
            name,
            returnType: isFunc ? funcMatch?.[1]?.trim() : undefined,
            visibility: Visibility.Public,
            parameters: this.parsePlSqlParams(paramsMatch?.[1] || ''),
            modifiers: [],
            isStatic: false,
            isVirtual: false,
            isAbstract: false,
            isOverride: false,
            range: new vscode.Range(startLine, 0, endLine, (lines[endLine] ?? '').length),
            implementationRange: new vscode.Range(startLine, 0, endLine, (lines[endLine] ?? '').length),
        };
    }

    /**
     * Parse PL/SQL parameter list: "p_id IN NUMBER, p_name OUT VARCHAR2"
     */
    private parsePlSqlParams(paramsStr: string): Parameter[] {
        if (!paramsStr || !paramsStr.trim()) { return []; }
        // Strip outer parentheses: the regex capture includes them.
        const cleaned = paramsStr.trim().replace(/^\(/, '').replace(/\)$/, '');
        const params: Parameter[] = [];
        const segments = this.splitParams(cleaned);
        for (const seg of segments) {
            const m = seg.trim().match(/^([\w]+)\s+(?:in\s+out|in|out)?\s*([\w().%,]+)/i);
            if (m) {
                const direction = /out/i.test(seg) ? (/in/i.test(seg) ? 'inout' : 'out') : 'in';
                params.push({
                    name: m[1],
                    type: m[2],
                    isOut: direction === 'out' || direction === 'inout',
                    isVar: false,
                    isConst: false,
                    direction: direction as 'in' | 'out' | 'inout',
                });
            }
        }
        return params;
    }

    private splitParams(paramsStr: string): string[] {
        const out: string[] = [];
        let depth = 0;
        let current = '';
        for (const ch of paramsStr) {
            if (ch === '(') depth++;
            else if (ch === ')') depth--;
            if (ch === ',' && depth <= 0) { out.push(current); current = ''; }
            else { current += ch; }
        }
        if (current.trim()) { out.push(current); }
        return out;
    }

    /**
     * Find the line matching `endRegex` starting from `fromLine`, accounting
     * for nested PROCEDURE/FUNCTION blocks (each has its own END).
     */
    /**
     * Find the END line that closes a named PL/SQL construct (PACKAGE BODY nom
     * / PACKAGE nom), matching `END nom;`. This avoids false matches on inner
     * END; of nested procedures.
     */
    private findNamedEnd(lines: string[], fromLine: number, name: string): number {
        const re = new RegExp('^end\\s+' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*;?\\s*$', 'i');
        for (let i = fromLine + 1; i < lines.length; i++) {
            if (re.test((lines[i] ?? '').trim())) { return i; }
        }
        // Fallback: last END in the file.
        for (let i = lines.length - 1; i > fromLine; i--) {
            if (/^\s*end\b/i.test((lines[i] ?? '').trim())) { return i; }
        }
        return Math.min(fromLine + 50, lines.length - 1);
    }

    /**
     * Find the END line matching the construct starting at `fromLine`. Uses
     * depth counting: nested PROCEDURE/FUNCTION (with IS/AS on the same line)
     * increment depth, any `END` statement decrements it. When depth returns
     * below zero, that END is the one closing the construct.
     *
     * The accumulation-based multi-line signatures in extractPackageMembers
     * handle procs whose IS/AS is on a later line; here we only count single-
     * line signatures (PROCEDURE name IS) for depth, which covers the common
     * nested case.
     */
    private findMatchingEnd(lines: string[], fromLine: number): number {
        let depth = 0;
        for (let i = fromLine + 1; i < lines.length; i++) {
            const t = (lines[i] ?? '').trim();
            // Nested sub-program (signature on one line ending with IS/AS).
            if (/^(procedure|function)\b/i.test(t) && /\b(is|as)\b\s*$/i.test(t)) { depth++; continue; }
            if (/^\s*end\b/i.test(t)) {
                if (depth <= 0) { return i; }
                depth--;
            }
        }
        return Math.min(fromLine + 50, lines.length - 1);
    }

    private findBeginLine(lines: string[], fromLine: number, endLine: number): number | undefined {
        for (let i = fromLine; i <= endLine; i++) {
            if (/^\s*begin\b/i.test(lines[i] ?? '')) { return i; }
        }
        return undefined;
    }

    private isInsideAny(line: number, ranges: { start: number; end: number }[]): boolean {
        return ranges.some(r => line >= r.start && line <= r.end);
    }

    // --- Required abstract methods ---

    getDefaultVisibility(): Visibility {
        return Visibility.Public;
    }

    getMethodBodyRange(document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined {
        return member.implementationRange;
    }

    getDeclarationInsertPosition(document: vscode.TextDocument, member: ClassMember): vscode.Position {
        // Local declarations go just before BEGIN (in the IS section).
        const lines = document.getText().split(/\r?\n/);
        const start = member.implementationRange?.start.line ?? member.range.start.line;
        for (let i = start; i <= (member.implementationRange?.end.line ?? start); i++) {
            if (/^\s*begin\b/i.test(lines[i] ?? '')) {
                return new vscode.Position(i, 0);
            }
        }
        return new vscode.Position(start + 1, 0);
    }

    formatLocalVariable(name: string, type: string): string {
        return `${name} ${type};`;
    }

    guessTypeFromAssignment(rhs: string, _scope: MethodScope): string | undefined {
        return this.guessFromLiteral(rhs, 'NUMBER', 'NUMBER', 'VARCHAR2', 'BOOLEAN');
    }

    getTypeDefaults() {
        return { defaultReturnType: 'VARCHAR2', defaultFieldType: 'NUMBER', defaultPropertyType: 'VARCHAR2', defaultParamType: 'NUMBER' };
    }

    getTypeSuggestions() {
        return ['NUMBER', 'VARCHAR2', 'DATE', 'BOOLEAN', 'INTEGER', 'PLS_INTEGER', 'BINARY_INTEGER', 'CLOB', 'BLOB', 'LONG', 'RAW', 'TIMESTAMP', 'PL/SQL'];
    }

    getVisibilityOptions(): Visibility[] {
        // PL/SQL has no private/public keywords (visibility is package-level).
        return [];
    }

    supportsMissingStubs(): boolean {
        return false;
    }

    parseLocals(document: vscode.TextDocument, member: ClassMember): LocalVariable[] {
        const lines = document.getText().split(/\r?\n/);
        const locals: LocalVariable[] = [];
        // Scan between the end of the signature (IS/AS) and BEGIN for local
        // declarations. The signature ends at member.range.end; the body starts
        // at implementationRange.start (= BEGIN line). We scan the IS section
        // from just after the signature up to (but not including) BEGIN.
        const start = member.range.end.line + 1;
        const end = member.implementationRange?.start.line ?? member.range.end.line;
        for (let i = start; i < end; i++) {
            const line = lines[i] ?? '';
            // name type; or name type := value;
            const m = line.match(/^\s+(\w+)\s+([\w().%,]+)\s*(?::=.*)?;\s*$/);
            if (m && !/^(begin|end|exception|procedure|function|return|cursor|type)\b/i.test(line.trim())) {
                const name = m[1];
                const type = m[2];
                const col = line.indexOf(name);
                locals.push({
                    name, type, isParam: false,
                    range: new vscode.Range(i, col, i, col + name.length),
                    declarationRange: new vscode.Range(i, col, i, line.length),
                });
            }
        }
        return locals;
    }

    /**
     * Where a new member goes inside the package: subprograms are appended just
     * before the closing `END pkg;`, but variables must be declared BEFORE the
     * first subprogram (PL/SQL rejects a declaration that follows a subprogram).
     */
    private memberPosition(classInfo: ClassInfo, kind: 'method' | 'field' | 'property'): vscode.Position {
        if (kind !== 'method') {
            const firstSub = classInfo.members
                .filter(m => m.kind === MemberKind.Method || m.kind === MemberKind.Constructor || m.kind === MemberKind.Destructor)
                .reduce<number | undefined>((min, m) => (min === undefined || m.range.start.line < min ? m.range.start.line : min), undefined);
            if (firstSub !== undefined) {
                return new vscode.Position(firstSub, 0);
            }
        }
        return new vscode.Position(classInfo.range.end.line, 0);
    }

    getInsertPosition(_document: vscode.TextDocument, classInfo: ClassInfo, memberKind: 'method' | 'field' | 'property'): InsertPosition {
        const pos = this.memberPosition(classInfo, memberKind);
        return { declaration: pos, implementation: pos };
    }

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo, existingBody?: string): GeneratedCode {
        const params = spec.parameters.map(p => {
            const dir = p.direction === 'out' ? ' OUT ' : p.direction === 'inout' ? ' IN OUT ' : ' IN ';
            return `${p.name}${dir}${p.type || this.getTypeDefaults().defaultParamType}`;
        }).join(', ');
        const ret = spec.returnType && spec.returnType !== 'void' ? ` RETURN ${spec.returnType}` : '';
        const body = existingBody || (spec.returnType && spec.returnType !== 'void' ? '\nBEGIN\n  RETURN NULL;\n' : '\nBEGIN\n  NULL;\n');
        const paramList = params ? `(${params})` : ''; // PL/SQL rejects empty parentheses
        const decl = `\n  ${spec.returnType && spec.returnType !== 'void' ? 'FUNCTION' : 'PROCEDURE'} ${spec.name}${paramList}${ret} IS\n${body}\n  END ${spec.name};\n`;
        const pos = this.memberPosition(classInfo, 'method');
        return { declaration: decl, implementation: '', declarationPosition: pos, implementationPosition: pos };
    }

    generateField(_className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode {
        const decl = `  ${spec.name} ${spec.type};\n`;
        const pos = this.memberPosition(classInfo, 'field');
        return { declaration: decl, implementation: '', declarationPosition: pos, implementationPosition: pos };
    }

    generateProperty(_className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode {
        // PL/SQL has no native "property" concept; generate as a variable.
        return this.generateField(_className, { kind: MemberKind.Field, name: spec.name, type: spec.type || 'VARCHAR2', visibility: spec.visibility } as FieldSpec, classInfo);
    }

    extractMethod(context: RefactoringContext, methodName: string, parameters: string[], returnType: string): vscode.TextEdit[] {
        const sel = context.selection ?? context.range;
        if (!sel) return [];
        const document = context.document;
        const selectedText = document.getText(sel);
        const ret = returnType && returnType !== 'void' ? ` RETURN ${returnType}` : '';
        const params = parameters.map(p => p).join(', ');
        const bodyLines = selectedText.split(/\r?\n/);
        const indented = bodyLines.map(l => l.length ? `  ${l}` : l).join('\n');
        const newProc = `\n  ${returnType && returnType !== 'void' ? 'FUNCTION' : 'PROCEDURE'} ${methodName}${params ? `(${params})` : ''}${ret} IS\n${indented}\n  END ${methodName};\n`;
        const insertPos = new vscode.Position(document.lineCount, 0);
        return [
            new vscode.TextEdit(sel, `${methodName}(${parameters.map(p => p.split(/\s+/).pop()).join(', ')});`),
            new vscode.TextEdit(new vscode.Range(insertPos, insertPos), newProc),
        ];
    }

    rewriteStandaloneFunction(currentText: string, spec: MemberSpec): string | undefined {
        const isEnd = currentText.lastIndexOf('END');
        const isStart = currentText.search(/\b(is|as)\b/i);
        if (isStart < 0 || isEnd <= isStart) return undefined;
        const body = currentText.substring(isStart, isEnd);
        const params = spec.parameters.map(p => `${p.name} IN ${p.type || 'NUMBER'}`).join(', ');
        const ret = spec.returnType && spec.returnType !== 'void' ? ` RETURN ${spec.returnType}` : '';
        const kw = spec.returnType && spec.returnType !== 'void' ? 'FUNCTION' : 'PROCEDURE';
        return `${kw} ${spec.name}${params ? `(${params})` : ''}${ret} IS${body}END ${spec.name};\n`;
    }
}
