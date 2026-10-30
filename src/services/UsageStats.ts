/**
 * The counting of what is used, kept in the extension's own storage on this machine (nothing is sent). `trackedCommand` is the way the
 * extension registers its commands: it counts each run. Features of the pages (designer, sidebar, blueprint) are counted with `usage.hit`.
 */
import * as vscode from 'vscode';
import { UsageData, emptyUsage, record, sanitize } from '../utils/usageStats';

const KEY = 'ce.usage';

class UsageTracker {
    private store: vscode.Memento | undefined;
    private data: UsageData = emptyUsage(Date.now());
    private timer: ReturnType<typeof setTimeout> | undefined;

    /** Starts counting on top of what the previous sessions counted. */
    attach(store: vscode.Memento): void {
        this.store = store;
        this.data = sanitize(store.get<unknown>(KEY), Date.now());
    }

    hit(key: string): void {
        record(this.data, key, Date.now());
        if (this.timer) { return; }
        this.timer = setTimeout(() => { this.timer = undefined; void this.flush(); }, 5000);
    }

    snapshot(): UsageData { return this.data; }

    async flush(): Promise<void> {
        if (this.timer) { clearTimeout(this.timer); this.timer = undefined; }
        try { await this.store?.update(KEY, this.data); } catch { /* the counting is a nicety: never a failure */ }
    }

    async reset(): Promise<void> {
        this.data = emptyUsage(Date.now());
        await this.flush();
    }
}

export const usage = new UsageTracker();

/** `vscode.commands.registerCommand`, counting each run of the command. */
export function trackedCommand(id: string, callback: (...args: any[]) => unknown, thisArg?: unknown): vscode.Disposable {
    return vscode.commands.registerCommand(id, (...args: unknown[]) => {
        try { usage.hit(id); } catch { /* never in the way of the command */ }
        return callback.apply(thisArg, args);
    });
}

/** Messages of the pages that say nothing about a feature being used: the page is ready, a position is saved, the mouse moves, a filter is typed. */
const NOISE = /^(ready|positions|position|ui|ui[A-Z].*|setUi|saveUi|hover|select|selection|selectComponent|scroll|filter.*|setFilter|search.*|memoSave|memoMode|memoLang|shortcutFilter|log|ping|cursor|zoom|pan|loading|state|draft|blocks|resetLayout|subsetLayout)$/;

/** Counts a feature of a page (`designer:addEvent`, `sidebar:runAnalytics`...) from the message the page sent. */
export function hitMessage(area: string, kind: unknown): void {
    if (typeof kind !== 'string' || !/^[A-Za-z][\w.-]{0,40}$/.test(kind) || NOISE.test(kind)) { return; }
    try { usage.hit(area + ':' + kind); } catch { /* never in the way of the page */ }
}
