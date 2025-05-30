<template>
    <div class="file-loader">
        <div 
            class="file-drop-area" 
            :class="{ dragging: isDragging }" 
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave" 
            @drop.prevent="onFileDrop"
        >
            <div class="drop-content">
                <div class="drop-icon">
                    <el-icon v-if="!isDragging" class="upload-icon">
                        <Upload />
                    </el-icon>
                    <el-icon v-else class="dragging-icon">
                        <Document />
                    </el-icon>
                </div>
                <div class="drop-text">
                    <p class="primary-text" v-if="!isDragging">
                        拖拽 <code>.rcs</code> 文件到此处
                    </p>
                    <p class="primary-text dragging-text" v-else>
                        松开以加载文件
                    </p>
                    <p class="secondary-text">或点击下方按钮选择文件</p>
                </div>
                <el-button class="upload-btn" @click="openFile" type="primary">
                    <el-icon><FolderOpened /></el-icon>
                    选择文件
                </el-button>
            </div>
        </div>
        
        <!-- 文件信息显示 -->
        <div v-if="store.loadedFilePath" class="file-info">
            <div class="file-icon">📄</div>
            <div class="file-details">
                <div class="file-name">{{ getFileName(store.loadedFilePath) }}</div>
                <div class="file-path">{{ store.loadedFilePath }}</div>
                <div class="file-time">加载时间：{{ formatDate(new Date()) }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'
import { Upload, Document, FolderOpened } from '@element-plus/icons-vue'

const store = useStore()

const isDragging = ref(false)

const openFile = async () => {
    const { filePaths, canceled } = await window.api.showOpenDialog({
        filters: [{ name: "Rcs Files", extensions: ["rcs"] }],
        properties: ['openFile']
    })
    if (!canceled && filePaths && filePaths.length > 0) {
        const filePath = filePaths[0]
        // 读取文件内容
        const content = window.api.readFile(filePath)
        if (content) {
            store.parseRcsFile(content)
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
        if (file.name.endsWith('.rcs')) {
            const reader = new FileReader()
            reader.onload = function (e) {
                const content = e.target?.result as string
                if (content) {
                    store.parseRcsFile(content)
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
            ElMessage.error('请拖入 .rcs 文件')
        }
    }
}

// 获取文件名
const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || filePath.split('\\').pop() || filePath
}

// 格式化日期
const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}
</script>

<style scoped>
.file-loader {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
}

.file-drop-area {
    background: rgba(255, 255, 255, 0.8);
    border: 2px dashed rgba(0, 122, 255, 0.3);
    border-radius: 16px;
    padding: 32px 24px;
    text-align: center;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.file-drop-area:hover {
    border-color: rgba(0, 122, 255, 0.5);
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
}

.file-drop-area.dragging {
    border-color: #007AFF;
    background: rgba(0, 122, 255, 0.05);
    border-style: solid;
    box-shadow: 0 0 20px rgba(0, 122, 255, 0.2);
}

.drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.drop-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(90, 200, 250, 0.1));
    border-radius: 50%;
    transition: all 0.3s ease;
}

.upload-icon, .dragging-icon {
    font-size: 32px;
    color: #007AFF;
    transition: all 0.3s ease;
}

.dragging .drop-icon {
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.2), rgba(90, 200, 250, 0.2));
    transform: scale(1.1);
}

.dragging .dragging-icon {
    color: #0051D5;
    animation: bounce 0.6s ease-in-out infinite alternate;
}

@keyframes bounce {
    0% { transform: translateY(0); }
    100% { transform: translateY(-4px); }
}

.drop-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.primary-text {
    font-size: 16px;
    font-weight: 500;
    color: #2c3e50;
    margin: 0;
    transition: color 0.3s ease;
}

.dragging-text {
    color: #007AFF;
    font-weight: 600;
}

.secondary-text {
    font-size: 14px;
    color: #6c757d;
    margin: 0;
}

code {
    background: rgba(0, 122, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 14px;
    color: #007AFF;
}

.upload-btn {
    background: linear-gradient(135deg, #007AFF, #5AC8FA);
    border: none;
    border-radius: 12px;
    padding: 12px 24px;
    font-weight: 500;
    font-size: 14px;
    color: white;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 8px;
}

.upload-btn:hover {
    background: linear-gradient(135deg, #0051D5, #32A3F7);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.upload-btn:active {
    transform: translateY(0);
}

.file-info {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.file-info:hover {
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.file-icon {
    font-size: 24px;
    opacity: 0.8;
}

.file-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.file-name {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
}

.file-path {
    font-size: 13px;
    color: #6c757d;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    word-break: break-all;
}

.file-time {
    font-size: 12px;
    color: #28a745;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .file-drop-area {
        padding: 24px 16px;
        min-height: 160px;
    }
    
    .drop-icon {
        width: 48px;
        height: 48px;
    }
    
    .upload-icon, .dragging-icon {
        font-size: 24px;
    }
    
    .primary-text {
        font-size: 14px;
    }
    
    .secondary-text {
        font-size: 13px;
    }
    
    .upload-btn {
        padding: 10px 20px;
        font-size: 13px;
    }
    
    .file-info {
        padding: 12px 16px;
    }
    
    .file-name {
        font-size: 14px;
    }
    
    .file-path {
        font-size: 12px;
    }
}
</style>