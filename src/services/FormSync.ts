import * as vscode from 'vscode';
import { TextEdit } from './DelphiForm';
import { findNode, parseDfmTree } from './DelphiLayout';
import { planDfmDelete, planDfmRename } from './DelphiSync';
import { EditPipeline } from './EditPipeline';
import { addComponentToForm, resolveFormPair } from './FormCommands';
import { isKnownComponentClass } from './FormLibrary';
import type { ClassMember } from '../models/types';

/** Queues offset edits of `doc` on the pipeline (inserts and in-place replacements alike). */
export function queueTextEdits(pipeline: EditPipeline, doc: vscode.TextDocument, edits: TextEdit[]): void {
    for (const e of edits) {
        const start = doc.positionAt(e.offset);
        if (e.length) {
            pipeline.replace(doc.uri, new vscode.Range(start, doc.positionAt(e.offset + e.length)), e.text);
        } else {
            pipeline.insert(doc.uri, start, e.text);
        }
    }
}

async function openPair(doc: vscode.TextDocument | undefined) {
    const pair = await resolveFormPair(doc);
    if (!pair) { return undefined; }
    const [pasDoc, dfmDoc] = await Promise.all([vscode.workspace.openTextDocument(pair.pas), vscode.workspace.openTextDocument(pair.dfm)]);
    return { pair, pasDoc, dfmDoc };
}

/**
 * Renaming a component field of a form unit: queue, on the SAME pipeline as the
 * unit's own rename, the matching .dfm edits and the handler renames.
 * Returns an error message when the rename must be refused, otherwise undefined.
 */
export async function queueDfmRename(pipeline: EditPipeline, doc: vscode.TextDocument, member: ClassMember, newName: string): Promise<string | undefined> {
    if (!/\.pas$/i.test(doc.uri.fsPath) || member.kind !== 'field') { return undefined; }
    try {
        const opened = await openPair(doc);
        if (!opened) { return undefined; }
        const plan = planDfmRename(doc.getText(), opened.dfmDoc.getText(), member.name, newName);
        if (!plan) { return undefined; }
        if ('error' in plan) { return plan.error; }
        pipeline.recordOriginal(opened.pair.dfm, opened.dfmDoc.getText());
        queueTextEdits(pipeline, opened.dfmDoc, plan.dfmEdits);
        queueTextEdits(pipeline, doc, plan.pasEdits);
        return undefined;
    } catch {
        return undefined;
    }
}

/** After a component field was deleted from a form unit: remove its object (and children, empty handlers) from the .dfm. */
export async function syncFormAfterDelete(doc: vscode.TextDocument, formClass: string, member: ClassMember): Promise<void> {
    if (!/\.pas$/i.test(doc.uri.fsPath) || member.kind !== 'field') { return; }
    try {
        const opened = await openPair(doc);
        if (!opened) { return; }
        const plan = planDfmDelete(doc.getText(), opened.dfmDoc.getText(), member.name, formClass);
        if (!plan) { return; }
        const pipeline = new EditPipeline();
        pipeline.recordOriginal(opened.pair.dfm, opened.dfmDoc.getText());
        pipeline.recordOriginal(doc.uri, doc.getText());
        queueTextEdits(pipeline, opened.dfmDoc, plan.dfmEdits);
        queueTextEdits(pipeline, doc, plan.pasEdits);
        if (!await pipeline.apply(`Remove ${member.name} from the .dfm`)) { return; }
        const extra = [
            plan.removedComponents.length ? `${plan.removedComponents.length} child component(s)` : '',
            plan.removedHandlers.length ? `empty handler(s) ${plan.removedHandlers.join(', ')}` : '',
        ].filter(Boolean).join(', ');
        vscode.window.showInformationMessage(`CE: ${member.name} removed from the .dfm${extra ? ' (+ ' + extra + ')' : ''}.`);
        if (plan.keptHandlers.length) {
            vscode.window.showWarningMessage(`CE: handler(s) ${plan.keptHandlers.join(', ')} kept (they contain code or are shared).`);
        }
    } catch {
        // No .dfm pair or unreadable: nothing to synchronise.
    }
}

/** After a field of a known component class was added to a form unit by hand: offer to create the object in the .dfm. */
export async function offerDfmForNewField(doc: vscode.TextDocument, name: string, type: string | undefined): Promise<void> {
    if (!type || !/\.pas$/i.test(doc.uri.fsPath) || !/^T\w/.test(type)) { return; }
    try {
        const pair = await resolveFormPair(doc);
        if (!pair) { return; }
        const dfm = parseDfmTree((await vscode.workspace.openTextDocument(pair.dfm)).getText());
        if (!dfm || findNode(dfm, name)) { return; }
        if (!await isKnownComponentClass(type)) { return; }
        const choice = await vscode.window.showInformationMessage(`CE: "${name}: ${type}" is a component. Also add it to the .dfm?`, 'Add to .dfm', 'No');
        if (choice !== 'Add to .dfm') { return; }
        await addComponentToForm(doc, { className: type, name, side: 'auto', fieldExists: true });
    } catch {
        // Not a form unit.
    }
}
