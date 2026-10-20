import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// A tiny `vscode`: a workspace that is one folder on the disk.
const nodeModule = require('node:module');
const originalLoad = nodeModule._load;
let folder = '';
let statCalls = 0;
let readCalls = 0;
const toUri = (p: string) => ({ fsPath: p, path: p, toString: () => p });
const vscodeMock = {
    Uri: { file: toUri },
    workspace: {
        get workspaceFolders() { return [{ uri: toUri(folder) }]; },
        findFiles: async () => fs.readdirSync(folder).filter(f => /\.(pas|dfm)$/i.test(f)).map(f => toUri(path.join(folder, f))),
        fs: {
            stat: async (u: { fsPath: string }) => { statCalls++; const s = fs.statSync(u.fsPath); return { mtime: s.mtimeMs, size: s.size, ctime: s.ctimeMs, type: 1 }; },
            readFile: async (u: { fsPath: string }) => { readCalls++; return fs.readFileSync(u.fsPath); },
        },
    },
};
nodeModule._load = (request: string, parent: unknown, isMain: boolean) => (request === 'vscode' ? vscodeMock : originalLoad(request, parent, isMain));
const { ProjectScanner } = require('../services/ProjectScanner') as typeof import('../services/ProjectScanner');
const { projectHtml } = require('../webview/projectHtml') as typeof import('../webview/projectHtml');
const { gitShow, activeDfm } = require('../webview/ProjectPanel') as typeof import('../webview/ProjectPanel');

const fixtures = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');

function project(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-project-'));
    for (const n of ['NonVisualForm', 'WrappedForm']) {
        for (const ext of ['.pas', '.dfm']) { fs.copyFileSync(path.join(fixtures, n + ext), path.join(dir, n + ext)); }
    }
    // a unit with no form that uses a unit of the project without using anything of it
    fs.writeFileSync(path.join(dir, 'UTools.pas'), 'unit UTools;\ninterface\nprocedure Tool;\nimplementation\nprocedure Tool;\nbegin\nend;\nend.\n');
    fs.writeFileSync(path.join(dir, 'UMain.pas'), 'unit UMain;\ninterface\nuses UTools;\nimplementation\nend.\n');
    return dir;
}

test('a scan reads each unit once, gives the SQL, the unused code and the form checks', async () => {
    folder = project();
    const scanner = new ProjectScanner();
    const seen: number[] = [];
    const data = await scanner.scan(undefined, done => seen.push(done));
    assert.equal(data.units, 4);
    assert.equal(data.forms, 2);
    assert.equal(data.read, 4);
    assert.equal(data.cached, 0);
    assert.deepEqual(seen, [1, 2, 3, 4], 'progress is reported unit by unit');
    const q = data.sql.find(e => e.owner === 'UniQuery1')!;
    assert.deepEqual([q.source, q.tables], ['dfm', ['CLIENTS']]);
    assert.ok(q.file.endsWith('NonVisualForm.dfm'), 'a statement of the form points to the .dfm');
    assert.deepEqual(data.unusedUnits.map(u => [u.unit, u.used]), [['UMain', 'UTools']]);
    assert.ok(data.unusedUnits[0].path.endsWith('UMain.pas'));
    assert.ok(data.unusedComponents.some(c => c.component === 'DataSource1'));
    assert.equal(data.formChecks.length, 0, 'the two forms agree with their units');
});

test('the next scan only reads what changed', async () => {
    folder = project();
    const scanner = new ProjectScanner();
    await scanner.scan();
    readCalls = 0;
    statCalls = 0;
    const again = await scanner.scan();
    assert.deepEqual([again.read, again.cached, readCalls], [0, 4, 0], 'nothing is read again');
    assert.ok(statCalls > 0, 'but every file is looked at');

    const file = path.join(folder, 'WrappedForm.pas');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('btnSave.Enabled := FCount < 3;', 'btnSave.Enabled := FCount < 4;'));
    const future = new Date(Date.now() + 5000);
    fs.utimesSync(file, future, future);
    const changed = await scanner.scan();
    assert.deepEqual([changed.read, changed.cached], [1, 3]);

    fs.rmSync(path.join(folder, 'UMain.pas'));
    assert.equal((await scanner.scan()).units, 3, 'a file that is gone is forgotten');
});

test('a form that disagrees with its unit shows in the checks', async () => {
    folder = project();
    fs.writeFileSync(path.join(folder, 'WrappedForm.pas'), fs.readFileSync(path.join(folder, 'WrappedForm.pas'), 'utf8').replace('    edtAfter: TEdit;\n', '    edtAfter: TEdit;\n    ghost: TButton;\n'));
    const data = await new ProjectScanner().scan();
    assert.deepEqual(data.formChecks.map(f => [f.unit, f.issues.map(i => i.message)]), [['WrappedForm', ['Field ghost: TButton has no component in the .dfm: it stays nil at runtime']]]);
});

test('a scan can be cancelled, and two asks share one scan', async () => {
    folder = project();
    const scanner = new ProjectScanner();
    const cancelled = await scanner.scan({ isCancellationRequested: true } as never);
    assert.equal(cancelled.units, 0);
    folder = project();
    const a = scanner.scan();
    const b = scanner.scan();
    assert.equal(a, b, 'the second ask joins the first');
    await a;
});

test('the page: a nonce for the style and the script, no inline style attribute, no data in it', () => {
    const html = projectHtml('N0NCE');
    assert.match(html, /Content-Security-Policy[^>]*style-src 'nonce-N0NCE'; script-src 'nonce-N0NCE'/);
    assert.equal((html.match(/<script nonce="N0NCE">/g) ?? []).length, 1);
    assert.ok(!/\sstyle=/i.test(html), 'an inline style attribute would be ignored by the CSP');
    assert.ok(!/innerHTML/.test(html), 'the data is drawn as text, never as markup');
    assert.match(html, /id="scan"/);
    // the script is plain JavaScript
    const script = /<script nonce="N0NCE">([\s\S]*)<\/script>/.exec(html)![1];
    assert.doesNotThrow(() => new Function('acquireVsCodeApi', 'document', 'window', script.replace('render();\n  vscode.postMessage', 'void 0;\n  vscode.postMessage')), 'it parses');
});

test('git versions: a version is never an option, a form is the .dfm of the editor', async () => {
    await assert.rejects(gitShow(path.join(fixtures, 'WrappedForm.dfm'), '--output=/tmp/x'), /not a version/);
    await assert.rejects(gitShow(path.join(fixtures, 'WrappedForm.dfm'), 'a b'), /not a version/);
    const doc = (p: string) => ({ uri: { fsPath: p } }) as never;
    assert.equal(activeDfm(doc(path.join(fixtures, 'WrappedForm.pas'))), path.join(fixtures, 'WrappedForm.dfm'));
    assert.equal(activeDfm(doc(path.join(fixtures, 'WrappedForm.dfm'))), path.join(fixtures, 'WrappedForm.dfm'));
    assert.equal(activeDfm(doc(path.join(fixtures, 'Nothing.pas'))), undefined);
    assert.equal(activeDfm(undefined), undefined);
    const committed = await gitShow(path.join(fixtures, 'NonVisualForm.dfm'), 'HEAD').catch(() => '');
    assert.ok(committed === '' || /object NonVisualForm/.test(committed), 'the committed version of a tracked form');
});
