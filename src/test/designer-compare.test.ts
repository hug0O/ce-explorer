import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffDfm } from '../services/DfmDiff';
import { buildDesignModel } from '../services/DesignerModel';
import { compareItems, ghostsOf, absoluteRect } from '../services/DesignerCompare';
import { designerHtml } from '../webview/designerHtml';

const before = [
    'object Form1: TForm1',
    '  Left = 0',
    '  Top = 0',
    '  Width = 400',
    '  Height = 300',
    '  object Panel1: TPanel',
    '    Left = 10',
    '    Top = 20',
    '    Width = 200',
    '    Height = 100',
    '    object Edit1: TEdit',
    '      Left = 5',
    '      Top = 6',
    '      Width = 80',
    '      Height = 21',
    '    end',
    '  end',
    '  object Button1: TButton',
    '    Left = 10',
    '    Top = 150',
    '    Width = 75',
    '    Height = 25',
    '    Caption = \'Old\'',
    '  end',
    '  object Button2: TButton',
    '    Left = 100',
    '    Top = 150',
    '    Width = 75',
    '    Height = 25',
    '  end',
    'end',
    '',
].join('\n');

const after = before
    .replace("Caption = 'Old'", "Caption = 'New'")
    .replace('Left = 100', 'Left = 120')
    .replace(/  object Button2: TButton[\s\S]*?\n  end\n/, m => m)
    .replace('end\n', 'end\n');

test('compare lists what changed, and whether it was only a move', () => {
    const items = compareItems(diffDfm(before, after));
    const b1 = items.find(i => i.name === 'Button1')!;
    assert.ok(b1.details.some(d => d.includes("'Old'") && d.includes("'New'")));
    assert.equal(b1.layoutOnly, false);
    const b2 = items.find(i => i.name === 'Button2')!;
    assert.equal(b2.layoutOnly, true, 'only Left changed');
});

test('a removed component is drawn where it was, in form coordinates', () => {
    const gone = before.replace(/  object Button2: TButton[\s\S]*?\n  end\n/, '');
    const diff = diffDfm(before, gone);
    const items = compareItems(diff);
    assert.ok(items.some(i => i.name === 'Button2' && i.kinds.includes('removed')));
    const model = buildDesignModel(before)!;
    const ghosts = ghostsOf(diff, model);
    assert.deepEqual(ghosts.map(g => [g.name, g.x, g.y, g.w, g.h]), [['Button2', 100, 150, 75, 25]]);
    assert.deepEqual(absoluteRect(model.root, 'Edit1'), { x: 15, y: 26, w: 80, h: 21 }, 'the container position is added');
    assert.equal(absoluteRect(model.root, 'Nope'), undefined);
});

test('the page has the compare action, the bar and the ghosts', () => {
    const html = designerHtml('N');
    assert.match(html, /Compare with a git version/);
    assert.match(html, /id = 'cmpbar'/);
    assert.match(html, /\.ghost \{/);
    assert.match(html, /paintCompare\(\); \}/, 'redrawn with the view');
});
