# FoxPilot 利用マニュアル

[简体中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

FoxPilot はローカル開発環境向けのタスク中枢 CLI です。プロジェクト初期化、タスク登録、タスク流転、ローカル Beads 協調を 1 つのコマンドライン作業にまとめます。

> 📌 FoxPilot は「ローカルなプロジェクトタスク制御台」と考えると分かりやすいです。
>
> リモートのプロジェクト管理基盤を置き換えるものではなく、端末で実際に使う初期化・タスク更新・ローカル協調コマンドを整理して集約するための CLI です。

## ✨ 概要

FoxPilot は汎用スキャフォールドでもホスト型 PM サービスでもありません。より近いのはローカル task console です。

- 現在のディレクトリを管理対象プロジェクトとして初期化する
- 同じ CLI でタスクを登録、確認、絞り込み、更新する
- ローカルタスクと Beads スナップショット、`bd` ワークフローをつなぐ

端末の中で「初期化」「タスク管理」「ローカル協調」をまとめて扱いたい場合に向いています。

## 🧱 背景

開発現場では次のような分断が起きやすいです。

- プロジェクト初期化とタスク推進が別の流れになっている
- 手動タスク、走査提案タスク、外部取り込みタスクが別々に散っている
- ローカル Beads を使いたいのに制御レイヤがない
- リポジトリが増えるほど「次に何をやるか」をすぐ決めにくい

FoxPilot の第一段階はこの問題に対して、まずローカル CLI 主線を安定させることに集中しています。

## 🎯 向いている場面

FoxPilot は現在、次のような用途に向いています。

- ローカル端末で複数プロジェクトのタスクを扱いたい
- Beads / `bd` をすでに使っている、または使う予定がある
- 手動タスク、走査提案、外部取り込みタスクを 1 つのタスクプールに集めたい
- GUI やリモートサービスの前に、まず CLI から始めたい

## 🚀 インストール

### 推奨順

最短で使い始めたい場合の推奨順は次の通りです。

1. ワンラインインストール
2. `npm` グローバルインストール
3. `Homebrew`
4. GitHub Release の直接利用

### macOS

#### 方法 1: ワンラインインストール

> 💻 多くの macOS 利用者向けです。

```bash
curl -fsSL https://github.com/MichealJou/FoxPoilt/releases/latest/download/install.sh | sh
```

#### 方法 2: Homebrew

> 🍺 Homebrew で CLI を管理している利用者向けです。

```bash
brew install MichealJou/tap/foxpilot
```

#### 方法 3: npm グローバルインストール

```bash
npm install -g foxpilot --registry https://registry.npmjs.org
```

### Linux

#### 方法 1: ワンラインインストール

> 🐧 多くの Linux 利用者向けです。

```bash
curl -fsSL https://github.com/MichealJou/FoxPoilt/releases/latest/download/install.sh | sh
```

#### 方法 2: npm グローバルインストール

```bash
npm install -g foxpilot --registry https://registry.npmjs.org
```

#### 方法 3: GitHub Release インストーラ

```bash
curl -fsSL https://github.com/MichealJou/FoxPoilt/releases/latest/download/install.sh | sh
```

### Windows

#### 方法 1: ワンラインインストール

> 🪟 PowerShell 利用者向けです。

```powershell
irm https://github.com/MichealJou/FoxPoilt/releases/latest/download/install.ps1 | iex
```

#### 方法 2: npm グローバルインストール

```powershell
npm install -g foxpilot --registry https://registry.npmjs.org
```

### インストール確認

> ✅ インストール後、まず次の 3 つを確認してください。

```bash
foxpilot version
foxpilot install-info
fp version
```

補足:

- `npm install -g foxpilot` はグローバルインストールであり、ローカル依存ではありません
- `foxpilot` と `fp` は同じ CLI の正式名と短縮名です
- 現在の GitHub Release 方式はローカル `Node.js` 実行環境を前提にしています

## 🧩 現在の機能

| 名称 | 命令 | 説明 |
| --- | --- | --- |
| プロジェクト初期化 | `foxpilot init` / `fp init` | 現在のプロジェクトを初期化し、プロジェクト設定、全局設定、SQLite を準備する |
| 言語設定 | `foxpilot config set-language` | CLI の表示言語を中国語、英語、日本語に切り替える |
| バージョンとインストール管理 | `foxpilot version` / `foxpilot install-info` / `foxpilot update` / `foxpilot uninstall` | バージョンと導入元を確認し、導入元に従って更新または卸載する |
| 手動タスク作成 | `foxpilot task create` | 優先度、種別、対象リポジトリ付きで手動タスクを登録する |
| タスク一覧と絞り込み | `foxpilot task list` | 現在のプロジェクトタスクを一覧表示し、状態や実行者で絞り込む |
| 次タスク提案 | `foxpilot task next` | 現在のプロジェクトで次に進めるべきタスクを 1 件選ぶ |
| タスク詳細と履歴 | `foxpilot task show` / `foxpilot task history` | 単一タスクの詳細、対象、履歴を確認する |
| タスク編集と状態流転 | `foxpilot task edit` / `foxpilot task update-status` / `foxpilot task update-executor` / `foxpilot task update-priority` | タイトル、説明、状態、実行者、優先度を更新する |
| 走査提案タスク | `foxpilot task suggest-scan` | 登録済みリポジトリに対して走査提案タスクを生成する |
| Beads 取り込みと差分予覧 | `foxpilot task import-beads` / `foxpilot task diff-beads` | Beads スナップショットを取り込み、または先に差分だけ確認する |
| Beads ローカル同期と環境 | `foxpilot task sync-beads` / `foxpilot task doctor-beads` / `foxpilot task init-beads` | ローカル `bd` から同期し、環境診断や初期化を行う |
| Beads 書き戻しと書き出し | `foxpilot task push-beads` / `foxpilot task export-beads` / `foxpilot task beads-summary` | ローカル `bd` へ書き戻し、スナップショットを書き出し、集計を表示する |

## 🪄 使い方

### 1. プロジェクト初期化

> 📦 管理したいプロジェクトのルートで実行します。

```bash
foxpilot init
```

または:

```bash
fp init
```

これにより、FoxPilot は必要なプロジェクト設定、ユーザー設定、ローカル DB を作成します。

### 2. タスク作成と確認

> 📝 まずタスクを作り、その後で流転させます。

```bash
foxpilot task create --title "初期化説明を補足"
foxpilot task list
foxpilot task next
```

この 3 つは次の用途です。

- 手動タスクを作る
- 現在のタスク一覧を見る
- 次に進めるべきタスクを選ぶ

### 3. タスク状態を進める

> 🔄 よく使う流れは「詳細 → 状態更新 → 履歴確認」です。

```bash
foxpilot task show --id task:example
foxpilot task update-status --id task:example --status executing
foxpilot task history --id task:example
```

### 4. Beads とローカル協調する

> 🔗 すでにローカル `bd` を使っている場合はここから始めます。

```bash
foxpilot task sync-beads --repository frontend
foxpilot task diff-beads --repository frontend
foxpilot task push-beads --repository frontend
foxpilot task beads-summary
```

## 🧠 中核概念

### project

FoxPilot が管理するプロジェクトルート。  
初期化後、`.foxpilot/project.json` が作られます。

### repository

プロジェクト内の登録済みコードリポジトリ。  
走査提案、Beads 同期、Beads 初期化はリポジトリ単位で扱えます。

### task

FoxPilot のタスク実体。  
手動作成、走査提案、外部取り込みのいずれからでも作られます。

### Beads 協調

FoxPilot が現在サポートしている外部協調の主線。  
リモート API ではなく、ローカルスナップショットとローカル `bd` コマンドが中心です。

## 🧭 コマンド案内

### システムコマンド

- `foxpilot version`
- `foxpilot install-info`
- `foxpilot update`
- `foxpilot uninstall`

### 初期化と設定

- `foxpilot init`
- `foxpilot config set-language`

### 手動タスク系

- `foxpilot task create`
- `foxpilot task list`
- `foxpilot task next`
- `foxpilot task edit`
- `foxpilot task show`
- `foxpilot task history`
- `foxpilot task update-status`
- `foxpilot task update-executor`
- `foxpilot task update-priority`
- `foxpilot task suggest-scan`

### Beads 協調系

- `foxpilot task import-beads`
- `foxpilot task diff-beads`
- `foxpilot task sync-beads`
- `foxpilot task doctor-beads`
- `foxpilot task init-beads`
- `foxpilot task push-beads`
- `foxpilot task export-beads`
- `foxpilot task beads-summary`

完全なコマンド手冊は次を参照してください。

- [中文命令参考](./docs/specs/foxpilot-cli-command-reference.zh-CN.md)

## 🗂 コードとリポジトリ構成

### ルート

- `README.md`
  - 既定の中国語利用手冊
- `README.zh-CN.md`
  - 中国語エイリアス入口
- `README.en.md`
  - 英語版手冊
- `README.ja.md`
  - 日本語版手冊

### src

- `src/cli/`
  - CLI エントリ、引数解析、実行時コンテキスト
- `src/commands/`
  - `system`、`config`、`init`、`task` ごとのコマンド実装
- `src/config/`
  - 全局設定と言語設定
- `src/project/`
  - プロジェクト解決と設定読み書き
- `src/db/`
  - SQLite 初期化、タスク保存、目録保存
- `src/sync/`
  - Beads スナップショットと `bd` 協調サービス
- `src/i18n/`
  - 多言語メッセージ

### docs

- `docs/specs/`
  - 仕様、モデル、コマンド参考
- `docs/plans/`
  - 実装計画
- `docs/workspace/`
  - 作業記録、進捗、判断記録

### tests

- `tests/cli/`
  - コマンド挙動テスト
- `tests/db/`
  - 保存とトランザクションのテスト
- `tests/helpers/`
  - テスト補助
- `tests/sync/`
  - 同期サービスのテスト

## 📚 読み進め方

初めてこのリポジトリを見る場合は次の順で読むのがおすすめです。

1. この `README.ja.md`
2. [中文命令参考](./docs/specs/foxpilot-cli-command-reference.zh-CN.md)
3. `docs/specs/` のモデル系文書
4. `docs/workspace/` と `docs/plans/` の作業記録

## 🛠 開発者向けソース実行

エンドユーザーとしてではなく、このリポジトリを直接開発する場合は次を使います。

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm verify:install
```

補足:

- `pnpm install` はリポジトリ開発専用です
- `pnpm verify:install` はパッケージを作成し、テンポラリ環境で実インストールを検証します

## 📍 現在の状態

ローカル CLI 第一段階は完了しています。現在の主な能力は次の通りです。

- プロジェクト初期化
- 手動タスク管理
- Beads スナップショットの取り込み、予演、収口、書き出し
- ローカル `bd` 同期、差分予覧、診断、初期化、書き戻し
- ワンラインインストール、`npm`、`Homebrew`、GitHub Release による公開配布
