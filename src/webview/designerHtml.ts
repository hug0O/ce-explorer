/**
 * HTML / CSS / JS of the visual form designer webview. The script never uses
 * template literals or backslashes, so it can live in this template string.
 */

import type { ComponentDef } from '../services/DelphiForm';
import { DEVEXPRESS, TMS } from '../services/DelphiThirdParty';

export interface PaletteEntry {
    cls: string;
    group: string;
    icon: string;
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
];

const ICONS: [RegExp, string][] = [
    [/Button$|Btn$/, '🔘'], [/Label$/, '🅰'], [/(Memo|RichEdit)$/, '📝'], [/CheckBox$|CheckGroup$/, '☑'], [/Radio(Button|Group)$/, '◉'],
    [/(ComboBox)$/, '▾'], [/(List|Check)Box$/, '☰'], [/Panel$/, '▢'], [/(Group|Scroll)Box$/, '⛶'], [/(Pager|PageControl|PC)$/, '🗂'],
    [/Grid$/, '▦'], [/Image$/, '🏞'], [/Progress(Bar)?$/, '▰'], [/TrackBar$/, '⎯'], [/Tree(List|View)$/, '🌳'], [/(Date|Time)(Edit|Picker)$/, '📅'],
    [/Splitter$/, '┃'], [/StatusBar$/, '▁'], [/ToolBar$/, '▤'], [/Edit$|EditBtn$/, '▭'],
];
function iconFor(def: ComponentDef): string {
    if (def.width === undefined && def.height === undefined) { return '⚙'; }
    return (ICONS.find(([re]) => re.test(def.className)) ?? [/./, '◻'])[1];
}
for (const [group, defs] of [['DevExpress', DEVEXPRESS], ['TMS', TMS]] as [string, ComponentDef[]][]) {
    for (const d of defs) {
        if (/(TabSheet|OfficePage)$/.test(d.className)) { continue; }
        PALETTE.push({ cls: d.className, group, icon: iconFor(d) });
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
button { cursor: pointer; color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); background: var(--vscode-button-secondaryBackground, rgba(128,128,128,0.2)); }
button:hover:not(:disabled) { background: var(--vscode-button-secondaryHoverBackground, rgba(128,128,128,0.3)); }
button:disabled { opacity: 0.4; cursor: default; }
button.active { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
#main { flex: 1; display: flex; min-height: 0; }
#left, #right { width: 210px; overflow-y: auto; padding: 8px; border-right: 1px solid var(--vscode-panel-border, #444); }
#right { border-right: none; border-left: 1px solid var(--vscode-panel-border, #444); width: 240px; }
#center { flex: 1; overflow: auto; background: var(--vscode-editorWidget-background, #2d2d2d); padding: 20px; }
h4 { margin: 10px 0 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--vscode-descriptionForeground); }
.pal { display: flex; flex-wrap: wrap; gap: 3px; }
.pal button { padding: 2px 5px; font-size: 11px; }
.sec > summary { cursor: pointer; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; margin: 8px 0 4px; }
.pal-group > summary { cursor: pointer; font-size: 10px; color: var(--vscode-descriptionForeground); margin: 4px 0 2px; }
#outline { max-height: 340px; overflow: auto; }
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
.k-check > .chrome, .k-radio > .chrome { display: flex; align-items: center; gap: 4px; overflow: visible; white-space: nowrap; }
.k-check .box, .k-radio .box { width: 13px; height: 13px; border: 1px solid #333; background: #fff; flex: none; }
.k-radio .box { border-radius: 50%; }
.k-panel > .chrome { border: 1px solid #fff; border-right-color: #a0a0a0; border-bottom-color: #a0a0a0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; }
.k-panel.nobevel > .chrome { border-color: transparent; }
.k-group > .chrome { border: 1px solid #dcdcdc; border-radius: 3px; top: 7px; }
.k-group > .legend { position: absolute; left: 8px; top: -8px; background: #f0f0f0; padding: 0 3px; white-space: nowrap; }
.k-scroll > .chrome, .k-generic.cont > .chrome { border: 1px solid #a0a0a0; }
.k-generic > .chrome { border: 1px dashed #8a8a8a; background: rgba(255, 215, 0, 0.12); color: #555; padding: 2px 4px; font-size: 11px; }
.k-image > .chrome { border: 1px dashed #aaa; background: #f8f8f8; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.k-shape > .chrome { border: 1px solid #000; background: #fff; }
.k-bevel > .chrome { border: 1px solid #a0a0a0; border-bottom-color: #fff; border-right-color: #fff; }
.k-splitter > .chrome { background: #e0e0e0; }
.k-grid > .chrome { background: #fff; border: 1px solid #7a7a7a; background-image: linear-gradient(#c8c8c8 1px, transparent 1px), linear-gradient(90deg, #c8c8c8 1px, transparent 1px); background-size: 64px 20px; }
.k-progress > .chrome { border: 1px solid #bcbcbc; background: linear-gradient(90deg, #06b025 35%, #e6e6e6 35%); }
.k-track > .chrome { border-top: 2px solid #aaa; top: 45%; height: 4px; }
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
.fam-tag.dx { background: #1c6fc4; } .fam-tag.tms { background: #c4511c; }
.k-pages > .chrome { overflow: visible; }
.k-pages > .tabs { position: absolute; left: 0; top: 0; right: 0; height: 24px; display: flex; gap: 1px; pointer-events: none; }
.k-pages > .tabs > .tab { pointer-events: auto; padding: 3px 9px; border: 1px solid #a0a0a0; border-bottom: none; background: #e8e8e8; cursor: pointer; white-space: nowrap; height: 22px; margin-top: 2px; }
.k-pages > .tabs > .tab.on { background: #fff; height: 24px; margin-top: 0; }
.k-pages > .chrome > .body { position: absolute; left: 0; right: 0; top: 24px; bottom: 0; border: 1px solid #a0a0a0; background: #fff; }
.k-sheet > .chrome { background: #fff; }
.nonvisual > .chrome { border: 1px solid #888; background: #fff3c4; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
.nonvisual > .nvname { position: absolute; top: 30px; left: -10px; right: -10px; text-align: center; font-size: 10px; white-space: nowrap; }
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
</style></head>
<body>
<div id="toolbar">
  <label>Zoom <select id="zoom"><option value="0.5">50%</option><option value="0.75">75%</option><option value="1" selected>100%</option><option value="1.25">125%</option><option value="1.5">150%</option><option value="2">200%</option></select></label>
  <label>Grid <select id="grid"><option value="0">off</option><option value="2">2</option><option value="4" selected>4</option><option value="8">8</option><option value="16">16</option></select></label>
  <label><input type="checkbox" id="names"> names</label>
  <label title="Outline every container with its name, coloured by depth"><input type="checkbox" id="showparents"> containers</label>
  <span class="sep"></span>
  <button id="undo" title="Undo (Ctrl+Z)">↶ Undo</button><button id="redo" title="Redo (Ctrl+Y)">↷ Redo</button>
  <span class="sep"></span>
  <select id="alignop" title="Select two or more components first"></select><button id="alignbtn">Apply</button>
  <span class="sep"></span>
  <button id="opencode" title="Switch to the code of the unit (F12); come back with the Designer tab, the title-bar button or Ctrl+K Ctrl+B">&lt;/&gt; Code (F12)</button><button id="opendfm">.dfm</button>
</div>
<div id="main">
  <div id="left">
    <details open class="sec" id="palsec"><summary>Palette <span class="hint" id="palcount"></span></summary>
      <div class="row"><input type="text" id="palfilter" placeholder="Filter by name…"></div>
      <div class="row"><select id="palgroup" title="Filter by family"></select></div>
      <div id="palette"></div>
      <div class="row"><input type="text" id="otherclass" placeholder="Other class, e.g. TcxButton"><button id="otherbtn" title="Use this class as the tool">＋</button></div>
    </details>
    <details open class="sec" id="compsec"><summary>Components <span class="hint" id="compcount"></span></summary>
      <div class="row"><input type="text" id="cfname" placeholder="Filter by name or class…"></div>
      <div class="row"><select id="cftype" title="Filter by type"></select></div>
      <div class="row"><select id="cfsort" title="Sort"><option value="form">Form order</option><option value="name">By name</option><option value="type">By type</option><option value="pos">By position</option></select><label title="One flat list instead of the tree"><input type="checkbox" id="cfflat"> flat</label></div>
      <div id="outline" class="outline"></div>
    </details>
  </div>
  <div id="center"><div id="zoomwrap"><div id="formframe"><div id="titlebar"><span id="ftitle"></span><span class="ctrls">–□✕</span></div><div id="client" tabindex="0"><div id="overlay"></div><div id="hov"></div></div></div></div></div>
  <div id="right"><div id="inspector"></div></div>
</div>
<div id="status"></div>
<div id="droplabel"></div>
<script nonce="${nonce}">
(function () {
  var vscode = acquireVsCodeApi();
  var state = { model: null, sel: [], tool: null, showParents: false, hover: null, dragNames: null, cf: { text: '', type: '', sort: 'form', flat: false }, palOpen: {}, palGroup: '', listOrder: [], lastPick: '', zoom: 1, grid: 4, names: false, tabs: {}, palette: [], ops: [], canUndo: false, canRedo: false };
  var byName = {}, parentOf = {}, els = {};
  var drag = null;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text !== undefined) { e.textContent = text; } return e; }
  function post(m) { vscode.postMessage(m); }

  /* ───────── classification ───────── */
  function kind(c) {
    var l = c.toLowerCase();
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
    if (l.indexOf('toolbar') >= 0) { return 'toolbar'; }
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
  function content(n, e, chrome) {
    var k = kind(n.cls);
    var cap = n.caption !== undefined ? n.caption : (n.text !== undefined ? n.text : '');
    setFont(e, n);
    if (n.color && (k === 'panel' || k === 'edit' || k === 'memo' || k === 'scroll' || k === 'group' || k === 'sheet' || k === 'generic')) { chrome.style.background = n.color; }
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
      if (n.family === 'devexpress') { chrome.appendChild(el('div', 'dxband', 'Drag a column header here to group by that column')); }
      else { var hd = el('div', 'gridhead'); hd.style.height = (Number(n.props['FixedRows'] || 1) * rh) + 'px'; chrome.appendChild(hd); var fx = el('div', 'gridfix'); fx.style.width = (Number(n.props['FixedCols'] || 1) * cw) + 'px'; chrome.appendChild(fx); }
    }
    else if (k === 'statusbar' || k === 'toolbar') { chrome.textContent = k === 'statusbar' ? cap : ''; }
    else if (k === 'generic') { chrome.textContent = n.cls + (cap ? ' – ' + cap : ''); }
    else if (k === 'sheet') { chrome.style.background = n.color || '#fff'; }
    if (n.nonVisual) { chrome.textContent = n.cls === 'TTimer' ? '⏱' : '⚙'; e.appendChild(el('div', 'nvname', n.name)); }
  }
  function mkInner(n, parent) {
    var k = kind(n.cls);
    var e = el('div', 'ctl k-' + k + (n.family ? ' fam-' + (n.family === 'devexpress' ? 'dx' : 'tms') : '') + (n.container ? ' cont' : '') + (n.visible ? '' : ' hidden') + (n.enabled ? '' : ' disabled') + (n.nonVisual ? ' nonvisual' : ''));
    e.setAttribute('data-name', n.name);
    e.style.left = n.x + 'px'; e.style.top = n.y + 'px';
    e.style.width = (n.nonVisual ? 28 : n.w) + 'px'; e.style.height = (n.nonVisual ? 28 : n.h) + 'px';
    var chrome = el('div', 'chrome');
    e.appendChild(chrome);
    try { content(n, e, chrome); } catch (err) { chrome.textContent = n.cls; }
    if (k === 'generic' && !n.nonVisual) { e.classList.add('unmanaged'); var q = el('span', 'unmgd-badge', '?'); q.title = 'Class not recognised by the designer: drawn as a placeholder, its properties stay exactly as written in the .dfm'; e.appendChild(q); }
    if (Object.keys(n.events).length && !n.nonVisual) { e.appendChild(el('span', 'ev-badge', '⚡')); }
    if (state.names && !n.nonVisual && n.depth > 0) { e.appendChild(el('span', 'nm', n.name)); }
    els[n.name] = e;
    parent.appendChild(e);
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
    }
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
    applyZoom();
    drawSel(); renderOutline(); renderInspector(); renderStatus();
    $('undo').disabled = !state.canUndo; $('redo').disabled = !state.canRedo;
  }
  function applyZoom() {
    var z = state.zoom;
    $('zoomwrap').style.transform = 'scale(' + z + ')';
    var f = $('formframe');
    $('center').style.setProperty('--w', '1');
    $('zoomwrap').style.marginRight = (f.offsetWidth * (z - 1)) + 'px';
    $('zoomwrap').style.marginBottom = (f.offsetHeight * (z - 1)) + 'px';
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
  var ICONS = { button: '🔘', label: '🅰', edit: '▭', memo: '📝', check: '☑', radio: '◉', combo: '▾', list: '☰', panel: '▢', group: '⛶', pages: '🗂', sheet: '📄', grid: '▦', image: '🏞', shape: '◆', bevel: '▬', splitter: '┃', progress: '▰', track: '⎯', datepick: '📅', treeview: '🌳', radiogroup: '◉', statusbar: '▁', toolbar: '▤', scroll: '⬚', listview: '☰', generic: '❓' };
  function iconOf(n) { return n.nonVisual ? '⚙' : (ICONS[kind(n.cls)] || '◻'); }
  function renderPalette() {
    var p = $('palette'); while (p.firstChild) { p.removeChild(p.firstChild); }
    var flt = (state.filter || '').toLowerCase(), grp = state.palGroup || '';
    var groups = [], byGroup = {}, shown = 0;
    state.palette.forEach(function (it) {
      if (!byGroup[it.group]) { byGroup[it.group] = []; groups.push(it.group); }
      if (grp && it.group !== grp) { return; }
      if (flt && it.cls.toLowerCase().indexOf(flt) < 0) { return; }
      byGroup[it.group].push(it); shown++;
    });
    groups.forEach(function (g) {
      var items = byGroup[g];
      if (!items.length) { return; }
      var d = el('details', 'pal-group');
      d.open = flt || grp ? true : state.palOpen[g] !== false;
      d.addEventListener('toggle', function () { if (!flt && !grp) { state.palOpen[g] = d.open; } });
      d.appendChild(el('summary', '', g + ' (' + items.length + ')'));
      var box = el('div', 'pal');
      items.forEach(function (it) {
        var b = el('button', state.tool === it.cls ? 'active' : '', it.icon + ' ' + it.cls.slice(1));
        b.title = it.cls; b.setAttribute('data-tool', it.cls); box.appendChild(b);
      });
      d.appendChild(box); p.appendChild(d);
    });
    $('palcount').textContent = shown + '/' + state.palette.length;
    document.body.classList.toggle('tool-on', !!state.tool);
  }
  function fillPalGroups() {
    var sel = $('palgroup'); while (sel.firstChild) { sel.removeChild(sel.firstChild); }
    var seen = {}; var all = el('option', '', 'All families'); all.value = ''; sel.appendChild(all);
    state.palette.forEach(function (it) { if (!seen[it.group]) { seen[it.group] = 1; var o = el('option', '', it.group); o.value = it.group; sel.appendChild(o); } });
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
    state.listOrder = rows.map(function (n) { return n.name; });
    $('compcount').textContent = rows.length + '/' + nodes.length;
    if (!f.text && !f.type) {
      var rr = el('div', 'rootrow', '⌂ ' + state.model.root.name + ' (form)');
      rr.setAttribute('data-pick', state.model.root.name);
      rr.title = 'The form itself: drop components here to move them out of their container';
      o.appendChild(rr);
    }
    rows.forEach(function (n) {
      var d = el('div', state.sel.indexOf(n.name) >= 0 ? 'sel' : '');
      d.setAttribute('data-pick', n.name);
      d.draggable = true;
      d.title = n.name + ' : ' + n.cls + (n.caption ? ' — ' + n.caption : '');
      d.style.paddingLeft = (tree ? n.depth * 10 : 4) + 'px';
      d.appendChild(el('span', 'ico', iconOf(n)));
      d.appendChild(document.createTextNode(n.name));
      d.appendChild(el('span', 'cls', n.cls));
      if (n.family) { d.appendChild(el('span', 'fam-tag ' + (n.family === 'devexpress' ? 'dx' : 'tms'), n.family === 'devexpress' ? 'DX' : 'TMS')); }
      if (!tree && parentOf[n.name] && parentOf[n.name] !== state.model.root.name) { d.appendChild(el('span', 'par', '↳ ' + parentOf[n.name])); }
      o.appendChild(d);
    });
    if (!rows.length) { o.appendChild(el('div', 'hint', 'No component matches.')); }
    var picked = o.querySelector('.sel');
    if (picked && picked.scrollIntoView) { picked.scrollIntoView({ block: 'nearest' }); }
  }
  /* ───────── drag a row of the components list onto a container row ───────── */
  (function () {
    var oc = $('outline');
    function clearDrop() { Array.prototype.forEach.call(oc.querySelectorAll('.dropok'), function (r) { r.classList.remove('dropok'); }); }
    oc.addEventListener('dragstart', function (ev) {
      var row = ev.target.closest ? ev.target.closest('[data-pick]') : null;
      if (!row || row.getAttribute('data-pick') === rootName()) { ev.preventDefault(); return; }
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
    i.addEventListener('keydown', function (ev) { ev.stopPropagation(); if (ev.key === 'Enter') { commit(); i.blur(); } });
    return i;
  }
  function renderInspector() {
    var box = $('inspector'); while (box.firstChild) { box.removeChild(box.firstChild); }
    if (!state.model) { return; }
    if (state.sel.length === 0) {
      box.appendChild(el('h4', '', 'Form'));
      box.appendChild(el('div', 'hint', state.model.root.name + ' : ' + state.model.root.cls));
      box.appendChild(el('div', 'hint', 'Click a component to select it, drag to move, use the handles to resize. Shift+click adds to the selection. Double-click opens its event handler. Delete removes it.'));
      return;
    }
    if (state.sel.length > 1) {
      box.appendChild(el('h4', '', state.sel.length + ' components'));
      box.appendChild(el('div', 'hint', state.sel.join(', ')));
      box.appendChild(el('div', 'hint', 'Use the Align menu of the toolbar: edges, centres, same size, equal spacing.'));
      return;
    }
    var n = byName[state.sel[0]];
    box.appendChild(el('h4', '', 'Properties'));
    var crumbs = el('div', 'crumbs');
    pathOf(n.name).forEach(function (p, i, arr) {
      if (i) { crumbs.appendChild(document.createTextNode(' › ')); }
      var c = el('span', 'crumb' + (i === arr.length - 1 ? ' cur' : ''), p);
      if (i < arr.length - 1) { c.setAttribute('data-crumb', p); c.title = 'Select ' + p; }
      crumbs.appendChild(c);
    });
    box.appendChild(crumbs);
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
    box.appendChild(field('Parent', psel));
    box.appendChild(field('Name', textInput(n.name, function (v) { post({ type: 'rename', from: n.name, to: v.trim() }); })));
    var clsRow = el('span', 'hint', n.cls);
    if (n.family) { clsRow.appendChild(el('span', 'fam-tag ' + (n.family === 'devexpress' ? 'dx' : 'tms'), n.family === 'devexpress' ? 'DevExpress' : 'TMS')); }
    box.appendChild(field('Class', clsRow));
    var num = function (prop, label, v) { box.appendChild(field(label, textInput(v, function (val) { post({ type: 'setProp', name: n.name, prop: prop, value: Number(val) }); }, 'number'))); };
    var rawNum = function (p) { return n.props[p] !== undefined ? Number(n.props[p]) : undefined; };
    if (!n.docked || n.align === 'alLeft' || n.align === 'alRight') { if (!n.docked) { num('Left', 'Left', rawNum('Left') !== undefined ? rawNum('Left') : n.x); num('Top', 'Top', rawNum('Top') !== undefined ? rawNum('Top') : n.y); } num('Width', 'Width', rawNum('Width') !== undefined ? rawNum('Width') : n.w); }
    if (!n.docked || n.align === 'alTop' || n.align === 'alBottom') { num('Height', 'Height', rawNum('Height') !== undefined ? rawNum('Height') : n.h); }
    if (n.caption !== undefined || ['button', 'label', 'check', 'radio', 'panel', 'group', 'sheet', 'statusbar'].indexOf(kind(n.cls)) >= 0) {
      box.appendChild(field('Caption', textInput(n.caption, function (v) { post({ type: 'setProp', name: n.name, prop: 'Caption', value: v }); })));
    }
    if (n.text !== undefined || ['edit', 'combo'].indexOf(kind(n.cls)) >= 0) {
      box.appendChild(field('Text', textInput(n.text, function (v) { post({ type: 'setProp', name: n.name, prop: 'Text', value: v }); })));
    }
    var al = el('select');
    ['alNone', 'alTop', 'alBottom', 'alLeft', 'alRight', 'alClient'].forEach(function (a) { var o = el('option', '', a); o.value = a; if ((n.props['Align'] || 'alNone') === a) { o.selected = true; } al.appendChild(o); });
    al.addEventListener('change', function () { post({ type: 'setProp', name: n.name, prop: 'Align', value: al.value }); });
    box.appendChild(field('Align', al));
    var ar = el('div', 'row'); ar.appendChild(el('span', '', 'Anchors'));
    ['Left', 'Top', 'Right', 'Bottom'].forEach(function (a) {
      var l = el('label'); var c = el('input'); c.type = 'checkbox'; c.checked = n.anchors.indexOf('ak' + a) >= 0;
      c.addEventListener('change', function () {
        var set = ['Left', 'Top', 'Right', 'Bottom'].filter(function (x) { return x === a ? c.checked : n.anchors.indexOf('ak' + x) >= 0; }).map(function (x) { return 'ak' + x; });
        post({ type: 'setProp', name: n.name, prop: 'Anchors', value: '[' + set.join(', ') + ']' });
      });
      l.appendChild(c); l.appendChild(document.createTextNode(a.charAt(0))); l.title = 'ak' + a; ar.appendChild(l);
    });
    box.appendChild(ar);
    if (n.tab !== undefined) { box.appendChild(field('TabOrder', textInput(n.tab, function (v) { post({ type: 'setProp', name: n.name, prop: 'TabOrder', value: Number(v) }); }, 'number'))); }
    var flags = el('div', 'row'); flags.appendChild(el('span', '', ''));
    [['Visible', n.visible], ['Enabled', n.enabled]].forEach(function (f) {
      var l = el('label'); var c = el('input'); c.type = 'checkbox'; c.checked = f[1];
      c.addEventListener('change', function () { post({ type: 'setProp', name: n.name, prop: f[0], value: c.checked }); });
      l.appendChild(c); l.appendChild(document.createTextNode(f[0] + ' ')); flags.appendChild(l);
    });
    box.appendChild(flags);
    if (kind(n.cls) === 'generic' && !n.nonVisual) {
      box.appendChild(el('div', 'hint', 'This class is not recognised by the designer. It is drawn as a placeholder; only its name, position, size, alignment and visibility are offered here. Every other property stays exactly as written in the .dfm.'));
    }
    box.appendChild(el('h4', '', 'Events'));
    var evs = Object.keys(n.events);
    if (!evs.length) { box.appendChild(el('div', 'hint', 'none — double-click the component to create its default handler')); }
    evs.forEach(function (ev) {
      var d = el('div', 'ev', '⚡ ' + ev + ' → ' + n.events[ev]);
      d.title = 'Open the handler';
      d.addEventListener('click', function () { post({ type: 'open', name: n.name, event: ev }); });
      box.appendChild(d);
    });
    var open = el('button', '', 'Open default handler');
    open.addEventListener('click', function () { post({ type: 'open', name: n.name }); });
    box.appendChild(open);
    var del = el('button', '', '🗑 Delete');
    del.style.marginLeft = '6px';
    del.addEventListener('click', function () { post({ type: 'delete', names: [n.name] }); });
    box.appendChild(del);
  }
  function renderStatus() {
    var m = state.model; if (!m) { return; }
    var count = Object.keys(byName).length - 1;
    var s = m.root.name + ' · ' + count + ' component(s)';
    if (state.sel.length === 1) { var n = byName[state.sel[0]]; s += ' · ' + pathOf(n.name).join(' › ') + ' (' + n.x + ', ' + n.y + ') ' + n.w + '×' + n.h + (n.align ? ' · ' + n.align : ''); }
    else if (state.sel.length > 1) { s += ' · ' + state.sel.length + ' selected'; }
    if (state.tool) { s += ' · tool: ' + state.tool + ' (Esc to cancel)'; }
    $('status').textContent = state.notice ? state.notice : s;
  }

  /* ───────── parents: see where a component lives, and move it somewhere else ───────── */
  var DEPTH_COLORS = ['#e8590c', '#2f9e44', '#9c36b6', '#1971c2', '#f08c00', '#0c8599'];
  function rootName() { return state.model.root.name; }
  function pathOf(name) { var p = [], c = name; while (c) { p.unshift(c); c = parentOf[c]; } return p; }
  function areaOf(name) {
    if (name === rootName()) { return { x: 0, y: 0, w: state.model.width, h: state.model.height }; }
    var e = els[name];
    return e && e.offsetParent !== null ? relRect(e) : null;
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
    return names.every(function (n) { return chain.indexOf(n) < 0; });
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
  function select(names) { state.sel = names; drawSel(); renderOutline(); renderInspector(); renderStatus(); }

  document.addEventListener('mousedown', function (ev) {
    if (ev.button !== 0) { return; }
    var t = ev.target;
    var inClient = t.closest && t.closest('#client');
    var tab = t.closest && t.closest('.tab');
    var pal = t.closest && t.closest('[data-tool]');
    if (pal) { state.tool = state.tool === pal.getAttribute('data-tool') ? null : pal.getAttribute('data-tool'); renderPalette(); renderStatus(); return; }
    var crumb = t.closest && t.closest('[data-crumb]');
    if (crumb) { var cn = crumb.getAttribute('data-crumb'); if (cn === rootName()) { select([]); } else { listClick(cn, ev); } return; }
    var pick = t.closest && t.closest('[data-pick]');
    if (pick) { listClick(pick.getAttribute('data-pick'), ev); return; }
    if (!inClient) { return; }
    $('client').focus();
    state.notice = '';
    if (tab) {
      state.tabs[tab.getAttribute('data-pages')] = tab.getAttribute('data-sheet');
      select([tab.getAttribute('data-pages')]); render(); return;
    }
    var handle = t.closest('.handle');
    if (handle) { startResize(ev, handle.getAttribute('data-h')); return; }
    if (state.tool) { startPlace(ev); return; }
    var ctl = t.closest('.ctl');
    if (!ctl) { startMarquee(ev); return; }
    var name = ctl.getAttribute('data-name');
    if (ev.shiftKey || ev.ctrlKey) {
      var i = state.sel.indexOf(name);
      if (i >= 0) { state.sel.splice(i, 1); } else { state.sel.push(name); }
      select(state.sel.slice()); return;
    }
    if (state.sel.indexOf(name) < 0) { select([name]); }
    startMove(ev);
  });

  function startMove(ev) {
    var names = state.sel.slice();
    var orig = {}; names.forEach(function (n) { orig[n] = { x: byName[n].x, y: byName[n].y }; });
    // Docked components cannot be placed by hand, but they can still be dragged into another container.
    drag = { kind: 'move', sx: ev.clientX, sy: ev.clientY, names: names, orig: orig, moved: false, ddx: 0, ddy: 0, target: null, dockedOnly: !names.every(isFree) };
  }
  function startResize(ev, h) {
    var names = state.sel.slice(); var orig = {};
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
    } else if (drag.kind === 'resize') {
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 2) { return; }
      drag.moved = true;
      drag.names.forEach(function (n) {
        var o = drag.orig[n], r = { x: o.x, y: o.y, w: o.w, h: o.h }, h = drag.h;
        if (h.indexOf('e') >= 0) { r.w = Math.max(4, snap(o.x + o.w + dx, ev) - o.x); }
        if (h.indexOf('s') >= 0) { r.h = Math.max(4, snap(o.y + o.h + dy, ev) - o.y); }
        if (h.indexOf('w') >= 0) { var nx = Math.min(snap(o.x + dx, ev), o.x + o.w - 4); r.w = o.x + o.w - nx; r.x = nx; }
        if (h.indexOf('n') >= 0) { var ny = Math.min(snap(o.y + dy, ev), o.y + o.h - 4); r.h = o.y + o.h - ny; r.y = ny; }
        drag.rects[n] = r;
        var e = els[n];
        if (!byName[n].docked) { e.style.left = r.x + 'px'; e.style.top = r.y + 'px'; }
        e.style.width = r.w + 'px'; e.style.height = r.h + 'px';
      });
      drawSel();
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
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') { return; }
    if (ev.key === 'F12') { post({ type: 'openCode' }); ev.preventDefault(); return; }
    if (ev.key === 'Escape') { if (state.tool) { state.tool = null; renderPalette(); renderStatus(); } else { selectParent(); } return; }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'z' || ev.key === 'Z')) { post({ type: ev.shiftKey ? 'redo' : 'undo' }); ev.preventDefault(); return; }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'y' || ev.key === 'Y')) { post({ type: 'redo' }); ev.preventDefault(); return; }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'a' || ev.key === 'A') && state.model) { select(state.model.root.children.map(function (c) { return c.name; })); ev.preventDefault(); return; }
    if (!state.sel.length) { return; }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { post({ type: 'delete', names: state.sel.slice() }); ev.preventDefault(); return; }
    var step = ev.shiftKey ? (state.grid || 8) : 1, mx = 0, my = 0;
    if (ev.key === 'ArrowLeft') { mx = -step; } else if (ev.key === 'ArrowRight') { mx = step; } else if (ev.key === 'ArrowUp') { my = -step; } else if (ev.key === 'ArrowDown') { my = step; } else { return; }
    ev.preventDefault();
    if (!state.sel.every(isFree)) { return; }
    if (ev.ctrlKey) {
      post({ type: 'resize', changes: state.sel.map(function (n) { var b = byName[n]; return { name: n, left: b.x, top: b.y, width: Math.max(4, b.w + mx), height: Math.max(4, b.h + my) }; }) });
    } else {
      post({ type: 'move', changes: state.sel.map(function (n) { var b = byName[n]; return { name: n, left: b.x + mx, top: b.y + my }; }) });
    }
  });

  /* ───────── toolbar ───────── */
  $('zoom').addEventListener('change', function () { state.zoom = Number($('zoom').value); applyZoom(); drawSel(); });
  $('grid').addEventListener('change', function () { state.grid = Number($('grid').value); });
  $('names').addEventListener('change', function () { state.names = $('names').checked; render(); });
  $('showparents').addEventListener('change', function () { state.showParents = $('showparents').checked; drawSel(); });
  $('client').addEventListener('mouseleave', function () { state.hover = null; drawHover(); });
  $('undo').addEventListener('click', function () { post({ type: 'undo' }); });
  $('redo').addEventListener('click', function () { post({ type: 'redo' }); });
  $('opencode').addEventListener('click', function () { post({ type: 'openCode' }); });
  $('opendfm').addEventListener('click', function () { post({ type: 'openDfm' }); });
  $('alignbtn').addEventListener('click', function () {
    if (state.sel.length < 2) { state.notice = 'Select two or more components to align (Shift+click, or drag a rectangle).'; renderStatus(); return; }
    post({ type: 'align', op: $('alignop').value, names: state.sel.slice() });
  });
  $('palfilter').addEventListener('input', function () { state.filter = $('palfilter').value.trim(); renderPalette(); });
  $('palgroup').addEventListener('change', function () { state.palGroup = $('palgroup').value; renderPalette(); });
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
    if (m.type === 'model') {
      state.model = m.model;
      if (m.palette && !state.palette.length) { state.palette = m.palette; fillPalGroups(); renderPalette(); }
      if (m.ops && !state.ops.length) {
        state.ops = m.ops;
        m.ops.forEach(function (o) { var op = el('option', '', o.label); op.value = o.id; $('alignop').appendChild(op); });
      }
      state.canUndo = !!m.canUndo; state.canRedo = !!m.canRedo; state.notice = m.notice || '';
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
