import * as vscode from 'vscode';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { ClassInfo, ClassMember, MemberKind } from '../models/types';

/** Minimal registry contract required by collectDeadCode. */
export interface DeadCodeRegistry {
    getByDocument(doc: vscode.TextDocument): ILanguageProvider | undefined;
}

export interface DeadCodeItem {
    /** `method` / `class`: nothing in the workspace refers to it. The others are what the compiler or linter of the language reports in the file. */
    kind: 'method' | 'class' | 'import' | 'local' | 'private' | 'function' | 'unreachable';
    name: string;
    file: string;
    line: number;
    className?: string;
    /** What the compiler / linter calls it (`TS6133`, `F401`, `H2164`...), the tool, and its message. */
    rule?: string;
    tool?: string;
    message?: string;
    col?: number;
    endCol?: number;
}

/**
 * Workspace scan: collects all potentially unused methods/classes across the
 * workspace. Decoupled from any VS Code UI so it can be reused by the inline
 * analytics view.
 *
 * Cost is LINEAR in the workspace size: every file is read, parsed and
 * tokenized exactly once, and usage counting is a single identifier-frequency
 * table. (The previous implementation ran `combinedText.split(name)` once PER
 * candidate name — one full-workspace scan plus a huge allocation per method,
 * which froze the machine on real projects.)
 */
export async function collectDeadCode(
    registry: DeadCodeRegistry,
    extensions: string[],
    onProgress?: (done: number, total: number, fileName: string) => void
): Promise<DeadCodeItem[]> {
    const pattern = `**/*.{${extensions.join(',')}}`;
    const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');

    const allMethodNames = new Map<string, { file: string; line: number; className?: string }>();
    const allClassNames = new Map<string, { file: string; line: number }>();
    const identifierCounts = new Map<string, number>();
    const identRe = /[A-Za-z_][A-Za-z0-9_]*/g;

    let done = 0;
    for (const fileUri of files) {
        done++;
        const fileName = fileUri.fsPath.split(/[/\\]/).pop() ?? '';
        if (onProgress && (done % 10 === 0 || done === files.length)) {
            onProgress(done, files.length, fileName);
        }
        try {
            const doc = await vscode.workspace.openTextDocument(fileUri);
            const prov = registry.getByDocument(doc);
            if (!prov) continue;

            const parsed = prov.parseDocument(doc);
            const text = doc.getText();

            let m: RegExpExecArray | null;
            identRe.lastIndex = 0;
            while ((m = identRe.exec(text)) !== null) {
                identifierCounts.set(m[0], (identifierCounts.get(m[0]) ?? 0) + 1);
            }

            for (const cls of parsed.classes) {
                allClassNames.set(cls.name, { file: fileUri.fsPath, line: cls.range.start.line });
                for (const mem of cls.members) {
                    if (mem.kind === MemberKind.Method || mem.kind === MemberKind.Constructor) {
                        allMethodNames.set(`${cls.name}::${mem.name}`, { file: fileUri.fsPath, line: mem.range.start.line, className: cls.name });
                    }
                }
            }
        } catch { /* skip unreadable files */ }
    }

    const deadCode: DeadCodeItem[] = [];

    for (const [key, info] of allMethodNames) {
        const methodName = key.split('::')[1];
        // One identifier occurrence = its own declaration only -> unused.
        if ((identifierCounts.get(methodName) ?? 0) <= 1) {
            deadCode.push({ kind: 'method', name: methodName, file: info.file, line: info.line, className: info.className });
        }
    }

    for (const [name, info] of allClassNames) {
        if ((identifierCounts.get(name) ?? 0) <= 1) {
            deadCode.push({ kind: 'class', name, file: info.file, line: info.line });
        }
    }

    return deadCode;
}
