import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DNode, buildDesignModel } from '../services/DesignerModel';
import { designerHtml } from '../webview/designerHtml';

const DFM = [
    'object F: TF', '  ClientWidth = 400', '  ClientHeight = 300',
    '  object lblWrap: TLabel', '    Left = 8', '    Top = 8', '    Width = 80', '    Height = 40', '    AutoSize = False', '    Caption = \'A long caption that has to wrap\'', '    WordWrap = True', '  end',
    '  object lblPlain: TLabel', '    Left = 8', '    Top = 60', '    Caption = \'x\'', '  end',
    '  object memo1: TMemo', '    Left = 8', '    Top = 100', '    Width = 100', '    Height = 50', '  end',
    '  object memo2: TMemo', '    Left = 120', '    Top = 100', '    Width = 100', '    Height = 50', '    WordWrap = False', '  end',
    '  object cxl: TcxLabel', '    Left = 8', '    Top = 160', '    Width = 80', '    Height = 40', '    Properties.WordWrap = True', '  end',
    '  object chk: TCheckBox', '    Left = 8', '    Top = 210', '    Width = 90', '    Height = 30', '    Caption = \'A check box with a long text\'', '    WordWrap = True', '  end',
    'end',
].join('\n');
const flat = (n: DNode): DNode[] => [n, ...n.children.flatMap(flat)];

test('a text that wraps is told to the page: WordWrap = True, a memo unless WordWrap = False', () => {
    const model = buildDesignModel(DFM)!;
    const by = (n: string): DNode => flat(model.root).find(x => x.name === n)!;
    assert.equal(by('lblWrap').wrap, true);
    assert.equal(by('lblPlain').wrap, undefined);
    assert.equal(by('memo1').wrap, true, 'a memo wraps by default');
    assert.equal(by('memo2').wrap, undefined);
    assert.equal(by('cxl').wrap, true, 'Properties.WordWrap of a DevExpress control');
    assert.equal(by('chk').wrap, true);
});

test('the page wraps those texts inside their width, and keeps the other ones on a line', () => {
    const html = designerHtml('N');
    assert.match(html, /\.ctl\.wrap > \.chrome \{ white-space: pre-wrap; overflow-wrap: anywhere;/);
    assert.match(html, /\(n\.wrap \? ' wrap' : ''\)/);
    assert.match(html, /\.k-label > \.chrome \{ overflow: visible; white-space: nowrap; \}/, 'a label without WordWrap stays on one line');
});

test('components with no visual presence are small and faint until the pointer is on them', () => {
    const html = designerHtml('N');
    assert.match(html, /\.ctl\.nonvisual \{ opacity: 0\.4;/);
    assert.match(html, /\.ctl\.nonvisual:hover \{ opacity: 1;/);
    assert.match(html, /\(n\.nonVisual \? 22 : n\.w\)/);
});
