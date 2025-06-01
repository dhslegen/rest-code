<template>
    <div class="code-generator">
        <el-form :model="config" class="modern-form">
            <!-- 作者和Spring Boot版本 -->
            <div class="form-item">
                    <label class="form-label">作者</label>
                        <el-input 
                            v-model="config.author" 
                            placeholder="例如：zhaowenhao"
                            class="modern-input"
                        />
                    </div>

            <div class="form-item">
                <label class="form-label">Spring Boot 版本</label>
                        <el-radio-group v-model="config.springBootVersion" class="modern-radio-group">
                                <el-radio value="2" class="modern-radio">Spring Boot 2</el-radio>
                                <el-radio value="3" class="modern-radio">Spring Boot 3</el-radio>
                        </el-radio-group>
            </div>

            <!-- 前置框架包名 -->
            <div class="form-item">
                <label class="form-label">前置框架包名（可选）</label>
                    <el-input 
                        v-model="config.frameworkBasePackage" 
                        placeholder="留空自动生成基础框架 | 有框架时填写，如：com.yourcompany.software.deepcloud"
                        class="modern-input"
                        clearable
                    >
                        <template #suffix>
                            <el-tooltip
                                effect="dark"
                                placement="top"
                                :content="frameworkTooltipContent"
                                raw-content>
                                <el-icon class="help-icon">
                                    <QuestionFilled />
                                </el-icon>
                            </el-tooltip>
                        </template>
                    </el-input>
            </div>
            
            <!-- 前置框架包名提示 -->
            <div class="form-item">
                <label class="form-label"></label>
                    <div class="input-tip">
                        <span v-if="!config.frameworkBasePackage.trim()" class="tip-auto">
                            💡 未填写：将在源码基本包名下自动生成 core 基础框架（Result、BusinessException等）
                        </span>
                        <span v-else class="tip-existing">
                            ✅ 已填写：将使用现有框架的 common.model.Result 等类，无需生成基础框架
                        </span>
                </div>
            </div>

            <!-- 源码输出路径 -->
            <div class="form-item">
                <label class="form-label">源码输出路径</label>
                    <el-input 
                        v-model="config.outputPath" 
                        placeholder="例如：/.../src/main/java"
                        class="modern-input"
                    >
                        <template #append>
                            <el-button 
                                :icon="FolderOpened" 
                                @click="selectOutputPath"
                                class="path-btn"
                            />
                        </template>
                    </el-input>
            </div>

            <!-- 源码基本包名 -->
            <div class="form-item">
                <label class="form-label">源码基本包名</label>
                    <el-input 
                        v-model="config.basePackage" 
                        placeholder="例如：com.yourcompany.software.system.demo"
                        class="modern-input"
                    />
            </div>

            <!-- 生成方式 -->
            <div class="form-item">
                    <label class="form-label">生成方式</label>
                        <el-radio-group v-model="config.mode" class="modern-radio-group">
                    <el-radio value="overwrite" class="modern-radio">
                        覆盖模式 <span class="radio-desc">完全重新生成</span>
                    </el-radio>
                    <el-radio value="incremental" class="modern-radio">
                        增量模式 <span class="radio-desc">仅添加新内容</span>
                    </el-radio>
                        </el-radio-group>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
                <el-button 
                    class="action-btn template-btn" 
                    @click.stop="openTemplateDialog"
                >
                    <el-icon><Box /></el-icon>
                    生成项目模板
                </el-button>
                <el-button 
                    class="action-btn preview-btn" 
                    @click.stop="previewCode"
                >
                    <el-icon><View /></el-icon>
                    预览代码
                </el-button>
                <el-button 
                    class="action-btn generate-btn" 
                    @click.stop="generateCode"
                >
                    <el-icon><Tools /></el-icon>
                    生成代码
                </el-button>
            </div>
        </el-form>
        
        <!-- 环境配置向导 -->
        <environment-guide 
            ref="environmentGuideRef" 
            @generate-template="handleTemplateGeneration"
        />
    </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref, computed, nextTick } from 'vue'
import { useStore } from '../store/'
import { ElMessage, ElMessageBox } from 'element-plus'
import { generateJavaCode } from '../code-generator'
import { generateProjectTemplate } from '../code-generator'
import type { Config } from '../types'
import { FolderOpened, Loading, QuestionFilled, View, Tools, Box } from '@element-plus/icons-vue'
import EnvironmentGuide from './EnvironmentGuide.vue'

const store = useStore()

// 定义 props
const props = defineProps<{
    scriptEditorRef?: { getCurrentContent?: () => string }
}>()

// 定义 emit
const emit = defineEmits<{
  previewCode: [content: string]
}>()

// 环境向导组件引用
const environmentGuideRef = ref()

// 默认配置
const defaultConfig: Config = {
    author: '',
    frameworkBasePackage: '',
    outputPath: '',
    basePackage: '',
    mode: 'overwrite',
    springBootVersion: '3',
}

// 从 localStorage 中加载配置
const savedConfig = localStorage.getItem('codeGeneratorConfig')
const config = reactive<Config>(savedConfig ? JSON.parse(savedConfig) : defaultConfig)

// 获取当前脚本内容的统一方法
const getCurrentRcsContent = (): string => {
    // 优先使用脚本编辑器的内容
    if (props.scriptEditorRef?.getCurrentContent) {
        return props.scriptEditorRef.getCurrentContent()
    }
    // 兜底使用 store 的内容
    return store.generateRcsContent()
}

// 监听配置变化，保存到 localStorage
watch(config, (newConfig) => {
    localStorage.setItem('codeGeneratorConfig', JSON.stringify(newConfig))
}, { deep: true })

// 框架包名提示内容
const frameworkTooltipContent = computed(() => `
<div style="max-width: 320px; line-height: 1.5;">
    <p><strong>前置框架包名说明：</strong></p>
    <p><strong>不填写时：</strong><br/>
    系统将在您的"源码基本包名"下自动生成完整的基础框架：</p>
    <ul style="margin: 8px 0; padding-left: 20px;">
        <li>core.Result.java - 统一响应封装</li>
        <li>core.exception.BusinessException.java - 业务异常</li>
        <li>core.code.CodeMsg.java - 错误码接口</li>
        <li>core.code.ResponseCode.java - 响应码枚举</li>
        <li>core.tree.* - 树形结构工具类</li>
    </ul>
    <p><strong>填写时：</strong><br/>
    表示您已有前置框架（如deep-cloud脚手架），生成的代码将直接引用框架中的类，如：<br/>
    <code>框架包名.common.model.Result</code><br/>
    <code>框架包名.common.utils.tree.TreeNode</code><br/>
    <code>框架包名.common.utils.tree.AbstractTreeNode</code></p>
    <p style="color: #E6A23C;">💡 建议：新项目留空，现有项目填写框架包名</p>
</div>
`)

const generateCode = async () => {
    try {
        // 使用编辑器内容进行校验
        const rcsContent = getCurrentRcsContent()
        const validation = store.validateRcsContent(rcsContent)
        
        if (!validation.isValid) {
            ElMessage.error(`脚本校验失败，发现 ${validation.errors.length} 个错误，无法生成代码`)
            // 直接触发错误弹窗显示
            store.showErrorPopover = true
            await nextTick()
            store.triggerErrorDisplay = true
            return
        }
        
        await generateJavaCode(config, rcsContent)
        ElMessage.success('代码生成成功')
    } catch (error) {
        console.error(error)
        ElMessage.error('代码生成失败')
    }
}

const selectOutputPath = async () => {
    const { filePaths, canceled } = await window.api.showOpenDialog({
        properties: ['openDirectory']
    })
    if (!canceled && filePaths && filePaths.length > 0) {
        config.outputPath = filePaths[0]
    }
}

const previewCode = async () => {
    try {
        // 使用编辑器内容进行校验
        const rcsContent = getCurrentRcsContent()
        const validation = store.validateRcsContent(rcsContent)
        
        if (!validation.isValid) {
            ElMessage.error(`脚本校验失败，发现 ${validation.errors.length} 个错误，无法预览代码`)
            // 直接触发错误弹窗显示
            store.showErrorPopover = true
            await nextTick()
            store.triggerErrorDisplay = true
            return
        }
        
        const generatedFiles = await generateJavaCode(config, rcsContent, true)
        let markdownContent = ''
        generatedFiles.forEach((file) => {
            markdownContent += `### ${file.filePath}\n\n`
            markdownContent += '```java\n' + file.content + '\n```\n\n'
        })
        // 发射事件到父组件
        emit('previewCode', markdownContent)
    } catch (error) {
        console.error(error)
        ElMessage.error('代码预览失败')
    }
}

// 打开项目模板配置弹窗
const openTemplateDialog = () => {
    // 验证基本配置
    if (!config.basePackage) {
        ElMessage.error('请先设置基础包名')
        return
    }
    
    environmentGuideRef.value?.show()
}

// 处理环境向导的模板生成
const handleTemplateGeneration = async (templateConfig: {
    stackType: 'springboot2' | 'springboot3',
    buildTool: 'maven' | 'gradle',
    outputDirectory: string
}) => {
    try {
        // 创建临时配置，使用选择的Spring Boot版本
        const tempConfig = {
            ...config,
            springBootVersion: templateConfig.stackType === 'springboot2' ? '2' as const : '3' as const
        }

        // 生成项目模板
        const templateFiles = await generateProjectTemplate(tempConfig, templateConfig.buildTool)
        
        // 写入文件
        for (const file of templateFiles) {
            const fullPath = window.api.join(templateConfig.outputDirectory, file.filePath)
            ensureDirectoryExistence(fullPath)
            window.api.writeFile(fullPath, file.content)
        }

        // 只显示详细的完成消息框，移除简单的成功消息以避免重复
        const fileList = templateFiles.map(f => f.filePath).join('\n')
        await ElMessageBox.alert(
            `项目模板生成成功！包含 ${templateFiles.length} 个文件\n\n生成的文件：\n${fileList}\n\n下一步：\n1. 在IDE中打开项目\n2. 配置数据库连接\n3. 使用Rest Code生成业务代码`, 
            '项目模板生成完成', 
            { 
                type: 'success',
                customStyle: {
                    zIndex: 99999
                }
            }
        )
    } catch (error) {
        console.error(error)
        ElMessage.error('项目模板生成失败')
    }
}

const ensureDirectoryExistence = (filePath: string) => {
    const dirname = window.api.dirname(filePath)
    if (!window.api.exists(dirname)) {
        window.api.mkdir(dirname)
    }
}
</script>

<style scoped>
.code-generator {
    height: 100%;
}

.modern-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
}

.form-item {
    display: flex;
    gap: 12px;
    min-height: 32px;
}

.form-item.full-width {
    grid-column: 1 / -1;
}

.form-label {
    font-size: 13px;
    font-weight: 600;
    color: #2c3e50;
    letter-spacing: -0.1px;
    min-width: 145px;
    flex-shrink: 0;
    line-height: 32px;
    text-align: right;
    padding-right: 8px;
}

.input-wrapper {
    position: relative;
}

:deep(.modern-input) {
    --el-input-border-radius: 12px;
    --el-input-border-color: rgba(0, 0, 0, 0.1);
    --el-input-focus-border-color: #007AFF;
    --el-input-hover-border-color: rgba(0, 122, 255, 0.3);
    flex: 1;
}

:deep(.modern-input .el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    height: 32px;
}

:deep(.modern-input .el-input__wrapper:hover) {
    border-color: rgba(0, 122, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.1);
}

:deep(.modern-input .el-input__wrapper.is-focus) {
    border-color: #007AFF;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.help-icon {
    cursor: help;
    color: #909399;
    transition: color 0.2s;
}

.help-icon:hover {
    color: #007AFF;
}

.input-tip {
    font-size: 11px;
    line-height: 1.4;
    margin-left: 0;
    flex: 1;
}

.tip-auto {
    color: #6c757d;
}

.tip-existing {
    color: #28a745;
}

.modern-radio-group {
    flex: 1;
    display: flex;
    gap: 16px;
    align-items: center;
}

:deep(.modern-radio) {
    --el-radio-font-size: 13px;
    --el-radio-text-color: #2c3e50;
    margin: 0;
}

:deep(.modern-radio .el-radio__input.is-checked .el-radio__inner) {
    background-color: #007AFF;
    border-color: #007AFF;
}

:deep(.modern-radio .el-radio__input.is-checked + .el-radio__label) {
    color: #007AFF;
    font-weight: 500;
}

.radio-desc {
    font-size: 11px;
    color: #6c757d;
    margin-left: 4px;
}

.path-btn {
    background: linear-gradient(135deg, #007AFF, #5AC8FA);
    border: none;
    color: white;
    padding: 0 16px;
}

.path-btn:hover {
    background: linear-gradient(135deg, #0051D5, #32A3F7);
}

.action-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    padding-top: 8px;
}

.action-btn {
    flex: 1;
    height: 36px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.action-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.action-btn:hover::before {
    left: 100%;
}

.decrypt-btn {
    background: linear-gradient(135deg, #ffc107, #e0a800);
    color: white;
}

.decrypt-btn:hover {
    background: linear-gradient(135deg, #5a6268, #495057);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.preview-btn {
    background: linear-gradient(135deg, #17a2b8, #138496);
    color: white;
}

.preview-btn:hover {
    background: linear-gradient(135deg, #138496, #117a8b);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
}

.generate-btn {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
}

.generate-btn:hover {
    background: linear-gradient(135deg, #20c997, #1dd1a1);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.template-btn {
    background: linear-gradient(135deg, #6f42c1, #563d7c);
    color: white;
}

.template-btn:hover {
    background: linear-gradient(135deg, #563d7c, #495057);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(111, 66, 193, 0.3);
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .form-item {
        grid-template-columns: 1fr;
        gap: 16px;
    }
    
    .action-buttons {
        flex-direction: column;
        gap: 12px;
    }
    
    .action-btn {
        width: 100%;
    }
    
    .form-label {
        min-width: 100px; /* 在小屏幕上减少label宽度 */
    }
    
    .modern-radio-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
}

@media (max-width: 768px) {
    .modern-form {
        gap: 10px; /* 在移动端进一步减少间距 */
    }
    
    .form-item {
        flex-direction: column; /* 在小屏幕上垂直排列 */
        align-items: flex-start;
        gap: 4px;
    }
    
    .form-label {
        min-width: auto;
        text-align: left;
        padding-right: 0;
        line-height: 1.4;
    }
    
    .modern-radio-group {
        width: 100%;
    }
    
    .action-btn {
        height: 40px;
        font-size: 13px;
    }
}

/* 美化下拉框选项 - 根据实际DOM结构 */
:deep(.el-select__popper) {
    z-index: 2020 !important;
}

:deep(.el-select__popper .el-select-dropdown) {
    background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.98) 0%, 
        rgba(248, 250, 252, 0.95) 100%
    ) !important;
    backdrop-filter: blur(25px) !important;
    border: 1px solid rgba(255, 149, 0, 0.15) !important;
    border-radius: 16px !important;
    box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
    padding: 12px 0 !important;
    margin-top: 8px !important;
    min-width: 200px !important;
    animation: dropdownSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:deep(.el-select__popper[data-popper-placement*="top"] .el-select-dropdown) {
    transform: translateY(4px) !important;
}

:deep(.el-select__popper[data-popper-placement*="bottom"] .el-select-dropdown) {
    transform: translateY(-4px) !important;
}

@keyframes dropdownSlideIn {
    0% {
        opacity: 0;
        transform: translateY(-8px) scale(0.95);
    }
    100% {
        opacity: 1;
        transform: translateY(-4px) scale(1);
    }
}
</style>
