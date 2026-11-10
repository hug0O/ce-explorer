/**
 * Building a Delphi project from VS Code: the project is the `.dproj`, the compiler is the one of the RAD Studio installed, run by MSBuild with
 * the environment that `rsvars.bat` sets up, and the map file is forced to the detailed one that the debugger needs.
 *
 * Pure: the registry output, the file system and the environment are given, so all of it is tested without a Delphi.
 */
import * as path from 'path';
import { delphiInstallCommand } from './projectBuild';

export interface BuildOptions {
    /** `rsvars.bat` of the RAD Studio. */
    rsvars: string;
    dproj: string;
    config: string;
    /** `Win32`, `Win64`, or `Both` (the two, one after the other). */
    platform: string;
    target: 'Build' | 'Rebuild' | 'Clean';
    /** After the build: the folder the program is copied to (the Install of the menu). */
    install?: { dir: string };
}

/** The platforms a `platform` stands for. */
export function platformsOf(platform: string): string[] {
    return /^both$/i.test(platform) ? ['Win32', 'Win64'] : [platform];
}

/** Where Delphi writes the program of a project: next to the project, in `<platform>\<config>`. */
export function exePath(dproj: string, platform: string, config: string): string {
    const dir = path.win32.dirname(dproj);
    return `${dir}\\${platform}\\${config}\\${path.win32.basename(dproj).replace(/\.dproj$/i, '')}.exe`;
}

/** The command that builds the project, for `cmd.exe /d /c`: the environment of Delphi, then MSBuild with the detailed map file, once per platform. */
export function buildCommandLine(o: BuildOptions): string {
    const platforms = platformsOf(o.platform);
    const parts = platforms.map(p => `msbuild "${o.dproj}" /t:${o.target} /p:Config=${o.config} /p:Platform=${p} /p:DCC_MapFile=3 /nologo /v:minimal /clp:NoSummary`);
    if (o.install && o.target !== 'Clean') {
        for (const p of platforms) { parts.push(delphiInstallCommand(exePath(o.dproj, p, o.config), o.install.dir, p, platforms.length > 1)); }
    }
    return `call "${o.rsvars}" && ${parts.join(' && ')}`;
}

/** The versions of RAD Studio and their folders from `reg query HKCU\Software\Embarcadero\BDS /s /v RootDir`, newest first. */
export function rootDirsFromRegistry(output: string): string[] {
    const found: { version: number; dir: string }[] = [];
    let version = 0;
    for (const raw of output.split(/\r?\n/)) {
        const key = /\\BDS\\(\d+(?:\.\d+)?)\s*$/i.exec(raw.trim());
        if (key) { version = parseFloat(key[1]); continue; }
        const value = /^\s*RootDir\s+REG_SZ\s+(.+?)\s*$/i.exec(raw);
        if (value) { found.push({ version, dir: value[1] }); }
    }
    return found.sort((a, b) => b.version - a.version).map(f => f.dir);
}

export interface Probe {
    env: Record<string, string | undefined>;
    /** The output of `reg query` for the folders of RAD Studio (the user's and the machine's), concatenated. */
    registry: string;
    exists(file: string): boolean;
    listDirs(dir: string): string[];
}

/** The folders RAD Studio is installed in by default, whatever the version. */
const INSTALL_PARENTS = ['C:\\Program Files (x86)\\Embarcadero\\Studio', 'C:\\Program Files\\Embarcadero\\Studio', 'C:\\Program Files (x86)\\Embarcadero\\RAD Studio', 'C:\\Program Files (x86)\\Embarcadero\\Delphi'];

/** The `rsvars.bat` to use: the setting, the `BDS` of the environment (a Developer command prompt), the registry, then the usual folders, newest version first. */
export function findRsvars(configured: string, p: Probe): string | undefined {
    const candidates: string[] = [];
    if (configured) { candidates.push(configured); }
    if (p.env.BDS) { candidates.push(path.win32.join(p.env.BDS, 'bin', 'rsvars.bat')); }
    for (const dir of rootDirsFromRegistry(p.registry)) { candidates.push(path.win32.join(dir, 'bin', 'rsvars.bat')); }
    for (const parent of INSTALL_PARENTS) {
        const versions = p.listDirs(parent).sort((a, b) => (parseFloat(b) || 0) - (parseFloat(a) || 0));
        for (const v of versions) { candidates.push(path.win32.join(parent, v, 'bin', 'rsvars.bat')); }
    }
    return candidates.find(c => p.exists(c));
}

export interface ProjectFiles {
    exists(file: string): boolean;
    list(dir: string): string[];
}

/** The `.dproj` of the project a unit belongs to: the one with the name of the `.dpr` above it, or the only `.dproj` there. */
export function dprojFor(file: string, fs: ProjectFiles): string | undefined {
    let dir = path.dirname(file);
    for (let i = 0; i < 4; i++) {
        const names = fs.list(dir);
        const dpr = names.find(n => /\.dpr$/i.test(n));
        const dprojs = names.filter(n => /\.dproj$/i.test(n));
        if (dpr) {
            const same = dprojs.find(n => n.toLowerCase() === dpr.replace(/\.dpr$/i, '.dproj').toLowerCase());
            const pick = same ?? dprojs[0];
            if (pick) { return path.join(dir, pick); }
        } else if (dprojs.length === 1) { return path.join(dir, dprojs[0]); }
        const up = path.dirname(dir);
        if (up === dir) { break; }
        dir = up;
    }
    return undefined;
}

export interface BuildMessage { file: string; line: number; column?: number; severity: 'error' | 'warning'; code: string; message: string }

/** The errors and warnings of a build, as MSBuild prints them: `C:\p\Unit1.pas(34): error E2003: Undeclared identifier: 'Foo' [C:\p\App.dproj]`. */
export function parseBuildOutput(text: string): BuildMessage[] {
    const out: BuildMessage[] = [];
    for (const raw of text.split(/\r?\n/)) {
        const m = /^\s*(.+?)\((\d+)(?:,(\d+))?\)\s*:\s*(error|warning)\s+([EFW]\d{4})\s*:\s*(.*?)(?:\s+\[[^\]]+\.dproj\])?\s*$/i.exec(raw);
        if (m) { out.push({ file: m[1], line: Number(m[2]), column: m[3] ? Number(m[3]) : undefined, severity: m[4].toLowerCase() as 'error' | 'warning', code: m[5], message: m[6] }); }
    }
    return out;
}

/** The regular expression of the problem matcher of the task (package.json) as a string: kept here so that a test checks it on real lines. */
export const PROBLEM_PATTERN = '^\\s*(.+?)\\((\\d+)(?:,(\\d+))?\\)\\s*:\\s*(error|warning)\\s+([EFW]\\d{4})\\s*:\\s*(.*?)(?:\\s+\\[[^\\]]+\\.dproj\\])?\\s*$';
