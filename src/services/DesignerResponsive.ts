/**
 * What the form becomes at another size: where Align and Anchors put every component, and what then goes wrong
 * (a component pushed out of its container, two components that now overlap). It only reports the problems that the new
 * size brings, not the ones the form already had. Pure.
 */
import { DNode, DesignModel } from './DesignerModel';

export interface Rect { x: number; y: number; w: number; h: number }
export interface ResponsiveIssue { name: string; kind: 'outside' | 'overlap'; other?: string }
export interface ResponsiveResult { width: number; height: number; rects: Record<string, Rect>; issues: ResponsiveIssue[] }

const MAX_ISSUES = 60;

/** The rectangle of a component once its container grew by (dw, dh). */
function resized(c: DNode, dw: number, dh: number): Rect {
    let { x, y, w, h } = c;
    switch (c.align) {
        case 'alTop': w += dw; break;
        case 'alBottom': y += dh; w += dw; break;
        case 'alLeft': h += dh; break;
        case 'alRight': x += dw; h += dh; break;
        case 'alClient': w += dw; h += dh; break;
        default: {
            const left = c.anchors.includes('akLeft'), right = c.anchors.includes('akRight');
            const top = c.anchors.includes('akTop'), bottom = c.anchors.includes('akBottom');
            if (right && left) { w += dw; } else if (right) { x += dw; }
            if (bottom && top) { h += dh; } else if (bottom) { y += dh; }
        }
    }
    return { x, y, w: Math.max(0, w), h: Math.max(0, h) };
}

const free = (c: DNode): boolean => !c.align || c.align === 'alNone';
const shown = (c: DNode): boolean => c.visible && !c.nonVisual && !c.structural && c.w > 0 && c.h > 0;
const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const outside = (r: Rect, w: number, h: number): boolean => r.x < 0 || r.y < 0 || r.x + r.w > w || r.y + r.h > h;

export function resizeForm(model: DesignModel, width: number, height: number): ResponsiveResult {
    const rects: Record<string, Rect> = {};
    const issues: ResponsiveIssue[] = [];
    const walk = (n: DNode, oldW: number, oldH: number, newW: number, newH: number): void => {
        const dw = newW - oldW, dh = newH - oldH;
        const now = new Map<DNode, Rect>();
        for (const c of n.children) {
            if (c.structural) { continue; }
            const r = c.nonVisual ? { x: c.x, y: c.y, w: c.w, h: c.h } : resized(c, dw, dh);
            now.set(c, r);
            if (!c.nonVisual) { rects[c.name] = r; }
        }
        const kids = n.children.filter(c => now.has(c) && shown(c));
        for (const c of kids) {
            const r = now.get(c)!;
            if (outside(r, newW, newH) && !outside(c, oldW, oldH) && issues.length < MAX_ISSUES) { issues.push({ name: c.name, kind: 'outside' }); }
        }
        for (let i = 0; i < kids.length; i++) {
            for (let j = i + 1; j < kids.length; j++) {
                const a = kids[i], b = kids[j];
                if (!free(a) || !free(b) || issues.length >= MAX_ISSUES) { continue; }
                if (overlaps(now.get(a)!, now.get(b)!) && !overlaps(a, b)) { issues.push({ name: a.name, kind: 'overlap', other: b.name }); }
            }
        }
        for (const c of n.children) {
            const r = now.get(c);
            if (r && c.children.length && !c.structural) { walk(c, c.w, c.h, r.w, r.h); }
        }
    };
    walk(model.root, model.width, model.height, width, height);
    return { width, height, rects, issues };
}
