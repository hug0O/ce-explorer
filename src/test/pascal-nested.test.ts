import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankPascal } from '../utils/pascalReview';
import { nestedRoutinesOf } from '../utils/pascalNested';

const lines = (src: string): string[] => blankPascal(src.split('\n'));

const UNIT = [
    'procedure TF.Run;',                       // 0
    'var',                                     // 1
    '  iCount: Integer;',                      // 2
    '  OnDone: procedure(X: Integer);',        // 3  a variable of procedural type is not a routine
    '',
    '  procedure Calc;',                       // 5
    '  var k: Integer;',
    '  begin',
    '    k := 1; // procedure Fake;',
    '  end;',                                  // 9
    '',
    '  function Total(A, B: Integer;',         // 11 header on two lines
    '    C: Integer): Integer;',
    '    procedure Inner;',                    // 13 declared in Total
    '    begin',
    '      try',
    '        Calc;',
    '      finally',
    '      end;',
    '    end;',                                // 19
    '  begin',                                 // 20
    '    Result := A + B;',
    '    Inner;',
    '  end;',                                  // 23
    '',
    '  procedure Later; forward;',             // 25
    'begin',                                   // 26
    '  Calc;',
    '  Run2(procedure begin end);',            // an anonymous method in the body is not a declaration
    'end;',                                    // 29
    '',
    'procedure TF.Other;',
    'begin',
    'end;',
].join('\n');

test('routines declared inside a routine, with their extent and the one they are in', () => {
    const found = nestedRoutinesOf(lines(UNIT), 0, 29, 'Run');
    assert.deepEqual(found.map(n => [n.name, n.kind, n.line, n.endLine, n.depth, n.parent]), [
        ['Calc', 'procedure', 5, 9, 0, 'Run'],
        ['Total', 'function', 11, 23, 0, 'Run'],
        ['Inner', 'procedure', 13, 19, 1, 'Total'],
    ]);
});

test('a routine with nothing inside, and one whose body never closes, give no nonsense', () => {
    assert.deepEqual(nestedRoutinesOf(lines(UNIT), 31, 33, 'Other'), []);
    const broken = lines(['procedure A;', '  procedure B;', '  begin', '    X;'].join('\n'));
    assert.deepEqual(nestedRoutinesOf(broken, 0, 3, 'A').map(n => [n.name, n.line]), [['B', 1]]);
    assert.deepEqual(nestedRoutinesOf([], 0, 0, 'A'), []);
});

test('a name in a comment or a string is not a routine, nor a begin or an end in them', () => {
    const src = ['procedure A;', '  // procedure Fake;', '  { function Other: Integer; }', '  procedure Real;', '  begin', '    S := \'end; begin\';', '  end;', 'begin', 'end;'].join('\n');
    const found = nestedRoutinesOf(lines(src), 0, 8, 'A');
    assert.deepEqual(found.map(n => [n.name, n.line, n.endLine]), [['Real', 3, 6]]);
});

test('the case and try blocks of a nested routine are counted in its extent', () => {
    const src = ['procedure A;', '  procedure B;', '  begin', '    case X of', '      1: try Y; finally Z; end;', '    end;', '  end;', 'begin', 'end;'].join('\n');
    assert.deepEqual(nestedRoutinesOf(lines(src), 0, 8, 'A').map(n => [n.name, n.endLine]), [['B', 6]]);
});
