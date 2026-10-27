import { MemberSpec } from '../models/types';
import { ScriptLanguageProvider } from './ScriptLanguageProvider';
import { parseBatch } from '../utils/scriptParse';

/** Windows batch (.bat, .cmd): labels are the routines (`call :name`), `set` variables are the fields. */
export class BatchLanguageProvider extends ScriptLanguageProvider {
    readonly languageId = 'bat';
    readonly fileExtensions = ['.bat', '.cmd'];
    readonly displayName = 'Batch (Windows)';
    protected readonly parser = parseBatch;
    protected readonly fileType = 'batch file';
    protected readonly commentPrefix = 'rem';
    protected hasShebang = true;   // after `@echo off`

    protected routineText(spec: MemberSpec, body: string): string {
        const args = spec.parameters.map((p, i) => `rem   %${i + 1} = ${p.name}`).join('\n');
        return `:${spec.name}\n${args ? args + '\n' : ''}${body.split('\n').map(l => '  ' + l.trim()).join('\n')}\nexit /b 0\n`;
    }

    protected variableText(name: string, value: string): string { return `set "${name}=${value}"`; }
}
