# Claude Code Switch (CCS) v2.5.1

一个简洁的 Claude Code 配置管理工具，用于管理和切换多个配置文件。

## 特性

- 🔄 **快速切换** - 交互式选择或直接切换配置
- 👁️ **查看当前** - 显示当前使用的配置
- 📝 **简单管理** - 查看、编辑、切换配置
- 🗂️ **集中存储** - 所有配置存储在 `~/.claude/profiles-settings.json`
- 🔑 **Key-Value 格式** - 易于理解和管理的 JSON 格式
- 🎛️ **Web UI 界面** - 炫酷的图形化配置管理界面
- ⚡ **Monaco 编辑器** - VS Code 级别的 JSON 编辑体验

## 安装

```bash
npm install -g @yestarz/claude-code-switch
```

## 使用方法

### 查看当前配置

```bash
ccs current
# 或
ccs now
```

显示当前使用的配置名称和详情。

### 查看所有配置

```bash
ccs list
# 或
ccs ls
```

显示所有配置的 key 名称。

### 切换配置

```bash
# 交互式选择
ccs switch

# 直接切换到指定配置
ccs switch production
ccs use development  # 使用别名
```

### 编辑配置文件

```bash
ccs open
```

使用系统默认编辑器打开配置文件。

### Web UI 界面 ✨

```bash
ccs ui
```

启动炫酷的 Web UI 界面，提供：
- 🎨 **可视化管理** - 直观的配置卡片展示
- ⚡ **Monaco 编辑器** - VS Code 级别的 JSON 编辑体验
- 🛠️ **编辑工具栏** - 格式化、验证、折叠/展开功能
- 📊 **实时状态** - 语法检查和统计信息
- 🌙 **深色主题** - 护眼的专业界面设计
- 🚀 **一键切换** - 点击即可切换配置

Web UI 会自动在浏览器中打开 `http://localhost:3456`

## 配置文件格式

配置文件位于 `~/.claude/profiles-settings.json`，采用 key-value 格式：

```json
{
  "development": {
    "env": {
      "ANTHROPIC_AUTH_TOKEN": "sk-dev-xxx",
      "ANTHROPIC_BASE_URL": "https://dev-api.example.com",
      "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "model": "opus",
    "permissions": {
      "allow": ["/path/to/allowed"],
      "deny": ["/path/to/denied"]
    }
  },
  "production": {
    "env": {
      "ANTHROPIC_AUTH_TOKEN": "sk-prod-xxx",
      "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
    },
    "model": "sonnet"
  },
  "test": {
    "env": {
      "ANTHROPIC_AUTH_TOKEN": "sk-test-xxx"
    },
    "model": "haiku",
    "temperature": 0.5,
    "maxTokens": 2048
  }
}
```

### 支持的配置字段

每个配置可以包含任何 Claude Code 支持的设置：

- `env` - 环境变量
  - `ANTHROPIC_AUTH_TOKEN` - API 密钥
  - `ANTHROPIC_BASE_URL` - API 地址
  - `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` - 禁用非必要流量
  - 其他环境变量...
- `model` - 模型选择 (opus/sonnet/haiku)
- `permissions` - 权限设置
  - `allow` - 允许访问的路径
  - `deny` - 禁止访问的路径
- `temperature` - 温度参数
- `maxTokens` - 最大 token 数
- 任何其他自定义字段...

## 使用场景

### 1. 管理多个 API Key

```json
{
  "personal": {
    "env": {
      "ANTHROPIC_AUTH_TOKEN": "sk-personal-xxx"
    }
  },
  "work": {
    "env": {
      "ANTHROPIC_AUTH_TOKEN": "sk-work-xxx"
    }
  }
}
```

### 2. 不同环境配置

```json
{
  "local": {
    "env": {
      "ANTHROPIC_BASE_URL": "http://localhost:8080"
    },
    "model": "haiku"
  },
  "cloud": {
    "env": {
      "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
    },
    "model": "opus"
  }
}
```

### 3. 项目特定配置

```json
{
  "project-a": {
    "env": {
      "ANTHROPIC_AUTH_TOKEN": "sk-project-a-xxx"
    },
    "permissions": {
      "allow": ["/Users/me/project-a"]
    }
  },
  "project-b": {
    "env": {
      "ANTHROPIC_AUTH_TOKEN": "sk-project-b-xxx"
    },
    "permissions": {
      "allow": ["/Users/me/project-b"]
    }
  }
}
```

## 切换配置

使用 `ccs switch` 命令切换配置，工具会自动更新：
- `~/.claude/settings.json` - Claude Code 主配置文件
- `~/.claude/providers.json` - API 提供商配置（如果存在）

## 命令说明

```bash
# 查看帮助
ccs --help

# 查看版本
ccs -v
ccs --version

# 查看当前配置
ccs current       # 显示当前使用的配置
ccs now          # 使用别名

# 列出所有配置
ccs list
ccs ls

# 切换配置
ccs switch          # 交互式选择
ccs switch <key>    # 直接切换
ccs use <key>       # 使用别名

# 打开编辑
ccs open

# Web UI 界面
ccs ui              # 启动图形化管理界面
```

## 注意事项

1. 配置文件为纯 JSON 格式，编辑时注意语法正确
2. API Key 等敏感信息请妥善保管
3. 修改配置后可能需要重启 Claude Code 才能生效

## License

MIT

## 更新日志

### v2.5.1
- **优化** -  在Web UI新增配置时，默认一些参数。

### v2.5.0 🐛
- **修复 Web UI 编辑器配置回显问题** - 解决首次点击编辑按钮时配置内容不显示的问题
- **优化 Monaco 编辑器初始化时序** - 确保配置内容正确回显到编辑器中
- **改进用户体验** - 提升编辑功能的稳定性

### v2.4.0 🚀
- **新增 Web UI 界面** - 使用 `ccs ui` 启动炫酷的图形化管理界面
- **集成 Monaco 编辑器** - VS Code 级别的 JSON 编辑体验
- **专业编辑工具** - 格式化、语法验证、代码折叠功能
- **实时状态显示** - 语法检查、行数统计、字符计数
- **深色主题设计** - 现代化的护眼界面
- **代码结构优化** - HTML 模板独立文件管理

### v2.2.0
- 新增 `current` 命令，显示当前使用的配置
- 支持别名 `now` 查看当前配置
- 改进配置匹配逻辑

### v2.1.0
- 新增 `switch` 命令，支持交互式选择和直接切换
- 支持 `-v` 参数查看版本
- 自动更新 settings.json 和 providers.json

### v2.0.1
- 清理发布包，移除旧版本文件
- 优化包体积

### v2.0.0
- 完全重新设计，简化为两个命令
- 使用 `profiles-settings.json` 统一管理配置
- 移除复杂的配置管理功能，专注于查看和编辑

### v1.0.0
- 初始版本