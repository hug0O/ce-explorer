object WrappedForm: TWrappedForm
  Left = 0
  Top = 0
  Caption = 'WrappedForm'
  ClientHeight = 240
  ClientWidth = 420
  Color = clBtnFace
  OnKeyDown = FormKeyDown
  PixelsPerInch = 96
  TextHeight = 13
  object pnlTop: TPanel
    Left = 0
    Top = 0
    Width = 420
    Height = 60
    Align = alTop
    TabOrder = 0
    object btnSave: TButton
      Left = 8
      Top = 8
      Width = 75
      Height = 25
      Caption = 'Save'
      TabOrder = 0
      OnClick = btnSaveClick
    end
  end
  object cxGrid1: TcxGrid
    Left = 0
    Top = 60
    Width = 420
    Height = 150
    Align = alClient
    TabOrder = 1
    object cxGrid1DBTableView1: TcxGridDBTableView
      Navigator.Buttons.CustomButtons = <>
      OnSelectionChanged = cxGrid1DBTableView1SelectionChanged
      DataController.Summary.DefaultGroupSummaryItems = <>
      object cxGrid1DBTableView1ID: TcxGridDBColumn
        DataBinding.FieldName = 'ID'
      end
      object TcxGridDBColumn
        DataBinding.FieldName = 'LABEL'
      end
      object cxGrid1DBTableView1Name: TcxGridDBColumn
        DataBinding.FieldName = 'NAME'
      end
    end
    object cxGrid1Level1: TcxGridLevel
      GridView = cxGrid1DBTableView1
    end
  end
  object edtAfter: TEdit
    Left = 8
    Top = 216
    Width = 121
    Height = 21
    TabOrder = 2
    Text = 'edtAfter'
    OnExit = edtAfterExit
  end
end
