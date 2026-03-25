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
- `foxpilot task show`
  - Inspect task detail and targets
- `foxpilot task history`
  - Inspect task run history
- `foxpilot task suggest-scan`
  - Generate scan suggestion tasks for registered repositories
  - Skip repositories that already have unfinished suggestions
- `foxpilot task update-executor`
  - Update the current responsible executor of a task
  - Supported values: `codex`, `beads`, `none`
- `foxpilot task update-status`
  - Update task status
  - Enforce the minimal valid transition rules

## Quick Start

```bash
pnpm install
pnpm typecheck
pnpm test
```

Initialize the current project:

```bash
foxpilot init
```

Use the short alias:

```bash
fp init
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
```

Show task detail:

```bash
foxpilot task show --id task:example
```

Show task history:

```bash
foxpilot task history --id task:example
```

Generate scan suggestion tasks:

```bash
foxpilot task suggest-scan
```

Update task executor:

```bash
foxpilot task update-executor --id task:example --executor beads
```

Update task status:

```bash
foxpilot task update-status --id task:example --status executing
```

## Documentation

- `docs/specs/`
  - Product definition, data model, config model, SQLite draft
- `docs/workspace/`
  - Task plans, implementation plans, progress logs

## Status

The repository is now in the CLI MVP implementation stage. Core initialization, manual task management, scan suggestion tasks, executor switching, task run history, and minimal transition-guard flows are available, and the next iterations will extend collaboration orchestration.
