import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemberKind, Visibility } from '../models/types';
import type { MemberFormResult } from '../models/types';
import { memberFormToSpec } from '../services/memberForm';

const base: MemberFormResult = {
    kind: MemberKind.Method, name: 'Foo', returnType: 'int', type: 'int',
    visibility: Visibility.Public, parameters: [], isStatic: false, isVirtual: false,
    isAbstract: false, isOverride: false, hasGetter: false, hasSetter: false,
};

test('memberFormToSpec builds a Method MemberSpec', () => {
    const r = { ...base, isStatic: true, parameters: [{ name: 'x', type: 'int' }] };
    const spec = memberFormToSpec(r);
    assert.equal(spec.kind, MemberKind.Method);
    assert.equal(spec.name, 'Foo');
    assert.equal(spec.isStatic, true);
    assert.equal(spec.parameters.length, 1);
});

test('memberFormToSpec builds a Field FieldSpec', () => {
    const spec = memberFormToSpec({ ...base, kind: MemberKind.Field, type: 'string' });
    assert.equal(spec.kind, MemberKind.Field);
    assert.equal((spec as any).type, 'string');
});

test('memberFormToSpec builds a Property PropertySpec', () => {
    const spec = memberFormToSpec({ ...base, kind: MemberKind.Property, hasGetter: true, hasSetter: false });
    assert.equal(spec.kind, MemberKind.Property);
    assert.equal((spec as any).hasGetter, true);
    assert.equal((spec as any).hasSetter, false);
});

test('memberFormToSpec falls back to default types when missing', () => {
    const field = memberFormToSpec({ ...base, kind: MemberKind.Field, type: '', returnType: '' });
    assert.ok((field as any).type.length > 0);
});
