# Changelog

Every release of Code Explorer, newest first. The sidebar shows the same list, folded, at the bottom of each tab.

## 0.1.53 — 2026-10-28
- **Code review: grouped, and a kind of finding can be ignored.** A new order, *Grouped by category*, puts a heading with a count over each category. Each finding has a **✕** (shown when you point at it): *ignore this kind of finding in this workspace* — by its compiler or linter code (`H2164`…), else by its category. The ignored ones disappear from the list and the counts; a line *N ignored finding(s)* has a *show them* button, and **↩** on a shown one takes it back.
- **Templates: search and favorites.** A search box at the top of the Templates view hides what does not match (name, prefix, description, languages) as you type, with its headings, and remembers the text; `Esc` clears it. The **☆ / ★** of each template puts it in a *Favorites* section at the top, for every file, whatever the language filter says.
- **Messages with a next step.** The plain messages become ones with buttons: *No active editor* offers *Open a file…* and *Go to file…*; *Place the cursor on a class member first* offers *Pick a member…* and *Show the structure*; failures (move, add, analytics, memo, form checks, start-up) offer **Show the log** — a new command *CE: Show the log* — and, where it helps, *Check the form*, *Show the structure* or *Reload the window*.

## 0.1.52 — 2026-10-28
- **Blueprint: the flow of a routine** (Delphi / Pascal). Select a routine, then *Show its flow* in the details panel: its statements become nodes in the order they run — calls, assignments, `if` (with *yes* / *no*), loops that come back to their start and leave by *done*, `case` with its labels, `try … except / finally`, `Exit` / `Break` / `raise` — from a green *start* to the *end*. The nested routines, the comments and the strings are not mistaken for code.
- It is a view to read: double-click a step (or *Open the code here*) to go to its line; change the code and the flow is drawn again; *← Calls* goes back to the graph of the file. The search, *hide others* and the zoom work on it too.

## 0.1.51 — 2026-10-28
- **Blueprint of the project** (*CE: Blueprint of the project (units and uses)*, in the *Code Explorer* right-click submenu of Delphi files, the quick actions, and *More > Show the project* of a file's blueprint): a node per unit (teal) and per program file (purple), a wire per `uses`; the units that are not in the project (`Vcl.Forms`, `System.SysUtils`…) are listed in the details of each unit instead of cluttering the picture.
- It works like the file view: search, hide others, focus, zoom, full screen, export. The details panel lists *Uses* and *Used by*, *Open the unit* and **Its blueprint** (the routines of that unit). *Used by no unit* and *Circular uses* replace the unused routines and the loops (only the `interface` section makes a circular reference that Delphi refuses).
- **It edits too**: drag from a unit to another and the unit is added to the `uses` of the implementation section (the clause is made if there is none); click a wire and press Delete to take it out of every `uses`. The unit is changed in the editor (Ctrl+Z undoes it) and the picture follows.

## 0.1.50 — 2026-10-28
- **Blueprint: the events of the form.** In a Delphi unit with its `.dfm`, the routines that answer an event (`btnSave.OnClick`, `Form.OnCreate`…) are drawn as **events**: a red title bar, the component and event written under the name. They are the entry points of the graph, so they are no longer reported as unused or isolated; the details panel says what triggers them (*Triggered by*) and has an *Open the form designer* button. The `.dfm` is read again when it is saved.

## 0.1.49 — 2026-10-28
- **Blueprint: a simpler bar.** Only the everyday controls stay on it: *+ Node*, zoom, undo / redo, the search box, *hide others*, *Details* and full screen (an icon now). The rest moved into a **More** menu: parameter pins, hide isolated routines, how far the focus reaches, search keeping linked routines, export, auto layout and refresh.
- **Unused routines and loops.** The details panel lists the routines that nobody calls in the file (*Not called in this file*) and the groups of routines that call each other in a loop (*Calls in a loop*); on the picture the unused ones have a dashed orange outline and the loops are drawn in red (box *Mark unused routines and loops* in the More menu).
- **Export**: *More > Copy as Mermaid* puts a flowchart of the calls on the clipboard (README, wiki, pull request); *Save as SVG picture…* saves the whole graph as an image.

## 0.1.48 — 2026-10-28
- **Blueprint: undo and redo.** *Undo* / *Redo* buttons and `Ctrl+Z` / `Ctrl+Y` (`Ctrl+Shift+Z`) undo the actions made from the picture — add or remove a call, rename, delete, add or edit a routine — each with its name in the tooltip. If the file was changed by hand since, the undo is refused instead of overwriting your work (`Ctrl+Z` in the editor still works on the same edits).
- **Blueprint: edit a node.** *Edit…* in the details panel (or `E` on the selected node) opens a form for the name, the return type and the parameters (name, type, and how it is passed: in, var, const, out; add and remove rows). The body of the routine is kept; a new name goes through the rename so every call follows. Adding or removing a parameter does not touch the calls, a message says so.
- The exec arrows no longer touch the edge of the window after *Fit*.

## 0.1.47 — 2026-10-28
- **Blueprint: what is left is laid out again.** When the filter or *hide others* leaves only some routines, they are placed as if the others did not exist (columns by call depth, wires kept short) and centred in the window, instead of staying where they were in the full graph. When everything is shown again, each routine goes back to its own place; the positions you saved are never touched by this.

## 0.1.46 — 2026-10-28
- **Blueprint: hide what is not linked to the selection.** The *hide others* box (or the `H` key) removes from the picture every routine that is not linked to the selected one, with its wires, instead of just fading it; the *Focus* box says how far the link may go (direct, 2 levels, all levels). The view is fitted to what is left, a routine picked in the details panel shows its neighbourhood, and clicking the background (nothing selected) brings everything back.

## 0.1.45 — 2026-10-28
- **Blueprint: find a routine.** The filter box now shows only the routines whose name matches and hides all the others, with their wires; the view is centred on what is left, and a single match is selected (its callers and callees in the details panel). `Enter` selects the first match, `Esc` clears the filter and shows everything again. The *+ linked* box keeps the routines that call the ones found or are called by them (the found ones are outlined in yellow). The colour legend moved to the top left so it no longer overlaps the help line.

## 0.1.44 — 2026-10-28
- **Blueprint: easier to read and to use.**
- **Focus on the selection**: click a routine and everything unrelated fades; the routines that call it are lit in blue and those it calls in orange, with their wires. The *Focus* box chooses how far it reaches: direct, 2 levels or all levels.
- **Details panel** on the right (button *Details*): the selected routine with its signature, *Open code / Rename / Delete*, the list of who calls it and what it calls (click a name to go there and centre on it); for a wire, the call sites and *Remove the call*; with nothing selected, all the routines grouped as entry points, called, and isolated, following the filter.
- **Tidier layout**: rows are reordered to cross fewer wires, columns are centred on each other and further apart; each wire has the colour of its caller so crossing wires can be told apart; routines with no link are paler.
- **Compact nodes** (*pins* box): one line per node without the parameter and return pins, chosen automatically above 25 routines; when zoomed out, the small labels are hidden and the titles drawn larger.

## 0.1.43 — 2026-10-28
- **Blueprint follows the size of its window**: when the tab is resized, split, shown again or put in full screen, the graph is fitted again to the room it has (in *Fit window* mode); with a zoom you chose, the zoom and the point of view are kept.

## 0.1.42 — 2026-10-28
- **Blueprint: full screen** — the *Full screen* button or `Ctrl+K Ctrl+F` (the same key as the designer, while the blueprint tab is active) hides the side bar and the panels so the graph gets the whole window; `Esc` (with nothing selected) or the same key leaves it, and the view is refitted.

## 0.1.41 — 2026-10-28
- **Blueprint: zoom as in the designer** — a *Zoom* box (Fit window with its percentage, 25% to 200%), `−` / `+` buttons, the wheel zooming around the pointer, `0` for 100%, `9` or `F` to fit, `+` / `-`, and the middle button to pan.

## 0.1.40 — 2026-10-28
- **Blueprint mode** (*CE: Blueprint*, in the *Code Explorer* right-click submenu and the quick actions): the routines of the file drawn as nodes, in the manner of Unreal Engine blueprints: a title bar, a white exec arrow in and out, one pin per parameter on the left and the return value on the right, and a wire for every call, laid out in columns from the callers to what they call.
- **It edits the code**: drag from the arrow of a node to another node and the call is written at the end of the routine; click a wire and press Delete to remove the call (every call site); **F2** renames a routine with all its calls; **Delete** removes a routine; **double-click** a node opens its code; **double-click the canvas** or drag a wire to empty space adds a new routine (called by the one you dragged from). Everything is an ordinary edit of the file, so Ctrl+Z undoes it, and the picture is redrawn when the code changes.
- Pan with the mouse, zoom with the wheel, `F` fits everything, `L` lays out again, `/` filters the nodes by name, *hide isolated* keeps only the routines that are linked; the position of each node is remembered for the file. Works for Delphi, C++, Java, C#, Go, Rust, TypeScript / JavaScript, Python, PL/SQL, PowerShell, shell and batch.

## 0.1.39 — 2026-10-28
- **Structure: the filter stays visible** — the filter box and the kind / grouping selectors stay at the top of the tab while a long list of members scrolls under them.
- **Labels no longer overflow**: in the Structure tab a long member name or type is cut with an ellipsis, and the icons, visibility letter and action buttons keep their size instead of being clipped; the selectors and the member title fit the width of the sidebar.

## 0.1.38 — 2026-10-28
- **Four new languages**: Windows **batch** (`.bat` `.cmd`: labels are the routines, `set` the variables), **PowerShell** (`.ps1` `.psm1`: functions with their parameters, classes with methods and properties, variables), Unix **shell** (`.sh` `.bash` `.zsh`: functions, variables) and **Markdown** (`.md`).
- **Markdown by title**: the headings (ATX and Setext, with their level, ignoring code blocks, comments and front matter) are the members: the Structure tab lists them, `Alt+G` finds a title by a few letters, `Alt+PageDown` / `Alt+PageUp` jump to the next / previous title, and *Add method* appends a new section.
- These files get the same Structure tab, member keys, quick actions and code lens as the other languages; generating a routine or a variable writes it in the syntax of the language.

## 0.1.37 — 2026-10-28
- **The vi-like quick navigation mode is removed**, replaced by shortcuts that need no mode, each in the Shortcuts tab, the *Code Explorer* right-click submenu and the quick actions: `Ctrl+Shift+Down` / `Ctrl+Shift+Up` next / previous member, `Alt+Enter` from a declaration to its implementation and back (the interface / implementation jump of Delphi, for every language whose members have both), `Alt+G` a box to pick a member by typing a few letters, the code scrolling to each one as you move (Esc brings you back). The keys avoid what VS Code binds in the editor (`Alt+Up/Down` move a line, `Alt+PageUp/PageDown` scroll, `Ctrl+Alt+Up/Down` add a cursor…) and need no AltGr on an AZERTY keyboard; a test checks that no key of the extension is one VS Code uses, and that two commands share a key only for different kinds of file. `Alt+Left` / `Alt+Right` (back / forward) are VS Code's own.

## 0.1.36 — 2026-10-28
- **Quick actions** (`Ctrl+K Ctrl+A`): the menu is now built from the commands of the extension that suit the file (Delphi ones in Delphi files, PL/SQL ones in PL/SQL files, nothing that needs a tree), grouped (Navigate, Members, Variables and refactoring, Review, Delphi forms, PL/SQL, Tools), with the shortcut of each and the last actions used first.
- **Code Explorer submenu** in the right-click menu of the editor: one entry instead of ten loose ones, with the commands grouped (quick actions, structure and navigation, edit, review, Delphi, PL/SQL).
- **Structure tab keyboard**: Up / Down move along the members, Enter goes to one, F2 renames, E edits, Delete deletes; the member under the cursor is shown when the list opens.
- **Tab bar** of the sidebar on one line (it scrolls sideways when narrow) with an icon per tab, and **each language comes back to the tab you last used for it**.
- **One status bar item** instead of three (language, encoding, designer): it says the language CE reads the file as, turns to a warning when the accents look wrong, and its menu offers quick actions, the form designer, the structure, the navigation mode, the language, the encoding, the memo and the guide.
- **Quick navigation mode** (vi-like): turn it on from the status bar menu, the right-click submenu or *CE: Quick navigation mode*; a block cursor shows that letters are not typed. `h j k l w b 0 $ gg G` move (a number first repeats: `5j`, `12G`), `}` / `{` (or `]]` / `[[`) go to the next / previous member, `gd gr gi H L` go to definition, references, implementation, back, forward, `/ n N *` search, `s` quick actions, `m` structure, `e` edit member, `r` rename, `d` designer <-> code, `c` review, `t` template, `za zo zc zR zM` fold, `?` lists them all; `i a A I o O` or Esc go back to typing. The keys are in the Shortcuts tab. If another extension (a vi emulator) already reads the editor keys, the mode says so and does not start.

## 0.1.35 — 2026-10-27
- Designer: **go to a component** — the `/` key (or *Go to a component...* in the View menu) opens a box that finds a component by name, class or caption; arrows and Enter select it and bring it into view.
- Designer: **copy appearance** — right-click a component > *Copy appearance* (size, anchors, align, colours, shown, enabled), then *Paste appearance* on one or several others.
- Designer: **bring to front / send to back** in the right-click menu: the order of the objects in their parent is the order they are drawn in, so the blocks are moved in the .dfm (a container travels with what it holds).
- Designer: **filter properties** at the top of the inspector; only the properties (and sections) that contain the text are shown.
- Designer: **messages are seen** — Undone / Redone and the other notices float a moment over the form as well as being in the status bar; the status bar shows the **box of several selected components** (position and size).

## 0.1.34 — 2026-10-27
- Designer: **right-click menu** on a component (on the form or in the list): cut, copy, paste, duplicate, rename, open the default handler, select the parent, lock, hide, delete, each with its key; on the form itself: paste, select all, zoom 100% / Fit window.
- Designer: **rename in place** — `F2` (or *Rename...* in the menu) puts a box over the component; Enter renames it (field and handlers follow, as in the inspector), Esc cancels.
- Designer: **keyboard walk** — `Tab` / `Shift+Tab` select the next / previous component (form order, siblings by TabOrder), `Enter` creates or opens the default handler, `0` zooms to 100%, `9` to Fit window. All are in the Shortcuts tab.

## 0.1.33 — 2026-10-26
- Designer: the full screen shortcut is now **Ctrl+K Ctrl+F** (it was Ctrl+K F, which VS Code uses to close a folder), while the designer is the active tab; it is shown on the Full screen button, in the Shortcuts tab and in the guide. The key `F` alone still works in the designer.

## 0.1.32 — 2026-10-24
- Designer: back to how it was: the **🗗 button is on every wired event** and the **🔗 link of a container shows whenever the unit puts a form in it** (the form does not have to be in the workspace). What stays from the last version: a form that the code only **mentions** (`frmMain`, a data module such as `dmdConnect`) is **never a link**; only the forms it creates, shows or names are offered.

## 0.1.31 — 2026-10-24
- Designer: **no link where there is nothing to open.** The 🗗 button appears only on an event whose handler (or a method it calls) opens a form of the workspace, and the 🔗 / *Hosted form* link only for a container whose form the workspace has; both are worked out in the background once the project is read. A form the code only mentions is no longer a reason for a link.
- Designer: when a click on 🗗 finds nothing, a message says so with **Show details**, which opens the *CE Form links* output: the names read in the handler, the methods followed (with how many implementations were found) and what was matched.

## 0.1.30 — 2026-10-24
- Designer: **the form named in the call is the one 🗗 opens.** A name between quotes in the handler (or in a list, `['TfrmA', 'TfrmB']`), or in a string **constant** of the project (`const csTiers = 'TIERS_Fiche';` then `fAfficheListe(csTiers)`), is matched with the forms of the project by class, by form name, by unit name and **without the Delphi decorations** (`TfrmTIERSFiche`, `frmTIERSFiche`, `TIERS_Fiche_frm` and `TIERS_Fiche` are the same name); when the code names a form, **no other form is offered** next to it (a message form created on an error path no longer comes first). When nothing matches, the message lists the names it read, and up to 400 `.dpr` files are read.

## 0.1.29 — 2026-10-24
- Designer: **the 🗗 and 🔗 links are fast.** The units of the project are read in the background as soon as a designer opens, many at a time, and the methods of the whole project are indexed in one pass (before, every call followed was a search through all the units); a saved unit is read again alone instead of the whole project.
- Designer: the list of forms offered by 🗗 holds **only the forms the code really opens** (created, shown, or named in a text); the ones it merely mentions are no longer listed, and **a single form opens at once**. When the code opens none, the forms it refers to are offered, titled as such.

## 0.1.28 — 2026-10-24
- Designer: the 🗗 button of an event also finds a form that is **opened by its name**, as in `fAfficheListe('TfrmTIERSFiche', ...)`: the text is matched with the forms of the project as its `.dpr` lists them (`TIERS_Fiche_frm in 'TransactionsTiersTIERS_Fiche_frm.pas' {frmTIERSFiche}`), by class, by form name or by unit name, and a slip in the name (`TfrmTIERSFihce`) is forgiven when only one form is that close. The method it calls is read too, so the name can be given there.

## 0.1.27 — 2026-10-24
- Designer: a **caption on several lines** (Enter in the Caption box, written as `#13#10` like the IDE) is drawn on several lines, and **Word wrap** is a check box for the classes that have it (`TLabel`, `TCheckBox`, `TRadioButton`, `TcxLabel` and the other DevExpress / TMS labels, buttons and check boxes).
- Designer: **full screen** has a shortcut, **Ctrl+K F** (while the designer is the active tab; VS Code uses it to close a folder elsewhere), shown on the button.
- Designer: **from a button to the form its code opens.** A wired event has a 🗗 button: it reads the handler, follows the methods it calls (`frmMain.oGestionAffichageEcran.fAfficheListe(...)` is followed to the body of `fAfficheListe`, two levels deep) and opens the designer of the form that is created or shown (a list when there are several).
- Designer: **from a panel to the form it holds.** `fAddFormInto(oForm, pnl)` (the helpers are the new setting `ce.delphi.hostCalls`) and `oForm.Parent := pnl` are detected in the unit: the container gets a 🔗 badge and a *Hosted form* section in the inspector with a click that opens the designer of that form.

## 0.1.26 — 2026-10-23
- Designer: the **toolbar flows from the left to the right**, the groups side by side with no gap between them, and goes on to the next line like text when the width is used up (nothing is pushed to the far right any more).

## 0.1.25 — 2026-10-23
- Designer: the zoom is **100% by default** again (Fit window stays in the list, and a zoom you choose is remembered).
- Designer: **clicking a component** on the form or in the list **opens the inspector** if it was hidden.

## 0.1.24 — 2026-10-23
- Designer: the **Fit window** entry of the zoom list shows the zoom it gives (`Fit window (100%)` when the form fits, `Fit window (47%)` when a big form is reduced to be seen whole).
- Designer: the **toolbar spreads over the whole width**, left to right, and a long group wraps inside itself instead of being cut off.

## 0.1.23 — 2026-10-23
- Designer: **the whole form is shown by default** (Fit window, a big form shrinks to be seen entire, a small one keeps its size) until you choose a zoom yourself, which is then remembered.
- Designer: a **🛠 Tools menu** brings the sidebar's Delphi layout & checks into the designer: Anchors / docking of the selection (the modes of the old command, one click), Duplicate (`Ctrl+D`), Change class, Check the form (with its safe fixes), Clean the handlers, Form from fields, Form from a class. Tab order and Compare with git were already in the View menu.
- Designer: **top toolbar reorganised** in groups that follow the work: file (Save, Undo, Redo), edit (Copy, Cut, Paste, Duplicate), arrange (align icons), Snap & Grid, view and tools (Zoom, View, Tools), then the panels and Code / .dfm on the right.
- Sidebar: the Tools tab keeps only **Open the designer** and **Project insights** for a Delphi unit; the other buttons moved to the designer.

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
