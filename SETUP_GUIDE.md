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

    <groupId>com.yourcompany.software.test</groupId>
    <artifactId>test</artifactId>
    <version>1.0.0</version>
    <name>test</name>
    <description>REST API项目</description>

    <properties>
        <java.version>8</java.version>
        <mapstruct.version>1.6.3</mapstruct.version>
        <spring-boot.version>2.7.18</spring-boot.version>
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
            <version>${mapstruct.version}</version>
        </dependency>

        <!-- Knife4j API文档 -->
        <dependency>
            <groupId>com.github.xiaoymin</groupId>
            <artifactId>knife4j-openapi3-spring-boot-starter</artifactId>
            <version>4.5.0</version>
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
</project>
```

#### Spring Boot 3.x 项目配置

**主要变化：**
- Spring Boot版本：`3.5.0`
- JDK版本：`17`
- Knife4j依赖：`knife4j-openapi3-jakarta-spring-boot-starter`

```xml
<!-- 关键差异点 -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.0</version>
    <relativePath/>
</parent>
<properties>
    <java.version>17</java.version>
    <spring-boot.version>3.5.0</spring-boot.version>
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
      packages-to-scan: com.yourcompany.software.test.controller

# knife4j的增强配置，不需要增强可以不配
knife4j:
  enable: true
  setting:
    language: zh_cn

# 日志配置
logging:
  level:
    root: INFO
    com.yourcompany.software.test: DEBUG
  pattern:
    console: '%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n'
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

#### 2. MapStruct编译失败
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
                <version>${mapstruct.version}</version>
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