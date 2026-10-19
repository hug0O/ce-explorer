import * as vscode from 'vscode';
import { reviewPlSqlText } from '../utils/plsqlReview';
import { PascalRoutine, reviewPascal } from '../utils/pascalReview';
import { reviewText } from '../utils/textReview';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { ClassMember, MemberKind } from '../models/types';
import { ReviewFinding, SEVERITY_LABEL, SEVERITY_ORDER } from '../utils/reviewTypes';

export type { ReviewFinding } from '../utils/reviewTypes';

/** A class of a form, frame or data module holds one field per component: its size says nothing about its design. */
const FORM_PARENT = /(Form|Frame|DataModule)$/i;

function routineOf(m: ClassMember, className?: string): PascalRoutine | undefined {
    const impl = m.implementationRange;
    if (!impl) { return undefined; }
    return {
        name: m.name, className,
        kind: m.kind === MemberKind.Constructor ? 'constructor' : m.kind === MemberKind.Destructor ? 'destructor' : m.returnType ? 'function' : 'procedure',
        returnType: m.returnType, params: m.parameters.map(p => p.name),
        isOverride: m.isOverride, isVirtual: m.isVirtual, start: impl.start.line, end: impl.end.line,
    };
}

/**
 * Pure analysis: returns all review findings for a document, in the order of the file. Decoupled from
 * any VS Code UI so it can be reused both by the command palette entry point
 * (`runCodeReview`) and by the inline analytics view in MemberViewerPanel.
 *
 * `error` stops a build or loses data; `warning` is very likely a bug or a risk; `info` is advice:
 * correct code that could be better.
 */
export function reviewDocument(document: vscode.TextDocument, provider: import('../providers/ILanguageProvider').ILanguageProvider): ReviewFinding[] {
    const findings: ReviewFinding[] = [];
    const parsed = provider.parseDocument(document);
    const fileName = document.fileName.split(/[/\\]/).pop() || document.fileName;
    const lang = provider.languageId;
    const lines = document.getText().split(/\r?\n/);

    // Rules that do not make sense for some languages: exported/struct fields
    // are idiomatic in Go/Rust, attribute-style fields in Python/JS, and PL/SQL
    // package variables have no accessor concept.
    const fieldEncapsulationApplies = !['go', 'rust', 'python', 'javascript', 'plsql'].includes(lang);

    for (const cls of parsed.classes) {
        const formClass = FORM_PARENT.test(cls.parentClass ?? '');
        const counted = formClass ? cls.members.filter(m => m.kind !== MemberKind.Field).length : cls.members.length;
        if (counted > 15) {
            findings.push({
                severity: 'warning', category: 'Size', message: `${cls.name} has ${counted} ${formClass ? 'methods and properties' : 'members'} (consider splitting)`,
                file: fileName, line: cls.range.start.line, className: cls.name,
                hint: 'A class with many responsibilities is hard to change: move some of them into their own class.',
            });
        }

        const stubs = cls.members.filter(m => {
            const lineText = lines[m.range.start.line] ?? '';
            return lineText.includes('todo!()') || lineText.includes('TODO') || lineText.includes('NotImplemented');
        });
        for (const s of stubs) {
            findings.push({ severity: 'info', category: 'Stub', message: `${s.name} has unimplemented body`, file: fileName, line: s.range.start.line, className: cls.name, memberName: s.name });
        }

        for (const m of cls.members) {
            // Pascal measures the implementation, which is elsewhere in the unit; the other languages the member itself.
            if (lang !== 'pascal') {
                const lineCount = m.range.end.line - m.range.start.line + 1;
                const owner = { file: fileName, line: m.range.start.line, className: cls.name, memberName: m.name };
                if (lineCount > 60) {
                    findings.push({ severity: 'warning', category: 'Complexity', message: `${m.name} is ${lineCount} lines long`, ...owner, hint: 'Split it into smaller methods, each with one job.' });
                } else if (lineCount > 30) {
                    findings.push({ severity: 'info', category: 'Complexity', message: `${m.name} is ${lineCount} lines long`, ...owner, hint: 'A method that fits on a screen is easier to read and to test.' });
                }
                if (m.parameters.length > 6) {
                    findings.push({ severity: 'info', category: 'Style', message: `${m.name} takes ${m.parameters.length} parameters`, ...owner, hint: 'Group related parameters in an object.' });
                }
            }
            if (fieldEncapsulationApplies && m.visibility === 'public' && m.kind === MemberKind.Field && !formClass) {
                findings.push({
                    severity: 'warning', category: 'Encapsulation', message: `Public field ${m.name} should be private with accessors`,
                    file: fileName, line: m.range.start.line, className: cls.name, memberName: m.name,
                    hint: 'Make it private and expose a property, so that its value can be checked and changed later without touching the callers.',
                });
            }
        }
    }

    if (lang === 'pascal') {
        const routines = [
            ...parsed.standaloneProcedures.map(m => routineOf(m)),
            ...parsed.classes.flatMap(c => c.members.map(m => routineOf(m, c.name))),
        ].filter((r): r is PascalRoutine => !!r);
        findings.push(...reviewPascal(lines, routines, fileName));
    }
    if (lang === 'plsql') {
        for (const f of reviewPlSqlText(document.getText())) {
            findings.push({ severity: f.severity, category: f.category, message: f.message, file: fileName, line: f.line, className: f.className, memberName: f.memberName });
        }
    }
    findings.push(...reviewText(lines, lang, fileName));

    // The order of the file, the most serious first on a line.
    return findings.sort((a, b) => a.line - b.line || SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export async function runCodeReview(registry: ProviderRegistry): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showWarningMessage('No active editor.'); return; }

    const provider = registry.getByDocument(editor.document);
    if (!provider) { vscode.window.showWarningMessage('No provider for this file.'); return; }

    const findings = reviewDocument(editor.document, provider);

    if (findings.length === 0) {
        vscode.window.showInformationMessage('No issues found!');
        return;
    }

    const items = findings.map(f => ({
        label: `${f.severity === 'error' ? '❌' : f.severity === 'warning' ? '⚠️' : '💡'} ${f.category}: ${f.message}`,
        description: `${SEVERITY_LABEL[f.severity]} · line ${f.line + 1}`,
        detail: f.hint,
        finding: f,
    }));

    const count = (s: ReviewFinding['severity']): number => findings.filter(f => f.severity === s).length;
    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: `${count('error')} error(s), ${count('warning')} warning(s), ${count('info')} advice`,
        matchOnDescription: true, matchOnDetail: true,
    });

    if (picked) {
        const f = picked.finding;
        const pos = new vscode.Position(f.line, f.col ?? 0);
        editor.selection = new vscode.Selection(pos, new vscode.Position(f.line, f.endCol ?? f.col ?? 0));
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    }
}
