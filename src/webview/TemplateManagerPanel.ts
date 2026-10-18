import * as vscode from 'vscode';
import { Template, TemplateParam } from '../models/Template';
import { TemplateStore, ScopedTemplate, TemplateScope } from '../services/TemplateStore';

interface FormState {
    originalName?: string;
    scope: TemplateScope;
    name: string;
    prefix: string;
    description: string;
    languages: string;
    body: string;
    params: TemplateParam[];
}

export class TemplateManagerPanel {
    public static readonly viewType = 'mmxTemplateManager';
    private static currentPanel: TemplateManagerPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _store: TemplateStore;
    private _disposables: vscode.Disposable[] = [];
    private _templates: ScopedTemplate[] = [];
    private _workspaceAvailable = false;

    public static async createOrShow(
        extensionUri: vscode.Uri,
        store: TemplateStore,
    ): Promise<void> {
        if (TemplateManagerPanel.currentPanel) {
            TemplateManagerPanel.currentPanel._panel.reveal(vscode.ViewColumn.Active);
            await TemplateManagerPanel.currentPanel.refresh();
            return;
        }
        const panel = vscode.window.createWebviewPanel(
            TemplateManagerPanel.viewType,
            'Templates',
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: false,
                localResourceRoots: [extensionUri],
            },
        );
        TemplateManagerPanel.currentPanel = new TemplateManagerPanel(panel, store);
        await TemplateManagerPanel.currentPanel.refresh();
    }

    private constructor(panel: vscode.WebviewPanel, store: TemplateStore) {
        this._panel = panel;
        this._store = store;

        this._panel.webview.html = this.getHtml();

        this._panel.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'save': {
                    try {
                        const tpl: Template = {
                            name: msg.template.name,
                            prefix: msg.template.prefix || undefined,
                            description: msg.template.description || undefined,
                            languages: msg.template.languages || undefined,
                            body: msg.template.body,
                            params: msg.template.params && msg.template.params.length > 0 ? msg.template.params : undefined,
                        };
                        await this._store.save(msg.scope as TemplateScope, msg.originalName, tpl);
                        await this.refresh();
                        this.post({ command: 'saveResult', ok: true });
                        this.post({ command: 'notify', message: 'Template "' + tpl.name + '" saved (' + msg.scope + ').' });
                    } catch (e) {
                        this.post({ command: 'saveResult', ok: false, message: 'Save failed: ' + (e instanceof Error ? e.message : String(e)) });
                    }
                    break;
                }
                case 'delete': {
                    const confirm = await vscode.window.showWarningMessage(
                        'Delete template "' + msg.name + '" (' + msg.scope + ')?',
                        { modal: true },
                        'Delete',
                    );
                    if (confirm !== 'Delete') break;
                    await this._store.remove(msg.scope as TemplateScope, msg.name);
                    await this.refresh();
                    this.post({ command: 'notify', message: 'Template "' + msg.name + '" deleted.' });
                    break;
                }
                case 'insert': {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        this.post({ command: 'notify', message: 'Open a file to insert into.' });
                        break;
                    }
                    await editor.insertSnippet(new vscode.SnippetString(msg.body));
                    this.post({ command: 'notify', message: 'Inserted at cursor.' });
                    break;
                }
            }
        });

        this._panel.onDidDispose(() => {
            TemplateManagerPanel.currentPanel = undefined;
            this._disposables.forEach(d => d.dispose());
            this._disposables = [];
        });
    }

    private async refresh(): Promise<void> {
        this._templates = await this._store.readAll();
        this._workspaceAvailable = this._store.workspaceAvailable;
        this.post({
            command: 'init',
            templates: this._templates.map(t => ({
                name: t.name,
                prefix: t.prefix || '',
                description: t.description || '',
                languages: (t.languages || []).join(', '),
                body: t.body,
                scope: t.scope,
                params: t.params || [],
            })),
            workspaceAvailable: this._workspaceAvailable,
        });
    }

    private post(msg: unknown): void {
        this._panel.webview.postMessage(msg);
    }

    private getHtml(): string {
        const nonce = getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 14px; }
h2 { font-size: 15px; margin-bottom: 10px; }
.toolbar { margin-bottom: 10px; display: flex; gap: 8px; align-items: center; }
input, select, textarea { width: 100%; padding: 5px 7px; border: 1px solid var(--vscode-input-border, #ccc); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 3px; font-family: inherit; font-size: inherit; }
textarea { font-family: var(--vscode-editor-font-family, Consolas, monospace); min-height: 120px; resize: vertical; }
label { display: block; margin: 8px 0 3px; font-weight: 500; font-size: 12px; }
.row { display: flex; gap: 10px; } .row > div { flex: 1; }
.btn { padding: 5px 12px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500; }
.btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
.btn-danger { background: #d32f2f; color: #fff; }
.btn-small { padding: 2px 8px; font-size: 11px; }
.list { border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); border-radius: 3px; }
.list-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-bottom: 1px solid var(--vscode-input-border, rgba(128,128,128,0.2)); }
.list-item:last-child { border-bottom: none; }
.list-item .nm { font-weight: 600; }
.list-item .px { color: var(--vscode-descriptionForeground); font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; }
.list-item .sc { font-size: 10px; padding: 1px 5px; border-radius: 8px; background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.15)); color: var(--vscode-descriptionForeground); }
.list-item .sp { flex: 1; }
.list-item .actions { display: flex; gap: 4px; }
.empty { color: var(--vscode-descriptionForeground); font-style: italic; padding: 10px; text-align: center; }
#form { display: none; margin-top: 6px; }
.params-row { display: flex; gap: 6px; align-items: center; margin-bottom: 4px; }
.params-row input { flex: 1; }
.params-row button { flex: 0 0 auto; }
.params-tools { display: flex; gap: 6px; margin-bottom: 6px; }
.actions-bar { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
.preview { background: var(--vscode-textCodeBlock-background, #1e1e1e); border: 1px solid var(--vscode-input-border, #ccc); border-radius: 3px; padding: 10px; font-family: var(--vscode-editor-font-family, Consolas, monospace); white-space: pre-wrap; margin-top: 4px; max-height: 180px; overflow: auto; }
#notify { color: var(--vscode-descriptionForeground); font-size: 11px; min-height: 16px; margin-top: 10px; }
</style>
</head>
<body>
<h2>Templates</h2>
<div id="manager">
  <div class="toolbar">
    <button class="btn btn-primary" id="btnNew">+ New Template</button>
    <span style="flex:1"></span>
    <span id="count" style="color:var(--vscode-descriptionForeground);font-size:11px;"></span>
  </div>
  <div class="list" id="list"></div>
</div>

<div id="form">
  <h2 id="formTitle">New Template</h2>
  <div class="row">
    <div><label for="f_name">Name *</label><input id="f_name" placeholder="Reverse for loop"></div>
    <div><label for="f_prefix">Prefix</label><input id="f_prefix" placeholder="forr"></div>
  </div>
  <div class="row">
    <div><label for="f_description">Description</label><input id="f_description" placeholder="for i = len-1 downto 0"></div>
    <div><label for="f_scope">Scope</label><select id="f_scope"><option value="workspace">workspace</option><option value="global">global</option></select></div>
  </div>
  <label for="f_languages">Languages (comma-separated languageIds, empty = all)</label>
  <input id="f_languages" placeholder="pascal, typescript, cpp">

  <label>Parameters (snippet placeholders)</label>
  <div class="params-tools">
    <button type="button" class="btn btn-secondary btn-small" id="btnAddParam">+ Add Parameter</button>
    <button type="button" class="btn btn-secondary btn-small" id="btnInsertCursor">Insert final cursor ($0)</button>
  </div>
  <div id="paramsContainer"></div>

  <label for="f_body">Body (VS Code snippet syntax: \${1:label}, \$0, ...)</label>
  <textarea id="f_body" placeholder="for (let \${1:i} = 0; \${1} < \${2:arr}.length; \${1}++) {&#10;\t\$0&#10;}"></textarea>

  <label>Preview</label>
  <div class="preview" id="preview"></div>

  <div class="actions-bar">
    <button class="btn btn-secondary" id="btnCancel">Cancel</button>
    <button class="btn btn-primary" id="btnSave">Save</button>
  </div>
</div>

<div id="notify"></div>

<script nonce="${nonce}">
(function() {
  var vscodeApi = acquireVsCodeApi();
  var state = { templates: [], workspaceAvailable: false, editing: null };
  var paramCounter = 0;

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function notify(msg){ var n=$('notify'); if(n){ n.textContent=msg; } }

  function renderList(){
    var list=$('list'); var count=$('count');
    if(!list) return;
    list.innerHTML='';
    if(count){ count.textContent=state.templates.length+' template(s)'; }
    if(state.templates.length===0){
      list.innerHTML='<div class="empty">No templates yet. Click "+ New Template".</div>';
      return;
    }
    state.templates.forEach(function(t){
      var item=document.createElement('div'); item.className='list-item';
      var sp=document.createElement('div'); sp.className='sp';
      var nm=document.createElement('span'); nm.className='nm'; nm.textContent=t.name; sp.appendChild(nm);
      if(t.prefix){ var px=document.createElement('span'); px.className='px'; px.textContent='('+t.prefix+')'; sp.appendChild(px); }
      if(t.languages){ var lg=document.createElement('span'); lg.className='px'; lg.textContent='['+t.languages+']'; sp.appendChild(lg); }
      if(t.description){ var ds=document.createElement('span'); ds.className='px'; ds.textContent='— '+t.description; sp.appendChild(ds); }
      item.appendChild(sp);
      var sc=document.createElement('span'); sc.className='sc'; sc.textContent=t.scope; item.appendChild(sc);
      var actions=document.createElement('div'); actions.className='actions';
      var ins=document.createElement('button'); ins.className='btn btn-secondary btn-small'; ins.textContent='Insert'; ins.title='Insert at cursor';
      ins.addEventListener('click', function(){ vscodeApi.postMessage({command:'insert', body:t.body}); });
      actions.appendChild(ins);
      var ed=document.createElement('button'); ed.className='btn btn-secondary btn-small'; ed.textContent='Edit';
      ed.addEventListener('click', function(){ showForm(t); });
      actions.appendChild(ed);
      var del=document.createElement('button'); del.className='btn btn-danger btn-small'; del.textContent='Delete';
      del.addEventListener('click', function(){ vscodeApi.postMessage({command:'delete', name:t.name, scope:t.scope}); });
      actions.appendChild(del);
      item.appendChild(actions);
      list.appendChild(item);
    });
  }

  function showManager(){ $('manager').style.display='block'; $('form').style.display='none'; state.editing=null; }
  function showForm(t){
    state.editing = t ? { originalName: t.name, scope: t.scope } : null;
    $('manager').style.display='none'; $('form').style.display='block';
    $('formTitle').textContent = t ? 'Edit Template' : 'New Template';
    $('f_name').value = t ? t.name : '';
    $('f_prefix').value = t ? (t.prefix||'') : '';
    $('f_description').value = t ? (t.description||'') : '';
    $('f_languages').value = t ? (t.languages||'') : '';
    $('f_body').value = t ? t.body : '';
    var scopeSel=$('f_scope');
    if(!state.workspaceAvailable){
      scopeSel.innerHTML='<option value="global">global</option>';
    } else {
      scopeSel.innerHTML='<option value="workspace">workspace</option><option value="global">global</option>';
    }
    scopeSel.value = t ? t.scope : (state.workspaceAvailable ? 'workspace' : 'global');
    rebuildParams(t ? (t.params||[]) : []);
    updatePreview();
    $('f_name').focus();
  }

  function rebuildParams(params){
    var c=$('paramsContainer'); c.innerHTML=''; paramCounter=0;
    params.forEach(function(p){ addParamRow(p.placeholder); });
  }

  function addParamRow(placeholder){
    paramCounter++;
    var row=document.createElement('div'); row.className='params-row';
    var idx=paramCounter;
    var inp=document.createElement('input'); inp.type='text'; inp.className='param-input';
    inp.placeholder='placeholder (e.g. i, arr.length)';
    inp.value=placeholder||'';
    inp.addEventListener('input', function(){ updatePreview(); });
    row.appendChild(inp);
    var insBtn=document.createElement('button'); insBtn.type='button'; insBtn.className='btn btn-secondary btn-small'; insBtn.textContent='\\u2193 insert';
    insBtn.title='Insert $'+idx+':placeholder into body';
    insBtn.addEventListener('click', function(){
      var label = inp.value.trim() || ('param' + idx);
      insertIntoBody('\${' + idx + ':' + label + '}');
    });
    row.appendChild(insBtn);
    var rm=document.createElement('button'); rm.type='button'; rm.className='btn btn-danger btn-small'; rm.textContent='x';
    rm.addEventListener('click', function(){ row.remove(); renumberParams(); updatePreview(); });
    row.appendChild(rm);
    $('paramsContainer').appendChild(row);
    inp.addEventListener('focus', function(){ /* keep idx */ });
  }

  function renumberParams(){
    var rows=document.querySelectorAll('#paramsContainer .params-row');
    paramCounter=0;
    rows.forEach(function(row){
      paramCounter++;
      var btn=row.querySelectorAll('button')[0];
      var inp=row.querySelector('.param-input');
      var idx=paramCounter;
      btn.onclick=null;
      btn.addEventListener('click', function(){
        var label = inp.value.trim() || ('param'+idx);
        insertIntoBody('\${'+idx+':'+label+'}');
      });
    });
  }

  function insertIntoBody(text){
    var ta=$('f_body');
    var start=ta.selectionStart, end=ta.selectionEnd;
    ta.value = ta.value.substring(0,start)+text+ta.value.substring(end);
    ta.selectionStart=ta.selectionEnd=start+text.length;
    ta.focus();
    updatePreview();
  }

  function gatherParams(){
    var rows=document.querySelectorAll('#paramsContainer .params-row');
    var out=[];
    rows.forEach(function(row){
      var v=row.querySelector('.param-input').value.trim();
      if(v) out.push({placeholder:v});
    });
    return out;
  }

  function updatePreview(){
    var p=$('preview'); if(p){ p.textContent = $('f_body').value || '(empty)'; }
  }

  function gatherForm(){
    return {
      originalName: state.editing ? state.editing.originalName : null,
      scope: $('f_scope').value,
      template: {
        name: $('f_name').value.trim(),
        prefix: $('f_prefix').value.trim(),
        description: $('f_description').value.trim(),
        languages: $('f_languages').value.split(',').map(function(s){return s.trim();}).filter(Boolean),
        body: $('f_body').value,
        params: gatherParams()
      }
    };
  }

  function save(){
    var data=gatherForm();
    if(!data.template.name){ notify('Name is required.'); return; }
    vscodeApi.postMessage({command:'save', originalName:data.originalName, scope:data.scope, template:data.template});
  }

  // wiring
  $('btnNew').addEventListener('click', function(){ showForm(null); });
  $('btnCancel').addEventListener('click', showManager);
  $('btnSave').addEventListener('click', save);
  $('btnAddParam').addEventListener('click', function(){ addParamRow(''); });
  $('btnInsertCursor').addEventListener('click', function(){ insertIntoBody('$0'); });
  $('f_body').addEventListener('input', updatePreview);

  window.addEventListener('message', function(event){
    var msg=event.data;
    if(msg.command==='init'){
      state.templates=msg.templates||[];
      state.workspaceAvailable=!!msg.workspaceAvailable;
      renderList();
      notify('');
    } else if(msg.command==='notify'){
      notify(msg.message||'');
    } else if(msg.command==='saveResult'){
      if(msg.ok){ showManager(); notify(''); }
      else { notify(msg.message||'Save failed.'); }
    }
  });
})();
</script>
</body>
</html>`;
    }
}

function getNonce(): string {
    let result = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
