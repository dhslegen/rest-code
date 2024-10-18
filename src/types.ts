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
    parameters: string[]
    responseType: string
    hasResponseType: boolean
    returnType: string
}

export interface Config {
    frameworkPackagePrefix: string
    outputPath: string
    basePackage: string
    mode: 'overwrite' | 'incremental'
}