import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { LocalDecl, localUses } from '../utils/localObjects';
import { topLevelDeclarations } from '../utils/declarations';
import { familyOf } from '../utils/callGraph';
import { outsidePageHtml } from '../webview/manageSection';

const root = path.join(__dirname, '..', '..');

const SRC = [
    'unit U;', 'interface', 'procedure Run;', 'implementation',
    'var', '  GCount: Integer;', 'const', '  Limit = 3;',
    'procedure Run;',
    'var', '  I, Total: Integer;', '  Unused: string;',
    '  procedure Add(N: Integer);', '  begin', '    Total := Total + N;', '  end;',
    'begin', '  for I := 0 to Limit do', '    Add(I);', '  GCount := Total; // Unused in a comment', 'end;',
    'procedure Other;', 'var', '  I: Integer;', 'begin', '  I := GCount;', '  Run;', 'end;',
    'end.',
].join('\n');

const ranges = [{ name: 'Run', start: 8, end: 20 }, { name: 'Other', start: 21, end: 27 }];

test('an object of a routine is looked for inside that routine only, an object of the file everywhere, never on its declaration', () => {
    const decls: LocalDecl[] = [
        { name: 'I', kind: 'variable', line: 10, scope: ranges[0] },
        { name: 'Total', kind: 'variable', line: 10, scope: ranges[0] },
        { name: 'Unused', kind: 'variable', line: 11, scope: ranges[0] },
        { name: 'Add', kind: 'procedure', line: 12, scope: ranges[0] },
        { name: 'I', kind: 'variable', line: 23, scope: ranges[1] },
        { name: 'GCount', kind: 'variable', line: 5 },
        { name: 'Run', kind: 'function', line: 8, skipLines: [2] },
    ];
    const r = localUses(SRC, familyOf('pascal'), decls, ranges);
    const by = (label: string): (typeof r)[number] => r.find(x => x.label === label)!;
    assert.deepEqual(by('Run.I').uses.map(u => u.line), [17, 18], 'the loop and the call of Run, not what Other does with its own I');
    assert.deepEqual(by('Other.I').uses.map(u => u.line), [25], 'the other I is another object');
    assert.equal(by('Run.Total').count, 3, 'three lines write it, not its declaration');
    assert.equal(by('Run.Unused').count, 0, 'a variable that nothing uses is listed, with no line');
    assert.equal(by('Run.Add').uses.length, 1, 'a routine declared inside another is used inside it');
    assert.deepEqual(by('GCount').uses.map(u => [u.line, u.parent]), [[19, 'Run'], [25, 'Other']], 'an object of the file, with the routine that holds each line');
    assert.deepEqual(by('Run').uses.map(u => u.line), [26], 'the declaration of the routine (line 2) is not a use');
    assert.deepEqual(r.map(x => x.decl.line), [...r.map(x => x.decl.line)].sort((a, b) => a - b), 'in the order of the source');
});

test('the Pascal declarations of the implementation count, the ones inside a routine do not', () => {
    const all = topLevelDeclarations(SRC, 'pascal', true).map(d => d.kind + ':' + d.name);
    assert.deepEqual(all, ['variable:GCount', 'constant:Limit']);
    assert.deepEqual(topLevelDeclarations(SRC, 'pascal').map(d => d.name), [], 'the interface alone declares none');
});

test('the tab Used has a switch between the objects of other files and the local ones, with the same rows and the same filter', () => {
    const local = [{ label: 'I', scope: { name: 'Run', line: 8 }, kind: 'variable', count: 2, line: 16, uses: [{ line: 16, text: 'for I := 0 to Limit do', parent: 'Run', parentLine: 8 }], more: 0, canOpen: false, originFile: '', originLine: 10, declared: { text: 'Declared in Run, line 11', line: 10 } },
        { label: 'Unused', scope: { name: 'Run', line: 8 }, kind: 'variable', count: 0, line: 11, uses: [], more: 0, canOpen: false, originFile: '', originLine: 11, declared: { text: 'Declared in Run, line 12', line: 11 } }];
    const html = outsidePageHtml({ rows: [], ready: true, file: 'U.pas', local, view: 'local' });
    assert.match(html, /<button class="mseg-btn" id="mViewOut"[^>]*>From outside \(<span id="mOutCount">0<\/span>\)<\/button>/);
    assert.match(html, /<button class="mseg-btn on" id="mViewLoc"[^>]*>Local \(<span id="mLocCount">2<\/span>\)<\/button>/);
    assert.match(html, /<ul class="mobjs" id="mOutside" hidden><\/ul><ul class="mobjs" id="mLocal">/, 'the local list is the one shown');
    assert.match(html, /<li class="morigin"><button class="mopen mopenwide" data-m-line="10"[^>]*>↗ Declared in Run, line 11<\/button><\/li>/, 'the declaration, as the origin file is for the objects of other files');
    assert.match(html, /<li class="mmeth" data-method="run"><details open><summary title="Run"><span class="mln">method<\/span><span class="mtx">Run<\/span><span class="mcount">2<\/span><button class="mopen mgo" data-m-line="8" title="Go to Run">↗<\/button><\/summary>/, 'the local objects are listed under the routine that declares them');
    assert.ok(!html.includes('Run.I') && !html.includes('class="mparent"'), 'an object is written by its name, not as routine.name');
    assert.match(html, /<div class="mflat" data-m-line="11" title="Declared in Run, line 12">/, 'an object nothing uses is a row that goes to its declaration');
    assert.match(outsidePageHtml({ rows: [], ready: true, local }), /id="mViewOut" title="The objects of the other files that this file writes">/);
    const panel = fs.readFileSync(path.join(root, 'src', 'webview', 'MemberViewerPanel.ts'), 'utf8');
    assert.match(panel, /case 'usedView': this\._usedView = msg\.view === 'local' \? 'local' : 'outside'; break;/, 'the choice is remembered');
    assert.match(panel, /topLevelDeclarations\(text, provider\.languageId, true\)/);
    assert.match(fs.readFileSync(path.join(root, 'src', 'webview', 'manageSection.ts'), 'utf8'), /command: 'usedView'/);
});
