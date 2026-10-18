import * as vscode from 'vscode';
import { Occurrence, VariableRef } from '../models/types';
import { ILanguageProvider } from '../providers/ILanguageProvider';

/**
 * Pure, testable regex scan: finds every word-boundary occurrence of `name`
 * within the given line ranges of `text`. Returns occurrences as line+char
 * offsets, deduplicated. This is the fallback used when no LSP is available
 * (e.g. Pascal/Delphi) and the building block for the member/standalone scan.
 */
export function scanNameInLines(
    lines: string[],
    startLine: number,
    endLine: number,
    name: string,
): { line: number; startChar: number; endChar: number }[] {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameLen = name.length;
    const regex = new RegExp('\\b' + escaped + '\\b', 'g');
    const out: { line: number; startChar: number; endChar: number }[] = [];
    const seen = new Set<string>();
    for (let ln = startLine; ln <= endLine && ln < lines.length; ln++) {
        const text = lines[ln] ?? '';
        regex.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
            const key = ln + ':' + m.index;
            if (!seen.has(key)) {
                seen.add(key);
                out.push({ line: ln, startChar: m.index, endChar: m.index + nameLen });
            }
            regex.lastIndex = m.index + nameLen;
        }
    }
    return out;
}

/**
 * Compute the line ranges to scan for a variable, based on its kind. Locals
 * and parameters are scoped to their method body; fields/properties/methods
 * to their enclosing class; standalone routines to declaration+implementation.
 */
function scanRangesFor(ref: VariableRef): { doc: vscode.TextDocument; start: number; end: number }[] {
    const doc = ref.document;
    if (ref.kind === 'local' || ref.kind === 'param') {
        // Use the full implementation range, not just the begin..end body: a
        // local/parameter is declared in the `var` section that precedes
        // `begin` (Pascal) and that declaration must be renamed too. bodyRange
        // starts after `begin` and would miss the declaration line.
        const impl = ref.enclosingMethod?.implementationRange;
        if (impl) { return [{ doc, start: impl.start.line, end: impl.end.line }]; }
        const body = ref.scope?.bodyRange;
        if (body) { return [{ doc, start: body.start.line, end: body.end.line }]; }
        if (ref.enclosingMethod) { return [{ doc, start: ref.enclosingMethod.range.start.line, end: ref.enclosingMethod.range.end.line }]; }
        return [];
    }
    if (ref.kind === 'standalone') {
        const ranges: { doc: vscode.TextDocument; start: number; end: number }[] = [];
        const m = ref.enclosingClass?.members[0];
        if (m) {
            ranges.push({ doc, start: m.range.start.line, end: m.range.end.line });
            if (m.implementationRange) { ranges.push({ doc, start: m.implementationRange.start.line, end: m.implementationRange.end.line }); }
        }
        return ranges;
    }
    // field / property: whole enclosing class.
    if (ref.enclosingClass) {
        return [{ doc, start: ref.enclosingClass.range.start.line, end: ref.enclosingClass.range.end.line }];
    }
    return [];
}

/**
 * Unified occurrence finder implementing the "Auto" strategy: try the LSP
 * workspace reference provider first, then fall back to a regex scan scoped
 * to the variable's enclosing block (plus the C++ paired file).
 *
 * Returns occurrences across possibly multiple documents.
 *
 * @param cursorPosition Optional user cursor position. When provided it is
 *   tried first against the LSP (it is guaranteed to sit on a real occurrence),
 *   which matters for servers like OmniPascal that resolve symbols by exact
 *   cursor position rather than by the declaration line start.
 */
export async function findOccurrences(
    ref: VariableRef,
    provider?: ILanguageProvider,
    cursorPosition?: vscode.Position,
): Promise<Occurrence[]> {
    // 1. Try the language server (multi-file, precise) when available. The
    //    cursor position is tried first (most reliable), then the declaration.
    const lsp = await tryLspReferences(ref, cursorPosition);
    if (lsp && lsp.length > 0) {
        return lsp;
    }

    // 2. Fallback: regex scan scoped to the variable's block.
    const occurrences: Occurrence[] = [];
    const ranges = scanRangesFor(ref);
    for (const r of ranges) {
        const lines = r.doc.getText().split(/\r?\n/);
        for (const hit of scanNameInLines(lines, r.start, r.end, ref.name)) {
            occurrences.push({ uri: r.doc.uri, range: new vscode.Range(hit.line, hit.startChar, hit.line, hit.endChar) });
        }
    }

    // 3. Paired file (C++ header/source): extend the regex scan there too.
    if (provider) {
        const pairedUri = provider.findPairedFile(ref.document.uri);
        if (pairedUri) {
            const pairedDoc = await vscode.workspace.openTextDocument(pairedUri);
            const lines = pairedDoc.getText().split(/\r?\n/);
            for (const hit of scanNameInLines(lines, 0, lines.length - 1, ref.name)) {
                occurrences.push({ uri: pairedUri, range: new vscode.Range(hit.line, hit.startChar, hit.line, hit.endChar) });
            }
        }
    }

    return occurrences;
}

/**
 * Ask the active language server for all references to the variable. Tries the
 * user cursor position first (guaranteed on a real occurrence), then the
 * declaration line start. Returns undefined when no LSP answered so the caller
 * can fall back to the regex scan.
 */
async function tryLspReferences(ref: VariableRef, cursorPosition?: vscode.Position): Promise<Occurrence[] | undefined> {
    // Candidate positions: cursor first (most reliable for servers that resolve
    // by exact position like OmniPascal), then the declaration line start.
    const positions: vscode.Position[] = [];
    if (cursorPosition) { positions.push(cursorPosition); }
    positions.push(ref.declarationRange.start);

    for (const pos of positions) {
        try {
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                ref.document.uri,
                pos,
            );
            if (locations && locations.length > 0) {
                return locations.map(loc => ({ uri: loc.uri, range: loc.range }));
            }
        } catch {
            // LSP not available or threw for this position — try the next.
        }
    }
    return undefined;
}
