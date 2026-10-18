/**
 * PL/SQL-aware alignment presets: parameter lists (name | mode | type),
 * named-notation arguments (=>), trailing comments, column aliases (AS).
 */
import { alignLines } from './alignText';

export interface AlignPreset {
    id: string;
    label: string;
    description: string;
}

export const PLSQL_ALIGN_PRESETS: AlignPreset[] = [
    { id: 'params', label: 'Parameters', description: 'name | IN / OUT | type' },
    { id: 'assign', label: ':=', description: 'assignments' },
    { id: 'arrow', label: '=>', description: 'named arguments' },
    { id: 'comment', label: '--', description: 'trailing comments' },
    { id: 'alias', label: 'AS', description: 'column aliases' },
    { id: 'values', label: 'Declarations', description: 'name | type | := value' },
];

const PARAM_RE = /^(\s*)([A-Za-z_][\w$#]*)\s+((?:in\s+out|in|out)(?:\s+nocopy)?)?\s*(\S.*)$/i;

/**
 * Aligns lines of a parameter list into columns: names, modes (IN / OUT /
 * IN OUT) and types. Lines that do not look like parameters are left alone.
 */
export function alignPlSqlParams(lines: string[]): { lines: string[]; aligned: number } {
    const parsed = lines.map(l => {
        const m = l.match(PARAM_RE);
        if (!m || /^\s*(--|\/\*)/.test(l)) { return undefined; }
        // A line such as "p_id IN NUMBER," must start with a mode or a plausible type.
        return { indent: m[1], name: m[2], mode: (m[3] ?? '').toUpperCase().replace(/\s+/g, ' '), rest: m[4] };
    });
    const rows = parsed.filter(p => p !== undefined) as { indent: string; name: string; mode: string; rest: string }[];
    if (rows.length < 2) { return { lines: [...lines], aligned: rows.length }; }
    const nameW = Math.max(...rows.map(r => r.name.length));
    const anyMode = rows.some(r => r.mode);
    const modeW = Math.max(...rows.map(r => r.mode.length));
    const out = lines.map((l, i) => {
        const p = parsed[i];
        if (!p) { return l; }
        const mode = anyMode ? p.mode.padEnd(modeW) + ' ' : '';
        return `${p.indent}${p.name.padEnd(nameW)} ${mode}${p.rest}`.replace(/\s+$/, '');
    });
    return { lines: out, aligned: rows.length };
}

/** Declarations `name [CONSTANT] type [:= value];` into name | type | value columns. */
export function alignDeclarations(lines: string[]): { lines: string[]; aligned: number } {
    const re = /^(\s*)([A-Za-z_][\w$#]*)\s+((?:constant\s+)?[A-Za-z_][\w$#.%]*(?:\s*\([^)]*\))?)\s*(:=.*|default\s+.*)?;(.*)$/i;
    const parsed = lines.map(l => {
        const m = l.match(re);
        return m && !/^\s*(--|\/\*)/.test(l) ? { indent: m[1], name: m[2], type: m[3].replace(/\s+/g, ' '), value: (m[4] ?? '').trim(), tail: m[5] } : undefined;
    });
    const rows = parsed.filter(p => p !== undefined) as { indent: string; name: string; type: string; value: string; tail: string }[];
    if (rows.length < 2) { return { lines: [...lines], aligned: rows.length }; }
    const nameW = Math.max(...rows.map(r => r.name.length));
    const typeW = Math.max(...rows.filter(r => r.value).map(r => r.type.length), 0);
    const out = lines.map((l, i) => {
        const p = parsed[i];
        if (!p) { return l; }
        const type = p.value ? p.type.padEnd(typeW) : p.type;
        return `${p.indent}${p.name.padEnd(nameW)} ${type}${p.value ? ' ' + p.value : ''};${p.tail}`.replace(/\s+$/, '');
    });
    return { lines: out, aligned: rows.length };
}

/** Applies a preset to a block of lines. */
export function applyAlignPreset(id: string, lines: string[], tabSize = 4): { lines: string[]; aligned: number } {
    switch (id) {
        case 'params': return alignPlSqlParams(lines);
        case 'values': return alignDeclarations(lines);
        case 'assign': return alignLines(lines, ':=', tabSize);
        case 'arrow': return alignLines(lines, '=>', tabSize);
        case 'comment': return alignLines(lines, '--', tabSize);
        case 'alias': {
            // " AS " must stay a whole word: aligning on "AS" alone would catch IS / CAST.
            const res = alignLines(lines.map(l => l.replace(/\s+as\s+/i, ' AS ')), ' AS ', tabSize);
            return res;
        }
        default: return { lines: [...lines], aligned: 0 };
    }
}
