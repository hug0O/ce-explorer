import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as vm from 'vm';
import { snapScript } from '../webview/designerSnap';
import { designerHtml } from '../webview/designerHtml';

// the very text the page includes
const sandbox: Record<string, any> = {};
vm.createContext(sandbox);
vm.runInContext(snapScript(), sandbox);
const { magnetValue, magnetLines, magnetBox } = sandbox as { magnetValue: any; magnetLines: any; magnetBox: any };
const ALL = { edges: true, centers: true, container: true, guides: true };
const plain = (v: unknown): unknown => JSON.parse(JSON.stringify(v));

test('the nearest line within the threshold, or nothing', () => {
    assert.equal(magnetValue(10, [20, 13, 6], 5), 3, 'the nearest of 13 and 6 is 13: +3');
    assert.equal(magnetValue(10, [20, 7, 13.5], 5), -3, 'and below as well');
    assert.equal(magnetValue(10, [100], 5), null);
    assert.equal(magnetValue(10, [], 5), null);
    assert.equal(magnetValue(10, [15], 5), 5, 'the threshold itself counts');
});

test('the lines a component can catch: the other components and the container', () => {
    const lines = plain(magnetLines([{ x: 10, y: 20, w: 100, h: 40 }], { w: 400, h: 300 }, ALL)) as { xs: number[]; ys: number[] };
    assert.deepEqual(lines.xs.sort((a, b) => a - b), [0, 10, 60, 110, 200, 400]);
    assert.deepEqual(lines.ys.sort((a, b) => a - b), [0, 20, 40, 60, 150, 300]);
    const onlyEdges = plain(magnetLines([{ x: 10, y: 20, w: 100, h: 40 }], { w: 400, h: 300 }, { ...ALL, centers: false })) as { xs: number[] };
    assert.deepEqual(onlyEdges.xs.sort((a, b) => a - b), [0, 10, 110, 400]);
    const noContainer = plain(magnetLines([{ x: 10, y: 20, w: 100, h: 40 }], { w: 400, h: 300 }, { ...ALL, container: false })) as { xs: number[] };
    assert.deepEqual(noContainer.xs.sort((a, b) => a - b), [10, 60, 110]);
});

test('a box being moved is pulled to a line, and the guides say which one', () => {
    const lines = magnetLines([{ x: 100, y: 100, w: 80, h: 30 }], { w: 400, h: 300 }, ALL);
    // left edge 3 px from the left edge of the other one, 40 px away on the other axis
    const m = plain(magnetBox({ x: 97, y: 20, w: 50, h: 20 }, lines, 6, ALL)) as { dx: number; dy: number; gx: number[]; gy: number[] };
    assert.deepEqual([m.dx, m.dy], [3, 0]);
    assert.deepEqual(m.gx, [100]);
    assert.deepEqual(m.gy, [], 'nothing close on the other axis: no guide there');
    // its centre against the other one's centre (140), its top against its top at the same time
    const c = plain(magnetBox({ x: 117, y: 98, w: 50, h: 20 }, lines, 6, ALL)) as { dx: number; dy: number; gx: number[]; gy: number[] };
    assert.deepEqual([c.dx, c.dy], [-2, 2]);
    assert.deepEqual([c.gx, c.gy], [[140], [100]]);
});

test('the centre of the container, and the edges of the container', () => {
    const lines = magnetLines([], { w: 400, h: 300 }, ALL);
    const mid = plain(magnetBox({ x: 172, y: 10, w: 50, h: 20 }, lines, 6, ALL)) as { dx: number; gx: number[] };
    assert.deepEqual([mid.dx, mid.gx], [3, [200]], 'centred horizontally: 172 + 25 + 3 = 200');
    const edge = plain(magnetBox({ x: 355, y: 10, w: 40, h: 20 }, lines, 6, ALL)) as { dx: number; gx: number[] };
    assert.deepEqual([edge.dx, edge.gx], [5, [400]], 'the right edge on the right edge of the container');
});

test('the options choose what is caught', () => {
    const lines = magnetLines([{ x: 100, y: 100, w: 80, h: 30 }], { w: 400, h: 300 }, ALL);
    const centreOnly = { ...ALL, edges: false };
    const m = plain(magnetBox({ x: 97, y: 20, w: 50, h: 20 }, magnetLines([{ x: 100, y: 100, w: 80, h: 30 }], { w: 400, h: 300 }, centreOnly), 6, centreOnly)) as { dx: number };
    assert.equal(m.dx, 0, 'edges are not caught: the left edge at 97 is not near a centre');
    const none = plain(magnetBox({ x: 97, y: 20, w: 50, h: 20 }, lines, 6, { edges: false, centers: false })) as { dx: number; dy: number };
    assert.deepEqual([none.dx, none.dy], [0, 0]);
    const far = plain(magnetBox({ x: 300, y: 250, w: 20, h: 10 }, magnetLines([{ x: 100, y: 100, w: 80, h: 30 }], undefined, ALL), 6, ALL)) as { dx: number; gx: number[] };
    assert.deepEqual([far.dx, far.gx], [0, []], 'too far: left alone');
});

test('the toolbar has the magnet, its options, the guide lines and Alt to turn it off', () => {
    const html = designerHtml('N');
    assert.match(html, /<button id="snap" class="active"[^>]*>🧲 Snap<\/button><button id="snapopt"/);
    for (const id of ['snapedges', 'snapcenters', 'snapcont', 'snapguides']) { assert.match(html, new RegExp('id="' + id + '" checked'), id); }
    assert.match(html, /function magnetOn\(ev\) \{ return state\.snap\.on && !ev\.altKey/, 'Alt turns it off while dragging');
    assert.match(html, /\.guide\.v \{/);
    assert.match(html, /magnetBox\(\{ x: bx0 \+ dx/, 'a move catches the box of the selection');
    assert.match(html, /magnetValue\(v, rctx\.lines\.xs/, 'a resize catches the edge that moves');
    assert.match(html, /snap: state\.snap, view:/, 'the choice is kept');
});

test('a guide line runs from the component to the ones it lines up with, a little beyond', () => {
    const { magnetSpan } = sandbox as { magnetSpan: any };
    const rects = [{ x: 100, y: 200, w: 80, h: 30 }, { x: 300, y: 10, w: 50, h: 20 }];
    const box = { x: 100, y: 50, w: 60, h: 20 };
    assert.deepEqual(plain(magnetSpan(box, rects, 100, 'x', 8)), { from: 42, to: 238 }, 'the box above and the first one share the left edge at 100');
    assert.deepEqual(plain(magnetSpan(box, rects, 160, 'x', 8)), { from: 42, to: 78 }, 'only the box is on 160: a short line');
    assert.deepEqual(plain(magnetSpan({ x: 20, y: 205, w: 30, h: 20 }, rects, 215, 'y', 4)), { from: 16, to: 184 }, 'a horizontal line: x extent');
});

test('equal spacing: the box is pulled to the gap the others have, or to the middle between two', () => {
    const { magnetGaps } = sandbox as { magnetGaps: any };
    // three buttons in a row: 0-50 and 70-120 (gap 20) and the box, 40 high, in line with them
    const row = [{ x: 0, y: 0, w: 50, h: 40 }, { x: 70, y: 0, w: 50, h: 40 }];
    const after = plain(magnetGaps({ x: 138, y: 5, w: 50, h: 30 }, row, 6, 'x')) as { d: number; gaps: { from: number; to: number; at: number }[] };
    assert.equal(after.d, 2, 'a gap of 20 after the second one: 120 + 20 = 140');
    assert.deepEqual(after.gaps.map(g => [g.from, g.to]), [[50, 70], [120, 140]], 'the two equal gaps, to be drawn');
    const before = plain(magnetGaps({ x: -72, y: 5, w: 50, h: 30 }, row, 6, 'x')) as { d: number };
    assert.equal(before.d, 2, 'and before the first one: 0 - 20 - 50 = -70');
    // the middle of the space between two components 100 apart, for a box of 40
    const apart = [{ x: 0, y: 0, w: 50, h: 40 }, { x: 150, y: 0, w: 50, h: 40 }];
    const mid = plain(magnetGaps({ x: 78, y: 0, w: 40, h: 40 }, apart, 6, 'x')) as { d: number; gaps: { from: number; to: number }[] };
    assert.equal(mid.d, 2, 'between 50 and 150 a box of 40 sits at 80');
    assert.deepEqual(mid.gaps.map(g => [g.from, g.to]), [[50, 80], [120, 150]]);
    // nothing in line, too far, or too few neighbours
    assert.equal(magnetGaps({ x: 138, y: 100, w: 50, h: 30 }, row, 6, 'x'), null, 'not in the same row');
    assert.equal(magnetGaps({ x: 300, y: 5, w: 50, h: 30 }, row, 6, 'x'), null, 'too far from any equal gap');
    assert.equal(magnetGaps({ x: 138, y: 5, w: 50, h: 30 }, [row[0]], 6, 'x'), null, 'one neighbour is no rhythm');
    // a column: the same on the other axis
    const col = [{ x: 0, y: 0, w: 60, h: 20 }, { x: 0, y: 30, w: 60, h: 20 }];
    const down = plain(magnetGaps({ x: 5, y: 62, w: 50, h: 20 }, col, 6, 'y')) as { d: number };
    assert.equal(down.d, -2, 'a gap of 10 under the second: 50 + 10 = 60');
});
