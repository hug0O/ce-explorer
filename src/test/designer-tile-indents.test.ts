import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDfmTree } from '../services/DelphiLayout';
import { tileLayout } from '../services/DelphiTiles';

const dfm = (opts: string[]): string => [
    'object F: TF', '  object tc: TdxTileControl', '    Left = 0', '    Top = 0', '    Width = 800', '    Height = 400', ...opts.map(o => '    ' + o),
    '    object g0: TdxTileControlGroup', '      Index = 0', '    end',
    '    object g1: TdxTileControlGroup', '      Index = 1', '    end',
    '    object big: TdxTileControlItem', '      GroupIndex = 0', '      IndexInGroup = 0', '      Size = tcisLarge', '    end',
    '    object reg: TdxTileControlItem', '      GroupIndex = 0', '      IndexInGroup = 1', '    end',
    '    object other: TdxTileControlItem', '      GroupIndex = 1', '      IndexInGroup = 0', '    end',
    '  end', 'end', '',
].join('\n');

const layout = (opts: string[]) => {
    const tc = parseDfmTree(dfm(opts))!.children[0];
    const l = tileLayout(tc);
    const rect = (name: string) => [...l.items].find(([n]) => n.name === name)![1];
    return { big: rect('big'), reg: rect('reg'), other: rect('other') };
};

test('a large tile is as wide as two regular ones and the gap between them, a regular one is one cell', () => {
    const r = layout([]);
    assert.equal(r.reg.w, 120);
    assert.equal(r.big.w, 2 * 120 + 6);
    assert.equal(r.big.h, 120, 'as high as a regular one');
});

test('the indents of the control decide the spaces: between tiles, between groups, around the groups', () => {
    const r = layout(['OptionsView.ItemIndent = 5', 'OptionsView.GroupIndent = 12', 'OptionsView.IndentHorz = 20', 'OptionsView.IndentVert = 4']);
    assert.equal(r.big.x, 20, 'IndentHorz');
    assert.equal(r.big.y - 4, 22 + 6, 'IndentVert, then the caption of the group');
    assert.equal(r.big.w, 2 * 120 + 5, 'ItemIndent between the two cells of a large tile');
    assert.equal(r.reg.y - (r.big.y + r.big.h), 5, 'ItemIndent between two tiles');
    assert.equal(r.other.x, 20 + (2 * 120 + 5) + 12, 'GroupIndent between the groups');
});
