/**
 * The texts a person reads on a form (captions, hints, titles, labels of fields) as the .dfm holds them, and the way to write a translation
 * of each one back: a Delphi string is `'Text'`, a quote is doubled, a character outside the plain ASCII is `#233`.
 *
 * Pure: it reads the text of a .dfm and gives the places and the edits; the command does the asking and the writing.
 */
import { decodeDelphiString } from '../services/ProjectSql';

/** The properties that hold a text for the user. A `Text` or a `Items` is data most of the time, so it is left out. */
const TEXT_PROPS = /^(Caption|Hint|Title|DisplayLabel|TextHint|EditLabel\.Caption|Properties\.NullText|Properties\.Caption|Properties\.Hint)$/;

const PIECE = String.raw`(?:'(?:[^']|'')*'|#\d+|#\$[0-9A-Fa-f]+)`;
/** A value made only of string pieces: `'Text'`, `'Cr'#233'er'`, `'a' + 'b'`. A name, a number or a `(` list is not one. */
const STRING_VALUE = new RegExp(`^${PIECE}(?:\\s*\\+?\\s*${PIECE})*$`);

export interface DfmText {
    /** Where the raw value (quotes included) starts and its length, in the .dfm. */
    offset: number;
    length: number;
    component: string;
    prop: string;
    line: number;
    /** The text as the user reads it. */
    value: string;
    /** The raw value holds an accented letter written as it is (an UTF-8 form), so the translation is written that way too. */
    raw: boolean;
}

/** The texts of a form, in the order of the file. */
export function dfmTexts(dfm: string): DfmText[] {
    const out: DfmText[] = [];
    const stack: string[] = [];
    let offset = 0;
    dfm.split('\n').forEach((lineRaw, line) => {
        const text = lineRaw.replace(/\r$/, '');
        const head = /^\s*(?:object|inherited|inline)\s+(\w*)\s*:?/i.exec(text);
        if (head) { stack.push(head[1]); }
        else if (/^\s*item\s*$/i.test(text)) { stack.push(stack[stack.length - 1] ?? ''); }
        else if (/^\s*end\s*$/i.test(text)) { stack.pop(); }
        else {
            const m = /^(\s*([\w.]+)\s*=\s*)(.*\S)\s*$/.exec(text);
            if (m && TEXT_PROPS.test(m[2]) && STRING_VALUE.test(m[3])) {
                const value = decodeDelphiString(m[3]);
                if (/\p{L}/u.test(value)) {
                    out.push({ offset: offset + m[1].length, length: m[3].length, component: stack[stack.length - 1] ?? '', prop: m[2], line, value, raw: /[\u0080-￿]/.test(m[3]) });
                }
            }
        }
        offset += lineRaw.length + 1;
    });
    return out;
}

/** A text as a Delphi string; a character that is not plain ASCII is written `#code` unless `raw` keeps it as it is. */
export function encodeDelphiString(s: string, raw = false): string {
    if (s === '') { return "''"; }
    const parts: string[] = [];
    let quoted = '';
    const flush = (): void => { if (quoted) { parts.push("'" + quoted.replace(/'/g, "''") + "'"); quoted = ''; } };
    for (const ch of s) {
        const c = ch.codePointAt(0)!;
        if (c < 32 || c === 127 || (c > 126 && !raw)) {
            flush();
            // a character above the BMP is two UTF-16 units in a Delphi string
            if (c > 0xffff) { parts.push('#' + ch.charCodeAt(0) + '#' + ch.charCodeAt(1)); } else { parts.push('#' + c); }
        } else { quoted += ch; }
    }
    flush();
    return parts.join('');
}

/** The accelerator of a caption (`&Save`): the letter after the `&`, undefined when there is none. */
const accelerator = (s: string): string | undefined => /&([^&\s])/.exec(s.replace(/&&/g, ''))?.[1];

/** The text to send: the `&` of the accelerator is not part of the words. */
export const withoutAccelerator = (s: string): string => s.replace(/&&/g, '').replace(/&/g, '').replace(//g, '&');

/**
 * The translation of a caption, with its accelerator put back: the original had `&` before a letter, so the translation gets one, before the
 * same letter when the translation has it, else before its first letter.
 */
export function restoreAccelerator(original: string, translated: string): string {
    const key = accelerator(original);
    if (!key || translated.includes('&')) { return translated; }
    const at = translated.toLowerCase().indexOf(key.toLowerCase());
    const i = at >= 0 ? at : translated.search(/\p{L}/u);
    return i < 0 ? translated : translated.slice(0, i) + '&' + translated.slice(i);
}

/** The edits that write `translations` (by original text) in place of the texts they translate. */
export function translationEdits(texts: DfmText[], translations: Map<string, string>): { offset: number; length: number; text: string }[] {
    const edits: { offset: number; length: number; text: string }[] = [];
    for (const t of texts) {
        const tr = translations.get(t.value);
        if (tr === undefined || tr === t.value) { continue; }
        edits.push({ offset: t.offset, length: t.length, text: encodeDelphiString(restoreAccelerator(t.value, tr), t.raw) });
    }
    return edits;
}
