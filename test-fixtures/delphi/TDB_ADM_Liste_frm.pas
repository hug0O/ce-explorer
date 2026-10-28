unit TDB_ADM_Liste_frm;

interface

uses
  Winapi.Windows, System.SysUtils, System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Data.DB, Vcl.StdCtrls, AdvSmoothLabel, Vcl.ExtCtrls,
  SVirtualTree, Vcl.Buttons, MemDS, DBAccess, Uni, Vcl.Dialogs,
  Type_Unit, cxGraphics, cxControls, cxLookAndFeels, cxLookAndFeelPainters,
  dxCustomTileControl, cxClasses, dxTileControl, cxContainer, cxEdit,
  cxProgressBar, dxBarBuiltInMenu, cxPC, cxStyles, cxCustomData, cxFilter,
  cxData, cxDataStorage, cxNavigator, dxDateRanges,
  cxDataControllerConditionalFormattingRulesManagerDialog, cxDBData,
  cxGridCustomTableView, cxGridTableView, cxGridDBTableView,
  cxGridDBTableViewHelper, cxGridLevel,
  cxGridCustomView, cxGrid, dxBar, cxCheckBox, cxEditRepositoryItems,
  dxSkinsCore, dxSkinWhiteprint,
  SDateTimePicker, dxScrollbarAnnotations, dxBarExtItems, cxSpinEdit,
  cxLabel, cxTrackBar, cxBarEditItem,
  System.Generics.Collections, System.Generics.Defaults,
  System.Threading, SmartPointer, LoadingDlg,
  cxDataUtils, PopUpCADEN,
  cxGridExportLink, dxCore, dxCoreClasses, dxHashUtils, dxSpreadSheetCore,
  dxSpreadSheetCoreHistory, dxSpreadSheetConditionalFormatting,
  dxSpreadSheetConditionalFormattingRules, dxSpreadSheetClasses,
  dxSpreadSheetContainers, dxSpreadSheetFormulas, dxSpreadSheetHyperlinks,
  dxSpreadSheetFunctions, dxSpreadSheetGraphics, dxSpreadSheetPrinting,
  dxSpreadSheetTypes, dxSpreadSheetUtils, dxSpreadSheet,
  Vcl.ComCtrls, cxTextEdit, cxCalendar, cxCalc, Vcl.Menus, dxmdaset,
  AdvProgressBar, dxUIAClasses,SThreadPool;
type

  TfrmTDB_ADMListe = class(THadHocFormListe)
    pnlTopInfos: TPanel;
    lblTDB_ADM: TAdvSmoothLabel;
    wtlVolant: TSVirtualTreeLink;
    wtlFixe: TSVirtualTreeLink;
    pnlBoutons: TPanel;
    btnRecherche: TSpeedButton;
    btnQuitter: TSpeedButton;
    dxtcTiles: TdxTileControl;
    dxtcgOFFRES_TARIFS: TdxTileControlGroup;
    dxtcgCommandes: TdxTileControlGroup;
    dxtciDDL_A_CREER: TdxTileControlItem;
    dxtciARBBESuivi: TdxTileControlItem;
    dxtciPPECHASolderListe: TdxTileControlItem;
    dxtciAVMADListe: TdxTileControlItem;
    dxtciDEEXP_ST_2: TdxTileControlItem;
    dxtciDEEXP_ST_0: TdxTileControlItem;
    dxtciCOMMAListe: TdxTileControlItem;
    dxtciPPECHProdRetard: TdxTileControlItem;
    lblADM_COLLA: TLabel;
    edtADM_COLLA_TRIG: TEdit;
    edtADM_COLLA_NOM: TEdit;
    btnADM_COLLA: TBitBtn;
    edtADM_COLLA_ID: TEdit;
    edtADM_COLLA_PRENOM: TEdit;
    dsDDL_A_CREE_DADListe: TDataSource;
    qryDDL_A_CREE_FADListe: TUniQuery;
    qryDDL_A_CREE_FADListeCOMMA_ID: TFloatField;
    qryDDL_A_CREE_FADListeCOMMA_VERSI: TFloatField;
    qryDDL_A_CREE_FADListeCOMMA_ST: TFloatField;
    qryDDL_A_CREE_FADListePOCDE_ID: TFloatField;
    qryDDL_A_CREE_FADListePOCDE_NUM: TFloatField;
    qryDDL_A_CREE_FADListePPECH_ID: TFloatField;
    qryDDL_A_CREE_FADListePPECH_DATE: TDateTimeField;
    cxStyleRepository1: TcxStyleRepository;
    stCellRouge: TcxStyle;
    stCellJaune: TcxStyle;
    stCellVert: TcxStyle;
    bmBars: TdxBarManager;
    dxbrPPECHFadees: TdxBar;
    btnVisCOMMA1: TdxBarButton;
    qryPPECHProdRetard: TUniQuery;
    qryPPECHProdRetardCOMMA_ID: TFloatField;
    qryPPECHProdRetardCOMMA_VERSI: TFloatField;
    qryPPECHProdRetardCOMMA_ST: TFloatField;
    qryPPECHProdRetardPOCDE_ID: TFloatField;
    qryPPECHProdRetardPOCDE_NUM: TFloatField;
    qryPPECHProdRetardPPECH_ID: TFloatField;
    qryPPECHProdRetardPPECH_DATE: TDateTimeField;
    qryPPECHProdRetardPPECH_DATE_PREV: TDateTimeField;
    dsPPECHProdRetard: TDataSource;
    btnVisPOCDE1: TdxBarButton;
    dxbrPPECHProdRetard: TdxBar;
    btnVisCOMMA2: TdxBarButton;
    btnVisPOCDE2: TdxBarButton;
    qryDDL_A_CREE_FADListeCOMMA_NUM: TFloatField;
    qryPPECHProdRetardCOMMA_NUM: TFloatField;
    qryDDL_A_CREE_FADListePOCDE_REF: TWideStringField;
    qryDDL_A_CREE_FADListeCOMMA_ST_DES: TWideStringField;
    qryPPECHProdRetardCOMMA_ST_DES: TWideStringField;
    qryPPECHProdRetardPOCDE_REF: TWideStringField;
    dxbrPPECHASolder: TdxBar;
    btnVisCOMMA3: TdxBarButton;
    btnVisPOCDE3: TdxBarButton;
    qryPPECHASolder: TUniQuery;
    qryPPECHASolderCOMMA_ID: TFloatField;
    qryPPECHASolderCOMMA_NUM: TFloatField;
    qryPPECHASolderCOMMA_VERSI: TFloatField;
    qryPPECHASolderCOMMA_ST: TFloatField;
    qryPPECHASolderCOMMA_ST_DES: TWideStringField;
    qryPPECHASolderPOCDE_ID: TFloatField;
    qryPPECHASolderPOCDE_NUM: TFloatField;
    qryPPECHASolderPOCDE_REF: TWideStringField;
    qryPPECHASolderPPECH_ID: TFloatField;
    qryPPECHASolderPPECH_DATE: TDateTimeField;
    dsPPECHASolder: TDataSource;
    qryPPECHASolderPPECH_QTE_ORI: TFloatField;
    qryPPECHASolderPPECH_QTE_TOLER: TFloatField;
    qryPPECHASolderPPECH_QTE_RESV: TFloatField;
    qryPPECHASolderPPECH_QTE_CONSO: TFloatField;
    qryPPECHASolderQTE_EXPEDIEE: TFloatField;
    qryPPECHASolderQTE_A_EXPED: TFloatField;
    qryPPECHASolderSOLDE_A_LIVRER: TFloatField;
    qryDDL_A_CREER: TUniQuery;
    dsDDL_A_CREER: TDataSource;
    dxbrDDL_A_CREER: TdxBar;
    btnVisPOCDE4: TdxBarButton;
    btnVisCOMMA4: TdxBarButton;
    cxEditRepository1: TcxEditRepository;
    chkFAD: TcxEditRepositoryCheckBoxItem;
    dxtcgProjets: TdxTileControlGroup;
    dxtciDDF_ECHANT: TdxTileControlItem;
    dxtciDMBAT_TYPE1: TdxTileControlItem;
    dxtciDMBAT_TYPE0: TdxTileControlItem;
    dxtciPPECHAFaderListe: TdxTileControlItem;
    qryPPECHAFader: TUniQuery;
    dsPPECHAFader: TDataSource;
    dxbrPPECHAFader: TdxBar;
    btnVisCOMMA5: TdxBarButton;
    btnVisPOCDE5: TdxBarButton;
    qryPPECHAFaderCOMMA_ID: TFloatField;
    qryPPECHAFaderCOMMA_NUM: TFloatField;
    qryPPECHAFaderCOMMA_VERSI: TFloatField;
    qryPPECHAFaderCOMMA_ST: TFloatField;
    qryPPECHAFaderCOMMA_ST_DES: TWideStringField;
    qryPPECHAFaderPOCDE_ID: TFloatField;
    qryPPECHAFaderPOCDE_NUM: TFloatField;
    qryPPECHAFaderPOCDE_REF: TWideStringField;
    qryPPECHAFaderPPECH_ID: TFloatField;
    qryPPECHAFaderPPECH_DATE: TDateTimeField;
    qryPPECHAFaderPPECH_DATE_FAD_CALC: TDateTimeField;
    qryPPECHAFaderPPECH_QTE_ORI: TFloatField;
    qryPPECHAFaderPPECH_QTE_TOLER: TFloatField;
    qryPPECHAFaderPPECH_QTE_RESV: TFloatField;
    qryPPECHAFaderPPECH_QTE_CONSO: TFloatField;
    qryPPECHASolderPOCDE_TYP_POSTE: TFloatField;
    qryPPECHASolderPOCDE_TYP_POSTE_DES: TWideStringField;
    qryDDL_A_CREE_FADListePOCDE_TYP_POSTE: TFloatField;
    qryDDL_A_CREE_FADListePOCDE_TYP_POSTE_DES: TWideStringField;
    qryPPECHProdRetardPOCDE_TYP_POSTE: TFloatField;
    qryPPECHProdRetardPOCDE_TYP_POSTE_DES: TWideStringField;
    qryPPECHAFaderPOCDE_TYP_POSTE: TFloatField;
    qryPPECHAFaderPOCDE_TYP_POSTE_DES: TWideStringField;
    qryPPECHAFaderTIERS_ID: TFloatField;
    qryPPECHAFaderTIERS_CODE: TWideStringField;
    qryPPECHAFaderTIERS_RS_L1: TWideStringField;
    qryPPECHAFaderPPECH_QTE_COLS_RESTE_A_FADER: TFloatField;
    qryPPECHAFaderPPECH_QTE_SUPP_RESTE_A_FADER: TFloatField;
    lblCDM_COLLA: TLabel;
    edtCDM_COLLA_ID: TEdit;
    edtCDM_COLLA_TRIG: TEdit;
    edtCDM_COLLA_NOM: TEdit;
    edtCDM_COLLA_PRENOM: TEdit;
    btnCDM_COLLA: TBitBtn;
    qryPPECHAFaderPPECH_QTE_SOLDE_A_LIVRER: TFloatField;
    lblRZA_COLLA: TLabel;
    edtRZA_COLLA_TRIG: TEdit;
    edtRZA_COLLA_NOM: TEdit;
    btnRZA_COLLA: TBitBtn;
    edtRZA_COLLA_ID: TEdit;
    edtRZA_COLLA_PRENOM: TEdit;
    qryPPECHProdRetardTIERS_ID: TFloatField;
    qryPPECHProdRetardTIERS_CODE: TWideStringField;
    qryPPECHProdRetardTIERS_RS_L1: TWideStringField;
    qryPPECHProdRetardPRCDT_ID: TFloatField;
    qryPPECHProdRetardPRCDT_DES: TWideStringField;
    qryPPECHProdRetardPRCDT_MODE_GES: TFloatField;
    qryPPECHProdRetardPRCDT_MODE_GES_DES: TWideStringField;
    qryPPECHAFaderPPECH_FACTURABLE: TFloatField;
    dxbsDATEMAD1: TdxBarStatic;
    dxbsDATEMAD2: TdxBarStatic;
    dxbsDATEMAD3: TdxBarStatic;
    qryDDL_A_CREE_FADListeTIERS_ID: TFloatField;
    qryDDL_A_CREE_FADListeTIERS_CODE: TWideStringField;
    qryDDL_A_CREE_FADListeTIERS_RS_L1: TWideStringField;
    qryDDL_A_CREE_FADListePRCDT_ID: TFloatField;
    qryDDL_A_CREE_FADListePRCDT_DES: TWideStringField;
    qryDDL_A_CREE_FADListePRCDT_MODE_GES: TFloatField;
    qryDDL_A_CREE_FADListePRCDT_MODE_GES_DES: TWideStringField;
    dxbrDEEXP_ST_0: TdxBar;
    dxbrDEEXP_ST_2: TdxBar;
    dxbrDDF_ECHANT: TdxBar;
    qryDDF_ECHANT: TUniQuery;
    dsDDF_ECHANT: TDataSource;
    btnVisDDF_ECHANT_DMFAB: TdxBarButton;
    qryDDF_ECHANTORFAB_ID: TFloatField;
    qryDDF_ECHANTORFAB_NUM: TFloatField;
    qryDDF_ECHANTORFAB_ST: TFloatField;
    qryDDF_ECHANTORFAB_ST_DES: TWideStringField;
    qryDDF_ECHANTORFAB_ST_COM: TFloatField;
    qryDDF_ECHANTORFAB_ST_COM_DES: TWideStringField;
    qryDDF_ECHANTORFAB_DATE_SOUHAI_DATE: TDateTimeField;
    qryDDF_ECHANTORFAB_MAD_DATE: TDateTimeField;
    qryDDF_ECHANTORFAB_DATE_FAB_PREV: TDateTimeField;
    qryDDF_ECHANTTIERS_ID: TFloatField;
    qryDDF_ECHANTTIERS_CODE: TWideStringField;
    qryDDF_ECHANTTIERS_RS_L1: TWideStringField;
    qryDDF_ECHANTPRCDT_ID: TFloatField;
    qryDDF_ECHANTPRCDT_DES: TWideStringField;
    dsDMBAT_TYPE0: TDataSource;
    qryDMBAT_TYPE0: TUniQuery;
    qryDMBAT_TYPE0CDCFO_ID: TFloatField;
    qryDMBAT_TYPE0CDCFO_NUM: TFloatField;
    qryDMBAT_TYPE0CDCFO_NUM_VERSI: TFloatField;
    qryDMBAT_TYPE0CDCFO_ST: TFloatField;
    qryDMBAT_TYPE0CDCFO_ST_DES: TWideStringField;
    qryDMBAT_TYPE0TIERS_CODE: TWideStringField;
    qryDMBAT_TYPE0TIERS_RS_L1: TWideStringField;
    qryDMBAT_TYPE0DMBAT_ID: TFloatField;
    qryDMBAT_TYPE0DMBAT_STATUT: TFloatField;
    qryDMBAT_TYPE0DMBAT_STATUT_DES: TWideStringField;
    qryDMBAT_TYPE0DMBAT_PAP_DMD_DATE: TDateTimeField;
    qryDMBAT_TYPE0DMBAT_PAP_PC_REP_DATE: TDateTimeField;
    qryDMBAT_TYPE0DMBAT_PAP_PC_MAD_DATE: TDateTimeField;
    qryDMBAT_TYPE0DMBAT_PAP_REA_MAIL_DATE: TDateTimeField;
    qryDMBAT_TYPE0DMBAT_PAP_ENVOI_CLIENT_DATE: TDateTimeField;
    qryDMBAT_TYPE0DMBAT_PAP_VALID_CLIENT_DATE: TDateTimeField;
    dxbrDMBAT_TYP0: TdxBar;
    btnVisCDCFO1: TdxBarButton;
    btnVisDMBAT1: TdxBarButton;
    qryDMBAT_TYPE0DMBAT_TYPE: TFloatField;
    dsDMBAT_TYPE1: TDataSource;
    qryDMBAT_TYPE1: TUniQuery;
    dxbrDMBAT_TYPE1: TdxBar;
    qryDMBAT_TYPE1CDCFO_ID: TFloatField;
    qryDMBAT_TYPE1CDCFO_NUM: TFloatField;
    qryDMBAT_TYPE1CDCFO_NUM_VERSI: TFloatField;
    qryDMBAT_TYPE1CDCFO_ST: TFloatField;
    qryDMBAT_TYPE1CDCFO_ST_DES: TWideStringField;
    qryDMBAT_TYPE1TIERS_CODE: TWideStringField;
    qryDMBAT_TYPE1TIERS_RS_L1: TWideStringField;
    qryDMBAT_TYPE1DMBAT_ID: TFloatField;
    qryDMBAT_TYPE1DMBAT_TYPE: TFloatField;
    qryDMBAT_TYPE1DMBAT_STATUT: TFloatField;
    qryDMBAT_TYPE1DMBAT_STATUT_DES: TWideStringField;
    qryDMBAT_TYPE1DMBAT_VER_DMD_DATE: TDateTimeField;
    qryDMBAT_TYPE1DMBAT_VER_PC_REP_DATE: TDateTimeField;
    qryDMBAT_TYPE1DMBAT_VER_PC_MAD_DATE: TDateTimeField;
    qryDMBAT_TYPE1DMBAT_VER_REA_MAIL_DATE: TDateTimeField;
    qryDMBAT_TYPE1DMBAT_VER_ENVOI_CLIENT_DATE: TDateTimeField;
    qryDMBAT_TYPE1DMBAT_VER_VALID_CLIENT_DATE: TDateTimeField;
    btnVisCDCFO2: TdxBarButton;
    btnVisDMBAT2: TdxBarButton;
    dxtcgExpeditions: TdxTileControlGroup;
    dxtcgFactures: TdxTileControlGroup;
    dxtciOFFRE_ST_0: TdxTileControlItem;
    dxtciOFFRE_A_RELANCER: TdxTileControlItem;
    qryPOCDE_DECOR: TUniQuery;
    dsPOCDE_DECOR: TDataSource;
    qryPOCDE_DECORCOMMA_ID: TFloatField;
    qryPOCDE_DECORCOMMA_NUM: TFloatField;
    qryPOCDE_DECORCOMMA_VERSI: TFloatField;
    qryPOCDE_DECORCOMMA_ST: TFloatField;
    qryPOCDE_DECORCOMMA_ST_DES: TWideStringField;
    qryPOCDE_DECORPOCDE_ID: TFloatField;
    qryPOCDE_DECORPOCDE_NUM: TFloatField;
    qryPOCDE_DECORPOCDE_TYP_POSTE: TFloatField;
    qryPOCDE_DECORPOCDE_TYP_POSTE_DES: TWideStringField;
    qryPOCDE_DECORTIERS_ID: TFloatField;
    qryPOCDE_DECORTIERS_CODE: TWideStringField;
    qryPOCDE_DECORTIERS_RS_L1: TWideStringField;
    qryPOCDE_DECORPRCDT_ID: TFloatField;
    qryPOCDE_DECORPRCDT_DES: TWideStringField;
    qryPOCDE_DECORPRCDT_MODE_GES_DES: TWideStringField;
    qryPOCDE_DECORPOCDE_REF: TWideStringField;
    dxbrPOCDE_DECOR: TdxBar;
    dxtciPOCDE_DECOR: TdxTileControlItem;
    btnVisCOMMA6: TdxBarButton;
    btnVisPOCDE6: TdxBarButton;
    qryPOCDE_DECORPOCDE_SOLDE: TIntegerField;
    qryPOCDE_DECORPRCDT_MODE_GES: TFloatField;
    dxtciDMDAPListe: TdxTileControlItem;
    dxtciPCDAG_A_TRAITER: TdxTileControlItem;
    dsOFFRE_ST_0: TDataSource;
    qryOFFRE_ST_0: TUniQuery;
    qryOFFRE_ST_0OFFRE_ID: TFloatField;
    qryOFFRE_ST_0OFFRE_TYP: TFloatField;
    qryOFFRE_ST_0OFFRE_NUM: TFloatField;
    qryOFFRE_ST_0OFFRE_VERSI: TFloatField;
    qryOFFRE_ST_0OFFRE_ST: TFloatField;
    qryOFFRE_ST_0OFFRE_ST_DES: TWideStringField;
    qryOFFRE_ST_0OFFRE_DATE: TDateTimeField;
    qryOFFRE_ST_0OFFRE_DATE_REPON: TDateTimeField;
    qryOFFRE_ST_0OFFRE_DATE_VAL: TDateTimeField;
    qryOFFRE_ST_0OFFRE_REF_CLI: TWideStringField;
    qryOFFRE_ST_0ADM_COLLA_ID: TFloatField;
    qryOFFRE_ST_0ADM_COLLA_TRIG: TWideStringField;
    qryOFFRE_ST_0ADM_NOMPRENOM: TWideStringField;
    qryOFFRE_ST_0CDM_COLLA_ID: TFloatField;
    qryOFFRE_ST_0CDM_COLLA_TRIG: TWideStringField;
    qryOFFRE_ST_0CDM_NOMPRENOM: TWideStringField;
    qryOFFRE_ST_0TIERS_ID: TFloatField;
    qryOFFRE_ST_0TIERS_CODE: TWideStringField;
    qryOFFRE_ST_0TIERS_RS_L1: TWideStringField;
    qryOFFRE_ST_0OFFRE_DER_VERSI: TIntegerField;
    dxbrOFFRE_ST_0: TdxBar;
    btnVisOFFRE_ST_0: TdxBarButton;
    dsOFFRE_A_RELANCER: TDataSource;
    qryOFFRE_A_RELANCER: TUniQuery;
    FMTFloatField1: TFloatField;
    FMTFloatField2: TFloatField;
    FMTFloatField3: TFloatField;
    FMTFloatField4: TFloatField;
    IntegerField1: TIntegerField;
    FMTFloatField5: TFloatField;
    WideStringField1: TWideStringField;
    DateTimeField1: TDateTimeField;
    DateTimeField3: TDateTimeField;
    WideStringField2: TWideStringField;
    FMTFloatField6: TFloatField;
    WideStringField3: TWideStringField;
    WideStringField4: TWideStringField;
    FMTFloatField7: TFloatField;
    WideStringField5: TWideStringField;
    WideStringField6: TWideStringField;
    FMTFloatField8: TFloatField;
    WideStringField7: TWideStringField;
    WideStringField8: TWideStringField;
    dxbrOFFRE_A_RELANCER: TdxBar;
    btnVisOFFRE_A_RELANCER: TdxBarButton;
    dsPCDAG_A_TRAITER: TDataSource;
    qryPCDAG_A_TRAITER: TUniQuery;
    qryPCDAG_A_TRAITERCDACG_ID: TFloatField;
    qryPCDAG_A_TRAITERCDACG_SEQ: TFloatField;
    qryPCDAG_A_TRAITERCDACG_ST: TFloatField;
    qryPCDAG_A_TRAITERPCDAG_ID: TFloatField;
    qryPCDAG_A_TRAITERPCDAG_NUM: TFloatField;
    qryPCDAG_A_TRAITERPCDAG_PRCDT_ID: TFloatField;
    qryPCDAG_A_TRAITERPCDAG_QTE: TFloatField;
    qryPCDAG_A_TRAITERPCDAG_TYP: TFloatField;
    qryPCDAG_A_TRAITERPCDAG_FLG_LIV_DIRECT: TIntegerField;
    dxbrPCDAG_A_TRAITER: TdxBar;
    qryPCDAG_A_TRAITERCDACG_NUM: TWideStringField;
    qryPCDAG_A_TRAITERTIERS_ID: TFloatField;
    qryPCDAG_A_TRAITERTIERS_CODE: TWideStringField;
    qryPCDAG_A_TRAITERTIERS_RS_L1: TWideStringField;
    qryPCDAG_A_TRAITERPRCDT_ID: TFloatField;
    qryPCDAG_A_TRAITERPRCDT_DES: TWideStringField;
    qryPCDAG_A_TRAITERPRCDT_MODE_GES: TFloatField;
    qryPCDAG_A_TRAITERPRCDT_MODE_GES_DES: TWideStringField;
    btnVisPCDAG: TdxBarButton;
    btnVisCDACG: TdxBarButton;
    dxbsLimiteTrait: TdxBarStatic;
    qryDDL_A_CREERCOMMA_ID: TFloatField;
    qryDDL_A_CREERCOMMA_NUM: TFloatField;
    qryDDL_A_CREERCOMMA_VERSI: TFloatField;
    qryDDL_A_CREERCOMMA_ST: TFloatField;
    qryDDL_A_CREERCOMMA_ST_DES: TWideStringField;
    qryDDL_A_CREERPOCDE_ID: TFloatField;
    qryDDL_A_CREERPOCDE_NUM: TFloatField;
    qryDDL_A_CREERPOCDE_TYP_POSTE: TFloatField;
    qryDDL_A_CREERPOCDE_TYP_POSTE_DES: TWideStringField;
    qryDDL_A_CREERPOCDE_REF: TWideStringField;
    qryDDL_A_CREERPPECH_ID: TFloatField;
    qryDDL_A_CREERPPECH_DATE: TDateTimeField;
    qryDDL_A_CREERPPECH_DATE_MAD_DMD: TDateTimeField;
    qryDDL_A_CREERPPECH_QTE_ORI: TFloatField;
    qryDDL_A_CREERPPECH_QTE_TOLER: TFloatField;
    qryDDL_A_CREERPPECH_QTE_RESV: TFloatField;
    qryDDL_A_CREERPPECH_QTE_CONSO: TFloatField;
    qryDDL_A_CREERSOLDE_A_LIVRER_COLS: TFloatField;
    qryDDL_A_CREERSOLDE_A_LIVRER_PALS: TFloatField;
    qryDDL_A_CREERPPECH_QTE_A_EXPED: TFloatField;
    qryDDL_A_CREERLI_TIERS_ID: TFloatField;
    qryDDL_A_CREERLI_TIERS_CODE: TWideStringField;
    qryDDL_A_CREERLI_TIERS_RS_L1: TWideStringField;
    qryDDL_A_CREERPPECH_OBSV_MAD_CLI: TWideStringField;
    qryDDL_A_CREERLIEFF_ID: TFloatField;
    qryDDL_A_CREERLIEFF_TYP: TFloatField;
    qryDDL_A_CREERLIEFF_TYP_DES: TWideStringField;
    qryDDL_A_CREERLIEFF_LIEU_ID: TFloatField;
    qryDDL_A_CREERLIEFF_DES: TWideStringField;
    qryDDL_A_CREERPRCDT_DES: TWideStringField;
    qryDDL_A_CREERCLT_FIN_TIERS_ID: TFloatField;
    qryDDL_A_CREERCLT_FIN_TIERS_CODE: TWideStringField;
    qryDDL_A_CREERCLT_FIN_TIERS_RS_L1: TWideStringField;
    qryDDL_A_CREERADM_COLLA_TRIG: TWideStringField;
    qryDDL_A_CREERPPECH_OBSV_COMP: TWideStringField;
    dxtciDEEXP_ANOMA: TdxTileControlItem;
    dxtciCADEN_PPECH: TdxTileControlItem;
    dxtciFACTU_AVOIR: TdxTileControlItem;
    qryDMBAT_TYPE0VSUPO_NUM: TFloatField;
    qryDMBAT_TYPE0VSUPO_DES: TWideStringField;
    qryDMBAT_TYPE0VDECO_NUM: TFloatField;
    qryDMBAT_TYPE0VDECO_DES: TWideStringField;
    qryDMBAT_TYPE1VSUPO_NUM: TFloatField;
    qryDMBAT_TYPE1VSUPO_DES: TWideStringField;
    qryDMBAT_TYPE1VDECO_NUM: TFloatField;
    qryDMBAT_TYPE1VDECO_DES: TWideStringField;
    qryPPECHAFaderPPECH_DATE_FAD: TDateTimeField;
    qryPPECHProdRetardDMDAP_DATE_VALIDITE: TDateTimeField;
    lblRZC_COLLA: TLabel;
    edtRZC_COLLA_ID: TEdit;
    edtRZC_COLLA_TRIG: TEdit;
    edtRZC_COLLA_NOM: TEdit;
    edtRZC_COLLA_PRENOM: TEdit;
    btnRZC_COLLA: TBitBtn;
    qryDDL_A_CREE_FADListeFAD_QTE_COLS: TFloatField;
    qryDDL_A_CREE_FADListeFAD_QTE_PALS: TFloatField;
    qryPPECHAFaderPRCDT_ID: TFloatField;
    qryPPECHAFaderPRCDT_DES: TWideStringField;
    qryPPECHAFaderMODEL_CODE: TWideStringField;
    qryDDF_ECHANTORFAB_QTE_SOUHAI: TFloatField;
    qryDDF_ECHANTMODEL_CODE: TWideStringField;
    qryDDF_ECHANTMODEL_DES: TWideStringField;
    btnVisPPECH1: TdxBarButton;
    btnVisPPECH2: TdxBarButton;
    btnVisPPECH3: TdxBarButton;
    btnVisPPECH4: TdxBarButton;
    btnVisPPECH5: TdxBarButton;
    btnVisPPECH6: TdxBarButton;
    lblTIERS: TLabel;
    edtTIERS_CODE: TEdit;
    edtTIERS_RS_L1: TEdit;
    btnTIERS: TBitBtn;
    edtTIERS_ID: TEdit;
    lblZOCOM: TLabel;
    edtZOCOM_ID: TEdit;
    edtZOCOM_DES: TEdit;
    btnZOCOM: TBitBtn;
    qryPPECHProdRetardADM_TRIG: TWideStringField;
    dxtciTARIF_ST0: TdxTileControlItem;
    dxtciTARIF_ST1: TdxTileControlItem;
    dxtciPOCDE_BLK: TdxTileControlItem;
    qryPPECHASolderADM_COLLA_TRIG: TWideStringField;
    qryPPECHASolderCDM_COLLA_TRIG: TWideStringField;
    qryPOCDE_DECORADM_COLLA_TRIG: TWideStringField;
    qryPOCDE_DECORCDM_COLLA_TRIG: TWideStringField;
    qryPOCDE_DECORCOMMA_REF_CL: TWideStringField;
    qryPOCDE_DECORORFAB_DATE: TDateTimeField;
    qryDDL_A_CREERZOSTO_CODE: TWideStringField;
    qryDDL_A_CREERZOSTO_DES: TWideStringField;
    qryDDL_A_CREERCOMMA_REF_CL: TWideStringField;
    qryDDL_A_CREERORFAB_MAD_DATE: TDateTimeField;
    qryDDL_A_CREE_FADListeADM_TRIG: TWideStringField;
    qryDDL_A_CREE_FADListeCDM_TRIG: TWideStringField;
    qryPPECHAFaderADM_TRIG: TWideStringField;
    qryPPECHAFaderCDM_TRIG: TWideStringField;
    qryPPECHAFaderPRCDT_MODE_GES: TFloatField;
    qryPPECHAFaderPRCDT_MODE_GES_DES: TWideStringField;
    dxtciFCMNT_A_FACT: TdxTileControlItem;
    dxtciESN1A_ST1: TdxTileControlItem;
    dxtciESN1A_ST0: TdxTileControlItem;
    dxtciNFSTK_ST0: TdxTileControlItem;
    dxtciSTOCKS_2ANS: TdxTileControlItem;
    qrySTOCKS_2ANS: TUniQuery;
    dsSTOCKS_2ANS: TDataSource;
    qrySTOCKS_2ANSCOMMA_ID: TFloatField;
    qrySTOCKS_2ANSCOMMA_NUM: TFloatField;
    qrySTOCKS_2ANSCOMMA_VERSI: TFloatField;
    qrySTOCKS_2ANSCOMMA_ST: TFloatField;
    qrySTOCKS_2ANSCOMMA_ST_DES: TWideStringField;
    qrySTOCKS_2ANSPOCDE_ID: TFloatField;
    qrySTOCKS_2ANSPOCDE_NUM: TFloatField;
    qrySTOCKS_2ANSPOCDE_TYP_POSTE: TFloatField;
    qrySTOCKS_2ANSPOCDE_TYP_POSTE_DES: TWideStringField;
    qrySTOCKS_2ANSPOCDE_REF: TWideStringField;
    qrySTOCKS_2ANSPRCDT_ID: TFloatField;
    qrySTOCKS_2ANSPRCDT_DES: TWideStringField;
    qrySTOCKS_2ANSPRCDT_MODE_GES: TFloatField;
    qrySTOCKS_2ANSPRCDT_MODE_GES_DES: TWideStringField;
    qrySTOCKS_2ANSPPECH_ID: TFloatField;
    qrySTOCKS_2ANSPPECH_DATE: TDateTimeField;
    qrySTOCKS_2ANSPPECH_QTE_ORI: TFloatField;
    qrySTOCKS_2ANSPPECH_QTE_TOLER: TFloatField;
    qrySTOCKS_2ANSPPECH_QTE_RESV: TFloatField;
    qrySTOCKS_2ANSPPECH_QTE_CONSO: TFloatField;
    qrySTOCKS_2ANSPPECH_QTE_SOLDE: TFloatField;
    qrySTOCKS_2ANSQTE_EXPEDIEE: TFloatField;
    qrySTOCKS_2ANSQTE_A_EXPED: TFloatField;
    qrySTOCKS_2ANSSOLDE_A_LIVRER: TFloatField;
    qrySTOCKS_2ANSADM_COLLA_TRIG: TWideStringField;
    qrySTOCKS_2ANSCDM_COLLA_TRIG: TWideStringField;
    qrySTOCKS_2ANSAVMAD_ID: TFloatField;
    qrySTOCKS_2ANSAVMAD_DATE_REF: TDateTimeField;
    dxbrSTOCKS_2ANS: TdxBar;
    qryOFFRE_A_RELANCEROFFRE_DATE_RELANCE: TDateTimeField;
    dxLimitDateRElance: TdxBarStatic;
    qryOFFRE_A_RELANCEROFFRE_TYPE_DES: TWideStringField;
    qryOFFRE_A_RELANCERRZA_COLLA_TRIG: TWideStringField;
    qryDDL_A_CREERPALTI_DEBOR_FLG: TFloatField;
    qryDDL_A_CREERPRDCF_ID: TFloatField;
    qryOFFRE_A_RELANCEREMET_COLLA_ID: TFloatField;
    qryOFFRE_A_RELANCEREMET_COLLA_TRIG: TWideStringField;
    qryOFFRE_A_RELANCEREMET_NOMPRENOM: TWideStringField;
    qryOFFRE_ST_0EMET_COLLA_ID: TFloatField;
    qryOFFRE_ST_0EMET_COLLA_TRIG: TWideStringField;
    qryOFFRE_ST_0EMET_NOMPRENOM: TWideStringField;
    qryOFFRE_ST_0RZA_COLLA_TRIG: TWideStringField;
    qryOFFRE_ST_0OFFRE_TYPE_DES: TWideStringField;
    qryPPECHAFaderPPECH_SOLDE_RESV: TFloatField;
    qryPPECHAFaderJDFEC_DES: TWideStringField;
    qryOFFRE_ST_0MONTANT: TWideStringField;
    qryOFFRE_ST_0DVISE_CODE: TWideStringField;
    qryOFFRE_A_RELANCERMONTANT: TWideStringField;
    qryOFFRE_A_RELANCERDVISE_CODE: TWideStringField;
    qryDDL_A_CREERDATE_MAD_CLIENT: TDateTimeField;
    qryDDL_A_CREERARBBE_DATE_RENDU: TDateTimeField;
    dxtcAVOIRS_A_VALIDER: TdxTileControlItem;

    btnExportExcel: TSpeedButton;
    Export_ProgressBar: TAdvProgressBar;
    dxmdDDL_A_CREERListe: TdxMemData;
    dxmdDDL_A_CREERListeCheckDDL: TIntegerField;
    dxmdDDL_A_CREERListePALTI_IS_GERBABLE: TIntegerField;
    dxmdDDL_A_CREERListeCOMMA_ID: TIntegerField;
    dxmdDDL_A_CREERListeCOMMA_NUM: TIntegerField;
    dxmdDDL_A_CREERListeCOMMA_VERSI: TIntegerField;
    dxmdDDL_A_CREERListeCOMMA_ST: TIntegerField;
    dxmdDDL_A_CREERListeDATE_MAD_CLIENT: TDateTimeField;
    dxmdDDL_A_CREERListePPECH_DATE: TDateTimeField;
    dxmdDDL_A_CREERListeORFAB_MAD_DATE: TDateTimeField;
    dxmdDDL_A_CREERListeZOSTO_CODE: TStringField;
    dxmdDDL_A_CREERListeZOSTO_DES: TStringField;
    dxmdDDL_A_CREERListePPECH_DATE_MAD_DMD: TDateTimeField;
    dxmdDDL_A_CREERListePOCDE_ID: TIntegerField;
    dxmdDDL_A_CREERListePOCDE_NUM: TIntegerField;
    dxmdDDL_A_CREERListePOCDE_TYP_POSTE: TIntegerField;
    dxmdDDL_A_CREERListePOCDE_TYP_POSTE_DES: TStringField;
    dxmdDDL_A_CREERListePPECH_ID: TIntegerField;
    dxmdDDL_A_CREERListePPECH_QTE_TOLER: TIntegerField;
    dxmdDDL_A_CREERListePPECH_QTE_RESV: TIntegerField;
    dxmdDDL_A_CREERListeLI_TIERS_CODE: TStringField;
    dxmdDDL_A_CREERListeLI_TIERS_RS_L1: TStringField;
    dxmdDDL_A_CREERListeSOLDE_A_LIVRER_COLS: TIntegerField;
    dxmdDDL_A_CREERListeSOLDE_A_LIVRER_PALS: TIntegerField;
    dxmdDDL_A_CREERListePALTI_DEBOR_FLG: TIntegerField;
    dxmdDDL_A_CREERListePPECH_OBSV_MAD_CLI: TStringField;
    dxmdDDL_A_CREERListeLIEFF_TYP_DES: TStringField;
    dxmdDDL_A_CREERListeLIEFF_DES: TStringField;
    dxmdDDL_A_CREERListePOCDE_REF: TStringField;
    dxmdDDL_A_CREERListeCOMMA_ST_DES: TStringField;
    dxmdDDL_A_CREERListePRCDT_DES: TStringField;
    dxmdDDL_A_CREERListePPECH_QTE_ORI: TIntegerField;
    dxmdDDL_A_CREERListePPECH_QTE_A_EXPED: TIntegerField;
    dxmdDDL_A_CREERListePPECH_QTE_CONSO: TIntegerField;
    dxmdDDL_A_CREERListeLI_TIERS_ID: TIntegerField;
    dxmdDDL_A_CREERListeLIEFF_ID: TIntegerField;
    dxmdDDL_A_CREERListeLIEFF_TYP: TIntegerField;
    dxmdDDL_A_CREERListeLIEFF_LIEU_ID: TIntegerField;
    dxmdDDL_A_CREERListeCLT_FIN_TIERS_ID: TIntegerField;
    dxmdDDL_A_CREERListePPECH_OBSV_COMP: TStringField;
    dxmdDDL_A_CREERListeCLT_FIN_TIERS_CODE: TStringField;
    dxmdDDL_A_CREERListeCLT_FIN_TIERS_RS_L1: TStringField;
    dxmdDDL_A_CREERListeADM_COLLA_TRIG: TStringField;
    dxmdDDL_A_CREERListeCOMMA_REF_CL: TStringField;
    qryDDL_A_CREERCADEN_ID: TFloatField;
    qryDDL_A_CREERCADEN_NUM: TWideStringField;
    qryDDL_A_CREERCADEN_DATECRE: TDateTimeField;
    qryDDL_A_CREERCADEN_EXPE_ST: TFloatField;
    qryDDL_A_CREERCADEN_EXP_ST_DES: TWideStringField;
    qryDDL_A_CREERCADEN_CMNT: TWideStringField;
    qryDDL_A_CREERCADEN_FLG_DDL_AUTO_DES: TWideStringField;
    dxmdDDL_A_CREERListeCADEN_ID: TIntegerField;
    dxmdDDL_A_CREERListeCADEN_NUM: TStringField;
    dxmdDDL_A_CREERListeCADEN_DATECRE: TDateTimeField;
    dxmdDDL_A_CREERListeCADEN_EXPE_ST: TIntegerField;
    dxmdDDL_A_CREERListeCADEN_EXP_ST_DES: TStringField;
    dxmdDDL_A_CREERListeCADEN_CMNT: TStringField;
    dxmdDDL_A_CREERListeCADEN_FLG_DDL_AUTO_DES: TStringField;
    qryDDL_A_CREERPALTI_IS_GERBABLE: TFloatField;
    btnTarif_Anomalie_REC: TdxBarButton;
    pmPopupDDL_A_CREER: TPopupMenu;
    ItmCocherTout: TMenuItem;
    dxmdDDL_A_CREERListeDEROG_ZOSTO_CODE: TStringField;
    qryDDL_A_CREERDEROG_ZOSTO_CODE: TWideStringField;
    dxtciTARIF_ANOMALIE: TdxTileControlItem;
    tmRecherche: TTimer;
    qryPPECHASolderTIERS_NOM: TWideStringField;
    qryPPECHASolderSOLDE_A_COUVRIR: TFloatField;
    qryPPECHASolderPRCDT_DES: TWideStringField;
    qryPPECHASolderNON_A_COUVRIR: TSmallintField;
    qryPPECHASolderDENIER_BOLIV: TDateTimeField;
    qryPPECHASolderPOCDE_TYP_PRD: TFloatField;
    dxtciBOLIV_A_FACT: TdxTileControlItem;
    qryPPECHAFaderLIVRAISONS_PLANIFIEES: TFloatField;
    qryPPECHAFaderSUM_QTE_DDL: TFloatField;
    qryOFFRE_A_RELANCEROFFRE_TYP_DES: TWideStringField;
    qryPPECHASolderFLG_ECH_SOLDE: TFloatField;
    btnPPECH_REC: TdxBarButton;
    btnPPECHProdRetard_REC: TdxBarButton;
    btnPPECHASolder_REC: TdxBarButton;
    btnDDL_A_CREER_REC: TdxBarButton;
    btnPPECHAFader: TdxBarButton;
    btnDDF_Echant_REC: TdxBarButton;
    btnDMBAType0: TdxBarButton;
    btnDMBATType1: TdxBarButton;
    btnPOCDEDecor_REC: TdxBarButton;
    btnOffreSt0_REC: TdxBarButton;
    btnOffreARelancer_REC: TdxBarButton;
    btnPCDAGATraiter_REC: TdxBarButton;
    qryDDL_A_CREERMODTR_DES: TWideStringField;
    // feature/CDE02781 FPE 14/04/2025 TDB ADV - DDL � cr�er, colonne ajout�es : Mode de transport,Incoterm, pays du lieu d'effet, code postal
    dxmdDDL_A_CREERListeMODTR_DES: TStringField;
    dxmdDDL_A_CREERListeINCOT_CODE: TStringField;
    dxmdDDL_A_CREERListeLIEFF_PAYS: TStringField;
    dxmdDDL_A_CREERListeLI_CODE_POSTAL: TStringField;
    dxtciDAMCC: TdxTileControlItem;
    qryDDL_A_CREERINCOT_CODE: TWideStringField;
    qryDDL_A_CREERLIEFF_PAYS: TWideStringField;
    qryDDL_A_CREERLI_CODE_POSTAL: TWideStringField;

    dxtcTilesGroup1: TdxTileControlGroup;
    dxtciARC_Discussion: TdxTileControlItem;
    qryPCDAG_A_TRAITERPCDAG_DMAPR_ID: TFloatField;
    qryTARIFListe: TUniQuery;
    dsTARIF: TDataSource;
    qryTARIFListeTARIF_ID: TFloatField;
    qryTARIFListeTARIF_NUM_VER: TFloatField;
    qryTARIFListeTARIF_DES: TWideStringField;
    qryTARIFListePRCDT_ID: TFloatField;
    qryTARIFListeOLD_PRCDT_ID: TFloatField;
    qryTARIFListeOLD_PRCDT_DES: TWideStringField;
    qryTARIFListeNEW_PRCDT_ID: TFloatField;
    qryTARIFListeNEW_PRCDT_DES: TWideStringField;
    dxtciECH_EN_COURS: TdxTileControlItem;
    qryOFFRE_A_RELANCERCOLLA_TRIG: TWideStringField;
    cxPageControl1: TcxPageControl;
    tbsPPECHProdRetard: TcxTabSheet;
    pnlPPECHProdRetard: TPanel;
    dxBarDockControl2: TdxBarDockControl;
    dxdgPPECHProdRetard: TcxGrid;
    cxgtvPPECHProdRetard: TcxGridDBTableView;
    cxgtvPPECHProdRetardCOMMA_ID: TcxGridDBColumn;
    cxgtvPPECHProdRetardCOMMA_NUM: TcxGridDBColumn;
    cxgtvPPECHProdRetardCOMMA_VERSI: TcxGridDBColumn;
    cxgtvPPECHProdRetardCOMMA_ST: TcxGridDBColumn;
    cxgtvPPECHProdRetardPOCDE_ID: TcxGridDBColumn;
    cxgtvPPECHProdRetardPOCDE_NUM: TcxGridDBColumn;
    cxgtvPPECHProdRetardPOCDE_TYP_POSTE: TcxGridDBColumn;
    cxgtvPPECHProdRetardPOCDE_REF: TcxGridDBColumn;
    cxgtvPPECHProdRetardCOMMA_ST_DES: TcxGridDBColumn;
    cxgtvPPECHProdRetardPOCDE_TYP_POSTE_DES: TcxGridDBColumn;
    cxgtvPPECHProdRetardPPECH_ID: TcxGridDBColumn;
    cxgtvPPECHProdRetardPPECH_DATE: TcxGridDBColumn;
    cxgtvPPECHProdRetardDMDAP_DATE_VALIDITE: TcxGridDBColumn;
    cxgtvPPECHProdRetardORFAB_DATE_FAB_PREV: TcxGridDBColumn;
    cxgtvPPECHProdRetardTIERS_ID: TcxGridDBColumn;
    cxgtvPPECHProdRetardTIERS_CODE: TcxGridDBColumn;
    cxgtvPPECHProdRetardTIERS_RS_L1: TcxGridDBColumn;
    cxgtvPPECHProdRetardPRCDT_ID: TcxGridDBColumn;
    cxgtvPPECHProdRetardPRCDT_DES: TcxGridDBColumn;
    cxgtvPPECHProdRetardPRCDT_MODE_GES: TcxGridDBColumn;
    cxgtvPPECHProdRetardPRCDT_MODE_GES_DES: TcxGridDBColumn;
    cxgtvPPECHProdRetardADM_TRIG: TcxGridDBColumn;
    cxglPPECHProdRetard: TcxGridLevel;
    tbsPPECHASolder: TcxTabSheet;
    pnlPPECHASolder: TPanel;
    dxBarDockControl3: TdxBarDockControl;
    dxdgPPECHASolder: TcxGrid;
    cxgtvPPECHASolder: TcxGridDBTableView;
    cxgtvPPECHASolderCOMMA_ID: TcxGridDBColumn;
    cxgtvPPECHASolderCOMMA_NUM: TcxGridDBColumn;
    cxgtvPPECHASolderCOMMA_VERSI: TcxGridDBColumn;
    cxgtvPPECHASolderPOCDE_ID: TcxGridDBColumn;
    cxgtvPPECHASolderPOCDE_NUM: TcxGridDBColumn;
    cxgtvPPECHASolderPOCDE_TYP_POSTE: TcxGridDBColumn;
    cxgtvPPECHASolderPOCDE_REF: TcxGridDBColumn;
    cxgtvPPECHASolderTIERS_NOM: TcxGridDBColumn;
    cxgtvPPECHASolderCOMMA_ST: TcxGridDBColumn;
    cxgtvPPECHASolderCOMMA_ST_DES: TcxGridDBColumn;
    cxgtvPPECHASolderPOCDE_TYP_POSTE_DES: TcxGridDBColumn;
    cxgtvPPECHASolderPPECH_ID: TcxGridDBColumn;
    cxgtvPPECHASolderPRCDT_DES: TcxGridDBColumn;
    cxgtvPPECHASolderPPECH_DATE: TcxGridDBColumn;
    cxgtvPPECHASolderPPECH_QTE_TOLER: TcxGridDBColumn;
    cxgtvPPECHASolderPPECH_QTE_RESV: TcxGridDBColumn;
    cxgtvPPECHASolderPPECH_QTE_CONSO: TcxGridDBColumn;
    cxgtvPPECHASolderSOLDE_A_COUVRIR: TcxGridDBColumn;
    cxgtvPPECHASolderNON_A_COUVRIR: TcxGridDBColumn;
    cxgtvPPECHASolderDENIER_BOLIV: TcxGridDBColumn;
    cxgtvPPECHASolderADM_COLLA_TRIG: TcxGridDBColumn;
    cxgtvPPECHASolderCDM_COLLA_TRIG: TcxGridDBColumn;
    cxgtvPPECHASolderCOMMA_ST1: TcxGridDBColumn;
    cxgtvPPECHASolderPPECH_QTE_ORI: TcxGridDBColumn;
    cxgtvPPECHASolderQTE_EXPEDIEE: TcxGridDBColumn;
    cxgtvPPECHASolderQTE_A_EXPED: TcxGridDBColumn;
    cxgtvPPECHASolderSOLDE_A_LIVRER: TcxGridDBColumn;
    cxgtvPPECHASolderPOCDE_TYP_PRD: TcxGridDBColumn;
    cxglPPECHASolder: TcxGridLevel;
    tbsPPECHAFader: TcxTabSheet;
    pnlPPECHAFader: TPanel;
    dxBarDockControl5: TdxBarDockControl;
    dxdgPPECHAFader: TcxGrid;
    cxgtvPPECHAFader: TcxGridDBTableView;
    cxgtvPPECHAFaderTIERS_ID: TcxGridDBColumn;
    cxgtvPPECHAFaderTIERS_CODE: TcxGridDBColumn;
    cxgtvPPECHAFaderTIERS_RS_L1: TcxGridDBColumn;
    cxgtvPPECHAFaderCOMMA_ID: TcxGridDBColumn;
    cxgtvPPECHAFaderCOMMA_NUM: TcxGridDBColumn;
    cxgtvPPECHAFaderCOMMA_VERSI: TcxGridDBColumn;
    cxgtvPPECHAFaderCOMMA_ST: TcxGridDBColumn;
    cxgtvPPECHAFaderPOCDE_ID: TcxGridDBColumn;
    cxgtvPPECHAFaderPOCDE_NUM: TcxGridDBColumn;
    cxgtvPPECHAFaderPOCDE_REF: TcxGridDBColumn;
    cxgtvPPECHAFaderCOMMA_ST_DES: TcxGridDBColumn;
    cxgtvPPECHAFaderPOCDE_TYP_POSTE_DES: TcxGridDBColumn;
    cxgtvPPECHAFaderPPECH_DATE: TcxGridDBColumn;
    cxgtvPPECHAFaderPPECH_DATE_FAD_CALC: TcxGridDBColumn;
    cxgtvPPECHAFaderPPECH_DATE_FAD: TcxGridDBColumn;
    cxgtvPPECHAFaderPPECH_QTE_ORI: TcxGridDBColumn;
    cxgtvPPECHAFaderPPECH_QTE_TOLER: TcxGridDBColumn;
    cxgtvPPECHAFaderPPECH_QTE_RESV: TcxGridDBColumn;
    cxgtvPPECHAFaderPPECH_QTE_CONSO: TcxGridDBColumn;
    cxgtvPPECHAFaderPOCDE_TYP_POSTE: TcxGridDBColumn;
    cxgtvPPECHAFaderPPECH_QTE_COLS_RESTE_A_FADER: TcxGridDBColumn;
    cxgtvPPECHAFaderPPECH_QTE_SUPP_RESTE_A_FADER: TcxGridDBColumn;
    cxgtvPPECHAFaderTIERS_CODEPPECHAFaderPPECH_QTE_SOLDE_A_LIVRER
      : TcxGridDBColumn;
    cxgtvPPECHAFaderLIVRAISONS_PLANIFIEES: TcxGridDBColumn;
    cxgtvPPECHAFaderSUM_QTE_DDL: TcxGridDBColumn;
    cxgtvPPECH_SOLDE_RESV: TcxGridDBColumn;
    cxgtvPPECHAFaderTIERS_CODEPPECH_FACTURABLE: TcxGridDBColumn;
    cxgtvPPECH_CMNT_DATE_FAD: TcxGridDBColumn;
    cxgtvPPECHAFaderPRCDT_ID: TcxGridDBColumn;
    cxgtvPPECHAFaderMODEL_CODE: TcxGridDBColumn;
    cxgtvPPECHAFaderPRCDT_DES: TcxGridDBColumn;
    cxgtvPPECHAFaderPRCDT_MODE_GES: TcxGridDBColumn;
    cxgtvPPECHAFaderPRCDT_MODE_GES_DES: TcxGridDBColumn;
    cxgtvPPECHAFaderADM_TRIG: TcxGridDBColumn;
    cxgtvPPECHAFaderCDM_TRIG: TcxGridDBColumn;
    cxgtvPPECHAFaderPPECH_ID: TcxGridDBColumn;
    cxglPPECHAFader: TcxGridLevel;
    tbsDDF_ECHANT: TcxTabSheet;
    pnlDDF_ECHANT: TPanel;
    dxBarDockControl6: TdxBarDockControl;
    dxdgDDF_ECHANT: TcxGrid;
    cxgtvDDF_ECHANT: TcxGridDBTableView;
    cxgtvDDF_ECHANTORFAB_ID: TcxGridDBColumn;
    cxgtvDDF_ECHANTORFAB_NUM: TcxGridDBColumn;
    cxgtvDDF_ECHANTORFAB_ST: TcxGridDBColumn;
    cxgtvDDF_ECHANTORFAB_ST_DES: TcxGridDBColumn;
    cxgtvDDF_ECHANTORFAB_ST_COM: TcxGridDBColumn;
    cxgtvDDF_ECHANTORFAB_ST_COM_DES: TcxGridDBColumn;
    cxgtvDDF_ECHANTORFAB_DATE_SOUHAI_DATE: TcxGridDBColumn;
    cxgtvDDF_ECHANTORFAB_MAD_DATE: TcxGridDBColumn;
    cxgtvDDF_ECHANTORFAB_DATE_FAB_PREV: TcxGridDBColumn;
    cxgtvDDF_ECHANTORFAB_QTE_SOUHAI: TcxGridDBColumn;
    cxgtvDDF_ECHANTTIERS_ID: TcxGridDBColumn;
    cxgtvDDF_ECHANTTIERS_CODE: TcxGridDBColumn;
    cxgtvDDF_ECHANTTIERS_RS_L1: TcxGridDBColumn;
    cxgtvDDF_ECHANTPRCDT_ID: TcxGridDBColumn;
    cxgtvDDF_ECHANTPRCDT_DES: TcxGridDBColumn;
    cxgtvDDF_ECHANTMODEL_CODE: TcxGridDBColumn;
    cxgtvDDF_ECHANTMODEL_DES: TcxGridDBColumn;
    cxglDDF_ECHANT: TcxGridLevel;
    tbsCCBAT_TYPE0: TcxTabSheet;
    pnlDMBAT_TYPE0: TPanel;
    dxBarDockControl7: TdxBarDockControl;
    dxdgDMBAT_TYPE0: TcxGrid;
    cxgtvDMBAT_TYPE0: TcxGridDBTableView;
    cxgtvDMBAT_TYPE0CDCFO_ID: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0CDCFO_NUM: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0CDCFO_NUM_VERSI: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0CDCFO_ST: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0CDCFO_ST_DES: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0VSUPO_NUM: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0VSUPO_DES: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0VDECO_NUM: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0VDECO_DES: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0TIERS_CODE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0TIERS_RS_L1: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0DMBAT_ID: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0DMBAT_TYPE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0DMBAT_STATUT: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0DMBAT_STATUT_DES: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0DMBAT_PAP_DMD_DATE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0DMBAT_PAP_PC_REP_DATE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0DMBAT_PAP_PC_MAD_DATE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0DMBAT_PAP_REA_MAIL_DATE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0DMBAT_PAP_ENVOI_CLIENT_DATE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE0DMBAT_PAP_VALID_CLIENT_DATE: TcxGridDBColumn;
    cxglDMBAT_TYPE0: TcxGridLevel;
    tbsDMBAT_TYPE1: TcxTabSheet;
    pnlDMBAT_TYPE1: TPanel;
    dxBarDockControl8: TdxBarDockControl;
    dxdgDMBAT_TYPE1: TcxGrid;
    cxgtvDMBAT_TYPE1: TcxGridDBTableView;
    cxgtvDMBAT_TYPE1CDCFO_ID: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1CDCFO_NUM: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1CDCFO_NUM_VERSI: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1CDCFO_ST: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1CDCFO_ST_DES: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1VSUPO_NUM: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1VSUPO_DES: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1VDECO_NUM: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1VDECO_DES: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1TIERS_CODE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1TIERS_RS_L1: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1DMBAT_ID: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1DMBAT_TYPE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1DMBAT_STATUT: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1DMBAT_STATUT_DES: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1DMBAT_VER_DMD_DATE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1DMBAT_VER_PC_REP_DATE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1DMBAT_VER_PC_MAD_DATE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1DMBAT_VER_REA_MAIL_DATE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1DMBAT_VER_ENVOI_CLIENT_DATE: TcxGridDBColumn;
    cxgtvDMBAT_TYPE1DMBAT_VER_VALID_CLIENT_DATE: TcxGridDBColumn;
    cxglDMBAT_TYPE1: TcxGridLevel;
    tbsPOCDE_DECOR: TcxTabSheet;
    pnlPOCDE_DECOR: TPanel;
    dxBarDockControl9: TdxBarDockControl;
    dxdgPOCDE_DECOR: TcxGrid;
    cxgtvPOCDE_DECOR: TcxGridDBTableView;
    cxgtvPOCDE_DECORCOMMA_ID: TcxGridDBColumn;
    cxgtvPOCDE_DECORCOMMA_NUM: TcxGridDBColumn;
    cxgtvPOCDE_DECORCOMMA_VERSI: TcxGridDBColumn;
    cxgtvPOCDE_DECORPOCDE_REF: TcxGridDBColumn;
    cxgtvPOCDE_DECORCOMMA_ST: TcxGridDBColumn;
    cxgtvPOCDE_DECORCOMMA_ST_DES: TcxGridDBColumn;
    cxgtvPOCDE_DECORPOCDE_ID: TcxGridDBColumn;
    cxgtvPOCDE_DECORPOCDE_NUM: TcxGridDBColumn;
    cxgtvPOCDE_DECORPOCDE_TYP_POSTE: TcxGridDBColumn;
    cxgtvPOCDE_DECORPOCDE_SOLDE: TcxGridDBColumn;
    cxgtvPOCDE_DECORPOCDE_TYP_POSTE_DES: TcxGridDBColumn;
    cxgtvPOCDE_DECORTIERS_ID: TcxGridDBColumn;
    cxgtvPOCDE_DECORTIERS_CODE: TcxGridDBColumn;
    cxgtvPOCDE_DECORTIERS_RS_L1: TcxGridDBColumn;
    cxgtvPOCDE_DECORPRCDT_ID: TcxGridDBColumn;
    cxgtvPOCDE_DECORPRCDT_DES: TcxGridDBColumn;
    cxgtvPOCDE_DECORPRCDT_MODE_GES: TcxGridDBColumn;
    cxgtvPOCDE_DECORPRCDT_MODE_GES_DES: TcxGridDBColumn;
    cxgtvPOCDE_DECORADM_COLLA_TRIG: TcxGridDBColumn;
    cxgtvPOCDE_DECORCDM_COLLA_TRIG: TcxGridDBColumn;
    cxgtvPOCDE_DECORCOMMA_REF_CL: TcxGridDBColumn;
    cxgtvPOCDE_DECORORFAB_DATE: TcxGridDBColumn;
    cxglPOCDE_DECOR: TcxGridLevel;
    tbsOFFRE_ST_0: TcxTabSheet;
    pnlOFFRE_ST_0: TPanel;
    dxBarDockControl10: TdxBarDockControl;
    dxdgOFFRE_ST_0: TcxGrid;
    cxgtvOFFRE_ST_0: TcxGridDBTableView;
    cxgtvOFFRE_ST_0OFFRE_ID: TcxGridDBColumn;
    cxgtvOFFRE_ST_0OFFRE_TYP: TcxGridDBColumn;
    cxgtvOFFRE_ST_0OFFRE_NUM: TcxGridDBColumn;
    cxgtvOFFRE_ST_0OFFRE_VERSI: TcxGridDBColumn;
    cxgtvOFFRE_ST_0OFFRE_DER_VERSI: TcxGridDBColumn;
    cxgtvOFFRE_ST_0OFFRE_ST: TcxGridDBColumn;
    cxgtvOFFRE_ST_0OFFRE_TYPE_DES: TcxGridDBColumn;
    cxgtvOFFRE_ST_0OFFRE_ST_DES: TcxGridDBColumn;
    cxgtvOFFRE_ST_0OFFRE_DATE: TcxGridDBColumn;
    cxgtvOFFRE_ST_0EMET_COLLA_TRIG: TcxGridDBColumn;
    cxgtvOFFRE_ST_0OFFRE_DATE_REPON: TcxGridDBColumn;
    cxgtvOFFRE_ST_0OFFRE_DATE_VAL: TcxGridDBColumn;
    cxgtvOFFRE_ST_0OFFRE_REF_CLI: TcxGridDBColumn;
    cxgtvOFFRE_ST_0ADM_COLLA_ID: TcxGridDBColumn;
    cxgtvOFFRE_ST_0ADM_NOMPRENOM: TcxGridDBColumn;
    cxgtvOFFRE_ST_0CDM_COLLA_ID: TcxGridDBColumn;
    cxgtvOFFRE_ST_0CDM_NOMPRENOM: TcxGridDBColumn;
    cxgtvOFFRE_ST_0TIERS_ID: TcxGridDBColumn;
    cxgtvOFFRE_ST_0TIERS_CODE: TcxGridDBColumn;
    cxgtvOFFRE_ST_0TIERS_RS_L1: TcxGridDBColumn;
    cxgtvOFFRE_ST_0EMET_COLLA_ID: TcxGridDBColumn;
    cxgtvOFFRE_ST_0EMET_NOMPRENOM: TcxGridDBColumn;
    cxgtvOFFRE_ST_0MONTANT: TcxGridDBColumn;
    cxgtvOFFRE_ST_0DVISE_CODE: TcxGridDBColumn;
    cxgtvOFFRE_ST_0ADM_COLLA_TRIG: TcxGridDBColumn;
    cxgtvOFFRE_ST_0CDM_COLLA_TRIG: TcxGridDBColumn;
    cxgtvOFFRE_ST_0RZA_COLLA_TRIG: TcxGridDBColumn;
    cxglOFFRE_ST_0: TcxGridLevel;
    tbsOFFRE_A_RELANCER: TcxTabSheet;
    pnlOFFRE_A_RELANCER: TPanel;
    dxBarDockControl11: TdxBarDockControl;
    dxdgOFFRE_A_RELANCER: TcxGrid;
    cxgtvOFFRE_A_RELANCER: TcxGridDBTableView;
    cxgtvOFFRE_A_RELANCEROFFRE_ID: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_TYP: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_NUM: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_VERSI: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_DER_VERSI: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_ST: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_TYPE_DES: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_TYP_DES: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEREMET_COLLA_TRIG: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_ST_DES: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_DATE: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_DATE_VAL: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEREMET_COLLA_ID: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEREMET_NOMPRENOM: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_DATE_RELANCE: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERCOLLA_TRIG: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCEROFFRE_REF_CLI: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERADM_COLLA_ID: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERADM_NOMPRENOM: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERCDM_COLLA_ID: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERCDM_NOMPRENOM: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERTIERS_ID: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERTIERS_CODE: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERTIERS_RS_L1: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERMONTANT: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERDVISE_CODE: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERADM_COLLA_TRIG: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERCDM_COLLA_TRIG: TcxGridDBColumn;
    cxgtvOFFRE_A_RELANCERRZA_COLLA_TRIG: TcxGridDBColumn;
    cxglOFFRE_A_RELANCER: TcxGridLevel;
    tbsPCDAG_A_TRAITER: TcxTabSheet;
    pnlPCDAG_A_TRAITER: TPanel;
    dxBarDockControl12: TdxBarDockControl;
    dxdgPCDAG_A_TRAITER: TcxGrid;
    cxgtvPCDAG_A_TRAITER: TcxGridDBTableView;
    cxgtvPCDAG_A_TRAITERCDACG_ID: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERCDACG_NUM: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERCDACG_SEQ: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERCDACG_ST: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERPCDAG_ID: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERPCDAG_NUM: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERPCDAG_PRCDT_ID: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERPCDAG_QTE: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERPCDAG_TYP: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERPCDAG_FLG_LIV_DIRECT: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERTIERS_ID: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERTIERS_CODE: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERTIERS_RS_L1: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERPRCDT_ID: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERPRCDT_DES: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERPRCDT_MODE_GES: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERPRCDT_MODE_GES_DES: TcxGridDBColumn;
    cxgtvPCDAG_A_TRAITERPCDAG_DMAPR_ID: TcxGridDBColumn;
    cxglPCDAG_A_TRAITER: TcxGridLevel;
    tbsTARIF_ANOMALIE: TcxTabSheet;
    pnlTARIF_ANOMALIE: TPanel;
    dgTARIFGrid: TcxGrid;
    dgTARIF: TcxGridDBTableView;
    dgTARIF_TARIF_NUM_VER: TcxGridDBColumn;
    dgTARIF_TARIF_DES: TcxGridDBColumn;
    dgTARIF_TARIF_NUM: TcxGridDBColumn;
    dgTARIF_TARIF_ID: TcxGridDBColumn;
    dgTARIF_SOCIE_ID: TcxGridDBColumn;
    dgTARIF_OLD_PRCDT_ID: TcxGridDBColumn;
    dgTARIF_OLD_PRCDT_DES: TcxGridDBColumn;
    dgTARIF_NEW_PRCDT_ID: TcxGridDBColumn;
    dgTARIF_NEW_PRCDT_DES: TcxGridDBColumn;
    dgTARIF_PRCDT_ID: TcxGridDBColumn;
    dgTARIFLevel: TcxGridLevel;
    dxBarDockControl1: TdxBarDockControl;
    dxbrTARIF_ANOMALIE: TdxBar;
    btnVisTARIF_ANOMA: TdxBarButton;
    lblDirVen: TLabel;
    edtDirVen_TRIG: TEdit;
    edtDirVen_NOM_PRENOM: TEdit;
    btnDirVen: TBitBtn;
    edtDirVen_ID: TEdit;
    procedure FormKeyDown(Sender: TObject; var Key: Word; Shift: TShiftState);

    procedure btnQuitterClick(Sender: TObject);
    procedure btnRechercheClick(Sender: TObject);
    procedure dxtciCOMMAListeClick(Sender: TdxTileControlItem);
    procedure dxtciAVMADListeClick(Sender: TdxTileControlItem);
    procedure edtADM_COLLA_TRIGKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure btnADM_COLLAClick(Sender: TObject);
    procedure cxgtvPPECHProdRetardSelectionChanged
      (Sender: TcxCustomGridTableView);
    procedure cxgtvDDL_A_CREE_FADListeSelectionChanged
      (Sender: TcxCustomGridTableView);
    procedure btnVisPOCDE2Click(Sender: TObject);
    procedure cxgtvDDL_A_CREE_FADListeCellDblClick
      (Sender: TcxCustomGridTableView;
      ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton;
      AShift: TShiftState; var AHandled: Boolean);
    procedure cxgtvPPECHProdRetardCellDblClick(Sender: TcxCustomGridTableView;
      ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton;
      AShift: TShiftState; var AHandled: Boolean);
    procedure btnVisCOMMA3Click(Sender: TObject);
    procedure btnVisPOCDE3Click(Sender: TObject);
    procedure cxgtvPPECHASolderCellDblClick(Sender: TcxCustomGridTableView;
      ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton;
      AShift: TShiftState; var AHandled: Boolean);
    procedure cxgtvPPECHASolderSelectionChanged(Sender: TcxCustomGridTableView);
    procedure dxtciDEEXP_ST_2Click(Sender: TdxTileControlItem);
    procedure dxtciDEEXP_ST_0Click(Sender: TdxTileControlItem);

    procedure dxtciDDF_PARClick(Sender: TdxTileControlItem);
    procedure dxtciDDF_VNClick(Sender: TdxTileControlItem);
    procedure cxgtvPPECHAFaderCellDblClick(Sender: TcxCustomGridTableView;
      ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton;
      AShift: TShiftState; var AHandled: Boolean);
    procedure cxgtvPPECHAFaderSelectionChanged(Sender: TcxCustomGridTableView);
    procedure btnVisPOCDE5Click(Sender: TObject);
    procedure btnVisCOMMA5Click(Sender: TObject);
    procedure dxtciARBBESuiviClick(Sender: TdxTileControlItem);
    procedure edtCDM_COLLA_TRIGKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure btnCDM_COLLAClick(Sender: TObject);
    procedure edtRZA_COLLA_TRIGKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure btnRZA_COLLAClick(Sender: TObject);
    procedure cxgtvDDF_ECHANTCellDblClick(Sender: TcxCustomGridTableView;
      ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton;
      AShift: TShiftState; var AHandled: Boolean);
    procedure cxgtvDDF_ECHANTSelectionChanged(Sender: TcxCustomGridTableView);
    procedure btnVisDDF_ECHANT_DMFABClick(Sender: TObject);
    procedure cxgtvDMBAT_TYPE0CellDblClick(Sender: TcxCustomGridTableView;
      ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton;
      AShift: TShiftState; var AHandled: Boolean);
    procedure cxgtvDMBAT_TYPE0SelectionChanged(Sender: TcxCustomGridTableView);
    procedure btnVisCDCFO1Click(Sender: TObject);
    procedure btnVisDMBAT1Click(Sender: TObject);
    procedure cxgtvDMBAT_TYPE0FocusedItemChanged(Sender: TcxCustomGridTableView;
      APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
    procedure cxgtvDDF_ECHANTFocusedItemChanged(Sender: TcxCustomGridTableView;
      APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
    procedure cxgtvPPECHAFaderFocusedItemChanged(Sender: TcxCustomGridTableView;
      APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);

    procedure cxgtvPPECHASolderFocusedItemChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
    procedure cxgtvPPECHProdRetardFocusedItemChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
    procedure cxgtvDDL_A_CREE_FADListeFocusedItemChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
    procedure cxgtvDMBAT_TYPE0FocusedRecordChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedRecord, AFocusedRecord: TcxCustomGridRecord;
      ANewItemRecordFocusingChanged: Boolean);
    procedure cxgtvDDF_ECHANTFocusedRecordChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedRecord, AFocusedRecord: TcxCustomGridRecord;
      ANewItemRecordFocusingChanged: Boolean);
    procedure cxgtvPPECHAFaderFocusedRecordChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedRecord, AFocusedRecord: TcxCustomGridRecord;
      ANewItemRecordFocusingChanged: Boolean);

    procedure cxgtvPPECHASolderFocusedRecordChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedRecord, AFocusedRecord: TcxCustomGridRecord;
      ANewItemRecordFocusingChanged: Boolean);
    procedure cxgtvPPECHProdRetardFocusedRecordChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedRecord, AFocusedRecord: TcxCustomGridRecord;
      ANewItemRecordFocusingChanged: Boolean);
    procedure cxgtvDDL_A_CREE_FADListeFocusedRecordChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedRecord, AFocusedRecord: TcxCustomGridRecord;
      ANewItemRecordFocusingChanged: Boolean);
    procedure cxgtvDMBAT_TYPE1FocusedItemChanged(Sender: TcxCustomGridTableView;
      APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
    procedure cxgtvDMBAT_TYPE1FocusedRecordChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedRecord, AFocusedRecord: TcxCustomGridRecord;
      ANewItemRecordFocusingChanged: Boolean);
    procedure cxgtvDMBAT_TYPE1SelectionChanged(Sender: TcxCustomGridTableView);
    procedure btnVisDMBAT2Click(Sender: TObject);
    procedure btnVisCDCFO2Click(Sender: TObject);
    procedure dxtciFACTU_ST0Click(Sender: TdxTileControlItem);
    procedure cxgtvPOCDE_DECORCellDblClick(Sender: TcxCustomGridTableView;
      ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton;
      AShift: TShiftState; var AHandled: Boolean);
    procedure cxgtvPOCDE_DECORFocusedItemChanged(Sender: TcxCustomGridTableView;
      APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
    procedure cxgtvPOCDE_DECORFocusedRecordChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedRecord, AFocusedRecord: TcxCustomGridRecord;
      ANewItemRecordFocusingChanged: Boolean);
    procedure cxgtvPOCDE_DECORSelectionChanged(Sender: TcxCustomGridTableView);
    procedure btnVisCOMMA6Click(Sender: TObject);
    procedure btnVisPOCDE6Click(Sender: TObject);
    procedure dxtciDMDAPListeClick(Sender: TdxTileControlItem);
    procedure cxgtvDMBAT_TYPE1CellDblClick(Sender: TcxCustomGridTableView;
      ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton;
      AShift: TShiftState; var AHandled: Boolean);
    procedure cxgtvOFFRE_ST_0CellDblClick(Sender: TcxCustomGridTableView;
      ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton;
      AShift: TShiftState; var AHandled: Boolean);
    procedure cxgtvOFFRE_ST_0FocusedItemChanged(Sender: TcxCustomGridTableView;
      APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
    procedure cxgtvOFFRE_ST_0FocusedRecordChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedRecord, AFocusedRecord: TcxCustomGridRecord;
      ANewItemRecordFocusingChanged: Boolean);
    procedure cxgtvOFFRE_ST_0SelectionChanged(Sender: TcxCustomGridTableView);
    procedure cxgtvOFFRE_A_RELANCERCellDblClick(Sender: TcxCustomGridTableView;
      ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton;
      AShift: TShiftState; var AHandled: Boolean);
    procedure cxgtvOFFRE_A_RELANCERFocusedItemChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
    procedure cxgtvOFFRE_A_RELANCERFocusedRecordChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedRecord, AFocusedRecord: TcxCustomGridRecord;
      ANewItemRecordFocusingChanged: Boolean);
    procedure cxgtvOFFRE_A_RELANCERSelectionChanged
      (Sender: TcxCustomGridTableView);
    procedure btnVisOFFRE_A_RELANCERClick(Sender: TObject);
    procedure btnVisOFFRE_ST_0Click(Sender: TObject);
    procedure cxgtvPCDAG_A_TRAITERCellDblClick(Sender: TcxCustomGridTableView;
      ACellViewInfo: TcxGridTableDataCellViewInfo; AButton: TMouseButton;
      AShift: TShiftState; var AHandled: Boolean);
    procedure cxgtvPCDAG_A_TRAITERFocusedItemChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
    procedure cxgtvPCDAG_A_TRAITERFocusedRecordChanged
      (Sender: TcxCustomGridTableView;
      APrevFocusedRecord, AFocusedRecord: TcxCustomGridRecord;
      ANewItemRecordFocusingChanged: Boolean);
    procedure cxgtvPCDAG_A_TRAITERSelectionChanged
      (Sender: TcxCustomGridTableView);
    procedure btnVisCDACGClick(Sender: TObject);
    procedure btnVisPCDAGClick(Sender: TObject);
    procedure dxtciDMDAPAuListeClick(Sender: TdxTileControlItem);
    procedure dxtciARBBEDemandeClick(Sender: TdxTileControlItem);
    procedure dxtciDEEXP_ANOMAClick(Sender: TdxTileControlItem);
    procedure dxtciFACTU_AVOIRClick(Sender: TdxTileControlItem);
    procedure cxgtvPPECHProdRetardORFAB_DATE_FAB_PREVStylesGetContentStyle
      (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
    procedure dxtciPPECHExpedEnREtardClick(Sender: TdxTileControlItem);
    procedure btnRZC_COLLAClick(Sender: TObject);
    procedure edtRZC_COLLA_TRIGKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure cxgtvDMBAT_TYPE0DMBAT_PAP_PC_MAD_DATEStylesGetContentStyle
      (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
    procedure cxgtvDMBAT_TYPE1DMBAT_VER_PC_MAD_DATEStylesGetContentStyle
      (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
    procedure cxgtvDMBAT_TYPE1DMBAT_VER_REA_MAIL_DATEStylesGetContentStyle
      (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
    procedure cxgtvDMBAT_TYPE0DMBAT_PAP_REA_MAIL_DATEStylesGetContentStyle
      (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
    procedure btnVisPPECH2Click(Sender: TObject);
    procedure btnVisPPECH3Click(Sender: TObject);
    procedure btnVisPPECH5Click(Sender: TObject);
    procedure btnVisPPECH6Click(Sender: TObject);
    procedure edtTIERS_RS_L1KeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure edtTIERS_CODEKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure btnTIERSClick(Sender: TObject);
    procedure btnZOCOMClick(Sender: TObject);
    procedure edtZOCOM_DESKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure dxtciTARIF_ST0Click(Sender: TdxTileControlItem);
    procedure dxtciTARIF_ST1Click(Sender: TdxTileControlItem);
    procedure dxtciFACTU_IMPREClick(Sender: TdxTileControlItem);
    procedure dxtciPOCDE_BLKClick(Sender: TdxTileControlItem);
    procedure cxgtvPOCDE_DECORORFAB_DATEStylesGetContentStyle
      (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
    procedure cxgtvPPECHAFaderPPECH_DATE_FADStylesGetContentStyle
      (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
    procedure dxtciFCMNT_A_FACTClick(Sender: TdxTileControlItem);
    procedure dxtciESN1A_ST0Click(Sender: TdxTileControlItem);
    procedure dxtciESN1A_ST1Click(Sender: TdxTileControlItem);
    procedure dxtciNFSTK_ST0Click(Sender: TdxTileControlItem);

    procedure cxgtvDDF_ECHANTORFAB_MAD_DATEStylesGetContentStyle
      (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
    procedure cxgtvOFFRE_A_RELANCEROFFRE_DATE_RELANCEStylesGetContentStyle
      (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);

    procedure dxtciSTOCKS_2ANSClick(Sender: TdxTileControlItem);
    procedure cxgtvPPECH_SOLDE_RESVStylesGetContentStyle
      (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
    procedure dxtcAVOIRS_A_VALIDERClick(Sender: TdxTileControlItem);
    procedure dxtcTilesKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure dxtcTilesKeyUp(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure dxtciOFFRE_ST_0Click(Sender: TdxTileControlItem);
    procedure dxtciOFFRE_A_RELANCERClick(Sender: TdxTileControlItem);
    procedure dxtciPPECHProdRetardClick(Sender: TdxTileControlItem);
    procedure dxtciPPECHASolderListeClick(Sender: TdxTileControlItem);
    procedure dxtciPOCDE_DECORClick(Sender: TdxTileControlItem);
    procedure dxtciDDL_A_CREERClick(Sender: TdxTileControlItem);
    procedure dxtciPPECHAFaderListeClick(Sender: TdxTileControlItem);
    procedure dxtciDDF_ECHANTClick(Sender: TdxTileControlItem);
    procedure dxtciDMBAT_TYPE0Click(Sender: TdxTileControlItem);
    procedure dxtciDMBAT_TYPE1Click(Sender: TdxTileControlItem);
    procedure btnExportExcelClick(Sender: TObject);
    procedure dxtciPCDAG_A_TRAITERClick(Sender: TdxTileControlItem);
    procedure dxtcTilesItemDeactivateDetail(Sender: TdxCustomTileControl;
      AItem: TdxTileControlItem);
    procedure dxtcTilesMouseMove(Sender: TObject; Shift: TShiftState;
      X, Y: Integer);
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure tmRechercheTimer(Sender: TObject);
    procedure cxgtvPPECHASolderSOLDE_A_COUVRIRCustomDrawCell
      (Sender: TcxCustomGridTableView; ACanvas: TcxCanvas;
      AViewInfo: TcxGridTableDataCellViewInfo; var ADone: Boolean);
    procedure cxgtvPPECHASolderDENIER_BOLIVCustomDrawCell
      (Sender: TcxCustomGridTableView; ACanvas: TcxCanvas;
      AViewInfo: TcxGridTableDataCellViewInfo; var ADone: Boolean);
    procedure cxgtvPPECHASolderCustomDrawCell(Sender: TcxCustomGridTableView;
      ACanvas: TcxCanvas; AViewInfo: TcxGridTableDataCellViewInfo;
      var ADone: Boolean);
    procedure dxtciBOLIV_A_FACTClick(Sender: TdxTileControlItem);
    procedure dxtciTARIF_ANOMALIEClick(Sender: TdxTileControlItem);
    procedure cxgtvPPECHAFaderLIVRAISONS_PLANIFIEESStylesGetContentStyle
      (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
    procedure btnPPECHProdRetard_RECClick(Sender: TObject);
    procedure btnPPECHASolder_RECClick(Sender: TObject);
    procedure btnPPECHAFaderClick(Sender: TObject);
    procedure btnDDF_Echant_RECClick(Sender: TObject);
    procedure btnDMBAType0Click(Sender: TObject);
    procedure btnDMBATType1Click(Sender: TObject);
    procedure btnPOCDEDecor_RECClick(Sender: TObject);
    procedure btnOffreSt0_RECClick(Sender: TObject);
    procedure btnOffreARelancer_RECClick(Sender: TObject);
    procedure btnPCDAGATraiter_RECClick(Sender: TObject);
    procedure dxtciDAMCCClick(Sender: TdxTileControlItem);
    procedure cxgtvOFFRE_A_RELANCERCOLLA_TRIGStylesGetContentStyle(
      Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
      AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
    procedure dxtciARC_DiscussionClick(Sender: TdxTileControlItem);
    procedure btnTarif_Anomalie_RECClick(Sender: TObject);
    procedure dxtciECH_EN_COURSClick(Sender: TdxTileControlItem);
    procedure dxtciCADEN_PPECHClick(Sender: TdxTileControlItem);
    procedure btnVisTARIF_ANOMAClick(Sender: TObject);
    procedure FormCloseQuery(Sender: TObject; var CanClose: Boolean);
    procedure btnVisCOMMA2Click(Sender: TObject);
    procedure btnDirVenClick(Sender: TObject);
    procedure edtDirVen_TRIGKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure edtDirVen_NOM_PRENOMKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure dxtciFACTU_AVOIR_CF_PAClick(Sender: TdxTileControlItem);
    procedure dxtcFACTU_ACOMPTEClick(Sender: TdxTileControlItem);
  private
    FThreadPool: TSThreadPool;
    dDateNow: TDateTime;
    sMsgProdRetardMTS, sMsgProdRetardMTO: string;
    sMsgDMDAPAuVN, sMsgDMDAPAuDecor: string;
    sMsgCNT_COMMA_ST_1: string;
    sMsgCOMMA_CNT_ROUGE, sMsgCOMMA_CNT_BLANC: string;
    sMsgTARIF_CNT_ROUGE, sMsgTARIF_CNT_BLANC: string;
    sMsgPOCDE_BLK_ROUGE, sMsgPOCDE_BLK_JAUNE, sMsgPOCDE_BLK_BLANC: string;
    sMsgDAMCC_ROUGE, sMsgDAMCC_JAUNE, sMsgDAMCC_BLANC: string;
    sMsgActADM, sMsgEn_discu, sMsgSTOCK_M22, sMsgSTOCK_R1_R2_R3,
      sMsgSTOCK_FIN: string;
    iTMP_ID: Integer;
    iNbM22Rouge, inROUGE_FINALISATION_EC: Integer;

    bInRecherche: Boolean;
    sMsgOFFRE_A_RELANCER_ADM, sMsgOFFRE_A_RELANCER_CDM: string;
    procedure PPECHProdRetardManageButtonsState;
    procedure PPECHASolderManageButtonsState;
    procedure PPECHAFaderManageButtonsState;
    procedure POCDE_DECORManageButtonsState;
    procedure DDF_ECHANTManagerButtonsState;
    procedure DMBAT_TYPE0ManagerButtonsState;
    procedure DMBAT_TYPE1ManagerButtonsState;
    procedure OFFRE_A_RELANCERManagerButtonsState;
    procedure OFFRE_ST_0ManagerButtonsState;
    procedure PCDAG_A_TRAITERManagerButtonsState;
    procedure Tarif_AnomalieManagerButtonsState;
    procedure pVisPOCDE(const iPOCDE_ID: string);
    procedure pVisPPECH(const iPOCDE_ID: string);
    // STK01399 FPE 04/02/2022
    procedure CompteursSTOCKS_2ANS;
    // FIN STK01399 FPE 04/02/2022

  protected
    procedure fEvent(ptEvent: TEvenementL); override;
    procedure fGestionEtats; override;
    procedure fRecherche; override;
    procedure fAjoutFiltre(var pADOQry: TUniQuery); override;
    procedure fAjoutFiltreRelance(var pADOQry: TUniQuery);
    procedure fGetData(Sender: TObject); override;
    procedure setTileValue(item: TdxTileControlItem; a: Integer); overload;
    procedure setTileValue(item: TdxTileControlItem; const a: string); overload;

  public
    bCTRL_ENFONCE: Boolean; // CDE02589
    bExport_Excel: Boolean; // CDE02589
    bADMIN_EXPORT_TUILES: Boolean; // CDE02589
    sExport_XL_FILENAME: string; // CDE02589
    sExport_XL_FILENAME_BIS: string; // CDE02589
    bDeactive_detail: Boolean; // CDE02589
    sTEMP_TUILES_CHECK: string; // CDE02589
    frmCADENPopUp: TfrmCADENPopUp;
    // procedure CalcDDL_A_CREER;
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;

    procedure fOuverture(ptEtat: TEtat); override;
    function fGET_ADMIN_EXPORT_TUILES(sCOLLA_TRIG: string): Boolean; // CDE02589
    procedure pSauv_Tuiles_Export(sTUILE: TdxTileControlItem); // CDE02589
    procedure pCheck_Tuiles_Export; // CDE02589
    procedure pConcat_Excel_files(sFichier_1: string; sFichier_2: string;
      sNom_tuile_First: string; sNom_tuile: string); // CDE02589
    procedure pExport_Tuile(sTUILE: TdxTileControlItem); // CDE02589
    procedure pCheck_Tuiles_Export_Fast;
  end;

const
  //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
  iRQSQL_DMECHENCOURS  = 46813;  //rq = 46813 et OLD = 46762
  iRQSQL_DMECHENCOURS2 = 46812;  //rq = 46812 et OLD = 46812

var
  frmTDB_ADMListe: TfrmTDB_ADMListe;

implementation

uses
  Main_frm,
  TrvVolant_frm,
  Connexion_dmd,
  FonctionsGen_Unit,
  FonctionsGenAff_Unit,
  FonctionsSup_Unit,
  System.Variants,
  System.StrUtils,
  Commande_Unit,
  dmdSGL_DevExpress_Unit,
  System.DateUtils,
  PPCDE_PAR_Fiche_frm,
  PPCDE_VN_Fiche_frm,
  STKRL_Fiche_frm,
  POReport_Unit,
  Produit_Unit,
  FACTU_Liste_frm,
  DEEXP_Liste_frm,
  Colla_Unit,
  Requete_unit,
  System.Types,
  Winapi.ShellAPI;

{$IFNDEF __ORA__}

const
  N_A = 'N/A';
{$ENDIF}

type
  THackfrmPPCDE_PARACHFiche = class(TfrmPPCDE_PARACHFiche);
  THackfrmPPCDE_VNFiche = class(TfrmPPCDE_VNFiche);

{$R *.DFM}

constructor TfrmTDB_ADMListe.Create(AOwner: TComponent);
begin
  inherited;

  MessageContext.Module := 'X';
  MessageContext.Context := 'TDB_ADM';
  MessageContext.Transaction := 'Liste';

  pGetMessages(MessageContext);

  dDateNow := fSysDate;
  FThreadPool := TSThreadPool.Create(Self);
  // Pour respecter le fuseau horaire de la bdd, et eviter d'utiliser System.Now

  // fQueryInit(qryInboundsListe);



  SetLength(Filtres, 1);

  fDebranchementAutoListe(lblADM_COLLA, edtADM_COLLA_TRIG, btnADM_COLLA,
    [edtADM_COLLA_ID, edtADM_COLLA_NOM, edtADM_COLLA_PRENOM], False);
  fDebranchementAutoListe(lblCDM_COLLA, edtCDM_COLLA_TRIG, btnCDM_COLLA,
    [edtCDM_COLLA_ID, edtCDM_COLLA_NOM, edtCDM_COLLA_PRENOM], False);
  fDebranchementAutoListe(lblRZA_COLLA, edtRZA_COLLA_TRIG, btnRZA_COLLA,
    [edtRZA_COLLA_ID, edtRZA_COLLA_NOM, edtRZA_COLLA_PRENOM], False);
  fDebranchementAutoListe(lblRZC_COLLA, edtRZC_COLLA_TRIG, btnRZC_COLLA,
    [edtRZC_COLLA_ID, edtRZC_COLLA_NOM, edtRZC_COLLA_PRENOM], False);

  fDebranchementAutoListe(lblTIERS, edtTIERS_CODE, btnTIERS,
    [edtTIERS_ID, edtTIERS_RS_L1]);
  fDebranchementAutoListe(lblZOCOM, edtZOCOM_DES, btnZOCOM, [edtZOCOM_ID]);
  //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
  fDebranchementAutoListe(lblDirVen, edtDirVen_TRIG, btnDirVen,
    [edtDirVen_ID, edtDirVen_NOM_PRENOM], False);

  dxtciARBBESuivi.Text1.Value := fGetMessage(MessageContext,
    'Arbitrageatraiter');
  dxtciDMDAPListe.Text1.Value := fGetMessage(MessageContext,
    'demandesdapprotraiter');
  sMsgDMDAPAuVN := fGetMessage(MessageContext, 'DMDAPAuVN');
  sMsgDMDAPAuDecor := fGetMessage(MessageContext, 'DMDAPAuDecor');

  dxtciDMDAPListe.Text3.Value := Format(sMsgDMDAPAuVN, [0]);
  dxtciDMDAPListe.Text4.Value := Format(sMsgDMDAPAuDecor, [0]);

  dxtciPCDAG_A_TRAITER.Text1.Value := fGetMessage(MessageContext,
    'commandesdachattraiter');
  dxtciPCDAG_A_TRAITER.DetailOptions.Caption :=
    fGetMessage(MessageContext, 'commandesdachattraitertab');

  dxtcgOFFRES_TARIFS.Caption.Text := fGetMessage(MessageContext,
    'OffresTarifs');
  dxtciOFFRE_ST_0.Text1.Value := fGetMessage(MessageContext, 'offresmettre');
  dxtciOFFRE_ST_0.DetailOptions.Caption := fGetMessage(MessageContext,
    'offresmettre_tab');

  dxtciOFFRE_A_RELANCER.Text1.Value := fGetMessage(MessageContext,
    'offresrelancer');
  sMsgOFFRE_A_RELANCER_ADM := fGetMessage(MessageContext, 'offresrelancer_ADM');
  dxtciOFFRE_A_RELANCER.Text3.Value := Format(sMsgOFFRE_A_RELANCER_ADM, ['0']);
  sMsgOFFRE_A_RELANCER_CDM := fGetMessage(MessageContext, 'offresrelancer_CDM');
  dxtciOFFRE_A_RELANCER.Text4.Value := Format(sMsgOFFRE_A_RELANCER_CDM, ['0']);
  dxtciOFFRE_A_RELANCER.DetailOptions.Caption :=
    fGetMessage(MessageContext, 'offresrelancer_tab');

  dxtciTARIF_ST0.Text1.Value := fGetMessage(MessageContext, 'Tarifs_ST0');
  sMsgTARIF_CNT_ROUGE := fGetMessage(MessageContext, 'TARIF_CNT_ROUGE');
  dxtciTARIF_ST0.Text3.Value := Format(sMsgTARIF_CNT_ROUGE, [0]);
  sMsgTARIF_CNT_BLANC := fGetMessage(MessageContext, 'TARIF_CNT_BLANC');
  dxtciTARIF_ST0.Text4.Value := Format(sMsgTARIF_CNT_BLANC, [0]);
  dxtciTARIF_ST1.Text1.Value := fGetMessage(MessageContext, 'Tarifs_ST1');
  dxtciTARIF_ANOMALIE.Text1.Value := fGetMessage(MessageContext,
    'TARIF_ANOMALIE1');
  dxtcgCommandes.Caption.Text := fGetMessage(MessageContext, 'Commandes');
  sMsgCNT_COMMA_ST_1 := fGetMessage(MessageContext, 'CNT_COMMA_ST_1');
  dxtciCOMMAListe.Text2.Value := Format(sMsgCNT_COMMA_ST_1, [0]);

  dxtciCOMMAListe.Text1.Value := fGetMessage(MessageContext, 'ARCaemettre');
  sMsgCOMMA_CNT_ROUGE := fGetMessage(MessageContext, 'COMMA_CNT_ROUGE');
  dxtciCOMMAListe.Text4.Value := Format(sMsgCOMMA_CNT_ROUGE, [0]);
  sMsgCOMMA_CNT_BLANC := fGetMessage(MessageContext, 'COMMA_CNT_BLANC1');
  dxtciCOMMAListe.Text3.Value := Format(sMsgCOMMA_CNT_BLANC, [0]);
  dxtciAVMADListe.Text1.Value := fGetMessage(MessageContext, 'AVMADaenvoyer');
  sMsgProdRetardMTO := fGetMessage(MessageContext, 'PPECHProdRetardMTO');
  dxtciPPECHProdRetard.Text3.Value := Format(sMsgProdRetardMTO, [0]);
  sMsgProdRetardMTS := fGetMessage(MessageContext, 'PPECHProdRetardMTS');
  dxtciPPECHProdRetard.Text4.Value := Format(sMsgProdRetardMTS, [0]);
  dxtciPPECHProdRetard.Text1.Value := fGetMessage(MessageContext,
    'PPECHNonCouvertesADate');
  dxtciPPECHProdRetard.DetailOptions.Caption :=
    fGetMessage(MessageContext, 'PPECHNonCouvertesADate_tab');
  dxtciPPECHASolderListe.Text1.Value := fGetMessage(MessageContext,
    'PPECHasolder');
  dxtciPPECHASolderListe.DetailOptions.Caption :=
    fGetMessage(MessageContext, 'PPECHasolder_tab');

  sMsgActADM := fGetMessage(MessageContext, 'ARC_TraiterADM');
  sMsgEn_discu := fGetMessage(MessageContext, 'En_discussion');
  dxtciARC_Discussion.Text3.Value := Format(sMsgEn_discu, [0]);
  dxtciARC_Discussion.Text4.Value := Format(sMsgActADM, [0]);
  dxtciARC_Discussion.Text1.Value := fGetMessage(MessageContext, 'ARC_Traiter');

  dxtciPOCDE_DECOR.Text1.Value := fGetMessage(MessageContext, 'POCDE_DECOR');
  dxtciPOCDE_DECOR.DetailOptions.Caption := fGetMessage(MessageContext,
    'POCDE_DECOR_TAB');
  // dxtciPPECHExpedEnREtard.Text1.VAlue          := fGetMessage(MessageContext,'PPECHExpedEnRetard');
  dxtciPOCDE_BLK.Text1.Value := fGetMessage(MessageContext,
    'postescommandesbloqus');
  sMsgPOCDE_BLK_ROUGE := fGetMessage(MessageContext,
    'postescommandesbloqus_ddld');
  dxtciPOCDE_BLK.Text2.Value := Format(sMsgPOCDE_BLK_ROUGE, [0]);
  sMsgPOCDE_BLK_JAUNE := fGetMessage(MessageContext,
    'postescommandesbloqus_ddfmtod');
  dxtciPOCDE_BLK.Text3.Value := Format(sMsgPOCDE_BLK_JAUNE, [0]);
  sMsgPOCDE_BLK_BLANC := fGetMessage(MessageContext,
    'postescommandesbloqus_autresd');
  dxtciPOCDE_BLK.Text4.Value := Format(sMsgPOCDE_BLK_BLANC, [0]);
    //feature/CDE02728 FPE 28/04/2025 Compteurs Nb d'annulation de commandes (en-cours/accept�e/refus�e)
  dxtciDAMCC.Text1.Value                       := fGetMessage(MessageContext,'NbAnnulationsDeCommandes');
  sMsgDAMCC_ROUGE                              := fGetMessage(MessageContext,'NbAnnulationsDeCommandesEcEmis');
  dxtciDAMCC.Text2.Value                       := Format(sMsgDAMCC_ROUGE, [0]);
  sMsgDAMCC_JAUNE                              := fGetMessage(MessageContext,'NbAnnulationsDeCommandesACCEPTEE');
  dxtciDAMCC.Text3.Value                       := Format(sMsgDAMCC_JAUNE, [0]);
  sMsgDAMCC_BLANC                              := fGetMessage(MessageContext,'NbAnnulationsDeCommandesREFUSEE');
  dxtciDAMCC.Text4.Value                       := Format(sMsgDAMCC_BLANC, [0]);
  //Fin feature/CDE02728 FPE 28/04/2025 Compteurs Nb d'annulation de commandes (en-cours/accept�e/refus�e)
  //feature/CDE02829 FPE 03/09/2025 Compteurs Nb d'annomalies postes de cdm SGI



  dxtcgExpeditions.Caption.Text := fGetMessage(MessageContext, 'Expeditions');
  dxtciDDL_A_CREER.Text1.Value := fGetMessage(MessageContext, 'DDLacreer');
  dxtciDDL_A_CREER.DetailOptions.Caption := dxtciDDL_A_CREER.Text1.Value;
  // dxtciDDL_A_CREER_FAD.Text1.Value           := fGetMessage(MessageContext, 'DDLacreerFAD');
  // dxtciDDL_A_CREER_FAD.DetailOptions.Caption := fGetMessage(MessageContext, 'DDLacreerFAD_tab');
  dxtciDEEXP_ST_0.Text1.Value := fGetMessage(MessageContext, 'DDLEncours');
  dxtciDEEXP_ST_2.Text1.Value := fGetMessage(MessageContext, 'DDLNonChargees');
  dxtciDEEXP_ANOMA.Text1.Value := fGetMessage(MessageContext,
    'DDLAnomaliesADM2');
  dxtciDEEXP_ANOMA.Text2.Value := fGetMessage(MessageContext,
    'DDLAnomaliesADM3');
  dxtciCADEN_PPECH.Text1.Value := fGetMessage(MessageContext, 'DDLCadenPPECH');
  dxtciCADEN_PPECH.Text2.Value := fGetMessage(MessageContext, 'DDLCadenPPECH2');

  dxtcgFactures.Caption.Text := fGetMessage(MessageContext, 'FacturesStocks');
  // FAC01211 FPE 23/04/2024 Tuile BL � facturer
  dxtciBOLIV_A_FACT.Text1.Value := fGetMessage(MessageContext, 'blafacturer');

  dxtciFACTU_AVOIR.Text1.Value := fGetMessage(MessageContext,
    'factureAvoirEmettre');
  dxtcAVOIRS_A_VALIDER.Text1.Value := fGetMessage(MessageContext,
    'AvoirAValider');
  dxtciPPECHAFaderListe.Text1.Value := fGetMessage(MessageContext,
    'PPECHafadercemois');
  dxtciPPECHAFaderListe.DetailOptions.Caption :=
    fGetMessage(MessageContext, 'PPECHafadercemois_tab');
  dxtciFCMNT_A_FACT.Text1.Value := fGetMessage(MessageContext,
    'facturesfinancement');
  dxtciNFSTK_ST0.Text1.Value := fGetMessage(MessageContext,
    'notiffraisdestockageenvoyer');
  dxtciESN1A_ST0.Text1.Value := fGetMessage(MessageContext,
    'tatsdestocksenvoyer');
  dxtciESN1A_ST1.Text1.Value := fGetMessage(MessageContext,
    'tatsdestocksfacturer');
  // STK01399 FPE 04/02/2022
  dxtciSTOCKS_2ANS.Text1.Value := fGetMessage(MessageContext,
    'RelanceStockDormant');
  dxtciSTOCKS_2ANS.DetailOptions.Caption := dxtciSTOCKS_2ANS.Text1.Value;

  dxtciECH_EN_COURS.Text1.Value := fGetMessage(MessageContext, 'pdeechencours');
  dxtciECH_EN_COURS.DetailOptions.Caption := dxtciECH_EN_COURS.Text1.Value;

  sMsgSTOCK_M22 := fGetMessage(MessageContext, 'STOCK_M22');
  dxtciSTOCKS_2ANS.Text2.Value := Format(sMsgSTOCK_M22, [0]) + CRLF + 'N/A';

  sMsgSTOCK_R1_R2_R3 := fGetMessage(MessageContext, 'STOCK_R1_R2_R3');
  dxtciSTOCKS_2ANS.Text3.Value := Format(sMsgSTOCK_R1_R2_R3, [0]) +
    CRLF + 'N/A';
  sMsgSTOCK_FIN := fGetMessage(MessageContext, 'STOCK_FIN');
  dxtciSTOCKS_2ANS.Text4.Value := Format(sMsgSTOCK_FIN, [0]) + CRLF + 'N/A';
  // FIN STK01399 FPE 04/02/2022
  dxtcgProjets.Caption.Text := fGetMessage(MessageContext, 'Projets');
  dxtciDDF_ECHANT.Text1.Value := fGetMessage(MessageContext,
    'ORFABEchantverrieravenir');
  dxtciDDF_ECHANT.DetailOptions.Caption := dxtciDDF_ECHANT.Text1.Value;
  dxtciDMBAT_TYPE1.Text1.Value := fGetMessage(MessageContext, 'CCBATTYPE1');
  dxtciDMBAT_TYPE1.DetailOptions.Caption := dxtciDMBAT_TYPE1.Text1.Value;
  dxtciDMBAT_TYPE0.Text1.Value := fGetMessage(MessageContext, 'CCBATTYPE0');
  dxtciDMBAT_TYPE0.DetailOptions.Caption := dxtciDMBAT_TYPE0.Text1.Value;

  btnVisCOMMA1.Caption := fGetMessage(MessageContext, 'BtnCommande');
  btnVisCOMMA2.Caption := btnVisCOMMA1.Caption;
  btnVisCOMMA3.Caption := btnVisCOMMA1.Caption;
  btnVisCOMMA4.Caption := btnVisCOMMA1.Caption;
  btnVisCOMMA5.Caption := btnVisCOMMA1.Caption;
  btnVisCOMMA6.Caption := btnVisCOMMA1.Caption;

  btnVisPOCDE1.Caption := fGetMessage(MessageContext, 'BtnPosteCommande');
  btnVisPOCDE2.Caption := btnVisPOCDE1.Caption;
  btnVisPOCDE3.Caption := btnVisPOCDE1.Caption;
  btnVisPOCDE4.Caption := btnVisPOCDE1.Caption;
  btnVisPOCDE5.Caption := btnVisPOCDE1.Caption;
  btnVisPOCDE6.Caption := btnVisPOCDE1.Caption;

  btnVisPPECH1.Caption := fGetMessage(MessageContext, 'BtnEchancier');
  btnVisPPECH2.Caption := btnVisPPECH1.Caption;
  btnVisPPECH3.Caption := btnVisPPECH1.Caption;
  btnVisPPECH4.Caption := btnVisPPECH1.Caption;
  btnVisPPECH5.Caption := btnVisPPECH1.Caption;
  btnVisPPECH6.Caption := btnVisPPECH1.Caption;

  btnVisDDF_ECHANT_DMFAB.Caption := fGetMessage(MessageContext,
    'demandedefabrication');

  btnVisCDCFO1.Caption := fGetMessage(MessageContext, 'cahierdescharges');
  btnVisDMBAT1.Caption := fGetMessage(MessageContext, 'demandedebat');

  dxbsLimiteTrait.Caption := fGetMessage(MessageContext,
    'datelimitedetraitementdatedujour');
  dxbsDATEMAD1.Caption := fGetMessage(MessageContext, 'datemaddatedujour');
  dxbsDATEMAD2.Caption := fGetMessage(MessageContext, 'datemaddanslesjours');
  dxbsDATEMAD3.Caption := fGetMessage(MessageContext, 'datemadjours');

  btnVisOFFRE_ST_0.Caption := fGetMessage(MessageContext, 'offredeprix');
  btnVisOFFRE_A_RELANCER.Caption := fGetMessage(MessageContext, 'offredeprix');

  btnVisCDACG.Caption := fGetMessage(MessageContext, 'commandedachat');
  btnVisPCDAG.Caption := fGetMessage(MessageContext, 'postedecommandedachat');

  dxtciAVMADListe.Visible := TSocietes(_UserHH.Soc_ID) <>
    TSocietes.Soc_SaverglassAustralia;
  if TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassAustralia then
    dxtciPPECHASolderListe.IndexInGroup := dxtciAVMADListe.IndexInGroup;

  dxtcAVOIRS_A_VALIDER.Visible :=
    fTransDroit(fTransId('TfrmVALAVListe'), etFVisu);

  // dxtciPPECHExpedEnREtard.Visible := (TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassAustralia) or  (TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassMexico);
  dxtciDMDAPListe.enabled :=
    (TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassAustralia) or
    (TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassMexico);
  // dxtciPCDAG_A_TRAITER.enabled := (TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassAustralia) or  (TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassMexico);

  dxtciDMDAPListe.Visible :=
    (TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassAustralia) or
    (TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassMexico);
  // dxtciPCDAG_A_TRAITER.Visible := (TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassAustralia) or  (TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassMexico);

  // dxtciCOMMAListe.IndexInGroup:=0;
  // dxtciARBBESuivi.IndexInGroup:=1;
  // dxtciARC_Discussion.IndexInGroup:=2;
  // dxtciPPECHASolderListe.IndexInGroup:=3;
  // dxtciPCDAG_A_TRAITER.IndexInGroup:=4;
  // dxtciPPECHExpedEnREtard.IndexInGroup:=5;
  // dxtciDMDAPListe.IndexInGroup:=6;

  bInRecherche := False;
  bCTRL_ENFONCE := False;
  bExport_Excel := False;
  Export_ProgressBar.Visible := False;
  bDeactive_detail := False;

  bInRecherche := False;
  bCTRL_ENFONCE := False;
  bExport_Excel := False;
  Export_ProgressBar.Visible := False;
  bDeactive_detail := False;
end;

procedure TfrmTDB_ADMListe.cxgtvDMBAT_TYPE0CellDblClick
  (Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo;
  AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean);
begin
  if btnVisDMBAT1.enabled then
    btnVisDMBAT1.Click;
end;

procedure TfrmTDB_ADMListe.
  cxgtvDMBAT_TYPE0DMBAT_PAP_PC_MAD_DATEStylesGetContentStyle
  (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
begin
  AStyle := stCellVert;
end;

procedure TfrmTDB_ADMListe.
  cxgtvDMBAT_TYPE0DMBAT_PAP_REA_MAIL_DATEStylesGetContentStyle
  (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
begin
  AStyle := stCellVert;
end;

procedure TfrmTDB_ADMListe.cxgtvDMBAT_TYPE0FocusedItemChanged
  (Sender: TcxCustomGridTableView;
  APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
begin
  DMBAT_TYPE0ManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvDMBAT_TYPE0FocusedRecordChanged
  (Sender: TcxCustomGridTableView; APrevFocusedRecord, AFocusedRecord
  : TcxCustomGridRecord; ANewItemRecordFocusingChanged: Boolean);
begin
  DMBAT_TYPE0ManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvDMBAT_TYPE0SelectionChanged
  (Sender: TcxCustomGridTableView);
begin
  DMBAT_TYPE0ManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvDMBAT_TYPE1CellDblClick
  (Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo;
  AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean);
begin
  if btnVisDMBAT2.enabled then
    btnVisDMBAT2.Click;
end;

procedure TfrmTDB_ADMListe.
  cxgtvDMBAT_TYPE1DMBAT_VER_PC_MAD_DATEStylesGetContentStyle
  (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
begin
  AStyle := stCellVert;
end;

procedure TfrmTDB_ADMListe.
  cxgtvDMBAT_TYPE1DMBAT_VER_REA_MAIL_DATEStylesGetContentStyle
  (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
begin
  AStyle := stCellVert;
end;

procedure TfrmTDB_ADMListe.cxgtvDMBAT_TYPE1FocusedItemChanged
  (Sender: TcxCustomGridTableView;
  APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
begin
  DMBAT_TYPE1ManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvDMBAT_TYPE1FocusedRecordChanged
  (Sender: TcxCustomGridTableView; APrevFocusedRecord, AFocusedRecord
  : TcxCustomGridRecord; ANewItemRecordFocusingChanged: Boolean);
begin
  DMBAT_TYPE1ManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvDMBAT_TYPE1SelectionChanged
  (Sender: TcxCustomGridTableView);
begin
  DMBAT_TYPE1ManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvOFFRE_A_RELANCERCellDblClick
  (Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo;
  AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean);
begin
  if btnVisOFFRE_A_RELANCER.enabled then
    btnVisOFFRE_A_RELANCER.Click;
end;

procedure TfrmTDB_ADMListe.cxgtvOFFRE_A_RELANCERCOLLA_TRIGStylesGetContentStyle(
  Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
var strDateRelance : string ;
  begin
  if (not VarIsNull(ARecord.Values[cxgtvOFFRE_A_RELANCERCOLLA_TRIG.Index])) then
  begin
    strDateRelance:= ARecord.Values[cxgtvOFFRE_A_RELANCEROFFRE_DATE_RELANCE.Index];
    if ( StrToDate(strDateRelance) <=  dDateNow) then
      AStyle := stCellRouge;

  end;
end;

procedure TfrmTDB_ADMListe.cxgtvOFFRE_A_RELANCERFocusedItemChanged
  (Sender: TcxCustomGridTableView;
  APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
begin
  OFFRE_A_RELANCERManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvOFFRE_A_RELANCERFocusedRecordChanged
  (Sender: TcxCustomGridTableView; APrevFocusedRecord, AFocusedRecord
  : TcxCustomGridRecord; ANewItemRecordFocusingChanged: Boolean);
begin
  OFFRE_A_RELANCERManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.
  cxgtvOFFRE_A_RELANCEROFFRE_DATE_RELANCEStylesGetContentStyle
  (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
var
  strDateRelance: string;
begin
  // Date de posit < Aujourd'hui
  if not VarIsNull(ARecord.Values[cxgtvOFFRE_A_RELANCEROFFRE_DATE_RELANCE.Index])
  then
  begin
    strDateRelance := ARecord.Values
      [cxgtvOFFRE_A_RELANCEROFFRE_DATE_RELANCE.Index];
    if (StrToDate(strDateRelance) <= dDateNow) then
      AStyle := stCellRouge;

  end;
end;

procedure TfrmTDB_ADMListe.cxgtvOFFRE_A_RELANCERSelectionChanged
  (Sender: TcxCustomGridTableView);
begin
  OFFRE_A_RELANCERManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvOFFRE_ST_0CellDblClick
  (Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo;
  AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean);
begin
  if btnVisOFFRE_ST_0.enabled then
    btnVisOFFRE_ST_0.Click;
end;

procedure TfrmTDB_ADMListe.cxgtvOFFRE_ST_0FocusedItemChanged
  (Sender: TcxCustomGridTableView;
  APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
begin
  OFFRE_ST_0ManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvOFFRE_ST_0FocusedRecordChanged
  (Sender: TcxCustomGridTableView; APrevFocusedRecord, AFocusedRecord
  : TcxCustomGridRecord; ANewItemRecordFocusingChanged: Boolean);
begin
  OFFRE_ST_0ManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvOFFRE_ST_0SelectionChanged
  (Sender: TcxCustomGridTableView);
begin
  OFFRE_ST_0ManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvDDF_ECHANTCellDblClick
  (Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo;
  AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean);
begin
  if btnVisDDF_ECHANT_DMFAB.enabled then
    btnVisDDF_ECHANT_DMFAB.Click;
end;

procedure TfrmTDB_ADMListe.cxgtvDDF_ECHANTFocusedItemChanged
  (Sender: TcxCustomGridTableView;
  APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
begin
  DDF_ECHANTManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvDDF_ECHANTFocusedRecordChanged
  (Sender: TcxCustomGridTableView; APrevFocusedRecord, AFocusedRecord
  : TcxCustomGridRecord; ANewItemRecordFocusingChanged: Boolean);
begin
  DDF_ECHANTManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvDDF_ECHANTORFAB_MAD_DATEStylesGetContentStyle
  (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
begin
  // Statut de la commande 0 = EN cours
  if not VarIsNull(ARecord.Values[cxgtvDDF_ECHANTORFAB_MAD_DATE.Index]) then
  begin
    AStyle := stCellVert;
  end;
end;

procedure TfrmTDB_ADMListe.cxgtvDDF_ECHANTSelectionChanged
  (Sender: TcxCustomGridTableView);
begin
  DDF_ECHANTManagerButtonsState;
end;

{ -----------------------------------------------------------------------------
  Procedure: pCheckDDL
  Author:    PHBD
  Date:      05-Jan-2024
  Arguments: None
  Description: Coche la colonne CheckDDL
  Result:    None
  Demande:
  ----------------------------------------------------------------------------- }

procedure TfrmTDB_ADMListe.cxgtvPCDAG_A_TRAITERCellDblClick
  (Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo;
  AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean);
begin
  if btnVisCDACG.enabled then
    btnVisCDACG.Click;
end;

procedure TfrmTDB_ADMListe.cxgtvPCDAG_A_TRAITERFocusedItemChanged
  (Sender: TcxCustomGridTableView;
  APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
begin
  PCDAG_A_TRAITERManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPCDAG_A_TRAITERFocusedRecordChanged
  (Sender: TcxCustomGridTableView; APrevFocusedRecord, AFocusedRecord
  : TcxCustomGridRecord; ANewItemRecordFocusingChanged: Boolean);
begin
  PCDAG_A_TRAITERManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPCDAG_A_TRAITERSelectionChanged
  (Sender: TcxCustomGridTableView);
begin
  PCDAG_A_TRAITERManagerButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPOCDE_DECORCellDblClick
  (Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo;
  AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean);
begin
  if btnVisPOCDE6.enabled then
    btnVisPOCDE6.Click;
end;

procedure TfrmTDB_ADMListe.cxgtvPOCDE_DECORFocusedItemChanged
  (Sender: TcxCustomGridTableView;
  APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // POCDE_DECORManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPOCDE_DECORFocusedRecordChanged
  (Sender: TcxCustomGridTableView; APrevFocusedRecord, AFocusedRecord
  : TcxCustomGridRecord; ANewItemRecordFocusingChanged: Boolean);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // POCDE_DECORManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPOCDE_DECORORFAB_DATEStylesGetContentStyle
  (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
var
  Value: Variant;
begin
  // Afficher en rouge la Date de fabrication dans les 30 jours
  Value := ARecord.Values[cxgtvPOCDE_DECORORFAB_DATE.Index];
  if not VarIsNull(Value) then
  begin
    if Value <= dDateNow + 30 then
      AStyle := stCellRouge;
  end;
end;

procedure TfrmTDB_ADMListe.cxgtvPOCDE_DECORSelectionChanged
  (Sender: TcxCustomGridTableView);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // POCDE_DECORManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHAFaderCellDblClick
  (Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo;
  AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean);
begin
  if btnVisPOCDE5.enabled then
    btnVisPOCDE5.Click;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHAFaderFocusedItemChanged
  (Sender: TcxCustomGridTableView;
  APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // PPECHAFaderManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHAFaderFocusedRecordChanged
  (Sender: TcxCustomGridTableView; APrevFocusedRecord, AFocusedRecord
  : TcxCustomGridRecord; ANewItemRecordFocusingChanged: Boolean);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // PPECHAFaderManageButtonsState;
end;

procedure TfrmTDB_ADMListe.
  cxgtvPPECHAFaderLIVRAISONS_PLANIFIEESStylesGetContentStyle
  (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
var
  iLIVRAISONS_PLANIFIEES: Integer;
begin
  // CDE02698 FPE 09/10/2024 TDB ADV Case �ch�ances � fader, afficher en rouge si qte de cols restants � fader > 0
  iLIVRAISONS_PLANIFIEES :=
    VarToIntDef(ARecord.Values[cxgtvPPECHAFaderLIVRAISONS_PLANIFIEES.Index], 0);
  if (iLIVRAISONS_PLANIFIEES > 0) then
    AStyle := stCellRouge;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHAFaderPPECH_DATE_FADStylesGetContentStyle
  (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
var
  Value: Variant;
begin
  // Afficher en rouge la Date FAD <= Aujourd'hui
  Value := ARecord.Values[cxgtvPPECHAFaderPPECH_DATE_FAD.Index];
  if not VarIsNull(Value) then
  begin
    if Value <= dDateNow then
      AStyle := stCellRouge;
  end;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHAFaderSelectionChanged
  (Sender: TcxCustomGridTableView);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // PPECHAFaderManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHASolderCellDblClick
  (Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo;
  AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean);
begin
  if btnVisPOCDE3.enabled then
    btnVisPOCDE3.Click;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHASolderCustomDrawCell
  (Sender: TcxCustomGridTableView; ACanvas: TcxCanvas;
  AViewInfo: TcxGridTableDataCellViewInfo; var ADone: Boolean);
begin
  if qryPPECHASolder.RecordCount > 0 then
  begin
    if (AViewInfo.GridRecord.Values[TcxGridDBTableView(Sender)
      .GetColumnByFieldName('POCDE_TYP_PRD').Index] = 0) and
      (AViewInfo.GridRecord.Values[TcxGridDBTableView(Sender)
      .GetColumnByFieldName('SOLDE_A_LIVRER').Index] = 0) and
      (AViewInfo.GridRecord.Values[TcxGridDBTableView(Sender)
      .GetColumnByFieldName('COMMA_ST').Index] < 3) then
      ACanvas.Brush.Color := clWebHotPink;

    if (AViewInfo.GridRecord.Values[TcxGridDBTableView(Sender)
      .GetColumnByFieldName('FLG_ECH_SOLDE').Index] = 1) then
      ACanvas.Brush.Color := clWebHotPink;

  end;
end; // Voir pour mettre la ligne en rouge si condition

procedure TfrmTDB_ADMListe.cxgtvPPECHASolderDENIER_BOLIVCustomDrawCell
  (Sender: TcxCustomGridTableView; ACanvas: TcxCanvas;
  AViewInfo: TcxGridTableDataCellViewInfo; var ADone: Boolean);
var
  strDateDernierBL: String;
begin
  if not VarIsNull(AViewInfo.GridRecord.Values[TcxGridDBTableView(Sender)
    .GetColumnByFieldName('DENIER_BOLIV').Index]) then
  begin
    strDateDernierBL := AViewInfo.GridRecord.Values
      [TcxGridDBTableView(Sender).GetColumnByFieldName('DENIER_BOLIV').Index];
    if (strDateDernierBL <> '') and (StrToDate(strDateDernierBL) <= dDateNow - 1)
    then
      ACanvas.Brush.Color := clGridRow_Rouge;
  end;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHASolderFocusedItemChanged
  (Sender: TcxCustomGridTableView;
  APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // PPECHASolderManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHASolderFocusedRecordChanged
  (Sender: TcxCustomGridTableView; APrevFocusedRecord, AFocusedRecord
  : TcxCustomGridRecord; ANewItemRecordFocusingChanged: Boolean);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // PPECHASolderManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHASolderSelectionChanged
  (Sender: TcxCustomGridTableView);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // PPECHASolderManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHASolderSOLDE_A_COUVRIRCustomDrawCell
  (Sender: TcxCustomGridTableView; ACanvas: TcxCanvas;
  AViewInfo: TcxGridTableDataCellViewInfo; var ADone: Boolean);
var
  val_SOLDE_A_COUVRIR: Variant;
  val_NON_A_COUVRIR: Variant;
begin
  val_SOLDE_A_COUVRIR := AViewInfo.GridRecord.Values
    [TcxGridDBTableView(Sender).GetColumnByFieldName('SOLDE_A_COUVRIR').Index];
  val_NON_A_COUVRIR := AViewInfo.GridRecord.Values
    [TcxGridDBTableView(Sender).GetColumnByFieldName('NON_A_COUVRIR').Index];
  if (val_SOLDE_A_COUVRIR > 0) and (val_NON_A_COUVRIR = 1) then
    ACanvas.Brush.Color := clGridRow_Rouge;
end;

procedure TfrmTDB_ADMListe.cxgtvDDL_A_CREE_FADListeCellDblClick
  (Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo;
  AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean);
begin
  if btnVisPOCDE1.enabled then
    btnVisPOCDE1.Click;
end;

procedure TfrmTDB_ADMListe.cxgtvDDL_A_CREE_FADListeFocusedItemChanged
  (Sender: TcxCustomGridTableView;
  APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // DDL_A_CREER_FADListeManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvDDL_A_CREE_FADListeFocusedRecordChanged
  (Sender: TcxCustomGridTableView; APrevFocusedRecord, AFocusedRecord
  : TcxCustomGridRecord; ANewItemRecordFocusingChanged: Boolean);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // DDL_A_CREER_FADListeManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvDDL_A_CREE_FADListeSelectionChanged
  (Sender: TcxCustomGridTableView);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // DDL_A_CREER_FADListeManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHProdRetardCellDblClick
  (Sender: TcxCustomGridTableView; ACellViewInfo: TcxGridTableDataCellViewInfo;
  AButton: TMouseButton; AShift: TShiftState; var AHandled: Boolean);
begin
  if btnVisPOCDE2.enabled then
    btnVisPOCDE2.Click;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHProdRetardFocusedItemChanged
  (Sender: TcxCustomGridTableView;
  APrevFocusedItem, AFocusedItem: TcxCustomGridTableItem);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // PPECHProdRetardManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHProdRetardFocusedRecordChanged
  (Sender: TcxCustomGridTableView; APrevFocusedRecord, AFocusedRecord
  : TcxCustomGridRecord; ANewItemRecordFocusingChanged: Boolean);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // PPECHProdRetardManageButtonsState;
end;

procedure TfrmTDB_ADMListe.
  cxgtvPPECHProdRetardORFAB_DATE_FAB_PREVStylesGetContentStyle
  (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
begin
  // Date MAD < Date MAD DDF
  if not VarIsNull(ARecord.Values[cxgtvPPECHProdRetardORFAB_DATE_FAB_PREV.Index]
    ) and not VarIsNull(ARecord.Values[cxgtvPPECHProdRetardPPECH_DATE.Index])
  then
  begin
    if ARecord.Values[cxgtvPPECHProdRetardPPECH_DATE.Index] < ARecord.Values
      [cxgtvPPECHProdRetardORFAB_DATE_FAB_PREV.Index] then
      AStyle := stCellRouge;
  end
  // Date d�part fournisseur < Date MAD DDF
  else if not VarIsNull(ARecord.Values[cxgtvPPECHProdRetardORFAB_DATE_FAB_PREV.
    Index]) and not VarIsNull
    (ARecord.Values[cxgtvPPECHProdRetardDMDAP_DATE_VALIDITE.Index]) then
  begin
    if ARecord.Values[cxgtvPPECHProdRetardDMDAP_DATE_VALIDITE.Index] <
      ARecord.Values[cxgtvPPECHProdRetardORFAB_DATE_FAB_PREV.Index] then
      AStyle := stCellRouge;
  end;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECHProdRetardSelectionChanged
  (Sender: TcxCustomGridTableView);
begin
  // CDE02460 FPE 06/12/2022 Optimisation
  // PPECHProdRetardManageButtonsState;
end;

procedure TfrmTDB_ADMListe.cxgtvPPECH_SOLDE_RESVStylesGetContentStyle
  (Sender: TcxCustomGridTableView; ARecord: TcxCustomGridRecord;
  AItem: TcxCustomGridTableItem; var AStyle: TcxStyle);
var
  Value: Variant;
  iSoldeResv: Integer;
begin
  // Afficher en rouge la Date FAD <= Aujourd'hui
  Value := ARecord.Values[cxgtvPPECHAFaderPPECH_DATE_FAD.Index];
  iSoldeResv := VarToIntDef(ARecord.Values[cxgtvPPECH_SOLDE_RESV.Index], 0);
  if not VarIsNull(Value) then
  begin
    if (Value <= dDateNow) and (iSoldeResv > 0) then
      AStyle := stCellRouge;
  end;
end;

destructor TfrmTDB_ADMListe.Destroy;
begin
  if Assigned(frmCADENPopUp) then
    FreeAndNil(frmCADENPopUp);
  if Assigned(FThreadPool) then
    FreeAndNil(FThreadPool);
  inherited;
end;

procedure TfrmTDB_ADMListe.dxtciCADEN_PPECHClick(Sender: TdxTileControlItem);
var
  APoint: TPoint;
begin
  APoint := Sender.TileControl.ScreenToClient(Mouse.CursorPos);

  if APoint.X > (Sender.ViewInfo.Bounds.Left + (Sender.ViewInfo.Bounds.right -
    Sender.ViewInfo.Bounds.Left) div 2) then
  begin
    if fTransDroit(fTransId('TfrmCADENListe'), etFVisu) then
    begin
      ListeEnvoi.ID := 'TDB_ADM_CADEN_DATE';
      ListeEnvoi.Quoi := 'ID';

      fInitListeEnvoi(ListeEnvoi);

      if edtADM_COLLA_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_ID', edtADM_COLLA_ID.Text,
          True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG',
          edtADM_COLLA_TRIG.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM', edtADM_COLLA_NOM.Text +
          ' ' + edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnADM_COLLA', '', True, vtNORMAL);
      end;

      if edtCDM_COLLA_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_ID', edtCDM_COLLA_ID.Text,
          True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG',
          edtCDM_COLLA_TRIG.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text +
          ' ' + edtCDM_COLLA_PRENOM.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnCDM_COLLA', '', True, vtNORMAL);
      end;

      if edtRZA_COLLA_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_ID', edtRZA_COLLA_ID.Text,
          True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG',
          edtRZA_COLLA_TRIG.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text +
          ' ' + edtRZA_COLLA_PRENOM.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnRZA_COLLA', '', True, vtNORMAL);
      end;

      if edtRZC_COLLA_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_ID', edtRZC_COLLA_ID.Text,
          True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_TRIG',
          edtRZC_COLLA_TRIG.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_NOM', edtRZC_COLLA_NOM.Text +
          ' ' + edtRZC_COLLA_PRENOM.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnRZC_COLLA', '', True, vtNORMAL);
      end;

      if edtTIERS_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtTIERS_ID', edtTIERS_ID.Text, True,
          vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtTIERS_CODE', edtTIERS_CODE.Text, True,
          vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtTIERS_RS_L1', edtTIERS_RS_L1.Text,
          True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnTIERS', '', True, vtNORMAL);
      end;

      if edtZOCOM_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, True,
          vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtZOCOM_CODE', '', True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True,
          vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnZOCOM', '', True, vtNORMAL);
      end;

      //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
      if edtDirVen_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
          vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
          vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
      end;

      ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
      ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
      ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
      ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
      ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
      ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

      //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
      if edtDirVen_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltre(edtDirVen_ID.Text); // ID = 6
      end;

      ListeEnvoi.bLanceRecherche := True;

      frmMain.oGestionAffichageEcran.fAfficheListe('TfrmCADENListe', Self,
        etLRecherche, ListeEnvoi, False);
    end;
  end
  else
  begin
    if fTransDroit(fTransId('TfrmCADENListe'), etFVisu) then
    begin
      ListeEnvoi.ID := 'TDB_ADM_CADEN_CREATION_SOLDE';
      ListeEnvoi.Quoi := 'ID';

      fInitListeEnvoi(ListeEnvoi);

      if edtADM_COLLA_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_ID', edtADM_COLLA_ID.Text,
          True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG',
          edtADM_COLLA_TRIG.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM', edtADM_COLLA_NOM.Text +
          ' ' + edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnADM_COLLA', '', True, vtNORMAL);
      end;

      if edtCDM_COLLA_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_ID', edtCDM_COLLA_ID.Text,
          True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG',
          edtCDM_COLLA_TRIG.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text +
          ' ' + edtCDM_COLLA_PRENOM.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnCDM_COLLA', '', True, vtNORMAL);
      end;

      if edtRZA_COLLA_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_ID', edtRZA_COLLA_ID.Text,
          True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG',
          edtRZA_COLLA_TRIG.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text +
          ' ' + edtRZA_COLLA_PRENOM.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnRZA_COLLA', '', True, vtNORMAL);
      end;

      if edtRZC_COLLA_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_ID', edtRZC_COLLA_ID.Text,
          True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_TRIG',
          edtRZC_COLLA_TRIG.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_NOM', edtRZC_COLLA_NOM.Text +
          ' ' + edtRZC_COLLA_PRENOM.Text, True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnRZC_COLLA', '', True, vtNORMAL);
      end;

      if edtTIERS_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtTIERS_ID', edtTIERS_ID.Text, True,
          vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtTIERS_CODE', edtTIERS_CODE.Text, True,
          vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtTIERS_RS_L1', edtTIERS_RS_L1.Text,
          True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnTIERS', '', True, vtNORMAL);
      end;

      if edtZOCOM_ID.Text <> EmptyStr then
      begin
        ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, True,
          vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtZOCOM_CODE', '', True, vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True,
          vtNORMAL);
        ListeEnvoi.AddFiltreDebranch('btnZOCOM', '', True, vtNORMAL);
      end;

      ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
      ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
      ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
      ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
      ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
      ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

      ListeEnvoi.bLanceRecherche := True;

      frmMain.oGestionAffichageEcran.fAfficheListe('TfrmCADENListe', Self,
        etLRecherche, ListeEnvoi, False);
    end;
  end;
end;

procedure TfrmTDB_ADMListe.dxtciCOMMAListeClick(Sender: TdxTileControlItem);
var
  APoint: TPoint;
begin
  APoint := Sender.TileControl.ScreenToClient(Mouse.CursorPos);

  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmCOMMA_V2Liste'), etFVisu) then
  begin
    ListeEnvoi.ID := 'TDB_ADM_COMMA';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_COLLA_ID', edtADM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_COLLA_TRIG',
        edtADM_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_COLLA_NOM', edtADM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCOMMA_COLLA', '', True, vtNORMAL);
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_ID', edtCDM_COLLA_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_TRIG', edtCDM_COLLA_TRIG.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_NOMPRENOM', edtCDM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM', '', True, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_ID', edtRZA_COLLA_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_TRIG', edtRZA_COLLA_TRIG.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_NOMPRENOM', edtRZA_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZA', '', True, vtNORMAL);
    end;

    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_DO_TIERS_ID', edtTIERS_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_DO_TIERS_CODE', edtTIERS_CODE.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_DO_TIERS_LS_R1',
        edtTIERS_RS_L1.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCOMMA_DO_TIERS', '', True, vtNORMAL);
    end;

    if edtZOCOM_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_CODE', '', True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnZOCOM', '', True, vtNORMAL);
    end;

    // CDE02590 FPE 21/12/2023 Ajout des commandes en attente de validation � la s�lection de la tuiles des ARC � �mettre
    if APoint.X > (Sender.ViewInfo.Bounds.Left + (Sender.ViewInfo.Bounds.right -
      Sender.ViewInfo.Bounds.Left) div 2) then
    begin
      ListeEnvoi.AddFiltreDebranch('clbCOMMA_ST', '1', True, vtCHXFG);
    end
    else
    begin
      ListeEnvoi.AddFiltreDebranch('clbCOMMA_ST', '0', True, vtCHXFG);
    end;

    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;


    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    if APoint.X > (Sender.ViewInfo.Bounds.Left + (Sender.ViewInfo.Bounds.right -
      Sender.ViewInfo.Bounds.Left) div 2) then
    begin
      ListeEnvoi.AddFiltreDebranch('clbCOMMA_ST', '1', True, vtCHXFG);
      frmMain.oGestionAffichageEcran.fAfficheListe
        ('TfrmCOMMA_DMD_VALID_ARCListe', Self, etLRecherche, ListeEnvoi, True);
    end
    else
    begin
      ListeEnvoi.AddFiltreDebranch('clbCOMMA_ST', '0', True, vtCHXFG);
      frmMain.oGestionAffichageEcran.fAfficheListe('TfrmCOMMA_V2Liste', Self,
        etLRecherche, ListeEnvoi, True);
    end;

  end;
end;

// feature/CDE02728 FPE 30/04/2025 Demandes annulation de commandes (en-cours/accept�e/refus�e)
procedure TfrmTDB_ADMListe.dxtciDAMCCClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if fTransDroit(fTransId('TfrmDAMCCListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'TDB_ADM_LISTE';
    ListeEnvoi.Quoi := 'ID';

    // Pour le d�branchement automatique
    fInitListeEnvoi(ListeEnvoi);
    // if edtTIERS_ID.Text <> EmptyStr then
    // begin
    // ListeEnvoi.AddFiltreDebranch('edtTIERS_ID', edtTIERS_ID.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('edtTIERS_CODE', edtTIERS_CODE.text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('edtTIERS_LS_R1', edtTIERS_RS_L1.Text , True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('btnTIERS', '', True, vtNORMAL);
    // end;
    // if edtADM_COLLA_ID.Text <> EmptyStr then
    // begin
    // ListeEnvoi.AddFiltreDebranch('edtADM_ID', edtADM_COLLA_ID.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('edtADM_TRIG', edtADM_COLLA_TRIG.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('edtADM_NOM_PRENOM', edtADM_COLLA_NOM.Text + ' ' + edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('btnADM', '', True, vtNORMAL);
    // end;
    // if edtCDM_COLLA_ID.Text <> EmptyStr then
    // begin
    // ListeEnvoi.AddFiltreDebranch('edtCDM_ID', edtCDM_COLLA_ID.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('edtCDM_TRIG', edtCDM_COLLA_TRIG.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('edtCDM_NOM_PRENOM', edtCDM_COLLA_NOM.Text + ' ' + edtCDM_COLLA_PRENOM.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('btnCDM', '', True, vtNORMAL);
    // end;
    // if edtRZA_COLLA_ID.Text <> EmptyStr then
    // begin
    // ListeEnvoi.AddFiltreDebranch('edtRZA_ID', edtRZA_COLLA_ID.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('edtRZA_TRIG', edtRZA_COLLA_TRIG.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('edtRZA_NOM_PRENOM' , edtRZA_COLLA_NOM.Text + ' ' + edtRZA_COLLA_PRENOM.Text , True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('btnRZA', '' , True, vtNORMAL);
    // end;
    // if edtRZC_COLLA_ID.Text <> EmptyStr then
    // begin
    // ListeEnvoi.AddFiltreDebranch('edtRZC_ID', edtRZC_COLLA_ID.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('edtRZC_TRIG', edtRZC_COLLA_TRIG.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('edtRZC_NOM_PRENOM' , edtRZC_COLLA_NOM.Text + ' ' + edtRZC_COLLA_PRENOM.Text , True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('btnRZC', '' , True, vtNORMAL);
    // end;
    // if edtZOCOM_ID.Text <> EmptyStr then
    // begin
    // ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True, vtNORMAL);
    // ListeEnvoi.AddFiltreDebranch('btnZOCOM', '' , True, vtNORMAL);
    // end;
    // ListeEnvoi.AddFiltreDebranch('clbDAMCC_ST', '0,3,4', True, vtCHXFG);

    // ListeEnvoi.aFiltreDebrch[7].NomComposant    := 'clbDAMCC_ST';
    // ListeEnvoi.aFiltreDebrch[7].ValeurComposant := '0,3,4';
    // ListeEnvoi.aFiltreDebrch[7].ValeurType      := vtCHXFG;
    // ListeEnvoi.aFiltreDebrch[7].Static          := True;

    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmDAMCCListe', Self,
      etLRecherche, ListeEnvoi);
  end;

  // ---------------------------------------------------
  // ---------------------------------------------------

end;

// fin feature/CDE02728 FPE 30/04/2025 Demandes annulation de commandes (en-cours/accept�e/refus�e)
procedure TfrmTDB_ADMListe.dxtciDDF_ECHANTClick(Sender: TdxTileControlItem);
begin

  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Abort;
    Exit;
  end;

  if qryDDF_ECHANT.Active = False then
    btnDDF_Echant_RECClick(Sender);

end;

procedure TfrmTDB_ADMListe.dxtciDDF_PARClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmImp_POReportListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_DDF_Par';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_ID', edtADM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM', edtADM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_PRENOM',
        edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnADM_COLLA', '', True, vtNORMAL);
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_ID', edtCDM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_PRENOM',
        edtCDM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM_COLLA', '', True, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_ID', edtRZA_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_PRENOM',
        edtRZA_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZA_COLLA', '', True, vtNORMAL);
    end;

    if edtRZC_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_ID', edtRZC_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_TRIG', edtRZC_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_NOM', edtRZC_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_PRENOM',
        edtRZC_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZC_COLLA', '', True, vtNORMAL);
    end;

    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtTIERS_ID', edtTIERS_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_CODE', edtTIERS_CODE.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_RS_L1', edtTIERS_RS_L1.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnTIERS', '', True, vtNORMAL);
    end;

    if edtZOCOM_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnZOCOM', '', True, vtNORMAL);
    end;

    ListeEnvoi.AddFiltreDebranch('chkPO', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkARBBE', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkROLFR', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDMDAP', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDDF_VN', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDDF_PAR', '1', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkPO_TRANSIT', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkPO_CADEN', '0', True, vtNORMAL);

    SetLength(ListeEnvoi.filtre, 1);
    ListeEnvoi.filtre[0] := '';
    if bExport_Excel then
      ListeEnvoi.filtre[0] := sExport_XL_FILENAME;

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmImp_POReportListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;

end;

procedure TfrmTDB_ADMListe.dxtciDDF_VNClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmImp_POReportListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_DDF_VN';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_ID', edtADM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM', edtADM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_PRENOM',
        edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnADM_COLLA', '', True, vtNORMAL);
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_ID', edtCDM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_PRENOM',
        edtCDM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM_COLLA', '', True, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_ID', edtRZA_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_PRENOM',
        edtRZA_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZA_COLLA', '', True, vtNORMAL);
    end;

    if edtRZC_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_ID', edtRZC_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_TRIG', edtRZC_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_NOM', edtRZC_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_PRENOM',
        edtRZC_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZC_COLLA', '', True, vtNORMAL);
    end;

    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtTIERS_ID', edtTIERS_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_CODE', edtTIERS_CODE.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_RS_L1', edtTIERS_RS_L1.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnTIERS', '', True, vtNORMAL);
    end;

    if edtZOCOM_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnZOCOM', '', True, vtNORMAL);
    end;

    ListeEnvoi.AddFiltreDebranch('chkPO', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkARBBE', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkROLFR', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDMDAP', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDDF_VN', '1', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDDF_PAR', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkPO_TRANSIT', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkPO_CADEN', '0', True, vtNORMAL);

    SetLength(ListeEnvoi.filtre, 1);
    ListeEnvoi.filtre[0] := '';
    if bExport_Excel then
      ListeEnvoi.filtre[0] := sExport_XL_FILENAME;

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmImp_POReportListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;

end;

procedure TfrmTDB_ADMListe.dxtciDDL_A_CREERClick(Sender: TdxTileControlItem);
begin
  if fTransDroit(fTransId('TfrmCADENListe'), etFVisu) then
  begin
    ListeEnvoi.ID   := 'TDB_ADM_CADEN';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_ID',   edtADM_COLLA_ID.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG', edtADM_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM',  edtADM_COLLA_NOM.Text + ' ' + edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_ID',   edtCDM_COLLA_ID.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM',  edtCDM_COLLA_NOM.Text + ' ' + edtCDM_COLLA_PRENOM.Text, True, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_ID',   edtRZA_COLLA_ID.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM',  edtRZA_COLLA_NOM.Text + ' ' + edtRZA_COLLA_PRENOM.Text, True, vtNORMAL);
    end;

    if edtRZC_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_ID',   edtRZC_COLLA_ID.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_TRIG', edtRZC_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_NOM',  edtRZC_COLLA_NOM.Text + ' ' + edtRZC_COLLA_PRENOM.Text, True, vtNORMAL);
    end;

    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtTIERS_ID',   edtTIERS_ID.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_CODE', edtTIERS_CODE.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_RS_L1', edtTIERS_RS_L1.Text, True, vtNORMAL);
    end;

    if edtZOCOM_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID',  edtZOCOM_ID.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_CODE', '', True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True, vtNORMAL);
    end;

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;


    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmCADENListe', Self, etLRecherche, ListeEnvoi, false);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciDEEXP_ANOMAClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if fTransDroit(fTransId('TfrmDEEXPListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_POEXP';
    ListeEnvoi.Quoi := 'POEXP_ANOMA_ADM';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCOLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOLLA_NOM_PRENOM', edtADM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCOLLA', '', True, vtNORMAL);
    end;

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5
    // ListeEnvoi.AddFiltre('9'); // ID = 6 -->> Anomalie � Oui
    ListeEnvoi.AddFiltreDebranch('cbxDEEXP_TYP', '0', True, vtCHXFG); // DDL
    ListeEnvoi.AddFiltreDebranch('clbPOEXP_ST', '0,1,2,6', True, vtCHXFG);
    // Statuts Encours / Emis � pr�parer
    ListeEnvoi.AddFiltreDebranch('cbxANOMALI', '1', True, vtCHXFG); // Anomalie
    ListeEnvoi.AddFiltreDebranch('clbANOMA_TYP', '0', True, vtCHXFG);
    // type d'anomaile

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 0
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmPOEXPListe', Self,
      etLRecherche, ListeEnvoi, False);

  end;
end;

procedure TfrmTDB_ADMListe.dxtciDEEXP_ST_0Click(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmDEEXPListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_DEEXP';
    ListeEnvoi.Quoi := 'DEEXP_ST_0';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCOLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOLLA_NOM_PRENOM', edtADM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCOLLA', '', True, vtNORMAL);
    end;

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5
    ListeEnvoi.AddFiltre('0'); // ID = 6 -->> Anomalie � Non

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 7
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.AddFiltreDebranch('cbxDEEXP_TYP', '0', True, vtCHXFG); // DDL
    ListeEnvoi.AddFiltreDebranch('ClbDEEXP_ST', '0', True, vtCHXFG);

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    // Statut En cours
    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmDEEXPListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciDEEXP_ST_2Click(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if fTransDroit(fTransId('TfrmDEEXPListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_DEEXP';
    ListeEnvoi.Quoi := 'DEEXP_ST_2';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCOLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOLLA_NOM_PRENOM', edtADM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCOLLA', '', True, vtNORMAL);
    end;

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    ListeEnvoi.AddFiltreDebranch('cbxDEEXP_TYP', '0', True, vtCHXFG); // DDL
    ListeEnvoi.AddFiltreDebranch('ClbDEEXP_ST', '1,2', True, vtCHXFG);
    // Statut Pr�par�

    { ListeEnvoi.AddFiltre('');
      ListeEnvoi.AddFiltre('');
      ListeEnvoi.AddFiltre('');
      ListeEnvoi.AddFiltre('');
      ListeEnvoi.AddFiltre('');
      ListeEnvoi.AddFiltre(''); }

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 0
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmDEEXPListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciDMBAT_TYPE0Click(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Abort;
    Exit;
  end;

  if qryDMBAT_TYPE0.Active = False then
    btnDMBAType0Click(Sender);
end;

procedure TfrmTDB_ADMListe.dxtciDMBAT_TYPE1Click(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Abort;
    Exit;
  end;

  if qryDMBAT_TYPE1.Active = False then
    btnDMBATType1Click(Sender);
end;

procedure TfrmTDB_ADMListe.dxtciDMDAPAuListeClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmImp_POReportListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_DMDAP';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_ID', edtADM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM', edtADM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_PRENOM',
        edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnADM_COLLA', '', True, vtNORMAL);
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_ID', edtCDM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_PRENOM',
        edtCDM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM_COLLA', '', True, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_ID', edtRZA_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_PRENOM',
        edtRZA_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZA_COLLA', '', True, vtNORMAL);
    end;

    if edtRZC_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_ID', edtRZC_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_TRIG', edtRZC_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_NOM', edtRZC_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_PRENOM',
        edtRZC_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZC_COLLA', '', True, vtNORMAL);
    end;

    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtTIERS_ID', edtTIERS_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_CODE', edtTIERS_CODE.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_RS_L1', edtTIERS_RS_L1.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnTIERS', '', True, vtNORMAL);
    end;

    if edtZOCOM_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnZOCOM', '', True, vtNORMAL);
    end;

    ListeEnvoi.AddFiltreDebranch('chkPO', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkARBBE', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkROLFR', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDMDAP', '1', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDDF_VN', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDDF_PAR', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkPO_TRANSIT', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkPO_CADEN', '0', True, vtNORMAL);

    SetLength(ListeEnvoi.filtre, 1);
    ListeEnvoi.filtre[0] := '';
    if bExport_Excel then
      ListeEnvoi.filtre[0] := sExport_XL_FILENAME;

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmImp_POReportListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;

end;

procedure TfrmTDB_ADMListe.dxtciDMDAPListeClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if fTransDroit(fTransId('TfrmDMAPRListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'TDB_ADM_DMDAPR';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    ListeEnvoi.AddFiltreDebranch('clbPRCDT_MODE_GES', '2', True, vtCHXFG);
    // MTO

    SetLength(ListeEnvoi.filtre, 1);
    ListeEnvoi.filtre[0] := '';
    if bExport_Excel then
      ListeEnvoi.filtre[0] := sExport_XL_FILENAME;

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmDMAPRListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;

end;

procedure TfrmTDB_ADMListe.dxtciECH_EN_COURSClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmDMECHListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'DMECHListe';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDMECH_DO_TIERS_ID', edtTIERS_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_CODE', edtTIERS_CODE.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_RS_L1', edtTIERS_RS_L1.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDO_TIERS', '', True, vtNORMAL);
    end;

    SetLength(ListeEnvoi.filtre, 8);
    ListeEnvoi.filtre[0] := '';
    if bExport_Excel then
      ListeEnvoi.filtre[0] := sExport_XL_FILENAME;

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.filtre[1] := edtADM_COLLA_ID.Text;
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.filtre[2] := edtCDM_COLLA_ID.Text;
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.filtre[3] := edtRZA_COLLA_ID.Text;
    end;

    if edtRZC_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.filtre[4] := edtRZC_COLLA_ID.Text;
    end;

    if edtZOCOM_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.filtre[5] := edtZOCOM_ID.Text;
    end;
    // clbDMECH_ST  // Encours
    ListeEnvoi.filtre[6] := '0';
    // rgModeRecherche  //mode �mission
    ListeEnvoi.filtre[7] := '1';

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    ListeEnvoi.bLanceRecherche := True;
    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmDMECHListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciESN1A_ST0Click(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if fTransDroit(fTransId('TfrmESN1A_FRSTKListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'TDB_ADM_ESN1A_ST0';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    ListeEnvoi.AddFiltreDebranch('chkESN1A_A_TRAITER', '1', True, vtCHXFG);
    // � traiter
    ListeEnvoi.AddFiltreDebranch('clbESN1A_ST', '0', True, vtCHXFG);
    // Pr�t / � envoyer

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers DO de la facture
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmESN1A_FRSTKListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciESN1A_ST1Click(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if fTransDroit(fTransId('TfrmESN1A_FRSTKListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'TDB_ADM_ESN1A_ST1';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    ListeEnvoi.AddFiltreDebranch('chkESN1A_A_TRAITER', '0', True, vtCHXFG);
    // � traiter = Faux
    ListeEnvoi.AddFiltreDebranch('clbESN1A_ST', '1', True, vtCHXFG);
    // �mis / � facturer

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers DO de la facture
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    //GEN00987
    if edtADM_COLLA_ID.Text<>emptyStr then
     begin
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG', edtADM_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM', edtADM_COLLA_NOM.Text+' '+edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnADM', '', True, vtNORMAL);
     end;
    if edtCDM_COLLA_ID.Text<>emptyStr then
     begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text+' '+edtCDM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM', '', True, vtNORMAL);
     end;
    if edtRZA_COLLA_ID.Text<>emptyStr then
     begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text+' '+edtRZA_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZM', '', True, vtNORMAL);
     end;
    if edtTIERS_ID.Text<>emptyStr then
     begin
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_CODE', edtTIERS_CODE.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_LS_R1', edtTIERS_RS_L1.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDO_TIERS', '', True, vtNORMAL);
     end;
    //GEN00987

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmESN1A_FRSTKListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciFACTU_IMPREClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if fTransDroit(fTransId('TfrmFACTUListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_FACTU_IMPRE';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_ID', EmptyStr, False,
      vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_TRIG', EmptyStr, False,
      vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_NOM', EmptyStr, False,
      vtNORMAL);

    ListeEnvoi.AddFiltreDebranch('clbFACTU_ST', '1,4', True, vtCHXFG);
    // Statut = �mises / annul�es (comme d�clar� dans TfrmFACTUListe)

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers DO de la facture
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5
    ListeEnvoi.AddFiltre('1'); // ID = 6

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 7
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmFACTUListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciFACTU_ST0Click(Sender: TdxTileControlItem);
begin
  if fTransDroit(fTransId('TfrmFACTUListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_FACTU_ST0';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_ID', EmptyStr, False,
      vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_TRIG', EmptyStr, False,
      vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_NOM', EmptyStr, False,
      vtNORMAL);

    ListeEnvoi.AddFiltreDebranch('clbFACTU_ST', '0', True, vtCHXFG);
    // Statut = en cours

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers DO de la facture
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5
    ListeEnvoi.AddFiltre('0'); // ID = 6
    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmFACTUListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciFCMNT_A_FACTClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if fTransDroit(fTransId('TfrmFCMNTListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'TDB_ADM_FCMNT_A_FACT';
    ListeEnvoi.Quoi := 'ID';

    ListeEnvoi.AddFiltreDebranch('cbxFCMNT_SOLDE', '0', True, vtCHXFG);

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    // Solde = 0 Non sold�
    // ListeEnvoi.AddFiltreDebranch('cbxFCMNT_TYP', '0', True, vtCHXFG); // Type = 1 (Client)

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers DO de la facture
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmFCMNTListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciNFSTK_ST0Click(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if fTransDroit(fTransId('TfrmAVMAD_FRSTKListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'TDB_ADM_NFSTK_ST0';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    ListeEnvoi.AddFiltreDebranch('clbNFSTK_ST', '0', True, vtCHXFG);
    // Pr�t / � envoyer

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers DO de la facture
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    //GEN00987
    if edtADM_COLLA_ID.Text<>emptyStr then
     begin
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG', edtADM_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM', edtADM_COLLA_NOM.Text+' '+edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnADM', '', True, vtNORMAL);
     end;
    if edtCDM_COLLA_ID.Text<>emptyStr then
     begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text+' '+edtCDM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM', '', True, vtNORMAL);
     end;
    if edtRZA_COLLA_ID.Text<>emptyStr then
     begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text+' '+edtRZA_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZM', '', True, vtNORMAL);
     end;
    if edtTIERS_ID.Text<>emptyStr then
     begin
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_CODE', edtTIERS_CODE.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_LS_R1', edtTIERS_RS_L1.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDO_TIERS', '', True, vtNORMAL);
     end;
    //GEN00987

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmAVMAD_FRSTKListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciOFFRE_A_RELANCERClick
  (Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Abort;
    Exit;
  end;

  if qryOFFRE_A_RELANCER.Active = False then
    btnOffreARelancer_RECClick(Sender);
end;

procedure TfrmTDB_ADMListe.dxtciOFFRE_ST_0Click(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Abort;
    Exit;
  end;

  if qryOFFRE_ST_0.Active = False then
    btnOffreSt0_RECClick(Sender);
end;

procedure TfrmTDB_ADMListe.dxtciPCDAG_A_TRAITERClick
  (Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Abort;
    Exit;
  end;

  if qryPCDAG_A_TRAITER.Active = False then
    btnPCDAGATraiter_RECClick(Sender);
end;

procedure TfrmTDB_ADMListe.dxtciPOCDE_BLKClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmCOMMA_BLKListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_PO_BLK';
    ListeEnvoi.Quoi := 'ID';
    fInitListeEnvoi(ListeEnvoi);
    ListeEnvoi.AddFiltreDebranch('cbxCOMMA_ST_BLK', '1', True, vtCHXFG);
    // Statut = Bloqu� = 1
    ListeEnvoi.AddFiltreDebranch('clbTIEFA_CLASS', '', True, vtCHXFG); // Tous

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers DO de la facture
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmCOMMA_BLKListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciPOCDE_DECORClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Abort;
    Exit;
  end;

  if qryPOCDE_DECOR.Active = False then
    btnPOCDEDecor_RECClick(Sender);
end;

procedure TfrmTDB_ADMListe.dxtciPPECHAFaderListeClick
  (Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Abort;
    Exit;
  end;

  if qryPPECHAFader.Active = False then
    btnPPECHAFaderClick(Sender);
end;

procedure TfrmTDB_ADMListe.dxtciPPECHASolderListeClick
  (Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Abort;
    Exit;
  end;

  if qryPPECHASolder.Active = False then
    btnPPECHASolder_RECClick(Sender);
end;

procedure TfrmTDB_ADMListe.dxtciPPECHExpedEnREtardClick
  (Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if fTransDroit(fTransId('TfrmImp_POReportListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_PO_RETARD';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_ID', edtADM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM', edtADM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_PRENOM',
        edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnADM_COLLA', '', True, vtNORMAL);
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_ID', edtCDM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_PRENOM',
        edtCDM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM_COLLA', '', True, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_ID', edtRZA_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_PRENOM',
        edtRZA_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZA_COLLA', '', True, vtNORMAL);
    end;

    if edtRZC_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_ID', edtRZC_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_TRIG', edtRZC_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_NOM', edtRZC_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_PRENOM',
        edtRZC_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZC_COLLA', '', True, vtNORMAL);
    end;

    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtTIERS_ID', edtTIERS_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_CODE', edtTIERS_CODE.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_RS_L1', edtTIERS_RS_L1.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnTIERS', '', True, vtNORMAL);
    end;

    if edtZOCOM_ID.Text <> EmptyStr then
    begin
      // ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnZOCOM', '', True, vtNORMAL);
    end;

    ListeEnvoi.AddFiltreDebranch('chkPO', '1', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkARBBE', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkROLFR', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDMDAP', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDDF_VN', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDDF_PAR', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkPO_TRANSIT', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkPO_CADEN', '0', True, vtNORMAL);

    SetLength(ListeEnvoi.filtre, 1);
    ListeEnvoi.filtre[0] := '';
    if bExport_Excel then
      ListeEnvoi.filtre[0] := sExport_XL_FILENAME;

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmImp_POReportListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciPPECHProdRetardClick
  (Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Abort;
    Exit;
  end;

  if qryPPECHProdRetard.Active = False then
    btnPPECHProdRetard_RECClick(Sender);
end;

procedure TfrmTDB_ADMListe.dxtciSTOCKS_2ANSClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmSTKRLFiche'), etFMaj) then
  begin

    ListeEnvoi.ID := 'TDB_STKRL';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_ID', edtTIERS_ID.Text, False,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_CODE', edtTIERS_CODE.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_RS_L1', edtTIERS_RS_L1.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDO_TIERS', '', False, vtNORMAL);
    end;

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_ID', edtADM_COLLA_ID.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG', edtADM_COLLA_TRIG.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOMPRENOM',
        edtADM_COLLA_NOM.Text + ' ' + edtADM_COLLA_PRENOM.Text, False,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnADM_COLLA', '', False, vtNORMAL);
    end;
    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_ID', edtCDM_COLLA_ID.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOMPRENOM',
        edtCDM_COLLA_NOM.Text + ' ' + edtCDM_COLLA_PRENOM.Text, False,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM_COLLA', '', False, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_ID', edtRZA_COLLA_ID.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOMPRENOM',
        edtRZA_COLLA_NOM.Text + ' ' + edtRZA_COLLA_PRENOM.Text, False,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZA_COLLA', '', False, vtNORMAL);
    end;

    if edtZOCOM_ID.Text <> EmptyStr then
    begin
      // ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, False, vtNORMAL);
      // ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, False, vtNORMAL);
      // ListeEnvoi.AddFiltreDebranch('btnZOCOM', '' , False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtSECTEUR_ID', edtZOCOM_ID.Text, False,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtSECTEUR_DES', edtZOCOM_DES.Text, False,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnSECTEUR', '', False, vtNORMAL);

    end;

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 0
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;
    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmSTKRLFiche', Self,
      edtTIERS_ID.Text, etFVisu, ListeEnvoi);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciTARIF_ANOMALIEClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if qryTARIFListe.Active = False then
    btnTarif_Anomalie_RECClick(Sender);
  // 46175
end;

procedure TfrmTDB_ADMListe.dxtciTARIF_ST0Click(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmTARIFListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_TARIF_ST0';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    ListeEnvoi.AddFiltreDebranch('chklstTARIF_ST', '0', True, vtCHXFG);
    ListeEnvoi.AddFiltreDebranch('chklstTARIF_TYP', '1', True, vtCHXFG);
    ListeEnvoi.AddFiltreDebranch('chxTARIF_DER_VERSI', '0', True, vtNORMAL);

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;


    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmTARIFListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciTARIF_ST1Click(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmTARIFListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_TARIF_ST1';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    ListeEnvoi.AddFiltreDebranch('chklstTARIF_ST', '1', True, vtCHXFG);
    ListeEnvoi.AddFiltreDebranch('chklstTARIF_TYP', '0,1', True, vtCHXFG);
    ListeEnvoi.AddFiltreDebranch('chxTARIF_DER_VERSI', '0', True, vtNORMAL);

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmTARIFListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtcFACTU_ACOMPTEClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmFACTUListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_FACTU_ACOMPTE';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_ID', edtADM_COLLA_ID.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_TRIG',
        edtADM_COLLA_TRIG.Text, False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_NOM', edtADM_COLLA_NOM.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnFACTU_COLLA', '', True, vtNORMAL);
    end;

    // Statut = en cours / attente validation, émis
    ListeEnvoi.AddFiltreDebranch('clbFACTU_ST', '0,1,6', True, vtCHXFG);
    // type = acompte
    ListeEnvoi.AddFiltreDebranch('clbFACTU_TYPFA', '9', True, vtCHXFG);

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers DO de la facture
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmFACTUListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtcTilesItemDeactivateDetail
  (Sender: TdxCustomTileControl; AItem: TdxTileControlItem);
begin
  bDeactive_detail := True;
end;

procedure TfrmTDB_ADMListe.dxtcTilesKeyDown(Sender: TObject; var Key: Word;
  Shift: TShiftState);
begin
  if bADMIN_EXPORT_TUILES then
  begin
    if (ssCtrl in Shift) then
      bCTRL_ENFONCE := True;
  end;
end;

procedure TfrmTDB_ADMListe.dxtcTilesKeyUp(Sender: TObject; var Key: Word;
  Shift: TShiftState);
begin
  if bADMIN_EXPORT_TUILES then
  begin
    if not(ssCtrl in Shift) then
      bCTRL_ENFONCE := False;
  end;
end;

procedure TfrmTDB_ADMListe.dxtcTilesMouseMove(Sender: TObject;
  Shift: TShiftState; X, Y: Integer);
begin
  // Pour corriger le bug devexpress qui fait que les tuiles se "decheckent" lorsqu'on revient de l'affichage du d�tail pour les tuiles avec liens.
  if bDeactive_detail then
  begin
    bDeactive_detail := False;
    Screen.cursor := crHourglass;
    pCheck_Tuiles_Export_Fast;
    Screen.cursor := crDefault;
  end;
end;

/// //////////////////////////////////////
// FAC01211 FPE 02/01/2025  Tuile BL � facturer � ajouter.
procedure TfrmTDB_ADMListe.dxtciBOLIV_A_FACTClick(Sender: TdxTileControlItem);
begin
  if fTransDroit(fTransId('TfrmBOLIVListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_BOLIV';
    ListeEnvoi.Quoi := 'BOLIV';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCOLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOLLA_NOM_PRENOM',
        edtADM_COLLA_NOM.Text + ' ' + edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCOLLA', '', True, vtNORMAL);
    end;

    // Ne prendre que les statuts de BLs � �diter
    // ListeEnvoi.AddFiltreDebranch('chkBoliv_ST', '0,1', True, vtCHXFG); // Statut En cours / Edit�
    ListeEnvoi.AddFiltreDebranch('chkBoliv_ST', '1', True, vtCHXFG);
    // Statut Edit�

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmBOLIVListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;
// fin FAC01211 FPE 02/01/2025  Tuile BL � facturer � ajouter.
/// //////////////////////////////////////

procedure TfrmTDB_ADMListe.dxtciARBBEDemandeClick(Sender: TdxTileControlItem);
begin

  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmImp_POReportListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_ARBBE_Demande';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_ID', edtADM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM', edtADM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_PRENOM',
        edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnADM_COLLA', '', True, vtNORMAL);
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_ID', edtCDM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_PRENOM',
        edtCDM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM_COLLA', '', True, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_ID', edtRZA_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_PRENOM',
        edtRZA_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZA_COLLA', '', True, vtNORMAL);
    end;

    if edtRZC_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_ID', edtRZC_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_TRIG', edtRZC_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_NOM', edtRZC_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_PRENOM',
        edtRZC_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZC_COLLA', '', True, vtNORMAL);
    end;

    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtTIERS_ID', edtTIERS_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_CODE', edtTIERS_CODE.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_RS_L1', edtTIERS_RS_L1.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnTIERS', '', True, vtNORMAL);
    end;

    if edtZOCOM_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnZOCOM', '', True, vtNORMAL);
    end;

    ListeEnvoi.AddFiltreDebranch('chkPO', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkARBBE', '1', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkROLFR', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDMDAP', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDDF_VN', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkDDF_PAR', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkPO_TRANSIT', '0', True, vtNORMAL);
    ListeEnvoi.AddFiltreDebranch('chkPO_CADEN', '0', True, vtNORMAL);

    SetLength(ListeEnvoi.filtre, 1);
    ListeEnvoi.filtre[0] := '';
    if bExport_Excel then
      ListeEnvoi.filtre[0] := sExport_XL_FILENAME;

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmImp_POReportListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;

end;

procedure TfrmTDB_ADMListe.dxtciARBBESuiviClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmARBTR_SuiviListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'TDM_ADM_ARBTR_Suivi';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCOLLA_ID', edtADM_COLLA_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOLLA_NOM', edtADM_COLLA_NOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCOLLA', '', True, vtNORMAL);
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM_COLLA', '', True, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZA_COLLA', '', True, vtNORMAL);
    end;

    // CDE02460 FPE 03/03/2023 FILTRES N42TAINT PAS GERES
    if edtRZC_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_TRIG', edtRZC_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZC_COLLA_NOM', edtRZC_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZC_COLLA', '', True, vtNORMAL);
    end;
    // CDE02460 FPE 03/03/2023 FILTRES N42TAINT PAS GERES
    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtTIERS_CODE', edtTIERS_CODE.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtTIERS_RS_L1', edtTIERS_RS_L1.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnTIERS', '', True, vtNORMAL);
    end;
    // CDE02460 FPE 03/03/2023 FILTRES N42TAINT PAS GERES
    if edtZOCOM_DES.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnZOCOM', '', True, vtNORMAL);
    end;

    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    ListeEnvoi.AddFiltreDebranch('clbARBTR_STATUT', '0', True, vtCHXFG);
    // ListeEnvoi.AddFiltreDebranch('chkVISU_ROLFR_QTE_AARBITRE', '1', True, vtCHXFG);

    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    ListeEnvoi.bLanceRecherche := True;

    if bExport_Excel then
    begin
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME); // ID = 6
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME_BIS); // ID = 7
    end
    else
    begin
      ListeEnvoi.AddFiltre(''); // ID = 6
      ListeEnvoi.AddFiltre(''); // ID = 7
    end;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmARBTR_SuiviListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;

end;

procedure TfrmTDB_ADMListe.dxtciARC_DiscussionClick(Sender: TdxTileControlItem);
var
  APoint: TPoint;
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Abort;
    Exit;
  end;

  APoint := Sender.TileControl.ScreenToClient(Mouse.CursorPos);

  if fTransDroit(fTransId('TfrmCOMMA_V2Liste'), etFVisu) then
  begin
    ListeEnvoi.ID := 'TDB_ADM_COMMA_EN_DISCU';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_COLLA_ID', edtADM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_COLLA_TRIG',
        edtADM_COLLA_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_COLLA_NOM', edtADM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCOMMA_COLLA', '', True, vtNORMAL);
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_ID', edtCDM_COLLA_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_TRIG', edtCDM_COLLA_TRIG.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_NOMPRENOM', edtCDM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM', '', True, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_ID', edtRZA_COLLA_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_TRIG', edtRZA_COLLA_TRIG.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_NOMPRENOM', edtRZA_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZA', '', True, vtNORMAL);
    end;

    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;


    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_DO_TIERS_ID', edtTIERS_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_DO_TIERS_CODE', edtTIERS_CODE.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCOMMA_DO_TIERS_LS_R1',
        edtTIERS_RS_L1.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCOMMA_DO_TIERS', '', True, vtNORMAL);
    end;

    if edtZOCOM_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_ID', edtZOCOM_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_CODE', '', True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnZOCOM', '', True, vtNORMAL);
    end;
    // CDE02590 FPE 21/12/2023 Ajout des commandes en attente de validation � la s�lection de la tuiles des ARC � �mettre
    // ListeEnvoi.AddFiltreDebranch('clbCOMMA_ST', '0,1', True, vtCHXFG);

    SetLength(ListeEnvoi.filtre, 6);
    ListeEnvoi.filtre[0] := edtADM_COLLA_ID.Text;
    ListeEnvoi.filtre[1] := edtCDM_COLLA_ID.Text;
    ListeEnvoi.filtre[2] := edtRZA_COLLA_ID.Text;
    ListeEnvoi.filtre[3] := edtTIERS_ID.Text;
    ListeEnvoi.filtre[4] := edtZOCOM_ID.Text;
    // ListeEnvoi.filtre[5] := 'ADM';
    // ListeEnvoi.filtre[6] := edtCDM_COLLA_ID.Text;


    // ListeEnvoi.AddFiltre(); // ID = 0
    // ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    // ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    // ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    // ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    // ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    // SetLength(ListeEnvoi.filtre, 1);

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    if APoint.X > (Sender.ViewInfo.Bounds.Left + (Sender.ViewInfo.Bounds.right -
      Sender.ViewInfo.Bounds.Left) div 2) then
    begin
      ListeEnvoi.filtre[5] := 'ADM';
      // ListeEnvoi.AddFiltre('ADM'); // ID = 7
    end
    else
    begin
      ListeEnvoi.filtre[5] := 'GDCP';
      // ListeEnvoi.AddFiltre('GDCP'); // ID = 7
    end;

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmCOMMA_V2Liste', Self,
      etLRecherche, ListeEnvoi, True);
  end;

end;

procedure TfrmTDB_ADMListe.edtADM_COLLA_TRIGKeyDown(Sender: TObject;
  var Key: Word; Shift: TShiftState);
begin
  fDebAutoKeyDown(Sender, Key, Shift, True, True, btnADM_COLLA,
    [edtADM_COLLA_ID, edtADM_COLLA_TRIG, edtADM_COLLA_NOM,
    edtADM_COLLA_PRENOM]);
end;

procedure TfrmTDB_ADMListe.edtCDM_COLLA_TRIGKeyDown(Sender: TObject;
  var Key: Word; Shift: TShiftState);
begin
  fDebAutoKeyDown(Sender, Key, Shift, True, True, btnCDM_COLLA,
    [edtCDM_COLLA_ID, edtCDM_COLLA_TRIG, edtCDM_COLLA_NOM,
    edtCDM_COLLA_PRENOM]);
end;

procedure TfrmTDB_ADMListe.edtDirVen_NOM_PRENOMKeyDown(Sender: TObject;
  var Key: Word; Shift: TShiftState);
begin
  //feature/CDE02917 FPE 11/05/2025 D�branchement sur dir vte type Secteur/Head sales
  fDebAutoKeyDown(Sender, Key, Shift, True, True, btnDirVen, [edtDirVen_ID, edtDirVen_TRIG, edtDirVen_NOM_PRENOM]);
end;

procedure TfrmTDB_ADMListe.edtDirVen_TRIGKeyDown(Sender: TObject; var Key: Word;
  Shift: TShiftState);
begin
  //feature/CDE02917 FPE 11/05/2025 D�branchement sur dir vte type Secteur/Head sales
  fDebAutoKeyDown(Sender, Key, Shift, True, True, btnDirVen, [edtDirVen_ID, edtDirVen_TRIG, edtDirVen_NOM_PRENOM]);
end;

procedure TfrmTDB_ADMListe.edtRZA_COLLA_TRIGKeyDown(Sender: TObject;
  var Key: Word; Shift: TShiftState);
begin
  fDebAutoKeyDown(Sender, Key, Shift, True, True, btnRZA_COLLA,
    [edtRZA_COLLA_ID, edtRZA_COLLA_TRIG, edtRZA_COLLA_NOM,
    edtRZA_COLLA_PRENOM]);
end;

procedure TfrmTDB_ADMListe.edtRZC_COLLA_TRIGKeyDown(Sender: TObject;
  var Key: Word; Shift: TShiftState);
begin
  fDebAutoKeyDown(Sender, Key, Shift, True, True, btnRZC_COLLA,
    [edtRZC_COLLA_ID, edtRZC_COLLA_TRIG, edtRZC_COLLA_NOM,
    edtRZC_COLLA_PRENOM]);
end;

procedure TfrmTDB_ADMListe.edtTIERS_CODEKeyDown(Sender: TObject; var Key: Word;
  Shift: TShiftState);
begin
  fDebAutoKeyDown( //
    Sender, //
    Key, //
    Shift, //
    True, //
    True, //
    btnTIERS, //
    [edtTIERS_ID, edtTIERS_CODE, edtTIERS_RS_L1] //
    );
end;

procedure TfrmTDB_ADMListe.edtTIERS_RS_L1KeyDown(Sender: TObject; var Key: Word;
  Shift: TShiftState);
begin
  fDebAutoKeyDown( //
    Sender, //
    Key, //
    Shift, //
    True, //
    True, //
    btnTIERS, //
    [edtTIERS_ID, edtTIERS_CODE, edtTIERS_RS_L1] //
    );
end;

procedure TfrmTDB_ADMListe.edtZOCOM_DESKeyDown(Sender: TObject; var Key: Word;
  Shift: TShiftState);
begin
  fDebAutoKeyDown(Sender, Key, Shift, True, True, btnZOCOM,
    [edtZOCOM_ID, edtZOCOM_DES]);
end;

procedure TfrmTDB_ADMListe.dxtciAVMADListeClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmAVMADListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'TDB_ADM_AVMAD';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_ID', edtADM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM', edtADM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnADM', '', True, vtNORMAL);
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_ID', edtCDM_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM', '', True, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_ID', edtRZA_COLLA_ID.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZA', '', True, vtNORMAL);
    end;

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_ID', edtTIERS_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_CODE', edtTIERS_CODE.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDO_TIERS_LS_R1', edtTIERS_RS_L1.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDO_TIERS', '', True, vtNORMAL);
    end;

    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5
    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmAVMADListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciFACTU_AVOIRClick(Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmFACTUListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_FACTU_AVOIR';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_ID', edtADM_COLLA_ID.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_TRIG',
        edtADM_COLLA_TRIG.Text, False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_NOM', edtADM_COLLA_NOM.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnFACTU_COLLA', '', True, vtNORMAL);
    end;

    // Statut = en cours
    ListeEnvoi.AddFiltreDebranch('clbFACTU_ST', '0', True, vtCHXFG);

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers DO de la facture
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmFACTUListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.dxtciFACTU_AVOIR_CF_PAClick(
  Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;

  if fTransDroit(fTransId('TfrmFACTUListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_FACTU_AVOIR_CF_PA';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_ID', edtADM_COLLA_ID.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_TRIG',
        edtADM_COLLA_TRIG.Text, False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtFACTU_COLLA_NOM', edtADM_COLLA_NOM.Text,
        False, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnFACTU_COLLA', '', True, vtNORMAL);
    end;

    // Statut = émis
    ListeEnvoi.AddFiltreDebranch('clbFACTU_ST', '1', True, vtCHXFG);
    //  type : tout sauf avoirs et pré-paiements
    ListeEnvoi.AddFiltreDebranch('clbFACTU_TYPFA', '1,2,3,9', True, vtCHXFG);
  // statut plateforme : rejetée / en litige / suspendue / refusée
    ListeEnvoi.AddFiltreDebranch('clbFACTU_SPFEL_ST', '1,4,5,2', True, vtCHXFG);

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;

    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers DO de la facture
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmFACTUListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.fOuverture(ptEtat: TEtat);
  function RenseigneChampCOLLAConnecte: Integer;
  // Renseigne le bon filtre selon le role du colla : RZC, CDM, RZA ou ADM (dans cette ordre)
  var
    oQuery: TUniQuery;
  begin
    Result := 0;
    oQuery := TUniQuery.Create(nil);
    try
      if fQueryRQSQL(oQuery, 31752) then
      // Attention RQ utilis�e � plusieurs endroits
      begin
        if _UserHH.IsProfilDistant then
          fQueryDeclareParameterType(oQuery, 'iCOLLA_ID', ftInteger,
            _UserHH.ProfilDistant.ID)
        else
          fQueryDeclareParameterType(oQuery, 'iCOLLA_ID', ftInteger,
            _UserHH.ID);

        fQueryOpen(oQuery);

        if oQuery.RecordCount > 0 then
        begin
          Result := fGetValueI(oQuery, 'COLLA_ROLE');
          case Result of
            1:
              begin // ADM
                edtADM_COLLA_ID.Text := fGetValueS(oQuery, 'COLLA_ID');
                edtADM_COLLA_TRIG.Text := fGetValueS(oQuery, 'COLLA_TRIG');
                edtADM_COLLA_NOM.Text := fGetValueS(oQuery, 'COLLA_NOM');
                edtADM_COLLA_PRENOM.Text := fGetValueS(oQuery, 'COLLA_PRENOM');
              end;
            2:
              begin // RZA
                edtRZA_COLLA_ID.Text := fGetValueS(oQuery, 'COLLA_ID');
                edtRZA_COLLA_TRIG.Text := fGetValueS(oQuery, 'COLLA_TRIG');
                edtRZA_COLLA_NOM.Text := fGetValueS(oQuery, 'COLLA_NOM');
                edtRZA_COLLA_PRENOM.Text := fGetValueS(oQuery, 'COLLA_PRENOM');
              end;
            3:
              begin // CDM
                edtCDM_COLLA_ID.Text := fGetValueS(oQuery, 'COLLA_ID');
                edtCDM_COLLA_TRIG.Text := fGetValueS(oQuery, 'COLLA_TRIG');
                edtCDM_COLLA_NOM.Text := fGetValueS(oQuery, 'COLLA_NOM');
                edtCDM_COLLA_PRENOM.Text := fGetValueS(oQuery, 'COLLA_PRENOM');
              end;
            4:
              begin // RZC
                edtRZC_COLLA_ID.Text := fGetValueS(oQuery, 'COLLA_ID');
                edtRZC_COLLA_TRIG.Text := fGetValueS(oQuery, 'COLLA_TRIG');
                edtRZC_COLLA_NOM.Text := fGetValueS(oQuery, 'COLLA_NOM');
                edtRZC_COLLA_PRENOM.Text := fGetValueS(oQuery, 'COLLA_PRENOM');
              end;
          end;
        end;
      end;
    finally
      FreeAndNil(oQuery);
    end;
  end;

begin
  Etat := ptEtat;
  nTransId := fTransId(Self.ClassName);

  // FAC01211 FPE 23/04/2024 Tuile BL � facturer
  dxtciBOLIV_A_FACT.Visible := True;
  // dxtciBOLIV_A_FACT.visible := (_UserHH.Soc_ID = 18);

  btnADM_COLLA.Tag := fTransId('TfrmCOLLAListe');
  btnCDM_COLLA.Tag := fTransId('TfrmCOLLAListe');
  btnRZA_COLLA.Tag := fTransId('TfrmCOLLAListe');
  btnRZC_COLLA.Tag := fTransId('TfrmCOLLAListe');

  btnTIERS.Tag := fTransId('TfrmTIERSListe');
  btnZOCOM.Tag := fTransId('TfrmZOCOMListe');
  //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
  btnDirVen.Tag := fTransId('TfrmDIRVTListe');

  btnExportExcel.Tag := fTransId('btnExportExcel_TDB_ADV'); // CDE02589

  // STK01299 FPE Relance stocks dormants
  fORASeqGEN_XXXXX_ID('TMP_POREPORT_DATA_LIGHT', iTMP_ID);

  Application.ProcessMessages;

{$IFNDEF __ORA__}
  ShowWaitScreen;
{$ENDIF}
  // TPOReportClass.pDATA_PO_LIGHT(iTMP_ID);

  if _UserHH.IsProfilDistant then
    bADMIN_EXPORT_TUILES := fGET_ADMIN_EXPORT_TUILES(_UserHH.ProfilDistant.Trig)
    // CDE02589
  else
    bADMIN_EXPORT_TUILES := fGET_ADMIN_EXPORT_TUILES(_UserHH.Trig); // CDE02589

  // Au cas o� L'administrateur des tuiles � exporter n'aurait pas le droit d'exporter => on force.
  if bADMIN_EXPORT_TUILES and (btnExportExcel.Tag < 1) then
    btnExportExcel.Tag := 1;

  // fin STK01299 FPE Relance stocks dormants
  fGestionEtats;

  if RenseigneChampCOLLAConnecte > 0 then
    fRecherche;

  if btnExportExcel.Tag > 0 then
    pCheck_Tuiles_Export;

  activecontrol := dxtcTiles;

end;

procedure TfrmTDB_ADMListe.btnQuitterClick(Sender: TObject);
begin
  if dmdConnect.bInMacro then
  begin
    while bInRecherche do
      Application.ProcessMessages
  end;

  Close;
end;

procedure TfrmTDB_ADMListe.btnADM_COLLAClick(Sender: TObject);
begin
  ListeEnvoi.ID := 'COLLA_ADM';
  ListeEnvoi.Quoi := 'ID/TRIG/PRENOM/NOM';

  fInitListeEnvoi(ListeEnvoi);

  ListeEnvoi.AddFiltreDebranch('edtCOLLA_TRIG', edtADM_COLLA_TRIG.Text, False,
    vtNORMAL);
  ListeEnvoi.AddFiltreDebranch('edtCOLLA_NOM', edtADM_COLLA_NOM.Text, False,
    vtNORMAL);
  ListeEnvoi.AddFiltreDebranch('edtCOLLA_PRENOM', edtADM_COLLA_PRENOM.Text,
    False, vtNORMAL);

  ListeEnvoi.AddFiltreDebranch('cbxCOLLA_ADM', '1', False, vtCHXFG);

  ListeEnvoi.bLanceRecherche := True;

  frmMain.oGestionAffichageEcran.fAfficheListe('TfrmCOLLAListe', Self,
    etLDebranch, ListeEnvoi);
end;

procedure TfrmTDB_ADMListe.btnCDM_COLLAClick(Sender: TObject);
begin
  ListeEnvoi.ID := 'COLLA_CDM';
  ListeEnvoi.Quoi := 'ID/TRIG/PRENOM/NOM';

  fInitListeEnvoi(ListeEnvoi);

  ListeEnvoi.AddFiltreDebranch('edtCOLLA_TRIG', edtCDM_COLLA_TRIG.Text, False,
    vtNORMAL);
  ListeEnvoi.AddFiltreDebranch('edtCOLLA_NOM', edtCDM_COLLA_NOM.Text, False,
    vtNORMAL);
  ListeEnvoi.AddFiltreDebranch('edtCOLLA_PRENOM', edtCDM_COLLA_PRENOM.Text,
    False, vtNORMAL);

  ListeEnvoi.AddFiltreDebranch('cbxCOLLA_CDM', '1', False, vtCHXFG);

  ListeEnvoi.bLanceRecherche := True;

  frmMain.oGestionAffichageEcran.fAfficheListe('TfrmCOLLAListe', Self,
    etLDebranch, ListeEnvoi);
end;

procedure TfrmTDB_ADMListe.btnDDF_Echant_RECClick(Sender: TObject);
begin
  try
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    if fQueryRQSQL(qryDDF_ECHANT, 46748) then  //rq 46748 et old 31854
    begin // Old = 30602, 29648, 27736
      fAjoutFiltre(qryDDF_ECHANT);
      fQueryOpenNoLimit(qryDDF_ECHANT);

      DDF_ECHANTManagerButtonsState;
    end;

  except
    raise;
  end;
end;

procedure TfrmTDB_ADMListe.btnDirVenClick(Sender: TObject);
begin
    //feature/CDE02917 FPE 30/04/2025 D�branchement sur dir vte type Secteur/Head sales
  ListeEnvoi.Id := 'TDB_ADM_DIR_VEN_SECTEUR_HEAD_SALES';
  ListeEnvoi.Quoi := 'ID/TRIG/NOM_PRENOM';

  fInitListeEnvoi(ListeEnvoi);

  SetLength(ListeEnvoi.aFiltreDebrch, 3);

  ListeEnvoi.aFiltreDebrch[0].NomComposant    := 'edtCOLLA_TRIG';
  ListeEnvoi.aFiltreDebrch[0].ValeurComposant := edtDirVen_TRIG.Text;
  ListeEnvoi.aFiltreDebrch[1].NomComposant    := 'edtCOLLA_NOMPRENOM';
  ListeEnvoi.aFiltreDebrch[1].ValeurComposant := edtDirVen_NOM_PRENOM.Text;
  ListeEnvoi.aFiltreDebrch[2].NomComposant    := 'cddDIRVT_TYP';
  ListeEnvoi.aFiltreDebrch[2].ValeurComposant := '0';

  ListeEnvoi.bLanceRecherche := True;

  frmMain.oGestionAffichageEcran.fAfficheListe('TfrmDIRVTListe', Self, etLDebranch, ListeEnvoi);
  //Fin feature/CDE02892 FPE 30/04/2025 D�branchement sur dir vte type Secteur/Head sales

end;

procedure TfrmTDB_ADMListe.btnDMBATType1Click(Sender: TObject);
begin
  try
    //feature/CDE02917 FPE 11/05/2025 D�branchement sur dir vte type Secteur/Head sales
    if fQueryRQSQL(qryDMBAT_TYPE1, 46750) then  //rq = 46750 et old = 31856
    begin // old 32017
      fAjoutFiltre(qryDMBAT_TYPE1);
      fQueryOpenNoLimit(qryDMBAT_TYPE1);

      DMBAT_TYPE1ManagerButtonsState;
    end;

  except
    raise;
  end;
end;

procedure TfrmTDB_ADMListe.btnDMBAType0Click(Sender: TObject);
begin
  try
    //feature/CDE02917 FPE 11/05/2025 D�branchement sur dir vte type Secteur/Head sales
    if fQueryRQSQL(qryDMBAT_TYPE0,46755 ) then  //RQ = 46755 et old = 31855
    begin // Old = 30603, 29649, 28728;, 27738
      fAjoutFiltre(qryDMBAT_TYPE0);
      fQueryOpenNoLimit(qryDMBAT_TYPE0);

      DMBAT_TYPE0ManagerButtonsState;
    end;

  except
    raise;
  end;
end;

procedure TfrmTDB_ADMListe.btnExportExcelClick(Sender: TObject);
var
  i, Nbre_a_traiter: Integer;
  sExport_XL_FILENAME_Final: string;
  sNom_First: string;
  bExport_ok: Boolean;
  bTitre_onglet, bTitre_onglet_bis: string;
begin
  if fMessageErreur(fGetMessage(MessageContext, 'Conf_export_TDB'), 1, 2) then
  begin
    var CanExit := btnQuitter.Enabled;
    btnQuitter.Enabled := False;
    try
    Screen.cursor := crHourglass;
    i := 0;
    Nbre_a_traiter := 0;
    while i < dxtcTiles.items.count do
    begin
      if (dxtcTiles.items[i].Visible) and (dxtcTiles.items[i].checked) then
        Nbre_a_traiter := Nbre_a_traiter + 1;
      i := i + 1;
    end;
    Export_ProgressBar.Max := Nbre_a_traiter;
    Export_ProgressBar.position := 0;
    Export_ProgressBar.Visible := True;
    Application.ProcessMessages;

    bCTRL_ENFONCE := False;
    bExport_Excel := True;
    i := 0;
    sExport_XL_FILENAME := '';
    sExport_XL_FILENAME_Final := GetApplicationTempDir + 'TDB_EXPORT' + '_' +
      FormatDateTime('yyyymmddhhnnsszzzz', Now) + '.xlsx';
    bExport_ok := False;
    while i < dxtcTiles.items.count do
    begin
      if (dxtcTiles.items[i].Visible) and (dxtcTiles.items[i].checked) then
      begin
        bExport_ok := True;
        if sExport_XL_FILENAME = '' then
        begin
          sExport_XL_FILENAME := sExport_XL_FILENAME_Final;
          sNom_First := dxtcTiles.items[i].Text1.Value;
        end
        else
          sExport_XL_FILENAME := GetApplicationTempDir + 'TDB_EXPORT.xlsx';
        if fileexists(sExport_XL_FILENAME) then
          deletefile(sExport_XL_FILENAME);

        bTitre_onglet := dxtcTiles.items[i].Text1.Value;

        sExport_XL_FILENAME_BIS := '';
        if dxtcTiles.items[i].name = 'dxtciARBBESuivi' then
        // CAS particulier ou 2 exports pour une grille
        begin
          sExport_XL_FILENAME_BIS := GetApplicationTempDir +
            'TDB_EXPORT_BIS.xlsx';
          bTitre_onglet := 'Arbitrage des besoins';
          bTitre_onglet_bis := 'Arbitrage des DDF';
        end;

        if dxtcTiles.items[i].DetailOptions.DetailControl <> nil then
          pExport_Tuile(dxtcTiles.items[i])
        else
          dxtcTiles.items[i].Click;

        pConcat_Excel_files(sExport_XL_FILENAME_Final, sExport_XL_FILENAME,
          sNom_First, bTitre_onglet);

        if sExport_XL_FILENAME_BIS <> '' then
          pConcat_Excel_files(sExport_XL_FILENAME_Final,
            sExport_XL_FILENAME_BIS, sNom_First, bTitre_onglet_bis);

        Export_ProgressBar.position := Export_ProgressBar.position + 1;
        Screen.cursor := crHourglass;
        Application.ProcessMessages;

      end;
      i := i + 1;
    end;
    Screen.cursor := crDefault;
    Export_ProgressBar.Visible := False;
    bExport_Excel := False;
    if bExport_ok then
    begin

      fMessageErreur(fGetMessage(MessageContext, 'Fin_export_TDB'), 1, 1);
      // ouverture du fichier excel
      ShellExecute(0, 'Open', pchar(sExport_XL_FILENAME_Final), nil, nil,
                   SW_NORMAL);
    end
    else
      fMessageErreur(fGetMessage(MessageContext, 'Export_TDB_KO'), 1, 1);
    finally
      btnQuitter.Enabled := CanExit;
    end;

  end;

end;

procedure TfrmTDB_ADMListe.btnOffreARelancer_RECClick(Sender: TObject);
begin
  try
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    if fQueryRQSQL(qryOFFRE_A_RELANCER, 46757 ) then // rq = 46757 et Old = 45480 45176,43864,36562,35128, 31801, 30596, 30079
    begin // rq = 43864 et Old = 36562,35128, 31801, 30596, 30079
      fAjoutFiltre(qryOFFRE_A_RELANCER);
      qryOFFRE_A_RELANCER.SQL.Add('ORDER BY  OFFRE.OFFRE_DATE_RELANCE ASC');
      fQueryOpenNoLimit(qryOFFRE_A_RELANCER);

      OFFRE_A_RELANCERManagerButtonsState;
    end;

  except
    raise;
  end;
end;

procedure TfrmTDB_ADMListe.btnOffreSt0_RECClick(Sender: TObject);
begin
  try
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    if fQueryRQSQL(qryOFFRE_ST_0, 46758) then // Old = 36560,31800, 30595, 30119
    begin
      fAjoutFiltre(qryOFFRE_ST_0);
      fQueryOpenNoLimit(qryOFFRE_ST_0);

      OFFRE_ST_0ManagerButtonsState;
    end;

  except
    raise;
  end;
end;

procedure TfrmTDB_ADMListe.pConcat_Excel_files(sFichier_1: string;
  sFichier_2: string; sNom_tuile_First: string; sNom_tuile: string);
var
  ASheet1, ASheet2: TdxSpreadSheet;
  AStream: TMemoryStream;
  ATable: TdxSpreadSheetTableView;
  // ATable_bis : TdxSpreadSheetTableView;
  // i : integer;
  // snomsheet : string;
begin
  //
  ASheet1 := TdxSpreadSheet.Create(Self);
  ASheet2 := TdxSpreadSheet.Create(Self);
  AStream := TMemoryStream.Create;
  try
    { ASheet1.LoadFromFile(sFichier_1);  // on charge le 1er
      i:= 0;
      while i < ASheet1.sheetcount do
      begin
      ASheet1.ActiveSheetIndex  := i;
      ATable_bis := (ASheet1.Sheets[i]) as TdxSpreadSheetTableView;
      snomsheet := ATable_bis.caption;

      ASheet1.ActiveSheetAsTable.CopyCellDataToStream(ASheet1.ActiveSheetAsTable.Dimensions, AStream);  // on copy le premier dans streem
      AStream.Position := 0;
      if i = 0 then
      ASheet2.ActiveSheetAsTable.PasteCellDataFromStream(Point(0, 0), AStream) // on colle le stream dans sheet 2
      else
      begin
      ATable := ASheet2.AddSheet(snomsheet, TdxSpreadSheetTableView) as TdxSpreadSheetTableView;  // on ajout un sheet dans sheet2
      AStream.Position := 0;
      ATable.PasteCellDataFromStream(Point(0, 0), AStream); //on copie le stream ds
      end;
      i := i+ 1;
      end;
      ASheet1.LoadFromFile(sFichier_2); // on charge le 2eme
      AStream.Position := 0;
      ASheet1.ActiveSheetAsTable.CopyCellDataToStream(ASheet1.ActiveSheetAsTable.Dimensions, AStream); //on copie le 2 eme ds stream

      ATable := ASheet2.AddSheet(sNom_tuile, TdxSpreadSheetTableView) as TdxSpreadSheetTableView;  // on ajout un sheet dans sheet2
      AStream.Position := 0;
      ATable.PasteCellDataFromStream(Point(0, 0), AStream); //on copie le stream ds

      ATable := (ASheet2.Sheets[0]) as TdxSpreadSheetTableView;
      ATable.Caption:= sNom_tuile_First;

      if fileexists(sFichier_1) then
      deletefile(sFichier_1);
      ASheet2.SaveToFile(sFichier_1); }

    ASheet1.LoadFromFile(sFichier_1);
    if sFichier_1 = sFichier_2 then
    // premier passage on renome juste le premier onglet avec le nom de la tuile
    begin
      ATable := (ASheet1.Sheets[0]) as TdxSpreadSheetTableView;
      ATable.Caption := sNom_tuile_First;

    end
    else
    begin
      // passages suivants on merge les fichiers excel

      ASheet2.LoadFromFile(sFichier_2);
      AStream.position := 0;
      ASheet2.ActiveSheetAsTable.CopyCellDataToStream
        (ASheet2.ActiveSheetAsTable.Dimensions, AStream);

      ATable := ASheet1.AddSheet(sNom_tuile, TdxSpreadSheetTableView)
        as TdxSpreadSheetTableView;
      AStream.position := 0;
      ATable.PasteCellDataFromStream(Point(0, 0), AStream);
    end;
    if fileexists(sFichier_1) then
      deletefile(sFichier_1);
    ASheet1.SaveToFile(sFichier_1);

  finally
    AStream.Free;
    ASheet1.Free;
    ASheet2.Free;
  end;

end;

procedure TfrmTDB_ADMListe.btnRechercheClick(Sender: TObject);
begin
  fRecherche;
end;

procedure TfrmTDB_ADMListe.btnRZA_COLLAClick(Sender: TObject);
begin
  ListeEnvoi.ID := 'COLLA_RZA';
  ListeEnvoi.Quoi := 'ID/TRIG/PRENOM/NOM';

  fInitListeEnvoi(ListeEnvoi);

  ListeEnvoi.AddFiltreDebranch('edtCOLLA_TRIG', edtRZA_COLLA_TRIG.Text, False,
    vtNORMAL);
  ListeEnvoi.AddFiltreDebranch('edtCOLLA_NOM', edtRZA_COLLA_NOM.Text, False,
    vtNORMAL);
  ListeEnvoi.AddFiltreDebranch('edtCOLLA_PRENOM', edtRZA_COLLA_PRENOM.Text,
    False, vtNORMAL);

  ListeEnvoi.AddFiltreDebranch('cbxCOLLA_RZA', '1', False, vtCHXFG);

  ListeEnvoi.bLanceRecherche := True;

  frmMain.oGestionAffichageEcran.fAfficheListe('TfrmCOLLAListe', Self,
    etLDebranch, ListeEnvoi);
end;

procedure TfrmTDB_ADMListe.btnRZC_COLLAClick(Sender: TObject);
begin
  ListeEnvoi.ID := 'COLLA_RZC';
  ListeEnvoi.Quoi := 'ID/TRIG/PRENOM/NOM';

  fInitListeEnvoi(ListeEnvoi);

  ListeEnvoi.AddFiltreDebranch('edtCOLLA_TRIG', edtRZC_COLLA_TRIG.Text, False,
    vtNORMAL);
  ListeEnvoi.AddFiltreDebranch('edtCOLLA_NOM', edtRZC_COLLA_NOM.Text, False,
    vtNORMAL);
  ListeEnvoi.AddFiltreDebranch('edtCOLLA_PRENOM', edtRZC_COLLA_PRENOM.Text,
    False, vtNORMAL);

  ListeEnvoi.AddFiltreDebranch('cbxCOLLA_RZC', '1', False, vtCHXFG);

  ListeEnvoi.bLanceRecherche := True;

  frmMain.oGestionAffichageEcran.fAfficheListe('TfrmCOLLAListe', Self,
    etLDebranch, ListeEnvoi);
end;

procedure TfrmTDB_ADMListe.btnTarif_Anomalie_RECClick(Sender: TObject);
begin
  try
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    if fQueryRQSQL(qryTARIFListe, 46759) then // rq = old 46175,41412
    begin
      fAjoutFiltre(qryTARIFListe);
      fQueryOpenNoLimit(qryTARIFListe);

      Tarif_AnomalieManagerButtonsState;
    end;

  except
    raise;
  end;
end;

procedure TfrmTDB_ADMListe.btnTIERSClick(Sender: TObject);
begin
  ListeEnvoi.ID := 'TIERS';
  ListeEnvoi.Quoi := 'ID/CODE/RS_L1/LANGU';
  fInitListeEnvoi(ListeEnvoi);

  SetLength(ListeEnvoi.aFiltreDebrch, 3);

  ListeEnvoi.AddFiltreDebranch('edtTIERS_CODE', edtTIERS_CODE.Text, False,
    TValeurComposantType.vtNORMAL);
  ListeEnvoi.AddFiltreDebranch('edtTIERS_RS_L1', edtTIERS_RS_L1.Text, False,
    TValeurComposantType.vtNORMAL);
  ListeEnvoi.AddFiltreDebranch('cbxDO', '1', False,
    TValeurComposantType.vtCHXFG);

  ListeEnvoi.bLanceRecherche := True;

  frmMain.oGestionAffichageEcran.fAfficheListe('TfrmTIERSListe', Self,
    etLDebranch, ListeEnvoi, True);
end;

procedure TfrmTDB_ADMListe.btnVisCDACGClick(Sender: TObject);
var
  sCDACG_ID: string;
begin
  sCDACG_ID := EmptyStr;

  if Assigned(cxgtvPCDAG_A_TRAITER.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPCDAG_A_TRAITER.Controller.FocusedRecord.Values
      [cxgtvPCDAG_A_TRAITERCDACG_ID.Index]) then
      sCDACG_ID := cxgtvPCDAG_A_TRAITER.Controller.FocusedRecord.Values
        [cxgtvPCDAG_A_TRAITERCDACG_ID.Index];
  end;

  if sCDACG_ID <> EmptyStr then
    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmCDACGFiche', Self,
      sCDACG_ID, etFVisu);
end;

procedure TfrmTDB_ADMListe.btnVisCDCFO1Click(Sender: TObject);
var
  sCDCFO_ID: string;
begin
  sCDCFO_ID := EmptyStr;

  if Assigned(cxgtvDMBAT_TYPE0.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvDMBAT_TYPE0.Controller.FocusedRecord.Values
      [cxgtvDMBAT_TYPE0CDCFO_ID.Index]) then
      sCDCFO_ID := cxgtvDMBAT_TYPE0.Controller.FocusedRecord.Values
        [cxgtvDMBAT_TYPE0CDCFO_ID.Index];
  end;

  if sCDCFO_ID <> EmptyStr then
  begin
    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmCDCFOFiche', Self,
      sCDCFO_ID, etFVisu);
  end;
end;

procedure TfrmTDB_ADMListe.btnVisCDCFO2Click(Sender: TObject);
var
  sCDCFO_ID: string;
begin
  sCDCFO_ID := EmptyStr;

  if Assigned(cxgtvDMBAT_TYPE1.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvDMBAT_TYPE1.Controller.FocusedRecord.Values
      [cxgtvDMBAT_TYPE1CDCFO_ID.Index]) then
      sCDCFO_ID := cxgtvDMBAT_TYPE1.Controller.FocusedRecord.Values
        [cxgtvDMBAT_TYPE1CDCFO_ID.Index];
  end;

  if sCDCFO_ID <> EmptyStr then
  begin
    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmCDCFOFiche', Self,
      sCDCFO_ID, etFVisu);
  end;
end;

procedure TfrmTDB_ADMListe.btnVisCOMMA2Click(Sender: TObject);
var
  sCOMMA_ID: string;
begin
  sCOMMA_ID := EmptyStr;

  if Assigned(cxgtvPPECHProdRetard.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPPECHProdRetard.Controller.FocusedRecord.Values[cxgtvPPECHProdRetardCOMMA_ID.Index]) then
      sCOMMA_ID := cxgtvPPECHProdRetard.Controller.FocusedRecord.Values[cxgtvPPECHProdRetardCOMMA_ID.Index];
  end;

  if sCOMMA_ID <> EmptyStr then
    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmCOMMA_V3Fiche', Self, sCOMMA_ID, etFVisu);
end;

procedure TfrmTDB_ADMListe.btnVisCOMMA3Click(Sender: TObject);
var
  sCOMMA_ID: string;
begin
  sCOMMA_ID := EmptyStr;

  if Assigned(cxgtvPPECHASolder.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPPECHASolder.Controller.FocusedRecord.Values
      [cxgtvPPECHASolderCOMMA_ID.Index]) then
      sCOMMA_ID := cxgtvPPECHASolder.Controller.FocusedRecord.Values
        [cxgtvPPECHASolderCOMMA_ID.Index];
  end;

  if sCOMMA_ID <> EmptyStr then
    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmCOMMA_V3Fiche', Self,
      sCOMMA_ID, etFVisu);
end;

procedure TfrmTDB_ADMListe.btnVisCOMMA5Click(Sender: TObject);
var
  sCOMMA_ID: string;
begin
   sCOMMA_ID := EmptyStr;

  if Assigned(cxgtvPPECHAFader.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPPECHAFader.Controller.FocusedRecord.Values[cxgtvPPECHAFaderCOMMA_ID.Index]) then
      sCOMMA_ID := cxgtvPPECHAFader.Controller.FocusedRecord.Values[cxgtvPPECHAFaderCOMMA_ID.Index];
  end;

  if sCOMMA_ID <> EmptyStr then
    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmCOMMA_V3Fiche', Self, sCOMMA_ID, etFVisu);
end;



procedure TfrmTDB_ADMListe.btnVisCOMMA6Click(Sender: TObject);
var
  sCOMMA_ID: string;
begin
  sCOMMA_ID := EmptyStr;

  if Assigned(cxgtvPOCDE_DECOR.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPOCDE_DECOR.Controller.FocusedRecord.Values
      [cxgtvPOCDE_DECORCOMMA_ID.Index]) then
      sCOMMA_ID := cxgtvPOCDE_DECOR.Controller.FocusedRecord.Values
        [cxgtvPOCDE_DECORCOMMA_ID.Index];
  end;

  if sCOMMA_ID <> EmptyStr then
    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmCOMMA_V3Fiche', Self,
      sCOMMA_ID, etFVisu);
end;

procedure TfrmTDB_ADMListe.btnVisDDF_ECHANT_DMFABClick(Sender: TObject);
var
  sORFAB_ID: string;
begin
  sORFAB_ID := EmptyStr;

  if Assigned(cxgtvDDF_ECHANT.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvDDF_ECHANT.Controller.FocusedRecord.Values
      [cxgtvDDF_ECHANTORFAB_ID.Index]) then
      sORFAB_ID := cxgtvDDF_ECHANT.Controller.FocusedRecord.Values
        [cxgtvDDF_ECHANTORFAB_ID.Index];
  end;

  if sORFAB_ID <> EmptyStr then
  begin
    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmORFVN_DMDFiche', Self,
      sORFAB_ID, etFVisu);
  end;
end;

procedure TfrmTDB_ADMListe.btnVisDMBAT1Click(Sender: TObject);
var
  sCDCFO_ID, sDMBAT_ID, sDMBAT_TYPE: string;
begin
  sCDCFO_ID := EmptyStr;
  sDMBAT_ID := EmptyStr;
  sDMBAT_TYPE := EmptyStr;

  if Assigned(cxgtvDMBAT_TYPE0.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvDMBAT_TYPE0.Controller.FocusedRecord.Values
      [cxgtvDMBAT_TYPE0CDCFO_ID.Index]) then
      sCDCFO_ID := cxgtvDMBAT_TYPE0.Controller.FocusedRecord.Values
        [cxgtvDMBAT_TYPE0CDCFO_ID.Index];
    if not VarIsNull(cxgtvDMBAT_TYPE0.Controller.FocusedRecord.Values
      [cxgtvDMBAT_TYPE0DMBAT_ID.Index]) then
      sDMBAT_ID := cxgtvDMBAT_TYPE0.Controller.FocusedRecord.Values
        [cxgtvDMBAT_TYPE0DMBAT_ID.Index];
    if not VarIsNull(cxgtvDMBAT_TYPE0.Controller.FocusedRecord.Values
      [cxgtvDMBAT_TYPE0DMBAT_TYPE.Index]) then
      sDMBAT_TYPE := cxgtvDMBAT_TYPE0.Controller.FocusedRecord.Values
        [cxgtvDMBAT_TYPE0DMBAT_TYPE.Index];
  end;

  if sDMBAT_ID <> EmptyStr then
  begin
    ListeEnvoi.ID := 'Onglet_CDCFO_DMBAT';

    SetLength(ListeEnvoi.DataS, 2);
    ListeEnvoi.DataS[0] := sCDCFO_ID;
    ListeEnvoi.DataS[1] := sDMBAT_TYPE;

    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmDMBATFiche', Self,
      sDMBAT_ID, etFVisu, ListeEnvoi);
  end;
end;

procedure TfrmTDB_ADMListe.btnVisDMBAT2Click(Sender: TObject);
var
  sCDCFO_ID, sDMBAT_ID, sDMBAT_TYPE: string;
begin
  sCDCFO_ID := EmptyStr;
  sDMBAT_ID := EmptyStr;
  sDMBAT_TYPE := EmptyStr;

  if Assigned(cxgtvDMBAT_TYPE1.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvDMBAT_TYPE1.Controller.FocusedRecord.Values
      [cxgtvDMBAT_TYPE1CDCFO_ID.Index]) then
      sCDCFO_ID := cxgtvDMBAT_TYPE1.Controller.FocusedRecord.Values
        [cxgtvDMBAT_TYPE1CDCFO_ID.Index];
    if not VarIsNull(cxgtvDMBAT_TYPE1.Controller.FocusedRecord.Values
      [cxgtvDMBAT_TYPE1DMBAT_ID.Index]) then
      sDMBAT_ID := cxgtvDMBAT_TYPE1.Controller.FocusedRecord.Values
        [cxgtvDMBAT_TYPE1DMBAT_ID.Index];
    if not VarIsNull(cxgtvDMBAT_TYPE1.Controller.FocusedRecord.Values
      [cxgtvDMBAT_TYPE1DMBAT_TYPE.Index]) then
      sDMBAT_TYPE := cxgtvDMBAT_TYPE1.Controller.FocusedRecord.Values
        [cxgtvDMBAT_TYPE1DMBAT_TYPE.Index];
  end;

  if sDMBAT_ID <> EmptyStr then
  begin
    ListeEnvoi.ID := 'Onglet_CDCFO_DMBAT';

    SetLength(ListeEnvoi.DataS, 2);
    ListeEnvoi.DataS[0] := sCDCFO_ID;
    ListeEnvoi.DataS[1] := sDMBAT_TYPE;

    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmDMBATFiche', Self,
      sDMBAT_ID, etFVisu, ListeEnvoi);
  end;
end;

procedure TfrmTDB_ADMListe.btnVisOFFRE_A_RELANCERClick(Sender: TObject);
var
  iOFFRE_ID, iOFFRE_TYP: Variant;
begin
  iOFFRE_ID := Null;
  iOFFRE_TYP := Null;

  if (cxgtvOFFRE_A_RELANCER.Controller.SelectedRowCount > 0) then
  begin
    iOFFRE_ID := cxgtvOFFRE_A_RELANCER.Controller.SelectedRows[0].Values
      [cxgtvOFFRE_A_RELANCEROFFRE_ID.Index];
    iOFFRE_TYP := cxgtvOFFRE_A_RELANCER.Controller.SelectedRows[0].Values
      [cxgtvOFFRE_A_RELANCEROFFRE_TYP.Index];
  end;

  if not VarIsNull(iOFFRE_ID) and not VarIsNull(iOFFRE_TYP) then
  begin
    case iOFFRE_TYP of
      0:
        frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmOFFREFiche', Self,
          iOFFRE_ID, etFVisu);
      1:
        frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmOFSIMFiche', Self,
          iOFFRE_ID, etFVisu);
      2:
        frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmOFFPRFiche', Self,
          iOFFRE_ID, etFVisu);
    end;
  end;
end;

procedure TfrmTDB_ADMListe.btnVisOFFRE_ST_0Click(Sender: TObject);
var
  iOFFRE_ID, iOFFRE_TYP: Variant;
begin
  iOFFRE_ID := Null;
  iOFFRE_TYP := Null;

  if (cxgtvOFFRE_ST_0.Controller.SelectedRowCount > 0) then
  begin
    iOFFRE_ID := cxgtvOFFRE_ST_0.Controller.SelectedRows[0].Values
      [cxgtvOFFRE_ST_0OFFRE_ID.Index];
    iOFFRE_TYP := cxgtvOFFRE_ST_0.Controller.SelectedRows[0].Values
      [cxgtvOFFRE_ST_0OFFRE_TYP.Index];
  end;

  if not VarIsNull(iOFFRE_ID) and not VarIsNull(iOFFRE_TYP) then
  begin
    case iOFFRE_TYP of
      0:
        frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmOFFREFiche', Self,
          iOFFRE_ID, etFVisu);
      1:
        frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmOFSIMFiche', Self,
          iOFFRE_ID, etFVisu);
      2:
        frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmOFFPRFiche', Self,
          iOFFRE_ID, etFVisu);
    end;
  end;
end;

procedure TfrmTDB_ADMListe.btnVisPCDAGClick(Sender: TObject);
var
  sPCDAG_ID: string;
begin
  sPCDAG_ID := EmptyStr;

  if Assigned(cxgtvPCDAG_A_TRAITER.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPCDAG_A_TRAITER.Controller.FocusedRecord.Values
      [cxgtvPCDAG_A_TRAITERPCDAG_ID.Index]) then
      sPCDAG_ID := cxgtvPCDAG_A_TRAITER.Controller.FocusedRecord.Values
        [cxgtvPCDAG_A_TRAITERPCDAG_ID.Index];
  end;

  if sPCDAG_ID <> EmptyStr then
    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmPCDAGFiche', Self,
      sPCDAG_ID, etFVisu);
end;

procedure TfrmTDB_ADMListe.btnVisPOCDE2Click(Sender: TObject);
var
  sPOCDE_ID: string;
begin
  sPOCDE_ID := EmptyStr;

  if Assigned(cxgtvPPECHProdRetard.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPPECHProdRetard.Controller.FocusedRecord.Values
      [cxgtvPPECHProdRetardPOCDE_ID.Index]) then
      sPOCDE_ID := cxgtvPPECHProdRetard.Controller.FocusedRecord.Values
        [cxgtvPPECHProdRetardPOCDE_ID.Index];
  end;

  pVisPOCDE(sPOCDE_ID);
end;

procedure TfrmTDB_ADMListe.btnVisPOCDE3Click(Sender: TObject);
var
  sPOCDE_ID: string;
begin
  sPOCDE_ID := EmptyStr;

  if Assigned(cxgtvPPECHASolder.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPPECHASolder.Controller.FocusedRecord.Values
      [cxgtvPPECHASolderPOCDE_ID.Index]) then
      sPOCDE_ID := cxgtvPPECHASolder.Controller.FocusedRecord.Values
        [cxgtvPPECHASolderPOCDE_ID.Index];
  end;

  pVisPOCDE(sPOCDE_ID);
end;

procedure TfrmTDB_ADMListe.btnVisPOCDE5Click(Sender: TObject);
var
  sPOCDE_ID: string;
begin
  sPOCDE_ID := EmptyStr;

  if Assigned(cxgtvPPECHAFader.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPPECHAFader.Controller.FocusedRecord.Values
      [cxgtvPPECHAFaderPOCDE_ID.Index]) then
      sPOCDE_ID := cxgtvPPECHAFader.Controller.FocusedRecord.Values
        [cxgtvPPECHAFaderPOCDE_ID.Index];
  end;

  pVisPOCDE(sPOCDE_ID);
end;

procedure TfrmTDB_ADMListe.btnVisPOCDE6Click(Sender: TObject);
var
  sPOCDE_ID: string;
begin
  sPOCDE_ID := EmptyStr;

  if Assigned(cxgtvPOCDE_DECOR.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPOCDE_DECOR.Controller.FocusedRecord.Values
      [cxgtvPOCDE_DECORPOCDE_ID.Index]) then
      sPOCDE_ID := cxgtvPOCDE_DECOR.Controller.FocusedRecord.Values
        [cxgtvPOCDE_DECORPOCDE_ID.Index];
  end;

  pVisPOCDE(sPOCDE_ID);
end;

procedure TfrmTDB_ADMListe.btnVisPPECH2Click(Sender: TObject);
var
  sPOCDE_ID: string;
begin
  sPOCDE_ID := EmptyStr;

  if Assigned(cxgtvPPECHProdRetard.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPPECHProdRetard.Controller.FocusedRecord.Values
      [cxgtvPPECHProdRetardPOCDE_ID.Index]) then
      sPOCDE_ID := cxgtvPPECHProdRetard.Controller.FocusedRecord.Values
        [cxgtvPPECHProdRetardPOCDE_ID.Index];
  end;

  pVisPPECH(sPOCDE_ID);
end;

procedure TfrmTDB_ADMListe.btnVisPPECH3Click(Sender: TObject);
var
  sPOCDE_ID: string;
begin
  sPOCDE_ID := EmptyStr;

  if Assigned(cxgtvPPECHASolder.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPPECHASolder.Controller.FocusedRecord.Values
      [cxgtvPPECHASolderPOCDE_ID.Index]) then
      sPOCDE_ID := cxgtvPPECHASolder.Controller.FocusedRecord.Values
        [cxgtvPPECHASolderPOCDE_ID.Index];
  end;

  pVisPPECH(sPOCDE_ID);
end;

procedure TfrmTDB_ADMListe.btnVisPPECH5Click(Sender: TObject);
var
  sPOCDE_ID: string;
begin
  sPOCDE_ID := EmptyStr;

  if Assigned(cxgtvPPECHAFader.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPPECHAFader.Controller.FocusedRecord.Values
      [cxgtvPPECHAFaderPOCDE_ID.Index]) then
      sPOCDE_ID := cxgtvPPECHAFader.Controller.FocusedRecord.Values
        [cxgtvPPECHAFaderPOCDE_ID.Index];
  end;

  pVisPPECH(sPOCDE_ID);
end;

procedure TfrmTDB_ADMListe.btnVisPPECH6Click(Sender: TObject);
var
  sPOCDE_ID: string;
begin
  sPOCDE_ID := EmptyStr;

  if Assigned(cxgtvPOCDE_DECOR.Controller.FocusedRecord) then
  begin
    if not VarIsNull(cxgtvPOCDE_DECOR.Controller.FocusedRecord.Values
      [cxgtvPOCDE_DECORPOCDE_ID.Index]) then
      sPOCDE_ID := cxgtvPOCDE_DECOR.Controller.FocusedRecord.Values
        [cxgtvPOCDE_DECORPOCDE_ID.Index];
  end;

  pVisPPECH(sPOCDE_ID);
end;

procedure TfrmTDB_ADMListe.btnVisTARIF_ANOMAClick(Sender: TObject);
var
  sTARIF_ID: string;
begin
  sTARIF_ID := EmptyStr;

  if Assigned(dgTARIF.Controller.FocusedRecord) then
  begin
    if not VarIsNull(dgTARIF.Controller.FocusedRecord.Values[dgTARIF_TARIF_ID.
      Index]) then
      sTARIF_ID := dgTARIF.Controller.FocusedRecord.Values
        [dgTARIF_TARIF_ID.Index];
  end;

  if sTARIF_ID <> EmptyStr then
    frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmTARIFFiche', Self,
      sTARIF_ID, etFVisu);
end;

procedure TfrmTDB_ADMListe.btnZOCOMClick(Sender: TObject);
begin
  ListeEnvoi.ID := 'ZOCOM';
  ListeEnvoi.Quoi := 'ID/DES';

  fInitListeEnvoi(ListeEnvoi);

  ListeEnvoi.AddFiltreDebranch('edtZOCOM_DES', edtZOCOM_DES.Text, False,
    vtNORMAL);

  ListeEnvoi.bLanceRecherche := True;

  frmMain.oGestionAffichageEcran.fAfficheListe('TfrmZOCOMListe', Self,
    etLDebranch, ListeEnvoi);
end;

procedure TfrmTDB_ADMListe.FormClose(Sender: TObject; var Action: TCloseAction);
begin
  if Assigned(FThreadPool) then
  begin
    // Attente de 30s que tous les threads soient termin�s avant de terminer
    // les threads par la force.
    FThreadPool.WaitAllThreads(30000);
    FThreadPool.StopAllThreads;
  end;
end;

procedure TfrmTDB_ADMListe.FormCloseQuery(Sender: TObject; var CanClose: Boolean);
begin
 CanClose := CanClose and (btnQuitter.Enabled);
end;

procedure TfrmTDB_ADMListe.FormKeyDown(Sender: TObject; var Key: Word;
  Shift: TShiftState);
begin
  fEvent(fEvenementL(Key, Shift));
end;

procedure TfrmTDB_ADMListe.fEvent(ptEvent: TEvenementL);
begin
  case ptEvent of
    elFermeture:
      begin
        if btnQuitter.enabled then
          btnQuitterClick(Self);
      end;
    elRecherche:
      begin
        if btnRecherche.enabled then
          btnRechercheClick(Self);
      end;
  end;
end;

procedure TfrmTDB_ADMListe.fGestionEtats;
begin
  if Etat = etVide then
    Exit;

  fEtatBoutonsL(btnQuitter, nil, nil, nil, nil, nil, nil, Etat);
  fEtatBoutonsDeb(Self);
  fSetTrvText(wtlFixe, wtlVolant, Self, Etat, '');

  btnExportExcel.enabled := btnExportExcel.Tag > 0;

end;

procedure TfrmTDB_ADMListe.fRecherche;
const
  N_A = 'N/A';

  procedure CalcOFFRE_ST_0;
  var
    query: TUniQuery;
  begin
    if not dxtciOFFRE_ST_0.Visible then
      Exit;

    dxtciOFFRE_ST_0.Text4.Value := N_A;
    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46758) then // rq = 46758 et Old = 36560,30602, 29648, 27736
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        dxtciOFFRE_ST_0.Text4.Value := query.RecordCount.ToString;
        dxtciOFFRE_ST_0.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcOFFRE_A_RELANCER;
  var
    query: TUniQuery;
  begin
    if not dxtciOFFRE_A_RELANCER.Visible then
      Exit;

    dxtciOFFRE_A_RELANCER.Text3.Value :=
      Format(sMsgOFFRE_A_RELANCER_ADM, [N_A]);
    dxtciOFFRE_A_RELANCER.Text4.Value :=
      Format(sMsgOFFRE_A_RELANCER_CDM, [N_A]);

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46760) then
      // rq = 46760 et Old = 45474,45195, 45175, 43863, 29630, 28687, 28687 et OLD_RQSQL_ID = 27625
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        dxtciOFFRE_A_RELANCER.Text3.Value := Format(sMsgOFFRE_A_RELANCER_ADM,
          [fGetValueS(query, 'COUNT_ADM_COLLA_ID')]);
        dxtciOFFRE_A_RELANCER.Text4.Value := Format(sMsgOFFRE_A_RELANCER_CDM,
          [fGetValueS(query, 'COUNT_CDM_COLLA_ID')]);
        dxtciOFFRE_A_RELANCER.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
    qryOFFRE_A_RELANCER.Close;
  end;

  procedure CalcTARIF_ST0;
  var
    query: TUniQuery;
  begin
    if not dxtciCOMMAListe.Visible then
      Exit;
    dxtciTARIF_ST0.Text3.Value := Format(sMsgTARIF_CNT_ROUGE, [0]);
    dxtciTARIF_ST0.Text4.Value := Format(sMsgTARIF_CNT_BLANC, [0]);

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46761) then
      // rq = Old = 31701,29630, 28687, 28687 et OLD_RQSQL_ID = 27625
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        dxtciTARIF_ST0.Text3.Value := Format(sMsgTARIF_CNT_ROUGE,
          [fGetValueI(query, 'CNT_ROUGE')]);
        dxtciTARIF_ST0.Text4.Value := Format(sMsgTARIF_CNT_BLANC,
          [fGetValueI(query, 'CNT_BLANC')]);
        dxtciTARIF_ST0.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcDM_ECH;
  var
    query,query2: TUniQuery;
  begin
    if not dxtciECH_EN_COURS.Visible then
      Exit;
    dxtciECH_EN_COURS.Text3.Value := N_A;
    dxtciECH_EN_COURS.Text4.Value := N_A;;

    query := TUniQuery.Create(nil);
    query2 := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query2, iRQSQL_DMECHENCOURS2) then  //RQ = 46812
      begin
        fAjoutFiltre(query2);
        if fQueryRQSQL(query, iRQSQL_DMECHENCOURS) then  //RQ = 46813
        begin
          query.SQL.Text := StringReplace(query.SQL.Text, '--rq46812',
            query2.SQL.Text, [rfReplaceAll]);
          fQueryOpenNoLimit(query);
          dxtciECH_EN_COURS.Text3.Value :=
            Format('%d', [fGetValueI(query, 'NBROUGE')]);
          dxtciECH_EN_COURS.Text4.Value :=
            Format('%d', [fGetValueI(query, 'NBBLANC')]);
          dxtciECH_EN_COURS.enabled := True;
          Application.ProcessMessages;
        end;
      end;
    finally
      FreeAndNil(query);
      FreeAndNil(query2);
    end;
  end;

  procedure CalcTARIF_ST1;
  var
    query: TUniQuery;
  begin
    if not dxtciTARIF_ST1.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46763) then
      // rq = et Old = 31703,29630, 28687, 28687 et OLD_RQSQL_ID = 27625
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciTARIF_ST1, fGetValueS(query, 'COUNT'));
        dxtciTARIF_ST1.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcTARIF_ANOMALIE;
  var
    query: TUniQuery;
  begin

    if not dxtciTARIF_ANOMALIE.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46765) then  //rq = 46765 et old = 46238
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciTARIF_ANOMALIE, fGetValueS(query, 'COUNT'));
        dxtciTARIF_ANOMALIE.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcAVMAD;
  var
    query: TUniQuery;
  begin
    if not dxtciAVMADListe.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46766) then // rq = 46766 et Old = 31802,30597, 29629, 28686, 27599
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciAVMADListe, fGetValueS(query, 'COUNT'));
        dxtciAVMADListe.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcCOMMA;
  begin
    if not dxtciCOMMAListe.Visible then
      Exit;

    dxtciCOMMAListe.Text3.Value := Format(sMsgCOMMA_CNT_ROUGE, [0]);
    dxtciCOMMAListe.Text4.Value := Format(sMsgCOMMA_CNT_BLANC, [0]);
    dxtciCOMMAListe.Text2.Value := Format(sMsgCNT_COMMA_ST_1, [0]);

    // CDE02590 FPE 21/12/2023 Ajout des commandes en attente de validation � la s�lection de la tuiles des ARC � �mettre
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    // rq = et Old = 42961,31803,30504, 29630, 28687, 28687 et OLD_RQSQL_ID = 27625
    AsyncRQSQL(FThreadPool, 46804, fAjoutFiltre, True,
      procedure(oQuery: TUniQuery) // old  41128
      begin
        dxtciCOMMAListe.Text3.Value := Format(sMsgCOMMA_CNT_ROUGE,
          [fGetValueI(oQuery, 'CNT_ROUGE')]);
        dxtciCOMMAListe.Text4.Value := Format(sMsgCOMMA_CNT_BLANC,
          [fGetValueI(oQuery, 'CNT_BLANC')]);
        dxtciCOMMAListe.Text2.Value := Format(sMsgCNT_COMMA_ST_1,
          [fGetValueI(oQuery, 'CNT_COMMA_ST_1')]);

        dxtciCOMMAListe.enabled := True;
      end);
  end;

  procedure CalcPPECHProdEnRetard;
  var
    iCnt1, iCnt2, iRQSQL: Integer;
  begin
    if not dxtciPPECHProdRetard.Visible then
      Exit;
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    iRQSQL := 46799; // rq = et Old 46545 42603 36948 = 31704, 30928, 30576, 29632, 28689, 27640
    if TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassAustralia then
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      iRQSQL := 46803; // rq = 46803 et Old = 46549,30929, 30578 31705 46123

    dxtciPPECHProdRetard.Text3.Value := Format(sMsgProdRetardMTO, [0]);
    dxtciPPECHProdRetard.Text4.Value := Format(sMsgProdRetardMTS, [0]);

    AsyncRQSQL(FThreadPool,iRQSQL, fAjoutFiltre, True,
      procedure(oQuery: TUniQuery)
      begin
        var
          i: Integer;
        iCnt1 := 0;
        iCnt2 := 0;

        if oQuery.Active then
        begin
          try
            for i := 0 to Pred(oQuery.RecordCount) do
            begin
              case oQuery.FieldByName('PRCDT_MODE_GES').AsInteger of
                2:
                  Inc(iCnt1); // MTO
                0, 1:
                  Inc(iCnt2); // MTS
              end;
              oQuery.Next;
            end;
          finally
          end;
          dxtciPPECHProdRetard.Text3.Value := Format(sMsgProdRetardMTO,
            [iCnt1]);
          dxtciPPECHProdRetard.Text4.Value := Format(sMsgProdRetardMTS,
            [iCnt2]);
          dxtciPPECHProdRetard.enabled := True;
        end;
        Application.ProcessMessages;
      end);
  end;

  procedure CalcPPECHASolder;
  begin
    if not dxtciPPECHASolderListe.Visible then
      Exit;
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    //rq= 46806 et old = 44423
    AsyncRQSQL(FThreadPool, 46806, fAjoutFiltre, True,
      procedure(oQuery: TUniQuery)
      begin
        setTileValue(dxtciPPECHASolderListe, oQuery.RecordCount);
        dxtciPPECHASolderListe.enabled := True;
        Application.ProcessMessages;
      end);
  end;

  procedure CalcARC_Discussion;
  var
    iActADM, iEn_discu: Integer;

  begin

    if not dxtciARC_Discussion.Visible then
      Exit;
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    //rq= et old = 46108
    AsyncRQSQL(FThreadPool, 46805, fAjoutFiltre, True,
      procedure(oQuery: TUniQuery)
      begin // 42998
        // setTileValue(dxtciARC_Discussion, fGetValueI(oQuery, 'NB_ADM'));
        iActADM := oQuery.FieldByName('NB_ADM').AsInteger;
        iEn_discu := oQuery.FieldByName('NB_GDCP').AsInteger;
        dxtciARC_Discussion.Text3.Value := Format(sMsgEn_discu, [iEn_discu]);
        dxtciARC_Discussion.Text4.Value := Format(sMsgActADM, [iActADM]);
      end);

    dxtciARC_Discussion.enabled := True;

  end;

  procedure CalcPPECHAFader;
   var
    query : TUniQuery;
    iCntRouge, iCntBlanc: Integer;
    i: Integer;
  begin
    if not dxtciPPECHAFaderListe.Visible then
      Exit;  ;

    dxtciPPECHAFaderListe.Text3.Value := 'N_A';
    dxtciPPECHAFaderListe.Text4.Value := 'N_A';
    query := TUniQuery.Create(nil);
    try
      // requ�te de comptage simplifi�e de la RQSQL 43501
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL( query, 46767 ) then   //rq = 46767 et old = 44449
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        iCntRouge := 0;
        iCntBlanc := 0;
        if Query.Active and (Query.RecordCount > 0) then
        begin
          for i := 0 to Pred(Query.RecordCount) do
          begin
            if Query.FieldByName('PPECH_DATE_FAD').AsDateTime <= dDateNow then
              Inc(iCntRouge)
            else
              Inc(iCntBlanc);
            Query.Next;
          end;
        end;
        dxtciPPECHAFaderListe.Text3.Value := iCntRouge.ToString;
        dxtciPPECHAFaderListe.Text4.Value := iCntBlanc.ToString;
        dxtciPPECHAFaderListe.Enabled := true;
        application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcNFSTK_ST0;
  var
    query: TUniQuery;
  begin
    if not dxtciNFSTK_ST0.Visible then
      Exit;
    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46768) then  //rq= 46768 et old = 32044
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciNFSTK_ST0, query.RecordCount.ToString);
        dxtciNFSTK_ST0.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcESN1A_ST0;
  var
    query: TUniQuery;
  begin
    if not dxtciESN1A_ST0.Visible then
      Exit;
    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query,46769) then //rq =46769 et old = 32020
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciESN1A_ST0, query.RecordCount);
        dxtciESN1A_ST0.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcESN1A_ST1;
  var
    query: TUniQuery;
  begin
    if not dxtciESN1A_ST1.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46770) then  //RQ = 46770 et old =32021
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciESN1A_ST1, query.RecordCount);
        dxtciESN1A_ST1.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure PCDAG_A_RELANCER;
  begin
    if not dxtciPCDAG_A_TRAITER.Visible then
      Exit;

    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(qryPCDAG_A_TRAITER, 46771) then //rq = 46771 et old = 44191
      // Old = 31156, 30594, 30120 ,  41412
      begin
        fAjoutFiltre(qryPCDAG_A_TRAITER);
        fQueryOpenNoLimit(dxtciPCDAG_A_TRAITER.Text1.Value, qryPCDAG_A_TRAITER);

        if qryPCDAG_A_TRAITER.Active { and (qryPCDAG_A_TRAITER.RecordCount > 0) }
        then
          setTileValue(dxtciPCDAG_A_TRAITER, qryPCDAG_A_TRAITER.RecordCount);
      end;
    except
      raise;
    end;
  end;

  procedure CalcDMDAPListe;
  var
    iCnt1, iCnt2: Integer;
  begin
    if not dxtciDMDAPListe.Visible then
      Exit;

    iCnt1 := 0;
    iCnt2 := 0;
    dxtciDMDAPListe.Text3.Value := Format(sMsgDMDAPAuVN, [0]);
    dxtciDMDAPListe.Text4.Value := Format(sMsgDMDAPAuDecor, [0]);

    AsyncRQSQL(FThreadPool,44193, fAjoutFiltre, True,
      procedure(oQuery: TUniQuery)
      begin // Old = 30589, 30479
        oQuery.DisableControls;
        try
          for var i := 0 to Pred(oQuery.RecordCount) do
          begin
            case fGetValueI(oQuery, 'PRCDT_TYP') of
              0:
                Inc(iCnt1); // VN
              1:
                Inc(iCnt2); // Decor
            end;
            oQuery.Next;
          end;
          oQuery.First;
        finally
          oQuery.EnableControls;
        end;
        dxtciDMDAPListe.Text3.Value := Format(sMsgDMDAPAuVN, [iCnt1]);
        dxtciDMDAPListe.Text4.Value := Format(sMsgDMDAPAuDecor, [iCnt2]);
        dxtciDMDAPListe.enabled := True;
      end);
  end;

  procedure CalcARBBESuivi;
  begin
    if not dxtciARBBESuivi.Visible then
      Exit;

    dxtciARBBESuivi.Text4.Value := '0';
    // CDE02460 FPE 27/02/2023 et suite retour VSR 01/03/2023
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    AsyncRQSQL(FThreadPool, 46772 , fAjoutFiltre, True, //rq = 46772 et old 46635,46309
      procedure(oQuery: TUniQuery)
      begin // rq = 46086, 43021 38901 Old = 38773,31817,31204, 30592, 29641, 28720, 27753
        setTileValue(dxtciARBBESuivi, StrToIntDef(dxtciARBBESuivi.Text4.Value,
          0) + oQuery.RecordCount);
      end);

  end;

  procedure CalcPOCDE_DECOR;
  var
    query: TUniQuery;
    iCnt: Integer;
    i: Integer;
  begin
    if not dxtciPOCDE_DECOR.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46774) then // rq= 46774 et Old = 33829,30602, 29648, 27736
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        iCnt := 0;
        if query.Active then
        begin
          try
            for i := 0 to Pred(query.RecordCount) do
            begin
              if (query.FieldByName('ORFAB_DATE').AsString <> '') and
                (query.FieldByName('ORFAB_DATE').Value <= dDateNow + 30) then
                Inc(iCnt);
              query.Next;
            end;
          finally
          end;
        end;
        setTileValue(dxtciPOCDE_DECOR, iCnt);
        dxtciPOCDE_DECOR.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcPOCDE_BLK;
  var
    query: TUniQuery;
    iCntRouge, iCntJaune, iCntBlanc: Integer;
  begin
    if not dxtciPOCDE_BLK.Visible then
      Exit;
    iCntRouge := 0;
    dxtciPOCDE_BLK.Text2.Value := Format(sMsgPOCDE_BLK_ROUGE, [iCntRouge]);
    iCntJaune := 0;
    dxtciPOCDE_BLK.Text3.Value := Format(sMsgPOCDE_BLK_JAUNE, [iCntJaune]);
    iCntBlanc := 0;
    dxtciPOCDE_BLK.Text4.Value := Format(sMsgPOCDE_BLK_BLANC, [iCntBlanc]);

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46775) then  //rq= 46775 et old = 31890
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        for var i := 0 to Pred(query.RecordCount) do
        begin
          if fGetValueI(query, 'DEEXP_ID') > 0 then // Blocage DDL
            Inc(iCntRouge)
          else if fGetValueI(query, 'ORFAB_SPEC') > 0 then
          // Blocage OF Sp�cifique
            Inc(iCntJaune)
          else // Autres blocages
            Inc(iCntBlanc);
          query.Next;
        end;

        dxtciPOCDE_BLK.Text2.Value := Format(sMsgPOCDE_BLK_ROUGE, [iCntRouge]);
        dxtciPOCDE_BLK.Text3.Value := Format(sMsgPOCDE_BLK_JAUNE, [iCntJaune]);
        dxtciPOCDE_BLK.Text4.Value := Format(sMsgPOCDE_BLK_BLANC, [iCntBlanc]);
        dxtciPOCDE_BLK.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcDAMCC;
  var
    query : TUniQuery;
    iCntRouge,
    iCntJaune,
    iCntBlanc,
    iNbCompteur : integer;
  begin
    if not dxtciDAMCC.Visible then
      Exit;
    iCntRouge := 0;
    dxtciDAMCC.Text2.Value := Format(sMsgDAMCC_ROUGE, [iCntRouge]);
    iCntJaune := 0;
    dxtciDAMCC.Text3.Value := Format(sMsgDAMCC_JAUNE, [iCntJaune]);
    iCntBlanc := 0;
    dxtciDAMCC.Text4.Value := Format(sMsgDAMCC_BLANC, [iCntBlanc]);

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02835 FPE 01/10/2025 Ajout dmd annulation cmd au statut emis
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL( query, 46777) then  //rq = 46777 et Old 45516,44849
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        iNbCompteur := fGetValueI(Query, 'NB_EC') + fGetValueI(Query, 'NB_ACCEPTEE') + fGetValueI(Query, 'NB_REFUSEE');
        setTileValue(dxtciDAMCC, iNbCompteur);
        if not Query.eof Then
        begin
          iCntRouge := fGetValueI(Query, 'NB_EC') + fGetValueI(Query, 'NB_EMISE');
          iCntJaune := fGetValueI(Query, 'NB_ACCEPTEE');
          iCntBlanc := fGetValueI(Query, 'NB_REFUSEE');
        end;

        dxtciDAMCC.Text2.Value := Format(sMsgDAMCC_ROUGE, [iCntRouge]);
        dxtciDAMCC.Text3.Value := Format(sMsgDAMCC_JAUNE, [iCntJaune]);
        dxtciDAMCC.Text4.Value := Format(sMsgDAMCC_BLANC, [iCntBlanc]);

        dxtciDAMCC.Enabled := true;
        application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure pCalcDEEXP_ST_0;
  var
    query: TUniQuery;
  begin
    if not dxtciDEEXP_ST_0.Visible then
      Exit;

    // CDE02518 FPE 15/05/2023 Exclure de la tuile DDLs en cours les DDLs au statut � exp�dier � 'Oui".
    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46778) then // rqsql_id = 46778 et Old = 39391,31824,30547
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciDEEXP_ST_0, fGetValueS(query, 'CNT_DEEXP'));
        dxtciDEEXP_ST_0.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure pCalcDEEXP_ST_2;
  var
    query: TUniQuery;
  begin
    if not dxtciDEEXP_ST_2.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46780) then // rq = 46780 et Old = 37662,31825, 30550
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciDEEXP_ST_2, fGetValueS(query, 'CNT_DEEXP'));
        dxtciDEEXP_ST_2.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure pCalcDEEXP_ANOMA;
  var
    query: TUniQuery;
  begin
    if not dxtciDEEXP_ANOMA.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46781) then // rq = 46781 et Old = 44788, 30551, 31826 41002
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        dxtciDEEXP_ANOMA.Text3.Value := fGetValueS(query, 'CNT_DEEXP');
        if fGetValueI(query, 'CNT_DEEXP') > 0 then
          dxtciDEEXP_ANOMA.Text3.Font.Color := $008080FF
        else
          dxtciDEEXP_ANOMA.Text3.Font.Color := clDefault;
      end;
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46782) then //rq = 46782 et old = 44789
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        dxtciDEEXP_ANOMA.Text4.Value := fGetValueS(query, 'CNT_DEEXP');
      end;
      dxtciDEEXP_ANOMA.enabled := True;
      Application.ProcessMessages;

    finally
      FreeAndNil(query);
    end;
  end;

  procedure pCalcCADEN_PPECH;
  var
    query: TUniQuery;
    query2: TUniQuery;
  begin
    if not dxtciCADEN_PPECH.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    query2 := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query2, 46809) then // rq= 46809 et old= 46809
      begin
        fAjoutFiltre(query2);
        if fQueryRQSQL(query, 46810) then // rq= 46810 et old= 46783,45876,44803
        begin
          query.SQL.Text := StringReplace(query.SQL.Text, '--FiltreCOUNT',
          '--FiltreCOUNT' + CRLF, [rfReplaceAll]);
          query.SQL.Text := StringReplace(query.SQL.Text, '--rq46809',
            query2.SQL.Text, [rfReplaceAll]);
          fQueryOpenNoLimit(query);
          dxtciCADEN_PPECH.Text3.Value := fGetValueS(query, 'CNT_PPECH');
          if fGetValueI(query, 'CNT_PPECH') > 0 then
            dxtciCADEN_PPECH.Text3.Font.Color := $008080FF
          else
            dxtciCADEN_PPECH.Text3.Font.Color := clDefault;
        end;
      end;


      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query,46784 ) then // rq= 46784 et old = 45877,44809
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        dxtciCADEN_PPECH.Text4.Value := fGetValueS(query, 'CNT_CADEN');
        if fGetValueI(query, 'CNT_CADEN') > 0 then
          dxtciCADEN_PPECH.Text4.Font.Color := $008080FF
        else
          dxtciCADEN_PPECH.Text4.Font.Color := clDefault;
      end;
      dxtciCADEN_PPECH.enabled := True;
      Application.ProcessMessages;

    finally
      FreeAndNil(query);
      FreeAndNil(query2);
    end;
  end;

  procedure pCalcDDL_A_CREER;
  begin
    if not dxtciDDL_A_CREER.Visible then
      Exit;

    dxtciDDL_A_CREER.Text3.Value := 'N_A';
    dxtciDDL_A_CREER.Text2.Value := 'N_A';
    dxtciDDL_A_CREER.Text4.Value := 'N_A';
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    //rq= 46811 et old= 45918
    AsyncRQSQL(FThreadPool,46811 , fAjoutFiltre, True,
      procedure(oQuery: TUniQuery)
      begin // 44422 simplifacation de la RQSQL 44228 pour faire le comptage
        var
          iCnt1, iCnt2, iCnt3: Integer;
        var
          i: Integer;

        iCnt1 := 0;
        iCnt2 := 0;
        iCnt3 := 0;
        if oQuery.Active then
        begin
          try
            for i := 0 to Pred(oQuery.RecordCount) do
            begin
              if (oQuery.FieldByName('PPECH_DATE').AsDateTime <= dDateNow) then
                Inc(iCnt1)
              else if DateInRange(oQuery.FieldByName('PPECH_DATE').AsDateTime,
                IncDay(dDateNow, 1), IncDay(dDateNow, 10)) then
                Inc(iCnt2)
              else if (oQuery.FieldByName('PPECH_DATE').AsDateTime >
                IncDay(dDateNow, 10)) then
                Inc(iCnt3);
              oQuery.Next;
            end;
          finally
          end;
        end;
        dxtciDDL_A_CREER.Text3.Value := iCnt1.ToString;
        dxtciDDL_A_CREER.Text2.Value := iCnt2.ToString;
        dxtciDDL_A_CREER.Text4.Value := iCnt3.ToString;
        dxtciDDL_A_CREER.enabled := True;
        Application.ProcessMessages;
      end);
  end;

// PYFB A SUP
// procedure CalcDDL_A_CREER_FAD;
// var
// query : TUniQuery;
// begin
// if not dxtciDDL_A_CREER_FAD.Visible then
// Exit;
//
// query := TUniQuery.Create(nil);
// try
// if fQueryRQSQL( query, 44420 ) then // simplification de 31828
// begin
// fAjoutFiltre(query);
// fQueryOpenNoLimit(query);
// setTileValue(dxtciDDL_A_CREER_FAD, Query.RecordCount);
// dxtciDDL_A_CREER_FAD.Enabled := True;
// application.ProcessMessages;
// end;
// finally
// FreeAndNil(query);
// end;
// end;


// FAC01211 FPE 23/04/2024 Tuile BLs � facturer r�impl�menter pour SGL MXN
  procedure CalcBOLIV_A_FACT;
  begin
    if not dxtciBOLIV_A_FACT.Visible then
      Exit;
    dxtciBOLIV_A_FACT.Text4.Value := '0';
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    //rq= 46786 et old = 38801
    AsyncRQSQL(FThreadPool, 46786, fAjoutFiltre, True,
      procedure(oQuery: TUniQuery)
      begin
        setTileValue(dxtciBOLIV_A_FACT, fGetValueS(oQuery, 'CNT_BOLIV'));
        dxtciBOLIV_A_FACT.enabled := True;
        Application.ProcessMessages;
      end);
  end;
// FIN FAC01211 FPE 23/04/2024 Tuile BLs � facturer r�impl�menter pour SGL MXN

  procedure CalcFACTU_AVOIR;
  var
    query: TUniQuery;
  begin
    if not dxtciFACTU_AVOIR.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46787) then // rq= 46787 et Old = 39849,31830, 30555
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciFACTU_AVOIR, fGetValueS(query, 'CNT_FACTU'));
        dxtciFACTU_AVOIR.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcAVOIRS_A_VALIDER;
  var
    query: TUniQuery;
  begin
    if not dxtcAVOIRS_A_VALIDER.Visible then // Old = 31830, 30555
      Exit;
    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46788 ) then  //rq= 46788 et old = 39850
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtcAVOIRS_A_VALIDER, fGetValueS(query, 'CNT_VALAV'));
        dxtcAVOIRS_A_VALIDER.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure CalcFCMNT_A_FACT;
  var
    query: TUniQuery;
  begin
    if not dxtciFCMNT_A_FACT.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46789) then // rq= 46789 et old 40763,32017
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciFCMNT_A_FACT, query.RecordCount);
        dxtciFCMNT_A_FACT.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure DDF_ECHANT;
  var
    query: TUniQuery;
  begin
    if not dxtciDDF_ECHANT.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46748) then // rq = 46748 et Old = 31854,30602, 29648, 27736
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciDDF_ECHANT, query.RecordCount);
        dxtciDDF_ECHANT.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure DMBAT_TYPE0;
  var
    query: TUniQuery;
  begin
    if not dxtciDMBAT_TYPE0.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46755) then // rq= 46755 et Old = 31855,30603, 29649, 28728;, 27738
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciDMBAT_TYPE0, query.RecordCount);
        dxtciDMBAT_TYPE0.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

  procedure DMBAT_TYPE1;
  var
    query: TUniQuery;
  begin
    if not dxtciDMBAT_TYPE1.Visible then
      Exit;

    query := TUniQuery.Create(nil);
    try
      //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
      if fQueryRQSQL(query, 46750) then // rq= 46750 et old = 31856,32017
      begin
        fAjoutFiltre(query);
        fQueryOpenNoLimit(query);
        setTileValue(dxtciDMBAT_TYPE1, query.RecordCount);
        dxtciDMBAT_TYPE1.enabled := True;
        Application.ProcessMessages;
      end;
    finally
      FreeAndNil(query);
    end;
  end;

begin
{$IFDEF __ORA__}
  dxtcTiles.BeginUpdate;
  try
{$ENDIF}
    if not tmRecherche.enabled then
    begin
      tmRecherche.enabled := True;
      Exit;
    end;
    tmRecherche.enabled := False;

    ShowWaitScreen;
    btnRecherche.enabled := False;
    btnQuitter.enabled := False;
    try
      for var i := 0 to dxtcTiles.items.count - 1 do
      begin
        dxtcTiles.items[i].enabled := False;
      end;
      for var i := 0 to ComponentCount - 1 do
      begin
        if Components[i] is TUniQuery then
          TUniQuery(Components[i]).Close;
      end;
      dxtciBOLIV_A_FACT.Text4.Value := N_A;
      dxtciARBBESuivi.Text4.Value := N_A;
      dxtciPCDAG_A_TRAITER.Text4.Value := N_A;
      dxtciOFFRE_ST_0.Text4.Value := N_A;
      dxtciOFFRE_A_RELANCER.Text4.Value := N_A;
      dxtciTARIF_ST0.Text3.Value := N_A;
      dxtciTARIF_ST0.Text4.Value := N_A;
      dxtciTARIF_ST1.Text4.Value := N_A;
      dxtciTARIF_ANOMALIE.Text4.Value := N_A;
      dxtciAVMADListe.Text4.Value := N_A;
      dxtciCOMMAListe.Text3.Value := N_A;
      dxtciCOMMAListe.Text4.Value := N_A;
      dxtciPPECHProdRetard.Text3.Value := N_A;
      dxtciPPECHProdRetard.Text4.Value := N_A;
      dxtciPPECHASolderListe.Text4.Value := N_A;
      dxtciPOCDE_DECOR.Text4.Value := N_A;
      dxtciPOCDE_BLK.Text2.Value := N_A;
      dxtciPOCDE_BLK.Text3.Value := N_A;
      dxtciPOCDE_BLK.Text4.Value := N_A;
      dxtciDEEXP_ST_0.Text4.Value := N_A;
      dxtciDEEXP_ST_2.Text4.Value := N_A;
      dxtciDEEXP_ANOMA.Text4.Value := N_A;
      dxtciCADEN_PPECH.Text3.Value := N_A;
      dxtciCADEN_PPECH.Text4.Value := N_A;
      dxtciDDL_A_CREER.Text3.Value := N_A;
      dxtciDDL_A_CREER.Text2.Value := N_A;
      dxtciDDL_A_CREER.Text4.Value := N_A;
      // dxtciDDL_A_CREER_FAD.Text4.Value   := N_A; PYFB a sup
      dxtciFACTU_AVOIR.Text4.Value := N_A;
      dxtcAVOIRS_A_VALIDER.Text4.Value := N_A;
      dxtciPPECHAFaderListe.Text3.Value := N_A;
      dxtciPPECHAFaderListe.Text4.Value := N_A;
      dxtciFCMNT_A_FACT.Text4.Value := N_A;
      dxtciNFSTK_ST0.Text4.Value := N_A;
      dxtciESN1A_ST0.Text4.Value := N_A;
      dxtciESN1A_ST1.Text4.Value := N_A;
      dxtciSTOCKS_2ANS.Text2.Value := N_A;
      dxtciSTOCKS_2ANS.Text3.Value := N_A;
      dxtciSTOCKS_2ANS.Text4.Value := N_A;
      dxtciDDF_ECHANT.Text4.Value := N_A;
      dxtciDMBAT_TYPE0.Text4.Value := N_A;
      dxtciDMBAT_TYPE1.Text4.Value := N_A;

      dxtciECH_EN_COURS.Text3.Value := N_A;
      dxtciECH_EN_COURS.Text4.Value := N_A;
      Application.ProcessMessages;

      try
        CalcPPECHProdEnRetard;
        CalcPPECHASolder;
        CalcARC_Discussion;
        CalcBOLIV_A_FACT;
        CalcARBBESuivi;

        CalcDMDAPListe;
        PCDAG_A_RELANCER;
        // Offres
        CalcOFFRE_ST_0;
        CalcOFFRE_A_RELANCER;
        // Tarifs
        CalcTARIF_ST0;
        CalcTARIF_ST1;
        CalcTARIF_ANOMALIE;
        // Commandes
        CalcAVMAD;
        CalcCOMMA;

        CalcPOCDE_DECOR;
        CalcPOCDE_BLK;
        // feature/CDE02728 FPE 29/04/2025
        CalcDAMCC;
        // feature/CDE02728 FPE 29/04/2025
        // Expeditions
        pCalcDEEXP_ST_0; // En cours
        pCalcDEEXP_ST_2; // Pr�par�e
        pCalcDEEXP_ANOMA;
        pCalcCADEN_PPECH;
        pCalcDDL_A_CREER;
        // CalcDDL_A_CREER_FAD; PYFB A SUP
        // Factures
        // FAC01211 FPE 23/04/2024 Tuile BLs � facturer r�impl�menter pour SGL MXN
        CalcFACTU_AVOIR;
        CalcAVOIRS_A_VALIDER;
        CalcPPECHAFader;
        CalcFCMNT_A_FACT;
        CalcNFSTK_ST0;
        CalcESN1A_ST0;
        CalcESN1A_ST1;
        // STK01299 FPE 04/02/2022
        CompteursSTOCKS_2ANS;
        // FIN STK01299 FPE 04/02/2022
        // Projets
        DDF_ECHANT;
        DMBAT_TYPE0;
        DMBAT_TYPE1;
        CalcDM_ECH;
        bInRecherche := False;
        // CDE02460 FPE 06/12/2022 Optimisation

      except
        raise;
      end;
    finally
      btnRecherche.enabled := True;
      btnQuitter.enabled := True;
    end;
{$IFDEF __ORA__}
  finally
    dxtcTiles.EndUpdate;
  end;
{$ENDIF}
end;

procedure TfrmTDB_ADMListe.setTileValue(item: TdxTileControlItem; a: Integer);
begin
  setTileValue(item, IntToStr(a));
end;

procedure TfrmTDB_ADMListe.setTileValue(item: TdxTileControlItem;
const a: string);
begin
  if item = nil then
    Exit;
  if not item.Visible then
    Exit;

  item.Text4.Value := a;
  item.enabled := a <> N_A;
end;

procedure TfrmTDB_ADMListe.tmRechercheTimer(Sender: TObject);
begin
  fRecherche;
end;

procedure TfrmTDB_ADMListe.CompteursSTOCKS_2ANS;
var
  iRQSQL_ID: Integer;
  snROUGE_1ERE_2EME_3EME_RELANCE: string;
  query: TUniQuery;
begin
  // STK01412 03/05/2022 FPE Bug sur compteurs (vue lot de stock au lieu d'�ch�ance + formule r1 erronn�e (chaine).
  // STK01440 FPE 19/07/2022 Evolution regle de seleciton et d'affichage date mad ref
  //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
  iRQSQL_ID := 46792;  //rq= 46792 et old = 44447
  // rqsql_id =  et OLD_RQSQL = 35083,35249,35345,35706,36452,36510, 37119;
  // STK01299 FPE 08/10/2021 Vieux stocks dormants
  query := TUniQuery.Create(nil);
  try
    if fQueryRQSQL(query, iRQSQL_ID) then
    // rqsql_id = 34509 et old_rqsql_id = 32059
    begin
      fAjoutFiltre(query);
      fQueryOpenNoLimit(query);
      if not query.isempty then
      begin
        query.First;
        // M22
        iNbM22Rouge := fGetValueI(query, 'NbM22Rouge');
        dxtciSTOCKS_2ANS.Text2.Value := fGetMessage(MessageContext, 'STOCK_M22')
          + CRLF + IntToStr(iNbM22Rouge);
        if iNbM22Rouge > 0 then
          dxtciSTOCKS_2ANS.Text2.Font.Color := clRed
          // dxtciSTOCKS_2ANS.Text2.value := Format(fGetMessage(MessageContext,'STOCK_M22') + Char(10) + Char(13) + IntToStr(iNbM22Rouge), [iCntRouge])
        else
          dxtciSTOCKS_2ANS.Text2.Font.Color := clDefault;

        snROUGE_1ERE_2EME_3EME_RELANCE :=
          IntToStr(fGetValueI(query, 'sROUGE_1ERE_RELANCE') + fGetValueI(query,
          'sROUGE_2EME_RELANCE') + fGetValueI(query, 'sROUGE_3EME_RELANCE'));
        dxtciSTOCKS_2ANS.Text3.Value := fGetMessage(MessageContext,
          'STOCK_R1_R2_R3') + CRLF + snROUGE_1ERE_2EME_3EME_RELANCE;
        if (fGetValueI(query, 'sROUGE_1ERE_RELANCE') > 0) or
          (fGetValueI(query, 'sROUGE_2EME_RELANCE') > 0) or
          (fGetValueI(query, 'sROUGE_3EME_RELANCE') > 0) then
          dxtciSTOCKS_2ANS.Text3.Font.Color := clRed
        else
          dxtciSTOCKS_2ANS.Text3.Font.Color := clDefault;

        inROUGE_FINALISATION_EC := fGetValueI(query, 'nROUGE_FINALISATION_EC');
        dxtciSTOCKS_2ANS.Text4.Value := fGetMessage(MessageContext, 'STOCK_FIN')
          + CRLF + IntToStr(inROUGE_FINALISATION_EC);
        if (fGetValueI(query, 'nROUGE_FINALISATION_EC') > 0) then
          dxtciSTOCKS_2ANS.Text4.Font.Color := clRed
        else
          dxtciSTOCKS_2ANS.Text4.Font.Color := clDefault;
      end;

      dxtciSTOCKS_2ANS.enabled := True;
      Application.ProcessMessages;
    end;
  finally
    FreeAndNil(query);
  end;
end;

procedure TfrmTDB_ADMListe.fAjoutFiltre(var pADOQry: TUniQuery);
begin
  pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreSOCIE',
    '--FiltreSOCIE' + CRLF, [rfReplaceAll]);
  if edtADM_COLLA_ID.Text <> EmptyStr then
    pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreCOLLA',
      '--FiltreCOLLA' + CRLF, [rfReplaceAll]);
  if edtCDM_COLLA_ID.Text <> EmptyStr then
    pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreCDM',
      '--FiltreCDM' + CRLF, [rfReplaceAll]);
  if edtRZA_COLLA_ID.Text <> EmptyStr then
    pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreRZA',
      '--FiltreRZA' + CRLF, [rfReplaceAll]);
  if edtRZC_COLLA_ID.Text <> EmptyStr then
    pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreRZC',
      '--FiltreRZC' + CRLF, [rfReplaceAll]);
  if edtTIERS_ID.Text <> EmptyStr then
    pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreTIERS',
      '--FiltreTIERS' + CRLF, [rfReplaceAll]);
  if edtZOCOM_ID.Text <> EmptyStr then
    pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreZOCOM',
      '--FiltreZOCOM' + CRLF, [rfReplaceAll]);
  //feature/CDE02917 FPE 11/05/2025 D�branchement sur dir vte type Secteur/Head sales
//  if edtDirVen_ID.Text <> EmptyStr then
//    pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreDIRVEN',
//      '--FiltreDIRVEN' + CRLF, [rfReplaceAll]);

  if (Pos('--FiltreSOCIE', pADOQry.SQL.Text) > 0) then
    fQueryDeclareParameterType(pADOQry, 'iSOCIE_ID', ftInteger, _UserHH.Soc_ID);
  if (edtADM_COLLA_ID.Text <> EmptyStr) and
    (Pos('--FiltreCOLLA', pADOQry.SQL.Text) > 0) then
    fQueryDeclareParameterType(pADOQry, 'iCOLLA_ID', ftInteger,
      edtADM_COLLA_ID.Text);
  if (edtCDM_COLLA_ID.Text <> EmptyStr) and
    (Pos('--FiltreCDM', pADOQry.SQL.Text) > 0) then
    fQueryDeclareParameterType(pADOQry, 'iCOLLA_CDM_ID', ftInteger,
      edtCDM_COLLA_ID.Text);
  if (edtRZA_COLLA_ID.Text <> EmptyStr) and
    (Pos('--FiltreRZA', pADOQry.SQL.Text) > 0) then
    fQueryDeclareParameterType(pADOQry, 'iCOLLA_RZA_ID', ftInteger,
      edtRZA_COLLA_ID.Text);
  if (edtRZC_COLLA_ID.Text <> EmptyStr) and
    (Pos('--FiltreRZC', pADOQry.SQL.Text) > 0) then
    fQueryDeclareParameterType(pADOQry, 'iCOLLA_RZC_ID', ftInteger,
      edtRZC_COLLA_ID.Text);
  if (edtTIERS_ID.Text <> EmptyStr) and
    (Pos('--FiltreTIERS', pADOQry.SQL.Text) > 0) then
    fQueryDeclareParameterType(pADOQry, 'iTIERS_ID', ftInteger,
      edtTIERS_ID.Text);
  if (edtZOCOM_ID.Text <> EmptyStr) and
    (Pos('--FiltreZOCOM', pADOQry.SQL.Text) > 0) then
    fQueryDeclareParameterType(pADOQry, 'iZOCOM_ID', ftInteger,
      edtZOCOM_ID.Text);
  //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
  if edtDirVen_TRIG.Text <> EmptyStr then
  begin
    if not fQueryFilter(pADOQry, 'COLLA_DirVen.COLLA_ID', ftInteger, edtDirVen_ID.Text, '=')  then
    begin
      fQueryFilterLike(pADOQry, 'COLLA_DirVen.COLLA_TRIG', ftString, edtDirVen_TRIG.Text);
      fQueryFilterLike(pADOQry, 'COLLA_DirVen.COLLA_NOM||'' ''||COLLA_DirVen.COLLA_PRENOM', ftString, edtDirVen_NOM_PRENOM.Text);
    end;
  end;

  fFiltre(pADOQry, Filtres);
end;

procedure TfrmTDB_ADMListe.fAjoutFiltreRelance(var pADOQry: TUniQuery);
begin
  fAjoutFiltre(pADOQry);
  // fpe : Attention la notion de zone dans le TDB fait r�f�rence ausecteur commercial et non � la zone.
  if (NOT IsEmptyOrNull(edtZOCOM_ID.Text)) then
    pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreSECTEUR',
      '--FiltreSECTEUR' + CRLF, [rfReplaceAll]);
  if (Pos('--FiltrePO', pADOQry.SQL.Text) > 0) then
    pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltrePO',
      '--FiltrePO' + CRLF, [rfReplaceAll]);

  pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreSTKRLVIS',
    '--FiltreSTKRLVIS' + CRLF, [rfReplaceAll]);

  pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreSTKRACTIONALL',
    '--FiltreSTKRACTIONALL' + CRLF, [rfReplaceAll]);
  pADOQry.SQL.Text := StringReplace(pADOQry.SQL.Text, '--FiltreRelancesEnCours',
    '--FiltreRelancesEnCours' + CRLF, [rfReplaceAll]);
  if (NOT IsEmptyOrNull(edtZOCOM_ID.Text)) and
    (Pos('--FiltreSECTEUR', pADOQry.SQL.Text) > 0) then
    fQueryDeclareParameterType(pADOQry, 'iSECTEUR_ID', ftInteger,
      edtZOCOM_ID.Text);
  if (Pos('--FiltrePO', pADOQry.SQL.Text) > 0) then
    fQueryDeclareParameterType(pADOQry, 'iTMP_ID', ftInteger, iTMP_ID);

  fFiltre(pADOQry, Filtres);
end;

procedure TfrmTDB_ADMListe.fGetData(Sender: TObject);
begin
  if ListeEnvoi.ID = 'COLLA_ADM' then
  begin
    edtADM_COLLA_ID.Text := ListeEnvoi.DataS[0];
    edtADM_COLLA_TRIG.Text := ListeEnvoi.DataS[1];
    edtADM_COLLA_PRENOM.Text := ListeEnvoi.DataS[3];
    edtADM_COLLA_NOM.Text := ListeEnvoi.DataS[4];
  end
  else if ListeEnvoi.ID = 'COLLA_CDM' then
  begin
    edtCDM_COLLA_ID.Text := ListeEnvoi.DataS[0];
    edtCDM_COLLA_TRIG.Text := ListeEnvoi.DataS[1];
    edtCDM_COLLA_PRENOM.Text := ListeEnvoi.DataS[3];
    edtCDM_COLLA_NOM.Text := ListeEnvoi.DataS[4];
  end
  else if ListeEnvoi.ID = 'COLLA_RZA' then
  begin
    bInRecherche := True;
    edtRZA_COLLA_ID.Text := ListeEnvoi.DataS[0];
    edtRZA_COLLA_TRIG.Text := ListeEnvoi.DataS[1];
    edtRZA_COLLA_PRENOM.Text := ListeEnvoi.DataS[3];
    edtRZA_COLLA_NOM.Text := ListeEnvoi.DataS[4];
  end
  else if ListeEnvoi.ID = 'COLLA_RZC' then
  begin
    edtRZC_COLLA_ID.Text := ListeEnvoi.DataS[0];
    edtRZC_COLLA_TRIG.Text := ListeEnvoi.DataS[1];
    edtRZC_COLLA_PRENOM.Text := ListeEnvoi.DataS[3];
    edtRZC_COLLA_NOM.Text := ListeEnvoi.DataS[4];
  end
  else if ListeEnvoi.ID = 'TIERS' then
  begin
    edtTIERS_ID.Text := ListeEnvoi.DataS[0];
    edtTIERS_CODE.Text := ListeEnvoi.DataS[1];
    edtTIERS_RS_L1.Text := ListeEnvoi.DataS[2];
  end
  else if ListeEnvoi.ID = 'ZOCOM' then
  begin
    edtZOCOM_ID.Text := ListeEnvoi.DataS[0];
    edtZOCOM_DES.Text := ListeEnvoi.DataS[1];
  end
  //CDE02917 FPE 11/05/2026 Ajout filtre directeur des ventes
  else if ListeEnvoi.Id = 'TDB_ADM_DIR_VEN_SECTEUR_HEAD_SALES' then
  begin
    edtDirVen_ID.Text := ListeEnvoi.DataS[0];
    edtDirVen_TRIG.Text := ListeEnvoi.DataS[1];
    edtDirVen_NOM_PRENOM.Text := ListeEnvoi.DataS[2];
  end;

  fRecherche;
end;

procedure TfrmTDB_ADMListe.PPECHProdRetardManageButtonsState;
var
  iTmpItem: Variant;
begin
  iTmpItem := Null;

  if (cxgtvPPECHProdRetard.Controller.SelectedRowCount > 0) then
  begin
    iTmpItem := cxgtvPPECHProdRetard.Controller.SelectedRows[0].Values
      [cxgtvPPECHProdRetardPPECH_ID.Index];
  end;

  btnVisCOMMA2.enabled := not VarIsNull(iTmpItem);
  btnVisPOCDE2.enabled := not VarIsNull(iTmpItem);
  btnVisPPECH2.enabled := not VarIsNull(iTmpItem);
end;

procedure TfrmTDB_ADMListe.PPECHASolderManageButtonsState;
var
  iTmpItem: Variant;
begin
  iTmpItem := Null;

  if (cxgtvPPECHASolder.Controller.SelectedRowCount > 0) then
  begin
    iTmpItem := cxgtvPPECHASolder.Controller.SelectedRows[0].Values
      [cxgtvPPECHASolderPPECH_ID.Index];
  end;

  btnVisCOMMA3.enabled := not VarIsNull(iTmpItem);
  btnVisPOCDE3.enabled := not VarIsNull(iTmpItem);
  btnVisPPECH3.enabled := not VarIsNull(iTmpItem);
end;

procedure TfrmTDB_ADMListe.PPECHAFaderManageButtonsState;
var
  iTmpItem: Variant;
begin
  iTmpItem := Null;

  if (cxgtvPPECHAFader.Controller.SelectedRowCount > 0) then
  begin
    iTmpItem := cxgtvPPECHAFader.Controller.SelectedRows[0].Values
      [cxgtvPPECHAFaderPOCDE_ID.Index];
  end;

  btnVisCOMMA5.enabled := not VarIsNull(iTmpItem);
  btnVisPOCDE5.enabled := not VarIsNull(iTmpItem);
  btnVisPPECH5.enabled := not VarIsNull(iTmpItem);
  // if (cxgtvPPECHAFader.Controller.SelectedRowCount > 0) then
  // begin
  // btnVisCOMMA5.Enabled := not VarIsNull(cxgtvPPECHAFader.Controller.FocusedRecord.Values[cxgtvPPECHAFaderCOMMA_ID.Index]);
  // btnVisPOCDE5.Enabled := not VarIsNull(cxgtvPPECHAFader.Controller.FocusedRecord.Values[cxgtvPPECHAFaderPOCDE_ID.Index]);
  // btnVisPPECH5.Enabled := not VarIsNull(cxgtvPPECHAFader.Controller.FocusedRecord.Values[cxgtvPPECHAFaderPOCDE_ID.Index]);
  // end;

  // if (cxgtvPPECHAFader.Controller.SelectedRowCount > 0) then
  // begin
  // iTmpItem := cxgtvPPECHAFader.Controller.SelectedRows[0].Values[cxgtvPPECHAFaderPPECH_ID.Index];
  // btnVisCOMMA5.Enabled := (cxgtvPPECHAFader.Controller.SelectedRowCount > 0);
  // btnVisPOCDE5.Enabled := (cxgtvPPECHAFader.Controller.SelectedRowCount > 0);
  // btnVisPPECH5.Enabled := (cxgtvPPECHAFader.Controller.SelectedRowCount > 0);
  // end;
end;

procedure TfrmTDB_ADMListe.POCDE_DECORManageButtonsState;
var
  iTmpItem: Variant;
begin
  iTmpItem := Null;

  if (cxgtvPOCDE_DECOR.Controller.SelectedRowCount > 0) then
  begin
    iTmpItem := cxgtvPOCDE_DECOR.Controller.SelectedRows[0].Values
      [cxgtvPOCDE_DECORPOCDE_ID.Index];
  end;

  btnVisCOMMA6.enabled := not VarIsNull(iTmpItem);
  btnVisPOCDE6.enabled := not VarIsNull(iTmpItem);
  btnVisPPECH6.enabled := not VarIsNull(iTmpItem);
end;

procedure TfrmTDB_ADMListe.DDF_ECHANTManagerButtonsState;
var
  iTmpItem: Variant;
begin
  iTmpItem := Null;

  if (cxgtvDDF_ECHANT.Controller.SelectedRowCount > 0) then
  begin
    iTmpItem := cxgtvDDF_ECHANT.Controller.SelectedRows[0].Values
      [cxgtvDDF_ECHANTORFAB_ID.Index];
  end;

  btnVisDDF_ECHANT_DMFAB.enabled := not VarIsNull(iTmpItem);
end;

procedure TfrmTDB_ADMListe.DMBAT_TYPE0ManagerButtonsState;
var
  iCDCFO_ID, iDMBAT_ID: Variant;
begin
  iCDCFO_ID := Null;
  iDMBAT_ID := Null;

  if (cxgtvDMBAT_TYPE0.Controller.SelectedRowCount > 0) then
  begin
    iCDCFO_ID := cxgtvDMBAT_TYPE0.Controller.SelectedRows[0].Values
      [cxgtvDMBAT_TYPE0CDCFO_ID.Index];
    iDMBAT_ID := cxgtvDMBAT_TYPE0.Controller.SelectedRows[0].Values
      [cxgtvDMBAT_TYPE0DMBAT_ID.Index];
  end;

  btnVisCDCFO1.enabled := not VarIsNull(iCDCFO_ID);
  btnVisDMBAT1.enabled := not VarIsNull(iDMBAT_ID);
end;

procedure TfrmTDB_ADMListe.DMBAT_TYPE1ManagerButtonsState;
var
  iCDCFO_ID, iDMBAT_ID: Variant;
begin
  iCDCFO_ID := Null;
  iDMBAT_ID := Null;

  if (cxgtvDMBAT_TYPE1.Controller.SelectedRowCount > 0) then
  begin
    iCDCFO_ID := cxgtvDMBAT_TYPE1.Controller.SelectedRows[0].Values
      [cxgtvDMBAT_TYPE1CDCFO_ID.Index];
    iDMBAT_ID := cxgtvDMBAT_TYPE1.Controller.SelectedRows[0].Values
      [cxgtvDMBAT_TYPE1DMBAT_ID.Index];
  end;

  btnVisCDCFO2.enabled := not VarIsNull(iCDCFO_ID);
  btnVisDMBAT2.enabled := not VarIsNull(iDMBAT_ID);
end;

procedure TfrmTDB_ADMListe.btnPCDAGATraiter_RECClick(Sender: TObject);
begin
  try
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    if fQueryRQSQL(qryPCDAG_A_TRAITER, 46771) then // rq = 4677 et old 44191,41412
    begin
      fAjoutFiltre(qryPCDAG_A_TRAITER);
      fQueryOpenNoLimit(qryPCDAG_A_TRAITER);

      PCDAG_A_TRAITERManagerButtonsState;
    end;

  except
    raise;
  end;
end;

procedure TfrmTDB_ADMListe.btnPOCDEDecor_RECClick(Sender: TObject);
begin
  try
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    if fQueryRQSQL(qryPOCDE_DECOR, 46774) then //rq= 46774 et Old = 33829,31823, 30599, 30089
    begin
      fAjoutFiltre(qryPOCDE_DECOR);
      fQueryOpenNoLimit(qryPOCDE_DECOR);

      POCDE_DECORManageButtonsState;
    end;

  except
    raise;
  end;
end;

procedure TfrmTDB_ADMListe.btnPPECHAFaderClick(Sender: TObject);
begin
  try
    // si modification de la RQSQL, v�rifier s'il faut modifier la requ�te de comptage
    // feature/CDE02824 FPE 21/05/2025 Maj regle de gestion
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    if fQueryRQSQL(qryPPECHAFader, 46795) then
    begin //rq= 46795 et  Old = 44945,43501,30603, 29649, 28728;, 27738
      fAjoutFiltre(qryPPECHAFader);
      fQueryOpenNoLimit(qryPPECHAFader);

      PPECHAFaderManageButtonsState;
    end;

  except
    raise;
  end;
end;

procedure TfrmTDB_ADMListe.btnPPECHASolder_RECClick(Sender: TObject);
begin
  try
    // si modification de la RQSQL, voir si besoin de modifier la RQSQL simplifi�e de comptage 44423
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    if fQueryRQSQL(qryPPECHASolder, 46798) then
    // rq= 46798 et Old = 43781,41775, 31806, 30598, 29634, 28717, 27664
    begin
      fAjoutFiltre(qryPPECHASolder);
      qryPPECHASolder.SQL.Add('ORDER BY V_PPECH_QTE.PPECH_DATE');
      fQueryOpenNoLimit(qryPPECHASolder);

      PPECHASolderManageButtonsState;
    end;
  except
    raise;
  end;
end;

procedure TfrmTDB_ADMListe.btnPPECHProdRetard_RECClick(Sender: TObject);
var
  iRQSQL: Integer;
begin
  //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
  iRQSQL := 46799; // rq = 46799 et Old =  42603, 36948,  31704, 30928, 30576, 29632, 28689, 27640
  if TSocietes(_UserHH.Soc_ID) = TSocietes.Soc_SaverglassAustralia then
    //feature/CDE02917 FPE 11/05/2025 Filtre sur dir vte type Secteur/Head sales
    iRQSQL := 46802; // rq= 46802 et Old =  46123,36958, 30929, 30578 31705
  if qryPPECHProdRetard.Active = False then
  begin
    try
      if fQueryRQSQL(qryPPECHProdRetard, iRQSQL) then
      begin // Old = 30603, 29649, 28728;, 27738
        fAjoutFiltre(qryPPECHProdRetard);
        fQueryOpenNoLimit(qryPPECHProdRetard);

        PPECHProdRetardManageButtonsState;
      end;

    except
      raise;
    end;
  end;
end;

procedure TfrmTDB_ADMListe.dxtcAVOIRS_A_VALIDERClick
  (Sender: TdxTileControlItem);
begin
  if bCTRL_ENFONCE then
  begin
    pSauv_Tuiles_Export(Sender);
    Exit;
  end;
  if fTransDroit(fTransId('TfrmVALAVListe'), etFVisu) then
  begin
    ListeEnvoi.ID := 'POReport_FACTU_VALAV';
    ListeEnvoi.Quoi := 'ID';

    fInitListeEnvoi(ListeEnvoi);

    // EXP01364 FPE 15/07/2021 D�brancher sur la fiche Valorisation des BLs/DDLs
    if edtADM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_TRIG', edtADM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtADM_COLLA_NOM', edtADM_COLLA_NOM.Text +
        ' ' + edtADM_COLLA_PRENOM.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnADM_COLLA', '', True, vtNORMAL);
    end;

    if edtCDM_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_TRIG', edtCDM_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtCDM_COLLA_NOM', edtCDM_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnCDM_COLLA', '', True, vtNORMAL);
    end;

    if edtRZA_COLLA_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_TRIG', edtRZA_COLLA_TRIG.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtRZA_COLLA_NOM', edtRZA_COLLA_NOM.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnRZA_COLLA', '', True, vtNORMAL);
    end;

    if edtTIERS_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtFA_TIERS_CODE', edtTIERS_CODE.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtFA_TIERS_RS_L1', edtTIERS_RS_L1.Text,
        True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnFA_TIERS', '', True, vtNORMAL);
    end;
    ListeEnvoi.AddFiltreDebranch('clbVALAV_ST', '0', True, vtCHXFG);
    // Statut En cours

    //feature/CDE02917 FPE 18/05/2025 Filtre sur dir vte type Secteur/Head sales
    if edtDirVen_ID.Text <> EmptyStr then
    begin
      ListeEnvoi.AddFiltreDebranch('edtDirVen_ID', edtDirVen_ID.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_TRIG', edtDirVen_TRIG.Text, True, vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('edtDirVen_NOM_PRENOM', edtDirVen_NOM_PRENOM.Text, True,
        vtNORMAL);
      ListeEnvoi.AddFiltreDebranch('btnDirVen', '', True, vtNORMAL);
    end;
    // Gestion bidouille pour filtrer sur le CDM et le RZA du tiers
    // par ce que ce tableau de bord est devenu une usine � gaz, on doit bidouiller !
    ListeEnvoi.AddFiltre(edtADM_COLLA_ID.Text); // ID = 0
    ListeEnvoi.AddFiltre(edtCDM_COLLA_ID.Text); // ID = 1
    ListeEnvoi.AddFiltre(edtRZA_COLLA_ID.Text); // ID = 2
    ListeEnvoi.AddFiltre(edtRZC_COLLA_ID.Text); // ID = 3
    ListeEnvoi.AddFiltre(edtTIERS_ID.Text); // ID = 4
    ListeEnvoi.AddFiltre(edtZOCOM_ID.Text); // ID = 5

    if bExport_Excel then
      ListeEnvoi.AddFiltre(sExport_XL_FILENAME) // ID = 6
    else
      ListeEnvoi.AddFiltre('');

    ListeEnvoi.bLanceRecherche := True;

    // frmMain.oGestionAffichageEcran.fAfficheListe('TfrmBOLIVListe', Self, etLRecherche, ListeEnvoi, True);
    frmMain.oGestionAffichageEcran.fAfficheListe('TfrmVALAVListe', Self,
      etLRecherche, ListeEnvoi, True);
  end;
end;

procedure TfrmTDB_ADMListe.OFFRE_ST_0ManagerButtonsState;
var
  iOFFRE_ID: Variant;
begin
  iOFFRE_ID := Null;

  if (cxgtvOFFRE_ST_0.Controller.SelectedRowCount > 0) then
  begin
    iOFFRE_ID := cxgtvOFFRE_ST_0.Controller.SelectedRows[0].Values
      [cxgtvOFFRE_ST_0OFFRE_ID.Index];
  end;

  btnVisOFFRE_ST_0.enabled := not VarIsNull(iOFFRE_ID);
end;

procedure TfrmTDB_ADMListe.OFFRE_A_RELANCERManagerButtonsState;
var
  iOFFRE_ID: Variant;
begin
  iOFFRE_ID := Null;

  if (cxgtvOFFRE_A_RELANCER.Controller.SelectedRowCount > 0) then
  begin
    iOFFRE_ID := cxgtvOFFRE_A_RELANCER.Controller.SelectedRows[0].Values
      [cxgtvOFFRE_A_RELANCEROFFRE_ID.Index];
  end;

  btnVisOFFRE_A_RELANCER.enabled := not VarIsNull(iOFFRE_ID);
end;

procedure TfrmTDB_ADMListe.PCDAG_A_TRAITERManagerButtonsState;
var
  iPCDAG_ID: Variant;
begin
  iPCDAG_ID := Null;

  if (cxgtvPCDAG_A_TRAITER.Controller.SelectedRowCount > 0) then
  begin
    iPCDAG_ID := cxgtvPCDAG_A_TRAITER.Controller.SelectedRows[0].Values
      [cxgtvPCDAG_A_TRAITERPCDAG_ID.Index];
  end;

  btnVisCDACG.enabled := not VarIsNull(iPCDAG_ID);
  btnVisPCDAG.enabled := not VarIsNull(iPCDAG_ID);
end;

procedure TfrmTDB_ADMListe.Tarif_AnomalieManagerButtonsState;
var
  iTARIF_ID: Variant;
begin
  iTARIF_ID := Null;

  if (dgTARIF.Controller.SelectedRowCount > 0) then
  begin
    iTARIF_ID := dgTARIF.Controller.SelectedRows[0].Values
      [dgTARIF_TARIF_ID.Index];
  end;

  // btnVisTARIF.Enabled := not VarIsNull(iTARIF_ID);

end;

procedure TfrmTDB_ADMListe.pVisPOCDE(const iPOCDE_ID: string);
begin
  if iPOCDE_ID <> EmptyStr then
  begin
    case TCOMMAClass.fPOCDE_TYP_POSTE(iPOCDE_ID) of
      Produit:
        begin
          frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmPPCDE_VNFiche',
            Self, iPOCDE_ID, etFVisu);
        end;
      StandardParacheve, Paracheve:
        begin
          frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmPPCDE_PARACHFiche',
            Self, iPOCDE_ID, etFVisu);
        end;
    end;
  end;
end;

procedure TfrmTDB_ADMListe.pVisPPECH(const iPOCDE_ID: string);
var
  oFrmPPCDE_VNFiche: THackfrmPPCDE_VNFiche;
  oFrmPPCDE_PARACHFiche: THackfrmPPCDE_PARACHFiche;
begin
  if (iPOCDE_ID <> EmptyStr) then
  begin
    case TCOMMAClass.fPOCDE_TYP_POSTE(iPOCDE_ID) of
      Produit:
        begin
          // Produit VN
          oFrmPPCDE_VNFiche := THackfrmPPCDE_VNFiche
            (frmMain.oGestionAffichageEcran.fAfficheFiche('TfrmPPCDE_VNFiche',
            Self, iPOCDE_ID, etFVisu));
          if oFrmPPCDE_VNFiche = nil then
            Exit;

          // Affichage de l'onglet �ch�ancier
          if oFrmPPCDE_VNFiche.btnZOOM_PPECH_PPCDE.enabled then
            oFrmPPCDE_VNFiche.btnZOOM_PPECH_PPCDE.Click;
        end;
      Paracheve, StandardParacheve:
        begin
          // Produit Standard parachev� / Parachev� Sp�cifique
          oFrmPPCDE_PARACHFiche := THackfrmPPCDE_PARACHFiche
            (frmMain.oGestionAffichageEcran.fAfficheFiche
            ('TfrmPPCDE_PARACHFiche', Self, iPOCDE_ID, etFVisu));
          if oFrmPPCDE_PARACHFiche = nil then
            Exit;

          // Affichage de l'onglet �ch�ancier
          if oFrmPPCDE_PARACHFiche.btnZOOM_PPECH_PPCDE.enabled then
            oFrmPPCDE_PARACHFiche.btnZOOM_PPECH_PPCDE.Click;
        end;
    end;
  end;
end;

function TfrmTDB_ADMListe.fGET_ADMIN_EXPORT_TUILES(sCOLLA_TRIG: string)
  : Boolean; // CDE02589
var
  sCOLLA_AUTOR: string;
begin
  sCOLLA_AUTOR := fgParam('COLLA_TRIG_AUTOR_SEL_TDB');
  Result := Pos(sCOLLA_TRIG, sCOLLA_AUTOR) > 0;
end;

procedure TfrmTDB_ADMListe.pSauv_Tuiles_Export(sTUILE: TdxTileControlItem);
// CDE02589
var
  oQuery: TUniQuery;
  nNewId: Integer;
  sSEQ_TUICK_ID: string;
  i: Integer;
begin
  dxtcTiles.BeginUpdate;
  sTUILE.checked := not(sTUILE.checked);
  dxtcTiles.EndUpdate;

  oQuery := TUniQuery.Create(nil);
  try
    dmdConnect.cntMain.StartTransaction;
    try
      if fQueryRQSQL(oQuery, 41590) then  //rq= 41590 et old = 41590
      begin
        fQueryDeclareParameterType(oQuery, 'iSOCIE_ID', ftInteger,
          IntToStr(_UserHH.Soc_ID));
        fQueryDeclareParameterType(oQuery, 'sTUICK_DES', ftString, sTUILE.name);
        fQueryOpen(oQuery, True);
      end;

      if sTUILE.checked then
      begin
        if fORASequence('GEN_TUICK_ID', nNewId) then
        begin
          sSEQ_TUICK_ID := IntToStr(nNewId);
        end;
        if fQueryRQSQL(oQuery, 41591) then
        begin
          fQueryDeclareParameterType(oQuery, 'iTUICK_ID', ftInteger,
            sSEQ_TUICK_ID);
          fQueryDeclareParameterType(oQuery, 'sTUICK_DES', ftString,
            sTUILE.name);
          fQueryDeclareParameterType(oQuery, 'iSOCIE_ID', ftInteger,
            IntToStr(_UserHH.Soc_ID));
          fQueryDeclareParameterType(oQuery, 'sCOLMOD', ftString, fGetUser);
          fQueryDeclareParameterType(oQuery, 'sCOLCRE', ftString, fGetUser);
          fQueryOpen(oQuery, True);
        end;
      end;

      sTEMP_TUILES_CHECK := '';
      i := 0;
      while i < dxtcTiles.items.count do
      begin
        if dxtcTiles.items[i].checked then
        begin
          if sTEMP_TUILES_CHECK = '' then
            sTEMP_TUILES_CHECK := dxtcTiles.items[i].name
          else
            sTEMP_TUILES_CHECK := sTEMP_TUILES_CHECK + ';' +
              dxtcTiles.items[i].name;
        end;
        i := i + 1;
      end;

      dmdConnect.cntMain.Commit;

    except
      dmdConnect.cntMain.Rollback;
      raise;
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;

procedure TfrmTDB_ADMListe.pCheck_Tuiles_Export_Fast;
var
  i: Integer;
begin
  i := 0;
  dxtcTiles.BeginUpdate;
  while i < dxtcTiles.items.count do
  begin
    if Pos(dxtcTiles.items[i].name, sTEMP_TUILES_CHECK) > 0 then
      dxtcTiles.items[i].checked := True;
    i := i + 1;
  end;
  dxtcTiles.EndUpdate;

end;

{$IFNDEF __ORA__}

procedure TfrmTDB_ADMListe.pCheck_Tuiles_Export; // CDE02589
begin
  sTEMP_TUILES_CHECK := '';
  dxtcTiles.BeginUpdate;
  var
  dic := TDictionary<string, Integer>.Create(TIStringComparer.Ordinal);
  var
  oQuery := TUniQuery.Create(nil);
  try
    // copier les donn�es dans un dictionnaire
    oQuery.SQL.Text :=
      'SELECT tuick_des FROM tuick WHERE tuick_socie_id=:iSocie_id';
    fQueryDeclareParameterType(oQuery, 'iSocie_id', ftInteger, _UserHH.Soc_ID);
    fQueryOpen(oQuery);
    while not oQuery.eof do
    begin
      dic.AddOrSetValue(oQuery.FieldByName('tuick_des').AsString, 1);
      oQuery.Next;
    end;

    for var i := 0 to dxtcTiles.items.count - 1 do
    begin
      dxtcTiles.items[i].checked := False;
      if dxtcTiles.items[i].Visible then
      begin
        dxtcTiles.items[i].checked := dic.ContainsKey(dxtcTiles.items[i].name);
      end;
    end;

    sTEMP_TUILES_CHECK := string.Join(';', dic.Keys.ToArray);

  finally
    FreeAndNil(oQuery);
    dic.Free;
    dxtcTiles.EndUpdate;
  end;
end;

{$ELSE}

procedure TfrmTDB_ADMListe.pCheck_Tuiles_Export; // CDE02589
var
  oQuery: TUniQuery;
  nNewId: Integer;
  i: Integer;
  sSEQ_TUICK_ID: string;
begin
  sTEMP_TUILES_CHECK := '';
  dxtcTiles.BeginUpdate;
  oQuery := TUniQuery.Create(nil);
  try
    i := 0;
    while i < dxtcTiles.items.count do
    begin
      dxtcTiles.items[i].checked := False;
      if dxtcTiles.items[i].Visible then
      begin
        if fQueryRQSQL(oQuery, 41595) then
        begin
          fQueryDeclareParameterType(oQuery, 'sTUICK_DES', ftString,
            dxtcTiles.items[i].name);
          fQueryDeclareParameterType(oQuery, 'iSOCIE_ID', ftInteger,
            IntToStr(_UserHH.Soc_ID));
          fQueryOpen(oQuery);
          if not oQuery.isempty then
          begin
            oQuery.First;
            if fGetValueI(oQuery, 'NBRE') > 0 then
            begin
              dxtcTiles.items[i].checked := True;
              if sTEMP_TUILES_CHECK = '' then
                sTEMP_TUILES_CHECK := dxtcTiles.items[i].name
              else
                sTEMP_TUILES_CHECK := sTEMP_TUILES_CHECK + ';' +
                  dxtcTiles.items[i].name;
            end;
          end;
        end;
      end;
      i := i + 1;
    end;

  finally
    dxtcTiles.EndUpdate;
    FreeAndNil(oQuery);
  end;
end;
{$ENDIF}

procedure TfrmTDB_ADMListe.pExport_Tuile(sTUILE: TdxTileControlItem);
// CDE02589
var
  i: Integer;
  Containeur: tWinControl;
begin
  Containeur := sTUILE.DetailOptions.DetailControl;
  i := 0;
  while i < Containeur.Controlcount do
  begin
    if uppercase(Containeur.Controls[i].ClassName) = 'TCXGRID' then
    begin
      TcxGridDBTableView(TcxGrid(Containeur.Controls[i]).Views[0]).BeginUpdate;
      TcxGridDBTableView(TcxGrid(Containeur.Controls[i]).Views[0])
        .Styles.StyleSheet := nil;

      ExportGridToXLSX(sExport_XL_FILENAME, TcxGrid(Containeur.Controls[i]));
      TcxGridDBTableView(TcxGrid(Containeur.Controls[i]).Views[0])
        .Styles.StyleSheet :=
        dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral;
      TcxGridDBTableView(TcxGrid(Containeur.Controls[i]).Views[0]).EndUpdate;
      i := Containeur.Controlcount;
    end;
    i := i + 1;
  end;

end;

Initialization

RegisterClass(TfrmTDB_ADMListe);

Finalization

UnregisterClass(TfrmTDB_ADMListe);

end.
