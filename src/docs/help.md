# Rest Code 使用指南

Rest Code 是一个可视化的API脚本生成工具，帮助开发者快速生成标准的Spring Boot后端代码。

## 主要功能区域

- **操作区域**：包含文件加载和代码生成功能。
- **领域设计**：用于定义和管理API的业务领域。
- **脚本设计**：提供表格形式的API脚本编辑功能。
- **脚本编辑器**：可直接编辑 `.rcs` 脚本内容，支持实时校验和与表格的双向联动。

## 操作指南

### 界面介绍

- **文件加载**：用于打开已有的 `.rcs` 脚本文件。
- **生成代码**：配置生成代码的相关参数，如输出路径、包名等。
- **领域设计**：设计领域名称和描述，领域是业务模块的划分。
- **脚本设计**：设计 API 脚本，包括操作名称、请求方法、参数契约等。
- **脚本编辑器**：可直接编辑 `.rcs` 脚本内容，支持实时校验和与表格的双向联动。
- **帮助**：查看帮助文档，了解工具的使用方法和脚本格式。

### 基本操作

1. **添加领域**：
   - 在领域设计区域，点击`新增领域`按钮。
   - 输入领域名称和描述。

2. **添加脚本**：
   - 在脚本设计区域，点击`新增脚本`按钮。
   - 选择领域名称和内置模板，模板会自动填充脚本内容。
   - 根据需要修改脚本的各个部分。

3. **一键 CRUD**：
   - 在脚本设计区域，点击`一键 CRUD`按钮。
   - 选择需要生成 CRUD 脚本的领域，自动添加常用的增删改查脚本。

4. **直接编辑脚本**：
   - 在脚本编辑器区域，可以直接编辑 `.rcs` 脚本内容。
   - 编辑器支持实时校验，会自动检查脚本格式和内容。
   - 编辑器与上方的表格实时联动，修改脚本内容会同步更新表格。

5. **校验脚本**：
   - 在脚本编辑器区域，点击`校验`按钮。
   - 检查脚本的格式和内容，提示可能的错误和重复。

6. **保存脚本**：
   - 在脚本编辑器区域，点击"保存"按钮。
   - 将编辑好的 `.rcs` 脚本保存到文件。

7. **生成代码**：
   - 在生成代码区域，配置框架基本包名、源码输出路径、源码基本包名等参数。
   - 选择 Spring Boot 版本（2 或 3），系统会自动适配相应的依赖和注解。
   - 点击"生成代码"按钮，生成后端代码。

8. **预览代码**：
   - 在生成代码区域，点击"预览"按钮。
   - 查看生成的代码内容，检查是否符合预期。

### 脚本编写注意事项

- **领域名称**：应为大写字母开头的驼峰命名，如 `User`。
- **操作名称**：应为小写字母开头的驼峰命名，如 `createUser`。
- **参数契约**：根据 API 的需求，正确使用 `@、?、%、>` 等前缀符。
- **避免重复**：同一领域下，操作名称和参数契约的组合不能重复。

## Rcs 文件格式

Rcs（`Rest Code Script`）文件是一种专门为`Rest Code`设计的脚本文件，用于描述 REST API 的领域模型和操作。它通过简洁的语法规则，定义了领域声明和 API 操作，进而帮助生成符合业务逻辑的 API 控制器代码。

Rcs 文件分为两部分：**Domain 声明** 和 **API 脚本**。

1. **Domain 声明**：文件的头部由若干行 `Domain声明` 组成，每个声明由 `/` 开头，并由 `/` 分割，用于定义领域名称和领域描述。`Domain 声明` 与内置模板结合使用，以辅助用户快速输入 `API 脚本`。

2. **API 脚本**：文件的主体由若干行 `API 脚本` 组成，每个脚本元素通过 `.` 分割，用于描述 API 操作，包括请求方法、路径、参数和描述等。每个 `API 脚本` 将生成对应的 `Spring Boot Rest Controller` 代码。

### Domain 声明格式

**格式**：`/领域名称/领域描述`

- 领域名称是 API 所属的业务模块名称，如 `User`。
- 领域描述则是对该模块的简单说明，如 `用户。

**示例**：

```text
/User/用户
/Order/订单
```

### API 脚本格式

**格式**：`领域名称.HTTP请求方法.API路径（可为空）.操作名称（方法名称）.参数契约（可为空）.描述`

- 领域名称：与 Domain 声明中的领域名称一致。
- HTTP 请求方法：如 `GET`、`POST`、`PATCH`、`DELETE` 等。
- API 路径：可以为空，若不为空，则指定 API 的路径。
- 操作名称：即生成的控制器中对应方法的名称。
- 参数契约：定义请求体、查询参数和路径参数的格式，支持多种参数类型。
- 描述：对 API 操作的简要说明。

**示例**：

```text
User.POST..create.@.新增用户
Order.GET./{id}.get.#id.获取订单详情
```

### 参数契约格式

`参数契约` 是 API 脚本中用于定义请求参数和响应类型的核心机制。契约采用特殊前缀符号组合的方式描述 REST API 的输入输出规范，格式为：`@xxx?yyy%num%$str>zzz`。

#### 契约符号说明

**1. `@` - 请求体参数（RequestBody）**

用于定义 HTTP 请求体中的 JSON 数据结构：

| 符号格式 | 参数类型 | 生成代码示例 | 说明 |
|---------|---------|-------------|------|
| `@` | 单个业务对象 | `@` → `@RequestBody @Valid UserReqVo reqVo` | 标准请求体对象 |
| `@业务名` | 带业务后缀的对象 | `@update` → `@RequestBody @Valid UserUpdateReqVo reqVo` | 指定业务场景的请求体 |
| `@=` | 对象列表 | `@=` → `@RequestBody @Valid List<UserReqVo> reqVos` | 批量操作的对象列表 |
| `@=业务名` | 带业务后缀的对象列表 | `@=update` → `@RequestBody @Valid List<UserUpdateReqVo> reqVos` | 指定业务场景的对象列表 |
| `@#` | 数值型列表 | `@#` → `@RequestBody @Valid List<Long> ids` | 数值型ID列表，默认参数名为`ids` |
| `@#参数名` | 自定义数值型列表 | `@#userIds` → `@RequestBody @Valid List<Long> userIds` | 自定义参数名的数值型列表 |
| `@$` | 字符串型列表 | `@$` → `@RequestBody @Valid List<String> codes` | 字符串型编码列表，默认参数名为`codes` |
| `@$参数名` | 自定义字符串型列表 | `@$orgCodes` → `@RequestBody @Valid List<String> orgCodes` | 自定义参数名的字符串型列表 |

**2. `?` - 查询参数（Query Parameters）**

用于定义 HTTP GET 请求的查询条件：

| 符号格式 | 参数类型 | 生成代码示例 | 说明 |
|---------|---------|-------------|------|
| `?` | 标准查询对象 | `?` → `@ParameterObject UserQueryVo queryVo` | 领域标准查询参数 |
| `?业务名` | 带业务后缀的查询对象 | `?simple` → `@ParameterObject UserSimpleQueryVo queryVo` | 指定业务场景的查询参数 |
| `?$` | 字符串型查询参数 | `?$` → `@RequestParam("code") String code` | 默认字符串查询参数 |
| `?$参数名` | 自定义字符串查询参数 | `?$orgCode` → `@RequestParam("orgCode") String orgCode` | 自定义的字符串型查询参数 |
| `?#` | 数值型查询参数 | `?#` → `@RequestParam("number") Long number` | 默认数值查询参数 |
| `?#参数名` | 自定义数值查询参数 | `?#userId` → `@RequestParam("userId") Long userId` | 自定义的数值型查询参数 |

**3. `%` - 路径参数（PathVariable）**

用于定义 URL 路径中的变量：

| 符号格式 | 参数类型 | 生成代码示例 | 说明 |
|---------|---------|-------------|------|
| `%` | 数值型路径参数 | `%` → `@PathVariable("id") long id` | 默认主键ID参数 |
| `%参数名` | 自定义数值参数 | `%userId` → `@PathVariable("userId") long userId` | 自定义的数值型路径参数 |
| `%$` | 字符串型路径参数 | `%$` → `@PathVariable("code") String code` | 默认编码参数 |
| `%$参数名` | 自定义字符串参数 | `%$orgCode` → `@PathVariable("orgCode") String orgCode` | 自定义的字符串型路径参数 |

**4. `>` - 响应类型（Response Type）**

用于定义 HTTP 响应体的数据结构：

| 符号格式 | 响应类型 | 生成代码示例 | 说明 |
|---------|---------|-------------|------|
| `>` | 单个业务对象 | `>` → `Result<UserRespVo>` | 返回单个业务对象 |
| `>业务名` | 带业务后缀的对象 | `>simple` → `Result<UserSimpleRespVo>` | 返回指定业务场景的对象 |
| `>=` | 对象列表 | `>=` → `Result<List<UserRespVo>>` | 返回对象列表 |
| `>=业务名` | 带业务后缀的对象列表 | `>=simple` → `Result<List<UserSimpleRespVo>>` | 返回指定业务场景的对象列表 |
| `>+` | 分页对象 | `>+` → `Result<Page<UserRespVo>>` | 返回分页数据，自动添加分页查询参数 |
| `>+业务名` | 带业务后缀的分页对象 | `>+simple` → `Result<Page<UserSimpleRespVo>>` | 返回指定业务场景的分页数据 |
| `><` | 树形结构 | `><` → `Result<TreeNode<Long, UserTreeVo>>` | 返回树形结构数据 |
| `><业务名` | 带业务后缀的树形结构 | `><simple` → `Result<TreeNode<Long, UserSimpleTreeVo>>` | 返回指定业务场景的树形数据 |
| 无`>`符号 | 空响应 | `无` → `Result<Void>` | 无返回数据的操作 |

#### 契约组合规则

1. **符号顺序**：各符号可以任意组合，顺序不限制，如：`#id@update>simple` 或 `@update#id>simple`
2. **业务后缀**：业务后缀采用驼峰命名法，会自动拼接到对应的VO类名中，`{领域名}{业务后缀}{类型}Vo`，如：`UserUpdateReqVo`、`UserSimpleRespVo`

#### 契约示例

```text
# 基础CRUD操作
User.POST..create.@.创建用户                    # @ → @RequestBody UserReqVo + Result<Void>
User.GET./{id}.get.%id>.获取用户                # %id + > → @PathVariable id + Result<UserRespVo>
User.PATCH./{id}.update.%id@update.更新用户       # %id + @update → @PathVariable id + @RequestBody UserUpdateReqVo + Result<Void>
User.DELETE./{id}.delete.%id.删除用户           # %id → @PathVariable id + Result<Void>

# 批量操作
User.DELETE..batchDelete.@#.批量删除用户        # @# → @RequestBody List<Long> ids + Result<Void>
User.DELETE..batchDeleteUsers.@#userIds.按用户ID批量删除  # @#userIds → @RequestBody List<Long> userIds + Result<Void>
User.POST..batchCreate.@=.批量创建用户          # @= → @RequestBody List<UserReqVo> reqVos + Result<Void>
User.POST../importByCodes.importByCodes.@$.按编码导入用户  # @$ → @RequestBody List<String> codes + Result<Void>
User.POST../importByOrgCodes.importByOrgCodes.@$orgCodes.按组织编码导入用户  # @$orgCodes → @RequestBody List<String> orgCodes + Result<Void>

# 查询操作
User.GET..list.?>=.获取用户列表                 # ? + >= → @ParameterObject UserQueryVo + Result<List<UserRespVo>>
User.GET..page.?>+.获取用户分页                 # ? + >+ → PageQueryVo + UserQueryVo + Result<Page<UserRespVo>>
User.GET..tree.?><.获取用户树                   # ? + >< → @ParameterObject UserQueryVo + Result<TreeNode<Long, UserTreeVo>>

# 复杂业务场景
User.GET./{id}/profile.getProfile.%id>profile.获取用户档案    # %id + >profile → @PathVariable id + Result<UserProfileRespVo>
User.POST../importByCodes.importByCodes.@$.按编码导入用户      # @$ → @RequestBody List<String> codes + Result<Void>
```

### 自动生成的 Swagger v3 参数说明注解

系统会为各种参数类型自动生成 OpenAPI 3.0 规范的参数说明注解，提供完整的 API 文档支持：

#### 路径参数（PathVariable）
- `%` → 自动生成数值路径参数的说明注解
- `%$` → 自动生成字符串路径参数的说明注解

```java
@Parameter(name = "id", description = "数值路径参数", in = ParameterIn.PATH, required = true, schema = @Schema(type = "integer", format = "int64"))
@Parameter(name = "code", description = "字符串路径参数", in = ParameterIn.PATH, required = true, schema = @Schema(type = "string"))
```

#### 查询参数（Query Parameters）
- `?$` → 自动生成字符串查询参数的说明注解
- `?#` → 自动生成数值查询参数的说明注解

```java
@Parameter(name = "keyword", description = "字符串查询参数", in = ParameterIn.QUERY, schema = @Schema(type = "string"))
@Parameter(name = "age", description = "数值查询参数", in = ParameterIn.QUERY, schema = @Schema(type = "integer", format = "int64"))
```

#### 请求体参数（RequestBody）
- `@#` → 自动生成数值列表的说明注解
- `@$` → 自动生成字符串列表的说明注解
- `@` → 自动生成单个对象的说明注解
- `@=` → 自动生成对象列表的说明注解

```java
@Parameter(description = "数值型ID列表", required = true, content = @Content(schema = @Schema(type = "array", implementation = Long.class)))
@Parameter(description = "字符串型编码列表", required = true, content = @Content(schema = @Schema(type = "array", implementation = String.class)))
@Parameter(description = "请求体对象", required = true, content = @Content(schema = @Schema(implementation = UserReqVo.class)))
```

#### 生成的完整示例

```java
@Operation(summary = "按关键字搜索用户")
@Parameters({
        @Parameter(name = "keyword", description = "字符串查询参数", in = ParameterIn.QUERY, schema = @Schema(type = "string"))
})
@GetMapping("/search")
public Result<List<UserRespVo>> search(@RequestParam("keyword") String keyword) {
    return Result.ok(userService.search(keyword));
}
```

注意：查询对象（如 `?` → `@ParameterObject UserQueryVo`）不会生成额外的 `@Parameter` 注解，因为 `@ParameterObject` 已经提供了足够的文档信息。

## Spring Boot 版本支持

Rest Code 支持 Spring Boot 2 和 Spring Boot 3 两个主要版本，在代码生成配置中可以选择目标版本。系统会自动适配不同版本间的差异：

### 版本差异对比

| 组件 | Spring Boot 2 | Spring Boot 3 |
|------|---------------|---------------|
| **@ParameterObject** | `org.springdoc.api.annotations.ParameterObject` | `org.springdoc.core.annotations.ParameterObject` |
| **@Resource** | `javax.annotation.Resource` | `jakarta.annotation.Resource` |
| **@Valid** | `javax.validation.Valid` | `jakarta.validation.Valid` |
| **serialVersionUID** | 普通字段声明 | 使用 `@Serial` 注解 |

### Spring Boot 2 示例

```java
import javax.annotation.Resource;
import javax.validation.Valid;
import org.springdoc.api.annotations.ParameterObject;

public class UserReqVo implements Serializable {
    /**
     * 使用JDK 1.0.2 中的 serialVersionUID 实现互操作性。
     */
    private static final long serialVersionUID = -3042686055658047285L;
}
```

### Spring Boot 3 示例

```java
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import java.io.Serial;

public class UserReqVo implements Serializable {
    /**
     * 使用JDK 1.0.2 中的 serialVersionUID 实现互操作性。
     */
    @Serial
    private static final long serialVersionUID = -3042686055658047285L;
}
```

### 配置说明

在代码生成配置中：
1. **Spring Boot版本**：选择 "Spring Boot 2" 或 "Spring Boot 3"
2. 系统会自动：
   - 使用对应版本的 import 语句
   - 为 Spring Boot 3 添加 `@Serial` 注解
   - 适配 javax 到 jakarta 的包名变更

**4. `>` - 响应类型（Response Type）**