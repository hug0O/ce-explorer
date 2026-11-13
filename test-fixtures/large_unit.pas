unit large_unit;

interface

uses
  System.SysUtils, System.Classes, Data.DB;

type
  TOrderInfos = record
    Id: Integer;
    Customer: string;
    Total: Currency;
    Created: TDateTime;
  end;

  TLineInfos = record
    OrderId: Integer;
    Product: string;
    Quantity: Integer;
    Price: Currency;
  end;

  TOrderBook = class(TComponent)
  private
    FOrderBookCount: Integer;
    FName: string;
    procedure SetName(const Value: string);
  protected
    procedure Changed; virtual;
  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;
    procedure Clear;
    function Count: Integer;
  published
    property Name: string read FName write SetName;
  end;

  TPriceList = class(TComponent)
  private
    FPriceListCount: Integer;
    FName: string;
    procedure SetName(const Value: string);
  protected
    procedure Changed; virtual;
  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;
    procedure Clear;
    function Count: Integer;
  published
    property Name: string read FName write SetName;
  end;

  TStockLedger = class(TComponent)
  private
    FStockLedgerCount: Integer;
    FName: string;
    procedure SetName(const Value: string);
  protected
    procedure Changed; virtual;
  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;
    procedure Clear;
    function Count: Integer;
  published
    property Name: string read FName write SetName;
  end;

  TInvoiceWriter = class(TComponent)
  private
    FInvoiceWriterCount: Integer;
    FName: string;
    procedure SetName(const Value: string);
  protected
    procedure Changed; virtual;
  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;
    procedure Clear;
    function Count: Integer;
  published
    property Name: string read FName write SetName;
  end;

  TCustomerCache = class(TComponent)
  private
    FCustomerCacheCount: Integer;
    FName: string;
    procedure SetName(const Value: string);
  protected
    procedure Changed; virtual;
  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;
    procedure Clear;
    function Count: Integer;
  published
    property Name: string read FName write SetName;
  end;

  TAuditTrail = class(TComponent)
  private
    FAuditTrailCount: Integer;
    FName: string;
    procedure SetName(const Value: string);
  protected
    procedure Changed; virtual;
  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;
    procedure Clear;
    function Count: Integer;
  published
    property Name: string read FName write SetName;
  end;

function fGet_Order_Label(aId: Integer): string;
function fCount_Order(aQuery: TDataSet): Integer;
procedure pArchive_Order(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Order(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fGet_Line_Label(aId: Integer): string;
function fCount_Line(aQuery: TDataSet): Integer;
procedure pArchive_Line(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Line(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fGet_Customer_Label(aId: Integer): string;
function fCount_Customer(aQuery: TDataSet): Integer;
procedure pArchive_Customer(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Customer(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fGet_Product_Label(aId: Integer): string;
function fCount_Product(aQuery: TDataSet): Integer;
procedure pArchive_Product(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Product(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fGet_Stock_Label(aId: Integer): string;
function fCount_Stock(aQuery: TDataSet): Integer;
procedure pArchive_Stock(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Stock(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fGet_Invoice_Label(aId: Integer): string;
function fCount_Invoice(aQuery: TDataSet): Integer;
procedure pArchive_Invoice(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Invoice(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fGet_Payment_Label(aId: Integer): string;
function fCount_Payment(aQuery: TDataSet): Integer;
procedure pArchive_Payment(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Payment(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fGet_Carrier_Label(aId: Integer): string;
function fCount_Carrier(aQuery: TDataSet): Integer;
procedure pArchive_Carrier(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Carrier(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fGet_Discount_Label(aId: Integer): string;
function fCount_Discount(aQuery: TDataSet): Integer;
procedure pArchive_Discount(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Discount(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fGet_Tax_Label(aId: Integer): string;
function fCount_Tax(aQuery: TDataSet): Integer;
procedure pArchive_Tax(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Tax(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fGet_Audit_Label(aId: Integer): string;
function fCount_Audit(aQuery: TDataSet): Integer;
procedure pArchive_Audit(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Audit(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fGet_Price_Label(aId: Integer): string;
function fCount_Price(aQuery: TDataSet): Integer;
procedure pArchive_Price(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
function fUpdate_Price(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
function fComputeSalePrice(aConnection: TComponent; const aProduct: string; aQuantity: Integer): Currency;
function fSaveOrder(aConnection: TComponent; const aOrder: TOrderInfos): Boolean;

implementation

{ TOrderBook }

constructor TOrderBook.Create(AOwner: TComponent);
begin
  inherited Create(AOwner);
  FOrderBookCount := 0;
end;

destructor TOrderBook.Destroy;
begin
  Clear;
  inherited;
end;

procedure TOrderBook.Changed;
begin
  Inc(FOrderBookCount);
end;

procedure TOrderBook.Clear;
begin
  FOrderBookCount := 0;
  Changed;
end;

function TOrderBook.Count: Integer;
begin
  Result := FOrderBookCount;
end;

procedure TOrderBook.SetName(const Value: string);
begin
  if FName <> Value then
  begin
    FName := Value;
    Changed;
  end;
end;

{ TPriceList }

constructor TPriceList.Create(AOwner: TComponent);
begin
  inherited Create(AOwner);
  FPriceListCount := 0;
end;

destructor TPriceList.Destroy;
begin
  Clear;
  inherited;
end;

procedure TPriceList.Changed;
begin
  Inc(FPriceListCount);
end;

procedure TPriceList.Clear;
begin
  FPriceListCount := 0;
  Changed;
end;

function TPriceList.Count: Integer;
begin
  Result := FPriceListCount;
end;

procedure TPriceList.SetName(const Value: string);
begin
  if FName <> Value then
  begin
    FName := Value;
    Changed;
  end;
end;

{ TStockLedger }

constructor TStockLedger.Create(AOwner: TComponent);
begin
  inherited Create(AOwner);
  FStockLedgerCount := 0;
end;

destructor TStockLedger.Destroy;
begin
  Clear;
  inherited;
end;

procedure TStockLedger.Changed;
begin
  Inc(FStockLedgerCount);
end;

procedure TStockLedger.Clear;
begin
  FStockLedgerCount := 0;
  Changed;
end;

function TStockLedger.Count: Integer;
begin
  Result := FStockLedgerCount;
end;

procedure TStockLedger.SetName(const Value: string);
begin
  if FName <> Value then
  begin
    FName := Value;
    Changed;
  end;
end;

{ TInvoiceWriter }

constructor TInvoiceWriter.Create(AOwner: TComponent);
begin
  inherited Create(AOwner);
  FInvoiceWriterCount := 0;
end;

destructor TInvoiceWriter.Destroy;
begin
  Clear;
  inherited;
end;

procedure TInvoiceWriter.Changed;
begin
  Inc(FInvoiceWriterCount);
end;

procedure TInvoiceWriter.Clear;
begin
  FInvoiceWriterCount := 0;
  Changed;
end;

function TInvoiceWriter.Count: Integer;
begin
  Result := FInvoiceWriterCount;
end;

procedure TInvoiceWriter.SetName(const Value: string);
begin
  if FName <> Value then
  begin
    FName := Value;
    Changed;
  end;
end;

{ TCustomerCache }

constructor TCustomerCache.Create(AOwner: TComponent);
begin
  inherited Create(AOwner);
  FCustomerCacheCount := 0;
end;

destructor TCustomerCache.Destroy;
begin
  Clear;
  inherited;
end;

procedure TCustomerCache.Changed;
begin
  Inc(FCustomerCacheCount);
end;

procedure TCustomerCache.Clear;
begin
  FCustomerCacheCount := 0;
  Changed;
end;

function TCustomerCache.Count: Integer;
begin
  Result := FCustomerCacheCount;
end;

procedure TCustomerCache.SetName(const Value: string);
begin
  if FName <> Value then
  begin
    FName := Value;
    Changed;
  end;
end;

{ TAuditTrail }

constructor TAuditTrail.Create(AOwner: TComponent);
begin
  inherited Create(AOwner);
  FAuditTrailCount := 0;
end;

destructor TAuditTrail.Destroy;
begin
  Clear;
  inherited;
end;

procedure TAuditTrail.Changed;
begin
  Inc(FAuditTrailCount);
end;

procedure TAuditTrail.Clear;
begin
  FAuditTrailCount := 0;
  Changed;
end;

function TAuditTrail.Count: Integer;
begin
  Result := FAuditTrailCount;
end;

procedure TAuditTrail.SetName(const Value: string);
begin
  if FName <> Value then
  begin
    FName := Value;
    Changed;
  end;
end;

function fGet_Order_Label(aId: Integer): string;
begin
  Result := 'Order ' + IntToStr(aId);
end;

function fCount_Order(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Order(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Order_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Order(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Order(aQuery) > 0 then
    begin
      pArchive_Order(aQuery, aId, fGet_Order_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fGet_Line_Label(aId: Integer): string;
begin
  Result := 'Line ' + IntToStr(aId);
end;

function fCount_Line(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Line(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Line_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Line(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Line(aQuery) > 0 then
    begin
      pArchive_Line(aQuery, aId, fGet_Line_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fGet_Customer_Label(aId: Integer): string;
begin
  Result := 'Customer ' + IntToStr(aId);
end;

function fCount_Customer(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Customer(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Customer_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Customer(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Customer(aQuery) > 0 then
    begin
      pArchive_Customer(aQuery, aId, fGet_Customer_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fGet_Product_Label(aId: Integer): string;
begin
  Result := 'Product ' + IntToStr(aId);
end;

function fCount_Product(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Product(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Product_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Product(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Product(aQuery) > 0 then
    begin
      pArchive_Product(aQuery, aId, fGet_Product_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fGet_Stock_Label(aId: Integer): string;
begin
  Result := 'Stock ' + IntToStr(aId);
end;

function fCount_Stock(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Stock(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Stock_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Stock(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Stock(aQuery) > 0 then
    begin
      pArchive_Stock(aQuery, aId, fGet_Stock_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fGet_Invoice_Label(aId: Integer): string;
begin
  Result := 'Invoice ' + IntToStr(aId);
end;

function fCount_Invoice(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Invoice(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Invoice_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Invoice(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Invoice(aQuery) > 0 then
    begin
      pArchive_Invoice(aQuery, aId, fGet_Invoice_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fGet_Payment_Label(aId: Integer): string;
begin
  Result := 'Payment ' + IntToStr(aId);
end;

function fCount_Payment(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Payment(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Payment_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Payment(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Payment(aQuery) > 0 then
    begin
      pArchive_Payment(aQuery, aId, fGet_Payment_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fGet_Carrier_Label(aId: Integer): string;
begin
  Result := 'Carrier ' + IntToStr(aId);
end;

function fCount_Carrier(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Carrier(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Carrier_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Carrier(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Carrier(aQuery) > 0 then
    begin
      pArchive_Carrier(aQuery, aId, fGet_Carrier_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fGet_Discount_Label(aId: Integer): string;
begin
  Result := 'Discount ' + IntToStr(aId);
end;

function fCount_Discount(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Discount(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Discount_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Discount(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Discount(aQuery) > 0 then
    begin
      pArchive_Discount(aQuery, aId, fGet_Discount_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fGet_Tax_Label(aId: Integer): string;
begin
  Result := 'Tax ' + IntToStr(aId);
end;

function fCount_Tax(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Tax(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Tax_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Tax(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Tax(aQuery) > 0 then
    begin
      pArchive_Tax(aQuery, aId, fGet_Tax_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fGet_Audit_Label(aId: Integer): string;
begin
  Result := 'Audit ' + IntToStr(aId);
end;

function fCount_Audit(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Audit(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Audit_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Audit(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Audit(aQuery) > 0 then
    begin
      pArchive_Audit(aQuery, aId, fGet_Audit_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fGet_Price_Label(aId: Integer): string;
begin
  Result := 'Price ' + IntToStr(aId);
end;

function fCount_Price(aQuery: TDataSet): Integer;
begin
  Result := 0;
  if Assigned(aQuery) then
  begin
    aQuery.First;
    while not aQuery.Eof do
    begin
      Inc(Result);
      aQuery.Next;
    end;
  end;
end;

procedure pArchive_Price(aQuery: TDataSet;
  const aId: Integer;
  const aReason: string);
begin
  if not Assigned(aQuery) then
    Exit;
  aQuery.Edit;
  try
    aQuery.FieldByName('REASON').AsString := aReason + fGet_Price_Label(aId);
    aQuery.Post;
  except
    aQuery.Cancel;
    raise;
  end;
end;

function fUpdate_Price(aQuery: TDataSet;
  const aId: Integer;
  var aMessage: string): Boolean;
begin
  Result := False;
  aMessage := '';
  try
    if fCount_Price(aQuery) > 0 then
    begin
      pArchive_Price(aQuery, aId, fGet_Price_Label(aId));
      Result := True;
    end;
  except
    on E: Exception do
      aMessage := E.Message;
  end;
end;

function fComputeSalePrice(aConnection: TComponent; const aProduct: string; aQuantity: Integer): Currency;
var
  oQuery: TDataSet;
  nBase: Currency;
begin
  Result := 0;
  oQuery := TDataSet.Create(aConnection);
  try
    try
      oQuery.Open;
      nBase := fCount_Price(oQuery);
      if aQuantity > 10 then
      begin
        nBase := nBase * 0.9;
      end
      else
      begin
        case aQuantity of
          1: nBase := nBase * 1.1;
          2..5: nBase := nBase * 1.05;
        end;
      end;
      Result := nBase * aQuantity;
    except
      on E: Exception do
        raise Exception.Create(fGet_Product_Label(0) + aProduct + E.Message);
    end;
  finally
    FreeAndNil(oQuery);
  end;
end;

function fSaveOrder(aConnection: TComponent; const aOrder: TOrderInfos): Boolean;
var
  sMessage: string;
begin
  Result := fUpdate_Order(nil, aOrder.Id, sMessage);
  if not Result then
    Result := fUpdate_Order(nil, aOrder.Id, sMessage);
  if Result then
    pArchive_Order(nil, aOrder.Id, sMessage);
end;

end.
