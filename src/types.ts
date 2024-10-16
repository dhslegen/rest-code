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
    template: Template | null;  
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
