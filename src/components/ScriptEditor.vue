<template>
    <div class="script-editor">
        <div class="table-container">
            <el-table 
                :data="scripts" 
                ref="scriptTable" 
                class="modern-table"
                :header-cell-style="{ backgroundColor: 'rgba(248, 249, 250, 0.8)', textAlign: 'center', color: '#2c3e50', fontWeight: '600' }" 
                :show-header="true" 
                :max-height="300"
            >
        <el-table-column label="内置模板" align="center">
            <template #default="{ row }">
                        <el-select v-model="row.template" @change="onTemplateChange(row)" placeholder="请选择模板" filterable
                            clearable class="table-select">
                    <el-option v-for="template in templates" :key="template.name" :label="template.name"
                        :value="template.name"></el-option>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column label="领域名称" align="center">
            <template #default="{ row }">
                        <el-select v-model="row.domain" @change="onTemplateChange(row)" placeholder="请选择领域名称" filterable
                            class="table-select">
                    <el-option v-for="domain in domains" :key="domain.name" :label="domain.name"
                        :value="domain.name"></el-option>
                </el-select>
            </template>
        </el-table-column>
                <el-table-column label="HTTP请求方法" align="center" width="120">
            <template #default="{ row }">
                        <el-select v-model="row.httpMethod" placeholder="请选择" class="table-select">
                    <el-option label="GET" value="GET"></el-option>
                    <el-option label="POST" value="POST"></el-option>
                            <el-option label="PATCH" value="PATCH"></el-option>
                    <el-option label="DELETE" value="DELETE"></el-option>
                </el-select>
            </template>
        </el-table-column>
        <el-table-column label="API路径" align="center">
            <template #default="{ row }">
                        <el-input v-model="row.apiPath" placeholder="例如：/{id}" class="table-input"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="操作名称" align="center">
            <template #default="{ row }">
                        <el-input v-model="row.operation" placeholder="例如：update" class="table-input"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="参数契约" align="center">
            <template #default="{ row }">
                <el-tooltip :visible="row.showTooltip" effect="dark" placement="top">
                    <template #content>
                        <div v-html="row.tooltipContent"></div>
                    </template>
                            <el-input v-model="row.contract" placeholder="输入 @?%> 以获取提示" @input="onContractInput(row)"
                                @focus="onContractFocus(row)" @blur="onContractBlur(row)" class="table-input"></el-input>
                </el-tooltip>
            </template>
        </el-table-column>
        <el-table-column label="描述" align="center">
            <template #default="{ row }">
                        <el-input v-model="row.description" placeholder="例如：编辑用户" class="table-input"></el-input>
            </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100">
            <template #default="{ $index }">
                        <el-button class="delete-btn" @click="deleteScript($index)">
                            <el-icon><Delete /></el-icon>
                            删除
                        </el-button>
            </template>
        </el-table-column>
    </el-table>
        </div>

        <div class="action-container">
            <el-button class="crud-btn" @click="oneClickCRUD">
                <el-icon><Operation /></el-icon>
                一键 CRUD
            </el-button>
            <el-button class="add-btn" @click="addScript">
                <el-icon><Plus /></el-icon>
                新增脚本
            </el-button>
        </div>
    </div>
    
    <el-dialog title="一键 CRUD" v-model="showCrudDialog" class="modern-dialog" center>
        <el-form>
            <el-form-item label="领域名称">
                <el-select v-model="selectedDomain" placeholder="请选择领域名称" class="dialog-select">
                    <el-option v-for="domain in domains" :key="domain.name" :label="domain.name"
                        :value="domain.name"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button class="cancel-btn" @click="showCrudDialog = false">取消</el-button>
            <el-button class="confirm-btn" @click="confirmCRUD">确定</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { useStore } from '../store/'
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus, Operation } from '@element-plus/icons-vue'

const store = useStore()
const scripts = store.scripts
const templates = store.templates
const domains = store.domains

import type { ElTable } from 'element-plus'

const scriptTable = ref<InstanceType<typeof ElTable> | null>(null)

const showCrudDialog = ref(false)
const selectedDomain = ref('')

const tips = {
    '@': `<strong>@ - 请求体参数（RequestBody）</strong><br />
          用于定义 HTTP 请求体中的 JSON 数据结构：<br /><br />
          <strong>基础格式：</strong><br />
          • <code>@</code> → <code>@RequestBody @Valid UserReqVo reqVo</code> (单个业务对象)<br />
          • <code>@业务名</code> → <code>@RequestBody @Valid UserUpdateReqVo reqVo</code> (指定业务场景)<br /><br />
          <strong>列表格式：</strong><br />
          • <code>@=</code> → <code>@RequestBody @Valid List&lt;UserReqVo&gt; reqVos</code> (对象列表)<br />
          • <code>@=业务名</code> → <code>@RequestBody @Valid List&lt;UserUpdateReqVo&gt; reqVos</code> (带业务后缀)<br /><br />
          <strong>数值列表：</strong><br />
          • <code>@#</code> → <code>@RequestBody @Valid List&lt;Long&gt; ids</code> (默认参数名)<br />
          • <code>@#参数名</code> → <code>@RequestBody @Valid List&lt;Long&gt; userIds</code> (自定义参数名)<br /><br />
          <strong>字符串列表：</strong><br />
          • <code>@$</code> → <code>@RequestBody @Valid List&lt;String&gt; codes</code> (默认参数名)<br />
          • <code>@$参数名</code> → <code>@RequestBody @Valid List&lt;String&gt; orgCodes</code> (自定义参数名)`,

    '?': `<strong>? - 查询参数（Query Parameters）</strong><br />
          用于定义 HTTP GET 请求的查询条件：<br /><br />
          <strong>对象查询：</strong><br />
          • <code>?</code> → <code>@ParameterObject UserQueryVo queryVo</code> (标准查询对象)<br />
          • <code>?业务名</code> → <code>@ParameterObject UserSimpleQueryVo queryVo</code> (指定业务场景)<br /><br />
          <strong>字符串查询：</strong><br />
          • <code>?\$</code> → <code>@RequestParam("code") String code</code> (默认字符串参数)<br />
          • <code>?\$参数名</code> → <code>@RequestParam("参数名") String 参数名</code> (自定义字符串参数)<br /><br />
          <strong>数值查询：</strong><br />
          • <code>?#</code> → <code>@RequestParam("number") Long number</code> (默认数值参数)<br />
          • <code>?#参数名</code> → <code>@RequestParam("参数名") Long 参数名</code> (自定义数值参数)`,

    '%': `<strong>% - 路径参数（PathVariable）</strong><br />
          用于定义 URL 路径中的变量：<br /><br />
          <strong>数值型路径参数：</strong><br />
          • <code>%</code> → <code>@PathVariable("id") long id</code> (默认主键ID)<br />
          • <code>%参数名</code> → <code>@PathVariable("userId") long userId</code> (自定义数值参数)<br /><br />
          <strong>字符串型路径参数：</strong><br />
          • <code>%$</code> → <code>@PathVariable("code") String code</code> (默认编码参数)<br />
          • <code>%$参数名</code> → <code>@PathVariable("orgCode") String orgCode</code> (自定义字符串参数)`,

    '>': `<strong>&gt; - 响应类型（Response Type）</strong><br />
          用于定义 HTTP 响应体的数据结构：<br /><br />
          <strong>单个对象响应：</strong><br />
          • <code>&gt;</code> → <code>Result&lt;UserRespVo&gt;</code> (单个业务对象)<br />
          • <code>&gt;业务名</code> → <code>Result&lt;UserSimpleRespVo&gt;</code> (指定业务场景)<br /><br />
          <strong>列表响应：</strong><br />
          • <code>&gt;=</code> → <code>Result&lt;List&lt;UserRespVo&gt;&gt;</code> (对象列表)<br />
          • <code>&gt;=业务名</code> → <code>Result&lt;List&lt;UserSimpleRespVo&gt;&gt;</code> (指定业务场景)<br /><br />
          <strong>分页响应：</strong><br />
          • <code>&gt;+</code> → <code>Result&lt;Page&lt;UserRespVo&gt;&gt;</code> (自动添加分页查询参数)<br />
          • <code>&gt;+业务名</code> → <code>Result&lt;Page&lt;UserSimpleRespVo&gt;&gt;</code> (指定业务场景)<br /><br />
          <strong>树形响应：</strong><br />
          • <code>&gt;&lt;</code> → <code>Result&lt;TreeNode&lt;Long, UserTreeVo&gt;&gt;</code> (树形结构)<br />
          • <code>&gt;&lt;业务名</code> → <code>Result&lt;TreeNode&lt;Long, UserSimpleTreeVo&gt;&gt;</code> (指定业务场景)<br /><br />
          <strong>空响应：</strong><br />
          • 无 <code>&gt;</code> 符号 → <code>Result&lt;Void&gt;</code> (无返回数据的操作)`
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

    const crudTemplates = ['POST-创建', 'PATCH-编辑', 'GET-获取分页', 'DELETE-批量删除']
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

<style scoped>
.script-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
}

.table-container {
    flex: 1;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(0, 122, 255, 0.1);
    backdrop-filter: blur(15px);
    box-shadow: 0 8px 32px rgba(0, 122, 255, 0.08);
}

:deep(.modern-table) {
    background: transparent;
    border-radius: 12px;
}

:deep(.modern-table .el-table__header-wrapper) {
    border-radius: 12px 12px 0 0;
}

:deep(.modern-table .el-table__body-wrapper) {
    background: rgba(255, 255, 255, 0.3);
}

:deep(.modern-table .el-table__row) {
    background: rgba(255, 255, 255, 0.4);
    transition: all 0.3s ease;
}

:deep(.modern-table .el-table__row:hover) {
    background: rgba(0, 122, 255, 0.08);
}

:deep(.modern-table td) {
    border-color: rgba(0, 0, 0, 0.05);
    padding: 8px 6px;
}

:deep(.modern-table th) {
    border-color: rgba(0, 0, 0, 0.05);
    padding: 12px 6px;
    font-size: 13px;
}

:deep(.table-input) {
    border: none;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 6px;
}

:deep(.table-input .el-input__wrapper) {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    transition: all 0.3s ease;
    font-size: 12px;
}

:deep(.table-input .el-input__wrapper:hover) {
    border-color: rgba(0, 122, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.1);
}

:deep(.table-input .el-input__wrapper.is-focus) {
    border-color: #007AFF;
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
}

:deep(.table-select) {
    width: 100%;
}

:deep(.table-select .el-select__wrapper) {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    transition: all 0.3s ease;
    font-size: 12px;
}

:deep(.table-select .el-select__wrapper:hover) {
    border-color: rgba(0, 122, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.1);
}

:deep(.table-select .el-select__wrapper.is-focused) {
    border-color: #007AFF;
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
}

.delete-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
    border: none;
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 2px;
}

.delete-btn:hover {
    background: linear-gradient(135deg, #ee5a52, #e74c3c);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.action-container {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 12px 0;
}

.crud-btn {
    background: linear-gradient(135deg, #007AFF, #5AC8FA);
    border: none;
    color: white;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}

.crud-btn:hover {
    background: linear-gradient(135deg, #5AC8FA, #64D2FF);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.add-btn {
    background: linear-gradient(135deg, #007AFF, #5AC8FA);
    border: none;
    color: white;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}

.add-btn:hover {
    background: linear-gradient(135deg, #5AC8FA, #64D2FF);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

/* 对话框样式 */
:deep(.modern-dialog) {
    border-radius: 16px;
    overflow: hidden;
}

:deep(.modern-dialog .el-dialog__header) {
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(90, 200, 250, 0.1));
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.modern-dialog .el-dialog__body) {
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
}

:deep(.modern-dialog .el-dialog__footer) {
    background: rgba(248, 249, 250, 0.9);
    padding: 16px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    text-align: center;
}

:deep(.dialog-select) {
    width: 100%;
}

:deep(.dialog-select .el-select__wrapper) {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    transition: all 0.3s ease;
}

:deep(.dialog-select .el-select__wrapper:hover) {
    border-color: rgba(0, 122, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.1);
}

.cancel-btn {
    background: rgba(108, 117, 125, 0.1);
    border: 1px solid rgba(108, 117, 125, 0.3);
    color: #6c757d;
    padding: 8px 24px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
    margin-right: 12px;
}

.cancel-btn:hover {
    background: rgba(108, 117, 125, 0.2);
    border-color: rgba(108, 117, 125, 0.5);
    color: #5a6268;
}

.confirm-btn {
    background: linear-gradient(135deg, #007AFF, #5AC8FA);
    border: none;
    color: white;
    padding: 8px 24px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.confirm-btn:hover {
    background: linear-gradient(135deg, #0051D5, #32A3F7);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-actions {
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 12px;
  }
  
  .action-btn {
    height: 28px;
    padding: 0 8px;
    font-size: 11px;
    gap: 2px;
  }
}
</style>