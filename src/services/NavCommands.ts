import * as vscode from 'vscode';
import { CodeExplorerService } from './CodeExplorerService';
import { MemberRanges, declImplTarget, memberLines, stepMember } from './MemberNav';

/**
 * Moving through the members of a file from the keyboard, without a mode: Ctrl+Shift+Down / Ctrl+Shift+Up to the next / previous member,
 * Alt+Enter from a declaration to its implementation and back, Alt+G to pick a member by typing a few letters, the code scrolling to each
 * one as the list moves (Esc brings you back where you were).
 */
export function registerNavCommands(context: vscode.ExtensionContext, explorer: CodeExplorerService): void {
    const say = (text: string): void => { vscode.window.setStatusBarMessage('CE: ' + text, 2500); };

    const go = (editor: vscode.TextEditor, pos: vscode.Position): void => {
        const at = new vscode.Position(pos.line, editor.document.lineAt(pos.line).firstNonWhitespaceCharacterIndex);
        editor.selection = new vscode.Selection(at, at);
        editor.revealRange(new vscode.Range(at, at), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    };

    const step = (dir: 1 | -1) => async (): Promise<void> => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }
        const symbols = explorer.listAllSymbols();
        const lines = memberLines(symbols.map(s => s.position));
        const target = stepMember(lines, editor.selection.active.line, dir);
        if (target === undefined) { say('no member found in this file'); return; }
        go(editor, new vscode.Position(target, 0));
        const at = lines.indexOf(target) + 1;
        const name = symbols.find(s => s.position.line === target)?.label ?? '';
        say(`member ${at}/${lines.length}: ${name}`);
    };

    context.subscriptions.push(
        vscode.commands.registerCommand('ce.nav.nextMember', step(1)),
        vscode.commands.registerCommand('ce.nav.prevMember', step(-1)),

        vscode.commands.registerCommand('ce.nav.toggleDeclImpl', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { return; }
            const parsed = explorer.getParsedDocument(editor.document);
            if (!parsed) { say('this file is not read by Code Explorer'); return; }
            const members: MemberRanges[] = [];
            for (const c of parsed.classes) { for (const m of c.members) { members.push({ name: m.name, range: m.range, implementationRange: m.implementationRange }); } }
            for (const m of parsed.standaloneProcedures) { members.push({ name: m.name, range: m.range, implementationRange: m.implementationRange }); }
            const t = declImplTarget(members, editor.selection.active.line);
            if (!t) { say('no declaration / implementation pair here'); return; }
            go(editor, new vscode.Position(t.position.line, t.position.character));
            say(`${t.kind} of ${t.name}`);
        }),

        vscode.commands.registerCommand('ce.nav.pickMember', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { return; }
            const symbols = explorer.listAllSymbols();
            if (!symbols.length) { say('no member found in this file'); return; }
            type Item = vscode.QuickPickItem & { position: vscode.Position };
            const items: Item[] = symbols.map(s => ({ label: s.label, description: s.description, detail: `line ${s.position.line + 1}`, position: s.position }));
            const before = { selections: editor.selections, visible: editor.visibleRanges[0] };
            const qp = vscode.window.createQuickPick<Item>();
            qp.items = items;
            qp.placeholder = 'A few letters of a member: the code shows it as you move, Enter goes there, Esc goes back';
            qp.matchOnDescription = true;
            let accepted = false;
            qp.onDidChangeActive(active => {
                const it = active[0];
                if (it) { editor.revealRange(new vscode.Range(it.position, it.position), vscode.TextEditorRevealType.InCenter); }
            });
            qp.onDidAccept(() => {
                const it = qp.activeItems[0];
                if (it) { accepted = true; go(editor, it.position); }
                qp.hide();
            });
            qp.onDidHide(() => {
                if (!accepted) {
                    editor.selections = before.selections;
                    if (before.visible) { editor.revealRange(before.visible, vscode.TextEditorRevealType.AtTop); }
                }
                qp.dispose();
            });
            qp.show();
        }),
    );
}
