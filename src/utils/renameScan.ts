/**
 * Rename with a preview: every place a name is written in a file, told apart as code or as text (a comment or a string), so that the
 * command can offer the code only, or the text too, and VS Code shows the lot in its refactoring preview before anything changes.
 *
 * Pure: it reads a text and says where the name is.
 */
import { CodeFamily, familyOf, maskCode } from './callGraph';

export interface RenameHit {
    offset: number;
    line: number;
    col: number;
    /** 'code' where the name is code; 'text' in a comment or a string (a SQL text, a caption, a note). */
    kind: 'code' | 'text';
    /** The line the name is on, trimmed, for the list. */
    preview: string;
}

/** An identifier a rename may give or take. */
export const isIdentifier = (s: string): boolean => /^[A-Za-z_]\w*$/.test(s);

/** The languages whose names do not care about case. */
const CASE_FREE = new Set(['pascal', 'dfm', 'plsql']);

/** The extension of the Delphi family, whose forms and units are renamed together. */
export const DELPHI_EXTENSIONS = ['pas', 'dfm', 'fmx', 'dpr', 'dpk', 'inc', 'lfm', 'lpr', 'pp'];
export const CPP_EXTENSIONS = ['h', 'hpp', 'hh', 'hxx', 'c', 'cc', 'cpp', 'cxx'];

/** The files of the project a name of a file with this extension is looked for in: its own family, or only its own kind. */
export function extensionsLike(ext: string): string[] {
    const e = ext.toLowerCase().replace(/^\./, '');
    if (DELPHI_EXTENSIONS.includes(e)) { return DELPHI_EXTENSIONS; }
    if (CPP_EXTENSIONS.includes(e)) { return CPP_EXTENSIONS; }
    return e ? [e] : [];
}

const LANGUAGE_OF_EXTENSION: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact', js: 'javascript', jsx: 'javascriptreact', py: 'python', java: 'java', cs: 'csharp', go: 'go', rs: 'rust',
    sql: 'plsql', ps1: 'powershell', sh: 'shellscript', bat: 'bat', cmd: 'bat',
};

/** The comment / string family of a file by its extension: a form file reads like Pascal (its values are strings), an unknown file is all code. */
export function familyOfExtension(ext: string, languageId?: string): CodeFamily | undefined {
    const e = ext.toLowerCase().replace(/^\./, '');
    if (e === 'dfm' || e === 'fmx' || e === 'lfm') { return familyOf('pascal'); }
    if (languageId) { return familyOf(languageId); }
    if (DELPHI_EXTENSIONS.includes(e)) { return familyOf('pascal'); }
    if (CPP_EXTENSIONS.includes(e)) { return familyOf('cpp'); }
    const lang = LANGUAGE_OF_EXTENSION[e];
    return lang ? familyOf(lang) : undefined;
}

/** Where `name` is written in `text` as a whole word. `family` tells the comments and strings; without it everything counts as code. */
export function scanRename(text: string, name: string, family: CodeFamily | undefined, caseFree: boolean): RenameHit[] {
    if (!isIdentifier(name)) { return []; }
    const masked = family ? maskCode(text, family) : text;
    const re = new RegExp('(?<![\\w$])' + name + '(?![\\w$])', caseFree ? 'gi' : 'g');
    const lineStarts = [0];
    for (let i = 0; i < text.length; i++) { if (text[i] === '\n') { lineStarts.push(i + 1); } }
    const hits: RenameHit[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        let lo = 0, hi = lineStarts.length - 1;
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= m.index) { lo = mid; } else { hi = mid - 1; } }
        const end = text.indexOf('\n', lineStarts[lo]);
        const lineText = text.slice(lineStarts[lo], end < 0 ? text.length : end).replace(/\r$/, '');
        const word = masked.slice(m.index, m.index + name.length);
        hits.push({
            offset: m.index, line: lo, col: m.index - lineStarts[lo],
            kind: word.toLowerCase() === name.toLowerCase() ? 'code' : 'text',
            preview: lineText.trim().slice(0, 140),
        });
    }
    return hits;
}

/** Whether the names of this language do not care about case. */
export const isCaseFree = (languageId: string | undefined, ext: string): boolean => CASE_FREE.has(languageId ?? '') || ['dfm', 'pas', 'dpr', 'dpk', 'inc', 'lfm', 'fmx', 'sql'].includes(ext.toLowerCase().replace(/^\./, ''));

/** The text with the chosen hits written as `newName` (for the tests and for a dry run). */
export function applyRename(text: string, hits: RenameHit[], oldLength: number, newName: string): string {
    let out = text;
    for (const h of [...hits].sort((a, b) => b.offset - a.offset)) { out = out.slice(0, h.offset) + newName + out.slice(h.offset + oldLength); }
    return out;
}
