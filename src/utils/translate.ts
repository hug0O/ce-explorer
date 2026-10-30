/**
 * Translating text inside the code with a free web service that asks for no key (MyMemory). Pure: it cuts a text into the pieces the service
 * accepts, builds the request, reads the answer, the command sends the request.
 */

/** The service accepts at most 500 bytes a request: the pieces stay well under. */
export const MAX_PIECE = 400;

export const LANGUAGES: { code: string; name: string }[] = [
    { code: 'fr', name: 'French' }, { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' }, { code: 'nl', name: 'Dutch' }, { code: 'pl', name: 'Polish' },
    { code: 'ru', name: 'Russian' }, { code: 'tr', name: 'Turkish' }, { code: 'ar', name: 'Arabic' }, { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' }, { code: 'sv', name: 'Swedish' }, { code: 'ro', name: 'Romanian' },
];

/** A language code the service knows: two letters, optionally with a region (`pt-BR`). */
export const isLanguageCode = (c: string): boolean => /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(c.trim());

export interface Segment {
    /** The blanks at the start of the line, kept as they are. */
    lead: string;
    /** The text to translate, empty for a blank line. */
    pieces: string[];
}

/** A text cut into lines, and each line into pieces the service accepts (cut after a full stop, else at a space). */
export function segmentsOf(text: string, max = MAX_PIECE): Segment[] {
    return text.split(/\r?\n/).map(line => {
        const lead = /^\s*/.exec(line)![0];
        let rest = line.slice(lead.length).trimEnd();
        const pieces: string[] = [];
        while (rest.length > max) {
            const window = rest.slice(0, max);
            let cut = Math.max(window.lastIndexOf('. '), window.lastIndexOf('! '), window.lastIndexOf('? '), window.lastIndexOf('; ')) + 1;
            if (cut < max / 3) { cut = window.lastIndexOf(' ') + 1; }
            if (cut <= 0) { cut = max; }
            pieces.push(rest.slice(0, cut).trim());
            rest = rest.slice(cut).trimStart();
        }
        if (rest) { pieces.push(rest); }
        return { lead, pieces };
    });
}

/** The address that asks the service for one piece. `email` (optional) raises the free daily quota. */
export function translateUrl(text: string, source: string, target: string, email = ''): string {
    const from = !source || source === 'auto' ? 'Autodetect' : source;
    return 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=' + encodeURIComponent(from + '|' + target) + (email ? '&de=' + encodeURIComponent(email) : '');
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' };

export function decodeEntities(s: string): string {
    return s.replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, m => ENTITIES[m]).replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(Number(d))).replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => String.fromCodePoint(parseInt(h, 16)));
}

/** The translated text of the service's answer, or what went wrong (quota used up, language refused...). */
export function parseTranslation(json: unknown): { text?: string; error?: string } {
    const o = (json && typeof json === 'object' ? json : {}) as { responseData?: { translatedText?: unknown }; responseStatus?: unknown; responseDetails?: unknown };
    const text = typeof o.responseData?.translatedText === 'string' ? o.responseData.translatedText : undefined;
    const status = Number(o.responseStatus ?? 200);
    if (text && /^MYMEMORY WARNING/i.test(text)) { return { error: 'The free quota of the translation service is used up for today (an e-mail in the setting ce.translate.email raises it).' }; }
    if (status === 429) { return { error: 'The translation service asks to wait: too many requests.' }; }
    if (status !== 200 || !text) { return { error: typeof o.responseDetails === 'string' && o.responseDetails ? o.responseDetails : 'The translation service gave no answer.' }; }
    return { text: decodeEntities(text) };
}

/** The translated segments put back with their blanks and their lines. */
export function joinSegments(segments: Segment[], translated: string[][]): string {
    return segments.map((s, i) => (s.pieces.length ? s.lead + translated[i].join(' ') : '')).join('\n');
}

/** The most pieces one command sends: the free service is for a sentence or a comment, not for a file. */
export const MAX_PIECES = 40;

/**
 * Translates a text piece by piece with `get` (the request itself, so the function runs without a network in tests). Blank lines, the blanks
 * at the start of a line and pieces without a letter (numbers, signs) stay as they are.
 */
export async function translateAll(text: string, source: string, target: string, email: string, get: (url: string) => Promise<unknown>): Promise<{ text?: string; error?: string }> {
    const segments = segmentsOf(text);
    const total = segments.reduce((n, s) => n + s.pieces.length, 0);
    if (total === 0) { return { error: 'There is nothing to translate.' }; }
    if (total > MAX_PIECES) { return { error: 'This text is too long for the free service (' + total + ' pieces, ' + MAX_PIECES + ' at most): translate it by parts.' }; }
    const translated: string[][] = segments.map(s => s.pieces.slice());
    const jobs: { i: number; k: number; piece: string }[] = [];
    segments.forEach((s, i) => s.pieces.forEach((piece, k) => { if (/\p{L}/u.test(piece)) { jobs.push({ i, k, piece }); } }));
    let failure: string | undefined;
    let next = 0;
    const worker = async (): Promise<void> => {
        while (next < jobs.length && !failure) {
            const job = jobs[next++];
            try {
                const r = parseTranslation(await get(translateUrl(job.piece, source, target, email)));
                if (r.text === undefined) { failure = r.error; return; }
                translated[job.i][job.k] = r.text;
            } catch (e) { failure = 'The translation service cannot be reached (' + (e instanceof Error ? e.message : String(e)) + ').'; return; }
        }
    };
    await Promise.all([worker(), worker(), worker()]);
    return failure ? { error: failure } : { text: joinSegments(segments, translated) };
}
