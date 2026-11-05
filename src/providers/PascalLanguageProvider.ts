import * as vscode from 'vscode';
import * as fs from 'fs';
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
    Parameter,
    LocalVariable,
    MethodScope,
} from '../models/types';
import { BaseLanguageProvider } from './ILanguageProvider';
import { blankPascal } from '../utils/pascalReview';
import { NestedRoutine, nestedRoutinesOf, routineEnd } from '../utils/pascalNested';

/** The unit with its comments and strings blanked, once per parse (the lines array is the key). */
const blankedLines = new WeakMap<string[], string[]>();

/** Routines declared inside the routine that runs from line `start` to line `end`. */
function nestedOf(lines: string[], start: number, end: number, name: string): { nested: NestedRoutine[] } | undefined {
    let code = blankedLines.get(lines);
    if (!code) { code = blankPascal(lines); blankedLines.set(lines, code); }
    const nested = nestedRoutinesOf(code, start, end, name);
    return nested.length ? { nested } : undefined;
}

let _idCounter = 0;
function nextId(prefix: string): string {
    return `${prefix}_${++_idCounter}_${Date.now().toString(36)}`;
}

const VISIBILITY_KEYWORDS = ['private', 'protected', 'public', 'published'] as const;

const VISIBILITY_MAP: Record<string, Visibility> = {
    private: Visibility.Private,
    protected: Visibility.Protected,
    public: Visibility.Public,
    published: Visibility.Published,
};

const METHOD_MODIFIERS = [
    'virtual', 'override', 'abstract', 'dynamic',
    'reintroduce', 'final', 'overload', 'message',
    'cdecl', 'stdcall', 'pascal', 'register', 'safecall', 'winapi',
];

interface RawClassBlock {
    name: string;
    parentClass: string | undefined;
    interfaces: string[];
    isInterface: boolean;
    isRecord: boolean;
    startLine: number;
    endLine: number;
    bodyStartLine: number;
    body: string;
}

interface ImplementationEntry {
    className: string;
    methodName: string;
    fullSignature: string;
    startLine: number;
    endLine: number;
    params: string;
    returnType: string | undefined;
    kind: MemberKind;
}

export class PascalLanguageProvider extends BaseLanguageProvider {
    readonly languageId = 'pascal';
    readonly fileExtensions = ['.pas', '.dpk', '.dpr'];
    readonly displayName = 'Pascal / Delphi';

    parseDocument(document: vscode.TextDocument): ParsedDocument {
        const text = document.getText();
        const lines = text.split(/\r?\n/);

        const unitName = this.extractUnitName(text);
        const imports = this.extractUses(text);

        const rawClasses = this.extractClassBlocks(lines);
        const implementations = this.extractImplementations(lines);

        const classes: ClassInfo[] = [];

        for (const raw of rawClasses) {
            const members = this.parseClassMembers(raw, lines, implementations);
            const classRange = new vscode.Range(
                new vscode.Position(raw.startLine, 0),
                new vscode.Position(raw.endLine, lines[raw.endLine]?.length ?? 0),
            );

            const classType = raw.isInterface
                ? 'interface'
                : raw.isRecord
                    ? 'record'
                    : 'class';

            classes.push({
                id: nextId('cls'),
                name: raw.name,
                classType,
                parentClass: raw.parentClass,
                interfaces: raw.interfaces,
                members,
                range: classRange,
                declarationRange: new vscode.Range(
                    new vscode.Position(raw.startLine, 0),
                    new vscode.Position(raw.startLine, lines[raw.startLine]?.length ?? 0),
                ),
                isInterface: raw.isInterface,
                isRecord: raw.isRecord,
                isSealed: false,
                fileUri: document.uri,
            });
        }

        const standalone = this.extractStandaloneProcedures(
            lines,
            rawClasses.map(raw => ({ startLine: raw.startLine, endLine: raw.endLine })),
        );

        return {
            uri: document.uri,
            languageId: this.languageId,
            classes,
            standaloneProcedures: standalone,
            imports,
        };
    }

    private qualifiedClassName(className: string): string {
        return className.startsWith('T') ? className : 'T' + className;
    }

    private getDocumentLines(classInfo: ClassInfo): string[] | undefined {
        const targetPath = classInfo.fileUri.fsPath;
        for (const doc of vscode.workspace.textDocuments) {
            if (doc.uri.fsPath === targetPath) {
                return doc.getText().split(/\r?\n/);
            }
        }
        try {
            const content = fs.readFileSync(targetPath, 'utf8');
            return content.split(/\r?\n/);
        } catch {
            return undefined;
        }
    }

    /**
     * Line of the class's closing `end;` — the hard upper bound for any member
     * insert position, so a stale or overshooting member range can never push
     * a generated declaration outside the class body.
     */
    private findClassEndLine(classInfo: ClassInfo, lines: string[]): number {
        for (let i = classInfo.range.start.line; i <= classInfo.range.end.line && i < lines.length; i++) {
            if (/^\s*end\s*;/i.test(lines[i])) {
                return i;
            }
        }
        return classInfo.range.end.line;
    }

    private findVisibilityInsertPosition(
        classInfo: ClassInfo,
        lines: string[],
        visibility: Visibility,
    ): { pos: vscode.Position; needsSection: boolean } {
        const classEndLine = this.findClassEndLine(classInfo, lines);
        const visMembers = classInfo.members.filter(m => m.visibility === visibility);
        if (visMembers.length > 0) {
            const last = visMembers.reduce((a, b) => a.range.end.line > b.range.end.line ? a : b);
            const rawLine = last.range.end.line + 1;
            const clamped = rawLine > classEndLine;
            return { pos: new vscode.Position(Math.min(rawLine, classEndLine), 0), needsSection: clamped };
        }

        for (let i = classInfo.range.start.line; i <= classEndLine; i++) {
            if (i >= lines.length) break;
            if (/^\s*end\s*;/i.test(lines[i])) {
                return { pos: new vscode.Position(i, 0), needsSection: true };
            }
        }
        return { pos: new vscode.Position(classEndLine, 0), needsSection: true };
    }

    private computeDeclaration(
        declLine: string,
        visibility: Visibility,
        classInfo: ClassInfo,
    ): { text: string; position: vscode.Position } {
        const lines = this.getDocumentLines(classInfo);
        if (!lines) {
            const visLabel = this.visibilityKeyword(visibility);
            return {
                text: `\n  ${visLabel}\n${declLine}\n`,
                position: new vscode.Position(classInfo.range.end.line, 0),
            };
        }
        const visPos = this.findVisibilityInsertPosition(classInfo, lines, visibility);
        const text = visPos.needsSection
            ? `\n  ${this.visibilityKeyword(visibility)}\n${declLine}\n`
            : `\n${declLine}\n`;
        return { text, position: visPos.pos };
    }

    private computeImplementation(
        implCode: string,
        classInfo: ClassInfo,
    ): { text: string; position: vscode.Position } {
        const lines = this.getDocumentLines(classInfo);
        if (!lines) {
            return { text: implCode, position: this.findImplementationEndPosition(classInfo) };
        }
        return { text: implCode, position: this.findImplementationInsertPosition(lines) };
    }

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo, existingBody?: string): GeneratedCode {
        const params = this.formatParameterList(spec.parameters);
        const isStandalone = classInfo.classType === 'standalone';
        const declIndent = isStandalone ? '' : '    ';
        const mods = this.buildModifierString(spec);
        const qualifier = isStandalone ? '' : this.qualifiedClassName(className) + '.';

        let declLine: string;
        let implHeader: string;

        if (spec.kind === MemberKind.Constructor) {
            declLine = `${declIndent}constructor Create${params};${mods}`;
            implHeader = `constructor ${qualifier}Create${params};`;
        } else if (spec.kind === MemberKind.Destructor) {
            declLine = `${declIndent}destructor Destroy;${mods}`;
            implHeader = `destructor ${qualifier}Destroy;`;
        } else if (spec.kind === MemberKind.Method && spec.returnType) {
            declLine = `${declIndent}function ${spec.name}${params}: ${spec.returnType};${mods}`;
            implHeader = `function ${qualifier}${spec.name}${params}: ${spec.returnType};`;
        } else {
            declLine = `${declIndent}procedure ${spec.name}${params};${mods}`;
            implHeader = `procedure ${qualifier}${spec.name}${params};`;
        }

        const visLabel = this.visibilityKeyword(spec.visibility);

        const implBody = this.generateMethodBody(spec, className);
        // When editing an existing member, existingBody carries the preserved
        // implementation (locals + begin + body); reuse it verbatim instead of
        // generating a placeholder TODO body.
        const implCode = existingBody !== undefined
            ? `\n${implHeader}\n${existingBody}end;\n`
            : `\n${implHeader}\nbegin\n${implBody}end;\n`;

        const decl = this.computeDeclaration(declLine, spec.visibility, classInfo);
        const impl = this.computeImplementation(implCode, classInfo);

        return {
            declaration: decl.text,
            implementation: impl.text,
            declarationPosition: decl.position,
            implementationPosition: impl.position,
        };
    }

    rewriteStandaloneFunction(currentText: string, spec: MemberSpec): string | undefined {
        // Rewrite only the routine signature; preserve the local declarations
        // (var/const/type/label) and the begin..end body verbatim. The header
        // runs up to the first ';' at paren-depth 0, so ';' inside the parameter
        // list is not mistaken for the terminator.
        const terminatorIdx = this.findHeaderTerminator(currentText);
        if (terminatorIdx < 0) {
            return undefined;
        }
        const rest = currentText.substring(terminatorIdx + 1);
        return this.buildStandaloneHeader(spec) + rest;
    }

    rewriteStandaloneDeclaration(declText: string, spec: MemberSpec): string | undefined {
        // Pascal standalone routines have a forward declaration in the interface
        // section that must mirror the implementation header. Rewrite the same
        // header prefix; trailing modifiers (e.g. 'overload;') after the first
        // ';' at paren-depth 0 are preserved.
        const terminatorIdx = this.findHeaderTerminator(declText);
        if (terminatorIdx < 0) {
            return undefined;
        }
        const rest = declText.substring(terminatorIdx + 1);
        return this.buildStandaloneHeader(spec) + rest;
    }

    private buildStandaloneHeader(spec: MemberSpec): string {
        const params = this.formatParameterList(spec.parameters);
        if (spec.kind === MemberKind.Constructor) {
            return `constructor Create${params};`;
        } else if (spec.kind === MemberKind.Destructor) {
            return `destructor Destroy;`;
        } else if (spec.returnType && spec.returnType.trim() !== '') {
            return `function ${spec.name}${params}: ${spec.returnType.trim()};`;
        } else {
            return `procedure ${spec.name}${params};`;
        }
    }

    private findHeaderTerminator(text: string): number {
        let depth = 0;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === '(') depth++;
            else if (ch === ')') depth--;
            else if (ch === ';' && depth <= 0) return i;
        }
        return -1;
    }

    generateField(className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode {
        const declIndent = '    ';
        const fieldLine = `${declIndent}${spec.name}: ${spec.type};`;

        const decl = this.computeDeclaration(fieldLine, spec.visibility, classInfo);

        return {
            declaration: decl.text,
            implementation: '',
            declarationPosition: decl.position,
            implementationPosition: decl.position,
        };
    }

    generateProperty(className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode {
        const declIndent = '    ';
        let propLine = `${declIndent}property ${spec.name}: ${spec.type}`;

        // When a backing field is requested, generate a private field and wire the
        // property's read/write clauses to it. This produces e.g.:
        //   FName: string;          (private section)
        //   property Name: string read FName write FName;
        let backingDecl: { text: string; position: vscode.Position } | undefined;
        if (spec.createBackingField) {
            const fieldName = this.backingFieldName(spec.name);
            const fieldLine = `${declIndent}${fieldName}: ${spec.type};`;
            propLine += ` read ${fieldName}`;
            if (spec.hasSetter) {
                propLine += ` write ${fieldName}`;
            }
            backingDecl = this.computeDeclaration(fieldLine, Visibility.Private, classInfo);
        } else {
            if (spec.hasGetter && spec.getterName) {
                propLine += ` read ${spec.getterName}`;
            }
            if (spec.hasSetter && spec.setterName) {
                propLine += ` write ${spec.setterName}`;
            }
        }
        if (spec.isDefault) {
            propLine += ' default';
        }
        if (spec.isReadOnly) {
            // read-only is implicit when no write clause
        }
        propLine += ';';

        const decl = this.computeDeclaration(propLine, spec.visibility, classInfo);

        // Place the backing field in the private section and the property in its
        // own visibility section as two separate inserts (a single fused insert
        // would drop the property into the private section when it is public).
        if (backingDecl) {
            return {
                declaration: decl.text,
                implementation: '',
                declarationPosition: decl.position,
                implementationPosition: decl.position,
                extraDeclaration: backingDecl.text,
                extraDeclarationPosition: backingDecl.position,
            };
        }

        return {
            declaration: decl.text,
            implementation: '',
            declarationPosition: decl.position,
            implementationPosition: decl.position,
        };
    }

    supportsBackingField(): boolean {
        return true;
    }

    formatLocalVariable(name: string, type: string): string {
        return `${name}: ${type};`;
    }

    guessTypeFromAssignment(rhs: string, _scope: MethodScope): string | undefined {
        return this.guessFromLiteral(rhs, 'Integer', 'Extended', 'string', 'Boolean');
    }

    getMethodBodyRange(document: vscode.TextDocument, member: ClassMember): vscode.Range | undefined {
        if (!member.implementationRange) return undefined;
        const lines = document.getText().split(/\r?\n/);
        const startLine = member.implementationRange.start.line;
        const endLine = member.implementationRange.end.line;
        let beginLine = startLine;
        for (let i = startLine; i <= endLine; i++) {
            if (/^\s*begin\b/i.test(lines[i] ?? '')) { beginLine = i + 1; break; }
        }
        let endBody = endLine;
        for (let i = endLine; i >= startLine; i--) {
            if (/^\s*end\s*;?\s*$/i.test(lines[i] ?? '')) { endBody = i - 1; break; }
        }
        return new vscode.Range(beginLine, 0, endBody, (lines[endBody] ?? '').length);
    }

    getDeclarationInsertPosition(document: vscode.TextDocument, member: ClassMember): vscode.Position {
        const lines = document.getText().split(/\r?\n/);
        const implStart = member.implementationRange?.start.line ?? member.range.start.line;
        const body = this.getMethodBodyRange(document, member);
        const bodyStart = body ? body.start.line : implStart;
        for (let i = bodyStart; i >= implStart; i--) {
            if (/^\s*var\b/i.test(lines[i] ?? '')) { return new vscode.Position(i + 1, 0); }
        }
        return new vscode.Position(bodyStart, 0);
    }

    parseLocals(document: vscode.TextDocument, member: ClassMember): LocalVariable[] {
        const lines = document.getText().split(/\r?\n/);
        const locals: LocalVariable[] = [];
        const implStart = member.implementationRange?.start.line;

        // Parameters (from member.parameters).
        for (const p of member.parameters ?? []) {
            const paramIdx = lines.findIndex((l, i) => i >= (implStart ?? 0) && new RegExp('\\b' + p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(l));
            if (paramIdx >= 0) {
                const col = lines[paramIdx].indexOf(p.name);
                locals.push({
                    name: p.name, type: p.type, isParam: true,
                    range: new vscode.Range(paramIdx, col, paramIdx, col + p.name.length),
                    declarationRange: new vscode.Range(paramIdx, col, paramIdx, lines[paramIdx].length),
                });
            }
        }

        if (!member.implementationRange || implStart === undefined) return locals;
        const body = this.getMethodBodyRange(document, member);
        if (!body) return locals;

        // Locate the `begin` line, then scan for a `var` section between the impl
        // header and `begin`.
        let beginLine = implStart;
        for (let i = implStart; i <= body.end.line; i++) {
            if (/^\s*begin\b/i.test(lines[i] ?? '')) { beginLine = i; break; }
        }
        let varStart = -1;
        for (let i = implStart; i < beginLine; i++) {
            if (/^\s*var\b/i.test(lines[i] ?? '')) { varStart = i + 1; break; }
        }
        if (varStart < 0) return locals;

        // Parse the var section. Handles three layouts the old single-name
        // regex missed:
        //   a: Integer;
        //   a, b, c: Integer;          (several names sharing a type)
        //   a, b,                      (continues on the next line until ;)
        //   c: Integer;
        // Accumulate raw var-section lines, joining continuation lines until we
        // hit a terminating ';', then split the name list from the type.
        let acc = '';
        let accStartLine = -1;
        const flushVarDecl = (raw: string, declStart: number) => {
            const flat = raw.replace(/\s+/g, ' ').trim();
            // name(s) : type;  — type may contain spaces/generics.
            const m = flat.match(/^([\w, ]+?)\s*:\s*(.+?)\s*;?\s*$/);
            if (!m) { return; }
            const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
            const type = m[2].trim();
            for (const name of names) {
                // Locate the original column of this name on its real line so
                // rename/type edits target the right token.
                const idx = lines[declStart]?.indexOf(name) ?? -1;
                const col = idx >= 0 ? idx : 2;
                locals.push({
                    name, type, isParam: false,
                    range: new vscode.Range(declStart, col, declStart, col + name.length),
                    declarationRange: new vscode.Range(declStart, col, declStart, lines[declStart]?.length ?? 0),
                });
            }
        };

        // Precompute line ranges occupied by nested procedure/function bodies
        // (a nested routine carries its own var/begin/end that must NOT be
        // mixed into the parent's locals). Each nested routine runs from its
        // `procedure`/`function` header to the matching `end;`. We only need the
        // header span (up to its terminating ';') since the body's begin..end is
        // inside the parent's begin..end and not in the var section.
        const skipRanges: [number, number][] = [];
        for (let i = varStart; i < beginLine; i++) {
            const line = (lines[i] ?? '').trim();
            if (/^(procedure|function)\b/i.test(line)) {
                // Nested routine header: skip until the terminating ';' that
                // closes its signature (may span multiple lines).
                let j = i;
                let depth = 0;
                for (; j < beginLine; j++) {
                    const t = (lines[j] ?? '');
                    for (const ch of t) { if (ch === '(') depth++; else if (ch === ')') depth--; }
                    if (depth <= 0 && /;\s*$/.test(t.trim())) { break; }
                }
                skipRanges.push([i, j]);
                i = j;
            }
        }
        const isSkipped = (ln: number) => skipRanges.some(([a, b]) => ln >= a && ln <= b);

        for (let i = varStart; i < beginLine; i++) {
            if (isSkipped(i)) { continue; }
            const line = lines[i] ?? '';
            if (accStartLine < 0) { accStartLine = i; }
            acc += (acc && !acc.endsWith(' ') ? ' ' : '') + line.trim();
            if (/;\s*$/.test(line.trim())) {
                flushVarDecl(acc, accStartLine);
                acc = '';
                accStartLine = -1;
            }
        }
        if (acc.trim()) { flushVarDecl(acc, accStartLine < 0 ? varStart : accStartLine); }

        // Filter out false positives that slipped through nested routine
        // signatures: Pascal keywords, names with spaces, and duplicates of an
        // already-collected local (a nested routine parameter can share a name
        // with a parent local but with a different declaration line).
        const KEYWORDS = /^(var|const|type|begin|end|procedure|function|if|then|else|for|while|do|repeat|until|case|of|with|try|except|finally|raise|and|or|not|in|is|as|to|downto|div|mod|shl|shr|nil|true|false|inherited|self)$/i;
        const seen = new Set<string>();
        const filtered = locals.filter(l => {
            const n = l.name.trim();
            if (!n || KEYWORDS.test(n) || /\s/.test(n)) { return false; }
            if (seen.has(n)) { return false; }
            seen.add(n);
            return true;
        });
        return filtered;
    }

    getInsertPosition(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        memberKind: 'method' | 'field' | 'property'
    ): InsertPosition {
        const text = document.getText();
        const lines = text.split(/\r?\n/);

        const declPos = this.findDeclarationInsertPosition(classInfo, lines, memberKind);
        const implPos = this.findImplementationInsertPosition(lines);

        return {
            declaration: declPos,
            implementation: implPos,
        };
    }

    getVisibilityModifiers(): Visibility[] {
        return [Visibility.Private, Visibility.Protected, Visibility.Public, Visibility.Published];
    }

    getAvailableModifiers(): string[] {
        return [
            'virtual', 'override', 'abstract', 'dynamic',
            'reintroduce', 'final', 'overload', 'class',
        ];
    }

    getTypeDefaults() {
        return { defaultReturnType: '', defaultFieldType: 'Integer', defaultPropertyType: 'string', defaultParamType: 'Integer' };
    }
    getTypeSuggestions() {
        return ['Integer', 'String', 'Boolean', 'Double', 'Extended', 'Real', 'Char', 'TDateTime', 'TStringList', 'TList', 'Pointer', 'Variant', 'Cardinal', 'Int64', 'Word', 'Byte'];
    }
    getVisibilityOptions() {
        return [Visibility.Private, Visibility.Protected, Visibility.Public, Visibility.Published];
    }
    getLocalSectionKeyword() {
        return 'var';
    }

    getDefaultVisibility(): Visibility {
        return Visibility.Published;
    }

    // Pascal splits a method's declaration (in the class body) from its
    // implementation (in the implementation section). The generic stub generator
    // only emits declarations, which would produce methods with no body, so
    // interface stubs are disabled until split-body support is added.
    generateMissingStubs(_className: string, _interfaceInfo: ClassInfo, _classInfo: ClassInfo): string | undefined {
        return undefined;
    }

    supportsMissingStubs(): boolean {
        return false;
    }

    // Pascal stores interface and implementation in the same .pas file, so there
    // is no paired file. The base findPairedFile already returns undefined.

    synchronizeDeclarationImplementation(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        member: ClassMember
    ): vscode.TextEdit[] {
        const text = document.getText();
        const lines = text.split(/\r?\n/);

        const hasImpl = this.findImplementationForMember(lines, classInfo.name, member.name);

        if (hasImpl !== undefined) {
            return [];
        }

        if (member.kind === MemberKind.Field || member.kind === MemberKind.Property) {
            return [];
        }

        const implPos = this.findImplementationInsertPosition(lines);
        const implCode = this.buildImplementationFromMember(classInfo.name, member);

        const edits: vscode.TextEdit[] = [
            new vscode.TextEdit(
                new vscode.Range(implPos, implPos),
                implCode,
            ),
        ];

        return edits;
    }

    sortMembers(members: ClassMember[], scheme: SortScheme): ClassMember[] {
        const kindOrder = new Map(scheme.order.map((k, i) => [k, i]));
        const visOrder = new Map(scheme.visibilityOrder.map((v, i) => [v, i]));

        return [...members].sort((a, b) => {
            const kindA = kindOrder.get(a.kind) ?? 999;
            const kindB = kindOrder.get(b.kind) ?? 999;
            if (kindA !== kindB) return kindA - kindB;

            if (scheme.groupByVisibility) {
                const visA = visOrder.get(a.visibility) ?? 999;
                const visB = visOrder.get(b.visibility) ?? 999;
                if (visA !== visB) return visA - visB;
            }

            return a.name.localeCompare(b.name);
        });
    }

    extractMethod(
        context: RefactoringContext,
        methodName: string,
        parameters: string[],
        returnType: string
    ): vscode.TextEdit[] {
        const text = context.document.getText();
        const lines = text.split(/\r?\n/);

        const sel = context.selection ?? context.range;
        if (!sel) return [];

        const selectedText = context.document.getText(sel);
        const params = parameters.length > 0 ? `(${parameters.join('; ')})` : '';
        const className = this.findClassAtPosition(context.document, sel.start)?.name;

        let implHeader: string;
        if (returnType && returnType !== '' && returnType !== 'void') {
            implHeader = className
                ? `function ${this.qualifiedClassName(className)}.${methodName}${params}: ${returnType};`
                : `function ${methodName}${params}: ${returnType};`;
        } else {
            implHeader = className
                ? `procedure ${this.qualifiedClassName(className)}.${methodName}${params};`
                : `procedure ${methodName}${params};`;
        }

        const newMethod = `\n${implHeader}\nbegin\n  ${selectedText}\nend;\n`;
        const implPos = this.findImplementationInsertPosition(lines);

        const edits: vscode.TextEdit[] = [];
        edits.push(new vscode.TextEdit(sel, `${methodName}${params}`));
        edits.push(new vscode.TextEdit(new vscode.Range(implPos, implPos), newMethod));

        return edits;
    }

    private extractUnitName(text: string): string {
        const m = text.match(/^\s*unit\s+([\w.]+)\s*;/im);
        return m ? m[1] : '';
    }

    private extractUses(text: string): string[] {
        const result: string[] = [];
        const usesPattern = /uses\s+([\s\S]*?);/gi;
        let match: RegExpExecArray | null;
        while ((match = usesPattern.exec(text)) !== null) {
            const items = match[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
            result.push(...items);
        }
        return result;
    }

    private extractClassBlocks(lines: string[]): RawClassBlock[] {
        const results: RawClassBlock[] = [];
        const text = lines.join('\n');

        const interfaceStart = text.search(/\binterface\b/im);
        const implementationStart = text.search(/\bimplementation\b/im);
        const searchEnd = implementationStart > 0 ? implementationStart : text.length;
        const searchRegion = interfaceStart >= 0 ? text.substring(0, searchEnd) : text;

        const classPattern = /(\w+)(?:\s*<[^=;]*>)?\s*=\s*class(?:\s*\(([^)]*)\))?/gi;
        const interfaceTypePattern = /(\w+)(?:\s*<[^=;]*>)?\s*=\s*interface(?:\s*\(([^)]*)\))?/gi;
        const recordPattern = /(\w+)(?:\s*<[^=;]*>)?\s*=\s*record/gi;

        let match: RegExpExecArray | null;

        const classRanges: Array<{
            name: string;
            parentClass: string | undefined;
            interfaces: string[];
            isInterface: boolean;
            isRecord: boolean;
            charOffset: number;
            matchLength: number;
        }> = [];

        // searchRegion always starts at position 0 of text (either text itself or text.substring(0, searchEnd)),
        // so regex match indices are already absolute — no offset correction needed.
        const searchOffset = 0;

        while ((match = classPattern.exec(searchRegion)) !== null) {
            const name = match[1];
            if (this.isKeyword(name)) continue;
            const { parentClass, interfaces } = this.parseInheritance(match[2]);
            classRanges.push({
                name,
                parentClass,
                interfaces,
                isInterface: false,
                isRecord: false,
                charOffset: match.index,
                matchLength: match[0].length,
            });
        }

        while ((match = interfaceTypePattern.exec(searchRegion)) !== null) {
            const name = match[1];
            if (this.isKeyword(name)) continue;
            const { parentClass, interfaces } = this.parseInheritance(match[2]);
            classRanges.push({
                name,
                parentClass,
                interfaces,
                isInterface: true,
                isRecord: false,
                charOffset: match.index,
                matchLength: match[0].length,
            });
        }

        while ((match = recordPattern.exec(searchRegion)) !== null) {
            const name = match[1];
            if (this.isKeyword(name)) continue;
            classRanges.push({
                name,
                parentClass: undefined,
                interfaces: [],
                isInterface: false,
                isRecord: true,
                charOffset: match.index,
                matchLength: match[0].length,
            });
        }

        classRanges.sort((a, b) => a.charOffset - b.charOffset);

        for (let i = 0; i < classRanges.length; i++) {
            const entry = classRanges[i];
            const startLine = this.lineFromOffset(text, entry.charOffset + searchOffset);

            let endLine = lines.length - 1;
            let depth = 0;
            let foundStart = false;

            for (let ln = startLine; ln < lines.length; ln++) {
                const line = lines[ln];
                // Case-insensitive: Pascal allows `class`, `Class`, `record`, `Record`, etc.
                const lowerLine = line.toLowerCase();
                if (!foundStart && lowerLine.includes('=') && (lowerLine.includes('class') || lowerLine.includes('interface') || lowerLine.includes('record'))) {
                    foundStart = true;
                    depth = 0;
                }
                if (foundStart) {
                    if (entry.isRecord) {
                        if (ln > startLine && /^\s*end\s*;/i.test(line)) {
                            endLine = ln;
                            break;
                        }
                    } else {
                        for (const ch of line) {
                            if (ch === '(') depth++;
                            if (ch === ')') depth--;
                        }
                        if (depth <= 0 && /^\s*end\s*;/i.test(line)) {
                            endLine = ln;
                            break;
                        }
                    }
                }
            }

            const bodyStartLine = startLine + 1;
            const bodyLines: string[] = [];
            for (let ln = bodyStartLine; ln < endLine; ln++) {
                bodyLines.push(lines[ln]);
            }

            results.push({
                name: entry.name,
                parentClass: entry.parentClass,
                interfaces: entry.interfaces,
                isInterface: entry.isInterface,
                isRecord: entry.isRecord,
                startLine,
                endLine,
                bodyStartLine,
                body: bodyLines.join('\n'),
            });
        }

        return results;
    }

    private parseClassMembers(
        raw: RawClassBlock,
        allLines: string[],
        implementations: ImplementationEntry[]
    ): ClassMember[] {
        const members: ClassMember[] = [];
        let currentVisibility: Visibility = raw.isInterface ? Visibility.Public : Visibility.Published;

        const bodyLines = raw.body.split('\n');

        for (let i = 0; i < bodyLines.length; i++) {
            const line = bodyLines[i].trim();

            if (!line || line.startsWith('//') || line.startsWith('{')) continue;

            const visMatch = this.matchVisibility(line);
            if (visMatch) {
                currentVisibility = visMatch;
                continue;
            }

            // a declaration can wrap over several lines (`procedure Foo` / `(Sender: TObject);`): it is read as one
            const last = this.declarationEnd(bodyLines, i);
            const text = last > i ? bodyLines.slice(i, last + 1).map(l => this.withoutComments(l).trim()).join(' ') : line;
            const member = this.parseMemberLine(
                text, currentVisibility, raw.bodyStartLine + i, allLines, raw.name, implementations
            );
            if (member) {
                if (last > i) {
                    member.range = new vscode.Range(
                        new vscode.Position(raw.bodyStartLine + i, 0),
                        new vscode.Position(raw.bodyStartLine + last, allLines[raw.bodyStartLine + last]?.length ?? 0),
                    );
                }
                members.push(member);
            }
            i = last;
        }

        return members;
    }

    private withoutComments(line: string): string {
        return line.replace(/\{[^}]*\}/g, '').replace(/\(\*.*?\*\)/g, '').replace(/\/\/.*$/, '');
    }

    /** Last line of the declaration that starts on line `start`: the one with the ; outside the parentheses (the line itself when it is on one line). */
    private declarationEnd(lines: string[], start: number): number {
        if (!/^\s*(?:class\s+)?(?:procedure|function|constructor|destructor|property)\b/i.test(lines[start])) { return start; }
        let depth = 0;
        for (let j = start; j < lines.length && j < start + 30; j++) {
            for (const ch of this.withoutComments(lines[j])) {
                if (ch === '(' || ch === '[') { depth++; } else if (ch === ')' || ch === ']') { depth--; } else if (ch === ';' && depth <= 0) { return j; }
            }
        }
        return start;
    }

    private matchVisibility(line: string): Visibility | undefined {
        const trimmed = line.toLowerCase().replace(/\s+/g, ' ').trim();
        if (trimmed === 'strict private') return Visibility.Private;
        if (trimmed === 'strict protected') return Visibility.Protected;
        for (const kw of VISIBILITY_KEYWORDS) {
            if (trimmed === kw) return VISIBILITY_MAP[kw];
        }
        return undefined;
    }

    private parseMemberLine(
        line: string,
        visibility: Visibility,
        lineNumber: number,
        allLines: string[],
        className: string,
        implementations: ImplementationEntry[]
    ): ClassMember | undefined {
        if (/^\s*$/.test(line)) return undefined;

        const constructorMatch = line.match(/^constructor\s+Create\s*(?:\(([^)]*)\))?\s*;\s*(.*)$/i);
        if (constructorMatch) {
            const params = this.parseParams(constructorMatch[1]);
            const mods = this.parseTrailingModifiers(constructorMatch[2]);
            return this.buildMember(
                MemberKind.Constructor, 'Create', visibility, lineNumber, allLines,
                params, undefined, mods, className, implementations
            );
        }

        const destructorMatch = line.match(/^destructor\s+Destroy\s*(?:\(([^)]*)\))?\s*;\s*(.*)$/i);
        if (destructorMatch) {
            const mods = this.parseTrailingModifiers(destructorMatch[2] || '');
            return this.buildMember(
                MemberKind.Destructor, 'Destroy', visibility, lineNumber, allLines,
                [], undefined, mods, className, implementations
            );
        }

        const funcMatch = line.match(/^function\s+(\w+)\s*(?:\(([^)]*)\))?\s*:\s*([^;]+)\s*;\s*(.*)$/i);
        if (funcMatch) {
            const name = funcMatch[1];
            const params = this.parseParams(funcMatch[2]);
            const returnType = funcMatch[3].trim();
            const mods = this.parseTrailingModifiers(funcMatch[4]);
            return this.buildMember(
                MemberKind.Method, name, visibility, lineNumber, allLines,
                params, returnType, mods, className, implementations
            );
        }

        const procMatch = line.match(/^procedure\s+(\w+)\s*(?:\(([^)]*)\))?\s*;\s*(.*)$/i);
        if (procMatch) {
            const name = procMatch[1];
            const params = this.parseParams(procMatch[2]);
            const mods = this.parseTrailingModifiers(procMatch[3]);
            return this.buildMember(
                MemberKind.Method, name, visibility, lineNumber, allLines,
                params, undefined, mods, className, implementations
            );
        }

        const classProcMatch = line.match(/^class\s+(?:procedure|function)\s+(\w+)\s*(?:\(([^)]*)\))?\s*(?::\s*([^;]+))?\s*;\s*(.*)$/i);
        if (classProcMatch) {
            const name = classProcMatch[1];
            const params = this.parseParams(classProcMatch[2]);
            const returnType = classProcMatch[3]?.trim();
            const mods = ['class', ...this.parseTrailingModifiers(classProcMatch[4])];
            return this.buildMember(
                MemberKind.Method, name, visibility, lineNumber, allLines,
                params, returnType, mods, className, implementations
            );
        }

        const propMatch = line.match(
            /^property\s+(\w+)\s*(?::\s*([^;]+?))?\s*(?:read\s+(\w+))?\s*(?:write\s+(\w+))?\s*(?:default\s+(\w+))?\s*;(.*)$/i
        );
        if (propMatch) {
            const name = propMatch[1];
            const typeStr = (propMatch[2] || '').trim().split(/\s+/)[0] || '';
            const getter = propMatch[3];
            const setter = propMatch[4];
            const defaultVal = propMatch[5];
            const indexExpr = propMatch[6]?.trim();

            return {
                id: nextId('mem'),
                kind: MemberKind.Property,
                name,
                type: typeStr,
                visibility,
                parameters: [],
                modifiers: [
                    ...(getter ? [`read ${getter}`] : []),
                    ...(setter ? [`write ${setter}`] : []),
                    ...(defaultVal ? [`default ${defaultVal}`] : []),
                ],
                isStatic: false,
                isVirtual: false,
                isAbstract: false,
                isOverride: false,
                range: new vscode.Range(
                    new vscode.Position(lineNumber, 0),
                    new vscode.Position(lineNumber, allLines[lineNumber]?.length ?? 0),
                ),
            };
        }

        const fieldMatch = line.match(/^([A-Za-z]\w*)\s*:\s*([^;]+);?\s*$/);
        if (fieldMatch) {
            const name = fieldMatch[1];
            const typeStr = fieldMatch[2].trim().replace(/;.*$/, '').trim();
            if (/^(procedure|function|property|constructor|destructor|class)$/i.test(name)) {
                return undefined;
            }
            return {
                id: nextId('mem'),
                kind: MemberKind.Field,
                name,
                type: typeStr,
                visibility,
                parameters: [],
                modifiers: [],
                isStatic: false,
                isVirtual: false,
                isAbstract: false,
                isOverride: false,
                range: new vscode.Range(
                    new vscode.Position(lineNumber, 0),
                    new vscode.Position(lineNumber, allLines[lineNumber]?.length ?? 0),
                ),
            };
        }

        return undefined;
    }

    private buildMember(
        kind: MemberKind,
        name: string,
        visibility: Visibility,
        lineNumber: number,
        allLines: string[],
        parameters: Parameter[],
        returnType: string | undefined,
        modifiers: string[],
        className: string,
        implementations: ImplementationEntry[]
    ): ClassMember {
        const impl = implementations.find(
            e => e.className === className && e.methodName === name
        );

        return {
            id: nextId('mem'),
            kind,
            name,
            returnType,
            visibility,
            parameters,
            modifiers,
            isStatic: modifiers.includes('class'),
            isVirtual: modifiers.includes('virtual'),
            isAbstract: modifiers.includes('abstract'),
            isOverride: modifiers.includes('override'),
            range: new vscode.Range(
                new vscode.Position(lineNumber, 0),
                new vscode.Position(lineNumber, allLines[lineNumber]?.length ?? 0),
            ),
            implementationRange: impl
                ? new vscode.Range(
                    new vscode.Position(impl.startLine, 0),
                    new vscode.Position(impl.endLine, allLines[impl.endLine]?.length ?? 0),
                )
                : undefined,
            ...(impl ? nestedOf(allLines, impl.startLine, impl.endLine, name) : undefined),
        };
    }

    private extractImplementations(lines: string[]): ImplementationEntry[] {
        const results: ImplementationEntry[] = [];
        let inImplementation = false;

        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();

            if (/^implementation\b/i.test(trimmed)) {
                inImplementation = true;
                continue;
            }
            if (/^end\.\s*$/i.test(trimmed)) break;
            if (!inImplementation) continue;

            // `procedure TFoo.Bar(...)`: the header may wrap onto several lines (the name alone on a line,
            // the parameters on the next ones), so it is read up to the ; that ends it.
            if (!/^(?:class\s+)?(?:constructor|destructor|function|procedure)\b/i.test(trimmed)) { continue; }
            const header = this.routineHeader(lines, i);
            // even the dot can end a line: `procedure TFoo.` / `Bar(...)`
            const start = header.match(/^(?:class\s+)?(constructor|destructor|function|procedure)\s+(\w+)(?:\s*<[^.;()]*>)?\s*\.\s*(\w+)\b/i);
            if (!start) { continue; }
            const rest = header.slice(start[0].length);
            const kind = start[1].toLowerCase();
            const sig = kind === 'function'
                ? rest.match(/^\s*(?:\(((?:[^()]|\([^()]*\))*)\))?\s*:\s*([^;]+);/)
                : rest.match(/^\s*(?:\(((?:[^()]|\([^()]*\))*)\))?\s*;/);
            if (!sig) { continue; }
            results.push({
                className: start[2],
                methodName: start[3],
                fullSignature: header,
                startLine: i,
                endLine: this.findImplementationEnd(lines, i),
                params: sig[1] || '',
                returnType: kind === 'function' ? sig[2].trim() : undefined,
                kind: kind === 'constructor' ? MemberKind.Constructor : kind === 'destructor' ? MemberKind.Destructor : MemberKind.Method,
            });
        }

        return results;
    }

    /** The header of a routine joined on one line: from its first line to the ; outside the parentheses (comments removed). */
    private routineHeader(lines: string[], start: number): string {
        let text = '';
        let depth = 0;
        for (let j = start; j < lines.length && j < start + 24; j++) {
            const part = lines[j].replace(/\{[^}]*\}/g, '').replace(/\(\*.*?\*\)/g, '').replace(/\/\/.*$/, '').trim();
            text += (text ? ' ' : '') + part;
            for (const ch of part) {
                if (ch === '(') { depth++; } else if (ch === ')') { depth--; } else if (ch === ';' && depth <= 0) { return text; }
            }
        }
        return text;
    }

    private findImplementationEnd(lines: string[], startLine: number): number {
        // The routine ends at the `end;` that closes its own body: the routines declared inside it come first
        // (each with its own begin / end), so the first `end` met is not the one. Comments and strings are blanked,
        // and `begin`, `try`, `case`, `asm` and `record` each open a block that an `end` closes.
        let code = blankedLines.get(lines);
        if (!code) { code = blankPascal(lines); blankedLines.set(lines, code); }
        return routineEnd(code, startLine, lines.length - 1);
    }

    private extractStandaloneProcedures(
        lines: string[],
        classRanges: { startLine: number; endLine: number }[] = [],
    ): ClassMember[] {
        const results: ClassMember[] = [];
        const isInsideClassBody = (line: number): boolean =>
            classRanges.some(r => line >= r.startLine && line <= r.endLine);
        let implStart = -1;

        for (let i = 0; i < lines.length; i++) {
            if (/^implementation\b/i.test(lines[i].trim())) {
                implStart = i;
                break;
            }
        }

        const declarations: { name: string; isFunc: boolean; line: number; endLine: number; params?: string; returnType?: string }[] = [];

        // Helper: does `text` contain a ';' at paren depth 0 (the declaration terminator)?
        const hasTerminator = (text: string): boolean => {
            let depth = 0;
            for (const ch of text) {
                if (ch === '(') depth++;
                else if (ch === ')') depth--;
                else if (ch === ';' && depth <= 0) return true;
            }
            return false;
        };

        let i = 0;
        while (i < lines.length) {
            if (implStart >= 0 && i >= implStart) break;
            const trimmed = lines[i].trim();
            if (/^end\.\s*$/i.test(trimmed)) break;
            if (isInsideClassBody(i)) { i++; continue; }
            // Skip class method implementations/declarations (TFoo.Bar)
            if (/^\s*(?:procedure|function)\s+\w+(?:\s*<[^.;()]*>)?\s*\./.test(trimmed)) { i++; continue; }

            const startMatch = trimmed.match(/^(procedure|function)\s+(\w+)\b/i);
            if (!startMatch) { i++; continue; }

            const isFunc = startMatch[1].toLowerCase() === 'function';
            const startLine = i;

            // A declaration may span multiple lines until the terminating ';'
            // at paren depth 0. Accumulate lines until balanced & terminated.
            let acc = '';
            let endLine = i;
            let terminated = false;
            for (let j = i; j < lines.length; j++) {
                acc += (j > i ? ' ' : '') + lines[j].trim();
                if (hasTerminator(acc)) { endLine = j; terminated = true; break; }
                if (implStart >= 0 && j >= implStart) break;
            }
            if (!terminated) { i++; continue; }

            const flat = acc.replace(/\s+/g, ' ').trim();
            const funcMatch = flat.match(/^function\s+(\w+)\s*(?:\(([^)]*)\))?\s*:\s*([^;]+);/i);
            const procMatch = flat.match(/^procedure\s+(\w+)\s*(?:\(([^)]*)\))?\s*;/i);

            if (isFunc && funcMatch) {
                declarations.push({ name: funcMatch[1], isFunc: true, line: startLine, endLine, params: funcMatch[2], returnType: funcMatch[3].trim() });
            } else if (!isFunc && procMatch) {
                declarations.push({ name: procMatch[1], isFunc: false, line: startLine, endLine, params: procMatch[2] });
            }

            i = endLine + 1;
        }

        // Implementation-only routines (no forward declaration in the interface
        // section) are legal Pascal and must stay visible: scan the
        // implementation section for unqualified routine definitions that were
        // not collected above. Their declaration and body are the same block.
        if (implStart >= 0) {
            const known = new Set(declarations.map(d => d.name.toLowerCase()));
            let i = implStart;
            while (i < lines.length) {
                const trimmed = lines[i].trim();
                if (/^end\.\s*$/i.test(trimmed)) break;
                if (/^\s*(?:procedure|function)\s+\w+(?:\s*<[^.;()]*>)?\s*\./.test(trimmed)) { i++; continue; }
                const startMatch = trimmed.match(/^(procedure|function)\s+(\w+)\b/i);
                if (!startMatch || known.has(startMatch[2].toLowerCase())) { i++; continue; }

                const isFunc = startMatch[1].toLowerCase() === 'function';
                const startLine = i;
                let acc = '';
                let endLine = i;
                let terminated = false;
                for (let j = i; j < lines.length; j++) {
                    acc += (j > i ? ' ' : '') + lines[j].trim();
                    if (hasTerminator(acc)) { endLine = j; terminated = true; break; }
                }
                if (!terminated) { i++; continue; }

                const flat = acc.replace(/\s+/g, ' ').trim();
                const funcMatch = flat.match(/^function\s+(\w+)\s*(?:\(([^)]*)\))?\s*:\s*([^;]+);/i);
                const procMatch = flat.match(/^procedure\s+(\w+)\s*(?:\(([^)]*)\))?\s*;/i);
                const name = (isFunc ? funcMatch?.[1] : procMatch?.[1]) ?? startMatch[2];
                const paramsStr = (isFunc ? funcMatch?.[2] : procMatch?.[2]) ?? flat.match(/\(([^)]*)\)/)?.[1];
                const returnType = isFunc ? funcMatch?.[3]?.trim() : undefined;

                const bodyEnd = this.findImplementationEnd(lines, endLine);
                const block = new vscode.Range(
                    new vscode.Position(startLine, 0),
                    new vscode.Position(bodyEnd, lines[bodyEnd]?.length ?? 0),
                );
                results.push({
                    id: nextId('sproc'),
                    kind: MemberKind.Method,
                    name,
                    returnType,
                    visibility: Visibility.Public,
                    parameters: this.parseParams(paramsStr),
                    modifiers: [],
                    isStatic: false,
                    isVirtual: false,
                    isAbstract: false,
                    isOverride: false,
                    range: block,
                    implementationRange: block,
                });
                known.add(name.toLowerCase());
                i = bodyEnd + 1;
            }
        }

        for (const decl of declarations) {
            let implRange: vscode.Range | undefined;
            if (implStart >= 0) {
                const escapedName = this.escapeRegex(decl.name);
                const pattern = decl.isFunc
                    ? new RegExp('^function\\s+' + escapedName + '\\b', 'i')
                    : new RegExp('^procedure\\s+' + escapedName + '\\b', 'i');
                for (let i = implStart; i < lines.length; i++) {
                    const trimmed = lines[i].trim();
                    if (/^end\.\s*$/i.test(trimmed)) break;
                    if (/^\s*(?:procedure|function)\s+\w+(?:\s*<[^.;()]*>)?\s*\./.test(trimmed)) continue;
                    if (pattern.test(trimmed)) {
                        const end = this.findImplementationEnd(lines, i);
                        implRange = new vscode.Range(
                            new vscode.Position(i, 0),
                            new vscode.Position(end, lines[end]?.length ?? 0),
                        );
                        break;
                    }
                }
            }

            results.push({
                id: nextId('sproc'),
                kind: MemberKind.Method,
                name: decl.name,
                returnType: decl.returnType,
                visibility: Visibility.Public,
                parameters: this.parseParams(decl.params),
                modifiers: [],
                isStatic: false,
                isVirtual: false,
                isAbstract: false,
                isOverride: false,
                range: new vscode.Range(
                    new vscode.Position(decl.line, 0),
                    new vscode.Position(decl.endLine, lines[decl.endLine]?.length ?? 0),
                ),
                implementationRange: implRange,
                ...(implRange ? nestedOf(lines, implRange.start.line, implRange.end.line, decl.name) : undefined),
            });
        }

        return results;
    }

    private parseParams(paramsStr: string | undefined): Parameter[] {
        if (!paramsStr || paramsStr.trim() === '') return [];

        const params: Parameter[] = [];
        const segments = this.splitParams(paramsStr);

        for (const seg of segments) {
            const trimmed = seg.trim();
            if (!trimmed) continue;

            const constMatch = trimmed.match(/^const\s+(.+)$/i);
            if (constMatch) {
                const inner = constMatch[1].trim();
                const innerParams = this.parseParamGroup(inner);
                for (const p of innerParams) {
                    params.push({ ...p, isConst: true, direction: 'in' });
                }
                continue;
            }

            const varMatch = trimmed.match(/^var\s+(.+)$/i);
            if (varMatch) {
                const inner = varMatch[1].trim();
                const innerParams = this.parseParamGroup(inner);
                for (const p of innerParams) {
                    params.push({ ...p, isVar: true, direction: 'inout' });
                }
                continue;
            }

            const outMatch = trimmed.match(/^out\s+(.+)$/i);
            if (outMatch) {
                const inner = outMatch[1].trim();
                const innerParams = this.parseParamGroup(inner);
                for (const p of innerParams) {
                    params.push({ ...p, isOut: true, direction: 'out' });
                }
                continue;
            }

            const innerParams = this.parseParamGroup(trimmed);
            params.push(...innerParams);
        }

        return params;
    }

    private parseParamGroup(group: string): Parameter[] {
        const result: Parameter[] = [];
        const colonIdx = group.lastIndexOf(':');
        if (colonIdx < 0) {
            return result;
        }
        const namesPart = group.substring(0, colonIdx).trim();
        const type = group.substring(colonIdx + 1).trim();
        if (!type) return result;
        const names = namesPart.split(',').map(n => n.trim()).filter(n => n.length > 0);
        for (const name of names) {
            result.push({ name, type });
        }
        return result;
    }

    private splitParams(paramsStr: string): string[] {
        const result: string[] = [];
        let depth = 0;
        let current = '';

        for (const ch of paramsStr) {
            if (ch === '(') { depth++; current += ch; }
            else if (ch === ')') { depth--; current += ch; }
            else if (ch === ';' && depth === 0) {
                result.push(current);
                current = '';
            } else {
                current += ch;
            }
        }

        if (current.trim()) result.push(current);
        return result;
    }

    private parseTrailingModifiers(text: string): string[] {
        if (!text) return [];
        const mods: string[] = [];
        const lower = text.toLowerCase().trim();

        for (const mod of METHOD_MODIFIERS) {
            const regex = new RegExp(`\\b${mod}\\b`, 'i');
            if (regex.test(lower)) {
                mods.push(mod);
            }
        }

        return mods;
    }

    private parseInheritance(parentStr: string | undefined): {
        parentClass: string | undefined;
        interfaces: string[];
    } {
        if (!parentStr || parentStr.trim() === '') {
            return { parentClass: undefined, interfaces: [] };
        }

        const parts = parentStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (parts.length === 0) {
            return { parentClass: undefined, interfaces: [] };
        }

        const parentClass = parts[0];
        const interfaces = parts.slice(1);

        return { parentClass, interfaces };
    }

    private isKeyword(name: string): boolean {
        const keywords = [
            'class', 'interface', 'record', 'procedure', 'function',
            'var', 'const', 'type', 'begin', 'end', 'if', 'then',
            'else', 'while', 'do', 'for', 'to', 'repeat', 'until',
            'case', 'of', 'with', 'try', 'except', 'finally',
            'raise', 'program', 'unit', 'library', 'package',
        ];
        return keywords.includes(name.toLowerCase());
    }

    private lineFromOffset(text: string, offset: number): number {
        let line = 0;
        for (let i = 0; i < offset && i < text.length; i++) {
            if (text[i] === '\n') line++;
        }
        return line;
    }

    private formatParameterList(params: Parameter[]): string {
        if (params.length === 0) return '';
        const parts = params.map(p => {
            let prefix = '';
            if (p.isConst) prefix = 'const ';
            else if (p.isVar) prefix = 'var ';
            else if (p.isOut) prefix = 'out ';
            return `${prefix}${p.name}: ${p.type}`;
        });
        return `(${parts.join('; ')})`;
    }

    private buildModifierString(spec: MemberSpec): string {
        const mods: string[] = [];
        if (spec.isVirtual) mods.push('virtual');
        if (spec.isOverride) mods.push('override');
        if (spec.isAbstract) mods.push('abstract');
        if (spec.isFinal) mods.push('final');
        if (spec.isStatic) mods.push('class');
        for (const m of spec.modifiers) {
            if (!mods.includes(m.name)) {
                mods.push(m.name);
            }
        }
        return mods.length > 0 ? ' ' + mods.join(' ') : '';
    }

    private generateMethodBody(spec: MemberSpec, _className: string): string {
        if (spec.kind === MemberKind.Constructor) {
            return '  inherited Create;\n  // TODO: initialize fields\n';
        }
        if (spec.kind === MemberKind.Destructor) {
            return '  // TODO: free resources\n  inherited Destroy;\n';
        }
        if (spec.returnType && spec.returnType !== '' && spec.returnType.toLowerCase() !== 'void') {
            const zeroVal = this.getZeroValue(spec.returnType);
            return `  // TODO: implement\n  Result := ${zeroVal};\n`;
        }
        return '  // TODO: implement\n';
    }

    private getZeroValue(typeName: string): string {
        const lower = typeName.toLowerCase().trim();
        switch (lower) {
            case 'integer':
            case 'int64':
            case 'longint':
            case 'word':
            case 'byte':
            case 'smallint':
            case 'shortint':
            case 'cardinal':
            case 'dword':
            case 'nativeint':
            case 'nativeuint':
                return '0';
            case 'boolean':
            case 'bytebool':
            case 'wordbool':
            case 'longbool':
                return 'False';
            case 'string':
            case 'ansistring':
            case 'widestring':
            case 'unicodestring':
            case 'shortstring':
            case 'rawbytestring':
                return "''";
            case 'double':
            case 'single':
            case 'extended':
            case 'real':
            case 'currency':
            case 'comp':
                return '0.0';
            case 'variant':
            case 'olevariant':
                return 'Unassigned';
            case 'pointer':
                return 'nil';
            case 'tobject':
            case 'tcomponent':
            case 'tcontrol':
                return 'nil';
            default:
                if (lower.startsWith('t')) return 'nil';
                return 'Default(' + typeName + ')';
        }
    }

    private visibilityKeyword(vis: Visibility): string {
        switch (vis) {
            case Visibility.Private: return 'private';
            case Visibility.Protected: return 'protected';
            case Visibility.Public: return 'public';
            case Visibility.Published: return 'published';
            default: return 'public';
        }
    }

    private findDeclarationInsertPosition(
        classInfo: ClassInfo,
        lines: string[],
        memberKind: 'method' | 'field' | 'property'
    ): vscode.Position {
        if (memberKind === 'field') {
            const fields = classInfo.members.filter(m => m.kind === MemberKind.Field);
            if (fields.length > 0) {
                const lastField = fields.reduce((a, b) => a.range.end.line > b.range.end.line ? a : b);
                const classEndLine = this.findClassEndLine(classInfo, lines);
                const line = Math.min(lastField.range.end.line + 1, classEndLine);
                const indent = (lines[line] || '').match(/^(\s*)/)?.[1] || '';
                return new vscode.Position(line, indent.length);
            }
            for (let i = classInfo.range.start.line; i <= classInfo.range.end.line; i++) {
                if (i >= lines.length) break;
                if (/^\s*(private|protected|public)\s*/i.test(lines[i])) {
                    const indent = lines[i].match(/^(\s*)/)?.[1] || '';
                    return new vscode.Position(i + 1, indent.length);
                }
            }
            const indent = (lines[classInfo.range.start.line] || '').match(/^(\s*)/)?.[1] || '';
            return new vscode.Position(classInfo.range.start.line + 1, indent.length);
        }

        let targetLine = classInfo.range.end.line;

        for (let i = classInfo.range.start.line; i <= classInfo.range.end.line; i++) {
            if (i >= lines.length) break;
            const trimmed = lines[i].trim().toLowerCase();
            if (/^\s*end\s*;/i.test(lines[i])) {
                targetLine = i;
                break;
            }
        }

        const line = lines[targetLine] || '';
        const indent = line.match(/^(\s*)/)?.[1] || '';
        const charPos = indent.length;

        return new vscode.Position(targetLine, charPos);
    }

    private findImplementationInsertPosition(lines: string[]): vscode.Position {
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim().toLowerCase();
            if (/^(initialization|finalization)\b/.test(trimmed)) {
                return new vscode.Position(i, 0);
            }
        }

        for (let i = lines.length - 1; i >= 0; i--) {
            const trimmed = lines[i].trim().toLowerCase();
            if (/^end\.\s*$/.test(trimmed)) {
                return new vscode.Position(i, 0);
            }
        }

        return new vscode.Position(lines.length, 0);
    }

    private findImplementationEndPosition(classInfo: ClassInfo): vscode.Position {
        return classInfo.range.end;
    }

    private findImplementationForMember(
        lines: string[],
        className: string,
        memberName: string
    ): vscode.Range | undefined {
        const escapedClass = this.escapeRegex(className);
        const escapedMember = this.escapeRegex(memberName);

        const patterns = [
            new RegExp(`^\\s*(?:procedure|function)\\s+${escapedClass}\\.${escapedMember}\\b`, 'im'),
            new RegExp(`^\\s*constructor\\s+${escapedClass}\\.Create\\b`, 'im'),
            new RegExp(`^\\s*destructor\\s+${escapedClass}\\.Destroy\\b`, 'im'),
        ];

        for (let i = 0; i < lines.length; i++) {
            for (const pattern of patterns) {
                if (pattern.test(lines[i])) {
                    const end = this.findImplementationEnd(lines, i);
                    return new vscode.Range(
                        new vscode.Position(i, 0),
                        new vscode.Position(end, lines[end]?.length ?? 0),
                    );
                }
            }
        }

        return undefined;
    }

    private buildImplementationFromMember(className: string, member: ClassMember): string {
        const params = this.formatParameterList(member.parameters);

        if (member.kind === MemberKind.Constructor) {
            return `\nconstructor ${this.qualifiedClassName(className)}.Create${params};\nbegin\n  inherited Create;\n  // TODO: initialize\nend;\n`;
        }

        if (member.kind === MemberKind.Destructor) {
            return `\ndestructor ${this.qualifiedClassName(className)}.Destroy;\nbegin\n  // TODO: cleanup\n  inherited Destroy;\nend;\n`;
        }

        if (member.returnType && member.returnType !== '') {
            const zeroVal = this.getZeroValue(member.returnType);
            return `\nfunction ${this.qualifiedClassName(className)}.${member.name}${params}: ${member.returnType};\nbegin\n  Result := ${zeroVal};\nend;\n`;
        }

        return `\nprocedure ${this.qualifiedClassName(className)}.${member.name}${params};\nbegin\n  // TODO: implement\nend;\n`;
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
