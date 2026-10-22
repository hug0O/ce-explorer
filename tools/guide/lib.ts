/**
 * Makes the pictures of the user guide. The real designer page runs in Edge, and a small stand-in for the extension
 * answers its messages with the real services (the same functions FormDesignerPanel calls), so every picture shows what
 * the designer really does. `npx tsx tools/guide/make.ts` rewrites media/guide/*.
 */
import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer-core';
// @ts-ignore: no types shipped
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { PNG } from 'pngjs';
import { applyTextEdits, normalizeEdits } from '../../src/services/DelphiForm';
import { alignComponents, ALIGN_OPS, AlignOp, planTabOrder } from '../../src/services/DelphiAlign';
import { findNode, parseDfmTree } from '../../src/services/DelphiLayout';
import { DesignResult, addEdits, buildDesignModel, deleteEdits, rectEdits, setPropertyEdits } from '../../src/services/DesignerModel';
import { compareItems, ghostsOf } from '../../src/services/DesignerCompare';
import { resizeForm } from '../../src/services/DesignerResponsive';
import { diffDfm } from '../../src/services/DfmDiff';
import { PALETTE, designerHtml } from '../../src/webview/designerHtml';

export const OUT = path.resolve(__dirname, '..', '..', 'media', 'guide');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
export const W = 1000, H = 620;

const THEME = `
:root { --vscode-font-family: 'Segoe UI', sans-serif; --vscode-font-size: 13px; --vscode-foreground: #cccccc; --vscode-descriptionForeground: #9d9d9d;
  --vscode-editor-background: #1e1e1e; --vscode-editorWidget-background: #252526; --vscode-panel-border: #3c3c3c; --vscode-focusBorder: #007fd4;
  --vscode-input-background: #3c3c3c; --vscode-input-foreground: #cccccc; --vscode-input-border: #3c3c3c;
  --vscode-button-background: #0e639c; --vscode-button-foreground: #ffffff; --vscode-button-secondaryBackground: #3a3d41; --vscode-button-secondaryForeground: #ffffff; --vscode-button-secondaryHoverBackground: #45494e;
  --vscode-list-hoverBackground: #2a2d2e; --vscode-list-activeSelectionBackground: #094771; --vscode-list-activeSelectionForeground: #ffffff;
  --vscode-editorGroupHeader-tabsBackground: #252526; --vscode-scrollbarSlider-background: rgba(121,121,121,0.4); --vscode-textBlockQuote-background: rgba(127,127,127,0.1);
  --vscode-badge-background: #4d4d4d; --vscode-badge-foreground: #ffffff; }
#fcur { position: fixed; left: 0; top: 0; width: 22px; height: 22px; z-index: 99999; pointer-events: none; margin: -2px 0 0 -2px; filter: drop-shadow(1px 2px 1px rgba(0,0,0,0.6)); }
#fcur.down::after { content: ''; position: absolute; left: -12px; top: -12px; width: 40px; height: 40px; border-radius: 50%; border: 3px solid #ffd43b; }
#capbar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 99998; padding: 9px 16px; font: 600 15px 'Segoe UI', sans-serif; color: #fff; background: rgba(0, 90, 160, 0.94); pointer-events: none; }
`;

export interface Frame { rgba: Uint8Array; w: number; h: number; delay: number }

export class Studio {
    browser!: Browser;
    page!: Page;
    dfm = '';
    pas = '';
    before = '';
    undo: { dfm: string; pas: string }[] = [];
    frames: Frame[] = [];
    cx = 40; cy = 40;

    constructor(private readonly fixture: { dfm: string; pas: string }) { }

    async open(): Promise<void> {
        this.browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--hide-scrollbars'] });
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
        await this.page.exposeFunction('__post', (s: string) => this.handle(JSON.parse(s) as Record<string, unknown>));
        await this.reset();
    }

    async close(): Promise<void> { await this.browser.close(); }

    /** The page with the fixture form loaded again, the cursor back in a corner. */
    async reset(): Promise<void> {
        this.dfm = this.fixture.dfm; this.pas = this.fixture.pas; this.before = this.fixture.dfm; this.undo = []; this.frames = []; this.compareRef = undefined;
        let html = designerHtml('N').replace(/nonce="N"/g, '').replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
        html = html.replace(/acquireVsCodeApi\(\)/, '({ postMessage: function (m) { window.__post(JSON.stringify(m)); }, getState: function () { return {}; }, setState: function () {} })');
        html = html.replace('</head>', '<style>' + THEME + '</style></head>');
        html = html.replace('</body>', '<svg id="fcur" viewBox="0 0 22 22"><path d="M3 2 L3 17 L7 13 L10 19 L12.5 18 L9.5 12 L15 12 Z" fill="#fff" stroke="#000" stroke-width="1.2"/></svg><div id="capbar" hidden></div></body>');
        await this.page.setContent(html, { waitUntil: 'load' });
        await this.page.evaluate(() => {
            document.addEventListener('mousemove', e => { const c = document.getElementById('fcur')!; c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
            document.addEventListener('mousedown', () => document.getElementById('fcur')!.classList.add('down'), true);
            document.addEventListener('mouseup', () => document.getElementById('fcur')!.classList.remove('down'), true);
        });
        await this.page.mouse.move(this.cx, this.cy);
        await this.send();
        await this.settle();
    }

    async settle(ms = 120): Promise<void> { await new Promise(r => setTimeout(r, ms)); }

    /* ───────── the stand-in for the extension ───────── */
    async send(selection?: string[], notice?: string, extra?: Record<string, unknown>): Promise<void> {
        const model = buildDesignModel(this.dfm);
        const msg = {
            type: 'model', model, designer: { groups: {}, locks: [], hidden: [] }, palette: PALETTE, ops: ALIGN_OPS.map(o => ({ id: o.id, label: o.label })),
            canUndo: this.undo.length > 0, canRedo: false, selection, notice, dirty: this.undo.length > 0, cut: [], ...extra,
        };
        await this.page.evaluate((m) => window.postMessage(m, '*'), msg as never);
        if (this.compareRef) { await this.sendCompare(); }
    }

    compareRef: string | undefined;
    async sendCompare(): Promise<void> {
        const diff = diffDfm(this.before, this.dfm);
        const old = buildDesignModel(this.before);
        await this.page.evaluate((m) => window.postMessage(m, '*'), { type: 'compare', ref: this.compareRef, items: compareItems(diff), ghosts: old ? ghostsOf(diff, old) : [] } as never);
    }

    private async commit(r: DesignResult, selection?: string[]): Promise<void> {
        if ('error' in r) { await this.send(undefined, r.error); return; }
        const d = normalizeEdits(r.dfmEdits), p = normalizeEdits(r.pasEdits);
        if ('error' in d || 'error' in p) { await this.send(undefined, 'overlapping edits'); return; }
        this.undo.push({ dfm: this.dfm, pas: this.pas });
        this.dfm = applyTextEdits(this.dfm, d.edits); this.pas = applyTextEdits(this.pas, p.edits);
        await this.send(selection);
    }

    async handle(m: Record<string, unknown>): Promise<void> {
        const root = parseDfmTree(this.dfm);
        const str = (v: unknown): string => (typeof v === 'string' ? v : '');
        const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);
        const names = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
        switch (m.type) {
            case 'ready': await this.send(); return;
            case 'move': case 'resize': {
                const ch = (m.changes as Record<string, unknown>[]).map(c => ({ name: str(c.name), rect: { left: num(c.left), top: num(c.top), width: num(c.width), height: num(c.height) } }));
                await this.commit(rectEdits(this.dfm, ch), ch.map(c => c.name)); return;
            }
            case 'setProp': await this.commit(setPropertyEdits(this.dfm, str(m.name), str(m.prop), m.value), [str(m.name)]); return;
            case 'setProps': {
                const dfmEdits: never[] = [], touched: string[] = [];
                for (const it of m.items as Record<string, unknown>[]) {
                    const r = setPropertyEdits(this.dfm, str(it.name), str(it.prop), it.value);
                    if (!('error' in r)) { dfmEdits.push(...(r.dfmEdits as never[])); touched.push(str(it.name)); }
                }
                await this.commit({ dfmEdits, pasEdits: [] }, touched); return;
            }
            case 'add': {
                const r = addEdits(this.pas, this.dfm, { className: str(m.className), parentName: str(m.parent) || undefined, left: num(m.left) ?? 16, top: num(m.top) ?? 16, width: num(m.width), height: num(m.height), caption: typeof m.caption === 'string' ? m.caption : undefined });
                await this.commit(r, 'name' in r && r.name ? [r.name] : undefined); return;
            }
            case 'delete': await this.commit(deleteEdits(this.pas, this.dfm, names(m.names))); return;
            case 'align': {
                if (!root) { return; }
                const list = names(m.names).map(n => findNode(root, n)).filter((n): n is NonNullable<typeof n> => !!n);
                const r = alignComponents(this.dfm, list, str(m.op) as AlignOp);
                await this.commit('error' in r ? r : { dfmEdits: r.edits, pasEdits: [] }, list.map(n => n.name)); return;
            }
            case 'tabOrder': {
                if (!root) { return; }
                const r = planTabOrder(this.dfm, [root]);
                await this.commit('error' in r ? r : { dfmEdits: r.edits, pasEdits: [] }, names(m.names)); return;
            }
            case 'testSize': {
                const dm = buildDesignModel(this.dfm);
                if (dm) { await this.page.evaluate((x) => window.postMessage(x, '*'), { type: 'testSizeResult', ...resizeForm(dm, num(m.w) ?? 800, num(m.h) ?? 600) } as never); }
                return;
            }
            case 'compareAsk': this.compareRef = 'HEAD'; await this.sendCompare(); return;
            case 'compareClose': this.compareRef = undefined; return;
            default: return;
        }
    }

    /* ───────── driving the page ───────── */
    async caption(text: string | undefined): Promise<void> {
        await this.page.evaluate((t) => { const c = document.getElementById('capbar')!; c.hidden = !t; c.textContent = t ?? ''; }, text as never);
    }

    async snap(delay = 90): Promise<void> {
        const buf = Buffer.from(await this.page.screenshot({ type: 'png' }));
        const png = PNG.sync.read(buf);
        this.frames.push({ rgba: new Uint8Array(png.data), w: png.width, h: png.height, delay });
    }

    /** Where a component is on the screen (centre), by its name. */
    async centre(name: string): Promise<{ x: number; y: number }> {
        return this.page.evaluate((n) => { const e = document.querySelector('#client [data-name="' + n + '"]')!.getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; }, name as never);
    }
    async rect(name: string): Promise<{ x: number; y: number; w: number; h: number }> {
        return this.page.evaluate((n) => { const e = document.querySelector('#client [data-name="' + n + '"]')!.getBoundingClientRect(); return { x: e.left, y: e.top, w: e.width, h: e.height }; }, name as never);
    }
    /** The button / row / element with this text (first match). */
    async byText(selector: string, text: string): Promise<{ x: number; y: number }> {
        return this.page.evaluate((s, t) => {
            const e = Array.from(document.querySelectorAll(s)).find(x => (x.textContent ?? '').indexOf(t) >= 0) as HTMLElement | undefined;
            if (!e) { throw new Error('not found: ' + s + ' ' + t); }
            e.scrollIntoView({ block: 'nearest' });
            const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }, selector as never, text as never);
    }

    /** The pointer glides to a point, a frame on the way when `shoot`. */
    async glide(x: number, y: number, steps = 6, shoot = true): Promise<void> {
        const x0 = this.cx, y0 = this.cy;
        for (let i = 1; i <= steps; i++) {
            const t = i / steps, e = t * t * (3 - 2 * t);
            await this.page.mouse.move(x0 + (x - x0) * e, y0 + (y - y0) * e);
            if (shoot && (i === Math.ceil(steps / 2) || i === steps)) { await this.snap(80); }
        }
        this.cx = x; this.cy = y;
    }
    async click(x: number, y: number, opts: { ctrl?: boolean } = {}): Promise<void> {
        await this.glide(x, y);
        if (opts.ctrl) { await this.page.keyboard.down('Control'); }
        await this.page.mouse.down(); await this.snap(110);
        await this.page.mouse.up();
        if (opts.ctrl) { await this.page.keyboard.up('Control'); }
        await this.settle(); await this.snap(120);
    }
    async drag(x0: number, y0: number, x1: number, y1: number, steps = 8): Promise<void> {
        await this.glide(x0, y0, 4);
        await this.page.mouse.down();
        await this.glide(x1, y1, steps);
        await this.snap(300);
        await this.page.mouse.up(); await this.settle(); await this.snap(160);
    }
    async hold(ms = 900): Promise<void> { await this.snap(ms); }

    /* ───────── output ───────── */
    saveGif(file: string): number {
        fs.mkdirSync(OUT, { recursive: true });
        const gif = GIFEncoder();
        for (const f of this.frames) {
            const palette = quantize(f.rgba, 256, { format: 'rgb565' });
            gif.writeFrame(applyPalette(f.rgba, palette, 'rgb565'), f.w, f.h, { palette, delay: f.delay });
        }
        if (process.env.GUIDE_DEBUG) {
            const f = this.frames[this.frames.length - 1 - Number(process.env.GUIDE_BACK ?? 0)];
            const png = new PNG({ width: f.w, height: f.h }); png.data = Buffer.from(f.rgba);
            fs.writeFileSync(path.join(process.env.GUIDE_DEBUG, "_last-" + file + ".png"), PNG.sync.write(png));
        }
        gif.finish();
        const bytes = Buffer.from(gif.bytes());
        fs.writeFileSync(path.join(OUT, file), bytes);
        return bytes.length;
    }
    async savePng(file: string): Promise<void> {
        fs.mkdirSync(OUT, { recursive: true });
        fs.writeFileSync(path.join(OUT, file), Buffer.from(await this.page.screenshot({ type: 'png' })));
    }
}
