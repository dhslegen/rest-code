<template>
  <div class="window-container"
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100vh; margin: 0; padding: 0; overflow: hidden;">
    <div class="app-container">
      <!-- 自定义标题栏 -->
      <div class="custom-titlebar" :class="{ 'darwin': isDarwin, 'win32': isWin32 }">
        <div class="titlebar-drag-region">
          <div class="app-title">
            <div class="app-logo">⚡</div>
            <span class="app-name">Rest Code</span>
          </div>
        </div>

        <!-- 更新检查按钮 -->
        <div class="titlebar-actions" v-if="isDarwin">
          <el-button text size="small" @click="checkForUpdates" :loading="checkingUpdate" class="update-check-btn"
            title="检查更新">
            <el-icon>
              <Refresh />
            </el-icon>
            <span class="update-btn-text">检查更新</span>
          </el-button>
        </div>

        <div class="window-controls" v-if="!isDarwin">
          <el-button text size="small" @click="checkForUpdates" :loading="checkingUpdate" class="update-check-btn"
            title="检查更新">
            <el-icon>
              <Refresh />
            </el-icon>
            <span class="update-btn-text">检查更新</span>
          </el-button>
          <button class="control-btn minimize-btn" @click="minimizeWindow">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2" y="5.5" width="8" height="1" fill="currentColor" />
            </svg>
          </button>
          <button class="control-btn maximize-btn" @click="maximizeWindow">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2" y="2" width="8" height="8" stroke="currentColor" stroke-width="1" fill="none" />
            </svg>
          </button>
          <button class="control-btn close-btn" @click="closeWindow">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="app-content">
        <!-- 操作区域 -->
        <div class="section-card operation-section">
          <div class="section-header" @click="toggleSection('operation')">
            <div class="section-icon">⚡</div>
            <span class="section-title">操作区域</span>
            <el-button text class="collapse-btn" @click.stop="toggleSection('operation')"
              :icon="sectionCollapsed.operation ? 'ArrowDown' : 'ArrowUp'" />
          </div>
          <el-collapse-transition>
            <div v-show="!sectionCollapsed.operation" class="section-content">
              <div class="content-grid">
                <div class="card-wrapper file-loader-card">
                  <div class="card-header">
                    <div class="card-icon">📁</div>
                    <span class="card-title">文件加载</span>
                  </div>
                  <div class="card-content">
                    <file-loader />
                  </div>
                </div>
                <div class="card-wrapper code-generator-card">
                  <div class="card-header">
                    <div class="card-icon">🚀</div>
                    <span class="card-title">生成代码</span>
                  </div>
                  <div class="card-content">
                    <code-generator :script-editor-ref="scriptViewerRef" @preview-code="handlePreviewCode" />
                  </div>
                </div>
              </div>
            </div>
          </el-collapse-transition>
        </div>

        <!-- 领域设计区域 -->
        <div class="section-card domain-section">
          <div class="section-header" @click="toggleSection('domain')">
            <div class="section-icon">🎯</div>
            <span class="section-title">领域设计</span>
            <el-button text class="collapse-btn" @click.stop="toggleSection('domain')"
              :icon="sectionCollapsed.domain ? 'ArrowDown' : 'ArrowUp'" />
          </div>
          <el-collapse-transition>
            <div v-show="!sectionCollapsed.domain" class="section-content">
              <domain-editor />
            </div>
          </el-collapse-transition>
        </div>

        <!-- 脚本设计区域 -->
        <div class="section-card script-section">
          <div class="section-header" @click="toggleSection('script')">
            <div class="section-icon">⚙️</div>
            <span class="section-title">脚本设计</span>
            <el-button text class="collapse-btn" @click.stop="toggleSection('script')"
              :icon="sectionCollapsed.script ? 'ArrowDown' : 'ArrowUp'" />
          </div>
          <el-collapse-transition>
            <div v-show="!sectionCollapsed.script" class="section-content">
              <script-editor />
            </div>
          </el-collapse-transition>
        </div>

        <!-- 脚本编辑器区域 -->
        <div class="section-card editor-section">
          <div class="section-header">
            <div class="section-icon">📝</div>
            <span class="section-title">脚本编辑器</span>
          </div>
          <div class="section-content editor-content">
            <script-viewer ref="scriptViewerRef" @open-gpt-dialog="showGptDialog = true"
              @open-about-dialog="showAboutDialog = true" @open-help-dialog="showHelpDialog = true" />
          </div>
        </div>

        <!-- 专注模式悬浮按钮 -->
        <div class="focus-mode-fab" :class="{ 'active': focusModeActive, 'dragging': fabPosition.isDragging }" :style="{
          left: fabPosition.x + 'px',
          top: fabPosition.y + 'px'
        }" @click="handleFabClick" @mousedown="startDrag"
          :title="focusModeActive ? '退出专注模式 (Cmd/Ctrl+F)' : '进入专注模式 (Cmd/Ctrl+F) | 支持拖拽移动位置'">
          <div class="fab-icon">
            <svg v-if="!focusModeActive" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <!-- 专注模式图标 - 圆形加上焦点 -->
              <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path d="M2 12h4M18 12h4M12 2v4M12 18v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
              <!-- 退出专注模式图标 - 展开箭头 -->
              <path d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M8 21v-3a2 2 0 0 1-2-2H3M16 21v-3a2 2 0 0 0 2-2h3"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="fab-text">{{ focusModeActive ? '退出专注' : '专注模式' }}</div>
        </div>
      </div>
    </div>

    <!-- 更新检查对话框 -->
    <div v-if="updateDialogVisible" class="update-dialog-overlay" @click="updateDialogVisible = false">
      <div class="update-dialog" @click.stop>
        <div class="update-dialog-header">
          <div class="update-icon">🚀</div>
          <div class="update-title">
            <h3>发现新版本</h3>
            <p>有可用的更新版本</p>
          </div>
          <button class="close-btn" @click="updateDialogVisible = false">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="update-dialog-content">
          <div class="version-comparison">
            <div class="version-card current">
              <div class="version-label">当前版本</div>
              <div class="version-number">{{ updateInfo.currentVersion }}</div>
            </div>
            <div class="version-arrow">→</div>
            <div class="version-card latest">
              <div class="version-label">最新版本</div>
              <div class="version-number">{{ updateInfo.latestVersion }}</div>
            </div>
          </div>

          <div class="release-notes" v-if="updateInfo.releaseNotes">
            <h4>更新内容</h4>
            <div class="notes-content scrollable-content" v-html="releaseNotesHtml"></div>
          </div>
        </div>

        <div class="update-dialog-footer">
          <button class="btn-secondary" @click="updateDialogVisible = false">
            稍后提醒
          </button>
          <button class="btn-primary" @click="downloadUpdate">
            <svg width="16" height="16" viewBox="0 0 16 16" style="margin-right: 6px;">
              <path d="M8 1v10M4 7l4 4 4-4M2 14h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            立即下载
          </button>
        </div>
      </div>
    </div>

    <!-- GPT 指令对话框 -->
    <div v-if="showGptDialog" class="dialog-overlay" @click="showGptDialog = false">
      <div class="modern-dialog gpt-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-icon">🤖</div>
          <div class="dialog-title">
            <h3>RCS 脚本生成专家</h3>
            <p>将 Markdown 表格的中文伪代码解析为 RCS 文件</p>
          </div>
          <button class="dialog-close-btn" @click="showGptDialog = false">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="dialog-content">
          <div class="scrollable-content" v-html="gptContentHtml"></div>
        </div>

        <div class="dialog-footer">
          <button class="btn-primary" @click="showGptDialog = false">
            <svg width="16" height="16" viewBox="0 0 16 16" style="margin-right: 6px;">
              <path d="M8 12L3 7l1.5-1.5L8 9l5.5-3.5L15 7l-7 5z" fill="currentColor" />
            </svg>
            知道了
          </button>
        </div>
      </div>
    </div>

    <!-- 关于对话框 -->
    <div v-if="showAboutDialog" class="dialog-overlay" @click="showAboutDialog = false">
      <div class="modern-dialog about-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-icon">ℹ️</div>
          <div class="dialog-title">
            <h3>Rest Code</h3>
            <p>可视化API脚本生成工具</p>
          </div>
          <button class="dialog-close-btn" @click="showAboutDialog = false">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="dialog-content">
          <div class="info-grid">
            <div class="info-card version-card">
              <div class="card-icon">🚀</div>
              <div class="card-content">
                <label>当前版本</label>
                <a href="javascript:void(0)"
                   @click="openLink('https://github.com/dhslegen/rest-code/releases/tag/v1.1.3')" class="link-btn">
                  v1.1.3
                </a>
              </div>
            </div>
            <div class="info-card download-card">
              <div class="card-icon">📥</div>
              <div class="card-content">
                <label>最新版下载</label>
                <a href="javascript:void(0)" @click="openLink('https://github.com/dhslegen/rest-code/releases')"
                  class="link-btn">
                  点击下载
                </a>
              </div>
            </div>
            <div class="info-card repo-card">
              <div class="card-icon">📁</div>
              <div class="card-content">
                <label>源码仓库</label>
                <a href="javascript:void(0)" @click="openLink('https://github.com/dhslegen/rest-code/releases')"
                  class="link-btn">
                  点击访问
                </a>
              </div>
            </div>
            <div class="info-card author-card">
              <div class="card-icon">👨‍💻</div>
              <div class="card-content">
                <label>作者</label>
                <a href="javascript:void(0)" @click="openLink('https://dahaoshen.com')" class="link-btn">
                  dahaoshen
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-secondary" @click="showAboutDialog = false">
            <svg width="16" height="16" viewBox="0 0 16 16" style="margin-right: 6px;">
              <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            关闭
          </button>
        </div>
      </div>
    </div>

    <!-- 帮助对话框 -->
    <div v-if="showHelpDialog" class="dialog-overlay" @click="showHelpDialog = false">
      <div class="modern-dialog help-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-icon">❓</div>
          <div class="dialog-title">
            <h3>使用指南</h3>
            <p>快速上手 Rest Code 的完整指南</p>
          </div>
          <button class="dialog-close-btn" @click="showHelpDialog = false">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="dialog-content">
          <div class="scrollable-content" v-html="helpContentHtml"></div>
        </div>

        <div class="dialog-footer">
          <button class="btn-primary" @click="showHelpDialog = false">
            <svg width="16" height="16" viewBox="0 0 16 16" style="margin-right: 6px;">
              <path d="M8 2v8M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            明白了
          </button>
        </div>
      </div>
    </div>

    <!-- 预览代码对话框 -->
    <div v-if="showPreviewDialog" class="dialog-overlay" @click="showPreviewDialog = false">
      <div class="modern-dialog preview-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-icon">👀</div>
          <div class="dialog-title">
            <h3>代码预览</h3>
            <p>生成的Java代码结构预览</p>
          </div>
          <button class="dialog-close-btn" @click="showPreviewDialog = false">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="dialog-content">
          <div class="scrollable-content" v-html="previewContentHtml"></div>
        </div>

        <div class="dialog-footer">
          <button class="btn-primary" @click="showPreviewDialog = false">
            <svg width="16" height="16" viewBox="0 0 16 16" style="margin-right: 6px;">
              <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileLoader from './components/FileLoader.vue'
import DomainEditor from './components/DomainEditor.vue'
import ScriptEditor from './components/ScriptEditor.vue'
import ScriptViewer from './components/ScriptViewer.vue'
import CodeGenerator from './components/CodeGenerator.vue'
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import helpContentRaw from './docs/help.md?raw'
import gptContentRaw from './docs/GPT.md?raw'

// 平台检测
const platform = ref('')
const isDarwin = computed(() => platform.value === 'darwin')
const isWin32 = computed(() => platform.value === 'win32')

// 状态管理
const scriptViewerRef = ref()
const checkingUpdate = ref(false)

// 弹窗管理
const updateDialogVisible = ref(false)
const updateInfo = ref({
  currentVersion: '',
  latestVersion: '',
  releaseNotes: '',
  downloadUrl: ''
})

// 新增的对话框状态
const showGptDialog = ref(false)
const showAboutDialog = ref(false)
const showHelpDialog = ref(false)
const showPreviewDialog = ref(false)

// 预览相关状态
const previewContent = ref('')

// Markdown 处理
const helpContent = ref(helpContentRaw)
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
const previewContentHtml = computed(() => md.render(previewContent.value))
const releaseNotesHtml = computed(() => {
  return updateInfo.value.releaseNotes ? md.render(updateInfo.value.releaseNotes) : ''
})

// 预览代码处理函数
const handlePreviewCode = (content: string) => {
  previewContent.value = content
  showPreviewDialog.value = true
}

// 打开外部链接
const openLink = (url: string) => {
  if ((window as any).api?.openExternal) {
    (window as any).api.openExternal(url)
  }
}

// 获取平台信息
onMounted(async () => {
  platform.value = navigator.platform.toLowerCase().includes('mac') ? 'darwin' :
    navigator.platform.toLowerCase().includes('win') ? 'win32' : 'linux'

  // 获取当前版本
  if ((window.api as any)?.getCurrentVersion) {
    updateInfo.value.currentVersion = await (window.api as any).getCurrentVersion()
  }

  // 监听自动更新检查结果
  if ((window.api as any)?.onUpdateAvailable) {
    (window.api as any).onUpdateAvailable((updateData: any) => {
      updateInfo.value = updateData
      updateDialogVisible.value = true
    })
  }

  // 添加键盘快捷键监听
  document.addEventListener('keydown', handleKeydown)

  // 初始化悬浮按钮位置
  initFabPosition()

  // 监听窗口大小变化，调整按钮位置
  window.addEventListener('resize', handleWindowResize)

  // 开始监听内容变化
  startContentObserver()
})

// 键盘快捷键处理
const handleKeydown = (event: KeyboardEvent) => {
  // Cmd/Ctrl + F 切换专注模式
  if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
    event.preventDefault()
    toggleFocusMode()
  }
}

// 窗口控制方法
const minimizeWindow = () => {
  if (window.api?.minimizeWindow) {
    window.api.minimizeWindow()
  }
}

const maximizeWindow = () => {
  if (window.api?.maximizeWindow) {
    window.api.maximizeWindow()
  }
}

const closeWindow = () => {
  if (window.api?.closeWindow) {
    window.api.closeWindow()
  }
}

// 手动检查更新
const checkForUpdates = async () => {
  checkingUpdate.value = true
  try {
    const api = (window as any).api
    if (!api || !api.checkForUpdates) {
      ElMessage.warning('更新功能不可用')
      return
    }

    const result = await api.checkForUpdates()
    console.log('手动检查更新结果:', result)

    if (result.hasUpdate) {
      updateInfo.value = {
        currentVersion: await api.getCurrentVersion(),
        latestVersion: result.latestVersion || '',
        releaseNotes: result.releaseNotes || '暂无发布说明',
        downloadUrl: result.downloadUrl || ''
      }
      updateDialogVisible.value = true
    } else {
      ElMessage.success('当前已是最新版本！')
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    ElMessage.error('检查更新失败，请稍后重试')
  } finally {
    checkingUpdate.value = false
  }
}

const downloadUpdate = () => {
  if (updateInfo.value.downloadUrl && (window.api as any)?.openDownloadPage) {
    (window.api as any).openDownloadPage(updateInfo.value.downloadUrl)
  }
}

// 各区域的折叠状态
const sectionCollapsed = reactive({
  operation: false,
  domain: true,
  script: false
})

// 切换区域折叠状态
const toggleSection = (section: keyof typeof sectionCollapsed) => {
  sectionCollapsed[section] = !sectionCollapsed[section]
}

// 专注模式状态
const focusModeActive = ref(false)
const fabPosition = reactive({
  x: 0,
  y: 0,
  isDragging: false
})

// 初始化悬浮按钮位置（右侧垂直居中）
const initFabPosition = () => {
  fabPosition.x = window.innerWidth - 70 // 距离右边缘70px
  fabPosition.y = window.innerHeight * 0.70 - 30
}

// 拖拽相关变量
let dragStartX = 0
let dragStartY = 0
let dragOffsetX = 0
let dragOffsetY = 0
let hasDragged = false // 标记是否发生了拖拽

// 悬浮按钮拖拽开始
const startDrag = (event: MouseEvent) => {
  fabPosition.isDragging = true
  hasDragged = false // 重置拖拽标记

  const rect = (event.target as HTMLElement).getBoundingClientRect()
  dragStartX = event.clientX
  dragStartY = event.clientY
  dragOffsetX = event.clientX - rect.left
  dragOffsetY = event.clientY - rect.top

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
  event.preventDefault()
}

// 拖拽过程中
const onDrag = (event: MouseEvent) => {
  if (!fabPosition.isDragging) return

  const deltaX = Math.abs(event.clientX - dragStartX)
  const deltaY = Math.abs(event.clientY - dragStartY)

  // 如果移动距离超过阈值，标记为拖拽
  if (deltaX > 5 || deltaY > 5) {
    hasDragged = true
  }

  const newX = event.clientX - dragOffsetX
  const newY = event.clientY - dragOffsetY

  // 限制在视窗范围内
  const maxX = window.innerWidth - 60
  const maxY = window.innerHeight - 60

  fabPosition.x = Math.max(0, Math.min(newX, maxX))
  fabPosition.y = Math.max(0, Math.min(newY, maxY))
}

// 拖拽结束
const endDrag = () => {
  fabPosition.isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
}

// 动态检测滚动空间并智能滚动
const smartScrollToFocus = () => {
  const appContent = document.querySelector('.app-content') as HTMLElement
  if (!appContent) return false

  const scrollHeight = appContent.scrollHeight
  const clientHeight = appContent.clientHeight
  const currentScrollTop = appContent.scrollTop

  // 检查是否有向下滚动的空间
  const hasScrollSpace = scrollHeight > clientHeight
  const canScrollDown = currentScrollTop < (scrollHeight - clientHeight)

  if (hasScrollSpace && canScrollDown) {
    // 平滑滚动到底部，确保编辑器区域完全可见
    appContent.scrollTo({
      top: scrollHeight - clientHeight,
      behavior: 'smooth'
    })
    return true
  }

  return false
}

// 切换专注模式
const toggleFocusMode = () => {
  focusModeActive.value = !focusModeActive.value

  const appContent = document.querySelector('.app-content') as HTMLElement
  if (!appContent) return

  if (focusModeActive.value) {
    // 进入专注模式
    const didScroll = smartScrollToFocus()

    // 禁用滚轮
    appContent.style.overflow = 'hidden'

    // 开始监听内容变化以保持置底
    startContentObserver()

    // 显示带快捷键的提示
    if (didScroll) {
      ElMessage.success('已进入专注模式并滚动到编辑区域 (快捷键: Cmd/Ctrl+F)')
    } else {
      ElMessage.success('已进入专注模式，专心编辑脚本 (快捷键: Cmd/Ctrl+F)')
    }
  } else {
    // 退出专注模式
    // 恢复滚轮
    appContent.style.overflow = 'auto'

    // 停止监听内容变化
    stopContentObserver()

    // 显示退出提示
    ElMessage.info('已退出专注模式，恢复正常滚动 (快捷键: Cmd/Ctrl+F)')
  }
}

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('keydown', handleKeydown)
  // 清理窗口大小变化监听器
  window.removeEventListener('resize', handleWindowResize)
  // 清理拖拽事件监听器（如果存在）
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  // 清理内容观察器
  stopContentObserver()
})

// 窗口大小变化处理函数
const handleWindowResize = () => {
  // 如果按钮超出了新的窗口范围，重新调整位置
  const maxX = window.innerWidth - 60
  const maxY = window.innerHeight - 60

  if (fabPosition.x > maxX) {
    fabPosition.x = maxX
  }
  if (fabPosition.y > maxY) {
    fabPosition.y = maxY
  }

  // 如果处于专注模式，窗口大小变化时保持置底
  if (focusModeActive.value) {
    setTimeout(() => {
      maintainBottomScroll()
    }, 100) // 延迟一点确保布局完成
  }
}

// 内容变化观察器
let contentObserver: MutationObserver | null = null

// 保持底部滚动的函数
const maintainBottomScroll = () => {
  if (!focusModeActive.value) return

  const appContent = document.querySelector('.app-content') as HTMLElement
  if (!appContent) return

  const scrollHeight = appContent.scrollHeight
  const clientHeight = appContent.clientHeight

  if (scrollHeight > clientHeight) {
    appContent.scrollTo({
      top: scrollHeight - clientHeight,
      behavior: 'smooth'
    })
  }
}

// 开始监听内容变化
const startContentObserver = () => {
  const appContent = document.querySelector('.app-content') as HTMLElement
  if (!appContent || contentObserver) return

  contentObserver = new MutationObserver((mutations) => {
    // 检查是否有实际的内容变化
    const hasContentChanges = mutations.some(mutation =>
      mutation.type === 'childList' ||
      (mutation.type === 'attributes' &&
        (mutation.attributeName === 'style' || mutation.attributeName === 'class'))
    )

    if (hasContentChanges && focusModeActive.value) {
      // 延迟执行，确保DOM更新完成
      setTimeout(() => {
        maintainBottomScroll()
      }, 50)
    }
  })

  // 观察整个app-content及其子树的变化
  contentObserver.observe(appContent, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'data-*']
  })
}

// 停止监听内容变化
const stopContentObserver = () => {
  if (contentObserver) {
    contentObserver.disconnect()
    contentObserver = null
  }
}

// 处理按钮点击（需要区分点击和拖拽）
const handleFabClick = () => {
  // 如果刚刚发生了拖拽，不执行切换
  if (hasDragged) {
    hasDragged = false
    return
  }

  toggleFocusMode()
}
</script>

<style scoped>
/* 自定义标题栏样式 */
.custom-titlebar {
  height: 40px;
  background: transparent;
  /* 改为透明 */
  backdrop-filter: blur(25px);
  border-bottom: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1000;
  user-select: none;
  box-shadow: none;
  /* 移除阴影 */
  flex-shrink: 0;
  /* 防止被压缩 */
}

.custom-titlebar.darwin {
  padding-left: 80px;
  /* 为macOS交通灯按钮留出空间 */
  padding-right: 20px;
}

.custom-titlebar.win32 {
  padding-left: 20px;
  padding-right: 0;
}

.titlebar-drag-region {
  -webkit-app-region: drag;
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 居中显示 */
}

.titlebar-actions {
  -webkit-app-region: no-drag;
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.update-check-btn {
  color: rgba(255, 255, 255, 0.8) !important;
  padding: 8px 16px !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;

  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.update-check-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 1) !important;
  transform: scale(1.05) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2) !important;
}

.update-check-btn.is-loading {
  color: rgba(255, 255, 255, 0.6) !important;
  background: rgba(255, 255, 255, 0.15) !important;
}

.update-btn-text {
  font-size: 12px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-logo {
  font-size: 18px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  animation: logoGlow 3s ease-in-out infinite;
}

@keyframes logoGlow {

  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 3px 8px rgba(175, 82, 222, 0.4));
  }
}

.app-name {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  /* 改为白色 */
  background: linear-gradient(135deg, #ffffff, #f8f9fa, #e9ecef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  /* 增强阴影 */
}

.window-controls {
  -webkit-app-region: no-drag;
  display: flex;
  height: 100%;
}

.control-btn {
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 10px;
  position: relative;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.close-btn:hover {
  background: linear-gradient(135deg, #ff5f56, #ff4545);
  color: white;
  transform: scale(1.05);
}

.maximize-btn:hover {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.15), rgba(90, 200, 250, 0.12));
  color: #007AFF;
  transform: scale(1.05);
}

.minimize-btn:hover {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 204, 2, 0.12));
  color: #FF9500;
  transform: scale(1.05);
}

.app-container {
  min-height: 100%;
  /* 填满window-container */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #E33D98 50%, #f5576c 75%, #4facfe 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.section-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 0;
  margin: 0 20px 20px 20px;
  /* 添加左右margin */
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 移除hover动画效果 */
/* .section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
} */

/* 第一个section与标题栏的间距 */
.operation-section {
  margin-top: 10px;
  /* 移除顶部间距，因为移除了gap */
  box-shadow: 0 0 30px rgba(255, 59, 48, 0.3), 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.2);
}

.domain-section {
  box-shadow: 0 0 30px rgba(52, 199, 89, 0.3), 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(52, 199, 89, 0.2);
}

.script-section {
  box-shadow: 0 0 30px rgba(0, 122, 255, 0.3), 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 122, 255, 0.2);
}

.editor-section {
  box-shadow: 0 0 30px rgba(175, 82, 222, 0.3), 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(175, 82, 222, 0.2);
  flex: 1;
  min-height: 250px;
}

.section-header {
  display: flex;
  align-items: center;
  padding: 16px 20px 12px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 24px 24px 0 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: background 0.2s ease;
}

.section-header:hover {
  background: rgba(255, 255, 255, 0.9);
}

.section-icon {
  font-size: 16px;
  margin-right: 10px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
  letter-spacing: -0.2px;
}

.collapse-btn {
  color: #666;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.section-content {
  padding: 20px;
}

.editor-content {
  padding: 0;
  height: 390px;
  min-height: 200px;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 24px;
}

.card-wrapper {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  overflow: hidden;
  transition: all 0.3s ease;
}

.card-wrapper:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.file-loader-card:hover {
  box-shadow: 0 8px 25px rgba(255, 59, 48, 0.15);
}

.code-generator-card:hover {
  box-shadow: 0 8px 25px rgba(255, 149, 0, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.card-icon {
  font-size: 16px;
  margin-right: 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #2c2c2c;
}

.card-content {
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .app-container {
    padding: 16px;
  }

  .section-content {
    padding: 20px;
  }

  .card-content {
    padding: 16px;
  }
}

/* 全局下拉框样式 */
/* 重置浏览器默认样式 */
* {
  box-sizing: border-box;
}

html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* 防止滚动条出现 */
}

/* 强制#app填满窗口 */
#app {
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: initial !important;
  display: block !important;
  overflow: hidden !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 1 !important;
}

/* Element Plus 下拉框现代化样式 - 全局作用域 */
.el-select__popper {
  z-index: 2020 !important;
  border-radius: 16px !important;
  overflow: hidden !important;
  border: 1px solid rgba(0, 122, 255, 0.15) !important;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
  background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.98) 0%,
      rgba(248, 250, 252, 0.95) 100%) !important;
  backdrop-filter: blur(25px) !important;
}

.el-select__popper .el-select-dropdown {
  background: transparent !important;
  backdrop-filter: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 12px 0 !important;
  margin: 0 !important;
  min-width: 200px !important;
  animation: dropdownSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: none !important;
  height: 100% !important;
}

.el-select__popper[data-popper-placement*="top"] .el-select-dropdown {
  transform: translateY(4px) !important;
}

.el-select__popper[data-popper-placement*="bottom"] .el-select-dropdown {
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

.el-select-dropdown__item {
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
  border: none !important;
  line-height: 1.2 !important;
  min-height: auto !important;
  display: flex !important;
  align-items: center !important;
}

.el-select-dropdown__item span {
  position: relative !important;
  z-index: 2 !important;
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  line-height: 1.2 !important;
}

.el-select-dropdown__item::before {
  content: '' !important;
  position: absolute !important;
  left: 8px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 3px !important;
  height: 0 !important;
  background: linear-gradient(135deg, #007AFF, #5AC8FA) !important;
  border-radius: 2px !important;
  transition: height 0.3s ease !important;
  z-index: 1 !important;
}

.el-select-dropdown__item:hover {
  background: linear-gradient(135deg,
      rgba(0, 122, 255, 0.12) 0%,
      rgba(90, 200, 250, 0.08) 100%) !important;
  color: #007AFF !important;
  transform: translateX(4px) scale(1.02) !important;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.15) !important;
}

.el-select-dropdown__item:hover::before {
  height: 20px !important;
}

.el-select-dropdown__item:hover span {
  color: #007AFF !important;
  font-weight: 600 !important;
}

.el-select-dropdown__item.is-selected {
  background: linear-gradient(135deg,
      rgba(0, 122, 255, 0.18) 0%,
      rgba(90, 200, 250, 0.12) 100%) !important;
  color: #007AFF !important;
  font-weight: 700 !important;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.2) !important;
}

.el-select-dropdown__item.is-selected::before {
  height: 24px !important;
  background: linear-gradient(135deg, #007AFF, #5AC8FA, #34C759) !important;
}

.el-select-dropdown__item.is-selected span {
  color: #007AFF !important;
  font-weight: 700 !important;
}

.el-select-dropdown__item.is-selected::after {
  content: '✨' !important;
  position: absolute !important;
  right: 16px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  font-size: 16px !important;
  animation: selectedGlow 1.5s ease-in-out infinite !important;
  z-index: 2 !important;
}

@keyframes selectedGlow {

  0%,
  100% {
    opacity: 0.8;
    transform: translateY(-50%) scale(1);
  }

  50% {
    opacity: 1;
    transform: translateY(-50%) scale(1.1);
  }
}

/* 滚动条美化 */
.el-select-dropdown .el-scrollbar__wrap {
  scrollbar-width: thin !important;
  scrollbar-color: rgba(0, 122, 255, 0.4) transparent !important;
}

.el-select-dropdown .el-scrollbar__wrap::-webkit-scrollbar {
  width: 8px !important;
}

.el-select-dropdown .el-scrollbar__wrap::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03) !important;
  border-radius: 4px !important;
  margin: 12px 0 !important;
}

.el-select-dropdown .el-scrollbar__wrap::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg,
      rgba(0, 122, 255, 0.5),
      rgba(90, 200, 250, 0.4)) !important;
  border-radius: 4px !important;
  border: 2px solid transparent !important;
  background-clip: padding-box !important;
}

.el-select-dropdown .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg,
      rgba(0, 122, 255, 0.7),
      rgba(90, 200, 250, 0.6)) !important;
}

/* 代码生成区域下拉框 - 橙色主题 */
.code-generator-card .el-select__popper {
  border: 1px solid rgba(255, 149, 0, 0.15) !important;
}

.code-generator-card .el-select-dropdown__item::before {
  background: linear-gradient(135deg, #FF9500, #FFCC02) !important;
}

.code-generator-card .el-select-dropdown__item:hover {
  background: linear-gradient(135deg,
      rgba(255, 149, 0, 0.12) 0%,
      rgba(255, 204, 2, 0.08) 100%) !important;
  color: #FF9500 !important;
  box-shadow: 0 4px 20px rgba(255, 149, 0, 0.15) !important;
}

.code-generator-card .el-select-dropdown__item:hover span {
  color: #FF9500 !important;
}

.code-generator-card .el-select-dropdown__item.is-selected {
  background: linear-gradient(135deg,
      rgba(255, 149, 0, 0.18) 0%,
      rgba(255, 204, 2, 0.12) 100%) !important;
  color: #FF9500 !important;
  box-shadow: 0 4px 20px rgba(255, 149, 0, 0.2) !important;
}

.code-generator-card .el-select-dropdown__item.is-selected::before {
  background: linear-gradient(135deg, #FF9500, #FFCC02, #34C759) !important;
}

.code-generator-card .el-select-dropdown__item.is-selected span {
  color: #FF9500 !important;
}

.code-generator-card .el-select-dropdown__item.is-selected::after {
  content: '🔥' !important;
}

/* 现代化消息提示美化 - 与对话框设计语言一致 */
.el-message {
  position: fixed !important;
  top: 60px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  padding: 20px 28px !important;
  border-radius: 20px !important;
  border: none !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(25px) !important;
  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  letter-spacing: -0.1px !important;
  z-index: 3000 !important;
  line-height: 1.4 !important;
  min-width: 320px !important;
  max-width: 520px !important;
  overflow: hidden !important;
  animation: messageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 12px !important;
  text-align: center !important;
  margin: 0 !important;
  white-space: nowrap !important;
}

.el-message::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 3px !important;
  background: linear-gradient(90deg, #FF3B30, #FF9500, #FFCC02, #34C759, #007AFF, #5856D6, #AF52DE) !important;
  opacity: 0.8 !important;
}

@keyframes messageSlideIn {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-30px) scale(0.9) rotateX(10deg);
    filter: blur(8px);
  }

  30% {
    opacity: 0.6;
    transform: translateX(-50%) translateY(-10px) scale(0.98) rotateX(5deg);
    filter: blur(4px);
  }

  70% {
    opacity: 0.9;
    transform: translateX(-50%) translateY(5px) scale(1.02) rotateX(-2deg);
    filter: blur(1px);
  }

  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1) rotateX(0deg);
    filter: blur(0px);
  }
}

/* 成功消息 - 绿色主题 */
.el-message--success {
  color: #1a1a1a !important;
  border: 1px solid rgba(34, 197, 94, 0.2) !important;
  background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(240, 253, 244, 0.95) 50%,
      rgba(34, 197, 94, 0.08) 100%) !important;
  box-shadow:
    0 25px 80px rgba(34, 197, 94, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
}

.el-message--success::before {
  background: linear-gradient(90deg, #34C759, #22c55e, #16a34a) !important;
}

.el-message--success .el-message__icon {
  color: #22c55e !important;
  font-size: 20px !important;
  margin-right: 0 !important;
  filter: drop-shadow(0 2px 4px rgba(34, 197, 94, 0.2)) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 24px !important;
  height: 24px !important;
  border-radius: 8px !important;
  background: rgba(34, 197, 94, 0.1) !important;
  flex-shrink: 0 !important;
  position: relative !important;
}

.el-message--success .el-message__icon::after {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  border-radius: 8px !important;
  background: rgba(34, 197, 94, 0.2) !important;
  animation: iconPulse 2s ease-in-out infinite !important;
}

.el-message--success .el-message__content {
  color: #1a1a1a !important;
  font-weight: 600 !important;
  flex: 1 !important;
  text-shadow: 0 1px 2px rgba(34, 197, 94, 0.1) !important;
  text-align: center !important;
}

/* 错误消息 - 红色主题 */
.el-message--error {
  color: #1a1a1a !important;
  border: 1px solid rgba(239, 68, 68, 0.2) !important;
  background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(254, 242, 242, 0.95) 50%,
      rgba(239, 68, 68, 0.08) 100%) !important;
  box-shadow:
    0 25px 80px rgba(239, 68, 68, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
}

.el-message--error::before {
  background: linear-gradient(90deg, #FF3B30, #ef4444, #dc2626) !important;
}

.el-message--error .el-message__icon {
  color: #ef4444 !important;
  font-size: 20px !important;
  margin-right: 0 !important;
  filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.2)) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 24px !important;
  height: 24px !important;
  border-radius: 8px !important;
  background: rgba(239, 68, 68, 0.1) !important;
  flex-shrink: 0 !important;
  position: relative !important;
}

.el-message--error .el-message__icon::after {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  border-radius: 8px !important;
  background: rgba(239, 68, 68, 0.2) !important;
  animation: iconPulse 2s ease-in-out infinite !important;
}

.el-message--error .el-message__content {
  color: #1a1a1a !important;
  font-weight: 600 !important;
  flex: 1 !important;
  text-shadow: 0 1px 2px rgba(239, 68, 68, 0.1) !important;
  text-align: center !important;
}

/* 警告消息 - 橙色主题 */
.el-message--warning {
  color: #1a1a1a !important;
  border: 1px solid rgba(245, 158, 11, 0.2) !important;
  background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(255, 251, 235, 0.95) 50%,
      rgba(245, 158, 11, 0.08) 100%) !important;
  box-shadow:
    0 25px 80px rgba(245, 158, 11, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
}

.el-message--warning::before {
  background: linear-gradient(90deg, #FF9500, #f59e0b, #d97706) !important;
}

.el-message--warning .el-message__icon {
  color: #f59e0b !important;
  font-size: 20px !important;
  margin-right: 0 !important;
  filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.2)) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 24px !important;
  height: 24px !important;
  border-radius: 8px !important;
  background: rgba(245, 158, 11, 0.1) !important;
  flex-shrink: 0 !important;
  position: relative !important;
}

.el-message--warning .el-message__icon::after {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  border-radius: 8px !important;
  background: rgba(245, 158, 11, 0.2) !important;
  animation: iconPulse 2s ease-in-out infinite !important;
}

.el-message--warning .el-message__content {
  color: #1a1a1a !important;
  font-weight: 600 !important;
  flex: 1 !important;
  text-shadow: 0 1px 2px rgba(245, 158, 11, 0.1) !important;
  text-align: center !important;
}

/* 信息消息 - 蓝色主题 */
.el-message--info {
  color: #1a1a1a !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
  background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(239, 246, 255, 0.95) 50%,
      rgba(59, 130, 246, 0.08) 100%) !important;
  box-shadow:
    0 25px 80px rgba(59, 130, 246, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
}

.el-message--info::before {
  background: linear-gradient(90deg, #007AFF, #3b82f6, #2563eb) !important;
}

.el-message--info .el-message__icon {
  color: #3b82f6 !important;
  font-size: 20px !important;
  margin-right: 0 !important;
  filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2)) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 24px !important;
  height: 24px !important;
  border-radius: 8px !important;
  background: rgba(59, 130, 246, 0.1) !important;
  flex-shrink: 0 !important;
  position: relative !important;
}

.el-message--info .el-message__icon::after {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  border-radius: 8px !important;
  background: rgba(59, 130, 246, 0.2) !important;
  animation: iconPulse 2s ease-in-out infinite !important;
}

.el-message--info .el-message__content {
  color: #1a1a1a !important;
  font-weight: 600 !important;
  flex: 1 !important;
  text-shadow: 0 1px 2px rgba(59, 130, 246, 0.1) !important;
  text-align: center !important;
}

/* 消息提示的悬停效果 */
.el-message:hover {
  transform: translateX(-50%) translateY(-3px) scale(1.02) !important;
  box-shadow:
    0 35px 100px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* 关闭按钮美化 */
.el-message .el-message__closeBtn {
  position: absolute !important;
  top: 14px !important;
  right: 14px !important;
  width: 28px !important;
  height: 28px !important;
  border-radius: 10px !important;
  background: rgba(0, 0, 0, 0.05) !important;
  color: #6c757d !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: none !important;
  outline: none !important;
  backdrop-filter: blur(10px) !important;
  opacity: 0.7 !important;
}

.el-message .el-message__closeBtn:hover {
  background: rgba(239, 68, 68, 0.12) !important;
  color: #ef4444 !important;
  transform: scale(1.15) !important;
  opacity: 1 !important;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2) !important;
}

/* 光波扫过动画效果 */
.el-message::after {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: -100% !important;
  width: 100% !important;
  height: 100% !important;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent) !important;
  transition: left 0.6s ease-out !important;
  pointer-events: none !important;
  z-index: 1 !important;
}

.el-message:hover::after {
  left: 100% !important;
}

/* 图标脉冲动画 */
@keyframes iconPulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.7;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.3;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-message {
    min-width: 280px !important;
    max-width: 90vw !important;
    padding: 16px 20px !important;
    font-size: 14px !important;
  }

  .el-message .el-message__icon {
    font-size: 18px !important;
    width: 20px !important;
    height: 20px !important;
  }

  .el-message .el-message__closeBtn {
    top: 12px !important;
    right: 12px !important;
    width: 24px !important;
    height: 24px !important;
    font-size: 12px !important;
  }
}

/* 窗口容器 - 实现完美圆角一体化 */
.window-container {
  width: 100vw;
  height: 100vh;
  padding: 0;
  /* 移除padding */
  background: transparent;
  box-sizing: border-box;
}

.window-container .app-container {
  width: 100%;
  height: 100%;
  border-radius: 0;
  /* 移除圆角 */
  overflow: hidden;
  box-shadow: none;
  /* 移除阴影 */
  backdrop-filter: none;
  /* 移除模糊效果 */
  display: flex;
  flex-direction: column;
}

/* 内容滚动区域 */
.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 20px 0;
  /* 移除左右padding，只保留底部padding */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.app-content::-webkit-scrollbar {
  width: 8px;
}

.app-content::-webkit-scrollbar-track {
  background: transparent;
}

.app-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.app-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 更新对话框样式 */
.update-dialog-overlay {
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

.update-dialog {
  width: 480px;
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

.update-dialog::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #FF3B30, #FF9500, #FFCC02, #34C759, #007AFF, #5856D6, #AF52DE);
  opacity: 0.8;
}

.update-dialog-header {
  padding: 24px 28px 20px;
  background: linear-gradient(135deg,
      rgba(175, 82, 222, 0.08) 0%,
      rgba(191, 90, 242, 0.08) 50%,
      rgba(218, 112, 214, 0.08) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
}

.update-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.update-title {
  flex: 1;
}

.update-title h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  background: linear-gradient(135deg, #2c3e50, #AF52DE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.update-title p {
  margin: 0;
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.close-btn {
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
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  transform: scale(1.1);
}

.update-dialog-content {
  padding: 24px 28px;
}

.version-comparison {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.version-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.version-card.current {
  border-color: rgba(108, 117, 125, 0.2);
}

.version-card.latest {
  border-color: rgba(34, 197, 94, 0.2);
  background: linear-gradient(135deg,
      rgba(34, 197, 94, 0.05) 0%,
      rgba(16, 185, 129, 0.03) 100%);
}

.version-label {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.version-number {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.version-card.latest .version-number {
  color: #16a34a;
}

.version-arrow {
  font-size: 20px;
  color: #AF52DE;
  font-weight: bold;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.release-notes {
  margin-top: 24px;
}

.release-notes h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.notes-content {
  background: linear-gradient(135deg,
      rgba(248, 250, 252, 0.95) 0%,
      rgba(241, 245, 249, 0.9) 100%);
  padding: 20px 24px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid rgba(175, 82, 222, 0.1);
  scrollbar-width: thin;
  scrollbar-color: rgba(175, 82, 222, 0.3) transparent;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

.notes-content::-webkit-scrollbar {
  width: 8px;
}

.notes-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.notes-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgba(175, 82, 222, 0.4), rgba(191, 90, 242, 0.4));
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.notes-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, rgba(175, 82, 222, 0.6), rgba(191, 90, 242, 0.6));
}

.update-dialog-footer {
  padding: 20px 28px 24px;
  background: linear-gradient(135deg,
      rgba(248, 250, 252, 0.95) 0%,
      rgba(255, 255, 255, 0.9) 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: white;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #15803d, #16a34a);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
}

.btn-secondary {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
  border: 1px solid rgba(108, 117, 125, 0.2);
}

.btn-secondary:hover {
  background: rgba(108, 117, 125, 0.15);
  color: #495057;
  border-color: rgba(108, 117, 125, 0.3);
  transform: translateY(-1px);
}

.btn-primary::before,
.btn-secondary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.btn-primary:hover::before,
.btn-secondary:hover::before {
  left: 100%;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .update-dialog {
    width: 90vw;
    margin: 20px;
  }

  .version-comparison {
    flex-direction: column;
    gap: 12px;
  }

  .version-arrow {
    transform: rotate(90deg);
  }

  .update-dialog-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

/* 现代化对话框样式 */
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

.gpt-dialog,
.help-dialog {
  width: 80vw;
  max-width: 900px;
}

.about-dialog {
  width: 600px;
  max-width: 90vw;
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

/* 关于对话框特殊布局 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 24px 28px;
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

/* 不同对话框的主题色彩 */
.gpt-dialog .dialog-header {
  background: linear-gradient(135deg,
      rgba(0, 122, 255, 0.08) 0%,
      rgba(90, 200, 250, 0.08) 50%,
      rgba(100, 210, 255, 0.08) 100%);
  border-bottom-color: rgba(0, 122, 255, 0.1);
}

.about-dialog .dialog-header {
  background: linear-gradient(135deg,
      rgba(108, 117, 125, 0.08) 0%,
      rgba(90, 97, 105, 0.08) 50%,
      rgba(73, 80, 87, 0.08) 100%);
  border-bottom-color: rgba(108, 117, 125, 0.1);
}

.help-dialog .dialog-header {
  background: linear-gradient(135deg,
      rgba(34, 197, 94, 0.08) 0%,
      rgba(16, 185, 129, 0.08) 50%,
      rgba(5, 150, 105, 0.08) 100%);
  border-bottom-color: rgba(34, 197, 94, 0.1);
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
      #e2e8f0 100%);
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
      rgba(191, 90, 242, 0.08) 100%);
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
      rgba(191, 90, 242, 0.12) 100%);
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
      rgba(191, 90, 242, 0.08) 100%);
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

/* 对话框响应式设计 */
@media (max-width: 768px) {
  .modern-dialog {
    width: 95vw !important;
    max-width: none !important;
    margin: 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 20px;
  }

  .info-card {
    padding: 16px;
    gap: 12px;
  }

  .card-icon {
    font-size: 20px;
  }

  .dialog-header {
    padding: 16px 20px;
  }

  .dialog-icon {
    font-size: 24px;
    margin-right: 12px;
  }

  .scrollable-content {
    padding: 20px;
  }

  .dialog-footer {
    flex-direction: column;
    padding: 16px 20px 20px;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

.preview-dialog {
  width: 80vw;
  max-width: 1200px;
}

.help-dialog .dialog-header {
  background: linear-gradient(135deg,
      rgba(34, 197, 94, 0.08) 0%,
      rgba(16, 185, 129, 0.08) 50%,
      rgba(5, 150, 105, 0.08) 100%);
  border-bottom-color: rgba(34, 197, 94, 0.1);
}

/* 预览弹窗特殊样式 */
.preview-dialog .dialog-header {
  background: linear-gradient(135deg,
      rgba(255, 149, 0, 0.08) 0%,
      rgba(255, 204, 2, 0.08) 50%,
      rgba(52, 199, 89, 0.08) 100%);
  border-bottom-color: rgba(255, 149, 0, 0.1);
}

.preview-dialog .dialog-title h3 {
  background: linear-gradient(135deg, #2c3e50, #FF9500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.preview-dialog .scrollable-content {
  scrollbar-color: rgba(255, 149, 0, 0.3) transparent;
}

.preview-dialog .scrollable-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.4), rgba(255, 204, 2, 0.4));
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

/* 预览弹窗中的特殊标题样式 */
.preview-dialog .scrollable-content :deep(h3) {
  font-size: 18px;
  color: #1a1a1a;
  font-weight: 700;
  margin: 32px 0 16px 0;
  padding: 12px 20px;
  background: linear-gradient(135deg,
      rgba(255, 149, 0, 0.08) 0%,
      rgba(255, 204, 2, 0.08) 100%);
  border-radius: 12px;
  border-left: 4px solid #FF9500;
  position: relative;
  letter-spacing: -0.2px;
}

.preview-dialog .scrollable-content :deep(h3::before) {
  content: '📄';
  margin-right: 8px;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  body .el-message.el-message,
  html .el-message.el-message {
    min-width: 280px !important;
    max-width: 90vw !important;
    padding: 16px 20px !important;
    font-size: 14px !important;
  }
}

/* Element Plus MessageBox 层级控制 */
body .el-overlay,
html .el-overlay {
  z-index: 99999 !important;
}

body .el-message-box,
html .el-message-box {
  z-index: 100000 !important;
  border-radius: 20px !important;
  border: none !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(25px) !important;
  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
  overflow: hidden !important;
}

body .el-message-box::before,
html .el-message-box::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 3px !important;
  background: linear-gradient(90deg, #FF3B30, #FF9500, #FFCC02, #34C759, #007AFF, #5856D6, #AF52DE) !important;
  opacity: 0.8 !important;
  z-index: 1 !important;
}

body .el-message-box .el-message-box__header,
html .el-message-box .el-message-box__header {
  padding-top: 32px !important;
  position: relative !important;
  z-index: 2 !important;
}

body .el-message-box .el-message-box__content,
html .el-message-box .el-message-box__content {
  position: relative !important;
  z-index: 2 !important;
}

body .el-message-box .el-message-box__btns,
html .el-message-box .el-message-box__btns {
  position: relative !important;
  z-index: 2 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {

  body .el-message.el-message,
  html .el-message.el-message {
    min-width: 280px !important;
    max-width: 90vw !important;
    padding: 16px 20px !important;
    font-size: 14px !important;
  }
}

/* 超高优先级全局样式 - Element Plus 消息提示现代化 */
body .el-message.el-message,
html .el-message.el-message {
  position: fixed !important;
  top: 60px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  padding: 20px 28px !important;
  border-radius: 20px !important;
  border: none !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(25px) !important;
  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  letter-spacing: -0.1px !important;
  z-index: 3000 !important;
  line-height: 1.4 !important;
  min-width: 320px !important;
  max-width: 520px !important;
  overflow: hidden !important;
  animation: messageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 12px !important;
  text-align: center !important;
  margin: 0 !important;
  white-space: nowrap !important;
}

body .el-message.el-message::before,
html .el-message.el-message::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 3px !important;
  background: linear-gradient(90deg, #FF3B30, #FF9500, #FFCC02, #34C759, #007AFF, #5856D6, #AF52DE) !important;
  opacity: 0.8 !important;
}

/* 消息提示悬停效果 */
body .el-message.el-message:hover,
html .el-message.el-message:hover {
  transform: translateX(-50%) translateY(-3px) scale(1.02) !important;
  box-shadow:
    0 35px 100px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* 成功消息 - 绿色主题 */
body .el-message--success.el-message--success,
html .el-message--success.el-message--success {
  color: #1a1a1a !important;
  border: 1px solid rgba(34, 197, 94, 0.2) !important;
  background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(240, 253, 244, 0.95) 50%,
      rgba(34, 197, 94, 0.08) 100%) !important;
  box-shadow:
    0 25px 80px rgba(34, 197, 94, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
}

body .el-message--success.el-message--success::before,
html .el-message--success.el-message--success::before {
  background: linear-gradient(90deg, #34C759, #22c55e, #16a34a) !important;
}

body .el-message--success.el-message--success .el-message__icon,
html .el-message--success.el-message--success .el-message__icon {
  color: #22c55e !important;
  font-size: 20px !important;
  margin-right: 0 !important;
  filter: drop-shadow(0 2px 4px rgba(34, 197, 94, 0.2)) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 24px !important;
  height: 24px !important;
  border-radius: 8px !important;
  background: rgba(34, 197, 94, 0.1) !important;
  flex-shrink: 0 !important;
  position: relative !important;
}

body .el-message--success.el-message--success .el-message__content,
html .el-message--success.el-message--success .el-message__content {
  color: #1a1a1a !important;
  font-weight: 600 !important;
  flex: 1 !important;
  text-shadow: 0 1px 2px rgba(34, 197, 94, 0.1) !important;
  text-align: center !important;
}

/* 其他消息类型的全局样式 */
body .el-message--error .el-message__content,
html .el-message--error .el-message__content,
body .el-message--warning .el-message__content,
html .el-message--warning .el-message__content,
body .el-message--info .el-message__content,
html .el-message--info .el-message__content {
  text-align: center !important;
}

/* Element Plus 消息容器居中 */
body .el-message-container,
html .el-message-container {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  pointer-events: none !important;
  z-index: 3000 !important;
}

body .el-message-container .el-message,
html .el-message-container .el-message {
  position: relative !important;
  left: auto !important;
  top: auto !important;
  transform: none !important;
  margin: 10px 0 !important;
  pointer-events: auto !important;
}

/* 如果消息在容器中，需要特殊处理悬停效果 */
body .el-message-container .el-message:hover,
html .el-message-container .el-message:hover {
  transform: translateY(-3px) scale(1.02) !important;
}

/* Element Plus MessageBox 层级控制 - 确保比 ElMessage 层级更高 */
body .el-overlay,
html .el-overlay {
  z-index: 99999 !important;
}

body .el-message-box,
html .el-message-box {
  z-index: 100000 !important;
  border-radius: 20px !important;
  border: none !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(25px) !important;
  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
  overflow: hidden !important;
}

body .el-message-box::before,
html .el-message-box::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 3px !important;
  background: linear-gradient(90deg, #FF3B30, #FF9500, #FFCC02, #34C759, #007AFF, #5856D6, #AF52DE) !important;
  opacity: 0.8 !important;
  z-index: 1 !important;
}

body .el-message-box .el-message-box__header,
html .el-message-box .el-message-box__header {
  padding-top: 32px !important;
  position: relative !important;
  z-index: 2 !important;
}

body .el-message-box .el-message-box__content,
html .el-message-box .el-message-box__content {
  position: relative !important;
  z-index: 2 !important;
}

body .el-message-box .el-message-box__btns,
html .el-message-box .el-message-box__btns {
  position: relative !important;
  z-index: 2 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {

  body .el-message.el-message,
  html .el-message.el-message {
    min-width: 280px !important;
    max-width: 90vw !important;
    padding: 16px 20px !important;
    font-size: 14px !important;
  }
}

/* 专注模式悬浮按钮样式 */
.focus-mode-fab {
  position: fixed;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 60px;
  width: 60px;
  height: 60px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8px 25px rgba(102, 126, 234, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1001;
  backdrop-filter: blur(10px);
  user-select: none;
  overflow: hidden;
}

.focus-mode-fab.dragging {
  cursor: grabbing;
  transform: scale(1.1);
  box-shadow:
    0 15px 35px rgba(102, 126, 234, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  transition: none;
  /* 拖拽时禁用过渡动画 */
}

.focus-mode-fab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.focus-mode-fab:hover:not(.dragging) {
  transform: translateY(-3px) scale(1.05);
  box-shadow:
    0 15px 35px rgba(102, 126, 234, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  cursor: grab;
}

.focus-mode-fab:hover:not(.dragging)::before {
  transform: translateX(100%);
}

.focus-mode-fab:active:not(.dragging) {
  transform: translateY(-1px) scale(1.02);
}

.fab-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
  transition: transform 0.3s ease;
  pointer-events: none;
  /* 防止拖拽时选中SVG */
}

.focus-mode-fab:hover:not(.dragging) .fab-icon {
  transform: scale(1.1);
}

.fab-text {
  font-size: 9px;
  font-weight: 600;
  text-align: center;
  line-height: 1;
  opacity: 0.9;
  letter-spacing: -0.02em;
  pointer-events: none;
  /* 防止拖拽时选中文字 */
}

.focus-mode-fab.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  animation: focusModePulse 2s ease-in-out infinite;
}

.focus-mode-fab.active:hover:not(.dragging) {
  box-shadow:
    0 15px 35px rgba(255, 107, 107, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
}

.focus-mode-fab.active.dragging {
  box-shadow:
    0 15px 35px rgba(255, 107, 107, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
}

@keyframes focusModePulse {

  0%,
  100% {
    box-shadow:
      0 8px 25px rgba(255, 107, 107, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  }

  50% {
    box-shadow:
      0 8px 25px rgba(255, 107, 107, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset,
      0 0 0 4px rgba(255, 107, 107, 0.1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .focus-mode-fab {
    width: 56px;
    height: 56px;
  }

  .fab-icon {
    width: 22px;
    height: 22px;
  }

  .fab-text {
    font-size: 8px;
  }
}

/* 更新对话中发布说明的 Markdown 样式 */
.notes-content :deep(h1),
.notes-content :deep(h2),
.notes-content :deep(h3),
.notes-content :deep(h4) {
  color: #1a1a1a;
  font-weight: 700;
  margin: 20px 0 12px 0;
  line-height: 1.3;
}

.notes-content :deep(h1) {
  font-size: 22px;
  background: linear-gradient(135deg, #AF52DE, #BF5AF2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
}

.notes-content :deep(h2) {
  font-size: 18px;
  color: #AF52DE;
  border-bottom: 2px solid rgba(175, 82, 222, 0.2);
  padding-bottom: 6px;
  margin-top: 24px;
  margin-bottom: 14px;
}

.notes-content :deep(h3) {
  font-size: 16px;
  color: #BF5AF2;
  margin-top: 20px;
}

.notes-content :deep(h4) {
  font-size: 14px;
  color: #DA70D6;
  margin-top: 16px;
}

.notes-content :deep(p) {
  color: #4a5568;
  line-height: 1.6;
  margin: 8px 0;
}

.notes-content :deep(ul),
.notes-content :deep(ol) {
  color: #4a5568;
  line-height: 1.6;
  padding-left: 20px;
  margin: 8px 0;
}

.notes-content :deep(li) {
  margin: 4px 0;
}

.notes-content :deep(strong) {
  color: #2c3e50;
  font-weight: 600;
}

.notes-content :deep(em) {
  color: #6b7280;
  font-style: italic;
}

.notes-content :deep(code) {
  background: rgba(175, 82, 222, 0.1);
  color: #AF52DE;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 0.9em;
}

.notes-content :deep(pre) {
  background: rgba(248, 250, 252, 0.8);
  border-radius: 8px;
  padding: 12px 16px;
  margin: 12px 0;
  border: 1px solid rgba(175, 82, 222, 0.1);
  overflow-x: auto;
}

.notes-content :deep(blockquote) {
  border-left: 3px solid #AF52DE;
  padding: 8px 16px;
  margin: 12px 0;
  background: rgba(175, 82, 222, 0.05);
  border-radius: 0 6px 6px 0;
  color: #4a5568;
  font-style: italic;
}
</style>
