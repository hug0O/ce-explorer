/**
 * What the project panel shows for every language, not only Delphi: the size of the units and of their
 * routines, and the SQL written in the code as a string literal. Pure text in, plain objects out.
 *
 * SQL is recognised by its first word, in any language: a string that starts with a statement keyword is
 * a statement (`"SELECT …"`, `'insert into …'`, a Python triple-quoted block, a template literal). A string
 * that merely mentions a word is not. Concatenated pieces (`"SELECT " + cols + " FROM t"`) are joined as
 * `?` where the code adds something at run time.
 */
import { sqlKind, sqlParams, sqlTables, SqlEntry } from './ProjectSql';

export interface CommonMetrics {
    lines: number;
    routines: number;
    /** Routines of more than 60 lines. */
    long: number;
    longest: number;
}

const STATEMENT = /^\s*(select|insert|update|delete|merge|with|create|alter|drop|truncate|begin|declare|call|exec|execute)\b/i;

/** The string literals of a source line, with the text they hold (single, double, backtick, Delphi '' escapes). */
function literalsIn(line: string): string[] {
    const out: string[] = [];
    const re = /'((?:[^'\\]|\\.|'')*)'|"((?:[^"\\]|\\.)*)"|`([^`]*)`/g;
    for (let m = re.exec(line); m; m = re.exec(line)) {
        const raw = m[1] ?? m[2] ?? m[3] ?? '';
        out.push(m[1] !== undefined ? raw.replace(/''/g, '\'') : raw.replace(/\\(.)/g, '$1'));
    }
    return out;
}

/**
 * The SQL statements written as string literals of a source file. `lines` are the source lines with the
 * comments already blanked (the caller knows the language). A statement split over lines joins its
 * literals in order, while they follow each other closely (the same statement, not a later one).
 */
export function commonSql(unit: string, lines: string[]): SqlEntry[] {
    const out: SqlEntry[] = [];
    let open: { entry: SqlEntry; last: number } | undefined;
    lines.forEach((line, i) => {
        const lits = literalsIn(line);
        for (const lit of lits) {
            const text = lit;
            // a continuation: the literal of the line right after the statement's last literal, not a statement of its own
            const continues = open !== undefined && i - open.last <= 1 && !STATEMENT.test(text);
            if (open && continues) {
                open.entry.text = open.entry.text + '\n' + text;
                open.entry.tables = sqlTables(open.entry.text);
                open.entry.params = sqlParams(open.entry.text);
                open.last = i;
                continue;
            }
            if (!STATEMENT.test(text)) { continue; }
            const kind = sqlKind(text);
            if (kind === 'other') { continue; }
            const entry: SqlEntry = { source: 'code', unit, line: i, owner: '', kind, text: text.trim(), tables: sqlTables(text), params: sqlParams(text), dynamic: false };
            out.push(entry);
            open = { entry, last: i };
        }
    });
    return out;
}

/** Size of a source file and of its routines, from the routine headers the provider found. */
export function commonMetrics(lines: string[], routineStarts: number[]): CommonMetrics {
    let code = 0;
    for (const l of lines) { const t = l.trim(); if (t && !/^(\/\/|#|--|\*|\/\*)/.test(t)) { code++; } }
    const starts = [...routineStarts].sort((a, b) => a - b);
    let long = 0;
    let longest = 0;
    starts.forEach((s, k) => {
        const end = starts[k + 1] ?? lines.length;
        const len = end - s;
        if (len > 60) { long++; }
        if (len > longest) { longest = len; }
    });
    return { lines: code, routines: starts.length, long, longest };
}
