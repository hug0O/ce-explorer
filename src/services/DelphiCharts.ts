/**
 * TeeChart charts (`TChart`, `TDBChart`, `TChartBook`): the series (`TBarSeries`, `TLineSeries`…) and the tools
 * (`TDragMarksTool`…) are objects nested in the chart, placed by it, with no Left / Top. The chart is drawn as a plot
 * with sample values for each series, in the colour of the series, so a form with charts no longer shows a blank box.
 * Pure: nothing here writes a .dfm.
 */

export const isChart = (cls: string): boolean => /^T(DB)?Chart$/i.test(cls);
export const isChartBook = (cls: string): boolean => /^TChartBook$/i.test(cls);
export const isSeries = (cls: string): boolean => /^T[A-Za-z0-9]*Series$/i.test(cls) && !/^T(cx|dx|DataSeries)/i.test(cls);
const TOOLS = 'DragMarks|Annotation|Cursor|MarksTip|Rotate|DragPoint|Nearest|ColorBand|GridBand|AxisArrow|Image|SeriesAnimation|ColorLine';
export const isChartTool = (cls: string): boolean => new RegExp(`^T(${TOOLS})Tool$`, 'i').test(cls);
/** A series or a tool: placed by its chart, never moved to another parent. */
export const isChartChild = (cls: string): boolean => isSeries(cls) || isChartTool(cls);

export type SeriesKind = 'bar' | 'hbar' | 'line' | 'area' | 'point' | 'pie';

export function seriesKind(cls: string): SeriesKind {
    if (/Pie|Donut/i.test(cls)) { return 'pie'; }
    if (/HorizBar|HorizArea|HorizLine/i.test(cls)) { return 'hbar'; }
    if (/Bar|Histogram|Gantt|Waterfall|Volume|Candle|Tower/i.test(cls)) { return 'bar'; }
    if (/Area/i.test(cls)) { return 'area'; }
    if (/Point|Bubble|Shape|Arrow/i.test(cls)) { return 'point'; }
    return 'line';
}

export interface ChartSeries { name: string; cls: string; kind: SeriesKind; title: string; color?: string; visible: boolean }
export interface ChartInfo { title: string; view3D: boolean; legend: boolean; series: ChartSeries[]; tools: string[] }
