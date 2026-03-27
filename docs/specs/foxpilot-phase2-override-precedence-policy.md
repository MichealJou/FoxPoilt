# FoxPilot 第二阶段覆盖优先级策略

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段当默认值、模板值、项目值、用户值同时存在时，到底谁覆盖谁。

如果没有这层策略，后面会出现：

- `init.preview` 和最终生效结果不一致
- UI 显示推荐值，Runtime 却执行了别的值
- 用户不知道到底是谁覆盖了谁

## 2. 策略定位

覆盖优先级策略不是：

- 页面本地状态优先级
- 某个命令的临时规则
- 某个平台的私有逻辑

它是：

> Runtime Core 对所有可覆盖配置的统一裁决规则。

## 3. 总原则

建议第二阶段固定 4 条总原则：

```text
显式 > 推导
局部 > 全局
阻塞 > 推荐
当前操作 > 历史快照
```

## 4. 正式来源层级

建议第二阶段统一来源层级为：

```text
1  runtime-session override
2  explicit user override
3  project config override
4  workflow template rule
5  profile default
6  capability / binding recommendation
7  auto-detect
8  fallback
```

## 5. 为什么需要 runtime-session override

因为后面会出现：

```text
当前这次 run 临时改平台
只对这一次生效
```

它不应该回写成永久项目配置，所以必须单独成层。

## 6. 三类覆盖对象

第二阶段建议至少对这三类对象统一执行覆盖策略：

```text
workflow template
platform selection
skills / mcp bindings
```

## 7. Workflow Template 的优先级

建议固定为：

```text
用户显式指定模板
> 项目配置里的模板
> 项目扫描命中的模板
> profile 对应默认模板
> standard-software fallback
```

## 8. Platform Selection 的优先级

建议固定为：

```text
runtime-session override
> 用户显式 stage override
> 项目配置里的 stage / role / platform override
> workflow template preferredPlatforms
> capability / binding recommendation
> auto-detect
> manual fallback
```

## 9. Skills / MCP Binding 的优先级

建议固定为：

```text
project binding override
> stage binding
> role binding
> platform binding
> workflow binding
> recommended fallback
```

这里的关键原则是：

```text
更具体的 scope 覆盖更抽象的 scope
```

## 10. 为什么 blocked 高于 recommended

第二阶段绑定模型里已经定义：

```text
required
recommended
optional
blocked
```

这里必须进一步固定：

```text
blocked > required > recommended > optional
```

否则系统可能一边说“不应共存”，一边又因为推荐分高而继续选中。

## 11. 页面如何解释覆盖结果

桌面端不能只显示最终值，还必须说明：

```text
recommended
effective
source
reason
```

这样用户才能看懂：

- 系统本来建议什么
- 最终为什么不是那个值

## 12. 覆盖冲突时的 Runtime 行为

建议第二阶段固定：

### 12.1 可解释

必须返回：

```text
effective value
source
reasons
```

### 12.2 可审计

必须进入：

```text
event
snapshot
```

### 12.3 可恢复

必须能回到：

```text
去掉 override 后的推荐值
```

## 13. 第一批范围控制

第二阶段第一批先不做：

- 多人并发覆盖
- 复杂策略脚本
- 动态学习优先级

先固定：

```text
稳定、可解释、可审计
```

## 14. 审核点

你审核这份策略时，重点看：

```text
1  是否接受 runtime-session override 作为最高优先级
2  是否接受 workflow / platform / binding 三类对象共用同一套总原则
3  是否接受 blocked > required > recommended > optional
4  是否接受页面必须展示 recommended / effective / source / reason 四元组
```
