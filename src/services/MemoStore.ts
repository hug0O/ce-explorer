/**
 * Markdown memos, one file per language (`pascal.md`, `plsql.md`, `typescript.md`,
 * `general.md`…): the daily, repetitive things worth writing down once. Plain
 * files in a folder, so they can live in the project and be versioned.
 */
import * as fs from 'fs';
import * as path from 'path';

export const GENERAL_MEMO = 'general';
/** The memo every folder starts with: the one that opens when none is chosen. */
export const MAIN_MEMO = 'main';
/** A memo above this size is refused: it is a notepad, not a database. */
export const MAX_MEMO_BYTES = 1024 * 1024;

/** A file-name-safe language id: lower case letters, digits, `_` and `-`; anything else is dropped. */
export function sanitizeLang(lang: string): string {
    const id = String(lang ?? '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
    return id || GENERAL_MEMO;
}

/** The id (and file name) of a memo from the name typed for it: "Release notes" becomes release-notes. Empty when nothing usable is left. */
export function memoId(name: string): string {
    return String(name ?? '').trim().toLowerCase().replace(/\.md$/, '').replace(/[\s.]+/g, '-').replace(/[^a-z0-9_-]/g, '').replace(/-{2,}/g, '-').replace(/^[-_]+|[-_]+$/g, '').slice(0, 40);
}

/** The folder of the memos: the one of the setting `ce.memo.folder` (relative to the workspace), else the extension's own storage. */
export function memoFolderOf(configured: string, workspaceRoot: string | undefined, storage: string): string {
    const c = configured.trim();
    if (c) {
        if (path.isAbsolute(c)) { return c; }
        if (workspaceRoot) { return path.join(workspaceRoot, c); }
    }
    return path.join(storage, 'memos');
}

export class MemoStore {
    constructor(private readonly folder: string) {}

    fileFor(lang: string): string {
        return path.join(this.folder, sanitizeLang(lang) + '.md');
    }

    /** Same as `read`, for the sidebar which draws its page synchronously (memos are small files). */
    readSync(lang: string): string {
        try { return fs.readFileSync(this.fileFor(lang), 'utf8'); }
        catch { return ''; }
    }

    /** Every memo of the folder, empty or not, `main` first; `main` is listed even before its file exists. */
    namesSync(): string[] {
        let ids: string[] = [];
        try { ids = fs.readdirSync(this.folder).map(name => name.match(/^([a-z0-9_-]+)\.md$/)?.[1]).filter((id): id is string => !!id); } catch { /* no folder yet */ }
        return [MAIN_MEMO, ...ids.filter(id => id !== MAIN_MEMO).sort()];
    }

    /** Makes sure `main.md` exists: a memo to write in from the start. */
    ensureMainSync(): void {
        try {
            if (fs.existsSync(this.fileFor(MAIN_MEMO))) { return; }
            fs.mkdirSync(this.folder, { recursive: true });
            fs.writeFileSync(this.fileFor(MAIN_MEMO), '# Main\n\nYour notes. Create as many memos as you want with + New; open any of them as a page.\n', { encoding: 'utf8', flag: 'wx' });
        } catch { /* the folder cannot be written: the memo stays in memory */ }
    }

    exists(id: string): boolean { return fs.existsSync(this.fileFor(id)); }

    /** Languages that already have a memo that is not empty, synchronously. */
    languagesSync(): string[] {
        try {
            return fs.readdirSync(this.folder)
                .map(name => name.match(/^([a-z0-9_-]+)\.md$/)?.[1])
                .filter((id): id is string => !!id && fs.statSync(path.join(this.folder, id + '.md')).size > 0)
                .sort();
        } catch { return []; }
    }

    /** The memo of a language; empty when there is none yet. */
    async read(lang: string): Promise<string> {
        try { return await fs.promises.readFile(this.fileFor(lang), 'utf8'); }
        catch { return ''; }
    }

    async write(lang: string, text: string): Promise<void> {
        if (Buffer.byteLength(text, 'utf8') > MAX_MEMO_BYTES) { throw new Error('This memo is too big (1 MB maximum).'); }
        await fs.promises.mkdir(this.folder, { recursive: true });
        await fs.promises.writeFile(this.fileFor(lang), text, 'utf8');
    }

    /** Languages that already have a memo that is not empty. */
    async languages(): Promise<string[]> {
        try {
            const out: string[] = [];
            for (const name of await fs.promises.readdir(this.folder)) {
                const m = name.match(/^([a-z0-9_-]+)\.md$/);
                if (m && (await fs.promises.stat(path.join(this.folder, name))).size > 0) { out.push(m[1]); }
            }
            return out.sort();
        } catch { return []; }
    }
}
