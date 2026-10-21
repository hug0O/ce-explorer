/**
 * Magnetism of the form designer: while a component is moved or resized, its edges and its centre are pulled to the
 * edges and centres of the other components of the same container and to the edges and centre of the container, and
 * guide lines show what it caught (as in Affinity Designer).
 *
 * The functions are plain JavaScript in a string: the page includes them as they are, and the tests run the very same
 * text, so there is one copy of the rule.
 */
export function snapScript(): string {
    return `
/* Distance (to add to v) to the nearest of the lines within the threshold, or null when none is that close. */
function magnetValue(v, lines, threshold) {
  var best = null;
  for (var i = 0; i < lines.length; i++) {
    var d = lines[i] - v;
    if (Math.abs(d) <= threshold && (best === null || Math.abs(d) < Math.abs(best))) { best = d; }
  }
  return best;
}
/* The lines a component can catch: edges and centres of the other rectangles (x, y, w, h) and of the container (size w, h). */
function magnetLines(rects, size, opts) {
  var xs = [], ys = [];
  function add(list, v) { if (list.indexOf(v) < 0) { list.push(v); } }
  rects.forEach(function (r) {
    if (opts.edges) { add(xs, r.x); add(xs, r.x + r.w); add(ys, r.y); add(ys, r.y + r.h); }
    if (opts.centers) { add(xs, r.x + r.w / 2); add(ys, r.y + r.h / 2); }
  });
  if (opts.container && size) {
    if (opts.edges) { add(xs, 0); add(xs, size.w); add(ys, 0); add(ys, size.h); }
    if (opts.centers) { add(xs, size.w / 2); add(ys, size.h / 2); }
  }
  return { xs: xs, ys: ys };
}
/* How far a guide line runs: from the box to the components it lines up with, a little beyond. axis 'x' is a vertical line at v. */
function magnetSpan(box, rects, v, axis, margin) {
  var lo = axis === 'x' ? box.y : box.x, hi = axis === 'x' ? box.y + box.h : box.x + box.w;
  rects.forEach(function (r) {
    var a = axis === 'x' ? r.x : r.y, len = axis === 'x' ? r.w : r.h;
    if (Math.abs(a - v) < 0.5 || Math.abs(a + len - v) < 0.5 || Math.abs(a + len / 2 - v) < 0.5) {
      lo = Math.min(lo, axis === 'x' ? r.y : r.x); hi = Math.max(hi, axis === 'x' ? r.y + r.h : r.x + r.w);
    }
  });
  return { from: lo - margin, to: hi + margin };
}
/*
 * Equal spacing: the box is pulled to where its gap to a neighbour is the gap two other components already have, or to the
 * middle of the space between two of them, and the equal gaps are returned to be drawn. axis 'x' looks at components that
 * overlap the box vertically (a row), axis 'y' at the ones that overlap it horizontally (a column).
 * Returns { d, gaps: [{ from, to, at }] } or null: d is how far to shift the box on that axis.
 */
function magnetGaps(box, rects, threshold, axis) {
  var h = axis === 'x';
  function lo(r) { return h ? r.x : r.y; }
  function hi(r) { return h ? r.x + r.w : r.y + r.h; }
  function cross0(r) { return h ? r.y : r.x; }
  function cross1(r) { return h ? r.y + r.h : r.x + r.w; }
  var row = rects.filter(function (r) { return cross0(r) < cross1(box) && cross1(r) > cross0(box); }).sort(function (a, b) { return lo(a) - lo(b); });
  if (row.length < 2) { return null; }
  var size = hi(box) - lo(box), pos = lo(box);
  var best = null;
  function consider(target, gaps) {
    var d = target - pos;
    if (Math.abs(d) <= threshold && (best === null || Math.abs(d) < Math.abs(best.d))) { best = { d: d, gaps: gaps }; }
  }
  var mid = (cross0(box) + cross1(box)) / 2;
  var known = [];
  for (var i = 0; i + 1 < row.length; i++) {
    var g = lo(row[i + 1]) - hi(row[i]);
    if (g > 0) { known.push({ g: g, a: row[i], b: row[i + 1] }); }
  }
  // the middle of the space between two neighbours: both gaps equal
  for (var j = 0; j + 1 < row.length; j++) {
    var space = lo(row[j + 1]) - hi(row[j]) - size;
    if (space >= 0) {
      var t = hi(row[j]) + space / 2;
      consider(t, [{ from: hi(row[j]), to: t, at: mid }, { from: t + size, to: lo(row[j + 1]), at: mid }]);
    }
  }
  // the gap the others already have, after the last one, before the first one, or after / before any of them
  known.forEach(function (k) {
    row.forEach(function (r) {
      consider(hi(r) + k.g, [{ from: hi(k.a), to: lo(k.b), at: mid }, { from: hi(r), to: hi(r) + k.g, at: mid }]);
      consider(lo(r) - k.g - size, [{ from: hi(k.a), to: lo(k.b), at: mid }, { from: lo(r) - k.g, to: lo(r), at: mid }]);
    });
  });
  return best;
}
/* A box (x, y, w, h) being moved: how far to shift it on each axis (0 when nothing is close) and the lines it then sits on. */
function magnetBox(box, lines, threshold, opts) {
  var px = [], py = [];
  if (opts.edges) { px.push(box.x, box.x + box.w); py.push(box.y, box.y + box.h); }
  if (opts.centers) { px.push(box.x + box.w / 2); py.push(box.y + box.h / 2); }
  function best(points, cands) {
    var b = null;
    points.forEach(function (p) { var d = magnetValue(p, cands, threshold); if (d !== null && (b === null || Math.abs(d) < Math.abs(b))) { b = d; } });
    return b;
  }
  function sitting(points, cands, d) {
    var g = [];
    if (d === null) { return g; }
    points.forEach(function (p) { cands.forEach(function (c) { if (Math.abs(p + d - c) < 0.5 && g.indexOf(c) < 0) { g.push(c); } }); });
    return g;
  }
  var dx = best(px, lines.xs), dy = best(py, lines.ys);
  return { dx: dx === null ? 0 : dx, dy: dy === null ? 0 : dy, gx: sitting(px, lines.xs, dx), gy: sitting(py, lines.ys, dy) };
}
`;
}
