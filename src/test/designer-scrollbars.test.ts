import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyTextEdits, normalizeEdits, TextEdit } from '../services/DelphiForm';
import { DNode, buildDesignModel, setPropertyEdits } from '../services/DesignerModel';
import { designerHtml } from '../webview/designerHtml';

const apply = (t: string, e: TextEdit[]): string => applyTextEdits(t, (normalizeEdits(e) as { edits: TextEdit[] }).edits);
const flat = (n: DNode): DNode[] => [n, ...n.children.flatMap(flat)];

const GRID = (extra: string[] = []): string => [
    'object F: TF', '  ClientWidth = 600', '  ClientHeight = 300',
    '  object grd: TcxGrid', '    Left = 0', '    Top = 0', '    Width = 500', '    Height = 200',
    '    object tv: TcxGridDBTableView', ...extra, '    end',
    '    object lvl: TcxGridLevel', '      GridView = tv', '    end',
    '  end', 'end',
].join('\n');

test('a grid knows which view it shows and which scroll bars that view asks for', () => {
    const by = (dfm: string): DNode => flat(buildDesignModel(dfm)!.root).find(n => n.name === 'grd')!;
    assert.deepEqual([by(GRID()).scrollView, by(GRID()).scrollBars], ['tv', 'ssBoth']);
    assert.equal(by(GRID(['      OptionsView.ScrollBars = ssVertical'])).scrollBars, 'ssVertical');
    assert.equal(flat(buildDesignModel(GRID())!.root).find(n => n.name === 'tv')!.scrollBars, undefined, 'only the grid carries it');
});

test('the scroll bars of the view are chosen from the inspector, ssBoth being the default', () => {
    const dfm = GRID();
    const set = setPropertyEdits(dfm, 'tv', 'OptionsView.ScrollBars', 'ssHorizontal');
    assert.ok(!('error' in set));
    if ('error' in set) { return; }
    const out = apply(dfm, set.dfmEdits);
    assert.match(out, /object tv: TcxGridDBTableView\r?\n\s+OptionsView\.ScrollBars = ssHorizontal/);
    const back = setPropertyEdits(out, 'tv', 'OptionsView.ScrollBars', 'ssBoth');
    assert.ok(!('error' in back));
    if (!('error' in back)) { assert.ok(!/ScrollBars/.test(apply(out, back.dfmEdits)), 'the default is not written'); }
    assert.ok('error' in setPropertyEdits(dfm, 'tv', 'OptionsView.ScrollBars', 'ssNope'));
    assert.ok('error' in setPropertyEdits(dfm, 'grd', 'OptionsView.ScrollBars', 'ssNone'), 'a view property, not a grid one');
});

test('the page: the scroll bar is a thing to click, shown or not as the view says, highlighted when selected', () => {
    const html = designerHtml('N');
    assert.match(html, /\.dxvs, \.dxhs \{ position: absolute; background: #f0f0f0; pointer-events: auto;/);
    assert.match(html, /\.dxvs\.sbsel, \.dxhs\.sbsel \{/);
    assert.match(html, /t\.closest\('\.dxvs, \.dxhs'\)/);
    assert.match(html, /sbs === 'ssBoth' \|\| sbs === 'ssVertical'/);
    assert.match(html, /sbs === 'ssBoth' \|\| sbs === 'ssHorizontal'/);
    assert.match(html, /labelled\('Scroll bars', sbSel\)/);
});

test('the scroll bar of a grid is above its columns, and dragging it moves the columns', () => {
    const html = designerHtml('N');
    assert.match(html, /\.dxvs, \.dxhs \{[^}]*z-index: 7;/, 'above the columns, so that a click lands on the bar and not on a column');
    assert.match(html, /function gridBars\(e, n\)/);
    assert.match(html, /gridBars\(e, n\); \}\n/, 'built after the columns');
    assert.match(html, /function applyGridScroll\(e, n\)[\s\S]*?translateX\(/, 'the columns are shifted by what the bar says');
    assert.match(html, /function startBarDrag\(ev, gname, axis\)/);
    assert.match(html, /startBarDrag\(ev, name, state\.sbSel\.axis\)/, 'a click on the bar selects it and starts the drag');
    assert.match(html, /gscroll: \{\}/, 'the position of each grid is kept when the form is drawn again');
});
