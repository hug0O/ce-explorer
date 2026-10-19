/**
 * The diagnostics other extensions already publish for a file (the TypeScript server, Pylance, gopls,
 * rust-analyzer, OmniSharp, the Delphi language server…) are the real compiler's opinion: the review
 * lists them with its own findings. Plain data in, findings out, so it can be tested without VS Code.
 */
import { ReviewFinding } from './reviewTypes';

export interface DiagnosticLike {
    message: string;
    /** vscode.DiagnosticSeverity: 0 Error, 1 Warning, 2 Information, 3 Hint. */
    severity: number;
    source?: string;
    code?: string | number | { value: string | number };
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
}

/** The source the review itself puts on the diagnostics it publishes: not read back as the compiler's. */
export const OWN_SOURCE = 'CE Review';

export function findingsFromDiagnostics(diags: DiagnosticLike[], fileName: string): ReviewFinding[] {
    const out: ReviewFinding[] = [];
    for (const d of diags) {
        if (d.source === OWN_SOURCE) { continue; }
        const raw = typeof d.code === 'object' && d.code !== null ? d.code.value : d.code;
        // the TypeScript server numbers its diagnostics: TS6133 is how everybody names them
        const code = raw === undefined || raw === '' ? undefined : typeof raw === 'number' && /^ts/i.test(d.source ?? '') ? `TS${raw}` : String(raw);
        out.push({
            severity: d.severity === 0 ? 'error' : d.severity === 1 ? 'warning' : 'info',
            category: 'Compiler',
            message: d.message.split(/\r?\n/)[0].slice(0, 200),
            file: fileName, line: d.range.start.line,
            col: d.range.start.character, endCol: d.range.end.line === d.range.start.line ? d.range.end.character : undefined,
            code, source: d.source,
        });
    }
    return out;
}

/** The review's own findings minus the ones a language server reported too (same line, same code). */
export function dropReported(own: ReviewFinding[], reported: ReviewFinding[]): ReviewFinding[] {
    const seen = new Set(reported.filter(f => f.code).map(f => `${f.line}:${f.code!.toLowerCase()}`));
    return own.filter(f => !f.code || !seen.has(`${f.line}:${f.code.toLowerCase()}`));
}
