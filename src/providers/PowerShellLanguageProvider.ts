import { MemberSpec } from '../models/types';
import { ScriptLanguageProvider } from './ScriptLanguageProvider';
import { parsePowerShell } from '../utils/scriptParse';

/** PowerShell (.ps1, .psm1): functions, classes with their methods and properties, and the variables at the top. */
export class PowerShellLanguageProvider extends ScriptLanguageProvider {
    readonly languageId = 'powershell';
    readonly fileExtensions = ['.ps1', '.psm1'];
    readonly displayName = 'PowerShell';
    protected readonly parser = parsePowerShell;
    protected readonly fileType = 'script';

    protected routineText(spec: MemberSpec, body: string): string {
        const params = spec.parameters.map(p => `        ${p.type ? `[${p.type}]` : ''}$${p.name}`).join(',\n');
        const block = params ? `    param(\n${params}\n    )\n` : '';
        return `function ${spec.name} {\n${block}${body.split('\n').map(l => '    ' + l.trim()).join('\n')}\n}\n`;
    }

    protected variableText(name: string, value: string): string { return `$${name} = ${value || '$null'}`; }
}
