/**
 * Writes test-fixtures/large_unit.pas: a big Delphi unit made up for the tests (an order book), with the shapes a real one has: records next to
 * classes, many file-level routines declared on one line or on several, nested try/finally, routines that call each other.
 *
 *   node tools/make-large-unit.js
 */
const fs = require('fs');
const path = require('path');

const L = [];
const p = (...lines) => L.push(...lines);

p('unit large_unit;', '', 'interface', '', 'uses', '  System.SysUtils, System.Classes, Data.DB;', '', 'type');
p('  TOrderInfos = record', '    Id: Integer;', '    Customer: string;', '    Total: Currency;', '    Created: TDateTime;', '  end;', '');
p('  TLineInfos = record', '    OrderId: Integer;', '    Product: string;', '    Quantity: Integer;', '    Price: Currency;', '  end;', '');

const classes = ['TOrderBook', 'TPriceList', 'TStockLedger', 'TInvoiceWriter', 'TCustomerCache', 'TAuditTrail'];
for (const c of classes) {
    const n = c.slice(1);
    p(`  ${c} = class(TComponent)`,
        '  private',
        `    F${n}Count: Integer;`,
        '    FName: string;',
        '    procedure SetName(const Value: string);',
        '  protected',
        '    procedure Changed; virtual;',
        '  public',
        '    constructor Create(AOwner: TComponent); override;',
        '    destructor Destroy; override;',
        '    procedure Clear;',
        '    function Count: Integer;',
        '  published',
        '    property Name: string read FName write SetName;',
        '  end;', '');
}

const topics = ['Order', 'Line', 'Customer', 'Product', 'Stock', 'Invoice', 'Payment', 'Carrier', 'Discount', 'Tax', 'Audit', 'Price'];
const routines = [];
for (const t of topics) {
    routines.push({ name: `fGet_${t}_Label`, kind: 'function', params: 'aId: Integer', ret: 'string', multi: false });
    routines.push({ name: `fCount_${t}`, kind: 'function', params: 'aQuery: TDataSet', ret: 'Integer', multi: false });
    routines.push({ name: `pArchive_${t}`, kind: 'procedure', params: 'aQuery: TDataSet;\n  const aId: Integer;\n  const aReason: string', ret: '', multi: true });
    routines.push({ name: `fUpdate_${t}`, kind: 'function', params: 'aQuery: TDataSet;\n  const aId: Integer;\n  var aMessage: string', ret: 'Boolean', multi: true });
}
routines.push({ name: 'fComputeSalePrice', kind: 'function', params: 'aConnection: TComponent; const aProduct: string; aQuantity: Integer', ret: 'Currency', multi: false, special: 'price' });
routines.push({ name: 'fSaveOrder', kind: 'function', params: 'aConnection: TComponent; const aOrder: TOrderInfos', ret: 'Boolean', multi: false, special: 'save' });

const header = r => `${r.kind} ${r.name}(${r.params})${r.ret ? ': ' + r.ret : ''};`;
for (const r of routines) { p(...header(r).split('\n')); }
p('', 'implementation', '');

for (const c of classes) {
    const n = c.slice(1);
    p(`{ ${c} }`, '',
        `constructor ${c}.Create(AOwner: TComponent);`, 'begin', '  inherited Create(AOwner);', `  F${n}Count := 0;`, 'end;', '',
        `destructor ${c}.Destroy;`, 'begin', '  Clear;', '  inherited;', 'end;', '',
        `procedure ${c}.Changed;`, 'begin', `  Inc(F${n}Count);`, 'end;', '',
        `procedure ${c}.Clear;`, 'begin', `  F${n}Count := 0;`, '  Changed;', 'end;', '',
        `function ${c}.Count: Integer;`, 'begin', `  Result := F${n}Count;`, 'end;', '',
        `procedure ${c}.SetName(const Value: string);`, 'begin', '  if FName <> Value then', '  begin', '    FName := Value;', '    Changed;', '  end;', 'end;', '');
}

for (const r of routines) {
    p(...header(r).split('\n'));
    if (r.special === 'price') {
        p('var', '  oQuery: TDataSet;', '  nBase: Currency;', 'begin', '  Result := 0;', '  oQuery := TDataSet.Create(aConnection);', '  try',
            '    try', '      oQuery.Open;', '      nBase := fCount_Price(oQuery);',
            '      if aQuantity > 10 then', '      begin', '        nBase := nBase * 0.9;', '      end',
            '      else', '      begin', '        case aQuantity of', '          1: nBase := nBase * 1.1;', '          2..5: nBase := nBase * 1.05;', '        end;', '      end;',
            '      Result := nBase * aQuantity;', '    except', '      on E: Exception do', '        raise Exception.Create(fGet_Product_Label(0) + aProduct + E.Message);', '    end;',
            '  finally', '    FreeAndNil(oQuery);', '  end;', 'end;', '');
    } else if (r.special === 'save') {
        p('var', '  sMessage: string;', 'begin', '  Result := fUpdate_Order(nil, aOrder.Id, sMessage);', '  if not Result then', '    Result := fUpdate_Order(nil, aOrder.Id, sMessage);',
            '  if Result then', '    pArchive_Order(nil, aOrder.Id, sMessage);', 'end;', '');
    } else if (r.name.startsWith('fGet_')) {
        p('begin', `  Result := '${r.name.slice(5, -6)} ' + IntToStr(aId);`, 'end;', '');
    } else if (r.name.startsWith('fCount_')) {
        p('begin', '  Result := 0;', '  if Assigned(aQuery) then', '  begin', '    aQuery.First;', '    while not aQuery.Eof do', '    begin', '      Inc(Result);', '      aQuery.Next;', '    end;', '  end;', 'end;', '');
    } else if (r.name.startsWith('pArchive_')) {
        const t = r.name.slice(9);
        p('begin', '  if not Assigned(aQuery) then', '    Exit;', '  aQuery.Edit;', '  try', `    aQuery.FieldByName('REASON').AsString := aReason + fGet_${t}_Label(aId);`, '    aQuery.Post;', '  except', '    aQuery.Cancel;', '    raise;', '  end;', 'end;', '');
    } else {
        const t = r.name.slice(8);
        p('begin', '  Result := False;', "  aMessage := '';", '  try', `    if fCount_${t}(aQuery) > 0 then`, '    begin', `      pArchive_${t}(aQuery, aId, fGet_${t}_Label(aId));`, '      Result := True;', '    end;',
            '  except', '    on E: Exception do', '      aMessage := E.Message;', '  end;', 'end;', '');
    }
}
p('end.', '');

fs.writeFileSync(path.join(__dirname, '..', 'test-fixtures', 'large_unit.pas'), L.join('\r\n'));
console.log(L.length + ' lines');
