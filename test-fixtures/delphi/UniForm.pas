unit UniForm;

interface

uses
  Winapi.Windows, System.SysUtils, System.Classes, Vcl.Controls, Vcl.Forms, Vcl.StdCtrls,
  Data.DB, DBAccess, Uni, MemDS, UniProvider, OracleUniProvider;

type
  TUniForm = class(TForm)
    btnOuvrir: TButton;
    UniConnection1: TUniConnection;
    UniQuery1: TUniQuery;
    UniQuery1ID: TIntegerField;
    UniQuery1NOM: TStringField;
    UniQuery1SOLDE: TFloatField;
    UniTable1: TUniTable;
    DataSource1: TDataSource;
    OracleUniProvider1: TOracleUniProvider;
    procedure btnOuvrirClick(Sender: TObject);
    procedure UniConnection1AfterConnect(Sender: TObject);
    procedure UniQuery1AfterOpen(DataSet: TDataSet);
    procedure UniQuery1NOMGetText(Sender: TField; var Text: string; DisplayText: Boolean);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  UniForm: TUniForm;

implementation

{$R *.dfm}

procedure TUniForm.btnOuvrirClick(Sender: TObject);
begin
  UniQuery1.ParamByName('VILLE').AsString := 'Paris';
  UniQuery1.Open;
end;

procedure TUniForm.UniConnection1AfterConnect(Sender: TObject);
begin
  Caption := 'Connecte';
end;

procedure TUniForm.UniQuery1AfterOpen(DataSet: TDataSet);
begin
  Caption := Format('%d clients', [DataSet.RecordCount]);
end;

procedure TUniForm.UniQuery1NOMGetText(Sender: TField; var Text: string; DisplayText: Boolean);
begin
  Text := UpperCase(Sender.AsString);
end;

end.
