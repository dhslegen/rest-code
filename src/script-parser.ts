import { domainRegex, scriptRegex } from "./utils/regex";
import { Domain, ApiMethod, Config } from "./types";

function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 标量类型映射：符号 → Java 类型 + 可选 import
 */
const SCALAR_TYPES: Record<string, { javaType: string; import?: string }> = {
  "#": { javaType: "Long" },
  $: { javaType: "String" },
  "!": { javaType: "Boolean" },
  "~": { javaType: "BigDecimal", import: "java.math.BigDecimal" },
};

/**
 * 根据Spring Boot版本获取正确的import语句
 */
function getVersionSpecificImport(config: Config, importType: string): string {
  const isSpringBoot3 = config.springBootVersion === "3";

  switch (importType) {
    case "ParameterObject":
      return isSpringBoot3
        ? "org.springdoc.core.annotations.ParameterObject"
        : "org.springdoc.api.annotations.ParameterObject";
    case "Resource":
      return isSpringBoot3
        ? "jakarta.annotation.Resource"
        : "javax.annotation.Resource";
    case "Valid":
      return isSpringBoot3
        ? "jakarta.validation.Valid"
        : "javax.validation.Valid";
    default:
      return importType;
  }
}

export function parseScript(
  config: Config,
  content: string,
): { domains: Domain[]; apiMethods: ApiMethod[] } {
  const lines = content.split("\n");

  const domains: Domain[] = [];
  const apiMethods: ApiMethod[] = [];

  for (let line of lines) {
    // 跳过空行
    if (line.trim() === "") continue;

    // 跳过以 # 开头的注释行
    if (line.trim().startsWith("#")) continue;

    // 处理行尾注释，寻找前面有空格的 # 作为注释开始
    // 注释符号必须前面有空格或tab，以避免误截取参数契约中的 # 符号
    const commentMatch = line.match(/\s+#/);
    if (commentMatch && commentMatch.index !== undefined) {
      line = line.substring(0, commentMatch.index).trim();
      // 如果去掉注释后变成空行，则跳过
      if (line === "") continue;
    }

    if (line.startsWith("/")) {
      const match = line.match(domainRegex);
      if (match) {
        const domain: Domain = {
          name: match[1],
          description: match[2],
        };
        domains.push(domain);
      } else {
        throw new Error(`领域声明格式错误：${line}`);
      }
    } else {
      const match = line.match(scriptRegex);
      if (match) {
        const method: ApiMethod = {
          domainName: match[1],
          httpMethod: match[2],
          apiPath: match[3] || "",
          operationName: match[4],
          parameterContract: match[5],
          description: match[6],
          apiNote: `${match[4]}.${match[5]}`,
          imports: new Set(),
          importsService: new Set(),
          importsServiceImpl: new Set(),
          parameters: [],
          parametersPure: [],
          parameterNames: [],
          responseType: "",
          hasResponseType: false,
          returnType: "",
          voNames: [],
          methodBody: "",
          methodBodyServiceImpl: "",
          parameterAnnotations: [],
        };
        // 解析参数契约
        parseParameterContract(config, method);
        apiMethods.push(method);
      } else {
        throw new Error(`API脚本格式错误：${line}`);
      }
    }
  }

  return { domains, apiMethods };
}

function parseParameterContract(config: Config, method: ApiMethod) {
  const contract = method.parameterContract;
  const tokens =
    contract.match(/[@?%>](?:=[#$!~]|[=+<#$!~*])?([A-Za-z][A-Za-z0-9]*)?/g) ||
    [];

  const domainName = method.domainName;
  const domainNameLower =
    domainName.charAt(0).toLowerCase() + domainName.slice(1);

  // 初始化参数注解数组
  method.parameterAnnotations = [];

  for (const token of tokens) {
    console.log("token: ", token);
    if (token.startsWith("@")) {
      // @RequestBody
      const scalarListMatch = token.match(
        /^@=([#$!~])([A-Za-z][A-Za-z0-9]*)?$/,
      );
      const singleScalarMatch = token.match(
        /^@([#$!~])([A-Za-z][A-Za-z0-9]*)?$/,
      );
      const requestBodyMatch = token.match(/^@([=]?)([A-Za-z][A-Za-z0-9]*)?$/);

      if (scalarListMatch) {
        // '@=#' '@=$' '@=!' '@=~' — List<标量> RequestBody
        const typeChar = scalarListMatch[1];
        const scalar = SCALAR_TYPES[typeChar];
        const listDefaults: Record<string, string> = {
          "#": "ids",
          $: "codes",
          "!": "flags",
          "~": "amounts",
        };
        const paramName = scalarListMatch[2] || listDefaults[typeChar];
        const requestType = `List<${scalar.javaType}>`;
        method.parameters.push(
          `@RequestBody @Valid ${requestType} ${paramName}`,
        );
        method.parametersPure.push(`${requestType} ${paramName}`);
        method.parameterNames.push(paramName);
        method.imports.add(
          "org.springframework.web.bind.annotation.RequestBody",
        );
        method.imports.add(getVersionSpecificImport(config, "Valid"));
        method.imports.add("java.util.List");
        method.importsService.add("java.util.List");
        if (scalar.import) {
          method.imports.add(scalar.import);
          method.importsService.add(scalar.import);
        }
      } else if (singleScalarMatch) {
        // '@#' '@$' '@!' '@~' — 单标量 RequestBody
        const typeChar = singleScalarMatch[1];
        const scalar = SCALAR_TYPES[typeChar];
        const singleDefaults: Record<string, string> = {
          "#": "id",
          $: "code",
          "!": "value",
          "~": "value",
        };
        const paramName = singleScalarMatch[2] || singleDefaults[typeChar];
        method.parameters.push(`@RequestBody ${scalar.javaType} ${paramName}`);
        method.parametersPure.push(`${scalar.javaType} ${paramName}`);
        method.parameterNames.push(paramName);
        method.imports.add(
          "org.springframework.web.bind.annotation.RequestBody",
        );
        if (scalar.import) {
          method.imports.add(scalar.import);
          method.importsService.add(scalar.import);
        }
      } else if (requestBodyMatch) {
        // '@' '@=' — VO / List<VO> RequestBody（不变）
        const operator = requestBodyMatch[1];
        const suffix = requestBodyMatch[2] || "";

        let typeName = `${method.domainName}${capitalize(suffix)}ReqVo`;
        let requestType = typeName;
        let paramName = "reqVo";
        if (operator === "=") {
          requestType = `List<${typeName}>`;
          paramName = "reqVos";
          method.imports.add("java.util.List");
          method.importsService.add("java.util.List");
        }
        method.parameters.push(
          `@RequestBody @Valid ${requestType} ${paramName}`,
        );
        method.parametersPure.push(`${requestType} ${paramName}`);
        method.parameterNames.push(paramName);
        method.imports.add(
          "org.springframework.web.bind.annotation.RequestBody",
        );
        method.imports.add(getVersionSpecificImport(config, "Valid"));
        method.voNames.push(typeName);
        method.imports.add(`${config.basePackage}.model.vo.req.${typeName}`);
        method.importsService.add(
          `${config.basePackage}.model.vo.req.${typeName}`,
        );
      }
    } else if (token.startsWith("?")) {
      // Query 参数
      const queryScalarListMatch = token.match(
        /^\?=([#$!~])([A-Za-z][A-Za-z0-9]*)?$/,
      );
      const queryScalarMatch = token.match(
        /^\?([#$!~])([A-Za-z][A-Za-z0-9]*)?$/,
      );
      const queryFileMatch = token.match(/^\?\*([A-Za-z][A-Za-z0-9]*)?$/);

      if (queryScalarListMatch) {
        // '?=#' '?=$' '?=!' '?=~' — List<标量> 查询参数
        const typeChar = queryScalarListMatch[1];
        const scalar = SCALAR_TYPES[typeChar];
        const listDefaults: Record<string, string> = {
          "#": "ids",
          $: "codes",
          "!": "flags",
          "~": "amounts",
        };
        const paramName = queryScalarListMatch[2] || listDefaults[typeChar];
        const paramType = `List<${scalar.javaType}>`;
        method.parameters.push(
          `@RequestParam("${paramName}") ${paramType} ${paramName}`,
        );
        method.parametersPure.push(`${paramType} ${paramName}`);
        method.parameterNames.push(paramName);
        method.parameterAnnotations.push(
          `@Parameter(name = "${paramName}", description = "${scalar.javaType}数组查询参数", in = ParameterIn.QUERY)`,
        );
        method.imports.add(
          "org.springframework.web.bind.annotation.RequestParam",
        );
        method.imports.add("java.util.List");
        method.imports.add("io.swagger.v3.oas.annotations.Parameter");
        method.imports.add("io.swagger.v3.oas.annotations.enums.ParameterIn");
        method.importsService.add("java.util.List");
        if (scalar.import) {
          method.imports.add(scalar.import);
          method.importsService.add(scalar.import);
        }
      } else if (queryScalarMatch) {
        // '?#' '?$' '?!' '?~' — 标量查询参数
        const typeChar = queryScalarMatch[1];
        const scalar = SCALAR_TYPES[typeChar];
        const singleDefaults: Record<string, string> = {
          "#": "number",
          $: "code",
          "!": "flag",
          "~": "amount",
        };
        const paramName = queryScalarMatch[2] || singleDefaults[typeChar];
        const schemaMap: Record<string, string> = {
          "#": 'schema = @Schema(type = "integer", format = "int64")',
          $: 'schema = @Schema(type = "string")',
          "!": 'schema = @Schema(type = "boolean")',
          "~": 'schema = @Schema(type = "number")',
        };
        const descMap: Record<string, string> = {
          "#": "数值查询参数",
          $: "字符串查询参数",
          "!": "布尔查询参数",
          "~": "数值(BigDecimal)查询参数",
        };
        method.parameters.push(
          `@RequestParam("${paramName}") ${scalar.javaType} ${paramName}`,
        );
        method.parametersPure.push(`${scalar.javaType} ${paramName}`);
        method.parameterNames.push(paramName);
        method.parameterAnnotations.push(
          `@Parameter(name = "${paramName}", description = "${descMap[typeChar]}", in = ParameterIn.QUERY, ${schemaMap[typeChar]})`,
        );
        method.imports.add(
          "org.springframework.web.bind.annotation.RequestParam",
        );
        method.imports.add("io.swagger.v3.oas.annotations.Parameter");
        method.imports.add("io.swagger.v3.oas.annotations.enums.ParameterIn");
        method.imports.add("io.swagger.v3.oas.annotations.media.Schema");
        if (scalar.import) {
          method.imports.add(scalar.import);
          method.importsService.add(scalar.import);
        }
      } else if (queryFileMatch) {
        // '?*' — MultipartFile 查询参数（不变）
        const paramName = queryFileMatch[1] || "file";
        method.parameters.push(
          `@RequestParam("${paramName}") MultipartFile ${paramName}`,
        );
        method.parametersPure.push(`MultipartFile ${paramName}`);
        method.parameterNames.push(paramName);
        method.parameterAnnotations.push(
          `@Parameter(name = "${paramName}", description = "文件型查询参数", in = ParameterIn.QUERY, schema = @Schema(type = "string", format = "binary"))`,
        );
        method.imports.add(
          "org.springframework.web.bind.annotation.RequestParam",
        );
        method.imports.add("org.springframework.web.multipart.MultipartFile");
        method.imports.add("io.swagger.v3.oas.annotations.Parameter");
        method.imports.add("io.swagger.v3.oas.annotations.enums.ParameterIn");
        method.imports.add("io.swagger.v3.oas.annotations.media.Schema");
        method.importsService.add(
          "org.springframework.web.multipart.MultipartFile",
        );
      } else {
        // '?' '?suffix' — QueryVo 查询对象（不变）
        let typeName = `${domainName}QueryVo`;
        if (token.length > 1) {
          const suffix = token.substring(1);
          typeName = `${domainName}${capitalize(suffix)}QueryVo`;
        }
        const paramName = "queryVo";
        method.parameters.push(`@ParameterObject ${typeName} ${paramName}`);
        method.parametersPure.push(`${typeName} ${paramName}`);
        method.parameterNames.push(paramName);
        method.parameterAnnotations.push("");
        method.voNames.push(typeName);
        method.imports.add(`${config.basePackage}.model.vo.req.${typeName}`);
        method.importsService.add(
          `${config.basePackage}.model.vo.req.${typeName}`,
        );
        method.imports.add(getVersionSpecificImport(config, "ParameterObject"));
      }
    } else if (token.startsWith("%")) {
      // @PathVariable 路径参数
      if (token.startsWith("%$")) {
        // %$ - @PathVariable 字符串型
        const paramName = token.substring(2) || "code";
        method.parameters.push(
          `@PathVariable String ${paramName}`,
        );
        method.parametersPure.push(`String ${paramName}`);
        method.parameterNames.push(paramName);

        // 添加路径参数说明注解
        method.parameterAnnotations.push(
          `@Parameter(name = "${paramName}", description = "字符串路径参数", in = ParameterIn.PATH, required = true, schema = @Schema(type = "string"))`,
        );

        method.imports.add(
          "org.springframework.web.bind.annotation.PathVariable",
        );
        method.imports.add("io.swagger.v3.oas.annotations.Parameter");
        method.imports.add("io.swagger.v3.oas.annotations.enums.ParameterIn");
        method.imports.add("io.swagger.v3.oas.annotations.media.Schema");
      } else {
        // % - @PathVariable 数值型
        const paramName = token.substring(1) || "id";
        method.parameters.push(
          `@PathVariable long ${paramName}`,
        );
        method.parametersPure.push(`long ${paramName}`);
        method.parameterNames.push(paramName);

        // 添加路径参数说明注解
        method.parameterAnnotations.push(
          `@Parameter(name = "${paramName}", description = "数值路径参数", in = ParameterIn.PATH, required = true, schema = @Schema(type = "integer", format = "int64"))`,
        );

        method.imports.add(
          "org.springframework.web.bind.annotation.PathVariable",
        );
        method.imports.add("io.swagger.v3.oas.annotations.Parameter");
        method.imports.add("io.swagger.v3.oas.annotations.enums.ParameterIn");
        method.imports.add("io.swagger.v3.oas.annotations.media.Schema");
      }
    } else if (token.startsWith(">")) {
      // 响应类型
      const respScalarListMatch = token.match(/^>=([#$!~])$/);
      const respScalarMatch = token.match(/^>([#$!~])$/);
      const responseMatch = token.match(/^>([=+<]?)([A-Za-z][A-Za-z0-9]*)?$/);

      if (respScalarListMatch) {
        // '>=#' '>=$' '>=!' '>=~' — Result<List<标量>>
        const typeChar = respScalarListMatch[1];
        const scalar = SCALAR_TYPES[typeChar];
        method.responseType = `Result<List<${scalar.javaType}>>`;
        method.hasResponseType = true;
        method.imports.add("java.util.List");
        method.importsService.add("java.util.List");
        if (scalar.import) {
          method.imports.add(scalar.import);
          method.importsService.add(scalar.import);
        }
      } else if (respScalarMatch) {
        // '>#' '>$' '>!' '>~' — Result<标量>
        const typeChar = respScalarMatch[1];
        const scalar = SCALAR_TYPES[typeChar];
        method.responseType = `Result<${scalar.javaType}>`;
        method.hasResponseType = true;
        if (scalar.import) {
          method.imports.add(scalar.import);
          method.importsService.add(scalar.import);
        }
      } else if (responseMatch) {
        // '>' '>=' '>+' '><' — VO 响应类型（不变）
        const operator = responseMatch[1];
        const suffix = responseMatch[2] || "";

        let typeName = `${method.domainName}${capitalize(suffix)}RespVo`;

        if (operator === "") {
          method.responseType = `Result<${typeName}>`;
          method.hasResponseType = true;
        } else if (operator === "=") {
          method.responseType = `Result<List<${typeName}>>`;
          method.hasResponseType = true;
          method.imports.add("java.util.List");
          method.importsService.add("java.util.List");
        } else if (operator === "+") {
          method.parameters.unshift("@ParameterObject PageQueryVo pageQueryVo");
          method.parametersPure.unshift("PageQueryVo pageQueryVo");
          method.parameterNames.unshift("pageQueryVo");
          method.parameterAnnotations.unshift("");
          method.responseType = `Result<Page<${typeName}>>`;
          method.hasResponseType = true;
          method.imports.add(`${config.basePackage}.model.vo.req.PageQueryVo`);
          method.imports.add(
            "com.baomidou.mybatisplus.extension.plugins.pagination.Page",
          );
          method.importsService.add(
            `${config.basePackage}.model.vo.req.PageQueryVo`,
          );
          method.importsService.add(
            "com.baomidou.mybatisplus.extension.plugins.pagination.Page",
          );
          method.imports.add(
            getVersionSpecificImport(config, "ParameterObject"),
          );
        } else if (operator === "<") {
          typeName = `${method.domainName}${capitalize(suffix)}TreeVo`;
          method.responseType = `Result<TreeNode<Long, ${typeName}>>`;
          method.hasResponseType = true;
          if (config.frameworkBasePackage) {
            method.imports.add(
              `${config.frameworkBasePackage}.common.utils.tree.TreeNode`,
            );
            method.importsService.add(
              `${config.frameworkBasePackage}.common.utils.tree.TreeNode`,
            );
          } else {
            method.imports.add(`${config.basePackage}.core.tree.TreeNode`);
            method.importsService.add(
              `${config.basePackage}.core.tree.TreeNode`,
            );
          }
        }

        method.voNames.push(typeName);
        method.imports.add(`${config.basePackage}.model.vo.resp.${typeName}`);
        method.importsService.add(
          `${config.basePackage}.model.vo.resp.${typeName}`,
        );
      }
    }
  }
  // 设置方法体
  method.methodBody = `return Result.ok(${domainNameLower}AppService.${method.operationName}(${method.parameterNames.join(", ")}));`;
  method.methodBodyServiceImpl = `return null;`;

  if (!method.hasResponseType) {
    method.responseType = "Result<Void>";
    method.methodBody = `${domainNameLower}AppService.${method.operationName}(${method.parameterNames.join(", ")});
        return Result.ok();`;
    method.methodBodyServiceImpl = "";
  }

  // 设置 Service 方法的返回类型：剥离最外层 Result<...> 包装
  if (
    method.responseType.startsWith("Result<") &&
    method.responseType.endsWith(">")
  ) {
    method.returnType = method.responseType.slice(7, -1);
  } else {
    method.returnType = method.responseType;
  }
  if (method.returnType === "Void") {
    method.returnType = "void";
  }

  // 添加 Controller 常用的 imports
  if (config.frameworkBasePackage) {
    method.imports.add(`${config.frameworkBasePackage}.common.model.Result`);
  } else {
    method.imports.add(`${config.basePackage}.core.Result`);
  }
  method.imports.add(`${config.basePackage}.service.${domainName}AppService`);
  method.imports.add("io.swagger.v3.oas.annotations.Operation");
  method.imports.add("io.swagger.v3.oas.annotations.tags.Tag");
  method.imports.add("org.springframework.web.bind.annotation.*");
  method.imports.add(getVersionSpecificImport(config, "Resource"));

  // 添加 ServiceImpl 常用的 imports，包括 Service 的 imports，以及 @Service 注解
  method.importsService.forEach((importItem) => {
    method.importsServiceImpl.add(importItem);
  });
  method.importsServiceImpl.add(
    `${config.basePackage}.service.${domainName}AppService`,
  );
  method.importsServiceImpl.add("org.springframework.stereotype.Service");
}
