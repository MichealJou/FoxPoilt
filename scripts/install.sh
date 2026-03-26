#!/usr/bin/env sh

set -eu

package_name="${FOXPILOT_PACKAGE_NAME:-foxpilot}"
package_spec="${FOXPILOT_PACKAGE_SPEC:-}"
registry="${FOXPILOT_NPM_REGISTRY:-https://registry.npmjs.org}"
version="${FOXPILOT_VERSION:-latest}"
dry_run=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --package-name)
      package_name="$2"
      shift 2
      ;;
    --package-spec)
      package_spec="$2"
      shift 2
      ;;
    --registry)
      registry="$2"
      shift 2
      ;;
    --version)
      version="$2"
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

if [ -z "$package_spec" ]; then
  if [ "$version" = "latest" ]; then
    package_spec="$package_name"
  else
    package_spec="${package_name}@${version}"
  fi
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[FoxPilot] 缺少 npm。请先安装 Node.js 与 npm。" >&2
  exit 1
fi

if [ "$dry_run" -eq 1 ]; then
  cat <<EOF
[FoxPilot] npm 安装预演
- packageSpec: ${package_spec}
- registry: ${registry}
EOF
  exit 0
fi

npm install -g "${package_spec}" --registry "${registry}"

npm_root="$(npm root -g)"
npm_prefix="$(npm prefix -g)"
install_dir="${npm_root}/${package_name}"
bin_dir="${npm_prefix}/bin"

path_config_output=""
path_config_exit_code=0

if path_config_output="$(
  node "${install_dir}/dist/install/configure-shell-path.js" \
    --bin-dir "${bin_dir}" \
    --shell-path "${SHELL:-}" 2>&1
)"; then
  path_config_exit_code=0
else
  path_config_exit_code=$?
fi

cat <<EOF
[FoxPilot] 安装完成
- packageSpec: ${package_spec}
- installDir: ${install_dir}
- binDir: ${bin_dir}
EOF

if [ "$path_config_exit_code" -eq 0 ]; then
  profile_path="$(printf '%s\n' "${path_config_output}" | sed -n 's/^- profilePath: //p' | head -n 1)"
  printf '%s\n' "${path_config_output}"
  if [ -n "${profile_path}" ]; then
    cat <<EOF

如果当前终端里还不能直接执行命令，请重新打开终端，或执行：
source "${profile_path}"
EOF
  fi
else
  cat <<EOF
[FoxPilot] 未能自动写入 PATH，请手动把下面目录加入 PATH：
${bin_dir}

${path_config_output}
EOF
fi
