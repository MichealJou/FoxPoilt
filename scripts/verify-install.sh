#!/usr/bin/env zsh

set -euo pipefail

# 这个脚本用于验证“打包安装后 CLI 是否还能正常工作”。
# 它覆盖三类最核心场景：
# 1. 安装后的 `foxpilot` 帮助页可执行；
# 2. 安装后的 `fp` 简写命令可执行；
# 3. 非交互 `init` 能真实写出项目配置、全局配置和数据库。

workspace_root="$(pwd)"
tmp_root="$(mktemp -d)"
pack_dir="$tmp_root/pack"
consumer_dir="$tmp_root/consumer"
project_dir="$tmp_root/project"
home_dir="$tmp_root/home"

cleanup() {
  rm -rf "$tmp_root"
}

trap cleanup EXIT

mkdir -p "$pack_dir" "$consumer_dir" "$project_dir" "$home_dir" "$project_dir/.git"

pnpm pack --pack-destination "$pack_dir" >/dev/null
package_file="$(find "$pack_dir" -maxdepth 1 -name '*.tgz' | head -n 1)"

cd "$consumer_dir"
pnpm add "$package_file" >/dev/null

./node_modules/.bin/foxpilot init --help >/dev/null
./node_modules/.bin/fp init --help >/dev/null

HOME="$home_dir" ./node_modules/.bin/foxpilot init \
  --path "$project_dir" \
  --workspace-root "$tmp_root" \
  --mode non-interactive \
  --no-scan >/dev/null

test -f "$project_dir/.foxpilot/project.json"
test -f "$home_dir/.foxpilot/foxpilot.config.json"
test -f "$home_dir/.foxpilot/foxpilot.db"

printf '[FoxPilot] verify:install passed\n'
printf -- '- workspace: %s\n' "$workspace_root"
