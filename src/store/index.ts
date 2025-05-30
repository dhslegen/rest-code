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
            const contractRegex = /^((?:@(?:=|#|\$)?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:\?(?:#|\$)?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:%(?:\$)?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:>(?:=|\+|<)?(?:[A-Za-z][A-Za-z0-9]*)?))*$/
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
        },
        updateRcsContent(content: string) {
            try {
                // 清空当前的 domains 和 scripts
                this.domains.splice(0, this.domains.length)
                this.scripts.splice(0, this.scripts.length)
                this.errors = []

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
                        }
                    }
                }
            } catch (error) {
                console.error('解析脚本内容失败:', error)
            }
        },
        validateRcsContent(content: string): { isValid: boolean; errors: Array<{ line: number; message: string; severity: 'error' | 'warning' }> } {
            const errors: Array<{ line: number; message: string; severity: 'error' | 'warning' }> = []
            const lines = content.split('\n')
            const domains: { name: string; description: string }[] = []
            const scripts: any[] = []
            
            // 检查 operation + contract 的重复
            const operationContractMap: Map<string, number[]> = new Map()

            const domainNameRegex = /^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*$/
            const httpMethodRegex = /^(POST|GET|PATCH|DELETE)$/
            const apiPathRegex = /^\/(?:[^/\.]+\/)*[^/\.]+$/
            const operationRegex = /^[a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*$/
            const contractRegex = /^((?:@(?:=|#|\$)?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:\?(?:#|\$)?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:%(?:\$)?(?:[A-Za-z][A-Za-z0-9]*)?)|(?:>(?:=|\+|<)?(?:[A-Za-z][A-Za-z0-9]*)?))*$/

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim()
                const lineNumber = i + 1

                // 跳过空行和注释行
                if (line === '' || line.startsWith('#')) continue

                // 处理行尾注释
                const commentMatch = line.match(/\s+#/)
                if (commentMatch && commentMatch.index !== undefined) {
                    line = line.substring(0, commentMatch.index).trim()
                    if (line === '') continue
                }

                if (line.startsWith('/')) {
                    // 校验领域声明 - 分步校验，更友好的错误提示
                    const parts = line.split('/')
                    
                    if (parts.length < 3) {
                        errors.push({
                            line: lineNumber,
                            message: '领域声明格式错误：应为 /领域名称/领域描述',
                            severity: 'error'
                        })
                        continue
                    }
                    
                    if (parts.length > 3) {
                        errors.push({
                            line: lineNumber,
                            message: '领域声明格式错误：描述中不能包含 "/" 字符',
                            severity: 'error'
                        })
                        continue
                    }
                    
                    const domainName = parts[1]
                    const domainDesc = parts[2]
                    
                    // 检查领域名称
                    if (!domainName || domainName.trim() === '') {
                        errors.push({
                            line: lineNumber,
                            message: '领域名称不能为空',
                            severity: 'error'
                        })
                    } else if (!domainNameRegex.test(domainName)) {
                        errors.push({
                            line: lineNumber,
                            message: '领域名称不符合大写字母开头的驼峰命名法（如：User、OrderItem）',
                            severity: 'error'
                        })
                    }
                    
                    // 检查领域描述
                    if (!domainDesc || domainDesc.trim() === '') {
                        errors.push({
                            line: lineNumber,
                            message: '领域描述不能为空',
                            severity: 'error'
                        })
                    }
                    
                    // 如果基本格式正确，记录领域
                    if (domainName && domainDesc) {
                        domains.push({ name: domainName.trim(), description: domainDesc.trim() })
                    }
                } else {
                    // 校验脚本 - 分步校验，即使不满足完整正则也要检查各字段
                    const parts = line.split('.')
                    
                    if (parts.length < 6) {
                        errors.push({
                            line: lineNumber,
                            message: `API脚本格式错误：应为 领域名称.HTTP方法.API路径.操作名称.参数契约.描述（当前只有${parts.length}个部分）`,
                            severity: 'error'
                        })
                        continue
                    }
                    
                    if (parts.length > 6) {
                        errors.push({
                            line: lineNumber,
                            message: `API脚本格式错误：过多的点分隔符，描述中不能包含"."字符（当前有${parts.length}个部分）`,
                            severity: 'error'
                        })
                        continue
                    }
                    
                    const [domain, httpMethod, apiPath, operation, contract, description] = parts
                    
                    // 检查领域名称
                    if (!domain || domain.trim() === '') {
                        errors.push({
                            line: lineNumber,
                            message: '领域名称不能为空',
                            severity: 'error'
                        })
                    } else if (!domainNameRegex.test(domain)) {
                        errors.push({
                            line: lineNumber,
                            message: '领域名称不符合大写字母开头的驼峰命名法（如：User、OrderItem）',
                            severity: 'error'
                        })
                    } else {
                        // 检查领域是否已声明
                        const domainNames = domains.map(d => d.name)
                        if (!domainNames.includes(domain)) {
                            errors.push({
                                line: lineNumber,
                                message: `领域名称 ${domain} 未在领域声明中定义`,
                                severity: 'error'
                            })
                        }
                    }
                    
                    // 检查HTTP方法
                    if (!httpMethod || httpMethod.trim() === '') {
                        errors.push({
                            line: lineNumber,
                            message: 'HTTP请求方法不能为空',
                            severity: 'error'
                        })
                    } else if (!httpMethodRegex.test(httpMethod)) {
                        errors.push({
                            line: lineNumber,
                            message: 'HTTP请求方法必须为：POST、GET、PATCH、DELETE 中的一个',
                            severity: 'error'
                        })
                    }
                    
                    // 检查API路径（可以为空）
                    if (apiPath && apiPath.trim() !== '' && !apiPathRegex.test(apiPath)) {
                        errors.push({
                            line: lineNumber,
                            message: 'API路径格式错误，应为 /xx/xx 的形式（如：/{id}、/users/{id}/profile）',
                            severity: 'error'
                        })
                    }
                    
                    // 检查操作名称
                    if (!operation || operation.trim() === '') {
                        errors.push({
                            line: lineNumber,
                            message: '操作名称不能为空',
                            severity: 'error'
                        })
                    } else if (!operationRegex.test(operation)) {
                        errors.push({
                            line: lineNumber,
                            message: '操作名称不符合小写字母开头的驼峰命名法（如：create、getUserById）',
                            severity: 'error'
                        })
                    }
                    
                    // 检查参数契约（可以为空）
                    if (contract && contract.trim() !== '' && !contractRegex.test(contract)) {
                        errors.push({
                            line: lineNumber,
                            message: '参数契约格式错误，应为 @xxx?yyy%num%$str>zzz 的组合（如：@、?、%id、>）',
                            severity: 'error'
                        })
                    }
                    
                    // 检查描述
                    if (!description || description.trim() === '') {
                        errors.push({
                            line: lineNumber,
                            message: '描述不能为空',
                            severity: 'error'
                        })
                    }
                    
                    // 记录脚本用于重复检查
                    if (domain && operation && contract !== undefined) {
                        const script = {
                            domain: domain.trim(),
                            httpMethod: httpMethod.trim(),
                            apiPath: apiPath.trim(),
                            operation: operation.trim(),
                            contract: contract.trim(),
                            description: description.trim(),
                        }
                        
                        // 记录 operation + contract 组合
                        const key = `${script.domain}.${script.operation}.${script.contract}`
                        if (operationContractMap.has(key)) {
                            operationContractMap.get(key)!.push(lineNumber)
                        } else {
                            operationContractMap.set(key, [lineNumber])
                        }
                        
                        scripts.push(script)
                    }
                }
            }

            // 检查重复的脚本
            operationContractMap.forEach((lineNumbers, key) => {
                if (lineNumbers.length > 1) {
                    lineNumbers.forEach(lineNumber => {
                        errors.push({
                            line: lineNumber,
                            message: `脚本重复：${key}，与第 ${lineNumbers.filter(l => l !== lineNumber).join(', ')} 行重复`,
                            severity: 'error'
                        })
                    })
                }
            })

            return {
                isValid: errors.length === 0,
                errors
            }
        }
    },
})