import { domainRegex, scriptRegex } from './utils/regex'
import { Domain, ApiMethod, Config } from './types'

function capitalize(str: string): string {
    if (str.length === 0) return str
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function parseScript(config: Config, content: string): { domains: Domain[]; apiMethods: ApiMethod[] } {
    const lines = content.split('\n')

    const domains: Domain[] = []
    const apiMethods: ApiMethod[] = []

    for (const line of lines) {
        if (line.trim() === '') continue
        if (line.startsWith('/')) {
            const match = line.match(domainRegex)
            if (match) {
                const domain: Domain = {
                    name: match[1],
                    description: match[2],
                }
                domains.push(domain)
            } else {
                throw new Error(`领域声明格式错误：${line}`)
            }
        } else {
            const match = line.match(scriptRegex)
            if (match) {
                const method: ApiMethod = {
                    domainName: match[1],
                    httpMethod: match[2],
                    apiPath: match[3] || '',
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
                    responseType: '',
                    hasResponseType: false,
                    returnType: '',
                    voNames: [],
                    methodBody: '',
                    methodBodyServiceImpl: '',
                }
                // 解析参数契约
                parseParameterContract(config, method)
                apiMethods.push(method)
            } else {
                throw new Error(`API脚本格式错误：${line}`)
            }
        }
    }

    return { domains, apiMethods }
}

function parseParameterContract(config: Config, method: ApiMethod) {
    const contract = method.parameterContract
    const tokens = contract.match(/[@?%>][=+<#$]?([A-Za-z][A-Za-z0-9]*)?/g) || []

    const domainName = method.domainName
    const domainNameLower = domainName.charAt(0).toLowerCase() + domainName.slice(1)

    for (const token of tokens) {
        console.log("token: ", token)
        if (token.startsWith('@')) {
            // @RequestBody
            const requestBodyMatch = token.match(/^@([=]?)([A-Za-z][A-Za-z0-9]*)?$/)
            const simpleLongListMatch = token.match(/^@#([A-Za-z][A-Za-z0-9]*)?$/)
            const simpleStringListMatch = token.match(/^@\$([A-Za-z][A-Za-z0-9]*)?$/)

            if (simpleLongListMatch) {
                // '@#' 或 '@#参数名' - List<Long> 类型的 RequestBody
                const requestType = 'List<Long>'
                const paramName = simpleLongListMatch[1] || 'ids'  // 支持自定义参数名，默认为 ids
                method.parameters.push(`@RequestBody @Valid ${requestType} ${paramName}`)
                method.parametersPure.push(`${requestType} ${paramName}`)
                method.parameterNames.push(paramName)

                method.imports.add('org.springframework.web.bind.annotation.RequestBody')
                method.imports.add('javax.validation.Valid')
                method.imports.add('java.util.List')
                method.importsService.add('java.util.List')
            } else if (simpleStringListMatch) {
                // '@$' 或 '@$参数名' - List<String> 类型的 RequestBody
                const requestType = 'List<String>'
                const paramName = simpleStringListMatch[1] || 'codes'  // 支持自定义参数名，默认为 codes
                method.parameters.push(`@RequestBody @Valid ${requestType} ${paramName}`)
                method.parametersPure.push(`${requestType} ${paramName}`)
                method.parameterNames.push(paramName)

                method.imports.add('org.springframework.web.bind.annotation.RequestBody')
                method.imports.add('javax.validation.Valid')
                method.imports.add('java.util.List')
                method.importsService.add('java.util.List')
            } else if (requestBodyMatch) {
                const operator = requestBodyMatch[1] // 可能是 '=' 或空字符串
                const suffix = requestBodyMatch[2] || '' // 业务后缀，可能为空

                let typeName = `${method.domainName}${capitalize(suffix)}ReqVo`
                let requestType = typeName
                let paramName = 'reqVo'
                if (operator === '=') {
                    // '@='
                    requestType = `List<${typeName}>`
                    paramName = 'reqVos'
                    method.imports.add('java.util.List')
                    method.importsService.add('java.util.List')
                }
                method.parameters.push(`@RequestBody @Valid ${requestType} ${paramName}`)
                method.parametersPure.push(`${requestType} ${paramName}`)
                method.parameterNames.push(paramName)

                method.imports.add('org.springframework.web.bind.annotation.RequestBody')
                method.imports.add('javax.validation.Valid')

                method.voNames.push(typeName)
                method.imports.add(`${config.basePackage}.model.vo.req.${typeName}`)
                method.importsService.add(`${config.basePackage}.model.vo.req.${typeName}`)
            }
        } else if (token.startsWith('?')) {
            // Query 参数
            let typeName = `${domainName}QueryVo`
            let requestType = typeName
            if (token.length > 1) {
                const suffix = token.substring(1)
                typeName = `${domainName}${capitalize(suffix)}QueryVo`
                requestType = typeName
            }
            const paramName = 'queryVo'
            method.parameters.push(`@ParameterObject ${requestType} ${paramName}`)
            method.parametersPure.push(`${requestType} ${paramName}`)
            method.parameterNames.push(paramName)

            method.voNames.push(typeName)
            method.imports.add(`${config.basePackage}.model.vo.req.${typeName}`)
            method.importsService.add(`${config.basePackage}.model.vo.req.${typeName}`)
            method.imports.add('org.springdoc.api.annotations.ParameterObject')
        } else if (token.startsWith('%')) {
            // @PathVariable 路径参数
            if (token.startsWith('%$')) {
                // %$ - @PathVariable 字符串型
                const paramName = token.substring(2) || 'code'
                method.parameters.push(`@PathVariable("${paramName}") String ${paramName}`)
                method.parametersPure.push(`String ${paramName}`)
                method.parameterNames.push(paramName)
                method.imports.add('org.springframework.web.bind.annotation.PathVariable')
            } else {
                // % - @PathVariable 数值型
                const paramName = token.substring(1) || 'id'
                method.parameters.push(`@PathVariable("${paramName}") long ${paramName}`)
                method.parametersPure.push(`long ${paramName}`)
                method.parameterNames.push(paramName)
                method.imports.add('org.springframework.web.bind.annotation.PathVariable')
            }
        } else if (token.startsWith('>')) {
            // 响应类型，考虑业务后缀
            const responseMatch = token.match(/^>([=+<]?)([A-Za-z][A-Za-z0-9]*)?$/)
            if (responseMatch) {
                const operator = responseMatch[1] // 可能是 '=', '+', '<' 或空字符串
                const suffix = responseMatch[2] || '' // 业务后缀，可能为空

                let typeName = `${method.domainName}${capitalize(suffix)}RespVo`

                if (operator === '') {
                    // '>'
                    method.responseType = `Result<${typeName}>`
                    method.hasResponseType = true
                } else if (operator === '=') {
                    // '>='
                    method.responseType = `Result<List<${typeName}>>`
                    method.hasResponseType = true
                    method.imports.add('java.util.List')
                    method.importsService.add('java.util.List')
                } else if (operator === '+') {
                    // '>+'
                    method.parameters.unshift('@ParameterObject PageQueryVo pageQueryVo')
                    method.parametersPure.unshift('PageQueryVo pageQueryVo')
                    method.parameterNames.unshift('pageQueryVo')
                    method.responseType = `Result<Page<${typeName}>>`
                    method.hasResponseType = true
                    method.imports.add(`${config.basePackage}.model.vo.req.PageQueryVo`)
                    method.imports.add('com.baomidou.mybatisplus.extension.plugins.pagination.Page')
                    method.importsService.add(`${config.basePackage}.model.vo.req.PageQueryVo`)
                    method.importsService.add('com.baomidou.mybatisplus.extension.plugins.pagination.Page')
                    method.imports.add('org.springdoc.api.annotations.ParameterObject')
                } else if (operator === '<') {
                    // '><'
                    typeName = `${method.domainName}${capitalize(suffix)}TreeVo`
                    method.responseType = `Result<TreeNode<Long, ${typeName}>>`
                    method.hasResponseType = true
                    method.imports.add(`${config.frameworkBasePackage}.common.utils.tree.TreeNode`)
                    method.importsService.add(`${config.frameworkBasePackage}.common.utils.tree.TreeNode`)
                }

                method.voNames.push(typeName)
                method.imports.add(`${config.basePackage}.model.vo.resp.${typeName}`)
                method.importsService.add(`${config.basePackage}.model.vo.resp.${typeName}`)
            }
        }
    }
    // 设置方法体
    method.methodBody = `return Result.ok(${domainNameLower}Service.${method.operationName}(${method.parameterNames.join(', ')}));`
    method.methodBodyServiceImpl = `return null;`

    if (!method.hasResponseType) {
        method.responseType = 'Result<Void>'
        method.methodBody = `${domainNameLower}Service.${method.operationName}(${method.parameterNames.join(', ')});
        return Result.ok();`
        method.methodBodyServiceImpl = '';
    }

    // 设置 Service 方法的返回类型
    method.returnType = method.responseType.replace('Result<', '').replace('>', '')
    if (method.returnType === 'Void') {
        method.returnType = 'void'
    }

    // 添加 Controller 常用的 imports
    method.imports.add(`${config.frameworkBasePackage}.common.model.Result`)
    method.imports.add(`${config.basePackage}.service.${domainName}Service`)
    method.imports.add('io.swagger.v3.oas.annotations.Operation')
    method.imports.add('io.swagger.v3.oas.annotations.tags.Tag')
    method.imports.add('org.springframework.web.bind.annotation.*')
    method.imports.add('javax.annotation.Resource')

    // 添加 ServiceImpl 常用的 imports，包括 Service 的 imports，以及 @Service 注解
    method.importsService.forEach((importItem) => {
        method.importsServiceImpl.add(importItem);
    });
    method.importsServiceImpl.add(`${config.basePackage}.service.${domainName}Service`)
    method.importsServiceImpl.add('org.springframework.stereotype.Service')
}
