import { test } from 'node:test';
import assert from 'node:assert/strict';

const { MemberKind, Visibility } = require('../models/types') as { MemberKind: typeof import('../models/types').MemberKind; Visibility: typeof import('../models/types').Visibility };
const { compileFilter, nameMatchesFilter, sortMembersForDisplay } = require('../utils/memberNavigation') as typeof import('../utils/memberNavigation');

interface M { name: string; kind: string; visibility: string }

function mem(name: string, kind: string, visibility: string): M {
    return { name, kind, visibility };
}

test('compileFilter + nameMatchesFilter: empty pattern matches everything', () => {
    const f = compileFilter('');
    assert.equal(f.active, false);
    assert.equal(nameMatchesFilter('anything', f), true);
});

test('compileFilter + nameMatchesFilter: valid regex matches case-insensitively', () => {
    const f = compileFilter('get|set');
    assert.equal(f.regex !== undefined, true);
    assert.equal(nameMatchesFilter('getName', f), true);
    assert.equal(nameMatchesFilter('setName', f), true);
    assert.equal(nameMatchesFilter('compute', f), false);
});

test('compileFilter + nameMatchesFilter: invalid regex falls back to literal contains', () => {
    const f = compileFilter('(unclosed');
    assert.equal(f.regex, undefined);
    assert.equal(f.literal, '(unclosed');
    assert.equal(nameMatchesFilter('foo (unclosed bar', f), true);
    assert.equal(nameMatchesFilter('nope', f), false);
});

test('sortMembersForDisplay: alphabetical mode sorts by name only', () => {
    const input = [mem('zeta', MemberKind.Method, Visibility.Public), mem('alpha', MemberKind.Field, Visibility.Private)];
    const out = sortMembersForDisplay(input as never, 'alpha');
    assert.deepEqual(out.map(m => m.name), ['alpha', 'zeta']);
});

test('sortMembersForDisplay: kind mode groups by member kind then name', () => {
    const input = [
        mem('b_method', MemberKind.Method, Visibility.Public),
        mem('a_field', MemberKind.Field, Visibility.Public),
        mem('a_method', MemberKind.Method, Visibility.Public),
    ];
    const out = sortMembersForDisplay(input as never, 'kind');
    // MemberKind enum order: Method(0) before Field(1); alphabetical within kind.
    assert.deepEqual(out.map(m => m.name), ['a_method', 'b_method', 'a_field']);
});

test('sortMembersForDisplay: visibility mode groups by visibility then kind then name', () => {
    const input = [
        mem('privateMethod', MemberKind.Method, Visibility.Private),
        mem('publicField', MemberKind.Field, Visibility.Public),
        mem('publicMethod', MemberKind.Method, Visibility.Public),
    ];
    const out = sortMembersForDisplay(input as never, 'visibility');
    // Public before Private; within Public, Method(0) before Field(1).
    assert.deepEqual(out.map(m => m.name), ['publicMethod', 'publicField', 'privateMethod']);
});
