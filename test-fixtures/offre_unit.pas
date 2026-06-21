unit Offre_Unit;

interface

uses  Uni, FonctionsGen_Unit, DB, SysUtils, Type_Unit,
sMail_Unit, System.Classes, WS_EDITIONS_Unit, StrUtils, FonctionsSup_Unit,
dxmdaset, Generics.Collections, Generics.Tuples, Vcl.StdCtrls, System.Math;

const
  // OFFPR_ST
  Cst_OFFPR_ST_0_Encours               = 0;
  Cst_OFFPR_ST_1_Emis                  = 1;
  Cst_OFFPR_ST_2_Valide_en_commande    = 2;
  Cst_OFFPR_ST_3_Non_abouti            = 3;
  Cst_OFFPR_ST_4_Annule                = 4;
  Cst_OFFPR_ST_5_En_attente_Derogation = 5;

  // OFFRE_ST
  Cst_OFFRE_ST_0_Encours               = 0;
  Cst_OFFRE_ST_1_Emis                  = 1;
  Cst_OFFRE_ST_2_Valide_en_commande    = 2;
  Cst_OFFRE_ST_3_Non_abouti            = 3;
  Cst_OFFRE_ST_4_Validee_client        = 4;
  //Cst_OFFRE_ST_5_En_attente_Derogation = 5;

  // LOFPR_NAT
  CstLOFPR_NAT_Inconnu         = -1;
  CstLOFPR_NAT_0_Catalogues    = 0;
  CstLOFPR_NAT_1_Verre_nu      = 1;
  CstLOFPR_NAT_2_Parachevement = 2;
  CstLOFPR_NAT_3_Autres        = 3;
  // LOFPR_TYPE_LIGNE
  CstLOFPR_TYPE_LIGNE_1_Catalogue = 1;
  CstLOFPR_TYPE_LIGNE_2_Divers    = 2;
  // TestDerogation
  cstRien = -1;
  cstNon  = 0;
  cstOui  = 1;
  // PRCDT_TYP
  cstPRCDT_VN = 0;
  cstPRCDT_DECO = 1;

  cstSTRPI_ID = 20;


  Cst_0_LOFPR_FLG_SELECT_Cotation                = 0;
  Cst_1_LOFPR_FLG_SELECT_Standard_price_list     = 1;
  Cst_2_LOFPR_FLG_SELECT_Produit_divers          = 2;
  Cst_3_LOFPR_FLG_SELECT_Tarif_zone_de_transport = 3;
  Cst_4_LOFPR_FLG_SELECT_Designations            = 4;


type
  // THMOPR_TYP
  THMOPR_TYP = (THMOPR_TYPNone = -1, THMOPR_TYPStatut = 0,
                THMOPR_TYPVersion = 1, THMOPR_TYPDateRelance = 2,
                THMOPR_TYPDerogation = 3);
  TTypeDmdDerog = (tDmdDerogVNDansLaTranche = 0, tDmdDerogVNInfCinqPour, tDmdDerogDECOR);

  TEtatLOFPR = Record
    EtatLOFPR_Catalogues: TEtat;
    EtatLOFPR_VN        : TEtat;
    EtatLOFPR_DECOR     : TEtat;
    EtatLOFPR_DIVERS    : TEtat;
  end;

  TDATAS_LOFPR_Ligne = Record
    iLOFPR_FLG_CHECK_PL   : Integer;
    iLOFPR_NUM            : Integer;
    nLOFPR_NAT            : Integer;
    iLOFPR_TYPE_LIGNE     : Integer;
    sLOFPR_MODEL_ID       : String;
    sMODEL_CODE           : String;
    sMODEL_DES            : String;
    sLOFPR_DESIGNATION    : String;
    sLOFPR_DESIGNATION_EN : String;
    sBAGEN_DES            : String;
    sTEINT_DES            : String;
    sTYPEM_CODE           : String;
    semb                  : String;
    iqte_pal              : Integer;
    sTYPAL_SHORT_DES      : String;
    sRemarques            : String;
    sLOFPR_PAL            : String;
    sLOFPR_QTE            : String;
    sLOFPR_PRIX_UNITAIRE  : String;
    sLOFPR_TX_MAJORATION  : String;
    sLOFPR_TX_REMISE      : String;
    sLOFPR_PRIX_NET       : String;
    smontant              : String;
    sLOFPR_COMMENTAIRE    : String;
    sLOFPR_COMMENTAIRE_EN : String;
    sLOFPR_CMNT_TARIF     : String;
    sLOFPR_BAGEN_ID       : String;
    sLOFPR_TEINT_ID       : String;
    sLOFPR_PALTI_ID       : String;
    sLOFPR_PRIX_MAJORE    : String;
    sLOFPR_DICAT_ID       : String;
    sLOFPR_DISPO          : String;
    sLOFPR_TYPEM_ID       : String;
    sLOFPR_TRANC_ID       : String;
    sLOFPR_PRCDT_ID       : String;
    sLOFPR_PRCDT_TYP      : String;
    sLOFPR_PRCDT_DES      : String;
    sPRCDT_DISPO_DES      : String;
    sLOFPR_PLCOD_CODE     : String;
    sLOFPR_TRGEN_CODE     : String;
    sLOFPR_PRX_TARIF      : String;
    sTRANC_DES            : String;
    dPRX_GLOBAL           : Double;
    sLOFPR_FAMIL_ID       : String;
    iLOFPR_FLG_REMISE_EDT : Integer;
    sLOFPR_CDECO_ID       : String;
    sCDECO_NUM            : String;
    sCDECO_DES            : String;
    sLLOST_LOFPR_ID       : String;
    sLOFPR_PDDIV_ID       : String;
    sPDDIV_CODE           : String;
    sPDDIV_DES            : String;
    sLOFPR_ZOTRF_ID       : String;
    sLOFPR_TRZTF_ID       : String;
    sZOTRF_DES            : String;
    sTRZTF_ID             : String;
    iLOFPR_FLG_SELECT     : Integer;
  end;

  TDATAS_PRIX = Record
    NB_PAL               : String;
    TRANC_QTE            : Integer;
    TRANC_DES            : String;
    TRANC_TYP            : Integer;
    PRCDT_NB_COLS_PAL    : Integer;
    PRX_GLOBAL           : String;
    PRX_VERRE            : String;
    PRX_PARACH           : String;
    PRX_TRANSP           : String;
  end;

  TDATAS_CDECO = Record
    QTGAM_ID             : String;
    PCOTD_SEQ            : String;
    QTGAM_QTE            : String;
    QTGAM_PV_REF         : String;
  end;

  TOFFPR_Infos = Record
    piOFFPR_ID                   : Integer;
    piOFFPR_ST                   : Integer;
    piOFFPR_TARIF_UNIQ_ID        : Integer;
    piOFFPR_TIERS_ID             : Integer;
    psTIERS_RS_L1                : String;
    pdOFFPR_DATE_RELANCE         : TDateTime;
    pdOFFPR_DATE_EMISSION        : TDateTime;
    pbOFFPR_FLG_RPI              : Boolean;
    psOFFPR_TIERS_ADR1           : String;
    psOFFPR_TIERS_ADR2           : String;
    psOFFPR_TIERS_CODEP          : String;
    psOFFPR_TIERS_VILLE          : String;
    psOFFPR_TIERS_PAYS           : String;
    psOFFPR_CONDITIONS_GEN       : String;
    psOFFPR_CONDITIONS_GEN_EN    : String;
    piOFFPR_LANGU_ID             : Integer;
    piOFFPR_TYRPI_ID             : Integer;
    piADM_COLLA_ID               : Integer;
    piCDM_COLLA_ID               : Integer;
    piDVISE_ID                   : Integer;
    piCOLLA_SIGN_ID              : Integer;
    psOFFPR_FRAIS_DEVEL_DECOR    : string;
    psOFFPR_CMNT_DEVEL_DECOR     : string;
    psOFFPR_CMNT_DEVEL_DECOR_EN  : string;
    piOFFPR_SOCIE_ID             : Integer;
    psOFFPR_OBJET                : string;
    piOFFPR_CLT_FINAL_TIERS_ID   : Integer;
    piOFFPR_ZOCOM_ID             : Integer;
    piOFFPR_FLG_RELANCE          : Integer;
    pdOFFPR_DATE_VALIDITE_PRIX   : TDateTime;
    piOFFPR_POTENTIEL_QTE        : Integer;
    piOFFPR_RANTR_ID             : Integer;
    psOFFPR_NAB_CMNT             : string;
    piOFFPR_POTENTIEL_QTE_UNITE  : Integer;
    psCONTA_NOM, psCONTA_FONCTION:string;
  End;

  TTIERS_Infos = Record
    piTIERS_ID     : Integer;
    psTIERS_RS     : String;
    psTIERS_ADR1   : String;
    psTIERS_ADR2   : String;
    psTIERS_CODEP  : String;
    psTIERS_VILLE  : String;
    psTIERS_PAYS   : String;
  End;

  THOFPR_Infos = record
    piHOFPR_OFFPR_ID     : Integer;
    piH1OFPR_NUM_RELANCE : Integer;
    pdHOFPR_DATE_RELANCE : TDateTime;
    psHOFPR_CMNT         : String;
    pdHOFPR_DATECRE      : TDateTime;
    pdHOFPR_DATEMOD      : TDateTime;
    psHOFPR_COLMOD       : String;
    piHOFPR_COLLA_ID     : Integer;
  end;

  TList_HOFPR_Infos = TList<THOFPR_Infos>;

  TLOFPR_Infos = record
    piLOFPR_ID             : Integer;
    piLOFPR_OFFPR_ID       : Integer;
    piLOFPR_FLG_CHECK_PL   : Integer;
    piLOFPR_NUM            : Integer;
    piLOFPR_MODEL_ID       : Integer;
    piLOFPR_CDECO_ID       : Integer;
    psCDECO_DES            : String;
    piCDCFO_ID             : Integer;
    piCDCFO_NUM            : Integer;
    psCDCFO_DES            : String;
    psMODEL_CODE           : String;
    psMODEL_DES            : String;
    psLOFPR_COMMENTAIRE    : String;
    psLOFPR_COMMENTAIRE_EN : String;
    piLOFPR_BAGEN_ID       : Integer;
    psBAGEN_CODE           : String;
    psBAGEN_DES            : String;
    piLOFPR_TEINT_ID       : Integer;
    psTEINT_DES            : String;
    pnLOFPR_QTE            : Integer;
    pnLOFPR_PRIX_UNITAIRE  : Integer;
    pnLOFPR_TX_MAJORATION  : Double;
    pnLOFPR_TX_REMISE      : Double;
    pnLOFPR_PRIX_NET       : Double;
    psTYPEM_CODE           : String;
    psLOFPR_DESIGNATION    : String;
    psLOFPR_DESIGNATION_EN : String;
    piLOFPR_TYPE_LIGNE     : Integer;
    pnLOFPR_PRIX_MAJORE    : Integer;
    pnLOFPR_PRIX_NET_TRPT  : Integer;
    pdLOFPR_DATECRE        : TDateTime;
    pdLOFPR_DATEMOD        : TDateTime;
    psLOFPR_COLMOD         : String;
    piLOFPR_SUP            : Integer;
    piLOFPR_NAT            : Integer;
    piLOFPR_DICAT_ID       : Integer;
    psDICAT_DES            : String;
    psLOFPR_OBSV           : String;
    piLOFPR_DISPO          : Integer;
    psLOFPR_DISPO_DES      : String;
    piLOFPR_TYPEM_ID       : Integer;    
    piLOFPR_TRANC_ID       : Integer;
    psTRANC_DES            : String;
    psLOFPR_CMNT_TARIF     : String;
    pnLOFPR_PRX_TARIF      : Integer;
    psMODEL_ST_COM         : String;
    piPRCDT_ID             : Integer;
    piPRCDT_TYP            : Integer;
    psPRCDT_DES            : String;
    pnPRCDT_NB_COLS_PAL    : Integer;
    psPLCOD_CODE           : String;
    psTRGEN_CODE           : String;
    psTYPAL_SHORT_DES      : String;
    piLOFPR_FLG_REMISE_EDT : Integer;
    pnPRX_GLOBAL           : Double;
    piTypeDmdDerog         : Integer;
    psCDECO_NUM            : String;
    piLLOST_LOFPR_ID       : Integer;
    psPROCT_DES            : String;            
    piLOFPR_PDDIV_ID       : Integer;
    psPDDIV_CODE           : String;    
    psPDDIV_DES            : String;            
    piLOFPR_ZOTRF_ID       : Integer;
    psZOTRF_DES            : String;
    psPDTEM_DES            : String;
    piLOFPR_TRZTF_ID       : Integer;
    piLOFPR_FAMIL_ID       : Integer;
    piLOFPR_FLG_SELECT     : Integer;

  end;

  TList_LOFPR_Infos = TList<TLOFPR_Infos>;

  t_DATAS_OFFPR_COLLA = Record
    iOFFPR_OFFPDF_BLOB_ID : INTEGER;
    iOFFPR_RPIPDF_BLOB_ID : INTEGER;
    iCOLLA_ADM_ID         : INTEGER;
    iCOLLA_CDM_ID         : INTEGER;
    iRZCDM_DIR2_COLLA_ID  : INTEGER;
    iRZCDM_RZC_COLLA_ID   : INTEGER;
    iOFFPR_LANGU_ID       : INTEGER;
  end;

function fGet_DATAS_OFFPR_COLLA(piOFFPR_ID : Integer) : t_DATAS_OFFPR_COLLA;
function fActiveDerogation(piFAMIL_ID : Integer; sParamDerog : String) : Boolean;
function fTestDerogation(iOFFPR_ID : Integer; sTrans_nom : String = '') : Tuples<TTypeDmdDerog, Integer>;
function fSupprimerLignesAvecRetourALaLigne(const aTexte: string): string;
function fControleEmissionOFFPR(piOFFPR_ID: Integer): String;
procedure pHistoriser_ST_VERSI(
      piOFFPR_ID : Integer;
      piType : Integer;
      psNouvelle_valur : String;
      psAncienne_valur : String;
      piSID_SOURCE : Integer;
      psCOMMENTAIRE : String = '';
      psCOLMOD : String  = ''
    );
procedure pHistoriser_ST_VERSI_OFFRE(
      piOFFRE_ID : Integer;
      piType : Integer;
      psNouvelle_valur : String;
      psAncienne_valur : String;
      piSID_SOURCE : Integer;
      psCOMMENTAIRE : String = '';
      psCOLMOD : String  = ''
    );
procedure pEmissionOFFPR(piOFFPR_ID: Integer; var deOFFPR_DATE_RELANCE:
    TDateTime; bCtrSaisie: Boolean; pbETAT_NAB: Boolean = False; Form:
    THadHocFormFiche = Nil);
function fTestProduitLeader(piOFFPR_ID: Integer): Boolean;
procedure fMAJStatut(piOFFPR_ID, piOFFPR_ST, aNouveauStatut: Integer;
    bETAT_NAB: Boolean; psCommentaire: string = '');
procedure fMAJStatutOFFRE(piOFFRE_ID, piOFFRE_ST, aNouveauStatut: Integer;
    bETAT_NAB: Boolean; psCommentaire: string = '');
procedure fMaj_OFFPR(piOFFPR_ID, piSID_SOURCE: Integer);
function envoi_mails(piOFFPR_ID, piOFFPR_LANGU_ID: Integer; pbOFFPR_FLG_RPI:
    Boolean): boolean;
procedure impression_rpi(vdemat: boolean; piOFFPR_ID, piOFFPR_LANGU_ID:
    Integer);
procedure impression_offre(vdemat: boolean; piOFFPR_ID, piOFFPR_LANGU_ID:
    Integer);
function fCheckModelsRPI(piOFFPR_ID: Integer): Integer;
procedure fMaj_OFFPR_DATE_RELANCE(piOFFPR_ID: integer; pDate: TDATE;
    pOFFPR_FLG_RELANCE: integer);
function fCountLOFPR_ID(piOFFPR_ID : Integer) : Integer;
procedure fModificationOFFPR(var prOFFPR_Infos: TOFFPR_Infos; piLOFPR_ID:
    Integer = -1; piLOFPR_NUM: Integer = -1; pbETAT_NAB: boolean = False);
function recherche_TXRPI(ILANGU_ID: integer; ITYRPI_ID: integer): integer;
procedure pCheckProduitLeader(piOFFPR_ID, piLOFPR_ID: Integer; piLOFPR_NUM:
    Integer = -1);
function fgetMaxDateRelHOFPR(piOFFPR_ID: Integer; pddeOFFPR_DATE_EMISSION:
    TDateTime): Tdate;
function fRemplirOFFPR_Info(piOFFPR_ID: Integer): TOFFPR_Infos;
function fRemplirListeLOFPR_Infos(piOFFPR_ID: Integer): TList_LOFPR_Infos;
function fRemplirListeLOFPR_InfosBIS(piOFFPR_ID: Integer): TList_LOFPR_Infos;
function fRemplirListeHOFPR_Infos(piOFFPR_ID: Integer): TList_HOFPR_Infos;
procedure InsertionNouvellesLignes(var MaList_LOFPR_Infos: TList_LOFPR_Infos);
procedure InsertionNouvellesLignesRelances(var MaList_HOFPR_Infos:
    TList_HOFPR_Infos);
function fRechercheMontantOffre(piOFFPR_ID: Integer): string;
  procedure pMajChampsOFFPR_ST_NON_ABOUTI(piOFFPR_ID: Integer; piOFFPR_RANTR_ID: Integer; psOFFPR_NAB_CMNT: string; psOFFPR_COLMOD: string);
  procedure pMajChampsOFFRE_ST_NON_ABOUTI(piOFFRE_ID: Integer; piOFFRE_RANTR_ID: Integer; psOFFRE_NAB_CMNT: string; psOFFRE_COLMOD: string);
  function fCtrlValeurOFFPR(piOFFPR_ID: Integer): Boolean;
  procedure pImpressionEtat(ETAT : TWSETAT; vdemat: boolean; piLANGU_ID : Integer; piOFFPR_ID : Integer);
  procedure pgenereFBLOB(piOFFPR_ID : Integer; piLANGU_ID : Integer; pbOFFPR_FLG_RPI : Boolean);
  function fEnvoiMailDemandeDeDerogation(piOFFPR_ID : Integer; piCOLLA_ID : Integer; pTTypeDmdDerog : TTypeDmdDerog) : Boolean;
  function fEnvoiMailRefusDeDerogation(piOFFPR_ID : Integer; piCOLLA_ID : Integer) : Boolean;
  procedure pMAJ_OFFPR_ST(piOFFPR_ID : Integer; piOFFPR_ST : Integer; piCOLLA_ID : Integer; psCOMMENTAIRE : String = '');
  function fRemplirTIERS_Infos(piTIERS_ID : Integer) : TTIERS_Infos;
  procedure pChargeCollaRelance(piOFFPR_ID: Integer;
                                var piCOLLA_ID: Integer;
                                var psCOLLA_TRIG: String;
                                var psCOLLA_NOM_PRENOM: String);
  function fformatCommentaireOFFPR_ST(piOFFPR_ST_SOURCE : Integer; piOFFPR_ST_CIBLE : Integer) : String;                                
  procedure pThouthandSeparator(Sender: TObject);
  procedure pDeleteSeparator(Sender: TObject) ; overload;
  procedure pDeleteSeparator(var S : String); overload;
  function fDeleteSeparator(S: String): String;
  procedure pDataToDataset(var dxmdLOFPROnglet: TdxMemData; var rDATAS_LOFPR_Ligne: TDATAS_LOFPR_Ligne; sType : String = 'Modif');
  procedure pChargeRecordDATAS(owner : Tobject; var rDATAS_LOFPR_Ligne: TDATAS_LOFPR_Ligne);
  procedure pAjouterLigne(owner : Tobject; dxmdLOFPROnglet : TdxMemData; var rDATAS_LOFPR_Ligne: TDATAS_LOFPR_Ligne; nLOFPR_NAT : Integer);
  procedure pModifLigne(owner : Tobject; dxmdLOFPROnglet : TdxMemData; var rDATAS_LOFPR_Ligne: TDATAS_LOFPR_Ligne; iLOFPR_ID: Integer; nLOFPR_NAT : Integer);  
  procedure psetInfoPRCTF(sPRCDT_ID: string; sTARIF_ID: string;var rDATAS_LOFPR_Ligne: TDATAS_LOFPR_Ligne);
  procedure pChargeDATAS(owner : TObject; dxmdLOFPROnglet : TdxMemData ; nLOFPR_NUM: Integer);
  procedure pChargeDatasCDECO(owner : TObject);
  function fChargeCDECO_Tranche_tarifaire(sCDECO_ID, sQTE: string): TDATAS_CDECO;
  function fINSERT_LOFPR_STDPL( iSTDPL_ID : Integer; iLOFPR_ID : Integer): Integer;
  function fTEST_LLOST_EXIST(iSTDPL_ID, iLOFPR_ID : Integer): Boolean;
  function fget_ELREP_PDS_VALIDE(iDMCOT_ID : Integer): String;
  procedure pHOFREHistorise_Relance(iOFFRE_ID, iCOLLA_ID : Integer; sHOFRE_CMNT, sHOFRE_DATE_RELANCE : String);
  function fGetRecordCount_HOFRE(iOFFRE_ID : Integer): Integer;

  function fCalculSommeOFFRE(iOFFRE_ID: Integer): String;

  function fCalculPRIX_VENTE(iOFFRE_ID: Integer): String;


function fcalculLOFPR_PRIX_NET(iLOFPR_ID: string; toto: string): Extended;







implementation
uses
  Connexion_dmd, 
   OFFPR_Fiche_frm,
   LOFPR_VN_Fiche_ong,
   LOFPR_PAR_Fiche_ong,
   LOFPR_DIVERS_Fiche_ong;


function fGet_DATAS_OFFPR_COLLA(piOFFPR_ID : Integer) : t_DATAS_OFFPR_COLLA;
var
  oProc : TUNIStoredProc;
  v_DATAS : t_DATAS_OFFPR_COLLA;
begin
  Result := v_DATAS;
  oProc := fCreateStoredProc('PKG_OFFRE.fGet_DATAS_OFFPR_COLLA', dmdConnect.cntMain);
  try
    fProcDeclareParameterType(oProc, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
    oProc.ExecProc;
    if oProc.GetResult then
    begin
      Result.iOFFPR_OFFPDF_BLOB_ID := oProc.ParamByName('iOFFPR_OFFPDF_BLOB_ID').AsInteger;
      Result.iOFFPR_RPIPDF_BLOB_ID := oProc.ParamByName('iOFFPR_RPIPDF_BLOB_ID').AsInteger;
      Result.iCOLLA_ADM_ID         := oProc.ParamByName('iCOLLA_ADM_ID').AsInteger;
      Result.iCOLLA_CDM_ID         := oProc.ParamByName('iCOLLA_CDM_ID').AsInteger;
      Result.iRZCDM_DIR2_COLLA_ID  := oProc.ParamByName('iRZCDM_DIR2_COLLA_ID').AsInteger;
      Result.iRZCDM_RZC_COLLA_ID   := oProc.ParamByName('iRZCDM_RZC_COLLA_ID').AsInteger;
      Result.iOFFPR_LANGU_ID       := oProc.ParamByName('iOFFPR_LANGU_ID').AsInteger;
    end;
  except
    on E: Exception do
    begin
      Result := v_DATAS;
    end;
  end;
end;
// fActiveDerogation :
// paramètre :
// piFAMIL_ID : id de la famille
// sParamDerog : paramètre de la table PARAM
// retourne True si la famille id parmi la liste de la table PARAM = piFAMIL_ID
function fActiveDerogation(piFAMIL_ID : Integer; sParamDerog : String) : Boolean;
var
  sListFAMIL_ID: string;
  sListFAMIL_ID_Split: TStringList;
  oQuery : TUNIQuery;
  i : Integer;
begin
  Result := False;
  sListFAMIL_ID := fgParam(sParamDerog);
  sListFAMIL_ID_Split := TStringList.Create;
  sListFAMIL_ID_Split.Delimiter := ',';
  sListFAMIL_ID_Split.DelimitedText := sListFAMIL_ID;

  oQuery := TUNIQuery.Create(nil);
  try

    for i := 0 to sListFAMIL_ID_Split.Count - 1 do
    begin

      if sListFAMIL_ID_Split[i] <> '' then
      begin

        if piFAMIL_ID = StrToInt(sListFAMIL_ID_Split[i]) then
        begin
          Result := True;
          break;
        end;  

      end;

    end;
  finally
    oQuery.Free;
  end;

end;

// fTestDerogation : teste si un poste d'offre doit passer en derogation
// Si -1 (cstRien) : Passe au statut "Emis"
// Si 0 (cstNon)   : Ne rien faire
// Si 1 (cstOui)   : Passe au statut "En attente de derogation"
//    Condition de derogation :
//    - VN : si le "prix Net" du poste est < au prix au mille de la tranche la moins chere (la derniere tranche) alors le poste doit passer en derogation
//    - Decor : si le "taux de remise" du poste est > 10% alors le poste doit passer en derogation
function fTestDerogation(iOFFPR_ID : Integer; sTrans_nom : String = '') : Tuples<TTypeDmdDerog, Integer>;
var
  inc, iPRCDT_ID, iLOFPR_NUM,iLOFPR_NAT, iTypeDmdDerog
  ,iCDECO_ID, iLLOST_LOFPR_ID  : Integer;
  sPRCDT_DES,sCDECO_NUM,sCDECO_DES, sPROCT_DES, 
  smessageErreur, smessageErreurInterne: String;
  nLOFPR_PRIX_NET, nPRX_GLOBAL: Double;
  bDerogation, bActiveDerog : Boolean;
  MessageContext : TMessageContext;
  List_LOFPR_Infos : TList_LOFPR_Infos;

  procedure pFormatMessageVN(iPRCDT_ID : Integer;
                           sPRCDT_DES : string;
                           nLOFPR_PRIX_NET: Double;
                           var smessageErreurInterne : String;
                           var bDerogation : Boolean);
  var
    sFormat : String;
  begin
    smessageErreurInterne := '';
    bDerogation := True;
    sFormat := Format(fGetMessage(MessageContext, 'RegeleAutoriseRemiseInterne'),
    [
      iLOFPR_NUM.ToString()+ ' ',
      iPRCDT_ID.ToString + ' ' + sPRCDT_DES,
      nLOFPR_PRIX_NET.ToString()
    ]);
    if smessageErreurInterne = EmptyStr then
      smessageErreurInterne := sFormat
    else
      smessageErreurInterne := smessageErreurInterne + CRLF + sFormat;
  end;
  procedure pFormatMessageDECOR(iCDECO_ID : Integer;
                           sCDECO_NUM : string;
                           sCDECO_DES:  string;
                           iLLOST_LOFPR_ID : Integer;
                           sPROCT_DES : string;
                           var smessageErreurInterne : String;
                           var bDerogation : Boolean);
  var
    sFormat : String;
  begin
    smessageErreurInterne := '';
    bDerogation := True;

    if iCDECO_ID > 0 then
    begin
        sFormat := Format(fGetMessage(MessageContext, 'RegeleAutoriseRemiseInterne'),
        [
        iLOFPR_NUM.ToString()+ ' ',
        sCDECO_NUM + ' ' + sCDECO_DES,
        nLOFPR_PRIX_NET.ToString()
        ]);   
    end;

    if iLLOST_LOFPR_ID > 0 then
    begin
        sFormat := Format(fGetMessage(MessageContext, 'RegeleAutoriseRemiseInterne'),
        [
        iLOFPR_NUM.ToString()+ ' ',
        iLLOST_LOFPR_ID.ToString ,
        nLOFPR_PRIX_NET.ToString()
        ]);   
    end;

    if smessageErreurInterne = EmptyStr then
      smessageErreurInterne := sFormat
    else
      smessageErreurInterne := smessageErreurInterne + CRLF + sFormat;
  end;


begin

  Result.Item1 := tDmdDerogVNDansLaTranche;
  Result.Item2 := cstRien;

  MessageContext.Module := 'Gclog';
  MessageContext.Transaction := 'OFFPR';
  MessageContext.Context := 'Fiche';

  // scanner les postes d'offre
  bDerogation := False;
  List_LOFPR_Infos := TList_LOFPR_Infos.Create;
  List_LOFPR_Infos := fRemplirListeLOFPR_InfosBIS(iOFFPR_ID);
  List_LOFPR_Infos.First;

  for inc := 0 to List_LOFPR_Infos.Count - 1 do
  begin


    iPRCDT_ID        := List_LOFPR_Infos.Items[inc].piPRCDT_ID;
    iCDECO_ID        := List_LOFPR_Infos.Items[inc].piLOFPR_CDECO_ID;
    sCDECO_NUM       := List_LOFPR_Infos.Items[inc].psCDECO_NUM;
    sCDECO_DES       := List_LOFPR_Infos.Items[inc].psCDECO_DES;
    iLLOST_LOFPR_ID  := List_LOFPR_Infos.Items[inc].piLLOST_LOFPR_ID;
    sPROCT_DES       := List_LOFPR_Infos.Items[inc].psPROCT_DES;
    iLOFPR_NAT       := List_LOFPR_Infos.Items[inc].piLOFPR_NAT;
    nLOFPR_PRIX_NET  := List_LOFPR_Infos.Items[inc].pnLOFPR_PRIX_NET;
    sPRCDT_DES       := List_LOFPR_Infos.Items[inc].psPRCDT_DES;
    iLOFPR_NUM       := List_LOFPR_Infos.Items[inc].piLOFPR_NUM;
    nPRX_GLOBAL      := List_LOFPR_Infos.Items[inc].pnPRX_GLOBAL;
    iTypeDmdDerog    := List_LOFPR_Infos.Items[inc].piTypeDmdDerog;

    if (not bActiveDerog) and (iTypeDmdDerog = -1) then
    begin
      Result.Item1 := tDmdDerogVNDansLaTranche;
      Result.Item2 := cstRien;
      Continue;
    end;

    // VN
    if (iLOFPR_NAT IN [CstLOFPR_NAT_0_Catalogues, CstLOFPR_NAT_1_Verre_nu]) then
    begin
      // PHBD 13/10/2025 CDE02848 : le "prix net" du poste compris entre le prix de
      // "la derni�re tranche tarif" et le prix de "la derni�re tranche tarif -5%"
      if (iTypeDmdDerog = 0) AND (iPRCDT_ID > 0) then
      begin
        Result.Item1 := tDmdDerogVNDansLaTranche;
        pFormatMessageVN(iPRCDT_ID,sPRCDT_DES,nLOFPR_PRIX_NET,smessageErreurInterne, bDerogation);
      end
      // PHBD 13/10/2025 CDE02848 :  le "prix net" du poste est inf�rieur au prix de la
      // derni�re tranche tarif -5%
      else if (iTypeDmdDerog = 1) then
      begin
        Result.Item1 := tDmdDerogVNInfCinqPour;
        pFormatMessageVN(iPRCDT_ID,sPRCDT_DES,nLOFPR_PRIX_NET,smessageErreurInterne, bDerogation);
      end
    end
      // Décor
     else if (iLOFPR_NAT = CstLOFPR_NAT_2_Parachevement) then
     begin
      // si le "taux de remise" du poste est > 10% alors le poste doit passer en d�rogation
      if (iTypeDmdDerog = 2) then
      begin
        if (iCDECO_ID > 0 ) or (iLLOST_LOFPR_ID > 0) then
        begin
          Result.Item1 := tDmdDerogDECOR;
          pFormatMessageDECOR(iCDECO_ID,sCDECO_NUM,sCDECO_DES, iLLOST_LOFPR_ID, sPROCT_DES, smessageErreurInterne, bDerogation);
        end;
      end;
     end;
  end;


  if (bDerogation) and (sTrans_nom = 'frmOFFPRFiche') then
  begin

    smessageErreur :=  Format(fGetMessage(MessageContext, 'RegeleAutoriseRemise'), [smessageErreurInterne]);
    if fMessageQuestion(smessageErreur, ciMEQuestion, 2) = cstOui then
      Result.Item2 := cstOui
    else
      Result.Item2 := cstNon;

  end;
  
end;

function fSupprimerLignesAvecRetourALaLigne(const aTexte: string): string;
var
  ListeLignes: TStringList;
  i: Integer;
begin
  ListeLignes := TStringList.Create;
  try
    ListeLignes.Text := aTexte;

    // Parcourir la liste � l'envers pour �viter les probl�mes d'index
    for i := ListeLignes.Count - 1 downto 0 do
    begin
      
      // On garde que la premi�re ligne
      if i > 0 then
        ListeLignes.Delete(i);
    end;

    Result := ListeLignes.Text;
  finally
    ListeLignes.Free;
  end;
end;

function fControleEmissionOFFPR(piOFFPR_ID: Integer): String;
var
  oProc: TUniStoredProc;
  sResult : String;
begin
  Result := '';
  oProc := fCreateStoredProc('PKG_OFFRE.fControleEmissionOFFPR', dmdConnect.cntMain);
  try
    fProcDeclareParameterType(oProc, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
    oProc.ExecProc;
    if oProc.GetResult then
      Result := 'Ok';
  except
    on E: Exception do
    begin
      sResult := fSupprimerLignesAvecRetourALaLigne(fAfficheORAProprement('ORA-20000',E));
      Result := sResult;
    end;
  end;
end;

procedure pHistoriser_ST_VERSI_OFFRE(
      piOFFRE_ID : Integer;
      piType : Integer;
      psNouvelle_valur : String;
      psAncienne_valur : String;
      piSID_SOURCE : Integer;
      psCOMMENTAIRE : String = '';
      psCOLMOD : String = ''
    );
var
    oProc: TUniStoredProc;
    bInTransaction: Boolean;
begin
    oProc := fCreateStoredProc('PKG_OFFRE.pHistoriser_ST_VERSI_OFFRE', dmdConnect.cntMain);
    try
      bInTransaction := dmdConnect.cntMain.InTransaction;

      if not bInTransaction then
        dmdConnect.cntMain.StartTransaction;
      try
        fProcDeclareParameterType(oProc, 'piOFFRE_ID'      , ftInteger, piOFFRE_ID);
        fProcDeclareParameterType(oProc, 'piType'          , ftInteger, piType);
        fProcDeclareParameterType(oProc, 'psNouvelle_valur', ftWideString, psNouvelle_valur);
        fProcDeclareParameterType(oProc, 'psAncienne_valur', ftWideString, psAncienne_valur);
        fProcDeclareParameterType(oProc, 'piSID_SOURCE'    , ftInteger, piSID_SOURCE);
        fProcDeclareParameterType(oProc, 'psCOMMENTAIRE'   , ftWideString, psCOMMENTAIRE);
        fProcDeclareParameterType(oProc, 'psCOLMOD'        , ftString, psCOLMOD);
        oProc.ExecProc;

        if not bInTransaction then
          dmdConnect.cntMain.Commit;

      except
        on E: Exception do
        begin

          if not bInTransaction then
            dmdConnect.cntMain.Rollback;

          raise;

        end;
      end;
    finally
      FreeAndNil(oProc);
    end;
end;

procedure pHistoriser_ST_VERSI(
      piOFFPR_ID : Integer;
      piType : Integer;
      psNouvelle_valur : String;
      psAncienne_valur : String;
      piSID_SOURCE : Integer;
      psCOMMENTAIRE : String = '';
      psCOLMOD : String = ''
    );
var
    oProc: TUniStoredProc;
    bInTransaction: Boolean;
begin
    oProc := fCreateStoredProc('PKG_OFFRE.pHistoriser_ST_VERSI', dmdConnect.cntMain);
    try
      bInTransaction := dmdConnect.cntMain.InTransaction;

      if not bInTransaction then
        dmdConnect.cntMain.StartTransaction;
      try
        fProcDeclareParameterType(oProc, 'piOFFPR_ID'      , ftInteger, piOFFPR_ID);
        fProcDeclareParameterType(oProc, 'piType'          , ftInteger, piType);
        fProcDeclareParameterType(oProc, 'psNouvelle_valur', ftWideString, psNouvelle_valur);
        fProcDeclareParameterType(oProc, 'psAncienne_valur', ftWideString, psAncienne_valur);
        fProcDeclareParameterType(oProc, 'piSID_SOURCE'    , ftInteger, piSID_SOURCE);
        fProcDeclareParameterType(oProc, 'psCOMMENTAIRE'   , ftWideString, psCOMMENTAIRE);
        fProcDeclareParameterType(oProc, 'psCOLMOD'        , ftString, psCOLMOD);
        oProc.ExecProc;

        if not bInTransaction then
          dmdConnect.cntMain.Commit;

      except
        on E: Exception do
        begin

          if not bInTransaction then
            dmdConnect.cntMain.Rollback;

          raise;

        end;
      end;
    finally
      FreeAndNil(oProc);
    end;
end;

procedure pEmissionOFFPR(piOFFPR_ID: Integer; var deOFFPR_DATE_RELANCE:
    TDateTime; bCtrSaisie: Boolean; pbETAT_NAB: Boolean = False; Form:
    THadHocFormFiche = Nil);
var
  oProc: TUniStoredProc;
  bInTransaction: Boolean;
  sResult : String;
  oOFFPR_Infos : TOFFPR_Infos;

begin

  if not bCtrSaisie then
    Exit;

  sResult := fControleEmissionOFFPR(piOFFPR_ID);
  if sResult <> 'Ok' then
  begin
    fMessageErreur(sResult,1,1);
    Exit;
  end;

  oOFFPR_Infos := fRemplirOFFPR_Info(piOFFPR_ID); 

  pgenereFBLOB(piOFFPR_ID, oOFFPR_Infos.piOFFPR_LANGU_ID, oOFFPR_Infos.pbOFFPR_FLG_RPI);

  bInTransaction := dmdConnect.cntMain.InTransaction;
  if not bInTransaction then
    dmdConnect.cntMain.StartTransaction;
  oProc := fCreateStoredProc('PKG_OFFRE.pEmissionOFFPR', dmdConnect.cntMain);
  try

    try
      fProcDeclareParameterType(oProc, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
      fProcDeclareParameterType(oProc, 'piCOLLA_ID', ftInteger, _UserHH.Id);
      fProcDeclareParameterType(oProc, 'deOFFPR_DATE_RELANCE', ftDateTime, deOFFPR_DATE_RELANCE);
      oProc.ExecProc;

      deOFFPR_DATE_RELANCE := oProc.ParamByName('deOFFPR_DATE_RELANCE').Value;

      if not bInTransaction then
        dmdConnect.cntMain.Commit;
    except
      on E: Exception do
      begin
        if not bInTransaction then
          dmdConnect.cntMain.Rollback;

        // ORA-20000 Exception non g�r�e car ce sont des r�gles de gestion
        if Pos('ORA-20000',E.Message) > 0 then
        begin
          sResult := fSupprimerLignesAvecRetourALaLigne(fAfficheORAProprement('ORA-20000',E));
          fMessageErreur(sResult,1,1);
        end
        else
          raise Exception.Create(E.Message);
      end;
    end;

  finally
    FreeAndNil(oProc);
  end;

//  if Form is TfrmOFFPRFiche then
//    TfrmOFFPRFiche(Form).fEtat(etfVisu);
end;

function fTestProduitLeader(piOFFPR_ID: Integer): Boolean;
{
  Test si le produit leader est bien renseign�
  Si il y a 1 poste, le produit leader du poste est renseign�
  Si il y a plus de 1 poste, on teste si il ya un produit leader sur un des postes
  renvoie Faux si le produit leader n'est pas renseign�
}
var
  oProc: TUniStoredProc;
  bInTransaction: Boolean;
begin
  bInTransaction := dmdConnect.cntMain.InTransaction;
  if not bInTransaction then
    dmdConnect.cntMain.StartTransaction;

  oProc := fCreateStoredProc('PKG_OFFRE.fTestProduitLeader', dmdConnect.cntMain);
  try
    try
      fProcDeclareParameterType(oProc, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
      oProc.ExecProc;
      Result := oProc.GetResult = 1;
      if not bInTransaction then
        dmdConnect.cntMain.Commit;
    except
      on E: Exception do
      begin
        if not bInTransaction then
          dmdConnect.cntMain.Rollback;
        raise;
      end;
    end;
  finally
    FreeAndNil(oProc);
  end;
end;


procedure fMAJStatut(piOFFPR_ID, piOFFPR_ST, aNouveauStatut: Integer;
    bETAT_NAB: Boolean; psCommentaire: string = '');
var
  oQuery: TUNIQuery;
  oProc: TUniStoredProc;
  bInTransaction: Boolean;
begin
  oProc := fCreateStoredProc('PKG_OFFRE.pMAJ_OFFPR_ST', dmdConnect.cntMain);
  try
    bInTransaction := dmdConnect.cntMain.InTransaction;
    if not bInTransaction then
      dmdConnect.cntMain.StartTransaction;
    try

      fProcDeclareParameterType(oProc, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
      fProcDeclareParameterType(oProc, 'piOFFPR_ST', ftInteger, aNouveauStatut);
      fProcDeclareParameterType(oProc, 'piCOLLA_ID', ftString, _userHH.Id);
      fProcDeclareParameterType(oProc, 'psCommentaire', ftString, psCommentaire);
      oProc.ExecProc;

      if not bInTransaction then
        dmdConnect.cntMain.Commit;

    except
      if not bInTransaction then
        dmdConnect.cntMain.Rollback;
      raise;
    end;

   if (bETAT_NAB) then
    pHistoriser_ST_VERSI(piOFFPR_ID, ord(THMOPR_TYPStatut), aNouveauStatut.ToString() , Cst_OFFPR_ST_1_Emis.ToString(), 0, psCommentaire)
       else
    pHistoriser_ST_VERSI(piOFFPR_ID, ord(THMOPR_TYPStatut), aNouveauStatut.ToString() , piOFFPR_ST.ToString() {fGetSeqChxfgCombo(cbxOFFPR_ST)}, 0, psCommentaire);

  finally
    FreeAndNil(oProc);
  end;
end;

procedure fMAJStatutOFFRE(piOFFRE_ID, piOFFRE_ST, aNouveauStatut: Integer;
    bETAT_NAB: Boolean; psCommentaire: string = '');
var
  oProc: TUniStoredProc;
  bInTransaction: Boolean;
begin
  oProc := fCreateStoredProc('PKG_OFFRE.pMAJ_OFFRE_ST', dmdConnect.cntMain);
  try
    bInTransaction := dmdConnect.cntMain.InTransaction;
    if not bInTransaction then
      dmdConnect.cntMain.StartTransaction;
    try

      fProcDeclareParameterType(oProc, 'piOFFRE_ID', ftInteger, piOFFRE_ID);
      fProcDeclareParameterType(oProc, 'piOFFRE_ST', ftInteger, aNouveauStatut);
      fProcDeclareParameterType(oProc, 'piCOLLA_ID', ftString, _userHH.Id);
      fProcDeclareParameterType(oProc, 'psCommentaire', ftString, psCommentaire);
      oProc.ExecProc;

      if not bInTransaction then
        dmdConnect.cntMain.Commit;

    except
      if not bInTransaction then
        dmdConnect.cntMain.Rollback;
      raise;
    end;

  finally
    FreeAndNil(oProc);
  end;
end;

procedure fMaj_OFFPR(piOFFPR_ID, piSID_SOURCE: Integer);
var
  oQuery: TUNIQuery;
  bInTransaction: Boolean;
begin
  oQuery := TUNIQuery.Create(nil);
  try
    bInTransaction := dmdConnect.cntMain.InTransaction;
    if not bInTransaction then
      dmdConnect.cntMain.StartTransaction;
    try
      if fQueryRQSQL(oQuery, 34353) then
      begin
        fQueryDeclareParameterType(oQuery, 'sIDNew',    ftInteger, piOFFPR_ID);
        fQueryDeclareParameterType(oQuery, 'sIDSource', ftInteger, piSID_SOURCE);

        fQueryOpen(oQuery);
      end;

      if not bInTransaction then
        dmdConnect.cntMain.Commit;

    except
      if not bInTransaction then
        dmdConnect.cntMain.Rollback;
      raise;
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;

function envoi_mails(piOFFPR_ID, piOFFPR_LANGU_ID: Integer; pbOFFPR_FLG_RPI:
    Boolean): boolean;
var
  oDestiList: TDestiList;
  oTmpEmails: TStringList;
  iLANGU_ID, i: integer;
begin
  Result := True;
  iLANGU_ID := Cst_Langue_FR;

  oDestiList := TDestiList.Create;
  try

    // G�n�ration offre.pdf avec d�mat�riallisation
    impression_offre(True, piOFFPR_ID, piOFFPR_LANGU_ID);

    if piOFFPR_LANGU_ID = Cst_Langue_RU then // Cas particulier pour le Russe
      impression_offre(True, piOFFPR_ID, Cst_Langue_UK);
    // G�n�ration rpi avec d�mat�riallisation
    if fCheckModelsRPI(piOFFPR_ID) = 1 then
      if pbOFFPR_FLG_RPI then
      begin
        impression_rpi(True, piOFFPR_ID, piOFFPR_LANGU_ID);
        if piOFFPR_LANGU_ID = Cst_Langue_RU then // Cas particulier pour le Russe
          impression_rpi(True, piOFFPR_ID, Cst_Langue_UK);
      end;

      // Param�trage et envoi du mail
    try
        // on recherche toutes les adresses mails des collaborateurs s�par�es par des ";"
      // puis on extrait le trigramme du collaborateur...
      oTmpEmails := TStringList.Create;

      //CDE02091 PDAD 16/11/2020
      oTmpEmails.Text := StringReplace(oTmpEmails.Text, ' ', ';', [rfReplaceAll]);
      oTmpEmails.Text := StringReplace(oTmpEmails.Text, ',', ';', [rfReplaceAll]);

      oTmpEmails.Text := StringReplace(oTmpEmails.Text, ';', #13#10, [rfReplaceAll]);
      try
        for i := 0 to Pred(oTmpEmails.Count) do
        begin
          // Remplace le "@xxxx.yyy" d'une adresse mail
          oTmpEmails[i] := Trim(UpperCase(fRegExReplace(oTmpEmails[i], '\@(([0-9A-Za-z])+)\.(([0-9A-Za-z])+)', '')));
          if (Length(oTmpEmails[i]) = 3) or (Length(oTmpEmails[i]) = 4) then
            oDestiList.Add(oTmpEmails[i], tda, iLANGU_ID, True);
        end;
      finally
        FreeAndNil(oTmpEmails);
      end;

      if not fgSendMails(//
        81550(*TfrmOFSIMFiche*), // SMAIL_TRANS_ID
        184, // SMAIL_SUJET
        iLANGU_ID, // SMAIL_XXXXX_ID
        StrToInt(piOFFPR_ID.ToString()), // HMAIL_XXXXX_ID
        oDestiList // splusto
      ) then
      begin
        Result := False;
        Exit;
      end;

    except
      raise;
    end;

  finally
    FreeAndNil(oDestiList);
  end;
end;

procedure impression_rpi(vdemat: boolean; piOFFPR_ID, piOFFPR_LANGU_ID:
    Integer);
begin
  if not vdemat then
    WS_EDITIONS_Unit.pPREVIEW_ETAT(tWSETAT.OFFPR_RPI, piOFFPR_LANGU_ID{fGetSeqChxfgCombo(cbxOFFPR_LANGU)}, piOFFPR_ID)       //OLD=19713 NEW=23533
  else
    WS_EDITIONS_Unit.fPRINT_ETAT(tWSETAT.OFFPR_RPI, piOFFPR_LANGU_ID{fGetSeqChxfgCombo(cbxOFFPR_LANGU)}, piOFFPR_ID, StrToInt(_UserHH.Id));
end;

procedure impression_offre(vdemat: boolean; piOFFPR_ID, piOFFPR_LANGU_ID:
    Integer);
begin
  if not vdemat then
    WS_EDITIONS_Unit.pPREVIEW_ETAT(tWSETAT.OFFPR, piOFFPR_LANGU_ID{fGetSeqChxfgCombo(cbxOFFPR_LANGU)}, piOFFPR_ID)
  else
    WS_EDITIONS_Unit.fPRINT_ETAT(tWSETAT.OFFPR, piOFFPR_LANGU_ID{fGetSeqChxfgCombo(cbxOFFPR_LANGU)}, piOFFPR_ID, StrToInt(_UserHH.Id));
end;

function fCheckModelsRPI(piOFFPR_ID: Integer): Integer;
var
  oProc: TUniStoredProc;
begin
  oProc := TUniStoredProc.Create(nil);
  
  oProc := fCreateStoredProc('PKG_OFFRE.fCheckModelsRPI', dmdConnect.cntMain);
  try
    fProcDeclareParameterType(oProc, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
    oProc.ExecProc;
    Result := oProc.GetResult;

  finally
    FreeAndNil(oProc);
  end;

end;

procedure fMaj_OFFPR_DATE_RELANCE(piOFFPR_ID: integer; pDate: TDATE;
    pOFFPR_FLG_RELANCE: integer);
var
  oQuery: TUniQuery;
begin
  oQuery := TUniQuery.Create(nil);
  try
    try
      if fQueryRQSQL(oQuery, 35114) then
      begin
        fQueryDeclareParameterType(oQuery, 'iOFFPR_ID',           ftInteger, piOFFPR_ID);
        fQueryDeclareParameterType(oQuery, 'dOFFPR_DATE_RELANCE', ftString, Datetostr(pDate));
        fQueryDeclareParameterType(oQuery, 'iOFFPR_FLG_RELANCE',  ftInteger,  pOFFPR_FLG_RELANCE);
        fQueryDeclareParameterType(oQuery, 'sCOLMOD',             ftstring,  fGetUser);
        fQueryOpen(oQuery);
      end;
    except
      raise;
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;

function fCountLOFPR_ID(piOFFPR_ID : Integer) : Integer;
var
  oQuery: TUNIQuery;
begin
  Result := 0;
  oQuery := TUNIQuery.Create(nil);
  try
    if fQueryRQSQL(oQuery, 35114) then
    begin
      fQueryDeclareParameterType(oQuery, 'iOFFPR_ID', ftInteger, piOFFPR_ID);
      fQueryOpen(oQuery);
      if oQuery.RecordCount > 0 then
        Result := fGetValueI(oQuery, 'COUNT_LOFPR');
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;

procedure fModificationOFFPR(var prOFFPR_Infos: TOFFPR_Infos; piLOFPR_ID:
    Integer = -1; piLOFPR_NUM: Integer = -1; pbETAT_NAB: boolean = False);
var
  oQuery: TUNIQuery;
  oProc: TUniStoredProc;
  bInTransaction: Boolean;
  List_HOFPR_Infos : TList_HOFPR_Infos;
  List_LOFPR_Infos : TList_LOFPR_Infos;

begin

  oQuery := TUNIQuery.Create(nil);
  try
    bInTransaction := dmdConnect.cntMain.InTransaction;
    List_LOFPR_Infos := TList_LOFPR_Infos.Create;
    List_HOFPR_Infos := TList_HOFPR_Infos.Create;
    try

      if not bInTransaction then
        dmdConnect.cntMain.StartTransaction;

      if (prOFFPR_Infos.piOFFPR_ST{fGetSeqChxfgCombo(cbxOFFPR_ST)} = Cst_OFFPR_ST_0_Encours) or
         (prOFFPR_Infos.piOFFPR_ST{fGetSeqChxfgCombo(cbxOFFPR_ST)} = Cst_OFFPR_ST_3_Non_abouti) or
         (prOFFPR_Infos.piOFFPR_ST{fGetSeqChxfgCombo(cbxOFFPR_ST)} = Cst_OFFPR_ST_1_Emis) then // lorsque l'offre n'est pas emise elle est entierement modifiable
      begin
        // MAJ Entete : OFFPR
        if fQueryRQSQL(oQuery, 44687) then // old =  36557, 34383, 34267, 20708, 20605, 19743, 18615, 17353  --- 34267
        begin
          fQueryDeclareParameterType(oQuery, 'dDATEMOD',                  ftDateTime, fCurrentDateOnly);
          fQueryDeclareParameterType(oQuery, 'iTARIF_UNIQ_ID',            ftString,   prOFFPR_Infos.piOFFPR_TARIF_UNIQ_ID{edtOFFPR_TARIF_UNIQ_ID.Text}); //edtOFFPR_TARIF_UNIQ_ID.Text);
          fQueryDeclareParameterType(oQuery, 'iTIERS_ID',                 ftString,   prOFFPR_Infos.piOFFPR_TIERS_ID{edtOFFPR_TIERS_ID.Text});
          fQueryDeclareParameterType(oQuery, 'iTIERS_RS',                 ftString,   prOFFPR_Infos.psTIERS_RS_L1{edtTIERS_RS_L1.Text});
          fQueryDeclareParameterType(oQuery, 'sDATE_RELANCE',             ftDateTime, prOFFPR_Infos.pdOFFPR_DATE_RELANCE{datetostr(deOFFPR_DATE_RELANCE.date)});
          fQueryDeclareParameterType(oQuery, 'iFLG_RPI',                  ftInteger,  Integer(prOFFPR_Infos.pbOFFPR_FLG_RPI{chkOFFPR_FLG_RPI.Checked}));
          fQueryDeclareParameterType(oQuery, 'sCONDITIONS_GEN',           ftString,   IfThen(fIsCyrillique(prOFFPR_Infos.psOFFPR_CONDITIONS_GEN{mmOFFPR_CONDITIONS_GEN.Text}),'',prOFFPR_Infos.psOFFPR_CONDITIONS_GEN{mmOFFPR_CONDITIONS_GEN.Text}));
          fQueryDeclareParameterType(oQuery, 'sCONDITIONS_GEN_EN',        ftString,   prOFFPR_Infos.psOFFPR_CONDITIONS_GEN_EN{mmOFFPR_CONDITIONS_GEN_EN.Text});
          fQueryDeclareParameterType(oQuery, 'sCOLMOD',                   ftString,   fGetUser);
          fQueryDeclareParameterType(oQuery, 'iLANGU_ID',                 ftInteger,  prOFFPR_Infos.piOFFPR_LANGU_ID{fGetSeqChxfgCombo(cbxOFFPR_LANGU)});
          fQueryDeclareParameterType(oQuery, 'iTYRPI_ID',                 ftInteger,  prOFFPR_Infos.piOFFPR_TYRPI_ID{fGetSeqChxfgCombo(cbxOFFPR_TYRPI)});
          fQueryDeclareParameterType(oQuery, 'iTXRPI_ID',                 ftInteger,  recherche_TXRPI(prOFFPR_Infos.piOFFPR_LANGU_ID{fGetSeqChxfgCombo(cbxOFFPR_LANGU)},prOFFPR_Infos.piOFFPR_TYRPI_ID {fGetSeqChxfgCombo(cbxOFFPR_TYRPI)}));
          fQueryDeclareParameterType(oQuery, 'iADM_COLLA_ID',             ftInteger,  prOFFPR_Infos.piADM_COLLA_ID{edtADM_COLLA_ID.Text});  
          fQueryDeclareParameterType(oQuery, 'iCDM_COLLA_ID',             ftInteger,  prOFFPR_Infos.piCDM_COLLA_ID{edtCDM_COLLA_ID.Text});
          fQueryDeclareParameterType(oQuery, 'iDVISE_ID',                 ftInteger,  prOFFPR_Infos.piDVISE_ID{fGetSeqChxfgCombo(cbxDVISE_DES)});
          fQueryDeclareParameterType(oQuery, 'iSIGNATAIRE_COLLA_ID',      ftInteger,  prOFFPR_Infos.piCOLLA_SIGN_ID{edtCOLLA_SIGN_ID.Text});
          fQueryDeclareParameterType(oQuery, 'nFRAIS_DEVEL_DECOR',        ftFloat,    prOFFPR_Infos.psOFFPR_FRAIS_DEVEL_DECOR{FloatToStr(fFStrToFloat(edtOFFPR_FRAIS_DEVEL_DECOR.Text))});
          fQueryDeclareParameterType(oQuery, 'sCMNT_DEVEL_DECOR',         ftString,   IfThen(fIsCyrillique(prOFFPR_Infos.psOFFPR_CMNT_DEVEL_DECOR{mmOFFPR_CMNT_DEVEL_DECOR.Text}),'',prOFFPR_Infos.psOFFPR_CMNT_DEVEL_DECOR{mmOFFPR_CMNT_DEVEL_DECOR.Text}));
          fQueryDeclareParameterType(oQuery, 'sCMNT_DEVEL_DECOR_EN',      ftString,   prOFFPR_Infos.psOFFPR_CMNT_DEVEL_DECOR_EN{mmOFFPR_CMNT_DEVEL_DECOR_EN.Text});
          fQueryDeclareParameterType(oQuery, 'iOFFPR_SOCIE_ID',           ftInteger,  prOFFPR_Infos.piOFFPR_SOCIE_ID{fGetSeqChxfgCombo(cbxSOCIE_DES)});
          fQueryDeclareParameterType(oQuery, 'sOFFPR_OBJET',              ftString,   prOFFPR_Infos.psOFFPR_OBJET{edtOFFPR_OBJET.Text});
          fQueryDeclareParameterType(oQuery, 'iOFFPR_CLT_FINAL_TIERS_ID', ftInteger,  prOFFPR_Infos.piOFFPR_CLT_FINAL_TIERS_ID{edtOFFPR_CLT_FINAL_TIERS_ID.Text});
          fQueryDeclareParameterType(oQuery, 'iOFFPR_ZOCOM_ID',           ftInteger,  prOFFPR_Infos.piOFFPR_ZOCOM_ID{edtOFFPR_ZOCOM_ID.Text});
          fQueryDeclareParameterType(oQuery, 'iOFFPR_FLG_RELANCE',        ftInteger,  prOFFPR_Infos.piOFFPR_FLG_RELANCE{fGetSeqChxfgCombo(cbxOFFPR_Relance)});

          fQueryDeclareParameterType(oQuery, 'dOFFPR_DATE_VALIDITE_PRIX',  ftDate   ,  prOFFPR_Infos.pdOFFPR_DATE_VALIDITE_PRIX{pdOFFPR_DATE_VALIDITE_PRIX.Date});
          fQueryDeclareParameterType(oQuery, 'iOFFPR_POTENTIEL_QTE',       ftInteger,  prOFFPR_Infos.piOFFPR_POTENTIEL_QTE{edtOFFPR_POTENTIEL_QTE.Text});
          fQueryDeclareParameterType(oQuery, 'iOFFPR_RANTR_ID',            ftInteger,  prOFFPR_Infos.piOFFPR_RANTR_ID{edtOFFPR_RANTR_ID.text});
          fQueryDeclareParameterType(oQuery, 'sOFFPR_NAB_CMNT',           ftString,    prOFFPR_Infos.psOFFPR_NAB_CMNT {mmOFFPR_NAB_CMNT.text});
          fQueryDeclareParameterType(oQuery, 'iOFFPR_POTENTIEL_QTE_UNITE', ftInteger,  prOFFPR_Infos.piOFFPR_POTENTIEL_QTE_UNITE{fGetSeqChxfgCombo(cbxOFFPR_POTENTIEL_QTE_UNITE)});
          fQueryDeclareParameterType(oQuery, 'sCONTA_NOM',                 ftString,   prOFFPR_Infos.psCONTA_NOM{edtOFFPR_CONTA_NOM.text});
          fQueryDeclareParameterType(oQuery, 'sCONTA_FONCTION',            ftString,   prOFFPR_Infos.psCONTA_FONCTION{edtOFFPR_CONTA_FONCTION.text});

          if (pbETAT_NAB) then
          begin
             fQueryDeclareParameterType(oQuery, 'sOFFPR_NAB_CMNT',          ftString,  prOFFPR_Infos.psOFFPR_NAB_CMNT{mmOFFPR_NAB_CMNT.text});
             fQueryDeclareParameterType(oQuery, 'iOFFPR_ST',                ftInteger, Cst_OFFPR_ST_3_Non_abouti);
          end
          else
          begin
             fQueryDeclareParameterType(oQuery, 'iOFFPR_ST',                 ftInteger, prOFFPR_Infos.piOFFPR_ST{fGetSeqChxfgCombo(cbxOFFPR_ST)});
          end;


          fQueryDeclareParameterType(oQuery, 'iOFFPR_ID',                   ftInteger, prOFFPR_Infos.piOFFPR_ID);


          fQueryOpen(oQuery, True);
        end;


        List_LOFPR_Infos := fRemplirListeLOFPR_Infos(prOFFPR_Infos.piOFFPR_ID);

        // Suppression des lignes d'offre dans la table
        TSupClass.fSupXXXXX('LOFPR_OFFPR_ID = ' + prOFFPR_Infos.piOFFPR_ID.ToString(), 'LOFPR', False, False);

        // insertion des nouvelles lignes
        InsertionNouvellesLignes(List_LOFPR_Infos);
      end;

      // Mise a jour des relances pour toutes les offres non annulees
      if prOFFPR_Infos.piOFFPR_ST{fGetSeqChxfgCombo(cbxOFFPR_ST)} < 2 then
      begin
        List_HOFPR_Infos := fRemplirListeHOFPR_Infos(prOFFPR_Infos.piOFFPR_ID);

        // Suppression des relances associes  l'offre
        TSupClass.fSupXXXXX('HOFPR_OFFPR_ID = ' + prOFFPR_Infos.piOFFPR_ID.ToString(), 'HOFPR', False, False);

        // insertion des nouvelles lignes Relances
        InsertionNouvellesLignesRelances(List_HOFPR_Infos);
      end;

      if not bInTransaction then
        dmdConnect.cntMain.Commit;

      if (prOFFPR_Infos.piOFFPR_ST{fGetSeqChxfgCombo(cbxOFFPR_ST)} = Cst_OFFPR_ST_0_Encours) and
         (
          fIsCyrillique(prOFFPR_Infos.psOFFPR_CONDITIONS_GEN{mmOFFPR_CONDITIONS_GEN.Text}) or
          fIsCyrillique(prOFFPR_Infos.psOFFPR_CMNT_DEVEL_DECOR{mmOFFPR_CMNT_DEVEL_DECOR.Text})
         ) then
      begin
        try
          oProc :=  fCreateStoredProc('PkgNCLOB.pMAJ_OFFPR', dmdConnect.cntMain);
          try
            oProc.Prepare ;
            oProc.ParamByName('IOFFPR_ID').DataType := ftInteger;
            oProc.ParamByName('IOFFPR_ID').Value := prOFFPR_Infos.piOFFPR_ID;
            oProc.ParamByName('SOFFPR_CMNT_DEVEL_DECOR').DataType := ftOraClob;
            oProc.ParamByName('SOFFPR_CMNT_DEVEL_DECOR').National := fIsCyrillique(prOFFPR_Infos.psOFFPR_CMNT_DEVEL_DECOR{mmOFFPR_CMNT_DEVEL_DECOR.Text});
            oProc.ParamByName('SOFFPR_CMNT_DEVEL_DECOR').Value    := prOFFPR_Infos.psOFFPR_CMNT_DEVEL_DECOR{mmOFFPR_CMNT_DEVEL_DECOR.Text};
            oProc.ParamByName('SOFFPR_CONDITIONS_GEN').DataType   := ftOraClob;
            oProc.ParamByName('SOFFPR_CONDITIONS_GEN').National   := fIsCyrillique(prOFFPR_Infos.psOFFPR_CONDITIONS_GEN{mmOFFPR_CONDITIONS_GEN.Text});
            oProc.ParamByName('SOFFPR_CONDITIONS_GEN').Value      := prOFFPR_Infos.psOFFPR_CONDITIONS_GEN{mmOFFPR_CONDITIONS_GEN.Text};
            oProc.ExecProc;
          except
            on E: Exception do
              raise;
          end;
        finally
          FreeAndNil(oproc);
        end;
      end;


    except
      if not bInTransaction then
        dmdConnect.cntMain.Rollback;
      raise;
    end;

  finally
    FreeAndNil(oQuery);
    if Assigned(List_HOFPR_Infos) then
      FreeAndNil(List_HOFPR_Infos);
    if Assigned(List_LOFPR_Infos) then
      FreeAndNil(List_LOFPR_Infos);
  end;

  pCheckProduitLeader(prOFFPR_Infos.piOFFPR_ID, piLOFPR_NUM);

end;

function recherche_TXRPI(ILANGU_ID: integer; ITYRPI_ID: integer): integer;
var
  oQuery: TUNIQuery;
begin
  // Retourne l'id des texte RPI en fonction de la langue et du type de document.
  Result := 0;

  oQuery := TUNIQuery.Create(nil);
  try
    try
      if fQueryRQSQL(oQuery, 10743) then
      begin

        fQueryDeclareParameterType(oQuery, 'iLANGU_ID', ftInteger, ILANGU_ID);
        fQueryDeclareParameterType(oQuery, 'iTYRPI_ID', ftInteger, ITYRPI_ID);

        fQueryOpen(oQuery);

        if oQuery.RecordCount > 0 then
        begin
          oQuery.first;
          Result := fGetValueI(oQuery, 'TXRPI_ID');
        end;

      end;

    except
      on E: Exception do
        Result := 0;
    end;

  finally
    FreeAndNil(oQuery);
  end;
end;


procedure pCheckProduitLeader(piOFFPR_ID, piLOFPR_ID: Integer; piLOFPR_NUM:
    Integer = -1);
var
  oQuery : TUniQuery;
  bInTransaction : Boolean;
begin

  if (piLOFPR_ID > 0) and (piLOFPR_NUM = -1) then
  begin
    oQuery := TUniQuery.Create(nil);
    try

      bInTransaction := dmdConnect.cntMain.InTransaction;
      if not bInTransaction then
        dmdConnect.cntMain.StartTransaction;
      try

        if fQueryRQSQL(oQuery, 44619) then
        begin
          fQueryDeclareParameterType(oQuery, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
          fQueryDeclareParameterType(oQuery, 'piLOFPR_ID', ftInteger, piLOFPR_ID);
          fQueryOpen(oQuery);
        end;
        if not bInTransaction then
          dmdConnect.cntMain.Commit;

      except
        on E: Exception do
        begin
          if not bInTransaction then
            dmdConnect.cntMain.Rollback;
          raise;
        end;

      end;

    finally
      FreeAndNil(oQuery);
    end;
  end
  else
  begin
    oQuery := TUniQuery.Create(nil);
    try

      bInTransaction := dmdConnect.cntMain.InTransaction;
      if not bInTransaction then
        dmdConnect.cntMain.StartTransaction;
      try

        if fQueryRQSQL(oQuery, 44620) then
        begin
          fQueryDeclareParameterType(oQuery, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
          fQueryDeclareParameterType(oQuery, 'piLOFPR_NUM', ftInteger, piLOFPR_NUM);
          fQueryOpen(oQuery);
        end;
        if not bInTransaction then
          dmdConnect.cntMain.Commit;

      except
        on E: Exception do
        begin
          if not bInTransaction then
            dmdConnect.cntMain.Rollback;
          raise;
        end;

      end;

    finally
      FreeAndNil(oQuery);
    end;
  end;

end;

function fgetMaxDateRelHOFPR(piOFFPR_ID: Integer; pddeOFFPR_DATE_EMISSION:
    TDateTime): TDate;
var
  oQuery: TUNIQuery;
begin
//  Result:= strtodate(fCurrentDateOnly);
  Result:= pddeOFFPR_DATE_EMISSION{deOFFPR_DATE_EMISSION.Date}+15;
  oQuery := TUNIQuery.Create(nil);
  try
    if fQueryRQSQL(oQuery, 34269) then
    begin
      fQueryDeclareParameterType(oQuery, 'iOFFPR_ID', ftInteger, piOFFPR_ID);
      fQueryOpen(oQuery);
      if oQuery.RecordCount > 0 then
      begin
        Result := strtodate(fGetValueS(oQuery, 'MAX_HOFPR_DATE_RELANCE'));
      end;
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;

function fRemplirOFFPR_Info(piOFFPR_ID: Integer): TOFFPR_Infos;
var
  oQuery : TUNIQuery;
begin
  oQuery := TUNIQuery.Create(nil);
  try
    if fQueryRQSQL(oQuery, 44736) then
    begin
      fQueryDeclareParameterType(oQuery, 'iOFFPR_ID', ftInteger, piOFFPR_ID);
      fQueryOpen(oQuery);
      if oQuery.RecordCount > 0 then
      begin
        Result.piOFFPR_ID                  := fGetValueI(oQuery, 'OFFPR_ID');
        Result.piOFFPR_ST                  := fGetValueI(oQuery, 'OFFPR_ST');
        Result.piOFFPR_TARIF_UNIQ_ID       := fGetValueI(oQuery, 'OFFPR_TARIF_UNIQ_ID');
        Result.piOFFPR_TIERS_ID            := fGetValueI(oQuery, 'OFFPR_TIERS_ID');
        Result.psTIERS_RS_L1               := fGetValueS(oQuery, 'TIERS_RS_L1');
        Result.pdOFFPR_DATE_RELANCE        := fGetValueDT(oQuery, 'OFFPR_DATE_RELANCE');
        Result.pbOFFPR_FLG_RPI             := fGetValueI(oQuery, 'OFFPR_FLG_RPI') = 1;
        Result.psOFFPR_TIERS_ADR1          := fGetValueS(oQuery, 'OFFPR_TIERS_ADR1');
        Result.psOFFPR_TIERS_ADR2          := fGetValueS(oQuery, 'OFFPR_TIERS_ADR2');
        Result.psOFFPR_TIERS_CODEP         := fGetValueS(oQuery, 'OFFPR_TIERS_CODEP');
        Result.psOFFPR_TIERS_VILLE         := fGetValueS(oQuery, 'OFFPR_TIERS_VILLE');
        Result.psOFFPR_TIERS_PAYS          := fGetValueS(oQuery, 'OFFPR_TIERS_PAYS');
        Result.psOFFPR_CONDITIONS_GEN      := fGetValueS(oQuery, 'OFFPR_CONDITIONS_GEN');
        Result.psOFFPR_CONDITIONS_GEN_EN   := fGetValueS(oQuery, 'OFFPR_CONDITIONS_GEN_EN');
        Result.piOFFPR_LANGU_ID            := fGetValueI(oQuery, 'OFFPR_LANGU_ID');
        Result.piOFFPR_TYRPI_ID            := fGetValueI(oQuery, 'OFFPR_TYRPI_ID');
        Result.piADM_COLLA_ID              := fGetValueI(oQuery, 'ADM_COLLA_ID');
        Result.piCDM_COLLA_ID              := fGetValueI(oQuery, 'CDM_COLLA_ID');
        Result.piDVISE_ID                  := fGetValueI(oQuery, 'DVISE_ID');
        Result.piCOLLA_SIGN_ID             := fGetValueI(oQuery, 'COLLA_SIGN_ID');
        Result.psOFFPR_FRAIS_DEVEL_DECOR   := fGetValueS(oQuery, 'OFFPR_FRAIS_DEVEL_DECOR');
        Result.pdOFFPR_DATE_EMISSION       := fGetValueDT(oQuery, 'OFFPR_DATE_EMISSION');
        Result.psOFFPR_CMNT_DEVEL_DECOR    := fGetValueS(oQuery, 'OFFPR_CMNT_DEVEL_DECOR');
        Result.psOFFPR_CMNT_DEVEL_DECOR_EN := fGetValueS(oQuery, 'OFFPR_CMNT_DEVEL_DECOR_EN');
        Result.piOFFPR_SOCIE_ID            := fGetValueI(oQuery, 'OFFPR_SOCIE_ID');
        Result.psOFFPR_OBJET               := fGetValueS(oQuery, 'OFFPR_OBJET');
        Result.piOFFPR_CLT_FINAL_TIERS_ID  := fGetValueI(oQuery, 'OFFPR_CLT_FINAL_TIERS_ID');
        Result.piOFFPR_ZOCOM_ID            := fGetValueI(oQuery, 'OFFPR_ZOCOM_ID');
        Result.piOFFPR_FLG_RELANCE         := fGetValueI(oQuery, 'OFFPR_FLG_RELANCE');
        Result.pdOFFPR_DATE_VALIDITE_PRIX  := fGetValueDT(oQuery, 'OFFPR_DATE_VALIDITE_PRIX');
        Result.piOFFPR_POTENTIEL_QTE       := fGetValueI(oQuery, 'OFFPR_POTENTIEL_QTE');
        Result.piOFFPR_RANTR_ID            := fGetValueI(oQuery, 'OFFPR_RANTR_ID');
        Result.psOFFPR_NAB_CMNT            := fGetValueS(oQuery, 'OFFPR_NAB_CMNT');
        Result.piOFFPR_POTENTIEL_QTE_UNITE := fGetValueI(oQuery, 'OFFPR_POTENTIEL_QTE_UNITE');
        Result.psCONTA_NOM                 := fGetValueS(oQuery, 'CONTA_NOM');
        Result.psCONTA_FONCTION            := fGetValueS(oQuery, 'CONTA_FONCTION');
      end;
    end;
  finally
    FreeAndNil(oQuery);
  end;

end;

function fRemplirListeHOFPR_Infos(piOFFPR_ID: Integer): TList_HOFPR_Infos;
var
  oQuery: TUNIQuery;
  rHOFPR_Infos: THOFPR_Infos;
begin
  Result := TList_HOFPR_Infos.Create;
  oQuery := TUNIQuery.Create(nil);
  try
    if fQueryRQSQL(oQuery, 35441) then
    begin
      fQueryDeclareParameterType(oQuery, 'iOFFPR_ID', ftInteger, piOFFPR_ID);
      fQueryOpen(oQuery);
      oQuery.First;
      while not oQuery.Eof do
      begin
        rHOFPR_Infos.piH1OFPR_NUM_RELANCE := fGetValueI(oQuery, 'H1OFPR_NUM_RELANCE');
        rHOFPR_Infos.pdHOFPR_DATE_RELANCE := fGetValueDT(oQuery, 'HOFPR_DATE_RELANCE');
        rHOFPR_Infos.psHOFPR_CMNT         := fGetValueS(oQuery, 'HOFPR_CMNT');
        rHOFPR_Infos.pdHOFPR_DATECRE      := fGetValueDT(oQuery, 'HOFPR_DATECRE');
        rHOFPR_Infos.pdHOFPR_DATEMOD      := fGetValueDT(oQuery, 'HOFPR_DATEMOD');
        rHOFPR_Infos.psHOFPR_COLMOD       := fGetValueS(oQuery, 'HOFPR_COLMOD');
        rHOFPR_Infos.piHOFPR_COLLA_ID     := fGetValueI(oQuery, 'HOFPR_COLLA_ID');
        Result.Add(rHOFPR_Infos);
        oQuery.Next;
      end;
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;

// fRemplirListeLOFPR_Infos : remplit la liste des postes d'offre en utilisant une
// fonction qui renvoi un SYS_CURSOR (PLSQL) dans un
// TList_LOFPR_Infos (Tableau du record TLOFPR_Infos)
function fRemplirListeLOFPR_InfosBIS(piOFFPR_ID: Integer): TList_LOFPR_Infos;
var
  rLOFPR_Infos: TLOFPR_Infos;
  oProc : TUniStoredProc;
begin
  Result := TList_LOFPR_Infos.Create;
  oProc := TUniStoredProc.Create(nil);
  oProc := fCreateStoredProc('PKG_OFFRE.fRemplirListeLOFPR_InfosSYS_CURSOR', dmdConnect.cntMain); 
  // oProc := fCreateStoredProc('PKG_OFFRE.fRemplirListeLOFPR_Infos', dmdConnect.cntMain); 
  try
      fProcDeclareParameterType(oProc, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
      oProc.Open;

      oProc.First;
      while not oProc.Eof do
      begin
        rLOFPR_Infos.piLOFPR_OFFPR_ID       := piOFFPR_ID;
        rLOFPR_Infos.piLOFPR_FLG_CHECK_PL   := oProc.FieldByName('LOFPR_FLG_CHECK_PL').AsInteger;
        rLOFPR_Infos.piLOFPR_ID             := oProc.FieldByName('LOFPR_ID').AsInteger;
        rLOFPR_Infos.piLOFPR_NUM            := oProc.FieldByName('LOFPR_NUM').AsInteger;
        rLOFPR_Infos.piLOFPR_MODEL_ID       := oProc.FieldByName('LOFPR_MODEL_ID').AsInteger;
        rLOFPR_Infos.piLOFPR_CDECO_ID       := oProc.FieldByName('LOFPR_CDECO_ID').AsInteger;
        rLOFPR_Infos.psCDECO_DES            := oProc.FieldByName('CDECO_DES').AsString;
        rLOFPR_Infos.piCDCFO_ID             := oProc.FieldByName('CDCFO_ID').AsInteger;
        rLOFPR_Infos.piCDCFO_NUM            := oProc.FieldByName('CDCFO_NUM').AsInteger;
        rLOFPR_Infos.psCDCFO_DES            := oProc.FieldByName('CDCFO_DES').AsString;
        rLOFPR_Infos.psMODEL_CODE           := oProc.FieldByName('MODEL_CODE').AsString;
        rLOFPR_Infos.psMODEL_DES            := oProc.FieldByName('MODEL_DES').AsString;
        rLOFPR_Infos.psLOFPR_COMMENTAIRE    := oProc.FieldByName('LOFPR_COMMENTAIRE').AsString;
        rLOFPR_Infos.psLOFPR_COMMENTAIRE_EN := oProc.FieldByName('LOFPR_COMMENTAIRE_EN').AsString;
        rLOFPR_Infos.piLOFPR_BAGEN_ID       := oProc.FieldByName('LOFPR_BAGEN_ID').AsInteger;
        rLOFPR_Infos.psBAGEN_CODE           := oProc.FieldByName('BAGEN_CODE').AsString;
        rLOFPR_Infos.psBAGEN_DES            := oProc.FieldByName('BAGEN_DES').AsString;
        rLOFPR_Infos.piLOFPR_TEINT_ID       := oProc.FieldByName('LOFPR_TEINT_ID').AsInteger;
        rLOFPR_Infos.psTEINT_DES            := oProc.FieldByName('TEINT_DES').AsString;
        rLOFPR_Infos.pnLOFPR_QTE            := oProc.FieldByName('LOFPR_QTE').AsInteger;
        rLOFPR_Infos.pnLOFPR_PRIX_UNITAIRE  := oProc.FieldByName('LOFPR_PRIX_UNITAIRE').AsInteger;
        rLOFPR_Infos.pnLOFPR_TX_MAJORATION  := oProc.FieldByName('LOFPR_TX_MAJORATION').AsFloat;
        rLOFPR_Infos.pnLOFPR_TX_REMISE      := oProc.FieldByName('LOFPR_TX_REMISE').AsFloat;
        rLOFPR_Infos.pnLOFPR_PRIX_NET       := oProc.FieldByName('LOFPR_PRIX_NET').AsFloat;
        rLOFPR_Infos.psTYPEM_CODE           := oProc.FieldByName('TYPEM_CODE').AsString;
        rLOFPR_Infos.psLOFPR_DESIGNATION    := oProc.FieldByName('LOFPR_DESIGNATION').AsString;
        rLOFPR_Infos.psLOFPR_DESIGNATION_EN := oProc.FieldByName('LOFPR_DESIGNATION_EN').AsString;
        rLOFPR_Infos.piLOFPR_TYPE_LIGNE     := oProc.FieldByName('LOFPR_TYPE_LIGNE').AsInteger;
        rLOFPR_Infos.pnLOFPR_PRIX_MAJORE    := oProc.FieldByName('LOFPR_PRIX_MAJORE').AsInteger;
        rLOFPR_Infos.pnLOFPR_PRIX_NET_TRPT  := oProc.FieldByName('LOFPR_PRIX_NET_TRPT').AsInteger;
        rLOFPR_Infos.pdLOFPR_DATECRE        := oProc.FieldByName('LOFPR_DATECRE').AsDateTime;
        rLOFPR_Infos.pdLOFPR_DATEMOD        := oProc.FieldByName('LOFPR_DATEMOD').AsDateTime;
        rLOFPR_Infos.psLOFPR_COLMOD         := oProc.FieldByName('LOFPR_COLMOD').AsString;
        rLOFPR_Infos.piLOFPR_SUP            := oProc.FieldByName('LOFPR_SUP').AsInteger;
        rLOFPR_Infos.piLOFPR_NAT            := oProc.FieldByName('LOFPR_NAT').AsInteger;
        rLOFPR_Infos.piLOFPR_DICAT_ID       := oProc.FieldByName('LOFPR_DICAT_ID').AsInteger;
        rLOFPR_Infos.psDICAT_DES            := oProc.FieldByName('DICAT_DES').AsString;
        rLOFPR_Infos.psLOFPR_OBSV           := oProc.FieldByName('LOFPR_OBSV').AsString;
        rLOFPR_Infos.piLOFPR_DISPO          := oProc.FieldByName('LOFPR_DISPO').AsInteger;
        rLOFPR_Infos.piLOFPR_TYPEM_ID       := oProc.FieldByName('LOFPR_TYPEM_ID').AsInteger;
        rLOFPR_Infos.piLOFPR_TRANC_ID       := oProc.FieldByName('LOFPR_TRANC_ID').AsInteger;
        rLOFPR_Infos.psTRANC_DES            := oProc.FieldByName('TRANC_DES').AsString;
        rLOFPR_Infos.psLOFPR_CMNT_TARIF     := oProc.FieldByName('LOFPR_CMNT_TARIF').AsString;
        rLOFPR_Infos.pnLOFPR_PRX_TARIF      := oProc.FieldByName('LOFPR_PRX_TARIF').AsInteger;
        rLOFPR_Infos.psMODEL_ST_COM         := oProc.FieldByName('MODEL_ST_COM').AsString;
        rLOFPR_Infos.piPRCDT_ID             := oProc.FieldByName('PRCDT_ID').AsInteger;
        rLOFPR_Infos.psPRCDT_DES            := oProc.FieldByName('PRCDT_DES').AsString;
        rLOFPR_Infos.pnPRCDT_NB_COLS_PAL    := oProc.FieldByName('PRCDT_NB_COLS_PAL').AsInteger;
        rLOFPR_Infos.psPLCOD_CODE           := oProc.FieldByName('PLCOD_CODE').AsString;
        rLOFPR_Infos.psTRGEN_CODE           := oProc.FieldByName('TRGEN_CODE').AsString;
        rLOFPR_Infos.psTYPAL_SHORT_DES      := oProc.FieldByName('TYPAL_SHORT_DES').AsString;
        rLOFPR_Infos.piLOFPR_FLG_REMISE_EDT := oProc.FieldByName('LOFPR_FLG_REMISE_EDT').AsInteger;
        rLOFPR_Infos.pnPRX_GLOBAL           := oProc.FieldByName('PRX_GLOBAL').AsFloat;
        rLOFPR_Infos.piPRCDT_TYP            := oProc.FieldByName('PRCDT_TYP').AsInteger;
        rLOFPR_Infos.piTypeDmdDerog         := oProc.FieldByName('TypeDmdDerog').AsInteger;
        rLOFPR_Infos.piLLOST_LOFPR_ID       := oProc.FieldByName('LLOST_LOFPR_ID').AsInteger;
        Result.Add(rLOFPR_Infos);
        oProc.Next;
      end;
  finally
    FreeAndNil(oProc);
  end; 

end;

// fRemplirListeLOFPR_Infos : remplit la liste des postes d'offre dans un 
// TList_LOFPR_Infos (Tableau du record TLOFPR_Infos)
function fRemplirListeLOFPR_Infos(piOFFPR_ID: Integer): TList_LOFPR_Infos;
var
  oQuery: TUNIQuery;
  rLOFPR_Infos: TLOFPR_Infos;
begin
  Result := TList_LOFPR_Infos.Create;
  oQuery := TUNIQuery.Create(nil);
  try
    if fQueryRQSQL(oQuery, 46230) then
    begin
      fQueryDeclareParameterType(oQuery, 'iOFFPR_ID', ftInteger, piOFFPR_ID);
      fQueryOpen(oQuery);

      oQuery.First;
      while not oQuery.Eof do
      begin
        rLOFPR_Infos.piLOFPR_OFFPR_ID       := piOFFPR_ID;
        rLOFPR_Infos.piLOFPR_FLG_CHECK_PL   := fGetValueI(oQuery, 'LOFPR_FLG_CHECK_PL');
        rLOFPR_Infos.piLOFPR_ID             := fGetValueI(oQuery, 'LOFPR_ID');
        rLOFPR_Infos.piLOFPR_NUM            := fGetValueI(oQuery, 'LOFPR_NUM');
        rLOFPR_Infos.piLOFPR_MODEL_ID       := fGetValueI(oQuery, 'LOFPR_MODEL_ID');
        rLOFPR_Infos.piLOFPR_CDECO_ID       := fGetValueI(oQuery, 'LOFPR_CDECO_ID');
        rLOFPR_Infos.psCDECO_DES            := fGetValueS(oQuery, 'CDECO_DES');
        rLOFPR_Infos.piCDCFO_ID             := fGetValueI(oQuery, 'CDCFO_ID');
        rLOFPR_Infos.piCDCFO_NUM            := fGetValueI(oQuery, 'CDCFO_NUM');
        rLOFPR_Infos.psCDCFO_DES            := fGetValueS(oQuery, 'CDCFO_DES');
        rLOFPR_Infos.psMODEL_CODE           := fGetValueS(oQuery, 'MODEL_CODE');
        rLOFPR_Infos.psMODEL_DES            := fGetValueS(oQuery, 'MODEL_DES');
        rLOFPR_Infos.psLOFPR_COMMENTAIRE    := fGetValueS(oQuery, 'LOFPR_COMMENTAIRE');
        rLOFPR_Infos.psLOFPR_COMMENTAIRE_EN := fGetValueS(oQuery, 'LOFPR_COMMENTAIRE_EN');
        rLOFPR_Infos.piLOFPR_BAGEN_ID       := fGetValueI(oQuery, 'LOFPR_BAGEN_ID');
        rLOFPR_Infos.psBAGEN_CODE           := fGetValueS(oQuery, 'BAGEN_CODE');
        rLOFPR_Infos.psBAGEN_DES            := fGetValueS(oQuery, 'BAGEN_DES');
        rLOFPR_Infos.piLOFPR_TEINT_ID       := fGetValueI(oQuery, 'LOFPR_TEINT_ID');
        rLOFPR_Infos.psTEINT_DES            := fGetValueS(oQuery, 'TEINT_DES');
        rLOFPR_Infos.pnLOFPR_QTE            := fGetValueI(oQuery, 'LOFPR_QTE');
        rLOFPR_Infos.pnLOFPR_PRIX_UNITAIRE  := fGetValueI(oQuery, 'LOFPR_PRIX_UNITAIRE');
        rLOFPR_Infos.pnLOFPR_TX_MAJORATION  := fGetValueI(oQuery, 'LOFPR_TX_MAJORATION');
        rLOFPR_Infos.pnLOFPR_TX_REMISE      := fGetValueI(oQuery, 'LOFPR_TX_REMISE');
        rLOFPR_Infos.pnLOFPR_PRIX_NET       := fGetValueF(oQuery, 'LOFPR_PRIX_NET');
        rLOFPR_Infos.psTYPEM_CODE           := fGetValueS(oQuery, 'TYPEM_CODE');
        rLOFPR_Infos.psLOFPR_DESIGNATION    := fGetValueS(oQuery, 'LOFPR_DESIGNATION');
        rLOFPR_Infos.psLOFPR_DESIGNATION_EN := fGetValueS(oQuery, 'LOFPR_DESIGNATION_EN');
        rLOFPR_Infos.piLOFPR_TYPE_LIGNE     := fGetValueI(oQuery, 'LOFPR_TYPE_LIGNE');
        rLOFPR_Infos.pnLOFPR_PRIX_MAJORE    := fGetValueI(oQuery, 'LOFPR_PRIX_MAJORE');
        rLOFPR_Infos.pnLOFPR_PRIX_NET_TRPT  := fGetValueI(oQuery, 'LOFPR_PRIX_NET_TRPT');
        rLOFPR_Infos.pdLOFPR_DATECRE        := fGetValueDT(oQuery, 'LOFPR_DATECRE');
        rLOFPR_Infos.pdLOFPR_DATEMOD        := fGetValueDT(oQuery, 'LOFPR_DATEMOD');
        rLOFPR_Infos.psLOFPR_COLMOD         := fGetValueS(oQuery, 'LOFPR_COLMOD');
        rLOFPR_Infos.piLOFPR_SUP            := fGetValueI(oQuery, 'LOFPR_SUP');
        rLOFPR_Infos.piLOFPR_NAT            := fGetValueI(oQuery, 'LOFPR_NAT');
        rLOFPR_Infos.piLOFPR_DICAT_ID       := fGetValueI(oQuery, 'LOFPR_DICAT_ID');
        rLOFPR_Infos.psDICAT_DES            := fGetValueS(oQuery, 'DICAT_DES');
        rLOFPR_Infos.psLOFPR_OBSV           := fGetValueS(oQuery, 'LOFPR_OBSV');
        rLOFPR_Infos.piLOFPR_DISPO          := fGetValueI(oQuery, 'LOFPR_DISPO');
        rLOFPR_Infos.psLOFPR_DISPO_DES      := fGetValueS(oQuery, 'LOFPR_DISPO_DES');
        rLOFPR_Infos.piLOFPR_TYPEM_ID       := fGetValueI(oQuery, 'LOFPR_TYPEM_ID');
        rLOFPR_Infos.piLOFPR_TRANC_ID       := fGetValueI(oQuery, 'LOFPR_TRANC_ID');
        rLOFPR_Infos.psTRANC_DES            := fGetValueS(oQuery, 'TRANC_DES');
        rLOFPR_Infos.psLOFPR_CMNT_TARIF     := fGetValueS(oQuery, 'LOFPR_CMNT_TARIF');
        rLOFPR_Infos.pnLOFPR_PRX_TARIF      := fGetValueI(oQuery, 'LOFPR_PRX_TARIF');
        rLOFPR_Infos.psMODEL_ST_COM         := fGetValueS(oQuery, 'MODEL_ST_COM');
        rLOFPR_Infos.piPRCDT_ID             := fGetValueI(oQuery, 'PRCDT_ID');
        rLOFPR_Infos.psPRCDT_DES            := fGetValueS(oQuery, 'PRCDT_DES');
        rLOFPR_Infos.pnPRCDT_NB_COLS_PAL    := fGetValueI(oQuery, 'PRCDT_NB_COLS_PAL');
        rLOFPR_Infos.psPLCOD_CODE           := fGetValueS(oQuery, 'PLCOD_CODE');
        rLOFPR_Infos.psTRGEN_CODE           := fGetValueS(oQuery, 'TRGEN_CODE');
        rLOFPR_Infos.psTYPAL_SHORT_DES      := fGetValueS(oQuery, 'TYPAL_SHORT_DES');
        rLOFPR_Infos.piLOFPR_FLG_REMISE_EDT := fGetValueI(oQuery, 'LOFPR_FLG_REMISE_EDT');
        rLOFPR_Infos.pnPRX_GLOBAL           := fGetValueI(oQuery, 'PRX_GLOBAL');
        rLOFPR_Infos.piLOFPR_FAMIL_ID       := fGetValueI(oQuery, 'LOFPR_FAMIL_ID');
        rLOFPR_Infos.piTypeDmdDerog         := fGetValueI(oQuery, 'TypeDmdDerog');
        rLOFPR_Infos.psCDECO_NUM            := fGetValueS(oQuery, 'CDECO_NUM');
        rLOFPR_Infos.psCDECO_DES            := fGetValueS(oQuery, 'CDECO_DES');
        rLOFPR_Infos.piLLOST_LOFPR_ID       := fGetValueI(oQuery, 'LLOST_LOFPR_ID');
        rLOFPR_Infos.piLOFPR_PDDIV_ID       := fGetValueI(oQuery, 'LOFPR_PDDIV_ID');
        rLOFPR_Infos.psPDDIV_CODE           := fGetValueS(oQuery, 'PDDIV_CODE');
        rLOFPR_Infos.psPDDIV_DES            := fGetValueS(oQuery, 'PDDIV_DES');
        rLOFPR_Infos.piLOFPR_ZOTRF_ID       := fGetValueI(oQuery, 'LOFPR_ZOTRF_ID');
        rLOFPR_Infos.psZOTRF_DES            := fGetValueS(oQuery, 'ZOTRF_DES');
        rLOFPR_Infos.psPDTEM_DES            := fGetValueS(oQuery, 'PDTEM_DES');
        rLOFPR_Infos.piLOFPR_TRZTF_ID       := fGetValueI(oQuery, 'LOFPR_TRZTF_ID');
        rLOFPR_Infos.piLOFPR_FLG_SELECT     := fGetValueI(oQuery, 'LOFPR_FLG_SELECT');



        Result.Add(rLOFPR_Infos);
        oQuery.Next;
      end;
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;


procedure InsertionNouvellesLignes(var MaList_LOFPR_Infos: TList_LOFPR_Infos);
var
  nNew_ID_ligne: Integer;
  oQuery: TUNIQuery;
  piOFFPR_ID, inc : Integer;

  procedure param_insertion_lignes_offre(var Myquery: TUNIQuery; var
      MaList_LOFPR_Infos: TList_LOFPR_Infos; New_idligne: Integer; MonIndex: Integer);
  begin
    // Pr�paration insertions des lignes de relances
    fQueryDeclareParameterType(Myquery, 'iLOFPR_ID',             ftInteger, New_idligne);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_OFFPR_ID',       ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_OFFPR_ID);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_NUM',            ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_NUM);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_MODEL_ID',       ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_MODEL_ID);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_CDECO_ID',       ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_CDECO_ID);
    fQueryDeclareParameterType(Myquery, 'sLOFPR_COMMENTAIRE',    ftstring,  MaList_LOFPR_Infos.Items[MonIndex].psLOFPR_COMMENTAIRE);
    fQueryDeclareParameterType(Myquery, 'sLOFPR_COMMENTAIRE_EN', ftstring,  MaList_LOFPR_Infos.Items[MonIndex].psLOFPR_COMMENTAIRE_EN);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_BAGEN_ID',       ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_BAGEN_ID);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_TEINT_ID',       ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_TEINT_ID);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_PALTI_ID',       ftInteger, EmptyStr);
    fQueryDeclareParameterType(Myquery, 'nLOFPR_QTE',            ftInteger, MaList_LOFPR_Infos.Items[MonIndex].pnLOFPR_QTE);
    fQueryDeclareParameterType(Myquery, 'nLOFPR_PRIX_UNITAIRE',  ftInteger, MaList_LOFPR_Infos.Items[MonIndex].pnLOFPR_PRIX_UNITAIRE);
    fQueryDeclareParameterType(Myquery, 'nLOFPR_TX_MAJORATION',  ftInteger, MaList_LOFPR_Infos.Items[MonIndex].pnLOFPR_TX_MAJORATION);
    fQueryDeclareParameterType(Myquery, 'nLOFPR_TX_REMISE',      ftInteger, MaList_LOFPR_Infos.Items[MonIndex].pnLOFPR_TX_REMISE);
    fQueryDeclareParameterType(Myquery, 'nLOFPR_PRIX_NET',       ftFloat  , MaList_LOFPR_Infos.Items[MonIndex].pnLOFPR_PRIX_NET);
    fQueryDeclareParameterType(Myquery, 'sLOFPR_DATECRE',        ftDateTime,  fCurrentDateOnly);
    fQueryDeclareParameterType(Myquery, 'sLOFPR_DATEMOD',        ftDateTime,  fCurrentDateOnly);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_SUP',            ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_SUP);
    fQueryDeclareParameterType(Myquery, 'sLOFPR_COLMOD',         ftstring,  MaList_LOFPR_Infos.Items[MonIndex].psLOFPR_COLMOD);
    fQueryDeclareParameterType(Myquery, 'sLOFPR_DESIGNATION',    ftstring,  MaList_LOFPR_Infos.Items[MonIndex].psLOFPR_DESIGNATION);
    fQueryDeclareParameterType(Myquery, 'sLOFPR_DESIGNATION_EN', ftstring,  MaList_LOFPR_Infos.Items[MonIndex].psLOFPR_DESIGNATION_EN);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_TYPE_LIGNE',     ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_TYPE_LIGNE);
    fQueryDeclareParameterType(Myquery, 'nLOFPR_PRIX_MAJORE',    ftInteger, MaList_LOFPR_Infos.Items[MonIndex].pnLOFPR_PRIX_MAJORE);
    fQueryDeclareParameterType(Myquery, 'nLOFPR_PRIX_NET_TRPT',  ftInteger, MaList_LOFPR_Infos.Items[MonIndex].pnLOFPR_PRIX_NET_TRPT);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_NAT',            ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_NAT);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_DICAT_ID',       ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_DICAT_ID);
    fQueryDeclareParameterType(Myquery, 'sLOFPR_OBSV',           ftstring,  MaList_LOFPR_Infos.Items[MonIndex].psLOFPR_OBSV);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_DISPO',          ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_DISPO);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_TYPEM_ID',       ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_TYPEM_ID);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_TRANC_ID',       ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_TRANC_ID);
    fQueryDeclareParameterType(Myquery, 'nLOFPR_PRX_TARIF',      ftInteger, MaList_LOFPR_Infos.Items[MonIndex].pnLOFPR_PRX_TARIF);
    fQueryDeclareParameterType(Myquery, 'sLOFPR_CMNT_TARIF',     ftstring,  MaList_LOFPR_Infos.Items[MonIndex].psLOFPR_CMNT_TARIF);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_PRCDT_ID',       ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piPRCDT_ID);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_FLG_CHECK_PL'  , ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_FLG_CHECK_PL);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_FLG_REMISE_EDT', ftInteger, MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_FLG_REMISE_EDT);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_FAMIL_ID'      , ftstring,  MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_FAMIL_ID);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_PDDIV_ID'      , ftstring,  MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_PDDIV_ID);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_ZOTRF_ID'      , ftstring,  MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_ZOTRF_ID);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_TRZTF_ID'      , ftstring,  MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_TRZTF_ID);
    fQueryDeclareParameterType(Myquery, 'iLOFPR_FLG_SELECT'    , ftstring,  MaList_LOFPR_Infos.Items[MonIndex].piLOFPR_FLG_SELECT);
  end;

begin
  try
    try
      if  MaList_LOFPR_Infos.Count > 0 then
      begin
      
        MaList_LOFPR_Infos.First;
        piOFFPR_ID := MaList_LOFPR_Infos.First.piLOFPR_OFFPR_ID;
        for inc := 0 to MaList_LOFPR_Infos.Count - 1 do
        begin

          if fORASequence('GEN_LOFPR_ID', nNew_ID_ligne) then
          begin

            oQuery := TUNIQuery.Create(nil);
            try
              if fQueryRQSQL(oQuery, 46227) then // old = 37968, 19735, 16845, 13487
              begin
                param_insertion_lignes_offre(oQuery,MaList_LOFPR_Infos, nNew_ID_ligne, inc);
                fQueryOpen(oQuery, True);
              end;
            finally
              FreeAndNil(oQuery);
            end;

          end;

        end;

      end;
    except
      raise;
    end;
  finally
    FreeAndNil(oQuery);
  end;
  fRechercheMontantOffre(piOFFPR_ID);
end;

procedure InsertionNouvellesLignesRelances(var MaList_HOFPR_Infos:
    TList_HOFPR_Infos);
var
  oQuery : TuniQuery;
  bInTransaction: Boolean;
  inc : Integer;

  procedure param_insertion_lignes_relances(var Myquery: TUNIQuery; var
      MaList_HOFPR_Infos: TList_HOFPR_Infos; MonIndex: Integer);
  begin
    // Pr�paration insertions des lignes de relances
    fQueryDeclareParameterType(Myquery, 'sHOFPR_DATECRE',      ftstring, MaList_HOFPR_Infos.Items[MonIndex].pdHOFPR_DATECRE);
    fQueryDeclareParameterType(Myquery, 'sHOFPR_DATEMOD',      ftstring, MaList_HOFPR_Infos.Items[MonIndex].pdHOFPR_DATEMOD);
    fQueryDeclareParameterType(Myquery, 'sHOFPR_COLMOD',       ftstring, MaList_HOFPR_Infos.Items[MonIndex].psHOFPR_COLMOD);
    fQueryDeclareParameterType(Myquery, 'iHOFPR_SUP',          ftInteger, 0);
    fQueryDeclareParameterType(Myquery, 'iHOFPR_NUM_RELANCE',  ftInteger, MaList_HOFPR_Infos.Items[MonIndex].piH1OFPR_NUM_RELANCE);
    fQueryDeclareParameterType(Myquery, 'iHOFPR_OFFPR_ID',     ftInteger, MaList_HOFPR_Infos.Items[MonIndex].piHOFPR_OFFPR_ID);
    fQueryDeclareParameterType(Myquery, 'iHOFPR_COLLA_ID',     ftInteger, MaList_HOFPR_Infos.Items[MonIndex].piHOFPR_COLLA_ID);
    fQueryDeclareParameterType(Myquery, 'sHOFPR_CMNT',         ftstring, MaList_HOFPR_Infos.Items[MonIndex].psHOFPR_CMNT);
    fQueryDeclareParameterType(Myquery, 'sHOFPR_DATE_RELANCE', ftstring, MaList_HOFPR_Infos.Items[MonIndex].pdHOFPR_DATE_RELANCE);
  end;

begin
  oQuery := TUNIQuery.Create(nil);
  try
    bInTransaction := dmdConnect.cntMain.InTransaction;
    if not bInTransaction then
      dmdConnect.cntMain.StartTransaction;
    try
      if  MaList_HOFPR_Infos.Count > 0 then
      begin

        MaList_HOFPR_Infos.First;
        for inc := 0 to MaList_HOFPR_Infos.Count - 1 do
        begin

          if fQueryRQSQL(oQuery, 10761) then
          begin
            param_insertion_lignes_relances(oQuery, MaList_HOFPR_Infos, inc);
            fQueryOpen(oQuery);
          end;

        end;

      end;
      if not bInTransaction then
        dmdConnect.cntMain.Commit;
    except
      on E: Exception do
      begin
        if not bInTransaction then
          dmdConnect.cntMain.Rollback;
        raise;
      end;
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;


function fRechercheMontantOffre(piOFFPR_ID: Integer): string;
var
  oQuery: TUNIQuery;
begin
  try
    Result{edtMontantOffre.Text} := '0';
    oQuery := TUNIQuery.Create(nil);
    try
      if fQueryRQSQL(oQuery, 19539) then // old = 13487
      begin
        fQueryDeclareParameterType(oQuery, 'iOFFPR_ID', ftInteger, piOFFPR_ID);
        fQueryOpen(oQuery, false);
        if not oQuery.Eof then
          Result{edtMontantOffre.Text} := formatfloat('#,##0.00', fGetValueF(oQuery, 'SOMME'));
      end;
    finally
      FreeAndNil(oQuery);
    end;
  except
    raise;
  end;
end;

// Mise � jour des champs au statut non abouti
procedure pMajChampsOFFPR_ST_NON_ABOUTI(piOFFPR_ID: Integer; piOFFPR_RANTR_ID: Integer; psOFFPR_NAB_CMNT: string; psOFFPR_COLMOD: string);
var
  oQuery: TUNIQuery;
  bInTransaction: Boolean;
begin
  oQuery := TUNIQuery.Create(nil);
  try
    bInTransaction := dmdConnect.cntMain.InTransaction;
    if not bInTransaction then
      dmdConnect.cntMain.StartTransaction;
    try
      if fQueryRQSQL(oQuery, 44794) then
      begin
        fQueryDeclareParameterType(oQuery, 'piOFFPR_RANTR_ID', ftInteger, piOFFPR_RANTR_ID);
        fQueryDeclareParameterType(oQuery, 'psOFFPR_NAB_CMNT',  ftString, psOFFPR_NAB_CMNT);
        fQueryDeclareParameterType(oQuery, 'psOFFPR_COLMOD',    ftString, psOFFPR_COLMOD);
        fQueryDeclareParameterType(oQuery, 'piOFFPR_ID',       ftInteger, piOFFPR_ID);
        fQueryOpen(oQuery);
      end;
      if not bInTransaction then
        dmdConnect.cntMain.Commit;
    except
      on E: Exception do
      begin
        if not bInTransaction then
          dmdConnect.cntMain.Rollback;
        raise;
      end;
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;
// Mise  jour des champs au statut non abouti
procedure pMajChampsOFFRE_ST_NON_ABOUTI(piOFFRE_ID: Integer; piOFFRE_RANTR_ID: Integer; psOFFRE_NAB_CMNT: string; psOFFRE_COLMOD: string);
var
  oQuery: TUNIQuery;
  bInTransaction: Boolean;
begin
  oQuery := TUNIQuery.Create(nil);
  try
    bInTransaction := dmdConnect.cntMain.InTransaction;
    if not bInTransaction then
      dmdConnect.cntMain.StartTransaction;
    try
      if fQueryRQSQL(oQuery, 46685) then
      begin
        fQueryDeclareParameterType(oQuery, 'piOFFRE_RANTR_ID', ftInteger, piOFFRE_RANTR_ID);
        fQueryDeclareParameterType(oQuery, 'psOFFRE_NAB_CMNT',  ftString, psOFFRE_NAB_CMNT);
        fQueryDeclareParameterType(oQuery, 'psOFFRE_COLMOD',    ftString, psOFFRE_COLMOD);
        fQueryDeclareParameterType(oQuery, 'piOFFRE_ID',       ftInteger, piOFFRE_ID);
        fQueryOpen(oQuery);
      end;
      if not bInTransaction then
        dmdConnect.cntMain.Commit;
    except
      on E: Exception do
      begin
        if not bInTransaction then
          dmdConnect.cntMain.Rollback;
        raise;
      end;
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;

// V�rification des champs obligatoires
function fCtrlValeurOFFPR(piOFFPR_ID: Integer): Boolean;
var
    MessageContext : TMessageContext;
    sComplementMessage : String;
    rOFFPR_Infos: TOFFPR_Infos;
begin

  rOFFPR_Infos := fRemplirOFFPR_Info(piOFFPR_ID);

  MessageContext.Module := 'Gclog';
  MessageContext.Transaction := 'OFFPR';
  MessageContext.Context := 'Fiche';

  Result := True;
  sComplementMessage := fGetMessage(MessageContext, 'DansLaFicheOffre');

  if (not (rOFFPR_Infos.piOFFPR_TARIF_UNIQ_ID > 0)) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerletarif'), 1, 1);
    Exit;
  end; 
  if (not (rOFFPR_Infos.piOFFPR_TIERS_ID > 0)) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'saisirletiersaa'), 1, 1);
    Exit;
  end; 
  if (not (rOFFPR_Infos.piOFFPR_LANGU_ID > 0)) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerlalangue'), 1, 1);
    Exit;
  end; 
  if (not (rOFFPR_Infos.piOFFPR_TYRPI_ID > 0)) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerletypededocument'), 1, 1);
    Exit;
  end;  
  if (not (rOFFPR_Infos.piADM_COLLA_ID > 0)) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerlecrateurdeloffre'), 1, 1);
    Exit;
  end; 
  if (not (rOFFPR_Infos.piDVISE_ID > 0)) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerladevise'), 1, 1);
    Exit;
  end; 
  if (not (rOFFPR_Infos.piCOLLA_SIGN_ID > 0)) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerlesignatairedeloffre'), 1, 1);
    Exit;
  end; 
  if (not (rOFFPR_Infos.piOFFPR_POTENTIEL_QTE > 0)) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerlepotentieldeloffre'), 1, 1);
    Exit;
  end; 
  if (not (rOFFPR_Infos.piOFFPR_POTENTIEL_QTE_UNITE > -1)) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerunitePoentielOffre'), 1, 1);
    Exit;
  end; 
  if (rOFFPR_Infos.pdOFFPR_DATE_VALIDITE_PRIX = 0) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerladateValiditePrix'), 1, 1);
    Exit;
  end; 
  if (rOFFPR_Infos.psCONTA_FONCTION = '') then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerlafonctionducontact'), 1, 1);
    Exit;
  end; 
  if (rOFFPR_Infos.psCONTA_NOM = '') then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerlecontactclient'), 1, 1);
    Exit;
  end; 
  if (not (rOFFPR_Infos.piOFFPR_SOCIE_ID > 0)) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'choisirunesociet'), 1, 1);
    Exit;
  end; 
  if not (rOFFPR_Infos.piOFFPR_ZOCOM_ID > 0) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerlesecteurcommercial'), 1, 1);
    Exit;
  end; 
  if not (rOFFPR_Infos.piOFFPR_TYRPI_ID > 0) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerletypededocument'), 1, 1);
    Exit;
  end;
  if not (rOFFPR_Infos.piOFFPR_LANGU_ID > 0) then
  begin
    Result := False;
    fMessageErreur(sComplementMessage + fGetMessage(MessageContext, 'indiquerlalangue'), 1, 1);
    Exit;
  end;   
end;

// G�n�ration des PDFs lors de l'emission
procedure pgenereFBLOB(piOFFPR_ID : Integer; piLANGU_ID : Integer; pbOFFPR_FLG_RPI : Boolean);
begin
  // G�n�ration offre.pdf avec d�mat�riallisation
  pImpressionEtat(tWSETAT.OFFPR, True, piLANGU_ID, piOFFPR_ID);
  if piLANGU_ID = Cst_Langue_RU then // Cas particulier pour le Russe
    pImpressionEtat(tWSETAT.OFFPR, True, Cst_Langue_UK, piOFFPR_ID); 

  // G�n�ration rpi avec d�mat�riallisation
  if fCheckModelsRPI(piOFFPR_ID) = 1 then
    if pbOFFPR_FLG_RPI then
    begin
      pImpressionEtat(tWSETAT.OFFPR_RPI, True, piLANGU_ID, piOFFPR_ID);
      if piLANGU_ID = Cst_Langue_RU then // Cas particulier pour le Russe
        pImpressionEtat(tWSETAT.OFFPR_RPI, True, Cst_Langue_UK, piOFFPR_ID);
    end;
end;

// Impression des Etats Windev
procedure pImpressionEtat(ETAT : TWSETAT; vdemat: boolean; piLANGU_ID : Integer; piOFFPR_ID : Integer);
begin
  if not vdemat then
    WS_EDITIONS_Unit.pPREVIEW_ETAT(ETAT, piLANGU_ID, piOFFPR_ID)
  else
    WS_EDITIONS_Unit.fPRINT_ETAT(ETAT, piLANGU_ID, piOFFPR_ID, StrToInt(_UserHH.Id));
end;

// Envoi du mail de demande de derogation
function fEnvoiMailDemandeDeDerogation(piOFFPR_ID : Integer; piCOLLA_ID : Integer; pTTypeDmdDerog : TTypeDmdDerog) : Boolean;
var
  oProc : TUniStoredProc;
begin
  oProc := TUniStoredProc.Create(nil);
  try
    oProc := fCreateStoredProc('PKG_OFFRE.fEnvoiMailDemandeDeDerogation', dmdConnect.cntMain);
    fProcDeclareParameterType(oProc, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
    fProcDeclareParameterType(oProc, 'piCOLLA_ID', ftInteger, piCOLLA_ID);
    fProcDeclareParameterType(oProc, 'pTypeDmdDerog', ftInteger, ord(pTTypeDmdDerog));
    oProc.ExecProc;
    Result := Boolean(oProc.GetResult);
  finally
    FreeAndNil(oProc);
  end;
end;
// Envoi du mail de refus de derogation
function fEnvoiMailRefusDeDerogation(piOFFPR_ID : Integer; piCOLLA_ID : Integer) : Boolean;
var
  oProc : TUniStoredProc;
begin
  oProc := TUniStoredProc.Create(nil);
  try
    oProc := fCreateStoredProc('PKG_OFFRE.fEnvoiMailRefusDeDerogation', dmdConnect.cntMain);
    fProcDeclareParameterType(oProc, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
    fProcDeclareParameterType(oProc, 'piCOLLA_ID', ftInteger, piCOLLA_ID);
    oProc.ExecProc;
    Result := Boolean(oProc.GetResult);
  finally
    FreeAndNil(oProc);
  end;
end;
// MAJ du champ ST de l'offre + historique
procedure pMAJ_OFFPR_ST(piOFFPR_ID : Integer; piOFFPR_ST : Integer; piCOLLA_ID : Integer; psCOMMENTAIRE : String = '');
var
  oProc : TUniStoredProc;
  bInTransaction : Boolean;
begin
  oProc := TUniStoredProc.Create(nil);
  try
    bInTransaction := dmdConnect.cntMain.InTransaction;
    if not bInTransaction then
      dmdConnect.cntMain.StartTransaction;
    try
      oProc := fCreateStoredProc('PKG_OFFRE.pMAJ_OFFPR_ST', dmdConnect.cntMain);
      fProcDeclareParameterType(oProc, 'piOFFPR_ID', ftInteger, piOFFPR_ID);
      fProcDeclareParameterType(oProc, 'piOFFPR_ST', ftInteger, piOFFPR_ST);
      fProcDeclareParameterType(oProc, 'piCOLLA_ID', ftInteger, piCOLLA_ID);
      fProcDeclareParameterType(oProc, 'psCOMMENTAIRE', ftString, psCOMMENTAIRE);
      oProc.ExecProc;
      if not bInTransaction then
        dmdConnect.cntMain.Commit;
    except
      on E: Exception do
      begin
        if not bInTransaction then
          dmdConnect.cntMain.Rollback;
        raise;
      end;
    end;
  finally
    FreeAndNil(oProc);
  end;
end;

function fRemplirTIERS_Infos(piTIERS_ID : Integer) : TTIERS_Infos;
var
  oQuery : TUNIQuery;
begin
  oQuery := TUNIQuery.Create(nil);
  try
    if fQueryRQSQL(oQuery, 45502) then // 45054
    begin
      fQueryDeclareParameterType(oQuery, 'piTIERS_ID', ftInteger, piTIERS_ID);
      fQueryOpen(oQuery);
    end;
    if not oQuery.Eof then
    begin
      Result.piTIERS_ID := oQuery.FieldByName('TIERS_ID').AsInteger;
      Result.psTIERS_RS := oQuery.FieldByName('TIERS_RS_L1').AsString;
      Result.psTIERS_ADR1 := oQuery.FieldByName('TIERS_ADPH_L1').AsString;
      Result.psTIERS_ADR2 := oQuery.FieldByName('TIERS_ADPH_L2').AsString;
      Result.psTIERS_CODEP := oQuery.FieldByName('TIERS_ADPH_CP').AsString;
      Result.psTIERS_VILLE := oQuery.FieldByName('VILLE_DES').AsString;
      Result.psTIERS_PAYS := oQuery.FieldByName('PAYS_DES').AsString;
    end;
  finally
    FreeAndNil(oQuery);
  end;

end;

  procedure pChargeCollaRelance(piOFFPR_ID: Integer;
                                  var piCOLLA_ID: Integer;
                                  var psCOLLA_TRIG: String;
                                  var psCOLLA_NOM_PRENOM: String);
  var
    oProc: TUniStoredProc;
  begin
    oProc  := TUniStoredProc.Create(nil);
    try
      oProc :=fCreateStoredProc(oProc, 'PKG_OFFRE.pChargeCollaRelance', dmdConnect.cntMain);
      fProcDeclareParameterType(oProc, 'piOFFPR_ID',    ftInteger, piOFFPR_ID);
      fProcDeclareParameterType(oProc, 'piCOLLA_ID',    ftInteger, piCOLLA_ID);
      fProcDeclareParameterType(oProc, 'psCOLLA_TRIG',  ftString, psCOLLA_TRIG);
      fProcDeclareParameterType(oProc, 'psCOLLA_NOM_PRENOM', ftString, psCOLLA_NOM_PRENOM);
      oProc.ExecProc;
      if oProc.RecordCount > 0 then
      begin
        oProc.First;
        piCOLLA_ID := oProc.ParamByName('piCOLLA_ID').AsInteger;
        psCOLLA_TRIG := oProc.ParamByName('psCOLLA_TRIG').AsString;
        psCOLLA_NOM_PRENOM := oProc.ParamByName('psCOLLA_NOM_PRENOM').AsString;
      end;
    finally
      FreeAndNil(oProc);
    end;
  end;

  function fformatCommentaireOFFPR_ST(piOFFPR_ST_SOURCE : Integer; piOFFPR_ST_CIBLE : Integer) : String;
  var
    oProc: TUniStoredProc;
  begin
    oProc  := TUniStoredProc.Create(nil);
    try
      oProc:= fCreateStoredProc('PKG_OFFRE.fformatCommentaireOFFPR_ST', dmdConnect.cntMain);
      fProcDeclareParameterType(oProc, 'piOFFPR_ST_SOURCE', ftInteger, piOFFPR_ST_SOURCE);
      fProcDeclareParameterType(oProc, 'piOFFPR_ST_CIBLE', ftInteger, piOFFPR_ST_CIBLE);
      oProc.ExecProc;
      Result := oProc.GetResult;
    finally
      FreeAndNil(oProc);
    end;
  end;

  procedure pDeleteSeparator(Sender: TObject);
  var
    S: string;
  begin
    S := TEdit(Sender).Text;
    S := StringReplace(S, ' ', '', [rfReplaceAll]); // ton millier
    S := StringReplace(S, #160, '', [rfReplaceAll]);  // puis supprimer l'espace insécable

    TEdit(Sender).Text := S;
  end;

  procedure pDeleteSeparator(var S : String);
  begin
    S := StringReplace(S, ' ', '', [rfReplaceAll]); // ton millier
    S := StringReplace(S, #160, '', [rfReplaceAll]);  // puis supprimer l'espace insécable
  end;

  function fDeleteSeparator(S: String): String;
  begin
    S := StringReplace(S, ' ', '', [rfReplaceAll]); // ton millier
    S := StringReplace(S, #160, '', [rfReplaceAll]);  // puis supprimer l'espace insécable

    Result := S;
  end;

  procedure pThouthandSeparator(Sender: TObject);
  var
    dValue: Extended;
    S: string;
    CurseurPos: Integer;
    fsFR, fsUS: TFormatSettings;
    iLength: Integer;
    iLengthFinal: Integer;
  begin

    dValue := 0;
    CurseurPos := TEdit(Sender).SelStart;
    iLength := Length(TEdit(Sender).Text);

    // Format FRANCE (européen)
    fsFR := TFormatSettings.Create('fr-FR');
    fsFR.DecimalSeparator := ',';
    fsFR.ThousandSeparator := ' '; // ou ',' ou '.' selon ton style

    // Format USA (américain)
//    fsUS := TFormatSettings.Create('en-US');
//    fsUS.DecimalSeparator := '.';
//    fsUS.ThousandSeparator := ',';

    pDeleteSeparator(TEdit(Sender));

    S := TEdit(Sender).Text;

    if not TryStrToFloat(S, dValue) then
    begin
      TEdit(Sender).Text := ''; // ou Message d'erreur selon ton besoin
      exit;
    end;

    if (dValue > 0) then
      // Format avec séparateur de milliers (ex: 1 000 000)
      if (Pos(',', S) > 0) or (Pos('.', S) > 0) then
        TEdit(Sender).Text := FormatFloat('#,##0.00', dValue, fsFR)
      else
        TEdit(Sender).Text := FormatFloat('#,##0', dValue, fsFR);

    iLengthFinal := Length(TEdit(Sender).Text);
    if iLength > iLengthFinal then
      dec(CurseurPos)
    else if iLength < iLengthFinal then
      inc(CurseurPos);


    TEdit(Sender).SelStart := CurseurPos;  // Restaure la position

  end;

procedure pDataToDataset(var dxmdLOFPROnglet: TdxMemData; var rDATAS_LOFPR_Ligne: TDATAS_LOFPR_Ligne; sType : String = 'Modif');
var
  numLigne : Integer;
begin

  if sType = 'Ajout' then
  begin
    numLigne := dxmdLOFPROnglet.RecordCount + 1;

    dxmdLOFPROnglet.FieldByName('LOFPR_ID').asInteger            := 0;
    dxmdLOFPROnglet.FieldByName('LOFPR_NUM').asInteger           := numLigne;
    dxmdLOFPROnglet.FieldByName('LOFPR_NAT').asInteger           := rDATAS_LOFPR_Ligne.nLOFPR_NAT;
  end;

  dxmdLOFPROnglet.FieldByName('LOFPR_PRCDT_ID').asString       := rDATAS_LOFPR_Ligne.sLOFPR_PRCDT_ID;
  dxmdLOFPROnglet.FieldByName('CODE_MODEL').asString           := rDATAS_LOFPR_Ligne.sMODEL_CODE;
  dxmdLOFPROnglet.FieldByName('des_bague').asString            := rDATAS_LOFPR_Ligne.sBAGEN_DES;
  dxmdLOFPROnglet.FieldByName('des_teinte').asString           := rDATAS_LOFPR_Ligne.sTEINT_DES;
  dxmdLOFPROnglet.FieldByName('LOFPR_PLCOD_CODE').asString     := rDATAS_LOFPR_Ligne.sLOFPR_PLCOD_CODE;
  dxmdLOFPROnglet.FieldByName('LOFPR_TRGEN_CODE').asString     := rDATAS_LOFPR_Ligne.sLOFPR_TRGEN_CODE;
  dxmdLOFPROnglet.FieldByName('emb').asString                  := rDATAS_LOFPR_Ligne.semb;
  dxmdLOFPROnglet.FieldByName('qte_pal').asString              := rDATAS_LOFPR_Ligne.iqte_pal.ToString();
  dxmdLOFPROnglet.FieldByName('TYPAL_SHORT_DES').asString      := rDATAS_LOFPR_Ligne.sTYPAL_SHORT_DES;
  dxmdLOFPROnglet.FieldByName('des_dispo').asString            := rDATAS_LOFPR_Ligne.sLOFPR_DISPO;
  dxmdLOFPROnglet.FieldByName('LOFPR_QTE').asInteger           := fFStrToInteger(fDeleteSeparator(rDATAS_LOFPR_Ligne.sLOFPR_QTE));
  dxmdLOFPROnglet.FieldByName('LOFPR_PRIX_UNITAIRE').AsFloat   := fFStrToFloat(fDeleteSeparator(rDATAS_LOFPR_Ligne.sLOFPR_PRIX_UNITAIRE));
  dxmdLOFPROnglet.FieldByName('LOFPR_TX_MAJORATION').AsFloat   := fFStrToFloat(fDeleteSeparator(rDATAS_LOFPR_Ligne.sLOFPR_TX_MAJORATION));
  dxmdLOFPROnglet.FieldByName('LOFPR_TX_REMISE').AsFloat       := fFStrToFloat(fDeleteSeparator(rDATAS_LOFPR_Ligne.sLOFPR_TX_REMISE));
  dxmdLOFPROnglet.FieldByName('LOFPR_PRIX_NET').AsFloat        := fFStrToFloat(fDeleteSeparator(rDATAS_LOFPR_Ligne.sLOFPR_PRIX_NET));
  dxmdLOFPROnglet.FieldByName('montant').AsFloat               := fFStrToFloat(fDeleteSeparator(rDATAS_LOFPR_Ligne.smontant));
  dxmdLOFPROnglet.FieldByName('LOFPR_OBSV').asString           := '';
  dxmdLOFPROnglet.FieldByName('Remarques').asString            := rDATAS_LOFPR_Ligne.sRemarques;
  dxmdLOFPROnglet.FieldByName('LOFPR_PRCDT_DES').asString      := rDATAS_LOFPR_Ligne.sLOFPR_PRCDT_DES;
  dxmdLOFPROnglet.FieldByName('trav').asString                 := '';
  dxmdLOFPROnglet.FieldByName('LOFPR_COMMENTAIRE').asString    := rDATAS_LOFPR_Ligne.sLOFPR_COMMENTAIRE;
  dxmdLOFPROnglet.FieldByName('LOFPR_DATEMOD').AsDateTime      := fCurrentDateTime;
  dxmdLOFPROnglet.FieldByName('LOFPR_SUP').AsInteger           := 0;
  dxmdLOFPROnglet.FieldByName('LOFPR_COLMOD').asString         := fGetUser;
  dxmdLOFPROnglet.FieldByName('LOFPR_TYPE_LIGNE').AsInteger    := rDATAS_LOFPR_Ligne.iLOFPR_TYPE_LIGNE;
  dxmdLOFPROnglet.FieldByName('LOFPR_PRIX_MAJORE').asString    := rDATAS_LOFPR_Ligne.sLOFPR_PRIX_MAJORE;
  dxmdLOFPROnglet.FieldByName('LOFPR_PRIX_NET_TRPT').asString  := '';
  dxmdLOFPROnglet.FieldByName('LOFPR_PRX_TARIF').AsFloat       := fFStrToFloat(fDeleteSeparator(rDATAS_LOFPR_Ligne.sLOFPR_PRX_TARIF));
  dxmdLOFPROnglet.FieldByName('LOFPR_CMNT_TARIF').asString     := rDATAS_LOFPR_Ligne.sLOFPR_CMNT_TARIF;
  dxmdLOFPROnglet.FieldByName('TRANC_DES').asString            := rDATAS_LOFPR_Ligne.sTRANC_DES;
  dxmdLOFPROnglet.FieldByName('LOFPR_MODEL_ID').asString       := rDATAS_LOFPR_Ligne.sLOFPR_MODEL_ID;
  dxmdLOFPROnglet.FieldByName('LOFPR_BAGEN_ID').asString       := rDATAS_LOFPR_Ligne.sLOFPR_BAGEN_ID;
  dxmdLOFPROnglet.FieldByName('LOFPR_TEINT_ID').asString       := rDATAS_LOFPR_Ligne.sLOFPR_TEINT_ID;
  dxmdLOFPROnglet.FieldByName('LOFPR_PALTI_ID').asString       := rDATAS_LOFPR_Ligne.sLOFPR_PALTI_ID;
  dxmdLOFPROnglet.FieldByName('LOFPR_DICAT_ID').asString       := rDATAS_LOFPR_Ligne.sLOFPR_DICAT_ID;
  dxmdLOFPROnglet.FieldByName('LOFPR_DISPO').asString          := rDATAS_LOFPR_Ligne.sLOFPR_DISPO;
  dxmdLOFPROnglet.FieldByName('LOFPR_TYPEM_ID').asString       := rDATAS_LOFPR_Ligne.sLOFPR_TYPEM_ID;
  dxmdLOFPROnglet.FieldByName('LOFPR_TRANC_ID').asString       := rDATAS_LOFPR_Ligne.sLOFPR_TRANC_ID;

  dxmdLOFPROnglet.FieldByName('CDCFO_ID').asString             := '';
  dxmdLOFPROnglet.FieldByName('CDCFO_DES').asString            := '';
  dxmdLOFPROnglet.FieldByName('CDCFO_NUM').asString            := '';
  dxmdLOFPROnglet.FieldByName('LOFPR_DESIGNATION').asString    := rDATAS_LOFPR_Ligne.sLOFPR_DESIGNATION;
  dxmdLOFPROnglet.FieldByName('LOFPR_DESIGNATION_EN').asString := rDATAS_LOFPR_Ligne.sLOFPR_DESIGNATION_EN;
  dxmdLOFPROnglet.FieldByName('LOFPR_COMMENTAIRE_EN').asString := rDATAS_LOFPR_Ligne.sLOFPR_COMMENTAIRE_EN;

  dxmdLOFPROnglet.FieldByName('LOFPR_FLG_CHECK_PL').AsInteger   := rDATAS_LOFPR_Ligne.iLOFPR_FLG_CHECK_PL;
  dxmdLOFPROnglet.FieldByName('LOFPR_FLG_REMISE_EDT').AsInteger := rDATAS_LOFPR_Ligne.iLOFPR_FLG_REMISE_EDT;
  dxmdLOFPROnglet.FieldByName('LOFPR_PRCDT_TYP').asString       := rDATAS_LOFPR_Ligne.sLOFPR_PRCDT_TYP;
  dxmdLOFPROnglet.FieldByName('PRX_GLOBAL').asString            := rDATAS_LOFPR_Ligne.dPRX_GLOBAL.ToString();
  dxmdLOFPROnglet.FieldByName('LLOST_LOFPR_ID').asString       := rDATAS_LOFPR_Ligne.sLLOST_LOFPR_ID;

  dxmdLOFPROnglet.FieldByName('LOFPR_CDECO_ID').asString       := rDATAS_LOFPR_Ligne.sLOFPR_CDECO_ID;
  dxmdLOFPROnglet.FieldByName('CDECO_NUM').asString            := rDATAS_LOFPR_Ligne.sCDECO_NUM;
  dxmdLOFPROnglet.FieldByName('CDECO_DES').asString            := rDATAS_LOFPR_Ligne.sCDECO_DES;

  dxmdLOFPROnglet.FieldByName('LLOST_LOFPR_ID').asString        := rDATAS_LOFPR_Ligne.sLLOST_LOFPR_ID;

  dxmdLOFPROnglet.FieldByName('LOFPR_PDDIV_ID').asString        := rDATAS_LOFPR_Ligne.sLOFPR_PDDIV_ID;
  dxmdLOFPROnglet.FieldByName('PDDIV_CODE').asString            := rDATAS_LOFPR_Ligne.sPDDIV_CODE;
  dxmdLOFPROnglet.FieldByName('PDDIV_DES').asString             := rDATAS_LOFPR_Ligne.sPDDIV_DES;

  dxmdLOFPROnglet.FieldByName('LOFPR_ZOTRF_ID').asString        := rDATAS_LOFPR_Ligne.sLOFPR_ZOTRF_ID;
  dxmdLOFPROnglet.FieldByName('ZOTRF_DES').asString             := rDATAS_LOFPR_Ligne.sZOTRF_DES;
  dxmdLOFPROnglet.FieldByName('LOFPR_TRZTF_ID').asString        := rDATAS_LOFPR_Ligne.sLOFPR_TRZTF_ID;

  dxmdLOFPROnglet.FieldByName('LOFPR_FLG_SELECT').asInteger     := rDATAS_LOFPR_Ligne.iLOFPR_FLG_SELECT;


  if sType = 'Ajout' then
  begin
    dxmdLOFPROnglet.FieldByName('LOFPR_DATECRE').AsDateTime      := fCurrentDateTime;
    dxmdLOFPROnglet.FieldByName('LOFPR_SUP').AsInteger           := 0;
    dxmdLOFPROnglet.FieldByName('LOFPR_FLG_CHECK_PL').AsInteger   := 0;
  end;

end;

procedure pChargeRecordDATAS(owner : Tobject; var rDATAS_LOFPR_Ligne: TDATAS_LOFPR_Ligne);
begin

  if owner is TongLOFPR_VNFiche then
  begin

    rDATAS_LOFPR_Ligne.nLOFPR_NAT            := TongLOFPR_VNFiche(owner).nLOFPR_NAT;
    rDATAS_LOFPR_Ligne.sLOFPR_PRCDT_ID       := TongLOFPR_VNFiche(owner).edtLOFPR_PRCDT_ID.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_PRCDT_DES      := TongLOFPR_VNFiche(owner).edtLOFPR_PRCDT_DES.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_PRCDT_TYP      := '0';
    rDATAS_LOFPR_Ligne.sLOFPR_MODEL_ID       := TongLOFPR_VNFiche(owner).edtLOFPR_MODEL_ID.Text;
    rDATAS_LOFPR_Ligne.sMODEL_CODE           := TongLOFPR_VNFiche(owner).edtLOFPR_MODEL_CODE.Text;
    rDATAS_LOFPR_Ligne.sMODEL_DES            := TongLOFPR_VNFiche(owner).edtLOFPR_MODEL_DES.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_BAGEN_ID       := TongLOFPR_VNFiche(owner).edtLOFPR_BAGEN_ID.Text;
    rDATAS_LOFPR_Ligne.sBAGEN_DES            := TongLOFPR_VNFiche(owner).edtLOFPR_BAGEN_DES.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_TEINT_ID       := TongLOFPR_VNFiche(owner).edtLOFPR_TEINT_ID.Text;
    rDATAS_LOFPR_Ligne.sTEINT_DES            := TongLOFPR_VNFiche(owner).edtLOFPR_TEINT_DES.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_TYPEM_ID       := TongLOFPR_VNFiche(owner).edtLOFPR_TYPEM_ID.Text;
    rDATAS_LOFPR_Ligne.sTYPEM_CODE           := TongLOFPR_VNFiche(owner).edtLOFPR_TYPEM_CODE.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_TRANC_ID       := fGetSeqChxfgComboS(TongLOFPR_VNFiche(owner).cbxTRANC_DES);
    rDATAS_LOFPR_Ligne.sLOFPR_PRX_TARIF      := TongLOFPR_VNFiche(owner).edtLOFPR_PRX_TARIF.text;
    rDATAS_LOFPR_Ligne.sLOFPR_PRIX_UNITAIRE  := TongLOFPR_VNFiche(owner).edtLOFPR_PRIX_UNITAIRE.text;
    rDATAS_LOFPR_Ligne.sLOFPR_TX_MAJORATION  := TongLOFPR_VNFiche(owner).edtLOFPR_TX_MAJORATION.text;
    rDATAS_LOFPR_Ligne.sLOFPR_TX_REMISE      := TongLOFPR_VNFiche(owner).edtLOFPR_TX_REMISE.text;
    rDATAS_LOFPR_Ligne.sLOFPR_PRIX_NET       := TongLOFPR_VNFiche(owner).edtLOFPR_PRIX_NET.text;
    rDATAS_LOFPR_Ligne.smontant              := TongLOFPR_VNFiche(owner).edtLOFPR_MONTANT.text;
    rDATAS_LOFPR_Ligne.sLOFPR_QTE            := TongLOFPR_VNFiche(owner).edtLOFPR_QTE.text;
    rDATAS_LOFPR_Ligne.sLOFPR_PAL            := TongLOFPR_VNFiche(owner).edtLOFPR_PAL.text;
    rDATAS_LOFPR_Ligne.iLOFPR_FLG_REMISE_EDT := ifthen(TongLOFPR_VNFiche(owner).chkLOFPR_FLG_REMISE_EDT.Checked, 1, 0);
    rDATAS_LOFPR_Ligne.iLOFPR_TYPE_LIGNE     := CstLOFPR_TYPE_LIGNE_1_Catalogue;
    rDATAS_LOFPR_Ligne.sRemarques            := TongLOFPR_VNFiche(owner).mmLOFPR_COMMENTAIRE.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_DESIGNATION    := TongLOFPR_VNFiche(owner).edtLOFPR_DESIGNATION.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_DESIGNATION_EN := TongLOFPR_VNFiche(owner).edtLOFPR_DESIGNATION_EN.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_COMMENTAIRE    := TongLOFPR_VNFiche(owner).mmLOFPR_COMMENTAIRE.text;
    rDATAS_LOFPR_Ligne.sLOFPR_COMMENTAIRE_EN := TongLOFPR_VNFiche(owner).mmLOFPR_COMMENTAIRE_EN.text;
    rDATAS_LOFPR_Ligne.sLOFPR_CMNT_TARIF     := TongLOFPR_VNFiche(owner).mmLOFPR_CMNT_TARIF.text;

    rDATAS_LOFPR_Ligne.iLOFPR_FLG_SELECT     := -1;
  end;

  if owner is TongLOFPR_PARFiche then
  begin


    rDATAS_LOFPR_Ligne.nLOFPR_NAT            := TongLOFPR_PARFiche(owner).nLOFPR_NAT;

    rDATAS_LOFPR_Ligne.sLOFPR_CDECO_ID       := TongLOFPR_PARFiche(owner).edtCDECO_ID.Text;
    rDATAS_LOFPR_Ligne.sCDECO_NUM            := TongLOFPR_PARFiche(owner).edtCDECO_NUM.Text;
    rDATAS_LOFPR_Ligne.sCDECO_DES            := TongLOFPR_PARFiche(owner).edtCDECO_DES.Text;

    rDATAS_LOFPR_Ligne.sLOFPR_TRANC_ID       := '';
    rDATAS_LOFPR_Ligne.sLOFPR_PRX_TARIF      := TongLOFPR_PARFiche(owner).edtLOFPR_PRX_TARIF.text;
    rDATAS_LOFPR_Ligne.sLOFPR_PRIX_UNITAIRE  := TongLOFPR_PARFiche(owner).edtLOFPR_PRIX_UNITAIRE.text;
    rDATAS_LOFPR_Ligne.sLOFPR_TX_MAJORATION  := TongLOFPR_PARFiche(owner).edtLOFPR_TX_MAJORATION.text;
    rDATAS_LOFPR_Ligne.sLOFPR_TX_REMISE      := TongLOFPR_PARFiche(owner).edtLOFPR_TX_REMISE.text;
    rDATAS_LOFPR_Ligne.sLOFPR_PRIX_NET       := TongLOFPR_PARFiche(owner).edtLOFPR_PRIX_NET.text;
    rDATAS_LOFPR_Ligne.smontant              := TongLOFPR_PARFiche(owner).edtLOFPR_MONTANT.text;
    rDATAS_LOFPR_Ligne.sLOFPR_QTE            := TongLOFPR_PARFiche(owner).edtLOFPR_QTE.text;
    rDATAS_LOFPR_Ligne.sLOFPR_PAL            := TongLOFPR_PARFiche(owner).edtLOFPR_PAL.text;
    rDATAS_LOFPR_Ligne.iLOFPR_FLG_REMISE_EDT := ifthen(TongLOFPR_PARFiche(owner).chkLOFPR_FLG_REMISE_EDT.Checked, 1, 0);
    rDATAS_LOFPR_Ligne.iLOFPR_TYPE_LIGNE     := CstLOFPR_TYPE_LIGNE_1_Catalogue;
    rDATAS_LOFPR_Ligne.sRemarques            := TongLOFPR_PARFiche(owner).mmLOFPR_COMMENTAIRE.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_DESIGNATION    := TongLOFPR_PARFiche(owner).edtLOFPR_DESIGNATION.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_DESIGNATION_EN := TongLOFPR_PARFiche(owner).edtLOFPR_DESIGNATION_EN.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_COMMENTAIRE    := TongLOFPR_PARFiche(owner).mmLOFPR_COMMENTAIRE.text;
    rDATAS_LOFPR_Ligne.sLOFPR_COMMENTAIRE_EN := TongLOFPR_PARFiche(owner).mmLOFPR_COMMENTAIRE_EN.text;
    rDATAS_LOFPR_Ligne.sLOFPR_CMNT_TARIF     := TongLOFPR_PARFiche(owner).mmLOFPR_CMNT_TARIF.text;

    if TongLOFPR_PARFiche(owner).chkCDECO.Checked then
      rDATAS_LOFPR_Ligne.iLOFPR_FLG_SELECT     := Cst_0_LOFPR_FLG_SELECT_Cotation;

    if TongLOFPR_PARFiche(owner).chkSTDPL.Checked then
      rDATAS_LOFPR_Ligne.iLOFPR_FLG_SELECT     := Cst_1_LOFPR_FLG_SELECT_Standard_price_list;
  end;

  if owner is TongLOFPR_DIVERSFiche then
  begin

    rDATAS_LOFPR_Ligne.nLOFPR_NAT      := TongLOFPR_DIVERSFiche(owner).nLOFPR_NAT;
    rDATAS_LOFPR_Ligne.sLOFPR_PDDIV_ID := TongLOFPR_DIVERSFiche(owner).edtPDDIV_ID.Text;
    rDATAS_LOFPR_Ligne.sPDDIV_CODE     := TongLOFPR_DIVERSFiche(owner).edtPDDIV_CODE.Text;
    rDATAS_LOFPR_Ligne.sPDDIV_DES      := TongLOFPR_DIVERSFiche(owner).edtPDDIV_DES.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_ZOTRF_ID := TongLOFPR_DIVERSFiche(owner).edtZOTRF_ID.Text;
    rDATAS_LOFPR_Ligne.sZOTRF_DES      := TongLOFPR_DIVERSFiche(owner).edtZOTRF_DES.Text;
    if TongLOFPR_DIVERSFiche(owner).edtLOFPR_DESIGNATION_DIVERS.Text <> EmptyStr then
      TongLOFPR_DIVERSFiche(owner).edtLOFPR_DESIGNATION.Text := TongLOFPR_DIVERSFiche(owner).edtLOFPR_DESIGNATION_DIVERS.Text;
    if fGetSeqChxfgCombo(TongLOFPR_DIVERSFiche(owner).cbxZOTRF_INFOS) = -1 then
      rDATAS_LOFPR_Ligne.sLOFPR_TRZTF_ID := ''
    else
      rDATAS_LOFPR_Ligne.sLOFPR_TRZTF_ID := IntToStr(fGetSeqChxfgCombo(TongLOFPR_DIVERSFiche(owner).cbxZOTRF_INFOS));

    rDATAS_LOFPR_Ligne.sLOFPR_PRCDT_ID       := '';
    rDATAS_LOFPR_Ligne.sLOFPR_PRCDT_TYP      := '0';
    rDATAS_LOFPR_Ligne.sLOFPR_MODEL_ID       := '';
    rDATAS_LOFPR_Ligne.sMODEL_CODE           := '';
    rDATAS_LOFPR_Ligne.sMODEL_DES            := '';
    rDATAS_LOFPR_Ligne.sLOFPR_BAGEN_ID       := '';
    rDATAS_LOFPR_Ligne.sBAGEN_DES            := '';
    rDATAS_LOFPR_Ligne.sLOFPR_TEINT_ID       := '';
    rDATAS_LOFPR_Ligne.sTEINT_DES            := '';
    rDATAS_LOFPR_Ligne.sLOFPR_TYPEM_ID       := '';
    rDATAS_LOFPR_Ligne.sTYPEM_CODE           := '';
    rDATAS_LOFPR_Ligne.sLOFPR_TRANC_ID       := '';
    rDATAS_LOFPR_Ligne.sLOFPR_PRX_TARIF      := '';
    rDATAS_LOFPR_Ligne.sLOFPR_PRIX_UNITAIRE  := '';
    rDATAS_LOFPR_Ligne.sLOFPR_TX_MAJORATION  := '';
    rDATAS_LOFPR_Ligne.sLOFPR_TX_REMISE      := '';
    rDATAS_LOFPR_Ligne.sLOFPR_PRIX_NET       := TongLOFPR_DIVERSFiche(owner).edtLOFPR_PRIX_NET.text;
    rDATAS_LOFPR_Ligne.smontant              := TongLOFPR_DIVERSFiche(owner).edtLOFPR_MONTANT.text;
    rDATAS_LOFPR_Ligne.sLOFPR_QTE            := TongLOFPR_DIVERSFiche(owner).edtLOFPR_QTE.text;
    rDATAS_LOFPR_Ligne.sLOFPR_PAL            := '';
    rDATAS_LOFPR_Ligne.iLOFPR_FLG_REMISE_EDT := ifthen(TongLOFPR_DIVERSFiche(owner).chkLOFPR_FLG_REMISE_EDT.Checked, 1, 0);
    rDATAS_LOFPR_Ligne.iLOFPR_TYPE_LIGNE     := CstLOFPR_TYPE_LIGNE_1_Catalogue;
    rDATAS_LOFPR_Ligne.sRemarques            := TongLOFPR_DIVERSFiche(owner).mmLOFPR_COMMENTAIRE.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_DESIGNATION    := TongLOFPR_DIVERSFiche(owner).edtLOFPR_DESIGNATION.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_DESIGNATION_EN := TongLOFPR_DIVERSFiche(owner).edtLOFPR_DESIGNATION_EN.Text;
    rDATAS_LOFPR_Ligne.sLOFPR_COMMENTAIRE    := TongLOFPR_DIVERSFiche(owner).mmLOFPR_COMMENTAIRE.text;
    rDATAS_LOFPR_Ligne.sLOFPR_COMMENTAIRE_EN := TongLOFPR_DIVERSFiche(owner).mmLOFPR_COMMENTAIRE_EN.text;
    rDATAS_LOFPR_Ligne.sLOFPR_CMNT_TARIF     := TongLOFPR_DIVERSFiche(owner).mmLOFPR_CMNT_TARIF.text;

    if TongLOFPR_DIVERSFiche(owner).chkPDDIV.Checked then
      rDATAS_LOFPR_Ligne.iLOFPR_FLG_SELECT     := Cst_2_LOFPR_FLG_SELECT_Produit_divers;

    if TongLOFPR_DIVERSFiche(owner).chkZOTRF.Checked then
      rDATAS_LOFPR_Ligne.iLOFPR_FLG_SELECT     := Cst_3_LOFPR_FLG_SELECT_Tarif_zone_de_transport;

    if TongLOFPR_DIVERSFiche(owner).chkLOFPR_DESIGNATION_DIVERS.Checked then
      rDATAS_LOFPR_Ligne.iLOFPR_FLG_SELECT     := Cst_4_LOFPR_FLG_SELECT_Designations;
  end;

end;

procedure pAjouterLigne(owner : Tobject; dxmdLOFPROnglet : TdxMemData; var rDATAS_LOFPR_Ligne: TDATAS_LOFPR_Ligne; nLOFPR_NAT : Integer);
var
  numLigne : Integer;
  Bookmark : TBookmark;
begin

  if not ((owner is TongLOFPR_VNFiche) or (owner is TongLOFPR_PARFiche) or (owner is TongLOFPR_DIVERSFiche)) then
    exit;

  pChargeRecordDATAS(owner, rDATAS_LOFPR_Ligne);

  if owner is TongLOFPR_VNFiche then
  begin
    if (TongLOFPR_VNFiche(owner).edtLOFPR_PRCDT_ID.Text <> '') AND  (TongLOFPR_VNFiche(owner).sOFFPR_TARIF_ID <> '') then
      psetInfoPRCTF(TongLOFPR_VNFiche(owner).edtLOFPR_PRCDT_ID.Text,  TongLOFPR_VNFiche(owner).sOFFPR_TARIF_ID, rDATAS_LOFPR_Ligne);
  end;

  Bookmark   := dxmdLOFPROnglet.GetBookmark;
  try
    dxmdLOFPROnglet.DisableControls;
    try

      numLigne := dxmdLOFPROnglet.RecordCount + 1;
      dxmdLOFPROnglet.Insert;

      Try
        pDataToDataset(dxmdLOFPROnglet,  rDATAS_LOFPR_Ligne, 'Ajout');

        dxmdLOFPROnglet.Post;
      except
        dxmdLOFPROnglet.Cancel;
        raise;
      end;
    finally
      dxmdLOFPROnglet.GotoBookmark(Bookmark);
      dxmdLOFPROnglet.EnableControls;
    end;
  finally
    dxmdLOFPROnglet.FreeBookmark(Bookmark);
  end;



end;

procedure pModifLigne(owner : Tobject; dxmdLOFPROnglet : TdxMemData; var rDATAS_LOFPR_Ligne: TDATAS_LOFPR_Ligne; iLOFPR_ID: Integer; nLOFPR_NAT : Integer);
var
  Bookmark : TBookmark;
begin

  if not ((owner is TongLOFPR_VNFiche) or (owner is TongLOFPR_PARFiche) or (owner is TongLOFPR_DIVERSFiche)) then
    exit;

  pChargeRecordDATAS(owner, rDATAS_LOFPR_Ligne);


  if owner is TongLOFPR_VNFiche then
  begin
    if (TongLOFPR_VNFiche(owner).edtLOFPR_PRCDT_ID.Text <> '') AND  (TongLOFPR_VNFiche(owner).sOFFPR_TARIF_ID <> '') then
      psetInfoPRCTF(TongLOFPR_VNFiche(owner).edtLOFPR_PRCDT_ID.Text,  TongLOFPR_VNFiche(owner).sOFFPR_TARIF_ID, rDATAS_LOFPR_Ligne);
  end;

  Bookmark := dxmdLOFPROnglet.GetBookmark;
  try
    dxmdLOFPROnglet.DisableControls;
    try
      dxmdLOFPROnglet.Edit;

      pDataToDataset( dxmdLOFPROnglet,  rDATAS_LOFPR_Ligne);

      dxmdLOFPROnglet.Post;
    except
      dxmdLOFPROnglet.Cancel;
      raise;
    end;

    dxmdLOFPROnglet.GotoBookmark(Bookmark);
  finally
    dxmdLOFPROnglet.EnableControls;
    dxmdLOFPROnglet.FreeBookmark(Bookmark);
  end;

end;

procedure psetInfoPRCTF(sPRCDT_ID: string; sTARIF_ID: string;var rDATAS_LOFPR_Ligne: TDATAS_LOFPR_Ligne);
var
  oQuery : TuniQuery;
begin

  oQuery  := TUniQuery.Create(nil);
  try
    if fQueryRQSQL(oQuery, 45688) then
    begin
      fQueryDeclareParameterType(oQuery, 'iTARIF_ID', ftInteger, sTARIF_ID);
      fQueryDeclareParameterType(oQuery, 'iPRCDT_ID', ftInteger, sPRCDT_ID);
      fQueryOpen(oQuery, True);
      if oQuery.RecordCount > 0 then
      begin
        oQuery.First;
        rDATAS_LOFPR_Ligne.sLOFPR_PRCDT_ID  := fGetValueS(oQuery, 'PRCDT_ID');
        rDATAS_LOFPR_Ligne.sLOFPR_PRCDT_DES := fGetValueS(oQuery, 'PRCDT_DES');
        rDATAS_LOFPR_Ligne.iqte_pal         := fGetValueI(oQuery, 'PRCDT_NB_COLS_PAL');
        rDATAS_LOFPR_Ligne.sLOFPR_BAGEN_ID  := fGetValueS(oQuery, 'BAGEN_ID');
        rDATAS_LOFPR_Ligne.sBAGEN_DES       := fGetValueS(oQuery, 'BAGEN_DES');
        rDATAS_LOFPR_Ligne.sLOFPR_TEINT_ID  := fGetValueS(oQuery, 'TEINT_ID');
        rDATAS_LOFPR_Ligne.sTEINT_DES       := fGetValueS(oQuery, 'TEINT_DES');
        rDATAS_LOFPR_Ligne.sLOFPR_MODEL_ID  := fGetValueS(oQuery, 'MODEL_ID');
        rDATAS_LOFPR_Ligne.sMODEL_CODE      := fGetValueS(oQuery, 'MODEL_CODE');
        rDATAS_LOFPR_Ligne.sMODEL_DES       := fGetValueS(oQuery, 'MODEL_DES');
        rDATAS_LOFPR_Ligne.sPRCDT_DISPO_DES := fGetValueS(oQuery, 'CHXFG_PRCDT_DISPO_DES');
        rDATAS_LOFPR_Ligne.sTYPAL_SHORT_DES := fGetValueS(oQuery, 'TYPAL_SHORT_DES');
        rDATAS_LOFPR_Ligne.sLOFPR_TYPEM_ID  := fGetValueS(oQuery, 'TYPEM_ID');
        rDATAS_LOFPR_Ligne.sLOFPR_DISPO     := fGetValueS(oQuery, 'PRCDT_DISPO');
        rDATAS_LOFPR_Ligne.sLOFPR_DICAT_ID  := fGetValueS(oQuery, 'PRCTF_DICAT_ID');
        rDATAS_LOFPR_Ligne.sLOFPR_FAMIL_ID  := fGetValueS(oQuery, 'FAMIL_ID');

      end;
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;

procedure pChargeDATAS(owner : TObject; dxmdLOFPROnglet : TdxMemData; nLOFPR_NUM: Integer);
var
  sTRZTF_ID : String;

  procedure pReserChamps;
  begin
    if owner is TongLOFPR_DIVERSFiche then
    begin
      With TongLOFPR_DIVERSFiche(owner) do
      begin  
        edtPDDIV_ID.Text   := '';
        edtPDDIV_DES.Text  := '';
        edtPDDIV_CODE.Text := '';
        edtZOTRF_ID.Text   := '';
        edtZOTRF_DES.Text  := '';
        edtLOFPR_DESIGNATION_DIVERS.Text  := '';
        chkPDDIV.Checked := False;
        chkZOTRF.Checked := False;
        chkLOFPR_DESIGNATION_DIVERS.Checked := False;
      end;
    end;

    if owner is TongLOFPR_PARFiche then
    begin
      With TongLOFPR_PARFiche(owner) do
      begin  
        edtCDECO_ID.Text := '';
        edtCDECO_DES.Text := '';

        chkSTDPL.Checked := False;
        chkCDECO.Checked := False;
      end;
    end;

  end;

  function FormatNumber(Value: Double; Decimal: Integer):
      string;
  var
    I: Integer;
    sDeci : String;
  begin
    sDeci := '';
    for I := 1 to Decimal do
    begin
      sDeci := sDeci + '#'
    end;
    Result := FormatFloat('#,##0.'+sDeci, Value); // 3 dÃ©cimales
  end;
begin

  if not ((owner is TongLOFPR_VNFiche) or (owner is TongLOFPR_PARFiche) or (owner is TongLOFPR_DIVERSFiche)) then
    exit;

  dxmdLOFPROnglet.RecNo := nLOFPR_NUM;


  pReserChamps;

  if owner is TongLOFPR_VNFiche then
  begin

    TongLOFPR_VNFiche(owner).edtLOFPR_TX_REMISE.Text      := dxmdLOFPROnglet.FieldByName('LOFPR_TX_REMISE').AsString;
    pThouthandSeparator(TongLOFPR_VNFiche(owner).edtLOFPR_TX_REMISE);
    TongLOFPR_VNFiche(owner).edtLOFPR_PRIX_UNITAIRE.Text  := FormatNumber(dxmdLOFPROnglet.FieldByName('LOFPR_PRIX_UNITAIRE').AsFloat,2);
    pThouthandSeparator(TongLOFPR_VNFiche(owner).edtLOFPR_PRIX_UNITAIRE);
    TongLOFPR_VNFiche(owner).edtLOFPR_PRIX_NET.Text       := FormatNumber(dxmdLOFPROnglet.FieldByName('LOFPR_PRIX_NET').AsFloat,2);
    pThouthandSeparator(TongLOFPR_VNFiche(owner).edtLOFPR_PRIX_NET);
    TongLOFPR_VNFiche(owner).edtLOFPR_MONTANT.Text        := FormatNumber(dxmdLOFPROnglet.FieldByName('montant').AsFloat,2);
    pThouthandSeparator(TongLOFPR_VNFiche(owner).edtLOFPR_MONTANT);
    TongLOFPR_VNFiche(owner).edtLOFPR_QTE.Text            := FormatNumber(dxmdLOFPROnglet.FieldByName('LOFPR_QTE').AsFloat,0);
    pThouthandSeparator(TongLOFPR_VNFiche(owner).edtLOFPR_QTE);
    TongLOFPR_VNFiche(owner).edtLOFPR_TX_MAJORATION.Text  := dxmdLOFPROnglet.FieldByName('LOFPR_TX_MAJORATION').AsString;
    pThouthandSeparator(TongLOFPR_VNFiche(owner).edtLOFPR_TX_MAJORATION);
    TongLOFPR_VNFiche(owner).chkLOFPR_FLG_REMISE_EDT.Checked := dxmdLOFPROnglet.FieldByName('LOFPR_FLG_REMISE_EDT').AsInteger = 1;
    TongLOFPR_VNFiche(owner).edtLOFPR_PRX_TARIF.Text      := FormatNumber(dxmdLOFPROnglet.FieldByName('LOFPR_PRX_TARIF').AsFloat,2);
    pThouthandSeparator(TongLOFPR_VNFiche(owner).edtLOFPR_PRX_TARIF);
      //    fSetSeqChxfgCombo(cbxTRANC_DES, dxmdLOFPROnglet.FieldByName('TRANC_DES').AsString);
    TongLOFPR_VNFiche(owner).edtLOFPR_PAL.Text            := FormatNumber(dxmdLOFPROnglet.FieldByName('qte_pal').AsFloat, 0);
    pThouthandSeparator(TongLOFPR_VNFiche(owner).edtLOFPR_PAL);

    TongLOFPR_VNFiche(owner).mmLOFPR_COMMENTAIRE_EN.Text  := dxmdLOFPROnglet.FieldByName('LOFPR_COMMENTAIRE_EN').AsString;
    TongLOFPR_VNFiche(owner).mmLOFPR_COMMENTAIRE.Text     := dxmdLOFPROnglet.FieldByName('LOFPR_COMMENTAIRE').AsString;
    TongLOFPR_VNFiche(owner).mmLOFPR_CMNT_TARIF.Text      := dxmdLOFPROnglet.FieldByName('LOFPR_CMNT_TARIF').AsString;

    TongLOFPR_VNFiche(owner).edtLOFPR_DESIGNATION.Text    := dxmdLOFPROnglet.FieldByName('LOFPR_DESIGNATION').AsString;
    TongLOFPR_VNFiche(owner).edtLOFPR_DESIGNATION_EN.Text := dxmdLOFPROnglet.FieldByName('LOFPR_DESIGNATION_EN').AsString;
    TongLOFPR_VNFiche(owner).edtLOFPR_PRCDT_DES.Text      := dxmdLOFPROnglet.FieldByName('LOFPR_PRCDT_DES').AsString;
    TongLOFPR_VNFiche(owner).edtLOFPR_PRCDT_ID.Text       := dxmdLOFPROnglet.FieldByName('LOFPR_PRCDT_ID').AsString;
    TongLOFPR_VNFiche(owner).edtLOFPR_BAGEN_DES.Text      := dxmdLOFPROnglet.FieldByName('des_bague').AsString;
    TongLOFPR_VNFiche(owner).edtLOFPR_BAGEN_ID.Text       := dxmdLOFPROnglet.FieldByName('LOFPR_BAGEN_ID').AsString;
    TongLOFPR_VNFiche(owner).edtLOFPR_MODEL_CODE.Text     := dxmdLOFPROnglet.FieldByName('CODE_MODEL').AsString;
    TongLOFPR_VNFiche(owner).edtLOFPR_MODEL_DES.Text      := '';
    TongLOFPR_VNFiche(owner).edtLOFPR_MODEL_ID.Text       := dxmdLOFPROnglet.FieldByName('LOFPR_MODEL_ID').AsString;
    TongLOFPR_VNFiche(owner).edtLOFPR_TEINT_DES.Text      := dxmdLOFPROnglet.FieldByName('des_teinte').AsString;
    TongLOFPR_VNFiche(owner).edtLOFPR_TEINT_ID.Text       := dxmdLOFPROnglet.FieldByName('LOFPR_TEINT_ID').AsString;
    TongLOFPR_VNFiche(owner).edtLOFPR_TYPEM_CODE.Text     := dxmdLOFPROnglet.FieldByName('emb').AsString;
    TongLOFPR_VNFiche(owner).edtLOFPR_TYPEM_ID.Text       := dxmdLOFPROnglet.FieldByName('LOFPR_TYPEM_ID').AsString;
    if (TongLOFPR_VNFiche(owner).sOFFPR_TARIF_ID <> '') AND  (TongLOFPR_VNFiche(owner).edtLOFPR_PRCDT_ID.Text <> '') then
      fInitComboBox(TongLOFPR_VNFiche(owner).cbxTRANC_DES     , 46232,  [TongLOFPR_VNFiche(owner).sOFFPR_TARIF_ID, TongLOFPR_VNFiche(owner).edtLOFPR_PRCDT_ID.Text], '', dxmdLOFPROnglet.FieldByName('LOFPR_TRANC_ID').AsString, True, False)
    else
      fInitComboBox(TongLOFPR_VNFiche(owner).cbxTRANC_DES     , 46232,  ['-1','-1'], '', '', True, False);
  
  end;

  if owner is TongLOFPR_PARFiche then
  begin

    TongLOFPR_PARFiche(owner).edtLOFPR_TX_REMISE.Text      := dxmdLOFPROnglet.FieldByName('LOFPR_TX_REMISE').AsString;
    pThouthandSeparator(TongLOFPR_PARFiche(owner).edtLOFPR_TX_REMISE);
    TongLOFPR_PARFiche(owner).edtLOFPR_PRIX_UNITAIRE.Text  := dxmdLOFPROnglet.FieldByName('LOFPR_PRIX_UNITAIRE').AsString;
    pThouthandSeparator(TongLOFPR_PARFiche(owner).edtLOFPR_PRIX_UNITAIRE);
    TongLOFPR_PARFiche(owner).edtLOFPR_PRIX_NET.Text       := dxmdLOFPROnglet.FieldByName('LOFPR_PRIX_NET').AsString;
    pThouthandSeparator(TongLOFPR_PARFiche(owner).edtLOFPR_PRIX_NET);
    TongLOFPR_PARFiche(owner).edtLOFPR_MONTANT.Text        := dxmdLOFPROnglet.FieldByName('montant').AsString;
    pThouthandSeparator(TongLOFPR_PARFiche(owner).edtLOFPR_MONTANT);
    TongLOFPR_PARFiche(owner).edtLOFPR_QTE.Text            := dxmdLOFPROnglet.FieldByName('LOFPR_QTE').AsString;
    pThouthandSeparator(TongLOFPR_PARFiche(owner).edtLOFPR_QTE);
    TongLOFPR_PARFiche(owner).edtLOFPR_TX_MAJORATION.Text  := dxmdLOFPROnglet.FieldByName('LOFPR_TX_MAJORATION').AsString;
    pThouthandSeparator(TongLOFPR_PARFiche(owner).edtLOFPR_TX_MAJORATION);
    TongLOFPR_PARFiche(owner).chkLOFPR_FLG_REMISE_EDT.Checked := dxmdLOFPROnglet.FieldByName('LOFPR_FLG_REMISE_EDT').AsInteger = 1;
    TongLOFPR_PARFiche(owner).edtLOFPR_PRX_TARIF.Text      := dxmdLOFPROnglet.FieldByName('LOFPR_PRX_TARIF').AsString;
    pThouthandSeparator(TongLOFPR_PARFiche(owner).edtLOFPR_PRX_TARIF);

    TongLOFPR_PARFiche(owner).mmLOFPR_COMMENTAIRE_EN.Text  := dxmdLOFPROnglet.FieldByName('LOFPR_COMMENTAIRE_EN').AsString;
    TongLOFPR_PARFiche(owner).mmLOFPR_COMMENTAIRE.Text     := dxmdLOFPROnglet.FieldByName('LOFPR_COMMENTAIRE').AsString;
    TongLOFPR_PARFiche(owner).mmLOFPR_CMNT_TARIF.Text      := dxmdLOFPROnglet.FieldByName('LOFPR_CMNT_TARIF').AsString;


    if dxmdLOFPROnglet.FieldByName('LOFPR_CDECO_ID').AsString <> EmptyStr then
    begin
      TongLOFPR_PARFiche(owner).pnlSTDPL.Visible := False;
      TongLOFPR_PARFiche(owner).pnlCDECO.Visible := True;
      TongLOFPR_PARFiche(owner).chkCDECO.Checked             := True;
      TongLOFPR_PARFiche(owner).edtCDECO_NUM.Text            := dxmdLOFPROnglet.FieldByName('CDECO_NUM').AsString;
      TongLOFPR_PARFiche(owner).edtCDECO_DES.Text            := dxmdLOFPROnglet.FieldByName('CDECO_DES').AsString;
      TongLOFPR_PARFiche(owner).edtCDECO_ID.Text             := dxmdLOFPROnglet.FieldByName('LOFPR_CDECO_ID').AsString;

      if TongLOFPR_PARFiche(owner).edtCDECO_NUM.Text <> '' then
        TongLOFPR_PARFiche(owner).gDernierTypePara                := 'CDECOClick';


      pChargeDatasCDECO(owner);

      TongLOFPR_PARFiche(owner).chkCDECO.Checked := True;
    end else if (TongLOFPR_PARFiche(owner).dxmdSTDPL.RecordCount > 0) and (TongLOFPR_PARFiche(owner).dxmdSTDPL.FieldByName('STDPL_ID').AsString <> '') then
    begin

      TongLOFPR_PARFiche(owner).pnlSTDPL.Visible := True;
      TongLOFPR_PARFiche(owner).pnlCDECO.Visible := False;
      TongLOFPR_PARFiche(owner).gDernierTypePara := 'STDPLClick';
      TongLOFPR_PARFiche(owner).chkSTDPL.Checked := True;

      TongLOFPR_PARFiche(owner).pAffichePrixTotalSTDPL;

    end
    else
    begin
      TongLOFPR_PARFiche(owner).pnlSTDPL.Visible := False;
      TongLOFPR_PARFiche(owner).pnlCDECO.Visible := False;
      TongLOFPR_PARFiche(owner).gDernierTypePara := '';
    end;

    TongLOFPR_PARFiche(owner).edtLOFPR_DESIGNATION.Text    := dxmdLOFPROnglet.FieldByName('LOFPR_DESIGNATION').AsString;
    TongLOFPR_PARFiche(owner).edtLOFPR_DESIGNATION_EN.Text := dxmdLOFPROnglet.FieldByName('LOFPR_DESIGNATION_EN').AsString;

  end;

  if owner is TongLOFPR_DIVERSFiche then
  begin

    TongLOFPR_DIVERSFiche(owner).mmLOFPR_COMMENTAIRE_EN.Text        := dxmdLOFPROnglet.FieldByName('LOFPR_COMMENTAIRE_EN').AsString;
    TongLOFPR_DIVERSFiche(owner).pnlLOFPR_COMMENTAIRE_EN.Visible    := TongLOFPR_DIVERSFiche(owner).iLANGU_ID = Cst_Langue_UK;
    TongLOFPR_DIVERSFiche(owner).mmLOFPR_COMMENTAIRE.Text           := dxmdLOFPROnglet.FieldByName('LOFPR_COMMENTAIRE').AsString;
    TongLOFPR_DIVERSFiche(owner).mmLOFPR_CMNT_TARIF.Text      := dxmdLOFPROnglet.FieldByName('LOFPR_CMNT_TARIF').AsString;
    TongLOFPR_DIVERSFiche(owner).edtLOFPR_PRIX_NET.Text       := dxmdLOFPROnglet.FieldByName('LOFPR_PRIX_NET').AsString;
    pThouthandSeparator(TongLOFPR_DIVERSFiche(owner).edtLOFPR_PRIX_NET);
    TongLOFPR_DIVERSFiche(owner).edtLOFPR_MONTANT.Text              := dxmdLOFPROnglet.FieldByName('montant').AsString;
    pThouthandSeparator(TongLOFPR_DIVERSFiche(owner).edtLOFPR_MONTANT);
    TongLOFPR_DIVERSFiche(owner).edtLOFPR_QTE.Text                  := dxmdLOFPROnglet.FieldByName('LOFPR_QTE').AsString;
    pThouthandSeparator(TongLOFPR_DIVERSFiche(owner).edtLOFPR_QTE);
    TongLOFPR_DIVERSFiche(owner).chkLOFPR_FLG_REMISE_EDT.Checked    := dxmdLOFPROnglet.FieldByName('LOFPR_FLG_REMISE_EDT').AsInteger = 1;


    if dxmdLOFPROnglet.FieldByName('LOFPR_PDDIV_ID').AsString <> '' then
    begin
      TongLOFPR_DIVERSFiche(owner).chkPDDIV.Enabled        := False;
      TongLOFPR_DIVERSFiche(owner).edtPDDIV_CODE.Text      := dxmdLOFPROnglet.FieldByName('PDDIV_CODE').AsString;
      TongLOFPR_DIVERSFiche(owner).edtPDDIV_DES.Text       := dxmdLOFPROnglet.FieldByName('PDDIV_DES').AsString;
      TongLOFPR_DIVERSFiche(owner).edtPDDIV_ID.Text        := dxmdLOFPROnglet.FieldByName('LOFPR_PDDIV_ID').AsString;
      if TongLOFPR_DIVERSFiche(owner).edtPDDIV_DES.Text <> '' then
        TongLOFPR_DIVERSFiche(owner).gDernierTypeDivers     := 'PDDIVClick';

      TongLOFPR_DIVERSFiche(owner).chkPDDIV.Checked := True;  
    end else if dxmdLOFPROnglet.FieldByName('LOFPR_ZOTRF_ID').AsString <> '' then
    begin
      TongLOFPR_DIVERSFiche(owner).chkZOTRF.Enabled                 := False;
      TongLOFPR_DIVERSFiche(owner).edtZOTRF_DES.Text                := dxmdLOFPROnglet.FieldByName('ZOTRF_DES').AsString;
      TongLOFPR_DIVERSFiche(owner).edtZOTRF_ID.Text                 := dxmdLOFPROnglet.FieldByName('LOFPR_ZOTRF_ID').AsString;
      if TongLOFPR_DIVERSFiche(owner).edtZOTRF_ID.Text <> '' then
        fInitComboBox(TongLOFPR_DIVERSFiche(owner).cbxZOTRF_INFOS     , 46242,  [TongLOFPR_DIVERSFiche(owner).edtZOTRF_ID.Text], '', '', True, False)
      else
        fInitComboBox(TongLOFPR_DIVERSFiche(owner).cbxZOTRF_INFOS     , 46242,  ['-1'], '', '', True, False);
      sTRZTF_ID                                                     := dxmdLOFPROnglet.FieldByName('LOFPR_TRZTF_ID').AsString;
      fSetSeqChxfgCombo(TongLOFPR_DIVERSFiche(owner).cbxZOTRF_INFOS, sTRZTF_ID);
      if TongLOFPR_DIVERSFiche(owner).edtZOTRF_DES.Text <> '' then
        TongLOFPR_DIVERSFiche(owner).gDernierTypeDivers       := 'ZOTRFClick';

      TongLOFPR_DIVERSFiche(owner).chkZOTRF.Checked := True;  
    end else if dxmdLOFPROnglet.FieldByName('LOFPR_DESIGNATION').AsString <> '' then
    begin
      TongLOFPR_DIVERSFiche(owner).chkLOFPR_DESIGNATION_DIVERS.Enabled                     := False;
      TongLOFPR_DIVERSFiche(owner).edtLOFPR_DESIGNATION_DIVERS.Text := dxmdLOFPROnglet.FieldByName('LOFPR_DESIGNATION').AsString;
      if (TongLOFPR_DIVERSFiche(owner).edtZOTRF_DES.Text = '') and (TongLOFPR_DIVERSFiche(owner).edtPDDIV_DES.Text = '') and (TongLOFPR_DIVERSFiche(owner).edtLOFPR_DESIGNATION_DIVERS.Text <> '') then
        TongLOFPR_DIVERSFiche(owner).gDernierTypeDivers   := 'LOFPR_DESIGNATION_DIVERSClick';

      TongLOFPR_DIVERSFiche(owner).chkLOFPR_DESIGNATION_DIVERS.Checked := True;  
    end;

    TongLOFPR_DIVERSFiche(owner).edtLOFPR_DESIGNATION.Text          := dxmdLOFPROnglet.FieldByName('LOFPR_DESIGNATION').AsString;
    TongLOFPR_DIVERSFiche(owner).edtLOFPR_DESIGNATION_EN.Text       := dxmdLOFPROnglet.FieldByName('LOFPR_DESIGNATION_EN').AsString;
    TongLOFPR_DIVERSFiche(owner).pnlLOFPR_DESIGNATION_EN.Visible    := TongLOFPR_DIVERSFiche(owner).iLANGU_ID = Cst_Langue_UK;

  end;  
end;

procedure pChargeDatasCDECO(owner : TObject);
var
  rDATAS_CDECO : TDATAS_CDECO;
begin

  if not ((owner is TongLOFPR_VNFiche) or (owner is TongLOFPR_PARFiche) or (owner is TongLOFPR_DIVERSFiche)) then
    exit;
    
  if owner is TongLOFPR_PARFiche  then
  begin

    With TongLOFPR_PARFiche(owner) do
    begin

      if (edtCDECO_ID.text <> EmptyStr) and (edtLOFPR_QTE.Text <> EmptyStr) then
      begin

        rDATAS_CDECO := Offre_Unit.fChargeCDECO_Tranche_tarifaire(edtCDECO_ID.Text, edtLOFPR_QTE.Text);

        edtTRANC_DES.Text            := rDATAS_CDECO.QTGAM_QTE;
        if rEtatLOFPROnglet.EtatLOFPR_DECOR = etFMaj then
        begin
          edtLOFPR_PRX_TARIF.Text      := rDATAS_CDECO.QTGAM_PV_REF;
          edtLOFPR_PRIX_UNITAIRE.Text  := rDATAS_CDECO.QTGAM_PV_REF;
          edtLOFPR_PRIX_NET.Text       := rDATAS_CDECO.QTGAM_PV_REF;
          edtLOFPR_MONTANT.Text        := rDATAS_CDECO.QTGAM_PV_REF;

        end;


      end;

    end;
    
  end;

end;

function fChargeCDECO_Tranche_tarifaire(sCDECO_ID, sQTE: string): TDATAS_CDECO;
var
  oQuery : TUniQuery;
  iQTGAM_PV_REF : Double;
begin

  iQTGAM_PV_REF := 0;

  Result.QTGAM_ID     := '';
  Result.PCOTD_SEQ    := '';
  Result.QTGAM_QTE    := '0';
  Result.QTGAM_PV_REF := '0';

  oQuery := TUniQuery.Create(nil);
  try
    if fQueryRQSQL(oQuery, 46431) then
    begin
      fQueryDeclareParameterType(oQuery, 'iCDECO_ID', ftString, sCDECO_ID);
      fQueryDeclareParameterType(oQuery, 'iQTE', ftInteger, StrToIntDef(fDeleteSeparator(sQTE),0));
      fQueryOpen(oQuery);
    end;
    
    if not oQuery.IsEmpty then
    begin
      while not oQuery.Eof do
      begin

        Result.QTGAM_ID     := fGetValueS(oQuery, 'QTGAM_ID');
        Result.PCOTD_SEQ    := fGetValueS(oQuery, 'PCOTD_SEQ');
        Result.QTGAM_QTE    := fGetValueS(oQuery, 'QTGAM_QTE');
        Result.QTGAM_PV_REF := fGetValueS(oQuery, 'QTGAM_PV_REF');

        iQTGAM_PV_REF := iQTGAM_PV_REF + StrToFloatDef(Result.QTGAM_PV_REF, 0);
        oQuery.Next;
      end;
      Result.QTGAM_PV_REF := FloatToStr(iQTGAM_PV_REF);
    end;
  finally
    freeandnil(oQuery);
  end;
  
end;

function fINSERT_LOFPR_STDPL(iSTDPL_ID : Integer; iLOFPR_ID : Integer): Integer;
var
  oQuery : TUniQuery;
  nNew_ID_ligne, iLOFPR_NUM : Integer;
  fSTDPL_PRIX : Extended;
  sDESI : String;
  

begin

  Result := 0;

  oQuery := TUniQuery.Create(nil);
  try

    if iLOFPR_ID > 0 then
    begin

      if fQueryRQSQL(oQuery, 46608) then
      begin
        fQueryDeclareParameterType(oQuery, 'iSTDPL_ID',       ftstring,  iSTDPL_ID);
        fQueryDeclareParameterType(oQuery, 'iLOFPR_ID',       ftInteger, iLOFPR_ID);
        fQueryDeclareParameterType(oQuery, 'sCOLMOD',         ftstring,  fgetUser());
        fQueryOpen(oQuery);
      end;

      Result := iLOFPR_ID;
    end;

  finally
    freeandnil(oQuery);
  end;

end;


function fTEST_LLOST_EXIST(iSTDPL_ID, iLOFPR_ID : Integer): Boolean;
var
  oQuery : TUniQuery;
begin

  Result := False;

  oQuery := TUniQuery.Create(nil);
  try
    if fQueryRQSQL(oQuery, 46611) then
    begin
      fQueryDeclareParameterType(oQuery, 'iSTDPL_ID', ftInteger, iSTDPL_ID);
      fQueryDeclareParameterType(oQuery, 'iLOFPR_ID', ftInteger, iLOFPR_ID);
      fQueryOpen(oQuery);
    end;
    
    if not oQuery.IsEmpty then
      Result := fGetValueI(oQuery, 'C_LLOST') > 0;
  finally
    freeandnil(oQuery);
  end;
  
end;

function fget_ELREP_PDS_VALIDE(iDMCOT_ID : Integer): String;
{
  Récupere le poids valide de la cotation VN
}
var
  oQuery : TUniQuery;
begin

  Result := '0';

  oQuery := TUniQuery.Create(nil);
  try
    if fQueryRQSQL(oQuery, 46913) then
    begin
      fQueryDeclareParameterType(oQuery, 'iDMCOT_ID', ftInteger, iDMCOT_ID);
      fQueryOpen(oQuery);
    end;
    
    if not oQuery.IsEmpty then
      Result := fGetValueS(oQuery, 'ELREP_PDS_VALIDE');
  finally
    freeandnil(oQuery);
  end;
  
end;

procedure pHOFREHistorise_Relance(iOFFRE_ID, iCOLLA_ID : Integer; sHOFRE_CMNT, sHOFRE_DATE_RELANCE : String);
var 
  oQuery :TUNIQuery ;
   iNUM_RELANCE : Integer;
begin

  if (iOFFRE_ID <= 0) or (iCOLLA_ID <= 0) then
    exit;

    oQuery := TUNIQuery.Create(nil);
    try
      iNUM_RELANCE:= fGetRecordCount_HOFRE(iOFFRE_ID)  +1;
      if fQueryRQSQL(oQuery, 34389) then
      begin
        // Préparation insertions des lignes de relances
        fQueryDeclareParameterType(oQuery, 'sHOFRE_DATECRE',      ftDateTime, fCurrentDateTime);
        fQueryDeclareParameterType(oQuery, 'sHOFRE_DATEMOD',      ftDateTime, fCurrentDateTime);
        fQueryDeclareParameterType(oQuery, 'sHOFRE_COLMOD',       ftstring,   fGetUser);
        fQueryDeclareParameterType(oQuery, 'iHOFRE_SUP',          ftInteger,  0);
        fQueryDeclareParameterType(oQuery, 'iHOFRE_NUM_RELANCE',  ftInteger,  iNUM_RELANCE);
        fQueryDeclareParameterType(oQuery, 'iHOFRE_OFFRE_ID',     ftInteger,  iOFFRE_ID);
        fQueryDeclareParameterType(oQuery, 'iHOFRE_COLLA_ID',     ftInteger,  iCOLLA_ID);
        fQueryDeclareParameterType(oQuery, 'sHOFRE_CMNT',         ftstring,   sHOFRE_CMNT);
        fQueryDeclareParameterType(oQuery, 'sHOFRE_DATE_RELANCE', ftstring,   sHOFRE_DATE_RELANCE);
        fQueryOpen(oQuery, True);
      end;

    finally
      FreeAndNil(oQuery);
    end;


end;

function fGetRecordCount_HOFRE(iOFFRE_ID : Integer): Integer;
var
  oQuery :TUNIQuery;
begin
  Result := 0;
  oQuery := TUNIQuery.Create(nil);
  try

    if fQueryRQSQL(oQuery, 34391) then
    begin
      fQueryDeclareParameterType(oQuery, 'IOFFRE_ID', ftInteger, iOFFRE_ID);
      fQueryOpen(oQuery);
      Result := oQuery.RecordCount;  // Préparation insertions des lignes de relances
    end;

  finally
    FreeAndNil(oQuery);
  end;

end;


function fCalculSommeOFFRE(iOFFRE_ID: Integer): String;
var
  oQuery: TUniQuery;
begin
  Result := '0';
  oQuery := TUniQuery.Create(nil);
  try
    try

        // Recherche de la somme
      if fQueryRQSQL(oQuery, 8915) then
      begin
        fQueryDeclareParameterType(oQuery, 'iPOOFF_OFFRE_ID', ftInteger, iOFFRE_ID);
        fQueryOpen(oQuery);

        if oQuery.RecordCount > 0 then
          Result := fGetValueS(oQuery, 'SOMME')
        else
          Result := '0';

      end;

    except
      on E: Exception do
      begin
        raise;
      end;
    end;
  finally
    FreeAndNil(oQuery);
  end;

end;

function fCalculPRIX_VENTE(iOFFRE_ID: Integer): String;
var
  oQuery: TUniQuery;
begin
  Result := '0';
  oQuery := TUniQuery.Create(nil);
  try
    try

        // Recherche de la somme
      if fQueryRQSQL(oQuery, 47012) then
      begin
        fQueryDeclareParameterType(oQuery, 'iPOOFF_OFFRE_ID', ftInteger, iOFFRE_ID);
        fQueryOpen(oQuery);

        if oQuery.RecordCount > 0 then
          Result := fGetValueS(oQuery, 'PRIX_VENTE')
        else
          Result := '0';

      end;

    except
      on E: Exception do
      begin
        raise;
      end;
    end;
  finally
    FreeAndNil(oQuery);
  end;

end;


function fcalculLOFPR_PRIX_NET(iLOFPR_ID: string; toto: string): Extended;
begin
  Result := 0;
end;
end.
