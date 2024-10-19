import { parseScript } from './script-parser'
import { getControllerBasicTemplate, getControllerMethodsTemplate } from './templates'
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
    const className = `${domain.name}Controller`;
    const packageName = `${config.basePackage}.controller`;
    const filePath = window.api.join(config.outputPath, ...packageName.split('.'), `${className}.java`);

    let existingContent = '';
    let existingApiNotes: Set<string> = new Set();
    let existingImports: Map<string, { classes: Set<string>; hasStar: boolean }> = new Map();

    if (config.mode === 'incremental' && window.api.exists(filePath)) {
        // 读取已有的 Controller 内容
        existingContent = window.api.readFile(filePath);

        // 提取已有的 @apiNote 标记
        existingApiNotes = extractApiNotes(existingContent);

        // 提取已有的 imports
        existingImports = extractImports(existingContent);
    } else {
        // 如果文件不存在，创建基本的类结构
        existingContent = generateBasicControllerClass(config, domain);
    }

    // 过滤需要新增的方法
    const methodsToAdd = apiMethods.filter(
        (method) => method.domainName === domain.name && !existingApiNotes.has(method.apiNote)
    );

    if (methodsToAdd.length === 0) {
        // 无需新增方法
        return;
    }

    // 解析新的 imports
    const newImports = new Set<string>(methodsToAdd.flatMap((method) => Array.from(method.imports)));
    const newImportsMap = parseImports(newImports);

    // 合并 imports
    const allImportsMap = mergeImports(existingImports, newImportsMap);

    // 生成 import 语句
    const importStatements = generateImportStatements(allImportsMap);

    // 渲染新方法
    const data = {
        methods: methodsToAdd.map((method) => ({
            description: method.description,
            apiNote: method.apiNote,
            httpMethod: method.httpMethod.charAt(0) + method.httpMethod.slice(1).toLowerCase(),
            apiPath: method.apiPath || '',
            hasResponseType: method.hasResponseType,
            responseType: method.responseType,
            operationName: method.operationName,
            parameters: method.parameters.join(', '),
            methodBody: method.methodBody,
        })),
    };

    const methodsTemplate = getControllerMethodsTemplate();
    const renderedMethods = Mustache.render(methodsTemplate, data);

    // 替换 import 语句
    const updatedContentWithImports = replaceImportStatements(existingContent, importStatements);

    // 在最后一个 '}' 前插入新方法
    const finalContent = insertMethodsBeforeLastBrace(updatedContentWithImports, renderedMethods);

    // 写入文件
    ensureDirectoryExistence(filePath);
    window.api.writeFile(filePath, finalContent);
}

function replaceImportStatements(content: string, importStatements: string[]): string {
    // 匹配 import 部分
    const importSectionRegex = /(import\s+[^\n;]+;\s*)+/g;
    const packageDeclarationRegex = /^package\s+[^\n;]+;\s*/;

    let packageDeclaration = '';
    let restContent = content;

    // 提取 package 声明
    const packageMatch = content.match(packageDeclarationRegex);
    if (packageMatch) {
        packageDeclaration = packageMatch[0];
        restContent = content.substring(packageDeclaration.length);
    }

    // 替换 import 语句
    const newImportSection = importStatements.join('\n') + '\n\n';

    if (importSectionRegex.test(restContent)) {
        restContent = restContent.replace(importSectionRegex, newImportSection);
    } else {
        restContent = newImportSection + restContent;
    }

    return packageDeclaration + restContent;
}

function insertMethodsBeforeLastBrace(content: string, methods: string): string {
    const lastBraceIndex = content.lastIndexOf('}');
    if (lastBraceIndex === -1) {
        throw new Error('Invalid Java class file: missing closing brace.');
    }

    const contentBeforeLastBrace = content.substring(0, lastBraceIndex);
    const contentAfterLastBrace = content.substring(lastBraceIndex);

    return contentBeforeLastBrace + methods + contentAfterLastBrace;
}

function generateBasicControllerClass(config: Config, domain: Domain): string {
    const domainNameLower = domain.name.charAt(0).toLowerCase() + domain.name.slice(1);

    const data = {
        basePackage: config.basePackage,
        frameworkBasePackage: config.frameworkBasePackage,
        domainName: domain.name,
        date: new Date().toISOString().split('T')[0],
        domainNameLower: domainNameLower,
        description: domain.description,
        classAnnotations: [
            `@Tag(name = "${domain.description}开放接口")`,
            `@RestController`,
            `@RequestMapping("/${domainNameLower}s")`,
        ],
    };

    const basicTemplate = getControllerBasicTemplate();
    return Mustache.render(basicTemplate, data);
}

function generateImportStatements(
    importsMap: Map<string, { classes: Set<string>; hasStar: boolean }>
): string[] {
    // 构建 import 语句
    const javaImports: string[] = [];
    const javaxImports: string[] = [];
    const otherImports: string[] = [];

    for (const [packageName, { classes, hasStar }] of importsMap) {
        let importLines: string[] = [];
        if (hasStar) {
            importLines.push(`import ${packageName}.*;`);
        } else {
            if (classes.size >= 5) {
                // 合并为 '*'
                importLines.push(`import ${packageName}.*;`);
            } else {
                const classImportLines = Array.from(classes)
                    .sort()
                    .map((className) => `import ${packageName}.${className};`);
                importLines.push(...classImportLines);
            }
        }

        if (packageName.startsWith('java.')) {
            javaImports.push(...importLines);
        } else if (packageName.startsWith('javax.')) {
            javaxImports.push(...importLines);
        } else {
            otherImports.push(...importLines);
        }
    }

    // 排序各组导入
    javaImports.sort();
    javaxImports.sort();
    otherImports.sort();

    // 合并导入，组间空一行
    const importStatements: string[] = [];
    if (otherImports.length > 0) {
        importStatements.push(...otherImports);
    }
    if (javaxImports.length > 0) {
        if (importStatements.length > 0) importStatements.push('');
        importStatements.push(...javaxImports);
    }
    if (javaImports.length > 0) {
        if (otherImports.length > 0 && javaxImports.length < 0) importStatements.push('');
        importStatements.push(...javaImports);
    }

    return importStatements;
}

function mergeImports(
    existingImports: Map<string, { classes: Set<string>; hasStar: boolean }>,
    newImports: Map<string, { classes: Set<string>; hasStar: boolean }>
): Map<string, { classes: Set<string>; hasStar: boolean }> {
    const allImportsMap = new Map<string, { classes: Set<string>; hasStar: boolean }>();

    // 添加已有的 imports
    for (const [packageName, { classes, hasStar }] of existingImports) {
        allImportsMap.set(packageName, { classes: new Set(classes), hasStar });
    }

    // 合并新的 imports
    for (const [packageName, newImport] of newImports) {
        if (allImportsMap.has(packageName)) {
            const existingImport = allImportsMap.get(packageName)!;
            existingImport.hasStar = existingImport.hasStar || newImport.hasStar;
            if (!existingImport.hasStar) {
                for (const className of newImport.classes) {
                    existingImport.classes.add(className);
                }
            }
        } else {
            allImportsMap.set(packageName, { classes: new Set(newImport.classes), hasStar: newImport.hasStar });
        }
    }

    return allImportsMap;
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

function extractImports(content: string): Map<string, { classes: Set<string>; hasStar: boolean }> {
    const importsMap = new Map<string, { classes: Set<string>; hasStar: boolean }>();
    const importRegex = /^import\s+([^\s;]+);/gm;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importStatement = match[1];
        processImportStatement(importStatement, importsMap)
    }
    return importsMap;
}

function parseImports(imports: Set<string>): Map<string, { classes: Set<string>; hasStar: boolean }> {
    const importsMap = new Map<string, { classes: Set<string>; hasStar: boolean }>();
    for (const imp of imports) {
        const trimmedImp = imp.replace(/^import\s+/, '').replace(/;$/, '');
        processImportStatement(trimmedImp, importsMap)
    }
    return importsMap;
}

function processImportStatement(importStatement: string, importsMap: Map<string, { classes: Set<string>; hasStar: boolean }>) {
    if (importStatement.endsWith('.*')) {
        const packageName = importStatement.replace('.*', '')
        importsMap.set(packageName, { classes: new Set(), hasStar: true })
    } else {
        const lastDotIndex = importStatement.lastIndexOf('.')
        if (lastDotIndex > 0) {
            const packageName = importStatement.substring(0, lastDotIndex)
            const className = importStatement.substring(lastDotIndex + 1)
            if (!importsMap.has(packageName)) {
                importsMap.set(packageName, { classes: new Set(), hasStar: false })
            }
            importsMap.get(packageName)!.classes.add(className)
        }
    }
}

function ensureDirectoryExistence(filePath: string) {
    const dirname = window.api.dirname(filePath)
    if (window.api.exists(dirname)) {
        return
    }
    window.api.mkdir(dirname)
}

async function generateService(domain: Domain, apiMethods: ApiMethod[], config: Config) {
    // 与生成 Controller 类似，实现 Service 接口和实现类的生成
    // 请根据实际需求，完成该部分代码
}

async function generateVoClasses(domain: Domain, apiMethods: ApiMethod[], config: Config) {
    // 生成请求和响应 VO 类
    // 请根据实际需求，完成该部分代码
}

