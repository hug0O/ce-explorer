/**
 * Devart UniDAC: connection, transaction, datasets (query, table, stored procedure), SQL / script / dump /
 * loader components and the provider components that link a database driver. All of them are non-visual:
 * the designer draws them as icons and edits what matters (provider and server of a connection, the
 * connection, table and SQL of a dataset). Event signatures are those of the Devart reference.
 */
import type { ComponentDef, EventDef } from './DelphiForm';
import { DATASET_EVENTS } from './DelphiData';

const SENDER = 'Sender: TObject';
const ev = (name: string, params = SENDER): EventDef => ({ name, params });

const UNI = ['Data.DB', 'DBAccess', 'Uni', 'MemDS'];

function part(className: string, namePrefix: string, unit: string, events: EventDef[], extraUnits: string[]): ComponentDef {
    return { className, namePrefix, unit, extraUnits, width: undefined, height: undefined, props: [], tabOrder: false, events };
}

const CONNECTION_EVENTS = [
    ev('BeforeConnect'), ev('AfterConnect'), ev('BeforeDisconnect'), ev('AfterDisconnect'),
    ev('OnError', 'Sender: TObject; E: EDAError; var Fail: boolean'),
    ev('OnConnectionLost', 'Sender: TObject; Component: TComponent; ConnLostCause: TConnLostCause; var RetryMode: TRetryMode'),
];
/** TCustomDADataSet adds these to the TDataSet events. */
const UNI_DATASET_EVENTS = [
    ...DATASET_EVENTS,
    ev('AfterExecute', 'Sender: TObject; Result: boolean'),
    ev('BeforeFetch', 'DataSet: TCustomDADataSet; var Cancel: boolean'),
    ev('AfterFetch', 'DataSet: TCustomDADataSet'),
];

/** Database providers: the component is dropped next to the connection so that the driver is linked into the application. */
const PROVIDERS: [string, string][] = [
    ['TOracleUniProvider', 'OracleUniProvider'], ['TSQLServerUniProvider', 'SQLServerUniProvider'], ['TMySQLUniProvider', 'MySQLUniProvider'],
    ['TPostgreSQLUniProvider', 'PostgreSQLUniProvider'], ['TSQLiteUniProvider', 'SQLiteUniProvider'], ['TInterBaseUniProvider', 'InterBaseUniProvider'],
    ['TAccessUniProvider', 'AccessUniProvider'], ['TODBCUniProvider', 'ODBCUniProvider'],
];

export const UNIDAC: ComponentDef[] = [
    part('TUniConnection', 'UniConnection', 'Uni', CONNECTION_EVENTS, [...UNI, 'UniProvider']),
    part('TUniTransaction', 'UniTransaction', 'Uni', [], UNI),
    part('TUniQuery', 'UniQuery', 'Uni', UNI_DATASET_EVENTS, UNI),
    part('TUniTable', 'UniTable', 'Uni', UNI_DATASET_EVENTS, UNI),
    part('TUniStoredProc', 'UniStoredProc', 'Uni', UNI_DATASET_EVENTS, UNI),
    part('TUniSQL', 'UniSQL', 'Uni', [ev('AfterExecute', 'Sender: TObject; Result: boolean')], UNI),
    part('TUniUpdateSQL', 'UniUpdateSQL', 'Uni', [], UNI),
    part('TUniDataSource', 'UniDataSource', 'Uni', [ev('OnDataChange', 'Sender: TObject; Field: TField'), ev('OnStateChange'), ev('OnUpdateData')], UNI),
    part('TUniMetaData', 'UniMetaData', 'Uni', [], UNI),
    part('TUniEncryptor', 'UniEncryptor', 'Uni', [], UNI),
    part('TUniScript', 'UniScript', 'UniScript', [], UNI),
    part('TUniDump', 'UniDump', 'UniDump', [], UNI),
    part('TUniLoader', 'UniLoader', 'UniLoader', [], UNI),
    part('TUniAlerter', 'UniAlerter', 'UniAlerter', [], UNI),
    part('TUniConnectDialog', 'UniConnectDialog', 'UniDacVcl', [], UNI),
    ...PROVIDERS.map(([cls, unit]) => part(cls, unit, unit, [], ['UniProvider'])),
];

/** The providers a connection can name (`ProviderName`), as UniDAC spells them. */
export const UNIDAC_PROVIDER_NAMES = ['Oracle', 'SQL Server', 'MySQL', 'PostgreSQL', 'SQLite', 'InterBase', 'Access', 'ODBC', 'DB2', 'ASE', 'Advantage', 'NexusDB'];
