<template>
    <div class="script-editor">
        <div class="table-container">
            <el-table :data="scripts" ref="scriptTable" class="modern-table"
                :header-cell-style="{ backgroundColor: 'rgba(248, 249, 250, 0.8)', textAlign: 'center', color: '#2c3e50', fontWeight: '600' }"
                :show-header="true" :max-height="tableMaxHeight">
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
                                @focus="onContractFocus(row)" @blur="onContractBlur(row)"
                                class="table-input"></el-input>
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
                            <el-icon>
                                <Delete />
                            </el-icon>
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <div class="script-actions">
            <el-button class="crud-btn" @click="oneClickCRUD">
                <el-icon>
                    <Operation />
                </el-icon>
                一键 CRUD
            </el-button>
            <el-button class="add-btn" @click="addScript">
                <el-icon>
                    <Plus />
                </el-icon>
                新增脚本
            </el-button>
        </div>
    </div>
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
const tableMaxHeight = ref<number>(300) // 默认最大高度

// 定义emit事件
const emit = defineEmits<{
    showCrudDialog: []
}>()

const tips = {
    '@': `<strong>@ - 请求体参数（RequestBody）</strong><br />
          用于定义 HTTP 请求体中的 JSON 数据结构：<br /><br />
          <strong>VO 对象：</strong><br />
          • <code>@</code> → <code>@RequestBody @Valid UserReqVo reqVo</code> (单个业务对象)<br />
          • <code>@业务名</code> → <code>@RequestBody @Valid UserUpdateReqVo reqVo</code> (指定业务场景)<br />
          • <code>@=</code> → <code>@RequestBody @Valid List&lt;UserReqVo&gt; reqVos</code> (对象列表)<br />
          • <code>@=业务名</code> → <code>@RequestBody @Valid List&lt;UserUpdateReqVo&gt; reqVos</code> (带业务后缀)<br /><br />
          <strong>单标量：</strong><br />
          • <code>@#</code> → <code>@RequestBody Long id</code> (默认参数名 id)<br />
          • <code>@$</code> → <code>@RequestBody String code</code> (默认参数名 code)<br />
          • <code>@!</code> → <code>@RequestBody Boolean value</code> (默认参数名 value)<br />
          • <code>@~</code> → <code>@RequestBody BigDecimal value</code> (默认参数名 value)<br /><br />
          <strong>标量数组：</strong><br />
          • <code>@=#</code> → <code>@RequestBody @Valid List&lt;Long&gt; ids</code> (默认参数名 ids)<br />
          • <code>@=$</code> → <code>@RequestBody @Valid List&lt;String&gt; codes</code> (默认参数名 codes)<br />
          • <code>@=!</code> → <code>@RequestBody @Valid List&lt;Boolean&gt; flags</code> (默认参数名 flags)<br />
          • <code>@=~</code> → <code>@RequestBody @Valid List&lt;BigDecimal&gt; amounts</code> (默认参数名 amounts)<br /><br />
          <em>以上标量类型均支持自定义参数名，如 <code>@#myId</code>、<code>@=#userIds</code></em>`,

    '?': `<strong>? - 查询参数（Query Parameters）</strong><br />
          用于定义 HTTP 请求的查询条件：<br /><br />
          <strong>对象查询：</strong><br />
          • <code>?</code> → <code>@ParameterObject UserQueryVo queryVo</code> (标准查询对象)<br />
          • <code>?业务名</code> → <code>@ParameterObject UserSimpleQueryVo queryVo</code> (指定业务场景)<br /><br />
          <strong>标量查询：</strong><br />
          • <code>?#</code> → <code>@RequestParam("number") Long number</code> (默认数值参数)<br />
          • <code>?\$</code> → <code>@RequestParam("code") String code</code> (默认字符串参数)<br />
          • <code>?!</code> → <code>@RequestParam("flag") Boolean flag</code> (默认布尔参数)<br />
          • <code>?~</code> → <code>@RequestParam("amount") BigDecimal amount</code> (默认精确数值参数)<br /><br />
          <strong>标量数组查询：</strong><br />
          • <code>?=#</code> → <code>@RequestParam("ids") List&lt;Long&gt; ids</code><br />
          • <code>?=\$</code> → <code>@RequestParam("codes") List&lt;String&gt; codes</code><br />
          • <code>?=!</code> → <code>@RequestParam("flags") List&lt;Boolean&gt; flags</code><br />
          • <code>?=~</code> → <code>@RequestParam("amounts") List&lt;BigDecimal&gt; amounts</code><br /><br />
          <strong>文件查询：</strong><br />
          • <code>?*</code> → <code>@RequestParam("file") MultipartFile file</code> (默认文件参数)<br /><br />
          <em>以上标量类型均支持自定义参数名，如 <code>?#userId</code>、<code>?=#userIds</code></em>`,

    '%': `<strong>% - 路径参数（PathVariable）</strong><br />
          用于定义 URL 路径中的变量：<br /><br />
          <strong>数值型路径参数：</strong><br />
          • <code>%</code> → <code>@PathVariable long id</code> (默认主键ID)<br />
          • <code>%参数名</code> → <code>@PathVariable long userId</code> (自定义数值参数)<br /><br />
          <strong>字符串型路径参数：</strong><br />
          • <code>%$</code> → <code>@PathVariable String code</code> (默认编码参数)<br />
          • <code>%$参数名</code> → <code>@PathVariable String orgCode</code> (自定义字符串参数)`,

    '>': `<strong>&gt; - 响应类型（Response Type）</strong><br />
          用于定义 HTTP 响应体的数据结构：<br /><br />
          <strong>VO 对象响应：</strong><br />
          • <code>&gt;</code> → <code>Result&lt;UserRespVo&gt;</code> (单个业务对象)<br />
          • <code>&gt;业务名</code> → <code>Result&lt;UserSimpleRespVo&gt;</code> (指定业务场景)<br />
          • <code>&gt;=</code> → <code>Result&lt;List&lt;UserRespVo&gt;&gt;</code> (对象列表)<br />
          • <code>&gt;+</code> → <code>Result&lt;Page&lt;UserRespVo&gt;&gt;</code> (自动添加分页查询参数)<br />
          • <code>&gt;&lt;</code> → <code>Result&lt;TreeNode&lt;Long, UserTreeVo&gt;&gt;</code> (树形结构)<br /><br />
          <strong>标量响应：</strong><br />
          • <code>&gt;#</code> → <code>Result&lt;Long&gt;</code> (返回数值)<br />
          • <code>&gt;$</code> → <code>Result&lt;String&gt;</code> (返回字符串)<br />
          • <code>&gt;!</code> → <code>Result&lt;Boolean&gt;</code> (返回布尔值)<br />
          • <code>&gt;~</code> → <code>Result&lt;BigDecimal&gt;</code> (返回精确数值)<br /><br />
          <strong>标量列表响应：</strong><br />
          • <code>&gt;=#</code> → <code>Result&lt;List&lt;Long&gt;&gt;</code><br />
          • <code>&gt;=$</code> → <code>Result&lt;List&lt;String&gt;&gt;</code><br />
          • <code>&gt;=!</code> → <code>Result&lt;List&lt;Boolean&gt;&gt;</code><br />
          • <code>&gt;=~</code> → <code>Result&lt;List&lt;BigDecimal&gt;&gt;</code><br /><br />
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
    emit('showCrudDialog')
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

// 暴露高度管理方法
const setTemporaryHeight = (height: number) => {
    // 动态调整表格的最大高度
    tableMaxHeight.value = height

}

const restoreOriginalHeight = () => {
    // 恢复表格的默认最大高度
    tableMaxHeight.value = 300
}

// 暴露方法给父组件使用
defineExpose({
    setTemporaryHeight,
    restoreOriginalHeight
})
</script>

<style scoped>
.script-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 自定义滚动条样式 */
.script-editor::-webkit-scrollbar {
    width: 8px;
}

.script-editor::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
}

.script-editor::-webkit-scrollbar-thumb {
    background: rgba(0, 122, 255, 0.3);
    border-radius: 4px;
    transition: background 0.3s ease;
}

.script-editor::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 122, 255, 0.5);
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

.script-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 0;
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
</style>