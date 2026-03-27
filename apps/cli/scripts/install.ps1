param(
  [string]$PackageName = $(if ($env:FOXPILOT_PACKAGE_NAME) { $env:FOXPILOT_PACKAGE_NAME } else { "foxpilot" }),
  [string]$PackageSpec = $(if ($env:FOXPILOT_PACKAGE_SPEC) { $env:FOXPILOT_PACKAGE_SPEC } else { "" }),
  [string]$Registry = $(if ($env:FOXPILOT_NPM_REGISTRY) { $env:FOXPILOT_NPM_REGISTRY } else { "https://registry.npmjs.org" }),
  [string]$Version = $(if ($env:FOXPILOT_VERSION) { $env:FOXPILOT_VERSION } else { "latest" }),
  [switch]$DryRun
)

if (-not $PackageSpec) {
  if ($Version -eq "latest") {
    $PackageSpec = $PackageName
  } else {
    $PackageSpec = "$PackageName@$Version"
  }
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "[FoxPilot] 缺少 npm。请先安装 Node.js 与 npm。"
}

if ($DryRun) {
  Write-Output "[FoxPilot] npm 安装预演"
  Write-Output "- packageSpec: $PackageSpec"
  Write-Output "- registry: $Registry"
  exit 0
}

& npm install -g $PackageSpec --registry $Registry
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$npmRoot = (& npm root -g).Trim()
$npmPrefix = (& npm prefix -g).Trim()
$installDir = Join-Path $npmRoot $PackageName
$binDir = $npmPrefix

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$userPathEntries = @()
if ($userPath) {
  $userPathEntries = $userPath.Split(';') | Where-Object { $_ -and $_.Trim().Length -gt 0 }
}

$hasUserBin = $false
foreach ($entry in $userPathEntries) {
  if ([System.StringComparer]::OrdinalIgnoreCase.Equals($entry, $binDir)) {
    $hasUserBin = $true
    break
  }
}

if (-not $hasUserBin) {
  $nextUserPath = if ($userPathEntries.Count -eq 0) {
    $binDir
  } else {
    "$binDir;$($userPathEntries -join ';')"
  }

  [Environment]::SetEnvironmentVariable("Path", $nextUserPath, "User")
}

if (-not (($env:Path -split ';') | Where-Object { [System.StringComparer]::OrdinalIgnoreCase.Equals($_, $binDir) })) {
  $env:Path = "$binDir;$env:Path"
}

Write-Output "[FoxPilot] 安装完成"
Write-Output "- packageSpec: $PackageSpec"
Write-Output "- installDir: $installDir"
Write-Output "- binDir: $binDir"
Write-Output ""
Write-Output "[FoxPilot] 已写入用户 PATH"
Write-Output "如果当前终端里还不能直接执行命令，请重新打开 PowerShell。"
