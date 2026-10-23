import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KnownForm, calledNames, classOfArg, dprUnits, formNamedBy, formsInCode, formsOpenedBy, hostedForms, indexMethods, indexMethodsOf, forgetUnit, methodBodies, nameDistance, stripCode } from '../services/DelphiFormRefs';

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

test('the .dpr says how the project names its forms: unit in path {form}', () => {
    const dpr = [
        'program Gestion;', 'uses', '  Forms,', "  TIERS_Fiche_frm in 'Transactions\Tiers\TIERS_Fiche_frm.pas' {frmTIERSFiche},", "  Main_frm in 'Main_frm.pas' {frmMain},", "  Outils in 'Outils.pas'; // no form",
        'begin', 'end.',
    ].join('\n');
    assert.deepEqual(dprUnits(dpr), [
        { unit: 'TIERS_Fiche_frm', path: 'Transactions\Tiers\TIERS_Fiche_frm.pas', form: 'frmTIERSFiche' },
        { unit: 'Main_frm', path: 'Main_frm.pas', form: 'frmMain' },
        { unit: 'Outils', path: 'Outils.pas', form: undefined },
    ]);
});

const tiers: KnownForm = { className: 'TfrmTIERSFiche', vars: ['frmTIERSFiche'], pas: 'Tiers\TIERS_Fiche_frm.pas', dfm: 'Tiers\TIERS_Fiche_frm.dfm', names: ['TIERS_Fiche_frm', 'frmTIERSFiche'] };

test('a form is named by its class, its form name or its unit, and a slip of the keyboard is forgiven', () => {
    const all = [...forms, tiers];
    for (const t of ['TfrmTIERSFiche', 'frmTIERSFiche', 'TIERS_Fiche_frm', 'tfrmtiersfiche']) { assert.equal(formNamedBy(t, all)?.className, 'TfrmTIERSFiche', t); }
    assert.equal(formNamedBy('TfrmTIERSFihce', all)?.className, 'TfrmTIERSFiche', 'two letters swapped');
    assert.equal(formNamedBy('TfrmTIERSFichee', all)?.className, 'TfrmTIERSFiche', 'one letter more');
    assert.equal(formNamedBy('Customer name', all), undefined, 'a text with spaces is not a name');
    assert.equal(formNamedBy('TfrmFacture', all), undefined, 'too far from every form');
    assert.equal(nameDistance('abcd', 'abdc'), 1);
});

test('a button that opens a form by its name, in the call of a method of another object, finds the form of the .dpr', () => {
    const all = [...forms, tiers];
    const code = "frmMain.oGestionAffichageEcran.fAfficheListe('TfrmTIERSFihce', pnlContent);";
    const r = formsOpenedBy(code, all, new Map(), 'TfrmMain');
    assert.deepEqual(r.map(x => [x.form.className, x.how]), [['TfrmTIERSFiche', "named 'TfrmTIERSFihce'"]]);
    // the name may be given deeper: the method that is called is followed, its string too
    const units = new Map([['Ecran.pas', "procedure TGestion.fAfficheListe(psClasse: string);\nbegin\n  Open('TIERS_Fiche_frm');\nend;\n"]]);
    assert.deepEqual(formsOpenedBy('frmMain.oG.fAfficheListe(1);', all, units, 'TfrmMain').map(x => [x.form.className, x.via]), [['TfrmTIERSFiche', 'fAfficheListe']]);
    assert.deepEqual(formsOpenedBy("ShowMessage('TfrmTIERSFiche');", all, new Map(), 'TfrmTIERSFiche'), [], 'never the form itself');
});

test('the methods are indexed once: header offsets by name, and only real implementations', () => {
    const unit = 'unit U;\ninterface\ntype\n  TG = class\n    procedure fOpen;\n  end;\nimplementation\nprocedure TG.fOpen;\nbegin\n  frmListe.Show;\nend;\nprocedure Plain;\nbegin\n  frmDetail.Show;\nend;\nend.\n';
    const index = indexMethods(new Map([['U.pas', unit]]));
    assert.deepEqual([...index.keys()].sort(), ['fopen', 'plain'], 'the declaration in the class is not an implementation');
    const units = new Map([['U.pas', unit]]);
    assert.match(methodBodies(units, 'fOpen', index)[0], /frmListe\.Show/);
    assert.match(methodBodies(units, 'Plain', index)[0], /frmDetail\.Show/);
    forgetUnit('U.pas', index);
    assert.equal(index.size, 0, 'a saved unit is forgotten, then read again alone');
    indexMethodsOf('U.pas', unit, index);
    assert.equal(index.size, 2);
});

test('a big project is indexed fast: a hundred thousand lines, forty lookups', () => {
    const body = Array.from({ length: 400 }, (_, i) => `procedure TG.Meth${i}(a: Integer);\nbegin\n  DoSomething(a);\n  TfrmX${i % 7}.Create(nil);\nend;\n`).join('\n');
    const units = new Map<string, string>();
    for (let u = 0; u < 120; u++) { units.set(`U${u}.pas`, `unit U${u};\ninterface\nimplementation\n${body}\nend.\n`); }
    const t0 = Date.now();
    const index = indexMethods(units);
    for (let i = 0; i < 40; i++) { methodBodies(units, 'Meth' + i, index); }
    assert.ok(Date.now() - t0 < 1500, 'took ' + (Date.now() - t0) + ' ms');
});
