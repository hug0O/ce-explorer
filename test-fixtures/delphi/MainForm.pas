unit MainForm;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Classes,
  Vcl.Graphics, Vcl.Controls, Vcl.Forms, Vcl.Dialogs, Vcl.StdCtrls;

type
  TMainForm = class(TForm)
    lblNom: TLabel;
    edtNom: TEdit;
    btnValider: TButton;
    chkActif: TCheckBox;
    procedure FormCreate(Sender: TObject);
    procedure edtNomChange(Sender: TObject);
    procedure btnValiderClick(Sender: TObject);
    procedure chkActifClick(Sender: TObject);
  private
    FNom: string;
  public
    property Nom: string read FNom write FNom;
  end;

var
  MainForm: TMainForm;

implementation

{$R *.dfm}

procedure TMainForm.FormCreate(Sender: TObject);
begin
  FNom := '';
  chkActif.Checked := True;
end;

procedure TMainForm.edtNomChange(Sender: TObject);
begin
  FNom := edtNom.Text;
  btnValider.Enabled := FNom <> '';
end;

procedure TMainForm.btnValiderClick(Sender: TObject);
begin
  ShowMessage('Bonjour ' + FNom);
end;

procedure TMainForm.chkActifClick(Sender: TObject);
begin
  edtNom.Enabled := chkActif.Checked;
end;

end.
