/**
 * Built-in definitions of widely used third-party VCL component families:
 * DevExpress (Tcx* / Tdx*) and TMS (TAdv* / TTMSFNC*). Sizes, units and
 * events are the IDE defaults as far as they are known; anything else is
 * learned from the project's .dfm files or overridden with the
 * `mmx.delphi.customComponents` setting.
 */
import type { ComponentDef, EventDef } from './DelphiForm';

const SENDER = 'Sender: TObject';
const ev = (name: string, params = SENDER): EventDef => ({ name, params });

const DX_BASE = ['cxGraphics', 'cxControls', 'cxLookAndFeels', 'cxLookAndFeelPainters'];
const DX_EDIT = [...DX_BASE, 'cxContainer', 'cxEdit'];
const DX_DB = ['Data.DB', 'cxDBEdit'];

const COMMON = [ev('OnClick'), ev('OnEnter'), ev('OnExit'), ev('OnDblClick')];
const DX_EDIT_EVENTS = [ev('Properties.OnChange'), ev('Properties.OnEditValueChanged'), ev('OnEnter'), ev('OnExit'), ev('OnKeyPress', `${SENDER}; var Key: Char`), ev('OnClick')];

function def(
    className: string, namePrefix: string, unit: string, width: number | undefined, height: number | undefined,
    props: string[], tabOrder: boolean, events: EventDef[], extraUnits: string[] = [],
): ComponentDef {
    return { className, namePrefix, unit, extraUnits, width, height, props, tabOrder, events };
}

export const DEVEXPRESS: ComponentDef[] = [
    def('TcxButton', 'cxButton', 'cxButtons', 75, 25, ["Caption = '%NAME%'"], true, [ev('OnClick'), ev('OnEnter'), ev('OnExit')], [...DX_BASE, 'Menus']),
    def('TcxLabel', 'cxLabel', 'cxLabel', 49, 17, ["Caption = '%NAME%'"], false, [ev('OnClick'), ev('OnDblClick')], DX_EDIT),
    def('TcxTextEdit', 'cxTextEdit', 'cxTextEdit', 121, 21, ["Text = '%NAME%'"], true, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxMaskEdit', 'cxMaskEdit', 'cxMaskEdit', 121, 21, ["Text = '%NAME%'"], true, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxButtonEdit', 'cxButtonEdit', 'cxButtonEdit', 121, 21, ["Text = '%NAME%'"], true, [...DX_EDIT_EVENTS, ev('Properties.OnButtonClick', `${SENDER}; AButtonIndex: Integer`)], DX_EDIT),
    def('TcxCurrencyEdit', 'cxCurrencyEdit', 'cxCurrencyEdit', 121, 21, [], true, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxSpinEdit', 'cxSpinEdit', 'cxSpinEdit', 121, 21, [], true, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxDateEdit', 'cxDateEdit', 'cxCalendar', 121, 21, [], true, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxTimeEdit', 'cxTimeEdit', 'cxTimeEdit', 121, 21, [], true, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxComboBox', 'cxComboBox', 'cxDropDownEdit', 121, 21, ["Text = '%NAME%'"], true, [...DX_EDIT_EVENTS, ev('Properties.OnInitPopup'), ev('Properties.OnCloseUp')], DX_EDIT),
    def('TcxLookupComboBox', 'cxLookupComboBox', 'cxDBLookupComboBox', 145, 21, [], true, DX_EDIT_EVENTS, [...DX_EDIT, 'cxDBLookupEdit', 'cxLookupEdit', 'cxDropDownEdit', 'Data.DB']),
    def('TcxMemo', 'cxMemo', 'cxMemo', 185, 89, ["Lines.Strings = (", "  '%NAME%')"], true, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxRichEdit', 'cxRichEdit', 'cxRichEdit', 185, 89, [], true, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxCheckBox', 'cxCheckBox', 'cxCheckBox', 121, 21, ["Caption = '%NAME%'"], true, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxRadioGroup', 'cxRadioGroup', 'cxRadioGroup', 185, 105, ["Caption = '%NAME%'"], true, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxCheckGroup', 'cxCheckGroup', 'cxCheckGroup', 185, 105, ["Caption = '%NAME%'"], true, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxListBox', 'cxListBox', 'cxListBox', 121, 97, [], true, [ev('OnClick'), ev('OnDblClick'), ev('OnEnter'), ev('OnExit')], DX_EDIT),
    def('TcxCheckListBox', 'cxCheckListBox', 'cxCheckListBox', 121, 97, [], true, [ev('OnClick'), ev('OnClickCheck'), ev('OnEnter'), ev('OnExit')], DX_EDIT),
    def('TcxImage', 'cxImage', 'cxImage', 105, 105, [], false, DX_EDIT_EVENTS, DX_EDIT),
    def('TcxProgressBar', 'cxProgressBar', 'cxProgressBar', 121, 21, [], false, [ev('Properties.OnChange')], DX_EDIT),
    def('TcxTrackBar', 'cxTrackBar', 'cxTrackBar', 150, 31, [], true, [ev('Properties.OnChange')], DX_EDIT),
    def('TcxGroupBox', 'cxGroupBox', 'cxGroupBox', 185, 105, ["Caption = '%NAME%'"], true, [ev('OnClick'), ev('OnEnter'), ev('OnExit')], [...DX_EDIT, 'cxGroupBox']),
    def('TcxScrollBox', 'cxScrollBox', 'cxScrollBox', 185, 105, [], true, [ev('OnResize')], DX_BASE),
    def('TcxPageControl', 'cxPageControl', 'cxPC', 289, 193, [], true, [ev('OnChange'), ev('OnPageChanging', `${SENDER}; NewPage: TcxTabSheet; var AllowChange: Boolean`)], [...DX_BASE, 'dxCore', 'dxCoreClasses', 'cxClasses']),
    def('TcxTabSheet', 'cxTabSheet', 'cxPC', undefined, undefined, ["Caption = '%NAME%'"], false, [ev('OnShow'), ev('OnHide')], []),
    def('TcxSplitter', 'cxSplitter', 'cxSplitter', 8, 100, [], false, [ev('OnMoved')], DX_BASE),
    def('TcxGrid', 'cxGrid', 'cxGrid', 320, 150, [], true, [ev('OnEnter'), ev('OnExit')],
        [...DX_BASE, 'cxStyles', 'cxCustomData', 'cxFilter', 'cxData', 'cxDataStorage', 'cxEdit', 'cxNavigator', 'cxGridCustomTableView', 'cxGridTableView', 'cxGridCustomView', 'cxClasses', 'cxGridLevel']),
    def('TcxTreeList', 'cxTreeList', 'cxTL', 320, 150, [], true, [ev('OnClick'), ev('OnDblClick'), ev('OnFocusedNodeChanged', `${SENDER}; APrevFocusedNode, AFocusedNode: TcxTreeListNode`)],
        [...DX_BASE, 'cxStyles', 'cxCustomData', 'cxStorage', 'cxEdit', 'cxTLdxBarBuiltInMenu', 'cxInplaceContainer']),
    def('TcxDBTextEdit', 'cxDBTextEdit', 'cxDBEdit', 121, 21, [], true, DX_EDIT_EVENTS, [...DX_EDIT, ...DX_DB, 'cxTextEdit']),
    def('TcxDBCheckBox', 'cxDBCheckBox', 'cxDBEdit', 121, 21, ["Caption = '%NAME%'"], true, DX_EDIT_EVENTS, [...DX_EDIT, ...DX_DB, 'cxCheckBox']),
    def('TcxDBLookupComboBox', 'cxDBLookupComboBox', 'cxDBLookupComboBox', 145, 21, [], true, DX_EDIT_EVENTS, [...DX_EDIT, 'cxDBLookupEdit', 'cxLookupEdit', 'cxDropDownEdit', ...DX_DB]),
    def('TdxStatusBar', 'dxStatusBar', 'dxStatusBar', undefined, 20, [], false, [ev('OnClick')], [...DX_BASE, 'dxCore', 'dxCoreClasses', 'cxClasses']),
    def('TdxLayoutControl', 'dxLayoutControl', 'dxLayoutControl', 300, 200, [], false, [ev('OnResize')], [...DX_BASE, 'dxLayoutContainer', 'dxLayoutControlAdapters', 'dxLayoutLookAndFeels', 'cxClasses']),
    def('TdxBarManager', 'dxBarManager', 'dxBar', undefined, undefined, [], false, [], ['cxClasses', 'dxCore']),
    def('TcxLookAndFeelController', 'cxLookAndFeelController', 'cxLookAndFeels', undefined, undefined, [], false, [], ['cxGraphics', 'cxControls', 'cxLookAndFeelPainters']),
    def('TcxStyleRepository', 'cxStyleRepository', 'cxStyles', undefined, undefined, [], false, [], ['cxClasses', 'cxGraphics']),
    def('TcxGridPopupMenu', 'cxGridPopupMenu', 'cxGridPopupMenu', undefined, undefined, [], false, [], ['cxGrid', 'cxClasses']),
    def('TdxSkinController', 'dxSkinController', 'dxSkinsForm', undefined, undefined, [], false, [], ['dxSkinsCore']),
];

const TMS_EDIT = [ev('OnChange'), ev('OnClick'), ev('OnEnter'), ev('OnExit'), ev('OnKeyPress', `${SENDER}; var Key: Char`)];

export const TMS: ComponentDef[] = [
    def('TAdvEdit', 'AdvEdit', 'AdvEdit', 121, 21, ["Text = ''"], true, TMS_EDIT),
    def('TAdvEditBtn', 'AdvEditBtn', 'AdvEdBtn', 121, 21, ["Text = ''"], true, [...TMS_EDIT, ev('OnClickBtn')]),
    def('TAdvSpinEdit', 'AdvSpinEdit', 'AdvSpin', 60, 21, [], true, [ev('OnChange'), ev('OnEnter'), ev('OnExit')]),
    def('TAdvMaskEdit', 'AdvMaskEdit', 'AdvEdit', 121, 21, ["Text = ''"], true, TMS_EDIT),
    def('TAdvMemo', 'AdvMemo', 'AdvMemo', 185, 89, [], true, [ev('OnChange'), ev('OnEnter'), ev('OnExit')]),
    def('TAdvComboBox', 'AdvComboBox', 'AdvCombo', 145, 21, ["Text = ''"], true, [ev('OnChange'), ev('OnSelect'), ev('OnEnter'), ev('OnExit')]),
    def('TAdvDateTimePicker', 'AdvDateTimePicker', 'AdvDateTimePicker', 121, 21, [], true, [ev('OnChange'), ev('OnEnter'), ev('OnExit')]),
    def('TAdvDirectoryEdit', 'AdvDirectoryEdit', 'AdvDirectoryEdit', 121, 21, [], true, TMS_EDIT, ['AdvEdBtn']),
    def('TAdvFileNameEdit', 'AdvFileNameEdit', 'AdvFileNameEdit', 121, 21, [], true, TMS_EDIT, ['AdvEdBtn']),
    def('TAdvGlowButton', 'AdvGlowButton', 'AdvGlowButton', 75, 25, ["Caption = '%NAME%'"], true, COMMON, ['AdvStyleIF', 'GDIPicture']),
    def('TAdvSmoothButton', 'AdvSmoothButton', 'AdvSmoothButton', 75, 25, ["Caption = '%NAME%'"], true, COMMON),
    def('TAdvOfficeCheckBox', 'AdvOfficeCheckBox', 'AdvOfficeButtons', 97, 17, ["Caption = '%NAME%'"], true, [ev('OnClick'), ev('OnEnter'), ev('OnExit')]),
    def('TAdvOfficeRadioButton', 'AdvOfficeRadioButton', 'AdvOfficeButtons', 113, 17, ["Caption = '%NAME%'"], true, [ev('OnClick'), ev('OnEnter'), ev('OnExit')]),
    def('TAdvOfficeRadioGroup', 'AdvOfficeRadioGroup', 'AdvOfficeButtons', 185, 105, ["Caption = '%NAME%'"], true, [ev('OnClick')]),
    def('TAdvPanel', 'AdvPanel', 'AdvPanel', 185, 41, ["Caption = '%NAME%'"], true, [ev('OnClick'), ev('OnResize')], ['AdvStyleIF', 'GDIPicture']),
    def('TAdvSmoothPanel', 'AdvSmoothPanel', 'AdvSmoothPanel', 185, 41, [], true, [ev('OnClick'), ev('OnResize')]),
    def('TAdvGroupBox', 'AdvGroupBox', 'AdvGroupBox', 185, 105, ["Caption = '%NAME%'"], true, [ev('OnClick'), ev('OnEnter'), ev('OnExit')]),
    def('TAdvOfficePager', 'AdvOfficePager', 'AdvOfficePager', 289, 193, [], true, [ev('OnChange'), ev('OnChanging', `${SENDER}; FromPage, ToPage: Integer; var AllowChange: Boolean`)], ['AdvStyleIF', 'AdvGlowButton']),
    def('TAdvOfficePage', 'AdvOfficePage', 'AdvOfficePager', undefined, undefined, ["Caption = '%NAME%'"], false, [ev('OnShow'), ev('OnHide')]),
    def('TAdvStringGrid', 'AdvStringGrid', 'AdvGrid', 320, 120, [], true, [ev('OnClick'), ev('OnDblClick'), ev('OnSelectCell', `${SENDER}; ACol, ARow: Integer; var CanSelect: Boolean`), ev('OnGetCellColor', 'Sender: TObject; ARow, ACol: Integer; AState: TGridDrawState; ABrush: TBrush; AFont: TFont')], ['BaseGrid', 'Grids']),
    def('TDBAdvGrid', 'DBAdvGrid', 'DBAdvGrid', 320, 120, [], true, [ev('OnClick'), ev('OnDblClick')], ['AdvGrid', 'BaseGrid', 'Grids', 'Data.DB']),
    def('TAdvProgressBar', 'AdvProgressBar', 'AdvProgr', 150, 21, [], false, []),
    def('TAdvToolBar', 'AdvToolBar', 'AdvToolBar', undefined, 26, [], false, [ev('OnClick')], ['AdvToolBarStylers']),
    def('TAdvFormStyler', 'AdvFormStyler', 'AdvStyleIF', undefined, undefined, [], false, [], ['AdvOfficeButtons']),
    def('TAdvToolBarOfficeStyler', 'AdvToolBarOfficeStyler', 'AdvToolBar', undefined, undefined, [], false, [], ['AdvToolBarStylers']),
    def('TTMSFNCEdit', 'TMSFNCEdit', 'VCL.TMSFNCEdit', 121, 21, [], true, TMS_EDIT),
    def('TTMSFNCPanel', 'TMSFNCPanel', 'VCL.TMSFNCPanel', 185, 41, [], true, [ev('OnClick')]),
    def('TTMSFNCGrid', 'TMSFNCGrid', 'VCL.TMSFNCGrid', 320, 120, [], true, [ev('OnClick'), ev('OnDblClick')]),
];

export const THIRD_PARTY: ComponentDef[] = [...DEVEXPRESS, ...TMS];

/** Family of a class name (for icons, grouping and rendering hints). */
export function familyOf(className: string): 'devexpress' | 'tms' | undefined {
    if (/^T(cx|dx)[A-Z]/.test(className)) { return 'devexpress'; }
    if (/^T(Adv|DBAdv|TMS)/.test(className)) { return 'tms'; }
    return undefined;
}
