object LayoutForm: TLayoutForm
  Left = 0
  Top = 0
  Caption = 'Disposition'
  ClientHeight = 160
  ClientWidth = 320
  Font.Charset = DEFAULT_CHARSET
  Font.Name = 'Segoe UI'
  OnCreate = FormCreate
  TextHeight = 15
  object pnlSaisie: TPanel
    Left = 0
    Top = 0
    Width = 320
    Height = 100
    Align = alTop
    TabOrder = 0
    object lblNom: TLabel
      Left = 16
      Top = 19
      Width = 24
      Height = 15
      Caption = 'Nom'
    end
    object edtNom: TEdit
      Left = 56
      Top = 16
      Width = 121
      Height = 23
      TabOrder = 0
    end
    object memNotes: TMemo
      Left = 16
      Top = 48
      Width = 185
      Height = 41
      Lines.Strings = (
        'object fake'
        'end')
      TabOrder = 1
    end
  end
  object pnlBoutons: TPanel
    Left = 0
    Top = 120
    Width = 320
    Height = 40
    Align = alBottom
    TabOrder = 1
    object btnOk: TButton
      Left = 152
      Top = 8
      Width = 75
      Height = 25
      Caption = 'OK'
      TabOrder = 0
      OnClick = btnOkClick
    end
    object btnAnnuler: TButton
      Left = 233
      Top = 8
      Width = 75
      Height = 25
      Caption = 'Annuler'
      TabOrder = 1
      OnClick = btnAnnulerClick
    end
  end
end
