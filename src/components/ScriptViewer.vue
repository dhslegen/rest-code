<template>
  <!-- 错误信息展示 -->
  <el-popover v-model="showErrorPopover" placement="top" width="600" :visible="showErrorPopover">
    <div v-html="formattedErrors" style="height: 300px;overflow: auto;" @click.stop></div>
    <template #reference>
      <el-alert ref="errorButton" center title="脚本查看" style="background-color:#01a3a4; height: 20px;" type="success"
        effect="dark" :closable=false @click.stop />
    </template>
  </el-popover>
  <div class="script-viewer">
    <div class="code-container" ref="codeContent">
      <div class="line-numbers">
        <pre>{{ lineNumbers }}</pre>
      </div>
      <div class="code-content" @click="showErrorPopover = false">
        <pre>{{ rcsContent }}</pre>
      </div>
    </div>
  </div>
  <div style="text-align: center; margin-top: 10px;">
    <el-button type="primary" @click.stop="showGptDialog = true"
      style="background-color: #01a3a4;border-color: #01a3a4;"
      :title="'此指令用于调教 GPT 成为 一个 RCS 脚本生成专家，将 Markdown 表格的中文伪代码解析为 RCS 文件。'">GPT指令</el-button>
    <el-button type="primary" @click.stop="showAboutDialog = true"
      style="background-color: #01a3a4;border-color: #01a3a4;">关于</el-button>
    <el-button type="primary" @click.stop="showHelpDialog = true"
      style="background-color: #01a3a4;border-color: #01a3a4;">帮助</el-button>
    <el-button type="primary" @click.stop="validateScripts"
      style="background-color: #01a3a4;border-color: #01a3a4;">校验</el-button>
    <el-button type="primary" @click.stop="saveScripts"
      style="background-color: #01a3a4;border-color: #01a3a4;">保存</el-button>
  </div>

  <el-dialog title="GPT 指令" v-model="showGptDialog" width="80%">
    <div v-html="gptContentHtml" style="height: 510px; overflow: auto;"></div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="showGptDialog = false">关闭</el-button>
    </span>
  </el-dialog>

  <el-dialog title="关于" v-model="showAboutDialog">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="当前版本">
        <a href="javascript:void(0)"
          @click="openLink('http://gitea126.weightyware.com:16680/GENERAL-COMPONENT-BACKEND/rest-code/releases/tag/v1.0.9')">
          v1.0.9</a>
      </el-descriptions-item>
      <el-descriptions-item label="最新版下载">
        <a href="javascript:void(0)"
          @click="openLink('http://gitea126.weightyware.com:16680/GENERAL-COMPONENT-BACKEND/rest-code/releases')">点击下载</a>
      </el-descriptions-item>
      <el-descriptions-item label="源码仓库">
        <a href="javascript:void(0)"
          @click="openLink('http://gitea126.weightyware.com:16680/GENERAL-COMPONENT-BACKEND/rest-code.git')">点击访问</a>
      </el-descriptions-item>
      <el-descriptions-item label="作者">
        <a href="javascript:void(0)" @click="openLink('https://dahaoshen.com')">赵文昊</a>
      </el-descriptions-item>
    </el-descriptions>
    <span slot="footer" class="dialog-footer">
      <el-button @click="showAboutDialog = false">关闭</el-button>
    </span>
  </el-dialog>

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
import helpContentRaw from '../docs/help.md?raw'
import gptContentRaw from '../docs/GPT.md?raw'

const store = useStore()

const openLink = (url: string) => {
  window.api.openExternal(url)
}

const codeContent = ref<HTMLElement | null>(null)
const rcsContent = computed(() => {
  return store.generateRcsContent()
})

const lineNumbers = ref('')
const showErrorPopover = computed({
  get: () => store.showErrorPopover,
  set: (val) => { store.showErrorPopover = val }
})
const formattedErrors = computed(() => {
  return store.errors.map(error => `<div style="color: #d50000; font-size: 12px" >${error}</div>`).join('')
})
const showHelpDialog = ref(false)
const showAboutDialog = ref(false)
const helpContent = ref(helpContentRaw)

const showGptDialog = ref(false)
const gptContent = ref(gptContentRaw)

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

const gptContentHtml = computed(() => md.render(gptContent.value))

const helpContentHtml = computed(() => md.render(helpContent.value))

import type { ComponentPublicInstance } from 'vue'

const errorButton = ref<ComponentPublicInstance | null>(null)

watch(rcsContent, (newValue) => {
  const lines = newValue.split('\n')
  lineNumbers.value = lines.map((_, index) => index + 1).join('\n')
})

const validateScripts = async () => {
  const isValid = store.validateScripts()
  if (isValid) {
    ElMessage.success('校验通过')
    store.showErrorPopover = false
  } else {
    ElMessage.error('校验失败')
    store.showErrorPopover = true
    await nextTick()
    if (errorButton.value) {
      const errorBtn = (errorButton.value as ComponentPublicInstance).$el
      errorBtn.click()
    }
  }
  return isValid
}

const saveScripts = async () => {
  const isValid = store.validateAndShowErrors()
  if (!isValid) {
    ElMessage.error('脚本校验失败，无法保存')
    return
  }
  if (store.loadedFilePath) {
    store.saveRcsFile(store.loadedFilePath)
  } else {
    const filePath = await window.api.showSaveDialog()
    if (filePath) {
      store.saveRcsFile(filePath)
      // 保存成功后，更新 loadedFilePath
      store.loadedFilePath = filePath
    }
  }
}

onMounted(() => {
  document.addEventListener('click', closePopover)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closePopover)
})

const closePopover = () => {
  showErrorPopover.value = false
}

// 监听 scrollToBottom 的变化
watch(
  () => store.scrollToBottom,
  (newVal) => {
    if (newVal && codeContent.value) {
      nextTick(() => {
        codeContent.value!.scrollTop = codeContent.value!.scrollHeight
        store.setScrollToBottom(false)
      })
    }
  }
)

// 监听 triggerErrorDisplay，当其为 true 时，触发错误信息展示
watch(() => store.triggerErrorDisplay, async (newVal) => {
  if (newVal) {
    await nextTick()
    if (errorButton.value) {
      const errorBtn = (errorButton.value as ComponentPublicInstance).$el
      errorBtn.click()
    }
    store.triggerErrorDisplay = false
  }
})
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