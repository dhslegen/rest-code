import * as path from 'path'
import * as fs from 'fs'
import { parseScript } from './script-parser'
import { getControllerTemplate } from './templates'
import Mustache from 'mustache'
import { Domain, ApiMethod, Config } from './types'




export async function generateJavaCode(config: Config, rasContent: string) {
    // 1. 解析脚本，得到领域和方法信息
    const { domains, apiMethods } = parseScript(config, rasContent)

    // 2. 为每个领域生成代码
    for (const domain of domains) {
        // 生成 Controller
        await generateController(domain, apiMethods, config)
        // 生成 Service 接口和实现
        await generateService(domain, apiMethods, config)
        // 生成 VO 类
        await generateVoClasses(domain, apiMethods, config)
    }
}

async function generateController(domain: Domain, apiMethods: ApiMethod[], config: Config) {
    const className = `${domain.name}Controller`
    const packageName = `${config.basePackage}.controller`
    const filePath = path.join(config.outputPath, ...packageName.split('.'), `${className}.java`)
    const domainLower = domain.name.charAt(0).toLowerCase() + domain.name.slice(1)

    let existingApiNotes: Set<string> = new Set()

    if (config.mode === 'incremental' && fs.existsSync(filePath)) {
        // 读取已有的 Controller，提取 @apiNote 标记
        const existingContent = fs.readFileSync(filePath, 'utf-8')
        existingApiNotes = extractApiNotes(existingContent)
    }

    // 过滤需要新增的方法
    const methodsToAdd = apiMethods.filter(method => method.domainName === domain.name && !existingApiNotes.has(method.apiNote))

    if (methodsToAdd.length === 0) {
        // 无需新增方法
        return
    }

    // 准备渲染数据
    const data = {
        basePackage: config.basePackage,
        frameworkPackagePrefix: config.frameworkPackagePrefix,
        domainName: domain.name,
        domainLower: domainLower,
        description: domain.description,
        imports: Array.from(new Set(methodsToAdd.flatMap(method => Array.from(method.imports)))),
        classAnnotations: [
            `@Tag(name = "${domain.description}接口")`,
            `@RestController`,
            `@RequestMapping("/${domainLower}s")`,
        ],
        methods: methodsToAdd.map(method => ({
            description: method.description,
            apiNote: method.apiNote,
            httpMethod: method.httpMethod.charAt(0) + method.httpMethod.slice(1).toLowerCase(),
            apiPath: method.apiPath || '',
            hasResponseType: method.hasResponseType,
            responseType: method.responseType,
            operationName: method.operationName,
            parameters: method.parameters.join(', '),
        })),
    }

    // 渲染模板
    const template = getControllerTemplate()
    const rendered = Mustache.render(template, data)

    // 写入文件
    ensureDirectoryExistence(filePath)
    if (config.mode === 'incremental' && fs.existsSync(filePath)) {
        // 追加新方法
        const existingContent = fs.readFileSync(filePath, 'utf-8')
        const contentWithoutLastBrace = existingContent.trim().slice(0, -1)
        const newContent = contentWithoutLastBrace + '\n' + rendered + '\n}'
        fs.writeFileSync(filePath, newContent, 'utf-8')
    } else {
        // 覆盖或新建文件
        fs.writeFileSync(filePath, rendered, 'utf-8')
    }
}

function extractApiNotes(content: string): Set<string> {
    const apiNotes = new Set<string>()
    const regex = /@apiNote\s+([^\n\r]+)/g
    let match
    while ((match = regex.exec(content)) !== null) {
        apiNotes.add(match[1].trim())
    }
    return apiNotes
}

function ensureDirectoryExistence(filePath: string) {
    const dirname = path.dirname(filePath)
    if (fs.existsSync(dirname)) {
        return true
    }
    ensureDirectoryExistence(dirname)
    fs.mkdirSync(dirname)
}

async function generateService(domain: Domain, apiMethods: ApiMethod[], config: Config) {
    // 与生成 Controller 类似，实现 Service 接口和实现类的生成
    // 请根据实际需求，完成该部分代码
}

async function generateVoClasses(domain: Domain, apiMethods: ApiMethod[], config: Config) {
    // 生成请求和响应 VO 类
    // 请根据实际需求，完成该部分代码
}

