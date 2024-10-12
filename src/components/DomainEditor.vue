<template>
    <el-table :data="domains" style="width: 100%" border>
        <el-table-column prop="name" label="领域名称">
            <template #default="{ row }">
                <el-input v-model="row.name" placeholder="领域名称"></el-input>
            </template>
        </el-table-column>
        <el-table-column prop="description" label="领域描述">
            <template #default="{ row }">
                <el-input v-model="row.description" placeholder="领域描述"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="操作">
            <template #default="{ $index }">
                <el-button type="danger" @click="deleteDomain($index)">删除</el-button>
            </template>
        </el-table-column>
    </el-table>

    <el-button type="primary" @click="addDomain">新增领域</el-button>
</template>

<script setup lang="ts">
import { useStore } from '../store/'

const store = useStore()
const domains = store.domains

const addDomain = () => {
    store.addDomain({ name: '', description: '' })
}

const deleteDomain = (index: number) => {
    store.removeDomain(index)
}
</script>