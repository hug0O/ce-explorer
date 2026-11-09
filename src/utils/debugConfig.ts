/**
 * Starting the debugger of the language of a file: the debug type that fits it, the extension that brings that debugger when it is not
 * there, and the launch configuration for the file. For Delphi the debugger is the one of this extension (src/debug); for the other languages
 * it is the debugger that the language already has, so that one command, with the same breakpoints, starts any of them.
 *
 * Pure: a language and a file in, a choice out.
 */
export interface DebugChoice {
    /** The name shown to the person. */
    label: string;
    /** The debug type VS Code starts. */
    type: string;
    /** The extension that provides the type, when it is not built in. */
    extension?: { id: string; name: string };
    config: Record<string, unknown>;
    /** What to know before it works. */
    note?: string;
}

const dirOf = (file: string): string => file.replace(/[\\/][^\\/]*$/, '');

/** The Java class of a source file: its package and its name. */
export function javaMainClass(file: string, text = ''): string {
    const name = file.replace(/^.*[\\/]/, '').replace(/\.java$/i, '');
    const pkg = /^\s*package\s+([\w.]+)\s*;/m.exec(text)?.[1];
    return pkg ? pkg + '.' + name : name;
}

/** What starts the debugger of a file, or undefined for a language that has none (Batch, PL/SQL, Markdown). */
export function debugConfigFor(languageId: string, file: string, text = ''): DebugChoice | undefined {
    const name = (what: string): string => `${what}: ${file.replace(/^.*[\\/]/, '')}`;
    switch (languageId) {
        case 'pascal':
            return { label: 'Delphi', type: 'ce-delphi', config: { type: 'ce-delphi', request: 'launch', name: 'Delphi: debug the program', program: '' }, note: 'The program is built with the detailed map file (Project Options > Linking).' };
        case 'javascript': case 'javascriptreact':
            return { label: 'Node.js', type: 'node', config: { type: 'node', request: 'launch', name: name('Node'), program: file, skipFiles: ['<node_internals>/**'] } };
        case 'typescript': case 'typescriptreact':
            return { label: 'TypeScript (Node.js)', type: 'node', config: { type: 'node', request: 'launch', name: name('TypeScript'), program: file, runtimeArgs: ['--import', 'tsx'], skipFiles: ['<node_internals>/**'] }, note: 'Runs the file with tsx: `npm i -D tsx` (or build first and debug the .js).' };
        case 'python':
            return { label: 'Python', type: 'debugpy', extension: { id: 'ms-python.debugpy', name: 'Python Debugger' }, config: { type: 'debugpy', request: 'launch', name: name('Python'), program: file, console: 'integratedTerminal' } };
        case 'java':
            return { label: 'Java', type: 'java', extension: { id: 'vscjava.vscode-java-debug', name: 'Debugger for Java' }, config: { type: 'java', request: 'launch', name: name('Java'), mainClass: javaMainClass(file, text) } };
        case 'csharp':
            return { label: 'C# (.NET)', type: 'coreclr', extension: { id: 'ms-dotnettools.csharp', name: 'C#' }, config: { type: 'coreclr', request: 'launch', name: '.NET: debug the program', program: '${workspaceFolder}/bin/Debug/net8.0/${workspaceFolderBasename}.dll', cwd: '${workspaceFolder}', preLaunchTask: 'build' }, note: 'Adjust the path of the program to your target framework, and have a `build` task.' };
        case 'go':
            return { label: 'Go', type: 'go', extension: { id: 'golang.go', name: 'Go' }, config: { type: 'go', request: 'launch', name: name('Go'), mode: 'debug', program: dirOf(file) } };
        case 'rust':
            return { label: 'Rust', type: 'lldb', extension: { id: 'vadimcn.vscode-lldb', name: 'CodeLLDB' }, config: { type: 'lldb', request: 'launch', name: 'Rust: debug the crate', cargo: { args: ['build'] }, args: [], cwd: '${workspaceFolder}' } };
        case 'cpp': case 'c':
            return { label: 'C / C++', type: 'cppvsdbg', extension: { id: 'ms-vscode.cpptools', name: 'C/C++' }, config: { type: 'cppvsdbg', request: 'launch', name: name('C/C++'), program: '${fileDirname}\\${fileBasenameNoExtension}.exe', cwd: '${fileDirname}' }, note: 'Build the program with debug information (-g) first.' };
        case 'powershell':
            return { label: 'PowerShell', type: 'PowerShell', extension: { id: 'ms-vscode.powershell', name: 'PowerShell' }, config: { type: 'PowerShell', request: 'launch', name: name('PowerShell'), script: file, cwd: dirOf(file) } };
        case 'shellscript':
            return { label: 'Shell', type: 'bashdb', extension: { id: 'rogalmeier.bash-debug', name: 'Bash Debug' }, config: { type: 'bashdb', request: 'launch', name: name('Shell'), program: file, cwd: dirOf(file), args: [] } };
        default:
            return undefined;
    }
}

/**
 * The languages the extension lets breakpoints be set in: VS Code puts the red dot in the gutter of a language only when an extension says
 * breakpoints make sense there, and the debug extension of a language may not be installed yet (the command offers to install it).
 */
export const BREAKPOINT_LANGUAGES = [
    'pascal', 'delphi', 'objectpascal', 'plsql', 'bat', 'python', 'java', 'csharp', 'go', 'rust', 'cpp', 'c',
    'typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'powershell', 'shellscript',
];
