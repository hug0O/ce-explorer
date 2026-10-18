/**
 * PL/SQL code generators: package skeletons, CRUD packages from a table,
 * exception blocks, PLDoc headers (and their refresh) and utPLSQL test packages.
 */
import { PlMember, PlParam, PlUnit } from './plsqlParse';
import { declType } from './plsqlExtract';

export interface ProcSpec {
    kind: 'procedure' | 'function';
    name: string;
    params: { name: string; mode?: 'IN' | 'OUT' | 'IN OUT'; type: string; defaultValue?: string }[];
    returns?: string;
    doc?: string;
}

export interface HeaderOptions {
    author?: string;
    date?: string;
}

const pad = (names: string[]): number => Math.max(0, ...names.map(n => n.length));

function paramList(params: ProcSpec['params'], indent: string): string {
    if (params.length === 0) { return ''; }
    const w = pad(params.map(p => p.name));
    const m = pad(params.map(p => p.mode ?? 'IN'));
    const lines = params.map(p => `${indent}  ${p.name.padEnd(w)} ${(p.mode ?? 'IN').padEnd(m)} ${p.type}${p.defaultValue ? ' DEFAULT ' + p.defaultValue : ''}`);
    return `(\n${lines.join(',\n')}\n${indent})`;
}

export function subprogramSignature(p: ProcSpec, indent = '  '): string {
    const head = `${p.kind === 'function' ? 'FUNCTION' : 'PROCEDURE'} ${p.name}${paramList(p.params, indent)}`;
    return indent + head + (p.kind === 'function' ? ` RETURN ${p.returns ?? 'VARCHAR2'}` : '');
}

function docFor(p: ProcSpec, opts: HeaderOptions, indent: string): string {
    const lines = [`${indent}/**`, `${indent} * ${p.doc ?? 'TODO: describe ' + p.name}`];
    p.params.forEach(par => lines.push(`${indent} * @param ${par.name} ${par.mode ?? 'IN'} ${par.type}`));
    if (p.kind === 'function') { lines.push(`${indent} * @return ${p.returns ?? 'VARCHAR2'}`); }
    if (opts.author) { lines.push(`${indent} * @author ${opts.author}`); }
    if (opts.date) { lines.push(`${indent} * @date ${opts.date}`); }
    lines.push(`${indent} */`);
    return lines.join('\n');
}

export function generatePackage(name: string, procs: ProcSpec[], opts: HeaderOptions = {}): { spec: string; body: string } {
    const spec = [
        `CREATE OR REPLACE PACKAGE ${name} AS`,
        ...procs.map(p => `\n${docFor(p, opts, '  ')}\n${subprogramSignature(p)};`),
        '',
        `END ${name};`,
        '/',
        '',
    ].join('\n');
    const body = [
        `CREATE OR REPLACE PACKAGE BODY ${name} AS`,
        ...procs.map(p => `\n${subprogramSignature(p)} IS\n  BEGIN\n    ${p.kind === 'function' ? 'RETURN NULL;' : 'NULL;'} -- TODO: implement\n  END ${p.name};`),
        '',
        `END ${name};`,
        '/',
        '',
    ].join('\n');
    return { spec, body };
}

/** Parses "a, b OUT NUMBER, c IN VARCHAR2" / "p_id NUMBER" style input from a prompt. */
export function parseParamInput(input: string): ProcSpec['params'] {
    return input.split(',').map(s => s.trim()).filter(Boolean).map(seg => {
        const m = seg.match(/^([A-Za-z_][\w$#]*)\s+(?:(in\s+out|in|out)\s+)?(.+)$/i);
        if (!m) { return { name: seg.split(/\s+/)[0], mode: 'IN' as const, type: 'VARCHAR2' }; }
        const mode = m[2] ? (m[2].toUpperCase().replace(/\s+/g, ' ') as 'IN' | 'OUT' | 'IN OUT') : 'IN';
        return { name: m[1], mode, type: m[3].trim() };
    });
}

export interface ColumnDef { name: string; type: string; nullable: boolean; primaryKey: boolean }

export function crudPackage(table: string, columns: ColumnDef[], primaryKey: string[], packageName?: string, opts: HeaderOptions = {}): { spec: string; body: string } | { error: string } {
    const pkNames = new Set(primaryKey.map(c => c.toLowerCase()));
    const pk = columns.filter(c => pkNames.has(c.name.toLowerCase()));
    if (columns.length === 0) { return { error: 'The table has no column.' }; }
    if (pk.length === 0) { return { error: `${table} has no PRIMARY KEY: update / delete / get need one.` }; }
    const rest = columns.filter(c => !pkNames.has(c.name.toLowerCase()));
    const t = table.toLowerCase();
    const pName = packageName || `pkg_${t.split('.').pop()}`;
    const par = (c: ColumnDef, mode: 'IN' | 'OUT' = 'IN') => ({ name: 'p_' + c.name.toLowerCase(), mode, type: `${table}.${c.name}%TYPE` });
    const where = pk.map(c => `${c.name} = p_${c.name.toLowerCase()}`).join('\n       AND ');

    const procs: ProcSpec[] = [
        { kind: 'procedure', name: 'insert_row', params: columns.map(c => par(c)), doc: `Inserts a row into ${table}.` },
        { kind: 'procedure', name: 'update_row', params: [...pk, ...rest].map(c => par(c)), doc: `Updates the row of ${table} identified by its primary key.` },
        { kind: 'procedure', name: 'delete_row', params: pk.map(c => par(c)), doc: `Deletes the row of ${table} identified by its primary key.` },
        { kind: 'function', name: 'get_row', params: pk.map(c => par(c)), returns: `${table}%ROWTYPE`, doc: `Returns the row of ${table} (NO_DATA_FOUND when absent).` },
        { kind: 'function', name: 'row_exists', params: pk.map(c => par(c)), returns: 'BOOLEAN', doc: `TRUE when the row exists in ${table}.` },
    ];
    const { spec } = generatePackage(pName, procs, opts);
    const sig = (p: ProcSpec) => subprogramSignature(p);
    const colList = columns.map(c => c.name).join(', ');
    const valList = columns.map(c => 'p_' + c.name.toLowerCase()).join(', ');
    const setList = rest.map(c => `${c.name} = p_${c.name.toLowerCase()}`).join(',\n           ');
    const body = [
        `CREATE OR REPLACE PACKAGE BODY ${pName} AS`,
        '',
        `${sig(procs[0])} IS\n  BEGIN\n    INSERT INTO ${table} (${colList})\n    VALUES (${valList});\n  END insert_row;`,
        '',
        rest.length
            ? `${sig(procs[1])} IS\n  BEGIN\n    UPDATE ${table}\n       SET ${setList}\n     WHERE ${where};\n  END update_row;`
            : `${sig(procs[1])} IS\n  BEGIN\n    NULL; -- every column is part of the primary key: nothing to update\n  END update_row;`,
        '',
        `${sig(procs[2])} IS\n  BEGIN\n    DELETE FROM ${table}\n     WHERE ${where};\n  END delete_row;`,
        '',
        `${sig(procs[3])} IS\n    l_row ${table}%ROWTYPE;\n  BEGIN\n    SELECT *\n      INTO l_row\n      FROM ${table}\n     WHERE ${where};\n    RETURN l_row;\n  END get_row;`,
        '',
        `${sig(procs[4])} IS\n    l_count PLS_INTEGER;\n  BEGIN\n    SELECT COUNT(*)\n      INTO l_count\n      FROM ${table}\n     WHERE ${where};\n    RETURN l_count > 0;\n  END row_exists;`,
        '',
        `END ${pName};`,
        '/',
        '',
    ].join('\n');
    return { spec, body };
}

export function exceptionBlock(indent = '', style: 'reraise' | 'log' = 'reraise'): string {
    const lines = [
        'EXCEPTION',
        '  WHEN NO_DATA_FOUND THEN',
        '    -- TODO: the row does not exist',
        '    RAISE;',
        '  WHEN TOO_MANY_ROWS THEN',
        '    -- TODO: the query must return a single row',
        '    RAISE;',
        '  WHEN OTHERS THEN',
        style === 'log'
            ? '    -- TODO: log SQLERRM and DBMS_UTILITY.FORMAT_ERROR_BACKTRACE here'
            : '    -- TODO: log SQLERRM / DBMS_UTILITY.FORMAT_ERROR_BACKTRACE if needed',
        '    RAISE;',
    ];
    return lines.map(l => indent + l).join('\n') + '\n';
}

function toProcSpec(m: PlMember): ProcSpec {
    return {
        kind: m.kind === 'function' ? 'function' : 'procedure', name: m.name, returns: m.returnType,
        params: m.params.map((p: PlParam) => ({ name: p.name, mode: p.direction === 'in' ? 'IN' : p.direction === 'out' ? 'OUT' : 'IN OUT', type: p.type, defaultValue: p.defaultValue })),
    };
}

/** PLDoc header for a subprogram, indented like the subprogram. */
export function plDocHeader(m: PlMember, opts: HeaderOptions = {}, indent = '  ', description?: string): string {
    return docFor({ ...toProcSpec(m), doc: description }, opts, indent) + '\n';
}

/**
 * Refreshes an existing PLDoc block from the current signature: keeps the
 * description and any text written after existing @param names, drops
 * parameters that are gone, adds the new ones, fixes the @return.
 */
export function updatePlDoc(block: string, m: PlMember, indent = '  '): string {
    const lines = block.replace(/\s+$/, '').split(/\r?\n/);
    const kept = new Map<string, string>();
    const head: string[] = [];
    const tail: string[] = [];
    let seenParam = false;
    for (const l of lines) {
        const pm = l.match(/^\s*\*\s*@param\s+(\w+)\s*(.*)$/);
        if (pm) { seenParam = true; kept.set(pm[1].toLowerCase(), pm[2]); continue; }
        if (/^\s*\*\s*@return\b/.test(l)) { seenParam = true; continue; }
        if (/^\s*\*\/\s*$/.test(l)) { continue; }
        (seenParam ? tail : head).push(l);
    }
    const params = m.params.map(p => {
        const old = kept.get(p.name.toLowerCase());
        return `${indent} * @param ${p.name} ${old !== undefined && old.trim() ? old.trim() : `${p.direction === 'in' ? 'IN' : p.direction === 'out' ? 'OUT' : 'IN OUT'} ${p.type}`}`;
    });
    const ret = m.kind === 'function' ? [`${indent} * @return ${m.returnType ?? ''}`.trimEnd()] : [];
    const normalizedHead = head.map(h => h.replace(/^\s*(\/\*\*|\*)/, (_, g) => indent + (g === '/**' ? '/**' : ' *')));
    return [...normalizedHead, ...params, ...ret, ...tail, `${indent} */`].join('\n') + '\n';
}

/** utPLSQL test package (spec + body) for the public subprograms of a package spec. */
export function utplsqlTests(spec: PlUnit): { spec: string; body: string } {
    const subs = spec.members.filter(m => m.kind === 'procedure' || m.kind === 'function');
    const pkg = 'ut_' + spec.name.split('.').pop()!.toLowerCase().replace(/^pkg_/, '');
    const testName = (m: PlMember, i: number): string => 'test_' + m.name.toLowerCase() + (subs.filter(s => s.name.toLowerCase() === m.name.toLowerCase()).length > 1 ? '_' + (i + 1) : '');
    const specText = [
        `CREATE OR REPLACE PACKAGE ${pkg} AS`,
        `  --%suite(${spec.name})`,
        '  --%rollback(manual)',
        '',
        ...subs.map((m, i) => `  --%test(${m.name} works as expected)\n  PROCEDURE ${testName(m, i)};\n`),
        `END ${pkg};`,
        '/',
        '',
    ].join('\n');
    const bodyText = [
        `CREATE OR REPLACE PACKAGE BODY ${pkg} AS`,
        '',
        ...subs.map((m, i) => {
            const call = m.kind === 'function'
                ? `    l_actual := ${spec.name}.${m.name}(${m.params.map(p => `NULL /* ${p.name} */`).join(', ')});`
                : `    ${spec.name}.${m.name}(${m.params.map(p => `NULL /* ${p.name} */`).join(', ')});`;
            return [
                `  PROCEDURE ${testName(m, i)} IS`,
                ...(m.kind === 'function' ? [`    l_actual ${declType(m.returnType ?? 'VARCHAR2')};`, '    l_expected ' + declType(m.returnType ?? 'VARCHAR2') + ';'] : []),
                '  BEGIN',
                '    -- Arrange',
                '    NULL;',
                '    -- Act',
                call,
                '    -- Assert',
                ...(m.kind === 'function' ? ['    ut.expect(l_actual).to_equal(l_expected);'] : ['    ut.expect(1).to_equal(1); -- TODO: assert the side effects']),
                `  END ${testName(m, i)};`,
                '',
            ].join('\n');
        }),
        `END ${pkg};`,
        '/',
        '',
    ].join('\n');
    return { spec: specText, body: bodyText };
}
