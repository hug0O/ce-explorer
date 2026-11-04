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

export interface QuickAction {
    command: string;
    label: string;
    group: string;
    keys?: string;
    /** What the title says in brackets (`.dfm vs .pas`), shown under the label. */
    detail?: string;
    /** The plain words someone looks for it with (French and English), searched together with the label. */
    words: string;
}

/**
 * What people type to find a command: the everyday words, in French and English, that its title does not say. The words of the title and of
 * the command's name are searched too, so only what they miss is listed here.
 */
const WORDS: Record<string, string> = {
    'ce.addMethod': 'ajouter methode procedure fonction new create creer', 'ce.addField': 'ajouter champ variable attribut new create',
    'ce.addProperty': 'ajouter propriete property new create', 'ce.addConstructor': 'ajouter constructeur create new',
    'ce.synchronizeDeclImpl': 'synchroniser declaration implementation interface sync manquant missing stub', 'ce.editMember': 'modifier changer parametres signature params edit',
    'ce.moveMember': 'deplacer autre classe move', 'ce.extractMethod': 'extraire methode procedure selection refactor', 'ce.renameMember': 'renommer rename methode champ',
    'ce.rename': 'renommer rename changer nom variable methode classe projet partout everywhere',
    'ce.renameVariable': 'renommer variable parametre champ rename', 'ce.renameLocalVariable': 'renommer variable locale rename',
    'ce.createLocalVariable': 'variable locale creer var', 'ce.declareLocalVariable': 'declarer variable non declaree undeclared var',
    'ce.changeLocalType': 'type variable locale changer', 'ce.changeVariableType': 'type variable changer', 'ce.deleteVariable': 'supprimer variable inutilisee remove',
    'ce.insertTemplate': 'modele gabarit snippet template', 'ce.manageTemplates': 'modeles gabarits snippets templates',
    'ce.implementInterface': 'implementer interface surcharger override abstraite', 'ce.generateGettersSetters': 'accesseurs getter setter lecture ecriture propriete',
    'ce.insertDocHeader': 'documentation commentaire entete header doc', 'ce.exportStructure': 'exporter structure liste fichier export csv markdown',
    'ce.generateDocumentation': 'documentation generer doc markdown', 'ce.codeReview': 'revue relecture qualite problemes review lint',
    'ce.detectDeadCode': 'code mort inutilise non utilise unused dead', 'ce.alignSelection': 'aligner selection colonnes align',
    'ce.manageMembers': 'structure liste membres methodes champs ajouter filtrer members', 'ce.nav.pickMember': 'aller membre methode chercher goto find',
    'ce.goToMember': 'aller membre methode chercher goto', 'ce.goToWorkspaceMember': 'aller membre projet workspace chercher goto',
    'ce.nav.toggleDeclImpl': 'declaration implementation basculer interface', 'ce.nav.nextMember': 'suivant membre', 'ce.nav.prevMember': 'precedent membre',
    'ce.addComponent': 'ajouter composant bouton fiche form button', 'ce.addEventHandler': 'evenement gestionnaire onclick handler event',
    'ce.setLanguage': 'langage langue fichier language syntaxe', 'ce.fixEncoding': 'encodage accents caracteres utf8 ansi mojibake',
    'ce.delphi.project': 'projet analyse sql code mort taille statistiques insights hotspots', 'ce.blueprint.open': 'graphe appels diagramme carte blueprint',
    'ce.blueprint.project': 'graphe projet unites dependances uses imports', 'ce.memo.open': 'notes memo markdown bloc-notes',
    'ce.openGuide': 'aide guide documentation help', 'ce.openWalkthrough': 'demarrage debut tutoriel start', 'ce.showLog': 'journal log erreurs',
    'ce.showActionLog': 'historique journal modifications changes', 'ce.openSettings': 'reglages parametres options settings preferences',
    'ce.translate': 'traduire texte selection translate', 'ce.translateTo': 'traduire langue cible', 'ce.translateFrom': 'traduire langue source',
    'ce.translateForm': 'traduire fiche formulaire captions libelles dfm', 'ce.renamePreview': 'renommer projet partout apercu rename all files',
    'ce.usage.show': 'statistiques utilisation usage classement ranking', 'ce.markdown.open': 'markdown apercu editeur md', 'ce.markdown.new': 'nouvelle page markdown md',
    'ce.delphi.align': 'aligner composants taille espacement', 'ce.delphi.anchors': 'ancrage anchors docking redimensionner', 'ce.delphi.tabOrder': 'ordre tabulation tab',
    'ce.delphi.check': 'verifier fiche dfm pas gestionnaires incoherences domaines champs', 'ce.delphi.cleanHandlers': 'nettoyer gestionnaires vides evenements orphelins',
    'ce.delphi.copy': 'copier composants', 'ce.delphi.paste': 'coller composants', 'ce.delphi.duplicate': 'dupliquer composants',
    'ce.delphi.formFromFields': 'creer fiche champs formulaire', 'ce.delphi.formFromClass': 'creer fiche classe formulaire',
    'ce.delphi.changeClass': 'changer classe composant remplacer', 'ce.delphi.diffForm': 'comparer fiche git version differences',
    'ce.delphi.designer': 'concepteur fiche formulaire designer visuel', 'ce.delphi.toggleDesigner': 'basculer fiche code f12',
    'ce.delphi.showInDesigner': 'montrer composant fiche', 'ce.structure.showComponent': 'montrer composant structure',
    'ce.plsql.syncPackage': 'package spec body synchroniser', 'ce.plsql.newPackage': 'nouveau package', 'ce.plsql.sqlFromTable': 'generer sql table select insert update',
    'ce.plsql.utplsql': 'tests unitaires utplsql', 'ce.plsql.exceptionBlock': 'exception when others erreur', 'ce.plsql.extractProcedure': 'extraire procedure selection',
    'ce.plsql.docHeader': 'documentation entete pldoc', 'ce.plsql.findCallers': 'appelants qui appelle callers',
};

/** The words of a command's name (`ce.delphi.cleanHandlers` → `delphi clean handlers`). */
const idWords = (command: string): string => command.replace(/^ce\./, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[.]/g, ' ').toLowerCase();

/** Without accents and in lower case, so that « creer » finds « Créer ». */
export const fold = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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
    'ce.refreshExplorer': 'navigate', 'ce.nav.pickMember': 'navigate', 'ce.nav.nextMember': 'navigate', 'ce.nav.prevMember': 'navigate', 'ce.nav.toggleDeclImpl': 'navigate', 'ce.blueprint.open': 'navigate', 'ce.markdown.open': 'navigate', 'ce.markdown.new': 'navigate', 'ce.blueprint.project': 'navigate',
    'ce.addMethod': 'members', 'ce.addField': 'members', 'ce.addProperty': 'members', 'ce.addConstructor': 'members', 'ce.editMember': 'members',
    'ce.synchronizeDeclImpl': 'members', 'ce.implementInterface': 'members', 'ce.generateGettersSetters': 'members', 'ce.insertTemplate': 'members', 'ce.manageTemplates': 'members',
    'ce.renameMember': 'refactor', 'ce.renameVariable': 'refactor', 'ce.renameLocalVariable': 'refactor', 'ce.changeVariableType': 'refactor', 'ce.changeLocalType': 'refactor',
    'ce.deleteVariable': 'refactor', 'ce.createLocalVariable': 'refactor', 'ce.declareLocalVariable': 'refactor', 'ce.extractMethod': 'refactor', 'ce.alignSelection': 'refactor',
    'ce.codeReview': 'review', 'ce.detectDeadCode': 'review', 'ce.generateDocumentation': 'review', 'ce.exportStructure': 'review', 'ce.insertDocHeader': 'review',
    'ce.addComponent': 'delphi', 'ce.addEventHandler': 'delphi',
    'ce.setLanguage': 'tools', 'ce.fixEncoding': 'tools', 'ce.translate': 'tools', 'ce.usage.show': 'tools', 'ce.translateTo': 'tools', 'ce.translateFrom': 'tools', 'ce.translateForm': 'delphi', 'ce.renamePreview': 'refactor', 'ce.rename': 'refactor', 'ce.memo.open': 'tools', 'ce.openGuide': 'tools', 'ce.delphi.project': 'tools',
};

const DELPHI_EXT = new Set(['.pas', '.dfm', '.dpr', '.dpk']);

export const groupOf = (command: string): string => GROUP_OF[command] ?? (command.startsWith('ce.delphi.') ? 'delphi' : command.startsWith('ce.plsql.') ? 'plsql' : 'tools');

/** Whether a command is offered for this file. */
export function appliesTo(command: string, ctx: QuickContext): boolean {
    if (NOT_FOR_MENUS.has(command)) { return false; }
    if (command === 'ce.delphi.project') { return true; }
    if (command === 'ce.blueprint.project') { return DELPHI_EXT.has(ctx.ext); }
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
export function quickActions(pkg: PackageLike, ctx: QuickContext, counts: Record<string, number> = {}): QuickAction[] {
    const out: QuickAction[] = [];
    for (const c of pkg.contributes?.commands ?? []) {
        if (!c.command.startsWith('ce.') || !appliesTo(c.command, ctx)) { continue; }
        const detail = /\(([^)]+)\)\s*$/.exec(c.title.replace(/\s*\.{3}$/, ''))?.[1];
        out.push({ command: c.command, label: shortLabel(c.title), group: groupOf(c.command), keys: keysOf(pkg, c.command), detail, words: WORDS[c.command] ?? '' });
    }
    const rank = (g: string): number => { const i = GROUPS.findIndex(x => x.id === g); return i < 0 ? GROUPS.length : i; };
    // in a group, what this person runs most comes first, the rest by name
    return out.sort((a, b) => rank(a.group) - rank(b.group) || (counts[b.command] ?? 0) - (counts[a.command] ?? 0) || a.label.localeCompare(b.label));
}

/**
 * The actions that answer what was typed: every word typed must be found in the label, the plain words of the action, its name or its
 * group. A label that starts with a word, then one that holds it, then the plain words, come first; ties go to what is used most.
 */
export function searchActions(list: QuickAction[], query: string, counts: Record<string, number> = {}): QuickAction[] {
    const tokens = fold(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) { return list; }
    const scored: { x: QuickAction; score: number; i: number }[] = [];
    list.forEach((x, i) => {
        const label = fold(x.label);
        const rest = fold(x.words + ' ' + idWords(x.command) + ' ' + (x.detail ?? '') + ' ' + (GROUPS.find(g => g.id === x.group)?.title ?? ''));
        let score = 0;
        for (const t of tokens) {
            if (label.startsWith(t) || label.includes(' ' + t)) { score += 4; } else if (label.includes(t)) { score += 3; } else if (rest.includes(t)) { score += 1; } else { return; }
        }
        scored.push({ x, score, i });
    });
    return scored.sort((a, b) => b.score - a.score || (counts[b.x.command] ?? 0) - (counts[a.x.command] ?? 0) || a.i - b.i).map(s => s.x);
}
