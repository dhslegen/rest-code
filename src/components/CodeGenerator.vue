<template>
    <el-form :model="config" label-width="120px">
        <el-form-item label="框架基本包名">
            <el-input v-model="config.frameworkBasePackage" :placeholder="'例如：com.wanji.software.tocc'"></el-input>
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
        <el-form-item>
            <el-button color="#1565c0" type="primary" @click="previewCode">预览</el-button>
            <el-button color="#1565c0" type="primary" @click="generateCode">生成代码</el-button>
        </el-form-item>
    </el-form>

    <el-dialog title="代码预览" v-model="showPreviewDialog" width="80%">
        <div v-html="previewContentHtml" style="height: 510px; overflow: auto;"></div>
        <span slot="footer" class="dialog-footer">
            <el-button @click="showPreviewDialog = false">关闭</el-button>
        </span>
    </el-dialog>
</template>

<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'
import { generateJavaCode } from '../code-generator'
import type { Config } from '../types'
import { FolderOpened } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const store = useStore()

// 默认配置
const defaultConfig: Config = {
    frameworkBasePackage: '',
    outputPath: '',
    basePackage: '',
    mode: 'overwrite',
}

// 从 localStorage 中加载配置
const savedConfig = localStorage.getItem('codeGeneratorConfig')
const config = reactive<Config>(savedConfig ? JSON.parse(savedConfig) : defaultConfig)

// 监听配置变化，保存到 localStorage
watch(config, (newConfig) => {
    localStorage.setItem('codeGeneratorConfig', JSON.stringify(newConfig))
}, { deep: true })

const generateCode = async () => {
    try {
        const rasContent = store.generateRasContent()
        await generateJavaCode(config, rasContent)
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
        const rasContent = store.generateRasContent()
        const generatedFiles = await generateJavaCode(config, rasContent, true)
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
</script>
