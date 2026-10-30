# Code Explorer

A multi-language class explorer and refactoring tool for VS Code — inspired by CE Code Explorer for Delphi.

Browse, create, edit, and refactor classes and members across **9 languages** with a visual sidebar, popup forms, and one-click operations.

## Install

```bash
# 1. bundle -> dist/extension.js
npm run build

# 2. package the extension
npx @vscode/vsce package --no-dependencies

# 3. install the .vsix (or: Extensions view -> ... -> Install from VSIX)
code --install-extension ce-code-explorer-0.1.74.vsix
```

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
| Batch (Windows) | `.bat` `.cmd` (labels = routines, `set` = variables) |
| PowerShell | `.ps1` `.psm1` (functions, classes, variables) |
| Shell (sh / bash / zsh) | `.sh` `.bash` `.zsh` `.ksh` (functions, variables) |
| Markdown | `.md` `.markdown` (the headings are the members: Structure tab, `Alt+G`, `Ctrl+Shift+Up/Down` walk the document by title) |


## What it is for

Code Explorer adds to VS Code what a Delphi developer misses in it (a structure of the unit, the form designer, the checks between `.pas` and `.dfm`) and what any language gains from it (safe refactoring, review, project-wide views). It works next to OmniPascal and the other extensions: it never changes the language VS Code gives a file.

| You want to… | Use | Where |
|---|---|---|
| See what a file holds, and where a member is used | **Structure** tab: members by order / visibility / kind, where the selected one is used, a search inside its code, its variables, the routines declared inside it | Sidebar → Code Explorer → Structure |
| Add, change, rename, move or delete a member without breaking the rest | Member forms, rename that keeps declaration and implementation together, extract method, getters / setters, implement an interface, synchronise declaration and implementation | Sidebar, lightbulb, `CE:` commands |
| Rename a variable | **Rename Variable**: stays in the file (other units of the same language on request, never forms or other languages) | Lightbulb |
| Draw a Delphi form | **Visual form designer**: select, drag, resize, align, add components and events, copy / paste, undo; DevExpress, TMS and UniDAC are drawn; zoom with `Ctrl` + wheel, magnetism with guide lines, colours from styles, fields and columns of queries and grids | `Ctrl+K D`, the title bar of a `.pas` / `.dfm`, the status bar |
| Keep `.pas` and `.dfm` in step | **Check form**, clean handlers, handlers renamed and removed with their component | Tools → Form, `Ctrl+K C` |
| Know where the SQL of the project is | **Project panel → SQL**: every statement of the forms and the code, its tables and parameters, search by table or query number | `Ctrl+K I` |
| Find what nobody uses | **Project panel → Unused**: units of a `uses` clause, components, SQL parameters | `Ctrl+K I` |
| Review a code base | **Code review** with compiler-style rules and codes in every language, dead code, metrics, documentation | `CE: Code Review`, the Tools tab |
| Prepare a translation, tidy the names | **Project panel → Texts, Names**: the texts of the forms grouped by meaning with a CSV export; component names against the convention of the project, with rename | `Ctrl+K I` |
| See what changed in a form | **Compare the form with a git version**: component by component, whatever the order and the indentation | `Ctrl+K B` |
| Find the places to tidy first | **Project panel → Hotspots**: units often changed and hard to change | `Ctrl+K I` |
| Work on Oracle | PL/SQL tools: package skeletons, CRUD from a table, spec ⇄ body sync, utPLSQL tests, callers | Tools → PL/SQL |
| Use the features on a file CE does not know | **Language of this file** (Tools tab drop-down, or `CE: Use a Language for this File…`), per file or per extension | Tools tab, status bar |
| Fix letters shown as `�` or `Ã©` | **Fix Encoding (accents)**: repairs UTF-8 read as Windows-1252 in place; reads a Windows-1252 file (what Delphi writes) as such and keeps it for the language | Title-bar button / status bar when something looks wrong, `CE: Fix Encoding (accents)…` |
| Keep notes, find a shortcut | **Memo** (Markdown notes: main.md and as many as you create) and **Shortcuts** (every key, by mode) tabs | Sidebar |

Nothing is read in the background: the project panel scans only when asked, in small steps, and remembers what it read.
## Features

### Sidebar: Structure, Tools, Memo
The **Member** view of the Code Explorer sidebar has five tabs: *Details* (the member under the cursor), **Structure**, **Tools**, **Memo** and **Shortcuts**. The former *Classes* tree is gone: the Structure tab does everything it did, on the types of the active file. A **Changelog + Guide** view, folded, sits below it: the changelog of every version and the user guide (pictures and animations of the designer; also **CE: Open the User Guide**). The pictures are made by `npx tsx tools/guide/make.ts` (see tools/guide).

- **Type selector** (when the file has several types, or standalone routines): manage any of them, not only the one under the cursor.
- **Add** a field, method, property or constructor to the chosen type (compact buttons that wrap, close together); insert a template; synchronise declarations and implementations; open the templates manager; refresh.
- **Filter** the members as you type: by name, type or kind, with a regular expression when it is valid (`get|set`, `^On`), plus a *kind* list (methods, fields, properties, constructors). The *Filter Members* command (`ce.filterTree`) puts the caret in that box.
- **Order / group**: source order, by visibility, by kind, or A → Z (`CE: Toggle Member Grouping` cycles through them).
- **The selected member** (the one under the cursor, or the last one you clicked) gets its blocks **right under its own row** in the list, so they are never at the bottom of a long list, and each one **folds and unfolds** (the choice is kept): **Used in this file** — the lines of the current file that use it, listed with their line number, highlighted in the editor (a tint on the line and on the name, a mark in the ruler) and one click away — then, for a member with a body, its **Variables** (locals and parameters, with edit / delete / add — only when the cursor is in that member) and **Search in its code**: a box that filters the lines of that member only (regular expression when valid, plain text otherwise), with the same list and highlights. Going to a line from these lists keeps the member being looked at, so you can browse its usages in other members; moving the cursor yourself elsewhere takes the selection back. The highlights go away when you leave the Structure tab. Usages are found by name in the file (whole word), so a string that mentions the name counts.
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
- **Filter, group, go to** — in the Structure tab of the sidebar

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
- **Code Review** — warnings and advice on the current file, in the *Review* button of the member sidebar (Details tab → Analyze) and in **CE: Code Review**. Every finding has a severity — **error**, **warning** (very likely a bug or a risk) or **advice** (correct, but could be better) —, a message, a **hint on how to fix it**, and its category, member and line.
  - **Click a finding to go to its line** (the column too, when it is about a name). The findings are also drawn as squiggles in the editor and listed in the **Problems** panel (source *CE Review*) until you close the report; `↻` reviews the file again after you fixed something. Severity buttons hide or show each kind and the list can be ordered in file order, most serious first, or by category.
  - **The rules follow the compiler of each language** and give every finding **the code the compiler or the linter gives the same problem** (`H2164`, `CS0168`, `TS6133`, `F401`, `-Wunused-variable`, `errcheck`…), shown next to it, so it can be looked up or silenced the usual way. They read the text only — comments and the inside of strings are never taken for code — and report what the text alone shows; they do not replace a build.
  - **The real compiler too, when there is one**: what the other extensions' language servers already report for the file (the TypeScript server, Pylance, gopls, rust-analyzer, OmniSharp, a Delphi language server…) is listed in the same report, marked with its name, under the category *Compiler*, and is not repeated when a rule of the review says the same thing on the same line.
  - **Delphi / Pascal, as the compiler would say it**:
    - warnings **W1035** (a function that never assigns `Result`; the old function-name assignment counts), **W1036** (a scalar variable only ever read), **W1011** (text after the final `end.`);
    - hints **H2164** (variable never used; unused parameters, with event handlers, overrides and virtual methods left alone), **H2077** (value assigned and never used), **H2219** (a private field or method nobody uses), **H2135** (a FOR loop whose numeric bounds never let it run);
    - **E2065** (a method declared in the class and never implemented);
    - errors the compiler stops on: a unit whose name is not its file's, no implementation section, no `end.`, a unit listed twice in `uses` — and as advice a unit already in the interface `uses`;
    - and what a reviewer adds: `begin` / `end` that do not add up, code after `Exit` / `raise` / `Break`, an object **never freed** or freed **without `try … finally`**, a field a constructor creates and the class never frees (owners such as `Create(Self)`, objects handed to a list or to `Result`, interfaces and records like `TRect` are left alone), an **empty `except`**, `with`, `if X then;`, **SQL built by concatenation or `Format`**, an overridden constructor / destructor **without `inherited`**, routines over 30 / 60 lines, more than 6 parameters, blocks nested 6 deep.
  - **TypeScript / JavaScript** (tsc and ESLint): `TS6133` unused imports and locals, `TS7027` unreachable code, `eqeqeq`, `no-var`, `no-console`, `no-debugger`, `no-explicit-any`, `no-empty`, `no-cond-assign`, `no-eval`, `radix`, a `forEach` given an async callback, `@ts-ignore`, `innerHTML` (CWE-79), and `async` without `await`.
  - **Java** (javac `-Xlint`, PMD): `rawtypes`, `removal` (`new Integer(…)`, `finalize`), `serial`, strings compared with `==`, `System.out`, `printStackTrace`, catching `Exception` / `Throwable`, a stream or reader opened and never closed, unused local variables and private fields.
  - **C#**: `CS0168` / `CS0219` (variable never used / assigned and never used), `CS0169` (private field never used), `CS0162` (unreachable code), `CS1998` (`async` without `await`), `VSTHRD100` (`async void`), `VSTHRD002` (blocking on a task), `CA1031`, `CA2000` (an `IDisposable` never disposed), `lock(this)`.
  - **C++**: `-Wunused-variable`, `-Wparentheses` (`if (a = b)`), `-Wold-style-cast`, `-Wnon-virtual-dtor`, `modernize-use-nullptr`, `new` / `malloc` without `delete` / `free`, `strcpy` / `sprintf` / `gets`, `using namespace` in a header.
  - **Go**: what the compiler refuses (an import or a variable declared and not used — as errors), `errcheck` (an `err` nobody looks at), `SA9003` (empty branch), `nilerr`, unreachable code.
  - **Rust** (rustc and clippy): `unused_variables`, `unused_imports`, `unreachable_code`, `clippy::unwrap_used` (outside the tests), `unsafe_code`, `dbg_macro`, `todo`, `len_zero`, `ptr_arg`.
  - **Python** (pyflakes, pycodestyle, bugbear, pylint, bandit): `F401` / `F403` / `F841` / `F632` / `F541`, `E722` (bare `except`), `E711` / `E712`, `B006` (mutable default argument), `T100` (debugger), `B307` / `B102` (`eval`, `exec`), `B602` / `B605` (shell), `R1732` (`open` without `with`), `W0101` (unreachable code).
  - **PL/SQL**: the Oracle rules, now with the compiler's numbers where they exist — `PLW-06002` (unreachable code), `PLW-05005` (a function with no `RETURN`), `PLW-06009` (`WHEN OTHERS` that does not re-raise) — and a `LOOP` with no `EXIT`.
  - **Every language**: SQL built from pieces (CWE-89), MD5 / SHA-1 (CWE-327), certificate checks switched off (CWE-295), passwords written in the source, notes (`TODO`, `FIXME`, `HACK`), an empty `catch` / `except: pass`, long methods and classes, public fields. The routines of a form class are measured on their implementation, and the many component fields of a form do not make it a "big class".
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
| `CE: Blueprint (the calls of this file as a graph you can edit)` | The routines of the file as nodes (parameters on the left, return value on the right) and the calls between them as wires, in the manner of a game-engine blueprint. **Drag a node** by its title; **drag from a white arrow to another node** to write the call in the code; **click a wire and press Delete** to remove the call; **F2** renames a routine (every call follows), **Delete** removes it, **double-click** a node opens its code, **double-click the canvas** (or *+ Node*) adds a routine. The picture is read again from the text, so editing the code redraws it. Right-click menu of the editor > Code Explorer; works in every language of the extension that has routines (not Markdown) |
| `CE: Use a Language for this File...` | Tell CE which language a file it does not recognise is written in (this file, or every file with its extension): the members, tools and review then work on it. A status bar item offers it on a file VS Code leaves as plain text. The same choice is a **Language of this file** drop-down at the top of the Tools tab (Auto, or one language, for this file or every file with its extension): the tools of the language, such as the Delphi or PL/SQL ones, appear once it is chosen. It does not change the language VS Code gives the file, so OmniPascal and the others are not affected |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `ce.enableCodeLens` | `true` | Show Code Lens annotations |
| `ce.previewEdits` | `false` | Show diff preview before applying edits |
| `ce.pascal.indentSize` | `2` | Indentation for generated Pascal |
| `ce.cpp.indentSize` | `4` | Indentation for generated C++ |
| `ce.cpp.braceStyle` | `newLine` | Brace placement for C++ |
| `ce.pascal.defaultVisibility` | `private` | Default visibility for Pascal |
| `ce.delphi.designerAutoSave` | `false` | Save the `.dfm` and the `.pas` after every change made in the form designer |

## Templates

Templates use VS Code snippet syntax (`${1:placeholder}`, `$0`) and are loaded from:
- **Workspace**: `.vscode/ce-templates.json`
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
| `Ctrl+K Ctrl+M` | Open the **Structure** tab of the Member sidebar |
| `Ctrl+K Ctrl+N` | Open the **Memo** tab |
| `Ctrl+K Ctrl+A` | Show the Code Explorer action menu |
| `Ctrl+K Ctrl+E` | Edit the member under the cursor |
| `Ctrl+K Ctrl+B` | Toggle the Delphi form designer ⇄ code |
| `Ctrl+K J` | Align the selection on a string (any language) |

Inside the form designer (key presses in an inspector field are left to VS Code, so the shortcuts above also work there): `Ctrl+S` save the `.dfm` and the `.pas` · `Ctrl+C` / `Ctrl+X` / `Ctrl+V` copy, cut, paste components · `Ctrl+Z` / `Ctrl+Y` undo, redo · `Ctrl+A` select every component of the selection's container (the form when nothing is selected) · `Delete` · arrows (`Shift` = grid step, `Ctrl` = resize) · `Esc` parent / cancel a tool or a cut · `P` / `I` / `F` palette, inspector, full screen.

**Tools shortcuts: `Ctrl+K`, release, then a letter.** Each one works only in the files it is about, so the same letter serves both families. They are **shown on the buttons of the Tools tab**, next to the tool, so there is nothing to look up.

| Delphi (`.pas` `.dfm` `.dpr`) | | PL/SQL (`.pks` `.pkb` `.sql` `.pls` `.plb` `.txt`) | |
|---|---|---|---|
| `Ctrl+K D` | Open the form designer | `Ctrl+K D` | PLDoc header |
| `Ctrl+K L` | Align components | `Ctrl+K Y` | Sync spec ⇄ body |
| `Ctrl+K N` | Anchors / docking | `Ctrl+K N` | New package |
| `Ctrl+K T` | TabOrder by position | `Ctrl+K G` | SQL from table |
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
- `ce.codeLensMemberActions` adds Edit / Delete code lenses above every member.

## Align selection & Delphi components

- **CE: Align Selection on Text…** (right-click a selection, or the `Ctrl+K Ctrl+A` menu) pads the selected lines so the first occurrence of a string you type (`:=`, `:`, `=`, `//`…) starts in the same column. Works in every language; with no selection it aligns the contiguous block around the cursor. Occurrences inside string literals are ignored.
- **CE: Add Delphi Component (.pas + .dfm)…** works like dropping a component on a form: pick a class (TButton, TEdit, TLabel, TCheckBox, TMemo, TPanel, TTimer…), a name and an event. The component is added to the text `.dfm`, its field and an empty handler to the `.pas` (and the needed unit to `uses`) in one undoable edit, then the cursor lands inside the new handler. An example form is in `test-fixtures/delphi/`.

### Sidebar tools (Member view → Tools tab)

- **Align selection**: type a string (or click `:=`, `:`, `=`, `=>`, `//`, `,`), select lines in the editor, click *Align*. Also shown when the cursor is outside any member.
- **Delphi components and events** are added in the **visual form designer** (palette by type, drop on the form, one-click event handlers): the sidebar no longer has its own *Components* form, since the designer does the same thing visually. The command palette keeps **CE: Add Delphi Component…** and **CE: Add Event Handler to Delphi Component…**.
- **Keyboard shortcuts** of the tools are shown on their buttons (see *Keyboard shortcuts*).

### More Delphi tools

- **Align shortcuts** are yours: type any string, click `+` to keep it, `×` to remove one. They are saved between sessions.
- **The .dfm follows the unit**: renaming a component field (explorer, Member panel…) renames the `object` in the `.dfm`, its references and its `<Component><Event>` handlers; deleting it removes the object, its children and the empty handlers; adding a field of a known component class offers to create the object. Handlers that contain code, or are shared, are never touched.
- **Third-party components** (DevExpress, TMS, JVCL…): any class name works. The tool learns size, caption, tab stop and events from the `.dfm` files already in your workspace, remembers the unit you typed for a class, and you can describe a class once in the `ce.delphi.customComponents` setting (`className`, `unit`, `width`, `height`, `namePrefix`, `events`, `props`, `tabOrder`). Third-party units are added to `uses` as written, never with the `Vcl.` scope.
- **DevExpress bars and styles**: `TdxBarDockControl` is drawn as the bar it docks (and linked to its manager from the inspector: *Bars → Bar manager*), `TdxBarManager` is a component of the form, and its bars and items (`TdxBar`, `TdxBarButton`, `TdxBarLargeButton`, `TdxBarStatic`, `TdxBarSubItem`, `TdxBarCombo`, `TdxBarEdit`, `TdxBarSeparator`…) and the `TcxStyle` of a `TcxStyleRepository` are parts of their holder: listed under it, added only inside it, never moved elsewhere; deleting a manager unlinks the dock controls that pointed to it.
- Examples: `test-fixtures/delphi/ComplexForm.*` (docked panels, page control, group boxes, DevExpress controls, a list view collection) and `LayoutForm.*`.

## PL/SQL (Oracle)

Files: `.pks .pkb .pck .pls .plb .prc .fnc .trg .sql`, and `.txt` **only when the text contains SQL / PL/SQL** (notes and logs are left alone). Package specs *and* bodies, stand-alone procedures / functions, triggers, anonymous `DECLARE … END;` blocks of a script and `CREATE TABLE` columns appear in the explorer. The parser understands nested subprograms, `END IF / END LOOP / CASE … END`, constants, exceptions, types, cursors and comments.

Tools → **PL/SQL (Oracle)** in the sidebar, the `Ctrl+K Ctrl+A` menu and the command palette (`CE PL/SQL: …`):

| Feature | What it does |
|---------|--------------|
| Synchronize spec ⇄ body | Finds subprograms declared on one side only and signature mismatches (Oracle needs them identical); declare in the spec, create an empty body (before the initialization section), or copy the signature either way. Works across `.pks` / `.pkb` or in one file. |
| New package | Spec + body skeleton from `name(params):Return; …`, with PLDoc headers |
| SQL from table | From a `CREATE TABLE` (selection, cursor or clipboard): SELECT / INSERT / UPDATE / DELETE / MERGE, with `:column` binds by default and optional `column=value` substitutions (`updated_at=SYSDATE`) |
| Extract procedure | Selection → new procedure with detected `IN` / `OUT` / `IN OUT` parameters (sizes stripped); locals used only there move inside |
| Declare variable | Type inferred from the body: `SELECT col INTO v FROM t` → `t.col%TYPE`, `FETCH c INTO r` → `c%ROWTYPE`, literals, `SYSDATE`, other variables |
| Exception block | `NO_DATA_FOUND`, `TOO_MANY_ROWS`, `OTHERS` with re-raise |
| PLDoc header | `/** … @param … @return … */` from the signature; running it again refreshes it and keeps your descriptions |
| utPLSQL tests | Test package generated from a spec |
| Go to definition / Find callers | `F12` / `Shift+F12` on `PKG.PROC` across the workspace |
| Review (Oracle) | `WHEN OTHERS THEN NULL`, `SELECT INTO` without `EXCEPTION`, `COMMIT` in package code, dynamic SQL by concatenation, `= NULL`, DML in loops, unclosed cursors, bad `RAISE_APPLICATION_ERROR` codes, unused variables / parameters, functions without `RETURN`, never-called private helpers |
| Align presets | Parameters (name \| mode \| type), declarations, `:=`, `=>`, `--`, `AS` |

Setting `ce.plsql.author` is written in generated headers. Nothing connects to a database: everything works on the source text.

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

### Visual form designer (Delphi) — five ways in: the icon in the title bar of a `.pas` / `.dfm`, **Form Designer** in the status bar (always visible while a unit or a form is being edited), right-click a `.pas` / `.dfm` in the Explorer or in the editor, the **🎨 Designer** button at the right of the sidebar's tab bar (it stays while the designer tab is the active one), and `Ctrl+K D` (`CE Delphi: Open Form Designer`; from the designer tab itself it brings the open designer back)

The text `.dfm` drawn as a form, next to the code. Where a change goes in the unit: a new component's **field is added right under the last component field** of the form class (before the first `private` / `public`), its handler declaration under the last method declaration, and the units it needs at the end of `uses` — a long list wraps onto the next lines instead of making one very long line. Fields declared on several lines, several names in one declaration (`A, B: TEdit;`) and comments among them are read correctly. Each change reaches VS Code as one tidy edit (overlapping removals merged, duplicates dropped); if the editor still refuses it, the message says why (read-only file, closed document…) and nothing is modified, and a document VS Code closed in the meantime is reopened before the next change. The VCL docking rules are applied (`alTop`, `alBottom`, `alLeft`, `alRight`, `alClient`, panels' bevels, page controls, splitters), so what you see is the layout Delphi would give.

- **Save**: the **💾 Save** button (and **Ctrl+S**, also while typing in an inspector field) saves the `.dfm` and the `.pas` together; a dot on the button says there is something to save. `ce.delphi.designerAutoSave` saves after every change instead.
- **Select** (click, Shift+click, drag a rectangle, outline list), **move** (drag, arrow keys, snapped to a grid), **resize** (handles; docked controls only expose the handle of their docking side), **drag into another container** (panel, group box, page…), **Delete**.
- **Palette**: VCL, **DevExpress** and **TMS** components with a filter, or any class by name (`Other class…`). Click for the default size, or draw the rectangle. Fields and `uses` (including the units the IDE adds for DevExpress / TMS) go into the `.pas`.
- **Inspector**, in collapsible sections: a card with the name and class and the breadcrumb of its parents, then **Position & size** (Left / Top / Width / Height in a grid, `Align`, `Anchors`), **Content** (caption / text, written the Delphi way, accents as `#233`), **State** (visible, enabled, `TabOrder`) and **Events**. Renaming a component renames its field and its handlers too. **Double-click** a component to create / open its default handler. With nothing selected the inspector shows how to use the designer.
- **Toolbar**, in groups: undo / redo · **align, size and distribute icons** (left / centre / right, top / middle / bottom, same width / height / size, space equally horizontally / vertically — enabled when two, or three for the spacing, components are selected; hover for the name) · zoom, grid, names, containers · panels and full screen · the *Code* button with its shortcut.
- **Two-way**: edits made in the text editor redraw the form at once, and putting the cursor on an `object` in the `.dfm` selects it in the designer.
- **Third-party components**: DevExpress (`Tcx…`, `Tdx…`) and TMS (`TAdv…`, `TTMSFNC…`) are drawn with a family look, their editors, radio groups, page controls (`TcxPageControl`, `TAdvOfficePager`), grids and non-visual controllers included; nested events such as `Properties.OnChange` are supported.
- **Classes it does not know are never altered.** They are drawn as a labelled placeholder (`?`), the rest of the form is unaffected if one of them cannot be drawn, and every action is checked before it is applied: if it would change anything other than what you asked for in the `.dfm`, it is **refused** and nothing is modified.

#### Designer: component lists, handlers and code ⇄ designer

- **The Components tree folds**: a ▾ / ▸ in front of every container hides or shows what it holds, **Expand all** / **Collapse all** act on the whole list, and a component selected on the form opens the containers above it. What is folded is remembered. (Filtered or flat lists have no tree to fold.)
- **The panels are resized with the mouse**: drag the thin bar between the palette and the form, or between the form and the inspector (double-click it for the default width); the component list can also be pulled taller by its bottom-right corner. Widths are remembered, and *Fit window* follows.

- **Palette** and **Components** are two collapsible lists on the left. The palette shows **one type at a time** (Standard, Additional, Win32, System, DevExpress, TMS — chosen in a drop-down that says how many components each holds), so it never lists everything at once; typing in its name filter searches every type. *Components* lists what is on the form with a filter by name (or class or caption), a filter by type (containers, non-visual, with event handlers, unknown classes, DevExpress, TMS, or a given class), sorting (form order, name, type, position) and a flat / tree switch. Click selects, Ctrl / Shift extend the selection, and a component on a hidden page makes the page tabs switch so you can see it.
- **Empty handlers disappear on save**, like in the Delphi IDE: on a manual save of the unit, a handler whose body is empty is removed — the method, its declaration and the `OnXxx = Handler` link in the `.dfm`. A body with a comment is not empty; autosave never removes anything. Setting `ce.delphi.removeEmptyHandlers`.
- **Copy, cut and paste components** (toolbar ⎘ ✂ 📋, or **Ctrl+C / Ctrl+X / Ctrl+V** in the designer): *copy* then *paste* duplicates the selection — with its children, its fields in the unit, its handlers and their code, names changed where they would clash — into the selected container, or the container around the selected component, or the form when nothing is selected. *Cut* dims the components until you paste them: pasting then **moves** the very same components (names, handlers and code unchanged) into the new parent — the easy way to move many components from one parent to another (**Esc** cancels the cut). The copy also goes to the clipboard in the format of the *CE Delphi: Copy / Paste components* commands, so it can be pasted into another form's designer (a cut pasted into another form is a copy). Tiles, grid parts and dataset fields only go into their own kind of host.
- **Double-click a component** in the designer: the code of its handler opens in the *same editor group*, so the designer stays one tab away. Back to the designer with its tab, the 🎨 button in the title bar of the unit, or **Ctrl+K Ctrl+B** (also from inside the designer to go to the code, as does the *Code* button, which shows the shortcut; **F12** is no longer used). `ce.delphi.designerColumn` can open the designer beside the code instead.

#### Designer: DevExpress tile control (`TdxTileControl`)

- The **tile control** is drawn with its title, its **groups** (`TdxTileControlGroup`) side by side and its **tiles** (`TdxTileControlItem`) flowing in columns by size (small, regular, large, extra large), with the tile colour and texts. Groups and tiles have no `Left` / `Top` in the `.dfm`: the control places them, so they are selectable but never dragged, and a tile cannot be moved out of its control.
- **Add** them from the palette (type *DevExpress*): select the tile control (or any of its tiles) and click `TdxTileControlItem` / `TdxTileControlGroup` / `TdxTileControlDetailSite`, or arm the tool and click the control on the form. A new tile goes to the last group; a new group gets the next `Index`. Nothing but tiles, groups and detail pages can enter a tile control.
- **Inspector of a tile**: `Text1`, `Text2`, `Size`, and the **Group** it belongs to (`GroupIndex`); of a group: its caption. The **detail page** (`TdxTileControlDetailSite`) is an ordinary container; when hidden it is drawn only while it, or something in it, is selected.
- **Events** with their real signatures: `OnClick`, `OnActivateDetail`, `OnDeactivateDetail` of a tile (`Sender: TdxTileControlItem`), `OnItemActivateDetail`, `OnItemDeactivateDetail`, `OnItemCheck` of the control (`Sender: TdxCustomTileControl; AItem: TdxTileControlItem`). The unit's `uses` receives `dxCustomTileControl` and the other DevExpress units, once.

#### Designer: the events of a component in a drop-down

The **Events** section of the inspector has **one drop-down listing every event of the selected component** (from the catalog: standard VCL, DevExpress, TMS), in two groups:

- **Create a handler**: the events that have none yet, each with the name the handler *will* have (`OnClick → Button1Click`). Picking one creates it — method and declaration in the unit, `OnXxx = Handler` in the `.dfm` — as one undoable step. The code stays closed so that you can create several listeners in a row, unless you tick **open the code after creating** (remembered).
- **Open the code of**: the events that are already wired (`● OnClick → Button1Click`); picking one opens its handler. The wired ones are also listed under the drop-down.
- **Other event…** shows a text box to create any event by name (`OnMouseEnter`, `Properties.OnChange`…); it is the way to add events of a class the designer does not know, whose own list stays empty rather than guessing.
- Handlers use the signature of the component's own event (`Sender: TdxTileControlItem`, `AButtonIndex: Integer`…), also in *Check form* and *Add event handler*.

#### Designer: DevExpress grid (`TcxGrid`): levels, views and columns

- The **levels** (`TcxGridLevel`), **views** (`TcxGridDBTableView`, `TcxGridTableView`, banded, card… of any flavour) and **columns** (`TcxGridDBColumn`…) of a grid are components nested in it, with no `Left` / `Top`. They are **listed in the Components tree** under their grid and edited in the inspector.
- The grid **draws the columns of the view its first level shows** as header cells, side by side with their `Width`, the `Caption` (else the field, else the name), the group-by band unless `OptionsView.GroupByBox = False`, and `OptionsView.ColumnAutoWidth` stretching them. A column with `Visible = False`, or of another view, is listed but not drawn. Click a header to select the column; columns are placed by the grid, so they are never dragged or moved out of their view.
- **Inspector**: a column — caption, field (`DataBinding.FieldName`), width, visible; a level — the view it shows (`GridView`); a view — its columns, one click to select each.
- **Add** from the palette (type *DevExpress*): *Level*, *TableView*, *DBTableView* go into the grid, *Column*, *DBColumn* into a view (the selected one, the one of the selected column, or the view the selected grid shows). They are named like the IDE does (`cxGrid1DBTableView1`, `cxGrid1DBTableView1Column1`), with the field in the `.pas` and the units in `uses`.
- **Delete** a view and its columns go with it, and the level that showed it is unlinked (the IDE does the same: it would not load otherwise). Renaming a view follows the level.
- **Events** with the signatures of the DevExpress reference: `OnCellClick`, `OnCellDblClick`, `OnFocusedRecordChanged`, `OnSelectionChanged`, `OnEditValueChanged`, `OnCustomDrawCell` of a view; `OnGetDisplayText`, `OnCustomDrawCell`, `Properties.OnEditValueChanged` of a column.
- *Check form* now reads declarations whose parameters wrap onto several lines (the long grid handlers) as methods, not as fields.

#### Designer: components with no position, and what a component holds

- **Every component of the `.dfm` is loaded.** A component that the IDE wrote without a `Left` / `Top` (a `TUniQuery`, a connection, a data source, a style repository… placed at 0 or saved by another tool) is no longer dropped: it is drawn as a small icon in a **tray along the bottom edge of the form**, with a tooltip that says why. The same tray receives a non-visual component whose position is **outside the form** (`Left = 1200` on a 520 pixel form: the IDE hides it, the designer brings it back and tells you its real position). The `.dfm` is not touched until you move one of them, which writes its first position.
- **`DesignInfo`** — the place the IDE keeps for some components (image lists, DevExpress controllers…) instead of `Left` / `Top`, the left in its low word and the top in its high one — is read, and moving such a component rewrites `DesignInfo`, never a `Left` / `Top` beside it. Image lists and image collections are components, not controls, whatever their `Width` / `Height` (the size of an image).
- **Non-visual by the name of the class** too: `…Query`, `…Table`, `…Connection`, `…DataSource`, `…Timer`, `…Dialog`, `…ActionList`, `…Controller`, `…Manager`, `…Repository`, `…Provider`, `…ImageList`, `…Link`… of UniDAC, FireDAC, ADO, DevExpress, TMS and the VCL, with no need of a catalog entry. A component that is not a control lives **on the form itself**: it cannot be moved into a panel, nothing is pasted into it, and one dropped on a panel from the palette goes on the form.
- **Parts with no place of their own** — the styles of a `TcxStyleRepository`, the items of a `TcxEditRepository`, the groups and items of a `TdxLayoutControl`, menu items, actions… — are **listed under their parent** in the Components tree, edited in the inspector, never painted and never moved out of their parent. They used to be left out of the model altogether. A repository holds styles, not controls, so it is no container for a drop.
- A data module (no `Caption`, no `ClientWidth`) uses its whole `Width` × `Height` as the surface, not the size of a form without its frame.
- **A component with no name** (`object TcxGridDBColumn` with no `Name: `, which the IDE accepts) no longer cuts the form short: its `end` closed the parent, and everything after it was lost. It is loaded under a name of its own (`TcxGridDBColumn_1`), shown as a part, and never renamed or given a field in the unit. *Check form* says that it has no name.
- **Declarations that wrap** (`procedure Name` on one line and `(Sender: …);` on the next, or `procedure TForm.` followed by the name) are read as one: the class members, the empty handlers removed with a component or by *Check form*, and the code review (a method is no longer "declared but has no implementation" because its header is on several lines; a continuation line is no longer a field).
- **Code review**: a form that descends from a base form of the project (`THadHocFormListe`) is recognised by its published fields, so its components are not counted as members; a variable assigned inside an anonymous method is not "uninitialized"; adding a line break to a SQL literal (`'…' + CRLF`, `#13#10`) is not reported as SQL built from pieces.

#### Designer: the View menu, find, marks, compare, sizes and layouts

Nothing here adds a button to the toolbar: it all sits in one **👁 View** menu (and a few shortcuts).

- **View menu**: names of the components, containers, **TabOrder numbers** (duplicates in red), rulers, and a **theme preview** (light, dark, blue, high contrast) for DevExpress forms. *Renumber TabOrder by position* sets the order to the top-left to bottom-right reading order.
- **Find in the form** (`Ctrl+F`): a small bar that matches name, class, caption and event handlers; `Enter` goes to the next match.
- **Handler preview**: hover the ⚡ badge of a component to see the first lines of its event handlers, without leaving the designer.
- **Groups of components**: save the selection under a name (kept per form), select it again with one click.
- **Lock and hide** (`Ctrl+L` / `Ctrl+H`): a locked component cannot be moved, resized or deleted; a hidden one is only hidden in the designer (never in the `.dfm`). *Show hidden and unlock all* undoes both.
- **Equal spacing**: when you move a component, it is pulled to the gap that its neighbours have (or the middle between two), the gaps drawn with their size. It is one of the choices of the 🧲 Snap menu.
- **Compare with a git version**: asks for `HEAD`, a branch, a tag or a commit, then marks on the form what was **added** (green), **changed** (blue), **moved or resized** (orange) and draws the **removed** ones as dashed red ghosts where they used to be; a thin bar counts them and closes the comparison.
- **Test other form sizes**: shows the form at 640×480 … 1920×1080 (or any size) as `Align` and `Anchors` would lay it out, and marks in red what a new size breaks: a component pushed out of its container, or two that now overlap. The `.dfm` is never touched.
- **Layouts**: save the selected panel (with its content, fields and handlers) under a name, then insert it from the View menu in any form.
- **Several components at once**: `Ctrl` / `Shift` + click (on the form or in the list) adds to the selection; the inspector then shows **Common properties** (position, size, Align, Anchors, Visible, Enabled, colours, Hint), blank or undetermined where they differ, and a change goes to every selected component. The left column lists the components above the palette.

#### Designer: from the code to the forms

- **A handler that opens a form**: the 🗗 button of a wired event reads the handler, follows the methods it calls (two levels) and opens the designer of the form it creates or shows (`TfrmX.Create`, `Application.CreateForm`, `frmX.ShowModal`…) or names in a text (`fAfficheListe('TfrmTIERSFiche', …)`: the name is looked up among the forms of the `.dpr`). The units of the workspace are read once and again after a save.
- **A panel that holds a form**: `fAddFormInto(oForm, pnl)` (add your own helpers to `ce.delphi.hostCalls`) and `oForm.Parent := pnl` link the panel to the form it hosts: a 🔗 badge on the panel and a *Hosted form* section in the inspector that opens its designer.
- **Captions** run on several lines (Enter, written `#13#10`) with a *Word wrap* check box for the classes that have one; **Ctrl+K Ctrl+F** toggles the full screen.

#### Quick actions, status bar menu and moving between members

- **Quick actions** (`Ctrl+K Ctrl+A`, or the *Code Explorer* submenu of the right-click menu): every command that suits the file, grouped, with its shortcut. **One status bar item** (language, accents warning) opens the same kind of menu: designer, structure, language, encoding, memo, guide.
- **Moving between members** without a mode: `Ctrl+Shift+Down` / `Ctrl+Shift+Up` next / previous member, `Alt+Enter` declaration <-> implementation, `Alt+G` pick a member by typing a few letters (the code scrolls to each one, Esc goes back).
- **Structure tab**: Up / Down, Enter, F2, E, Delete on the members; the tab bar stays on one line and each language comes back to its last tab.

#### Designer: right-click, rename and keyboard

- **Right-click** a component (on the form or in the list) for its menu: cut, copy, paste, duplicate, rename, default handler, parent, lock, hide, delete. **F2** renames in place. **Tab / Shift+Tab** walk the components, **Enter** opens the default handler, **0** / **9** set 100% / Fit window, **/** goes to a component by name. The menu also copies and pastes an *appearance* and brings to front / sends to back; the inspector has a *Filter properties* box.

#### Designer: the Tools menu

- **🛠 Tools** (top toolbar): **Anchors / docking** of the selection (default, right, bottom, stretch, from position…), **Duplicate** (`Ctrl+D`), **Change class…**, **Check the form…** (the .dfm against the unit, with the safe fixes applied in one go), **Clean the handlers…**, **Form from fields…** and **Form from a class…**. They used to be in the sidebar's Tools tab, which now keeps *Open the designer* and *Project insights*; the commands are still in the command palette.

#### Designer: DevExpress bars and TeeChart

- **Bars**: a `TdxBarDockControl` shows the bars docked in it (`DockControl`) with the captions of their items (`ItemLinks`): buttons, static texts, sub-menus with ▾, combos, a separator where a group begins. A `TdxBar` and each item of a bar are edited in the inspector (caption, hint, image, shown / hidden, the dock control of a bar, the items of a bar); a bar with no dock control is listed but not drawn.
- **TeeChart**: `TChart` / `TDBChart` (palette, *TeeChart*) are drawn as a plot with title, legend and sample values for each series; the series and the tools (`TDragMarksTool`…) are listed in the chart, added from the chart's inspector or the palette, and edited. The data of a series is not drawn: it comes from the code or the DataSource.

#### Designer: menus

- **`TPopupMenu` / `TMainMenu` and their `TMenuItem`s** (palette, *System*): the items and sub-items are listed under their menu, never painted. Select a menu to see a **preview** of it and to add items; select an item to edit its caption (`&` marks the access key, `-` is a separator), **shortcut** (typed as `Ctrl+Shift+S`, written as the number the IDE stores), checked / auto-check / radio / default, enabled, visible and image, and to add sub-items or a separator. Deleting an item deletes its sub-items; an item never leaves its menu by drag or paste.

#### Designer: zoom, scroll, colours, magnetism, fields

- **Zoom** with `Ctrl` + wheel (25 % to 300 %), around the pointer; the zoom list shows the value in between the presets. The **middle button** pans the form. The scroll bars are wide enough to grab, in the colours of the theme; a **DevExpress grid** draws its own scroll bars (vertical, and horizontal when its columns are wider than it): click one to select it, drag it to scroll the columns, and pick which bars the view has in the inspector (*Scroll bars*).
- **Colours**: the designer draws what the `.dfm` says, system colours (`clWindow`, `-2147483643`) and `TcxStyle` of a style repository included (`Style = stRed`, `Styles.Content`, `Style.Color`, `AssignedValues`), and what comes through `ParentColor` / `ParentFont`. The **Colors** section of the inspector has a colour picker for Color and Font color (written as `clRed` or the number, as the IDE does), says where the colour comes from (*Style = stRed*, *ParentColor of pnlTop*), and **Clear** removes it.
- **Magnetism** (toolbar, 🧲 *Snap*, as in Affinity Designer): a component being moved or resized catches the **edges and centres** of the other components of its container and the edges and centre of the container itself, with pink **guide lines**; the arrow beside the button chooses what is caught (edges, centres, container, guide lines). It is on top of the grid; hold `Alt` while dragging to turn it off for a moment. The choice is kept.
- **Fields**: a query (`TUniQuery`…) has a **Fields** block in the inspector, as the IDE's field editor: the persistent fields, **＋ Add field**, **⟳ From the SELECT** (one field per column of the SELECT that has none, named `qryTARIFListeTARIF_ID`, with a type guessed from the name — `_ID`, `_NUM`, `QTE`… float, `DATE`/`DT_` date and time, else string of 50 — to correct afterwards), select one to edit its name, type properties, label and size, or 🗑 delete it. A **grid view** has the same for its **Columns**: **＋ Add column** and **⟳ From the fields** (the persistent fields of the dataset its `DataController.DataSource` leads to, else the columns of its SELECT), one column per field, named after the view, with its `DataBinding.FieldName`.
#### Designer: UniDAC and data components

- **UniDAC** (Devart): `TUniConnection`, `TUniTransaction`, `TUniQuery`, `TUniTable`, `TUniStoredProc`, `TUniSQL`, `TUniScript`, `TUniUpdateSQL`, `TUniDataSource`, `TUniMetaData`, `TUniEncryptor`, `TUniDump`, `TUniLoader`, `TUniAlerter`, `TUniConnectDialog` and the **provider** components (`TOracleUniProvider`, `TSQLServerUniProvider`, `TMySQLUniProvider`, `TPostgreSQLUniProvider`, `TSQLiteUniProvider`…) have their own palette type, with the units the IDE adds to `uses` (`Uni`, `DBAccess`, `MemDS`, `UniProvider`, `UniScript`…). They are non-visual: drawn as small icons that say what they are (🔌 connection, 🗃 query / table, 🔗 data source, 🧩 provider, 📜 script), with the server of a connection or the first lines of the SQL in the tooltip. A **UniDAC** tag marks them in the Components list, which can be filtered to them.
- **Standard data classes** are there too, whatever the library: `TDataSource` (palette type *Data*), and the datasets of FireDAC, ADO, BDE and `TClientDataSet` are recognised as datasets.
- **Persistent fields** (`TStringField`, `TIntegerField`, `TFloatField`, `TDateTimeField`… — palette type *Fields*) are the components nested in a dataset in the `.dfm`. They are **listed under their dataset** in the Components tree and edited in the inspector: field name, label, size, display width, required, read only, visible. They are never painted, never dragged and never moved out of their dataset; add some from the palette while the dataset (or one of its fields) is selected, named after it (`UniQuery1Field1`) — set the `FieldName` afterwards. A control whose class merely ends with `Field` is an ordinary control.
- **Inspector, "Data" section**: a connection — provider (Oracle, SQL Server, MySQL, PostgreSQL, SQLite…), server, database, user, port, login prompt; a dataset, SQL, script, transaction… — the **connection** it uses (a list of the connections of the form); a table — `TableName`; a query — its **SQL**, in a text box with *Apply SQL* (written as `SQL.Strings`, long lines cut in pieces of 64 characters like the IDE does, nothing else in the component touched); a data source — its **dataset**. The password and `Connected` / `Active` are never offered: they stay as written (switching them would open the database each time the form loads in the IDE). A non-visual component has only a design-time position (no size, align or visibility).
- **Events** of datasets and connections use the signatures of the Devart reference and of `Data.DB`: `AfterOpen`, `BeforePost`, `OnNewRecord`… (`DataSet: TDataSet`), `BeforeFetch` / `AfterFetch` / `AfterExecute`, `OnError`, `OnConnectionLost`, `AfterConnect` of a connection, and `OnGetText`, `OnSetText`, `OnChange`, `OnValidate` of a field. The designer now recognises `Before…` / `After…` properties as events (they used to have to start with `On`), so they appear wired in the drop-down, are checked by *Check form* and renamed with their component.
- **Delete** a connection and the datasets that used it are unlinked (`Connection` removed), delete a dataset and its fields go with it and the data sources pointing to it are unlinked, as the IDE does; handlers that hold code are kept. **Rename** a connection or a dataset and every link follows.
- Example: `test-fixtures/delphi/UniForm.*`.

#### Designer: room for complex forms

- **Hide the side panels**: *◧ Palette* (the palette and the component list, key **P**) and *Inspector ◨* (key **I**) in the toolbar. A hidden panel leaves a small tab on its edge: click it to bring the panel back. The choice is remembered.
- **Zoom → Fit window** scales the form to the room that is left, and follows the window and the panels as they change.
- **⛶ Full screen** (key **F**) hides both panels and asks VS Code for its **Zen mode** (no side bar, no status bar, full screen), then fits the form to the whole screen. Press it again to get the panels and the VS Code interface back. If you leave Zen mode yourself (`Esc Esc`), press the button twice to resynchronise it. Closing the designer leaves Zen mode too.

#### Designer: seeing and changing a component's parent

- **The parent is always visible.** Select a component and its parent container is outlined with an orange dashed frame and a `⬑ parent: name : class` tag. The inspector starts with a breadcrumb (`Form › pnlCentre › pgcDetails › … › edtNom`) where each ancestor is clickable, and the status bar shows the same path.
- **Containers** checkbox in the toolbar: every container is outlined and named, with a colour per nesting depth. Even with it off, the container under the pointer is outlined with its name and class.
- **Move to another parent**, four ways: drag the component onto another container (the target turns green and a tag says `Drop into … : class`; dropping on the form itself takes it out of its container); pick one in the inspector's **Parent** list (the component stays where it is on screen when possible); drag a row of the Components list onto a container row, or onto the `⌂ form` row at its top; or drag a *docked* control (alTop, alClient…) — it keeps its `Align`. A component is always kept inside its new parent, and never goes into itself or its own children.
- **Esc** selects the parent of the selection (the usual Delphi habit); it first cancels the palette tool if one is armed.

#### Project panel: SQL, unused code, form checks, and what changed in a form (`Ctrl+K I`, `CE Delphi: Project…`)

Things that neither OmniPascal nor VS Code do, because they need the `.dfm` and the `.pas` together. **Nothing is read until you press *Scan the project*** — no watcher, nothing at start-up. A scan reads the files a few at a time and gives the editor back between two batches, it can be cancelled, and it remembers every file (by its date and size) so the next one only reads what changed. A project of a thousand units is read in a few seconds the first time, and in a fraction of a second after.

- **SQL** — every statement of the project: the `SQL.Strings` of the queries of the forms, `Q.SQL.Text := …` and `Q.SQL.Add(…)` in the code (consecutive `Add` calls are one statement; what the code adds at run time shows as `?`), and the calls to queries kept by number (`AsyncRQSQL(Pool, 46805, …)`). Each statement shows its kind, its **tables** and its **`:parameters`**. Type a table, a column, a parameter or a query number in the filter to find where it is used; the most used tables are chips to click. A click on a row opens the file at the line.
- **Unused** — the units of the project listed in a `uses` clause of which the unit uses nothing (a unit with an `initialization` section is marked: it may work by being linked); the non-visual components (queries, data sources, image lists, timers…) that neither the code nor another component refers to; and the `ParamByName('x')` of a query whose SQL has no `:x`, or a `:parameter` that is never given a value. These are hints: check before removing.
- **Form checks** — *Check form* run on every form of the project, errors and warnings only, to see which forms are out of step with their units without opening them.
- **Form checks** also lists the **grid columns that show a field their query does not return** (`DataBinding.FieldName` against the `SELECT` of the dataset the view is bound to; a `select *`, a persistent field or a dataset filled by the code is left alone). On a real form it found columns bound to a field that was not selected.
- **Texts** — the captions, hints and titles written in the forms, grouped by meaning (case, accent, `&` and a trailing `:` or `…` change nothing), the ones written in several ways first (`Statut Commande` / `Statut commande`). Filter them, or **export them to CSV** for a translator.
- **Names** — the names of the components against the convention **the project already follows**: the prefix most components of a class carry (at least 60 % of three or more: `btn`, `edt`, `cxgtv`…). The components that depart from it, or still carry the name the IDE gave (`Button1`), come with a suggested name and a **Rename** button (or *Rename all* for a form) that changes the `.dfm` and the unit together and leaves them modified, so undo is there. `ce.delphi.namingPrefixes` sets a prefix by hand for a class.
- **Forms** — the forms by the class they descend from (`THadHocFormListe` and its unit), with how much of a visual descendant is inherited and how much is its own. In the designer, a component written `inherited` in the `.dfm` has a dashed outline and cannot be deleted or renamed there, as in the IDE.
- **Hotspots** — the units that are often changed and hard to change: commits of the last year (one `git log` for the whole project, asked only when the tab is opened) weighted by size and long routines.
- **Changes** (`Ctrl+K B`, `CE Delphi: Compare the Form with a Git Version`) — the open form against a commit, a branch or `HEAD`, **component by component**: added, removed, moved to another parent, other class, properties and event links that changed (the text of `SQL.Strings` included). A component is found by its name wherever it went, so reordering, reindenting and the IDE rewriting positions are not changes; positions and sizes are hidden unless asked for.

#### Structure: routines declared inside a routine

A Pascal routine can declare routines of its own between its header and its `begin` (`procedure Calc; … begin … end;` after the `var` section, to any depth). **Structure** lists them under the routine that holds them (`↳ Calc  procedure`), a click goes to their line, and the filter finds the routine by the name of what it holds. They are not members: no edit, rename or delete. The end of a routine that holds others is now its own `end;`, not the first one met, which also fixes the range of such a method (its body, the review, *Go to implementation*).

#### Sidebar → Shortcuts: every keyboard shortcut, by mode

The **Shortcuts** tab lists all the shortcuts of the extension, grouped by the mode they work in: *any code file* (Structure, actions menu, edit member), *any editor* (align on a string, memo), *Delphi units and forms*, *PL/SQL sources* (the same `Ctrl+K` letters mean other commands there), the **form designer** (save, copy / cut / paste, undo, select, move and resize with the arrows, panels, full screen, and the mouse gestures, drawn with dashed keys) and the *sidebar* itself. A filter narrows the list as you type (a key, a word of the command, a mode). The editor shortcuts are read from the keybindings of the extension, so the list is always what VS Code really binds; **⚙** opens VS Code's Keyboard Shortcuts editor on them to change one.

#### Sidebar → Memo: Markdown notes

The **Memo** tab keeps your notes as Markdown files. It starts with a **main** memo (`main.md`, created for you), and you can create **as many others as you want** with **＋ New memo**: they are listed in the tab, pick one to read or write it (an *empty* mark shows the ones with nothing written yet).

- **Edit** as plain Markdown, saved as you type; **Preview** to read it. A memo that has text opens as a preview.
- **📖 Open as page** shows the memo in the application's Markdown page (headings with an outline, to-do boxes you can tick, tables, a `/` menu to add blocks as in Notion). **📝 Text** opens the same file in the text editor. **🗑** moves a memo to the trash (main stays).
- In the preview, **task lists** (`- [ ] step`) can be ticked and stay ticked; every **fenced code block** has **Copy** and **Insert** buttons, the latter writing the block at the cursor of the editor (or on every cursor / selection); `code`, **bold**, *italic*, quotes, lists and `https` links work too. Nothing in the text can run: it is escaped, and links only open from the extension.
- The files are plain `main.md`, `release-notes.md`… in the extension's own storage, or in the folder of the `ce.memo.folder` setting (a relative path starts at the workspace, so the memos can be versioned with the project and shared with the team). A memo saved from the editor refreshes the sidebar. Memos written by earlier versions per language (`pascal.md`, `general.md`…) are in the list like the others.
- `Ctrl+K Ctrl+N` or **CE: Open Memo** opens the tab.

#### Sidebar → Tools: one page per set of tools

The Tools tab is split into sub-tabs, and only the ones that apply to the active file are shown: **Form** for a Delphi unit (visual designer, layout and checks; components and their events are added in the visual designer, which does it visually: the sidebar no longer duplicates it); **PL/SQL** for Oracle files; **Align** for everything. The last sub-tab you used is remembered.
