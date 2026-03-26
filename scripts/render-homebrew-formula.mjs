#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

function renderHomebrewFormula(input) {
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

function parseArgs(argv) {
  const result = {
    repository: 'MichealJou/FoxPoilt',
    outFile: 'dist/homebrew/foxpilot.rb',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]

    if (value === '--version') {
      result.version = argv[index + 1]
      index += 1
      continue
    }

    if (value === '--repository') {
      result.repository = argv[index + 1]
      index += 1
      continue
    }

    if (value === '--darwin-arm64-sha256') {
      result.darwinArm64Sha256 = argv[index + 1]
      index += 1
      continue
    }

    if (value === '--darwin-x64-sha256') {
      result.darwinX64Sha256 = argv[index + 1]
      index += 1
      continue
    }

    if (value === '--linux-x64-sha256') {
      result.linuxX64Sha256 = argv[index + 1]
      index += 1
      continue
    }

    if (value === '--out-file') {
      result.outFile = argv[index + 1]
      index += 1
    }
  }

  return result
}

const args = parseArgs(process.argv.slice(2))

if (!args.version || !args.darwinArm64Sha256 || !args.darwinX64Sha256 || !args.linuxX64Sha256) {
  console.error('[FoxPilot] 缺少生成 Homebrew formula 所需参数')
  process.exit(1)
}

const content = renderHomebrewFormula({
  version: args.version,
  repository: args.repository,
  darwinArm64Sha256: args.darwinArm64Sha256,
  darwinX64Sha256: args.darwinX64Sha256,
  linuxX64Sha256: args.linuxX64Sha256,
})

await mkdir(path.dirname(args.outFile), { recursive: true })
await writeFile(args.outFile, content)

console.log(`[FoxPilot] Homebrew formula 已生成\n- output: ${args.outFile}`)
