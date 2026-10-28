object frmTDB_ADMListe: TfrmTDB_ADMListe
  Left = 268
  Top = 199
  Caption = 'Liste'
  ClientHeight = 1028
  ClientWidth = 1920
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'Tahoma'
  Font.Style = []
  FormStyle = fsMDIChild
  KeyPreview = True
  PopupMenu = frmMain.TrvPopUp
  Position = poDesigned
  ShowHint = True
  Visible = True
  OnClose = FormClose
  OnCloseQuery = FormCloseQuery
  OnKeyDown = FormKeyDown
  TextHeight = 13
  object pnlTopInfos: TPanel
    Left = 0
    Top = 0
    Width = 1920
    Height = 1028
    Align = alClient
    BorderStyle = bsSingle
    TabOrder = 0
    object lblTDB_ADM: TAdvSmoothLabel
      Left = 1
      Top = 78
      Width = 1914
      Height = 20
      Margins.Bottom = 0
      AutoShadowCaption = False
      Fill.Color = 12615680
      Fill.ColorTo = clWhite
      Fill.ColorMirror = clNone
      Fill.ColorMirrorTo = clNone
      Fill.GradientType = gtRadial
      Fill.GradientMirrorType = gtPath
      Fill.BorderColor = clNone
      Fill.BorderWidth = 0
      Fill.Rounding = 0
      Fill.ShadowOffset = 0
      Fill.Glow = gmNone
      Caption.Text = '  Tableau de bord ADV'
      Caption.Location = plTopLeft
      Caption.Font.Charset = ANSI_CHARSET
      Caption.Font.Color = clWindowText
      Caption.Font.Height = -15
      Caption.Font.Name = 'Tahoma'
      Caption.Font.Style = [fsBold]
      Caption.ColorStart = 16774365
      Caption.ColorEnd = clWhite
      CaptionShadow.Text = '  Inbounds'
      CaptionShadow.Font.Charset = DEFAULT_CHARSET
      CaptionShadow.Font.Color = clWindowText
      CaptionShadow.Font.Height = -27
      CaptionShadow.Font.Name = 'Tahoma'
      CaptionShadow.Font.Style = []
      CaptionShadowOffsetLeft = 0
      CaptionShadowOffsetTop = 0
      Version = '1.6.1.2'
      Transparent = False
      TextRendering = tClearType
      Align = alTop
      ExplicitTop = 48
      ExplicitWidth = 1207
    end
    object dxtcTiles: TdxTileControl
      Left = 1
      Top = 98
      Width = 1914
      Height = 730
      BiDiMode = bdLeftToRight
      LookAndFeel.Kind = lfStandard
      LookAndFeel.NativeStyle = False
      LookAndFeel.ScrollbarMode = sbmHybrid
      LookAndFeel.SkinName = 'Whiteprint'
      OptionsBehavior.ItemHotTrackMode = tcihtmOuterFrame
      OptionsBehavior.ItemMoving = False
      OptionsBehavior.ItemPressAnimation = False
      OptionsDetailAnimate.AnimationMode = damFade
      OptionsView.FixedIndentHorz = True
      OptionsView.FixedIndentVert = True
      OptionsView.GroupIndent = 12
      OptionsView.GroupMaxRowCount = 6
      OptionsView.IndentHorz = 20
      OptionsView.IndentVert = 4
      OptionsView.ItemIndent = 5
      ParentBiDiMode = False
      Style.Font.Charset = DEFAULT_CHARSET
      Style.Font.Color = clDefault
      Style.Font.Height = -19
      Style.Font.Name = 'Tahoma'
      Style.Font.Style = []
      Style.CheckedItemCheckMarkColor = clYellow
      TabOrder = 1
      Title.Font.Charset = DEFAULT_CHARSET
      Title.Font.Color = clDefault
      Title.Font.Height = -32
      Title.Font.Name = 'Tahoma'
      Title.Font.Style = []
      Title.IndentHorz = 0
      Title.IndentVert = 0
      Title.TabsActiveTextColor = 16735067
      Title.TabsFontSize = 8
      Title.TabsHotTextColor = 16735067
      Title.TabsTextColor = clBlack
      OnItemDeactivateDetail = dxtcTilesItemDeactivateDetail
      OnKeyDown = dxtcTilesKeyDown
      OnKeyUp = dxtcTilesKeyUp
      OnMouseMove = dxtcTilesMouseMove
      object dxtcgCommandes: TdxTileControlGroup
        Caption.Text = 'Commandes'
        Index = 0
      end
      object dxtcTilesGroup1: TdxTileControlGroup
        Index = 1
      end
      object dxtcgExpeditions: TdxTileControlGroup
        Caption.Text = 'Expeditions'
        Index = 2
      end
      object dxtcgFactures: TdxTileControlGroup
        Caption.Text = 'Factures'
        Index = 3
      end
      object dxtcgStock: TdxTileControlGroup
        Caption.Text = 'Stocks'
        Index = 4
      end
      object dxtcgOFFRES_TARIFS: TdxTileControlGroup
        Caption.Text = 'Offres & Tarifs'
        Index = 5
      end
      object dxtcgProjets: TdxTileControlGroup
        Caption.Text = 'Projets Verre & Decor'
        Index = 6
      end
      object dxtciARBBESuivi: TdxTileControlItem
        GroupIndex = 0
        IndexInGroup = 1
        Style.GradientBeginColor = 11303515
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Arbitrage '#224' traiter'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciARBBESuiviClick
      end
      object dxtciDMDAPListe: TdxTileControlItem
        GroupIndex = 0
        IndexInGroup = 4
        Size = tcisLarge
        Style.GradientBeginColor = 11303515
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Demandes d'#39'appro.'#13#10#224' traiter'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.Alignment = taCenter
        Text3.AssignedValues = [avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = clDefault
        Text3.Font.Height = -19
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentHorz = 40
        Text3.Value = 'VN'#13#10'N/A'
        Text3.WordWrap = True
        Text4.Alignment = taCenter
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -19
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentHorz = 40
        Text4.Value = 'D'#233'cor'#13#10'N/A'
        Text4.WordWrap = True
        OnClick = dxtciDMDAPListeClick
      end
      object dxtciPCDAG_A_TRAITER: TdxTileControlItem
        DetailOptions.Caption = 'Commandes d'#39'achat '#224' traiter'
        DetailOptions.DetailControl = pnlPCDAG_A_TRAITER
        DetailOptions.ShowTab = True
        GroupIndex = 0
        IndexInGroup = 5
        Style.GradientBeginColor = 11303515
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -16
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Commandes d'#39'achat '#224' traiter'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciPCDAG_A_TRAITERClick
      end
      object dxtciOFFRE_ST_0: TdxTileControlItem
        DetailOptions.Caption = 'Offres '#224' '#233'mettre'
        DetailOptions.DetailControl = pnlOFFRE_ST_0
        DetailOptions.ShowTab = True
        GroupIndex = 5
        IndexInGroup = 0
        Size = tcisLarge
        Style.GradientBeginColor = 16751932
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Offres '#224' '#233'mettre'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciOFFRE_ST_0Click
      end
      object dxtciOFFRE_A_RELANCER: TdxTileControlItem
        DetailOptions.Caption = 'Offres '#224' relancer'
        DetailOptions.DetailControl = pnlOFFRE_A_RELANCER
        DetailOptions.ShowTab = True
        GroupIndex = 5
        IndexInGroup = 1
        Size = tcisLarge
        Style.GradientBeginColor = 16751932
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Offres '#224' relancer'
        Text1.WordWrap = True
        Text2.Alignment = taCenter
        Text2.AssignedValues = []
        Text2.IndentHorz = 20
        Text2.IndentVert = 16
        Text3.Alignment = taCenter
        Text3.AssignedValues = [avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = clDefault
        Text3.Font.Height = -19
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentHorz = 40
        Text3.IndentVert = 16
        Text3.Value = 'ADM'#13#10'N/A'
        Text4.Alignment = taCenter
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -19
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentHorz = 40
        Text4.IndentVert = 16
        Text4.Value = 'CDM'#13#10'N/A'
        Text4.WordWrap = True
        OnClick = dxtciOFFRE_A_RELANCERClick
      end
      object dxtciTARIF_ST0: TdxTileControlItem
        GroupIndex = 5
        IndexInGroup = 2
        Size = tcisLarge
        Style.GradientBeginColor = 16751932
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Tarifs en cours'#13#10'Date de validit'#233
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.Alignment = taCenter
        Text3.AssignedValues = [avColor, avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = 9934847
        Text3.Font.Height = -19
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentHorz = 40
        Text3.Value = '< j'#13#10'N/A'
        Text3.WordWrap = True
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -19
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentHorz = 40
        Text4.Value = '> j'#13#10'N/A'
        OnClick = dxtciTARIF_ST0Click
      end
      object dxtciTARIF_ST1: TdxTileControlItem
        GroupIndex = 5
        IndexInGroup = 3
        Style.GradientBeginColor = 16751932
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Tarifs '#224' p'#233'rimer'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciTARIF_ST1Click
      end
      object dxtciCOMMAListe: TdxTileControlItem
        GroupIndex = 0
        IndexInGroup = 0
        Size = tcisLarge
        Style.GradientBeginColor = 11303515
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'ARC'#13#10#224' '#233'mettre'
        Text2.Align = oaTopRight
        Text2.Alignment = taRightJustify
        Text2.AssignedValues = [avFont]
        Text2.Font.Charset = DEFAULT_CHARSET
        Text2.Font.Color = clDefault
        Text2.Font.Height = -12
        Text2.Font.Name = 'Tahoma'
        Text2.Font.Style = [fsBold]
        Text2.IndentHorz = 10
        Text2.IndentVert = 55
        Text2.Value = '                              En attente de validation'#13#10#13#10'N'
        Text2.WordWrap = True
        Text3.Align = oaBottomLeft
        Text3.AssignedValues = [avTextColor, avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = clDefault
        Text3.Font.Height = -16
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentHorz = 10
        Text3.Value = '> 5j'#13#10'N'
        Text3.TextColor = 9934847
        Text4.Alignment = taCenter
        Text4.AssignedValues = [avTextColor, avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -16
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Pitch = fpFixed
        Text4.Font.Style = []
        Text4.IndentHorz = 140
        Text4.Value = 'En cours '#13#10' <= 5j'#13#10'N'
        Text4.WordWrap = True
        OnClick = dxtciCOMMAListeClick
      end
      object dxtciAVMADListe: TdxTileControlItem
        Glyph.Align = oaMiddleCenter
        Glyph.Image.SourceHeight = 36
        Glyph.Image.SourceWidth = 36
        Glyph.IndentHorz = 0
        Glyph.IndentVert = 0
        GroupIndex = 1
        IndexInGroup = 0
        Style.GradientBeginColor = 11303515
        OptionsAnimate.AnimateText = True
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Avis MAD'#13#10#224' envoyer'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.Align = oaBottomRight
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentHorz = 15
        Text4.Value = 'N/A'
        OnClick = dxtciAVMADListeClick
      end
      object dxtciPPECHProdRetard: TdxTileControlItem
        DetailOptions.Caption = 'Ech'#233'ances Production en retard'
        DetailOptions.DetailControl = pnlPPECHProdRetard
        DetailOptions.ShowTab = True
        GroupIndex = 0
        IndexInGroup = 3
        Size = tcisLarge
        Style.GradientBeginColor = 11303515
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = #201'ch'#233'ances '#13#10'non couvertes '#224' date'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.Alignment = taCenter
        Text3.AssignedValues = [avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = clDefault
        Text3.Font.Height = -19
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentHorz = 40
        Text3.Value = 'MTO'#13#10'N/A'
        Text3.WordWrap = True
        Text4.Alignment = taCenter
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -19
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentHorz = 40
        Text4.Value = 'MTS'#13#10'N/A'
        Text4.WordWrap = True
        OnClick = dxtciPPECHProdRetardClick
      end
      object dxtciPOCDE_BLK: TdxTileControlItem
        GroupIndex = 1
        IndexInGroup = 2
        Size = tcisLarge
        Style.GradientBeginColor = 11303515
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Commandes bloqu'#233'es'
        Text1.WordWrap = True
        Text2.Align = oaBottomLeft
        Text2.Alignment = taCenter
        Text2.AssignedValues = [avFont]
        Text2.Font.Charset = DEFAULT_CHARSET
        Text2.Font.Color = 9934847
        Text2.Font.Height = -19
        Text2.Font.Name = 'Tahoma'
        Text2.Font.Style = []
        Text2.IndentHorz = 20
        Text2.IndentVert = 16
        Text2.Value = 'DDL'#13#10'N/A'
        Text2.WordWrap = True
        Text3.Align = oaBottomCenter
        Text3.Alignment = taCenter
        Text3.AssignedValues = [avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = 8454143
        Text3.Font.Height = -19
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentVert = 16
        Text3.Value = 'DDF MTO'#13#10'N/A'
        Text3.WordWrap = True
        Text4.Align = oaBottomRight
        Text4.Alignment = taCenter
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -19
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentHorz = 12
        Text4.IndentVert = 16
        Text4.Value = 'Autres '#13#10'N/A'
        Text4.WordWrap = True
        OnClick = dxtciPOCDE_BLKClick
      end
      object dxtciPPECHASolderListe: TdxTileControlItem
        DetailOptions.Caption = 'Ech'#233'ances '#224' solder'
        DetailOptions.DetailControl = pnlPPECHASolder
        DetailOptions.ShowTab = True
        GroupIndex = 1
        IndexInGroup = 4
        Style.GradientBeginColor = 11303515
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = #201'ch'#233'ances '#13#10#224' solder'
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciPPECHASolderListeClick
      end
      object dxtciPOCDE_DECOR: TdxTileControlItem
        DetailOptions.Caption = 'Lots supports '#224' attacher sur postes d'#233'cor'
        DetailOptions.DetailControl = pnlPOCDE_DECOR
        DetailOptions.ShowTab = True
        GroupIndex = 1
        IndexInGroup = 1
        Style.GradientBeginColor = 11303515
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -16
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Lots supports '#224' attacher sur postes d'#233'cor'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avTextColor, avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        Text4.TextColor = 9934847
        OnClick = dxtciPOCDE_DECORClick
      end
      object dxtciDDL_A_CREER: TdxTileControlItem
        GroupIndex = 2
        IndexInGroup = 1
        RowCount = 2
        Style.GradientBeginColor = 11892869
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'DDL '#13#10#224' cr'#233'er'
        Text1.WordWrap = True
        Text2.Align = oaBottomCenter
        Text2.Alignment = taCenter
        Text2.AssignedValues = [avFont]
        Text2.Font.Charset = DEFAULT_CHARSET
        Text2.Font.Color = 8454143
        Text2.Font.Height = -37
        Text2.Font.Name = 'Tahoma'
        Text2.Font.Style = []
        Text2.IndentVert = 64
        Text2.Value = 'N/A'
        Text3.Align = oaBottomCenter
        Text3.Alignment = taCenter
        Text3.AssignedValues = [avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = 9934847
        Text3.Font.Height = -37
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentVert = 120
        Text3.Value = 'N/A'
        Text4.Align = oaBottomCenter
        Text4.Alignment = taCenter
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = 9961372
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciDDL_A_CREERClick
      end
      object dxtciCADEN_PPECH: TdxTileControlItem
        GroupIndex = 2
        IndexInGroup = 0
        Size = tcisLarge
        Style.GradientBeginColor = 11892869
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = ANSI_CHARSET
        Text1.Font.Color = clWhite
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Calendrier de livraison'
        Text2.Align = oaMiddleCenter
        Text2.Alignment = taCenter
        Text2.AssignedValues = [avTextColor, avFont]
        Text2.Font.Charset = ANSI_CHARSET
        Text2.Font.Color = clDefault
        Text2.Font.Height = -13
        Text2.Font.Name = 'Tahoma'
        Text2.Font.Style = [fsBold]
        Text2.IndentHorz = 20
        Text2.IndentVert = 0
        Text2.Value = 'Solde '#224' modifier/Date d'#233'pass'#233'e'
        Text3.Align = oaBottomLeft
        Text3.AssignedValues = [avFont]
        Text3.Font.Charset = ANSI_CHARSET
        Text3.Font.Color = clDefault
        Text3.Font.Height = -35
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentHorz = 30
        Text3.Value = 'N/A'
        Text4.Align = oaBottomRight
        Text4.Alignment = taCenter
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = ANSI_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentHorz = 30
        Text4.Value = 'N/A'
        OnClick = dxtciCADEN_PPECHClick
      end
      object dxtciDEEXP_ST_0: TdxTileControlItem
        GroupIndex = 2
        IndexInGroup = 2
        Style.GradientBeginColor = 11892869
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -16
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'DDL'#13#10'En cours'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciDEEXP_ST_0Click
      end
      object dxtciDEEXP_ST_2: TdxTileControlItem
        GroupIndex = 2
        IndexInGroup = 3
        Style.GradientBeginColor = 11892869
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -16
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'DDL'#13#10'non charg'#233'es'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avTextColor, avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        Text4.TextColor = 9934847
        OnClick = dxtciDEEXP_ST_2Click
      end
      object dxtciDEEXP_ANOMA: TdxTileControlItem
        GroupIndex = 2
        IndexInGroup = 4
        Size = tcisLarge
        Style.GradientBeginColor = 11892869
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'DDL Anomalies ADM'
        Text1.WordWrap = True
        Text2.Align = oaMiddleCenter
        Text2.Alignment = taCenter
        Text2.AssignedValues = [avFont]
        Text2.Font.Charset = ANSI_CHARSET
        Text2.Font.Color = clDefault
        Text2.Font.Height = -16
        Text2.Font.Name = 'Tahoma'
        Text2.Font.Style = []
        Text2.Value = 'A traiter          Trait'#233'e'
        Text3.AssignedValues = [avFont]
        Text3.Font.Charset = ANSI_CHARSET
        Text3.Font.Color = clDefault
        Text3.Font.Height = -37
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentHorz = 30
        Text3.Value = 'N/A'
        Text4.Align = oaBottomRight
        Text4.AssignedValues = [avTextColor, avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentHorz = 30
        Text4.Value = 'N/A'
        OnClick = dxtciDEEXP_ANOMAClick
      end
      object dxtciFACTU_AVOIR: TdxTileControlItem
        GroupIndex = 3
        IndexInGroup = 1
        Style.GradientBeginColor = 7442412
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Factures / Avoirs '#224' '#233'mettre'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clRed
        Text4.Font.Height = -30
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciFACTU_AVOIRClick
      end
      object dxtciFCMNT_A_FACT: TdxTileControlItem
        GroupIndex = 3
        IndexInGroup = 6
        Style.GradientBeginColor = 7442412
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Factures financement'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        Text4.WordWrap = True
        OnClick = dxtciFCMNT_A_FACTClick
      end
      object dxtcAVOIRS_A_VALIDER: TdxTileControlItem
        GroupIndex = 3
        IndexInGroup = 2
        Style.GradientBeginColor = 7442412
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Avoirs '#224' valider'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clRed
        Text4.Font.Height = -30
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtcAVOIRS_A_VALIDERClick
      end
      object dxtciPPECHAFaderListe: TdxTileControlItem
        DetailOptions.Caption = #201'ch'#233'ances '#224' fader'
        DetailOptions.DetailControl = pnlPPECHAFader
        DetailOptions.ShowTab = True
        GroupIndex = 3
        IndexInGroup = 5
        Size = tcisLarge
        Style.GradientBeginColor = 7442412
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = #201'ch'#233'ances '#224' fader'#13#10'ce mois'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.Alignment = taCenter
        Text3.AssignedValues = [avTextColor, avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = clDefault
        Text3.Font.Height = -37
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentHorz = 30
        Text3.Value = 'N/A'
        Text3.TextColor = clRed
        Text3.WordWrap = True
        Text4.Alignment = taCenter
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentHorz = 30
        Text4.Value = 'N/A'
        Text4.WordWrap = True
        OnClick = dxtciPPECHAFaderListeClick
      end
      object dxtciNFSTK_ST0: TdxTileControlItem
        GroupIndex = 4
        IndexInGroup = 0
        Style.GradientBeginColor = clMedGray
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -15
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = [fsBold]
        Text1.Value = 'Notif. frais de stockage'#13#10#224' envoyer'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -33
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        Text4.WordWrap = True
        OnClick = dxtciNFSTK_ST0Click
      end
      object dxtciESN1A_ST0: TdxTileControlItem
        GroupIndex = 4
        IndexInGroup = 1
        Style.GradientBeginColor = clMedGray
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -15
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = [fsBold]
        Text1.Value = #201'tats de stocks '#224' envoyer'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -33
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        Text4.WordWrap = True
        OnClick = dxtciESN1A_ST0Click
      end
      object dxtciESN1A_ST1: TdxTileControlItem
        GroupIndex = 4
        IndexInGroup = 2
        Style.GradientBeginColor = clMedGray
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = #201'tats de stocks'#13#10#224' facturer'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avTextColor, avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -33
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        Text4.TextColor = clRed
        Text4.WordWrap = True
        OnClick = dxtciESN1A_ST1Click
      end
      object dxtciSTOCKS_2ANS: TdxTileControlItem
        DetailOptions.Caption = 'Stocks > 2 ans'
        GroupIndex = 4
        IndexInGroup = 3
        Size = tcisLarge
        Style.GradientBeginColor = clMedGray
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Relance stocks dormants'
        Text1.WordWrap = True
        Text2.Align = oaBottomLeft
        Text2.Alignment = taCenter
        Text2.AssignedValues = [avFont]
        Text2.Font.Charset = DEFAULT_CHARSET
        Text2.Font.Color = clDefault
        Text2.Font.Height = -19
        Text2.Font.Name = 'Tahoma'
        Text2.Font.Style = []
        Text2.IndentHorz = 2
        Text2.IndentVert = 20
        Text2.Value = '> M22'#13#10'N/A'
        Text3.Align = oaBottomCenter
        Text3.Alignment = taCenter
        Text3.AssignedValues = [avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = clDefault
        Text3.Font.Height = -19
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentHorz = 1
        Text3.IndentVert = 20
        Text3.Value = 'R1 / R2'#13#10'   N/A'
        Text3.WordWrap = True
        Text4.Align = oaBottomRight
        Text4.Alignment = taCenter
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -19
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentHorz = 20
        Text4.IndentVert = 20
        Text4.Value = 'Fin'#13#10'N/A'
        Text4.WordWrap = True
        OnClick = dxtciSTOCKS_2ANSClick
      end
      object dxtciDDF_ECHANT: TdxTileControlItem
        DetailOptions.Caption = #201'chantillonnage verrier '#224' venir'
        DetailOptions.DetailControl = pnlDDF_ECHANT
        DetailOptions.ShowTab = True
        GroupIndex = 6
        IndexInGroup = 0
        Size = tcisLarge
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = #201'chantillonnage verrier '#224' venir'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciDDF_ECHANTClick
      end
      object dxtciDMBAT_TYPE0: TdxTileControlItem
        DetailOptions.Caption = 'BAT Papier '#224' venir'
        DetailOptions.DetailControl = pnlDMBAT_TYPE0
        DetailOptions.ShowTab = True
        GroupIndex = 6
        IndexInGroup = 1
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -16
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'BAT Papier '#224' venir'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciDMBAT_TYPE0Click
      end
      object dxtciDMBAT_TYPE1: TdxTileControlItem
        DetailOptions.Caption = 'BAT Verre '#224' venir'
        DetailOptions.DetailControl = pnlDMBAT_TYPE1
        DetailOptions.ShowTab = True
        GroupIndex = 6
        IndexInGroup = 2
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -16
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'BAT Verre '#224' venir'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciDMBAT_TYPE1Click
      end
      object dxtciBOLIV_A_FACT: TdxTileControlItem
        GroupIndex = 3
        IndexInGroup = 4
        Style.GradientBeginColor = 7442412
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'BL '#224' facturer'
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciBOLIV_A_FACTClick
      end
      object dxtciTARIF_ANOMALIE: TdxTileControlItem
        DetailOptions.Caption = 'Pdt en anomalie sur Tarif'
        DetailOptions.DetailControl = pnlTARIF_ANOMALIE
        DetailOptions.ShowTab = True
        GroupIndex = 5
        IndexInGroup = 4
        Style.GradientBeginColor = 16751932
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Segoe UI'
        Text1.Font.Style = []
        Text1.Value = 'Pdt en anomalie sur Tarif'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Segoe UI'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciTARIF_ANOMALIEClick
      end
      object dxtciDAMCC: TdxTileControlItem
        GroupIndex = 1
        IndexInGroup = 3
        Size = tcisLarge
        Style.GradientBeginColor = 11303515
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = ANSI_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Demande d'#39'annulation '#13#10'de commande'
        Text2.Align = oaBottomLeft
        Text2.AssignedValues = [avFont]
        Text2.Font.Charset = DEFAULT_CHARSET
        Text2.Font.Color = 9934847
        Text2.Font.Height = -15
        Text2.Font.Name = 'Segoe UI'
        Text2.Font.Style = []
        Text2.Value = 'EC/Emis'#13#10'   N/A'
        Text3.Align = oaBottomCenter
        Text3.AssignedValues = [avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = 8454143
        Text3.Font.Height = -15
        Text3.Font.Name = 'Segoe UI'
        Text3.Font.Style = []
        Text3.Value = 'ACCEPTEE'#13#10'     N/A'
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -15
        Text4.Font.Name = 'Segoe UI'
        Text4.Font.Style = []
        Text4.Value = 'REFUSEE'#13#10'    N/A'
        OnClick = dxtciDAMCCClick
      end
      object dxtciARC_Discussion: TdxTileControlItem
        DetailOptions.Caption = 'ACRC '#13#10' A traiter '
        GroupIndex = 0
        IndexInGroup = 2
        Size = tcisLarge
        Style.GradientBeginColor = 11303515
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'ARC '#224'  traiter '
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.Alignment = taCenter
        Text3.AssignedValues = [avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = clDefault
        Text3.Font.Height = -16
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentHorz = 8
        Text3.IndentVert = 18
        Text3.Value = 'Par GDCP '#13#10'N/A'
        Text3.WordWrap = True
        Text4.Align = oaBottomRight
        Text4.Alignment = taCenter
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -16
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentVert = 18
        Text4.Value = 'Par ADM '#13#10'N/A'
        Text4.WordWrap = True
        OnClick = dxtciARC_DiscussionClick
      end
      object dxtciECH_EN_COURS: TdxTileControlItem
        DetailOptions.Caption = 'Demandes '#233'chantillons en cours'
        GroupIndex = 2
        IndexInGroup = 5
        Size = tcisLarge
        Style.GradientBeginColor = 11892869
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -19
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = []
        Text1.Value = 'Demande '#233'chantillons en cours'
        Text1.WordWrap = True
        Text2.AssignedValues = [avFont]
        Text2.Font.Charset = DEFAULT_CHARSET
        Text2.Font.Color = clDefault
        Text2.Font.Height = -19
        Text2.Font.Name = 'Tahoma'
        Text2.Font.Style = []
        Text3.Alignment = taCenter
        Text3.AssignedValues = [avColor, avFont]
        Text3.Font.Charset = DEFAULT_CHARSET
        Text3.Font.Color = clRed
        Text3.Font.Height = -37
        Text3.Font.Name = 'Tahoma'
        Text3.Font.Style = []
        Text3.IndentHorz = 30
        Text3.Value = 'N/A'
        Text4.Alignment = taCenter
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.IndentHorz = 30
        Text4.Value = 'N/A'
        OnClick = dxtciECH_EN_COURSClick
      end
      object dxtciFACTU_AVOIR_CF_PA: TdxTileControlItem
        GroupIndex = 3
        IndexInGroup = 0
        Size = tcisLarge
        Style.GradientBeginColor = 7442412
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -15
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = [fsBold]
        Text1.Value = 'Factures/avoirs non conformes PA'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clRed
        Text4.Font.Height = -30
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtciFACTU_AVOIR_CF_PAClick
      end
      object dxtcFACTU_ACOMPTE: TdxTileControlItem
        GroupIndex = 3
        IndexInGroup = 3
        Style.GradientBeginColor = 7442412
        Text1.Align = oaTopCenter
        Text1.Alignment = taCenter
        Text1.AssignedValues = [avFont]
        Text1.Font.Charset = DEFAULT_CHARSET
        Text1.Font.Color = clDefault
        Text1.Font.Height = -15
        Text1.Font.Name = 'Tahoma'
        Text1.Font.Style = [fsBold]
        Text1.Value = 'Factures d'#39'acompte '#224' annuler'
        Text1.WordWrap = True
        Text2.AssignedValues = []
        Text3.AssignedValues = []
        Text4.AssignedValues = [avFont]
        Text4.Font.Charset = DEFAULT_CHARSET
        Text4.Font.Color = clDefault
        Text4.Font.Height = -37
        Text4.Font.Name = 'Tahoma'
        Text4.Font.Style = []
        Text4.Value = 'N/A'
        OnClick = dxtcFACTU_ACOMPTEClick
      end
    end
    object pnlBoutons: TPanel
      Left = 1
      Top = 1
      Width = 1914
      Height = 77
      Align = alTop
      TabOrder = 0
      DesignSize = (
        1914
        77)
      object btnRecherche: TSpeedButton
        Left = 1722
        Top = 2
        Width = 40
        Height = 40
        Hint = 'Lancer la recherche'
        Anchors = [akTop, akRight]
        Caption = 'REC'
        Flat = True
        ParentShowHint = False
        ShowHint = True
        OnClick = btnRechercheClick
        ExplicitLeft = 1573
      end
      object btnQuitter: TSpeedButton
        Left = 4
        Top = 8
        Width = 40
        Height = 40
        Hint = 'Quitter la liste'
        Caption = 'QUI'
        Enabled = False
        Flat = True
        ParentShowHint = False
        ShowHint = True
        OnClick = btnQuitterClick
      end
      object lblADM_COLLA: TLabel
        Left = 60
        Top = 9
        Width = 22
        Height = 13
        Margins.Left = 5
        Margins.Top = 5
        Margins.Right = 5
        Margins.Bottom = 5
        Caption = 'ADM'
        Transparent = True
      end
      object lblCDM_COLLA: TLabel
        Left = 403
        Top = 9
        Width = 22
        Height = 13
        Margins.Left = 5
        Margins.Top = 5
        Margins.Right = 5
        Margins.Bottom = 5
        Caption = 'CDM'
        Transparent = True
      end
      object lblRZA_COLLA: TLabel
        Left = 60
        Top = 32
        Width = 20
        Height = 13
        Margins.Left = 5
        Margins.Top = 5
        Margins.Right = 5
        Margins.Bottom = 5
        Caption = 'RZA'
        Transparent = True
      end
      object lblRZC_COLLA: TLabel
        Left = 403
        Top = 32
        Width = 20
        Height = 13
        Margins.Left = 5
        Margins.Top = 5
        Margins.Right = 5
        Margins.Bottom = 5
        Caption = 'RZC'
        Transparent = True
      end
      object lblTIERS: TLabel
        Left = 750
        Top = 10
        Width = 23
        Height = 13
        Margins.Left = 5
        Margins.Top = 5
        Margins.Right = 5
        Margins.Bottom = 5
        Caption = 'Tiers'
        Transparent = True
      end
      object lblZOCOM: TLabel
        Left = 750
        Top = 33
        Width = 92
        Height = 13
        Margins.Left = 5
        Margins.Top = 5
        Margins.Right = 5
        Margins.Bottom = 5
        Caption = 'Secteur commercial'
        Transparent = True
      end
      object btnExportExcel: TSpeedButton
        Left = 1663
        Top = 0
        Width = 40
        Height = 40
        Hint = 'Export Excel des tuiles s'#233'lectionn'#233'es'
        Anchors = [akTop, akRight]
        Caption = 'XCL'
        Flat = True
        ParentShowHint = False
        ShowHint = True
        OnClick = btnExportExcelClick
        ExplicitLeft = 1535
      end
      object Export_ProgressBar: TAdvProgressBar
        Left = 1303
        Top = 26
        Width = 340
        Height = 18
        Anchors = [akTop, akRight]
        Animated = True
        BorderColor = 11250603
        Font.Charset = DEFAULT_CHARSET
        Font.Color = clWindowText
        Font.Height = -13
        Font.Name = 'Verdana'
        Font.Style = []
        Level0ColorTo = 14811105
        Level1ColorTo = 13303807
        Level2Color = 5483007
        Level2ColorTo = 11064319
        Level3ColorTo = 13290239
        Level1Perc = 70
        Level2Perc = 90
        Position = 0
        Rounded = False
        ShowBorder = True
        ShowGradient = False
        Steps = 20
        Version = '1.4.0.3'
        Visible = False
        ExplicitLeft = 1304
      end
      object lblDirVen: TLabel
        Left = 750
        Top = 48
        Width = 97
        Height = 26
        Caption = 'Dir. Ventes Secteur/'#13#10'Head Sales'
        Transparent = True
      end
      object edtADM_COLLA_TRIG: TEdit
        Left = 109
        Top = 5
        Width = 50
        Height = 21
        MaxLength = 5
        TabOrder = 0
        OnKeyDown = edtADM_COLLA_TRIGKeyDown
      end
      object edtADM_COLLA_NOM: TEdit
        Left = 161
        Top = 5
        Width = 101
        Height = 21
        MaxLength = 50
        TabOrder = 1
        OnKeyDown = edtADM_COLLA_TRIGKeyDown
      end
      object btnADM_COLLA: TBitBtn
        Left = 367
        Top = 6
        Width = 20
        Height = 20
        Caption = '...'
        TabOrder = 2
        TabStop = False
        OnClick = btnADM_COLLAClick
      end
      object edtADM_COLLA_ID: TEdit
        Left = 94
        Top = 5
        Width = 13
        Height = 21
        Color = clGray
        TabOrder = 3
        Visible = False
      end
      object edtADM_COLLA_PRENOM: TEdit
        Left = 264
        Top = 5
        Width = 101
        Height = 21
        MaxLength = 50
        TabOrder = 4
        OnKeyDown = edtADM_COLLA_TRIGKeyDown
      end
      object edtCDM_COLLA_ID: TEdit
        Left = 437
        Top = 5
        Width = 13
        Height = 21
        Color = clGray
        TabOrder = 5
        Visible = False
      end
      object edtCDM_COLLA_TRIG: TEdit
        Left = 452
        Top = 5
        Width = 50
        Height = 21
        MaxLength = 5
        TabOrder = 6
        OnKeyDown = edtCDM_COLLA_TRIGKeyDown
      end
      object edtCDM_COLLA_NOM: TEdit
        Left = 504
        Top = 5
        Width = 101
        Height = 21
        MaxLength = 50
        TabOrder = 7
        OnKeyDown = edtCDM_COLLA_TRIGKeyDown
      end
      object edtCDM_COLLA_PRENOM: TEdit
        Left = 607
        Top = 5
        Width = 101
        Height = 21
        MaxLength = 50
        TabOrder = 8
        OnKeyDown = edtCDM_COLLA_TRIGKeyDown
      end
      object btnCDM_COLLA: TBitBtn
        Left = 710
        Top = 6
        Width = 20
        Height = 20
        Caption = '...'
        TabOrder = 9
        TabStop = False
        OnClick = btnCDM_COLLAClick
      end
      object edtRZA_COLLA_TRIG: TEdit
        Left = 109
        Top = 28
        Width = 50
        Height = 21
        MaxLength = 5
        TabOrder = 10
        OnKeyDown = edtRZA_COLLA_TRIGKeyDown
      end
      object edtRZA_COLLA_NOM: TEdit
        Left = 161
        Top = 28
        Width = 101
        Height = 21
        MaxLength = 50
        TabOrder = 11
        OnKeyDown = edtRZA_COLLA_TRIGKeyDown
      end
      object btnRZA_COLLA: TBitBtn
        Left = 367
        Top = 28
        Width = 20
        Height = 20
        Caption = '...'
        TabOrder = 12
        TabStop = False
        OnClick = btnRZA_COLLAClick
      end
      object edtRZA_COLLA_ID: TEdit
        Left = 94
        Top = 28
        Width = 13
        Height = 21
        Color = clGray
        TabOrder = 13
        Visible = False
      end
      object edtRZA_COLLA_PRENOM: TEdit
        Left = 264
        Top = 28
        Width = 101
        Height = 21
        MaxLength = 50
        TabOrder = 14
        OnKeyDown = edtRZA_COLLA_TRIGKeyDown
      end
      object edtRZC_COLLA_ID: TEdit
        Left = 437
        Top = 28
        Width = 13
        Height = 21
        Color = clGray
        TabOrder = 15
        Visible = False
      end
      object edtRZC_COLLA_TRIG: TEdit
        Left = 452
        Top = 28
        Width = 50
        Height = 21
        MaxLength = 5
        TabOrder = 16
        OnKeyDown = edtRZC_COLLA_TRIGKeyDown
      end
      object edtRZC_COLLA_NOM: TEdit
        Left = 504
        Top = 28
        Width = 101
        Height = 21
        MaxLength = 50
        TabOrder = 17
        OnKeyDown = edtRZC_COLLA_TRIGKeyDown
      end
      object edtRZC_COLLA_PRENOM: TEdit
        Left = 607
        Top = 28
        Width = 101
        Height = 21
        MaxLength = 50
        TabOrder = 18
        OnKeyDown = edtRZC_COLLA_TRIGKeyDown
      end
      object btnRZC_COLLA: TBitBtn
        Left = 710
        Top = 29
        Width = 20
        Height = 20
        Caption = '...'
        TabOrder = 19
        TabStop = False
        OnClick = btnRZC_COLLAClick
      end
      object edtTIERS_CODE: TEdit
        Left = 864
        Top = 5
        Width = 80
        Height = 21
        MaxLength = 10
        TabOrder = 20
        OnKeyDown = edtTIERS_CODEKeyDown
      end
      object edtTIERS_RS_L1: TEdit
        Left = 946
        Top = 5
        Width = 216
        Height = 21
        MaxLength = 50
        TabOrder = 21
        OnKeyDown = edtTIERS_RS_L1KeyDown
      end
      object btnTIERS: TBitBtn
        Left = 1162
        Top = 6
        Width = 21
        Height = 20
        Caption = '...'
        Font.Charset = DEFAULT_CHARSET
        Font.Color = clWindowText
        Font.Height = -11
        Font.Name = 'Tahoma'
        Font.Style = []
        ParentFont = False
        TabOrder = 22
        TabStop = False
        OnClick = btnTIERSClick
      end
      object edtTIERS_ID: TEdit
        Left = 808
        Top = 4
        Width = 16
        Height = 21
        Color = clGray
        TabOrder = 23
        Visible = False
      end
      object edtZOCOM_ID: TEdit
        Left = 838
        Top = 29
        Width = 16
        Height = 21
        TabStop = False
        Color = clGray
        MaxLength = 50
        TabOrder = 24
        Visible = False
      end
      object edtZOCOM_DES: TEdit
        Left = 864
        Top = 29
        Width = 212
        Height = 21
        MaxLength = 50
        TabOrder = 25
        OnKeyDown = edtZOCOM_DESKeyDown
      end
      object btnZOCOM: TBitBtn
        Left = 1081
        Top = 29
        Width = 20
        Height = 20
        Caption = '...'
        TabOrder = 26
        TabStop = False
        OnClick = btnZOCOMClick
      end
      object edtDirVen_TRIG: TEdit
        Left = 864
        Top = 53
        Width = 58
        Height = 21
        CharCase = ecUpperCase
        MaxLength = 50
        TabOrder = 27
        OnKeyDown = edtDirVen_TRIGKeyDown
      end
      object edtDirVen_NOM_PRENOM: TEdit
        Left = 923
        Top = 53
        Width = 158
        Height = 21
        MaxLength = 50
        TabOrder = 28
        OnKeyDown = edtDirVen_NOM_PRENOMKeyDown
      end
      object btnDirVen: TBitBtn
        Left = 1086
        Top = 54
        Width = 20
        Height = 20
        Caption = '...'
        Font.Charset = DEFAULT_CHARSET
        Font.Color = clWindowText
        Font.Height = -11
        Font.Name = 'Tahoma'
        Font.Style = []
        ParentFont = False
        TabOrder = 29
        TabStop = False
        OnClick = btnDirVenClick
      end
      object edtDirVen_ID: TEdit
        Left = 845
        Top = 56
        Width = 14
        Height = 21
        TabStop = False
        Color = clGrayText
        MaxLength = 50
        TabOrder = 30
        Visible = False
      end
    end
    object cxPageControl1: TcxPageControl
      Left = 1
      Top = 828
      Width = 1914
      Height = 195
      Align = alBottom
      TabOrder = 2
      Visible = False
      Properties.ActivePage = tbsPPECHProdRetard
      Properties.CustomButtons.Buttons = <>
      ClientRectBottom = 191
      ClientRectLeft = 4
      ClientRectRight = 1910
      ClientRectTop = 24
      object tbsPPECHProdRetard: TcxTabSheet
        Caption = 'tbsPPECHProdRetard'
        ImageIndex = 1
        object pnlPPECHProdRetard: TPanel
          AlignWithMargins = True
          Left = 3
          Top = 3
          Width = 1900
          Height = 161
          Align = alClient
          BevelOuter = bvNone
          Caption = 'pnlPPECHDateDepartDepasseeListe'
          TabOrder = 0
          object dxBarDockControl2: TdxBarDockControl
            Left = 0
            Top = 0
            Width = 1900
            Height = 34
            Align = dalTop
            BarManager = bmBars
          end
          object dxdgPPECHProdRetard: TcxGrid
            Left = 0
            Top = 34
            Width = 1900
            Height = 127
            Align = alClient
            Font.Charset = DEFAULT_CHARSET
            Font.Color = clWindowText
            Font.Height = -12
            Font.Name = 'Tahoma'
            Font.Style = []
            ParentFont = False
            PopupMenu = frmMain.GridPopUp
            TabOrder = 1
            LookAndFeel.NativeStyle = False
            LookAndFeel.ScrollbarMode = sbmClassic
            LookAndFeel.SkinName = ''
            object cxgtvPPECHProdRetard: TcxGridDBTableView
              DataController.DataModeController.SmartRefresh = True
              DataController.DataSource = dsPPECHProdRetard
              DataController.Filter.Options = [fcoCaseInsensitive]
              DataController.KeyFieldNames = 'PPECH_ID'
              DataController.Summary.FooterSummaryItems = <
                item
                  Kind = skCount
                end
                item
                  Format = '%d'
                  Kind = skCount
                  Column = cxgtvPPECHProdRetardCOMMA_ID
                end
                item
                  Kind = skCount
                  FieldName = 'PPECH_ID'
                  Column = cxgtvPPECHProdRetardPPECH_ID
                end>
              DataController.Summary.SummaryGroups = <
                item
                  Links = <
                    item
                    end
                    item
                    end
                    item
                    end>
                  SummaryItems = <
                    item
                      Format = '# tasks'
                      Kind = skCount
                    end>
                end>
              OptionsBehavior.CellHints = True
              OptionsCustomize.ColumnsQuickCustomization = True
              OptionsData.CancelOnExit = False
              OptionsData.Deleting = False
              OptionsData.DeletingConfirmation = False
              OptionsData.Editing = False
              OptionsData.Inserting = False
              OptionsSelection.CellSelect = False
              OptionsSelection.CheckBoxPosition = cbpIndicator
              OptionsSelection.HideFocusRectOnExit = False
              OptionsSelection.UnselectFocusedRecordOnExit = False
              OptionsView.CellEndEllipsis = True
              OptionsView.FocusRect = False
              OptionsView.CellTextMaxLineCount = 3
              OptionsView.GroupByBox = False
              OptionsView.HeaderAutoHeight = True
              OptionsView.HeaderFilterButtonShowMode = fbmButton
              OptionsView.Indicator = True
              Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral
              object cxgtvPPECHProdRetardCOMMA_ID: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_ID'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
                Width = 99
              end
              object cxgtvPPECHProdRetardCOMMA_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_NUM'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
                Width = 121
              end
              object cxgtvPPECHProdRetardCOMMA_VERSI: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_VERSI'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
                Width = 102
              end
              object cxgtvPPECHProdRetardCOMMA_ST: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_ST'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
                Width = 96
              end
              object cxgtvPPECHProdRetardPOCDE_ID: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_ID'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
                Width = 97
              end
              object cxgtvPPECHProdRetardPOCDE_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_NUM'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
                Width = 81
              end
              object cxgtvPPECHProdRetardPOCDE_TYP_POSTE: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_TYP_POSTE'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHProdRetardPOCDE_REF: TcxGridDBColumn
                Caption = 'R'#233'f. Poste Commande'
                DataBinding.FieldName = 'POCDE_REF'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 85
              end
              object cxgtvPPECHProdRetardCOMMA_ST_DES: TcxGridDBColumn
                Caption = 'Statut Commande'
                DataBinding.FieldName = 'COMMA_ST_DES'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 85
              end
              object cxgtvPPECHProdRetardPOCDE_TYP_POSTE_DES: TcxGridDBColumn
                Caption = 'Type de poste'
                DataBinding.FieldName = 'POCDE_TYP_POSTE_DES'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvPPECHProdRetardPPECH_ID: TcxGridDBColumn
                Caption = 'Num. '#201'ch'#233'ance'
                DataBinding.FieldName = 'PPECH_ID'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 85
              end
              object cxgtvPPECHProdRetardPPECH_DATE: TcxGridDBColumn
                Caption = 'Date MAD d'#233'part'
                DataBinding.FieldName = 'PPECH_DATE'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                SortIndex = 0
                SortOrder = soAscending
              end
              object cxgtvPPECHProdRetardDMDAP_DATE_VALIDITE: TcxGridDBColumn
                DataBinding.FieldName = 'DMDAP_DATE_VALIDITE'
                Visible = False
                VisibleForExpressionEditor = bFalse
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHProdRetardORFAB_DATE_FAB_PREV: TcxGridDBColumn
                Caption = 'Date D'#233'but de Fab'
                DataBinding.FieldName = 'ORFAB_DATE_FAB_PREV'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 112
              end
              object cxgtvPPECHProdRetardTIERS_ID: TcxGridDBColumn
                DataBinding.FieldName = 'TIERS_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHProdRetardTIERS_CODE: TcxGridDBColumn
                Caption = 'Code Tiers'
                DataBinding.FieldName = 'TIERS_CODE'
                HeaderAlignmentHorz = taCenter
                Width = 66
              end
              object cxgtvPPECHProdRetardTIERS_RS_L1: TcxGridDBColumn
                Caption = 'Tiers'
                DataBinding.FieldName = 'TIERS_RS_L1'
                HeaderAlignmentHorz = taCenter
                Width = 199
              end
              object cxgtvPPECHProdRetardPRCDT_ID: TcxGridDBColumn
                Caption = 'Id Produit'
                DataBinding.FieldName = 'PRCDT_ID'
                GroupSummaryAlignment = taLeftJustify
                HeaderAlignmentHorz = taCenter
                Width = 74
              end
              object cxgtvPPECHProdRetardPRCDT_DES: TcxGridDBColumn
                Caption = 'Produit conditionn'#233
                DataBinding.FieldName = 'PRCDT_DES'
                HeaderAlignmentHorz = taCenter
                Width = 296
              end
              object cxgtvPPECHProdRetardPRCDT_MODE_GES: TcxGridDBColumn
                DataBinding.FieldName = 'PRCDT_MODE_GES'
                Visible = False
                VisibleForExpressionEditor = bFalse
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHProdRetardPRCDT_MODE_GES_DES: TcxGridDBColumn
                Caption = 'Mode de gestion'
                DataBinding.FieldName = 'PRCDT_MODE_GES_DES'
                HeaderAlignmentHorz = taCenter
                Width = 173
              end
              object cxgtvPPECHProdRetardADM_TRIG: TcxGridDBColumn
                Caption = 'ADM'
                DataBinding.FieldName = 'ADM_TRIG'
                FooterAlignmentHorz = taCenter
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
              end
            end
            object cxglPPECHProdRetard: TcxGridLevel
              GridView = cxgtvPPECHProdRetard
            end
          end
        end
      end
      object tbsPPECHASolder: TcxTabSheet
        Caption = 'tbsPPECHASolder'
        ImageIndex = 2
        object pnlPPECHASolder: TPanel
          Left = 0
          Top = 0
          Width = 1906
          Height = 167
          Align = alClient
          BevelOuter = bvNone
          Caption = 'pnlPPECHDateDepartDepasseeListe'
          TabOrder = 0
          object dxBarDockControl3: TdxBarDockControl
            Left = 0
            Top = 0
            Width = 1906
            Height = 34
            Align = dalTop
            BarManager = bmBars
          end
          object dxdgPPECHASolder: TcxGrid
            Left = 0
            Top = 34
            Width = 1906
            Height = 133
            Align = alClient
            Font.Charset = DEFAULT_CHARSET
            Font.Color = clWindowText
            Font.Height = -12
            Font.Name = 'Tahoma'
            Font.Style = []
            ParentFont = False
            PopupMenu = frmMain.GridPopUp
            TabOrder = 1
            LookAndFeel.NativeStyle = False
            LookAndFeel.ScrollbarMode = sbmClassic
            LookAndFeel.SkinName = ''
            object cxgtvPPECHASolder: TcxGridDBTableView
              DataController.DataModeController.SmartRefresh = True
              DataController.DataSource = dsPPECHASolder
              DataController.Filter.Options = [fcoCaseInsensitive]
              DataController.KeyFieldNames = 'PPECH_ID'
              DataController.Summary.FooterSummaryItems = <
                item
                  Kind = skCount
                end
                item
                  Format = '%d'
                  Kind = skCount
                end
                item
                  Kind = skCount
                  FieldName = 'PPECH_ID'
                end>
              DataController.Summary.SummaryGroups = <
                item
                  Links = <
                    item
                    end
                    item
                    end
                    item
                    end>
                  SummaryItems = <
                    item
                      Format = '# tasks'
                      Kind = skCount
                    end>
                end>
              OptionsBehavior.CellHints = True
              OptionsCustomize.ColumnsQuickCustomization = True
              OptionsData.CancelOnExit = False
              OptionsData.Deleting = False
              OptionsData.DeletingConfirmation = False
              OptionsData.Editing = False
              OptionsData.Inserting = False
              OptionsSelection.CellSelect = False
              OptionsSelection.CheckBoxPosition = cbpIndicator
              OptionsSelection.HideFocusRectOnExit = False
              OptionsSelection.UnselectFocusedRecordOnExit = False
              OptionsView.CellEndEllipsis = True
              OptionsView.FocusRect = False
              OptionsView.CellTextMaxLineCount = 3
              OptionsView.GroupByBox = False
              OptionsView.HeaderAutoHeight = True
              OptionsView.HeaderFilterButtonShowMode = fbmButton
              OptionsView.Indicator = True
              Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral
              object cxgtvPPECHASolderCOMMA_ID: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_ID'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHASolderCOMMA_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_NUM'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHASolderCOMMA_VERSI: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_VERSI'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHASolderPOCDE_ID: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_ID'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHASolderPOCDE_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_NUM'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHASolderPOCDE_TYP_POSTE: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_TYP_POSTE'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHASolderPOCDE_REF: TcxGridDBColumn
                Caption = 'R'#233'f. Poste Commande'
                DataBinding.FieldName = 'POCDE_REF'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 85
              end
              object cxgtvPPECHASolderTIERS_NOM: TcxGridDBColumn
                DataBinding.FieldName = 'TIERS_NOM'
                HeaderAlignmentHorz = taCenter
              end
              object cxgtvPPECHASolderCOMMA_ST: TcxGridDBColumn
                Caption = 'COMMA_ST'
                DataBinding.FieldName = 'Statut Commande'
                Visible = False
                FooterAlignmentHorz = taCenter
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
                Width = 85
              end
              object cxgtvPPECHASolderCOMMA_ST_DES: TcxGridDBColumn
                Caption = 'Statut Commande'
                DataBinding.FieldName = 'COMMA_ST_DES'
                HeaderAlignmentHorz = taCenter
                Width = 85
              end
              object cxgtvPPECHASolderPOCDE_TYP_POSTE_DES: TcxGridDBColumn
                Caption = 'Type de poste'
                DataBinding.FieldName = 'POCDE_TYP_POSTE_DES'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvPPECHASolderPPECH_ID: TcxGridDBColumn
                Caption = 'Num. '#201'ch'#233'ance'
                DataBinding.FieldName = 'PPECH_ID'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 85
              end
              object cxgtvPPECHASolderPRCDT_DES: TcxGridDBColumn
                DataBinding.FieldName = 'PRCDT_DES'
                HeaderAlignmentHorz = taCenter
              end
              object cxgtvPPECHASolderPPECH_DATE: TcxGridDBColumn
                Caption = 'Date MAD d'#233'part'
                DataBinding.FieldName = 'PPECH_DATE'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                SortIndex = 0
                SortOrder = soAscending
              end
              object cxgtvPPECHASolderPPECH_QTE_TOLER: TcxGridDBColumn
                Caption = 'Quantit'#233' '#233'ch'#233'anc'#233'e tol'#233'ranc'#233'e'
                DataBinding.FieldName = 'PPECH_QTE_TOLER'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 80
              end
              object cxgtvPPECHASolderPPECH_QTE_RESV: TcxGridDBColumn
                Caption = 'Quantit'#233' reserv'#233'e'
                DataBinding.FieldName = 'PPECH_QTE_RESV'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 80
              end
              object cxgtvPPECHASolderPPECH_QTE_CONSO: TcxGridDBColumn
                Caption = 'Quantit'#233' consomm'#233'e'
                DataBinding.FieldName = 'PPECH_QTE_CONSO'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 80
              end
              object cxgtvPPECHASolderSOLDE_A_COUVRIR: TcxGridDBColumn
                DataBinding.FieldName = 'SOLDE_A_COUVRIR'
                HeaderAlignmentHorz = taCenter
              end
              object cxgtvPPECHASolderNON_A_COUVRIR: TcxGridDBColumn
                DataBinding.FieldName = 'NON_A_COUVRIR'
                RepositoryItem = dmdSGL_DevExpress.cxGridListCenteredCheckBox
                HeaderAlignmentHorz = taCenter
              end
              object cxgtvPPECHASolderDENIER_BOLIV: TcxGridDBColumn
                Caption = 'Date dernier BL'
                DataBinding.FieldName = 'DENIER_BOLIV'
                HeaderAlignmentHorz = taCenter
              end
              object cxgtvPPECHASolderADM_COLLA_TRIG: TcxGridDBColumn
                Caption = 'ADM'
                DataBinding.FieldName = 'ADM_COLLA_TRIG'
                FooterAlignmentHorz = taCenter
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
              end
              object cxgtvPPECHASolderCDM_COLLA_TRIG: TcxGridDBColumn
                Caption = 'CDM'
                DataBinding.FieldName = 'CDM_COLLA_TRIG'
                Visible = False
                FooterAlignmentHorz = taCenter
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
              end
              object cxgtvPPECHASolderCOMMA_ST1: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_ST'
                Visible = False
              end
              object cxgtvPPECHASolderPPECH_QTE_ORI: TcxGridDBColumn
                DataBinding.FieldName = 'PPECH_QTE_ORI'
                Visible = False
              end
              object cxgtvPPECHASolderQTE_EXPEDIEE: TcxGridDBColumn
                DataBinding.FieldName = 'QTE_EXPEDIEE'
                Visible = False
              end
              object cxgtvPPECHASolderQTE_A_EXPED: TcxGridDBColumn
                DataBinding.FieldName = 'QTE_A_EXPED'
                Visible = False
              end
              object cxgtvPPECHASolderSOLDE_A_LIVRER: TcxGridDBColumn
                DataBinding.FieldName = 'SOLDE_A_LIVRER'
                Visible = False
              end
              object cxgtvPPECHASolderPOCDE_TYP_PRD: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_TYP_PRD'
                Visible = False
              end
              object TcxGridDBColumn
                DataBinding.FieldName = 'FLG_ECH_SOLDE'
              end
            end
            object cxglPPECHASolder: TcxGridLevel
              GridView = cxgtvPPECHASolder
            end
          end
        end
      end
      object tbsPPECHAFader: TcxTabSheet
        Caption = 'tbsPPECHAFader'
        ImageIndex = 4
        object pnlPPECHAFader: TPanel
          Left = 0
          Top = 0
          Width = 1906
          Height = 167
          Align = alClient
          BevelOuter = bvNone
          Caption = 'pnlPPECHDateDepartDepasseeListe'
          TabOrder = 0
          object dxBarDockControl5: TdxBarDockControl
            Left = 0
            Top = 0
            Width = 1906
            Height = 34
            Align = dalTop
            BarManager = bmBars
          end
          object dxdgPPECHAFader: TcxGrid
            Left = 0
            Top = 34
            Width = 1906
            Height = 133
            Align = alClient
            Font.Charset = DEFAULT_CHARSET
            Font.Color = clWindowText
            Font.Height = -12
            Font.Name = 'Tahoma'
            Font.Style = []
            ParentFont = False
            PopupMenu = frmMain.GridPopUp
            TabOrder = 1
            LookAndFeel.NativeStyle = False
            LookAndFeel.ScrollbarMode = sbmClassic
            LookAndFeel.SkinName = ''
            object cxgtvPPECHAFader: TcxGridDBTableView
              DataController.DataModeController.SmartRefresh = True
              DataController.DataSource = dsPPECHAFader
              DataController.Filter.Options = [fcoCaseInsensitive]
              DataController.KeyFieldNames = 'PPECH_ID'
              DataController.Summary.FooterSummaryItems = <
                item
                  Kind = skCount
                end
                item
                  Format = '%d'
                  Kind = skCount
                end
                item
                  Kind = skCount
                  FieldName = 'PPECH_ID'
                end>
              DataController.Summary.SummaryGroups = <
                item
                  Links = <
                    item
                    end
                    item
                    end
                    item
                    end>
                  SummaryItems = <
                    item
                      Format = '# tasks'
                      Kind = skCount
                    end>
                end>
              OptionsBehavior.CellHints = True
              OptionsCustomize.ColumnsQuickCustomization = True
              OptionsData.CancelOnExit = False
              OptionsData.Deleting = False
              OptionsData.DeletingConfirmation = False
              OptionsData.Editing = False
              OptionsData.Inserting = False
              OptionsSelection.CellSelect = False
              OptionsSelection.CheckBoxPosition = cbpIndicator
              OptionsSelection.HideFocusRectOnExit = False
              OptionsSelection.UnselectFocusedRecordOnExit = False
              OptionsView.CellEndEllipsis = True
              OptionsView.FocusRect = False
              OptionsView.CellTextMaxLineCount = 3
              OptionsView.GroupByBox = False
              OptionsView.HeaderAutoHeight = True
              OptionsView.HeaderFilterButtonShowMode = fbmButton
              OptionsView.Indicator = True
              Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral
              object cxgtvPPECHAFaderTIERS_ID: TcxGridDBColumn
                DataBinding.FieldName = 'TIERS_ID'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHAFaderTIERS_CODE: TcxGridDBColumn
                Caption = 'Code Tiers'
                DataBinding.FieldName = 'TIERS_CODE'
                HeaderAlignmentHorz = taCenter
                SortIndex = 1
                SortOrder = soAscending
              end
              object cxgtvPPECHAFaderTIERS_RS_L1: TcxGridDBColumn
                Caption = 'Tiers'
                DataBinding.FieldName = 'TIERS_RS_L1'
                FooterAlignmentHorz = taCenter
                HeaderAlignmentHorz = taCenter
                Width = 201
              end
              object cxgtvPPECHAFaderCOMMA_ID: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_ID'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHAFaderCOMMA_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_NUM'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHAFaderCOMMA_VERSI: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_VERSI'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHAFaderCOMMA_ST: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_ST'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHAFaderPOCDE_ID: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_ID'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHAFaderPOCDE_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_NUM'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHAFaderPOCDE_REF: TcxGridDBColumn
                Caption = 'R'#233'f. Poste Commande'
                DataBinding.FieldName = 'POCDE_REF'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                SortIndex = 2
                SortOrder = soAscending
                Width = 85
              end
              object cxgtvPPECHAFaderCOMMA_ST_DES: TcxGridDBColumn
                Caption = 'Statut Commande'
                DataBinding.FieldName = 'COMMA_ST_DES'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 85
              end
              object cxgtvPPECHAFaderPOCDE_TYP_POSTE_DES: TcxGridDBColumn
                Caption = 'Type de poste'
                DataBinding.FieldName = 'POCDE_TYP_POSTE_DES'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvPPECHAFaderPPECH_DATE: TcxGridDBColumn
                Caption = 'Date MAD d'#233'part'
                DataBinding.FieldName = 'PPECH_DATE'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
              end
              object cxgtvPPECHAFaderPPECH_DATE_FAD_CALC: TcxGridDBColumn
                Caption = 'Date FAD calcul'#233'e'
                DataBinding.FieldName = 'PPECH_DATE_FAD_CALC'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
              end
              object cxgtvPPECHAFaderPPECH_DATE_FAD: TcxGridDBColumn
                Caption = 'Date FAD'
                DataBinding.FieldName = 'PPECH_DATE_FAD'
                HeaderAlignmentHorz = taCenter
                SortIndex = 0
                SortOrder = soAscending
                Styles.OnGetContentStyle = cxgtvPPECHAFaderPPECH_DATE_FADStylesGetContentStyle
              end
              object cxgtvPPECHAFaderPPECH_QTE_ORI: TcxGridDBColumn
                Caption = 'Quantit'#233' '#233'ch'#233'anc'#233'e'
                DataBinding.FieldName = 'PPECH_QTE_ORI'
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 80
              end
              object cxgtvPPECHAFaderPPECH_QTE_TOLER: TcxGridDBColumn
                Caption = 'Quantit'#233' '#233'ch'#233'anc'#233'e tol'#233'ranc'#233'e'
                DataBinding.FieldName = 'PPECH_QTE_TOLER'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 80
              end
              object cxgtvPPECHAFaderPPECH_QTE_RESV: TcxGridDBColumn
                Caption = 'Quantit'#233' reserv'#233'e'
                DataBinding.FieldName = 'PPECH_QTE_RESV'
                Visible = False
                VisibleForExpressionEditor = bTrue
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForEditForm = bTrue
                VisibleForRowLayout = bTrue
                Width = 80
              end
              object cxgtvPPECHAFaderPPECH_QTE_CONSO: TcxGridDBColumn
                Caption = 'Quantit'#233' consomm'#233'e'
                DataBinding.FieldName = 'PPECH_QTE_CONSO'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 80
              end
              object cxgtvPPECHAFaderPOCDE_TYP_POSTE: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_TYP_POSTE'
                Visible = False
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPPECHAFaderPPECH_QTE_COLS_RESTE_A_FADER: TcxGridDBColumn
                Caption = 'Quantit'#233' de cols '#13#10'restant '#224' fader'
                DataBinding.FieldName = 'PPECH_QTE_COLS_RESTE_A_FADER'
                HeaderAlignmentHorz = taCenter
                Width = 117
              end
              object cxgtvPPECHAFaderPPECH_QTE_SUPP_RESTE_A_FADER: TcxGridDBColumn
                Caption = 'Quantit'#233' de pals'#13#10'restant '#224' fader'
                DataBinding.FieldName = 'PPECH_QTE_SUPP_RESTE_A_FADER'
                HeaderAlignmentHorz = taCenter
                Width = 121
              end
              object cxgtvPPECHAFaderTIERS_CODEPPECHAFaderPPECH_QTE_SOLDE_A_LIVRER: TcxGridDBColumn
                Caption = 'Solde '#224' livrer'
                DataBinding.FieldName = 'PPECH_QTE_SOLDE_A_LIVRER'
                HeaderAlignmentHorz = taCenter
                Width = 88
              end
              object cxgtvPPECHAFaderLIVRAISONS_PLANIFIEES: TcxGridDBColumn
                Caption = 'Livraisons planifi'#233'es'
                DataBinding.FieldName = 'LIVRAISONS_PLANIFIEES'
                Styles.OnGetContentStyle = cxgtvPPECHAFaderLIVRAISONS_PLANIFIEESStylesGetContentStyle
              end
              object cxgtvPPECHAFaderSUM_QTE_DDL: TcxGridDBColumn
                Caption = 'Somme des Qt'#233's DDL'
                DataBinding.FieldName = 'SUM_QTE_DDL'
              end
              object cxgtvPPECH_SOLDE_RESV: TcxGridDBColumn
                Caption = 'Solde r'#233'serv'#233
                DataBinding.FieldName = 'PPECH_SOLDE_RESV'
                HeaderAlignmentHorz = taCenter
                Styles.OnGetContentStyle = cxgtvPPECH_SOLDE_RESVStylesGetContentStyle
              end
              object cxgtvPPECHAFaderTIERS_CODEPPECH_FACTURABLE: TcxGridDBColumn
                Caption = 'Facturable'
                DataBinding.FieldName = 'PPECH_FACTURABLE'
                RepositoryItem = chkFAD
                HeaderAlignmentHorz = taCenter
                Width = 99
              end
              object cxgtvPPECH_CMNT_DATE_FAD: TcxGridDBColumn
                Caption = 'Commentaire Date FAD'
                DataBinding.FieldName = 'JDFEC_DES'
                GroupSummaryAlignment = taRightJustify
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bTrue
                VisibleForRowLayout = bTrue
                Width = 226
              end
              object cxgtvPPECHAFaderPRCDT_ID: TcxGridDBColumn
                Caption = 'Id Produit conditionn'#233
                DataBinding.FieldName = 'PRCDT_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
                Width = 80
              end
              object cxgtvPPECHAFaderMODEL_CODE: TcxGridDBColumn
                Caption = 'Mod'#232'le'
                DataBinding.FieldName = 'MODEL_CODE'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 80
              end
              object cxgtvPPECHAFaderPRCDT_DES: TcxGridDBColumn
                Caption = 'Produit conditionn'#233
                DataBinding.FieldName = 'PRCDT_DES'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 296
              end
              object cxgtvPPECHAFaderPRCDT_MODE_GES: TcxGridDBColumn
                Caption = 'Mode de gestion'
                DataBinding.FieldName = 'PRCDT_MODE_GES'
                Visible = False
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForCustomization = False
              end
              object cxgtvPPECHAFaderPRCDT_MODE_GES_DES: TcxGridDBColumn
                Caption = 'Mode de gestion'
                DataBinding.FieldName = 'PRCDT_MODE_GES_DES'
                VisibleForExpressionEditor = bFalse
                FooterAlignmentHorz = taCenter
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                VisibleForRowLayout = bTrue
                Width = 173
              end
              object cxgtvPPECHAFaderADM_TRIG: TcxGridDBColumn
                Caption = 'ADM'
                DataBinding.FieldName = 'ADM_TRIG'
                VisibleForExpressionEditor = bFalse
                FooterAlignmentHorz = taCenter
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                VisibleForRowLayout = bTrue
                Width = 50
              end
              object cxgtvPPECHAFaderCDM_TRIG: TcxGridDBColumn
                Caption = 'CDM'
                DataBinding.FieldName = 'CDM_TRIG'
                Visible = False
                FooterAlignmentHorz = taCenter
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 50
              end
              object cxgtvPPECHAFaderPPECH_ID: TcxGridDBColumn
                Visible = False
              end
            end
            object cxglPPECHAFader: TcxGridLevel
              GridView = cxgtvPPECHAFader
            end
          end
        end
      end
      object tbsDDF_ECHANT: TcxTabSheet
        Caption = 'tbsDDF_ECHANT'
        ImageIndex = 5
        object pnlDDF_ECHANT: TPanel
          Left = 0
          Top = 0
          Width = 1906
          Height = 167
          Align = alClient
          BevelOuter = bvNone
          Caption = 'pnlPPECHDateDepartDepasseeListe'
          TabOrder = 0
          object dxBarDockControl6: TdxBarDockControl
            Left = 0
            Top = 0
            Width = 1906
            Height = 34
            Align = dalTop
            BarManager = bmBars
          end
          object dxdgDDF_ECHANT: TcxGrid
            Left = 0
            Top = 34
            Width = 1906
            Height = 133
            Align = alClient
            Font.Charset = DEFAULT_CHARSET
            Font.Color = clWindowText
            Font.Height = -12
            Font.Name = 'Tahoma'
            Font.Style = []
            ParentFont = False
            PopupMenu = frmMain.GridPopUp
            TabOrder = 1
            LookAndFeel.NativeStyle = False
            LookAndFeel.ScrollbarMode = sbmClassic
            LookAndFeel.SkinName = ''
            object cxgtvDDF_ECHANT: TcxGridDBTableView
              DataController.DataModeController.SmartRefresh = True
              DataController.DataSource = dsDDF_ECHANT
              DataController.Filter.Options = [fcoCaseInsensitive]
              DataController.KeyFieldNames = 'ORFAB_ID'
              DataController.Summary.FooterSummaryItems = <
                item
                  Kind = skCount
                end
                item
                  Format = '%d'
                  Kind = skCount
                end
                item
                  Kind = skCount
                  FieldName = 'PPECH_ID'
                end>
              DataController.Summary.SummaryGroups = <
                item
                  Links = <
                    item
                    end
                    item
                    end
                    item
                    end>
                  SummaryItems = <
                    item
                      Format = '# tasks'
                      Kind = skCount
                    end>
                end>
              OptionsBehavior.CellHints = True
              OptionsCustomize.ColumnsQuickCustomization = True
              OptionsData.CancelOnExit = False
              OptionsData.Deleting = False
              OptionsData.DeletingConfirmation = False
              OptionsData.Editing = False
              OptionsData.Inserting = False
              OptionsSelection.CellSelect = False
              OptionsSelection.CheckBoxPosition = cbpIndicator
              OptionsSelection.HideFocusRectOnExit = False
              OptionsSelection.UnselectFocusedRecordOnExit = False
              OptionsView.CellEndEllipsis = True
              OptionsView.FocusRect = False
              OptionsView.CellTextMaxLineCount = 3
              OptionsView.GroupByBox = False
              OptionsView.HeaderAutoHeight = True
              OptionsView.HeaderFilterButtonShowMode = fbmButton
              OptionsView.Indicator = True
              Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral
              object cxgtvDDF_ECHANTORFAB_ID: TcxGridDBColumn
                DataBinding.FieldName = 'ORFAB_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
                Width = 71
              end
              object cxgtvDDF_ECHANTORFAB_NUM: TcxGridDBColumn
                Caption = 'N'#176
                DataBinding.FieldName = 'ORFAB_NUM'
                HeaderAlignmentHorz = taCenter
                Width = 71
              end
              object cxgtvDDF_ECHANTORFAB_ST: TcxGridDBColumn
                DataBinding.FieldName = 'ORFAB_ST'
                Visible = False
                VisibleForExpressionEditor = bFalse
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDDF_ECHANTORFAB_ST_DES: TcxGridDBColumn
                Caption = 'Statut'
                DataBinding.FieldName = 'ORFAB_ST_DES'
                HeaderAlignmentHorz = taCenter
                Width = 161
              end
              object cxgtvDDF_ECHANTORFAB_ST_COM: TcxGridDBColumn
                DataBinding.FieldName = 'ORFAB_ST_COM'
                Visible = False
                VisibleForExpressionEditor = bFalse
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDDF_ECHANTORFAB_ST_COM_DES: TcxGridDBColumn
                Caption = 'Statut comm.'
                DataBinding.FieldName = 'ORFAB_ST_COM_DES'
                HeaderAlignmentHorz = taCenter
                Width = 104
              end
              object cxgtvDDF_ECHANTORFAB_DATE_SOUHAI_DATE: TcxGridDBColumn
                Caption = 'Date souhait'#233'e'
                DataBinding.FieldName = 'ORFAB_DATE_SOUHAI_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 130
              end
              object cxgtvDDF_ECHANTORFAB_MAD_DATE: TcxGridDBColumn
                Caption = 'Date MAD'
                DataBinding.FieldName = 'ORFAB_MAD_DATE'
                HeaderAlignmentHorz = taCenter
                SortIndex = 0
                SortOrder = soAscending
              end
              object cxgtvDDF_ECHANTORFAB_DATE_FAB_PREV: TcxGridDBColumn
                Caption = 'Date fabrication pr'#233'v.'
                DataBinding.FieldName = 'ORFAB_DATE_FAB_PREV'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDDF_ECHANTORFAB_QTE_SOUHAI: TcxGridDBColumn
                Caption = 'Quantit'#233' souhait'#233'e'
                DataBinding.FieldName = 'ORFAB_QTE_SOUHAI'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 97
              end
              object cxgtvDDF_ECHANTTIERS_ID: TcxGridDBColumn
                DataBinding.FieldName = 'TIERS_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDDF_ECHANTTIERS_CODE: TcxGridDBColumn
                Caption = 'Tiers'
                DataBinding.FieldName = 'TIERS_CODE'
                HeaderAlignmentHorz = taCenter
                Width = 67
              end
              object cxgtvDDF_ECHANTTIERS_RS_L1: TcxGridDBColumn
                Caption = 'D'#233'signation tiers'
                DataBinding.FieldName = 'TIERS_RS_L1'
                HeaderAlignmentHorz = taCenter
                Width = 113
              end
              object cxgtvDDF_ECHANTPRCDT_ID: TcxGridDBColumn
                Caption = 'Produit conditionn'#233
                DataBinding.FieldName = 'PRCDT_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
                Width = 83
              end
              object cxgtvDDF_ECHANTPRCDT_DES: TcxGridDBColumn
                Caption = 'D'#233'signation produit conditionn'#233
                DataBinding.FieldName = 'PRCDT_DES'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDDF_ECHANTMODEL_CODE: TcxGridDBColumn
                Caption = 'Mod'#232'le'
                DataBinding.FieldName = 'MODEL_CODE'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 83
              end
              object cxgtvDDF_ECHANTMODEL_DES: TcxGridDBColumn
                Caption = 'D'#233'signation mod'#232'le'
                DataBinding.FieldName = 'MODEL_DES'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
              end
            end
            object cxglDDF_ECHANT: TcxGridLevel
              GridView = cxgtvDDF_ECHANT
            end
          end
        end
      end
      object tbsCCBAT_TYPE0: TcxTabSheet
        Caption = 'tbsCCBAT_TYPE0'
        ImageIndex = 6
        object pnlDMBAT_TYPE0: TPanel
          Left = 0
          Top = 0
          Width = 1906
          Height = 167
          Align = alClient
          BevelOuter = bvNone
          Caption = 'pnlPPECHDateDepartDepasseeListe'
          TabOrder = 0
          object dxBarDockControl7: TdxBarDockControl
            Left = 0
            Top = 0
            Width = 1906
            Height = 34
            Align = dalTop
            BarManager = bmBars
          end
          object dxdgDMBAT_TYPE0: TcxGrid
            Left = 0
            Top = 34
            Width = 1906
            Height = 133
            Align = alClient
            Font.Charset = DEFAULT_CHARSET
            Font.Color = clWindowText
            Font.Height = -12
            Font.Name = 'Tahoma'
            Font.Style = []
            ParentFont = False
            PopupMenu = frmMain.GridPopUp
            TabOrder = 1
            LookAndFeel.NativeStyle = False
            LookAndFeel.ScrollbarMode = sbmClassic
            LookAndFeel.SkinName = ''
            object cxgtvDMBAT_TYPE0: TcxGridDBTableView
              DataController.DataModeController.SmartRefresh = True
              DataController.DataSource = dsDMBAT_TYPE0
              DataController.Filter.Options = [fcoCaseInsensitive]
              DataController.KeyFieldNames = 'DMBAT_ID'
              DataController.Summary.FooterSummaryItems = <
                item
                  Kind = skCount
                end
                item
                  Format = '%d'
                  Kind = skCount
                end
                item
                  Kind = skCount
                  FieldName = 'PPECH_ID'
                end>
              DataController.Summary.SummaryGroups = <
                item
                  Links = <
                    item
                    end
                    item
                    end
                    item
                    end>
                  SummaryItems = <
                    item
                      Format = '# tasks'
                      Kind = skCount
                    end>
                end>
              OptionsBehavior.CellHints = True
              OptionsCustomize.ColumnsQuickCustomization = True
              OptionsData.CancelOnExit = False
              OptionsData.Deleting = False
              OptionsData.DeletingConfirmation = False
              OptionsData.Editing = False
              OptionsData.Inserting = False
              OptionsSelection.CellSelect = False
              OptionsSelection.CheckBoxPosition = cbpIndicator
              OptionsSelection.HideFocusRectOnExit = False
              OptionsSelection.UnselectFocusedRecordOnExit = False
              OptionsView.CellEndEllipsis = True
              OptionsView.FocusRect = False
              OptionsView.CellTextMaxLineCount = 3
              OptionsView.GroupByBox = False
              OptionsView.HeaderAutoHeight = True
              OptionsView.HeaderFilterButtonShowMode = fbmButton
              OptionsView.Indicator = True
              Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral
              object cxgtvDMBAT_TYPE0CDCFO_ID: TcxGridDBColumn
                DataBinding.FieldName = 'CDCFO_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE0CDCFO_NUM: TcxGridDBColumn
                Caption = 'N'#176' CDC'
                DataBinding.FieldName = 'CDCFO_NUM'
                HeaderAlignmentHorz = taCenter
                Width = 75
              end
              object cxgtvDMBAT_TYPE0CDCFO_NUM_VERSI: TcxGridDBColumn
                Caption = 'Version'
                DataBinding.FieldName = 'CDCFO_NUM_VERSI'
                HeaderAlignmentHorz = taCenter
                Width = 60
              end
              object cxgtvDMBAT_TYPE0CDCFO_ST: TcxGridDBColumn
                DataBinding.FieldName = 'CDCFO_ST'
                Visible = False
                VisibleForExpressionEditor = bFalse
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE0CDCFO_ST_DES: TcxGridDBColumn
                Caption = 'Statut'
                DataBinding.FieldName = 'CDCFO_ST_DES'
                HeaderAlignmentHorz = taCenter
                Width = 107
              end
              object cxgtvDMBAT_TYPE0VSUPO_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'VSUPO_NUM'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE0VSUPO_DES: TcxGridDBColumn
                Caption = 'Variante support'
                DataBinding.FieldName = 'VSUPO_DES'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 150
              end
              object cxgtvDMBAT_TYPE0VDECO_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'VDECO_NUM'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE0VDECO_DES: TcxGridDBColumn
                Caption = 'Variante d'#233'cor'
                DataBinding.FieldName = 'VDECO_DES'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 150
              end
              object cxgtvDMBAT_TYPE0TIERS_CODE: TcxGridDBColumn
                Caption = 'Code Tiers'
                DataBinding.FieldName = 'TIERS_CODE'
                HeaderAlignmentHorz = taCenter
                Width = 62
              end
              object cxgtvDMBAT_TYPE0TIERS_RS_L1: TcxGridDBColumn
                Caption = 'Tiers'
                DataBinding.FieldName = 'TIERS_RS_L1'
                HeaderAlignmentHorz = taCenter
                Width = 172
              end
              object cxgtvDMBAT_TYPE0DMBAT_ID: TcxGridDBColumn
                Caption = 'N'#176' Demande de BAT'
                DataBinding.FieldName = 'DMBAT_ID'
                HeaderAlignmentHorz = taCenter
                Width = 85
              end
              object cxgtvDMBAT_TYPE0DMBAT_TYPE: TcxGridDBColumn
                DataBinding.FieldName = 'DMBAT_TYPE'
                Visible = False
                VisibleForExpressionEditor = bFalse
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE0DMBAT_STATUT: TcxGridDBColumn
                DataBinding.FieldName = 'DMBAT_STATUT'
                Visible = False
                VisibleForExpressionEditor = bFalse
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE0DMBAT_STATUT_DES: TcxGridDBColumn
                Caption = 'Statut'
                DataBinding.FieldName = 'DMBAT_STATUT_DES'
                HeaderAlignmentHorz = taCenter
                Width = 150
              end
              object cxgtvDMBAT_TYPE0DMBAT_PAP_DMD_DATE: TcxGridDBColumn
                Caption = 'Date demande'
                DataBinding.FieldName = 'DMBAT_PAP_DMD_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvDMBAT_TYPE0DMBAT_PAP_PC_REP_DATE: TcxGridDBColumn
                Caption = 'Date prise en compte'
                DataBinding.FieldName = 'DMBAT_PAP_PC_REP_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvDMBAT_TYPE0DMBAT_PAP_PC_MAD_DATE: TcxGridDBColumn
                Caption = 'Date MAD pr'#233'vue'
                DataBinding.FieldName = 'DMBAT_PAP_PC_MAD_DATE'
                HeaderAlignmentHorz = taCenter
                SortIndex = 0
                SortOrder = soAscending
                Width = 100
              end
              object cxgtvDMBAT_TYPE0DMBAT_PAP_REA_MAIL_DATE: TcxGridDBColumn
                Caption = 'Date BAT'
                DataBinding.FieldName = 'DMBAT_PAP_REA_MAIL_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvDMBAT_TYPE0DMBAT_PAP_ENVOI_CLIENT_DATE: TcxGridDBColumn
                Caption = 'Date envoi client'
                DataBinding.FieldName = 'DMBAT_PAP_ENVOI_CLIENT_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvDMBAT_TYPE0DMBAT_PAP_VALID_CLIENT_DATE: TcxGridDBColumn
                Caption = 'Date validation client'
                DataBinding.FieldName = 'DMBAT_PAP_VALID_CLIENT_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
            end
            object cxglDMBAT_TYPE0: TcxGridLevel
              GridView = cxgtvDMBAT_TYPE0
            end
          end
        end
      end
      object tbsDMBAT_TYPE1: TcxTabSheet
        Caption = 'tbsDMBAT_TYPE1'
        ImageIndex = 7
        object pnlDMBAT_TYPE1: TPanel
          Left = 0
          Top = 0
          Width = 1906
          Height = 167
          Align = alClient
          BevelOuter = bvNone
          Caption = 'pnlPPECHDateDepartDepasseeListe'
          TabOrder = 0
          object dxBarDockControl8: TdxBarDockControl
            Left = 0
            Top = 0
            Width = 1906
            Height = 34
            Align = dalTop
            BarManager = bmBars
          end
          object dxdgDMBAT_TYPE1: TcxGrid
            Left = 0
            Top = 34
            Width = 1906
            Height = 133
            Align = alClient
            Font.Charset = DEFAULT_CHARSET
            Font.Color = clWindowText
            Font.Height = -12
            Font.Name = 'Tahoma'
            Font.Style = []
            ParentFont = False
            PopupMenu = frmMain.GridPopUp
            TabOrder = 1
            LookAndFeel.NativeStyle = False
            LookAndFeel.ScrollbarMode = sbmClassic
            LookAndFeel.SkinName = ''
            object cxgtvDMBAT_TYPE1: TcxGridDBTableView
              DataController.DataModeController.SmartRefresh = True
              DataController.DataSource = dsDMBAT_TYPE1
              DataController.Filter.Options = [fcoCaseInsensitive]
              DataController.KeyFieldNames = 'DMBAT_ID'
              DataController.Summary.FooterSummaryItems = <
                item
                  Kind = skCount
                end
                item
                  Format = '%d'
                  Kind = skCount
                end
                item
                  Kind = skCount
                  FieldName = 'PPECH_ID'
                end>
              DataController.Summary.SummaryGroups = <
                item
                  Links = <
                    item
                    end
                    item
                    end
                    item
                    end>
                  SummaryItems = <
                    item
                      Format = '# tasks'
                      Kind = skCount
                    end>
                end>
              OptionsBehavior.CellHints = True
              OptionsCustomize.ColumnsQuickCustomization = True
              OptionsData.CancelOnExit = False
              OptionsData.Deleting = False
              OptionsData.DeletingConfirmation = False
              OptionsData.Editing = False
              OptionsData.Inserting = False
              OptionsSelection.CellSelect = False
              OptionsSelection.CheckBoxPosition = cbpIndicator
              OptionsSelection.HideFocusRectOnExit = False
              OptionsSelection.UnselectFocusedRecordOnExit = False
              OptionsView.CellEndEllipsis = True
              OptionsView.FocusRect = False
              OptionsView.CellTextMaxLineCount = 3
              OptionsView.GroupByBox = False
              OptionsView.HeaderAutoHeight = True
              OptionsView.HeaderFilterButtonShowMode = fbmButton
              OptionsView.Indicator = True
              Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral
              object cxgtvDMBAT_TYPE1CDCFO_ID: TcxGridDBColumn
                DataBinding.FieldName = 'CDCFO_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE1CDCFO_NUM: TcxGridDBColumn
                Caption = 'N'#176' CDC'
                DataBinding.FieldName = 'CDCFO_NUM'
                HeaderAlignmentHorz = taCenter
                Width = 75
              end
              object cxgtvDMBAT_TYPE1CDCFO_NUM_VERSI: TcxGridDBColumn
                Caption = 'Version'
                DataBinding.FieldName = 'CDCFO_NUM_VERSI'
                HeaderAlignmentHorz = taCenter
                Width = 60
              end
              object cxgtvDMBAT_TYPE1CDCFO_ST: TcxGridDBColumn
                DataBinding.FieldName = 'CDCFO_ST'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE1CDCFO_ST_DES: TcxGridDBColumn
                Caption = 'Statut'
                DataBinding.FieldName = 'CDCFO_ST_DES'
                HeaderAlignmentHorz = taCenter
                Width = 107
              end
              object cxgtvDMBAT_TYPE1VSUPO_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'VSUPO_NUM'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE1VSUPO_DES: TcxGridDBColumn
                Caption = 'Variante support'
                DataBinding.FieldName = 'VSUPO_DES'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 150
              end
              object cxgtvDMBAT_TYPE1VDECO_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'VDECO_NUM'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE1VDECO_DES: TcxGridDBColumn
                Caption = 'Variante d'#233'cor'
                DataBinding.FieldName = 'VDECO_DES'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 150
              end
              object cxgtvDMBAT_TYPE1TIERS_CODE: TcxGridDBColumn
                Caption = 'Code Tiers'
                DataBinding.FieldName = 'TIERS_CODE'
                HeaderAlignmentHorz = taCenter
                Width = 62
              end
              object cxgtvDMBAT_TYPE1TIERS_RS_L1: TcxGridDBColumn
                Caption = 'Tiers'
                DataBinding.FieldName = 'TIERS_RS_L1'
                HeaderAlignmentHorz = taCenter
                Width = 172
              end
              object cxgtvDMBAT_TYPE1DMBAT_ID: TcxGridDBColumn
                Caption = 'N'#176' Demande de BAT'
                DataBinding.FieldName = 'DMBAT_ID'
                HeaderAlignmentHorz = taCenter
                Width = 85
              end
              object cxgtvDMBAT_TYPE1DMBAT_TYPE: TcxGridDBColumn
                DataBinding.FieldName = 'DMBAT_TYPE'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE1DMBAT_STATUT: TcxGridDBColumn
                DataBinding.FieldName = 'DMBAT_STATUT'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvDMBAT_TYPE1DMBAT_STATUT_DES: TcxGridDBColumn
                Caption = 'Statut'
                DataBinding.FieldName = 'DMBAT_STATUT_DES'
                HeaderAlignmentHorz = taCenter
                Width = 150
              end
              object cxgtvDMBAT_TYPE1DMBAT_VER_DMD_DATE: TcxGridDBColumn
                Caption = 'Date demande'
                DataBinding.FieldName = 'DMBAT_VER_DMD_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvDMBAT_TYPE1DMBAT_VER_PC_REP_DATE: TcxGridDBColumn
                Caption = 'Date prise en compte'
                DataBinding.FieldName = 'DMBAT_VER_PC_REP_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvDMBAT_TYPE1DMBAT_VER_PC_MAD_DATE: TcxGridDBColumn
                Caption = 'Date MAD pr'#233'vue'
                DataBinding.FieldName = 'DMBAT_VER_PC_MAD_DATE'
                HeaderAlignmentHorz = taCenter
                SortIndex = 0
                SortOrder = soAscending
                Width = 100
              end
              object cxgtvDMBAT_TYPE1DMBAT_VER_REA_MAIL_DATE: TcxGridDBColumn
                Caption = 'Date BAT'
                DataBinding.FieldName = 'DMBAT_VER_REA_MAIL_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvDMBAT_TYPE1DMBAT_VER_ENVOI_CLIENT_DATE: TcxGridDBColumn
                Caption = 'Date envoi client'
                DataBinding.FieldName = 'DMBAT_VER_ENVOI_CLIENT_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvDMBAT_TYPE1DMBAT_VER_VALID_CLIENT_DATE: TcxGridDBColumn
                Caption = 'Date validation client'
                DataBinding.FieldName = 'DMBAT_VER_VALID_CLIENT_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
            end
            object cxglDMBAT_TYPE1: TcxGridLevel
              GridView = cxgtvDMBAT_TYPE1
            end
          end
        end
      end
      object tbsPOCDE_DECOR: TcxTabSheet
        Caption = 'tbsPOCDE_DECOR'
        ImageIndex = 8
        object pnlPOCDE_DECOR: TPanel
          Left = 0
          Top = 0
          Width = 1906
          Height = 167
          Align = alClient
          BevelOuter = bvNone
          Caption = 'pnlPPECHDateDepartDepasseeListe'
          TabOrder = 0
          object dxBarDockControl9: TdxBarDockControl
            Left = 0
            Top = 0
            Width = 1906
            Height = 34
            Align = dalTop
            BarManager = bmBars
          end
          object dxdgPOCDE_DECOR: TcxGrid
            Left = 0
            Top = 34
            Width = 1906
            Height = 133
            Align = alClient
            Font.Charset = DEFAULT_CHARSET
            Font.Color = clWindowText
            Font.Height = -12
            Font.Name = 'Tahoma'
            Font.Style = []
            ParentFont = False
            PopupMenu = frmMain.GridPopUp
            TabOrder = 1
            LookAndFeel.NativeStyle = False
            LookAndFeel.ScrollbarMode = sbmClassic
            LookAndFeel.SkinName = ''
            object cxgtvPOCDE_DECOR: TcxGridDBTableView
              DataController.DataModeController.SmartRefresh = True
              DataController.DataSource = dsPOCDE_DECOR
              DataController.Filter.Options = [fcoCaseInsensitive]
              DataController.KeyFieldNames = 'POCDE_ID'
              DataController.Summary.FooterSummaryItems = <
                item
                  Kind = skCount
                end
                item
                  Format = '%d'
                  Kind = skCount
                end
                item
                  Kind = skCount
                  FieldName = 'PPECH_ID'
                end>
              DataController.Summary.SummaryGroups = <
                item
                  Links = <
                    item
                    end
                    item
                    end
                    item
                    end>
                  SummaryItems = <
                    item
                      Format = '# tasks'
                      Kind = skCount
                    end>
                end>
              OptionsBehavior.CellHints = True
              OptionsCustomize.ColumnsQuickCustomization = True
              OptionsData.CancelOnExit = False
              OptionsData.Deleting = False
              OptionsData.DeletingConfirmation = False
              OptionsData.Editing = False
              OptionsData.Inserting = False
              OptionsSelection.CellSelect = False
              OptionsSelection.CheckBoxPosition = cbpIndicator
              OptionsSelection.HideFocusRectOnExit = False
              OptionsSelection.UnselectFocusedRecordOnExit = False
              OptionsView.CellEndEllipsis = True
              OptionsView.FocusRect = False
              OptionsView.CellTextMaxLineCount = 3
              OptionsView.GroupByBox = False
              OptionsView.HeaderAutoHeight = True
              OptionsView.HeaderFilterButtonShowMode = fbmButton
              OptionsView.Indicator = True
              Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral
              object cxgtvPOCDE_DECORCOMMA_ID: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPOCDE_DECORCOMMA_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_NUM'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPOCDE_DECORCOMMA_VERSI: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_VERSI'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPOCDE_DECORPOCDE_REF: TcxGridDBColumn
                Caption = 'R'#233'f. Poste Commande'
                DataBinding.FieldName = 'POCDE_REF'
                HeaderAlignmentHorz = taCenter
                Width = 85
              end
              object cxgtvPOCDE_DECORCOMMA_ST: TcxGridDBColumn
                DataBinding.FieldName = 'COMMA_ST'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPOCDE_DECORCOMMA_ST_DES: TcxGridDBColumn
                Caption = 'Statut commande'
                DataBinding.FieldName = 'COMMA_ST_DES'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 85
              end
              object cxgtvPOCDE_DECORPOCDE_ID: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPOCDE_DECORPOCDE_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_NUM'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPOCDE_DECORPOCDE_TYP_POSTE: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_TYP_POSTE'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPOCDE_DECORPOCDE_SOLDE: TcxGridDBColumn
                DataBinding.FieldName = 'POCDE_SOLDE'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPOCDE_DECORPOCDE_TYP_POSTE_DES: TcxGridDBColumn
                Caption = 'Type de poste'
                DataBinding.FieldName = 'POCDE_TYP_POSTE_DES'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 100
              end
              object cxgtvPOCDE_DECORTIERS_ID: TcxGridDBColumn
                DataBinding.FieldName = 'TIERS_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPOCDE_DECORTIERS_CODE: TcxGridDBColumn
                Caption = 'Code Tiers'
                DataBinding.FieldName = 'TIERS_CODE'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 66
              end
              object cxgtvPOCDE_DECORTIERS_RS_L1: TcxGridDBColumn
                Caption = 'Tiers'
                DataBinding.FieldName = 'TIERS_RS_L1'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 199
              end
              object cxgtvPOCDE_DECORPRCDT_ID: TcxGridDBColumn
                Caption = 'Id Produit'
                DataBinding.FieldName = 'PRCDT_ID'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 74
              end
              object cxgtvPOCDE_DECORPRCDT_DES: TcxGridDBColumn
                Caption = 'Produit conditionn'#233
                DataBinding.FieldName = 'PRCDT_DES'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 296
              end
              object cxgtvPOCDE_DECORPRCDT_MODE_GES: TcxGridDBColumn
                DataBinding.FieldName = 'PRCDT_MODE_GES'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPOCDE_DECORPRCDT_MODE_GES_DES: TcxGridDBColumn
                Caption = 'Mode de gestion'
                DataBinding.FieldName = 'PRCDT_MODE_GES_DES'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForEditForm = bFalse
                Width = 173
              end
              object cxgtvPOCDE_DECORADM_COLLA_TRIG: TcxGridDBColumn
                Caption = 'ADM'
                DataBinding.FieldName = 'ADM_COLLA_TRIG'
                FooterAlignmentHorz = taCenter
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
              end
              object cxgtvPOCDE_DECORCDM_COLLA_TRIG: TcxGridDBColumn
                Caption = 'CDM'
                DataBinding.FieldName = 'CDM_COLLA_TRIG'
                Visible = False
                FooterAlignmentHorz = taCenter
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
              end
              object cxgtvPOCDE_DECORCOMMA_REF_CL: TcxGridDBColumn
                Caption = 'R'#233'f commande client'
                DataBinding.FieldName = 'COMMA_REF_CL'
                FooterAlignmentHorz = taCenter
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                Width = 150
              end
              object cxgtvPOCDE_DECORORFAB_DATE: TcxGridDBColumn
                Caption = 'Date d'#233'but fabrication'
                DataBinding.FieldName = 'ORFAB_DATE'
                FooterAlignmentHorz = taCenter
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
                SortIndex = 0
                SortOrder = soAscending
                Styles.OnGetContentStyle = cxgtvPOCDE_DECORORFAB_DATEStylesGetContentStyle
                Width = 100
              end
            end
            object cxglPOCDE_DECOR: TcxGridLevel
              GridView = cxgtvPOCDE_DECOR
            end
          end
        end
      end
      object tbsOFFRE_ST_0: TcxTabSheet
        Caption = 'tbsOFFRE_ST_0'
        ImageIndex = 9
        object pnlOFFRE_ST_0: TPanel
          Left = 0
          Top = 0
          Width = 1906
          Height = 167
          Margins.Left = 5
          Margins.Top = 5
          Margins.Right = 5
          Margins.Bottom = 5
          Align = alClient
          BevelOuter = bvNone
          Caption = 'pnlPPECHDateDepartDepasseeListe'
          TabOrder = 0
          object dxBarDockControl10: TdxBarDockControl
            Left = 0
            Top = 0
            Width = 1906
            Height = 34
            Margins.Left = 5
            Margins.Top = 5
            Margins.Right = 5
            Margins.Bottom = 5
            Align = dalTop
            BarManager = bmBars
          end
          object dxdgOFFRE_ST_0: TcxGrid
            Left = 0
            Top = 34
            Width = 1906
            Height = 133
            Align = alClient
            Font.Charset = DEFAULT_CHARSET
            Font.Color = clWindowText
            Font.Height = -12
            Font.Name = 'Tahoma'
            Font.Style = []
            ParentFont = False
            PopupMenu = frmMain.GridPopUp
            TabOrder = 1
            LookAndFeel.NativeStyle = False
            LookAndFeel.ScrollbarMode = sbmClassic
            LookAndFeel.SkinName = ''
            object cxgtvOFFRE_ST_0: TcxGridDBTableView
              DataController.DataModeController.SmartRefresh = True
              DataController.DataSource = dsOFFRE_ST_0
              DataController.Filter.Options = [fcoCaseInsensitive]
              DataController.KeyFieldNames = 'OFFRE_ID'
              DataController.Summary.FooterSummaryItems = <
                item
                  Kind = skCount
                end
                item
                  Format = '%d'
                  Kind = skCount
                end
                item
                  Kind = skCount
                  FieldName = 'PPECH_ID'
                end>
              DataController.Summary.SummaryGroups = <
                item
                  Links = <
                    item
                    end
                    item
                    end
                    item
                    end>
                  SummaryItems = <
                    item
                      Format = '# tasks'
                      Kind = skCount
                    end>
                end>
              OptionsBehavior.CellHints = True
              OptionsCustomize.ColumnsQuickCustomization = True
              OptionsData.CancelOnExit = False
              OptionsData.Deleting = False
              OptionsData.DeletingConfirmation = False
              OptionsData.Editing = False
              OptionsData.Inserting = False
              OptionsSelection.CellSelect = False
              OptionsSelection.CheckBoxPosition = cbpIndicator
              OptionsSelection.HideFocusRectOnExit = False
              OptionsSelection.UnselectFocusedRecordOnExit = False
              OptionsView.CellEndEllipsis = True
              OptionsView.FocusRect = False
              OptionsView.CellTextMaxLineCount = 3
              OptionsView.GroupByBox = False
              OptionsView.HeaderAutoHeight = True
              OptionsView.HeaderFilterButtonShowMode = fbmButton
              OptionsView.Indicator = True
              Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral
              object cxgtvOFFRE_ST_0OFFRE_ID: TcxGridDBColumn
                DataBinding.FieldName = 'OFFRE_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0OFFRE_TYP: TcxGridDBColumn
                DataBinding.FieldName = 'OFFRE_TYP'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0OFFRE_NUM: TcxGridDBColumn
                Caption = 'N'#176
                DataBinding.FieldName = 'OFFRE_NUM'
                HeaderAlignmentHorz = taCenter
                Width = 60
              end
              object cxgtvOFFRE_ST_0OFFRE_VERSI: TcxGridDBColumn
                Caption = 'Version'
                DataBinding.FieldName = 'OFFRE_VERSI'
                HeaderAlignmentHorz = taCenter
                Width = 50
              end
              object cxgtvOFFRE_ST_0OFFRE_DER_VERSI: TcxGridDBColumn
                DataBinding.FieldName = 'OFFRE_DER_VERSI'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0OFFRE_ST: TcxGridDBColumn
                DataBinding.FieldName = 'OFFRE_ST'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0OFFRE_TYPE_DES: TcxGridDBColumn
                Caption = 'Type d'#39'offre'
                DataBinding.FieldName = 'OFFRE_TYPE_DES'
                Width = 102
              end
              object cxgtvOFFRE_ST_0OFFRE_ST_DES: TcxGridDBColumn
                Caption = 'Statut'
                DataBinding.FieldName = 'OFFRE_ST_DES'
                HeaderAlignmentHorz = taCenter
                Width = 130
              end
              object cxgtvOFFRE_ST_0OFFRE_DATE: TcxGridDBColumn
                Caption = 'Date'
                DataBinding.FieldName = 'OFFRE_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvOFFRE_ST_0EMET_COLLA_TRIG: TcxGridDBColumn
                Caption = 'Emetteur'
                DataBinding.FieldName = 'EMET_COLLA_TRIG'
              end
              object cxgtvOFFRE_ST_0OFFRE_DATE_REPON: TcxGridDBColumn
                Caption = 'Date Relance'
                DataBinding.FieldName = 'OFFRE_DATE_REPON'
                HeaderAlignmentHorz = taCenter
                SortIndex = 0
                SortOrder = soAscending
                Width = 115
              end
              object cxgtvOFFRE_ST_0OFFRE_DATE_VAL: TcxGridDBColumn
                DataBinding.FieldName = 'OFFRE_DATE_VAL'
                Visible = False
                VisibleForExpressionEditor = bTrue
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0OFFRE_REF_CLI: TcxGridDBColumn
                Caption = 'R'#233'f'#233'rence Client'
                DataBinding.FieldName = 'OFFRE_REF_CLI'
                HeaderAlignmentHorz = taCenter
                Width = 300
              end
              object cxgtvOFFRE_ST_0ADM_COLLA_ID: TcxGridDBColumn
                DataBinding.FieldName = 'ADM_COLLA_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0ADM_NOMPRENOM: TcxGridDBColumn
                DataBinding.FieldName = 'ADM_NOMPRENOM'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0CDM_COLLA_ID: TcxGridDBColumn
                DataBinding.FieldName = 'CDM_COLLA_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0CDM_NOMPRENOM: TcxGridDBColumn
                DataBinding.FieldName = 'CDM_NOMPRENOM'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0TIERS_ID: TcxGridDBColumn
                DataBinding.FieldName = 'TIERS_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0TIERS_CODE: TcxGridDBColumn
                Caption = 'Code Tiers'
                DataBinding.FieldName = 'TIERS_CODE'
                HeaderAlignmentHorz = taCenter
              end
              object cxgtvOFFRE_ST_0TIERS_RS_L1: TcxGridDBColumn
                Caption = 'Tiers'
                DataBinding.FieldName = 'TIERS_RS_L1'
                HeaderAlignmentHorz = taCenter
                Width = 224
              end
              object cxgtvOFFRE_ST_0EMET_COLLA_ID: TcxGridDBColumn
                DataBinding.FieldName = 'EMET_COLLA_ID'
                Visible = False
              end
              object cxgtvOFFRE_ST_0EMET_NOMPRENOM: TcxGridDBColumn
                DataBinding.FieldName = 'EMET_NOMPRENOM'
                Visible = False
              end
              object cxgtvOFFRE_ST_0MONTANT: TcxGridDBColumn
                Caption = 'Montant'
                DataBinding.FieldName = 'MONTANT'
                Width = 100
              end
              object cxgtvOFFRE_ST_0DVISE_CODE: TcxGridDBColumn
                Caption = 'Devise '
                DataBinding.FieldName = 'DVISE_CODE'
              end
              object cxgtvOFFRE_ST_0ADM_COLLA_TRIG: TcxGridDBColumn
                Caption = 'ADM'
                DataBinding.FieldName = 'ADM_COLLA_TRIG'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0CDM_COLLA_TRIG: TcxGridDBColumn
                Caption = 'CDM'
                DataBinding.FieldName = 'CDM_COLLA_TRIG'
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_ST_0RZA_COLLA_TRIG: TcxGridDBColumn
                Caption = 'RZA'
                DataBinding.FieldName = 'RZA_COLLA_TRIG'
              end
            end
            object cxglOFFRE_ST_0: TcxGridLevel
              GridView = cxgtvOFFRE_ST_0
            end
          end
        end
      end
      object tbsOFFRE_A_RELANCER: TcxTabSheet
        Caption = 'tbsOFFRE_A_RELANCER'
        ImageIndex = 10
        object pnlOFFRE_A_RELANCER: TPanel
          Left = 0
          Top = 0
          Width = 1906
          Height = 167
          Align = alClient
          BevelOuter = bvNone
          Caption = 'pnlPPECHDateDepartDepasseeListe'
          TabOrder = 0
          object dxBarDockControl11: TdxBarDockControl
            Left = 0
            Top = 0
            Width = 1906
            Height = 34
            Align = dalTop
            BarManager = bmBars
          end
          object dxdgOFFRE_A_RELANCER: TcxGrid
            Left = 0
            Top = 34
            Width = 1906
            Height = 133
            Align = alClient
            Font.Charset = DEFAULT_CHARSET
            Font.Color = clWindowText
            Font.Height = -12
            Font.Name = 'Tahoma'
            Font.Style = []
            ParentFont = False
            PopupMenu = frmMain.GridPopUp
            TabOrder = 1
            LookAndFeel.NativeStyle = False
            LookAndFeel.ScrollbarMode = sbmClassic
            LookAndFeel.SkinName = ''
            object cxgtvOFFRE_A_RELANCER: TcxGridDBTableView
              DataController.DataModeController.SmartRefresh = True
              DataController.DataSource = dsOFFRE_A_RELANCER
              DataController.Filter.Options = [fcoCaseInsensitive]
              DataController.KeyFieldNames = 'OFFRE_ID'
              DataController.Summary.FooterSummaryItems = <
                item
                  Kind = skCount
                end
                item
                  Format = '%d'
                  Kind = skCount
                end
                item
                  Kind = skCount
                  FieldName = 'PPECH_ID'
                end>
              DataController.Summary.SummaryGroups = <
                item
                  Links = <
                    item
                    end
                    item
                    end
                    item
                    end>
                  SummaryItems = <
                    item
                      Format = '# tasks'
                      Kind = skCount
                    end>
                end>
              OptionsBehavior.CellHints = True
              OptionsCustomize.ColumnsQuickCustomization = True
              OptionsData.CancelOnExit = False
              OptionsData.Deleting = False
              OptionsData.DeletingConfirmation = False
              OptionsData.Editing = False
              OptionsData.Inserting = False
              OptionsSelection.CellSelect = False
              OptionsSelection.CheckBoxPosition = cbpIndicator
              OptionsSelection.HideFocusRectOnExit = False
              OptionsSelection.UnselectFocusedRecordOnExit = False
              OptionsView.CellEndEllipsis = True
              OptionsView.FocusRect = False
              OptionsView.CellTextMaxLineCount = 3
              OptionsView.GroupByBox = False
              OptionsView.HeaderAutoHeight = True
              OptionsView.HeaderFilterButtonShowMode = fbmButton
              OptionsView.Indicator = True
              Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral
              object cxgtvOFFRE_A_RELANCEROFFRE_ID: TcxGridDBColumn
                DataBinding.FieldName = 'OFFRE_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_TYP: TcxGridDBColumn
                DataBinding.FieldName = 'OFFRE_TYP'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_NUM: TcxGridDBColumn
                Caption = 'N'#176
                DataBinding.FieldName = 'OFFRE_NUM'
                HeaderAlignmentHorz = taCenter
                Width = 60
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_VERSI: TcxGridDBColumn
                Caption = 'Version'
                DataBinding.FieldName = 'OFFRE_VERSI'
                HeaderAlignmentHorz = taCenter
                Width = 50
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_DER_VERSI: TcxGridDBColumn
                DataBinding.FieldName = 'OFFRE_DER_VERSI'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_ST: TcxGridDBColumn
                DataBinding.FieldName = 'OFFRE_ST'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_TYPE_DES: TcxGridDBColumn
                Caption = 'Cat'#233'gorie d'#39'offre'
                DataBinding.FieldName = 'OFFRE_TYPE_DES'
                Width = 102
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_TYP_DES: TcxGridDBColumn
                Caption = 'Type d'#39'offre'
                DataBinding.FieldName = 'OFFRE_TYP_DES'
                Width = 187
              end
              object cxgtvOFFRE_A_RELANCEREMET_COLLA_TRIG: TcxGridDBColumn
                Caption = 'Emetteur'
                DataBinding.FieldName = 'EMET_COLLA_TRIG'
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_ST_DES: TcxGridDBColumn
                Caption = 'Statut'
                DataBinding.FieldName = 'OFFRE_ST_DES'
                HeaderAlignmentHorz = taCenter
                Width = 50
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_DATE: TcxGridDBColumn
                Caption = 'Date'
                DataBinding.FieldName = 'OFFRE_DATE'
                HeaderAlignmentHorz = taCenter
                Width = 100
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_DATE_VAL: TcxGridDBColumn
                DataBinding.FieldName = 'OFFRE_DATE_VAL'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_A_RELANCEREMET_COLLA_ID: TcxGridDBColumn
                DataBinding.FieldName = 'EMET_COLLA_ID'
                Visible = False
              end
              object cxgtvOFFRE_A_RELANCEREMET_NOMPRENOM: TcxGridDBColumn
                DataBinding.FieldName = 'EMET_NOMPRENOM'
                Visible = False
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_DATE_RELANCE: TcxGridDBColumn
                Caption = 'Date Relance '
                DataBinding.FieldName = 'OFFRE_DATE_RELANCE'
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                Styles.OnGetContentStyle = cxgtvOFFRE_A_RELANCEROFFRE_DATE_RELANCEStylesGetContentStyle
              end
              object cxgtvOFFRE_A_RELANCERCOLLA_TRIG: TcxGridDBColumn
                Caption = 'A traiter par'
                DataBinding.FieldName = 'COLLA_TRIG'
                Styles.OnGetContentStyle = cxgtvOFFRE_A_RELANCERCOLLA_TRIGStylesGetContentStyle
                Width = 84
              end
              object cxgtvOFFRE_A_RELANCEROFFRE_REF_CLI: TcxGridDBColumn
                Caption = 'R'#233'f'#233'rence Client'
                DataBinding.FieldName = 'OFFRE_REF_CLI'
                HeaderAlignmentHorz = taCenter
                Width = 300
              end
              object cxgtvOFFRE_A_RELANCERADM_COLLA_ID: TcxGridDBColumn
                DataBinding.FieldName = 'ADM_COLLA_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_A_RELANCERADM_NOMPRENOM: TcxGridDBColumn
                DataBinding.FieldName = 'ADM_NOMPRENOM'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_A_RELANCERCDM_COLLA_ID: TcxGridDBColumn
                DataBinding.FieldName = 'CDM_COLLA_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_A_RELANCERCDM_NOMPRENOM: TcxGridDBColumn
                DataBinding.FieldName = 'CDM_NOMPRENOM'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_A_RELANCERTIERS_ID: TcxGridDBColumn
                DataBinding.FieldName = 'TIERS_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvOFFRE_A_RELANCERTIERS_CODE: TcxGridDBColumn
                Caption = 'Code Tiers'
                DataBinding.FieldName = 'TIERS_CODE'
                HeaderAlignmentHorz = taCenter
              end
              object cxgtvOFFRE_A_RELANCERTIERS_RS_L1: TcxGridDBColumn
                Caption = 'Tiers'
                DataBinding.FieldName = 'TIERS_RS_L1'
                HeaderAlignmentHorz = taCenter
                Width = 240
              end
              object cxgtvOFFRE_A_RELANCERMONTANT: TcxGridDBColumn
                Caption = 'Montant'
                DataBinding.FieldName = 'MONTANT'
                Width = 100
              end
              object cxgtvOFFRE_A_RELANCERDVISE_CODE: TcxGridDBColumn
                Caption = 'Devise'
                DataBinding.FieldName = 'DVISE_CODE'
              end
              object cxgtvOFFRE_A_RELANCERADM_COLLA_TRIG: TcxGridDBColumn
                Caption = 'ADM'
                DataBinding.FieldName = 'ADM_COLLA_TRIG'
                GroupSummaryAlignment = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
              end
              object cxgtvOFFRE_A_RELANCERCDM_COLLA_TRIG: TcxGridDBColumn
                Caption = 'CDM'
                DataBinding.FieldName = 'CDM_COLLA_TRIG'
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
              end
              object cxgtvOFFRE_A_RELANCERRZA_COLLA_TRIG: TcxGridDBColumn
                Caption = 'RZA'
                DataBinding.FieldName = 'RZA_COLLA_TRIG'
                FooterAlignmentHorz = taCenter
                HeaderAlignmentHorz = taCenter
                HeaderGlyphAlignmentHorz = taCenter
              end
            end
            object cxglOFFRE_A_RELANCER: TcxGridLevel
              GridView = cxgtvOFFRE_A_RELANCER
            end
          end
        end
      end
      object tbsPCDAG_A_TRAITER: TcxTabSheet
        Caption = 'tbsPCDAG_A_TRAITER'
        ImageIndex = 11
        object pnlPCDAG_A_TRAITER: TPanel
          Left = 0
          Top = 0
          Width = 1906
          Height = 167
          Align = alClient
          BevelOuter = bvNone
          Caption = 'pnlPPECHDateDepartDepasseeListe'
          TabOrder = 0
          object dxBarDockControl12: TdxBarDockControl
            Left = 0
            Top = 0
            Width = 1906
            Height = 34
            Align = dalTop
            BarManager = bmBars
          end
          object dxdgPCDAG_A_TRAITER: TcxGrid
            Left = 0
            Top = 34
            Width = 1906
            Height = 133
            Align = alClient
            Font.Charset = DEFAULT_CHARSET
            Font.Color = clWindowText
            Font.Height = -12
            Font.Name = 'Tahoma'
            Font.Style = []
            ParentFont = False
            PopupMenu = frmMain.GridPopUp
            TabOrder = 1
            LookAndFeel.NativeStyle = False
            LookAndFeel.ScrollbarMode = sbmClassic
            LookAndFeel.SkinName = ''
            object cxgtvPCDAG_A_TRAITER: TcxGridDBTableView
              DataController.DataModeController.SmartRefresh = True
              DataController.DataSource = dsPCDAG_A_TRAITER
              DataController.Filter.Options = [fcoCaseInsensitive]
              DataController.KeyFieldNames = 'PCDAG_ID'
              DataController.Summary.FooterSummaryItems = <
                item
                  Kind = skCount
                end
                item
                  Format = '%d'
                  Kind = skCount
                end
                item
                  Kind = skCount
                  FieldName = 'PPECH_ID'
                end>
              DataController.Summary.SummaryGroups = <
                item
                  Links = <
                    item
                    end
                    item
                    end
                    item
                    end>
                  SummaryItems = <
                    item
                      Format = '# tasks'
                      Kind = skCount
                    end>
                end>
              OptionsBehavior.CellHints = True
              OptionsCustomize.ColumnsQuickCustomization = True
              OptionsData.CancelOnExit = False
              OptionsData.Deleting = False
              OptionsData.DeletingConfirmation = False
              OptionsData.Editing = False
              OptionsData.Inserting = False
              OptionsSelection.CellSelect = False
              OptionsSelection.CheckBoxPosition = cbpIndicator
              OptionsSelection.HideFocusRectOnExit = False
              OptionsSelection.UnselectFocusedRecordOnExit = False
              OptionsView.CellEndEllipsis = True
              OptionsView.FocusRect = False
              OptionsView.CellTextMaxLineCount = 3
              OptionsView.GroupByBox = False
              OptionsView.HeaderAutoHeight = True
              OptionsView.HeaderFilterButtonShowMode = fbmButton
              OptionsView.Indicator = True
              Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral
              object cxgtvPCDAG_A_TRAITERCDACG_ID: TcxGridDBColumn
                DataBinding.FieldName = 'CDACG_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPCDAG_A_TRAITERCDACG_NUM: TcxGridDBColumn
                Caption = 'N'#176
                DataBinding.FieldName = 'CDACG_NUM'
                HeaderAlignmentHorz = taCenter
                Width = 82
              end
              object cxgtvPCDAG_A_TRAITERCDACG_SEQ: TcxGridDBColumn
                DataBinding.FieldName = 'CDACG_SEQ'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPCDAG_A_TRAITERCDACG_ST: TcxGridDBColumn
                DataBinding.FieldName = 'CDACG_ST'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPCDAG_A_TRAITERPCDAG_ID: TcxGridDBColumn
                DataBinding.FieldName = 'PCDAG_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPCDAG_A_TRAITERPCDAG_NUM: TcxGridDBColumn
                Caption = 'Poste'
                DataBinding.FieldName = 'PCDAG_NUM'
                HeaderAlignmentHorz = taCenter
                Width = 80
              end
              object cxgtvPCDAG_A_TRAITERPCDAG_PRCDT_ID: TcxGridDBColumn
                DataBinding.FieldName = 'PCDAG_PRCDT_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPCDAG_A_TRAITERPCDAG_QTE: TcxGridDBColumn
                Caption = 'Quantit'#233
                DataBinding.FieldName = 'PCDAG_QTE'
                HeaderAlignmentHorz = taCenter
                Width = 90
              end
              object cxgtvPCDAG_A_TRAITERPCDAG_TYP: TcxGridDBColumn
                DataBinding.FieldName = 'PCDAG_TYP'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPCDAG_A_TRAITERPCDAG_FLG_LIV_DIRECT: TcxGridDBColumn
                Caption = 'Livraison directe'
                DataBinding.FieldName = 'PCDAG_FLG_LIV_DIRECT'
                RepositoryItem = dmdSGL_DevExpress.cxGridListCenteredCheckBox
                HeaderAlignmentHorz = taCenter
              end
              object cxgtvPCDAG_A_TRAITERTIERS_ID: TcxGridDBColumn
                DataBinding.FieldName = 'TIERS_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPCDAG_A_TRAITERTIERS_CODE: TcxGridDBColumn
                Caption = 'Tiers Code'
                DataBinding.FieldName = 'TIERS_CODE'
                HeaderAlignmentHorz = taCenter
              end
              object cxgtvPCDAG_A_TRAITERTIERS_RS_L1: TcxGridDBColumn
                Caption = 'Tiers'
                DataBinding.FieldName = 'TIERS_RS_L1'
                HeaderAlignmentHorz = taCenter
                Width = 240
              end
              object cxgtvPCDAG_A_TRAITERPRCDT_ID: TcxGridDBColumn
                DataBinding.FieldName = 'PRCDT_ID'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPCDAG_A_TRAITERPRCDT_DES: TcxGridDBColumn
                Caption = 'Produit conditionn'#233
                DataBinding.FieldName = 'PRCDT_DES'
                HeaderAlignmentHorz = taCenter
                Width = 296
              end
              object cxgtvPCDAG_A_TRAITERPRCDT_MODE_GES: TcxGridDBColumn
                DataBinding.FieldName = 'PRCDT_MODE_GES'
                Visible = False
                VisibleForExpressionEditor = bFalse
                HeaderAlignmentHorz = taCenter
                VisibleForCustomization = False
                VisibleForEditForm = bFalse
              end
              object cxgtvPCDAG_A_TRAITERPRCDT_MODE_GES_DES: TcxGridDBColumn
                Caption = 'Mode de gestion'
                DataBinding.FieldName = 'PRCDT_MODE_GES_DES'
                HeaderAlignmentHorz = taCenter
                Width = 173
              end
              object cxgtvPCDAG_A_TRAITERPCDAG_DMAPR_ID: TcxGridDBColumn
                DataBinding.FieldName = 'PCDAG_DMAPR_ID'
                Visible = False
              end
            end
            object cxglPCDAG_A_TRAITER: TcxGridLevel
              GridView = cxgtvPCDAG_A_TRAITER
            end
          end
        end
      end
      object tbsTARIF_ANOMALIE: TcxTabSheet
        Caption = 'tbsTARIF_ANOMALIE'
        ImageIndex = 10
        object pnlTARIF_ANOMALIE: TPanel
          Left = 0
          Top = 0
          Width = 1906
          Height = 167
          Align = alClient
          Caption = 'pnlTARIF_ANOMALIE'
          TabOrder = 0
          object dgTARIFGrid: TcxGrid
            Left = 1
            Top = 35
            Width = 1904
            Height = 131
            Align = alClient
            Font.Charset = DEFAULT_CHARSET
            Font.Color = clBlack
            Font.Height = -11
            Font.Name = 'Tahoma'
            Font.Style = []
            ParentFont = False
            TabOrder = 0
            LookAndFeel.NativeStyle = False
            LookAndFeel.ScrollbarMode = sbmClassic
            LookAndFeel.SkinName = ''
            object dgTARIF: TcxGridDBTableView
              DataController.DataModeController.GridMode = True
              DataController.DataSource = dsTARIF
              OptionsBehavior.FocusCellOnTab = True
              OptionsBehavior.FocusCellOnCycle = True
              OptionsCustomize.ColumnFiltering = False
              OptionsCustomize.ColumnGrouping = False
              OptionsCustomize.ColumnsQuickCustomization = True
              OptionsData.Deleting = False
              OptionsData.Editing = False
              OptionsData.Inserting = False
              OptionsSelection.CellSelect = False
              OptionsView.FocusRect = False
              OptionsView.ExpandButtonsForEmptyDetails = False
              OptionsView.GridLineColor = clSilver
              OptionsView.GroupByBox = False
              OptionsView.HeaderAutoHeight = True
              OptionsView.HeaderFilterButtonShowMode = fbmButton
              OptionsView.Indicator = True
              OptionsView.IndicatorWidth = 15
              Styles.StyleSheet = dmdSGL_DevExpress.cxGridTableViewStyleSheetGeneral
              object dgTARIF_TARIF_NUM_VER: TcxGridDBColumn
                Caption = 'N'#176
                DataBinding.FieldName = 'TARIF_NUM_VER'
                HeaderAlignmentHorz = taCenter
                Width = 57
              end
              object dgTARIF_TARIF_DES: TcxGridDBColumn
                Caption = 'D'#233'signation tarifs'
                DataBinding.FieldName = 'TARIF_DES'
                HeaderAlignmentHorz = taCenter
                Width = 384
              end
              object dgTARIF_TARIF_NUM: TcxGridDBColumn
                DataBinding.FieldName = 'TARIF_NUM'
                Visible = False
                VisibleForCustomization = False
                Width = 20
              end
              object dgTARIF_TARIF_ID: TcxGridDBColumn
                DataBinding.FieldName = 'TARIF_ID'
                Visible = False
                VisibleForCustomization = False
                Width = 20
              end
              object dgTARIF_SOCIE_ID: TcxGridDBColumn
                DataBinding.FieldName = 'SOCIE_ID'
                Visible = False
                VisibleForCustomization = False
                Width = 20
              end
              object dgTARIF_OLD_PRCDT_ID: TcxGridDBColumn
                AlternateCaption = 'dgTARIF_OLD_PRCDT_ID'
                Caption = 'Ancien Pdt condi  '
                DataBinding.FieldName = 'OLD_PRCDT_ID'
                HeaderAlignmentHorz = taCenter
                Width = 80
              end
              object dgTARIF_OLD_PRCDT_DES: TcxGridDBColumn
                Caption = 'Designation '
                DataBinding.FieldName = 'OLD_PRCDT_DES'
                HeaderAlignmentHorz = taCenter
                Width = 220
              end
              object dgTARIF_NEW_PRCDT_ID: TcxGridDBColumn
                Caption = 'Nouveau Pdt condi '
                DataBinding.FieldName = 'NEW_PRCDT_ID'
                HeaderAlignmentHorz = taCenter
                Width = 80
              end
              object dgTARIF_NEW_PRCDT_DES: TcxGridDBColumn
                Caption = 'Designation '
                DataBinding.FieldName = 'NEW_PRCDT_DES'
                HeaderAlignmentHorz = taCenter
                Width = 220
              end
              object dgTARIF_PRCDT_ID: TcxGridDBColumn
                Caption = ' Pdt condi  '
                DataBinding.FieldName = 'PRCDT_ID'
                Visible = False
                HeaderAlignmentHorz = taCenter
              end
            end
            object dgTARIFLevel: TcxGridLevel
              GridView = dgTARIF
            end
          end
          object dxBarDockControl1: TdxBarDockControl
            Left = 1
            Top = 1
            Width = 1904
            Height = 34
            Align = dalTop
            BarManager = bmBars
          end
        end
      end
    end
  end
  object wtlVolant: TSVirtualTreeLink
    MonTrv = frmTrvVolant.TrvVolant
    Text = 'L...'
    ImageType = tikTRL
    Left = 1143
    Top = 53
  end
  object wtlFixe: TSVirtualTreeLink
    MonTrv = frmMain.trvAll
    Text = 'L...'
    ImageType = tikTRL
    Left = 1171
    Top = 53
  end
  object dsDDL_A_CREE_DADListe: TDataSource
    DataSet = qryDDL_A_CREE_FADListe
    Left = 1190
    Top = 752
  end
  object qryDDL_A_CREE_FADListe: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '    IDT COMMA_ID, '
      '    IDT COMMA_NUM, '
      '    IDT COMMA_VERSI,'
      '    IDT COMMA_ST,'
      '    DESI COMMA_ST_DES,'
      '    IDT POCDE_ID, '
      '    IDT POCDE_NUM,  '
      '    IDT POCDE_TYP_POSTE,'
      '    DESI POCDE_TYP_POSTE_DES,'
      '    DESI POCDE_REF,'
      '    IDT PPECH_ID, '
      '    DAT PPECH_DATE, '
      '    IDT TIERS_ID, '
      '    CODE TIERS_CODE, '
      '    DESI TIERS_RS_L1, '
      '    IDT PRCDT_ID, '
      '    DESI PRCDT_DES, '
      '    IDT PRCDT_MODE_GES,'
      '    DESI PRCDT_MODE_GES_DES, '
      '    IDT FAD_QTE_COLS, '
      '    IDT FAD_QTE_PALS, '
      '    CODE ADM_TRIG, '
      '    CODE CDM_TRIG'
      'FROM '
      '    FDATA')
    Left = 1094
    Top = 752
    object qryDDL_A_CREE_FADListeCOMMA_ID: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_ID'
    end
    object qryDDL_A_CREE_FADListeCOMMA_NUM: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_NUM'
    end
    object qryDDL_A_CREE_FADListeCOMMA_VERSI: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_VERSI'
    end
    object qryDDL_A_CREE_FADListeCOMMA_ST: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_ST'
    end
    object qryDDL_A_CREE_FADListeCOMMA_ST_DES: TWideStringField
      Alignment = taCenter
      FieldName = 'COMMA_ST_DES'
      Size = 50
    end
    object qryDDL_A_CREE_FADListePOCDE_ID: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_ID'
    end
    object qryDDL_A_CREE_FADListePOCDE_NUM: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_NUM'
    end
    object qryDDL_A_CREE_FADListePOCDE_TYP_POSTE: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_TYP_POSTE'
    end
    object qryDDL_A_CREE_FADListePOCDE_TYP_POSTE_DES: TWideStringField
      Alignment = taCenter
      FieldName = 'POCDE_TYP_POSTE_DES'
      Size = 50
    end
    object qryDDL_A_CREE_FADListePOCDE_REF: TWideStringField
      Alignment = taCenter
      FieldName = 'POCDE_REF'
      Size = 50
    end
    object qryDDL_A_CREE_FADListePPECH_ID: TFloatField
      Alignment = taCenter
      FieldName = 'PPECH_ID'
    end
    object qryDDL_A_CREE_FADListePPECH_DATE: TDateTimeField
      Alignment = taCenter
      FieldName = 'PPECH_DATE'
    end
    object qryDDL_A_CREE_FADListeTIERS_ID: TFloatField
      FieldName = 'TIERS_ID'
    end
    object qryDDL_A_CREE_FADListeTIERS_CODE: TWideStringField
      FieldName = 'TIERS_CODE'
      Size = 10
    end
    object qryDDL_A_CREE_FADListeTIERS_RS_L1: TWideStringField
      FieldName = 'TIERS_RS_L1'
      Size = 50
    end
    object qryDDL_A_CREE_FADListePRCDT_ID: TFloatField
      FieldName = 'PRCDT_ID'
    end
    object qryDDL_A_CREE_FADListePRCDT_DES: TWideStringField
      FieldName = 'PRCDT_DES'
      Size = 50
    end
    object qryDDL_A_CREE_FADListePRCDT_MODE_GES: TFloatField
      FieldName = 'PRCDT_MODE_GES'
    end
    object qryDDL_A_CREE_FADListePRCDT_MODE_GES_DES: TWideStringField
      FieldName = 'PRCDT_MODE_GES_DES'
      Size = 50
    end
    object qryDDL_A_CREE_FADListeFAD_QTE_COLS: TFloatField
      FieldName = 'FAD_QTE_COLS'
      DisplayFormat = ',0'
    end
    object qryDDL_A_CREE_FADListeFAD_QTE_PALS: TFloatField
      FieldName = 'FAD_QTE_PALS'
      DisplayFormat = ',0'
    end
    object qryDDL_A_CREE_FADListeADM_TRIG: TWideStringField
      FieldName = 'ADM_TRIG'
      Size = 10
    end
    object qryDDL_A_CREE_FADListeCDM_TRIG: TWideStringField
      FieldName = 'CDM_TRIG'
      Size = 10
    end
  end
  object cxStyleRepository1: TcxStyleRepository
    Left = 2613
    Top = 597
    PixelsPerInch = 96
    object stCellRouge: TcxStyle
      AssignedValues = [svColor]
      Color = 9934847
    end
    object stCellJaune: TcxStyle
      AssignedValues = [svColor]
      Color = 8454143
    end
    object stCellVert: TcxStyle
      AssignedValues = [svColor]
      Color = 9961372
    end
  end
  object bmBars: TdxBarManager
    Font.Charset = DEFAULT_CHARSET
    Font.Color = clWindowText
    Font.Height = -12
    Font.Name = 'Segoe UI'
    Font.Style = []
    Categories.Strings = (
      'Default')
    Categories.ItemsVisibles = (
      2)
    Categories.Visibles = (
      True)
    ImageOptions.Images = dmdSGL_DevExpress.ilImages
    LookAndFeel.NativeStyle = False
    LookAndFeel.SkinName = 'Whiteprint'
    PopupMenuLinks = <>
    UseSystemFont = True
    Left = 2613
    Top = 695
    PixelsPerInch = 96
    object dxbrPPECHFadees: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = #201'ch'#233'ances date d'#233'part d'#233'pass'#233'e'
      CaptionButtons = <>
      DockedDockingStyle = dsTop
      DockedLeft = 0
      DockedTop = 0
      DockingStyle = dsTop
      FloatLeft = 540
      FloatTop = 396
      FloatClientWidth = 71
      FloatClientHeight = 22
      IsMainMenu = True
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisCOMMA1'
        end
        item
          Visible = True
          ItemName = 'btnVisPOCDE1'
        end
        item
          Visible = True
          ItemName = 'btnVisPPECH1'
        end
        item
          Visible = True
          ItemName = 'btnPPECH_REC'
        end>
      MultiLine = True
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = False
      WholeRow = True
    end
    object dxbrPPECHProdRetard: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = #201'ch'#233'ances Production en retard'
      CaptionButtons = <>
      DockControl = dxBarDockControl2
      DockedDockControl = dxBarDockControl2
      DockedLeft = 0
      DockedTop = 0
      FloatLeft = 823
      FloatTop = 333
      FloatClientWidth = 51
      FloatClientHeight = 22
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisCOMMA2'
        end
        item
          Visible = True
          ItemName = 'btnVisPOCDE2'
        end
        item
          Visible = True
          ItemName = 'btnVisPPECH2'
        end
        item
          Visible = True
          ItemName = 'btnPPECHProdRetard_REC'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = True
      WholeRow = True
    end
    object dxbrPPECHASolder: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = #201'ch'#233'ances '#224' solder'
      CaptionButtons = <>
      DockControl = dxBarDockControl3
      DockedDockControl = dxBarDockControl3
      DockedLeft = 0
      DockedTop = 0
      FloatLeft = 1028
      FloatTop = 8
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisCOMMA3'
        end
        item
          Visible = True
          ItemName = 'btnVisPOCDE3'
        end
        item
          Visible = True
          ItemName = 'btnVisPPECH3'
        end
        item
          Visible = True
          ItemName = 'btnPPECHASolder_REC'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = True
      WholeRow = True
    end
    object dxbrDDL_A_CREER: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = 'DDL '#224' cr'#233'er'
      CaptionButtons = <>
      DockedDockingStyle = dsTop
      DockedLeft = 0
      DockedTop = 0
      DockingStyle = dsTop
      FloatLeft = 1028
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisCOMMA4'
        end
        item
          Visible = True
          ItemName = 'btnVisPOCDE4'
        end
        item
          Visible = True
          ItemName = 'btnVisPPECH4'
        end
        item
          Visible = True
          ItemName = 'btnDDL_A_CREER_REC'
        end
        item
          Visible = True
          ItemName = 'dxbsDATEMAD1'
        end
        item
          Visible = True
          ItemName = 'dxbsDATEMAD2'
        end
        item
          Visible = True
          ItemName = 'dxbsDATEMAD3'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = False
      WholeRow = True
    end
    object dxbrPPECHAFader: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = #201'ch'#233'ances '#224' fader'
      CaptionButtons = <>
      DockControl = dxBarDockControl5
      DockedDockControl = dxBarDockControl5
      DockedLeft = 0
      DockedTop = 0
      FloatLeft = 1376
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisCOMMA5'
        end
        item
          Visible = True
          ItemName = 'btnVisPOCDE5'
        end
        item
          Visible = True
          ItemName = 'btnVisPPECH5'
        end
        item
          Visible = True
          ItemName = 'btnPPECHAFader'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = True
      WholeRow = True
    end
    object dxbrDEEXP_ST_0: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = 'DDL En cours'
      CaptionButtons = <>
      DockedDockingStyle = dsTop
      DockedLeft = 0
      DockedTop = 0
      DockingStyle = dsTop
      FloatLeft = 1443
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 1
      UseOwnFont = False
      Visible = False
      WholeRow = True
    end
    object dxbrDEEXP_ST_2: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = 'DDL Pr'#233'par'#233'es'
      CaptionButtons = <>
      DockedDockingStyle = dsTop
      DockedLeft = 0
      DockedTop = 0
      DockingStyle = dsTop
      FloatLeft = 1443
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = False
      WholeRow = True
    end
    object dxbrDDF_ECHANT: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = #201'chantillonnage verrier '#224' venir'
      CaptionButtons = <>
      DockControl = dxBarDockControl6
      DockedDockControl = dxBarDockControl6
      DockedLeft = 0
      DockedTop = 0
      FloatLeft = 1443
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisDDF_ECHANT_DMFAB'
        end
        item
          Visible = True
          ItemName = 'btnDDF_Echant_REC'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = True
      WholeRow = True
    end
    object dxbrDMBAT_TYP0: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = 'BAT Papier '#224' venir'
      CaptionButtons = <>
      DockControl = dxBarDockControl7
      DockedDockControl = dxBarDockControl7
      DockedLeft = 0
      DockedTop = 0
      FloatLeft = 1228
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisCDCFO1'
        end
        item
          Visible = True
          ItemName = 'btnVisDMBAT1'
        end
        item
          Visible = True
          ItemName = 'btnDMBAType0'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = True
      WholeRow = True
    end
    object dxbrDMBAT_TYPE1: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = 'BAT Verre '#224' venir'
      CaptionButtons = <>
      DockControl = dxBarDockControl8
      DockedDockControl = dxBarDockControl8
      DockedLeft = 0
      DockedTop = 0
      FloatLeft = 1228
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisCDCFO2'
        end
        item
          Visible = True
          ItemName = 'btnVisDMBAT2'
        end
        item
          Visible = True
          ItemName = 'btnDMBATType1'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = True
      WholeRow = True
    end
    object dxbrPOCDE_DECOR: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = 'Postes D'#233'cors / Lots supports '#224' attacher'
      CaptionButtons = <>
      DockControl = dxBarDockControl9
      DockedDockControl = dxBarDockControl9
      DockedLeft = 0
      DockedTop = 0
      FloatLeft = 1461
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisCOMMA6'
        end
        item
          Visible = True
          ItemName = 'btnVisPOCDE6'
        end
        item
          Visible = True
          ItemName = 'btnVisPPECH6'
        end
        item
          Visible = True
          ItemName = 'btnPOCDEDecor_REC'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = True
      WholeRow = True
    end
    object dxbrOFFRE_ST_0: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = 'Offre '#224' '#233'mettre'
      CaptionButtons = <>
      DockControl = dxBarDockControl10
      DockedDockControl = dxBarDockControl10
      DockedLeft = 0
      DockedTop = 0
      FloatLeft = 1238
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisOFFRE_ST_0'
        end
        item
          Visible = True
          ItemName = 'btnOffreSt0_REC'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = True
      WholeRow = True
    end
    object dxbrOFFRE_A_RELANCER: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = 'Offres '#224' relancer'
      CaptionButtons = <>
      DockControl = dxBarDockControl11
      DockedDockControl = dxBarDockControl11
      DockedLeft = 0
      DockedTop = 0
      FloatLeft = 1238
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisOFFRE_A_RELANCER'
        end
        item
          Visible = True
          ItemName = 'dxLimitDateRElance'
        end
        item
          Visible = True
          ItemName = 'btnOffreARelancer_REC'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = True
      WholeRow = True
    end
    object dxbrPCDAG_A_TRAITER: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = 'Commandes d'#39'achat '#224' traiter'
      CaptionButtons = <>
      DockControl = dxBarDockControl12
      DockedDockControl = dxBarDockControl12
      DockedLeft = 0
      DockedTop = 0
      FloatLeft = 1238
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisCDACG'
        end
        item
          Visible = True
          ItemName = 'btnVisPCDAG'
        end
        item
          Visible = True
          ItemName = 'btnPCDAGATraiter_REC'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = True
      WholeRow = True
    end
    object dxbrSTOCKS_2ANS: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = 'Stocks > 2 ans'
      CaptionButtons = <>
      DockedDockingStyle = dsTop
      DockedLeft = 0
      DockedTop = 0
      DockingStyle = dsTop
      FloatLeft = 1238
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisCOMMA7'
        end
        item
          Visible = True
          ItemName = 'btnVisPOCDE7'
        end
        item
          Visible = True
          ItemName = 'btnVisPPECH7'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = False
      WholeRow = True
    end
    object dxbrTARIF_ANOMALIE: TdxBar
      AllowClose = False
      AllowCustomizing = False
      AllowQuickCustomizing = False
      AllowReset = False
      Caption = 'Custom 1'
      CaptionButtons = <>
      DockControl = dxBarDockControl1
      DockedDockControl = dxBarDockControl1
      DockedLeft = 0
      DockedTop = 0
      FloatLeft = 1289
      FloatTop = 10
      FloatClientWidth = 0
      FloatClientHeight = 0
      ItemLinks = <
        item
          Visible = True
          ItemName = 'btnVisTARIF_ANOMA'
        end>
      NotDocking = [dsNone, dsLeft, dsTop, dsRight, dsBottom]
      OneOnRow = True
      Row = 0
      UseOwnFont = False
      Visible = True
      WholeRow = True
    end
    object btnVisCOMMA1: TdxBarButton
      Caption = 'Commande'
      Category = 0
      Hint = 'Commande'
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D360400000000000036000000280000001000000010000000010020000000
        000000000000C40E0000C40E00000000000000000000FFFFFFFFFFFFFFFFFFFF
        FFFFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9
        A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B1
        BFFF28B3BFFF28B1BFFF28B3BFFF28B1BFFF28B1BFFF28B1BFFF28B3BFFF28B1
        BFFF28B3BFFF28B3BFFF28B1BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B5
        C0FF2CE0D0FF2CE0D0FF2CE0D0FF2CE1D0FF2CE1D0FF2CE0D0FF2CE0D0FF2CE1
        D0FF2CE0D1FF2CE1D0FF28B4BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B8
        C0FF2CE1D1FF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5
        CBFF2CD5CBFF2CE1D1FF28B8C1FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BB
        C2FF2CE1D2FF26B8C1FF26B8C1FF26BCC3FF26BCC3FF26BCC3FF26BCC3FF26BA
        C2FF26B8C1FF2CE1D1FF29BBC2FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BF
        C3FF2CE1D3FF2CDCCEFF2CE1D3FF2CE1D3FF2DE1D3FF2CE1D3FF2DE1D3FF2DE1
        D3FF2CDCCEFF2DE1D3FF29BFC3FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC2
        C5FF2CE1D3FF27BEC5FF27BFC6FF27BFC6FF27C1C6FF27BFC6FF27C1C6FF27BF
        C6FF27BFC5FF2CE1D4FF2AC2C5FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC6
        C6FF2CE1D5FF2DE1D5FF2DE1D4FF2DE1D5FF2CE1D5FF2CE1D4FF2CE1D5FF2CE1
        D3FF2CE0D3FF2CE0D3FF2AC6C6FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2BCA
        C7FF2CE1D5FF28C5C7FF28C5C7FF28C5C7FF28C3C7FF26BFC6FF26BEC5FF26BC
        C5FF26BEC5FF2DE1D5FF2ACAC7FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CCE
        C8FF2DE1D5FF2CE1D5FF2DE1D5FF2DE1D5FF2CE1D5FF2CD8D0FF2ACDCCFF29CB
        CBFF29CACBFF29C9CAFF2BCEC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD1
        CAFF2DE1D6FF28C9CAFF28C8CAFF28C9CAFF28C6CAFF25B8C3FF25B4C0FF25B3
        C1FF25B3C1FF28C1C7FF2BCBC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD5
        CCFF2DE1D7FF2CE1D7FF2DE1D7FF2DE1D7FF2CE1D6FF29CDCCFF2EE1E1FF2EE1
        E1FF2DE1E0FF36E1DCFF2BCEC9FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CD8
        CCFF2DE1D7FF28CDCCFF28CDCCFF28CDCCFF28CBCCFF27C2C6FF2EE1E1FF2EE1
        DFFF36E1DCFF2CD1CAFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDB
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D8FF2CE1D7FF2BD9D1FF2EE1DFFF33E1
        DBFF2CD8CCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDC
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D7FF2AD7D0FF2DE1D8FF2CDC
        CEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDF
        CFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFFFFFF
        FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
      PaintStyle = psCaptionGlyph
    end
    object btnVisPOCDE1: TdxBarButton
      Caption = 'Poste de commande'
      Category = 0
      Hint = 'Poste de commande'
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D360400000000000036000000280000001000000010000000010020000000
        000000000000C40E0000C40E00000000000000000000FFFFFFFFFFFFFFFFFFFF
        FFFFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9
        A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B1
        BFFF28B3BFFF28B1BFFF28B3BFFF28B1BFFF28B1BFFF28B1BFFF28B3BFFF28B1
        BFFF28B3BFFF28B3BFFF28B1BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B5
        C0FF2CE0D0FF2CE0D0FF2CE0D0FF2CE1D0FF2CE1D0FF2CE0D0FF2CE0D0FF2CE1
        D0FF2CE0D1FF2CE1D0FF28B4BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B8
        C0FF2CE1D1FF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5
        CBFF2CD5CBFF2CE1D1FF28B8C1FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BB
        C2FF2CE1D2FF26B8C1FF26B8C1FF26BCC3FF26BCC3FF26BCC3FF26BCC3FF26BA
        C2FF26B8C1FF2CE1D1FF29BBC2FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BF
        C3FF2CE1D3FF2CDCCEFF2CE1D3FF2CE1D3FF2DE1D3FF2CE1D3FF2DE1D3FF2DE1
        D3FF2CDCCEFF2DE1D3FF29BFC3FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC2
        C5FF2CE1D3FF27BEC5FF27BFC6FF27BFC6FF27C1C6FF27BFC6FF27C1C6FF27BF
        C6FF27BFC5FF2CE1D4FF2AC2C5FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC6
        C6FF2CE1D5FF2DE1D5FF2DE1D4FF2DE1D5FF2CE1D5FF2CE1D4FF2CE1D5FF2CE1
        D3FF2CE0D3FF2CE0D3FF2AC6C6FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2BCA
        C7FF2CE1D5FF28C5C7FF28C5C7FF28C5C7FF28C3C7FF26BFC6FF26BEC5FF26BC
        C5FF26BEC5FF2DE1D5FF2ACAC7FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CCE
        C8FF2DE1D5FF2CE1D5FF2DE1D5FF2DE1D5FF2CE1D5FF2CD8D0FF2ACDCCFF29CB
        CBFF29CACBFF29C9CAFF2BCEC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD1
        CAFF2DE1D6FF28C9CAFF28C8CAFF28C9CAFF28C6CAFF25B8C3FF25B4C0FF25B3
        C1FF25B3C1FF28C1C7FF2BCBC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD5
        CCFF2DE1D7FF2CE1D7FF2DE1D7FF2DE1D7FF2CE1D6FF29CDCCFF2EE1E1FF2EE1
        E1FF2DE1E0FF36E1DCFF2BCEC9FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CD8
        CCFF2DE1D7FF28CDCCFF28CDCCFF28CDCCFF28CBCCFF27C2C6FF2EE1E1FF2EE1
        DFFF36E1DCFF2CD1CAFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDB
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D8FF2CE1D7FF2BD9D1FF2EE1DFFF33E1
        DBFF2CD8CCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDC
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D7FF2AD7D0FF2DE1D8FF2CDC
        CEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDF
        CFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFFFFFF
        FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
      PaintStyle = psCaptionGlyph
    end
    object btnVisCOMMA2: TdxBarButton
      Caption = 'Commande'
      Category = 0
      Hint = 'Commande'
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D360400000000000036000000280000001000000010000000010020000000
        000000000000C40E0000C40E00000000000000000000FFFFFFFFFFFFFFFFFFFF
        FFFFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9
        A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B1
        BFFF28B3BFFF28B1BFFF28B3BFFF28B1BFFF28B1BFFF28B1BFFF28B3BFFF28B1
        BFFF28B3BFFF28B3BFFF28B1BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B5
        C0FF2CE0D0FF2CE0D0FF2CE0D0FF2CE1D0FF2CE1D0FF2CE0D0FF2CE0D0FF2CE1
        D0FF2CE0D1FF2CE1D0FF28B4BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B8
        C0FF2CE1D1FF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5
        CBFF2CD5CBFF2CE1D1FF28B8C1FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BB
        C2FF2CE1D2FF26B8C1FF26B8C1FF26BCC3FF26BCC3FF26BCC3FF26BCC3FF26BA
        C2FF26B8C1FF2CE1D1FF29BBC2FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BF
        C3FF2CE1D3FF2CDCCEFF2CE1D3FF2CE1D3FF2DE1D3FF2CE1D3FF2DE1D3FF2DE1
        D3FF2CDCCEFF2DE1D3FF29BFC3FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC2
        C5FF2CE1D3FF27BEC5FF27BFC6FF27BFC6FF27C1C6FF27BFC6FF27C1C6FF27BF
        C6FF27BFC5FF2CE1D4FF2AC2C5FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC6
        C6FF2CE1D5FF2DE1D5FF2DE1D4FF2DE1D5FF2CE1D5FF2CE1D4FF2CE1D5FF2CE1
        D3FF2CE0D3FF2CE0D3FF2AC6C6FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2BCA
        C7FF2CE1D5FF28C5C7FF28C5C7FF28C5C7FF28C3C7FF26BFC6FF26BEC5FF26BC
        C5FF26BEC5FF2DE1D5FF2ACAC7FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CCE
        C8FF2DE1D5FF2CE1D5FF2DE1D5FF2DE1D5FF2CE1D5FF2CD8D0FF2ACDCCFF29CB
        CBFF29CACBFF29C9CAFF2BCEC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD1
        CAFF2DE1D6FF28C9CAFF28C8CAFF28C9CAFF28C6CAFF25B8C3FF25B4C0FF25B3
        C1FF25B3C1FF28C1C7FF2BCBC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD5
        CCFF2DE1D7FF2CE1D7FF2DE1D7FF2DE1D7FF2CE1D6FF29CDCCFF2EE1E1FF2EE1
        E1FF2DE1E0FF36E1DCFF2BCEC9FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CD8
        CCFF2DE1D7FF28CDCCFF28CDCCFF28CDCCFF28CBCCFF27C2C6FF2EE1E1FF2EE1
        DFFF36E1DCFF2CD1CAFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDB
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D8FF2CE1D7FF2BD9D1FF2EE1DFFF33E1
        DBFF2CD8CCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDC
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D7FF2AD7D0FF2DE1D8FF2CDC
        CEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDF
        CFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFFFFFF
        FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
      PaintStyle = psCaptionGlyph
      OnClick = btnVisCOMMA2Click
    end
    object btnVisPOCDE2: TdxBarButton
      Caption = 'Poste de commande'
      Category = 0
      Hint = 'Poste de commande'
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D360400000000000036000000280000001000000010000000010020000000
        000000000000C40E0000C40E00000000000000000000FFFFFFFFFFFFFFFFFFFF
        FFFFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9
        A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B1
        BFFF28B3BFFF28B1BFFF28B3BFFF28B1BFFF28B1BFFF28B1BFFF28B3BFFF28B1
        BFFF28B3BFFF28B3BFFF28B1BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B5
        C0FF2CE0D0FF2CE0D0FF2CE0D0FF2CE1D0FF2CE1D0FF2CE0D0FF2CE0D0FF2CE1
        D0FF2CE0D1FF2CE1D0FF28B4BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B8
        C0FF2CE1D1FF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5
        CBFF2CD5CBFF2CE1D1FF28B8C1FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BB
        C2FF2CE1D2FF26B8C1FF26B8C1FF26BCC3FF26BCC3FF26BCC3FF26BCC3FF26BA
        C2FF26B8C1FF2CE1D1FF29BBC2FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BF
        C3FF2CE1D3FF2CDCCEFF2CE1D3FF2CE1D3FF2DE1D3FF2CE1D3FF2DE1D3FF2DE1
        D3FF2CDCCEFF2DE1D3FF29BFC3FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC2
        C5FF2CE1D3FF27BEC5FF27BFC6FF27BFC6FF27C1C6FF27BFC6FF27C1C6FF27BF
        C6FF27BFC5FF2CE1D4FF2AC2C5FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC6
        C6FF2CE1D5FF2DE1D5FF2DE1D4FF2DE1D5FF2CE1D5FF2CE1D4FF2CE1D5FF2CE1
        D3FF2CE0D3FF2CE0D3FF2AC6C6FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2BCA
        C7FF2CE1D5FF28C5C7FF28C5C7FF28C5C7FF28C3C7FF26BFC6FF26BEC5FF26BC
        C5FF26BEC5FF2DE1D5FF2ACAC7FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CCE
        C8FF2DE1D5FF2CE1D5FF2DE1D5FF2DE1D5FF2CE1D5FF2CD8D0FF2ACDCCFF29CB
        CBFF29CACBFF29C9CAFF2BCEC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD1
        CAFF2DE1D6FF28C9CAFF28C8CAFF28C9CAFF28C6CAFF25B8C3FF25B4C0FF25B3
        C1FF25B3C1FF28C1C7FF2BCBC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD5
        CCFF2DE1D7FF2CE1D7FF2DE1D7FF2DE1D7FF2CE1D6FF29CDCCFF2EE1E1FF2EE1
        E1FF2DE1E0FF36E1DCFF2BCEC9FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CD8
        CCFF2DE1D7FF28CDCCFF28CDCCFF28CDCCFF28CBCCFF27C2C6FF2EE1E1FF2EE1
        DFFF36E1DCFF2CD1CAFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDB
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D8FF2CE1D7FF2BD9D1FF2EE1DFFF33E1
        DBFF2CD8CCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDC
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D7FF2AD7D0FF2DE1D8FF2CDC
        CEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDF
        CFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFFFFFF
        FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
      PaintStyle = psCaptionGlyph
      OnClick = btnVisPOCDE2Click
    end
    object btnVisCOMMA3: TdxBarButton
      Caption = 'Commande'
      Category = 0
      Hint = 'Commande'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisCOMMA3Click
    end
    object btnVisPOCDE3: TdxBarButton
      Caption = 'Poste de commande'
      Category = 0
      Hint = 'Poste de commande'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisPOCDE3Click
    end
    object btnVisPOCDE4: TdxBarButton
      Caption = 'Poste de commande'
      Category = 0
      Hint = 'Poste de commande'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
    end
    object btnVisCOMMA4: TdxBarButton
      Caption = 'Commande'
      Category = 0
      Hint = 'Commande'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
    end
    object btnVisCOMMA5: TdxBarButton
      Caption = 'Commande'
      Category = 0
      Hint = 'Commande'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisCOMMA5Click
    end
    object btnVisPOCDE5: TdxBarButton
      Caption = 'Poste de commande'
      Category = 0
      Hint = 'Poste de commande'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisPOCDE5Click
    end
    object dxbsDATEMAD1: TdxBarStatic
      Caption = 'Date MAD < Date du jour'
      Category = 0
      Hint = 'Date MAD < Date du jour'
      Style = stCellRouge
      Visible = ivAlways
      LeftIndent = 10
      RightIndent = 1
    end
    object dxbsDATEMAD2: TdxBarStatic
      Caption = 'Date MAD dans les 10 jours'
      Category = 0
      Hint = 'Date MAD dans les 10 jours'
      Style = stCellJaune
      Visible = ivAlways
    end
    object dxbsDATEMAD3: TdxBarStatic
      Caption = 'Date MAD > 10 jours'
      Category = 0
      Hint = 'Date MAD > 10 jours'
      Style = stCellVert
      Visible = ivAlways
    end
    object btnVisDDF_ECHANT_DMFAB: TdxBarButton
      Caption = 'Demande de fabrication'
      Category = 0
      Hint = 'Demande de fabrication'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisDDF_ECHANT_DMFABClick
    end
    object btnVisCDCFO1: TdxBarButton
      Caption = 'Cahier des charges'
      Category = 0
      Hint = 'Cahier des charges'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisCDCFO1Click
    end
    object btnVisDMBAT1: TdxBarButton
      Caption = 'Demande de BAT'
      Category = 0
      Hint = 'Demande de BAT'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisDMBAT1Click
    end
    object btnVisCDCFO2: TdxBarButton
      Caption = 'Cahier des charges'
      Category = 0
      Hint = 'Cahier des charges'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisCDCFO2Click
    end
    object btnVisDMBAT2: TdxBarButton
      Caption = 'Demande de BAT'
      Category = 0
      Hint = 'Demande de BAT'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisDMBAT2Click
    end
    object btnVisCOMMA6: TdxBarButton
      Caption = 'Commande'
      Category = 0
      Hint = 'Commande'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisCOMMA6Click
    end
    object btnVisPOCDE6: TdxBarButton
      Caption = 'Poste de commande'
      Category = 0
      Hint = 'Poste de commande'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisPOCDE6Click
    end
    object btnVisOFFRE_ST_0: TdxBarButton
      Caption = 'Offre de prix'
      Category = 0
      Hint = 'Offre de prix'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisOFFRE_ST_0Click
    end
    object btnVisOFFRE_A_RELANCER: TdxBarButton
      Caption = 'Offre de prix'
      Category = 0
      Hint = 'Offre de prix'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisOFFRE_A_RELANCERClick
    end
    object btnVisPCDAG: TdxBarButton
      Caption = 'Poste de commande d'#39'achat'
      Category = 0
      Hint = 'Poste de commande d'#39'achat'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisPCDAGClick
    end
    object btnVisCDACG: TdxBarButton
      Caption = 'Commande d'#39'achat'
      Category = 0
      Hint = 'Commande d'#39'achat'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisCDACGClick
    end
    object dxbsLimiteTrait: TdxBarStatic
      Caption = 'Date limite de traitement < Date du jour'
      Category = 0
      Hint = 'Date limite de traitement < Date du jour'
      Style = stCellRouge
      Visible = ivAlways
    end
    object btnVisPPECH1: TdxBarButton
      Caption = #201'ch'#233'ancier'
      Category = 0
      Hint = #201'ch'#233'ancier'
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D360400000000000036000000280000001000000010000000010020000000
        000000000000C40E0000C40E00000000000000000000FFFFFFFFFFFFFFFFFFFF
        FFFFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9
        A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B1
        BFFF28B3BFFF28B1BFFF28B3BFFF28B1BFFF28B1BFFF28B1BFFF28B3BFFF28B1
        BFFF28B3BFFF28B3BFFF28B1BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B5
        C0FF2CE0D0FF2CE0D0FF2CE0D0FF2CE1D0FF2CE1D0FF2CE0D0FF2CE0D0FF2CE1
        D0FF2CE0D1FF2CE1D0FF28B4BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B8
        C0FF2CE1D1FF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5
        CBFF2CD5CBFF2CE1D1FF28B8C1FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BB
        C2FF2CE1D2FF26B8C1FF26B8C1FF26BCC3FF26BCC3FF26BCC3FF26BCC3FF26BA
        C2FF26B8C1FF2CE1D1FF29BBC2FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BF
        C3FF2CE1D3FF2CDCCEFF2CE1D3FF2CE1D3FF2DE1D3FF2CE1D3FF2DE1D3FF2DE1
        D3FF2CDCCEFF2DE1D3FF29BFC3FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC2
        C5FF2CE1D3FF27BEC5FF27BFC6FF27BFC6FF27C1C6FF27BFC6FF27C1C6FF27BF
        C6FF27BFC5FF2CE1D4FF2AC2C5FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC6
        C6FF2CE1D5FF2DE1D5FF2DE1D4FF2DE1D5FF2CE1D5FF2CE1D4FF2CE1D5FF2CE1
        D3FF2CE0D3FF2CE0D3FF2AC6C6FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2BCA
        C7FF2CE1D5FF28C5C7FF28C5C7FF28C5C7FF28C3C7FF26BFC6FF26BEC5FF26BC
        C5FF26BEC5FF2DE1D5FF2ACAC7FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CCE
        C8FF2DE1D5FF2CE1D5FF2DE1D5FF2DE1D5FF2CE1D5FF2CD8D0FF2ACDCCFF29CB
        CBFF29CACBFF29C9CAFF2BCEC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD1
        CAFF2DE1D6FF28C9CAFF28C8CAFF28C9CAFF28C6CAFF25B8C3FF25B4C0FF25B3
        C1FF25B3C1FF28C1C7FF2BCBC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD5
        CCFF2DE1D7FF2CE1D7FF2DE1D7FF2DE1D7FF2CE1D6FF29CDCCFF2EE1E1FF2EE1
        E1FF2DE1E0FF36E1DCFF2BCEC9FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CD8
        CCFF2DE1D7FF28CDCCFF28CDCCFF28CDCCFF28CBCCFF27C2C6FF2EE1E1FF2EE1
        DFFF36E1DCFF2CD1CAFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDB
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D8FF2CE1D7FF2BD9D1FF2EE1DFFF33E1
        DBFF2CD8CCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDC
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D7FF2AD7D0FF2DE1D8FF2CDC
        CEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDF
        CFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFFFFFF
        FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
      PaintStyle = psCaptionGlyph
    end
    object btnVisPPECH2: TdxBarButton
      Caption = #201'ch'#233'ancier'
      Category = 0
      Hint = #201'ch'#233'ancier'
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D360400000000000036000000280000001000000010000000010020000000
        000000000000C40E0000C40E00000000000000000000FFFFFFFFFFFFFFFFFFFF
        FFFFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9
        A9FFA9A9A9FFA9A9A9FFA9A9A9FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B1
        BFFF28B3BFFF28B1BFFF28B3BFFF28B1BFFF28B1BFFF28B1BFFF28B3BFFF28B1
        BFFF28B3BFFF28B3BFFF28B1BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B5
        C0FF2CE0D0FF2CE0D0FF2CE0D0FF2CE1D0FF2CE1D0FF2CE0D0FF2CE0D0FF2CE1
        D0FF2CE0D1FF2CE1D0FF28B4BFFFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF28B8
        C0FF2CE1D1FF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5CBFF2CD5
        CBFF2CD5CBFF2CE1D1FF28B8C1FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BB
        C2FF2CE1D2FF26B8C1FF26B8C1FF26BCC3FF26BCC3FF26BCC3FF26BCC3FF26BA
        C2FF26B8C1FF2CE1D1FF29BBC2FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF29BF
        C3FF2CE1D3FF2CDCCEFF2CE1D3FF2CE1D3FF2DE1D3FF2CE1D3FF2DE1D3FF2DE1
        D3FF2CDCCEFF2DE1D3FF29BFC3FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC2
        C5FF2CE1D3FF27BEC5FF27BFC6FF27BFC6FF27C1C6FF27BFC6FF27C1C6FF27BF
        C6FF27BFC5FF2CE1D4FF2AC2C5FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2AC6
        C6FF2CE1D5FF2DE1D5FF2DE1D4FF2DE1D5FF2CE1D5FF2CE1D4FF2CE1D5FF2CE1
        D3FF2CE0D3FF2CE0D3FF2AC6C6FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2BCA
        C7FF2CE1D5FF28C5C7FF28C5C7FF28C5C7FF28C3C7FF26BFC6FF26BEC5FF26BC
        C5FF26BEC5FF2DE1D5FF2ACAC7FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CCE
        C8FF2DE1D5FF2CE1D5FF2DE1D5FF2DE1D5FF2CE1D5FF2CD8D0FF2ACDCCFF29CB
        CBFF29CACBFF29C9CAFF2BCEC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD1
        CAFF2DE1D6FF28C9CAFF28C8CAFF28C9CAFF28C6CAFF25B8C3FF25B4C0FF25B3
        C1FF25B3C1FF28C1C7FF2BCBC8FFA9A9A9FFFFFFFFFFFFFFFFFFFFFFFFFF2CD5
        CCFF2DE1D7FF2CE1D7FF2DE1D7FF2DE1D7FF2CE1D6FF29CDCCFF2EE1E1FF2EE1
        E1FF2DE1E0FF36E1DCFF2BCEC9FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CD8
        CCFF2DE1D7FF28CDCCFF28CDCCFF28CDCCFF28CBCCFF27C2C6FF2EE1E1FF2EE1
        DFFF36E1DCFF2CD1CAFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDB
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D8FF2CE1D7FF2BD9D1FF2EE1DFFF33E1
        DBFF2CD8CCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDC
        CEFF2DE1D8FF2DE1D8FF2DE1D8FF2DE1D8FF2CE1D7FF2AD7D0FF2DE1D8FF2CDC
        CEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2CDF
        CFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFF2CDFCFFFFFFF
        FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
      PaintStyle = psCaptionGlyph
      OnClick = btnVisPPECH2Click
    end
    object btnVisPPECH3: TdxBarButton
      Caption = #201'ch'#233'ancier'
      Category = 0
      Hint = #201'ch'#233'ancier'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisPPECH3Click
    end
    object btnVisPPECH4: TdxBarButton
      Caption = #201'ch'#233'ancier'
      Category = 0
      Hint = #201'ch'#233'ancier'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
    end
    object btnVisPPECH5: TdxBarButton
      Caption = #201'ch'#233'ancier'
      Category = 0
      Hint = #201'ch'#233'ancier'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisPPECH5Click
    end
    object btnVisPPECH6: TdxBarButton
      Caption = #201'ch'#233'ancier'
      Category = 0
      Hint = #201'ch'#233'ancier'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisPPECH6Click
    end
    object btnVisCOMMA7: TdxBarButton
      Caption = 'Commande'
      Category = 0
      Hint = 'Commande'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
    end
    object btnVisPOCDE7: TdxBarButton
      Caption = 'Poste de commande'
      Category = 0
      Hint = 'Poste de commande'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
    end
    object btnVisPPECH7: TdxBarButton
      Caption = #201'ch'#233'ancier'
      Category = 0
      Hint = #201'ch'#233'ancier'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
    end
    object dxLimitDateRElance: TdxBarStatic
      Caption = 'Date relance < Date du jour '
      Category = 0
      Hint = 'Date relance < Date du jour '
      Style = stCellRouge
      Visible = ivAlways
    end
    object btnTarif_Anomalie_REC: TdxBarButton
      Caption = 'New Button'
      Category = 0
      Hint = 'New Button'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnTarif_Anomalie_RECClick
    end
    object btnPPECH_REC: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
    end
    object btnPPECHProdRetard_REC: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
      OnClick = btnPPECHProdRetard_RECClick
    end
    object btnPPECHASolder_REC: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
      OnClick = btnPPECHASolder_RECClick
    end
    object btnDDL_A_CREER_REC: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
    end
    object btnPPECHAFader: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
      OnClick = btnPPECHAFaderClick
    end
    object btnDDF_Echant_REC: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
      OnClick = btnDDF_Echant_RECClick
    end
    object btnDMBAType0: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
      OnClick = btnDMBAType0Click
    end
    object btnDMBATType1: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
      OnClick = btnDMBATType1Click
    end
    object btnPOCDEDecor_REC: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
      OnClick = btnPOCDEDecor_RECClick
    end
    object btnOffreSt0_REC: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
      OnClick = btnOffreSt0_RECClick
    end
    object btnOffreARelancer_REC: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
      OnClick = btnOffreARelancer_RECClick
    end
    object btnPCDAGATraiter_REC: TdxBarButton
      Category = 0
      Visible = ivAlways
      Glyph.SourceDPI = 96
      Glyph.Data = {
        424D760600000000000036000000280000001400000014000000010020000000
        000000000000C40E0000C40E00000000000000000000C6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD00
        00FFC6C3C6FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFBD0000FFC6C3C6FFBD00
        00FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF000000FF000000FF0000
        00FFBD0000FFC6C3C6FFBD0000FFBD0000FFBD0000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF848284FFBD0000FFBD0000FFBD00
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFFFFFFFFF848284FF000000FF848284FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFFFFFFFFF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FFC6C3C6FFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFFFFFFFFFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF0000
        00FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FF000000FFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF000000FF848284FFFFFF
        FFFFFFFFFFFFFFFFFFFFC6C3C6FFC6C3C6FFC6C3C6FF848284FF000000FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FF000000FF000000FF000000FF000000FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3
        C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FFC6C3C6FF}
      OnClick = btnPCDAGATraiter_RECClick
    end
    object btnVisTARIF_ANOMA: TdxBarButton
      Caption = 'Tarif'
      Category = 0
      Hint = 'Tarif'
      Visible = ivAlways
      ImageIndex = 0
      PaintStyle = psCaptionGlyph
      OnClick = btnVisTARIF_ANOMAClick
    end
  end
  object qryPPECHProdRetard: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '    IDT COMMA_ID, '
      '    IDT COMMA_NUM, '
      '    IDT COMMA_VERSI,'
      '    IDT COMMA_ST,'
      '    DESI COMMA_ST_DES,'
      '    IDT POCDE_ID, '
      '    IDT POCDE_NUM,  '
      '    IDT POCDE_TYP_POSTE,'
      '    DESI POCDE_TYP_POSTE_DES,'
      '    DESI POCDE_REF,'
      '    IDT PPECH_ID, '
      '    DAT PPECH_DATE, '
      '    IDT TIERS_ID, '
      '    CODE TIERS_CODE, '
      '    DESI TIERS_RS_L1, '
      '    IDT PRCDT_ID, '
      '    DESI PRCDT_DES, '
      '    IDT PRCDT_MODE_GES,'
      '    DESI PRCDT_MODE_GES_DES, '
      '    DAT DMDAP_DATE_VALIDITE, '
      '    CODE ADM_TRIG'
      'FROM '
      '    FDATA')
    Left = 1316
    Top = 539
    object qryPPECHProdRetardCOMMA_ID: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_ID'
    end
    object qryPPECHProdRetardCOMMA_NUM: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_NUM'
    end
    object qryPPECHProdRetardCOMMA_VERSI: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_VERSI'
    end
    object qryPPECHProdRetardCOMMA_ST: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_ST'
    end
    object qryPPECHProdRetardCOMMA_ST_DES: TWideStringField
      Alignment = taCenter
      FieldName = 'COMMA_ST_DES'
      Size = 50
    end
    object qryPPECHProdRetardPOCDE_ID: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_ID'
    end
    object qryPPECHProdRetardPOCDE_NUM: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_NUM'
    end
    object qryPPECHProdRetardPOCDE_TYP_POSTE: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_TYP_POSTE'
    end
    object qryPPECHProdRetardPOCDE_TYP_POSTE_DES: TWideStringField
      Alignment = taCenter
      FieldName = 'POCDE_TYP_POSTE_DES'
      Size = 50
    end
    object qryPPECHProdRetardPOCDE_REF: TWideStringField
      Alignment = taCenter
      FieldName = 'POCDE_REF'
      Size = 50
    end
    object qryPPECHProdRetardPPECH_ID: TFloatField
      Alignment = taCenter
      FieldName = 'PPECH_ID'
    end
    object qryPPECHProdRetardPPECH_DATE: TDateTimeField
      Alignment = taCenter
      FieldName = 'PPECH_DATE'
    end
    object qryPPECHProdRetardPPECH_DATE_PREV: TDateTimeField
      Alignment = taCenter
      FieldName = 'ORFAB_DATE_FAB_PREV'
    end
    object qryPPECHProdRetardTIERS_ID: TFloatField
      FieldName = 'TIERS_ID'
    end
    object qryPPECHProdRetardTIERS_CODE: TWideStringField
      FieldName = 'TIERS_CODE'
      Size = 10
    end
    object qryPPECHProdRetardTIERS_RS_L1: TWideStringField
      FieldName = 'TIERS_RS_L1'
      Size = 50
    end
    object qryPPECHProdRetardPRCDT_ID: TFloatField
      Alignment = taCenter
      FieldName = 'PRCDT_ID'
    end
    object qryPPECHProdRetardPRCDT_DES: TWideStringField
      FieldName = 'PRCDT_DES'
      Size = 50
    end
    object qryPPECHProdRetardPRCDT_MODE_GES: TFloatField
      FieldName = 'PRCDT_MODE_GES'
    end
    object qryPPECHProdRetardPRCDT_MODE_GES_DES: TWideStringField
      FieldName = 'PRCDT_MODE_GES_DES'
      Size = 50
    end
    object qryPPECHProdRetardDMDAP_DATE_VALIDITE: TDateTimeField
      FieldName = 'DMDAP_DATE_VALIDITE'
    end
    object qryPPECHProdRetardADM_TRIG: TWideStringField
      FieldName = 'ADM_TRIG'
      Size = 10
    end
  end
  object dsPPECHProdRetard: TDataSource
    DataSet = qryPPECHProdRetard
    Left = 1412
    Top = 542
  end
  object qryPPECHASolder: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '    IDT COMMA_ID, '
      '    IDT COMMA_NUM, '
      '    IDT COMMA_VERSI,'
      '    IDT COMMA_ST,'
      '    DESI COMMA_ST_DES,'
      '    IDT POCDE_ID, '
      '    IDT POCDE_NUM, '
      '    IDT POCDE_TYP_POSTE,'
      '    DESI POCDE_TYP_POSTE_DES,'
      '    DESI POCDE_REF,'
      '    IDT PPECH_ID, '
      '    DAT PPECH_DATE, '
      '    IDT PPECH_QTE_ORI, '
      '    IDT PPECH_QTE_TOLER , '
      '    IDT PPECH_QTE_RESV, '
      '    IDT PPECH_QTE_CONSO,'
      '    IDT QTE_EXPEDIEE,'
      '    IDT QTE_A_EXPED, '
      '    IDT SOLDE_A_LIVRER, '
      '    CODE ADM_COLLA_TRIG, '
      '    CODE CDM_COLLA_TRIG,'
      '    DESI TIERS_NOM,'
      '    DESI PRCDT_DES,'
      '    IDT SOLDE_A_COUVRIR,'
      '    FLG NON_A_COUVRIR,'
      '    IDT POCDE_TYP_PRD,'
      '    DAT DENIER_BOLIV,'
      '    ENTI FLG_ECH_SOLDE'
      'FROM '
      '    FDATA')
    Left = 1094
    Top = 547
    object qryPPECHASolderCOMMA_ID: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_ID'
    end
    object qryPPECHASolderCOMMA_NUM: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_NUM'
    end
    object qryPPECHASolderCOMMA_VERSI: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_VERSI'
    end
    object qryPPECHASolderCOMMA_ST: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_ST'
    end
    object qryPPECHASolderCOMMA_ST_DES: TWideStringField
      Alignment = taCenter
      FieldName = 'COMMA_ST_DES'
      Size = 50
    end
    object qryPPECHASolderPOCDE_ID: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_ID'
    end
    object qryPPECHASolderPOCDE_NUM: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_NUM'
    end
    object qryPPECHASolderPOCDE_TYP_POSTE: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_TYP_POSTE'
    end
    object qryPPECHASolderPOCDE_TYP_POSTE_DES: TWideStringField
      Alignment = taCenter
      FieldName = 'POCDE_TYP_POSTE_DES'
      Size = 50
    end
    object qryPPECHASolderPOCDE_REF: TWideStringField
      Alignment = taCenter
      FieldName = 'POCDE_REF'
      Size = 50
    end
    object qryPPECHASolderPPECH_ID: TFloatField
      Alignment = taCenter
      FieldName = 'PPECH_ID'
    end
    object qryPPECHASolderPPECH_DATE: TDateTimeField
      Alignment = taCenter
      FieldName = 'PPECH_DATE'
    end
    object qryPPECHASolderPPECH_QTE_ORI: TFloatField
      FieldName = 'PPECH_QTE_ORI'
      DisplayFormat = ',0'
    end
    object qryPPECHASolderPPECH_QTE_TOLER: TFloatField
      FieldName = 'PPECH_QTE_TOLER'
      DisplayFormat = ',0'
    end
    object qryPPECHASolderPPECH_QTE_RESV: TFloatField
      FieldName = 'PPECH_QTE_RESV'
      DisplayFormat = ',0'
    end
    object qryPPECHASolderPPECH_QTE_CONSO: TFloatField
      FieldName = 'PPECH_QTE_CONSO'
      DisplayFormat = ',0'
    end
    object qryPPECHASolderQTE_EXPEDIEE: TFloatField
      FieldName = 'QTE_EXPEDIEE'
      DisplayFormat = ',0'
    end
    object qryPPECHASolderQTE_A_EXPED: TFloatField
      FieldName = 'QTE_A_EXPED'
      DisplayFormat = ',0'
    end
    object qryPPECHASolderSOLDE_A_LIVRER: TFloatField
      FieldName = 'SOLDE_A_LIVRER'
      DisplayFormat = ',0'
    end
    object qryPPECHASolderADM_COLLA_TRIG: TWideStringField
      FieldName = 'ADM_COLLA_TRIG'
      Size = 10
    end
    object qryPPECHASolderCDM_COLLA_TRIG: TWideStringField
      FieldName = 'CDM_COLLA_TRIG'
      Size = 10
    end
    object qryPPECHASolderTIERS_NOM: TWideStringField
      DisplayLabel = 'Nom Tiers'
      FieldName = 'TIERS_NOM'
      Size = 50
    end
    object qryPPECHASolderPRCDT_DES: TWideStringField
      DisplayLabel = 'Produit'
      FieldName = 'PRCDT_DES'
      Size = 50
    end
    object qryPPECHASolderSOLDE_A_COUVRIR: TFloatField
      DisplayLabel = 'Solde '#224' couvrir'
      FieldName = 'SOLDE_A_COUVRIR'
    end
    object qryPPECHASolderNON_A_COUVRIR: TSmallintField
      DisplayLabel = 'Solde non '#224' couvrir'
      FieldName = 'NON_A_COUVRIR'
    end
    object qryPPECHASolderPOCDE_TYP_PRD: TFloatField
      FieldName = 'POCDE_TYP_PRD'
    end
    object qryPPECHASolderDENIER_BOLIV: TDateTimeField
      FieldName = 'DENIER_BOLIV'
    end
    object qryPPECHASolderFLG_ECH_SOLDE: TFloatField
      FieldName = 'FLG_ECH_SOLDE'
    end
  end
  object dsPPECHASolder: TDataSource
    DataSet = qryPPECHASolder
    Left = 1190
    Top = 547
  end
  object qryDDL_A_CREER: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '    IDT COMMA_ID, '
      '    IDT COMMA_NUM, '
      '    IDT COMMA_VERSI,'
      '    IDT COMMA_ST,'
      '    DESI COMMA_ST_DES,'
      '    DESI COMMA_REF_CL,'
      '    IDT POCDE_ID, '
      '    IDT POCDE_NUM,   '
      '    IDT POCDE_TYP_POSTE,'
      '    DESI POCDE_TYP_POSTE_DES,'
      '    DESI POCDE_REF,'
      '    IDT PPECH_ID, '
      '    DAT PPECH_DATE,  '
      '    DAT PPECH_DATE_MAD_DMD,  '
      '    DAT ARBBE_DATE_RENDU, '
      '    DAT DATE_MAD_CLIENT,'
      '    IDT PPECH_QTE_ORI,'
      '    IDT PPECH_QTE_TOLER,'
      '    IDT PPECH_QTE_RESV,'
      '    IDT PPECH_QTE_CONSO,'
      '    IDT SOLDE_A_LIVRER_COLS,'
      '    IDT SOLDE_A_LIVRER_PALS,'
      '    IDT PPECH_QTE_A_EXPED,'
      '    IDT LI_TIERS_ID, '
      '    CODE LI_TIERS_CODE,'
      '    DESI LI_TIERS_RS_L1,'
      '    CMNT PPECH_OBSV_MAD_CLI, '
      '    CMNT PPECH_OBSV_COMP,'
      '    IDT LIEFF_ID, '
      '    IDT LIEFF_TYP,'
      '    DESI LIEFF_TYP_DES,'
      '    IDT LIEFF_LIEU_ID,'
      '    DESI LIEFF_DES,'
      '    DESI PRCDT_DES,'
      '    IDT CLT_FIN_TIERS_ID, '
      '    CODE CLT_FIN_TIERS_CODE,'
      '    DESI CLT_FIN_TIERS_RS_L1, '
      '    CODE ADM_COLLA_TRIG, '
      '    CODE ZOSTO_CODE, '
      '    DESI ZOSTO_DES, '
      '    DAT ORFAB_MAD_DATE,'
      '    IDT PRDCF_ID,'
      '    IDT PALTI_DEBOR_FLG, '
      '    IDT PALTI_IS_GERBABLE,'
      '    IDT CADEN_ID              ,'
      '    DESI CADEN_NUM,'
      '    DAT CADEN_DATECRE         ,'
      '    IDT CADEN_EXPE_ST,'
      '    DESI CADEN_EXP_ST_DES ,'
      '    DESI CADEN_CMNT,'
      '    DESI CADEN_FLG_DDL_AUTO_DES,'
      '    CODE DEROG_ZOSTO_CODE,'
      '    DESI MODTR_DES,'
      '    CODE INCOT_CODE,'
      '    DESI LIEFF_PAYS,'
      '    CODE LI_CODE_POSTAL'
      'FROM'
      '    FDATA')
    Left = 1316
    Top = 691
    object qryDDL_A_CREERCOMMA_ID: TFloatField
      FieldName = 'COMMA_ID'
    end
    object qryDDL_A_CREERCOMMA_NUM: TFloatField
      FieldName = 'COMMA_NUM'
    end
    object qryDDL_A_CREERCOMMA_VERSI: TFloatField
      FieldName = 'COMMA_VERSI'
    end
    object qryDDL_A_CREERCOMMA_ST: TFloatField
      FieldName = 'COMMA_ST'
    end
    object qryDDL_A_CREERCOMMA_ST_DES: TWideStringField
      FieldName = 'COMMA_ST_DES'
      Size = 50
    end
    object qryDDL_A_CREERPOCDE_ID: TFloatField
      FieldName = 'POCDE_ID'
    end
    object qryDDL_A_CREERPOCDE_NUM: TFloatField
      FieldName = 'POCDE_NUM'
    end
    object qryDDL_A_CREERPOCDE_TYP_POSTE: TFloatField
      FieldName = 'POCDE_TYP_POSTE'
    end
    object qryDDL_A_CREERPOCDE_TYP_POSTE_DES: TWideStringField
      FieldName = 'POCDE_TYP_POSTE_DES'
      Size = 50
    end
    object qryDDL_A_CREERPOCDE_REF: TWideStringField
      FieldName = 'POCDE_REF'
      Size = 50
    end
    object qryDDL_A_CREERPPECH_ID: TFloatField
      FieldName = 'PPECH_ID'
    end
    object qryDDL_A_CREERPPECH_DATE: TDateTimeField
      Alignment = taCenter
      FieldName = 'PPECH_DATE'
    end
    object qryDDL_A_CREERPPECH_DATE_MAD_DMD: TDateTimeField
      Alignment = taCenter
      FieldName = 'PPECH_DATE_MAD_DMD'
    end
    object qryDDL_A_CREERPPECH_QTE_ORI: TFloatField
      FieldName = 'PPECH_QTE_ORI'
      DisplayFormat = ',0'
    end
    object qryDDL_A_CREERPPECH_QTE_TOLER: TFloatField
      FieldName = 'PPECH_QTE_TOLER'
      DisplayFormat = ',0'
    end
    object qryDDL_A_CREERPPECH_QTE_RESV: TFloatField
      FieldName = 'PPECH_QTE_RESV'
      DisplayFormat = ',0'
    end
    object qryDDL_A_CREERPPECH_QTE_CONSO: TFloatField
      FieldName = 'PPECH_QTE_CONSO'
      DisplayFormat = ',0'
    end
    object qryDDL_A_CREERSOLDE_A_LIVRER_COLS: TFloatField
      FieldName = 'SOLDE_A_LIVRER_COLS'
      DisplayFormat = ',0'
    end
    object qryDDL_A_CREERSOLDE_A_LIVRER_PALS: TFloatField
      FieldName = 'SOLDE_A_LIVRER_PALS'
      DisplayFormat = ',0'
    end
    object qryDDL_A_CREERPPECH_QTE_A_EXPED: TFloatField
      FieldName = 'PPECH_QTE_A_EXPED'
      DisplayFormat = ',0'
    end
    object qryDDL_A_CREERLI_TIERS_ID: TFloatField
      FieldName = 'LI_TIERS_ID'
    end
    object qryDDL_A_CREERLI_TIERS_CODE: TWideStringField
      FieldName = 'LI_TIERS_CODE'
      Size = 10
    end
    object qryDDL_A_CREERLI_TIERS_RS_L1: TWideStringField
      FieldName = 'LI_TIERS_RS_L1'
      Size = 50
    end
    object qryDDL_A_CREERPPECH_OBSV_MAD_CLI: TWideStringField
      FieldName = 'PPECH_OBSV_MAD_CLI'
      Size = 4000
    end
    object qryDDL_A_CREERPPECH_OBSV_COMP: TWideStringField
      FieldName = 'PPECH_OBSV_COMP'
      Size = 4000
    end
    object qryDDL_A_CREERLIEFF_ID: TFloatField
      FieldName = 'LIEFF_ID'
    end
    object qryDDL_A_CREERLIEFF_TYP: TFloatField
      FieldName = 'LIEFF_TYP'
    end
    object qryDDL_A_CREERLIEFF_TYP_DES: TWideStringField
      FieldName = 'LIEFF_TYP_DES'
      Size = 50
    end
    object qryDDL_A_CREERLIEFF_LIEU_ID: TFloatField
      FieldName = 'LIEFF_LIEU_ID'
    end
    object qryDDL_A_CREERLIEFF_DES: TWideStringField
      FieldName = 'LIEFF_DES'
      Size = 50
    end
    object qryDDL_A_CREERPRCDT_DES: TWideStringField
      FieldName = 'PRCDT_DES'
      Size = 50
    end
    object qryDDL_A_CREERCLT_FIN_TIERS_ID: TFloatField
      FieldName = 'CLT_FIN_TIERS_ID'
    end
    object qryDDL_A_CREERCLT_FIN_TIERS_CODE: TWideStringField
      FieldName = 'CLT_FIN_TIERS_CODE'
      Size = 10
    end
    object qryDDL_A_CREERCLT_FIN_TIERS_RS_L1: TWideStringField
      FieldName = 'CLT_FIN_TIERS_RS_L1'
      Size = 50
    end
    object qryDDL_A_CREERADM_COLLA_TRIG: TWideStringField
      FieldName = 'ADM_COLLA_TRIG'
      Size = 10
    end
    object qryDDL_A_CREERZOSTO_CODE: TWideStringField
      FieldName = 'ZOSTO_CODE'
      Size = 10
    end
    object qryDDL_A_CREERZOSTO_DES: TWideStringField
      FieldName = 'ZOSTO_DES'
      Size = 50
    end
    object qryDDL_A_CREERCOMMA_REF_CL: TWideStringField
      FieldName = 'COMMA_REF_CL'
      Size = 50
    end
    object qryDDL_A_CREERORFAB_MAD_DATE: TDateTimeField
      FieldName = 'ORFAB_MAD_DATE'
    end
    object qryDDL_A_CREERPRDCF_ID: TFloatField
      FieldName = 'PRDCF_ID'
    end
    object qryDDL_A_CREERPALTI_DEBOR_FLG: TFloatField
      DisplayLabel = 'D'#233'bordante'
      FieldName = 'PALTI_DEBOR_FLG'
    end
    object qryDDL_A_CREERDATE_MAD_CLIENT: TDateTimeField
      FieldName = 'DATE_MAD_CLIENT'
    end
    object qryDDL_A_CREERARBBE_DATE_RENDU: TDateTimeField
      FieldName = 'ARBBE_DATE_RENDU'
    end
    object qryDDL_A_CREERCADEN_ID: TFloatField
      FieldName = 'CADEN_ID'
    end
    object qryDDL_A_CREERCADEN_NUM: TWideStringField
      FieldName = 'CADEN_NUM'
      Size = 50
    end
    object qryDDL_A_CREERCADEN_DATECRE: TDateTimeField
      FieldName = 'CADEN_DATECRE'
    end
    object qryDDL_A_CREERCADEN_EXPE_ST: TFloatField
      FieldName = 'CADEN_EXPE_ST'
    end
    object qryDDL_A_CREERCADEN_EXP_ST_DES: TWideStringField
      FieldName = 'CADEN_EXP_ST_DES'
      Size = 50
    end
    object qryDDL_A_CREERCADEN_CMNT: TWideStringField
      FieldName = 'CADEN_CMNT'
      Size = 50
    end
    object qryDDL_A_CREERCADEN_FLG_DDL_AUTO_DES: TWideStringField
      FieldName = 'CADEN_FLG_DDL_AUTO_DES'
      Size = 50
    end
    object qryDDL_A_CREERPALTI_IS_GERBABLE: TFloatField
      FieldName = 'PALTI_IS_GERBABLE'
    end
    object qryDDL_A_CREERDEROG_ZOSTO_CODE: TWideStringField
      FieldName = 'DEROG_ZOSTO_CODE'
      Size = 10
    end
    object qryDDL_A_CREERMODTR_DES: TWideStringField
      FieldName = 'MODTR_DES'
      Size = 50
    end
    object qryDDL_A_CREERINCOT_CODE: TWideStringField
      FieldName = 'INCOT_CODE'
      Size = 10
    end
    object qryDDL_A_CREERLIEFF_PAYS: TWideStringField
      FieldName = 'LIEFF_PAYS'
      Size = 200
    end
    object qryDDL_A_CREERLI_CODE_POSTAL: TWideStringField
      FieldName = 'LI_CODE_POSTAL'
      Size = 10
    end
  end
  object dsDDL_A_CREER: TDataSource
    DataSet = dxmdDDL_A_CREERListe
    Left = 1412
    Top = 700
  end
  object cxEditRepository1: TcxEditRepository
    Left = 2613
    Top = 646
    PixelsPerInch = 96
    object chkFAD: TcxEditRepositoryCheckBoxItem
      Properties.Alignment = taCenter
      Properties.ValueChecked = 1
      Properties.ValueUnchecked = 0
    end
  end
  object qryPPECHAFader: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '    IDT TIERS_ID,'
      '    CODE TIERS_CODE,'
      '    DESI TIERS_RS_L1,'
      '    IDT COMMA_ID, '
      '    IDT COMMA_NUM, '
      '    IDT COMMA_VERSI,'
      '    IDT COMMA_ST,'
      '    DESI COMMA_ST_DES,'
      '    IDT POCDE_ID, '
      '    IDT POCDE_NUM,   '
      '    IDT POCDE_TYP_POSTE,'
      '    DESI POCDE_TYP_POSTE_DES,'
      '    DESI POCDE_REF,'
      '    IDT PPECH_ID, '
      '    DAT PPECH_DATE, '
      '    DAT PPECH_DATE_FAD_CALC,'
      '    DAT PPECH_DATE_FAD,'
      '    IDT PPECH_QTE_ORI, '
      '    IDT PPECH_QTE_TOLER , '
      '    IDT PPECH_QTE_RESV, '
      '    IDT PPECH_QTE_CONSO,'
      '    IDT PPECH_QTE_COLS_RESTE_A_FADER, '
      '    IDT PPECH_QTE_SUPP_RESTE_A_FADER,'
      '    IDT PPECH_QTE_SOLDE_A_LIVRER,'
      '    IDT LIVRAISONS_PLANIFIEES,'
      '    IDT SUM_QTE_DDL,'
      '    IDT PPECH_SOLDE_RESV,'
      '    IDT PPECH_FACTURABLE, '
      '    IDT PRCDT_ID, '
      '    DESI PRCDT_DES, '
      '    CODE MODEL_CODE, '
      '    CODE ADM_TRIG, '
      '    CODE CDM_TRIG,'
      '    IDT PRCDT_MODE_GES,'
      '    DESI PRCDT_MODE_GES_DES,'
      '    CMNT JDFEC_DES'
      'FROM '
      '    FDATA')
    Left = 1316
    Top = 437
    object qryPPECHAFaderTIERS_ID: TFloatField
      FieldName = 'TIERS_ID'
    end
    object qryPPECHAFaderTIERS_CODE: TWideStringField
      FieldName = 'TIERS_CODE'
      Size = 10
    end
    object qryPPECHAFaderTIERS_RS_L1: TWideStringField
      FieldName = 'TIERS_RS_L1'
      Size = 50
    end
    object qryPPECHAFaderCOMMA_ID: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_ID'
    end
    object qryPPECHAFaderCOMMA_NUM: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_NUM'
    end
    object qryPPECHAFaderCOMMA_VERSI: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_VERSI'
    end
    object qryPPECHAFaderCOMMA_ST: TFloatField
      Alignment = taCenter
      FieldName = 'COMMA_ST'
    end
    object qryPPECHAFaderCOMMA_ST_DES: TWideStringField
      Alignment = taCenter
      FieldName = 'COMMA_ST_DES'
      Size = 50
    end
    object qryPPECHAFaderPOCDE_ID: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_ID'
    end
    object qryPPECHAFaderPOCDE_NUM: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_NUM'
    end
    object qryPPECHAFaderPOCDE_TYP_POSTE: TFloatField
      Alignment = taCenter
      FieldName = 'POCDE_TYP_POSTE'
    end
    object qryPPECHAFaderPOCDE_TYP_POSTE_DES: TWideStringField
      Alignment = taCenter
      FieldName = 'POCDE_TYP_POSTE_DES'
      Size = 50
    end
    object qryPPECHAFaderPOCDE_REF: TWideStringField
      Alignment = taCenter
      FieldName = 'POCDE_REF'
      Size = 50
    end
    object qryPPECHAFaderPPECH_ID: TFloatField
      Alignment = taCenter
      FieldName = 'PPECH_ID'
    end
    object qryPPECHAFaderPPECH_DATE: TDateTimeField
      Alignment = taCenter
      FieldName = 'PPECH_DATE'
    end
    object qryPPECHAFaderPPECH_DATE_FAD_CALC: TDateTimeField
      Alignment = taCenter
      FieldName = 'PPECH_DATE_FAD_CALC'
    end
    object qryPPECHAFaderPPECH_DATE_FAD: TDateTimeField
      Alignment = taCenter
      FieldName = 'PPECH_DATE_FAD'
    end
    object qryPPECHAFaderPPECH_QTE_ORI: TFloatField
      FieldName = 'PPECH_QTE_ORI'
      DisplayFormat = ',0'
    end
    object qryPPECHAFaderPPECH_QTE_TOLER: TFloatField
      FieldName = 'PPECH_QTE_TOLER'
      DisplayFormat = ',0'
    end
    object qryPPECHAFaderPPECH_QTE_RESV: TFloatField
      FieldName = 'PPECH_QTE_RESV'
      DisplayFormat = ',0'
    end
    object qryPPECHAFaderPPECH_QTE_CONSO: TFloatField
      FieldName = 'PPECH_QTE_CONSO'
      DisplayFormat = ',0'
    end
    object qryPPECHAFaderPPECH_QTE_COLS_RESTE_A_FADER: TFloatField
      FieldName = 'PPECH_QTE_COLS_RESTE_A_FADER'
      DisplayFormat = ',0'
    end
    object qryPPECHAFaderPPECH_QTE_SUPP_RESTE_A_FADER: TFloatField
      FieldName = 'PPECH_QTE_SUPP_RESTE_A_FADER'
      DisplayFormat = ',0'
    end
    object qryPPECHAFaderPPECH_QTE_SOLDE_A_LIVRER: TFloatField
      FieldName = 'PPECH_QTE_SOLDE_A_LIVRER'
      DisplayFormat = ',0'
    end
    object qryPPECHAFaderLIVRAISONS_PLANIFIEES: TFloatField
      FieldName = 'LIVRAISONS_PLANIFIEES'
    end
    object qryPPECHAFaderSUM_QTE_DDL: TFloatField
      FieldName = 'SUM_QTE_DDL'
    end
    object qryPPECHAFaderPPECH_FACTURABLE: TFloatField
      FieldName = 'PPECH_FACTURABLE'
    end
    object qryPPECHAFaderPRCDT_ID: TFloatField
      FieldName = 'PRCDT_ID'
    end
    object qryPPECHAFaderPRCDT_DES: TWideStringField
      FieldName = 'PRCDT_DES'
      Size = 50
    end
    object qryPPECHAFaderMODEL_CODE: TWideStringField
      FieldName = 'MODEL_CODE'
      Size = 10
    end
    object qryPPECHAFaderADM_TRIG: TWideStringField
      FieldName = 'ADM_TRIG'
      Size = 10
    end
    object qryPPECHAFaderCDM_TRIG: TWideStringField
      FieldName = 'CDM_TRIG'
      Size = 10
    end
    object qryPPECHAFaderPRCDT_MODE_GES: TFloatField
      FieldName = 'PRCDT_MODE_GES'
    end
    object qryPPECHAFaderPRCDT_MODE_GES_DES: TWideStringField
      FieldName = 'PRCDT_MODE_GES_DES'
      Size = 50
    end
    object qryPPECHAFaderPPECH_SOLDE_RESV: TFloatField
      FieldName = 'PPECH_SOLDE_RESV'
      DisplayFormat = ',0'
    end
    object qryPPECHAFaderJDFEC_DES: TWideStringField
      FieldName = 'JDFEC_DES'
      Size = 4000
    end
  end
  object dsPPECHAFader: TDataSource
    DataSet = qryPPECHAFader
    Left = 1412
    Top = 437
  end
  object qryDDF_ECHANT: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '    IDT ORFAB_ID, '
      '    IDT ORFAB_NUM, '
      '    IDT ORFAB_ST, '
      '    DESI ORFAB_ST_DES, '
      '    IDT ORFAB_ST_COM, '
      '    DESI ORFAB_ST_COM_DES, '
      '    DAT ORFAB_DATE_SOUHAI_DATE, '
      '    DAT ORFAB_MAD_DATE, '
      '    DAT ORFAB_DATE_FAB_PREV,'
      '    IDT ORFAB_QTE_SOUHAI,'
      '    IDT TIERS_ID, '
      '    CODE TIERS_CODE, '
      '    DESI TIERS_RS_L1, '
      '    IDT PRCDT_ID, '
      '    DESI PRCDT_DES, '
      '    CODE MODEL_CODE, '
      '    DESI MODEL_DES'
      'FROM '
      '    FDATA')
    Left = 1316
    Top = 488
    object qryDDF_ECHANTORFAB_ID: TFloatField
      FieldName = 'ORFAB_ID'
    end
    object qryDDF_ECHANTORFAB_NUM: TFloatField
      FieldName = 'ORFAB_NUM'
    end
    object qryDDF_ECHANTORFAB_ST: TFloatField
      FieldName = 'ORFAB_ST'
    end
    object qryDDF_ECHANTORFAB_ST_DES: TWideStringField
      FieldName = 'ORFAB_ST_DES'
      Size = 50
    end
    object qryDDF_ECHANTORFAB_ST_COM: TFloatField
      FieldName = 'ORFAB_ST_COM'
    end
    object qryDDF_ECHANTORFAB_ST_COM_DES: TWideStringField
      FieldName = 'ORFAB_ST_COM_DES'
      Size = 50
    end
    object qryDDF_ECHANTORFAB_DATE_SOUHAI_DATE: TDateTimeField
      Alignment = taCenter
      FieldName = 'ORFAB_DATE_SOUHAI_DATE'
    end
    object qryDDF_ECHANTORFAB_MAD_DATE: TDateTimeField
      Alignment = taCenter
      FieldName = 'ORFAB_MAD_DATE'
    end
    object qryDDF_ECHANTORFAB_DATE_FAB_PREV: TDateTimeField
      Alignment = taCenter
      FieldName = 'ORFAB_DATE_FAB_PREV'
    end
    object qryDDF_ECHANTORFAB_QTE_SOUHAI: TFloatField
      FieldName = 'ORFAB_QTE_SOUHAI'
      DisplayFormat = ',0'
    end
    object qryDDF_ECHANTTIERS_ID: TFloatField
      FieldName = 'TIERS_ID'
    end
    object qryDDF_ECHANTTIERS_CODE: TWideStringField
      FieldName = 'TIERS_CODE'
      Size = 10
    end
    object qryDDF_ECHANTTIERS_RS_L1: TWideStringField
      FieldName = 'TIERS_RS_L1'
      Size = 50
    end
    object qryDDF_ECHANTPRCDT_ID: TFloatField
      FieldName = 'PRCDT_ID'
    end
    object qryDDF_ECHANTPRCDT_DES: TWideStringField
      FieldName = 'PRCDT_DES'
      Size = 50
    end
    object qryDDF_ECHANTMODEL_CODE: TWideStringField
      FieldName = 'MODEL_CODE'
      Size = 10
    end
    object qryDDF_ECHANTMODEL_DES: TWideStringField
      FieldName = 'MODEL_DES'
      Size = 50
    end
  end
  object dsDDF_ECHANT: TDataSource
    DataSet = qryDDF_ECHANT
    Left = 1150
    Top = 64
  end
  object dsDMBAT_TYPE0: TDataSource
    DataSet = qryDMBAT_TYPE0
    Left = 1190
    Top = 445
  end
  object qryDMBAT_TYPE0: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '    IDT CDCFO_ID, '
      '    IDT CDCFO_NUM,'
      '    IDT CDCFO_NUM_VERSI,'
      '    IDT CDCFO_ST,'
      '    DESI CDCFO_ST_DES, '
      '    CODE TIERS_CODE, '
      '    DESI TIERS_RS_L1,'
      '    IDT DMBAT_ID, '
      '    IDT DMBAT_TYPE, '
      '    IDT DMBAT_STATUT, '
      '    DESI DMBAT_STATUT_DES,'
      '    DAT DMBAT_PAP_DMD_DATE,'
      '    DAT DMBAT_PAP_PC_REP_DATE,'
      '    DAT DMBAT_PAP_PC_MAD_DATE,              '
      '    DAT DMBAT_PAP_REA_MAIL_DATE,'
      '    DAT DMBAT_PAP_ENVOI_CLIENT_DATE,'
      '    DAT DMBAT_PAP_VALID_CLIENT_DATE, '
      '    IDT VSUPO_NUM, '
      '    DESI VSUPO_DES, '
      '    IDT VDECO_NUM, '
      '    DESI VDECO_DES'
      'FROM '
      '    FDATA')
    Left = 1094
    Top = 444
    object qryDMBAT_TYPE0CDCFO_ID: TFloatField
      FieldName = 'CDCFO_ID'
    end
    object qryDMBAT_TYPE0CDCFO_NUM: TFloatField
      FieldName = 'CDCFO_NUM'
    end
    object qryDMBAT_TYPE0CDCFO_NUM_VERSI: TFloatField
      FieldName = 'CDCFO_NUM_VERSI'
    end
    object qryDMBAT_TYPE0CDCFO_ST: TFloatField
      FieldName = 'CDCFO_ST'
    end
    object qryDMBAT_TYPE0CDCFO_ST_DES: TWideStringField
      FieldName = 'CDCFO_ST_DES'
      Size = 50
    end
    object qryDMBAT_TYPE0TIERS_CODE: TWideStringField
      FieldName = 'TIERS_CODE'
      Size = 10
    end
    object qryDMBAT_TYPE0TIERS_RS_L1: TWideStringField
      FieldName = 'TIERS_RS_L1'
      Size = 50
    end
    object qryDMBAT_TYPE0DMBAT_ID: TFloatField
      FieldName = 'DMBAT_ID'
    end
    object qryDMBAT_TYPE0DMBAT_TYPE: TFloatField
      FieldName = 'DMBAT_TYPE'
    end
    object qryDMBAT_TYPE0DMBAT_STATUT: TFloatField
      FieldName = 'DMBAT_STATUT'
    end
    object qryDMBAT_TYPE0DMBAT_STATUT_DES: TWideStringField
      FieldName = 'DMBAT_STATUT_DES'
      Size = 50
    end
    object qryDMBAT_TYPE0DMBAT_PAP_DMD_DATE: TDateTimeField
      FieldName = 'DMBAT_PAP_DMD_DATE'
    end
    object qryDMBAT_TYPE0DMBAT_PAP_PC_REP_DATE: TDateTimeField
      FieldName = 'DMBAT_PAP_PC_REP_DATE'
    end
    object qryDMBAT_TYPE0DMBAT_PAP_PC_MAD_DATE: TDateTimeField
      FieldName = 'DMBAT_PAP_PC_MAD_DATE'
    end
    object qryDMBAT_TYPE0DMBAT_PAP_REA_MAIL_DATE: TDateTimeField
      FieldName = 'DMBAT_PAP_REA_MAIL_DATE'
    end
    object qryDMBAT_TYPE0DMBAT_PAP_ENVOI_CLIENT_DATE: TDateTimeField
      FieldName = 'DMBAT_PAP_ENVOI_CLIENT_DATE'
    end
    object qryDMBAT_TYPE0DMBAT_PAP_VALID_CLIENT_DATE: TDateTimeField
      FieldName = 'DMBAT_PAP_VALID_CLIENT_DATE'
    end
    object qryDMBAT_TYPE0VSUPO_NUM: TFloatField
      FieldName = 'VSUPO_NUM'
    end
    object qryDMBAT_TYPE0VSUPO_DES: TWideStringField
      FieldName = 'VSUPO_DES'
      Size = 50
    end
    object qryDMBAT_TYPE0VDECO_NUM: TFloatField
      FieldName = 'VDECO_NUM'
    end
    object qryDMBAT_TYPE0VDECO_DES: TWideStringField
      FieldName = 'VDECO_DES'
      Size = 50
    end
  end
  object dsDMBAT_TYPE1: TDataSource
    DataSet = qryDMBAT_TYPE1
    Left = 1190
    Top = 496
  end
  object qryDMBAT_TYPE1: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '    IDT CDCFO_ID, '
      '    IDT CDCFO_NUM,'
      '    IDT CDCFO_NUM_VERSI,'
      '    IDT CDCFO_ST,'
      '    DESI CDCFO_ST_DES,'
      '    CODE TIERS_CODE,'
      '    DESI TIERS_RS_L1,'
      '    IDT DMBAT_ID,'
      '    IDT DMBAT_TYPE,'
      '    IDT DMBAT_STATUT,                                '
      '    DESI DMBAT_STATUT_DES,'
      '    DAT DMBAT_VER_DMD_DATE, '
      '    DAT DMBAT_VER_PC_REP_DATE, '
      '    DAT DMBAT_VER_PC_MAD_DATE, '
      '    DAT DMBAT_VER_REA_MAIL_DATE, '
      '    DAT DMBAT_VER_ENVOI_CLIENT_DATE, '
      '    DAT DMBAT_VER_VALID_CLIENT_DATE, '
      '    IDT VSUPO_NUM, '
      '    DESI VSUPO_DES, '
      '    IDT VDECO_NUM, '
      '    DESI VDECO_DES'
      'FROM '
      '    FDATA')
    Left = 1094
    Top = 495
    object qryDMBAT_TYPE1CDCFO_ID: TFloatField
      FieldName = 'CDCFO_ID'
    end
    object qryDMBAT_TYPE1CDCFO_NUM: TFloatField
      FieldName = 'CDCFO_NUM'
    end
    object qryDMBAT_TYPE1CDCFO_NUM_VERSI: TFloatField
      FieldName = 'CDCFO_NUM_VERSI'
    end
    object qryDMBAT_TYPE1CDCFO_ST: TFloatField
      FieldName = 'CDCFO_ST'
    end
    object qryDMBAT_TYPE1CDCFO_ST_DES: TWideStringField
      FieldName = 'CDCFO_ST_DES'
      Size = 50
    end
    object qryDMBAT_TYPE1TIERS_CODE: TWideStringField
      FieldName = 'TIERS_CODE'
      Size = 10
    end
    object qryDMBAT_TYPE1TIERS_RS_L1: TWideStringField
      FieldName = 'TIERS_RS_L1'
      Size = 50
    end
    object qryDMBAT_TYPE1DMBAT_ID: TFloatField
      FieldName = 'DMBAT_ID'
    end
    object qryDMBAT_TYPE1DMBAT_TYPE: TFloatField
      FieldName = 'DMBAT_TYPE'
    end
    object qryDMBAT_TYPE1DMBAT_STATUT: TFloatField
      FieldName = 'DMBAT_STATUT'
    end
    object qryDMBAT_TYPE1DMBAT_STATUT_DES: TWideStringField
      FieldName = 'DMBAT_STATUT_DES'
      Size = 50
    end
    object qryDMBAT_TYPE1DMBAT_VER_DMD_DATE: TDateTimeField
      FieldName = 'DMBAT_VER_DMD_DATE'
    end
    object qryDMBAT_TYPE1DMBAT_VER_PC_REP_DATE: TDateTimeField
      FieldName = 'DMBAT_VER_PC_REP_DATE'
    end
    object qryDMBAT_TYPE1DMBAT_VER_PC_MAD_DATE: TDateTimeField
      FieldName = 'DMBAT_VER_PC_MAD_DATE'
    end
    object qryDMBAT_TYPE1DMBAT_VER_REA_MAIL_DATE: TDateTimeField
      FieldName = 'DMBAT_VER_REA_MAIL_DATE'
    end
    object qryDMBAT_TYPE1DMBAT_VER_ENVOI_CLIENT_DATE: TDateTimeField
      FieldName = 'DMBAT_VER_ENVOI_CLIENT_DATE'
    end
    object qryDMBAT_TYPE1DMBAT_VER_VALID_CLIENT_DATE: TDateTimeField
      FieldName = 'DMBAT_VER_VALID_CLIENT_DATE'
    end
    object qryDMBAT_TYPE1VSUPO_NUM: TFloatField
      FieldName = 'VSUPO_NUM'
    end
    object qryDMBAT_TYPE1VSUPO_DES: TWideStringField
      FieldName = 'VSUPO_DES'
      Size = 50
    end
    object qryDMBAT_TYPE1VDECO_NUM: TFloatField
      FieldName = 'VDECO_NUM'
    end
    object qryDMBAT_TYPE1VDECO_DES: TWideStringField
      FieldName = 'VDECO_DES'
      Size = 50
    end
  end
  object qryPOCDE_DECOR: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT '
      '    IDT COMMA_ID, '
      '    IDT COMMA_NUM, '
      '    IDT COMMA_VERSI,'
      '    IDT COMMA_ST,'
      '    DESI COMMA_ST_DES,'
      '    DESI COMMA_REF_CL,'
      '    IDT POCDE_ID, '
      '    IDT POCDE_NUM,'
      '    DESI POCDE_REF, '
      '    IDT POCDE_TYP_POSTE, '
      '    FLG  POCDE_SOLDE,'
      '    DESI POCDE_TYP_POSTE_DES,'
      '    IDT TIERS_ID,'
      '    CODE TIERS_CODE, '
      '    DESI TIERS_RS_L1,'
      '    IDT PRCDT_ID,'
      '    DESI PRCDT_DES,'
      '    IDT PRCDT_MODE_GES,'
      '    DESI PRCDT_MODE_GES_DES, '
      '    CODE ADM_COLLA_TRIG, '
      '    CODE CDM_COLLA_TRIG, '
      '    DAT ORFAB_DATE'
      'FROM '
      '    FDATA    ')
    Left = 1316
    Top = 590
    object qryPOCDE_DECORCOMMA_ID: TFloatField
      FieldName = 'COMMA_ID'
    end
    object qryPOCDE_DECORCOMMA_NUM: TFloatField
      FieldName = 'COMMA_NUM'
    end
    object qryPOCDE_DECORCOMMA_VERSI: TFloatField
      FieldName = 'COMMA_VERSI'
    end
    object qryPOCDE_DECORCOMMA_ST: TFloatField
      FieldName = 'COMMA_ST'
    end
    object qryPOCDE_DECORCOMMA_ST_DES: TWideStringField
      FieldName = 'COMMA_ST_DES'
      Size = 50
    end
    object qryPOCDE_DECORPOCDE_ID: TFloatField
      FieldName = 'POCDE_ID'
    end
    object qryPOCDE_DECORPOCDE_NUM: TFloatField
      FieldName = 'POCDE_NUM'
    end
    object qryPOCDE_DECORPOCDE_TYP_POSTE: TFloatField
      FieldName = 'POCDE_TYP_POSTE'
    end
    object qryPOCDE_DECORPOCDE_TYP_POSTE_DES: TWideStringField
      FieldName = 'POCDE_TYP_POSTE_DES'
      Size = 50
    end
    object qryPOCDE_DECORPOCDE_SOLDE: TIntegerField
      FieldName = 'POCDE_SOLDE'
    end
    object qryPOCDE_DECORTIERS_ID: TFloatField
      FieldName = 'TIERS_ID'
    end
    object qryPOCDE_DECORTIERS_CODE: TWideStringField
      FieldName = 'TIERS_CODE'
      Size = 10
    end
    object qryPOCDE_DECORTIERS_RS_L1: TWideStringField
      FieldName = 'TIERS_RS_L1'
      Size = 50
    end
    object qryPOCDE_DECORPRCDT_ID: TFloatField
      FieldName = 'PRCDT_ID'
    end
    object qryPOCDE_DECORPRCDT_DES: TWideStringField
      FieldName = 'PRCDT_DES'
      Size = 50
    end
    object qryPOCDE_DECORPRCDT_MODE_GES: TFloatField
      FieldName = 'PRCDT_MODE_GES'
    end
    object qryPOCDE_DECORPRCDT_MODE_GES_DES: TWideStringField
      FieldName = 'PRCDT_MODE_GES_DES'
      Size = 50
    end
    object qryPOCDE_DECORPOCDE_REF: TWideStringField
      FieldName = 'POCDE_REF'
      Size = 50
    end
    object qryPOCDE_DECORADM_COLLA_TRIG: TWideStringField
      FieldName = 'ADM_COLLA_TRIG'
      Size = 10
    end
    object qryPOCDE_DECORCDM_COLLA_TRIG: TWideStringField
      FieldName = 'CDM_COLLA_TRIG'
      Size = 10
    end
    object qryPOCDE_DECORCOMMA_REF_CL: TWideStringField
      FieldName = 'COMMA_REF_CL'
      Size = 50
    end
    object qryPOCDE_DECORORFAB_DATE: TDateTimeField
      FieldName = 'ORFAB_DATE'
    end
  end
  object dsPOCDE_DECOR: TDataSource
    DataSet = qryPOCDE_DECOR
    Left = 1412
    Top = 595
  end
  object dsOFFRE_ST_0: TDataSource
    DataSet = qryOFFRE_ST_0
    Left = 1190
    Top = 598
  end
  object qryOFFRE_ST_0: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '    IDT OFFRE_ID,'
      '    IDT OFFRE_TYP,'
      '    IDT OFFRE_NUM,'
      '    IDT OFFRE_VERSI,'
      '    FLG OFFRE_DER_VERSI,'
      '    IDT OFFRE_ST,'
      '    DESI OFFRE_ST_DES,'
      '    DAT OFFRE_DATE,'
      '    DAT OFFRE_DATE_REPON,'
      '    DAT OFFRE_DATE_VAL,'
      '    DESI OFFRE_REF_CLI,'
      '    IDT ADM_COLLA_ID,'
      '    CODE ADM_COLLA_TRIG,'
      '    DESI ADM_NOMPRENOM,'
      '    IDT CDM_COLLA_ID,'
      '    CODE CDM_COLLA_TRIG,'
      '    DESI CDM_NOMPRENOM,'
      '    IDT TIERS_ID,'
      '    CODE TIERS_CODE,'
      '    DESI TIERS_RS_L1,'
      '    DESI OFFRE_TYPE_DES,'
      '    CODE RZA_COLLA_TRIG,'
      '    IDT  EMET_COLLA_ID,'
      '    CODE EMET_COLLA_TRIG,'
      '    DESI EMET_NOMPRENOM, '
      '    DESI MONTANT, '
      '    CODE DVISE_CODE'
      'FROM'
      '    FDATA')
    Left = 1094
    Top = 598
    object qryOFFRE_ST_0OFFRE_ID: TFloatField
      FieldName = 'OFFRE_ID'
    end
    object qryOFFRE_ST_0OFFRE_TYP: TFloatField
      FieldName = 'OFFRE_TYP'
    end
    object qryOFFRE_ST_0OFFRE_NUM: TFloatField
      FieldName = 'OFFRE_NUM'
    end
    object qryOFFRE_ST_0OFFRE_VERSI: TFloatField
      FieldName = 'OFFRE_VERSI'
    end
    object qryOFFRE_ST_0OFFRE_DER_VERSI: TIntegerField
      FieldName = 'OFFRE_DER_VERSI'
    end
    object qryOFFRE_ST_0OFFRE_ST: TFloatField
      FieldName = 'OFFRE_ST'
    end
    object qryOFFRE_ST_0OFFRE_ST_DES: TWideStringField
      FieldName = 'OFFRE_ST_DES'
      Size = 50
    end
    object qryOFFRE_ST_0OFFRE_DATE: TDateTimeField
      FieldName = 'OFFRE_DATE'
    end
    object qryOFFRE_ST_0OFFRE_DATE_REPON: TDateTimeField
      FieldName = 'OFFRE_DATE_REPON'
    end
    object qryOFFRE_ST_0OFFRE_DATE_VAL: TDateTimeField
      FieldName = 'OFFRE_DATE_VAL'
    end
    object qryOFFRE_ST_0OFFRE_REF_CLI: TWideStringField
      FieldName = 'OFFRE_REF_CLI'
      Size = 50
    end
    object qryOFFRE_ST_0ADM_COLLA_ID: TFloatField
      FieldName = 'ADM_COLLA_ID'
    end
    object qryOFFRE_ST_0ADM_COLLA_TRIG: TWideStringField
      FieldName = 'ADM_COLLA_TRIG'
      Size = 10
    end
    object qryOFFRE_ST_0ADM_NOMPRENOM: TWideStringField
      FieldName = 'ADM_NOMPRENOM'
      Size = 50
    end
    object qryOFFRE_ST_0CDM_COLLA_ID: TFloatField
      FieldName = 'CDM_COLLA_ID'
    end
    object qryOFFRE_ST_0CDM_COLLA_TRIG: TWideStringField
      FieldName = 'CDM_COLLA_TRIG'
      Size = 10
    end
    object qryOFFRE_ST_0CDM_NOMPRENOM: TWideStringField
      FieldName = 'CDM_NOMPRENOM'
      Size = 50
    end
    object qryOFFRE_ST_0TIERS_ID: TFloatField
      FieldName = 'TIERS_ID'
    end
    object qryOFFRE_ST_0TIERS_CODE: TWideStringField
      FieldName = 'TIERS_CODE'
      Size = 10
    end
    object qryOFFRE_ST_0TIERS_RS_L1: TWideStringField
      FieldName = 'TIERS_RS_L1'
      Size = 50
    end
    object qryOFFRE_ST_0EMET_COLLA_ID: TFloatField
      FieldName = 'EMET_COLLA_ID'
    end
    object qryOFFRE_ST_0EMET_COLLA_TRIG: TWideStringField
      FieldName = 'EMET_COLLA_TRIG'
      Size = 10
    end
    object qryOFFRE_ST_0EMET_NOMPRENOM: TWideStringField
      FieldName = 'EMET_NOMPRENOM'
      Size = 50
    end
    object qryOFFRE_ST_0RZA_COLLA_TRIG: TWideStringField
      FieldName = 'RZA_COLLA_TRIG'
      Size = 10
    end
    object qryOFFRE_ST_0OFFRE_TYPE_DES: TWideStringField
      FieldName = 'OFFRE_TYPE_DES'
      Size = 50
    end
    object qryOFFRE_ST_0MONTANT: TWideStringField
      FieldName = 'MONTANT'
      Size = 50
    end
    object qryOFFRE_ST_0DVISE_CODE: TWideStringField
      FieldName = 'DVISE_CODE'
      Size = 10
    end
  end
  object dsOFFRE_A_RELANCER: TDataSource
    DataSet = qryOFFRE_A_RELANCER
    Left = 1412
    Top = 753
  end
  object qryOFFRE_A_RELANCER: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '    IDT  OFFRE_ID,'
      '    IDT  OFFRE_TYP,'
      '    DESI OFFRE_TYPE_DES,'
      '    DESI OFFRE_TYP_DES,'
      '    IDT  OFFRE_NUM,'
      '    IDT OFFRE_VERSI,'
      '    FLG OFFRE_DER_VERSI,'
      '    IDT OFFRE_ST,'
      '    DESI OFFRE_ST_DES,'
      '    DAT OFFRE_DATE,'
      '    DAT OFFRE_DATE_RELANCE,'
      '    DAT OFFRE_DATE_VAL,'
      '    DESI OFFRE_REF_CLI,'
      '    IDT ADM_COLLA_ID,'
      '    CODE ADM_COLLA_TRIG,'
      '    CODE RZA_COLLA_TRIG,'
      '    DESI ADM_NOMPRENOM,'
      '    IDT CDM_COLLA_ID,'
      '    CODE CDM_COLLA_TRIG,'
      '    DESI CDM_NOMPRENOM,'
      '    IDT TIERS_ID,'
      '    CODE TIERS_CODE,'
      '    DESI TIERS_RS_L1,'
      '    IDT  EMET_COLLA_ID,'
      '    CODE EMET_COLLA_TRIG,'
      '    DESI EMET_NOMPRENOM, '
      '    DESI MONTANT, '
      '    CODE DVISE_CODE,'
      '    DESI COLLA_TRIG'
      'FROM'
      '    FDATA')
    Left = 1316
    Top = 742
    object FMTFloatField1: TFloatField
      FieldName = 'OFFRE_ID'
    end
    object FMTFloatField2: TFloatField
      FieldName = 'OFFRE_TYP'
    end
    object FMTFloatField3: TFloatField
      FieldName = 'OFFRE_NUM'
    end
    object FMTFloatField4: TFloatField
      FieldName = 'OFFRE_VERSI'
    end
    object IntegerField1: TIntegerField
      FieldName = 'OFFRE_DER_VERSI'
    end
    object FMTFloatField5: TFloatField
      FieldName = 'OFFRE_ST'
    end
    object WideStringField1: TWideStringField
      FieldName = 'OFFRE_ST_DES'
      Size = 50
    end
    object DateTimeField1: TDateTimeField
      FieldName = 'OFFRE_DATE'
    end
    object DateTimeField3: TDateTimeField
      FieldName = 'OFFRE_DATE_VAL'
    end
    object WideStringField2: TWideStringField
      FieldName = 'OFFRE_REF_CLI'
      Size = 50
    end
    object FMTFloatField6: TFloatField
      FieldName = 'ADM_COLLA_ID'
    end
    object WideStringField3: TWideStringField
      FieldName = 'ADM_COLLA_TRIG'
      Size = 10
    end
    object WideStringField4: TWideStringField
      FieldName = 'ADM_NOMPRENOM'
      Size = 50
    end
    object FMTFloatField7: TFloatField
      FieldName = 'CDM_COLLA_ID'
    end
    object WideStringField5: TWideStringField
      FieldName = 'CDM_COLLA_TRIG'
      Size = 10
    end
    object WideStringField6: TWideStringField
      FieldName = 'CDM_NOMPRENOM'
      Size = 50
    end
    object FMTFloatField8: TFloatField
      FieldName = 'TIERS_ID'
    end
    object WideStringField7: TWideStringField
      FieldName = 'TIERS_CODE'
      Size = 10
    end
    object WideStringField8: TWideStringField
      FieldName = 'TIERS_RS_L1'
      Size = 50
    end
    object qryOFFRE_A_RELANCEROFFRE_DATE_RELANCE: TDateTimeField
      FieldName = 'OFFRE_DATE_RELANCE'
    end
    object qryOFFRE_A_RELANCEROFFRE_TYPE_DES: TWideStringField
      FieldName = 'OFFRE_TYPE_DES'
      Size = 50
    end
    object qryOFFRE_A_RELANCEROFFRE_TYP_DES: TWideStringField
      FieldName = 'OFFRE_TYP_DES'
      Size = 50
    end
    object qryOFFRE_A_RELANCERRZA_COLLA_TRIG: TWideStringField
      FieldName = 'RZA_COLLA_TRIG'
      Size = 10
    end
    object qryOFFRE_A_RELANCEREMET_COLLA_ID: TFloatField
      FieldName = 'EMET_COLLA_ID'
    end
    object qryOFFRE_A_RELANCEREMET_COLLA_TRIG: TWideStringField
      FieldName = 'EMET_COLLA_TRIG'
      Size = 10
    end
    object qryOFFRE_A_RELANCEREMET_NOMPRENOM: TWideStringField
      FieldName = 'EMET_NOMPRENOM'
      Size = 50
    end
    object qryOFFRE_A_RELANCERMONTANT: TWideStringField
      FieldName = 'MONTANT'
      Size = 50
    end
    object qryOFFRE_A_RELANCERDVISE_CODE: TWideStringField
      FieldName = 'DVISE_CODE'
      Size = 10
    end
    object qryOFFRE_A_RELANCERCOLLA_TRIG: TWideStringField
      FieldName = 'COLLA_TRIG'
      Size = 50
    end
  end
  object dsPCDAG_A_TRAITER: TDataSource
    DataSet = qryPCDAG_A_TRAITER
    Left = 1412
    Top = 648
  end
  object qryPCDAG_A_TRAITER: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT '
      '    IDT CDACG_ID,'
      '    DESI CDACG_NUM, '
      '    IDT CDACG_SEQ, '
      '    IDT CDACG_ST,'
      '    IDT PCDAG_ID, '
      '    IDT PCDAG_NUM, '
      '    IDT PCDAG_PRCDT_ID, '
      '    IDT PCDAG_DMAPR_ID,'
      '    IDT PCDAG_QTE, '
      '    IDT PCDAG_TYP,'
      '    FLG PCDAG_FLG_LIV_DIRECT,'
      '    IDT TIERS_ID,'
      '    CODE TIERS_CODE,'
      '    DESI TIERS_RS_L1,'
      '    IDT PRCDT_ID,'
      '    DESI PRCDT_DES,'
      '    IDT PRCDT_MODE_GES,'
      '    DESI PRCDT_MODE_GES_DES'
      'FROM'
      '    FDATA')
    Left = 1316
    Top = 640
    object qryPCDAG_A_TRAITERCDACG_ID: TFloatField
      FieldName = 'CDACG_ID'
    end
    object qryPCDAG_A_TRAITERCDACG_NUM: TWideStringField
      FieldName = 'CDACG_NUM'
      Size = 50
    end
    object qryPCDAG_A_TRAITERCDACG_SEQ: TFloatField
      FieldName = 'CDACG_SEQ'
    end
    object qryPCDAG_A_TRAITERCDACG_ST: TFloatField
      FieldName = 'CDACG_ST'
    end
    object qryPCDAG_A_TRAITERPCDAG_ID: TFloatField
      FieldName = 'PCDAG_ID'
    end
    object qryPCDAG_A_TRAITERPCDAG_NUM: TFloatField
      FieldName = 'PCDAG_NUM'
    end
    object qryPCDAG_A_TRAITERPCDAG_PRCDT_ID: TFloatField
      FieldName = 'PCDAG_PRCDT_ID'
    end
    object qryPCDAG_A_TRAITERPCDAG_QTE: TFloatField
      FieldName = 'PCDAG_QTE'
      DisplayFormat = ',0'
    end
    object qryPCDAG_A_TRAITERPCDAG_TYP: TFloatField
      FieldName = 'PCDAG_TYP'
    end
    object qryPCDAG_A_TRAITERPCDAG_FLG_LIV_DIRECT: TIntegerField
      FieldName = 'PCDAG_FLG_LIV_DIRECT'
    end
    object qryPCDAG_A_TRAITERTIERS_ID: TFloatField
      FieldName = 'TIERS_ID'
    end
    object qryPCDAG_A_TRAITERTIERS_CODE: TWideStringField
      FieldName = 'TIERS_CODE'
      Size = 10
    end
    object qryPCDAG_A_TRAITERTIERS_RS_L1: TWideStringField
      FieldName = 'TIERS_RS_L1'
      Size = 50
    end
    object qryPCDAG_A_TRAITERPRCDT_ID: TFloatField
      FieldName = 'PRCDT_ID'
    end
    object qryPCDAG_A_TRAITERPRCDT_DES: TWideStringField
      FieldName = 'PRCDT_DES'
      Size = 50
    end
    object qryPCDAG_A_TRAITERPRCDT_MODE_GES: TFloatField
      FieldName = 'PRCDT_MODE_GES'
    end
    object qryPCDAG_A_TRAITERPRCDT_MODE_GES_DES: TWideStringField
      FieldName = 'PRCDT_MODE_GES_DES'
      Size = 50
    end
    object qryPCDAG_A_TRAITERPCDAG_DMAPR_ID: TFloatField
      FieldName = 'PCDAG_DMAPR_ID'
    end
  end
  object qrySTOCKS_2ANS: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '    IDT COMMA_ID, '
      '    IDT COMMA_NUM, '
      '    IDT COMMA_VERSI,'
      '    IDT COMMA_ST,'
      '    DESI COMMA_ST_DES,'
      '    IDT POCDE_ID, '
      '    IDT POCDE_NUM, '
      '    IDT POCDE_TYP_POSTE,'
      '    DESI POCDE_TYP_POSTE_DES,'
      '    DESI POCDE_REF,'
      '    IDT PRCDT_ID, '
      '    DESI PRCDT_DES,'
      '    IDT PRCDT_MODE_GES,'
      '    DESI PRCDT_MODE_GES_DES,'
      '    IDT PPECH_ID, '
      '    DAT PPECH_DATE, '
      '    IDT PPECH_QTE_ORI, '
      '    IDT PPECH_QTE_TOLER , '
      '    IDT PPECH_QTE_RESV, '
      '    IDT PPECH_QTE_CONSO,'
      '    IDT PPECH_QTE_SOLDE,'
      '    IDT QTE_EXPEDIEE,'
      '    IDT QTE_A_EXPED, '
      '    IDT SOLDE_A_LIVRER, '
      '    CODE ADM_COLLA_TRIG, '
      '    CODE CDM_COLLA_TRIG, '
      '    IDT AVMAD_ID, '
      '    DAT AVMAD_DATE_REF'
      'FROM '
      '    FDATA')
    Left = 1094
    Top = 701
    object qrySTOCKS_2ANSCOMMA_ID: TFloatField
      FieldName = 'COMMA_ID'
    end
    object qrySTOCKS_2ANSCOMMA_NUM: TFloatField
      FieldName = 'COMMA_NUM'
    end
    object qrySTOCKS_2ANSCOMMA_VERSI: TFloatField
      FieldName = 'COMMA_VERSI'
    end
    object qrySTOCKS_2ANSCOMMA_ST: TFloatField
      FieldName = 'COMMA_ST'
    end
    object qrySTOCKS_2ANSCOMMA_ST_DES: TWideStringField
      FieldName = 'COMMA_ST_DES'
      Size = 50
    end
    object qrySTOCKS_2ANSPOCDE_ID: TFloatField
      FieldName = 'POCDE_ID'
    end
    object qrySTOCKS_2ANSPOCDE_NUM: TFloatField
      FieldName = 'POCDE_NUM'
    end
    object qrySTOCKS_2ANSPOCDE_TYP_POSTE: TFloatField
      FieldName = 'POCDE_TYP_POSTE'
    end
    object qrySTOCKS_2ANSPOCDE_TYP_POSTE_DES: TWideStringField
      FieldName = 'POCDE_TYP_POSTE_DES'
      Size = 50
    end
    object qrySTOCKS_2ANSPOCDE_REF: TWideStringField
      FieldName = 'POCDE_REF'
      Size = 50
    end
    object qrySTOCKS_2ANSPRCDT_ID: TFloatField
      FieldName = 'PRCDT_ID'
    end
    object qrySTOCKS_2ANSPRCDT_DES: TWideStringField
      FieldName = 'PRCDT_DES'
      Size = 50
    end
    object qrySTOCKS_2ANSPRCDT_MODE_GES: TFloatField
      FieldName = 'PRCDT_MODE_GES'
    end
    object qrySTOCKS_2ANSPRCDT_MODE_GES_DES: TWideStringField
      FieldName = 'PRCDT_MODE_GES_DES'
      Size = 50
    end
    object qrySTOCKS_2ANSPPECH_ID: TFloatField
      FieldName = 'PPECH_ID'
    end
    object qrySTOCKS_2ANSPPECH_DATE: TDateTimeField
      FieldName = 'PPECH_DATE'
    end
    object qrySTOCKS_2ANSPPECH_QTE_ORI: TFloatField
      FieldName = 'PPECH_QTE_ORI'
      DisplayFormat = ',0'
    end
    object qrySTOCKS_2ANSPPECH_QTE_TOLER: TFloatField
      FieldName = 'PPECH_QTE_TOLER'
      DisplayFormat = ',0'
    end
    object qrySTOCKS_2ANSPPECH_QTE_RESV: TFloatField
      FieldName = 'PPECH_QTE_RESV'
      DisplayFormat = ',0'
    end
    object qrySTOCKS_2ANSPPECH_QTE_CONSO: TFloatField
      FieldName = 'PPECH_QTE_CONSO'
      DisplayFormat = ',0'
    end
    object qrySTOCKS_2ANSPPECH_QTE_SOLDE: TFloatField
      FieldName = 'PPECH_QTE_SOLDE'
      DisplayFormat = ',0'
    end
    object qrySTOCKS_2ANSQTE_EXPEDIEE: TFloatField
      FieldName = 'QTE_EXPEDIEE'
      DisplayFormat = ',0'
    end
    object qrySTOCKS_2ANSQTE_A_EXPED: TFloatField
      FieldName = 'QTE_A_EXPED'
      DisplayFormat = ',0'
    end
    object qrySTOCKS_2ANSSOLDE_A_LIVRER: TFloatField
      FieldName = 'SOLDE_A_LIVRER'
      DisplayFormat = ',0'
    end
    object qrySTOCKS_2ANSADM_COLLA_TRIG: TWideStringField
      FieldName = 'ADM_COLLA_TRIG'
      Size = 10
    end
    object qrySTOCKS_2ANSCDM_COLLA_TRIG: TWideStringField
      FieldName = 'CDM_COLLA_TRIG'
      Size = 10
    end
    object qrySTOCKS_2ANSAVMAD_ID: TFloatField
      FieldName = 'AVMAD_ID'
    end
    object qrySTOCKS_2ANSAVMAD_DATE_REF: TDateTimeField
      FieldName = 'AVMAD_DATE_REF'
    end
  end
  object dsSTOCKS_2ANS: TDataSource
    DataSet = qrySTOCKS_2ANS
    Left = 1190
    Top = 701
  end
  object dxmdDDL_A_CREERListe: TdxMemData
    Indexes = <>
    SortOptions = []
    Left = 1536
    Top = 696
    object dxmdDDL_A_CREERListeCheckDDL: TIntegerField
      FieldName = 'CheckDDL'
    end
    object dxmdDDL_A_CREERListeCOMMA_ID: TIntegerField
      FieldName = 'COMMA_ID'
      Visible = False
    end
    object dxmdDDL_A_CREERListeCOMMA_NUM: TIntegerField
      FieldName = 'COMMA_NUM'
      Visible = False
    end
    object dxmdDDL_A_CREERListeCOMMA_VERSI: TIntegerField
      FieldName = 'COMMA_VERSI'
      Visible = False
    end
    object dxmdDDL_A_CREERListeCOMMA_ST: TIntegerField
      FieldName = 'COMMA_ST'
      Visible = False
    end
    object dxmdDDL_A_CREERListeDATE_MAD_CLIENT: TDateTimeField
      FieldName = 'DATE_MAD_CLIENT'
    end
    object dxmdDDL_A_CREERListePPECH_DATE: TDateTimeField
      FieldName = 'PPECH_DATE'
    end
    object dxmdDDL_A_CREERListeORFAB_MAD_DATE: TDateTimeField
      FieldName = 'ORFAB_MAD_DATE'
    end
    object dxmdDDL_A_CREERListeZOSTO_CODE: TStringField
      FieldName = 'ZOSTO_CODE'
    end
    object dxmdDDL_A_CREERListeZOSTO_DES: TStringField
      FieldName = 'ZOSTO_DES'
      Visible = False
    end
    object dxmdDDL_A_CREERListePPECH_DATE_MAD_DMD: TDateTimeField
      FieldName = 'PPECH_DATE_MAD_DMD'
    end
    object dxmdDDL_A_CREERListePOCDE_ID: TIntegerField
      FieldName = 'POCDE_ID'
      Visible = False
    end
    object dxmdDDL_A_CREERListePOCDE_NUM: TIntegerField
      FieldName = 'POCDE_NUM'
      Visible = False
    end
    object dxmdDDL_A_CREERListePOCDE_TYP_POSTE: TIntegerField
      FieldName = 'POCDE_TYP_POSTE'
      Visible = False
    end
    object dxmdDDL_A_CREERListePOCDE_TYP_POSTE_DES: TStringField
      FieldName = 'POCDE_TYP_POSTE_DES'
      Visible = False
    end
    object dxmdDDL_A_CREERListePPECH_ID: TIntegerField
      FieldName = 'PPECH_ID'
      Visible = False
    end
    object dxmdDDL_A_CREERListePPECH_QTE_TOLER: TIntegerField
      FieldName = 'PPECH_QTE_TOLER'
      Visible = False
      DisplayFormat = ',0'
    end
    object dxmdDDL_A_CREERListePPECH_QTE_RESV: TIntegerField
      FieldName = 'PPECH_QTE_RESV'
      Visible = False
      DisplayFormat = ',0'
    end
    object dxmdDDL_A_CREERListeLI_TIERS_CODE: TStringField
      FieldName = 'LI_TIERS_CODE'
    end
    object dxmdDDL_A_CREERListeLI_TIERS_RS_L1: TStringField
      FieldName = 'LI_TIERS_RS_L1'
    end
    object dxmdDDL_A_CREERListeSOLDE_A_LIVRER_COLS: TIntegerField
      FieldName = 'SOLDE_A_LIVRER_COLS'
    end
    object dxmdDDL_A_CREERListeSOLDE_A_LIVRER_PALS: TIntegerField
      FieldName = 'SOLDE_A_LIVRER_PALS'
    end
    object dxmdDDL_A_CREERListePALTI_IS_GERBABLE: TIntegerField
      FieldName = 'PALTI_IS_GERBABLE'
    end
    object dxmdDDL_A_CREERListePALTI_DEBOR_FLG: TIntegerField
      FieldName = 'PALTI_DEBOR_FLG'
    end
    object dxmdDDL_A_CREERListePPECH_OBSV_MAD_CLI: TStringField
      FieldName = 'PPECH_OBSV_MAD_CLI'
      Size = 4000
    end
    object dxmdDDL_A_CREERListeLIEFF_TYP_DES: TStringField
      FieldName = 'LIEFF_TYP_DES'
    end
    object dxmdDDL_A_CREERListeLIEFF_DES: TStringField
      DisplayWidth = 150
      FieldName = 'LIEFF_DES'
      Size = 200
    end
    object dxmdDDL_A_CREERListePOCDE_REF: TStringField
      FieldName = 'POCDE_REF'
    end
    object dxmdDDL_A_CREERListeCOMMA_ST_DES: TStringField
      FieldName = 'COMMA_ST_DES'
    end
    object dxmdDDL_A_CREERListePRCDT_DES: TStringField
      FieldName = 'PRCDT_DES'
    end
    object dxmdDDL_A_CREERListePPECH_QTE_ORI: TIntegerField
      FieldName = 'PPECH_QTE_ORI'
      DisplayFormat = ',0'
    end
    object dxmdDDL_A_CREERListePPECH_QTE_A_EXPED: TIntegerField
      FieldName = 'PPECH_QTE_A_EXPED'
      DisplayFormat = ',0'
    end
    object dxmdDDL_A_CREERListePPECH_QTE_CONSO: TIntegerField
      FieldName = 'PPECH_QTE_CONSO'
      DisplayFormat = ',0'
    end
    object dxmdDDL_A_CREERListeLI_TIERS_ID: TIntegerField
      FieldName = 'LI_TIERS_ID'
      Visible = False
    end
    object dxmdDDL_A_CREERListeLIEFF_ID: TIntegerField
      FieldName = 'LIEFF_ID'
      Visible = False
    end
    object dxmdDDL_A_CREERListeLIEFF_TYP: TIntegerField
      FieldName = 'LIEFF_TYP'
      Visible = False
    end
    object dxmdDDL_A_CREERListeLIEFF_LIEU_ID: TIntegerField
      FieldName = 'LIEFF_LIEU_ID'
      Visible = False
    end
    object dxmdDDL_A_CREERListeCLT_FIN_TIERS_ID: TIntegerField
      FieldName = 'CLT_FIN_TIERS_ID'
      Visible = False
    end
    object dxmdDDL_A_CREERListePPECH_OBSV_COMP: TStringField
      FieldName = 'PPECH_OBSV_COMP'
    end
    object dxmdDDL_A_CREERListeCLT_FIN_TIERS_CODE: TStringField
      FieldName = 'CLT_FIN_TIERS_CODE'
    end
    object dxmdDDL_A_CREERListeCLT_FIN_TIERS_RS_L1: TStringField
      FieldName = 'CLT_FIN_TIERS_RS_L1'
    end
    object dxmdDDL_A_CREERListeADM_COLLA_TRIG: TStringField
      FieldName = 'ADM_COLLA_TRIG'
    end
    object dxmdDDL_A_CREERListeCOMMA_REF_CL: TStringField
      FieldName = 'COMMA_REF_CL'
    end
    object dxmdDDL_A_CREERListeARBBE_DATE_RENDU: TDateTimeField
      FieldName = 'ARBBE_DATE_RENDU'
    end
    object dxmdDDL_A_CREERListeCADEN_ID: TIntegerField
      FieldName = 'CADEN_ID'
    end
    object dxmdDDL_A_CREERListeCADEN_NUM: TStringField
      FieldName = 'CADEN_NUM'
    end
    object dxmdDDL_A_CREERListeCADEN_DATECRE: TDateTimeField
      FieldName = 'CADEN_DATECRE'
    end
    object dxmdDDL_A_CREERListeCADEN_EXPE_ST: TIntegerField
      FieldName = 'CADEN_EXPE_ST'
    end
    object dxmdDDL_A_CREERListeCADEN_EXP_ST_DES: TStringField
      FieldName = 'CADEN_EXP_ST_DES'
    end
    object dxmdDDL_A_CREERListeCADEN_CMNT: TStringField
      FieldName = 'CADEN_CMNT'
      Size = 4000
    end
    object dxmdDDL_A_CREERListeCADEN_FLG_DDL_AUTO_DES: TStringField
      FieldName = 'CADEN_FLG_DDL_AUTO_DES'
    end
    object dxmdDDL_A_CREERListeDEROG_ZOSTO_CODE: TStringField
      FieldName = 'DEROG_ZOSTO_CODE'
    end
    object dxmdDDL_A_CREERListeMODTR_DES: TStringField
      FieldName = 'MODTR_DES'
    end
    object dxmdDDL_A_CREERListeINCOT_CODE: TStringField
      FieldName = 'INCOT_CODE'
    end
    object dxmdDDL_A_CREERListeLIEFF_PAYS: TStringField
      FieldName = 'LIEFF_PAYS'
      Size = 200
    end
    object dxmdDDL_A_CREERListeLI_CODE_POSTAL: TStringField
      FieldName = 'LI_CODE_POSTAL'
    end
  end
  object pmPopupDDL_A_CREER: TPopupMenu
    Left = 1664
    Top = 696
    object ItmCocherTout: TMenuItem
      Caption = 'D'#233'cocher tout'
    end
  end
  object tmRecherche: TTimer
    Enabled = False
    Interval = 200
    OnTimer = tmRechercheTimer
    Left = 2613
    Top = 744
  end
  object qryTARIFListe: TUniQuery
    Connection = dmdConnect.cntMain
    SQL.Strings = (
      'SELECT'
      '  IDT   TARIF_ID,'
      '  IDT   TARIF_NUM_VER,'
      '  DESI  TARIF_DES    ,'
      '  IDT    PRCDT_ID    ,'
      '  IDT    OLD_PRCDT_ID,'
      '  DESI   OLD_PRCDT_DES, '
      '  IDT    NEW_PRCDT_ID, '
      '  DESI   NEW_PRCDT_DES'
      'FROM'
      '  FDATA')
    Left = 1094
    Top = 649
    object qryTARIFListeTARIF_ID: TFloatField
      FieldName = 'TARIF_ID'
    end
    object qryTARIFListeTARIF_NUM_VER: TFloatField
      FieldName = 'TARIF_NUM_VER'
    end
    object qryTARIFListeTARIF_DES: TWideStringField
      FieldName = 'TARIF_DES'
      Size = 50
    end
    object qryTARIFListePRCDT_ID: TFloatField
      FieldName = 'PRCDT_ID'
    end
    object qryTARIFListeOLD_PRCDT_ID: TFloatField
      FieldName = 'OLD_PRCDT_ID'
    end
    object qryTARIFListeOLD_PRCDT_DES: TWideStringField
      FieldName = 'OLD_PRCDT_DES'
      Size = 50
    end
    object qryTARIFListeNEW_PRCDT_ID: TFloatField
      FieldName = 'NEW_PRCDT_ID'
    end
    object qryTARIFListeNEW_PRCDT_DES: TWideStringField
      FieldName = 'NEW_PRCDT_DES'
      Size = 50
    end
  end
  object dsTARIF: TDataSource
    DataSet = qryTARIFListe
    Left = 1190
    Top = 650
  end
end
