import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDfmTree } from '../services/DelphiLayout';
import { externalSheet, resolveColors, sheetColorsOf, sheetReferences } from '../services/DelphiColors';
import { DNode, buildDesignModel } from '../services/DesignerModel';
import { designerHtml } from '../webview/designerHtml';

const flat = (n: DNode): DNode[] => [n, ...n.children.flatMap(flat)];

const STYLES = [
    'object dmd: TDataModule',
    '  object cxStyleRepository1: TcxStyleRepository',
    '    object cxStyleContent: TcxStyle', '      AssignedValues = [svColor, svTextColor]', '      Color = 15724527', '      TextColor = clNavy', '    end',
    '    object cxStyleHeader: TcxStyle', '      AssignedValues = [svColor]', '      Color = clSkyBlue', '    end',
    '    object cxGridTableViewStyleSheetGeneral: TcxGridTableViewStyleSheet', '      Styles.Content = cxStyleContent', '      Styles.Header = cxStyleHeader', '      BuiltIn = True', '    end',
    '  end',
    'end',
].join('\n');

const FORM = (sheet: string, extra: string[] = []): string => [
    'object F: TF', '  ClientWidth = 600', '  ClientHeight = 300',
    ...extra,
    '  object grd: TcxGrid', '    Left = 0', '    Top = 0', '    Width = 500', '    Height = 200',
    '    object tv: TcxGridDBTableView', `      Styles.StyleSheet = ${sheet}`,
    '      object tvA: TcxGridDBColumn', '        DataBinding.FieldName = \'A\'', '      end',
    '      object tvB: TcxGridDBColumn', '        Visible = False', '        DataBinding.FieldName = \'B\'', '        Styles.Content = stOwn', '      end',
    '    end',
    '    object lvl: TcxGridLevel', '      GridView = tv', '    end',
    '  end',
    'end',
].join('\n');

test('the style sheet of a grid view, from a data module of styles', () => {
    const module = parseDfmTree(STYLES)!;
    assert.deepEqual(externalSheet(module, 'cxGridTableViewStyleSheetGeneral'), {
        content: { color: '#efefef', text: '#000080' }, header: { color: '#a6caf0', text: undefined },
    });
    assert.equal(externalSheet(module, 'nope'), undefined);
    const sheets = new Map([['dmd.cxgridtableviewstylesheetgeneral', externalSheet(module, 'cxGridTableViewStyleSheetGeneral')!]]);
    const model = buildDesignModel(FORM('dmd.cxGridTableViewStyleSheetGeneral'), sheets)!;
    const by = (n: string): DNode => flat(model.root).find(x => x.name === n)!;
    assert.equal(by('tvA').color, '#efefef', 'the column draws its cells with the content style of the sheet');
    assert.equal(by('tvA').fontColor, '#000080');
    assert.equal(by('tvA').headerColor, '#a6caf0', 'and its header with the header style');
    assert.equal(by('tvA').colorFrom, 'Styles.StyleSheet = dmd.cxGridTableViewStyleSheetGeneral');
    // without the module (not found) nothing is invented
    const without = buildDesignModel(FORM('dmd.cxGridTableViewStyleSheetGeneral'))!;
    assert.equal(flat(without.root).find(x => x.name === 'tvA')!.color, undefined);
});

test('the style sheet of the same form, and the column that has a style of its own', () => {
    const extra = [
        '  object cxStyleRepository1: TcxStyleRepository',
        '    object stContent: TcxStyle', '      AssignedValues = [svColor]', '      Color = clYellow', '    end',
        '    object stOwn: TcxStyle', '      AssignedValues = [svColor]', '      Color = clRed', '    end',
        '    object sheet: TcxGridTableViewStyleSheet', '      Styles.Content = stContent', '    end',
        '  end',
    ];
    const model = buildDesignModel(FORM('sheet', extra))!;
    const by = (n: string): DNode => flat(model.root).find(x => x.name === n)!;
    assert.equal(by('tvA').color, '#ffff00');
    assert.equal(by('tvB').color, '#ff0000', 'Styles.Content of the column wins over the sheet');
    assert.equal(by('tvB').colorFrom, 'Styles.Content = stOwn');
    const root = parseDfmTree(FORM('sheet', extra))!;
    const sheet = root.children.find(c => c.name === 'cxStyleRepository1')!.children.find(c => c.name === 'sheet')!;
    assert.deepEqual(sheetColorsOf(sheet, root).content, { color: '#ffff00', text: undefined });
    assert.equal(resolveColors(root.children.find(c => c.name === 'grd')!).color, undefined, 'the grid itself is not painted');
});

test('the modules a form needs style sheets from', () => {
    const refs = sheetReferences(FORM('dmd.cxGridTableViewStyleSheetGeneral') + '\n      Styles.StyleSheet = dmd.cxGridTableViewStyleSheetGeneral\n      Styles.StyleSheet = dmd.Other\n      Styles.StyleSheet = localSheet');
    assert.deepEqual(refs, [{ module: 'dmd', sheet: 'cxGridTableViewStyleSheetGeneral' }, { module: 'dmd', sheet: 'Other' }]);
});

test('TMS smooth label: its fill, its gradient, its caption and its font', () => {
    const dfm = [
        'object F: TF', '  ClientWidth = 400', '  ClientHeight = 200',
        '  object lbl: TAdvSmoothLabel', '    Left = 1', '    Top = 78', '    Width = 300', '    Height = 20',
        '    Fill.Color = 12615680', '    Fill.ColorTo = clWhite', '    Fill.GradientType = gtRadial', '    Fill.BorderColor = clNone', '    Fill.Rounding = 6',
        '    Caption.Text = \'  Tableau de bord\'', '    Caption.Font.Color = clWindowText', '    Caption.Font.Height = -15', '    Caption.Font.Style = [fsBold]',
        '    Transparent = False', '  end',
        '  object lblSolid: TAdvSmoothLabel', '    Left = 1', '    Top = 110', '    Width = 100', '    Height = 20', '    Fill.Color = clRed', '    Fill.GradientType = gtSolid', '    Fill.ColorTo = clWhite', '  end',
        'end',
    ].join('\n');
    const model = buildDesignModel(dfm)!;
    const l = flat(model.root).find(x => x.name === 'lbl')!;
    assert.deepEqual([l.color, l.colorTo, l.gradient, l.rounding, l.borderColor], ['#0080c0', '#ffffff', 'radial', 6, undefined]);
    assert.equal(l.caption, '  Tableau de bord');
    assert.equal(l.fontColor, '#000000');
    assert.equal(l.bold, true);
    assert.equal(l.fontSize, 12, 'Caption.Font.Height -15 is read like Font.Height');
    const solid = flat(model.root).find(x => x.name === 'lblSolid')!;
    assert.deepEqual([solid.color, solid.colorTo, solid.gradient], ['#ff0000', undefined, undefined], 'a solid fill has no gradient');
});

test('the page paints the fills, greys out hidden components in the list, and paints a label that is not transparent', () => {
    const html = designerHtml('N');
    assert.match(html, /function paintFill\(chrome, n\)/);
    assert.match(html, /radial-gradient\(circle at center/);
    assert.match(html, /\(n\.props\['Visible'\] === 'False' \? ' hiddenrow' : ''\)/);
    assert.match(html, /\.outline div\.hiddenrow \{ opacity: 0\.45; \}/);
    assert.match(html, /k === 'label' && n\.props\['Transparent'\] === 'False'/);
    assert.match(html, /gh\.style\.background = n\.headerColor/);
});
