<template>
    <el-form :model="config" label-width="130px">
        <el-form-item label="作者">
            <el-input v-model="config.author" :placeholder="'例如：zhaowenhao'"></el-input>
        </el-form-item>
        <el-form-item label="前置框架包名（可选）">
            <el-input 
                v-model="config.frameworkBasePackage" 
                :placeholder="'留空自动生成基础框架 | 有框架时填写，如：com.wanji.software.deepcloud'"
                clearable>
                <template #suffix>
                    <el-tooltip
                        effect="dark"
                        placement="top"
                        :content="frameworkTooltipContent"
                        raw-content>
                        <el-icon style="cursor: help; color: #909399;">
                            <QuestionFilled />
                        </el-icon>
                    </el-tooltip>
                </template>
            </el-input>
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                <span v-if="!config.frameworkBasePackage.trim()">
                    💡 未填写：将在源码基本包名下自动生成 core 基础框架（Result、BusinessException等）
                </span>
                <span v-else>
                    ✅ 已填写：将使用现有框架的 common.model.Result 等类，无需生成基础框架
                </span>
            </div>
        </el-form-item>
        <el-form-item label="源码输出路径">
            <el-input v-model="config.outputPath" :placeholder="'例如：/.../src/main/java'">
                <template #append>
                    <el-button :icon="FolderOpened" @click="selectOutputPath"></el-button>
                </template>
            </el-input>
        </el-form-item>
        <el-form-item label="源码基本包名">
            <el-input v-model="config.basePackage" :placeholder="'例如：com.wanji.software.tocc.system.uaa'"></el-input>
        </el-form-item>
        <el-form-item label="生成方式">
            <el-radio-group v-model="config.mode">
                <el-radio value="overwrite">覆盖</el-radio>
                <el-radio value="incremental">增量</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item label="Spring Boot版本">
            <el-radio-group v-model="config.springBootVersion">
                <el-radio value="2">Spring Boot 2</el-radio>
                <el-radio value="3">Spring Boot 3</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item>
            <el-button color="#1565c0" type="primary" @click.stop="decryptFiles"
                :title="'解密输出路径中的所有文件，Rest Code 已加入加密软件白名单，因此此功能只用作备选方案，您也可以把它作为批量解密文件的小工具'">解密</el-button>
            <el-button color="#1565c0" type="primary" @click.stop="previewCode">预览</el-button>
            <el-button color="#1565c0" type="primary" @click.stop="generateCode">生成代码</el-button>
        </el-form-item>
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

    <el-dialog title="代码预览" v-model="showPreviewDialog" width="80%">
        <div v-html="previewContentHtml" style="height: 510px; overflow: auto;"></div>
        <span slot="footer" class="dialog-footer">
            <el-button @click="showPreviewDialog = false">关闭</el-button>
        </span>
    </el-dialog>
</template>

<script setup lang="ts">
import { reactive, watch, ref, computed, nextTick } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'
import { generateJavaCode } from '../code-generator'
import type { Config } from '../types'
import { FolderOpened, Loading, QuestionFilled } from '@element-plus/icons-vue'
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
