import { test } from 'node:test';
import assert from 'node:assert/strict';
import { standardSymbols } from '../utils/stdlib';
import { usedFromOutside, usedRefs } from '../utils/usedFiles';
import { familyOf } from '../utils/callGraph';

/** What the tab Used would list for a source: the standard objects its code writes. */
function listed(text: string, lang: string, file: string): string[] {
    const refs = usedRefs(text, lang, file);
    const ext = file.slice(file.lastIndexOf('.'));
    return usedFromOutside(text, familyOf(lang), standardSymbols(lang, ext, refs)).map(u => u.symbol.label);
}

test('a Delphi unit that calls standard and generic objects lists them under their unit, System included without being used', () => {
    const src = [
        'unit Main;', 'interface', 'uses System.SysUtils, System.Classes, System.Generics.Collections, Vcl.Dialogs, Forms;', 'implementation',
        'procedure T.Go;', 'var L: TList<string>; D: TDictionary<string, Integer>; S: TStringList;', 'begin',
        "  ShowMessage(Format('%d', [Length(S.Text)]));", "  L := TList<string>.Create; // IntToStr in a comment", "  Application.Terminate;", 'end;', 'end.',
    ].join('\n');
    const labels = listed(src, 'pascal', 'C:/p/Main.pas');
    for (const l of ['System.SysUtils.Format', 'System.Length', 'Vcl.Dialogs.ShowMessage', 'System.Generics.Collections.TList', 'System.Generics.Collections.TDictionary', 'System.Classes.TStringList', 'Vcl.Forms.Application']) {
        assert.ok(labels.includes(l), l + ' is listed');
    }
    assert.ok(!labels.includes('System.SysUtils.IntToStr'), 'a comment is not a use');
    assert.ok(!labels.some(l => l.startsWith('System.Math.')), 'a unit the file does not use is not offered');
});

test('a C or C++ file lists the objects of its headers, a Python or Node file the members of its modules after a dot', () => {
    const c = listed('#include <stdio.h>\n#include <stdlib.h>\nint main() { char *p = malloc(4); printf("x"); free(p); return 0; }', 'c', '/p/a.c');
    assert.deepEqual(c, ['stdio.h.printf', 'stdlib.h.free', 'stdlib.h.malloc']);
    const cpp = listed('#include <vector>\n#include <algorithm>\nvoid f() { std::vector<int> v; std::sort(v.begin(), v.end()); }', 'cpp', '/p/a.cpp');
    assert.ok(cpp.includes('vector.vector') && cpp.includes('algorithm.sort'));
    const py = listed('import os\nimport json\nx = os.getcwd()\ny = json.loads("{}")\nz = getcwd()', 'python', '/p/a.py');
    assert.deepEqual(py, ['json.loads', 'os.getcwd'], 'a module member only after a dot');
    const node = listed("import { readFileSync } from 'node:fs';\nimport path from 'path';\nconst a = fs.readFileSync('x'); const b = path.join('a', 'b');", 'typescript', '/p/a.ts');
    assert.ok(node.includes('path.join') && node.includes('fs.readFileSync'));
    assert.deepEqual(listed('print(1)', 'ruby', '/p/a.rb'), []);
});
