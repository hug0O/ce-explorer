const fs = require('fs');
function patch(p, a, b) {
    let s = fs.readFileSync(p, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
    if (!s.includes(a)) throw new Error('missing ' + p + ': ' + a.slice(0, 70));
    s = s.replace(a, () => b); if (crlf) s = s.replace(/\n/g, '\r\n'); fs.writeFileSync(p, s);
}
const f = 'src/services/DelphiForm.ts';
patch(f, "    /** Unit (without Vcl. prefix) that declares the class. */\n    unit: string;", "    /** Unit (without Vcl. prefix) that declares the class. */\n    unit: string;\n    /** Further units the IDE adds to `uses` when dropping the component (third-party families need several). */\n    extraUnits?: string[];");
patch(f, "export function handlerName(componentName: string, eventName: string): string {\n    return componentName + eventName.replace(/^On/, '');\n}",
    "/** An event property: `OnClick`, or a nested one such as DevExpress `Properties.OnChange`. */\nexport const EVENT_PROP_RE = /^(?:[A-Za-z]\\w*\\.)?On[A-Z]\\w*$/;\n\n/** `Button1` + `OnClick` → `Button1Click`; `cxTextEdit1` + `Properties.OnChange` → `cxTextEdit1PropertiesChange`. */\nexport function handlerName(componentName: string, eventName: string): string {\n    return componentName + eventName.replace(/\\.On/, '.').replace(/^On/, '').replace(/\\./g, '');\n}");
patch(f, "import type { ", "import type { ");
patch(f, "    if (uses && uses.index !== undefined && opt.def.unit) {\n        const dotted = /\\bVcl\\./i.test(uses[1]) || !/\\bForms\\b/i.test(uses[1]);\n        // Only the VCL's own units take the Vcl. scope; third-party units keep their name.\n        const unitName = (dotted && VCL_UNITS.has(opt.def.unit.toLowerCase()) ? 'Vcl.' : '') + opt.def.unit;\n        const present = new RegExp('\\\\b(?:Vcl\\\\.)?' + opt.def.unit.replace(/\\./g, '\\\\.') + '\\\\b', 'i').test(uses[1]);\n        if (!present) {\n            const semicolon = uses.index + uses[0].length - 1;\n            const before = pas.slice(0, semicolon).replace(/\\s+$/, '');\n            edits.push({ offset: before.length, text: `, ${unitName}` });\n        }\n    }\n",
    "    if (uses && uses.index !== undefined && opt.def.unit) {\n        // The class's own unit plus the ones the IDE would add; only VCL units take the Vcl. scope.\n        const wanted = [opt.def.unit, ...(opt.def.extraUnits ?? [])];\n        const add = usesEdits(pas, wanted);\n        edits.push(...add);\n    }\n");
