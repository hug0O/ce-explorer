import * as vscode from 'vscode';
import { VariableRef, VariableKind, ClassInfo, ClassMember, MemberKind } from '../models/types';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { LocalScopeAnalyzer } from './LocalScopeAnalyzer';

const scopeAnalyzer = new LocalScopeAnalyzer();

/**
 * Unified variable resolution: given a document + position, determine which
 * refactorable variable sits under the cursor, regardless of whether it is a
 * local, a parameter, a field, a property or a standalone routine.
 *
 * Resolution order is locals/parameters first (innermost scope wins), then
 * class members. Returns undefined when nothing refactorable is under the
 * cursor.
 */
export function resolveVariableAt(
    document: vscode.TextDocument,
    provider: ILanguageProvider,
    position: vscode.Position,
): VariableRef | undefined {
    const parsed = provider.parseDocument(document);

    // 1. Locals / parameters inside a method body. A local's parsed range
    //    covers only its declaration line, so we resolve by the token under
    //    the cursor matched against the scope's known names — this correctly
    //    identifies a local at any usage site, not just on the declaration.
    const enclosing = findEnclosingMember(parsed, position);
    if (enclosing?.implementationRange?.contains(position) || enclosing?.range?.contains(position)) {
        const scope = scopeAnalyzer.getScope(document, provider, enclosing);
        if (scope) {
            const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]\w*/);
            if (wordRange) {
                const word = document.getText(wordRange);
                const local = scope.locals.find(l => l.name === word);
                if (local) {
                    return {
                        kind: local.isParam ? 'param' : 'local',
                        name: local.name,
                        type: local.type,
                        declarationRange: local.declarationRange,
                        document,
                        enclosingMethod: enclosing,
                        scope,
                    };
                }
            }
        }
    }

    // 2. Class members (field / property / method).
    for (const cls of parsed.classes) {
        const onMember = cls.members.some(m => m.range.contains(position) || m.implementationRange?.contains(position));
        if (!cls.range.contains(position) && !onMember) { continue; }
        for (const member of cls.members) {
            const inDecl = member.range.contains(position);
            const inImpl = member.implementationRange?.contains(position);
            if (!inDecl && !inImpl) { continue; }
            return memberToRef(document, cls, member);
        }
    }

    // 3. Standalone (file-level) procedures.
    for (const proc of parsed.standaloneProcedures) {
        if (proc.range.contains(position) || proc.implementationRange?.contains(position)) {
            const synth: ClassInfo = {
                id: 'standalone_' + proc.id,
                name: '',
                classType: 'standalone',
                parentClass: undefined,
                interfaces: [],
                members: [proc],
                range: proc.range,
                isInterface: false,
                isRecord: false,
                isSealed: false,
                fileUri: document.uri,
            };
            const ref = memberToRef(document, synth, proc);
            ref.kind = 'standalone';
            return ref;
        }
    }

    return undefined;
}

function memberToRef(document: vscode.TextDocument, cls: ClassInfo, member: ClassMember): VariableRef {
    let kind: VariableKind;
    switch (member.kind) {
        case MemberKind.Field: kind = 'field'; break;
        case MemberKind.Property: kind = 'property'; break;
        default: kind = 'standalone'; break;
    }
    return {
        kind,
        name: member.name,
        type: member.type || member.returnType,
        declarationRange: member.range,
        document,
        enclosingClass: cls,
    };
}

/**
 * Find the method whose body (implementation range) or declaration contains
 * the position. Used to scope local-variable analysis.
 */
function findEnclosingMember(parsed: { classes: ClassInfo[]; standaloneProcedures: ClassMember[] }, position: vscode.Position): ClassMember | undefined {
    for (const cls of parsed.classes) {
        for (const member of cls.members) {
            if (member.range.contains(position) || member.implementationRange?.contains(position)) {
                return member;
            }
        }
    }
    for (const proc of parsed.standaloneProcedures) {
        if (proc.range.contains(position) || proc.implementationRange?.contains(position)) {
            return proc;
        }
    }
    return undefined;
}
