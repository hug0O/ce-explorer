/**
 * Structural parser for PL/SQL packages and stand-alone subprograms, built on
 * the lexical scanner. Pure: the VS Code provider and the generators / sync /
 * review tools all share this single model.
 */
import { Tok, cleanPlSql, findClose, lineOfOffset as lineOf, lineStartsOf, signatureEnd, statementEnd, tokenize } from './plsqlScan';

export type PlDirection = 'in' | 'out' | 'inout';

export interface PlParam {
    name: string;
    /** Type without any size constraint kept as written (NUMBER, VARCHAR2, t.col%TYPE…). */
    type: string;
    direction: PlDirection;
    nocopy: boolean;
    defaultValue?: string;
}

export type PlMemberKind = 'procedure' | 'function' | 'variable' | 'constant' | 'exception';

export interface PlMember {
    kind: PlMemberKind;
    name: string;
    params: PlParam[];
    returnType?: string;
    /** Variable / constant type as written. */
    type?: string;
    startLine: number;
    /** Last line of the signature (the `IS` / `AS` line, or the `;` of a declaration). */
    sigEndLine: number;
    /** First `BEGIN` of the body. */
    beginLine?: number;
    /** Line of the closing END; equals sigEndLine for declarations. */
    endLine: number;
    /** `PROCEDURE p;` in a spec (or forward declaration): no body. */
    isDeclaration: boolean;
    /** Offsets in the source text of the whole member (signature start … closing `;`). */
    startOffset: number;
    endOffset: number;
    /** Signature as written, from `PROCEDURE`/`FUNCTION` up to (not including) IS/AS or `;`. */
    signature: string;
    /** Offset where the signature text ends (just before IS/AS or `;`). */
    signatureEndOffset: number;
    /** Table column details (members of a CREATE TABLE unit). */
    column?: { nullable: boolean; primaryKey: boolean };
}

export interface PlUnit {
    kind: 'package' | 'package body' | 'procedure' | 'function' | 'trigger' | 'table' | 'block';
    name: string;
    startLine: number;
    endLine: number;
    /** Offsets: first character of the CREATE header … end of the closing `;`. */
    startOffset: number;
    endOffset: number;
    /** Offset of the closing END keyword. */
    closeOffset: number;
    /** Where a new subprogram is appended: before the initialization BEGIN if any, else before the closing END. */
    appendOffset?: number;
    members: PlMember[];
    /** Primary-key column names of a table unit. */
    primaryKey?: string[];
}

function stripTypeSize(t: string): string {
    return t.trim();
}

/** Parses `a IN NUMBER, b OUT VARCHAR2 := 'x'` (comment-free `clean`, original `text` for defaults). */
export function parseParams(clean: string, text: string, from: number, to: number): PlParam[] {
    const params: PlParam[] = [];
    let depth = 0;
    let segStart = from;
    const flush = (end: number): void => {
        const seg = clean.slice(segStart, end);
        const m = seg.match(/^\s*([A-Za-z_][\w$#]*)\s+((?:in\s+out|in|out)\s+)?(nocopy\s+)?([\s\S]+?)\s*$/i);
        if (!m) { return; }
        const direction: PlDirection = m[2] ? (/in\s+out/i.test(m[2]) ? 'inout' : /out/i.test(m[2]) ? 'out' : 'in') : 'in';
        let typeText = m[4];
        let defaultValue: string | undefined;
        const d = typeText.search(/:=|\bdefault\b/i);
        if (d >= 0) {
            const absolute = segStart + seg.indexOf(m[4]) + d;
            defaultValue = text.slice(absolute, end).replace(/^(:=|default)\s*/i, '').trim();
            typeText = typeText.slice(0, d);
        }
        params.push({ name: m[1], type: stripTypeSize(typeText.replace(/\s+/g, ' ')), direction, nocopy: !!m[3], defaultValue });
    };
    for (let i = from; i < to; i++) {
        const ch = clean[i];
        if (ch === '(') { depth++; }
        else if (ch === ')') { depth--; }
        else if (ch === ',' && depth === 0) { flush(i); segStart = i + 1; }
    }
    if (clean.slice(segStart, to).trim()) { flush(to); }
    return params;
}

interface SigInfo {
    kind: 'procedure' | 'function';
    name: string;
    params: PlParam[];
    returnType?: string;
    sigIdx: number;
    definition: boolean;
    signatureEndOffset: number;
}

function parseSignature(toks: Tok[], i: number, clean: string, text: string): SigInfo | undefined {
    const kw = toks[i];
    const nameTok = toks[i + 1];
    if (!nameTok || !/^[A-Za-z_"]/.test(nameTok.text)) { return undefined; }
    const sig = signatureEnd(toks, i);
    let params: PlParam[] = [];
    let j = i + 2;
    if (toks[j]?.text === '(') {
        let depth = 0;
        let k = j;
        for (; k < toks.length; k++) {
            if (toks[k].text === '(') { depth++; }
            else if (toks[k].text === ')') { depth--; if (depth === 0) { break; } }
        }
        params = parseParams(clean, text, toks[j].end, toks[k]?.start ?? clean.length);
        j = k + 1;
    }
    let returnType: string | undefined;
    if (kw.up === 'FUNCTION') {
        const ret = toks.slice(j, sig.idx).findIndex(t => t.up === 'RETURN');
        if (ret >= 0) {
            const rt = toks[j + ret + 1];
            let end = rt ? rt.end : 0;
            const after = toks[j + ret + 2];
            if (rt && after && after.text === '(' && j + ret + 2 < sig.idx) {
                let depth = 0;
                for (let k = j + ret + 2; k < sig.idx; k++) {
                    if (toks[k].text === '(') { depth++; }
                    else if (toks[k].text === ')') { depth--; if (depth === 0) { end = toks[k].end; break; } }
                }
            }
            returnType = rt ? text.slice(rt.start, end).trim() : undefined;
        }
    }
    return {
        kind: kw.up === 'FUNCTION' ? 'function' : 'procedure',
        name: nameTok.text,
        params,
        returnType,
        sigIdx: sig.idx,
        definition: sig.definition,
        signatureEndOffset: toks[sig.idx].start,
    };
}

const SKIP_STATEMENT = new Set(['TYPE', 'SUBTYPE', 'CURSOR', 'PRAGMA']);

function parseMembers(toks: Tok[], from: number, to: number, clean: string, text: string, starts: number[]): PlMember[] {
    const members: PlMember[] = [];
    let i = from;
    while (i < to) {
        const t = toks[i];
        if (t.up === 'PROCEDURE' || t.up === 'FUNCTION') {
            const sig = parseSignature(toks, i, clean, text);
            if (!sig) { i++; continue; }
            const startLine = t.line;
            const signature = text.slice(t.start, sig.signatureEndOffset).replace(/\s+$/, '');
            const base = {
                kind: sig.kind, name: sig.name, params: sig.params, returnType: sig.returnType,
                startLine, sigEndLine: toks[sig.sigIdx].line, startOffset: t.start, signature,
                signatureEndOffset: sig.signatureEndOffset,
            };
            if (!sig.definition) {
                const endTok = toks[sig.sigIdx];
                members.push({ ...base, endLine: endTok.line, isDeclaration: true, endOffset: endTok.end });
                i = sig.sigIdx + 1;
                continue;
            }
            // External body (LANGUAGE JAVA / C): ends at the next ';'.
            const afterIs = toks[sig.sigIdx + 1]?.up;
            if (afterIs === 'LANGUAGE' || afterIs === 'EXTERNAL') {
                const stop = statementEnd(toks, sig.sigIdx);
                const endTok = toks[stop - 1] ?? toks[sig.sigIdx];
                members.push({ ...base, endLine: endTok.line, isDeclaration: false, endOffset: endTok.end });
                i = stop;
                continue;
            }
            const close = findClose(toks, sig.sigIdx + 1, 'sub');
            if (!close) { members.push({ ...base, endLine: toks[to - 1]?.line ?? startLine, isDeclaration: false, endOffset: text.length }); break; }
            const stop = statementEnd(toks, close.closeIdx);
            const endTok = toks[Math.min(stop, toks.length) - 1];
            members.push({
                ...base,
                beginLine: close.beginIdx !== undefined ? toks[close.beginIdx].line : undefined,
                endLine: endTok.line, isDeclaration: false, endOffset: endTok.end,
            });
            i = stop;
            continue;
        }
        if (SKIP_STATEMENT.has(t.up)) { i = statementEnd(toks, i); continue; }
        if (t.up === 'BEGIN') { break; } // package initialization section
        if (/^[A-Za-z_][\w$#]*$/.test(t.text)) {
            const stop = statementEnd(toks, i);
            const next = toks[i + 1];
            if (next && next.text !== ';' && next.text !== ':=') {
                const isConst = next.up === 'CONSTANT';
                const typeStartTok = isConst ? toks[i + 2] : next;
                let typeEnd = typeStartTok ? typeStartTok.end : t.end;
                let depth = 0;
                for (let k = isConst ? i + 2 : i + 1; k < stop; k++) {
                    const u = toks[k];
                    if (u.text === '(') { depth++; }
                    else if (u.text === ')') { depth--; }
                    if (depth <= 0 && (u.text === ':=' || u.up === 'DEFAULT' || u.text === ';' || (u.up === 'NOT' && toks[k + 1]?.up === 'NULL'))) { break; }
                    typeEnd = u.end;
                }
                const type = typeStartTok ? text.slice(typeStartTok.start, typeEnd).trim() : '';
                if (type) {
                    const endTok = toks[stop - 1];
                    members.push({
                        kind: type.toUpperCase() === 'EXCEPTION' ? 'exception' : isConst ? 'constant' : 'variable',
                        name: t.text, params: [], type, startLine: t.line, sigEndLine: endTok.line, endLine: endTok.line,
                        isDeclaration: true, startOffset: t.start, endOffset: endTok.end, signature: text.slice(t.start, endTok.end),
                        signatureEndOffset: endTok.end,
                    });
                }
            }
            i = stop;
            continue;
        }
        i++;
    }
    void starts;
    return members;
}

const HEADER_RE = /\bcreate\s+(?:or\s+replace\s+)?(?:(?:non)?editionable\s+)?(?:global\s+temporary\s+)?(package\s+body|package|procedure|function|trigger|table)\s+(?:if\s+not\s+exists\s+)?([A-Za-z_"][\w$#."]*)/gi;

export function parsePlSqlUnits(text: string): PlUnit[] {
    const clean = cleanPlSql(text);
    const starts = lineStartsOf(text);
    const toks = tokenize(clean, starts);
    const units: PlUnit[] = [];
    let resume = 0;

    HEADER_RE.lastIndex = 0;
    for (let m = HEADER_RE.exec(clean); m; m = HEADER_RE.exec(clean)) {
        if (m.index < resume) { continue; }
        const kindText = m[1].toLowerCase().replace(/\s+/g, ' ') as PlUnit['kind'];
        const name = m[2];
        const headerTok = toks.findIndex(t => t.start >= m!.index && t.up === (kindText.startsWith('package') ? 'PACKAGE' : kindText.toUpperCase()));
        if (headerTok < 0) { continue; }

        if (kindText === 'procedure' || kindText === 'function') {
            const sig = parseSignature(toks, headerTok, clean, text);
            if (!sig) { continue; }
            const members = parseMembers(toks, headerTok, toks.length, clean, text, starts).slice(0, 1);
            const member = members[0];
            if (!member) { continue; }
            units.push({
                kind: kindText, name, startLine: toks[headerTok].line, endLine: member.endLine,
                startOffset: m.index, endOffset: member.endOffset, closeOffset: member.endOffset, members,
            });
            resume = member.endOffset;
            continue;
        }

        if (kindText === 'trigger') {
            const bodyIdx = toks.findIndex((t, k) => k > headerTok && (t.up === 'DECLARE' || t.up === 'BEGIN'));
            if (bodyIdx < 0) { continue; }
            const close = findClose(toks, toks[bodyIdx].up === 'DECLARE' ? bodyIdx + 1 : bodyIdx, 'sub');
            if (!close) { continue; }
            const stop = statementEnd(toks, close.closeIdx);
            const endTok = toks[Math.min(stop, toks.length) - 1];
            const startLine = toks[headerTok].line;
            const member: PlMember = {
                kind: 'procedure', name, params: [], startLine, sigEndLine: Math.max(startLine, toks[bodyIdx].line - (toks[bodyIdx].up === 'DECLARE' ? 0 : 1)),
                beginLine: close.beginIdx !== undefined ? toks[close.beginIdx].line : toks[bodyIdx].line, endLine: endTok.line,
                isDeclaration: false, startOffset: m.index, endOffset: endTok.end, signature: text.slice(m.index, toks[bodyIdx].start).trim(),
                signatureEndOffset: toks[bodyIdx].start,
            };
            units.push({ kind: 'trigger', name, startLine, endLine: endTok.line, startOffset: m.index, endOffset: endTok.end, closeOffset: endTok.start, members: [member] });
            resume = endTok.end;
            continue;
        }

        if (kindText === 'table') {
            const open = toks.findIndex((t, k) => k > headerTok && t.text === '(');
            if (open < 0) { continue; }
            let depth = 0;
            let closeParen = open;
            for (; closeParen < toks.length; closeParen++) {
                if (toks[closeParen].text === '(') { depth++; }
                else if (toks[closeParen].text === ')') { depth--; if (depth === 0) { break; } }
            }
            const stop = statementEnd(toks, Math.min(closeParen, toks.length - 1));
            const endTok = toks[Math.min(stop, toks.length) - 1];
            const table = parseTableColumns(clean, text, toks[open].end, toks[closeParen]?.start ?? clean.length, starts);
            units.push({
                kind: 'table', name, startLine: toks[headerTok].line, endLine: endTok.line, startOffset: m.index, endOffset: endTok.end,
                closeOffset: toks[closeParen]?.start ?? endTok.start, members: table.columns, primaryKey: table.primaryKey,
            });
            resume = endTok.end;
            continue;
        }

        let isIdx = -1;
        for (let k = headerTok; k < toks.length; k++) {
            if (toks[k].up === 'IS' || toks[k].up === 'AS') { isIdx = k; break; }
        }
        if (isIdx < 0) { continue; }
        const close = findClose(toks, isIdx + 1, 'pkg');
        const closeIdx = close ? close.closeIdx : toks.length - 1;
        const stop = close ? statementEnd(toks, closeIdx) : toks.length;
        const endTok = toks[Math.min(stop, toks.length) - 1];
        units.push({
            kind: kindText, name, startLine: toks[headerTok].line, endLine: endTok.line,
            startOffset: m.index, endOffset: endTok.end, closeOffset: toks[closeIdx].start,
            appendOffset: close && close.beginIdx !== undefined ? toks[close.beginIdx].start : toks[closeIdx].start,
            members: parseMembers(toks, isIdx + 1, closeIdx, clean, text, starts),
        });
        resume = endTok.end;
    }
    addAnonymousBlocks(units, toks);
    units.sort((x, y) => x.startOffset - y.startOffset);
    return units;
}

const TABLE_CONSTRAINT = new Set(['CONSTRAINT', 'PRIMARY', 'FOREIGN', 'UNIQUE', 'CHECK', 'PERIOD', 'SUPPLEMENTAL', 'SCOPE', 'REF']);
const COLUMN_STOP = /\b(not\s+null|null|default|constraint|primary|references|check|unique|enable|disable|generated|visible|invisible|collate|encrypt|identity)\b/i;

function parseTableColumns(clean: string, text: string, from: number, to: number, starts: number[]): { columns: PlMember[]; primaryKey: string[] } {
    const columns: PlMember[] = [];
    const primaryKey: string[] = [];
    let depth = 0;
    let segStart = from;
    const handle = (end: number): void => {
        const seg = clean.slice(segStart, end);
        const first = seg.trim().split(/\s+/)[0]?.toUpperCase();
        if (!first) { return; }
        if (TABLE_CONSTRAINT.has(first)) {
            const pk = seg.match(/primary\s+key\s*\(([^)]*)\)/i);
            if (pk) { pk[1].split(',').map(c => c.trim()).filter(Boolean).forEach(c => primaryKey.push(c)); }
            return;
        }
        const m = seg.match(/^(\s*)([A-Za-z_"][\w$#"]*)\s+([\s\S]*)$/);
        if (!m) { return; }
        const nameOffset = segStart + m[1].length;
        const rest = m[3];
        const stopAt = rest.search(COLUMN_STOP);
        const type = (stopAt >= 0 ? rest.slice(0, stopAt) : rest).replace(/\s+/g, ' ').trim();
        const inline = /primary\s+key/i.test(rest);
        if (inline) { primaryKey.push(m[2]); }
        const line = lineOf(starts, nameOffset);
        columns.push({
            kind: 'variable', name: m[2], params: [], type, startLine: line, sigEndLine: line, endLine: line, isDeclaration: true,
            startOffset: nameOffset, endOffset: segStart + seg.trimEnd().length, signature: text.slice(nameOffset, segStart + seg.trimEnd().length),
            signatureEndOffset: segStart + seg.trimEnd().length,
            column: { nullable: !/not\s+null/i.test(rest) && !inline, primaryKey: inline },
        });
    };
    for (let i = from; i < to; i++) {
        const ch = clean[i];
        if (ch === '(') { depth++; }
        else if (ch === ')') { depth--; }
        else if (ch === ',' && depth === 0) { handle(i); segStart = i + 1; }
    }
    if (clean.slice(segStart, to).trim()) { handle(to); }
    const pkSet = new Set(primaryKey.map(c => c.toUpperCase()));
    columns.forEach(c => { if (pkSet.has(c.name.toUpperCase())) { c.column = { nullable: false, primaryKey: true }; } });
    return { columns, primaryKey };
}

/** Top-level DECLARE … END; / BEGIN … END; blocks of a script (outside any CREATE unit). */
function addAnonymousBlocks(units: PlUnit[], toks: Tok[]): void {
    const inside = (offset: number): boolean => units.some(u => offset >= u.startOffset && offset <= u.endOffset);
    for (let i = 0; i < toks.length; i++) {
        const t = toks[i];
        if ((t.up !== 'DECLARE' && t.up !== 'BEGIN') || inside(t.start)) { continue; }
        const prev = toks[i - 1];
        if (prev && prev.text !== ';' && prev.text !== '/') { continue; }
        const close = findClose(toks, t.up === 'DECLARE' ? i + 1 : i, 'sub');
        if (!close) { continue; }
        const stop = statementEnd(toks, close.closeIdx);
        const endTok = toks[Math.min(stop, toks.length) - 1];
        const name = 'anon_block_L' + (t.line + 1);
        const member: PlMember = {
            kind: 'procedure', name, params: [], startLine: t.line, sigEndLine: t.line,
            beginLine: close.beginIdx !== undefined ? toks[close.beginIdx].line : t.line, endLine: endTok.line, isDeclaration: false,
            startOffset: t.start, endOffset: endTok.end, signature: name, signatureEndOffset: t.end,
        };
        units.push({ kind: 'block', name, startLine: t.line, endLine: endTok.line, startOffset: t.start, endOffset: endTok.end, closeOffset: endTok.start, members: [member] });
        while (i < toks.length && toks[i].start < endTok.end) { i++; }
        i--;
    }
}

/** Declarations (variables, constants, nested subprograms) found between two offsets, e.g. a subprogram's IS … BEGIN region. */
export function parseDeclarationRegion(text: string, fromOffset: number, toOffset: number): PlMember[] {
    const clean = cleanPlSql(text);
    const starts = lineStartsOf(text);
    const toks = tokenize(clean, starts);
    const a = toks.findIndex(t => t.start >= fromOffset);
    if (a < 0) { return []; }
    let b = toks.findIndex(t => t.start >= toOffset);
    if (b < 0) { b = toks.length; }
    return parseMembers(toks, a, b, clean, text, starts);
}
