unit StandaloneUnit;

interface

type
  TMyRecord = record
    ID: Integer;
    Name: string;
  end;
uses
  SysUtils;

function CalculateTotal(Values: array of Double): Double;
procedure LogMessage(const Msg: string);
function GetVersion: string;
procedure InitializeApp;
function IsValid(const Value: Integer): Boolean;



implementation

function CalculateTotal(Values: array of Double): Double;
var
  i: Integer;
  Total: Double;
begin
  Total := 0;
  for i := 0 to High(Values) do
    Total := Total + Values[i];
  Result := Total;
end;

procedure LogMessage(const Msg: string);
begin
  WriteLn('[LOG] ' + Msg);
end;

function GetVersion: string;
begin
  Result := '1.0.0';
end;

procedure InitializeApp;
begin
  // Application initialization
  
end;

function IsValid(const Value: Integer): Boolean;
begin
  Result := (Value >= 0) and (Value <= 100);
end;

end.

