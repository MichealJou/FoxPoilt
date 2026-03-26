# FoxPilot 分发与安装设计

## 1. 背景

FoxPilot 第一阶段的本地 CLI 主线已经完成：

- 可安装构建
- 可初始化项目
- 可管理本地任务
- 可与本地 `Beads` CLI 协作

但当前“可用”的前提仍然偏向开发者视角：

- 进入仓库
- `pnpm install`
- `pnpm build`
- 再执行本地命令

用户现在提出的新目标不是再补业务命令，而是把 FoxPilot 提升为真正可分发、可安装、可更新的 CLI 产品。

一句话说：

> 从“仓库里能跑的工具”升级为“系统里可直接安装和运行的命令”。

## 2. 设计目标

这一版只解决 4 个问题：

1. 第一次安装如何完成
2. 安装完成后如何保证系统命令可用
3. `foxpilot update` / `fp update` 如何统一工作
4. 三种分发渠道如何共存而不把后续迭代做乱

## 3. 不做什么

这一版明确不做：

- 不做后台自动更新
- 不做 GUI 安装器
- 不做多 channel（`stable / beta / nightly`）
- 不做差分 patch 更新
- 不做企业级离线镜像分发

原因很直接：

- 当前最关键的是“第一次安装能跑通”
- 更新机制必须建立在安装来源已知的前提上
- 先把三条正式渠道收稳，再扩展高级分发能力

## 4. 三种安装渠道

FoxPilot 第一版分发同时支持三种正式渠道。

### 4.1 npm 全局安装

用户路径：

```bash
npm install -g foxpilot --registry https://registry.npmjs.org
```

特点：

- 对 Node.js 用户最直接
- 最快形成“安装 + 命令可用 + update”闭环
- 也是第一版最容易先落地的正式渠道
- 当前已真实发布到官方 npm registry

安装完成后，应保证系统里可直接调用：

- `foxpilot`
- `fp`

### 4.2 Homebrew 安装

用户路径：

```bash
brew install michealjou/tap/foxpilot
```

特点：

- 符合 macOS / Linux 用户对命令行工具的常见安装习惯
- 适合把 FoxPilot 做成系统级工具，而不是 Node 项目内部依赖
- 对“升级”和“卸载”都有较清晰的系统约定

### 4.3 GitHub Release 安装脚本

用户路径：

macOS / Linux：

```bash
curl -fsSL <release-install-url> | sh
```

Windows：

```powershell
irm <release-install-url> | iex
```

特点：

- 适合不想先理解 npm / brew 的用户
- 也适合作为 README 首页最直接的“复制即安装”入口
- 需要我们自己负责安装目录、PATH 提示和版本替换逻辑

## 5. 统一运行时入口

无论通过哪种方式安装，运行命令都固定为：

- `foxpilot`
- `fp`

更新命令也固定为：

- `foxpilot update`
- `fp update`

这条规则的作用是统一用户心智，不是抹平内部渠道差异。用户只需要记住：

- 一个主命令
- 一个别名
- 一个更新命令

至于当前命令到底来自 `npm / brew / release`，由运行时自己识别。

## 6. 核心设计：按“当前命令实例”识别安装来源

要想让 `update` 命令统一工作，就不能只靠一个“全局唯一安装来源文件”。因为一台机器上可能同时存在：

- `npm` 全局安装
- `brew` 安装
- `release` 安装

用户最后真正执行的是 PATH 当前解析出来的那个 `foxpilot`。所以第一版采用两层模型：

### 6.1 第一层：当前安装实例清单

每一种安装方式都要在自己的安装目录里放一份安装清单文件。

建议命名：

```text
install-manifest.json
```

它必须跟“当前可执行实例”绑定，而不是跟“当前用户机器”绑定。

例如：

- npm 全局安装
  - 放在包目录内
- brew 安装
  - 放在 formula 安装目录内
- release 安装
  - 放在用户本地安装目录内

运行 `foxpilot update` 时，FoxPilot 优先读取“当前正在执行的这个命令实例”旁边的安装清单，再决定更新方式。

### 6.2 第二层：全局索引文件

在用户目录下再保留一份全局索引，用于展示和诊断，而不是作为 update 的唯一依据。

建议路径：

macOS / Linux：

```text
~/.foxpilot/installations.json
```

Windows：

```text
%USERPROFILE%\\.foxpilot\\installations.json
```

这份文件可以记录用户机器上“FoxPilot 被装过哪些实例”，用于：

- `foxpilot install-info`
- 冲突诊断
- 安装迁移提示

### 6.3 为什么要这么拆

因为：

- 单一全局文件无法正确表示多实例共存
- PATH 优先级可能变化
- brew、npm、release 的真实落点并不一致
- update 必须绑定到“当前执行的实例”，不能绑定到“某次历史安装”

所以第一版的关键规则是：

> update 以当前可执行实例清单为准，全局索引只做展示和诊断。

## 7. 安装元数据模型

### 7.1 当前实例清单字段

`install-manifest.json` 第一版建议至少包含：

```json
{
  "schemaVersion": 1,
  "installMethod": "npm | brew | release",
  "packageName": "foxpilot",
  "packageVersion": "0.1.0",
  "channel": "stable",
  "platform": "darwin | linux | win32",
  "arch": "x64 | arm64",
  "installRoot": "/absolute/path/to/current/install/root",
  "binPath": "/absolute/path/to/current/bin/or/shim",
  "updateTarget": {
    "npmPackage": "foxpilot",
    "brewTap": "michealjou/tap",
    "brewFormula": "foxpilot",
    "releaseAsset": "foxpilot-darwin-arm64.tar.gz"
  },
  "installedAt": "2026-03-26T00:00:00.000Z",
  "updatedAt": "2026-03-26T00:00:00.000Z"
}
```

### 7.2 字段设计逻辑

- `schemaVersion`
  - 未来扩字段时可兼容迁移
- `installMethod`
  - 决定 update 分派策略
- `packageName`
  - 避免 npm update 时靠硬编码猜包名
- `packageVersion`
  - `version` 命令和升级后校验都需要
- `platform / arch`
  - release 资产和 Windows 路径规则都依赖这两项
- `installRoot / binPath`
  - 区分“安装目录”和“当前命令入口”
- `updateTarget`
  - 显式定义各渠道的更新身份，避免运行时继续猜

### 7.3 全局索引字段

`installations.json` 不需要重复保存所有细节，但至少要能列出：

- `installId`
- `installMethod`
- `packageVersion`
- `platform`
- `arch`
- `installRoot`
- `binPath`
- `lastSeenAt`

这份文件的角色是“安装目录”，不是“当前实例唯一真相”。

## 8. 三种渠道的实际产物形态

这一版不只要定义“怎么装”，还必须定义“装的是什么”。

### 8.1 npm 渠道

分发产物是标准 npm 包：

- `package.json`
- `dist/`
- `README`
- 必要文档与示例

运行前提：

- 用户系统已经有 Node.js

### 8.2 GitHub Release 渠道

分发产物不是 npm 包，而是平台对应的独立运行包。

第一版建议使用“平台压缩包 + 可执行入口”的形式：

- `foxpilot-darwin-arm64.tar.gz`
- `foxpilot-darwin-x64.tar.gz`
- `foxpilot-linux-x64.tar.gz`
- `foxpilot-windows-x64.zip`

每个压缩包内至少包含：

- 可执行入口 `foxpilot`
- 简写入口 `fp`
- `install-manifest.json`
- 运行所需文件

这条渠道的目标是：

> 用户不必先理解 npm，也不必自己组装运行环境。

### 8.3 Homebrew 渠道

Homebrew 不直接包装 npm 包。第一版建议让 Homebrew formula 直接消费 GitHub Release 的平台压缩包。

这样做有两个好处：

- brew 与 release 共用同一套平台产物
- 避免 npm、brew、release 三条链路各自维护不同运行包

所以第一版的产物关系是：

```text
npm       -> npm 包
release   -> 平台运行包
brew      -> 引用 release 平台运行包
```

## 9. update 命令的规则

### 9.1 命令名

固定为：

```bash
foxpilot update
fp update
```

### 9.2 更新策略

统一规则是：

> 沿用当前命令实例的安装来源更新。

也就是：

- npm 安装
  - 执行 npm 全局更新
- brew 安装
  - 执行 `brew upgrade foxpilot`
- release 安装
  - 下载当前平台最新 release 运行包并原位替换

### 9.3 为什么不用“统一都更新到 Release”

因为那会破坏用户原本选择的安装方式：

- brew 装的命令不应该偷偷改成 release 管理
- npm 装的命令不应该悄悄脱离 npm

所以更新必须“沿用当前实例来源”，而不是“沿用某台机器历史上装过的某个来源”。

## 10. Windows 边界

Windows 第一版必须定义完整，不然“支持 Windows”只是口号。

### 10.1 首次安装入口

Windows 不使用“先手动下载一个 `install.ps1` 再执行”的表达方式，正式入口直接定义为远程脚本：

```powershell
irm <release-install-url> | iex
```

这样才和 macOS / Linux 的“复制一条命令就安装”目标一致。

### 10.2 命令入口

Windows 安装后必须保证：

- `foxpilot.cmd`
- `fp.cmd`

或等价 shim 可直接运行。

如果采用 PowerShell shim，也必须补充普通终端可用的 `.cmd` 入口，避免只在 PowerShell 内可用。

### 10.3 用户目录

Windows 下用户级数据目录统一写成：

```text
%USERPROFILE%\\.foxpilot
```

不要在设计里继续沿用 Unix 的 `~/.foxpilot` 写法来代表 Windows。

### 10.4 更新时文件替换

Windows release 渠道需要显式考虑“运行中可执行文件不能直接覆盖”的问题。第一版可以采用：

- 下载到临时目录
- 退出当前进程
- 替换安装目录
- 重写 shim

但不能在设计里省略这一步。

## 11. 第一次安装的推荐落地顺序

虽然三条渠道最终都要有，但实现顺序不应该同时平铺。

建议顺序：

### 11.1 第一批

- npm 全局安装
- `foxpilot version`
- `foxpilot install-info`
- `foxpilot update`
- 当前实例清单与全局索引

原因：

- npm 最快形成完整闭环
- 现有 Node 包结构已经最接近可发布状态
- 最容易先证明“系统安装 + 命令可用 + update 可用”

### 11.2 第二批

- GitHub Release 平台运行包
- macOS / Linux `install.sh`
- Windows 远程 PowerShell 安装脚本

原因：

- 这是最贴近“复制一条命令即可安装”的用户体验
- 但它依赖我们先把安装元数据和平台产物规则定住

### 11.3 第三批

- Homebrew tap
- brew formula

原因：

- 它本身比 npm 多一层 tap 与 formula 管理
- 但一旦 release 平台运行包稳定，brew 本质上只是引用已有产物

## 12. 对当前代码仓库的要求

### 12.1 package.json

当前如果还想正式对外发布，必须从“开发仓库配置”调整为“可分发包配置”。

至少要明确：

- 包名是否对外可发布
- `private` 是否继续保留
- `bin` 是否作为正式分发入口
- 发布时需要携带哪些文件

### 12.2 发布单一事实源

版本号必须只有一个事实源：

- `package.json.version`

发布顺序建议固定为：

```text
1. 更新 package.json.version
2. 构建 npm 包
3. 构建 release 平台运行包
4. 发布 GitHub Release
5. 发布 npm
6. 更新 Homebrew formula
7. 运行三渠道黑盒验证
```

这样可以避免：

- npm 已发布但 release 还没就绪
- release 已发但 brew 还指向旧版本
- update 拉到的新版本和当前文档不一致

### 12.3 安装脚本

建议新增：

- `scripts/install.sh`
- `scripts/install.ps1`

这两份脚本不负责业务逻辑，只负责：

- 拉取当前平台对应产物
- 安装到用户目录
- 写入实例清单和全局索引
- 检查命令是否已可执行
- 给出 PATH 补充提示

### 12.4 CLI 命令

建议新增：

- `foxpilot version`
- `foxpilot install-info`
- `foxpilot update`

其中：

- `version`
  - 用于确认当前安装版本
- `install-info`
  - 用于确认当前实例来源、路径和全局索引记录
- `update`
  - 用于执行“沿用当前实例来源”的统一更新

## 13. 平台边界

### 13.1 macOS / Linux

两者优先共用：

- npm 全局安装
- brew（对适用平台）
- shell 安装脚本

### 13.2 Windows

Windows 第一版优先支持：

- npm 全局安装
- PowerShell 远程安装脚本

不要求第一版就补齐所有 Windows 包管理器生态。

## 14. 第一版完成标准

当满足下面这些条件时，就可以认为“分发与安装 MVP”完成：

### 14.1 首次安装

至少 3 条渠道都可走通：

- npm
- brew
- GitHub Release 脚本

### 14.2 命令可用

安装后系统里能直接执行：

- `foxpilot`
- `fp`
- `foxpilot version`
- `foxpilot install-info`
- `foxpilot init`
- `foxpilot update`

### 14.3 更新可用

安装后系统里能直接执行：

- `foxpilot update`
- `fp update`

且更新行为沿用当前命令实例来源。

### 14.4 自检可用

安装后能看到：

- 当前版本
- 当前实例来源
- 当前实例路径
- 已登记安装列表

### 14.5 黑盒验证可用

分发层必须提供真实安装后的黑盒验证，至少覆盖：

- npm 安装验证
- release 安装验证
- brew 安装验证
- update 升级验证

## 15. 当前结论

当前最稳的路线是：

1. 先把“第一次安装”作为主任务
2. 用“当前实例清单 + 全局索引”统一三条渠道
3. 先做 npm 闭环，再做 release，再做 brew
4. 所有渠道都必须经过真实安装后的黑盒验证

这样 FoxPilot 才会从“开发仓库里的 CLI”真正升级成“可持续迭代的系统级工具”。
