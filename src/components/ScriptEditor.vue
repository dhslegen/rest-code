<template>
    <el-table :data="scripts" style="width: 100%">
        <el-table-column label="内置模板">
            <template #default="{ row, $index }">
                <el-select v-model="row.template" @change="onTemplateChange(row, $index)">
                    <el-option v-for="item in templates" :key="item.name" :label="item.name" :value="item"></el-option>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column label="领域名称">
            <template #default="{ row }">
                <el-select v-model="row.domain">
                    <el-option v-for="domain in domains" :key="domain.name" :label="domain.name"
                        :value="domain.name"></el-option>
                </el-select>
            </template>
        </el-table-column>
        <!-- 其他列类似 -->
        <el-table-column label="操作">
            <template #default="{ $index }">
                <el-button @click="deleteScript($index)">删除</el-button>
            </template>
        </el-table-column>
    </el-table>

    <el-button type="primary" @click="addScript">新增脚本</el-button>
</template>

<script setup lang="ts">
import { useStore } from '../store/'

const store = useStore()
const scripts = store.scripts
const templates = store.templates
const domains = store.domains

const addScript = () => {
    store.addScript({
        template: null,
        domain: '',
        httpMethod: '',
        apiPath: '',
        operation: '',
        contract: '',
        description: '',
    })
}

const deleteScript = (index: number) => {
    store.removeScript(index)
}

const onTemplateChange = (row: any, index: number) => {
    console.log('onTemplateChange', row, index)
    if (row.template && row.domain) {
        const domainName = row.domain
        const domainDesc = domains.find((d: { name: string; description?: string }) => d.name === domainName)?.description || ''
        // 根据模板自动填充脚本元素
        row.httpMethod = row.template['http-method']
        row.apiPath = row.template['api-path']
        row.operation = row.template.operation
        row.contract = row.template.contract
        row.description = row.template.description.replace('{领域描述}', domainDesc)
    }
}
</script>