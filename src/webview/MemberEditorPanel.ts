import * as vscode from 'vscode';
import {
    MemberSpec, FieldSpec, PropertySpec, MemberKind, Visibility, Parameter,
    ClassInfo, ClassMember, AnyMemberSpec,
} from '../models/types';
import { ILanguageProvider } from '../providers/ILanguageProvider';
import { CodeGeneratorService } from '../services/CodeGeneratorService';

interface MemberFormResult {
    kind: MemberKind;
    name: string;
    returnType?: string;
    type?: string;
    visibility: Visibility;
    parameters: Parameter[];
    isStatic: boolean;
    isVirtual: boolean;
    isAbstract: boolean;
    isOverride: boolean;
    hasGetter: boolean;
    hasSetter: boolean;
    getterName?: string;
    setterName?: string;
    defaultValue?: string;
}

export class MemberEditorPanel {
    public static currentPanel: MemberEditorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private provider: ILanguageProvider;
    private classInfo: ClassInfo;
    private generatorService: CodeGeneratorService;
    private document: vscode.TextDocument;
    private resolveResult?: (result: MemberFormResult | undefined) => void;

    public static async create(
        context: vscode.ExtensionContext,
        document: vscode.TextDocument,
        provider: ILanguageProvider,
        classInfo: ClassInfo,
        generatorService: CodeGeneratorService,
        memberKind: MemberKind = MemberKind.Method,
        initialData?: ClassMember
    ): Promise<MemberFormResult | undefined> {
        if (MemberEditorPanel.currentPanel) {
            MemberEditorPanel.currentPanel._panel.dispose();
        }

        return new Promise<MemberFormResult | undefined>((resolve) => {
            const panel = vscode.window.createWebviewPanel(
                'mmxMemberEditor',
                initialData ? `Edit ${memberKind} in ${classInfo.name}` : `Add ${memberKind} to ${classInfo.name}`,
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: false,
                    localResourceRoots: [],
                }
            );

            const editor = new MemberEditorPanel(
                panel,
                context,
                document,
                provider,
                classInfo,
                generatorService,
                memberKind,
                resolve,
                initialData
            );
            MemberEditorPanel.currentPanel = editor;
        });
    }

    private constructor(
        panel: vscode.WebviewPanel,
        _context: vscode.ExtensionContext,
        document: vscode.TextDocument,
        provider: ILanguageProvider,
        classInfo: ClassInfo,
        generatorService: CodeGeneratorService,
        memberKind: MemberKind,
        resolveResult: (result: MemberFormResult | undefined) => void,
        private initialData?: ClassMember
    ) {
        this._panel = panel;
        this.provider = provider;
        this.classInfo = classInfo;
        this.generatorService = generatorService;
        this.document = document;
        this.resolveResult = resolveResult;

        this._panel.webview.html = this.getWebviewContent(memberKind);

        this._panel.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'submit':
                    await this.handleSubmit(msg.data);
                    break;
                case 'preview':
                    this.handlePreview(msg.data);
                    break;
                case 'cancel':
                    this.resolveResult?.(undefined);
                    this._panel.dispose();
                    break;
                case 'addParameter':
                    break;
            }
        });

        this._panel.onDidDispose(() => {
            this.resolveResult?.(undefined);
            MemberEditorPanel.currentPanel = undefined;
            this._disposables.forEach(d => d.dispose());
        });
    }

    private async handleSubmit(data: MemberFormResult): Promise<void> {
        if (!data.name || data.name.trim() === '') {
            vscode.window.showWarningMessage('Member name is required.');
            return;
        }
        this.resolveResult?.(data);
        this._panel.dispose();
    }

    private handlePreview(data: MemberFormResult): void {
        const typeDefaults = this.provider.getTypeDefaults();
        let preview = '';

        try {
            if (data.kind === MemberKind.Method || data.kind === MemberKind.Constructor || data.kind === MemberKind.Destructor) {
                const spec: MemberSpec = {
                    kind: data.kind,
                    name: data.name || 'unnamed',
                    returnType: data.returnType || undefined,
                    visibility: data.visibility,
                    parameters: data.parameters || [],
                    modifiers: [],
                    isStatic: data.isStatic,
                    isVirtual: data.isVirtual,
                    isAbstract: data.isAbstract,
                    isOverride: data.isOverride,
                    isFinal: false,
                };
                const gen = this.provider.generateMethod(this.classInfo.name, spec, this.classInfo);
                preview = gen.declaration || gen.implementation || '(no preview)';
            } else if (data.kind === MemberKind.Field) {
                const spec: FieldSpec = {
                    kind: MemberKind.Field,
                    name: data.name || 'unnamed',
                    type: data.type || data.returnType || typeDefaults.defaultFieldType,
                    visibility: data.visibility,
                };
                const gen = this.provider.generateField(this.classInfo.name, spec, this.classInfo);
                preview = gen.declaration || gen.implementation || '(no preview)';
            } else if (data.kind === MemberKind.Property) {
                const spec: PropertySpec = {
                    kind: MemberKind.Property,
                    name: data.name || 'unnamed',
                    type: data.type || data.returnType || typeDefaults.defaultPropertyType,
                    visibility: data.visibility,
                    hasGetter: data.hasGetter,
                    hasSetter: data.hasSetter,
                    getterName: data.getterName,
                    setterName: data.setterName,
                    isDefault: false,
                    isReadOnly: false,
                };
                const gen = this.provider.generateProperty(this.classInfo.name, spec, this.classInfo);
                preview = gen.declaration || gen.implementation || '(no preview)';
            }
        } catch (e) {
            preview = '(preview error: ' + (e instanceof Error ? e.message : String(e)) + ')';
        }

        this._panel.webview.postMessage({ command: 'updatePreview', preview });
    }

    private getWebviewContent(memberKind: MemberKind): string {
        const visibilities = this.provider.getVisibilityModifiers();
        const defaultVis = this.provider.getDefaultVisibility();
        const isPascal = this.provider.languageId === 'pascal';
        const typeDefaults = this.provider.getTypeDefaults();
        const kindLabel = memberKind === MemberKind.Constructor ? 'Constructor' :
            memberKind === MemberKind.Destructor ? 'Destructor' :
            memberKind === MemberKind.Field ? 'Field' :
            memberKind === MemberKind.Property ? 'Property' : 'Method';

        const showReturnType = memberKind === MemberKind.Method || memberKind === MemberKind.Property || memberKind === MemberKind.Field;
        const showParameters = memberKind === MemberKind.Method || memberKind === MemberKind.Constructor || memberKind === MemberKind.Destructor;
        const showModifiers = memberKind === MemberKind.Method || memberKind === MemberKind.Constructor || memberKind === MemberKind.Destructor;
        const showPropertyOptions = memberKind === MemberKind.Property;
        const className = this.classInfo.name;
        const parentClass = this.classInfo.parentClass || '';
        const displayName = this.provider.displayName;
        const nonce = getNonce();

        const visOptions = visibilities.map(v =>
            '<option value="' + v + '"' + (v === (this.initialData ? this.initialData.visibility : defaultVis) ? ' selected' : '') + '>' + v + '</option>'
        ).join('');

        const returnPlaceholder = memberKind === MemberKind.Property ? typeDefaults.defaultPropertyType : typeDefaults.defaultReturnType;
        const returnDefaultValue = this.initialData ? (this.initialData.returnType || this.initialData.type || '') : (memberKind === MemberKind.Property ? typeDefaults.defaultPropertyType : (isPascal ? '' : typeDefaults.defaultReturnType));
        const namePlaceholder = memberKind === MemberKind.Field ? 'FFieldName' : memberKind === MemberKind.Constructor ? 'Create' : 'MethodName';
        const paramTypePlaceholder = typeDefaults.defaultParamType;
        const fieldTypeDefault = typeDefaults.defaultFieldType;

        let html = '<!DOCTYPE html>\n';
        html += '<html lang="en">\n<head>\n';
        html += '<meta charset="UTF-8">\n';
        html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
        html += '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\' \'nonce-' + nonce + '\'; script-src \'unsafe-inline\' \'nonce-' + nonce + '\';">\n';
        html += '<title>' + (this.initialData ? 'Edit' : 'Add') + ' ' + kindLabel + '</title>\n';
        html += '<style nonce="' + nonce + '">\n';
        html += '* { box-sizing: border-box; margin: 0; padding: 0; }\n';
        html += 'body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px; }\n';
        html += 'h2 { margin-bottom: 12px; font-size: 16px; font-weight: 600; }\n';
        html += '.form-group { margin-bottom: 12px; }\n';
        html += 'label { display: block; margin-bottom: 4px; font-weight: 500; }\n';
        html += 'input, select { width: 100%; padding: 6px 8px; border: 1px solid var(--vscode-input-border, #ccc); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 3px; font-family: inherit; font-size: inherit; }\n';
        html += 'input:focus, select:focus { outline: 1px solid var(--vscode-focusBorder, #007fd4); }\n';
        html += '.row { display: flex; gap: 12px; }\n';
        html += '.row .form-group { flex: 1; }\n';
        html += '.checkbox-group { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }\n';
        html += '.checkbox-group label { display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; }\n';
        html += '.checkbox-group input[type="checkbox"] { width: auto; }\n';
        html += '.params-section { margin-bottom: 12px; }\n';
        html += '.params-section h3 { font-size: 13px; margin-bottom: 8px; font-weight: 600; }\n';
        html += '.param-row { display: flex; gap: 8px; margin-bottom: 6px; align-items: center; }\n';
        html += '.param-row input, .param-row select { flex: 1; padding: 4px 6px; }\n';
        html += '.param-row button { flex: 0 0 24px; padding: 2px 6px; cursor: pointer; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 3px; }\n';
        html += '.btn-add-param { margin-bottom: 8px; padding: 4px 12px; cursor: pointer; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 3px; font-size: 12px; }\n';
        html += '.preview-section { margin-top: 16px; }\n';
        html += '.preview-section h3 { font-size: 13px; margin-bottom: 8px; font-weight: 600; }\n';
        html += '.preview-box { background: var(--vscode-textCodeBlock-background, #1e1e1e); border: 1px solid var(--vscode-input-border, #ccc); border-radius: 3px; padding: 12px; font-family: var(--vscode-editor-font-family, Consolas, monospace); font-size: var(--vscode-editor-font-size, 13px); white-space: pre-wrap; max-height: 300px; overflow-y: auto; }\n';
        html += '.actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }\n';
        html += '.actions button { padding: 6px 16px; border: none; border-radius: 3px; cursor: pointer; font-size: 13px; font-weight: 500; }\n';
        html += '.btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }\n';
        html += '.btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }\n';
        html += '.class-info { margin-bottom: 16px; padding: 8px; background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.1)); border-radius: 3px; color: var(--vscode-descriptionForeground); }\n';
        html += '#debug { color: red; font-size: 11px; white-space: pre-wrap; display: none; margin-top: 8px; padding: 8px; border: 1px solid red; }\n';
        html += '</style>\n';
        html += '</head>\n<body>\n';

        html += '<h2>' + (this.initialData ? 'Edit' : 'Add') + ' ' + kindLabel + ' in <code>' + className + '</code></h2>\n';
        html += '<div class="class-info">Class: ' + className;
        if (parentClass) { html += ' extends ' + parentClass; }
        html += ' | Language: ' + displayName + '</div>\n';

        html += '<div class="row">\n';
        html += '<div class="form-group"><label for="name">Name</label>';
        html += '<input type="text" id="name" placeholder="' + namePlaceholder + '"' + (this.initialData ? ' value="' + this.initialData.name + '"' : '') + ' autofocus></div>\n';
        if (showReturnType) {
            html += '<div class="form-group"><label for="returnType">' + (memberKind === MemberKind.Property ? 'Property Type' : 'Return Type') + '</label>';
            html += '<input type="text" id="returnType" placeholder="' + returnPlaceholder + '" value="' + returnDefaultValue + '"></div>\n';
        }
        html += '</div>\n';

        html += '<div class="row"><div class="form-group"><label for="visibility">Visibility</label>';
        html += '<select id="visibility">' + visOptions + '</select></div></div>\n';

        if (showModifiers) {
            html += '<div class="checkbox-group">\n';
            html += '<label><input type="checkbox" id="isStatic"' + (this.initialData?.isStatic ? ' checked' : '') + '> ' + (isPascal ? 'Class' : 'Static') + '</label>\n';
            html += '<label><input type="checkbox" id="isVirtual"' + (this.initialData?.isVirtual ? ' checked' : '') + '> Virtual</label>\n';
            html += '<label><input type="checkbox" id="isAbstract"' + (this.initialData?.isAbstract ? ' checked' : '') + '> Abstract</label>\n';
            html += '<label><input type="checkbox" id="isOverride"' + (this.initialData?.isOverride ? ' checked' : '') + '> Override</label>\n';
            html += '</div>\n';
        }

        if (showPropertyOptions) {
            html += '<div class="checkbox-group">\n';
            html += '<label><input type="checkbox" id="hasGetter" checked> Has Getter</label>\n';
            html += '<label><input type="checkbox" id="hasSetter" checked> Has Setter</label>\n';
            html += '</div>\n';
        }

        if (showParameters) {
            html += '<div class="params-section">\n';
            html += '<h3>Parameters</h3>\n';
            html += '<div id="paramsContainer"></div>\n';
            html += '<button class="btn-add-param" id="btnAddParam">+ Add Parameter</button>\n';
            html += '</div>\n';
        }

        html += '<div class="preview-section"><h3>Preview</h3><div class="preview-box" id="preview">Fill in the form to see a preview...</div></div>\n';

        html += '<div class="actions">\n';
        html += '<button class="btn-secondary" id="btnCancel">Cancel</button>\n';
        html += '<button class="btn-secondary" id="btnPreview">Preview</button>\n';
        html += '<button class="btn-primary" id="btnCreate">' + (this.initialData ? 'Save' : 'Create') + '</button>\n';
        html += '</div>\n';

        html += '<div id="debug"></div>\n';

        html += '<script nonce="' + nonce + '">\n';
        html += '(function() {\n';
        html += '  try {\n';
        html += '    var vscodeApi = acquireVsCodeApi();\n';
        html += '    var paramCount = 0;\n';
        html += '    var memberKindVal = "' + memberKind + '";\n';
        html += '    var isPascalVal = ' + (isPascal ? 'true' : 'false') + ';\n';
        html += '    var previewTimer = null;\n';
        html += '\n';
        html += '    function dbg(msg) {\n';
        html += '      var el = document.getElementById("debug");\n';
        html += '      if (el) { el.style.display = "block"; el.textContent += msg + "\\n"; }\n';
        html += '    }\n';
        html += '\n';
        html += '    function addParameter() {\n';
        html += '      try {\n';
        html += '        paramCount++;\n';
        html += '        var container = document.getElementById("paramsContainer");\n';
        html += '        if (!container) { dbg("ERROR: paramsContainer not found"); return; }\n';
        html += '        var row = document.createElement("div");\n';
        html += '        row.className = "param-row";\n';
        html += '        row.setAttribute("data-pid", "p" + paramCount);\n';
        html += '\n';
        html += '        if (isPascalVal) {\n';
        html += '          var dirSel = document.createElement("select");\n';
        html += '          dirSel.className = "param-dir";\n';
        html += '          dirSel.style.flex = "0.5";\n';
        html += '          var dirs = ["", "const", "var", "out"];\n';
        html += '          for (var d = 0; d < dirs.length; d++) {\n';
        html += '            var opt = document.createElement("option");\n';
        html += '            opt.value = dirs[d];\n';
        html += '            opt.textContent = dirs[d] || "[in]";\n';
        html += '            dirSel.appendChild(opt);\n';
        html += '          }\n';
        html += '          row.appendChild(dirSel);\n';
        html += '        }\n';
        html += '\n';
        html += '        var nameInput = document.createElement("input");\n';
        html += '        nameInput.className = "param-name";\n';
        html += '        nameInput.type = "text";\n';
        html += '        nameInput.placeholder = "param" + paramCount;\n';
        html += '        row.appendChild(nameInput);\n';
        html += '\n';
        html += '        var typeInput = document.createElement("input");\n';
        html += '        typeInput.className = "param-type";\n';
        html += '        typeInput.type = "text";\n';
        html += '        typeInput.placeholder = isPascalVal ? "Integer" : "' + paramTypePlaceholder + '";\n';
        html += '        row.appendChild(typeInput);\n';
        html += '\n';
        html += '        var removeBtn = document.createElement("button");\n';
        html += '        removeBtn.textContent = "x";\n';
        html += '        removeBtn.setAttribute("data-pid", "p" + paramCount);\n';
        html += '        removeBtn.addEventListener("click", function() { row.remove(); schedulePreview(); });\n';
        html += '        row.appendChild(removeBtn);\n';
        html += '\n';
        html += '        nameInput.addEventListener("input", schedulePreview);\n';
        html += '        typeInput.addEventListener("input", schedulePreview);\n';
        html += '\n';
        html += '        container.appendChild(row);\n';
        html += '        schedulePreview();\n';
        html += '      } catch(e) { dbg("addParameter ERROR: " + e.message); }\n';
        html += '    }\n';
        html += '\n';
        html += '    function schedulePreview() {\n';
        html += '      if (previewTimer) clearTimeout(previewTimer);\n';
        html += '      previewTimer = setTimeout(updatePreview, 300);\n';
        html += '    }\n';
        html += '\n';
        html += '    function getFormData() {\n';
        html += '      var nameEl = document.getElementById("name");\n';
        html += '      var retEl = document.getElementById("returnType");\n';
        html += '      var visEl = document.getElementById("visibility");\n';
        html += '      var staticEl = document.getElementById("isStatic");\n';
        html += '      var virtualEl = document.getElementById("isVirtual");\n';
        html += '      var abstractEl = document.getElementById("isAbstract");\n';
        html += '      var overrideEl = document.getElementById("isOverride");\n';
        html += '      var getterEl = document.getElementById("hasGetter");\n';
        html += '      var setterEl = document.getElementById("hasSetter");\n';
        html += '\n';
        html += '      var data = {\n';
        html += '        kind: memberKindVal,\n';
        html += '        name: nameEl ? nameEl.value : "",\n';
        html += '        returnType: retEl ? retEl.value : "",\n';
        html += '        type: retEl ? retEl.value : "",\n';
        html += '        visibility: visEl ? visEl.value : "private",\n';
        html += '        parameters: [],\n';
        html += '        isStatic: staticEl ? staticEl.checked : false,\n';
        html += '        isVirtual: virtualEl ? virtualEl.checked : false,\n';
        html += '        isAbstract: abstractEl ? abstractEl.checked : false,\n';
        html += '        isOverride: overrideEl ? overrideEl.checked : false,\n';
        html += '        hasGetter: getterEl ? getterEl.checked : false,\n';
        html += '        hasSetter: setterEl ? setterEl.checked : false\n';
        html += '      };\n';
        html += '\n';
        html += '      var rows = document.querySelectorAll(".param-row");\n';
        html += '      for (var i = 0; i < rows.length; i++) {\n';
        html += '        var r = rows[i];\n';
        html += '        var nEl = r.querySelector(".param-name");\n';
        html += '        var tEl = r.querySelector(".param-type");\n';
        html += '        var dEl = r.querySelector(".param-dir");\n';
        html += '        if (nEl && tEl && nEl.value) {\n';
        html += '          data.parameters.push({\n';
        html += '            name: nEl.value,\n';
        html += '            type: tEl.value || (isPascalVal ? "Integer" : "' + paramTypePlaceholder + '"),\n';
        html += '            isConst: dEl ? dEl.value === "const" : false,\n';
        html += '            isVar: dEl ? dEl.value === "var" : false,\n';
        html += '            isOut: dEl ? dEl.value === "out" : false\n';
        html += '          });\n';
        html += '        }\n';
        html += '      }\n';
        html += '      return data;\n';
        html += '    }\n';
        html += '\n';
        html += '    function updatePreview() {\n';
        html += '      try {\n';
        html += '        vscodeApi.postMessage({ command: "preview", data: getFormData() });\n';
        html += '      } catch(e) { dbg("updatePreview ERROR: " + e.message); }\n';
        html += '    }\n';
        html += '\n';
        html += '    function submit() {\n';
        html += '      try {\n';
        html += '        dbg("submit clicked");\n';
        html += '        vscodeApi.postMessage({ command: "submit", data: getFormData() });\n';
        html += '      } catch(e) { dbg("submit ERROR: " + e.message); }\n';
        html += '    }\n';
        html += '\n';
        html += '    function cancel() {\n';
        html += '      vscodeApi.postMessage({ command: "cancel" });\n';
        html += '    }\n';
        html += '\n';
        html += '    function setupListeners() {\n';
        html += '      var el;\n';
        html += '      el = document.getElementById("btnAddParam");\n';
        html += '      if (el) { el.addEventListener("click", function() { dbg("addParam clicked"); addParameter(); }); }\n';
        html += '\n';
        html += '      el = document.getElementById("btnCancel");\n';
        html += '      if (el) { el.addEventListener("click", cancel); }\n';
        html += '\n';
        html += '      el = document.getElementById("btnPreview");\n';
        html += '      if (el) { el.addEventListener("click", updatePreview); }\n';
        html += '\n';
        html += '      el = document.getElementById("btnCreate");\n';
        html += '      if (el) { el.addEventListener("click", function() { dbg("create clicked"); submit(); }); }\n';
        html += '\n';
        html += '      var allInputs = document.querySelectorAll("input, select");\n';
        html += '      for (var i = 0; i < allInputs.length; i++) {\n';
        html += '        allInputs[i].addEventListener("input", schedulePreview);\n';
        html += '        allInputs[i].addEventListener("change", schedulePreview);\n';
        html += '      }\n';
        html += '\n';
        html += '      window.addEventListener("message", function(event) {\n';
        html += '        var msg = event.data;\n';
        html += '        if (msg && msg.command === "updatePreview") {\n';
        html += '          var prev = document.getElementById("preview");\n';
        html += '          if (prev) { prev.textContent = msg.preview || "No preview available"; }\n';
        html += '        }\n';
        html += '      });\n';
        html += '\n';
        html += '      updatePreview();\n';
        html += '      dbg("init OK");\n';
        html += '    }\n';
        html += '\n';
        html += '    var initParamsData = ' + JSON.stringify(this.initialData?.parameters || []) + ';\n';
        html += '    function initParams() {\n';
        html += '      var pc = document.getElementById("paramsContainer");\n';
        html += '      for (var ip = 0; ip < initParamsData.length; ip++) {\n';
        html += '        addParameter();\n';
        html += '        var rows = pc.querySelectorAll(".param-row");\n';
        html += '        var lastRow = rows[rows.length - 1];\n';
        html += '        if (lastRow) {\n';
        html += '          var nEl = lastRow.querySelector(".param-name");\n';
        html += '          var tEl = lastRow.querySelector(".param-type");\n';
        html += '          var dEl = lastRow.querySelector(".param-dir");\n';
        html += '          if (nEl) { nEl.value = initParamsData[ip].name || ""; }\n';
        html += '          if (tEl) { tEl.value = initParamsData[ip].type || ""; }\n';
        html += '          if (dEl) {\n';
        html += '            if (initParamsData[ip].isVar) { dEl.value = "var"; }\n';
        html += '            else if (initParamsData[ip].isOut) { dEl.value = "out"; }\n';
        html += '            else if (initParamsData[ip].isConst) { dEl.value = "const"; }\n';
        html += '          }\n';
        html += '        }\n';
        html += '      }\n';
        html += '      if (initParamsData.length > 0) { schedulePreview(); }\n';
        html += '    }\n';
        html += '\n';
        html += '    if (document.readyState === "loading") {\n';
        html += '      document.addEventListener("DOMContentLoaded", function() { setupListeners(); initParams(); });\n';
        html += '    } else {\n';
        html += '      setupListeners();\n';
        html += '      initParams();\n';
        html += '    }\n';
        html += '\n';
        html += '  } catch(e) {\n';
        html += '    document.body.innerHTML += "<div style=\\"color:red;padding:8px\\">FATAL: " + e.message + "</div>";\n';
        html += '  }\n';
        html += '})();\n';
        html += '</script>\n';
        html += '</body>\n</html>';

        return html;
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
