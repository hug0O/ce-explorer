# Changelog

Every release of Code Explorer, newest first. The sidebar shows the same list, folded, at the bottom of each tab.

## 0.1.90 — 2026-11-05
- **Quick actions (Ctrl+K Ctrl+A) find what you mean.** Type a few words in your own language: `traduire fiche`, `renommer`, `code mort`, `vérifier fiche`, `graphe appels` (French or English, accents do not matter) and the right actions come up, best match first, with the group or the explanation under each. Without anything typed, each group lists first what **you** run most (counted on this machine).
- **One Rename.** New entry **Rename** in the *Code Explorer* menu of the editor (and the palette): on a member it renames the member (unit, form and links), on a variable it renames the variable, anywhere else it renames the name in the whole project with the VS Code preview.
- **Same prefix everywhere in the palette.** Every command now starts with `CE: ` (`CE: Delphi - Check form`, `CE: PL/SQL - Find callers`): typing `CE:` lists them all. *Translate the captions of this form* is in the editor menu of `.pas` / `.dfm` files.

## 0.1.89 — 2026-11-05
- **Form check: the FDATA domains.** *Check form* (Ctrl+K C) has a new category, **Domains**: a persistent field whose name carries a domain (`CLI_FLG`, `ART_CMNT`…) must have the class and the size of that domain. A `TStringField` on an `_FLG` or a `Size` that is not the domain's is reported, with a fix that changes the class in the .dfm, the declaration in the unit and the `Size`.
- **Rename in the project, with a preview.** New command **CE: Rename in the project (with preview)** (Tools tab, *Rename in the project*): type the name and the new one, and the places are found in every file of the same family (a unit with its forms, a header with its sources, any other language by its extension). Comments and strings are told apart: *Code only* or *Code, comments and strings*. VS Code then lists every place by file in its own refactoring preview, you untick what you want to keep, and one Undo takes everything back.
- **Translate the form.** New command **CE: Translate the captions of this form...** (Tools tab, *Translate the form*): the captions, hints, titles and field labels of the .dfm are translated with the free service, one request per different text. The accelerator `&` is kept, the accents are written as `#233` the way the IDE does, and a list shows each new text next to the old one: untick the ones you do not want before anything is written. The language of the form is asked when none is set (short captions are badly detected).
- **Fixed: the *Feature usage* button of the Tools tab did nothing** (the sidebar did not list the command as one it may run).

## 0.1.88 — 2026-11-04
- **Designer: the fields of a query take the type of their FDATA domain.** *From the SELECT* reads the domain in the column name (`CLI_IDT`, `ART_FLG`, `ART_CMNT`, `SITE_WEB`…) and creates the right field: `TIntegerField` for IDT and FLG, `TWideStringField` for CMNT and the NVARCHAR2 ones, `TStringField` with its size for the short texts, `TFloatField` for the NUMBER(20,8), `TDateField` / `TDateTimeField` / `TTimeField`, `TMemoField`, `TBlobField`… A column with no domain keeps the old guess from its name.
- **Designer: a component changes parent only with Ctrl.** Dragging a component over another panel no longer reparents it: hold **Ctrl** over the target (it is outlined) and release to drop it there; without Ctrl it just moves inside its own parent, and the label says *Hold Ctrl to drop it into…*.

## 0.1.87 — 2026-11-03
- **Structure: click a member again to fold it.** The details under a member (events, where it is used, variables, search) fold when you click the member that is open; they open again with the next click, and stay folded while you stay on that member.

## 0.1.86 — 2026-11-03
- **Structure: the member list is no longer cut at about 150 px.** The style of the Memo list (a small scrolling box) was also applied to the list of members; it now only concerns the memos, so the members use the whole height of the sidebar.

## 0.1.85 — 2026-11-03
- **Structure: the lists use the height of the sidebar.** Events, *Used in this file* and the code search were cut at a small fixed height; they now grow with the sidebar, while the filter stays pinned at the top.

## 0.1.84 — 2026-11-03
- **Blueprint: a selected routine shows its whole chain.** The *Levels* boxes are gone: selecting a routine lights **every** caller above it (and theirs) and **every** callee below it (and theirs), each with its distance (`↑2`, `↓3`), and the message says `1 caller up, 4 callees down`. **hide others** (H) and *Show only its callers and callees* keep that whole chain.
- **Blueprint: the filter only filters what you typed.** The routines that match are marked; their **parents (callers) and children (callees)** stay shown without being filtered by the text, the rest goes. The option *Search keeps linked routines* is removed: it is always on.

## 0.1.83 — 2026-11-03
- **Change the order of the parameters.** In the *Edit member* form of the sidebar and in the *Edit...* panel of the Blueprint, every parameter has **▲ ▼** buttons (the first cannot go up, the last cannot go down); the preview follows. When an edit **only puts the parameters in another order**, the extension offers to **reorder the arguments of the calls** of the routine in the same file too (`Draw(10, 20, 'a, b')` becomes `Draw('a, b', 10, 20)`): commas inside strings, parentheses or brackets stay with their argument, a call with another number of arguments is left alone, and the declaration is not touched. The offer says how many calls, and one Ctrl+Z undoes it.
- **Blueprint: callers above and callees below the selected routine, to a level you choose.** The bar has **Levels ↑ ↓**: how many levels of callers (blue) and of callees (orange) are followed from the selected routine, each from 0 to 10 or *all*. The routines in reach are lit and each says its distance (`↑2` = two levels of callers away, `↓1` = a direct callee), the rest is dimmed, and the count reads `2 callers up, 3 callees down`. **hide others** (H), or the new button *Show only its callers and callees* in the details, keeps only those and lays them out again. The *Focus* box of the More menu is replaced by these two.

## 0.1.82 — 2026-10-30
- **Translate: the source no longer follows the text you replaced.** After a *Replace* the code holds the translation, so the language the service detected for the next translation was the one you had just translated into. The extension now remembers, for this session, what each translation came from: translating that text again starts **from the original text, in its own language** (`French → German (from the original text)`, better than French → English → German), and asking for the original language gives the original text back without any request.

## 0.1.81 — 2026-10-30
- **Translate says which language it translated from.** With the source left on *Detect the language*, the service looks at the text itself, so after a *Replace* (the text is now in the new language) the next translation starts from that language: the result now reads `English (detected) → French` so this is visible, and every translation is written in the **CE Translate** output (`fr | en  detected fr`). To keep the source fixed whatever the text, pick it with **Translate from**.

## 0.1.80 — 2026-10-30
- **Translate: the two languages are told apart.** *Translate into* only ever sets the language you translate **into**, and *Translate from* only the language of the text; a test now drives both commands to make sure of it. Each list says what the other side is (`Translate into (from English)`), and the message after the choice says which side was set and that the other one is unchanged. If the source looks as if it followed the target, it was the **detection** (`auto`): after *Replace* the text is in the new language, so the service detects that one next time: choose the source with *Translate from* to keep it fixed.

## 0.1.79 — 2026-10-30
- **Translate: choose the language of the text.** **CE: Translate from a language...** (the *More commands* menu of the editor, or the palette) lists the languages with **Detect the language** first; the choice is remembered, and if text is selected it is translated at once. The result and the progress now say the way (`English → French`), and a source equal to the target is refused before anything is sent. The setting `ce.translate.source` stays the default (`auto`).

## 0.1.78 — 2026-10-30
- **Designer: Ctrl+C puts only the name and the label on the clipboard.** What you paste in the code, a search box or a message is one line per component, `name<Tab>label` (`btnSave	Save`), not the JSON payload any more. Pasting in a designer (Ctrl+V) still brings the components back: the extension keeps what is behind the text you copied, so it works in the same form or in another one. Cut and paste (move) is unchanged.
- **Which features are used: a ranking, and the ones that are not.** Every command of the extension, and the actions of the designer, the sidebar, the Blueprint and Project insights, are now counted **on this machine only (nothing is sent)**. **CE: Feature usage (ranking, least used)** (palette, or *Feature usage* in Tools > Project) shows the **most used** features with a bar, the **little used** ones (two uses or fewer) and the commands **never used**, grouped; it warns that the counting is too young to judge before about two weeks. *Copy as Markdown* gives the ranking to paste in a note, *Reset* starts again from zero.

## 0.1.77 — 2026-10-30
- **Translate into another language: no more error about a setting that is not registered.** The language you pick is remembered by the extension itself instead of being written in the settings (which failed with *ce.translate.target is not a registered configuration* when the window had not been reloaded after the update). The choice wins over the `ce.translate.target` setting, which stays the default.

## 0.1.76 — 2026-10-30
- **Translate: only the selection.** *CE: Translate* translates the text you selected and nothing else; with no selection it just asks you to select one (the comment or string under the cursor is no longer taken by itself).

## 0.1.75 — 2026-10-30
- **Translate text inside the code with a free service.** **CE: Translate** (the *More commands* menu of the editor, or the palette) translates the selected text, or, with nothing selected, the **comment or string literal under the cursor** (TypeScript, Python, Java, C#, Go, Rust, C/C++, Delphi, PL/SQL…: only the words you wrote, not the `//`, `#`, `{ }` or the quotes). The translation is shown with two buttons, **Replace** (in the code, one undo away) and **Copy**. **CE: Translate into another language...** picks the language (French, English, Spanish, German… or any code such as `pt-BR`) and translates.
- It uses **MyMemory**, which needs no account or key. The first time, you are told that the text you translate is sent to `api.mymemory.translated.net` (nothing else of your code), and you agree once. Settings: `ce.translate.target` (default `fr`), `ce.translate.source` (`auto`), and an optional `ce.translate.email` that raises the free daily quota. A text is sent line by line, 40 pieces at most per command; when the quota is used up or the service cannot be reached, the message says so.

## 0.1.74 — 2026-10-30
- **Memo: a `main.md` by default, and as many memos as you want, in a list.** The tab no longer follows the language of the file: it opens on **main** (`main.md`, created for you), and every memo of the folder is a row of a **selectable list** (the memos written by earlier versions, `pascal.md`, `general.md`…, are in it too; an *empty* mark shows the ones with nothing yet). **＋ New memo** asks for a name and creates the file (`Release notes` makes `release-notes.md`), ready to write.
- **Open a memo as a page.** **📖 Open as page** shows it in the application's Markdown page (outline of the headings, to-do boxes you can tick, tables, the `/` menu to add blocks as in Notion); **📝 Text** opens the same file in the text editor; **🗑** moves a memo to the trash (it can be taken back; main stays).

## 0.1.73 — 2026-10-30
- **Dead Code now says what the compiler or the linter of the language would say.** For the open file it lists, with the rule: **unused imports** (TS6133, pyflakes F401, Go's *imported and not used*, rustc `unused_imports`, Java), **local variables never read** (TS6133, F841, Go, rustc `unused_variables`, CS0168 / CS0219, `-Wunused-variable`, Delphi H2164), **private members and routines of the file that nothing calls** (Delphi H2219, CS0169 / IDE0051, rustc `dead_code`, `-Wunused-function`, staticcheck U1000, shellcheck SC2329, TS6138) and **unreachable code** after a `return` / `throw` / `Exit` (TS7027, CS0162, rustc `unreachable_code`). A Delphi event handler named in the .dfm is never reported. The findings are also **faded in the editor** and listed as hints in the Problems panel until the report is closed; a click goes to the exact name. Under it stays the list of public methods and classes that nothing in the workspace refers to.
- **The Export button is removed from Tools** (the command *CE: Export Structure* stays in the palette).
- **Project insights follows the languages of the project.** The status line lists them (`TypeScript 120 files, 9000 lines - Python 8 files...`) instead of units and forms; the *Dead code* tab gives, for **every** language (Delphi units included), the same findings grouped by kind with the rule as badge; *Size* covers the Delphi units too; the tab that opens is the first one that has something (no empty *SQL* tab in a project without SQL).

## 0.1.72 — 2026-10-30
- **Blueprint: the Project view now works for every language, not only Delphi.** From a TypeScript / JavaScript, Python, Java, C#, Go, Rust or C / C++ file, *Project* draws the files of that language as nodes and the imports that name another file of the project as wires (`import` / `require`, `from x import`, `using`, `mod` / `use crate::`, `#include`); a library stays listed on the file as *outside the project*. The page says *files* and *imports* instead of *units* and *uses*. The wires are read from the import lines: change the import in the file itself (only Delphi `uses` clauses are written from the picture).
- **Blueprint of a file: Go routines now have their body** (their calls were never drawn), and **`obj.method()` is a call** when no other routine of the file has that name (before, only `this.method()` was).

## 0.1.71 — 2026-10-30
- **Copy and paste the name and the label of a component, in the designer.** `N` copies the name and `L` the label (Caption) of the selected components as plain text (one per line); `Shift+N` / `Shift+L` paste the clipboard text as the name (renamed in the .dfm and the code) or as the label of the selected component. The same four commands are in the right-click menu, and in the Keys menu.

## 0.1.70 — 2026-10-29
- **Popup menus: the items and their events.** In the designer, the preview of a `TPopupMenu` / `TMainMenu` shows the `OnClick` handler of every item (⚡ `miOpenClick`: a click opens its code; a grey ⚡ creates the handler), and lists the controls that show the popup menu. In the **Structure** tab, selecting a menu lists its **Menu items** (sub-items indented, with the shortcut) and the handler of each, one click from its code; the `OnPopup` of the menu stays in *Events*.
- **The designer keeps only the centre.** When the designer is shown, the side bars on the left and on the right are closed. *S* (Show in Structure) shows the left one again. Setting `ce.delphi.designerHideSidebars` (on by default) turns this off.

## 0.1.69 — 2026-10-28
- **Back to the designer after `S`: the real cause fixed.** `S` used to give the focus to the sidebar, where the keys of the unit do not work, so `Ctrl+K Ctrl+B` did nothing. The sidebar is now shown **without taking the focus**: you are in the code of the unit and `Ctrl+K Ctrl+B` goes back to the designer, with the component selected. The form is also found when no editor is active (the *Show in the designer* button and the *Events* block no longer disappear).
- **Used in this file: the routine that holds each line.** Above the lines found, the parent routine is written in grey (`TForm1.btnSaveClick`, a nested routine as `Outer.Inner`), once for each group of lines, so you see at a glance where a member is used. Lines outside any routine have no grey title.

## 0.1.68 — 2026-10-28
- **A Markdown page: viewer and editor, with `/` commands as in Notion.** *CE: Open as a Markdown page* (title bar of a `.md` file, the *More commands* menu, or *Open With… > Code Explorer Markdown*) shows the file as a page — headings, lists, to-do check boxes you can tick, quotes, code blocks, tables, rules, images next to the file, links — with an **Outline** of the headings on the left. The normal Markdown editor stays the default: this one is opt-in.
- **Edit by blocks**: *✎ Edit*, then click a block to change its text. `Enter` makes a new block (or the next item of a list; a second `Enter` on an empty item leaves the list; inside a code block it is a new line), `Backspace` on an empty block removes it, `↑` / `↓` at the edge go to the neighbour block, `Alt+↑` / `Alt+↓` move the block, `Esc` leaves it; the **＋ ↑ ↓ ✕** at the left of a block add, move and delete it.
- **Type `/`** in a block for the menu: *Text, Heading 1-3, Bulleted / Numbered / To-do list, Quote, Callout, Code block, Divider, Table, Image, Link, Table of contents* — a few letters filter it, `↑` `↓` and `Enter` choose.
- The file stays plain Markdown: the editor writes the blocks one blank line apart (nothing is rewritten until you edit), and a change made in the text editor, by undo or by git shows up in the page. **CE: New Markdown page** creates a page next to the file you are in and opens it.

## 0.1.67 — 2026-10-28
- **The *Show in the designer* button is at the top of the Structure tab**, not inside the detail of the selected component: it is there whenever the unit has a form, and says *(btnSave)* when the member under the cursor is a component, so it comes back to the designer with that component selected; with nothing selected it just goes back to the designer.

## 0.1.66 — 2026-10-28
- **Back to the designer after `S`, fixed.** While a page of the sidebar has the focus VS Code reports no active text editor, and `Ctrl+K Ctrl+B` then had no unit to work from: it now uses the last unit that was edited, shows the designer **and selects the component again**. After `S`, the status bar says which key goes back.

## 0.1.65 — 2026-10-28
- **Every key of the designer, in a menu of the designer.** A **⌨ Keys** button in the toolbar (or `?` / `F1`) opens a list of all the keys and mouse gestures of the designer, with a filter box (`Esc` closes). It is the same list as the *Shortcuts* tab of the sidebar, so the two cannot disagree; it also says what is bound outside the page (`Ctrl+K Ctrl+B`, `Ctrl+K Ctrl+F`).
- **Back from the code after `S`.** `Ctrl+K Ctrl+B` now also works while the sidebar has the focus, and brings the designer back **with the component selected again**. In the Structure tab, a component has a **🎨 Show in the designer** button that does the same (the unit and the form must be the same name, as in Delphi).

## 0.1.64 — 2026-10-28
- **From the designer to the code in one key.** With one component selected in the form designer, **S** (or *Show in Structure* in its right-click menu) switches to the unit and brings the sidebar to the **Structure** tab, filtered on that component, with the component opened: its events and *Used in this file* unfolded.
- **The events of a component, in the Structure tab.** Click a component (a field such as `btnSave`) and an **Events** block lists what the `.dfm` wires on it — `OnClick → btnSaveClick` — each one a click away from the handler's implementation; a handler named in the form but without code in the unit is shown as *(no implementation)*. Click the handler itself and the tab says *Handler of btnSave.OnClick* (all of them when one handler serves several components).

## 0.1.63 — 2026-10-28
- **The commands are named the same way.** All the titles of the palette follow one style — `CE:` (or `CE Delphi:` / `CE PL/SQL:`), a verb first, sentence case — and one word for one thing: the four ways to move to a member all say *Go to member* (*pick from a list*, *type a few letters*, *in the workspace*, *from a code lens*); *Navigate to* is gone. A test keeps the titles consistent.

## 0.1.62 — 2026-10-28
- **The preview says what it will do**: *Apply 4 changes in 2 files: Main.pas, Main.dfm?* instead of a bare *Apply these changes?*.

## 0.1.61 — 2026-10-28
- **Undo, one click away.** Every edit the extension makes — a rename, a deletion, a member added or updated, a doc header, a synchronisation, a move — now says so with an **Undo** button on the message (the undo of the editor, on the file that was edited).
- **What was changed.** A log of those edits (and of the Blueprint's: a call added or removed, a `uses` written), kept per workspace, with *how long ago* and the file: **CE: What was changed**, also in the status bar menu; choose an entry to open its file.
- **Progress.** The review, the documentation, the export and the dead code search show what they are doing in the status bar while they work.
- **The same keys in the lists.** Templates answer to the keys of the other lists: arrows move, `Enter` inserts, `E` edits, `Delete` deletes, `F` stars, `/` searches (listed in the Shortcuts tab).
- **Same words in the project Blueprint**: the pins and the legend say *uses* / *used by* where the file view says *calls* / *called by*.

## 0.1.60 — 2026-10-28
- **Quick start.** A VS Code *Get Started* walkthrough with five short steps — the structure of the file, moving between members, the Blueprint, the quick actions menu, the settings and the guide — each with its page and a link that runs the command (**CE: Quick start**). The first time the extension runs, a short message offers the tour once and never again.
- **A tip a day.** The menu of the status bar item starts with a tip (*Alt+G picks a member by typing a few letters*…) that runs the command it talks about when chosen; ten tips, the same all day. The menu also has *Quick start* and *Settings*.

## 0.1.59 — 2026-10-28
- **The sidebar has three tabs instead of five**: *Structure*, *Tools* and *Memo*. The details of the member and the shortcuts are one click away in a **⋯** menu at the end of the bar, which shows the name of the one that is open (*Shortcuts ⋯*).
- **A simpler empty page.** With no member under the cursor, the panel proposes three things — *Structure of the file*, *Go to a member*, *Quick actions* — and folds the long list of other actions under *More actions*.

## 0.1.58 — 2026-10-28
- **A simpler right-click menu.** *Code Explorer* in the editor menu now has five entries — *Quick actions*, *Structure*, *Go to a member*, *Blueprint* (file), *Blueprint of the project* (Delphi) — and a **More commands** submenu with the rest (edit, review, member keys, Delphi, PL/SQL), grouped as before.
- **A cleaner command palette.** The commands that only make sense from an element of a list or with the arguments of another command (*Open member editor*, *Batch move*, *Move member*, *Set language to…*, the full screen key…) are no longer offered there.
- **Settings in sections.** The settings are grouped under *General*, *Delphi*, *PL/SQL* and *Formatting (advanced)* instead of one long list, and **CE: Settings** (also in the status bar menu) opens them filtered to the extension.

## 0.1.57 — 2026-10-28
- **Blueprint of the project loads much faster.** The files are read 24 at a time instead of one after the other; a file whose date and size have not changed is not read again (opening the view a second time, or after a save, only reads what changed); and a unit is searched for its header and its `uses` clauses at its start instead of being scanned from end to end (a unit of several MB took most of the time).
- **The picture comes first.** The units and their wires are drawn as soon as the `uses` are read; what each wire carries (the names taken, the uses that take nothing) is worked out afterwards in small steps that leave the editor free, and the graph is refreshed when it is done. While it works, the canvas and the bar say how far it is (*Reading the units… 320 / 900*, then *Looking at what each unit takes…*), and a newer load stops an older one.

## 0.1.56 — 2026-10-28
- **Tools tab: the Blueprint buttons, no designer button.** A *Blueprint* block with **🗺️ File** (the routines of the file) and **🗺️ Project** (the units and their `uses`) is on the *Analyze* page, for every language; the *Open the visual form designer* button of the *Form* page is gone (the designer opens with `Ctrl+K D`, the title bar icon, the right-click menu, and the *🎨 Designer* button of the tab bar).
- **Shortcuts shown in the help, corrected.** The Markdown entry of 0.1.38 and the README named the Alt+Page keys (which VS Code uses to scroll) for the next / previous member or heading: the real keys are `Ctrl+Shift+Down` / `Ctrl+Shift+Up`. The *Shortcuts* tab now lists the keys the pages really answer to and that it was missing: the designer's `Ctrl+F` (find a component), `Ctrl+L` / `Ctrl+H` (lock / hide); the keys of the Structure list (arrows, `Enter`, `F2`, `E`, `Delete`); and a new **Blueprint** group (undo / redo, `F2`, `E`, `Delete`, `H`, `/`, `F`, `0`, `+` / `-`, `L`, wheel, middle button, drags and double-clicks). `Ctrl+K Ctrl+F` is now listed for the designer and the Blueprint, which share it. A test checks that the keys the Blueprint help names are really in its page.

## 0.1.55 — 2026-10-28
- **Blueprint: a view per file and a view per project, one click apart.** A **File | Project** switch at the left of the bar, in both views: *File* shows the routines of the file (the last one drawn, else the one being edited), *Project* shows the units and their `uses`. Each opens in the same editor group; a unit chosen in the project view opens its file view with *Its blueprint*. (The *Show the project* entry of the More menu is replaced by the switch.)
- **Project view: what each wire carries.** Every `uses` now says which names of the unit it names are used by the other one (*Data: 2 names*, with the list as a tooltip and in the details of the wire). A `uses` that takes nothing is drawn dashed orange and listed under *Uses that take nothing* — a candidate to remove, with a reminder that a unit can be there only for its initialization section; click the wire, then *Remove from the uses*.

## 0.1.54 — 2026-10-28
- **Project insights: a progress bar and a way to stop.** While the project is read, a bar shows how far the scan is (units read out of the total) and a **Cancel** button stops it; the page is told when it stopped, instead of staying on *Scanning…*.
- **Project insights: one filter for every list.** A *Filter this list…* box (with *n of m*) appears above the tabs that had none of their own — Dead code, Size, Unused, Form checks, Names, Forms, Hotspots: the rows that do not contain all the words are hidden, and so are the headings left with nothing under them; `Esc` clears it and the text is remembered. SQL and Texts keep their own, richer filters.

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
- **Markdown by title**: the headings (ATX and Setext, with their level, ignoring code blocks, comments and front matter) are the members: the Structure tab lists them, `Alt+G` finds a title by a few letters, `Ctrl+Shift+Down` / `Ctrl+Shift+Up` jump to the next / previous title, and *Add method* appends a new section.
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
