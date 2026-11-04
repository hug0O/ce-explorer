import * as vscode from 'vscode';
import type { ProviderRegistry } from '../providers/ProviderRegistry';
import { EditPipeline } from './EditPipeline';
import { TextEdit } from './DelphiForm';
import { DfmNode, listContainers, parseDfmTree } from './DelphiLayout';
import { ALIGN_OPS, ANCHOR_MODES, alignComponents, applyAnchorMode, planTabOrder } from './DelphiAlign';
import { FormIssue, IssueFix, checkForm, fixIssue } from './DelphiCheck';
import { CLIP_PREFIX, copyComponents, parseClip, pasteComponents, serializeClip } from './DelphiClip';
import { fieldListFromMembers, generateFormFields, parseFieldList, planChangeClass } from './DelphiGen';
import { resolveFormPair } from './FormCommands';
import { loadComponentDef } from './FormLibrary';
import { queueTextEdits } from './FormSync';
import { emptyHandlerCleanup } from './DelphiClean';

let registry: ProviderRegistry | undefined;
export function setDelphiContext(r: ProviderRegistry): void {
    registry = r;
}

interface Loaded {
    pasDoc: vscode.TextDocument;
    dfmDoc: vscode.TextDocument;
    pas: string;
    dfm: string;
    root: DfmNode;
    pair: { pas: vscode.Uri; dfm: vscode.Uri };
}

let formDoc: vscode.TextDocument | undefined;

/** Runs one of these commands on a given unit (the one a designer shows) instead of the file of the active editor. */
export async function runOnForm<T>(doc: vscode.TextDocument, run: () => Promise<T>): Promise<T> {
    formDoc = doc;
    try { return await run(); } finally { formDoc = undefined; }
}

async function load(): Promise<Loaded | undefined> {
    const doc = formDoc ?? vscode.window.activeTextEditor?.document;
    const pair = await resolveFormPair(doc);
    if (!pair) {
        vscode.window.showWarningMessage('CE: Open a Delphi unit (.pas) that has a text .dfm of the same name next to it.');
        return undefined;
    }
    const [pasDoc, dfmDoc] = await Promise.all([vscode.workspace.openTextDocument(pair.pas), vscode.workspace.openTextDocument(pair.dfm)]);
    const root = parseDfmTree(dfmDoc.getText());
    if (!root) {
        vscode.window.showWarningMessage('CE: The .dfm is not in text format (in Delphi: right-click the form → Text DFM).');
        return undefined;
    }
    return { pasDoc, dfmDoc, pas: pasDoc.getText(), dfm: dfmDoc.getText(), root, pair };
}

async function apply(l: Loaded, title: string, dfmEdits: TextEdit[], pasEdits: TextEdit[] = []): Promise<boolean> {
    if (dfmEdits.length === 0 && pasEdits.length === 0) {
        vscode.window.showInformationMessage('CE: Nothing to change.');
        return false;
    }
    const pipeline = new EditPipeline();
    pipeline.recordOriginal(l.pair.dfm, l.dfm);
    pipeline.recordOriginal(l.pair.pas, l.pas);
    queueTextEdits(pipeline, l.dfmDoc, dfmEdits);
    queueTextEdits(pipeline, l.pasDoc, pasEdits);
    return pipeline.apply(title);
}

const flatten = (n: DfmNode): DfmNode[] => [n, ...n.children.flatMap(flatten)];
const isFree = (n: DfmNode): boolean => n.align === undefined && n.left !== undefined && n.top !== undefined;

async function pickContainer(root: DfmNode, title: string, filter: (n: DfmNode) => boolean = () => true): Promise<DfmNode | undefined> {
    const items = listContainers(root).filter(c => filter(c.node)).map(c => ({ label: c.label.trim(), description: `${c.node.children.length} control(s)`, node: c.node }));
    if (items.length === 0) { vscode.window.showInformationMessage('CE: No suitable container in this form.'); return undefined; }
    return (await vscode.window.showQuickPick(items, { title, placeHolder: 'Container' }))?.node;
}

async function pickComponents(nodes: DfmNode[], title: string, preselect = false): Promise<DfmNode[] | undefined> {
    const picked = await vscode.window.showQuickPick(
        nodes.map(n => ({ label: `${'  '.repeat(Math.max(0, n.depth - 1))}${n.name}`, description: n.className, detail: n.left !== undefined ? `${n.left}, ${n.top}  ${n.width ?? '?'}×${n.height ?? '?'}${n.align ? '  ' + n.align : ''}` : n.align, picked: preselect, node: n })),
        { title, canPickMany: true, placeHolder: 'Select the components' },
    );
    return picked?.map(p => p.node);
}

/* ─────────────── layout ─────────────── */

export async function alignComponentsCommand(): Promise<void> {
    const l = await load(); if (!l) { return; }
    const container = await pickContainer(l.root, 'CE: Align components — container', n => n.children.filter(isFree).length >= 2);
    if (!container) { return; }
    const nodes = await pickComponents(container.children.filter(isFree), `CE: Align components of ${container.name}`);
    if (!nodes || nodes.length === 0) { return; }
    const op = await vscode.window.showQuickPick(ALIGN_OPS.map(o => ({ label: o.label, description: o.description, id: o.id })), { title: 'CE: Align / size / space' });
    if (!op) { return; }
    const r = alignComponents(l.dfm, nodes, op.id);
    if ('error' in r) { vscode.window.showWarningMessage('CE: ' + r.error); return; }
    if (await apply(l, `${op.label} (${nodes.length})`, r.edits)) {
        vscode.window.showInformationMessage(`CE: ${op.label}: ${r.changed.length} component(s) moved.`);
    }
}

export async function anchorsCommand(): Promise<void> {
    const l = await load(); if (!l) { return; }
    const container = await pickContainer(l.root, 'CE: Anchors / docking — container', n => n.children.length > 0);
    if (!container) { return; }
    const nodes = await pickComponents(container.children, `CE: Components of ${container.name}`, true);
    if (!nodes || nodes.length === 0) { return; }
    const mode = await vscode.window.showQuickPick(ANCHOR_MODES.map(m => ({ label: m.label, description: m.description, id: m.id })), { title: 'CE: Anchors / docking' });
    if (!mode) { return; }
    const r = applyAnchorMode(l.dfm, container, nodes, mode.id);
    if ('error' in r) { vscode.window.showWarningMessage('CE: ' + r.error); return; }
    if (await apply(l, mode.label, r.edits)) { vscode.window.showInformationMessage(`CE: ${mode.label}: ${r.changed.length} component(s) changed.`); }
}

export async function tabOrderCommand(): Promise<void> {
    const l = await load(); if (!l) { return; }
    const all = '$(list-tree) Whole form (every container)';
    const items = [{ label: all, node: undefined as DfmNode | undefined }, ...listContainers(l.root).map(c => ({ label: c.label.trim(), node: c.node as DfmNode | undefined }))];
    const pick = await vscode.window.showQuickPick(items, { title: 'CE: TabOrder by screen position' });
    if (!pick) { return; }
    const containers = pick.node ? [pick.node] : listContainers(l.root).map(c => c.node);
    const r = planTabOrder(l.dfm, containers);
    if ('error' in r) { vscode.window.showWarningMessage('CE: ' + r.error); return; }
    if (r.edits.length === 0) { vscode.window.showInformationMessage('CE: TabOrder already follows the screen.'); return; }
    if (await apply(l, 'TabOrder by position', r.edits)) { vscode.window.showInformationMessage(`CE: TabOrder renumbered for ${r.changed.length} component(s).`); }
}

/* ─────────────── checks ─────────────── */

const ICON: Record<FormIssue['severity'], string> = { error: '$(error)', warning: '$(warning)', info: '$(info)' };
const FIX_LABEL: Record<IssueFix, string> = {
    tabOrder: 'Renumber TabOrder by position', createHandler: 'Create the missing handler', removeLink: 'Remove the event link from the .dfm',
    fieldType: 'Give it the class and size of its FDATA domain', removeOrphan: 'Delete the unused empty handler', removeEmptyHandler: 'Delete the empty handler and unlink it',
};
const SAFE: IssueFix[] = ['tabOrder', 'createHandler', 'removeOrphan'];

export async function checkFormCommand(onlyCategory?: string): Promise<void> {
    const l = await load(); if (!l) { return; }
    let issues = checkForm(l.pas, l.dfm);
    if (onlyCategory) { issues = issues.filter(i => i.category === onlyCategory); }
    if (issues.length === 0) { vscode.window.showInformationMessage(`CE: ${l.root.name}: no ${onlyCategory ? onlyCategory.toLowerCase() + ' ' : ''}issue found ✓`); return; }
    const safe = issues.filter(i => i.fixes.some(f => SAFE.includes(f)));
    const items: (vscode.QuickPickItem & { issue?: FormIssue; all?: boolean })[] = [];
    if (safe.length > 0) { items.push({ label: `$(wand) Apply the ${safe.length} safe fix(es)`, description: 'TabOrder · missing handlers · unused empty handlers', all: true }); }
    items.push(...issues.map(i => ({ label: `${ICON[i.severity]} ${i.message}`, description: `${i.category} · ${i.file}:${i.line + 1}${i.fixes.length ? ' · fixable' : ''}`, issue: i })));
    const pick = await vscode.window.showQuickPick(items, { title: `CE: ${l.root.name} — ${issues.length} finding(s)`, matchOnDescription: true });
    if (!pick) { return; }

    if (pick.all) {
        const dfmEdits: TextEdit[] = [];
        const pasEdits: TextEdit[] = [];
        let applied = 0;
        const done = new Set<string>();
        for (const i of safe) {
            const fix = i.fixes.find(f => SAFE.includes(f))!;
            const key = `${fix}:${i.component ?? ''}:${i.handler ?? ''}`;
            if (done.has(key)) { continue; }
            done.add(key);
            const r = fixIssue(l.pas, l.dfm, i, fix);
            if ('error' in r) { continue; }
            dfmEdits.push(...r.dfmEdits); pasEdits.push(...r.pasEdits); applied++;
        }
        if (await apply(l, 'Fix form issues', dfmEdits, pasEdits)) { vscode.window.showInformationMessage(`CE: ${applied} fix(es) applied.`); }
        return;
    }
    const issue = pick.issue!;
    const choices = [
        { label: '$(go-to-file) Go to it', fix: undefined as IssueFix | undefined },
        ...issue.fixes.map(f => ({ label: `$(tools) ${FIX_LABEL[f]}`, fix: f as IssueFix | undefined })),
    ];
    const choice = issue.fixes.length === 0 ? choices[0] : await vscode.window.showQuickPick(choices, { title: issue.message });
    if (!choice) { return; }
    if (!choice.fix) {
        const doc = issue.file === 'dfm' ? l.dfmDoc : l.pasDoc;
        const pos = new vscode.Position(issue.line, 0);
        await vscode.window.showTextDocument(doc, { selection: new vscode.Range(pos, pos) });
        return;
    }
    const r = fixIssue(l.pas, l.dfm, issue, choice.fix);
    if ('error' in r) { vscode.window.showWarningMessage('CE: ' + r.error); return; }
    if (await apply(l, r.message, r.dfmEdits, r.pasEdits)) { vscode.window.showInformationMessage('CE: ' + r.message + '.'); }
}

export async function cleanHandlersCommand(): Promise<void> {
    await checkFormCommand('Handlers');
}

/* ─────────────── copy / paste ─────────────── */

async function unitMap(classNames: string[]): Promise<(c: string) => string> {
    const map = new Map<string, string>();
    for (const c of new Set(classNames)) { map.set(c, (await loadComponentDef(c)).unit); }
    return c => map.get(c) ?? '';
}

async function copyNames(l: Loaded, names: string[]): Promise<ReturnType<typeof copyComponents>> {
    const classes = flatten(l.root).filter(n => names.includes(n.name)).flatMap(flatten).map(n => n.className);
    return copyComponents(l.pas, l.dfm, names, await unitMap(classes));
}

export async function copyCommand(): Promise<void> {
    const l = await load(); if (!l) { return; }
    const nodes = await pickComponents(flatten(l.root).slice(1), `CE: Copy components of ${l.root.name}`);
    if (!nodes || nodes.length === 0) { return; }
    const r = await copyNames(l, nodes.map(n => n.name));
    if ('error' in r) { vscode.window.showWarningMessage('CE: ' + r.error); return; }
    await vscode.env.clipboard.writeText(serializeClip(r.payload));
    vscode.window.showInformationMessage(`CE: ${r.payload.components.length} component(s) and ${r.payload.handlers.length} handler(s) copied. Open another form and run "Paste components".`);
}

export async function pasteCommand(): Promise<void> {
    const l = await load(); if (!l) { return; }
    const clip = parseClip(await vscode.env.clipboard.readText());
    if (!clip) { vscode.window.showWarningMessage(`CE: The clipboard holds no copied components (run "Copy components" first; they start with ${CLIP_PREFIX}).`); return; }
    const target = await pickContainer(l.root, `CE: Paste ${clip.components.length} component(s) into…`);
    if (!target) { return; }
    const r = pasteComponents(l.pas, l.dfm, clip, target.depth === 0 ? undefined : target.name, clip.sourceForm === l.root.name ? 16 : 0);
    if ('error' in r) { vscode.window.showWarningMessage('CE: ' + r.error); return; }
    if (await apply(l, `Paste ${clip.components.length} component(s)`, [r.dfmEdit], r.pasEdits)) {
        const notes = [r.renamed.length ? `renamed: ${r.renamed.map(x => `${x.from}→${x.to}`).join(', ')}` : '', r.createdHandlers.length ? `${r.createdHandlers.length} handler(s) created` : ''].filter(Boolean).join(' · ');
        vscode.window.showInformationMessage(`CE: Pasted into ${target.name}${notes ? ' (' + notes + ')' : ''}.`);
    }
}

export async function duplicateCommand(): Promise<void> {
    const l = await load(); if (!l) { return; }
    const nodes = await pickComponents(flatten(l.root).slice(1), 'CE: Duplicate components');
    if (!nodes || nodes.length === 0) { return; }
    const copied = await copyNames(l, nodes.map(n => n.name));
    if ('error' in copied) { vscode.window.showWarningMessage('CE: ' + copied.error); return; }
    const parent = nodes[0].parent;
    const sameParent = nodes.every(n => n.parent === parent);
    const r = pasteComponents(l.pas, l.dfm, copied.payload, sameParent && parent && parent.depth > 0 ? parent.name : undefined, 16);
    if ('error' in r) { vscode.window.showWarningMessage('CE: ' + r.error); return; }
    if (await apply(l, 'Duplicate components', [r.dfmEdit], r.pasEdits)) {
        vscode.window.showInformationMessage(`CE: Duplicated (${r.renamed.map(x => x.to).join(', ')}).`);
    }
}

/* ─────────────── generation, class change ─────────────── */

async function generateInto(l: Loaded, input: string): Promise<void> {
    const fields = parseFieldList(input);
    const container = await pickContainer(l.root, 'CE: Generate the fields into…');
    if (!container) { return; }
    const classes = fields.map(f => ({ edit: 'TEdit', number: 'TEdit', check: 'TCheckBox', date: 'TDateTimePicker', memo: 'TMemo', combo: 'TComboBox' }[f.kind])).concat('TLabel');
    const units = await unitMap(classes);
    const r = generateFormFields(l.pas, l.dfm, fields, container.depth === 0 ? undefined : container.name, units);
    if ('error' in r) { vscode.window.showWarningMessage('CE: ' + r.error); return; }
    if (await apply(l, 'Generate form fields', [r.dfmEdit, ...r.extraDfmEdits], r.pasEdits)) {
        vscode.window.showInformationMessage(`CE: ${r.names.length} component(s) generated in ${container.name}${r.grewContainer ? `; ${r.grewContainer.name} grown to ${r.grewContainer.to}px` : ''}.`);
    }
}

export async function formFromFieldsCommand(): Promise<void> {
    const l = await load(); if (!l) { return; }
    const input = await vscode.window.showInputBox({
        title: 'CE: Form from fields',
        prompt: 'label:type separated by commas — string, integer, boolean, date, memo, list. e.g.  Nom:string, Age:integer, Actif:boolean, Date de naissance:date',
        value: 'Nom:string, Prenom:string, Actif:boolean',
        validateInput: v => (parseFieldList(v).length ? null : 'Enter at least one field'),
    });
    if (input) { await generateInto(l, input); }
}

export async function formFromClassCommand(): Promise<void> {
    const l = await load(); if (!l) { return; }
    const provider = registry?.getByDocument(l.pasDoc);
    if (!provider) { vscode.window.showWarningMessage('CE: No Pascal provider for this unit.'); return; }
    const classes = provider.parseDocument(l.pasDoc).classes.filter(c => c.name !== l.root.className && c.members.some(m => m.kind === 'field' || m.kind === 'property'));
    if (classes.length === 0) { vscode.window.showWarningMessage('CE: No class with fields in this unit (besides the form).'); return; }
    const cls = classes.length === 1 ? classes[0] : (await vscode.window.showQuickPick(classes.map(c => ({ label: c.name, description: `${c.members.filter(m => m.kind === 'field' || m.kind === 'property').length} field(s)`, c })), { title: 'CE: Form from the fields of…' }))?.c;
    if (!cls) { return; }
    const text = fieldListFromMembers(cls.members.filter(m => m.kind === 'field' || m.kind === 'property'));
    const input = await vscode.window.showInputBox({ title: `CE: Fields of ${cls.name} (edit freely)`, value: text, validateInput: v => (parseFieldList(v).length ? null : 'Enter at least one field') });
    if (input) { await generateInto(l, input); }
}

export async function changeClassCommand(): Promise<void> {
    const l = await load(); if (!l) { return; }
    const nodes = await pickComponents(flatten(l.root).slice(1), 'CE: Change the class of…');
    if (!nodes || nodes.length !== 1) { if (nodes) { vscode.window.showWarningMessage('CE: Pick exactly one component.'); } return; }
    const node = nodes[0];
    const newClass = await vscode.window.showInputBox({ title: `CE: New class for ${node.name} (now ${node.className})`, prompt: 'e.g. TBitBtn, TMemo, TcxTextEdit…', validateInput: v => (/^[A-Za-z_][\w.]*$/.test(v) ? null : 'Not a valid class name') });
    if (!newClass) { return; }
    const def = await loadComponentDef(newClass);
    let unit = def.unit;
    if (!unit) {
        const typed = await vscode.window.showInputBox({ title: `CE: Unit declaring ${newClass} (optional)`, prompt: 'Added to uses; leave empty if it is already there' });
        if (typed === undefined) { return; }
        unit = typed;
    }
    const r = planChangeClass(l.pas, l.dfm, node.name, newClass, unit || undefined);
    if ('error' in r) { vscode.window.showWarningMessage('CE: ' + r.error); return; }
    if (r.droppedProps.length || r.droppedEvents.length) {
        const ok = await vscode.window.showWarningMessage(
            `${newClass} does not support: ${[...r.droppedProps, ...r.droppedEvents].join(', ')}. They will be removed from the .dfm (handlers stay in the unit).`,
            { modal: true }, 'Change class');
        if (ok !== 'Change class') { return; }
    }
    if (await apply(l, `${node.name}: ${node.className} → ${newClass}`, r.dfmEdits, r.pasEdits)) {
        vscode.window.showInformationMessage(`CE: ${node.name} is now a ${newClass}${r.unchecked ? ' — properties were not verified (class outside the VCL catalog): compile and check the form.' : ''}.`);
    }
}

/* ─────────────── empty handlers disappear on save, like in the IDE ─────────────── */

async function cleanEmptyHandlersOnSave(doc: vscode.TextDocument): Promise<vscode.TextEdit[]> {
    const pair = await resolveFormPair(doc);
    if (!pair || pair.pas.fsPath.toLowerCase() !== doc.uri.fsPath.toLowerCase()) { return []; }
    const dfmDoc = await vscode.workspace.openTextDocument(pair.dfm);
    const plan = emptyHandlerCleanup(doc.getText(), dfmDoc.getText());
    if (!plan) { return []; }
    if (plan.dfmEdits.length > 0) {
        const wasDirty = dfmDoc.isDirty;
        const edit = new vscode.WorkspaceEdit();
        for (const e of plan.dfmEdits) {
            const start = dfmDoc.positionAt(e.offset);
            edit.replace(dfmDoc.uri, new vscode.Range(start, dfmDoc.positionAt(e.offset + (e.length ?? 0))), e.text);
        }
        if (await vscode.workspace.applyEdit(edit) && !wasDirty) { await dfmDoc.save(); }
    }
    vscode.window.showInformationMessage(`CE: ${plan.removed.length} empty event handler(s) removed: ${plan.removed.join(', ')}.`);
    return plan.pasEdits.map(e => {
        const start = doc.positionAt(e.offset);
        return e.length ? vscode.TextEdit.replace(new vscode.Range(start, doc.positionAt(e.offset + e.length)), e.text) : vscode.TextEdit.insert(start, e.text);
    });
}

/**
 * On a manual save of a form unit, handlers whose body is empty are removed
 * (method, declaration and .dfm link), exactly like the Delphi IDE does.
 * Autosave is left alone so a handler that was just created is not deleted
 * while the user is about to type in it. Setting: ce.delphi.removeEmptyHandlers.
 */
export function registerEmptyHandlerCleanup(context: vscode.ExtensionContext): void {
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(e => {
        if (e.reason !== vscode.TextDocumentSaveReason.Manual || !/\.pas$/i.test(e.document.uri.fsPath)) { return; }
        if (!vscode.workspace.getConfiguration('ce').get<boolean>('delphi.removeEmptyHandlers', true)) { return; }
        e.waitUntil(cleanEmptyHandlersOnSave(e.document).catch(() => []));
    }));
}
