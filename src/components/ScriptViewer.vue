<template>
  <!-- 错误信息展示 -->
  <el-popover v-model="showErrorPopover" placement="top" width="600" :visible="showErrorPopover">
    <div v-html="formattedErrors" style="height: 300px;overflow: auto;" @click.stop></div>
    <template #reference>
      <el-alert ref="errorButton" center title="脚本查看" style="background-color:#c41d7f; height: 20px;" type="success"
        effect="dark" :closable=false @click.stop />
    </template>
  </el-popover>
  <div class="script-viewer">
    <div class="code-container">
      <div class="line-numbers">
        <pre>{{ lineNumbers }}</pre>
      </div>
      <div class="code-content" @click="showErrorPopover = false">
        <pre>{{ rasContent }}</pre>
      </div>
    </div>
  </div>
  <div style="text-align: center; margin-top: 10px;">
    <el-button type="primary" @click.stop="showHelpDialog = true"
      style="background-color: #c41d7f;border-color: #c41d7f;">帮助</el-button>
    <el-button type="primary" @click.stop="validateScripts"
      style="background-color: #c41d7f;border-color: #c41d7f;">校验</el-button>
    <el-button type="primary" @click.stop="saveScripts"
      style="background-color: #c41d7f;border-color: #c41d7f;">保存</el-button>
  </div>

  <el-dialog title="帮助" v-model="showHelpDialog" width="80%">
    <div v-html="helpContentHtml" style="height: 510px;  overflow: auto;"></div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="showHelpDialog = false">关闭</el-button>
    </span>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const store = useStore()
const rasContent = computed(() => {
  return store.generateRasContent()
})

const lineNumbers = ref('')
const errors = ref<string[]>([])
const showErrorPopover = ref(false)
const formattedErrors = ref('')
const showHelpDialog = ref(false)
const helpContent = ref('')

const loadHelpContent = async () => {
  const appPath = await window.api.appPath()
  const helpFilePath = window.api.join(appPath, 'docs', 'help.md')
  const content = await window.api.readFile(helpFilePath)
  helpContent.value = content
}

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang }).value +
          '</code></pre>';
      } catch (_) { }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
})

// 自定义 <code> 行内代码渲染规则
md.renderer.rules.code_inline = (tokens, idx) => {
  return `<code class="hljs-code">${md.utils.escapeHtml(tokens[idx].content)}</code>`
}


const helpContentHtml = computed(() => md.render(helpContent.value))

import type { ComponentPublicInstance } from 'vue'

const errorButton = ref<ComponentPublicInstance | null>(null)

watch(rasContent, (newValue) => {
  const lines = newValue.split('\n')
  lineNumbers.value = lines.map((_, index) => index + 1).join('\n')
})

const validateScripts = async () => {
  errors.value = store.validateScripts()
  if (errors.value.length > 0) {
    ElMessage.error(`校验失败`)
    formattedErrors.value = errors.value.map(error => `<div style="color: #d50000; font-size: 12px" >${error}</div>`).join('')
    showErrorPopover.value = true
    await nextTick()
    if (errorButton.value) {
      const errorBtn = (errorButton.value as ComponentPublicInstance).$el
      errorBtn.click()
    }
  } else {
    ElMessage.success('校验通过')
    showErrorPopover.value = false
  }
}

const saveScripts = async () => {
  await validateScripts()
  if (errors.value.length > 0) {
    ElMessage.error('校验失败，无法保存')
    return
  }
  if (store.loadedFilePath) {
    store.saveRasFile(store.loadedFilePath)
  } else {
    const filePath = await window.api.showSaveDialog()
    if (filePath) {
      store.saveRasFile(filePath)
    }
  }
}
onMounted(() => {
  loadHelpContent()
  document.addEventListener('click', closePopover)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closePopover)
})

const closePopover = () => {
  showErrorPopover.value = false
}
</script>

<style scoped>
.script-viewer {
  height: 100%;
}

.code-container {
  display: flex;
  overflow: auto;
  height: 190px;
}

.line-numbers,
.code-content {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
}

.line-numbers {
  background-color: #f0f0f0;
  padding: 5px;
  user-select: none;
  text-align: right;
  border-right: 1px solid #ccc;
  color: #999;
  flex-shrink: 0;
}

.code-content {
  flex: 1;
  padding: 5px;
}

.line-numbers pre,
.code-content pre {
  margin: 0;
}
</style>