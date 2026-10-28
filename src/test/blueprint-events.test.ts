import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { eventsByHandler } from '../utils/blueprintEvents';

// DelphiLayout has no dependency on vscode
const { parseDfmTree } = require('../services/DelphiLayout') as typeof import('../services/DelphiLayout');
import { blueprintScript } from '../webview/blueprintHtml';

const DFM = [
    'object Form1: TForm1',
    '  OnCreate = FormCreate',
    '  object btnSave: TButton',
    '    Caption = \'Save\'',
    '    OnClick = btnSaveClick',
    '  end',
    '  object btnSave2: TButton',
    '    OnClick = btnSaveClick',
    '    OnEnter = EnterAny',
    '  end',
    '  object Panel1: TPanel',
    '    object Edit1: TEdit',
    '      OnChange = EditChange',
    '      OnExit = 0',
    '    end',
    '  end',
    'end',
].join('\n');

test('the handlers of a form with the events they answer, the form itself named Form', () => {
    const m = eventsByHandler(parseDfmTree(DFM));
    assert.deepEqual(m.get('formcreate'), ['Form.OnCreate']);
    assert.deepEqual(m.get('btnsaveclick'), ['btnSave.OnClick', 'btnSave2.OnClick'], 'one handler for two buttons');
    assert.deepEqual(m.get('editchange'), ['Edit1.OnChange'], 'a component inside a panel is found');
    assert.equal(m.has('0'), false, 'a value that is not a name is not a handler');
    assert.equal(eventsByHandler(undefined).size, 0);
});

test('an event is drawn as such, is an entry point, and the designer can be opened from the details panel', () => {
    const js = blueprintScript();
    assert.match(js, /event: '#b5453a'/);
    assert.match(js, /var kindWord = isEvent \? 'Event '/);
    assert.match(js, /h\('h4', '', 'Triggered by', side\)/);
    assert.match(js, /post\(\{ type: 'openDesigner' \}\)/);
    const panel = fs.readFileSync(path.join(__dirname, '..', 'webview', 'BlueprintPanel.ts'), 'utf8');
    assert.match(panel, /eventsByHandler\(parseDfmTree\(/);
    assert.match(panel, /entryPoints\(\): string\[\] \{ return this\.model\(\)\?\.nodes\.filter\(n => n\.events\)/);
    assert.match(panel, /ce\.delphi\.designer/);
});
