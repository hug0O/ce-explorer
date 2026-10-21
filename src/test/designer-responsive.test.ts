import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDesignModel } from '../services/DesignerModel';
import { resizeForm } from '../services/DesignerResponsive';
import { designerHtml } from '../webview/designerHtml';

const dfm = [
    'object Form1: TForm1',
    '  ClientWidth = 400',
    '  ClientHeight = 300',
    '  object Top: TPanel',
    '    Left = 0', '    Top = 0', '    Width = 400', '    Height = 40', '    Align = alTop',
    '  end',
    '  object Grid: TPanel',
    '    Left = 0', '    Top = 40', '    Width = 400', '    Height = 220', '    Align = alClient',
    '  end',
    '  object Ok: TButton',
    '    Left = 300', '    Top = 270', '    Width = 80', '    Height = 25', '    Anchors = [akRight, akBottom]',
    '  end',
    '  object Wide: TEdit',
    '    Left = 10', '    Top = 270', '    Width = 200', '    Height = 21', '    Anchors = [akLeft, akTop, akRight]',
    '  end',
    '  object Fixed: TButton',
    '    Left = 350', '    Top = 100', '    Width = 40', '    Height = 20',
    '  end',
    '  object Pin: TButton',
    '    Left = 250', '    Top = 268', '    Width = 40', '    Height = 25',
    '  end',
    'end', '',
].join('\n');

test('Align and Anchors decide what a bigger or smaller form does to each component', () => {
    const model = buildDesignModel(dfm)!;
    const big = resizeForm(model, model.width + 200, model.height + 100);
    assert.equal(big.rects.Top.w, 600, 'alTop follows the width');
    assert.equal(big.rects.Grid.w, 600); assert.equal(big.rects.Grid.h, 360, 'alClient follows both');
    assert.deepEqual([big.rects.Ok.x, big.rects.Ok.y, big.rects.Ok.w], [500, 370, 80], 'akRight, akBottom: moves');
    assert.equal(big.rects.Wide.w, 400, 'left and right: stretches');
    assert.deepEqual([big.rects.Fixed.x, big.rects.Fixed.y], [350, 100], 'no anchor on the right: stays');
    assert.ok(!big.issues.some(i => i.kind === 'outside'), 'a bigger form pushes nothing out');
});

test('only the problems the new size brings are reported', () => {
    const model = buildDesignModel(dfm)!;
    const small = resizeForm(model, model.width - 100, model.height);
    const bad = small.issues.map(i => `${i.kind}:${i.name}${i.other ? '/' + i.other : ''}`);
    assert.ok(bad.includes('overlap:Pin/Ok') || bad.includes('overlap:Ok/Pin'), bad.join());
    assert.ok(bad.includes('outside:Fixed'), bad.join());
    assert.ok(!bad.some(b => b.includes('Top')), 'docked panels never leave the form');
    const same = resizeForm(model, model.width, model.height);
    assert.deepEqual(same.issues, [], 'at the original size nothing is new');
});

test('the page offers the sizes and the layouts', () => {
    const html = designerHtml('N');
    assert.match(html, /Test other form sizes/);
    assert.match(html, /testSizeResult/);
    assert.match(html, /Layouts \(kept for every form\)/);
    assert.match(html, /layoutsRedraw\(\); \}/);
});
