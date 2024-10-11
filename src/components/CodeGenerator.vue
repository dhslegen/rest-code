<template>
    <el-form :model="config" label-width="120px">
        <el-form-item label="源码生成根路径">
            <el-input v-model="config.outputPath"></el-input>
        </el-form-item>
        <el-form-item label="基本包名">
            <el-input v-model="config.basePackage"></el-input>
        </el-form-item>
        <el-form-item label="生成方式">
            <el-radio-group v-model="config.mode">
                <el-radio label="overwrite">覆盖</el-radio>
                <el-radio label="incremental">增量</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="generateCode">生成代码</el-button>
        </el-form-item>
    </el-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'

const store = useStore()
const config = reactive({
    outputPath: '',
    basePackage: '',
    mode: 'overwrite',
})

const generateCode = () => {
    // 暂时使用空实现，打印输入参数
    console.log('生成代码参数：', {
        outputPath: config.outputPath,
        basePackage: config.basePackage,
        mode: config.mode,
        rasContent: store.generateRasContent(),
    })
    ElMessage.success('代码生成成功（模拟）')
}
</script>