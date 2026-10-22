/** A picture of the designer on any form: `npx tsx tools/guide/shot.ts path/to/Form.dfm out.png [componentToSelect]`. */
import * as fs from 'fs';
import { Studio } from './lib';

async function main(): Promise<void> {
    const [dfmPath, out, select] = process.argv.slice(2);
    const dfm = fs.readFileSync(dfmPath, 'latin1');
    const pasPath = dfmPath.replace(/\.dfm$/i, '.pas');
    const s = new Studio({ dfm, pas: fs.existsSync(pasPath) ? fs.readFileSync(pasPath, 'latin1') : '' });
    await s.open();
    await s.page.select('#zoom', 'fit'); await s.settle(300);
    if (select) { await s.page.evaluate((n) => { (window as unknown as { __sel?: (n: string) => void }).__sel?.(n); }, select as never); }
    await s.settle(300);
    fs.writeFileSync(out, Buffer.from(await s.page.screenshot({ type: 'png' })));
    await s.close();
}

void main();
