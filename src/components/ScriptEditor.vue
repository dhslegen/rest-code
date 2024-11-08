<template>
    <el-table :data="scripts" ref="scriptTable" style="width: 100%" border
        :header-cell-style="{ backgroundColor: '#f5f7fa', textAlign: 'center' }" :show-header="true" :max-height="333">
        <el-table-column label="内置模板" align="center">
            <template #default="{ row }">
                <el-select v-model="row.template" @change="onTemplateChange(row)" :placeholder="'请选择模板'" filterable
                    clearable>
                    <el-option v-for="template in templates" :key="template.name" :label="template.name"
                        :value="template.name"></el-option>
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
                <el-select v-model="row.httpMethod" :placeholder="'请选择'">
                    <el-option label="GET" value="GET"></el-option>
                    <el-option label="POST" value="POST"></el-option>
                    <el-option label="PUT" value="PUT"></el-option>
                    <el-option label="DELETE" value="DELETE"></el-option>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column label="API路径" align="center">
            <template #default="{ row }">
                <el-input v-model="row.apiPath" placeholder="例如：/{id}"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="操作名称" align="center">
            <template #default="{ row }">
                <el-input v-model="row.operation" placeholder="例如：update"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="参数契约" align="center">
            <template #default="{ row }">
                <el-tooltip :visible="row.showTooltip" effect="dark" placement="top">
                    <template #content>
                        <div v-html="row.tooltipContent"></div>
                    </template>
                    <el-input v-model="row.contract" placeholder="输入 @?#$> 以获取提示" @input="onContractInput(row)"
                        @focus="onContractFocus(row)" @blur="onContractBlur(row)"></el-input>
                </el-tooltip>
            </template>
        </el-table-column>
        <el-table-column label="描述" align="center">
            <template #default="{ row }">
                <el-input v-model="row.description" placeholder="例如：编辑用户"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100">
            <template #default="{ $index }">
                <el-button type="danger" @click="deleteScript($index)">删除</el-button>
            </template>
        </el-table-column>
    </el-table>

    <div style="text-align: center; margin-top: 10px;">
        <el-button color="#26a69a" type="primary" @click="oneClickCRUD">一键 CRUD</el-button>
        <el-button color="#26a69a" type="primary" @click="addScript">新增脚本</el-button>
    </div>
    <el-dialog title="一键 CRUD" v-model="showCrudDialog">
        <el-form>
            <el-form-item label="领域名称">
                <el-select v-model="selectedDomain" placeholder="请选择领域名称">
                    <el-option v-for="domain in domains" :key="domain.name" :label="domain.name"
                        :value="domain.name"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
            <el-button @click="showCrudDialog = false">取消</el-button>
            <el-button type="primary" @click="confirmCRUD">确定</el-button>
        </span>
    </el-dialog>
</template>

<script setup lang="ts">
import { useStore } from '../store/'
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const store = useStore()
const scripts = store.scripts
const templates = store.templates
const domains = store.domains

import type { ElTable } from 'element-plus'

const scriptTable = ref<InstanceType<typeof ElTable> | null>(null)

const showCrudDialog = ref(false)
const selectedDomain = ref('')

const tips = {
    '@': `表示 @RequestBody 请求参数，通常用于 JSON 请求体。<br />@ 表示单个对象，例如：@RequestBody @Valid UserReqVo reqVo。<br />@= 表示对象列表，例如：@RequestBody @Valid List&lt;UserReqVo&gt; reqVos。`,
    '?': "表示 Query 查询参数，通常用于 GET 请求的查询条件。<br />示例：UserQueryVo queryVo。",
    '#': "表示 @PathVariable 数值型路径参数。<br />示例：@PathVariable(\"id\") long id。",
    '$': "表示 @PathVariable 字符串型路径参数。<br />示例：@PathVariable(\"orgCode\") String orgCode。",
    '>': "表示 @ResponseBody 响应报文。<br />&gt; 表示返回单个对象，例如：@ResponseBody Result&lt;UserRespVo&gt;。<br />&gt;= 表示返回对象列表，例如：@ResponseBody Result&lt;List&lt;UserRespVo&gt;&gt;。<br />>&lt; 表示返回树形结构，例如：@ResponseBody Result&lt;TreeNode&lt;Long, UserTreeVo&gt;&gt;。<br />&gt;+ 表示返回分页对象，例如：@ResponseBody Result&lt;Page&lt;UserRespVo&gt;&gt;。<br />不存在 &gt; 前缀符时，表示返回空对象，例如：@ResponseBody Result&lt;Void&gt;。"
}

const onContractInput = (row: any) => {
    const value = row.contract || ''
    const lastChar = value.slice(-1)
    // 根据最新字符设置对应的提示内容
    row.tooltipContent = tips[lastChar as keyof typeof tips] || ''
    row.showTooltip = !!row.tooltipContent
}

const onContractFocus = (row: any) => {
    if (row.tooltipContent) {
        row.showTooltip = true
    }
}

const onContractBlur = (row: any) => {
    row.showTooltip = false
}

const oneClickCRUD = () => {
    if (domains.length === 0) {
        ElMessage.error('请先添加领域')
        return
    }
    showCrudDialog.value = true
}

const confirmCRUD = () => {
    if (!selectedDomain.value) {
        ElMessage.error('请选择领域名称')
        return
    }
    const domainName = selectedDomain.value
    const domainDesc = domains.find((d) => d.name === domainName)?.description || ''

    const crudTemplates = ['POST-创建', 'PUT-编辑', 'GET-获取分页', 'DELETE-批量删除']
    crudTemplates.forEach((templateName) => {
        const template = templates.find((t) => t.name === templateName)
        if (template) {
            const script = {
                domain: domainName,
                httpMethod: template.httpMethod,
                apiPath: template.apiPath || '',
                operation: template.operation,
                contract: template.contract,
                description: template.description.replace('{领域描述}', domainDesc),
                template: template.name,
                tooltipContent: '',
                showTooltip: false,
            }
            store.addScript(script)
        }
    })
    showCrudDialog.value = false
    nextTick(() => {
        const tableBodyWrapper = scriptTable.value?.$el.querySelector('.el-scrollbar__wrap')
        if (tableBodyWrapper) {
            tableBodyWrapper.scrollTop = tableBodyWrapper.scrollHeight
        }
        store.setScrollToBottom(true)
    })
}

const addScript = () => {
    store.addScript({
        domain: domains.length > 0 ? domains[0].name : '',
        httpMethod: '',
        apiPath: '',
        operation: '',
        contract: '',
        description: '',
        template: '',
        tooltipContent: '',
        showTooltip: false,
    })
    nextTick(() => {
        const tableBodyWrapper = scriptTable.value?.$el.querySelector('.el-scrollbar__wrap')
        if (tableBodyWrapper) {
            tableBodyWrapper.scrollTop = tableBodyWrapper.scrollHeight
        }
        store.setScrollToBottom(true)
    })
}

const deleteScript = (index: number) => {
    store.removeScript(index)
}

const onTemplateChange = (row: any) => {
    if (row.template && row.domain) {
        const domainName = row.domain
        const templateName = row.template
        const domainDesc = domains.find((d: { name: string; description?: string }) => d.name === domainName)?.description || ''
        const template = templates.find(t => t.name === templateName)
        if (template) {
            // 根据模板自动填充脚本元素
            row.httpMethod = template.httpMethod
            row.apiPath = template.apiPath
            row.operation = template.operation
            row.contract = template.contract
            row.description = template.description.replace('{领域描述}', domainDesc)
        }
    }
}
</script>