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
        <div class="window-controls" v-if="!isDarwin">
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
          <div class="section-header">
            <div class="section-icon">⚡</div>
            <span class="section-title">操作区域</span>
            <el-button text class="collapse-btn" @click="toggleSection('operation')"
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
                    <code-generator :script-editor-ref="scriptViewerRef" />
                  </div>
                </div>
              </div>
            </div>
          </el-collapse-transition>
        </div>

        <!-- 领域设计区域 -->
        <div class="section-card domain-section">
          <div class="section-header">
            <div class="section-icon">🎯</div>
            <span class="section-title">领域设计</span>
            <el-button text class="collapse-btn" @click="toggleSection('domain')"
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
          <div class="section-header">
            <div class="section-icon">⚙️</div>
            <span class="section-title">脚本设计</span>
            <el-button text class="collapse-btn" @click="toggleSection('script')"
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
            <script-viewer ref="scriptViewerRef" />
          </div>
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
import { ref, reactive, computed, onMounted } from 'vue'

const scriptViewerRef = ref()

// 平台检测
const platform = ref('')
const isDarwin = computed(() => platform.value === 'darwin')
const isWin32 = computed(() => platform.value === 'win32')

// 获取平台信息
onMounted(() => {
  platform.value = navigator.platform.toLowerCase().includes('mac') ? 'darwin' :
    navigator.platform.toLowerCase().includes('win') ? 'win32' : 'linux'
})

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

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

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
  height: 220px;
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
</style>

/* 全局下拉框样式 */
<style>
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

/* Element Plus 消息提示美化 */
.el-message {
  padding: 16px 24px !important;
  border-radius: 16px !important;
  border: none !important;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
  backdrop-filter: blur(25px) !important;
  font-weight: 700 !important;
  font-size: 15px !important;
  letter-spacing: -0.1px !important;
  z-index: 3000 !important;
  line-height: 1.4 !important;
}

.el-message--success {
  background: linear-gradient(135deg,
      rgba(34, 197, 94, 0.95) 0%,
      rgba(16, 185, 129, 0.95) 100%) !important;
  color: white !important;
  border: 1px solid rgba(34, 197, 94, 0.3) !important;
}

.el-message--success .el-message__icon {
  color: white !important;
  font-size: 18px !important;
  margin-right: 8px !important;
}

.el-message--success .el-message__content {
  color: white !important;
  font-weight: 700 !important;
}

.el-message--error {
  background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.95) 0%,
      rgba(220, 38, 38, 0.95) 100%) !important;
  color: white !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.el-message--error .el-message__icon {
  color: white !important;
  font-size: 18px !important;
  margin-right: 8px !important;
}

.el-message--error .el-message__content {
  color: white !important;
  font-weight: 700 !important;
}

.el-message--warning {
  background: linear-gradient(135deg,
      rgba(245, 158, 11, 0.95) 0%,
      rgba(217, 119, 6, 0.95) 100%) !important;
  color: white !important;
  border: 1px solid rgba(245, 158, 11, 0.3) !important;
}

.el-message--warning .el-message__icon {
  color: white !important;
  font-size: 18px !important;
  margin-right: 8px !important;
}

.el-message--warning .el-message__content {
  color: white !important;
  font-weight: 700 !important;
}

.el-message--info {
  background: linear-gradient(135deg,
      rgba(59, 130, 246, 0.95) 0%,
      rgba(37, 99, 235, 0.95) 100%) !important;
  color: white !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
}

.el-message--info .el-message__icon {
  color: white !important;
  font-size: 18px !important;
  margin-right: 8px !important;
}

.el-message--info .el-message__content {
  color: white !important;
  font-weight: 700 !important;
}
</style>

/* 窗口容器 - 实现完美圆角一体化 */
.window-container {
width: 100vw;
height: 100vh;
padding: 0; /* 移除padding */
background: transparent;
box-sizing: border-box;
}

.window-container .app-container {
width: 100%;
height: 100%;
border-radius: 0; /* 移除圆角 */
overflow: hidden;
box-shadow: none; /* 移除阴影 */
backdrop-filter: none; /* 移除模糊效果 */
display: flex;
flex-direction: column;
}

/* 内容滚动区域 */
.app-content {
flex: 1;
overflow-y: auto;
padding: 0 0 20px 0; /* 移除左右padding，只保留底部padding */
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
