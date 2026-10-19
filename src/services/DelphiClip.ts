/**
 * Copy / paste / duplicate components between forms (or within one): the
 * .dfm subtree, the fields, and the event handlers with their code, renamed
 * where they would clash.
 */
import { TextEdit, applyTextEdits, existingNames, unitInsertionPoints, usesEdits } from './DelphiForm';
import { DfmNode, findNode, insertIntoNode, parseDfmTree } from './DelphiLayout';
import { readUnit } from './DelphiCheck';
import { wiredEvents } from './DelphiEvents';
import { handlerImplementation } from './DelphiSync';
import { nodeBlock, renameIdentifiers, reindentBlock } from '../utils/dfmEdit';
import { setPropEdit } from './DelphiSpacing';
import { clientSize } from './DelphiAlign';

export interface ClipHandler {
    name: string;
    params: string;
    /** The whole implementation, `procedure TForm1.X(...); begin … end;`, when it exists. */
    implementation?: string;
}

export interface ClipPayload {
    kind: 'ce-dfm-components';
    version: 1;
    sourceForm: string;
    sourceClass: string;
    /** One text per copied root component, re-indented to depth 0. */
    objects: string[];
    components: { name: string; className: string }[];
    handlers: ClipHandler[];
    /** Units needed by the copied classes (resolved by the caller). */
    units: string[];
}

export const CLIP_PREFIX = 'CE-DFM:';

export function serializeClip(p: ClipPayload): string {
    return CLIP_PREFIX + JSON.stringify(p);
}

export function parseClip(text: string): ClipPayload | undefined {
    if (!text.startsWith(CLIP_PREFIX)) { return undefined; }
    try {
        const p = JSON.parse(text.slice(CLIP_PREFIX.length)) as ClipPayload;
        return p && p.kind === 'ce-dfm-components' && p.version === 1 && Array.isArray(p.objects) ? p : undefined;
    } catch { return undefined; }
}

function allNodes(n: DfmNode): DfmNode[] { return [n, ...n.children.flatMap(allNodes)]; }

export type CopyResult = { error: string } | { payload: ClipPayload };

export function copyComponents(pas: string, dfm: string, names: string[], unitOf: (className: string) => string): CopyResult {
    const root = parseDfmTree(dfm);
    if (!root) { return { error: 'The .dfm is not in text format.' }; }
    const picked = names.map(n => findNode(root, n)).filter((n): n is DfmNode => !!n && n.depth > 0);
    if (picked.length === 0) { return { error: 'Select at least one component of the form.' }; }
    // A child selected together with its parent travels with the parent only.
    const roots = picked.filter(n => !picked.some(o => o !== n && allNodes(o).includes(n)));
    const unit = readUnit(pas, root.className);

    const components: ClipPayload['components'] = [];
    const handlers: ClipHandler[] = [];
    const units = new Set<string>();
    for (const r of roots) {
        for (const n of allNodes(r)) {
            components.push({ name: n.name, className: n.className });
            const u = unitOf(n.className);
            if (u) { units.add(u); }
            for (const handler of Object.values(wiredEvents(n))) {
                if (handlers.some(h => h.name.toLowerCase() === handler.toLowerCase())) { continue; }
                const decl = unit?.methods.find(m => m.name.toLowerCase() === handler.toLowerCase());
                const impl = unit ? handlerImplementation(pas, unit.formName, handler) : undefined;
                handlers.push({
                    name: handler, params: decl?.params ?? 'Sender: TObject',
                    implementation: impl ? pas.slice(impl.start, impl.end).replace(/\s+$/, '') : undefined,
                });
            }
        }
    }
    return {
        payload: {
            kind: 'ce-dfm-components', version: 1, sourceForm: root.name, sourceClass: unit?.formName ?? root.className,
            objects: roots.map(r => reindentBlock(nodeBlock(dfm, r).text.replace(/\s+$/, ''), r.depth, 0)),
            components, handlers, units: [...units],
        },
    };
}

function uniqueName(base: string, used: Set<string>): string {
    const stem = base.replace(/\d+$/, '');
    for (let n = (Number(base.slice(stem.length)) || 0) + 1; ; n++) {
        if (!used.has((stem + n).toLowerCase())) { return stem + n; }
    }
}

export type PasteResult = {
    error: string;
} | {
    dfmEdit: TextEdit;
    pasEdits: TextEdit[];
    renamed: { from: string; to: string }[];
    createdHandlers: string[];
    reusedHandlers: string[];
};

/** Pastes the payload into `targetName` (default: the form). `offset` shifts the roots when pasting onto the same spot. */
export function pasteComponents(pas: string, dfm: string, payload: ClipPayload, targetName?: string, offset = 16): PasteResult {
    const root = parseDfmTree(dfm);
    if (!root) { return { error: 'The .dfm is not in text format.' }; }
    const target = targetName ? findNode(root, targetName) : root;
    if (!target) { return { error: `Container "${targetName}" not found.` }; }
    const unit = readUnit(pas, root.className);
    if (!unit) { return { error: `The form class ${root.className} was not found in the unit.` }; }
    const points = unitInsertionPoints(pas, unit.formName);
    if (!points) { return { error: 'Cannot place fields in the unit.' }; }

    const used = existingNames(dfm, pas);
    const map = new Map<string, string>();
    const renamed: { from: string; to: string }[] = [];
    for (const c of payload.components) {
        let name = c.name;
        if (used.has(name.toLowerCase())) { name = uniqueName(name, used); renamed.push({ from: c.name, to: name }); }
        used.add(name.toLowerCase());
        map.set(c.name.toLowerCase(), name);
    }

    // Handlers named after a renamed component follow it; existing identical names are reused.
    const methodNames = new Set(unit.methods.map(m => m.name.toLowerCase()));
    const createdHandlers: string[] = [];
    const reusedHandlers: string[] = [];
    const handlerMap = new Map<string, string>();
    for (const h of payload.handlers) {
        let to = h.name;
        for (const r of renamed) {
            if (h.name.toLowerCase().startsWith(r.from.toLowerCase()) && h.name.length > r.from.length) { to = r.to + h.name.slice(r.from.length); break; }
        }
        if (methodNames.has(to.toLowerCase()) && to.toLowerCase() === h.name.toLowerCase()) { reusedHandlers.push(to); }
        else {
            while (methodNames.has(to.toLowerCase())) { to = uniqueName(to, methodNames); }
            createdHandlers.push(to);
            methodNames.add(to.toLowerCase());
        }
        handlerMap.set(h.name.toLowerCase(), to);
    }
    const fullMap = new Map([...map, ...handlerMap]);

    // .dfm: renamed identifiers, shifted roots, next TabOrder, indented as children of the target.
    let nextTab = target.children.reduce((m, c) => Math.max(m, c.props['TabOrder'] !== undefined ? Number(c.props['TabOrder']) + 1 : 0), 0);
    const eol = dfm.includes('\r\n') ? '\r\n' : '\n';
    const texts = payload.objects.map(obj => {
        let text = renameIdentifiers(obj, fullMap);
        const sub = parseDfmTree(text);
        if (sub) {
            const edits: TextEdit[] = [];
            // Shift the copy off the original, but never out of the container it lands in.
            const room = clientSize(target);
            const dx = room && sub.left !== undefined && (sub.width ?? 0) + sub.left + offset > room.w ? 0 : offset;
            const dy = room && sub.top !== undefined && (sub.height ?? 0) + sub.top + offset > room.h ? 0 : offset;
            const shift = sub.left !== undefined && sub.top !== undefined && (dx || dy)
                ? [dx ? setPropEdit(text, sub, 'Left', sub.left + dx) : undefined, dy ? setPropEdit(text, sub, 'Top', sub.top + dy) : undefined] : [];
            shift.forEach(e => { if (e) { edits.push(e); } });
            if (sub.props['TabOrder'] !== undefined) { const e = setPropEdit(text, sub, 'TabOrder', nextTab++); if (e) { edits.push(e); } }
            text = applyTextEdits(text, edits);
        }
        return reindentBlock(text, 0, target.depth + 1);
    });
    const dfmEdit = insertIntoNode(dfm, target, texts.join(eol) + eol);

    // .pas: fields (in the IDE-managed section), handler declarations and bodies, uses.
    const pasEdits: TextEdit[] = [];
    const comps = payload.components.map(c => `    ${map.get(c.name.toLowerCase())}: ${c.className};${points.eol}`).join('');
    const decls = payload.handlers.filter(h => createdHandlers.includes(handlerMap.get(h.name.toLowerCase())!))
        .map(h => `    procedure ${handlerMap.get(h.name.toLowerCase())}(${h.params});${points.eol}`).join('');
    if (points.fieldAt === points.procAt) { pasEdits.push({ offset: points.fieldAt, text: comps + decls }); }
    else { pasEdits.push({ offset: points.fieldAt, text: comps }); if (decls) { pasEdits.push({ offset: points.procAt, text: decls }); } }
    const bodies = payload.handlers.filter(h => createdHandlers.includes(handlerMap.get(h.name.toLowerCase())!)).map(h => {
        const to = handlerMap.get(h.name.toLowerCase())!;
        if (h.implementation) {
            const code = renameIdentifiers(h.implementation, fullMap).replace(new RegExp('\\b' + payload.sourceClass + '\\.', 'g'), unit.formName + '.')
                .replace(new RegExp('(procedure\\s+' + unit.formName + '\\.)' + h.name + '\\b', 'i'), '$1' + to);
            return code.replace(/\r?\n/g, points.eol) + points.eol + points.eol;
        }
        return `procedure ${unit.formName}.${to}(${h.params});${points.eol}begin${points.eol}  ${points.eol}end;${points.eol}${points.eol}`;
    }).join('');
    if (bodies) { pasEdits.push({ offset: points.implAt, text: bodies }); }
    pasEdits.push(...usesEdits(pas, payload.units));

    return { dfmEdit, pasEdits, renamed, createdHandlers, reusedHandlers };
}
