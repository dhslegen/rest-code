<template>
  <!-- 错误信息展示 -->
  <el-popover v-model="showErrorPopover" placement="top" width="700" :visible="showErrorPopover">
    <div style="max-height: 400px; overflow: auto;" @click.stop>
      <div
        style="background: #f8f9fa; padding: 8px 12px; border-radius: 4px; margin-bottom: 8px; border-left: 4px solid #409eff;">
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
      <el-button class="action-btn help-btn" @click.stop="showGptDialog"
        :title="'此指令用于调教 GPT 成为 一个 RCS 脚本生成专家，将 Markdown 表格的中文伪代码解析为 RCS 文件。'">
        <el-icon>
          <ChatDotRound />
        </el-icon>
        GPT指令
      </el-button>
      <el-button class="action-btn info-btn" @click.stop="showAboutDialog">
        <el-icon>
          <InfoFilled />
        </el-icon>
        关于
      </el-button>
      <el-button class="action-btn help-btn" @click.stop="showHelpDialog">
        <el-icon>
          <QuestionFilled />
        </el-icon>
        帮助
      </el-button>
      <el-button class="action-btn validate-btn" @click.stop="validateScripts">
        <el-icon>
          <CircleCheck />
        </el-icon>
        校验
      </el-button>
      <el-button class="action-btn save-btn" @click.stop="saveScripts" :title="`保存 (${isMac ? 'Cmd' : 'Ctrl'}+S)`">
        <el-icon>
          <DocumentChecked />
        </el-icon>
        保存
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'
import { ChatDotRound, InfoFilled, QuestionFilled, CircleCheck, DocumentChecked } from '@element-plus/icons-vue'

// CodeMirror imports
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { linter, lintGutter } from '@codemirror/lint'
import type { Diagnostic } from '@codemirror/lint'
import type { ComponentPublicInstance } from 'vue'
import { Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'

const store = useStore()

// 平台检测
const isMac = computed(() => {
  if (typeof window !== 'undefined' && window.navigator) {
    return navigator.userAgent.toLowerCase().includes('mac')
  }
  return false
})

// 定义emit事件
const emit = defineEmits<{
  openGptDialog: []
  openAboutDialog: []
  openHelpDialog: []
}>()

// 对话框打开函数
const showGptDialog = () => emit('openGptDialog')
const showAboutDialog = () => emit('openAboutDialog')
const showHelpDialog = () => emit('openHelpDialog')

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
  return store.getCurrentDisplayContent()
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

// 创建语法高亮装饰器
const createSyntaxDecorator = () => {
  // 定义6种API脚本部分的颜色（领域名称、HTTP请求方法、API路径、操作名称、参数契约、描述）
  const apiPartColors = [
    'api-domain',      // 索引0: 领域名称
    'api-method',      // 索引1: HTTP请求方法 
    'api-path',        // 索引2: API路径
    'api-operation',   // 索引3: 操作名称
    'api-contract',    // 索引4: 参数契约
    'api-description'  // 索引5: 描述
  ]

  // 定义2种领域部分的颜色（领域名称、领域描述）
  const domainPartColors = [
    'domain-name',        // 索引0: 领域名称
    'domain-description'  // 索引1: 领域描述
  ]

  // 定义HTTP方法和对应的特殊样式
  const httpMethodColors: Record<string, string> = {
    'GET': 'http-method-get',
    'POST': 'http-method-post',
    'PUT': 'http-method-put',
    'PATCH': 'http-method-patch',
    'DELETE': 'http-method-delete',
    'HEAD': 'http-method-head',
    'OPTIONS': 'http-method-options'
  }

  return ViewPlugin.fromClass(class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view)
      }
    }

    buildDecorations(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>()
      const doc = view.state.doc

      // 统一收集所有装饰
      const allDecorations: Array<{
        from: number,
        to: number,
        decoration: Decoration,
        type: 'line' | 'mark',
        priority: number
      }> = []

      for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i)
        const lineText = line.text.trim()

        // 跳过空行和注释行
        if (lineText === '' || lineText.startsWith('//')) {
          if (lineText.startsWith('//')) {
            allDecorations.push({
              from: line.from,
              to: line.to,
              decoration: Decoration.mark({ class: 'syntax-comment' }),
              type: 'mark',
              priority: 1
            })
          }
          continue
        }

        // 检查是否为API脚本（包含句点分隔符）
        if (lineText.includes('.')) {
          const parts = lineText.split('.')

          let currentPos = line.from

          for (let partIndex = 0; partIndex < parts.length; partIndex++) {
            const part = parts[partIndex]
            const partStart = currentPos
            const partEnd = partStart + part.length

            // 确定样式类名
            let styleClass = ''

            if (partIndex === 1 && httpMethodColors[part.toUpperCase()]) {
              // HTTP方法使用特殊颜色
              styleClass = httpMethodColors[part.toUpperCase()]
            } else if (partIndex < apiPartColors.length) {
              // 使用API部分的默认颜色
              styleClass = apiPartColors[partIndex]
            } else {
              // 超出预定义索引，使用描述样式
              styleClass = apiPartColors[5] // 使用描述样式
            }

            if (styleClass && partStart < partEnd) {
              allDecorations.push({
                from: partStart,
                to: partEnd,
                decoration: Decoration.mark({ class: styleClass }),
                type: 'mark',
                priority: partIndex + 1
              })
            }

            // 移动到下一部分（跳过句点）
            currentPos = partEnd + 1
          }

          // 为HTTP方法行添加左边框
          if (parts.length > 1 && httpMethodColors[parts[1].toUpperCase()]) {
            const methodClass = httpMethodColors[parts[1].toUpperCase()]
            allDecorations.push({
              from: line.from,
              to: line.from,
              decoration: Decoration.line({ class: `line-${methodClass}` }),
              type: 'line',
              priority: 0
            })
          }

        } else if (lineText.includes('/')) {
          // 检查是否为领域定义（包含斜杠分隔符）
          const parts = lineText.split('/')

          let currentPos = line.from

          for (let partIndex = 0; partIndex < parts.length; partIndex++) {
            const part = parts[partIndex]
            const partStart = currentPos
            const partEnd = partStart + part.length

            // 确定样式类名
            let styleClass = ''
            if (partIndex < domainPartColors.length) {
              styleClass = domainPartColors[partIndex]
            } else {
              // 超出预定义索引，使用描述样式
              styleClass = domainPartColors[1] // 使用描述样式
            }

            if (styleClass && partStart < partEnd) {
              allDecorations.push({
                from: partStart,
                to: partEnd,
                decoration: Decoration.mark({ class: styleClass }),
                type: 'mark',
                priority: partIndex + 1
              })
            }

            // 移动到下一部分（跳过斜杠）
            currentPos = partEnd + 1
          }
        }
      }

      try {
        // 统一排序：先按from位置，再按to位置，最后按优先级
        allDecorations.sort((a, b) => {
          if (a.from !== b.from) return a.from - b.from
          if (a.to !== b.to) return a.to - b.to
          return a.priority - b.priority
        })

        // 按正确顺序添加所有装饰
        for (const { from, to, decoration } of allDecorations) {
          if (from <= to) {
            builder.add(from, to, decoration)
          }
        }

        return builder.finish()

      } catch (error) {
        return Decoration.none
      }
    }
  }, {
    decorations: v => v.decorations
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
      createSyntaxDecorator(),
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
          padding: '12px 16px',
          marginLeft: '0',
          display: 'block',
          whiteSpace: 'pre-wrap',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 242, 242, 0.92) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          margin: '6px 12px',
          border: 'none',
          color: '#dc2626',
          fontSize: '13px',
          fontWeight: '500',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          position: 'relative',
          overflow: 'hidden'
        },
        '.cm-diagnostic::before': {
          content: '""',
          position: 'absolute',
          left: '0',
          top: '0',
          bottom: '0',
          width: '4px',
          background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '0 4px 4px 0'
        },
        '.cm-diagnostic-error': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 242, 242, 0.92) 100%)',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8) inset'
        },
        '.cm-diagnostic-error::before': {
          background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)'
        },
        '.cm-diagnostic-warning': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 251, 235, 0.92) 100%)',
          color: '#d97706',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8) inset'
        },
        '.cm-diagnostic-warning::before': {
          background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
        },
        '.cm-lintRange-error': {
          backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(239, 68, 68, 0.6) 50%, transparent 60%)',
          'background-position': 'left bottom',
          backgroundRepeat: 'repeat-x',
          backgroundSize: '6px 2px',
          borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
          animation: 'errorUnderline 2s ease-in-out infinite'
        },
        '.cm-lintRange-warning': {
          backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(245, 158, 11, 0.6) 50%, transparent 60%)',
          'background-position': 'left bottom',
          backgroundRepeat: 'repeat-x',
          backgroundSize: '6px 2px',
          borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
          animation: 'warningUnderline 2s ease-in-out infinite'
        },
        '.cm-tooltip.cm-tooltip-lint': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(25px)',
          borderRadius: '16px',
          padding: '12px 16px',
          fontSize: '13px',
          fontWeight: '500',
          color: '#2c3e50',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          maxWidth: '320px',
          lineHeight: '1.4'
        },
        // 美化tooltip的不同位置变体
        '.cm-tooltip': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(25px)',
          borderRadius: '16px',
          padding: '8px 0',
          fontSize: '13px',
          border: 'none',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          listStyle: 'none',
          margin: '0',
          overflow: 'hidden'
        },
        '.cm-tooltip-below': {
          marginTop: '8px'
        },
        '.cm-tooltip-above': {
          marginBottom: '8px'
        },
        // 美化diagnostic文本
        '.cm-diagnosticText': {
          color: 'inherit',
          fontSize: '13px',
          fontWeight: '500',
          lineHeight: '1.4'
        },
        // 注释样式
        '.syntax-comment': {
          color: '#6b7280',
          background: 'rgba(107, 114, 128, 0.1)',
          fontStyle: 'italic',
          opacity: '0.8',
          borderRadius: '4px',
          padding: '1px 4px'
        },

        // API脚本部分样式（按句点分隔的6个部分）
        '.api-domain': {
          color: '#7c3aed',
          background: 'rgba(124, 58, 237, 0.1)',
          fontWeight: '600',
          borderRadius: '4px',
          padding: '1px 4px'
        },
        '.api-method': {
          color: '#059669',
          background: 'rgba(5, 150, 105, 0.1)',
          fontWeight: '700',
          borderRadius: '4px',
          padding: '1px 4px'
        },
        '.api-path': {
          color: '#0369a1',
          background: 'rgba(3, 105, 161, 0.1)',
          fontWeight: '500',
          fontStyle: 'italic',
          borderRadius: '4px',
          padding: '1px 4px'
        },
        '.api-operation': {
          color: '#dc2626',
          background: 'rgba(220, 38, 38, 0.1)',
          fontWeight: '600',
          borderRadius: '4px',
          padding: '1px 4px'
        },
        '.api-contract': {
          color: '#ea580c',
          background: 'rgba(234, 88, 12, 0.1)',
          fontWeight: '500',
          borderRadius: '4px',
          padding: '1px 4px'
        },
        '.api-description': {
          color: '#6b7280',
          background: 'rgba(107, 114, 128, 0.08)',
          fontStyle: 'italic',
          borderRadius: '4px',
          padding: '1px 4px'
        },

        // 领域部分样式（按斜杠分隔的2个部分）
        '.domain-name': {
          color: '#7c2d12',
          background: 'rgba(124, 45, 18, 0.1)',
          fontWeight: '700',
          borderRadius: '4px',
          padding: '1px 4px'
        },
        '.domain-description': {
          color: '#92400e',
          background: 'rgba(146, 64, 14, 0.1)',
          fontWeight: '500',
          fontStyle: 'italic',
          borderRadius: '4px',
          padding: '1px 4px'
        },

        // HTTP方法特殊样式（覆盖api-method的默认样式）
        '.http-method-get': {
          color: '#22c55e',
          background: 'rgba(34, 197, 94, 0.15)',
          fontWeight: '700',
          borderRadius: '4px',
          padding: '1px 4px',
          textShadow: '0 1px 2px rgba(34, 197, 94, 0.3)'
        },
        '.http-method-post': {
          color: '#f59e0b',
          background: 'rgba(245, 158, 11, 0.15)',
          fontWeight: '700',
          borderRadius: '4px',
          padding: '1px 4px',
          textShadow: '0 1px 2px rgba(245, 158, 11, 0.3)'
        },
        '.http-method-put': {
          color: '#3b82f6',
          background: 'rgba(59, 130, 246, 0.15)',
          fontWeight: '700',
          borderRadius: '4px',
          padding: '1px 4px',
          textShadow: '0 1px 2px rgba(59, 130, 246, 0.3)'
        },
        '.http-method-patch': {
          color: '#06b6d4',
          background: 'rgba(6, 182, 212, 0.15)',
          fontWeight: '700',
          borderRadius: '4px',
          padding: '1px 4px',
          textShadow: '0 1px 2px rgba(6, 182, 212, 0.3)'
        },
        '.http-method-delete': {
          color: '#ef4444',
          background: 'rgba(239, 68, 68, 0.15)',
          fontWeight: '700',
          borderRadius: '4px',
          padding: '1px 4px',
          textShadow: '0 1px 2px rgba(239, 68, 68, 0.3)'
        },
        '.http-method-head': {
          color: '#8b5cf6',
          background: 'rgba(139, 92, 246, 0.15)',
          fontWeight: '700',
          borderRadius: '4px',
          padding: '1px 4px',
          textShadow: '0 1px 2px rgba(139, 92, 246, 0.3)'
        },
        '.http-method-options': {
          color: '#ec4899',
          background: 'rgba(236, 72, 153, 0.15)',
          fontWeight: '700',
          borderRadius: '4px',
          padding: '1px 4px',
          textShadow: '0 1px 2px rgba(236, 72, 153, 0.3)'
        },

        // HTTP方法行左边框样式（只保留左边框，去掉背景色）
        '.line-http-method-get': {
          borderLeft: '4px solid #22c55e',
          paddingLeft: '8px'
        },
        '.line-http-method-post': {
          borderLeft: '4px solid #f59e0b',
          paddingLeft: '8px'
        },
        '.line-http-method-put': {
          borderLeft: '4px solid #3b82f6',
          paddingLeft: '8px'
        },
        '.line-http-method-patch': {
          borderLeft: '4px solid #06b6d4',
          paddingLeft: '8px'
        },
        '.line-http-method-delete': {
          borderLeft: '4px solid #ef4444',
          paddingLeft: '8px'
        },
        '.line-http-method-head': {
          borderLeft: '4px solid #8b5cf6',
          paddingLeft: '8px'
        },
        '.line-http-method-options': {
          borderLeft: '4px solid #ec4899',
          paddingLeft: '8px'
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

  result += validation.errors.map((error) => {
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
    return false
  }

  // 确保 store 数据是最新的
  store.updateRcsContent(content)

  if (store.loadedFilePath) {
    // 直接保存编辑器内容
    try {
      window.api.writeFile(store.loadedFilePath, content)
      ElMessage.success(`保存成功`)
      return true
    } catch (error) {
      ElMessage.error('保存失败')
      console.error(error)
      return false
    }
  } else {
    const filePath = await window.api.showSaveDialog()
    if (filePath) {
      try {
        window.api.writeFile(filePath, content)
        ElMessage.success(`保存成功`)
        store.loadedFilePath = filePath
        return true
      } catch (error) {
        ElMessage.error('保存失败')
        console.error(error)
        return false
      }
    }
  }
  return false
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
  getCurrentContent,
  saveScripts
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
  min-height: 335px;
  position: relative;
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
  position: relative;
}

.editor-container :deep(.cm-focused) {
  outline: none;
}

.editor-container :deep(.cm-scroller) {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 122, 255, 0.3) transparent;
  font-family: 'SF Mono', 'Monaco', 'Consolas', 'Courier New', monospace;
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
  background: linear-gradient(135deg,
      rgba(175, 82, 222, 0.4),
      rgba(191, 90, 242, 0.4));
  border-radius: 4px;
  transition: background 0.3s ease;
}

.editor-container :deep(.cm-scroller::-webkit-scrollbar-thumb:hover) {
  background: linear-gradient(135deg,
      rgba(175, 82, 222, 0.6),
      rgba(191, 90, 242, 0.6));
}

.editor-container :deep(.cm-line) {
  padding: 2px 12px;
  transition: all 0.2s ease;
}

.editor-container :deep(.cm-line:hover) {
  background: rgba(175, 82, 222, 0.03);
}

.editor-container :deep(.cm-gutters) {
  background: linear-gradient(135deg,
      rgba(248, 249, 250, 0.95) 0%,
      rgba(241, 245, 249, 0.9) 100%);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 0;
  position: relative;
}

.editor-container :deep(.cm-lineNumbers .cm-gutterElement) {
  color: #6c757d;
  font-size: 12px;
  font-weight: 500;
  padding: 0 8px;
  transition: color 0.2s ease;
}

.editor-container :deep(.cm-activeLine) {
  background: linear-gradient(90deg,
      rgba(175, 82, 222, 0.08) 0%,
      rgba(191, 90, 242, 0.05) 50%,
      rgba(175, 82, 222, 0.08) 100%);
  animation: activeLinePulse 3s ease-in-out infinite;
}

@keyframes activeLinePulse {

  0%,
  100% {
    background: linear-gradient(90deg,
        rgba(175, 82, 222, 0.08) 0%,
        rgba(191, 90, 242, 0.05) 50%,
        rgba(175, 82, 222, 0.08) 100%);
  }

  50% {
    background: linear-gradient(90deg,
        rgba(175, 82, 222, 0.12) 0%,
        rgba(191, 90, 242, 0.08) 50%,
        rgba(175, 82, 222, 0.12) 100%);
  }
}

.editor-container :deep(.cm-selectionBackground) {
  background: linear-gradient(135deg,
      rgba(175, 82, 222, 0.25),
      rgba(191, 90, 242, 0.15));
}

.editor-container :deep(.cm-cursor) {
  border-left: 2px solid #AF52DE;
  animation: cursorBlink 1.5s ease-in-out infinite;
}

@keyframes cursorBlink {

  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0.3;
  }
}

/* 错误下划线动画 */
@keyframes errorUnderline {

  0%,
  100% {
    background-position: 0% bottom;
    opacity: 0.7;
  }

  50% {
    background-position: 100% bottom;
    opacity: 1;
  }
}

/* 警告下划线动画 */
@keyframes warningUnderline {

  0%,
  100% {
    background-position: 0% bottom;
    opacity: 0.6;
  }

  50% {
    background-position: 100% bottom;
    opacity: 0.9;
  }
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
</style>