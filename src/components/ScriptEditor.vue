<template>
    <el-table :data="scripts" style="width: 100%" border max-height="265"
        :header-cell-style="{ backgroundColor: '#f5f7fa', textAlign: 'center' }" :show-header="true">
        <el-table-column label="内置模板" align="center">
            <template #default="{ row }">
                <el-select v-model="row.template" @change="onTemplateChange(row)" :placeholder="'请选择模板'" filterable>
                    <el-option v-for="item in templates" :key="item.name" :label="item.name" :value="item"></el-option>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column label="领域名称" align="center">
            <template #default="{ row }">
                <el-select v-model="row.domain" @change="onTemplateChange(row)" :placeholder="'请选择领域名称'" filterable>
                    <el-option v-for="domain in domains" :key="domain.name" :label="domain.name"
                        :value="domain.name"></el-option>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column label="HTTP请求方法" align="center" width="100">
            <template #default="{ row }">
                <el-select v-model="row.httpMethod">
                    <el-option label="GET" value="GET"></el-option>
                    <el-option label="POST" value="POST"></el-option>
                    <el-option label="PUT" value="PUT"></el-option>
                    <el-option label="DELETE" value="DELETE"></el-option>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column label="API路径" align="center">
            <template #default="{ row }">
                <el-input v-model="row.apiPath" placeholder="例如：/users"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="操作名称" align="center">
            <template #default="{ row }">
                <el-input v-model="row.operation" placeholder="操作名称"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="参数契约" align="center">
            <template #default="{ row }">
                <el-input v-model="row.contract" placeholder="参数契约"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="描述" align="center">
            <template #default="{ row }">
                <el-input v-model="row.description" placeholder="描述"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100">
            <template #default="{ $index }">
                <el-button type="danger" @click="deleteScript($index)">删除</el-button>
            </template>
        </el-table-column>
    </el-table>

    <div style="text-align: center; margin-top: 10px;">
        <el-button color="#26a69a" type="primary" @click="addScript">新增脚本</el-button>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '../store/'

const store = useStore()
const scripts = store.scripts
const templates = store.templates
const domains = store.domains

const addScript = () => {
    store.addScript({
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

const onTemplateChange = (row: any) => {
    if (row.template && row.domain) {
        const domainName = row.domain
        const domainDesc = domains.find((d: { name: string; description?: string }) => d.name === domainName)?.description || ''
        // 根据模板自动填充脚本元素
        row.httpMethod = row.template.httpMethod
        row.apiPath = row.template.apiPath
        row.operation = row.template.operation
        row.contract = row.template.contract
        row.description = row.template.description.replace('{领域描述}', domainDesc)
    }
}
</script>