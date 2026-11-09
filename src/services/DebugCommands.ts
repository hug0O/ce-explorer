/**
 * Debugging from the extension: the Delphi debugger (a debug adapter of its own, src/debug), and `CE: Debug this file`, one command that
 * starts the debugger that fits the language of the file (the Delphi one, or the debugger the language already has) with the same breakpoints.
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { trackedCommand } from './UsageStats';
import { NativeEngine } from '../debug/engine';
import { DapMessage, DelphiDebugSession } from '../debug/session';
import { delphiProgramFor } from '../debug/program';
import { baseName } from '../debug/mapFile';
import { debugConfigFor } from '../utils/debugConfig';

const DELPHI_TYPE = 'ce-delphi';

/** The debug adapter, in the extension's own process: VS Code hands it the messages of the protocol, it answers with its own. */
class InlineAdapter implements vscode.DebugAdapter {
    private readonly emitter = new vscode.EventEmitter<vscode.DebugProtocolMessage>();
    readonly onDidSendMessage = this.emitter.event;
    private readonly engine: NativeEngine;
    private readonly session: DelphiDebugSession;

    constructor(context: vscode.ExtensionContext, sourcePaths: string[]) {
        this.engine = new NativeEngine(context.asAbsolutePath(path.join('media', 'debug', 'engine.ps1')), context.asAbsolutePath(path.join('media', 'debug', 'CeDebugEngine.cs')));
        const cache = new Map<string, string | undefined>();
        this.session = new DelphiDebugSession({
            engine: this.engine,
            send: m => this.emitter.fire(m as unknown as vscode.DebugProtocolMessage),
            resolveSource: file => resolveSource(file, sourcePaths, cache),
        });
    }

    handleMessage(message: vscode.DebugProtocolMessage): void { void this.session.handle(message as unknown as DapMessage); }

    dispose(): void { this.engine.dispose(); this.emitter.dispose(); }
}

/** The file on disk for a name the map file gives: as it is, or in the source paths, or anywhere in the workspace. */
async function resolveSource(file: string, sourcePaths: string[], cache: Map<string, string | undefined>): Promise<string | undefined> {
    if (cache.has(file)) { return cache.get(file); }
    let found: string | undefined;
    if (path.isAbsolute(file) && fs.existsSync(file)) { found = file; }
    for (const dir of sourcePaths) {
        if (found) { break; }
        const candidate = path.join(dir, baseName(file));
        if (fs.existsSync(candidate)) { found = candidate; }
    }
    if (!found) {
        const hits = await vscode.workspace.findFiles('**/' + path.basename(file), '**/node_modules/**', 5);
        // the one that has the same name as the map writes it, by its ending
        found = (hits.find(u => u.fsPath.toLowerCase().endsWith(file.replace(/\//g, '\\').toLowerCase())) ?? hits[0])?.fsPath;
    }
    cache.set(file, found);
    return found;
}

/** What `F5` needs of a Delphi file: the program that was built, and where its map file is. */
function delphiConfiguration(config: vscode.DebugConfiguration, file: string | undefined): vscode.DebugConfiguration | undefined {
    if (config.program) { return config; }
    if (!file) { void vscode.window.showErrorMessage('CE: open a unit of the project to debug, or set "program" in the launch configuration.'); return undefined; }
    const found = delphiProgramFor(file, { exists: p => fs.existsSync(p), list: d => { try { return fs.readdirSync(d); } catch { return []; } } });
    if ('missing' in found) { void vscode.window.showErrorMessage('CE: ' + found.missing); return undefined; }
    return { ...config, program: found.program, mapFile: config.mapFile ?? found.map };
}

export function registerDebug(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.debug.registerDebugAdapterDescriptorFactory(DELPHI_TYPE, {
            createDebugAdapterDescriptor: session => new vscode.DebugAdapterInlineImplementation(new InlineAdapter(context, (session.configuration.sourcePaths as string[] | undefined) ?? [])),
        }),
        vscode.debug.registerDebugConfigurationProvider(DELPHI_TYPE, {
            resolveDebugConfiguration(_folder, config) {
                if (process.platform !== 'win32') { void vscode.window.showErrorMessage('CE: the Delphi debugger works on Windows.'); return undefined; }
                const doc = vscode.window.activeTextEditor?.document;
                return delphiConfiguration({ ...config, type: DELPHI_TYPE, request: 'launch', name: config.name || 'Delphi: debug the program' }, doc && /\.(pas|dpr|dpk|inc)$/i.test(doc.uri.fsPath) ? doc.uri.fsPath : undefined);
            },
        }),
        // a breakpoint on the line of the cursor, put by the API, so that it does not depend on the language the file is read as
        trackedCommand('ce.debug.toggleBreakpoint', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { void vscode.window.showWarningMessage('CE: open the file to put a breakpoint in first.'); return; }
            const uri = editor.document.uri;
            const line = editor.selection.active.line;
            const here = vscode.debug.breakpoints.filter(b => b instanceof vscode.SourceBreakpoint && b.location.uri.toString() === uri.toString() && b.location.range.start.line === line);
            if (here.length) { vscode.debug.removeBreakpoints(here); return; }
            vscode.debug.addBreakpoints([new vscode.SourceBreakpoint(new vscode.Location(uri, new vscode.Position(line, 0)))]);
        }),
        trackedCommand('ce.debug.start', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { void vscode.window.showWarningMessage('CE: open the file to debug first.'); return; }
            const doc = editor.document;
            const choice = debugConfigFor(doc.languageId, doc.uri.fsPath, doc.getText());
            if (!choice) { void vscode.window.showInformationMessage(`CE: there is no debugger for ${doc.languageId} files (Batch, PL/SQL and Markdown have none).`); return; }
            if (choice.extension && !vscode.extensions.getExtension(choice.extension.id)) {
                const pick = await vscode.window.showInformationMessage(`Debugging ${choice.label} needs the extension "${choice.extension.name}".`, 'Install it');
                if (pick === 'Install it') { await vscode.commands.executeCommand('workbench.extensions.installExtension', choice.extension.id); }
                return;
            }
            if (choice.note) { void vscode.window.setStatusBarMessage('CE: ' + choice.note, 6000); }
            const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
            await vscode.debug.startDebugging(folder, choice.config as vscode.DebugConfiguration);
        }),
    );
}
