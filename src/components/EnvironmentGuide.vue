<template>
    <!-- 项目模板配置对话框 - 使用 Teleport 传送到 body -->
    <Teleport to="body">
        <div v-if="dialogVisible" class="dialog-overlay" @click="handleClose">
            <div class="modern-dialog template-dialog" @click.stop>
                <div class="dialog-header">
                    <div class="dialog-icon">⚙️</div>
                    <div class="dialog-title">
                        <h3>项目模板配置</h3>
                        <p>配置Spring Boot项目生成参数</p>
                    </div>
                    <button class="dialog-close-btn" @click="handleClose">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" />
                        </svg>
                    </button>
                </div>

                <div class="dialog-content">
                    <div class="scrollable-content">
                        <div class="environment-guide">
                            <!-- 版本选择 -->
                            <div class="section">
                                <h3 class="section-title">
                                    <el-icon>
                                        <Platform />
                                    </el-icon>
                                    技术栈版本
                                </h3>
                                <div class="selector-container">
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
                            </div>

                            <!-- 构建工具选择 -->
                            <div class="section">
                                <h3 class="section-title">
                                    <el-icon>
                                        <Tools />
                                    </el-icon>
                                    构建工具
                                </h3>
                                <div class="selector-container">
                                    <el-radio-group v-model="selectedBuildTool" class="build-tool-selector">
                                        <el-radio-button value="maven">
                                            <div class="tool-option">
                                                <div class="tool-title">Maven</div>
                                                <div class="tool-desc">XML配置 | 传统稳定</div>
                                            </div>
                                        </el-radio-button>
                                        <el-radio-button value="gradle">
                                            <div class="tool-option">
                                                <div class="tool-title">Gradle</div>
                                                <div class="tool-desc">Groovy/Kotlin DSL | 现代化</div>
                                            </div>
                                        </el-radio-button>
                                    </el-radio-group>
                                </div>
                            </div>

                            <!-- 环境要求 -->
                            <div class="section">
                                <h3 class="section-title">
                                    <el-icon>
                                        <Monitor />
                                    </el-icon>
                                    环境要求
                                </h3>
                                <div class="requirements">
                                    <div class="requirement-item">
                                        <el-icon class="req-icon java-icon">
                                            <Platform />
                                        </el-icon>
                                        <div class="req-content">
                                            <div class="req-title">JDK版本</div>
                                            <div class="req-value">{{ currentRequirements.jdk }}</div>
                                        </div>
                                        <div class="req-status">
                                            <el-button size="small" type="primary" link @click="openJdkDownload">
                                                下载
                                            </el-button>
                                        </div>
                                    </div>

                                    <div class="requirement-item">
                                        <el-icon class="req-icon maven-icon">
                                            <FolderOpened />
                                        </el-icon>
                                        <div class="req-content">
                                            <div class="req-title">构建工具</div>
                                            <div class="req-value">{{ currentBuildToolName }} {{
                                                currentRequirements.version }}</div>
                                        </div>
                                        <div class="req-status">
                                            <el-button size="small" type="primary" link @click="openBuildToolDownload">
                                                下载
                                            </el-button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 关键依赖差异 -->
                            <div class="section">
                                <h3 class="section-title">
                                    <el-icon>
                                        <List />
                                    </el-icon>
                                    关键依赖差异
                                </h3>
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
                        </div>
                    </div>
                </div>

                <div class="dialog-footer">
                    <button class="btn-secondary" @click="handleClose">
                        <svg width="16" height="16" viewBox="0 0 16 16" style="margin-right: 6px;">
                            <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" />
                        </svg>
                        取消
                    </button>
                    <button class="btn-primary" @click="generateTemplate" :disabled="isGenerating">
                        <el-icon v-if="isGenerating" class="is-loading">
                            <Loading />
                        </el-icon>
                        <el-icon v-else>
                            <Box />
                        </el-icon>
                        {{ isGenerating ? '生成中...' : '生成项目模板' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
    Monitor,
    Platform,
    FolderOpened,
    Box,
    Tools,
    List,
    Loading
} from '@element-plus/icons-vue'

// 弹窗显示状态
const dialogVisible = ref(false)
const selectedStack = ref<'springboot2' | 'springboot3'>('springboot3')
const selectedBuildTool = ref<'maven' | 'gradle'>('maven')
const isGenerating = ref(false)

const emit = defineEmits<{
    generateTemplate: [config: {
        stackType: 'springboot2' | 'springboot3',
        buildTool: 'maven' | 'gradle',
        outputDirectory: string
    }]
}>()

// 当前技术栈要求
const currentRequirements = computed(() => {
    if (selectedStack.value === 'springboot2') {
        return {
            jdk: 'JDK 8+',
            version: selectedBuildTool.value === 'maven' ? '3.6+' : '6.8+'
        }
    } else {
        return {
            jdk: 'JDK 17+',
            version: selectedBuildTool.value === 'maven' ? '3.6+' : '7.5+'
        }
    }
})

// 当前构建工具名称
const currentBuildToolName = computed(() => {
    return selectedBuildTool.value === 'maven' ? 'Maven' : 'Gradle'
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

// 生成项目模板 - 直接选择目录并生成
const generateTemplate = async () => {
    try {
        // 先选择目录
        const { filePaths, canceled } = await window.api.showOpenDialog({
            properties: ['openDirectory'],
            title: '选择项目生成目录'
        })

        if (canceled || !filePaths || filePaths.length === 0) {
            return // 用户取消选择
        }

        const selectedDirectory = filePaths[0]
        isGenerating.value = true

        emit('generateTemplate', {
            stackType: selectedStack.value,
            buildTool: selectedBuildTool.value,
            outputDirectory: selectedDirectory
        })

        // 关闭弹窗
        dialogVisible.value = false
    } catch (error) {
        console.error('选择目录失败:', error)
        ElMessage.error('选择目录失败')
    } finally {
        isGenerating.value = false
    }
}

// 打开JDK下载页面
const openJdkDownload = () => {
    const url = selectedStack.value === 'springboot2'
        ? 'https://www.oracle.com/java/technologies/javase/javase8-archive-downloads.html'
        : 'https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html'

    if (window.api?.openExternal) {
        window.api.openExternal(url)
    } else {
        window.open(url, '_blank')
    }
}

// 打开构建工具下载页面
const openBuildToolDownload = () => {
    const url = selectedBuildTool.value === 'maven'
        ? 'https://maven.apache.org/download.cgi'
        : 'https://gradle.org/install/'

    if (window.api?.openExternal) {
        window.api.openExternal(url)
    } else {
        window.open(url, '_blank')
    }
}

// 关闭弹窗
const handleClose = () => {
    dialogVisible.value = false
}

// 显示弹窗的方法
const show = () => {
    dialogVisible.value = true
}

// 暴露给父组件的方法
defineExpose({
    show
})
</script>

<style scoped>
/* 弹窗基础样式 */
.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.modern-dialog {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(25px);
    border-radius: 20px;
    box-shadow:
        0 25px 80px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.5) inset;
    border: 1px solid rgba(255, 255, 255, 0.4);
    overflow: hidden;
    animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modern-dialog::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #FF3B30, #FF9500, #FFCC02, #34C759, #007AFF, #5856D6, #AF52DE);
    opacity: 0.8;
}

.dialog-header {
    padding: 24px 28px 20px;
    background: linear-gradient(135deg,
            rgba(175, 82, 222, 0.08) 0%,
            rgba(191, 90, 242, 0.08) 50%,
            rgba(218, 112, 214, 0.08) 100%);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
}

.dialog-icon {
    font-size: 32px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.dialog-title {
    flex: 1;
}

.dialog-title h3 {
    margin: 0 0 4px 0;
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    background: linear-gradient(135deg, #2c3e50, #AF52DE);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.dialog-title p {
    margin: 0;
    font-size: 14px;
    color: #6c757d;
    font-weight: 500;
}

.dialog-close-btn {
    width: 55px;
    height: 32px;
    border: none;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    color: #6c757d;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.dialog-close-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    transform: scale(1.1);
}

.dialog-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.dialog-footer {
    padding: 20px 28px 24px;
    background: linear-gradient(135deg,
            rgba(248, 250, 252, 0.95) 0%,
            rgba(255, 255, 255, 0.9) 100%);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-shrink: 0;
}

/* 滚动内容区域 */
.scrollable-content {
    flex: 1;
    padding: 24px 28px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(175, 82, 222, 0.3) transparent;
}

.scrollable-content::-webkit-scrollbar {
    width: 8px;
}

.scrollable-content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
}

.scrollable-content::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(175, 82, 222, 0.4), rgba(191, 90, 242, 0.4));
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: padding-box;
}

/* 模板配置弹窗特殊样式 */
.template-dialog {
    width: 80vw;
    max-width: 900px;
}

.template-dialog .dialog-header {
    background: linear-gradient(135deg,
            rgba(0, 122, 255, 0.08) 0%,
            rgba(88, 196, 250, 0.08) 50%,
            rgba(30, 144, 255, 0.08) 100%);
    border-bottom-color: rgba(0, 122, 255, 0.1);
}

.template-dialog .dialog-title h3 {
    background: linear-gradient(135deg, #2c3e50, #007AFF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.template-dialog .scrollable-content {
    scrollbar-color: rgba(0, 122, 255, 0.3) transparent;
}

.template-dialog .scrollable-content::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.4), rgba(88, 196, 250, 0.4));
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: padding-box;
}

.environment-guide {
    width: 100%;
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

/* 选择器容器 - 添加圆角背景 */
.selector-container {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(0, 122, 255, 0.1);
    backdrop-filter: blur(10px);
    box-shadow:
        0 4px 20px rgba(0, 122, 255, 0.08),
        0 0 0 1px rgba(255, 255, 255, 0.5) inset;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.selector-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #007AFF, #5AC8FA, #34C759);
    opacity: 0.6;
    border-radius: 16px 16px 0 0;
}

.selector-container:hover {
    transform: translateY(-2px);
    box-shadow:
        0 8px 30px rgba(0, 122, 255, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.6) inset;
    border-color: rgba(0, 122, 255, 0.2);
}

.selector-container:hover::before {
    opacity: 0.8;
    background: linear-gradient(90deg, #007AFF, #5AC8FA, #34C759, #FF9500, #AF52DE);
}

.stack-selector,
.build-tool-selector {
    display: flex;
    gap: 16px;
    position: relative;
    z-index: 1;
}

.stack-option,
.tool-option {
    text-align: center;
    padding: 8px;
}

.stack-title,
.tool-title {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
}

.stack-desc,
.tool-desc {
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

/* 现代化按钮样式 */
.btn-primary,
.btn-secondary {
    border: none;
    border-radius: 12px;
    padding: 12px 24px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    min-height: 44px;
}

.btn-primary {
    background: linear-gradient(135deg, #007AFF, #5AC8FA);
    color: white;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 122, 255, 0.4);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

.btn-secondary {
    background: rgba(108, 117, 125, 0.1);
    color: #6c757d;
    border: 1px solid rgba(108, 117, 125, 0.2);
}

.btn-secondary:hover {
    background: rgba(108, 117, 125, 0.15);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(108, 117, 125, 0.2);
}

/* 加载动画 */
.is-loading {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* Radio Button 样式优化 - 更现代化的圆角 */
:deep(.el-radio-button__inner) {
    border-radius: 16px;
    padding: 16px 24px;
    border: 2px solid rgba(0, 122, 255, 0.15);
    background: rgba(255, 255, 255, 0.9);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.05);
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;
}

:deep(.el-radio-button__inner::before) {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.6s ease;
}

:deep(.el-radio-button__inner:hover::before) {
    left: 100%;
}

:deep(.el-radio-button__inner:hover) {
    border-color: rgba(0, 122, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 122, 255, 0.15);
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: linear-gradient(135deg, #007AFF, #5AC8FA);
    border-color: #007AFF;
    color: white;
    box-shadow:
        0 8px 25px rgba(0, 122, 255, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.2) inset;
    transform: translateY(-2px);
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner::after) {
    content: '✨';
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 12px;
    opacity: 0.8;
    animation: glow 2s ease-in-out infinite;
}

@keyframes glow {

    0%,
    100% {
        opacity: 0.6;
        transform: scale(1);
    }

    50% {
        opacity: 1;
        transform: scale(1.1);
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .template-dialog {
        width: 95vw;
        max-width: none;
    }

    .stack-selector,
    .build-tool-selector {
        flex-direction: column;
        gap: 12px;
    }

    .requirement-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .dialog-footer {
        flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
        width: 100%;
        justify-content: center;
    }
}
</style>