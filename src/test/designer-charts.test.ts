import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyTextEdits } from '../services/DelphiForm';
import { findNode, parseDfmTree } from '../services/DelphiLayout';
import { isChart, isChartChild, isChartTool, isSeries, seriesKind } from '../services/DelphiCharts';
import { DNode, addEdits, buildDesignModel, reparentEdits, setChartTitleEdits, setPropertyEdits } from '../services/DesignerModel';
import { designerHtml, PALETTE } from '../webview/designerHtml';

export const CHART_DFM = [
    'object ChartForm: TChartForm', '  Left = 0', '  Top = 0', "  Caption = 'Charts'", '  ClientHeight = 300', '  ClientWidth = 520',
    '  object Panel1: TPanel', '    Left = 8', '    Top = 8', '    Width = 100', '    Height = 40', '    TabOrder = 0', '  end',
    '  object Chart1: TChart', '    Left = 16', '    Top = 56', '    Width = 480', '    Height = 230',
    '    Title.Text.Strings = (', "      'Sales by month')", '    View3D = False', '    TabOrder = 1',
    '    object Series1: TBarSeries', "      Title = 'Paris'", '      SeriesColor = clRed', "      XValues.Name = 'X'", '      XValues.Order = loAscending', "      YValues.Name = 'Bar'", '      YValues.Order = loNone', '    end',
    '    object Series2: TLineSeries', "      Title = 'Lyon'", '      Active = False', "      XValues.Name = 'X'", '      XValues.Order = loAscending', "      YValues.Name = 'Y'", '      YValues.Order = loNone', '    end',
    '    object ChartTool1: TDragMarksTool', '    end',
    '  end',
    'end', '',
].join('\n');
const PAS = [
    'unit ChartUnit;', '', 'interface', '', 'uses Forms, ExtCtrls, Chart, TeEngine, Series, TeeProcs;', '', 'type', '  TChartForm = class(TForm)', '    Panel1: TPanel;', '    Chart1: TChart;', '    Series1: TBarSeries;', '    Series2: TLineSeries;', '    ChartTool1: TDragMarksTool;', '  end;', '', 'var', '  ChartForm: TChartForm;', '', 'implementation', '', '{$R *.dfm}', '', 'end.', '',
].join('\n');

const find = (n: DNode, name: string): DNode | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));
const ok = <T extends object>(r: T | { error: string }): T => { assert.ok(!('error' in r), 'error' in r ? (r as { error: string }).error : ''); return r as T; };
const err = (r: object): string => (r as { error: string }).error;

test('which classes are charts, series and tools', () => {
    for (const c of ['TChart', 'TDBChart']) { assert.ok(isChart(c), c); }
    for (const c of ['TBarSeries', 'TLineSeries', 'TPieSeries', 'THorizBarSeries', 'TAreaSeries', 'TFastLineSeries']) { assert.ok(isSeries(c) && isChartChild(c), c); }
    for (const c of ['TDragMarksTool', 'TAnnotationTool', 'TCursorTool']) { assert.ok(isChartTool(c) && isChartChild(c), c); }
    for (const c of ['TcxGridChartSeries', 'TdxTileControl', 'TButton', 'TSomeTool']) { assert.ok(!isChartChild(c), c); }
    assert.deepEqual(['TBarSeries', 'THorizBarSeries', 'TLineSeries', 'TAreaSeries', 'TPointSeries', 'TPieSeries'].map(seriesKind), ['bar', 'hbar', 'line', 'area', 'point', 'pie']);
});

test('a chart carries its title, its series and its tools; they are parts of it', () => {
    const m = buildDesignModel(CHART_DFM)!;
    const chart = find(m.root, 'Chart1')!;
    assert.equal(chart.chart!.title, 'Sales by month');
    assert.deepEqual(chart.chart!.series.map(s => [s.name, s.kind, s.title, s.color, s.visible]), [['Series1', 'bar', 'Paris', '#ff0000', true], ['Series2', 'line', 'Lyon', undefined, false]]);
    assert.deepEqual(chart.chart!.tools, ['ChartTool1']);
    assert.equal(chart.chart!.view3D, false);
    assert.equal(chart.chart!.legend, true);
    assert.equal(chart.container, false, 'nothing is dropped into a chart');
    for (const n of ['Series1', 'Series2', 'ChartTool1']) { const c = find(m.root, n)!; assert.ok(c.fixed && c.structural, n); }
    assert.match(err(reparentEdits(CHART_DFM, ['Series1'], 'Panel1', [{ left: 1, top: 1 }])), /Series1/);
});

test('the title, the legend, the 3D view and a series are edited the way the IDE writes them', () => {
    const t = parseDfmTree(applyTextEdits(CHART_DFM, ok(setChartTitleEdits(CHART_DFM, 'Chart1', ['Turnover'])).dfmEdits))!;
    assert.equal(findNode(t, 'Chart1')!.props['Title.Text.Strings'], '(');
    assert.match(applyTextEdits(CHART_DFM, ok(setChartTitleEdits(CHART_DFM, 'Chart1', ['Turnover'])).dfmEdits), /Title\.Text\.Strings = \(\n {6}'Turnover'\)\n {4}View3D/);
    assert.match(err(setChartTitleEdits(CHART_DFM, 'Panel1', ['x'])), /not a chart/);
    const set = (name: string, prop: string, value: unknown) => parseDfmTree(applyTextEdits(CHART_DFM, ok(setPropertyEdits(CHART_DFM, name, prop, value)).dfmEdits))!;
    assert.equal(findNode(set('Chart1', 'View3D', true), 'Chart1')!.props['View3D'], 'True');
    assert.equal(findNode(set('Chart1', 'Legend.Visible', false), 'Chart1')!.props['Legend.Visible'], 'False');
    assert.equal(findNode(set('Series1', 'Title', 'Nice'), 'Series1')!.props['Title'], "'Nice'");
    assert.equal(findNode(set('Series1', 'SeriesColor', '#0000ff'), 'Series1')!.props['SeriesColor'], 'clBlue');
    assert.equal(findNode(set('Series2', 'Active', true), 'Series2')!.props['Active'], 'True');
    assert.match(err(setPropertyEdits(CHART_DFM, 'Panel1', 'View3D', true)), /no View3D/);
});

test('series and tools are added to a chart, with their unit, and to nothing else', () => {
    const add = (className: string, parentName: string) => ok(addEdits(PAS, CHART_DFM, { className, parentName, left: 0, top: 0 }));
    const s = add('TAreaSeries', 'Chart1');
    const dfm = applyTextEdits(CHART_DFM, s.dfmEdits);
    assert.equal(findNode(parseDfmTree(dfm)!, s.name!)!.parent!.name, 'Chart1');
    assert.match(dfm, /object Series3: TAreaSeries[\s\S]*YValues\.Name = 'Y'/);
    assert.match(applyTextEdits(PAS, s.pasEdits), /Series3: TAreaSeries;/);
    assert.equal(findNode(parseDfmTree(applyTextEdits(CHART_DFM, add('TCursorTool', 'Chart1').dfmEdits))!, 'ChartTool2')!.parent!.name, 'Chart1');
    assert.match(err(addEdits(PAS, CHART_DFM, { className: 'TBarSeries', parentName: 'Panel1', left: 0, top: 0 })), /chart/i);
    const chart = ok(addEdits(PAS, CHART_DFM, { className: 'TChart', parentName: undefined, left: 10, top: 10 }));
    assert.match(applyTextEdits(CHART_DFM, chart.dfmEdits), /object Chart2: TChart[\s\S]*Title\.Text\.Strings = \(\n {6}'TChart'\)/);
});

test('the palette has a TeeChart group, and the page draws charts and edits them', () => {
    const by = (c: string) => PALETTE.find(p => p.cls === c);
    assert.equal(by('TChart')?.group, 'TeeChart');
    assert.equal(by('TBarSeries')?.host, 'chart');
    assert.equal(by('TDragMarksTool')?.host, 'chart');
    const html = designerHtml('N');
    assert.match(html, /function chartContent/);
    assert.match(html, /function chartFields/);
    assert.match(html, /function seriesFields/);
});
