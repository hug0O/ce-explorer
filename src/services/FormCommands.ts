import * as vscode from 'vscode';
import { alignLines } from '../utils/alignText';
import { COMPONENTS, eventDefOf, handlerName, nextComponentName, resolveComponentDef, existingNames } from './DelphiForm';
import {
    AddComponentRequest, Side, listContainers, parseDfmTree, planAddComponent,
} from './DelphiLayout';
import { EditPipeline } from './EditPipeline';
import { loadComponentDef, rememberClassUnit } from './FormLibrary';
import { eventsForClass, planAddEvent, wiredEvents } from './DelphiEvents';
import type { DfmNode } from './DelphiLayout';

let lastAlignToken = ':=';

export function getLastAlignToken(): string {
    return lastAlignToken;
}

/**
 * Aligns the selected lines (or, with no selection, the contiguous block of
 * lines around the cursor that contain the token) on a string. The token comes
 * from the sidebar form; when called without one (command palette) it is asked
 * for in an input box.
 */
export async function alignSelection(tokenArg?: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('CE: Open a file and select the lines to align.');
        return;
    }
    let token = typeof tokenArg === 'string' ? tokenArg : undefined;
    if (token === undefined) {
        token = await vscode.window.showInputBox({
            title: 'CE: Align Selection',
            prompt: 'Text to align on (first occurrence on each line, e.g. :=  :  =  //  =>)',
            value: lastAlignToken,
            validateInput: v => (v.trim() ? null : 'Enter the text to align on'),
        });
    }
    if (!token || !token.trim()) {
        if (token !== undefined) { vscode.window.showInformationMessage('CE: Enter the text to align on.'); }
        return;
    }
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

export interface FormPair { pas: vscode.Uri; dfm: vscode.Uri }

/** The .pas / .dfm pair of a document (either one may be the active file). */
export async function resolveFormPair(doc: vscode.TextDocument | undefined): Promise<FormPair | undefined> {
    if (!doc) { return undefined; }
    const m = doc.uri.fsPath.match(/^(.*)\.(pas|dfm)$/i);
    if (!m) { return undefined; }
    const pas = vscode.Uri.file(m[1] + '.pas');
    const dfm = vscode.Uri.file(m[1] + '.dfm');
    return (await exists(pas)) && (await exists(dfm)) ? { pas, dfm } : undefined;
}

export interface ClassInfoReply {
    className: string;
    unit: string;
    events: string[];
    width?: number;
    height?: number;
    /** Where the definition came from, for the sidebar hint. */
    source: 'catalog' | 'setting' | 'project' | 'generic';
}

export interface FormModel {
    ok: boolean;
    reason?: string;
    formName?: string;
    /** Known component classes offered as suggestions (free text is accepted too). */
    classes: { className: string; unit: string; events: string[]; prefix: string }[];
    /** Containers (form, panels…) with their direct children. */
    containers: { name: string; label: string; children: { name: string; label: string }[] }[];
    /** Every component of the form (and the form itself) with its candidate events. */
    components: { name: string; label: string; events: string[]; wired: Record<string, string> }[];
}

function flattenNodes(root: DfmNode): DfmNode[] {
    return [root, ...root.children.flatMap(flattenNodes)];
}

const CLASS_SUGGESTIONS = COMPONENTS.map(c => ({
    className: c.className, unit: c.unit, prefix: c.namePrefix, events: c.events.map(e => e.name),
}));

/** What the sidebar form needs to know about the active Delphi form (or why it is unavailable). */
export async function buildFormModel(doc: vscode.TextDocument | undefined): Promise<FormModel> {
    const none = (reason: string): FormModel => ({ ok: false, reason, classes: CLASS_SUGGESTIONS, containers: [], components: [] });
    const pair = await resolveFormPair(doc);
    if (!pair) { return none('Open a Delphi unit (.pas) that has a .dfm of the same name next to it.'); }
    const dfm = (await vscode.workspace.openTextDocument(pair.dfm)).getText();
    const root = parseDfmTree(dfm);
    if (!root) { return none('The .dfm is not in text format (in Delphi: right-click the form → Text DFM).'); }
    return {
        ok: true,
        formName: root.name,
        classes: CLASS_SUGGESTIONS,
        components: flattenNodes(root).map(n => ({
            name: n.name,
            label: `${'  '.repeat(n.depth)}${n.name}: ${n.className}`,
            events: eventsForClass(n.className, n.depth === 0),
            wired: wiredEvents(n),
        })),
        containers: listContainers(root).map(c => ({
            name: c.node.name,
            label: c.label,
            children: c.node.children.map(k => ({ name: k.name, label: `${k.name}: ${k.className}` })),
        })),
    };
}

/** Name proposed for a new component of `className` (first free Button1, Edit2…). */
export async function suggestComponentName(doc: vscode.TextDocument | undefined, className: string): Promise<string> {
    const pair = await resolveFormPair(doc);
    const def = resolveComponentDef(className);
    if (!pair) { return def.namePrefix + '1'; }
    const [pas, dfm] = await Promise.all([vscode.workspace.openTextDocument(pair.pas), vscode.workspace.openTextDocument(pair.dfm)]);
    return nextComponentName(def.namePrefix, existingNames(dfm.getText(), pas.getText()));
}

/**
 * Drops a component on the form of the active unit: .dfm object (inside the
 * chosen container, placed against the chosen sibling), .pas field + handler +
 * uses, as one previewable, undoable edit; then jumps into the new handler.
 */
export async function addComponentToForm(doc: vscode.TextDocument | undefined, req: AddComponentRequest): Promise<boolean> {
    const pair = await resolveFormPair(doc);
    if (!pair) {
        vscode.window.showWarningMessage('CE: Add Component needs a .pas unit with a text .dfm of the same name next to it.');
        return false;
    }
    const [pasDoc, dfmDoc] = await Promise.all([
        vscode.workspace.openTextDocument(pair.pas),
        vscode.workspace.openTextDocument(pair.dfm),
    ]);
    const def = req.def ?? await loadComponentDef(req.className, req.unit);
    const plan = planAddComponent(pasDoc.getText(), dfmDoc.getText(), { ...req, def });
    if ('error' in plan) {
        vscode.window.showErrorMessage('CE: ' + plan.error);
        return false;
    }

    const pipeline = new EditPipeline();
    pipeline.recordOriginal(pair.pas, pasDoc.getText());
    pipeline.recordOriginal(pair.dfm, dfmDoc.getText());
    for (const e of plan.pasEdits) { pipeline.insert(pair.pas, pasDoc.positionAt(e.offset), e.text); }
    pipeline.insert(pair.dfm, dfmDoc.positionAt(plan.dfmEdit.offset), plan.dfmEdit.text);
    if (!await pipeline.apply(`Add ${req.className} ${req.name}`)) { return false; }
    if (req.unit && req.unit.trim()) { await rememberClassUnit(req.className, req.unit); }

    const where = req.refName ? ` (${req.side} of ${req.refName})` : '';
    vscode.window.showInformationMessage(`CE: Added ${req.name}: ${req.className}${where}.`);
    if (plan.handler) {
        // Jump into the empty handler body, like double-clicking the component in Delphi.
        const doc2 = await vscode.workspace.openTextDocument(pair.pas);
        const text = doc2.getText().split(/\r?\n/);
        const line = text.findIndex(l => l.toLowerCase().includes('procedure ' + plan.handler!.toLowerCase()));
        if (line >= 0) {
            const row = Math.min(line + 2, doc2.lineCount - 1);
            const pos = new vscode.Position(row, text[row]?.length ?? 0);
            await vscode.window.showTextDocument(doc2, { selection: new vscode.Range(pos, pos) });
        }
    }
    return true;
}

/** Command-palette flow (the sidebar form is the primary UI): a chain of quick picks. */
export async function addComponent(): Promise<void> {
    const doc = vscode.window.activeTextEditor?.document;
    const model = await buildFormModel(doc);
    if (!model.ok) {
        vscode.window.showWarningMessage('CE: ' + model.reason);
        return;
    }

    const OTHER = '$(add) Other class…';
    const classPick = await vscode.window.showQuickPick(
        [...model.classes.map(c => ({ label: c.className, description: c.unit })), { label: OTHER, description: 'any class, e.g. TSpinEdit' }],
        { title: 'CE: Add Component to ' + model.formName, placeHolder: 'Component class' },
    );
    if (!classPick) { return; }
    let className = classPick.label;
    let unit: string | undefined;
    if (className === OTHER) {
        const typed = await vscode.window.showInputBox({ title: 'CE: Class name', prompt: 'Any component class, e.g. TSpinEdit', validateInput: v => /^[A-Za-z_][\w.]*$/.test(v) ? null : 'Not a valid class name' });
        if (!typed) { return; }
        className = typed;
        unit = await vscode.window.showInputBox({ title: 'CE: Unit for uses (optional)', prompt: 'e.g. Samples.Spin — leave empty if already in uses' });
        if (unit === undefined) { return; }
    }

    const name = await vscode.window.showInputBox({
        title: 'CE: Component name',
        value: await suggestComponentName(doc, className),
        validateInput: v => /^[A-Za-z_][A-Za-z0-9_]*$/.test(v) ? null : 'Not a valid Pascal identifier',
    });
    if (!name) { return; }

    const def = resolveComponentDef(className, unit);
    const eventPick = await vscode.window.showQuickPick(
        [...def.events.map(e => ({ label: e.name, description: handlerName(name, e.name) + '(' + eventDefOf(def, e.name).params + ')' })), { label: 'None', description: 'field only, no handler' }],
        { title: `CE: Event handler for ${name}` },
    );
    if (!eventPick) { return; }

    const parentPick = await vscode.window.showQuickPick(
        model.containers.map(c => ({ label: c.label.trim(), description: c.children.length + ' control(s)', c })),
        { title: 'CE: Place inside…' },
    );
    if (!parentPick) { return; }
    const refPick = await vscode.window.showQuickPick(
        [{ label: 'Automatic (below the others)', ref: undefined as string | undefined }, ...parentPick.c.children.map(k => ({ label: k.label, ref: k.name as string | undefined }))],
        { title: 'CE: Position relative to…' },
    );
    if (!refPick) { return; }
    let side: Side = 'auto';
    if (refPick.ref) {
        const sidePick = await vscode.window.showQuickPick(
            (['right', 'below', 'left', 'above'] as Side[]).map(s => ({ label: s, description: `${s} of ${refPick.ref}` })),
            { title: `CE: Place ${name}…` },
        );
        if (!sidePick) { return; }
        side = sidePick.label as Side;
    }

    await addComponentToForm(doc, {
        className, unit, name,
        eventName: eventPick.label === 'None' ? undefined : eventPick.label,
        parentName: parentPick.c.name, refName: refPick.ref, side,
    });
}

/**
 * Creates (or reaches) the handler of an event on an EXISTING component:
 * links it in the .dfm, declares + stubs it in the .pas, then jumps into it.
 */
export async function addEventToComponent(doc: vscode.TextDocument | undefined, componentName: string, eventName: string, viewColumn?: vscode.ViewColumn): Promise<boolean> {
    const pair = await resolveFormPair(doc);
    if (!pair) {
        vscode.window.showWarningMessage('CE: Add Event needs a .pas unit with a text .dfm of the same name next to it.');
        return false;
    }
    const [pasDoc, dfmDoc] = await Promise.all([
        vscode.workspace.openTextDocument(pair.pas),
        vscode.workspace.openTextDocument(pair.dfm),
    ]);
    const plan = planAddEvent(pasDoc.getText(), dfmDoc.getText(), { componentName, eventName });
    if ('error' in plan) {
        vscode.window.showErrorMessage('CE: ' + plan.error);
        return false;
    }
    if (!plan.alreadyWired) {
        const pipeline = new EditPipeline();
        pipeline.recordOriginal(pair.pas, pasDoc.getText());
        pipeline.recordOriginal(pair.dfm, dfmDoc.getText());
        for (const e of plan.pasEdits) { pipeline.insert(pair.pas, pasDoc.positionAt(e.offset), e.text); }
        if (plan.dfmEdit) { pipeline.insert(pair.dfm, dfmDoc.positionAt(plan.dfmEdit.offset), plan.dfmEdit.text); }
        if (!await pipeline.apply(`Add ${eventName} handler to ${componentName}`)) { return false; }
        vscode.window.showInformationMessage(`CE: ${componentName}.${eventName} → ${plan.handler.split('.').pop()}`);
    } else {
        vscode.window.showInformationMessage(`CE: ${componentName}.${eventName} already points to ${plan.handler.split('.').pop()} — opening it.`);
    }

    const doc2 = await vscode.workspace.openTextDocument(pair.pas);
    const text = doc2.getText().split(/\r?\n/);
    const line = text.findIndex(l => l.toLowerCase().includes('procedure ' + plan.handler.toLowerCase()));
    if (line >= 0) {
        const row = Math.min(line + 2, doc2.lineCount - 1);
        const pos = new vscode.Position(row, text[row]?.length ?? 0);
        await vscode.window.showTextDocument(doc2, { selection: new vscode.Range(pos, pos), viewColumn });
    }
    return true;
}

/** Command-palette flow: pick a component of the form, then one of its events. */
export async function addEventHandler(): Promise<void> {
    const doc = vscode.window.activeTextEditor?.document;
    const model = await buildFormModel(doc);
    if (!model.ok) {
        vscode.window.showWarningMessage('CE: ' + model.reason);
        return;
    }
    const comp = await vscode.window.showQuickPick(
        model.components.map(c => ({ label: c.label.trim(), description: Object.keys(c.wired).length ? Object.keys(c.wired).join(', ') + ' wired' : '', c })),
        { title: 'CE: Add Event Handler — component', matchOnDescription: true },
    );
    if (!comp) { return; }
    const ev = await vscode.window.showQuickPick(
        comp.c.events.map(e => ({ label: e, description: comp.c.wired[e] ? '→ ' + comp.c.wired[e] + ' (open)' : 'new handler' })),
        { title: `CE: Event of ${comp.c.name}` },
    );
    if (!ev) { return; }
    await addEventToComponent(doc, comp.c.name, ev.label);
}

/** What the sidebar shows for a class typed by the user: unit, events, size (catalog, settings, project usage). */
export async function describeClass(className: string): Promise<ClassInfoReply> {
    const def = await loadComponentDef(className);
    const inCatalog = COMPONENTS.some(c => c.className.toLowerCase() === className.toLowerCase());
    const custom = vscode.workspace.getConfiguration('mmx').get<Array<{ className?: string }>>('delphi.customComponents') ?? [];
    const inSetting = custom.some(c => (c.className ?? '').toLowerCase() === className.toLowerCase());
    const isGeneric = !inCatalog && !inSetting && def.events.length === 2 && def.events[0].name === 'OnClick' && def.width === 75 && def.height === 25;
    return {
        className, unit: def.unit, events: def.events.map(e => e.name), width: def.width, height: def.height,
        source: inCatalog ? 'catalog' : inSetting ? 'setting' : isGeneric ? 'generic' : 'project',
    };
}
