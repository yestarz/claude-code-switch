# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作提供指导。

## 项目概述

这是 `claude-code-switch` (ccs)，一个用于管理和切换多个 Claude Code 配置文件的 CLI 工具。该工具允许用户在 `~/.claude/profiles-settings.json` 中存储多个配置并轻松切换。

## 开发命令

```bash
# 开发
npm run dev          # 使用 ts-node 在开发模式下运行 CLI
npm run build        # 将 TypeScript 编译到 dist/ 目录

# 包管理
npm run prepublishOnly # 发布前构建（自动运行）
```

## 架构

### 核心组件

- **CLI 入口点** (`src/cli.ts`): 基于 Commander.js 的 CLI，包含 4 个主要命令
- **ProfileStore** (`src/core/ProfileStore.ts`): 管理 `~/.claude/profiles-settings.json` 中的配置存储
- **命令** (`src/commands/`): 各个命令的实现
  - `list.ts` - 列出所有可用配置的键名
  - `current.ts` - 显示当前活跃的配置
  - `switch.ts` - 切换配置（交互式或直接切换）
  - `open.ts` - 在默认编辑器中打开配置文件
- **Logger** (`src/utils/logger.ts`): 使用 chalk 和 ora 处理控制台输出

### 核心功能

工具工作原理：
1. 将所有配置以键值对形式存储在 `~/.claude/profiles-settings.json` 中
2. 切换配置时，将选定的配置数据复制到 `~/.claude/settings.json`
3. 如果存在，同时更新 `~/.claude/providers.json` 的 API 配置
4. 支持交互式选择和直接配置切换

### 配置结构

配置支持任何 Claude Code 设置，包括：
- `env` - 环境变量（API 密钥、基础 URL）
- `model` - 模型选择（opus/sonnet/haiku）
- `permissions` - 文件访问权限
- `temperature`, `maxTokens` - 模型参数
- 任何自定义字段

## 文件结构

```
src/
├── cli.ts              # Commander.js 设置的主 CLI 入口点
├── core/
│   └── ProfileStore.ts # 配置管理和文件 I/O
├── commands/           # 各个命令的实现
│   ├── current.ts     # 显示当前活跃配置
│   ├── list.ts        # 列出所有配置键名
│   ├── open.ts        # 在编辑器中打开配置文件
│   └── switch.ts      # 切换配置
└── utils/
    └── logger.ts      # 控制台输出工具
```

## 主要依赖

- `commander` - CLI 框架
- `inquirer` - 配置选择的交互式提示
- `fs-extra` - 带 Promise 的文件系统工具
- `chalk` - 终端颜色
- `ora` - 加载动画

## TypeScript 配置

- 目标：ES2022，使用 CommonJS 模块
- 输出到 `dist/` 目录
- 启用 source map 和声明文件
- 启用严格模式

## AI回复规则
- 所有的回复必须使用中文，一些特定的专业名词除外。