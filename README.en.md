# FoxPilot

[中文](./README.zh-CN.md) | [English](./README.en.md) | [日本語](./README.ja.md)

FoxPilot is a local multi-project task control tool for developer workspaces. It brings project initialization, task registration, task inspection, and task status updates into one local CLI workflow.

## Current Features

- `foxpilot init` / `fp init`
  - Initialize a managed project
  - Create `.foxpilot/project.json`
  - Bootstrap global config and SQLite
- `foxpilot config set-language`
  - Set the CLI interface language
  - Supported values: `zh-CN`, `en-US`, `ja-JP`
- `foxpilot task create`
  - Create a manual task
- `foxpilot task list`
  - List tasks for the current project
  - Support filtering by status, source, and executor
- `foxpilot task next`
  - Show the next actionable task for the current project
  - Support filtering by source and executor
- `foxpilot task edit`
  - Edit the title, description, and task type of a task
  - Support explicitly clearing the description
  - Support locating one task by `--id` or `--external-id`
- `foxpilot task show`
  - Inspect task detail and targets
  - Support reading imported tasks directly by external task ID
- `foxpilot task history`
  - Inspect task run history
  - Support viewing imported task history by `--external-id`
- `foxpilot task import-beads`
  - Import Beads tasks from a local JSON snapshot
  - Apply idempotent create, update, and skip behavior by external task ID
  - Support `--close-missing` to cancel unfinished imported tasks missing from the current snapshot
  - Support `--dry-run` to preview import results without writing to SQLite
- `foxpilot task diff-beads`
  - Preview create, update, skip, and close actions without writing to SQLite
  - Support `--file`, `--repository`, and `--all-repositories`
  - Reuse the same validation and idempotency rules as real import
- `foxpilot task sync-beads`
  - Sync local Beads tasks directly from `bd list --json --all` in a selected repository
  - Support `--dry-run`, repository-scoped `--close-missing`, and `--all-repositories`
- `foxpilot task doctor-beads`
  - Diagnose the local Beads environment in read-only mode
  - Support `--repository` and `--all-repositories`
- `foxpilot task push-beads`
  - Push one imported Beads task back to the local `bd` repository
  - Support `--id`, `--external-id`, `--repository`, `--all-repositories`, and `--dry-run`
- `foxpilot task export-beads`
  - Export Beads sync tasks in the current project back to a local JSON snapshot
  - Produce a snapshot compatible with `import-beads`
  - Automatically exclude cancelled imported tasks
- `foxpilot task beads-summary`
  - Show an aggregated summary of imported Beads tasks in the current project
- `foxpilot task suggest-scan`
  - Generate scan suggestion tasks for registered repositories
  - Skip repositories that already have unfinished suggestions
- `foxpilot task update-executor`
  - Update the current responsible executor of a task
  - Supported values: `codex`, `beads`, `none`
- `foxpilot task update-priority`
  - Update the current priority of a task
  - Supported values: `P0`, `P1`, `P2`, `P3`
- `foxpilot task update-status`
  - Update task status
  - Enforce the minimal valid transition rules

## Quick Start

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm verify:install
```

Notes:

- `pnpm install` now triggers `prepare` and generates `dist/`
- `pnpm verify:install` packs the current repository, installs it into a temporary directory, and runs a real `foxpilot init`

Initialize the current project:

```bash
foxpilot init
```

Use the short alias:

```bash
fp init
```

Run the CLI directly from source:

```bash
pnpm cli init --help
pnpm cli task next --help
```

Set the interface language:

```bash
foxpilot config set-language --lang en-US
fp config set-language --lang ja-JP
```

## Command Examples

Create a task:

```bash
foxpilot task create --title "Add init comments"
```

List tasks:

```bash
foxpilot task list
foxpilot task list --source scan_suggestion --executor beads
```

Show the next task:

```bash
foxpilot task next
foxpilot task next --executor codex
```

Edit task metadata:

```bash
foxpilot task edit --id task:example --title "Refine task note" --task-type docs
foxpilot task edit --id task:example --clear-description
foxpilot task edit --external-id BEADS-1001 --title "Fix imported task title"
```

Show task detail:

```bash
foxpilot task show --id task:example
foxpilot task show --external-id BEADS-1001
```

Show task history:

```bash
foxpilot task history --id task:example
foxpilot task history --external-id BEADS-1001
```

Import a Beads snapshot:

```bash
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json --close-missing
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json --dry-run --close-missing
```

Preview a Beads snapshot diff:

```bash
foxpilot task diff-beads --file ./examples/beads-snapshot.sample.json
foxpilot task diff-beads --file ./examples/beads-snapshot.sample.json --close-missing
foxpilot task diff-beads --repository frontend
foxpilot task diff-beads --all-repositories
```

Sync directly from a local `bd` repository:

```bash
foxpilot task sync-beads --repository frontend
foxpilot task sync-beads --repository frontend --dry-run
foxpilot task sync-beads --repository frontend --close-missing
foxpilot task sync-beads --all-repositories
```

Diagnose the local Beads environment:

```bash
foxpilot task doctor-beads --repository frontend
foxpilot task doctor-beads --all-repositories
```

Push one modified task back to local `bd`:

```bash
foxpilot task push-beads --external-id BEADS-1001
foxpilot task push-beads --id task:example --dry-run
foxpilot task push-beads --repository frontend
foxpilot task push-beads --all-repositories --dry-run
```

Export a Beads snapshot:

```bash
foxpilot task export-beads --file ./tmp/beads-export.json
```

Show the Beads summary:

```bash
foxpilot task beads-summary
```

Generate scan suggestion tasks:

```bash
foxpilot task suggest-scan
```

Update task executor:

```bash
foxpilot task update-executor --id task:example --executor beads
foxpilot task update-executor --external-id BEADS-1002 --executor codex
```

Update task priority:

```bash
foxpilot task update-priority --id task:example --priority P0
foxpilot task update-priority --external-id BEADS-1002 --priority P0
```

Update task status:

```bash
foxpilot task update-status --id task:example --status executing
foxpilot task update-status --external-id BEADS-1001 --status analyzing
```

## Documentation

- `docs/specs/`
  - Product definition, data model, config model, SQLite draft
- `docs/workspace/`
  - Task plans, implementation plans, progress logs

## Status

The repository is now in the CLI MVP implementation stage. Core initialization, manual task management, local Beads snapshot import, diff preview, local sync, local environment diagnosis, single-task and batch push, export, next-task selection, task metadata editing, scan suggestion tasks, executor switching, priority adjustment, task run history, and minimal transition-guard flows are available, and the next iterations will extend collaboration orchestration.
