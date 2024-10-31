import { parseScript } from './script-parser'
import { getControllerBasicTemplate, getServiceBasicTemplate, getServiceImplBasicTemplate, getControllerMethodsTemplate, getServiceMethodsTemplate, getServiceImplMethodsTemplate } from './templates'
import Mustache from 'mustache'
import { Domain, ApiMethod, Config } from './types'

export interface GeneratedFile {
    filePath: string
    content: string
}

export async function generateJavaCode(
    config: Config,
    rasContent: string,
    preview: boolean = false
): Promise<GeneratedFile[]> {
    const generatedFiles: GeneratedFile[] = []
    // 1. 解析脚本，得到领域和方法信息
    const { domains, apiMethods } = parseScript(config, rasContent)

    // 2. 为每个领域生成代码
    for (const domain of domains) {
        // 过滤属于当前领域的方法
        const methodsToDomain = apiMethods.filter(
            (method) => method.domainName === domain.name);
        // 生成 Controller
        const methodsToAdd = await generateController(domain, methodsToDomain, config, preview, generatedFiles)
        // 生成 Service 接口和实现
        await generateService(domain, methodsToAdd, config, preview, generatedFiles)
        // 生成 VO 类
        await generateVoClasses(domain, methodsToDomain, config, preview, generatedFiles)
    }
    // 最后返回 generatedFiles
    return generatedFiles
}

async function generateController(domain: Domain, apiMethods: ApiMethod[], config: Config, preview: boolean, generatedFiles: GeneratedFile[]) {
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
    const methodsToAdd = apiMethods.filter((method) => !existingApiNotes.has(method.apiNote));

    if (methodsToAdd.length === 0) {
        // 无需新增方法
        return [];
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

    // 写入文件 或 预览
    if (preview) {
        generatedFiles.push({ filePath, content: finalContent })
    } else {
        ensureDirectoryExistence(filePath);
        window.api.writeFile(filePath, finalContent);
    }
    return methodsToAdd;
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
        if (otherImports.length > 0 && javaxImports.length === 0) importStatements.push('');
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

async function generateService(domain: Domain, apiMethods: ApiMethod[], config: Config, preview: boolean, generatedFiles: GeneratedFile[]) {
    const interfaceName = `${domain.name}Service`;
    const packageName = `${config.basePackage}.service`;
    const interfaceFilePath = window.api.join(config.outputPath, ...packageName.split('.'), `${interfaceName}.java`);

    const implName = `${domain.name}ServiceImpl`;
    const implPackageName = `${config.basePackage}.service.impl`;
    const implFilePath = window.api.join(config.outputPath, ...implPackageName.split('.'), `${implName}.java`);

    // 生成 Service 接口
    await generateServiceInterface(domain, apiMethods, config, interfaceFilePath, preview, generatedFiles);

    // 生成 Service 实现类
    await generateServiceImpl(domain, apiMethods, config, implFilePath, preview, generatedFiles);
}

async function generateServiceInterface(domain: Domain, apiMethods: ApiMethod[], config: Config, filePath: string, preview: boolean, generatedFiles: GeneratedFile[]) {
    let existingContent = '';
    let existingImports: Map<string, { classes: Set<string>; hasStar: boolean }> = new Map();

    if (config.mode === 'incremental' && window.api.exists(filePath)) {
        // 读取已有的 Service 接口
        existingContent = window.api.readFile(filePath);

        // 提取已有的 imports
        existingImports = extractImports(existingContent);
    } else {
        // 如果文件不存在，创建基本的接口结构
        existingContent = generateBasicServiceInterface(config, domain);
    }

    if (apiMethods.length === 0) {
        // 无需新增方法
        return;
    }

    // 解析新的 imports
    const newImports = new Set<string>(apiMethods.flatMap((method) => Array.from(method.importsService)));
    const newImportsMap = parseImports(newImports);

    // 合并 imports
    const allImportsMap = mergeImports(existingImports, newImportsMap);

    // 生成 import 语句
    const importStatements = generateImportStatements(allImportsMap);

    // 渲染新方法
    const data = {
        methods: apiMethods.map((method) => ({
            description: method.description,
            returnType: method.returnType,
            operationName: method.operationName,
            parameters: method.parametersPure.join(', '),
        })),
    };

    const methodsTemplate = getServiceMethodsTemplate();
    const renderedMethods = Mustache.render(methodsTemplate, data);

    // 替换 import 语句
    const updatedContentWithImports = replaceImportStatements(existingContent, importStatements);

    // 在最后一个 '}' 前插入新方法
    const finalContent = insertMethodsBeforeLastBrace(updatedContentWithImports, renderedMethods);

    // 写入文件
    if (preview) {
        generatedFiles.push({ filePath, content: finalContent })
    } else {
        ensureDirectoryExistence(filePath);
        window.api.writeFile(filePath, finalContent);
    }
}

function generateBasicServiceInterface(config: Config, domain: Domain): string {
    const data = {
        basePackage: config.basePackage,
        domainName: domain.name,
        description: domain.description,
        date: new Date().toISOString().split('T')[0],
    };

    const template = getServiceBasicTemplate();
    return Mustache.render(template, data);
}

async function generateServiceImpl(domain: Domain, apiMethods: ApiMethod[], config: Config, implFilePath: string, preview: boolean, generatedFiles: GeneratedFile[]) {
    let existingContent = '';
    let existingImports: Map<string, { classes: Set<string>; hasStar: boolean }> = new Map();

    if (config.mode === 'incremental' && window.api.exists(implFilePath)) {
        // 读取已有的 ServiceImpl 类
        existingContent = window.api.readFile(implFilePath);

        // 提取已有的 imports
        existingImports = extractImports(existingContent);
    } else {
        // 如果文件不存在，创建基本的实现类结构
        existingContent = generateBasicServiceImplClass(config, domain);
    }

    if (apiMethods.length === 0) {
        // 无需新增方法
        return;
    }

    // 解析新的 imports
    const newImports = new Set<string>(apiMethods.flatMap((method) => Array.from(method.importsServiceImpl)));
    // 添加接口的 import
    newImports.add(`${config.basePackage}.service.${domain.name}Service`);
    const newImportsMap = parseImports(newImports);

    // 合并 imports
    const allImportsMap = mergeImports(existingImports, newImportsMap);

    // 生成 import 语句
    const importStatements = generateImportStatements(allImportsMap);

    // 渲染新方法
    const data = {
        methods: apiMethods.map((method) => ({
            returnType: method.returnType,
            operationName: method.operationName,
            parameters: method.parametersPure.join(', '),
            methodBody: method.methodBodyServiceImpl,
        })),
    };

    const methodsTemplate = getServiceImplMethodsTemplate();
    const renderedMethods = Mustache.render(methodsTemplate, data);

    // 替换 import 语句
    const updatedContentWithImports = replaceImportStatements(existingContent, importStatements);

    // 在最后一个 '}' 前插入新方法
    const finalContent = insertMethodsBeforeLastBrace(updatedContentWithImports, renderedMethods);

    // 写入文件
    if (preview) {
        generatedFiles.push({ filePath: implFilePath, content: finalContent })
    } else {
        ensureDirectoryExistence(implFilePath);
        window.api.writeFile(implFilePath, finalContent);
    }
}

function generateBasicServiceImplClass(config: Config, domain: Domain): string {
    const data = {
        basePackage: config.basePackage,
        domainName: domain.name,
        description: domain.description,
        date: new Date().toISOString().split('T')[0],
    };

    const template = getServiceImplBasicTemplate();
    return Mustache.render(template, data);
}

async function generateVoClasses(domain: Domain, apiMethods: ApiMethod[], config: Config, preview: boolean, generatedFiles: GeneratedFile[]) {
    // 收集需要生成的 VO 类名
    const reqVoSet = new Set<string>();
    const queryVoSet = new Set<string>();
    const respVoSet = new Set<string>();
    const treeVoSet = new Set<string>();
    const otherVos = new Set<string>();

    apiMethods.forEach((method) => {
        method.voNames.forEach((voName) => {
            collectVoTypes(voName, reqVoSet, queryVoSet, respVoSet, treeVoSet, otherVos);
        });
    });

    // 生成 VO 类
    for (const voName of reqVoSet) {
        await generateVoClass(voName, 'req', config, domain, 'ReqVo', '请求VO', preview, generatedFiles);
    }
    for (const voName of queryVoSet) {
        await generateVoClass(voName, 'req', config, domain, 'QueryVo', '查询VO', preview, generatedFiles);
    }
    for (const voName of respVoSet) {
        await generateVoClass(voName, 'resp', config, domain, 'RespVo', '响应VO', preview, generatedFiles);
    }
    for (const voName of treeVoSet) {
        await generateVoClass(voName, 'resp', config, domain, 'TreeVo', '树VO', preview, generatedFiles);
    }

    // 如果需要，生成 PageQueryVo
    if (needsPageQueryVo(apiMethods)) {
        await generatePageQueryVo(config, preview, generatedFiles);
    }

    // 生成 Converter
    if (apiMethods.length > 0) {
        await generateConverter(domain, config, preview, generatedFiles);
    }
}

function collectVoTypes(
    type: string,
    reqVoSet: Set<string>,
    queryVoSet: Set<string>,
    respVoSet: Set<string>,
    treeVoSet: Set<string>,
    otherVos: Set<string>
) {
    if (type.endsWith('ReqVo')) {
        reqVoSet.add(type);
    } else if (type.endsWith('QueryVo')) {
        queryVoSet.add(type);
    } else if (type.endsWith('RespVo')) {
        respVoSet.add(type);
    } else if (type.endsWith('TreeVo')) {
        treeVoSet.add(type);
    } else {
        otherVos.add(type);
    }
}

async function generateVoClass(
    voName: string,
    subPackage: string,
    config: Config,
    domain: Domain,
    suffix: string,
    voDescription: string,
    preview: boolean,
    generatedFiles: GeneratedFile[]
) {
    const packageName = `${config.basePackage}.model.vo.${subPackage}`;
    const filePath = window.api.join(config.outputPath, ...packageName.split('.'), `${voName}.java`);

    if (window.api.exists(filePath)) {
        // 文件已存在，不进行操作
        return;
    }

    const data = {
        basePackage: config.basePackage,
        frameworkBasePackage: config.frameworkBasePackage,
        packageName: packageName,
        voName: voName,
        domainName: domain.name,
        domainDescription: `${domain.description}`,
        businessSuffix: voName.replace(domain.name, '').replace(suffix, ''),
        voDescription: voDescription,
        date: new Date().toISOString().split('T')[0],
    };

    let template = '';
    if (suffix === 'TreeVo') {
        // TreeVo 模板
        template = `package {{packageName}};

import {{frameworkBasePackage}}.common.utils.tree.AbstractTreeNode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.io.Serializable;

/**
 * {{domainDescription}} {{businessSuffix}} {{voDescription}}
 *
 * @author RestCodeGenerator
 * @since {{date}}
 */
@Schema(description = "{{domainDescription}} {{businessSuffix}} {{voDescription}}")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class {{voName}} extends AbstractTreeNode<Long, {{voName}}> implements Serializable {

    // region 树对象固有实现，其他属性或方法添加到这个区域之后
    /**
     * ID
     */
    @Schema(description = "ID")
    private Long id;

    /**
     * 父ID
     */
    @Schema(description = "父ID")
    private Long parentId;

    /**
     * 显示名称
     */
    @Schema(description = "显示名称")
    private String name;

    /**
     * 权重，用于排序，值越小越靠前，这里应自行实现
     */
    @Override
    public Comparable<?> getWeight() {
        return 0;
    }

    @Override
    public {{voName}} createEmpty() {
        return new {{voName}}();
    }
    // endregion

    /**
     * todo: 待覆盖字段，实际使用时请替换为真实字段，一般实践为从对应的数据库实体类中复制过来
     */
    @Schema(description = "待覆盖字段")
    private static final long serialVersionUID = 1L;
}
`;
    } else {
        // 默认模板
        template = `package {{packageName}};

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * {{domainDescription}} {{businessSuffix}} {{voDescription}}
 *
 * @author RestCodeGenerator
 * @since {{date}}
 */
@Schema(description = "{{domainDescription}} {{businessSuffix}} {{voDescription}}")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class {{voName}} implements Serializable {

    /**
     * todo: 待覆盖字段，实际使用时请替换为真实字段，一般实践为从对应的数据库实体类中复制过来
     */
    @Schema(description = "待覆盖字段")
    private static final long serialVersionUID = 1L;
}
`;
    }

    const content = Mustache.render(template, data);
    if (preview) {
        generatedFiles.push({ filePath, content: content })
    } else {
        ensureDirectoryExistence(filePath);
        window.api.writeFile(filePath, content);
    }
}

function needsPageQueryVo(apiMethods: ApiMethod[]): boolean {
    return apiMethods.some((method) =>
        method.parameters.some((param) => param.includes('PageQueryVo'))
    );
}

async function generatePageQueryVo(config: Config, preview: boolean, generatedFiles: GeneratedFile[]) {
    const packageName = `${config.basePackage}.model.vo.req`;
    const filePath = window.api.join(config.outputPath, ...packageName.split('.'), `PageQueryVo.java`);

    if (window.api.exists(filePath)) {
        // 文件已存在，不进行操作
        return;
    }

    const data = {
        basePackage: config.basePackage,
        packageName: packageName,
        date: new Date().toISOString().split('T')[0],
    };

    const template = `package {{packageName}};

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 分页查询 VO
 *
 * @author RestCodeGenerator
 * @since {{date}}
 */
@Data
@Schema(description = "分页查询 VO")
public class PageQueryVo implements Serializable {

    /**
     * 每页显示条数，默认 10
     */
    @Schema(description = "每页显示条数，默认 10")
    private Long size = 10L;

    /**
     * 当前页
     */
    @Schema(description = "当前页，默认 1")
    private Long current = 1L;

    /**
     * 生成 MyBatis Plus 的分页对象
     *
     * @param <T> 分页元素类型
     * @return 分页对象
     */
    public <T> Page<T> page() {
        return Page.of(current, size);
    }
}
`;
    const content = Mustache.render(template, data);
    if (preview) {
        generatedFiles.push({ filePath, content: content })
    } else {
        ensureDirectoryExistence(filePath);
        window.api.writeFile(filePath, content);
    }
}

async function generateConverter(domain: Domain, config: Config, preview: boolean, generatedFiles: GeneratedFile[]) {
    const className = `${domain.name}Converter`;
    const packageName = `${config.basePackage}.converter`;
    const filePath = window.api.join(config.outputPath, ...packageName.split('.'), `${className}.java`);

    if (window.api.exists(filePath)) {
        // 文件已存在，不进行操作
        return;
    }

    const data = {
        basePackage: config.basePackage,
        packageName: packageName,
        domainName: domain.name,
        description: `${domain.description}转换器`,
        date: new Date().toISOString().split('T')[0],
    };

    const template = `package {{packageName}};

import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

/**
 * {{description}}
 *
 * @author RestCodeGenerator
 * @since {{date}}
 */
@Mapper(builder = @Builder(disableBuilder = true))
public interface {{domainName}}Converter {

    {{domainName}}Converter INSTANCE = Mappers.getMapper({{domainName}}Converter.class);

    /**
     * todo: 待覆盖方法，命名规则是 fromXxxToYyy, 如果包含领域名称，可以忽略领域名称，甚至于from 、to 关键词，因为可以通过上下文推断
     * 如：fromUserRespDtoToUserRespVo 可以简写为：fromRespDtoToRespVo
     * 如：fromUserToUserRespVo 可以简写为：toRespVo
     * 如：fromUserRespDtoToUser 可以简写为：fromRespDto
     *
     * @param source 待转换数据
     * @return 转换后的数据
     */
    Object fromXxxToYyy(Object source);
}
`;
    const content = Mustache.render(template, data);
    if (preview) {
        generatedFiles.push({ filePath, content: content })
    } else {
        ensureDirectoryExistence(filePath);
        window.api.writeFile(filePath, content);
    }
}

