<template>
    <el-upload class="upload-demo" drag action="" :before-upload="beforeUpload" :auto-upload="false">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip" slot="tip">仅支持 .ras 文件</div>
    </el-upload>
</template>

<script setup lang="ts">
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'

const store = useStore()

const beforeUpload = (file: File) => {
    if (file.type !== 'application/octet-stream' && !file.name.endsWith('.ras')) {
        ElMessage.error('只能上传 .ras 文件')
        return false
    }
    const reader = new FileReader()
    reader.onload = (e) => {
        const content = e.target?.result as string
        // 解析文件内容
        store.parseRasFile(content)
    }
    reader.readAsText(file)
    return false
}
</script>