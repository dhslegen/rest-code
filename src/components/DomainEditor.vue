<template>
    <div class="domain-editor">
        <div class="table-container">
            <el-table :data="domains" ref="domainTable" class="modern-table" :max-height="300"
                :header-cell-style="{ backgroundColor: 'rgba(248, 249, 250, 0.8)', textAlign: 'center', color: '#2c3e50', fontWeight: '600' }"
                :show-header="true">
                <el-table-column prop="name" label="领域名称" width="180" align="center">
                    <template #default="{ row }">
                        <el-input v-model="row.name" placeholder="领域名称" class="table-input" />
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="领域描述" align="center">
                    <template #default="{ row }">
                        <el-input v-model="row.description" placeholder="领域描述" class="table-input" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center">
                    <template #default="{ $index }">
                        <el-button class="delete-btn" @click="deleteDomain($index)">
                            <el-icon>
                                <Delete />
                            </el-icon>
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <div class="action-container">
            <el-button class="add-btn" @click="addDomain">
                <el-icon>
                    <Plus />
                </el-icon>
                新增领域
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useStore } from '../store/'
import { ref, nextTick } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
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
        // store.setScrollToBottom(true)
    })
}

const deleteDomain = (index: number) => {
    store.removeDomain(index)
}
</script>

<style scoped>
.domain-editor {
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
    border: 1px solid rgba(52, 199, 89, 0.1);
    backdrop-filter: blur(15px);
    box-shadow: 0 8px 32px rgba(52, 199, 89, 0.08);
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
    background: rgba(52, 199, 89, 0.08);
}

:deep(.modern-table td) {
    border-color: rgba(0, 0, 0, 0.05);
    padding: 12px 8px;
}

:deep(.modern-table th) {
    border-color: rgba(0, 0, 0, 0.05);
    padding: 16px 8px;
}

:deep(.table-input) {
    border: none;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 8px;
}

:deep(.table-input .el-input__wrapper) {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    transition: all 0.3s ease;
}

:deep(.table-input .el-input__wrapper:hover) {
    border-color: rgba(52, 199, 89, 0.3);
    box-shadow: 0 2px 8px rgba(52, 199, 89, 0.1);
}

:deep(.table-input .el-input__wrapper.is-focus) {
    border-color: #34C759;
    box-shadow: 0 0 0 2px rgba(52, 199, 89, 0.1);
}

.delete-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 4px;
}

.delete-btn:hover {
    background: linear-gradient(135deg, #ee5a52, #e74c3c);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.action-container {
    display: flex;
    justify-content: center;
    padding: 0;
}

.add-btn {
    background: linear-gradient(135deg, #34C759, #30D158);
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
    background: linear-gradient(135deg, #30D158, #32D74B);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .delete-btn {
        padding: 4px 8px;
        font-size: 11px;
    }

    .add-btn {
        padding: 8px 16px;
        font-size: 13px;
    }

    :deep(.modern-table td) {
        padding: 8px 4px;
    }

    :deep(.modern-table th) {
        padding: 12px 4px;
    }
}
</style>