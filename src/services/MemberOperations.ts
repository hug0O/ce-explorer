import * as vscode from 'vscode';
import { ClassInfo, ClassMember, MemberKind, MemberSpec, FieldSpec, PropertySpec, GeneratedCode, MemberFormResult } from '../models/types';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { CodeGeneratorService, expandToFullMember } from '../services/CodeGeneratorService';
import { CodeExplorerService } from '../services/CodeExplorerService';
import { EditPipeline } from './EditPipeline';
import { memberFormToSpec, generateFromSpec } from './memberForm';
import { LocalScopeAnalyzer } from './LocalScopeAnalyzer';

let _log: vscode.OutputChannel | undefined;
function getLog(): vscode.OutputChannel {
    if (!_log) {
        _log = vscode.window.createOutputChannel('Code Explorer');
    }
    return _log;
}
function mmxLog(msg: string): void {
    getLog().appendLine(msg);
}
export function setLogChannel(ch: vscode.OutputChannel): void {
    _log = ch;
}

/**
 * Queue the inserts described by `gen` onto `pipeline` (original document
 * coordinates), recording original texts for the preview. Split from
 * applyGeneratedCode so composite operations (e.g. move member: delete from
 * source + insert into destination) can queue everything into one pipeline
 * and commit a single atomic WorkspaceEdit.
 */
export async function queueGeneratedCode(
    doc: vscode.TextDocument,
    provider: ILanguageProvider,
    gen: GeneratedCode,
    pipeline: EditPipeline
): Promise<void> {
    pipeline.recordOriginal(doc.uri, doc.getText());

    if (gen.declaration) {
        pipeline.insert(doc.uri, gen.declarationPosition, gen.declaration);
    }

    if (gen.extraDeclaration && gen.extraDeclarationPosition) {
        pipeline.insert(doc.uri, gen.extraDeclarationPosition, gen.extraDeclaration);
    }

    if (gen.pairedFileImplementation) {
        const pairedUri = provider.findPairedFile(doc.uri);
        if (pairedUri) {
            const pd = await vscode.workspace.openTextDocument(pairedUri);
            pipeline.recordOriginal(pairedUri, pd.getText());
            pipeline.insert(pairedUri, new vscode.Position(pd.lineCount, 0), '\n' + gen.pairedFileImplementation);
        } else {
            pipeline.insert(doc.uri, new vscode.Position(doc.lineCount, 0), '\n' + gen.pairedFileImplementation);
        }
    } else if (gen.implementation) {
        pipeline.insert(doc.uri, gen.implementationPosition, gen.implementation);
    }
}

export async function applyGeneratedCode(
    doc: vscode.TextDocument,
    provider: ILanguageProvider,
    gen: GeneratedCode
): Promise<boolean> {
    const pipeline = new EditPipeline();
    await queueGeneratedCode(doc, provider, gen, pipeline);
    return pipeline.apply('Apply generated code');
}

export async function editMember(
    doc: vscode.TextDocument,
    provider: ILanguageProvider,
    cls: ClassInfo,
    member: ClassMember,
    codeGenerator: CodeGeneratorService,
    codeExplorer: CodeExplorerService,
    result: MemberFormResult
): Promise<boolean> {
    mmxLog('[editMember] applying result for: ' + member.name + ' -> ' + result.name + ' kind=' + member.kind + ' in class ' + cls.name);
    mmxLog('[editMember] member.range: line ' + member.range.start.line + '-' + member.range.end.line);

    if (!result.name || !result.name.trim()) {
        mmxLog('[editMember] no name in result — aborted');
        return false;
    }

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

    const spec = memberFormToSpec(result);

    mmxLog('[editMember] deleting old member...');

    // Standalone (file-level) functions have their declaration and body in a single
    // block. The delete+reinsert flow below is designed for class members where decl
    // and impl are separate, and would duplicate or empty standalone functions.
    // Instead, rewrite the function in place as a single edit, preserving the body.
    if (cls.classType === 'standalone' && member.implementationRange) {
        const range = member.implementationRange;
        const currentText = doc.getText(range);
        const mspec = spec as MemberSpec;
        const newFull = provider.rewriteStandaloneFunction(currentText, mspec);
        if (newFull !== undefined) {
            mmxLog('[editMember] standalone rewrite in place: ' + spec.name);
            const wsEdit = new vscode.WorkspaceEdit();
            wsEdit.replace(doc.uri, range, newFull);
            // Languages with a separate forward/interface declaration (Pascal)
            // must keep it in sync with the implementation header. Only touch it
            // when the declaration is a distinct range from the implementation
            // and the provider knows how to rewrite it.
            if (member.range
                && !(member.range.start.line <= range.end.line && range.start.line <= member.range.end.line)) {
                const newDecl = provider.rewriteStandaloneDeclaration(doc.getText(member.range), mspec);
                if (newDecl !== undefined) {
                    wsEdit.replace(doc.uri, member.range, newDecl);
                    mmxLog('[editMember] standalone declaration synced: ' + spec.name);
                }
            }
            const ok = await vscode.workspace.applyEdit(wsEdit);
            mmxLog('[editMember] standalone rewrite result: ' + ok);
            if (ok) {
                codeExplorer.refresh();
                vscode.window.showInformationMessage('CE: Updated "' + result.name + '"');
            }
            return ok;
        }
        mmxLog('[editMember] provider has no standalone rewrite — falling back to legacy path');
    }

    // Atomic edit: the old member blocks are REPLACED in place by the newly
    // generated code, all queued on one pipeline in original document
    // coordinates and committed as a single WorkspaceEdit — one preview, one
    // undo step, and a cancelled preview changes nothing.
    const declRange = expandToFullMember(doc, member.range);
    const pairedUri = provider.findPairedFile(doc.uri);
    const implInPaired = !!(pairedUri && member.implementationRange);
    // Same-file implementation block (e.g. Pascal implementation section),
    // distinct from the declaration block.
    const sameFileImplRange = member.implementationRange && !implInPaired
        && !(member.implementationRange.start.line <= declRange.end.line
            && member.implementationRange.end.line >= declRange.start.line)
        ? expandToFullMember(doc, member.implementationRange)
        : undefined;

    if (member.implementationRange && !implInPaired && !sameFileImplRange) {
        // Overlapping declaration/implementation block and no provider rewrite
        // support (rare legacy fallback): keep the sequential delete+reinsert.
        mmxLog('[editMember] legacy fallback (overlapping decl/impl)');
        await codeGenerator.deleteMember(doc, cls, member);
        const gen = generateFromSpec(provider, cls, spec, existingBody);
        gen.declarationPosition = new vscode.Position(originalInsertLine, 0);
        const success = await applyGeneratedCode(doc, provider, gen);
        if (success) {
            codeExplorer.refresh();
            vscode.window.showInformationMessage('CE: Updated "' + result.name + '" in ' + cls.name);
        }
        return success;
    }

    const gen = generateFromSpec(provider, cls, spec, existingBody);

    const pipeline = new EditPipeline();
    pipeline.recordOriginal(doc.uri, doc.getText());

    pipeline.replace(doc.uri, declRange, gen.declaration ?? '');

    if (implInPaired && pairedUri && member.implementationRange) {
        // Header/source languages: implementationRange coordinates refer to the
        // paired file. Replace the old implementation there with the new one.
        const pd = await vscode.workspace.openTextDocument(pairedUri);
        pipeline.recordOriginal(pairedUri, pd.getText());
        pipeline.delete(pairedUri, expandToFullMember(pd, member.implementationRange));
        if (gen.pairedFileImplementation) {
            pipeline.insert(pairedUri, new vscode.Position(pd.lineCount, 0), '\n' + gen.pairedFileImplementation);
        }
    } else if (sameFileImplRange) {
        if (gen.implementation) {
            pipeline.replace(doc.uri, sameFileImplRange, gen.implementation);
        } else {
            pipeline.delete(doc.uri, sameFileImplRange);
        }
    }

    const success = await pipeline.apply(`Edit member "${result.name}"`);

    mmxLog('[editMember] final success: ' + success);
    if (success) {
        codeExplorer.refresh();
        vscode.window.showInformationMessage('CE: Updated "' + result.name + '" in ' + cls.name);
    }

    return success;
}

async function findSourceDefinitions(
    doc: vscode.TextDocument,
    provider: ILanguageProvider,
    names: string[]
): Promise<{ name: string; info: ClassInfo }[]> {
    const found = new Map<string, ClassInfo>();
    const parsed = provider.parseDocument(doc);
    for (const name of names) {
        const info = parsed.classes.find(c => c.name === name);
        if (info) {
            found.set(name, info);
        }
    }

    const missing = names.filter(n => !found.has(n));
    if (missing.length === 0) {
        return Array.from(found, ([name, info]) => ({ name, info }));
    }

    const stillMissing = new Set(missing);
    const extensions = provider.fileExtensions.map(e => e.replace(/^\./, ''));
    if (extensions.length === 0) {
        return Array.from(found, ([name, info]) => ({ name, info }));
    }
    const includePattern = '**/*{' + extensions.join(',') + '}';
    const files = await vscode.workspace.findFiles(includePattern, '**/node_modules/**');
    const docUriStr = doc.uri.toString();
    await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Window, title: 'CE: Searching definitions of ' + missing.join(', ') + '…' },
        async () => {
            for (const fileUri of files) {
                if (stillMissing.size === 0) break;
                if (fileUri.toString() === docUriStr) continue;
                const fileDoc = await vscode.workspace.openTextDocument(fileUri);
                const fileParsed = provider.parseDocument(fileDoc);
                for (const clsInfo of fileParsed.classes) {
                    if (stillMissing.has(clsInfo.name)) {
                        found.set(clsInfo.name, clsInfo);
                        stillMissing.delete(clsInfo.name);
                        if (stillMissing.size === 0) break;
                    }
                }
            }
        },
    );

    return Array.from(found, ([name, info]) => ({ name, info }));
}

function classMemberToMethodSpec(m: ClassMember): MemberSpec {
    return {
        kind: m.kind === MemberKind.Constructor ? MemberKind.Constructor : MemberKind.Method,
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
}

function formatMethodLabel(m: ClassMember): string {
    const params = m.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
    const ret = m.returnType ? `: ${m.returnType}` : '';
    return `${m.name}(${params})${ret}`;
}

/**
 * Implement interface / override methods: for the given class, locate the
 * definitions of its declared interfaces and parent class (searching the
 * current document first, then every workspace file of the same language),
 * collect every method that the class does not yet declare, and let the user
 * pick which ones to stub via a multi-select QuickPick. Each selected method is
 * generated through provider.generateMethod and applied through
 * applyGeneratedCode (Safe Preview).
 */

/**
 * Insert a local variable declaration derived from a field's type at the cursor.
 * Used by the "Create local variable" action: the user places the cursor inside a
 * method body and triggers the action on a field (explorer item or cursor on the
 * field), and a correctly-typed local declaration is inserted at the cursor.
 */
export async function createLocalVariable(
    doc: vscode.TextDocument,
    provider: ILanguageProvider,
    member: ClassMember,
    editor: vscode.TextEditor,
    scopeAnalyzer?: LocalScopeAnalyzer
): Promise<boolean> {
    let fieldType = member.type || member.returnType;

    // When the field has no explicit type, try to infer one from the cursor's
    // surrounding scope (existing local / parameter / literal assignment) so
    // that the created local is typed rather than defaulting to nothing.
    if (!fieldType && scopeAnalyzer) {
        const parsed = provider.parseDocument(doc);
        const pos = editor.selection.active;
        const enclosing = parsed.classes
            .flatMap(c => c.members)
            .find(m => m.kind === MemberKind.Method
                && (m.range.contains(pos) || m.implementationRange?.contains(pos)));
        if (enclosing) {
            const scope = scopeAnalyzer.getScope(doc, provider, enclosing);
            if (scope) {
                const lineText = doc.lineAt(pos.line).text;
                const assign = lineText.match(/[:=]\s*(.+?)\s*;?\s*$/);
                if (assign) {
                    fieldType = provider.resolveIdentifierType(assign[1], scope);
                }
            }
        }
    }

    if (!fieldType) {
        vscode.window.showWarningMessage(`CE: Could not determine a type for "${member.name}".`);
        return false;
    }

    // Suggest a lowercase local name derived from the field name, letting the
    // user override it.
    const suggested = member.name.charAt(0).toLowerCase() + member.name.slice(1);
    const localName = await vscode.window.showInputBox({
        prompt: 'Local variable name',
        value: suggested,
        validateInput: v => v.trim() ? null : 'Name required',
    });
    if (!localName) { return false; }

    const lineText = doc.lineAt(editor.selection.active.line).text;
    const indentMatch = lineText.match(/^[\t ]*/);
    const indent = indentMatch ? indentMatch[0] : '';
    const snippet = indent + provider.formatLocalVariable(localName, fieldType) + '\n';

    const wsEdit = new vscode.WorkspaceEdit();
    wsEdit.insert(doc.uri, new vscode.Position(editor.selection.active.line, 0), snippet);
    const ok = await vscode.workspace.applyEdit(wsEdit);
    if (ok) {
        const newPos = new vscode.Position(editor.selection.active.line, 0);
        editor.selection = new vscode.Selection(newPos, newPos);
        vscode.window.showInformationMessage(`CE: Inserted local "${localName}: ${fieldType}".`);
    }
    return ok;
}

export async function implementInterface(
    doc: vscode.TextDocument,
    provider: ILanguageProvider,
    cls: ClassInfo,
    codeExplorer: CodeExplorerService
): Promise<boolean> {
    const sourceNames: string[] = [];
    for (const i of cls.interfaces) {
        if (!sourceNames.includes(i)) { sourceNames.push(i); }
    }
    if (cls.parentClass && !sourceNames.includes(cls.parentClass)) {
        sourceNames.push(cls.parentClass);
    }

    mmxLog('[implementInterface] class=' + cls.name + ' sources=[' + sourceNames.join(', ') + ']');

    if (sourceNames.length === 0) {
        vscode.window.showInformationMessage('CE: "' + cls.name + '" has no interface or parent class to implement.');
        return false;
    }

    const sources = await findSourceDefinitions(doc, provider, sourceNames);
    const resolvedNames = sources.map(s => s.name);
    const unresolved = sourceNames.filter(n => !resolvedNames.includes(n));
    if (unresolved.length > 0) {
        mmxLog('[implementInterface] not found in workspace: ' + unresolved.join(', '));
    }
    if (sources.length === 0) {
        vscode.window.showInformationMessage('CE: Could not find definitions for ' + sourceNames.join(', ') + ' in the workspace.');
        return false;
    }

    const existing = new Set(cls.members.map(m => m.name));
    const seenMethod = new Set<string>();
    interface PickItem extends vscode.QuickPickItem { method: ClassMember; }
    const pickItems: PickItem[] = [];

    for (const source of sources) {
        for (const m of source.info.members) {
            if (m.kind !== MemberKind.Method && m.kind !== MemberKind.Constructor) {
                continue;
            }
            if (existing.has(m.name)) { continue; }
            if (m.isStatic) { continue; }
            if (seenMethod.has(m.name)) { continue; }
            seenMethod.add(m.name);
            pickItems.push({
                label: formatMethodLabel(m),
                description: source.info.isInterface ? 'interface ' + source.name : 'parent ' + source.name,
                detail: m.documentation,
                picked: true,
                method: m,
            });
        }
    }

    if (pickItems.length === 0) {
        vscode.window.showInformationMessage('CE: "' + cls.name + '" already implements all known methods.');
        return false;
    }

    const selected = await vscode.window.showQuickPick(pickItems, {
        canPickMany: true,
        title: 'CE: Implement Interface / Override Methods',
        placeHolder: 'Select methods to generate stubs for in ' + cls.name,
    });
    if (!selected || selected.length === 0) {
        return false;
    }

    const stubParts: string[] = [];
    for (const pick of selected) {
        const spec = classMemberToMethodSpec(pick.method);
        const gen = provider.generateMethod(cls.name, spec, cls);
        if (gen.declaration) {
            stubParts.push(gen.declaration.replace(/\n$/, ''));
        }
    }
    if (stubParts.length === 0) {
        vscode.window.showInformationMessage('CE: No stubs were generated for the selected methods.');
        return false;
    }

    const insertPos = provider.getInsertPosition(doc, cls, 'method').declaration;
    const gen: GeneratedCode = {
        declaration: '\n' + stubParts.join('\n') + '\n',
        implementation: '',
        declarationPosition: insertPos,
        implementationPosition: insertPos,
    };

    const success = await applyGeneratedCode(doc, provider, gen);
    mmxLog('[implementInterface] success: ' + success);
    if (success) {
        codeExplorer.refresh();
        vscode.window.showInformationMessage('CE: Implemented ' + selected.length + ' method(s) in ' + cls.name);
    }
    return success;
}

/**
 * Insert a documentation comment header above the member's implementation
 * (or its declaration when there is no separate implementation block). The
 * header is derived from the parsed signature — name, parameters with their
 * directions, return type — plus a TODO line for the description.
 */
export async function insertDocHeader(
    doc: vscode.TextDocument,
    provider: ILanguageProvider,
    _cls: ClassInfo,
    member: ClassMember
): Promise<boolean> {
    const target = member.implementationRange?.start ?? member.range.start;
    const indent = (doc.lineAt(target.line).text.match(/^(\s*)/)?.[1]) || '';

    const commentLines: string[] = [`${member.name} — TODO: describe what this routine does.`];
    if (member.parameters.length > 0) {
        commentLines.push('Params:');
        for (const p of member.parameters) {
            const dir = p.isVar ? 'var ' : p.isOut ? 'out ' : p.isConst ? 'const ' : '';
            commentLines.push(`  ${dir}${p.name}: ${p.type}`);
        }
    }
    if (member.returnType) {
        commentLines.push(`Returns: ${member.returnType}`);
    }

    let block: string;
    if (provider.languageId === 'pascal') {
        block = ['{', ...commentLines.map(l => '  ' + l), '}'].map(l => indent + l).join('\n') + '\n';
    } else if (provider.languageId === 'python') {
        block = commentLines.map(l => indent + '# ' + l).join('\n') + '\n';
    } else if (provider.languageId === 'plsql') {
        block = commentLines.map(l => indent + '-- ' + l).join('\n') + '\n';
    } else {
        block = commentLines.map(l => indent + '// ' + l).join('\n') + '\n';
    }

    const pipeline = new EditPipeline();
    pipeline.recordOriginal(doc.uri, doc.getText());
    pipeline.insert(doc.uri, new vscode.Position(target.line, 0), block);
    const ok = await pipeline.apply(`Insert doc header for "${member.name}"`);
    if (ok) {
        vscode.window.showInformationMessage(`CE: Doc header inserted for "${member.name}".`);
    }
    return ok;
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
    codeExplorer: CodeExplorerService,
    newName: string
): Promise<boolean> {
    mmxLog('[renameMember] member=' + member.name + ' -> ' + newName + ' class=' + cls.name);
    mmxLog('[renameMember] member.range: line ' + member.range.start.line + ' char ' + member.range.start.character);

    if (!newName || newName === member.name) {
        mmxLog('[renameMember] empty or same name: ' + newName);
        return false;
    }

    mmxLog('[renameMember] new name: ' + newName);

    const pipeline = new EditPipeline();
    pipeline.recordOriginal(doc.uri, doc.getText());
    const escapedName = member.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameLen = member.name.length;

    // Scan the WHOLE current document: class declaration (Pascal interface
    // header), the member implementation block (Pascal implementation section,
    // which lives OUTSIDE the class range) and every call site in the file.
    // A class-range-only scan silently missed implementations and calls.
    //
    // Same-named members of OTHER classes in this file (e.g. two classes that
    // both declare `Process`) are unrelated and must be left untouched: their
    // declaration and implementation blocks are excluded from the scan.
    const excluded: vscode.Range[] = [];
    if (provider && cls.classType !== 'standalone') {
        try {
            for (const other of provider.parseDocument(doc).classes) {
                if (other.id === cls.id || other.name === cls.name) { continue; }
                for (const m of other.members) {
                    if (m.name !== member.name) { continue; }
                    excluded.push(m.range);
                    if (m.implementationRange) { excluded.push(m.implementationRange); }
                }
            }
        } catch { /* parse failure: fall back to the unrestricted scan */ }
    }
    let totalReplacements = 0;
    for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
        if (excluded.some(r => lineNum >= r.start.line && lineNum <= r.end.line)) { continue; }
        const lineText = doc.lineAt(lineNum).text;
        const renameRegex = new RegExp('\\b' + escapedName + '\\b', 'g');
        let match;
        while ((match = renameRegex.exec(lineText)) !== null) {
            const nameRange = new vscode.Range(lineNum, match.index, lineNum, match.index + nameLen);
            pipeline.replace(doc.uri, nameRange, newName);
            totalReplacements++;
            renameRegex.lastIndex = match.index + nameLen;
        }
    }

    mmxLog('[renameMember] replaced ' + totalReplacements + ' occurrences in ' + doc.fileName);

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
            pipeline.recordOriginal(pairedUri, pairedDoc.getText());
            // Same file-wide scan as the current document: covers the qualified
            // definitions (Class::method) AND plain call sites in the paired
            // source file — not just the Class::name pattern.
            const pairedText = pairedDoc.getText();
            const renameRegex = new RegExp('\\b' + escapedName + '\\b', 'g');
            let match;
            let count = 0;
            while ((match = renameRegex.exec(pairedText)) !== null) {
                // `Other::name` belongs to a different class — leave it alone.
                const qualifier = /(\w+)\s*::\s*~?$/.exec(pairedText.substring(Math.max(0, match.index - 80), match.index));
                if (qualifier && cls.name && qualifier[1] !== cls.name) { continue; }
                const start = pairedDoc.positionAt(match.index);
                const end = pairedDoc.positionAt(match.index + nameLen);
                pipeline.replace(pairedUri, new vscode.Range(start, end), newName);
                count++;
            }
            mmxLog('[renameMember] replaced ' + count + ' occurrences in paired file');
        }
    }

    const ok = await pipeline.apply(`Rename "${member.name}"`);
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
export function extractImplBody(implText: string): string | undefined {
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
    // Python: body is everything after the `def ...:` line, indented
    const pyHeaderMatch = implText.match(/^\s*def\s+\w+\s*\([^)]*\)\s*(?:->\s*[^\n]+)?:/m);
    if (pyHeaderMatch) {
        const afterHeader = implText.indexOf('\n', pyHeaderMatch.index!) + 1;
        if (afterHeader > 0 && afterHeader < implText.length) {
            return implText.substring(afterHeader);
        }
    }
    return undefined;
}
