param(
  [string]$Repository = $(if ($env:FOXPILOT_REPOSITORY) { $env:FOXPILOT_REPOSITORY } else { "MichealJou/FoxPoilt" }),
  [string]$Version = $(if ($env:FOXPILOT_VERSION) { $env:FOXPILOT_VERSION } else { "latest" }),
  [string]$InstallDir = $(if ($env:FOXPILOT_INSTALL_DIR) { $env:FOXPILOT_INSTALL_DIR } else { Join-Path $HOME ".foxpilot\release\current" }),
  [string]$BinDir = $(if ($env:FOXPILOT_BIN_DIR) { $env:FOXPILOT_BIN_DIR } else { Join-Path $HOME ".foxpilot\bin" }),
  [switch]$DryRun
)

$archMap = @{
  "AMD64" = "x64"
  "X86_64" = "x64"
  "ARM64" = "arm64"
}

$archKey = $env:PROCESSOR_ARCHITECTURE
if (-not $archMap.ContainsKey($archKey)) {
  throw "[FoxPilot] 不支持的架构: $archKey"
}

$platform = "win32"
$arch = $archMap[$archKey]
$assetName = "foxpilot-$platform-$arch.zip"

if ($Version -eq "latest") {
  $downloadUrl = "https://github.com/$Repository/releases/latest/download/$assetName"
} else {
  $downloadUrl = "https://github.com/$Repository/releases/download/v$Version/$assetName"
}

if ($DryRun) {
  Write-Output "[FoxPilot] Release 安装预演"
  Write-Output "- repository: $Repository"
  Write-Output "- version: $Version"
  Write-Output "- platform: $platform"
  Write-Output "- arch: $arch"
  Write-Output "- asset: $assetName"
  Write-Output "- downloadUrl: $downloadUrl"
  Write-Output "- installDir: $InstallDir"
  Write-Output "- binDir: $BinDir"
  exit 0
}

$tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("foxpilot-install-" + [System.Guid]::NewGuid().ToString("N"))
$archivePath = Join-Path $tmpDir $assetName

try {
  New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
  New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

  Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath

  Remove-Item -Recurse -Force $InstallDir
  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
  Expand-Archive -Path $archivePath -DestinationPath $InstallDir -Force

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "[FoxPilot] 缺少 node 运行时，当前 release 安装包还需要 Node.js。"
  }

  $foxpilotCmdPath = Join-Path $BinDir "foxpilot.cmd"
  $fpCmdPath = Join-Path $BinDir "fp.cmd"
  $foxpilotEntrypoint = Join-Path $InstallDir "foxpilot.cmd"
  $fpEntrypoint = Join-Path $InstallDir "fp.cmd"

  Set-Content -Path $foxpilotCmdPath -Value "@echo off`r`ncall `"$foxpilotEntrypoint`" %*" -Encoding ASCII
  Set-Content -Path $fpCmdPath -Value "@echo off`r`ncall `"$fpEntrypoint`" %*" -Encoding ASCII

  & node (Join-Path $InstallDir "dist\install\register-installation.js") `
    --method release `
    --install-root $InstallDir `
    --executable-path (Join-Path $InstallDir "foxpilot.cmd") | Out-Null

  Write-Output "[FoxPilot] Release 安装完成"
  Write-Output "- version: $Version"
  Write-Output "- asset: $assetName"
  Write-Output "- installDir: $InstallDir"
  Write-Output "- binDir: $BinDir"
  Write-Output ""
  Write-Output "如果命令未立即生效，请把下面目录加入 PATH："
  Write-Output $BinDir
} finally {
  if (Test-Path $tmpDir) {
    Remove-Item -Recurse -Force $tmpDir
  }
}
