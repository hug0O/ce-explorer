/**
 * What the extension changed, in the order it happened: a rename, a deletion, a member added, a call written from the Blueprint. It lets
 * the user find an edit they did not expect, and open the file it touched. Kept per workspace; pure (the store is anything with get and
 * update, a VS Code Memento in practice).
 */
export interface LogEntry { at: number; label: string; file?: string }

export interface LogStore {
    get<T>(key: string, fallback: T): T;
    update(key: string, value: unknown): PromiseLike<void>;
}

const KEY = 'ce.actionLog';
const MAX = 60;

/** "just now", "3 min ago", "2 h ago", "yesterday", "5 days ago". */
export function ageText(at: number, now: number = Date.now()): string {
    const s = Math.max(0, Math.round((now - at) / 1000));
    if (s < 45) { return 'just now'; }
    if (s < 3600) { return Math.max(1, Math.round(s / 60)) + ' min ago'; }
    if (s < 86_400) { return Math.round(s / 3600) + ' h ago'; }
    const d = Math.round(s / 86_400);
    return d === 1 ? 'yesterday' : d + ' days ago';
}

export class ActionLog {
    private store: LogStore | undefined;
    private entries: LogEntry[] = [];

    init(store: LogStore): void {
        this.store = store;
        this.entries = store.get<LogEntry[]>(KEY, []).filter(e => typeof e.label === 'string' && typeof e.at === 'number');
    }

    record(label: string, file?: string, at: number = Date.now()): void {
        const clean = label.replace(/^CE:\s*/, '').replace(/\s*✓$/, '').trim();
        if (!clean) { return; }
        this.entries.push({ at, label: clean, file });
        if (this.entries.length > MAX) { this.entries.splice(0, this.entries.length - MAX); }
        void this.store?.update(KEY, this.entries);
    }

    /** The newest first. */
    list(): LogEntry[] { return [...this.entries].reverse(); }

    clear(): void { this.entries = []; void this.store?.update(KEY, []); }
}

export const actionLog = new ActionLog();
