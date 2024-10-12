<template>
    <el-button type="primary" @click="openFile">打开文件</el-button>
</template>

<script setup lang="ts">
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'

const store = useStore()

const openFile = async () => {
    const { filePaths, canceled } = await window.ipcRenderer.showOpenDialog()
    if (!canceled && filePaths && filePaths.length > 0) {
        const filePath = filePaths[0]
        // 读取文件内容
        const content = await window.ipcRenderer.readFile(filePath)
        if (content) {
            store.parseRasFile(content)
            store.loadedFilePath = filePath
            ElMessage.success('文件加载成功')
        } else {
            ElMessage.error('文件读取失败')
        }
    } else {
        ElMessage.info('已取消选择文件')
    }
}
</script>