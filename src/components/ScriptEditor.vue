<template>
    <div ref="scriptTableWrapper" style="max-height: 265px; overflow: auto;">
        <el-table :data="scripts" style="width: 100%" border
            :header-cell-style="{ backgroundColor: '#f5f7fa', textAlign: 'center' }" :show-header="true">
            <el-table-column label="内置模板" align="center">
                <template #default="{ row }">
                    <el-select v-model="row.template" @change="onTemplateChange(row)" :placeholder="'请选择模板'" filterable>
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
    </div>

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

const scriptTableWrapper = ref<HTMLElement | null>(null)

const showCrudDialog = ref(false)
const selectedDomain = ref('')

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
            }
            store.addScript(script)
        }
    })
    showCrudDialog.value = false
    nextTick(() => {
        if (scriptTableWrapper.value) {
            scriptTableWrapper.value.scrollTop = scriptTableWrapper.value.scrollHeight
        }
    })
}

const addScript = () => {
    store.addScript({
        domain: '',
        httpMethod: '',
        apiPath: '',
        operation: '',
        contract: '',
        description: '',
        template: templates[0].name,
    })
    nextTick(() => {
        if (scriptTableWrapper.value) {
            scriptTableWrapper.value.scrollTop = scriptTableWrapper.value.scrollHeight
        }
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