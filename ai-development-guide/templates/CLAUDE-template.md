# CLAUDE.md 模板示例

> 这是一个高质量的 CLAUDE.md 配置模板，用于指导Claude Code更好地理解项目和执行任务

## 基础模板

```markdown
# 项目：[项目名称]

## 项目概述
[简短描述项目的核心目标和功能]

## 技术栈
- **语言**: [主要编程语言及版本]
- **框架**: [使用的框架]
- **工具链**: [构建工具、包管理器等]
- **依赖**: [关键依赖库]

## 项目结构
```
project-root/
├── src/           # [描述]
├── tests/         # [描述]
├── docs/          # [描述]
└── config/        # [描述]
```

## 开发规范

### 代码风格
- [具体的代码风格要求]
- [命名规范]
- [格式化工具配置]

### 提交规范
- 使用 [Conventional Commits / 其他规范]
- 提交前必须通过测试
- [其他Git相关要求]

### 测试要求
- [测试框架]
- [测试覆盖率要求]
- [测试编写规范]

## AI辅助开发指引

### 工作流程
1. [步骤1]
2. [步骤2]
3. [步骤3]

### 代码生成要求
- [类型安全要求]
- [错误处理要求]
- [注释和文档要求]

### 禁止事项
- ❌ [不允许的操作1]
- ❌ [不允许的操作2]
- ❌ [不允许的操作3]

## 重要文件说明
- `[文件路径]`: [文件作用和注意事项]

## 常用命令
```bash
# [命令说明]
command1

# [命令说明]
command2
```

## 注意事项
- ⚠️ [重要提醒1]
- ⚠️ [重要提醒2]
```

---

## 实战示例：AI开发指南文档项目

```markdown
# 项目：AI辅助开发实战指南

## 项目概述
这是一个系统性的知识分享项目，旨在帮助开发者掌握AI辅助编程的核心方法论。内容涵盖LLM基础、主流工具使用、实战案例和最佳实践。

## 项目类型
- 文档项目（Documentation Project）
- 使用Markdown格式
- 采用模块化组织结构

## 文件结构
```
ai-development-guide/
├── README.md              # 项目总览
├── OUTLINE.md             # 详细提纲
├── TODO.md                # 待办事项
├── CHANGELOG.md           # 变更日志
├── chapters/              # 各章节详细内容
│   ├── 01-llm-fundamentals.md
│   ├── 02-ai-coding-tools.md
│   ├── 03-cursor-guide.md
│   ├── 04-claude-code-guide.md
│   ├── 05-my-journey.md
│   ├── 06-case-studies.md
│   └── 07-best-practices.md
├── assets/                # 图片、截图等资源
├── references/            # 参考资料
│   └── resources.md
└── templates/             # 可复用模板
    ├── cursorrules-template.md
    └── CLAUDE-template.md
```

## 内容规范

### 写作风格
- **语气**: 专业但易懂，避免过于学术化
- **结构**: 使用清晰的标题层级
- **示例**: 提供具体可操作的代码示例
- **格式**: 遵循Markdown最佳实践

### Markdown规范
- 标题使用 `#` 标记，最多到 `###`（三级）
- 代码块必须指定语言：\`\`\`javascript
- 列表保持一致的缩进
- 中英文之间添加空格
- 使用相对路径引用内部资源

### 内容要求
- ✅ 技术准确性：所有技术信息必须准确无误
- ✅ 实用性：提供可直接应用的方法和技巧
- ✅ 完整性：每个主题提供完整的上下文
- ✅ 可读性：使用图表、表格等辅助理解

## AI辅助开发指引

### 内容创作流程
1. **理解主题**: 先阅读OUTLINE.md了解当前章节的定位
2. **检查进度**: 查看TODO.md确认待完成的任务
3. **内容创作**: 根据提纲创作详细内容
4. **质量检查**: 确保内容符合规范
5. **更新记录**: 更新TODO.md和CHANGELOG.md

### 章节创作要求
每个章节文件应包含：
- 清晰的章节标题和引言
- 逻辑清晰的小节划分
- 实际可运行的代码示例（如适用）
- 必要的截图和图表
- 关键要点总结

### 代码示例要求
```markdown
## 示例格式

\`\`\`javascript
// 提供清晰的注释说明代码作用
function example() {
  // 确保代码可以直接运行
  return "Hello, AI!";
}
\`\`\`

**说明**: 在代码块后提供必要的解释
```

### 禁止事项
- ❌ 不要创建空的章节文件（除非有完整的框架）
- ❌ 不要复制粘贴未验证的代码
- ❌ 不要使用过时的工具版本信息
- ❌ 不要忽略更新TODO和CHANGELOG

## 文档维护

### 更新TODO.md
每次完成任务后：
```markdown
- [x] 已完成的任务（从 [ ] 改为 [x]）
```

### 更新CHANGELOG.md
有重要变更时添加记录：
```markdown
## [版本号] - 日期

### 新增
- 新增了什么内容

### 变更
- 修改了什么内容
```

## 质量检查清单

在提交前确认：
- [ ] Markdown语法正确
- [ ] 所有链接有效
- [ ] 代码示例可运行
- [ ] 图片正确加载
- [ ] 无拼写错误
- [ ] 格式统一美观
- [ ] TODO.md已更新
- [ ] CHANGELOG.md已更新（如有重要变更）

## 常用任务

### 创建新章节
```bash
# 在chapters/目录下创建新的Markdown文件
touch chapters/XX-chapter-name.md
```

### 添加图片
```bash
# 将图片放入assets/目录
cp /path/to/image.png assets/
# 在Markdown中引用：![描述](../assets/image.png)
```

### 预览文档
使用Markdown预览工具或推送到GitHub查看渲染效果

## 参考资料管理

### 添加新的参考资料
更新 `references/resources.md`：
```markdown
### [分类]
- [资源名称](URL) - 简短描述
```

## 协作提示

### 与AI协作时
- 提供清晰的任务描述
- 一次专注于一个章节
- 及时审查AI生成的内容
- 发现问题立即反馈修正

### 质量控制
- 不要盲目接受AI生成的所有内容
- 验证技术细节的准确性
- 确保内容连贯性和一致性
- 保持个人经验和见解的真实性

## 版本说明

- **当前版本**: v0.1.0
- **最后更新**: 2025-11-17
- **维护者**: dhslegen

## 下一步计划

参考TODO.md中的任务清单，按优先级逐步完成内容创作。
```

---

## 实战示例：TypeScript全栈项目

```markdown
# 项目：RestCode - REST API开发工具

## 项目概述
RestCode是一个Electron桌面应用，用于快速开发和测试REST API。支持请求构建、历史记录、环境变量管理等功能。

## 技术栈
- **前端**: React 18 + TypeScript + Vite
- **桌面**: Electron
- **状态管理**: Zustand
- **UI组件**: Ant Design
- **HTTP客户端**: Axios
- **构建**: electron-builder

## 项目结构
```
rest-code/
├── src/
│   ├── components/      # React组件
│   ├── services/        # 业务逻辑
│   ├── stores/          # 状态管理
│   ├── types/           # TypeScript类型定义
│   └── utils/           # 工具函数
├── electron/            # Electron主进程代码
├── public/              # 静态资源
└── build/              # 构建输出
```

## 开发规范

### TypeScript规范
- 严格模式：`"strict": true`
- 所有函数必须有类型注解
- 避免使用 `any`，必要时使用 `unknown`
- 使用 interface 定义对象类型

### React规范
- 函数组件优先
- 使用 Hooks 管理状态
- 组件文件使用 PascalCase.tsx
- 提取可复用逻辑到自定义Hook

### 命名规范
- 组件: PascalCase (如 `RequestBuilder.tsx`)
- 文件: camelCase (如 `httpClient.ts`)
- 类型: PascalCase (如 `RequestConfig`)
- 常量: UPPER_SNAKE_CASE (如 `API_BASE_URL`)

## AI辅助开发指引

### 开发工作流
1. 理解需求和现有代码结构
2. 设计类型定义（types/）
3. 实现业务逻辑（services/）
4. 开发UI组件（components/）
5. 集成状态管理（stores/）
6. 编写单元测试
7. 更新文档

### 代码生成要求
- 生成的代码必须通过 TypeScript 类型检查
- 组件必须正确处理 loading 和 error 状态
- 使用 try-catch 包裹异步操作
- 提供有意义的错误提示

### 测试要求
- 工具函数必须有单元测试
- 组件测试使用 React Testing Library
- Mock外部依赖（如HTTP请求）
- 测试覆盖率目标：> 80%

### 性能考虑
- 使用 React.memo 避免不必要的重渲染
- 大列表使用虚拟滚动
- 图片使用懒加载
- 合理使用 useMemo 和 useCallback

## 重要文件说明

- `src/types/request.ts`: HTTP请求相关类型定义
- `src/services/httpClient.ts`: 核心HTTP客户端
- `src/stores/requestStore.ts`: 请求历史状态管理
- `electron/main.ts`: Electron主进程入口

## 常用命令

```bash
# 开发模式
yarn dev

# 类型检查
yarn type-check

# 代码检查
yarn lint

# 运行测试
yarn test

# 构建应用
yarn build

# 打包Electron应用
yarn package
```

## 禁止事项
- ❌ 不要直接修改 node_modules
- ❌ 不要提交 .env 文件
- ❌ 不要使用 console.log（使用日志工具）
- ❌ 不要绕过 TypeScript 类型检查
- ❌ 不要在主进程中使用 React

## Git规范
- 提交信息格式: `<type>: <description>`
  - feat: 新功能
  - fix: 修复bug
  - docs: 文档更新
  - refactor: 重构
  - test: 测试相关
  - chore: 构建/工具相关

## 注意事项
- ⚠️ Electron主进程和渲染进程隔离，注意IPC通信
- ⚠️ 敏感数据（如API密钥）使用Electron安全存储
- ⚠️ 跨平台兼容性（Windows/macOS/Linux）
- ⚠️ 打包前测试所有平台

## 版本管理
- **当前版本**: v1.1.6
- **Node版本**: >= 16.0.0
- **Electron版本**: ^27.0.0
```

---

## 高级技巧

### 1. 上下文分层
将配置分为三层：
- **项目背景** - 帮助AI理解做什么
- **技术规范** - 指导AI怎么做
- **禁止事项** - 明确AI不要做什么

### 2. 工作流引导
提供清晰的步骤，让AI知道处理任务的顺序。

### 3. 实例驱动
提供具体的代码示例和模板，AI会模仿这种风格。

### 4. 检查清单
提供checklist帮助AI自我验证。

### 5. 动态更新
随着项目演进，及时更新CLAUDE.md以反映最新的规范和实践。

---

## 最佳实践

### DO ✅
- 提供清晰的项目结构说明
- 明确代码风格和规范
- 列出常用命令和工作流
- 说明重要文件的作用
- 提供质量检查清单

### DON'T ❌
- 不要写得过于冗长
- 不要包含过时的信息
- 不要遗漏关键的项目约束
- 不要忘记更新版本信息

---

**创建日期**: 2025-11-17
**适用工具**: Claude Code
**维护者**: dhslegen
