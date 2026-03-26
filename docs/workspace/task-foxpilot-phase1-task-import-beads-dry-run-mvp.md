# 任务：FoxPilot 第一阶段 Beads 导入预演 MVP

## 目标

在 `task import-beads` 已具备真实导入和 `--close-missing` 收口能力的前提下，补上一条“只预演、不落库”的安全入口，让用户先看同步结果再决定是否执行。

## 承接来源

- `docs/workspace/task-foxpilot-phase1-task-import-beads-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-import-beads-close-missing-mvp.md`
- `docs/workspace/task-foxpilot-phase1-collaboration-orchestration-mvp.md`

## 当前范围

- 为 `task import-beads` 增加 `--dry-run`
- 预演输出仍返回 `created / updated / skipped / closed / rejected`
- `--dry-run` 与 `--close-missing` 可组合使用
- 预演不真正写入数据库
- README 与安装验证同步体现该能力

## 设计约束

- 不单独拆新命令，继续复用 `task import-beads`
- 不引入临时表
- 预演必须复用真实导入决策逻辑，不能另写一套近似算法

## 暂不展开的内容

- 预演结果保存为文件
- 交互式确认执行
- 预演 diff 的富文本展示
- 多来源统一预演

## 进度

- [x] 已确定下一步为导入预演 MVP
- [x] 已完成实现计划
- [x] 已开始正式实现
- [x] 已完成实现与验证
