/**
 * The forms that the code of a form points to, so the designer can lead from a button to the form it opens, and from a panel to
 * the form that is put in it:
 * - the forms a handler opens: `TfrmX.Create`, `Application.CreateForm(TfrmX, frmX)`, `frmX.ShowModal`, and what the methods it calls
 *   open in turn (`frmMain.oGestionAffichageEcran.fAfficheListe(...)` is followed to the body of `fAfficheListe`, two levels deep);
 * - the forms put in a container: `fAddFormInto(oForm, pnlHost)` (the names of such helpers are a setting) and `oForm.Parent := pnlHost`.
 * Text in, text out: the files of the project are given as plain data.
 */

/** A form of the project: the class, the variables that hold an instance, and where it lives. */
export interface KnownForm {
    className: string;
    vars: string[];
    pas: string;
    dfm: string;
    /** Other names the project knows the form by: the name of its unit, the name written beside it in the .dpr. */
    names?: string[];
}

/** The units a .dpr lists: `TIERS_Fiche_frm in 'Transactions\\Tiers\\TIERS_Fiche_frm.pas' {frmTIERSFiche},` */
export interface DprUnit { unit: string; path: string; form?: string }

export function dprUnits(dpr: string): DprUnit[] {
    const out: DprUnit[] = [];
    for (const m of dpr.replace(/\/\/[^\n]*/g, ' ').matchAll(/([A-Za-z_][\w.]*)\s+in\s+'([^']+)'\s*(?:\{\s*([A-Za-z_]\w*)\s*(?::\s*\w+)?\s*\})?/g)) {
        out.push({ unit: m[1], path: m[2], form: m[3] });
    }
    return out;
}

/** Edit distance, a swapped pair of letters counting as one (the name of a form is often typed with one slip). */
export function nameDistance(a: string, b: string): number {
    const x = a.toLowerCase(), y = b.toLowerCase();
    const d: number[][] = Array.from({ length: x.length + 1 }, (_, i) => [i, ...new Array<number>(y.length).fill(0)]);
    for (let j = 1; j <= y.length; j++) { d[0][j] = j; }
    for (let i = 1; i <= x.length; i++) {
        for (let j = 1; j <= y.length; j++) {
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
            if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1]) { d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); }
        }
    }
    return d[x.length][y.length];
}

/** A name without what the conventions add: `TfrmTIERSFiche`, `frmTIERSFiche`, `TIERS_Fiche_frm` and `TIERS_Fiche` are all `tiersfiche`. */
export function formKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^t?(frm|form)/, '').replace(/(frm|form)$/, '');
}

/** The form that a text names: a class (`'TfrmTIERSFiche'`), a form name or a unit, as written or with one slip of the keyboard. */
export function formNamedBy(text: string, forms: KnownForm[]): KnownForm | undefined {
    const t = text.trim();
    if (!/^[A-Za-z_][\w.]*$/.test(t) || t.length < 4) { return undefined; }
    const namesOf = (f: KnownForm): string[] => [f.className, ...f.vars, ...(f.names ?? []), ...(f.names ?? []).map(n => 'T' + n)];
    const exact = forms.find(f => namesOf(f).some(n => n.toLowerCase() === t.toLowerCase()));
    if (exact) { return exact; }
    // the same name without its prefix or suffix (a unit, a transaction name): only when one form has it
    const key = formKey(t);
    if (key.length >= 4) {
        const same = forms.filter(f => namesOf(f).some(n => formKey(n) === key));
        if (same.length === 1) { return same[0]; }
        if (same.length > 1) { return undefined; }
    }
    if (t.length < 9) { return undefined; }
    let best: { f: KnownForm; d: number } | undefined;
    let tie = false;
    for (const f of forms) {
        const d = Math.min(...namesOf(f).map(n => nameDistance(n, t)));
        if (d > 2) { continue; }
        if (!best || d < best.d) { best = { f, d }; tie = false; } else if (d === best.d && f !== best.f) { tie = true; }
    }
    return best && !tie ? best.f : undefined;
}

export interface FormRef { form: KnownForm; how: string; /** The method that opens it, when it is not the handler itself. */ via?: string }

/** Comments and the content of strings removed, so a word in a comment or a text is not taken for code. */
export function stripCode(code: string): string {
    return code.replace(/\{[^}]*\}|\(\*[\s\S]*?\*\)|\/\/[^\n]*/g, ' ').replace(/'(?:[^']|'')*'/g, "''");
}

const lc = (s: string): string => s.toLowerCase();
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const COMMON = new Set(['create', 'free', 'show', 'showmodal', 'close', 'hide', 'release', 'destroy', 'showmessage', 'messagedlg', 'application', 'self', 'inherited', 'assigned', 'format',
    'inttostr', 'strtoint', 'trim', 'length', 'copy', 'pos', 'freeandnil', 'setfocus', 'refresh', 'update', 'invalidate', 'open', 'append', 'edit', 'post', 'cancel', 'delete', 'next', 'prior', 'first', 'last',
    'add', 'clear', 'count', 'beginupdate', 'endupdate', 'processmessages', 'sleep', 'exit', 'abort', 'raise', 'try', 'except', 'finally', 'begin', 'end', 'if', 'then', 'else', 'for', 'while', 'do', 'case', 'of']);

/** The names a piece of code calls: `a.b.fName(…)`, `fName;`, `fName(…)`. */
export function calledNames(code: string): string[] {
    const src = stripCode(code);
    const out = new Set<string>();
    for (const m of src.matchAll(/\.\s*([A-Za-z_]\w*)\s*(?:\(|;|\r?\n)/g)) { out.add(m[1]); }
    for (const m of src.matchAll(/(?:^|[;\n]|\bbegin\b|\bthen\b|\belse\b|\bdo\b)\s*([A-Za-z_]\w*)\s*(?:\(|;)/gi)) { out.add(m[1]); }
    return [...out].filter(n => !COMMON.has(lc(n)));
}

/** The string constants of the units whose value looks like a name: `const csTiers = 'TIERS_Fiche';` (name in lower case → unit and value). */
export type ConstIndex = Map<string, { unit: string; value: string }>;

export function indexConstsOf(unit: string, text: string, into: ConstIndex): void {
    for (const m of text.matchAll(/^[ \t]*([A-Za-z_]\w*)\s*=\s*'([A-Za-z_][\w.]{3,})'\s*;/gm)) { into.set(lc(m[1]), { unit, value: m[2] }); }
}

export function forgetConsts(unit: string, into: ConstIndex): void {
    for (const [k, v] of into) { if (v.unit === unit) { into.delete(k); } }
}

/** The names written between quotes in a piece of code (what a call hands to the routine that opens a form). */
export function stringNames(code: string): string[] {
    const out: string[] = [];
    for (const m of code.replace(/\{[^}]*\}|\(\*[\s\S]*?\*\)|\/\/[^\n]*/g, ' ').matchAll(/'((?:[^']|'')*)'/g)) { if (/^[A-Za-z_][\w.]{3,}$/.test(m[1]) && !out.includes(m[1])) { out.push(m[1]); } }
    return out;
}

/** How sure a link is: a name the code gives (0), a form it creates or shows (1), a form it only mentions (2). */
const rankOf = (how: string): number => (how.startsWith('named') ? 0 : how.startsWith('refers to') ? 2 : 1);

/** The forms a piece of code creates, shows or uses (the form the code belongs to, `self`, is left out). */
export function formsInCode(code: string, forms: KnownForm[], self?: string, consts?: ConstIndex): FormRef[] {
    const src = stripCode(code);
    const byClass = new Map(forms.map(f => [lc(f.className), f]));
    const byVar = new Map(forms.flatMap(f => f.vars.map(v => [lc(v), f] as [string, KnownForm])));
    const out = new Map<string, FormRef>();
    const put = (f: KnownForm | undefined, how: string): void => {
        if (!f || lc(f.className) === lc(self ?? '')) { return; }
        const old = out.get(lc(f.className));
        if (!old || rankOf(how) < rankOf(old.how)) { out.set(lc(f.className), { form: f, how }); }
    };
    for (const m of src.matchAll(/\b(T\w+)\s*\.\s*Create\b/g)) { put(byClass.get(lc(m[1])), 'creates ' + m[1]); }
    for (const m of src.matchAll(/CreateForm\s*\(\s*(T\w+)/gi)) { put(byClass.get(lc(m[1])), 'creates ' + m[1]); }
    for (const m of src.matchAll(/\b(\w+)\s*\.\s*(ShowModal|Show|Visible\s*:=|BringToFront)\b/gi)) { put(byVar.get(lc(m[1])), m[1] + '.' + m[2].replace(/\s+/g, '')); }
    // a form opened by its name: fAfficheListe('TfrmTIERSFiche', ...), the name being the one the project (.dpr, unit) gives it
    for (const name of stringNames(code)) { put(formNamedBy(name, forms), "named '" + name + "'"); }
    // a constant that holds the name: fAfficheListe(csTiers) with const csTiers = 'TIERS_Fiche'
    if (consts && consts.size) {
        for (const m of src.matchAll(/\b[A-Za-z_]\w*\b/g)) { const c = consts.get(lc(m[0])); if (c) { put(formNamedBy(c.value, forms), `named ${m[0]} = '${c.value}'`); } }
    }
    for (const m of src.matchAll(/\b([A-Za-z_]\w*)\s*\./g)) { put(byVar.get(lc(m[1])), 'refers to ' + m[1]); }
    return [...out.values()];
}

/** Where each method is implemented: name (lower case) → the unit and the offset of its header. Built once for the project, one pass per unit. */
export type MethodIndex = Map<string, { unit: string; at: number }[]>;

/** Adds the methods a unit implements (`procedure TGestion.fName`, or a plain routine after `implementation`). */
export function indexMethodsOf(unit: string, text: string, into: MethodIndex): void {
    const impl = text.search(/^[ \t]*implementation\b/im);
    const header = /^[ \t]*(?:class\s+)?(?:procedure|function|constructor|destructor)\s+(?:(\w+)\s*\.\s*)?(\w+)/gim;
    for (let h = header.exec(text); h; h = header.exec(text)) {
        if (!h[1] && !(impl >= 0 && h.index > impl)) { continue; }
        const key = lc(h[2]);
        const list = into.get(key) ?? [];
        list.push({ unit, at: h.index });
        into.set(key, list);
    }
}

export function forgetUnit(unit: string, index: MethodIndex): void {
    for (const [k, v] of index) {
        const kept = v.filter(e => e.unit !== unit);
        if (kept.length) { index.set(k, kept); } else { index.delete(k); }
    }
}

export function indexMethods(units: Map<string, string>): MethodIndex {
    const index: MethodIndex = new Map();
    for (const [unit, text] of units) { indexMethodsOf(unit, text, index); }
    return index;
}

function bodyAt(text: string, from: number): string | undefined {
    const begin = /^[ \t]*begin\b/gim;
    begin.lastIndex = from;
    const b = begin.exec(text);
    if (!b) { return undefined; }
    const end = /^[ \t]*end;/gim;
    end.lastIndex = b.index;
    const e = end.exec(text);
    return text.slice(b.index, e ? e.index : Math.min(text.length, b.index + 6000));
}

/** The implementation of the methods called `name`: the text from their `begin` to their closing `end;` (the index is built from the units when not given). */
export function methodBodies(units: Map<string, string>, name: string, index?: MethodIndex): string[] {
    const idx = index ?? indexMethods(units);
    const out: string[] = [];
    for (const e of idx.get(lc(name)) ?? []) {
        const text = units.get(e.unit);
        const body = text === undefined ? undefined : bodyAt(text, e.at);
        if (body !== undefined) { out.push(body); }
        if (out.length >= 6) { break; }
    }
    return out;
}

/** The forms a handler opens, with the method that opens each one when the handler only calls it (two levels deep). */
export function formsOpenedBy(handlerCode: string, forms: KnownForm[], units: Map<string, string>, self?: string, methods?: MethodIndex, consts?: ConstIndex, trace?: string[]): FormRef[] {
    const index = methods ?? indexMethods(units);
    trace?.push('names between quotes in the handler: ' + (stringNames(handlerCode).join(', ') || '(none)'));
    trace?.push('names the handler calls: ' + (calledNames(handlerCode).join(', ') || '(none)'));
    const found = new Map<string, FormRef>();
    for (const r of formsInCode(handlerCode, forms, self, consts)) { found.set(lc(r.form.className), r); }
    const seen = new Set<string>();
    const walk = (code: string, depth: number, via?: string): void => {
        if (depth > 2 || seen.size > 60) { return; }
        for (const name of calledNames(code)) {
            if (seen.has(lc(name))) { continue; }
            seen.add(lc(name));
            const bodies = methodBodies(units, name, index);
            trace?.push(`${'  '.repeat(depth)}${name}: ${bodies.length ? bodies.length + ' implementation(s) read' : 'no implementation found in the workspace'}${bodies.length ? '; names in it: ' + (bodies.flatMap(b => stringNames(b)).slice(0, 8).join(', ') || '(none)') : ''}`);
            for (const body of bodies) {
                for (const r of formsInCode(body, forms, self, consts)) {
                    // the forms the method opens beat the ones it merely mentions
                    const old = found.get(lc(r.form.className));
                    if (!old || rankOf(r.how) < rankOf(old.how)) { found.set(lc(r.form.className), { ...r, via: via ? `${via} → ${name}` : name }); }
                }
                walk(body, depth + 1, via ? `${via} → ${name}` : name);
            }
        }
    };
    walk(handlerCode, 1);
    // a form that the code names (in a text, in a constant) is the one asked for: nothing else is offered next to it
    const all = [...found.values()].sort((a, b) => rankOf(a.how) - rankOf(b.how));
    const named = all.filter(r => rankOf(r.how) === 0);
    return named.length ? named : all;
}

export interface HostedForm {
    /** The form as the call names it. */
    formArg: string;
    /** The container of the designed form it is put in. */
    parent: string;
    /** The class of that form, when the unit says it (`oForm := TfrmX.Create`, `oForm: TfrmX`). */
    className?: string;
}

const last = (path: string): string => path.split('.').pop() ?? path;

/** The class of the variable `arg`, from its creation or its declaration in the unit, or from the forms of the project. */
export function classOfArg(pas: string, arg: string, forms: KnownForm[]): string | undefined {
    const src = stripCode(pas);
    const name = last(arg);
    const made = new RegExp('\\b' + escapeRe(name) + '\\s*:=\\s*(T\\w+)\\s*\\.\\s*Create\\b', 'i').exec(src);
    if (made) { return made[1]; }
    const declared = new RegExp('\\b' + escapeRe(name) + '\\s*:\\s*(T\\w+)\\s*[;)]', 'i').exec(src);
    if (declared) { return declared[1]; }
    const byVar = forms.find(f => f.vars.some(v => lc(v) === lc(name)));
    if (byVar) { return byVar.className; }
    // a variable named after the form: oongSales (an object, o + the name) for TongSales or TfrmOngSales
    const stems = [lc(name), lc(name.slice(1))].filter(x => x.length > 3);
    return forms.find(f => stems.some(st => lc(f.className) === 't' + st || lc(f.className).endsWith(st)))?.className;
}

/** The forms put in a container of the designed form: calls of the helpers named in `helpers` (form, parent), and `oForm.Parent := pnl`. */
export function hostedForms(pas: string, helpers: string[], forms: KnownForm[], containers?: Set<string>): HostedForm[] {
    const src = stripCode(pas);
    const out: HostedForm[] = [];
    const add = (formArg: string, parent: string): void => {
        const p = last(parent);
        if (containers && ![...containers].some(c => lc(c) === lc(p))) { return; }
        if (!out.some(o => lc(o.formArg) === lc(formArg) && lc(o.parent) === lc(p))) { out.push({ formArg: last(formArg), parent: p, className: classOfArg(pas, formArg, forms) }); }
    };
    for (const h of helpers.filter(x => /^[A-Za-z_]\w*$/.test(x))) {
        for (const m of src.matchAll(new RegExp('\\b' + escapeRe(h) + '\\s*\\(\\s*([A-Za-z_][\\w.]*)\\s*,\\s*([A-Za-z_][\\w.]*)\\s*[,)]', 'gi'))) { add(m[1], m[2]); }
    }
    for (const m of src.matchAll(/\b([A-Za-z_][\w.]*)\s*\.\s*Parent\s*:=\s*([A-Za-z_][\w.]*)\s*;/gi)) {
        if (!/^self$/i.test(last(m[1])) && lc(last(m[1])) !== 'parent') { add(m[1], m[2]); }
    }
    return out;
}
