<template>
    <div class="environment-guide">
        <el-card class="guide-card">
            <template #header>
                <div class="card-header">
                    <el-icon class="header-icon"><Monitor /></el-icon>
                    <span>环境配置向导</span>
                </div>
            </template>
            
            <!-- 版本选择 -->
            <div class="section">
                <h3 class="section-title">选择您的技术栈</h3>
                <el-radio-group v-model="selectedStack" class="stack-selector">
                    <el-radio-button value="springboot2">
                        <div class="stack-option">
                            <div class="stack-title">Spring Boot 2.x</div>
                            <div class="stack-desc">JDK 8+ | 成熟稳定</div>
                        </div>
                    </el-radio-button>
                    <el-radio-button value="springboot3">
                        <div class="stack-option">
                            <div class="stack-title">Spring Boot 3.x</div>
                            <div class="stack-desc">JDK 17+ | 现代化</div>
                        </div>
                    </el-radio-button>
                </el-radio-group>
            </div>

            <!-- 环境要求 -->
            <div class="section">
                <h3 class="section-title">环境要求</h3>
                <div class="requirements">
                    <div class="requirement-item">
                        <el-icon class="req-icon java-icon"><Platform /></el-icon>
                        <div class="req-content">
                            <div class="req-title">JDK版本</div>
                            <div class="req-value">{{ currentRequirements.jdk }}</div>
                        </div>
                        <div class="req-status">
                            <el-button 
                                size="small" 
                                type="primary" 
                                link
                                @click="openJdkDownload"
                            >
                                下载
                            </el-button>
                        </div>
                    </div>
                    
                    <div class="requirement-item">
                        <el-icon class="req-icon maven-icon"><FolderOpened /></el-icon>
                        <div class="req-content">
                            <div class="req-title">构建工具</div>
                            <div class="req-value">Maven 3.6+ 或 Gradle {{ currentRequirements.gradle }}</div>
                        </div>
                        <div class="req-status">
                            <el-button 
                                size="small" 
                                type="primary" 
                                link
                                @click="openMavenDownload"
                            >
                                下载
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 关键依赖差异 -->
            <div class="section">
                <h3 class="section-title">关键依赖差异</h3>
                <el-table :data="dependencyDiff" class="diff-table" size="small">
                    <el-table-column prop="dependency" label="依赖" width="200">
                        <template #default="{ row }">
                            <div class="dep-name">{{ row.dependency }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="springboot2" label="Spring Boot 2.x">
                        <template #default="{ row }">
                            <el-tag size="small" type="info">{{ row.springboot2 }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="springboot3" label="Spring Boot 3.x">
                        <template #default="{ row }">
                            <el-tag size="small" type="success">{{ row.springboot3 }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="note" label="说明">
                        <template #default="{ row }">
                            <span class="dep-note">{{ row.note }}</span>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 快速开始步骤 -->
            <div class="section">
                <h3 class="section-title">快速开始步骤</h3>
                <el-steps :active="activeStep" direction="vertical" class="guide-steps">
                    <el-step 
                        title="生成项目模板" 
                        description="使用Rest Code生成包含所有依赖的项目模板"
                    >
                        <template #icon>
                            <el-icon><Box /></el-icon>
                        </template>
                    </el-step>
                    <el-step 
                        title="配置数据库" 
                        description="修改application.yml中的数据库连接信息"
                    >
                        <template #icon>
                            <el-icon><Connection /></el-icon>
                        </template>
                    </el-step>
                    <el-step 
                        title="编写RCS脚本" 
                        description="定义领域和API，生成业务代码"
                    >
                        <template #icon>
                            <el-icon><Edit /></el-icon>
                        </template>
                    </el-step>
                    <el-step 
                        title="启动项目" 
                        description="运行Spring Boot应用，访问API文档"
                    >
                        <template #icon>
                            <el-icon><VideoPlay /></el-icon>
                        </template>
                    </el-step>
                </el-steps>
            </div>

            <!-- 操作按钮 -->
            <div class="guide-actions">
                <el-button 
                    type="primary" 
                    size="large"
                    @click="generateTemplate"
                    :loading="isGenerating"
                >
                    <el-icon><Box /></el-icon>
                    生成 {{ currentStackName }} 项目模板
                </el-button>
                <el-button 
                    size="large"
                    @click="viewDocumentation"
                >
                    <el-icon><Document /></el-icon>
                    查看详细文档
                </el-button>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
    Monitor, 
    Platform, 
    FolderOpened, 
    Box, 
    Connection, 
    Edit, 
    VideoPlay, 
    Document 
} from '@element-plus/icons-vue'

const selectedStack = ref<'springboot2' | 'springboot3'>('springboot3')
const activeStep = ref(0)
const isGenerating = ref(false)

const emit = defineEmits<{
    generateTemplate: [stackType: 'springboot2' | 'springboot3']
}>()

// 当前技术栈要求
const currentRequirements = computed(() => {
    if (selectedStack.value === 'springboot2') {
        return {
            jdk: 'JDK 8+',
            gradle: '6.8+'
        }
    } else {
        return {
            jdk: 'JDK 17+',
            gradle: '7.5+'
        }
    }
})

// 当前技术栈名称
const currentStackName = computed(() => {
    return selectedStack.value === 'springboot2' ? 'Spring Boot 2.x' : 'Spring Boot 3.x'
})

// 依赖差异对比
const dependencyDiff = ref([
    {
        dependency: 'Knife4j API文档',
        springboot2: 'knife4j-openapi3-spring-boot-starter',
        springboot3: 'knife4j-openapi3-jakarta-spring-boot-starter',
        note: 'Spring Boot 3使用jakarta命名空间'
    },
    {
        dependency: 'Validation注解',
        springboot2: 'javax.validation.*',
        springboot3: 'jakarta.validation.*',
        note: '包路径发生变化'
    },
    {
        dependency: 'Servlet API',
        springboot2: 'javax.servlet.*',
        springboot3: 'jakarta.servlet.*',
        note: 'Jakarta EE规范'
    },
    {
        dependency: 'Persistence API',
        springboot2: 'javax.persistence.*',
        springboot3: 'jakarta.persistence.*',
        note: 'JPA规范更新'
    }
])

// 生成项目模板
const generateTemplate = async () => {
    isGenerating.value = true
    try {
        emit('generateTemplate', selectedStack.value)
        activeStep.value = 1
    } finally {
        isGenerating.value = false
    }
}

// 打开JDK下载页面
const openJdkDownload = () => {
    const url = selectedStack.value === 'springboot2' 
        ? 'https://www.oracle.com/java/technologies/javase/javase8-archive-downloads.html'
        : 'https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html'
    window.open(url, '_blank')
}

// 打开Maven下载页面
const openMavenDownload = () => {
    window.open('https://maven.apache.org/download.cgi', '_blank')
}

// 查看文档
const viewDocumentation = () => {
    // 这里可以打开项目的README或在线文档
    ElMessage.info('详细文档请查看项目README.md文件')
}
</script>

<style scoped>
.environment-guide {
    padding: 20px;
    max-width: 1000px;
    margin: 0 auto;
}

.guide-card {
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: none;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
}

.header-icon {
    font-size: 20px;
    color: #007AFF;
}

.section {
    margin-bottom: 32px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.stack-selector {
    display: flex;
    gap: 16px;
}

.stack-option {
    text-align: center;
    padding: 8px;
}

.stack-title {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
}

.stack-desc {
    font-size: 12px;
    color: #6c757d;
}

.requirements {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.requirement-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(0, 122, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(0, 122, 255, 0.1);
}

.req-icon {
    font-size: 24px;
    padding: 8px;
    border-radius: 8px;
}

.java-icon {
    background: linear-gradient(135deg, #f39c12, #e67e22);
    color: white;
}

.maven-icon {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
}

.req-content {
    flex: 1;
}

.req-title {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
}

.req-value {
    color: #6c757d;
    font-size: 14px;
}

.diff-table {
    border-radius: 8px;
    overflow: hidden;
}

.dep-name {
    font-weight: 500;
    color: #2c3e50;
}

.dep-note {
    font-size: 12px;
    color: #6c757d;
}

.guide-steps {
    margin: 20px 0;
}

.guide-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #eee;
}

:deep(.el-radio-button__inner) {
    border-radius: 12px;
    padding: 12px 20px;
    border: 2px solid rgba(0, 122, 255, 0.2);
    background: rgba(255, 255, 255, 0.9);
    transition: all 0.3s ease;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: linear-gradient(135deg, #007AFF, #0056CC);
    border-color: #007AFF;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

:deep(.el-step__icon) {
    border-radius: 50%;
    background: linear-gradient(135deg, #007AFF, #0056CC);
}

:deep(.el-step__title) {
    font-weight: 600;
}
</style> 