<template>
  <el-container style="height: 100vh;">
    <!-- 顶部区域 -->
    <el-header>
      <h2>Rest API 生成器</h2>
    </el-header>

    <!-- 中间内容区域 -->
    <el-container>
      <!-- 左侧编辑区域 -->
      <el-aside width="300px">
        <file-loader />
        <domain-editor />
        <code-generator />
      </el-aside>

      <!-- 中间脚本编辑区域 -->
      <el-main>
        <script-editor />
      </el-main>

      <!-- 右侧脚本查看区域 -->
      <el-aside width="400px">
        <script-viewer />
      </el-aside>
    </el-container>

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
