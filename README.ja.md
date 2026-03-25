# FoxPilot

[中文](./README.zh-CN.md) | [English](./README.en.md) | [日本語](./README.ja.md)

FoxPilot はローカル開発環境向けのマルチプロジェクトタスク制御ツールです。プロジェクト初期化、タスク登録、タスク確認、状態更新を 1 つのローカル CLI ワークフローにまとめます。

## 現在の機能

- `foxpilot init` / `fp init`
  - 管理対象プロジェクトを初期化
  - `.foxpilot/project.json` を生成
  - グローバル設定と SQLite を初期化
- `foxpilot config set-language`
  - CLI の表示言語を設定
  - 対応値: `zh-CN`、`en-US`、`ja-JP`
- `foxpilot task create`
  - 手動タスクを登録
- `foxpilot task list`
  - 現在のプロジェクトのタスク一覧を表示
- `foxpilot task show`
  - タスク詳細と対象を表示
- `foxpilot task history`
  - タスク実行履歴を表示
- `foxpilot task update-status`
  - タスク状態を更新

## クイックスタート

```bash
pnpm install
pnpm typecheck
pnpm test
```

現在のプロジェクトを初期化:

```bash
foxpilot init
```

短縮コマンド:

```bash
fp init
```

表示言語を設定:

```bash
foxpilot config set-language --lang en-US
fp config set-language --lang ja-JP
```

## コマンド例

タスクを作成:

```bash
foxpilot task create --title "init コメントを追加"
```

タスク一覧:

```bash
foxpilot task list
```

タスク詳細:

```bash
foxpilot task show --id task:example
```

タスク履歴:

```bash
foxpilot task history --id task:example
```

タスク状態更新:

```bash
foxpilot task update-status --id task:example --status executing
```

## ドキュメント

- `docs/specs/`
  - 製品定義、データモデル、設定モデル、SQLite 草案
- `docs/workspace/`
  - タスク計画、実装計画、進捗記録

## 現在の状態

このリポジトリは CLI MVP 実装段階に入っています。コアとなる初期化、手動タスク管理、タスク実行履歴の流れは利用可能で、次の反復ではより厳密な状態遷移、走査提案、協調オーケストレーションを拡張していきます。
