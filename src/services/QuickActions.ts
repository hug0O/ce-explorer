/**
 * The quick actions menu (`CE: Quick actions`, Ctrl+K Ctrl+A): every command of the extension that makes sense for the file being edited,
 * grouped, with its shortcut. It is built from the package.json of the extension, so a command that is added there is offered without
 * touching this list; only the ones that cannot run from a menu (they need a tree item) are left out, and the ones of a language are
 * offered in the files of that language. Pure: nothing here knows VS Code.
 */
import { formatKeys, shortLabel } from '../webview/shortcutsSection';

export interface PackageLike {
    contributes?: {
        commands?: { command: string; title: string }[];
        keybindings?: { key: string; command: string; when?: string }[];
    };
}

export interface QuickContext {
    /** Extension of the file, with its dot, lower case (`.pas`). */
    ext: string;
    /** The language the extension reads the file as (`pascal`, `plsql`…). */
    languageId: string;
}

export interface QuickAction { command: string; label: string; group: string; keys?: string }

/** Commands that need a tree item or another command's arguments: not offered from a menu. */
export const NOT_FOR_MENUS = new Set([
    'ce.lensRun', 'ce.openMemberEditor', 'ce.navigateToMember', 'ce.clearFilter', 'ce.deleteMember', 'ce.moveMember', 'ce.batchMove',
    'ce.batchGenerateGettersSetters', 'ce.plsql.alignPreset', 'ce.delphi.designerFullScreen', 'ce.setLanguageTo', 'ce.statusMenu',
]);

/** Group of each command, in the order the menu shows them. */
export const GROUPS: { id: string; title: string; icon: string }[] = [
    { id: 'navigate', title: 'Navigate', icon: 'go-to-file' },
    { id: 'members', title: 'Members', icon: 'symbol-method' },
    { id: 'refactor', title: 'Variables and refactoring', icon: 'edit' },
    { id: 'review', title: 'Review and documentation', icon: 'checklist' },
    { id: 'delphi', title: 'Delphi forms', icon: 'symbol-misc' },
    { id: 'plsql', title: 'PL/SQL', icon: 'database' },
    { id: 'tools', title: 'Tools', icon: 'tools' },
];

const GROUP_OF: Record<string, string> = {
    'ce.goToMember': 'navigate', 'ce.goToWorkspaceMember': 'navigate', 'ce.manageMembers': 'navigate', 'ce.filterTree': 'navigate', 'ce.toggleGroupBy': 'navigate',
    'ce.refreshExplorer': 'navigate', 'ce.nav.pickMember': 'navigate', 'ce.nav.nextMember': 'navigate', 'ce.nav.prevMember': 'navigate', 'ce.nav.toggleDeclImpl': 'navigate', 'ce.blueprint.open': 'navigate',
    'ce.addMethod': 'members', 'ce.addField': 'members', 'ce.addProperty': 'members', 'ce.addConstructor': 'members', 'ce.editMember': 'members',
    'ce.synchronizeDeclImpl': 'members', 'ce.implementInterface': 'members', 'ce.generateGettersSetters': 'members', 'ce.insertTemplate': 'members', 'ce.manageTemplates': 'members',
    'ce.renameMember': 'refactor', 'ce.renameVariable': 'refactor', 'ce.renameLocalVariable': 'refactor', 'ce.changeVariableType': 'refactor', 'ce.changeLocalType': 'refactor',
    'ce.deleteVariable': 'refactor', 'ce.createLocalVariable': 'refactor', 'ce.declareLocalVariable': 'refactor', 'ce.extractMethod': 'refactor', 'ce.alignSelection': 'refactor',
    'ce.codeReview': 'review', 'ce.detectDeadCode': 'review', 'ce.generateDocumentation': 'review', 'ce.exportStructure': 'review', 'ce.insertDocHeader': 'review',
    'ce.addComponent': 'delphi', 'ce.addEventHandler': 'delphi',
    'ce.setLanguage': 'tools', 'ce.fixEncoding': 'tools', 'ce.memo.open': 'tools', 'ce.openGuide': 'tools', 'ce.delphi.project': 'tools',
};

const DELPHI_EXT = new Set(['.pas', '.dfm', '.dpr', '.dpk']);

export const groupOf = (command: string): string => GROUP_OF[command] ?? (command.startsWith('ce.delphi.') ? 'delphi' : command.startsWith('ce.plsql.') ? 'plsql' : 'tools');

/** Whether a command is offered for this file. */
export function appliesTo(command: string, ctx: QuickContext): boolean {
    if (NOT_FOR_MENUS.has(command)) { return false; }
    if (command === 'ce.delphi.project') { return true; }
    if (command.startsWith('ce.delphi.') || command === 'ce.addComponent' || command === 'ce.addEventHandler') { return DELPHI_EXT.has(ctx.ext); }
    if (command.startsWith('ce.plsql.')) { return ctx.languageId === 'plsql'; }
    return true;
}

/** The first shortcut of a command that is not tied to another language's files. */
function keysOf(pkg: PackageLike, command: string): string | undefined {
    const k = (pkg.contributes?.keybindings ?? []).find(b => b.command === command);
    return k ? formatKeys(k.key) : undefined;
}

/** The commands of the extension that apply to this file, in the order of the groups, each with its shortcut. */
export function quickActions(pkg: PackageLike, ctx: QuickContext): QuickAction[] {
    const out: QuickAction[] = [];
    for (const c of pkg.contributes?.commands ?? []) {
        if (!c.command.startsWith('ce.') || !appliesTo(c.command, ctx)) { continue; }
        out.push({ command: c.command, label: shortLabel(c.title), group: groupOf(c.command), keys: keysOf(pkg, c.command) });
    }
    const rank = (g: string): number => { const i = GROUPS.findIndex(x => x.id === g); return i < 0 ? GROUPS.length : i; };
    return out.sort((a, b) => rank(a.group) - rank(b.group) || a.label.localeCompare(b.label));
}
