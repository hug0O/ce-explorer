import * as vscode from 'vscode';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { ClassInfo, ClassMember, MemberKind, Visibility, ParsedDocument } from '../models/types';

export class CodeExplorerTreeItem extends vscode.TreeItem {
    constructor(
        public readonly itemData: ClassInfo | ClassMember,
        public readonly parentClass?: ClassInfo,
        public readonly provider?: ILanguageProvider
    ) {
        const isClassData = 'members' in itemData;
        super(
            itemData.name,
            isClassData
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );

        if (this.isClass()) {
            const cls = itemData as ClassInfo;
            this.iconPath = this.getClassIcon(cls);
            this.contextValue = cls.isInterface ? 'interface' : (cls.isRecord ? 'record' : 'class');
            this.description = cls.classType
                ? `${cls.classType}${cls.parentClass ? ' → ' + cls.parentClass : ''}`
                : (cls.parentClass ? `(${cls.parentClass})` : undefined);
            this.tooltip = this.buildClassTooltip(cls);
            this.command = {
                command: 'mmx.navigateToMember',
                title: 'Navigate',
                arguments: [cls.range.start],
            };
            this.resourceUri = cls.fileUri;
        } else {
            const member = itemData as ClassMember;
            this.iconPath = this.getMemberIcon(member);
            this.contextValue = member.kind;
            this.description = this.buildMemberDescription(member);
            this.tooltip = this.buildMemberTooltip(member);
            const navPos = member.implementationRange?.start ?? member.range.start;
            this.command = {
                command: 'mmx.navigateToMember',
                title: 'Navigate',
                arguments: [navPos],
            };
        }
    }

    private isClass(): boolean {
        return 'members' in this.itemData;
    }

    private getClassIcon(cls: ClassInfo): vscode.ThemeIcon {
        const type = cls.classType;
        if (type === 'struct' || type === 'record') {
            return new vscode.ThemeIcon('symbol-struct', new vscode.ThemeColor('symbolIcon.structForeground'));
        }
        if (type === 'enum') {
            return new vscode.ThemeIcon('symbol-enum', new vscode.ThemeColor('symbolIcon.enumForeground'));
        }
        if (type === 'impl' || type === 'impl for') {
            return new vscode.ThemeIcon('rocket', new vscode.ThemeColor('symbolIcon.functionForeground'));
        }
        if (type === 'trait' || cls.isInterface) {
            return new vscode.ThemeIcon('symbol-interface', new vscode.ThemeColor('symbolIcon.interfaceForeground'));
        }
        if (type === 'abstract class') {
            return new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('symbolIcon.abstractForeground'));
        }
        return new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('symbolIcon.classForeground'));
    }

    private getMemberIcon(member: ClassMember): vscode.ThemeIcon {
        switch (member.kind) {
            case MemberKind.Constructor:
                return new vscode.ThemeIcon('zap');
            case MemberKind.Destructor:
                return new vscode.ThemeIcon('trash');
            case MemberKind.Field:
                return new vscode.ThemeIcon('symbol-field');
            case MemberKind.Property:
                return new vscode.ThemeIcon('symbol-property');
            case MemberKind.Method:
            default:
                if (member.isStatic) {
                    return new vscode.ThemeIcon('symbol-method');
                }
                if (member.isAbstract) {
                    return new vscode.ThemeIcon('symbol-method');
                }
                return new vscode.ThemeIcon('symbol-method');
        }
    }

    private buildMemberDescription(member: ClassMember): string {
        const parts: string[] = [];
        if (member.returnType) {
            parts.push(`: ${member.returnType}`);
        } else if (member.type) {
            parts.push(`: ${member.type}`);
        }
        if (member.parameters.length > 0) {
            parts.push(`(${member.parameters.length})`);
        }
        if (member.implementationRange) {
            parts.push('impl');
        }
        return parts.join(' ');
    }

    private buildMemberTooltip(member: ClassMember): string {
        const lines: string[] = [`${member.visibility} ${member.kind}: ${member.name}`];
        if (member.returnType) {
            lines.push(`Return: ${member.returnType}`);
        }
        if (member.type) {
            lines.push(`Type: ${member.type}`);
        }
        if (member.parameters.length > 0) {
            lines.push('Parameters:');
            for (const p of member.parameters) {
                const dir = p.isVar ? 'var ' : p.isOut ? 'out ' : p.isConst ? 'const ' : '';
                lines.push(`  ${dir}${p.name}: ${p.type}`);
            }
        }
        if (member.modifiers.length > 0) {
            lines.push(`Modifiers: ${member.modifiers.join(', ')}`);
        }
        return lines.join('\n');
    }

    private buildClassTooltip(cls: ClassInfo): string {
        const lines: string[] = [];
        lines.push(`${cls.isInterface ? 'interface' : cls.isRecord ? 'record' : 'class'} ${cls.name}`);
        if (cls.parentClass) {
            lines.push(`  inherits: ${cls.parentClass}`);
        }
        if (cls.interfaces.length > 0) {
            lines.push(`  implements: ${cls.interfaces.join(', ')}`);
        }
        lines.push(`  ${cls.members.length} members`);
        return lines.join('\n');
    }
}

/**
 * Parses the active document once per version and answers "what is in this file":
 * classes, members, standalone routines. The sidebar's Add / Delete tab, the member
 * view and the "Go to Member" command all read it; the filtering and the grouping
 * of the members are the Add / Delete tab's business (the Classes tree is gone).
 */
export class CodeExplorerService {
    private providers: Map<string, ILanguageProvider> = new Map();
    private providersByExtension: Map<string, ILanguageProvider> = new Map();
    private currentDocument: vscode.TextDocument | undefined;
    private parsedCache: Map<string, ParsedDocument> = new Map();
    private parsedVersion: Map<string, number> = new Map();

    /**
     * Flat list of every navigable symbol in the active document (classes,
     * their members, and standalone procedures) for the "Go to Member" palette.
     */
    listAllSymbols(): { label: string; description: string; position: vscode.Position; kind: string }[] {
        const doc = this.currentDocument ?? vscode.window.activeTextEditor?.document;
        if (!doc) {
            return [];
        }
        const parsed = this.getParsedDocument(doc);
        if (!parsed) {
            return [];
        }
        const out: { label: string; description: string; position: vscode.Position; kind: string }[] = [];
        for (const cls of parsed.classes) {
            out.push({ label: cls.name, description: cls.classType ?? 'class', position: cls.range.start, kind: 'class' });
            for (const m of cls.members) {
                const pos = m.implementationRange?.start ?? m.range.start;
                out.push({ label: m.name, description: `${cls.name} • ${m.kind}`, position: pos, kind: m.kind });
            }
        }
        for (const proc of parsed.standaloneProcedures) {
            const pos = proc.implementationRange?.start ?? proc.range.start;
            out.push({ label: proc.name, description: 'function', position: pos, kind: 'function' });
        }
        return out;
    }

    constructor() {
        vscode.window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
        vscode.workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e));
    }

    registerProvider(provider: ILanguageProvider): void {
        this.providers.set(provider.languageId, provider);
        for (const ext of provider.fileExtensions) {
            this.providersByExtension.set(ext, provider);
        }
    }

    private providerForDocument(doc: vscode.TextDocument): ILanguageProvider | undefined {
        const byLang = this.providers.get(doc.languageId);
        if (byLang) {
            return byLang;
        }
        const ext = doc.uri.fsPath.substring(doc.uri.fsPath.lastIndexOf('.'));
        return this.providersByExtension.get(ext);
    }

    private onActiveEditorChanged(): void {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.isSupportedDocument(editor.document)) {
            this.currentDocument = editor.document;
            this.parsedCache.delete(editor.document.uri.toString());
            this.parsedVersion.delete(editor.document.uri.toString());
        }
    }

    private onDocumentChanged(e: vscode.TextDocumentChangeEvent): void {
        if (e.document === this.currentDocument) {
            this.parsedCache.delete(e.document.uri.toString());
            this.parsedVersion.delete(e.document.uri.toString());
        }
    }

    private isSupportedDocument(doc: vscode.TextDocument): boolean {
        if (this.providers.has(doc.languageId)) {
            return true;
        }
        const ext = doc.uri.fsPath.substring(doc.uri.fsPath.lastIndexOf('.'));
        return this.providersByExtension.has(ext);
    }

    /** Forgets every parse: the next read parses the document again. */
    refresh(): void {
        this.parsedCache.clear();
        this.parsedVersion.clear();
    }

    getParsedDocument(doc: vscode.TextDocument): ParsedDocument | undefined {
        const provider = this.providerForDocument(doc);
        if (!provider) {
            return undefined;
        }
        const key = doc.uri.toString();
        const cachedVersion = this.parsedVersion.get(key);
        if (cachedVersion === doc.version) {
            const cached = this.parsedCache.get(key);
            if (cached) {
                return cached;
            }
        }
        const parsed = provider.parseDocument(doc);
        this.parsedCache.set(key, parsed);
        this.parsedVersion.set(key, doc.version);
        return parsed;
    }
}
