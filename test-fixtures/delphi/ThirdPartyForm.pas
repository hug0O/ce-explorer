unit ThirdPartyForm;

interface

uses
  Winapi.Windows, System.SysUtils, System.Classes, Vcl.Controls, Vcl.Forms,
  cxGraphics, cxControls, cxLookAndFeels, cxLookAndFeelPainters, cxContainer,
  cxEdit, cxTextEdit, cxLabel, cxDropDownEdit, cxCurrencyEdit, cxCalendar,
  cxCheckBox, cxRadioGroup, cxMemo, cxButtonEdit, cxPC, cxGrid, cxGridLevel,
  cxGridDBTableView, AdvPanel, AdvGlowButton, AdvEdit, AdvOfficePager,
  AdvGrid, AdvGroupBox, AdvOfficeButtons, AdvStyleIF;

type
  TThirdPartyForm = class(TForm)
    AdvPanel1: TAdvPanel;
    AdvGlowButton1: TAdvGlowButton;
    AdvGlowButton2: TAdvGlowButton;
    AdvEdit1: TAdvEdit;
    cxPageControl1: TcxPageControl;
    cxTabSheet1: TcxTabSheet;
    cxLabel1: TcxLabel;
    cxTextEdit1: TcxTextEdit;
    cxLabel2: TcxLabel;
    cxComboBox1: TcxComboBox;
    cxLabel3: TcxLabel;
    cxCurrencyEdit1: TcxCurrencyEdit;
    cxDateEdit1: TcxDateEdit;
    cxCheckBox1: TcxCheckBox;
    cxRadioGroup1: TcxRadioGroup;
    cxMemo1: TcxMemo;
    cxButtonEdit1: TcxButtonEdit;
    cxTabSheet2: TcxTabSheet;
    cxGrid1: TcxGrid;
    cxGrid1DBTableView1: TcxGridDBTableView;
    cxGrid1Level1: TcxGridLevel;
    AdvOfficePager1: TAdvOfficePager;
    AdvOfficePage1: TAdvOfficePage;
    AdvStringGrid1: TAdvStringGrid;
    AdvGroupBox1: TAdvGroupBox;
    AdvOfficeCheckBox1: TAdvOfficeCheckBox;
    AdvOfficePage2: TAdvOfficePage;
    cxLookAndFeelController1: TcxLookAndFeelController;
    AdvFormStyler1: TAdvFormStyler;
    procedure AdvGlowButton1Click(Sender: TObject);
    procedure AdvEdit1Change(Sender: TObject);
    procedure cxTextEdit1PropertiesChange(Sender: TObject);
    procedure cxButtonEdit1PropertiesButtonClick(Sender: TObject; AButtonIndex: Integer);
    procedure AdvStringGrid1Click(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  ThirdPartyForm: TThirdPartyForm;

implementation

{$R *.dfm}

procedure TThirdPartyForm.AdvGlowButton1Click(Sender: TObject);
begin
  Close;
end;

procedure TThirdPartyForm.AdvEdit1Change(Sender: TObject);
begin
end;

procedure TThirdPartyForm.cxTextEdit1PropertiesChange(Sender: TObject);
begin
  AdvEdit1.Text := cxTextEdit1.Text;
end;

procedure TThirdPartyForm.cxButtonEdit1PropertiesButtonClick(Sender: TObject; AButtonIndex: Integer);
begin
end;

procedure TThirdPartyForm.AdvStringGrid1Click(Sender: TObject);
begin
end;

end.
