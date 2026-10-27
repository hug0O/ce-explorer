import * as vscode from 'vscode';
import { ClassInfo, FieldSpec, GeneratedCode, MemberSpec } from '../models/types';
import { ScriptLanguageProvider } from './ScriptLanguageProvider';
import { parseMarkdown } from '../utils/scriptParse';

/** Markdown (.md): the titles are the members, so the Structure tab and the member keys walk the document by heading. */
export class MarkdownLanguageProvider extends ScriptLanguageProvider {
    readonly languageId = 'markdown';
    readonly fileExtensions = ['.md', '.markdown'];
    readonly displayName = 'Markdown';
    protected readonly parser = parseMarkdown;
    protected readonly fileType = 'document';
    protected readonly commentPrefix = '<!--';

    /** A new title goes at the end of the document, at the level asked in the parameters' `type` or `##`. */
    protected routineText(spec: MemberSpec, body: string): string {
        const level = Math.min(6, Math.max(1, Number(spec.returnType?.replace(/\D/g, '')) || 2));
        return `${'#'.repeat(level)} ${spec.name}\n\n${body.startsWith('<!--') ? '' : body}\n`;
    }

    protected variableText(name: string): string { return `## ${name}`; }

    generateField(_className: string, spec: FieldSpec, classInfo: ClassInfo): GeneratedCode {
        return this.generateMethod('', { kind: spec.kind, name: spec.name, visibility: spec.visibility, parameters: [], modifiers: [], isStatic: false, isVirtual: false, isAbstract: false, isOverride: false, isFinal: false }, classInfo);
    }

    getTypeSuggestions(): string[] { return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']; }

    protected fieldPosition(classInfo: ClassInfo): vscode.Position { return new vscode.Position(classInfo.range.end.line + 1, 0); }
}
