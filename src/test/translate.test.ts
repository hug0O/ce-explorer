import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { LANGUAGES, MAX_PIECES, decodeEntities, isLanguageCode, parseTranslation, pieceAt, segmentsOf, translateAll, translateUrl } from '../utils/translate';

test('a text is cut into lines and pieces the service accepts, blanks kept', () => {
    const segs = segmentsOf('  Hello world.\n\nSecond line');
    assert.deepEqual(segs.map(s => [s.lead, s.pieces]), [['  ', ['Hello world.']], ['', []], ['', ['Second line']]]);
    const long = ('This is a sentence. ').repeat(60).trim();
    const cut = segmentsOf(long, 100)[0].pieces;
    assert.ok(cut.length > 5 && cut.every(p => p.length <= 100), 'every piece fits');
    assert.ok(cut.every(p => p.endsWith('.')), 'cut after a full stop');
    assert.equal(cut.join(' '), long, 'nothing is lost');
    assert.ok(segmentsOf('x'.repeat(1000), 400)[0].pieces.every(p => p.length <= 400), 'even without a space');
});

test('the request and the answer of the service', () => {
    assert.equal(translateUrl('Hello & you', 'auto', 'fr'), 'https://api.mymemory.translated.net/get?q=Hello%20%26%20you&langpair=Autodetect%7Cfr');
    assert.match(translateUrl('Hi', 'en', 'pt-BR', 'me@x.io'), /langpair=en%7Cpt-BR&de=me%40x\.io$/);
    assert.deepEqual(parseTranslation({ responseData: { translatedText: 'Bonjour &amp; vous l&#39;ami' }, responseStatus: 200 }), { text: "Bonjour & vous l'ami" });
    assert.match(parseTranslation({ responseData: { translatedText: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY' }, responseStatus: 200 }).error ?? '', /quota/);
    assert.match(parseTranslation({ responseStatus: 429 }).error ?? '', /wait/);
    assert.match(parseTranslation({ responseData: {}, responseStatus: 403, responseDetails: 'INVALID LANGUAGE PAIR' }).error ?? '', /INVALID LANGUAGE PAIR/);
    assert.match(parseTranslation(null).error ?? '', /no answer/);
    assert.equal(decodeEntities('&lt;b&gt; &#x41;'), '<b> A');
    assert.ok(isLanguageCode('fr') && isLanguageCode('pt-BR') && !isLanguageCode('french') && !isLanguageCode('f'));
    assert.ok(LANGUAGES.every(l => isLanguageCode(l.code)));
});

test('translating a text: line by line, blanks and numbers untouched, failures reported', async () => {
    const seen: string[] = [];
    const get = async (url: string): Promise<unknown> => {
        const q = decodeURIComponent(/q=([^&]*)/.exec(url)![1]);
        seen.push(q);
        return { responseData: { translatedText: q.toUpperCase() }, responseStatus: 200 };
    };
    const r = await translateAll('  first line\n\n42\nlast one', 'auto', 'fr', '', get);
    assert.equal(r.text, '  FIRST LINE\n\n42\nLAST ONE');
    assert.deepEqual(seen.sort(), ['first line', 'last one'], 'a number is not sent');
    const down = await translateAll('hello', 'auto', 'fr', '', async () => { throw new Error('offline'); });
    assert.match(down.error ?? '', /cannot be reached \(offline\)/);
    const quota = await translateAll('hello', 'auto', 'fr', '', async () => ({ responseData: { translatedText: 'MYMEMORY WARNING: x' }, responseStatus: 200 }));
    assert.match(quota.error ?? '', /quota/);
    assert.match((await translateAll('', 'auto', 'fr', '', get)).error ?? '', /nothing/);
    const many = Array.from({ length: MAX_PIECES + 1 }, (_v, i) => 'line ' + i + ' word').join('\n');
    assert.match((await translateAll(many, 'auto', 'fr', '', get)).error ?? '', /too long/);
});

test('the comment or string under the cursor, without its marks', () => {
    const ts = 'const a = 1; // compute the total\nconst s = "hello there";\n/* first line\n * second line */\nlet b = 2;';
    const at = (needle: string, off = 0): number => ts.indexOf(needle) + off;
    const c = pieceAt(ts, 'typescript', at('total'));
    assert.deepEqual([c?.text, c?.kind], ['compute the total', 'comment']);
    assert.equal(ts.slice(c!.start, c!.end), 'compute the total', 'the offsets are those of the text alone');
    const s = pieceAt(ts, 'typescript', at('hello', 2));
    assert.deepEqual([s?.text, s?.kind], ['hello there', 'string']);
    assert.equal(pieceAt(ts, 'typescript', at('const s'))?.text, 'hello there', 'the only string of the line, cursor elsewhere');
    assert.equal(pieceAt(ts, 'typescript', at('let b')), undefined, 'no comment, no string');
    const block = pieceAt(ts, 'typescript', at('second'));
    assert.equal(block?.text, 'second line');
    assert.equal(pieceAt('x = 1  # set the value', 'python', 8)?.text, 'set the value');
    assert.equal(pieceAt('x := 1; { adds one }', 'pascal', 14)?.text, 'adds one');
    assert.equal(pieceAt('-- the total\nselect 1 from dual;', 'plsql', 5)?.text, 'the total');
    assert.equal(pieceAt('// 42 --\nx', 'typescript', 3), undefined, 'no letter to translate');
    assert.equal(pieceAt('hello', 'markdown', 2), undefined, 'a language without comments and strings to read');
});

test('the command is in the palette and the "More commands" menu, with its settings; the text is sent only after the user agreed', () => {
    const root = path.join(__dirname, '..', '..');
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    for (const c of ['ce.translate', 'ce.translateTo']) {
        assert.ok(pkg.contributes.commands.some((x: { command: string }) => x.command === c), c);
        assert.ok(pkg.contributes.menus['ce.editorMore'].some((x: { command: string }) => x.command === c), c + ' in the menu');
    }
    const props = Object.assign({}, ...pkg.contributes.configuration.map((c: { properties: object }) => c.properties));
    assert.equal(props['ce.translate.target'].default, 'fr');
    assert.equal(props['ce.translate.source'].default, 'auto');
    const cmd = fs.readFileSync(path.join(root, 'src', 'services', 'TranslateCommands.ts'), 'utf8');
    assert.ok(cmd.indexOf('await agreed()') < cmd.indexOf('translateAll(text'), 'consent first, request after');
    assert.match(cmd, /api\.mymemory\.translated\.net/);
    assert.match(fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8'), /registerTranslateCommands\(context\)/);
});
