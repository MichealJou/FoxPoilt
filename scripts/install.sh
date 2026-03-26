#!/usr/bin/env sh

set -eu

repository="${FOXPILOT_REPOSITORY:-MichealJou/FoxPoilt}"
version="${FOXPILOT_VERSION:-latest}"
install_dir="${FOXPILOT_INSTALL_DIR:-$HOME/.foxpilot/release/current}"
bin_dir="${FOXPILOT_BIN_DIR:-$HOME/.foxpilot/bin}"
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
    --install-dir)
      install_dir="$2"
      shift 2
      ;;
    --bin-dir)
      bin_dir="$2"
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

uname_s="$(uname -s)"
uname_m="$(uname -m)"

case "$uname_s" in
  Darwin) platform="darwin" ;;
  Linux) platform="linux" ;;
  *)
    echo "[FoxPilot] 当前脚本仅支持 macOS / Linux" >&2
    exit 1
    ;;
esac

case "$uname_m" in
  arm64|aarch64) arch="arm64" ;;
  x86_64|amd64) arch="x64" ;;
  *)
    echo "[FoxPilot] 不支持的架构: $uname_m" >&2
    exit 1
    ;;
esac

asset_name="foxpilot-${platform}-${arch}.tar.gz"

if [ "$version" = "latest" ]; then
  download_url="https://github.com/${repository}/releases/latest/download/${asset_name}"
else
  download_url="https://github.com/${repository}/releases/download/v${version}/${asset_name}"
fi

if [ "$dry_run" -eq 1 ]; then
  cat <<EOF
[FoxPilot] Release 安装预演
- repository: ${repository}
- version: ${version}
- platform: ${platform}
- arch: ${arch}
- asset: ${asset_name}
- downloadUrl: ${download_url}
- installDir: ${install_dir}
- binDir: ${bin_dir}
EOF
  exit 0
fi

tmp_dir="$(mktemp -d)"
archive_path="${tmp_dir}/${asset_name}"

cleanup() {
  rm -rf "${tmp_dir}"
}

trap cleanup EXIT

mkdir -p "${install_dir}" "${bin_dir}"

curl -fsSL "${download_url}" -o "${archive_path}"
rm -rf "${install_dir}"
mkdir -p "${install_dir}"
tar -xzf "${archive_path}" -C "${install_dir}"

if ! command -v node >/dev/null 2>&1; then
  echo "[FoxPilot] 缺少 node 运行时，当前 release 安装包还需要 Node.js。" >&2
  exit 1
fi

chmod +x "${install_dir}/foxpilot" "${install_dir}/fp"
ln -sf "${install_dir}/foxpilot" "${bin_dir}/foxpilot"
ln -sf "${install_dir}/fp" "${bin_dir}/fp"

node "${install_dir}/dist/install/register-installation.js" \
  --method release \
  --install-root "${install_dir}" \
  --executable-path "${install_dir}/foxpilot" >/dev/null

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
[FoxPilot] Release 安装完成
- version: ${version}
- asset: ${asset_name}
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
