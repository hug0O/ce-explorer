# Code Explorer

A multi-language class explorer and refactoring tool for VS Code — inspired by MMX Code Explorer for Delphi.

Browse, create, edit, and refactor classes and members across **9 languages** with a visual sidebar, popup forms, and one-click operations.

## Install

# 1. Compil bundle — dist/extension.js
npm run build

# 2. Generate .vsix 
npx @vscode/vsce package

# install .vsix
code --install-extension mmx-code-explorer-0.1.0.vsix

## Supported Languages

| Language | Extensions |
|----------|-----------|
| Pascal / Delphi | `.pas` `.dpk` `.dpr` |
| C++ | `.h` `.hpp` `.cpp` `.cc` `.cxx` `.hxx` |
| Rust | `.rs` |
| Java | `.java` |
| Python | `.py` |
| C# | `.cs` |
| Go | `.go` |
| TypeScript / JavaScript | `.ts` `.tsx` `.js` `.jsx` |
| PL/SQL | `.pks` `.pkb` `.sql` `.txt` |

## Features

### Sidebar: Add / Delete, Tools, Memo
The **Member** view of the Code Explorer sidebar has four tabs: *Details* (the member under the cursor), **Add / Delete**, **Tools** and **Memo**. The former *Classes* tree is gone: the Add / Delete tab does everything it did, on the types of the active file.

- **Type selector** (when the file has several types, or standalone routines): manage any of them, not only the one under the cursor.
- **Add** a field, method, property or constructor to the chosen type; insert a template; synchronise declarations and implementations; open the templates manager; refresh.
- **Filter** the members as you type: by name, type or kind, with a regular expression when it is valid (`get|set`, `^On`), plus a *kind* list (methods, fields, properties, constructors). The *Filter Members* command (`mmx.filterTree`) puts the caret in that box.
- **Order / group**: source order, by visibility, by kind, or A → Z (`CE: Toggle Member Grouping` cycles through them).
- **Every member** is listed with its visibility (`+ - # ★`), kind icon, signature and type, and acts on click: *go to*, **edit**, **rename**, **getter / setter** (fields), **move to another type**, **delete**. Drag-and-drop reordering of the tree is replaced by *move to another type*.

### Visual Member Editor
- Popup webview form for creating and editing methods, fields, and properties
- Live code preview adapted to the target language
- Add parameters with a dynamic parameter builder
- Support for visibility modifiers, static/virtual/abstract/override

### Member Operations
- **Add** — Create methods, fields, properties, constructors
- **Edit** — Modify signature while preserving the original body
- **Rename** — Update member name across declaration and implementation
- **Delete** — Remove member with confirmation
- **Move** — Transfer a member to another class
- **Filter, group, go to** — in the Add / Delete tab of the sidebar

### Code Generation
- **Implement Interface** — Auto-generate method stubs from interface/parent definitions
- **Generate Getters/Setters** — Create accessors for one or more fields
- **Extract Method** — Extract selected code into a new function
- **Synchronize Declaration/Implementation** — Sync C++ header/source files
- **Code Templates** — 46 built-in templates (Singleton, Factory, Builder, Repository, Observer, and more) per language

### Code Intelligence
- **Code Lens** — Inline annotations showing member counts and method properties
- **Go to Member** — Fuzzy search across all classes and members
- **Quick Fixes** — Contextual code actions (generate body, add accessors)

### Analysis Tools
- **Code Metrics** — Dashboard with LOC, complexity, and maintainability per class
- **Code Review** — Automated checklist (long methods, large classes, public fields, TODOs, stubs)
- **Dead Code Detection** — Find unused methods and classes across the workspace
- **API Documentation** — Generate Markdown docs from code structure
- **Export Structure** — Export class/member layout as JSON

### Standalone Functions
Create file-level functions without a class — supported for Rust, Go, Python, TypeScript/JS, Pascal, and C++.

## Commands

All commands are prefixed with `CE:`:

| Command | Description |
|---------|-------------|
| `CE: Add Method...` | Add a method to a class or as a standalone function |
| `CE: Add Field...` | Add a field |
| `CE: Add Property...` | Add a property with getter/setter |
| `CE: Edit Member...` | Edit an existing member (preserves body) |
| `CE: Rename Member` | Rename a member |
| `CE: Delete Member` | Delete a member |
| `CE: Move Member to...` | Move a member to another class |
| `CE: Extract Method` | Extract code into a new function |
| `CE: Implement Interface / Override Methods...` | Generate missing method stubs |
| `CE: Generate Getters/Setters...` | Create accessors for fields |
| `CE: Synchronize Declaration/Implementation` | Sync C++ header/source |
| `CE: Insert Template...` | Insert a code template |
| `CE: Manage Templates...` | Open template manager |
| `CE: Go to Member...` | Fuzzy search members |
| `CE: Filter Members...` | Filter the tree |
| `CE: Toggle Member Grouping` | Cycle grouping mode |
| `CE: Code Metrics` | Show metrics dashboard |
| `CE: Code Review` | Run code review checklist |
| `CE: Detect Dead Code` | Find unused code |
| `CE: Generate Documentation` | Generate Markdown API docs |
| `CE: Export Structure` | Export structure as JSON |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `mmx.enableCodeLens` | `true` | Show Code Lens annotations |
| `mmx.previewEdits` | `false` | Show diff preview before applying edits |
| `mmx.pascal.indentSize` | `2` | Indentation for generated Pascal |
| `mmx.cpp.indentSize` | `4` | Indentation for generated C++ |
| `mmx.cpp.braceStyle` | `newLine` | Brace placement for C++ |
| `mmx.pascal.defaultVisibility` | `private` | Default visibility for Pascal |

## Templates

Templates use VS Code snippet syntax (`${1:placeholder}`, `$0`) and are loaded from:
- **Workspace**: `.vscode/mmx-templates.json`
- **Global**: Extension global storage (`templates.json`)

Manage them from the **Templates** section of the Code Explorer sidebar: create, edit,
delete, and insert with one click. Snippet tab stops act as parameters — jump between
`${1:...}`, `${2:...}` with Tab when inserting. The list is filtered to the language of
the file being edited.

## License

MIT

## Keyboard shortcuts & navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl+K Ctrl+M` | Open the **Add / Delete** tab of the Member sidebar |
| `Ctrl+K Ctrl+N` | Open the **Memo** tab |
| `Ctrl+K Ctrl+A` | Show the Code Explorer action menu |
| `Ctrl+K Ctrl+E` | Edit the member under the cursor |
| `Ctrl+K Ctrl+B` | Toggle the Delphi form designer ⇄ code |
| `Ctrl+K J` | Align the selection on a string (any language) |

**Tools shortcuts: `Ctrl+K`, release, then a letter.** Each one works only in the files it is about, so the same letter serves both families. They are **shown on the buttons of the Tools tab**, next to the tool, so there is nothing to look up.

| Delphi (`.pas` `.dfm` `.dpr`) | | PL/SQL (`.pks` `.pkb` `.sql` `.pls` `.plb` `.txt`) | |
|---|---|---|---|
| `Ctrl+K D` | Open the form designer | `Ctrl+K D` | PLDoc header |
| `Ctrl+K L` | Align components | `Ctrl+K Y` | Sync spec ⇄ body |
| `Ctrl+K N` | Anchors / docking | `Ctrl+K N` | New package |
| `Ctrl+K T` | TabOrder by position | `Ctrl+K C` | CRUD from table |
| `Ctrl+K C` | Check form | `Ctrl+K X` | Extract procedure |
| `Ctrl+K H` | Clean handlers | `Ctrl+K E` | Exception block |
| `Ctrl+K Y` | Copy components | `Ctrl+K T` | utPLSQL tests |
| `Ctrl+K A` | Paste components | `Ctrl+K L` | Find callers |
| `Ctrl+K K` | Duplicate | | |
| `Ctrl+K G` | Form from fields | | |
| `Ctrl+K Q` | Form from a class | | |
| `Ctrl+K E` | Change class | | |

The letters avoid the ones VS Code already uses after `Ctrl+K` (`M F P R O U W Z V S`). They can be changed in *Keyboard Shortcuts* like any other; the sidebar shows the default ones.

- **CE: Go to Member in Workspace…** searches the symbols of every file (index kept up to date by a file watcher).
- Renaming a member uses the language server when one is available (TypeScript, Java, C#, Go, Rust, Python, C++ with clangd), and otherwise falls back to a text search. The fallback offers to rename the references found in other workspace files.
- `mmx.codeLensMemberActions` adds Edit / Delete code lenses above every member.

## Align selection & Delphi components

- **CE: Align Selection on Text…** (right-click a selection, or the `Ctrl+K Ctrl+A` menu) pads the selected lines so the first occurrence of a string you type (`:=`, `:`, `=`, `//`…) starts in the same column. Works in every language; with no selection it aligns the contiguous block around the cursor. Occurrences inside string literals are ignored.
- **CE: Add Delphi Component (.pas + .dfm)…** works like dropping a component on a form: pick a class (TButton, TEdit, TLabel, TCheckBox, TMemo, TPanel, TTimer…), a name and an event. The component is added to the text `.dfm`, its field and an empty handler to the `.pas` (and the needed unit to `uses`) in one undoable edit, then the cursor lands inside the new handler. An example form is in `test-fixtures/delphi/`.

### Sidebar tools (Member view → Tools tab)

- **Align selection**: type a string (or click `:=`, `:`, `=`, `=>`, `//`, `,`), select lines in the editor, click *Align*. Also shown when the cursor is outside any member.
- **Delphi components and events** are added in the **visual form designer** (palette by type, drop on the form, one-click event handlers): the sidebar no longer has its own *Components* form, since the designer does the same thing visually. The command palette keeps **CE: Add Delphi Component…** and **CE: Add Event Handler to Delphi Component…**.
- **Keyboard shortcuts** of the tools are shown on their buttons (see *Keyboard shortcuts*).

### More Delphi tools

- **Align shortcuts** are yours: type any string, click `+` to keep it, `×` to remove one. They are saved between sessions.
- **Spacing between components** (Tools → Spacing) sets the exact edge-to-edge gap between a component and its neighbour on any side (right, below, left, above), moving what follows if you tick the box, and **Distribute** re-spaces a whole container on fixed horizontal / vertical gaps (rows detected, columns aligned).
- **The .dfm follows the unit**: renaming a component field (explorer, Member panel…) renames the `object` in the `.dfm`, its references and its `<Component><Event>` handlers; deleting it removes the object, its children and the empty handlers; adding a field of a known component class offers to create the object. Handlers that contain code, or are shared, are never touched.
- **Third-party components** (DevExpress, TMS, JVCL…): any class name works. The tool learns size, caption, tab stop and events from the `.dfm` files already in your workspace, remembers the unit you typed for a class, and you can describe a class once in the `mmx.delphi.customComponents` setting (`className`, `unit`, `width`, `height`, `namePrefix`, `events`, `props`, `tabOrder`). Third-party units are added to `uses` as written, never with the `Vcl.` scope.
- Examples: `test-fixtures/delphi/ComplexForm.*` (docked panels, page control, group boxes, DevExpress controls, a list view collection) and `LayoutForm.*`.

## PL/SQL (Oracle)

Files: `.pks .pkb .pck .pls .plb .prc .fnc .trg .sql`, and `.txt` **only when the text contains SQL / PL/SQL** (notes and logs are left alone). Package specs *and* bodies, stand-alone procedures / functions, triggers, anonymous `DECLARE … END;` blocks of a script and `CREATE TABLE` columns appear in the explorer. The parser understands nested subprograms, `END IF / END LOOP / CASE … END`, constants, exceptions, types, cursors and comments.

Tools → **PL/SQL (Oracle)** in the sidebar, the `Ctrl+K Ctrl+A` menu and the command palette (`CE PL/SQL: …`):

| Feature | What it does |
|---------|--------------|
| Synchronize spec ⇄ body | Finds subprograms declared on one side only and signature mismatches (Oracle needs them identical); declare in the spec, create an empty body (before the initialization section), or copy the signature either way. Works across `.pks` / `.pkb` or in one file. |
| New package | Spec + body skeleton from `name(params):Return; …`, with PLDoc headers |
| CRUD package from table | From a `CREATE TABLE` (selection, cursor or clipboard): insert / update / delete / get (`%ROWTYPE`) / exists, typed with `table.col%TYPE` |
| Extract procedure | Selection → new procedure with detected `IN` / `OUT` / `IN OUT` parameters (sizes stripped); locals used only there move inside |
| Declare variable | Type inferred from the body: `SELECT col INTO v FROM t` → `t.col%TYPE`, `FETCH c INTO r` → `c%ROWTYPE`, literals, `SYSDATE`, other variables |
| Exception block | `NO_DATA_FOUND`, `TOO_MANY_ROWS`, `OTHERS` with re-raise |
| PLDoc header | `/** … @param … @return … */` from the signature; running it again refreshes it and keeps your descriptions |
| utPLSQL tests | Test package generated from a spec |
| Go to definition / Find callers | `F12` / `Shift+F12` on `PKG.PROC` across the workspace |
| Review (Oracle) | `WHEN OTHERS THEN NULL`, `SELECT INTO` without `EXCEPTION`, `COMMIT` in package code, dynamic SQL by concatenation, `= NULL`, DML in loops, unclosed cursors, bad `RAISE_APPLICATION_ERROR` codes, unused variables / parameters, functions without `RETURN`, never-called private helpers |
| Align presets | Parameters (name \| mode \| type), declarations, `:=`, `=>`, `--`, `AS` |

Setting `mmx.plsql.author` is written in generated headers. Nothing connects to a database: everything works on the source text.

### Delphi layout & checks (Tools → "Delphi layout & checks", and `CE Delphi: …` in the palette)

| Command | What it does |
|---------|--------------|
| Align components | The IDE's Align / Size / Space: left, right, top, bottom edges, centres, same width / height / size, equal horizontal / vertical spacing (first and last stay in place) |
| Anchors / docking | *Anchors from current position* (near the right / bottom edge → anchored there, spanning → stretched), presets (top-right, bottom-left, stretch…), `alClient` / `alTop` / … / undock |
| TabOrder by position | Reading order on screen (rows, then left to right), per container or for the whole form |
| Copy / Paste / Duplicate | Components with their children, event handlers **and their code**, across forms: renamed on clashes (`btnOk` → `btnOk1`, handler included), shifted, units added to `uses` |
| Form from fields / from a class | `Nom:string, Age:integer, Actif:boolean, Date:date, Notes:memo` → label / input rows in aligned columns (edt / chk / dtp / mem / cbo naming), the container grows if needed; "from a class" proposes the fields of a class of the unit |
| Change class | `TEdit` → `TcxTextEdit`, `TButton` → `TBitBtn`…: keeps compatible properties and events, lists what is dropped, updates the field and `uses` |
| Check form | `.dfm` ⇄ `.pas`: event link to a missing method (the form would not load), field without component (nil at runtime), wrong field type, duplicate names / TabOrder, controls beyond their container, overlaps, empty or orphan handlers — with one-click fixes and an "apply the safe fixes" action |
| Clean handlers | The "Handlers" findings of the check only |

### Visual form designer (Delphi) — `CE Delphi: Open Form Designer`, the 🎨 button of Tools, or the icon in the title bar of a `.pas` / `.dfm`

The text `.dfm` drawn as a form, next to the code. The VCL docking rules are applied (`alTop`, `alBottom`, `alLeft`, `alRight`, `alClient`, panels' bevels, page controls, splitters), so what you see is the layout Delphi would give.

- **Select** (click, Shift+click, drag a rectangle, outline list), **move** (drag, arrow keys, snapped to a grid), **resize** (handles; docked controls only expose the handle of their docking side), **drag into another container** (panel, group box, page…), **Delete**.
- **Palette**: VCL, **DevExpress** and **TMS** components with a filter, or any class by name (`Other class…`). Click for the default size, or draw the rectangle. Fields and `uses` (including the units the IDE adds for DevExpress / TMS) go into the `.pas`.
- **Inspector**: name (renames the field and its handlers too), position, size, caption / text (written the Delphi way, accents as `#233`), `Align`, `Anchors`, `TabOrder`, visibility, events. **Double-click** a component to create / open its default handler.
- **Align** menu (edges, centres, same size, equal spacing), zoom, grid, component names, undo / redo of the designer's own actions.
- **Two-way**: edits made in the text editor redraw the form at once, and putting the cursor on an `object` in the `.dfm` selects it in the designer.
- **Third-party components**: DevExpress (`Tcx…`, `Tdx…`) and TMS (`TAdv…`, `TTMSFNC…`) are drawn with a family look, their editors, radio groups, page controls (`TcxPageControl`, `TAdvOfficePager`), grids and non-visual controllers included; nested events such as `Properties.OnChange` are supported.
- **Classes it does not know are never altered.** They are drawn as a labelled placeholder (`?`), the rest of the form is unaffected if one of them cannot be drawn, and every action is checked before it is applied: if it would change anything other than what you asked for in the `.dfm`, it is **refused** and nothing is modified.

#### Designer: component lists, handlers and code ⇄ designer

- **Palette** and **Components** are two collapsible lists on the left. The palette shows **one type at a time** (Standard, Additional, Win32, System, DevExpress, TMS — chosen in a drop-down that says how many components each holds), so it never lists everything at once; typing in its name filter searches every type. *Components* lists what is on the form with a filter by name (or class or caption), a filter by type (containers, non-visual, with event handlers, unknown classes, DevExpress, TMS, or a given class), sorting (form order, name, type, position) and a flat / tree switch. Click selects, Ctrl / Shift extend the selection, and a component on a hidden page makes the page tabs switch so you can see it.
- **Empty handlers disappear on save**, like in the Delphi IDE: on a manual save of the unit, a handler whose body is empty is removed — the method, its declaration and the `OnXxx = Handler` link in the `.dfm`. A body with a comment is not empty; autosave never removes anything. Setting `mmx.delphi.removeEmptyHandlers`.
- **Double-click a component** in the designer: the code of its handler opens in the *same editor group*, so the designer stays one tab away. Back to the designer with its tab, the 🎨 button in the title bar of the unit, or **Ctrl+K Ctrl+B** (also from inside the designer to go to the code, as does **F12** and the *Code* button). `mmx.delphi.designerColumn` can open the designer beside the code instead.

#### Designer: DevExpress tile control (`TdxTileControl`)

- The **tile control** is drawn with its title, its **groups** (`TdxTileControlGroup`) side by side and its **tiles** (`TdxTileControlItem`) flowing in columns by size (small, regular, large, extra large), with the tile colour and texts. Groups and tiles have no `Left` / `Top` in the `.dfm`: the control places them, so they are selectable but never dragged, and a tile cannot be moved out of its control.
- **Add** them from the palette (type *DevExpress*): select the tile control (or any of its tiles) and click `TdxTileControlItem` / `TdxTileControlGroup` / `TdxTileControlDetailSite`, or arm the tool and click the control on the form. A new tile goes to the last group; a new group gets the next `Index`. Nothing but tiles, groups and detail pages can enter a tile control.
- **Inspector of a tile**: `Text1`, `Text2`, `Size`, and the **Group** it belongs to (`GroupIndex`); of a group: its caption. The **detail page** (`TdxTileControlDetailSite`) is an ordinary container; when hidden it is drawn only while it, or something in it, is selected.
- **Events** with their real signatures: `OnClick`, `OnActivateDetail`, `OnDeactivateDetail` of a tile (`Sender: TdxTileControlItem`), `OnItemActivateDetail`, `OnItemDeactivateDetail`, `OnItemCheck` of the control (`Sender: TdxCustomTileControl; AItem: TdxTileControlItem`). The unit's `uses` receives `dxCustomTileControl` and the other DevExpress units, once.

#### Designer: list of events, one click to create a handler

The inspector lists **every event of the selected component** (from the catalog: standard VCL, DevExpress, TMS), wired or not. A filled dot means the event already has a handler, shown with its name; an empty dot shows the name the handler *will* have.

- **Click a free event**: the handler is created — method and declaration in the unit, `OnXxx = Handler` in the `.dfm` — and the code stays closed, so you can create several listeners in a row; it is one undoable step of the designer. The **↗** at the end of the row creates it *and* opens it in the code.
- **Click a wired event**: opens its handler in the code.
- **Other event**: a text box under the list creates any event by name (`OnMouseEnter`, `Properties.OnChange`…); it is the way to add events of a class the designer does not know, whose own list stays empty rather than guessing.
- Handlers use the signature of the component's own event (`Sender: TdxTileControlItem`, `AButtonIndex: Integer`…), also in *Check form* and *Add event handler*.

#### Designer: room for complex forms

- **Hide the side panels**: *◧ Palette* (the palette and the component list, key **P**) and *Inspector ◨* (key **I**) in the toolbar. A hidden panel leaves a small tab on its edge: click it to bring the panel back. The choice is remembered.
- **Zoom → Fit window** scales the form to the room that is left, and follows the window and the panels as they change.
- **⛶ Full screen** (key **F**) hides both panels and asks VS Code for its **Zen mode** (no side bar, no status bar, full screen), then fits the form to the whole screen. Press it again to get the panels and the VS Code interface back. If you leave Zen mode yourself (`Esc Esc`), press the button twice to resynchronise it. Closing the designer leaves Zen mode too.

#### Designer: seeing and changing a component's parent

- **The parent is always visible.** Select a component and its parent container is outlined with an orange dashed frame and a `⬑ parent: name : class` tag. The inspector starts with a breadcrumb (`Form › pnlCentre › pgcDetails › … › edtNom`) where each ancestor is clickable, and the status bar shows the same path.
- **Containers** checkbox in the toolbar: every container is outlined and named, with a colour per nesting depth. Even with it off, the container under the pointer is outlined with its name and class.
- **Move to another parent**, four ways: drag the component onto another container (the target turns green and a tag says `Drop into … : class`; dropping on the form itself takes it out of its container); pick one in the inspector's **Parent** list (the component stays where it is on screen when possible); drag a row of the Components list onto a container row, or onto the `⌂ form` row at its top; or drag a *docked* control (alTop, alClient…) — it keeps its `Align`. A component is always kept inside its new parent, and never goes into itself or its own children.
- **Esc** selects the parent of the selection (the usual Delphi habit); it first cancels the palette tool if one is armed.

#### Sidebar → Memo: Markdown notes per language

The **Memo** tab keeps the actions you repeat every day, one Markdown memo per language (Delphi, PL/SQL, TypeScript… and *General*). The language follows the file you are editing (or pick one in the list; a • marks the languages that already have a memo).

- **Edit** as plain Markdown, saved as you type; **Preview** to read it. A memo that has text opens as a preview.
- In the preview, **task lists** (`- [ ] step`) can be ticked and stay ticked; every **fenced code block** has **Copy** and **Insert** buttons, the latter writing the block at the cursor of the editor (or on every cursor / selection); `code`, **bold**, *italic*, quotes, lists and `https` links work too. Nothing in the text can run: it is escaped, and links only open from the extension.
- **📝 Open .md** opens the file in the editor. The files are plain `typescript.md`, `pascal.md`, `plsql.md`, `general.md`… in the extension's own storage, or in the folder of the `mmx.memo.folder` setting (a relative path starts at the workspace, so the memos can be versioned with the project and shared with the team). A memo saved from the editor refreshes the sidebar.
- `Ctrl+K Ctrl+N` or **CE: Open Memo** opens the tab.

#### Sidebar → Tools: one page per set of tools

The Tools tab is split into sub-tabs, and only the ones that apply to the active file are shown: **Form** (visual designer, layout and checks), and **Spacing** for a Delphi unit (components and their events are added in the visual designer, which does it visually: the sidebar no longer duplicates it); **PL/SQL** for Oracle files; **Align** for everything. The last sub-tab you used is remembered.
