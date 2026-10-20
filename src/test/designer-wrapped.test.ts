import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

// The review service and the Pascal provider load `vscode`: a hand-made one is enough here.
const nodeModule = require('node:module');
const originalLoad = nodeModule._load;
const vscodeMock = {
    Uri: { file: (p: string) => ({ fsPath: p, path: p, toString: () => p }), parse: (u: string) => ({ path: u }) },
    Position: class { constructor(public readonly line: number, public readonly character: number) {} },
    Range: class {
        public readonly start: { line: number; character: number };
        public readonly end: { line: number; character: number };
        constructor(a: { line: number; character: number } | number, b: { line: number; character: number } | number, c?: number, d?: number) {
            if (c === undefined) { this.start = a as { line: number; character: number }; this.end = b as { line: number; character: number }; }
            else { this.start = { line: a as number, character: b as number }; this.end = { line: c, character: d as number }; }
        }
        contains(p: { line: number }): boolean { return p.line >= this.start.line && p.line <= this.end.line; }
    },
    EndOfLine: { LF: 0 },
    languages: {},
};
nodeModule._load = (request: string, parent: unknown, isMain: boolean) => (request === 'vscode' ? vscodeMock : originalLoad(request, parent, isMain));

import { TextEdit, applyTextEdits, normalizeEdits } from '../services/DelphiForm';
import { parseDfmTree } from '../services/DelphiLayout';
import { checkForm, fixIssue, readUnit } from '../services/DelphiCheck';
import { DNode, buildDesignModel, deleteEdits, pasteEdits, renameEdits, setPropertyEdits } from '../services/DesignerModel';
import { copyComponents } from '../services/DelphiClip';
import { handlerImplementation } from '../services/DelphiSync';
const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as typeof import('../providers/PascalLanguageProvider');
const { reviewDocument } = require('../services/CodeReviewService') as typeof import('../services/CodeReviewService');

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(dir, 'WrappedForm.dfm'), 'utf8');
const pas = fs.readFileSync(path.join(dir, 'WrappedForm.pas'), 'utf8');

const flat = (n: DNode): DNode[] => [n, ...n.children.flatMap(flat)];
const apply = (text: string, edits: TextEdit[]): string => applyTextEdits(text, (normalizeEdits(edits) as { edits: TextEdit[] }).edits);

function documentOf(text: string, fileName: string): any {
    const lines = text.split(/\r?\n/);
    return {
        uri: vscodeMock.Uri.file(fileName), languageId: 'pascal', fileName, lineCount: lines.length,
        getText: () => text, lineAt: (n: number) => ({ text: lines[n] }),
    };
}

/* ───────── a component with no name: `object TcxGridDBColumn` ───────── */

test('a nameless object does not close its parent: everything after it is still loaded', () => {
    const root = parseDfmTree(dfm)!;
    const grid = (function find(n: any, name: string): any { if (n.name === name) { return n; } for (const c of n.children) { const h = find(c, name); if (h) { return h; } } return undefined; })(root, 'cxGrid1DBTableView1');
    assert.deepEqual(grid.children.map((c: any) => c.className), ['TcxGridDBColumn', 'TcxGridDBColumn', 'TcxGridDBColumn'], 'the three columns, nameless one included');
    const names = (function walk(n: any): string[] { return [n.name, ...n.children.flatMap(walk)]; })(root);
    for (const n of ['cxGrid1Level1', 'edtAfter', 'cxGrid1DBTableView1Name']) { assert.ok(names.includes(n), n + ' comes after the nameless object and is still read'); }
    assert.equal((root.children.find((c: any) => c.name === 'edtAfter') as any).depth, 1, 'edtAfter is a child of the form, not of something that was closed too early');
});

test('the nameless object gets a unique name of its own, the others keep theirs', () => {
    const root = parseDfmTree(dfm)!;
    const nodes = (function walk(n: any): any[] { return [n, ...n.children.flatMap(walk)]; })(root);
    const anonymous = nodes.filter(n => n.anonymous);
    assert.equal(anonymous.length, 1);
    assert.equal(anonymous[0].name, 'TcxGridDBColumn_1');
    assert.equal(new Set(nodes.map(n => n.name.toLowerCase())).size, nodes.length, 'no two nodes share a name');
    const objects = [...dfm.matchAll(/^\s*object\b/gm)].length;
    assert.equal(objects, nodes.length, 'every object of the file is a node');
});

test('the designer model holds the whole form, the nameless column as a part', () => {
    const model = buildDesignModel(dfm)!;
    const names = flat(model.root).map(n => n.name);
    for (const n of ['pnlTop', 'btnSave', 'cxGrid1', 'cxGrid1DBTableView1', 'cxGrid1DBTableView1ID', 'cxGrid1DBTableView1Name', 'cxGrid1Level1', 'edtAfter']) {
        assert.ok(names.includes(n), n + ' is in the model');
    }
});

test('a nameless component is edited and deleted in place, never renamed, and gets no field when copied', () => {
    const rename = renameEdits(pas, dfm, 'TcxGridDBColumn_1', 'colLabel');
    assert.ok('error' in rename && /no name/.test(rename.error), 'renaming it is refused, not a silent no-op');

    const prop = setPropertyEdits(dfm, 'TcxGridDBColumn_1', 'DataBinding.FieldName', 'LABEL2');
    assert.ok(!('error' in prop));
    if (!('error' in prop)) { assert.match(apply(dfm, prop.dfmEdits), /object TcxGridDBColumn\r?\n\s+DataBinding\.FieldName = 'LABEL2'/); }

    const del = deleteEdits(pas, dfm, ['TcxGridDBColumn_1'], 'TWrappedForm');
    assert.ok(!('error' in del));
    if (!('error' in del)) {
        const out = apply(dfm, del.dfmEdits);
        assert.equal((out.match(/object TcxGridDBColumn\b/g) ?? []).length, 0, 'the nameless column is gone');
        assert.ok(/cxGrid1DBTableView1Name/.test(out), 'its neighbours stay');
        assert.deepEqual(del.pasEdits, [], 'nothing to change in the unit');
    }

    const copy = copyComponents(pas, dfm, ['cxGrid1DBTableView1'], () => 'cxGridDBTableView');
    assert.ok('payload' in copy);
    if (!('payload' in copy)) { return; }
    assert.ok(!copy.payload.components.some(c => /_\d+$/.test(c.name) && c.name.startsWith('TcxGridDBColumn')), 'no component is listed for the nameless column');
    assert.match(copy.payload.objects[0], /object TcxGridDBColumn\r?\n/, 'but it travels in the text');
    const pasted = pasteEdits(pas, dfm, copy.payload, 'cxGrid1');
    assert.ok(!('error' in pasted));
    if ('error' in pasted) { return; }
    const outPas = apply(pas, pasted.pasEdits);
    const outDfm = apply(dfm, pasted.dfmEdits);
    assert.ok(!/TcxGridDBColumn_\d/.test(outPas), 'the unit gets no field for it');
    assert.equal((outDfm.match(/object TcxGridDBColumn\r?\n/g) ?? []).length, 2, 'the copy has its own nameless column');
    assert.deepEqual(checkForm(outPas, outDfm).filter(i => i.severity !== 'info'), []);
});

/* ───────── a declaration wrapped over several lines ───────── */

test('a wrapped declaration is a method, not a field', () => {
    const unit = readUnit(pas, 'TWrappedForm')!;
    assert.deepEqual(unit.methods.map(m => m.name), ['FormKeyDown', 'btnSaveClick', 'cxGrid1DBTableView1SelectionChanged', 'edtAfterExit']);
    assert.ok(!unit.fields.some(f => /^(Shift|Sender)$/i.test(f.name)), 'the second line of the parameters is not a field');
    assert.deepEqual(checkForm(pas, dfm).filter(i => i.severity !== 'info'), [], 'the unit and the form agree');
});

test('the implementation of a wrapped header is found, with its body', () => {
    const named = handlerImplementation(pas, 'TWrappedForm', 'cxGrid1DBTableView1SelectionChanged')!;
    assert.ok(named.empty, 'the handler is empty, the header being on two lines');
    const whole = pas.slice(named.start, named.end);
    assert.ok(/^procedure TWrappedForm\.cxGrid1DBTableView1SelectionChanged\r?\n\s+\(Sender: TcxCustomGridTableView\);\r?\nbegin\r?\nend;\s*$/.test(whole), 'the header on two lines, then the empty body: ' + JSON.stringify(whole));
    const keys = handlerImplementation(pas, 'TWrappedForm', 'FormKeyDown')!;
    assert.ok(!keys.empty);
});

test('deleting a component removes its empty handler, wrapped declaration and wrapped implementation', () => {
    const r = deleteEdits(pas, dfm, ['cxGrid1DBTableView1'], 'TWrappedForm');
    assert.ok(!('error' in r), 'error' in r ? r.error : '');
    if ('error' in r) { return; }
    const outPas = apply(pas, r.pasEdits);
    assert.ok(!/cxGrid1DBTableView1SelectionChanged/.test(outPas), 'neither the declaration nor the implementation is left');
    assert.ok(!/\(Sender: TcxCustomGridTableView\)/.test(outPas), 'no orphan line of parameters is left behind');
    assert.ok(/procedure FormKeyDown\(Sender: TObject; var Key: Word;\r?\n\s+Shift: TShiftState\);/.test(outPas), 'the other wrapped declaration is untouched');
    assert.ok(/procedure TWrappedForm\.FormKeyDown/.test(outPas));
    const outDfm = apply(dfm, r.dfmEdits);
    assert.ok(!/cxGrid1DBTableView1SelectionChanged/.test(outDfm));
    assert.ok(/object edtAfter: TEdit/.test(outDfm), 'what follows is intact');
});

test('a header whose method name is on the line after the dot is found too', () => {
    const exit = handlerImplementation(pas, 'TWrappedForm', 'edtAfterExit')!;
    assert.ok(exit && exit.empty);
    assert.match(pas.slice(exit.start, exit.end), /^procedure TWrappedForm\.\r?\n\s+edtAfterExit\(Sender: TObject\);\r?\nbegin\r?\nend;/);
    const r = deleteEdits(pas, dfm, ['edtAfter'], 'TWrappedForm');
    assert.ok(!('error' in r));
    if ('error' in r) { return; }
    const outPas = apply(pas, r.pasEdits);
    assert.ok(!/edtAfterExit/.test(outPas), 'declaration and implementation are both removed');
    assert.ok(!/TWrappedForm\.\s*$/m.test(outPas), 'no dangling header');
});

test('the "empty handler" fix removes a wrapped declaration whole', () => {
    const issue = checkForm(pas, dfm).find(i => /cxGrid1DBTableView1SelectionChanged/.test(i.message) && i.fixes.includes('removeEmptyHandler'));
    assert.ok(issue, 'the empty handler is reported: ' + JSON.stringify(checkForm(pas, dfm).map(i => i.message)));
    const r = fixIssue(pas, dfm, issue!, 'removeEmptyHandler');
    assert.ok(!('error' in r), 'error' in r ? r.error : '');
    if ('error' in r) { return; }
    const out = apply(pas, r.pasEdits);
    assert.ok(!/cxGrid1DBTableView1SelectionChanged/.test(out) && !/\(Sender: TcxCustomGridTableView\)/.test(out));
    assert.ok(!/cxGrid1DBTableView1SelectionChanged/.test(apply(dfm, r.dfmEdits)), 'and unlinked from the view');
});

/* ───────── the review does not misread wrapped headers ───────── */

test('the review pairs wrapped implementation headers with their declaration (no E2065)', () => {
    const provider = new PascalLanguageProvider();
    const parsed = provider.parseDocument(documentOf(pas, 'WrappedForm.pas'));
    const cls = parsed.classes.find((c: any) => c.name === 'TWrappedForm')!;
    const methods = cls.members.filter((m: any) => m.kind === 'method');
    assert.deepEqual(methods.map((m: any) => m.name), ['FormKeyDown', 'btnSaveClick', 'cxGrid1DBTableView1SelectionChanged', 'edtAfterExit']);
    assert.ok(methods.every((m: any) => m.implementationRange), 'each one has its implementation');
    assert.ok(!cls.members.some((m: any) => m.kind === 'field' && /^(Shift|Sender)$/.test(m.name)), 'the second line of a declaration is not a field');
    const keyDown = methods.find((m: any) => m.name === 'FormKeyDown');
    assert.equal(keyDown.range.end.line - keyDown.range.start.line, 1, 'a declaration on two lines covers both');
    const findings = reviewDocument(documentOf(pas, 'WrappedForm.pas'), provider);
    assert.deepEqual(findings.filter(f => f.code === 'E2065'), []);
});

test('a form that descends from a base form of the project is not "too big" for its components', () => {
    const fields = Array.from({ length: 30 }, (_, i) => `    btn${i}: TButton;`).join('\n');
    const src = ['unit Big;', 'interface', 'uses Forms, StdCtrls;', 'type', '  TBig = class(TBaseListe)', fields, '    procedure A;', '  end;', 'implementation',
        'procedure TBig.A;', 'begin', 'end;', 'end.'].join('\n');
    const findings = reviewDocument(documentOf(src, 'Big.pas'), new PascalLanguageProvider());
    assert.ok(!findings.some(f => f.category === 'Size'), JSON.stringify(findings.filter(f => f.category === 'Size')));
});

test('a variable assigned inside an anonymous method is not "uninitialized"', () => {
    const src = ['unit U;', 'interface', 'type', '  TFoo = class', '    procedure Calc;', '  end;', 'implementation',
        'procedure TFoo.Calc;', 'var', '  iCount: Integer;', 'begin', '  Run(1,', '    procedure(oQuery: TObject)', '    begin', '      iCount := 3;', '      Show(Format(\'%d\', [iCount]));', '    end);', 'end;', 'end.'].join('\n');
    const findings = reviewDocument(documentOf(src, 'U.pas'), new PascalLanguageProvider());
    assert.deepEqual(findings.filter(f => f.code === 'W1036'), []);
});

test('SQL is not "built by concatenation" when only a line break is added to a literal', () => {
    const wrap = (stmt: string): string => ['unit U;', 'interface', 'type', '  TFoo = class', '    procedure Go;', '  end;', 'implementation',
        'procedure TFoo.Go;', 'begin', stmt, 'end;', 'end.'].join('\n');
    const safe = reviewDocument(documentOf(wrap('  q.SQL.Text := StringReplace(q.SQL.Text, \'--Filter\', \'--Filter\' + CRLF, [rfReplaceAll]);'), 'U.pas'), new PascalLanguageProvider());
    assert.deepEqual(safe.filter(f => f.category === 'Security'), []);
    const hex = reviewDocument(documentOf(wrap('  q.SQL.Text := \'select 1\' + #13#10 + \'from dual\';'), 'U.pas'), new PascalLanguageProvider());
    assert.deepEqual(hex.filter(f => f.category === 'Security'), []);
    const risky = reviewDocument(documentOf(wrap('  q.SQL.Text := \'select * from t where n = \' + edtName.Text;'), 'U.pas'), new PascalLanguageProvider());
    assert.equal(risky.filter(f => f.category === 'Security').length, 1, 'a value from the user is still reported');
});
