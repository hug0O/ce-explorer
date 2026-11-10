/**
 * Which executable a Delphi project builds, from the file being edited: the project is the `.dpr` (or `.dproj`) in the folder of the file or
 * above it, and the program is `<project>.exe` in the folder Delphi builds into (`Win32\Debug`, `Win64\Debug`, the project folder…). The one that has
 * a map file next to it is the one to debug.
 *
 * Pure: the file system is given, so it is tested without disk.
 */
import * as path from 'path';

export interface FileSystem {
    exists(file: string): boolean;
    /** The names of the files of a folder (not their paths); empty when the folder is not there. */
    list(dir: string): string[];
}

const BUILD_FOLDERS = ['Win32\\Debug', 'Win64\\Debug', 'Win32\\Release', 'Win64\\Release', 'Win32', 'Win64', '.', 'bin', 'Debug', 'Release'];

/** The name of the project the file belongs to (without its extension) and its folder, looking up to four folders above. */
export function projectOf(file: string, fs: FileSystem): { name: string; dir: string } | undefined {
    let dir = path.dirname(file);
    for (let i = 0; i < 4; i++) {
        const project = fs.list(dir).find(f => /\.dpr$/i.test(f)) ?? fs.list(dir).find(f => /\.dproj$/i.test(f));
        if (project) { return { name: project.replace(/\.[^.]+$/, ''), dir }; }
        const up = path.dirname(dir);
        if (up === dir) { break; }
        dir = up;
    }
    return undefined;
}

/** The program to debug and its map file, or what is missing. */
export function delphiProgramFor(file: string, fs: FileSystem, built?: { config: string; platform: string }): { program: string; map?: string } | { missing: string } {
    const project = projectOf(file, fs);
    if (!project) { return { missing: 'No Delphi project (.dpr or .dproj) found next to this file or above it.' }; }
    let exeOnly: string | undefined;
    // the folder of what was just built first, then the usual ones
    const folders = built ? [built.platform + '\\' + built.config, ...BUILD_FOLDERS] : BUILD_FOLDERS;
    for (const folder of folders) {
        const exe = path.join(project.dir, ...folder.split('\\'), project.name + '.exe');
        if (!fs.exists(exe)) { continue; }
        const map = exe.replace(/\.exe$/i, '.map');
        if (fs.exists(map)) { return { program: exe, map }; }
        exeOnly ??= exe;
    }
    if (exeOnly) { return { program: exeOnly }; }
    return { missing: `${project.name}.exe is not built yet: build the project (Win32 or Win64, Debug) with the detailed map file, then start again.` };
}
