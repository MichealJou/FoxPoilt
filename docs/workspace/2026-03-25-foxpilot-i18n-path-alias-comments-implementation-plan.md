# FoxPilot I18n Path Alias Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 FoxPilot CLI 引入多语言支持、路径别名规范、标准注释规范和三语 README 入口。

**Architecture:** 这次重构采用“先底座、后语义”的顺序推进。先统一 `@/` 与 `@tests/` 路径别名并重写 import，再引入 `i18n` 资源和语言配置，随后把现有 CLI 文案迁移到语言层，最后补齐 TSDoc 和 README 三语。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`

---

## 文件结构

- `tsconfig.json`
  - 配置路径别名
- `vitest.config.ts`
  - 配置别名解析
- `src/**/*.ts`
  - 全量导入重写，补文件头与注释
- `tests/**/*.ts`
  - 测试导入重写
- `src/i18n/`
  - 多语言消息字典与解析器
- `src/config/global-config.ts`
  - 增加语言字段
- `src/commands/config/`
  - 语言设置命令
- `README.md`
  - 三语入口页
- `README.zh-CN.md`
  - 中文说明
- `README.en.md`
  - 英文说明
- `README.ja.md`
  - 日文说明

### Task 1: 路径别名底座

**Files:**
- Modify: `tsconfig.json`
- Modify: `vitest.config.ts`
- Modify: `src/**/*.ts`
- Modify: `tests/**/*.ts`

- [ ] **Step 1: 写失败验证，确认未配置别名前 typecheck 或测试无法支持 `@/`**
- [ ] **Step 2: 修改 `tsconfig.json`，增加 `baseUrl` 和 `paths`**
- [ ] **Step 3: 修改 `vitest.config.ts`，增加 alias**
- [ ] **Step 4: 把 `src/` 与 `tests/` 中的相对路径导入改成别名**
- [ ] **Step 5: 运行 `pnpm typecheck` 和 `pnpm test`**

### Task 2: i18n 基础能力

**Files:**
- Create: `src/i18n/locales.ts`
- Create: `src/i18n/messages.zh-CN.ts`
- Create: `src/i18n/messages.en-US.ts`
- Create: `src/i18n/messages.ja-JP.ts`
- Create: `src/i18n/index.ts`
- Modify: `src/config/global-config.ts`

- [ ] **Step 1: 写失败测试，覆盖语言读取与默认回退**
- [ ] **Step 2: 实现语言枚举与消息字典**
- [ ] **Step 3: 为全局配置增加 `interfaceLanguage`**
- [ ] **Step 4: 运行增量测试**

### Task 3: 语言设置命令

**Files:**
- Create: `src/commands/config/config-set-language-command.ts`
- Create: `src/commands/config/config-set-language-types.ts`
- Modify: `src/cli/parse-args.ts`
- Modify: `src/cli/main.ts`
- Test: `tests/cli/config-set-language-command.test.ts`

- [ ] **Step 1: 写失败的 CLI 测试**
- [ ] **Step 2: 实现 `config set-language`**
- [ ] **Step 3: 运行增量测试**

### Task 4: 现有命令文案迁移

**Files:**
- Modify: `src/commands/init/*.ts`
- Modify: `src/commands/task/*.ts`
- Modify: `tests/cli/*.ts`

- [ ] **Step 1: 写失败测试，覆盖多语言输出**
- [ ] **Step 2: 实现 `init` 首次语言选择**
- [ ] **Step 3: 把现有命令文案迁移到 `i18n`**
- [ ] **Step 4: 运行全量测试**

### Task 5: 注释与 README 三语

**Files:**
- Modify: `src/**/*.ts`
- Modify: `README.md`
- Create: `README.zh-CN.md`
- Create: `README.en.md`
- Create: `README.ja.md`

- [ ] **Step 1: 为源码文件补 `@author michaeljou` 文件头**
- [ ] **Step 2: 为导出类型、字段和关键逻辑补 TSDoc**
- [ ] **Step 3: 重构根 README 为语言入口页**
- [ ] **Step 4: 新增三语 README**
- [ ] **Step 5: 运行 `pnpm typecheck` 和 `pnpm test`**
