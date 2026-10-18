import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBody, parseTemplateFile, mergeTemplates, filterByLanguage, Template } from '../models/Template';

test('normalizeBody joins array lines with newline', () => {
    assert.equal(normalizeBody(['a', 'b', 'c']), 'a\nb\nc');
});

test('normalizeBody returns string as-is', () => {
    assert.equal(normalizeBody('a\nb'), 'a\nb');
});

test('parseTemplateFile parses a valid file', () => {
    const json = JSON.stringify({ templates: [
        { name: 'For', prefix: 'forr', description: 'd', languages: ['typescript'], body: ['x', 'y'] },
    ]});
    const result = parseTemplateFile(json);
    assert.ok(result.ok);
    if (result.ok) {
        assert.equal(result.templates.length, 1);
        assert.equal(result.templates[0].name, 'For');
        assert.equal(result.templates[0].body, 'x\ny');
    }
});

test('parseTemplateFile returns error on invalid JSON', () => {
    const result = parseTemplateFile('{ not json');
    assert.ok(!result.ok);
    if (!result.ok) assert.match(result.error, /JSON/i);
});

test('parseTemplateFile skips entries missing required fields', () => {
    const json = JSON.stringify({ templates: [
        { prefix: 'nope' },
        { name: 'Good', body: ['ok'] },
    ]});
    const result = parseTemplateFile(json);
    assert.ok(result.ok);
    if (result.ok) assert.equal(result.templates.length, 1);
});

test('parseTemplateFile treats missing languages as unrestricted', () => {
    const json = JSON.stringify({ templates: [{ name: 'Any', body: ['ok'] }]});
    const result = parseTemplateFile(json);
    assert.ok(result.ok);
    if (result.ok) assert.deepEqual(result.templates[0].languages, undefined);
});

test('mergeTemplates lets workspace override global by name', () => {
    const global = [{ name: 'A', body: 'g' }];
    const workspace = [{ name: 'A', body: 'w' }];
    const merged = mergeTemplates(global, workspace);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].body, 'w');
});

test('mergeTemplates keeps both when names differ', () => {
    const merged = mergeTemplates(
        [{ name: 'A', body: 'g' }],
        [{ name: 'B', body: 'w' }],
    );
    assert.equal(merged.length, 2);
});

test('filterByLanguage matches explicit language', () => {
    const t: Template = { name: 'A', body: 'x', languages: ['typescript', 'javascript'] };
    assert.equal(filterByLanguage([t], 'typescript').length, 1);
    assert.equal(filterByLanguage([t], 'python').length, 0);
});

test('filterByLanguage includes unrestricted templates', () => {
    const t: Template = { name: 'A', body: 'x' };
    assert.equal(filterByLanguage([t], 'anything').length, 1);
});
