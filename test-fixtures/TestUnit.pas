unit TestUnit;

interface

uses
  SysUtils, Classes;

type
  TBaseClass = class
  private
    FBaseField: Integer;
  public
    procedure BaseMethod;
  end; 

  TDemoClass = class(TBaseClass)
  private
    FActive: Boolean;
    FCount: Integer;
    FName: string;
    property Active: Boolean read FActive write SetActive;
  protected
    property Count: Integer read FCount;
  public
    property Name: string read FName write FName;
    constructor Create(AOwner: TComponent);
    destructor Destroy; override;
    procedure Calculate(X, Y: Double; out Result: Double);
    procedure DoSomething(AParam: string);
  published
    function GetValue: Integer;
    procedure DoProtected;
    procedure SetActive(Value: Boolean);
  end;

  TAnotherClass = class
  private
    FData: Pointer;
  public
    procedure Process;
  end;

implementation

procedure TBaseClass.BaseMethod;
begin
  // base implementation
end;

constructor TDemoClass.Create(AOwner: TComponent);
begin
  inherited Create(AOwner);
  FActive := False;
  FName := '';
  FCount := 0;
end;

destructor TDemoClass.Destroy;
begin
  inherited Destroy;
end;

procedure TDemoClass.SetActive(Value: Boolean);
begin
  FActive := Value;
end;

procedure TDemoClass.DoSomething(AParam: string);
begin
  WriteLn(AParam);
end;

function TDemoClass.GetValue: Integer;
begin
  Result := FCount;
end;

procedure TDemoClass.Calculate(X, Y: Double; out Result: Double);
begin
  Result := X + Y;
end;

procedure TAnotherClass.Process;
begin
  // process
end;

end.
