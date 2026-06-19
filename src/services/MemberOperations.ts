import * as vscode from 'vscode';
import { ClassInfo, ClassMember, MemberKind, MemberSpec, FieldSpec, PropertySpec, GeneratedCode } from '../models/types';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { CodeGeneratorService } from '../services/CodeGeneratorService';
import { CodeExplorerService } from '../services/CodeExplorerService';
import { MemberEditorPanel } from '../webview/MemberEditorPanel';
import { previewAndConfirm } from './SafePreview';

let _log: vscode.OutputChannel | undefined;
function getLog(): vscode.OutputChannel {
    if (!_log) {
        _log = vscode.window.createOutputChannel('Code Explorer');
    }
    return _log;
}
function mmxLog(msg: string): void {
    getLog().appendLine(msg);
    console.log('[MMX] ' + msg);
}
export function setLogChannel(ch: vscode.OutputChannel): void {
    _log = ch;
}

export async function applyGeneratedCode(
    doc: vscode.TextDocument,
    provider: ILanguageProvider,
    gen: GeneratedCode
): Promise<boolean> {
    mmxLog('[applyGeneratedCode] doc=' + doc.fileName);
    mmxLog('[applyGeneratedCode] declaration=' + (gen.declaration ? 'yes' : 'no') + ' at line ' + gen.declarationPosition.line);
    mmxLog('[applyGeneratedCode] implementation=' + (gen.implementation ? 'yes' : 'no') + ' at line ' + gen.implementationPosition.line);
    mmxLog('[applyGeneratedCode] pairedFileImplementation=' + (gen.pairedFileImplementation ? 'yes' : 'no'));

    const wsEdit = new vscode.WorkspaceEdit();

    // Planned edits grouped by URI so the Safe Preview can show an accurate
    // diff before anything is applied. Each entry captures the exact insert
    // that will later be queued on the WorkspaceEdit below.
    interface PlannedEdit { uri: vscode.Uri; range: vscode.Range; newText: string; }
    const plannedByUri = new Map<vscode.Uri, PlannedEdit[]>();
    const plan = (uri: vscode.Uri, pos: vscode.Position, text: string) => {
        const range = new vscode.Range(pos, pos);
        const arr = plannedByUri.get(uri) ?? [];
        arr.push({ uri, range, newText: text });
        plannedByUri.set(uri, arr);
    };

    let pairedUri: vscode.Uri | undefined;
    // Cache of already-opened document texts keyed by URI string, so the Safe
    // Preview loop can reuse them instead of reopening each file a second time.
    const originalTextCache = new Map<string, string>();
    originalTextCache.set(doc.uri.toString(), doc.getText());

    if (gen.declaration) {
        wsEdit.insert(doc.uri, gen.declarationPosition, gen.declaration);
        plan(doc.uri, gen.declarationPosition, gen.declaration);
        mmxLog('[applyGeneratedCode] queued declaration insert at line ' + gen.declarationPosition.line);
    }

    if (gen.pairedFileImplementation) {
        pairedUri = provider.findPairedFile(doc.uri);
        if (pairedUri) {
            const pd = await vscode.workspace.openTextDocument(pairedUri);
            originalTextCache.set(pairedUri.toString(), pd.getText());
            const pos = new vscode.Position(pd.lineCount, 0);
            wsEdit.insert(pairedUri, pos, '\n' + gen.pairedFileImplementation);
            plan(pairedUri, pos, '\n' + gen.pairedFileImplementation);
            mmxLog('[applyGeneratedCode] queued paired impl in ' + pairedUri.fsPath);
        } else {
            const pos = new vscode.Position(doc.lineCount, 0);
            wsEdit.insert(doc.uri, pos, '\n' + gen.pairedFileImplementation);
            plan(doc.uri, pos, '\n' + gen.pairedFileImplementation);
            mmxLog('[applyGeneratedCode] no paired file — queued impl at end of doc');
        }
    } else if (gen.implementation) {
        wsEdit.insert(doc.uri, gen.implementationPosition, gen.implementation);
        plan(doc.uri, gen.implementationPosition, gen.implementation);
        mmxLog('[applyGeneratedCode] queued implementation insert at line ' + gen.implementationPosition.line);
    }

    // Safe Preview: show a diff and require explicit confirmation before the
    // (fragile) structural edit is committed. Skipped when `mmx.previewEdits`
    // is disabled, in which case previewAndConfirm returns true immediately.
    const previewDocs: { label: string; uri: vscode.Uri; originalText: string; edits: PlannedEdit[] }[] = [];
    for (const [uri, edits] of plannedByUri) {
        const key = uri.toString();
        let originalText = originalTextCache.get(key);
        if (originalText === undefined) {
            const pd = await vscode.workspace.openTextDocument(uri);
            originalText = pd.getText();
            originalTextCache.set(key, originalText);
        }
        previewDocs.push({ label: vscode.workspace.asRelativePath(uri), uri, originalText, edits });
    }
    const approved = await previewAndConfirm(previewDocs, 'Apply generated code');
    if (!approved) {
        mmxLog('[applyGeneratedCode] user cancelled in Safe Preview — no changes applied');
        return false;
    }

    const result = await vscode.workspace.applyEdit(wsEdit);
    mmxLog('[applyGeneratedCode] applyEdit result: ' + result);
    return result;
}

export async function editMember(
    context: vscode.ExtensionContext,
    doc: vscode.TextDocument,
    provider: ILanguageProvider,
    cls: ClassInfo,
    member: ClassMember,
    codeGenerator: CodeGeneratorService,
    codeExplorer: CodeExplorerService
): Promise<boolean> {
    mmxLog('[editMember] opening editor for: ' + member.name + ' kind=' + member.kind + ' in class ' + cls.name);
    mmxLog('[editMember] member.range: line ' + member.range.start.line + '-' + member.range.end.line);

    const result = await MemberEditorPanel.create(context, doc, provider, cls, codeGenerator, member.kind as MemberKind, member);
    if (!result) {
        mmxLog('[editMember] MemberEditorPanel.create returned null — user cancelled or error');
        return false;
    }

    mmxLog('[editMember] editor result: name=' + result.name + ' kind=' + result.kind);

    const originalInsertLine = member.range.start.line;
    mmxLog('[editMember] originalInsertLine=' + originalInsertLine);

    // Capture the existing implementation body so that editing a member only
    // changes its signature (name/params/return type) and preserves the body.
    const existingBody = member.implementationRange
        ? extractImplBody(doc.getText(member.implementationRange))
        : undefined;
    if (existingBody) {
        mmxLog('[editMember] captured existing implementation body (' + existingBody.length + ' chars) — will be preserved');
    }

    mmxLog('[editMember] deleting old member...');

    // Standalone (file-level) functions have their declaration and body in a single
    // block. The delete+reinsert flow below is designed for class members where decl
    // and impl are separate, and would duplicate or empty standalone functions.
    // Instead, rewrite the function in place as a single edit, preserving the body.
    if (cls.classType === 'standalone' && member.implementationRange) {
        const range = member.implementationRange;
        const currentText = doc.getText(range);
        const spec: MemberSpec = {
            kind: result.kind, name: result.name, returnType: result.returnType || undefined,
            visibility: result.visibility, parameters: result.parameters || [],
            modifiers: [], isStatic: !!result.isStatic, isVirtual: !!result.isVirtual,
            isAbstract: !!result.isAbstract, isOverride: !!result.isOverride, isFinal: false,
        };
        const newFull = provider.rewriteStandaloneFunction(currentText, spec);
        if (newFull !== undefined) {
            mmxLog('[editMember] standalone rewrite in place: ' + spec.name);
            const wsEdit = new vscode.WorkspaceEdit();
            wsEdit.replace(doc.uri, range, newFull);
            const ok = await vscode.workspace.applyEdit(wsEdit);
            mmxLog('[editMember] standalone rewrite result: ' + ok);
            if (ok) {
                codeExplorer.refresh();
                vscode.window.showInformationMessage('MMX: Updated "' + result.name + '"');
            }
            return ok;
        }
        mmxLog('[editMember] provider has no standalone rewrite — falling back to legacy path');
    }

    await codeGenerator.deleteMember(doc, cls, member);

    // Standalone procedures (file-level functions) are not in parsed.classes.
    // Use the original synthesized ClassInfo directly — generateMethod handles
    // classType === 'standalone' to produce the correct qualifier-free code.
    let updatedCls: ClassInfo;
    if (cls.classType === 'standalone') {
        mmxLog('[editMember] standalone procedure — using original ClassInfo');
        updatedCls = cls;
    } else {
        const reparsed = provider.parseDocument(doc);
        mmxLog('[editMember] reparsed: ' + reparsed.classes.length + ' classes');
        const found = reparsed.classes.find(c => c.name === cls.name);
        if (!found) {
            mmxLog('[editMember] FAIL: class ' + cls.name + ' not found after reparse');
            codeExplorer.refresh();
            return false;
        }
        updatedCls = found;
        mmxLog('[editMember] found updated class: ' + updatedCls.name + ' with ' + updatedCls.members.length + ' members');
    }

    let success = false;

    if (result.kind === MemberKind.Method || result.kind === MemberKind.Constructor || result.kind === MemberKind.Destructor) {
        const spec: MemberSpec = {
            kind: result.kind, name: result.name, returnType: result.returnType || undefined,
            visibility: result.visibility, parameters: result.parameters || [],
            modifiers: [], isStatic: result.isStatic, isVirtual: result.isVirtual,
            isAbstract: result.isAbstract, isOverride: result.isOverride, isFinal: false,
        };
        mmxLog('[editMember] generating method: ' + spec.name + ' returnType=' + spec.returnType + ' params=' + spec.parameters.length);
        const gen = provider.generateMethod(updatedCls.name, spec, updatedCls, existingBody);
        gen.declarationPosition = new vscode.Position(originalInsertLine, 0);
        mmxLog('[editMember] declarationPosition set to line ' + originalInsertLine);
        success = await applyGeneratedCode(doc, provider, gen);
    } else if (result.kind === MemberKind.Field) {
        const spec: FieldSpec = { kind: MemberKind.Field, name: result.name, type: result.type || result.returnType || 'int', visibility: result.visibility };
        mmxLog('[editMember] generating field: ' + spec.name + ' type=' + spec.type);
        const gen = provider.generateField(updatedCls.name, spec, updatedCls);
        gen.declarationPosition = new vscode.Position(originalInsertLine, 0);
        success = await applyGeneratedCode(doc, provider, gen);
    } else if (result.kind === MemberKind.Property) {
        const spec: PropertySpec = {
            kind: MemberKind.Property, name: result.name, type: result.type || result.returnType || 'string',
            visibility: result.visibility, hasGetter: result.hasGetter, hasSetter: result.hasSetter,
            getterName: result.getterName, setterName: result.setterName, isDefault: false, isReadOnly: false,
        };
        mmxLog('[editMember] generating property: ' + spec.name + ' type=' + spec.type);
        const gen = provider.generateProperty(updatedCls.name, spec, updatedCls);
        gen.declarationPosition = new vscode.Position(originalInsertLine, 0);
        success = await applyGeneratedCode(doc, provider, gen);
    }

    mmxLog('[editMember] final success: ' + success);
    if (success) {
        codeExplorer.refresh();
        vscode.window.showInformationMessage('MMX: Updated "' + result.name + '" in ' + updatedCls.name);
    }

    return success;
}

/**
 * Implement interface / override abstract methods: for the class at the cursor,
 * collect every method declared on its interfaces (defined in the same
 * document) that the class does not yet implement, and generate stubs for them.
 * The generated code flows through applyGeneratedCode (Safe Preview).
 */
export async function implementInterface(
    doc: vscode.TextDocument,
    provider: ILanguageProvider,
    cls: ClassInfo,
    codeExplorer: CodeExplorerService
): Promise<boolean> {
    mmxLog('[implementInterface] class=' + cls.name + ' interfaces=[' + cls.interfaces.join(', ') + ']');

    if (cls.interfaces.length === 0) {
        vscode.window.showInformationMessage('MMX: "' + cls.name + '" does not declare any interface.');
        return false;
    }

    const parsed = provider.parseDocument(doc);
    const stubParts: string[] = [];
    const resolvedNames: string[] = [];

    for (const ifaceName of cls.interfaces) {
        const interfaceInfo = parsed.classes.find(c => c.name === ifaceName);
        if (!interfaceInfo) {
            mmxLog('[implementInterface] interface ' + ifaceName + ' not found in document — skipping');
            continue;
        }
        const stubs = provider.generateMissingStubs(cls.name, interfaceInfo, cls);
        if (stubs) {
            stubParts.push(stubs);
            resolvedNames.push(ifaceName);
            mmxLog('[implementInterface] generated stubs for ' + ifaceName);
        } else {
            mmxLog('[implementInterface] no missing members for ' + ifaceName);
        }
    }

    if (stubParts.length === 0) {
        vscode.window.showInformationMessage('MMX: "' + cls.name + '" already implements all known interface methods.');
        return false;
    }

    const insertPos = provider.getInsertPosition(doc, cls, 'method').declaration;
    const gen = {
        declaration: '\n' + stubParts.join('\n'),
        implementation: '',
        declarationPosition: insertPos,
        implementationPosition: insertPos,
    };

    const success = await applyGeneratedCode(doc, provider, gen);
    mmxLog('[implementInterface] success: ' + success);
    if (success) {
        codeExplorer.refresh();
        vscode.window.showInformationMessage('MMX: Implemented ' + resolvedNames.join(', ') + ' in ' + cls.name);
    }
    return success;
}

export async function deleteMember(
    doc: vscode.TextDocument,
    cls: ClassInfo,
    member: ClassMember,
    codeGenerator: CodeGeneratorService,
    codeExplorer: CodeExplorerService
): Promise<boolean> {
    mmxLog('[deleteMember] asking confirmation for: ' + member.name);

    await new Promise<void>(resolve => setTimeout(resolve, 100));

    const confirm = await vscode.window.showWarningMessage(
        `Delete member "${member.name}"?`,
        { modal: true },
        'Delete'
    );
    mmxLog('[deleteMember] dialog returned: ' + JSON.stringify(confirm));
    if (confirm !== 'Delete') {
        mmxLog('[deleteMember] user cancelled');
        getLog().show();
        return false;
    }

    mmxLog('[deleteMember] confirmed — calling codeGenerator.deleteMember');
    mmxLog('[deleteMember] member.range: line ' + member.range.start.line + '-' + member.range.end.line);

    const success = await codeGenerator.deleteMember(doc, cls, member);
    mmxLog('[deleteMember] codeGenerator.deleteMember returned: ' + success);
    if (success) {
        codeExplorer.refresh();
        vscode.window.showInformationMessage(`Deleted member: ${member.name}`);
    }
    return success;
}

export async function renameMember(
    doc: vscode.TextDocument,
    cls: ClassInfo,
    member: ClassMember,
    provider: ILanguageProvider | undefined,
    codeExplorer: CodeExplorerService
): Promise<boolean> {
    mmxLog('[renameMember] member=' + member.name + ' class=' + cls.name);
    mmxLog('[renameMember] member.range: line ' + member.range.start.line + ' char ' + member.range.start.character);
    mmxLog('[renameMember] about to show InputBox...');

    await new Promise<void>(resolve => setTimeout(resolve, 100));

    const newName = await vscode.window.showInputBox({
        title: 'MMX: Rename Member',
        prompt: `Rename "${member.name}" to:`,
        value: member.name,
        ignoreFocusOut: true,
    });
    mmxLog('[renameMember] InputBox returned: ' + JSON.stringify(newName));
    if (!newName || newName === member.name) {
        mmxLog('[renameMember] cancelled or same name: ' + newName);
        getLog().show();
        return false;
    }

    mmxLog('[renameMember] new name: ' + newName);

    const wsEdit = new vscode.WorkspaceEdit();
    const escapedName = member.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const renameRegex = new RegExp('\\b' + escapedName + '\\b', 'g');

    // For standalone procedures, cls.range is only the declaration line.
    // We must also search the implementation block (member.implementationRange)
    // so that both the interface and implementation sections stay in sync.
    const isStandalone = cls.classType === 'standalone';
    const searchRanges: vscode.Range[] = isStandalone
        ? [member.range, ...(member.implementationRange ? [member.implementationRange] : [])]
        : [cls.range];

    let totalReplacements = 0;

    for (const searchRange of searchRanges) {
        const startLine = searchRange.start.line;
        const endLine = searchRange.end.line;
        for (let lineNum = startLine; lineNum <= endLine && lineNum < doc.lineCount; lineNum++) {
            const lineText = doc.lineAt(lineNum).text;
            let searchStart = 0;
            let lineMatch;
            while ((lineMatch = renameRegex.exec(lineText)) !== null) {
                if (lineMatch.index < searchStart) {
                    renameRegex.lastIndex = searchStart;
                    continue;
                }
                const nameRange = new vscode.Range(
                    lineNum, lineMatch.index,
                    lineNum, lineMatch.index + member.name.length
                );
                wsEdit.replace(doc.uri, nameRange, newName);
                totalReplacements++;
                searchStart = lineMatch.index + member.name.length;
                renameRegex.lastIndex = searchStart;
            }
            renameRegex.lastIndex = 0;
        }
    }

    mmxLog('[renameMember] replaced ' + totalReplacements + ' occurrences in ' + (isStandalone ? 'standalone procedure' : 'class ' + cls.name));

    if (totalReplacements === 0) {
        mmxLog('[renameMember] FAIL: no occurrences found');
        vscode.window.showWarningMessage(`Could not locate "${member.name}" in the class body. Rename aborted.`);
        return false;
    }

    if (provider) {
        const pairedUri = provider.findPairedFile(doc.uri);
        mmxLog('[renameMember] paired file: ' + (pairedUri?.fsPath || 'none'));
        if (pairedUri) {
            const pairedDoc = await vscode.workspace.openTextDocument(pairedUri);
            const pairedText = pairedDoc.getText();
            const pattern = cls.name + '::' + member.name;
            let idx = pairedText.indexOf(pattern);
            let count = 0;
            while (idx >= 0) {
                const pos = pairedDoc.positionAt(idx + cls.name.length + 2);
                const endPos = pairedDoc.positionAt(idx + pattern.length);
                wsEdit.replace(pairedUri, new vscode.Range(pos, endPos), newName);
                count++;
                idx = pairedText.indexOf(pattern, idx + 1);
            }
            mmxLog('[renameMember] replaced ' + count + ' occurrences in paired file');
        }
    }

    const ok = await vscode.workspace.applyEdit(wsEdit);
    mmxLog('[renameMember] applyEdit result: ' + ok);
    if (ok) {
        codeExplorer.refresh();
        vscode.window.showInformationMessage(`Renamed "${member.name}" to "${newName}"`);
    }
    return ok;
}

/**
 * Extract the full body of an existing implementation block (everything between
 * the signature header line and the closing `end;` / `}`) so it can be
 * preserved verbatim when editing a member's signature. This keeps local
 * declarations (e.g. Pascal `var` sections) and the method body intact.
 * Returns undefined if no body can be located.
 */
function extractImplBody(implText: string): string | undefined {
    // Pascal: header line is `function|procedure|constructor|destructor ...;`
    const headerMatch = implText.match(/(?:function|procedure|constructor|destructor)\b[^\n]*/);
    if (headerMatch) {
        const afterHeader = implText.indexOf('\n', headerMatch.index!) + 1;
        const endIdx = implText.lastIndexOf('end;');
        if (endIdx > afterHeader) {
            return implText.substring(afterHeader, endIdx);
        }
    }
    // C-family: body between '{' and the last '}'
    const braceOpen = implText.indexOf('{');
    if (braceOpen >= 0) {
        const afterBrace = implText.indexOf('\n', braceOpen) + 1;
        const braceClose = implText.lastIndexOf('}');
        if (braceClose > afterBrace) {
            return implText.substring(afterBrace, braceClose);
        }
    }
    return undefined;
}
