/**
 * Compiling a Delphi project from VS Code: a task (`Ctrl+Shift+B`, the Terminal > Run Build Task menu) that runs MSBuild on the `.dproj` with the
 * environment of the RAD Studio installed, errors and warnings going to the Problems panel, and the same build run before the debugger starts.
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { trackedCommand } from './UsageStats';
import { BuildOptions, Probe, buildCommandLine, dprojFor, findRsvars } from '../utils/delphiBuild';

export const BUILD_TYPE = 'ce-delphi';

type Target = BuildOptions['target'];

function settings(): { rsvars: string; config: string; platform: string; project: string } {
    const c = vscode.workspace.getConfiguration('ce.delphi');
    return { rsvars: c.get<string>('rsvars', '').trim(), config: c.get<string>('buildConfig', 'Debug') || 'Debug', platform: c.get<string>('platform', 'Win32') || 'Win32', project: c.get<string>('project', '').trim() };
}

function query(key: string): Promise<string> {
    return new Promise(resolve => {
        execFile('reg', ['query', key, '/s', '/v', 'RootDir'], { windowsHide: true }, (_e, stdout) => resolve(stdout ?? ''));
    });
}

/** What is known of the machine: the environment, the registry of RAD Studio (the user's and the machine's), the folders. */
async function probe(): Promise<Probe> {
    const registry = process.platform === 'win32'
        ? (await query('HKCU\\Software\\Embarcadero\\BDS')) + '\n' + (await query('HKLM\\SOFTWARE\\WOW6432Node\\Embarcadero\\BDS')) + '\n' + (await query('HKLM\\SOFTWARE\\Embarcadero\\BDS'))
        : '';
    return {
        env: process.env,
        registry,
        exists: p => fs.existsSync(p),
        listDirs: d => { try { return fs.readdirSync(d); } catch { return []; } },
    };
}

const files = { exists: (p: string) => fs.existsSync(p), list: (d: string) => { try { return fs.readdirSync(d); } catch { return [] as string[]; } } };

/** The `.dproj` to build: the setting, the one of the open unit, or the first of the workspace. */
async function projectFile(explicit?: string): Promise<string | undefined> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const given = explicit || settings().project;
    if (given) { return path.isAbsolute(given) ? given : root ? path.join(root, given) : given; }
    const doc = vscode.window.activeTextEditor?.document;
    const near = doc && /\.(pas|dpr|dpk|dfm|dproj)$/i.test(doc.uri.fsPath) ? dprojFor(doc.uri.fsPath, files) : undefined;
    if (near) { return near; }
    return (await vscode.workspace.findFiles('**/*.dproj', '**/node_modules/**', 1))[0]?.fsPath;
}

export interface BuildDefinition extends vscode.TaskDefinition { task?: string; project?: string; config?: string; platform?: string }

/** The task that builds the project; undefined (with the reason shown) when there is no Delphi or no project. */
export async function buildTask(def: BuildDefinition, quiet = false): Promise<vscode.Task | undefined> {
    const s = settings();
    const fail = (m: string): undefined => { if (!quiet) { void vscode.window.showErrorMessage('CE: ' + m); } return undefined; };
    const dproj = await projectFile(def.project);
    if (!dproj) { return fail('no Delphi project (.dproj) found: open a unit of the project, or set ce.delphi.project.'); }
    const rsvars = findRsvars(s.rsvars, await probe());
    if (!rsvars) {
        if (!quiet) {
            void vscode.window.showErrorMessage('CE: RAD Studio was not found (rsvars.bat). Set its path in the setting ce.delphi.rsvars.', 'Open the setting').then(p => { if (p) { void vscode.commands.executeCommand('workbench.action.openSettings', 'ce.delphi.rsvars'); } });
        }
        return undefined;
    }
    const target: Target = def.task === 'rebuild' ? 'Rebuild' : def.task === 'clean' ? 'Clean' : 'Build';
    const line = buildCommandLine({ rsvars, dproj, config: def.config || s.config, platform: def.platform || s.platform, target });
    const task = new vscode.Task(
        { ...def, type: BUILD_TYPE, task: def.task ?? 'build' },
        vscode.workspace.getWorkspaceFolder(vscode.Uri.file(dproj)) ?? vscode.TaskScope.Workspace,
        `${target} ${path.basename(dproj)} (${def.config || s.config}, ${def.platform || s.platform})`,
        'CE Delphi',
        new vscode.ShellExecution(line, { executable: 'cmd.exe', shellArgs: ['/d', '/c'] }),
        '$delphi',
    );
    task.group = def.task === 'clean' ? undefined : vscode.TaskGroup.Build;
    task.presentationOptions = { reveal: vscode.TaskRevealKind.Always, clear: true, panel: vscode.TaskPanelKind.Shared };
    return task;
}

/** Runs the build and says whether it succeeded (MSBuild's exit code); the errors are in the Problems panel. */
export async function runBuild(def: BuildDefinition): Promise<boolean> {
    const task = await buildTask(def);
    if (!task) { return false; }
    const execution = await vscode.tasks.executeTask(task);
    return new Promise(resolve => {
        const end = vscode.tasks.onDidEndTaskProcess(e => {
            if (e.execution === execution) { end.dispose(); resolve(e.exitCode === 0); }
        });
    });
}

export function registerDelphiBuild(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.tasks.registerTaskProvider(BUILD_TYPE, {
            provideTasks: async () => {
                if (process.platform !== 'win32') { return []; }
                const t = await buildTask({ type: BUILD_TYPE, task: 'build' }, true);
                return t ? [t] : [];
            },
            resolveTask: task => (process.platform === 'win32' ? buildTask(task.definition as BuildDefinition, true) : undefined),
        }),
        trackedCommand('ce.delphi.build', async () => {
            if (process.platform !== 'win32') { void vscode.window.showErrorMessage('CE: building a Delphi project works on Windows.'); return; }
            const task = await buildTask({ type: BUILD_TYPE, task: 'build' });
            if (task) { await vscode.tasks.executeTask(task); }
        }),
        trackedCommand('ce.delphi.rebuild', async () => {
            if (process.platform !== 'win32') { void vscode.window.showErrorMessage('CE: building a Delphi project works on Windows.'); return; }
            const task = await buildTask({ type: BUILD_TYPE, task: 'rebuild' });
            if (task) { await vscode.tasks.executeTask(task); }
        }),
    );
}
