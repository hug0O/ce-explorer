import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

const module = require('node:module');
const originalLoad = module._load;
const vscodeMock = {
    Uri: {
        file: (filePath: string) => ({ fsPath: filePath, path: filePath, toString: () => filePath }),
        parse: (uri: string) => ({ path: uri }),
    },
    Position: class {
        constructor(public readonly line: number, public readonly character: number) {}
    },
    Range: class {
        public readonly start: { line: number; character: number };
        public readonly end: { line: number; character: number };
        constructor(
            a: { line: number; character: number } | number,
            b: { line: number; character: number } | number,
            c?: number,
            d?: number,
        ) {
            // Support both the 2-arg (start, end) and 4-arg (line, char, line, char) forms,
            // matching the real vscode.Range API.
            if (c === undefined) {
                this.start = a as { line: number; character: number };
                this.end = b as { line: number; character: number };
            } else {
                this.start = { line: a as number, character: b as number };
                this.end = { line: c, character: d as number };
            }
        }
        contains(position: { line: number; character: number }): boolean {
            return position.line >= this.start.line
                && position.line <= this.end.line;
        }
    },
    EndOfLine: { LF: 0 },
};

module._load = (request: string, parent: unknown, isMain: boolean) => {
    if (request === 'vscode') {
        return vscodeMock;
    }
    return originalLoad(request, parent, isMain);
};

const { PascalLanguageProvider } = require('../providers/PascalLanguageProvider') as typeof import('../providers/PascalLanguageProvider');
const { CppLanguageProvider } = require('../providers/CppLanguageProvider') as typeof import('../providers/CppLanguageProvider');
const { TypeScriptLanguageProvider } = require('../providers/TypeScriptLanguageProvider') as typeof import('../providers/TypeScriptLanguageProvider');
const { PythonLanguageProvider } = require('../providers/PythonLanguageProvider') as typeof import('../providers/PythonLanguageProvider');
const { CSharpLanguageProvider } = require('../providers/CSharpLanguageProvider') as typeof import('../providers/CSharpLanguageProvider');
const { GoLanguageProvider } = require('../providers/GoLanguageProvider') as typeof import('../providers/GoLanguageProvider');
const { RustLanguageProvider } = require('../providers/RustLanguageProvider') as typeof import('../providers/RustLanguageProvider');
const { JavaLanguageProvider } = require('../providers/JavaLanguageProvider') as typeof import('../providers/JavaLanguageProvider');

const fixturesDir = path.join(__dirname, '..', '..', 'test-fixtures');
/** The large real-world Delphi unit is not part of the public repository: the tests that read it are skipped when it is absent. */
const HAS_OFFRE = fs.existsSync(path.join(fixturesDir, 'large_unit.pas'));

type ParsedDocumentLike = {
    classes: Array<{
        name: string;
        members: Array<{ name: string; kind: string; implementationRange?: unknown }>;
        parentClass?: string;
        interfaces: string[];
    }>;
    standaloneProcedures: Array<{ name: string }>;
};

type ProviderLike = {
    parseDocument(document: vscodeDocumentLike): ParsedDocumentLike;
};

type vscodeDocumentLike = {
    uri: unknown;
    languageId: string;
    fileName: string;
    getText(): string;
    lineCount: number;
};

function fixtureDocument(fileName: string, languageId: string): vscodeDocumentLike {
    const uri = vscodeMock.Uri.file(path.join(fixturesDir, fileName));
    const content = fs.readFileSync(uri.fsPath, 'utf8');
    return {
        uri,
        languageId,
        fileName: uri.fsPath,
        lineCount: content.split(/\r?\n/).length,
        getText: () => content,
    };
}

function memberNames(doc: vscodeDocumentLike, provider: ProviderLike): string[] {
    const parsed = provider.parseDocument(doc);
    return parsed.classes.flatMap(cls => cls.members.map(member => member.name));
}

test('Pascal parser extracts TDemoClass members from TestUnit fixture', () => {
    const provider = new PascalLanguageProvider();
    const doc = fixtureDocument('TestUnit.pas', 'pascal');
    const parsed = provider.parseDocument(doc);
    const demo = parsed.classes.find(cls => cls.name === 'TDemoClass');

    assert.ok(demo, 'TDemoClass should be parsed');
    assert.equal(demo?.parentClass, 'TBaseClass');
    assert.deepEqual(
        demo?.members.map(member => member.name),
        ['FActive', 'FCount', 'FName', 'Active', 'Count', 'Name', 'Create', 'Destroy', 'Calculate', 'DoSomething', 'GetValue', 'DoProtected', 'SetActive'],
    );
});

test('C++ parser extracts MyWidget declaration and implementation members', () => {
    const provider = new CppLanguageProvider();
    const header = fixtureDocument('MyWidget.h', 'cpp');
    const source = fixtureDocument('MyWidget.cpp', 'cpp');

    const headerParsed = provider.parseDocument(header);
    const myWidget = headerParsed.classes.find(cls => cls.name === 'MyWidget');
    assert.ok(myWidget, 'MyWidget should be parsed from header');
    assert.deepEqual(
        myWidget?.members.map(member => member.name),
        ['m_width', 'm_height', 'm_visible', 'm_items', 'MyWidget', '~MyWidget', 'render', 'addItem', 'getItemCount', 'setVisible', 'isVisible', 's_instanceCount'],
    );

    const sourceParsed = provider.parseDocument(source);
    const sourceWidget = sourceParsed.classes.find(cls => cls.name === 'MyWidget');
    assert.ok(sourceWidget, 'MyWidget should be parsed from source');
    assert.ok(sourceWidget?.members.some(member => member.name === 'render' && member.implementationRange), 'render implementation should be linked');
});

test('TypeScript parser extracts classes, members, getters, setters, and private fields', () => {
    const provider = new TypeScriptLanguageProvider();
    const doc = fixtureDocument('example.ts', 'typescript');
    const parsed = provider.parseDocument(doc);
    const userService = parsed.classes.find(cls => cls.name === 'UserService');
    const configService = parsed.classes.find(cls => cls.name === 'ConfigService');

    assert.ok(userService, 'UserService should be parsed');
    assert.equal(userService?.parentClass, 'BaseService');
    assert.deepEqual(userService?.interfaces, ['Loggable']);
    assert.ok(userService?.members.some(member => member.name === 'users' && member.kind === 'property'));
    assert.ok(userService?.members.some(member => member.name === 'addUser'));
    assert.ok(userService?.members.some(member => member.name === 'userCount' && member.kind === 'property'));

    assert.ok(configService, 'ConfigService should be parsed');
    assert.ok(configService?.members.some(member => member.name === 'env' && member.kind === 'property'));
});

test('TypeScript JavaScript fixture parses private fields and static methods', () => {
    const provider = new TypeScriptLanguageProvider();
    const doc = fixtureDocument('example.js', 'javascript');
    const parsed = provider.parseDocument(doc);
    const emitter = parsed.classes.find(cls => cls.name === 'EventEmitter');

    assert.ok(emitter, 'EventEmitter should be parsed from JavaScript');
    assert.ok(emitter?.members.some(member => member.name === '#listeners'));
    assert.ok(emitter?.members.some(member => member.name === 'merge' && member.isStatic));
});

test('Python parser extracts fields, constructor, property, staticmethod, and classmethod', () => {
    const provider = new PythonLanguageProvider();
    const doc = fixtureDocument('example.py', 'python');
    const parsed = provider.parseDocument(doc);
    const vehicle = parsed.classes.find(cls => cls.name === 'Vehicle');

    assert.ok(vehicle, 'Vehicle should be parsed');
    assert.ok(vehicle.members.some(member => member.name === 'brand'));
    assert.ok(vehicle.members.some(member => member.name === '_speed' && member.visibility.toString() === 'protected'));
    assert.ok(vehicle.members.some(member => member.name === '__init__' && member.kind === 'constructor'));
    assert.ok(vehicle.members.some(member => member.name === 'speed' && member.kind === 'property'));
    assert.ok(vehicle.members.some(member => member.name === 'is_classic' && member.isStatic));
    assert.ok(vehicle.members.some(member => member.name === 'from_dict' && member.isStatic));
});

test('C# parser extracts Product members including multiline properties', () => {
    const provider = new CSharpLanguageProvider();
    const doc = fixtureDocument('Example.cs', 'csharp');
    const parsed = provider.parseDocument(doc);
    const product = parsed.classes.find(cls => cls.name === 'Product');
    const money = parsed.classes.find(cls => cls.name === 'Money');

    assert.ok(product, 'Product should be parsed');
    assert.ok(product.members.some(member => member.name === '_id'));
    assert.ok(product.members.some(member => member.name === 'InstanceCount' && member.kind === 'property'));
    assert.ok(product.members.some(member => member.name === 'Purchase'));

    assert.ok(money, 'Money struct should be parsed');
    assert.ok(money.members.some(member => member.name === 'Amount' && member.kind === 'property'));
});

test('Go parser extracts struct fields, interface methods, receiver methods, and standalone function', () => {
    const provider = new GoLanguageProvider();
    const doc = fixtureDocument('example.go', 'go');
    const parsed = provider.parseDocument(doc);
    const server = parsed.classes.find(cls => cls.name === 'Server');
    const config = parsed.classes.find(cls => cls.name === 'Config');

    assert.ok(server, 'Server struct should be parsed');
    assert.deepEqual(
        server?.members.map(member => member.name),
        ['Host', 'Port', 'Protocol', 'running', 'Start', 'Stop', 'IsRunning', 'Address'],
    );

    assert.ok(config, 'Config interface should be parsed');
    assert.equal(parsed.standaloneProcedures[0].name, 'NewServer');
});

test('Rust parser extracts struct, impl methods, trait, trait impl, and enum', () => {
    const provider = new RustLanguageProvider();
    const doc = fixtureDocument('example.rs', 'rust');
    const parsed = provider.parseDocument(doc);
    const user = parsed.classes.find(cls => cls.name === 'User');
    const hasId = parsed.classes.find(cls => cls.name === 'HasId');
    const status = parsed.classes.find(cls => cls.name === 'Status');

    assert.ok(user, 'User struct should be parsed');
    assert.deepEqual(user?.members.map(member => member.name), ['id', 'name', 'email', 'active', 'new', 'deactivate', 'display_info', 'get_id']);
    assert.ok(hasId, 'HasId trait should be parsed');
    assert.equal(hasId?.members.length, 1);
    assert.ok(status, 'Status enum should be parsed');
});

test('Java parser extracts class, interface, abstract class, and members', () => {
    const provider = new JavaLanguageProvider();
    const doc = fixtureDocument('Example.java', 'java');
    const parsed = provider.parseDocument(doc);
    const animal = parsed.classes.find(cls => cls.name === 'Animal');
    const speakable = parsed.classes.find(cls => cls.name === 'Speakable');
    const mammal = parsed.classes.find(cls => cls.name === 'Mammal');

    assert.ok(animal, 'Animal should be parsed');
    assert.deepEqual(animal?.members.map(member => member.name), ['name', 'age', 'species', 'Animal', 'getName', 'setName', 'getAge', 'makeSound', 'toString']);
    assert.ok(speakable, 'Speakable interface should be parsed');
    assert.ok(mammal, 'Mammal abstract class should be parsed');
    assert.ok(mammal?.members.some(member => member.name === 'getHabitat' && member.isAbstract));
});

test('Pascal parser extracts standalone functions (single + multiline) alongside records', () => {
    const provider = new PascalLanguageProvider();
    const doc = fixtureDocument('large_unit.pas', 'pascal');
    const parsed = provider.parseDocument(doc);

    assert.ok(parsed.standaloneProcedures.length > 40, `expected many standalone functions, got ${parsed.standaloneProcedures.length}`);
    // single-line declaration
    assert.ok(parsed.standaloneProcedures.some(p => p.name === 'fGet_Order_Label'));
    // multi-line declaration
    assert.ok(parsed.standaloneProcedures.some(p => p.name === 'pArchive_Stock'));
    assert.ok(parsed.standaloneProcedures.some(p => p.name === 'fUpdate_Order'));
    // records are still parsed alongside
    assert.ok(parsed.classes.some(c => c.name === 'TOrderInfos'));
});

test('Pascal implementation range spans nested try/finally to the routine end', () => {
    const provider = new PascalLanguageProvider();
    const doc = fixtureDocument('large_unit.pas', 'pascal');
    const parsed = provider.parseDocument(doc);

    type ProcWithRange = { name: string; implementationRange?: { start: { line: number }; end: { line: number } } };
    const fn = (parsed.standaloneProcedures as ProcWithRange[]).find(p => p.name === 'fComputeSalePrice');
    assert.ok(fn, 'fComputeSalePrice should be parsed as standalone');
    assert.ok(fn!.implementationRange, 'fComputeSalePrice should have an implementation range');

    const lines = fs.readFileSync(path.join(fixturesDir, 'large_unit.pas'), 'utf8').split(/\r?\n/);
    const start = fn!.implementationRange!.start.line;
    const end = fn!.implementationRange!.end.line;
    const body = lines.slice(start, end + 1).join('\n');

    assert.ok(body.includes('finally'), `range must include the finally block (end line ${end})`);
    assert.ok(body.includes('FreeAndNil(oQuery)'), 'range must include the finally body');
    assert.match(lines[end].trim(), /^end\s*;/, `range should end on the routine closing 'end;' (got: '${lines[end]}')`);
});

test('TypeScript parser extracts file-level functions (declarations + arrows)', () => {
    const provider = new TypeScriptLanguageProvider();
    const doc = fixtureDocument('example.ts', 'typescript');
    const parsed = provider.parseDocument(doc);
    const names = parsed.standaloneProcedures.map(p => p.name);
    assert.ok(names.includes('formatUser'), `expected formatUser, got ${names.join(',')}`);
    assert.ok(names.includes('helper'));
    assert.ok(names.includes('fetchData'));
});

test('JavaScript parser extracts file-level functions', () => {
    const provider = new TypeScriptLanguageProvider();
    const doc = fixtureDocument('example.js', 'javascript');
    const parsed = provider.parseDocument(doc);
    const names = parsed.standaloneProcedures.map(p => p.name);
    assert.ok(names.includes('createEmitter'), `expected createEmitter, got ${names.join(',')}`);
    assert.ok(names.includes('mergeListeners'));
});

test('Python parser extracts module-level functions', () => {
    const provider = new PythonLanguageProvider();
    const doc = fixtureDocument('example.py', 'python');
    const parsed = provider.parseDocument(doc);
    const names = parsed.standaloneProcedures.map(p => p.name);
    assert.ok(names.includes('create_vehicle'), `expected create_vehicle, got ${names.join(',')}`);
    assert.ok(names.includes('fetch_data'));
    // class methods must NOT leak into standalone
    assert.ok(!names.includes('accelerate'));
});

test('Rust parser extracts free functions outside impl blocks', () => {
    const provider = new RustLanguageProvider();
    const doc = fixtureDocument('example.rs', 'rust');
    const parsed = provider.parseDocument(doc);
    const names = parsed.standaloneProcedures.map(p => p.name);
    assert.ok(names.includes('free_add'), `expected free_add, got ${names.join(',')}`);
    assert.ok(names.includes('free_helper'));
    // impl methods must NOT leak into standalone
    assert.ok(!names.includes('deactivate'));
});

test('C++ parser extracts free functions (definition + declaration)', () => {
    const provider = new CppLanguageProvider();
    const doc = fixtureDocument('Example.cpp', 'cpp');
    const parsed = provider.parseDocument(doc);
    const names = parsed.standaloneProcedures.map(p => p.name);
    assert.ok(names.includes('add_numbers'), `expected add_numbers, got ${names.join(',')}`);
    assert.ok(names.includes('free_helper'));
    // out-of-line member definitions must NOT leak into standalone
    assert.ok(!names.includes('getName'));
    assert.ok(!names.includes('fetch'));
});

test('Standalone function rewrite preserves the body and updates the signature', () => {
    const { MemberKind, Visibility } = require('../models/types') as { MemberKind: typeof import('../models/types').MemberKind; Visibility: typeof import('../models/types').Visibility };
    const spec = (name: string, params: Array<{ name: string; type: string }>, returnType: string | undefined) => ({
        kind: MemberKind.Method, name, returnType, visibility: Visibility.Public,
        parameters: params, modifiers: [], isStatic: false, isVirtual: false,
        isAbstract: false, isOverride: false, isFinal: false,
    });

    const rust = new RustLanguageProvider().rewriteStandaloneFunction(
        'pub fn free_add(a: i32, b: i32) -> i32 {\n    a + b\n}',
        spec('free_sum', [{ name: 'x', type: 'i32' }, { name: 'y', type: 'i32' }], 'i32'),
    );
    assert.ok(rust && rust.startsWith('pub fn free_sum(x: i32, y: i32) -> i32 {'), `rust header wrong: ${rust}`);
    assert.ok(rust!.includes('a + b'), 'rust body should be preserved');

    const ts = new TypeScriptLanguageProvider().rewriteStandaloneFunction(
        'export function formatUser(user: UserService): string {\n    return user.getUser(1);\n}',
        spec('format', [{ name: 'u', type: 'User' }], 'string'),
    );
    assert.ok(ts && ts.startsWith('function format(u: User): string {'), `ts header wrong: ${ts}`);
    assert.ok(ts!.includes('return user.getUser(1);'), 'ts body should be preserved');

    const js = new TypeScriptLanguageProvider().rewriteStandaloneFunction(
        'function createEmitter(maxListeners) {\n  return new EventEmitter(maxListeners);\n}',
        spec('buildEmitter', [{ name: 'n', type: 'number' }], undefined),
    );
    assert.ok(js && js.startsWith('function buildEmitter(n) {'), `js should drop types: ${js}`);

    const py = new PythonLanguageProvider().rewriteStandaloneFunction(
        'def create_vehicle(brand, model, year):\n    return Vehicle(brand, model, year)',
        spec('make_vehicle', [{ name: 'b', type: 'str' }], 'Vehicle'),
    );
    assert.ok(py && py.startsWith('def make_vehicle(b: str) -> Vehicle:'), `py header wrong: ${py}`);
    assert.ok(py!.includes('return Vehicle(brand, model, year)'), 'py body should be preserved');

    const cpp = new CppLanguageProvider().rewriteStandaloneFunction(
        'int add_numbers(int a, int b) {\n    return a + b;\n}',
        spec('add_values', [{ name: 'a', type: 'int' }, { name: 'b', type: 'int' }], 'int'),
    );
    assert.ok(cpp && cpp.startsWith('int add_values(int a, int b) {'), `cpp header wrong: ${cpp}`);

    const go = new GoLanguageProvider().rewriteStandaloneFunction(
        'func NewServer(cfg Config) *Server {\n    return &Server{cfg: cfg}\n}',
        spec('BuildServer', [{ name: 'c', type: 'Config' }], '*Server'),
    );
    assert.ok(go && go.startsWith('func BuildServer(c Config) *Server {'), `go header wrong: ${go}`);

    const pas = new PascalLanguageProvider().rewriteStandaloneFunction(
        'function fComputeSalePrice(iOFFRE_ID: Integer): String;\nvar\n  oQuery: TUniQuery;\nbegin\n  Result := \'0\';\n  oQuery := TUniQuery.Create(nil);\n  try\n    try\n      if fQueryRQSQL(oQuery, 47012) then\n      begin\n        fQueryOpen(oQuery);\n      end;\n    except\n      on E: Exception do\n        raise;\n    end;\n  finally\n    FreeAndNil(oQuery);\n  end;\nend;',
        spec('fComputeSalePrice_BIS', [{ name: 'o', type: 'Integer' }], 'String'),
    );
    assert.ok(pas && pas.startsWith('function fComputeSalePrice_BIS(o: Integer): String;'), `pascal header wrong: ${pas}`);
    assert.ok(pas!.includes('var\n  oQuery: TUniQuery;'), 'pascal local var section should be preserved');
    assert.ok(pas!.includes('finally'), 'pascal try/finally block should be preserved');
    assert.ok(pas!.includes('FreeAndNil(oQuery);'), 'pascal finally body should be preserved');
    assert.ok(pas!.endsWith('end;'), 'pascal rewrite should keep the routine closing end;');

    const pasDecl = new PascalLanguageProvider().rewriteStandaloneDeclaration(
        'function fComputeSalePrice(iOFFRE_ID: Integer): String;',
        spec('fComputeSalePrice_BIS', [{ name: 'o', type: 'Integer' }], 'String'),
    );
    assert.equal(pasDecl, 'function fComputeSalePrice_BIS(o: Integer): String;', `pascal declaration should be rewritten: ${pasDecl}`);

    // Trailing modifiers after the header ';' must be preserved.
    const pasDeclMods = new PascalLanguageProvider().rewriteStandaloneDeclaration(
        'procedure DoThing(a: Integer); overload;',
        spec('DoOther', [{ name: 'b', type: 'Integer' }], undefined),
    );
    assert.equal(pasDeclMods, 'procedure DoOther(b: Integer); overload;', `pascal declaration should keep trailing modifiers: ${pasDeclMods}`);
});

test('Pascal standalone edit syncs interface declaration and implementation header', () => {
    const provider = new PascalLanguageProvider();
    const doc = fixtureDocument('large_unit.pas', 'pascal');
    const parsed = provider.parseDocument(doc);

    type ProcWithRange = {
        name: string;
        range?: { start: { line: number }; end: { line: number } };
        implementationRange?: { start: { line: number }; end: { line: number } };
    };
    const fn = (parsed.standaloneProcedures as ProcWithRange[]).find(p => p.name === 'fComputeSalePrice');
    assert.ok(fn && fn.range && fn.implementationRange, 'fComputeSalePrice should have both decl and impl ranges');

    const lines = fs.readFileSync(path.join(fixturesDir, 'large_unit.pas'), 'utf8').split(/\r?\n/);
    const declText = lines.slice(fn!.range!.start.line, fn!.range!.end.line + 1).join('\n');
    const implText = lines.slice(fn!.implementationRange!.start.line, fn!.implementationRange!.end.line + 1).join('\n');

    const { MemberKind, Visibility } = require('../models/types') as { MemberKind: typeof import('../models/types').MemberKind; Visibility: typeof import('../models/types').Visibility };
    const spec = {
        kind: MemberKind.Method, name: 'fComputeSalePrice_BIS', returnType: 'String', visibility: Visibility.Public,
        parameters: [{ name: 'o', type: 'Integer' }], modifiers: [], isStatic: false, isVirtual: false,
        isAbstract: false, isOverride: false, isFinal: false,
    };

    const newDecl = provider.rewriteStandaloneDeclaration(declText, spec as any);
    const newImpl = provider.rewriteStandaloneFunction(implText, spec as any);

    assert.equal(newDecl, 'function fComputeSalePrice_BIS(o: Integer): String;', `declaration synced: ${newDecl}`);
    assert.ok(newImpl && newImpl.startsWith('function fComputeSalePrice_BIS(o: Integer): String;'), `implementation header synced: ${newImpl}`);
    assert.ok(newImpl!.includes('finally'), 'implementation body (finally) preserved during sync');
});
