/**
 * The keys of the quick navigation mode: a vi-like mode for moving in the code with single letters, where the letters that vi keeps for
 * editing do what this extension does best (members, the structure, the form designer, the review). One table says what each key does,
 * and it feeds the keys parser, the help list and the Shortcuts tab. Pure: nothing here knows VS Code.
 */

export type NavGroup = 'move' | 'members' | 'go' | 'search' | 'extension' | 'fold' | 'leave';

export interface NavKey {
    /** What is typed: one character, or two (`gd`). */
    keys: string;
    id: string;
    label: string;
    group: NavGroup;
    /** A number typed before the key repeats it (`5j`). */
    repeat?: boolean;
}

export const NAV_GROUPS: { id: NavGroup; title: string }[] = [
    { id: 'move', title: 'Move' },
    { id: 'members', title: 'Members of the file' },
    { id: 'go', title: 'Go to' },
    { id: 'search', title: 'Search' },
    { id: 'extension', title: 'Code Explorer' },
    { id: 'fold', title: 'Fold' },
    { id: 'leave', title: 'Leave the mode' },
];

export const NAV_KEYS: NavKey[] = [
    { keys: 'h', id: 'left', label: 'Left', group: 'move', repeat: true },
    { keys: 'j', id: 'down', label: 'Down', group: 'move', repeat: true },
    { keys: 'k', id: 'up', label: 'Up', group: 'move', repeat: true },
    { keys: 'l', id: 'right', label: 'Right', group: 'move', repeat: true },
    { keys: 'w', id: 'wordRight', label: 'Next word', group: 'move', repeat: true },
    { keys: 'b', id: 'wordLeft', label: 'Previous word', group: 'move', repeat: true },
    { keys: '0', id: 'lineStart', label: 'Start of the line', group: 'move' },
    { keys: '$', id: 'lineEnd', label: 'End of the line', group: 'move' },
    { keys: 'gg', id: 'top', label: 'Top of the file (5gg: line 5)', group: 'move' },
    { keys: 'G', id: 'bottom', label: 'Bottom of the file (5G: line 5)', group: 'move' },
    { keys: 'J', id: 'pageDown', label: 'Page down', group: 'move', repeat: true },
    { keys: 'K', id: 'pageUp', label: 'Page up', group: 'move', repeat: true },
    { keys: '}', id: 'nextMember', label: 'Next member (method, field, property...)', group: 'members', repeat: true },
    { keys: '{', id: 'prevMember', label: 'Previous member', group: 'members', repeat: true },
    { keys: ']]', id: 'nextMember', label: 'Next member', group: 'members', repeat: true },
    { keys: '[[', id: 'prevMember', label: 'Previous member', group: 'members', repeat: true },
    { keys: 'S', id: 'goToMember', label: 'Pick a member of the file', group: 'members' },
    { keys: 'gd', id: 'definition', label: 'Definition', group: 'go' },
    { keys: 'gr', id: 'references', label: 'References', group: 'go' },
    { keys: 'gi', id: 'implementation', label: 'Implementation', group: 'go' },
    { keys: 'H', id: 'back', label: 'Back (where the cursor was)', group: 'go' },
    { keys: 'L', id: 'forward', label: 'Forward', group: 'go' },
    { keys: '/', id: 'find', label: 'Find in the file', group: 'search' },
    { keys: 'n', id: 'findNext', label: 'Next match', group: 'search', repeat: true },
    { keys: 'N', id: 'findPrev', label: 'Previous match', group: 'search', repeat: true },
    { keys: '*', id: 'findWord', label: 'Find the word under the cursor', group: 'search' },
    { keys: 's', id: 'actions', label: 'Quick actions', group: 'extension' },
    { keys: 'm', id: 'structure', label: 'Structure of the file', group: 'extension' },
    { keys: 'M', id: 'workspaceMember', label: 'Go to a member of the workspace', group: 'extension' },
    { keys: 'e', id: 'editMember', label: 'Edit the member under the cursor', group: 'extension' },
    { keys: 'r', id: 'rename', label: 'Rename the symbol under the cursor', group: 'extension' },
    { keys: 'd', id: 'designer', label: 'Designer <-> code (Delphi)', group: 'extension' },
    { keys: 'c', id: 'review', label: 'Code review', group: 'extension' },
    { keys: 't', id: 'template', label: 'Insert a template', group: 'extension' },
    { keys: 'T', id: 'memo', label: 'Memo', group: 'extension' },
    { keys: ':', id: 'palette', label: 'Command palette', group: 'extension' },
    { keys: 'u', id: 'undo', label: 'Undo', group: 'extension' },
    { keys: '?', id: 'help', label: 'This list', group: 'extension' },
    { keys: 'za', id: 'foldToggle', label: 'Fold / unfold here', group: 'fold' },
    { keys: 'zo', id: 'unfold', label: 'Unfold here', group: 'fold' },
    { keys: 'zc', id: 'fold', label: 'Fold here', group: 'fold' },
    { keys: 'zR', id: 'unfoldAll', label: 'Unfold everything', group: 'fold' },
    { keys: 'zM', id: 'foldAll', label: 'Fold everything', group: 'fold' },
    { keys: 'i', id: 'insert', label: 'Edit here (leave the mode)', group: 'leave' },
    { keys: 'a', id: 'append', label: 'Edit after the cursor', group: 'leave' },
    { keys: 'A', id: 'appendEnd', label: 'Edit at the end of the line', group: 'leave' },
    { keys: 'I', id: 'insertStart', label: 'Edit at the start of the line', group: 'leave' },
    { keys: 'o', id: 'openBelow', label: 'New line below, and edit', group: 'leave' },
    { keys: 'O', id: 'openAbove', label: 'New line above, and edit', group: 'leave' },
];

/** The first characters of the two-key sequences. */
export const NAV_PREFIXES = new Set(NAV_KEYS.filter(k => k.keys.length === 2).map(k => k.keys[0]));

const BY_KEYS = new Map(NAV_KEYS.map(k => [k.keys, k] as [string, NavKey]));

export interface NavAction { id: string; count: number }

/** Reads what is typed, one character at a time: `5j`, `gd`, `12G`. */
export class NavKeyParser {
    private count = '';
    private prefix = '';

    /** The action completed by this character, if any, and what is waiting for its second key or its number. */
    feed(ch: string): { action?: NavAction; pending: string } {
        if (this.prefix) {
            const seq = this.prefix + ch;
            this.prefix = '';
            const key = BY_KEYS.get(seq);
            const n = this.take();
            return key ? { action: { id: key.id, count: n }, pending: '' } : { pending: '' };
        }
        if (/[1-9]/.test(ch) || (ch === '0' && this.count)) { this.count += ch; return { pending: this.count }; }
        if (NAV_PREFIXES.has(ch)) { this.prefix = ch; return { pending: this.count + ch }; }
        const key = BY_KEYS.get(ch);
        const n = this.take();
        return key ? { action: { id: key.id, count: n }, pending: '' } : { pending: '' };
    }

    reset(): void { this.count = ''; this.prefix = ''; }

    private take(): number {
        const n = this.count ? Math.min(999, Number(this.count)) : 0;
        this.count = '';
        return n;
    }
}
