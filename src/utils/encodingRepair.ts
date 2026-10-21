/**
 * Accents that came out wrong, and what can be done about them.
 *
 * Two different accidents look alike in an editor:
 * - a file written in Windows-1252 (what Delphi writes) read as UTF-8: every accented letter became U+FFFD (�) and the
 *   original is gone from the text, so the file has to be read again with the right encoding;
 * - a file written in UTF-8 read as Windows-1252 (or saved so): `é` became `Ã©`, `à` became `Ã `… and the text is still all
 *   there, so it can be repaired in place.
 *
 * Pure: no editor, no file.
 */

/** The characters Windows-1252 puts at 0x80-0x9F, where Latin-1 has control characters. */
const CP1252_HIGH: Record<number, number> = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B,
    0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99,
    0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F,
};

/** The byte a character is in Windows-1252, or undefined when it has none. */
const cp1252Byte = (code: number): number | undefined => (code < 0x100 ? code : CP1252_HIGH[code]);

/** A UTF-8 lead character (read as Windows-1252) and the continuation characters after it. */
const CONT = '\\u0080-\\u00BF\\u0152\\u0153\\u0160\\u0161\\u0178\\u017D\\u017E\\u0192\\u02C6\\u02DC\\u2013\\u2014\\u2018-\\u201E\\u2020-\\u2022\\u2026\\u2030\\u2039\\u203A\\u20AC\\u2122';
const MOJIBAKE = new RegExp('[\\u00C2-\\u00F4][' + CONT + ']+', 'g');

export interface EncodingReport {
    /** Characters that stand for a byte that was not valid UTF-8 (�): the file is probably not UTF-8. */
    replaced: number;
    /** Sequences such as `Ã©` that are UTF-8 read as Windows-1252, and can be repaired. */
    mojibake: number;
}

export function analyseEncoding(text: string): EncodingReport {
    return { replaced: (text.match(/�/g) ?? []).length, mojibake: repairMojibake(text).fixed };
}

/** UTF-8 that was read as Windows-1252, put right: `CafÃ©` → `Café`. Only runs that really are UTF-8 are touched. */
export function repairMojibake(text: string): { text: string; fixed: number } {
    let fixed = 0;
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const out = text.replace(MOJIBAKE, run => {
        const bytes: number[] = [];
        for (const ch of run) {
            const b = cp1252Byte(ch.codePointAt(0)!);
            if (b === undefined) { return run; }
            bytes.push(b);
        }
        try {
            const decoded = decoder.decode(new Uint8Array(bytes));
            fixed++;
            return decoded;
        } catch { return run; }
    });
    return { text: out, fixed };
}

/** Whether the text is worth a look: some of its characters are wrong in a way this can name. */
export const looksWrong = (r: EncodingReport): boolean => r.replaced > 0 || r.mojibake > 0;
