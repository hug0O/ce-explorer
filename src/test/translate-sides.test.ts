import { test } from 'node:test';
import assert from 'node:assert/strict';

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;
const store = new Map<string, unknown>();
const handlers = new Map<string, () => Promise<unknown>>();
const messages: string[] = [];
let nextPick = '';
const vscodeMock: any = {
    commands: { registerCommand: (id: string, fn: () => Promise<unknown>) => { handlers.set(id, fn); return { dispose() { /* nothing */ } }; } },
    workspace: { getConfiguration: () => ({ get: (_k: string, d: unknown) => d }) },
    window: {
        activeTextEditor: undefined,
        showQuickPick: async (items: { code?: string }[], o: { title: string }) => { messages.push('PICK ' + o.title); return items.find(i => i.code === nextPick); },
        showInformationMessage: async () => undefined, showWarningMessage: async () => undefined,
        setStatusBarMessage: (t: string) => { messages.push(t); }, showInputBox: async () => undefined,
    },
    ProgressLocation: { Notification: 15 },
};
nodeModule._load = (r: string, p: unknown, i: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, p, i));
const { registerTranslateCommands } = require('../services/TranslateCommands') as typeof import('../services/TranslateCommands');
const context: any = { subscriptions: [], globalState: { get: (k: string, d?: unknown) => (store.has(k) ? store.get(k) : d), update: async (k: string, v: unknown) => { store.set(k, v); } } };
registerTranslateCommands(context);

test('Translate into sets the target only, Translate from the source only: each says what the other side is', async () => {
    nextPick = 'en'; await handlers.get('ce.translateFrom')!();
    assert.equal(store.get('ce.translate.pickedSource'), 'en');
    assert.equal(store.get('ce.translate.pickedTarget'), undefined);
    nextPick = 'de'; await handlers.get('ce.translateTo')!();
    nextPick = 'fr'; await handlers.get('ce.translateTo')!();
    assert.equal(store.get('ce.translate.pickedSource'), 'en', 'the source is still English after two Translate into');
    assert.equal(store.get('ce.translate.pickedTarget'), 'fr');
    assert.ok(messages.includes('PICK Translate into (from English)'), 'the list says the source');
    assert.ok(messages.some(m => /translate English → French \(set into French, the other side is unchanged\)/.test(m)), messages.join(' | '));
    nextPick = 'auto'; await handlers.get('ce.translateFrom')!();
    assert.equal(store.get('ce.translate.pickedSource'), 'auto');
    assert.equal(store.get('ce.translate.pickedTarget'), 'fr', 'the target is still French after Translate from');
});
