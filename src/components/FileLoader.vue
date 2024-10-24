<template>
    <div class="file-drop-area" :class="{ dragging: isDragging }" @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave" @drop.prevent="onFileDrop">
        <p>点击下方按钮打开文件，或将 <code>.ras</code> 文件拖放到此区域</p>
        <el-button color="#1565c0" type="primary" @click="openFile">打开文件</el-button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'

const store = useStore()

const isDragging = ref(false)

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

const onDragOver = (event: DragEvent) => {
    event.preventDefault()
    isDragging.value = true
}

const onDragLeave = (event: DragEvent) => {
    event.preventDefault()
    isDragging.value = false
}

const onFileDrop = (event: DragEvent) => {
    event.preventDefault()
    isDragging.value = false
    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
        const file = files[0]
        if (file.name.endsWith('.ras')) {
            const reader = new FileReader()
            reader.onload = function (e) {
                const content = e.target?.result as string
                if (content) {
                    store.parseRasFile(content)
                    store.loadedFilePath = ''
                    ElMessage.success('文件加载成功')
                } else {
                    ElMessage.error('文件读取失败')
                }
            }
            reader.onerror = function () {
                ElMessage.error('文件读取失败')
            }
            reader.readAsText(file)
        } else {
            ElMessage.error('请拖入 .ras 文件')
        }
    }
}
</script>
<style scoped>
.file-drop-area {
    border: 2px dashed #ccc;
    padding: 20px;
    text-align: center;
    position: relative;
    transition: border-color 0.3s;
}

.file-drop-area.dragging {
    border-color: #409eff;
}

.file-drop-area p {
    margin-bottom: 10px;
}

.file-drop-area code {
    background-color: #f0f0f0;
    padding: 2px 4px;
    border-radius: 4px;
}
</style>