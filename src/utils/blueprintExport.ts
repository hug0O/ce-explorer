/**
 * The Blueprint as text or as a picture to put in a document: a Mermaid flowchart (pasted in a README, a wiki, a pull request) and a
 * standalone SVG. Pure.
 */
import type { BpEdge, BpNode } from './blueprintModel';

const HEAD = 34;
const ROW = 20;

export function toMermaid(nodes: BpNode[], edges: BpEdge[]): string {
    const id = new Map(nodes.map((n, i) => [n.id, 'n' + i]));
    const label = (n: BpNode): string => (n.owner ? n.owner + '.' : '') + n.name + (n.params.length ? '(' + n.params.map(p => p.name).join(', ') + ')' : '');
    const lines = ['flowchart LR'];
    for (const n of nodes) { lines.push('    ' + id.get(n.id) + '["' + label(n).replace(/"/g, "'") + '"]'); }
    for (const e of edges) {
        if (id.has(e.from) && id.has(e.to)) { lines.push('    ' + id.get(e.from) + ' --> ' + id.get(e.to)); }
    }
    return lines.join('\n') + '\n';
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const trunc = (s: string, n: number): string => (s.length > n ? s.slice(0, Math.max(1, n - 1)) + '…' : s);
const HEADS: Record<string, string> = { method: '#2a6fb0', function: '#2a6fb0', constructor: '#2e8b57', destructor: '#a33b3b' };

export function toSvg(nodes: BpNode[], edges: BpEdge[]): string {
    if (!nodes.length) { return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>\n'; }
    const pad = 30;
    const x0 = Math.min(...nodes.map(n => n.x)) - pad, y0 = Math.min(...nodes.map(n => n.y)) - pad;
    const x1 = Math.max(...nodes.map(n => n.x + n.w)) + pad, y1 = Math.max(...nodes.map(n => n.y + n.h)) + pad;
    const by = new Map(nodes.map(n => [n.id, n]));
    const out: string[] = [];
    out.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.round(x1 - x0) + '" height="' + Math.round(y1 - y0) + '" viewBox="' + Math.round(x0) + ' ' + Math.round(y0) + ' ' + Math.round(x1 - x0) + ' ' + Math.round(y1 - y0) + '" font-family="Segoe UI, Arial, sans-serif" font-size="11">');
    out.push('<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" fill="#1e1e1e"/>');
    for (const e of edges) {
        const a = by.get(e.from), b = by.get(e.to);
        if (!a || !b) { continue; }
        const xa = a.x + a.w, ya = a.y + HEAD + 12, xb = b.x, yb = b.y + HEAD + 12;
        const d = Math.max(50, Math.abs(xb - xa) / 2);
        out.push('<path d="M' + xa + ',' + ya + ' C' + (xa + d) + ',' + ya + ' ' + (xb - d) + ',' + yb + ' ' + xb + ',' + yb + '" fill="none" stroke="#cccccc" stroke-width="2" opacity="0.8"/>');
    }
    for (const n of nodes) {
        out.push('<g transform="translate(' + n.x + ',' + n.y + ')">');
        out.push('<rect width="' + n.w + '" height="' + n.h + '" rx="6" fill="#252526" stroke="#808080"/>');
        out.push('<path d="M0,6 a6,6 0 0 1 6,-6 h' + (n.w - 12) + ' a6,6 0 0 1 6,6 v' + (HEAD - 6) + ' h-' + n.w + ' z" fill="' + (HEADS[n.kind] ?? '#2a6fb0') + '"/>');
        out.push('<text x="10" y="' + (n.owner ? 15 : 21) + '" fill="#ffffff" font-weight="600" font-size="12">' + esc(trunc(n.name, Math.floor((n.w - 20) / 7))) + '</text>');
        if (n.owner) { out.push('<text x="10" y="28" fill="#d0d0d0" font-size="10">' + esc(trunc(n.owner, Math.floor((n.w - 20) / 6))) + '</text>'); }
        out.push('<path d="M-7,' + (HEAD + 5) + ' l8,7 l-8,7 z" fill="#f2f2f2"/><path d="M' + (n.w - 1) + ',' + (HEAD + 5) + ' l8,7 l-8,7 z" fill="#f2f2f2"/>');
        n.params.forEach((p, i) => {
            const y = HEAD + 12 + (i + 1) * ROW;
            out.push('<circle cx="0" cy="' + y + '" r="5" fill="#9aa0a6"/><text x="12" y="' + (y + 4) + '" fill="#cccccc">' + esc(trunc(p.name + (p.type ? ': ' + p.type : ''), Math.floor((n.w - 24) / 6.5))) + '</text>');
        });
        if (n.ret) {
            const y = HEAD + 12 + ROW;
            out.push('<circle cx="' + n.w + '" cy="' + y + '" r="5" fill="#9aa0a6"/><text x="' + (n.w - 12) + '" y="' + (y + 4) + '" text-anchor="end" fill="#cccccc">' + esc(trunc(n.ret, Math.floor((n.w - 24) / 6.5))) + '</text>');
        }
        out.push('</g>');
    }
    out.push('</svg>');
    return out.join('\n') + '\n';
}
