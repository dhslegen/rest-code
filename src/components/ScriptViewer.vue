<template>
  <!-- 错误信息展示 -->
  <el-popover v-model="showErrorPopover" placement="top" width="600" :visible="showErrorPopover">
    <div v-html="formattedErrors" style="height: 300px;overflow: auto;"></div>
    <template #reference>
      <el-alert ref="errorButton" center title="脚本查看" style="background-color:#c41d7f; height: 20px;" type="success"
        effect="dark" :closable=false />
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
    <el-button type="primary" @click="validateScripts"
      style="background-color: #c41d7f;border-color: #c41d7f;">校验</el-button>
    <el-button type="primary" @click="saveScripts"
      style="background-color: #c41d7f;border-color: #c41d7f;">保存</el-button>
  </div>

</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'


const store = useStore()
const rasContent = computed(() => {
  return store.generateRasContent()
})

const lineNumbers = ref('')
const errors = ref<string[]>([])
const showErrorPopover = ref(false)
const formattedErrors = ref('')

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
      console.log(errorButton.value)
      const errorBtn = (errorButton.value as ComponentPublicInstance).$el
      console.log(errorBtn)
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