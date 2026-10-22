import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as vm from 'vm';
import { PALETTE, designerHtml } from '../webview/designerHtml';
import { COMPONENTS, handlerName, resolveComponentDef } from '../services/DelphiForm';
import { DEVEXPRESS, TMS, familyOf } from '../services/DelphiThirdParty';

test('the designer webview script is valid JavaScript, has a CSP nonce and uses no external resource', () => {
    const html = designerHtml('N0NCE');
    const script = html.match(/<script nonce="N0NCE">([\s\S]*)<\/script>/);
    assert.ok(script, 'inline script present');
    assert.doesNotThrow(() => new vm.Script(script![1]), 'the script parses');
    assert.match(html, /script-src 'nonce-N0NCE'/);
    assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=|https?:\/\//, 'nothing is loaded from outside');
    assert.match(html, /function mk\(n, parent\)\s*\{\s*try/, 'every component is drawn inside a try/catch');
    assert.match(html, /unmanaged/, 'unknown classes are marked');
});

test('the palette offers the VCL, DevExpress and TMS, without pages that cannot be dropped alone', () => {
    const groups = new Set(PALETTE.map(p => p.group));
    for (const g of ['Standard', 'Additional', 'Win32', 'System', 'DevExpress', 'TMS']) { assert.ok(groups.has(g), g); }
    const classes = PALETTE.map(p => p.cls);
    for (const c of ['TcxButton', 'TcxGrid', 'TcxPageControl', 'TcxLookupComboBox', 'TAdvStringGrid', 'TAdvOfficePager', 'TAdvGlowButton']) { assert.ok(classes.includes(c), c); }
    assert.ok(!classes.includes('TcxTabSheet') && !classes.includes('TAdvOfficePage'));
    assert.equal(new Set(classes).size, classes.length, 'no duplicates');
});

test('third-party catalog: well formed, units without the Vcl. scope, nested events', () => {
    for (const d of [...DEVEXPRESS, ...TMS]) {
        assert.match(d.className, /^T[A-Za-z]+$/, d.className);
        assert.ok(d.unit && !/^Vcl\.[a-z]/.test(d.unit) || d.unit.startsWith('VCL.'), d.className + ' unit');
        for (const e of d.events) { assert.match(e.name, /^(?:[A-Za-z]\w*\.)?On[A-Z]\w*$/, d.className + ' ' + e.name); }
        assert.ok(COMPONENTS.includes(d), d.className + ' is in the catalog');
        assert.ok(familyOf(d.className), d.className + ' family');
    }
    assert.equal(familyOf('TButton'), undefined);
    assert.equal(familyOf('TcxGrid'), 'devexpress');
    assert.equal(familyOf('TAdvEdit'), 'tms');
    assert.equal(handlerName('cxTextEdit1', 'Properties.OnChange'), 'cxTextEdit1PropertiesChange');
    assert.equal(handlerName('Button1', 'OnClick'), 'Button1Click');
    assert.ok(resolveComponentDef('TcxGrid').extraUnits!.includes('cxGridLevel'));
});

import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits } from '../services/DelphiForm';
import { findNode, parseDfmTree, planAddComponent } from '../services/DelphiLayout';
import { planAddEvent } from '../services/DelphiEvents';
import { checkForm } from '../services/DelphiCheck';

test('add a DevExpress edit with its Properties.OnChange handler and the units the IDE would add', () => {
    const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
    const dfm = fs.readFileSync(path.join(dir, 'ThirdPartyForm.dfm'), 'utf8');
    const pas = fs.readFileSync(path.join(dir, 'ThirdPartyForm.pas'), 'utf8');
    assert.equal(checkForm(pas, dfm).filter(i => i.severity !== 'info').length, 0, 'the fixture is a consistent form');

    const p = planAddComponent(pas, dfm, { className: 'TcxCheckListBox', name: 'cxCheckListBox1', eventName: 'OnClickCheck', parentName: 'cxTabSheet1', side: 'auto', position: { left: 520, top: 16 } });
    assert.ok(!('error' in p), 'error' in p ? p.error : '');
    const ok = p as { dfmEdit: never; pasEdits: never[] };
    const outDfm = applyTextEdits(dfm, [ok.dfmEdit]);
    const node = findNode(parseDfmTree(outDfm)!, 'cxCheckListBox1')!;
    assert.equal(node.parent?.name, 'cxTabSheet1');
    assert.deepEqual([node.left, node.top], [520, 16]);
    assert.equal(node.props['OnClickCheck'], 'cxCheckListBox1ClickCheck');
    const outPas = applyTextEdits(pas, ok.pasEdits);
    assert.match(outPas, /cxCheckListBox1: TcxCheckListBox;/);
    assert.match(outPas, /, cxCheckListBox\b/, 'its unit was added');
    assert.doesNotMatch(outPas, /Vcl\.cx/);
    assert.equal((outPas.match(/\bcxEdit\b/g) ?? []).length, 1, 'units already present are not repeated');

    const ev = planAddEvent(pas, dfm, { componentName: 'cxComboBox1', eventName: 'Properties.OnChange' });
    assert.ok(!('error' in ev), 'error' in ev ? ev.error : '');
    const e = ev as { dfmEdit: never; pasEdits: never[]; handler: string };
    assert.equal(e.handler, 'TThirdPartyForm.cxComboBox1PropertiesChange');
    assert.match(applyTextEdits(dfm, [e.dfmEdit]), /Properties\.OnChange = cxComboBox1PropertiesChange/);
    assert.match(applyTextEdits(pas, e.pasEdits), /procedure cxComboBox1PropertiesChange\(Sender: TObject\);/);
});

test('components list: filter by name and type, sort, flat / tree; palette: one list per type', () => {
    const html = designerHtml('N');
    for (const id of ['cfname', 'cftype', 'cfsort', 'cfflat', 'compcount', 'palfilter', 'palgroup', 'palcount']) { assert.ok(html.includes(`id="${id}"`), id); }
    for (const v of ['@container', '@nonvisual', '@events', '@unknown', '@dx', '@tms']) { assert.ok(html.includes(`'${v}'`), 'type filter ' + v); }
    assert.match(html, /function revealNode/, 'a component on a hidden page is revealed from the list');
    assert.doesNotMatch(html, /F12/, 'F12 is no longer the way back to the code: it is Ctrl+K Ctrl+B');
    assert.match(html, /Ctrl\+K Ctrl\+B/, 'the shortcut is shown on the Code button');
    // the palette no longer dumps every component: only the chosen type is listed, a name filter searches them all
    assert.match(html, /\(flt \? groups : \[state\.palGroup\]\)/, 'one type at a time, unless a name is being searched');
    assert.doesNotMatch(html, /All families/, 'there is no "all" entry any more');
    assert.doesNotMatch(html, /el\('details', 'pal-group'/, 'no stacked collapsible families');
    assert.match(html, /g \+ ' \(' \+ count\[g\] \+ '\)'/, 'the type list shows how many components each type has');
});

test('designer ⇄ code navigation and empty-handler clean-up are wired in package.json', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('../../package.json');
    const props = pkg.contributes.configuration.properties;
    assert.equal(props['ce.delphi.removeEmptyHandlers'].default, true);
    assert.deepEqual(props['ce.delphi.designerColumn'].enum, ['active', 'beside']);
    assert.ok(pkg.contributes.commands.some((c: { command: string }) => c.command === 'ce.delphi.toggleDesigner'));
    const key = pkg.contributes.keybindings.find((k: { command: string }) => k.command === 'ce.delphi.toggleDesigner');
    assert.match(key.when, /activeWebviewPanelId == 'ceFormDesigner'/, 'the shortcut also works from inside the designer');
    assert.ok(pkg.contributes.menus['editor/title'].some((m: { command: string }) => m.command === 'ce.delphi.designer'), 'a title-bar button leads back to the designer');
});

test('parents are easy to spot and components easy to move between them', () => {
    const html = designerHtml('N');
    // where does it live: parent outlined and named, breadcrumb, containers toggle, hover tag
    assert.match(html, /\.pbox \{[^}]*dashed/, 'the parent of the selection is outlined');
    assert.match(html, /'⬑ parent: '/, 'and named');
    assert.match(html, /Outline of the containers/, 'the containers toggle is in the View menu');
    for (const id of ['viewbtn', 'hov', 'droplabel']) { assert.ok(html.includes(`id="${id}"`), id); }
    assert.match(html, /data-crumb/, 'the breadcrumb is clickable');
    assert.match(html, /DEPTH_COLORS/, 'containers are coloured by depth');
    // how to move it: drop highlight + label, inspector select, list drag & drop, docked controls too, Esc = parent
    assert.match(html, /\.ctl\.droptarget::after/, 'the drop target is highlighted');
    assert.match(html, /↳ Drop into /);
    assert.match(html, /dockedOnly/, 'docked controls can be dragged to another container');
    assert.match(html, /box\.appendChild\(labelled\('Parent', psel\)\)/, 'the inspector has a Parent selector');
    assert.match(html, /addEventListener\('dragstart'/, 'list rows can be dragged');
    assert.match(html, /d\.draggable = true/);
    assert.match(html, /function canDropInto/, 'never into itself or one of its own children');
    assert.match(html, /function selectParent/);
    assert.doesNotThrow(() => new vm.Script(html.match(/<script nonce="N">([\s\S]*)<\/script>/)![1]));
});

test('selection is unmistakable: above every control, strong outline, handles, name tag, highlighted list row', () => {
    const html = designerHtml('N');
    assert.match(html, /#overlay \{[^}]*z-index: 1000/, 'the overlay paints above the controls (it used to sit under them)');
    assert.match(html, /\.selbox\.primary \{ outline: 3px solid/);
    assert.match(html, /\.handle \{[^}]*width: 9px/);
    assert.match(html, /\.sellabel/);
    assert.match(html, /\.outline div\.sel \{[^}]*#0a84ff/, 'the selected list row has a visible fallback colour');
    assert.match(html, /state\.sel\.length \+ ' selected/);
});

test('room for complex forms: each side panel hides, Fit window scales the form, Full screen hides everything', () => {
    const html = designerHtml('N');
    for (const id of ['togleft', 'togright', 'full', 'edgeL', 'edgeR']) { assert.ok(html.includes(`id="${id}"`), id); }
    assert.match(html, /body\.hide-left #left, body\.hide-right #right \{ display: none; \}/, 'the panels hide');
    assert.match(html, /body\.hide-left #edgeL, body\.hide-right #edgeR \{ display: block; \}/, 'a tab on the edge brings a hidden panel back');
    assert.match(html, /<option value="fit">Fit window<\/option>/);
    assert.match(html, /function fitZoom/);
    assert.match(html, /new ResizeObserver/, 'the fit follows the room left by the panels and the window');
    assert.match(html, /vscode\.setState\(\{ left: state\.ui\.left, right: state\.ui\.right/, 'the choice is remembered');
    assert.match(html, /post\(\{ type: 'fullscreen', on: on \}\)/, 'full screen asks VS Code for its Zen mode');
    for (const key of ["k0 === 'p'", "k0 === 'i'", "k0 === 'f'"]) { assert.ok(html.includes(key), 'shortcut ' + key); }
    assert.doesNotThrow(() => new vm.Script(html.match(/<script nonce="N">([\s\S]*)<\/script>/)![1]));
});

import { ALIGN_OPS } from '../services/DelphiAlign';

test('toolbar: align operations are icon buttons, one per operation, and the old menu is gone', () => {
    const html = designerHtml('N');
    assert.ok(html.includes('id="alignbar"'));
    assert.doesNotMatch(html, /id="alignop"|id="alignbtn"/, 'no select + Apply any more');
    for (const op of ALIGN_OPS) { assert.ok(html.includes(`    ${op.id}: '<`), 'an icon for ' + op.id); }
    assert.match(html, /function buildAlignBar/);
    assert.match(html, /function updateAlignBar/, 'enabled only with enough components selected');
    assert.match(html, /\.aico rect \{ fill: currentColor/, 'icons follow the theme colour');
    for (const group of ['class="tg"', 'class="tg end"']) { assert.ok(html.includes(group), group); }
});

test('inspector: sections, one drop-down for the events, grid parts and the how-to when nothing is selected', () => {
    const html = designerHtml('N');
    for (const title of ["'Position & size'", "'Content'", "'State'", "'Events'", "'Column'"]) { assert.ok(html.includes(title), title); }
    assert.match(html, /el\('details', 'insec'\)/, 'collapsible sections');
    assert.match(html, /el\('select', 'evsel'\)/, 'one drop-down for the events');
    assert.match(html, /g1\.label = 'Create a handler'/);
    assert.match(html, /g2\.label = 'Open the code of'/);
    assert.match(html, /'open the code after creating'/);
    assert.match(html, /function formInfo/, 'a how-to when nothing is selected');
    assert.doesNotMatch(html, /class="ev"|'⚡ ' \+ ev/, 'the old clickable list of events is gone');
    // the name of a component in the card must not reuse the class of the name tags drawn on the form
    assert.match(html, /el\('div', 'iname', n\.name\)/);
    // DevExpress grid parts
    for (const k of ["'gridcolumn'", "'gridview'", "'gridlevel'"]) { assert.ok(html.includes(k), k); }
    assert.match(html, /\.k-gridcolumn \.gh/);
    assert.match(html, /if \(n\.structural\) \{ e\.style\.display = 'none'/, 'structure is listed, never painted');
    assert.match(html, /HOST_LABEL = \{ tile: 'a TdxTileControl', grid: 'a TcxGrid', view: 'a grid view', dataset: 'a dataset', menu: 'a menu or a menu item' \}/);
    assert.match(html, /function hostFromElement/);
    for (const prop of ["'DataBinding.FieldName'", "'GridView'"]) { assert.ok(html.includes(prop), prop); }
    assert.doesNotThrow(() => new vm.Script(html.match(/<script nonce="N">([\s\S]*)<\/script>/)![1]));
});

test('the inspector fields leave their keys to VS Code, so Ctrl+K Ctrl+B works while text is selected in one', () => {
    const html = designerHtml('N');
    assert.doesNotMatch(html, /stopPropagation/, 'no field of the designer swallows the keyboard events VS Code reads its shortcuts from');
    assert.match(html, /The keys are left to bubble/);
    assert.match(html, /Ctrl\+K Ctrl\+B/);
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
    const bind = pkg.contributes.keybindings.find((k: { key: string }) => k.key === 'ctrl+k ctrl+b');
    assert.match(bind.when, /activeWebviewPanelId == 'ceFormDesigner'/, 'the shortcut belongs to the designer panel by its id');
});

test('components list: containers fold and unfold, with expand all / collapse all, kept with the interface state', () => {
    const html = designerHtml('N');
    assert.match(html, /data-twist/, 'a twisty on every container row');
    assert.match(html, /function toggleCollapse/);
    assert.match(html, /function collapseAll\(on\)/);
    assert.ok(html.includes('id="cexp"') && html.includes('id="ccol"'), 'expand all / collapse all');
    assert.match(html, /hideBelow = state\.collapsed\[n\.name\] && hasKids\[n\.name\] \? n\.depth : -1/, 'the children of a folded row are not listed');
    assert.match(html, /a selection made elsewhere \(on the form\) opens the containers above it/);
    assert.match(html, /collapsed: state\.collapsed/, 'remembered with the rest of the interface state');
    assert.doesNotThrow(() => new vm.Script(html.match(/<script nonce="N">([\s\S]*)<\/script>/)![1]));
});

test('the palette and the inspector are resized with the mouse (bars between them and the form)', () => {
    const html = designerHtml('N');
    assert.ok(html.includes('id="splitL"') && html.includes('id="splitR"'), 'one bar on each side');
    assert.match(html, /#left, #right \{ width: var\(--wl, 210px\)/);
    assert.match(html, /width: var\(--wr, 240px\)/);
    assert.match(html, /addEventListener\('pointerdown'/);
    assert.match(html, /setPointerCapture/, 'the drag goes on outside the bar');
    assert.match(html, /addEventListener\('dblclick', function \(\) \{ setPanelWidth\(key, 0\)/, 'double-click gives the default width back');
    assert.match(html, /wl: state\.ui\.wl, wr: state\.ui\.wr/, 'widths are remembered');
    assert.match(html, /body\.hide-left #splitL, body\.hide-right #splitR \{ display: none; \}/, 'no bar next to a hidden panel');
    assert.match(html, /#outline \{[^}]*resize: vertical/, 'the component list is also resizable in height');
});

test('copy, cut and paste: copies are pasted into the chosen container, a cut moves the very same components', () => {
    const html = designerHtml('N');
    for (const id of ['copy', 'cut', 'paste']) { assert.ok(html.includes(`id="${id}"`), id); }
    assert.match(html, /doCopy\(kc === 'x'\)/);
    assert.match(html, /post\(\{ type: cut \? 'cut' : 'copy', names: state\.sel\.slice\(\) \}\)/);
    assert.match(html, /post\(\{ type: 'paste', target: prim && byName\[prim\] \? prim : rootName\(\) \}\)/, 'pasted into the selected container, else around the selected component, else the form');
    assert.match(html, /\.ctl\.cutmark \{ opacity: 0\.4/, 'a cut component is dimmed until it is pasted');
    assert.match(html, /clearCut\(true\)/, 'Esc cancels a cut');
    for (const type of ['copy', 'cut', 'paste', 'uncut', 'save']) {
        const panel = fs.readFileSync(path.join(__dirname, '..', 'webview', 'FormDesignerPanel.ts'), 'utf8');
        assert.ok(panel.includes(`case '${type}'`), 'the panel handles ' + type);
    }
});

test('save: a button and Ctrl+S save the .dfm and the .pas together, the button shows unsaved changes', () => {
    const html = designerHtml('N');
    assert.ok(html.includes('id="save"') && html.includes('id="dirty"'));
    assert.match(html, /Ctrl\+S saves both files, also from a field of the inspector/);
    assert.match(html, /post\(\{ type: 'save' \}\)/);
    assert.match(html, /function showDirty/);
    assert.match(html, /state\.dirty = !!m\.dirty/);
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
    assert.equal(pkg.contributes.configuration.properties['ce.delphi.designerAutoSave'].default, false);
});

test('the form scrolls and zooms: visible scroll bars, Ctrl + wheel between 25% and 300%, middle-button pan, grid scroll bars', () => {
    const html = designerHtml('N');
    assert.match(html, /#center::-webkit-scrollbar-thumb, /,'scroll bars of the theme colours, wide enough to grab');
    assert.match(html, /\$\('center'\)\.addEventListener\('wheel'[\s\S]*?ctrlKey \|\| ev\.metaKey[\s\S]*?preventDefault\(\)[\s\S]*?\{ passive: false \}/, 'Ctrl + wheel is handled, and the page is scrolled by the plain wheel as before');
    assert.match(html, /Math\.max\(0\.25, Math\.min\(3,/, 'the zoom is kept between 25% and 300%');
    assert.match(html, /<option id="zoomcustom" value="custom" hidden>/, 'a zoom that is not a preset gets a line of its own');
    assert.match(html, /ev\.button !== 1/, 'the middle button pans');
    assert.match(html, /\.dxvs \{/);
    assert.match(html, /'dxvs'/);
    assert.match(html, /'dxhs'/);
});
