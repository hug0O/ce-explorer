unit TileForm;

interface

uses
  Winapi.Windows, System.SysUtils, System.Classes, Vcl.Controls, Vcl.Forms,
  cxGraphics, cxControls, cxLookAndFeels, cxLookAndFeelPainters, cxButtons,
  cxLabel, cxContainer, cxEdit, cxClasses, dxCore, dxCoreClasses,
  dxCustomTileControl, dxTileControl;

type
  TTileForm = class(TForm)
    cxButton1: TcxButton;
    dxTileControl1: TdxTileControl;
    dxTileControl1Group1: TdxTileControlGroup;
    dxTileControl1Group2: TdxTileControlGroup;
    dxTileControl1Item1: TdxTileControlItem;
    dxTileControl1Item2: TdxTileControlItem;
    dxTileControl1Item3: TdxTileControlItem;
    dxTileControl1Item4: TdxTileControlItem;
    dxTileControl1DetailSite1: TdxTileControlDetailSite;
    cxLabel1: TcxLabel;
    procedure cxButton1Click(Sender: TObject);
    procedure dxTileControl1Item1Click(Sender: TdxTileControlItem);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  TileForm: TTileForm;

implementation

{$R *.dfm}

procedure TTileForm.cxButton1Click(Sender: TObject);
begin
  Close;
end;

procedure TTileForm.dxTileControl1Item1Click(Sender: TdxTileControlItem);
begin
  ShowMessage('Commandes');
end;

end.
