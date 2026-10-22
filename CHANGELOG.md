# Changelog

Every release of Code Explorer, newest first. The sidebar shows the same list, folded, at the bottom of each tab.

## 0.1.17 — 2026-10-22
- Sidebar: **Changelog + Guide** is a view of its own below Member, folded until opened, instead of a block at the bottom of every Member tab.

## 0.1.16 — 2026-10-22
- **User guide** with pictures and animations (GIF) of the form designer: open the form designer, add a component, magnetism, several components at once, find, the View menu, compare with git, form sizes, menus, and the sidebar. It opens from the sidebar and from **CE: Open the User Guide**.
- Sidebar: the folded section is now **Changelog + Guide**: one line per guide topic, then the versions.
- Designer: the form size test fits the zoom to the size tested when *Fit window* is on.

## 0.1.15 — 2026-10-22
- Designer: **menus**. `TPopupMenu` and `TMainMenu` are in the palette (System) with `TMenuItem`; an item and its sub-items are listed in the tree, edited in the inspector (caption, shortcut written as `Ctrl+O`, checked, auto-check, radio, default, enabled, visible, image) and added or deleted, with a separator button and a live preview of the menu.

## 0.1.14 — 2026-10-22
- Sidebar: a **Changelog** of every version, folded at the bottom of each tab (the newest version open, the installed one marked). It is the `CHANGELOG.md` of the extension.

## 0.1.13 — 2026-10-21
- Designer: the component list is above the palette in the left column.
- Designer: with several components selected, the inspector edits what they share (position, size, Align, Anchors, Visible, Enabled, colours, Hint); a change goes to all of them, and differing values show as mixed.

## 0.1.12 — 2026-10-21
- Designer: one **View** menu (names, containers, TabOrder numbers with duplicates in red, rulers, theme preview light / dark / blue / contrast) instead of loose check boxes.
- Designer: `Ctrl+F` find bar (name, class, caption, handler); renumber TabOrder by position.
- Designer: hover the ⚡ badge to read the first lines of the event handlers.
- Designer: named groups of components, lock (`Ctrl+L`) and hide (`Ctrl+H`), kept per form.
- Designer: equal-spacing magnetism, with the gaps drawn and measured.
- Designer: compare the form with a git version (added, changed, moved, removed shown as ghosts).
- Designer: test other form sizes (what Align and Anchors do, with out-of-bounds and overlaps marked).
- Designer: layouts saved by name and inserted in any form, with their fields and handlers.

## 0.1.11 — 2026-10-21
- Designer: the scroll bar of a DevExpress grid is drawn above the columns, takes the click and the drag, and scrolls the columns sideways.

## 0.1.10 — 2026-10-21
- Designer: the scroll bar of a DevExpress grid can be selected (`OptionsView.ScrollBars` of its view in the inspector).

## 0.1.9 — 2026-10-21
- Grid style sheets are found in the data module named in the `uses` of the form's unit, banded sheets and style repositories included.

## 0.1.8 — 2026-10-21
- Designer: grid style sheets (this form or the data module that holds them), invisible components greyed in the list, `TAdvSmoothLabel` fill and gradient.

## 0.1.7 — 2026-10-21
- Designer: magnetism guide lines are thin and only as long as the components they line up.

## 0.1.6 — 2026-10-21
- New version number so that installing the package really replaces the old one.

## 0.1.5 — 2026-10-21
- Designer: magnetism (components catch the edges and centres of their neighbours and container, guide lines, `Alt` to bypass); word wrap drawn; small faint icons for non-visual components.
- Designer: colours (system colours, DevExpress styles, `ParentColor` / `ParentFont`, colour picker); `Ctrl`+wheel zoom and middle-button pan; scroll bars on DevExpress grids.
- Designer: field editor for queries and column editor for grid views.
- **CE: Fix Encoding** (accents) with a title-bar button and a status item.
- Rename Variable stays in the file; the Structure filter is emptied on another file.
- An icon for the extension and the activity bar; README with the features at a glance.

## 0.1.4 — 2026-10-20
- DevExpress bars and styles in the designer; routines declared inside a routine in Structure.
- Language drop-down in Tools: choose a language by hand for unknown files (per file or per extension).
- Project panel: SQL of the project, unused code, form checks, semantic `.dfm` diff, grid, texts, names, forms, hotspots.
- Designer: every component of the form is loaded (queries, connections, controllers with no position), tray, `DesignInfo`, parts; nameless components and wrapped declarations.
- Sidebar: Shortcuts tab; designer reachable from the status bar, Explorer, editor menu and the tab bar.

## 0.1.3 — 2026-10-19
- Code review: compiler-style rules with their codes for every language, language-server diagnostics merged.
- Structure: usages and variables under the selected member, compact Add.
- Designer: save, copy / cut / paste, folding tree, resizable panels, safer edits; UniDAC components, datasets and persistent fields; DevExpress grid parts; events drop-down; align icons; hideable side panels, Fit window zoom and full screen.
- All `MMX` names became `CE` (commands, settings, views).

## 0.1.2 — 2026-10-19
- **Delphi visual form designer**: DevExpress / TMS catalog, `TdxTileControl` with its tiles, palette by type, filterable component lists, clickable event list, code ⇄ designer switch.
- Sidebar: the Add / Delete tab became Structure; tools shortcuts; Memo tab.

## 0.1.1 — 2026-10-18
- Delphi: align / anchors / tab order, form check, copy-paste, form generation, class change, custom align shortcuts, spacing, third-party components, `.dfm` sync.
- PL/SQL: robust parser, `.txt` / `.sql` sniffing, sync, generators, extract, review, navigation.
- Sidebar tabs (Actions / Add-Delete / Tools); tools to align on a string; shortcuts, lenses, language-server rename and workspace index; unified variable refactoring.

## 0.1.0 — 2026-06-19
- First version: class explorer for C++ and Pascal, with quick fixes that generate method bodies, getters and setters.
