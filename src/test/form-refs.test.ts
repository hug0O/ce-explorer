import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KnownForm, calledNames, classOfArg, formsInCode, formsOpenedBy, hostedForms, methodBodies, stripCode } from '../services/DelphiFormRefs';

const forms: KnownForm[] = [
    { className: 'TfrmMain', vars: ['frmMain'], pas: 'Main.pas', dfm: 'Main.dfm' },
    { className: 'TfrmListe', vars: ['frmListe'], pas: 'Liste.pas', dfm: 'Liste.dfm' },
    { className: 'TongSales', vars: [], pas: 'OngSales.pas', dfm: 'OngSales.dfm' },
    { className: 'TfrmDetail', vars: ['frmDetail'], pas: 'Detail.pas', dfm: 'Detail.dfm' },
];

test('code without its comments and strings', () => {
    assert.equal(stripCode("a := 'frmListe.Show'; // frmListe.Show\n{ TfrmListe.Create }").replace(/\s+/g, ' ').trim(), "a := '';");
});

test('the forms a piece of code creates and shows, and the ones it only mentions after them', () => {
    const r = formsInCode("TfrmListe.Create(Self).ShowModal;\nfrmDetail.Show;\nfrmMain.Caption := 'x';", forms, 'TfrmMain');
    assert.deepEqual(r.map(x => [x.form.className, x.how]), [['TfrmListe', 'creates TfrmListe'], ['TfrmDetail', 'frmDetail.Show']]);
    assert.deepEqual(formsInCode('Application.CreateForm(TfrmDetail, frmDetail);', forms).map(x => x.how), ['creates TfrmDetail']);
    assert.deepEqual(formsInCode("ShowMessage('frmListe.Show'); // frmDetail.Show", forms), [], 'comments and texts do not count');
});

test('the names a handler calls, the common ones left out', () => {
    assert.deepEqual(calledNames('frmMain.oGestionAffichageEcran.fAfficheListe(1);\nShowMessage(a);\nDoIt;\nfrmMain.Close;').sort(), ['DoIt', 'fAfficheListe']);
});

test('a method is found by its name, in any class of any unit', () => {
    const units = new Map([['Ecran.pas', 'procedure TGestion.fAfficheListe(pi: Integer);\nbegin\n  frmListe.Show;\nend;\n\nprocedure TGestion.Autre;\nbegin\nend;\n']]);
    const b = methodBodies(units, 'fAfficheListe');
    assert.equal(b.length, 1);
    assert.match(b[0], /frmListe\.Show/);
    assert.deepEqual(methodBodies(units, 'Nope'), []);
});

test('from a button to the form its code opens, through the method it calls, two levels deep', () => {
    const units = new Map([
        ['Ecran.pas', 'procedure TGestion.fAfficheListe(pi: Integer);\nbegin\n  fOuvreDetail(pi);\nend;\n'],
        ['Detail.pas', 'procedure TGestion.fOuvreDetail(pi: Integer);\nbegin\n  TfrmDetail.Create(nil).ShowModal;\nend;\n'],
    ]);
    const r = formsOpenedBy('frmMain.oGestionAffichageEcran.fAfficheListe(3);', forms, units, 'TfrmMain');
    assert.deepEqual(r.map(x => [x.form.className, x.via]), [['TfrmDetail', 'fAfficheListe → fOuvreDetail']]);
    const direct = formsOpenedBy('frmListe.ShowModal;', forms, new Map(), 'TfrmMain');
    assert.deepEqual(direct.map(x => [x.form.className, x.via]), [['TfrmListe', undefined]]);
});

test('the class of a variable comes from its creation, its declaration, the forms of the project or its name', () => {
    assert.equal(classOfArg('oOng := TongSales.Create(nil);', 'oOng', forms), 'TongSales');
    assert.equal(classOfArg('var oOng: TfrmDetail;', 'oOng', forms), 'TfrmDetail');
    assert.equal(classOfArg('', 'frmListe', forms), 'TfrmListe');
    assert.equal(classOfArg('', 'oongSales', forms), 'TongSales', 'named after the form');
    assert.equal(classOfArg('', 'zzz', forms), undefined);
});

test('fAddFormInto(form, panel) and form.Parent := panel put a form in a container of the designed form', () => {
    const pas = [
        'procedure TfrmMain.Init;', 'begin', '  oongSales := TongSales.Create(Self);', '  fAddFormInto(oongSales, pnlSales);', '  // fAddFormInto(oongOld, pnlOld);',
        '  poDetail.Parent := Self.pnlDetail;', '  frmListe.Parent := pnlNotHere;', 'end;',
    ].join('\n');
    const hosts = hostedForms(pas, ['fAddFormInto'], forms, new Set(['pnlSales', 'pnlDetail']));
    assert.deepEqual(hosts.map(h => [h.parent, h.formArg, h.className]), [['pnlSales', 'oongSales', 'TongSales'], ['pnlDetail', 'poDetail', undefined]]);
    assert.equal(hostedForms(pas, ['fAddFormInto'], forms).length, 3, 'without the list of containers every one is reported');
    assert.equal(hostedForms(pas, [], forms, new Set(['pnlSales'])).length, 0, 'no helper named, no call read');
});
