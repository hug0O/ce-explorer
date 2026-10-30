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
/** The language the text is written in, picked with *Translate from*; 'auto' lets the service find it. */
const SOURCE_KEY = 'ce.translate.pickedSource';

async function get(url: string): Promise<unknown> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 12000);
    try {
        const res = await fetch(url, { signal: ctl.signal });
        if (!res.ok && res.status !== 429) { throw new Error('HTTP ' + res.status); }
        return await res.json();
    } finally { clearTimeout(timer); }
}

const nameOf = (code: string): string => (code === 'auto' ? 'the detected language' : LANGUAGES.find(l => l.code === code.toLowerCase())?.name ?? code);

export function registerTranslateCommands(context: vscode.ExtensionContext): void {
    const settings = (): { source: string; target: string; email: string } => {
        const c = vscode.workspace.getConfiguration('ce.translate');
        const target = (context.globalState.get<string>(TARGET_KEY, '') || c.get<string>('target', 'fr') || 'fr').trim();
        const source = (context.globalState.get<string>(SOURCE_KEY, '') || c.get<string>('source', 'auto') || 'auto').trim();
        return { source: source === 'auto' || isLanguageCode(source) ? source : 'auto', target: isLanguageCode(target) ? target : 'fr', email: (c.get<string>('email', '') || '').trim() };
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

    /** A list of languages (with, for the source, "detect it"), then a code typed when the language is not in the list. */
    const pickLanguage = async (title: string, current: string, withAuto: boolean): Promise<string | undefined> => {
        const items: (vscode.QuickPickItem & { code?: string })[] = [];
        if (withAuto) { items.push({ label: '$(search) Detect the language', description: 'auto' + (current === 'auto' ? '  (now)' : ''), detail: 'The service finds the language of the text: fine for a sentence, less sure for one word', code: 'auto' }); }
        for (const l of LANGUAGES) { items.push({ label: l.name, description: l.code + (l.code === current ? '  (now)' : ''), code: l.code }); }
        items.push({ label: '$(edit) Another language code...', description: 'en, pt-BR, ...' });
        const pick = await vscode.window.showQuickPick(items, { title, placeHolder: title });
        if (!pick) { return undefined; }
        if (pick.code) { return pick.code; }
        return (await vscode.window.showInputBox({ title: 'Language code', prompt: 'Two letters (fr, de, ja) or with a region (pt-BR)', validateInput: v => (isLanguageCode(v) ? undefined : 'A code such as fr or pt-BR') }))?.trim() || undefined;
    };

    const run = async (): Promise<void> => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { void vscode.window.showWarningMessage('CE: open a file, select a text and translate it.'); return; }
        const doc = editor.document;
        const range = editor.selection;
        const text = doc.getText(range);
        if (range.isEmpty || !text.trim()) { void vscode.window.showInformationMessage('CE: select the text to translate.'); return; }
        const { source, target, email } = settings();
        if (source.toLowerCase() === target.toLowerCase()) { void vscode.window.showWarningMessage('CE: the text is said to be in ' + nameOf(source) + ' and is to be translated into ' + nameOf(target) + ': change one of the two (CE: Translate from... / into...).'); return; }
        if (!await agreed()) { return; }
        const way = nameOf(source) + ' → ' + nameOf(target);
        const result = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'CE: translating, ' + way + '...' }, () => translateAll(text, source, target, email, get));
        if (result.text === undefined) { void vscode.window.showWarningMessage('CE: ' + (result.error ?? 'The text could not be translated.')); return; }
        const pick = await vscode.window.showInformationMessage('Translation, ' + way, { modal: true, detail: result.text }, 'Replace', 'Copy');
        if (pick === 'Replace') {
            const ok = await editor.edit(b => b.replace(range, result.text!));
            if (!ok) { void vscode.window.showWarningMessage('CE: the text could not be replaced (the file changed?).'); }
        } else if (pick === 'Copy') {
            await vscode.env.clipboard.writeText(result.text);
            vscode.window.setStatusBarMessage('CE: translation copied', 2500);
        }
    };

    /** After a choice of language: translate the selection when there is one, else just say what is set. */
    const thenRun = async (set: string): Promise<void> => {
        const e = vscode.window.activeTextEditor;
        if (e && !e.selection.isEmpty) { await run(); return; }
        const { source, target } = settings();
        vscode.window.setStatusBarMessage('CE: translate ' + nameOf(source) + ' → ' + nameOf(target) + ' (set ' + set + ', the other side is unchanged)', 5000);
    };

    context.subscriptions.push(
        trackedCommand('ce.translate', run),
        trackedCommand('ce.translateTo', async () => {
            const now = settings();
            const code = await pickLanguage('Translate into (from ' + nameOf(now.source) + ')', now.target, false);
            if (!code) { return; }
            await context.globalState.update(TARGET_KEY, code);
            await thenRun('into ' + nameOf(code));
        }),
        trackedCommand('ce.translateFrom', async () => {
            const now = settings();
            const code = await pickLanguage('The text is written in (into ' + nameOf(now.target) + ')', now.source, true);
            if (!code) { return; }
            await context.globalState.update(SOURCE_KEY, code);
            await thenRun('from ' + nameOf(code));
        }),
    );
}
