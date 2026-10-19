import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PascalRoutine, blankPascal, reviewPascal } from '../utils/pascalReview';
import { reviewText } from '../utils/textReview';
import { ReviewFinding } from '../utils/reviewTypes';

/** The routines of a sample unit, found the way the provider would hand them over. */
function routinesOf(lines: string[], extra: { override?: string[]; virtual?: string[] } = {}): PascalRoutine[] {
    const out: PascalRoutine[] = [];
    lines.forEach((l, i) => {
        const m = /^(procedure|function|constructor|destructor)\s+(?:(T\w+)\.)?(\w+)\s*(\(([^)]*)\))?\s*(?::\s*(\w+))?\s*;/i.exec(l);
        if (!m) { return; }
        let end = i;
        while (end < lines.length && !/^end;/i.test(lines[end])) { end++; }
        const kind = m[1].toLowerCase() as PascalRoutine['kind'];
        out.push({
            name: m[3], className: m[2], kind, returnType: m[6],
            params: (m[5] ?? '').split(';').flatMap(p => p.replace(/^\s*(var|const|out)\s+/i, '').split(':')[0].split(',').map(n => n.trim())).filter(Boolean),
            isOverride: !!extra.override?.includes(m[3]), isVirtual: !!extra.virtual?.includes(m[3]), start: i, end,
        });
    });
    return out;
}

const review = (src: string, extra?: { override?: string[]; virtual?: string[] }): ReviewFinding[] => {
    const lines = src.split('\n');
    return reviewPascal(lines, routinesOf(lines, extra), 'Unit1.pas');
};
const has = (f: ReviewFinding[], cat: string, re: RegExp): ReviewFinding | undefined => f.find(x => x.category === cat && re.test(x.message));

test('comments and string contents are blanked, columns kept', () => {
    const blank = blankPascal(["x := 'with ''quote'' { not a comment }'; // with", '{ a', 'multi-line } y := 1;', '(* z *) w']);
    assert.equal(blank[0].length, "x := 'with ''quote'' { not a comment }'; // with".length);
    assert.doesNotMatch(blank[0], /with|comment/);
    assert.doesNotMatch(blank[1] + blank[2].slice(0, 12), /multi|a$/);
    assert.match(blank[2], /y := 1;/);
    assert.match(blank[3], /^\s+w$/);
});

test('a function that never says what it returns is a warning; Result, Exit, raise or the function name all count', () => {
    const src = [
        'function TFoo.NoResult(A: Integer): Integer;', 'begin', '  A := A + 1;', 'end;', '',
        'function TFoo.WithResult(A: Integer): Integer;', 'begin', '  Result := A;', 'end;', '',
        'function TFoo.OldStyle(A: Integer): Integer;', 'begin', '  OldStyle := A;', 'end;', '',
        'function TFoo.Raises(A: Integer): Integer;', 'begin', "  raise Exception.Create('no');", 'end;', '',
        'function TFoo.Mentions(A: Integer): Integer;', 'begin', '  // Result := 1', 'end;',
    ].join('\n');
    const f = review(src).filter(x => x.category === 'Correctness');
    assert.deepEqual(f.map(x => x.memberName), ['NoResult', 'Mentions'], 'a comment saying Result does not count');
    assert.equal(f[0].severity, 'warning');
    assert.match(f[0].hint!, /W1035/);
});

test('unused variables and parameters are advice; event handlers, overrides and virtual methods keep their parameters', () => {
    const src = [
        'procedure TFoo.Work(A, B: Integer);', 'var', '  Used, Unused: Integer;', '  Other: string;', 'begin',
        '  Used := A;', "  Other := 'Unused';", 'end;', '',
        'procedure TFoo.Button1Click(Sender: TObject);', 'begin', '  DoIt;', 'end;', '',
        'procedure TFoo.FormClose(Sender: TObject; var Action: TCloseAction);', 'begin', '  DoIt;', 'end;', '',
        'procedure TFoo.Over(A: Integer);', 'begin', '  DoIt;', 'end;',
    ].join('\n');
    const f = review(src, { override: ['Over'] }).filter(x => x.category === 'Unused');
    const msgs = f.map(x => x.message).sort();
    assert.deepEqual(msgs, ['Parameter B is never used in Work', 'Variable Unused is declared but never used in Work'].sort(),
        'a name inside a string is not a use; assigning a variable is');
    assert.ok(f.every(x => x.severity === 'info'));
    const v = f.find(x => /Variable Unused/.test(x.message))!;
    assert.equal(v.line, 2);
    assert.equal(v.col, 8, 'the highlight is on the name');
});

test('an object created and never freed is a leak; freed without try/finally is advice; owners, hand-overs and records are fine', () => {
    const src = [
        'procedure TFoo.Leaks;', 'var', '  L: TStringList;', 'begin', '  L := TStringList.Create;', '  L.Add(\'x\');', 'end;', '',
        'procedure TFoo.Unprotected;', 'var', '  L: TStringList;', 'begin', '  L := TStringList.Create;', '  L.Add(\'x\');', '  L.Free;', 'end;', '',
        'procedure TFoo.Protected;', 'var', '  L: TStringList;', 'begin', '  L := TStringList.Create;', '  try', '    L.Add(\'x\');', '  finally', '    L.Free;', '  end;', 'end;', '',
        'procedure TFoo.Owned;', 'var', '  B: TButton;', 'begin', '  B := TButton.Create(Self);', '  B.Parent := Self;', 'end;', '',
        'function TFoo.Returned: TStringList;', 'var', '  L: TStringList;', 'begin', '  L := TStringList.Create;', '  Result := L;', 'end;', '',
        'procedure TFoo.Stored;', 'var', '  L: TStringList;', 'begin', '  L := TStringList.Create;', '  FItems.Add(L);', 'end;', '',
        'procedure TFoo.Record_;', 'var', '  R: TRect;', 'begin', '  R := TRect.Create(0, 0, 1, 1);', '  Use(R.Left);', 'end;', '',
        'procedure TFoo.Intf;', 'var', '  S: ISomething;', 'begin', '  S := TThing.Create;', '  S.Do;', 'end;', '',
        'procedure TFoo.FreeNil;', 'var', '  L: TStringList;', 'begin', '  L := TStringList.Create;', '  try', '    L.Add(\'x\');', '  finally', '    FreeAndNil(L);', '  end;', 'end;',
    ].join('\n');
    const f = review(src).filter(x => x.category === 'Memory');
    assert.deepEqual(f.map(x => [x.memberName, x.severity]), [['Leaks', 'warning'], ['Unprotected', 'info']]);
    assert.match(f[0].message, /L is created \(TStringList\.Create\) but never freed/);
    assert.match(f[0].hint!, /try … finally L\.Free/);
    assert.equal(f[0].line, 4, 'on the line that creates it');
});

test('empty except, with and an empty statement after then are reported, in code only', () => {
    const src = [
        'procedure TFoo.Risky;', 'begin', '  try', '    DoIt;', '  except', '  end;', '  with Query1 do', '    Open;', '  if Ok then;', '  // with X do', "  S := 'except end then;';", 'end;',
    ].join('\n');
    const f = review(src);
    assert.ok(has(f, 'Error handling', /Empty except/), 'empty except');
    assert.equal(f.find(x => x.category === 'Error handling')!.line, 4);
    assert.ok(has(f, 'Style', /with statement/));
    assert.equal(f.filter(x => /with statement/.test(x.message)).length, 1, 'the comment is not a with');
    assert.ok(has(f, 'Correctness', /Empty statement after then/));
    assert.equal(f.filter(x => /Empty statement/.test(x.message)).length, 1, 'the string literal is not code');
});

test('SQL built by concatenation or Format is a warning, with QuotedStr advice, parameters and plain literals are fine', () => {
    const src = [
        'procedure TFoo.Bad(const Name: string);', 'begin', "  Q.SQL.Text := 'select * from t where n = ''' + Name + '''';", 'end;', '',
        'procedure TFoo.BadFormat(Id: Integer);', 'begin', "  Q.SQL.Text := Format('select * from t where id = %d', [Id]);", 'end;', '',
        'procedure TFoo.Quoted(const Name: string);', 'begin', "  Q.SQL.Add('and n = ' + QuotedStr(Name));", 'end;', '',
        'procedure TFoo.Good(Id: Integer);', 'begin', "  Q.SQL.Text := 'select * from t ' + 'where id = :id';", "  Q.ParamByName('id').AsInteger := Id;", 'end;', '',
        'procedure TFoo.Multi(const Name: string);', 'begin', "  Q.SQL.Text := 'select * from t '", "    + 'where n = ' + Name;", 'end;',
    ].join('\n');
    const f = review(src).filter(x => x.category === 'Security');
    assert.deepEqual(f.map(x => [x.memberName, x.severity]), [['Bad', 'warning'], ['BadFormat', 'warning'], ['Quoted', 'info'], ['Multi', 'warning']]);
    assert.match(f[0].hint!, /ParamByName/);
});

test('overriding a constructor or destructor without inherited is a warning', () => {
    const src = [
        'constructor TFoo.Create(AOwner: TComponent);', 'begin', '  FList := TList.Create;', 'end;', '',
        'destructor TFoo.Destroy;', 'begin', '  FList.Free;', '  inherited;', 'end;', '',
        'constructor TFoo.Plain;', 'begin', '  FX := 1;', 'end;',
    ].join('\n');
    const f = review(src, { override: ['Create', 'Destroy'] }).filter(x => /inherited/.test(x.message));
    assert.deepEqual(f.map(x => x.memberName), ['Create']);
    assert.equal(f[0].severity, 'warning');
});

test('a long routine is advice past 30 lines and a warning past 60; many parameters and deep nesting are advice', () => {
    const body = (n: number): string[] => Array.from({ length: n }, (_, i) => `  Step${i};`);
    const src = [
        'procedure TFoo.Medium;', 'begin', ...body(35), 'end;', '',
        'procedure TFoo.Huge;', 'begin', ...body(65), 'end;', '',
        'procedure TFoo.Many(A, B, C, D, E, F, G: Integer);', 'begin', '  Use(A, B, C, D, E, F, G);', 'end;', '',
        'procedure TFoo.Deep;', 'begin', '  if A then begin', '    if B then begin', '      try', '        case X of', '          1: begin', '            while C do begin', '              Go;', '            end;', '          end;', '        end;', '      finally', '        Done;', '      end;', '    end;', '  end;', 'end;',
    ].join('\n');
    const f = review(src);
    const by = (name: string, cat: string): ReviewFinding | undefined => f.find(x => x.memberName === name && x.category === cat);
    assert.equal(by('Medium', 'Complexity')!.severity, 'info');
    assert.equal(by('Huge', 'Complexity')!.severity, 'warning');
    assert.match(by('Many', 'Style')!.message, /7 parameters/);
    assert.match(by('Deep', 'Style')!.message, /nests blocks \d+ levels deep/);
});

test('a routine with a nested routine is left alone for locals; nothing is reported for what is not there', () => {
    const src = [
        'procedure TFoo.Outer;', 'var', '  Unused: Integer;', '  procedure Inner;', '  begin', '    DoIt;', '  end;', 'begin', '  Inner;', 'end;',
    ].join('\n');
    assert.equal(review(src).filter(x => x.category === 'Unused').length, 0, 'the first begin is the nested routine: the locals are not judged');
    assert.deepEqual(review('unit U;\ninterface\nimplementation\nend.'), []);
});

/* ───────── rules of every language ───────── */

test('text rules: notes, passwords in the source, swallowed exceptions', () => {
    const f = reviewText([
        '// TODO: handle the empty case', "const pwd = 'hunter2';", '// password = "commented"', "conn := 'Server=db;Password=secret;';",
        "conn2 := 'Server=db;Password=' + Pass;", 'try { run(); } catch (e) { }', 'ok();',
    ], 'typescript', 'a.ts');
    assert.equal(f.filter(x => x.category === 'TODO').length, 1);
    assert.equal(f.find(x => x.category === 'TODO')!.message, 'TODO: handle the empty case');
    assert.deepEqual(f.filter(x => x.category === 'Security').map(x => x.line), [1, 3], 'literal passwords, not the commented one nor the concatenated one');
    assert.equal(f.find(x => x.category === 'Error handling')!.line, 5);
    assert.ok(f.filter(x => x.category === 'Security').every(x => x.severity === 'warning' && x.hint));

    const py = reviewText(['try:', '    run()', 'except Exception:', '    pass'], 'python', 'a.py');
    assert.equal(py.length, 1);
    assert.match(py[0].message, /except: pass/);
    assert.deepEqual(reviewText(['catch (e) { }'], 'go', 'a.go'), [], 'no catch in Go');
});

/* ───────── the whole review of a document ───────── */

const nodeModule = require('node:module');
const originalLoad = nodeModule._load;
const vscodeMock = {
    window: { activeTextEditor: undefined },
    Position: class { constructor(public line: number, public character: number) {} },
    Selection: class {}, Range: class {}, TextEditorRevealType: { InCenter: 2 },
};
nodeModule._load = (r: string, parent: unknown, isMain: boolean) => (r === 'vscode' ? vscodeMock : originalLoad(r, parent, isMain));
const { reviewDocument } = require('../services/CodeReviewService') as typeof import('../services/CodeReviewService');

const rng = (a: number, b: number): any => ({ start: { line: a, character: 0 }, end: { line: b, character: 0 } });
const mem = (id: string, name: string, kind: string, extra: any = {}): any => ({
    id, name, kind, visibility: 'public', parameters: [], modifiers: [], isStatic: false, isVirtual: false, isAbstract: false, isOverride: false, range: rng(1, 1), ...extra,
});

test('reviewDocument puts every rule together, in file order, with what the form classes do not deserve left out', () => {
    const src = [
        'unit U;', 'type', '  TMain = class(TForm)', '  end;', '',
        'function TMain.Calc(A: Integer): Integer;', 'var', '  Tmp: Integer;', 'begin', '  A := 1; // TODO: compute', 'end;', 'end.',
    ];
    const fields = Array.from({ length: 20 }, (_, i) => mem('f' + i, 'Button' + i, 'field', { range: rng(2, 2) }));
    const calc = mem('m1', 'Calc', 'method', { returnType: 'Integer', parameters: [{ name: 'A', type: 'Integer' }], range: rng(2, 2), implementationRange: rng(5, 10) });
    const cls = { id: 'c', name: 'TMain', parentClass: 'TForm', members: [...fields, calc], range: rng(2, 3), isInterface: false, isRecord: false, isSealed: false, interfaces: [] };
    const doc = { getText: () => src.join('\n'), fileName: 'C:\\x\\U.pas', lineAt: (n: number) => ({ text: src[n] }) } as any;
    const provider = { languageId: 'pascal', parseDocument: () => ({ classes: [cls], standaloneProcedures: [] }) } as any;
    const f = reviewDocument(doc, provider);
    assert.ok(!f.some(x => x.category === 'Size'), 'twenty components do not make a big form class');
    assert.ok(!f.some(x => x.category === 'Encapsulation'));
    assert.ok(f.some(x => /never assigns Result/.test(x.message) && x.line === 5));
    assert.ok(f.some(x => /Variable Tmp/.test(x.message) && x.line === 7));
    assert.ok(f.some(x => x.category === 'TODO' && x.line === 9));
    assert.deepEqual(f.map(x => x.line), [...f.map(x => x.line)].sort((a, b) => a - b), 'in the order of the file');
    assert.ok(f.every(x => x.file === 'U.pas'));

    const plain = { id: 'c2', name: 'TBig', members: Array.from({ length: 16 }, (_, i) => mem('p' + i, 'M' + i, 'method')), range: rng(0, 1), isInterface: false, isRecord: false, isSealed: false, interfaces: [] };
    const big = reviewDocument({ getText: () => 'x', fileName: 'B.java', lineAt: () => ({ text: '' }) } as any, { languageId: 'java', parseDocument: () => ({ classes: [plain], standaloneProcedures: [] }) } as any);
    assert.ok(big.some(x => x.category === 'Size' && x.severity === 'warning' && x.hint));
});
