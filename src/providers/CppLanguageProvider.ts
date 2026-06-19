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
    return `cpp_${Date.now()}_${++_idCounter}`;
}

function getConfig<T>(section: string, defaultValue: T): T {
    const cfg = vscode.workspace.getConfiguration('mmx.cpp');
    return cfg.get<T>(section, defaultValue);
}

export class CppLanguageProvider extends BaseLanguageProvider {
    readonly languageId = 'cpp';
    readonly fileExtensions = ['.h', '.hpp', '.cpp', '.cc', '.cxx', '.hxx'];
    readonly displayName = 'C++';

    private static readonly RE_CLASS_DECL = /^\s*(class|struct)\s+(\w+)(?:\s*<([^>]*)>)?\s*(?::\s*((?:(?:public|protected|private)\s+\w+(?:\s*,\s*)?)+))?\s*\{?/;
    private static readonly RE_VISIBILITY = /^\s*(public|protected|private)\s*:/;
    private static readonly RE_TEMPLATE = /^\s*template\s*<([^>]*)>/;
    private static readonly RE_INCLUDE = /^\s*#\s*include\s+([<"][^>"]+[>"])/;
    private static readonly RE_PRAGMA_ONCE = /^\s*#pragma\s+once/;
    private static readonly RE_NAMESPACE_OPEN = /^\s*namespace\s+(\w+)\s*\{/;
    private static readonly RE_NAMESPACE_CLOSE = /^\s*\}\s*\/\/\s*namespace/;
    private static readonly RE_USING = /^\s*using\s+(?:namespace\s+)?(\S+)/;

    private static readonly RE_METHOD = /^\s*((?:(?:virtual|static|inline|explicit|friend|constexpr|mutable)\s+)*)([\w\s\*&:<>]+?)\s+(\w+)\s*\(([^)]*)\)\s*((?:\s*(?:const|override|final|= 0|=0|noexcept|&|&&))*)\s*[;{]/;
    private static readonly RE_CONSTRUCTOR = /^\s*(?:explicit\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*[^{;]+)?\s*(?:=\s*delete|=\s*default)?\s*[;{]/;
    private static readonly RE_DESTRUCTOR = /^\s*(?:virtual\s+)?~(\w+)\s*\(\s*\)\s*(?:=\s*default|=\s*delete|noexcept|override)?\s*[;{]/;
    private static readonly RE_FIELD = /^\s*((?:(?:mutable|static|constexpr|volatile|inline)\s+)*)([\w\s\*&:<>,]+?)\s+(\w+)\s*(?:=\s*[^;]+)?\s*;/;
    private static readonly RE_ACCESS_SPECIFIER = /^\s*(public|protected|private)\s*:/;

    private static readonly HEADER_EXTS = new Set(['.h', '.hpp', '.hxx', '.hh']);
    private static readonly SOURCE_EXTS = new Set(['.cpp', '.cc', '.cxx']);

    private indent(): string {
        return ' '.repeat(getConfig<number>('indentSize', 4));
    }

    private brace(): string {
        return getConfig<string>('braceStyle', 'newLine') === 'sameLine' ? ' {' : '\n' + this.indent() + '{';
    }

    getDefaultVisibility(): Visibility {
        const v = getConfig<string>('defaultVisibility', 'private');
        switch (v) {
            case 'public': return Visibility.Public;
            case 'protected': return Visibility.Protected;
            default: return Visibility.Private;
        }
    }

    getVisibilityModifiers(): Visibility[] {
        return [Visibility.Private, Visibility.Protected, Visibility.Public];
    }

    getTypeDefaults() {
        return { defaultReturnType: 'void', defaultFieldType: 'int', defaultPropertyType: 'std::string', defaultParamType: 'int' };
    }

    private isHeader(filePath: string): boolean {
        const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
        return CppLanguageProvider.HEADER_EXTS.has(ext);
    }

    private isSource(filePath: string): boolean {
        const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
        return CppLanguageProvider.SOURCE_EXTS.has(ext);
    }

    findPairedFile(uri: vscode.Uri): vscode.Uri | undefined {
        const filePath = uri.fsPath;
        const lastDot = filePath.lastIndexOf('.');
        if (lastDot < 0) return undefined;
        const base = filePath.substring(0, lastDot);

        const tryFind = (extensions: string[]): vscode.Uri | undefined => {
            for (const ext of extensions) {
                const candidatePath = base + ext;
                try {
                    const fs = require('fs');
                    if (fs.existsSync(candidatePath)) {
                        return vscode.Uri.file(candidatePath);
                    }
                } catch { /* ignore */ }
            }
            return undefined;
        };

        if (this.isHeader(filePath)) {
            return tryFind(['.cpp', '.cc', '.cxx']);
        } else if (this.isSource(filePath)) {
            return tryFind(['.h', '.hpp', '.hxx', '.hh']);
        }
        return undefined;
    }

    parseDocument(document: vscode.TextDocument): ParsedDocument {
        const text = document.getText();
        const lines = text.split(/\r?\n/);
        const classes: ClassInfo[] = [];
        const imports: string[] = [];
        const standaloneProcedures: ClassMember[] = [];
        let currentNamespace = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const incMatch = line.match(CppLanguageProvider.RE_INCLUDE);
            if (incMatch) {
                imports.push(incMatch[1]);
                continue;
            }

            const nsMatch = line.match(CppLanguageProvider.RE_NAMESPACE_OPEN);
            if (nsMatch) {
                currentNamespace = nsMatch[1];
                continue;
            }
        }

        this.parseClasses(lines, document.uri, classes, currentNamespace);

        if (this.isSource(document.uri.fsPath)) {
            this.parseSourceFileMethods(lines, document, classes);

            const pairedUri = this.findPairedFile(document.uri);
            if (pairedUri) {
                const headerClasses = this.parseHeaderForClasses(pairedUri);
                for (const hc of headerClasses) {
                    if (!classes.find(c => c.name === hc.name)) {
                        classes.push(hc);
                    }
                }
                this.parseSourceFileMethods(lines, document, classes);
            }
        }

        const standalone = this.extractStandaloneFunctions(lines, classes);

        return {
            uri: document.uri,
            languageId: this.languageId,
            classes,
            standaloneProcedures: standalone,
            imports,
        };
    }

    rewriteStandaloneFunction(currentText: string, spec: MemberSpec): string | undefined {
        const firstBrace = currentText.indexOf('{');
        const lastBrace = currentText.lastIndexOf('}');
        if (firstBrace < 0 || lastBrace <= firstBrace) return undefined;
        const body = currentText.substring(firstBrace + 1, lastBrace);
        const ret = (spec.returnType && spec.returnType !== 'void') ? spec.returnType : 'void';
        const params = spec.parameters.map(p => `${p.type || 'auto'} ${p.name}`).join(', ');
        return `${ret} ${spec.name}(${params}) {${body}}\n`;
    }

    // C++ splits declarations (header) from implementations (source). The generic
    // stub generator only emits declarations, which would leave methods without a
    // body and fail to link, so interface stubs are disabled until split-body
    // support is added.
    generateMissingStubs(_className: string, _interfaceInfo: ClassInfo, _classInfo: ClassInfo): string | undefined {
        return undefined;
    }

    private extractStandaloneFunctions(lines: string[], classes: ClassInfo[]): ClassMember[] {
        const result: ClassMember[] = [];
        // Only real class bodies (from class/struct blocks) constrain free functions.
        // Synthetic classes (out-of-line .cpp definitions) span the whole file and
        // must be ignored, otherwise they swallow every free function.
        const classRanges = classes
            .filter(c => !c.isSynthetic)
            .map(c => ({ start: c.range.start.line, end: c.range.end.line }));
        const inClass = (ln: number): boolean => classRanges.some(r => ln >= r.start && ln <= r.end);

        const KEYWORDS = new Set([
            'if', 'for', 'while', 'switch', 'return', 'throw', 'catch', 'do',
            'else', 'class', 'struct', 'namespace', 'using', 'sizeof', 'static_cast',
            'dynamic_cast', 'reinterpret_cast', 'const_cast',
        ]);

        for (let i = 0; i < lines.length; i++) {
            if (inClass(i)) continue;
            const line = lines[i];
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
            // Skip out-of-line member definitions (Class::method / Class::~Class).
            // Note: `std::string`, `std::vector`, ... also contain `::`, so only
            // match the `::name(` form, not type usages like `std::string&`.
            if (/::\s*~?\w+\s*\(/.test(trimmed)) continue;

            const m = trimmed.match(CppLanguageProvider.RE_METHOD);
            if (!m) continue;

            const returnType = (m[2] || '').trim();
            const name = m[3];
            const paramsStr = m[4] || '';
            const suffix = m[5] || '';

            if (!name || KEYWORDS.has(name)) continue;
            // Reject obvious non-functions (no parameter list name, or it's a macro-ish call).
            if (!returnType && !/^(int|void|char|bool|float|double|auto|std::)/.test(returnType)) {
                // require at least some return-type-like token to avoid false positives
                if (!returnType) continue;
            }

            const isDefinition = /\{/.test(trimmed) || (!trimmed.endsWith(';'));
            const endBody = isDefinition ? this.findMethodEndLine(lines, i) : i;
            result.push({
                id: uniqueId(),
                kind: MemberKind.Method,
                name,
                returnType: returnType || undefined,
                visibility: Visibility.Public,
                parameters: this.parseParameters(paramsStr),
                modifiers: this.extractModifiers(m[1] || '', suffix),
                isStatic: (m[1] || '').includes('static'),
                isVirtual: false,
                isAbstract: false,
                isOverride: suffix.includes('override'),
                range: new vscode.Range(i, line.indexOf(trimmed), i, line.length),
                implementationRange: isDefinition && endBody > i
                    ? new vscode.Range(i, 0, endBody, lines[endBody]?.length ?? 0)
                    : undefined,
            });
            if (isDefinition) i = endBody;
        }
        return result;
    }

    private parseHeaderForClasses(headerUri: vscode.Uri): ClassInfo[] {
        try {
            const fs = require('fs');
            const text = fs.readFileSync(headerUri.fsPath, 'utf-8');
            const lines = text.split(/\r?\n/);
            const classes: ClassInfo[] = [];
            let currentNamespace = '';

            for (let i = 0; i < lines.length; i++) {
                const nsMatch = lines[i].match(CppLanguageProvider.RE_NAMESPACE_OPEN);
                if (nsMatch) {
                    currentNamespace = nsMatch[1];
                }
            }

            this.parseClasses(lines, headerUri, classes, currentNamespace);
            return classes;
        } catch {
            return [];
        }
    }

    private static RE_IMPL_METHOD = /^\s*(?:((?:(?:virtual|static|inline|explicit|friend|constexpr|mutable)\s+)*)([\w\s\*&:<>]+?)\s+)?(\w+)\s*::\s*~?(\w+)\s*\(([^)]*)\)\s*((?:\s*(?:const|override|final|= 0|=0|noexcept|&|&&))*)\s*[;{]/;
    private static RE_IMPL_CTOR = /^\s*(?:explicit\s+)?(\w+)\s*::\s*(\w+)\s*\(([^)]*)\)\s*(?::\s*[^{;]+)?\s*[;{]/;
    private static RE_IMPL_DTOR = /^\s*(?:virtual\s+)?(\w+)\s*::\s*~(\w+)\s*\(\s*\)\s*(?:=\s*default|=\s*delete|noexcept)?\s*[;{]/;
    private static RE_IMPL_INIT = /^\s*(\w+)\s+(\w+)\s*::\s*(\w+)\s*(?:=\s*[^;]+)?\s*;/;

    private parseSourceFileMethods(lines: string[], document: vscode.TextDocument, classes: ClassInfo[]): void {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

            const dtorMatch = trimmed.match(CppLanguageProvider.RE_IMPL_DTOR);
            if (dtorMatch && dtorMatch[1] === dtorMatch[2]) {
                const className = dtorMatch[1];
                let cls = classes.find(c => c.name === className);
                if (!cls) {
                    cls = this.createSyntheticClass(className, document, classes);
                }
                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                const endLine = this.findMethodEndLine(lines, i);
                cls.members.push({
                    id: uniqueId(),
                    kind: MemberKind.Destructor,
                    name: `~${dtorMatch[2]}`,
                    visibility: Visibility.Public,
                    parameters: [],
                    modifiers: [],
                    isStatic: false, isVirtual: false, isAbstract: false, isOverride: false,
                    range,
                    implementationRange: new vscode.Range(i, 0, endLine, lines[endLine]?.length ?? 0),
                });
                i = endLine;
                continue;
            }

            const ctorMatch = trimmed.match(CppLanguageProvider.RE_IMPL_CTOR);
            if (ctorMatch && ctorMatch[1] === ctorMatch[2]) {
                const className = ctorMatch[1];
                let cls = classes.find(c => c.name === className);
                if (!cls) {
                    cls = this.createSyntheticClass(className, document, classes);
                }
                const params = this.parseParameters(ctorMatch[3]);
                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                const endLine = this.findMethodEndLine(lines, i);
                cls.members.push({
                    id: uniqueId(),
                    kind: MemberKind.Constructor,
                    name: ctorMatch[2],
                    visibility: Visibility.Public,
                    parameters: params,
                    modifiers: [],
                    isStatic: false, isVirtual: false, isAbstract: false, isOverride: false,
                    range,
                    implementationRange: new vscode.Range(i, 0, endLine, lines[endLine]?.length ?? 0),
                });
                i = endLine;
                continue;
            }

            const methodMatch = trimmed.match(CppLanguageProvider.RE_IMPL_METHOD);
            if (methodMatch && methodMatch[3] === methodMatch[3] && methodMatch[3] !== methodMatch[4]) {
                const className = methodMatch[3];
                const methodName = methodMatch[4];
                let cls = classes.find(c => c.name === className);
                if (!cls) {
                    cls = this.createSyntheticClass(className, document, classes);
                }
                const returnType = methodMatch[2] ? methodMatch[2].trim() : 'void';
                const params = this.parseParameters(methodMatch[5]);
                const suffix = methodMatch[6] ? methodMatch[6].trim() : '';
                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                const endLine = this.findMethodEndLine(lines, i);

                let memberKind = MemberKind.Method;
                const isConst = suffix.includes('const');
                if (isConst && methodName.length > 3 && (methodName.startsWith('get') || methodName.startsWith('is') || methodName.startsWith('has'))) {
                    memberKind = MemberKind.Property;
                }

                cls.members.push({
                    id: uniqueId(),
                    kind: memberKind,
                    name: methodName,
                    returnType,
                    visibility: Visibility.Public,
                    parameters: params,
                    modifiers: this.extractModifiers(methodMatch[1] || '', suffix),
                    isStatic: (methodMatch[1] || '').includes('static'),
                    isVirtual: (methodMatch[1] || '').includes('virtual'),
                    isAbstract: false,
                    isOverride: suffix.includes('override'),
                    range,
                    implementationRange: new vscode.Range(i, 0, endLine, lines[endLine]?.length ?? 0),
                });
                i = endLine;
                continue;
            }

            const initMatch = trimmed.match(CppLanguageProvider.RE_IMPL_INIT);
            if (initMatch) {
                const fieldType = initMatch[1];
                const className = initMatch[2];
                const fieldName = initMatch[3];
                let cls = classes.find(c => c.name === className);
                if (!cls) {
                    cls = this.createSyntheticClass(className, document, classes);
                }
                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                cls.members.push({
                    id: uniqueId(),
                    kind: MemberKind.Field,
                    name: fieldName,
                    type: fieldType,
                    visibility: Visibility.Private,
                    parameters: [],
                    modifiers: [],
                    isStatic: true, isVirtual: false, isAbstract: false, isOverride: false,
                    range,
                });
                continue;
            }
        }
    }

    private createSyntheticClass(name: string, document: vscode.TextDocument, classes: ClassInfo[]): ClassInfo {
        const lineCount = document.lineCount;
        const cls: ClassInfo = {
            id: uniqueId(),
            name,
            fullName: name,
            classType: 'class',
            parentClass: undefined,
            interfaces: [],
            members: [],
            range: new vscode.Range(0, 0, lineCount > 0 ? lineCount - 1 : 0, 0),
            isInterface: false,
            isRecord: false,
            isSealed: false,
            isSynthetic: true,
            fileUri: document.uri,
        };
        classes.push(cls);
        return cls;
    }

    private findMethodEndLine(lines: string[], startLine: number): number {
        let braceDepth = 0;
        let foundOpen = false;
        for (let i = startLine; i < lines.length; i++) {
            for (const ch of lines[i]) {
                if (ch === '{') { braceDepth++; foundOpen = true; }
                if (ch === '}') { braceDepth--; }
            }
            if (foundOpen && braceDepth <= 0) {
                return i;
            }
        }
        return startLine;
    }

    private parseClasses(lines: string[], uri: vscode.Uri, classes: ClassInfo[], defaultNamespace: string): void {
        let templateParams: string | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const tplMatch = line.match(CppLanguageProvider.RE_TEMPLATE);
            if (tplMatch) {
                templateParams = tplMatch[1].trim();
                continue;
            }

            const classMatch = line.match(CppLanguageProvider.RE_CLASS_DECL);
            if (!classMatch) {
                templateParams = null;
                continue;
            }

            const kind = classMatch[1];
            const className = classMatch[2];
            const inheritance = classMatch[4];
            const isStruct = kind === 'struct';

            let parentClass: string | undefined;
            const interfaces: string[] = [];

            if (inheritance) {
                const parts = inheritance.split(',').map(s => s.trim()).filter(Boolean);
                for (const part of parts) {
                    const m = part.match(/^\s*(public|protected|private)\s+(\w+)/);
                    if (m) {
                        if (m[1] === 'public' && !parentClass) {
                            parentClass = m[2];
                        } else {
                            interfaces.push(m[2]);
                        }
                    }
                }
            }

            let classBodyStart = i;
            for (let scan = i; scan < lines.length; scan++) {
                if (lines[scan].includes('{')) {
                    classBodyStart = scan;
                    break;
                }
            }

            const startLine = classBodyStart;
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

            const fullName = defaultNamespace ? `${defaultNamespace}::${className}` : className;

            const classInfo: ClassInfo = {
                id: uniqueId(),
                name: className,
                fullName,
                classType: isStruct ? 'struct' : 'class',
                parentClass,
                interfaces,
                members,
                range: classRange,
                isInterface: false,
                isRecord: isStruct,
                isSealed: false,
                fileUri: uri,
            };

            classes.push(classInfo);
            i = endLine;
            templateParams = null;
        }
    }

    private parseClassBody(lines: string[], startLine: number, endLine: number, className: string): ClassMember[] {
        const members: ClassMember[] = [];
        let currentVisibility = Visibility.Private;

        for (let i = startLine; i < endLine; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
                continue;
            }

            const visMatch = trimmed.match(CppLanguageProvider.RE_ACCESS_SPECIFIER);
            if (visMatch) {
                switch (visMatch[1]) {
                    case 'public': currentVisibility = Visibility.Public; break;
                    case 'protected': currentVisibility = Visibility.Protected; break;
                    case 'private': currentVisibility = Visibility.Private; break;
                }
                continue;
            }

            const destructorMatch = trimmed.match(CppLanguageProvider.RE_DESTRUCTOR);
            if (destructorMatch && destructorMatch[1] === className) {
                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Destructor,
                    name: `~${destructorMatch[1]}`,
                    visibility: currentVisibility,
                    parameters: [],
                    modifiers: trimmed.includes('virtual') ? ['virtual'] : [],
                    isStatic: false,
                    isVirtual: trimmed.includes('virtual'),
                    isAbstract: false,
                    isOverride: false,
                    range,
                });
                continue;
            }

            const ctorMatch = trimmed.match(CppLanguageProvider.RE_CONSTRUCTOR);
            if (ctorMatch && ctorMatch[1] === className) {
                const params = this.parseParameters(ctorMatch[2]);
                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Constructor,
                    name: ctorMatch[1],
                    visibility: currentVisibility,
                    parameters: params,
                    modifiers: trimmed.includes('explicit') ? ['explicit'] : [],
                    isStatic: false,
                    isVirtual: false,
                    isAbstract: false,
                    isOverride: false,
                    range,
                });
                continue;
            }

            const methodMatch = trimmed.match(CppLanguageProvider.RE_METHOD);
            if (methodMatch && methodMatch[3] !== className) {
                const prefix = methodMatch[1].trim();
                const returnType = methodMatch[2].trim();
                const methodName = methodMatch[3];
                const paramsStr = methodMatch[4];
                const suffix = methodMatch[5].trim();

                if (returnType.includes('operator')) {
                    continue;
                }

                const params = this.parseParameters(paramsStr);
                const modifiers = this.extractModifiers(prefix, suffix);
                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);

                let memberKind = MemberKind.Method;
                if (suffix.includes('= 0') || suffix.includes('=0')) {
                    members.push({
                        id: uniqueId(),
                        kind: memberKind,
                        name: methodName,
                        returnType,
                        visibility: currentVisibility,
                        parameters: params,
                        modifiers,
                        isStatic: prefix.includes('static'),
                        isVirtual: prefix.includes('virtual') || suffix.includes('= 0') || suffix.includes('=0'),
                        isAbstract: suffix.includes('= 0') || suffix.includes('=0'),
                        isOverride: suffix.includes('override'),
                        range,
                    });
                    continue;
                }

                const isConst = suffix.includes('const') && !suffix.includes('constexpr');
                if (isConst && methodName.length > 3 && (methodName.startsWith('get') || methodName.startsWith('is') || methodName.startsWith('has'))) {
                    memberKind = MemberKind.Property;
                }

                members.push({
                    id: uniqueId(),
                    kind: memberKind,
                    name: methodName,
                    returnType,
                    visibility: currentVisibility,
                    parameters: params,
                    modifiers,
                    isStatic: prefix.includes('static'),
                    isVirtual: prefix.includes('virtual'),
                    isAbstract: suffix.includes('= 0') || suffix.includes('=0'),
                    isOverride: suffix.includes('override'),
                    range,
                });
                continue;
            }

            const fieldMatch = trimmed.match(CppLanguageProvider.RE_FIELD);
            if (fieldMatch) {
                const prefix = fieldMatch[1].trim();
                const fieldType = fieldMatch[2].trim();
                const fieldName = fieldMatch[3].trim();

                if (fieldType === 'void' || fieldName === 'class' || fieldName === 'struct' || fieldName === 'namespace') {
                    continue;
                }

                if (/^[{}();]$/.test(fieldName)) {
                    continue;
                }

                const range = new vscode.Range(i, line.indexOf(trimmed), i, line.length);
                members.push({
                    id: uniqueId(),
                    kind: MemberKind.Field,
                    name: fieldName,
                    type: fieldType,
                    visibility: currentVisibility,
                    parameters: [],
                    modifiers: prefix ? prefix.split(/\s+/).filter(Boolean) : [],
                    isStatic: prefix.includes('static'),
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
        const isConst = trimmed.startsWith('const ');
        const isRef = trimmed.includes('&');
        const isPtr = trimmed.includes('*');

        let defaultValue: string | undefined;
        let working = trimmed;
        const eqIdx = working.lastIndexOf('=');
        if (eqIdx >= 0) {
            defaultValue = working.substring(eqIdx + 1).trim();
            working = working.substring(0, eqIdx).trim();
        }

        const tokens = working.split(/\s+/).filter(Boolean);
        let name = '';
        let type = '';

        if (tokens.length >= 2) {
            name = tokens[tokens.length - 1].replace(/[&*]/g, '');
            type = tokens.slice(0, tokens.length - 1).join(' ');
        } else if (tokens.length === 1) {
            name = tokens[0].replace(/[&*]/g, '');
            type = 'auto';
        }

        return { name, type, defaultValue, isConst };
    }

    private extractModifiers(prefix: string, suffix: string): string[] {
        const mods: string[] = [];
        for (const kw of ['virtual', 'static', 'inline', 'explicit', 'friend', 'constexpr', 'mutable']) {
            if (prefix.includes(kw)) mods.push(kw);
        }
        for (const kw of ['const', 'override', 'final', 'noexcept']) {
            if (suffix.includes(kw)) mods.push(kw);
        }
        if (suffix.includes('= 0') || suffix.includes('=0')) mods.push('pure');
        if (suffix.includes('&') && !suffix.includes('&&')) mods.push('lvalue-ref');
        if (suffix.includes('&&')) mods.push('rvalue-ref');
        return mods;
    }

    generateMethod(className: string, spec: MemberSpec, classInfo: ClassInfo): GeneratedCode {
        const indent = this.indent();
        const brace = this.brace();
        const params = spec.parameters.map(p => {
            let s = '';
            if (p.isConst) s += 'const ';
            s += p.type;
            if (p.direction === 'out') s += '*';
            else if (p.direction === 'inout') s += '&';
            s += ` ${p.name}`;
            if (p.defaultValue) s += ` = ${p.defaultValue}`;
            return s;
        }).join(', ');

        const prefixMods: string[] = [];
        const suffixMods: string[] = [];
        if (spec.isStatic) prefixMods.push('static');
        if (spec.isVirtual) prefixMods.push('virtual');
        for (const m of spec.modifiers) {
            if (['inline', 'explicit', 'friend', 'constexpr'].includes(m.name)) prefixMods.push(m.name);
            if (['const', 'override', 'final', 'noexcept'].includes(m.name)) suffixMods.push(m.name);
            if (m.name === 'pure') suffixMods.push('= 0');
        }

        const prefixStr = prefixMods.length ? prefixMods.join(' ') + ' ' : '';
        const returnType = spec.returnType ?? 'void';
        const suffixStr = suffixMods.length ? ' ' + suffixMods.join(' ') : '';

        const isCtor = spec.kind === MemberKind.Constructor;
        const isDtor = spec.kind === MemberKind.Destructor;

        let declaration: string;
        let implementation: string;

        if (isCtor) {
            const explicitPrefix = spec.modifiers.some(m => m.name === 'explicit') ? 'explicit ' : '';
            declaration = `${indent}${explicitPrefix}${className}(${params});`;
            implementation = `${className}::${className}(${params})${brace}\n${indent}${indent}// TODO: implement\n${indent}}\n`;
        } else if (isDtor) {
            const virtualPrefix = spec.isVirtual ? 'virtual ' : '';
            declaration = `${indent}${virtualPrefix}~${className}();`;
            implementation = `${className}::~${className}()${brace}\n${indent}${indent}// TODO: implement\n${indent}}\n`;
        } else {
            declaration = `${indent}${prefixStr}${returnType} ${spec.name}(${params})${suffixStr};`;
            const implSuffix = suffixMods.filter(m => m !== '= 0').join(' ');
            const implSuffixStr = implSuffix ? ' ' + implSuffix : '';
            implementation = `${prefixStr.replace(/virtual\s*/g, '').replace(/static\s*/g, '')}${returnType} ${className}::${spec.name}(${params})${implSuffixStr}${brace}\n${indent}${indent}// TODO: implement\n${indent}}\n`;
        }

        const headerInsert = this.getInsertPositionForHeader(classInfo, spec.visibility, 'method');
        const declWithLabel = headerInsert.needsLabel
            ? this.visibilityLabel(spec.visibility) + '\n' + declaration + '\n'
            : declaration + '\n';

        return {
            declaration: declWithLabel,
            implementation: '',
            declarationPosition: headerInsert.pos,
            implementationPosition: new vscode.Position(0, 0),
            pairedFileImplementation: implementation,
        };
    }

    generateField(className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode {
        const indent = this.indent();

        let decl = `${indent}${spec.type} ${spec.name}`;
        if (spec.defaultValue) {
            decl += ` = ${spec.defaultValue}`;
        }
        decl += ';\n';

        const headerInsert = this.getInsertPositionForHeader(classInfo, spec.visibility, 'field');
        const declWithLabel = headerInsert.needsLabel
            ? this.visibilityLabel(spec.visibility) + '\n' + decl
            : decl;

        return {
            declaration: declWithLabel,
            implementation: '',
            declarationPosition: headerInsert.pos,
            implementationPosition: new vscode.Position(0, 0),
        };
    }

    generateProperty(className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode {
        const indent = this.indent();
        const brace = this.brace();

        let declaration = `${indent}${spec.type} ${spec.name}() const;\n`;
        if (spec.hasSetter) {
            declaration += `${indent}void set${spec.name[0].toUpperCase() + spec.name.substring(1)}(${spec.type} value);\n`;
        }

        let implementation = `${spec.type} ${className}::${spec.name}() const${brace}\n${indent}${indent}return m_${spec.name[0].toLowerCase() + spec.name.substring(1)};\n${indent}}\n`;
        if (spec.hasSetter) {
            const setterName = `set${spec.name[0].toUpperCase() + spec.name.substring(1)}`;
            implementation += `\nvoid ${className}::${setterName}(${spec.type} value)${brace}\n${indent}${indent}m_${spec.name[0].toLowerCase() + spec.name.substring(1)} = value;\n${indent}}\n`;
        }

        const headerInsert = this.getInsertPositionForHeader(classInfo, spec.visibility, 'property');
        const declWithLabel = headerInsert.needsLabel
            ? this.visibilityLabel(spec.visibility) + '\n' + declaration
            : declaration;

        return {
            declaration: declWithLabel,
            implementation: '',
            declarationPosition: headerInsert.pos,
            implementationPosition: new vscode.Position(0, 0),
            pairedFileImplementation: implementation,
        };
    }

    private getInsertPositionForHeader(classInfo: ClassInfo, targetVisibility: Visibility, kind: 'method' | 'field' | 'property'): { pos: vscode.Position; needsLabel: boolean } {
        let lastLineOfVisibility = -1;
        let foundVisibility = false;

        for (const member of classInfo.members) {
            if (member.visibility === targetVisibility) {
                foundVisibility = true;
                lastLineOfVisibility = Math.max(lastLineOfVisibility, member.range.end.line);
            }
        }

        if (foundVisibility && lastLineOfVisibility >= 0) {
            return { pos: new vscode.Position(lastLineOfVisibility + 1, 0), needsLabel: false };
        }

        if (kind === 'field') {
            return { pos: new vscode.Position(classInfo.range.start.line + 1, 0), needsLabel: true };
        }

        return { pos: new vscode.Position(classInfo.range.end.line, 0), needsLabel: true };
    }

    private visibilityLabel(visibility: Visibility): string {
        switch (visibility) {
            case Visibility.Private: return 'private:';
            case Visibility.Protected: return 'protected:';
            case Visibility.Public: return 'public:';
            default: return 'public:';
        }
    }

    getInsertPosition(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        memberKind: 'method' | 'field' | 'property'
    ): InsertPosition {
        const isHeader = this.isHeader(document.uri.fsPath);
        const headerInsert = this.getInsertPositionForHeader(classInfo, this.getDefaultVisibility(), memberKind);
        const pairedFileUri = this.findPairedFile(document.uri);
        let sourceInsert = new vscode.Position(0, 0);

        if (!isHeader && pairedFileUri) {
            try {
                const srcDoc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === pairedFileUri.fsPath);
                if (srcDoc) {
                    sourceInsert = this.findSourceInsertPosition(srcDoc, classInfo);
                }
            } catch { /* ignore */ }
        }

        if (isHeader) {
            return {
                declaration: headerInsert.pos,
                implementation: sourceInsert,
                pairedFileUri,
                pairedFileImplementation: sourceInsert,
            };
        } else {
            return {
                declaration: headerInsert.pos,
                implementation: this.findSourceInsertPosition(document, classInfo),
                pairedFileUri,
            };
        }
    }

    private findSourceInsertPosition(document: vscode.TextDocument, classInfo: ClassInfo): vscode.Position {
        const text = document.getText();
        const lines = text.split(/\r?\n/);
        let namespaceDepth = 0;
        let lastMethodImpl = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/^\s*namespace\s+\w+\s*\{/)) {
                namespaceDepth++;
                continue;
            }

            const implMatch = line.match(/^\s*\w+\s*::\s*\w+/);
            if (implMatch) {
                let braceCount = 0;
                for (let j = i; j < lines.length; j++) {
                    for (const ch of lines[j]) {
                        if (ch === '{') braceCount++;
                        if (ch === '}') braceCount--;
                    }
                    if (braceCount <= 0 && lines[j].includes('}')) {
                        lastMethodImpl = j;
                        break;
                    }
                }
            }
        }

        if (namespaceDepth > 0) {
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].match(/^\s*\}/)) {
                    return new vscode.Position(i, 0);
                }
            }
        }

        if (lastMethodImpl > 0) {
            return new vscode.Position(lastMethodImpl + 1, 0);
        }

        return new vscode.Position(lines.length, 0);
    }

    synchronizeDeclarationImplementation(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        member: ClassMember
    ): vscode.TextEdit[] {
        const edits: vscode.TextEdit[] = [];
        const isHeader = this.isHeader(document.uri.fsPath);
        const indent = this.indent();
        const brace = this.brace();

        if (isHeader) {
            const pairedUri = this.findPairedFile(document.uri.fsPath
                ? document.uri
                : document.uri);
            if (!pairedUri) return edits;

            const pairedDoc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === pairedUri.fsPath);
            if (!pairedDoc) return edits;

            const existing = pairedDoc.getText();
            const qualifiedName = `${classInfo.name}::${member.name}`;

            if (!existing.includes(qualifiedName)) {
                const params = member.parameters.map(p => {
                    let s = '';
                    if (p.isConst) s += 'const ';
                    s += p.type + ' ' + p.name;
                    if (p.defaultValue) s += ` = ${p.defaultValue}`;
                    return s;
                }).join(', ');

                const returnType = member.returnType ?? 'void';
                const constSuffix = member.modifiers.includes('const') ? ' const' : '';
                const impl = `\n${returnType} ${classInfo.name}::${member.name}(${params})${constSuffix}${brace}\n${indent}// TODO: implement\n}\n`;

                const pos = this.findSourceInsertPosition(pairedDoc, classInfo);
                edits.push(new vscode.TextEdit(new vscode.Range(pos, pos), impl));
            }
        } else {
            const hasImpl = this.memberHasImplementation(document, member);
            if (!hasImpl) {
                const returnType = member.returnType ?? 'void';
                const params = member.parameters.map(p => {
                    let s = '';
                    if (p.isConst) s += 'const ';
                    s += p.type + ' ' + p.name;
                    if (p.defaultValue) s += ` = ${p.defaultValue}`;
                    return s;
                }).join(', ');
                const constSuffix = member.modifiers.includes('const') ? ' const' : '';
                const impl = `\n${returnType} ${classInfo.name}::${member.name}(${params})${constSuffix}${brace}\n${indent}// TODO: implement\n}\n`;

                const pos = this.findSourceInsertPosition(document, classInfo);
                edits.push(new vscode.TextEdit(new vscode.Range(pos, pos), impl));
            }
        }

        return edits;
    }

    private memberHasImplementation(document: vscode.TextDocument, member: ClassMember): boolean {
        const text = document.getText();
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
            if (line.includes('::') && line.includes(member.name) && line.includes('(')) {
                return true;
            }
        }
        return false;
    }

    sortMembers(members: ClassMember[], scheme: import('../models/types').SortScheme): ClassMember[] {
        return super.sortMembers(members, scheme);
    }
}
