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
  - 状態・ソース・実行者で絞り込み可能
- `foxpilot task next`
  - 現在のプロジェクトで次に進めるべきタスクを 1 件表示
  - ソース・実行者で絞り込み可能
- `foxpilot task edit`
  - タスクのタイトル・説明・種別を編集
  - 説明の明示的なクリアに対応
  - `--id` または `--external-id` で単一タスクを直接指定可能
- `foxpilot task show`
  - タスク詳細と対象を表示
  - 取り込み済みタスクを外部タスク ID で直接参照可能
- `foxpilot task history`
  - タスク実行履歴を表示
  - `--external-id` で取り込み済みタスク履歴を参照可能
- `foxpilot task import-beads`
  - ローカル JSON スナップショットから Beads タスクを取り込み
  - 外部タスク ID による冪等な作成・更新・スキップに対応
  - `--close-missing` で現在のスナップショットに存在しない未完了タスクを収口可能
  - `--dry-run` で書き込み前に結果を予演可能
- `foxpilot task diff-beads`
  - ローカルスナップショット取り込み時の create / update / skip / close 差分を只読で予覧
  - 実際の取り込みと同じ検証・冪等判定ルールを再利用
- `foxpilot task sync-beads`
  - 指定リポジトリ内の `bd list --json --all` からローカル Beads タスクを直接同期
  - `--dry-run` とリポジトリ単位の `--close-missing` をサポート
- `foxpilot task export-beads`
  - 現在のプロジェクト内の Beads 同期タスクをローカル JSON スナップショットとして再出力
  - 出力結果は `import-beads` と互換
  - 取り消し済みの導入タスクは自動で除外
- `foxpilot task beads-summary`
  - 現在のプロジェクト内の Beads 同期タスク集計を表示
- `foxpilot task suggest-scan`
  - 登録済みリポジトリに対して走査提案タスクを生成
  - 未完了の提案があるリポジトリは自動でスキップ
- `foxpilot task update-executor`
  - タスクの現在の責任実行者を更新
  - 対応値: `codex`、`beads`、`none`
- `foxpilot task update-priority`
  - タスクの現在の優先度を更新
  - 対応値: `P0`、`P1`、`P2`、`P3`
- `foxpilot task update-status`
  - タスク状態を更新
  - 最小限の合法な状態遷移ルールを適用

## クイックスタート

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm verify:install
```

補足:

- `pnpm install` で `prepare` が実行され、`dist/` が生成されます
- `pnpm verify:install` は現在のリポジトリをパックし、テンポラリディレクトリにインストールして実際に `foxpilot init` を実行します

現在のプロジェクトを初期化:

```bash
foxpilot init
```

短縮コマンド:

```bash
fp init
```

ソースから直接 CLI を実行:

```bash
pnpm cli init --help
pnpm cli task next --help
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
foxpilot task list --source scan_suggestion --executor beads
```

次のタスクを表示:

```bash
foxpilot task next
foxpilot task next --executor codex
```

タスクメタデータを編集:

```bash
foxpilot task edit --id task:example --title "タスク説明を補足" --task-type docs
foxpilot task edit --id task:example --clear-description
foxpilot task edit --external-id BEADS-1001 --title "取り込みタスクのタイトル修正"
```

タスク詳細:

```bash
foxpilot task show --id task:example
foxpilot task show --external-id BEADS-1001
```

タスク履歴:

```bash
foxpilot task history --id task:example
foxpilot task history --external-id BEADS-1001
```

Beads スナップショットを取り込み:

```bash
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json --close-missing
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json --dry-run --close-missing
```

Beads スナップショット差分を予覧:

```bash
foxpilot task diff-beads --file ./examples/beads-snapshot.sample.json
foxpilot task diff-beads --file ./examples/beads-snapshot.sample.json --close-missing
```

ローカル `bd` リポジトリから直接同期:

```bash
foxpilot task sync-beads --repository frontend
foxpilot task sync-beads --repository frontend --dry-run
foxpilot task sync-beads --repository frontend --close-missing
```

Beads スナップショットを書き出し:

```bash
foxpilot task export-beads --file ./tmp/beads-export.json
```

Beads 集計を表示:

```bash
foxpilot task beads-summary
```

走査提案タスクを生成:

```bash
foxpilot task suggest-scan
```

タスク実行者を更新:

```bash
foxpilot task update-executor --id task:example --executor beads
foxpilot task update-executor --external-id BEADS-1002 --executor codex
```

タスク優先度を更新:

```bash
foxpilot task update-priority --id task:example --priority P0
foxpilot task update-priority --external-id BEADS-1002 --priority P0
```

タスク状態更新:

```bash
foxpilot task update-status --id task:example --status executing
foxpilot task update-status --external-id BEADS-1001 --status analyzing
```

## ドキュメント

- `docs/specs/`
  - 製品定義、データモデル、設定モデル、SQLite 草案
- `docs/workspace/`
  - タスク計画、実装計画、進捗記録

## 現在の状態

このリポジトリは CLI MVP 実装段階に入っています。コアとなる初期化、手動タスク管理、Beads ローカルスナップショットの取り込み・差分予覧・書き出し、次タスク選択、タスクメタデータ編集、走査提案タスク、実行者切替、優先度更新、タスク実行履歴、最小限の状態遷移制約の流れは利用可能で、次の反復では協調オーケストレーションを拡張していきます。
