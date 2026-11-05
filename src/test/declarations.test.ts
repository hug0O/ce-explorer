import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topLevelDeclarations } from '../utils/declarations';

const names = (text: string, lang: string): string[] => topLevelDeclarations(text, lang).map(d => d.kind + ':' + d.name);

test('a Pascal unit exports its constants, variables, types and enumeration values, not what is inside a class or after implementation', () => {
    const src = [
        'unit UTools;', 'interface', 'uses SysUtils;',
        'const', '  Version = 3;', "  AppName: string = 'x';", '  // Hidden = 1;',
        'type',
        '  TMode = (mNone, mFast,', '    mSlow);',
        '  TBox<T> = class', '  private', '    FItem: T;', '  public', '    Count: Integer;', '  end;',
        '  TPair<K, V> = record', '    Key: K;', '    Value: V;', '  end;',
        '  TNotify = procedure(Sender: TObject) of object;', '  TAlias = Integer;', '  TForward = class;', '  TNames = array of string;',
        'var', '  GCount, GTotal: Integer;', '  GName: string;',
        'function Max<T>(const A, B: T): T;', 'resourcestring', "  SOk = 'ok';",
        'implementation', 'const', '  Private1 = 1;', 'var', '  PrivateVar: Integer;', 'end.',
    ].join('\n');
    assert.deepEqual(names(src, 'pascal'), [
        'constant:Version', 'constant:AppName',
        'type:TMode', 'enum:mNone', 'enum:mFast', 'enum:mSlow',
        'type:TBox', 'type:TPair', 'type:TNotify', 'type:TAlias', 'type:TForward', 'type:TNames',
        'variable:GCount', 'variable:GTotal', 'variable:GName', 'constant:SOk',
    ]);
});

test('the other languages export their constants, enumerations, types and macros', () => {
    assert.deepEqual(names('export const MAX = 3;\nexport enum Color { Red }\nexport type Id = string;\nexport interface I {}\nexport default class K {}\nexport async function f() {}\nconst hidden = 1;', 'typescript'),
        ['constant:MAX', 'enum:Color', 'type:Id', 'interface:I', 'class:K', 'function:f']);
    assert.deepEqual(names('LIMIT = 10\nname = 1\nTAG: str = "x"\n# NOPE = 1\nx == 2', 'python'), ['constant:LIMIT', 'variable:name', 'constant:TAG']);
    assert.deepEqual(names('#define MAXN 10\ntypedef unsigned int uint;\nenum Mode { A, B };\nstruct Pt { int x; };\nusing Id = int;\n// #define OLD 1', 'cpp'),
        ['macro:MAXN', 'type:uint', 'type:Mode', 'type:Pt', 'type:Id']);
    assert.deepEqual(names('const Max = 3\nvar count int\ntype Point struct {}', 'go'), ['constant:Max', 'variable:count', 'type:Point']);
    assert.deepEqual(names('pub const MAX: u32 = 3;\npub enum Mode { A }\nfn private() {}\npub struct S;', 'rust'), ['constant:MAX', 'type:Mode', 'type:S']);
    assert.deepEqual(names('anything', 'markdown'), []);
});
