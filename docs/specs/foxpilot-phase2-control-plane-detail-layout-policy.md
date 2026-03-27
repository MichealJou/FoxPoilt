# FoxPilot 第二阶段 Control Plane 详情布局策略

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段 `Platforms / Skills / MCP` 单对象详情应该如何布局，哪些信息放主区、哪些信息放右侧、哪些信息放动作区。

如果没有这层策略，后面很容易出现：

- 平台详情像系统设置页
- Skills 详情像包管理器输出
- MCP 详情像原始配置文件浏览器

## 2. 定位

这份策略不是：

- 中控状态汇总模型
- 动作协议
- 右侧面板模型替代品

它是：

> Control Plane 单对象详情页的布局边界。

## 3. 第一原则

第二阶段 `Control Plane` 详情必须固定：

```text
主区解释当前对象
右侧承接关系与轻动作
危险动作后置并确认
```

## 4. 第一批详情页结构

建议第二阶段统一为：

```text
Header
Status Summary
Capability / Binding / Dependency Sections
Recent Doctor / Repair Section
Action Rail
Right Context Panel
```

## 5. Header 必须承接什么

建议 Header 固定展示：

```text
名称
对象类型
当前状态
一句摘要
最近检测时间
```

## 6. 主区核心 section

### 6.1 Platform

主区应优先展示：

- 平台能力
- 当前解析状态
- 适用阶段 / 角色
- 最近 detect / doctor 结果

### 6.2 Skill

主区应优先展示：

- 来源
- 当前状态
- 被谁依赖
- 最近 doctor / repair 结果

### 6.3 MCP

主区应优先展示：

- server 标识
- 配置状态
- 绑定关系
- 最近 doctor / restart / repair 结果

## 7. Action Rail 边界

建议第二阶段详情页只把这些动作放进主动作区：

```text
inspect
doctor
repair
restart（MCP 范围内）
```

对于：

```text
install
uninstall
add
remove
```

必须保持更谨慎，不直接放成高优主动作。

## 8. 右侧面板承接什么

右侧上下文面板建议承接：

- 关系对象
- 依赖对象
- 推荐下一步
- 快速跳转

不要让右侧面板再重复整个主区。

## 9. 为什么要单独建模

因为 `Platforms / Skills / MCP` 看起来都是“对象详情”，但实际关注点完全不同。

如果没有统一布局策略，后面会出现：

- 每类详情页都是不同套路
- 用户切页后找不到状态、动作、依赖放在哪

## 10. 第一批范围控制

第二阶段第一批先不做：

- 对象详情自由布局
- 嵌入式原始配置编辑器
- 复杂 diff 视图

先固定：

```text
统一头部
统一主区 section 思路
统一 Action Rail
统一右侧关系区
```

## 11. 审核点

你审核这份策略时，重点看：

```text
1  是否接受 Control Plane 详情页统一采用 Header / Summary / Sections / Action Rail / Right Panel
2  是否接受 Platform / Skill / MCP 主区各自强调不同 section
3  是否接受 install / uninstall / add / remove 不作为详情页高优主动作
4  是否接受右侧面板承接关系与跳转，而不是重复主区
```
