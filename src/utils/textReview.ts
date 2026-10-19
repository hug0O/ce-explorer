/**
 * Review rules that read the text of any language: notes left in the code, passwords written
 * in it, exceptions swallowed. Plain text in, findings out, so they can be tested without VS Code.
 */
import { ReviewFinding } from './reviewTypes';

const COMMENT_START = /^\s*(\/\/|--|#|\*|\/\*|\{)/;
const CATCH_LANGS = ['typescript', 'javascript', 'java', 'csharp', 'cpp'];

export function reviewText(lines: string[], lang: string, fileName: string): ReviewFinding[] {
    const findings: ReviewFinding[] = [];

    lines.forEach((line, i) => {
        const note = /\b(TODO|FIXME|HACK|XXX)\b[\s:\-]*(.*)$/.exec(line);
        if (note) {
            const col = note.index;
            findings.push({
                severity: 'info', category: 'TODO', message: (note[1] + (note[2].trim() ? ': ' + note[2].trim() : '')).slice(0, 80),
                file: fileName, line: i, col, endCol: line.length,
            });
        }
        if (COMMENT_START.test(line)) { return; }
        const literal = /\b(password|passwd|pwd)\b\s*(?::=|=)\s*(['"])([^'"\s][^'"]*)\2/i.exec(line);
        const inString = /\b(?:password|pwd)\s*=\s*[^;'"\s%:{][^;'"]*[;'"]/i.exec(line);
        const hit = literal ?? inString;
        if (hit) {
            findings.push({
                severity: 'warning', category: 'Security', message: 'A password is written in the source',
                file: fileName, line: i, col: hit.index, endCol: hit.index + hit[0].length,
                hint: 'Read it from a protected setting, the environment or a vault, and keep it out of version control.',
            });
        }
    });

    const text = lines.join('\n');
    const starts: number[] = [0];
    for (let i = 0; i < text.length; i++) { if (text[i] === '\n') { starts.push(i + 1); } }
    const lineOf = (offset: number): number => {
        let line = 0;
        while (line + 1 < starts.length && starts[line + 1] <= offset) { line++; }
        return line;
    };
    if (CATCH_LANGS.includes(lang)) {
        for (const m of text.matchAll(/\bcatch\s*(?:\([^)]*\))?\s*\{\s*\}/g)) {
            const line = lineOf(m.index ?? 0);
            findings.push({
                severity: 'warning', category: 'Error handling', message: 'Empty catch block: the error is swallowed',
                file: fileName, line, hint: 'Log it, handle the case you expect, or let it propagate.',
            });
        }
    }
    if (lang === 'python') {
        for (const m of text.matchAll(/\bexcept\b[^\n:]*:[ \t]*\n[ \t]*pass\b/g)) {
            findings.push({
                severity: 'warning', category: 'Error handling', message: 'except: pass swallows the error',
                file: fileName, line: lineOf(m.index ?? 0), hint: 'Catch the exception you expect, and log or re-raise the others.',
            });
        }
    }
    return findings;
}
