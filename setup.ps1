[CmdletBinding()]
param(
  [switch]$SkipFrontend,
  [switch]$SkipBackend
)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$sdkDirectory = Join-Path $projectRoot '.dotnet-sdk'
$dotnetExecutable = Join-Path $sdkDirectory 'dotnet.exe'

if (-not $SkipFrontend) {
  Push-Location $projectRoot
  try {
    npm ci --no-audit
    npm run build
  }
  finally {
    Pop-Location
  }
}

if (-not $SkipBackend) {
  if (-not (Test-Path -LiteralPath $dotnetExecutable)) {
    $installer = Join-Path $projectRoot '.dotnet-install.ps1'
    Invoke-WebRequest -Uri 'https://dot.net/v1/dotnet-install.ps1' -OutFile $installer
    & $installer -Channel '10.0' -Quality 'GA' -InstallDir $sdkDirectory -NoPath
  }

  $env:DOTNET_CLI_HOME = Join-Path $projectRoot '.dotnet-home'
  $env:NUGET_PACKAGES = Join-Path $projectRoot '.nuget\packages'
  $env:APPDATA = Join-Path $projectRoot '.appdata'
  $env:LOCALAPPDATA = Join-Path $projectRoot '.localappdata'
  $env:DOTNET_NOLOGO = '1'
  $env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
  New-Item -ItemType Directory -Force -Path $env:APPDATA, $env:LOCALAPPDATA | Out-Null

  & $dotnetExecutable restore '.\backend\MonitoringETL.Api\MonitoringETL.Api.csproj' --configfile '.\NuGet.Config'
  & $dotnetExecutable build '.\backend\MonitoringETL.Api\MonitoringETL.Api.csproj' --configuration Release --no-restore
}

Write-Host 'Installation et compilation terminées.' -ForegroundColor Green
