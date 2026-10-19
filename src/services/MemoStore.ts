/**
 * Markdown memos, one file per language (`pascal.md`, `plsql.md`, `typescript.md`,
 * `general.md`…): the daily, repetitive things worth writing down once. Plain
 * files in a folder, so they can live in the project and be versioned.
 */
import * as fs from 'fs';
import * as path from 'path';

export const GENERAL_MEMO = 'general';
/** A memo above this size is refused: it is a notepad, not a database. */
export const MAX_MEMO_BYTES = 1024 * 1024;

/** A file-name-safe language id: lower case letters, digits, `_` and `-`; anything else is dropped. */
export function sanitizeLang(lang: string): string {
    const id = String(lang ?? '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
    return id || GENERAL_MEMO;
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
