/**
 * Small .dfm text edits shared by the form tools: rewrite the value of an existing
 * `Prop = value` line (align, TabOrder, paste).
 */
import { TextEdit } from './DelphiForm';
import { DfmNode } from './DelphiLayout';

function lineSpan(dfm: string, line: number): { start: number; end: number } {
    let start = 0;
    for (let l = 0; l < line; l++) {
        const next = dfm.indexOf('\n', start);
        if (next < 0) { return { start: dfm.length, end: dfm.length }; }
        start = next + 1;
    }
    let end = dfm.indexOf('\n', start);
    if (end < 0) { end = dfm.length; }
    if (end > start && dfm[end - 1] === '\r') { end--; }
    return { start, end };
}

/** Edit rewriting the value of an existing `Prop = value` line of `node`. */
export function setPropEdit(dfm: string, node: DfmNode, prop: string, value: number): TextEdit | undefined {
    const line = node.propLines[prop];
    if (line === undefined) { return undefined; }
    const { start, end } = lineSpan(dfm, line);
    const m = dfm.slice(start, end).match(/^(\s*[\w.]+\s*=\s*)(.*)$/);
    if (!m) { return undefined; }
    return { offset: start + m[1].length, length: m[2].length, text: String(value) };
}
