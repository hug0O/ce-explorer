import { MemberKind, Visibility } from '../models/types';

export type GroupMode = 'visibility' | 'kind' | 'alpha';

export interface SortableMember {
    name: string;
    kind: MemberKind;
    visibility: Visibility;
}

export interface CompiledFilter {
    active: boolean;
    regex?: RegExp;
    literal?: string;
}

const VISIBILITY_ORDER = [Visibility.Published, Visibility.Public, Visibility.Protected, Visibility.Private];

export function compileFilter(pattern: string): CompiledFilter {
    const trimmed = pattern.trim();
    if (!trimmed) {
        return { active: false };
    }
    try {
        return { active: true, regex: new RegExp(trimmed, 'i') };
    } catch {
        return { active: true, literal: trimmed.toLowerCase() };
    }
}

export function nameMatchesFilter(name: string, filter: CompiledFilter): boolean {
    if (!filter.active) {
        return true;
    }
    if (filter.regex) {
        return filter.regex.test(name);
    }
    return name.toLowerCase().includes(filter.literal ?? '');
}

function kindIndex(k: MemberKind): number {
    return Object.values(MemberKind).indexOf(k);
}

/**
 * Sort members according to the chosen grouping mode. Pure and side-effect free
 * so it can be unit-tested without a vscode instance.
 */
export function sortMembersForDisplay<T extends SortableMember>(members: T[], groupBy: GroupMode): T[] {
    return [...members].sort((a, b) => {
        if (groupBy === 'alpha') {
            return a.name.localeCompare(b.name);
        }
        if (groupBy === 'kind') {
            const ka = kindIndex(a.kind);
            const kb = kindIndex(b.kind);
            return ka !== kb ? ka - kb : a.name.localeCompare(b.name);
        }
        const va = VISIBILITY_ORDER.indexOf(a.visibility);
        const vb = VISIBILITY_ORDER.indexOf(b.visibility);
        if (va !== vb) { return va - vb; }
        const ka = kindIndex(a.kind);
        const kb = kindIndex(b.kind);
        if (ka !== kb) { return ka - kb; }
        return a.name.localeCompare(b.name);
    });
}
