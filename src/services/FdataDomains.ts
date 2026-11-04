/**
 * The domains of the FDATA query (one per kind of data of the database: ADR, IDT, FLG, CMNT…) and the Delphi field
 * class each one gives. A column is of a domain when its name is the domain's code or ends with it after an
 * underscore (`CLI_IDT`, `ART_CMNT`, `SITE_WEB`); the longest code wins (`SEQ_ALPHANUM` before `SEQ`).
 *
 * The class follows the Oracle type: text is a TStringField, a TWideStringField when it is NVARCHAR2 or longer
 * than 255, a number without decimals a TIntegerField (a TLargeintField from ten digits), a number with
 * decimals a TFloatField, DATE a TDateTimeField (a TDateField / TTimeField for the domains that say so),
 * CLOB a TMemoField, NCLOB a TWideMemoField, BLOB a TBlobField.
 */
export interface FieldType { cls: string; size?: number }

/** Code, Oracle type, and the class when the type alone does not say it. */
const DOMAINS: [string, string, string?][] = [
    ['ADR', 'VARCHAR2(50)'], ['BP', 'VARCHAR2(50)'], ['CDX', 'VARCHAR2(50)'], ['CHX', 'NUMBER'],
    ['CMNT', 'VARCHAR2(4000)'], ['CODE', 'VARCHAR2(10)'], ['COEF', 'NUMBER(20,8)'], ['CP', 'VARCHAR2(10)'],
    ['DAHE', 'DATE'], ['DAT', 'DATE', 'TDateField'], ['DECI', 'NUMBER(20,8)'], ['DESI', 'VARCHAR2(50)'],
    ['DESL', 'VARCHAR2(200)'], ['DURMN', 'NUMBER'], ['EMAIL', 'VARCHAR2(100)'], ['ENTI', 'NUMBER'],
    ['HEUR', 'DATE', 'TTimeField'], ['IDT', 'NUMBER'], ['IMG', 'CHAR(1)'], ['FLG', 'NUMBER(1)'],
    ['PATH', 'VARCHAR2(500)'], ['PHONE', 'VARCHAR2(50)'], ['PRX', 'NUMBER(20,8)'], ['RS', 'VARCHAR2(50)'],
    ['SEQ', 'NUMBER'], ['SITE_WEB', 'VARCHAR2(100)'], ['TAUX', 'NUMBER(20,8)'], ['SEQ_ALPHANUM', 'VARCHAR2(1)'],
    ['SQL', 'CLOB'], ['BLOB', 'BLOB'], ['SHORT_DATE', 'NUMBER(4)'], ['NDESI', 'NVARCHAR2(50)'],
    ['NUM2', 'NUMBER(2)'], ['NCMNT', 'NVARCHAR2(2000)'], ['NSQL', 'NCLOB'], ['LARGINT', 'NUMBER(8)', 'TLargeintField'],
];

/** The Delphi field of an Oracle column type (`VARCHAR2(50)`, `NUMBER(20,8)`, `DATE`…), undefined for a type that is not known. */
export function fieldOfOracleType(type: string): FieldType | undefined {
    const m = /^\s*(\w+)\s*(?:\(\s*(\d+)\s*(?:,\s*(-?\d+)\s*)?\))?\s*$/.exec(type);
    if (!m) { return undefined; }
    const name = m[1].toUpperCase();
    const p = m[2] === undefined ? undefined : Number(m[2]);
    const scale = m[3] === undefined ? 0 : Number(m[3]);
    switch (name) {
        case 'VARCHAR2': case 'VARCHAR': case 'CHAR':
            return p !== undefined && p > 255 ? { cls: 'TWideStringField', size: p } : { cls: 'TStringField', size: p ?? 50 };
        case 'NVARCHAR2': case 'NCHAR': return { cls: 'TWideStringField', size: p ?? 50 };
        case 'NUMBER': case 'INTEGER': case 'INT': case 'SMALLINT':
            if (scale > 0) { return { cls: 'TFloatField' }; }
            return { cls: p !== undefined && p >= 10 ? 'TLargeintField' : 'TIntegerField' };
        case 'FLOAT': case 'BINARY_DOUBLE': case 'BINARY_FLOAT': return { cls: 'TFloatField' };
        case 'DATE': case 'TIMESTAMP': return { cls: 'TDateTimeField' };
        case 'CLOB': case 'LONG': return { cls: 'TMemoField' };
        case 'NCLOB': return { cls: 'TWideMemoField' };
        case 'BLOB': case 'RAW': return { cls: 'TBlobField' };
        default: return undefined;
    }
}

const BY_CODE = new Map<string, FieldType>(DOMAINS.map(([code, type, cls]) => {
    const f = fieldOfOracleType(type)!;
    return [code, cls ? { ...f, cls } : f];
}));
const CODES_LONGEST_FIRST = [...BY_CODE.keys()].sort((a, b) => b.length - a.length);

/** The field of the column when its name carries an FDATA domain (`CLI_IDT` → TIntegerField), else undefined. */
export function fieldOfDomain(column: string): FieldType | undefined {
    const c = column.toUpperCase();
    const code = CODES_LONGEST_FIRST.find(d => c === d || c.endsWith('_' + d));
    if (!code) { return undefined; }
    const f = BY_CODE.get(code)!;
    return { ...f };
}
