object UniForm: TUniForm
  Left = 0
  Top = 0
  Caption = 'Clients (UniDAC)'
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
  object UniConnection1: TUniConnection
    ProviderName = 'Oracle'
    Database = 'ORCL'
    Username = 'scott'
    Server = 'localhost:1521'
    LoginPrompt = False
    AfterConnect = UniConnection1AfterConnect
    Left = 24
    Top = 232
  end
  object UniQuery1: TUniQuery
    Connection = UniConnection1
    SQL.Strings = (
      'select ID, NOM, SOLDE'
      'from CLIENTS'
      'where VILLE = :VILLE'
      'order by NOM')
    AfterOpen = UniQuery1AfterOpen
    Left = 96
    Top = 232
    ParamData = <
      item
        DataType = ftUnknown
        Name = 'VILLE'
        Value = nil
      end>
    object UniQuery1ID: TIntegerField
      FieldName = 'ID'
      Required = True
    end
    object UniQuery1NOM: TStringField
      DisplayLabel = 'Nom'
      FieldName = 'NOM'
      Size = 80
      OnGetText = UniQuery1NOMGetText
    end
    object UniQuery1SOLDE: TFloatField
      FieldName = 'SOLDE'
      DisplayFormat = '#,##0.00'
    end
  end
  object UniTable1: TUniTable
    TableName = 'COMMANDES'
    Connection = UniConnection1
    Left = 168
    Top = 232
  end
  object DataSource1: TDataSource
    DataSet = UniQuery1
    Left = 240
    Top = 232
  end
  object OracleUniProvider1: TOracleUniProvider
    Left = 312
    Top = 232
  end
end
