unit StandaloneMath;

interface

uses
  SysUtils, Math, Classes;

const
  PI_APPROX = 3.14159;
  MAX_ITERATIONS = 1000;
  EPSILON = 1.0E-9;

type
  TPoint2D = record
    X: Double;
    Y: Double;
  end;

  TVector = array of Double;
  TPointArray = array of TPoint2D;

  TDirection = (dirNorth, dirSouth, dirEast, dirWest);

function Add(A, B: Double): Double;
function Subtract(A, B: Double): Double;
function Multiply(A, B: Double): Double;
function Divide(A, B: Double): Double;
function Power(Base: Double; Exponent: Integer): Double;
function Factorial(N: Integer): Int64;
function IsPrime(N: Integer): Boolean;
function Fibonacci(N: Integer): Int64;
function GCD(A, B: Integer): Integer;
function Distance(const P1, P2: TPoint2D): Double;
function SumVector(const Values: TVector): Double;
function Average(const Values: TVector): Double;
function Clamp(Value, Min, Max: Double): Double;
function ToRadians(Degrees: Double): Double;
procedure Swap(var A, B: Integer);
procedure QuickSort(var Values: TVector);
procedure LogInfo(const Msg: string);

implementation

function Add(A, B: Double): Double;
begin
  Result := A + B;
end;

function Subtract(A, B: Double): Double;
begin
  Result := A - B;
end;

function Multiply(A, B: Double): Double;
begin
  Result := A * B;
end;

function Divide(A, B: Double): Double;
begin
  if B = 0 then
    raise EDivByZero.Create('Division by zero');
  Result := A / B;
end;

function Power(Base: Double; Exponent: Integer): Double;
var
  i: Integer;
  Acc: Double;
begin
  Acc := 1.0;
  for i := 1 to Exponent do
    Acc := Acc * Base;
  Result := Acc;
end;

function Factorial(N: Integer): Int64;
begin
  if N <= 1 then
    Result := 1
  else
    Result := N * Factorial(N - 1);
end;

function IsPrime(N: Integer): Boolean;
var
  i: Integer;
begin
  if N < 2 then
    Exit(False);
  i := 2;
  while i * i <= N do
  begin
    if N mod i = 0 then
      Exit(False);
    Inc(i);
  end;
  Result := True;
end;

function Fibonacci(N: Integer): Int64;
begin
  if N <= 0 then
    Result := 0
  else if N = 1 then
    Result := 1
  else
    Result := Fibonacci(N - 1) + Fibonacci(N - 2);
end;

function GCD(A, B: Integer): Integer;
begin
  while B <> 0 do
  begin
    A := A mod B;
    // Swap A and B
    A := A xor B;
    B := A xor B;
    A := A xor B;
  end;
  Result := Abs(A);
end;

function Distance(const P1, P2: TPoint2D): Double;
begin
  Result := Sqrt(Sqr(P2.X - P1.X) + Sqr(P2.Y - P1.Y));
end;

function SumVector(const Values: TVector): Double;
var
  i: Integer;
  Total: Double;
begin
  Total := 0.0;
  for i := 0 to High(Values) do
    Total := Total + Values[i];
  Result := Total;
end;

function Average(const Values: TVector): Double;
begin
  if Length(Values) = 0 then
    Result := 0.0
  else
    Result := SumVector(Values) / Length(Values);
end;

function Clamp(Value, Min, Max: Double): Double;
begin
  if Value < Min then
    Result := Min
  else if Value > Max then
    Result := Max
  else
    Result := Value;
end;

function ToRadians(Degrees: Double): Double;
begin
  Result := Degrees * (PI_APPROX / 180.0);
end;

procedure Swap(var A, B: Integer);
var
  Temp: Integer;
begin
  Temp := A;
  A := B;
  B := Temp;
end;

procedure QuickSort(var Values: TVector);
  procedure Sort(Lo, Hi: Integer);
  var
    i, j, Pivot: Integer;
  begin
    i := Lo;
    j := Hi;
    Pivot := Values[(Lo + Hi) div 2];
    repeat
      while Values[i] < Pivot do Inc(i);
      while Values[j] > Pivot do Dec(j);
      if i <= j then
      begin
        Swap(Values[i], Values[j]);
        Inc(i);
        Dec(j);
      end;
    until i > j;
    if Lo < j then Sort(Lo, j);
    if i < Hi then Sort(i, Hi);
  end;
begin
  if Length(Values) > 1 then
    Sort(0, High(Values));
end;

procedure LogInfo(const Msg: string);
begin
  WriteLn('[INFO] ' + Msg);
end;

end.
