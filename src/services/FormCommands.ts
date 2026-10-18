import * as vscode from 'vscode';
import { alignLines } from '../utils/alignText';
import {
    COMPONENTS, ComponentDef, EventDef, buildDfmObject, buildUnitEdits, existingNames, handlerName,
    insertIntoDfm, isValidIdentifier, nextComponentName, parseDfmRoot,
} from './DelphiForm';
import { EditPipeline } from './EditPipeline';

let lastAlignToken = ':=';

/**
 * Aligns the selected lines (or, with no selection, the contiguous block of
 * lines around the cursor that contain the token) on a user-supplied string.
 */
export async function alignSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('CE: Open a file and select the lines to align.');
        return;
    }
    const token = await vscode.window.showInputBox({
        title: 'CE: Align Selection',
        prompt: 'Text to align on (first occurrence on each line, e.g. :=  :  =  //  =>)',
        value: lastAlignToken,
        validateInput: v => (v.trim() ? null : 'Enter the text to align on'),
    });
    if (!token || !token.trim()) { return; }
    lastAlignToken = token.trim();

    const doc = editor.document;
    let startLine: number;
    let endLine: number;
    if (!editor.selection.isEmpty) {
        startLine = editor.selection.start.line;
        endLine = editor.selection.end.line;
        // A selection ending at column 0 of a line does not include that line.
        if (editor.selection.end.character === 0 && endLine > startLine) { endLine--; }
    } else {
        startLine = endLine = editor.selection.active.line;
        const has = (l: number) => doc.lineAt(l).text.includes(lastAlignToken);
        if (!has(startLine)) {
            vscode.window.showInformationMessage(`CE: The current line does not contain "${lastAlignToken}".`);
            return;
        }
        while (startLine > 0 && has(startLine - 1)) { startLine--; }
        while (endLine < doc.lineCount - 1 && has(endLine + 1)) { endLine++; }
    }

    const lines: string[] = [];
    for (let l = startLine; l <= endLine; l++) { lines.push(doc.lineAt(l).text); }
    const tabSize = typeof editor.options.tabSize === 'number' ? editor.options.tabSize : 4;
    const result = alignLines(lines, lastAlignToken, tabSize);
    if (result.aligned < 2) {
        vscode.window.showInformationMessage(`CE: Fewer than two lines contain "${lastAlignToken}" — nothing to align.`);
        return;
    }
    if (result.lines.every((l, i) => l === lines[i])) {
        vscode.window.showInformationMessage('CE: Already aligned.');
        return;
    }
    const range = new vscode.Range(startLine, 0, endLine, doc.lineAt(endLine).text.length);
    await editor.edit(b => b.replace(range, result.lines.join(doc.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n')));
}

async function exists(uri: vscode.Uri): Promise<boolean> {
    try { await vscode.workspace.fs.stat(uri); return true; } catch { return false; }
}

/** The .pas / .dfm pair of the active editor (either one may be the active file). */
async function resolveFormPair(doc: vscode.TextDocument): Promise<{ pas: vscode.Uri; dfm: vscode.Uri } | undefined> {
    const p = doc.uri.fsPath;
    const m = p.match(/^(.*)\.(pas|dfm)$/i);
    if (!m) { return undefined; }
    const pas = vscode.Uri.file(m[1] + '.pas');
    const dfmCandidates = [m[1] + '.dfm', m[1] + '.DFM'];
    for (const c of dfmCandidates) {
        const uri = vscode.Uri.file(c);
        if (await exists(uri) && await exists(pas)) { return { pas, dfm: uri }; }
    }
    return undefined;
}

/**
 * Delphi-style "drop a component on the form": adds the component to the
 * .dfm, its field and (optionally) an empty event handler to the .pas unit,
 * as a single undoable, previewable edit, then jumps into the new handler.
 */
export async function addComponent(): Promise<void> {
    const active = vscode.window.activeTextEditor?.document;
    if (!active) {
        vscode.window.showWarningMessage('CE: Open a Delphi form unit (.pas) or its .dfm first.');
        return;
    }
    const pair = await resolveFormPair(active);
    if (!pair) {
        vscode.window.showWarningMessage('CE: Add Component needs a .pas unit with a text .dfm of the same name next to it.');
        return;
    }
    const [pasDoc, dfmDoc] = await Promise.all([
        vscode.workspace.openTextDocument(pair.pas),
        vscode.workspace.openTextDocument(pair.dfm),
    ]);
    const root = parseDfmRoot(dfmDoc.getText());
    if (!root) {
        vscode.window.showWarningMessage('CE: This .dfm is not in text format (right-click it in Delphi → "Text DFM").');
        return;
    }

    const pickedDef = await vscode.window.showQuickPick(
        COMPONENTS.map(c => ({ label: c.className, description: c.unit, def: c })),
        { title: 'CE: Add Component to ' + root.name, placeHolder: 'Component class' },
    );
    if (!pickedDef) { return; }
    const def: ComponentDef = pickedDef.def;

    const used = existingNames(dfmDoc.getText(), pasDoc.getText());
    const name = await vscode.window.showInputBox({
        title: 'CE: Component name',
        value: nextComponentName(def.namePrefix, used),
        validateInput: v => !isValidIdentifier(v) ? 'Not a valid Pascal identifier'
            : used.has(v.toLowerCase()) ? 'Name already used on this form' : null,
    });
    if (!name) { return; }

    const eventItems: (vscode.QuickPickItem & { event?: EventDef })[] = [
        ...def.events.map(e => ({ label: e.name, description: handlerName(name, e.name) + '(' + e.params + ')', event: e })),
        { label: 'None', description: 'field only, no handler' },
    ];
    const pickedEvent = await vscode.window.showQuickPick(eventItems, {
        title: `CE: Event handler for ${name}`, placeHolder: 'Event to implement',
    });
    if (!pickedEvent) { return; }
    const event = pickedEvent.event;

    const unit = buildUnitEdits(pasDoc.getText(), { formClass: root.className, componentName: name, def, event });
    if (!unit) {
        vscode.window.showErrorMessage(`CE: Could not find the form class ${root.className} in ${vscode.workspace.asRelativePath(pair.pas)}.`);
        return;
    }
    const handler = event ? { event: event.name, method: handlerName(name, event.name) } : undefined;
    const dfmEdit = insertIntoDfm(dfmDoc.getText(), buildDfmObject(def, name, handler, dfmDoc.getText()));
    if (!dfmEdit) {
        vscode.window.showErrorMessage('CE: Could not find the end of the form in the .dfm.');
        return;
    }

    const pipeline = new EditPipeline();
    pipeline.recordOriginal(pair.pas, pasDoc.getText());
    pipeline.recordOriginal(pair.dfm, dfmDoc.getText());
    for (const e of unit.edits) {
        const pos = pasDoc.positionAt(e.offset);
        pipeline.insert(pair.pas, pos, e.text);
    }
    pipeline.insert(pair.dfm, dfmDoc.positionAt(dfmEdit.offset), dfmEdit.text);
    if (!await pipeline.apply(`Add ${def.className} ${name}`)) { return; }

    vscode.window.showInformationMessage(`CE: Added ${name}: ${def.className}${event ? ' with ' + handlerName(name, event.name) : ''}.`);
    if (unit.handler) {
        // Jump into the empty handler body, like double-clicking the component in Delphi.
        const doc = await vscode.workspace.openTextDocument(pair.pas);
        const text = doc.getText().split(/\r?\n/);
        const line = text.findIndex(l => l.toLowerCase().includes('procedure ' + unit.handler!.toLowerCase()));
        if (line >= 0) {
            const pos = new vscode.Position(Math.min(line + 2, doc.lineCount - 1), text[line + 2]?.length ?? 0);
            await vscode.window.showTextDocument(doc, { selection: new vscode.Range(pos, pos) });
        }
    }
}
