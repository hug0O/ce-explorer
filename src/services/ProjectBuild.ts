/**
 * `CE: Clean / Build / Install the project`, for every language: Delphi goes through its own build (MSBuild, Win32 / Win64), the others run the
 * usual tool of the project found in the folder (cargo, go, dotnet, Maven, Gradle, CMake, make, npm, pip), in 32 or 64 bit where it has both.
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { trackedCommand } from './UsageStats';
import { Action, Arch, commandFor, detectKinds } from '../utils/projectBuild';
import { BUILD_TYPE, buildTask, pickPlatform } from './DelphiBuild';

/** The folder to build in: the nearest one above the open file that holds a project file, else the workspace folder. */
function projectFolder(): string | undefined {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const file = vscode.window.activeTextEditor?.document.uri.fsPath;
    let dir = file ? path.dirname(file) : root;
    while (dir) {
        let names: string[] = [];
        try { names = fs.readdirSync(dir); } catch { /* unreadable */ }
        if (detectKinds(names).length) { return dir; }
        const up = path.dirname(dir);
        if (up === dir || (root && !dir.toLowerCase().startsWith(root.toLowerCase()))) { break; }
        dir = up;
    }
    return root;
}

function scriptsOf(dir: string): Set<string> {
    try { return new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts ?? {})); } catch { return new Set(); }
}

async function pickArch(): Promise<Arch | null> {
    const pick = await vscode.window.showQuickPick(
        [{ label: 'Default', arch: undefined }, { label: '32 bit (x86)', arch: 'x86' as Arch }, { label: '64 bit (x64)', arch: 'x64' as Arch }],
        { title: 'CE: platform' });
    return pick ? pick.arch : null;
}

async function run(action: Action): Promise<void> {
    const doc = vscode.window.activeTextEditor?.document;
    // a Delphi unit, or a folder with a .dproj: the Delphi build, with its platforms
    if (doc && /\.(pas|dpr|dpk|dfm|dproj)$/i.test(doc.uri.fsPath) && process.platform === 'win32') {
        const platform = await pickPlatform();
        if (!platform) { return; }
        const task = await buildTask({ type: BUILD_TYPE, task: action === 'build' ? 'build' : action, platform });
        if (task) { await vscode.tasks.executeTask(task); }
        return;
    }
    const dir = projectFolder();
    if (!dir) { void vscode.window.showWarningMessage('CE: open a folder or a file of the project first.'); return; }
    let names: string[] = [];
    try { names = fs.readdirSync(dir); } catch { /* unreadable */ }
    const kinds = detectKinds(names);
    if (!kinds.length) { void vscode.window.showWarningMessage('CE: no project file found here (Cargo.toml, go.mod, .sln/.csproj, pom.xml, build.gradle, CMakeLists.txt, Makefile, package.json, pyproject.toml).'); return; }
    const kind = kinds.length === 1 ? kinds[0] : (await vscode.window.showQuickPick(kinds.map(k => ({ label: k.label, project: k })), { title: 'CE: which project?' }))?.project;
    if (!kind) { return; }
    let arch: Arch = undefined;
    if (kind.has32 && action !== 'clean') {
        const a = await pickArch();
        if (a === null) { return; }
        arch = a;
    }
    const scripts = scriptsOf(dir);
    const step = commandFor(kind.id, action, arch, n => scripts.has(n));
    if (!step) { return; }
    const task = new vscode.Task({ type: 'ce-project', action }, vscode.TaskScope.Workspace, `${step.label} ${path.basename(dir)}`, 'CE', new vscode.ShellExecution(step.command, { cwd: dir }));
    task.group = action === 'build' ? vscode.TaskGroup.Build : undefined;
    task.presentationOptions = { reveal: vscode.TaskRevealKind.Always, clear: true, panel: vscode.TaskPanelKind.Shared };
    await vscode.tasks.executeTask(task);
}

export function registerProjectBuild(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        ...(['clean', 'build', 'install'] as const).map(a => trackedCommand('ce.project.' + a, () => run(a))),
    );
}
