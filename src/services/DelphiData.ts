/**
 * Data-access basics shared by every dataset library (UniDAC, FireDAC, ADO, ClientDataSet…): the datasets
 * themselves, their persistent fields — named components nested in the dataset in the .dfm, with no
 * Left / Top — and the TDataSource that links a dataset to the controls. Pure; nothing here writes the .dfm.
 */
import type { ComponentDef, EventDef } from './DelphiForm';

/** A dataset: UniDAC queries, tables and stored procedures, and the usual FireDAC / ADO / BDE / client ones. */
export const isDataset = (cls: string): boolean => /^T(Uni(Query|Table|StoredProc)|\w*(Query|Table|StoredProc|DataSet|MemTable))$/i.test(cls);
/** A persistent field (TStringField, TIntegerField…): a component nested in its dataset. */
export const isDatasetField = (cls: string): boolean => /^T\w*Field$/.test(cls);
/** The field classes the palette offers: only these are refused outside a dataset (a custom TSearchField control is not one). */
const KNOWN_FIELDS = new Set(['TStringField', 'TWideStringField', 'TIntegerField', 'TSmallintField', 'TLargeintField', 'TWordField', 'TAutoIncField', 'TFloatField', 'TCurrencyField', 'TBCDField', 'TFMTBCDField', 'TBooleanField', 'TDateField', 'TTimeField', 'TDateTimeField', 'TSQLTimeStampField', 'TMemoField', 'TWideMemoField', 'TBlobField', 'TGraphicField', 'TGuidField', 'TVariantField']);
export const isKnownField = (cls: string): boolean => KNOWN_FIELDS.has(cls);
/** Components whose `SQL.Strings` the designer reads and writes. */
export const hasSql = (cls: string): boolean => isDataset(cls) || /^TUni(SQL|Script)$/i.test(cls);
export const isDataSource = (cls: string): boolean => /DataSource$/i.test(cls);
export const isConnection = (cls: string): boolean => /^T\w*Connection$/.test(cls);

const SENDER = 'Sender: TObject';
const ev = (name: string, params = SENDER): EventDef => ({ name, params });
const FIELD = 'Sender: TField';

function make(
    className: string, namePrefix: string, unit: string, width: number | undefined, height: number | undefined,
    props: string[], events: EventDef[], extraUnits: string[] = [], nested = false,
): ComponentDef {
    return { className, namePrefix, unit, extraUnits, width, height, props, tabOrder: false, events, ...(nested ? { nested: true } : {}) };
}

/** The events every persistent field has (Data.DB). */
export const FIELD_EVENTS: EventDef[] = [
    ev('OnGetText', `${FIELD}; var Text: string; DisplayText: Boolean`), ev('OnSetText', `${FIELD}; const Text: string`),
    ev('OnChange', FIELD), ev('OnValidate', FIELD),
];

/** Persistent field classes with the unit that declares them. */
export const FIELD_CLASSES: [string, string][] = [
    ['TStringField', 'Data.DB'], ['TWideStringField', 'Data.DB'], ['TIntegerField', 'Data.DB'], ['TSmallintField', 'Data.DB'],
    ['TLargeintField', 'Data.DB'], ['TWordField', 'Data.DB'], ['TAutoIncField', 'Data.DB'], ['TFloatField', 'Data.DB'],
    ['TCurrencyField', 'Data.DB'], ['TBCDField', 'Data.DB'], ['TFMTBCDField', 'Data.FMTBcd'], ['TBooleanField', 'Data.DB'],
    ['TDateField', 'Data.DB'], ['TTimeField', 'Data.DB'], ['TDateTimeField', 'Data.DB'], ['TSQLTimeStampField', 'Data.DB'],
    ['TMemoField', 'Data.DB'], ['TWideMemoField', 'Data.DB'], ['TBlobField', 'Data.DB'], ['TGraphicField', 'Data.DB'],
    ['TGuidField', 'Data.DB'], ['TVariantField', 'Data.DB'],
];

export const DATA_COMPONENTS: ComponentDef[] = [
    make('TDataSource', 'DataSource', 'Data.DB', undefined, undefined, [], [ev('OnDataChange', 'Sender: TObject; Field: TField'), ev('OnStateChange'), ev('OnUpdateData')]),
    // `FieldName` is filled in from the inspector; `%PARENT%` is the dataset the field goes into (UniQuery1 → UniQuery1Field1).
    ...FIELD_CLASSES.map(([cls, unit]) => make(cls, '%PARENT%Field', unit, 64, 22, ["FieldName = ''"], FIELD_EVENTS, unit === 'Data.DB' ? [] : ['Data.DB'], true)),
];

/** Handler signatures of the dataset events (Data.DB): `DataSet: TDataSet` for most of them. */
const DS = 'DataSet: TDataSet';
export const DATASET_EVENTS: EventDef[] = [
    ...['BeforeOpen', 'AfterOpen', 'BeforeClose', 'AfterClose', 'BeforeInsert', 'AfterInsert', 'BeforeEdit', 'AfterEdit', 'BeforePost', 'AfterPost',
        'BeforeCancel', 'AfterCancel', 'BeforeDelete', 'AfterDelete', 'BeforeScroll', 'AfterScroll', 'OnNewRecord', 'OnCalcFields'].map(n => ev(n, DS)),
    ev('OnFilterRecord', `${DS}; var Accept: Boolean`),
    ev('OnPostError', `${DS}; E: EDatabaseError; var Action: TDataAction`), ev('OnEditError', `${DS}; E: EDatabaseError; var Action: TDataAction`),
    ev('OnDeleteError', `${DS}; E: EDatabaseError; var Action: TDataAction`),
];
