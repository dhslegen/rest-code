<template>
  <el-input type="textarea" :rows="10" :value="rasContent" readonly></el-input>
  <div>
    <el-button type="primary" @click="validateScripts">校验</el-button>
    <el-button @click="saveScripts">保存</el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'


const store = useStore()
const rasContent = computed(() => {
  return store.generateRasContent()
})

const validateScripts = () => {
  const errors = store.validateScripts()
  if (errors.length > 0) {
    ElMessage.error(`校验失败：\n${errors.join('\n')}`)
  } else {
    ElMessage.success('校验通过')
  }
}

const saveScripts = async () => {
  if (store.loadedFilePath) {
    store.saveRasFile(store.loadedFilePath)
  } else {
    const filePath = await window.ipcRenderer.showSaveDialog()
    if (filePath) {
      store.saveRasFile(filePath)
    }
  }
}
</script>