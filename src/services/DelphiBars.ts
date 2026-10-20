/**
 * DevExpress bars (TdxBarManager) and styles (TcxStyleRepository).
 *
 * The bar manager is a component of the form that holds the bars (`TdxBar`) and their items (buttons, static
 * texts, sub-menus…); a dock control (`TdxBarDockControl`) is the visible place where a bar is docked, and points
 * to its manager with `BarManager`. A style repository holds the styles (`TcxStyle`) the grids and the bar items
 * point to with `Style`. Items and styles have no place of their own: they are parts of their holder.
 * Pure: nothing here writes a .dfm.
 */

export const isBarManager = (cls: string): boolean => /^TdxBarManager$/i.test(cls);
export const isDockControl = (cls: string): boolean => /^TdxBarDockControl$/i.test(cls);
export const isStyleRepository = (cls: string): boolean => /^TcxStyleRepository$/i.test(cls);

/** A bar, or an item of a bar (button, static text, sub-menu, combo, edit, separator…). */
export const isBarPart = (cls: string): boolean =>
    /^TdxBar$/i.test(cls)
    || /^TdxBar(Button|LargeButton|Static|SubItem|Combo|Edit|ListItem|Separator|ControlContainerItem|SpinEdit|ColorCombo|DateCombo|FontNameCombo|FontSizeCombo|MRUListItem|ToolbarsListItem|ProgressItem|ImageCombo|TreeViewCombo|InPlaceSubItem|ScreenTipItem|ItemsListItem|ColorButton|Text)$/i.test(cls);

export const isStyle = (cls: string): boolean => /^TcxStyle$|^TcxVGridStyle$|^TcxTreeListStyle$/i.test(cls);

/** Parts of a bar manager or of a style repository: placed by their holder, never moved to another parent. */
export const isBarChild = (cls: string): boolean => isBarPart(cls) || isStyle(cls);
