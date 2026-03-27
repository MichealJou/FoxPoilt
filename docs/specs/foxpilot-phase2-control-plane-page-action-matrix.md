# FoxPilot 第二阶段 Control Plane 页面动作矩阵

## 1. 文档目的

这份文档把 `Platforms / Skills / MCP / Control Plane 首页` 的页面动作压成一张矩阵。

它解决的问题是：

- 哪个页面有哪些动作
- 哪些动作是首批必须做
- 哪些动作只保留到第二批
- 动作对应什么命令、确认级别和刷新信号

## 2. 矩阵定位

这份矩阵不是替代动作协议，而是把动作协议收成更适合实现排期的总表。

它服务于：

- UI 实现排期
- Runtime 接口优先级
- 第一批 / 第二批范围控制

## 3. Control Plane 首页

```text
页面            动作                命令                    级别   刷新
Control Plane   查看总览            controlPlane.overview   P1    controlPlane
Control Plane   全量平台探测        platform.detect         P2    controlPlane,projectInit
Control Plane   全量平台健康检查    platform.doctor         P2    controlPlane,health
Control Plane   全量技能检查        skill.doctor            P2    controlPlane,health
Control Plane   全量 MCP 检查       mcp.doctor              P2    controlPlane,health
```

## 4. Platforms 页面

```text
页面         动作            命令                  级别   确认   刷新
Platforms    查看列表        platform.list         P1    none   controlPlane
Platforms    查看详情        platform.inspect      P1    none   controlPlane
Platforms    查看能力        platform.capabilities P1    none   controlPlane
Platforms    查看解析        platform.resolve      P1    none   controlPlane,projectInit
Platforms    重新探测        platform.detect       P1    soft   controlPlane,projectInit
Platforms    平台检查        platform.doctor       P1    none   controlPlane,health
```

## 5. Skills 页面

```text
页面       动作         命令             级别   确认   刷新
Skills     查看列表     skill.list       P1    none   controlPlane
Skills     查看详情     skill.inspect    P1    none   controlPlane
Skills     健康检查     skill.doctor     P1    none   controlPlane,health
Skills     修复         skill.repair     P1    soft   controlPlane,health
Skills     启用         skill.enable     P2    soft   controlPlane
Skills     禁用         skill.disable    P2    soft   controlPlane
Skills     安装         skill.install    P2    hard   controlPlane,health
Skills     卸载         skill.uninstall  P2    hard   controlPlane,health
```

## 6. MCP 页面

```text
页面    动作         命令           级别   确认   刷新
MCP     查看列表     mcp.list       P1    none   controlPlane
MCP     查看详情     mcp.inspect    P1    none   controlPlane
MCP     健康检查     mcp.doctor     P1    none   controlPlane,health
MCP     修复         mcp.repair     P1    soft   controlPlane,health
MCP     重启         mcp.restart    P1    soft   controlPlane,health
MCP     启用         mcp.enable     P2    soft   controlPlane
MCP     禁用         mcp.disable    P2    soft   controlPlane
MCP     新增         mcp.add        P2    hard   controlPlane,health
MCP     移除         mcp.remove     P2    hard   controlPlane,health
```

## 7. 第一批最小动作集

第二阶段第一批建议只做这些：

```text
controlPlane.overview
platform.list / inspect / capabilities / resolve / detect / doctor
skill.list / inspect / doctor / repair
mcp.list / inspect / doctor / repair / restart
```

这样可以先把：

- 看清楚
- 检查清楚
- 基本修复

三条主链跑稳。

## 8. 第二批动作集

第二批再补：

```text
skill.install / uninstall / enable / disable
mcp.add / remove / enable / disable
controlPlane 首页的一键批量动作
```

## 9. 为什么用 P1 / P2

因为 Control Plane 这一组动作天然很多。

如果不先压优先级，第二阶段 UI 很容易一上来就变成“每个按钮都要做”，然后实现顺序失控。

## 10. 与刷新策略的关系

这张矩阵里的刷新列，不是页面自己猜的，而应该来自：

```text
Desktop Bridge refreshHints
Control Plane Event refreshHints
```

矩阵只是把期望值先写死，后面实现时再对齐 Runtime 返回。

## 11. 审核点

你审核这份矩阵时，重点看：

```text
1  是否接受 Platforms / Skills / MCP 的第一批动作范围
2  是否接受 Skills / MCP 的写动作整体放到第二批
3  是否接受平台页面第一批就开放 detect / doctor / resolve
4  是否接受 Control Plane 首页先做只读总览，再做批量动作
```
