export interface Domain {
    name: string
    description: string
}

export interface Script {
    template: any
    domain: string
    httpMethod: string
    apiPath: string
    operation: string
    contract: string
    description: string
}

export interface Template {
    name: string
    [key: string]: any
}
