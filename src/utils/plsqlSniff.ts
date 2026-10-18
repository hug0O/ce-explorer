/**
 * Decides whether a text file of an ambiguous extension (.txt, .sql) really
 * holds SQL / PL/SQL, so notes and logs are not parsed as source code.
 */
import { cleanPlSql } from './plsqlScan';

const STRONG = /^\s*(create\s+(or\s+replace\s+)?((non)?editionable\s+)?(global\s+temporary\s+)?(package|procedure|function|trigger|table|view|type|sequence|index|synonym)\b|declare\b|begin\b|alter\s+(table|session|package)\b|drop\s+(table|package|procedure|function)\b|merge\s+into\b)/im;
const STATEMENT = /^\s*(select|insert\s+into|update|delete\s+from|merge|truncate\s+table|grant|revoke|commit|rollback|with\s+\w+\s+as|set\s+(serveroutput|define|feedback)|prompt|whenever|exec(ute)?)\b/gim;

/** File extensions whose content must be checked before the PL/SQL tools apply. */
export const AMBIGUOUS_EXTENSIONS = ['.txt'];

export function looksLikeSql(text: string): boolean {
    const sample = cleanPlSql(text.length > 300_000 ? text.slice(0, 300_000) : text);
    if (!sample.includes(';')) { return false; }
    if (STRONG.test(sample)) { return true; }
    const hits = sample.match(STATEMENT);
    return !!hits && hits.length >= 2;
}

/** `.sql` and the Oracle-specific extensions are always source; `.txt` only when it contains SQL. */
export function acceptsContent(fsPath: string, text: string): boolean {
    const lower = fsPath.toLowerCase();
    return AMBIGUOUS_EXTENSIONS.some(e => lower.endsWith(e)) ? looksLikeSql(text) : true;
}
