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
