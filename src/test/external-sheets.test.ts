import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;
let workspaceFiles: string[] = [];
const vscodeMock = { workspace: { findFiles: async () => workspaceFiles.map(f => ({ fsPath: f })) } };
nodeModule._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));

import { moduleCandidates } from '../services/DelphiColors';
import { DNode, buildDesignModel } from '../services/DesignerModel';
import { unitFacts } from '../services/ProjectUnused';
const { ExternalSheets } = require('../services/ExternalSheets') as typeof import('../services/ExternalSheets');

const MODULE_DFM = [
    'object dmdSGL_DevExpress: TdmdSGL_DevExpress',
    '  OldCreateOrder = False',
    '  object cxStyleRepository1: TcxStyleRepository',
    '    object cxStyleContent: TcxStyle', '      AssignedValues = [svColor, svFont]', '      Color = 16250871', '      Font.Color = clGreen', '    end',
    '    object cxStyleBandHeader: TcxStyle', '      AssignedValues = [svColor]', '      Color = clSilver', '    end',
    '    object cxStyleHeader: TcxStyle', '      AssignedValues = [svColor]', '      Color = clMoneyGreen', '    end',
    '    object cxGridTableViewStyleSheetGeneral: TcxGridTableViewStyleSheet', '      Styles.Content = cxStyleContent', '      Styles.Header = cxStyleHeader', '    end',
    '    object cxGridBandedTableViewStyleSheetGeneral: TcxGridBandedTableViewStyleSheet', '      Styles.Content = cxStyleContent', '      Styles.BandHeader = cxStyleBandHeader', '      Styles.Header = cxStyleHeader', '    end',
    '  end',
    'end',
].join('\n');

const FORM = [
    'object F: TF', '  ClientWidth = 600', '  ClientHeight = 300',
    '  object grd: TcxGrid', '    Left = 0', '    Top = 0', '    Width = 500', '    Height = 200',
    '    object tv: TcxGridDBTableView', '      Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral',
    '      object tvA: TcxGridDBColumn', '      end',
    '    end',
    '    object bv: TcxGridDBBandedTableView', '      Styles.StyleSheet = dmdSGL_DevExpress.cxGridBandedTableViewStyleSheetGeneral',
    '      object bvA: TcxGridDBBandedColumn', '      end',
    '    end',
    '  end',
    'end',
].join('\n');
const PAS = ['unit UForm;', 'interface', 'uses System.SysUtils, dmdSGL_DEVExpress_unit, Vcl.Forms;', 'type', '  TF = class(TForm)', '  end;', 'implementation', 'end.'].join('\n');

test('the files that may hold a data module: the units the form uses first', () => {
    const files = new Map([['dmdsgl_devexpress_unit', '/p/dmdSGL_DEVExpress_unit.dfm'], ['other', '/p/Other.dfm'], ['dmdsgl_devexpress', '/p/dmdSGL_DevExpress.dfm'], ['xdmdsgl_devexpressx', '/p/xdmdSGL_DevExpressx.dfm']]);
    assert.deepEqual(moduleCandidates('dmdSGL_DevExpress', ['System.SysUtils', 'dmdSGL_DEVExpress_unit'], files), [
        '/p/dmdSGL_DEVExpress_unit.dfm', '/p/dmdSGL_DevExpress.dfm', '/p/xdmdSGL_DevExpressx.dfm',
    ]);
    assert.deepEqual(moduleCandidates('Nope', ['a'], files), []);
});

test('a data module in another unit gives its sheets to the grids: table and banded views, children of the style repository', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-sheets-'));
    const other = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-sheets-ws-'));
    fs.writeFileSync(path.join(other, 'dmdSGL_DEVExpress_unit.dfm'), MODULE_DFM);
    fs.writeFileSync(path.join(other, 'Decoy.dfm'), 'object Decoy: TDecoy\nend\n');
    fs.writeFileSync(path.join(dir, 'UForm.dfm'), FORM);
    workspaceFiles = [path.join(other, 'dmdSGL_DEVExpress_unit.dfm'), path.join(other, 'Decoy.dfm')];

    const uses = unitFacts(PAS)!.uses.map(u => u.name);
    assert.ok(uses.includes('dmdSGL_DEVExpress_unit'));
    const sheets = await new ExternalSheets().load(FORM, path.join(dir, 'UForm.dfm'), uses);
    assert.deepEqual([...sheets.keys()].sort(), ['dmdsgl_devexpress.cxgridbandedtableviewstylesheetgeneral', 'dmdsgl_devexpress.cxgridtableviewstylesheetgeneral']);

    const model = buildDesignModel(FORM, sheets)!;
    const flat = (n: DNode): DNode[] => [n, ...n.children.flatMap(flat)];
    const by = (n: string): DNode => flat(model.root).find(x => x.name === n)!;
    assert.equal(by('tvA').color, '#f7f7f7', 'the content style');
    assert.equal(by('tvA').headerColor, '#c0dcc0', 'the header style');
    assert.equal(by('bvA').color, by('tvA').color, 'a banded view takes the content of its sheet too');
    assert.equal(by('bvA').fontColor, '#008000');
    assert.equal(by('bvA').headerColor, '#c0dcc0');
    // no module found: nothing is drawn, nothing breaks
    const none = await new ExternalSheets().load(FORM, path.join(dir, 'UForm.dfm'), []);
    workspaceFiles = [];
    const empty = await new ExternalSheets().load(FORM.replace(/dmdSGL_DevExpress/g, 'dmdMissing'), path.join(dir, 'UForm.dfm'), []);
    assert.ok(none.size > 0 && empty.size === 0);
});
