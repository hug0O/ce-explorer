import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits } from '../services/DelphiForm';
import {
    computePlacement, findNode, listContainers, parseDfmTree, planAddComponent, AddComponentPlan,
} from '../services/DelphiLayout';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(dir, 'LayoutForm.dfm'), 'utf8');
const pas = fs.readFileSync(path.join(dir, 'LayoutForm.pas'), 'utf8');

function plan(req: Parameters<typeof planAddComponent>[2]): Extract<AddComponentPlan, { pasEdits: unknown }> {
    const p = planAddComponent(pas, dfm, req);
    assert.ok(!('error' in p), 'error' in p ? p.error : '');
    return p as Extract<AddComponentPlan, { pasEdits: unknown }>;
}

test('parseDfmTree reads the hierarchy, geometry and docking', () => {
    const root = parseDfmTree(dfm)!;
    assert.equal(root.name, 'LayoutForm');
    assert.deepEqual(root.children.map(c => c.name), ['pnlSaisie', 'pnlBoutons']);
    const ok = findNode(root, 'btnOk')!;
    assert.equal(ok.parent?.name, 'pnlBoutons');
    assert.deepEqual([ok.left, ok.top, ok.width, ok.height], [152, 8, 75, 25]);
    assert.equal(findNode(root, 'pnlBoutons')!.align, 'alBottom');
    assert.equal(findNode(root, 'edtNom')!.align, undefined);
});

test('parseDfmTree is not fooled by object/end lines inside a string list', () => {
    const root = parseDfmTree(dfm)!;
    assert.deepEqual(findNode(root, 'pnlSaisie')!.children.map(c => c.name), ['lblNom', 'edtNom', 'memNotes']);
    assert.equal(findNode(root, 'memNotes')!.props['TabOrder'], '1', 'properties after the list are still read');
    assert.deepEqual(listContainers(root).map(c => c.node.name), ['LayoutForm', 'pnlSaisie', 'pnlBoutons']);
});

test('placement: right of a control, vertically centred on it', () => {
    const root = parseDfmTree(dfm)!;
    const p = computePlacement(75, 25, findNode(root, 'pnlBoutons')!, findNode(root, 'btnAnnuler')!, 'right');
    assert.deepEqual(p, { left: 233 + 75 + 8, top: 8 });
    const label = computePlacement(35, 13, findNode(root, 'pnlSaisie')!, findNode(root, 'edtNom')!, 'left');
    assert.deepEqual(label, { left: 56 - 35 - 8, top: 16 + 5 }, 'a 13px label centred on the 23px edit');
});

test('placement: below / above keep the left edges aligned', () => {
    const root = parseDfmTree(dfm)!;
    const panel = findNode(root, 'pnlSaisie')!;
    assert.deepEqual(computePlacement(121, 23, panel, findNode(root, 'edtNom')!, 'above'), { left: 56, top: 8 }, 'clamped to the margin');
    assert.deepEqual(computePlacement(75, 25, panel, findNode(root, 'memNotes')!, 'below'), { left: 16, top: 48 + 41 + 8 });
});

test('placement: a docked reference gives a docked component continuing the stack', () => {
    const root = parseDfmTree(dfm)!;
    const p = computePlacement(100, 20, root, findNode(root, 'pnlSaisie')!, 'below');
    assert.deepEqual(p, { left: 0, top: 100, align: 'alTop' });
});

test('plan: a button placed right of btnAnnuler lands inside pnlBoutons, wired to its handler', () => {
    const p = plan({ className: 'TButton', name: 'btnAppliquer', eventName: 'OnClick', refName: 'btnAnnuler', side: 'right' });
    const outDfm = applyTextEdits(dfm, [p.dfmEdit]);
    const lines = outDfm.split('\n');
    const at = lines.findIndex(l => l.includes('object btnAppliquer: TButton'));
    assert.ok(at > lines.findIndex(l => l.includes('object btnAnnuler')));
    assert.equal(lines[at], '    object btnAppliquer: TButton', 'indented as a grandchild of the form');
    assert.match(outDfm, /Left = 316\r?\n\s+Top = 8/);
    assert.match(outDfm, /TabOrder = 2/, 'next tab index among its siblings');
    assert.match(outDfm, /OnClick = btnAppliquerClick/);
    assert.ok(lines.lastIndexOf('  end') > at, 'still closed by pnlBoutons end');

    const outPas = applyTextEdits(pas, p.pasEdits);
    assert.match(outPas, /btnAppliquer: TButton;/);
    assert.match(outPas, /procedure TLayoutForm\.btnAppliquerClick\(Sender: TObject\);/);
});

test('plan: any class can be added, with its own unit and event', () => {
    const p = plan({ className: 'TSpinEdit', unit: 'Samples.Spin', name: 'spnAge', eventName: 'OnChange', parentName: 'pnlSaisie', refName: 'edtNom', side: 'below' });
    assert.match(applyTextEdits(pas, p.pasEdits), /Vcl\.ExtCtrls, Samples\.Spin;[\s\S]*spnAge: TSpinEdit;/);
    assert.match(applyTextEdits(dfm, [p.dfmEdit]), /object spnAge: TSpinEdit\r?\n\s+Left = 56\r?\n\s+Top = 47/);
    const grid = plan({ className: 'TStringGrid', name: 'grid1', eventName: 'OnSelectCell', side: 'auto' });
    assert.match(applyTextEdits(pas, grid.pasEdits), /procedure grid1SelectCell\(Sender: TObject; ACol, ARow: LongInt; var CanSelect: Boolean\);/);
});

test('plan: a component with the reference in another container follows the reference', () => {
    const p = plan({ className: 'TButton', name: 'btnAide', refName: 'btnOk', side: 'left' });
    assert.match(applyTextEdits(dfm, [p.dfmEdit]), /\n {4}object btnAide: TButton/);
});

test('plan: rejects duplicate names, bad identifiers and unknown containers', () => {
    const err = (req: Parameters<typeof planAddComponent>[2]) => (planAddComponent(pas, dfm, req) as { error: string }).error;
    assert.match(err({ className: 'TButton', name: 'BTNOK', side: 'auto' }), /already used/);
    assert.match(err({ className: 'TButton', name: '1x', side: 'auto' }), /valid Pascal identifier/);
    assert.match(err({ className: 'TButton', name: 'b1', parentName: 'nope', side: 'auto' }), /not found/);
    assert.match(err({ className: 'TButton', name: 'b1', eventName: 'Click', side: 'auto' }), /OnXxx/);
});

import { planAddEvent, eventsForClass, wiredEvents } from '../services/DelphiEvents';

function eventPlan(req: Parameters<typeof planAddEvent>[2], pasText = pas) {
    const p = planAddEvent(pasText, dfm, req);
    assert.ok(!('error' in p), 'error' in p ? p.error : '');
    return p as Extract<ReturnType<typeof planAddEvent>, { handler: string }>;
}

test('event on an existing control: dfm link + handler stub, no second field', () => {
    const p = eventPlan({ componentName: 'edtNom', eventName: 'OnChange' });
    assert.equal(p.alreadyWired, false);
    assert.equal(p.handler, 'TLayoutForm.edtNomChange');
    const outDfm = applyTextEdits(dfm, [p.dfmEdit!]);
    assert.match(outDfm, /Height = 23\r?\n {6}TabOrder = 0\r?\n {6}OnChange = edtNomChange\r?\n {4}end/);
    const outPas = applyTextEdits(pas, p.pasEdits);
    assert.equal((outPas.match(/edtNom: TEdit;/g) ?? []).length, 1, 'field untouched');
    assert.match(outPas, /procedure edtNomChange\(Sender: TObject\);/);
    assert.match(outPas, /procedure TLayoutForm\.edtNomChange\(Sender: TObject\);\r?\nbegin/);
    assert.ok(outPas.indexOf('procedure edtNomChange') > outPas.indexOf('procedure btnAnnulerClick'));
});

test('event already wired: nothing to edit, just reach the existing handler', () => {
    const p = eventPlan({ componentName: 'btnOk', eventName: 'OnClick' });
    assert.equal(p.alreadyWired, true);
    assert.equal(p.handler, 'TLayoutForm.btnOkClick');
    assert.deepEqual(p.pasEdits, []);
    assert.equal(p.dfmEdit, undefined);
    assert.deepEqual(wiredEvents(parseDfmTree(dfm)!.children[1].children[0]), { OnClick: 'btnOkClick' });
});

test('event on a container goes before its first child; the form itself accepts OnShow / OnClose', () => {
    const panel = eventPlan({ componentName: 'pnlSaisie', eventName: 'OnClick' });
    assert.match(applyTextEdits(dfm, [panel.dfmEdit!]), /TabOrder = 0\r?\n {4}OnClick = pnlSaisieClick\r?\n {4}object lblNom/);
    const form = eventPlan({ componentName: 'LayoutForm', eventName: 'OnClose' });
    assert.match(applyTextEdits(dfm, [form.dfmEdit!]), /TextHeight = 15\r?\n {2}OnClose = LayoutFormClose\r?\n {2}object pnlSaisie/);
    assert.match(applyTextEdits(pas, form.pasEdits), /procedure TLayoutForm\.LayoutFormClose\(Sender: TObject; var Action: TCloseAction\);/);
    assert.ok(eventsForClass('TForm1', true).includes('OnShow'));
    assert.ok(eventsForClass('TButton').includes('OnClick'));
});

test('event whose handler already exists in the unit only gets linked in the dfm', () => {
    const withHandler = pas
        .replace('    procedure btnAnnulerClick(Sender: TObject);', '    procedure btnAnnulerClick(Sender: TObject);\n    procedure shared(Sender: TObject);')
        .replace('end.', 'procedure TLayoutForm.shared(Sender: TObject);\nbegin\nend;\n\nend.');
    const p = planAddEvent(withHandler, dfm, { componentName: 'edtNom', eventName: 'OnClick', methodName: 'shared' }) as any;
    assert.deepEqual(p.pasEdits, [], 'declaration and implementation are reused');
    assert.match(applyTextEdits(dfm, [p.dfmEdit]), /OnClick = shared/);
});

test('event errors: unknown component, bad event name', () => {
    assert.match((planAddEvent(pas, dfm, { componentName: 'nope', eventName: 'OnClick' }) as { error: string }).error, /not found/);
    assert.match((planAddEvent(pas, dfm, { componentName: 'edtNom', eventName: 'click' }) as { error: string }).error, /OnXxx/);
});
