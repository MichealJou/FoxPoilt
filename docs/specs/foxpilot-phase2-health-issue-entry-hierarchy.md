# FoxPilot 第二阶段 Health 页面问题入口层级

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段 `Health` 页面里的问题入口应该如何分层，哪些属于 foundation、哪些属于 config、哪些属于 control plane、哪些应该导向 init wizard。

如果没有这层层级，后面很容易出现：

- 所有问题都堆进一个列表
- 用户不知道先修系统级还是项目级问题
- doctor 结果虽然很多，但没有处理顺序

## 2. 定位

`Health` 页面不是：

- 全局告警日志
- 单纯 doctor 原始输出页
- Control Plane 的重复版

它是：

> 第二阶段系统级与项目级健康问题的分层入口页。

## 3. 第一原则

第二阶段 `Health` 页必须固定：

```text
先分层
再分对象
最后导向修复路径
```

## 4. 第一批问题层级

建议第二阶段统一为：

```text
Foundation Issues
Project Config Issues
Binding Issues
Control Plane Issues
Recovery Suggestions
```

## 5. 各层含义

### 5.1 Foundation Issues

表示：

- 基础组合未就绪
- 基础依赖缺失
- 安装损坏

### 5.2 Project Config Issues

表示：

- `project.json` 不完整
- 项目扫描信号异常
- profile / workflow / override 结构冲突

### 5.3 Binding Issues

表示：

- skill / mcp / platform 绑定缺失
- required binding 不满足
- handoff 需要的消费能力缺失

### 5.4 Control Plane Issues

表示：

- platform degraded / unavailable
- skill degraded
- mcp degraded

### 5.5 Recovery Suggestions

表示：

- 建议重新 doctor
- 建议 repair
- 建议重新进入 init wizard
- 建议回到 workspace 重新接管

## 6. 问题入口与去向

第二阶段 Health 页应明确：

```text
Foundation Issues      -> Foundation / doctor / repair
Project Config Issues  -> Init Wizard / project config
Binding Issues         -> Control Plane / Init Wizard
Control Plane Issues   -> Platforms / Skills / MCP 子页
Recovery Suggestions   -> 对应下一步入口
```

## 7. 为什么要分层

用户看到问题后最需要知道的是：

```text
这是系统级问题
还是项目级问题
还是中控依赖问题
```

如果不分层，第二阶段的 `Health` 页就会退化成：

```text
问题清单
```

而不是：

```text
修复导航页
```

## 8. 第一批入口表现

建议第二阶段统一为：

```text
按层分组
每组 1 句摘要
每组列出 top issues
每条问题都能跳到明确处理页
```

不要第一批就做复杂图表。

## 9. 与 Dashboard 的关系

Dashboard 只负责告诉用户：

```text
健康有问题
```

`Health` 页面负责告诉用户：

```text
问题在哪一层
下一步去哪修
```

## 10. 与 Control Plane 的关系

`Health` 不替代 `Control Plane`。

正确关系应是：

```text
Health 负责问题分层与导流
Control Plane 负责对象级诊断与修复
```

## 11. 第一批范围控制

第二阶段第一批先不做：

- 历史修复趋势
- 自定义健康规则
- 复杂根因分析图

先固定：

```text
稳定分层
稳定导流
稳定建议
```

## 12. 审核点

你审核这份层级时，重点看：

```text
1  是否接受 Health 页按 Foundation / Project Config / Binding / Control Plane / Recovery Suggestions 五层组织
2  是否接受 Health 页更像修复导航页，而不是问题列表页
3  是否接受不同层问题必须导向不同处理页
4  是否接受 Dashboard 只报健康摘要，Health 才做正式分层解释
```
