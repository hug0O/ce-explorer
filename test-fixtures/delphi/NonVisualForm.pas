unit NonVisualForm;

interface

uses
  Winapi.Windows, System.SysUtils, System.Classes, Vcl.Controls, Vcl.Forms,
  Vcl.StdCtrls, Data.DB, DBAccess, Uni, MemDS, cxGraphics, cxControls, cxStyles,
  cxEdit, cxLookAndFeels, dxLayoutContainer, dxLayoutControl, cxTextEdit;

type
  TNonVisualForm = class(TForm)
    btnOuvrir: TButton;
    dxLayoutControl1: TdxLayoutControl;
    edtNom: TcxTextEdit;
    dxLayoutControl1Group_Root: TdxLayoutGroup;
    dxLayoutControl1Item1: TdxLayoutItem;
    UniConnection1: TUniConnection;
    UniQuery1: TUniQuery;
    UniQuery1ID: TIntegerField;
    cxStyleRepository1: TcxStyleRepository;
    cxStyle1: TcxStyle;
    cxStyle2: TcxStyle;
    cxEditRepository1: TcxEditRepository;
    cxEditRepository1TextItem1: TcxEditRepositoryTextItem;
    cxLookAndFeelController1: TcxLookAndFeelController;
    cxImageList1: TcxImageList;
    tmrStatut: TTimer;
    DataSource1: TDataSource;
    procedure btnOuvrirClick(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  NonVisualForm: TNonVisualForm;

implementation

{$R *.dfm}

procedure TNonVisualForm.btnOuvrirClick(Sender: TObject);
begin
  UniQuery1.Open;
end;

end.
