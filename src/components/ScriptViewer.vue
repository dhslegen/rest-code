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
      <div ref="errorButton" class="error-trigger"></div>
    </template>
  </el-popover>
  
  <div class="script-viewer">
    <div class="editor-container" ref="editorContainer">
      <!-- CodeMirror 编辑器将在这里挂载 -->
      </div>
    
    <div class="editor-actions">
      <el-button class="action-btn help-btn" @click.stop="showGptDialog = true" 
        :title="'此指令用于调教 GPT 成为 一个 RCS 脚本生成专家，将 Markdown 表格的中文伪代码解析为 RCS 文件。'">
        <el-icon><ChatDotRound /></el-icon>
        GPT指令
      </el-button>
      <el-button class="action-btn info-btn" @click.stop="showAboutDialog = true">
        <el-icon><InfoFilled /></el-icon>
        关于
      </el-button>
      <el-button class="action-btn help-btn" @click.stop="showHelpDialog = true">
        <el-icon><QuestionFilled /></el-icon>
        帮助
      </el-button>
      <el-button class="action-btn validate-btn" @click.stop="validateScripts">
        <el-icon><CircleCheck /></el-icon>
        校验
      </el-button>
      <el-button class="action-btn save-btn" @click.stop="saveScripts">
        <el-icon><DocumentChecked /></el-icon>
        保存
      </el-button>
      </div>
    </div>

  <el-dialog 
    title="GPT 指令" 
    v-model="showGptDialog" 
    width="80%" 
    class="modern-dialog gpt-dialog"
    center
    append-to-body
    :modal="true"
  >
    <div class="dialog-content-wrapper">
      <div class="content-header">
        <div class="header-icon">🤖</div>
        <div class="header-text">
          <h3>RCS 脚本生成专家</h3>
          <p>将 Markdown 表格的中文伪代码解析为 RCS 文件</p>
  </div>
  </div>
      <div class="scrollable-content" v-html="gptContentHtml"></div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button class="dialog-btn primary-btn" @click="showGptDialog = false">
          <el-icon><CircleCheck /></el-icon>
          知道了
        </el-button>
  </div>
    </template>
  </el-dialog>

  <el-dialog 
    title="关于" 
    v-model="showAboutDialog" 
    class="modern-dialog about-dialog"
    center
    append-to-body
    :modal="true"
  >
    <div class="dialog-content-wrapper">
      <div class="content-header">
        <div class="header-icon">ℹ️</div>
        <div class="header-text">
          <h3>Rest Code</h3>
          <p>可视化API脚本生成工具</p>
        </div>
      </div>
      <div class="about-content">
        <div class="info-grid">
          <div class="info-card version-card">
            <div class="card-icon">🚀</div>
            <div class="card-content">
              <label>当前版本</label>
        <a href="javascript:void(0)"
                @click="openLink('http://gitea126.weightyware.com:16680/GENERAL-COMPONENT-BACKEND/rest-code/releases/tag/v1.1.1')"
                class="link-btn">
                v1.1.1
              </a>
            </div>
          </div>
          <div class="info-card download-card">
            <div class="card-icon">📥</div>
            <div class="card-content">
              <label>最新版下载</label>
        <a href="javascript:void(0)"
                @click="openLink('http://gitea126.weightyware.com:16680/GENERAL-COMPONENT-BACKEND/rest-code/releases')"
                class="link-btn">
                点击下载
              </a>
            </div>
          </div>
          <div class="info-card repo-card">
            <div class="card-icon">📁</div>
            <div class="card-content">
              <label>源码仓库</label>
        <a href="javascript:void(0)"
                @click="openLink('http://gitea126.weightyware.com:16680/GENERAL-COMPONENT-BACKEND/rest-code.git')"
                class="link-btn">
                点击访问
              </a>
            </div>
          </div>
          <div class="info-card author-card">
            <div class="card-icon">👨‍💻</div>
            <div class="card-content">
              <label>作者</label>
        <a href="javascript:void(0)"
                @click="openLink('https://dahaoshen.com')"
                class="link-btn">
                赵文昊
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button class="dialog-btn secondary-btn" @click="showAboutDialog = false">
          <el-icon><CircleClose /></el-icon>
          关闭
        </el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog 
    title="帮助" 
    v-model="showHelpDialog" 
    width="80%" 
    class="modern-dialog help-dialog"
    center
    append-to-body
    :modal="true"
  >
    <div class="dialog-content-wrapper">
      <div class="content-header">
        <div class="header-icon">❓</div>
        <div class="header-text">
          <h3>使用指南</h3>
          <p>快速上手 Rest Code 的完整指南</p>
        </div>
      </div>
      <div class="scrollable-content" v-html="helpContentHtml"></div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button class="dialog-btn info-btn" @click="showHelpDialog = false">
          <el-icon><Document /></el-icon>
          明白了
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'
import { ChatDotRound, InfoFilled, QuestionFilled, CircleCheck, DocumentChecked, CircleClose, Document } from '@element-plus/icons-vue'
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
          height: '100%'
        },
        '.cm-editor': {
          height: '100%'
        },
        '.cm-scroller': {
          fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
          fontSize: '13px',
          height: '100%'
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
        const highlighted = hljs.highlight(str, { language: lang }).value
        return `<pre class="code-block"><code class="hljs language-${lang}">${highlighted}</code></pre>`
      } catch (_) { }
    }
    return `<pre class="code-block"><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`
  },
})

// 自定义 <code> 行内代码渲染规则
md.renderer.rules.code_inline = (tokens, idx) => {
  return `<code class="inline-code">${md.utils.escapeHtml(tokens[idx].content)}</code>`
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
.error-trigger {
  width: 0;
  height: 0;
  position: absolute;
  top: -10px;
  left: 50%;
}

.script-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.editor-container {
  flex: 1;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0;
  overflow: hidden;
  min-height: 0;
}

.editor-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0;
}

.action-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.help-btn {
  background: linear-gradient(135deg, #17a2b8, #138496);
  color: white;
}

.help-btn:hover {
  background: linear-gradient(135deg, #138496, #117a8b);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
}

.info-btn {
  background: linear-gradient(135deg, #6c757d, #5a6268);
  color: white;
}

.info-btn:hover {
  background: linear-gradient(135deg, #5a6268, #495057);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.validate-btn {
  background: linear-gradient(135deg, #ffc107, #e0a800);
  color: white;
}

.validate-btn:hover {
  background: linear-gradient(135deg, #e0a800, #d39e00);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.save-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.save-btn:hover {
  background: linear-gradient(135deg, #20c997, #1dd1a1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

/* CodeMirror 编辑器的额外样式 */
.editor-container :deep(.cm-editor) {
  height: 100%;
  background: transparent;
  border-radius: 0;
}

.editor-container :deep(.cm-focused) {
  outline: none;
}

.editor-container :deep(.cm-scroller) {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 122, 255, 0.3) transparent;
}

.editor-container :deep(.cm-scroller::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

.editor-container :deep(.cm-scroller::-webkit-scrollbar-track) {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.editor-container :deep(.cm-scroller::-webkit-scrollbar-thumb) {
  background: linear-gradient(135deg, rgba(175, 82, 222, 0.4), rgba(191, 90, 242, 0.4));
  border-radius: 4px;
}

.editor-container :deep(.cm-line) {
  padding: 0 12px;
}

.editor-container :deep(.cm-gutters) {
  background: rgba(248, 249, 250, 0.8);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5px);
  border-radius: 0;
}

.editor-container :deep(.cm-lineNumbers .cm-gutterElement) {
  color: #6c757d;
  font-size: 12px;
}

.editor-container :deep(.cm-activeLine) {
  background: rgba(175, 82, 222, 0.05);
}

.editor-container :deep(.cm-selectionBackground) {
  background: rgba(175, 82, 222, 0.2);
}

:deep(.modern-dialog) {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  z-index: 3000 !important;
  position: fixed !important;
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

:deep(.modern-dialog .el-dialog__header) {
  background: linear-gradient(135deg, 
      rgba(175, 82, 222, 0.08) 0%, 
      rgba(191, 90, 242, 0.08) 50%, 
      rgba(218, 112, 214, 0.08) 100%
  );
  padding: 24px 28px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
}

:deep(.modern-dialog .el-dialog__header::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #AF52DE, #BF5AF2, #DA70D6, #FF3B30, #FF9500, #34C759, #007AFF);
  border-radius: 20px 20px 0 0;
}

:deep(.modern-dialog .el-dialog__title) {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #2c3e50, #AF52DE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:deep(.modern-dialog .el-dialog__body) {
  padding: 0;
  background: transparent;
  border-radius: 0;
}

:deep(.modern-dialog .el-dialog__footer) {
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
  background: linear-gradient(135deg, #AF52DE, #BF5AF2);
  border: none;
  color: white;
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(175, 82, 222, 0.3);
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
  background: linear-gradient(135deg, #9A4ECC, #A855E0);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(175, 82, 222, 0.4);
}

/* 弹窗内容样式 */
:deep(.modern-dialog .el-descriptions) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

:deep(.modern-dialog .el-descriptions__header) {
  background: rgba(175, 82, 222, 0.05);
}

:deep(.modern-dialog .el-descriptions__body) {
  background: rgba(255, 255, 255, 0.8);
}

:deep(.modern-dialog .el-descriptions-item__label) {
  font-weight: 600;
  color: #2c3e50;
}

:deep(.modern-dialog .el-descriptions-item__content a) {
  color: #AF52DE;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

:deep(.modern-dialog .el-descriptions-item__content a:hover) {
  color: #BF5AF2;
}

/* 帮助和GPT指令内容区域 */
:deep(.modern-dialog) .el-dialog__body > div {
  scrollbar-width: thin;
  scrollbar-color: rgba(175, 82, 222, 0.3) transparent;
}

:deep(.modern-dialog) .el-dialog__body > div::-webkit-scrollbar {
  width: 8px;
}

:deep(.modern-dialog) .el-dialog__body > div::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

:deep(.modern-dialog) .el-dialog__body > div::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgba(175, 82, 222, 0.4), rgba(191, 90, 242, 0.4));
  border-radius: 4px;
}

/* Markdown内容样式 */
.scrollable-content :deep(h1),
.scrollable-content :deep(h2),
.scrollable-content :deep(h3),
.scrollable-content :deep(h4) {
  color: #1a1a1a;
  font-weight: 700;
  margin: 24px 0 16px 0;
  line-height: 1.3;
}

.scrollable-content :deep(h1) {
  font-size: 28px;
  background: linear-gradient(135deg, #AF52DE, #BF5AF2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.scrollable-content :deep(h2) {
  font-size: 24px;
  color: #AF52DE;
  border-bottom: 2px solid rgba(175, 82, 222, 0.2);
  padding-bottom: 8px;
}

.scrollable-content :deep(h3) {
  font-size: 20px;
  color: #BF5AF2;
}

.scrollable-content :deep(h4) {
  font-size: 18px;
  color: #DA70D6;
}

.scrollable-content :deep(p) {
  color: #4a5568;
  line-height: 1.6;
  margin: 12px 0;
}

.scrollable-content :deep(ul),
.scrollable-content :deep(ol) {
  color: #4a5568;
  line-height: 1.6;
  padding-left: 24px;
  margin: 12px 0;
}

.scrollable-content :deep(li) {
  margin: 8px 0;
}

/* 代码块样式 - 现代化设计 */
.scrollable-content :deep(.code-block) {
  background: linear-gradient(135deg, 
    #f8fafc 0%, 
    #f1f5f9 50%, 
    #e2e8f0 100%
  );
  border-radius: 16px;
  padding: 0;
  margin: 20px 0;
  border: 1px solid rgba(175, 82, 222, 0.1);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(10px);
}

.scrollable-content :deep(.code-block::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #AF52DE, #BF5AF2, #DA70D6, #FF3B30, #FF9500, #34C759, #007AFF);
  opacity: 0.8;
}

.scrollable-content :deep(.code-block code) {
  display: block;
  padding: 24px 28px 20px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #2d3748;
  background: transparent;
  border-radius: 0;
  overflow-x: auto;
  white-space: pre;
  word-wrap: normal;
  scrollbar-width: thin;
  scrollbar-color: rgba(175, 82, 222, 0.3) transparent;
}

.scrollable-content :deep(.code-block code::-webkit-scrollbar) {
  height: 8px;
}

.scrollable-content :deep(.code-block code::-webkit-scrollbar-track) {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.scrollable-content :deep(.code-block code::-webkit-scrollbar-thumb) {
  background: linear-gradient(90deg, rgba(175, 82, 222, 0.4), rgba(191, 90, 242, 0.4));
  border-radius: 4px;
}

/* 语法高亮颜色 - 亮色主题 */
.scrollable-content :deep(.hljs) {
  background: transparent !important;
  color: #2d3748;
}

.scrollable-content :deep(.hljs-keyword) {
  color: #9333ea;
  font-weight: 600;
}

.scrollable-content :deep(.hljs-string) {
  color: #059669;
}

.scrollable-content :deep(.hljs-number) {
  color: #dc2626;
}

.scrollable-content :deep(.hljs-comment) {
  color: #6b7280;
  font-style: italic;
}

.scrollable-content :deep(.hljs-function) {
  color: #2563eb;
  font-weight: 500;
}

.scrollable-content :deep(.hljs-class) {
  color: #7c3aed;
  font-weight: 600;
}

.scrollable-content :deep(.hljs-variable) {
  color: #db2777;
}

.scrollable-content :deep(.hljs-title) {
  color: #1d4ed8;
  font-weight: 600;
}

.scrollable-content :deep(.hljs-tag) {
  color: #dc2626;
}

.scrollable-content :deep(.hljs-attribute) {
  color: #059669;
}

.scrollable-content :deep(.hljs-built_in) {
  color: #7c2d12;
  font-weight: 500;
}

.scrollable-content :deep(.hljs-type) {
  color: #b45309;
}

.scrollable-content :deep(.hljs-literal) {
  color: #0891b2;
}

.scrollable-content :deep(.hljs-meta) {
  color: #4b5563;
}

.scrollable-content :deep(.hljs-selector-tag) {
  color: #dc2626;
  font-weight: 600;
}

.scrollable-content :deep(.hljs-selector-class) {
  color: #7c3aed;
}

.scrollable-content :deep(.hljs-selector-id) {
  color: #059669;
}

/* 行内代码样式 */
.scrollable-content :deep(.inline-code) {
  background: linear-gradient(135deg, 
    rgba(175, 82, 222, 0.1) 0%, 
    rgba(191, 90, 242, 0.08) 100%
  );
  color: #AF52DE;
  padding: 4px 8px;
  border-radius: 8px;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 0.9em;
  border: 1px solid rgba(175, 82, 222, 0.15);
  box-shadow: 0 1px 3px rgba(175, 82, 222, 0.1);
  transition: all 0.2s ease;
}

.scrollable-content :deep(.inline-code:hover) {
  background: linear-gradient(135deg, 
    rgba(175, 82, 222, 0.15) 0%, 
    rgba(191, 90, 242, 0.12) 100%
  );
  border-color: rgba(175, 82, 222, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(175, 82, 222, 0.15);
}

.scrollable-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.scrollable-content :deep(th),
.scrollable-content :deep(td) {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(175, 82, 222, 0.1);
}

.scrollable-content :deep(th) {
  background: linear-gradient(135deg, 
    rgba(175, 82, 222, 0.08) 0%, 
    rgba(191, 90, 242, 0.08) 100%
  );
  font-weight: 600;
  color: #2c3e50;
}

.scrollable-content :deep(tr:hover) {
  background: rgba(175, 82, 222, 0.03);
}

.scrollable-content :deep(blockquote) {
  border-left: 4px solid #AF52DE;
  padding: 16px 20px;
  margin: 16px 0;
  background: rgba(175, 82, 222, 0.05);
  border-radius: 0 8px 8px 0;
  color: #4a5568;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-actions {
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 12px;
  }
  
  .action-btn {
    height: 28px;
    padding: 0 8px;
    font-size: 11px;
    gap: 2px;
  }
}

/* 现代化弹窗样式增强 */

/* 弹窗内容包装器 */
.dialog-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 510px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(248, 250, 252, 0.95) 100%
  );
  border-radius: 16px;
  overflow: hidden;
}

/* 内容头部 */
.content-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, 
    rgba(175, 82, 222, 0.08) 0%, 
    rgba(191, 90, 242, 0.08) 50%, 
    rgba(218, 112, 214, 0.08) 100%
  );
  border-bottom: 1px solid rgba(175, 82, 222, 0.1);
  margin-bottom: 0;
}

.header-icon {
  font-size: 32px;
  margin-right: 16px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.header-text h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  background: linear-gradient(135deg, #2c3e50, #AF52DE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-text p {
  margin: 0;
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

/* 滚动内容区域 */
.scrollable-content {
  flex: 1;
  padding: 24px;
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

/* 关于弹窗特殊样式 */
.about-content {
  padding: 20px 24px;
  flex: 1;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(175, 82, 222, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(175, 82, 222, 0.15);
  border-color: rgba(175, 82, 222, 0.2);
}

.version-card:hover {
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.2);
}

.download-card:hover {
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.2);
}

.repo-card:hover {
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.2);
}

.author-card:hover {
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.2);
}

.card-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-content label {
  font-size: 14px;
  font-weight: 600;
  color: #6c757d;
  margin: 0;
}

.link-btn {
  color: #AF52DE !important;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;
  position: relative;
}

.link-btn:hover {
  color: #BF5AF2 !important;
  transform: translateX(2px);
}

.link-btn::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -2px;
  left: 0;
  background: linear-gradient(90deg, #AF52DE, #BF5AF2);
  transition: width 0.3s ease;
}

.link-btn:hover::after {
  width: 100%;
}

/* 弹窗底部 */
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 0;
}

/* 按钮样式 */
.dialog-btn {
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 8px;
}

.primary-btn {
  background: linear-gradient(135deg, #AF52DE, #BF5AF2);
  box-shadow: 0 4px 16px rgba(175, 82, 222, 0.3);
}

.primary-btn:hover {
  background: linear-gradient(135deg, #9A4ECC, #A855E0);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(175, 82, 222, 0.4);
}

.secondary-btn {
  background: linear-gradient(135deg, #6c757d, #5a6268);
  box-shadow: 0 4px 16px rgba(108, 117, 125, 0.3);
}

.secondary-btn:hover {
  background: linear-gradient(135deg, #5a6268, #495057);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(108, 117, 125, 0.4);
}

.info-btn {
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.info-btn:hover {
  background: linear-gradient(135deg, #0051D5, #32A3F7);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4);
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

/* 特定弹窗的头部颜色主题 */
.gpt-dialog .content-header {
  background: linear-gradient(135deg, 
    rgba(0, 122, 255, 0.08) 0%, 
    rgba(90, 200, 250, 0.08) 50%, 
    rgba(100, 210, 255, 0.08) 100%
  );
  border-bottom-color: rgba(0, 122, 255, 0.1);
}

.about-dialog .content-header {
  background: linear-gradient(135deg, 
    rgba(108, 117, 125, 0.08) 0%, 
    rgba(90, 97, 105, 0.08) 50%, 
    rgba(73, 80, 87, 0.08) 100%
  );
  border-bottom-color: rgba(108, 117, 125, 0.1);
}

.help-dialog .content-header {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.08) 0%, 
    rgba(16, 185, 129, 0.08) 50%, 
    rgba(5, 150, 105, 0.08) 100%
  );
  border-bottom-color: rgba(34, 197, 94, 0.1);
}

/* Markdown 内容美化 */
.scrollable-content :deep(h1),
.scrollable-content :deep(h2),
.scrollable-content :deep(h3),
.scrollable-content :deep(h4) {
  color: #1a1a1a;
  font-weight: 700;
  margin: 24px 0 16px 0;
  line-height: 1.3;
}

.scrollable-content :deep(h1) {
  font-size: 28px;
  background: linear-gradient(135deg, #AF52DE, #BF5AF2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.scrollable-content :deep(h2) {
  font-size: 24px;
  color: #AF52DE;
  border-bottom: 2px solid rgba(175, 82, 222, 0.2);
  padding-bottom: 8px;
}

.scrollable-content :deep(h3) {
  font-size: 20px;
  color: #BF5AF2;
}

.scrollable-content :deep(h4) {
  font-size: 18px;
  color: #DA70D6;
}

.scrollable-content :deep(p) {
  color: #4a5568;
  line-height: 1.6;
  margin: 12px 0;
}

.scrollable-content :deep(ul),
.scrollable-content :deep(ol) {
  color: #4a5568;
  line-height: 1.6;
  padding-left: 24px;
  margin: 12px 0;
}

.scrollable-content :deep(li) {
  margin: 8px 0;
}

.scrollable-content :deep(pre) {
  background: linear-gradient(135deg, 
    rgba(248, 250, 252, 0.95) 0%, 
    rgba(241, 245, 249, 0.9) 100%
  );
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(175, 82, 222, 0.1);
  overflow-x: auto;
  margin: 16px 0;
}

.scrollable-content :deep(code) {
  background: rgba(175, 82, 222, 0.1);
  color: #AF52DE;
  padding: 3px 6px;
  border-radius: 6px;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.scrollable-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.scrollable-content :deep(th),
.scrollable-content :deep(td) {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(175, 82, 222, 0.1);
}

.scrollable-content :deep(th) {
  background: linear-gradient(135deg, 
    rgba(175, 82, 222, 0.08) 0%, 
    rgba(191, 90, 242, 0.08) 100%
  );
  font-weight: 600;
  color: #2c3e50;
}

.scrollable-content :deep(tr:hover) {
  background: rgba(175, 82, 222, 0.03);
}

.scrollable-content :deep(blockquote) {
  border-left: 4px solid #AF52DE;
  padding: 16px 20px;
  margin: 16px 0;
  background: rgba(175, 82, 222, 0.05);
  border-radius: 0 8px 8px 0;
  color: #4a5568;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .info-card {
    padding: 16px;
    gap: 12px;
  }
  
  .card-icon {
    font-size: 20px;
  }
  
  .content-header {
    padding: 16px 20px;
  }
  
  .header-icon {
    font-size: 24px;
    margin-right: 12px;
  }
  
  .scrollable-content {
    padding: 20px;
  }
  
  .dialog-content-wrapper {
    height: 400px;
  }
}
</style>