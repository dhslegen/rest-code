<template>
    <el-form :model="config" label-width="120px">
        <el-form-item label="框架包名前缀">
            <el-input v-model="config.frameworkPackagePrefix"
                :placeholder="'生成代码依赖的框架包名前缀，例如：com.wanji.software.tocc'"></el-input>
        </el-form-item>
        <el-form-item label="源码生成根路径">
            <el-input v-model="config.outputPath" :placeholder="'例如：/.../src/main/java'"></el-input>
        </el-form-item>
        <el-form-item label="基本包名">
            <el-input v-model="config.basePackage" :placeholder="'例如：com.wanji.software.tocc.system.uaa'"></el-input>
        </el-form-item>
        <el-form-item label="生成方式">
            <el-radio-group v-model="config.mode">
                <el-radio value="overwrite">覆盖</el-radio>
                <el-radio value="incremental">增量</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item>
            <el-button color="#1565c0" type="primary" @click="generateCode">生成代码</el-button>
        </el-form-item>
    </el-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'
import { generateJavaCode } from '../code-generator'
import type { Config } from '../types'

const store = useStore()

const config = reactive<Config>({
    frameworkPackagePrefix: '',
    outputPath: '',
    basePackage: '',
    mode: 'overwrite',
})

const generateCode = async () => {
    try {
        const rasContent = store.generateRasContent()
        await generateJavaCode(config, rasContent)
        ElMessage.success('代码生成成功')
    } catch (error) {
        console.error(error)
        ElMessage.error('代码生成失败')
    }
}
</script>
