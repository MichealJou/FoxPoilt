#!/usr/bin/env sh

set -eu

# 发布 GitHub Release，并把本地 release 资产上传到对应版本。
# 这个脚本要求调用方提前：
# 1. 已经把对应 tag 推到远端
# 2. 已经生成 dist/release-assets
# 3. 提供 GH_TOKEN 或 GITHUB_TOKEN

repository="${FOXPILOT_REPOSITORY:-MichealJou/FoxPoilt}"
version="${FOXPILOT_VERSION:-}"
assets_dir="${FOXPILOT_RELEASE_ASSETS_DIR:-dist/release-assets}"
release_name=""
release_notes=""
dry_run=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repository)
      repository="$2"
      shift 2
      ;;
    --version)
      version="$2"
      shift 2
      ;;
    --assets-dir)
      assets_dir="$2"
      shift 2
      ;;
    --release-name)
      release_name="$2"
      shift 2
      ;;
    --release-notes)
      release_notes="$2"
      shift 2
      ;;
    --dry-run)
      dry_run=1
      shift 1
      ;;
    *)
      echo "[FoxPilot] 未知参数: $1" >&2
      exit 1
      ;;
  esac
done

if [ -z "$version" ]; then
  version="$(node -p "require('./package.json').version")"
fi

if [ -z "$release_name" ]; then
  release_name="FoxPilot v${version}"
fi

token="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

if [ ! -d "$assets_dir" ]; then
  echo "[FoxPilot] 未找到 release 资产目录: $assets_dir" >&2
  exit 1
fi

asset_count="$(find "$assets_dir" -maxdepth 1 -type f | wc -l | tr -d ' ')"
if [ "$asset_count" -eq 0 ]; then
  echo "[FoxPilot] release 资产目录为空: $assets_dir" >&2
  exit 1
fi

if [ "$dry_run" -eq 1 ]; then
  cat <<EOF
[FoxPilot] GitHub Release 发布预演
- repository: ${repository}
- version: ${version}
- releaseName: ${release_name}
- assetsDir: ${assets_dir}
- assets: ${asset_count}
EOF
  exit 0
fi

if [ -z "$token" ]; then
  echo "[FoxPilot] 缺少 GH_TOKEN 或 GITHUB_TOKEN，无法发布 GitHub Release" >&2
  exit 1
fi

api_base="https://api.github.com/repos/${repository}"
auth_header="Authorization: Bearer ${token}"
accept_header="Accept: application/vnd.github+json"
api_version_header="X-GitHub-Api-Version: 2022-11-28"

tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "${tmp_dir}"
}

trap cleanup EXIT

release_response_path="${tmp_dir}/release.json"
create_payload_path="${tmp_dir}/create-release.json"

create_release_payload() {
  notes_path="$1"
  python3 - "$notes_path" "$version" "$release_name" >"$create_payload_path" <<'PY'
import json
import pathlib
import sys

notes_path = sys.argv[1]
version = sys.argv[2]
release_name = sys.argv[3]

payload = {
    "tag_name": f"v{version}",
    "name": release_name,
    "draft": False,
    "prerelease": False,
}

if notes_path:
    payload["body"] = pathlib.Path(notes_path).read_text(encoding="utf-8")
else:
    payload["generate_release_notes"] = True

print(json.dumps(payload))
PY
}

find_existing_release() {
  curl -fsSL \
    -H "$auth_header" \
    -H "$accept_header" \
    -H "$api_version_header" \
    "${api_base}/releases/tags/v${version}" >"$release_response_path"
}

create_release() {
  create_release_payload "$release_notes"
  curl -fsSL \
    -X POST \
    -H "$auth_header" \
    -H "$accept_header" \
    -H "$api_version_header" \
    -d @"$create_payload_path" \
    "${api_base}/releases" >"$release_response_path"
}

if ! find_existing_release 2>/dev/null; then
  create_release
fi

release_id="$(node -e "const fs=require('fs'); const json=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(json.id ?? '');" "$release_response_path")"
upload_url="$(node -e "const fs=require('fs'); const json=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); const value=(json.upload_url || '').replace(/\{.*$/, ''); console.log(value);" "$release_response_path")"

if [ -z "$release_id" ] || [ -z "$upload_url" ]; then
  echo "[FoxPilot] 无法解析 release 元信息" >&2
  exit 1
fi

assets_response_path="${tmp_dir}/assets.json"
curl -fsSL \
  -H "$auth_header" \
  -H "$accept_header" \
  -H "$api_version_header" \
  "${api_base}/releases/${release_id}/assets" >"$assets_response_path"

for asset_path in "$assets_dir"/*; do
  if [ ! -f "$asset_path" ]; then
    continue
  fi

  asset_name="$(basename "$asset_path")"
  existing_asset_id="$(node -e "const fs=require('fs'); const assets=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); const name=process.argv[2]; const match=assets.find((item) => item.name === name); console.log(match ? match.id : '');" "$assets_response_path" "$asset_name")"

  if [ -n "$existing_asset_id" ]; then
    curl -fsSL \
      -X DELETE \
      -H "$auth_header" \
      -H "$accept_header" \
      -H "$api_version_header" \
      "${api_base}/releases/assets/${existing_asset_id}" >/dev/null
  fi

  curl -fsSL \
    -X POST \
    -H "$auth_header" \
    -H "Content-Type: application/octet-stream" \
    --data-binary @"$asset_path" \
    "${upload_url}?name=${asset_name}" >/dev/null
done

cat <<EOF
[FoxPilot] GitHub Release 发布完成
- repository: ${repository}
- version: ${version}
- releaseId: ${release_id}
- assetsDir: ${assets_dir}
EOF
