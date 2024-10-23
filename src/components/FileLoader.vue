<template>
    <el-button color="#1565c0" type="primary" @click="openFile">打开文件</el-button>
</template>

<script setup lang="ts">
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'

const store = useStore()

const openFile = async () => {
    const { filePaths, canceled } = await window.api.showOpenDialog({
        filters: [{ name: "Ras Files", extensions: ["ras"] }],
        properties: ['openFile']
    })
    if (!canceled && filePaths && filePaths.length > 0) {
        const filePath = filePaths[0]
        // 读取文件内容
        const content = window.api.readFile(filePath)
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