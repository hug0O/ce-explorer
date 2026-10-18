import * as vscode from 'vscode';
import { ComponentDef, COMPONENTS } from './DelphiForm';
import {
    LearnedComponent, learnFromDfmTexts, parseCustomComponents, resolveWithLibrary,
} from './DelphiLibrary';

const UNITS_KEY = 'mmx.delphi.classUnits';
const EXCLUDE = '**/{node_modules,.git,__history,__recovery,Win32,Win64,Debug,Release}/**';

let storage: vscode.Memento | undefined;
const learnedCache = new Map<string, { learned?: LearnedComponent; unit?: string }>();

export function setFormStorage(memento: vscode.Memento | undefined): void {
    storage = memento;
}

function rememberedUnits(): Record<string, string> {
    return storage?.get<Record<string, string>>(UNITS_KEY) ?? {};
}

/** Remembers the unit typed for a class, so the next component of that class needs no unit. */
export async function rememberClassUnit(className: string, unit: string): Promise<void> {
    if (!storage || !unit.trim()) { return; }
    await storage.update(UNITS_KEY, { ...rememberedUnits(), [className.toLowerCase()]: unit.trim() });
}

function customComponents() {
    return parseCustomComponents(vscode.workspace.getConfiguration('mmx').get<unknown>('delphi.customComponents'));
}

async function readText(uri: vscode.Uri): Promise<string | undefined> {
    try { return new TextDecoder('utf-8').decode(await vscode.workspace.fs.readFile(uri)); } catch { return undefined; }
}

/**
 * What the workspace says about a class that is not in the VCL catalog:
 * how the project's .dfm files use it, and which workspace unit declares it.
 */
async function learnFromWorkspace(className: string): Promise<{ learned?: LearnedComponent; unit?: string }> {
    const key = className.toLowerCase();
    const cached = learnedCache.get(key);
    if (cached) { return cached; }

    const dfmFiles = await vscode.workspace.findFiles('**/*.dfm', EXCLUDE, 300);
    const texts: string[] = [];
    for (const uri of dfmFiles) {
        const t = await readText(uri);
        if (t && new RegExp(':\\s*' + className.replace(/\./g, '\\.') + '\\b', 'i').test(t)) { texts.push(t); }
    }
    const learned = learnFromDfmTexts(className, texts);

    let unit: string | undefined;
    const declRe = new RegExp('^\\s*' + className.replace(/\./g, '\\.') + '\\s*=\\s*class\\b', 'im');
    for (const uri of await vscode.workspace.findFiles('**/*.pas', EXCLUDE, 800)) {
        const t = await readText(uri);
        if (t && declRe.test(t)) { unit = uri.fsPath.split(/[\\/]/).pop()!.replace(/\.pas$/i, ''); break; }
    }
    const result = { learned, unit };
    learnedCache.set(key, result);
    return result;
}

export function forgetLearnedComponents(): void {
    learnedCache.clear();
}

/** Full definition of any component class (catalog → user setting → project usage → remembered unit). */
export async function loadComponentDef(className: string, unitInput?: string): Promise<ComponentDef> {
    const custom = customComponents();
    const inCatalog = COMPONENTS.some(c => c.className.toLowerCase() === className.toLowerCase());
    const entry = custom.some(c => c.className.toLowerCase() === className.toLowerCase());
    let learned: LearnedComponent | undefined;
    let workspaceUnit: string | undefined;
    if (!inCatalog && !entry) {
        const found = await learnFromWorkspace(className);
        learned = found.learned;
        workspaceUnit = found.unit;
    }
    return resolveWithLibrary(className, unitInput, custom, learned, rememberedUnits()[className.toLowerCase()] ?? workspaceUnit);
}

/** Whether `className` is a component the extension can describe (catalog, setting, or used in a project .dfm). */
export async function isKnownComponentClass(className: string): Promise<boolean> {
    if (COMPONENTS.some(c => c.className.toLowerCase() === className.toLowerCase())) { return true; }
    if (customComponents().some(c => c.className.toLowerCase() === className.toLowerCase())) { return true; }
    return (await learnFromWorkspace(className)).learned !== undefined;
}
