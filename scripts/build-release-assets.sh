#!/usr/bin/env sh

set -eu

out_dir="${1:-dist/release-assets}"
out_dir="$(cd "$(dirname "${out_dir}")" && pwd)/$(basename "${out_dir}")"
stage_root="$(mktemp -d)"
package_root="apps/cli"
package_dist_dir="${package_root}/dist"

cleanup() {
  rm -rf "${stage_root}"
}

trap cleanup EXIT

mkdir -p "${out_dir}"

if [ ! -d "${package_dist_dir}" ]; then
  echo "[FoxPilot] 未找到 ${package_dist_dir}/，请先执行 pnpm build" >&2
  exit 1
fi

build_unix_archive() {
  platform="$1"
  arch="$2"
  asset_name="foxpilot-${platform}-${arch}.tar.gz"
  stage_dir="${stage_root}/${platform}-${arch}"

  mkdir -p "${stage_dir}"
  cp -R "${package_dist_dir}" "${stage_dir}/dist"
  cp "${package_root}/package.json" "${stage_dir}/package.json"
  cp "${package_root}/README.md" "${package_root}/README.zh-CN.md" "${package_root}/README.en.md" "${package_root}/README.ja.md" "${stage_dir}/"
  cp -R "${package_root}/examples" "${stage_dir}/examples"
  mkdir -p "${stage_dir}/scripts"
  cp "${package_root}/scripts/install.sh" "${package_root}/scripts/install.ps1" "${package_root}/scripts/postinstall.js" "${stage_dir}/scripts"

  cat >"${stage_dir}/foxpilot" <<'EOF'
#!/usr/bin/env sh
set -eu
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
exec node "${SCRIPT_DIR}/dist/src/cli/run.js" "$@"
EOF

  cat >"${stage_dir}/fp" <<'EOF'
#!/usr/bin/env sh
set -eu
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
exec node "${SCRIPT_DIR}/dist/src/cli/run.js" "$@"
EOF

  chmod +x "${stage_dir}/foxpilot" "${stage_dir}/fp"
  tar -czf "${out_dir}/${asset_name}" -C "${stage_dir}" .
}

build_windows_archive() {
  asset_name="foxpilot-win32-x64.zip"
  stage_dir="${stage_root}/win32-x64"

  mkdir -p "${stage_dir}"
  cp -R "${package_dist_dir}" "${stage_dir}/dist"
  cp "${package_root}/package.json" "${stage_dir}/package.json"
  cp "${package_root}/README.md" "${package_root}/README.zh-CN.md" "${package_root}/README.en.md" "${package_root}/README.ja.md" "${stage_dir}/"
  cp -R "${package_root}/examples" "${stage_dir}/examples"
  mkdir -p "${stage_dir}/scripts"
  cp "${package_root}/scripts/install.sh" "${package_root}/scripts/install.ps1" "${package_root}/scripts/postinstall.js" "${stage_dir}/scripts"

  cat >"${stage_dir}/foxpilot.cmd" <<'EOF'
@echo off
node "%~dp0dist\src\cli\run.js" %*
EOF

  cat >"${stage_dir}/fp.cmd" <<'EOF'
@echo off
node "%~dp0dist\src\cli\run.js" %*
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
cp "${package_root}/scripts/install.sh" "${out_dir}/install.sh"
cp "${package_root}/scripts/install.ps1" "${out_dir}/install.ps1"

cat <<EOF
[FoxPilot] Release 资产已生成
- outputDir: ${out_dir}
EOF
