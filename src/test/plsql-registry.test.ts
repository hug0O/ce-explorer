import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;
class P { constructor(public line: number, public character: number) {} }
class R {
    start: any; end: any;
    constructor(a: any, b: any, c?: number, d?: number) {
        if (c === undefined) { this.start = a; this.end = b; } else { this.start = { line: a, character: b }; this.end = { line: c, character: d }; }
    }
    contains(p: any) { return p.line >= this.start.line && p.line <= this.end.line; }
}
const mock = { Uri: { file: (p: string) => ({ fsPath: p, path: p, toString: () => p }) }, Position: P, Range: R, EndOfLine: { LF: 0 }, workspace: { textDocuments: [] } };
nodeModule._load = (r: string, parent: unknown, m: boolean) => (r === 'vscode' ? mock : originalLoad(r, parent, m));

const { ProviderRegistry } = require('../providers/ProviderRegistry') as typeof import('../providers/ProviderRegistry');

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'oracle');
function doc(file: string, text: string, version = 1): any {
    const uri = mock.Uri.file(path.join(dir, file));
    return { uri, languageId: 'plaintext', fileName: uri.fsPath, version, lineCount: text.split('\n').length, getText: () => text };
}

test('a .txt is handled only when it contains SQL / PL/SQL; Oracle extensions always are', () => {
    const reg = new ProviderRegistry();
    const sqlTxt = fs.readFileSync(path.join(dir, 'script.txt'), 'utf8');
    assert.equal(reg.getByDocument(doc('script.txt', sqlTxt))?.languageId, 'plsql');
    assert.equal(reg.getByDocument(doc('notes.txt', 'Liste de courses; pain, lait, oeufs')), undefined);
    assert.equal(reg.getByDocument(doc('orders.pkb', ''))?.languageId, 'plsql');
    assert.equal(reg.getByDocument(doc('x.sql', 'select 1 from dual;'))?.languageId, 'plsql');
    // the verdict follows the content when the file changes
    assert.equal(reg.getByDocument(doc('notes.txt', 'create or replace procedure p is begin null; end;', 2))?.languageId, 'plsql');
});

test('the provider exposes tables as classes, packages with their subprograms, scripts with triggers and anonymous blocks', () => {
    const reg = new ProviderRegistry();
    const provider = reg.getByFileExtension('x.txt')!;
    const parsed = provider.parseDocument(doc('script.txt', fs.readFileSync(path.join(dir, 'script.txt'), 'utf8')));
    assert.deepEqual(parsed.classes.map(c => `${c.classType}:${c.name}:${c.members.length}`), ['table:customers:4', 'table:orders:4']);
    assert.deepEqual(parsed.standaloneProcedures.map(p => p.name), ['trg_orders_bi', 'purge_old', 'anon_block_L35']);

    const spec = provider.parseDocument(doc('orders.pks', fs.readFileSync(path.join(dir, 'orders.pks'), 'utf8')));
    const create = spec.classes[0].members.find(m => m.name === 'create_order')!;
    assert.equal(create.implementationRange, undefined, 'a spec declaration has no body');
    assert.equal(create.parameters.length, 3);

    const body = provider.parseDocument(doc('orders.pkb', fs.readFileSync(path.join(dir, 'orders.pkb'), 'utf8')));
    const m = body.classes[0].members.find(x => x.name === 'create_order')!;
    assert.ok(m.implementationRange && m.implementationRange.end.line > m.range.end.line + 5, 'the body spans the IF / LOOP statements');
});
