import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits, resolveComponentDef } from '../services/DelphiForm';
import { findNode, listContainers, parseDfmTree, planAddComponent } from '../services/DelphiLayout';
import { planAddEvent } from '../services/DelphiEvents';
import { checkForm } from '../services/DelphiCheck';
import { isTileChild, isTileHost, tileLayout } from '../services/DelphiTiles';
import {
    DNode, addEdits, buildDesignModel, deleteEdits, reparentEdits, setPropertyEdits, verifyEdit,
} from '../services/DesignerModel';
import { PALETTE, designerHtml } from '../webview/designerHtml';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(dir, 'TileForm.dfm'), 'utf8');
const pas = fs.readFileSync(path.join(dir, 'TileForm.pas'), 'utf8');
const model = buildDesignModel(dfm)!;
const find = (n: DNode, name: string): DNode | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));
const rect = (name: string) => { const n = find(model.root, name)!; return [n.x, n.y, n.w, n.h]; };
const ok = <T extends object>(r: T | { error: string }): T => { assert.ok(!('error' in r), 'error' in r ? (r as { error: string }).error : ''); return r as T; };
const err = (r: object): string => (r as { error: string }).error;
const withEdits = (r: { dfmEdits: never[]; pasEdits: never[] }) => ({ dfm: applyTextEdits(dfm, r.dfmEdits), pas: applyTextEdits(pas, r.pasEdits) });

test('TdxTileControl is in the catalog with its tiles, groups and detail page', () => {
    for (const c of ['TdxTileControl', 'TdxTileControlItem', 'TdxTileControlGroup', 'TdxTileControlDetailSite']) {
        const d = resolveComponentDef(c);
        assert.equal(d.className, c);
        assert.ok(d.unit && d.unit.startsWith('dx'), c + ' unit');
    }
    assert.equal(resolveComponentDef('TdxTileControlItem').nested, true, 'a tile has no Left / Top');
    assert.equal(resolveComponentDef('TdxTileControlGroup').nested, true);
    assert.ok(!resolveComponentDef('TdxTileControl').nested);
    assert.deepEqual(resolveComponentDef('TdxTileControlItem').events.map(e => e.name), ['OnClick', 'OnActivateDetail', 'OnDeactivateDetail']);
    assert.ok(isTileHost('TdxTileControl') && isTileChild('TdxTileControlItem') && isTileChild('TdxTileControlGroup') && !isTileChild('TdxTileControl'));
    const entries = PALETTE.filter(p => /TileControl/.test(p.cls));
    assert.deepEqual(entries.map(e => [e.cls, e.group, e.host]), [
        ['TdxTileControl', 'DevExpress', undefined], ['TdxTileControlItem', 'DevExpress', 'tile'], ['TdxTileControlGroup', 'DevExpress', 'tile'], ['TdxTileControlDetailSite', 'DevExpress', 'tile'],
    ]);
});

test('tile layout: groups side by side, tiles flow in columns by size, nothing is free to move', () => {
    const host = find(model.root, 'dxTileControl1')!;
    assert.deepEqual(host.children.map(c => c.name), [
        'dxTileControl1Group1', 'dxTileControl1Group2', 'dxTileControl1Item1', 'dxTileControl1Item2', 'dxTileControl1Item3', 'dxTileControl1Item4', 'dxTileControl1DetailSite1',
    ], 'groups and tiles have no geometry of their own, yet they are in the model');
    assert.equal(host.tileTexts![0], 'Accueil', 'the title of the control');
    assert.equal(host.container, false, 'no control can be dropped into a tile control');
    // a large tile is twice as wide as a regular one, an extra large one twice as high too
    assert.deepEqual(rect('dxTileControl1Item1'), [24, 100, 246, 120]);
    assert.deepEqual(rect('dxTileControl1Item2'), [24, 226, 120, 120], 'IndexInGroup order: next free place below');
    assert.deepEqual(rect('dxTileControl1Item3'), [24, 352, 57, 57], 'a small tile is half a regular one');
    assert.deepEqual(rect('dxTileControl1Item4'), [310, 100, 246, 246], 'the second group starts after the first');
    assert.deepEqual(rect('dxTileControl1Group1'), [24, 72, 246, 22]);
    for (const n of ['dxTileControl1Group1', 'dxTileControl1Item1', 'dxTileControl1Item4']) {
        const d = find(model.root, n)!;
        assert.deepEqual([d.docked, d.nonVisual, d.container], [true, false, false], n + ' is placed by the control');
    }
    const item = find(model.root, 'dxTileControl1Item1')!;
    assert.deepEqual([item.caption, item.tileTexts, item.tileSize, item.color], ['Commandes', ['Commandes', '42 en cours', '', ''], 'tcisLarge', '#3399ff']);
    assert.equal(find(model.root, 'dxTileControl1Item2')!.tileSize, 'tcisRegular', 'default size');
    assert.equal(find(model.root, 'dxTileControl1Group2')!.caption, 'Stock');
});

test('the detail page is an ordinary container holding controls', () => {
    const site = find(model.root, 'dxTileControl1DetailSite1')!;
    assert.deepEqual([site.container, site.visible, site.children.map(c => c.name)], [true, false, ['cxLabel1']]);
});

test('a tile that points to a missing group is still drawn', () => {
    const odd = dfm.replace('GroupIndex = 1', 'GroupIndex = 5');
    const m = buildDesignModel(odd)!;
    const t = find(m.root, 'dxTileControl1Item4')!;
    assert.ok(t.w > 0 && t.h > 0 && t.x >= 24);
    const lay = tileLayout(parseDfmTree(odd)!.children.find(c => c.name === 'dxTileControl1')!);
    assert.equal(lay.items.size, 4);
});

test('inspector edits of a tile: text, size and group; refused on any other class', () => {
    const text = withEdits(ok(setPropertyEdits(dfm, 'dxTileControl1Item2', 'Text1.Value', 'Prénom')) as never);
    assert.match(text.dfm, /Text1\.Value = 'Pr'#233'nom'/, 'written the Delphi way');
    const size = withEdits(ok(setPropertyEdits(dfm, 'dxTileControl1Item2', 'Size', 'tcisExtraLarge')) as never);
    assert.equal(findNode(parseDfmTree(size.dfm)!, 'dxTileControl1Item2')!.props['Size'], 'tcisExtraLarge');
    const group = withEdits(ok(setPropertyEdits(dfm, 'dxTileControl1Item3', 'GroupIndex', 1)) as never);
    assert.equal(findNode(parseDfmTree(group.dfm)!, 'dxTileControl1Item3')!.props['GroupIndex'], '1');
    const cap = withEdits(ok(setPropertyEdits(dfm, 'dxTileControl1Group1', 'Caption.Text', 'Ventes 2026')) as never);
    assert.match(cap.dfm, /Caption\.Text = 'Ventes 2026'/);
    assert.match(err(setPropertyEdits(dfm, 'dxTileControl1Item2', 'Size', 'tcisHuge')), /Unknown Size/);
    assert.match(err(setPropertyEdits(dfm, 'cxButton1', 'Size', 'tcisSmall')), /no Size property/, 'a button is not a tile');
    assert.match(err(setPropertyEdits(dfm, 'dxTileControl1Item2', 'Caption.Text', 'x')), /no Caption\.Text/);
    // and nothing else in the .dfm changed
    assert.equal(verifyEdit(dfm, size.dfm, { touched: ['dxTileControl1Item2'], props: ['Size'] }), undefined);
});

test('adding tiles, groups and detail pages: only inside a tile control, no position written', () => {
    const item = ok(addEdits(pas, dfm, { className: 'TdxTileControlItem', parentName: 'dxTileControl1', left: 40, top: 40 }));
    assert.equal(item.name, 'dxTileControlItem1');
    const out = withEdits(item as never);
    const node = findNode(parseDfmTree(out.dfm)!, 'dxTileControlItem1')!;
    assert.equal(node.parent?.name, 'dxTileControl1');
    assert.deepEqual([node.left, node.top, node.width, node.height], [undefined, undefined, undefined, undefined], 'the control places its tiles');
    assert.equal(node.props['Text1.Value'], '\'dxTileControlItem1\'');
    assert.equal(node.props['GroupIndex'], '1', 'a new tile goes to the last group');
    assert.equal(node.props['TabOrder'], undefined);
    assert.match(out.pas, /dxTileControlItem1: TdxTileControlItem;/);
    assert.equal((out.pas.match(/\bdxCustomTileControl\b/g) ?? []).length, 1, 'its unit was already in uses');
    assert.equal(verifyEdit(dfm, out.dfm, { added: ['dxTileControlItem1'] }), undefined);

    const group = withEdits(ok(addEdits(pas, dfm, { className: 'TdxTileControlGroup', parentName: 'dxTileControl1', left: 0, top: 0 })) as never);
    const g = findNode(parseDfmTree(group.dfm)!, 'dxTileControlGroup1')!;
    assert.deepEqual([g.parent?.name, g.props['Index'], g.props['Caption.Text']], ['dxTileControl1', '2', '\'dxTileControlGroup1\'']);

    // dropped on a tile (or on its group): it still goes into the tile control, not into the tile
    const viaTile = withEdits(ok(addEdits(pas, dfm, { className: 'TdxTileControlItem', parentName: 'dxTileControl1Item2', left: 0, top: 0 })) as never);
    assert.equal(findNode(parseDfmTree(viaTile.dfm)!, 'dxTileControlItem1')!.parent?.name, 'dxTileControl1');

    const site = withEdits(ok(addEdits(pas, dfm, { className: 'TdxTileControlDetailSite', parentName: 'dxTileControl1', left: 16, top: 16 })) as never);
    const s = findNode(parseDfmTree(site.dfm)!, 'dxTileControlDetailSite1')!;
    assert.deepEqual([s.parent?.name, s.left, s.top, s.width, s.height], ['dxTileControl1', 16, 16, 200, 200]);

    assert.match(err(addEdits(pas, dfm, { className: 'TdxTileControlItem', parentName: 'cxButton1', left: 0, top: 0 })), /goes inside a TdxTileControl/);
    assert.match(err(addEdits(pas, dfm, { className: 'TdxTileControlGroup', left: 0, top: 0 })), /goes inside a TdxTileControl/, 'dropped on the form itself');
    // an ordinary control dropped on the tile control lands next to it, never inside
    const btn = withEdits(ok(addEdits(pas, dfm, { className: 'TcxButton', parentName: 'dxTileControl1', left: 5, top: 5 })) as never);
    assert.equal(findNode(parseDfmTree(btn.dfm)!, 'cxButton2')!.parent?.name, 'TileForm');
});

test('tiles cannot leave their tile control, and nothing else can enter it', () => {
    assert.match(err(reparentEdits(dfm, ['dxTileControl1Item1'], 'dxTileControl1DetailSite1', [{ left: 0, top: 0 }])), /cannot move to another container/);
    assert.match(err(reparentEdits(dfm, ['dxTileControl1Group1'], 'TileForm', [{ left: 0, top: 0 }])), /belongs to its tile control/);
    assert.match(err(reparentEdits(dfm, ['cxButton1'], 'dxTileControl1', [{ left: 0, top: 0 }])), /cannot contain/);
    // controls can go into the detail page
    const r = ok(reparentEdits(dfm, ['cxButton1'], 'dxTileControl1DetailSite1', [{ left: 10, top: 10 }]));
    assert.equal(findNode(parseDfmTree(applyTextEdits(dfm, r.dfmEdits))!, 'cxButton1')!.parent?.name, 'dxTileControl1DetailSite1');
});

test('deleting a tile removes its object and its field; a handler holding code stays', () => {
    const out = withEdits(ok(deleteEdits(pas, dfm, ['dxTileControl1Item2'], 'TTileForm')) as never);
    assert.doesNotMatch(out.dfm, /dxTileControl1Item2/);
    assert.doesNotMatch(out.pas, /dxTileControl1Item2/);
    const kept = withEdits(ok(deleteEdits(pas, dfm, ['dxTileControl1Item1'], 'TTileForm')) as never);
    assert.doesNotMatch(kept.dfm, /dxTileControl1Item1:/);
    assert.match(kept.pas, /procedure TTileForm\.dxTileControl1Item1Click/, 'code in a handler is never deleted');
});

test('the fixture is a consistent form', () => {
    assert.deepEqual(checkForm(pas, dfm).filter(i => i.severity !== 'info'), []);
});

test('event handlers use the signature of the component, not just Sender: TObject', () => {
    const tile = ok(planAddEvent(pas, dfm, { componentName: 'dxTileControl1Item2', eventName: 'OnClick' }));
    assert.ok(!tile.alreadyWired);
    const out = applyTextEdits(pas, tile.pasEdits);
    assert.match(out, /procedure dxTileControl1Item2Click\(Sender: TdxTileControlItem\);/);
    assert.match(out, /procedure TTileForm\.dxTileControl1Item2Click\(Sender: TdxTileControlItem\);/);
    assert.match(applyTextEdits(dfm, [tile.dfmEdit!]), /OnClick = dxTileControl1Item2Click/);

    const host = ok(planAddEvent(pas, dfm, { componentName: 'dxTileControl1', eventName: 'OnItemActivateDetail' }));
    assert.match(applyTextEdits(pas, host.pasEdits), /procedure dxTileControl1ItemActivateDetail\(Sender: TdxCustomTileControl; AItem: TdxTileControlItem\);/);

    const key = ok(planAddEvent(pas, dfm, { componentName: 'cxButton1', eventName: 'OnKeyPress' }));
    assert.match(applyTextEdits(pas, key.pasEdits), /\(Sender: TObject; var Key: Char\)/, 'the usual VCL signatures are unchanged');
    const wired = ok(planAddEvent(pas, dfm, { componentName: 'dxTileControl1Item1', eventName: 'OnClick' }));
    assert.equal(wired.alreadyWired, true, 'an event that is already linked is reused, never created twice');
});

test('the inspector lists every event of the class; unknown classes list none (never a guess)', () => {
    assert.deepEqual(find(model.root, 'dxTileControl1Item2')!.eventNames, ['OnClick', 'OnActivateDetail', 'OnDeactivateDetail']);
    assert.deepEqual(find(model.root, 'dxTileControl1Group1')!.eventNames, [], 'a group has no event');
    assert.ok(find(model.root, 'cxButton1')!.eventNames.includes('OnClick'));
    assert.deepEqual(find(model.root, 'dxTileControl1Item1')!.events, { OnClick: 'dxTileControl1Item1Click' });
    const mystery = buildDesignModel('object F: TF\n  object W1: TMysteryWidget\n    Left = 1\n    Top = 2\n    OnFoo = W1Foo\n  end\nend\n')!;
    const w = find(mystery.root, 'W1')!;
    assert.deepEqual(w.eventNames, [], 'no catalog entry: nothing is invented');
    assert.deepEqual(w.events, { OnFoo: 'W1Foo' }, 'but the events already wired are known');
});

test('webview: tiles are drawn, edited and placed through the palette; events are a clickable list', () => {
    const html = designerHtml('N');
    // palette
    assert.match(html, /function fillPalGroups/);
    assert.match(html, /state\.palHost\[state\.tool\]/, 'tiles and groups are placed inside a tile control');
    assert.match(html, /function selectedHost/);
    assert.match(html, /HOST_LABEL = \{ tile: 'a TdxTileControl'/);
    // drawing + inspector
    for (const k of ["'tilecontrol'", "'tile'", "'tilegroup'"]) { assert.ok(html.includes(k), k); }
    assert.match(html, /\.k-tile > \.chrome/);
    assert.match(html, /function tileFields/);
    for (const p of ["'Text1.Value'", "'Size'", "'GroupIndex'", "'Caption.Text'"]) { assert.ok(html.includes(p), p); }
    assert.match(html, /if \(names\.some\(isFixed\)\) \{ return; \}/, 'tiles are never dragged');
    // events
    assert.match(html, /function eventsList/);
    assert.match(html, /type: 'addEvent', name: n\.name, event: v\.slice\(4\), open: state\.openAfter/, 'picking a free event in the drop-down creates its handler');
    assert.match(html, /type: 'open', name: n\.name, event: v\.slice\(5\)/, 'a wired event opens its handler');
    assert.match(html, /Other event…/, 'any other event can be typed');
    assert.match(html, /function previewHandler/);
});

test('the Add Component command follows the same rules: tiles into a tile control, nothing else', () => {
    const base = { side: 'auto' as const };
    assert.match(err(planAddComponent(pas, dfm, { ...base, className: 'TdxTileControlItem', name: 'dxTileControlItem9' })), /goes inside a TdxTileControl/, 'on the form');
    assert.match(err(planAddComponent(pas, dfm, { ...base, className: 'TcxButton', name: 'cxButton9', parentName: 'dxTileControl1' })), /only holds tiles/);
    const plan = planAddComponent(pas, dfm, { ...base, className: 'TdxTileControlItem', name: 'dxTileControlItem9', parentName: 'dxTileControl1', eventName: 'OnClick' });
    assert.ok(!('error' in plan), 'error' in plan ? plan.error : '');
    const out = applyTextEdits(dfm, [(plan as { dfmEdit: never }).dfmEdit]);
    const node = findNode(parseDfmTree(out)!, 'dxTileControlItem9')!;
    assert.deepEqual([node.parent?.name, node.left, node.props['OnClick']], ['dxTileControl1', undefined, 'dxTileControlItem9Click']);
    assert.match(applyTextEdits(pas, (plan as { pasEdits: never[] }).pasEdits), /procedure dxTileControlItem9Click\(Sender: TdxTileControlItem\);/);
    assert.ok(listContainers(parseDfmTree(dfm)!).some(c => c.node.name === 'dxTileControl1'), 'it can be picked as a container');
});
