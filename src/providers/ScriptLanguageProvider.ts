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
import { ScriptItem } from '../utils/scriptParse';

let nextIdCounter = 0;
function nextId(prefix: string): string { return prefix + '_' + (nextIdCounter++); }

const baseName = (fsPath: string): string => {
    const file = fsPath.split(/[\\/]/).pop() ?? fsPath;
    return file;
};

/**
 * Base of the providers of scripts and notes (batch, PowerShell, shell, Markdown): the file is one pseudo type, named after the file,
 * whose members are what the parser finds (functions and labels as methods, variables as fields, titles as headings). A PowerShell
 * class is a type of its own. Nothing to synchronise, nothing to extract: these files have no declaration / implementation pair.
 */
export abstract class ScriptLanguageProvider extends BaseLanguageProvider {
    protected abstract readonly parser: (text: string) => ScriptItem[];
    /** `classType` of the pseudo type of the file. */
    protected abstract readonly fileType: string;
    protected readonly commentPrefix: string = '#';

    parseDocument(document: vscode.TextDocument): ParsedDocument {
        const text = document.getText();
        const lines = text.split(/\r?\n/);
        const items = this.parser(text).sort((a, b) => a.startLine - b.startLine);
        const classes: ClassInfo[] = [];
        const lineLen = (l: number): number => (lines[l] ?? '').length;
        const range = (a: number, b: number): vscode.Range => new vscode.Range(a, 0, b, lineLen(b));

        const own = items.filter(i => i.kind !== 'class');
        if (own.length > 0) {
            classes.push({
                id: nextId('script'), name: baseName(document.uri.fsPath), classType: this.fileType, interfaces: [],
                members: own.map(i => this.toMember(i, lineLen)),
                range: range(0, Math.max(0, lines.length - 1)), declarationRange: range(0, Math.max(0, lines.length - 1)),
                isInterface: false, isRecord: false, isSealed: false, isSynthetic: true, fileUri: document.uri,
            });
        }
        for (const c of items.filter(i => i.kind === 'class')) {
            classes.push({
                id: nextId('psclass'), name: c.name, classType: 'class', parentClass: c.detail, interfaces: [],
                members: (c.children ?? []).map(i => this.toMember(i, lineLen)),
                range: range(c.startLine, c.endLine), declarationRange: range(c.startLine, c.endLine),
                isInterface: false, isRecord: false, isSealed: false, fileUri: document.uri,
            });
        }
        return { uri: document.uri, languageId: this.languageId, classes, standaloneProcedures: [], imports: [] };
    }

    protected toMember(item: ScriptItem, lineLen: (l: number) => number): ClassMember {
        const r = new vscode.Range(item.startLine, 0, item.endLine, lineLen(item.endLine));
        const kind = item.kind === 'heading' ? MemberKind.Heading
            : item.kind === 'variable' ? MemberKind.Field
            : item.kind === 'property' ? MemberKind.Property
            : MemberKind.Method;
        const parameters: Parameter[] = item.params.map(p => ({ name: p, type: '' }));
        return {
            id: nextId('smem'), kind, name: item.name,
            type: item.kind === 'heading' ? 'H' + item.level : item.kind === 'label' ? 'label' : item.detail,
            visibility: Visibility.Public, parameters, modifiers: item.kind === 'heading' ? ['h' + item.level] : [],
            isStatic: false, isVirtual: false, isAbstract: false, isOverride: false, range: r, implementationRange: undefined,
        };
    }

    // --- generation -----------------------------------------------------------------------------------------------------

    /** Text of a new routine; the languages override it. */
    protected abstract routineText(spec: MemberSpec, body: string): string;
    protected abstract variableText(name: string, value: string): string;

    generateMethod(_className: string, spec: MemberSpec, classInfo: ClassInfo, existingBody?: string): GeneratedCode {
        const body = existingBody !== undefined ? existingBody : `${this.commentPrefix} TODO: implement`;
        const pos = new vscode.Position(classInfo.range.end.line + 1, 0);
        return { declaration: '\n' + this.routineText(spec, body), implementation: '', declarationPosition: pos, implementationPosition: pos };
    }

    generateField(_className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode {
        const pos = this.fieldPosition(classInfo);
        return { declaration: this.variableText(spec.name, spec.defaultValue ?? '') + '\n', implementation: '', declarationPosition: pos, implementationPosition: pos };
    }

    generateProperty(className: string, spec: PropertySpec, classInfo: ClassInfo): GeneratedCode {
        return this.generateField(className, { kind: MemberKind.Field, name: spec.name, type: spec.type, visibility: spec.visibility }, classInfo);
    }

    protected fieldPosition(classInfo: ClassInfo): vscode.Position {
        const fields = classInfo.members.filter(m => m.kind === MemberKind.Field);
        if (fields.length > 0) {
            const last = fields.reduce((a, b) => a.range.end.line > b.range.end.line ? a : b);
            return new vscode.Position(last.range.end.line + 1, 0);
        }
        return new vscode.Position(classInfo.range.start.line + (this.hasShebang ? 1 : 0), 0);
    }

    protected hasShebang = false;

    getInsertPosition(_document: vscode.TextDocument, classInfo: ClassInfo, memberKind: 'method' | 'field' | 'property'): InsertPosition {
        const p = memberKind === 'method' ? new vscode.Position(classInfo.range.end.line + 1, 0) : this.fieldPosition(classInfo);
        return { declaration: p, implementation: p };
    }

    getDefaultVisibility(): Visibility { return Visibility.Public; }
    getVisibilityModifiers(): Visibility[] { return []; }
    getVisibilityOptions(): Visibility[] { return []; }
    getAvailableModifiers(): string[] { return []; }
    supportsMissingStubs(): boolean { return false; }
    generateMissingStubs(): string | undefined { return undefined; }

    getTypeDefaults(): { defaultReturnType: string; defaultFieldType: string; defaultPropertyType: string; defaultParamType: string } {
        return { defaultReturnType: '', defaultFieldType: '', defaultPropertyType: '', defaultParamType: '' };
    }

    getTypeSuggestions(): string[] { return []; }

    formatLocalVariable(name: string, type: string): string { return this.variableText(name, type); }
}
