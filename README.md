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
