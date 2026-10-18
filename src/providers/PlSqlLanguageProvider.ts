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
import { PlMember, parsePlSqlUnits } from '../utils/plsqlParse';
import { declType, inferVariableType as inferPlSqlVariableType } from '../utils/plsqlExtract';

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
    readonly fileExtensions = ['.pks', '.pkb', '.pck', '.pls', '.plb', '.prc', '.fnc', '.trg', '.sql', '.txt'];
    readonly displayName = 'PL/SQL';

    parseDocument(document: vscode.TextDocument): ParsedDocument {
        const text = document.getText();
        const lines = text.split(/\r?\n/);
        const classes: ClassInfo[] = [];
        const standaloneProcedures: ClassMember[] = [];
        const lineLen = (l: number): number => (lines[l] ?? '').length;

        for (const unit of parsePlSqlUnits(text)) {
            if (unit.kind === 'procedure' || unit.kind === 'function' || unit.kind === 'trigger' || unit.kind === 'block') {
                const m = unit.members[0];
                standaloneProcedures.push(this.toMember(m, lines, 'sproc', Visibility.Public));
                continue;
            }
            const range = new vscode.Range(unit.startLine, 0, unit.endLine, lineLen(unit.endLine));
            classes.push({
                id: nextId(unit.kind === 'package' ? 'pkgspec' : 'pkg'),
                name: unit.name,
                classType: unit.kind === 'table' ? 'table' : 'package',
                parentClass: undefined,
                interfaces: [],
                members: unit.members.map(m => this.toMember(m, lines, m.kind === 'procedure' || m.kind === 'function' ? 'pmem' : 'pkvar', Visibility.Public)),
                range,
                declarationRange: range,
                isInterface: false,
                isRecord: false,
                isSealed: false,
                fileUri: document.uri,
            });
        }
        return { uri: document.uri, languageId: this.languageId, classes, standaloneProcedures, imports: [] };
    }

    /**
     * Maps a parsed PL/SQL member to the editor model. For a subprogram, `range`
     * is its signature (PROCEDURE … IS) and `implementationRange` runs from its
     * BEGIN to its closing END, so the locals sit between the two. A spec
     * declaration (`PROCEDURE p;`) has no implementation range.
     */
    private toMember(m: PlMember, lines: string[], idPrefix: string, visibility: Visibility): ClassMember {
        const lineLen = (l: number): number => (lines[l] ?? '').length;
        const isSub = m.kind === 'procedure' || m.kind === 'function';
        const params: Parameter[] = m.params.map(p => ({
            name: p.name, type: p.type, defaultValue: p.defaultValue,
            isOut: p.direction !== 'in', isVar: false, isConst: false, direction: p.direction,
        }));
        if (!isSub) {
            const col = Math.max(0, (lines[m.startLine] ?? '').indexOf(m.name));
            const r = new vscode.Range(m.startLine, col, m.endLine, lineLen(m.endLine));
            return {
                id: nextId(idPrefix), kind: MemberKind.Field, name: m.name, type: m.type, visibility,
                parameters: [], modifiers: m.kind === 'constant' ? ['constant'] : [], isStatic: true, isVirtual: false,
                isAbstract: false, isOverride: false, range: r, implementationRange: r,
            };
        }
        const range = new vscode.Range(m.startLine, 0, m.sigEndLine, lineLen(m.sigEndLine));
        let implementationRange: vscode.Range | undefined;
        if (!m.isDeclaration) {
            const implStart = m.beginLine ?? m.sigEndLine;
            implementationRange = new vscode.Range(implStart, 0, m.endLine, lineLen(m.endLine));
        }
        return {
            id: nextId(idPrefix), kind: MemberKind.Method, name: m.name,
            returnType: m.kind === 'function' ? m.returnType : undefined,
            visibility, parameters: params, modifiers: [], isStatic: false, isVirtual: false,
            isAbstract: false, isOverride: false, range, implementationRange,
        };
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

    inferVariableType(name: string, body: string, scope: MethodScope): string | undefined {
        const known = scope.locals.filter(l => l.type).map(l => ({ name: l.name, type: l.type as string }));
        const t = inferPlSqlVariableType(name, body, known);
        return t ? declType(t) : undefined;
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
