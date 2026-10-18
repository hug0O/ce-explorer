unit ComplexForm;

interface

uses
  Winapi.Windows, System.SysUtils, System.Classes, Vcl.Controls, Vcl.Forms,
  Vcl.StdCtrls, Vcl.ExtCtrls, Vcl.ComCtrls, cxButtons, cxGrid, cxGridLevel,
  cxGridDBTableView;

type
  TComplexForm = class(TForm)
    pnlHaut: TPanel;
    lblTitre: TLabel;
    btnNouveau: TButton;
    btnImporter: TcxButton;
    edtRecherche: TEdit;
    pnlGauche: TPanel;
    lbxCategories: TListBox;
    pnlGaucheBas: TPanel;
    btnAjouter: TButton;
    btnSupprimer: TButton;
    splLateral: TSplitter;
    pnlCentre: TPanel;
    pgcDetails: TPageControl;
    tsGeneral: TTabSheet;
    grpIdentite: TGroupBox;
    lblNom: TLabel;
    edtNom: TEdit;
    lblPrenom: TLabel;
    edtPrenom: TEdit;
    chkActif: TCheckBox;
    grpAdresse: TGroupBox;
    memAdresse: TMemo;
    lvwContacts: TListView;
    tsHistorique: TTabSheet;
    cxGrid1: TcxGrid;
    cxGrid1DBTableView1: TcxGridDBTableView;
    cxGrid1Level1: TcxGridLevel;
    pnlBas: TPanel;
    lblStatut: TLabel;
    btnEnregistrer: TButton;
    btnFermer: TButton;
    tmrStatut: TTimer;
    procedure FormCreate(Sender: TObject);
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure btnNouveauClick(Sender: TObject);
    procedure btnImporterClick(Sender: TObject);
    procedure edtRechercheChange(Sender: TObject);
    procedure lbxCategoriesClick(Sender: TObject);
    procedure btnAjouterClick(Sender: TObject);
    procedure btnSupprimerClick(Sender: TObject);
    procedure edtNomChange(Sender: TObject);
    procedure chkActifClick(Sender: TObject);
    procedure btnEnregistrerClick(Sender: TObject);
    procedure btnFermerClick(Sender: TObject);
    procedure tmrStatutTimer(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  ComplexForm: TComplexForm;

implementation

{$R *.dfm}

procedure TComplexForm.FormCreate(Sender: TObject);
begin
  lblStatut.Caption := 'Pret';
end;

procedure TComplexForm.FormClose(Sender: TObject; var Action: TCloseAction);
begin
  Action := caFree;
end;

procedure TComplexForm.btnNouveauClick(Sender: TObject);
begin
  edtNom.Clear;
  edtPrenom.Clear;
end;

procedure TComplexForm.btnImporterClick(Sender: TObject);
begin
end;

procedure TComplexForm.edtRechercheChange(Sender: TObject);
begin
end;

procedure TComplexForm.lbxCategoriesClick(Sender: TObject);
begin
end;

procedure TComplexForm.btnAjouterClick(Sender: TObject);
begin
end;

procedure TComplexForm.btnSupprimerClick(Sender: TObject);
begin
end;

procedure TComplexForm.edtNomChange(Sender: TObject);
begin
  btnEnregistrer.Enabled := edtNom.Text <> '';
end;

procedure TComplexForm.chkActifClick(Sender: TObject);
begin
  edtNom.Enabled := chkActif.Checked;
end;

procedure TComplexForm.btnEnregistrerClick(Sender: TObject);
begin
  Close;
end;

procedure TComplexForm.btnFermerClick(Sender: TObject);
begin
  Close;
end;

procedure TComplexForm.tmrStatutTimer(Sender: TObject);
begin
end;

end.
