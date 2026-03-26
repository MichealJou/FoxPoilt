#!/usr/bin/env sh

set -eu

out_dir="${1:-dist/release-assets}"
out_dir="$(cd "$(dirname "${out_dir}")" && pwd)/$(basename "${out_dir}")"
stage_root="$(mktemp -d)"

cleanup() {
  rm -rf "${stage_root}"
}

trap cleanup EXIT

mkdir -p "${out_dir}"

if [ ! -d "dist" ]; then
  echo "[FoxPilot] 未找到 dist/，请先执行 pnpm build" >&2
  exit 1
fi

build_unix_archive() {
  platform="$1"
  arch="$2"
  asset_name="foxpilot-${platform}-${arch}.tar.gz"
  stage_dir="${stage_root}/${platform}-${arch}"

  mkdir -p "${stage_dir}"
  cp -R dist "${stage_dir}/dist"
  cp package.json "${stage_dir}/package.json"
  cp README.md README.zh-CN.md README.en.md README.ja.md "${stage_dir}/"
  cp -R examples "${stage_dir}/examples"
  mkdir -p "${stage_dir}/scripts"
  cp scripts/install.sh scripts/install.ps1 scripts/postinstall.js "${stage_dir}/scripts"

  cat >"${stage_dir}/foxpilot" <<'EOF'
#!/usr/bin/env sh
set -eu
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
exec node "${SCRIPT_DIR}/dist/cli/run.js" "$@"
EOF

  cat >"${stage_dir}/fp" <<'EOF'
#!/usr/bin/env sh
set -eu
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
exec node "${SCRIPT_DIR}/dist/cli/run.js" "$@"
EOF

  chmod +x "${stage_dir}/foxpilot" "${stage_dir}/fp"
  tar -czf "${out_dir}/${asset_name}" -C "${stage_dir}" .
}

build_windows_archive() {
  asset_name="foxpilot-win32-x64.zip"
  stage_dir="${stage_root}/win32-x64"

  mkdir -p "${stage_dir}"
  cp -R dist "${stage_dir}/dist"
  cp package.json "${stage_dir}/package.json"
  cp README.md README.zh-CN.md README.en.md README.ja.md "${stage_dir}/"
  cp -R examples "${stage_dir}/examples"
  mkdir -p "${stage_dir}/scripts"
  cp scripts/install.sh scripts/install.ps1 scripts/postinstall.js "${stage_dir}/scripts"

  cat >"${stage_dir}/foxpilot.cmd" <<'EOF'
@echo off
node "%~dp0dist\cli\run.js" %*
EOF

  cat >"${stage_dir}/fp.cmd" <<'EOF'
@echo off
node "%~dp0dist\cli\run.js" %*
EOF

  (
    cd "${stage_dir}"
    zip -qr "${out_dir}/${asset_name}" .
  )
}

build_unix_archive "darwin" "arm64"
build_unix_archive "darwin" "x64"
build_unix_archive "linux" "x64"
build_windows_archive

# 额外导出一键安装脚本，避免用户入口依赖 raw.githubusercontent.com。
cp scripts/install.sh "${out_dir}/install.sh"
cp scripts/install.ps1 "${out_dir}/install.ps1"

cat <<EOF
[FoxPilot] Release 资产已生成
- outputDir: ${out_dir}
EOF
