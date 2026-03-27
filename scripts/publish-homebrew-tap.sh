#!/usr/bin/env sh

set -eu

# 生成并推送 Homebrew formula。
# 这个脚本只负责：
# 1. 计算已生成 release 资产的校验值
# 2. 渲染 foxpilot.rb
# 3. 推送到 tap 仓库

repository="${FOXPILOT_REPOSITORY:-MichealJou/FoxPoilt}"
tap_repository="${FOXPILOT_TAP_REPOSITORY:-MichealJou/homebrew-tap}"
version="${FOXPILOT_VERSION:-}"
assets_dir="${FOXPILOT_RELEASE_ASSETS_DIR:-dist/release-assets}"
dry_run=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repository)
      repository="$2"
      shift 2
      ;;
    --tap-repository)
      tap_repository="$2"
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
  version="$(node -p "require('./apps/cli/package.json').version")"
fi

darwin_arm64_asset="${assets_dir}/foxpilot-darwin-arm64.tar.gz"
darwin_x64_asset="${assets_dir}/foxpilot-darwin-x64.tar.gz"
linux_x64_asset="${assets_dir}/foxpilot-linux-x64.tar.gz"

for asset_path in "$darwin_arm64_asset" "$darwin_x64_asset" "$linux_x64_asset"; do
  if [ ! -f "$asset_path" ]; then
    echo "[FoxPilot] 缺少 Homebrew 所需资产: $asset_path" >&2
    exit 1
  fi
done

darwin_arm64_sha256="$(shasum -a 256 "$darwin_arm64_asset" | awk '{print $1}')"
darwin_x64_sha256="$(shasum -a 256 "$darwin_x64_asset" | awk '{print $1}')"
linux_x64_sha256="$(shasum -a 256 "$linux_x64_asset" | awk '{print $1}')"

if [ "$dry_run" -eq 1 ]; then
  cat <<EOF
[FoxPilot] Homebrew 发布预演
- repository: ${repository}
- tapRepository: ${tap_repository}
- version: ${version}
- darwinArm64Sha256: ${darwin_arm64_sha256}
- darwinX64Sha256: ${darwin_x64_sha256}
- linuxX64Sha256: ${linux_x64_sha256}
EOF
  exit 0
fi

tmp_dir="$(mktemp -d)"
tap_clone_dir="${tmp_dir}/tap"
formula_output_path="${tmp_dir}/foxpilot.rb"

cleanup() {
  rm -rf "${tmp_dir}"
}

trap cleanup EXIT

if ! git ls-remote "git@github.com:${tap_repository}.git" >/dev/null 2>&1; then
  echo "[FoxPilot] Homebrew tap 仓库不存在或当前机器无访问权限: ${tap_repository}" >&2
  exit 1
fi

node ./scripts/render-homebrew-formula.mjs \
  --repository "$repository" \
  --version "$version" \
  --darwin-arm64-sha256 "$darwin_arm64_sha256" \
  --darwin-x64-sha256 "$darwin_x64_sha256" \
  --linux-x64-sha256 "$linux_x64_sha256" \
  --out-file "$formula_output_path" >/dev/null

git clone "git@github.com:${tap_repository}.git" "$tap_clone_dir" >/dev/null 2>&1
mkdir -p "${tap_clone_dir}/Formula"
cp "$formula_output_path" "${tap_clone_dir}/Formula/foxpilot.rb"

(
  cd "$tap_clone_dir"

  if [ -z "$(git status --porcelain -- Formula/foxpilot.rb)" ]; then
    echo "[FoxPilot] Homebrew formula 无变化，无需推送"
    exit 0
  fi

  git add Formula/foxpilot.rb
  git commit -m "Add foxpilot ${version}" >/dev/null
  git push origin HEAD >/dev/null
)

cat <<EOF
[FoxPilot] Homebrew tap 发布完成
- tapRepository: ${tap_repository}
- version: ${version}
EOF
