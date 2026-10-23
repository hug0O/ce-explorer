import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDfmTree } from '../services/DelphiLayout';
import { fieldLinks } from '../services/DelphiFieldLinks';
import { DNode, buildDesignModel } from '../services/DesignerModel';
import { isChartChild, isChartTool } from '../services/DelphiCharts';
import { designerHtml, PALETTE } from '../webview/designerHtml';

const dfm = [
    'object F: TF', '  Left = 0', '  Top = 0', "  Caption = 'F'", '  ClientHeight = 300', '  ClientWidth = 500',
    '  object grid: TcxGrid', '    Left = 8', '    Top = 8', '    Width = 480', '    Height = 200',
    '    object view: TcxGridDBTableView', '      DataController.DataSource = dsMain',
    '      object colName: TcxGridDBColumn', "        DataBinding.FieldName = 'NAME'", '      end',
    '      object colCity: TcxGridDBColumn', "        DataBinding.FieldName = 'city'", '      end',
    '      object colNone: TcxGridDBColumn', "        DataBinding.FieldName = 'ZIP'", '      end',
    '    end',
    '    object lvl: TcxGridLevel', '      GridView = view', '    end',
    '  end',
    '  object qryMain: TUniQuery', '    Left = 100', '    Top = 220',
    '    object qryMainNAME: TStringField', "      DisplayLabel = 'Customer name'", "      FieldName = 'NAME'", '      Size = 40', '    end',
    '    object qryMainCITY: TStringField', "      FieldName = 'CITY'", '      DisplayWidth = 18', '    end',
    '  end',
    '  object dsMain: TDataSource', '    DataSet = qryMain', '    Left = 140', '    Top = 220', '  end',
    'end', '',
].join('\n');
const find = (n: DNode, name: string): DNode | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));

test('a column finds the persistent field of the query behind its view, whatever the case', () => {
    const links = fieldLinks(parseDfmTree(dfm)!, s => s.replace(/^'|'$/g, ''));
    assert.deepEqual(links.columns.get('colName'), { dataset: 'qryMain', fieldName: 'NAME', field: 'qryMainNAME', fieldLabel: 'Customer name', fieldWidth: undefined });
    assert.equal(links.columns.get('colCity')!.field, 'qryMainCITY', 'city and CITY are the same field');
    assert.equal(links.columns.get('colCity')!.fieldWidth, 18);
    assert.equal(links.columns.get('colNone')!.field, undefined, 'a column with no persistent field says so');
    assert.deepEqual(links.users.get('qryMainNAME'), ['colName']);
});

test('the model carries the link on the column and on the field', () => {
    const m = buildDesignModel(dfm)!;
    assert.equal(find(m.root, 'colName')!.colField!.field, 'qryMainNAME');
    assert.equal(find(m.root, 'colNone')!.colField!.dataset, 'qryMain');
    assert.deepEqual(find(m.root, 'qryMainNAME')!.fieldUsers, ['colName']);
    assert.deepEqual(find(m.root, 'qryMainCITY')!.fieldUsers, ['colCity']);
});

test('a data source that is not on the form gives no link', () => {
    const away = dfm.replace('DataController.DataSource = dsMain', 'DataController.DataSource = dmd.dsOther');
    assert.equal(fieldLinks(parseDfmTree(away)!, s => s).columns.size, 0);
});

test('the page links a column to its field and a field to its columns', () => {
    const html = designerHtml('N');
    assert.match(html, /function columnFieldLink/);
    assert.match(html, /prop: 'DisplayLabel', value: v/);
    assert.match(html, /'Shown by \('/);
});

test('more chart tools, the series band tool among them, are known and offered', () => {
    for (const c of ['TSeriesBandTool', 'TColorBandTool', 'TGridBandTool', 'TDragPointTool', 'TNearestTool']) {
        assert.ok(isChartTool(c) && isChartChild(c), c);
        assert.equal(PALETTE.find(p => p.cls === c)?.host, 'chart', c);
    }
    assert.match(designerHtml('N'), /'TSeriesBandTool'/);
});

test('a chart book is drawn with a tab per chart', () => {
    const book = [
        'object F: TF', '  ClientHeight = 300', '  ClientWidth = 500',
        '  object cb: TChartBook', '    Left = 8', '    Top = 8', '    Width = 480', '    Height = 250',
        '    object ch1: TChart', '      Left = 4', '      Top = 24', '      Width = 400', '      Height = 200', '      Title.Text.Strings = (', "        'First')", '    end',
        '  end', 'end', '',
    ].join('\n');
    const m = buildDesignModel(book)!;
    assert.equal(find(m.root, 'ch1')!.chart!.title, 'First');
    assert.match(designerHtml('N'), /k === 'chartbook'/);
});
