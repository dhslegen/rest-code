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
                    placeholder="留空自动生成基础框架 | 有框架时填写，如：com.wanji.software.deepcloud"
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
                    placeholder="例如：com.wanji.software.tocc.system.uaa"
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
                    class="action-btn decrypt-btn" 
                    @click.stop="decryptFiles"
                    :title="'解密输出路径中的所有文件，Rest Code 已加入加密软件白名单，因此此功能只用作备选方案，您也可以把它作为批量解密文件的小工具'"
                >
                    <el-icon><Unlock /></el-icon>
                    解密文件
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

        <el-dialog v-model="decrypting" title="解密中" :modal="true" :close-on-click-modal="false"
            :close-on-press-escape="false" width="300px" :show-close="false">
            <div style="text-align: center;">
                <el-icon>
                    <Loading />
                </el-icon>
                <p>正在解密，请稍候...</p>
            </div>
        </el-dialog>

        <el-dialog 
            title="代码预览" 
            v-model="showPreviewDialog" 
            width="80%" 
            class="preview-dialog" 
            center
            append-to-body
            :modal="true"
        >
            <div v-html="previewContentHtml" class="preview-content"></div>
            <template #footer>
                <el-button class="dialog-btn" @click="showPreviewDialog = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref, computed, nextTick } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'
import { generateJavaCode } from '../code-generator'
import type { Config } from '../types'
import { FolderOpened, Loading, QuestionFilled, Unlock, View, Tools } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const store = useStore()

// 定义 props
const props = defineProps<{
    scriptEditorRef?: { getCurrentContent?: () => string }
}>()

// 默认配置
const defaultConfig: Config = {
    author: '',
    frameworkBasePackage: '',
    outputPath: '',
    basePackage: '',
    mode: 'overwrite',
    springBootVersion: '2',
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
const previewContent = ref('')
const showPreviewDialog = ref(false)

const md: MarkdownIt = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str, lang) => {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return (
                    '<pre class="hljs"><code>' +
                    hljs.highlight(str, { language: lang }).value +
                    '</code></pre>'
                )
            } catch (_) { }
        }
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
    },
})

const previewContentHtml = computed(() => md.render(previewContent.value))

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
        previewContent.value = markdownContent
        showPreviewDialog.value = true
    } catch (error) {
        console.error(error)
        ElMessage.error('代码预览失败')
    }
}
const decrypting = ref(false)

const decryptFiles = async () => {
    if (!config.outputPath || !window.api.exists(config.outputPath)) {
        ElMessage.error('请先选择有效的输出路径');
        return;
    }
    decrypting.value = true;
    try {
        const result = await window.api.decryptFiles(config.outputPath);
        if (!result.success) {
            ElMessage.error('解密失败：' + (result.error || '未知错误'));
            decrypting.value = false;
            return;
        }
        decrypting.value = false;
        ElMessage.success('解密成功');
    } catch (error) {
        console.error(error);
        decrypting.value = false;
        ElMessage.error('解密失败');
    }
};
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

/* 预览对话框样式 */
:deep(.preview-dialog) {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    z-index: 3000 !important;
    position: fixed !important;
}

:deep(.preview-dialog .el-overlay) {
    z-index: 2999 !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
}

/* 确保弹窗内容不被父容器影响 */
:deep(.el-dialog__wrapper) {
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    z-index: 3000 !important;
}

:deep(.preview-dialog .el-dialog__header) {
    background: linear-gradient(135deg, 
        rgba(0, 122, 255, 0.08) 0%, 
        rgba(90, 200, 250, 0.08) 50%, 
        rgba(52, 199, 89, 0.08) 100%
    );
    padding: 24px 28px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    position: relative;
}

:deep(.preview-dialog .el-dialog__header::before) {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #FF3B30, #FF9500, #FFCC02, #34C759, #007AFF, #5AC8FA, #AF52DE);
    border-radius: 20px 20px 0 0;
}

:deep(.preview-dialog .el-dialog__title) {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.3px;
    background: linear-gradient(135deg, #2c3e50, #007AFF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

:deep(.preview-dialog .el-dialog__body) {
    padding: 0;
    background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.98) 0%, 
        rgba(248, 250, 252, 0.95) 100%
    );
    max-height: 70vh;
    border-radius: 0 0 20px 20px;
}

.preview-content {
    height: 510px;
    overflow: auto;
    padding: 28px;
    background: transparent;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 122, 255, 0.3) transparent;
}

.preview-content::-webkit-scrollbar {
    width: 8px;
}

.preview-content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
}

.preview-content::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.4), rgba(90, 200, 250, 0.4));
    border-radius: 4px;
}

.preview-content :deep(pre) {
    background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.95) 0%, 
        rgba(248, 250, 252, 0.9) 100%
    );
    border-radius: 16px;
    padding: 24px;
    margin: 20px 0;
    border: 1px solid rgba(0, 122, 255, 0.1);
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    position: relative;
    overflow-x: auto;
}

.preview-content :deep(pre::before) {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #007AFF, #5AC8FA, #34C759);
    border-radius: 16px 16px 0 0;
}

.preview-content :deep(pre code) {
    font-family: 'SF Mono', 'Monaco', 'Consolas', 'Roboto Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #2c3e50;
    background: transparent;
}

.preview-content :deep(h3) {
    color: #1a1a1a;
    font-size: 18px;
    font-weight: 700;
    margin: 32px 0 16px 0;
    padding: 12px 20px;
    background: linear-gradient(135deg, 
        rgba(0, 122, 255, 0.08) 0%, 
        rgba(90, 200, 250, 0.08) 100%
    );
    border-radius: 12px;
    border-left: 4px solid #007AFF;
    position: relative;
    letter-spacing: -0.2px;
}

.preview-content :deep(h3::before) {
    content: '📄';
    margin-right: 8px;
    font-size: 16px;
}

:deep(.preview-dialog .el-dialog__footer) {
    background: linear-gradient(135deg, 
        rgba(248, 250, 252, 0.95) 0%, 
        rgba(255, 255, 255, 0.9) 100%
    );
    padding: 20px 28px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    text-align: center;
    border-radius: 0 0 20px 20px;
}

.dialog-btn {
    background: linear-gradient(135deg, #007AFF, #5AC8FA);
    border: none;
    color: white;
    padding: 12px 32px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
    position: relative;
    overflow: hidden;
}

.dialog-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
}

.dialog-btn:hover::before {
    left: 100%;
}

.dialog-btn:hover {
    background: linear-gradient(135deg, #0051D5, #32A3F7);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4);
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

:deep(.el-select-dropdown__item) {
    padding: 12px 20px !important;
    font-size: 14px !important;
    color: #2c3e50 !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    border-radius: 12px !important;
    margin: 3px 12px !important;
    background: transparent !important;
    position: relative !important;
    font-weight: 500 !important;
    letter-spacing: -0.1px !important;
}

:deep(.el-select-dropdown__item span) {
    position: relative !important;
    z-index: 2 !important;
}

:deep(.el-select-dropdown__item::before) {
    content: '' !important;
    position: absolute !important;
    left: 8px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    width: 3px !important;
    height: 0 !important;
    background: linear-gradient(135deg, #FF9500, #FFCC02) !important;
    border-radius: 2px !important;
    transition: height 0.3s ease !important;
    z-index: 1 !important;
}

:deep(.el-select-dropdown__item:hover) {
    background: linear-gradient(135deg, 
        rgba(255, 149, 0, 0.12) 0%, 
        rgba(255, 204, 2, 0.08) 100%
    ) !important;
    color: #FF9500 !important;
    transform: translateX(4px) scale(1.02) !important;
    box-shadow: 0 4px 20px rgba(255, 149, 0, 0.15) !important;
}

:deep(.el-select-dropdown__item:hover::before) {
    height: 20px !important;
}

:deep(.el-select-dropdown__item:hover span) {
    color: #FF9500 !important;
    font-weight: 600 !important;
}

:deep(.el-select-dropdown__item.is-selected) {
    background: linear-gradient(135deg, 
        rgba(255, 149, 0, 0.18) 0%, 
        rgba(255, 204, 2, 0.12) 100%
    ) !important;
    color: #FF9500 !important;
    font-weight: 700 !important;
    box-shadow: 0 4px 20px rgba(255, 149, 0, 0.2) !important;
}

:deep(.el-select-dropdown__item.is-selected::before) {
    height: 24px !important;
    background: linear-gradient(135deg, #FF9500, #FFCC02, #34C759) !important;
}

:deep(.el-select-dropdown__item.is-selected span) {
    color: #FF9500 !important;
    font-weight: 700 !important;
}

:deep(.el-select-dropdown__item.is-selected::after) {
    content: '🔥' !important;
    position: absolute !important;
    right: 16px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    font-size: 16px !important;
    animation: selectedGlow 1.5s ease-in-out infinite !important;
    z-index: 2 !important;
}

@keyframes selectedGlow {
    0%, 100% {
        opacity: 0.8;
        transform: translateY(-50%) scale(1);
    }
    50% {
        opacity: 1;
        transform: translateY(-50%) scale(1.1);
    }
}

/* 优化输入框附加按钮样式 */
:deep(.el-input-group__append) {
    box-shadow: none !important; /* 禁用默认阴影 */
    background-color: transparent !important; /* 禁用默认背景色 */
    padding: 0 30px !important; /* 调大padding */
    border-left: 0 !important; /* 移除左边框 */
}

:deep(.el-input-group__append button.el-button) {
    color: white !important; /* 覆盖inherit，使用白色文字 */
}

:deep(.el-input-group__append button.el-button:hover) {
    color: white !important; /* 悬停时也保持白色 */
}
</style>
