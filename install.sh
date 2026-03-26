#!/usr/bin/env sh

set -eu

# FoxPilot 一键安装入口。
# 这个根脚本只负责拉取仓库内真正的安装脚本，再把原始参数透传过去。
# 这样 README 可以提供更短的公开安装命令，同时不需要复制完整安装逻辑。

script_url="${FOXPILOT_INSTALL_SCRIPT_URL:-https://raw.githubusercontent.com/MichealJou/FoxPoilt/main/scripts/install.sh}"
tmp_script="$(mktemp)"

cleanup() {
  rm -f "${tmp_script}"
}

trap cleanup EXIT

curl -fsSL "${script_url}" -o "${tmp_script}"
sh "${tmp_script}" "$@"
