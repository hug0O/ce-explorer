/**
 * Rewrites media/guide/*.gif and *.png, the pictures of the user guide (see lib.ts).
 * `npx tsx tools/guide/make.ts` makes them all, `npx tsx tools/guide/make.ts add menus` only those named.
 */
import { Studio } from './lib';
import { DFM, PAS } from './fixture';

type Scenario = (s: Studio) => Promise<void>;

const inputOf = async (s: Studio, label: string): Promise<{ x: number; y: number }> => s.page.evaluate((t) => {
    const l = Array.from(document.querySelectorAll('#inspector label.f')).find(x => (x.querySelector('span')?.textContent ?? '').trim() === t) as HTMLElement;
    const i = l.querySelector('input,select') as HTMLElement; const r = i.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}, label as never);

const type = async (s: Studio, text: string): Promise<void> => {
    await s.page.keyboard.type(text, { delay: 60 }); await s.snap(160);
    await s.page.keyboard.press('Enter'); await s.settle(); await s.snap(200);
};

const rowOf = (s: Studio, name: string) => s.byText('#outline .orow, #outline div', name);

export const SCENARIOS: Record<string, { file: string; run: Scenario }> = {
    overview: {
        file: 'designer.png', run: async s => {
            const c = await s.centre('edtName'); await s.click(c.x, c.y);
            await s.glide(780, 560, 2, false); await s.settle(200);
            await s.savePng('designer.png');
        },
    },
    add: {
        file: 'add-component.gif', run: async s => {
            await s.page.click('#palsec > summary'); await s.settle(200);
            await s.caption('1. Pick a component in the palette (folded by default: click Palette to open it)');
            await s.snap(700);
            const b = await s.byText('#palette button', 'Button'); await s.click(b.x, b.y);
            await s.caption('2. Click on the form where it goes (or draw its size)');
            const r = await s.rect('memNotes'); await s.click(r.x + 150, r.y + r.h + 22);
            await s.caption('3. It is in the .dfm and the unit: name, field, position. Rename it or give it an event in the inspector');
            await s.hold(1800);
        },
    },
    magnet: {
        file: 'magnetism.gif', run: async s => {
            await s.caption('Drag a component: it catches the edges and centres of its neighbours');
            const c = await s.centre('chkActive'), a = await s.rect('edtName');
            await s.snap(600);
            await s.drag(c.x, c.y, a.x + 48, a.y + 56, 10);
            await s.caption('Pink lines show what lines up (hold Alt to move freely)');
            await s.hold(1800);
        },
    },
    multi: {
        file: 'multi-selection.gif', run: async s => {
            await s.caption('Ctrl + click adds components to the selection');
            const a = await s.centre('edtName'), b = await s.centre('edtCity'), c = await s.centre('cbType');
            await s.click(a.x, a.y); await s.click(b.x, b.y, { ctrl: true }); await s.click(c.x, c.y, { ctrl: true });
            await s.caption('The inspector edits what they share: one change goes to all of them');
            await s.hold(900);
            const w = await inputOf(s, 'Width'); await s.click(w.x, w.y);
            await s.page.keyboard.down('Control'); await s.page.keyboard.press('a'); await s.page.keyboard.up('Control');
            await type(s, '220');
            await s.hold(1600);
        },
    },
    view: {
        file: 'view-menu.gif', run: async s => {
            await s.caption('One View menu: names, TabOrder numbers, rulers, themes, find');
            const v = await s.byText('#viewbtn', 'View'); await s.click(v.x, v.y); await s.hold(500);
            const t = await s.byText('#viewmenu label', 'TabOrder'); await s.click(t.x, t.y);
            const r = await s.byText('#viewmenu label', 'Rulers'); await s.click(r.x, r.y);
            const n = await s.byText('#viewmenu label', 'Names'); await s.click(n.x, n.y);
            await s.page.mouse.click(600, 120); await s.settle(); await s.caption('TabOrder numbers, rulers and names are drawn on the form');
            await s.hold(2000);
        },
    },
    find: {
        file: 'find.gif', run: async s => {
            await s.caption('Ctrl+F finds a component by name, class, caption or handler');
            await s.snap(500);
            await s.page.keyboard.down('Control'); await s.page.keyboard.press('f'); await s.page.keyboard.up('Control'); await s.settle();
            await s.snap(400);
            await s.page.keyboard.type('save', { delay: 120 }); await s.settle(); await s.snap(1800);
        },
    },
    compare: {
        file: 'compare-git.gif', run: async s => {
            await s.handle({ type: 'delete', names: ['chkActive'] });
            await s.handle({ type: 'move', changes: [{ name: 'btnCancel', left: 410, top: 8 }, { name: 'cbType', left: 300, top: 16 }] });
            await s.handle({ type: 'setProp', name: 'btnSave', prop: 'Caption', value: 'OK' });
            await s.handle({ type: 'add', className: 'TButton', parent: 'pnlButtons', left: 230, top: 8 });
            await s.caption('The form was edited since the last commit...');
            await s.hold(1200);
            const v = await s.byText('#viewbtn', 'View'); await s.click(v.x, v.y);
            const c = await s.byText('#viewmenu .vrow', 'Compare'); await s.click(c.x, c.y);
            await s.caption('View > Compare with a git version: added, changed, moved, and removed components (dashed ghost)');
            await s.hold(2600);
        },
    },
    sizes: {
        file: 'form-sizes.gif', run: async s => {
            await s.page.select('#zoom', 'fit'); await s.settle(200);
            await s.caption('View > Test other form sizes: what Align and Anchors do');
            const v = await s.byText('#viewbtn', 'View'); await s.click(v.x, v.y);
            const c = await s.byText('#viewmenu .vrow', 'Test other form sizes'); await s.click(c.x, c.y);
            await s.settle(400); await s.hold(1500);
            await s.caption('Bigger: aligned and anchored components follow');
            const g = await s.byText('#szbar button', '800x600'); await s.click(g.x, g.y); await s.hold(2000);
            await s.caption('Smaller: what goes out of its container or overlaps is marked in red');
            const box = async (i: number) => s.page.evaluate((k) => { const r = document.querySelectorAll('#szbar input')[k].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, i as never);
            const w = await box(0); await s.click(w.x, w.y);
            await s.page.keyboard.down('Control'); await s.page.keyboard.press('a'); await s.page.keyboard.up('Control');
            await s.page.keyboard.type('400', { delay: 80 }); await s.page.keyboard.press('Enter'); await s.settle(300);
            const h = await box(1); await s.click(h.x, h.y);
            await s.page.keyboard.down('Control'); await s.page.keyboard.press('a'); await s.page.keyboard.up('Control');
            await s.page.keyboard.type('300', { delay: 80 }); await s.page.keyboard.press('Enter'); await s.settle(300);
            await s.hold(2600);
        },
    },
    menus: {
        file: 'menus.gif', run: async s => {
            await s.caption('Popup and main menus: select one to see its preview');
            const p = await rowOf(s, 'popRow'); await s.click(p.x, p.y); await s.hold(1500);
            await s.caption('Add items, sub-items and separators; edit caption and shortcut');
            const a = await s.byText('#inspector button', 'Add item'); await s.click(a.x, a.y); await s.settle(300);
            await s.hold(700);
            const cap = await inputOf(s, 'Caption'); await s.click(cap.x, cap.y);
            await s.page.keyboard.down('Control'); await s.page.keyboard.press('a'); await s.page.keyboard.up('Control');
            await type(s, 'Save &as...');
            const sc = await inputOf(s, 'Shortcut'); await s.click(sc.x, sc.y);
            await type(s, 'Ctrl+Shift+S');
            await s.hold(900);
            await s.caption('The preview shows the menu as the user will see it');
            const back = await rowOf(s, 'popRow'); await s.click(back.x, back.y);
            await s.hold(2200);
        },
    },
};

async function main(): Promise<void> {
    const wanted = process.argv.slice(2);
    const studio = new Studio({ dfm: DFM, pas: PAS });
    await studio.open();
    for (const [key, sc] of Object.entries(SCENARIOS)) {
        if (wanted.length && !wanted.includes(key)) { continue; }
        await studio.reset();
        try {
            await sc.run(studio);
            if (sc.file.endsWith('.gif')) { console.log(sc.file, studio.frames.length + ' frames', Math.round(studio.saveGif(sc.file) / 1024) + ' KB'); } else { console.log(sc.file); }
        } catch (e) {
            console.log(key, 'FAILED:', e instanceof Error ? e.message : e);
            await studio.savePng('_failed-' + key + '.png');
        }
    }
    await studio.close();
}

void main();
