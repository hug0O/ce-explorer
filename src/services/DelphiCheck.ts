/**
 * Consistency checks between a form's .dfm and its .pas unit, and the fixes
 * that can be applied automatically (missing handlers, orphan handlers,
 * duplicate TabOrder).
 */
import { TextEdit, eventDefFor, eventDefOf, findFormClass, resolveComponentDef, unitInsertionPoints } from './DelphiForm';
import { DfmNode, findNode, parseDfmTree } from './DelphiLayout';
import { handlerImplementation } from './DelphiSync';
import { wiredEvents } from './DelphiEvents';
import { planTabOrder } from './DelphiAlign';
import { deleteProp, lineStartOffsets } from '../utils/dfmEdit';

export type IssueFix = 'tabOrder' | 'createHandler' | 'removeLink' | 'removeOrphan' | 'removeEmptyHandler';

export interface FormIssue {
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    file: 'dfm' | 'pas';
    line: number;
    component?: string;
    event?: string;
    handler?: string;
    fixes: IssueFix[];
}

interface UnitInfo {
    formName: string;
    fields: { name: string; type: string; line: number; ideManaged: boolean }[];
    methods: { name: string; params: string; line: number; ideManaged: boolean }[];
}

/** Fields and procedures declared in the form class of the unit. */
export function readUnit(pas: string, formClass: string): UnitInfo | undefined {
    const form = findFormClass(pas, formClass);
    if (!form) { return undefined; }
    const lines = pas.split(/\r?\n/);
    const info: UnitInfo = { formName: form.name, fields: [], methods: [] };
    let managed = true;
    for (let i = form.startLine + 1; i < lines.length; i++) {
        const l = lines[i];
        if (/^\s*end\s*;/i.test(l)) { break; }
        if (/^\s*(strict\s+)?(private|protected|public|published)\b/i.test(l)) { managed = false; continue; }
        const f = l.match(/^\s*(\w+(?:\s*,\s*\w+)*)\s*:\s*([\w.]+)\s*;/);
        if (f) { for (const n of f[1].split(',')) { info.fields.push({ name: n.trim(), type: f[2], line: i, ideManaged: managed }); } continue; }
        const m = l.match(/^\s*(?:procedure|function)\s+(\w+)\s*(?:\(([^)]*)\))?/i);
        if (m) { info.methods.push({ name: m[1], params: m[2] ?? '', line: i, ideManaged: managed }); }
    }
    return info;
}

function allNodes(root: DfmNode): DfmNode[] {
    return [root, ...root.children.flatMap(allNodes)];
}

const DECOR = /(Shape|Bevel|Image|Splitter|Label)$/i;

function clientOf(n: DfmNode): { w: number; h: number } | undefined {
    const num = (v: string | undefined) => (v !== undefined && /^\d+$/.test(v) ? Number(v) : undefined);
    const w = num(n.props['ClientWidth']) ?? n.width;
    const h = num(n.props['ClientHeight']) ?? n.height;
    return w !== undefined && h !== undefined ? { w, h } : undefined;
}

export function checkForm(pas: string, dfm: string): FormIssue[] {
    const root = parseDfmTree(dfm);
    if (!root) { return []; }
    const issues: FormIssue[] = [];
    const unit = readUnit(pas, root.className);
    const nodes = allNodes(root);

    // Duplicate component names.
    const seen = new Map<string, DfmNode>();
    for (const n of nodes) {
        const key = n.name.toLowerCase();
        if (seen.has(key)) {
            issues.push({ severity: 'error', category: 'Names', message: `The name "${n.name}" is used by two components`, file: 'dfm', line: n.startLine, component: n.name, fixes: [] });
        }
        seen.set(key, n);
    }

    if (unit) {
        const fieldByName = new Map(unit.fields.map(f => [f.name.toLowerCase(), f]));
        for (const n of nodes.slice(1)) {
            const f = fieldByName.get(n.name.toLowerCase());
            if (!f) {
                issues.push({ severity: 'info', category: 'Fields', message: `${n.name}: ${n.className} has no field in ${unit.formName}: it cannot be used from code`, file: 'dfm', line: n.startLine, component: n.name, fixes: [] });
            } else if (f.type.toLowerCase() !== n.className.toLowerCase()) {
                issues.push({ severity: 'error', category: 'Fields', message: `${n.name} is a ${n.className} in the .dfm but declared as ${f.type} in the unit`, file: 'pas', line: f.line, component: n.name, fixes: [] });
            }
        }
        for (const f of unit.fields) {
            if (f.ideManaged && !seen.has(f.name.toLowerCase()) && /^T[A-Z]/.test(f.type)) {
                issues.push({ severity: 'warning', category: 'Fields', message: `Field ${f.name}: ${f.type} has no component in the .dfm: it stays nil at runtime`, file: 'pas', line: f.line, component: f.name, fixes: [] });
            }
        }

        // Event links and handlers.
        const methodByName = new Map(unit.methods.map(m => [m.name.toLowerCase(), m]));
        const linked = new Set<string>();
        for (const n of nodes) {
            for (const [event, handler] of Object.entries(wiredEvents(n))) {
                linked.add(handler.toLowerCase());
                const line = n.propLines[event] ?? n.startLine;
                if (!methodByName.has(handler.toLowerCase())) {
                    issues.push({ severity: 'error', category: 'Handlers', message: `${n.name}.${event} points to ${handler}, which does not exist in the unit (the form will not load)`, file: 'dfm', line, component: n.name, event, handler, fixes: ['createHandler', 'removeLink'] });
                } else {
                    const impl = handlerImplementation(pas, unit.formName, handler);
                    if (impl && impl.empty) {
                        issues.push({ severity: 'info', category: 'Handlers', message: `${handler} (${n.name}.${event}) is empty`, file: 'pas', line: methodByName.get(handler.toLowerCase())!.line, component: n.name, event, handler, fixes: ['removeEmptyHandler'] });
                    }
                }
            }
        }
        for (const m of unit.methods) {
            if (!m.ideManaged || linked.has(m.name.toLowerCase())) { continue; }
            if (!/Sender\s*:\s*TObject/i.test(m.params)) { continue; }
            const uses = (pas.match(new RegExp('(?<![\\w$#.])' + m.name + '(?![\\w$#])', 'gi')) ?? []).length;
            const impl = handlerImplementation(pas, unit.formName, m.name);
            if (uses <= 2) { // declaration + implementation header only
                issues.push({ severity: 'info', category: 'Handlers', message: `${m.name} is not linked to any event and never called${impl && impl.empty ? ' (empty)' : ''}`, file: 'pas', line: m.line, handler: m.name, fixes: impl && impl.empty ? ['removeOrphan'] : [] });
            }
        }
    }

    // Duplicate TabOrder, controls outside their container, overlaps.
    for (const c of nodes) {
        const stops = c.children.filter(k => k.props['TabOrder'] !== undefined);
        const byOrder = new Map<string, DfmNode[]>();
        stops.forEach(k => byOrder.set(k.props['TabOrder'], [...(byOrder.get(k.props['TabOrder']) ?? []), k]));
        for (const [order, list] of byOrder) {
            if (list.length > 1) {
                issues.push({ severity: 'info', category: 'TabOrder', message: `TabOrder ${order} is shared by ${list.map(k => k.name).join(', ')} in ${c.name}`, file: 'dfm', line: list[1].propLines['TabOrder'] ?? list[1].startLine, component: c.name, fixes: ['tabOrder'] });
            }
        }
        const free = c.children.filter(k => k.align === undefined && k.left !== undefined && k.top !== undefined && k.width !== undefined && k.height !== undefined);
        const size = clientOf(c);
        if (size && !/ScrollBox|PageControl|TabSheet/i.test(c.className)) {
            for (const k of free) {
                if (k.left! < 0 || k.top! < 0 || k.left! + k.width! > size.w + 1 || k.top! + k.height! > size.h + 1) {
                    issues.push({ severity: 'warning', category: 'Layout', message: `${k.name} extends beyond ${c.name} (${k.left},${k.top} ${k.width}×${k.height} in ${size.w}×${size.h}): part of it is hidden`, file: 'dfm', line: k.startLine, component: k.name, fixes: [] });
                }
            }
        }
        for (let i = 0; i < free.length; i++) {
            for (let j = i + 1; j < free.length; j++) {
                const a = free[i];
                const b = free[j];
                if (a.children.length || b.children.length || DECOR.test(a.className) || DECOR.test(b.className)) { continue; }
                const w = Math.min(a.left! + a.width!, b.left! + b.width!) - Math.max(a.left!, b.left!);
                const h = Math.min(a.top! + a.height!, b.top! + b.height!) - Math.max(a.top!, b.top!);
                if (w > 0 && h > 0 && w * h > 0.5 * Math.min(a.width! * a.height!, b.width! * b.height!)) {
                    issues.push({ severity: 'info', category: 'Layout', message: `${a.name} and ${b.name} overlap`, file: 'dfm', line: b.startLine, component: b.name, fixes: [] });
                }
            }
        }
    }
    return issues;
}

export interface FixResult { pasEdits: TextEdit[]; dfmEdits: TextEdit[]; message: string }

/** Edits for one automatic fix (or an error message). */
export function fixIssue(pas: string, dfm: string, issue: FormIssue, fix: IssueFix): FixResult | { error: string } {
    const root = parseDfmTree(dfm);
    if (!root) { return { error: 'The .dfm is not in text format.' }; }
    const unit = readUnit(pas, root.className);
    const none: FixResult = { pasEdits: [], dfmEdits: [], message: '' };

    if (fix === 'tabOrder') {
        const container = issue.component ? findNode(root, issue.component) : undefined;
        if (!container) { return { error: 'Container not found.' }; }
        const plan = planTabOrder(dfm, [container]);
        if ('error' in plan) { return { error: plan.error }; }
        return { ...none, dfmEdits: plan.edits, message: `TabOrder of ${container.name} set by screen position` };
    }
    if (!unit) { return { error: 'The form class was not found in the unit.' }; }

    if (fix === 'removeLink') {
        const node = issue.component ? findNode(root, issue.component) : undefined;
        const e = node && issue.event ? deleteProp(dfm, node, issue.event) : undefined;
        return e ? { ...none, dfmEdits: [e], message: `${issue.event} unlinked` } : { error: 'Link not found.' };
    }
    if (fix === 'createHandler') {
        const points = unitInsertionPoints(pas, unit.formName);
        if (!points || !issue.handler || !issue.event) { return { error: 'Cannot place the handler.' }; }
        const owner = issue.component ? findNode(root, issue.component) : undefined;
        const params = (owner ? eventDefOf(resolveComponentDef(owner.className), issue.event) : eventDefFor(issue.event)).params;
        return {
            ...none,
            pasEdits: [
                { offset: points.procAt, text: `    procedure ${issue.handler}(${params});${points.eol}` },
                { offset: points.implAt, text: `procedure ${unit.formName}.${issue.handler}(${params});${points.eol}begin${points.eol}  ${points.eol}end;${points.eol}${points.eol}` },
            ],
            message: `${issue.handler} created`,
        };
    }
    if (fix === 'removeOrphan' || fix === 'removeEmptyHandler') {
        const handler = issue.handler;
        if (!handler) { return { error: 'Handler not found.' }; }
        const impl = handlerImplementation(pas, unit.formName, handler);
        if (!impl || !impl.empty) { return { error: `${handler} contains code: not removed.` }; }
        const starts = lineOffsets(pas);
        const lines = pas.split('\n');
        const di = lines.findIndex(l => new RegExp('^[ \\t]*procedure\\s+' + handler + '\\s*\\(', 'i').test(l));
        const pasEdits: TextEdit[] = [{ offset: impl.start, length: impl.end - impl.start, text: '' }];
        if (di >= 0) { pasEdits.push({ offset: starts[di], length: (starts[di + 1] ?? pas.length) - starts[di], text: '' }); }
        const dfmEdits: TextEdit[] = [];
        if (fix === 'removeEmptyHandler') {
            for (const n of allNodes(root)) {
                for (const [event, value] of Object.entries(wiredEvents(n))) {
                    if (value.toLowerCase() === handler.toLowerCase()) { const e = deleteProp(dfm, n, event); if (e) { dfmEdits.push(e); } }
                }
            }
        }
        return { pasEdits, dfmEdits, message: `${handler} removed` };
    }
    return { error: 'Unknown fix.' };
}

const lineOffsets = lineStartOffsets;
