/**
 * HTML / CSS / JS of the visual form designer webview. The script never uses
 * template literals or backslashes, so it can live in this template string.
 */

import { snapScript } from './designerSnap';
import { viewButton, viewCss, viewHtml, viewScript } from './designerView';
import { toolsButton, toolsCss, toolsScript } from './designerTools';
import { marksCss, marksScript } from './designerMarks';
import { compareCss, compareScript } from './designerCompare';
import { layoutsCss, layoutsScript } from './designerLayouts';
import type { ComponentDef } from '../services/DelphiForm';
import { DEVEXPRESS, TMS } from '../services/DelphiThirdParty';
import { UNIDAC } from '../services/DelphiUniDac';
import { DATA_COMPONENTS, isDatasetField } from '../services/DelphiData';

export interface PaletteEntry {
    cls: string;
    group: string;
    icon: string;
    /** Goes inside a component of this kind (tiles, groups and detail pages go inside a tile control). */
    host?: 'tile' | 'grid' | 'view' | 'dataset' | 'menu' | 'chart';
}

export const PALETTE: PaletteEntry[] = [
    { cls: 'TButton', group: 'Standard', icon: '🔘' }, { cls: 'TLabel', group: 'Standard', icon: '🅰' }, { cls: 'TEdit', group: 'Standard', icon: '▭' },
    { cls: 'TMemo', group: 'Standard', icon: '📝' }, { cls: 'TCheckBox', group: 'Standard', icon: '☑' }, { cls: 'TRadioButton', group: 'Standard', icon: '◉' },
    { cls: 'TComboBox', group: 'Standard', icon: '▾' }, { cls: 'TListBox', group: 'Standard', icon: '☰' }, { cls: 'TPanel', group: 'Standard', icon: '▢' },
    { cls: 'TGroupBox', group: 'Standard', icon: '⛶' }, { cls: 'TScrollBox', group: 'Standard', icon: '⬚' }, { cls: 'TLabeledEdit', group: 'Standard', icon: '🏷' },
    { cls: 'TBitBtn', group: 'Additional', icon: '🖼' }, { cls: 'TSpeedButton', group: 'Additional', icon: '⏹' }, { cls: 'TMaskEdit', group: 'Additional', icon: '#' },
    { cls: 'TStringGrid', group: 'Additional', icon: '▦' }, { cls: 'TImage', group: 'Additional', icon: '🏞' }, { cls: 'TShape', group: 'Additional', icon: '◆' },
    { cls: 'TBevel', group: 'Additional', icon: '▬' }, { cls: 'TSplitter', group: 'Additional', icon: '┃' }, { cls: 'TCheckListBox', group: 'Additional', icon: '☑' },
    { cls: 'TProgressBar', group: 'Win32', icon: '▰' }, { cls: 'TTrackBar', group: 'Win32', icon: '⎯' }, { cls: 'TDateTimePicker', group: 'Win32', icon: '📅' },
    { cls: 'TRichEdit', group: 'Win32', icon: '📄' }, { cls: 'TTimer', group: 'System', icon: '⏱' },
    { cls: 'TPopupMenu', group: 'System', icon: '☰' }, { cls: 'TMainMenu', group: 'System', icon: '☰' }, { cls: 'TMenuItem', group: 'System', icon: '≡', host: 'menu' },
    { cls: 'TChart', group: 'TeeChart', icon: '📊' }, { cls: 'TDBChart', group: 'TeeChart', icon: '📊' },
    { cls: 'TBarSeries', group: 'TeeChart', icon: '▮', host: 'chart' }, { cls: 'THorizBarSeries', group: 'TeeChart', icon: '▬', host: 'chart' }, { cls: 'TLineSeries', group: 'TeeChart', icon: '📈', host: 'chart' },
    { cls: 'TFastLineSeries', group: 'TeeChart', icon: '📈', host: 'chart' }, { cls: 'TAreaSeries', group: 'TeeChart', icon: '◢', host: 'chart' }, { cls: 'TPointSeries', group: 'TeeChart', icon: '⁘', host: 'chart' },
    { cls: 'TPieSeries', group: 'TeeChart', icon: '◔', host: 'chart' }, { cls: 'TDragMarksTool', group: 'TeeChart', icon: '🛠', host: 'chart' }, { cls: 'TAnnotationTool', group: 'TeeChart', icon: '🛠', host: 'chart' },
    { cls: 'TCursorTool', group: 'TeeChart', icon: '🛠', host: 'chart' }, { cls: 'TMarksTipTool', group: 'TeeChart', icon: '🛠', host: 'chart' }, { cls: 'TRotateTool', group: 'TeeChart', icon: '🛠', host: 'chart' },
    { cls: 'TSeriesBandTool', group: 'TeeChart', icon: '🛠', host: 'chart' }, { cls: 'TColorBandTool', group: 'TeeChart', icon: '🛠', host: 'chart' }, { cls: 'TGridBandTool', group: 'TeeChart', icon: '🛠', host: 'chart' },
    { cls: 'TDragPointTool', group: 'TeeChart', icon: '🛠', host: 'chart' }, { cls: 'TNearestTool', group: 'TeeChart', icon: '🛠', host: 'chart' },
];

const ICONS: [RegExp, string][] = [
    [/Field$/, '▫'],
    [/^TcxGrid(DB)?(Banded)?Column$/, '▮'], [/^TcxGrid\w*View$/, '▦'], [/^TcxGridLevel$/, '🗂'],
    [/TileControlItem$/, '◼'], [/TileControlGroup$/, '▤'], [/TileControl$/, '🟦'], [/DetailSite$/, '▢'],
    [/Button$|Btn$/, '🔘'], [/Label$/, '🅰'], [/(Memo|RichEdit)$/, '📝'], [/CheckBox$|CheckGroup$/, '☑'], [/Radio(Button|Group)$/, '◉'],
    [/(ComboBox)$/, '▾'], [/(List|Check)Box$/, '☰'], [/Panel$/, '▢'], [/(Group|Scroll)Box$/, '⛶'], [/(Pager|PageControl|PC)$/, '🗂'],
    [/Grid$/, '▦'], [/Image$/, '🏞'], [/Progress(Bar)?$/, '▰'], [/TrackBar$/, '⎯'], [/Tree(List|View)$/, '🌳'], [/(Date|Time)(Edit|Picker)$/, '📅'],
    [/Splitter$/, '┃'], [/StatusBar$/, '▁'], [/ToolBar$/, '▤'], [/Edit$|EditBtn$/, '▭'],
];
/** Non-visual components: an icon that says what they are (they are drawn as small icons on the form). */
const NV_ICONS: [RegExp, string][] = [
    [/UniProvider$/, '🧩'], [/Connection$/, '🔌'], [/Transaction$/, '⇄'], [/DataSource$/, '🔗'], [/Script$/, '📜'], [/(Query|Table|StoredProc)$/, '🗃'],
    [/(Popup|Main)Menu$/, '☰'], [/SQL$/, '▤'], [/MetaData$/, 'ℹ'], [/(Loader|Dump)$/, '📦'], [/Alerter$/, '🔔'], [/Dialog$/, '🗔'], [/Encryptor$/, '🔐'],
];
function iconFor(def: ComponentDef): string {
    if (def.width === undefined && def.height === undefined) { return (NV_ICONS.find(([re]) => re.test(def.className)) ?? [/./, '⚙'])[1]; }
    return (ICONS.find(([re]) => re.test(def.className)) ?? [/./, '◻'])[1];
}
/** Parts that go inside another component: tiles into a tile control, levels and views into a grid, columns into a view. */
function hostOf(cls: string): PaletteEntry['host'] {
    if (/TileControl(Item|Group)$|TileControlDetailSite$/.test(cls)) { return 'tile'; }
    if (/^TcxGrid(DB)?(Table)?View$|^TcxGridLevel$/.test(cls)) { return 'grid'; }
    if (/^TcxGrid(DB)?Column$/.test(cls)) { return 'view'; }
    if (isDatasetField(cls)) { return 'dataset'; }
    if (cls === 'TMenuItem') { return 'menu'; }
    if (/^T(?!cx|dx)[A-Za-z0-9]*Series$/.test(cls) || /^T(DragMarks|Annotation|Cursor|MarksTip|Rotate|SeriesBand|ColorBand|GridBand|DragPoint|Nearest)Tool$/.test(cls)) { return 'chart'; }
    return undefined;
}
for (const [group, defs] of [
    ['Data', DATA_COMPONENTS.filter(d => !d.nested)], ['Fields', DATA_COMPONENTS.filter(d => d.nested)], ['UniDAC', UNIDAC], ['DevExpress', DEVEXPRESS], ['TMS', TMS],
] as [string, ComponentDef[]][]) {
    for (const d of defs) {
        if (/(TabSheet|OfficePage)$/.test(d.className) || /Banded/.test(d.className)) { continue; }
        PALETTE.push({ cls: d.className, group, icon: iconFor(d), host: hostOf(d.className) });
    }
}

export function designerHtml(nonce: string): string {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body { font-family: var(--vscode-font-family, sans-serif); font-size: 12px; color: var(--vscode-foreground); background: var(--vscode-editor-background); display: flex; flex-direction: column; overflow: hidden; }
#toolbar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 5px 8px; border-bottom: 1px solid var(--vscode-panel-border, #444); background: var(--vscode-editorGroupHeader-tabsBackground, transparent); }
#toolbar label { display: inline-flex; gap: 3px; align-items: center; color: var(--vscode-descriptionForeground); }
#toolbar .sep { width: 1px; height: 18px; background: var(--vscode-panel-border, #444); margin: 0 2px; }
button, select, input[type=text], input[type=number] { font: inherit; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; padding: 2px 6px; }
.evlist { margin: 2px 0 6px; }
.evrow { display: flex; gap: 5px; align-items: center; padding: 1px 3px; cursor: pointer; font-size: 11px; border-radius: 2px; }
.evrow:hover { background: var(--vscode-list-hoverBackground); }
.evrow .dot { width: 10px; flex: none; color: var(--vscode-descriptionForeground); }
.evrow.wired .dot { color: #e8a800; }
.evrow .evn { flex: none; }
.evrow .evh { margin-left: auto; color: var(--vscode-descriptionForeground); font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.evrow .evgo { flex: none; padding: 0 4px; opacity: 0.6; }
.evrow .evgo:hover { opacity: 1; }
button { cursor: pointer; color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); background: var(--vscode-button-secondaryBackground, rgba(128,128,128,0.2)); }
button:hover:not(:disabled) { background: var(--vscode-button-secondaryHoverBackground, rgba(128,128,128,0.3)); }
button:disabled { opacity: 0.4; cursor: default; }
button.active { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
#main { flex: 1; display: flex; min-height: 0; position: relative; }
#left, #right { width: var(--wl, 210px); overflow-y: auto; padding: 8px; border-right: 1px solid var(--vscode-panel-border, #444); flex: none; }
#right { border-right: none; border-left: 1px solid var(--vscode-panel-border, #444); width: var(--wr, 240px); }
.split { flex: none; width: 5px; margin: 0 -2px; z-index: 20; cursor: col-resize; background: transparent; touch-action: none; }
.split:hover, .split.drag { background: var(--vscode-sash-hoverBorder, #0a84ff); opacity: 0.8; }
body.resizing { cursor: col-resize; user-select: none; }
body.hide-left #splitL, body.hide-right #splitR { display: none; }
#center, #left, #right, #outline { scrollbar-width: auto; scrollbar-color: var(--vscode-scrollbarSlider-background, rgba(121, 121, 121, 0.5)) transparent; }
#center::-webkit-scrollbar, #left::-webkit-scrollbar, #right::-webkit-scrollbar, #outline::-webkit-scrollbar { width: 14px; height: 14px; }
#center::-webkit-scrollbar-track, #left::-webkit-scrollbar-track, #right::-webkit-scrollbar-track, #outline::-webkit-scrollbar-track { background: transparent; }
#center::-webkit-scrollbar-corner { background: transparent; }
#center::-webkit-scrollbar-thumb, #left::-webkit-scrollbar-thumb, #right::-webkit-scrollbar-thumb, #outline::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background, rgba(121, 121, 121, 0.5)); border: 3px solid transparent; background-clip: padding-box; border-radius: 7px; min-height: 30px; min-width: 30px; }
#center::-webkit-scrollbar-thumb:hover, #left::-webkit-scrollbar-thumb:hover, #right::-webkit-scrollbar-thumb:hover, #outline::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground, rgba(150, 150, 150, 0.7)); background-clip: padding-box; }
#center::-webkit-scrollbar-thumb:active { background: var(--vscode-scrollbarSlider-activeBackground, rgba(190, 190, 190, 0.8)); background-clip: padding-box; }
#center.panning, #center.panning * { cursor: grabbing !important; }
#center { flex: 1; overflow: auto; background: var(--vscode-editorWidget-background, #2d2d2d); padding: 20px; }
h4 { margin: 10px 0 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--vscode-descriptionForeground); }
.pal { display: flex; flex-wrap: wrap; gap: 3px; }
.pal button { padding: 2px 5px; font-size: 11px; }
.sec > summary { cursor: pointer; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; margin: 8px 0 4px; }
.pal-head { font-size: 10px; color: var(--vscode-descriptionForeground); margin: 6px 0 2px; }
.pal-group > summary { cursor: pointer; font-size: 10px; color: var(--vscode-descriptionForeground); margin: 4px 0 2px; }
#outline { height: var(--outh, auto); max-height: var(--outh, 42vh); min-height: 60px; overflow: auto; }
.vsplit { height: 5px; margin: 6px -2px 2px; cursor: row-resize; background: transparent; border-top: 1px solid var(--vscode-panel-border, #444); touch-action: none; }
.vsplit:hover, .vsplit.drag { background: var(--vscode-sash-hoverBorder, #0a84ff); opacity: 0.8; }
body.resizing-v { cursor: row-resize; user-select: none; }
.outline .tw { display: inline-block; width: 12px; text-align: center; cursor: pointer; opacity: 0.8; font-size: 10px; }
.outline .tw:hover { opacity: 1; }
.outline div.hiddenrow { opacity: 0.45; }
.outline div.hiddenrow.sel { opacity: 0.8; }
.outline div.cutrow { opacity: 0.5; font-style: italic; }
.ctl.cutmark { opacity: 0.4; outline: 1px dashed #888; }
#dirty { color: #e8a800; margin-left: 3px; }
.outline .ico { display: inline-block; width: 16px; text-align: center; }
.outline .cls { color: var(--vscode-descriptionForeground); margin-left: 4px; font-size: 10px; }
.outline .par { color: var(--vscode-descriptionForeground); margin-left: 4px; font-size: 10px; opacity: 0.7; }
.outline div { padding: 1px 4px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-radius: 2px; font-size: 11px; }
.outline div:hover { background: var(--vscode-list-hoverBackground); }
.outline div.sel { background: var(--vscode-list-activeSelectionBackground, #0a84ff); color: var(--vscode-list-activeSelectionForeground, #fff); font-weight: 600; }
.outline div.sel .cls, .outline div.sel .par { color: inherit; opacity: 0.85; }
.row { display: flex; gap: 4px; align-items: center; margin: 3px 0; }
.row > span { width: 62px; color: var(--vscode-descriptionForeground); flex: none; }
.row input[type=text], .row input[type=number], .row select { flex: 1; min-width: 0; }
.row input[type=checkbox] { margin: 0 4px 0 0; }
.ev { display: flex; gap: 4px; padding: 1px 0; cursor: pointer; font-size: 11px; }
.ev:hover { text-decoration: underline; }
#status { padding: 3px 8px; border-top: 1px solid var(--vscode-panel-border, #444); color: var(--vscode-descriptionForeground); min-height: 20px; }
.hint { color: var(--vscode-descriptionForeground); font-size: 11px; }

/* ── the simulated form: fixed Windows look, whatever the editor theme ── */
#zoomwrap { position: relative; transform-origin: 0 0; display: inline-block; }
#formframe { position: relative; background: #f0f0f0; border: 1px solid #5a5a5a; box-shadow: 0 6px 22px rgba(0,0,0,0.55); font-family: 'Segoe UI', Tahoma, sans-serif; color: #000; font-size: 12px; user-select: none; }
#titlebar { height: 31px; background: #fff; border-bottom: 1px solid #ccc; display: flex; align-items: center; padding: 0 10px; gap: 8px; font-size: 12px; color: #000; }
#titlebar .ctrls { margin-left: auto; letter-spacing: 14px; color: #333; }
#client { position: relative; outline: none; overflow: visible; }
.ctl { position: absolute; font-size: 12px; line-height: 1.25; }
.ctl .chrome { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.ctl.hidden { opacity: 0.4; outline: 1px dashed #888; }
.ctl.disabled > .chrome { color: #6d6d6d; }
.ctl.droptarget::after, #client.droptarget::after { content: ''; position: absolute; inset: 0; outline: 3px dashed #2f9e44; outline-offset: -3px; background: rgba(47, 158, 68, 0.16); pointer-events: none; z-index: 900; }
#droplabel { position: fixed; display: none; z-index: 5000; background: #555; color: #fff; font: 600 11px/16px 'Segoe UI', sans-serif; padding: 1px 8px; border-radius: 4px; pointer-events: none; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); }
#droplabel.go { background: #2f9e44; }
#hov { position: absolute; left: 0; top: 0; width: 0; height: 0; pointer-events: none; z-index: 999; }
.hbox { position: absolute; outline: 1px dotted #ffb000; background: rgba(255, 176, 0, 0.06); }
.htag { position: absolute; background: rgba(60, 60, 60, 0.88); color: #ffd166; font: 10px/12px 'Segoe UI', sans-serif; padding: 0 5px; border-radius: 2px; white-space: nowrap; }
.pbox { position: absolute; outline: 2px dashed #f08c00; outline-offset: 2px; background: rgba(240, 140, 0, 0.06); }
.plabel { position: absolute; background: #f08c00; color: #fff; font: 600 10px/14px 'Segoe UI', sans-serif; padding: 0 6px; border-radius: 3px; white-space: nowrap; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5); }
.cbox { position: absolute; border: 1px dashed; background: rgba(128, 128, 128, 0.04); }
.ctag { position: absolute; color: #fff; font: 9px/11px 'Segoe UI', sans-serif; padding: 0 4px; border-radius: 2px; white-space: nowrap; }
.crumbs { margin: 2px 0 8px; font-size: 11px; line-height: 1.7; }
.crumb { cursor: pointer; color: var(--vscode-textLink-foreground, #3794ff); }
.crumb:hover { text-decoration: underline; }
.crumb.cur { color: var(--vscode-foreground); font-weight: 600; cursor: default; text-decoration: none; }
.outline div.dropok { outline: 2px dashed #2f9e44; outline-offset: -2px; background: rgba(47, 158, 68, 0.2); }
.outline div.rootrow { font-weight: 600; border-bottom: 1px solid var(--vscode-panel-border, #444); margin-bottom: 2px; }
.k-button > .chrome { background: linear-gradient(#f2f2f2, #dcdcdc); border: 1px solid #adadad; border-radius: 3px; display: flex; align-items: center; justify-content: center; text-align: center; padding: 0 4px; }
.k-edit > .chrome, .k-combo > .chrome, .k-datepick > .chrome { background: #fff; border: 1px solid #7a7a7a; padding: 2px 3px; display: flex; align-items: center; }
.k-combo > .chrome::after, .k-datepick > .chrome::after { content: '▾'; margin-left: auto; padding-left: 4px; font-size: 10px; }
.k-memo > .chrome, .k-list > .chrome, .k-listview > .chrome, .k-treeview > .chrome { background: #fff; border: 1px solid #7a7a7a; padding: 2px 3px; white-space: pre; }
.k-label > .chrome { overflow: visible; white-space: nowrap; }
.host-badge { position: absolute; right: 2px; top: 2px; z-index: 6; font-size: 11px; line-height: 1; padding: 1px 3px; border-radius: 3px; background: rgba(0, 120, 215, 0.85); color: #fff; pointer-events: auto; }
.ctl.ml > .chrome { white-space: pre; text-align: center; }
.k-label.ml > .chrome, .k-check.ml > .chrome, .k-radio.ml > .chrome { text-align: left; }
textarea.capbox { width: 100%; min-height: 36px; resize: vertical; font: inherit; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; padding: 2px 6px; }
.ctl.wrap > .chrome { white-space: pre-wrap; overflow-wrap: anywhere; word-break: normal; overflow: hidden; }
.k-check.wrap > .chrome, .k-radio.wrap > .chrome { align-items: flex-start; }
.k-check.wrap .box, .k-radio.wrap .box { margin-top: 1px; }
.k-check > .chrome, .k-radio > .chrome { display: flex; align-items: center; gap: 4px; overflow: visible; white-space: nowrap; }
.k-check .box, .k-radio .box { width: 13px; height: 13px; border: 1px solid #333; background: #fff; flex: none; }
.k-radio .box { border-radius: 50%; }
.k-panel > .chrome { border: 1px solid #fff; border-right-color: #a0a0a0; border-bottom-color: #a0a0a0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; }
.k-panel.nobevel > .chrome { border-color: transparent; }
.k-group > .chrome { border: 1px solid #dcdcdc; border-radius: 3px; top: 7px; }
.k-group > .legend { position: absolute; left: 8px; top: -8px; background: #f0f0f0; padding: 0 3px; white-space: nowrap; }
.k-scroll > .chrome, .k-generic.cont > .chrome { border: 1px solid #a0a0a0; }
.k-generic > .chrome { border: 1px dashed #8a8a8a; background: rgba(255, 215, 0, 0.12); color: #555; padding: 2px 4px; font-size: 11px; }
.k-image > .chrome { border: 1px dotted rgba(0, 0, 0, 0.22); background: transparent; font-size: 11px; line-height: 1; padding: 2px 3px; opacity: 0.5; }
.k-shape > .chrome { border: 1px solid #000; background: #fff; }
.k-bevel > .chrome { border: 1px solid #a0a0a0; border-bottom-color: #fff; border-right-color: #fff; }
.k-splitter > .chrome { background: #e0e0e0; }
.k-grid > .chrome { background: #fff; border: 1px solid #7a7a7a; background-image: linear-gradient(#c8c8c8 1px, transparent 1px), linear-gradient(90deg, #c8c8c8 1px, transparent 1px); background-size: 64px 20px; }
.k-progress > .chrome { border: 1px solid #bcbcbc; background: linear-gradient(90deg, #06b025 35%, #e6e6e6 35%); }
.k-track > .chrome { border-top: 2px solid #aaa; top: 45%; height: 4px; }
.k-chartbook > .chrome { border: 1px solid #b8b8b8; background: #f4f4f4; }
.cbtabs { display: flex; gap: 2px; padding: 2px 2px 0; }
.cbtab { padding: 1px 9px; font-size: 11px; border: 1px solid #b8b8b8; border-bottom: none; background: #e4e4e4; color: #333; }
.cbtab.on { background: #fff; }
.k-chart > .chrome { background: #fff; border: 1px solid #b8b8b8; overflow: hidden; }
.k-chart > .chrome > svg { display: block; font-family: 'Segoe UI', sans-serif; }
.k-dock > .chrome { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 3px 6px; padding: 2px 3px; background: #eceff4; border-bottom: 1px solid #c4cad4; overflow: hidden; }
.dxbar { display: flex; align-items: center; gap: 1px; padding: 1px 4px; background: #f8f9fb; border: 1px solid #cfd5df; border-radius: 3px; font-size: 11px; color: #222; height: 24px; white-space: nowrap; }
.dxbi { padding: 1px 7px; border-radius: 2px; }
.dxbi.button, .dxbi.sub { background: linear-gradient(#fff, #e8ecf3); border: 1px solid #d3d9e4; }
.dxbi.edit, .dxbi.combo { background: #fff; border: 1px solid #b9c1cf; }
.dxbi.static { color: #444; }
.dxbi.dim { color: #889; font-style: italic; }
.dxsep { width: 1px; height: 16px; margin: 0 3px; background: #c4cad4; }
.k-statusbar > .chrome, .k-toolbar > .chrome { background: #f0f0f0; border-top: 1px solid #d0d0d0; padding: 2px 6px; }
.k-radiogroup > .chrome { border: 1px solid #dcdcdc; border-radius: 3px; top: 7px; padding: 12px 8px 4px; overflow: hidden; }
.k-radiogroup > .legend { position: absolute; left: 8px; top: -8px; background: #f0f0f0; padding: 0 3px; white-space: nowrap; }
.rgi { display: flex; gap: 6px; align-items: center; height: 19px; white-space: nowrap; }
.rgi .rb { width: 13px; height: 13px; border: 1px solid #333; border-radius: 50%; background: #fff; flex: none; }
.k-edit.hasbtn > .chrome::after { content: '…'; margin-left: auto; padding: 0 4px; border-left: 1px solid #c8c8c8; background: #ececec; align-self: stretch; display: flex; align-items: center; }
.k-edit.hasspin > .chrome::after { content: '▴▾'; margin-left: auto; font-size: 8px; letter-spacing: -2px; padding: 0 3px; background: #ececec; align-self: stretch; display: flex; align-items: center; }
.k-edit.num > .chrome { justify-content: flex-end; }
.gridhead { position: absolute; left: 0; top: 0; right: 0; background: #ececec; border-bottom: 1px solid #a8a8a8; }
.gridfix { position: absolute; left: 0; top: 0; bottom: 0; background: #ececec; border-right: 1px solid #a8a8a8; }
.dxband { position: absolute; left: 0; top: 0; right: 0; height: 22px; background: linear-gradient(#f4f7fb, #dfe7f1); border-bottom: 1px solid #b9c7da; font-size: 10px; color: #555; padding: 4px 6px; white-space: nowrap; overflow: hidden; }
.fam-dx.k-edit > .chrome, .fam-dx.k-combo > .chrome, .fam-dx.k-datepick > .chrome { border-color: #c6c6c6; border-radius: 2px; }
.fam-dx.k-button > .chrome { background: linear-gradient(#ffffff, #ebebeb); border-color: #bdbdbd; border-radius: 2px; }
.fam-dx.k-group > .chrome, .fam-dx.k-radiogroup > .chrome { border-color: #c6c6c6; }
.fam-tms.k-button > .chrome { background: linear-gradient(#fdfdfd, #dfe6f1); border-color: #9fb0cc; border-radius: 4px; }
.fam-tms.k-panel > .chrome { background: linear-gradient(#f7f9fd, #e3eaf6); border-color: #b4c3dc; }
.fam-tms.k-edit > .chrome, .fam-tms.k-combo > .chrome { border-color: #a9b6cd; }
.fam-tms.k-group > .chrome { border-color: #b4c3dc; background: rgba(228, 235, 246, 0.5); }
.unmgd-badge { position: absolute; left: -1px; top: -1px; font-size: 9px; background: #888; color: #fff; border-radius: 3px; padding: 0 3px; line-height: 11px; pointer-events: none; z-index: 5; }
.ctl.broken > .chrome { color: #b00020; }
.fam-tag { font-size: 9px; padding: 0 3px; border-radius: 3px; margin-left: 4px; color: #fff; }
.fam-tag.dx { background: #1c6fc4; } .fam-tag.tms { background: #c4511c; } .fam-tag.uni { background: #2a8f5f; }
.sqlbox { width: 100%; min-height: 90px; resize: vertical; padding: 4px 6px; font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; line-height: 1.4; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.4)); border-radius: 3px; }
.k-tilecontrol { overflow: hidden; }
.k-tilecontrol > .chrome { background: #2b2d33; border: 1px solid #1c1d21; }
.tilettl { position: absolute; left: 24px; top: 12px; color: #fff; font: 300 24px/30px 'Segoe UI Light', 'Segoe UI', sans-serif; white-space: nowrap; }
.k-tilegroup > .chrome { color: #b9bcc6; font: 12px/22px 'Segoe UI', sans-serif; white-space: nowrap; border-bottom: 1px solid rgba(255, 255, 255, 0.2); }
.k-tile > .chrome { background: #2d89ef; color: #fff; padding: 4px 6px; display: flex; flex-direction: column; justify-content: flex-end; font-size: 11px; line-height: 1.25; }
.k-tile .t1 { font-weight: 600; font-size: 12px; overflow: hidden; text-overflow: ellipsis; }
.k-tile .t1.dim { font-weight: 400; opacity: 0.7; font-size: 10px; }
.k-tile .t2 { opacity: 0.85; font-size: 10px; overflow: hidden; text-overflow: ellipsis; }
.k-tile.sz-tcissmall > .chrome { padding: 2px; }
.k-tile.sz-tcissmall .t1, .k-tile.sz-tcissmall .t2 { font-size: 8px; }
.k-pages > .chrome { overflow: visible; }
.k-pages > .tabs { position: absolute; left: 0; top: 0; right: 0; height: 24px; display: flex; gap: 1px; pointer-events: none; }
.k-pages > .tabs > .tab { pointer-events: auto; padding: 3px 9px; border: 1px solid #a0a0a0; border-bottom: none; background: #e8e8e8; cursor: pointer; white-space: nowrap; height: 22px; margin-top: 2px; }
.k-pages > .tabs > .tab.on { background: #fff; height: 24px; margin-top: 0; }
.k-pages > .chrome > .body { position: absolute; left: 0; right: 0; top: 24px; bottom: 0; border: 1px solid #a0a0a0; background: #fff; }
.k-sheet > .chrome { background: #fff; }
${viewCss()}
${toolsCss()}
${marksCss()}
${compareCss()}
${layoutsCss()}
.snapgrp { position: relative; display: inline-flex; align-items: center; gap: 0; }
#snapmenu { position: absolute; top: 100%; left: 0; z-index: 60; background: var(--vscode-menu-background, var(--vscode-editorWidget-background, #252526)); color: var(--vscode-menu-foreground, var(--vscode-foreground)); border: 1px solid var(--vscode-menu-border, var(--vscode-panel-border, #555)); border-radius: 4px; padding: 6px 10px; display: flex; flex-direction: column; gap: 4px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
#snapmenu[hidden] { display: none; }
.guide { position: absolute; background: #ff2d95; pointer-events: none; z-index: 40; opacity: 0.8; }
.guide.v { width: 1px; }
.gapg { position: absolute; pointer-events: none; z-index: 40; color: #ff2d95; font: 600 9px/10px 'Segoe UI', sans-serif; }
.gapg.h { height: 7px; border-left: 1px solid #ff2d95; border-right: 1px solid #ff2d95; }
.gapg.h::before { content: ''; position: absolute; left: 0; right: 0; top: 3px; height: 1px; background: #ff2d95; }
.gapg.v { width: 7px; border-top: 1px solid #ff2d95; border-bottom: 1px solid #ff2d95; }
.gapg.v::before { content: ''; position: absolute; top: 0; bottom: 0; left: 3px; width: 1px; background: #ff2d95; }
.gapg span { position: absolute; background: #ff2d95; color: #fff; padding: 0 3px; border-radius: 2px; white-space: nowrap; }
.gapg.h span { left: 50%; top: -11px; transform: translateX(-50%); }
.gapg.v span { left: 9px; top: 50%; transform: translateY(-50%); }
.guide.h { height: 1px; }
.fehead { font-weight: 600; margin: 6px 0 3px; }
.febar { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
.febar button { font-size: 11px; padding: 2px 8px; }
.febar button:disabled { opacity: 0.45; cursor: default; }
.mprev { border: 1px solid var(--vscode-panel-border, #444); border-radius: 3px; padding: 3px 0; margin: 3px 0 6px; background: var(--vscode-editorWidget-background, rgba(128,128,128,0.08)); }
.mrow { display: flex; align-items: center; gap: 4px; padding: 2px 6px 2px 4px; cursor: pointer; font-size: 11.5px; }
.mrow:hover { background: var(--vscode-list-hoverBackground); }
.mrow.sel { background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
.mrow.off { opacity: 0.5; }
.mrow.hid .mcap { text-decoration: line-through; }
.mrow .mchk { width: 12px; flex: none; text-align: center; }
.mrow .mcap { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mrow .msc { color: var(--vscode-descriptionForeground); font-size: 10.5px; }
.mrow .msub { width: 10px; flex: none; text-align: right; }
.msep { height: 1px; margin: 3px 4px; background: var(--vscode-panel-border, #555); }
.ferow { display: flex; align-items: center; gap: 6px; }
.ferow .fename { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ferow .fetype { font-size: 10px; color: var(--vscode-descriptionForeground); }
.ferow .fedel { background: none; border: none; cursor: pointer; opacity: 0.6; padding: 0 2px; }
.ferow .fedel:hover { opacity: 1; }
.colorrow { display: flex; align-items: center; gap: 6px; }
.colorrow input[type=color] { width: 34px; height: 22px; padding: 0; border: 1px solid var(--vscode-input-border, #888); background: none; cursor: pointer; }
.colorrow input.auto { opacity: 0.45; }
.colorrow .colortxt { flex: 1; font-size: 11px; color: var(--vscode-descriptionForeground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.colorrow .colorclr { font-size: 11px; padding: 1px 6px; }
.ctl.inherited { outline: 1px dashed #7a6ff0; outline-offset: 1px; }
.nonvisual > .chrome { border: 1px solid #888; background: #fff3c4; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
/* Components with no visual presence sit over the controls they were dropped on: small and faint until the pointer is on them, so they hide nothing. */
.ctl.nonvisual { opacity: 0.4; transition: opacity 0.12s; }
.ctl.nonvisual:hover { opacity: 1; z-index: 30; }
.ctl.nonvisual > .chrome { font-size: 12px; }
.nonvisual > .nvname { opacity: 0; transition: opacity 0.12s; }
.ctl.nonvisual:hover > .nvname { opacity: 1; }
.nonvisual > .nvname { position: absolute; top: 30px; left: -10px; right: -10px; text-align: center; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ev-badge { position: absolute; right: -1px; top: -1px; font-size: 9px; background: #ffd24a; color: #000; border-radius: 3px; padding: 0 2px; line-height: 11px; pointer-events: none; z-index: 5; }
.nm { position: absolute; left: 0; top: -12px; font-size: 9px; background: rgba(0,0,0,0.65); color: #fff; padding: 0 3px; border-radius: 2px; white-space: nowrap; pointer-events: none; z-index: 6; }
#overlay { position: absolute; left: 0; top: 0; width: 0; height: 0; pointer-events: none; z-index: 1000; }
.selbox { position: absolute; outline: 2px dashed #0a84ff; background: rgba(10, 132, 255, 0.12); box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.95); }
.selbox.primary { outline: 3px solid #0a84ff; background: rgba(10, 132, 255, 0.16); box-shadow: 0 0 0 1px #fff, 0 0 12px 3px rgba(10, 132, 255, 0.6); }
.selbox.flash { animation: selflash 0.7s ease-out; }
@keyframes selflash { 0% { box-shadow: 0 0 0 1px #fff, 0 0 0 0 rgba(10, 132, 255, 0.95); } 100% { box-shadow: 0 0 0 1px #fff, 0 0 0 18px rgba(10, 132, 255, 0); } }
.handle { position: absolute; width: 9px; height: 9px; background: #fff; border: 2px solid #0a84ff; box-shadow: 0 0 0 1px #fff; pointer-events: auto; }
.sellabel { position: absolute; background: #0a84ff; color: #fff; font: 600 10px/14px 'Segoe UI', sans-serif; padding: 0 6px; border-radius: 3px; white-space: nowrap; pointer-events: none; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5); }
.band { position: absolute; border: 1px dashed #0078d7; background: rgba(0, 120, 215, 0.12); pointer-events: none; }
.tool-on #client { cursor: crosshair; }
body.hide-left #left, body.hide-right #right { display: none; }
/* the fold handle of a panel: a small tab on its edge, a chevron that points where the panel goes */
.edge { position: absolute; top: 50%; transform: translateY(-50%); z-index: 30; display: flex; align-items: center; justify-content: center; width: 14px; height: 56px; padding: 0; font-size: 15px; line-height: 1; color: var(--vscode-descriptionForeground); background: var(--vscode-editorWidget-background, #252526); border: 1px solid var(--vscode-panel-border, #444); opacity: 0.75; }
.edge:hover:not(:disabled) { opacity: 1; color: var(--vscode-foreground); background: var(--vscode-list-hoverBackground, #2a2d2e); }
#edgeL { left: var(--wl, 210px); border-left: none; border-radius: 0 6px 6px 0; }
#edgeR { right: var(--wr, 240px); border-right: none; border-radius: 6px 0 0 6px; }
body.hide-left #edgeL { left: 0; }
body.hide-right #edgeR { right: 0; }
body.full #toolbar { padding: 3px 8px; }
#toolbar { gap: 4px 0; justify-content: flex-start; min-width: 0; }
.tgtitle { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--vscode-descriptionForeground); cursor: help; }
.tg { display: flex; flex-wrap: wrap; max-width: 100%; gap: 4px; align-items: center; padding: 0 8px; border-right: 1px solid var(--vscode-panel-border, #444); }
.tg:first-child { padding-left: 0; }
.tg.end { border-right: none; }
.tg:empty { display: none; }
.ib { min-width: 26px; padding: 2px 6px; }
.ag { display: inline-flex; gap: 1px; padding: 0 3px; border-right: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.3)); }
.ag:last-child { border-right: none; }
.aicon { padding: 2px 4px; line-height: 0; }
.aico { stroke: currentColor; stroke-width: 1.2; fill: none; }
.aico rect { fill: currentColor; fill-opacity: 0.28; }
.kbd { font-size: 9px; padding: 0 4px; margin-left: 4px; border: 1px solid rgba(128, 128, 128, 0.5); border-radius: 3px; opacity: 0.8; }
.icard { display: flex; gap: 8px; align-items: center; padding: 6px 8px; border-radius: 5px; background: var(--vscode-textBlockQuote-background, rgba(128, 128, 128, 0.12)); margin-bottom: 6px; }
.icard .ico.big { font-size: 20px; width: 26px; text-align: center; }
.icard .meta { min-width: 0; }
.icard .iname { font-weight: 600; font-size: 13px; overflow: hidden; text-overflow: ellipsis; }
.icard .sub { font-size: 11px; color: var(--vscode-descriptionForeground); }
.insec { border-top: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.3)); margin-top: 6px; padding-top: 2px; }
.insec > summary { cursor: pointer; font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--vscode-descriptionForeground); margin: 4px 0; }
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8px; margin-bottom: 2px; }
.f { display: flex; flex-direction: column; gap: 1px; margin: 3px 0; min-width: 0; }
.f > span { font-size: 10px; color: var(--vscode-descriptionForeground); }
.f input, .f select { min-width: 0; width: 100%; }
.chk { display: flex; gap: 4px; align-items: center; margin: 3px 0; }
.anch { display: flex; gap: 10px; align-items: center; margin: 4px 0; }
.anch > span { font-size: 10px; color: var(--vscode-descriptionForeground); }
.danger { width: 100%; margin-top: 10px; }
.evsel { width: 100%; }
.colrow { padding: 1px 4px; cursor: pointer; border-radius: 2px; font-size: 11px; }
.colrow:hover { background: var(--vscode-list-hoverBackground); }
.tips { margin: 4px 0 0 16px; padding: 0; font-size: 11px; line-height: 1.6; color: var(--vscode-descriptionForeground); }
.k-grid { overflow: hidden; }
.dxvs, .dxhs { position: absolute; background: #f0f0f0; pointer-events: auto; cursor: default; z-index: 7; }
.dxvs.sbsel, .dxhs.sbsel { background: #dbeaff; outline: 2px solid #0a84ff; outline-offset: -2px; }
.dxvs.sbsel .th, .dxhs.sbsel .th { background: #6b9fe0; }
.dxvs { top: 22px; right: 0; bottom: 0; width: 17px; border-left: 1px solid #d6d6d6; }
.dxhs { left: 0; bottom: 0; height: 17px; border-top: 1px solid #d6d6d6; }
.dxvs .th { position: absolute; left: 3px; right: 3px; top: 20px; height: 34%; background: #c1c1c1; border-radius: 2px; cursor: pointer; }
.dxhs .th { position: absolute; top: 3px; bottom: 3px; left: 20px; width: 46%; background: #c1c1c1; border-radius: 2px; cursor: pointer; }
.dxvs .th:hover, .dxhs .th:hover { background: #a8a8a8; }
.dxvs .ar, .dxhs .ar { position: absolute; font-size: 7px; color: #606060; line-height: 17px; text-align: center; width: 17px; }
.dxvs .ar.a { top: 0; } .dxvs .ar.b { bottom: 0; } .dxhs .ar.a { left: 0; } .dxhs .ar.b { right: 0; }
.k-gridcolumn > .chrome { border-right: 1px solid #d4d4d4; background: transparent; }
.k-gridcolumn .gh { height: 22px; background: linear-gradient(#fafafa, #e9e9e9); border-bottom: 1px solid #b4b4b4; padding: 3px 6px; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style></head>
<body>
${viewHtml()}
<div id="toolbar">
  <div class="tg" title="File">
    <button id="save" title="Save the .dfm and the .pas (Ctrl+S)">💾 Save<span id="dirty" hidden>●</span><span class="kbd">Ctrl+S</span></button><button id="undo" class="ib" title="Undo (Ctrl+Z)">↶</button><button id="redo" class="ib" title="Redo (Ctrl+Y)">↷</button>
  </div>
  <div class="tg" title="Copy, cut and paste components: cut then paste into another container moves them">
    <button id="copy" class="ib" title="Copy the selected components (Ctrl+C)">⎘</button><button id="cut" class="ib" title="Cut the selected components (Ctrl+X): paste them into another container to move them">✂</button><button id="paste" class="ib" title="Paste into the selected container, or the container of the selected component (Ctrl+V)">📋</button><button id="dup" class="ib" title="Duplicate the selected components next to the originals, with their handlers (Ctrl+D)">⧉</button>
  </div>
  <div class="tg" id="alignbar" title="Align and size the selected components (select two or more)"></div>
  <div class="tg" id="placegrp" title="Placing precisely. Snap (the magnet): while you drag or resize, a component is pulled to the edges and centres of its neighbours and of its container, and to equal gaps, with pink guide lines; hold Alt to move freely. Grid: the step in pixels that what you move or resize is rounded to, and that Shift + arrows move by; off is one pixel at a time.">
    <span class="tgtitle">Snap &amp; Grid</span>
    <span class="snapgrp"><button id="snap" class="active" title="Magnetism: components catch the edges and the centres of the others and of their container, with guide lines. Hold Alt while dragging to turn it off for a moment">🧲 Snap</button><button id="snapopt" class="ib" title="What the magnetism catches">▾</button><div id="snapmenu" hidden><div class="hint">What the magnet catches while you drag or resize:</div><label><input type="checkbox" id="snapedges" checked> Edges</label><label><input type="checkbox" id="snapcenters" checked> Centres</label><label><input type="checkbox" id="snapcont" checked> Container edges and centre</label><label><input type="checkbox" id="snapspacing" checked> Equal spacing</label><label><input type="checkbox" id="snapguides" checked> Guide lines</label></div></span>
    <label title="The step in pixels that what you move or resize is rounded to, and that Shift + arrows move by. off: one pixel at a time. The finest steps (1, 2, 3 px) are for exact placing; 8 to 16 px for tidy layouts.">Grid <select id="grid"><option value="0">off</option><option value="1">1 px</option><option value="2">2 px</option><option value="3">3 px</option><option value="4" selected>4 px</option><option value="5">5 px</option><option value="6">6 px</option><option value="8">8 px</option><option value="10">10 px</option><option value="12">12 px</option><option value="16">16 px</option><option value="20">20 px</option><option value="24">24 px</option><option value="32">32 px</option><option value="48">48 px</option><option value="64">64 px</option></select></label>
  </div>
  <div class="tg" title="How the form is shown, and the tools that work on it">
    <label>Zoom <select id="zoom" title="Fit window scales the form to the room left by the panels. Ctrl + wheel zooms too"><option value="fit">Fit window</option><option id="zoomcustom" value="custom" hidden>100%</option><option value="0.5">50%</option><option value="0.75">75%</option><option value="1" selected>100%</option><option value="1.25">125%</option><option value="1.5">150%</option><option value="2">200%</option></select></label>
    ${viewButton()}
    ${toolsButton()}
  </div>
  <div class="tg end">
    <button id="togleft" class="active" title="Hide / show the palette and the component list (P)">◧ Palette</button><button id="togright" class="active" title="Hide / show the inspector (I)">Inspector ◨</button><button id="full" title="Full screen: hides both panels and the VS Code interface (F, or Ctrl+K F). Press again to come back">⛶ Full screen<span class="kbd">Ctrl+K F</span></button><button id="opencode" title="Switch to the code of the unit; come back with the Designer tab, the title-bar button or the same shortcut">&lt;/&gt; Code<span class="kbd">Ctrl+K Ctrl+B</span></button><button id="opendfm" title="Open the .dfm text">.dfm</button>
  </div>
</div>
<div id="main">
  <button id="edgeL" class="edge" title="Hide the palette and the component list (P)">‹</button>
  <div id="left">
    <details open class="sec" id="compsec"><summary>Components <span class="hint" id="compcount"></span></summary>
      <div class="row"><input type="text" id="cfname" placeholder="Filter by name or class…"></div>
      <div class="row"><select id="cftype" title="Filter by type"></select></div>
      <div class="row"><button id="cexp" title="Expand every container of the list">▾ Expand all</button><button id="ccol" title="Collapse every container of the list">▸ Collapse all</button></div>
      <div class="row"><select id="cfsort" title="Sort"><option value="form">Form order</option><option value="name">By name</option><option value="type">By type</option><option value="pos">By position</option></select><label title="One flat list instead of the tree"><input type="checkbox" id="cfflat"> flat</label></div>
      <div id="outline" class="outline"></div>
    </details>
    <div id="splitV" class="vsplit" title="Drag to give more room to the components or to the palette (double-click: default)"></div>
    <details class="sec" id="palsec"><summary>Palette <span class="hint" id="palcount"></span></summary>
      <div class="row"><input type="text" id="palfilter" placeholder="Filter by name…"></div>
      <div class="row"><select id="palgroup" title="Component type: only the components of this type are listed"></select></div>
      <div id="palette"></div>
      <div class="row"><input type="text" id="otherclass" placeholder="Other class, e.g. TcxButton"><button id="otherbtn" title="Use this class as the tool">＋</button></div>
    </details>
  </div>
  <div id="splitL" class="split" title="Drag to resize the palette (double-click: default width)"></div>
  <div id="center"><div id="zoomwrap"><div id="formframe"><div id="titlebar"><span id="ftitle"></span><span class="ctrls">–□✕</span></div><div id="client" tabindex="0"><div id="overlay"></div><div id="hov"></div></div></div></div></div>
  <div id="splitR" class="split" title="Drag to resize the inspector (double-click: default width)"></div>
  <div id="right"><div id="inspector"></div></div>
  <button id="edgeR" class="edge" title="Hide the inspector (I)">›</button>
</div>
<div id="status"></div>
<div id="droplabel"></div>
<script nonce="${nonce}">
(function () {
  var vscode = acquireVsCodeApi();
  var state = { model: null, sel: [], tool: null, showParents: false, hover: null, dragNames: null, cf: { text: '', type: '', sort: 'form', flat: false }, palOpen: {}, palGroup: '', palHost: {}, details: {}, openAfter: false, insOpen: {}, ui: { left: true, right: true, full: false, before: null, wl: 0, wr: 0, pal: false, oh: 0 }, collapsed: {}, revealKey: '', cut: [], dirty: false, fit: false, fitSet: false, listOrder: [], lastPick: '', zoom: 1, grid: 4, gscroll: {}, view: { names: false, containers: false, tab: false, rulers: false, theme: 'auto', mouse: null }, snap: { on: true, edges: true, centers: true, container: true, guides: true, spacing: true }, names: false, tabs: {}, palette: [], ops: [], canUndo: false, canRedo: false };
  var byName = {}, parentOf = {}, els = {};
  var drag = null;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text !== undefined) { e.textContent = text; } return e; }
  function post(m) { vscode.postMessage(m); }

  /* ───────── classification ───────── */
  var FAMILY = { devexpress: { cls: 'dx', label: 'DevExpress', short: 'DX' }, tms: { cls: 'tms', label: 'TMS', short: 'TMS' }, unidac: { cls: 'uni', label: 'UniDAC', short: 'UNI' } };
  function famCls(f) { return FAMILY[f] ? FAMILY[f].cls : ''; }
  /* Non-visual components are small icons: the glyph says what they are. */
  function nvGlyph(cls) {
    var l = cls.toLowerCase();
    if (l === 'ttimer') { return '⏱'; }
    if (l === 'tpopupmenu' || l === 'tmainmenu') { return '☰'; }
    if (l.indexOf('provider') >= 0) { return '🧩'; }
    if (l.slice(-10) === 'connection') { return '🔌'; }
    if (l.slice(-11) === 'transaction') { return '⇄'; }
    if (l.slice(-10) === 'datasource') { return '🔗'; }
    if (l.slice(-6) === 'script') { return '📜'; }
    if (l.slice(-5) === 'query' || l.slice(-5) === 'table' || l.slice(-10) === 'storedproc' || l.slice(-7) === 'dataset' || l.slice(-8) === 'memtable') { return '🗃'; }
    if (l.slice(-3) === 'sql') { return '▤'; }
    if (l.slice(-6) === 'dialog') { return '🗔'; }
    if (l.slice(-8) === 'metadata') { return 'ℹ'; }
    if (l.slice(-6) === 'loader' || l.slice(-4) === 'dump') { return '📦'; }
    if (l.slice(-7) === 'alerter') { return '🔔'; }
    if (l.slice(-9) === 'encryptor') { return '🔐'; }
    return '⚙';
  }
  function kind(c) {
    var l = c.toLowerCase();
    if (l === 'tchart' || l === 'tdbchart') { return 'chart'; }
    if (l === 'tchartbook') { return 'chartbook'; }
    if (/^t[a-z0-9]*series$/.test(l) && l.indexOf('tcx') !== 0 && l.indexOf('tdx') !== 0) { return 'series'; }
    if (/^t(dragmarks|annotation|cursor|markstip|rotate|dragpoint|nearest|colorband|gridband|seriesband|axisarrow|image|seriesanimation|colorline)tool$/.test(l)) { return 'charttool'; }
    if (l === 'tdxbardockcontrol') { return 'dock'; }
    if (l === 'tdxbar') { return 'bar'; }
    if (l.indexOf('tdxbar') === 0 && l !== 'tdxbarmanager' && l !== 'tdxbarpopupmenu' && l.indexOf('tdxbarscreentip') !== 0) { return 'baritem'; }
    if (l === 'tmenuitem') { return 'menuitem'; }
    if (l === 'tpopupmenu' || l === 'tmainmenu') { return 'menu'; }
    if (l === 'tdxtilecontrol') { return 'tilecontrol'; }
    if (l === 'tdxtilecontrolitem') { return 'tile'; }
    if (l === 'tdxtilecontrolgroup') { return 'tilegroup'; }
    if (l.slice(-10) === 'detailsite') { return 'panel'; }
    if (l.indexOf('tcxgrid') === 0 && l !== 'tcxgrid' && l.indexOf('popupmenu') < 0 && l.indexOf('repository') < 0) {
      if (l.slice(-5) === 'level') { return 'gridlevel'; }
      if (l.slice(-6) === 'column') { return 'gridcolumn'; }
      return 'gridview';
    }
    if (l.slice(-5) === 'field') { return 'datafield'; }
    if (l.slice(-5) === 'query' || l.slice(-5) === 'table' || l.slice(-10) === 'storedproc' || l.slice(-7) === 'dataset' || l.slice(-8) === 'memtable') { return 'dataset'; }
    if (l.slice(-10) === 'connection') { return 'connection'; }
    if (l.indexOf('officepager') >= 0 || l.indexOf('pagecontrol') >= 0 || l === 'tcxpc') { return 'pages'; }
    if (l.indexOf('officepage') >= 0 || l.indexOf('tabsheet') >= 0) { return 'sheet'; }
    if (l.indexOf('radiogroup') >= 0 || l.indexOf('checkgroup') >= 0) { return 'radiogroup'; }
    if (l.indexOf('checklistbox') >= 0 || l.indexOf('listbox') >= 0) { return 'list'; }
    if (l.indexOf('checkbox') >= 0) { return 'check'; }
    if (l.indexOf('radiobutton') >= 0) { return 'radio'; }
    if (l.indexOf('groupbox') >= 0) { return 'group'; }
    if (l.indexOf('combobox') >= 0) { return 'combo'; }
    if (l.indexOf('datetimepicker') >= 0 || l.indexOf('dateedit') >= 0 || l.indexOf('timeedit') >= 0) { return 'datepick'; }
    if (l.indexOf('memo') >= 0 || l.indexOf('richedit') >= 0) { return 'memo'; }
    if (l.indexOf('listview') >= 0) { return 'listview'; }
    if (l.indexOf('treeview') >= 0 || l.indexOf('treelist') >= 0) { return 'treeview'; }
    if (l.indexOf('statusbar') >= 0) { return 'statusbar'; }
    if (l.indexOf('toolbar') >= 0 || l === 'tdxbardockcontrol') { return 'toolbar'; }
    if (l.indexOf('progressbar') >= 0) { return 'progress'; }
    if (l.indexOf('trackbar') >= 0) { return 'track'; }
    if (l.indexOf('splitter') >= 0) { return 'splitter'; }
    if (l.indexOf('scrollbox') >= 0) { return 'scroll'; }
    if (l.indexOf('image') >= 0) { return 'image'; }
    if (l.indexOf('shape') >= 0) { return 'shape'; }
    if (l.indexOf('bevel') >= 0) { return 'bevel'; }
    if (l.indexOf('grid') >= 0) { return 'grid'; }
    if (l.slice(-5) === 'panel') { return 'panel'; }
    if (l.slice(-5) === 'label' && l.indexOf('labelededit') < 0) { return 'label'; }
    if (l.slice(-6) === 'button' || l.indexOf('bitbtn') >= 0) { return 'button'; }
    if (l.slice(-4) === 'edit' || l.slice(-3) === 'btn' || l.indexOf('maskedit') >= 0) { return 'edit'; }
    return 'generic';
  }

  /* ───────── rendering ───────── */
  function index(n, parent) { byName[n.name] = n; parentOf[n.name] = parent; n.children.forEach(function (c) { index(c, n.name); }); }
  /* The colour of a component: plain, or the gradient of a smooth control (Fill.Color to Fill.ColorTo), with its border and rounded corners. */
  function paintFill(chrome, n) {
    var bg = n.color;
    if (n.colorTo) {
      bg = n.gradient === 'radial' ? 'radial-gradient(circle at center, ' + n.color + ', ' + n.colorTo + ')'
        : 'linear-gradient(' + (n.gradient === 'horizontal' ? 'to right' : 'to bottom') + ', ' + n.color + ', ' + n.colorTo + ')';
    }
    chrome.style.background = bg;
    if (n.borderColor) { chrome.style.border = '1px solid ' + n.borderColor; }
    if (n.rounding) { chrome.style.borderRadius = Math.min(n.rounding, 24) + 'px'; }
  }
  function setFont(e, n) {
    e.style.fontSize = Math.round(n.fontSize * 4 / 3) + 'px';
    if (n.bold) { e.style.fontWeight = '700'; }
    if (n.fontColor) { e.style.color = n.fontColor; }
  }
  function activeSheet(n) {
    var sheets = n.children.filter(function (c) { return kind(c.cls) === 'sheet'; });
    var want = state.tabs[n.name] || n.activePage;
    var hit = sheets.filter(function (s) { return s.name === want; })[0];
    return (hit || sheets[0] || {}).name;
  }
  /* A TeeChart chart: title, axes, and sample values for each series in the colour of the series. */
  var CHART_COLORS = ['#e04a4a', '#3cb371', '#e8c84a', '#4a7be0', '#9aa0a6', '#b25cc8', '#3ab7b7', '#e08a3c'];
  function svgEl(tag, attrs) {
    var x = document.createElementNS(['http', '//www.w3.org/2000/svg'].join(':'), tag);
    Object.keys(attrs || {}).forEach(function (a) { x.setAttribute(a, attrs[a]); });
    return x;
  }
  function chartContent(n, chrome) {
    var c = n.chart || { title: '', series: [], legend: true, view3D: false, tools: [] };
    var W = Math.max(60, n.w), H = Math.max(40, n.h);
    var svg = svgEl('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H });
    var series = c.series.filter(function (s) { return s.visible; });
    var legendW = c.legend && series.length ? Math.min(120, Math.max(64, W * 0.24)) : 0;
    var x0 = 34, y0 = c.title ? 28 : 10, x1 = W - legendW - 10, y1 = H - 22;
    if (c.title) { var tt = svgEl('text', { x: (W - legendW) / 2, y: 18, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 600, fill: '#333' }); tt.textContent = c.title; svg.appendChild(tt); }
    var pw = x1 - x0, ph = y1 - y0;
    if (pw > 30 && ph > 20) {
      for (var g = 0; g <= 5; g++) {
        var gy = y1 - g * ph / 5;
        svg.appendChild(svgEl('line', { x1: x0, y1: gy, x2: x1, y2: gy, stroke: '#e3e3e3', 'stroke-width': 1 }));
        var lab = svgEl('text', { x: x0 - 4, y: gy + 3, 'text-anchor': 'end', 'font-size': 9, fill: '#666' }); lab.textContent = String(g * 2); svg.appendChild(lab);
      }
      svg.appendChild(svgEl('line', { x1: x0, y1: y0, x2: x0, y2: y1, stroke: '#888', 'stroke-width': 1 }));
      svg.appendChild(svgEl('line', { x1: x0, y1: y1, x2: x1, y2: y1, stroke: '#888', 'stroke-width': 1 }));
      var cats = 5, gw = pw / cats, base = [3, 5, 2, 6, 4];
      for (var q = 0; q < cats; q++) { var xl = svgEl('text', { x: x0 + (q + 0.5) * gw, y: y1 + 12, 'text-anchor': 'middle', 'font-size': 9, fill: '#666' }); xl.textContent = String.fromCharCode(65 + q); svg.appendChild(xl); }
      var pie = series.filter(function (s) { return s.kind === 'pie'; })[0];
      if (pie) {
        var cx = x0 + pw / 2, cy = y0 + ph / 2, r = Math.max(6, Math.min(pw, ph) / 2 - 2), a0 = -Math.PI / 2, tot = 0, v;
        base.forEach(function (b) { tot += b; });
        base.forEach(function (b, j) {
          var a1 = a0 + 2 * Math.PI * b / tot;
          var d = 'M ' + cx + ' ' + cy + ' L ' + (cx + r * Math.cos(a0)) + ' ' + (cy + r * Math.sin(a0)) + ' A ' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + (cx + r * Math.cos(a1)) + ' ' + (cy + r * Math.sin(a1)) + ' Z';
          svg.appendChild(svgEl('path', { d: d, fill: CHART_COLORS[j % CHART_COLORS.length], stroke: '#fff', 'stroke-width': 1 }));
          a0 = a1;
        });
      }
      var plain = series.filter(function (s) { return s.kind !== 'pie'; });
      var bars = plain.filter(function (s) { return s.kind === 'bar'; });
      plain.forEach(function (s, i) {
        var col = s.color || CHART_COLORS[series.indexOf(s) % CHART_COLORS.length];
        var vals = base.map(function (b, j) { return ((b + i * 2 + j) % 6) + 1; });
        var px = function (j) { return x0 + (j + 0.5) * gw; };
        var py = function (v) { return y1 - v / 7 * ph; };
        if (s.kind === 'bar') {
          var bw = gw * 0.7 / Math.max(1, bars.length), bi = bars.indexOf(s);
          vals.forEach(function (v, j) { svg.appendChild(svgEl('rect', { x: x0 + j * gw + gw * 0.15 + bi * bw, y: py(v), width: Math.max(1, bw - 1), height: y1 - py(v), fill: col })); });
        } else if (s.kind === 'hbar') {
          var rh = ph / cats;
          vals.forEach(function (v, j) { svg.appendChild(svgEl('rect', { x: x0, y: y0 + j * rh + rh * 0.15, width: v / 7 * pw, height: rh * 0.7, fill: col })); });
        } else if (s.kind === 'area') {
          var pts = vals.map(function (v, j) { return px(j) + ',' + py(v); }).join(' ');
          svg.appendChild(svgEl('polygon', { points: px(0) + ',' + y1 + ' ' + pts + ' ' + px(cats - 1) + ',' + y1, fill: col, opacity: 0.6 }));
        } else {
          if (s.kind === 'line') { svg.appendChild(svgEl('polyline', { points: vals.map(function (v, j) { return px(j) + ',' + py(v); }).join(' '), fill: 'none', stroke: col, 'stroke-width': 2 })); }
          vals.forEach(function (v, j) { svg.appendChild(svgEl('circle', { cx: px(j), cy: py(v), r: s.kind === 'point' ? 3.5 : 2.5, fill: col })); });
        }
      });
    }
    if (legendW) {
      var ly = y0 + 2;
      series.forEach(function (s, i) {
        svg.appendChild(svgEl('rect', { x: W - legendW, y: ly, width: 9, height: 9, fill: s.color || CHART_COLORS[i % CHART_COLORS.length] }));
        var lt = svgEl('text', { x: W - legendW + 13, y: ly + 8, 'font-size': 10, fill: '#333' }); lt.textContent = s.title.length > 14 ? s.title.slice(0, 13) + '…' : s.title; svg.appendChild(lt);
        ly += 15;
      });
    }
    if (!series.length) { var nt = svgEl('text', { x: (x0 + x1) / 2, y: (y0 + y1) / 2, 'text-anchor': 'middle', 'font-size': 11, fill: '#999', 'font-style': 'italic' }); nt.textContent = 'No series: add one from the palette (TeeChart)'; svg.appendChild(nt); }
    chrome.appendChild(svg);
  }
  /* A chart: title, legend, 3D, and its series and tools to add; a series: its title, colour and visibility. */
  function chartFields(box, n) {
    var c = n.chart || { title: '', series: [], legend: true, view3D: false, tools: [] };
    section(box, 'Chart', 'chart', function (b) {
      b.appendChild(labelled('Title', textInput(c.title, function (v) { post({ type: 'setChartTitle', name: n.name, lines: [v] }); })));
      b.appendChild(checkbox('Show the title', n.props['Title.Visible'] !== 'False', setter(n, 'Title.Visible')));
      b.appendChild(checkbox('Legend', c.legend, setter(n, 'Legend.Visible')));
      b.appendChild(checkbox('3D view', n.props['View3D'] === 'True', setter(n, 'View3D')));
      b.appendChild(el('div', 'fehead', 'Series (' + c.series.length + ')'));
      c.series.forEach(function (s) { if (byName[s.name]) { b.appendChild(fieldRow(byName[s.name], s.title + (s.visible ? '' : ' (hidden)'), s.cls)); } });
      var addS = el('select'); var h1 = el('option', '', '＋ Add a series…'); h1.value = ''; addS.appendChild(h1);
      ['TBarSeries', 'THorizBarSeries', 'TLineSeries', 'TFastLineSeries', 'TAreaSeries', 'TPointSeries', 'TPieSeries'].forEach(function (k2) { var o = el('option', '', k2); o.value = k2; addS.appendChild(o); });
      addS.addEventListener('change', function () { if (addS.value) { post({ type: 'add', className: addS.value, parent: n.name, left: 0, top: 0 }); } });
      b.appendChild(addS);
      b.appendChild(el('div', 'fehead', 'Tools (' + c.tools.length + ')'));
      c.tools.forEach(function (t) { if (byName[t]) { b.appendChild(fieldRow(byName[t], t, byName[t].cls)); } });
      var addT = el('select'); var h2 = el('option', '', '＋ Add a tool…'); h2.value = ''; addT.appendChild(h2);
      ['TDragMarksTool', 'TAnnotationTool', 'TCursorTool', 'TMarksTipTool', 'TRotateTool', 'TSeriesBandTool', 'TColorBandTool', 'TGridBandTool', 'TDragPointTool', 'TNearestTool'].forEach(function (k3) { var o = el('option', '', k3); o.value = k3; addT.appendChild(o); });
      addT.addEventListener('change', function () { if (addT.value) { post({ type: 'add', className: addT.value, parent: n.name, left: 0, top: 0 }); } });
      b.appendChild(addT);
      b.appendChild(el('div', 'hint', 'The plot shows sample values: the data of a series comes from the code or its DataSource.'));
    });
  }
  function seriesFields(box, n) {
    if (kind(n.cls) === 'charttool') {
      box.appendChild(checkbox('Active', n.props['Active'] !== 'False', setter(n, 'Active')));
      box.appendChild(el('div', 'hint', 'A chart tool adds behaviour at run time (dragging marks, annotations, a cursor…); nothing is drawn for it.'));
      return;
    }
    var chart = byName[parentOf[n.name]];
    var info = chart && chart.chart ? chart.chart.series.filter(function (s) { return s.name === n.name; })[0] : undefined;
    box.appendChild(labelled('Title', textInput(n.props['Title'] !== undefined ? fromDfmText(n.props['Title']) : '', setter(n, 'Title'))));
    box.appendChild(colorRow(n, 'Color', 'SeriesColor', info ? info.color : undefined, undefined));
    box.appendChild(checkbox('Active', n.props['Active'] !== 'False', setter(n, 'Active')));
    box.appendChild(checkbox('Color each point', n.props['ColorEachPoint'] === 'True', setter(n, 'ColorEachPoint')));
    box.appendChild(checkbox('Marks', n.props['Marks.Visible'] === 'True', setter(n, 'Marks.Visible')));
    box.appendChild(el('div', 'hint', 'A series draws in the chart that holds it, with sample values here.'));
  }
  /* A dock control draws the bars docked in it, with the captions of their items. */
  function dockContent(n, chrome) {
    var bars = n.dockBars || [];
    bars.forEach(function (b) {
      var bar = el('div', 'dxbar'); bar.title = b.name + (b.caption ? ' - ' + b.caption : '');
      var any = false;
      b.items.forEach(function (it) {
        if (!it.visible) { return; }
        any = true;
        if (it.beginGroup) { bar.appendChild(el('span', 'dxsep', '')); }
        var x = el('span', 'dxbi ' + it.kind, (it.caption || (it.kind === 'button' ? '◻' : '')) + (it.kind === 'sub' ? ' ▾' : ''));
        x.title = it.name + ' : ' + it.cls;
        if (it.width && it.kind !== 'button') { x.style.minWidth = Math.min(it.width, 300) + 'px'; }
        bar.appendChild(x);
      });
      if (!any) { bar.appendChild(el('span', 'dxbi dim', b.caption)); }
      chrome.appendChild(bar);
    });
    if (!bars.length) { chrome.appendChild(el('span', 'dxbi dim', 'Dock control: no bar docked here')); }
  }
  function content(n, e, chrome) {
    var k = kind(n.cls);
    var cap = n.caption !== undefined ? n.caption : (n.text !== undefined ? n.text : '');
    setFont(e, n);
    if (cap.indexOf(String.fromCharCode(10)) >= 0 || cap.indexOf(String.fromCharCode(13)) >= 0) { e.classList.add('ml'); }
    if (n.color && (k === 'panel' || k === 'edit' || k === 'memo' || k === 'scroll' || k === 'group' || k === 'sheet' || k === 'generic' || (k === 'label' && n.props['Transparent'] === 'False') || k === 'combo' || k === 'datepick' || k === 'list' || k === 'listview' || k === 'treeview' || k === 'gridcolumn' || k === 'toolbar' || k === 'statusbar')) { paintFill(chrome, n); }
    if (k === 'button' || k === 'label') { chrome.textContent = cap; }
    else if (k === 'edit' || k === 'combo' || k === 'datepick') {
      var lc = n.cls.toLowerCase();
      if (k === 'edit' && (lc.indexOf('buttonedit') >= 0 || lc.indexOf('editbtn') >= 0 || lc.indexOf('directoryedit') >= 0 || lc.indexOf('filenameedit') >= 0)) { e.classList.add('hasbtn'); }
      if (k === 'edit' && lc.indexOf('spinedit') >= 0) { e.classList.add('hasspin'); }
      if (k === 'edit' && (lc.indexOf('currency') >= 0 || lc.indexOf('spin') >= 0)) { e.classList.add('num'); }
      chrome.appendChild(el('span', '', n.props['PasswordChar'] ? '••••••' : (k === 'datepick' ? '01/01/2026' : (cap || (n.lines[0] && k === 'combo' ? n.lines[0] : '')))));
    }
    else if (k === 'memo' || k === 'list' || k === 'listview') { chrome.textContent = n.lines.join(String.fromCharCode(10)); }
    else if (k === 'check' || k === 'radio') { chrome.appendChild(el('span', 'box', n.props['Checked'] === 'True' ? (k === 'check' ? '✓' : '•') : '')); chrome.appendChild(el('span', '', cap)); }
    else if (k === 'panel') { if (n.props['ShowCaption'] !== 'False') { chrome.textContent = n.children.length ? '' : cap; } if (!n.bevel) { e.classList.add('nobevel'); } }
    else if (k === 'group') { var lg = el('span', 'legend', cap); e.appendChild(lg); lg.style.background = n.color || '#f0f0f0'; }
    else if (k === 'image') { chrome.textContent = '🏞'; }
    else if (k === 'radiogroup') {
      e.appendChild(el('span', 'legend', cap));
      var rgbox = el('div', 'rgitems');
      (n.lines.length ? n.lines : ['Item 1', 'Item 2']).slice(0, 6).forEach(function (t) { var r = el('div', 'rgi'); r.appendChild(el('span', 'rb', '')); r.appendChild(document.createTextNode(t)); rgbox.appendChild(r); });
      chrome.appendChild(rgbox);
    }
    else if (k === 'grid') {
      var rh = Number(n.props['DefaultRowHeight'] || 24), cw = Number(n.props['DefaultColWidth'] || 64);
      chrome.style.backgroundSize = cw + 'px ' + rh + 'px';
      if (n.family === 'devexpress') {
        // rows only: the columns draw their own vertical lines
        chrome.style.backgroundImage = 'linear-gradient(#ececec 1px, transparent 1px)'; chrome.style.backgroundSize = '100% 21px';
        if (n.gridBand !== false) { chrome.appendChild(el('div', 'dxband', 'Drag a column header here to group by that column')); }
      }
      else { var hd = el('div', 'gridhead'); hd.style.height = (Number(n.props['FixedRows'] || 1) * rh) + 'px'; chrome.appendChild(hd); var fx = el('div', 'gridfix'); fx.style.width = (Number(n.props['FixedCols'] || 1) * cw) + 'px'; chrome.appendChild(fx); }
    }
    else if (k === 'dock') { dockContent(n, chrome); }
    else if (k === 'chart') { chartContent(n, chrome); }
    else if (k === 'chartbook') {
      var tabs = el('div', 'cbtabs');
      var pages = n.children.filter(function (c) { return kind(c.cls) === 'chart'; });
      pages.forEach(function (c, i) { tabs.appendChild(el('span', 'cbtab' + (i === 0 ? ' on' : ''), (c.chart && c.chart.title) || c.name)); });
      if (!pages.length) { tabs.appendChild(el('span', 'cbtab on', n.name)); }
      chrome.appendChild(tabs);
    }
    else if (k === 'statusbar' || k === 'toolbar') { chrome.textContent = k === 'statusbar' ? cap : ''; }
    else if (k === 'generic') { chrome.textContent = n.cls + (cap ? ' – ' + cap : ''); }
    else if (k === 'sheet') { chrome.style.background = n.color || '#fff'; }
    else if (k === 'gridcolumn') {
      var gh = el('div', 'gh', n.caption || columnTitle(n));
      if (n.headerColor) { gh.style.background = n.headerColor; }
      if (n.headerText) { gh.style.color = n.headerText; }
      chrome.appendChild(gh);
    }
    else if (k === 'tilecontrol') { if (n.tileTexts && n.tileTexts[0]) { e.appendChild(el('div', 'tilettl', n.tileTexts[0])); } }
    else if (k === 'tilegroup') { chrome.textContent = n.caption || n.name; }
    else if (k === 'tile') {
      chrome.style.background = n.color || '#2d89ef';
      var tx = n.tileTexts || [];
      e.classList.add('sz-' + String(n.tileSize || 'tcisRegular').toLowerCase());
      if (tx[0]) { chrome.appendChild(el('div', 't1', tx[0])); } else if (!tx[1]) { chrome.appendChild(el('div', 't1 dim', n.name)); }
      if (tx[1]) { chrome.appendChild(el('div', 't2', tx[1])); }
    }
    if (n.nonVisual) { chrome.textContent = nvGlyph(n.cls); e.appendChild(el('div', 'nvname', n.name)); }
  }
  /* The forms the unit puts in a container of this form: fAddFormInto(oForm, pnl) and oForm.Parent := pnl. */
  function hostsOf(name) { return (state.hosts || []).filter(function (h) { return h.parent === name; }); }
  function mkInner(n, parent) {
    var k = kind(n.cls);
    var e = el('div', 'ctl k-' + k + (n.family ? ' fam-' + famCls(n.family) : '') + (n.container ? ' cont' : '') + (n.visible ? '' : ' hidden') + (n.enabled ? '' : ' disabled') + (n.nonVisual ? ' nonvisual' : '') + (n.inherited ? ' inherited' : '') + (n.wrap ? ' wrap' : ''));
    e.setAttribute('data-name', n.name);
    // name, class and, for a connection or a query, the server or the first lines of the SQL
    e.title = n.name + ' : ' + n.cls + (n.summary ? String.fromCharCode(10) + n.summary : '') + (n.note ? String.fromCharCode(10) + n.note : '') + (n.inherited ? String.fromCharCode(10) + 'Inherited from the ancestor form: it cannot be deleted or renamed here' : '');
    e.style.left = n.x + 'px'; e.style.top = n.y + 'px';
    // A hidden detail page of a tile control would cover the tiles: it is drawn only while it (or something in it) is selected.
    if (isDetail(n) && !n.visible && !state.details[n.name]) { e.style.display = 'none'; }
    e.style.width = (n.nonVisual ? 22 : n.w) + 'px'; e.style.height = (n.nonVisual ? 22 : n.h) + 'px';
    var chrome = el('div', 'chrome');
    e.appendChild(chrome);
    try { content(n, e, chrome); } catch (err) { chrome.textContent = n.cls; }
    if (k === 'generic' && !n.nonVisual) { e.classList.add('unmanaged'); var q = el('span', 'unmgd-badge', '?'); q.title = 'Class not recognised by the designer: drawn as a placeholder, its properties stay exactly as written in the .dfm'; e.appendChild(q); }
    if (Object.keys(n.events).length && !n.nonVisual) { e.appendChild(el('span', 'ev-badge', '⚡')); }
    var hs = hostsOf(n.name);
    if (hs.length) { var hb = el('span', 'host-badge', '🔗'); hb.title = 'Holds the form ' + hs.map(function (h) { return h.className || h.formArg; }).join(', ') + ' (see the inspector)'; e.appendChild(hb); }
    if (state.names && !n.nonVisual && n.depth > 0) { e.appendChild(el('span', 'nm', n.name)); }
    els[n.name] = e;
    parent.appendChild(e);
    // Structure (grid views, levels, hidden columns) is listed and edited, never painted; the columns of a shown view sit in the grid itself.
    if (n.structural) { e.style.display = 'none'; n.children.forEach(function (c) { mk(c, parent); }); return; }
    if (k === 'pages') {
      var active = activeSheet(n);
      var tabs = el('div', 'tabs');
      n.children.forEach(function (s) {
        if (kind(s.cls) !== 'sheet') { return; }
        var t = el('div', 'tab' + (s.name === active ? ' on' : ''), s.caption || s.name);
        t.setAttribute('data-pages', n.name); t.setAttribute('data-sheet', s.name);
        tabs.appendChild(t);
      });
      var body = el('div', 'body');
      chrome.appendChild(body);
      e.appendChild(tabs);
      n.children.forEach(function (c) { mk(c, e); if (kind(c.cls) === 'sheet' && c.name !== active) { els[c.name].style.display = 'none'; } });
    } else {
      n.children.forEach(function (c) { mk(c, e); });
      if (k === 'grid' && n.family === 'devexpress' && n.scrollView !== undefined) { gridBars(e, n); }
    }
  }
  /* ───────── the scroll bars of a DevExpress grid ───────── */
  function colsWidth(n) {
    var w = 0;
    (function sum(x) { x.children.forEach(function (c) { if (kind(c.cls) === 'gridcolumn' && c.props['Visible'] !== 'False') { w += Number(c.props['Width'] || 64); } else { sum(c); } }); })(n);
    return w;
  }
  function clamp01(v) { return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; }
  /* The columns are moved by what the horizontal bar says: the ones beyond the right edge are reached by scrolling, as in the real grid. */
  function applyGridScroll(e, n) {
    var gs = state.gscroll[n.name] || { x: 0, y: 0 };
    var off = gs.x * Math.max(0, colsWidth(n) - (n.w - 17));
    e.querySelectorAll(':scope > .k-gridcolumn').forEach(function (c) { c.style.transform = off ? 'translateX(' + (-off) + 'px)' : ''; });
  }
  function gridBars(e, n) {
    var sbs = n.scrollBars || 'ssBoth';
    var gs = state.gscroll[n.name] || (state.gscroll[n.name] = { x: 0, y: 0 });
    var colsW = colsWidth(n);
    var tip = 'Scroll bar of the grid: click to select it, drag to scroll (OptionsView.ScrollBars of ' + (n.scrollView || 'the view') + ')';
    if (sbs === 'ssBoth' || sbs === 'ssVertical') {
      var vs = el('div', 'dxvs'); vs.title = tip;
      var vt = el('div', 'th'); var vtrack = Math.max(10, n.h - 22 - 34); var vthumb = Math.max(20, Math.round(vtrack * 0.34));
      vt.style.height = vthumb + 'px'; vt.style.top = Math.round(17 + gs.y * (vtrack - vthumb)) + 'px';
      vs.appendChild(el('span', 'ar a', '▲')); vs.appendChild(vt); vs.appendChild(el('span', 'ar b', '▼'));
      e.appendChild(vs);
    }
    if (colsW > n.w - 17 && (sbs === 'ssBoth' || sbs === 'ssHorizontal')) {
      var hs = el('div', 'dxhs'); hs.title = tip;
      var ht = el('div', 'th'); var htrack = Math.max(10, n.w - 17 - 34); var hthumb = Math.max(24, Math.min(Math.round(htrack * 0.9), Math.round(htrack * (n.w - 17) / colsW)));
      ht.style.width = hthumb + 'px'; ht.style.left = Math.round(17 + gs.x * (htrack - hthumb)) + 'px';
      hs.appendChild(el('span', 'ar a', '◀')); hs.appendChild(ht); hs.appendChild(el('span', 'ar b', '▶'));
      hs.style.right = '17px';
      e.appendChild(hs);
    }
    applyGridScroll(e, n);
  }
  /* Dragging the thumb (or clicking the track) of a grid's scroll bar. */
  function startBarDrag(ev, gname, axis) {
    var n = byName[gname], e = els[gname], gs = state.gscroll[gname] || (state.gscroll[gname] = { x: 0, y: 0 });
    var bar = e && e.querySelector(axis === 'v' ? '.dxvs' : '.dxhs');
    var th = bar && bar.querySelector('.th');
    if (!th) { return; }
    var rect = bar.getBoundingClientRect(), tr = th.getBoundingClientRect(), z = state.zoom;
    // grabbing the thumb keeps it where it is; the track moves it to the pointer
    var grab = ev.target === th ? (axis === 'h' ? ev.clientX - (tr.left + tr.width / 2) : ev.clientY - (tr.top + tr.height / 2)) : 0;
    function setFrom(ev2) {
      if (axis === 'h') {
        var thumb = parseFloat(th.style.width), track = n.w - 17 - 34;
        gs.x = clamp01(((ev2.clientX - grab - rect.left) / z - 17 - thumb / 2) / Math.max(1, track - thumb));
        th.style.left = Math.round(17 + gs.x * (track - thumb)) + 'px';
        applyGridScroll(e, n);
      } else {
        var thumbV = parseFloat(th.style.height), trackV = n.h - 22 - 34;
        gs.y = clamp01(((ev2.clientY - grab - rect.top) / z - 17 - thumbV / 2) / Math.max(1, trackV - thumbV));
        th.style.top = Math.round(17 + gs.y * (trackV - thumbV)) + 'px';
      }
      drawSel(); markScrollbar();
    }
    function up() { document.removeEventListener('mousemove', setFrom); document.removeEventListener('mouseup', up); }
    setFrom(ev);
    document.addEventListener('mousemove', setFrom);
    document.addEventListener('mouseup', up);
  }
  /* One component the designer cannot draw must never break the others: it becomes a placeholder box. */
  function mk(n, parent) {
    try { mkInner(n, parent); }
    catch (err) {
      var old = els[n.name];
      if (old && old.parentNode) { old.parentNode.removeChild(old); }
      var fb = el('div', 'ctl k-generic unmanaged broken');
      fb.setAttribute('data-name', n.name);
      fb.style.left = n.x + 'px'; fb.style.top = n.y + 'px'; fb.style.width = n.w + 'px'; fb.style.height = n.h + 'px';
      var ch = el('div', 'chrome'); ch.textContent = '⚠ ' + n.cls; fb.appendChild(ch);
      parent.appendChild(fb);
      els[n.name] = fb;
    }
  }
  function render() {
    try { renderInner(); }
    catch (err) { state.notice = 'The designer could not draw part of this form (' + (err && err.message ? err.message : err) + '). The .dfm is untouched.'; renderStatus(); }
  }
  function renderInner() {
    var m = state.model;
    if (!m) { return; }
    byName = {}; parentOf = {}; els = {};
    index(m.root, '');
    state.details = wantedDetails();
    var client = $('client');
    var overlay = $('overlay');
    var hov = $('hov');
    state.hover = null;
    while (client.firstChild) { client.removeChild(client.firstChild); }
    client.appendChild(overlay);
    client.appendChild(hov);
    while (hov.firstChild) { hov.removeChild(hov.firstChild); }
    client.style.width = m.width + 'px'; client.style.height = m.height + 'px';
    client.style.background = m.root.color || '#f0f0f0';
    $('formframe').style.width = (m.width + 2) + 'px';
    $('ftitle').textContent = m.formCaption;
    m.root.children.forEach(function (c) { mk(c, client); });
    els[m.root.name] = client;
    state.sel = state.sel.filter(function (s) { return byName[s] && s !== m.root.name; });
    if (state.fit) { fitZoom(true); } else { applyZoom(); }
    drawSel(); renderOutline(); renderInspector(); renderStatus();
    $('undo').disabled = !state.canUndo; $('redo').disabled = !state.canRedo;
    markCut(); showDirty(); markScrollbar(); viewRedraw();
  }
  var ZOOM_PRESETS = ['0.5', '0.75', '1', '1.25', '1.5', '2'];
  /* The zoom select shows a value that is not one of its presets (a Ctrl + wheel zoom) in a line of its own. */
  /* The Fit window entry says the zoom it gives: the form is shown whole, at 100% when it fits. */
  function fitLabel() { var o = $('zoom').options[0]; if (o && o.value === 'fit') { o.textContent = 'Fit window (' + Math.round(state.zoom * 100) + '%)'; } }
  function showZoom() {
    var sel = $('zoom');
    fitLabel();
    if (state.fit) { sel.value = 'fit'; return; }
    var key = String(Math.round(state.zoom * 100) / 100);
    if (ZOOM_PRESETS.indexOf(key) >= 0) { sel.value = key; return; }
    var o = $('zoomcustom');
    o.textContent = Math.round(state.zoom * 100) + '%'; o.hidden = false; o.value = 'custom';
    sel.value = 'custom';
  }
  /* Zoom to z, keeping the point under (px, py) of the visible area where it is. */
  function setZoom(z, px, py) {
    z = Math.max(0.25, Math.min(3, Math.round(z * 100) / 100));
    if (z === state.zoom) { return; }
    var c = $('center');
    var r = c.getBoundingClientRect();
    var ax = px === undefined ? c.clientWidth / 2 : px - r.left, ay = py === undefined ? c.clientHeight / 2 : py - r.top;
    var cx = (c.scrollLeft + ax) / state.zoom, cy = (c.scrollTop + ay) / state.zoom;
    state.fit = false; state.fitSet = true; state.zoom = z;
    applyZoom(); showZoom();
    c.scrollLeft = cx * z - ax; c.scrollTop = cy * z - ay;
    drawSel(); saveUi();
  }
  function applyZoom() {
    var z = state.zoom;
    $('zoomwrap').style.transform = 'scale(' + z + ')';
    var f = $('formframe');
    $('center').style.setProperty('--w', '1');
    $('zoomwrap').style.marginRight = (f.offsetWidth * (z - 1)) + 'px';
    $('zoomwrap').style.marginBottom = (f.offsetHeight * (z - 1)) + 'px';
    drawRulers();
  }
  function relRect(e) {
    var c = $('client').getBoundingClientRect(), r = e.getBoundingClientRect(), z = state.zoom;
    return { x: (r.left - c.left) / z, y: (r.top - c.top) / z, w: r.width / z, h: r.height / z };
  }
  function isFree(name) { var n = byName[name]; return n && !n.docked; }

  /* ───────── selection overlay ───────── */
  var HANDLES = { nw: [0, 0], n: [0.5, 0], ne: [1, 0], e: [1, 0.5], se: [1, 1], s: [0.5, 1], sw: [0, 1], w: [0, 0.5] };
  function allowedHandles(n) {
    if (!n.docked) { return Object.keys(HANDLES); }
    if (n.align === 'alTop') { return ['s']; }
    if (n.align === 'alBottom') { return ['n']; }
    if (n.align === 'alLeft') { return ['e']; }
    if (n.align === 'alRight') { return ['w']; }
    return [];
  }
  function drawSel() {
    var o = $('overlay');
    while (o.firstChild) { o.removeChild(o.firstChild); }
    var key = state.sel.join(',');
    var flash = key !== state.selKey;
    state.selKey = key;
    updateAlignBar(); updateEditBar();
    drawParents(o);
    state.sel.forEach(function (name, i) {
      var e = els[name];
      if (!e || e.offsetParent === null) { return; }
      var r = relRect(e), n = byName[name];
      var primary = i === state.sel.length - 1;
      var b = el('div', 'selbox' + (primary ? ' primary' : '') + (flash ? ' flash' : ''));
      b.style.left = (r.x - 1) + 'px'; b.style.top = (r.y - 1) + 'px'; b.style.width = (r.w + 2) + 'px'; b.style.height = (r.h + 2) + 'px';
      o.appendChild(b);
      if (primary) {
        var text = state.sel.length > 1 ? state.sel.length + ' selected · ' + name : name + ' : ' + n.cls + '   ' + Math.round(r.w) + '×' + Math.round(r.h);
        var lab = el('div', 'sellabel', text);
        lab.style.left = (r.x - 1) + 'px';
        lab.style.top = (r.y >= 20 ? r.y - 20 : r.y + r.h + 6) + 'px';
        o.appendChild(lab);
      }
      allowedHandles(n).forEach(function (h) {
        var hd = el('div', 'handle');
        hd.setAttribute('data-h', h);
        hd.style.left = (r.x - 1 + HANDLES[h][0] * (r.w + 2) - 5) + 'px'; hd.style.top = (r.y - 1 + HANDLES[h][1] * (r.h + 2) - 5) + 'px';
        hd.style.cursor = h + '-resize';
        o.appendChild(hd);
      });
    });
  }

  /* ───────── side panels ───────── */
  var ICONS = { chartbook: '📚', chart: '📊', series: '▮', charttool: '🛠', dock: '▬', bar: '▤', baritem: '▫', menuitem: '≡', button: '🔘', label: '🅰', edit: '▭', memo: '📝', check: '☑', radio: '◉', combo: '▾', list: '☰', panel: '▢', group: '⛶', pages: '🗂', sheet: '📄', grid: '▦', image: '🏞', shape: '◆', bevel: '▬', splitter: '┃', progress: '▰', tilecontrol: '🟦', tile: '◼', tilegroup: '▤', gridcolumn: '▮', gridview: '▦', gridlevel: '🗂', datafield: '▫', dataset: '🗃', connection: '🔌', track: '⎯', datepick: '📅', treeview: '🌳', radiogroup: '◉', statusbar: '▁', toolbar: '▤', scroll: '⬚', listview: '☰', generic: '❓' };
  function iconOf(n) { return n.nonVisual ? nvGlyph(n.cls) : (ICONS[kind(n.cls)] || '◻'); }
  /* The palette shows ONE type (family) at a time, chosen in the list; a name filter searches every type. */
  function renderPalette() {
    var p = $('palette'); while (p.firstChild) { p.removeChild(p.firstChild); }
    var flt = (state.filter || '').toLowerCase();
    var groups = [], byGroup = {}, shown = 0;
    state.palette.forEach(function (it) {
      if (!byGroup[it.group]) { byGroup[it.group] = []; groups.push(it.group); }
      byGroup[it.group].push(it);
    });
    if (!byGroup[state.palGroup]) { state.palGroup = groups[0] || ''; }
    $('palgroup').value = state.palGroup;
    (flt ? groups : [state.palGroup]).forEach(function (g) {
      var items = (byGroup[g] || []).filter(function (it) { return !flt || it.cls.toLowerCase().indexOf(flt) >= 0; });
      if (!items.length) { return; }
      if (flt) { p.appendChild(el('div', 'pal-head', g + ' (' + items.length + ')')); }
      var box = el('div', 'pal');
      items.forEach(function (it) {
        var b = el('button', state.tool === it.cls ? 'active' : '', it.icon + ' ' + it.cls.slice(1));
        b.title = it.cls + (it.host ? ' - goes inside ' + HOST_LABEL[it.host] + ' (select one, or click one on the form)' : '');
        b.setAttribute('data-tool', it.cls); box.appendChild(b);
      });
      p.appendChild(box); shown += items.length;
    });
    if (!shown) { p.appendChild(el('div', 'hint', 'No component matches.')); }
    $('palcount').textContent = flt ? shown + ' found' : (byGroup[state.palGroup] || []).length + ' in ' + state.palGroup;
    document.body.classList.toggle('tool-on', !!state.tool);
  }
  function fillPalGroups() {
    var sel = $('palgroup'); while (sel.firstChild) { sel.removeChild(sel.firstChild); }
    var count = {}, order = [];
    state.palHost = {};
    state.palette.forEach(function (it) {
      if (!count[it.group]) { count[it.group] = 0; order.push(it.group); }
      count[it.group]++;
      if (it.host) { state.palHost[it.cls] = it.host; }
    });
    order.forEach(function (g) { var o = el('option', '', g + ' (' + count[g] + ')'); o.value = g; sel.appendChild(o); });
  }
  /* Parts go inside a host: tiles into a tile control, levels and views into a grid, columns into a view. The selected one, or the one that is clicked. */
  var HOST_LABEL = { tile: 'a TdxTileControl', grid: 'a TcxGrid', view: 'a grid view', dataset: 'a dataset', menu: 'a menu or a menu item', chart: 'a TChart or TDBChart' };
  function hostMatch(h, name) {
    var n = byName[name];
    if (!n) { return false; }
    if (h === 'tile') { return kind(n.cls) === 'tilecontrol'; }
    if (h === 'grid') { return n.cls === 'TcxGrid'; }
    if (h === 'dataset') { return !!n.dataset; }
    if (h === 'menu') { return kind(n.cls) === 'menu' || kind(n.cls) === 'menuitem'; }
    if (h === 'chart') { return kind(n.cls) === 'chart'; }
    if (h === 'view') { return kind(n.cls) === 'gridview' && n.cls.slice(-4) === 'View'; }
    return false;
  }
  function viewOfGrid(g) {
    if (g.shownView) { return g.shownView; }
    var v = g.children.filter(function (c) { return hostMatch('view', c.name); })[0];
    return v ? v.name : '';
  }
  function hostAbove(h, name) {
    var c = name;
    while (c) {
      if (hostMatch(h, c)) { return c; }
      if (h === 'view' && byName[c] && byName[c].cls === 'TcxGrid') { return viewOfGrid(byName[c]); }
      c = parentOf[c];
    }
    return '';
  }
  function selectedHost(h) { var s0 = state.sel[state.sel.length - 1]; return s0 ? hostAbove(h, s0) : ''; }
  function hostFromElement(h, elem) {
    var c = elem.closest ? elem.closest('.ctl') : null;
    while (c) {
      var found = hostAbove(h, c.getAttribute('data-name'));
      if (found) { return found; }
      c = c.parentElement && c.parentElement.closest ? c.parentElement.closest('.ctl') : null;
    }
    return '';
  }
  function placeInHost(host) {
    if (!host) { state.notice = state.tool + ' goes inside ' + HOST_LABEL[state.palHost[state.tool]] + ': select one, or click one on the form.'; renderStatus(); return; }
    post({ type: 'add', className: state.tool, parent: host, left: 16, top: 16 });
    state.tool = null; renderPalette(); renderStatus();
  }
  function isFixed(name) { var n = byName[name]; return !!n && !!n.fixed; }
  function isTilePart(name) { var n = byName[name]; return !!n && (kind(n.cls) === 'tile' || kind(n.cls) === 'tilegroup'); }

  /* ───────── align, size and distribute: icon buttons, enabled when enough components are selected ───────── */
  var ALIGN_ICONS = {
    left: '<path d="M2 1v14"/><rect x="4" y="3" width="10" height="4"/><rect x="4" y="9" width="6" height="4"/>',
    centerX: '<path d="M8 1v14"/><rect x="3" y="3" width="10" height="4"/><rect x="5" y="9" width="6" height="4"/>',
    right: '<path d="M14 1v14"/><rect x="2" y="3" width="10" height="4"/><rect x="6" y="9" width="6" height="4"/>',
    top: '<path d="M1 2h14"/><rect x="3" y="4" width="4" height="10"/><rect x="9" y="4" width="4" height="6"/>',
    centerY: '<path d="M1 8h14"/><rect x="3" y="3" width="4" height="10"/><rect x="9" y="5" width="4" height="6"/>',
    bottom: '<path d="M1 14h14"/><rect x="3" y="2" width="4" height="10"/><rect x="9" y="6" width="4" height="6"/>',
    sameWidth: '<rect x="2" y="2" width="12" height="4"/><rect x="2" y="10" width="12" height="4"/><path d="M2 8h12M2 8l2-1.5M2 8l2 1.5M14 8l-2-1.5M14 8l-2 1.5"/>',
    sameHeight: '<rect x="2" y="2" width="4" height="12"/><rect x="10" y="2" width="4" height="12"/><path d="M8 2v12M8 2l-1.5 2M8 2l1.5 2M8 14l-1.5-2M8 14l1.5-2"/>',
    sameSize: '<rect x="1" y="1" width="6" height="6"/><rect x="9" y="9" width="6" height="6"/><path d="M9 3h5M9 5h5M2 9v5M4 9v5"/>',
    spaceH: '<path d="M1 1v14M15 1v14"/><rect x="4" y="4" width="2" height="8"/><rect x="10" y="4" width="2" height="8"/>',
    spaceV: '<path d="M1 1h14M1 15h14"/><rect x="4" y="4" width="8" height="2"/><rect x="4" y="10" width="8" height="2"/>'
  };
  var ALIGN_GROUPS = [['left', 'centerX', 'right'], ['top', 'centerY', 'bottom'], ['sameWidth', 'sameHeight', 'sameSize'], ['spaceH', 'spaceV']];
  function buildAlignBar(ops) {
    var bar = $('alignbar'); while (bar.firstChild) { bar.removeChild(bar.firstChild); }
    var by = {}; ops.forEach(function (o) { by[o.id] = o; });
    ALIGN_GROUPS.forEach(function (g) {
      var group = el('span', 'ag');
      g.forEach(function (id) {
        var o = by[id]; if (!o) { return; }
        var b = el('button', 'ib aicon'); b.setAttribute('data-op', id);
        b.title = o.label + (id === 'spaceH' || id === 'spaceV' ? ' (select three or more components)' : ' (select two or more components)');
        b.innerHTML = '<svg class="aico" viewBox="0 0 16 16" width="16" height="16">' + (ALIGN_ICONS[id] || '') + '</svg>';
        b.addEventListener('click', function () { post({ type: 'align', op: id, names: state.sel.slice() }); });
        group.appendChild(b);
      });
      bar.appendChild(group);
    });
    updateAlignBar();
  }
  function updateAlignBar() {
    var n = state.sel.length;
    Array.prototype.forEach.call(document.querySelectorAll('#alignbar [data-op]'), function (b) {
      var id = b.getAttribute('data-op');
      b.disabled = n < (id === 'spaceH' || id === 'spaceV' ? 3 : 2);
    });
  }

  /* ───────── components list: filter by name and type, sort, tree or flat ───────── */
  function allNodes() {
    var out = [];
    (function walk(n) { out.push(n); n.children.forEach(walk); })(state.model.root);
    return out.slice(1);
  }
  function typeKey(n) { return 'c:' + n.cls; }
  function matchesType(n, t) {
    if (!t) { return true; }
    if (t === '@container') { return n.container; }
    if (t === '@nonvisual') { return n.nonVisual; }
    if (t === '@events') { return Object.keys(n.events).length > 0; }
    if (t === '@unknown') { return kind(n.cls) === 'generic' && !n.nonVisual; }
    if (t === '@dx') { return n.family === 'devexpress'; }
    if (t === '@tms') { return n.family === 'tms'; }
    if (t === '@uni') { return n.family === 'unidac'; }
    return typeKey(n) === t;
  }
  function matchesText(n, text) {
    if (!text) { return true; }
    var hay = (n.name + ' ' + n.cls + ' ' + (n.caption || '')).toLowerCase();
    return text.toLowerCase().split(' ').filter(Boolean).every(function (tok) { return hay.indexOf(tok) >= 0; });
  }
  function fillTypeSelect(nodes) {
    var sel = $('cftype'), keep = state.cf.type;
    while (sel.firstChild) { sel.removeChild(sel.firstChild); }
    var count = function (fn) { return nodes.filter(fn).length; };
    var add = function (v, label) { var o = el('option', '', label); o.value = v; sel.appendChild(o); };
    add('', 'All types (' + nodes.length + ')');
    add('@container', 'Containers (' + count(function (n) { return n.container; }) + ')');
    add('@nonvisual', 'Non-visual (' + count(function (n) { return n.nonVisual; }) + ')');
    add('@events', 'With event handlers (' + count(function (n) { return Object.keys(n.events).length > 0; }) + ')');
    add('@unknown', 'Unknown classes (' + count(function (n) { return matchesType(n, '@unknown'); }) + ')');
    var dx = count(function (n) { return n.family === 'devexpress'; }), tms = count(function (n) { return n.family === 'tms'; });
    if (dx) { add('@dx', 'DevExpress (' + dx + ')'); }
    if (tms) { add('@tms', 'TMS (' + tms + ')'); }
    var uni = count(function (n) { return n.family === 'unidac'; });
    if (uni) { add('@uni', 'UniDAC (' + uni + ')'); }
    var classes = {};
    nodes.forEach(function (n) { classes[n.cls] = (classes[n.cls] || 0) + 1; });
    Object.keys(classes).sort().forEach(function (c) { add('c:' + c, c + ' (' + classes[c] + ')'); });
    sel.value = keep; if (sel.value !== keep) { sel.value = ''; state.cf.type = ''; }
  }
  function renderOutline() {
    var o = $('outline'); while (o.firstChild) { o.removeChild(o.firstChild); }
    if (!state.model) { return; }
    var nodes = allNodes();
    fillTypeSelect(nodes);
    var f = state.cf;
    var rows = nodes.filter(function (n) { return matchesType(n, f.type) && matchesText(n, f.text); });
    var filtered = !!(f.text || f.type);
    if (f.sort === 'name') { rows.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; }); }
    else if (f.sort === 'type') { rows.sort(function (a, b) { return a.cls === b.cls ? (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1) : (a.cls < b.cls ? -1 : 1); }); }
    else if (f.sort === 'pos') { rows.sort(function (a, b) { return (a.y - b.y) || (a.x - b.x); }); }
    var tree = !f.flat && !filtered && f.sort === 'form';
    var hasKids = {};
    nodes.forEach(function (n) { if (parentOf[n.name]) { hasKids[parentOf[n.name]] = true; } });
    // a selection made elsewhere (on the form) opens the containers above it
    var rk = state.sel.join(',');
    if (rk !== state.revealKey) { state.revealKey = rk; state.sel.forEach(function (s0) { var up = parentOf[s0]; while (up) { delete state.collapsed[up]; up = parentOf[up]; } }); }
    if (tree) {
      var hideBelow = -1;
      rows = rows.filter(function (n) {
        if (hideBelow >= 0 && n.depth > hideBelow) { return false; }
        hideBelow = state.collapsed[n.name] && hasKids[n.name] ? n.depth : -1;
        return true;
      });
    }
    state.listOrder = rows.map(function (n) { return n.name; });
    $('compcount').textContent = (filtered || !tree ? rows.length : nodes.length) + '/' + nodes.length;
    if (!f.text && !f.type) {
      var rr = el('div', 'rootrow', '⌂ ' + state.model.root.name + ' (form)');
      rr.setAttribute('data-pick', state.model.root.name);
      rr.title = 'The form itself: drop components here to move them out of their container';
      o.appendChild(rr);
    }
    rows.forEach(function (n) {
      var d = el('div', (state.sel.indexOf(n.name) >= 0 ? 'sel' : '') + (state.cut.indexOf(n.name) >= 0 ? ' cutrow' : '') + (n.props['Visible'] === 'False' ? ' hiddenrow' : ''));
      d.setAttribute('data-pick', n.name);
      d.draggable = true;
      d.title = n.name + ' : ' + n.cls + (n.caption ? ' — ' + n.caption : '');
      d.style.paddingLeft = (tree ? n.depth * 10 : 4) + 'px';
      if (tree) {
        var tw = el('span', 'tw', hasKids[n.name] ? (state.collapsed[n.name] ? '▸' : '▾') : '');
        if (hasKids[n.name]) { tw.setAttribute('data-twist', n.name); tw.title = state.collapsed[n.name] ? 'Expand' : 'Collapse'; }
        d.appendChild(tw);
      }
      d.appendChild(el('span', 'ico', iconOf(n)));
      d.appendChild(document.createTextNode(n.name));
      d.appendChild(el('span', 'cls', n.cls));
      if (n.family && FAMILY[n.family]) { d.appendChild(el('span', 'fam-tag ' + FAMILY[n.family].cls, FAMILY[n.family].short)); }
      if (!tree && parentOf[n.name] && parentOf[n.name] !== state.model.root.name) { d.appendChild(el('span', 'par', '↳ ' + parentOf[n.name])); }
      o.appendChild(d);
    });
    if (!rows.length) { o.appendChild(el('div', 'hint', 'No component matches.')); }
    var picked = o.querySelector('.sel');
    if (picked && picked.scrollIntoView) { picked.scrollIntoView({ block: 'nearest' }); }
  }
  function toggleCollapse(name) { if (state.collapsed[name]) { delete state.collapsed[name]; } else { state.collapsed[name] = true; } saveUi(); renderOutline(); }
  function collapseAll(on) {
    state.collapsed = {};
    if (on && state.model) { allNodes().forEach(function (n) { if (n.children && n.children.length) { state.collapsed[n.name] = true; } }); }
    state.revealKey = state.sel.join(',');
    saveUi(); renderOutline();
  }
  /* ───────── drag a row of the components list onto a container row ───────── */
  (function () {
    var oc = $('outline');
    function clearDrop() { Array.prototype.forEach.call(oc.querySelectorAll('.dropok'), function (r) { r.classList.remove('dropok'); }); }
    oc.addEventListener('dragstart', function (ev) {
      var row = ev.target.closest ? ev.target.closest('[data-pick]') : null;
      if (!row || row.getAttribute('data-pick') === rootName() || isFixed(row.getAttribute('data-pick'))) { ev.preventDefault(); return; }
      var name = row.getAttribute('data-pick');
      state.dragNames = state.sel.indexOf(name) >= 0 ? state.sel.slice() : [name];
      ev.dataTransfer.setData('text/plain', state.dragNames.join(','));
      ev.dataTransfer.effectAllowed = 'move';
    });
    oc.addEventListener('dragover', function (ev) {
      clearDrop();
      var row = ev.target.closest ? ev.target.closest('[data-pick]') : null;
      if (!row || !state.dragNames) { return; }
      if (canDropInto(state.dragNames, dropTargetName(row.getAttribute('data-pick')))) { ev.preventDefault(); row.classList.add('dropok'); }
    });
    oc.addEventListener('dragleave', function (ev) { if (!ev.relatedTarget || !oc.contains(ev.relatedTarget)) { clearDrop(); } });
    oc.addEventListener('drop', function (ev) {
      ev.preventDefault(); clearDrop();
      var row = ev.target.closest ? ev.target.closest('[data-pick]') : null;
      if (row && state.dragNames) { reparentTo(state.dragNames, row.getAttribute('data-pick')); }
      state.dragNames = null;
    });
    oc.addEventListener('dragend', function () { clearDrop(); state.dragNames = null; });
  })();
  /* A component on a hidden page: switch the page tabs so that it can be seen, then scroll to it. */
  function revealNode(name) {
    var child = name, changed = false;
    while (parentOf[child]) {
      var p = parentOf[child];
      if (kind(byName[child].cls) === 'sheet' && byName[p] && kind(byName[p].cls) === 'pages' && state.tabs[p] !== child) { state.tabs[p] = child; changed = true; }
      child = p;
    }
    return changed;
  }
  function listClick(name, ev) {
    if (name === rootName()) { select([]); return; }
    var sel;
    if (ev.shiftKey && state.lastPick && state.listOrder.indexOf(state.lastPick) >= 0) {
      var a = state.listOrder.indexOf(state.lastPick), b = state.listOrder.indexOf(name);
      sel = state.listOrder.slice(Math.min(a, b), Math.max(a, b) + 1);
    } else if (ev.ctrlKey || ev.metaKey) {
      sel = state.sel.slice(); var i = sel.indexOf(name);
      if (i >= 0) { sel.splice(i, 1); } else { sel.push(name); }
    } else { sel = [name]; }
    state.lastPick = name;
    var tabsChanged = revealNode(name);
    if (tabsChanged) { state.sel = sel; render(); } else { select(sel); }
    var e = els[name];
    if (e && e.scrollIntoView) { e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }
  function field(label, node) { var r = el('div', 'row'); r.appendChild(el('span', '', label)); r.appendChild(node); return r; }
  function textInput(value, onCommit, type) {
    var i = el('input'); i.type = type || 'text'; i.value = value === undefined ? '' : value;
    var commit = function () { if (String(i.value) !== String(value === undefined ? '' : value)) { onCommit(i.value); } };
    i.addEventListener('change', commit);
    i.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { commit(); i.blur(); } });
    return i;
  }
  /* ───────── inspector: identity, position, content, state, events — in collapsible sections ───────── */
  var TILE_SIZES = ['tcisSmall', 'tcisRegular', 'tcisLarge', 'tcisExtraLarge'];
  var PART_TITLES = { series: 'Series', charttool: 'Chart tool', bar: 'Bar', baritem: 'Bar item', menuitem: 'Menu item', tile: 'Tile', tilegroup: 'Tile group', gridcolumn: 'Column', gridview: 'View', gridlevel: 'Level', datafield: 'Field' };
  var DB_PROVIDERS = ['Oracle', 'SQL Server', 'MySQL', 'PostgreSQL', 'SQLite', 'InterBase', 'Access', 'ODBC', 'DB2', 'ASE', 'Advantage', 'NexusDB'];
  function section(box, title, key, build) {
    var d = el('details', 'insec');
    d.open = state.insOpen[key] !== false;
    d.addEventListener('toggle', function () { state.insOpen[key] = d.open; });
    d.appendChild(el('summary', '', title));
    build(d);
    box.appendChild(d);
  }
  /* A colour of the component: the picker writes the colour as Delphi does, Clear gives it back to the parent or the style. */
  function colorRow(n, label, prop, shown, from) {
    var row = el('div', 'colorrow');
    var pick = el('input'); pick.type = 'color'; pick.value = shown || '#ffffff'; pick.title = label;
    if (!shown) { pick.classList.add('auto'); }
    pick.addEventListener('change', function () { post({ type: 'setProp', name: n.name, prop: prop, value: pick.value }); });
    var txt = el('span', 'colortxt', shown ? shown + (from && from !== prop ? ' - ' + from : '') : 'automatic');
    var clr = el('button', 'colorclr', 'Clear'); clr.title = 'Remove ' + prop + ' from the .dfm';
    clr.disabled = n.props[prop] === undefined;
    clr.addEventListener('click', function () { post({ type: 'setProp', name: n.name, prop: prop, value: '' }); });
    row.appendChild(pick); row.appendChild(txt); row.appendChild(clr);
    return labelled(label, row);
  }
  function labelled(label, node) { var l = el('label', 'f'); l.appendChild(el('span', '', label)); l.appendChild(node); return l; }
  function checkbox(label, checked, onChange) {
    var l = el('label', 'chk'); var c = el('input'); c.type = 'checkbox'; c.checked = checked;
    c.addEventListener('change', function () { onChange(c.checked); });
    l.appendChild(c); l.appendChild(document.createTextNode(' ' + label));
    return l;
  }
  function setter(n, prop) { return function (v) { post({ type: 'setProp', name: n.name, prop: prop, value: v }); }; }
  /* What a grid column shows when it has no caption and no field: its name without the name of its view. */
  function columnTitle(n) {
    var v = parentOf[n.name];
    return v && n.name.indexOf(v) === 0 && n.name.length > v.length ? n.name.slice(v.length) : n.name;
  }
  /* Tiles and groups of a tile control: what can be changed here is the text, the size and the group. */
  function tileFields(box, n) {
    if (kind(n.cls) === 'tilegroup') {
      box.appendChild(labelled('Caption', textInput(n.caption, setter(n, 'Caption.Text'))));
      box.appendChild(el('div', 'hint', 'A group of tiles: a tile joins it through its own Group field.'));
      return;
    }
    var tx = n.tileTexts || [];
    box.appendChild(labelled('Text 1', textInput(tx[0], setter(n, 'Text1.Value'))));
    box.appendChild(labelled('Text 2', textInput(tx[1], setter(n, 'Text2.Value'))));
    var sz = el('select');
    TILE_SIZES.forEach(function (z) { var o = el('option', '', z.slice(4)); o.value = z; if ((n.tileSize || 'tcisRegular') === z) { o.selected = true; } sz.appendChild(o); });
    sz.addEventListener('change', function () { post({ type: 'setProp', name: n.name, prop: 'Size', value: sz.value }); });
    box.appendChild(labelled('Size', sz));
    var gs = el('select');
    var host = byName[parentOf[n.name]];
    var groups = host ? host.children.filter(function (c) { return kind(c.cls) === 'tilegroup'; }) : [];
    var cur = Number(n.props['GroupIndex'] || 0), known = {};
    groups.forEach(function (g) { var gi = Number(g.props['Index'] || 0); known[gi] = 1; var o = el('option', '', gi + ' · ' + (g.caption || g.name)); o.value = String(gi); gs.appendChild(o); });
    if (!known[cur]) { var o2 = el('option', '', cur + ' · (no such group)'); o2.value = String(cur); gs.appendChild(o2); }
    gs.value = String(cur);
    gs.addEventListener('change', function () { post({ type: 'setProp', name: n.name, prop: 'GroupIndex', value: Number(gs.value) }); });
    box.appendChild(labelled('Group', gs));
    box.appendChild(el('div', 'hint', 'A tile is placed by its tile control: change its size or group here, it cannot be dragged.'));
  }
  /* Levels, views and columns of a DevExpress grid. */
  function gridFields(box, n) {
    var k = kind(n.cls);
    if (k === 'gridcolumn') {
      box.appendChild(labelled('Caption', textInput(n.props['Caption'] !== undefined ? n.caption : '', setter(n, 'Caption'))));
      box.appendChild(labelled('Field', textInput(n.gridField || '', setter(n, 'DataBinding.FieldName'))));
      columnFieldLink(box, n);
      box.appendChild(labelled('Width', textInput(n.props['Width'] !== undefined ? Number(n.props['Width']) : 64, function (v) { post({ type: 'setProp', name: n.name, prop: 'Width', value: Number(v) }); }, 'number')));
      box.appendChild(checkbox('Visible', n.props['Visible'] !== 'False', setter(n, 'Visible')));
      box.appendChild(el('div', 'hint', 'Drawn in the header of the view the grid shows, in the order of the .dfm.'));
    } else if (k === 'gridlevel') {
      var vs = el('select');
      var none = el('option', '', '(no view)'); none.value = ''; vs.appendChild(none);
      allNodes().forEach(function (c) { if (hostMatch('view', c.name)) { var o = el('option', '', c.name + ' : ' + c.cls); o.value = c.name; vs.appendChild(o); } });
      vs.value = n.props['GridView'] || '';
      vs.addEventListener('change', function () { post({ type: 'setProp', name: n.name, prop: 'GridView', value: vs.value }); });
      box.appendChild(labelled('View', vs));
      box.appendChild(el('div', 'hint', 'The view this level shows. The first level of a grid decides which view is drawn.'));
    } else {
      var sbSel = el('select');
      [['ssBoth', 'Both (default)'], ['ssVertical', 'Vertical only'], ['ssHorizontal', 'Horizontal only'], ['ssNone', 'None']].forEach(function (p) { var o = el('option', '', p[1]); o.value = p[0]; sbSel.appendChild(o); });
      sbSel.value = n.props['OptionsView.ScrollBars'] || 'ssBoth';
      sbSel.addEventListener('change', function () { post({ type: 'setProp', name: n.name, prop: 'OptionsView.ScrollBars', value: sbSel.value }); });
      box.appendChild(labelled('Scroll bars', sbSel));
      var cols = n.children.filter(function (c) { return kind(c.cls) === 'gridcolumn'; });
      box.appendChild(el('div', 'fehead', 'Columns (' + cols.length + ')'));
      var cbar = el('div', 'febar');
      var addc = el('button', '', '＋ Add column'); addc.title = 'A new column: set its field in the inspector afterwards';
      var colCls = n.cls.indexOf('Banded') >= 0 ? (n.cls.indexOf('DB') >= 0 ? 'TcxGridDBBandedColumn' : 'TcxGridBandedColumn') : (n.cls.indexOf('DB') >= 0 ? 'TcxGridDBColumn' : 'TcxGridColumn');
      addc.addEventListener('click', function () { post({ type: 'add', className: colCls, parent: n.name, left: 0, top: 0 }); });
      cbar.appendChild(addc);
      var allc = el('button', '', '⟳ From the fields' + (n.newFields ? ' (' + n.newFields + ')' : ''));
      allc.title = 'One column per field of the dataset this view shows (its persistent fields, else the columns of its SELECT) that has none yet';
      allc.disabled = !n.newFields;
      allc.addEventListener('click', function () { post({ type: 'createColumns', name: n.name }); });
      cbar.appendChild(allc);
      box.appendChild(cbar);
      cols.forEach(function (c) { box.appendChild(fieldRow(c, (c.caption || columnTitle(c)) + (c.structural ? ' (not shown)' : ''), c.cls)); });
      if (!cols.length) { box.appendChild(el('div', 'hint', 'No column yet. The view needs DataController.DataSource set to create them from the fields.')); }
    }
  }
  /* The persistent fields of a dataset, as the IDE's field editor: add one, add all the columns of the SELECT, edit one (it is selected), delete one. */
  function fieldsEditor(b, n) {
    var fields = n.children.filter(function (c) { return kind(c.cls) === 'datafield'; });
    var head = el('div', 'fehead', 'Fields (' + fields.length + ')');
    b.appendChild(head);
    var bar = el('div', 'febar');
    var add = el('button', '', '＋ Add field'); add.title = 'A new persistent field (a string): choose its type and name it in the inspector afterwards';
    add.addEventListener('click', function () { post({ type: 'add', className: 'TStringField', parent: n.name, left: 0, top: 0 }); });
    bar.appendChild(add);
    var all = el('button', '', '⟳ From the SELECT' + (n.newFields ? ' (' + n.newFields + ')' : ''));
    all.title = n.sql === undefined ? 'This query has no SQL in the form' : 'One field per column of the SELECT that has none yet; the types are guessed from the names, correct them after';
    all.disabled = !n.newFields;
    all.addEventListener('click', function () { post({ type: 'createFields', name: n.name }); });
    bar.appendChild(all);
    b.appendChild(bar);
    fields.forEach(function (f) { b.appendChild(fieldRow(f, f.dataField || '', f.cls)); });
    if (!fields.length) { b.appendChild(el('div', 'hint', 'No persistent field: the dataset builds them from the SQL at run time. Add them to give them a type, a label or events.')); }
  }
  /* A row of the field editor: the name (a click selects it, to edit it) and a delete button. */
  function fieldRow(c, label, cls) {
    var r = el('div', 'colrow ferow');
    r.setAttribute('data-pick', c.name); r.title = c.name + ' : ' + cls;
    r.appendChild(el('span', 'fename', label || c.name));
    r.appendChild(el('span', 'fetype', cls.replace(/^T/, '').replace(/Field$/, '')));
    var del = el('button', 'fedel', '🗑'); del.title = 'Delete ' + c.name;
    del.addEventListener('click', function (ev) { ev.preventDefault(); post({ type: 'delete', names: [c.name] }); });
    r.appendChild(del);
    return r;
  }
  /* A persistent field of a dataset. */
  /* The persistent field of the query behind a grid column: jump to it, and edit its label from the column. */
  function columnFieldLink(box, n) {
    var cf = n.colField;
    if (!cf) { return; }
    var f = cf.field ? byName[cf.field] : undefined;
    box.appendChild(el('div', 'fehead', 'Field of ' + cf.dataset));
    if (!f) {
      box.appendChild(el('div', 'hint', cf.fieldName + ' has no persistent field in ' + cf.dataset + ': add it with the dataset field editor (select the dataset, From the SELECT).'));
      var ds = el('button', '', 'Select ' + cf.dataset); ds.addEventListener('click', function () { if (byName[cf.dataset]) { select([cf.dataset]); } });
      box.appendChild(ds);
      return;
    }
    var go = el('div', 'colrow ferow'); go.title = 'Select the field ' + f.name; go.setAttribute('data-pick', f.name);
    go.appendChild(el('span', 'fename', f.name)); go.appendChild(el('span', 'fetype', f.cls.replace(/^T/, '').replace(/Field$/, '')));
    box.appendChild(go);
    box.appendChild(labelled('Label', textInput(cf.fieldLabel || '', function (v) { post({ type: 'setProp', name: f.name, prop: 'DisplayLabel', value: v }); })));
    box.appendChild(labelled('Display width', textInput(cf.fieldWidth !== undefined ? cf.fieldWidth : '', function (v) { if (v !== '') { post({ type: 'setProp', name: f.name, prop: 'DisplayWidth', value: Number(v) }); } }, 'number')));
    box.appendChild(el('div', 'hint', 'The label and the width are properties of the field (DisplayLabel, DisplayWidth): the column shows them when it has no caption of its own.'));
  }
  function dataFieldFields(box, n) {
    var dp = n.dataProps || {};
    var l = n.cls.toLowerCase();
    box.appendChild(labelled('Field', textInput(n.dataField || '', setter(n, 'FieldName'))));
    box.appendChild(labelled('Label', textInput(dp.DisplayLabel || '', setter(n, 'DisplayLabel'))));
    var g = el('div', 'g2');
    if (dp.Size !== undefined || l.indexOf('string') >= 0) { g.appendChild(labelled('Size', textInput(dp.Size || '', function (v) { post({ type: 'setProp', name: n.name, prop: 'Size', value: Number(v) }); }, 'number'))); }
    g.appendChild(labelled('Display width', textInput(dp.DisplayWidth || '', function (v) { post({ type: 'setProp', name: n.name, prop: 'DisplayWidth', value: Number(v) }); }, 'number')));
    box.appendChild(g);
    box.appendChild(checkbox('Required', n.props['Required'] === 'True', setter(n, 'Required')));
    box.appendChild(checkbox('Read only', n.props['ReadOnly'] === 'True', setter(n, 'ReadOnly')));
    box.appendChild(checkbox('Visible', n.visible, setter(n, 'Visible')));
    var users = n.fieldUsers || [];
    if (users.length) {
      box.appendChild(el('div', 'fehead', 'Shown by (' + users.length + ')'));
      users.forEach(function (u) { if (byName[u]) { box.appendChild(fieldRow(byName[u], byName[u].caption || columnTitle(byName[u]), byName[u].cls)); } });
    }
    box.appendChild(el('div', 'hint', 'A field of its dataset (listed under it): events OnGetText, OnSetText, OnChange, OnValidate.'));
  }
  /* Menus: the items of a TPopupMenu / TMainMenu and the sub-items of an item, as the menu shows them. */
  function menuShown(c) {
    var s = String(c || ''), out = '', i = 0;
    while (i < s.length) {
      if (s.charAt(i) === '&') { if (s.charAt(i + 1) === '&') { out += '&'; i += 2; } else { i++; } continue; }
      out += s.charAt(i); i++;
    }
    return out;
  }
  function menuBar(b, n) {
    var bar = el('div', 'febar');
    var add = el('button', '', '＋ Add ' + (n.cls === 'TMenuItem' ? 'sub-item' : 'item')); add.title = 'A new menu item here: change its caption in the inspector afterwards';
    add.addEventListener('click', function () { post({ type: 'add', className: 'TMenuItem', parent: n.name, left: 0, top: 0 }); });
    var sep = el('button', '', '＋ Separator'); sep.title = 'A line between two items (an item whose Caption is -)';
    sep.addEventListener('click', function () { post({ type: 'add', className: 'TMenuItem', parent: n.name, left: 0, top: 0, caption: '-' }); });
    bar.appendChild(add); bar.appendChild(sep); b.appendChild(bar);
  }
  function menuPreview(b, n) {
    var box = el('div', 'mprev');
    var rows = 0;
    var walk = function (item, depth) {
      item.children.forEach(function (c) {
        if (kind(c.cls) !== 'menuitem') { return; }
        rows++;
        if (c.caption === '-') { var line = el('div', 'msep'); line.style.marginLeft = (depth * 14 + 4) + 'px'; box.appendChild(line); return; }
        var r = el('div', 'mrow' + (c.enabled ? '' : ' off') + (c.visible ? '' : ' hid') + (state.sel.indexOf(c.name) >= 0 ? ' sel' : ''));
        r.setAttribute('data-pick', c.name); r.style.paddingLeft = (depth * 14 + 4) + 'px'; r.title = c.name + (c.visible ? '' : ' (not visible)') + (c.enabled ? '' : ' (disabled)');
        r.appendChild(el('span', 'mchk', c.props['RadioItem'] === 'True' && c.props['Checked'] === 'True' ? '●' : (c.props['Checked'] === 'True' ? '✓' : '')));
        r.appendChild(el('span', 'mcap', menuShown(c.caption !== undefined ? c.caption : c.name)));
        r.appendChild(el('span', 'msc', c.shortcut || ''));
        r.appendChild(el('span', 'msub', c.children.some(function (k) { return kind(k.cls) === 'menuitem'; }) ? '▸' : ''));
        box.appendChild(r);
        walk(c, depth + 1);
      });
    };
    walk(n, 0);
    if (!rows) { box.appendChild(el('div', 'hint', 'No item yet: add one above, or pick TMenuItem in the palette (System) while the menu is selected.')); }
    b.appendChild(el('div', 'fehead', 'Preview'));
    b.appendChild(box);
  }
  function menuItemFields(box, n) {
    box.appendChild(labelled('Caption', textInput(n.props['Caption'] !== undefined ? n.caption : '', setter(n, 'Caption'))));
    box.appendChild(el('div', 'hint', 'An & marks the access key; a caption of - makes a separator.'));
    if (n.caption === '-') { return; }
    var sc = textInput(n.shortcut || '', setter(n, 'ShortCut')); sc.placeholder = 'Ctrl+O, Ctrl+Shift+S, F5…'; sc.title = 'Written as the IDE does: a number in the .dfm';
    box.appendChild(labelled('Shortcut', sc));
    box.appendChild(labelled('Image', textInput(n.props['ImageIndex'] !== undefined ? Number(n.props['ImageIndex']) : -1, function (v) { post({ type: 'setProp', name: n.name, prop: 'ImageIndex', value: Number(v) }); }, 'number')));
    var flags = el('div', 'g2');
    flags.appendChild(checkbox('Checked', n.props['Checked'] === 'True', setter(n, 'Checked')));
    flags.appendChild(checkbox('AutoCheck', n.props['AutoCheck'] === 'True', setter(n, 'AutoCheck')));
    flags.appendChild(checkbox('RadioItem', n.props['RadioItem'] === 'True', setter(n, 'RadioItem')));
    flags.appendChild(checkbox('Default', n.props['Default'] === 'True', setter(n, 'Default')));
    flags.appendChild(checkbox('Enabled', n.props['Enabled'] !== 'False', setter(n, 'Enabled')));
    flags.appendChild(checkbox('Visible', n.props['Visible'] !== 'False', setter(n, 'Visible')));
    box.appendChild(flags);
    menuBar(box, n);
    menuPreview(box, n);
  }
  /* A bar of a bar manager (where it docks, its items) and an item of a bar (caption, shown or not). */
  function barFields(box, n) {
    if (kind(n.cls) === 'bar') {
      box.appendChild(labelled('Caption', textInput(n.props['Caption'] !== undefined ? n.caption : '', setter(n, 'Caption'))));
      box.appendChild(linkSelect(n, 'DockControl', 'Dock control', function (c) { return kind(c.cls) === 'dock'; }));
      box.appendChild(checkbox('Visible', n.props['Visible'] !== 'False', setter(n, 'Visible')));
      var items = n.barItems || [];
      box.appendChild(el('div', 'fehead', 'Items (' + items.length + ')'));
      items.forEach(function (it) {
        if (byName[it.name]) { box.appendChild(fieldRow(byName[it.name], (it.beginGroup ? '| ' : '') + (it.caption || it.name) + (it.visible ? '' : ' (hidden)'), it.cls)); }
        else { box.appendChild(el('div', 'hint', it.name + ' : ' + it.cls)); }
      });
      if (!items.length) { box.appendChild(el('div', 'hint', 'No item linked: the items of a bar are its ItemLinks.')); }
      box.appendChild(el('div', 'hint', 'The bar shows in the dock control it is linked to; a bar with none is not drawn.'));
      return;
    }
    box.appendChild(labelled('Caption', textInput(n.props['Caption'] !== undefined ? n.caption : '', setter(n, 'Caption'))));
    box.appendChild(labelled('Hint', textInput(n.props['Hint'] !== undefined ? fromDfmText(n.props['Hint']) : '', setter(n, 'Hint'))));
    if (/static$/i.test(n.cls)) { box.appendChild(labelled('Width', textInput(n.props['Width'] !== undefined ? Number(n.props['Width']) : '', function (v) { if (v !== '') { post({ type: 'setProp', name: n.name, prop: 'Width', value: Number(v) }); } }, 'number'))); }
    box.appendChild(labelled('Image', textInput(n.props['ImageIndex'] !== undefined ? Number(n.props['ImageIndex']) : -1, function (v) { post({ type: 'setProp', name: n.name, prop: 'ImageIndex', value: Number(v) }); }, 'number')));
    box.appendChild(checkbox('Shown (ivAlways)', n.props['Visible'] !== 'ivNever', setter(n, 'Visible')));
    box.appendChild(el('div', 'hint', 'A bar item shows where a bar links it (ItemLinks); its click handler is in Events.'));
  }
  function fromDfmText(v) { var s = String(v); return s.charAt(0) === String.fromCharCode(39) && s.charAt(s.length - 1) === String.fromCharCode(39) ? s.slice(1, -1) : s; }
  function partFields(box, n) {
    var k = kind(n.cls);
    if (k === 'series' || k === 'charttool') { seriesFields(box, n); } else if (k === 'bar' || k === 'baritem') { barFields(box, n); } else if (k === 'menuitem') { menuItemFields(box, n); } else if (k === 'tile' || k === 'tilegroup') { tileFields(box, n); } else if (k === 'datafield') { dataFieldFields(box, n); } else { gridFields(box, n); }
  }
  /* Link to another component: a select of the components of a kind, the current one first. */
  function linkSelect(n, prop, label, wanted) {
    var sel = el('select');
    var none = el('option', '', '(none)'); none.value = ''; sel.appendChild(none);
    allNodes().forEach(function (c) { if (wanted(c)) { var o = el('option', '', c.name + ' : ' + c.cls); o.value = c.name; sel.appendChild(o); } });
    var cur = n.props[prop] || '';
    if (cur && !byName[cur]) { var o2 = el('option', '', cur + ' (not on this form)'); o2.value = cur; sel.appendChild(o2); }
    sel.value = cur;
    sel.addEventListener('change', function () { post({ type: 'setProp', name: n.name, prop: prop, value: sel.value }); });
    return labelled(label, sel);
  }
  function isConnectionNode(c) { return c.cls.toLowerCase().slice(-10) === 'connection'; }
  /* Connections, datasets and data sources: provider and server, the connection, the table, the SQL. */
  function dataFields(box, n) {
    var l = n.cls.toLowerCase();
    var isConn = isConnectionNode(n);
    var usesConn = !!n.dataset || /^tuni(sql|script|transaction|metadata|dump|loader|alerter)$/.test(l);
    var hasSqlBox = n.sql !== undefined || l.slice(-5) === 'query' || l === 'tunisql' || l === 'tuniscript';
    var isSource = l.slice(-10) === 'datasource';
    if (!isConn && !usesConn && !hasSqlBox && !isSource) { return; }
    section(box, isConn ? 'Database' : (isSource ? 'Data source' : 'Data'), 'data', function (b) {
      var dp = n.dataProps || {};
      if (isConn) {
        var ps = el('select');
        var names = DB_PROVIDERS.slice();
        if (dp.ProviderName && names.indexOf(dp.ProviderName) < 0) { names.unshift(dp.ProviderName); }
        var blank = el('option', '', '(not set)'); blank.value = ''; ps.appendChild(blank);
        names.forEach(function (p) { var o = el('option', '', p); o.value = p; ps.appendChild(o); });
        ps.value = dp.ProviderName || '';
        ps.addEventListener('change', function () { if (ps.value) { post({ type: 'setProp', name: n.name, prop: 'ProviderName', value: ps.value }); } });
        b.appendChild(labelled('Provider', ps));
        b.appendChild(labelled('Server', textInput(dp.Server || '', setter(n, 'Server'))));
        b.appendChild(labelled('Database', textInput(dp.Database || '', setter(n, 'Database'))));
        var g = el('div', 'g2');
        g.appendChild(labelled('User', textInput(dp.Username || '', setter(n, 'Username'))));
        g.appendChild(labelled('Port', textInput(dp.Port || '', function (v) { if (v !== '') { post({ type: 'setProp', name: n.name, prop: 'Port', value: Number(v) }); } }, 'number')));
        b.appendChild(g);
        b.appendChild(checkbox('Login prompt', n.props['LoginPrompt'] === 'True', setter(n, 'LoginPrompt')));
        b.appendChild(el('div', 'hint', 'The password and Connected are not edited here: they stay as written in the .dfm.'));
      }
      if (usesConn) { b.appendChild(linkSelect(n, 'Connection', 'Connection', isConnectionNode)); }
      if (isSource) { b.appendChild(linkSelect(n, 'DataSet', 'Dataset', function (c) { return !!c.dataset; })); }
      if (n.dataset && l.slice(-5) === 'table') { b.appendChild(labelled('Table', textInput(dp.TableName || '', setter(n, 'TableName')))); }
      if (hasSqlBox) {
        var nl = String.fromCharCode(10);
        var ta = el('textarea', 'sqlbox'); ta.spellcheck = false; ta.rows = 7;
        ta.value = (n.sql || []).join(nl);
        ta.placeholder = 'select ...';
        b.appendChild(labelled('SQL', ta));
        var apply = el('button', '', 'Apply SQL'); apply.title = 'Write these lines as SQL.Strings of the .dfm';
        apply.addEventListener('click', function () {
          var lines = ta.value.split(nl);
          while (lines.length && lines[lines.length - 1].trim() === '') { lines.pop(); }
          post({ type: 'setSql', name: n.name, lines: lines });
        });
        b.appendChild(apply);
      }
      if (n.dataset) { fieldsEditor(b, n); }
    });
  }
  /* Name of the handler the IDE would create: Button1 + OnClick = Button1Click, cxEdit1 + Properties.OnChange = cxEdit1PropertiesChange. */
  function previewHandler(name, ev) {
    var s = ev.split('.On').join('.');
    if (s.indexOf('On') === 0) { s = s.slice(2); }
    return name + s.split('.').join('');
  }
  /* The events of the class in ONE drop-down: a free one gets its handler (the code stays closed unless asked), a wired one opens it. */
  function eventsList(box, n) {
    var names = n.eventNames.slice();
    Object.keys(n.events).forEach(function (e0) { if (names.indexOf(e0) < 0) { names.push(e0); } });
    var free = names.filter(function (e) { return !n.events[e]; });
    var wired = names.filter(function (e) { return !!n.events[e]; });
    var sel = el('select', 'evsel');
    sel.title = 'Events of this component: pick a free one to create its handler, a wired one to open it';
    var first = el('option', '', free.length ? '＋ Add an event handler…' : (wired.length ? 'Every known event is wired' : 'No event known for this class'));
    first.value = ''; sel.appendChild(first);
    if (free.length) {
      var g1 = el('optgroup'); g1.label = 'Create a handler';
      free.forEach(function (e1) { var o = el('option', '', e1 + '  →  ' + previewHandler(n.name, e1)); o.value = 'new:' + e1; g1.appendChild(o); });
      sel.appendChild(g1);
    }
    if (wired.length) {
      var g2 = el('optgroup'); g2.label = 'Open the code of';
      wired.forEach(function (e2) { var o = el('option', '', '● ' + e2 + '  →  ' + n.events[e2]); o.value = 'open:' + e2; g2.appendChild(o); });
      sel.appendChild(g2);
    }
    var other = el('option', '', 'Other event…'); other.value = 'other'; sel.appendChild(other);
    box.appendChild(sel);
    box.appendChild(checkbox('open the code after creating', state.openAfter, function (v) { state.openAfter = v; saveUi(); }));
    var row = el('div', 'row'); row.style.display = 'none';
    var inp = el('input'); inp.type = 'text'; inp.placeholder = 'OnMouseEnter, Properties.OnChange…';
    var create = function () {
      var v = inp.value.trim();
      if (v) { post({ type: 'addEvent', name: n.name, event: v, open: state.openAfter }); inp.value = ''; row.style.display = 'none'; }
    };
    inp.addEventListener('keydown', function (e3) { if (e3.key === 'Enter') { create(); } });
    var add = el('button', '', '＋'); add.title = 'Create a handler for this event'; add.addEventListener('click', create);
    row.appendChild(inp); row.appendChild(add); box.appendChild(row);
    sel.addEventListener('change', function () {
      var v = sel.value; sel.value = '';
      if (v.indexOf('new:') === 0) { post({ type: 'addEvent', name: n.name, event: v.slice(4), open: state.openAfter }); }
      else if (v.indexOf('open:') === 0) { post({ type: 'open', name: n.name, event: v.slice(5) }); }
      else if (v === 'other') { row.style.display = 'flex'; inp.focus(); }
    });
    wired.forEach(function (e4) {
      var r = el('div', 'evrow wired'); r.setAttribute('data-event', e4);
      r.appendChild(el('span', 'dot', '●')); r.appendChild(el('span', 'evn', e4)); r.appendChild(el('span', 'evh', n.events[e4]));
      r.title = 'Open ' + n.events[e4] + ' in the code';
      var fb = el('span', 'evgo evform', '🗗'); fb.title = 'The form this handler opens (followed through the methods it calls): open its designer';
      r.appendChild(fb);
      r.addEventListener('click', function (ev) {
        if (ev.target === fb) { post({ type: 'handlerForms', name: n.name, event: e4 }); return; }
        post({ type: 'open', name: n.name, event: e4 });
      });
      box.appendChild(r);
    });
  }
  function formInfo(box) {
    var root = state.model.root;
    var card = el('div', 'icard');
    card.appendChild(el('span', 'ico big', '🗔'));
    var meta = el('div', 'meta');
    meta.appendChild(el('div', 'iname', root.name));
    meta.appendChild(el('div', 'sub', root.cls + ' · ' + (Object.keys(byName).length - 1) + ' component(s)'));
    card.appendChild(meta); box.appendChild(card);
    box.appendChild(el('h4', '', 'How to'));
    var ul = el('ul', 'tips');
    ['Click a component to select it; Shift / Ctrl + click adds to the selection; drag a rectangle to select several.',
      'Drag to move, use the handles to resize; drop on a container to change its parent.',
      'Palette: click a component, then click or draw on the form.',
      'Double-click a component for its default handler; the Events list of the inspector creates any other.',
      'The align icons of the toolbar need two components selected.',
      'Esc selects the parent · Delete removes · Ctrl+K Ctrl+B switches to the code.'].forEach(function (t) { ul.appendChild(el('li', '', t)); });
    box.appendChild(ul);
  }
  /* The properties the selected components have in common: a value shown when they all agree, blank when they differ; a change goes to every one of them. */
  function msend(items) { if (items.length) { post({ type: 'setProps', items: items }); } }
  function mput(list, prop, value) { msend(list.map(function (n) { return { name: n.name, prop: prop, value: value }; })); }
  function same(list, get) {
    var first = get(list[0]);
    for (var i = 1; i < list.length; i++) { if (get(list[i]) !== first) { return { mixed: true }; } }
    return { mixed: false, value: first };
  }
  function mnum(list, prop, get) {
    var s = same(list, get);
    var i = el('input'); i.type = 'number'; i.value = s.mixed || s.value === undefined ? '' : s.value;
    if (s.mixed) { i.placeholder = 'mixed'; }
    i.addEventListener('change', function () { if (i.value !== '') { mput(list, prop, Number(i.value)); } });
    return i;
  }
  function mcheck(label, list, get, prop) {
    var s = same(list, get);
    var l = el('label', 'chk'); var c = el('input'); c.type = 'checkbox'; c.checked = !s.mixed && !!s.value; c.indeterminate = s.mixed;
    c.addEventListener('change', function () { mput(list, prop, c.checked); });
    l.appendChild(c); l.appendChild(document.createTextNode(' ' + label + (s.mixed ? ' (mixed)' : '')));
    return l;
  }
  function mcolor(label, list, prop, get) {
    var s = same(list, get);
    var row = el('div', 'colorrow');
    var pick = el('input'); pick.type = 'color'; pick.value = !s.mixed && s.value ? s.value : '#ffffff'; pick.title = label;
    if (s.mixed || !s.value) { pick.classList.add('auto'); }
    pick.addEventListener('change', function () { mput(list, prop, pick.value); });
    row.appendChild(pick); row.appendChild(el('span', 'colortxt', s.mixed ? 'mixed' : (s.value || 'automatic')));
    var clr = el('button', 'colorclr', 'Clear'); clr.title = 'Remove ' + prop + ' from each of them';
    clr.addEventListener('click', function () { mput(list, prop, ''); });
    row.appendChild(clr);
    return labelled(label, row);
  }
  function commonProps(box) {
    var all = state.sel.map(function (n) { return byName[n]; }).filter(function (n) { return n && !n.fixed; });
    if (all.length < 2) { return; }
    var shown = all.filter(function (n) { return !n.nonVisual; });
    var rawNum = function (p) { return function (n) { return n.props[p] !== undefined ? Number(n.props[p]) : (p === 'Left' ? n.x : p === 'Top' ? n.y : p === 'Width' ? n.w : n.h); }; };
    section(box, 'Common properties', 'multi', function (b) {
      var free = all.filter(function (n) { return !n.docked; });
      var g = el('div', 'g2');
      if (free.length) { g.appendChild(labelled('Left', mnum(free, 'Left', rawNum('Left')))); g.appendChild(labelled('Top', mnum(free, 'Top', rawNum('Top')))); }
      var wide = shown.filter(function (n) { return !n.docked || n.align === 'alLeft' || n.align === 'alRight'; });
      var high = shown.filter(function (n) { return !n.docked || n.align === 'alTop' || n.align === 'alBottom'; });
      if (wide.length) { g.appendChild(labelled('Width', mnum(wide, 'Width', rawNum('Width')))); }
      if (high.length) { g.appendChild(labelled('Height', mnum(high, 'Height', rawNum('Height')))); }
      b.appendChild(g);
      if (!shown.length) { return; }
      var al = el('select'); var s = same(shown, function (n) { return n.props['Align'] || 'alNone'; });
      if (s.mixed) { var mo = el('option', '', '(mixed)'); mo.value = ''; al.appendChild(mo); }
      ['alNone', 'alTop', 'alBottom', 'alLeft', 'alRight', 'alClient'].forEach(function (a) { var o = el('option', '', a); o.value = a; al.appendChild(o); });
      al.value = s.mixed ? '' : s.value;
      al.addEventListener('change', function () { if (al.value) { mput(shown, 'Align', al.value); } });
      b.appendChild(labelled('Align', al));
      var ar = el('div', 'anch'); ar.appendChild(el('span', '', 'Anchors'));
      ['Left', 'Top', 'Right', 'Bottom'].forEach(function (a) {
        var st = same(shown, function (n) { return n.anchors.indexOf('ak' + a) >= 0; });
        var l = el('label'); var c = el('input'); c.type = 'checkbox'; c.checked = !st.mixed && !!st.value; c.indeterminate = st.mixed;
        c.addEventListener('change', function () {
          msend(shown.map(function (n) {
            var set = ['Left', 'Top', 'Right', 'Bottom'].filter(function (x) { return x === a ? c.checked : n.anchors.indexOf('ak' + x) >= 0; }).map(function (x) { return 'ak' + x; });
            return { name: n.name, prop: 'Anchors', value: '[' + set.join(', ') + ']' };
          }));
        });
        l.appendChild(c); l.appendChild(document.createTextNode(a.charAt(0))); l.title = 'ak' + a + (st.mixed ? ' (mixed)' : ''); ar.appendChild(l);
      });
      b.appendChild(ar);
      b.appendChild(mcheck('Visible', shown, function (n) { return n.visible; }, 'Visible'));
      b.appendChild(mcheck('Enabled', shown, function (n) { return n.enabled; }, 'Enabled'));
      var colored = shown.filter(function (n) { var k2 = kind(n.cls); return k2 !== 'tile' && k2 !== 'tilecontrol'; });
      if (colored.length) {
        b.appendChild(mcolor('Color', colored, 'Color', function (n) { return n.color; }));
        b.appendChild(mcolor('Font color', colored, 'Font.Color', function (n) { return n.fontColor; }));
      }
      var hinted = shown.filter(function (n) { return n.props['Hint'] !== undefined || kind(n.cls) !== 'generic'; });
      if (hinted.length) {
        var hs = same(hinted, function (n) { return n.props['Hint'] === undefined ? '' : n.props['Hint']; });
        var hi = el('input'); hi.type = 'text'; hi.value = hs.mixed ? '' : hs.value; if (hs.mixed) { hi.placeholder = 'mixed'; }
        hi.addEventListener('change', function () { mput(hinted, 'Hint', hi.value); });
        b.appendChild(labelled('Hint', hi));
      }
      b.appendChild(el('div', 'hint', 'A change goes to the ' + all.length + ' selected components; a blank or mixed field is left alone until you change it.'));
    });
  }
  function multiInfo(box) {
    var card = el('div', 'icard');
    card.appendChild(el('span', 'ico big', '⧉'));
    var meta = el('div', 'meta');
    meta.appendChild(el('div', 'iname', state.sel.length + ' components'));
    meta.appendChild(el('div', 'sub', 'Edit what they share below, or use the align icons of the toolbar'));
    card.appendChild(meta); box.appendChild(card);
    commonProps(box);
    box.appendChild(el('h4', '', 'Selected'));
    state.sel.forEach(function (name) {
      var r = el('div', 'colrow', (byName[name] ? iconOf(byName[name]) + ' ' : '') + name);
      r.setAttribute('data-pick', name);
      box.appendChild(r);
    });
  }
  function renderInspector() {
    var box = $('inspector'); while (box.firstChild) { box.removeChild(box.firstChild); }
    if (!state.model) { return; }
    if (state.sel.length === 0) { formInfo(box); return; }
    if (state.sel.length > 1) { multiInfo(box); return; }
    var n = byName[state.sel[0]];
    var k = kind(n.cls);
    var fixed = !!n.fixed;
    var card = el('div', 'icard');
    card.appendChild(el('span', 'ico big', iconOf(n)));
    var meta = el('div', 'meta');
    meta.appendChild(el('div', 'iname', n.name));
    var sub = el('div', 'sub', n.cls);
    if (n.family && FAMILY[n.family]) { sub.appendChild(el('span', 'fam-tag ' + FAMILY[n.family].cls, FAMILY[n.family].label)); }
    meta.appendChild(sub); card.appendChild(meta); box.appendChild(card);
    var crumbs = el('div', 'crumbs');
    pathOf(n.name).forEach(function (p, i, arr) {
      if (i) { crumbs.appendChild(document.createTextNode(' › ')); }
      var c = el('span', 'crumb' + (i === arr.length - 1 ? ' cur' : ''), p);
      if (i < arr.length - 1) { c.setAttribute('data-crumb', p); c.title = 'Select ' + p; }
      crumbs.appendChild(c);
    });
    box.appendChild(crumbs);
    box.appendChild(labelled('Name', textInput(n.name, function (v) { post({ type: 'rename', from: n.name, to: v.trim() }); })));
    if (!fixed) {
      var psel = el('select');
      var rn0 = rootName();
      var popt = el('option', '', rn0 + ' (form)'); popt.value = rn0; psel.appendChild(popt);
      allNodes().forEach(function (c) {
        if (!c.container || c.name === n.name || !canDropInto([n.name], c.name)) { return; }
        var o = el('option', '', new Array(c.depth).join('· ') + c.name + ' : ' + c.cls); o.value = c.name; psel.appendChild(o);
      });
      psel.value = parentOf[n.name];
      psel.title = 'Move into another container (keeps the position on screen)';
      psel.addEventListener('change', function () { moveToParent(n.name, psel.value); });
      box.appendChild(labelled('Parent', psel));
    }
    if (fixed) {
      section(box, PART_TITLES[k] || 'Part', 'part', function (b) { partFields(b, n); });
    } else {
      section(box, n.nonVisual ? 'Position on the form' : 'Position & size', 'pos', function (b) {
        var g = el('div', 'g2');
        var num = function (prop, label, v) { g.appendChild(labelled(label, textInput(v, function (val) { post({ type: 'setProp', name: n.name, prop: prop, value: Number(val) }); }, 'number'))); };
        var rawNum = function (p) { return n.props[p] !== undefined ? Number(n.props[p]) : undefined; };
        if (!n.docked) { num('Left', 'Left', rawNum('Left') !== undefined ? rawNum('Left') : n.x); num('Top', 'Top', rawNum('Top') !== undefined ? rawNum('Top') : n.y); }
        // a non-visual component (connection, query, timer…) has only the place where its icon sits at design time
        if (n.nonVisual) { b.appendChild(g); b.appendChild(el('div', 'hint', 'Non-visual: it has no size, only a design-time position.')); return; }
        if (!n.docked || n.align === 'alLeft' || n.align === 'alRight') { num('Width', 'Width', rawNum('Width') !== undefined ? rawNum('Width') : n.w); }
        if (!n.docked || n.align === 'alTop' || n.align === 'alBottom') { num('Height', 'Height', rawNum('Height') !== undefined ? rawNum('Height') : n.h); }
        b.appendChild(g);
        var al = el('select');
        ['alNone', 'alTop', 'alBottom', 'alLeft', 'alRight', 'alClient'].forEach(function (a) { var o = el('option', '', a); o.value = a; if ((n.props['Align'] || 'alNone') === a) { o.selected = true; } al.appendChild(o); });
        al.addEventListener('change', function () { post({ type: 'setProp', name: n.name, prop: 'Align', value: al.value }); });
        b.appendChild(labelled('Align', al));
        var ar = el('div', 'anch'); ar.appendChild(el('span', '', 'Anchors'));
        ['Left', 'Top', 'Right', 'Bottom'].forEach(function (a) {
          var l = el('label'); var c = el('input'); c.type = 'checkbox'; c.checked = n.anchors.indexOf('ak' + a) >= 0;
          c.addEventListener('change', function () {
            var set = ['Left', 'Top', 'Right', 'Bottom'].filter(function (x) { return x === a ? c.checked : n.anchors.indexOf('ak' + x) >= 0; }).map(function (x) { return 'ak' + x; });
            post({ type: 'setProp', name: n.name, prop: 'Anchors', value: '[' + set.join(', ') + ']' });
          });
          l.appendChild(c); l.appendChild(document.createTextNode(a.charAt(0))); l.title = 'ak' + a; ar.appendChild(l);
        });
        b.appendChild(ar);
      });
      dataFields(box, n);
      if (k === 'chart') { chartFields(box, n); }
      if (k === 'menu') { section(box, 'Menu', 'menu', function (b) { menuBar(b, n); menuPreview(b, n); }); }
      var hasCap = n.caption !== undefined || ['button', 'label', 'check', 'radio', 'panel', 'group', 'sheet', 'statusbar'].indexOf(k) >= 0;
      var hasText = n.text !== undefined || ['edit', 'combo'].indexOf(k) >= 0;
      if (hasCap || hasText) {
        section(box, 'Content', 'content', function (b) {
          if (hasCap) {
            // a caption can run over several lines (Enter = a new line, written as #13#10); Word wrap breaks the long lines too
            var ta = el('textarea', 'capbox'); ta.rows = (n.caption || '').split(String.fromCharCode(10)).length > 1 || n.wrap ? 3 : 2; ta.spellcheck = false;
            ta.value = n.caption === undefined ? '' : n.caption;
            ta.title = 'Enter makes a new line; click elsewhere to apply';
            ta.addEventListener('change', function () { post({ type: 'setProp', name: n.name, prop: 'Caption', value: ta.value }); });
            b.appendChild(labelled('Caption', ta));
            if (n.wrapProp) { b.appendChild(checkbox('Word wrap', n.wrap === true, setter(n, n.wrapProp))); }
          }
          if (hasText) { b.appendChild(labelled('Text', textInput(n.text, setter(n, 'Text')))); }
        });
      }
      if (n.cls.toLowerCase() === 'tdxbardockcontrol') {
        section(box, 'Bars', 'bars', function (b) {
          b.appendChild(linkSelect(n, 'BarManager', 'Bar manager', function (c) { return c.cls.toLowerCase() === 'tdxbarmanager'; }));
          b.appendChild(el('div', 'hint', 'The bars docked here are the ones of the bar manager (its Bars, DockControl of each bar).'));
        });
      }
      if (!n.nonVisual && k !== 'tile' && k !== 'tilecontrol') {
        section(box, 'Colors', 'colors', function (b) {
          b.appendChild(colorRow(n, 'Color', 'Color', n.color, n.colorFrom));
          b.appendChild(colorRow(n, 'Font color', 'Font.Color', n.fontColor, n.fontFrom));
          if (n.colorFrom && n.colorFrom.indexOf('Style') === 0 && n.colorFrom !== 'Style.Color') { b.appendChild(el('div', 'hint', 'The style wins over Color: change the colour in the style (' + n.colorFrom.slice(8) + '), or unlink the style.')); }
        });
      }
      if (!n.nonVisual) section(box, 'State', 'state', function (b) {
        b.appendChild(checkbox('Visible', n.visible, setter(n, 'Visible')));
        b.appendChild(checkbox('Enabled', n.enabled, setter(n, 'Enabled')));
        if (n.tab !== undefined) { b.appendChild(labelled('TabOrder', textInput(n.tab, function (v) { post({ type: 'setProp', name: n.name, prop: 'TabOrder', value: Number(v) }); }, 'number'))); }
      });
    }
    if (k === 'generic' && !n.nonVisual) {
      box.appendChild(el('div', 'hint', 'This class is not recognised by the designer. It is drawn as a placeholder; only its name, position, size, alignment and visibility are offered here. Every other property stays exactly as written in the .dfm.'));
    }
    if (k === 'tilecontrol') { box.appendChild(el('div', 'hint', 'Add tiles and groups with the palette (type DevExpress) while this control is selected; its detail pages go here too.')); }
    if (n.cls === 'TcxGrid') { box.appendChild(el('div', 'hint', 'Add levels, views and columns with the palette (type DevExpress) while this grid is selected. The columns of the view its first level shows are drawn in its header.')); }
    var held = hostsOf(n.name);
    if (held.length) {
      section(box, 'Hosted form', 'hosted', function (b) {
        held.forEach(function (h) {
          var r = el('div', 'colrow ferow'); r.title = 'Open the designer of ' + (h.className || h.formArg);
          r.appendChild(el('span', 'fename', (h.className || '?') + '  ←  ' + h.formArg)); r.appendChild(el('span', 'fetype', '🗗 open'));
          r.addEventListener('click', function () { post({ type: 'openHostedForm', cls: h.className || '', arg: h.formArg }); });
          b.appendChild(r);
        });
        b.appendChild(el('div', 'hint', 'The unit puts a form in this container (the helpers are the setting ce.delphi.hostCalls, or Form.Parent := ...).'));
      });
    }
    section(box, 'Events', 'events', function (b) { eventsList(b, n); });
    var del = el('button', 'danger', '🗑 Delete ' + n.name);
    del.addEventListener('click', function () { post({ type: 'delete', names: [n.name] }); });
    box.appendChild(del);
  }
  function renderStatus() {
    var m = state.model; if (!m) { return; }
    var count = Object.keys(byName).length - 1;
    var s = m.root.name + ' · ' + count + ' component(s)';
    if (state.sel.length === 1) { var n = byName[state.sel[0]]; s += ' · ' + pathOf(n.name).join(' › ') + ' (' + n.x + ', ' + n.y + ') ' + n.w + '×' + n.h + (n.align ? ' · ' + n.align : ''); }
    else if (state.sel.length > 1) { s += ' · ' + state.sel.length + ' selected'; }
    if (state.tool) { s += ' · tool: ' + state.tool + (state.palHost[state.tool] ? ' — click ' + HOST_LABEL[state.palHost[state.tool]] + ' on the form' : '') + ' (Esc to cancel)'; }
    $('status').textContent = state.notice ? state.notice : s;
  }

  /* ───────── parents: see where a component lives, and move it somewhere else ───────── */
  var DEPTH_COLORS = ['#e8590c', '#2f9e44', '#9c36b6', '#1971c2', '#f08c00', '#0c8599'];
  function rootName() { return state.model.root.name; }
  function pathOf(name) { var p = [], c = name; while (c) { p.unshift(c); c = parentOf[c]; } return p; }
  function areaOf(name) {
    if (name === rootName()) { return { x: 0, y: 0, w: state.model.width, h: state.model.height }; }
    // a part that is not painted (grid view, hidden column…) is located by the nearest ancestor that is
    var guard = 0;
    while (name && guard++ < 20) {
      if (name === rootName()) { return { x: 0, y: 0, w: state.model.width, h: state.model.height }; }
      var e = els[name];
      if (e && e.offsetParent !== null) { return relRect(e); }
      name = parentOf[name];
    }
    return null;
  }
  function placeBox(cls, r, color) {
    var b = el('div', cls);
    b.style.left = r.x + 'px'; b.style.top = r.y + 'px'; b.style.width = r.w + 'px'; b.style.height = r.h + 'px';
    if (color) { b.style.borderColor = color; }
    return b;
  }
  /* Optional outline + name tag of every container, coloured by depth, and always the parent of the selection. */
  function drawParents(o) {
    var rn = rootName();
    if (state.showParents) {
      Object.keys(byName).forEach(function (name) {
        var n = byName[name];
        if (name === rn || !n.container) { return; }
        var r = areaOf(name);
        if (!r) { return; }
        var c = DEPTH_COLORS[(n.depth - 1) % DEPTH_COLORS.length];
        o.appendChild(placeBox('cbox', r, c));
        var t = el('div', 'ctag', name);
        t.style.background = c; t.style.left = r.x + 'px'; t.style.top = Math.max(0, r.y - 12) + 'px';
        o.appendChild(t);
      });
    }
    var prim = state.sel[state.sel.length - 1];
    if (!prim || !byName[prim] || !parentOf[prim]) { return; }
    var pn = parentOf[prim];
    var pr = areaOf(pn);
    if (!pr) { return; }
    o.appendChild(placeBox('pbox', pr));
    var pl = el('div', 'plabel', '⬑ parent: ' + pn + (pn === rn ? ' (form)' : ' : ' + byName[pn].cls));
    pl.style.left = pr.x + 'px'; pl.style.top = (pr.y >= 18 ? pr.y - 18 : pr.y + 2) + 'px';
    o.appendChild(pl);
  }
  /* The container under the pointer is outlined and named while no drag is going on. */
  function updateHover(ev) {
    if (!state.model || drag) { return; }
    var t = ev.target, name = null;
    if (t.closest && t.closest('#client')) { var c = t.closest('.ctl.cont'); name = c ? c.getAttribute('data-name') : rootName(); }
    if (name === state.hover) { return; }
    state.hover = name; drawHover();
  }
  function drawHover() {
    var h = $('hov');
    if (!h) { return; }
    while (h.firstChild) { h.removeChild(h.firstChild); }
    var n = state.hover;
    if (!n || !byName[n] || n === rootName()) { return; }
    var r = areaOf(n);
    if (!r) { return; }
    h.appendChild(placeBox('hbox', r));
    var t = el('div', 'htag', n + ' : ' + byName[n].cls);
    t.style.left = r.x + 'px'; t.style.top = (r.y >= 14 ? r.y - 14 : r.y + 2) + 'px';
    h.appendChild(t);
  }
  /* A component can go into any container, except itself or one of its own children. */
  function canDropInto(names, target) {
    if (!state.model || !byName[target]) { return false; }
    if (target !== rootName() && !byName[target].container) { return false; }
    var chain = pathOf(target);
    // a non-visual component (query, timer, controller…) lives on the form itself, never inside a panel
    return names.every(function (n) { return chain.indexOf(n) < 0 && !isFixed(n) && (!byName[n].nonVisual || target === rootName()); });
  }
  function dropTargetName(name) {
    var n = byName[name];
    if (n && kind(n.cls) === 'pages') { return activeSheet(n) || name; }
    return name;
  }
  function reparentTo(names, target) {
    target = dropTargetName(target);
    if (!canDropInto(names, target)) { state.notice = 'A component cannot be moved into itself or into one of its own children.'; renderStatus(); return; }
    var movable = names.filter(function (n) { return parentOf[n] !== target; });
    if (!movable.length) { return; }
    post({ type: 'reparent', names: movable, target: target, positions: movable.map(function (n, i) { return { left: 8 + 16 * i, top: 8 + 16 * i }; }) });
  }
  /* Inspector "Parent": move into the chosen container, keeping the component where it is on screen when possible. */
  function moveToParent(name, target) {
    target = dropTargetName(target);
    if (!canDropInto([name], target) || parentOf[name] === target) { return; }
    var pos = { left: 8, top: 8 };
    try {
      var er = relRect(els[name]), tr = areaOf(target);
      if (tr) { pos = { left: Math.max(0, Math.min(Math.round(er.x - tr.x), Math.round(tr.w - er.w))), top: Math.max(0, Math.min(Math.round(er.y - tr.y), Math.round(tr.h - er.h))) }; }
    } catch (err) { pos = { left: 8, top: 8 }; }
    post({ type: 'reparent', names: [name], target: target, positions: [pos] });
  }
  /* Ctrl+A: every component of the container the selection is in (the form when nothing is selected, or when the selection is in the form). */
  function siblingsOfSelection() {
    var prim = state.sel[state.sel.length - 1];
    var holder = prim && parentOf[prim] && byName[parentOf[prim]] ? byName[parentOf[prim]] : state.model.root;
    return holder.children.filter(function (c) { return !c.fixed && !c.structural; }).map(function (c) { return c.name; });
  }
  function selectParent() {
    var prim = state.sel[state.sel.length - 1];
    var pn = prim ? parentOf[prim] : '';
    if (!pn || pn === rootName()) { select([]); return; }
    revealNode(pn); select([pn]);
  }
  function dropLabel(ev, text, ok) {
    var l = $('droplabel');
    if (!text) { l.style.display = 'none'; return; }
    l.textContent = text; l.style.display = 'block'; l.className = ok ? 'go' : '';
    l.style.left = (ev.clientX + 16) + 'px'; l.style.top = (ev.clientY + 16) + 'px';
  }

  /* ───────── interaction ───────── */
  function clientPoint(ev) {
    var c = $('client').getBoundingClientRect();
    return { x: (ev.clientX - c.left) / state.zoom, y: (ev.clientY - c.top) / state.zoom };
  }
${snapScript()}
${viewScript()}
${toolsScript()}
${marksScript()}
${compareScript()}
${layoutsScript()}
  /* The rectangles of the other components of the container the dragged ones are in, and its size, in the container's own coordinates. */
  function magnetContext(names) {
    var pn = parentOf[names[0]];
    var parentNode = pn === rootName() ? state.model.root : byName[pn];
    if (!parentNode) { return null; }
    var rects = parentNode.children.filter(function (c) { return names.indexOf(c.name) < 0 && c.visible && !c.nonVisual && !c.structural && !c.fixed && c.w > 0 && c.h > 0; })
      .map(function (c) { return { x: c.x, y: c.y, w: c.w, h: c.h }; });
    var off = pn === rootName() ? { x: 0, y: 0 } : relRect(els[pn]);
    var size = pn === rootName() ? { w: state.model.width, h: state.model.height } : { w: parentNode.w, h: parentNode.h };
    return { lines: magnetLines(rects, size, state.snap), off: off, parent: pn, rects: rects };
  }
  function magnetOn(ev) { return state.snap.on && !ev.altKey && (state.snap.edges || state.snap.centers); }
  function clearGuides() { document.querySelectorAll('#overlay .guide, #overlay .gapg').forEach(function (g) { g.parentNode.removeChild(g); }); }
  /* The lines run from the component to the ones it lines up with, a little beyond: no more. */
  function showGuides(ctx, gx, gy, box, gaps) {
    clearGuides();
    if (!state.snap.guides || !ctx || !box) { return; }
    // equal gaps: a little ruler on each, with its size
    (gaps || []).forEach(function (gp, axis) {
      if (!gp) { return; }
      gp.gaps.forEach(function (g) {
        var d = el('div', 'gapg ' + (axis === 0 ? 'h' : 'v'));
        if (axis === 0) { d.style.left = (ctx.off.x + g.from) + 'px'; d.style.width = (g.to - g.from) + 'px'; d.style.top = (ctx.off.y + g.at - 3) + 'px'; }
        else { d.style.top = (ctx.off.y + g.from) + 'px'; d.style.height = (g.to - g.from) + 'px'; d.style.left = (ctx.off.x + g.at - 3) + 'px'; }
        d.appendChild(el('span', '', String(Math.round(g.to - g.from))));
        $('overlay').appendChild(d);
      });
    });
    var ov = $('overlay');
    gx.forEach(function (v) { var sp = magnetSpan(box, ctx.rects, v, 'x', 8); var g = el('div', 'guide v'); g.style.left = (ctx.off.x + v) + 'px'; g.style.top = (ctx.off.y + sp.from) + 'px'; g.style.height = (sp.to - sp.from) + 'px'; ov.appendChild(g); });
    gy.forEach(function (v) { var sp = magnetSpan(box, ctx.rects, v, 'y', 8); var g = el('div', 'guide h'); g.style.top = (ctx.off.y + v) + 'px'; g.style.left = (ctx.off.x + sp.from) + 'px'; g.style.width = (sp.to - sp.from) + 'px'; ov.appendChild(g); });
  }
  function snap(v, ev) { return state.grid && !ev.altKey ? Math.round(v / state.grid) * state.grid : Math.round(v); }
  function dropContainerAt(ev, ignore) {
    ignore.forEach(function (e) { e.style.pointerEvents = 'none'; });
    var t = document.elementFromPoint(ev.clientX, ev.clientY);
    ignore.forEach(function (e) { e.style.pointerEvents = ''; });
    var c = t && t.closest ? t.closest('.ctl.cont') : null;
    while (c && ignore.some(function (i) { return i.contains(c); })) { c = c.parentElement && c.parentElement.closest ? c.parentElement.closest('.ctl.cont') : null; }
    if (c && kind(byName[c.getAttribute('data-name')].cls) === 'pages') {
      var s = activeSheet(byName[c.getAttribute('data-name')]);
      return s ? els[s] : null;
    }
    return c || $('client');
  }
  function nameOfContainer(e) { return e === $('client') ? state.model.root.name : e.getAttribute('data-name'); }
  function isDetail(n) { return n.cls.toLowerCase().slice(-10) === 'detailsite'; }
  /* Hidden detail pages that must be drawn: the ones holding the selection. */
  function wantedDetails() {
    var o = {};
    state.sel.forEach(function (s0) {
      var c = s0;
      while (c) { if (byName[c] && isDetail(byName[c]) && !byName[c].visible) { o[c] = true; } c = parentOf[c]; }
    });
    return o;
  }
  /* The scroll bar that was clicked keeps its highlight while its view stays selected. */
  function markScrollbar() {
    document.querySelectorAll('.dxvs.sbsel, .dxhs.sbsel').forEach(function (e) { e.classList.remove('sbsel'); });
    var s = state.sbSel;
    if (!s || state.sel.indexOf((byName[s.grid] || {}).scrollView) < 0) { state.sbSel = null; return; }
    var g = els[s.grid];
    var b = g && g.querySelector(s.axis === 'v' ? '.dxvs' : '.dxhs');
    if (b) { b.classList.add('sbsel'); }
  }
  /* Clicking a component, on the form or in the list, brings the inspector if it was hidden. */
  function openInspector() { if (!state.ui.right) { state.ui.right = true; applyUi(); } }
  function select(names) {
    state.sel = names;
    state.sbSel = null;
    if (Object.keys(wantedDetails()).sort().join() !== Object.keys(state.details).sort().join()) { render(); return; }
    drawSel(); renderOutline(); renderInspector(); renderStatus(); markScrollbar(); applyMarks();
  }

  document.addEventListener('mousedown', function (ev) {
    if (ev.button !== 0) { return; }
    var t = ev.target;
    var inClient = t.closest && t.closest('#client');
    var tab = t.closest && t.closest('.tab');
    var pal = t.closest && t.closest('[data-tool]');
    if (pal) {
      state.tool = state.tool === pal.getAttribute('data-tool') ? null : pal.getAttribute('data-tool'); renderPalette(); renderStatus();
      if (state.tool && state.palHost[state.tool]) { var sh = selectedHost(state.palHost[state.tool]); if (sh) { placeInHost(sh); } }
      return;
    }
    var twist = t.closest && t.closest('[data-twist]');
    if (twist) { toggleCollapse(twist.getAttribute('data-twist')); ev.preventDefault(); return; }
    var crumb = t.closest && t.closest('[data-crumb]');
    if (crumb) { var cn = crumb.getAttribute('data-crumb'); if (cn === rootName()) { select([]); } else { listClick(cn, ev); } return; }
    var pick = t.closest && t.closest('[data-pick]');
    if (pick) { listClick(pick.getAttribute('data-pick'), ev); openInspector(); return; }
    if (!inClient) { return; }
    $('client').focus();
    state.notice = '';
    if (tab) {
      state.tabs[tab.getAttribute('data-pages')] = tab.getAttribute('data-sheet');
      select([tab.getAttribute('data-pages')]); render(); return;
    }
    var handle = t.closest('.handle');
    if (handle) { startResize(ev, handle.getAttribute('data-h')); return; }
    if (state.tool) {
      if (state.palHost[state.tool]) { placeInHost(hostFromElement(state.palHost[state.tool], t)); return; }
      startPlace(ev); return;
    }
    var ctl = t.closest('.ctl');
    if (!ctl) { startMarquee(ev); return; }
    var name = ctl.getAttribute('data-name');
    // the scroll bar of a DevExpress grid: a click selects it (its settings are those of the view the grid shows)
    var bar = t.closest('.dxvs, .dxhs');
    if (bar && byName[name] && byName[name].scrollView) {
      select([byName[name].scrollView]);
      state.sbSel = { grid: name, axis: bar.classList.contains('dxvs') ? 'v' : 'h' };
      markScrollbar();
      startBarDrag(ev, name, state.sbSel.axis);
      ev.preventDefault();
      return;
    }
    if (ev.shiftKey || ev.ctrlKey) {
      var i = state.sel.indexOf(name);
      if (i >= 0) { state.sel.splice(i, 1); } else { state.sel.push(name); }
      select(state.sel.slice()); openInspector(); return;
    }
    if (state.sel.indexOf(name) < 0) { select([name]); }
    openInspector();
    startMove(ev);
  });

  function startMove(ev) {
    var names = state.sel.slice();
    // Parts placed by their parent (tiles, grid columns…) are selected, never dragged.
    if (names.some(isFixed) || names.some(isLockedName)) { return; }
    var orig = {}; names.forEach(function (n) { orig[n] = { x: byName[n].x, y: byName[n].y }; });
    // Docked components cannot be placed by hand, but they can still be dragged into another container.
    drag = { kind: 'move', sx: ev.clientX, sy: ev.clientY, names: names, orig: orig, moved: false, ddx: 0, ddy: 0, target: null, dockedOnly: !names.every(isFree) };
  }
  function startResize(ev, h) {
    var names = state.sel.slice(); var orig = {};
    if (names.some(isLockedName)) { ev.preventDefault(); return; }
    names.forEach(function (n) { var b = byName[n]; orig[n] = { x: b.x, y: b.y, w: b.w, h: b.h }; });
    drag = { kind: 'resize', h: h, sx: ev.clientX, sy: ev.clientY, names: names, orig: orig, moved: false, rects: {} };
    ev.preventDefault();
  }
  function startPlace(ev) {
    var p = clientPoint(ev);
    var band = el('div', 'band'); $('overlay').appendChild(band);
    drag = { kind: 'place', sx: ev.clientX, sy: ev.clientY, p0: p, band: band, ev0: ev };
    ev.preventDefault();
  }
  function startMarquee(ev) {
    var p = clientPoint(ev);
    var band = el('div', 'band'); $('overlay').appendChild(band);
    drag = { kind: 'marquee', sx: ev.clientX, sy: ev.clientY, p0: p, band: band, additive: ev.shiftKey || ev.ctrlKey };
    if (!drag.additive) { select([]); }
  }

  document.addEventListener('mousemove', function (ev) {
    if (!drag) { updateHover(ev); return; }
    var z = state.zoom;
    var dx = (ev.clientX - drag.sx) / z, dy = (ev.clientY - drag.sy) / z;
    if (drag.kind === 'move') {
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) { return; }
      drag.moved = true;
      var first = drag.orig[drag.names[0]];
      drag.ddx = snap(first.x + dx, ev) - first.x; drag.ddy = snap(first.y + dy, ev) - first.y;
      if (magnetOn(ev)) {
        // the group moves as one box: its edges and centre are what is caught
        var bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
        drag.names.forEach(function (n) { var o = drag.orig[n], b = byName[n]; bx0 = Math.min(bx0, o.x); by0 = Math.min(by0, o.y); bx1 = Math.max(bx1, o.x + b.w); by1 = Math.max(by1, o.y + b.h); });
        if (!drag.magnet) { drag.magnet = magnetContext(drag.names); }
        var mg = drag.magnet;
        if (mg) {
          var m = magnetBox({ x: bx0 + dx, y: by0 + dy, w: bx1 - bx0, h: by1 - by0 }, mg.lines, 6 / z, state.snap);
          if (m.gx.length) { drag.ddx = Math.round(dx + m.dx); }
          if (m.gy.length) { drag.ddy = Math.round(dy + m.dy); }
          // no edge to catch on an axis: the rhythm of the neighbours (equal gaps)
          var rawBox = { x: bx0 + dx, y: by0 + dy, w: bx1 - bx0, h: by1 - by0 }, eq = [null, null];
          if (state.snap.spacing !== false) {
            if (!m.gx.length) { eq[0] = magnetGaps(rawBox, mg.rects, 6 / z, 'x'); if (eq[0]) { drag.ddx = Math.round(dx + eq[0].d); } }
            if (!m.gy.length) { eq[1] = magnetGaps(rawBox, mg.rects, 6 / z, 'y'); if (eq[1]) { drag.ddy = Math.round(dy + eq[1].d); } }
          }
          drag.guides = [mg, m.gx, m.gy, { x: bx0 + drag.ddx, y: by0 + drag.ddy, w: bx1 - bx0, h: by1 - by0 }, eq];
        }
      } else { drag.guides = null; }
      var dragged = drag.names.map(function (n) { return els[n]; });
      dragged.forEach(function (e) { e.style.transform = 'translate(' + drag.ddx + 'px,' + drag.ddy + 'px)'; e.style.zIndex = 20; });
      var tgt = dropContainerAt(ev, dragged);
      if (drag.target && drag.target !== tgt) { drag.target.classList.remove('droptarget'); }
      var parentEl = drag.names.length ? (parentOf[drag.names[0]] === state.model.root.name ? $('client') : els[parentOf[drag.names[0]]]) : null;
      var tn = tgt ? nameOfContainer(tgt) : '';
      drag.target = tgt && tgt !== parentEl && canDropInto(drag.names, tn) ? tgt : null;
      if (drag.target) { drag.target.classList.add('droptarget'); }
      var pname = parentOf[drag.names[0]];
      dropLabel(ev, drag.target ? '↳ Drop into ' + tn + (tn === rootName() ? ' (form)' : ' : ' + byName[tn].cls) : (drag.dockedOnly ? 'Docked: drop it on another container to move it' : 'Stays in ' + pname), !!drag.target);
      drawSel();
      if (drag.guides) { showGuides(drag.guides[0], drag.guides[1], drag.guides[2], drag.guides[3], drag.guides[4]); } else { clearGuides(); }
    } else if (drag.kind === 'resize') {
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 2) { return; }
      drag.moved = true;
      var rctx = null, rgx = [], rgy = [];
      if (magnetOn(ev)) { if (!drag.magnet) { drag.magnet = magnetContext(drag.names); } rctx = drag.magnet; }
      /* an edge that moves: the grid first, then the magnet when it catches something */
      function edgeX(v) { var g = snap(v, ev); if (rctx) { var d = magnetValue(v, rctx.lines.xs, 6 / z); if (d !== null) { rgx.push(v + d); return Math.round(v + d); } } return g; }
      function edgeY(v) { var g = snap(v, ev); if (rctx) { var d = magnetValue(v, rctx.lines.ys, 6 / z); if (d !== null) { rgy.push(v + d); return Math.round(v + d); } } return g; }
      drag.names.forEach(function (n) {
        var o = drag.orig[n], r = { x: o.x, y: o.y, w: o.w, h: o.h }, h = drag.h;
        if (h.indexOf('e') >= 0) { r.w = Math.max(4, edgeX(o.x + o.w + dx) - o.x); }
        if (h.indexOf('s') >= 0) { r.h = Math.max(4, edgeY(o.y + o.h + dy) - o.y); }
        if (h.indexOf('w') >= 0) { var nx = Math.min(edgeX(o.x + dx), o.x + o.w - 4); r.w = o.x + o.w - nx; r.x = nx; }
        if (h.indexOf('n') >= 0) { var ny = Math.min(edgeY(o.y + dy), o.y + o.h - 4); r.h = o.y + o.h - ny; r.y = ny; }
        drag.rects[n] = r;
        var e = els[n];
        if (!byName[n].docked) { e.style.left = r.x + 'px'; e.style.top = r.y + 'px'; }
        e.style.width = r.w + 'px'; e.style.height = r.h + 'px';
      });
      drawSel();
      var rb = drag.rects[drag.names[0]];
      if (rctx && rb) { showGuides(rctx, rgx, rgy, rb); } else { clearGuides(); }
    } else if (drag.kind === 'place' || drag.kind === 'marquee') {
      var p = clientPoint(ev), p0 = drag.p0;
      var b = drag.band;
      b.style.left = Math.min(p.x, p0.x) + 'px'; b.style.top = Math.min(p.y, p0.y) + 'px';
      b.style.width = Math.abs(p.x - p0.x) + 'px'; b.style.height = Math.abs(p.y - p0.y) + 'px';
    }
  });

  document.addEventListener('mouseup', function (ev) {
    if (!drag) { return; }
    var d = drag; drag = null;
    clearGuides();
    var z = state.zoom;
    if (d.kind === 'move') {
      d.names.forEach(function (n) { els[n].style.transform = ''; els[n].style.zIndex = ''; });
      if (d.target) { d.target.classList.remove('droptarget'); }
      dropLabel(ev, '', false);
      if (!d.moved) { return; }
      if (d.dockedOnly && !d.target) { drawSel(); return; }
      if (d.target) {
        var tr = d.target.getBoundingClientRect();
        var positions = d.names.map(function (n) {
          var r = els[n].getBoundingClientRect(), b = byName[n];
          // Keep the component inside its new parent, so that it does not end up half hidden.
          var left = (r.left + d.ddx * z - tr.left) / z, top = (r.top + d.ddy * z - tr.top) / z;
          return { left: Math.round(Math.max(0, Math.min(left, tr.width / z - b.w))), top: Math.round(Math.max(0, Math.min(top, tr.height / z - b.h))) };
        });
        post({ type: 'reparent', names: d.names, target: nameOfContainer(d.target), positions: positions });
      } else if (d.ddx || d.ddy) {
        post({ type: 'move', changes: d.names.map(function (n) { return { name: n, left: d.orig[n].x + d.ddx, top: d.orig[n].y + d.ddy }; }) });
      } else { drawSel(); }
    } else if (d.kind === 'resize') {
      if (!d.moved) { return; }
      post({ type: 'resize', changes: d.names.map(function (n) { var r = d.rects[n] || d.orig[n]; return { name: n, left: r.x, top: r.y, width: r.w, height: r.h }; }) });
    } else if (d.kind === 'place') {
      d.band.parentNode.removeChild(d.band);
      var p = clientPoint(ev), p0 = d.p0;
      var cont = dropContainerAt(d.ev0, []);
      var cr = cont.getBoundingClientRect();
      var big = Math.abs(p.x - p0.x) > 6 && Math.abs(p.y - p0.y) > 6;
      var left = snap((Math.min(p.x, p0.x) * z + $('client').getBoundingClientRect().left - cr.left) / z, ev);
      var top = snap((Math.min(p.y, p0.y) * z + $('client').getBoundingClientRect().top - cr.top) / z, ev);
      post({ type: 'add', className: state.tool, parent: nameOfContainer(cont), left: Math.max(0, left), top: Math.max(0, top), width: big ? snap(Math.abs(p.x - p0.x), ev) : undefined, height: big ? snap(Math.abs(p.y - p0.y), ev) : undefined });
      if (!ev.shiftKey) { state.tool = null; renderPalette(); }
    } else if (d.kind === 'marquee') {
      d.band.parentNode.removeChild(d.band);
      var q = clientPoint(ev), q0 = d.p0;
      var x1 = Math.min(q.x, q0.x), x2 = Math.max(q.x, q0.x), y1 = Math.min(q.y, q0.y), y2 = Math.max(q.y, q0.y);
      if (x2 - x1 < 4 && y2 - y1 < 4) { return; }
      var hits = state.model.root.children.filter(function (c) { return c.visible && c.x < x2 && c.x + c.w > x1 && c.y < y2 && c.y + c.h > y1; }).map(function (c) { return c.name; });
      select(d.additive ? state.sel.concat(hits.filter(function (h) { return state.sel.indexOf(h) < 0; })) : hits);
    }
  });

  document.addEventListener('dblclick', function (ev) {
    var t = ev.target;
    if (!(t.closest && t.closest('#client'))) { return; }
    var ctl = t.closest('.ctl');
    post({ type: 'open', name: ctl ? ctl.getAttribute('data-name') : state.model.root.name });
  });

  document.addEventListener('keydown', function (ev) {
    var tag = ev.target && ev.target.tagName;
    // Ctrl+F: find a component of the form
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && ev.key && ev.key.toLowerCase() === 'f') { openFind(); ev.preventDefault(); return; }
    // Ctrl+S saves both files, also from a field of the inspector (leaving the field first commits what was typed)
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && ev.key && ev.key.toLowerCase() === 's') {
      if (ev.target && ev.target.blur && (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA')) { ev.target.blur(); }
      post({ type: 'save' }); ev.preventDefault(); return;
    }
    // The keys are left to bubble: VS Code reads its own shortcuts (Ctrl+K Ctrl+B…) from them, whatever has the focus.
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') { return; }
    if (!ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      var k0 = ev.key.toLowerCase();
      if (k0 === 'p') { toggleLeft(); ev.preventDefault(); return; }
      if (k0 === 'i') { toggleRight(); ev.preventDefault(); return; }
      if (k0 === 'f') { setFull(!state.ui.full); ev.preventDefault(); return; }
    }
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && ev.key) {
      var kc = ev.key.toLowerCase();
      if ((kc === 'c' || kc === 'x') && state.sel.length) { doCopy(kc === 'x'); ev.preventDefault(); return; }
      if (kc === 'v') { doPaste(); ev.preventDefault(); return; }
    }
    if (ev.key === 'Escape') {
      if (state.tool) { state.tool = null; renderPalette(); renderStatus(); }
      else if (state.cut.length) { clearCut(true); }
      else { selectParent(); }
      return;
    }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'z' || ev.key === 'Z')) { post({ type: ev.shiftKey ? 'redo' : 'undo' }); ev.preventDefault(); return; }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'y' || ev.key === 'Y')) { post({ type: 'redo' }); ev.preventDefault(); return; }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'a' || ev.key === 'A') && state.model) { select(siblingsOfSelection()); ev.preventDefault(); return; }
    if (!state.sel.length) { return; }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { var del = state.sel.filter(function (n) { return !isLockedName(n); }); if (del.length) { post({ type: 'delete', names: del }); } ev.preventDefault(); return; }
    var step = ev.shiftKey ? (state.grid || 8) : 1, mx = 0, my = 0;
    if (ev.key === 'ArrowLeft') { mx = -step; } else if (ev.key === 'ArrowRight') { mx = step; } else if (ev.key === 'ArrowUp') { my = -step; } else if (ev.key === 'ArrowDown') { my = step; } else { return; }
    ev.preventDefault();
    if (!state.sel.every(isFree) || state.sel.some(isLockedName)) { return; }
    if (ev.ctrlKey) {
      post({ type: 'resize', changes: state.sel.map(function (n) { var b = byName[n]; return { name: n, left: b.x, top: b.y, width: Math.max(4, b.w + mx), height: Math.max(4, b.h + my) }; }) });
    } else {
      post({ type: 'move', changes: state.sel.map(function (n) { var b = byName[n]; return { name: n, left: b.x + mx, top: b.y + my }; }) });
    }
  });

  /* ───────── clipboard: copy duplicates, cut + paste moves into the container that receives it ───────── */
  function markCut() {
    Object.keys(els).forEach(function (n) { if (els[n] && els[n].classList) { els[n].classList.toggle('cutmark', state.cut.indexOf(n) >= 0 && n !== rootName()); } });
  }
  function clearCut(tell) { state.cut = []; if (tell) { post({ type: 'uncut' }); } markCut(); renderOutline(); }
  function doCopy(cut) {
    if (!state.sel.length) { state.notice = 'Select the components to ' + (cut ? 'cut' : 'copy') + ' first.'; renderStatus(); return; }
    state.cut = cut ? state.sel.slice() : [];
    markCut(); renderOutline();
    post({ type: cut ? 'cut' : 'copy', names: state.sel.slice() });
  }
  function doPaste() {
    var prim = state.sel[state.sel.length - 1];
    post({ type: 'paste', target: prim && byName[prim] ? prim : rootName() });
  }
  function updateEditBar() { $('copy').disabled = !state.sel.length; $('cut').disabled = !state.sel.length; }
  function showDirty() { $('dirty').hidden = !state.dirty; $('save').classList.toggle('active', state.dirty); }
  $('copy').addEventListener('click', function () { doCopy(false); });
  $('cut').addEventListener('click', function () { doCopy(true); });
  $('paste').addEventListener('click', doPaste);
  $('save').addEventListener('click', function () { post({ type: 'save' }); });
  $('cexp').addEventListener('click', function () { collapseAll(false); });
  $('ccol').addEventListener('click', function () { collapseAll(true); });

  /* ───────── toolbar ───────── */
  /* Room for complex forms: each side panel can be hidden (a tab on the edge brings it back), "Fit window" scales the form to what is left,
     and Full screen hides both panels and, in VS Code, the rest of the interface (Zen mode). */
  function saveUi() {
    try { vscode.setState({ left: state.ui.left, right: state.ui.right, wl: state.ui.wl, wr: state.ui.wr, pal: state.ui.pal, oh: state.ui.oh, collapsed: state.collapsed, fit: state.fit, fitSet: state.fitSet, zoom: state.zoom, after: state.openAfter, snap: state.snap, view: { names: state.view.names, containers: state.view.containers, tab: state.view.tab, rulers: state.view.rulers, theme: state.view.theme } }); } catch (err) { /* no state available */ }
  }
  function applyUi() {
    document.body.classList.toggle('hide-left', !state.ui.left);
    document.body.classList.toggle('hide-right', !state.ui.right);
    document.body.classList.toggle('full', state.ui.full);
    $('togleft').classList.toggle('active', state.ui.left);
    $('togright').classList.toggle('active', state.ui.right);
    $('full').classList.toggle('active', state.ui.full);
    $('edgeL').textContent = state.ui.left ? '‹' : '›'; $('edgeL').title = (state.ui.left ? 'Hide' : 'Show') + ' the palette and the component list (P)';
    $('edgeR').textContent = state.ui.right ? '›' : '‹'; $('edgeR').title = (state.ui.right ? 'Hide' : 'Show') + ' the inspector (I)';
    $('palsec').open = !!state.ui.pal;
    $('full').textContent = state.ui.full ? '⛶ Exit full screen' : '⛶ Full screen'; $('full').appendChild(el('span', 'kbd', 'Ctrl+K F'));
    if (state.fit) { fitZoom(true); }
    saveUi();
  }
  function toggleLeft() { state.ui.left = !state.ui.left; applyUi(); }
  function toggleRight() { state.ui.right = !state.ui.right; applyUi(); }
  function setFull(on) {
    if (on === state.ui.full) { return; }
    if (on) { state.ui.before = { left: state.ui.left, right: state.ui.right }; state.ui.left = false; state.ui.right = false; }
    else { var b = state.ui.before || { left: true, right: true }; state.ui.left = b.left; state.ui.right = b.right; state.ui.before = null; }
    state.ui.full = on;
    applyUi();
    post({ type: 'fullscreen', on: on });
  }
  function fitZoom(force) {
    if (!state.model) { return; }
    var c = $('center');
    var aw = c.clientWidth - 44, ah = c.clientHeight - 44;
    if (aw < 80 || ah < 80) { return; }
    var z = Math.min(aw / (state.model.width + 2), ah / (state.model.height + 33));
    z = Math.floor(Math.max(0.2, Math.min(state.fitSet ? 2 : 1, z)) * 100) / 100; // by default a small form keeps its size, a big one shrinks to be seen whole
    if (force || Math.abs(z - state.zoom) >= 0.01) { state.zoom = z; applyZoom(); drawSel(); }
    fitLabel();
  }
  /* The palette and the inspector are resized with the mouse (drag the thin bar between them and the form). */
  function setPanelWidth(key, w, quiet) {
    var max = Math.max(200, Math.round(window.innerWidth * 0.6));
    w = w ? Math.max(140, Math.min(max, Math.round(w))) : 0;
    state.ui[key] = w;
    document.documentElement.style.setProperty(key === 'wl' ? '--wl' : '--wr', w ? w + 'px' : (key === 'wl' ? '210px' : '240px'));
    if (!quiet) { if (state.fit) { fitZoom(false); } drawSel(); }
  }
  function splitter(id, key, dir) {
    var bar = $(id);
    bar.addEventListener('pointerdown', function (ev) {
      if (ev.button !== 0) { return; }
      var x0 = ev.clientX, w0 = $(key === 'wl' ? 'left' : 'right').offsetWidth;
      try { bar.setPointerCapture(ev.pointerId); } catch (err) { /* no capture: the bar still follows the mouse over the page */ }
      bar.classList.add('drag'); document.body.classList.add('resizing');
      var move = function (e) { setPanelWidth(key, w0 + dir * (e.clientX - x0)); };
      var up = function () {
        bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up);
        bar.classList.remove('drag'); document.body.classList.remove('resizing'); saveUi();
      };
      bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
      ev.preventDefault();
    });
    bar.addEventListener('dblclick', function () { setPanelWidth(key, 0); saveUi(); });
  }
  /* The components list and the palette share the left column: the bar between them gives more room to one or the other. */
  function setOutlineHeight(h) {
    h = h ? Math.max(60, Math.min(Math.round(window.innerHeight * 0.9), Math.round(h))) : 0;
    state.ui.oh = h;
    if (h) { document.documentElement.style.setProperty('--outh', h + 'px'); } else { document.documentElement.style.removeProperty('--outh'); }
  }
  (function () {
    var bar = $('splitV');
    bar.addEventListener('pointerdown', function (ev) {
      if (ev.button !== 0) { return; }
      var y0 = ev.clientY, h0 = $('outline').offsetHeight;
      try { bar.setPointerCapture(ev.pointerId); } catch (err) { /* no capture: the bar still follows the mouse over the page */ }
      bar.classList.add('drag'); document.body.classList.add('resizing-v');
      var move = function (e) { setOutlineHeight(h0 + (e.clientY - y0)); };
      var up = function () {
        bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up);
        bar.classList.remove('drag'); document.body.classList.remove('resizing-v'); saveUi();
      };
      bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
      ev.preventDefault();
    });
    bar.addEventListener('dblclick', function () { setOutlineHeight(0); saveUi(); });
    $('palsec').addEventListener('toggle', function () { if (state.ui.pal !== $('palsec').open) { state.ui.pal = $('palsec').open; saveUi(); } });
  })();
  splitter('splitL', 'wl', 1);
  splitter('splitR', 'wr', -1);
  $('togleft').addEventListener('click', toggleLeft);
  $('togright').addEventListener('click', toggleRight);
  $('edgeL').addEventListener('click', toggleLeft);
  $('edgeR').addEventListener('click', toggleRight);
  /* A double click on a fold handle opens the panel, as wide as the longest line of the components list (names and classes in full). */
  function fitLeftWidth() {
    var widest = 0;
    document.querySelectorAll('#outline div').forEach(function (r) { if (r.scrollWidth > widest) { widest = r.scrollWidth; } });
    var room = $('left').clientWidth - $('outline').clientWidth + 14;
    setPanelWidth('wl', widest + room);
    saveUi();
  }
  $('edgeL').addEventListener('dblclick', function () { state.ui.left = true; applyUi(); fitLeftWidth(); });
  $('edgeR').addEventListener('dblclick', function () { state.ui.right = true; applyUi(); });
  $('full').addEventListener('click', function () { setFull(!state.ui.full); });
  if (window.ResizeObserver) { new ResizeObserver(function () { if (state.fit) { fitZoom(false); } }).observe($('center')); }
  (function () {
    var st = null;
    try { st = vscode.getState(); } catch (err) { st = null; }
    if (st && typeof st === 'object') {
      state.ui.left = st.left !== false; state.ui.right = st.right !== false; state.openAfter = !!st.after;
      if (st.collapsed && typeof st.collapsed === 'object') { state.collapsed = st.collapsed; }
      state.ui.pal = st.pal === true;
      if (st.oh >= 60) { setOutlineHeight(st.oh); }
      if (st.wl >= 120) { setPanelWidth('wl', st.wl, true); }
      if (st.wr >= 120) { setPanelWidth('wr', st.wr, true); }
      if (st.snap && typeof st.snap === 'object') { ['on', 'edges', 'centers', 'container', 'guides', 'spacing'].forEach(function (k) { if (typeof st.snap[k] === 'boolean') { state.snap[k] = st.snap[k]; } }); }
      if (st.view && typeof st.view === 'object') { ['names', 'containers', 'tab', 'rulers'].forEach(function (k) { if (typeof st.view[k] === 'boolean') { state.view[k] = st.view[k]; } }); if (typeof st.view.theme === 'string') { state.view.theme = st.view.theme; } }
      // 100% until the user chooses another zoom (an older saved state without the choice does not count)
      state.fitSet = st.fitSet === true;
      state.fit = state.fitSet ? !!st.fit : false;
      if (state.fit) { $('zoom').value = 'fit'; }
      else if (st.zoom >= 0.25 && st.zoom <= 3) { state.zoom = st.zoom; applyZoom(); showZoom(); }
    }
    applyUi();
  })();
  $('center').addEventListener('wheel', function (ev) {
    if (!(ev.ctrlKey || ev.metaKey)) { return; }
    ev.preventDefault();
    // a wheel notch is about 10 percent, a trackpad pinch (small deltas) follows the finger
    var step = Math.max(-0.5, Math.min(0.5, -ev.deltaY / (ev.deltaMode === 1 ? 20 : 200)));
    setZoom(state.zoom * (1 + step * 0.5), ev.clientX, ev.clientY);
  }, { passive: false });
  /* Pan the form with the middle button, as in a drawing program. */
  (function () {
    var pan = null;
    $('center').addEventListener('mousedown', function (ev) {
      if (ev.button !== 1) { return; }
      ev.preventDefault();
      pan = { x: ev.clientX, y: ev.clientY, l: $('center').scrollLeft, t: $('center').scrollTop };
      $('center').classList.add('panning');
    });
    window.addEventListener('mousemove', function (ev) {
      if (!pan) { return; }
      $('center').scrollLeft = pan.l - (ev.clientX - pan.x); $('center').scrollTop = pan.t - (ev.clientY - pan.y);
    });
    window.addEventListener('mouseup', function () { if (pan) { pan = null; $('center').classList.remove('panning'); } });
  })();
  $('zoom').addEventListener('change', function () {
    var v = $('zoom').value;
    if (v === 'custom') { return; }
    state.fit = v === 'fit'; state.fitSet = true;
    if (state.fit) { fitZoom(true); } else { state.zoom = Number(v); applyZoom(); drawSel(); }
    saveUi();
  });
  $('grid').addEventListener('change', function () { state.grid = Number($('grid').value); });
  function showSnap() {
    $('snap').classList.toggle('active', state.snap.on);
    $('snapspacing').checked = state.snap.spacing; $('snapedges').checked = state.snap.edges; $('snapcenters').checked = state.snap.centers; $('snapcont').checked = state.snap.container; $('snapguides').checked = state.snap.guides;
  }
  $('snap').addEventListener('click', function () { state.snap.on = !state.snap.on; showSnap(); saveUi(); });
  $('snapopt').addEventListener('click', function () { $('snapmenu').hidden = !$('snapmenu').hidden; });
  [['snapedges', 'edges'], ['snapcenters', 'centers'], ['snapcont', 'container'], ['snapguides', 'guides'], ['snapspacing', 'spacing']].forEach(function (p) {
    $(p[0]).addEventListener('change', function () { state.snap[p[1]] = $(p[0]).checked; saveUi(); });
  });
  document.addEventListener('mousedown', function (ev) { if (!$('snapmenu').hidden && !$('snapmenu').contains(ev.target) && ev.target !== $('snapopt')) { $('snapmenu').hidden = true; } });
  viewInit();
  toolsInit();
  $('dup').addEventListener('click', duplicateSelection);
  marksInit();
  compareInit();
  layoutsInit();
  $('client').addEventListener('mouseleave', function () { state.hover = null; drawHover(); });
  $('undo').addEventListener('click', function () { post({ type: 'undo' }); });
  $('redo').addEventListener('click', function () { post({ type: 'redo' }); });
  $('opencode').addEventListener('click', function () { post({ type: 'openCode' }); });
  $('opendfm').addEventListener('click', function () { post({ type: 'openDfm' }); });
  $('palfilter').addEventListener('input', function () { state.filter = $('palfilter').value.trim(); renderPalette(); });
  $('palgroup').addEventListener('change', function () { state.palGroup = $('palgroup').value; $('palfilter').value = ''; state.filter = ''; renderPalette(); });
  $('cfname').addEventListener('input', function () { state.cf.text = $('cfname').value.trim(); renderOutline(); });
  $('cftype').addEventListener('change', function () { state.cf.type = $('cftype').value; renderOutline(); });
  $('cfsort').addEventListener('change', function () { state.cf.sort = $('cfsort').value; renderOutline(); });
  $('cfflat').addEventListener('change', function () { state.cf.flat = $('cfflat').checked; renderOutline(); });
  $('otherbtn').addEventListener('click', function () {
    var v = $('otherclass').value.trim();
    if (v) { state.tool = v; renderPalette(); renderStatus(); }
  });

  /* ───────── messages from the extension ───────── */
  window.addEventListener('message', function (ev) {
    var m = ev.data;
    if (!m) { return; }
    try { onMessage(m); } catch (err) { state.notice = 'Could not display the update: ' + (err && err.message ? err.message : err); renderStatus(); }
  });
  function onMessage(m) {
    if (m.type === 'toggleFull') { setFull(!state.ui.full); return; }
    if (m.type === 'model') {
      state.model = m.model;
      state.hosts = m.hosts || [];
      if (m.palette && !state.palette.length) { state.palette = m.palette; fillPalGroups(); renderPalette(); }
      if (m.ops && !state.ops.length) {
        state.ops = m.ops;
        state.anchorModes = m.anchorModes || [];
        buildAlignBar(m.ops);
      }
      takeMarks(m.designer);
      state.canUndo = !!m.canUndo; state.canRedo = !!m.canRedo; state.notice = m.notice || '';
      state.cut = Array.isArray(m.cut) ? m.cut : []; state.dirty = !!m.dirty;
      if (m.selection) { state.sel = m.selection; }
      render();
    } else if (m.type === 'select') {
      state.sel = (m.names || []).filter(function (n) { return byName[n]; });
      var shown = state.sel.length && revealNode(state.sel[0]);
      if (shown) { render(); } else { drawSel(); renderOutline(); renderInspector(); renderStatus(); }
      var target = state.sel.length ? els[state.sel[0]] : null;
      if (target && target.scrollIntoView) { target.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    } else if (m.type === 'notice') {
      state.notice = m.text; renderStatus();
    }
  }
  post({ type: 'ready' });
})();
</script>
</body></html>`;
}
