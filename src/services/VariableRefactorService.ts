import * as vscode from 'vscode';
import { VariableRef, Occurrence } from '../models/types';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { CodeGeneratorService } from './CodeGeneratorService';
import { CodeExplorerService } from './CodeExplorerService';
import { findOccurrences } from './OccurrenceFinder';
import { computeTypeEdit } from './LocalRefactorService';

/**
 * Unified variable refactoring: rename / change type / delete any variable
 * (local, parameter, field, property, standalone), propagating to every
 * occurrence. The occurrence set is resolved by OccurrenceFinder (LSP-first,
 * regex fallback), so the same call works across all 8 supported languages.
 */
export class VariableRefactorService {
    constructor(
        private readonly codeGenerator: CodeGeneratorService,
        private readonly codeExplorer: CodeExplorerService,
    ) {}

    /**
     * Rename a variable where it is: in this file (and the header / source it is paired with). The language server
     * answers for the whole project, .dfm and other languages included: only the occurrences in files of the same language
     * are ever touched, and the ones in other files only when asked. Returns false if nothing matched or the name was unchanged.
     */
    async rename(ref: VariableRef, provider: ILanguageProvider | undefined, newName: string, cursorPosition?: vscode.Position): Promise<boolean> {
        if (!newName || newName === ref.name) {
            return false;
        }
        const occurrences = await findOccurrences(ref, provider, cursorPosition);
        if (occurrences.length === 0) {
            vscode.window.showWarningMessage(`CE: Could not locate "${ref.name}".`);
            return false;
        }
        const chosen = await this.chooseScope(ref, provider, occurrences);
        if (!chosen) { return false; }
        const wsEdit = new vscode.WorkspaceEdit();
        for (const occ of chosen) {
            wsEdit.replace(occ.uri, occ.range, newName);
        }
        const ok = await vscode.workspace.applyEdit(wsEdit);
        if (ok) {
            this.codeExplorer.refresh();
            vscode.window.showInformationMessage(`CE: Renamed "${ref.name}" → "${newName}" (${chosen.length} occurrence${chosen.length > 1 ? 's' : ''}).`);
        }
        return ok;
    }

    /** The occurrences to rename: this file and its pair; those of other files of the same language only if the user says so. */
    private async chooseScope(ref: VariableRef, provider: ILanguageProvider | undefined, all: Occurrence[]): Promise<Occurrence[] | undefined> {
        const here = ref.document.uri.toString();
        const paired = provider?.findPairedFile(ref.document.uri)?.toString();
        const exts = (provider?.fileExtensions ?? []).map(e => e.toLowerCase());
        const sameLanguage = (o: Occurrence): boolean => exts.length === 0 || exts.some(e => o.uri.fsPath.toLowerCase().endsWith(e));
        const inFile = all.filter(o => o.uri.toString() === here || o.uri.toString() === paired);
        const others = all.filter(o => o.uri.toString() !== here && o.uri.toString() !== paired && sameLanguage(o));
        if (others.length === 0) { return inFile.length ? inFile : undefined; }
        const files = new Set(others.map(o => shortFile(o.uri.fsPath)));
        const pick = await vscode.window.showQuickPick(
            [
                ...(inFile.length ? [{ label: 'Rename here only', description: `${inFile.length} in this file`, more: false }] : []),
                { label: `Also in ${files.size} other file${files.size > 1 ? 's' : ''}`, description: `${others.length} more: ${[...files].slice(0, 3).join(', ')}${files.size > 3 ? '…' : ''}`, more: true },
            ],
            { title: `Rename "${ref.name}"`, placeHolder: 'Other languages and form files are never changed here' },
        );
        if (!pick) { return undefined; }
        return pick.more ? [...inFile, ...others] : inFile;
    }

    /**
     * Change the declared type of a variable. Only the declaration token is
     * edited (types are not "used" elsewhere). Works for locals/params (via
     * computeTypeEdit) and fields/properties (type token on the declaration
     * line). Returns false when the variable is untyped or the type is absent.
     */
    async changeType(ref: VariableRef, newType: string): Promise<boolean> {
        if (!newType) { return false; }

        // Locals / parameters: reuse the existing pure helper.
        if (ref.kind === 'local' || ref.kind === 'param') {
            const local = { name: ref.name, type: ref.type, declarationRange: ref.declarationRange, range: ref.declarationRange, isParam: ref.kind === 'param' } as any;
            const edit = computeTypeEdit(ref.document.getText().split(/\r?\n/), local, newType);
            if (!edit) {
                vscode.window.showWarningMessage('CE: This variable has no declared type to change.');
                return false;
            }
            const wsEdit = new vscode.WorkspaceEdit();
            wsEdit.replace(ref.document.uri, new vscode.Range(edit.line, edit.startChar, edit.line, edit.endChar), edit.newText);
            const ok = await vscode.workspace.applyEdit(wsEdit);
            if (ok) { vscode.window.showInformationMessage(`CE: Changed type of "${ref.name}" → ${newType}.`); }
            return ok;
        }

        // Fields / properties: locate the type token on the declaration line.
        const typeEdit = locateTypeToken(ref, newType);
        if (!typeEdit) {
            vscode.window.showWarningMessage(`CE: Could not locate the type of "${ref.name}" on its declaration line.`);
            return false;
        }
        const wsEdit = new vscode.WorkspaceEdit();
        wsEdit.replace(ref.document.uri, typeEdit.range, newType);
        const ok = await vscode.workspace.applyEdit(wsEdit);
        if (ok) {
            this.codeExplorer.refresh();
            vscode.window.showInformationMessage(`CE: Changed type of "${ref.name}" → ${newType}.`);
        }
        return ok;
    }

    /**
     * Delete a variable. When the variable is referenced outside its
     * declaration, the user is warned and must confirm (the references are
     * left intact on confirm). When unreferenced, the declaration is removed.
     */
    async remove(ref: VariableRef, provider: ILanguageProvider | undefined, cursorPosition?: vscode.Position): Promise<boolean> {
        const occurrences = await findOccurrences(ref, provider, cursorPosition);
        const usages = occurrences.filter(o => !this.isDeclaration(ref, o));

        if (usages.length > 0) {
            const files = new Set(usages.map(u => shortFile(u.uri.fsPath)));
            const detail = usages.length === 1
                ? `"${ref.name}" is still used in ${[...files].join(', ')}. Delete anyway?`
                : `"${ref.name}" is still used in ${usages.length} places (${[...files].join(', ')}). Delete anyway?`;
            const choice = await vscode.window.showWarningMessage(detail, { modal: true }, 'Delete');
            if (choice !== 'Delete') { return false; }
        } else {
            const choice = await vscode.window.showWarningMessage(`Delete "${ref.name}"?`, { modal: true }, 'Delete');
            if (choice !== 'Delete') { return false; }
        }

        // Locals / parameters: remove the declaration line.
        if (ref.kind === 'local' || ref.kind === 'param') {
            return this.deleteLocalDeclaration(ref);
        }

        // Members / standalone: delegate to the existing full-range deleter.
        if (ref.enclosingClass) {
            const member = ref.enclosingClass.members.find(m => m.name === ref.name);
            if (member) {
                const ok = await this.codeGenerator.deleteMember(ref.document, ref.enclosingClass!, member);
                if (ok) { this.codeExplorer.refresh(); }
                return ok;
            }
        }
        return false;
    }

    /** True when an occurrence exactly covers the variable's declaration. */
    private isDeclaration(ref: VariableRef, occ: Occurrence): boolean {
        return occ.uri.toString() === ref.document.uri.toString()
            && occ.range.isEqual(ref.declarationRange);
    }

    private async deleteLocalDeclaration(ref: VariableRef): Promise<boolean> {
        const line = ref.declarationRange.start.line;
        const wsEdit = new vscode.WorkspaceEdit();
        // Delete the declaration line plus its line break.
        const start = new vscode.Position(line, 0);
        const endLine = Math.min(line + 1, ref.document.lineCount - 1);
        const end = new vscode.Position(endLine, 0);
        wsEdit.delete(ref.document.uri, new vscode.Range(start, end));
        const ok = await vscode.workspace.applyEdit(wsEdit);
        if (ok) { vscode.window.showInformationMessage(`CE: Deleted local "${ref.name}".`); }
        return ok;
    }
}

/**
 * Locate the declared type token on a field/property declaration line and
 * return the edit range + replacement. Handles C-style (`int x;`), Pascal
 * (`x: Integer;`), and the common `name: type` / `type name` layouts.
 */
function locateTypeToken(ref: VariableRef, newType: string): { range: vscode.Range; } | undefined {
    if (!ref.type) { return undefined; }
    const declLine = ref.declarationRange.start.line;
    const lines = ref.document.getText().split(/\r?\n/);
    const text = lines[declLine] ?? '';
    const nameStart = ref.declarationRange.start.character;
    const nameEnd = ref.declarationRange.end.character;
    const escaped = ref.type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('\\b' + escaped + '\\b', 'g');
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
        const tokStart = m.index;
        const tokEnd = tokStart + ref.type.length;
        if (tokEnd <= nameStart || tokStart >= nameEnd) {
            return { range: new vscode.Range(declLine, tokStart, declLine, tokEnd) };
        }
        regex.lastIndex = m.index + 1;
    }
    return undefined;
}

function shortFile(path: string): string {
    return path.split(/[/\\]/).pop() || path;
}
