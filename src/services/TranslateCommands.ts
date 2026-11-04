/**
 * `CE: Translate`: the selected text translated with a free web service that needs no
 * key (MyMemory). The answer is shown with two buttons: replace the text in the code, or copy it. The first time, the user is told what
 * is sent and where, and agrees once.
 */
import * as vscode from 'vscode';
import { trackedCommand } from './UsageStats';
import { LANGUAGES, TranslationMemory, isLanguageCode, translateAll } from '../utils/translate';
import { dfmTexts, restoreAccelerator, translationEdits, withoutAccelerator } from '../utils/dfmTexts';
import { resolveFormPair } from './FormCommands';

/** The most texts one form translation sends: the free service has a daily quota. */
const MAX_FORM_TEXTS = 150;

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

let output: vscode.OutputChannel | undefined;
/** What each translation used: the source and the target set, and the language the service found. */
const log = (): vscode.OutputChannel => (output ??= vscode.window.createOutputChannel('CE Translate'));

const nameOf = (code: string): string => (code === 'auto' ? 'the detected language' : LANGUAGES.find(l => l.code === code.toLowerCase())?.name ?? code);

export function registerTranslateCommands(context: vscode.ExtensionContext): void {
    const memory = new TranslationMemory();
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
        const selected = doc.getText(range);
        if (range.isEmpty || !selected.trim()) { void vscode.window.showInformationMessage('CE: select the text to translate.'); return; }
        const set = settings();
        const { target, email } = set;
        // the text is a translation made here: translate again from the original, in its own language, so the source does not follow the replaced text
        const known = memory.recall(selected);
        const text = known ? known.original : selected;
        const source = known ? known.source : set.source;
        if (known && known.source.toLowerCase() === target.toLowerCase()) {
            // back to the language of the original: no request, the original text is given back
            const back = await vscode.window.showInformationMessage('The original text, ' + nameOf(known.source), { modal: true, detail: known.original }, 'Replace', 'Copy');
            if (back === 'Replace') { await editor.edit(b => b.replace(range, known.original)); }
            else if (back === 'Copy') { await vscode.env.clipboard.writeText(known.original); }
            return;
        }
        if (source.toLowerCase() === target.toLowerCase()) { void vscode.window.showWarningMessage('CE: the text is said to be in ' + nameOf(source) + ' and is to be translated into ' + nameOf(target) + ': change one of the two (CE: Translate from... / into...).'); return; }
        if (!await agreed()) { return; }
        let way = nameOf(source) + ' → ' + nameOf(target) + (known ? ' (from the original text)' : '');
        const result = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'CE: translating, ' + way + '...' }, () => translateAll(text, source, target, email, get));
        if (result.text === undefined) { void vscode.window.showWarningMessage('CE: ' + (result.error ?? 'The text could not be translated.')); return; }
        // with a source left to the service, the language it found is told: it follows the text, not a setting
        if (source === 'auto' && result.detected) { way = nameOf(result.detected) + ' (detected) → ' + nameOf(target); }
        const used = source === 'auto' ? result.detected : source;
        if (used) { memory.remember(result.text, text, used); }
        log().appendLine(new Date().toISOString().slice(11, 19) + '  ' + source + ' | ' + target + (result.detected ? '  detected ' + result.detected : '') + '  (' + text.length + ' characters)');
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

    /** The captions, hints and titles of the form of this unit translated in one go, each one checked before it is written. */
    const runForm = async (): Promise<void> => {
        const pair = await resolveFormPair(vscode.window.activeTextEditor?.document);
        if (!pair) { void vscode.window.showWarningMessage('CE: open a .pas unit with its text .dfm (or the .dfm itself) to translate its form.'); return; }
        const dfmDoc = await vscode.workspace.openTextDocument(pair.dfm);
        const texts = dfmTexts(dfmDoc.getText());
        if (!texts.length) { void vscode.window.showInformationMessage('CE: this form has no caption, hint or title to translate.'); return; }
        const unique = [...new Set(texts.map(t => t.value))];
        if (unique.length > MAX_FORM_TEXTS) { void vscode.window.showWarningMessage('CE: this form has ' + unique.length + ' different texts, ' + MAX_FORM_TEXTS + ' at most for the free service: translate it by parts (select a text and use Translate).'); return; }
        const set = settings();
        let source = set.source;
        // short captions are badly recognised: the language they are written in is asked, not guessed
        if (source === 'auto') {
            const picked = await pickLanguage('The captions of this form are written in', 'fr', false);
            if (!picked) { return; }
            source = picked;
        }
        const target = set.target;
        if (source.toLowerCase() === target.toLowerCase()) { void vscode.window.showWarningMessage('CE: the form is said to be in ' + nameOf(source) + ' and is to be translated into ' + nameOf(target) + ': change one with Translate into / from.'); return; }
        const chars = unique.reduce((n, t) => n + t.length, 0);
        if (!await agreed()) { return; }
        const go = await vscode.window.showInformationMessage('Translate the form ' + nameOf(source) + ' → ' + nameOf(target) + '?', { modal: true, detail: texts.length + ' texts (' + unique.length + ' different, about ' + chars + ' characters) are sent to the translation service. You check each translation before anything is written in the .dfm.' }, 'Translate');
        if (go !== 'Translate') { return; }
        const done = new Map<string, string>();
        let failure: string | undefined;
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'CE: translating the form...', cancellable: true }, async (progress, token) => {
            let n = 0;
            for (const value of unique) {
                if (token.isCancellationRequested) { failure = 'Cancelled.'; return; }
                progress.report({ message: ++n + ' / ' + unique.length });
                const r = await translateAll(withoutAccelerator(value), source, target, set.email, get);
                if (r.text === undefined) { failure = r.error ?? 'A text could not be translated.'; return; }
                done.set(value, restoreAccelerator(value, r.text));
            }
        });
        if (failure && !done.size) { void vscode.window.showWarningMessage('CE: ' + failure); return; }
        log().appendLine(new Date().toISOString().slice(11, 19) + '  form ' + source + ' | ' + target + '  (' + done.size + ' texts)');
        const items = [...done].filter(([from, to]) => from !== to).map(([from, to]) => ({ label: to, description: from, detail: texts.filter(t => t.value === from).map(t => t.component + '.' + t.prop).slice(0, 4).join(', '), from, picked: true }));
        if (!items.length) { void vscode.window.showInformationMessage('CE: nothing changes: the texts are already in ' + nameOf(target) + '.'); return; }
        const chosen = await vscode.window.showQuickPick(items, { canPickMany: true, title: 'CE: ' + items.length + ' translation(s)' + (failure ? ' (stopped: ' + failure + ')' : '') + ' - untick what you do not want', placeHolder: 'The new text, the old one on the right' });
        if (!chosen?.length) { return; }
        const keep = new Map(chosen.map(c => [c.from, c.label]));
        const edit = new vscode.WorkspaceEdit();
        // read again: the file may have changed while the service answered
        const current = dfmTexts(dfmDoc.getText());
        for (const e of translationEdits(current, keep)) { edit.replace(pair.dfm, new vscode.Range(dfmDoc.positionAt(e.offset), dfmDoc.positionAt(e.offset + e.length)), e.text); }
        if (await vscode.workspace.applyEdit(edit)) { void vscode.window.showInformationMessage('CE: ' + chosen.length + ' text(s) of the form translated into ' + nameOf(target) + ' (Undo in the .dfm takes them back).'); }
    };

    context.subscriptions.push(
        trackedCommand('ce.translateForm', runForm),
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
