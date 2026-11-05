/**
 * A small tip, one a day, offered at the top of the status bar menu: a useful thing the extension does that is easy to miss, with the
 * command that shows it. Pure: the day gives the tip.
 */
export interface Tip { text: string; command: string }

export const TIPS: Tip[] = [
    { text: 'Alt+G picks a member by typing a few letters.', command: 'ce.nav.pickMember' },
    { text: 'Alt+M filters Structure on the element under the cursor, used files included.', command: 'ce.structure.filterOnCursor' },
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

/** Features worth trying once, offered when they were never used: what they do, and the command that runs them. */
export interface Discovery extends Tip { delphi?: boolean }

export const DISCOVER: Discovery[] = [
    { text: 'Not tried yet: Rename changes a name in the whole project, after a preview.', command: 'ce.rename' },
    { text: 'Not tried yet: the Blueprint draws the calls of this file as a graph.', command: 'ce.blueprint.open' },
    { text: 'Not tried yet: Detect dead code lists what nothing uses.', command: 'ce.detectDeadCode' },
    { text: 'Not tried yet: Code review checks this file against the rules of its language.', command: 'ce.codeReview' },
    { text: 'Not tried yet: Check form finds what the .dfm and the .pas disagree on, and fixes it.', command: 'ce.delphi.check', delphi: true },
    { text: 'Not tried yet: Translate the form puts every caption in a memo, in another language.', command: 'ce.translateForm', delphi: true },
    { text: 'Not tried yet: the form designer edits the form as the IDE does.', command: 'ce.delphi.designer', delphi: true },
    { text: 'Not tried yet: the Memo keeps notes per language, as Markdown pages.', command: 'ce.memo.open' },
];

/**
 * A feature this person never ran, when they have used the extension enough to be past the first steps (ten uses): one a day among the ones
 * left, so the menu does not nag with the same one. `counts` is how many times each command ran.
 */
export function suggestion(counts: Record<string, number>, delphi: boolean, date: Date = new Date()): Discovery | undefined {
    const total = Object.values(counts).reduce((n, c) => n + c, 0);
    if (total < 10) { return undefined; }
    const left = DISCOVER.filter(d => (delphi || !d.delphi) && !counts[d.command]);
    if (!left.length) { return undefined; }
    const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
    return left[((day % left.length) + left.length) % left.length];
}
