# 快速参考卡片 - AI辅助开发实战指南

> 一页纸速查表，快速查找常用信息

## 文档导航

| 需求 | 查看文档 | 位置 |
|------|---------|------|
| 了解项目 | README.md | 根目录 |
| 查看提纲 | OUTLINE.md | 根目录 |
| 检查进度 | TODO.md | 根目录 |
| 查看变更 | CHANGELOG.md | 根目录 |
| 理解规范 | CLAUDE.md | 根目录 |
| 学习流程 | GETTING_STARTED.md | 根目录 |
| 了解架构 | PROJECT_OVERVIEW.md | 根目录 |
| 查看模板 | templates/*.md | templates/ |
| 查找资源 | references/resources.md | references/ |

## 目录结构速览

```
ai-development-guide/
├── 📄 核心文档 (根目录的 .md 文件)
├── 📚 chapters/        - 章节详细内容
├── 🖼️ assets/          - 图片等资源
├── 🔗 references/      - 参考资料
├── 📋 templates/       - 可复用模板
└── ⚙️ .claude/         - Claude配置目录
```

## 常用命令

### 查看文档
```bash
# 查看项目结构
ls -la

# 查看待办事项
cat TODO.md

# 查看详细提纲
cat OUTLINE.md

# 查看所有章节
ls chapters/
```

### 创建内容
```bash
# 创建新章节
touch chapters/XX-chapter-name.md

# 添加截图
cp screenshot.png assets/screenshots/
```

### Git操作
```bash
# 查看状态
git status

# 提交变更
git add .
git commit -m "类型: 描述"
git push
```

## 工作流速查

### 创作流程 (5步)

```
1. 📋 查看 TODO.md → 确定任务
2. 🤖 与AI协作 → 创作内容
3. ✅ 质量检查 → 运行清单
4. 📝 更新记录 → TODO + CHANGELOG
5. 💾 提交代码 → Git commit
```

### AI协作提示词模板

**创建章节**:
```
请基于OUTLINE.md创建第X章"[章节名]"，
确保符合CLAUDE.md中的所有规范。
```

**优化内容**:
```
请审查 chapters/XX-chapter.md 并优化：
1. Markdown格式
2. 代码示例
3. 内容逻辑
4. 运行质量检查清单
```

**更新文档**:
```
我完成了[任务]，请帮我：
1. 更新TODO.md标记完成
2. 在CHANGELOG.md添加记录
```

## Markdown规范速查

### 代码块
````markdown
```javascript
// 必须指定语言
const x = 1;
```
````

### 中英文空格
```
❌ 这是Token的概念
✅ 这是 Token 的概念
```

### 链接
```markdown
# 相对路径（推荐）
[链接](./file.md)

# 章节锚点
[链接](#section-name)
```

### 表格
```markdown
| 列1 | 列2 |
|-----|-----|
| 值1 | 值2 |
```

## 质量检查清单

### 内容
- [ ] 技术信息准确
- [ ] 代码可运行
- [ ] 提供充足示例
- [ ] 逻辑清晰连贯

### 格式
- [ ] Markdown语法正确
- [ ] 代码块指定语言
- [ ] 中英文空格正确
- [ ] 链接有效

### 文档
- [ ] TODO.md已更新
- [ ] CHANGELOG.md已更新（如需）

## Git提交规范

### 提交类型
```
feat:     新功能或新内容
fix:      修复错误
docs:     文档更新
style:    格式调整
refactor: 重构
test:     测试相关
chore:    构建/工具相关
```

### 提交示例
```bash
git commit -m "feat: 完成第一章LLM基础概念"
git commit -m "fix: 修正OUTLINE中的错别字"
git commit -m "docs: 更新README项目介绍"
```

## 版本号规则

```
X.Y.Z

X - 主版本: 重大更新/发布
Y - 次版本: 完成主要章节
Z - 修订号: 小修订/修复

示例:
0.1.0 → 初始框架
0.2.0 → 完成第一章
1.0.0 → 正式发布
```

## 文件命名规范

### 章节文件
```
格式: 0X-chapter-name.md
示例: 01-llm-fundamentals.md
```

### 图片文件
```
格式: descriptive-name.png
示例: cursor-interface-screenshot.png
位置: assets/screenshots/
```

### 模板文件
```
格式: template-name-template.md
示例: cursorrules-template.md
位置: templates/
```

## 常见问题快速解答

**Q: 如何开始创作？**
A: 查看TODO.md → 选择任务 → 阅读CLAUDE.md → 开始创作

**Q: 忘记项目规范怎么办？**
A: 查看CLAUDE.md，所有规范都在那里

**Q: 如何让AI理解项目？**
A: 在提示词中引用CLAUDE.md和OUTLINE.md

**Q: 创作完成后要做什么？**
A: 运行质量检查清单 → 更新TODO.md → 更新CHANGELOG.md → Git提交

**Q: 如何添加新章节？**
A: 创建文件 → 更新OUTLINE.md → 在TODO.md添加任务

## 核心原则

### 内容原则
1. **准确** - 技术信息必须正确
2. **实用** - 提供可操作的方法
3. **真实** - 基于真实经验
4. **完整** - 包含必要上下文

### 协作原则
1. **清晰指令** - 明确告诉AI做什么
2. **引用文档** - 让AI参考项目规范
3. **分步执行** - 避免一次性要求太多
4. **人工把关** - 最终由人审核确认

### 维护原则
1. **及时更新** - 完成任务立即更新TODO
2. **记录变更** - 重要变更记入CHANGELOG
3. **保持整洁** - 定期整理文档结构
4. **持续改进** - 发现问题及时优化

## 模板快速访问

| 模板 | 用途 | 位置 |
|------|------|------|
| .cursorrules | Cursor配置 | templates/cursorrules-template.md |
| CLAUDE.md | Claude配置 | templates/CLAUDE-template.md |
| MCP配置 | MCP服务器 | templates/mcp-config-example.json |

## 资源链接

### 内部文档
- [详细提纲](./OUTLINE.md)
- [使用指南](./GETTING_STARTED.md)
- [项目架构](./PROJECT_OVERVIEW.md)
- [参考资料](./references/resources.md)

### 外部资源
- [Claude官方文档](https://docs.anthropic.com/)
- [Cursor官网](https://www.cursor.com/)
- [Markdown指南](https://www.markdownguide.org/)

## 快速操作卡片

### 开始新任务
```
1. cat TODO.md              # 查看任务
2. cat OUTLINE.md           # 了解上下文
3. [与AI协作创作]
4. [运行质量检查]
5. 更新TODO和CHANGELOG
6. git commit
```

### AI提示词模板
```
任务: [描述任务]
参考: OUTLINE.md 第X章 + CLAUDE.md
要求: [具体要求]
输出: [期望输出格式]
```

### 质量检查
```
内容 → 格式 → 链接 → 文档更新 → Git提交
```

---

## 记住这三个核心文件

1. **CLAUDE.md** - 告诉AI项目规范
2. **TODO.md** - 追踪任务进度
3. **OUTLINE.md** - 了解内容框架

**有了这三个文件，你就能高效使用Claude Code完成整个项目！**

---

**版本**: v0.1.0
**最后更新**: 2025-11-17

💡 **提示**: 将此文件打印或置顶，随时查阅！
