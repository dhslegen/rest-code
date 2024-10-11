import { defineStore } from 'pinia'
import { Domain, Script, Template } from '../types'

export const useStore = defineStore('main', {
    state: () => ({
        domains: [] as Domain[],
        scripts: [] as Script[],
        templates: [] as Template[],
        loadedFilePath: '',
    }),
    actions: {
        parseRasFile(content: string) {
            // 解析文件内容，更新 domains 和 scripts
            console.log(content)
        },
        generateRasContent() {
            // 生成 rasContent
            return ''
        },
        validateScripts(): string[] {
            // 校验 scripts，返回错误信息数组
            if (this.scripts.length === 0) {
                return ['脚本不能为空']
            }
            return []
        },
        saveRasFile(filePath: string) {
            // 保存 rasContent 到指定文件
            console.log(filePath)
        },
        addScript(script: Script) {
            this.scripts.push(script)
        },
        removeScript(index: number) {
            this.scripts.splice(index, 1)
        },
        addDomain(domain: Domain) {
            this.domains.push(domain)
        },
        removeDomain(index: number) {
            this.domains.splice(index, 1)
        },
        updateDomain(index: number, domain: Domain) {
            this.domains[index] = domain
        }
    },
})