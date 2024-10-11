<template>
    <el-table :data="domains" style="width: 100%">
        <el-table-column prop="name" label="领域名称"></el-table-column>
        <el-table-column prop="description" label="领域描述"></el-table-column>
        <el-table-column label="操作">
            <template #default="{ row, $index }">
                <el-button @click="editDomain(row, $index)">编辑</el-button>
                <el-button @click="deleteDomain($index)">删除</el-button>
            </template>
        </el-table-column>
    </el-table>

    <el-button type="primary" @click="addDomain">新增领域</el-button>

    <!-- 新增/编辑对话框 -->
    <el-dialog :visible.sync="dialogVisible" title="领域信息">
        <el-form :model="currentDomain" :rules="rules" ref="domainForm">
            <el-form-item label="领域名称" prop="name">
                <el-input v-model="currentDomain.name"></el-input>
            </el-form-item>
            <el-form-item label="领域描述" prop="description">
                <el-input v-model="currentDomain.description"></el-input>
            </el-form-item>
        </el-form>
        <div slot="footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveDomain">保存</el-button>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useStore } from '../store/'

const store = useStore()
const domains = store.domains

const dialogVisible = ref(false)
const isEdit = ref(false)
const currentIndex = ref(-1)
const domainForm = ref()
const currentDomain = reactive({ name: '', description: '' })

const rules = {
    name: [
        { required: true, message: '请输入领域名称', trigger: 'blur' },
        {
            pattern: /^[A-Z][a-zA-Z0-9]*$/,
            message: '领域名称需符合大写字母开头的驼峰命名法',
            trigger: 'blur',
        },
    ],
    description: [{ required: true, message: '请输入领域描述', trigger: 'blur' }],
}

const addDomain = () => {
    isEdit.value = false
    currentDomain.name = ''
    currentDomain.description = ''
    dialogVisible.value = true
}

const editDomain = (domain: { name: string; description: string; }, index: number) => {
    isEdit.value = true
    currentIndex.value = index
    currentDomain.name = domain.name
    currentDomain.description = domain.description
    dialogVisible.value = true
}

const saveDomain = () => {
    domainForm.value.validate((valid: boolean) => {
        if (valid) {
            if (isEdit.value) {
                store.updateDomain(currentIndex.value, { ...currentDomain })
            } else {
                store.addDomain({ ...currentDomain })
            }
            dialogVisible.value = false
        }
    })
}

const deleteDomain = (index: number) => {
    store.removeDomain(index)
}
</script>