/** The text and the tooltip of the status bar item of the extension. Pure. */
export interface StatusState { text: string; tooltip: string; warning: boolean }

/** What the item says about a file (pure, apart from the reading of the overrides). */
export function describeStatus(opts: { fsPath: string; languageId?: string; displayName?: string; chosenName?: string; via?: string; encodingWrong: boolean }): StatusState {
    const lang = opts.chosenName ?? opts.displayName;
    const base = lang ? `CE: ${lang}` : 'CE';
    const notes: string[] = [];
    if (lang) { notes.push(`CE reads this file as ${lang}${opts.via ? ' (' + opts.via + ')' : ''}.`); } else { notes.push('CE does not know this file: choose its language in the menu.'); }
    if (opts.encodingWrong) { notes.push('Some letters look wrong (accents): the menu can repair them.'); }
    const icon = opts.encodingWrong ? '$(warning)' : lang ? (/\.(pas|dfm|dpr|dpk)$/i.test(opts.fsPath) ? '$(symbol-misc)' : '$(symbol-class)') : '$(question)';
    return { text: `${icon} ${base}`, tooltip: notes.join('\n') + '\nClick for the quick menu.', warning: opts.encodingWrong };
}
