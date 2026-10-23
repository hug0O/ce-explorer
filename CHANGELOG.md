# Changelog

Every release of Code Explorer, newest first. The sidebar shows the same list, folded, at the bottom of each tab.

## 0.1.22 — 2026-10-23
- Designer: **Snap & Grid** are one titled group of the toolbar (its tooltip says what each is for: the magnet that catches neighbours, the grid step that rounds moving and resizing), and the grid offers many more steps: off, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 48 and 64 px, for exact placing.
- Designer: a **double click on the fold handle** of the components opens the panel as wide as the longest line of the list, so every name and class is readable.

## 0.1.21 — 2026-10-23
- Designer: the **palette is folded by default** (and remembers how you left it); a **bar between the components and the palette** gives more room to one or the other (double-click: default).
- Designer: each side panel has a **fold handle** on its edge, a small chevron tab that hides or shows it (it stays on the window edge while the panel is hidden), instead of the vertical text tabs.
- Designer: the **Grid** drop-down now has a tooltip: the step in pixels that moving and resizing snap to, and what Shift + arrows move by.

## 0.1.20 — 2026-10-23
- Designer: **grid column ⇄ query field**. On a `TcxGridDBColumn` the inspector shows the persistent field of the query behind its view (`DataController.DataSource` → `DataSet`), jumps to it with a click, and edits its `DisplayLabel` and `DisplayWidth` from the column; on a field it lists the columns that show it. A column with no persistent field says so.
- Designer: chart tools `TSeriesBandTool`, `TColorBandTool`, `TGridBandTool`, `TDragPointTool`, `TNearestTool` (palette and chart inspector); `TChartBook` is drawn with a tab per chart.
- Designer: **full screen** turns off the centred layout of Zen mode while it lasts (and puts your setting back), so the form gets the whole width.
- Designer: the placeholder of a `TImage` is a faint dotted frame with a small icon.

## 0.1.19 — 2026-10-22
- Designer: **tile control layout as Delphi lays it out**: tiles go in their order, row by row, in a band as wide as the widest tile of the group (two cells when a large tile is there), a tile that does not fit leaves its hole, a new column starts after `GroupMaxRowCount` rows, and `RowCount` / `ColumnCount` of a tile are honoured (a regular tile two rows high).

## 0.1.18 — 2026-10-22
- Designer: **DevExpress bars**. A `TdxBarDockControl` draws the bars docked in it with their items (buttons, static texts, sub-menus, combos, separators between groups); a `TdxBar` and its items (`TdxBarButton`, `TdxBarStatic`, `TdxBarSubItem`…) have their own inspector (caption, hint, width, shown or hidden with `ivAlways` / `ivNever`, dock control of a bar, the list of its items).
- Designer: **TeeChart**. `TChart` and `TDBChart` are in the palette (TeeChart) and drawn as a plot with the title, the legend and sample values for each series in its colour (bars, horizontal bars, lines, areas, points, pie). Series (`TBarSeries`, `TLineSeries`, `TAreaSeries`, `TPointSeries`, `TPieSeries`…) and tools (`TDragMarksTool`, `TAnnotationTool`…) are listed in the chart, added from its inspector or the palette, and edited (title, colour, active, marks); the chart title, legend and 3D view too.
- Designer: the tile control honours its own `OptionsView.ItemIndent`, `GroupIndent`, `IndentHorz` and `IndentVert`, and a large tile is exactly two regular cells wide.

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
