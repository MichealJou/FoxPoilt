#!/usr/bin/env zsh

set -euo pipefail

# 这个脚本用于验证“打包安装后 CLI 是否还能正常工作”。
# 它覆盖三类最核心场景：
# 1. 安装后的 `foxpilot` 帮助页可执行；
# 2. 安装后的 `fp` 简写命令可执行；
# 3. 非交互 `init` 能真实写出项目配置、全局配置和数据库；
# 4. 已安装包内置的 Beads 样例快照可以被真实导入。
# 5. 已安装包可以直接通过外部任务号读取导入任务。
# 6. 已安装包支持把当前 Beads 同步任务重新导出为本地快照。
# 7. 已安装包支持只读的差异预览。
# 8. 已安装包支持显式收口快照中已缺失的外部任务。
# 9. 已安装包支持 dry-run 预演而不落库。

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

mkdir -p "$pack_dir" "$consumer_dir" "$project_dir" "$home_dir" "$project_dir/.git" "$project_dir/frontend/.git"

pnpm pack --pack-destination "$pack_dir" >/dev/null
package_file="$(find "$pack_dir" -maxdepth 1 -name '*.tgz' | head -n 1)"

cd "$consumer_dir"
pnpm add "$package_file" >/dev/null

./node_modules/.bin/foxpilot init --help >/dev/null
./node_modules/.bin/fp init --help >/dev/null

HOME="$home_dir" ./node_modules/.bin/foxpilot init \
  --path "$project_dir" \
  --workspace-root "$tmp_root" \
  --mode non-interactive >/dev/null

test -f "$project_dir/.foxpilot/project.json"
test -f "$home_dir/.foxpilot/foxpilot.config.json"
test -f "$home_dir/.foxpilot/foxpilot.db"

import_output="$(
  HOME="$home_dir" ./node_modules/.bin/foxpilot task import-beads \
    --path "$project_dir" \
    --file "./node_modules/foxpilot/examples/beads-snapshot.sample.json"
)"

echo "$import_output" | grep -- '- created: 3' >/dev/null
echo "$import_output" | grep -- '- updated: 0' >/dev/null
echo "$import_output" | grep -- '- rejected: 0' >/dev/null

summary_output="$(
  HOME="$home_dir" ./node_modules/.bin/foxpilot task beads-summary \
    --path "$project_dir"
)"

echo "$summary_output" | grep -- '- total: 3' >/dev/null
echo "$summary_output" | grep -- '- repositories: 2' >/dev/null

export_output="$(
  HOME="$home_dir" ./node_modules/.bin/foxpilot task export-beads \
    --path "$project_dir" \
    --file "$consumer_dir/exported-beads.json"
)"

echo "$export_output" | grep -- '- exported: 3' >/dev/null
grep '"externalTaskId": "BEADS-1001"' "$consumer_dir/exported-beads.json" >/dev/null
grep '"repository": "frontend"' "$consumer_dir/exported-beads.json" >/dev/null

diff_output="$(
  HOME="$home_dir" ./node_modules/.bin/foxpilot task diff-beads \
    --path "$project_dir" \
    --file "$consumer_dir/exported-beads.json"
)"

echo "$diff_output" | grep -- '- created: 0' >/dev/null
echo "$diff_output" | grep -- '- updated: 0' >/dev/null
echo "$diff_output" | grep -- '- skipped: 3' >/dev/null

show_output="$(
  HOME="$home_dir" ./node_modules/.bin/foxpilot task show \
    --path "$project_dir" \
    --external-id "BEADS-1001"
)"

echo "$show_output" | grep -- 'externalSource: beads' >/dev/null
echo "$show_output" | grep -- 'externalId: BEADS-1001' >/dev/null
echo "$show_output" | grep -- '补齐登录态回归检查' >/dev/null

cat >"$consumer_dir/beads-close-missing.json" <<'EOF'
[
  {
    "externalTaskId": "BEADS-1001",
    "title": "补齐登录态回归检查",
    "status": "ready",
    "priority": "P1",
    "repository": "."
  }
]
EOF

close_output="$(
  HOME="$home_dir" ./node_modules/.bin/foxpilot task import-beads \
    --path "$project_dir" \
    --file "$consumer_dir/beads-close-missing.json" \
    --close-missing
)"

echo "$close_output" | grep -- '- closed: 2' >/dev/null

closed_show_output="$(
  HOME="$home_dir" ./node_modules/.bin/foxpilot task show \
    --path "$project_dir" \
    --external-id "BEADS-1002"
)"

echo "$closed_show_output" | grep -- 'status: cancelled' >/dev/null

dry_run_output="$(
  HOME="$home_dir" ./node_modules/.bin/foxpilot task import-beads \
    --path "$project_dir" \
    --file "$consumer_dir/beads-close-missing.json" \
    --dry-run
)"

echo "$dry_run_output" | grep -- '- dryRun: true' >/dev/null
echo "$dry_run_output" | grep -- '- created: 0' >/dev/null

(
  cd "$project_dir/frontend"
  bd init >/dev/null
  local_beads_id="$(bd create --title '同步本地前端 beads 任务' --description '验证安装后直接读取 bd 输出' --type task --priority 1 --silent)"

  sync_output="$(
    HOME="$home_dir" "$consumer_dir/node_modules/.bin/foxpilot" task sync-beads \
      --path "$project_dir" \
      --repository frontend
  )"

  echo "$sync_output" | grep -- '- repository: frontend' >/dev/null
  echo "$sync_output" | grep -- '- created: 1' >/dev/null

  synced_show_output="$(
    HOME="$home_dir" "$consumer_dir/node_modules/.bin/foxpilot" task show \
      --path "$project_dir" \
      --external-id "$local_beads_id"
  )"

  echo "$synced_show_output" | grep -- 'externalSource: beads' >/dev/null
  echo "$synced_show_output" | grep -- "externalId: $local_beads_id" >/dev/null
)

sync_all_output="$(
  HOME="$home_dir" "$consumer_dir/node_modules/.bin/foxpilot" task sync-beads \
    --path "$project_dir" \
    --all-repositories \
    --dry-run
)"

echo "$sync_all_output" | grep -- '- mode: all-repositories' >/dev/null
echo "$sync_all_output" | grep -- '- scannedRepositories: 2' >/dev/null
echo "$sync_all_output" | grep -- '- syncedRepositories: 1' >/dev/null
echo "$sync_all_output" | grep -- '- skippedRepositories: 1' >/dev/null

live_diff_output="$(
  HOME="$home_dir" "$consumer_dir/node_modules/.bin/foxpilot" task diff-beads \
    --path "$project_dir" \
    --all-repositories
)"

echo "$live_diff_output" | grep -- '- mode: all-repositories' >/dev/null
echo "$live_diff_output" | grep -- '- previewedRepositories: 1' >/dev/null
echo "$live_diff_output" | grep -- '- skippedRepositories: 1' >/dev/null

printf '[FoxPilot] verify:install passed\n'
printf -- '- workspace: %s\n' "$workspace_root"
