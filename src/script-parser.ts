import { domainRegex, scriptRegex } from './utils/regex'
import { Domain, ApiMethod, Config } from './types'

function capitalize(str: string): string {
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
                    parameters: [],
                    responseType: '',
                    hasResponseType: false,
                    returnType: '',
                    methodBody: '',
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
    const tokens = contract.match(/[@?#$>][=+<]?([A-Za-z][A-Za-z0-9]*)?/g) || []

    const domainName = method.domainName
    const domainNameLower = domainName.charAt(0).toLowerCase() + domainName.slice(1)
    const parameterNames: string[] = []

    for (const token of tokens) {
        console.log("token: ", token)
        if (token.startsWith('@')) {
            // @RequestBody
            let typeName = `${domainName}ReqVo`
            let requestType = typeName
            let paramName = 'reqVo'
            if (token.startsWith('@=')) {
                requestType = `List<${typeName}>`
                paramName = 'reqVos'
                method.imports.add('java.util.List')
            }
            if (token.length > 1 && !['@', '@='].includes(token)) {
                const suffix = token.replace(/^@=?/, '')
                typeName = `${domainName}${capitalize(suffix)}ReqVo`
                requestType = typeName
                paramName = `${suffix}ReqVo`
                if (token.startsWith('@=')) {
                    requestType = `List<${typeName}>`
                    paramName = `${suffix}ReqVos`
                    method.imports.add('java.util.List')
                }
            }
            method.parameters.push(`@RequestBody @Valid ${requestType} ${paramName}`)
            parameterNames.push(paramName)
            method.imports.add('javax.validation.Valid')
            method.imports.add(`${config.basePackage}.model.req.${typeName}`)
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
            method.parameters.push(`${requestType} ${paramName}`)
            parameterNames.push(paramName)
            method.imports.add(`${config.basePackage}.model.req.${typeName}`)
        } else if (token.startsWith('#')) {
            // @PathVariable 数值型
            const paramName = token.substring(1) || 'id'
            method.parameters.push(`@PathVariable("${paramName}") long ${paramName}`)
            parameterNames.push(paramName)
            method.imports.add('org.springframework.web.bind.annotation.PathVariable')
        } else if (token.startsWith('$')) {
            // @PathVariable 字符串型
            const paramName = token.substring(1) || 'code'
            method.parameters.push(`@PathVariable("${paramName}") String ${paramName}`)
            parameterNames.push(paramName)
            method.imports.add('org.springframework.web.bind.annotation.PathVariable')
        } else if (token.startsWith('>')) {
            // 响应类型
            let typeName = `${domainName}RespVo`
            if (token === '>') {
                method.responseType = `Result<${typeName}>`
                method.hasResponseType = true
            } else if (token === '>=') {
                method.responseType = `Result<List<${typeName}>>`
                method.hasResponseType = true
                method.imports.add('java.util.List')
            } else if (token === '><') {
                typeName = `${domainName}TreeVo`
                method.responseType = `Result<TreeNode<Long, ${typeName}>>`
                method.hasResponseType = true
                method.imports.add(`${config.frameworkBasePackage}.common.utils.tree.TreeNode`)
            } else if (token === '>+') {
                method.parameters.unshift('PageQueryVo pageQueryVo')
                parameterNames.unshift('pageQueryVo')
                method.responseType = `Result<Page<${typeName}>>`
                method.hasResponseType = true
                method.imports.add(`${config.basePackage}.model.req.PageQueryVo`)
                method.imports.add('com.baomidou.mybatisplus.extension.plugins.pagination.Page')
            }
            method.imports.add(`${config.basePackage}.model.resp.${typeName}`)
        }
    }
    method.methodBody = `return Result.ok(${domainNameLower}Service.${method.operationName}(${parameterNames.join(', ')}));`

    if (!method.hasResponseType) {
        method.responseType = 'Result<Void>'
        method.methodBody = `${domainNameLower}Service.${method.operationName}(${parameterNames.join(', ')});
        return Result.ok();`
    }

    // 设置方法体

    // 设置 Service 方法的返回类型
    method.returnType = method.responseType.replace('Result<', '').replace('>', '')
    if (method.returnType === 'Void') {
        method.returnType = 'void'
    }

    // 添加常用的 imports
    method.imports.add(`${config.frameworkBasePackage}.model.Result`)
    method.imports.add(`${config.basePackage}.service.${domainName}Service`)
    method.imports.add('io.swagger.v3.oas.annotations.Operation')
    method.imports.add('io.swagger.v3.oas.annotations.tags.Tag')
    method.imports.add('org.springframework.web.bind.annotation.*')
    method.imports.add('javax.annotation.Resource')
}
