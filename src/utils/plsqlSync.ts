/**
 * Package spec / body synchronisation: finds subprograms that exist on one
 * side only, or whose signatures differ (Oracle requires the two to match
 * exactly), and builds the offset edits to fix either side.
 */
import { PlMember, PlUnit, parsePlSqlUnits } from './plsqlParse';

export interface TextChange {
    offset: number;
    /** Characters replaced (0 = pure insertion). */
    length: number;
    text: string;
}

export type SyncKind = 'missingInSpec' | 'missingInBody' | 'signatureMismatch';

export interface SyncDiff {
    id: string;
    kind: SyncKind;
    name: string;
    message: string;
    spec?: PlMember;
    body?: PlMember;
}

export interface PackagePair {
    spec: PlUnit;
    body: PlUnit;
}

const bare = (name: string): string => name.replace(/"/g, '').split('.').pop()!.toLowerCase();

/** Spec and body units of the same package, searched in one or two texts. */
export function findPair(specText: string, bodyText: string, preferredName?: string): { specUnit?: PlUnit; bodyUnit?: PlUnit } {
    const specs = parsePlSqlUnits(specText).filter(u => u.kind === 'package');
    const bodies = parsePlSqlUnits(bodyText).filter(u => u.kind === 'package body');
    const pick = (units: PlUnit[], name?: string): PlUnit | undefined =>
        (name ? units.find(u => bare(u.name) === name) : undefined) ?? units[0];
    const wanted = preferredName ? bare(preferredName) : (specs[0] ? bare(specs[0].name) : bodies[0] ? bare(bodies[0].name) : undefined);
    const specUnit = pick(specs, wanted);
    const bodyUnit = pick(bodies, specUnit ? bare(specUnit.name) : wanted);
    return { specUnit, bodyUnit };
}

function signatureKey(m: PlMember): string {
    const params = m.params.map(p => `${p.name.toLowerCase()}:${p.direction}${p.nocopy ? ':nocopy' : ''}:${p.type.toLowerCase().replace(/\s+/g, '')}`).join(',');
    return `${m.kind}|${m.name.toLowerCase()}|${params}|${(m.returnType ?? '').toLowerCase().replace(/\s+/g, '')}`;
}

const isSub = (m: PlMember): boolean => m.kind === 'procedure' || m.kind === 'function';

export function compareUnits(spec: PlUnit, body: PlUnit): SyncDiff[] {
    const diffs: SyncDiff[] = [];
    const specSubs = spec.members.filter(isSub);
    const bodySubs = body.members.filter(isSub);
    const usedBody = new Set<PlMember>();
    const leftoverSpec: PlMember[] = [];

    for (const s of specSubs) {
        const exact = bodySubs.find(b => !usedBody.has(b) && signatureKey(b) === signatureKey(s));
        if (exact) { usedBody.add(exact); } else { leftoverSpec.push(s); }
    }
    const leftoverBody = bodySubs.filter(b => !usedBody.has(b));

    for (const s of leftoverSpec) {
        const sameName = leftoverBody.find(b => b.name.toLowerCase() === s.name.toLowerCase() && b.kind === s.kind);
        if (sameName) {
            leftoverBody.splice(leftoverBody.indexOf(sameName), 1);
            diffs.push({ id: `mismatch:${s.name}:${s.startOffset}`, kind: 'signatureMismatch', name: s.name, spec: s, body: sameName,
                message: `${s.name}: the spec and the body signatures differ` });
        } else {
            diffs.push({ id: `nobody:${s.name}:${s.startOffset}`, kind: 'missingInBody', name: s.name, spec: s,
                message: `${s.name} is declared in the spec but has no body` });
        }
    }
    for (const b of leftoverBody) {
        diffs.push({ id: `nospec:${b.name}:${b.startOffset}`, kind: 'missingInSpec', name: b.name, body: b,
            message: `${b.name} is in the body only (private); add it to the spec to make it public` });
    }
    return diffs;
}

function declarationText(m: PlMember, indent: string): string {
    const lines = m.signature.split(/\r?\n/);
    const base = lines[0];
    const rest = lines.slice(1).map(l => l.replace(/^\s+/, '').length ? l : l);
    return [indent + base.replace(/^\s+/, ''), ...rest].join('\n') + ';';
}

function stubText(m: PlMember, indent: string, eol = '\n'): string {
    const body = m.kind === 'function' ? 'RETURN NULL;' : 'NULL;';
    return `${declarationText(m, indent)}`.replace(/;$/, '') + ` IS${eol}${indent}BEGIN${eol}${indent}  ${body} -- TODO: implement${eol}${indent}END ${m.name};`;
}

/** Edit declaring `member` (from the body) in the spec, just before the spec's closing END. */
export function addToSpec(specText: string, spec: PlUnit, member: PlMember): TextChange {
    const eol = specText.includes('\r\n') ? '\r\n' : '\n';
    return { offset: spec.closeOffset, length: 0, text: `  ${declarationText(member, '').replace(/\n/g, eol)}${eol}${eol}`.replace(/^ {2}/, '  ') };
}

/** Edit adding an empty implementation of a spec declaration to the body. */
export function addStubToBody(bodyText: string, body: PlUnit, member: PlMember): TextChange {
    const eol = bodyText.includes('\r\n') ? '\r\n' : '\n';
    const at = body.appendOffset ?? body.closeOffset;
    return { offset: at, length: 0, text: `${stubText(member, '  ', eol)}${eol}${eol}` };
}

/** Rewrites the spec declaration so it matches the body signature. */
export function updateSpecFromBody(spec: PlMember, body: PlMember): TextChange {
    return { offset: spec.startOffset, length: spec.endOffset - spec.startOffset, text: declarationText(body, '').replace(/^\s+/, '') };
}

/** Rewrites the body header (up to IS / AS) so it matches the spec signature. */
export function updateBodyFromSpec(body: PlMember, spec: PlMember): TextChange {
    return { offset: body.startOffset, length: body.signatureEndOffset - body.startOffset, text: spec.signature.replace(/\s+$/, '') + ' ' };
}

export function applyChanges(text: string, changes: TextChange[]): string {
    let out = text;
    for (const c of [...changes].sort((a, b) => b.offset - a.offset)) { out = out.slice(0, c.offset) + c.text + out.slice(c.offset + c.length); }
    return out;
}
