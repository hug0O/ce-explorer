/**
 * Sidebar "Tools" section shared by the Member view's pages: align the
 * selection on a string, and drop a component on the active Delphi form
 * (any class, in any container, placed against an existing control).
 *
 * The markup is static; the Delphi part is filled from the extension through
 * `formModel` / `suggestedName` messages (see MemberViewerPanel).
 */

function escapeAttr(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const DEFAULT_ALIGN_CHIPS = [':=', ':', '=', '=>', '//', ','];

/** Keeps user-supplied align strings sane: trimmed, 1-24 chars, unique, at most 40. */
export function sanitizeChips(value: unknown): string[] {
    if (!Array.isArray(value)) { return [...DEFAULT_ALIGN_CHIPS]; }
    const out: string[] = [];
    for (const v of value) {
        if (typeof v !== 'string') { continue; }
        const t = v.trim();
        if (t.length >= 1 && t.length <= 24 && !out.includes(t)) { out.push(t); }
        if (out.length >= 40) { break; }
    }
    return out;
}

export function toolsCss(): string {
    return `
.tool-row { display: flex; gap: 4px; margin-bottom: 4px; }
.tool-row.wrap { flex-wrap: wrap; }
.inp { flex: 1; min-width: 0; padding: 3px 6px; font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 3px; }
.inp:focus { outline: 1px solid var(--vscode-focusBorder, #007fd4); }
.chips { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px; }
.chip { padding: 1px 8px; font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4)); border-radius: 10px; background: transparent; color: var(--vscode-foreground); cursor: pointer; }
.chip.add { border-style: dashed; }
.chip .x { margin-left: 4px; opacity: 0.5; }
.chip .x:hover { opacity: 1; color: var(--vscode-errorForeground, #f48771); }
.chip:hover { background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.2)); }
.tool-label { font-size: 11px; color: var(--vscode-descriptionForeground); margin: 6px 0 2px; }
.tool-select { width: 100%; padding: 3px 4px; font-size: 12px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border, rgba(128,128,128,0.4)); border-radius: 3px; }
.tool-note { font-size: 11px; color: var(--vscode-descriptionForeground); font-style: italic; margin: 4px 0; }
.tool-primary { width: 100%; margin-top: 8px; padding: 5px 8px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-family: inherit; background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.tool-primary:hover { background: var(--vscode-button-hoverBackground); }
.tools-block { margin-bottom: 14px; }
`;
}

export function toolsHtml(alignToken: string, chipList: string[] = DEFAULT_ALIGN_CHIPS): string {
    const chipsJson = escapeAttr(JSON.stringify(chipList));
    return `
<div class="tools-block">
<div class="section-title">Align selection</div>
<div class="tool-row">
<input id="alignToken" class="inp" value="${escapeAttr(alignToken)}" placeholder="text to align on, e.g. :=" spellcheck="false">
<button id="alignGo" class="ana" style="width:auto">Align</button>
</div>
<div class="chips" id="chips" data-chips="${chipsJson}"></div>
<div class="tool-note">Click a string to use it, <b>+</b> saves the one typed above, <b>×</b> removes it. Select the lines in the editor, then click Align. Without a selection, the block of lines around the cursor is aligned.</div>
</div>

<div class="tools-block" id="dForm">
<div class="section-title">Delphi component</div>
<div class="tool-note" id="dMsg">Loading form…</div>
<div id="dFields" style="display:none">
<div class="tool-label">Class (pick or type any class)</div>
<input id="dClass" class="inp" list="dClasses" value="TButton" spellcheck="false" style="width:100%">
<datalist id="dClasses"></datalist>
<div class="tool-note" id="dHint"></div>
<div class="tool-label">Unit for uses <span class="hint">(optional)</span></div>
<input id="dUnit" class="inp" placeholder="auto" spellcheck="false" style="width:100%">
<div class="tool-label">Name</div>
<input id="dName" class="inp" spellcheck="false" style="width:100%">
<div class="tool-label">Event to implement <span class="hint">(empty = field only)</span></div>
<input id="dEvent" class="inp" list="dEvents" value="OnClick" spellcheck="false" style="width:100%">
<datalist id="dEvents"></datalist>
<div class="tool-label">Place inside</div>
<select id="dParent" class="tool-select"></select>
<div class="tool-label">Relative to</div>
<select id="dRef" class="tool-select"></select>
<div class="tool-label">Side, and gap in px</div>
<div class="tool-row"><select id="dSide" class="tool-select" style="flex:1">
<option value="right">right of</option>
<option value="below">below</option>
<option value="left">left of</option>
<option value="above">above</option>
</select>
<input id="dGap" class="inp" type="number" min="0" max="500" value="8" style="max-width:64px" title="Space between the new component and its reference"></div>
<button id="dAdd" class="tool-primary">Add to form</button>
</div>
<div id="sFields" style="display:none">
<div class="section-title" style="margin-top:14px">Spacing between components</div>
<div class="tool-label">Gap between a component and the next one…</div>
<select id="sComp" class="tool-select"></select>
<div class="tool-row" style="margin-top:4px">
<select id="sDir" class="tool-select" style="flex:1"><option value="right">to its right</option><option value="below">below it</option><option value="left">to its left</option><option value="above">above it</option></select>
<input id="sGap" class="inp" type="number" min="-50" max="500" value="8" style="max-width:64px" title="Pixels, edge to edge">
</div>
<label class="tool-note"><input type="checkbox" id="sCascade" checked> move the components that follow too</label>
<button id="sApply" class="tool-primary">Set gap</button>
<div class="tool-label" style="margin-top:10px">Distribute a whole container</div>
<select id="sCont" class="tool-select"></select>
<div class="tool-row" style="margin-top:4px">
<input id="sH" class="inp" type="number" min="-50" max="500" value="8" title="Horizontal gap (px)">
<input id="sV" class="inp" type="number" min="-50" max="500" value="8" title="Vertical gap (px)">
</div>
<div class="tool-note">Horizontal / vertical gaps. Rows are detected automatically and columns are aligned across rows.</div>
<button id="sDist" class="tool-primary">Distribute</button>
</div>
<div id="eFields" style="display:none">
<div class="section-title" style="margin-top:14px">Event on an existing component</div>
<div class="tool-label">Component</div>
<select id="eComp" class="tool-select"></select>
<div class="tool-label">Event <span class="hint">(pick or type)</span></div>
<input id="eEvent" class="inp" list="eEvents" spellcheck="false" style="width:100%">
<datalist id="eEvents"></datalist>
<div class="tool-note" id="eNote"></div>
<button id="eAdd" class="tool-primary">Create / open handler</button>
</div>
</div>
`;
}

/**
 * JS defining `initTools(api)`; each page calls it once with its
 * `acquireVsCodeApi()` result (the API can only be acquired once per page).
 */
export function toolsScript(): string {
    return `
function initTools(api) {
    function $(id) { return document.getElementById(id); }
    var tok = $('alignToken');
    if (tok) {
        var chipBox = $('chips');
        var chips = [];
        try { chips = JSON.parse(chipBox.getAttribute('data-chips') || '[]'); } catch (err) { chips = []; }
        function saveChips() { api.postMessage({ command: 'saveAlignChips', chips: chips }); renderChips(); }
        function renderChips() {
            while (chipBox.firstChild) { chipBox.removeChild(chipBox.firstChild); }
            chips.forEach(function (t, i) {
                var b = document.createElement('button');
                b.className = 'chip';
                b.title = 'Use ' + t;
                b.appendChild(document.createTextNode(t));
                var x = document.createElement('span');
                x.className = 'x';
                x.title = 'Remove';
                x.textContent = '\u00d7';
                x.addEventListener('click', function (ev) { ev.stopPropagation(); chips.splice(i, 1); saveChips(); });
                b.appendChild(x);
                b.addEventListener('click', function () { tok.value = t; tok.focus(); });
                chipBox.appendChild(b);
            });
            var add = document.createElement('button');
            add.className = 'chip add';
            add.title = 'Save the typed string as a shortcut';
            add.textContent = '+';
            add.addEventListener('click', function () {
                var v = tok.value.trim();
                if (v && v.length <= 24 && chips.indexOf(v) < 0 && chips.length < 40) { chips.push(v); saveChips(); }
            });
            chipBox.appendChild(add);
        }
        renderChips();
        $('alignGo').addEventListener('click', function () { api.postMessage({ command: 'alignSelection', token: tok.value }); });
        tok.addEventListener('keydown', function (e) { if (e.key === 'Enter') { $('alignGo').click(); } });
    }
    if (!$('dForm')) { return; }

    var model = null;
    var nameTouched = false;
    var knownClass = {};

    function option(value, text) { var o = document.createElement('option'); o.value = value; o.textContent = text; return o; }
    function clear(el) { while (el.firstChild) { el.removeChild(el.firstChild); } }

    function fillRef() {
        var ref = $('dRef');
        clear(ref);
        ref.appendChild(option('', 'automatic (below the others)'));
        var parent = $('dParent').value;
        (model.containers || []).forEach(function (c) {
            if (c.name === parent) { c.children.forEach(function (k) { ref.appendChild(option(k.name, k.label)); }); }
        });
        $('dSide').disabled = true;
    }

    function onClassChange() {
        var cls = $('dClass').value.trim();
        var info = knownClass[cls.toLowerCase()];
        $('dUnit').placeholder = info ? info.unit + ' (auto)' : 'auto';
        var events = $('dEvents');
        clear(events);
        var list = info ? info.events : ['OnClick', 'OnChange'];
        list.forEach(function (n) { events.appendChild(option(n, '')); });
        $('dEvent').value = list.length ? list[0] : '';
        if (cls) { api.postMessage({ command: 'suggestName', className: cls }); api.postMessage({ command: 'classInfo', className: cls }); }
    }

    function currentComp() {
        var name = $('eComp').value;
        var found = null;
        (model.components || []).forEach(function (c) { if (c.name === name) { found = c; } });
        return found;
    }

    function onEventInput() {
        var c = currentComp();
        var ev = $('eEvent').value.trim();
        var handler = c && c.wired ? c.wired[ev] : '';
        $('eNote').textContent = handler ? ev + ' is already wired to ' + handler + ' - the button opens it.' : '';
    }

    function onCompChange() {
        var c = currentComp();
        var list = $('eEvents');
        clear(list);
        var events = c ? c.events : [];
        events.forEach(function (n) { list.appendChild(option(n, c.wired && c.wired[n] ? '-> ' + c.wired[n] : '')); });
        var firstFree = '';
        events.forEach(function (n) { if (!firstFree && !(c.wired && c.wired[n])) { firstFree = n; } });
        $('eEvent').value = firstFree || (events.length ? events[0] : '');
        onEventInput();
    }

    function fillComponents() {
        var sel = $('eComp');
        var keep = sel.value;
        clear(sel);
        (model.components || []).forEach(function (c) { sel.appendChild(option(c.name, c.label)); });
        if (keep) { sel.value = keep; }
        onCompChange();
    }

    function fillSpacing() {
        var comp = $('sComp');
        var keep = comp.value;
        clear(comp);
        (model.components || []).forEach(function (c) { if (c.name !== model.formName) { comp.appendChild(option(c.name, c.label)); } });
        if (keep) { comp.value = keep; }
        var cont = $('sCont');
        var keepC = cont.value;
        clear(cont);
        (model.containers || []).forEach(function (c) { cont.appendChild(option(c.name, c.label)); });
        if (keepC) { cont.value = keepC; }
    }

    function showClassInfo(info) {
        if ($('dClass').value.trim().toLowerCase() !== String(info.className).toLowerCase()) { return; }
        var notes = {
            catalog: '',
            setting: 'Defined in your mmx.delphi.customComponents setting.',
            project: 'Third-party class learned from the .dfm files of your project.',
            generic: 'Unknown class: generic 75x25 control. Type its unit below (remembered next time) or describe it in mmx.delphi.customComponents.'
        };
        $('dHint').textContent = notes[info.source] || '';
        $('dUnit').placeholder = info.unit ? info.unit + ' (auto)' : 'auto';
        var events = $('dEvents');
        clear(events);
        info.events.forEach(function (n) { events.appendChild(option(n, '')); });
        if (info.events.length && info.events.indexOf($('dEvent').value) < 0) { $('dEvent').value = info.events[0]; }
    }

    function fillModel() {
        if (!model || !model.ok) {
            $('dMsg').textContent = (model && model.reason) || 'No Delphi form here.';
            $('dFields').style.display = 'none';
            $('eFields').style.display = 'none';
            $('sFields').style.display = 'none';
            return;
        }
        $('dMsg').textContent = 'Form ' + model.formName;
        $('dFields').style.display = 'block';
        $('eFields').style.display = 'block';
        $('sFields').style.display = 'block';
        fillComponents();
        fillSpacing();
        var classes = $('dClasses');
        clear(classes);
        model.classes.forEach(function (c) {
            knownClass[c.className.toLowerCase()] = c;
            classes.appendChild(option(c.className, c.unit));
        });
        var parent = $('dParent');
        clear(parent);
        model.containers.forEach(function (c) { parent.appendChild(option(c.name, c.label)); });
        fillRef();
        onClassChange();
    }

    window.addEventListener('message', function (e) {
        var m = e.data;
        if (!m) { return; }
        if (m.command === 'formModel') { model = m.model; fillModel(); }
        else if (m.command === 'suggestedName' && !nameTouched) { $('dName').value = m.name; }
        else if (m.command === 'classInfo') { showClassInfo(m.info); }
    });

    $('dClass').addEventListener('change', function () { nameTouched = false; onClassChange(); });
    $('dName').addEventListener('input', function () { nameTouched = true; });
    $('dParent').addEventListener('change', fillRef);
    $('sApply').addEventListener('click', function () {
        api.postMessage({ command: 'setSpacing', componentName: $('sComp').value, direction: $('sDir').value, gap: Number($('sGap').value), cascade: $('sCascade').checked });
    });
    $('sDist').addEventListener('click', function () {
        api.postMessage({ command: 'distribute', containerName: $('sCont').value, horizontal: Number($('sH').value), vertical: Number($('sV').value) });
    });
    $('eComp').addEventListener('change', onCompChange);
    $('eEvent').addEventListener('input', onEventInput);
    $('eAdd').addEventListener('click', function () {
        api.postMessage({ command: 'addEvent', componentName: $('eComp').value, eventName: $('eEvent').value.trim() });
    });
    $('dRef').addEventListener('change', function () { $('dSide').disabled = !$('dRef').value; });
    $('dAdd').addEventListener('click', function () {
        api.postMessage({
            command: 'addComponent',
            req: {
                className: $('dClass').value.trim(),
                unit: $('dUnit').value.trim(),
                name: $('dName').value.trim(),
                eventName: $('dEvent').value.trim(),
                parentName: $('dParent').value,
                refName: $('dRef').value,
                side: $('dRef').value ? $('dSide').value : 'auto',
                gap: Number($('dGap').value)
            }
        });
        nameTouched = false;
    });

    api.postMessage({ command: 'toolsReady' });
}
`;
}
