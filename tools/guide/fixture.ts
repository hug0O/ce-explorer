/** The form the guide is shot on: a small customer form with a popup menu, plain VCL, so every picture is about the designer and not about a library. */

export const DFM = [
    'object CustomerForm: TCustomerForm',
    '  Left = 0', '  Top = 0', "  Caption = 'Customer'", '  ClientHeight = 330', '  ClientWidth = 520',
    '  object lblName: TLabel', '    Left = 16', '    Top = 20', '    Width = 31', '    Height = 13', "    Caption = 'Name'", '  end',
    '  object edtName: TEdit', '    Left = 96', '    Top = 16', '    Width = 200', '    Height = 21', '    TabOrder = 0', '  end',
    '  object lblCity: TLabel', '    Left = 16', '    Top = 52', '    Width = 22', '    Height = 13', "    Caption = 'City'", '  end',
    '  object edtCity: TEdit', '    Left = 96', '    Top = 48', '    Width = 200', '    Height = 21', '    TabOrder = 1', '  end',
    '  object cbType: TComboBox', '    Left = 320', '    Top = 16', '    Width = 168', '    Height = 21', '    TabOrder = 2', "    Text = 'Individual'", '  end',
    '  object chkActive: TCheckBox', '    Left = 320', '    Top = 50', '    Width = 97', '    Height = 17', "    Caption = 'Active'", '    TabOrder = 3', '  end',
    '  object memNotes: TMemo', '    Left = 16', '    Top = 88', '    Width = 472', '    Height = 150', '    Anchors = [akLeft, akTop, akRight, akBottom]', '    Lines.Strings = (', "      'Notes about the customer')", '    TabOrder = 4', '  end',
    '  object pnlButtons: TPanel', '    Left = 0', '    Top = 270', '    Width = 520', '    Height = 41', '    Align = alBottom', '    TabOrder = 5', "    Caption = ''",
    '    object btnSave: TButton', '      Left = 320', '      Top = 8', '      Width = 75', '      Height = 25', "      Caption = 'Save'", '      TabOrder = 0', '      OnClick = btnSaveClick', '    end',
    '    object btnCancel: TButton', '      Left = 410', '      Top = 8', '      Width = 75', '      Height = 25', "      Caption = 'Cancel'", '      TabOrder = 1', '    end',
    '  end',
    '  object sbMain: TStatusBar', '    Left = 0', '    Top = 311', '    Width = 520', '    Height = 19', '    Panels = <>', '  end',
    '  object popRow: TPopupMenu', '    Left = 250', '    Top = 278',
    '    object miOpen: TMenuItem', "      Caption = '&Open'", '      ShortCut = 16463', '      OnClick = miOpenClick', '    end',
    '    object N1: TMenuItem', "      Caption = '-'", '    end',
    '    object miRecent: TMenuItem', "      Caption = 'Recent'",
    '      object miLast: TMenuItem', "        Caption = 'Last customer'", '        Checked = True', '      end',
    '    end',
    '  end',
    'end', '',
].join('\n');

export const PAS = [
    'unit CustomerUnit;', '', 'interface', '', 'uses Forms, StdCtrls, ExtCtrls, ComCtrls, Menus;', '', 'type',
    '  TCustomerForm = class(TForm)',
    '    lblName: TLabel;', '    edtName: TEdit;', '    lblCity: TLabel;', '    edtCity: TEdit;', '    cbType: TComboBox;', '    chkActive: TCheckBox;', '    memNotes: TMemo;',
    '    pnlButtons: TPanel;', '    btnSave: TButton;', '    btnCancel: TButton;', '    sbMain: TStatusBar;', '    popRow: TPopupMenu;', '    miOpen: TMenuItem;', '    N1: TMenuItem;', '    miRecent: TMenuItem;', '    miLast: TMenuItem;',
    '    procedure btnSaveClick(Sender: TObject);', '    procedure miOpenClick(Sender: TObject);',
    '  end;', '', 'var', '  CustomerForm: TCustomerForm;', '', 'implementation', '', '{$R *.dfm}', '',
    'procedure TCustomerForm.btnSaveClick(Sender: TObject);', 'begin', '  ModalResult := mrOk;', 'end;', '',
    'procedure TCustomerForm.miOpenClick(Sender: TObject);', 'begin', 'end;', '', 'end.', '',
].join('\n');
