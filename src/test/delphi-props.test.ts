import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { applyTextEdits } from '../services/DelphiForm';
import { findNode, parseDfmTree } from '../services/DelphiLayout';
import { setPropEdit } from '../services/DelphiProps';

const dir = path.join(__dirname, '..', '..', 'test-fixtures', 'delphi');
const dfm = fs.readFileSync(path.join(dir, 'LayoutForm.dfm'), 'utf8');
const root = parseDfmTree(dfm)!;
const node = (n: string) => findNode(root, n)!;
const reparse = (text: string) => parseDfmTree(text)!;

test('setPropEdit rewrites only the value of the property line', () => {
    const e = setPropEdit(dfm, node('edtNom'), 'Left', 99)!;
    const out = applyTextEdits(dfm, [e]);
    assert.equal(findNode(reparse(out), 'edtNom')!.left, 99);
    assert.equal(out.length, dfm.length, 'two digits replaced by two digits');
    assert.equal(setPropEdit(dfm, node('edtNom'), 'Nope', 1), undefined);
});
