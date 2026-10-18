unit LayoutForm;

interface

uses
  Winapi.Windows, System.SysUtils, System.Classes, Vcl.Controls, Vcl.Forms,
  Vcl.StdCtrls, Vcl.ExtCtrls;

type
  TLayoutForm = class(TForm)
    pnlSaisie: TPanel;
    lblNom: TLabel;
    edtNom: TEdit;
    memNotes: TMemo;
    pnlBoutons: TPanel;
    btnOk: TButton;
    btnAnnuler: TButton;
    procedure FormCreate(Sender: TObject);
    procedure btnOkClick(Sender: TObject);
    procedure btnAnnulerClick(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  LayoutForm: TLayoutForm;

implementation

{$R *.dfm}

procedure TLayoutForm.FormCreate(Sender: TObject);
begin
end;

procedure TLayoutForm.btnOkClick(Sender: TObject);
begin
  ModalResult := mrOk;
end;

procedure TLayoutForm.btnAnnulerClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

end.
