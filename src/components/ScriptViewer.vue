<template>
  <!-- 错误信息展示 -->
  <el-popover v-model="showErrorPopover" placement="top" width="700" :visible="showErrorPopover">
    <div style="max-height: 400px; overflow: auto;" @click.stop>
      <div style="background: #f8f9fa; padding: 8px 12px; border-radius: 4px; margin-bottom: 8px; border-left: 4px solid #409eff;">
        <h4 style="margin: 0 0 4px 0; color: #303133; font-size: 14px;">脚本校验结果</h4>
        <div style="font-size: 12px; color: #606266;">
          实时检查脚本语法和格式规范
        </div>
      </div>
      <div v-html="formattedErrors"></div>
    </div>
    <template #reference>
      <el-alert ref="errorButton" center title="脚本编辑器" style="background-color:#009688; height: 20px;" type="success"
        effect="dark" :closable=false @click.stop />
    </template>
  </el-popover>
  <div class="script-editor">
    <div class="editor-container" ref="editorContainer">
      <!-- CodeMirror 编辑器将在这里挂载 -->
    </div>
  </div>
  <div style="text-align: center; margin-top: 10px;">
    <el-button type="primary" @click.stop="showGptDialog = true"
      style="background-color: #009688;border-color: #009688;"
      :title="'此指令用于调教 GPT 成为 一个 RCS 脚本生成专家，将 Markdown 表格的中文伪代码解析为 RCS 文件。'">GPT指令</el-button>
    <el-button type="primary" @click.stop="showAboutDialog = true"
      style="background-color: #009688;border-color: #009688;">关于</el-button>
    <el-button type="primary" @click.stop="showHelpDialog = true"
      style="background-color: #009688;border-color: #009688;">帮助</el-button>
    <el-button type="primary" @click.stop="validateScripts"
      style="background-color: #009688;border-color: #009688;">校验</el-button>
    <el-button type="primary" @click.stop="saveScripts"
      style="background-color: #009688;border-color: #009688;">保存</el-button>
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
          @click="openLink('http://gitea126.weightyware.com:16680/GENERAL-COMPONENT-BACKEND/rest-code/releases/tag/v1.1.1')">
          v1.1.1</a>
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

// CodeMirror imports
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { linter, lintGutter } from '@codemirror/lint'
import type { Diagnostic } from '@codemirror/lint'

const store = useStore()

const openLink = (url: string) => {
  window.api.openExternal(url)
}

const editorContainer = ref<HTMLElement | null>(null)
let editorView: EditorView | null = null
const isUpdatingFromStore = ref(false)
let validateTimer: NodeJS.Timeout | null = null

// 当前编辑器内容（作为唯一数据源）
const currentEditorContent = ref('')
// 添加一个强制刷新标志
const forceRefreshErrors = ref(0)

// 监听 store 中的内容变化，同步到编辑器
const rcsContent = computed(() => {
  return store.generateRcsContent()
})

// 创建 linter 函数
const createLinter = () => {
  return linter((view) => {
    const content = view.state.doc.toString()
    const validation = store.validateRcsContent(content)
    
    const diagnostics: Diagnostic[] = validation.errors.map(error => {
      const line = view.state.doc.line(error.line)
      return {
        from: line.from,
        to: line.to,
        severity: error.severity,
        message: error.message,
        actions: []
      }
    })
    
    return diagnostics
  })
}

// 创建 CodeMirror 编辑器
const createEditor = () => {
  if (!editorContainer.value) return

  const initialContent = rcsContent.value
  currentEditorContent.value = initialContent

  const state = EditorState.create({
    doc: initialContent,
    extensions: [
      basicSetup,
      lintGutter(),
      createLinter(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isUpdatingFromStore.value) {
          const newContent = update.state.doc.toString()
          currentEditorContent.value = newContent
          onContentChange(newContent)
        }
      }),
      EditorView.theme({
        '&': {
          height: '190px'
        },
        '.cm-editor': {
          height: '100%'
        },
        '.cm-scroller': {
          fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
          fontSize: '13px'
        },
        '.cm-focused': {
          outline: 'none'
        },
        '.cm-diagnostic': {
          padding: '3px 6px 3px 8px',
          marginLeft: '-1px',
          display: 'block',
          whiteSpace: 'pre-wrap'
        },
        '.cm-diagnostic-error': {
          borderLeft: '5px solid #ff5555'
        },
        '.cm-lintRange-error': {
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #ff5555 2px, #ff5555 4px)',
          backgroundPosition: 'left bottom',
          backgroundRepeat: 'repeat-x',
          backgroundSize: '8px 2px'
        },
        '.cm-tooltip.cm-tooltip-lint': {
          border: '1px solid #ddd',
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }
      })
    ]
  })

  editorView = new EditorView({
    state,
    parent: editorContainer.value
  })
}

// 监听 store 内容变化（但只在非用户编辑时同步）
watch(rcsContent, (newValue) => {
  if (!isUpdatingFromStore.value && editorView) {
    const currentContent = editorView.state.doc.toString()
    if (currentContent !== newValue) {
      isUpdatingFromStore.value = true
      currentEditorContent.value = newValue
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: newValue
        }
      })
      // 内容同步后，强制刷新错误信息
      nextTick(() => {
        forceRefreshErrors.value++
        isUpdatingFromStore.value = false
      })
    }
  }
})

// 内容变化处理
const onContentChange = (content: string) => {
  isUpdatingFromStore.value = true
  
  // 更新 store 数据
  store.updateRcsContent(content)
  
  // 清除之前的定时器
  if (validateTimer) {
    clearTimeout(validateTimer)
  }
  
  // 设置防抖校验，300ms 后执行 linting
  validateTimer = setTimeout(() => {
    if (editorView) {
      // 触发 linting 更新
      editorView.dispatch({})
    }
    // 强制刷新错误信息
    forceRefreshErrors.value++
    isUpdatingFromStore.value = false
  }, 300)
}

// 重写数据获取方法，确保使用编辑器内容作为唯一数据源
const getCurrentContent = (): string => {
  if (editorView) {
    return editorView.state.doc.toString()
  }
  return currentEditorContent.value
}

const showErrorPopover = computed({
  get: () => store.showErrorPopover,
  set: (val) => { store.showErrorPopover = val }
})

const formattedErrors = computed(() => {
  // 依赖 forceRefreshErrors 来确保响应式更新
  forceRefreshErrors.value
  
  // 强制使用编辑器内容进行校验
  let content = ''
  if (editorView) {
    content = editorView.state.doc.toString()
  } else {
    content = currentEditorContent.value
  }
  
  // 确保内容不为空
  if (!content) {
    content = store.generateRcsContent()
  }
  
  const validation = store.validateRcsContent(content)
  
  if (validation.errors.length === 0) {
    return `<div style="color: #67c23a; font-size: 14px; text-align: center; padding: 20px; background: #f0f9ff; border-radius: 4px; border: 1px solid #b3d8ff;">
      <i class="el-icon-success" style="margin-right: 8px;"></i>
      ✅ 脚本校验通过，没有发现错误
    </div>`
  }
  
  // 错误统计
  const errorCount = validation.errors.filter(e => e.severity === 'error').length
  const warningCount = validation.errors.filter(e => e.severity === 'warning').length
  
  let result = `<div style="background: #fef0f0; padding: 8px 12px; border-radius: 4px; margin-bottom: 8px; border: 1px solid #fbc4c4;">
    <div style="font-size: 13px; color: #f56c6c; font-weight: bold;">
      <i class="el-icon-warning" style="margin-right: 4px;"></i>
      发现 ${errorCount} 个错误${warningCount > 0 ? `, ${warningCount} 个警告` : ''}
    </div>
  </div>`
  
  result += validation.errors.map((error, index) => {
    const iconColor = error.severity === 'error' ? '#f56c6c' : '#e6a23c'
    const icon = error.severity === 'error' ? '❌' : '⚠️'
    
    return `<div style="padding: 8px 12px; margin: 4px 0; background: ${error.severity === 'error' ? '#fef0f0' : '#fdf6ec'}; border-radius: 4px; border-left: 3px solid ${iconColor};">
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <span style="margin-right: 8px;">${icon}</span>
        <span style="font-weight: bold; color: ${iconColor};">第 ${error.line} 行</span>
        <span style="margin-left: auto; font-size: 11px; color: #909399; background: #f5f7fa; padding: 2px 6px; border-radius: 2px;">
          ${error.severity === 'error' ? '错误' : '警告'}
        </span>
      </div>
      <div style="color: #606266; font-size: 13px; line-height: 1.4;">
        ${error.message}
      </div>
    </div>`
  }).join('')
  
  return result
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

const validateScripts = async () => {
  // 使用编辑器内容进行校验
  const content = getCurrentContent()
  const validation = store.validateRcsContent(content)
  
  // 强制刷新错误信息
  forceRefreshErrors.value++
  
  if (validation.isValid) {
    ElMessage.success('校验通过')
    store.showErrorPopover = false
  } else {
    ElMessage.error(`校验失败，发现 ${validation.errors.length} 个错误`)
    store.showErrorPopover = true
    await nextTick()
    if (errorButton.value) {
      const errorBtn = (errorButton.value as ComponentPublicInstance).$el
      errorBtn.click()
    }
  }
  return validation.isValid
}

const saveScripts = async () => {
  // 使用编辑器内容进行校验和保存
  const content = getCurrentContent()
  const validation = store.validateRcsContent(content)
  
  if (!validation.isValid) {
    ElMessage.error('脚本校验失败，无法保存')
    // 触发错误弹窗显示
    store.showErrorPopover = true
    forceRefreshErrors.value++
    await nextTick()
    if (errorButton.value) {
      const errorBtn = (errorButton.value as ComponentPublicInstance).$el
      errorBtn.click()
    }
    return
  }
  
  // 确保 store 数据是最新的
  store.updateRcsContent(content)
  
  if (store.loadedFilePath) {
    // 直接保存编辑器内容
    try {
      window.api.writeFile(store.loadedFilePath, content)
      ElMessage.success('保存成功')
    } catch (error) {
      ElMessage.error('保存失败')
      console.error(error)
    }
  } else {
    const filePath = await window.api.showSaveDialog()
    if (filePath) {
      try {
        window.api.writeFile(filePath, content)
        ElMessage.success('保存成功')
        store.loadedFilePath = filePath
      } catch (error) {
        ElMessage.error('保存失败')
        console.error(error)
      }
    }
  }
}

onMounted(() => {
  document.addEventListener('click', closePopover)
  // 创建 CodeMirror 编辑器
  nextTick(() => {
    createEditor()
    // 编辑器创建后立即刷新错误信息
    setTimeout(() => {
      forceRefreshErrors.value++
    }, 100)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closePopover)
  // 清理编辑器和定时器
  if (validateTimer) {
    clearTimeout(validateTimer)
  }
  if (editorView) {
    editorView.destroy()
  }
})

const closePopover = () => {
  showErrorPopover.value = false
}

// 监听 scrollToBottom 的变化
watch(
  () => store.scrollToBottom,
  (newVal) => {
    if (newVal && editorView) {
      nextTick(() => {
        // 滚动到底部
        if (editorView) {
          editorView.dispatch({
            selection: { anchor: editorView.state.doc.length },
            scrollIntoView: true
          })
          store.setScrollToBottom(false)
        }
      })
    }
  }
)

// 监听 triggerErrorDisplay，当其为 true 时，触发错误信息展示
watch(() => store.triggerErrorDisplay, async (newVal) => {
  if (newVal) {
    // 强制刷新错误信息
    forceRefreshErrors.value++
    await nextTick()
    if (errorButton.value) {
      const errorBtn = (errorButton.value as ComponentPublicInstance).$el
      errorBtn.click()
    }
    store.triggerErrorDisplay = false
  }
})

// 暴露 getCurrentContent 方法供外部组件使用
defineExpose({
  getCurrentContent
})
</script>

<style scoped>
.script-editor {
  height: 100%;
}

.editor-container {
  height: 190px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

/* CodeMirror 编辑器的额外样式 */
.editor-container :deep(.cm-editor) {
  height: 100%;
}

.editor-container :deep(.cm-focused) {
  outline: none;
}

.editor-container :deep(.cm-line) {
  padding: 0 12px;
}

.editor-container :deep(.cm-gutters) {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  color: #909399;
}

.editor-container :deep(.cm-lineNumbers .cm-gutterElement) {
  color: #909399;
  padding: 0 8px;
  min-width: 3em;
  text-align: right;
}
</style>