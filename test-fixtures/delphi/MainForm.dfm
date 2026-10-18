object MainForm: TMainForm
  Left = 0
  Top = 0
  Caption = 'Exemple Code Explorer'
  ClientHeight = 160
  ClientWidth = 320
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -12
  Font.Name = 'Segoe UI'
  Font.Style = []
  OnCreate = FormCreate
  TextHeight = 15
  object lblNom: TLabel
    Left = 16
    Top = 16
    Width = 24
    Height = 15
    Caption = 'Nom'
  end
  object edtNom: TEdit
    Left = 16
    Top = 39
    Width = 193
    Height = 23
    TabOrder = 0
    OnChange = edtNomChange
  end
  object btnValider: TButton
    Left = 224
    Top = 38
    Width = 75
    Height = 25
    Caption = 'Valider'
    TabOrder = 1
    OnClick = btnValiderClick
  end
  object chkActif: TCheckBox
    Left = 16
    Top = 80
    Width = 97
    Height = 17
    Caption = 'Actif'
    TabOrder = 2
    OnClick = chkActifClick
  end
end
