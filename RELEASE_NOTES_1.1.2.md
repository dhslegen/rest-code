## Rest Code 1.1.2 发布了 🚀

### 🎉 主要新功能

**✨ 文件型查询参数支持**：新增 `?*` 文件型查询参数契约符号，支持 Spring Boot Multipart 文件上传功能，提供完整的文件处理解决方案。

### 🆕 新增参数契约符号

#### 文件型查询参数
- `?*` → `@RequestParam("file") MultipartFile file` (默认文件参数)
- `?*参数名` → `@RequestParam("参数名") MultipartFile 参数名` (自定义文件参数)

### 📝 功能特性

- **🎯 智能参数映射**：自动生成 `MultipartFile` 类型的请求参数
- **📄 Swagger 集成**：自动添加文件参数的 API 文档注解
- **🏷️ 自定义参数名**：支持自定义文件参数名称，如 `?*document`、`?*avatar` 等
- **🔗 混合参数支持**：可与其他查询参数组合使用，如 `?$category?*file`

### 💡 使用示例

```rcs
# 基础文件上传
User.POST./upload.uploadAvatar.?*.上传头像

# 自定义文件参数名
User.POST./uploadDoc.uploadDocument.?*document>.上传文档

# 混合参数（分类 + 文件）
User.POST./uploadWithInfo.uploadWithInfo.?$category?*file>.带分类信息上传文件

# 批量文件上传
User.POST./uploadFiles.uploadFiles.?*files>=.批量上传用户文件
```

### 🔧 生成的代码示例

**Controller 方法：**
```java
@PostMapping("/upload")
@Operation(summary = "上传头像")
public Result<Void> uploadAvatar(
    @Parameter(name = "file", description = "文件型查询参数", in = ParameterIn.QUERY, schema = @Schema(type = "string", format = "binary"))
    @RequestParam("file") MultipartFile file
) {
    return userService.uploadAvatar(file);
}
```

**Service 接口：**
```java
Result<Void> uploadAvatar(MultipartFile file);
```

### 📊 适用场景

- **头像上传**：用户头像、个人照片等图片文件上传
- **文档管理**：PDF、Word、Excel 等文档文件上传
- **资源上传**：音频、视频、附件等多媒体文件上传
- **批量上传**：多文件同时上传处理

### 🔄 兼容性说明

此版本为向前兼容的功能增强版本，不会影响现有的 RCS 脚本和生成的代码。

### 📖 文档更新

- ✅ README.md - 添加文件型查询参数说明
- ✅ GPT 调教指令 - 更新参数契约映射表
- ✅ ScriptEditor 提示 - 增加 `?*` 参数说明
- ✅ 测试用例 - 补充文件上传场景的测试

### 🛠️ 技术实现

- **解析器增强**：支持 `?*` 语法的正则表达式匹配
- **代码生成器**：自动导入 `MultipartFile` 相关依赖
- **校验器更新**：参数契约校验规则支持新语法
- **文档生成**：自动生成 Swagger 文件参数注解

---

**💡 提示**：文件型查询参数特别适合处理文件上传场景，结合其他参数类型可以实现复杂的文件处理业务逻辑。

**🔗 相关链接**：
- [完整文档](README.md)
- [测试用例](test-query-params.rcs)
- [GPT 调教指令](src/docs/GPT.md) 