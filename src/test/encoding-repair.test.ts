import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyseEncoding, looksWrong, repairMojibake } from '../utils/encodingRepair';

/** What an editor shows when it reads these UTF-8 bytes as Windows-1252. */
const asWin1252 = (s: string): string => new TextDecoder('windows-1252').decode(new TextEncoder().encode(s));

test('UTF-8 that was read as Windows-1252 is put right', () => {
    for (const s of ['Café', 'Échéances à solder', 'Où est l\'été ? « Ça » — œuvre €', 'naïve garçon', 'À bientôt']) {
        const broken = asWin1252(s);
        assert.notEqual(broken, s, 'the sample is broken to begin with: ' + s);
        const r = repairMojibake(broken);
        assert.equal(r.text, s);
        assert.ok(r.fixed > 0);
    }
});

test('text that is fine is left alone, whatever its accents', () => {
    for (const s of ['Café', 'Échéances', 'plain ASCII', '© 2026', 'Ã is a letter', 'Î', 'aÃb', '']) {
        const r = repairMojibake(s);
        assert.equal(r.text, s, s);
        assert.equal(r.fixed, 0);
    }
});

test('what is not UTF-8 stays as it is, the rest of the line is repaired', () => {
    const broken = asWin1252('Prénom') + ' lone Ã and ' + asWin1252('Nº');
    assert.equal(repairMojibake(broken).text, 'Prénom lone Ã and Nº');
});

test('the report: replacement characters, and what can be repaired', () => {
    assert.deepEqual(analyseEncoding('Caf� et �'), { replaced: 2, mojibake: 0 });
    assert.deepEqual(analyseEncoding(asWin1252('Café')), { replaced: 0, mojibake: 1 });
    assert.deepEqual(analyseEncoding('Café'), { replaced: 0, mojibake: 0 });
    assert.ok(looksWrong({ replaced: 1, mojibake: 0 }) && looksWrong({ replaced: 0, mojibake: 2 }) && !looksWrong({ replaced: 0, mojibake: 0 }));
});
