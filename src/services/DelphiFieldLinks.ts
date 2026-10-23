/**
 * The link between a grid column (`TcxGridDBColumn`, `DataBinding.FieldName`) and the persistent field of the dataset behind
 * its view (`DataController.DataSource` → the data source's `DataSet` → the `TStringField`… with that `FieldName`), so the
 * designer can jump from one to the other and edit the label (`DisplayLabel`) of the field from the column. Only what is on
 * the same form can be followed: a data source in a data module is not found. Pure.
 */
import type { DfmNode } from './DelphiLayout';
import { isDataSource, isDataset, isDatasetField } from './DelphiData';
import { isGridColumn, isGridView } from './DelphiGrid';

export interface ColumnField {
    /** The persistent field of the dataset with the column's field name, when the dataset has one. */
    field?: string;
    fieldLabel?: string;
    fieldWidth?: number;
    dataset: string;
    /** The name of the field the column is bound to. */
    fieldName: string;
}

export interface FieldLinks {
    /** Column name → its field. */
    columns: Map<string, ColumnField>;
    /** Persistent field name → the columns bound to it. */
    users: Map<string, string[]>;
}

const unquote = (v: string | undefined, decode: (raw: string) => string): string => (v === undefined ? '' : decode(v));

export function fieldLinks(root: DfmNode, decode: (raw: string) => string): FieldLinks {
    const all: DfmNode[] = [];
    (function walk(n: DfmNode): void { all.push(n); n.children.forEach(walk); })(root);
    const byName = new Map(all.map(n => [n.name, n]));
    const columns = new Map<string, ColumnField>();
    const users = new Map<string, string[]>();
    for (const view of all.filter(n => isGridView(n.className))) {
        const source = byName.get(view.props['DataController.DataSource'] ?? '');
        const dsName = source && isDataSource(source.className) ? source.props['DataSet'] : undefined;
        const dataset = dsName ? byName.get(dsName) : undefined;
        if (!dataset || !isDataset(dataset.className)) { continue; }
        const fields = dataset.children.filter(c => isDatasetField(c.className));
        for (const col of view.children.filter(c => isGridColumn(c.className))) {
            const fieldName = unquote(col.props['DataBinding.FieldName'], decode);
            if (!fieldName) { continue; }
            const f = fields.find(x => unquote(x.props['FieldName'], decode).toLowerCase() === fieldName.toLowerCase());
            const width = f && /^\d+$/.test(f.props['DisplayWidth'] ?? '') ? Number(f.props['DisplayWidth']) : undefined;
            columns.set(col.name, {
                dataset: dataset.name, fieldName, field: f?.name,
                fieldLabel: f && f.props['DisplayLabel'] !== undefined ? decode(f.props['DisplayLabel']) : undefined, fieldWidth: width,
            });
            if (f) { users.set(f.name, [...(users.get(f.name) ?? []), col.name]); }
        }
    }
    return { columns, users };
}
