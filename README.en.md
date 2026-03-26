# FoxPilot Manual

[简体中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

FoxPilot is a local task-control CLI for developer workspaces. It centralizes project initialization, task registration, task lifecycle updates, and local Beads collaboration in one command-line workflow.

> 📌 You can think of FoxPilot as a local project task console.
>
> It is not trying to replace a remote project platform. It is designed to keep the commands you actually use in the terminal in one place.

## ✨ Overview

FoxPilot is closer to a local task console than a general scaffold or hosted PM product:

- initialize the current directory as a managed project
- register, inspect, filter, and advance tasks through one CLI
- connect local tasks with Beads snapshots and local `bd` workflows

If you want to handle project setup, task management, and local collaboration from the terminal, FoxPilot is built for that path.

## 🧱 Background

Developer workflows often run into the same problems:

- project setup and task execution live in separate flows
- manual tasks, scan suggestions, and imported tasks are split across tools
- local Beads workflows need a stable control layer
- once repositories grow, it becomes hard to decide the next task quickly

Phase 1 of FoxPilot solves this by stabilizing the local CLI path first, so project, repository, task, and Beads collaboration can all live inside one local workflow.

## 🎯 Good Fit

FoxPilot is currently a good fit if:

- you want to manage multi-project tasks from a local terminal
- you already use or plan to use Beads / `bd`
- you want manual tasks, scan suggestions, and imported tasks in one pool
- you want to start with a CLI-first workflow before building a GUI or remote service

## 🚀 Installation

### Recommended Order

If you want the fastest path, use this order:

1. one-line installer
2. global `npm` install
3. `Homebrew`
4. direct GitHub Release path

### macOS

#### Option 1: One-Line Install

> 💻 Best for most macOS users.

```bash
curl -fsSL https://github.com/MichealJou/FoxPoilt/releases/latest/download/install.sh | sh
```

The installer automatically writes `~/.foxpilot/bin` into your shell startup file.
If the current terminal still cannot find the command, reopen the terminal.

#### Option 2: Homebrew

> 🍺 Best if you already manage CLIs with Homebrew.

```bash
brew install MichealJou/tap/foxpilot
```

#### Option 3: Global npm Install

```bash
npm install -g foxpilot --registry https://registry.npmjs.org
```

### Linux

#### Option 1: One-Line Install

> 🐧 Best for most Linux users.

```bash
curl -fsSL https://github.com/MichealJou/FoxPoilt/releases/latest/download/install.sh | sh
```

#### Option 2: Global npm Install

```bash
npm install -g foxpilot --registry https://registry.npmjs.org
```

#### Option 3: GitHub Release Installer

```bash
curl -fsSL https://github.com/MichealJou/FoxPoilt/releases/latest/download/install.sh | sh
```

### Windows

#### Option 1: One-Line Install

> 🪟 Best for PowerShell users.

```powershell
irm https://github.com/MichealJou/FoxPoilt/releases/latest/download/install.ps1 | iex
```

The installer automatically updates the user-level `PATH`. Reopen PowerShell if needed.

#### Option 2: Global npm Install

```powershell
npm install -g foxpilot --registry https://registry.npmjs.org
```

### Verify Installation

> ✅ Run these commands after installation.

```bash
foxpilot version
foxpilot install-info
fp version
```

Notes:

- `npm install -g foxpilot` is a global install, not a local project dependency
- `foxpilot` and `fp` are the full command and short alias for the same CLI
- the current GitHub Release install path still expects a local `Node.js` runtime

## 🧩 Current Capabilities

| Name | Command | Description |
| --- | --- | --- |
| Project initialization | `foxpilot init` / `fp init` | Initialize the current project and create project config, global config, and local SQLite |
| Language setting | `foxpilot config set-language` | Set CLI language to Chinese, English, or Japanese |
| Version and install management | `foxpilot version` / `foxpilot install-info` / `foxpilot update` / `foxpilot uninstall` | Inspect version, install source, update through the current channel, or uninstall through the current source |
| Manual task creation | `foxpilot task create` | Create a manual task with optional priority, type, and repository |
| Task overview and filtering | `foxpilot task list` | List project tasks and filter by status, source, or executor |
| Next-task suggestion | `foxpilot task next` | Pick the next most actionable task in the current project |
| Task detail and history | `foxpilot task show` / `foxpilot task history` | Inspect one task in detail and review its run history |
| Task editing and transitions | `foxpilot task edit` / `foxpilot task update-status` / `foxpilot task update-executor` / `foxpilot task update-priority` | Update task title, description, status, executor, and priority |
| Scan suggestion tasks | `foxpilot task suggest-scan` | Generate scan suggestion tasks for registered repositories |
| Beads import and preview | `foxpilot task import-beads` / `foxpilot task diff-beads` | Import Beads snapshot data or preview the diff first |
| Beads local sync and environment | `foxpilot task sync-beads` / `foxpilot task doctor-beads` / `foxpilot task init-beads` | Sync from local `bd`, diagnose the Beads environment, and initialize local Beads setup |
| Beads pushback and export | `foxpilot task push-beads` / `foxpilot task export-beads` / `foxpilot task beads-summary` | Push task state back to local `bd`, export snapshots, and inspect aggregate summaries |

## 🪄 How To Use

### 1. Initialize a Project

> 📦 Run this inside the project root you want FoxPilot to manage.

```bash
foxpilot init
```

or:

```bash
fp init
```

FoxPilot will create the required project config, user-level config, and local database entries.

### 2. Create and Inspect Tasks

> 📝 Create tasks first, then move them through the workflow.

```bash
foxpilot task create --title "Add missing init note"
foxpilot task list
foxpilot task next
```

These commands are used to:

- create a manual task
- inspect the project task list
- pick the next most actionable task

### 3. Advance Task State

> 🔄 The most common flow is detail → status update → history.

```bash
foxpilot task show --id task:example
foxpilot task update-status --id task:example --status executing
foxpilot task history --id task:example
```

This flow is used to inspect one task, move it forward, and review its history.

### 4. Work with Local Beads

> 🔗 If your repositories already use local `bd`, start here.

```bash
foxpilot task sync-beads --repository frontend
foxpilot task diff-beads --repository frontend
foxpilot task push-beads --repository frontend
foxpilot task beads-summary
```

This group covers sync, diff preview, pushback, and summary.

## 🧠 Core Concepts

### project

The managed project root in FoxPilot.  
After initialization, FoxPilot writes `.foxpilot/project.json`, and all task commands are scoped by project.

### repository

A registered code repository inside the project.  
Scan suggestions, Beads sync, and Beads initialization can all run at repository scope.

### task

The task entity in FoxPilot.  
Tasks can come from manual creation, scan suggestions, or imported external sources such as Beads snapshots.

### Beads collaboration

The current external collaboration path supported by FoxPilot.  
It is built around local snapshots and local `bd` commands, not remote orchestration.

## 🧭 Command Map

### System commands

- `foxpilot version`
- `foxpilot install-info`
- `foxpilot update`
- `foxpilot uninstall`

### Init and config commands

- `foxpilot init`
- `foxpilot config set-language`

### Manual task commands

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

### Beads collaboration commands

- `foxpilot task import-beads`
- `foxpilot task diff-beads`
- `foxpilot task sync-beads`
- `foxpilot task doctor-beads`
- `foxpilot task init-beads`
- `foxpilot task push-beads`
- `foxpilot task export-beads`
- `foxpilot task beads-summary`

For the full command manual, see:

- [Chinese command reference](./docs/specs/foxpilot-cli-command-reference.zh-CN.md)

## 🗂 Code and Repository Layout

### Repository root

- `README.md`
  - default Chinese manual
- `README.zh-CN.md`
  - Chinese alias entry
- `README.en.md`
  - English manual
- `README.ja.md`
  - Japanese manual

### src

- `src/cli/`
  - CLI entry, argument parsing, runtime context
- `src/commands/`
  - command implementations grouped by `system`, `config`, `init`, and `task`
- `src/config/`
  - global config and language config
- `src/project/`
  - project resolution and project config
- `src/db/`
  - SQLite bootstrap, task store, catalog store
- `src/sync/`
  - local Beads snapshot and local `bd` collaboration services
- `src/i18n/`
  - localized message catalog

### docs

- `docs/specs/`
  - stable specifications, models, and command reference docs
- `docs/plans/`
  - implementation plans
- `docs/workspace/`
  - task records, progress notes, and decisions

### tests

- `tests/cli/`
  - command-level behavior tests
- `tests/db/`
  - storage and transaction tests
- `tests/helpers/`
  - testing helpers
- `tests/sync/`
  - sync service tests

## 📚 Reading Order

If this is your first time in the repo, read in this order:

1. this `README.en.md`
2. [Chinese command reference](./docs/specs/foxpilot-cli-command-reference.zh-CN.md)
3. the model and SQLite docs in `docs/specs/`
4. the work records in `docs/workspace/` and `docs/plans/`

## 🛠 Developer Source Workflow

If you are developing inside this repository instead of installing FoxPilot as an end user, use:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm verify:install
```

Notes:

- `pnpm install` is only for repository development
- `pnpm verify:install` packs the repo and verifies real install behavior in a temporary directory

## 📍 Status

The local CLI first phase is complete. Key capabilities now include:

- project initialization
- manual task management
- local Beads snapshot import, preview, close-missing, and export
- local `bd` sync, diff preview, diagnosis, initialization, and pushback
- public distribution through one-line install, `npm`, `Homebrew`, and GitHub Release
