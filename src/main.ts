import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'highlight.js/styles/default.css';
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { useStore } from './store';
import { ElMessage } from 'element-plus';

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
app.use(ElementPlus, { size: 'small' })
app.use(createPinia())
app.mount('#app')

// 获取 Pinia 的 store
const store = useStore();

// 监听文件打开事件
window.api.onOpenFile((_event, filePath) => {
    console.log('Received file path:', filePath);
    // 读取文件内容
    const content = window.api.readFile(filePath);
    if (content) {
        store.parseRcsFile(content);
        store.loadedFilePath = filePath;
        // 显示成功消息
        ElMessage.success('文件加载成功');
    } else {
        ElMessage.error('文件读取失败');
    }
});