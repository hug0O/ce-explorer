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

### Class Explorer Tree
- Side panel showing all classes, interfaces, structs, traits, and enums
- Type-specific icons (struct, interface, enum, impl, class)
- Expandable member lists with visibility, return types, and modifiers
- Real-time filter and grouping (by kind, visibility, or alphabetical)

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
- **Drag-and-drop** — Reorder members within a class by dragging in the tree

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
| `Ctrl+K Ctrl+A` | Show the Code Explorer action menu |
| `Ctrl+K Ctrl+E` | Edit the member under the cursor |

- **CE: Go to Member in Workspace…** searches the symbols of every file (index kept up to date by a file watcher).
- Renaming a member uses the language server when one is available (TypeScript, Java, C#, Go, Rust, Python, C++ with clangd), and otherwise falls back to a text search. The fallback offers to rename the references found in other workspace files.
- `mmx.codeLensMemberActions` adds Edit / Delete code lenses above every member.

## Align selection & Delphi components

- **CE: Align Selection on Text…** (right-click a selection, or the `Ctrl+K Ctrl+A` menu) pads the selected lines so the first occurrence of a string you type (`:=`, `:`, `=`, `//`…) starts in the same column. Works in every language; with no selection it aligns the contiguous block around the cursor. Occurrences inside string literals are ignored.
- **CE: Add Delphi Component (.pas + .dfm)…** works like dropping a component on a form: pick a class (TButton, TEdit, TLabel, TCheckBox, TMemo, TPanel, TTimer…), a name and an event. The component is added to the text `.dfm`, its field and an empty handler to the `.pas` (and the needed unit to `uses`) in one undoable edit, then the cursor lands inside the new handler. An example form is in `test-fixtures/delphi/`.

### Sidebar tools (Member view → Tools tab)

- **Align selection**: type a string (or click `:=`, `:`, `=`, `=>`, `//`, `,`), select lines in the editor, click *Align*. Also shown when the cursor is outside any member.
- **Delphi component**: for a `.pas` with a text `.dfm`, add *any* class (pick from the list or type e.g. `TSpinEdit`, optional unit for `uses`), choose the container (form, panel, group box…), a reference control and the side (right of / below / left of / above). The component is aligned with it (vertically centred beside, left edges aligned above/below; docked siblings such as `alTop` are continued) and the event handler is created.
- **Event on an existing component**: pick a component of the form (or the form itself) and an event (`OnClick`, `OnChange`, `OnClose`…): the link is added to the `.dfm`, the handler declared and stubbed in the `.pas`, and the cursor jumps into it. If the event is already wired, the existing handler is opened instead. Also available as **CE: Add Event Handler to Delphi Component…**.

### More Delphi tools

- **Align shortcuts** are yours: type any string, click `+` to keep it, `×` to remove one. They are saved between sessions.
- **Gap**: the *Add to form* block has a pixel gap (default 8) used between the new component and its reference. **Spacing between components** sets the exact edge-to-edge gap between a component and its neighbour on any side (right, below, left, above), moving what follows if you tick the box, and **Distribute** re-spaces a whole container on fixed horizontal / vertical gaps (rows detected, columns aligned).
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
