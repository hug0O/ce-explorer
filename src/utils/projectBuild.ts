/**
 * Clean, Build and Install a project of any language, as the Delphi menu does (Project > Clean / Build / Install), for the 32 and 64 bit variants
 * where the language has them. The project type is read from the files of the folder; the command is the one of its usual tool.
 *
 * Pure: the file names are given, so it is tested without disk.
 */
export type Action = 'clean' | 'build' | 'install';
/** `x86` = 32 bit, `x64` = 64 bit, undefined = the tool's default. */
export type Arch = 'x86' | 'x64' | undefined;

export interface ProjectKind { id: string; label: string; marker: RegExp; has32: boolean }

export const PROJECT_KINDS: ProjectKind[] = [
    { id: 'cargo', label: 'Rust (cargo)', marker: /^Cargo\.toml$/i, has32: true },
    { id: 'go', label: 'Go', marker: /^go\.mod$/i, has32: true },
    { id: 'dotnet', label: '.NET', marker: /\.(sln|csproj|fsproj|vbproj)$/i, has32: true },
    { id: 'maven', label: 'Java (Maven)', marker: /^pom\.xml$/i, has32: false },
    { id: 'gradle', label: 'Java (Gradle)', marker: /^build\.gradle(\.kts)?$/i, has32: false },
    { id: 'cmake', label: 'C/C++ (CMake)', marker: /^CMakeLists\.txt$/i, has32: true },
    { id: 'make', label: 'C/C++ (make)', marker: /^Makefile$/i, has32: false },
    { id: 'node', label: 'JavaScript / TypeScript (npm)', marker: /^package\.json$/i, has32: false },
    { id: 'python', label: 'Python', marker: /^(pyproject\.toml|setup\.py)$/i, has32: false },
];

/** The kinds of project found among the names of the files of a folder, in the order of PROJECT_KINDS. */
export function detectKinds(names: string[]): ProjectKind[] {
    return PROJECT_KINDS.filter(k => names.some(n => k.marker.test(n)));
}

export interface Step { label: string; command: string }

const RM_PY = 'python -c "import shutil;[shutil.rmtree(d,ignore_errors=True) for d in (\'build\',\'dist\')]"';

/**
 * The command that does `action` for a kind of project. `arch` picks the 32 or 64 bit variant where the tool has one; `hasScript` says whether the
 * package.json declares the script (`build`, `clean`) so that the project's own is used. `windows` says which shell syntax the environment needs.
 */
export function commandFor(kind: string, action: Action, arch: Arch = undefined, hasScript: (name: string) => boolean = () => false, windows = process.platform === 'win32'): Step | undefined {
    const rustTarget = arch === 'x86' ? ' --target i686-pc-windows-msvc' : arch === 'x64' ? ' --target x86_64-pc-windows-msvc' : '';
    const goArch = arch === 'x86' ? '386' : arch === 'x64' ? 'amd64' : '';
    const goEnv = goArch ? (windows ? `set GOARCH=${goArch}&& ` : `GOARCH=${goArch} `) : '';
    const dotnetArch = arch === 'x86' ? ' -r win-x86' : arch === 'x64' ? ' -r win-x64' : '';
    const cmakeArch = arch === 'x86' ? ' -A Win32' : arch === 'x64' ? ' -A x64' : '';
    const cmakeDir = arch ? `build-${arch}` : 'build';
    const cmakeConfigure = `cmake -S . -B ${cmakeDir}${cmakeArch}`;
    const bits = arch === 'x86' ? ' (32 bit)' : arch === 'x64' ? ' (64 bit)' : '';
    const step = (command: string): Step => ({ label: `${action[0].toUpperCase()}${action.slice(1)}${bits}`, command });
    switch (kind) {
        case 'cargo': return step(action === 'clean' ? 'cargo clean' : action === 'build' ? `cargo build${rustTarget}` : `cargo install --path .${rustTarget}`);
        case 'go': return step(goEnv + (action === 'clean' ? 'go clean ./...' : action === 'build' ? 'go build ./...' : 'go install ./...'));
        case 'dotnet': return step(action === 'clean' ? 'dotnet clean' : action === 'build' ? `dotnet build${dotnetArch}` : `dotnet publish${dotnetArch}`);
        case 'maven': return step(action === 'clean' ? 'mvn clean' : action === 'build' ? 'mvn compile' : 'mvn install');
        case 'gradle': return step(action === 'clean' ? 'gradle clean' : action === 'build' ? 'gradle build' : 'gradle publishToMavenLocal');
        case 'cmake': return step(action === 'clean' ? `cmake --build ${cmakeDir} --target clean` : action === 'build' ? `${cmakeConfigure} && cmake --build ${cmakeDir}` : `${cmakeConfigure} && cmake --build ${cmakeDir} && cmake --install ${cmakeDir}`);
        case 'make': return step(action === 'clean' ? 'make clean' : action === 'build' ? 'make' : 'make install');
        case 'node': return step(action === 'clean' ? (hasScript('clean') ? 'npm run clean' : 'npx --yes rimraf dist build out') : action === 'build' ? (hasScript('build') ? 'npm run build' : 'npm install') : 'npm install');
        case 'python': return step(action === 'clean' ? RM_PY : action === 'build' ? 'python -m build' : 'python -m pip install .');
    }
    return undefined;
}

/** The Delphi `Install`: the program built is copied to the install folder (`<dir>\Win32`, `<dir>\Win64` when both are built, `<dir>` for one). */
export function delphiInstallCommand(exe: string, dir: string, platform: string, both: boolean): string {
    const target = both ? `${dir}\\${platform}` : dir;
    return `(if not exist "${target}" mkdir "${target}") && copy /Y "${exe}" "${target}\\"`;
}
