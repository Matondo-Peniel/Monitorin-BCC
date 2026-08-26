[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$dotnetExecutable = Join-Path $projectRoot '.dotnet-sdk\dotnet.exe'

if (-not (Test-Path -LiteralPath $dotnetExecutable)) {
  throw 'SDK local absent. Exécutez d’abord .\setup.ps1.'
}

$env:DOTNET_CLI_HOME = Join-Path $projectRoot '.dotnet-home'
$env:NUGET_PACKAGES = Join-Path $projectRoot '.nuget\packages'
$env:APPDATA = Join-Path $projectRoot '.appdata'
$env:LOCALAPPDATA = Join-Path $projectRoot '.localappdata'
$env:DOTNET_NOLOGO = '1'
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'

& $dotnetExecutable run --project (Join-Path $projectRoot 'backend\MonitoringETL.Api\MonitoringETL.Api.csproj')
