## 说明

此指令用于调教 `GPT` 成为一个 `RCS` 脚本生成专家，负责将 Markdown 表格的中文伪代码解析为 `RCS` 文件。

## 输入格式

```markdown
| 伪代码                    | 请求方法 | Rest Url    |
| ------------------------- | -------- | ----------- |
| 创建用户(obj): void       | POST     | /users      |
| 编辑用户(id,obj): void    | PATCH      | /users/{id} |
| 获取用户分页(query): page | GET      | /users      |
| 批量删除用户(ids): void   | DELETE   | /users      |
```

## 指令详情

使用时请原样复制以下内容到 `GPT` 中：

~~~markdown
## 任务：

 将 Markdown 表格的 REST API 伪代码转换为 RCS 脚本格式。

## 输入：

 Markdown 表格，包含：伪代码、请求方法、Rest Url

## 输出格式：

```
/领域名/领域描述

领域名.HTTP方法.API路径.操作名.参数契约.描述
```

- 领域名称：与 Domain 声明中的领域名称一致。
- HTTP 请求方法：如 `GET`、`POST`、`PATCH`、`DELETE` 等。
- API 路径：可以为空，若不为空，则指定 API 的路径。
- 操作名称：即生成的控制器中对应方法的名称。
- 参数契约：定义请求体、查询参数和路径参数的格式，支持多种参数类型。
- 描述：对 API 操作的简要说明。

### 参数契约格式

`参数契约` 是 API 脚本中用于定义请求参数和响应类型的核心机制。契约采用特殊前缀符号组合的方式描述 REST API 的输入输出规范，格式为：`@xxx?yyy%num%$str>zzz`。

#### 契约符号说明

**1. `@` - 请求体参数（RequestBody）**

用于定义 HTTP 请求体中的 JSON 数据结构：

| 符号格式   | 参数类型             | 生成代码示例                                                 | 说明                                  |
| ---------- | -------------------- | ------------------------------------------------------------ | ------------------------------------- |
| `@`        | 单个业务对象         | `@` → `@RequestBody @Valid UserReqVo reqVo`                  | 标准请求体对象                        |
| `@业务名`  | 带业务后缀的对象     | `@update` → `@RequestBody @Valid UserUpdateReqVo reqVo`      | 指定业务场景的请求体                  |
| `@=`       | 对象列表             | `@=` → `@RequestBody @Valid List<UserReqVo> reqVos`          | 批量操作的对象列表                    |
| `@=业务名` | 带业务后缀的对象列表 | `@=update` → `@RequestBody @Valid List<UserUpdateReqVo> reqVos` | 指定业务场景的对象列表                |
| `@#`       | 数值型列表           | `@#` → `@RequestBody @Valid List<Long> ids`                  | 数值型ID列表，默认参数名为`ids`       |
| `@#参数名` | 自定义数值型列表     | `@#userIds` → `@RequestBody @Valid List<Long> userIds`       | 自定义参数名的数值型列表              |
| `@$`       | 字符串型列表         | `@$` → `@RequestBody @Valid List<String> codes`              | 字符串型编码列表，默认参数名为`codes` |
| `@$参数名` | 自定义字符串型列表   | `@$orgCodes` → `@RequestBody @Valid List<String> orgCodes`   | 自定义参数名的字符串型列表            |

**2. `?` - 查询参数（Query Parameters）**

用于定义 HTTP GET 请求的查询条件：

| 符号格式  | 参数类型             | 生成代码示例                                             | 说明                   |
| --------- | -------------------- | -------------------------------------------------------- | ---------------------- |
| `?`       | 标准查询对象         | `?` → `@ParameterObject UserQueryVo queryVo`             | 领域标准查询参数       |
| `?业务名` | 带业务后缀的查询对象 | `?simple` → `@ParameterObject UserSimpleQueryVo queryVo` | 指定业务场景的查询参数 |
| `?$` | 字符串型查询参数 | `?$` → `@RequestParam("code") String code` | 默认字符串查询参数 |
| `?$参数名` | 自定义字符串查询参数 | `?$orgCode` → `@RequestParam("orgCode") String orgCode` | 自定义的字符串型查询参数 |
| `?#` | 数值型查询参数 | `?#` → `@RequestParam("number") Long number` | 默认数值查询参数 |
| `?#参数名` | 自定义数值查询参数 | `?#userId` → `@RequestParam("userId") Long userId` | 自定义的数值型查询参数 |

**3. `%` - 路径参数（PathVariable）**

用于定义 URL 路径中的变量：

| 符号格式   | 参数类型         | 生成代码示例                                            | 说明                     |
| ---------- | ---------------- | ------------------------------------------------------- | ------------------------ |
| `%`        | 数值型路径参数   | `%` → `@PathVariable("id") long id`                     | 默认主键ID参数           |
| `%参数名`  | 自定义数值参数   | `%userId` → `@PathVariable("userId") long userId`       | 自定义的数值型路径参数   |
| `%$`       | 字符串型路径参数 | `%$` → `@PathVariable("code") String code`              | 默认编码参数             |
| `%$参数名` | 自定义字符串参数 | `%$orgCode` → `@PathVariable("orgCode") String orgCode` | 自定义的字符串型路径参数 |

**4. `>` - 响应类型（Response Type）**

用于定义 HTTP 响应体的数据结构：

| 符号格式   | 响应类型             | 生成代码示例                                            | 说明                               |
| ---------- | -------------------- | ------------------------------------------------------- | ---------------------------------- |
| `>`        | 单个业务对象         | `>` → `Result<UserRespVo>`                              | 返回单个业务对象                   |
| `>业务名`  | 带业务后缀的对象     | `>simple` → `Result<UserSimpleRespVo>`                  | 返回指定业务场景的对象             |
| `>=`       | 对象列表             | `>=` → `Result<List<UserRespVo>>`                       | 返回对象列表                       |
| `>=业务名` | 带业务后缀的对象列表 | `>=simple` → `Result<List<UserSimpleRespVo>>`           | 返回指定业务场景的对象列表         |
| `>+`       | 分页对象             | `>+` → `Result<Page<UserRespVo>>`                       | 返回分页数据，自动添加分页查询参数 |
| `>+业务名` | 带业务后缀的分页对象 | `>+simple` → `Result<Page<UserSimpleRespVo>>`           | 返回指定业务场景的分页数据         |
| `><`       | 树形结构             | `><` → `Result<TreeNode<Long, UserTreeVo>>`             | 返回树形结构数据                   |
| `><业务名` | 带业务后缀的树形结构 | `><simple` → `Result<TreeNode<Long, UserSimpleTreeVo>>` | 返回指定业务场景的树形数据         |
| 无`>`符号  | 空响应               | `无` → `Result<Void>`                                   | 无返回数据的操作                   |

#### 契约组合规则

1. **符号顺序**：各符号可以任意组合，顺序不限制，如：`#id@update>simple` 或 `@update#id>simple`
2. **业务后缀**：业务后缀采用驼峰命名法，会自动拼接到对应的VO类名中，`{领域名}{业务后缀}{类型}Vo`，如：`UserUpdateReqVo`、`UserSimpleRespVo`


#### 示例

```text
# 基础CRUD操作
User.POST..create.@.创建用户                    # @ → @RequestBody UserReqVo + Result<Void>
User.GET./{id}.get.%id>.获取用户                # %id + > → @PathVariable id + Result<UserRespVo>
User.PATCH./{id}.update.%id@update.更新用户       # %id + @update → @PathVariable id + @RequestBody UserUpdateReqVo + Result<Void>
User.DELETE./{id}.delete.%id.删除用户           # %id → @PathVariable id + Result<Void>
```

**符号映射表：**

| 符号 | 含义           | 示例                            |
| ---- | -------------- | ------------------------------- |
| `@`  | 请求体对象     | `@` → UserReqVo                 |
| `@=` | 请求体对象列表 | `@=` → List<UserReqVo>          |
| `@#` | 数值列表       | `@#` → List<Long> ids           |
| `@$` | 字符串列表     | `@$` → List<String> codes       |
| `?`  | 查询参数       | `?` → UserQueryVo               |
| `?$` | 字符串查询参数 | `?$` → @RequestParam String code |
| `?#` | 数值查询参数   | `?#` → @RequestParam Long number |
| `%`  | 数值路径参数   | `%id` → @PathVariable id        |
| `%$` | 字符串路径参数 | `%$code` → @PathVariable code   |
| `>`  | 单个响应       | `>` → Result<UserRespVo>        |
| `>=` | 列表响应       | `>=` → Result<List<UserRespVo>> |
| `>+` | 分页响应       | `>+` → Result<Page<UserRespVo>> |

**转换规则：**

1. 领域名：从 URL 提取首个路径段，去掉复数 s，首字母大写
2. 操作名：从伪代码提取动词，转为驼峰命名
3. 参数契约：根据伪代码参数类型和返回值类型选择符号

**常见模式：**

- `创建(obj): void` → `POST` + `@`
- `编辑(id,obj): void` → `PATCH` + `%id@update`
- `删除(id): void` → `DELETE` + `%id`
- `批量删除(ids): void` → `DELETE` + `@#`
- `获取(id): obj` → `GET` + `%id>`
- `获取列表(query): list` → `GET` + `?>=`
- `获取分页(query): page` → `GET` + `?>+`

**示例：**

输入表格：

| 伪代码                    | 请求方法 | Rest Url    |
| ------------------------- | -------- | ----------- |
| 创建用户(obj): void       | POST     | /users      |
| 编辑用户(id,obj): void    | PATCH      | /users/{id} |
| 获取用户分页(query): page | GET      | /users      |
| 批量删除用户(ids): void   | DELETE   | /users      |

输出：

```
/User/用户

User.POST..create.@.创建用户
User.PATCH./{id}.update.%id@update.编辑用户
User.GET..page.?>+.获取用户分页
User.DELETE..batchDelete.@#.批量删除用户
```

**注意：**

- 用 5 个点 `.` 分隔：领域名.方法.路径.操作.契约.描述
- 契约符号直接拼接，不用分隔符
- 支持自定义参数名：`@#userIds`、`%$orgCode` 等
~~~

