/** Serves the guide page on http://localhost:47124 to look at it in a browser: `npx tsx tools/guide/preview.ts`. */
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { guidePageHtml } from '../../src/webview/guideContent';
import { changelogCss, changelogHtml, parseChangelog } from '../../src/webview/changelogSection';

const media = path.resolve(__dirname, '..', '..', 'media', 'guide');
const md = fs.readFileSync(path.resolve(__dirname, '..', '..', 'CHANGELOG.md'), 'utf8');
http.createServer((req, res) => {
    const url = req.url ?? '/';
    if (url.startsWith('/media/')) { res.setHeader('content-type', url.endsWith('.gif') ? 'image/gif' : 'image/png'); res.end(fs.readFileSync(path.join(media, path.basename(url)))); return; }
    res.setHeader('content-type', 'text/html');
    if (url.startsWith('/sidebar')) {
        res.end('<body style="width:300px;background:#252526;color:#ccc;font:13px Segoe UI"><style>' + changelogCss() + ':root{--vscode-descriptionForeground:#9d9d9d;--vscode-foreground:#ccc}</style>' + changelogHtml(parseChangelog(md), '0.1.16').replace('<details class="clog" id="changelog">', '<details class="clog" id="changelog" open>'));
        return;
    }
    res.end(guidePageHtml({ nonce: 'N', cspSource: 'http://localhost:47124', media: f => '/media/' + f, topic: url.slice(1) }).replace(/nonce="N"/g, '').replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '').replace('<style >', '<style>:root{--vscode-editor-background:#1e1e1e;--vscode-foreground:#ccc;--vscode-descriptionForeground:#9d9d9d;--vscode-badge-background:#4d4d4d;--vscode-badge-foreground:#fff}</style><style>'));
}).listen(47124);
