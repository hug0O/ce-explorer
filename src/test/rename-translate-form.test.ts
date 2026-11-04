import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyRename, extensionsLike, familyOfExtension, isCaseFree, isIdentifier, scanRename } from '../utils/renameScan';
import { dfmTexts, encodeDelphiString, restoreAccelerator, translationEdits, withoutAccelerator } from '../utils/dfmTexts';
import { applyTextEdits } from '../services/DelphiForm';

const root = path.join(__dirname, '..', '..');

const PAS = `unit U;
// Total is the sum
procedure Total;
begin
  ShowMessage('Total: ' + IntToStr(total)); { total again }
  TotalCount := 1;
end;
`;

test('a rename lists every place of the name, code apart from comments and strings, whole words only, any case for Pascal', () => {
    const hits = scanRename(PAS, 'Total', familyOfExtension('pas'), true);
    assert.deepEqual(hits.map(h => [h.line, h.kind]), [[1, 'text'], [2, 'code'], [4, 'text'], [4, 'code'], [4, 'text']], 'TotalCount is another name');
    assert.equal(hits[3].preview, "ShowMessage('Total: ' + IntToStr(total)); { total again }");
    const code = hits.filter(h => h.kind === 'code');
    assert.equal(applyRename(PAS, code, 5, 'Sum').split('\n')[2], 'procedure Sum;');
    assert.ok(applyRename(PAS, code, 5, 'Sum').includes('IntToStr(Sum)'));
    assert.equal(scanRename(PAS, 'Total', familyOfExtension('pas'), false).filter(h => h.kind === 'code').length, 1, 'case matters outside Pascal');
});

test('a form file renames the object and the links, and leaves its string values as text', () => {
    const dfm = "object Total: TLabel\n  Caption = 'Total'\n  OnClick = TotalClick\nend\n";
    const hits = scanRename(dfm, 'Total', familyOfExtension('dfm'), true);
    assert.deepEqual(hits.map(h => h.kind), ['code', 'text']);
    assert.deepEqual(extensionsLike('pas'), extensionsLike('dfm'));
    assert.deepEqual(extensionsLike('.ts'), ['ts']);
    assert.ok(isCaseFree(undefined, '.dfm') && !isCaseFree('typescript', '.ts'));
    assert.ok(isIdentifier('a_1') && !isIdentifier('1a') && !isIdentifier('a b') && scanRename('x', 'a b', undefined, true).length === 0);
});

test('the command is declared, offered in the sidebar and wired', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    for (const c of ['ce.renamePreview', 'ce.translateForm']) { assert.ok(pkg.contributes.commands.some((x: { command: string }) => x.command === c), c); }
    const tools = fs.readFileSync(path.join(root, 'src', 'webview', 'toolsSection.ts'), 'utf8');
    const common = tools.slice(tools.indexOf('export const COMMON_COMMANDS'), tools.indexOf('export const PLSQL_ALIGN_IDS'));
    for (const c of ['ce.renamePreview', 'ce.translateForm', 'ce.usage.show']) { assert.ok(common.includes("'" + c + "'"), c + ' can be run from the Tools tab'); }
    const ext = fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8');
    assert.match(ext, /registerRenamePreview\(context\)/);
    const rename = fs.readFileSync(path.join(root, 'src', 'services', 'RenamePreview.ts'), 'utf8');
    assert.match(rename, /needsConfirmation: true/, 'VS Code shows its refactoring preview');
});

const FORM = `object Form1: TForm1
  Caption = 'Gestion des clients'
  object btnSave: TButton
    Caption = '&Enregistrer'
    Hint = 'Cr'#233'er l'#39'enregistrement'
  end
  object Grid: TcxGrid
    Columns = <
      item
        Caption = 'Nom'
      end>
  end
  object Edit1: TEdit
    Text = 'Garde le texte'
    Caption = 'x' + 'Ok'
    TabOrder = 0
  end
  object lbl: TLabel
    Caption = '123'
    Hint = ''
  end
end
`;

test('the texts of a form are found with their component, decoded, and only the ones a person reads', () => {
    const t = dfmTexts(FORM);
    assert.deepEqual(t.map(x => x.component + '.' + x.prop), ['Form1.Caption', 'btnSave.Caption', 'btnSave.Hint', 'Grid.Caption', 'Edit1.Caption']);
    assert.equal(t[2].value, "Créer l'enregistrement");
    assert.equal(t[4].value, 'xOk');
    assert.ok(!t.some(x => x.value === 'Garde le texte' || x.value === '123'), 'Text is data and a number is not a text');
});

test('a translation is written back as a Delphi string with the accents as #codes, the accelerator kept', () => {
    assert.equal(encodeDelphiString("Créer l'élément"), "'Cr'#233'er l'''#233'l'#233'ment'");
    assert.equal(encodeDelphiString('Créer', true), "'Créer'");
    assert.equal(encodeDelphiString('a\r\nb'), "'a'#13#10'b'");
    assert.equal(withoutAccelerator('&Save && quit'), 'Save & quit');
    assert.equal(restoreAccelerator('&Enregistrer', 'Save'), 'Sav&e', 'the same key when the translation has it');
    assert.equal(restoreAccelerator('&Fermer', 'Close'), '&Close', 'else the first letter');
    assert.equal(restoreAccelerator('E&xporter', 'Export'), 'E&xport');
    assert.equal(restoreAccelerator('Quitter', 'Quit'), 'Quit');
    const t = dfmTexts(FORM);
    const out = applyTextEdits(FORM, translationEdits(t, new Map([['Gestion des clients', 'Customer management'], ['&Enregistrer', '&Save'], ["Créer l'enregistrement", "Create the record"], ['Nom', 'Name']])));
    assert.match(out, /Caption = 'Customer management'/);
    assert.match(out, /btnSave: TButton\n {4}Caption = '&Save'\n {4}Hint = 'Create the record'/);
    assert.match(out, /item\n {8}Caption = 'Name'/);
    assert.match(out, /Text = 'Garde le texte'/, 'the data is untouched');
    assert.equal(dfmTexts(out).length, 5, 'the file still reads the same way');
});
