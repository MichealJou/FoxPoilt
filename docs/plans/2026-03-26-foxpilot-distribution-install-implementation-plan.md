# FoxPilot 分发与安装 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让 FoxPilot 支持首次安装、安装信息识别和按来源更新的第一批闭环，先完成 npm 全局安装链路，再为 release 与 brew 铺好统一元数据模型。

**Architecture:** 分发层新增一组独立命令与安装元数据组件，不把安装逻辑塞进现有业务命令。运行时以“当前命令实例清单”为 update 的唯一依据，以用户目录下的全局索引为展示和诊断依据。第一批先做 npm 渠道闭环，release 与 brew 先接好协议和脚本骨架。

**Tech Stack:** TypeScript、Node.js CLI、Vitest、现有 `dist/cli/run.js` 入口、npm 全局 bin、后续 shell / PowerShell 安装脚本

---

### Task 1: 补 install 元数据模型与运行时解析

**Files:**
- Create: `src/install/install-types.ts`
- Create: `src/install/install-paths.ts`
- Create: `src/install/install-manifest.ts`
- Modify: `src/cli/runtime-context.ts`
- Test: `tests/install/install-manifest.test.ts`

**Step 1: 写失败测试**

为下面行为写测试：

- 可根据 `homeDir` 生成用户级安装索引路径
- 可根据当前可执行路径推导实例清单路径
- 缺失实例清单时返回 `undefined`
- 读取到合法实例清单时能得到结构化模型

**Step 2: 跑测试确认失败**

Run:

```bash
pnpm vitest tests/install/install-manifest.test.ts
```

Expected:

```text
FAIL
```

**Step 3: 写最小实现**

新增安装元数据类型：

- `InstallMethod`
- `InstallManifest`
- `InstallIndexEntry`

新增路径工具：

- `resolveInstallIndexPath(homeDir, platform?)`
- `resolveInstallManifestPath(binPath)`

新增读取函数：

- `readInstallManifest({ executablePath })`
- `readInstallIndex({ homeDir })`

**Step 4: 跑测试确认通过**

Run:

```bash
pnpm vitest tests/install/install-manifest.test.ts
```

Expected:

```text
PASS
```

**Step 5: Commit**

```bash
git add src/install tests/install
git commit -m "Add install manifest model"
```

### Task 2: 增加 `version` 与 `install-info` 命令

**Files:**
- Create: `src/commands/system/system-version-command.ts`
- Create: `src/commands/system/system-version-types.ts`
- Create: `src/commands/system/system-install-info-command.ts`
- Create: `src/commands/system/system-install-info-types.ts`
- Modify: `src/cli/main.ts`
- Modify: `src/cli/parse-args.ts`
- Modify: `src/i18n/messages.ts`
- Test: `tests/cli/system-version-command.test.ts`
- Test: `tests/cli/system-install-info-command.test.ts`

**Step 1: 写失败测试**

覆盖：

- `foxpilot version`
- `fp version`
- `foxpilot install-info`
- 缺失实例清单时 `install-info` 也能给出明确结果

**Step 2: 跑测试确认失败**

Run:

```bash
pnpm vitest tests/cli/system-version-command.test.ts tests/cli/system-install-info-command.test.ts
```

Expected:

```text
FAIL
```

**Step 3: 写最小实现**

新增两组系统命令：

- `version`
- `install-info`

命令输出内容：

- `version`: 当前 CLI 版本、当前命令名
- `install-info`: 当前实例来源、版本、平台、架构、安装根目录、bin 路径，以及全局索引中登记的实例数量

**Step 4: 跑测试确认通过**

Run:

```bash
pnpm vitest tests/cli/system-version-command.test.ts tests/cli/system-install-info-command.test.ts
```

Expected:

```text
PASS
```

**Step 5: Commit**

```bash
git add src/commands/system src/cli src/i18n tests/cli
git commit -m "Add version and install-info commands"
```

### Task 3: 增加 `update` 命令分发器

**Files:**
- Create: `src/commands/system/system-update-command.ts`
- Create: `src/commands/system/system-update-types.ts`
- Create: `src/install/update-dispatcher.ts`
- Modify: `src/cli/main.ts`
- Modify: `src/cli/parse-args.ts`
- Modify: `src/i18n/messages.ts`
- Test: `tests/cli/system-update-command.test.ts`
- Test: `tests/install/update-dispatcher.test.ts`

**Step 1: 写失败测试**

覆盖：

- 当前实例来源为 `npm` 时，update 调到 npm 分支
- 当前实例来源为 `brew` 时，update 调到 brew 分支
- 当前实例来源为 `release` 时，update 调到 release 分支
- 缺失实例清单时，update 返回明确错误

**Step 2: 跑测试确认失败**

Run:

```bash
pnpm vitest tests/cli/system-update-command.test.ts tests/install/update-dispatcher.test.ts
```

Expected:

```text
FAIL
```

**Step 3: 写最小实现**

新增 update 分发器：

- `runNpmUpdate`
- `runBrewUpdate`
- `runReleaseUpdate`
- `dispatchUpdate`

第一批不直接做真实远程升级，只做：

- 命令分支分派
- 参数拼装
- 预留执行器注入点

这样测试可以稳定验证“沿用当前实例来源更新”的设计是否成立。

**Step 4: 跑测试确认通过**

Run:

```bash
pnpm vitest tests/cli/system-update-command.test.ts tests/install/update-dispatcher.test.ts
```

Expected:

```text
PASS
```

**Step 5: Commit**

```bash
git add src/install src/commands/system src/cli src/i18n tests
git commit -m "Add update command dispatcher"
```

### Task 4: 让 npm 渠道写入实例清单与全局索引

**Files:**
- Create: `scripts/postinstall.js`
- Modify: `package.json`
- Modify: `src/install/install-manifest.ts`
- Test: `tests/install/install-index.test.ts`
- Test: `tests/cli/system-install-info-command.test.ts`

**Step 1: 写失败测试**

覆盖：

- npm 安装后可写入实例清单
- 可把当前实例同步到用户级安装索引
- 重复同步不会产生脏重复记录

**Step 2: 跑测试确认失败**

Run:

```bash
pnpm vitest tests/install/install-index.test.ts tests/cli/system-install-info-command.test.ts
```

Expected:

```text
FAIL
```

**Step 3: 写最小实现**

在 npm 安装链路里新增 postinstall 脚本，负责：

- 生成当前实例清单
- 更新用户级安装索引
- 记录当前版本、平台、架构、bin 路径

**Step 4: 跑测试确认通过**

Run:

```bash
pnpm vitest tests/install/install-index.test.ts tests/cli/system-install-info-command.test.ts
```

Expected:

```text
PASS
```

**Step 5: Commit**

```bash
git add package.json scripts/postinstall.js src/install tests
git commit -m "Record npm installation metadata"
```

### Task 5: 扩展黑盒安装验证

**Files:**
- Modify: `scripts/verify-install.sh`
- Test: `tests/cli/system-version-command.test.ts`
- Test: `tests/cli/system-install-info-command.test.ts`
- Test: `tests/cli/system-update-command.test.ts`

**Step 1: 写失败验证**

让安装黑盒验证新增下面检查：

- 已安装包执行 `foxpilot version`
- 已安装包执行 `foxpilot install-info`
- 已安装包执行 `foxpilot update --help`

**Step 2: 跑验证确认失败**

Run:

```bash
pnpm verify:install
```

Expected:

```text
FAIL
```

**Step 3: 写最小实现**

扩展安装验证脚本，确保打包后真实安装环境里可以看到：

- 版本输出
- 安装来源输出
- update 帮助页输出

**Step 4: 跑验证确认通过**

Run:

```bash
pnpm verify:install
```

Expected:

```text
[FoxPilot] verify:install passed
```

**Step 5: Commit**

```bash
git add scripts/verify-install.sh tests/cli
git commit -m "Verify install management commands"
```

### Task 6: 输出 release / brew 实现准备文档

**Files:**
- Modify: `docs/workspace/task-foxpilot-phase1-distribution-install-mvp.md`
- Create: `docs/workspace/2026-03-26-foxpilot-release-brew-prep.md`

**Step 1: 写文档**

把 npm 第一批完成后，剩余的 release / brew 准备项拆出来：

- 平台运行包构建方案
- PowerShell 远程安装脚本
- Homebrew formula 与 tap 仓库规则

**Step 2: 校对**

Run:

```bash
git diff --check
```

Expected:

```text
无输出
```

**Step 3: Commit**

```bash
git add docs/workspace
git commit -m "Document release and brew prep"
```
