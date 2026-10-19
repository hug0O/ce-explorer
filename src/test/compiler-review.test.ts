import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PascalRoutine } from '../utils/pascalReview';
import { reviewPascalCompiler } from '../utils/pascalCompiler';
import { ReviewClassInfo, ReviewFinding, ReviewMemberInfo } from '../utils/reviewTypes';

/** The routines of a sample unit, found the way the provider would hand them over. */
function routinesOf(lines: string[], extra: { override?: string[] } = {}): PascalRoutine[] {
    const out: PascalRoutine[] = [];
    lines.forEach((l, i) => {
        const m = /^(procedure|function|constructor|destructor)\s+(?:(T\w+)\.)?(\w+)\s*(\(([^)]*)\))?\s*(?::\s*(\w+))?\s*;/i.exec(l);
        if (!m) { return; }
        let end = i;
        while (end < lines.length && !/^end;/i.test(lines[end])) { end++; }
        out.push({
            name: m[3], className: m[2], kind: m[1].toLowerCase() as PascalRoutine['kind'], returnType: m[6],
            params: (m[5] ?? '').split(';').flatMap(p => p.split(':')[0].split(',').map(n => n.trim())).filter(Boolean),
            isOverride: !!extra.override?.includes(m[3]), isVirtual: false, start: i, end,
        });
    });
    return out;
}

const member = (name: string, kind: ReviewMemberInfo['kind'], visibility: string, startLine: number, extra: Partial<ReviewMemberInfo> = {}): ReviewMemberInfo => ({
    name, kind, visibility, isVirtual: false, isAbstract: false, isOverride: false, modifiers: [], params: [], startLine, endLine: startLine, ...extra,
});

function pascal(src: string, file = 'Unit1.pas', classes: ReviewClassInfo[] = []): ReviewFinding[] {
    const lines = src.split('\n');
    return reviewPascalCompiler(lines, routinesOf(lines), classes, file);
}
const by = (f: ReviewFinding[], code: string): ReviewFinding[] => f.filter(x => x.code === code);

const UNIT = (body: string[], head = 'unit Unit1;'): string => [head, 'interface', 'uses SysUtils;', 'implementation', ...body, 'end.'].join('\n');

/* ───────── Delphi: the unit as a whole ───────── */

test('Delphi: a unit whose name is not its file, and a unit that is not closed, are errors; text after end. is W1011', () => {
    const f = pascal(UNIT(['procedure TFoo.A;', 'begin', '  DoIt;', 'end;'], 'unit Other;'));
    const mismatch = f.find(x => /is called Other but the file is Unit1\.pas/.test(x.message))!;
    assert.equal(mismatch.severity, 'error');
    assert.deepEqual([mismatch.line, mismatch.col], [0, 5], 'on the name');

    const open = pascal(['unit Unit1;', 'interface', 'implementation', 'procedure TFoo.A;', 'begin', 'end;'].join('\n'));
    assert.ok(open.some(x => /does not end with 'end\.'/.test(x.message) && x.severity === 'error'));
    const noImpl = pascal(['unit Unit1;', 'interface', 'end.'].join('\n'));
    assert.ok(noImpl.some(x => /no implementation section/.test(x.message)));

    const after = pascal(UNIT([]) + '\nsome text\n');
    const w = by(after, 'W1011')[0];
    assert.equal(w.severity, 'warning');
    assert.equal(w.line, 5);
    assert.deepEqual(pascal(UNIT([]), 'Unit1.pas').filter(x => x.category === 'Compilation'), [], 'a correct unit is left alone');
});

test('Delphi: a unit listed twice in uses is an error, the same unit in both uses clauses is advice, a path is not a name', () => {
    const src = ['unit Unit1;', 'interface', 'uses SysUtils, Classes, sysutils;', 'implementation', 'uses Classes, StrUtils in \'x.pas\';', 'end.'].join('\n');
    const f = pascal(src);
    const dup = f.find(x => /SysUtils is listed twice|sysutils is listed twice/i.test(x.message))!;
    assert.equal(dup.severity, 'error');
    assert.equal(dup.line, 2);
    const redundant = f.find(x => x.category === 'Redundant')!;
    assert.match(redundant.message, /Classes is already in the interface uses/);
    assert.equal(redundant.severity, 'info');
    assert.equal(f.filter(x => /StrUtils/.test(x.message)).length, 0);
});

test('Delphi H2135: a FOR loop that cannot run', () => {
    const f = pascal(UNIT(['procedure TFoo.A;', 'var I: Integer;', 'begin', '  for I := 5 to 1 do DoIt;', '  for I := 1 to 5 do DoIt;', '  for I := 1 downto 5 do DoIt;', 'end;']));
    const z = by(f, 'H2135');
    assert.deepEqual(z.map(x => x.line), [7, 9], 'to with from > to, downto with from < to');
    assert.match(z[0].hint!, /downto/);
});

/* ───────── Delphi: variables ───────── */

test('Delphi W1036 / H2077: a variable only read, a value only written', () => {
    const src = UNIT([
        'function TFoo.Calc: Integer;', 'var', '  N, Total, Unseen: Integer;', '  S: string;', '  I: Integer;', 'begin',
        '  Result := N + 1;', '  Total := 5;', "  S := 'x';", '  for I := 1 to 3 do', '    DoIt;', 'end;', '',
        'procedure TFoo.Passed;', 'var', '  K: Integer;', 'begin', '  Read(K);', '  Use(K);', 'end;', '',
        'procedure TFoo.Made;', 'var', '  L: TStringList;', 'begin', '  L := TStringList.Create;', 'end;',
    ]);
    const f = pascal(src);
    const uninit = by(f, 'W1036');
    assert.deepEqual(uninit.map(x => x.message), ['Variable N might not have been initialized in Calc'], 'N is read and never given a value; strings and loop variables are fine');
    assert.equal(uninit[0].severity, 'warning');
    const unused = by(f, 'H2077').map(x => x.message).sort();
    assert.deepEqual(unused, ['Value assigned to S is never used in Calc', 'Value assigned to Total is never used in Calc'], 'objects created are the leak rule\'s business');
    assert.ok(!f.some(x => /\bK\b/.test(x.message)), 'a variable passed to a routine may be set by it');
});

/* ───────── Delphi: flow ───────── */

test('Delphi: code after Exit, raise or Break can never run; a branch, an end or a case arm is not unreachable', () => {
    const src = UNIT([
        'procedure TFoo.A(X: Integer);', 'begin', '  if X = 1 then', '    Exit;', '  Work;', '  Exit;', '  Never;', 'end;', '',
        'procedure TFoo.B;', 'begin', '  try', '    Work;', '    raise Exception.Create(\'x\');', '  finally', '    Cleanup;', '  end;', 'end;', '',
        'procedure TFoo.C(X: Integer);', 'begin', '  case X of', '    1: Exit;', '    2: Work;', '  end;', '  if A then', '  begin', '    Exit;', '  end;', '  Fine;', 'end;',
    ]);
    const f = pascal(src).filter(x => x.category === 'Unreachable code');
    assert.deepEqual(f.map(x => x.line), [10], 'only the statement after the unconditional Exit');
    assert.equal(f[0].severity, 'info');
});

test('Delphi: begin / end that do not add up', () => {
    const f = pascal(UNIT(['procedure TFoo.A;', 'begin', '  if X then begin', '    Work;', 'end;', '', 'procedure TFoo.B;', 'begin', '  Work;', 'end;'])).filter(x => /do not match/.test(x.message));
    assert.equal(f.length, 1);
    assert.match(f[0].message, /begin \/ end do not match in A \(1 block\(s\) not closed\)/);
});

/* ───────── Delphi: memory, fields ───────── */

test('Delphi: an object a constructor creates and the class never frees; Create(Self), a destructor and a hand-over are fine', () => {
    const src = UNIT([
        'constructor TLeaky.Create;', 'begin', '  FList := TStringList.Create;', '  FKeep := TStringList.Create;', '  FOwned := TTimer.Create(Self);', '  FPassed := TStringList.Create;', '  Reg.Add(FPassed);', 'end;', '',
        'destructor TLeaky.Destroy;', 'begin', '  FKeep.Free;', 'end;',
    ]);
    const cls: ReviewClassInfo = {
        name: 'TLeaky', isInterface: false, isRecord: false, startLine: 0, endLine: 5,
        members: ['FList', 'FKeep', 'FOwned', 'FPassed'].map((n, i) => member(n, 'field', 'private', i + 1)),
    };
    const f = pascal(src, 'Unit1.pas', [cls]).filter(x => x.category === 'Memory');
    assert.deepEqual(f.map(x => x.message), ['FList is created in Create but TLeaky never frees it']);
    assert.match(f[0].hint!, /Free it in the destructor/);
    assert.equal(f[0].line, 6);
});

/* ───────── Delphi: what a class declares ───────── */

test('Delphi H2219 / E2065: a private symbol nobody uses, a declaration with no implementation', () => {
    const src = [
        'unit Unit1;', 'interface', 'type', '  TFoo = class', '  private', '    FUsed: Integer;', '    FNever: Integer;', '    procedure Quiet;', '    procedure Loud;',
        '  public', '    procedure Open;', '    procedure Missing;', '    procedure Abstr; virtual; abstract;', '  end;', 'implementation',
        'procedure TFoo.Quiet;', 'begin', '  Work;', 'end;', '',
        'procedure TFoo.Loud;', 'begin', '  FUsed := 1;', 'end;', '',
        'procedure TFoo.Open;', 'begin', '  Loud;', 'end;', 'end.',
    ].join('\n');
    const cls: ReviewClassInfo = {
        name: 'TFoo', isInterface: false, isRecord: false, startLine: 3, endLine: 13,
        members: [
            member('FUsed', 'field', 'private', 5), member('FNever', 'field', 'private', 6),
            member('Quiet', 'method', 'private', 7, { implStart: 15, implEnd: 18 }), member('Loud', 'method', 'private', 8, { implStart: 20, implEnd: 22 }),
            member('Open', 'method', 'public', 10, { implStart: 24, implEnd: 26 }), member('Missing', 'method', 'public', 11),
            member('Abstr', 'method', 'public', 12, { isAbstract: true, isVirtual: true, modifiers: ['virtual', 'abstract'] }),
        ],
    };
    const f = pascal(src, 'Unit1.pas', [cls]);
    assert.deepEqual(by(f, 'H2219').map(x => x.memberName).sort(), ['FNever', 'Quiet'], 'FUsed and Loud are used');
    assert.ok(by(f, 'H2219').every(x => x.severity === 'info'));
    const e = by(f, 'E2065');
    assert.deepEqual(e.map(x => x.memberName), ['Missing'], 'abstract methods need no body');
    assert.equal(e[0].severity, 'warning');
});
