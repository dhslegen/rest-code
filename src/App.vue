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

        <!-- macOS 下的更新检查按钮 -->
        <div class="titlebar-actions" v-if="isDarwin">
          <el-button text size="small" @click="toggleFocusMode" :class="['focus-mode-btn', { 'active': focusMode }]"
            :title="`${focusMode ? '退出专注模式' : '进入专注模式'} (${isDarwin ? 'Cmd' : 'Ctrl'}+E)`">
            <el-icon>
              <component :is="focusMode ? 'View' : 'Hide'" />
            </el-icon>
            <span class="focus-btn-text">{{ focusMode ? '退出专注' : '专注模式' }}</span>
          </el-button>
          <el-button text size="small" @click="showHelpDialog = true" class="help-btn" title="使用帮助">
            <el-icon>
              <QuestionFilled />
            </el-icon>
            <span class="help-btn-text">帮助</span>
          </el-button>
          <el-button text size="small" @click="showAboutDialog = true" class="about-btn" title="关于应用">
            <el-icon>
              <InfoFilled />
            </el-icon>
            <span class="about-btn-text">关于</span>
          </el-button>
          <el-button text size="small" @click="checkForUpdates" :loading="checkingUpdate" class="update-check-btn"
            title="检查更新">
            <el-icon>
              <Refresh />
            </el-icon>
            <span class="update-btn-text">检查更新</span>
          </el-button>
        </div>

        <!-- Windows 下的布局：功能按钮在中间，窗口控制在最右边 -->
        <div class="win32-layout" v-if="!isDarwin">
          <div class="win32-actions">
            <el-button text size="small" @click="toggleFocusMode" :class="['focus-mode-btn', { 'active': focusMode }]"
              :title="`${focusMode ? '退出专注模式' : '进入专注模式'} (${isDarwin ? 'Cmd' : 'Ctrl'}+E)`">
              <el-icon>
                <component :is="focusMode ? 'View' : 'Hide'" />
              </el-icon>
              <span class="focus-btn-text">{{ focusMode ? '退出专注' : '专注模式' }}</span>
            </el-button>
            <el-button text size="small" @click="showHelpDialog = true" class="help-btn" title="使用帮助">
              <el-icon>
                <QuestionFilled />
              </el-icon>
              <span class="help-btn-text">帮助</span>
            </el-button>
            <el-button text size="small" @click="showAboutDialog = true" class="about-btn" title="关于应用">
              <el-icon>
                <InfoFilled />
              </el-icon>
              <span class="about-btn-text">关于</span>
            </el-button>
            <el-button text size="small" @click="checkForUpdates" :loading="checkingUpdate" class="update-check-btn"
              title="检查更新">
              <el-icon>
                <Refresh />
              </el-icon>
              <span class="update-btn-text">检查更新</span>
            </el-button>
          </div>
          <div class="window-controls">
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
      </div>

      <!-- 内容区域 -->
      <div class="app-content">
        <!-- 操作区域 -->
        <div class="section-card operation-section" v-show="!focusMode && !editorMaximized">
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
                    <file-loader ref="fileLoaderRef" />
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
        <div class="section-card domain-section" v-show="!focusMode && !editorMaximized">
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
        <div class="section-card script-section" v-show="!editorMaximized">
          <div class="section-header" @click="toggleSection('script')">
            <div class="section-icon">⚙️</div>
            <span class="section-title">脚本设计</span>
            <el-button text class="collapse-btn" @click.stop="toggleSection('script')"
              :icon="sectionCollapsed.script ? 'ArrowDown' : 'ArrowUp'" />
          </div>
          <el-collapse-transition>
            <div v-show="!sectionCollapsed.script" class="section-content">
              <script-editor ref="scriptEditorRef" @show-crud-dialog="handleShowCrudDialog" />
            </div>
          </el-collapse-transition>
        </div>

        <!-- 脚本编辑器区域 -->
        <div class="section-card editor-section">
          <div class="section-header" v-show="!editorMaximized">
            <div class="section-icon">📝</div>
            <span class="section-title">脚本编辑器</span>
          </div>
          <div class="section-content editor-content" :class="{ 'maximized-content': editorMaximized }">
            <script-viewer ref="scriptViewerRef" @open-gpt-dialog="showGptDialog = true"
              @toggle-maximize="handleEditorMaximize" />
          </div>
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
        </div>

        <div class="dialog-content">
          <div class="info-grid">
            <div class="info-card version-card">
              <div class="card-icon">🚀</div>
              <div class="card-content">
                <label>当前版本</label>
                <a href="javascript:void(0)"
                  @click="openLink('https://github.com/dhslegen/rest-code/releases/tag/v1.1.8')" class="link-btn">
                  v1.1.8
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
                <a href="javascript:void(0)" @click="openLink('https://github.com/dhslegen/rest-code')"
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

    <!-- 一键CRUD对话框 -->
    <div v-if="showCrudDialog" class="dialog-overlay" @click="showCrudDialog = false">
      <div class="modern-dialog crud-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-icon">⚙️</div>
          <div class="dialog-title">
            <h3>一键 CRUD</h3>
            <p>快速生成增删改查接口脚本</p>
          </div>
        </div>

        <div class="dialog-content">
          <div class="crud-form">
            <div class="form-item">
              <label class="form-label">领域名称</label>
              <el-select v-model="selectedDomain" placeholder="请选择领域名称" class="form-select">
                <el-option v-for="domain in domains" :key="domain.name" :label="domain.name" :value="domain.name">
                </el-option>
              </el-select>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-secondary" @click="showCrudDialog = false">
            取消
          </button>
          <button class="btn-primary" @click="confirmCRUD">
            确定
          </button>
        </div>
      </div>
    </div>

    <!-- 加载覆盖层 -->
    <div v-if="showLoadingOverlay" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <div class="loading-text">{{ loadingText }}</div>
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
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, InfoFilled, QuestionFilled } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import helpContentRaw from './docs/help.md?raw'
import gptContentRaw from './docs/GPT.md?raw'
import { useStore } from './store/'

// 平台检测
const platform = ref('')
const isDarwin = computed(() => platform.value === 'darwin')
const isWin32 = computed(() => platform.value === 'win32')

// Store
const store = useStore()
const { domains } = store

// 状态管理
const scriptViewerRef = ref()
const scriptEditorRef = ref()
const fileLoaderRef = ref()
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
const showCrudDialog = ref(false)

// 预览相关状态
const previewContent = ref('')

// CRUD弹窗相关状态
const selectedDomain = ref('')

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
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('mac')) {
    platform.value = 'darwin'
  } else if (userAgent.includes('win')) {
    platform.value = 'win32'
  } else {
    platform.value = 'linux'
  }

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

  // 添加快捷键监听
  document.addEventListener('keydown', handleKeyDown)
})

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// 快捷键处理函数
const handleKeyDown = (event: KeyboardEvent) => {
  const isMac = isDarwin.value
  const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey

  // Cmd/Ctrl + O: 打开文件选择窗口
  if (ctrlOrCmd && event.key === 'o') {
    event.preventDefault()
    handleOpenFile()
  }

  // Cmd/Ctrl + S: 保存
  if (ctrlOrCmd && event.key === 's') {
    event.preventDefault()
    handleSave()
  }

  // Cmd/Ctrl + E: 切换专注模式
  if (ctrlOrCmd && event.key === 'e') {
    event.preventDefault()
    toggleFocusMode()
  }
}

// 处理打开文件功能
const handleOpenFile = () => {
  // 调用FileLoader的openFile方法
  if (fileLoaderRef.value && fileLoaderRef.value.openFile) {
    fileLoaderRef.value.openFile()
  }
  else {
    ElMessage.warning(`暂无可打开的文件`)
  }
}

// 处理保存功能
const handleSave = async () => {
  // 调用ScriptViewer的保存方法
  if (scriptViewerRef.value && scriptViewerRef.value.saveScripts) {
    await scriptViewerRef.value.saveScripts()
  } else {
    ElMessage.warning(`暂无可保存的内容`)
  }
}

// 一键CRUD相关方法
const handleShowCrudDialog = () => {
  if (domains.length === 0) {
    ElMessage.error('请先添加领域')
    return
  }

  // 检查当前选择的域名是否还在domains列表中，如果不在则重置
  const domainExists = domains.some(domain => domain.name === selectedDomain.value)
  if (!domainExists) {
    selectedDomain.value = ''
  }

  showCrudDialog.value = true
}

const confirmCRUD = () => {
  if (!selectedDomain.value) {
    ElMessage.error('请选择领域名称')
    return
  }

  const domainName = selectedDomain.value
  const domainDesc = domains.find((d) => d.name === domainName)?.description || ''

  const crudTemplates = ['POST-创建', 'PATCH-编辑', 'GET-获取分页', 'DELETE-批量删除']
  crudTemplates.forEach((templateName) => {
    const template = store.templates.find((t) => t.name === templateName)
    if (template) {
      const script = {
        domain: domainName,
        httpMethod: template.httpMethod,
        apiPath: template.apiPath || '',
        operation: template.operation,
        contract: template.contract,
        description: template.description.replace('{领域描述}', domainDesc),
        template: template.name,
        tooltipContent: '',
        showTooltip: false,
      }
      store.addScript(script)
    }
  })

  showCrudDialog.value = false
  ElMessage.success(`已为"${domainName}"生成CRUD接口`)
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

// 专注模式相关状态
const focusMode = ref(false)

// 编辑器最大化状态
const editorMaximized = ref(false)

// 加载覆盖层状态
const showLoadingOverlay = ref(false)
const loadingText = ref('正在恢复界面...')

const toggleFocusMode = () => {
  focusMode.value = !focusMode.value

  if (focusMode.value) {
    // 进入专注模式
    ElMessage.success(`已进入专注模式 (${isDarwin.value ? 'Cmd' : 'Ctrl'}+E)`)

    // 显示加载覆盖层
    loadingText.value = '正在进入专注模式...'
    showLoadingOverlay.value = true

    // 计算可用高度并设置各区域高度为50%
    nextTick(() => {
      const availableHeight = window.innerHeight - 40 // 减去标题栏高度
      const halfHeight = Math.floor((availableHeight) / 2) // 减去边距，然后分成两半

      // 设置脚本设计区域高度
      if (scriptEditorRef.value && scriptEditorRef.value.setTemporaryHeight) {
        scriptEditorRef.value.setTemporaryHeight(halfHeight - 110)
      }

      // 设置编辑器高度为另一半
      if (scriptViewerRef.value && scriptViewerRef.value.setTemporaryHeight) {
        scriptViewerRef.value.setTemporaryHeight(halfHeight - 187)
      }

      // 滚动到底部
      setTimeout(() => {
        const appContent = document.querySelector('.app-content')
        if (appContent) {
          appContent.scrollTo({
            top: appContent.scrollHeight,
            behavior: 'smooth'
          })
        }

        // 滚动完成后隐藏加载覆盖层
        setTimeout(() => {
          showLoadingOverlay.value = false
        }, 600) // 等待滚动和布局调整完成
      }, 150)
    })

    // 禁用滚动条
    document.body.style.overflow = 'hidden'
    const appContent = document.querySelector('.app-content')
    if (appContent) {
      (appContent as any).style.overflow = 'hidden'
    }
  } else {
    // 退出专注模式
    ElMessage.info(`已退出专注模式 (${isDarwin.value ? 'Cmd' : 'Ctrl'}+E)`)

    // 显示加载覆盖层
    loadingText.value = '正在退出专注模式...'
    showLoadingOverlay.value = true

    // 恢复滚动条
    document.body.style.overflow = ''
    const appContent = document.querySelector('.app-content')
    if (appContent) {
      (appContent as any).style.overflow = ''
    }

    // 恢复脚本设计区域的默认样式
    if (scriptEditorRef.value && scriptEditorRef.value.restoreOriginalHeight) {
      scriptEditorRef.value.restoreOriginalHeight()
    }

    // 恢复之前的编辑器高度
    if (scriptViewerRef.value && scriptViewerRef.value.restoreOriginalHeight) {
      scriptViewerRef.value.restoreOriginalHeight()
    }

    // 等待DOM更新完成后滚动到底部
    nextTick(() => {
      setTimeout(() => {
        const appContent = document.querySelector('.app-content')
        if (appContent) {
          appContent.scrollTo({
            top: appContent.scrollHeight,
            behavior: 'smooth'
          })
        }

        // 滚动完成后隐藏加载覆盖层
        setTimeout(() => {
          showLoadingOverlay.value = false
        }, 800) // 等待滚动动画完成
      }, 300)
    })
  }
}

// 处理编辑器最大化
const handleEditorMaximize = (maximized: boolean) => {
  editorMaximized.value = maximized
  const appContent = document.querySelector('.app-content') as HTMLElement

  if (maximized) {
    ElMessage.success('编辑器已最大化')

    // 显示加载覆盖层
    loadingText.value = '正在最大化编辑器...'
    showLoadingOverlay.value = true

    // 隐藏滚动条
    if (appContent) {
      appContent.style.overflow = 'hidden'
    }

    // 滚动到底部
    nextTick(() => {
      if (appContent) {
        appContent.scrollTop = appContent.scrollHeight
      }

      // 等待布局调整完成后隐藏加载覆盖层
      setTimeout(() => {
        showLoadingOverlay.value = false
      }, 500)
    })
  } else {
    ElMessage.info('编辑器已还原')

    // 显示加载覆盖层
    loadingText.value = '正在还原编辑器...'
    showLoadingOverlay.value = true

    // 恢复滚动条
    if (appContent) {
      appContent.style.overflow = ''
    }

    // 滚动到底部
    nextTick(() => {
      setTimeout(() => {
        if (appContent) {
          appContent.scrollTo({
            top: appContent.scrollHeight,
            behavior: 'smooth'
          })
        }

        // 滚动完成后隐藏加载覆盖层
        setTimeout(() => {
          showLoadingOverlay.value = false
        }, 600) // 等待滚动动画完成
      }, 200)
    })
  }
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
  position: absolute;
  /* 改为绝对定位 */
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  /* 让按钮可以点击 */
}

.titlebar-actions {
  -webkit-app-region: no-drag;
  display: flex;
  align-items: center;
  margin-right: 10px;
  position: absolute;
  /* 改为绝对定位 */
  right: 0;
  /* 确保在右边 */
  top: 50%;
  transform: translateY(-50%);
  /* 垂直居中 */
  z-index: 10;
}

.update-check-btn {
  color: rgba(255, 255, 255, 0.8) !important;
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

/* 帮助按钮样式 */
.help-btn {
  color: rgba(255, 255, 255, 0.8) !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.help-btn:hover {
  background: rgba(34, 197, 94, 0.3) !important;
  color: rgba(255, 255, 255, 1) !important;
  transform: scale(1.05) !important;
  border-color: rgba(34, 197, 94, 0.4) !important;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2) !important;
}

.help-btn-text {
  font-size: 12px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
}

/* 关于按钮样式 */
.about-btn {
  color: rgba(255, 255, 255, 0.8) !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.about-btn:hover {
  background: rgba(108, 117, 125, 0.3) !important;
  color: rgba(255, 255, 255, 1) !important;
  transform: scale(1.05) !important;
  border-color: rgba(108, 117, 125, 0.4) !important;
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.2) !important;
}

.about-btn-text {
  font-size: 12px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
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
  pointer-events: auto;
  /* 恢复标题的交互 */
}

.app-logo {
  font-size: 18px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
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

/* Windows 布局容器 */
.win32-layout {
  -webkit-app-region: no-drag;
  display: flex;
  align-items: center;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
}

.win32-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
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
  /* 移除动画相关属性 */
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.section-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 0;
  margin: 10px 20px 20px 20px;
  /* 添加左右margin */
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.3s ease-out,
    transform 0.3s ease-out;
}

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
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}



.section-header {
  display: flex;
  align-items: center;
  padding: 13px 20px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 24px 24px 0 0;
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

/* 专注模式下脚本设计区域的滚动条样式 */
.script-section .section-content {
  transition: height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.script-section .section-content::-webkit-scrollbar {
  width: 8px;
}

.script-section .section-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.script-section .section-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.4), rgba(90, 200, 250, 0.4));
  border-radius: 4px;
  transition: background 0.3s ease;
}

.script-section .section-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.6), rgba(90, 200, 250, 0.6));
}

.editor-content {
  padding: 0;
  min-height: 200px;
}

.editor-content.maximized-content {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
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
  /* 移除左右padding，只保留底部padding */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  scroll-behavior: smooth;
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

/* 专注模式按钮样式 */
.focus-mode-btn {
  color: rgba(255, 255, 255, 0.8) !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.focus-mode-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 1) !important;
  transform: scale(1.05) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2) !important;
}

.focus-mode-btn.active {
  background: rgba(76, 175, 80, 0.3) !important;
  color: rgba(255, 255, 255, 1) !important;
  border-color: rgba(76, 175, 80, 0.5) !important;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3) !important;
}

.focus-mode-btn.active:hover {
  background: rgba(76, 175, 80, 0.4) !important;
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4) !important;
}

.focus-btn-text {
  font-size: 12px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
}

/* CRUD弹窗特殊样式 */
.crud-dialog {
  width: 480px;
  max-width: 90vw;
}

.crud-dialog .dialog-header {
  background: linear-gradient(135deg,
      rgba(175, 82, 222, 0.08) 0%,
      rgba(191, 90, 242, 0.08) 50%,
      rgba(218, 112, 214, 0.08) 100%);
  border-bottom-color: rgba(175, 82, 222, 0.1);
}

.crud-dialog .dialog-title h3 {
  background: linear-gradient(135deg, #2c3e50, #AF52DE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.crud-form {
  padding: 24px 28px;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-select {
  width: 100%;
}

.crud-form :deep(.form-select .el-select__wrapper) {
  padding: 12px 16px;
  border: 1px solid rgba(175, 82, 222, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  color: #2c3e50;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: none;
}

.crud-form :deep(.form-select .el-select__wrapper:hover) {
  border-color: rgba(175, 82, 222, 0.4);
  box-shadow: 0 2px 8px rgba(175, 82, 222, 0.1);
}

.crud-form :deep(.form-select .el-select__wrapper.is-focused) {
  border-color: rgba(175, 82, 222, 0.6);
  box-shadow: 0 0 0 3px rgba(175, 82, 222, 0.1);
}

.crud-form :deep(.form-select .el-select__placeholder) {
  color: #999;
  font-size: 14px;
}

.crud-form :deep(.form-select .el-select__input) {
  color: #2c3e50;
  font-size: 14px;
}

.crud-form :deep(.form-select .el-select__caret) {
  color: rgba(175, 82, 222, 0.6);
  font-size: 14px;
  transition: all 0.3s ease;
}

.crud-form :deep(.form-select .el-select__caret.is-reverse) {
  transform: rotateZ(180deg);
  color: #AF52DE;
}

/* 下拉框弹出层样式 */
.crud-form :deep(.el-select-dropdown) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(175, 82, 222, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(175, 82, 222, 0.15);
}

.crud-form :deep(.el-select-dropdown .el-select-dropdown__item) {
  color: #2c3e50;
  font-size: 14px;
  padding: 8px 16px;
  transition: all 0.2s ease;
}

.crud-form :deep(.el-select-dropdown .el-select-dropdown__item:hover) {
  background: rgba(175, 82, 222, 0.1);
  color: #AF52DE;
}

.crud-form :deep(.el-select-dropdown .el-select-dropdown__item.is-selected) {
  background: rgba(175, 82, 222, 0.15);
  color: #AF52DE;
  font-weight: 600;
}

/* 加载覆盖层样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg,
      #ff6b6b 0%,
      #4ecdc4 14%,
      #45b7d1 28%,
      #96ceb4 42%,
      #ffeaa7 56%,
      #fd79a8 70%,
      #fdcb6e 84%,
      #6c5ce7 100%);
  background-size: 400% 400%;
  animation: rainbowShift 3s ease-in-out infinite, fadeIn 0.3s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.loading-content {
  text-align: center;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 25px;
  padding: 50px 60px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 0 30px rgba(255, 255, 255, 0.5),
    0 0 60px rgba(255, 255, 255, 0.3),
    inset 0 0 30px rgba(255, 255, 255, 0.1);
  animation: glow 2s ease-in-out infinite alternate;
}

.loading-spinner {
  width: 80px;
  height: 80px;
  position: relative;
  margin: 0 auto 25px;
}

.spinner-ring {
  position: absolute;
  border-radius: 50%;
  animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}

.spinner-ring:nth-child(1) {
  width: 80px;
  height: 80px;
  border: 5px solid transparent;
  border-top: 5px solid #ff6b6b;
  border-right: 5px solid #4ecdc4;
  animation-delay: -0.6s;
  filter: drop-shadow(0 0 15px rgba(255, 107, 107, 0.8));
}

.spinner-ring:nth-child(2) {
  width: 60px;
  height: 60px;
  top: 10px;
  left: 10px;
  border: 4px solid transparent;
  border-top: 4px solid #45b7d1;
  border-right: 4px solid #96ceb4;
  animation-delay: -0.4s;
  animation-direction: reverse;
  filter: drop-shadow(0 0 12px rgba(69, 183, 209, 0.8));
}

.spinner-ring:nth-child(3) {
  width: 40px;
  height: 40px;
  top: 20px;
  left: 20px;
  border: 3px solid transparent;
  border-top: 3px solid #fd79a8;
  border-right: 3px solid #fdcb6e;
  animation-delay: -0.2s;
  filter: drop-shadow(0 0 10px rgba(253, 121, 168, 0.8));
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #fd79a8);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
  animation: textRainbow 2s ease-in-out infinite, textGlow 1.5s ease-in-out infinite alternate;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.9;
  }

  50% {
    opacity: 0.6;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes rainbowShift {
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

@keyframes glow {
  0% {
    box-shadow:
      0 0 20px rgba(255, 255, 255, 0.4),
      0 0 40px rgba(255, 255, 255, 0.2),
      inset 0 0 20px rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.6);
  }

  100% {
    box-shadow:
      0 0 40px rgba(255, 255, 255, 0.8),
      0 0 80px rgba(255, 255, 255, 0.4),
      inset 0 0 40px rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 1);
  }
}

@keyframes textRainbow {
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

@keyframes textGlow {
  0% {
    filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
  }

  100% {
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 1));
  }
}
</style>
