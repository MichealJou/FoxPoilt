/**
 * @file src/install/homebrew-formula.ts
 * @author michaeljou
 */

export function renderHomebrewFormula(input: {
  version: string
  repository: string
  darwinArm64Sha256: string
  darwinX64Sha256: string
  linuxX64Sha256: string
}): string {
  const darwinArm64Url = `https://github.com/${input.repository}/releases/download/v${input.version}/foxpilot-darwin-arm64.tar.gz`
  const darwinX64Url = `https://github.com/${input.repository}/releases/download/v${input.version}/foxpilot-darwin-x64.tar.gz`
  const linuxX64Url = `https://github.com/${input.repository}/releases/download/v${input.version}/foxpilot-linux-x64.tar.gz`

  return `class Foxpilot < Formula
  desc "Local multi-project task control CLI"
  homepage "https://github.com/${input.repository}"
  version "${input.version}"

  on_macos do
    if Hardware::CPU.arm?
      url "${darwinArm64Url}"
      sha256 "${input.darwinArm64Sha256}"
    else
      url "${darwinX64Url}"
      sha256 "${input.darwinX64Sha256}"
    end
  end

  on_linux do
    url "${linuxX64Url}"
    sha256 "${input.linuxX64Sha256}"
  end

  def install
    libexec.install Dir["*"]
    bin.install_symlink libexec/"foxpilot" => "foxpilot"
    bin.install_symlink libexec/"fp" => "fp"
  end

  test do
    assert_match "version", shell_output("#{bin}/foxpilot version")
  end
end
`
}
