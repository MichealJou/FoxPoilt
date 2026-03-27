# FoxPilot 第二阶段风险确认策略

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段哪些动作必须确认、确认到什么级别、由谁执行确认。

如果没有这层策略，后面会出现：

- 页面按钮随便点就改系统状态
- CLI 和 Desktop 的确认口径不一致
- 自动化任务误触高风险动作

## 2. 策略定位

风险确认策略不是页面弹窗设计稿，也不是某个命令的临时实现。

它是：

> Runtime Core 对所有正式写操作统一执行的安全门禁规则

也就是：

```text
确认不是 UI 私有逻辑
确认也不是 CLI 私有逻辑
确认必须由 Runtime Core 最终裁决
```

## 3. 为什么必须由 Runtime Core 裁决

因为第二阶段已经固定：

```text
Desktop
CLI
Automation
都可能触发同一条写命令
```

如果确认逻辑散在入口层，后面一定会出现绕过。

## 4. 确认级别

建议第二阶段固定 4 个级别：

```text
none
soft
hard
destructive
```

### 4.1 none

说明：

- 不需要用户确认
- 可以直接执行

适用：

- 纯预览
- 低风险健康检查
- 只刷新快照、不改关键配置的安全动作

### 4.2 soft

说明：

- 需要一次轻确认
- 不要求额外输入确认短语

适用：

- 会刷新状态
- 会重跑检测
- 会触发轻量修复

### 4.3 hard

说明：

- 需要强确认
- 必须明确提示将改什么

适用：

- 安装新依赖
- 修改项目接入配置
- 改 Skills / MCP 注册表

### 4.4 destructive

说明：

- 需要最高级确认
- 必须明确提示不可逆或高影响

适用：

- 卸载
- 移除配置源
- 清理数据
- 删除注册表实体

## 5. 风险来源

第二阶段风险不只来自“会不会删数据”，还来自下面几类：

```text
system        改系统级依赖或环境
project       改项目配置或接管结果
registry      改 Skills / MCP / Platforms 注册表
runtime       改任务 / 运行 / 编排状态
destructive   可能造成删除、回滚困难或恢复成本高
```

## 6. 第一批动作确认矩阵

```text
动作                 级别
foundation.setup     hard
foundation.repair    soft / hard
init.preview         none
init.apply           hard
task.create          soft
task.patch           soft
task.advance         soft
task.reassign        hard
run.start            none
run.complete         soft
run.fail             soft
run.cancel           hard
platform.detect      soft
platform.doctor      none
skill.repair         soft
skill.enable         soft
skill.disable        soft
skill.install        hard
skill.uninstall      destructive
mcp.repair           soft
mcp.restart          soft
mcp.enable           soft
mcp.disable          soft
mcp.add              hard
mcp.remove           destructive
```

## 7. 为什么有些 doctor 是 none

例如：

```text
platform.doctor
skill.doctor
mcp.doctor
```

如果它们只是：

- 读取状态
- 刷新快照
- 写事件

那不应逼用户确认。

否则桌面端体验会非常差。

## 8. 为什么 detect 是 soft

`platform.detect` 看起来也像读取，但它会：

- 更新平台可用性结论
- 改中控首页状态
- 影响平台解析结果

所以建议给 `soft`，而不是 `none`。

## 9. 确认结构

建议 Runtime 统一返回：

```ts
interface ConfirmationRequirement {
  level: 'none' | 'soft' | 'hard' | 'destructive'
  reasonCode: string
  title: string
  message: string
  requiresPhrase: boolean
  suggestedPhrase: string | null
  supportsDryRun: boolean
}
```

## 10. Runtime 的正式规则

Runtime 必须执行以下规则：

### 10.1 没有确认就不能越权执行

如果命令要求 `soft / hard / destructive`，但入口没有提供确认信息，Runtime 应返回：

```text
confirmation_required
```

### 10.2 页面提示不等于正式授权

Desktop 弹了提示框，不等于 Runtime 已授权。

真正授权必须是：

```text
Bridge 携带确认信息
-> Runtime 校验
-> Runtime 才执行
```

### 10.3 CLI 也不能绕过

CLI 如果是非交互模式，也必须显式提供确认参数或确认令牌。

### 10.4 Automation 默认更严格

自动化任务默认不应直接执行 `hard / destructive` 级别动作，除非：

- 用户显式授权
- 规则里明确允许

## 11. Desktop 体验建议

Desktop 不需要知道所有内部细节，但应该统一呈现：

```text
动作名称
影响范围
确认级别
是否支持 dry-run
是否需要确认短语
```

这样同一套确认面板就能覆盖：

- Init Wizard
- Skills
- MCP
- Platforms

## 12. CLI 体验建议

CLI 建议统一支持：

```text
--dry-run
--confirm
```

对于 destructive 动作，再考虑：

```text
--confirm-phrase
```

## 13. 与事件和刷新策略的关系

确认策略只决定：

```text
能不能执行
执行前要不要确认
```

一旦执行成功，后续仍然应回到统一链路：

```text
Mutation Result
-> Event
-> refreshHints
```

## 14. 审核点

你审核这份策略时，重点看：

```text
1  是否接受确认逻辑必须由 Runtime Core 最终裁决
2  是否接受 none / soft / hard / destructive 四级模型
3  是否接受 detect 属于 soft，doctor 大多属于 none
4  是否接受 Automation 默认不能越过 hard / destructive 动作
```
