object TileForm: TTileForm
  Left = 0
  Top = 0
  Caption = 'Tableau de bord'
  ClientHeight = 480
  ClientWidth = 760
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -12
  Font.Name = 'Segoe UI'
  Font.Style = []
  TextHeight = 15
  object cxButton1: TcxButton
    Left = 16
    Top = 440
    Width = 90
    Height = 28
    Caption = 'Fermer'
    TabOrder = 1
    OnClick = cxButton1Click
  end
  object dxTileControl1: TdxTileControl
    Left = 0
    Top = 0
    Width = 760
    Height = 430
    Align = alTop
    TabOrder = 0
    Title.Text = 'Accueil'
    object dxTileControl1Group1: TdxTileControlGroup
      Caption.Text = 'Ventes'
      Index = 0
    end
    object dxTileControl1Group2: TdxTileControlGroup
      Caption.Text = 'Stock'
      Index = 1
    end
    object dxTileControl1Item1: TdxTileControlItem
      Size = tcisLarge
      Style.GradientBeginColor = 16750899
      Text1.Value = 'Commandes'
      Text2.Value = '42 en cours'
      OnClick = dxTileControl1Item1Click
    end
    object dxTileControl1Item2: TdxTileControlItem
      IndexInGroup = 1
      Text1.Value = 'Clients'
    end
    object dxTileControl1Item3: TdxTileControlItem
      IndexInGroup = 2
      Size = tcisSmall
      Text1.Value = 'Nouveau'
    end
    object dxTileControl1Item4: TdxTileControlItem
      GroupIndex = 1
      Size = tcisExtraLarge
      Text1.Value = 'Articles'
      DetailOptions.DetailControl = dxTileControl1DetailSite1
    end
    object dxTileControl1DetailSite1: TdxTileControlDetailSite
      Left = 24
      Top = 16
      Width = 300
      Height = 200
      Visible = False
      object cxLabel1: TcxLabel
        Left = 16
        Top = 16
        Caption = 'Detail'
      end
    end
  end
end
