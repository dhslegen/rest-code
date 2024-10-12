<template>
  <el-container style="height: 100vh; flex-direction: column;">
    <!-- 顶部区域 -->
    <el-header>
      <h2>Rest API 生成器</h2>
    </el-header>

    <!-- 第1行：文件加载区域和生成代码区域 -->
    <el-main>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span>文件加载</span>
            </template>
            <file-loader />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span>生成代码</span>
            </template>
            <code-generator />
          </el-card>
        </el-col>
      </el-row>
    </el-main>

    <!-- 第2行：领域编辑区域 -->
    <el-main>
      <el-card shadow="hover">
        <template #header>
          <span>领域编辑</span>
        </template>
        <domain-editor />
      </el-card>
    </el-main>

    <!-- 第3行：脚本编辑区域 -->
    <el-main>
      <el-card shadow="hover">
        <template #header>
          <span>脚本编辑</span>
        </template>
        <script-editor />
      </el-card>
    </el-main>

    <!-- 第4行：脚本查看区域 -->
    <el-main>
      <el-card shadow="hover">
        <template #header>
          <span>脚本查看</span>
        </template>
        <script-viewer />
      </el-card>
    </el-main>

    <!-- 底部区域 -->
    <el-footer>
      <p>© 2023 Rest Code Generator</p>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
// 引入组件
import FileLoader from './components/FileLoader.vue'
import DomainEditor from './components/DomainEditor.vue'
import ScriptEditor from './components/ScriptEditor.vue'
import ScriptViewer from './components/ScriptViewer.vue'
import CodeGenerator from './components/CodeGenerator.vue'
</script>

<style scoped>
el-main {
  padding: 10px;
}
</style>
