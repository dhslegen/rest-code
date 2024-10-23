<template>
  <!-- 错误信息展示 -->
  <el-popover v-model="showErrorPopover" placement="top" width="600" :visible="showErrorPopover">
    <div v-html="formattedErrors" style="height: 300px;overflow: auto;" @click.stop></div>
    <template #reference>
      <el-alert ref="errorButton" center title="脚本查看" style="background-color:#c41d7f; height: 20px;" type="success"
        effect="dark" :closable=false @click.stop />
    </template>
  </el-popover>
  <div class="script-viewer">
    <div class="code-container">
      <div class="line-numbers">
        <pre>{{ lineNumbers }}</pre>
      </div>
      <div class="code-content" @click="showErrorPopover = false">
        <pre>{{ rasContent }}</pre>
      </div>
    </div>
  </div>
  <div style="text-align: center; margin-top: 10px;">
    <el-button type="primary" @click.stop="showHelpDialog = true">帮助</el-button>
    <el-button type="primary" @click.stop="validateScripts"
      style="background-color: #c41d7f;border-color: #c41d7f;">校验</el-button>
    <el-button type="primary" @click.stop="saveScripts"
      style="background-color: #c41d7f;border-color: #c41d7f;">保存</el-button>
  </div>

  <el-dialog title="帮助" v-model="showHelpDialog" width="80%">
    <div v-html="helpContentHtml" style="height: 510px;  overflow: auto;"></div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="showHelpDialog = false">关闭</el-button>
    </span>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '../store/'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const store = useStore()
const rasContent = computed(() => {
  return store.generateRasContent()
})

const lineNumbers = ref('')
const errors = ref<string[]>([])
const showErrorPopover = ref(false)
const formattedErrors = ref('')
const showHelpDialog = ref(false)
const helpContent = `
\`Rest Code\` 是基于 \`electron+vite+vue3\` 开发的用于自动化生成 REST API 后端代码的桌面应用程序。用户可以通过界面进行可视化编辑以及配置一些参数，来生成紧凑的 Rest API 脚本文件。脚本的后缀名为\`.ras\`，意为 \`Rest API Script\`，并根据这个脚本生成对应的 \`Spring Boot Rest Controller\` 代码。

### Ras 文件格式

1. 文件的头部为若干行\`Domain声明\`，\`声明元素\`以 \`/\` 分割。\`Domain声明\`用于和\`内置模版\`配合，以辅助用户快速输入\`API脚本\`。
2. 文件的主体为若干行\`API脚本\`，\`脚本元素\`以 \`.\` 分割。\`API脚本\`用于生成\`Spring Boot Rest Controller\`代码。

#### Domain声明格式

**格式**：\`领域名称/领域描述\`，例如：\`User/用户\`。

#### API脚本格式

**格式**：\`领域名称.HTTP请求方法.API路径（可为空）.操作名称（方法名称）.参数契约（可为空）.描述\`，例如：\`User.POST..create.@.新增用户\`

参数契约格式为:\`@xxx?yyy#num$str>zzz\`其中 \`@、?、#、$、>\` 是特殊的前缀符，各片段含义如下：

1. \`@\` 前缀符表示 \`@RequestBody\` 请求参数，即 Json 请求体，\`@\` 表示单个对象，\`@=\` 表示对象列表，前缀固定为 \`Do\`（领域名称如： \`User\`） ，后缀固定为 \`ReqVo\`，中间填充 \`xxx\` 表业务含义，用于区分多个对象，解析结果如：\`@RequestBody @Valid UserUpdateReqVo updateReqVo\`、\`@RequestBody @Valid List<UserReqVo> reqVos\`；
2. \`?\` 前缀符表示 \`Query\` 请求参数，前缀固定为 \`Do\` ，后缀固定为 \`QueryVo\`，中间填充 \`yyy\` 表业务含义，用于区分多个对象，解析结果如：\`UserQueryVo\`；
3. \`#\` 前缀符表示 \`@PathVariable\` 数值型路径请求参数，\`num\` 为路径参数名称，解析结果如：\`@PathVariable("id") Long id\`；
4. \`$\` 前缀符表示 \`@PathVariable\` 字符串型路径请求参数，\`str\` 为路径参数名称，解析结果如：\`@PathVariable("orgCode") String orgCode\`；
5. \`>\` 前缀符表示 \`@ResponseBody\` 响应报文，\`>\` 表示单个对象，\`>=\` 表示对象列表，\`><\` 表示树形结构，\`>+\` 表示分页对象，前缀固定为 \`Do\` ，后缀固定为 \`RespVo\`，中间填充 \`zzz\` 表业务含义，用于区分多个对象，解析结果如：\`@ResponseBody Result<UserSimpleRespVo>\`、\`@ResponseBody Result<List<UserSimpleRespVo>>\`，不存在\`>\` 前缀符时，解析为\`@ResponseBody Result<Void>\`；
6. 所有片段都是可选的，可以有 0 个或多个，也没有顺序要求。\`xxx、yyy、num、str、zzz\` 都是业务含义，可以为空字符串，不为空时要符合驼峰命名法，且尽量不要重复。
`

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang }).value +
          '</code></pre>';
      } catch (_) { }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
})

// 自定义 <code> 行内代码渲染规则
md.renderer.rules.code_inline = (tokens, idx) => {
  return `<code class="hljs-code">${md.utils.escapeHtml(tokens[idx].content)}</code>`
}


const helpContentHtml = computed(() => md.render(helpContent))

import type { ComponentPublicInstance } from 'vue'

const errorButton = ref<ComponentPublicInstance | null>(null)

watch(rasContent, (newValue) => {
  const lines = newValue.split('\n')
  lineNumbers.value = lines.map((_, index) => index + 1).join('\n')
})

const validateScripts = async () => {
  errors.value = store.validateScripts()
  if (errors.value.length > 0) {
    ElMessage.error(`校验失败`)
    formattedErrors.value = errors.value.map(error => `<div style="color: #d50000; font-size: 12px" >${error}</div>`).join('')
    showErrorPopover.value = true
    await nextTick()
    if (errorButton.value) {
      const errorBtn = (errorButton.value as ComponentPublicInstance).$el
      errorBtn.click()
    }
  } else {
    ElMessage.success('校验通过')
    showErrorPopover.value = false
  }
}

const saveScripts = async () => {
  await validateScripts()
  if (errors.value.length > 0) {
    ElMessage.error('校验失败，无法保存')
    return
  }
  if (store.loadedFilePath) {
    store.saveRasFile(store.loadedFilePath)
  } else {
    const filePath = await window.api.showSaveDialog()
    if (filePath) {
      store.saveRasFile(filePath)
    }
  }
}
onMounted(() => {
  document.addEventListener('click', closePopover)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closePopover)
})

const closePopover = () => {
  showErrorPopover.value = false
}
</script>

<style scoped>
.script-viewer {
  height: 100%;
}

.code-container {
  display: flex;
  overflow: auto;
  height: 190px;
}

.line-numbers,
.code-content {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
}

.line-numbers {
  background-color: #f0f0f0;
  padding: 5px;
  user-select: none;
  text-align: right;
  border-right: 1px solid #ccc;
  color: #999;
  flex-shrink: 0;
}

.code-content {
  flex: 1;
  padding: 5px;
}

.line-numbers pre,
.code-content pre {
  margin: 0;
}
</style>