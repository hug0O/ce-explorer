import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { pool } from '../utils/pool';
import { readUnit } from '../utils/unitGraph';
import { blueprintScript } from '../webview/blueprintHtml';

test('the pool runs several at once, never more than the limit, and goes through every item', async () => {
    let running = 0, peak = 0;
    const seen: number[] = [];
    await pool(Array.from({ length: 50 }, (_, i) => i), 8, async i => {
        running++; peak = Math.max(peak, running);
        await new Promise(r => setTimeout(r, 2));
        seen.push(i); running--;
    });
    assert.equal(seen.length, 50);
    assert.ok(peak > 1 && peak <= 8, 'parallel but limited: ' + peak);
    await pool([], 4, async () => { throw new Error('nothing to do'); });
});

test('a big unit is read from its start: the uses of both sections are found without masking the whole code', () => {
    const body = ("procedure TBig.Work; // uses Fake;\nbegin\n  s := 'uses Other;';\nend;\n").repeat(40000);   // a few megabytes of code
    const text = 'unit Big;\ninterface\nuses A, B;\nimplementation\nuses\n  C, // note\n  D;\n' + body + 'end.';
    assert.ok(text.length > 2_000_000);
    const t0 = Date.now();
    const u = readUnit(text, 'Big.pas')!;
    const ms = Date.now() - t0;
    assert.deepEqual(u.uses.map(x => [x.name, x.section]), [['A', 'interface'], ['B', 'interface'], ['C', 'implementation'], ['D', 'implementation']]);
    assert.ok(ms < 400, 'a unit of several MB is read in ' + ms + ' ms');
    // a program file and a unit without implementation are read whole
    assert.deepEqual(readUnit("program P;\nuses X in 'X.pas';\nbegin end.", 'P.dpr')!.uses.map(x => x.name), ['X']);
    assert.deepEqual(readUnit('unit Only;\ninterface\nuses Z;\n', 'Only.pas')!.uses.map(x => x.name), ['Z']);
});

test('the project view draws first and analyses after, reads in parallel, remembers what it read, and says how far it is', () => {
    const panel = fs.readFileSync(path.join(__dirname, '..', 'webview', 'ProjectBlueprintPanel.ts'), 'utf8');
    assert.match(panel, /await pool\(files, PARALLEL,/);
    assert.match(panel, /const CACHE = new Map<string, \{ stamp: string; unit: UnitInfo \| undefined \}>\(\)/);
    assert.match(panel, /if \(hit && hit\.stamp === stamp\) \{ units\[i\] = hit\.unit; \}/, 'a file that did not change is not read again');
    assert.match(panel, /this\.postModel\(fit\);\s*\n\s*if \(this\.group === 'pascal'\) \{ await this\.analyse\(units, run\); \}/, 'the graph is shown before the analysis');
    assert.match(panel, /if \(run !== this\.run\) \{ return; \}/, 'a newer load stops an older one');
    assert.match(panel, /await new Promise\(r => setTimeout\(r, 0\)\)/, 'the editor stays free while analysing');
    assert.match(panel, /'Reading the units\.\.\. '/);
    assert.match(panel, /'Looking at what each unit takes\.\.\. '/);
    assert.match(blueprintScript(), /m\.type === 'loading'/);
});
