# FoxPilot 第二阶段 Control Plane 批量动作策略

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段 Control Plane 首页和子页什么时候允许批量动作、允许哪些、为什么不应该过早放开。

如果没有这层策略，后面会出现：

- 首页一上来就堆很多“一键修复”
- Skills / MCP / Platforms 批量动作边界混乱
- 高风险动作很容易被放到首页误触

## 2. 策略定位

这份策略不是替代动作协议，也不是替代风险确认策略。

它是：

> 对 Control Plane 批量动作的产品边界和排期边界做统一约束。

## 3. 为什么要单独限制批量动作

因为第二阶段的中控平台天然很容易膨胀：

- 多平台
- 多 skills
- 多 mcp
- 多健康状态

如果不限制，首页很快会变成：

```text
一堆批量按钮
```

但用户未必清楚影响范围。

## 4. 第一原则

第二阶段必须固定：

```text
先把单对象看清楚
再把单对象修清楚
最后才放批量动作
```

## 5. 第一批批量动作范围

建议第二阶段第一批只允许：

```text
全量 platform.detect
全量 platform.doctor
全量 skill.doctor
全量 mcp.doctor
```

也就是：

```text
批量检查
允许
批量修复 / 批量安装 / 批量删除
默认不允许
```

## 6. 第二批才考虑的批量动作

第二阶段后半或下一阶段再考虑：

```text
全量 skill.repair
全量 mcp.repair
全量 mcp.restart
批量 enable / disable
批量 install / uninstall
批量 add / remove
```

## 7. 为什么 detect / doctor 适合先批量

因为它们主要是：

- 观察
- 刷新快照
- 写事件

风险低，且能快速建立中控首页价值。

## 8. 为什么 repair / restart 要更谨慎

因为这些动作已经属于：

- 真实副作用
- 可能引起状态波动
- 可能需要确认

尤其是：

```text
skill.install / uninstall
mcp.add / remove
```

绝不能在第二阶段首页直接批量放开。

## 9. 第一批页面建议

### 9.1 Control Plane 首页

建议只提供：

```text
查看总览
全量 detect
全量 doctor
按异常类型跳转
```

### 9.2 Platforms / Skills / MCP 子页

建议先支持：

```text
单对象 inspect
单对象 doctor
单对象 repair / restart（范围内允许的）
```

批量动作仍以检查类为主。

## 10. 与风险确认策略的关系

批量动作策略只回答：

```text
产品上该不该放
```

真正执行时还要服从：

```text
Risk Confirmation Policy
```

所以即使未来放开批量 repair，也不代表可以绕过确认。

## 11. 与页面动作矩阵的关系

这份策略是对：

```text
Control Plane 页面动作矩阵
```

的补充约束。

动作矩阵回答：

```text
页面能有什么动作
```

这份策略回答：

```text
哪些动作可以放大成批量入口
```

## 12. 第一批范围控制

第二阶段第一批先不做：

- 首页一键修复全部问题
- 跨页批量操作面板
- 复杂批量选择器
- 批量 destructive 操作

先固定：

```text
批量 detect / doctor
单对象修复
```

## 13. 审核点

你审核这份策略时，重点看：

```text
1  是否接受第二阶段首页批量动作只放 detect / doctor
2  是否接受批量 repair / install / uninstall / add / remove 全部后置
3  是否接受首页以异常聚合和跳转为主，而不是一键大修复
4  是否接受批量动作策略独立于风险确认策略
```
