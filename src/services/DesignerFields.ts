/**
 * Creating the persistent fields of a query and the columns of a grid view in one go, the way the IDE does with
 * "Add all fields" and "Create columns from the fields": one component per column of the SELECT / per field, named
 * after its holder (`qryTARIFListeTARIF_ID`), with its FieldName, in the .dfm and the unit together.
 *
 * Each component is added with the ordinary add (so the unit gets its field and its uses), renamed and given its
 * FieldName; the steps are worked out one after the other on the text the one before left, and handed back as one
 * edit per file.
 */
import { TextEdit, applyTextEdits, normalizeEdits } from './DelphiForm';
import { findNode, parseDfmTree } from './DelphiLayout';
import { DesignResult, addEdits, renameEdits, setPropertyEdits } from './DesignerModel';
import { columnsToCreate, fieldsToCreate } from './DesignerFieldNames';
import { isDataset } from './DelphiData';
import { isGridView } from './DelphiGrid';
import { fieldOfDomain } from './FdataDomains';

const fail = (error: string): { error: string } => ({ error });

/** What database type a column name suggests: an FDATA domain (`CLI_IDT`, `ART_CMNT`) gives its exact field, else a guess from the name to correct. */
export function guessFieldClass(field: string): { cls: string; size?: number } {
    const known = fieldOfDomain(field);
    if (known) { return known; }
    const f = field.toUpperCase();
    if (/DATE|(^|_)DT(_|$)|HEURE|TIMESTAMP/.test(f)) { return { cls: 'TDateTimeField' }; }
    if (/(^|_)(ID|NUM|QTE|QTY|NB|MNT|MONTANT|PRIX|TAUX|POIDS|SOLDE)(_|$)/.test(f)) { return { cls: 'TFloatField' }; }
    return { cls: 'TStringField', size: 50 };
}

/** One edit that turns `before` into `after`: the part in the middle that differs. */
export function diffEdit(before: string, after: string): TextEdit | undefined {
    if (before === after) { return undefined; }
    let a = 0;
    while (a < before.length && a < after.length && before[a] === after[a]) { a++; }
    let b = 0;
    while (b < before.length - a && b < after.length - a && before[before.length - 1 - b] === after[after.length - 1 - b]) { b++; }
    const length = before.length - a - b;
    const text = after.slice(a, after.length - b);
    return length ? { offset: a, length, text } : { offset: a, text };
}

const apply = (text: string, edits: TextEdit[]): string | undefined => {
    const n = normalizeEdits(edits);
    return 'error' in n ? undefined : applyTextEdits(text, n.edits);
};

/** The name the IDE would give: the holder's name and the field's, when it is a name and not taken. */
const wanted = (holder: string, field: string, taken: Set<string>): string | undefined => {
    const clean = field.replace(/[^A-Za-z0-9_]/g, '_');
    const name = holder + clean;
    return /^[A-Za-z_]\w*$/.test(name) && !taken.has(name.toLowerCase()) ? name : undefined;
};

interface Plan { pas: string; dfm: string; added: string[] }

function addOne(plan: Plan, req: { className: string; holder: string; field: string; fieldProp: string; size?: number }): string | undefined {
    const r = addEdits(plan.pas, plan.dfm, { className: req.className, parentName: req.holder, left: 0, top: 0 });
    if ('error' in r || !r.name) { return 'error' in r ? r.error : 'Not added.'; }
    let pas = apply(plan.pas, r.pasEdits);
    let dfm = apply(plan.dfm, r.dfmEdits);
    if (pas === undefined || dfm === undefined) { return 'Two changes overlap.'; }
    let name = r.name;
    const set = (prop: string, value: unknown): string | undefined => {
        const e = setPropertyEdits(dfm!, name, prop, value);
        if ('error' in e) { return e.error; }
        const next = apply(dfm!, e.dfmEdits);
        if (next === undefined) { return 'Two changes overlap.'; }
        dfm = next;
        return undefined;
    };
    const err = set(req.fieldProp, req.field) ?? (req.size ? set('Size', req.size) : undefined);
    if (err) { return err; }
    // the IDE's name: holder + field, when that is free
    const taken = new Set([...dfm.matchAll(/^\s*(?:object|inherited|inline)\s+(\w+)\s*:/gim)].map(m => m[1].toLowerCase()));
    const nice = wanted(req.holder, req.field, taken);
    if (nice) {
        const rn = renameEdits(pas, dfm, name, nice);
        if (!('error' in rn)) {
            const p2 = apply(pas, rn.pasEdits);
            const d2 = apply(dfm, rn.dfmEdits);
            if (p2 !== undefined && d2 !== undefined) { pas = p2; dfm = d2; name = nice; }
        }
    }
    plan.pas = pas; plan.dfm = dfm; plan.added.push(name);
    return undefined;
}

function finish(before: { pas: string; dfm: string }, plan: Plan): DesignResult & { added?: string[] } {
    const d = diffEdit(before.dfm, plan.dfm);
    const p = diffEdit(before.pas, plan.pas);
    return { dfmEdits: d ? [d] : [], pasEdits: p ? [p] : [], added: plan.added, note: `${plan.added.length} created` };
}

/** One persistent field for each column of the SELECT of a query that has none yet. */
export function createFieldsEdits(pas: string, dfm: string, datasetName: string): DesignResult & { added?: string[] } {
    const root = parseDfmTree(dfm);
    const dataset = root ? findNode(root, datasetName) : undefined;
    if (!dataset || !isDataset(dataset.className)) { return fail(`${datasetName} is not a dataset.`); }
    const todo = fieldsToCreate(dfm, dataset);
    if (todo.length === 0) { return fail(dataset.props['SQL.Strings'] === undefined ? `${datasetName} has no SQL in the form: add the fields one by one.` : `Every column of the SELECT of ${datasetName} already has its field (or the SELECT has a * and cannot be read).`); }
    const plan: Plan = { pas, dfm, added: [] };
    for (const field of todo) {
        const g = guessFieldClass(field);
        const err = addOne(plan, { className: g.cls, holder: datasetName, field, fieldProp: 'FieldName', size: g.size });
        if (err) { return fail(`${field}: ${err}`); }
    }
    return finish({ pas, dfm }, plan);
}

/** One column for each field of the dataset a view shows that it has no column for yet. */
export function createColumnsEdits(pas: string, dfm: string, viewName: string): DesignResult & { added?: string[] } {
    const root = parseDfmTree(dfm);
    const view = root ? findNode(root, viewName) : undefined;
    if (!view || !isGridView(view.className)) { return fail(`${viewName} is not a grid view.`); }
    const todo = columnsToCreate(dfm, view);
    if (todo.length === 0) { return fail(`${viewName} has a column for every field of its dataset, or its DataController.DataSource does not lead to a dataset with fields or a SELECT.`); }
    const cls = /Banded/i.test(view.className) ? (/DB/.test(view.className) ? 'TcxGridDBBandedColumn' : 'TcxGridBandedColumn') : /DB/.test(view.className) ? 'TcxGridDBColumn' : 'TcxGridColumn';
    const plan: Plan = { pas, dfm, added: [] };
    for (const field of todo) {
        const err = addOne(plan, { className: cls, holder: viewName, field, fieldProp: 'DataBinding.FieldName' });
        if (err) { return fail(`${field}: ${err}`); }
    }
    return finish({ pas, dfm }, plan);
}
