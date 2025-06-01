import { parseScript } from './script-parser'
import { getControllerBasicTemplate, getServiceBasicTemplate, getServiceImplBasicTemplate, getControllerMethodsTemplate, getServiceMethodsTemplate, getServiceImplMethodsTemplate } from './templates'
import Mustache from 'mustache'
import { Domain, ApiMethod, Config } from './types'

/**
 * 生成项目模板文件（POM/Gradle + 主启动类 + 配置文件）
 */
export async function generateProjectTemplate(
    config: Config,
    buildTool: 'maven' | 'gradle' = 'maven'
): Promise<GeneratedFile[]> {
    const generatedFiles: GeneratedFile[] = []

    if (buildTool === 'maven') {
        // 生成 pom.xml
        const pomContent = generateMavenPom(config)
        generatedFiles.push({
            filePath: 'pom.xml',
            content: pomContent
        })
    } else {
        // 生成 build.gradle
        const gradleContent = generateGradleBuild(config)
        generatedFiles.push({
            filePath: 'build.gradle',
            content: gradleContent
        })
    }

    // 生成主启动类
    const mainClassContent = generateMainClass(config)
    const mainClassPath = `src/main/java/${config.basePackage.replace(/\./g, '/')}/Application.java`
    generatedFiles.push({
        filePath: mainClassPath,
        content: mainClassContent
    })

    // 生成配置文件
    const configContent = generateApplicationConfig(config)
    generatedFiles.push({
        filePath: 'src/main/resources/application.yml',
        content: configContent
    })

    return generatedFiles
}

/**
 * 生成Maven POM文件
 */
function generateMavenPom(config: Config): string {
    const isSpringBoot3 = config.springBootVersion === '3'

    const data = {
        groupId: config.basePackage,
        artifactId: extractArtifactId(config.basePackage),
        springBootVersion: isSpringBoot3 ? '3.5.0' : '2.7.18',
        javaVersion: isSpringBoot3 ? '17' : '8',
        mapstructVersion: '1.6.3',
        knife4jDependency: isSpringBoot3
            ? 'knife4j-openapi3-jakarta-spring-boot-starter'
            : 'knife4j-openapi3-spring-boot-starter',
        knife4jVersion: '4.5.0'
    }

    const template = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>{{springBootVersion}}</version>
        <relativePath/>
    </parent>

    <groupId>{{groupId}}</groupId>
    <artifactId>{{artifactId}}</artifactId>
    <version>1.0.0</version>
    <name>{{artifactId}}</name>
    <description>REST API项目</description>

    <properties>
        <java.version>{{javaVersion}}</java.version>
        <mapstruct.version>{{mapstructVersion}}</mapstruct.version>
        <spring-boot.version>{{springBootVersion}}</spring-boot.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Boot Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- MyBatis Plus -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-extension</artifactId>
            <version>3.5.12</version>
        </dependency>

        <!-- MapStruct -->
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>\${mapstruct.version}</version>
        </dependency>

        <!-- Knife4j API文档 -->
        <dependency>
            <groupId>com.github.xiaoymin</groupId>
            <artifactId>{{knife4jDependency}}</artifactId>
            <version>{{knife4jVersion}}</version>
        </dependency>

        <!-- Hutool工具类 -->
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>5.8.38</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Spring Boot DevTools -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>

        <!-- Spring Boot Configuration Processor -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Spring Boot Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- Maven编译插件 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-configuration-processor</artifactId>
                            <version>\${spring-boot.version}</version>
                        </path>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>\${lombok.version}</version>
                        </path>
                        <path>
                            <groupId>org.mapstruct</groupId>
                            <artifactId>mapstruct-processor</artifactId>
                            <version>\${mapstruct.version}</version>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>

            <!-- Spring Boot插件 -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`

    return Mustache.render(template, data)
}

/**
 * 生成Gradle构建文件
 */
function generateGradleBuild(config: Config): string {
    const isSpringBoot3 = config.springBootVersion === '3'

    const data = {
        groupId: config.basePackage,
        springBootVersion: isSpringBoot3 ? '3.5.0' : '2.7.18',
        dependencyManagementVersion: isSpringBoot3 ? '1.1.6' : '1.1.4',
        javaVersion: isSpringBoot3 ? '17' : '8',
        mapstructVersion: '1.6.3',
        knife4jDependency: isSpringBoot3
            ? 'knife4j-openapi3-jakarta-spring-boot-starter'
            : 'knife4j-openapi3-spring-boot-starter',
        knife4jVersion: '4.5.0'
    }

    const template = `plugins {
    id 'java'
    id 'org.springframework.boot' version '{{springBootVersion}}'
    id 'io.spring.dependency-management' version '{{dependencyManagementVersion}}'
}

group = '{{groupId}}'
version = '1.0.0'
sourceCompatibility = '{{javaVersion}}'

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

ext {
    mapstructVersion = '{{mapstructVersion}}'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'com.baomidou:mybatis-plus-extension:3.5.12'
    implementation "org.mapstruct:mapstruct:\${mapstructVersion}"
    implementation 'com.github.xiaoymin:{{knife4jDependency}}:{{knife4jVersion}}'
    implementation 'cn.hutool:hutool-all:5.8.38'
    
    compileOnly 'org.projectlombok:lombok'
    developmentOnly 'org.springframework.boot:spring-boot-devtools'
    annotationProcessor 'org.springframework.boot:spring-boot-configuration-processor'
    annotationProcessor 'org.projectlombok:lombok'
    annotationProcessor "org.mapstruct:mapstruct-processor:\${mapstructVersion}"
    
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}`

    return Mustache.render(template, data)
}

/**
 * 生成主启动类
 */
function generateMainClass(config: Config): string {
    const data = {
        packageName: config.basePackage,
        className: 'Application',
        author: config.author,
        date: new Date().toISOString().split('T')[0]
    }

    const template = `package {{packageName}};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 应用程序启动类
 *
 * @author {{author}}
 * @since {{date}}
 */
@SpringBootApplication
public class {{className}} {

    public static void main(String[] args) {
        SpringApplication.run({{className}}.class, args);
    }
}`

    return Mustache.render(template, data)
}

/**
 * 生成应用配置文件
 */
function generateApplicationConfig(config: Config): string {
    const template = `# 应用配置
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  application:
    name: rest-api
  profiles:
    active: dev

# springdoc-openapi项目配置
springdoc:
  swagger-ui:
    path: /swagger-ui.html
    tags-sorter: alpha
    operations-sorter: alpha
  api-docs:
    path: /v3/api-docs
  group-configs:
    - group: 'default'
      paths-to-match: '/**'
      packages-to-scan: ${config.basePackage}.controller

# knife4j的增强配置，不需要增强可以不配
knife4j:
  enable: true
  setting:
    language: zh_cn

# 日志配置
logging:
  level:
    root: INFO
    ${config.basePackage}: DEBUG
  pattern:
    console: '%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n'`

    return template
}

/**
 * 从包名提取项目名称
 */
function extractArtifactId(packageName: string): string {
    const parts = packageName.split('.')
    return parts[parts.length - 1] || 'rest-api'
}

/**
 * 根据Spring Boot版本添加serialVersionUID相关代码
 */
function getSerialVersionUID(config: Config): { imports: string[], code: string } {
    const isSpringBoot3 = config.springBootVersion === '3'

    if (isSpringBoot3) {
        return {
            imports: ['java.io.Serial'],
            code: `    /**
     * 使用JDK 1.0.2 中的 serialVersionUID 实现互操作性。
     */
    @Serial
    private static final long serialVersionUID = -3042686055658047285L;`
        }
    } else {
        return {
            imports: [],
            code: `    /**
     * 使用JDK 1.0.2 中的 serialVersionUID 实现互操作性。
     */
    private static final long serialVersionUID = -3042686055658047285L;`
        }
    }
}

export interface GeneratedFile {
    filePath: string
    content: string
}

export async function generateJavaCode(
    config: Config,
    rcsContent: string,
    preview: boolean = false
): Promise<GeneratedFile[]> {
    const generatedFiles: GeneratedFile[] = []
    // 1. 解析脚本，得到领域和方法信息
    const { domains, apiMethods } = parseScript(config, rcsContent)

    // 2. 如果 frameworkBasePackage 没有合理的值，说明没有前置框架 ，需要在 outputPath + basePackage 目录下自动生成如下目录及文件作为基础框架
    // ├── core
    // │   ├── code
    // │   │   ├── CodeMsg.java
    // │   │   └── ResponseCode.java
    // │   ├── exception
    // │   │   └── BusinessException.java
    // │   ├── Result.java
    // │   └── tree
    // │       ├── AbstractTreeNode.java
    // │       ├── Node.java
    // │       ├── TreeBuilder.java
    // │       ├── TreeNode.java
    // │       └── TreeUtil.java
    await generateCoreIfNoFramework(config, preview, generatedFiles)

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

async function generateCoreIfNoFramework(config: Config, preview: boolean, generatedFiles: GeneratedFile[]) {
    // 判断 frameworkBasePackage 是否有值,如果有值，则不生成
    if (config.frameworkBasePackage) {
        return;
    }

    // core.Result.java
    const packageName = `${config.basePackage}.core`
    const resultFilePath = window.api.join(config.outputPath, ...packageName.split('.'), `Result.java`);

    if (!window.api.exists(resultFilePath)) {
        // 文件不存在，生成
        const resultContent = await generateResultClass(config);
        if (preview) {
            generatedFiles.push({ filePath: resultFilePath, content: resultContent })
        } else {
            ensureDirectoryExistence(resultFilePath);
            window.api.writeFile(resultFilePath, resultContent);
        }
    }

    // core.exception.BusinessException.java
    const exceptionPackageName = `${config.basePackage}.core.exception`
    const businessExceptionFilePath = window.api.join(config.outputPath, ...exceptionPackageName.split('.'), `BusinessException.java`);

    if (!window.api.exists(businessExceptionFilePath)) {
        // 文件不存在，生成
        const businessExceptionContent = await generateBusinessExceptionClass(config);
        if (preview) {
            generatedFiles.push({ filePath: businessExceptionFilePath, content: businessExceptionContent })
        } else {
            ensureDirectoryExistence(businessExceptionFilePath);
            window.api.writeFile(businessExceptionFilePath, businessExceptionContent);
        }
    }

    // core.code.CodeMsg.java
    const codePackageName = `${config.basePackage}.core.code`
    const codeMsgFilePath = window.api.join(config.outputPath, ...codePackageName.split('.'), `CodeMsg.java`);

    if (!window.api.exists(codeMsgFilePath)) {
        // 文件不存在，生成
        const codeMsgContent = await generateCodeMsgClass(config);
        if (preview) {
            generatedFiles.push({ filePath: codeMsgFilePath, content: codeMsgContent })
        } else {
            ensureDirectoryExistence(codeMsgFilePath);
            window.api.writeFile(codeMsgFilePath, codeMsgContent);
        }
    }

    // core.code.ResponseCode.java
    const responseCodePackageName = `${config.basePackage}.core.code`
    const responseCodeFilePath = window.api.join(config.outputPath, ...responseCodePackageName.split('.'), `ResponseCode.java`);

    if (!window.api.exists(responseCodeFilePath)) {
        // 文件不存在，生成
        const responseCodeContent = await generateResponseCodeClass(config);
        if (preview) {
            generatedFiles.push({ filePath: responseCodeFilePath, content: responseCodeContent })
        } else {
            ensureDirectoryExistence(responseCodeFilePath);
            window.api.writeFile(responseCodeFilePath, responseCodeContent);
        }
    }

    // core.tree.AbstractTreeNode.java
    const treePackageName = `${config.basePackage}.core.tree`
    const abstractTreeNodeFilePath = window.api.join(config.outputPath, ...treePackageName.split('.'), `AbstractTreeNode.java`);

    if (!window.api.exists(abstractTreeNodeFilePath)) {
        // 文件不存在，生成
        const abstractTreeNodeContent = await generateAbstractTreeNodeClass(config);
        if (preview) {
            generatedFiles.push({ filePath: abstractTreeNodeFilePath, content: abstractTreeNodeContent })
        } else {
            ensureDirectoryExistence(abstractTreeNodeFilePath);
            window.api.writeFile(abstractTreeNodeFilePath, abstractTreeNodeContent);
        }
    }

    // core.tree.Node.java
    const nodeFilePath = window.api.join(config.outputPath, ...treePackageName.split('.'), `Node.java`);

    if (!window.api.exists(nodeFilePath)) {
        // 文件不存在，生成
        const nodeContent = await generateNodeClass(config);
        if (preview) {
            generatedFiles.push({ filePath: nodeFilePath, content: nodeContent })
        } else {
            ensureDirectoryExistence(nodeFilePath);
            window.api.writeFile(nodeFilePath, nodeContent);
        }
    }

    // core.tree.TreeBuilder.java
    const treeBuilderFilePath = window.api.join(config.outputPath, ...treePackageName.split('.'), `TreeBuilder.java`);

    if (!window.api.exists(treeBuilderFilePath)) {
        // 文件不存在，生成
        const treeBuilderContent = await generateTreeBuilderClass(config);
        if (preview) {
            generatedFiles.push({ filePath: treeBuilderFilePath, content: treeBuilderContent })
        } else {
            ensureDirectoryExistence(treeBuilderFilePath);
            window.api.writeFile(treeBuilderFilePath, treeBuilderContent);
        }
    }

    // core.tree.TreeNode.java
    const treeNodeFilePath = window.api.join(config.outputPath, ...treePackageName.split('.'), `TreeNode.java`);

    if (!window.api.exists(treeNodeFilePath)) {
        // 文件不存在，生成
        const treeNodeContent = await generateTreeNodeClass(config);
        if (preview) {
            generatedFiles.push({ filePath: treeNodeFilePath, content: treeNodeContent })
        } else {
            ensureDirectoryExistence(treeNodeFilePath);
            window.api.writeFile(treeNodeFilePath, treeNodeContent);
        }
    }

    // core.tree.TreeUtil.java
    const treeUtilFilePath = window.api.join(config.outputPath, ...treePackageName.split('.'), `TreeUtil.java`);

    if (!window.api.exists(treeUtilFilePath)) {
        // 文件不存在，生成
        const treeUtilContent = await generateTreeUtilClass(config);
        if (preview) {
            generatedFiles.push({ filePath: treeUtilFilePath, content: treeUtilContent })
        } else {
            ensureDirectoryExistence(treeUtilFilePath);
            window.api.writeFile(treeUtilFilePath, treeUtilContent);
        }
    }
}

async function generateResultClass(config: Config): Promise<string> {
    const packageName = `${config.basePackage}.core`
    const data = {
        basePackage: config.basePackage,
        packageName: packageName,
        author: 'zhaowenhao',
        date: '2022-12-27',
    };
    const template = `package {{packageName}};

import com.fasterxml.jackson.annotation.JsonIgnore;
import {{basePackage}}.core.code.ResponseCode;
import {{basePackage}}.core.exception.BusinessException;

import java.io.Serializable;
import java.util.Objects;

/**
 * 响应包装体
 *
 * @author {{author}}
 * @since {{date}}
 */
@SuppressWarnings({"LombokSetterMayBeUsed", "LombokGetterMayBeUsed"})
public class Result<T> implements Serializable {

    /**
     * 响应状态码
     */
    private Integer code;

    /**
     * 响应消息
     */
    private String msg;

    /**
     * 响应数据
     */
    @SuppressWarnings("java:S1948")
    private T data;

    // 无参构造函数
    public Result() {
    }

    // 全参构造函数
    public Result(Integer code, String msg, T data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    // Getter 和 Setter 方法
    public Integer getCode() {
        return code;
    }

    public void setCode(Integer code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    /**
     * 获取当前时间戳，单位为毫秒
     *
     * @return 当前时间戳，单位为毫秒
     */
    public long getTimestamp() {
        return System.currentTimeMillis();
    }

    public static <T> Result<T> ok() {
        return of(ResponseCode.SUCCESS.getCode(), ResponseCode.SUCCESS.getMsg(), null);
    }

    public static <T> Result<T> ok(T data) {
        return of(ResponseCode.SUCCESS.getCode(), ResponseCode.SUCCESS.getMsg(), data);
    }

    public static <T> Result<T> ok(T data, String msg) {
        return of(ResponseCode.SUCCESS.getCode(), msg, data);
    }

    public static <T> Result<T> fail() {
        return of(ResponseCode.FAIL.getCode(), ResponseCode.FAIL.getMsg(), null);
    }

    public static <T> Result<T> fail(String msg) {
        return of(ResponseCode.FAIL.getCode(), msg, null);
    }

    public static <T> Result<T> fail(int code, String msg) {
        return of(code, msg, null);
    }

    public static <T> Result<T> fail(ResponseCode responseCode) {
        return of(responseCode.getCode(), responseCode.getMsg(), null);
    }

    public static <T> Result<T> of(Integer code, String msg, T data) {
        return new Result<>(code, msg, data);
    }

    /**
     * 判断是否成功
     *
     * @return 是否成功
     */
    @JsonIgnore
    public boolean isSuccess() {
        return isSuccess(code);
    }

    @JsonIgnore
    public boolean isError() {
        return !isSuccess();
    }

    // ========= 和 Exception 异常体系集成 =========

    /**
     * 判断是否有异常。如果有，则抛出 {@link BusinessException} 异常
     */
    public void check() throws BusinessException {
        check(code, msg);
    }

    /**
     * 判断是否有异常。如果有，则抛出 {@link BusinessException} 异常
     * 如果没有，则返回 {@link #data} 数据
     */
    @JsonIgnore
    public T getCheckedData() {
        return getCheckedData(code, msg, data);
    }

    // ========= 静态方法，方便判断非本类的结果对象是否成功 =========

    /**
     * 断是否有异常。如果有，则抛出 {@link BusinessException} 异常
     *
     * @param code 状态码
     * @param msg  消息
     * @throws BusinessException 如果不成功，则抛出异常
     */
    public static void check(Integer code, String msg) throws BusinessException {
        if (isSuccess(code)) {
            return;
        }
        // 业务异常
        throw new BusinessException(code, msg);
    }

    /**
     * 判断是否有异常。如果有，则抛出 {@link BusinessException} 异常
     * 如果没有，则返回 {@link #data} 数据
     *
     * @param code 状态码
     * @param msg  消息
     * @param data 数据
     * @return 数据
     */
    public static <T> T getCheckedData(Integer code, String msg, T data) {
        check(code, msg);
        return data;
    }

    /**
     * 是否错误
     *
     * @param code 状态码
     * @return 是否错误
     */
    public boolean isError(Integer code) {
        return !isSuccess(code);
    }

    /**
     * 判断是否成功
     *
     * @param code 状态码
     * @return 是否成功
     */
    public static boolean isSuccess(Integer code) {
        return Objects.equals(code, ResponseCode.SUCCESS.getCode());
    }
}
`;
    return Mustache.render(template, data);
}

async function generateBusinessExceptionClass(config: Config): Promise<string> {
    const packageName = `${config.basePackage}.core.exception`
    const serialInfo = getSerialVersionUID(config)
    const data = {
        basePackage: config.basePackage,
        packageName: packageName,
        author: 'zhaowenhao',
        date: '2022-12-27',
    };
    const template = `package {{packageName}};

import cn.hutool.core.text.CharSequenceUtil;
import {{basePackage}}.core.code.CodeMsg;
import {{basePackage}}.core.code.ResponseCode;
import lombok.Getter;
${serialInfo.imports.length > 0 ? '\n' + serialInfo.imports.map((imp: string) => `import ${imp};`).join('\n') + '\n' : ''}
/**
 * 业务异常类，用于封装业务层错误信息和错误码。
 * <p>
 * 此类支持使用模板构建错误消息，借鉴 org.slf4j.Logger 的机制。
 * 可以在错误消息中使用 {} 作为占位符，并提供对应的参数来填充。
 * </p>
 *
 * <pre>
 * 示例：
 * throw new BusinessException("获取 fid 对应的输入流时发生错误，fid {}: {}", fid, e.getMessage());
 * </pre>
 *
 * @author {{author}}
 * @since {{date}}
 */
@Getter
public class BusinessException extends RuntimeException {

    private static final int DEFAULT_ERROR_CODE = ResponseCode.FAIL.getCode();

    /**
     * 错误码
     */
    private final Integer code;

    /**
     * 默认构造函数，使用默认错误码。
     *
     * @param message 错误消息
     */
    public BusinessException(String message) {
        this(DEFAULT_ERROR_CODE, message);
    }

    /**
     * 通过错误码与错误消息接口的实现类构建业务异常，一般为 ResponseCode。
     *
     * @param codeMsg 错误码与错误消息接口的实现类
     * @see ResponseCode
     */
    public BusinessException(CodeMsg codeMsg) {
        this(codeMsg.getCode(), codeMsg.getMsg());
    }

    /**
     * 通过错误码与错误消息构建业务异常。
     *
     * @param code    错误码
     * @param message 错误消息
     */
    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    /**
     * 通过错误消息和参数构建业务异常，使用默认错误码。
     * 错误消息可以使用 {} 作为占位符，并提供对应的参数来填充。
     *
     * @param message 错误消息，支持占位符 {}
     * @param args    用于填充占位符的参数
     */
    public BusinessException(String message, Object... args) {
        this(DEFAULT_ERROR_CODE, message, args);
    }

    /**
     * 通过错误码、错误消息和参数构建业务异常。
     * 错误消息可以使用 {} 作为占位符，并提供对应的参数来填充。
     *
     * @param code    错误码
     * @param message 错误消息，支持占位符 {}
     * @param args    用于填充占位符的参数
     */
    public BusinessException(int code, String message, Object... args) {
        super(CharSequenceUtil.format(message, args));
        this.code = code;
    }

    /**
     * 通过异常构建业务异常，使用默认错误码。
     *
     * @param cause 捕获的异常
     */
    public BusinessException(Throwable cause) {
        this(DEFAULT_ERROR_CODE, cause.getMessage(), cause);
    }

    /**
     * 通过错误消息和异常构建业务异常，使用默认错误码。
     * 错误消息可以使用 {} 作为占位符，占位符只能有 0 个或 1 个，将被 cause.getMessage() 填充。
     *
     * @param message 错误消息，支持占位符 {}
     * @param cause   触发异常
     */
    public BusinessException(String message, Throwable cause) {
        this(DEFAULT_ERROR_CODE, message, cause);
    }

    /**
     * 通过错误码、错误消息和异常构建业务异常。
     * 错误消息可以使用 {} 作为占位符，占位符只能有 0 个或 1 个，将被 cause.getMessage() 填充。
     *
     * @param code    错误码
     * @param message 错误消息，支持占位符 {}
     * @param cause   触发异常
     */
    public BusinessException(int code, String message, Throwable cause) {
        super(CharSequenceUtil.format(message, cause != null ? cause.getMessage() : ""), cause);
        this.code = code;
    }

${serialInfo.code}
}
`;
    return Mustache.render(template, data);
}

async function generateCodeMsgClass(config: Config): Promise<string> {
    const packageName = `${config.basePackage}.core.code`
    const data = {
        basePackage: config.basePackage,
        packageName: packageName,
        author: 'zhaowenhao',
        date: '2022-12-27',
    };
    const template = `package {{packageName}};

/**
 * 错误码与错误消息的顶级接口
 *
 * @author {{author}}
 * @since {{date}}
 */
public interface CodeMsg {
    /**
     * 获取错误码
     *
     * @return 获取错误码
     */
    Integer getCode();

    /**
     * 获取错误消息
     *
     * @return 获取错误消息
     */
    String getMsg();
}
`
    return Mustache.render(template, data);
}

async function generateResponseCodeClass(config: Config): Promise<string> {
    const packageName = `${config.basePackage}.core.code`
    const data = {
        basePackage: config.basePackage,
        packageName: packageName,
        author: 'zhaowenhao',
        date: '2022-12-27',
    };
    const template = `package {{packageName}};

/**
 * 通用错误码
 *
 * @author {{author}}
 * @since {{date}}
 */
public enum ResponseCode implements CodeMsg {

    SUCCESS(0, "操作成功"),
    FAIL(1, "操作失败"),

    /**
     * TODO: 占位符，请自行拓展符合项目实际的错误码与错误消息。
     */
    TODO(2, "占位符，请自行拓展符合项目实际的错误码与错误消息。");

    /**
     * 错误码
     */
    private final Integer code;

    /**
     * 错误消息
     */
    private final String msg;

    ResponseCode(int code, String msg) {
        this.code = code;
        this.msg = msg;
    }

    @Override
    public Integer getCode() {
        return code;
    }

    @Override
    public String getMsg() {
        return msg;
    }
}
`
    return Mustache.render(template, data);
}

async function generateAbstractTreeNodeClass(config: Config): Promise<string> {
    const packageName = `${config.basePackage}.core.tree`
    const data = {
        basePackage: config.basePackage,
        packageName: packageName,
        author: 'zhaowenhao',
        date: '2023-05-06',
    };
    const template = `package {{packageName}};

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;

/**
 * 树节点的抽象模版类
 *
 * @author {{author}}
 * @since {{date}}
 */
public abstract class AbstractTreeNode<T, N extends AbstractTreeNode<T, N>> implements TreeNode<T, N> {

    /**
     * 父节点
     */
    private N parent;

    /**
     * 父节点详细信息
     */
    private N parentDetail;

    /**
     * 子节点
     */
    private List<N> children;

    @Override
    @JsonIgnore
    public N getParent() {
        return parent;
    }

    @Override
    public void setParent(N parent) {
        this.parent = parent;
    }

    @Override
    public N getParentDetail() {
        return parentDetail;
    }

    @Override
    public void setParentDetail(N parentDetail) {
        this.parentDetail = parentDetail;
    }

    @Override
    public List<N> getChildren() {
        return this.children;
    }

    @Override
    public void setChildren(List<N> children) {
        this.children = children;
    }

    @Override
    public String toString() {
        final StringWriter stringWriter = new StringWriter();
        TreeNode.printTree(this, new PrintWriter(stringWriter), 0);
        return stringWriter.toString();
    }
}
`
    return Mustache.render(template, data);
}

async function generateNodeClass(config: Config): Promise<string> {
    const packageName = `${config.basePackage}.core.tree`
    const data = {
        basePackage: config.basePackage,
        packageName: packageName,
        author: 'zhaowenhao',
        date: '2023-05-06',
    };
    const template = `package {{packageName}};

import cn.hutool.core.comparator.CompareUtil;

import java.io.Serializable;

/**
 * 节点接口，提供节点相关的的方法定义
 *
 * @param <T> ID类型
 * @author {{author}}
 * @since {{date}}
 */
public interface Node<T> extends Comparable<Node<T>>, Serializable {

    /**
     * 获取ID
     *
     * @return ID
     */
    T getId();

    /**
     * 设置ID
     *
     * @param id ID
     */
    void setId(T id);

    /**
     * 获取父节点ID
     *
     * @return 父节点ID
     */
    T getParentId();

    /**
     * 设置父节点ID
     *
     * @param parentId 父节点ID
     */
    void setParentId(T parentId);

    /**
     * 获取节点标签名称
     *
     * @return 节点标签名称
     */
    String getName();

    /**
     * 设置节点标签名称
     *
     * @param name 节点标签名称
     */
    void setName(String name);

    /**
     * 获取权重
     *
     * @return 权重
     */
    @SuppressWarnings("java:S1452")
    Comparable<?> getWeight();

    /**
     * 比较
     *
     * @param node the object to be compared.
     * @return a negative integer, zero, or a positive integer as this object is less than, equal to, or greater than the specified object.
     */
    @SuppressWarnings({"unchecked", "rawtypes", "NullableProblems"})
    @Override
    default int compareTo(Node node) {
        if (null == node) {
            return 1;
        }
        final Comparable weight = this.getWeight();
        final Comparable weightOther = node.getWeight();
        return CompareUtil.compare(weight, weightOther);
    }
}
`
    return Mustache.render(template, data);
}

async function generateTreeBuilderClass(config: Config): Promise<string> {
    const packageName = `${config.basePackage}.core.tree`
    const data = {
        basePackage: config.basePackage,
        packageName: packageName,
        author: 'zhaowenhao',
        date: '2023-05-06',
    };
    const template = `package {{packageName}};

import cn.hutool.core.builder.Builder;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.map.MapUtil;
import cn.hutool.core.util.ObjectUtil;
import org.springframework.beans.BeanUtils;

import java.util.*;

/**
 * 树构建器
 *
 * @param <T> ID类型
 * @author {{author}}
 * @since {{date}}
 */
public class TreeBuilder<T, N extends TreeNode<T, N>> implements Builder<N> {

    private final N root;

    /**
     * 是否生成父节点详情，父节点详情只包含父节点普通的字段，不包含父节点、子节点等信息，防止循环引用，
     * 由于生成父节点详情需要执行节点复制操作，非常影响性能，所以默认不生成
     */
    private Boolean shouldGenerateParentDetail = false;

    private final Map<T, N> idTreeMap;

    private boolean isBuild;

    /**
     * 树构造器，根据指定的根结点id和id-节点（不带子节点）Map构造一棵树，如果节点Map的key中不包含rootId，就使用TreeNode接口createEmpty()创建一个并设置id为rootId,用来作为根节点，然后逐级增加子节点。
     *
     * @param treeMap 节点Map（不带子节点）
     * @param rootId  根节点ID
     */
    public TreeBuilder(Map<T, N> treeMap, T rootId, boolean shouldGenerateParentDetail) {
        if (MapUtil.isEmpty(treeMap)) {
            this.root = null;
            this.idTreeMap = new LinkedHashMap<>();
            return;
        }
        N treeNode = treeMap.get(rootId);
        if (treeNode != null) {
            this.root = treeNode;
        } else {
            N other = treeMap.values().iterator().next().createEmpty();
            other.setId(rootId);
            this.root = other;
        }
        this.idTreeMap = new LinkedHashMap<>();
        this.shouldGenerateParentDetail = shouldGenerateParentDetail;
    }

    /**
     * 树构造器，根据指定的根结点id和节点列表（不带子节点）构造一棵树，如果节点列表中不包含id为rootId的元素，就使用TreeNode接口createEmpty()创建一个并设置id为rootId,用来作为根节点，然后逐级增加子节点。
     *
     * @param treeNodes                  节点列表（不带子节点）
     * @param rootId                     根节点ID
     * @param shouldGenerateParentDetail 是否生成父节点详情，父节点详情只包含父节点普通的字段，不包含父节点、子节点等信息，防止循环引用，
     *                                   由于生成父节点详情需要执行节点复制操作，非常影响性能，所以默认不生成
     */
    public TreeBuilder(List<N> treeNodes, T rootId, boolean shouldGenerateParentDetail) {
        if (CollUtil.isEmpty(treeNodes)) {
            this.root = null;
            this.idTreeMap = new LinkedHashMap<>();
            return;
        }
        Optional<N> first = treeNodes.stream()
                .filter(treeNode -> treeNode.getId().equals(rootId))
                .findFirst();
        if (first.isPresent()) {
            this.root = first.get();
        } else {
            N empty = treeNodes.get(0).createEmpty();
            empty.setId(rootId);
            this.root = empty;
        }
        this.idTreeMap = new LinkedHashMap<>();
        this.shouldGenerateParentDetail = shouldGenerateParentDetail;
    }

    /**
     * 增加节点列表，增加的节点是不带子节点的
     *
     * @param trees 节点列表
     * @return this
     */
    public TreeBuilder<T, N> append(Iterable<N> trees) {
        checkBuilt();

        for (N treeNode : trees) {
            // remove children if any
            treeNode.setChildren(null);
            this.idTreeMap.put(treeNode.getId(), treeNode);
        }
        return this;
    }

    /**
     * 增加节点列表，增加的节点是不带子节点的
     *
     * @param map 节点列表
     * @return this
     */
    public TreeBuilder<T, N> append(Map<T, N> map) {
        checkBuilt();

        for (N treeNode : map.values()) {
            // remove children if any
            treeNode.setChildren(null);
        }
        this.idTreeMap.putAll(map);
        return this;
    }

    /**
     * 重置Builder，实现复用
     *
     * @return this
     */
    public TreeBuilder<T, N> reset() {
        this.idTreeMap.clear();
        this.root.setChildren(null);
        this.isBuild = false;
        return this;
    }

    @Override
    public N build() {
        checkBuilt();

        buildFromMap();
        cutTree(-1);

        this.isBuild = true;
        this.idTreeMap.clear();

        return root;
    }

    /**
     * 构建树列表，没有顶层节点，例如：
     *
     * <pre>
     * -用户管理
     *  -用户管理
     *    +用户添加
     * - 部门管理
     *  -部门管理
     *    +部门添加
     * </pre>
     *
     * @return 树列表
     */
    public List<N> buildList() {
        if (isBuild) {
            // 已经构建过了
            return this.root.getChildren();
        }
        return build().getChildren();
    }

    /**
     * 开始构建
     */
    @SuppressWarnings("java:S135")
    private void buildFromMap() {
        if (MapUtil.isEmpty(this.idTreeMap)) {
            return;
        }

        final Map<T, N> eTreeMap = MapUtil.sortByValue(this.idTreeMap, false);
        T parentId;
        for (N node : eTreeMap.values()) {
            if (null == node) {
                continue;
            }
            parentId = node.getParentId();
            if (ObjectUtil.equals(this.root.getId(), parentId)) {
                this.root.addChildren(Collections.singletonList(node));
                if (Boolean.TRUE.equals(shouldGenerateParentDetail)) {
                    // 生成父节点详情
                    node.setParentDetail(cloneWithoutRelations(this.root));
                }
                continue;
            }

            final N parentNode = eTreeMap.get(parentId);
            if (null != parentNode) {
                if (Boolean.TRUE.equals(shouldGenerateParentDetail)) {
                    // 生成父节点详情
                    node.setParentDetail(cloneWithoutRelations(parentNode));
                }
                parentNode.addChildren(Collections.singletonList(node));
            }
        }
    }

    /**
     * 生成父节点详情,父节点详情只包含父节点普通的字段，不包含父节点、子节点等信息，防止循环引用
     *
     * @param node 节点
     * @return 新的节点对象，不包含 children 和 parent
     */
    private N cloneWithoutRelations(N node) {
        // 使用复制构造函数创建一个新的对象
        N clone = node.createEmpty();
        BeanUtils.copyProperties(node, clone);
        // 设置 children 为 null
        clone.setChildren(null);
        // 设置 parent 为 null
        clone.setParent(null);
        // 设置 parentDetail 为 null
        clone.setParentDetail(null);
        return clone;
    }

    /**
     * 树剪枝
     *
     * @param deep 最大层级
     */
    @SuppressWarnings("SameParameterValue")
    private void cutTree(Integer deep) {
        if (null == deep || deep < 0) {
            return;
        }
        cutTree(this.root, 0, deep);
    }

    /**
     * 树剪枝叶
     *
     * @param treeNode    节点
     * @param currentDepp 当前层级
     * @param maxDeep     最大层级
     */
    private void cutTree(N treeNode, int currentDepp, int maxDeep) {
        if (null == treeNode) {
            return;
        }
        if (currentDepp == maxDeep) {
            // 剪枝
            treeNode.setChildren(null);
            return;
        }

        final List<N> children = treeNode.getChildren();
        if (CollUtil.isNotEmpty(children)) {
            for (N child : children) {
                cutTree(child, currentDepp + 1, maxDeep);
            }
        }
    }

    /**
     * 检查是否已经构建
     */
    private void checkBuilt() {
        Assert.isFalse(isBuild, "Current tree has been built.");
    }
}
`
    return Mustache.render(template, data);
}

async function generateTreeNodeClass(config: Config): Promise<string> {
    const packageName = `${config.basePackage}.core.tree`
    const data = {
        basePackage: config.basePackage,
        packageName: packageName,
        author: 'zhaowenhao',
        date: '2023-05-06',
    };
    const template = `package {{packageName}};

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.lang.Filter;
import cn.hutool.core.text.CharPool;
import cn.hutool.core.text.CharSequenceUtil;
import org.springframework.beans.BeanUtils;
import org.springframework.util.CollectionUtils;

import java.io.PrintWriter;
import java.util.*;
import java.util.function.Consumer;

/**
 * 树节点接口，增加了获取子节点、父节点、遍历、过滤等方法
 *
 * @param <T> ID类型
 * @author {{author}}
 * @since {{date}}
 */
@SuppressWarnings("unchecked")
public interface TreeNode<T, N extends TreeNode<T, N>> extends Node<T> {

    /**
     * 创建一个空节点
     *
     * @return 一个空节点
     */
    N createEmpty();

    /**
     * 获取父节点
     *
     * @return 获取父节点
     */
    N getParent();

    /**
     * 设置父节点
     *
     * @param parent 设置父节点
     */
    void setParent(N parent);

    /**
     * 获取父节点
     *
     * @return 获取父节点
     */
    N getParentDetail();

    /**
     * 设置父节点
     *
     * @param parent 设置父节点
     */
    void setParentDetail(N parent);

    /**
     * 获取节点子节点
     *
     * @return 获取节点子节点
     */
    List<N> getChildren();

    /**
     * 设置节点子节点
     *
     * @param children 子节点
     */
    void setChildren(List<N> children);

    /**
     * 增加子节点，同时关联子节点的父节点为当前节点
     *
     * @param children 子节点列表
     */
    default void addChildren(List<N> children) {
        if (!CollectionUtils.isEmpty(children)) {
            List<N> childrenList = getChildren();
            if (null == childrenList) {
                childrenList = new ArrayList<>();
            }

            for (N child : children) {
                child.setParent((N) this);
                childrenList.add(child);
            }
            setChildren(childrenList);
        }
    }


    /**
     * 获取ID对应的节点，如果有多个ID相同的节点，只返回第一个。<br>
     * 此方法只查找此节点及子节点，采用广度优先遍历。
     *
     * @param id ID
     * @return 节点
     * @since 5.2.4
     */
    default N getNode(T id) {
        return TreeUtil.getNode((N) this, id);
    }

    /**
     * 获取所有父节点名称列表
     *
     * <p>
     * 比如有个人在研发1部，他上面有研发部，接着上面有技术中心<br>
     * 返回结果就是：[研发一部, 研发中心, 技术中心]
     *
     * @param id 节点ID
     * @return 所有父节点名称列表
     * @since 5.2.4
     */
    default List<CharSequence> getParentNames(T id) {
        return getParentNames(id, false);
    }

    /**
     * 获取所有父节点名称列表
     *
     * <p>
     * 比如有个人在研发1部，他上面有研发部，接着上面有技术中心<br>
     * 返回结果就是：[研发一部, 研发中心, 技术中心]
     *
     * @param id                 节点ID
     * @param includeCurrentNode 是否包含当前节点的名称
     * @return 所有父节点名称列表
     * @since 5.2.4
     */
    default List<CharSequence> getParentNames(T id, boolean includeCurrentNode) {
        return TreeUtil.getParentNames(getNode(id), includeCurrentNode);
    }

    /**
     * 获取所有父节点名称列表
     *
     * <p>
     * 比如有个人在研发1部，他上面有研发部，接着上面有技术中心<br>
     * 返回结果就是：[研发一部, 研发中心, 技术中心]
     *
     * @return 所有父节点名称列表
     * @since 5.2.4
     */
    default List<CharSequence> getParentNames() {
        return getParentNames(false);
    }

    /**
     * 获取所有父节点名称列表
     *
     * <p>
     * 比如有个人在研发1部，他上面有研发部，接着上面有技术中心<br>
     * 返回结果就是：[研发一部, 研发中心, 技术中心]
     *
     * @param includeCurrentNode 是否包含当前节点的名称
     * @return 所有父节点名称列表
     * @since 5.2.4
     */
    default List<CharSequence> getParentNames(boolean includeCurrentNode) {
        return TreeUtil.getParentNames((N) this, includeCurrentNode);
    }

    /**
     * 获取所有父节点ID列表
     *
     * @return 所有父节点ID列表，node为null返回空List
     */
    default List<T> getParentIds() {
        return getParentIds(false);
    }

    /**
     * 获取所有父节点ID列表
     *
     * @param includeCurrentNode 是否包含当前节点的名称
     * @return 所有父节点ID列表，node为null返回空List
     */
    default List<T> getParentIds(boolean includeCurrentNode) {
        return TreeUtil.getParentIds((N) this, includeCurrentNode);
    }

    /**
     * 获取所有父节点ID列表
     *
     * @return 所有父节点ID列表，node为null返回空List
     */
    default List<T> getParentIds(T id) {
        return getParentIds(id, false);
    }

    /**
     * 获取所有父节点ID列表
     *
     * @param includeCurrentNode 是否包含当前节点的名称
     * @return 所有父节点ID列表，node为null返回空List
     */
    default List<T> getParentIds(T id, boolean includeCurrentNode) {
        return TreeUtil.getParentIds(getNode(id), includeCurrentNode);
    }

    /**
     * 是否有子节点，无子节点则此为叶子节点
     *
     * @return 是否有子节点
     * @since 5.7.17
     */
    default boolean hasChild() {
        return CollUtil.isNotEmpty(getChildren());
    }

    /**
     * 递归树并处理子树下的节点：
     *
     * @param consumer 节点处理器
     * @since 5.7.16
     */
    default void walk(Consumer<N> consumer) {
        consumer.accept((N) this);
        final List<N> children = getChildren();
        if (CollUtil.isNotEmpty(children)) {
            children.forEach(treeNode -> treeNode.walk(consumer));
        }
    }

    /**
     * 递归过滤并生成新的树<br>
     * 通过{@link Filter}指定的过滤规则，本节点满足过滤条件，则保留当前节点，并向上递归保留其所有父节点
     *
     * @param filter 节点过滤规则函数，只需处理本级节点本身即可
     * @return 过滤后的节点，{@code null} 表示不满足过滤要求，丢弃之
     * @see #filter(Filter)
     * @since 5.7.17
     */
    default N filterNew(Filter<N> filter) {
        return cloneTree().filter(filter);
    }

    /**
     * 递归过滤当前树，注意此方法会修改当前树<br>
     * 通过{@link Filter}指定的过滤规则，本节点满足过滤条件，则保留当前节点，并向上递归保留其所有父节点
     *
     * @param filter 节点过滤规则函数，只需处理本级节点本身即可
     * @return 过滤后的节点，{@code null} 表示不满足过滤要求，丢弃之
     * @see #filterNew(Filter)
     * @since 5.7.17
     */
    default N filter(Filter<N> filter) {
        Set<T> validIds = new HashSet<>();
        preOrderDfs(node -> {
            if (filter.accept(node)) {
                for (N curr = node; curr != null; curr = curr.getParent()) {
                    validIds.add(curr.getId());
                }
            }
        });

        preOrderDfs(node -> {
            if (!validIds.contains(node.getId())) {
                N parent = node.getParent();
                if (parent != null) {
                    List<N> children = parent.getChildren();
                    children.remove(node);
                    node.setParent(null);
                    parent.setChildren(children);
                }
            }
        });

        return (N) this;
    }

    /**
     * 遍历树，采用深度优先遍历（DFS）<br>
     *
     * @param callback 消费者函数
     */
    default void preOrderDfs(Consumer<N> callback) {
        preOrderDfs((N) this, callback);
    }

    /**
     * 遍历树，采用深度优先遍历（DFS）<br>
     *
     * @param node     树节点
     * @param callback 消费者函数
     */
    default void preOrderDfs(N node, Consumer<N> callback) {
        Deque<N> stack = new ArrayDeque<>();
        stack.push(node);

        while (!stack.isEmpty()) {
            N curr = stack.pop();
            callback.accept(curr);
            List<N> children = curr.getChildren();
            if (children != null) {
                for (int i = children.size() - 1; i >= 0; i--) {
                    stack.push(children.get(i));
                }
            }
        }
    }

    /**
     * 递归克隆当前节点（即克隆整个树，保留字段值）<br>
     * 注意，此方法只会克隆节点，节点属性如果是引用类型，不会克隆
     *
     * @return 新的节点
     * @since 5.7.17
     */
    default N cloneTree() {
        final N result = createEmpty();
        BeanUtils.copyProperties(this, result);
        result.setChildren(cloneChildren(result));
        return result;
    }

    /**
     * 递归复制子节点
     *
     * @param parentClone 父节点
     * @return 新的子节点列表
     */
    @SuppressWarnings("java:S1168")
    default List<N> cloneChildren(N parentClone) {
        final List<N> children = getChildren();
        if (null == children) {
            return null;
        }
        final List<N> newChildren = new ArrayList<>(children.size());
        children.forEach(child -> {
            N childClone = child.cloneTree();
            childClone.setParent(parentClone);
            newChildren.add(childClone);
        });
        return newChildren;
    }

    /**
     * 打印
     *
     * @param treeNode 树
     * @param writer   Writer
     * @param intent   缩进量
     */
    static <N extends TreeNode<?, ?>> void printTree(N treeNode, PrintWriter writer, int intent) {
        writer.println(CharSequenceUtil.format("{}{}[{}]", CharSequenceUtil.repeat(CharPool.SPACE, intent), treeNode.getName(), treeNode.getId()));
        writer.flush();

        final List<N> children = (List<N>) treeNode.getChildren();
        if (CollUtil.isNotEmpty(children)) {
            for (N child : children) {
                printTree(child, writer, intent + 2);
            }
        }
    }

    /**
     * 是否有父节点
     *
     * @return 是否有父节点
     */
    default boolean hasParent() {
        return getParent() != null;
    }
}
`
    return Mustache.render(template, data);
}

async function generateTreeUtilClass(config: Config): Promise<string> {
    const packageName = `${config.basePackage}.core.tree`
    const data = {
        basePackage: config.basePackage,
        packageName: packageName,
        author: 'zhaowenhao',
        date: '2023-05-06',
    };
    const template = `package {{packageName}};

import cn.hutool.core.lang.Filter;
import cn.hutool.core.util.ObjectUtil;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 树工具类
 *
 * @author {{author}}
 * @since {{date}}
 */
public class TreeUtil {

    private TreeUtil() {
        throw new IllegalStateException("Utility class");
    }

    /**
     * 构建树
     * <p>
     * 根据指定的根结点id和节点列表（不带子节点）构造一棵树，
     * 如果节点列表中不包含id为rootId的元素，
     * 就使用TreeNode接口createEmpty()创建一个空树节点，
     * 设置空树节点的id为rootId,用来作为根节点
     * 然后逐级增加子节点，返回根节点的子节点列表
     *
     * @param treeNodes 树节点列表
     * @param rootId    最顶层父id值 一般为 0 之类
     * @param <T>       ID类型
     * @param <N>       节点类型
     * @return {@link List}  树节点列表
     */
    public static <T, N extends TreeNode<T, N>> List<N> build(List<N> treeNodes, T rootId) {
        return build(treeNodes, rootId, Boolean.FALSE);
    }

    /**
     * 构建树
     * <p>
     * 根据指定的根结点id和节点列表（不带子节点）构造一棵树，
     * 如果节点列表中不包含id为rootId的元素，
     * 就使用TreeNode接口createEmpty()创建一个空树节点，
     * 设置空树节点的id为rootId,用来作为根节点
     * 然后逐级增加子节点，返回根节点的子节点列表
     *
     * @param treeNodes                  树节点列表
     * @param rootId                     最顶层父id值 一般为 0 之类
     * @param shouldGenerateParentDetail 是否生成父节点详情，父节点详情只包含父节点普通的字段，不包含父节点、子节点等信息，防止循环引用，
     *                                   由于生成父节点详情需要执行节点复制操作，非常影响性能，所以默认不生成
     * @param <T>                        ID类型
     * @param <N>                        节点类型
     * @return {@link List}  树节点列表
     */
    public static <T, N extends TreeNode<T, N>> List<N> build(List<N> treeNodes, T rootId, boolean shouldGenerateParentDetail) {
        return buildSingle(treeNodes, rootId, shouldGenerateParentDetail).getChildren();
    }

    /**
     * 构建单root节点树
     * <p>
     * 根据指定的根结点id和节点列表（不带子节点）构造一棵树，
     * 如果节点列表中不包含id为rootId的元素，
     * 就使用TreeNode接口createEmpty()创建一个空树节点，
     * 设置空树节点的id为rootId,用来作为根节点
     * 然后逐级增加子节点，返回根节点
     *
     * @param <T>       ID类型
     * @param <N>       节点类型
     * @param treeNodes 树节点列表
     * @param rootId    最顶层父id值 一般为 0 之类
     * @return {@link TreeNode}  根节点
     */
    public static <T, N extends TreeNode<T, N>> N buildSingle(List<N> treeNodes, T rootId) {
        return buildSingle(treeNodes, rootId, Boolean.FALSE);
    }

    /**
     * 构建单root节点树
     * <p>
     * 根据指定的根结点id和节点列表（不带子节点）构造一棵树，
     * 如果节点列表中不包含id为rootId的元素，
     * 就使用TreeNode接口createEmpty()创建一个空树节点，
     * 设置空树节点的id为rootId,用来作为根节点
     * 然后逐级增加子节点，返回根节点
     *
     * @param <T>                        ID类型
     * @param <N>                        节点类型
     * @param treeNodes                  树节点列表
     * @param rootId                     最顶层父id值 一般为 0 之类
     * @param shouldGenerateParentDetail 是否生成父节点详情，父节点详情只包含父节点普通的字段，不包含父节点、子节点等信息，防止循环引用，
     *                                   由于生成父节点详情需要执行节点复制操作，非常影响性能，所以默认不生成
     * @return {@link TreeNode}  根节点
     */
    public static <T, N extends TreeNode<T, N>> N buildSingle(List<N> treeNodes, T rootId, boolean shouldGenerateParentDetail) {
        return new TreeBuilder<>(treeNodes, rootId, shouldGenerateParentDetail).append(treeNodes).build();
    }

    /**
     * 构建树
     * <p>
     * 根据指定的根结点id和id-节点（不带子节点）Map构造一棵树，
     * 如果节点Map的key中不包含rootId，
     * 就使用TreeNode接口createEmpty()创建一个空树节点，
     * 设置空树节点的id为rootId,用来作为根节点
     * 然后逐级增加子节点，返回根节点的子节点列表
     *
     * @param treeMap 树节点Map
     * @param rootId  最顶层父id值 一般为 0 之类
     * @param <T>     ID类型
     * @param <N>     节点类型
     * @return {@link List}  树节点列表
     */
    public static <T, N extends TreeNode<T, N>> List<N> build(Map<T, N> treeMap, T rootId) {
        return build(treeMap, rootId, Boolean.FALSE);
    }

    /**
     * 构建树
     * <p>
     * 根据指定的根结点id和id-节点（不带子节点）Map构造一棵树，
     * 如果节点Map的key中不包含rootId，
     * 就使用TreeNode接口createEmpty()创建一个空树节点，
     * 设置空树节点的id为rootId,用来作为根节点
     * 然后逐级增加子节点，返回根节点的子节点列表
     *
     * @param treeMap                    树节点Map
     * @param rootId                     最顶层父id值 一般为 0 之类
     * @param shouldGenerateParentDetail 是否生成父节点详情，父节点详情只包含父节点普通的字段，不包含父节点、子节点等信息，防止循环引用，
     *                                   由于生成父节点详情需要执行节点复制操作，非常影响性能，所以默认不生成
     * @param <T>                        ID类型
     * @param <N>                        节点类型
     * @return {@link List}  树节点列表
     */
    public static <T, N extends TreeNode<T, N>> List<N> build(Map<T, N> treeMap, T rootId, boolean shouldGenerateParentDetail) {
        return buildSingle(treeMap, rootId, shouldGenerateParentDetail).getChildren();
    }

    /**
     * 构建单root节点树
     * <p>
     * 根据指定的根结点id和id-节点（不带子节点）Map构造一棵树，
     * 如果节点Map的key中不包含rootId，
     * 就使用TreeNode接口createEmpty()创建一个空树节点，
     * 设置空树节点的id为rootId,用来作为根节点
     * 然后逐级增加子节点，返回根节点
     *
     * @param treeMap 树节点Map
     * @param rootId  最顶层父id值 一般为 0 之类
     * @param <T>     ID类型
     * @param <N>     节点类型
     * @return {@link TreeNode}  根节点
     */
    public static <T, N extends TreeNode<T, N>> N buildSingle(Map<T, N> treeMap, T rootId) {
        return buildSingle(treeMap, rootId, Boolean.FALSE);
    }

    /**
     * 构建单root节点树
     * <p>
     * 根据指定的根结点id和id-节点（不带子节点）Map构造一棵树，
     * 如果节点Map的key中不包含rootId，
     * 就使用TreeNode接口createEmpty()创建一个空树节点，
     * 设置空树节点的id为rootId,用来作为根节点
     * 然后逐级增加子节点，返回根节点
     *
     * @param treeMap                    树节点Map
     * @param rootId                     最顶层父id值 一般为 0 之类
     * @param shouldGenerateParentDetail 是否生成父节点详情，父节点详情只包含父节点普通的字段，不包含父节点、子节点等信息，防止循环引用，
     *                                   由于生成父节点详情需要执行节点复制操作，非常影响性能，所以默认不生成
     * @param <T>                        ID类型
     * @param <N>                        节点类型
     * @return {@link TreeNode}  根节点
     */
    public static <T, N extends TreeNode<T, N>> N buildSingle(Map<T, N> treeMap, T rootId, boolean shouldGenerateParentDetail) {
        return new TreeBuilder<>(treeMap, rootId, shouldGenerateParentDetail).append(treeMap).build();
    }

    /**
     * 递归遍历树，根据过滤器筛选节点,并返回新的树
     *
     * @param treeNode 树节点
     * @param filter   过滤器
     * @param <T>      ID类型
     * @param <N>      节点类型
     * @return {@link List}  过滤后的树节点列表
     */
    public static <T, N extends TreeNode<T, N>> N filterNew(N treeNode, Filter<N> filter) {
        if (treeNode == null) {
            return null;
        }
        return treeNode.cloneTree().filter(filter);
    }

    /**
     * 递归遍历树，根据过滤器筛选节点
     *
     * @param treeNode 树节点
     * @param filter   过滤器
     * @param <T>      ID类型
     * @param <N>      节点类型
     * @return {@link List} 过滤后的树节点列表
     */
    public static <T, N extends TreeNode<T, N>> N filter(N treeNode, Filter<N> filter) {
        if (treeNode == null) {
            return null;
        }
        return treeNode.filter(filter);
    }


    /**
     * 获取ID对应的节点，如果有多个ID相同的节点，只返回第一个。<br>
     * 此方法只查找此节点及子节点，采用递归深度优先遍历。
     *
     * @param <T>  ID类型
     * @param <N>  节点类型
     * @param node 节点
     * @param id   ID
     * @return 节点
     */
    public static <T, N extends TreeNode<T, N>> N getNode(N node, T id) {
        if (ObjectUtil.equal(id, node.getId())) {
            return node;
        }

        final List<N> children = node.getChildren();
        if (null == children) {
            return null;
        }

        // 查找子节点
        N childNode;
        for (N child : children) {
            childNode = getNode(child, id);
            if (null != childNode) {
                return childNode;
            }
        }

        // 未找到节点
        return null;
    }

    /**
     * 获取所有父节点名称列表
     *
     * <p>
     * 比如有个人在研发1部，他上面有研发部，接着上面有技术中心<br>
     * 返回结果就是：[研发一部, 研发中心, 技术中心]
     *
     * @param <T>                节点ID类型
     * @param node               节点
     * @param includeCurrentNode 是否包含当前节点的名称
     * @return 所有父节点名称列表，node为null返回空List
     */
    public static <T, N extends TreeNode<T, N>> List<CharSequence> getParentNames(N node, boolean includeCurrentNode) {
        final List<CharSequence> result = new ArrayList<>();
        if (null == node) {
            return result;
        }

        if (includeCurrentNode) {
            result.add(node.getName());
        }

        N parent = node.getParent();
        while (null != parent) {
            result.add(parent.getName());
            parent = parent.getParent();
        }
        return result;
    }

    /**
     * 获取所有父节点ID列表
     * <p>
     * <p
     *
     * @param <T>                节点ID类型
     * @param node               节点
     * @param includeCurrentNode 是否包含当前节点的名称
     * @return 所有父节点ID列表，node为null返回空List
     */
    public static <T, N extends TreeNode<T, N>> List<T> getParentIds(N node, boolean includeCurrentNode) {
        final List<T> result = new ArrayList<>();
        if (null == node) {
            return result;
        }

        if (includeCurrentNode) {
            result.add(node.getId());
        }

        N parent = node.getParent();
        while (null != parent) {
            result.add(parent.getId());
            parent = parent.getParent();
        }
        return result;
    }

}
`
    return Mustache.render(template, data);
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
        methods: methodsToAdd.map((method) => {
            // 过滤出非空的参数注解
            const nonEmptyAnnotations = method.parameterAnnotations.filter(annotation => annotation.trim() !== '')

            return {
                description: method.description,
                apiNote: method.apiNote,
                httpMethod: method.httpMethod.charAt(0) + method.httpMethod.slice(1).toLowerCase(),
                apiPath: method.apiPath || '',
                hasResponseType: method.hasResponseType,
                responseType: method.responseType,
                operationName: method.operationName,
                parameters: method.parameters.join(', '),
                methodBody: method.methodBody,
                // 参数注解相关字段
                hasParameterAnnotations: nonEmptyAnnotations.length > 0,
                parameterAnnotations: nonEmptyAnnotations.map((annotation, index, array) => ({
                    annotation,
                    last: index === array.length - 1
                }))
            }
        }),
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
        author: config.author,
        date: new Date().toISOString().split('T')[0],
        domainNameLower: domainNameLower,
        description: domain.description,
        classAnnotations: [
            `@Tag(name = "${domain.name}", description = "${domain.description}开放接口")`,
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
        author: config.author,
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
        author: config.author,
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
        abstractTreeNode: config.frameworkBasePackage ? `${config.frameworkBasePackage}.common.utils.tree.AbstractTreeNode` : `${config.basePackage}.core.tree.AbstractTreeNode`,
        frameworkBasePackage: config.frameworkBasePackage,
        packageName: packageName,
        voName: voName,
        domainName: domain.name,
        domainDescription: `${domain.description}`,
        businessSuffix: voName.replace(domain.name, '').replace(suffix, ''),
        voDescription: voDescription,
        author: config.author,
        date: new Date().toISOString().split('T')[0],
    };

    let template = '';
    if (suffix === 'TreeVo') {
        // TreeVo 模板
        const serialInfo = getSerialVersionUID(config)
        template = `package {{packageName}};

import {{abstractTreeNode}};
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
${serialInfo.imports.length > 0 ? '\n' + serialInfo.imports.map((imp: string) => `import ${imp};`).join('\n') : ''}
import java.io.Serializable;

/**
 * {{domainDescription}} {{businessSuffix}} {{voDescription}}
 *
 * @author {{author}}
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
    private String todo;

${serialInfo.code}
}
`;
    } else {
        // 默认模板
        const serialInfo = getSerialVersionUID(config)
        template = `package {{packageName}};

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
${serialInfo.imports.length > 0 ? '\n' + serialInfo.imports.map((imp: string) => `import ${imp};`).join('\n') : ''}
import java.io.Serializable;

/**
 * {{domainDescription}} {{businessSuffix}} {{voDescription}}
 *
 * @author {{author}}
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
    private String todo;

${serialInfo.code}
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
        author: config.author,
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
 * @author {{author}}
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
        author: config.author,
        date: new Date().toISOString().split('T')[0],
    };

    const template = `package {{packageName}};

import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

/**
 * {{description}}
 *
 * @author {{author}}
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

