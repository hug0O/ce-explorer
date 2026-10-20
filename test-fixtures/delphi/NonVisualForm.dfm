object NonVisualForm: TNonVisualForm
  Left = 0
  Top = 0
  Caption = 'Composants non visuels'
  ClientHeight = 300
  ClientWidth = 520
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -12
  Font.Name = 'Segoe UI'
  Font.Style = []
  TextHeight = 15
  object btnOuvrir: TButton
    Left = 16
    Top = 16
    Width = 90
    Height = 28
    Caption = 'Ouvrir'
    TabOrder = 0
    OnClick = btnOuvrirClick
  end
  object dxLayoutControl1: TdxLayoutControl
    Left = 16
    Top = 56
    Width = 300
    Height = 160
    TabOrder = 1
    object edtNom: TcxTextEdit
      Left = 70
      Top = 10
      Width = 200
      Height = 21
      TabOrder = 0
    end
    object dxLayoutControl1Group_Root: TdxLayoutGroup
      AlignHorz = ahClient
      AlignVert = avClient
      Hidden = True
      ShowBorder = False
      Index = -1
    end
    object dxLayoutControl1Item1: TdxLayoutItem
      Parent = dxLayoutControl1Group_Root
      CaptionOptions.Text = 'Nom'
      Control = edtNom
      ControlOptions.ShowBorder = False
      Index = 0
    end
  end
  object UniConnection1: TUniConnection
    ProviderName = 'Oracle'
    Database = 'ORCL'
    LoginPrompt = False
  end
  object UniQuery1: TUniQuery
    Connection = UniConnection1
    SQL.Strings = (
      'select ID, NOM'
      'from CLIENTS'
      'where VILLE = :VILLE')
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'VILLE'
        Value = nil
      end>
    object UniQuery1ID: TIntegerField
      FieldName = 'ID'
    end
  end
  object cxStyleRepository1: TcxStyleRepository
    Left = 400
    PixelsPerInch = 96
    object cxStyle1: TcxStyle
      AssignedValues = [svColor]
      Color = 15451300
    end
    object cxStyle2: TcxStyle
      AssignedValues = [svFont]
    end
  end
  object cxEditRepository1: TcxEditRepository
    Left = 440
    Top = 248
    object cxEditRepository1TextItem1: TcxEditRepositoryTextItem
      Properties.MaxLength = 20
    end
  end
  object cxLookAndFeelController1: TcxLookAndFeelController
    Kind = lfOffice11
    NativeStyle = False
    SkinName = 'Office2016Colorful'
    Left = 360
    Top = 248
  end
  object cxImageList1: TcxImageList
    Height = 16
    Width = 16
    FormatVersion = 1
    DesignInfo = 6291560
  end
  object tmrStatut: TTimer
    Interval = 5000
    Left = 1200
    Top = 900
  end
  object DataSource1: TDataSource
    DataSet = UniQuery1
  end
end
