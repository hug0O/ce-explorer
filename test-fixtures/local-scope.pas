unit local_scope;
interface
type
  TCalc = class
  private
    FTotal: Integer;
  public
    function Sum(A, B: Integer): Integer;
  end;
implementation

function TCalc.Sum(A, B: Integer): Integer;
var
  Result2: Integer;
  Name: string;
begin
  Result2 := A + B;
  Name := 'x';
  Result := Result2;
end;

end.
