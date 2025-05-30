<template>
  <el-container style="height: 90vh; flex-direction: column; background-color: #f0f2f5;">
    <!-- 主内容区域 -->
    <el-main style="padding: 0; overflow: auto;">
      <!-- 第1行：文件加载区域和生成代码区域 -->
      <el-collapse v-model="activeCollapseOperation" accordion>
        <el-collapse-item name="1">
          <template #title><el-alert center title="操作区域" style="background-color:#1565c0;height: 30px;" type="success"
              effect="dark" :closable=false /></template>
          <el-row :gutter="20">
            <el-col :span="10">
              <el-card shadow="hover">
                <template #header>
                  <span>文件加载</span>
                </template>
                <file-loader />
              </el-card>
            </el-col>
            <el-col :span="14">
              <el-card shadow="hover">
                <template #header>
                  <span>生成代码</span>
                </template>
                <code-generator :script-editor-ref="scriptViewerRef" />
              </el-card>
            </el-col>
          </el-row>
        </el-collapse-item>

        <!-- 第2行：领域设计区域 -->
        <el-collapse-item name="2">
          <template #title><el-alert center title="领域设计" style="background-color:#6c5ce7;height: 30px;" type="success"
              effect="dark" :closable=false /></template>
          <domain-editor />
        </el-collapse-item>

        <!-- 第3行：脚本设计区域 -->
        <el-collapse-item name="3">
          <template #title><el-alert center title="脚本设计" style="background-color:#009688;height: 30px;" type="success"
              effect="dark" :closable=false /></template>
          <script-editor />
        </el-collapse-item>
      </el-collapse>
    </el-main>

    <!-- 脚本编辑器区域 -->
    <el-footer style="height: 208px; padding: 0;">
      <script-viewer ref="scriptViewerRef" />
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import FileLoader from './components/FileLoader.vue'
import DomainEditor from './components/DomainEditor.vue'
import ScriptEditor from './components/ScriptEditor.vue'
import ScriptViewer from './components/ScriptViewer.vue'
import CodeGenerator from './components/CodeGenerator.vue'
import { ref } from 'vue'

const activeCollapseOperation = ref(['3'])
const scriptViewerRef = ref()
</script>

<style scoped>
el-main {
  padding: 10px;
  overflow: auto;
}
</style>