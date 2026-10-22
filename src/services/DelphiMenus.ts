/**
 * VCL menus: a `TPopupMenu` or a `TMainMenu` holds `TMenuItem`s, and an item holds sub-items. Items have no place of their
 * own (the menu draws them), so they are parts of their menu: listed, edited, added and deleted, never painted.
 * `ShortCut` is stored as a number (the key in the low word, Ctrl / Shift / Alt in the high bits) and shown as text.
 * Pure: nothing here writes a .dfm.
 */

export const isMenuHost = (cls: string): boolean => /^T(Popup|Main)Menu$/i.test(cls);
export const isMenuItem = (cls: string): boolean => /^TMenuItem$/i.test(cls);

const SC_SHIFT = 0x2000, SC_CTRL = 0x4000, SC_ALT = 0x8000;

const KEY_NAMES: [number, string][] = [
    [8, 'BkSp'], [9, 'Tab'], [13, 'Enter'], [27, 'Esc'], [32, 'Space'], [33, 'PgUp'], [34, 'PgDn'], [35, 'End'], [36, 'Home'],
    [37, 'Left'], [38, 'Up'], [39, 'Right'], [40, 'Down'], [45, 'Ins'], [46, 'Del'],
];

function keyName(code: number): string | undefined {
    const named = KEY_NAMES.find(([c]) => c === code);
    if (named) { return named[1]; }
    if (code >= 112 && code <= 135) { return 'F' + (code - 111); }
    if ((code >= 48 && code <= 57) || (code >= 65 && code <= 90)) { return String.fromCharCode(code); }
    return undefined;
}

function keyCode(name: string): number | undefined {
    const upper = name.toUpperCase();
    const named = KEY_NAMES.find(([, n]) => n.toUpperCase() === upper) ?? (upper === 'BACKSPACE' ? [8, ''] : upper === 'DELETE' ? [46, ''] : upper === 'INSERT' ? [45, ''] : upper === 'ESCAPE' ? [27, ''] : upper === 'RETURN' ? [13, ''] : undefined);
    if (named) { return named[0] as number; }
    const f = /^F(\d{1,2})$/.exec(upper);
    if (f && Number(f[1]) >= 1 && Number(f[1]) <= 24) { return 111 + Number(f[1]); }
    if (/^[0-9A-Z]$/.test(upper)) { return upper.charCodeAt(0); }
    return undefined;
}

/** `16463` → `Ctrl+O`; empty for no shortcut (0, nothing, or a key the VCL has no name for here). */
export function shortcutText(raw: string | undefined): string {
    if (raw === undefined || !/^\d+$/.test(raw.trim())) { return ''; }
    const v = Number(raw);
    if (!v) { return ''; }
    const key = keyName(v & 0xff);
    if (!key) { return ''; }
    return [v & SC_CTRL ? 'Ctrl' : '', v & SC_SHIFT ? 'Shift' : '', v & SC_ALT ? 'Alt' : '', key].filter(Boolean).join('+');
}

/** `Ctrl+Shift+S` → the number the .dfm stores; undefined when the text is not a shortcut. Empty text is 0 (none). */
export function shortcutValue(text: string): number | undefined {
    const t = text.trim();
    if (!t) { return 0; }
    const parts = t.split('+').map(p => p.trim()).filter(Boolean);
    const key = parts.pop();
    if (!key) { return undefined; }
    let v = 0;
    for (const m of parts) {
        const l = m.toLowerCase();
        if (l === 'ctrl' || l === 'control') { v |= SC_CTRL; } else if (l === 'shift') { v |= SC_SHIFT; } else if (l === 'alt') { v |= SC_ALT; } else { return undefined; }
    }
    const code = keyCode(key);
    return code === undefined ? undefined : v | code;
}

/** The caption the menu shows: the `&` that marks the access key removed (`&&` stays one `&`). */
export function menuCaption(caption: string): string {
    return caption.replace(/&(&?)/g, (_m, d: string) => d ? '&' : '');
}

export const isSeparatorCaption = (caption: string | undefined): boolean => caption === '-';
