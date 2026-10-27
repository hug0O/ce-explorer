import { MemberSpec } from '../models/types';
import { ScriptLanguageProvider } from './ScriptLanguageProvider';
import { parseShell } from '../utils/scriptParse';

/** Unix shell (sh, bash, zsh): functions are the routines, top-level assignments the fields. */
export class ShellLanguageProvider extends ScriptLanguageProvider {
    readonly languageId = 'shellscript';
    readonly fileExtensions = ['.sh', '.bash', '.zsh', '.ksh'];
    readonly displayName = 'Shell (sh / bash / zsh)';
    protected readonly parser = parseShell;
    protected readonly fileType = 'shell script';
    protected hasShebang = true;

    protected routineText(spec: MemberSpec, body: string): string {
        const args = spec.parameters.map((p, i) => `  local ${p.name}="$${i + 1}"`).join('\n');
        return `${spec.name}() {\n${args ? args + '\n' : ''}${body.split('\n').map(l => '  ' + l.trim()).join('\n')}\n}\n`;
    }

    protected variableText(name: string, value: string): string { return `${name}="${value}"`; }
}
