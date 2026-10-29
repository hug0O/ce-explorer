import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joinBlocks, outline, parseBlocks, reparse } from '../utils/mdBlocks';
import { inline, renderBlock, safeUrl, toggleTask } from '../utils/mdRender';
import { SLASH_ITEMS, filterSlash, slashAt } from '../utils/mdSlash';

const DOC = [
    '---', 'title: Notes', '---', '',
    '# Title', '', 'A paragraph', 'on two lines.', '',
    '## Section **bold**', '',
    '- one', '- [ ] todo', '  - nested', '- [x] done', '',
    '1. first', '2. second', '',
    '> a quote', '> more', '',
    '```ts', '# not a heading', '', 'const a = 1;', '```', '',
    '| a | b |', '| - | -: |', '| 1 | 2 |', '',
    '---', '',
    'Setext', '======', '',
    '<div>raw html</div>',
].join('\n');

test('a document is cut into blocks of the right kinds, code and front matter left alone', () => {
    const b = parseBlocks(DOC);
    assert.deepEqual(b.map(x => x.type), ['frontmatter', 'heading', 'paragraph', 'heading', 'list', 'list', 'quote', 'code', 'table', 'hr', 'heading', 'html']);
    assert.equal(b[1].level, 1);
    assert.equal(b[3].level, 2);
    assert.equal(b[7].lang, 'ts');
    assert.ok(b[7].raw.includes('# not a heading') && b[7].raw.includes('\n\n'), 'a blank line and a # inside a code block stay in it');
    assert.equal(b[10].level, 1, 'a Setext heading');
    assert.equal(b[4].raw.split('\n').length, 4, 'a list with its nested item is one block');
    assert.deepEqual(outline(b).map(o => [o.text, o.level]), [['Title', 1], ['Section **bold**', 2], ['Setext', 1]]);
});

test('writing the blocks back changes nothing that matters, and is stable', () => {
    const once = joinBlocks(parseBlocks(DOC));
    assert.equal(joinBlocks(parseBlocks(once)), once, 'a second round gives the same text');
    assert.ok(once.endsWith('\n') && !once.endsWith('\n\n'));
    assert.equal(joinBlocks([]), '');
    // a block edited so that it holds a blank line becomes two
    assert.equal(reparse(['# A', 'one\n\ntwo']).length, 3);
});

test('the blocks are drawn, everything of the file escaped, and the links checked', () => {
    assert.equal(renderBlock({ type: 'heading', raw: '## Hi <b>', level: 2 }), '<h2 id="hi">Hi &lt;b&gt;</h2>');
    assert.equal(inline('**b** *i* ~~s~~ `c<d>` [t](https://x.y "ti") ![a](pic.png)', { base: 'https://h/' }), '<strong>b</strong> <em>i</em> <del>s</del> <code>c&lt;d&gt;</code> <a href="https://x.y">t</a> <img src="https://h/pic.png" alt="a">');
    assert.ok(inline('[x](javascript:alert(1))').startsWith('<a href="#">x</a>') && !/href=.javascript/i.test(inline('[x](javascript:alert(1))')), 'a javascript: link goes nowhere');
    assert.equal(safeUrl('data:text/html,x'), '#');
    assert.equal(safeUrl('docs/a b.md'), 'docs/a b.md');
    assert.ok(!/<script/.test(renderBlock({ type: 'paragraph', raw: '<script>alert(1)</script>' })));
    assert.equal(inline('a_b_c and 2*3*4'), 'a_b_c and 2*3*4', 'no emphasis inside words or numbers');
    const list = renderBlock({ type: 'list', raw: '- one\n- [ ] todo\n  - nested\n- [x] done' });
    assert.equal(list, '<ul><li>one</li><li class="task"><input type="checkbox" data-ln="1"> todo<ul><li>nested</li></ul></li><li class="task"><input type="checkbox" data-ln="3" checked> done</li></ul>');
    assert.match(renderBlock({ type: 'list', raw: '1. a\n2. b' }), /^<ol><li>a<\/li><li>b<\/li><\/ol>$/);
    const table = renderBlock({ type: 'table', raw: '| a | b |\n| - | -: |\n| 1 | 2 |' });
    assert.match(table, /<th>a<\/th><th style="text-align:right">b<\/th>/);
    assert.match(table, /<td>1<\/td><td style="text-align:right">2<\/td>/);
    assert.equal(renderBlock({ type: 'code', raw: '```ts\na < b\n```', lang: 'ts' }), '<pre data-lang="ts"><code>a &lt; b</code></pre>');
    assert.equal(renderBlock({ type: 'quote', raw: '> a\n> - b' }), '<blockquote><p>a</p><ul><li>b</li></ul></blockquote>'.replace('<p>a</p><ul><li>b</li></ul>', '<p>a</p><ul><li>b</li></ul>'));
});

test('a check box is flipped in the text', () => {
    assert.equal(toggleTask('- a\n- [ ] b', 1), '- a\n- [x] b');
    assert.equal(toggleTask('- [x] b', 0), '- [ ] b');
    assert.equal(toggleTask('- a', 0), '- a', 'a line that is not a task is left alone');
});

test('the slash menu: what is typed finds the items, the slash is only seen at the start of a block or after a space', () => {
    assert.equal(filterSlash('').length, SLASH_ITEMS.length);
    assert.equal(filterSlash('h1')[0].id, 'h1');
    assert.equal(filterSlash('todo')[0].id, 'todo');
    assert.equal(filterSlash('list').map(i => i.id).sort().join(), 'bullet,numbered,todo');
    assert.equal(filterSlash('zzz').length, 0);
    assert.deepEqual(slashAt('/he', 3), { start: 0, query: 'he' });
    assert.deepEqual(slashAt('see /tab', 8), { start: 4, query: 'tab' });
    assert.equal(slashAt('a/b', 3), undefined, 'a slash inside a word is not a menu');
    assert.equal(slashAt('/ a', 3), undefined, 'a space ends it');
    assert.equal(slashAt('http://x', 8), undefined);
    // every item writes something the parser reads back as the block it promises
    const kind: Record<string, string> = { h1: 'heading', h2: 'heading', h3: 'heading', bullet: 'list', numbered: 'list', todo: 'list', quote: 'quote', callout: 'quote', code: 'code', divider: 'hr', table: 'table' };
    for (const it of SLASH_ITEMS.filter(i => kind[i.id])) {
        const text = it.id === 'code' || it.id === 'divider' || it.id === 'table' ? it.insert : it.insert + 'x';
        assert.equal(parseBlocks(text)[0]?.type, kind[it.id], it.id);
    }
    for (const it of SLASH_ITEMS) { assert.ok(it.caret === undefined || (it.caret >= 0 && it.caret <= it.insert.length), it.id + ' caret inside the text'); }
});
