# Starts the native debug engine of CE Code Explorer: compiles CeDebugEngine.cs (the first time, a second or two) and runs its loop.
# It talks JSON, one object per line, on the standard input and output.
param([Parameter(Mandatory = $true)][string]$Source)
$ErrorActionPreference = 'Stop'
try {
    Add-Type -Path $Source -ReferencedAssemblies System.Web.Extensions
    [CeDebugEngine]::Run()
} catch {
    [Console]::Out.WriteLine('{"ev":"fatal","message":' + (ConvertTo-Json -Compress ([string]$_.Exception.Message)) + '}')
    exit 1
}
