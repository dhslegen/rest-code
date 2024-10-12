import { defineStore } from 'pinia'
import { Domain, Script, Template } from '../types'
import { ElMessage } from 'element-plus'

export const useStore = defineStore('main', {
    state: () => ({
        domains: [] as Domain[],
        scripts: [] as Script[],
        templates: [] as Template[],
        loadedFilePath: '',
    }),
    actions: {
        parseRasFile(content: string) {
            // 清空当前的 domains 和 scripts
            this.domains = []
            this.scripts = []

            const lines = content.split('\n')
            const domainRegex = /^\/([A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*)\/([^\n\.]+)$/
            const scriptRegex = /^([A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*)\.(POST|GET|PUT|DELETE)\.(\/(?:[^/\.]+\/)*[^/\.]+)?\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)\.((?:(?:@=?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:\?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:#(?:[A-Za-z][A-Za-z0-9]*)?)|(?:\$(?:[A-Za-z][A-Za-z0-9]*)?)|(?:>(?:=|\+|<)?(?:[A-Za-z][A-Za-z0-9]*)?))*)\.([^\n\.]+)$/

            for (const line of lines) {
                if (line.startsWith('/')) {
                    // 解析领域声明
                    const match = line.match(domainRegex)
                    if (match) {
                        const domain: Domain = {
                            name: match[1],
                            description: match[2],
                        }
                        this.domains.push(domain)
                    } else {
                        ElMessage.error(`领域声明格式错误：${line}`)
                    }
                } else if (line.trim() !== '') {
                    // 解析脚本
                    const match = line.match(scriptRegex)
                    if (match) {
                        const script: Script = {
                            domain: match[1],
                            httpMethod: match[2],
                            apiPath: match[3] || '',
                            operation: match[4],
                            contract: match[5],
                            description: match[6],
                        }
                        this.scripts.push(script)
                    } else {
                        ElMessage.error(`脚本格式错误：${line}`)
                    }
                }
            }
        },
        generateRasContent() {
            let content = ''

            // 生成领域声明
            for (const domain of this.domains) {
                content += `/${domain.name}/${domain.description}\n`
            }

            // 生成脚本内容
            for (const script of this.scripts) {
                const line = `${script.domain}.${script.httpMethod}.${script.apiPath}.${script.operation}.${script.contract}.${script.description}`
                content += `${line}\n`
            }

            return content
        },
        validateScripts(): string[] {
            const errors: string[] = []
            const domainNames = this.domains.map(d => d.name)

            const domainRegex = /^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*$/
            const httpMethodRegex = /^(POST|GET|PUT|DELETE)$/
            const apiPathRegex = /^\/(?:[^/\.]+\/)*[^/\.]+$/
            const operationRegex = /^[a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*$/
            const contractRegex = /^((?:@=?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:\?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:#(?:[A-Za-z][A-Za-z0-9]*)?)|(?:\$(?:[A-Za-z][A-Za-z0-9]*)?)|(?:>(?:=|\+|<)?(?:[A-Za-z][A-Za-z0-9]*)?))*$/

            for (let i = 0; i < this.scripts.length; i++) {
                const script = this.scripts[i]
                const lineNumber = i + 1

                if (!domainRegex.test(script.domain)) {
                    errors.push(`第${lineNumber}行：领域名称不符合规则`)
                }

                if (!domainNames.includes(script.domain)) {
                    errors.push(`第${lineNumber}行：领域名称${script.domain}未在领域声明中定义`)
                }

                if (!httpMethodRegex.test(script.httpMethod)) {
                    errors.push(`第${lineNumber}行：HTTP请求方法不符合规则`)
                }

                if (script.apiPath && !apiPathRegex.test(script.apiPath)) {
                    errors.push(`第${lineNumber}行：API路径不符合规则`)
                }

                if (!operationRegex.test(script.operation)) {
                    errors.push(`第${lineNumber}行：操作名称不符合规则`)
                }

                if (!contractRegex.test(script.contract)) {
                    errors.push(`第${lineNumber}行：参数契约不符合规则`)
                }

                if (!script.description || script.description.trim() === '') {
                    errors.push(`第${lineNumber}行：描述不能为空`)
                }
            }

            return errors
        },
        async saveRasFile(filePath: string) {
            const content = this.generateRasContent()
            try {
                await window.ipcRenderer.saveFile(filePath, content)
                ElMessage.success('文件保存成功')
            } catch (error) {
                ElMessage.error('文件保存失败')
                console.error(error)
            }
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