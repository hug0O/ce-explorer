/**
 * Keeps the .dfm in step with edits made to a form unit's fields:
 * renaming a component field renames the object (and its references and
 * `<Component><Event>` handlers); deleting one removes the object, its
 * children and the handlers nobody uses any more.
 */
import { EVENT_PROP_RE, TextEdit } from './DelphiForm';
import { DfmNode, findNode, parseDfmTree } from './DelphiLayout';

export interface RenamePlan {
    dfmEdits: TextEdit[];
    pasEdits: TextEdit[];
    /** Handlers renamed together with the component (Button1Click → btnOkClick). */
    handlers: { from: string; to: string }[];
}

function escapeRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lineStarts(text: string): number[] {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') { starts.push(i + 1); }
    }
    return starts;
}

/** Offsets of `word` as a whole identifier outside '...' literals, within one line of text. */
function identifierHits(line: string, word: string): number[] {
    const hits: number[] = [];
    const re = new RegExp('\\b' + escapeRe(word) + '\\b', 'gi');
    let inQuote = false;
    const quoted: boolean[] = [];
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '\'') { inQuote = !inQuote; }
        quoted.push(inQuote);
    }
    for (let m = re.exec(line); m; m = re.exec(line)) {
        if (!quoted[m.index]) { hits.push(m.index); }
    }
    return hits;
}

function allNodes(root: DfmNode): DfmNode[] {
    return [root, ...root.children.flatMap(allNodes)];
}

/** Event links (OnXxx = Handler) of a node. */
function eventLinks(node: DfmNode): { event: string; handler: string; line: number }[] {
    return Object.entries(node.props)
        .filter(([k, v]) => EVENT_PROP_RE.test(k) && /^[A-Za-z_]\w*$/.test(v))
        .map(([k, v]) => ({ event: k, handler: v, line: node.propLines[k] }));
}

export function planDfmRename(pas: string, dfm: string, oldName: string, newName: string): RenamePlan | { error: string } | undefined {
    const root = parseDfmTree(dfm);
    if (!root) { return undefined; }
    const node = findNode(root, oldName);
    if (!node || node.depth === 0) { return undefined; }
    if (node.inherited) { return { error: `${oldName} is inherited from the ancestor form: it is renamed there.` }; }
    if (node.anonymous) { return { error: `A ${node.className} with no name in the .dfm cannot be renamed here: it has no field in the unit.` }; }
    if (!/^[A-Za-z_]\w*$/.test(newName)) { return { error: `"${newName}" is not a valid component name.` }; }
    if (findNode(root, newName)) { return { error: `"${newName}" is already the name of a component in the .dfm.` }; }

    const starts = lineStarts(dfm);
    const lines = dfm.split('\n');
    const dfmEdits: TextEdit[] = [];
    lines.forEach((raw, i) => {
        const line = raw.replace(/\r$/, '');
        for (const idx of identifierHits(line, oldName)) {
            dfmEdits.push({ offset: starts[i] + idx, length: oldName.length, text: newName });
        }
    });

    // Handlers named after the component follow it, unless another component shares them.
    const handlers: { from: string; to: string }[] = [];
    const pasEdits: TextEdit[] = [];
    const prefix = new RegExp('^' + escapeRe(oldName), 'i');
    const others = allNodes(root).filter(n => n !== node);
    const handlerEdits: TextEdit[] = [];
    for (const link of eventLinks(node)) {
        if (!prefix.test(link.handler) || link.handler.length === oldName.length) { continue; }
        if (others.some(n => eventLinks(n).some(l => l.handler.toLowerCase() === link.handler.toLowerCase()))) { continue; }
        const to = newName + link.handler.slice(oldName.length);
        if (new RegExp('\\b' + escapeRe(to) + '\\b', 'i').test(pas)) { continue; } // would collide with an existing method
        handlers.push({ from: link.handler, to });
        // .dfm: the `OnX = Handler` value (the identifier scan above only touched the bare component name).
        const lineText = lines[link.line].replace(/\r$/, '');
        const col = lineText.lastIndexOf(link.handler);
        if (col >= 0) { handlerEdits.push({ offset: starts[link.line] + col, length: link.handler.length, text: to }); }
        // .pas: declaration, implementation header, any call.
        const wordRe = new RegExp('\\b' + escapeRe(link.handler) + '\\b', 'g');
        for (let m = wordRe.exec(pas); m; m = wordRe.exec(pas)) {
            pasEdits.push({ offset: m.index, length: link.handler.length, text: to });
        }
    }
    return { dfmEdits: [...dfmEdits, ...handlerEdits], pasEdits, handlers };
}

export interface DeletePlan {
    dfmEdits: TextEdit[];
    pasEdits: TextEdit[];
    /** Components removed with the deleted one (its children). */
    removedComponents: string[];
    removedHandlers: string[];
    /** Handlers left in place because they contain code or are used elsewhere. */
    keptHandlers: string[];
}

/** Range [start, end) of the handler implementation `procedure TForm.Name(...); ... end;` incl. a trailing blank line. */
export function handlerImplementation(pas: string, formClass: string, handler: string): { start: number; end: number; empty: boolean } | undefined {
    const found = new RegExp('^[ \\t]*procedure\\s+' + escapeRe(formClass) + '\\s*\\.\\s*' + escapeRe(handler) + '\\b[^\\n]*\\n', 'im').exec(pas);
    if (!found) { return undefined; }
    // the header may wrap onto the next lines: it ends at the first ; outside the parentheses
    let headEnd = found.index + found[0].length;
    for (let open = 0, at = found.index; at < pas.length; at++) {
        const c = pas[at];
        if (c === '(') { open++; } else if (c === ')') { open--; } else if (c === ';' && open <= 0) { headEnd = pas.indexOf('\n', at) + 1 || pas.length; break; }
    }
    const head = { index: found.index, 0: pas.slice(found.index, headEnd) };
    const bodyStart = head.index + head[0].length;
    const endRe = /^[ \t]*end;[ \t]*\r?\n?/im;
    const rest = pas.slice(bodyStart);
    const end = endRe.exec(rest);
    if (!end) { return undefined; }
    const body = rest.slice(0, end.index);
    const code = body.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l && !/^begin$/i.test(l));
    let stop = bodyStart + end.index + end[0].length;
    const blank = /^[ \t]*\r?\n/.exec(pas.slice(stop));
    if (blank) { stop += blank[0].length; }
    return { start: head.index, end: stop, empty: code.length === 0 };
}

/**
 * Range [start, end) of the lines that declare `procedure Handler(...)` in the class: one line, or several when the declaration wraps
 * (the name alone on a line, the parameters on the next ones).
 */
export function handlerDeclaration(pas: string, handler: string): { start: number; end: number } | undefined {
    const starts = lineStarts(pas);
    const lines = pas.split('\n');
    const declRe = new RegExp('^[ \\t]*procedure\\s+' + escapeRe(handler) + '\\b', 'i');
    const first = lines.findIndex(l => declRe.test(l));
    if (first < 0) { return undefined; }
    let last = first;
    for (let open = 0, k = first; k < lines.length; k++) {
        open += lines[k].split('(').length - lines[k].split(')').length;
        last = k;
        if (open <= 0 && /;/.test(lines[k])) { break; }
    }
    return { start: starts[first], end: starts[last + 1] ?? pas.length };
}

export function planDfmDelete(pas: string, dfm: string, name: string, formClass: string): DeletePlan | undefined {
    const root = parseDfmTree(dfm);
    if (!root) { return undefined; }
    const node = findNode(root, name);
    if (!node || node.depth === 0) { return undefined; }

    const starts = lineStarts(dfm);
    const lines = dfm.split('\n');
    const removed = allNodes(node);
    const blockStart = starts[node.startLine];
    const blockEnd = node.endLine + 1 < starts.length ? starts[node.endLine + 1] : dfm.length;
    const dfmEdits: TextEdit[] = [{ offset: blockStart, length: blockEnd - blockStart, text: '' }];
    void lines;

    const removedNames = new Set(removed.map(n => n.name.toLowerCase()));
    const stillUsed = allNodes(root).filter(n => !removed.includes(n));
    const pasEdits: TextEdit[] = [];
    const pasStarts = lineStarts(pas);
    const pasLines = pas.split('\n');

    // Fields of the removed children (the deleted component's own field is the caller's job).
    for (const n of removed) {
        if (n === node) { continue; }
        const re = new RegExp('^[ \\t]*' + escapeRe(n.name) + '\\s*:\\s*[\\w.]+\\s*;', 'i');
        const idx = pasLines.findIndex(l => re.test(l));
        if (idx >= 0) { pasEdits.push({ offset: pasStarts[idx], length: (pasStarts[idx + 1] ?? pas.length) - pasStarts[idx], text: '' }); }
    }

    const removedHandlers: string[] = [];
    const keptHandlers: string[] = [];
    const handled = new Set<string>();
    for (const n of removed) {
        for (const link of eventLinks(n)) {
            const key = link.handler.toLowerCase();
            if (handled.has(key)) { continue; }
            handled.add(key);
            if (stillUsed.some(o => eventLinks(o).some(l => l.handler.toLowerCase() === key))) { keptHandlers.push(link.handler); continue; }
            const impl = handlerImplementation(pas, formClass, link.handler);
            if (!impl || !impl.empty) { keptHandlers.push(link.handler); continue; }
            pasEdits.push({ offset: impl.start, length: impl.end - impl.start, text: '' });
            const decl = handlerDeclaration(pas, link.handler);
            if (decl) { pasEdits.push({ offset: decl.start, length: decl.end - decl.start, text: '' }); }
            removedHandlers.push(link.handler);
        }
    }
    return { dfmEdits, pasEdits, removedComponents: [...removedNames].filter(n => n !== name.toLowerCase()), removedHandlers, keptHandlers };
}
