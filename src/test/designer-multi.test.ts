import { test } from 'node:test';
import assert from 'node:assert/strict';
import { designerHtml } from '../webview/designerHtml';

const html = designerHtml('N');

test('Components come first in the left column, the palette under them', () => {
    assert.ok(html.indexOf('id="compsec"') < html.indexOf('id="palsec"'));
});

test('a multi-selection shows the properties the components share and sends one value per component', () => {
    assert.match(html, /Common properties/);
    assert.match(html, /post\(\{ type: 'setProps', items: items \}\)/);
    assert.match(html, /c\.indeterminate = s\.mixed/, 'a differing flag is shown as undetermined');
    assert.match(html, /Shift \/ Ctrl \+ click adds to the selection/);
});
