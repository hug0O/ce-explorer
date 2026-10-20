/**
 * Languages chosen by hand for files the extension does not recognise: one file, or every file with an
 * extension (an `.inc` that is Pascal, an `.xyz` script that is Python).
 *
 * It only tells the extension which of its own parsers to use: it does not change the language VS Code
 * gives the file (colours, other extensions), so it never gets in the way of OmniPascal or of the others.
 *
 * Pure: the caller keeps it (a `Memento`) and asks it.
 */

export interface OverrideState {
    files: Record<string, string>;
    extensions: Record<string, string>;
}

/** `Foo.INC` and `.inc` and `inc` all name the extension `.inc`. */
export function normalizeExtension(ext: string): string {
    const e = ext.trim().toLowerCase();
    return e ? (e.startsWith('.') ? e : '.' + e) : '';
}

/** The extension of a path with its dot (`C:\a\Unit.INC` → `.inc`), or '' for a file with none. */
export function extensionOf(filePath: string): string {
    const name = filePath.split(/[\\/]/).pop() ?? '';
    const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(dot).toLowerCase() : '';
}

const keyOf = (filePath: string): string => filePath.replace(/\\/g, '/').toLowerCase();

export class LanguageOverrides {
    private files = new Map<string, string>();
    private extensions = new Map<string, string>();

    /** The language chosen for this file, if any: the file itself first, then its extension. */
    resolve(filePath: string): string | undefined {
        return this.files.get(keyOf(filePath)) ?? this.extensions.get(extensionOf(filePath));
    }

    /** Where the choice for this file comes from. */
    source(filePath: string): 'file' | 'extension' | undefined {
        if (this.files.has(keyOf(filePath))) { return 'file'; }
        return this.extensions.has(extensionOf(filePath)) ? 'extension' : undefined;
    }

    setFile(filePath: string, languageId: string): void { this.files.set(keyOf(filePath), languageId); }

    setExtension(ext: string, languageId: string): void {
        const e = normalizeExtension(ext);
        if (e) { this.extensions.set(e, languageId); }
    }

    /** Forgets what was chosen for this file, by its name and by its extension. Returns whether there was anything. */
    clear(filePath: string): boolean {
        const a = this.files.delete(keyOf(filePath));
        const b = this.extensions.delete(extensionOf(filePath));
        return a || b;
    }

    /** Extensions that were given a language: the workspace scans have to look at them too. */
    get chosenExtensions(): string[] { return [...this.extensions.keys()]; }

    get size(): number { return this.files.size + this.extensions.size; }

    toJSON(): OverrideState {
        return { files: Object.fromEntries(this.files), extensions: Object.fromEntries(this.extensions) };
    }

    /** Loads what was saved; anything that is not a string is dropped, whatever the file held. */
    load(state: unknown): void {
        this.files.clear();
        this.extensions.clear();
        if (!state || typeof state !== 'object') { return; }
        const s = state as Partial<OverrideState>;
        for (const [k, v] of Object.entries(s.files ?? {})) { if (typeof v === 'string' && v) { this.files.set(keyOf(k), v); } }
        for (const [k, v] of Object.entries(s.extensions ?? {})) { const e = normalizeExtension(k); if (e && typeof v === 'string' && v) { this.extensions.set(e, v); } }
    }
}

/** The one the extension uses. */
export const languageOverrides = new LanguageOverrides();
