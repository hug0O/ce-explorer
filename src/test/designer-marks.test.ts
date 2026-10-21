import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeMarks } from '../services/DesignerStore';
import { bodyLines, handlerPreviews } from '../services/DesignerPreview';
import { parseDfmTree, findNode } from '../services/DelphiLayout';
import { designerHtml } from '../webview/designerHtml';

const PAS = [
    'unit U;', 'interface', 'type', '  TF = class(TForm)', '    btnOk: TButton;', '    btnEmpty: TButton;', '    btnMissing: TButton;', '    procedure btnOkClick(Sender: TObject);', '    procedure btnEmptyClick(Sender: TObject);', '    procedure btnMissingClick(Sender: TObject);', '  end;',
    'implementation',
    'procedure TF.btnOkClick(Sender: TObject);', 'var', '  i: Integer;', 'begin', '  // save it', '  i := 1;', '  Save(i);', '  Close;', '  A;', '  B;', '  C;', '  D;', '  E;', '  F;', 'end;', '',
    'procedure TF.btnEmptyClick(Sender: TObject);', 'begin', '  // todo', 'end;', '',
    'end.',
].join('\n');
const DFM = ['object F: TF', '  object btnOk: TButton', '    OnClick = btnOkClick', '    OnEnter = btnMissingClick', '  end', '  object btnEmpty: TButton', '    OnClick = btnEmptyClick', '  end', 'end'].join('\n');

test('the first lines of a handler, without its header, its variables and its end', () => {
    const b = bodyLines('procedure TF.X(Sender: TObject);\nvar\n  i: Integer;\nbegin\n  a;\n\n  b;\n  c;\nend;\n', 2);
    assert.deepEqual(b, { lines: ['  a;', '', '  b;'].slice(0, 2), more: true, empty: false });
    assert.deepEqual(bodyLines('procedure TF.Y;\nbegin\n  // nothing yet\nend;\n', 8), { lines: ['  // nothing yet'], more: false, empty: true });
    assert.equal(bodyLines('procedure TF.Z;\nbegin\nend;\n', 8).empty, true);
});

test('the handlers of a component: found, empty, or with no implementation', () => {
    const root = parseDfmTree(DFM)!;
    const ok = handlerPreviews(PAS, findNode(root, 'btnOk')!, 'TF');
    assert.deepEqual(ok.map(p => [p.event, p.handler, p.missing, p.empty]), [['OnClick', 'btnOkClick', false, false], ['OnEnter', 'btnMissingClick', true, false]]);
    assert.deepEqual(ok[0].lines.slice(0, 3), ['  // save it', '  i := 1;', '  Save(i);']);
    assert.equal(ok[0].more, true, 'the body is longer than the tooltip');
    const empty = handlerPreviews(PAS, findNode(root, 'btnEmpty')!, 'TF');
    assert.deepEqual([empty[0].empty, empty[0].missing], [true, false]);
});

test('what the designer remembers: only well-formed names, bounded, nothing for rubbish', () => {
    const clean = sanitizeMarks({ groups: { 'Bottom buttons': ['btnOk', 'btnCancel', 'bad name', 5], '': ['a'], empty: [] }, locks: ['pnlTop', 'pnlTop', '1x'], hidden: 'nope' });
    assert.deepEqual(clean, { groups: { 'Bottom buttons': ['btnOk', 'btnCancel'] }, locks: ['pnlTop'], hidden: [] });
    for (const bad of [undefined, null, 3, 'x', [], { groups: 5 }]) { assert.deepEqual(sanitizeMarks(bad), { groups: {}, locks: [], hidden: [] }); }
    assert.equal(Object.keys(sanitizeMarks({ groups: Object.fromEntries(Array.from({ length: 100 }, (_, i) => ['g' + i, ['a']])) }).groups).length, 60);
});

test('the page: groups, locks, hidden components and the handler tooltip, all from the View menu', () => {
    const html = designerHtml('N');
    assert.match(html, /addViewExtra\(groupsMenu\)/);
    assert.match(html, /addViewAction\('Lock the selection'[\s\S]*?'Ctrl\+L'\)/);
    assert.match(html, /addViewAction\('Hide the selection'[\s\S]*?'Ctrl\+H'\)/);
    assert.match(html, /names\.some\(isFixed\) \|\| names\.some\(isLockedName\)/, 'a locked component is not dragged');
    assert.match(html, /if \(names\.some\(isLockedName\)\) \{ ev\.preventDefault\(\); return; \}/, 'nor resized');
    assert.match(html, /!isLockedName\(n\)/, 'nor deleted');
    assert.match(html, /\.ctl\.tmphidden \{ display: none !important; \}/);
    assert.match(html, /\.ctl > \.ev-badge \{ pointer-events: auto;/);
    assert.match(html, /type: 'handlerPreview', name: name/);
    assert.match(html, /takeMarks\(m\.designer\)/);
});
