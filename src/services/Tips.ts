/**
 * A small tip, one a day, offered at the top of the status bar menu: a useful thing the extension does that is easy to miss, with the
 * command that shows it. Pure: the day gives the tip.
 */
export interface Tip { text: string; command: string }

export const TIPS: Tip[] = [
    { text: 'Alt+G picks a member by typing a few letters.', command: 'ce.nav.pickMember' },
    { text: 'Ctrl+Shift+Down / Up jump to the next / previous member or heading.', command: 'ce.nav.nextMember' },
    { text: 'Alt+Enter goes from a declaration to its implementation and back.', command: 'ce.nav.toggleDeclImpl' },
    { text: 'Ctrl+K Ctrl+A lists every command that suits this file.', command: 'ce.showActions' },
    { text: 'The Blueprint draws the calls of a file as a graph you can edit.', command: 'ce.blueprint.open' },
    { text: 'File | Project in the Blueprint switches to the units of the whole project.', command: 'ce.blueprint.project' },
    { text: 'The Structure list: arrows move, Enter goes there, F2 renames, E edits, Delete removes.', command: 'ce.manageMembers' },
    { text: 'The Memo keeps your notes: main.md and as many memos as you create.', command: 'ce.memo.open' },
    { text: 'The user guide has pictures and animations of every feature.', command: 'ce.openGuide' },
    { text: 'CE: Settings opens the few options of the extension.', command: 'ce.openSettings' },
];

/** The tip of a day (any date): the same all day, the next one tomorrow. */
export function tipOfTheDay(date: Date = new Date()): Tip {
    const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
    return TIPS[((day % TIPS.length) + TIPS.length) % TIPS.length];
}
