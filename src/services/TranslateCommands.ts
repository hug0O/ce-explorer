/**
 * `CE: Translate`: the selected text translated with a free web service that needs no
 * key (MyMemory). The answer is shown with two buttons: replace the text in the code, or copy it. The first time, the user is told what
 * is sent and where, and agrees once.
 */
import * as vscode from 'vscode';
import { trackedCommand } from './UsageStats';
import { LANGUAGES, isLanguageCode, translateAll } from '../utils/translate';

const CONSENT_KEY = 'ce.translate.consent';
/** The language picked with *Translate into another language*: kept by the extension itself, so it needs no setting to be registered. */
const TARGET_KEY = 'ce.translate.pickedTarget';

async function get(url: string): Promise<unknown> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 12000);
    try {
        const res = await fetch(url, { signal: ctl.signal });
        if (!res.ok && res.status !== 429) { throw new Error('HTTP ' + res.status); }
        return await res.json();
    } finally { clearTimeout(timer); }
}

const nameOf = (code: string): string => LANGUAGES.find(l => l.code === code.toLowerCase())?.name ?? code;

export function registerTranslateCommands(context: vscode.ExtensionContext): void {
    const settings = (): { source: string; target: string; email: string } => {
        const c = vscode.workspace.getConfiguration('ce.translate');
        const picked = context.globalState.get<string>(TARGET_KEY, '');
        const target = (picked || c.get<string>('target', 'fr') || 'fr').trim();
        return { source: (c.get<string>('source', 'auto') || 'auto').trim(), target: isLanguageCode(target) ? target : 'fr', email: (c.get<string>('email', '') || '').trim() };
    };

    const agreed = async (): Promise<boolean> => {
        if (context.globalState.get<boolean>(CONSENT_KEY)) { return true; }
        const pick = await vscode.window.showInformationMessage(
            'Translate with a free web service?',
            { modal: true, detail: 'The text you translate is sent to MyMemory (api.mymemory.translated.net), a free translation service that needs no account. Nothing else of your code is sent. You are asked once.' },
            'Translate',
        );
        if (pick !== 'Translate') { return false; }
        await context.globalState.update(CONSENT_KEY, true);
        return true;
    };

    const run = async (): Promise<void> => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { void vscode.window.showWarningMessage('CE: open a file, select a text and translate it.'); return; }
        const doc = editor.document;
        const range = editor.selection;
        const text = doc.getText(range);
        if (range.isEmpty || !text.trim()) { void vscode.window.showInformationMessage('CE: select the text to translate.'); return; }
        if (!await agreed()) { return; }
        const { source, target, email } = settings();
        const result = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'CE: translating to ' + nameOf(target) + '...' }, () => translateAll(text, source, target, email, get));
        if (result.text === undefined) { void vscode.window.showWarningMessage('CE: ' + (result.error ?? 'The text could not be translated.')); return; }
        const pick = await vscode.window.showInformationMessage('Translation to ' + nameOf(target), { modal: true, detail: result.text }, 'Replace', 'Copy');
        if (pick === 'Replace') {
            const ok = await editor.edit(b => b.replace(range, result.text!));
            if (!ok) { void vscode.window.showWarningMessage('CE: the text could not be replaced (the file changed?).'); }
        } else if (pick === 'Copy') {
            await vscode.env.clipboard.writeText(result.text);
            vscode.window.setStatusBarMessage('CE: translation copied', 2500);
        }
    };

    context.subscriptions.push(
        trackedCommand('ce.translate', run),
        trackedCommand('ce.translateTo', async () => {
            const current = settings().target;
            const items: (vscode.QuickPickItem & { code?: string })[] = LANGUAGES.map(l => ({ label: l.name, description: l.code + (l.code === current ? '  (now)' : ''), code: l.code }));
            items.push({ label: '$(edit) Another language code...', description: 'en, pt-BR, ...' });
            const pick = await vscode.window.showQuickPick(items, { title: 'Translate into', placeHolder: 'The language the text is translated into' });
            if (!pick) { return; }
            let code = pick.code;
            if (!code) {
                code = (await vscode.window.showInputBox({ title: 'Language code', prompt: 'Two letters (fr, de, ja) or with a region (pt-BR)', validateInput: v => (isLanguageCode(v) ? undefined : 'A code such as fr or pt-BR') }))?.trim();
                if (!code) { return; }
            }
            await context.globalState.update(TARGET_KEY, code);
            await run();
        }),
    );
}
