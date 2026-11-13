/**
 * The pictures of the sidebar for the README (media/readme/structure.png and used.png): the real pages of the sidebar on the made-up unit
 * test-fixtures/large_unit.pas, in a headless browser.  `npx tsx tools/guide/sidebar.ts`
 */
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer-core';

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;

class FakePosition { constructor(public line: number, public character: number) { } }
class FakeRange {
    start: any; end: any;
    constructor(a: any, b: any, c?: number, d?: number) {
        if (c === undefined) { this.start = a; this.end = b; } else { this.start = { line: a, character: b }; this.end = { line: c, character: d }; }
    }
    contains(p: any) { return p.line >= this.start.line && p.line <= this.end.line; }
}
const mkUri = (p: string) => ({ fsPath: p, path: p, scheme: 'file', toString: () => p });
const noopEvent = () => ({ dispose() { } });
const root = path.resolve(__dirname, '..', '..');
const file = path.join(root, 'test-fixtures', 'large_unit.pas');
const text = fs.readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/);
const doc = {
    uri: mkUri(file), fileName: file, languageId: 'pascal', version: 1, lineCount: lines.length,
    lineAt: (i: number) => ({ text: lines[i] ?? '' }), getText: () => text,
    positionAt: (o: number) => { const b = text.slice(0, o).split(/\r?\n/); return { line: b.length - 1, character: b[b.length - 1].length }; },
};
const vscodeMock = {
    Uri: { file: mkUri, parse: mkUri, joinPath: (u: any, ...p: string[]) => mkUri(path.join(u.fsPath, ...p)) },
    Position: FakePosition, Range: FakeRange,
    WorkspaceEdit: class { replace() { } insert() { } delete() { } },
    EndOfLine: { LF: 0 },
    window: {
        activeTextEditor: { document: doc, selection: { active: new FakePosition(0, 0) } } as any,
        onDidChangeTextEditorSelection: noopEvent, onDidChangeActiveTextEditor: noopEvent,
        showWarningMessage: async () => undefined, showInformationMessage: async () => undefined,
    },
    workspace: {
        textDocuments: [doc], onDidChangeTextDocument: noopEvent, onDidSaveTextDocument: noopEvent,
        getConfiguration: () => ({ get: (_k: string, d?: unknown) => d }), asRelativePath: (u: any) => path.basename(u.fsPath ?? String(u)),
    },
    commands: { executeCommand: async () => undefined },
    env: { clipboard: { writeText: async () => undefined } },
};
nodeModule._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

const { MemberViewerPanel } = require('../../src/webview/MemberViewerPanel');
const { PascalLanguageProvider } = require('../../src/providers/PascalLanguageProvider');
const { outsidePageHtml } = require('../../src/webview/manageSection');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const THEME = `:root { --vscode-font-family: 'Segoe UI', sans-serif; --vscode-font-size: 13px; --vscode-foreground: #cccccc; --vscode-descriptionForeground: #9d9d9d;
  --vscode-editor-background: #252526; --vscode-editorWidget-background: #252526; --vscode-panel-border: #3c3c3c; --vscode-focusBorder: #007fd4;
  --vscode-input-background: #3c3c3c; --vscode-input-foreground: #cccccc; --vscode-input-border: #3c3c3c;
  --vscode-button-background: #0e639c; --vscode-button-foreground: #ffffff; --vscode-button-secondaryBackground: #3a3d41; --vscode-button-secondaryForeground: #ffffff; --vscode-button-secondaryHoverBackground: #45494e;
  --vscode-list-hoverBackground: #2a2d2e; --vscode-list-activeSelectionBackground: #094771; --vscode-list-activeSelectionForeground: #ffffff;
  --vscode-textBlockQuote-background: rgba(127,127,127,0.1); --vscode-badge-background: #4d4d4d; --vscode-badge-foreground: #ffffff;
  --vscode-editor-font-family: Consolas, monospace; --vscode-textLink-foreground: #3794ff; }`;

function standalone(html: string): string {
    return html.replace(/ nonce="[^"]*"/g, '').replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '')
        .replace(/acquireVsCodeApi\(\)/g, '({ postMessage: function () {}, getState: function () { return {}; }, setState: function () {} })')
        .replace('</head>', '<style>' + THEME + '</style></head>');
}

async function main(): Promise<void> {
    const provider = new PascalLanguageProvider();
    const parsed = provider.parseDocument(doc);
    const cls = parsed.classes.find((c: any) => c.name === 'TOrderBook');
    const panel = new MemberViewerPanel({} as any, { getByDocument: () => provider }, { getParsedDocument: () => parsed } as any, {} as any, { subscriptions: [] } as any) as any;
    panel._state = { member: cls.members.find((m: any) => m.name === 'FOrderBookCount'), classInfo: cls, provider };
    panel._tab = 'manage';
    const structure = standalone(panel.getHtml());

    // the Used tab: what this unit uses from the units it names, each under the routine that uses it
    const find = (needle: string): number => lines.findIndex(l => l.includes(needle));
    const use = (label: string, from: string, originLine: number, hits: [string, string][]): any => ({
        label, kind: 'method', count: hits.length, line: find(hits[0][1]), more: 0, canOpen: true, originFile: from, originLine,
        uses: hits.map(([parent, needle]) => ({ line: find(needle), text: lines[find(needle)].trim(), parent, parentLine: lines.findIndex(l => l.includes(parent + '(')) })),
    });
    const rows = [
        use('FreeAndNil', 'System.SysUtils.pas', 3120, [['fComputeSalePrice', 'FreeAndNil(oQuery)']]),
        use('IntToStr', 'System.SysUtils.pas', 2710, [['fGet_Order_Label', "'Order ' + IntToStr"], ['fGet_Stock_Label', "'Stock ' + IntToStr"]]),
        use('TDataSet.Open', 'Data.DB.pas', 1844, [['fComputeSalePrice', 'oQuery.Open']]),
        use('TDataSet.FieldByName', 'Data.DB.pas', 1902, [['pArchive_Order', "FieldByName('REASON')"]]),
        use('TDataSet.Eof', 'Data.DB.pas', 1790, [['fCount_Order', 'while not aQuery.Eof']]),
    ];
    panel._tab = 'outside';
    panel.getOutsideHtml = () => outsidePageHtml({ rows, ready: true, file: 'large_unit.pas', local: panel.localRows(), view: 'outside', filter: '' });
    let used = '';
    try { used = standalone(panel.getHtml()); } catch (e) { console.log('used: ' + (e as Error).message); }

    const out = path.join(root, 'media', 'readme');
    fs.mkdirSync(out, { recursive: true });
    const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--hide-scrollbars'] });
    const page = await browser.newPage();
    page.on('pageerror', e => console.log('page error: ' + (e as Error).message));
    await page.setViewport({ width: 420, height: 640, deviceScaleFactor: 2 });
    for (const [name, html] of [['structure', structure], ['used', used]] as const) {
        if (!html) { continue; }
        await page.setContent(html, { waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 400));
        fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 420, height: name === 'used' ? 340 : 640 } })));
        console.log(name + '.png');
    }
    await browser.close();
}

void main();
