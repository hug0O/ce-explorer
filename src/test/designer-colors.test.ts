import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyTextEdits, normalizeEdits, TextEdit } from '../services/DelphiForm';
import { parseDfmTree, findNode } from '../services/DelphiLayout';
import { COLOR_NAMES, cssToDelphi, delphiToCss, resolveColors, styleColors } from '../services/DelphiColors';
import { DNode, buildDesignModel, setPropertyEdits } from '../services/DesignerModel';

const apply = (t: string, e: TextEdit[]): string => applyTextEdits(t, (normalizeEdits(e) as { edits: TextEdit[] }).edits);
const flat = (n: DNode): DNode[] => [n, ...n.children.flatMap(flat)];

test('colours as Delphi writes them: names, BGR numbers, system colours', () => {
    assert.equal(delphiToCss('clRed'), '#ff0000');
    assert.equal(delphiToCss('clBtnFace'), '#f0f0f0');
    assert.equal(delphiToCss('$00FF8000'), '#0080ff', 'BGR');
    assert.equal(delphiToCss('16770764'), '#cce6ff', 'a number the IDE wrote');
    assert.equal(delphiToCss('9934847'), '#ff9797');
    assert.equal(delphiToCss('-2147483643'), '#ffffff', 'clWindow written as a number');
    assert.equal(delphiToCss('$8000000F'), '#f0f0f0', 'clBtnFace as hexadecimal');
    assert.equal(delphiToCss('clHighlight'), '#3399ff');
    for (const none of ['clNone', 'clDefault', 'nonsense', '', undefined, '$1FFFFFFFF']) { assert.equal(delphiToCss(none as string), undefined, String(none)); }
    assert.ok(Object.keys(COLOR_NAMES).length > 40);
});

test('a colour from the picker is written by name when Delphi has one, else as the number', () => {
    assert.equal(cssToDelphi('#ff0000'), 'clRed');
    assert.equal(cssToDelphi('#FFFFFF'), 'clWhite');
    assert.equal(cssToDelphi('#c0c0c0'), 'clSilver');
    assert.equal(cssToDelphi('#0080ff'), String(0xFF8000));
    assert.equal(delphiToCss(cssToDelphi('#123456')), '#123456', 'it comes back the same');
    assert.equal(cssToDelphi('red'), undefined);
    assert.equal(cssToDelphi('#12345'), undefined);
});

const DFM = [
    'object F: TF',
    '  Color = clBtnFace',
    '  Font.Color = clNavy',
    '  object stRepo: TcxStyleRepository',
    '    object stRed: TcxStyle', '      AssignedValues = [svColor, svTextColor]', '      Color = 9934847', '      TextColor = clMaroon', '    end',
    '    object stOnlyFont: TcxStyle', '      AssignedValues = [svTextColor]', '      Color = clBlue', '      TextColor = clLime', '    end',
    '  end',
    '  object pnl: TPanel', '    Color = 16770764', '    Font.Color = clRed',
    '    object lblInherit: TLabel', '      ParentColor = True', '    end',
    '    object edtOwn: TEdit', '      Color = clYellow', '    end',
    '    object edtParentFont: TEdit', '    end',
    '    object edtOwnFont: TEdit', '      ParentFont = False', '    end',
    '  end',
    '  object bar: TdxBarStatic', '    Style = stRed', '    Color = clGreen', '  end',
    '  object edtInline: TcxTextEdit', '    Style.Color = clAqua', '    Style.Font.Color = clBlack', '  end',
    '  object col: TcxGridDBColumn', '    Styles.Content = stRed', '  end',
    '  object edtOnlyFont: TcxTextEdit', '    Style = stOnlyFont', '  end',
    'end',
].join('\n');

test('where a colour comes from: the control, its style, its parent', () => {
    const root = parseDfmTree(DFM)!;
    const of = (name: string) => resolveColors(findNode(root, name)!);
    assert.deepEqual(of('pnl'), { color: '#cce6ff', colorFrom: 'Color', fontColor: '#ff0000', fontFrom: 'Font.Color' });
    assert.equal(of('lblInherit').color, '#cce6ff', 'ParentColor');
    assert.equal(of('lblInherit').colorFrom, 'ParentColor of pnl');
    assert.equal(of('edtOwn').color, '#ffff00', 'its own Color');
    assert.equal(of('edtParentFont').fontColor, '#ff0000', 'ParentFont is the default');
    assert.equal(of('edtParentFont').color, undefined, 'a control that is not ParentColor keeps its own default look');
    assert.equal(of('edtOwnFont').fontColor, undefined, 'ParentFont = False stops the inheritance');
    const bar = of('bar');
    assert.deepEqual([bar.color, bar.colorFrom, bar.fontColor], ['#ff9797', 'Style = stRed', '#800000'], 'a style wins over Color');
    assert.deepEqual([of('edtInline').color, of('edtInline').colorFrom, of('edtInline').fontColor], ['#00ffff', 'Style.Color', '#000000']);
    assert.equal(of('col').color, '#ff9797', 'Styles.Content of a grid column');
    const onlyFont = of('edtOnlyFont');
    assert.deepEqual([onlyFont.color, onlyFont.fontColor], [undefined, '#00ff00'], 'AssignedValues turns only the text colour on');
});

test('a style gives only what its AssignedValues turn on', () => {
    const root = parseDfmTree(DFM)!;
    assert.deepEqual(styleColors(findNode(root, 'stRed')!), { color: '#ff9797', text: '#800000' });
    assert.deepEqual(styleColors(findNode(root, 'stOnlyFont')!), { color: undefined, text: '#00ff00' });
});

test('the designer draws what the .dfm says: colours in the model, and edits from the inspector', () => {
    const model = buildDesignModel(DFM)!;
    const by = (n: string): DNode => flat(model.root).find(x => x.name === n)!;
    assert.equal(model.root.color, '#f0f0f0');
    assert.equal(by('pnl').color, '#cce6ff');
    assert.equal(by('lblInherit').color, '#cce6ff');
    assert.equal(by('bar').colorFrom, 'Style = stRed');

    const set = setPropertyEdits(DFM, 'edtParentFont', 'Color', '#336699');
    assert.ok(!('error' in set));
    if (!('error' in set)) { assert.match(apply(DFM, set.dfmEdits), /object edtParentFont: TEdit\r?\n\s+Color = 10053171/); }
    const named = setPropertyEdits(DFM, 'edtOwn', 'Color', '#00ff00');
    assert.ok(!('error' in named));
    if (!('error' in named)) { assert.match(apply(DFM, named.dfmEdits), /object edtOwn: TEdit\r?\n\s+Color = clLime/); }
    const font = setPropertyEdits(DFM, 'edtOwn', 'Font.Color', '#800000');
    assert.ok(!('error' in font));
    if (!('error' in font)) { assert.match(apply(DFM, font.dfmEdits), /Font\.Color = clMaroon/); }
    const clear = setPropertyEdits(DFM, 'edtOwn', 'Color', '');
    assert.ok(!('error' in clear));
    if (!('error' in clear)) { assert.ok(!/Color = clYellow/.test(apply(DFM, clear.dfmEdits)), 'cleared: the colour goes back to the default'); }
    const bad = setPropertyEdits(DFM, 'edtOwn', 'Color', 'red');
    assert.ok('error' in bad && /not a colour/.test(bad.error));
});
