# FoxPilot

中文 | [English](./README.en.md) | [日本語](./README.ja.md)

FoxPilot 是一个面向本地开发环境的多项目任务中控工具。

当前面向用户的正式安装方式：

```bash
curl -fsSL https://raw.githubusercontent.com/MichealJou/FoxPoilt/main/install.sh | sh
```

Windows：

```powershell
irm https://raw.githubusercontent.com/MichealJou/FoxPoilt/main/install.ps1 | iex
```

其他正式安装方式：

```bash
npm install -g foxpilot --registry https://registry.npmjs.org
brew install MichealJou/tap/foxpilot
irm https://raw.githubusercontent.com/MichealJou/FoxPoilt/main/scripts/install.ps1 | iex
```

按平台的完整安装说明，请看对应语言 README。

当前仓库提供的主要能力：

- `foxpilot init` / `fp init`
- `foxpilot config set-language`
- `foxpilot task create`
- `foxpilot task list`
- `foxpilot task next`
- `foxpilot task edit`
- `foxpilot task show`
- `foxpilot task history`
- `foxpilot task import-beads`
- `foxpilot task push-beads`
- `foxpilot task beads-summary`
- `foxpilot task suggest-scan`
- `foxpilot task update-executor`
- `foxpilot task update-priority`
- `foxpilot task update-status`

阅读完整中文说明：

- [README.zh-CN.md](./README.zh-CN.md)

当前默认交互语言为中文，首次交互式初始化时可选择中文、英文或日文，后续也可以通过 `config set-language` 单独切换。
