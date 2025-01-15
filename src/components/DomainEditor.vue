<template>
    <el-table :data="domains" ref="domainTable" style="width: 100%" border :max-height="333"
        :header-cell-style="{ backgroundColor: '#f5f7fa', textAlign: 'center' }" :show-header="true">
        <el-table-column prop="name" label="领域名称" width="180" align="center">
            <template #default="{ row }">
                <el-input v-model="row.name" placeholder="领域名称"></el-input>
            </template>
        </el-table-column>
        <el-table-column prop="description" label="领域描述" align="center">
            <template #default="{ row }">
                <el-input v-model="row.description" placeholder="领域描述"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
            <template #default="{ $index }">
                <el-button type="danger" @click="deleteDomain($index)">删除</el-button>
            </template>
        </el-table-column>
    </el-table>

    <div style="text-align: center; margin-top: 10px;">
        <el-button color="#6c5ce7" type="primary" @click="addDomain">新增领域</el-button>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '../store/'
import { ref, nextTick } from 'vue'
import type { ElTable } from 'element-plus'

const domainTable = ref<InstanceType<typeof ElTable> | null>(null)

const store = useStore()
const domains = store.domains

const addDomain = () => {
    store.addDomain({ name: '', description: '' })
    nextTick(() => {
        const tableBodyWrapper = domainTable.value?.$el.querySelector('.el-scrollbar__wrap')
        if (tableBodyWrapper) {
            tableBodyWrapper.scrollTop = tableBodyWrapper.scrollHeight
        }
        store.setScrollToBottom(true)
    })
}

const deleteDomain = (index: number) => {
    store.removeDomain(index)
}
</script>