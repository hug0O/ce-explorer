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
    RefactoringContext,
    SortScheme,
    Visibility,
    MemberKind,
    LocalVariable,
    MethodScope,
} from '../models/types';

export interface TypeDefaults {
    defaultReturnType: string;
    defaultFieldType: string;
    defaultPropertyType: string;
    defaultParamType: string;
}

export interface ILanguageProvider {
    readonly languageId: string;
    readonly fileExtensions: string[];
    readonly displayName: string;

    parseDocument(document: vscode.TextDocument): ParsedDocument;

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo, existingBody?: string): GeneratedCode;

    generateField(className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode;

    generateProperty(className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode;

    getInsertPosition(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        memberKind: 'method' | 'field' | 'property'
    ): InsertPosition;

    getVisibilityModifiers(): Visibility[];

    getAvailableModifiers(): string[];

    getDefaultVisibility(): Visibility;

    getTypeDefaults(): TypeDefaults;

    /**
     * Common type names for this language, surfaced as non-binding suggestions
     * in the variable editor (a <datalist>). The user may type any value.
     */
    getTypeSuggestions(): string[];

    /**
     * Visibility values this language can express (used to build the
     * promote-to-property selector). Empty for languages with no visibility
     * concept (JS, Go-via-casing, Python-via-convention).
     */
    getVisibilityOptions(): Visibility[];

    /**
     * Keyword that introduces the local-variable section (e.g. 'var' in
     * Pascal). Empty for languages with no dedicated section (C-style
     * declarations go directly in the body). When a section keyword is
     * returned, the variable editor prepends it when no section exists yet.
     */
    getLocalSectionKeyword(): string;

    findPairedFile(uri: vscode.Uri): vscode.Uri | undefined;

    supportsBackingField(): boolean;

    backingFieldName(propertyName: string): string;

    /**
     * Format a local variable declaration for a method body (e.g. from a field's
     * type). Used by the "create local variable" action.
     */
    formatLocalVariable(name: string, type: string): string;

    parseLocals(document: vscode.TextDocument, member: ClassMember): LocalVariable[];
    getMethodBodyRange(document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined;
    getDeclarationInsertPosition(document: vscode.TextDocument, member: ClassMember): vscode.Position;
    guessTypeFromAssignment(rhs: string, scope: MethodScope): string | undefined;
    resolveIdentifierType(rhs: string, scope: MethodScope): string | undefined;

    synchronizeDeclarationImplementation(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        member: ClassMember
    ): vscode.TextEdit[];

    sortMembers(members: ClassMember[], scheme: SortScheme): ClassMember[];

    extractMethod(context: RefactoringContext, methodName: string, parameters: string[], returnType: string): vscode.TextEdit[];

    findMemberAtPosition(document: vscode.TextDocument, position: vscode.Position): ClassMember | undefined;

    findClassAtPosition(document: vscode.TextDocument, position: vscode.Position): ClassInfo | undefined;

    /**
     * Rewrite a file-level (standalone) function in place: replace its signature
     * with the new spec while preserving the existing body. Returns the full new
     * function text, or undefined if the provider does not support this.
     */
    rewriteStandaloneFunction(currentText: string, spec: MemberSpec): string | undefined;

    /**
     * Rewrite the forward/interface declaration of a file-level (standalone)
     * routine to match a new spec (e.g. Pascal's interface-section declaration
     * that must mirror the implementation header). Returns the new declaration
     * text, or undefined when the provider has no separate declaration to sync
     * (most languages), in which case the declaration is left untouched.
     */
    rewriteStandaloneDeclaration(declText: string, spec: MemberSpec): string | undefined;

    /**
     * Generate stub declarations for every method declared on `interfaceInfo`
     * that is not already implemented by `classInfo`. Returns the concatenated
     * declaration text (ready to insert into the class body), or undefined when
     * the provider does not support interface stubs or there is nothing missing.
     */
    generateMissingStubs(className: string, interfaceInfo: ClassInfo, classInfo: ClassInfo): string | undefined;

    /**
     * Whether this provider supports "implement interface / override methods".
     * When false, the UI must hide that action (some languages disable it via
     * generateMissingStubs returning undefined; this flag makes the intent
     * explicit so we can avoid surfacing a no-op action).
     */
    supportsMissingStubs(): boolean;

    getDeclarationRange(document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined;

    getImplementationRange(document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined;
}

export abstract class BaseLanguageProvider implements ILanguageProvider {
    abstract readonly languageId: string;
    abstract readonly fileExtensions: string[];
    abstract readonly displayName: string;

    abstract parseDocument(document: vscode.TextDocument): ParsedDocument;
    abstract generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo, existingBody?: string): GeneratedCode;
    abstract generateField(className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode;
    abstract generateProperty(className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode;
    abstract getInsertPosition(document: vscode.TextDocument, classInfo: ClassInfo, memberKind: 'method' | 'field' | 'property'): InsertPosition;

    getVisibilityModifiers(): Visibility[] {
        return [Visibility.Private, Visibility.Protected, Visibility.Public];
    }

    getAvailableModifiers(): string[] {
        return ['static', 'virtual', 'abstract', 'override', 'final', 'const'];
    }

    abstract getDefaultVisibility(): Visibility;

    findPairedFile(uri: vscode.Uri): vscode.Uri | undefined {
        return undefined;
    }

    /**
     * Whether this language supports generating a private backing field together
     * with a property (e.g. Pascal `FName`, C# `_name`). When false the property
     * form hides the "backing field" option.
     */
    supportsBackingField(): boolean {
        return false;
    }

    /**
     * Name to use for a generated backing field backing the given property.
     */
    backingFieldName(propertyName: string): string {
        return 'F' + propertyName;
    }

    formatLocalVariable(name: string, type: string): string {
        return type ? `${type} ${name};` : `${name};`;
    }

    parseLocals(_document: vscode.TextDocument, _member: ClassMember): LocalVariable[] {
        return [];
    }

    getMethodBodyRange(_document: vscode.TextDocument, _member: ClassMember): vscode.Range | undefined {
        return _member.implementationRange;
    }

    getDeclarationInsertPosition(_document: vscode.TextDocument, _member: ClassMember): vscode.Position {
        return new vscode.Position(_member.range.start.line + 1, 0);
    }

    guessTypeFromAssignment(_rhs: string, _scope: MethodScope): string | undefined {
        return undefined;
    }

    /**
     * Best-effort type resolution for an assignment RHS, used when declaring a
     * used-but-undeclared variable. Goes beyond literal guessing: when the RHS
     * is a plain identifier, resolves it against the method scope (existing
     * locals and parameters, whose types were already parsed). Providers that
     * override guessTypeFromAssignment inherit this enrichment automatically.
     */
    resolveIdentifierType(rhs: string, scope: MethodScope): string | undefined {
        const literal = this.guessTypeFromAssignment(rhs, scope);
        if (literal) return literal;
        const id = rhs.trim();
        if (!/^[A-Za-z_]\w*$/.test(id)) return undefined;
        const match = scope.locals.find(l => l.name === id && l.type);
        return match ? match.type : undefined;
    }

    /**
     * Shared literal-type detector. Each provider maps literals to its own
     * type names by overriding guessTypeFromAssignment and delegating here.
     */
    protected guessFromLiteral(rhs: string, intT: string, floatT: string, strT: string, boolT: string): string | undefined {
        const r = rhs.trim();
        if (/^-?\d+$/.test(r)) return intT;
        if (/^-?\d+\.\d+$/.test(r)) return floatT;
        if (/^['"`]/.test(r)) return strT;
        if (/^(true|false)$/i.test(r)) return boolT;
        return undefined;
    }

    /**
     * Parse a C-style multi-variable declaration line (e.g. `int a, b, c;` or
     * `String x = "a", y;`) after the first name+type has been matched. Returns
     * additional locals for the comma-separated names that follow. Shared by
     * C++, Java, C# (and any language using `<type> <name>(, <name2>)*`).
     */
    protected parseCStyleTrailingVars(line: string, lineNum: number, firstType: string, firstName: string): LocalVariable[] {
        const out: LocalVariable[] = [];
        // Find the text after the first name: everything up to the terminating ; or end.
        const afterFirst = line.slice(line.indexOf(firstName) + firstName.length);
        // Strip a possible initializer on the first var (= ...), then split on commas.
        const tail = afterFirst.replace(/^\s*=\s*[^,;]*/, '').trim();
        if (!tail.startsWith(',')) { return out; }
        const parts = tail.split(';')[0].split(',').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
            // Each part may be `name` or `name = value`.
            const name = part.split('=')[0].trim();
            if (/^[A-Za-z_]\w*$/.test(name)) {
                const col = line.indexOf(name);
                out.push({
                    name, type: firstType, isParam: false,
                    range: new vscode.Range(lineNum, col, lineNum, col + name.length),
                    declarationRange: new vscode.Range(lineNum, col, lineNum, line.length),
                });
            }
        }
        return out;
    }

    /**
     * Net brace count of a source line, ignoring braces inside string/char
     * literals and `//` comments. Used to track nesting while scanning a class
     * body so that only top-level declarations are parsed as members.
     */
    protected braceDelta(line: string): number {
        const stripped = line
            .replace(/"(?:\\.|[^"\\])*"/g, '""')
            .replace(/'(?:\\.|[^'\\])*'/g, "''")
            .replace(/\/\/.*$/, '');
        let d = 0;
        for (const ch of stripped) {
            if (ch === '{') { d++; } else if (ch === '}') { d--; }
        }
        return d;
    }

    /** True for a plain (possibly generic / array) type, false for e.g. `A, B` or `return x`. */
    protected isPlainType(type: string): boolean {
        let t = type.trim();
        let prev: string;
        do { prev = t; t = t.replace(/<[^<>]*>/g, ''); } while (t !== prev);
        return /^[\w.?]+(?:\[\s*\])*$/.test(t.trim()) || t.trim() === '';
    }

    /**
     * Scan `lines` from `start` (inclusive) to `endLine` (exclusive) for the
     * line that closes the first `{...}` block opened in that span. Returns -1
     * when no balanced block is found. Shared brace-counting helper of the
     * C-family providers (Go, Java, C#, TypeScript).
     */
    protected findBraceEnd(lines: string[], start: number, endLine: number): number {
        let depth = 0;
        let found = false;
        for (let i = start; i < endLine; i++) {
            for (const ch of lines[i]) {
                if (ch === '{') { depth++; found = true; }
                else if (ch === '}') { depth--; }
                // A `;` before any `{` ends a bodyless declaration (abstract /
                // interface method): do not borrow the next member's body.
                else if (ch === ';' && !found) { return -1; }
            }
            if (found && depth <= 0) return i;
        }
        return -1;
    }

    /**
     * Inner body range of the first `{...}` block found between startLine and
     * endLine (inclusive): from the line after the opening brace to the closing
     * brace line. Returns undefined when no balanced block exists.
     */
    protected findBracedBodyRange(lines: string[], startLine: number, endLine: number): vscode.Range | undefined {
        let openLine = -1;
        for (let i = startLine; i <= endLine; i++) {
            if ((lines[i] ?? '').includes('{')) { openLine = i; break; }
        }
        if (openLine < 0) return undefined;
        const closeLine = this.findBraceEnd(lines, openLine, endLine + 1);
        if (closeLine < 0) return undefined;
        return new vscode.Range(openLine + 1, 0, closeLine, (lines[closeLine] ?? '').length);
    }

    /**
     * Standard insert position for local declarations inside a method body:
     * the first line of the method body, or the start of the implementation
     * (or declaration) range when no body can be located.
     */
    protected insertPositionFromBody(document: vscode.TextDocument, member: ClassMember): vscode.Position {
        const body = this.getMethodBodyRange(document, member);
        return new vscode.Position(body ? body.start.line : (member.implementationRange?.start.line ?? member.range.start.line), 0);
    }

    /**
     * Split a parameter list on top-level commas, ignoring commas nested in the
     * bracket characters given by `depthOpen`/`depthClose` (e.g. generics
     * `<`/`>` in Java, `(`/`[` in Go). Providers then parse each part into a
     * Parameter with their own syntax rules.
     */
    protected splitParamList(paramsStr: string, depthOpen: string, depthClose: string): string[] {
        const parts: string[] = [];
        if (!paramsStr.trim()) return parts;
        let depth = 0;
        let current = '';
        for (const ch of paramsStr) {
            if (depthOpen.includes(ch)) depth++;
            if (depthClose.includes(ch)) depth--;
            if (ch === ',' && depth === 0) {
                parts.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        if (current.trim()) {
            parts.push(current);
        }
        return parts;
    }

    synchronizeDeclarationImplementation(
        _document: vscode.TextDocument,
        _classInfo: ClassInfo,
        _member: ClassMember
    ): vscode.TextEdit[] {
        return [];
    }

    sortMembers(members: ClassMember[], scheme: SortScheme): ClassMember[] {
        const kindOrder = new Map(scheme.order.map((k, i) => [k, i]));
        const visOrder = new Map(scheme.visibilityOrder.map((v, i) => [v, i]));

        return [...members].sort((a, b) => {
            const kindA = kindOrder.get(a.kind) ?? 999;
            const kindB = kindOrder.get(b.kind) ?? 999;
            if (kindA !== kindB) { return kindA - kindB; }

            if (scheme.groupByVisibility) {
                const visA = visOrder.get(a.visibility) ?? 999;
                const visB = visOrder.get(b.visibility) ?? 999;
                if (visA !== visB) { return visA - visB; }
            }

            return a.name.localeCompare(b.name);
        });
    }

    extractMethod(
        _context: RefactoringContext,
        _methodName: string,
        _parameters: string[],
        _returnType: string
    ): vscode.TextEdit[] {
        return [];
    }

    findMemberAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): ClassMember | undefined {
        const parsed = this.parseDocument(document);
        for (const cls of parsed.classes) {
            for (const member of cls.members) {
                if (member.range.contains(position) || member.implementationRange?.contains(position)) {
                    return member;
                }
            }
        }
        return undefined;
    }

    findClassAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): ClassInfo | undefined {
        const parsed = this.parseDocument(document);
        return parsed.classes.find(cls => cls.range.contains(position));
    }

    getDeclarationRange(_document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined {
        return member.range;
    }

    getImplementationRange(_document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined {
        return member.implementationRange;
    }

    rewriteStandaloneFunction(_currentText: string, _spec: MemberSpec): string | undefined {
        return undefined;
    }

    rewriteStandaloneDeclaration(_declText: string, _spec: MemberSpec): string | undefined {
        return undefined;
    }

    /**
     * Default Implement/Override implementation: reuse each provider's own
     * generateMethod to produce a stub for every interface method that the
     * target class does not yet declare. Providers whose class-body layout
     * cannot host plain method stubs (e.g. Rust impl blocks, Go receivers)
     * override this to return undefined.
     */
    generateMissingStubs(className: string, interfaceInfo: ClassInfo, classInfo: ClassInfo): string | undefined {
        const existing = new Set(classInfo.members.map(m => m.name));
        const parts: string[] = [];
        for (const m of interfaceInfo.members) {
            if (existing.has(m.name)) {
                continue;
            }
            if (m.kind === MemberKind.Method) {
                const spec: MemberSpec = {
                    kind: MemberKind.Method,
                    name: m.name,
                    returnType: m.returnType || undefined,
                    visibility: m.visibility,
                    parameters: m.parameters,
                    modifiers: [],
                    isStatic: m.isStatic,
                    isVirtual: false,
                    isAbstract: false,
                    isOverride: false,
                    isFinal: false,
                };
                const gen = this.generateMethod(className, spec, classInfo);
                if (gen.declaration) {
                    parts.push(gen.declaration);
                }
            } else if (m.kind === MemberKind.Property) {
                const spec: PropertySpec = {
                    kind: MemberKind.Property,
                    name: m.name,
                    type: m.type || m.returnType || 'object',
                    visibility: m.visibility,
                    hasGetter: true,
                    hasSetter: true,
                    isDefault: false,
                    isReadOnly: false,
                };
                const gen = this.generateProperty(className, spec, classInfo);
                if (gen.declaration) {
                    parts.push(gen.declaration);
                }
            }
        }
        return parts.length > 0 ? parts.join('\n') : undefined;
    }

    supportsMissingStubs(): boolean {
        return true;
    }

    getTypeDefaults(): TypeDefaults {
        return {
            defaultReturnType: 'void',
            defaultFieldType: 'int',
            defaultPropertyType: 'string',
            defaultParamType: 'int',
        };
    }

    getTypeSuggestions(): string[] {
        return ['int', 'string', 'boolean', 'double', 'float', 'char'];
    }

    getVisibilityOptions(): Visibility[] {
        return [Visibility.Private, Visibility.Protected, Visibility.Public];
    }

    getLocalSectionKeyword(): string {
        return '';
    }
}
