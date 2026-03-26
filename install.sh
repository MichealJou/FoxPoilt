#!/usr/bin/env sh

set -eu

# FoxPilot 一键安装入口。
# 这个根脚本只负责拉取 Release 中的正式安装脚本，再把原始参数透传过去。
# 这样公开安装命令不再依赖 raw.githubusercontent.com。

script_url="${FOXPILOT_INSTALL_SCRIPT_URL:-https://github.com/MichealJou/FoxPoilt/releases/latest/download/install.sh}"
tmp_script="$(mktemp)"

cleanup() {
  rm -f "${tmp_script}"
}

trap cleanup EXIT

curl -fsSL "${script_url}" -o "${tmp_script}"
sh "${tmp_script}" "$@"
