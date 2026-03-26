param(
  [string]$ScriptUrl = $(if ($env:FOXPILOT_INSTALL_SCRIPT_URL) {
    $env:FOXPILOT_INSTALL_SCRIPT_URL
  } else {
    "https://raw.githubusercontent.com/MichealJou/FoxPoilt/main/scripts/install.ps1"
  })
)

# FoxPilot 一键安装入口。
# 这个根脚本只负责拉取仓库内真正的 PowerShell 安装脚本，再把剩余参数透传过去。

$tmpPath = Join-Path ([System.IO.Path]::GetTempPath()) ("foxpilot-bootstrap-" + [System.Guid]::NewGuid().ToString("N") + ".ps1")

try {
  Invoke-WebRequest -Uri $ScriptUrl -OutFile $tmpPath
  & powershell -ExecutionPolicy Bypass -File $tmpPath @args
} finally {
  if (Test-Path $tmpPath) {
    Remove-Item -Force $tmpPath
  }
}
