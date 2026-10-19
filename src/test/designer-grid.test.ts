import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits, resolveComponentDef } from '../services/DelphiForm';
import { findNode, parseDfmTree, planAddComponent } from '../services/DelphiLayout';
import { planAddEvent } from '../services/DelphiEvents';
import { checkForm } from '../services/DelphiCheck';
import { isGridChild, isGridColumn, isGridHost, isGridLevel, isGridView, shownView } from '../services/DelphiGrid';
import {
    DNode, addEdits, buildDesignModel, danglingRefs, deleteEdits, renameEdits, reparentEdits, setPropertyEdits, verifyEdit,
} from '../services/DesignerModel';
import { PALETTE } from '../webview/designerHtml';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(dir, 'GridForm.dfm'), 'utf8');
const pas = fs.readFileSync(path.join(dir, 'GridForm.pas'), 'utf8');
const model = buildDesignModel(dfm)!;
const find = (n: DNode, name: string): DNode | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));
const rect = (name: string) => { const n = find(model.root, name)!; return [n.x, n.y, n.w, n.h]; };
const ok = <T extends object>(r: T | { error: string }): T => { assert.ok(!('error' in r), 'error' in r ? (r as { error: string }).error : ''); return r as T; };
const err = (r: object): string => (r as { error: string }).error;
const withEdits = (r: { dfmEdits: never[]; pasEdits: never[] }) => ({ dfm: applyTextEdits(dfm, r.dfmEdits), pas: applyTextEdits(pas, r.pasEdits) });

test('grid classes: which ones are parts of a grid', () => {
    for (const c of ['TcxGridLevel', 'TcxGridDBTableView', 'TcxGridTableView', 'TcxGridDBBandedTableView', 'TcxGridDBColumn', 'TcxGridColumn', 'TcxGridDBBandedColumn', 'TcxGridDBCardView', 'TcxGridDBCardViewRow', 'TcxGridDBChartView']) {
        assert.ok(isGridChild(c), c);
    }
    for (const c of ['TcxGrid', 'TcxGridPopupMenu', 'TcxGridViewRepository', 'TcxButton', 'TStringGrid']) { assert.ok(!isGridChild(c), c); }
    assert.ok(isGridHost('TcxGrid') && !isGridHost('TcxGridLevel'));
    assert.ok(isGridView('TcxGridDBTableView') && !isGridView('TcxGridDBColumn') && isGridColumn('TcxGridDBBandedColumn') && isGridLevel('TcxGridLevel'));
});

test('catalog: levels, views and columns, with the handler signatures of the DevExpress reference', () => {
    for (const c of ['TcxGridLevel', 'TcxGridTableView', 'TcxGridDBTableView', 'TcxGridColumn', 'TcxGridDBColumn']) {
        const d = resolveComponentDef(c);
        assert.equal(d.nested, true, c + ' has no Left / Top');
        assert.ok(d.unit.startsWith('cxGrid'), c + ' unit');
    }
    const view = resolveComponentDef('TcxGridDBTableView');
    assert.deepEqual(view.events.map(e => e.name), ['OnCellClick', 'OnCellDblClick', 'OnFocusedRecordChanged', 'OnSelectionChanged', 'OnEditValueChanged', 'OnCustomDrawCell']);
    assert.equal(view.events[0].params, 'Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean');
    assert.equal(resolveComponentDef('TcxGridDBColumn').events[0].params, 'Sender: TcxCustomGridTableItem; ARecord: TcxCustomGridRecord; var AText: string');
    assert.ok(view.extraUnits!.includes('Data.DB') && view.extraUnits!.includes('cxGridLevel'));
    const entries = PALETTE.filter(p => /^TcxGrid(DB)?(Table)?(View|Level|Column)$/.test(p.cls));
    assert.deepEqual(entries.map(e => [e.cls, e.host]), [
        ['TcxGridLevel', 'grid'], ['TcxGridTableView', 'grid'], ['TcxGridDBTableView', 'grid'], ['TcxGridColumn', 'view'], ['TcxGridDBColumn', 'view'],
    ]);
    assert.ok(!PALETTE.some(p => /Banded/.test(p.cls)), 'banded views and columns are understood but not offered');
});

test('model: levels and views are in the model as structure, the columns of the shown view are drawn as headers', () => {
    const grid = find(model.root, 'cxGrid1')!;
    assert.equal(grid.container, false, 'nothing can be dropped into a grid');
    assert.deepEqual(grid.children.map(c => [c.name, c.structural, c.fixed, c.container]), [
        ['cxGrid1DBTableView1', true, true, false], ['cxGrid1DBTableView2', true, true, false], ['cxGrid1Level1', true, true, false],
    ]);
    assert.deepEqual([grid.shownView, grid.gridBand], ['cxGrid1DBTableView1', false], 'the view of the level; its group-by band is switched off');
    assert.deepEqual(rect('cxGrid1DBTableView1ID'), [0, 0, 50, 300]);
    assert.deepEqual(rect('cxGrid1DBTableView1NOM'), [50, 0, 180, 300]);
    assert.deepEqual(rect('cxGrid1DBTableView1VILLE'), [230, 0, 120, 300]);
    const col = (n: string) => find(model.root, n)!;
    assert.deepEqual([col('cxGrid1DBTableView1NOM').structural, col('cxGrid1DBTableView1NOM').fixed, col('cxGrid1DBTableView1NOM').nonVisual], [false, true, false]);
    assert.equal(col('cxGrid1DBTableView1NOTES').structural, true, 'a column with Visible = False is not drawn');
    assert.equal(col('cxGrid1DBTableView2Column1').structural, true, 'nor are the columns of a view the grid does not show');
    assert.deepEqual(['cxGrid1DBTableView1ID', 'cxGrid1DBTableView1NOM', 'cxGrid1DBTableView2Column1'].map(n => col(n).caption), ['ID', 'Nom', 'Autre'], 'Caption, else the field');
    assert.equal(col('cxGrid1DBTableView1NOM').events['OnGetDisplayText'], 'cxGrid1DBTableView1NOMGetDisplayText');
});

test('model: group band, auto width and views of another place', () => {
    const band = buildDesignModel(dfm.replace('      OptionsView.GroupByBox = False\n', ''))!;
    assert.deepEqual([find(band.root, 'cxGrid1')!.gridBand, find(band.root, 'cxGrid1DBTableView1ID')!.y], [true, 22], 'the group-by band pushes the headers down');
    const auto = buildDesignModel(dfm.replace('      OptionsView.GroupByBox = False\n', '      OptionsView.ColumnAutoWidth = True\n'))!;
    const widths = ['ID', 'NOM', 'VILLE'].map(n => find(auto.root, 'cxGrid1DBTableView1' + n)!.w);
    assert.ok(widths[1] > 180 && widths.reduce((a, b) => a + b, 0) <= 620, 'stretched to the grid: ' + widths.join(','));
    // a level that points to a view of a repository draws no column (the repository's views are structure too)
    const repo = dfm.replace('GridView = cxGrid1DBTableView1', 'GridView = elsewhere');
    assert.equal(find(buildDesignModel(repo)!.root, 'cxGrid1')!.shownView, undefined);
    assert.equal(shownView(parseDfmTree(dfm)!.children[0])!.name, 'cxGrid1DBTableView1');
    const withRepo = dfm.replace('  object DataSource1', "  object cxGridViewRepository1: TcxGridViewRepository\n    Left = 8\n    Top = 8\n    object cxGridViewRepository1DBTableView1: TcxGridDBTableView\n      object cxGridViewRepository1DBTableView1Col: TcxGridDBColumn\n      end\n    end\n  end\n  object DataSource1");
    const m = buildDesignModel(withRepo)!;
    assert.deepEqual(find(m.root, 'cxGridViewRepository1')!.children.map(c => [c.name, c.structural, c.children.map(x => x.structural)]), [['cxGridViewRepository1DBTableView1', true, [true]]]);
});

test('inspector edits of a column and of a level', () => {
    const cap = withEdits(ok(setPropertyEdits(dfm, 'cxGrid1DBTableView1VILLE', 'Caption', 'Ville')) as never);
    assert.equal(findNode(parseDfmTree(cap.dfm)!, 'cxGrid1DBTableView1VILLE')!.props['Caption'], "'Ville'");
    const field = withEdits(ok(setPropertyEdits(dfm, 'cxGrid1DBTableView1VILLE', 'DataBinding.FieldName', 'CITY')) as never);
    assert.match(field.dfm, /DataBinding\.FieldName = 'CITY'/);
    const width = withEdits(ok(setPropertyEdits(dfm, 'cxGrid1DBTableView1ID', 'Width', 80)) as never);
    assert.match(width.dfm, /DataBinding\.FieldName = 'ID'\n {8}Width = 80/);
    const hide = withEdits(ok(setPropertyEdits(dfm, 'cxGrid1DBTableView1NOM', 'Visible', false)) as never);
    assert.equal(findNode(parseDfmTree(hide.dfm)!, 'cxGrid1DBTableView1NOM')!.props['Visible'], 'False');
    const relink = withEdits(ok(setPropertyEdits(dfm, 'cxGrid1Level1', 'GridView', 'cxGrid1DBTableView2')) as never);
    assert.equal(findNode(parseDfmTree(relink.dfm)!, 'cxGrid1Level1')!.props['GridView'], 'cxGrid1DBTableView2');
    const unlink = withEdits(ok(setPropertyEdits(dfm, 'cxGrid1Level1', 'GridView', '')) as never);
    assert.equal(findNode(parseDfmTree(unlink.dfm)!, 'cxGrid1Level1')!.props['GridView'], undefined);
    assert.match(err(setPropertyEdits(dfm, 'cxGrid1Level1', 'GridView', 'cxButton1')), /not a grid view/);
    assert.match(err(setPropertyEdits(dfm, 'cxButton1', 'DataBinding.FieldName', 'X')), /no DataBinding\.FieldName/);
    assert.match(err(setPropertyEdits(dfm, 'cxGrid1DBTableView1', 'GridView', 'cxGrid1DBTableView2')), /no GridView/);
    assert.equal(verifyEdit(dfm, hide.dfm, { touched: ['cxGrid1DBTableView1NOM'], props: ['Visible'] }), undefined);
});

test('adding levels, views and columns: only inside the right host, no position, IDE-style names', () => {
    const col = ok(addEdits(pas, dfm, { className: 'TcxGridDBColumn', parentName: 'cxGrid1DBTableView1', left: 9, top: 9 }));
    assert.equal(col.name, 'cxGrid1DBTableView1Column1', 'named after its view');
    const out = withEdits(col as never);
    const node = findNode(parseDfmTree(out.dfm)!, col.name!)!;
    assert.equal(node.parent?.name, 'cxGrid1DBTableView1');
    assert.deepEqual([node.left, node.top, node.width, node.height, node.props['TabOrder']], [undefined, undefined, undefined, undefined, undefined]);
    assert.match(out.pas, /cxGrid1DBTableView1Column1: TcxGridDBColumn;/);
    assert.equal((out.pas.match(/\bcxGridDBTableView\b/g) ?? []).length, 1, 'its unit was already there');
    assert.equal(verifyEdit(dfm, out.dfm, { added: [col.name!] }), undefined);

    // dropped on the grid, on a level or on another column: it goes to the view that is shown
    for (const parent of ['cxGrid1', 'cxGrid1DBTableView1NOM']) {
        const via = withEdits(ok(addEdits(pas, dfm, { className: 'TcxGridDBColumn', parentName: parent, left: 0, top: 0 })) as never);
        assert.equal(findNode(parseDfmTree(via.dfm)!, 'cxGrid1DBTableView1Column1')!.parent?.name, 'cxGrid1DBTableView1', parent);
    }
    const level = ok(addEdits(pas, dfm, { className: 'TcxGridLevel', parentName: 'cxGrid1', left: 0, top: 0 }));
    assert.equal(level.name, 'cxGrid1Level2');
    const view = ok(addEdits(pas, dfm, { className: 'TcxGridDBTableView', parentName: 'cxGrid1', left: 0, top: 0 }));
    assert.equal(view.name, 'cxGrid1DBTableView3');
    const viewOut = withEdits(view as never);
    assert.equal(findNode(parseDfmTree(viewOut.dfm)!, 'cxGrid1DBTableView3')!.parent?.name, 'cxGrid1');
    assert.match(viewOut.pas, /Data\.DB/);

    assert.match(err(addEdits(pas, dfm, { className: 'TcxGridDBColumn', parentName: 'cxButton1', left: 0, top: 0 })), /goes inside a grid view/);
    assert.match(err(addEdits(pas, dfm, { className: 'TcxGridLevel', left: 0, top: 0 })), /goes inside a TcxGrid/, 'not on the form itself');
    const btn = withEdits(ok(addEdits(pas, dfm, { className: 'TcxButton', parentName: 'cxGrid1', left: 5, top: 5 })) as never);
    assert.equal(findNode(parseDfmTree(btn.dfm)!, 'cxButton2')!.parent?.name, 'GridForm', 'an ordinary control dropped on a grid lands next to it');

    const base = { side: 'auto' as const };
    assert.match(err(planAddComponent(pas, dfm, { ...base, className: 'TcxButton', name: 'cxButton9', parentName: 'cxGrid1' })), /only holds levels, views and columns/);
    assert.match(err(planAddComponent(pas, dfm, { ...base, className: 'TcxGridDBColumn', name: 'c9', parentName: 'cxGrid1' })), /goes inside a grid view/);
});

test('parts of a grid never leave it, and nothing else enters it', () => {
    assert.match(err(reparentEdits(dfm, ['cxGrid1DBTableView1NOM'], 'GridForm', [{ left: 0, top: 0 }])), /part of its grid/);
    assert.match(err(reparentEdits(dfm, ['cxGrid1Level1'], 'GridForm', [{ left: 0, top: 0 }])), /part of its grid/);
    assert.match(err(reparentEdits(dfm, ['cxButton1'], 'cxGrid1', [{ left: 0, top: 0 }])), /cannot contain/);
    assert.match(err(reparentEdits(dfm, ['cxButton1'], 'cxGrid1DBTableView1', [{ left: 0, top: 0 }])), /cannot contain/);
});

test('deleting a view takes its columns, and the level that showed it is unlinked', () => {
    assert.deepEqual(danglingRefs(parseDfmTree(dfm)!, ['cxGrid1DBTableView1']).map(d => [d.node.name, d.props]), [['cxGrid1Level1', ['GridView']]]);
    assert.deepEqual(danglingRefs(parseDfmTree(dfm)!, ['cxGrid1DBTableView1', 'cxGrid1Level1']), [], 'a level deleted too is not touched');
    const out = withEdits(ok(deleteEdits(pas, dfm, ['cxGrid1DBTableView1'], 'TGridForm')) as never);
    assert.doesNotMatch(out.dfm, /DBTableView1ID|cxGrid1DBTableView1:/);
    assert.doesNotMatch(out.pas, /cxGrid1DBTableView1ID|cxGrid1DBTableView1: /);
    const level = findNode(parseDfmTree(out.dfm)!, 'cxGrid1Level1')!;
    assert.equal(level.props['GridView'], undefined, 'the level would not load otherwise');
    assert.ok(findNode(parseDfmTree(out.dfm)!, 'cxGrid1DBTableView2'), 'the other view stays');
    assert.equal(verifyEdit(dfm, out.dfm, { removed: ['cxGrid1DBTableView1', 'cxGrid1DBTableView1ID', 'cxGrid1DBTableView1NOM', 'cxGrid1DBTableView1VILLE', 'cxGrid1DBTableView1NOTES'], touched: ['cxGrid1Level1'], props: ['GridView'] }), undefined);
    const col = withEdits(ok(deleteEdits(pas, dfm, ['cxGrid1DBTableView1VILLE'], 'TGridForm')) as never);
    assert.doesNotMatch(col.dfm, /VILLE/);
    assert.equal(findNode(parseDfmTree(col.dfm)!, 'cxGrid1Level1')!.props['GridView'], 'cxGrid1DBTableView1', 'a column does not unlink the level');
});

test('renaming a view follows the level that points to it', () => {
    const out = withEdits(ok(renameEdits(pas, dfm, 'cxGrid1DBTableView1', 'cxGrid1Clients')) as never);
    assert.equal(findNode(parseDfmTree(out.dfm)!, 'cxGrid1Level1')!.props['GridView'], 'cxGrid1Clients');
});

test('events of views and columns use the signatures of the grid, and the fixture is a consistent form', () => {
    assert.deepEqual(checkForm(pas, dfm).filter(i => i.severity !== 'info'), []);
    const click = ok(planAddEvent(pas, dfm, { componentName: 'cxGrid1DBTableView1', eventName: 'OnCellClick' }));
    const out = applyTextEdits(pas, click.pasEdits);
    assert.match(out, /procedure cxGrid1DBTableView1CellClick\(Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean\);/);
    assert.match(applyTextEdits(dfm, [click.dfmEdit!]), /OnCellClick = cxGrid1DBTableView1CellClick/);
    const sel = ok(planAddEvent(pas, dfm, { componentName: 'cxGrid1DBTableView1', eventName: 'OnSelectionChanged' }));
    assert.match(applyTextEdits(pas, sel.pasEdits), /procedure cxGrid1DBTableView1SelectionChanged\(Sender: TcxCustomGridTableView\);/);
    const text = ok(planAddEvent(pas, dfm, { componentName: 'cxGrid1DBTableView1VILLE', eventName: 'OnGetDisplayText' }));
    assert.match(applyTextEdits(pas, text.pasEdits), /procedure cxGrid1DBTableView1VILLEGetDisplayText\(Sender: TcxCustomGridTableItem; ARecord: TcxCustomGridRecord; var AText: string\);/);
    assert.equal(ok(planAddEvent(pas, dfm, { componentName: 'cxGrid1DBTableView1NOM', eventName: 'OnGetDisplayText' })).alreadyWired, true);
    assert.deepEqual(find(model.root, 'cxGrid1DBTableView1')!.eventNames.slice(0, 3), ['OnCellClick', 'OnCellDblClick', 'OnFocusedRecordChanged']);
    assert.deepEqual(find(model.root, 'cxGrid1Level1')!.eventNames, [], 'a level has no event');
});
