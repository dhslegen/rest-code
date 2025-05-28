import { defineStore } from 'pinia'
import { Domain, Script, Template } from '../types'
import { templates } from '../templates'
import { ElMessage } from 'element-plus'
import { domainRegex, scriptRegex } from '../utils/regex'

export const useStore = defineStore('main', {
    state: () => ({
        domains: [] as Domain[],
        scripts: [] as Script[],
        templates: templates as Template[],
        loadedFilePath: '',
        scrollToBottom: false,
        errors: [] as string[],
        showErrorPopover: false,
        triggerErrorDisplay: false,
    }),
    actions: {
        parseRcsFile(content: string) {
            // 清空当前的 domains 和 scripts
            this.domains.splice(0, this.domains.length)
            this.scripts.splice(0, this.scripts.length)

            const lines = content.split('\n')

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim()

                // 跳过空行
                if (line === '') continue

                // 跳过以 # 开头的注释行
                if (line.startsWith('#')) continue

                // 处理行尾注释，寻找前面有空格的 # 作为注释开始
                // 注释符号必须前面有空格或tab，以避免误截取参数契约中的 # 符号
                const commentMatch = line.match(/\s+#/)
                if (commentMatch && commentMatch.index !== undefined) {
                    line = line.substring(0, commentMatch.index).trim()
                    // 如果去掉注释后变成空行，则跳过
                    if (line === '') continue
                }

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
                        ElMessage.error(`第${i + 1}行：领域声明格式错误：${line}`)
                    }
                } else {
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
                            template: '',
                            tooltipContent: '',
                            showTooltip: false,
                        }
                        // 尝试匹配模板
                        const matchedTemplate = this.templates.find(t =>
                            t.httpMethod === script.httpMethod &&
                            t.operation === script.operation
                        )
                        script.template = matchedTemplate ? matchedTemplate.name : ''
                        this.scripts.push(script)
                    } else {
                        ElMessage.error(`第${i + 1}行：API脚本格式错误：${line}`)
                    }
                }
            }
        },
        generateRcsContent() {
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
        validateScripts(): boolean {
            this.errors = []
            const errors = this.errors
            const domainNames = this.domains.map(d => d.name)
            // 检查 operation + contract 的重复
            const operationContractMap: Map<string, number[]> = new Map()

            const domainRegex = /^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*$/
            const httpMethodRegex = /^(POST|GET|PATCH|DELETE)$/
            const apiPathRegex = /^\/(?:[^/\.]+\/)*[^/\.]+$/
            const operationRegex = /^[a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*$/
            const contractRegex = /^((?:@(?:=|#|\$)?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:\?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:%(?:\$)?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:>(?:=|\+|<)?(?:[A-Za-z][A-Za-z0-9]*)?))*$/
            // 校验领域声明
            for (let i = 0; i < this.domains.length; i++) {
                const domain = this.domains[i]
                const lineNumber = i + 1 // 领域声明在最前面

                if (!domainRegex.test(domain.name)) {
                    errors.push(`第${lineNumber}行：【领域名称】不符合大写字母开头的驼峰命名法`)
                }

                if (!domain.description || domain.description.trim() === '') {
                    errors.push(`第${lineNumber}行：【领域描述】不能为空`)
                }
            }

            // 校验脚本
            const scriptLineOffset = this.domains.length
            for (let i = 0; i < this.scripts.length; i++) {
                const script = this.scripts[i]
                const lineNumber = scriptLineOffset + i + 1

                // 记录 operation + contract 组合
                const key = `${script.domain}.${script.operation}.${script.contract}`
                if (operationContractMap.has(key)) {
                    operationContractMap.get(key)!.push(lineNumber)
                } else {
                    operationContractMap.set(key, [lineNumber])
                }

                if (!domainRegex.test(script.domain)) {
                    errors.push(`第${lineNumber}行：【领域名称】不符合 大写字母开头的驼峰命名法`)
                }

                if (!domainNames.includes(script.domain)) {
                    errors.push(`第${lineNumber}行：【领域名称】${script.domain}未在领域声明中定义`)
                }

                if (!httpMethodRegex.test(script.httpMethod)) {
                    errors.push(`第${lineNumber}行：【HTTP请求方法】不符合 POST、GET、PATCH、DELETE 中的一个`)
                }

                if (script.apiPath && !apiPathRegex.test(script.apiPath)) {
                    errors.push(`第${lineNumber}行：【API路径】不符合 /xx/xx 的写法`)
                }

                if (!operationRegex.test(script.operation)) {
                    errors.push(`第${lineNumber}行：【操作名称】不符合 小写字母开头的驼峰命名法`)
                }

                if (!contractRegex.test(script.contract)) {
                    errors.push(`第${lineNumber}行：【参数契约】不符合  @xxx?yyy%num%$str>zzz 的随机组合`)
                }

                if (!script.description || script.description.trim() === '') {
                    errors.push(`第${lineNumber}行：【描述】非空字符串`)
                }
            }

            // 添加重复的错误信息
            operationContractMap.forEach((lineNumbers, key) => {
                if (lineNumbers.length > 1) {
                    errors.push(`脚本重复：${key}，行号：${lineNumbers.join(', ')}`)
                }
            })

            return errors.length === 0
        },
        showValidationErrors() {
            this.showErrorPopover = true
        },
        validateAndShowErrors(): boolean {
            const isValid = this.validateScripts()
            if (!isValid) {
                this.showErrorPopover = true
                this.triggerErrorDisplay = true
            } else {
                this.showErrorPopover = false
            }
            return isValid
        },
        saveRcsFile(filePath: string) {
            const content = this.generateRcsContent()
            try {
                window.api.writeFile(filePath, content)
                ElMessage.success('保存成功')
            } catch (error) {
                ElMessage.error('保存失败')
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
        },
        setScrollToBottom(value: boolean) {
            this.scrollToBottom = value;
        }
    },
})