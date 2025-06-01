# Rest Code 环境搭建指南

## 🎯 快速开始

### 第一步：选择技术栈

选择适合您项目的Spring Boot版本：

| 技术栈 | JDK要求 | 特点 | 适用场景 |
|--------|---------|------|----------|
| **Spring Boot 2.x** | JDK 8+ | 成熟稳定，生态完善 | 企业级应用、维护现有项目 |
| **Spring Boot 3.x** | JDK 17+ | 现代化、性能更优 | 新项目、追求最新技术 |

### 第二步：安装开发环境

#### 🔧 JDK安装

**Spring Boot 2.x (JDK 8+)**
```bash
# 检查当前JDK版本
java -version

# 推荐版本：JDK 8、11、17
# 下载地址：https://adoptopenjdk.net/
```

**Spring Boot 3.x (JDK 17+)**
```bash
# 检查当前JDK版本
java -version

# 必须使用JDK 17或更高版本
# 下载地址：https://adoptopenjdk.net/
```

#### 📦 构建工具安装

**Maven安装**
```bash
# 检查Maven版本
mvn -version

# 最低要求：Maven 3.6+
# 下载地址：https://maven.apache.org/download.cgi
```

**Gradle安装（可选）**
```bash
# 检查Gradle版本
gradle -version

# Spring Boot 2.x: Gradle 6.8+
# Spring Boot 3.x: Gradle 7.5+
# 下载地址：https://gradle.org/releases/
```

## 🚀 使用Rest Code生成项目

### 方式一：一键生成完整项目（推荐）

1. **打开Rest Code应用**
2. **点击"生成项目模板"按钮**
3. **选择技术栈版本**
4. **设置项目信息**
5. **生成完整项目结构**

### 方式二：手动配置依赖

#### Spring Boot 2.x 项目配置

**创建Maven项目**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.18</version>
        <relativePath/>
    </parent>
    
    <groupId>com.example</groupId>
    <artifactId>my-api</artifactId>
    <version>1.0.0</version>
    <name>my-api</name>
    <description>REST API项目</description>
    
    <properties>
        <java.version>8</java.version>
        <mapstruct.version>1.6.3</mapstruct.version>
        <spring-boot.version>2.7.18</spring-boot.version>
    </properties>
    
    <dependencies>
        <!-- 核心依赖 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <!-- 数据库 -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-extension</artifactId>
            <version>3.5.12</version>
        </dependency>
        
        <!-- 工具类 -->
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>${mapstruct.version}</version>
        </dependency>
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>5.8.38</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- API文档 -->
        <dependency>
            <groupId>com.github.xiaoymin</groupId>
            <artifactId>knife4j-openapi3-spring-boot-starter</artifactId>
            <version>4.4.0</version>
        </dependency>
        
        <!-- 开发工具 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- 测试 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-configuration-processor</artifactId>
                            <version>${spring-boot.version}</version>
                        </path>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>${lombok.version}</version>
                        </path>
                        <path>
                            <groupId>org.mapstruct</groupId>
                            <artifactId>mapstruct-processor</artifactId>
                            <version>${mapstruct.version}</version>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### Spring Boot 3.x 项目配置

**主要变化：**
- Spring Boot版本：`3.5.0`
- JDK版本：`17`
- Knife4j依赖：`knife4j-openapi3-jakarta-spring-boot-starter`

```xml
<!-- 关键差异点 -->
<properties>
    <java.version>17</java.version>
    <mapstruct.version>1.6.3</mapstruct.version>
</properties>

<!-- Knife4j依赖变化 -->
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-openapi3-jakarta-spring-boot-starter</artifactId>
    <version>4.5.0</version>
</dependency>
```

## 📝 项目配置

### 应用配置文件

**src/main/resources/application.yml**
```yaml
# 应用配置
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  application:
    name: rest-api
  profiles:
    active: dev
  
  # 数据源配置
  datasource:
    url: jdbc:mysql://localhost:3306/your_database?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver

# MyBatis Plus配置
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

# API文档配置
knife4j:
  enable: true
  openapi:
    title: REST API 文档
    description: 基于Rest Code生成的API文档
    version: 1.0.0

# 日志配置
logging:
  level:
    root: INFO
    com.example: DEBUG
```

### 主启动类

**src/main/java/com/example/Application.java**
```java
package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

## 🔧 IDE配置

### IntelliJ IDEA 推荐插件

1. **Lombok Plugin** - 支持Lombok注解
2. **MapStruct Support** - MapStruct代码生成支持
3. **MyBatis X** - MyBatis增强工具
4. **Spring Boot Assistant** - Spring Boot开发助手

### VS Code 推荐插件

1. **Extension Pack for Java** - Java开发套件
2. **Spring Boot Extension Pack** - Spring Boot支持
3. **Lombok Annotations Support** - Lombok支持

## 🚦 验证安装

### 1. 启动项目
```bash
# Maven
mvn spring-boot:run

# Gradle
./gradlew bootRun

# JAR包运行
java -jar target/my-api-1.0.0.jar
```

### 2. 访问API文档
打开浏览器访问：`http://localhost:8080/api/doc.html`

### 3. 健康检查
访问：`http://localhost:8080/api/actuator/health`

## 🛠 故障排除

### 常见问题

#### 1. JDK版本不匹配
```bash
# 错误信息
java.lang.UnsupportedClassVersionError

# 解决方案
# 确保项目JDK版本与运行环境一致
# Spring Boot 2.x: JDK 8+
# Spring Boot 3.x: JDK 17+
```

#### 2. Maven依赖下载失败
```bash
# 配置国内镜像源
# ~/.m2/settings.xml
<mirrors>
    <mirror>
        <id>aliyun</id>
        <mirrorOf>central</mirrorOf>
        <name>Aliyun Maven</name>
        <url>https://maven.aliyun.com/repository/central</url>
    </mirror>
</mirrors>
```

#### 3. Knife4j访问404
```yaml
# 检查Spring Boot 3.x配置
knife4j:
  enable: true
  openapi:
    title: API文档
    group:
      default:
        group-name: 默认分组
        api-rule: package
        api-rule-resources:
          - com.example.controller
```

#### 4. MapStruct编译失败
```xml
<!-- 确保注解处理器正确配置 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <annotationProcessorPaths>
            <path>
                <groupId>org.mapstruct</groupId>
                <artifactId>mapstruct-processor</artifactId>
                <version>1.6.3</version>
            </path>
            <path>
                <groupId>org.projectlombok</groupId>
                <artifactId>lombok</artifactId>
                <version>${lombok.version}</version>
            </path>
        </annotationProcessorPaths>
    </configuration>
</plugin>
```

## 📈 性能优化建议

### 1. JVM参数优化
```bash
# JDK 8
java -Xms512m -Xmx2g -XX:+UseG1GC -jar app.jar

# JDK 17
java -Xms512m -Xmx2g --enable-preview -jar app.jar
```

### 2. Spring Boot配置优化
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false
  
server:
  tomcat:
    max-threads: 200
    accept-count: 100
```

## 📚 学习资源

- [Spring Boot官方文档](https://spring.io/projects/spring-boot)
- [MyBatis Plus文档](https://baomidou.com/)
- [MapStruct文档](https://mapstruct.org/)
- [Knife4j文档](https://doc.xiaominfo.com/)
- [Hutool文档](https://hutool.cn/)

## 🤝 获取帮助

如果遇到问题：
1. 查看控制台错误日志
2. 检查依赖版本兼容性
3. 参考官方文档
4. 搜索相关技术社区

---

🎉 **恭喜！** 环境搭建完成，现在可以开始使用Rest Code生成代码了！ 