import * as vscode from 'vscode';
import { MethodScope, LocalVariable } from '../models/types';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { LocalScopeAnalyzer } from './LocalScopeAnalyzer';

/**
 * Pure, testable core: locate the type token to replace within a local's
 * declaration. Returns the edit (line + char range + new text) or undefined
 * when the local has no declared type (untyped / inferred).
 */
export function computeTypeEdit(
    lines: string[],
    local: LocalVariable,
    newType: string,
): { line: number; startChar: number; endChar: number; newText: string } | undefined {
    if (!local.type) return undefined;
    const declLine = local.declarationRange.start.line;
    const text = lines[declLine] ?? '';
    const nameStart = local.range.start.character;
    const nameEnd = local.range.end.character;
    const escaped = local.type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // The type may precede (C-style `int x`) or follow (Pascal `x: int`) the name;
    // find the word-boundary match on the declaration line that is not the name.
    const regex = new RegExp('\\b' + escaped + '\\b', 'g');
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
        const tokStart = m.index;
        const tokEnd = tokStart + local.type.length;
        if (tokEnd <= nameStart || tokStart >= nameEnd) {
            return { line: declLine, startChar: tokStart, endChar: tokEnd, newText: newType };
        }
        regex.lastIndex = m.index + 1;
    }
    return undefined;
}

/**
 * Pure, testable core: compute the set of replacement edits for renaming a
 * local variable within its method body scope. Each occurrence (word-boundary
 * match of the name inside bodyRange) produces exactly one edit; positions are
 * deduplicated so a name that is a prefix of the new name (e.g. x -> xx) is not
 * replaced twice.
 */
export function computeRenameEdits(
    lines: string[],
    scope: MethodScope,
    local: LocalVariable,
    newName: string,
): { line: number; startChar: number; endChar: number; newText: string }[] {
    if (!newName || newName === local.name) return [];
    const escaped = local.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameLen = local.name.length;
    const edits: { line: number; startChar: number; endChar: number; newText: string }[] = [];
    const seen = new Set<string>();
    for (let ln = scope.bodyRange.start.line; ln <= scope.bodyRange.end.line; ln++) {
        const text = lines[ln] ?? '';
        const regex = new RegExp('\\b' + escaped + '\\b', 'g');
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
            const key = ln + ':' + m.index;
            if (seen.has(key)) { regex.lastIndex = m.index + nameLen; continue; }
            seen.add(key);
            edits.push({ line: ln, startChar: m.index, endChar: m.index + nameLen, newText: newName });
            regex.lastIndex = m.index + nameLen;
        }
    }
    return edits;
}

/**
 * Rename a local variable across its method body. Returns false if nothing
 * matched. When a language server is available, the analyzer's
 * getRenameOccurrences can be used to refine the occurrence set; here we use the
 * regex baseline which is correct for a single method scope.
 */
export async function renameLocal(
    document: vscode.TextDocument,
    scope: MethodScope,
    local: LocalVariable,
    newName: string,
): Promise<boolean> {
    const edits = computeRenameEdits(document.getText().split(/\r?\n/), scope, local, newName);
    if (edits.length === 0) return false;
    const wsEdit = new vscode.WorkspaceEdit();
    for (const e of edits) {
        wsEdit.replace(document.uri, new vscode.Range(e.line, e.startChar, e.line, e.endChar), e.newText);
    }
    return vscode.workspace.applyEdit(wsEdit);
}

/**
 * Declare a variable that is used but not declared. Truth source for "used but
 * not declared" is provided by the caller (the code action surfaces this only
 * when a LSP undefined-name diagnostic exists at the position; the command path
 * uses the heuristic: identifier not present in scope.locals). The type is
 * guessed from the assignment RHS, falling back to the language field default.
 * Both name and type are shown in input boxes (prefilled) so the user can adjust.
 */
export async function declareUndeclaredVariable(
    document: vscode.TextDocument,
    provider: ILanguageProvider,
    scope: MethodScope,
    position: vscode.Position,
): Promise<boolean> {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]\w*/);
    if (!wordRange) {
        vscode.window.showWarningMessage('CE: No identifier at the cursor.');
        return false;
    }
    const name = document.getText(wordRange);
    if (scope.locals.some(l => l.name === name)) {
        vscode.window.showInformationMessage(`CE: "${name}" is already declared.`);
        return false;
    }

    // Guess type from the RHS of an assignment on the cursor line. Tries
    // literals first, then resolves a plain identifier against existing
    // locals/parameters in the scope before falling back to the field default.
    const lineText = document.lineAt(position.line).text;
    const assign = lineText.match(/[:=]\s*(.+?)\s*;?\s*$/);
    const guessed = assign ? provider.resolveIdentifierType(assign[1], scope) : undefined;
    const defaultType = provider.getTypeDefaults().defaultFieldType;
    const typeGuess = guessed || defaultType;

    const localName = await vscode.window.showInputBox({ prompt: 'Local variable name', value: name });
    if (!localName) return false;
    const localType = await vscode.window.showInputBox({ prompt: 'Type', value: typeGuess });
    if (localType === undefined) return false;

    const insertPos = provider.getDeclarationInsertPosition(document, scope.method);
    const indent = (document.lineAt(insertPos.line).text.match(/^\s*/) ?? [''])[0];
    const snippet = indent + provider.formatLocalVariable(localName, localType) + '\n';
    const wsEdit = new vscode.WorkspaceEdit();
    wsEdit.insert(document.uri, insertPos, snippet);
    return vscode.workspace.applyEdit(wsEdit);
}

/**
 * Change the declared type of a local variable. Untyped locals (inferred/no
 * annotation) are reported as unsupported in v1. The new type is confirmed via
 * an input box prefilled with the current type.
 */
export async function changeLocalType(
    document: vscode.TextDocument,
    local: LocalVariable,
    newType?: string,
): Promise<boolean> {
    if (!local.type) {
        vscode.window.showWarningMessage('CE: Converting an untyped local is not supported yet.');
        return false;
    }
    const resolved = newType ?? await vscode.window.showInputBox({ prompt: 'New type', value: local.type });
    if (resolved === undefined || resolved === local.type) return false;
    const edit = computeTypeEdit(document.getText().split(/\r?\n/), local, resolved);
    if (!edit) return false;
    const wsEdit = new vscode.WorkspaceEdit();
    wsEdit.replace(document.uri, new vscode.Range(edit.line, edit.startChar, edit.line, edit.endChar), edit.newText);
    return vscode.workspace.applyEdit(wsEdit);
}
