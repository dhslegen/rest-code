export interface Template {
    name: string;
    domain: string;
    httpMethod: string;
    apiPath: string;
    operation: string;
    contract: string;
    description: string;
}

// 定义内置模板
export const templates: Template[] = [
    {
        "name": "POST-创建",
        "domain": "{领域名称}",
        "httpMethod": "POST",
        "apiPath": '',
        "operation": "create",
        "contract": "@",
        "description": "创建{领域描述}"
    },
    {
        "name": "POST-批量创建",
        "domain": "{领域名称}",
        "httpMethod": "POST",
        "apiPath": "/batch",
        "operation": "batchCreate",
        "contract": "@=",
        "description": "批量创建{领域描述}"
    },
    {
        "name": "DELETE-删除",
        "domain": "{领域名称}",
        "httpMethod": "DELETE",
        "apiPath": "/{id}",
        "operation": "delete",
        "contract": "#id",
        "description": "删除{领域描述}"
    },
    {
        "name": "DELETE-批量删除",
        "domain": "{领域名称}",
        "httpMethod": "DELETE",
        "apiPath": '',
        "operation": "batchDelete",
        "contract": "@ids",
        "description": "批量删除{领域描述}"
    },
    {
        "name": "PUT-编辑",
        "domain": "{领域名称}",
        "httpMethod": "PUT",
        "apiPath": "/{id}",
        "operation": "update",
        "contract": "#id@update",
        "description": "编辑{领域描述}"
    },
    {
        "name": "PUT-批量编辑",
        "domain": "{领域名称}",
        "httpMethod": "PUT",
        "apiPath": '',
        "operation": "batchUpdate",
        "contract": "@=update",
        "description": "批量编辑{领域描述}"
    },
    {
        "name": "PUT-自定义操作",
        "domain": "{领域名称}",
        "httpMethod": "PUT",
        "apiPath": "/{id}/xxx",
        "operation": "xxx",
        "contract": "#id@xxx",
        "description": "xxx{领域描述}"
    },
    {
        "name": "PUT-批量自定义操作",
        "domain": "{领域名称}",
        "httpMethod": "PUT",
        "apiPath": "/batchXxx",
        "operation": "batchXxx",
        "contract": "@=xxx",
        "description": "批量Xxx{领域描述}"
    },
    {
        "name": "PUT-自定义操作，无详情",
        "domain": "{领域名称}",
        "httpMethod": "PUT",
        "apiPath": "/{id}/xxx",
        "operation": "xxx",
        "contract": "#id",
        "description": "xxx{领域描述}"
    },
    {
        "name": "PUT-批量自定义操作，无详情",
        "domain": "{领域名称}",
        "httpMethod": "PUT",
        "apiPath": "/batchXxx",
        "operation": "batchXxx",
        "contract": "@ids",
        "description": "批量Xxx{领域描述}"
    },
    {
        "name": "GET-获取单个",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": "/{id}",
        "operation": "get",
        "contract": "#id>",
        "description": "获取{领域描述}"
    },
    {
        "name": "GET-获取单个简单信息",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": "/{id}/simple",
        "operation": "getSimple",
        "contract": "#id>simple",
        "description": "获取简单{领域描述}"
    },
    {
        "name": "GET-获取单个详情，包含关联的复杂信息",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": "/{id}/detail",
        "operation": "getDetail",
        "contract": "#id>detail",
        "description": "获取{领域描述}详情"
    },
    {
        "name": "GET-获取单个自定义信息",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": "/{id}/xxx",
        "operation": "getXxx",
        "contract": "#id>xxx",
        "description": "获取{领域描述}xxx信息"
    },
    {
        "name": "GET-获取列表",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": '',
        "operation": "list",
        "contract": "?>=",
        "description": "获取{领域描述}列表"
    },
    {
        "name": "GET-获取简单列表",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": "/simple",
        "operation": "listSimple",
        "contract": "?>=simple",
        "description": "获取{领域描述}简单列表"
    },
    {
        "name": "GET-获取自定义列表",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": "/xxx",
        "operation": "listXxx",
        "contract": "?>=xxx",
        "description": "获取{领域描述}xxx列表"
    },
    {
        "name": "GET-获取分页",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": '',
        "operation": "page",
        "contract": "?>+",
        "description": "获取{领域描述}分页"
    },
    {
        "name": "GET-获取简单分页",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": "/simple",
        "operation": "pageSimple",
        "contract": "?>+simple",
        "description": "获取{领域描述}简单分页"
    },
    {
        "name": "GET-获取自定义分页",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": "/xxx",
        "operation": "pageXxx",
        "contract": "?>+xxx",
        "description": "获取{领域描述}xxx分页"
    },
    {
        "name": "GET-获取树",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": "/tree",
        "operation": "tree",
        "contract": "?><",
        "description": "获取{领域描述}树"
    },
    {
        "name": "GET-获取简单树",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": "/simple/tree",
        "operation": "treeSimple",
        "contract": "?><simple",
        "description": "获取{领域描述}简单树"
    },
    {
        "name": "GET-获取自定义树",
        "domain": "{领域名称}",
        "httpMethod": "GET",
        "apiPath": "/xxx/tree",
        "operation": "treeXxx",
        "contract": "?><xxx",
        "description": "获取{领域描述}自定义树"
    },
];

export function getControllerTemplate(): string {
    return `package {{basePackage}}.controller;

{{#imports}}
{{{.}}}
{{/imports}}

/**
 * {{description}}开放接口
 *
 * @author RestCodeGenerator
 * @since {{date}}
 */
{{#classAnnotations}}
{{{.}}}
{{/classAnnotations}}
public class {{domainName}}Controller {

    /**
     * 服务对象
     */
    @Resource
    private {{domainName}}Service {{domainNameLower}}Service;


    {{#methods}}
    /**
     * {{{description}}}
     *
     * @apiNote {{{apiNote}}}
     */
    @Operation(summary = "{{{description}}}")
    @{{httpMethod}}Mapping("{{{apiPath}}}")
    public {{#hasResponseType}}{{{responseType}}}{{/hasResponseType}}{{^hasResponseType}}Result<Void>{{/hasResponseType}} {{operationName}}({{{parameters}}}) {
        {{{methodBody}}}
    }

    {{/methods}}
}`
}

export function getControllerBasicTemplate(): string {
    return `package {{basePackage}}.controller;

/**
 * {{description}}开放接口
 *
 * @since {{date}}
 */
{{#classAnnotations}}
{{{.}}}
{{/classAnnotations}}
public class {{domainName}}Controller {

    /**
     * 服务对象
     */
    @Resource
    private {{domainName}}Service {{domainNameLower}}Service;


}
`;
}

export function getControllerMethodsTemplate(): string {
    return `{{#methods}}
    /**
     * {{{description}}}
     *
     * @apiNote {{{apiNote}}}
     */
    @Operation(summary = "{{{description}}}")
    @{{httpMethod}}Mapping("{{{apiPath}}}")
    public {{#hasResponseType}}{{{responseType}}}{{/hasResponseType}}{{^hasResponseType}}Result<Void>{{/hasResponseType}} {{operationName}}({{{parameters}}}) {
        {{{methodBody}}}
    }

    {{/methods}}`;
}
