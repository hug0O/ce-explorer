unit WrappedForm;

interface

uses
  Winapi.Windows, System.SysUtils, System.Classes, Vcl.Controls, Vcl.Forms,
  Vcl.StdCtrls, Vcl.ExtCtrls, cxGrid, cxGridDBTableView, cxGridLevel,
  cxGridCustomTableView, cxGridTableView, cxGridCustomView, cxClasses;

type
  TWrappedForm = class(TForm)
    pnlTop: TPanel;
    btnSave: TButton;
    cxGrid1: TcxGrid;
    cxGrid1DBTableView1: TcxGridDBTableView;
    cxGrid1DBTableView1ID: TcxGridDBColumn;
    cxGrid1DBTableView1Name: TcxGridDBColumn;
    cxGrid1Level1: TcxGridLevel;
    edtAfter: TEdit;
    procedure FormKeyDown(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure btnSaveClick(Sender: TObject);
    procedure cxGrid1DBTableView1SelectionChanged
      (Sender: TcxCustomGridTableView);
    procedure edtAfterExit(Sender: TObject);
  private
    FCount: Integer;
  end;

var
  WrappedForm: TWrappedForm;

implementation

{$R *.dfm}

procedure TWrappedForm.FormKeyDown(Sender: TObject; var Key: Word;
  Shift: TShiftState);
begin
  if Key = VK_ESCAPE then
    Close;
end;

procedure TWrappedForm.btnSaveClick(Sender: TObject);
begin
  Inc(FCount);
  btnSave.Enabled := FCount < 3;
end;

procedure TWrappedForm.cxGrid1DBTableView1SelectionChanged
  (Sender: TcxCustomGridTableView);
begin
end;

procedure TWrappedForm.
  edtAfterExit(Sender: TObject);
begin
end;

end.
