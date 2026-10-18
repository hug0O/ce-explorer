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

test('components list: filter by name and type, sort, flat / tree; palette: collapsible families with filters', () => {
    const html = designerHtml('N');
    for (const id of ['cfname', 'cftype', 'cfsort', 'cfflat', 'compcount', 'palfilter', 'palgroup', 'palcount']) { assert.ok(html.includes(`id="${id}"`), id); }
    for (const v of ['@container', '@nonvisual', '@events', '@unknown', '@dx', '@tms']) { assert.ok(html.includes(`'${v}'`), 'type filter ' + v); }
    assert.match(html, /function revealNode/, 'a component on a hidden page is revealed from the list');
    assert.match(html, /createElement\('details'|el\('details'/, 'palette families collapse');
    assert.match(html, /key === 'F12'/, 'F12 goes back to the code');
});

test('designer ⇄ code navigation and empty-handler clean-up are wired in package.json', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('../../package.json');
    const props = pkg.contributes.configuration.properties;
    assert.equal(props['mmx.delphi.removeEmptyHandlers'].default, true);
    assert.deepEqual(props['mmx.delphi.designerColumn'].enum, ['active', 'beside']);
    assert.ok(pkg.contributes.commands.some((c: { command: string }) => c.command === 'mmx.delphi.toggleDesigner'));
    const key = pkg.contributes.keybindings.find((k: { command: string }) => k.command === 'mmx.delphi.toggleDesigner');
    assert.match(key.when, /activeWebviewPanelId == 'mmxFormDesigner'/, 'the shortcut also works from inside the designer');
    assert.ok(pkg.contributes.menus['editor/title'].some((m: { command: string }) => m.command === 'mmx.delphi.designer'), 'a title-bar button leads back to the designer');
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
