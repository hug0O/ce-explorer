import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits, resolveComponentDef } from '../services/DelphiForm';
import { findNode, parseDfmTree, planAddComponent } from '../services/DelphiLayout';
import { planAddEvent } from '../services/DelphiEvents';
import { checkForm } from '../services/DelphiCheck';
import { familyOf } from '../services/DelphiThirdParty';
import { isConnection, isDataset, isDatasetField } from '../services/DelphiData';
import {
    DNode, addEdits, buildDesignModel, danglingRefs, deleteEdits, multilineStrings, renameEdits, reparentEdits, setPropertyEdits, setSqlEdits, verifyEdit,
} from '../services/DesignerModel';
import { PALETTE } from '../webview/designerHtml';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(dir, 'UniForm.dfm'), 'utf8');
const pas = fs.readFileSync(path.join(dir, 'UniForm.pas'), 'utf8');
const model = buildDesignModel(dfm)!;
const find = (n: DNode, name: string): DNode | undefined => (n.name === name ? n : n.children.map(c => find(c, name)).find(Boolean));
const ok = <T extends object>(r: T | { error: string }): T => { assert.ok(!('error' in r), 'error' in r ? (r as { error: string }).error : ''); return r as T; };
const err = (r: object): string => (r as { error: string }).error;
const withEdits = (r: { dfmEdits: never[]; pasEdits: never[] }) => ({ dfm: applyTextEdits(dfm, r.dfmEdits), pas: applyTextEdits(pas, r.pasEdits) });
const node = (text: string, name: string) => findNode(parseDfmTree(text)!, name)!;

test('classes: UniDAC components, datasets, fields and data sources are recognised', () => {
    for (const c of ['TUniConnection', 'TUniQuery', 'TUniTable', 'TUniStoredProc', 'TUniSQL', 'TUniScript', 'TUniTransaction', 'TUniUpdateSQL', 'TOracleUniProvider']) {
        assert.equal(familyOf(c), 'unidac', c);
    }
    for (const c of ['TButton', 'TUnicodeLabel', 'TcxGrid']) { assert.notEqual(familyOf(c), 'unidac', c); }
    assert.ok(isDataset('TUniQuery') && isDataset('TFDQuery') && isDataset('TClientDataSet') && isDataset('TADOTable') && !isDataset('TcxGridDBTableView') && !isDataset('TButton'));
    assert.ok(isDatasetField('TStringField') && !isDatasetField('TEdit'));
    assert.ok(isConnection('TUniConnection') && isConnection('TFDConnection') && !isConnection('TUniQuery'));
});

test('catalog: UniDAC components are non-visual, with the units of the IDE and the signatures of the Devart reference', () => {
    const conn = resolveComponentDef('TUniConnection');
    assert.deepEqual([conn.unit, conn.width, conn.height], ['Uni', undefined, undefined], 'no size: drawn as an icon');
    assert.ok(conn.extraUnits!.includes('DBAccess') && conn.extraUnits!.includes('UniProvider'));
    assert.deepEqual(conn.events.map(e => e.name), ['BeforeConnect', 'AfterConnect', 'BeforeDisconnect', 'AfterDisconnect', 'OnError', 'OnConnectionLost']);
    assert.equal(conn.events[4].params, 'Sender: TObject; E: EDAError; var Fail: boolean');
    assert.equal(conn.events[5].params, 'Sender: TObject; Component: TComponent; ConnLostCause: TConnLostCause; var RetryMode: TRetryMode');
    const q = resolveComponentDef('TUniQuery');
    assert.equal(q.events.find(e => e.name === 'AfterOpen')!.params, 'DataSet: TDataSet');
    assert.equal(q.events.find(e => e.name === 'BeforeFetch')!.params, 'DataSet: TCustomDADataSet; var Cancel: boolean');
    assert.equal(q.events.find(e => e.name === 'AfterExecute')!.params, 'Sender: TObject; Result: boolean');
    assert.equal(resolveComponentDef('TUniScript').unit, 'UniScript');
    assert.equal(resolveComponentDef('TUniConnectDialog').unit, 'UniDacVcl');
    assert.equal(resolveComponentDef('TOracleUniProvider').unit, 'OracleUniProvider');
    const f = resolveComponentDef('TStringField');
    assert.deepEqual([f.nested, f.events.map(e => e.name)], [true, ['OnGetText', 'OnSetText', 'OnChange', 'OnValidate']]);
    assert.equal(f.events[0].params, 'Sender: TField; var Text: string; DisplayText: Boolean');
    const groups = (g: string) => PALETTE.filter(p => p.group === g).map(p => p.cls);
    assert.ok(groups('UniDAC').includes('TUniQuery') && groups('UniDAC').includes('TOracleUniProvider'));
    assert.deepEqual(groups('Data'), ['TDataSource']);
    assert.ok(groups('Fields').includes('TIntegerField') && PALETTE.filter(p => p.group === 'Fields').every(p => p.host === 'dataset'), 'fields go into a dataset');
});

test('model: connections and datasets are icons with a summary, their persistent fields are structure under them', () => {
    const conn = find(model.root, 'UniConnection1')!;
    assert.deepEqual([conn.nonVisual, conn.family, conn.x, conn.y], [true, 'unidac', 24, 232]);
    assert.deepEqual(conn.dataProps, { ProviderName: 'Oracle', Database: 'ORCL', Username: 'scott', Server: 'localhost:1521' });
    assert.equal(conn.summary, 'Oracle · localhost:1521 · ORCL');
    assert.equal(conn.props['Password'], undefined);
    const q = find(model.root, 'UniQuery1')!;
    assert.deepEqual([q.nonVisual, q.dataset, q.container, q.props['Connection']], [true, true, false, 'UniConnection1']);
    assert.deepEqual(q.sql, ['select ID, NOM, SOLDE', 'from CLIENTS', 'where VILLE = :VILLE', 'order by NOM']);
    assert.equal(q.summary, 'select ID, NOM, SOLDE from CLIENTS where VILLE = :VILLE');
    assert.deepEqual(q.children.map(c => [c.name, c.cls, c.structural, c.fixed, c.container, c.dataField]), [
        ['UniQuery1ID', 'TIntegerField', true, true, false, 'ID'], ['UniQuery1NOM', 'TStringField', true, true, false, 'NOM'], ['UniQuery1SOLDE', 'TFloatField', true, true, false, 'SOLDE'],
    ]);
    assert.equal(q.events['AfterOpen'], 'UniQuery1AfterOpen');
    assert.equal(find(model.root, 'UniQuery1NOM')!.events['OnGetText'], 'UniQuery1NOMGetText');
    const table = find(model.root, 'UniTable1')!;
    assert.deepEqual([table.dataProps, table.summary, table.sql], [{ TableName: 'COMMANDES' }, 'table COMMANDES', undefined]);
    assert.deepEqual([find(model.root, 'DataSource1')!.nonVisual, find(model.root, 'OracleUniProvider1')!.nonVisual], [true, true]);
    assert.deepEqual(find(model.root, 'UniQuery1')!.eventNames.slice(0, 3), ['BeforeOpen', 'AfterOpen', 'BeforeClose']);
});

test('inspector edits: connection, link to a connection or a dataset, fields; the password is never offered', () => {
    const prov = withEdits(ok(setPropertyEdits(dfm, 'UniConnection1', 'ProviderName', 'SQL Server')) as never);
    assert.equal(node(prov.dfm, 'UniConnection1').props['ProviderName'], "'SQL Server'");
    const port = withEdits(ok(setPropertyEdits(dfm, 'UniConnection1', 'Port', 1433)) as never);
    assert.equal(node(port.dfm, 'UniConnection1').props['Port'], '1433');
    const prompt = withEdits(ok(setPropertyEdits(dfm, 'UniConnection1', 'LoginPrompt', true)) as never);
    assert.equal(node(prompt.dfm, 'UniConnection1').props['LoginPrompt'], 'True');
    assert.match(err(setPropertyEdits(dfm, 'UniConnection1', 'Password', 'secret')), /cannot be edited here/);
    assert.match(err(setPropertyEdits(dfm, 'UniConnection1', 'Connected', true)), /cannot be edited here/, 'it would open the database when the form loads');
    const tbl = withEdits(ok(setPropertyEdits(dfm, 'UniTable1', 'TableName', 'FACTURES')) as never);
    assert.equal(node(tbl.dfm, 'UniTable1').props['TableName'], "'FACTURES'");
    assert.match(err(setPropertyEdits(dfm, 'btnOuvrir', 'TableName', 'X')), /has no TableName/);
    assert.match(err(setPropertyEdits(dfm, 'UniTable1', 'ProviderName', 'X')), /has no ProviderName/);
    // links
    const relink = withEdits(ok(setPropertyEdits(dfm, 'UniTable1', 'Connection', '')) as never);
    assert.equal(node(relink.dfm, 'UniTable1').props['Connection'], undefined);
    const ds = withEdits(ok(setPropertyEdits(dfm, 'DataSource1', 'DataSet', 'UniTable1')) as never);
    assert.equal(node(ds.dfm, 'DataSource1').props['DataSet'], 'UniTable1');
    assert.match(err(setPropertyEdits(dfm, 'UniTable1', 'Connection', 'btnOuvrir')), /not a connection/);
    assert.match(err(setPropertyEdits(dfm, 'DataSource1', 'DataSet', 'UniConnection1')), /not a dataset/);
    assert.match(err(setPropertyEdits(dfm, 'UniConnection1', 'Connection', 'UniConnection1')), /has no Connection/);
    // a persistent field: Size is a number here (it is a tile size on a tile)
    const size = withEdits(ok(setPropertyEdits(dfm, 'UniQuery1NOM', 'Size', 120)) as never);
    assert.equal(node(size.dfm, 'UniQuery1NOM').props['Size'], '120');
    assert.match(err(setPropertyEdits(dfm, 'UniQuery1NOM', 'Size', 'tcisSmall')), /whole number/);
    const label = withEdits(ok(setPropertyEdits(dfm, 'UniQuery1ID', 'DisplayLabel', 'Numéro')) as never);
    assert.match(label.dfm, /DisplayLabel = 'Num'#233'ro'/);
    const req = withEdits(ok(setPropertyEdits(dfm, 'UniQuery1SOLDE', 'Required', true)) as never);
    assert.equal(node(req.dfm, 'UniQuery1SOLDE').props['Required'], 'True');
    const fld = withEdits(ok(setPropertyEdits(dfm, 'UniQuery1SOLDE', 'FieldName', 'MONTANT')) as never);
    assert.match(fld.dfm, /FieldName = 'MONTANT'/);
    assert.match(err(setPropertyEdits(dfm, 'btnOuvrir', 'FieldName', 'X')), /has no FieldName/);
    assert.equal(verifyEdit(dfm, size.dfm, { touched: ['UniQuery1NOM'], props: ['Size'] }), undefined);
});

test('SQL of a dataset: replaced, long lines split like the IDE, removed when empty, added when there was none', () => {
    const out = withEdits(ok(setSqlEdits(dfm, 'UniQuery1', ['select *', 'from CLIENTS', 'where ID = :ID'])) as never);
    assert.deepEqual(multilineStrings(out.dfm, node(out.dfm, 'UniQuery1'), 'SQL.Strings'), ['select *', 'from CLIENTS', 'where ID = :ID']);
    const q = node(out.dfm, 'UniQuery1');
    assert.deepEqual([q.children.map(c => c.name), q.props['Connection'], q.props['AfterOpen'], q.props['ParamData']], [['UniQuery1ID', 'UniQuery1NOM', 'UniQuery1SOLDE'], 'UniConnection1', 'UniQuery1AfterOpen', '<'], 'everything else is untouched');
    assert.match(out.dfm, /AfterOpen = UniQuery1AfterOpen\n/);
    assert.equal(verifyEdit(dfm, out.dfm, { touched: ['UniQuery1'], props: ['SQL.Strings'] }), undefined);
    // quotes and accents are written the Delphi way
    const odd = withEdits(ok(setSqlEdits(dfm, 'UniQuery1', ["select 'été' from DUAL"])) as never);
    assert.match(odd.dfm, /'select '''|'select '''#233't'#233'''/);
    assert.deepEqual(multilineStrings(odd.dfm, node(odd.dfm, 'UniQuery1'), 'SQL.Strings'), ["select 'été' from DUAL"]);
    // a long line is cut in pieces of 64 characters joined by +
    const long = 'select ' + 'COLUMN_NAME, '.repeat(12) + 'X from T';
    const cut = withEdits(ok(setSqlEdits(dfm, 'UniQuery1', [long])) as never);
    assert.match(cut.dfm, / \+\n {6}'/);
    assert.equal(multilineStrings(cut.dfm, node(cut.dfm, 'UniQuery1'), 'SQL.Strings').join(''), long);
    // nothing → the property goes away; none before → it is inserted before the first child / the end
    const none = withEdits(ok(setSqlEdits(dfm, 'UniQuery1', [])) as never);
    assert.equal(node(none.dfm, 'UniQuery1').props['SQL.Strings'], undefined);
    assert.ok(node(none.dfm, 'UniQuery1').children.length === 3 && node(none.dfm, 'UniQuery1').props['Connection']);
    const added = withEdits(ok(setSqlEdits(dfm, 'UniTable1', ['select 1'])) as never);
    assert.deepEqual(multilineStrings(added.dfm, node(added.dfm, 'UniTable1'), 'SQL.Strings'), ['select 1']);
    assert.equal(node(added.dfm, 'UniTable1').props['TableName'], "'COMMANDES'");
    assert.match(err(setSqlEdits(dfm, 'btnOuvrir', ['x'])), /has no SQL property/);
    assert.match(err(setSqlEdits(dfm, 'UniConnection1', ['x'])), /has no SQL property/);
    // a file with CRLF line ends keeps them
    const crlf = dfm.replace(/\n/g, '\r\n');
    const r = ok(setSqlEdits(crlf, 'UniQuery1', ['a', 'b'])) as { dfmEdits: never[] };
    assert.doesNotMatch(applyTextEdits(crlf, r.dfmEdits).replace(/\r\n/g, ''), /\n/);
});

test('adding fields and UniDAC components: fields only inside a dataset, named after it, no position', () => {
    const fld = ok(addEdits(pas, dfm, { className: 'TStringField', parentName: 'UniQuery1', left: 9, top: 9 }));
    assert.equal(fld.name, 'UniQuery1Field1');
    const out = withEdits(fld as never);
    const n = node(out.dfm, 'UniQuery1Field1');
    assert.deepEqual([n.parent?.name, n.left, n.top, n.props['TabOrder'], n.props['FieldName']], ['UniQuery1', undefined, undefined, undefined, "''"]);
    assert.match(out.pas, /UniQuery1Field1: TStringField;/);
    assert.equal((out.pas.match(/\bData\.DB\b/g) ?? []).length, 1, 'its unit was already there');
    assert.equal(verifyEdit(dfm, out.dfm, { added: ['UniQuery1Field1'] }), undefined);
    const via = withEdits(ok(addEdits(pas, dfm, { className: 'TFloatField', parentName: 'UniQuery1NOM', left: 0, top: 0 })) as never);
    assert.equal(node(via.dfm, 'UniQuery1Field1').parent?.name, 'UniQuery1', 'dropped on a field: it joins its dataset');
    assert.match(err(addEdits(pas, dfm, { className: 'TStringField', parentName: 'UniConnection1', left: 0, top: 0 })), /goes inside a dataset/);
    assert.match(err(addEdits(pas, dfm, { className: 'TStringField', left: 0, top: 0 })), /goes inside a dataset/, 'not on the form itself');
    const base = { side: 'auto' as const };
    assert.match(err(planAddComponent(pas, dfm, { ...base, className: 'TButton', name: 'Button9', parentName: 'UniQuery1' })), /only holds its fields/);
    // a UniDAC component is an ordinary non-visual component: placed, named, declared, its unit added once
    const q = ok(addEdits(pas, dfm, { className: 'TUniQuery', left: 400, top: 232 }));
    assert.equal(q.name, 'UniQuery2');
    const qOut = withEdits(q as never);
    assert.deepEqual([node(qOut.dfm, 'UniQuery2').left, node(qOut.dfm, 'UniQuery2').top, node(qOut.dfm, 'UniQuery2').parent?.name], [400, 232, 'UniForm']);
    assert.match(qOut.pas, /UniQuery2: TUniQuery;/);
    assert.equal((qOut.pas.match(/\bUni\b/g) ?? []).length, 1);
    const script = withEdits(ok(addEdits(pas, dfm, { className: 'TUniScript', left: 400, top: 232 })) as never);
    assert.match(script.pas, /UniScript1: TUniScript;/);
    assert.match(script.pas, /\bUniScript\b/, 'its own unit');
});

test('fields never leave their dataset, nothing else enters it', () => {
    assert.match(err(reparentEdits(dfm, ['UniQuery1NOM'], 'UniForm', [{ left: 0, top: 0 }])), /field of its dataset/);
    assert.match(err(reparentEdits(dfm, ['btnOuvrir'], 'UniQuery1', [{ left: 0, top: 0 }])), /cannot contain/);
    assert.match(err(reparentEdits(dfm, ['btnOuvrir'], 'UniConnection1', [{ left: 0, top: 0 }])), /cannot contain|Nothing/);
    // a custom control whose class merely ends with Field is an ordinary control
    const custom = '  object F: TF\n    object P: TPanel\n      Left = 1\n      Top = 1\n      Width = 50\n      Height = 50\n      object S: TSearchField\n        Left = 2\n        Top = 2\n        Width = 20\n        Height = 20\n      end\n    end\n    object Q: TPanel\n      Left = 60\n      Top = 1\n      Width = 50\n      Height = 50\n    end\n  end\n'.replace(/^ {2}/gm, '');
    const moved = reparentEdits(custom, ['S'], 'Q', [{ left: 3, top: 3 }]);
    assert.ok(!('error' in moved), 'error' in moved ? moved.error : '');
});

test('deleting: a connection or a dataset takes its fields, and what pointed to it is unlinked', () => {
    assert.deepEqual(danglingRefs(parseDfmTree(dfm)!, ['UniConnection1']).map(d => [d.node.name, d.props]), [['UniQuery1', ['Connection']], ['UniTable1', ['Connection']]]);
    assert.deepEqual(danglingRefs(parseDfmTree(dfm)!, ['UniQuery1']).map(d => [d.node.name, d.props]), [['DataSource1', ['DataSet']]]);
    const conn = withEdits(ok(deleteEdits(pas, dfm, ['UniConnection1'], 'TUniForm')) as never);
    assert.doesNotMatch(conn.dfm, /UniConnection1/);
    assert.doesNotMatch(conn.pas, /UniConnection1: TUniConnection/, 'its field goes');
    assert.match(conn.pas, /procedure TUniForm\.UniConnection1AfterConnect/, 'its handler holds code: it stays');
    assert.equal(node(conn.dfm, 'UniQuery1').props['Connection'], undefined, 'it would not load otherwise');
    assert.ok(node(conn.dfm, 'UniQuery1NOM'), 'the fields of the query stay');
    assert.equal(verifyEdit(dfm, conn.dfm, { removed: ['UniConnection1'], touched: ['UniQuery1', 'UniTable1'], props: ['Connection'] }), undefined);
    const q = withEdits(ok(deleteEdits(pas, dfm, ['UniQuery1'], 'TUniForm')) as never);
    assert.doesNotMatch(q.dfm, /UniQuery1/);
    assert.doesNotMatch(q.pas, /UniQuery1ID: |UniQuery1NOM: |UniQuery1SOLDE: |UniQuery1: TUniQuery/, 'its fields go with it');
    assert.match(q.pas, /procedure TUniForm\.UniQuery1AfterOpen/, 'a handler that holds code is never deleted');
    assert.equal(node(q.dfm, 'DataSource1').props['DataSet'], undefined);
    const one = withEdits(ok(deleteEdits(pas, dfm, ['UniQuery1SOLDE'], 'TUniForm')) as never);
    assert.doesNotMatch(one.dfm, /UniQuery1SOLDE/);
    assert.equal(node(one.dfm, 'DataSource1').props['DataSet'], 'UniQuery1', 'a field does not unlink the dataset');
});

test('renaming a connection follows the components that use it', () => {
    const out = withEdits(ok(renameEdits(pas, dfm, 'UniConnection1', 'ConnClients')) as never);
    assert.equal(node(out.dfm, 'UniQuery1').props['Connection'], 'ConnClients');
    assert.equal(node(out.dfm, 'UniTable1').props['Connection'], 'ConnClients');
    assert.match(out.pas, /procedure ConnClientsAfterConnect/, 'and its handlers');
});

test('events use the signatures of the data components, and the fixture is a consistent form', () => {
    assert.deepEqual(checkForm(pas, dfm).filter(i => i.severity !== 'info'), []);
    const post = ok(planAddEvent(pas, dfm, { componentName: 'UniQuery1', eventName: 'BeforePost' }));
    assert.match(applyTextEdits(pas, post.pasEdits), /procedure UniQuery1BeforePost\(DataSet: TDataSet\);/);
    const fetch = ok(planAddEvent(pas, dfm, { componentName: 'UniQuery1', eventName: 'BeforeFetch' }));
    assert.match(applyTextEdits(pas, fetch.pasEdits), /procedure UniQuery1BeforeFetch\(DataSet: TCustomDADataSet; var Cancel: boolean\);/);
    const lost = ok(planAddEvent(pas, dfm, { componentName: 'UniConnection1', eventName: 'OnConnectionLost' }));
    assert.match(applyTextEdits(pas, lost.pasEdits), /procedure UniConnection1ConnectionLost\(Sender: TObject; Component: TComponent; ConnLostCause: TConnLostCause; var RetryMode: TRetryMode\);/);
    const change = ok(planAddEvent(pas, dfm, { componentName: 'UniQuery1ID', eventName: 'OnChange' }));
    assert.match(applyTextEdits(pas, change.pasEdits), /procedure UniQuery1IDChange\(Sender: TField\);/);
    assert.equal(ok(planAddEvent(pas, dfm, { componentName: 'UniQuery1NOM', eventName: 'OnGetText' })).alreadyWired, true);
    assert.equal(ok(planAddEvent(pas, dfm, { componentName: 'UniQuery1', eventName: 'AfterOpen' })).alreadyWired, true);
});

import { designerHtml } from '../webview/designerHtml';
import * as vm from 'vm';

test('webview: data components are icons that say what they are, edited in their own section; fields are structure', () => {
    const html = designerHtml('N');
    assert.match(html, /function nvGlyph/);
    for (const glyph of ['🔌', '🗃', '🔗', '🧩', '📜', '⇄']) { assert.ok(html.includes(`'${glyph}'`), glyph); }
    assert.match(html, /FAMILY = \{ devexpress:.*unidac: \{ cls: 'uni', label: 'UniDAC', short: 'UNI' \}/, 'a UniDAC tag in the lists and the inspector');
    assert.match(html, /\.fam-tag\.uni/);
    assert.match(html, /e\.title = n\.name \+ ' : ' \+ n\.cls \+ \(n\.summary/, 'the tooltip shows the server or the first lines of the SQL');
    for (const k of ["'datafield'", "'dataset'", "'connection'"]) { assert.ok(html.includes(k), k); }
    assert.match(html, /function dataFields/);
    assert.match(html, /function dataFieldFields/);
    assert.match(html, /type: 'setSql', name: n\.name, lines: lines/, 'Apply SQL writes SQL.Strings');
    assert.match(html, /linkSelect\(n, 'Connection', 'Connection', isConnectionNode\)/);
    assert.match(html, /linkSelect\(n, 'DataSet', 'Dataset'/);
    assert.match(html, /The password and Connected are not edited here/);
    assert.match(html, /n\.nonVisual \? 'Position on the form'/, 'a non-visual component has only a design-time position');
    assert.match(html, /if \(h === 'dataset'\) \{ return !!n\.dataset; \}/, 'fields are added into the dataset that is selected or clicked');
    assert.match(html, /@uni/, 'the components list can be filtered to UniDAC');
    assert.doesNotThrow(() => new vm.Script(html.match(/<script nonce="N">([\s\S]*)<\/script>/)![1]));
});

test('events: Before… / After… events of datasets and connections are events (AfterOpen, BeforePost, AfterConnect)', async () => {
    const { EVENT_PROP_RE, handlerName } = await import('../services/DelphiForm');
    for (const e of ['OnClick', 'Properties.OnChange', 'AfterOpen', 'BeforePost', 'AfterConnect', 'BeforeDisconnect', 'AfterExecute', 'BeforeFetch']) { assert.ok(EVENT_PROP_RE.test(e), e); }
    for (const p of ['BeforeColor', 'AfterStyle', 'Before', 'afterOpen', 'Left', 'Online', 'OnlyOne']) { assert.ok(!EVENT_PROP_RE.test(p), p + ' is not an event'); }
    assert.equal(handlerName('UniQuery1', 'AfterOpen'), 'UniQuery1AfterOpen', 'as the IDE names it');
    assert.equal(handlerName('UniQuery1', 'Properties.AfterOpen'), 'UniQuery1PropertiesAfterOpen');
});
