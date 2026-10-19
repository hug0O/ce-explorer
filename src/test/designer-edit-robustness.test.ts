import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { TextEdit, applyTextEdits, buildUnitEdits, normalizeEdits, resolveComponentDef, scanFormClass, usesEdits } from '../services/DelphiForm';
import { DfmNode, findNode, parseDfmTree } from '../services/DelphiLayout';
import { copyComponents } from '../services/DelphiClip';
import {
    DesignResult, addEdits, buildDesignModel, deleteEdits, namesWithin, pasteEdits, renameEdits, reparentEdits, verifyEdit,
} from '../services/DesignerModel';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const read = (f: string): string => fs.readFileSync(path.join(dir, f), 'utf8');

/* ───────── normalizeEdits: what the editor is given never overlaps ───────── */

test('normalizeEdits sorts, drops exact duplicates and merges overlapping removals', () => {
    const r = normalizeEdits([
        { offset: 20, length: 5, text: '' },
        { offset: 10, length: 6, text: '' },
        { offset: 14, length: 4, text: '' },
        { offset: 20, length: 5, text: '' },
    ]);
    assert.ok('edits' in r);
    assert.deepEqual((r as { edits: TextEdit[] }).edits, [{ offset: 10, length: 8, text: '' }, { offset: 20, length: 5, text: '' }]);
});

test('normalizeEdits reports two replacements of the same text instead of handing them to the editor', () => {
    const r = normalizeEdits([{ offset: 5, length: 4, text: 'a' }, { offset: 7, length: 4, text: 'b' }]);
    assert.ok('error' in r);
    assert.match((r as { error: string }).error, /overlap/);
    const inside = normalizeEdits([{ offset: 5, length: 10, text: '' }, { offset: 8, text: 'x' }]);
    assert.ok('error' in inside, 'an insertion inside a removed block cannot be kept');
});

test('normalizeEdits keeps insertions at the same place in the order given, and before a range starting there', () => {
    const r = normalizeEdits([{ offset: 4, length: 3, text: 'R' }, { offset: 4, text: 'A' }, { offset: 4, text: 'B' }]) as { edits: TextEdit[] };
    assert.deepEqual(r.edits.map(e => e.text), ['A', 'B', 'R']);
    assert.equal(applyTextEdits('0123456789', [{ offset: 4, text: 'A' }, { offset: 4, text: 'B' }]), '0123AB456789', 'same order as a WorkspaceEdit');
});

/* ───────── a battery of designer actions never produces edits the editor would refuse ───────── */

const FORMS: [string, string][] = [
    ['MainForm', 'MainForm'], ['LayoutForm', 'LayoutForm'], ['golden/ComplexForm', 'ComplexForm'], ['ThirdPartyForm', 'ThirdPartyForm'],
    ['TileForm', 'TileForm'], ['GridForm', 'GridForm'], ['UniForm', 'UniForm'],
];

function allNodes(n: DfmNode): DfmNode[] { return [n, ...n.children.flatMap(allNodes)]; }

function assertApplicable(label: string, dfm: string, pas: string, r: DesignResult): void {
    if ('error' in r) { return; }
    const d = normalizeEdits(r.dfmEdits);
    const p = normalizeEdits(r.pasEdits);
    assert.ok('edits' in d, `${label}: .dfm edits overlap (${'error' in d ? d.error : ''})`);
    assert.ok('edits' in p, `${label}: .pas edits overlap (${'error' in p ? p.error : ''})`);
    const out = applyTextEdits(dfm, (d as { edits: TextEdit[] }).edits);
    assert.ok(parseDfmTree(out), `${label}: the .dfm is still readable`);
    void pas;
}

for (const [file, cls] of FORMS) {
    test(`${file}: add / delete / rename / move / paste never overlap`, () => {
        const dfm = read(file + '.dfm');
        const pas = read(file + '.pas');
        const root = parseDfmTree(dfm)!;
        assert.ok(root && buildDesignModel(dfm));
        const nodes = allNodes(root).slice(1);

        for (const parent of [root, ...nodes.filter(n => n.children.length > 0)]) {
            assertApplicable(`add into ${parent.name}`, dfm, pas, addEdits(pas, dfm, { className: 'TButton', parentName: parent.depth === 0 ? undefined : parent.name, left: 10, top: 10 }));
        }
        for (const n of nodes) {
            assertApplicable(`delete ${n.name}`, dfm, pas, deleteEdits(pas, dfm, [n.name], root.className));
            assertApplicable(`rename ${n.name}`, dfm, pas, renameEdits(pas, dfm, n.name, n.name + 'Z'));
        }
        assertApplicable('delete everything', dfm, pas, deleteEdits(pas, dfm, nodes.map(n => n.name), root.className));

        const containers = nodes.filter(n => n.children.length > 0);
        for (const target of containers) {
            // everything, including parents together with their own children, into one container
            const names = nodes.map(n => n.name);
            const r = reparentEdits(dfm, names, target.name, names.map(() => ({ left: 4, top: 4 })));
            assertApplicable(`move all into ${target.name}`, dfm, pas, r);
            if (!('error' in r)) {
                const after = applyTextEdits(dfm, (normalizeEdits(r.dfmEdits) as { edits: TextEdit[] }).edits);
                const moved = parseDfmTree(after)!;
                assert.equal(allNodes(moved).length, allNodes(root).length, 'no component lost or duplicated by the move');
                void findNode;
            }
        }

        for (const n of nodes.slice(0, 12)) {
            const copied = copyComponents(pas, dfm, [n.name], () => '');
            if ('error' in copied) { continue; }
            for (const target of [root, ...containers.slice(0, 3)]) {
                const r = pasteEdits(pas, dfm, copied.payload, target.name);
                assertApplicable(`paste ${n.name} into ${target.name}`, dfm, pas, r);
            }
        }
        void cls;
    });
}

test('moving a container together with its own child moves each block once', () => {
    const dfm = read('golden/ComplexForm.dfm');
    const root = parseDfmTree(dfm)!;
    const panel = allNodes(root).find(n => n.name === 'pnlGauche')!;
    const child = panel.children[0];
    const target = allNodes(root).find(n => n.name === 'pnlBas')!;
    const r = reparentEdits(dfm, [panel.name, child.name], target.name, [{ left: 4, top: 4 }, { left: 4, top: 4 }]);
    assert.ok(!('error' in r));
    const out = applyTextEdits(dfm, (normalizeEdits((r as { dfmEdits: TextEdit[] }).dfmEdits) as { edits: TextEdit[] }).edits);
    const moved = parseDfmTree(out)!;
    assert.equal(findNode(moved, panel.name)!.parent!.name, target.name);
    assert.equal(findNode(moved, child.name)!.parent!.name, panel.name, 'the child stays in its container');
    assert.equal(allNodes(moved).length, allNodes(root).length);
    assert.equal(verifyEdit(dfm, out, { touched: [panel.name], props: ['Left', 'Top'], reparented: [panel.name] }), undefined);
    void namesWithin;
});

/* ───────── paste in the designer ───────── */

test('paste puts a copy of a component into the chosen container, renamed, with its field in the unit', () => {
    const dfm = read('golden/ComplexForm.dfm');
    const pas = read('golden/ComplexForm.pas');
    const root = parseDfmTree(dfm)!;
    const btn = allNodes(root).find(n => n.className === 'TButton')!;
    const target = allNodes(root).find(n => n.name === 'pnlBas')!;
    const copied = copyComponents(pas, dfm, [btn.name], () => '');
    assert.ok(!('error' in copied));
    const r = pasteEdits(pas, dfm, (copied as { payload: never }).payload, target.name);
    assert.ok(!('error' in r), 'error' in r ? r.error : '');
    const added = (r as { added: string[] }).added;
    assert.equal(added.length, 1);
    assert.notEqual(added[0].toLowerCase(), btn.name.toLowerCase(), 'renamed where it would clash');
    const out = applyTextEdits(dfm, (r as { dfmEdits: TextEdit[] }).dfmEdits);
    assert.equal(findNode(parseDfmTree(out)!, added[0])!.parent!.name, target.name);
    assert.match(applyTextEdits(pas, (r as { pasEdits: TextEdit[] }).pasEdits), new RegExp(added[0] + ': TButton;'));
    assert.equal(verifyEdit(dfm, out, { added }), undefined);
});

test('paste refuses a grid part outside a grid; a control pasted onto a grid goes next to it', () => {
    const dfm = read('GridForm.dfm');
    const pas = read('GridForm.pas');
    const root = parseDfmTree(dfm)!;
    const column = allNodes(root).find(n => n.className === 'TcxGridDBColumn')!;
    const copiedColumn = copyComponents(pas, dfm, [column.name], () => '');
    assert.ok(!('error' in copiedColumn));
    const outside = pasteEdits(pas, dfm, (copiedColumn as { payload: never }).payload, root.name);
    assert.ok('error' in outside && /goes inside/.test(outside.error), 'error' in outside ? outside.error : 'accepted');

    const grid = allNodes(root).find(n => n.className === 'TcxGrid')!;
    const plain = allNodes(root).find(n => n.className === 'TcxButton')!;
    const copied = copyComponents(pas, dfm, [plain.name], () => '');
    assert.ok(!('error' in copied));
    const next = pasteEdits(pas, dfm, (copied as { payload: never }).payload, grid.name);
    assert.ok(!('error' in next), 'error' in next ? next.error : '');
    const name = (next as { roots: string[] }).roots[0];
    const out = parseDfmTree(applyTextEdits(dfm, (next as { dfmEdits: TextEdit[] }).dfmEdits))!;
    assert.equal(findNode(out, name)!.parent!.name, grid.parent!.name, 'a grid holds only its own parts: the copy lands in the container around it');
});

/* ───────── .pas: where a new field goes ───────── */

const UNIT = [
    'unit Unit1;', '', 'interface', '', 'uses', '  Winapi.Windows, Vcl.Forms, Vcl.StdCtrls;', '', 'type',
    '  TForm1 = class(TForm)',
    '    Button1: TButton;',
    '    // a comment; with a semicolon',
    '    Edit1, Edit2: TEdit;',
    '    Label1: TLabel; { trailing comment }',
    '    procedure Button1Click(Sender: TObject);',
    '    procedure Edit1KeyPress(Sender: TObject;',
    '      var Key: Char);',
    '  private',
    '    FCount: Integer;',
    '  public',
    '  end;', '', 'var', '  Form1: TForm1;', '', 'implementation', '', '{$R *.dfm}', '',
    'procedure TForm1.Button1Click(Sender: TObject);', 'begin', 'end;', '', 'end.', '',
].join('\n');

test('scanFormClass reads wrapped declarations, several names per field and comments', () => {
    const s = scanFormClass(UNIT, 'TForm1')!;
    const lines = UNIT.split('\n');
    assert.equal(lines[s.lastFieldEnd].trim().startsWith('Label1'), true, 'last field is Label1');
    assert.match(lines[s.lastMethodEnd], /var Key: Char\);/, 'a method declared on two lines ends on its second line');
    assert.match(lines[s.sectionEnd], /private/);
});

test('a new component field goes right under the last field, whatever sits among the fields', () => {
    const def = resolveComponentDef('TButton');
    const plan = buildUnitEdits(UNIT, { formClass: 'TForm1', componentName: 'Button2', def, event: { name: 'OnClick', params: 'Sender: TObject' } })!;
    const out = applyTextEdits(UNIT, plan.edits).split('\n');
    const at = (re: RegExp): number => out.findIndex(l => re.test(l));
    assert.equal(at(/^\s+Button2: TButton;/), at(/Label1: TLabel;/) + 1, 'right below the last field');
    assert.ok(at(/procedure Button2Click\(Sender: TObject\);/) > at(/var Key: Char\);/), 'its handler declaration comes after the last method, not inside a wrapped one');
    assert.ok(at(/procedure Edit1KeyPress/) + 1 === at(/var Key: Char\);/), 'the wrapped declaration is left whole');
});

test('a form without any field gets its first one at the top of the class', () => {
    const empty = UNIT.split('\n').filter(l => !/^\s+(Button1|Edit1, Edit2|Label1|procedure|var Key|\/\/ a comment)/.test(l)).join('\n');
    const plan = buildUnitEdits(empty, { formClass: 'TForm1', componentName: 'Memo1', def: resolveComponentDef('TMemo') })!;
    const out = applyTextEdits(empty, plan.edits).split('\n');
    assert.match(out[out.findIndex(l => /TForm1 = class/.test(l)) + 1], /^\s+Memo1: TMemo;/);
});

test('long lists of units wrap instead of making a line of several hundred columns', () => {
    const units = ['cxGraphics', 'cxControls', 'cxLookAndFeels', 'cxLookAndFeelPainters', 'cxStyles', 'cxCustomData', 'cxFilter', 'cxData', 'cxDataStorage', 'cxEdit', 'cxNavigator', 'cxGridCustomTableView', 'cxGridTableView', 'cxGridCustomView', 'cxClasses'];
    const out = applyTextEdits(UNIT, usesEdits(UNIT, units));
    assert.ok(out.split('\n').every(l => l.length <= 110), 'no line is longer than the clause allows');
    for (const u of units) { assert.match(out, new RegExp('\\b' + u + '\\b')); }
    assert.match(out, /Vcl\.StdCtrls,\s*cxGraphics/, 'the new units continue the clause');
    assert.match(out, /;\n\ntype/, 'the clause still ends with its semicolon');
});
