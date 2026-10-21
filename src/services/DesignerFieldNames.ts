/**
 * The fields of a dataset and the columns of a grid view, seen from the .dfm: which persistent fields a query has, which
 * columns its SELECT would give, which columns a view already shows, and so what can still be created.
 *
 * Read-only and pure: the edits that create them are in DesignerFields.
 */
import { DfmNode, findNode } from './DelphiLayout';
import { isDataset, isDatasetField } from './DelphiData';
import { isGridColumn, isGridView } from './DelphiGrid';
import { selectColumns } from './ProjectChecks';
import { decodeDelphiString } from './ProjectSql';

const unq = (v: string | undefined): string => (v ? decodeDelphiString(v) : '');
const rootOf = (n: DfmNode): DfmNode => { let r = n; while (r.parent) { r = r.parent; } return r; };

/** The names a SELECT in the `SQL.Strings` of a dataset gives to its columns, in upper case; undefined when it cannot be known. */
export function sqlColumnsOf(dfm: string, dataset: DfmNode): string[] | undefined {
    const at = dataset.propLines['SQL.Strings'];
    if (at === undefined) { return undefined; }
    const lines = dfm.split('\n');
    const parts: string[] = [];
    for (let i = at; i < lines.length; i++) {
        const t = lines[i].replace(/\r$/, '');
        const first = i === at ? t.slice(t.indexOf('=') + 1).trim().replace(/^\(/, '') : t.trim();
        const closes = /\)\s*$/.test(first) && (first.match(/'/g) ?? []).length % 2 === 0;
        parts.push(decodeDelphiString(closes ? first.replace(/\)\s*$/, '') : first));
        if (closes) { break; }
    }
    return selectColumns(parts.join('\n'));
}

/** The persistent fields a dataset holds, by FieldName (what the .dfm says, upper-cased for comparison). */
export function persistentFields(dataset: DfmNode): { name: string; field: string }[] {
    return dataset.children.filter(c => isDatasetField(c.className)).map(c => ({ name: c.name, field: unq(c.props['FieldName']) }));
}

/** Names of the columns of the SELECT of a dataset that have no persistent field yet. */
export function fieldsToCreate(dfm: string, dataset: DfmNode): string[] {
    if (!isDataset(dataset.className)) { return []; }
    const cols = sqlColumnsOf(dfm, dataset);
    if (!cols) { return []; }
    const have = new Set(persistentFields(dataset).map(f => f.field.toUpperCase()));
    return cols.filter(c => !have.has(c.toUpperCase()));
}

/** The dataset a grid view shows: the one of its data source (`DataController.DataSource` → `DataSet`). */
export function viewDataset(view: DfmNode): DfmNode | undefined {
    const ds = view.props['DataController.DataSource'];
    if (!ds) { return undefined; }
    const root = rootOf(view);
    const source = findNode(root, ds);
    const set = source?.props['DataSet'];
    return set ? findNode(root, set) : undefined;
}

/** The fields a view could show: the persistent fields of its dataset, else the columns of its SELECT. */
export function datasetFieldNames(dfm: string, dataset: DfmNode): string[] {
    const persistent = persistentFields(dataset).map(f => f.field).filter(Boolean);
    if (persistent.length) { return persistent; }
    return sqlColumnsOf(dfm, dataset) ?? [];
}

/** Fields of the dataset a view shows that it has no column for yet. */
export function columnsToCreate(dfm: string, view: DfmNode): string[] {
    if (!isGridView(view.className)) { return []; }
    const dataset = viewDataset(view);
    if (!dataset) { return []; }
    const have = new Set(view.children.filter(c => isGridColumn(c.className)).map(c => unq(c.props['DataBinding.FieldName']).toUpperCase()));
    return datasetFieldNames(dfm, dataset).filter(f => !have.has(f.toUpperCase()));
}
