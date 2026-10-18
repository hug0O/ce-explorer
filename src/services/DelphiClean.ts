/**
 * Like the Delphi IDE: an event handler that is left empty is removed (the
 * method, its declaration, and the `OnXxx = Handler` link in the .dfm). A
 * handler counts as empty only when its body holds nothing at all — a comment
 * or a blank statement is the user's content and keeps it alive.
 */
import { TextEdit } from './DelphiForm';
import { checkForm, fixIssue } from './DelphiCheck';

export interface CleanupPlan {
    pasEdits: TextEdit[];
    dfmEdits: TextEdit[];
    removed: string[];
}

export function emptyHandlerCleanup(pas: string, dfm: string): CleanupPlan | undefined {
    const issues = checkForm(pas, dfm).filter(i => i.category === 'Handlers' && i.handler
        && (i.fixes.includes('removeEmptyHandler') || i.fixes.includes('removeOrphan')));
    if (issues.length === 0) { return undefined; }
    const plan: CleanupPlan = { pasEdits: [], dfmEdits: [], removed: [] };
    const seen = new Set<string>();
    for (const issue of issues) {
        const key = issue.handler!.toLowerCase();
        if (seen.has(key)) { continue; }
        seen.add(key);
        const fix = issue.fixes.includes('removeEmptyHandler') ? 'removeEmptyHandler' : 'removeOrphan';
        const r = fixIssue(pas, dfm, issue, fix);
        if ('error' in r) { continue; }
        plan.pasEdits.push(...r.pasEdits);
        plan.dfmEdits.push(...r.dfmEdits);
        plan.removed.push(issue.handler!);
    }
    return plan.removed.length ? plan : undefined;
}
