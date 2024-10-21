export interface Domain {
    name: string
    description: string
}

export interface Script {
    domain: string
    httpMethod: string
    apiPath: string
    operation: string
    contract: string
    description: string
    template: string;
}

export interface Template {
    name: string;
    domain: string;
    httpMethod: string;
    apiPath: string | undefined | null;
    operation: string;
    contract: string;
    description: string;
}

export interface ApiMethod {
    domainName: string
    httpMethod: string
    apiPath: string
    operationName: string
    parameterContract: string
    description: string
    apiNote: string
    imports: Set<string>
    importsService: Set<string>
    importsServiceImpl: Set<string>
    parameters: string[]
    parametersPure: string[]
    parameterNames: string[]
    responseType: string
    hasResponseType: boolean
    returnType: string
    voNames: string[]
    methodBody: string
    methodBodyServiceImpl: string
}

export interface Config {
    frameworkBasePackage: string
    outputPath: string
    basePackage: string
    mode: 'overwrite' | 'incremental'
}