/**
 * The objects of the standard libraries, for the files whose source is not in the project: the Delphi RTL and VCL units, the C and C++
 * headers, a few modules of Python and Node. A file that `uses` SysUtils or includes <stdio.h> points to objects nobody indexed, so the
 * Structure tabs would never list `Format` or `printf`; this catalog gives them, written `<unit>.<name>` like the others.
 *
 * It lists the objects that are used every day, not every object of every library: what is missing is not shown, what is shown is real.
 */
import { ExternalSymbol, UsedRefs } from './usedFiles';

interface Library {
    /** The name the file is known by when it is written in a `uses` or an `include`, lower case, last part (`sysutils` for `System.SysUtils`). */
    key: string;
    /** The name shown in the label. */
    shown: string;
    /** `function`, `class`... and the names, space separated. A name after `:` has that kind (`TList:class`). */
    names: string;
    /** The names are members of a module, written after a dot (`os.getcwd`): the label then carries the module. */
    module?: boolean;
}

const DELPHI: Library[] = [
    { key: 'system', shown: 'System', names: 'Length SetLength Copy Pos Delete Insert Inc Dec Ord Chr High Low Round Trunc Abs Sqr Sqrt Random Randomize Assigned GetMem FreeMem New Dispose SizeOf Exit Halt Writeln Write Readln Str Val FillChar Move UpperCase Concat SetString StringOfChar Succ Pred Odd Frac Int Exp Ln Sin Cos ArcTan Pi ParamCount ParamStr TObject TArray TInterfacedObject IInterface IUnknown Exception' },
    { key: 'sysutils', shown: 'System.SysUtils', names: 'IntToStr StrToInt StrToIntDef TryStrToInt IntToHex StrToFloat TryStrToFloat FloatToStr FloatToStrF Format FormatDateTime DateToStr TimeToStr DateTimeToStr StrToDate StrToDateTime StrToTime Now Date Time UpperCase LowerCase Trim TrimLeft TrimRight CompareText CompareStr SameText QuotedStr AnsiQuotedStr FileExists DirectoryExists DeleteFile RenameFile ForceDirectories CreateDir RemoveDir ExtractFileName ExtractFilePath ExtractFileExt ExtractFileDir ChangeFileExt IncludeTrailingPathDelimiter ExcludeTrailingPathDelimiter ExpandFileName FreeAndNil BoolToStr StrToBool Sleep GetCurrentDir SetCurrentDir FindFirst FindNext FindClose Supports Beep GUIDToString CreateGUID StringReplace WideFormat AnsiUpperCase AnsiLowerCase IsDelimiter LastDelimiter StrLen StrCopy StrPas TFormatSettings TStringBuilder TEncoding TBytes TStringHelper EAbort EConvertError EInOutError EOSError EAccessViolation EDivByZero EOutOfMemory TSearchRec TGUID' },
    { key: 'classes', shown: 'System.Classes', names: 'TStringList:class TStrings:class TList:class TComponent:class TStream:class TFileStream:class TMemoryStream:class TStringStream:class TResourceStream:class TThread:class TPersistent:class TCollection:class TCollectionItem:class TReader:class TWriter:class TBits:class TStreamReader:class TStreamWriter:class TStringReader:class TStringWriter:class TNotifyEvent:type TBasicAction:class TShiftState:type TOperation:type TThreadList:class TInterfacedPersistent:class TBytesStream:class TBinaryReader:class TBinaryWriter:class TIdentMapEntry:type TGetStrProc:type TStreamOwnership:type BytesOf:function Synchronize:function Queue:function' },
    { key: 'math', shown: 'System.Math', names: 'Power Ceil Floor RoundTo SimpleRoundTo IsNan IsInfinite Log10 Log2 LogN ArcTan2 ArcSin ArcCos Sign InRange EnsureRange DivMod MinValue MaxValue Sum Mean StdDev RandomRange RandG SameValue IfThen Max Min CompareValue Tan Cotan Hypot DegToRad RadToDeg Exp' },
    { key: 'strutils', shown: 'System.StrUtils', names: 'ContainsStr ContainsText StartsStr StartsText EndsStr EndsText ReplaceStr ReplaceText LeftStr RightStr MidStr DupeString ReverseString IfThen PosEx SplitString IndexStr IndexText MatchStr MatchText AnsiContainsStr AnsiStartsStr AnsiEndsStr AnsiReplaceStr SearchBuf Soundex StuffString AnsiIndexStr RandomFrom NPos' },
    { key: 'dateutils', shown: 'System.DateUtils', names: 'IncDay IncMonth IncYear IncHour IncMinute IncSecond IncWeek DaysBetween MonthsBetween YearsBetween WeeksBetween HoursBetween MinutesBetween SecondsBetween StartOfTheDay EndOfTheDay StartOfTheMonth EndOfTheMonth StartOfTheYear EndOfTheYear StartOfTheWeek EndOfTheWeek DayOfTheWeek DayOfTheMonth DayOfTheYear MonthOf YearOf DayOf HourOf MinuteOf SecondOf DateOf TimeOf EncodeDateTime DecodeDateTime IsSameDay IsToday WeekOf UnixToDateTime DateTimeToUnix CompareDateTime Yesterday Tomorrow RecodeDate RecodeTime IsInLeapYear DaysInMonth DaysInYear' },
    { key: 'variants', shown: 'System.Variants', names: 'Variant VarIsNull VarIsEmpty VarToStr VarToStrDef VarArrayCreate VarArrayOf VarIsArray VarType VarAsType VarCast VarIsNumeric VarIsStr VarFromDateTime VarToDateTime VarSameValue Null Unassigned VarArrayHighBound VarArrayLowBound' },
    { key: 'collections', shown: 'System.Generics.Collections', names: 'TList:class TObjectList:class TDictionary:class TObjectDictionary:class TPair:type TQueue:class TStack:class TObjectQueue:class TObjectStack:class THashSet:class TEnumerable:class TEnumerator:class TCollectionNotification:type TThreadedQueue:class TArray:class TOrderedDictionary:class' },
    { key: 'defaults', shown: 'System.Generics.Defaults', names: 'TComparer:class TEqualityComparer:class IComparer:type IEqualityComparer:type TComparison:type TDelegatedComparer:class' },
    { key: 'ioutils', shown: 'System.IOUtils', names: 'TFile:class TDirectory:class TPath:class TSearchOption:type TFileAttribute:type TDirectoryInfo:class' },
    { key: 'types', shown: 'System.Types', names: 'TPoint:type TRect:type TSize:type TPointF:type TRectF:type TSizeF:type TStringDynArray:type TIntegerDynArray:type TDoubleDynArray:type TSmallPoint:type TDuplicates:type TValueRelationship:type TBooleanDynArray:type TInt64DynArray:type Rect:function Point:function Bounds:function' },
    { key: 'typinfo', shown: 'System.TypInfo', names: 'GetEnumName GetEnumValue GetPropInfo GetPropValue SetPropValue GetTypeData IsPublishedProp GetPropList GetOrdProp SetOrdProp GetStrProp SetStrProp PTypeInfo TTypeKind TypeInfo' },
    { key: 'rtti', shown: 'System.Rtti', names: 'TRttiContext:type TRttiType:type TRttiProperty:type TRttiMethod:type TRttiField:type TValue:type TRttiInstanceType:type TCustomAttribute:class' },
    { key: 'json', shown: 'System.JSON', names: 'TJSONObject:class TJSONArray:class TJSONValue:class TJSONString:class TJSONNumber:class TJSONBool:class TJSONNull:class TJSONPair:class TJSONObjectBuilder:class' },
    { key: 'dialogs', shown: 'Vcl.Dialogs', names: 'ShowMessage MessageDlg ShowMessageFmt InputBox InputQuery MessageDlgPos CreateMessageDialog TOpenDialog TSaveDialog TFontDialog TColorDialog TPrintDialog TFindDialog TReplaceDialog TTaskDialog TOpenPictureDialog TSavePictureDialog' },
    { key: 'forms', shown: 'Vcl.Forms', names: 'Application:variable Screen:variable TForm:class TFrame:class TApplication:class TScreen:class TCustomForm:class TScrollBox:class TMonitor:class TCloseAction:type TFormStyle:type TBorderStyle:type TPosition:type' },
    { key: 'controls', shown: 'Vcl.Controls', names: 'TControl:class TWinControl:class TGraphicControl:class TCustomControl:class TCursor:type TAlign:type TAnchors:type TMouseButton:type TKeyEvent:type TMouseEvent:type TDragObject:class TImageList:class TModalResult:type TCaption:type TMouseMoveEvent:type TKeyPressEvent:type' },
    { key: 'stdctrls', shown: 'Vcl.StdCtrls', names: 'TButton:class TEdit:class TLabel:class TMemo:class TComboBox:class TCheckBox:class TRadioButton:class TListBox:class TGroupBox:class TScrollBar:class TStaticText:class TCustomEdit:class TCustomMemo:class' },
    { key: 'extctrls', shown: 'Vcl.ExtCtrls', names: 'TPanel:class TTimer:class TImage:class TShape:class TBevel:class TSplitter:class TRadioGroup:class TPaintBox:class TLabeledEdit:class TFlowPanel:class TGridPanel:class TCategoryPanelGroup:class' },
    { key: 'comctrls', shown: 'Vcl.ComCtrls', names: 'TPageControl:class TTabSheet:class TTreeView:class TListView:class TProgressBar:class TStatusBar:class TToolBar:class TTrackBar:class TRichEdit:class TUpDown:class TTreeNode:class TListItem:class TDateTimePicker:class TToolButton:class TTabControl:class' },
    { key: 'graphics', shown: 'Vcl.Graphics', names: 'TBitmap:class TCanvas:class TColor:type TFont:class TPen:class TBrush:class TPicture:class TGraphic:class TFontStyles:type TPenStyle:type TBrushStyle:type TIcon:class TMetafile:class TFontStyle:type TAlphaColor:type ColorToRGB:function RGB:function ColorToString:function StringToColor:function' },
    { key: 'windows', shown: 'Winapi.Windows', names: 'GetTickCount GetTickCount64 GetLastError SetLastError MessageBox CreateFile CloseHandle FindWindow SendMessage PostMessage GetWindowText SetWindowPos ShowWindow GetDC ReleaseDC GetCursorPos GetKeyState GetAsyncKeyState OutputDebugString LoadLibrary GetProcAddress FreeLibrary QueryPerformanceCounter QueryPerformanceFrequency GetSystemMetrics GetComputerName GetUserName GetCurrentProcessId GetModuleFileName GetTempPath CreateProcess WaitForSingleObject GetClientRect GetWindowRect SetForegroundWindow EnumWindows InvalidateRect UpdateWindow HWND THandle TPoint TRect TMsg' },
    { key: 'shellapi', shown: 'Winapi.ShellAPI', names: 'ShellExecute ShellExecuteEx Shell_NotifyIcon SHFileOperation SHGetFileInfo DragQueryFile DragAcceptFiles ExtractIcon' },
    { key: 'messages', shown: 'Winapi.Messages', names: 'TMessage:type TWMKey:type TWMMouse:type TWMSize:type TWMPaint:type TWMCommand:type WM_USER:constant WM_CLOSE:constant WM_COMMAND:constant WM_PAINT:constant WM_KEYDOWN:constant WM_SIZE:constant' },
    { key: 'db', shown: 'Data.DB', names: 'TDataSet:class TField:class TStringField:class TIntegerField:class TFloatField:class TDateTimeField:class TBooleanField:class TBlobField:class TMemoField:class TWideStringField:class TDataSource:class TFieldType:type TParams:class TParam:class TDataSetState:type TBookmark:type TFieldDef:class TFields:class TLargeintField:class TBCDField:class TCurrencyField:class TDateField:class TTimeField:class TWideMemoField:class' },
    { key: 'inifiles', shown: 'System.IniFiles', names: 'TIniFile:class TMemIniFile:class TCustomIniFile:class' },
    { key: 'registry', shown: 'System.Win.Registry', names: 'TRegistry:class TRegIniFile:class TRegistryIniFile:class' },
    { key: 'syncobjs', shown: 'System.SyncObjs', names: 'TCriticalSection:class TEvent:class TMutex:class TSemaphore:class TInterlocked:class TLightweightEvent:class TMonitor:class' },
];

const C: Library[] = [
    { key: 'stdio', shown: 'stdio.h', names: 'printf fprintf sprintf snprintf vprintf scanf fscanf sscanf fopen fclose fread fwrite fgets fputs fgetc fputc puts putchar getchar fseek ftell rewind fflush remove rename perror tmpfile setbuf FILE EOF' },
    { key: 'stdlib', shown: 'stdlib.h', names: 'malloc calloc realloc free atoi atof atol strtol strtod strtoul abs labs rand srand exit abort atexit system getenv qsort bsearch div EXIT_SUCCESS EXIT_FAILURE NULL' },
    { key: 'string', shown: 'string.h', names: 'strlen strcpy strncpy strcat strncat strcmp strncmp strchr strrchr strstr strtok memcpy memmove memset memcmp strdup strerror strspn strcspn strpbrk' },
    { key: 'math', shown: 'math.h', names: 'sin cos tan asin acos atan atan2 sqrt pow fabs floor ceil round exp log log10 log2 fmod trunc hypot cbrt sinh cosh tanh' },
    { key: 'ctype', shown: 'ctype.h', names: 'isalpha isdigit isspace isupper islower toupper tolower isalnum ispunct isxdigit iscntrl isprint' },
    { key: 'time', shown: 'time.h', names: 'time clock difftime strftime localtime gmtime mktime asctime ctime time_t clock_t tm' },
    { key: 'string', shown: 'string', names: 'std:namespace string:class wstring:class to_string:function stoi:function stol:function stod:function getline:function' },
    { key: 'vector', shown: 'vector', names: 'vector:class' },
    { key: 'map', shown: 'map', names: 'map:class multimap:class' },
    { key: 'set', shown: 'set', names: 'set:class multiset:class' },
    { key: 'unordered_map', shown: 'unordered_map', names: 'unordered_map:class' },
    { key: 'algorithm', shown: 'algorithm', names: 'sort stable_sort find find_if count count_if reverse unique copy fill transform for_each remove remove_if min max min_element max_element accumulate binary_search lower_bound upper_bound swap any_of all_of none_of' },
    { key: 'memory', shown: 'memory', names: 'unique_ptr:class shared_ptr:class weak_ptr:class make_unique:function make_shared:function' },
    { key: 'iostream', shown: 'iostream', names: 'cout:variable cin:variable cerr:variable endl:function' },
    { key: 'fstream', shown: 'fstream', names: 'ifstream:class ofstream:class fstream:class' },
    { key: 'sstream', shown: 'sstream', names: 'stringstream:class istringstream:class ostringstream:class' },
    { key: 'thread', shown: 'thread', names: 'thread:class this_thread:namespace' },
    { key: 'mutex', shown: 'mutex', names: 'mutex:class lock_guard:class unique_lock:class' },
    { key: 'functional', shown: 'functional', names: 'function:class bind:function ref:function cref:function' },
    { key: 'chrono', shown: 'chrono', names: 'chrono:namespace system_clock:class steady_clock:class duration:class milliseconds:type seconds:type' },
];

const PYTHON: Library[] = [
    { key: 'os', shown: 'os', module: true, names: 'getcwd listdir mkdir makedirs remove rename rmdir environ getenv system walk path getpid chdir stat unlink scandir sep linesep' },
    { key: 'sys', shown: 'sys', module: true, names: 'argv exit path stdin stdout stderr version platform modules executable getsizeof maxsize' },
    { key: 're', shown: 're', module: true, names: 'compile match search sub findall split finditer fullmatch escape IGNORECASE MULTILINE DOTALL' },
    { key: 'json', shown: 'json', module: true, names: 'loads dumps load dump JSONDecodeError' },
    { key: 'math', shown: 'math', module: true, names: 'sqrt floor ceil pi sin cos tan log pow fabs exp isnan inf gcd factorial' },
    { key: 'datetime', shown: 'datetime', module: true, names: 'datetime date time timedelta now today strftime strptime fromisoformat isoformat timezone' },
    { key: 'random', shown: 'random', module: true, names: 'random randint choice shuffle sample seed uniform randrange' },
    { key: 'subprocess', shown: 'subprocess', module: true, names: 'run Popen call check_output check_call PIPE CalledProcessError' },
    { key: 'pathlib', shown: 'pathlib', module: true, names: 'Path PurePath exists read_text write_text mkdir glob iterdir' },
    { key: 'collections', shown: 'collections', module: true, names: 'defaultdict Counter OrderedDict deque namedtuple ChainMap' },
    { key: 'itertools', shown: 'itertools', module: true, names: 'chain product permutations combinations groupby islice cycle repeat count zip_longest accumulate' },
    { key: 'functools', shown: 'functools', module: true, names: 'partial reduce lru_cache wraps cached_property total_ordering' },
    { key: 'logging', shown: 'logging', module: true, names: 'getLogger basicConfig debug info warning error critical Logger Handler StreamHandler FileHandler' },
];

const NODE: Library[] = [
    { key: 'fs', shown: 'fs', module: true, names: 'readFileSync writeFileSync existsSync readFile writeFile readdirSync mkdirSync statSync unlinkSync appendFileSync createReadStream createWriteStream promises' },
    { key: 'path', shown: 'path', module: true, names: 'join resolve basename dirname extname relative normalize isAbsolute sep parse format' },
];

const LIBRARIES: Record<string, Library[]> = { delphi: DELPHI, c: C, python: PYTHON, node: NODE };

/** Which libraries a file can use, from its language and extension. */
function groupsOf(languageId: string, ext: string): string[] {
    if (languageId === 'pascal' || ['pas', 'dpr', 'dpk', 'inc'].includes(ext)) { return ['delphi']; }
    if (languageId === 'cpp' || languageId === 'c' || ['c', 'cc', 'cpp', 'cxx', 'h', 'hh', 'hpp', 'hxx'].includes(ext)) { return ['c']; }
    if (languageId === 'python' || ext === 'py') { return ['python']; }
    if (['typescript', 'typescriptreact', 'javascript', 'javascriptreact'].includes(languageId) || ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(ext)) { return ['node']; }
    return [];
}

const matches = (base: string, key: string): boolean => base === key || base.endsWith('.' + key);

/** What an object is when the catalog does not say: a name that starts like a Delphi type is a class, the rest a routine. */
const defaultKind = (name: string, group: string): string => (group === 'delphi' && /^[TEI][A-Z][a-z]/.test(name) ? 'class' : 'function');

/** The objects of the standard libraries that the file points to (a unit of Delphi, a header, a module), as objects of a file nobody indexed. */
export function standardSymbols(languageId: string, ext: string, refs: UsedRefs): ExternalSymbol[] {
    const out: ExternalSymbol[] = [];
    const seen = new Set<string>();
    for (const group of groupsOf(languageId, ext.toLowerCase().replace(/^\./, ''))) {
        for (const lib of LIBRARIES[group]) {
            // the unit System is always used by a Delphi file, without being written in its `uses`
            if (!(group === 'delphi' && lib.key === 'system') && ![...refs.bases].some(b => matches(b, lib.key))) { continue; }
            for (const raw of lib.names.split(/\s+/).filter(Boolean)) {
                const [name, given] = raw.split(':');
                const label = lib.shown + '.' + name;
                if (seen.has(label)) { continue; }
                seen.add(label);
                out.push({ label, name, container: lib.module ? lib.shown : '', kind: given ?? defaultKind(name, group), path: '', line: 0 });
            }
        }
    }
    return out;
}
