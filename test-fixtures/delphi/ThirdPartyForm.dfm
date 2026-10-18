object ThirdPartyForm: TThirdPartyForm
  Left = 0
  Top = 0
  Caption = 'DevExpress + TMS'
  ClientHeight = 440
  ClientWidth = 720
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -12
  Font.Name = 'Segoe UI'
  Font.Style = []
  TextHeight = 15
  object AdvPanel1: TAdvPanel
    Left = 0
    Top = 0
    Width = 720
    Height = 48
    Align = alTop
    Caption = 'Barre TMS'
    TabOrder = 0
    object AdvGlowButton1: TAdvGlowButton
      Left = 16
      Top = 10
      Width = 90
      Height = 28
      Caption = 'Enregistrer'
      TabOrder = 0
      OnClick = AdvGlowButton1Click
    end
    object AdvGlowButton2: TAdvGlowButton
      Left = 114
      Top = 10
      Width = 90
      Height = 28
      Caption = 'Annuler'
      TabOrder = 1
    end
    object AdvEdit1: TAdvEdit
      Left = 520
      Top = 14
      Width = 180
      Height = 21
      TabOrder = 2
      Text = 'Rechercher'
      OnChange = AdvEdit1Change
    end
  end
  object cxPageControl1: TcxPageControl
    Left = 0
    Top = 48
    Width = 720
    Height = 250
    Align = alTop
    TabOrder = 1
    Properties.ActivePage = cxTabSheet1
    Properties.CustomButtons.Buttons = <>
    ClientRectBottom = 246
    ClientRectLeft = 4
    ClientRectRight = 716
    ClientRectTop = 28
    object cxTabSheet1: TcxTabSheet
      Caption = 'Saisie'
      ImageIndex = 0
      object cxLabel1: TcxLabel
        Left = 16
        Top = 18
        Caption = 'Nom'
        Transparent = True
      end
      object cxTextEdit1: TcxTextEdit
        Left = 96
        Top = 16
        Properties.OnChange = cxTextEdit1PropertiesChange
        TabOrder = 0
        Text = 'Dupont'
        Width = 177
      end
      object cxLabel2: TcxLabel
        Left = 16
        Top = 50
        Caption = 'Ville'
        Transparent = True
      end
      object cxComboBox1: TcxComboBox
        Left = 96
        Top = 48
        Properties.Items.Strings = (
          'Paris'
          'Lyon'
          'Nantes')
        TabOrder = 1
        Text = 'Lyon'
        Width = 177
      end
      object cxLabel3: TcxLabel
        Left = 16
        Top = 82
        Caption = 'Montant'
        Transparent = True
      end
      object cxCurrencyEdit1: TcxCurrencyEdit
        Left = 96
        Top = 80
        EditValue = 1250.000000000000000000
        TabOrder = 2
        Width = 177
      end
      object cxDateEdit1: TcxDateEdit
        Left = 96
        Top = 112
        TabOrder = 3
        Width = 177
      end
      object cxCheckBox1: TcxCheckBox
        Left = 96
        Top = 144
        Caption = 'Actif'
        TabOrder = 4
        Width = 121
      end
      object cxRadioGroup1: TcxRadioGroup
        Left = 304
        Top = 16
        Caption = 'Type'
        Properties.Items = <
          item
            Caption = 'Particulier'
          end
          item
            Caption = 'Societe'
          end
          item
            Caption = 'Association'
          end>
        TabOrder = 5
        Height = 97
        Width = 185
      end
      object cxMemo1: TcxMemo
        Left = 304
        Top = 120
        Lines.Strings = (
          'Commentaire libre')
        TabOrder = 6
        Height = 89
        Width = 185
      end
      object cxButtonEdit1: TcxButtonEdit
        Left = 96
        Top = 176
        Properties.Buttons = <
          item
            Default = True
            Kind = bkEllipsis
          end>
        Properties.OnButtonClick = cxButtonEdit1PropertiesButtonClick
        TabOrder = 7
        Width = 177
      end
    end
    object cxTabSheet2: TcxTabSheet
      Caption = 'Liste'
      ImageIndex = 1
      object cxGrid1: TcxGrid
        Left = 0
        Top = 0
        Width = 712
        Height = 218
        Align = alClient
        TabOrder = 0
        object cxGrid1DBTableView1: TcxGridDBTableView
          Navigator.Buttons.CustomButtons = <>
          DataController.Summary.DefaultGroupSummaryItems = <>
          DataController.Summary.FooterSummaryItems = <>
          DataController.Summary.SummaryGroups = <>
        end
        object cxGrid1Level1: TcxGridLevel
          GridView = cxGrid1DBTableView1
        end
      end
    end
  end
  object AdvOfficePager1: TAdvOfficePager
    Left = 0
    Top = 298
    Width = 720
    Height = 142
    Align = alClient
    ActivePage = AdvOfficePage1
    TabOrder = 2
    object AdvOfficePage1: TAdvOfficePage
      Left = 1
      Top = 26
      Width = 718
      Height = 115
      Caption = 'Grille TMS'
      object AdvStringGrid1: TAdvStringGrid
        Left = 8
        Top = 8
        Width = 400
        Height = 96
        ColCount = 5
        RowCount = 4
        FixedCols = 1
        FixedRows = 1
        TabOrder = 0
        OnClick = AdvStringGrid1Click
      end
      object AdvGroupBox1: TAdvGroupBox
        Left = 424
        Top = 8
        Width = 185
        Height = 96
        Caption = 'Options'
        TabOrder = 1
        object AdvOfficeCheckBox1: TAdvOfficeCheckBox
          Left = 16
          Top = 28
          Width = 140
          Height = 20
          TabOrder = 0
          Caption = 'Envoyer un mail'
        end
      end
    end
    object AdvOfficePage2: TAdvOfficePage
      Left = 1
      Top = 26
      Width = 718
      Height = 115
      Caption = 'Autre'
    end
  end
  object cxLookAndFeelController1: TcxLookAndFeelController
    Left = 656
    Top = 8
  end
  object AdvFormStyler1: TAdvFormStyler
    Left = 688
    Top = 8
  end
end
