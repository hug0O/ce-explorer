object ComplexForm: TComplexForm
  Left = 0
  Top = 0
  Caption = 'Gestion des clients'
  ClientHeight = 480
  ClientWidth = 760
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -12
  Font.Name = 'Segoe UI'
  Font.Style = []
  Position = poScreenCenter
  OnCreate = FormCreate
  OnClose = FormClose
  TextHeight = 15
  object pnlHaut: TPanel
    Left = 0
    Top = 0
    Width = 760
    Height = 49
    Align = alTop
    BevelOuter = bvNone
    TabOrder = 0
    ExplicitWidth = 758
    object lblTitre: TLabel
      Left = 16
      Top = 14
      Width = 112
      Height = 21
      Caption = 'Clients'
      Font.Charset = DEFAULT_CHARSET
      Font.Height = -16
      Font.Style = [fsBold]
      ParentFont = False
    end
    object btnNouveau: TButton
      Left = 160
      Top = 12
      Width = 75
      Height = 25
      Caption = 'Nouveau'
      TabOrder = 0
      OnClick = btnNouveauClick
    end
    object btnImporters: TcxButton
      Left = 243
      Top = 12
      Width = 90
      Height = 25
      Caption = 'Importer...'
      LookAndFeel.Kind = lfFlat
      OptionsImage.Margin = 4
      TabOrder = 1
    end
    object edtRecherche: TEdit
      Left = 560
      Top = 14
      Width = 185
      Height = 23
      Anchors = [akTop, akRight]
      TabOrder = 2
      TextHint = 'Rechercher'
    end
  end
  object pnlGauche: TPanel
    Left = 0
    Top = 49
    Width = 177
    Height = 390
    Align = alLeft
    TabOrder = 1
    object lbxCategories: TListBox
      Left = 1
      Top = 1
      Width = 175
      Height = 355
      Align = alClient
      ItemHeight = 15
      TabOrder = 0
    end
    object pnlGaucheBas: TPanel
      Left = 1
      Top = 356
      Width = 175
      Height = 33
      Align = alBottom
      BevelOuter = bvNone
      TabOrder = 1
      object btnAjouter: TButton
        Left = 8
        Top = 4
        Width = 75
        Height = 25
        Caption = 'Ajouter'
        TabOrder = 0
      end
      object btnSupprimer: TButton
        Left = 88
        Top = 4
        Width = 77
        Height = 25
        Caption = 'Supprimer'
        TabOrder = 1
      end
    end
  end
  object splLateral: TSplitter
    Left = 177
    Top = 49
    Width = 8
    Height = 390
    ExplicitHeight = 391
  end
  object pnlCentre: TPanel
    Left = 185
    Top = 49
    Width = 575
    Height = 390
    Align = alClient
    BevelOuter = bvNone
    TabOrder = 2
    object pgcDetails: TPageControl
      Left = 0
      Top = 0
      Width = 575
      Height = 390
      ActivePage = tsGeneral
      Align = alClient
      TabOrder = 0
      object tsGeneral: TTabSheet
        Caption = 'General'
        object grpIdentite: TGroupBox
          Left = 16
          Top = 16
          Width = 280
          Height = 129
          Caption = 'Identite'
          TabOrder = 0
          object lblNom: TLabel
            Left = 16
            Top = 29
            Width = 27
            Height = 15
            Caption = 'Nom'
          end
          object edtNom: TEdit
            Left = 96
            Top = 26
            Width = 161
            Height = 23
            TabOrder = 0
            OnChange = edtNomChange
          end
          object lblPrenom: TLabel
            Left = 16
            Top = 63
            Width = 43
            Height = 15
            Caption = 'Prenom'
          end
          object edtPrenom: TEdit
            Left = 96
            Top = 58
            Width = 161
            Height = 23
            TabOrder = 1
          end
          object chkActif: TCheckBox
            Left = 156
            Top = 107
            Width = 97
            Height = 17
            Caption = 'Actif'
            TabOrder = 2
            OnClick = chkActifClick
          end
          object Label1: TLabel
            Left = 16
            Top = 108
            Width = 68
            Height = 20
            Caption = 'Label1'
          end
        end
        object grpAdresse: TGroupBox
          Left = 312
          Top = 16
          Width = 240
          Height = 129
          Caption = 'Adresse'
          TabOrder = 1
          object memAdresse: TMemo
            Left = 16
            Top = 24
            Width = 209
            Height = 89
            Lines.Strings = (
              'object ligne1'
              'end')
            TabOrder = 0
          end
        end
        object cxGrid2: TcxGrid
          Left = 12
          Top = 156
          Width = 544
          Height = 180
          TabOrder = 2
        end
      end
      object tsHistorique: TTabSheet
        Caption = 'Historique'
        ImageIndex = 1
        object cxGrid1: TcxGrid
          Left = 0
          Top = 0
          Width = 567
          Height = 360
          Align = alClient
          TabOrder = 0
          object cxGrid1DBTableView1: TcxGridDBTableView
            Navigator.Buttons.CustomButtons = <>
            DataController.Summary.DefaultGroupSummaryItems = <>
            DataController.Summary.FooterSummaryItems = <>
          end
          object cxGrid1Level1: TcxGridLevel
            GridView = cxGrid1DBTableView1
          end
        end
      end
    end
  end
  object pnlBas: TPanel
    Left = 0
    Top = 439
    Width = 760
    Height = 41
    Align = alBottom
    BevelOuter = bvNone
    TabOrder = 3
    object lblStatut: TLabel
      Left = 16
      Top = 13
      Width = 33
      Height = 15
      Caption = 'Pret'
    end
    object btnEnregistrer: TButton
      Left = 580
      Top = 8
      Width = 75
      Height = 25
      Anchors = [akTop, akRight]
      Caption = 'Enregistrer'
      Default = True
      TabOrder = 0
      OnClick = btnEnregistrerClick
    end
    object btnFermer: TButton
      Left = 668
      Top = 8
      Width = 75
      Height = 25
      Anchors = [akTop, akRight]
      Cancel = True
      Caption = 'Fermer'
      TabOrder = 1
      OnClick = btnFermerClick
    end
  end
  object tmrStatut: TTimer
    Interval = 5000
    Left = 640
    Top = 8
  end
end
