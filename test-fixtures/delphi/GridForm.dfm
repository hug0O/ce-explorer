object GridForm: TGridForm
  Left = 0
  Top = 0
  Caption = 'Clients'
  ClientHeight = 360
  ClientWidth = 640
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -12
  Font.Name = 'Segoe UI'
  Font.Style = []
  TextHeight = 15
  object cxGrid1: TcxGrid
    Left = 8
    Top = 8
    Width = 620
    Height = 300
    TabOrder = 0
    object cxGrid1DBTableView1: TcxGridDBTableView
      Navigator.Buttons.CustomButtons = <>
      DataController.DataSource = DataSource1
      DataController.Summary.DefaultGroupSummaryItems = <>
      DataController.Summary.FooterSummaryItems = <>
      DataController.Summary.SummaryGroups = <>
      OptionsView.GroupByBox = False
      OnCellDblClick = cxGrid1DBTableView1CellDblClick
      object cxGrid1DBTableView1ID: TcxGridDBColumn
        DataBinding.FieldName = 'ID'
        Width = 50
      end
      object cxGrid1DBTableView1NOM: TcxGridDBColumn
        Caption = 'Nom'
        DataBinding.FieldName = 'NOM'
        Width = 180
        OnGetDisplayText = cxGrid1DBTableView1NOMGetDisplayText
      end
      object cxGrid1DBTableView1VILLE: TcxGridDBColumn
        DataBinding.FieldName = 'VILLE'
        Width = 120
      end
      object cxGrid1DBTableView1NOTES: TcxGridDBColumn
        DataBinding.FieldName = 'NOTES'
        Visible = False
        Width = 200
      end
    end
    object cxGrid1DBTableView2: TcxGridDBTableView
      DataController.Summary.DefaultGroupSummaryItems = <>
      object cxGrid1DBTableView2Column1: TcxGridDBColumn
        Caption = 'Autre'
      end
    end
    object cxGrid1Level1: TcxGridLevel
      GridView = cxGrid1DBTableView1
    end
  end
  object DataSource1: TDataSource
    Left = 584
    Top = 320
  end
  object cxButton1: TcxButton
    Left = 8
    Top = 320
    Width = 90
    Height = 28
    Caption = 'Fermer'
    TabOrder = 1
  end
end
